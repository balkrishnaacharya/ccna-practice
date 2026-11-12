import { useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export default function SplashSequence({ onComplete }) {
  const [shouldRender, setShouldRender] = useState(() => {
    // Only show on first launch in this session
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem("ccna_splash_seen");
  });

  const containerRef = useRef(null);
  const logoCoreRef = useRef(null);
  const captionLeftRef = useRef(null);
  const captionRightRef = useRef(null);

  useGSAP(
    () => {
      if (!shouldRender || !containerRef.current) {
        onComplete?.();
        return;
      }

      // Check prefers-reduced-motion
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        sessionStorage.setItem("ccna_splash_seen", "true");
        setShouldRender(false);
        onComplete?.();
        return;
      }

      const container = containerRef.current;
      const logoCore = logoCoreRef.current;
      const captionLeft = captionLeftRef.current;
      const captionRight = captionRightRef.current;

      // Fail-safe timeout so application is never permanently blocked
      const safetyTimer = setTimeout(() => {
        sessionStorage.setItem("ccna_splash_seen", "true");
        setShouldRender(false);
        onComplete?.();
      }, 2400);

      const tl = gsap.timeline({
        defaults: { ease: "power2.out", duration: 0.5 },
        onComplete: () => {
          clearTimeout(safetyTimer);
          sessionStorage.setItem("ccna_splash_seen", "true");
          setShouldRender(false);
          onComplete?.();
        },
      });

      // Single orchestrated moment: logo mark scales up + captions fade in together
      tl.fromTo(
        logoCore,
        { scale: 0.55, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.5)" },
        0
      )
        .fromTo(
          [captionLeft, captionRight],
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.4 },
          0
        )
        // Fade the whole splash out in one motion
        .to(container, { opacity: 0, duration: 0.3, ease: "power2.out" }, 0.55);

      return () => {
        clearTimeout(safetyTimer);
        tl.kill();
      };
    },
    { dependencies: [shouldRender] }
  );

  if (!shouldRender) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-dark-bg text-paper select-none overflow-hidden"
    >
      {/* Background radial atmosphere */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40" />

      {/* Center Motion Stage */}
      <div className="relative flex flex-col items-center justify-center w-full max-w-sm px-6 h-64">
        {/* Fused CCNA 2.0 Network Topology Emblem */}
        <div
          ref={logoCoreRef}
          className="absolute opacity-0 flex flex-col items-center justify-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold via-[#996A1C] to-gold p-0.5 shadow-gold-glow flex items-center justify-center border border-paper/10">
            <div className="w-full h-full rounded-[14px] bg-dark-card flex flex-col items-center justify-center p-2">
              <svg
                className="w-7 h-7 text-gold"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="5" r="2" />
                <circle cx="5" cy="19" r="2" />
                <circle cx="19" cy="19" r="2" />
                <line x1="12" y1="7" x2="5" y2="17" />
                <line x1="12" y1="7" x2="19" y2="17" />
                <line x1="7" y1="19" x2="17" y2="19" />
              </svg>
              <span className="text-xs font-bold text-gold mt-0.5 font-mono">
                CCNA 2.0
              </span>
            </div>
          </div>
        </div>

        {/* Captions */}
        <div className="w-full flex items-center justify-center gap-3 text-xs px-4 pt-6">
          <p
            ref={captionLeftRef}
            className="font-serif italic text-sm tracking-wide text-paper whitespace-nowrap"
          >
            CCNA 2.0
          </p>
          <div className="h-px w-12 bg-dark-border" />
          <p
            ref={captionRightRef}
            className="text-[11px] text-paper-muted font-mono whitespace-nowrap"
          >
            Blueprint 200-301
          </p>
        </div>
      </div>
    </div>
  );
}
