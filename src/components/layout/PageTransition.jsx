import { useGSAP } from "@gsap/react";
import { useRef } from "react";

export function PageTransition({ children }) {
  const ref = useRef();
  useGSAP(() => {
    // GSAP slide-in animation stub
  });
  return <div ref={ref} className="animate-in fade-in slide-in-from-right-4 duration-200">{children}</div>;
}
