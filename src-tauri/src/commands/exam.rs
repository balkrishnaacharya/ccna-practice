use super::practice::row_to_question;
use super::*;

// ─── Exam questions ───────────────────────────────────────────────────────────

#[tauri::command]
/// Connection-level exam question selection, usable by tests and commands alike.
pub fn get_exam_questions_conn(conn: &Connection) -> Result<Vec<Question>, String> {
    // Blueprint counts total 100. The bundled bank has only 12 switching topics,
    // so the two-per-topic cap shifts one seat to network infrastructure (±1).
    let targets = [
        ("network_infra", 25usize),
        ("switching", 25),
        ("ip_routing", 20),
        ("services_security", 20),
        ("ai_ops", 10),
    ];
    let mut domain_candidates = Vec::new();
    for (domain, target) in targets {
        let mut stmt = conn.prepare(
            "SELECT q.id, q.stem, q.domain, q.difficulty, COALESCE(q.multi_select, 0),
                    COALESCE(q.subtopic, ''),
                    (CASE WHEN COALESCE((
                        SELECT a.correct FROM answers a WHERE a.question_id = q.id
                        ORDER BY a.answered_at DESC, a.id DESC LIMIT 1
                    ), 0) = 1 THEN 1.0 ELSE 2.0 END) *
                    (CASE WHEN (
                        SELECT COUNT(*) FROM (
                            SELECT a.correct FROM answers a
                            JOIN questions topic_q ON topic_q.id = a.question_id
                            WHERE topic_q.domain = q.domain
                              AND COALESCE(topic_q.subtopic, '') = COALESCE(q.subtopic, '')
                            ORDER BY a.answered_at DESC, a.id DESC LIMIT 2
                        ) recent WHERE recent.correct = 1
                    ) = 2 THEN CASE q.difficulty
                        WHEN 'hard' THEN 4.0 WHEN 'medium' THEN 2.0 ELSE 0.5 END
                     ELSE 1.0 END)
             FROM questions q WHERE q.domain = ?1",
        ).map_err(|e| e.to_string())?;
        let candidates: Vec<ExamCandidate> = stmt.query_map(params![domain], |row| {
            Ok(ExamCandidate {
                id: row.get(0)?,
                stem: row.get(1)?,
                domain: row.get(2)?,
                difficulty: row.get(3)?,
                multi_select: row.get(4)?,
                subtopic: row.get(5)?,
                adaptive_weight: row.get(6)?,
            })
        }).map_err(|e| e.to_string())?.filter_map(Result::ok).collect();
        domain_candidates.push((domain, target, candidates, Vec::new()));
    }

    domain_candidates.sort_by_key(|(domain, _, _, _)| match *domain {
        "switching" => 0,
        "ai_ops" => 1,
        "services_security" => 2,
        "ip_routing" => 3,
        "network_infra" => 4,
        _ => 5,
    });

    let mut rng = rand::thread_rng();
    let mut topic_counts = HashMap::<String, usize>::new();
    for (_, target, candidates, selected) in &mut domain_candidates {
        *selected = weighted_exam_sample(candidates, *target, &mut rng, &mut topic_counts);
    }
    let mut total_selected: usize = domain_candidates.iter().map(|(_, _, _, selected)| selected.len()).sum();

    // Refill any quota lost to a cross-domain subtopic collision. Only use
    // the blueprint's ±1 allowance after every domain has had a chance to
    // recover its target count.
    loop {
        if total_selected >= 100 { break; }
        let mut progressed = false;
        for (_, target, candidates, selected) in &mut domain_candidates {
            if total_selected >= 100 { break; }
            if selected.len() < *target {
                let additions = weighted_exam_sample(candidates, 1, &mut rng, &mut topic_counts);
                total_selected += additions.len();
                progressed |= !additions.is_empty();
                selected.extend(additions);
            }
        }
        if !progressed {
            for (_, target, candidates, selected) in &mut domain_candidates {
                if total_selected >= 100 { break; }
                if selected.len() < *target + 1 {
                    let additions = weighted_exam_sample(candidates, 1, &mut rng, &mut topic_counts);
                    total_selected += additions.len();
                    progressed |= !additions.is_empty();
                    selected.extend(additions);
                }
            }
        }
        if !progressed { break; }
    }

    let mut all_questions = Vec::with_capacity(100);
    for (_, _, _, selected) in domain_candidates {
        for candidate in selected {
            all_questions.push(row_to_question(
                conn, candidate.id, candidate.stem, candidate.domain,
                candidate.difficulty, candidate.multi_select,
            )?);
        }
    }
    all_questions.shuffle(&mut rng);
    Ok(all_questions)
}

