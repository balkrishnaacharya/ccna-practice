import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu, X, Home, BookOpen, Calculator, Timer, History, Settings, ShieldAlert } from "lucide-react";

const SIDEBAR_WIDTH = 260;
const COLLAPSED_WIDTH = 100;

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

export const Sidebar = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (to) => {
    navigate(to);
    setIsOpen(false);
  };

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 w-${isOpen ? SIDEBAR_WIDTH : COLLAPSED_WIDTH} border-r border-dark-border bg-dark-surface shadow-lg z-50 transition-all duration-300`}
      aria-label="Main sidebar"
    >
      <div className="flex flex-col h-full">
        {/* Brand header */}
        <div className="flex items-center justify-between px-3 py-4">
          <Link
            to="/"
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="w-7 h-7 rounded-full bg-gold text-dark-bg flex items-center justify-center text-xs font-bold shadow-gold-glow">
              2.0
            </span>
            {isOpen && (
              <span className="font-serif text-base tracking-wide text-paper">
                CCNA Practice
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-md hover:bg-dark-surface/50 transition-colors"
            aria-label="Toggle sidebar"
          >
            {isOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.key}
                to={item.to}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick(item.to);
                }}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors duration-200",
                  isActive
                    ? "bg-gold/10 text-gold"
                    : "text-paper hover:text-gold hover:bg-dark-surface/50",
                  !isOpen && "justify-center gap-0 px-2"
                )}
                aria-label={item.label}
              >
                <span className="w-5 h-5 rounded-full flex-shrink-0">{item.icon}</span>
                {isOpen && (
                  <span className="hidden sm:block">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom action button - Full Exam */}
        {isOpen && (
          <div className="mt-6 pt-6 border-t border-border/30 px-3">
            <Link
              to="/exam"
              onClick={(e) => {
                e.stopPropagation();
                handleClick("/exam");
              }}
              className="w-full bg-gold text-dark-bg text-xs font-semibold rounded-full py-3 shadow-gold-glow transition-colors hover:bg-gold-hover"
            >
              Take Full CCNA Exam
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};
