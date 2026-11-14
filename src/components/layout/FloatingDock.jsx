import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { invoke } from "@tauri-apps/api/core";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
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
  const navRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [flashcardCount, setFlashcardCount] = useState(0);

  const today = new Date().toISOString().split("T")[0];

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    invoke("get_flashcard_due_count", { today })
      .then((c) => setFlashcardCount(Number(c) || 0))
      .catch(console.error);
  }, [today]);

  useGSAP(
    () => {
      if (!mounted || prefersReducedMotion) return;
      gsap.from(navRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        force3D: true,
      });
    },
    { dependencies: [mounted] },
  );

  const isActive = (to) => location.pathname === to;

  return (
    <nav
      ref={navRef}
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-3 sm:px-6 pointer-events-none"
      style={{ paddingBottom: "var(--safe-bottom)" }}
      aria-label="Main navigation"
    >
      <div className="pointer-events-auto relative w-full max-w-3xl mx-auto bg-[#181815]/90 backdrop-blur-md border border-[#4A443A]/40 rounded-full px-2 sm:px-3 py-2 shadow-dock flex items-center justify-between">
        {DOCK_ITEMS.map((item) => {
          const active = isActive(item.to);
          const showBadge = item.to === "/flashcards" && flashcardCount > 0;
          return (
            <Tooltip key={item.to} delayDuration={0}>
              <TooltipTrigger asChild>
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
                    <Badge
                      className="absolute -top-1 -right-1 px-1 py-0.5 text-[10px] font-bold border border-[#181815]"
                      variant="destructive"
                    >
                      {flashcardCount > 9 ? "9+" : flashcardCount}
                    </Badge>
                  )}
                  <span className="text-[10px] font-semibold mt-0.5 uppercase tracking-tighter">
                    {item.label}
                  </span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top">
                {item.label}{showBadge ? ` (${flashcardCount} due)` : ""}
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Center Exam button */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-8 flex flex-col items-center pointer-events-auto z-20">
          <Button
            onClick={onOpenExamModal}
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-[#B8842A]/10 text-[#B8842A] hover:bg-[#B8842A]/20 border border-[#B8842A]/30 shadow-lg shadow-[#B8842A]/20"
            aria-label="Take Full CCNA Exam"
          >
            <Timer size={18} strokeWidth={2} />
          </Button>
          <span className="text-[10px] font-semibold text-[#B8842A] mt-0.5 uppercase tracking-tighter">
            Exam
          </span>
        </div>
      </div>

      {/* Active indicator dot for mobile */}
      <div className="flex justify-center gap-1 mt-1 opacity-0 transition-opacity duration-200">
        {DOCK_ITEMS.map((item, i) => (
          <div
            key={item.to}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-colors duration-150",
              isActive(item.to)
                ? "bg-[#B8842A]"
                : "bg-[#4A443A]/40",
            )}
          />
        ))}
      </div>
    </nav>
  );
}
