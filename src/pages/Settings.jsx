import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function Settings({ onProfileChange, updater }) {
  const [name, setName] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  useEffect(() => {
    invoke("get_setting", { key: "profile_name" })
      .then((val) => {
        if (val) setName(val);
      })
      .catch(console.error);
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    try {
      await invoke("set_setting", { key: "profile_name", value: name.trim() });
      setSavedMsg("Profile name saved successfully!");
      if (onProfileChange) onProfileChange(name.trim());
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleResetStats() {
    try {
      await invoke("reset_stats");
      setResetConfirm(false);
      setResetMsg("All quiz statistics and history have been reset.");
      setTimeout(() => setResetMsg(""), 4000);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-paper">Settings</h1>
        <p className="text-sm text-paper-muted mt-1 font-sans">
          Manage your local candidate profile, system preferences, and application updates.
        </p>
      </div>

      {/* Profile Section */}
      <div className="border border-dark-border rounded-2xl p-6 bg-dark-card shadow-dock space-y-4">
        <div>
          <h2 className="font-serif text-xl font-semibold text-paper mb-1">Local Profile</h2>
          <p className="text-xs text-paper-dim">
            All candidate data remains strictly local on this device. No cloud sync, external telemetry, or passwords.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4 max-w-md pt-1">
          <div>
            <label htmlFor="profileName" className="block text-xs font-medium text-paper-muted mb-1.5">
              Candidate Display Name
            </label>
            <input
              id="profileName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Network Engineer Alex"
              className="w-full px-3.5 py-2.5 border border-dark-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-gold text-paper bg-dark-surface"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-gold hover:bg-gold-hover text-dark-bg text-xs font-semibold uppercase tracking-wider rounded-full shadow-gold-glow transition-all"
            >
              Save Profile
            </button>
            {savedMsg && (
              <span className="text-xs font-semibold text-sage-light bg-sage/20 px-3 py-1 rounded-full border border-sage/40 shadow-sage-glow">
                {savedMsg}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Software Updates Section */}
      <div className="border border-dark-border rounded-2xl p-6 bg-dark-card shadow-dock space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold text-paper mb-1">Application Updates</h2>
            <p className="text-xs text-paper-dim font-sans">
              Verify your installation against verified signed releases.
            </p>
          </div>
          <span className="text-xs font-mono text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/30">
            Version {updater?.currentVersion || "0.2.0"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            disabled={updater?.status === "checking" || updater?.status === "downloading"}
            onClick={() => updater?.checkForUpdates()}
            className="px-5 py-2.5 bg-dark-surface hover:bg-dark-elevated text-paper hover:text-gold border border-dark-border text-xs font-semibold uppercase tracking-wider rounded-full transition-colors flex items-center gap-2 disabled:opacity-40"
          >
            {updater?.status === "checking" && (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-gold border-t-transparent animate-spin" />
            )}
            <span>
              {updater?.status === "checking"
                ? "Checking..."
                : updater?.status === "downloading"
                ? "Downloading..."
                : "Check for Updates"}
            </span>
          </button>

          {updater?.status === "up-to-date" && (
            <span className="text-xs font-medium text-sage-light bg-sage/20 px-3.5 py-1.5 rounded-full border border-sage/40 shadow-sage-glow">
              ✓ App is up to date (v{updater.currentVersion})
            </span>
          )}

          {updater?.status === "available" && (
            <button
              type="button"
              onClick={() => updater.setShowModal(true)}
              className="text-xs font-semibold text-dark-bg bg-gold px-3.5 py-1.5 rounded-full shadow-gold-glow animate-pulse"
            >
              Update Available (v{updater.updateInfo?.version}) →
            </button>
          )}

          {updater?.status === "error" && (
            <span className="text-xs font-medium text-heart-light bg-heart/15 px-3.5 py-1.5 rounded-full border border-heart/30">
              {updater.errorMessage || "Unable to reach update service."}
            </span>
          )}
        </div>
      </div>

      {/* Blueprint Info */}
      <div className="border border-dark-border rounded-2xl p-6 bg-dark-card shadow-dock space-y-4">
        <div>
          <h2 className="font-serif text-xl font-semibold text-paper mb-1">CCNA 2.0 Blueprint Allocation</h2>
          <p className="text-xs text-paper-dim">
            Exam simulations strictly mirror the 100-question distribution across the 5 core blueprint domains:
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex justify-between p-3.5 rounded-xl bg-dark-surface/60 border border-dark-border">
            <span className="font-medium text-paper">Network Infrastructure</span>
            <span className="text-gold font-mono font-semibold">25% (25 Qs)</span>
          </div>
          <div className="flex justify-between p-3.5 rounded-xl bg-dark-surface/60 border border-dark-border">
            <span className="font-medium text-paper">Switching & Network Access</span>
            <span className="text-gold font-mono font-semibold">25% (25 Qs)</span>
          </div>
          <div className="flex justify-between p-3.5 rounded-xl bg-dark-surface/60 border border-dark-border">
            <span className="font-medium text-paper">IP Routing</span>
            <span className="text-gold font-mono font-semibold">20% (20 Qs)</span>
          </div>
          <div className="flex justify-between p-3.5 rounded-xl bg-dark-surface/60 border border-dark-border">
            <span className="font-medium text-paper">Services & Security</span>
            <span className="text-gold font-mono font-semibold">20% (20 Qs)</span>
          </div>
          <div className="flex justify-between p-3.5 rounded-xl bg-dark-surface/60 border border-dark-border sm:col-span-2">
            <span className="font-medium text-paper">AI, NetOps & Automation</span>
            <span className="text-gold font-mono font-semibold">10% (10 Qs)</span>
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset Stats */}
      <div className="border border-heart/30 rounded-2xl p-6 bg-heart/5 shadow-dock space-y-4">
        <div>
          <h2 className="font-serif text-xl font-semibold text-heart-light mb-1">Reset Statistics</h2>
          <p className="text-xs text-paper-muted">
            Clear all previous quiz attempts and exam history records. Question bank items will not be deleted.
          </p>
        </div>

        {resetMsg && (
          <div className="text-xs font-semibold text-sage-light bg-sage/20 p-3 rounded-xl border border-sage/40">
            {resetMsg}
          </div>
        )}

        {!resetConfirm ? (
          <button
            onClick={() => setResetConfirm(true)}
            className="px-5 py-2.5 border border-heart/40 text-heart-light hover:bg-heart/15 text-xs font-semibold uppercase tracking-wider rounded-full transition-colors"
          >
            Reset Quiz &amp; Exam Progress
          </button>
        ) : (
          <div className="p-4 bg-dark-card border border-heart/40 rounded-2xl max-w-md space-y-3 shadow-dock">
            <p className="text-xs text-heart-light font-medium">
              Are you sure? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleResetStats}
                className="px-4 py-1.5 bg-heart hover:bg-heart-hover text-paper text-xs font-semibold rounded-full shadow-heart-glow"
              >
                Yes, Clear All Progress
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="px-4 py-1.5 border border-dark-border hover:bg-dark-surface text-paper-muted text-xs font-medium rounded-full"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
