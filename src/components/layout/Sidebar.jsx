"use client";

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
import { useSidebar } from "./SidebarContext";

export const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: <Home size={18} strokeWidth={2} />, key: "dashboard", tour: "bottom-navigation" },
  { to: "/quiz", label: "Practice", icon: <BookOpen size={18} strokeWidth={2} />, key: "practice", tour: "practice-navigation" },
  { to: "/practical-exam", label: "Labs", icon: <Timer size={18} strokeWidth={2} />, key: "labs" },
  { to: "/tools/subnet", label: "Subnet", icon: <Calculator size={18} strokeWidth={2} />, key: "subnet" },
  { to: "/flashcards", label: "Flashcards", icon: <BookOpen size={18} strokeWidth={2} />, key: "flashcards" },
  { to: "/review", label: "Review", icon: <ShieldAlert size={18} strokeWidth={2} />, key: "review", tour: "review-navigation" },
  { to: "/history", label: "History", icon: <History size={18} strokeWidth={2} />, key: "history", tour: "history-navigation" },
  { to: "/settings", label: "Settings", icon: <Settings size={18} strokeWidth={2} />, key: "settings", tour: "settings-navigation" },
];

export function Sidebar({
  className,
  isOpen,
  setIsOpen,
  isMobile = false,
  guardNavigation,
  onOpenExamModal,
}) {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const isExpanded = !isCollapsed || isMobile;
  const location = useLocation();

  // Compute active state
  const getActiveStatus = (itemPath) => {
    if (itemPath === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(itemPath);
  };

  return (
    <aside
      className={cn(
        "h-full flex flex-col border-r border-dark-border bg-dark-surface transition-[width] duration-300 select-none",
        isCollapsed ? "w-20" : "w-64",
        className
      )}
      aria-label="Main sidebar navigation"
    >
      {/* Brand Header */}
      <div
        className={cn(
          "flex items-center justify-between h-14 border-b border-dark-border shrink-0",
          isCollapsed ? "justify-center px-2 gap-2" : "justify-between px-4"
        )}
      >
        <Link
          to="/"
          onClick={(e) => guardNavigation?.(e, "/")}
          className="flex items-center gap-2.5 overflow-hidden"
          aria-label="CCNA Practice 2.0"
        >
          <span
            className="w-7 h-7 rounded-full bg-gold text-dark-bg flex items-center justify-center text-xs font-bold shadow-gold-glow shrink-0"
          >
            2.0
          </span>
          {isExpanded && (
            <span className="font-serif text-sm tracking-wide text-paper whitespace-nowrap">
              CCNA <span className="italic text-gold font-normal">Practice</span>
            </span>
          )}
        </Link>

        {!isMobile && (
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "p-1.5 rounded-lg text-paper-dim hover:text-paper hover:bg-dark-elevated transition-colors shrink-0",
              "block"
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
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
              onClick={(e) => {
                guardNavigation?.(e, item.to);
                if (isMobile) {
                  setIsOpen?.();
                }
              }}
              className={cn(
                "w-full min-w-0 flex items-center rounded-xl py-2.5 text-xs font-medium transition-colors duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                isExpanded ? "gap-3 px-3 justify-start" : "justify-center px-0",
                isActive
                  ? "bg-gold/15 text-gold border border-gold/30 shadow-gold-glow"
                  : "text-paper-muted hover:text-paper hover:bg-dark-elevated border border-transparent"
              )}
              title={isCollapsed ? item.label : undefined}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              data-tour={item.tour}
            >
              <span className="shrink-0 group-hover:scale-105 transition-transform">
                {item.icon}
              </span>
              {isExpanded && (
                <span
                  className={cn(
                    "block min-w-0 flex-1 truncate",
                    isActive ? "text-gold" : "text-paper-muted hover:text-paper"
                  )}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Full Exam CTA */}
      <div className="p-3 border-t border-dark-border shrink-0">
        {isCollapsed ? (
          <button
            type="button"
            onClick={onOpenExamModal}
            className="w-full py-2.5 bg-gold hover:bg-gold-hover text-dark-bg font-bold rounded-xl text-xs shadow-gold-glow flex items-center justify-center"
            title="Take Full CCNA Exam"
            aria-label="Take Full CCNA Exam"
            data-tour="exam-button"
          >
            <Timer size={18} />
          </button>
        ) : isMobile ? (
          <button
            type="button"
            onClick={onOpenExamModal}
            className="w-full py-2.5 px-4 bg-gold hover:bg-gold-hover text-dark-bg font-semibold rounded-xl text-xs transition-all shadow-gold-glow flex items-center justify-center gap-2"
            data-tour="exam-button"
          >
            <span>Full Exam</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenExamModal}
            className="w-full py-2.5 px-4 bg-gold hover:bg-gold-hover text-dark-bg font-semibold rounded-xl text-xs transition-all shadow-gold-glow flex items-center justify-center gap-2"
            data-tour="exam-button"
          >
            <span>Full Exam</span>
          </button>
        )}
      </div>
    </aside>
  );
}

Sidebar.displayName = "Sidebar";