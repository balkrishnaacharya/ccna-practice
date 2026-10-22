export default function OrganicMeshBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-dark-bg"
      style={{
        background: `
          radial-gradient(at 15% 15%, rgba(92, 110, 78, 0.08) 0px, transparent 50%),
          radial-gradient(at 85% 85%, rgba(184, 132, 42, 0.07) 0px, transparent 50%),
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
        className="animate-mesh-blob-1 absolute -top-24 -left-24 w-[30rem] h-[30rem] rounded-full blur-[75px] opacity-25 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(92, 110, 78, 0.40) 0%, rgba(92, 110, 78, 0.08) 55%, transparent 75%)",
        }}
      />

      {/* Organic Shape 2: Polpharma Gold #B8842A fluid mesh blob */}
      <div
        className="animate-mesh-blob-2 absolute -bottom-28 -right-28 w-[32rem] h-[32rem] rounded-full blur-[80px] opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(184, 132, 42, 0.35) 0%, rgba(184, 132, 42, 0.06) 60%, transparent 75%)",
        }}
      />

      {/* Organic Shape 3: Gentle ambient core highlight */}
      <div
        className="animate-mesh-blob-3 absolute top-1/2 left-1/2 w-[24rem] h-[24rem] rounded-full blur-[90px] opacity-15 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(92, 110, 78, 0.25) 0%, rgba(184, 132, 42, 0.15) 45%, transparent 70%)",
        }}
      />
    </div>
  );
}

