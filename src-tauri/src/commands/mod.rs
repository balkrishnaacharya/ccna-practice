use crate::db::{with_immediate_tx_string, Db};
use rand::seq::SliceRandom;
use rand::Rng;
use rusqlite::{params, params_from_iter, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;

pub use crate::notifications::{
    get_notification_settings,
    NotificationSettings,
    ReminderStatus,
};

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

pub fn record_question_stat(
    conn: &Connection,
    question_id: i64,
    correct: bool,
    seen_at: i64,
) -> Result<(), String> {
    // Fetch current SM-2 state (defaults for a never-seen question).
    let (_times_seen, ef, interval, reps): (i64, f64, i64, i64) = conn
        .query_row(
            "SELECT times_seen,
                    COALESCE(ease_factor, 2.5),
                    COALESCE(interval_days, 0),
                    COALESCE(repetitions, 0)
             FROM user_question_stats WHERE question_id = ?1",
            params![question_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
        )
        .unwrap_or((0, 2.5, 0, 0));

    // SM-2 quality grade: 4 for a correct answer, 1 for an incorrect one.
    let q: i64 = if correct { 4 } else { 1 };

    // Update repetitions + interval.
    let (new_reps, new_interval) = if q < 3 {
        (0i64, 1i64)
    } else if reps == 0 {
        (1i64, 1i64)
    } else if reps == 1 {
        (2i64, 6i64)
    } else {
        (reps + 1, ((interval as f64) * ef).round().max(1.0) as i64)
    };

    // Ease factor update (clamped to a minimum of 1.3).
    let new_ef = (ef + (0.1 - (5 - q) as f64 * (0.08 + (5 - q) as f64 * 0.02))).max(1.3);
    let next_review = seen_at + new_interval * 86400;

    conn.execute(
        "INSERT INTO user_question_stats (question_id, times_seen, times_correct, last_seen_at,
                ease_factor, interval_days, repetitions, next_review_at)
         VALUES (?1, 1, ?2, ?3, ?4, ?5, ?6, ?7)
         ON CONFLICT(question_id) DO UPDATE SET
           times_seen = times_seen + 1,
           times_correct = times_correct + excluded.times_correct,
           last_seen_at = excluded.last_seen_at,
           ease_factor = excluded.ease_factor,
           interval_days = excluded.interval_days,
           repetitions = excluded.repetitions,
           next_review_at = excluded.next_review_at",
        params![
            question_id,
            if correct { 1 } else { 0 },
            seen_at,
            new_ef,
            new_interval,
            new_reps,
            next_review,
        ],
    )
    .map_err(|e| e.to_string())?;
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

#[derive(Serialize)]
pub struct SubtopicStat {
    pub domain: String,
    pub subtopic: String,
    pub total: i64,
    pub seen: i64,
    pub attempts: i64,
    pub correct: i64,
    pub accuracy: f64,
}


/// Task 1: added multi_select field
#[derive(Serialize, Deserialize, Clone)]
pub struct Question {
    pub id: i64,
    pub stem: String,
    pub domain: String,
    pub difficulty: String,
    pub multi_select: bool,
    pub subtopic: String,
    pub accuracy: f64,
    pub attempts: i64,
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

pub use exam::*;
pub use library::*;
pub use practice::*;
pub use stats::*;

mod exam;
mod library;
mod practice;
mod stats;

#[cfg(test)]
use stats::DEFAULT_DAILY_GOAL;

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
            CREATE TABLE user_question_stats (
                id INTEGER PRIMARY KEY,
                question_id INTEGER NOT NULL UNIQUE REFERENCES questions(id),
                times_seen INTEGER NOT NULL DEFAULT 0,
                times_correct INTEGER NOT NULL DEFAULT 0,
                last_seen_at INTEGER NOT NULL DEFAULT 0,
                ease_factor REAL NOT NULL DEFAULT 2.5,
                interval_days INTEGER NOT NULL DEFAULT 0,
                repetitions INTEGER NOT NULL DEFAULT 0,
                next_review_at INTEGER NOT NULL DEFAULT 0
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
        // 200 draws so the pass band stays far outside random noise; a 10-draw
        // sample failed ~8% of the time purely by chance.
        let draws = 200;
        let mut pos_a_count = 0;
        for _ in 0..draws {
            let q = get_random_question_conn("easy", None, None, &conn).unwrap().unwrap();
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
        println!("Correct choice landed in position A: {} / {} times", pos_a_count, draws);
        assert!(
            (20..=80).contains(&pos_a_count),
            "Correct choice position A is not uniformly distributed: {}/{}",
            pos_a_count,
            draws
        );
    }

    #[test]
    fn test_single_select_rejects_multi_submit() {
        let conn = setup_test_db();
        let q = get_random_question_conn("easy", None, None, &conn).unwrap().unwrap();
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
            let q = get_random_question_conn("easy", None, None, &conn).unwrap().unwrap();
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
        let next_q = get_random_question_conn("easy", None, None, &conn).unwrap().unwrap();
        assert!(next_q.id > 0);
    }

    #[test]
    fn test_topic_drill_filters_domain_and_subtopic() {
        let conn = setup_test_db();
        conn.execute("UPDATE questions SET subtopic = 'OSPF' WHERE id <= 5", []).unwrap();
        conn.execute("UPDATE questions SET subtopic = 'VLANs' WHERE id > 5", []).unwrap();

        for _ in 0..10 {
            let q = get_random_question_conn("weak", Some("OSPF"), None, &conn)
                .unwrap()
                .unwrap();
            assert!(q.id <= 5, "Drill leaked a non-OSPF question: {}", q.id);
        }

        for _ in 0..10 {
            let q = get_random_question_conn("easy", Some("VLANs"), Some("network_infra"), &conn)
                .unwrap()
                .unwrap();
            assert!(q.id > 5, "Drill leaked a non-VLAN question: {}", q.id);
        }

        // Blank subtopics are grouped under "Uncategorized" to match the stats query.
        conn.execute("UPDATE questions SET subtopic = NULL WHERE id = 30", [])
            .unwrap();
        let uncategorized = get_random_question_conn("weak", Some("Uncategorized"), None, &conn)
            .unwrap()
            .unwrap();
        assert_eq!(uncategorized.id, 30);

        assert!(
            get_random_question_conn("weak", Some("no-such-subtopic"), None, &conn)
                .unwrap()
                .is_none()
        );
        assert!(
            get_random_question_conn("weak", None, Some("ai_ops"), &conn)
                .unwrap()
                .is_none()
        );
    }

    fn noon_epoch(conn: &Connection, days_ago: i64) -> i64 {
        conn.query_row(
            "SELECT CAST(strftime('%s', date('now', 'localtime', ?1) || ' 12:00:00', 'utc') AS INTEGER)",
            params![format!("{} days", -days_ago)],
            |r| r.get(0),
        )
        .unwrap()
    }

    fn add_answer(conn: &Connection, question_id: i64, correct: bool, at: i64) {
        conn.execute(
            "INSERT INTO answers (question_id, correct, answered_at) VALUES (?1, ?2, ?3)",
            params![question_id, if correct { 1 } else { 0 }, at],
        )
        .unwrap();
    }

    #[test]
    fn test_streak_stats_counts_consecutive_days() {
        let mut conn = setup_test_db();

        let empty = streak_stats_conn(&mut conn).unwrap();
        assert_eq!(empty.daily_goal, DEFAULT_DAILY_GOAL);
        assert_eq!(empty.current_streak, 0);
        assert_eq!(empty.longest_streak, 0);
        assert_eq!(empty.active_days, 0);
        assert_eq!(empty.recent.len(), 7);
        assert!(empty.recent.iter().all(|d| d.answered == 0));

        // A three-day run ending yesterday, plus one isolated older day.
        for offset in [1, 2, 3] {
            add_answer(&conn, 1, true, noon_epoch(&conn, offset));
        }
        add_answer(&conn, 2, false, noon_epoch(&conn, 6));

        let stats = streak_stats_conn(&mut conn).unwrap();
        assert_eq!(stats.current_streak, 3, "an untouched today must not break the run");
        assert_eq!(stats.today_answered, 0);
        assert_eq!(stats.remaining_today, DEFAULT_DAILY_GOAL);
        assert_eq!(stats.active_days, 4);
        assert_eq!(stats.recent[6].answered, 0, "last bucket is today");
        assert_eq!(stats.recent[5].answered, 1, "second-to-last bucket is yesterday");
        assert_eq!(stats.recent[5].correct, 1);

        // Answering today extends the run and closes the gap by one.
        add_answer(&conn, 3, false, noon_epoch(&conn, 0));
        let stats = streak_stats_conn(&mut conn).unwrap();
        assert_eq!(stats.today_answered, 1);
        assert_eq!(stats.today_correct, 0);
        assert_eq!(stats.current_streak, 4);
        assert_eq!(stats.longest_streak, 4);
        assert_eq!(stats.remaining_today, DEFAULT_DAILY_GOAL - 1);
        assert!(!stats.goal_met_today);

        // A stored goal of 1 makes today's single answer enough.
        conn.execute_batch("CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);")
            .unwrap();
        conn.execute("INSERT INTO settings (key, value) VALUES ('daily_goal', '1')", [])
            .unwrap();
        let stats = streak_stats_conn(&mut conn).unwrap();
        assert_eq!(stats.daily_goal, 1);
        assert_eq!(stats.remaining_today, 0);
        assert!(stats.goal_met_today);
        assert!(stats.recent[6].goal_met);
    }

    #[test]
    fn test_weak_mode_serves_unseen_before_mastered() {
        let conn = setup_test_db();

        // Master every seeded question (priority 2) so a never-seen question wins.
        for q_id in 1..=30i64 {
            conn.execute(
                "INSERT INTO user_question_stats (question_id, times_seen, times_correct) VALUES (?1, 10, 10)",
                params![q_id],
            )
            .unwrap();
        }

        // One never-seen question: no stats row at all (priority 1).
        conn.execute(
            "INSERT INTO questions (id, stem, domain, difficulty, multi_select) VALUES (?1, ?2, 'network_infra', 'easy', 0)",
            params![99i64, "Unseen question"],
        )
        .unwrap();

        // Weak mode must return the never-seen question every time, never a mastered one.
        for _ in 0..25 {
            let q = get_random_question_conn("weak", None, None, &conn)
                .unwrap()
                .unwrap();
            assert_eq!(q.id, 99, "weak mode deprioritized a never-seen question: {}", q.id);
        }
    }
}
