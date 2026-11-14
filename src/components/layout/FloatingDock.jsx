import { useState, useRef, useEffect } from "react";
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

const DOCK_ITEM_ANIMATION_DELAY = 0.08;

export default function FloatingDock({ onOpenExamModal, guardNavigation }) {
  const location = useLocation();
  const [flashcardCount, setFlashcardCount] = useState(0);

  // Quick flashcard count refresh on mount
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    invoke("get_flashcard_due_count", { today })
      .then((c) => setFlashcardCount(Number(c) || 0))
      .catch(console.error);
  }, []);

  const isActive = (to) => location.pathname === to;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col sm:flex-row justify-center px-4 sm:px-6"
      style={{ paddingBottom: "var(--safe-bottom)" }}
      aria-label="Main navigation"
    >
      <Dock
        direction="bottom"
        iconSize={30}
        iconMagnification={40}
        iconDistance={100}
        className="gap-3"
      >
        {DOCK_ITEMS.map((item, index) => {
          const active = isActive(item.to);
          const showBadge = item.to === "/flashcards" && flashcardCount > 0;
          const delay = index * DOCK_ITEM_ANIMATION_DELAY;
          return (
            <DockIcon
              key={item.to}
              className="relative"
              style={{ animationDelay: `${delay}s` }}
            >
              <Link
                to={item.to}
                onClick={(e) => guardNavigation(e, item.to)}
                className={cn(
                  "group flex flex-col items-center justify-center rounded-full transition-colors duration-150 select-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 outline-none",
                  active
                    ? "bg-[#B8842A]/15 text-[#B8842A]"
                    : "text-[#A09A8A] hover:text-[#F6F2E9] hover:bg-[#1F2935]",
                  "sm:px-2 sm:py-1",
                )}
                aria-label={item["aria-label"]}
                title={item.label}
              >
                <span className="flex-1 flex flex-col items-center gap-1 text-xs font-medium">
                  {item.icon}
                  {showBadge && (
                    <span className="absolute -top-0.5 -right-1 px-1 py-0 rounded-full bg-[#B8842A] text-dark-bg text-[9px] font-bold">
                      {flashcardCount > 9 ? "9+" : flashcardCount}
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-[10px] font-semibold mt-0.5 opacity-0 transition-opacity duration-200",
                      active
                        ? "opacity-100"
                        : "group-hover:opacity-100",
                    )}
                  >
                    {item.label}
                  </span>
                </span>
              </Link>
            </DockIcon>
          );
        })}
      </Dock>

      {/* Center floating Exam action button — opens the exam confirmation modal */}
      <div className="mt-1.5 sm:mt-0 flex flex-col sm:flex-row items-center justify-center pointer-events-auto z-20">
        <Button
          onClick={(e) => {
            e.preventDefault();
            onOpenExamModal();
          }}
          variant="ghost"
          size="icon"
          className={`w-11 h-11 rounded-full bg-[#B8842A]/10 text-[#B8842A] hover:bg-[#B8842A]/20 border border-[#B8842A]/25 focus-visible:ring-2 focus-visible:ring-gold ${window.innerWidth < 640 ? 'w-9 h-9' : ''}`}
          aria-label="Take Full CCNA Exam"
        >
          <Timer size={16} strokeWidth={1.5} />
        </Button>
        {window.innerWidth >= 640 && (
          <span className="text-[10px] font-semibold mt-0.5 text-[#B8842A]">
            Exam
          </span>
        )}
      </div>
    </nav>
  );
}
