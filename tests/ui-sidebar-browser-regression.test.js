import test from "node:test";
import assert from "node:assert/strict";
import WebSocket from "ws";
import http from "http";

/**
 * Browser visual/DOM regression test for the desktop/mobile sidebar.
 *
 * Connects to a Chrome instance with remote debugging enabled (port 9222)
 * and verifies sidebar visibility, layout, stacking, and basic interactions.
 *
 * Prerequisites:
 *   1. Vite dev server running (default http://127.0.0.1:1420/)
 *      - override with VITE_URL or DEV_SERVER_URL
 *   2. Chrome with remote debugging:
 *      google-chrome --headless --new --remote-debugging-port=9222
 */

const CHROME_WS_URL = process.env.CHROME_WS_URL || "http://127.0.0.1:9222";
const VITE_URL = process.env.VITE_URL || process.env.DEV_SERVER_URL || "http://127.0.0.1:1420/";
const APP_ORIGIN = new URL(VITE_URL).origin;
const DESKTOP_VIEWPORTS = [768, 900, 1024, 1280, 1440];
const MOBILE_VIEWPORTS = [320, 360, 390, 430, 767];

let seq = 0;
const pending = new Map();

function send(ws, method, params) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

function onMessage(ws, data) {
  const msg = JSON.parse(data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(msg.error);
    else resolve(msg.result);
  }
}

async function evaluate(ws, expression, awaitPromise = false) {
  const result = await send(ws, "Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Runtime.evaluate failed");
  }
  return result.result ? result.result.value : undefined;
}

async function setViewport(ws, width, height = 900) {
  const mobile = width < 768;
  await send(ws, "Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  });
  await evaluate(ws, "new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))", true);
  await new Promise((r) => setTimeout(r, 200));
}

async function findAppPage() {
  return new Promise((resolve, reject) => {
    const req = http.get(`${CHROME_WS_URL}/json/list`, (resp) => {
      let data = "";
      resp.on("data", (chunk) => (data += chunk));
      resp.on("end", () => {
        try {
          const pages = JSON.parse(data);
          resolve(
            pages.find(
              (p) =>
                p.url &&
                (p.url.startsWith(APP_ORIGIN) ||
                  p.url.includes(new URL(VITE_URL).host))
            )
          );
        } catch {
          reject(new Error("Failed to parse Chrome debugging endpoint response"));
        }
      });
    });
    req.on("error", () => reject(new Error("Chrome remote debugging not available")));
    req.setTimeout(3000, () => {
      req.destroy();
      reject(new Error("Chrome remote debugging timed out"));
    });
  });
}

async function connectToChrome() {
  const appPage = await findAppPage();
  if (!appPage) throw new Error(`No app page found at ${VITE_URL}`);

  const ws = new WebSocket(appPage.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.on("open", resolve);
    ws.on("error", reject);
  });
  ws.on("message", (data) => onMessage(ws, data));

  await send(ws, "Page.enable", {});
  await send(ws, "Runtime.enable", {});
  await send(ws, "DOM.enable", {});

  if (!appPage.url.startsWith(APP_ORIGIN)) {
    await send(ws, "Page.navigate", { url: VITE_URL });
  }
  await evaluate(ws, "location.href", false).catch(() => {});
  await new Promise((r) => setTimeout(r, 3000));
  const loaded = await evaluate(
    ws,
    "!!document.querySelector('#root') && !!document.querySelector('aside[aria-label=\"Main sidebar navigation\"], button[aria-label=\"Open navigation menu\"]')"
  );
  if (!loaded) throw new Error(`App not fully loaded at ${VITE_URL}`);
  // Skip splash if present
  await evaluate(
    ws,
    `(() => { try { sessionStorage.setItem('ccna_splash_seen','1'); } catch {} return true; })()`
  );
  return ws;
}

async function readDesktopState(ws) {
  return evaluate(
    ws,
    `(() => {
      const aside = document.querySelector('aside[aria-label="Main sidebar navigation"]');
      const main = document.querySelector('main');
      if (!aside) return { found: false };
      const rect = aside.getBoundingClientRect();
      const style = getComputedStyle(aside);
      const centerX = Math.max(1, Math.min(window.innerWidth - 1, rect.left + Math.min(rect.width, 40) / 2 + 2));
      const centerY = Math.max(1, Math.min(window.innerHeight - 1, rect.top + Math.min(rect.height, window.innerHeight) / 2));
      const topEl = document.elementFromPoint(centerX, centerY);
      const labels = Array.from(aside.querySelectorAll('nav a span.truncate')).filter((s) => s.textContent && s.textContent.trim());
      const visibleLabelCount = labels.filter((s) => {
        const r = s.getBoundingClientRect();
        const cs = getComputedStyle(s);
        return r.width > 0 && r.height > 0 && cs.visibility === 'visible' && cs.opacity !== '0' && cs.display !== 'none';
      }).length;
      const mainRect = main ? main.getBoundingClientRect() : null;
      const sidebarRight = rect.left + rect.width;
      return {
        found: true,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top,
        sidebarRight,
        covered: !(topEl === aside || aside.contains(topEl)),
        topEl: topEl ? (topEl.tagName + (topEl.className ? '.' + String(topEl.className).split(/\\s+/).slice(0,2).join('.') : '')) : null,
        visibleLabelCount,
        labelCount: labels.length,
        navCount: aside.querySelectorAll('nav a').length,
        mainLeft: mainRect ? mainRect.left : null,
        mainOverlapsSidebar: mainRect ? (mainRect.left < sidebarRight - 1) : false,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      };
    })()`
  );
}

