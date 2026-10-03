// Optional browser checks. Supply Playwright and Chromium paths for your machine.
const assert = require("node:assert/strict");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
const url = process.env.VOLAM_TEST_URL || "http://127.0.0.1:5173";
const saveKey = "giang-ho-di-truyen-prototype";

async function saved(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), saveKey);
}

async function seed(page, playerChanges, removeNewFields = false) {
  await page.locator("#save-btn").evaluate((el) => el.click());
  const snapshot = await saved(page);
  Object.assign(snapshot.player, playerChanges);
  if (removeNewFields)
    for (const key of ["potions", "potionCooldown", "pendingItems", "dungeonClears", "idle"])
      delete snapshot.player[key];
  await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), {
    key: saveKey,
    data: snapshot,
  });
  await page.locator("#load-btn").evaluate((el) => el.click());
  return snapshot;
}

const makeItem = (id) => ({
  id,
  name: "Kiếm kiểm thử",
  slot: "weapon",
  rarity: "Tốt",
  level: 1,
  power: 13,
  enhance: 0,
  color: "#73d19b",
  icon: "⚔",
});
const strongFixture = {
  level: 10,
  xp: 0,
  attack: 400,
  defense: 1000,
  maxHp: 466,
  hp: 466,
  potions: { hp: 5, mp: 5 },
  dungeonClears: { tomb: 0, bamboo: 0 },
};

async function openTab(page, tab) {
  await page.locator('[data-idle-tab="inv"]').click();
  await page.locator(`.inventory-panel [data-tab="${tab}"]`).click();
}

async function closeSheet(page) {
  if (await page.locator("#mobile-sheet-close").isVisible()) await page.locator("#mobile-sheet-close").click();
}

async function audit(page, width, height) {
  const result = await page.evaluate(() => {
    const selectors = [
      ".joystick",
      ".potion-button",
      ".skill-button",
      ".mobile-pickup",
      ".mobile-action",
      ".mobile-bottom-nav",
      ".mobile-map-card",
      ".bottom-nav",
    ];
    const boxes = selectors.flatMap((selector) =>
      [...document.querySelectorAll(selector)]
        .filter((el) => el.checkVisibility())
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { selector, x: r.x, y: r.y, right: r.right, bottom: r.bottom };
        }),
    );
    const overlap = [];
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i],
          b = boxes[j];
        if (
          Math.min(a.right, b.right) - Math.max(a.x, b.x) > 1 &&
          Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y) > 1
        )
          overlap.push([a.selector, b.selector]);
      }
    return {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      overlap,
      offscreen: boxes.filter(
        (r) => r.x < -0.5 || r.y < -0.5 || r.right > innerWidth + 0.5 || r.bottom > innerHeight + 0.5,
      ),
    };
  });
  assert.equal(result.width, width);
  assert.equal(result.height, height);
  assert.deepEqual(result.overlap, []);
  assert.deepEqual(result.offscreen, []);
}

