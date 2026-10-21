import { useRef } from "react";
import { useLocation } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { ROUTE_ORDER, getRouteRank } from "../utils/navigationRoutes.js";

export { ROUTE_ORDER, getRouteRank };

export default function DirectionalRouteWrapper({ children }) {
  const location = useLocation();
  const containerRef = useRef(null);
  const prevRankRef = useRef(getRouteRank(location.pathname));

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      // Check prefers-reduced-motion
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(container, { opacity: 1, x: 0 });
        return;
      }

      const currentRank = getRouteRank(location.pathname);
      const isForward = currentRank >= prevRankRef.current;
      prevRankRef.current = currentRank;

      const offset = isForward ? 35 : -35;

      gsap.fromTo(
        container,
        { opacity: 0, x: offset },
        {
          opacity: 1,
          x: 0,
          duration: 0.3,
          ease: "power2.out",
          overwrite: "auto",
        }
      );
    },
    { dependencies: [location.pathname] }
  );

  return (
    <div ref={containerRef} className="w-full will-change-transform">
      {children}
    </div>
  );
}