async function readMobileState(ws) {
  return evaluate(
    ws,
    `(() => {
      const aside = document.querySelector('aside[aria-label="Main sidebar navigation"]');
      const asideRect = aside ? aside.getBoundingClientRect() : null;
      const asideStyle = aside ? getComputedStyle(aside) : null;
      const desktopSidebarVisible = !!(asideRect && asideStyle && asideRect.width > 0 && asideRect.height > 0 && asideStyle.display !== 'none' && asideStyle.visibility !== 'hidden' && asideStyle.opacity !== '0');
      const hamburger = document.querySelector('button[aria-label="Open navigation menu"]');
      const hRect = hamburger ? hamburger.getBoundingClientRect() : null;
      const hStyle = hamburger ? getComputedStyle(hamburger) : null;
      const hamburgerVisible = !!(hRect && hStyle && hRect.width > 0 && hRect.height > 0 && hStyle.display !== 'none' && hStyle.visibility !== 'hidden');
      const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
      const dialogLinks = dialog ? dialog.querySelectorAll('nav a').length : 0;
      return { desktopSidebarVisible, hamburgerVisible, drawerOpen: !!dialog, dialogLinks };
    })()`
  );
}

test("Browser: desktop/mobile sidebar regression matrix", async () => {
  let ws;
  try {
    ws = await connectToChrome();
  } catch (err) {
    console.log(
      `SKIP: Browser regression test - ${err.message}. ` +
        `Start Chrome with remote debugging at ${CHROME_WS_URL} and Vite dev server at ${VITE_URL}`
    );
    return;
  }

  try {
    // Desktop checks
    for (const width of DESKTOP_VIEWPORTS) {
      await setViewport(ws, width, 900);
      // Ensure no mobile drawer is open
      await evaluate(ws, `(() => { const close = document.querySelector('button[aria-label="Close navigation"]'); if (close) close.click(); return true; })()`);
      await new Promise((r) => setTimeout(r, 150));
      const state = await readDesktopState(ws);
      assert.ok(state.found, `${width}px: sidebar aside must exist in DOM`);
      assert.equal(state.display === "none", false, `${width}px: sidebar must not have display none`);
      assert.equal(state.visibility, "visible", `${width}px: sidebar visibility must be visible`);
      assert.equal(state.opacity, "1", `${width}px: sidebar opacity must be 1`);
      assert.ok(state.width > 0, `${width}px: sidebar width must be > 0 (got ${state.width})`);
      assert.ok(state.height > 0, `${width}px: sidebar height must be > 0`);
      assert.equal(state.covered, false, `${width}px: sidebar must not be covered (top element: ${state.topEl})`);
      assert.ok(state.navCount >= 8, `${width}px: sidebar must render navigation items`);
      assert.ok(state.visibleLabelCount >= 8, `${width}px: expanded sidebar labels must be visible (${state.visibleLabelCount}/${state.labelCount})`);
      if (state.mainLeft != null) {
        assert.ok(state.mainLeft >= state.sidebarRight - 2, `${width}px: main content must start after sidebar (main ${state.mainLeft}, sidebarRight ${state.sidebarRight})`);
        assert.equal(state.mainOverlapsSidebar, false, `${width}px: main content must not overlap sidebar`);
      }
      assert.equal(state.hasHorizontalOverflow, false, `${width}px: sidebar/layout must not cause horizontal overflow`);
    }

    // Collapse/expand behavior at desktop width
    await setViewport(ws, 1440, 900);
    const expandedWidth = await evaluate(ws, `document.querySelector('aside[aria-label="Main sidebar navigation"]').getBoundingClientRect().width`);
    assert.ok(expandedWidth >= 250 && expandedWidth <= 260, `Expanded sidebar width should be ~256px (got ${expandedWidth})`);
    await evaluate(ws, `document.querySelector('button[aria-label="Collapse sidebar"]')?.click()`);
    await new Promise((r) => setTimeout(r, 400));
    const collapsed = await readDesktopState(ws);
    assert.ok(collapsed.width >= 76 && collapsed.width <= 84, `Collapsed sidebar width should be ~80px (got ${collapsed.width})`);
    assert.ok(collapsed.visibleLabelCount === 0, `Collapsed sidebar labels should be hidden (got ${collapsed.visibleLabelCount})`);
    await evaluate(ws, `document.querySelector('button[aria-label="Expand sidebar"]')?.click()`);
    await new Promise((r) => setTimeout(r, 400));
    const reexpanded = await readDesktopState(ws);
    assert.ok(reexpanded.width >= 250 && reexpanded.width <= 260, `Re-expanded sidebar width should be ~256px (got ${reexpanded.width})`);
    assert.ok(reexpanded.visibleLabelCount >= 8, `Re-expanded sidebar labels should be visible`);

    // Mobile checks
    for (const width of MOBILE_VIEWPORTS) {
      await setViewport(ws, width, 900);
      await evaluate(ws, `history.replaceState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate'));`);
      await new Promise((r) => setTimeout(r, 250));
      const state = await readMobileState(ws);
      assert.equal(state.desktopSidebarVisible, false, `${width}px: desktop sidebar must be hidden`);
      assert.equal(state.hamburgerVisible, true, `${width}px: hamburger must be visible`);
      assert.equal(state.drawerOpen, false, `${width}px: drawer should start closed`);

      await evaluate(ws, `document.querySelector('button[aria-label="Open navigation menu"]')?.click()`);
      await new Promise((r) => setTimeout(r, 300));
      const openState = await evaluate(ws, `(() => {
        const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
        const drawer = dialog ? dialog.querySelector('aside[aria-label="Main sidebar navigation"]') : null;
        const backdrop = dialog ? dialog.children[1] : null;
        const closeBtn = document.querySelector('button[aria-label="Close navigation"]');
        return {
          open: !!dialog,
          drawerVisible: !!drawer && getComputedStyle(drawer).display !== 'none',
          navLinks: drawer ? drawer.querySelectorAll('nav a').length : 0,
          hasBackdrop: !!backdrop,
          hasClose: !!closeBtn,
        };
      })()`);
      assert.equal(openState.open, true, `${width}px: drawer must open`);
      assert.equal(openState.drawerVisible, true, `${width}px: drawer must be visible above backdrop`);
      assert.ok(openState.navLinks >= 8, `${width}px: drawer navigation links must be visible/present`);
      assert.equal(openState.hasBackdrop, true, `${width}px: drawer backdrop must exist`);
      assert.equal(openState.hasClose, true, `${width}px: drawer close button must exist`);

      // Close by close button
      await evaluate(ws, `document.querySelector('button[aria-label="Close navigation"]')?.click()`);
      await new Promise((r) => setTimeout(r, 250));
      let closed = await evaluate(ws, `!document.querySelector('[role="dialog"][aria-modal="true"]')`);
      assert.equal(closed, true, `${width}px: close button must close drawer`);

      // Open and close by backdrop click
      await evaluate(ws, `document.querySelector('button[aria-label="Open navigation menu"]')?.click()`);
      await new Promise((r) => setTimeout(r, 250));
      await evaluate(ws, `(() => { const d = document.querySelector('[role="dialog"][aria-modal="true"]'); if (d && d.children[1]) d.children[1].click(); })()`);
      await new Promise((r) => setTimeout(r, 250));
      closed = await evaluate(ws, `!document.querySelector('[role="dialog"][aria-modal="true"]')`);
      assert.equal(closed, true, `${width}px: backdrop click must close drawer`);

      // Open and navigate
      await evaluate(ws, `document.querySelector('button[aria-label="Open navigation menu"]')?.click()`);
      await new Promise((r) => setTimeout(r, 250));
      await evaluate(ws, `(() => { const a = Array.from(document.querySelectorAll('[role="dialog"] nav a')).find(x => x.getAttribute('href') === '/quiz'); if (a) a.click(); })()`);
      await new Promise((r) => setTimeout(r, 500));
      const navState = await evaluate(ws, `({ path: location.pathname, drawerOpen: !!document.querySelector('[role="dialog"][aria-modal="true"]') })`);
      assert.equal(navState.path, "/quiz", `${width}px: clicking nav item must navigate to /quiz`);
      assert.equal(navState.drawerOpen, false, `${width}px: navigation must close drawer`);
    }

    // Breakpoint boundary
    await setViewport(ws, 767, 900);
    await evaluate(ws, `history.replaceState({}, '', '/');`);
    await new Promise((r) => setTimeout(r, 300));
    const at767 = await readMobileState(ws);
    assert.equal(at767.desktopSidebarVisible, false, "767px: desktop sidebar must be hidden");
    assert.equal(at767.hamburgerVisible, true, "767px: hamburger must be visible");

    await setViewport(ws, 768, 900);
    await new Promise((r) => setTimeout(r, 300));
    const at768 = await readDesktopState(ws);
    const at768Mobile = await readMobileState(ws);
    assert.equal(at768.display !== "none" && at768.width > 0, true, "768px: desktop sidebar must be visible");
    assert.equal(at768Mobile.hamburgerVisible, false, "768px: hamburger must be hidden");
  } finally {
    ws.close();
  }
});
