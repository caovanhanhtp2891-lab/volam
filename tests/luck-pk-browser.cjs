const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
const url = process.env.VOLAM_TEST_URL || "http://127.0.0.1:4174/volam/";
const key = "giang-ho-di-truyen-prototype";
const click = (p, s) =>
  p
    .locator(s)
    .first()
    .evaluate((e) => e.click());
const read = (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
const save = async (p) => {
  await click(p, "#save-btn");
  return read(p);
};
const step = (p, ms = 100) => p.evaluate((ms) => window.advanceGame(ms), ms);
let nonce = 0;
async function seed(p, edit) {
  const data = await save(p);
  edit(data);
  data.player.name = `Kiểm thử ${++nonce}`;
  await p.evaluate(
    ({ data, key }) => {
      localStorage.setItem(key, JSON.stringify(data));
      document.querySelector("#load-btn").click();
      if (
        document.querySelector("#mobile-auto").getAttribute("aria-pressed") ===
        "true"
      )
        document.querySelector("#mobile-auto").click();
    },
    { data, key },
  );
  await step(p);
  const loaded = await save(p);
  assert.equal(
    loaded.player.name,
    data.player.name,
    "modified save really loaded",
  );
  return loaded;
}
const close = (p) => click(p, "#utility-close");
async function siege(p, city) {
  await click(p, "[data-open-siege]");
  await p.locator("#siege-city").selectOption(city);
  await p.locator("#siege-size").selectOption("6");
  await click(p, "[data-start-siege]");
  await step(p);
}
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    await fs.mkdir("/tmp/volam-v27", { recursive: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await context.addInitScript(() => {
      let time = 1000,
        serial = 0;
      window.wallClock =
        Number(sessionStorage.getItem("v27-clock")) || 1801600000000;
      Date.now = () => window.wallClock;
      const frames = new Map();
      Object.defineProperty(performance, "now", { value: () => time });
      window.randomValue = 0.25;
      Math.random = () => window.randomValue;
      window.requestAnimationFrame = (cb) => {
        const id = ++serial;
        frames.set(id, cb);
        return id;
      };
      window.cancelAnimationFrame = (id) => frames.delete(id);
      window.horseDraws = 0;
      window.offscreenSizes = [];
      window.labels = [];
      window.botPositions = {};
      window.damageTexts = 0;
      const p = CanvasRenderingContext2D.prototype,
        fill = p.fillText,
        draw = p.drawImage;
      p.fillText = function (text, x, y, ...args) {
        if (this.canvas.id === "game-canvas") {
          if (String(text).includes("ĐỒ SÁT")) window.labels.push(String(text));
          if (String(text).endsWith(" · BOT"))
            window.botPositions[text] = { x, y };
          if (String(text).startsWith("-") && this.fillStyle === "#f6c1b8")
            window.damageTexts++;
        }
        if (!window.fastSimulation || this.canvas.id !== "game-canvas")
          return fill.call(this, text, x, y, ...args);
      };
      p.drawImage = function (source, ...args) {
        if (
          this.canvas.id === "game-canvas" &&
          source instanceof HTMLImageElement &&
          /horse-walk|riding-horses/.test(source.src)
        )
          window.horseDraws++;
        if (
          source instanceof HTMLCanvasElement &&
          source !== this.canvas &&
          source.width > 600
        )
          if (
            !window.offscreenSizes.some(
              ([w, h]) => w === source.width && h === source.height,
            )
          )
            window.offscreenSizes.push([source.width, source.height]);
        if (!window.fastSimulation || this.canvas.id !== "game-canvas")
          return draw.call(this, source, ...args);
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
        sessionStorage.setItem("v27-clock", String(window.wallClock));
      };
    });
    const p = await context.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("response", (r) => {
      if (r.status() >= 400 && r.url().startsWith(url))
        errors.push(`${r.status()} ${r.url()}`);
    });
    await p.goto(url, { waitUntil: "networkidle" });
    assert.equal(
      await p.locator("html").getAttribute("data-version"),
      "0.30.0",
    );
    await p.locator('[data-faction="gaibang"]').click();
    await p.locator("#join-sect").click();
    let data = await seed(p, (s) => {
      s.player.level = 160;
      s.player.xp = 0;
      s.player.gold = 2e9;
      s.player.attack = 1000000;
      s.player.defense = 0;
      Object.assign(s.player.idle, {
        inTown: true,
        autoEquip: false,
        autoLoot: true,
        autoSkills: false,
        autoPotions: false,
      });
      s.player.botSettings = { enabled: false, assist: false, pvp: false };
      s.player.inventory = [];
    });
    const makeItem = (id, extra = {}) => {
      const item = {
        ...data.player.equipment.weapon,
        id,
        name: id,
        rarity: "Thường",
        level: 10,
        power: 1,
        enhance: 0,
        ...extra,
      };
      delete item.setId;
      return item;
    };
    // Automatic filter rejects even gold sets below the grade; silver/stones are split out.
    await click(p, '[data-idle-tab="more"]');
    await p.locator('[data-loot-setting="minRarity"]').selectOption("6");
    await p.locator('[data-loot-setting="minGrade"]').selectOption("16");
    const before = await save(p);
    await seed(p, (s) => {
      Object.assign(s.player.idle, {
        enabled: true,
        inTown: false,
        stage: 1,
        wave: 1,
        push: false,
      });
      s.player.x = 950;
      s.player.y = 650;
      s.groundLoot = [
        {
          id: "filtered-gold",
          x: 950,
          y: 650,
          item: makeItem("low-gold", { rarity: "Hoàng Kim", setId: "tower" }),
          gold: 17,
          stones: 2,
        },
        {
          id: "accepted-red",
          x: 950,
          y: 650,
          item: makeItem("red-160", { rarity: "Thần Thoại", level: 160 }),
          gold: 0,
          stones: 0,
        },
      ];
    });
    if (
      (await p.locator("#mobile-auto").getAttribute("aria-pressed")) === "true"
    )
      await click(p, "#mobile-auto");
    await step(p, 1800);
    data = await save(p);
    assert.equal(data.player.gold, before.player.gold + 17);
    assert.equal(data.player.refiningStones, before.player.refiningStones + 2);
    assert.deepEqual(
      data.player.inventory.map((i) => i.id),
      ["red-160"],
    );
    assert.equal(data.groundLoot[0].item.id, "low-gold");
    await click(p, "#stage-next");
    data = await save(p);
    assert.equal(
      data.player.inventory.some((i) => i.id === "low-gold"),
      false,
      "map transition respects pickup filter",
    );
    // The original Rừng Trúc adventure now also runs automatic pickup.
    await seed(p, (s) => {
      s.player.idle.enabled = false;
      s.player.idle.inTown = false;
      s.groundLoot = [
        {
          id: "adventure-drop",
          x: 950,
          y: 650,
          item: makeItem("adventure-red", { rarity: "Thần Thoại", level: 160 }),
          gold: 0,
          stones: 0,
        },
      ];
    });
    await step(p, 1800);
    data = await save(p);
    assert.ok(
      data.player.inventory.some((i) => i.id === "adventure-red"),
      "legacy adventure uses the same automatic pickup filter",
    );
    // Manual pickup deliberately overrides pickup settings.
    await seed(p, (s) => {
      s.player.x = 950;
      s.player.y = 650;
      s.groundLoot = [
        {
          id: "manual",
          x: 950,
          y: 650,
          item: makeItem("manual-low"),
          gold: 0,
          stones: 0,
        },
      ];
    });
    await step(p, 700);
    await p.keyboard.press("e");
    data = await save(p);
    assert.ok(data.player.inventory.some((i) => i.id === "manual-low"));
    // Automatic discard and confirmed manual discard use quality AND grade, with explicit set protection.
    await seed(p, (s) => {
      s.player.idle.inTown = true;
      s.player.inventory = [
        makeItem("weak"),
        makeItem("upper-grade", { level: 11 }),
        makeItem("red", { rarity: "Thần Thoại" }),
        makeItem("enhanced", { enhance: 10 }),
      ];
    });
    await click(p, '[data-idle-tab="more"]');
    await p.locator('[data-loot-setting="maxDiscardRarity"]').selectOption("6");
    await p.locator('[data-loot-setting="maxDiscardGrade"]').selectOption("1");
    await p.locator('[data-loot-setting="weakerOnly"]').uncheck();
    await p.locator('[data-loot-setting="autoDiscard"]').check();
    data = await save(p);
    assert.deepEqual(
      data.player.inventory.map((i) => i.id),
      ["upper-grade", "red", "enhanced"],
    );
    await p.locator('[data-loot-setting="protectSpecial"]').uncheck();
    data = await save(p);
    assert.deepEqual(
      data.player.inventory.map((i) => i.id),
      ["upper-grade", "enhanced"],
    );
    await p.locator('[data-loot-setting="autoDiscard"]').uncheck();
    await seed(p, (s) => {
      s.player.inventory = [
        makeItem("discard-one"),
        makeItem("keep-grade", { level: 11 }),
        makeItem("keep-enhanced", { enhance: 10 }),
      ];
    });
    await click(p, '[data-idle-tab="inv"]');
    await click(p, "[data-discard-filter]");
    await p.locator("#discard-level").selectOption("10");
    await p.locator("#discard-weaker").uncheck();
    await click(p, "#preview-discard");
    assert.match(
      await p.locator("#discard-preview").textContent(),
      /1 món sẽ bị vứt/,
    );
    await p.locator("#discard-rarity").selectOption("2");
    assert.equal(
      await p.locator("#confirm-discard").count(),
      0,
      "editing a filter invalidates stale preview",
    );
    await click(p, "#preview-discard");
    await click(p, "#confirm-discard");
    data = await save(p);
    assert.deepEqual(
      data.player.inventory.map((i) => i.id),
      ["keep-grade", "keep-enhanced"],
    );
    // Rare prizes are paid exactly once, including a full bag and save failure.
    await seed(p, (s) => {
      s.player.inventory = Array.from({ length: 60 }, (_, i) =>
        makeItem(`full-${i}`),
      );
      s.player.pendingItems = [];
      s.player.gems = {};
      s.player.lucky = { nextRound: 1, history: [] };
      s.player.idle.inTown = true;
    });
    await click(p, "[data-open-events]");
    await p.evaluate(() => (window.randomValue = 0.5));
    await click(p, '[data-play-lucky="wheel"]');
    data = await read(p);
    assert.equal(data.player.lucky.wheelMisses, 1);
    assert.equal(data.player.lucky.wheelSpins, 1);
    assert.match(
      await p.locator(".wheel-luck").textContent(),
      /May mắn \+0,4%|May mắn \+0.4%/,
    );
    await step(p, 2300);
    const { wheelOdds } = await import("../src/lucky-events.ts");
    const sample = (progress, index) => {
      const odds = wheelOdds(progress);
      return (
        (odds.slice(0, index).reduce((a, b) => a + b, 0) + odds[index] / 2) /
        100
      );
    };
    data = await read(p);
    await p.evaluate(
      (v) => (window.randomValue = v),
      sample(data.player.lucky, 10),
    );
    await click(p, '[data-play-lucky="wheel"]');
    data = await read(p);
    assert.equal(data.player.pendingItems.length, 1);
    assert.equal(data.player.pendingItems[0].rarity, "Thần Thoại");
    assert.equal(data.player.pendingItems[0].level, 160);
    assert.equal(data.player.lucky.wheelMisses, 0);
    const rareBefore = JSON.stringify(data.player.pendingItems);
    await p.reload({ waitUntil: "networkidle" });
    await step(p);
    await click(p, "[data-open-events]");
    await step(p, 2300);
    data = await save(p);
    assert.equal(
      JSON.stringify(data.player.pendingItems),
      rareBefore,
      "reloading never claims twice",
    );
    await p.evaluate(
      (v) => (window.randomValue = v),
      sample(data.player.lucky, 13),
    );
    await click(p, '[data-play-lucky="wheel"]');
    data = await read(p);
    assert.equal(data.player.gems["diamond:10:6"], 1);
    await step(p, 2300);
    const resourceBefore = await save(p);
    await p.evaluate(
      (v) => {
        window.randomValue = v;
        window.oldSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function (k, v) {
          if (k === "giang-ho-di-truyen-prototype") throw Error("quota");
          return window.oldSetItem.call(this, k, v);
        };
      },
      sample(resourceBefore.player.lucky, 10),
    );
    await click(p, '[data-play-lucky="wheel"]');
    await p.evaluate(() => (Storage.prototype.setItem = window.oldSetItem));
    data = await save(p);
    for (const field of ["gold", "gems", "inventory", "pendingItems", "lucky"])
      assert.deepEqual(
        data.player[field],
        resourceBefore.player[field],
        `failed save rolls back ${field}`,
      );
    await p.screenshot({ path: "/tmp/volam-v27/lucky-wheel-mobile.png" });
    await close(p);
    // Fixed viewport and readable fields still allow keyboard entry and scrolling.
    await click(p, "[data-open-events]");
    await click(p, '[data-lucky-tab="lottery"]');
    for (const field of ["#event-stake", "#event-choice"]) {
      await p.locator(field).focus();
      await p.locator(field).fill(field.endsWith("stake") ? "123" : "07");
      assert.ok(
        (await p
          .locator(field)
          .evaluate((e) => parseFloat(getComputedStyle(e).fontSize))) >= 16,
      );
      assert.equal(await p.evaluate(() => visualViewport.scale), 1);
    }
    assert.match(
      await p.locator('meta[name="viewport"]').getAttribute("content"),
      /maximum-scale=1.0/,
    );
    assert.equal(
      await p.evaluate(() =>
        document.dispatchEvent(new Event("gesturestart", { cancelable: true })),
      ),
      false,
    );
    await p.screenshot({ path: "/tmp/volam-v27/fixed-input-mobile.png" });
    await close(p);
    // Horse sprite rendering and actual PK victory / defeat, rather than mocked announcements.
    await p.evaluate(() => {
      window.randomValue = 0;
      window.horseDraws = 0;
      window.labels = [];
    });
    data = await seed(p, (s) => {
      s.player.inventory = [];
      s.player.pendingItems = [];
      Object.assign(s.player.idle, {
        enabled: true,
        inTown: false,
        stage: 1,
        wave: 1,
        autoLoot: false,
        autoSkills: false,
        autoPotions: false,
      });
      s.player.x = 950;
      s.player.y = 650;
      s.player.hp = s.player.maxHp;
      s.player.botSettings = { enabled: true, assist: false, pvp: true };
    });
    if (
      (await p.locator("#mobile-auto").getAttribute("aria-pressed")) === "false"
    )
      await click(p, "#mobile-auto");
    await click(p, "#world-panel-close");
    await step(p, 300);
    assert.ok(
      (await p.evaluate(() => window.labels)).length > 0,
      "real hostile BOT is rendered",
    );
    assert.ok(
      (await p.evaluate(() => window.horseDraws)) > 0,
      "BOT horses use the actual mount atlas",
    );
    for (
      let i = 0;
      i < 16 && !(await p.locator("#world-announcement").isVisible());
      i++
    )
      await step(p, 500);
    assert.ok(
      await p.locator("#world-announcement").isVisible(),
      "actual BOT kill announces to world",
    );
    assert.match(
      await p.locator("#world-announcement").textContent(),
      new RegExp(`${data.player.name} đã tiêu diệt .*BOT`),
    );
    const rects = await p.evaluate(() => ({
      xp: document.querySelector(".xp-meter").getBoundingClientRect().toJSON(),
      speaker: document
        .querySelector("#world-announcement")
        .getBoundingClientRect()
        .toJSON(),
      map: document
        .querySelector(".mobile-map-card")
        .getBoundingClientRect()
        .toJSON(),
      animation: getComputedStyle(
        document.querySelector(".world-announcement-track"),
      ).animationName,
    }));
    assert.ok(rects.speaker.top >= rects.xp.bottom);
    assert.ok(rects.speaker.bottom <= rects.map.top);
    assert.equal(rects.animation, "world-speaker-scroll");
    const speakerX = () => p.locator('.world-announcement-track').evaluate(e => new DOMMatrix(getComputedStyle(e).transform).m41);
    const xBefore = await speakerX();
    await p.waitForTimeout(250);
    assert.ok(await speakerX() < xBefore, 'speaker text really travels horizontally');
    await p.screenshot({ path: "/tmp/volam-v27/pk-victory-speaker.png" });
    await step(p, 16000);
    assert.equal(await p.locator("#world-announcement").isVisible(), false);
    data = await seed(p, (s) => {
      s.player.hp = 1;
      s.player.idle.autoPotions = false;
      s.player.idle.inTown = false;
      s.player.botSettings = { enabled: true, assist: false, pvp: true };
    });
    if (
      (await p.locator("#mobile-auto").getAttribute("aria-pressed")) === "true"
    )
      await click(p, "#mobile-auto");
    await click(p, "#world-panel-close");
    for (
      let i = 0;
      i < 16 && !(await p.locator("#world-announcement").isVisible());
      i++
    )
      await step(p, 500);
    assert.ok(
      await p.locator("#world-announcement").isVisible(),
      "actual BOT fatal hit announces to world",
    );
    assert.match(
      await p.locator("#world-announcement").textContent(),
      new RegExp(`BOT đã tiêu diệt ${data.player.name}`),
    );
    await p.screenshot({ path: "/tmp/volam-v27/pk-defeat-speaker.png" });
    // Town stays safe, even with RNG zero; all screen sizes retain a fixed viewport.
    await step(p, 15000);
    await seed(p, (s) => {
      s.player.idle.inTown = true;
    });
    await p.evaluate(() => (window.labels = []));
    await step(p, 1000);
    assert.equal((await p.evaluate(() => window.labels)).length, 0);
    assert.equal(await p.locator("#world-announcement").isVisible(), false);
    for (const viewport of [
      { width: 320, height: 740 },
      { width: 844, height: 390 },
      { width: 1280, height: 800 },
    ]) {
      await p.setViewportSize(viewport);
      await click(p, '[data-idle-tab="more"]');
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      const small = await p
        .locator(
          'input:not([type="checkbox"]):not([type="radio"]),select,textarea',
        )
        .evaluateAll((es) =>
          es
            .filter(
              (e) =>
                getComputedStyle(e).display !== "none" &&
                parseFloat(getComputedStyle(e).fontSize) < 16,
            )
            .map((e) => e.id),
        );
      assert.deepEqual(small, []);
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: strict quality/grade pickup on transitions, currency splitting, manual override, discard preview and protection; rare red equipment/gem delivery and rollback, luck/reload; fixed mobile inputs; real PK kills in both directions, mounted BOTs, world speaker placement/motion, safe town.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
