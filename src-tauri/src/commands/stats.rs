use super::*;

// ─── Stats ────────────────────────────────────────────────────────────────────

/// Connection-level stats query, usable by tests and commands alike.
pub fn get_stats_conn(conn: &Connection) -> Result<Stats, String> {
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

#[tauri::command]
pub fn get_stats(db: State<Db>) -> Result<Stats, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    get_stats_conn(&conn)
}

/// Per-subtopic accuracy, used to point the learner at weak areas.
/// `seen` counts distinct questions attempted; `attempts` counts total answers.
#[tauri::command]
pub fn get_subtopic_stats(db: State<Db>) -> Result<Vec<SubtopicStat>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
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

    let rows = stmt
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
                // Accuracy as percentage (was *1000 /10 = *100, simplified directly).
                accuracy: if attempts > 0 {
                    (correct as f64 / attempts as f64) * 100.0
                } else {
                    0.0
                },
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(rows)
}

/// Number of questions currently due for spaced-repetition review.
#[tauri::command]
pub fn get_review_due_count(db: State<Db>) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let now = now_secs();
    // Only questions that have actually been studied can be due. On a fresh
    // install there are no stats rows, so the count must be zero rather than
    // reporting the entire bank as overdue.
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM user_question_stats s
             JOIN questions q ON q.id = s.question_id
             WHERE COALESCE(s.next_review_at, 0) <= ?1",
            params![now],
            |r| r.get(0),
        )
        .unwrap_or(0);
    Ok(count)
}

// ─── Study streak ─────────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct DayActivity {
    /// Local calendar date, YYYY-MM-DD.
    pub date: String,
    pub answered: i64,
    pub correct: i64,
    pub goal_met: bool,
}

#[derive(Serialize)]
pub struct StreakStats {
    pub today_answered: i64,
    pub today_correct: i64,
    pub daily_goal: i64,
    pub remaining_today: i64,
    pub goal_met_today: bool,
    pub current_streak: i64,
    pub longest_streak: i64,
    pub active_days: i64,
    /// Last seven days, oldest first, with gaps filled as zero.
    pub recent: Vec<DayActivity>,
}

pub(super) const DEFAULT_DAILY_GOAL: i64 = 12;

/// Day counts keyed by a local calendar-day ordinal (days since an arbitrary
/// epoch). Ordinals come from SQLite so the local-time conversion matches.
fn daily_activity(conn: &mut Connection) -> Result<Vec<(i64, i64, i64)>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT CAST(julianday(date(answered_at, 'unixepoch', 'localtime')) AS INTEGER) AS day,
                    COUNT(*),
                    COALESCE(SUM(correct), 0)
             FROM answers
             WHERE answered_at > 0
             GROUP BY day
             ORDER BY day ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(rows)
}

fn daily_goal(conn: &mut Connection) -> i64 {
    conn.query_row(
        "SELECT value FROM settings WHERE key = 'daily_goal'",
        [],
        |r| r.get::<_, String>(0),
    )
    .optional()
    .ok()
    .flatten()
    .and_then(|raw| raw.trim().parse::<i64>().ok())
    .filter(|goal| *goal > 0)
    .map(|goal| goal.min(500))
    .unwrap_or(DEFAULT_DAILY_GOAL)
}

fn today_ordinal(conn: &mut Connection) -> Result<i64, String> {
    conn.query_row(
        "SELECT CAST(julianday(date('now', 'localtime')) AS INTEGER)",
        [],
        |r| r.get(0),
    )
    .map_err(|e| e.to_string())
}

