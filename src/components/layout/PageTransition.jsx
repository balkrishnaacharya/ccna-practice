import { useGSAP } from "@gsap/react";
import { useRef } from "react";

export function PageTransition({ children }) {
  const ref = useRef();
  useGSAP(() => {
    // Page entry handled by Tailwind animate-in classes; GSAP reserved for future enhancement
  });
  return <div ref={ref} className="animate-in fade-in slide-in-from-right-4 duration-200">{children}</div>;
}
