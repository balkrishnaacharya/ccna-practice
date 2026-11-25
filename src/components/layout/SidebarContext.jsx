"use client";

import { createContext, useContext, useState, useCallback } from "react";

// Sidebar breakpoints
const DESKTOP_BREAKPOINT = 768; // md

export const SidebarContext = createContext({
  isCollapsed: false,
  setIsCollapsed: () => {},
  isMobile: false,
  setIsMobile: () => {},
  collapse: () => {},
  expand: () => {},
  toggle: () => {},
});

export function SidebarProvider({ children, isMobile }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Default: sidebar always starts expanded so navigation labels are visible.
    // Users can manually collapse via the toggle button.
    return false;
  });

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, isMobile, toggleCollapse }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}