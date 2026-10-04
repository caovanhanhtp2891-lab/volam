const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
const url = process.env.VOLAM_TEST_URL || "http://127.0.0.1:4174/volam/";
const key = "giang-ho-di-truyen-prototype";
const click = (page, selector) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => el.click());
const step = (page, ms = 100) =>
  page.evaluate((ms) => window.advanceGame(ms), ms);
const read = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
const save = async (page) => {
  await click(page, "#save-btn");
  return read(page);
};
async function seed(page, edit) {
  const data = await save(page);
  edit(data);
  await page.evaluate(
    ({ key, data }) => {
      localStorage.setItem(key, JSON.stringify(data));
      document.querySelector("#load-btn").click();
    },
    { key, data },
  );
  await step(page);
  return save(page);
}
async function explore(page, region, zone) {
  await click(page, "[data-open-exploration]");
  await page.locator("#exploration-region").selectOption(String(region));
  await click(
    page,
    `[data-explore-region="${region}"][data-explore-zone="${zone}"]`,
  );
  await step(page);
}
async function dungeonTab(page) {
  await click(page, '[data-idle-tab="inv"]');
  await click(page, '.inventory-panel [data-tab="dungeon"]');
  await step(page);
}
async function worldClick(page, point) {
  await page.locator("#game-canvas").evaluate((el, point) => {
    const r = el.getBoundingClientRect(),
      camera = window.camera;
    el.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        clientX: r.x + ((point.x - camera.x) / el.width) * r.width,
        clientY: r.y + ((point.y - camera.y) / el.height) * r.height,
      }),
    );
  }, point);
}
(async () => {
  const { MONSTERS, SPECIES } = await import("../src/bestiary.ts");
  const { DUNGEONS, DUNGEON_IDS } = await import("../src/progression.ts");
  const browser = await chromium.launch({
    executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    await fs.mkdir("/tmp/volam-v19", { recursive: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await context.addInitScript(() => {
      let time = 1000,
        serial = 0;
      const frames = new Map();
      window.wallClock =
        Number(sessionStorage.getItem("v19-clock")) || 1801600000000;
      Date.now = () => window.wallClock;
      Object.defineProperty(performance, "now", { value: () => time });
      Math.random = () => 0.5;
      window.requestAnimationFrame = (cb) => {
        frames.set(++serial, cb);
        return serial;
      };
      window.cancelAnimationFrame = (id) => frames.delete(id);
      window.advanceGame = (ms) => {
        window.fastSimulation = ms > 1000;
        while (ms > 0) {
          const dt = Math.min(50, ms);
          time += dt;
          window.wallClock += dt;
          ms -= dt;
          const callbacks = [...frames.values()];
          frames.clear();
          callbacks.forEach((cb) => cb(time));
        }
        window.fastSimulation = false;
        sessionStorage.setItem("v19-clock", String(window.wallClock));
      };
      window.monsterFrames = [];
      window.enemyLabels = [];
      window.botPositions = {};
      const p = CanvasRenderingContext2D.prototype,
        draw = p.drawImage,
        clear = p.clearRect,
        translate = p.translate,
        text = p.fillText;
      p.clearRect = function (...args) {
        if (this.canvas.id === "game-canvas") this.nextCamera = true;
        return clear.apply(this, args);
      };
      p.translate = function (x, y) {
        if (this.nextCamera) {
          window.camera = { x: -x, y: -y };
          this.nextCamera = false;
        }
        return translate.call(this, x, y);
      };
      p.drawImage = function (source, ...args) {
        if (
          this.canvas.id === "game-canvas" &&
          source instanceof HTMLImageElement &&
          source.naturalWidth === 1774 &&
          args.length === 8
        ) {
          window.monsterFrames.push(args.slice(0, 4));
          if (window.monsterFrames.length > 2000) window.monsterFrames.shift();
        }
        if (!window.fastSimulation || this.canvas.id !== "game-canvas")
          return draw.call(this, source, ...args);
      };
      p.fillText = function (t, x, y, ...rest) {
        if (this.canvas.id === "game-canvas") {
          if (/ · BOT$/.test(t)) window.botPositions[t] = { x, y };
          if (/ · Lv\./.test(t)) {
            window.enemyLabels.push(t);
            if (window.enemyLabels.length > 500) window.enemyLabels.shift();
          }
        }
        if (!window.fastSimulation || this.canvas.id !== "game-canvas")
          return text.call(this, t, x, y, ...rest);
      };
      for (const name of [
        "fill",
        "stroke",
        "fillRect",
        "strokeRect",
        "strokeText",
      ]) {
        const original = p[name];
        p[name] = function (...args) {
          if (!window.fastSimulation || this.canvas.id !== "game-canvas")
            return original.apply(this, args);
        };
      }
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
      "0.28.0",
    );
    await click(page, '[data-faction="gaibang"]');
    await click(page, "#join-sect");
    await step(page);
    const initial = await save(page);
    await seed(page, (s) => {
      delete s.player.exploration;
      s.player.dungeonClears = { tomb: 4, bamboo: 2 };
      Object.assign(s.player.idle, {
        inTown: true,
        autoLoot: false,
        autoEquip: false,
        autoSkills: false,
      });
    });
    let data = await save(page);
    assert.equal(data.player.exploration.active, false);
    assert.equal(data.player.dungeonClears.tomb, 4);
    assert.equal(data.player.dungeonClears.bamboo, 2);
    assert.equal(Object.keys(data.player.dungeonClears).length, 12);
    assert.deepEqual(data.player.equipment, initial.player.equipment);
    await click(page, "[data-open-exploration]");
    await page.locator("#exploration-region").selectOption("1");
    assert.equal(
      await page.locator('[data-explore-region="1"]').first().isDisabled(),
      true,
    );
    await page.locator("#exploration-region").selectOption("0");
    assert.equal(await page.locator("[data-zone-card]").count(), 4);
    await page.screenshot({
      path: "/tmp/volam-v19/exploration-atlas-mobile.png",
    });
    await click(page, '[data-explore-region="0"][data-explore-zone="0"]');
    await step(page);
    data = await save(page);
    assert.equal(data.enemies.length, 28);
    assert.equal(
      await page.locator("#mobile-map-name").textContent(),
      "HOA SƠN",
    );
    assert.match(
      await page.locator(".mobile-map-channel").textContent(),
      /Khám phá/,
    );
    assert.equal(new Set(data.enemies.map((e) => e.monsterId)).size, 7);
    assert.equal(Math.min(...data.enemies.map((e) => e.level)), 1);
    assert.equal(Math.max(...data.enemies.map((e) => e.level)), 10);
    assert.equal(
      await page.locator("#game-canvas").getAttribute("data-world-width"),
      "3600",
    );
    assert.equal(
      await page.locator("#game-canvas").getAttribute("data-world-height"),
      "2400",
    );
    assert.equal(await page.locator("#exploration-hud").isVisible(), true);
    await page.screenshot({ path: "/tmp/volam-v19/hoa-son-mobile.png" });
    await explore(page, 0, 3);
    data = await save(page);
    assert.equal(data.player.x, 2700);
    assert.equal(data.player.y, 1860);
    assert.match(
      await page.locator("#exploration-zone-level").textContent(),
      /9–10/,
    );
    const goldBefore = data.player.gold;
    await page.keyboard.down("d");
    await step(page, 1200);
    await page.keyboard.up("d");
    data = await save(page);
    assert.ok(data.player.x > 2800);
    assert.equal(data.player.gold, goldBefore);
    assert.ok(
      Object.values(await page.evaluate(() => window.botPositions)).some(
        (p) => p.x > 1900,
      ),
      "bots must appear in the expanded world",
    );
    await page.reload({ waitUntil: "networkidle" });
    await step(page);
    let reloaded = await save(page);
    assert.equal(reloaded.player.x, data.player.x);
    assert.equal(reloaded.player.y, data.player.y);
    assert.equal(reloaded.player.exploration.region, 0);
    assert.deepEqual(reloaded.player.equipment, initial.player.equipment);
    console.log(
      "PASS old saves migrate; 28 diverse spawns, level gates, 4 zones, wide movement, bots and far-coordinate reload",
    );

    await seed(page, (s) => {
      Object.assign(s.player, {
        level: 160,
        xp: 0,
        attack: 1000000,
        defense: 1000000,
        gold: 1000,
        questKills: 0,
        bossDefeated: false,
        questRewardClaimed: false,
      });
      Object.assign(s.player.idle, {
        autoLoot: false,
        autoEquip: false,
        autoSkills: false,
      });
    });
    for (let r = 0; r < 16; r++) {
      await explore(page, r, 3);
      const s = await save(page);
      assert.equal(s.player.exploration.region, r);
      assert.equal(s.enemies.length, 28);
      assert.ok(
        s.enemies.some((e) => e.kind === "boss" && e.level === r * 10 + 10),
      );
      assert.ok((await page.evaluate(() => window.monsterFrames)).length > 0);
    }
    await step(page);
    const cells = await page.evaluate(() =>
      window.monsterFrames.map(
        (f) => Math.round(f[0] / 221.75) + Math.round(f[1] / 221.75) * 8,
      ),
    );
    assert.ok(
      new Set(cells).size >= 16,
      "real gameplay draws varied atlas cells",
    );
    await click(page, "[data-open-bestiary]");
    assert.equal(await page.locator(".bestiary-grid article").count(), 32);
    assert.equal(
      await page
        .locator(".bestiary-grid .monster-art")
        .evaluateAll(
          (els) => new Set(els.map((e) => e.style.backgroundPosition)).size,
        ),
      32,
    );
    await page.screenshot({ path: "/tmp/volam-v19/bestiary-mobile.png" });
    await click(page, "#utility-close");
    const boss = (await save(page)).enemies.find((e) => e.kind === "boss");
    await worldClick(page, boss);
    await step(page, 20000);
    data = await save(page);
    assert.equal(data.player.bossDefeated, false);
    assert.equal(data.player.questRewardClaimed, false);
    assert.ok(
      data.groundLoot.some((l) => l.item?.rarity === "Cực phẩm"),
      "boss loot appears without completing the unrelated old quest",
    );
    assert.equal(data.enemies.find((e) => e.id === boss.id).hp, 0);
    await step(page, 61000);
    data = await save(page);
    assert.ok(
      data.enemies.find((e) => e.id === boss.id).hp > 0,
      "exploration boss respawns after a minute",
    );
    assert.deepEqual(data.enemies.find((e) => e.id === boss.id).home, {
      x: 2790,
      y: 1370,
    });
    assert.equal(data.player.bossDefeated, false);
    await click(page, "#town-btn");
    await step(page);
    data = await save(page);
    assert.equal(data.player.exploration.active, false);
    assert.equal(data.player.idle.inTown, true);
    assert.equal(
      await page.locator("#game-canvas").getAttribute("data-world-width"),
      "1900",
    );
    console.log(
      "PASS all 16 map populations, real atlas draws, bestiary and exploration boss rewards",
    );

    await seed(page, (s) => {
      s.player.level = 119;
      s.player.xp = 0;
    });
    await dungeonTab(page);
    assert.equal(await page.locator("[data-dungeon-card]").count(), 12);
    assert.equal(
      await page.locator('[data-dungeon-id="frost"]').isDisabled(),
      true,
    );
    assert.equal(
      await page.locator('[data-dungeon-id="thunder"]').isDisabled(),
      false,
    );
    await seed(page, (s) => {
      s.player.level = 160;
      s.player.xp = 0;
      s.player.gold = 1000;
      s.player.pendingItems = [];
      s.groundLoot = [];
      s.player.inventory = Array.from({ length: 60 }, (_, i) => ({
        ...initial.player.equipment.weapon,
        id: `filled-${i}`,
      }));
      s.player.dungeonClears = Object.fromEntries(
        DUNGEON_IDS.map((id) => [id, id === "tomb" ? 4 : 0]),
      );
      s.player.dungeonTokens = 0;
      s.player.refiningStones = 0;
      Object.assign(s.player.idle, {
        autoSkills: false,
        autoLoot: false,
        autoEquip: false,
      });
    });
    await dungeonTab(page);
    await page.screenshot({ path: "/tmp/volam-v19/dungeons-mobile.png" });
    await explore(page, 15, 3);
    const before = await save(page);
    await dungeonTab(page);
    await click(page, '[data-dungeon-id="frost"]');
    await step(page);
    assert.equal(
      await page.locator("#game-canvas").getAttribute("data-world-width"),
      "1900",
    );
    await click(page, "#mobile-auto");
    const seenWaves = new Set();
    for (let i = 0; i < 75; i++) {
      await step(page, 3000);
      const label = await page.locator(".mobile-map-channel").textContent();
      seenWaves.add(label.match(/\d\/6/)?.[0]);
      if (
        (await page.locator("#mobile-chat").textContent()).includes(
          "Băng Viên Thần Cung hoàn thành!",
        )
      )
        break;
    }
    await step(page);
    await page.screenshot({ path: "/tmp/volam-v19/frost-battle-mobile.png" });
    await dungeonTab(page);
    assert.equal(
      await page.locator('[data-dungeon-action="claim"]').count(),
      1,
      "all six waves must finish through real combat",
    );
    assert.ok(seenWaves.size >= 4, "multiple waves must actually run");
    await page.locator('[data-dungeon-action="claim"]').evaluate((el) => {
      const parent = el.closest("#inventory-content"),
        replay = el.cloneNode(true);
      el.click();
      parent.append(replay);
      replay.click();
      replay.remove();
    });
    await step(page);
    data = await save(page);
    assert.equal(data.player.dungeonClears.frost, 1);
    assert.equal(data.player.dungeonTokens, 20);
    assert.ok(data.player.gold >= before.player.gold + 52000);
    assert.equal(data.player.inventory.length, 60);
    const reds = data.player.pendingItems.filter(
      (i) => i.rarity === "Thần Thoại",
    );
    assert.equal(
      reds.length,
      7,
      "four guaranteed completion items plus three boss drops are red",
    );
    assert.equal(reds.filter((i) => i.level === 125).length >= 4, true);
    assert.equal(data.player.exploration.active, true);
    assert.equal(data.player.exploration.region, 15);
    assert.equal(data.player.x, before.player.x);
    assert.equal(data.player.y, before.player.y);
    assert.equal(
      await page.locator("#game-canvas").getAttribute("data-world-width"),
      "3600",
    );
    await page.reload({ waitUntil: "networkidle" });
    await step(page);
    reloaded = await save(page);
    assert.equal(
      reloaded.player.pendingItems.filter((i) => i.rarity === "Thần Thoại")
        .length,
      7,
    );
    assert.equal(reloaded.player.dungeonClears.tomb, 4);
    console.log(
      "PASS higher dungeon level gates; six real waves; multiple red boss drops; guaranteed red rewards; replay guard; full bag; far-map return and reload",
    );

    const beforeRetreat = await save(page);
    await dungeonTab(page);
    await click(page, '[data-dungeon-id="abyss"]');
    await step(page);
    await dungeonTab(page);
    await click(page, '[data-dungeon-action="leave"]');
    await step(page);
    data = await save(page);
    assert.equal(data.player.dungeonClears.abyss, 0);
    assert.equal(data.player.gold, beforeRetreat.player.gold);
    assert.equal(data.player.x, beforeRetreat.player.x);
    assert.equal(data.player.y, beforeRetreat.player.y);
    assert.deepEqual(
      data.player.pendingItems,
      beforeRetreat.player.pendingItems,
    );

    // Explore → classic training collects every item before replacing the arena.
    const marker = {
      ...initial.player.equipment.weapon,
      id: "exploration-ground-marker",
    };
    await seed(page, (s) => {
      s.groundLoot = [
        {
          id: "far-loot",
          x: 2700,
          y: 1750,
          item: marker,
          gold: 777,
          stones: 2,
        },
      ];
    });
    const beforeTraining = await save(page);
    await click(page, "#training-btn");
    await step(page);
    data = await save(page);
    assert.equal(data.player.exploration.active, false);
    assert.equal(data.player.idle.enabled, true);
    assert.equal(data.player.gold, beforeTraining.player.gold + 777);
    assert.ok(data.player.pendingItems.some((i) => i.id === marker.id));
    assert.equal(
      await page.locator("#game-canvas").getAttribute("data-world-width"),
      "1900",
    );
    assert.equal(
      data.player.pendingItems.filter((i) => i.rarity === "Thần Thoại").length,
      7,
    );
    for (const viewport of [
      { width: 360, height: 740 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(viewport);
      await explore(page, 14, 3);
      await step(page);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth),
        viewport.width,
      );
      const boxes = await page
        .locator("#exploration-hud, .mobile-map-card")
        .evaluateAll((els) =>
          els.map((el) => {
            const r = el.getBoundingClientRect();
            return {
              left: r.left,
              top: r.top,
              right: r.right,
              bottom: r.bottom,
            };
          }),
        );
      assert.ok(
        boxes.every(
          (b) =>
            b.left >= 0 &&
            b.right <= viewport.width &&
            b.top >= 0 &&
            b.bottom <= viewport.height,
        ),
      );
      assert.ok(
        boxes[0].right <= boxes[1].left,
        "zone controls must not overlap the minimap",
      );
      await page.screenshot({
        path: `/tmp/volam-v19/exploration-${viewport.width}.png`,
      });
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS exploration → training preserves loot; mobile/landscape map controls fit; no JavaScript or asset errors",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
