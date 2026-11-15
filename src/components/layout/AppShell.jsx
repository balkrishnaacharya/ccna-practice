import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import DirectionalRouteWrapper from "../DirectionalRouteWrapper";
import { Menu, X } from "lucide-react";

export function AppShell({ children, guardNavigation, onOpenExamModal, profileName }) {
  // Default to expanded on desktop (>= md / 768px), collapsed on mobile.
  // Uses window.innerWidth so the Tauri webview (often < 1024px wide) still
  // gets a fully expanded sidebar instead of the collapsed w-20 sliver.
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dark-bg text-paper font-sans">
      {/* Desktop Sidebar (visible on md+) */}
      <div className="hidden md:block h-full shrink-0">
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          isMobile={false}
          guardNavigation={guardNavigation}
          onOpenExamModal={onOpenExamModal}
        />
      </div>

      {/* Mobile Drawer (visible on < md when opened) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-dark-bg/80 backdrop-blur-md md:hidden flex"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-64 h-full bg-dark-surface border-r border-dark-border relative flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-3 right-3 z-10">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-paper-muted hover:text-paper hover:bg-dark-elevated transition-colors"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>
            <Sidebar
              isOpen={true}
              setIsOpen={() => setIsMobileMenuOpen(false)}
              isMobile={true}
              guardNavigation={(e, to) => {
                setIsMobileMenuOpen(false);
                guardNavigation?.(e, to);
              }}
              onOpenExamModal={() => {
                setIsMobileMenuOpen(false);
                onOpenExamModal?.();
              }}
            />
          </div>
          <div
            className="flex-1 h-full"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Top Header Bar */}
        <header
          className="h-14 border-b border-dark-border bg-dark-surface/60 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-10 box-border"
          style={{ paddingTop: "var(--safe-top)" }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-paper-muted hover:text-paper hover:bg-dark-elevated transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm tracking-wide text-paper">
                CCNA <span className="italic text-gold font-normal">Practice</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {profileName && (
              <span className="text-xs text-paper-muted hidden sm:inline">
                Candidate: <span className="text-paper font-medium">{profileName}</span>
              </span>
            )}
            <button
              type="button"
              onClick={onOpenExamModal}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 text-xs font-semibold shadow-gold-glow transition-all"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              <span>Full Exam</span>
            </button>
          </div>
        </header>

        {/* Scrollable Document Flow Area */}
        <main
          className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 w-full"
          style={{ paddingBottom: "calc(2rem + var(--safe-bottom))" }}
        >
          <DirectionalRouteWrapper>
            {children || <Outlet />}
          </DirectionalRouteWrapper>
        </main>
      </div>
    </div>
  );
}

export default AppShell;
