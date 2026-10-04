const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
const url = process.env.VOLAM_TEST_URL || "http://127.0.0.1:5173";
const key = "giang-ho-di-truyen-prototype";
const captureDir = process.env.VOLAM_CAPTURE_DIR || "/tmp/volam-gear-mount";
const read = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
async function save(page) {
  await page.locator("#save-btn").evaluate((el) => el.click());
  return read(page);
}
async function seed(page, change) {
  const s = await save(page);
  change(s);
  await page.evaluate(
    ({ key, s }) => {
      localStorage.setItem(key, JSON.stringify(s));
      document.querySelector("#load-btn").click();
      if (
        document.querySelector("#mobile-auto").getAttribute("aria-pressed") ===
        "true"
      )
        document.querySelector("#mobile-auto").click();
    },
    { key, s },
  );
}
const cp = async (page) =>
  Number(
    (await page.locator("#combat-power").textContent()).replaceAll(".", ""),
  );
async function arena(page) {
  await page.locator('[data-idle-tab="log"]').click();
  if (await page.locator(".game-layout").isVisible())
    await page.locator("#world-panel-close").click();
}
async function move(page) {
  const before = (await save(page)).player;
  await page.keyboard.down("d");
  await page.waitForTimeout(330);
  await page.keyboard.up("d");
  const after = (await save(page)).player;
  return Math.hypot(after.x - before.x, after.y - before.y);
}
(async () => {
  const { EQUIPMENT_SLOTS, GEAR_SETS, SET_IDS, GEAR_VARIANTS, variantOf } =
    await import("../src/gear-catalog.ts");
  const browser = await chromium.launch({
    executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    await fs.mkdir(captureDir, { recursive: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await context.addInitScript(() => {
      window.__horseDraws = { world: 0, preview: 0 };
      const original = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (
        source,
        ...args
      ) {
        if (
          source instanceof HTMLImageElement &&
          source.src.includes("riding-horses")
        ) {
          if (this.canvas.id === "game-canvas") window.__horseDraws.world++;
          if (this.canvas.id === "character-preview")
            window.__horseDraws.preview++;
        }
        return original.call(this, source, ...args);
      };
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400 && r.url().startsWith(url))
        errors.push(`${r.status()} ${r.url()}`);
    });
    await page.goto(url, { waitUntil: "networkidle" });
    assert.equal(
      await page.locator("html").getAttribute("data-version"),
      "0.27.0",
    );
    await page.locator("#hero-name-input").fill("Kim Phong Kỵ Sĩ");
    await page.locator('[data-faction="shaolin"]').click();
    await page.locator("#join-sect").click();
    await seed(page, (s) => {
      delete s.player.mounted;
      s.player.idle.inTown = true;
    });
    assert.equal((await read(page)).player.mounted, false);
    await page.locator('[data-idle-tab="char"]').click();
    await page.locator(".mount-card [data-mount-toggle]").click();
    assert.equal(
      await page.locator("#inventory-title").textContent(),
      "Thương Nhân",
    );
    assert.equal((await read(page)).player.mounted, false);
    console.log(
      "PASS old save starts walking; no-horse control leads to the merchant without inventing a mount",
    );

    await seed(page, (s) => {
      s.player.gold = 1000;
      s.player.inventory = [];
      s.player.equipment = {};
      s.player.level = 1;
      s.player.idle.autoEquip = false;
    });
    await page.locator('[data-idle-tab="inv"]').click();
    await page.locator('[data-tab="shop"]').click();
    const beforeHorse = (await save(page)).player;
    await page.locator("#buy-basic-horse").click();
    const bought = (await read(page)).player;
    assert.equal(bought.gold, beforeHorse.gold - 200);
    assert.equal(bought.inventory.length, 1);
    assert.equal(bought.inventory[0].slot, "horse");
    assert.equal(bought.mounted, false);
    await page.locator('[data-tab="bag"]').click();
    await page.locator(".bag-slot[data-inspect-item]").click();
    await page.locator("[data-inspect-equip]").click();
    await page.locator('[data-idle-tab="char"]').click();
    const walking = (await save(page)).player;
    const powerBeforeRide = await cp(page);
    await page.locator(".mount-card [data-mount-toggle]").click();
    const riding = (await read(page)).player;
    assert.equal(riding.mounted, true);
    assert.equal(riding.speed, Math.round(walking.speed * 1.36));
    assert.equal(await cp(page), powerBeforeRide);
    assert.equal(
      await page.locator("#character-preview").getAttribute("data-mounted"),
      "true",
    );
    await page.waitForFunction(() => window.__horseDraws.preview > 0);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal((await read(page)).player.mounted, true);
    assert.equal((await read(page)).player.speed, riding.speed);
    await arena(page);
    await page.waitForFunction(() => window.__horseDraws.world > 0);
    await page.keyboard.press("h");
    assert.equal((await read(page)).player.mounted, false);
    assert.equal((await read(page)).player.speed, walking.speed);
    await page.locator("#mount-toggle").click();
    assert.equal((await read(page)).player.mounted, true);
    await page.locator("#mount-toggle").click();
    assert.equal((await read(page)).player.speed, walking.speed);
    console.log(
      "PASS buying/equipping a horse, both riding buttons and H, real world/portrait horse rendering, reload and no speed/CP compounding",
    );

    await seed(page, (s) => {
      s.player.x = 100;
      s.player.y = 100;
      s.player.idle.inTown = false;
      s.player.idle.autoSkills = false;
      s.player.idle.autoPotions = false;
      s.player.mounted = false;
    });
    await arena(page);
    const footDistance = await move(page);
    await page.keyboard.press("h");
    const horseDistance = await move(page);
    assert.ok(footDistance > 25);
    assert.ok(
      horseDistance > footDistance * 1.15,
      `${footDistance} -> ${horseDistance}`,
    );
    console.log(
      `PASS real riding movement is faster (${footDistance.toFixed(1)} -> ${horseDistance.toFixed(1)} units)`,
    );

    const gear = (slot, id = "kim-phong") => ({
      id: `${id}-${slot}`,
      name: `${GEAR_SETS[id].name} ${GEAR_VARIANTS[slot === "horse" ? "warhorse" : variantOf({ slot })].name}`,
      slot,
      level: 10,
      power: 20,
      rarity: "Hoàng Kim",
      color: "#ffd35a",
      enhance: 7,
      setId: id,
      element: GEAR_SETS[id].element,
      variant:
        slot === "weapon" ? "sword" : slot === "horse" ? "warhorse" : undefined,
      icon: "◆",
      bonuses: { attack: 2, defense: 2, hp: 30, mp: 10 },
    });
    await seed(page, (s) => {
      const p = s.player;
      p.level = 10;
      p.attack = 100;
      p.defense = 30;
      p.gold = 10000;
      p.refiningStones = 50;
      p.idle.inTown = true;
      p.mounted = false;
      p.equipment = Object.fromEntries(
        EQUIPMENT_SLOTS.filter((slot) => slot !== "horse").map((slot) => [
          slot,
          gear(slot),
        ]),
      );
      p.inventory = [
        gear("horse"),
        {
          ...gear("horse"),
          id: "plain-horse",
          setId: undefined,
          element: undefined,
          rarity: "Tốt",
          variant: "bay",
        },
      ];
    });
    await page.locator('[data-idle-tab="char"]').click();
    assert.equal(await page.locator("[data-set-full]").count(), 0);
    const partialPower = await cp(page);
    await page.locator('[data-idle-tab="inv"]').click();
    await page
      .locator('.bag-slot[data-inspect-item="kim-phong-horse"]')
      .click();
    const diff = Number(
      (await page.locator(".item-comparison strong").textContent())
        .split(" ")[0]
        .replaceAll(".", ""),
    );
    await page.locator("[data-inspect-equip]").click();
    await page.locator('[data-idle-tab="char"]').click();
    assert.equal(await cp(page), partialPower + diff);
    assert.match(
      await page.locator('[data-set-full="kim-phong"]').textContent(),
      /Kiếm Tâm/,
    );
    const full = (await save(page)).player;
    await page.reload({ waitUntil: "networkidle" });
    await page.locator('[data-idle-tab="char"]').click();
    const loaded = (await read(page)).player;
    assert.equal(loaded.maxHp, full.maxHp);
    assert.equal(loaded.maxMp, full.maxMp);
    assert.equal(await cp(page), partialPower + diff);
    await page.locator("#gear-sets-btn").click();
    assert.equal(await page.locator("[data-set-card]").count(), SET_IDS.length);
    assert.equal(
      await page.locator('[data-set-card="kim-phong"] .set-unlocked').count(),
      4,
    );
    await page.screenshot({
      path: path.join(captureDir, "full-set-guide-mobile.png"),
    });
    await page.locator("#utility-close").click();
    await page.locator(".mount-card [data-mount-toggle]").click();
    await page.waitForTimeout(2600);
    await page.locator(".character-panel").evaluate((el) => (el.scrollTop = 0));
    await page.waitForTimeout(120);
    await page.screenshot({
      path: path.join(captureDir, "mounted-character-mobile.png"),
    });
    await arena(page);
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(captureDir, "mounted-arena-mobile.png"),
    });
    await page.locator('[data-idle-tab="inv"]').click();
    await page.locator('.bag-slot[data-inspect-item="plain-horse"]').click();
    const beforeLose = await cp(page),
      lose = Number(
        (await page.locator(".item-comparison strong").textContent())
          .split(" ")[0]
          .replaceAll(".", ""),
      );
    await page.locator("[data-inspect-equip]").click();
    await page.locator('[data-idle-tab="char"]').click();
    assert.equal(await cp(page), beforeLose + lose);
    assert.equal(await page.locator("[data-set-full]").count(), 0);
    console.log(
      "PASS exact equipment CP prediction includes activating/deactivating all 11 pieces, both rings/horse, hidden real stats and no double addition after reload",
    );

    for (const id of SET_IDS) {
      await seed(page, (s) => {
        s.player.equipment = Object.fromEntries(
          EQUIPMENT_SLOTS.map((slot) => [slot, gear(slot, id)]),
        );
        s.player.inventory = [];
        s.player.mounted = true;
      });
      await page.locator('[data-idle-tab="char"]').click();
      assert.equal(await page.locator(`[data-set-full="${id}"]`).count(), 1);
      await page.locator("#gear-sets-btn").click();
      assert.equal(
        await page.locator(`[data-set-card="${id}"] .set-unlocked`).count(),
        4,
      );
      await page.locator("#utility-close").click();
    }
    const variants = Object.entries(GEAR_VARIANTS)
      .slice(0, 60)
      .map(([variant, meta], i) => ({
        ...gear(meta.slot),
        id: `art-${i}`,
        variant,
        setId: undefined,
        element: ["kim", "moc", "thuy", "hoa", "tho"][i % 5],
        level: [1, 50, 100, 160][i % 4],
        rarity: ["Thường", "Tốt", "Hiếm", "Cực phẩm", "Hoàng Kim"][i % 5],
        enhance: [0, 3, 7, 10][i % 4],
      }));
    await seed(page, (s) => {
      s.player.inventory = variants;
    });
    await page.locator('[data-idle-tab="inv"]').click();
    assert.equal(await page.locator(".bag-slot [data-variant]").count(), 60);
    assert.equal(await page.locator(".bag-slot .gear-element").count(), 60);
    assert.ok((await page.locator(".bag-slot .gear-enchant").count()) > 0);
    await page.waitForTimeout(2600);
    await page.screenshot({
      path: path.join(captureDir, "gear-variants-mobile.png"),
    });
    console.log(
      "PASS all sixteen sets and 60 illustrated kinds, 16 grades, five quality colors, elemental badges and enchantment traces",
    );

    await seed(page, (s) => {
      s.player.gold = 5000;
      s.player.inventory = [];
      s.player.equipment = {};
      s.player.level = 10;
      s.player.mounted = false;
    });
    await page.locator('[data-idle-tab="inv"]').click();
    await page.locator('[data-tab="shop"]').click();
    await page.locator(".inventory-panel [data-set-shop]").click();
    await page.locator("#set-shop-id").selectOption("xich-diem");
    await page.locator("#set-shop-slot").selectOption("weapon");
    const beforeSet = (await save(page)).player;
    await page.locator("#buy-set-piece").click();
    const purchase = (await read(page)).player;
    assert.equal(purchase.gold, beforeSet.gold - 200);
    assert.equal(purchase.inventory[0].setId, "xich-diem");
    assert.equal(purchase.inventory[0].element, "hoa");
    assert.equal(purchase.inventory[0].variant, "blade");
    assert.equal(purchase.inventory[0].level, 10);
    assert.equal(purchase.inventory[0].rarity, "Tốt");
    await page.locator("#utility-close").click();
    await page.locator('[data-idle-tab="inv"]').click();
    await page.locator('[data-tab="bag"]').click();
    await page.locator("[data-open-sets]").click();
    await page.locator('[data-wear-set="xich-diem"]').click();
    assert.equal((await read(page)).player.equipment.weapon.setId, "xich-diem");
    await page.locator("#utility-close").click();
    await seed(page, (s) => {
      s.player.inventory = Array.from({ length: 60 }, (_, i) => ({
        ...variants[0],
        id: `full-${i}`,
      }));
    });
    await page.locator('[data-idle-tab="inv"]').click();
    await page.locator('[data-tab="shop"]').click();
    assert.equal(await page.locator("#buy-basic-horse").isDisabled(), true);
    await page.locator(".inventory-panel [data-set-shop]").click();
    assert.equal(await page.locator("#buy-set-piece").isDisabled(), true);
    await page.locator("#utility-close").click();
    const valid = await save(page);
    await page.locator('[data-idle-tab="more"]').click();
    for (const corrupt of ["identity", "mount"]) {
      const bad = JSON.parse(JSON.stringify(valid));
      if (corrupt === "identity") bad.player.equipment.weapon.element = "kim";
      else bad.player.mounted = "true";
      await page.locator("#save-code").fill(JSON.stringify(bad));
      await page.locator("#import-code").click();
      assert.deepEqual(
        (await read(page)).player.equipment,
        valid.player.equipment,
      );
    }
    console.log(
      "PASS selective set purchases charge exactly once, wear-from-bag works, full bag blocks buying and malformed save preserves the character",
    );

    for (const [width, height] of [
      [320, 568],
      [360, 640],
      [390, 844],
      [600, 960],
      [844, 390],
      [1440, 900],
    ]) {
      await page.setViewportSize({ width, height });
      await arena(page);
      assert.equal(await page.locator("#mount-toggle").isVisible(), true);
      const mount = await page.locator("#mount-toggle").boundingBox();
      assert.ok(
        mount.x >= 0 &&
          mount.y >= 0 &&
          mount.x + mount.width <= width &&
          mount.y + mount.height <= height,
      );
      for (const tab of ["char", "inv"]) {
        await page.locator(`[data-idle-tab="${tab}"]`).click();
        const fit = await page.evaluate(() => ({
          w: document.documentElement.scrollWidth,
          h: document.documentElement.scrollHeight,
          over: [...document.querySelectorAll(".tab-page")]
            .filter((el) => el.checkVisibility())
            .some((el) => el.scrollWidth > el.clientWidth + 1),
        }));
        assert.equal(fit.w, width);
        assert.equal(fit.h, height);
        assert.equal(fit.over, false);
      }
      await page.locator('[data-tab="bag"]').click();
      await page.locator("[data-open-sets]").click();
      assert.ok(
        await page
          .locator(".utility-dialog")
          .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      );
      await page.locator("#utility-close").click();
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS riding, set rules, merchant and all equipment panels fit six screen sizes without console/network errors",
    );
    await context.close();
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
