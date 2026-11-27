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

const EXPECTED_SIDEBAR_TOUR_ATTRS = [
  { item: "Dashboard", attr: 'tour: "bottom-navigation"' },
  { item: "Practice", attr: 'tour: "practice-navigation"' },
  { item: "Review", attr: 'tour: "review-navigation"' },
  { item: "History", attr: 'tour: "history-navigation"' },
  { item: "Settings", attr: 'tour: "settings-navigation"' },
];

test("Sidebar: NAV_ITEMS has tour values matching tour steps", () => {
  for (const { item, attr } of EXPECTED_SIDEBAR_TOUR_ATTRS) {
    assert.ok(
      sidebarSource.includes(attr),
      `Sidebar NAV_ITEMS ${item} must have ${attr}`
    );
  }
});

test("Sidebar: Link renders data-tour from item.tour", () => {
  assert.ok(
    sidebarSource.includes('data-tour={item.tour}'),
    "Sidebar Link must render data-tour from item.tour"
  );
});

test("Sidebar: Full Exam CTA button has data-tour=\"exam-button\"", () => {
  assert.ok(
    sidebarSource.includes('data-tour="exam-button"'),
    "Sidebar Full Exam CTA button must have data-tour=\"exam-button\""
  );
});

test("AppShell: header Full Exam button has data-tour=\"exam-button\"", () => {
  assert.ok(
    appShellSource.includes('data-tour="exam-button"'),
    "AppShell header Full Exam button must have data-tour=\"exam-button\""
  );
});
