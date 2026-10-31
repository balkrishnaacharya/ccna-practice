import { useState, useEffect, useCallback, useRef } from "react";
import { getVersion } from "@tauri-apps/api/app";

const GITHUB_REPO = "balkrishnaacharya/ccna-practice";

export function useUpdater({ autoCheck = true, isExamActive = false } = {}) {
  const [status, setStatus] = useState("idle"); // idle | checking | available | up-to-date | downloading | error
  const [currentVersion, setCurrentVersion] = useState("0.4.0"); // fallback; overwritten by Tauri on mount
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
  const hasAutoCheckedRef = useRef(false);
  const activeUpdateRef = useRef(null);

  // Resolve the installed version from Tauri at runtime so it never drifts from tauri.conf.json
  useEffect(() => {
    getVersion().then(setCurrentVersion).catch(() => {/* keep fallback */});
  }, []);

  // Check for updates
  const checkForUpdates = useCallback(async (isManual = false) => {
    if (isExamActive && !isManual) return;

    setStatus("checking");
    setErrorMessage("");

    try {
      if (isAndroid) {
        // Android flow: Query GitHub Releases API
        const response = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
          { headers: { Accept: "application/vnd.github.v3+json" } }
        );

        if (!response.ok) {
          throw new Error(`Failed to check releases (HTTP ${response.status})`);
        }

        const data = await response.json();
        const latestTag = data.tag_name || "";
        const cleanTag = latestTag.replace(/^v/, "");

        // Find signed APK asset
        const apkAsset = data.assets?.find(
          (a) => a.name.endsWith(".apk") && !a.name.includes("unsigned")
        );

        if (cleanTag && cleanTag !== currentVersion && isVersionGreater(cleanTag, currentVersion)) {
          setUpdateInfo({
            version: cleanTag,
            body: data.body || "A new signed release is available.",
            date: data.published_at,
            downloadUrl: apkAsset?.browser_download_url || data.html_url,
            isAndroid: true,
          });
          setStatus("available");
          setShowModal(true);
        } else {
          setStatus("up-to-date");
          if (isManual) setShowModal(false);
        }
      } else {
        // Desktop flow: Use official Tauri 2 updater plugin
        try {
          const { check } = await import("@tauri-apps/plugin-updater");
          const update = await check();

          if (update && update.available) {
            activeUpdateRef.current = update;
            setUpdateInfo({
              version: update.version,
              body: update.body || "Security and feature improvements.",
              date: update.date,
              isAndroid: false,
            });
            setStatus("available");
            setShowModal(true);
          } else {
            setStatus("up-to-date");
            if (isManual) setShowModal(false);
          }
        } catch (tauriError) {
          // If Tauri updater is unconfigured or offline, fallback to GitHub release check
          console.warn("Tauri updater check unconfigured or failed, checking releases:", tauriError);
          const response = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
            { headers: { Accept: "application/vnd.github.v3+json" } }
          );

          if (response.ok) {
            const data = await response.json();
            const cleanTag = (data.tag_name || "").replace(/^v/, "");
            if (cleanTag && isVersionGreater(cleanTag, currentVersion)) {
              setUpdateInfo({
                version: cleanTag,
                body: data.body || "Update available on GitHub.",
                date: data.published_at,
                downloadUrl: data.html_url,
                isAndroid: false,
              });
              setStatus("available");
              setShowModal(true);
              return;
            }
          }
          setStatus("up-to-date");
        }
      }
    } catch (err) {
      console.error("Update check failed:", err);
      setStatus("error");
      setErrorMessage(err.message || "Failed to connect to update service.");
    }
  }, [isAndroid, isExamActive, currentVersion]);

  // Execute update installation
  const applyUpdate = useCallback(async () => {
    if (!updateInfo) return;

    if (updateInfo.isAndroid && updateInfo.downloadUrl) {
      // Android: open APK download in system browser/downloader.
      // Tauri's webview blocks window.open for external URLs, so use the
      // shell plugin (registered in lib.rs) which hands the URL to the OS.
      try {
        const { open } = await import("@tauri-apps/plugin-shell");
        await open(updateInfo.downloadUrl);
      } catch (err) {
        console.warn("Shell open unavailable, falling back to window.open:", err);
        window.open(updateInfo.downloadUrl, "_blank");
      }
      setShowModal(false);
      return;
    }

    if (activeUpdateRef.current) {
      try {
        setStatus("downloading");
        setDownloadProgress(0);

        let downloaded = 0;
        let contentLength = 0;

        await activeUpdateRef.current.downloadAndInstall((event) => {
          if (event.event === "Started") {
            contentLength = event.data.contentLength || 0;
          } else if (event.event === "Progress") {
            downloaded += event.data.chunkLength || 0;
            if (contentLength > 0) {
              setDownloadProgress(Math.round((downloaded / contentLength) * 100));
            }
          } else if (event.event === "Finished") {
            setDownloadProgress(100);
          }
        });

        // Relaunch using Tauri process plugin
        const { relaunch } = await import("@tauri-apps/plugin-process");
        await relaunch();
      } catch (err) {
        console.error("Failed to download/install update:", err);
        setStatus("error");
        setErrorMessage(err.message || "Installation failed.");
      }
    } else if (updateInfo.downloadUrl) {
      // Desktop fallback path (no Tauri updater manifest): hand the release
      // URL to the OS browser. window.open is a no-op inside the Tauri webview.
      try {
        const { open } = await import("@tauri-apps/plugin-shell");
        await open(updateInfo.downloadUrl);
      } catch (err) {
        console.warn("Shell open unavailable, falling back to window.open:", err);
        window.open(updateInfo.downloadUrl, "_blank");
      }
      setShowModal(false);
    }
  }, [updateInfo]);

  // Automatic startup check after 3 seconds
  useEffect(() => {
    if (!autoCheck || hasAutoCheckedRef.current) return;
    hasAutoCheckedRef.current = true;

    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [autoCheck, checkForUpdates]);

  return {
    status,
    currentVersion: currentVersion,
    updateInfo,
    downloadProgress,
    errorMessage,
    showModal,
    setShowModal,
    checkForUpdates: () => checkForUpdates(true),
    applyUpdate,
  };
}

export function isVersionGreater(remote, local) {
  const rParts = remote.split(".").map(Number);
  const lParts = local.split(".").map(Number);
  for (let i = 0; i < Math.max(rParts.length, lParts.length); i++) {
    const r = rParts[i] || 0;
    const l = lParts[i] || 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}
