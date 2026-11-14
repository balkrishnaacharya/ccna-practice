import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNotifications } from "@/hooks/useNotifications";

/**
 * NotificationHistory lists recent notification events (milestones, reminders,
 * review alerts) with dismiss support. Consumes useNotifications().history.
 */
export default function NotificationHistory() {
  const { history, updateSetting } = useNotifications();
  const [dismissedIds, setDismissedIds] = useState(new Set());

  const dismissEvent = useCallback(
    async (eventId: number) => {
      setDismissedIds((prev) => new Set([...prev, eventId]));
      try {
        // Record dismissal by updating the event's dismissed_at via a
        // Tauri command. If no command exists yet, the local filter still
        // hides the event from the list.
        await invoke("dismiss_notification_event", { event_id: eventId });
      } catch (err) {
        // Command may not exist yet; local dismiss still works.
        console.error("dismiss_notification_event failed:", err);
      }
    },
    []
  );

  const visibleHistory = history.filter((h) => !dismissedIds.has(h.id));

  return (
    <div className="border border-dark-border rounded-2xl p-6 bg-dark-card shadow-dock space-y-4">
      <div>
        <h2 className="font-serif text-xl font-semibold text-paper mb-1">
          Notification History
        </h2>
        <p className="text-xs text-paper-dim font-sans">
          Recent milestones, reminders, and review alerts. Dismiss items you no
          longer need.
        </p>
      </div>

      {visibleHistory.length === 0 ? (
        <div className="border border-dark-border rounded-2xl p-6 bg-dark-card text-center shadow-dock space-y-4">
          <div className="w-10 h-10 text-gold/20 border border-gold/30 rounded-full flex items-center justify-center mx-auto">
            🔔
          </div>
          <h3 className="font-serif text-lg font-medium text-paper">
            No recent notifications
          </h3>
          <p className="text-xs text-paper-muted max-w-sm mx-auto leading-relaxed">
            Notifications you receive will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleHistory.map((event) => (
            <div
              key={event.id}
              className="border border-dark-border rounded-xl p-4 bg-dark-card space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-paper">
                    {event.title}
                  </p>
                  <p className="text-xs text-paper-muted">
                    {event.body}
                  </p>
                </div>
                <span className="text-xs font-mono text-paper-muted">
                  {new Date(event.occurred_at * 1000).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => dismissEvent(event.id)}
                className="text-xs font-medium text-paper-dim hover:text-gold px-3 py-1.5 rounded-full border border-dark-border hover:border-gold/30 transition-colors"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
