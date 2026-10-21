import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export default function OrganicMeshBackground() {
  const blob1Ref = useRef(null);
  const blob2Ref = useRef(null);
  const blob3Ref = useRef(null);

  useGSAP(() => {
    // Check prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    // Slow, drifting organic motion across coordinate space
    const tl1 = gsap.to(blob1Ref.current, {
      xPercent: 18,
      yPercent: 12,
      rotation: 20,
      duration: 16,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    const tl2 = gsap.to(blob2Ref.current, {
      xPercent: -15,
      yPercent: -18,
      rotation: -25,
      duration: 20,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    const tl3 = gsap.to(blob3Ref.current, {
      xPercent: 12,
      yPercent: -14,
      scale: 1.08,
      duration: 18,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    return () => {
      tl1.kill();
      tl2.kill();
      tl3.kill();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-dark-bg"
    >
      {/* Subtle architectural coordinate grid: 32px spacing, ultra faint */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(#F6F2E9 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Organic Shape 1: Subtle Sage #5C6E4E gradient field */}
      <div
        ref={blob1Ref}
        className="absolute -top-32 -left-32 w-[34rem] h-[34rem] rounded-full blur-[100px] will-change-transform opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(92, 110, 78, 0.45) 0%, rgba(92, 110, 78, 0.05) 60%, transparent 80%)",
        }}
      />

      {/* Organic Shape 2: Subtle Peach #E8A87C gradient field */}
      <div
        ref={blob2Ref}
        className="absolute -bottom-36 -right-36 w-[36rem] h-[36rem] rounded-full blur-[110px] will-change-transform opacity-25"
        style={{
          background:
            "radial-gradient(circle, rgba(232, 168, 124, 0.35) 0%, rgba(232, 168, 124, 0.05) 65%, transparent 80%)",
        }}
      />

      {/* Organic Shape 3: Gentle Warm Agent Gold ambient highlight in center */}
      <div
        ref={blob3Ref}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] rounded-full blur-[120px] will-change-transform opacity-15"
        style={{
          background:
            "radial-gradient(circle, rgba(184, 132, 42, 0.30) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
