import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Menu,
  ChevronLeft,
  Home,
  BookOpen,
  Calculator,
  Timer,
  History,
  Settings,
  ShieldAlert,
} from "lucide-react";

export const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: <Home size={18} strokeWidth={2} />, key: "dashboard" },
  { to: "/quiz", label: "Practice", icon: <BookOpen size={18} strokeWidth={2} />, key: "practice" },
  { to: "/practical-exam", label: "Labs", icon: <Timer size={18} strokeWidth={2} />, key: "labs" },
  { to: "/tools/subnet", label: "Subnet", icon: <Calculator size={18} strokeWidth={2} />, key: "subnet" },
  { to: "/flashcards", label: "Flashcards", icon: <BookOpen size={18} strokeWidth={2} />, key: "flashcards" },
  { to: "/review", label: "Review", icon: <ShieldAlert size={18} strokeWidth={2} />, key: "review" },
  { to: "/history", label: "History", icon: <History size={18} strokeWidth={2} />, key: "history" },
  { to: "/settings", label: "Settings", icon: <Settings size={18} strokeWidth={2} />, key: "settings" },
];

export function Sidebar({
  isOpen,
  setIsOpen,
  isMobile = false,
  guardNavigation,
  onOpenExamModal,
}) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "h-full flex flex-col border-r border-dark-border bg-dark-surface transition-[width] duration-300 select-none",
        isMobile ? "w-64" : isOpen ? "w-64" : "w-20"
      )}
      aria-label="Main sidebar navigation"
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-dark-border shrink-0">
        <Link
          to="/"
          onClick={(e) => guardNavigation?.(e, "/")}
          className="flex items-center gap-2.5 overflow-hidden"
        >
          <span className="w-7 h-7 rounded-full bg-gold text-dark-bg flex items-center justify-center text-xs font-bold shadow-gold-glow shrink-0">
            2.0
          </span>
          {(isOpen || isMobile) && (
            <span className="font-serif text-base tracking-wide text-paper whitespace-nowrap">
              CCNA <span className="italic text-gold font-normal">Practice</span>
            </span>
          )}
        </Link>
        {!isMobile && (
          <button
            type="button"
            onClick={() => setIsOpen?.(!isOpen)}
            className="p-1.5 rounded-lg text-paper-dim hover:text-paper hover:bg-dark-elevated transition-colors shrink-0"
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
          </button>
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto" aria-label="Main menu">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);

          return (
            <Link
              key={item.key}
              to={item.to}
              onClick={(e) => guardNavigation?.(e, item.to)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors duration-150 group",
                isActive
                  ? "bg-gold/15 text-gold border border-gold/30 shadow-gold-glow"
                  : "text-paper hover:text-paper hover:bg-dark-elevated border border-transparent",
                !isOpen && !isMobile && "justify-center px-0"
              )}
              title={!isOpen && !isMobile ? item.label : undefined}
              aria-label={item.label}
            >
              <span className="shrink-0 group-hover:scale-105 transition-transform">
                {item.icon}
              </span>
              {(isOpen || isMobile) && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Full Exam CTA */}
      <div className="p-3 border-t border-dark-border shrink-0">
        {isOpen || isMobile ? (
          <button
            type="button"
            onClick={onOpenExamModal}
            className="w-full py-2.5 px-4 bg-gold hover:bg-gold-hover text-dark-bg font-semibold rounded-xl text-xs tracking-wider uppercase transition-all shadow-gold-glow flex items-center justify-center gap-2"
          >
            <span>Full Exam</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenExamModal}
            className="w-full py-2.5 bg-gold hover:bg-gold-hover text-dark-bg font-bold rounded-xl text-xs shadow-gold-glow flex items-center justify-center"
            title="Take Full CCNA Exam"
            aria-label="Take Full CCNA Exam"
          >
            <Timer size={18} />
          </button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
