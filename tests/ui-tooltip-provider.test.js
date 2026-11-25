import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(
  new URL("../src/App.jsx", import.meta.url),
  "utf8"
);

test("App.jsx: TooltipProvider wraps app content", () => {
  const providerIndex = appSource.indexOf("<TooltipProvider");
  assert.ok(
    providerIndex !== -1,
    "App.jsx must import TooltipProvider from @/components/ui/tooltip"
  );
  assert.ok(
    appSource.includes("<TooltipProvider>") || appSource.includes("<TooltipProvider "),
    "App.jsx must wrap content with <TooltipProvider> JSX"
  );
  assert.ok(
    appSource.includes("</TooltipProvider>"),
    "App.jsx must close </TooltipProvider>"
  );
  // The legacy FloatingDock was replaced by AppShell Sidebar.
  // TooltipProvider must appear before AppShell in the source order.
  const shellIndex = appSource.indexOf("<AppShell");
  assert.ok(
    providerIndex !== -1 && shellIndex !== -1 && providerIndex < shellIndex,
    "TooltipProvider must appear before AppShell in App.jsx"
  );
});
