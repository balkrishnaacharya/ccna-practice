import { useEffect, useState } from "react";

export default function OrganicMeshBackground() {
  const [paused, setPaused] = useState(false);

  // Don't burn GPU on the blob animation while the app is backgrounded.
  useEffect(() => {
    const sync = () => setPaused(document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden bg-dark-bg ${paused ? "mesh-paused" : ""}`}
      style={{
        background: `
          radial-gradient(at 15% 15%, rgba(92, 110, 78, 0.08) 0px, transparent 50%),
          radial-gradient(at 85% 85%, rgba(189, 141, 57, 0.07) 0px, transparent 50%),
          radial-gradient(at 50% 40%, rgba(92, 110, 78, 0.04) 0px, transparent 60%),
          #181815
        `,
      }}
    >
      {/* Subtle architectural coordinate grid: 32px spacing, ultra faint */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(#F6F2E9 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Organic Shape 1: Polpharma Sage #5C6E4E fluid mesh blob */}
      <div
        className="animate-mesh-blob-1 absolute -left-24 -top-24 h-[30rem] w-[30rem] rounded-full opacity-25 blur-[75px]"
        style={{
          background:
            "radial-gradient(circle, rgba(92, 110, 78, 0.40) 0%, rgba(92, 110, 78, 0.08) 55%, transparent 75%)",
        }}
      />

      {/* Organic Shape 2: Polpharma Gold #BD8D39 fluid mesh blob */}
      <div
        className="animate-mesh-blob-2 absolute -bottom-28 -right-28 h-[32rem] w-[32rem] rounded-full opacity-20 blur-[80px]"
        style={{
          background:
            "radial-gradient(circle, rgba(189, 141, 57, 0.35) 0%, rgba(189, 141, 57, 0.06) 60%, transparent 75%)",
        }}
      />

      {/* Organic Shape 3: Gentle ambient core highlight */}
      <div
        className="animate-mesh-blob-3 absolute left-1/2 top-1/2 h-[24rem] w-[24rem] rounded-full opacity-15 blur-[90px]"
        style={{
          background:
            "radial-gradient(circle, rgba(92, 110, 78, 0.25) 0%, rgba(189, 141, 57, 0.15) 45%, transparent 70%)",
        }}
      />
    </div>
  );
}
