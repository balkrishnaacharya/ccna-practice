import { isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';

export interface NotificationOptions {
  title: string;
  body: string;
  id?: number;
}

/**
 * Cross-platform notification with proper permission handling.
 * - Windows: works only in installed builds (not dev). No permission prompt needed.
 * - Linux: no OS permission prompt. Checks if notify-send exists.
 * - Android: requires runtime POST_NOTIFICATIONS permission (Android 13+).
 */
export async function showNotification(opts: NotificationOptions): Promise<boolean> {
  try {
    let granted = await isPermissionGranted();

    if (!granted) {
      // Android 13+ will show the system dialog here.
      // Linux/Windows will auto-grant (no prompt).
      const result = await requestPermission();
      granted = result === 'granted';
    }

    if (!granted) {
      console.warn('[notify] Permission denied');
      return false;
    }

    // Use the Rust-side notify to get native OS notifications
    const { notify } = await import('@tauri-apps/plugin-notification');
    await notify({
      title: opts.title,
      body: opts.body,
      id: opts.id,
    });

    return true;
  } catch (err) {
    console.error('[notify] Failed to show notification:', err);
    return false;
  }
}

/**
 * Call this on app startup to pre-request permission.
 * On Android this triggers the system dialog.
 * On desktop it's a no-op (always granted).
 */
export async function initNotifications(): Promise<void> {
  try {
    const granted = await isPermissionGranted();
    if (!granted) {
      await requestPermission();
    }
  } catch (err) {
    console.error('[notify] initNotifications failed:', err);
  }
}