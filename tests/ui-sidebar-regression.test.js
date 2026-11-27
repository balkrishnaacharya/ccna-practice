import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sidebarSource = readFileSync(
  new URL("../src/components/layout/Sidebar.jsx", import.meta.url),
  "utf8"
);
const appShellSource = readFileSync(
  new URL("../src/components/layout/AppShell.jsx", import.meta.url),
  "utf8"
);
const backgroundSource = readFileSync(
  new URL("../src/components/OrganicMeshBackground.jsx", import.meta.url),
  "utf8"
);

const NAV_ITEMS = [
  { to: "/", label: "Dashboard" },
  { to: "/quiz", label: "Practice" },
  { to: "/practical-exam", label: "Labs" },
  { to: "/tools/subnet", label: "Subnet" },
  { to: "/flashcards", label: "Flashcards" },
  { to: "/review", label: "Review" },
  { to: "/history", label: "History" },
  { to: "/settings", label: "Settings" },
];

test("Sidebar: expanded desktop links use w-full min-w-0 flex items-center", () => {
  assert.ok(
    sidebarSource.includes("w-full min-w-0 flex items-center"),
    "Expanded desktop links must use w-full min-w-0 flex items-center for width ownership"
  );
});

test("Sidebar: label uses block min-w-0 flex-1 truncate", () => {
  assert.ok(
    sidebarSource.includes("block min-w-0 flex-1 truncate"),
    "Label must use block min-w-0 flex-1 truncate to occupy remaining width"
  );
});

test("Sidebar: label is never opacity-zero or hover-only in expanded mode", () => {
  assert.ok(
    !sidebarSource.includes("opacity-0") ||
      !sidebarSource.includes("group-hover:opacity-100"),
    "Label must not be hidden by default and revealed only on hover"
  );
});

test("Sidebar: active route link gets aria-current=page", () => {
  assert.ok(
    sidebarSource.includes('aria-current={isActive ? "page" : undefined}'),
    "Active route link must set aria-current=\"page\""
  );
});

test("Sidebar: focus-visible ring for keyboard navigation", () => {
  assert.ok(
    sidebarSource.includes("focus-visible:ring-2") &&
      sidebarSource.includes("focus-visible:ring-gold"),
    "Links must have focus-visible ring styling for keyboard accessibility"
  );
});

test("Sidebar: all navigation labels present", () => {
  for (const item of NAV_ITEMS) {
    assert.ok(
      sidebarSource.includes(`label: "${item.label}"`),
      `Nav item "${item.label}" must be defined in NAV_ITEMS`
    );
  }
});

test("Sidebar: all navigation routes present", () => {
  for (const item of NAV_ITEMS) {
    assert.ok(
      sidebarSource.includes(`to: "${item.to}"`),
      `Route "${item.to}" must be defined in NAV_ITEMS`
    );
  }
});

test("Sidebar: all navigation icons present", () => {
  for (const item of NAV_ITEMS) {
    assert.ok(sidebarSource.includes("icon:"), "NAV_ITEMS must define icons");
  }
});

test("Sidebar: title attribute on collapsed links", () => {
  assert.ok(
    sidebarSource.includes("title={isCollapsed ? item.label : undefined}"),
    "Collapsed links must show title attribute for accessibility"
  );
});

test("Sidebar: Full Exam CTA present in expanded and collapsed modes", () => {
  assert.ok(
    sidebarSource.includes("Full Exam") && sidebarSource.includes("onOpenExamModal"),
    "Full Exam CTA button must be present with onOpenExamModal handler"
  );
  assert.ok(
    sidebarSource.includes('aria-label="Take Full CCNA Exam"') ||
      sidebarSource.includes('title="Take Full CCNA Exam"'),
    "Collapsed Full Exam CTA must have accessible label"
  );
});

test("Sidebar: keeps internal flex column layout and state-dependent widths", () => {
  assert.ok(
    sidebarSource.includes("h-full flex flex-col border-r border-dark-border"),
    "Sidebar must keep internal flex-col layout"
  );
  assert.ok(
    sidebarSource.includes('isCollapsed ? "w-20" : "w-64"'),
    "Desktop sidebar must use state-dependent width (w-20 collapsed, w-64 expanded)"
  );
});

test("AppShell: desktop sidebar wrapper controls responsive visibility and sizing", () => {
  assert.ok(
    appShellSource.includes(
      '<div className="relative z-10 hidden h-full shrink-0 md:flex">'
    ),
    "Desktop sidebar wrapper must be hidden on mobile and flex at md+ with h-full and shrink-0"
  );
  assert.ok(
    !appShellSource.includes('className="hidden md:block"'),
    "Desktop Sidebar component must not receive hidden md:block (avoids overriding internal flex)"
  );
});

test("AppShell: mobile and desktop navigation remain independent", () => {
  assert.ok(appShellSource.includes("isMobile={false}"), "Desktop Sidebar must receive isMobile={false}");
  assert.ok(appShellSource.includes("isMobile={true}"), "Mobile drawer Sidebar must receive isMobile={true}");
  assert.ok(appShellSource.includes('className="md:hidden p-2'), "Hamburger button must be mobile-only");
  assert.ok(appShellSource.includes("setIsMobileMenuOpen(false)"), "Mobile drawer must close on navigation");
});

test("AppShell: guardNavigation and exam modal handlers are passed", () => {
  assert.ok(appShellSource.includes("guardNavigation={guardNavigation}"), "AppShell must pass guardNavigation");
  assert.ok(appShellSource.includes("onOpenExamModal={onOpenExamModal}"), "AppShell must pass onOpenExamModal");
});

test("Background: mesh stays behind the app shell stacking layer", () => {
  assert.ok(
    backgroundSource.includes("pointer-events-none fixed inset-0 -z-10"),
    "OrganicMeshBackground must use fixed inset-0 with negative z-index so it cannot cover UI"
  );
  assert.ok(
    appShellSource.includes("relative z-10 flex h-screen w-screen"),
    "AppShell root must establish an above-background stacking layer"
  );
});
