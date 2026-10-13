use crate::db::Db;
use rand::seq::SliceRandom;
use rand::Rng;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

fn record_question_stat(conn: &Connection, question_id: i64, correct: bool, seen_at: i64) -> Result<(), String> {
    conn.execute(
        "INSERT INTO user_question_stats (question_id, times_seen, times_correct, last_seen_at)
         VALUES (?1, 1, ?2, ?3)
         ON CONFLICT(question_id) DO UPDATE SET
           times_seen = times_seen + 1,
           times_correct = times_correct + excluded.times_correct,
           last_seen_at = excluded.last_seen_at",
        params![question_id, if correct { 1 } else { 0 }, seen_at],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Shared structs ───────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct Stats {
    pub total: i64,
    pub answered: i64,
    pub correct: i64,
    pub accuracy: f64,
    pub by_domain: Vec<DomainCount>,
}

#[derive(Serialize)]
pub struct DomainCount {
    pub domain: String,
    pub count: i64,
}

/// Task 1: added multi_select field
#[derive(Serialize, Deserialize, Clone)]
pub struct Question {
    pub id: i64,
    pub stem: String,
    pub domain: String,
    pub difficulty: String,
    pub multi_select: bool,
    pub choices: Vec<Choice>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Choice {
    pub id: i64,
    pub text: String,
}

#[derive(Deserialize)]
pub struct SubmitPayload {
    pub question_id: i64,
    pub choice_ids: Vec<i64>,
}

#[derive(Serialize)]
pub struct SubmitResult {
    pub correct: bool,
    pub explanation: String,
    pub correct_choice_ids: Vec<i64>,
}

#[derive(Deserialize)]
pub struct ExamAnswerItem {
    pub question_id: i64,
    pub choice_ids: Vec<i64>,
}

#[derive(Deserialize)]
pub struct ExamSubmitPayload {
    pub answers: Vec<ExamAnswerItem>,
    pub time_spent_seconds: i64,
}

#[derive(Serialize, Clone)]
pub struct ChoiceWithCorrectness {
    pub id: i64,
    pub text: String,
    pub is_correct: bool,
}

#[derive(Serialize, Clone)]
pub struct QuestionReviewResult {
    pub question_id: i64,
    pub stem: String,
    pub domain: String,
    pub subtopic: String,
    pub explanation: String,
    pub user_choice_ids: Vec<i64>,
    pub correct_choice_ids: Vec<i64>,
    pub choices: Vec<ChoiceWithCorrectness>,
    pub is_correct: bool,
}

#[derive(Serialize)]
pub struct DomainScore {
    pub domain: String,
    pub total: i64,
    pub correct: i64,
    pub percentage: f64,
}

#[derive(Serialize)]
pub struct ExamResult {
    pub session_id: i64,
    pub total_questions: i64,
    pub score: i64,
    pub percentage: f64,
    pub scaled_score: i64,
    pub passed: bool,
    pub time_spent_seconds: i64,
    pub domain_scores: Vec<DomainScore>,
    pub reviews: Vec<QuestionReviewResult>,
}

// Task 3: History structs
#[derive(Serialize)]
pub struct SessionSummary {
    pub id: i64,
    pub mode: String,
    pub started_at: i64,
    pub ended_at: i64,
    pub score: i64,
    pub total: i64,
    pub duration_sec: i64,
    pub percentage: f64,
    pub scaled_score: i64,
    pub passed: bool,
}

#[derive(Serialize)]
pub struct SessionDetail {
    pub session: SessionSummary,
    pub domain_scores: Vec<DomainScore>,
    pub reviews: Vec<QuestionReviewResult>,
}

struct ExamCandidate {
    id: i64,
    stem: String,
    domain: String,
    difficulty: String,
    multi_select: i64,
    subtopic: String,
    adaptive_weight: f64,
}

fn weighted_exam_sample(
    candidates: &mut Vec<ExamCandidate>,
    count: usize,
    rng: &mut impl Rng,
    topic_counts: &mut HashMap<String, usize>,
) -> Vec<ExamCandidate> {
    let mut selected = Vec::with_capacity(count);

    while selected.len() < count {
        let eligible: Vec<usize> = candidates.iter().enumerate()
            .filter(|(_, candidate)| topic_counts.get(&candidate.subtopic).copied().unwrap_or(0) < 2)
            .map(|(index, _)| index)
            .collect();
        if eligible.is_empty() { break; }

        let total_weight: f64 = eligible.iter().map(|index| candidates[*index].adaptive_weight).sum();
        let mut draw = rng.gen_range(0.0..total_weight);
        let chosen = eligible.iter().copied().find(|index| {
            draw -= candidates[*index].adaptive_weight;
            draw < 0.0
        }).unwrap_or(*eligible.last().unwrap());
        let candidate = candidates.swap_remove(chosen);
        *topic_counts.entry(candidate.subtopic.clone()).or_default() += 1;
        selected.push(candidate);
    }
    selected
}

// ─── Stats ────────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_stats(db: State<Db>) -> Result<Stats, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let total: i64 = conn
        .query_row("SELECT COUNT(*) FROM questions", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    let answered: i64 = conn
        .query_row("SELECT COUNT(*) FROM answers", [], |r| r.get(0))
        .unwrap_or(0);
    let correct: i64 = conn
        .query_row("SELECT COUNT(*) FROM answers WHERE correct = 1", [], |r| {
            r.get(0)
        })
        .unwrap_or(0);
    let accuracy = if answered > 0 {
        (correct as f64 / answered as f64) * 100.0
    } else {
        0.0
    };

    let mut stmt = conn
        .prepare("SELECT domain, COUNT(*) FROM questions GROUP BY domain ORDER BY domain")
        .map_err(|e| e.to_string())?;
    let by_domain = stmt
        .query_map([], |r| {
            Ok(DomainCount {
                domain: r.get(0)?,
                count: r.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(Stats {
        total,
        answered,
        correct,
        accuracy: (accuracy * 10.0).round() / 10.0,
        by_domain,
    })
}

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
fn row_to_question(
    conn: &Connection,
    id: i64,
    stem: String,
    domain: String,
    difficulty: String,
    multi_select: i64,
) -> Result<Question, String> {
    let choices = load_choices(conn, id)?;
    Ok(Question {
        id,
        stem,
        domain,
        difficulty,
        multi_select: multi_select != 0,
        choices,
    })
}

#[tauri::command]
pub fn get_random_question(mode: String, db: State<Db>) -> Result<Option<Question>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    get_random_question_conn(&mode, &conn)
}

pub fn get_random_question_conn(mode: &str, conn: &Connection) -> Result<Option<Question>, String> {
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

// ─── Submit answer ────────────────────────────────────────────────────────────

#[tauri::command]
pub fn submit_answer(payload: SubmitPayload, db: State<Db>) -> Result<SubmitResult, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    submit_answer_conn(&payload, &conn)
}

pub fn submit_answer_conn(payload: &SubmitPayload, conn: &Connection) -> Result<SubmitResult, String> {
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
}

// ─── Exam questions ───────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_exam_questions(db: State<Db>) -> Result<Vec<Question>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

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
                &conn, candidate.id, candidate.stem, candidate.domain,
                candidate.difficulty, candidate.multi_select,
            )?);
        }
    }
    all_questions.shuffle(&mut rng);
    Ok(all_questions)
}

// ─── Submit exam ──────────────────────────────────────────────────────────────

#[tauri::command]
pub fn submit_exam(payload: ExamSubmitPayload, db: State<Db>) -> Result<ExamResult, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut total_correct = 0i64;
    let total_questions = payload.answers.len() as i64;
    let mut reviews: Vec<QuestionReviewResult> = Vec::new();
    let mut domain_map: HashMap<String, (i64, i64)> = HashMap::new();

    let now = now_secs();
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
        record_question_stat(&conn, item.question_id, is_correct, now)?;

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

// ─── Flags ────────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn toggle_flag(question_id: i64, note: Option<String>, db: State<Db>) -> Result<bool, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let existing: Option<i64> = conn
        .query_row(
            "SELECT id FROM flags WHERE question_id = ?1",
            params![question_id],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    if let Some(id) = existing {
        conn.execute("DELETE FROM flags WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(false)
    } else {
        let now = now_secs();
        conn.execute(
            "INSERT INTO flags (question_id, note, created_at) VALUES (?1, ?2, ?3)",
            params![question_id, note, now],
        )
        .map_err(|e| e.to_string())?;
        Ok(true)
    }
}

#[tauri::command]
pub fn get_flag_status(question_id: i64, db: State<Db>) -> Result<Option<String>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let note: Option<Option<String>> = conn
        .query_row(
            "SELECT note FROM flags WHERE question_id = ?1",
            params![question_id],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    match note {
        Some(opt) => Ok(Some(opt.unwrap_or_default())),
        None => Ok(None),
    }
}

#[tauri::command]
pub fn get_flags(db: State<Db>) -> Result<Vec<serde_json::Value>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT f.id, f.question_id, q.stem, q.domain, q.difficulty, COALESCE(q.explanation, ''), f.note, f.created_at
             FROM flags f
             JOIN questions q ON q.id = f.question_id
             ORDER BY f.created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows: Vec<(i64, i64, String, String, String, String, Option<String>, i64)> = stmt
        .query_map([], |r| {
            Ok((
                r.get(0)?,
                r.get(1)?,
                r.get(2)?,
                r.get(3)?,
                r.get(4)?,
                r.get(5)?,
                r.get(6)?,
                r.get(7)?,
            ))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let mut result = Vec::new();
    for (id, question_id, stem, domain, difficulty, explanation, note, created_at) in rows {
        let mut cstmt = conn
            .prepare("SELECT id, text, is_correct FROM choices WHERE question_id = ?1 ORDER BY RANDOM()")
            .map_err(|e| e.to_string())?;

        let choices: Vec<serde_json::Value> = cstmt
            .query_map(params![question_id], |cr| {
                Ok(serde_json::json!({
                    "id": cr.get::<_, i64>(0)?,
                    "text": cr.get::<_, String>(1)?,
                    "is_correct": cr.get::<_, i64>(2)? == 1,
                }))
            })
            .map_err(|e| e.to_string())?
            .filter_map(|cr| cr.ok())
            .collect();

        result.push(serde_json::json!({
            "id": id,
            "question_id": question_id,
            "stem": stem,
            "domain": domain,
            "difficulty": difficulty,
            "explanation": explanation,
            "note": note,
            "created_at": created_at,
            "choices": choices,
        }));
    }

    Ok(result)
}

// ─── Settings ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_setting(key: String, db: State<Db>) -> Result<Option<String>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let val = conn
        .query_row(
            "SELECT value FROM settings WHERE key = ?1",
            params![key],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    Ok(val)
}

#[tauri::command]
pub fn set_setting(key: String, value: String, db: State<Db>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2",
        params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn reset_stats(db: State<Db>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM answers", []).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM sessions", []).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM flags", []).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM user_question_stats", []).map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use std::collections::HashSet;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            "
            CREATE TABLE questions (
                id INTEGER PRIMARY KEY,
                stem TEXT NOT NULL,
                explanation TEXT,
                domain TEXT NOT NULL,
                subtopic TEXT,
                difficulty TEXT NOT NULL DEFAULT 'medium',
                source TEXT,
                multi_select INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE choices (
                id INTEGER PRIMARY KEY,
                question_id INTEGER NOT NULL REFERENCES questions(id),
                text TEXT NOT NULL,
                is_correct INTEGER NOT NULL DEFAULT 0,
                sort_order INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE answers (
                id INTEGER PRIMARY KEY,
                session_id INTEGER,
                question_id INTEGER REFERENCES questions(id),
                correct INTEGER NOT NULL,
                time_spent_ms INTEGER,
                answered_at INTEGER NOT NULL DEFAULT 0,
                selected_choice_ids TEXT NOT NULL DEFAULT '[]'
            );
            ",
        )
        .unwrap();

        // Seed 30 single-select questions with 4 choices each
        for q_id in 1..=30i64 {
            conn.execute(
                "INSERT INTO questions (id, stem, domain, difficulty, multi_select) VALUES (?1, ?2, 'network_infra', 'easy', 0)",
                params![q_id, format!("Question stem {}", q_id)],
            )
            .unwrap();
            conn.execute(
                "INSERT INTO choices (id, question_id, text, is_correct, sort_order) VALUES (?1, ?2, 'Correct Answer', 1, 1)",
                params![q_id * 10 + 1, q_id],
            )
            .unwrap();
            for c_idx in 2..=4i64 {
                conn.execute(
                    "INSERT INTO choices (id, question_id, text, is_correct, sort_order) VALUES (?1, ?2, ?3, 0, ?4)",
                    params![q_id * 10 + c_idx, q_id, format!("Wrong Choice {}", c_idx), c_idx],
                )
                .unwrap();
            }
        }
        conn
    }

    #[test]
    fn test_random_choice_order() {
        let conn = setup_test_db();
        let mut pos_a_count = 0;
        for _ in 0..10 {
            let q = get_random_question_conn("easy", &conn).unwrap().unwrap();
            assert_eq!(q.choices.len(), 4);
            assert!(!q.multi_select, "all test questions are single-select");
            let correct_pos = q
                .choices
                .iter()
                .position(|c| c.id % 10 == 1)
                .expect("correct choice must exist");
            if correct_pos == 0 {
                pos_a_count += 1;
            }
        }
        println!("Correct choice landed in position A: {} / 10 times", pos_a_count);
        assert!(
            pos_a_count <= 4,
            "Correct choice in position A too many times: {}",
            pos_a_count
        );
    }

    #[test]
    fn test_single_select_rejects_multi_submit() {
        let conn = setup_test_db();
        let q = get_random_question_conn("easy", &conn).unwrap().unwrap();
        let payload = SubmitPayload {
            question_id: q.id,
            choice_ids: vec![q.choices[0].id, q.choices[1].id],
        };
        let result = submit_answer_conn(&payload, &conn);
        assert!(result.is_err(), "Should reject multi-selection for single-answer question");
    }

    #[test]
    fn test_anti_repeat_logic_and_fallback() {
        let conn = setup_test_db();
        let mut answered_ids = Vec::new();
        let mut seen = HashSet::new();

        for i in 0..20 {
            let q = get_random_question_conn("easy", &conn).unwrap().unwrap();
            let q_id = q.id;
            assert!(
                seen.insert(q_id),
                "Question {} was served multiple times at step {}",
                q_id,
                i
            );
            answered_ids.push(q_id);

            let payload = SubmitPayload {
                question_id: q_id,
                choice_ids: vec![q_id * 10 + 1],
            };
            let res = submit_answer_conn(&payload, &conn).unwrap();
            assert!(res.correct);
        }

        assert_eq!(seen.len(), 20);

        let dup_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM (SELECT question_id FROM answers GROUP BY question_id HAVING COUNT(*) > 1)",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(dup_count, 0);

        conn.execute("UPDATE answers SET answered_at = 0", []).unwrap();
        let next_q = get_random_question_conn("easy", &conn).unwrap().unwrap();
        assert!(next_q.id > 0);
    }
}
