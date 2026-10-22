import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export default function ExamConfirmationModal({ isOpen, onCancel, onConfirm }) {
  const overlayRef = useRef(null);
  const cardRef = useRef(null);

  useGSAP(
    () => {
      if (!isOpen || !overlayRef.current || !cardRef.current) return;

      const tl = gsap.timeline({ defaults: { ease: "power2.out", force3D: true } });
      tl.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.18 }
      ).fromTo(
        cardRef.current,
        { opacity: 0, y: 16, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.2 },
        "-=0.1"
      );
    },
    { scope: overlayRef, dependencies: [isOpen] }
  );

  function handleCancel() {
    onCancel();
  }

  function handleConfirm() {
    onConfirm();
  }

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-confirm-title"
    >
      <div
        ref={cardRef}
        className="w-full max-w-md rounded-2xl border border-dark-border bg-dark-card p-6 sm:p-7 shadow-dock relative overflow-hidden text-paper space-y-5"
      >
        {/* Soft background glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-gold/15 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-medium tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            Official Simulation
          </div>
          <h2
            id="exam-confirm-title"
            className="font-serif text-2xl font-semibold tracking-tight text-paper"
          >
            CCNA 2.0 Timed Simulation
          </h2>
          <p className="text-paper-muted text-sm leading-relaxed">
            This is a 120-minute timed exam. Are you ready?
          </p>
        </div>

        <div className="rounded-xl border border-dark-border bg-dark-surface/60 p-3.5 space-y-2 text-xs text-paper-dim">
          <div className="flex justify-between items-center">
            <span className="text-paper-muted">Standard Duration</span>
            <span className="font-medium text-paper">120 Minutes</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-paper-muted">Total Questions</span>
            <span className="font-medium text-paper">100 Questions</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-paper-muted">Passing Score</span>
            <span className="font-medium text-gold">825 / 1000 (82.5%)</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2.5 rounded-full border border-dark-border text-paper-muted hover:text-paper hover:bg-dark-surface transition-colors text-xs font-medium tracking-wide"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-full bg-gold hover:bg-gold-hover text-dark-bg font-semibold text-xs tracking-wide shadow-gold-glow transition-all duration-150 transform hover:scale-105 active:scale-95"
          >
            Start Exam
          </button>
        </div>
      </div>
    </div>
  );
}
