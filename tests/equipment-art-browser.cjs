const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
const url = process.env.VOLAM_TEST_URL || "http://127.0.0.1:4174/volam/";
const key = "giang-ho-di-truyen-prototype";
const captures = process.env.VOLAM_CAPTURE_DIR || "/tmp/volam-equipment-art";
const read = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
async function save(page) {
  await page.locator("#save-btn").evaluate((el) => el.click());
  return read(page);
}
async function seed(page, change) {
  const state = await save(page);
  change(state);
  await page.evaluate(
    ({ key, state }) => {
      localStorage.setItem(key, JSON.stringify(state));
      document.querySelector("#load-btn").click();
      if (
        document.querySelector("#mobile-auto").getAttribute("aria-pressed") ===
        "true"
      )
        document.querySelector("#mobile-auto").click();
    },
    { key, state },
  );
}
async function bag(page) {
  await page.locator('[data-idle-tab="inv"]').click();
  await page.locator('[data-tab="bag"]').click();
}
async function gallery(page) {
  await bag(page);
  await page.locator(".inventory-panel [data-open-gear-gallery]").click();
}
(async () => {
  const { GEAR_VARIANTS, variantsForSlot, SET_IDS, GEAR_SETS } = await import(
    "../src/gear-catalog.ts"
  );
  const weaponCount = variantsForSlot("weapon").length;
  const browser = await chromium.launch({
    executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    await fs.mkdir(captures, { recursive: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await context.addInitScript(() => {
      window.__equipmentDraws = { world: 0, portrait: 0, gradients: 0 };
      const stroke = CanvasRenderingContext2D.prototype.stroke,
        gradient = CanvasRenderingContext2D.prototype.createLinearGradient;
      CanvasRenderingContext2D.prototype.stroke = function (...args) {
        // The fingers drawn over the weapon grip belong to the wielded rig,
        // whereas bag items use cached 128px inventory icons.
        if (this.strokeStyle === "#d4ae8b" && this.lineWidth === 1.5) {
          if (this.canvas.id === "game-canvas") window.__equipmentDraws.world++;
          if (this.canvas.id === "character-preview")
            window.__equipmentDraws.portrait++;
        }
        return stroke.apply(this, args);
      };
      CanvasRenderingContext2D.prototype.createLinearGradient = function (
        ...args
      ) {
        if (
          !this.canvas.id &&
          this.canvas.width === 128 &&
          this.canvas.height === 128
        )
          window.__equipmentDraws.gradients++;
        return gradient.call(this, ...args);
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
      "0.31.0",
    );
    await page.locator("#hero-name-input").fill("Bảo Khố Kiếm Sĩ");
    await page.locator('[data-faction="wudang"]').click();
    await page.locator("#join-sect").click();
    await seed(page, (s) => {
      s.player.gold = 100000;
      s.player.inventory = [];
      s.player.level = 10;
      s.player.idle.inTown = true;
    });
    const before = (await save(page)).player;
    await gallery(page);
    assert.equal(await page.locator(".gear-sample").count(), weaponCount);
    assert.equal(
      await page.locator(".gear-sample [data-material]").count(),
      weaponCount,
    );
    for (const rarity of ["Thường", "Tốt", "Hiếm", "Cực phẩm", "Hoàng Kim", "Truyền Thuyết", "Thần Thoại"]) {
      await page.locator("#gear-gallery-rarity").selectOption(rarity);
      assert.equal(
        await page.locator(".gear-sample .gear-body").count(),
        weaponCount,
      );
    }
    // Red quality has radiance without enhancement; +7/+10 still layer on top.
    for (const enhance of [0, 3, 7, 10]) {
      await page.locator("#gear-gallery-enhance").selectOption(String(enhance));
      for (const selector of [`[data-enhancement="${enhance}"]`, ".gear-enchant", ".gear-orbit", ".gear-halo", ".gear-mythic-runes", "[data-painted-item]"])
        assert.equal(await page.locator(`.gear-sample ${selector}`).count(), weaponCount);
    }
    await page.locator("#gear-gallery-element").selectOption("hoa");
    assert.ok(
      (
        await page.locator(".gear-sample .gear-element").first().textContent()
      ).includes("火"),
    );
    await page.waitForTimeout(2600);
    await page.screenshot({
      path: path.join(captures, "weapon-gallery-mobile.png"),
    });
    // Every SVG reference must resolve inside its own instance, with no duplicate IDs.
    assert.equal(
      await page.locator(".gear-gallery").evaluate((el) => {
        const ids = [...el.querySelectorAll("[id]")].map((node) => node.id);
        return (
          new Set(ids).size === ids.length &&
          [...el.querySelectorAll("svg")].every((svg) =>
            [...svg.querySelectorAll("[fill]")].every((node) => {
              const ref = node.getAttribute("fill").match(/^url\(#(.+)\)$/);
              return !ref || !!svg.querySelector('[id="' + ref[1] + '"]');
            }),
          )
        );
      }),
      true,
    );
    await page.locator("#utility-close").click();
    const after = (await save(page)).player;
    assert.deepEqual(after.inventory, before.inventory);
    assert.deepEqual(after.equipment, before.equipment);
    assert.equal(after.gold, before.gold);
    console.log(
      "PASS gallery previews all quality/enchantment stages without granting sample gear or changing currency; gradients are local to each SVG",
    );
    await gallery(page);
    await page.locator('[data-buy-gear-kind="halberd"]').click();
    assert.equal(
      await page.locator("#set-shop-variant").inputValue(),
      "halberd",
    );
    assert.equal(await page.locator("#set-shop-id").inputValue(), "xich-diem");
    assert.equal(
      await page
        .locator(".item-detail .gear-art")
        .getAttribute("data-enhancement"),
      "0",
    );
    const initialGold = (await save(page)).player.gold;
    for (const variant of variantsForSlot("weapon")) {
      await page.locator("#set-shop-variant").selectOption(variant);
      assert.equal(
        await page
          .locator(".item-detail [data-variant]")
          .getAttribute("data-variant"),
        variant,
      );
      await page.locator("#buy-set-piece").click();
      const item = (await read(page)).player.inventory.at(-1);
      assert.equal(item.variant, variant);
      assert.equal(item.rarity, "Tốt");
      assert.equal(item.enhance, 0);
      assert.equal(item.element, "hoa");
      assert.equal(item.level, 10);
    }
    const bought = (await read(page)).player;
    assert.equal(bought.gold, initialGold - weaponCount * 200);
    assert.equal(
      new Set(bought.inventory.map((item) => item.id)).size,
      weaponCount,
    );
    await page.locator("#set-shop-slot").selectOption("ring2");
    assert.equal(
      await page.locator("#set-shop-variant option").count(),
      variantsForSlot("ring2").length,
    );
    await page.locator("#set-shop-variant").selectOption("twinring");
    await page.locator("#buy-set-piece").click();
    assert.equal((await read(page)).player.inventory.at(-1).slot, "ring2");
    await page.locator("#set-shop-slot").selectOption("horse");
    assert.equal(await page.locator("#set-shop-variant option").count(), 6);
    await page.locator("#set-shop-variant").selectOption("night");
    await page.locator("#buy-set-piece").click();
    assert.equal((await read(page)).player.inventory.at(-1).variant, "night");
    await page.locator("#utility-close").click();
    await page.reload({ waitUntil: "networkidle" });
    if (
      (await page.locator("#mobile-auto").getAttribute("aria-pressed")) ===
      "true"
    )
      await page.locator("#mobile-auto").click();
    assert.equal((await read(page)).player.inventory.length, weaponCount + 2);
    await bag(page);
    const hammer = (await read(page)).player.inventory.find(
      (item) => item.variant === "hammer",
    );
    await page
      .locator('.bag-grid [data-inspect-item="' + hammer.id + '"]')
      .click();
    assert.ok(
      (await page.locator(".gear-effect-label").textContent()).includes(
        "Viền lục",
      ),
    );
    await page.locator("[data-inspect-equip]").click();
    assert.equal((await read(page)).player.equipment.weapon.variant, "hammer");
    console.log(
      "PASS every new weapon can be bought, real prices are charged, ring2 and new horses are valid, selections survive reload and equip",
    );
    const base = (await save(page)).player.equipment.weapon;
    await seed(page, (s) => {
      s.player.equipment.weapon = {
        ...base,
        variant: "halberd",
        name: "Xích Diệm Phương Thiên Kích",
        enhance: 10,
        rarity: "Hoàng Kim",
        color: "#ffd35a",
      };
      for (const [slot, variant] of [
        ["armor", "lamellar"],
        ["helmet", "dragonhelm"],
        ["pendant", "mirror"],
        ["boots", "cloudboots"],
      ])
        s.player.equipment[slot] = {
          ...base,
          id: "worn-" + slot,
          slot,
          variant,
          name: GEAR_VARIANTS[variant].name,
          enhance: 7,
          rarity: "Cực phẩm",
          color: "#cf91ff",
        };
      s.player.mounted = false;
    });
    await page.locator('[data-idle-tab="char"]').click();
    await page.waitForTimeout(600);
    assert.ok(await page.evaluate(() => window.__equipmentDraws.portrait > 0));
    const gradients = await page.evaluate(
      () => window.__equipmentDraws.gradients,
    );
    await page.waitForTimeout(700);
    assert.equal(
      await page.evaluate(() => window.__equipmentDraws.gradients),
      gradients,
    );
    await page.waitForTimeout(1600);
    await page.locator(".character-panel").evaluate((el) => (el.scrollTop = 0));
    await page.screenshot({
      path: path.join(captures, "equipment-character-mobile.png"),
    });
    await page.locator('[data-idle-tab="log"]').click();
    if (await page.locator(".game-layout").isVisible())
      await page.locator("#world-panel-close").click();
    await page.waitForTimeout(350);
    assert.ok(await page.evaluate(() => window.__equipmentDraws.world > 0));
    console.log(
      "PASS held weapon grip is drawn in both character and arena; animated frames reuse cached materials without creating new gradients",
    );
    await page.locator('[data-idle-tab="more"]').click();
    await page.locator("#skill-effects-quality").selectOption("simple");
    await gallery(page);
    assert.equal(
      await page
        .locator(".gear-orbit")
        .first()
        .evaluate((el) => getComputedStyle(el).animationName),
      "none",
    );
    await page.locator("#utility-close").click();
    await page.locator('[data-idle-tab="more"]').click();
    await page.locator("#skill-effects-quality").selectOption("full");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gallery(page);
    assert.equal(
      await page
        .locator(".gear-orbit")
        .first()
        .evaluate((el) => getComputedStyle(el).animationName),
      "none",
    );
    assert.equal(
      await page
        .locator(".gear-sample svg *")
        .evaluateAll((items) =>
          items.every((el) => getComputedStyle(el).animationName === "none"),
        ),
      true,
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    let total = 0;
    for (const slot of [
      ...new Set(Object.values(GEAR_VARIANTS).map((v) => v.slot)),
    ]) {
      await page.locator("#gear-gallery-slot").selectOption(slot);
      const n = variantsForSlot(slot).length;
      assert.equal(await page.locator(".gear-sample").count(), n);
      total += n;
    }
    assert.equal(total, Object.keys(GEAR_VARIANTS).length);
    for (const [width, height] of [
      [320, 568],
      [360, 640],
      [390, 844],
      [430, 932],
      [844, 390],
      [1280, 900],
    ]) {
      await page.setViewportSize({ width, height });
      await page.locator("#gear-gallery-slot").selectOption("weapon");
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      assert.equal(
        await page
          .locator(".gear-sample")
          .evaluateAll((items) =>
            items.every((el) => el.scrollWidth <= el.clientWidth + 1),
          ),
        true,
      );
      await page.locator('[data-buy-gear-kind="axe"]').click();
      assert.ok(await page.locator("#set-shop-variant").isVisible());
      await page.locator("#utility-close").click();
      await gallery(page);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#utility-close").click();
    const templates = (await read(page)).player.equipment.weapon;
    await seed(page, (s) => {
      s.player.inventory = Object.entries(GEAR_VARIANTS)
        .slice(0, 60)
        .map(([variant, meta], i) => ({
          ...templates,
          id: "all-" + variant,
          slot: meta.slot,
          name: GEAR_VARIANTS[variant].name,
          variant,
          rarity: ["Thường", "Tốt", "Hiếm", "Cực phẩm", "Hoàng Kim", "Truyền Thuyết", "Thần Thoại"][i % 5],
          color: ["#a6b3bd", "#73d19b", "#64b5f6", "#cf91ff", "#ffd35a"][i % 5],
          enhance: [0, 3, 7, 10][i % 4],
          setId: undefined,
          element: ["kim", "moc", "thuy", "hoa", "tho"][i % 5],
        }));
    });
    await bag(page);
    await page.waitForTimeout(2600);
    await page.screenshot({
      path: path.join(captures, "sixty-equipment-bag-mobile.png"),
    });
    assert.equal(await page.locator(".bag-slot [data-variant]").count(), 60);
    assert.equal(
      new Set(
        await page
          .locator(".bag-slot [data-variant]")
          .evaluateAll((items) => items.map((el) => el.dataset.variant)),
      ).size,
      60,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS all eighty-four gallery illustrations, simple/reduced motion and gallery/merchant layouts fit six screen sizes without runtime errors",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
