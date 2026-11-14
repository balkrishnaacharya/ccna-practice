import { useRef } from "react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

export default function ExportProgress({
  readinessScore,
  currentStreak,
  totalAnswered,
  domainBreakdown = [],
}) {
  const cardRef = useRef(null);
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function handleExport() {
    if (!cardRef.current) return;

    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#181815",
      scale: 2,
      logging: false,
      useCORS: true,
    });

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `ccna-progress-${today.replace(/\s+/g, "-")}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const domainMiniBars = domainBreakdown.map((d) => {
    const pct = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
    const color =
      pct >= 80 ? "#5C6E4E" : pct >= 60 ? "#B8842A" : "#C1633C";
    return (
      <div key={d.domain} className="flex items-center gap-2 mb-1">
        <span className="w-16 text-xs text-paper-muted">{d.domain.replace(/_/g, " ")}</span>
        <div className="flex-1 h-2 bg-[#3A342A] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <span className="w-8 text-[10px] text-right text-paper font-mono">{pct}%</span>
      </div>
    );
  });

  return (
    <div>
      <Button
        onClick={handleExport}
        variant="outline"
        size="sm"
        className="w-full"
      >
        <Share2 className="w-3 h-3 mr-1" />
        Share Progress
      </Button>

      {/* Hidden export card */}
      <div
        ref={cardRef}
        className="hidden print:block w-80 bg-[#181815] border border-[#4A443A]/40 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#B8842A]/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#B8842A]">2.0</span>
            </div>
            <div>
              <div className="font-serif text-base font-semibold text-paper">CCNA Practice</div>
              <div className="text-[10px] text-paper-dim">CCNA 2.0 Practice App</div>
            </div>
          </div>
          <div className="text-[10px] text-paper-dim text-right">{today}</div>
        </div>

        <div className="mb-6">
          <div className="text-[10px] text-paper-muted uppercase tracking-wider mb-1">Readiness Score</div>
          <div className="text-3xl font-bold text-paper">{readinessScore?.value || 0}%</div>
          <div className="text-xs text-paper-muted mt-1">
            {readinessScore?.label || "Keep practicing"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#3A342A]/50 border border-[#4A443A]/30 rounded-xl p-3">
            <div className="text-[10px] text-paper-muted uppercase tracking-wider mb-1">Streak</div>
            <div className="text-xl font-mono text-gold">{currentStreak || 0} days</div>
          </div>
          <div className="bg-[#3A342A]/50 border border-[#4A443A]/30 rounded-xl p-3">
            <div className="text-[10px] text-paper-muted uppercase tracking-wider mb-1">Questions</div>
            <div className="text-xl font-mono text-paper">{totalAnswered || 0}</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-[10px] text-paper-muted uppercase tracking-wider mb-2">Domain Breakdown</div>
          {domainMiniBars}
        </div>

        <div className="border-t border-[#4A443A]/30 pt-4">
          <div className="text-[10px] text-paper-muted text-center">
            Generated from CCNA Practice App — Local-first study tool
          </div>
        </div>
      </div>
    </div>
  );
}
