import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

export function useStreak() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const goalMetRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const loadStreak = async () => {
      try {
        const stats = await invoke("get_streak_stats");
        if (mounted) {
          setData(stats);
          setLoading(false);
        }
      } catch (err) {
        console.error("get_streak_stats failed:", err);
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
