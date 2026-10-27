import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export default function UpdateModal({
  isOpen,
  updateInfo,
  status,
  downloadProgress,
  onClose,
  onApply,
}) {
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
        { opacity: 0, scale: 0.94, y: 16 },
        { opacity: 1, scale: 1, y: 0, duration: 0.2 },
        "-=0.1"
      );
    },
    { scope: overlayRef, dependencies: [isOpen] }
  );

  if (!isOpen || !updateInfo) return null;

  const isDownloading = status === "downloading";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-title"
    >
      <div
        ref={cardRef}
        className="w-full max-w-md rounded-2xl border border-dark-border bg-dark-card p-6 sm:p-7 shadow-dock text-paper space-y-5 relative overflow-hidden"
      >
        {/* Soft Gold Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-gold/15 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            Software Update
          </div>
          <h2
            id="update-title"
            className="font-serif text-2xl font-semibold text-paper"
          >
            Version {updateInfo.version} Available
          </h2>
          <p className="text-xs text-paper-dim font-mono">
            Published: {updateInfo.date ? new Date(updateInfo.date).toLocaleDateString() : "Recent"}
          </p>
        </div>

        {/* Release Notes */}
        <div className="rounded-xl border border-dark-border bg-dark-surface/60 p-4 max-h-48 overflow-y-auto space-y-2 text-xs text-paper-muted font-sans">
          <p className="font-semibold text-paper uppercase tracking-wider text-xs">
            What's New:
          </p>
          <div className="whitespace-pre-line leading-relaxed">
            {updateInfo.body}
          </div>
        </div>

        {/* Progress bar during download */}
        {isDownloading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-peach">
              <span>Downloading update...</span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-dark-surface overflow-hidden border border-dark-borderSubtle">
              <div
                className="h-full bg-gold rounded-full transition-all duration-200 shadow-gold-glow"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {!isDownloading && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-dark-border text-paper-muted hover:text-paper hover:bg-dark-surface text-xs font-medium tracking-wide transition-colors"
            >
              Later
            </button>
          )}
          <button
            type="button"
            disabled={isDownloading}
            onClick={onApply}
            className="px-6 py-2.5 rounded-full bg-gold hover:bg-gold-hover text-dark-bg font-semibold text-xs tracking-wider uppercase shadow-gold-glow transition-all duration-150 disabled:opacity-40"
          >
            {isDownloading
              ? "Installing..."
              : updateInfo.isAndroid
              ? "Download APK"
              : "Install & Restart"}
          </button>
        </div>
      </div>
    </div>
  );
}
