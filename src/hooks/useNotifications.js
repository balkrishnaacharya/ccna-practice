import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

/**
 * Hook for notification preferences, in-app toasts, and reminder status.
 * All Tauri commands are local-first; no OS permission is requested
 * automatically on mount.
 */
export function useNotifications() {
  const [settings, setSettings] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSettings = useCallback(async () => {
    try {
      const s = await invoke("get_notification_settings");
      setSettings(s);
    } catch (err) {
      console.error("get_notification_settings failed:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const h = await invoke("get_notification_history", { limit: 50 });
      setHistory(h || []);
    } catch (err) {
      console.error("get_notification_history failed:", err);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadHistory();
  }, [loadSettings, loadHistory]);

  const updateSetting = useCallback(async (key, value) => {
    try {
      await invoke("update_notification_setting", { key, value });
      await loadSettings();
    } catch (err) {
      console.error("update_notification_setting failed:", err);
      setError(String(err));
    }
  }, [loadSettings]);

  const showToast = useCallback(
    async (eventType, title, body) => {
      try {
        await invoke("send_in_app_notification", {
          event_type: eventType,
          title,
          body,
        });
      } catch (err) {
        console.error("send_in_app_notification failed:", err);
      }
      toast(title, { description: body });
    },
    []
  );

  const checkReminderStatus = useCallback(async () => {
    try {
      return await invoke("check_reminder_status");
    } catch (err) {
      console.error("check_reminder_status failed:", err);
      return null;
    }
  }, []);

  return {
    settings,
    loading,
    error,
    history,
    updateSetting,
    showToast,
    checkReminderStatus,
  };
}

/**
 * Hook that returns whether an exam is currently active, for use in
 * suppressing reminders during an exam.
 */
export function useExamActive() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Exam progress is set via the Exam page's reportExamProgress prop.
    // This hook is a placeholder that App.jsx can wire up via context
    // or prop drilling. Defaults to false (no exam active).
    setIsActive(false);
  }, []);

  return isActive;
}