/// Ordinals are truncated Julian days, so they land at midnight of the *previous*
/// day; adding half a day recovers the calendar date they were derived from.
fn date_label(conn: &Connection, ordinal: i64) -> Result<String, String> {
    conn.query_row(
        "SELECT date(julianday(?1) + 0.5)",
        params![ordinal],
        |r| r.get(0),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_streak_stats(db: State<Db>) -> Result<StreakStats, String> {
    let mut conn = db.0.lock().map_err(|e| e.to_string())?;
    streak_stats_conn(&mut *conn)
}

pub fn streak_stats_conn(conn: &mut Connection) -> Result<StreakStats, String> {
    let goal = daily_goal(conn);
    let today = today_ordinal(conn)?;
    let activity = daily_activity(conn)?;

    let by_day: HashMap<i64, (i64, i64)> = activity
        .iter()
        .map(|(day, answered, correct)| (*day, (*answered, *correct)))
        .collect();

    let (today_answered, today_correct) = by_day.get(&today).copied().unwrap_or((0, 0));

    // A streak survives until a full day is missed, so an untouched today
    // continues the run that ended yesterday.
    let streak_anchor = if by_day.contains_key(&today) {
        today
    } else {
        today - 1
    };
    let mut current_streak = 0;
    let mut cursor = streak_anchor;
    while by_day.contains_key(&cursor) {
        current_streak += 1;
        cursor -= 1;
    }

    let mut longest_streak = 0;
    let mut run = 0;
    let mut previous: Option<i64> = None;
    for &(day, _, _) in &activity {
        run = if previous == Some(day - 1) { run + 1 } else { 1 };
        longest_streak = longest_streak.max(run);
        previous = Some(day);
    }

    let mut recent = Vec::with_capacity(7);
    for offset in (0..7).rev() {
        let day = today - offset;
        let (answered, correct) = by_day.get(&day).copied().unwrap_or((0, 0));
        recent.push(DayActivity {
            date: date_label(conn, day)?,
            answered,
            correct,
            goal_met: answered >= goal,
        });
    }

    Ok(StreakStats {
        today_answered,
        today_correct,
        daily_goal: goal,
        remaining_today: (goal - today_answered).max(0),
        goal_met_today: today_answered >= goal,
        current_streak,
        longest_streak,
        active_days: activity.len() as i64,
        recent,
    })
}

// ─── Practice streak (minimum questions per day) ────────────────────────────

/// A day only counts toward the practice streak once this many questions
/// have been answered. Kept separate from the dashboard's "any answer" streak
/// so the existing goal/streak semantics stay intact.
pub const PRACTICE_DAY_MIN: i64 = 5;

#[derive(Serialize)]
pub struct PracticeStreak {
    pub current: i64,
    pub longest: i64,
    pub min_per_day: i64,
    pub active_days: i64,
}

pub fn practice_streak_conn(conn: &Connection) -> Result<PracticeStreak, String> {
    let mut stmt = conn.prepare(
        "SELECT CAST(julianday(date(answered_at, 'unixepoch', 'localtime')) AS INTEGER) AS day,
                COUNT(*) AS answered
         FROM answers
         WHERE answered_at > 0
         GROUP BY day
         HAVING answered >= ?1
         ORDER BY day ASC",
    )
    .map_err(|e| e.to_string())?;

    let days: Vec<i64> = stmt
        .query_map(params![PRACTICE_DAY_MIN], |r| r.get(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let today: i64 = conn
        .query_row(
            "SELECT CAST(julianday(date('now', 'localtime')) AS INTEGER)",
            [],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    let active: std::collections::HashSet<i64> = days.iter().copied().collect();
    let anchor = if active.contains(&today) { today } else { today - 1 };
    let mut current = 0;
    let mut cursor = anchor;
    while active.contains(&cursor) {
        current += 1;
        cursor -= 1;
    }

    let mut longest = 0;
    let mut run = 0;
    let mut previous: Option<i64> = None;
    for &day in &days {
        run = if previous == Some(day - 1) { run + 1 } else { 1 };
        longest = longest.max(run);
        previous = Some(day);
    }

    Ok(PracticeStreak {
        current,
        longest,
        min_per_day: PRACTICE_DAY_MIN,
        active_days: days.len() as i64,
    })
}

#[tauri::command]
pub fn get_practice_streak(db: State<Db>) -> Result<PracticeStreak, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    practice_streak_conn(&conn)
}
