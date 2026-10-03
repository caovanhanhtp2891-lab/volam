const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
const url = process.env.VOLAM_TEST_URL || "http://127.0.0.1:5173";
const captureDir = process.env.VOLAM_CAPTURE_DIR || "/tmp/volam-cultivation";
const key = "giang-ho-di-truyen-prototype";
const read = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
async function seed(page, mutate) {
  await page.locator("#save-btn").evaluate((el) => el.click());
  const snapshot = await read(page);
  mutate(snapshot);
  await page.evaluate(
    ({ key, snapshot }) => {
      localStorage.setItem(key, JSON.stringify(snapshot));
      window.__realmLabels = [];
    },
    { key, snapshot },
  );
  await page.locator("#load-btn").evaluate((el) => el.click());
}
async function auraPixels(page) {
  return page.evaluate((key) => {
    const c = document.querySelector("#character-preview");
    const pixels = c.getContext("2d").getImageData(0, c.height - 110, c.width, 100).data;
    let bright = 0,
      hash = 2166136261;
    for (let i = 0; i < pixels.length; i += 4) {
      if (Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) > 185) bright++;
      hash = Math.imul(hash ^ pixels[i], 16777619);
    }
    return { bright, hash };
  }, key);
}
(async () => {
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
      window.__realmLabels = [];
      const original = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (label, ...args) {
        if (
          this.canvas.id === "game-canvas" &&
          /^(Phàm Nhân$|.*· (Tầng \d+|Sơ kỳ|Trung kỳ|Hậu kỳ|Đỉnh phong|Đại viên mãn))$/.test(
            label,
          )
        ) {
          window.__realmLabels.push(label);
          if (window.__realmLabels.length > 40) window.__realmLabels.shift();
        }
        return original.call(this, label, ...args);
      };
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400 && r.url().startsWith(url))
        errors.push(`${r.status()} ${r.url()}`);
    });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("#hero-name-input").fill("Thanh Vân");
    await page.locator('[data-faction="shaolin"]').click();
    await page.locator("#join-sect").click();
    await page.locator('[data-idle-tab="char"]').click();
    await seed(page, (s) => {
      s.player.level = 1;
      s.player.attack = 80;
      s.player.defense = 0;
      s.player.equipment = {};
      s.player.idle.inTown = true;
      s.player.inventory = [200, 1].map((power, i) => ({
        id: `realm-sword-${i}`,
        name: i ? "Mộc Kiếm" : "Thanh Vân Kiếm",
        slot: "weapon",
        rarity: "Hiếm",
        color: "#64b5f6",
        icon: "⚔",
        level: 1,
        power,
        enhance: 0,
      }));
    });
    assert.equal(await page.locator("#realm-name").textContent(), "Phàm Nhân");
    for (const [id, expected] of [
      ["realm-sword-0", "Luyện Thể"],
      ["realm-sword-1", "Phàm Nhân"],
    ]) {
      await page.locator('[data-idle-tab="inv"]').click();
      await page.locator(`.bag-slot[data-inspect-item="${id}"]`).click();
      await page.locator("[data-inspect-equip]").click();
      await page.locator('[data-idle-tab="char"]').click();
      assert.equal(await page.locator("#realm-name").textContent(), expected);
      await page.locator('[data-idle-tab="log"]').click();
      await page.waitForFunction(
        (name) =>
          window.__realmLabels.some((label) => label === name || label.startsWith(`${name} ·`)),
        expected,
      );
      await page.locator('[data-idle-tab="char"]').click();
    }
    await page.reload({ waitUntil: "networkidle" });
    await page.locator('[data-idle-tab="char"]').click();
    assert.equal(await page.locator("#realm-name").textContent(), "Phàm Nhân");
    console.log(
      "PASS equipping stronger/weaker gear immediately changes realm, including after reload",
    );

    await page.locator("#realm-guide-btn").click();
    const realms = await page
      .locator(".realm-table tbody tr")
      .evaluateAll((rows) =>
        rows.map((row) => ({
          name: row.cells[1].textContent,
          power: Number(row.cells[2].textContent.replaceAll(".", "")),
        })),
      );
    assert.equal(realms.length, 23);
    assert.equal(realms[0].name, "Phàm Nhân");
    assert.equal(realms[19].name, "Đạo Tổ");
    await page.locator("#utility-close").click();
    let low;
    for (let rank = 0; rank < realms.length; rank++) {
      const target = Math.max(5000, realms[rank].power * 1.0001 + 5);
      await seed(page, (s) => {
        s.player.attack = (Math.cbrt(target * 1000) - 165 * 0.15) / 3;
        s.player.defense = 0;
        s.player.equipment = {};
        s.player.idle.attributes = {
          strength: 0,
          dexterity: 0,
          vitality: 0,
          energy: 0,
        };
      });
      await page.locator('[data-idle-tab="log"]').click();
      await page.waitForFunction(
        (name) =>
          window.__realmLabels.some((label) => label === name || label.startsWith(`${name} ·`)),
        realms[rank].name,
      );
      await page.locator('[data-idle-tab="char"]').click();
      assert.equal(
        (await read(page)).player.level,
        1,
        "realm follows power instead of character level",
      );
      assert.equal(
        await page.locator("#realm-name").textContent(),
        realms[rank].name,
      );
      assert.match(
        await page.locator("#game-canvas").getAttribute("aria-label"),
        new RegExp(realms[rank].name),
      );
      await page.waitForTimeout(120);
      if (rank === 0) low = await auraPixels(page);
      if ([0, 3, 10, 14, 19, 22].includes(rank))
        await page.screenshot({
          path: path.join(captureDir, `realm-${rank + 1}-mobile.png`),
        });
    }
    const high = await auraPixels(page);
    assert.ok(
      high.bright > low.bright + 200,
      `higher realm produces visibly brighter aura pixels (${low.bright} → ${high.bright})`,
    );
    await page.waitForTimeout(450);
    assert.notEqual(
      (await auraPixels(page)).hash,
      high.hash,
      "the aura animates while standing still",
    );
    console.log(
      "PASS all twenty-three realm labels are drawn above the hero; higher auras brighten and animate",
    );
    await page.locator("#realm-guide-btn").click();
    assert.match(
      await page.locator(".realm-table [aria-current]").textContent(),
      /Vô Cực/,
    );
    await page.screenshot({
      path: path.join(captureDir, "realm-guide-mobile.png"),
    });
    await page.locator("#utility-close").click();
    for (const [width, height] of [
      [320, 568],
      [360, 640],
      [390, 844],
      [600, 960],
      [844, 390],
      [1440, 900],
    ]) {
      await page.setViewportSize({ width, height });
      const fit = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
        overflow:
          document.querySelector(".character-panel").scrollWidth -
          document.querySelector(".character-panel").clientWidth,
      }));
      assert.equal(fit.width, width);
      assert.equal(fit.height, height);
      assert.ok(fit.overflow <= 1);
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS current realm highlighted, old saves retained and cultivation card fits six viewports",
    );
    await context.close();
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
