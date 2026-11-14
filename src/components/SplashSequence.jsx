import { useState, useRef, useEffect } from "react";
import gsap from "gsap";

const SPLASH_KEY = "ccna_splash_seen";

export default function SplashSequence({ onComplete }) {
  const [shouldRender, setShouldRender] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem(SPLASH_KEY);
  });

  const containerRef = useRef(null);
  const logoRef = useRef(null);
  const ring1Ref = useRef(null);
  const ring2Ref = useRef(null);
  const dotRefs = useRef([null, null, null, null, null, null]);
  const orbitRef = useRef(null);

  const tlRef = useRef(null);

  useEffect(() => {
    if (!shouldRender) return;

    // Use requestAnimationFrame to ensure all refs are attached to DOM nodes
    const raf = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;

      // Reduced motion: instant skip
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        sessionStorage.setItem(SPLASH_KEY, "true");
        setShouldRender(false);
        onComplete?.();
        return;
      }

      const safetyTimer = setTimeout(() => {
        sessionStorage.setItem(SPLASH_KEY, "true");
        setShouldRender(false);
        onComplete?.();
      }, 3000);

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          clearTimeout(safetyTimer);
          sessionStorage.setItem(SPLASH_KEY, "true");
          setShouldRender(false);
          onComplete?.();
        },
      });

      tlRef.current = tl;

      // Stage 1: Mesh background pulse
      tl.to(
        ".mesh-pulse",
        { scale: 1.1, opacity: 0.4, duration: 1.4, ease: "sine.inOut" },
        0
      );

      // Stage 2: Outer glow ring expands from center
      tl.fromTo(
        ring1Ref.current,
        { scale: 0, opacity: 0 },
        { scale: 1.4, opacity: 0.35, duration: 1.2, ease: "expo.out" },
        0.1
      );

      // Stage 3: Logo mark — scale up from 0.4 with unwind rotation
      tl.fromTo(
        logoRef.current,
        { scale: 0.4, opacity: 0, rotate: -12 },
        { scale: 1, opacity: 1, rotate: 0, duration: 0.9, ease: "back.out(1.6)" },
        0.3
      );

      // Stage 4: Inner accent ring scales and fades
      tl.fromTo(
        ring2Ref.current,
        { scale: 0.6, opacity: 0 },
        { scale: 1, opacity: 0.5, duration: 0.8, ease: "expo.out" },
        0.45
      );

      // Stage 5: Six peripheral dots appear in a staggered burst
      tl.fromTo(
        dotRefs.current,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 0.8,
          duration: 0.5,
          stagger: 0.08,
          ease: "back.out(1.2)",
        },
        0.55
      );

      // Stage 6: Orbit ring rotates continuously during hold
      tl.to(
        orbitRef.current,
        { rotate: 360, duration: 2, repeat: -1, ease: "none" },
        0.8
      );

      // Stage 7: Hold, then fade everything out
      tl.to({}, { duration: 1.4 })
        .to(
          [ring1Ref.current, ring2Ref.current, logoRef.current, ...dotRefs.current, orbitRef.current],
          { opacity: 0, scale: 0.8, duration: 0.6, ease: "power2.in" },
          0.1
        )
        .to(container, { opacity: 0, duration: 0.5, ease: "power2.out" }, 0.1);

      return () => {
        clearTimeout(safetyTimer);
        tl.kill();
      };
    });

    return () => {
      cancelAnimationFrame(raf);
      if (tlRef.current) tlRef.current.kill();
    };
  }, [shouldRender]);

  if (!shouldRender) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0E1118] select-none overflow-hidden pointer-events-none"
      style={{ willChange: "opacity" }}
    >
      {/* Mesh pulse layer */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none mesh-pulse"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(189, 141, 57, 0.18) 0%, transparent 55%), radial-gradient(circle at 30% 30%, rgba(92, 110, 78, 0.12) 0%, transparent 45%)",
          willChange: "transform, opacity",
        }}
      />

      {/* Center motion stage */}
      <div
        className="relative flex flex-col items-center justify-center w-full max-w-sm px-6 h-[30vh]"
        style={{ willChange: "transform" }}
      >
        {/* Outer expanding glow ring */}
        <div
          ref={ring1Ref}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-[#BD8D39]/30"
          style={{ willChange: "transform, opacity" }}
        />

        {/* Logo mark */}
        <div
          ref={logoRef}
          className="relative z-10 flex items-center justify-center"
          style={{ willChange: "transform, opacity" }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#BD8D39] via-[#996A1C] to-[#BD8D39] p-0.5 shadow-[#BD8D39]/40 shadow-lg flex items-center justify-center border border-[#F6F2E9]/10">
            <div className="w-full h-full rounded-[14px] bg-[#0E1118] flex flex-col items-center justify-center p-2">
              <svg
                className="w-7 h-7 text-[#BD8D39]"
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
            </div>
          </div>
        </div>

        {/* Inner accent ring */}
        <div
          ref={ring2Ref}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-[#BD8D39]/50"
          style={{ willChange: "transform, opacity" }}
        />

        {/* Six peripheral dots in a hexagon */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            ref={(el) => (dotRefs.current[i] = el)}
            className="absolute rounded-full w-3 h-3 bg-[#BD8D39] shadow-[#BD8D39]/50 shadow-lg"
            style={{
              willChange: "transform, opacity",
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateX(22px)`,
            }}
          />
        ))}

        {/* Rotating orbit ring */}
        <div
          ref={orbitRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full border border-[#BD8D39]/20"
          style={{ willChange: "transform" }}
        />
      </div>
    </div>
  );
}
