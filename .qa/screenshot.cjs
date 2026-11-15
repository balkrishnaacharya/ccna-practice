const CDP = require("chrome-remote-interface");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://localhost:1420";
const OUT_DIR = ".qa";

async function takeScreenshot(pagePath, viewport, name) {
  const client = await CDP({ port: 9222 });
  const { Page, Emulation, Runtime, Network } = client;

  try {
    await Promise.all([Page.enable(), Runtime.enable(), Network.enable()]);

    await Emulation.setDeviceMetricsOverride({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile,
      fitWindow: false,
    });

    await Page.navigate({ url: `${BASE_URL}${pagePath}` });

    // Wait for load event
    await new Promise((resolve) => {
      Page.loadEventFired(() => resolve());
    });
    await new Promise((r) => setTimeout(r, 3000));

    const result = await Page.captureScreenshot({
      format: "png",
      quality: 90,
      captureBeyondViewport: true,
    });

    const filename = path.join(OUT_DIR, `${name}.png`);
    fs.writeFileSync(filename, Buffer.from(result.data, "base64"));
    console.log(`  Saved: ${name}.png (${viewport.width}x${viewport.height})`);
  } finally {
    await client.close();
  }
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

  const pages = [
    { path: "/", name: "home_before" },
    { path: "/quiz", name: "questions_before" },
    { path: "/review", name: "results_before" },
    { path: "/settings", name: "settings_before" },
    { path: "/flashcards", name: "flashcards_before" },
    { path: "/topics", name: "topics_before" },
    { path: "/history", name: "history_before" },
    { path: "/notes", name: "notes_before" },
    { path: "/practical-exam", name: "practical-exam_before" },
    { path: "/exam", name: "exam_before" },
  ];

  const desktop = { width: 1440, height: 900, mobile: false };
  const mobile = { width: 375, height: 667, mobile: true };

  for (const page of pages) {
    console.log(`\n=== ${page.path} ===`);
    await takeScreenshot(page.path, desktop, page.name);
    await takeScreenshot(page.path, mobile, `${page.name}_mobile`);
  }

  console.log("\nDone!");
}

main().catch(console.error);
