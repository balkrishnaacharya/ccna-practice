import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

/**
 * SplashAnimation — "The Five Domains Converge"
 *
 * Canvas 2D + GSAP loading animation. No text, no logo, no letters, no numerals.
 * Pure motion and light only.
 *
 * Story:
 *   0.0-0.8s   One tiny gold point ignites at center, emits a single thin ring (ping).
 *   0.8-2.2s   Five nodes spiral outward from the ping. Each node has a distinct
 *              geometry (hexagon, rounded square, triangle, circle, diamond) and
 *              orbit speed sized to exam weighting. Thin hairline links draw between
 *              them one at a time (stroke-dashoffset), as if the network is routed.
 *   2.2-3.8s   Gold packets of light travel along the links, accelerating/decelerating.
 *              One link flickers and reroutes (self-healing failover) then settles.
 *   3.8-4.8s   Nodes pull together, links tighten into a single glowing ring,
 *              ring dissolves into a soft radial bloom.
 *   4.8-5.4s   Bloom expands and fades, revealing the Dashboard underneath.
 *
 * Total ~5.4s. Any click/tap/Enter/Escape skips to onComplete. Subsequent launches
 * play a shortened 2s version (ping, collapse, bloom).
 */

const CONFIG = {
  // Palette (app design-system tokens)
  chassis: "#0E1118",
  gold: "#BD8D39",
  goldFallback: "#D4AF37",
  warmPaper: "#F2EBDD",
  coolBlue: "#4A6FA5",

  // Timings (seconds)
  pingDuration: 0.8,
  nodesDuration: 1.4,   // 0.8 -> 2.2
  packetsDuration: 1.6, // 2.2 -> 3.8
  collapseDuration: 1.0, // 3.8 -> 4.8
  bloomDuration: 0.6,   // 4.8 -> 5.4

  // Node count = five CCNA domains
  nodeCount: 5,
};

const NODE_GEOMETRIES = [
  { sides: 6, name: "hexagon" },     // Network Infrastructure
  { sides: 4, radius: 0.85, name: "roundedSquare" }, // Switching & Access
  { sides: 3, name: "triangle" },    // IP Routing
  { sides: 0, name: "circle" },      // Services & Security
  { sides: 4, rotate: Math.PI / 4, name: "diamond" }, // AI & NetOps
];

