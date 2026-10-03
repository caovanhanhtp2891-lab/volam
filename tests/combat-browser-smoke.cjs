const assert = require("node:assert/strict");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
const url = process.env.VOLAM_TEST_URL || "http://127.0.0.1:5173";
const key = "giang-ho-di-truyen-prototype";
const read = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
async function save(page) {
  await page.locator("#save-btn").evaluate((el) => el.click());
  return read(page);
}
async function seed(page, change) {
  const snapshot = await save(page);
  change(snapshot);
  await page.evaluate(
    ({ key, snapshot }) => localStorage.setItem(key, JSON.stringify(snapshot)),
    { key, snapshot },
  );
  await page.locator("#load-btn").evaluate((el) => el.click());
}
async function pause(page) {
  if (
    (await page.locator("#mobile-auto").getAttribute("aria-pressed")) === "true"
  ) {
    if (!(await page.locator("#mobile-auto").isVisible()))
      await page.locator('[data-idle-tab="log"]').click();
    await page.locator("#mobile-auto").click();
  }
}
const item = (id) => ({
  id,
  name: "Thanh Giáp kiểm thử",
  slot: "armor",
  rarity: "Hiếm",
  level: 10,
  power: 100,
  enhance: 0,
  color: "#64b5f6",
  icon: "◈",
});
function fighter(s) {
  Object.assign(s.player, {
    level: 10,
    attack: 10,
    defense: 10000,
    hp: 1000,
    maxHp: 1000,
    mp: 180,
    cooldowns: { skill1: 0, skill2: 0, ultimate: 0 },
    skillRanks: { skill1: 1, skill2: 1, ultimate: 1 },
  });
  Object.assign(s.player.idle, {
    stage: 10,
    maxStage: 10,
    wave: 4,
    push: false,
    inTown: false,
    autoSkills: false,
    autoLoot: false,
    autoEquip: false,
  });
  s.groundLoot = [];
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400 && r.url().startsWith(url))
        errors.push(`${r.status()} ${r.url()}`);
    });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator('[data-faction="tianwang"]').click();
    await page.locator("#join-sect").click();
    await seed(page, fighter);
    await pause(page);
    const start = (await save(page)).player;
    await page.keyboard.down("d");
    await page.waitForTimeout(350);
    await page.keyboard.up("d");
    const moved = (await save(page)).player;
    assert.ok(
      moved.x - start.x > 45 && moved.x - start.x < 130,
      "movement uses elapsed time rather than one pixel per frame",
    );
    assert.ok(Math.abs(moved.y - start.y) < 1);
    await page.screenshot({ path: "/tmp/volam-moving-mobile.png" });
    console.log("PASS actual movement distance, direction and stopping");

    await seed(page, (s) => {
      fighter(s);
      s.player.idle.inTown = true;
    });
    const empty = await save(page);
    await page.keyboard.press("1");
    const invalid = await save(page);
    assert.equal(invalid.player.mp, empty.player.mp);
    assert.equal(invalid.player.cooldowns.skill1, 0);
    console.log("PASS no target: no mana or cooldown consumed");

    await seed(page, fighter);
    await pause(page);
    await page.keyboard.down("s");
    await page.waitForTimeout(220);
    await page.keyboard.up("s");
    const dashStart = (await save(page)).player;
    await page.keyboard.press("2");
    const dashMid = (await save(page)).player;
    assert.ok(
      Math.hypot(dashMid.x - dashStart.x, dashMid.y - dashStart.y) < 100,
      "dash does not teleport",
    );
    await page.waitForTimeout(350);
    const dashEnd = (await save(page)).player;
    assert.ok(
      Math.hypot(dashEnd.x - dashStart.x, dashEnd.y - dashStart.y) > 90,
    );
    console.log("PASS dash animates across frames and reaches its endpoint");

    await seed(page, (s) => {
      fighter(s);
      s.player.attack = 100000;
      s.player.idle.totalKills = 0;
      s.player.inventory = [];
    });
    await page.waitForFunction(
      () =>
        /Đã hạ [1-9]/.test(
          document.querySelector("#stage-description").textContent,
        ),
      null,
      { timeout: 10000 },
    );
    await pause(page);
    let dropped = await save(page);
    const rare = dropped.groundLoot.find((l) => l.item?.rarity === "Cực phẩm");
    assert.ok(rare, "actual boss drops equipment");
    await page.waitForTimeout(650);
    await page.screenshot({ path: "/tmp/volam-equipment-drop-mobile.png" });
    await page.reload({ waitUntil: "networkidle" });
    await pause(page);
    assert.equal(
      (await save(page)).groundLoot.filter((l) => l.id === rare.id).length,
      1,
      "uncollected drop survives reload exactly once",
    );
    // Reload returns to the arena centre, so tapping the persisted drop also tests walking to collect.
    await page.waitForTimeout(350);
    const at = await page.evaluate(
      ({ key, loot }) => {
        const p = JSON.parse(localStorage.getItem(key)).player,
          c = document.querySelector("#game-canvas"),
          r = c.getBoundingClientRect();
        const cx = Math.max(0, Math.min(1900 - c.width, p.x - c.width / 2)),
          cy = Math.max(0, Math.min(1200 - c.height, p.y - c.height / 2));
        return {
          x: r.x + ((loot.x - cx) / c.width) * r.width,
          y: r.y + ((loot.y - cy) / c.height) * r.height,
        };
      },
      { key, loot: rare },
    );
    await page.mouse.click(at.x, at.y);
    await page.waitForFunction(
      ({ key, id }) =>
        JSON.parse(localStorage.getItem(key)).player.inventory.some(
          (item) => item.id === id,
        ),
      { key, id: rare.item.id },
      { timeout: 8000 },
    );
    let picked = await save(page);
    assert.equal(
      picked.player.inventory.filter((i) => i.id === rare.item.id).length,
      1,
    );
    assert.equal(picked.groundLoot.filter((l) => l.id === rare.id).length, 0);
    assert.ok(
      await page.locator(".loot-notice").count(),
      "pickup produces visible loot feedback",
    );
    if (await page.locator(`[data-loot-item="${rare.item.id}"]`).count())
      await page.locator(`[data-loot-item="${rare.item.id}"]`).click();
    else {
      await page.locator('[data-idle-tab="inv"]').click();
      await page.locator(`[data-inspect-item="${rare.item.id}"]`).click();
    }
    assert.match(
      await page.locator(".item-comparison").textContent(),
      /so với hiện tại/,
    );
    await page.locator("[data-inspect-equip]").click();
    picked = await read(page);
    assert.equal(picked.player.equipment[rare.item.slot].id, rare.item.id);
    console.log(
      "PASS real boss drop, persistent ground loot, tap-to-walk pickup, comparison and equip",
    );

    await seed(page, (s) => {
      fighter(s);
      s.player.inventory = Array.from({ length: 60 }, (_, i) =>
        item(`full-${i}`),
      );
      s.player.pendingItems = [];
      s.groundLoot = [
        {
          id: "full-drop",
          x: 960,
          y: 650,
          item: item("overflow-drop"),
          gold: 0,
          stones: 0,
        },
        { id: "coins", x: 965, y: 650, gold: 17, stones: 0 },
      ];
    });
    await pause(page);
    const wallet = (await save(page)).player.gold;
    await page.keyboard.press("e");
    const full = await save(page);
    assert.equal(full.player.gold, wallet + 17);
    assert.equal(full.groundLoot.filter((l) => l.id === "full-drop").length, 1);
    await page.reload({ waitUntil: "networkidle" });
    await pause(page);
    assert.equal(
      (await save(page)).groundLoot.filter((l) => l.id === "full-drop").length,
      1,
    );
    await page.locator('[data-idle-tab="more"]').click();
    await page.locator('[data-setting="autoLoot"]').check();
    await page.waitForFunction(
      (key) =>
        JSON.parse(localStorage.getItem(key)).player.pendingItems.some(
          (i) => i.id === "overflow-drop",
        ),
      key,
      { timeout: 5000 },
    );
    const recovered = await read(page);
    assert.equal(recovered.player.inventory.length, 60);
    assert.equal(
      recovered.player.pendingItems.filter((i) => i.id === "overflow-drop")
        .length,
      1,
    );
    assert.equal(
      recovered.groundLoot.filter((l) => l.id === "full-drop").length,
      0,
    );
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(
      (await read(page)).player.pendingItems.filter(
        (i) => i.id === "overflow-drop",
      ).length,
      1,
    );
    console.log(
      "PASS full bag preserves equipment, still collects coins and auto-loot recovers to pending once",
    );
    await context.close();

    const rangedContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const ranged = await rangedContext.newPage();
    ranged.on("pageerror", (e) => errors.push(e.message));
    await ranged.goto(url);
    await ranged.locator('[data-faction="tangmen"]').click();
    await ranged.locator("#join-sect").click();
    await seed(ranged, fighter);
    await pause(ranged);
    await ranged.waitForTimeout(550);
    const before = await save(ranged);
    await ranged.keyboard.press("1");
    const launched = await save(ranged);
    assert.ok(launched.player.mp < before.player.mp - 7);
    assert.equal(
      launched.enemies[0].hp,
      before.enemies[0].hp,
      "projectile does not damage on launch",
    );
    await ranged.waitForTimeout(180);
    await ranged.screenshot({ path: "/tmp/volam-projectile-desktop.png" });
    await ranged.waitForTimeout(500);
    const impact = await save(ranged);
    assert.ok(
      impact.enemies[0].hp < before.enemies[0].hp,
      "projectile damages on arrival",
    );
    await ranged.keyboard.press("3");
    await ranged.waitForTimeout(200);
    await ranged.screenshot({ path: "/tmp/volam-combat-desktop.png" });
    console.log(
      "PASS ranged mana cost, projectile flight and damage on impact",
    );
    assert.deepEqual(errors, [], "no browser or asset errors");
    await rangedContext.close();
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
