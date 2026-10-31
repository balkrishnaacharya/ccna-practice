import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Link } from "react-router-dom";

// Date strings come back as YYYY-MM-DD. Parsing them without a time component
// is treated as UTC, which can shift the weekday for western timezones.
function weekdayLetter(dateStr) {
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "·";
  return date.toLocaleDateString(undefined, { weekday: "narrow" });
}

function shortDate(dateStr) {
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function StreakPanel() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    invoke("get_streak_stats")
      .then(setData)
      .catch((err) => {
        console.error(err);
        setFailed(true);
      });
  }, []);

  // Purely motivational; never take the dashboard down over it.
  if (failed) return null;

  if (!data) {
    return (
      <div
        data-tour="study-streak"
        className="h-[148px] animate-pulse rounded-2xl border border-dark-border bg-dark-card"
      />
    );
  }

  const goal = Math.max(1, data.daily_goal);
  const answered = data.today_answered;
  const progress = Math.min(100, Math.round((answered / goal) * 100));
  const recent = data.recent || [];
  // Scale bars against the goal so a hit goal fills the track, but let an
  // over-goal day push past it instead of clipping.
  const ceiling = Math.max(goal, ...recent.map((day) => day.answered), 1);

  return (
    <section
      data-tour="study-streak"
      className="rounded-2xl border border-dark-border bg-dark-card p-5 shadow-dock"
    >
      <div className="flex items-start justify-between gap-3 border-b border-dark-borderSubtle pb-3">
        <div>
          <h2 className="font-serif text-xl font-semibold tracking-tight text-paper">
            Study Streak
          </h2>
          <p className="mt-0.5 text-xs text-paper-dim">
            Answer at least one question to keep the run alive.
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 font-mono text-xs font-semibold ${
            data.current_streak > 0
              ? "border-gold/30 bg-gold/10 text-gold"
              : "border-dark-border bg-dark-surface text-paper-dim"
          }`}
        >
          🔥 {data.current_streak} day{data.current_streak === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid gap-5 pt-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p
              className={`font-serif text-3xl font-semibold tracking-tight ${
                data.goal_met_today ? "text-sage-light" : "text-paper"
              }`}
            >
              {answered}
              <span className="text-base font-normal text-paper-dim">/{goal}</span>
            </p>
            <p className="text-xs font-medium text-paper-muted">
              {data.goal_met_today
                ? "Daily goal met — nice work."
                : `${data.remaining_today} more to hit today's goal`}
            </p>
          </div>

          <div
            className="h-2.5 w-full overflow-hidden rounded-full border border-dark-borderSubtle bg-dark-surface"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={goal}
            aria-valuenow={Math.min(answered, goal)}
            aria-label="Questions answered today toward daily goal"
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                data.goal_met_today ? "bg-sage-light" : "bg-gold"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <dl className="flex gap-6 pt-1 text-xs">
            <div>
              <dt className="uppercase tracking-wider text-paper-dim">Longest</dt>
              <dd className="font-mono text-sm text-paper">{data.longest_streak} d</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wider text-paper-dim">Active days</dt>
              <dd className="font-mono text-sm text-paper">{data.active_days}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-wider text-paper-dim">Today correct</dt>
              <dd className="font-mono text-sm text-paper">
                {answered > 0 ? `${data.today_correct}/${answered}` : "—"}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
            {!data.goal_met_today && data.remaining_today > 0 && (
              <Link
                to="/quiz?mode=weak"
                className="rounded-full bg-gold px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-dark-bg shadow-gold-glow transition-all hover:bg-gold-hover"
              >
                Answer {data.remaining_today} more
              </Link>
            )}
            <Link
              to="/settings"
              className="text-xs font-medium text-paper-dim transition-colors hover:text-gold"
            >
              Adjust daily goal →
            </Link>
          </div>
        </div>

        <div className="flex items-end justify-between gap-1.5 sm:justify-end">
          {recent.map((day, index) => {
            const isToday = index === recent.length - 1;
            const ratio = Math.min(1, day.answered / ceiling);
            const label = `${shortDate(day.date)}: ${day.answered} answered${
              day.goal_met ? ", goal met" : ""
            }${isToday ? " (today)" : ""}`;
            return (
              <div key={day.date} className="flex w-7 flex-col items-center gap-1">
                <div
                  className={`relative flex h-16 w-full items-end overflow-hidden rounded-md border ${
                    isToday ? "border-gold/40" : "border-dark-borderSubtle"
                  } bg-dark-surface`}
                  title={label}
                  aria-label={label}
                  role="img"
                >
                  {day.answered > 0 && (
                    <div
                      className={`w-full rounded-t-[3px] ${
                        day.goal_met ? "bg-sage-light" : "bg-gold/80"
                      }`}
                      style={{ height: `${Math.max(12, ratio * 100)}%` }}
                    />
                  )}
                </div>
                <span
                  className={`text-xs font-mono ${
                    isToday ? "font-semibold text-gold" : "text-paper-dim"
                  }`}
                >
                  {weekdayLetter(day.date)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
