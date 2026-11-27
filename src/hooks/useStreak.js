import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

export function useStreak() {
  const [data, setData] = useState(null);
  const [practiceStreak, setPracticeStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const goalMetRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const loadStreak = async () => {
      try {
        const [stats, practice] = await Promise.all([
          invoke("get_streak_stats"),
          invoke("get_practice_streak").catch(() => null),
        ]);
        if (mounted) {
          setData(stats);
          setPracticeStreak(practice);
          setLoading(false);
        }
      } catch (err) {
        console.error("streak stats failed:", err);
        if (mounted) setLoading(false);
      }
    };

    loadStreak();

    return () => {
      mounted = false;
    };
  }, []);

  // Show sonner toast when daily goal is first met
  useEffect(() => {
    if (!data || !data.goal_met_today) return;
    if (goalMetRef.current) return;
    goalMetRef.current = true;

    toast("Daily goal reached! 🎯", {
      description: `${data.today_answered} of ${data.daily_goal} questions answered today.`,
      className:
        "group toast group-[.toast]:bg-background group-[.toast]:text-foreground group-[.toast]:border-border group-[.toast]:shadow-lg",
      action: {
        label: "Keep going",
        onClick: () => {},
      },
    });
  }, [data]);

  return {
    data,
    loading,
    streak: data?.current_streak || 0,
    practiceStreak: practiceStreak?.current || 0,
    practiceStreakMin: practiceStreak?.min_per_day || 5,
    longestStreak: data?.longest_streak || 0,
    todayAnswered: data?.today_answered || 0,
    todayCorrect: data?.today_correct || 0,
    dailyGoal: data?.daily_goal || 0,
    remainingToday: data?.remaining_today || 0,
    goalMetToday: data?.goal_met_today || false,
    activeDays: data?.active_days || 0,
    recent: data?.recent || [],
  };
}
