import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(
  new URL("../src/App.jsx", import.meta.url),
  "utf8"
);

test("App.jsx: imports TooltipProvider from tooltip component", () => {
  assert.ok(
    appSource.includes('import { TooltipProvider'),
    "App.jsx must import TooltipProvider from @/components/ui/tooltip"
  );
});

test("App.jsx: wraps app content with TooltipProvider", () => {
  assert.ok(
    appSource.includes("<TooltipProvider>") || appSource.includes("<TooltipProvider "),
    "App.jsx must wrap content with <TooltipProvider> JSX"
  );
  assert.ok(
    appSource.includes("</TooltipProvider>"),
    "App.jsx must close </TooltipProvider>"
  );
});

test("App.jsx: TooltipProvider wraps FloatingDock", () => {
  const providerIndex = appSource.indexOf("<TooltipProvider");
  const dockIndex = appSource.indexOf("<FloatingDock");
  assert.ok(
    providerIndex !== -1 && dockIndex !== -1 && providerIndex < dockIndex,
    "TooltipProvider must appear before FloatingDock in App.jsx"
  );
});
