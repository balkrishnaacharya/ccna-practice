import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { EXAM_CONFIG } from "@/lib/constants";

const DOMAIN_WEIGHTS = {
  network_infra: 25,
  switching: 25,
  ip_routing: 20,
  services_security: 20,
  ai_ops: 10,
};

export function useReadiness() {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const compute = useCallback(async () => {
    try {
      const [subtopicStats, streakStats] = await Promise.all([
        invoke("get_subtopic_stats"),
        invoke("get_streak_stats"),
      ]);

      const subs = subtopicStats || [];
      const streak = streakStats || {};

      // ─── Domain accuracy (last 50 questions per domain) ──────────────────
      const domainData = {};
      for (const s of subs) {
        const d = s.domain || "unknown";
        if (!domainData[d]) {
          domainData[d] = { correct: 0, attempts: 0 };
        }
        domainData[d].correct += s.correct || 0;
        domainData[d].attempts += s.attempts || 0;
      }

      const totalWeight = Object.values(DOMAIN_WEIGHTS).reduce((a, b) => a + b, 0);
      let weightedAccuracy = 0;
      let weightSum = 0;

      for (const [domain, weight] of Object.entries(DOMAIN_WEIGHTS)) {
        const data = domainData[domain];
        const acc = data && data.attempts > 0 ? data.correct / data.attempts : 0;
        weightedAccuracy += acc * weight;
        weightSum += weight;
      }

      const domainScore = weightSum > 0 ? (weightedAccuracy / weightSum) * 100 : 0;

      // ─── Recency bonus: questions in last 7 days count double ─────────────
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recent = streak.recent || [];
      let recentQuestions = 0;
      let recentCorrect = 0;
      for (const day of recent) {
        const dayDate = new Date(day.date + "T00:00:00");
        if (dayDate >= sevenDaysAgo && dayDate <= now) {
          recentQuestions += day.answered || 0;
          recentCorrect += day.correct || 0;
        }
      }

      // Recency bonus: up to +20 points for recent activity
      const recencyBonus = Math.min(20, (recentQuestions / 50) * 20);

      // ─── Consistency: (days studied in last 14 / 14) * 10 ─────────────────
      const daysStudied = recent.filter((d) => (d.answered || 0) > 0).length;
      const consistencyScore = Math.min(10, (daysStudied / 14) * 10);

      // ─── Final score ───────────────────────────────────────────────────────
      const finalScore = Math.round(
        Math.min(100, domainScore * 0.7 + recencyBonus + consistencyScore),
      );

      setScore({
        value: finalScore,
        domainScore: Math.round(domainScore),
        recencyBonus: Math.round(recencyBonus),
        consistencyScore: Math.round(consistencyScore),
        label: finalScore < 50 ? "Keep practicing" : finalScore < 80 ? "Getting there" : "Ready for exam",
        color: finalScore < 50 ? "heart" : finalScore < 80 ? "gold" : "sage",
      });
    } catch (err) {
      console.error("readiness computation failed:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    compute();
  }, [compute]);

  return { score, loading, error, refresh: compute };
}