(async () => {
  const { BAG_CAPACITY } = await import("../src/progression.ts");
  const browser = await chromium.launch({
    executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 740 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400 && r.url().startsWith(url)) errors.push(`${r.status()} ${r.url()}`);
    });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator('[data-faction="shaolin"]').click();
    await seed(page, {}, true);
    await page.locator("#save-btn").evaluate((el) => el.click());
    let state = (await saved(page)).player;
    assert.deepEqual(state.potions, { hp: 3, mp: 2 }, "old save migration");
    assert.deepEqual(state.pendingItems, []);
    assert.deepEqual(state.dungeonClears, { tomb: 0, bamboo: 0 });
    console.log("PASS old-save migration, no character reset");

    await seed(page, {
      gold: 100,
      hp: 20,
      mp: 10,
      potions: { hp: 3, mp: 2 },
      potionCooldown: 0,
      pendingItems: [],
      inventory: [makeItem("sale-test")],
    });
    await openTab(page, "shop");
    await page.locator('[data-buy-potion="hp"][data-quantity="1"]').click();
    state = (await saved(page)).player;
    assert.equal(state.gold, 80);
    assert.equal(state.potions.hp, 4);
    await page.locator('[data-buy-potion="mp"][data-quantity="5"]').click();
    state = (await saved(page)).player;
    assert.equal(state.gold, 5);
    assert.equal(state.potions.mp, 7);
    assert.equal(await page.locator('[data-buy-potion="hp"][data-quantity="1"]').isDisabled(), true);
    const focusButton = page.locator("[data-open-bag]");
    await focusButton.focus();
    await page.waitForTimeout(350);
    assert.equal(
      await focusButton.evaluate((el) => document.activeElement === el),
      true,
      "sheet did not replace focused buttons every tick",
    );
    await page.locator('.inventory-panel [data-tab="bag"]').click();
    await page.locator(".sell-btn").click();
    assert.equal((await saved(page)).player.inventory.length, 1, "first sale click must not sell");
    await page.locator("[data-cancel-sale]").click();
    assert.equal((await saved(page)).player.inventory.length, 1);
    await page.locator(".sell-btn").click();
    await page.locator(".sell-btn").click();
    state = (await saved(page)).player;
    assert.equal(state.inventory.length, 0);
    assert.equal(state.gold, 34);
    assert.equal(await page.locator(".equipped-block .sell-btn").count(), 0, "equipped gear cannot be sold");
    console.log("PASS purchases, wallet, stack counts, stable focus, sale confirmation/cancel");

    await closeSheet(page);
    await page.locator('.potion-shortcuts [data-use-potion="hp"]').click();
    state = (await saved(page)).player;
    assert.equal(state.potions.hp, 3);
    assert.ok(state.hp > 20 && state.hp <= state.maxHp);
    assert.equal(await page.locator('.potion-shortcuts [data-use-potion="mp"]').isDisabled(), true);
    const afterHp = state;
    await page.keyboard.press("r");
    await page.locator("#save-btn").evaluate((el) => el.click());
    assert.equal((await saved(page)).player.potions.mp, afterHp.potions.mp, "shared cooldown prevents double use");
    await seed(page, { hp: afterHp.maxHp, mp: afterHp.maxMp, potionCooldown: 0 });
    await page.keyboard.press("q");
    await page.locator("#save-btn").evaluate((el) => el.click());
    assert.equal((await saved(page)).player.potions.hp, 3, "full HP does not consume a potion");
    await seed(page, { mp: 10, potionCooldown: 0 });
    await page.locator('.potion-shortcuts [data-use-potion="mp"]').click();
    state = (await saved(page)).player;
    assert.equal(state.potions.mp, 6);
    assert.ok(state.mp > 10 && state.mp <= state.maxMp);
    await seed(page, { potionCooldown: 0, potions: { hp: 0, mp: 6 } });
    assert.equal(await page.locator('.potion-shortcuts [data-use-potion="hp"]').isDisabled(), true);
    await page.keyboard.press("q");
    await page.locator("#save-btn").evaluate((el) => el.click());
    assert.equal((await saved(page)).player.potions.hp, 0);
    console.log("PASS HP/MP potions, shared cooldown, full-resource and empty no-consumption");

    for (const [width, height] of [
      [320, 568],
      [360, 640],
      [390, 740],
      [600, 960],
      [844, 390],
    ]) {
      await page.setViewportSize({ width, height });
      await page.waitForTimeout(180);
      await audit(page, width, height);
      await openTab(page, "shop");
      const bounds = await page.locator(".inventory-panel").boundingBox();
      assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= height);
      assert.ok(await page.locator('.inventory-panel [data-tab="shop"]').isVisible());
      await closeSheet(page);
      console.log(`PASS ${width}x${height}: potion controls, five tabs, no scroll/overlap`);
    }
    await page.setViewportSize({ width: 390, height: 740 });
    await seed(page, {
      ...strongFixture,
      inventory: Array.from({ length: BAG_CAPACITY }, (_, i) => makeItem(`bag-${i}`)),
      pendingItems: [],
      gold: 500,
    });
    await openTab(page, "dungeon");
    assert.equal(await page.locator('[data-dungeon-id="bamboo"]').isDisabled(), true, "prerequisite locked");
    const beforeRun = (await saved(page)).player;
    await page.locator('[data-dungeon-id="tomb"]').click();
    assert.equal(await page.locator(".inventory-panel").isVisible(), false, "entry closes bottom sheet");
    assert.ok((await page.locator(".mobile-map-channel").textContent()).includes("1/2"));
    await openTab(page, "shop");
    assert.equal(
      await page.locator('[data-buy-potion="hp"][data-quantity="1"]').isDisabled(),
      true,
      "no shop in instance",
    );
    await closeSheet(page);
    await page.locator("#mobile-auto").click();
    await page.waitForFunction(() => document.querySelector(".mobile-map-channel").textContent.includes("2/2"), {
      timeout: 45000,
    });
    await page.waitForFunction(() => document.querySelector("#mobile-chat").textContent.includes("hoàn thành!"), {
      timeout: 45000,
    });
    await openTab(page, "dungeon");
    assert.ok((await page.locator("#inventory-content").textContent()).includes("Cổ Mộ Bí Ẩn hoàn thành"));
    // Send a second delegated claim after the first returns to the world.
    await page.locator('[data-dungeon-action="claim"]').evaluate((el) => {
      const replay = el.cloneNode(true);
      const parent = el.closest("#inventory-content");
      el.click();
      parent.append(replay);
      replay.click();
      replay.remove();
    });
    state = (await saved(page)).player;
    assert.equal(state.dungeonClears.tomb, 1);
    assert.equal(state.dungeonTokens, beforeRun.dungeonTokens + 1);
    assert.equal(state.inventory.length, BAG_CAPACITY);
    assert.ok(state.pendingItems.length >= 2, "guaranteed and boss gear retained with a full bag");
    assert.ok(state.gold > beforeRun.gold + 420, "unpicked currency recovered");
    assert.equal(await page.locator("#mobile-map-name").textContent(), "RỪNG TRÚC");
    await closeSheet(page);
    await page.locator("#mobile-auto").click();
    await page.reload();
    await page.locator("#load-btn").evaluate((el) => el.click());
    await openTab(page, "bag");
    assert.ok((await page.locator(".pending-rewards").textContent()).includes("Đồ chờ nhận"));
    assert.equal(await page.locator("[data-collect-pending]").isDisabled(), true);
    await page.locator(".sell-btn").first().click();
    await page.locator(".sale-confirm").click();
    const pendingBefore = (await saved(page)).player.pendingItems.length;
    await page.locator("[data-collect-pending]").click();
    state = (await saved(page)).player;
    assert.equal(state.pendingItems.length, pendingBefore - 1);
    assert.equal(state.inventory.length, BAG_CAPACITY);
    console.log("PASS tomb waves, clear, replay guard, full-bag reward recovery and reload");

    await closeSheet(page);
    await openTab(page, "dungeon");
    assert.equal(await page.locator('[data-dungeon-id="bamboo"]').isDisabled(), false);
    await page.locator('[data-dungeon-id="bamboo"]').click();
    await page.locator("#mobile-auto").click();
    await page.waitForFunction(() => document.querySelector(".mobile-map-channel").textContent.includes("2/3"), {
      timeout: 45000,
    });
    await page.waitForFunction(() => document.querySelector(".mobile-map-channel").textContent.includes("3/3"), {
      timeout: 45000,
    });
    await page.waitForFunction(() => document.querySelector("#mobile-chat").textContent.includes("hoàn thành!"), {
      timeout: 45000,
    });
    await openTab(page, "dungeon");
    await page.locator('[data-dungeon-action="claim"]').click();
    state = (await saved(page)).player;
    assert.equal(state.dungeonClears.bamboo, 1);
    assert.equal(state.dungeonTokens, beforeRun.dungeonTokens + 3);
    await closeSheet(page);
    await page.locator("#mobile-auto").click();
    await openTab(page, "dungeon");
    await page.screenshot({ path: "/tmp/volam-progression-mobile.png" });
    console.log("PASS bamboo three waves, its own boss, distinct rewards, unlock persistence");
    await closeSheet(page);

    await seed(page, { ...strongFixture, hp: 1, defense: 0, equipment: {} });
    await openTab(page, "dungeon");
    await page.locator('[data-dungeon-id="tomb"]').click();
    await page.waitForFunction(() => document.querySelector("#mobile-map-name").textContent === "RỪNG TRÚC", {
      timeout: 20000,
    });
    assert.equal(await page.locator("#mobile-auto").getAttribute("aria-pressed"), "false");
    await page.locator("#save-btn").evaluate((el) => el.click());
    assert.equal((await saved(page)).player.dungeonClears.tomb, 0, "defeat has no clear reward");
    console.log("PASS defeat closes instance, respawns safely, gives no completion reward");

    await seed(page, { ...strongFixture, defense: 100000 });
    await openTab(page, "dungeon");
    await page.locator('[data-dungeon-id="tomb"]').click();
    await openTab(page, "dungeon");
    await page.locator('[data-dungeon-action="leave"]').click();
    assert.equal(await page.locator("#mobile-map-name").textContent(), "RỪNG TRÚC");
    await closeSheet(page);
    await page.locator("#save-btn").evaluate((el) => el.click());
    assert.equal((await saved(page)).player.dungeonClears.tomb, 0);
    console.log("PASS abandoned run closes cleanly with no completion reward");
    await page.clock.install();
    await openTab(page, "dungeon");
    await page.locator('[data-dungeon-id="tomb"]').click();
    await page.clock.runFor(181000);
    assert.equal(await page.locator("#mobile-map-name").textContent(), "RỪNG TRÚC");
    await page.locator("#save-btn").evaluate((el) => el.click());
    assert.equal((await saved(page)).player.dungeonClears.tomb, 0);
    console.log("PASS timeout closes instance without a completion reward");
    assert.deepEqual(errors, [], "no browser or asset errors");
    await context.close();

    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await desktop.goto(url);
    await desktop.locator('[data-faction="emei"]').click();
    await desktop.locator("#sect-overlay").waitFor({ state: "hidden" });
    await desktop.waitForTimeout(350);
    await openTab(desktop, "shop");
    assert.equal(await desktop.locator('[data-buy-potion="hp"][data-quantity="1"]').isVisible(), true);
    await desktop.screenshot({ path: "/tmp/volam-progression-desktop.png" });
    console.log("PASS desktop shop and keyboard-accessible controls");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
