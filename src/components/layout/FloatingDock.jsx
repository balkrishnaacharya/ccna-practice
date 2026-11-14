import { useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dock, DockIcon } from "@/components/ui/dock";
import { Home, BookOpen, Calculator, Timer, History, Settings, ShieldAlert, Terminal } from "lucide-react";

const DOCK_ITEMS = [
  { to: "/", label: "Home", icon: <Home size={18} strokeWidth={2} />, "aria-label": "Home" },
  { to: "/quiz", label: "Practice", icon: <BookOpen size={18} strokeWidth={2} />, "aria-label": "Practice" },
  { to: "/practical-exam", label: "Labs", icon: <Terminal size={18} strokeWidth={2} />, "aria-label": "Labs" },
  { to: "/tools/subnet", label: "Subnet", icon: <Calculator size={18} strokeWidth={2} />, "aria-label": "Subnet Calculator" },
  { to: "/flashcards", label: "Flashcards", icon: <BookOpen size={18} strokeWidth={2} />, "aria-label": "Flashcards" },
  { to: "/review", label: "Review", icon: <ShieldAlert size={18} strokeWidth={2} />, "aria-label": "Review" },
  { to: "/history", label: "History", icon: <History size={18} strokeWidth={2} />, "aria-label": "History" },
  { to: "/settings", label: "Settings", icon: <Settings size={18} strokeWidth={2} />, "aria-label": "Settings" },
];

export default function FloatingDock({ onOpenExamModal, guardNavigation }) {
  const location = useLocation();
  const [flashcardCount, setFlashcardCount] = useState(0);

  const today = new Date().toISOString().split("T")[0];

  useState(() => {
    invoke("get_flashcard_due_count", { today })
      .then((c) => setFlashcardCount(Number(c) || 0))
      .catch(console.error);
  }, []);

  const isActive = (to) => location.pathname === to;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-3 sm:px-6 pointer-events-none"
      style={{ paddingBottom: "var(--safe-bottom)" }}
      aria-label="Main navigation"
    >
      <Dock direction="bottom" iconSize={34} iconMagnification={52} iconDistance={100}>
        {DOCK_ITEMS.map((item) => {
          const active = isActive(item.to);
          const showBadge = item.to === "/flashcards" && flashcardCount > 0;
          return (
            <DockIcon key={item.to} className="relative">
              <Link
                to={item.to}
                onClick={(e) => guardNavigation(e, item.to)}
                className={cn(
                  "flex flex-col items-center justify-center px-2 py-1.5 min-w-[44px] rounded-full transition-colors duration-150 select-none relative",
                  active
                    ? "bg-[#B8842A]/10 text-[#B8842A]"
                    : "text-[#A09A8A] hover:text-[#F6F2E9] hover:bg-[#4A443A]/30",
                )}
                aria-label={item["aria-label"]}
                title={item.label}
              >
                {item.icon}
                {showBadge && (
                  <span
                    className="absolute -top-1 -right-1 px-1 py-0.5 text-[10px] font-bold border border-[#181815]"
                  >
                    {flashcardCount > 9 ? "9+" : flashcardCount}
                  </span>
                )}
                <span className="text-[10px] font-semibold mt-0.5">
                  {item.label}
                </span>
              </Link>
            </DockIcon>
          );
        })}
      </Dock>

      {/* Center floating Exam action button */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col items-center pointer-events-auto z-20">
        <Button
          onClick={onOpenExamModal}
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full bg-[#B8842A]/10 text-[#B8842A] hover:bg-[#B8842A]/20 border border-[#B8842A]/30 shadow-lg shadow-[#B8842A]/20"
          aria-label="Take Full CCNA Exam"
        >
          <Timer size={18} strokeWidth={2} />
        </Button>
        <span className="text-[10px] font-semibold mt-0.5 text-[#B8842A]">
          Exam
        </span>
      </div>
    </nav>
  );
}
