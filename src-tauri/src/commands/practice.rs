use super::*;

// ─── Question loading ─────────────────────────────────────────────────────────

/// Load choices for a question_id in random order.
fn load_choices(conn: &Connection, question_id: i64) -> Result<Vec<Choice>, String> {
    let mut stmt = conn
        .prepare("SELECT id, text FROM choices WHERE question_id = ?1 ORDER BY RANDOM()")
        .map_err(|e| e.to_string())?;
    let rows: Vec<Choice> = stmt
        .query_map(params![question_id], |r| {
            Ok(Choice {
                id: r.get(0)?,
                text: r.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    Ok(rows)
}

/// Build a Question from a row (id, stem, domain, difficulty, multi_select).
pub(super) fn row_to_question(
    conn: &Connection,
    id: i64,
    stem: String,
    domain: String,
    difficulty: String,
    multi_select: i64,
) -> Result<Question, String> {
    let choices = load_choices(conn, id)?;

    // Subtopic and the learner's stats live on the same question, so fetch
    // them together. Exam loading builds 100 Questions; this removes one
    // round-trip per question compared with two separate scalar queries.
    let (subtopic, times_seen, times_correct): (String, i64, i64) = conn
        .query_row(
            "SELECT COALESCE(NULLIF(TRIM(q.subtopic), ''), 'Uncategorized'),
                    COALESCE(s.times_seen, 0),
                    COALESCE(s.times_correct, 0)
             FROM questions q
             LEFT JOIN user_question_stats s ON s.question_id = q.id
             WHERE q.id = ?1",
            params![id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )
        .unwrap_or_else(|_| ("Uncategorized".to_string(), 0, 0));

    let accuracy = if times_seen > 0 {
        (times_correct as f64 / times_seen as f64) * 100.0
    } else {
        0.0
    };

    Ok(Question {
        id,
        stem,
        domain,
        difficulty,
        multi_select: multi_select != 0,
        subtopic,
        accuracy,
        attempts: times_seen,
        choices,
    })
}

#[tauri::command]
pub fn get_random_question(
    mode: String,
    subtopic: Option<String>,
    domain: Option<String>,
    db: State<Db>,
) -> Result<Option<Question>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let subtopic = subtopic.as_deref().map(str::trim).filter(|s| !s.is_empty());
    let domain = domain.as_deref().map(str::trim).filter(|s| !s.is_empty());
    get_random_question_conn(&mode, subtopic, domain, &conn)
}

pub fn get_random_question_conn(
    mode: &str,
    subtopic: Option<&str>,
    domain: Option<&str>,
    conn: &Connection,
) -> Result<Option<Question>, String> {
    // A topic drill narrows the rotation to one domain/subtopic instead of
    // scanning the whole bank, so it short-circuits the normal paths.
    if subtopic.is_some() || domain.is_some() {
        return drill_question_conn(mode, subtopic, domain, conn);
    }

    // "weak" ignores difficulty tiers: it drills the questions you actually get
    // wrong, then the ones you have not seen yet.
    if mode == "weak" {
        let mut stmt = conn
            .prepare(
                "SELECT q.id, q.stem, q.domain, q.difficulty, COALESCE(q.multi_select, 0)
                 FROM questions q
                 LEFT JOIN user_question_stats s ON s.question_id = q.id
                  ORDER BY
                    CASE
                      WHEN s.times_correct * 10 < s.times_seen * 7 THEN 0
                      WHEN s.times_seen IS NULL OR s.times_seen = 0 THEN 1
                      ELSE 2
                    END ASC,
                    COALESCE(CAST(s.times_correct AS REAL) / NULLIF(s.times_seen, 0), 1.0) ASC,
                    RANDOM()
                  LIMIT 1",
            )
            .map_err(|e| e.to_string())?;

        let row = stmt
            .query_row([], |r| {
                Ok((
                    r.get::<_, i64>(0)?,
                    r.get::<_, String>(1)?,
                    r.get::<_, String>(2)?,
                    r.get::<_, String>(3)?,
                    r.get::<_, i64>(4)?,
                ))
            })
            .optional()
            .map_err(|e| e.to_string())?;

        let Some((id, stem, domain, difficulty, multi_select)) = row else {
            return Ok(None);
        };
        return row_to_question(conn, id, stem, domain, difficulty, multi_select).map(Some);
    }

    // Spaced-repetition review mode: surface the most overdue question
    // (next_review_at ascending; never-seen questions sort first at 0).
    if mode == "review" {
        let mut stmt = conn.prepare(
            "SELECT q.id, q.stem, q.domain, q.difficulty, COALESCE(q.multi_select, 0)
             FROM questions q
             LEFT JOIN user_question_stats s ON s.question_id = q.id
             ORDER BY COALESCE(s.next_review_at, 0) ASC, RANDOM()
             LIMIT 1",
        ).map_err(|e| e.to_string())?;
        let row = stmt
            .query_row([], |r| {
                Ok((
                    r.get::<_, i64>(0)?,
                    r.get::<_, String>(1)?,
                    r.get::<_, String>(2)?,
                    r.get::<_, String>(3)?,
                    r.get::<_, i64>(4)?,
                ))
            })
            .optional()
            .map_err(|e| e.to_string())?;
        let Some((id, stem, domain, difficulty, multi_select)) = row else {
            return Ok(None);
        };
        return row_to_question(conn, id, stem, domain, difficulty, multi_select).map(Some);
    }

    let difficulty = match mode {
        "easy" => "easy",
        "medium" => "medium",
        "hard" => "hard",
        "impossible" => "hard",
        _ => "medium",
    };

    let total_difficulty_questions: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM questions WHERE difficulty = ?1",
            params![difficulty],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    if total_difficulty_questions == 0 {
        return Ok(None);
    }

    let now = now_secs();
    let cutoff = now - 72 * 3600;

    let answered_distinct: i64 = conn
        .query_row(
            "SELECT COUNT(DISTINCT a.question_id) FROM answers a JOIN questions q ON q.id = a.question_id WHERE q.difficulty = ?1",
            params![difficulty],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let coverage = answered_distinct as f64 / total_difficulty_questions as f64;

    // Task 1: select multi_select column too
    let selected_row: Option<(i64, String, String, String, i64)> = if mode == "exam" || coverage >= 0.70 {
        let mut stmt = conn
            .prepare(
                "SELECT id, stem, domain, difficulty, COALESCE(multi_select, 0) FROM questions
                 WHERE difficulty = ?1 ORDER BY RANDOM() LIMIT 1",
            )
            .map_err(|e| e.to_string())?;

        stmt.query_row(params![difficulty], |r| {
            Ok((
                r.get::<_, i64>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, String>(3)?,
                r.get::<_, i64>(4)?,
            ))
        })
        .optional()
        .map_err(|e| e.to_string())?
    } else {
        let mut stmt = conn
            .prepare(
                "SELECT q.id, q.stem, q.domain, q.difficulty, COALESCE(q.multi_select, 0)
                 FROM questions q
                 LEFT JOIN (
                   SELECT question_id, MAX(answered_at) AS last_at
                   FROM answers
                   GROUP BY question_id
                 ) a ON a.question_id = q.id
                 WHERE q.difficulty = ?1
                   AND (a.last_at IS NULL OR a.last_at < ?2)
                 ORDER BY COALESCE(a.last_at, 0) ASC, RANDOM()
                 LIMIT 1",
            )
            .map_err(|e| e.to_string())?;

        let first_try = stmt
            .query_row(params![difficulty, cutoff], |r| {
                Ok((
                    r.get::<_, i64>(0)?,
                    r.get::<_, String>(1)?,
                    r.get::<_, String>(2)?,
                    r.get::<_, String>(3)?,
                    r.get::<_, i64>(4)?,
                ))
            })
            .optional()
            .map_err(|e| e.to_string())?;

        if first_try.is_some() {
            first_try
        } else {
            let mut fstmt = conn
                .prepare(
                    "SELECT q.id, q.stem, q.domain, q.difficulty, COALESCE(q.multi_select, 0)
                     FROM questions q
                     JOIN (
                       SELECT question_id, MAX(answered_at) AS last_at
                       FROM answers
                       GROUP BY question_id
                     ) a ON a.question_id = q.id
                     WHERE q.difficulty = ?1
                     ORDER BY a.last_at ASC
                     LIMIT 1",
                )
                .map_err(|e| e.to_string())?;

            fstmt
                .query_row(params![difficulty], |r| {
                    Ok((
                        r.get::<_, i64>(0)?,
                        r.get::<_, String>(1)?,
                        r.get::<_, String>(2)?,
                        r.get::<_, String>(3)?,
                        r.get::<_, i64>(4)?,
                    ))
                })
                .optional()
                .map_err(|e| e.to_string())?
        }
    };

    let Some((id, stem, domain, difficulty, multi_select)) = selected_row else {
        return Ok(None);
    };

    row_to_question(conn, id, stem, domain, difficulty, multi_select).map(Some)
}

/// Picks a question from one domain/subtopic. Difficulty tiers still apply for
/// the graded modes, but "weak" and "exam" span every difficulty so a drill is
/// never empty just because a topic has no hard questions yet.
fn drill_question_conn(
    mode: &str,
    subtopic: Option<&str>,
    domain: Option<&str>,
    conn: &Connection,
) -> Result<Option<Question>, String> {
    let mut sql = String::from(
        "SELECT q.id, q.stem, q.domain, q.difficulty, COALESCE(q.multi_select, 0)
         FROM questions q
         LEFT JOIN user_question_stats s ON s.question_id = q.id
         WHERE 1 = 1",
    );
    let mut args: Vec<String> = Vec::new();

    if let Some(d) = domain {
        sql.push_str(" AND q.domain = ?");
        args.push(d.to_string());
    }
    if let Some(s) = subtopic {
        // Matches the grouping key used by get_subtopic_stats.
        sql.push_str(" AND COALESCE(NULLIF(TRIM(q.subtopic), ''), 'Uncategorized') = ?");
        args.push(s.to_string());
    }
    if mode != "weak" && mode != "exam" && mode != "review" {
        let difficulty = match mode {
            "easy" => "easy",
            "medium" => "medium",
            "hard" => "hard",
            "impossible" => "hard",
            _ => "medium",
        };
        sql.push_str(" AND q.difficulty = ?");
        args.push(difficulty.to_string());
    }

    if mode == "review" {
        sql.push_str(" ORDER BY COALESCE(s.next_review_at, 0) ASC, RANDOM() LIMIT 1");
    } else {
        sql.push_str(
            " ORDER BY
                CASE
                  WHEN s.times_correct * 10 < s.times_seen * 7 THEN 0
                  WHEN s.times_seen IS NULL OR s.times_seen = 0 THEN 1
                  ELSE 2
                END ASC,
                COALESCE(CAST(s.times_correct AS REAL) / NULLIF(s.times_seen, 0), 1.0) ASC,
                RANDOM()
              LIMIT 1",
        );
    }

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let row = stmt
        .query_row(params_from_iter(args.iter()), |r| {
            Ok((
                r.get::<_, i64>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, String>(3)?,
                r.get::<_, i64>(4)?,
            ))
        })
        .optional()
        .map_err(|e| e.to_string())?;

    let Some((id, stem, q_domain, difficulty, multi_select)) = row else {
        return Ok(None);
    };
    row_to_question(conn, id, stem, q_domain, difficulty, multi_select).map(Some)
}

// ─── Submit answer ────────────────────────────────────────────────────────────

#[tauri::command]
pub fn submit_answer(payload: SubmitPayload, db: State<Db>) -> Result<SubmitResult, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    submit_answer_conn(&payload, &conn)
}

pub fn submit_answer_conn(payload: &SubmitPayload, conn: &Connection) -> Result<SubmitResult, String> {
    with_immediate_tx_string(conn, |conn| {
    // Task 1: check multi_select; for single-answer questions reject multi-selection
    let multi_select: i64 = conn
        .query_row(
            "SELECT COALESCE(multi_select, 0) FROM questions WHERE id = ?1",
            params![payload.question_id],
            |r| r.get(0),
        )
        .unwrap_or(0);

    if multi_select == 0 && payload.choice_ids.len() > 1 {
        return Err("Single-answer question: only one choice is allowed.".to_string());
    }

    let mut stmt = conn
        .prepare("SELECT id FROM choices WHERE question_id = ?1 AND is_correct = 1")
        .map_err(|e| e.to_string())?;
    let correct_ids: Vec<i64> = stmt
        .query_map(params![payload.question_id], |r| r.get(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let is_correct = !correct_ids.is_empty()
        && correct_ids.len() == payload.choice_ids.len()
        && correct_ids.iter().all(|id| payload.choice_ids.contains(id));

    let explanation: String = conn
        .query_row(
            "SELECT COALESCE(explanation, '') FROM questions WHERE id = ?1",
            params![payload.question_id],
            |r| r.get(0),
        )
        .unwrap_or_default();

    let now = now_secs();
    let selected_json = serde_json::to_string(&payload.choice_ids).unwrap_or("[]".to_string());

    conn.execute(
        "INSERT INTO answers (question_id, correct, answered_at, selected_choice_ids) VALUES (?1, ?2, ?3, ?4)",
        params![payload.question_id, if is_correct { 1 } else { 0 }, now, selected_json],
    )
    .map_err(|e| e.to_string())?;
    record_question_stat(conn, payload.question_id, is_correct, now)?;

    Ok(SubmitResult {
        correct: is_correct,
        explanation,
        correct_choice_ids: correct_ids,
    })
    })
}

// ─── Quick Quiz ─────────────────────────────────────────────────────────────────
/// Select 4 questions from the weakest subtopics (lowest accuracy) and 1 random question,
/// for a total of 5 questions with instant feedback.
#[tauri::command]
pub fn get_quick_quiz_questions(db: State<Db>) -> Result<Vec<Question>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    // 1. Get subtopic stats ordered by accuracy (weakest first)
    let mut stmt = conn.prepare(
        "SELECT q.domain,
                COALESCE(NULLIF(TRIM(q.subtopic), ''), 'Uncategorized') AS sub,
                COUNT(*) AS total,
                COUNT(s.question_id) AS seen,
                COALESCE(SUM(s.times_seen), 0) AS attempts,
                COALESCE(SUM(s.times_correct), 0) AS correct
         FROM questions q
         LEFT JOIN user_question_stats s ON s.question_id = q.id
         GROUP BY q.domain, sub
         ORDER BY q.domain ASC, sub ASC",
    )
    .map_err(|e| e.to_string())?;

    let stats_rows: Vec<SubtopicStat> = stmt
        .query_map([], |r| {
            let attempts: i64 = r.get(4)?;
            let correct: i64 = r.get(5)?;
            Ok(SubtopicStat {
                domain: r.get(0)?,
                subtopic: r.get(1)?,
                total: r.get(2)?,
                seen: r.get(3)?,
                attempts,
                correct,
                accuracy: if attempts > 0 {
                    (correct as f64 / attempts as f64) * 1000.0
                } else {
                    0.0
                },
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .map(|mut s| {
            s.accuracy = (s.accuracy / 10.0).round();
            s
        })
        .collect();

    // 2. Sort subtopics by accuracy (weakest first)
    let mut sorted_stats = stats_rows;
    sorted_stats.sort_by(|a, b| a.accuracy.partial_cmp(&b.accuracy).unwrap_or(std::cmp::Ordering::Equal));

    // 3. Build a pool of question IDs grouped by subtopic, prioritizing weakest
    let mut weak_question_ids: Vec<i64> = Vec::new();
    let mut all_question_ids: Vec<i64> = Vec::new();

    // First, collect question IDs from the weakest subtopics (up to 4 questions)
    let weak_count = 4; // 70% of 5 = 3.5, rounded up to 4
    let weak_stats = &sorted_stats[..weak_count.min(sorted_stats.len())];

    for stat in weak_stats {
        let mut qstmt = conn
            .prepare(
                "SELECT q.id FROM questions q
                 LEFT JOIN user_question_stats s ON s.question_id = q.id
                 WHERE COALESCE(NULLIF(TRIM(q.subtopic), ''), 'Uncategorized') = ?1
                 ORDER BY s.times_correct * 10 < s.times_seen * 7 ASC, RANDOM()
                 LIMIT 1",
            )
            .map_err(|e| e.to_string())?;
        let row = qstmt
            .query_row(params![stat.subtopic], |r| r.get(0))
            .optional()
            .map_err(|e| e.to_string())?;
        if let Some(qid) = row {
            weak_question_ids.push(qid);
        }
        // Also add to general pool
        let mut qstmt2 = conn
            .prepare("SELECT id FROM questions WHERE COALESCE(NULLIF(TRIM(subtopic), ''), 'Uncategorized') = ?1")
            .map_err(|e| e.to_string())?;
        let rows: Vec<i64> = qstmt2
            .query_map(params![stat.subtopic], |r| r.get(0))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        all_question_ids.extend(rows);
    }

    // 4. Add 1 random question from the remaining pool (30%)
    let mut rng = rand::thread_rng();

    // Shuffle and pick random from questions not already selected
    let mut remaining: Vec<i64> = all_question_ids
        .into_iter()
        .filter(|&id| !weak_question_ids.contains(&id))
        .collect();
    remaining.shuffle(&mut rng);

    let random_question_id = remaining
        .first()
        .copied()
        .or_else(|| {
            // Fallback: pick any random question from the bank
            let mut rstmt = match conn.prepare("SELECT id FROM questions ORDER BY RANDOM() LIMIT 1") {
                Ok(s) => s,
                Err(_) => return None,
            };
            rstmt.query_row([], |r| r.get(0)).optional().ok().flatten()
        });

    if let Some(qid) = random_question_id {
        // Make sure it's not already in weak_question_ids
        if !weak_question_ids.contains(&qid) {
            weak_question_ids.push(qid);
        }
    }

    // If we don't have 5 questions yet, fill from the general pool
    while weak_question_ids.len() < 5 {
        let mut rstmt = conn
            .prepare("SELECT id FROM questions ORDER BY RANDOM() LIMIT 1")
            .map_err(|e| e.to_string())?;
        let qid = match rstmt.query_row([], |r| r.get(0)).optional().ok().flatten() {
            Some(q) => q,
            None => break,
        };
        if !weak_question_ids.contains(&qid) {
            weak_question_ids.push(qid);
        }
    }

    // 5. Load all 5 questions with their choices
    let mut questions = Vec::new();
    let mut seen_ids = std::collections::HashSet::new();
    for &qid in &weak_question_ids {
        if seen_ids.contains(&qid) {
            continue;
        }
        seen_ids.insert(qid);

        let choices = load_choices(&*conn, qid)?;
        let mut stem_query = conn.prepare("SELECT q.stem, q.domain, q.difficulty, q.multi_select, q.subtopic, COALESCE(s.times_seen, 0), COALESCE(s.times_correct, 0) FROM questions q LEFT JOIN user_question_stats s ON s.question_id = q.id WHERE q.id = ?1").map_err(|e| e.to_string())?;
        let row = stem_query.query_row(params![qid], |r| {
            Ok((
                r.get::<_, String>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, i64>(3)?,
                r.get::<_, String>(4)?,
                r.get::<_, i64>(5)?,
                r.get::<_, i64>(6)?,
            ))
        }).map_err(|e| e.to_string())?;

        let (stem, domain, difficulty, multi_select, subtopic, times_seen, times_correct) = row;
        let accuracy = if times_seen > 0 {
            (times_correct as f64 / times_seen as f64) * 100.0
        } else {
            0.0
        };
        questions.push(Question {
            id: qid,
            stem,
            domain,
            difficulty,
            multi_select: multi_select != 0,
            subtopic,
            accuracy,
            attempts: times_seen,
            choices,
        });
        if questions.len() >= 5 {
            break;
        }
    }

    Ok(questions)
}
