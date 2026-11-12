import test from "node:test";
import assert from "node:assert/strict";
import config from "../tailwind.config.js";

test("UI palette: refined chassis color tokens exist", () => {
  const colors = config.theme.extend.colors;

  assert.equal(colors.dark.bg, "#0E1118", "chassis base canvas");
  assert.equal(colors.dark.panel, "#171D25", "raised surface");
  assert.equal(colors.text.ink, "#E8EEF5", "primary text");
  assert.equal(colors.text.muted, "#7C8A97", "secondary text");
  assert.equal(colors.accent.gold, "#C9A227", "surgical accent");
});
