import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export default function FloatingBottomNav({ onOpenExamModal, guardNavigation }) {
  const location = useLocation();
  const navRef = useRef(null);
  const pillRef = useRef(null);
  const itemRefs = useRef({});

  const leftLinks = [
    {
      to: "/",
      label: "Home",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      to: "/quiz",
      label: "Practice",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      to: "/practical-exam",
      label: "Labs",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9h8m-8 4h5m-9 7h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const rightLinks = [
    {
      to: "/review",
      label: "Review",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      ),
    },
    {
      to: "/history",
      label: "History",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      to: "/settings",
      label: "Config",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  function updatePillPosition(animate = true) {
    const currentPath = location.pathname;
    const targetEl = itemRefs.current[currentPath];
    const navEl = navRef.current;
    const pillEl = pillRef.current;

    if (!targetEl || !navEl || !pillEl) {
      if (pillEl) {
        gsap.to(pillEl, { opacity: 0, duration: 0.2, overwrite: "auto" });
      }
      return;
    }

    const targetRect = targetEl.getBoundingClientRect();
    const navRect = navEl.getBoundingClientRect();

    const targetX = targetRect.left - navRect.left;
    const targetY = targetRect.top - navRect.top;
    const targetW = targetRect.width;
    const targetH = targetRect.height;

    if (animate) {
      gsap.to(pillEl, {
        x: targetX,
        y: targetY,
        width: targetW,
        height: targetH,
        opacity: 1,
        duration: 0.35,
        ease: "power3.out",
        overwrite: "auto",
      });

      // Subtle coordinated icon scale pop
      const icon = targetEl.querySelector(".nav-icon-wrapper");
      if (icon) {
        gsap.fromTo(
          icon,
          { scale: 0.85 },
          { scale: 1, duration: 0.35, ease: "back.out(2)", overwrite: "auto" }
        );
      }
    } else {
      gsap.set(pillEl, {
        x: targetX,
        y: targetY,
        width: targetW,
        height: targetH,
        opacity: 1,
      });
    }
  }

  useGSAP(
    () => {
      updatePillPosition(true);
    },
    { dependencies: [location.pathname] }
  );

  // Resize listener to keep pill aligned during window resize
  useEffect(() => {
    function handleResize() {
      updatePillPosition(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [location.pathname]);

  return (
    <div
      className="fixed bottom-3 sm:bottom-6 inset-x-0 z-50 flex justify-center px-3 sm:px-4 pointer-events-none"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <nav
        ref={navRef}
        aria-label="Bottom Navigation"
        className="pointer-events-auto w-full max-w-md mx-auto bg-dark-surface/90 backdrop-blur-xl border border-dark-border rounded-full px-2 sm:px-3 py-1.5 shadow-dock flex items-center justify-between relative overflow-hidden"
      >
        {/* Continuous Sliding Background Active Pill */}
        <div
          ref={pillRef}
          className="absolute top-0 left-0 rounded-full bg-gold/15 border border-gold/30 shadow-gold-glow pointer-events-none opacity-0 will-change-transform z-0"
        />

        {/* Left items */}
        <div className="flex items-center justify-around flex-1 gap-1 relative z-10">
          {leftLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                ref={(el) => (itemRefs.current[link.to] = el)}
                to={link.to}
                onClick={(e) => guardNavigation(e, link.to)}
                className={`flex flex-col items-center justify-center py-1 px-2 min-w-[50px] rounded-full transition-colors duration-200 select-none ${
                  isActive
                    ? "text-gold font-semibold"
                    : "text-paper-muted hover:text-paper"
                }`}
              >
                <div className="nav-icon-wrapper p-1 rounded-full transition-transform">
                  {link.icon}
                </div>
                <span className="text-[10px] tracking-tight">{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Center Elevated Button: "Take Full Exam" */}
        <div className="relative -mt-6 sm:-mt-7 mx-1 flex flex-col items-center shrink-0 z-20">
          <button
            type="button"
            onClick={onOpenExamModal}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#8E6319] via-gold to-[#D8A243] border-2 border-dark-bg text-dark-bg shadow-gold-glow flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-gold/50"
            title="Take Full CCNA Exam"
            aria-label="Take Full CCNA Exam"
          >
            <svg
              className="w-6 h-6 text-dark-bg transition-transform duration-300 group-hover:rotate-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </button>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-gold mt-0.5">
            Exam
          </span>
        </div>

        {/* Right items */}
        <div className="flex items-center justify-around flex-1 gap-1 relative z-10">
          {rightLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                ref={(el) => (itemRefs.current[link.to] = el)}
                to={link.to}
                onClick={(e) => guardNavigation(e, link.to)}
                className={`flex flex-col items-center justify-center py-1 px-2 min-w-[50px] rounded-full transition-colors duration-200 select-none ${
                  isActive
                    ? "text-gold font-semibold"
                    : "text-paper-muted hover:text-paper"
                }`}
              >
                <div className="nav-icon-wrapper p-1 rounded-full transition-transform">
                  {link.icon}
                </div>
                <span className="text-[10px] tracking-tight">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