#[tauri::command]
pub fn get_exam_questions(db: State<Db>) -> Result<Vec<Question>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    get_exam_questions_conn(&conn)
}

// ─── Submit exam ──────────────────────────────────────────────────────────────

/// Connection-level exam submission, usable by tests and commands alike.
pub fn submit_exam_conn(
    payload: &ExamSubmitPayload,
    conn: &Connection,
    now: i64,
) -> Result<ExamResult, String> {
    with_immediate_tx_string(conn, |conn| {
    let mut total_correct = 0i64;
    let total_questions = payload.answers.len() as i64;
    let mut reviews: Vec<QuestionReviewResult> = Vec::new();
    let mut domain_map: HashMap<String, (i64, i64)> = HashMap::new();

    let started_at = now - payload.time_spent_seconds;

    // Insert session first to get session_id (Task 3)
    conn.execute(
        "INSERT INTO sessions (mode, started_at, ended_at, score, total, duration_sec) VALUES ('exam', ?1, ?2, 0, ?3, ?4)",
        params![started_at, now, total_questions, payload.time_spent_seconds],
    )
    .map_err(|e| e.to_string())?;
    let session_id = conn.last_insert_rowid();

    for item in &payload.answers {
        let (stem, domain, subtopic, explanation): (String, String, String, String) = conn
            .query_row(
                "SELECT stem, domain, COALESCE(subtopic,''), COALESCE(explanation, '') FROM questions WHERE id = ?1",
                params![item.question_id],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
            )
            .map_err(|e| e.to_string())?;

        let mut cstmt = conn
            .prepare("SELECT id, text, is_correct FROM choices WHERE question_id = ?1 ORDER BY RANDOM()")
            .map_err(|e| e.to_string())?;

        let choices: Vec<ChoiceWithCorrectness> = cstmt
            .query_map(params![item.question_id], |r| {
                Ok(ChoiceWithCorrectness {
                    id: r.get(0)?,
                    text: r.get(1)?,
                    is_correct: r.get::<_, i64>(2)? == 1,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        let correct_choice_ids: Vec<i64> = choices
            .iter()
            .filter(|c| c.is_correct)
            .map(|c| c.id)
            .collect();

        let is_correct = !correct_choice_ids.is_empty()
            && correct_choice_ids.len() == item.choice_ids.len()
            && correct_choice_ids
                .iter()
                .all(|id| item.choice_ids.contains(id));

        if is_correct {
            total_correct += 1;
        }

        let entry = domain_map.entry(domain.clone()).or_insert((0, 0));
        entry.0 += 1;
        if is_correct {
            entry.1 += 1;
        }

        let selected_json = serde_json::to_string(&item.choice_ids).unwrap_or("[]".to_string());

        // Task 3: link answer to session_id, store selected_choice_ids
        conn.execute(
            "INSERT INTO answers (session_id, question_id, correct, answered_at, selected_choice_ids) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![session_id, item.question_id, if is_correct { 1 } else { 0 }, now, selected_json],
        )
        .map_err(|e| e.to_string())?;
        record_question_stat(conn, item.question_id, is_correct, now)?;

        reviews.push(QuestionReviewResult {
            question_id: item.question_id,
            stem,
            domain,
            subtopic,
            explanation,
            user_choice_ids: item.choice_ids.clone(),
            correct_choice_ids,
            choices,
            is_correct,
        });
    }

    let percentage = if total_questions > 0 {
        ((total_correct as f64 / total_questions as f64) * 1000.0).round() / 10.0
    } else {
        0.0
    };

    let scaled_score = (300.0 + (700.0 * (percentage / 100.0))).round() as i64;
    let passed = scaled_score >= 825;

    // Update session with final score
    conn.execute(
        "UPDATE sessions SET score = ?1, ended_at = ?2 WHERE id = ?3",
        params![total_correct, now, session_id],
    )
    .map_err(|e| e.to_string())?;

    let mut domain_scores: Vec<DomainScore> = domain_map
        .into_iter()
        .map(|(domain, (total, correct))| {
            let pct = if total > 0 {
                ((correct as f64 / total as f64) * 1000.0).round() / 10.0
            } else {
                0.0
            };
            DomainScore {
                domain,
                total,
                correct,
                percentage: pct,
            }
        })
        .collect();
    domain_scores.sort_by(|a, b| a.domain.cmp(&b.domain));

    Ok(ExamResult {
        session_id,
        total_questions,
        score: total_correct,
        percentage,
        scaled_score,
        passed,
        time_spent_seconds: payload.time_spent_seconds,
        domain_scores,
        reviews,
    })
    })
}

#[tauri::command]
pub fn submit_exam(payload: ExamSubmitPayload, db: State<Db>) -> Result<ExamResult, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let now = now_secs();
    submit_exam_conn(&payload, &conn, now)
}

// ─── Exam History (Task 3) ────────────────────────────────────────────────────

fn make_session_summary(
    id: i64,
    mode: String,
    started_at: i64,
    ended_at: i64,
    score: i64,
    total: i64,
    duration_sec: i64,
) -> SessionSummary {
    let percentage = if total > 0 {
        ((score as f64 / total as f64) * 1000.0).round() / 10.0
    } else {
        0.0
    };
    let scaled_score = (300.0 + (700.0 * (percentage / 100.0))).round() as i64;
    SessionSummary {
        id,
        mode,
        started_at,
        ended_at,
        score,
        total,
        duration_sec,
        percentage,
        scaled_score,
        passed: scaled_score >= 825,
    }
}

#[tauri::command]
pub fn get_exam_history(db: State<Db>) -> Result<Vec<SessionSummary>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, mode, started_at, COALESCE(ended_at, started_at), score, total, COALESCE(duration_sec, 0)
             FROM sessions ORDER BY started_at DESC LIMIT 100",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |r| {
            Ok((
                r.get::<_, i64>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, i64>(2)?,
                r.get::<_, i64>(3)?,
                r.get::<_, i64>(4)?,
                r.get::<_, i64>(5)?,
                r.get::<_, i64>(6)?,
            ))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .map(|(id, mode, started_at, ended_at, score, total, duration_sec)| {
            make_session_summary(id, mode, started_at, ended_at, score, total, duration_sec)
        })
        .collect();

    Ok(rows)
}

#[tauri::command]
pub fn get_session_detail(session_id: i64, db: State<Db>) -> Result<SessionDetail, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let (mode, started_at, ended_at, score, total, duration_sec): (String, i64, i64, i64, i64, i64) = conn
        .query_row(
            "SELECT mode, started_at, COALESCE(ended_at, started_at), score, total, COALESCE(duration_sec, 0) FROM sessions WHERE id = ?1",
            params![session_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?, r.get(5)?)),
        )
        .map_err(|e| format!("Session {} not found: {}", session_id, e))?;

    let session = make_session_summary(session_id, mode, started_at, ended_at, score, total, duration_sec);

    // Load all answers for this session
    let mut astmt = conn
        .prepare(
            "SELECT a.question_id, COALESCE(a.selected_choice_ids, '[]'), a.correct
             FROM answers a WHERE a.session_id = ?1",
        )
        .map_err(|e| e.to_string())?;

    let answer_rows: Vec<(i64, String, i64)> = astmt
        .query_map(params![session_id], |r| {
            Ok((r.get(0)?, r.get(1)?, r.get(2)?))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let mut reviews: Vec<QuestionReviewResult> = Vec::new();
    let mut domain_map: HashMap<String, (i64, i64)> = HashMap::new();

    for (question_id, selected_json, is_correct_int) in answer_rows {
        let user_choice_ids: Vec<i64> =
            serde_json::from_str(&selected_json).unwrap_or_default();

        let (stem, domain, subtopic, explanation): (String, String, String, String) = conn
            .query_row(
                "SELECT stem, domain, COALESCE(subtopic,''), COALESCE(explanation, '') FROM questions WHERE id = ?1",
                params![question_id],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
            )
            .unwrap_or_else(|_| (
                format!("Question {} (deleted)", question_id),
                "unknown".to_string(),
                String::new(),
                String::new(),
            ));

        let mut cstmt = conn
            .prepare("SELECT id, text, is_correct FROM choices WHERE question_id = ?1 ORDER BY id")
            .map_err(|e| e.to_string())?;

        let choices: Vec<ChoiceWithCorrectness> = cstmt
            .query_map(params![question_id], |r| {
                Ok(ChoiceWithCorrectness {
                    id: r.get(0)?,
                    text: r.get(1)?,
                    is_correct: r.get::<_, i64>(2)? == 1,
                })
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();

        let correct_choice_ids: Vec<i64> = choices
            .iter()
            .filter(|c| c.is_correct)
            .map(|c| c.id)
            .collect();

        let is_correct = is_correct_int == 1;

        let entry = domain_map.entry(domain.clone()).or_insert((0, 0));
        entry.0 += 1;
        if is_correct {
            entry.1 += 1;
        }

        reviews.push(QuestionReviewResult {
            question_id,
            stem,
            domain,
            subtopic,
            explanation,
            user_choice_ids,
            correct_choice_ids,
            choices,
            is_correct,
        });
    }

    let mut domain_scores: Vec<DomainScore> = domain_map
        .into_iter()
        .map(|(domain, (total, correct))| {
            let pct = if total > 0 {
                ((correct as f64 / total as f64) * 1000.0).round() / 10.0
            } else {
                0.0
            };
            DomainScore {
                domain,
                total,
                correct,
                percentage: pct,
            }
        })
        .collect();
    domain_scores.sort_by(|a, b| a.domain.cmp(&b.domain));

    Ok(SessionDetail {
        session,
        domain_scores,
        reviews,
    })
}

// ─── Exam drafts (checkpoint / resume) ──────────────────────────────────────

#[derive(Deserialize)]
pub struct SaveExamDraftPayload {
    pub questions_json: String,
    pub answers_json: String,
    pub seconds_remaining: i64,
}

#[derive(Serialize)]
pub struct ExamDraft {
    pub questions_json: String,
    pub answers_json: String,
    pub seconds_remaining: i64,
    pub updated_at: i64,
}

pub fn save_exam_draft_conn(
    payload: &SaveExamDraftPayload,
    conn: &Connection,
    now: i64,
) -> Result<(), String> {
    with_immediate_tx_string(conn, |conn| {
        conn.execute(
            "INSERT INTO exam_drafts (id, questions_json, answers_json, seconds_remaining, updated_at)
             VALUES (1, ?1, ?2, ?3, ?4)
             ON CONFLICT(id) DO UPDATE SET
               questions_json = excluded.questions_json,
               answers_json = excluded.answers_json,
               seconds_remaining = excluded.seconds_remaining,
               updated_at = excluded.updated_at",
            params![
                payload.questions_json,
                payload.answers_json,
                payload.seconds_remaining,
                now
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[tauri::command]
pub fn save_exam_draft(payload: SaveExamDraftPayload, db: State<Db>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    save_exam_draft_conn(&payload, &conn, now_secs())
}

pub fn get_exam_draft_conn_for_test(conn: &Connection) -> Result<Option<ExamDraft>, String> {
    conn.query_row(
        "SELECT questions_json, answers_json, seconds_remaining, updated_at
         FROM exam_drafts WHERE id = 1",
        [],
        |r| {
            Ok(ExamDraft {
                questions_json: r.get(0)?,
                answers_json: r.get(1)?,
                seconds_remaining: r.get(2)?,
                updated_at: r.get(3)?,
            })
        },
    )
    .optional()
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_exam_draft(db: State<Db>) -> Result<Option<ExamDraft>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    get_exam_draft_conn_for_test(&conn)
}

pub fn clear_exam_draft_conn_for_test(conn: &Connection) -> Result<(), String> {
    with_immediate_tx_string(conn, |conn| {
        conn.execute("DELETE FROM exam_drafts WHERE id = 1", [])
            .map_err(|e| e.to_string())?;
        Ok(())
    })
}

#[tauri::command]
pub fn clear_exam_draft(db: State<Db>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    clear_exam_draft_conn_for_test(&conn)
}
