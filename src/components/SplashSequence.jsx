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
  const capLeftRef = useRef(null);
  const capRightRef = useRef(null);
  const squareRef = useRef(null);
  const circleRef = useRef(null);
  const logoCoreRef = useRef(null);
  const irisRef = useRef(null);

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
      const capL = capLeftRef.current;
      const capR = capRightRef.current;
      const square = squareRef.current;
      const circle = circleRef.current;
      const logoCore = logoCoreRef.current;
      const iris = irisRef.current;

      const viewportDiagonal = Math.hypot(window.innerWidth, window.innerHeight);
      const irisDiameter = 48;
      const coverScale = Math.ceil(viewportDiagonal / irisDiameter) * 2.2;

      // Fail-safe timeout so application is never permanently blocked
      const safetyTimer = setTimeout(() => {
        sessionStorage.setItem("ccna_splash_seen", "true");
        setShouldRender(false);
        onComplete?.();
      }, 2400);

      const tl = gsap.timeline({
        defaults: { ease: "expo.out", duration: 0.8 },
        onComplete: () => {
          clearTimeout(safetyTimer);
          sessionStorage.setItem("ccna_splash_seen", "true");
          setShouldRender(false);
          onComplete?.();
        },
      });

      // 1. Initial State: Captions slide in from top/bottom
      tl.addLabel("texts", 0.1)
        .fromTo(
          capL,
          { yPercent: -80, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.65, ease: "power3.out" },
          "texts"
        )
        .fromTo(
          capR,
          { yPercent: 80, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.65, ease: "power3.out" },
          "texts"
        );

      // 2. Converging Morph: Square (Sage) & Circle (Gold) move toward center
      tl.addLabel("shapes", "texts+=0.25")
        .fromTo(
          square,
          { x: -50, opacity: 0, rotation: 0, borderRadius: "12px" },
          {
            x: 0,
            opacity: 1,
            rotation: 90,
            borderRadius: "50%",
            duration: 0.75,
            ease: "power3.out",
          },
          "shapes"
        )
        .fromTo(
          circle,
          { x: 50, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.75, ease: "power3.out" },
          "shapes"
        );

      // 3. Shapes fuse into central CCNA 2.0 network emblem
      tl.addLabel("fuse", "shapes+=0.5")
        .to(square, { opacity: 0, scale: 0.8, duration: 0.2 }, "fuse")
        .to(circle, { opacity: 0, scale: 0.8, duration: 0.2 }, "fuse")
        .fromTo(
          logoCore,
          { scale: 0.6, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" },
          "fuse+=0.1"
        )
        .to([capL, capR], { opacity: 0, duration: 0.25 }, "fuse+=0.1");

      // 4. Iris expansion reveal into the settled application
      tl.addLabel("reveal", "fuse+=0.4")
        .fromTo(
          iris,
          { scale: 0, opacity: 1 },
          {
            scale: coverScale,
            duration: 0.65,
            ease: "power4.inOut",
          },
          "reveal"
        )
        .to(logoCore, { opacity: 0, scale: 1.2, duration: 0.25 }, "reveal+=0.1")
        .to(
          container,
          { opacity: 0, duration: 0.3, ease: "power2.out" },
          "reveal+=0.35"
        );

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
        {/* Converging Shapes Container */}
        <div className="relative flex items-center justify-center w-28 h-28 my-auto">
          {/* Left Decorative Shape: Square morphing to circle (Sage) */}
          <div
            ref={squareRef}
            className="absolute w-11 h-11 bg-sage/80 border border-sage shadow-sage-glow"
          />

          {/* Right Decorative Shape: Circle (Agent Gold) */}
          <div
            ref={circleRef}
            className="absolute w-11 h-11 rounded-full bg-gold/90 border border-gold shadow-gold-glow"
          />

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
                <span className="text-[9px] font-bold text-gold uppercase tracking-widest mt-0.5 font-mono">
                  CCNA
                </span>
              </div>
            </div>
          </div>

          {/* Expanding Iris Wipe Disk */}
          <div
            ref={irisRef}
            className="absolute w-12 h-12 rounded-full bg-dark-bg pointer-events-none opacity-0 will-change-transform"
          />
        </div>

        {/* Captions */}
        <div className="w-full flex items-center justify-between text-xs px-2 pt-4">
          <p
            ref={capLeftRef}
            className="font-serif italic text-sm tracking-wide text-paper"
          >
            CCNA 2.0
          </p>
          <div className="h-px flex-1 mx-3 bg-dark-border" />
          <p
            ref={capRightRef}
            className="text-[11px] uppercase tracking-widest text-paper-muted font-mono"
          >
            Blueprint 200-301
          </p>
        </div>
      </div>
    </div>
  );
}
