import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function Settings({ onProfileChange }) {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#0d0d0d]">Settings</h1>
        <p className="text-sm text-[#5a5a5a] mt-1">
          Manage your local profile display name and practice preferences.
        </p>
      </div>

      {/* Profile Section */}
      <div className="border border-[#e5e5e5] rounded-2xl p-5 sm:p-6 bg-white shadow-sm">
        <h2 className="text-base font-medium text-[#0d0d0d] mb-1">Local Profile</h2>
        <p className="text-xs text-[#5a5a5a] mb-4">
          All data remains strictly on your device. No cloud sync, accounts, or passwords required.
        </p>

        <form onSubmit={handleSave} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="profileName" className="block text-xs font-medium text-[#5a5a5a] mb-1.5">
              Candidate Display Name
            </label>
            <input
              id="profileName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Network Engineer Alex"
              className="w-full px-3.5 py-2.5 border border-[#e5e5e5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4d6bfe] focus:border-transparent text-[#0d0d0d] bg-white"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#4d6bfe] hover:bg-[#3b59e9] text-white text-xs font-medium tracking-wide rounded-full shadow-sm transition-colors duration-150"
            >
              Save Profile Name
            </button>
            {savedMsg && (
              <span className="text-xs font-medium text-[#0e6245] bg-[#e6f7ee] px-3 py-1 rounded-full border border-[#8ed4b0]">
                {savedMsg}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Blueprint Info */}
      <div className="border border-[#e5e5e5] rounded-2xl p-5 sm:p-6 bg-white shadow-sm">
        <h2 className="text-base font-medium text-[#0d0d0d] mb-1">CCNA 2.0 Blueprint Allocation</h2>
        <p className="text-xs text-[#5a5a5a] mb-4">
          Exam simulations strictly mirror the 100-question distribution across the 5 core domains:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between p-3.5 rounded-xl bg-[#f7f7f9] border border-[#e5e5e5]">
            <span className="font-medium text-[#0d0d0d]">Network Infrastructure</span>
            <span className="text-[#4d6bfe] font-semibold">25% (25 Qs)</span>
          </div>
          <div className="flex justify-between p-3.5 rounded-xl bg-[#f7f7f9] border border-[#e5e5e5]">
            <span className="font-medium text-[#0d0d0d]">Switching & Network Access</span>
            <span className="text-[#4d6bfe] font-semibold">25% (25 Qs)</span>
          </div>
          <div className="flex justify-between p-3.5 rounded-xl bg-[#f7f7f9] border border-[#e5e5e5]">
            <span className="font-medium text-[#0d0d0d]">IP Routing</span>
            <span className="text-[#4d6bfe] font-semibold">20% (20 Qs)</span>
          </div>
          <div className="flex justify-between p-3.5 rounded-xl bg-[#f7f7f9] border border-[#e5e5e5]">
            <span className="font-medium text-[#0d0d0d]">Services & Security</span>
            <span className="text-[#4d6bfe] font-semibold">20% (20 Qs)</span>
          </div>
          <div className="flex justify-between p-3.5 rounded-xl bg-[#f7f7f9] border border-[#e5e5e5] sm:col-span-2">
            <span className="font-medium text-[#0d0d0d]">AI, NetOps & Automation</span>
            <span className="text-[#4d6bfe] font-semibold">10% (10 Qs)</span>
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset Stats */}
      <div className="border border-[#f0a5a0] rounded-2xl p-5 sm:p-6 bg-[#fdecea]/30">
        <h2 className="text-base font-medium text-[#b3261e] mb-1">Reset Statistics</h2>
        <p className="text-xs text-[#5a5a5a] mb-4">
          Clear all previous quiz answers and historical exam score records. This will not delete questions from the question bank.
        </p>

        {resetMsg && (
          <div className="mb-4 text-xs font-medium text-[#0e6245] bg-[#e6f7ee] p-2.5 rounded-xl border border-[#8ed4b0]">
            {resetMsg}
          </div>
        )}

        {!resetConfirm ? (
          <button
            onClick={() => setResetConfirm(true)}
            className="px-5 py-2.5 border border-[#f0a5a0] text-[#b3261e] hover:bg-[#fdecea] text-xs font-medium tracking-wide rounded-full transition-colors duration-150"
          >
            Reset Quiz & Exam Progress
          </button>
        ) : (
          <div className="p-4 bg-white border border-[#f0a5a0] rounded-2xl max-w-md space-y-3">
            <p className="text-xs text-[#b3261e] font-medium">
              Are you sure? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleResetStats}
                className="px-4 py-1.5 bg-[#b3261e] hover:bg-red-700 text-white text-xs font-medium rounded-full shadow-sm"
              >
                Yes, Clear All Progress
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="px-4 py-1.5 border border-[#e5e5e5] hover:bg-[#f7f7f9] text-[#5a5a5a] text-xs font-medium rounded-full"
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
