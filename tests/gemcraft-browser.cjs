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
const step = (p, ms = 100) => p.evaluate((ms) => window.advanceGame(ms), ms);
const save = async (p) => {
  await click(p, "#save-btn");
  return p.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
};
const close = (p) => click(p, "#utility-close");
const power = async (p) =>
  Number((await p.locator("#combat-power").textContent()).replaceAll(".", ""));
let seedSerial = 0;
async function seed(p, edit) {
  const data = await save(p);
  edit(data);
  data.player.name = `Thử ngọc ${++seedSerial}`;
  await p.evaluate(
    ({ key, data }) => {
      localStorage.setItem(key, JSON.stringify(data));
      document.querySelector("#load-btn").click();
    },
    { key, data },
  );
  await step(p);
  const result = await save(p);
  assert.equal(
    result.player.name,
    data.player.name,
    "edited save must actually load",
  );
  return result;
}
async function bag(p) {
  await click(p, '[data-idle-tab="inv"]');
  await click(p, '.inventory-panel [data-tab="bag"]');
  await step(p);
}
async function realmMenu(p) {
  await close(p);
  await click(p, '[data-idle-tab="log"]');
  await click(p, "[data-open-gem-realms]");
}
async function dungeonPanel(p) {
  await click(p, '[data-idle-tab="inv"]');
  await click(p, '.inventory-panel [data-tab="dungeon"]');
  await step(p);
}
async function sockets(p, id) {
  await close(p);
  await bag(p);
  await p.evaluate((id) => {
    const button = document.createElement("button");
    button.dataset.openSockets = id;
    document.querySelector("#inventory-content").append(button);
    button.click();
    button.remove();
  }, id);
}
async function win(p, id) {
  await realmMenu(p);
  await click(p, `[data-gem-realm-enter="${id}"]`);
  await step(p);
  if ((await p.locator("#mobile-auto").getAttribute("aria-pressed")) !== "true")
    await click(p, "#mobile-auto");
  for (let i = 0; i < 100; i++) {
    await click(p, "#world-panel-close");
    await step(p, 3000);
    await dungeonPanel(p);
    if (await p.locator('[data-dungeon-action="claim"]').count()) break;
  }
  assert.equal(
    await p.locator('[data-dungeon-action="claim"]').count(),
    1,
    `real guardian waves clear ${id}`,
  );
  await p.locator('[data-dungeon-action="claim"]').evaluate((el) => {
    const parent = el.closest("#inventory-content"),
      replay = el.cloneNode(true);
    el.click();
    parent.append(replay);
    replay.click();
    replay.remove();
  });
  await step(p);
  return save(p);
}
(async () => {
  const { gemKey, gemStats } = await import("../src/gems.ts");
  const { GEM_REALM_IDS, GEM_REALMS } = await import("../src/gem-realms.ts");
  const { gearStats, ENHANCEMENT_CAPS, RARITIES } = await import(
    "../src/equipment.ts"
  );
  const browser = await chromium.launch({
    executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    await fs.mkdir("/tmp/volam-v26", { recursive: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await context.addInitScript(() => {
      let time = 1000,
        serial = 0;
      const frames = new Map();
      window.wallClock = 1801600000000;
      Date.now = () => window.wallClock;
      Object.defineProperty(performance, "now", { value: () => time });
      window.roll = 0.5;
      Math.random = () => window.roll;
      window.requestAnimationFrame = (cb) => {
        frames.set(++serial, cb);
        return serial;
      };
      window.cancelAnimationFrame = (id) => frames.delete(id);
      window.nativeMaps = [];
      window.sceneryFrames = [];
      const proto = CanvasRenderingContext2D.prototype,
        draw = proto.drawImage;
      proto.drawImage = function (source, ...args) {
        if (
          this.canvas.id === "game-canvas" &&
          source instanceof HTMLCanvasElement &&
          source.dataset.nativeLandscape
        )
          window.nativeMaps.push({
            region: source.dataset.nativeLandscape,
            width: source.width,
            height: source.height,
          });
        if (
          this.canvas.id !== "game-canvas" &&
          source instanceof HTMLImageElement &&
          /scenery-props/.test(source.src)
        )
          window.sceneryFrames.push(args.slice(0, 4));
        if (!window.fastSimulation || this.canvas.id !== "game-canvas")
          return draw.call(this, source, ...args);
      };
      for (const name of [
        "fill",
        "stroke",
        "fillText",
        "fillRect",
        "strokeRect",
        "strokeText",
      ]) {
        const original = proto[name];
        proto[name] = function (...args) {
          if (!window.fastSimulation || this.canvas.id !== "game-canvas")
            return original.apply(this, args);
        };
      }
      window.advanceGame = (ms) => {
        window.fastSimulation = ms > 1000;
        while (ms > 0) {
          const dt = Math.min(ms, 50);
          ms -= dt;
          time += dt;
          window.wallClock += dt;
          const callbacks = [...frames.values()];
          frames.clear();
          callbacks.forEach((cb) => cb(time));
        }
        window.fastSimulation = false;
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
    await click(p, '[data-faction="gaibang"]');
    await click(p, "#join-sect");
    await step(p);
    const original = await save(p);
    let d = await seed(p, (s) => {
      delete s.player.gems;
      delete s.player.passiveRanks;
      s.player.level = 9;
      s.player.skillPoints = 30;
      Object.assign(s.player.idle, {
        inTown: true,
        autoLoot: false,
        autoEquip: false,
        autoSkills: false,
      });
      s.player.botSettings = { enabled: false, assist: false };
    });
    assert.deepEqual(d.player.gems, {});
    assert.deepEqual(d.player.passiveRanks, {});
    assert.deepEqual(d.player.equipment, original.player.equipment);
    await realmMenu(p);
    assert.equal(await p.locator("[data-gem-realm-card]").count(), 7);
    assert.equal(
      await p.locator('[data-gem-realm-enter="gem-jade"]').isDisabled(),
      true,
    );
    await p.locator('[data-gem-realm-enter="gem-jade"]').evaluate((el) => {
      el.disabled = false;
      el.click();
    });
    await step(p);
    assert.equal((await save(p)).player.level, 9);
    assert.ok(
      (await save(p)).player.gems &&
        !(await p.locator(".dungeon-state").count()),
    );
    await close(p);
    // Actual passive stat changes, gates, free refunds, and persistence.
    await click(p, '[data-idle-tab="skill"]');
    assert.equal(await p.locator("[data-passive-card]").count(), 9);
    assert.equal(
      await p.locator('[data-passive-up="gaibang"]').isDisabled(),
      true,
    );
    let basePower = await power(p);
    await click(p, '[data-passive-up="force"]');
    d = await save(p);
    assert.equal(d.player.skillPoints, 29);
    assert.equal(d.player.passiveRanks.force, 1);
    assert.ok((await power(p)) > basePower);
    await click(p, '[data-passive-refund="force"]');
    assert.equal(await power(p), basePower);
    assert.equal((await save(p)).player.skillPoints, 30);
    await seed(p, (s) => {
      s.player.level = 160;
      s.player.skillPoints = 100;
    });
    await click(p, '[data-idle-tab="skill"]');
    for (let i = 0; i < 10; i++) await click(p, '[data-passive-up="force"]');
    assert.equal(
      await p.locator('[data-passive-up="force"]').isDisabled(),
      true,
    );
    assert.equal((await save(p)).player.skillPoints, 90);
    await click(p, '[data-passive-up="renewal"]');
    await click(p, '[data-passive-up="gaibang"]');
    await p.screenshot({ path: "/tmp/volam-v26/passives-mobile.png" });
    // One socket opens only on a successful +10, and white equipment cannot reach +11.
    await seed(p, (s) => {
      s.player.equipment.weapon.enhance = 9;
      s.player.equipment.weapon.level = 160;
      s.player.equipment.weapon.rarity = "Thường";
      s.player.equipment.weapon.color = "#e3e8ec";
      s.player.gold = 1000000000;
      s.player.refiningStones = 10000;
    });
    await click(p, '[data-idle-tab="char"]');
    await click(p, '[data-equipped-preview="weapon"]');
    assert.equal(
      await p
        .locator('[data-enhancement-threshold="10"]')
        .getAttribute("class"),
      "enhancement-line sealed",
    );
    await click(p, "[data-detail-enhance]");
    await p.evaluate(() => (window.roll = 0.999));
    await click(p, "[data-confirm-enhance]");
    assert.equal((await save(p)).player.equipment.weapon.enhance, 9);
    assert.equal(await p.locator(".enhancement-line.activated").count(), 0);
    await p.evaluate(() => (window.roll = 0));
    await click(p, "[data-confirm-enhance]");
    d = await save(p);
    assert.equal(d.player.equipment.weapon.enhance, 10);
    assert.equal(await p.locator(".enhancement-line.activated").count(), 1);
    assert.equal(await p.locator("[data-confirm-enhance]").isDisabled(), true);
    assert.match(
      await p.locator("#utility-content").textContent(),
      /1 lỗ|0\/1/,
    );
    await p.screenshot({ path: "/tmp/volam-v26/white-cap.png" });
    await close(p);
    const ruby = { kind: "ruby", level: 4, quality: "Hoàng Kim" },
      sapphire = { kind: "sapphire", level: 3, quality: "Hiếm" },
      rubyKey = gemKey(ruby),
      sapphireKey = gemKey(sapphire);
    await seed(p, (s) => {
      s.player.gems = { [rubyKey]: 2, [sapphireKey]: 1 };
    });
    d = await save(p);
    const weaponId = d.player.equipment.weapon.id,
      beforeStats = gearStats(d.player.equipment.weapon),
      gold = d.player.gold,
      stones = d.player.refiningStones;
    basePower = await power(p);
    await sockets(p, weaponId);
    assert.equal(await p.locator("[data-socket-row]").count(), 1);
    await p.locator('[data-socket-select="0"]').selectOption(rubyKey);
    await click(p, '[data-socket-insert="0"]');
    d = await save(p);
    assert.equal(d.player.gems[rubyKey], 1);
    assert.deepEqual(d.player.equipment.weapon.gems, [ruby]);
    assert.equal(d.player.gold, gold);
    assert.equal(d.player.refiningStones, stones);
    assert.ok((await power(p)) > basePower);
    const afterStats = gearStats(d.player.equipment.weapon);
    assert.equal(afterStats.attack - beforeStats.attack, gemStats(ruby).attack);
    await p.locator('[data-socket-select="0"]').selectOption(sapphireKey);
    await click(p, '[data-socket-insert="0"]');
    d = await save(p);
    assert.equal(d.player.gems[rubyKey], 2);
    assert.equal(d.player.gems[sapphireKey], undefined);
    assert.deepEqual(d.player.equipment.weapon.gems, [sapphire]);
    await p.screenshot({ path: "/tmp/volam-v26/sockets-mobile.png" });
    await click(p, '[data-socket-remove="0"]');
    d = await save(p);
    assert.equal(d.player.gems[sapphireKey], 1);
    assert.equal(await power(p), basePower);
    // Grandfather a genuine earlier +100 item without losing its ten slots or stats.
    await seed(p, (s) => {
      s.player.equipment.weapon.enhance = 100;
      s.player.equipment.weapon.level = 1;
      s.player.equipment.weapon.gems = [ruby];
    });
    await sockets(p, weaponId);
    assert.equal(await p.locator("[data-socket-row]").count(), 10);
    const legacy = await save(p);
    await close(p);
    await click(p, "#load-btn");
    await step(p);
    assert.deepEqual(
      (await save(p)).player.equipment.weapon,
      legacy.player.equipment.weapon,
    );
    // Real new red high-grade gear has ten slots and a genuine +100 cap.
    await seed(p, (s) => {
      Object.assign(s.player.equipment.weapon, {
        enhance: 99,
        level: 160,
        rarity: "Thần Thoại",
        color: "#ff405d",
        gems: [],
      });
    });
    await click(p, '[data-idle-tab="char"]');
    await click(p, '[data-equipped-preview="weapon"]');
    await click(p, "[data-detail-enhance]");
    await click(p, "[data-confirm-enhance]");
    assert.equal((await save(p)).player.equipment.weapon.enhance, 100);
    assert.equal(await p.locator(".enhancement-line.activated").count(), 10);
    assert.equal(await p.locator("[data-confirm-enhance]").isDisabled(), true);
    await close(p);
    // All seven map rewards are awarded exactly once, even with a full gear bag.
    await seed(p, (s) => {
      s.player.attack = 1000000;
      s.player.defense = 1000000;
      s.player.gems = {};
      s.player.inventory = Array.from({ length: 60 }, (_, i) => ({
        ...s.player.equipment.armor,
        id: `full-bag-${i}`,
      }));
    });
    await realmMenu(p);
    await click(p, '[data-gem-realm-enter="gem-jade"]');
    await step(p);
    await dungeonPanel(p);
    await click(p, '[data-dungeon-action="leave"]');
    assert.deepEqual((await save(p)).player.gems, {});
    let total = 0;
    for (const id of GEM_REALM_IDS) {
      d = await win(p, id);
      total += GEM_REALMS[id].gemCount;
      assert.equal(
        Object.values(d.player.gems).reduce((a, b) => a + b, 0),
        total,
      );
      assert.ok(d.player.pendingItems.length > 0);
      assert.equal(d.player.inventory.length, 60);
    }
    // Repeat farming remains available, with no missing rewards after reload.
    d = await win(p, "gem-jade");
    total += GEM_REALMS["gem-jade"].gemCount;
    assert.equal(
      Object.values(d.player.gems).reduce((a, b) => a + b, 0),
      total,
    );
    await close(p);
    await click(p, '[data-idle-tab="log"]');
    await click(p, "[data-open-gem-bag]");
    assert.ok(await p.locator("[data-gem-stack]").count());
    await p.screenshot({ path: "/tmp/volam-v26/gem-bag.png" });
    await close(p);
    // Native landscape and real scenery atlas are actually used by the world renderer.
    await seed(p, (s) => {
      Object.assign(s.player.idle, {
        inTown: false,
        enabled: true,
        maxStage: 160,
        stage: 151,
        wave: 1,
        autoSkills: false,
      });
      s.player.inventory = [];
    });
    await click(p, "#world-panel-close");
    await step(p, 100);
    await p.screenshot({ path: "/tmp/volam-v26/snow-map.png" });
    assert.equal((await save(p)).player.idle.stage, 151);
    assert.equal((await save(p)).player.idle.inTown, false);
    const art = await p.evaluate(() => ({
      maps: window.nativeMaps,
      props: window.sceneryFrames,
    }));
    assert.ok(
      art.maps.some(
        (m) => m.region === "15" && m.width >= 1900 && m.height >= 1200,
      ),
    );
    assert.ok(art.props.length > 20);
    assert.ok(art.props.every((f) => f[2] >= 350 && f[3] >= 350));
    await seed(p, (s) => {
      Object.assign(s.player.idle, { inTown: true });
      s.player.level = 160;
    });
    await realmMenu(p);
    await p.screenshot({ path: "/tmp/volam-v26/gem-realms.png" });
    for (const [width, height] of [
      [320, 568],
      [390, 844],
      [844, 390],
      [1440, 900],
    ]) {
      await p.setViewportSize({ width, height });
      await sockets(p, weaponId);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      assert.ok(
        await p
          .locator(".utility-dialog")
          .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
      );
      await close(p);
      await click(p, '[data-idle-tab="skill"]');
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
    }
    await save(p);
    await p.reload({ waitUntil: "networkidle" });
    await step(p);
    d = await save(p);
    assert.match(await p.locator("#level-label").textContent(), /Cấp 160/);
    assert.ok((await power(p)) > 1000);
    assert.equal(d.player.passiveRanks.force, 10);
    assert.equal(
      Object.values(d.player.gems).reduce((a, b) => a + b, 0),
      total,
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: old saves, nine real passives, level gates, failure/success +10 socket, rarity/grade caps, +100 legacy preservation, exact gem stats, free replace/remove conservation, seven real map victories and repeat farming, full gear bag, reward replay guard, native scenery, save/reload and four viewport layouts.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
