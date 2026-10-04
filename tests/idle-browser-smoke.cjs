// Functional checks for the idle interface. Uses the platform browser tools;
// no test dependencies are added to the application or its lockfile.
const assert = require("node:assert/strict");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
const url = process.env.VOLAM_TEST_URL || "http://127.0.0.1:5173";
const key = "giang-ho-di-truyen-prototype";
const state = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
async function save(page) {
  await page.locator("#save-btn").evaluate((button) => button.click());
  return state(page);
}
async function seed(page, mutate) {
  const value = await save(page);
  mutate(value);
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key, value });
  await page.locator("#load-btn").evaluate((button) => button.click());
}
async function tab(page, name) {
  await page.locator(`[data-idle-tab="${name}"]`).click();
}
async function fit(page, width, height) {
  const result = await page.evaluate(() => {
    const app = document.querySelector(".app-shell").getBoundingClientRect();
    const panel = document.querySelector(".tab-page:not(.hidden)");
    const controls = [
      ...document.querySelectorAll(
        ".bottom-nav,.joystick,.skill-button,.potion-button,.town-button,.mobile-pickup,#mobile-auto,.arena-left-buttons",
      ),
    ]
      .filter((element) => element.checkVisibility())
      .map((element) => {
        const box = element.getBoundingClientRect();
        return { x: box.x, y: box.y, right: box.right, bottom: box.bottom };
      });
    const overlap = [];
    for (let i = 0; i < controls.length; i++)
      for (let j = i + 1; j < controls.length; j++) {
        const a = controls[i],
          b = controls[j];
        if (
          Math.min(a.right, b.right) - Math.max(a.x, b.x) > 1 &&
          Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y) > 1
        )
          overlap.push([i, j]);
      }
    const visiblePanels = [...document.querySelectorAll(".tab-page")].filter((element) => element.checkVisibility());
    return {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      app: { x: app.x, y: app.y, right: app.right, bottom: app.bottom },
      overlap,
      overflow: visiblePanels.filter((p) => p.scrollWidth > p.clientWidth + 1).length,
      offscreen: controls.filter(
        (b) => b.x < -0.5 || b.y < -0.5 || b.right > innerWidth + 0.5 || b.bottom > innerHeight + 0.5,
      ),
    };
  });
  assert.equal(result.width, width);
  assert.equal(result.height, height);
  assert.ok(result.app.x >= 0 && result.app.right <= width + 0.5 && result.app.bottom <= height + 0.5);
  assert.deepEqual(result.overlap, []);
  assert.deepEqual(result.offscreen, []);
  assert.equal(result.overflow, 0);
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400 && response.url().startsWith(url))
        errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(url, { waitUntil: "networkidle" });
    assert.equal(await page.locator("html").getAttribute("data-version"), "0.26.0");
    assert.equal(await page.locator(".sect-card").count(), 10);
    await page.locator("#hero-name-input").fill("Lữ Khách");
    await page.locator('[data-faction="shaolin"]').click();
    await page.locator("#join-sect").click();
    assert.equal((await state(page)).player.name, "Lữ Khách");
    assert.equal((await state(page)).player.factionId, "shaolin");
    await page.waitForFunction(() => document.querySelector("#stage-description").textContent.match(/Đã hạ [1-9]/), {
      timeout: 12000,
    });
    assert.ok((await save(page)).player.idle.totalKills > 0);
    console.log("PASS ten-faction selection, player naming and real autonomous combat");

    await seed(page, (s) => {
      Object.assign(s.player, {
        level: 10,
        attack: 500,
        defense: 1000,
        hp: 600,
        maxHp: 600,
        potions: { hp: 10, mp: 10 },
        skillPoints: 5,
      });
      Object.assign(s.player.idle, { stage: 10, maxStage: 10, wave: 4, inTown: false, autoSkills: false, push: true });
    });
    await page.waitForFunction(() => document.querySelector("#idle-stage-label").textContent.includes("Ải 11"), {
      timeout: 15000,
    });
    const cleared = await save(page);
    assert.equal(cleared.player.idle.maxStage, 11);
    assert.equal(cleared.player.idle.stage, 11);
    assert.equal(cleared.player.idle.wave, 1);
    assert.ok(cleared.player.idle.bossKills >= 1);
    await page.locator("#mobile-auto").click();
    assert.equal(await page.locator("#mobile-auto").getAttribute("aria-pressed"), "false");
    console.log("PASS real boss defeat, fourth-wave completion and unlocking the next region");

    await seed(page, (s) => {
      s.player.idle.inTown = true;
      s.player.idle.attributePoints = 5;
      s.player.idle.attributes = { strength: 0, dexterity: 0, vitality: 0, energy: 0 };
      s.player.skillPoints = 5;
      s.player.skillRanks = { skill1: 1, skill2: 1, ultimate: 1 };
      s.player.idle.dailyClaim = "";
      s.player.gold = 1000;
    });
    await tab(page, "char");
    assert.equal(await page.locator(".equipment-slot").count(), 12);
    assert.equal(await page.locator("[data-equipped-preview]").count(), 11);
    await page.locator('[data-attribute="strength"][data-delta="1"]').click();
    let snapshot = await state(page);
    assert.equal(snapshot.player.idle.attributes.strength, 1);
    assert.equal(snapshot.player.idle.attributePoints, 4);
    await page.locator('[data-attribute="strength"][data-delta="-1"]').click();
    snapshot = await state(page);
    assert.equal(snapshot.player.idle.attributes.strength, 0);
    assert.equal(snapshot.player.idle.attributePoints, 5);
    await tab(page, "skill");
    await page.locator('.skill-upgrade[data-skill-rank="skill1"]').click();
    snapshot = await state(page);
    assert.equal(snapshot.player.skillRanks.skill1, 2);
    assert.equal(snapshot.player.skillPoints, 4);
    await page.locator('[data-refund-skill="skill1"]').click();
    snapshot = await state(page);
    assert.equal(snapshot.player.skillRanks.skill1, 1);
    assert.equal(snapshot.player.skillPoints, 5);
    console.log("PASS eleven equipment slots plus military seal and point conservation for attributes and skills");

    await tab(page, "log");
    await page.locator("#gift-btn").click();
    await page.locator("#claim-daily").click();
    assert.equal((await state(page)).player.gold, 1100);
    await page.locator("#gift-btn").click();
    assert.equal(await page.locator("#claim-daily").isDisabled(), true);
    await page.locator("#utility-close").click();
    await page.reload({ waitUntil: "networkidle" });
    assert.equal((await state(page)).player.gold, 1100);
    await page.locator("#gift-btn").click();
    assert.equal(await page.locator("#claim-daily").isDisabled(), true);
    await page.locator("#utility-close").click();
    console.log("PASS daily gift awarded once, including after a page reload");

    await tab(page, "more");
    assert.match(await page.locator(".release-stamp").textContent(), /v0\.24\.0/);
    await page.locator("#settings-name").fill("");
    await page.locator("#settings-name").pressSequentially("WASD Lữ");
    await page.locator("#settings-sex").selectOption("female");
    await page.locator("#save-name").click();
    snapshot = await state(page);
    assert.equal(snapshot.player.name, "WASD Lữ");
    assert.equal(snapshot.player.sex, "female");
    await page.locator("#game-speed").selectOption("2.5");
    await page.locator('[data-setting="autoSkills"]').uncheck();
    assert.equal((await state(page)).player.idle.speed, 2.5);
    assert.equal((await state(page)).player.idle.autoSkills, false);
    const beforeInvalid = await state(page);
    const malformed = structuredClone(beforeInvalid);
    malformed.player.level = 999;
    await page.locator("#save-code").fill(JSON.stringify(malformed));
    await page.locator("#import-code").click();
    assert.equal((await state(page)).player.level, beforeInvalid.player.level);
    assert.equal((await state(page)).player.name, beforeInvalid.player.name);
    const validImport = structuredClone(beforeInvalid);
    validImport.player.name = "Nhân vật nạp";
    await page.locator("#save-code").fill(JSON.stringify(validImport));
    await page.locator("#import-code").click();
    assert.equal((await state(page)).player.name, "Nhân vật nạp");
    await page.locator("#restore-backup").click();
    assert.equal((await state(page)).player.name, "WASD Lữ");
    await page.locator("#export-code").click();
    const exported = JSON.parse(await page.locator("#save-code").inputValue());
    assert.equal(exported.player.name, "WASD Lữ");
    const downloading = page.waitForEvent("download");
    await page.locator("#export-save").click();
    const download = await downloading;
    assert.match(download.suggestedFilename(), /\.volamsave$/);
    await download.saveAs("/tmp/volam-idle-export.volamsave");
    console.log(
      "PASS editable name, settings, valid import, backup recovery, invalid-save rejection and file/code export",
    );

    await page.locator("#slot-btn").click();
    await page.locator('[data-character-slot="1"]').click();
    await page.locator("#hero-name-input").fill("Đệ Tử");
    await page.locator('[data-faction="tianren"]').click();
    await page.locator("#join-sect").click();
    const second = await page.evaluate(() => JSON.parse(localStorage.getItem("giang-ho-di-truyen-prototype-slot-2")));
    assert.equal(second.player.name, "Đệ Tử");
    assert.equal(second.player.factionId, "tianren");
    await tab(page, "more");
    await page.locator("#slot-btn").click();
    await page.locator('[data-character-slot="0"]').click();
    assert.equal((await state(page)).player.name, "WASD Lữ");
    assert.equal((await state(page)).player.idle.dailyCount, 1);
    console.log("PASS independent character slots preserve the original character and rewards");

    await seed(page, (s) => {
      s.player.idle.inTown = false;
      s.player.idle.autoLoot = false;
      s.player.idle.autoSkills = false;
      s.savedAt = Date.now() - 5 * 60000;
    });
    const offline = await state(page);
    assert.equal(offline.player.gold, 1100 + 5 * (5 + offline.player.idle.stage));
    const offlineGold = offline.player.gold;
    await page.reload({ waitUntil: "networkidle" });
    assert.equal((await state(page)).player.gold, offlineGold);
    console.log("PASS offline reward is applied once and cannot repeat on immediate reload");

    await seed(page, (s) => {
      s.player.idle.inTown = true;
      const slots = [
        "weapon",
        "armor",
        "helmet",
        "boots",
        "belt",
        "necklace",
        "ring",
        "ring2",
        "bracelet",
        "pendant",
        "horse",
      ];
      const rarities = ["Thường", "Tốt", "Hiếm", "Cực phẩm"];
      const colors = ["#c9d5df", "#6ad69b", "#64b5f6", "#c88aff"];
      const gear = slots.map((slot, i) => ({
        id: `visual-${slot}`,
        name: `Trang bị ${slot}`,
        slot,
        rarity: rarities[i % 4],
        color: colors[i % 4],
        icon: "◈",
        level: 10,
        power: 20,
        enhance: 0,
      }));
      s.player.inventory = gear;
      s.player.equipment = Object.fromEntries(
        gear.map((item) => [
          item.slot,
          { ...item, id: `equipped-${item.slot}` },
        ]),
      );
    });
    await tab(page, "char");
    assert.equal(await page.locator(".equipment-slot > svg").count(), 12);
    assert.equal(await page.locator("#character-preview").isVisible(), true);
    assert.equal(await page.locator(".canvas-frame").isVisible(), false);
    const equipmentLayout = await page.evaluate(() => {
      const middle = document.querySelector(".paper-doll-center").getBoundingClientRect();
      const slots = [...document.querySelectorAll(".equipment-slot")].map((el) => el.getBoundingClientRect());
      return { left: slots.filter((r) => r.right <= middle.x + 1).length, right: slots.filter((r) => r.x >= middle.right - 1).length };
    });
    assert.deepEqual(equipmentLayout, { left: 6, right: 6 });
    const beforeInspect = await state(page);
    await page.locator('[data-equipped-preview="weapon"] > svg').click();
    assert.equal((await state(page)).player.gold, beforeInspect.player.gold, "viewing equipped gear must not spend currency");
    await page.locator("[data-detail-enhance]").click();
    assert.equal((await state(page)).player.gold, beforeInspect.player.gold, "enhancement preview must not spend currency");
    await page.locator("[data-confirm-enhance]").click();
    const enhanced = await state(page);
    assert.equal(enhanced.player.equipment.weapon.enhance, 1);
    assert.equal(enhanced.player.gold, beforeInspect.player.gold - 45);
    assert.equal(enhanced.player.refiningStones, beforeInspect.player.refiningStones - 1);
    await page.locator("#utility-close").click();
    await page.locator("#character-close").click();
    assert.equal(await page.locator(".canvas-frame").isVisible(), true);
    await tab(page, "char");
    console.log("PASS classic character preview, equipment on both sides, inspection without spending and explicit enhancement");
    await tab(page, "inv");
    assert.equal(await page.locator(".bag-slot > svg").count(), 11);
    // Click the picture itself, rather than its parent, to exercise SVG event targets.
    await page
      .locator('.bag-slot[data-inspect-item="visual-boots"] > svg')
      .click();
    assert.match(
      await page.locator("#utility-content").textContent(),
      /Trang bị|Cực phẩm/,
    );
    assert.equal(await page.locator(".detail-gear-art").isVisible(), true);
    await page.locator("[data-inspect-equip]").click();
    assert.equal((await state(page)).player.equipment.boots.id, "visual-boots");
    assert.equal(await page.locator("#utility-overlay").isVisible(), false);
    console.log(
      "PASS illustrated gear in all eleven slots, image-tap comparison and equip",
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
      for (const name of ["log", "char", "skill", "inv", "more"]) {
        await tab(page, name);
        await fit(page, width, height);
      }
      await tab(page, "log");
      if (await page.locator(".game-layout").isVisible()) await page.locator("#world-panel-close").click();
      await fit(page, width, height);
      await page.screenshot({ path: `/tmp/volam-idle-${width}x${height}.png` });
      console.log(`PASS ${width}x${height}: all five tabs, reachable controls, no overflow or overlaps`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await tab(page, "log");
    await page.locator("#compact-btn").click();
    assert.equal(await page.locator(".game-layout").isVisible(), false);
    await tab(page, "char");
    assert.equal(await page.locator(".character-panel").isVisible(), true);
    assert.equal(await page.locator("#compact-btn").getAttribute("aria-pressed"), "false");
    console.log("PASS arena expansion and menu navigation restore the selected panel");
    const beforeMigration = await save(page);
    await seed(page, (s) => {
      delete s.player.idle;
      delete s.player.factionId;
      delete s.player.name;
      delete s.player.sex;
    });
    assert.equal((await state(page)).player.idle.enabled, false);
    assert.equal((await state(page)).player.inventory.length, beforeMigration.player.inventory.length);
    await tab(page, "log");
    if (!(await page.locator(".game-layout").isVisible())) await tab(page, "log");
    assert.equal(await page.locator("#legacy-training").isVisible(), true);
    const legacy = await save(page);
    await page.locator("#legacy-training-btn").click();
    const trained = await state(page);
    assert.equal(trained.player.idle.enabled, true);
    assert.equal(await page.locator("#mobile-auto").getAttribute("aria-pressed"), "true");
    assert.equal(trained.player.level, legacy.player.level);
    assert.deepEqual(trained.player.inventory, legacy.player.inventory);
    assert.deepEqual(trained.player.equipment, legacy.player.equipment);
    assert.equal(
      trained.player.questRewardClaimed,
      legacy.player.questRewardClaimed,
    );
    assert.equal(trained.player.skillPoints, legacy.player.skillPoints);
    assert.equal(await page.locator("#legacy-training").isVisible(), false);
    console.log(
      "PASS old character enters animated training without losing level, gear, quest or skill points",
    );
    await tab(page, "more");
    await page.locator("#online-btn").click();
    await page.waitForFunction(() => document.querySelector("#connection-pill").dataset.status === "online");
    await page.locator("#online-btn").click();
    await page.waitForFunction(() => document.querySelector("#connection-pill").dataset.status === "offline");
    console.log("PASS old-save migration and retained online session connection/disconnection");
    assert.deepEqual(errors, [], "no JavaScript or asset errors");
    await context.close();
    for (const faction of ["tianwang", "tangmen", "wudu", "emei", "cuiyan", "gaibang", "wudang", "kunlun"]) {
      const fresh = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const p = await fresh.newPage();
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto(url, { waitUntil: "networkidle" });
      await p.locator(`[data-faction="${faction}"]`).click();
    await p.locator("#join-sect").click();
      assert.equal((await state(p)).player.factionId, faction);
      await tab(p, "skill");
      assert.equal(await p.locator(".skill-row").count(), 3);
      await fresh.close();
    }
    assert.deepEqual(errors, []);
    console.log("PASS remaining faction selections and skill menus");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