export default function SplashAnimation({ onComplete }) {
  const canvasRef = useRef(null);
  const [isSkipped, setIsSkipped] = useState(false);

  useGSAP(
    () => {
      const canvas = canvasRef.current;
      if (!canvas || !onComplete) return;

      // Respect reduced motion: 600ms fade bloom, then hand off
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const bloom = canvas.getContext("2d");
        if (bloom) {
          const rect = canvas.getBoundingClientRect();
          const w = rect.width || window.innerWidth;
          const h = rect.height || window.innerHeight;
          const grad = bloom.createRadialGradient(
            w / 2,
            h / 2,
            0,
            w / 2,
            h / 2,
            Math.max(w, h)
          );
          grad.addColorStop(0, CONFIG.gold);
          grad.addColorStop(1, "rgba(0,0,0,0)");
          bloom.fillStyle = grad;
          bloom.fillRect(0, 0, w, h);
        }
        sessionStorage.setItem("ccna_splash_seen", "true");
        setIsSkipped(true);
        onComplete();
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        // Canvas context unavailable — gracefully skip to Dashboard
        sessionStorage.setItem("ccna_splash_seen", "true");
        setIsSkipped(true);
        onComplete();
        return;
      }

      // Ensure canvas has valid dimensions (may be 0x0 on first render)
      const setSize = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(rect.width, 1) * dpr;
        canvas.height = Math.max(rect.height, 1) * dpr;
        ctx.scale(dpr, dpr);
        return { w: rect.width, h: rect.height };
      };
      let size = setSize();
      let { w, h } = size;
      const cx = w / 2;
      const cy = h / 2;
      const s = Math.min(w, h); // shorter side for scaling

      // Safety timeout so the app is never permanently blocked
      const safetyTimer = setTimeout(() => {
        sessionStorage.setItem("ccna_splash_seen", "true");
        setIsSkipped(true);
        onComplete();
      }, 5600);

      const skip = () => {
        sessionStorage.setItem("ccna_splash_seen", "true");
        setIsSkipped(true);
        tl.kill();
        cancelAnimationFrame(rafId);
        window.removeEventListener("pointerdown", onSkip);
        window.removeEventListener("keydown", onKeySkip);
        onComplete();
      };

      const onSkip = () => skip();
      const onKeySkip = (e) => {
        if (e.key === "Enter" || e.key === "Escape") skip();
      };

      window.addEventListener("pointerdown", onSkip, { once: true });
      window.addEventListener("keydown", onKeySkip, { once: true });

      // State driven ONLY by GSAP timeline (single source of truth)
      const state = {
        t: 0,
        nodes: [],
        links: [],
        packets: [],
        bloom: 0,
        ringRadius: 0,
      };

      // Initialize node positions at center (will spiral out via GSAP)
      const baseRadius = s * 0.34;
      const weights = [0.25, 0.25, 0.20, 0.20, 0.10]; // exam weighting
      for (let i = 0; i < CONFIG.nodeCount; i++) {
        const geo = NODE_GEOMETRIES[i];
        const angle = (i / CONFIG.nodeCount) * Math.PI * 2;
        const radius = baseRadius * (0.6 + 0.4 * weights[i]);
        state.nodes.push({
          id: i,
          geo,
          angle,
          radius,
          orbitSpeed: 0.15 + i * 0.06,
          orbitOffset: i * 0.7,
          color: i === 0 ? CONFIG.gold : CONFIG.coolBlue,
          size: 6 + i * 2,
          x: cx,
          y: cy,
        });
      }

      // Links between consecutive nodes (circular)
      for (let i = 0; i < CONFIG.nodeCount; i++) {
        state.links.push({
          from: i,
          to: (i + 1) % CONFIG.nodeCount,
          progress: 0,
          failed: false,
          rerouteTarget: null,
          failTime: null,
        });
      }

      // Pick one link to fail/reroute (randomize per launch)
      const failLinkIdx = Math.floor(Math.random() * CONFIG.nodeCount);
      state.links[failLinkIdx].failed = true;
      state.links[failLinkIdx].failTime = 2.6;

      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: () => {
          clearTimeout(safetyTimer);
          sessionStorage.setItem("ccna_splash_seen", "true");
          setIsSkipped(true);
          onComplete();
        },
      });

      // Register labels for reliable sequencing
      tl.addLabel("ping", 0);
      tl.addLabel("nodes", 0.8);
      tl.addLabel("packets", 2.2);
      tl.addLabel("collapse", 3.8);
      tl.addLabel("bloom", 4.6);

      // 0.0-0.8s: Ping — gold point at center, thin ring
      tl.to(state, { t: 0.15, duration: 0.8, ease: "power2.out" }, "ping");

      // 0.8-2.2s: Nodes spiral outward, links draw
      tl.to(
        state.nodes,
        {
          duration: 1.4,
          stagger: 0.08,
          x: (i, target) => cx + Math.cos(target.angle) * target.radius,
          y: (i, target) => cy + Math.sin(target.angle) * target.radius,
          ease: "power3.out",
        },
        "nodes"
      )
        .to(
          state.links,
          {
            duration: 1.2,
            stagger: 0.15,
            progress: 1,
            ease: "power2.inOut",
          },
          "nodes+=0.2"
        );

      // 2.2-3.8s: Packets travel, one link fails & reroutes
      tl.to(state, { t: 0.7, duration: 1.6, ease: "power2.inOut" }, "packets");

      // 3.8-4.8s: Collapse to ring, bloom
      tl.to(
        state.nodes,
        {
          duration: 1.0,
          x: cx,
          y: cy,
          ease: "power4.inOut",
        },
        "collapse"
      )
        .to(
          state,
          {
            ringRadius: baseRadius * 1.1,
            duration: 0.6,
            ease: "power2.out",
          },
          "collapse+=0.2"
        )
        .to(
          state,
          {
            bloom: 1,
            duration: 0.8,
            ease: "power1.out",
          },
          "collapse+=0.6"
        )
        .to({}, { duration: 0.6 }, "bloom");

      let rafId = 0;
      const render = () => {
        // Re-read canvas size each frame (handles resize)
        const rect = canvas.getBoundingClientRect();
        if (rect.width !== w || rect.height !== h) {
          w = rect.width;
          h = rect.height;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = Math.max(w, 1) * dpr;
          canvas.height = Math.max(h, 1) * dpr;
          ctx.scale(dpr, dpr);
        }

        // Clear with chassis color
        ctx.fillStyle = CONFIG.chassis;
        ctx.fillRect(0, 0, w, h);

        // Draw nodes
        state.nodes.forEach((n) => {
          ctx.save();
          ctx.translate(n.x, n.y);
          ctx.rotate((state.t * n.orbitSpeed + n.orbitOffset) % (Math.PI * 2));
          ctx.fillStyle = n.color;
          ctx.globalAlpha = 0.85;
          drawNodeShape(ctx, n.geo, n.size);
          ctx.restore();

          // Node glow
          ctx.save();
          ctx.translate(n.x, n.y);
          ctx.shadowColor = n.color;
          ctx.shadowBlur = 14;
          ctx.fillStyle = n.color;
          ctx.globalAlpha = 0.35;
          drawNodeShape(ctx, n.geo, n.size * 1.6);
          ctx.restore();
        });

        // Draw links
        state.links.forEach((link) => {
          const from = state.nodes[link.from];
          const to = state.nodes[link.to];
          if (!from || !to) return;

          let x1 = from.x,
            y1 = from.y;
          let x2 = to.x,
            y2 = to.y;
          let alpha = link.progress;
          let color = CONFIG.gold;

          if (link.failed && state.t > link.failTime / 5.4) {
            const t = (state.t * 5.4 - link.failTime) / 0.6;
            const k = Math.min(Math.max(t, 0), 1);
            x1 = from.x + (cx - from.x) * k;
            y1 = from.y + (cy - from.y) * k;
            x2 = cx + (to.x - cx) * k;
            y2 = cy + (to.y - cy) * k;
            alpha = link.progress * (1 - k * 0.5);
            color = CONFIG.warmPaper;
          }

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = alpha * 0.7;
          ctx.stroke();

          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.globalAlpha = alpha * 0.25;
          ctx.stroke();
          ctx.restore();
          ctx.restore();
        });

        // Draw gold packets traveling links
        state.packets.forEach((p) => {
          const link = state.links[p.linkIndex];
          if (!link) return;
          const from = state.nodes[link.from];
          const to = state.nodes[link.to];
          if (!from || !to) return;

          let fx = from.x + (to.x - from.x) * p.progress;
          let fy = from.y + (to.y - from.y) * p.progress;
          if (link.failed && state.t * 5.4 > link.failTime) {
            const k = p.progress;
            fx = from.x + (cx - from.x) * k;
            fy = from.y + (cy - from.y) * k;
          }

          ctx.save();
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // Draw ring (collapse phase)
        if (state.ringRadius > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, state.ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = CONFIG.gold;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.9 * (1 - state.bloom);
          ctx.stroke();
          ctx.restore();
        }

        // Draw radial bloom
        if (state.bloom > 0) {
          ctx.save();
          const grad = ctx.createRadialGradient(
            cx,
            cy,
            0,
            cx,
            cy,
            Math.max(w, h) * 1.2
          );
          grad.addColorStop(0, `rgba(189, 141, 57, ${0.5 * state.bloom})`);
          grad.addColorStop(
            0.4,
            `rgba(242, 235, 221, ${0.25 * state.bloom})`
          );
          grad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        }

        rafId = requestAnimationFrame(render);
      };

      // Advance packets along links each frame (state.t comes ONLY from GSAP)
      const advance = () => {
        const packetTime = state.t * 5.4;
        state.packets = [];
        state.links.forEach((link, li) => {
          if (link.progress < 0.3) return;
          const numPackets = link.failed ? 1 : 2;
          for (let p = 0; p < numPackets; p++) {
            const offset = (p / numPackets) * 0.4 + (packetTime * 0.5) % 1;
            const pp = offset % 1;
            if (pp < 0.95) {
              state.packets.push({
                linkIndex: li,
                progress: pp,
                color: link.failed ? CONFIG.warmPaper : CONFIG.gold,
              });
            }
          }
        });
        rafId = requestAnimationFrame(advance);
      };

      rafId = requestAnimationFrame(advance);
      render();

      return () => {
        clearTimeout(safetyTimer);
        tl.kill();
        cancelAnimationFrame(rafId);
        window.removeEventListener("pointerdown", onSkip);
        window.removeEventListener("keydown", onKeySkip);
      };
    },
    { dependencies: [] }
  );

  if (isSkipped) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[100] w-full h-full flex items-center justify-center bg-[#0E1118] select-none overflow-hidden"
    />
  );
}

/**
 * Draw a node shape centered at (0,0) in current canvas context.
 */
function drawNodeShape(ctx, geo, size) {
  ctx.beginPath();
  if (geo.sides === 0) {
    // circle
    ctx.arc(0, 0, size, 0, Math.PI * 2);
  } else {
    const rotate = geo.rotate || 0;
    for (let i = 0; i <= geo.sides; i++) {
      const angle = (i / geo.sides) * Math.PI * 2 + rotate;
      const r = geo.sides === 4 && geo.radius
        ? size * geo.radius * (i % 2 === 0 ? 1 : 0.7)
        : size;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.fill();
}
