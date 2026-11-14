import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu, X, Home, BookOpen, Calculator, Timer, History, Settings, ShieldAlert, } from "lucide-react";

const SIDEBAR_WIDTH = 260;
const COLLAPSED_WIDTH = 80;

export const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: <Home size={20} strokeWidth={2} />, key: "dashboard" },
  { to: "/quiz", label: "Practice", icon: <BookOpen size={20} strokeWidth={2} />, key: "practice" },
  { to: "/practical-exam", label: "Labs", icon: <Timer size={20} strokeWidth={2} />, key: "labs" },
  { to: "/tools/subnet", label: "Subnet", icon: <Calculator size={20} strokeWidth={2} />, key: "subnet" },
  { to: "/flashcards", label: "Flashcards", icon: <BookOpen size={20} strokeWidth={2} />, key: "flashcards" },
  { to: "/review", label: "Review", icon: <ShieldAlert size={20} strokeWidth={2} />, key: "review" },
  { to: "/history", label: "History", icon: <History size={20} strokeWidth={2} />, key: "history" },
  { to: "/settings", label: "Settings", icon: <Settings size={20} strokeWidth={2} />, key: "settings" },
];

export const Sidebar = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (to) => {
    navigate(to);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    // Close sidebar on mobile nav link click
    const handleLinkClick = () => {
      setIsOpen(false);
    };
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
      link.addEventListener('click', handleLinkClick);
    });
    return () => {
      document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.removeEventListener('click', handleLinkClick);
      });
    };
  }, []);

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 w-${isOpen ? SIDEBAR_WIDTH : COLLAPSED_WIDTH} border border-dark-border bg-dark-surface/90 shadow-2xl z-50 transform transition-transform ${isOpen ? "translate-x-0" : "translate-x-full"} ease-out duration-300`}      aria-label="Main sidebar"      onClick={(e) => e.stopPropagation()}    >
      <div className="flex flex-col h-full p-6 pt-2">
        {/* Brand header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="w-8 h-8 rounded-full bg-gold text-dark-bg flex items-center justify-center text-xs font-bold shadow-gold-glow">
              2.0
            </span>
            <span className="font-serif text-base tracking-wide text-paper">
              CCNA Practice
            </span>
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-md hover:bg-dark-surface transition-colors"
            aria-label="Toggle sidebar"
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1">
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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                  isActive
                    ? "bg-gold/10 text-gold border-border"
                    : "text-paper hover:text-gold hover:bg-dark-surface"
                )}
                aria-label={item.label}
              >
                <span className="w-3 h-3 rounded-full flex-shrink-0">{item.icon}</span>
                <span className="hidden sm:block">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom action button - Full Exam */}
        <div className="mt-6 pt-6 border-t border-border/30">
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
      </div>
    </aside>
  );
};