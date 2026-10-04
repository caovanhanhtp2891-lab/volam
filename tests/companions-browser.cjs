const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
const url = process.env.VOLAM_TEST_URL || "http://127.0.0.1:4174/volam/";
const key = "giang-ho-di-truyen-prototype";
const click = (p, s) =>
  p
    .locator(s)
    .first()
    .evaluate((el) => el.click());
const step = (p, ms = 100) => p.evaluate((ms) => window.advanceGame(ms), ms);
const save = async (p) => {
  await click(p, "#save-btn");
  return p.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
};
async function seed(p, edit) {
  const data = await save(p);
  edit(data);
  await p.evaluate(
    ({ key, data }) => {
      localStorage.setItem(key, JSON.stringify(data));
      document.querySelector("#load-btn").click();
    },
    { key, data },
  );
  await step(p);
  return save(p);
}
async function realms(p) {
  await click(p, "#utility-close");
  await click(p, "[data-open-bond-realms]");
}
async function inventory(p) {
  await click(p, '[data-idle-tab="inv"]');
  await click(p, '.inventory-panel [data-tab="dungeon"]');
  await step(p);
}
async function win(p, id) {
  await realms(p);
  await click(p, `[data-bond-enter="bond-${id}"]`);
  await step(p);
  if (
    !(await p.locator("#mobile-auto").getAttribute("class")).includes("active")
  )
    await click(p, "#mobile-auto");
  for (let i = 0; i < 80; i++) {
    await click(p, '[data-idle-tab="log"]');
    await step(p, 3000);
    await inventory(p);
    if (await p.locator('[data-dungeon-action="claim"]').count()) break;
  }
  assert.equal(
    await p.locator('[data-dungeon-action="claim"]').count(),
    1,
    `real waves must clear: ${id}`,
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
  const captureMessage = await p.locator("#toast").textContent();
  const result = await save(p);
  await step(p);
  return { ...result, captureMessage };
}
(async () => {
  const { COMPANION_IDS, COMPANIONS, freshCompanions } = await import(
    "../src/companions.ts"
  );
  const { TERRITORIES } = await import("../src/military.ts");
  const { TITLES } = await import("../src/character-progression.ts");
  const browser = await chromium.launch({
    executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    await fs.mkdir("/tmp/volam-v20", { recursive: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await context.addInitScript(() => {
      let time = 1000,
        serial = 0;
      const frames = new Map();
      window.wallClock =
        Number(sessionStorage.getItem("v20-clock")) || 1801600000000;
      Date.now = () => window.wallClock;
      Object.defineProperty(performance, "now", { value: () => time });
      window.randomValue = 0.5;
      Math.random = () => window.randomValue;
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
        sessionStorage.setItem("v20-clock", String(window.wallClock));
      };
      window.overhead = [];
      window.companionFrames = [];
      window.ally = null;
      window.damage = [];
      window.heals = [];
      const p = CanvasRenderingContext2D.prototype,
        draw = p.drawImage,
        text = p.fillText;
      p.drawImage = function (source, ...args) {
        if (
          this.canvas.id === "game-canvas" &&
          source instanceof HTMLImageElement &&
          source.naturalWidth === 1983 &&
          args.length === 8
        ) {
          window.companionFrames.push(args.slice(0, 4));
          if (window.companionFrames.length > 1000)
            window.companionFrames.shift();
        }
        if (!window.fastSimulation || this.canvas.id !== "game-canvas")
          return draw.call(this, source, ...args);
      };
      p.fillText = function (t, x, y, ...rest) {
        if (this.canvas.id === "game-canvas") {
          if (/ · Tri kỷ$/.test(t)) window.ally = { x, y: y + 98 };
          if (/Tri kỷ/.test(t) && /^-/.test(t)) {
            window.damage.push(t);
            if (window.damage.length > 100) window.damage.shift();
          }
          if (/^\+/.test(t) && t.includes("Bích Dao")) window.heals.push(t);
          if (
            this.textBaseline === "middle" &&
            /800 [\d.]+px/.test(this.font)
          ) {
            window.overhead.push({
              t,
              x: this.getTransform().e + x,
              y: this.getTransform().f + y,
              font: this.font,
              blur: this.shadowBlur,
              filter: this.filter,
              alpha: this.globalAlpha,
            });
            if (window.overhead.length > 100) window.overhead.shift();
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
    const p = await context.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("response", (r) => {
      if (r.status() >= 400 && r.url().startsWith(url))
        errors.push(`${r.status()} ${r.url()}`);
    });
    await p.goto(url, { waitUntil: "networkidle" });
    assert.equal(
      await p.locator("html").getAttribute("data-version"),
      "0.31.0",
    );
    await click(p, '[data-faction="gaibang"]');
    await click(p, "#join-sect");
    await step(p);
    const initial = await save(p);
    await seed(p, (s) => {
      delete s.player.companions;
      Object.assign(s.player.idle, {
        inTown: true,
        autoSkills: false,
        autoEquip: false,
        autoLoot: false,
      });
      s.player.botSettings = { enabled: false, assist: false };
      s.player.level = 4;
    });
    let d = await save(p);
    assert.deepEqual(d.player.companions, freshCompanions());
    assert.deepEqual(d.player.equipment, initial.player.equipment);
    await click(p, '[data-idle-tab="char"]');
    assert.equal(await p.locator(".paper-doll .equipment-slot").count(), 13);
    await click(p, "#companion-slot");
    assert.equal(await p.locator("[data-companion-card]").count(), 10);
    await p.screenshot({ path: "/tmp/volam-v20/collection-mobile.png" });
    await realms(p);
    assert.equal(await p.locator("[data-bond-card]").count(), 10);
    assert.equal(
      await p.locator('[data-bond-enter="bond-linh-lan"]').isDisabled(),
      true,
    );
    await p.screenshot({ path: "/tmp/volam-v20/realms-mobile.png" });
    await click(p, "#utility-close");
    await seed(p, (s) => {
      s.player.level = 5;
    });
    await realms(p);
    assert.equal(
      await p.locator('[data-bond-enter="bond-linh-lan"]').isDisabled(),
      false,
    );
    const before = await save(p);
    await click(p, '[data-bond-enter="bond-linh-lan"]');
    await step(p);
    await inventory(p);
    await click(p, '[data-dungeon-action="leave"]');
    await step(p);
    d = await save(p);
    assert.deepEqual(d.player.companions, before.player.companions);
    assert.equal(d.player.gold, before.player.gold);
    console.log(
      "PASS old saves keep gear and receive empty companion slot; 10 cards, level gates and retreat do not award captures",
    );
    await seed(p, (s) => {
      Object.assign(s.player, {
        level: 160,
        xp: 0,
        attack: 1000000,
        defense: 1000000,
      });
      Object.assign(s.player.exploration, {
        active: true,
        region: 15,
        zone: 3,
      });
      s.player.x = 2700;
      s.player.y = 1750;
      s.player.idle.inTown = false;
    });
    const returnState = await save(p);
    assert.equal(returnState.player.level, 160);
    assert.equal(returnState.player.exploration.active, true);
    d = await win(p, "linh-lan");
    assert.deepEqual(d.player.companions.owned, ["linh-lan"]);
    assert.equal(d.player.companions.affinity["linh-lan"], 1);
    assert.equal(d.player.companions.victories["linh-lan"], 1);
    assert.equal(d.player.companions.equipped, null);
    assert.deepEqual(d.player.dungeonClears, returnState.player.dungeonClears);
    assert.equal(d.player.x, returnState.player.x);
    assert.equal(d.player.y, returnState.player.y);
    assert.equal(
      await p.locator("#game-canvas").getAttribute("data-world-width"),
      "3600",
    );
    assert.match(d.captureMessage, /Thu phục thành công/);
    assert.ok(
      (await p.evaluate(() => window.companionFrames)).some(
        (f) => f[0] === 0 && f[1] === 0,
      ),
    );
    await p.evaluate(() => {
      window.randomValue = 0.999;
    });
    d = await win(p, "thien-co");
    assert.equal(d.player.companions.failures["thien-co"], 1);
    assert.equal(d.player.companions.owned.includes("thien-co"), false);
    assert.equal(d.player.companions.victories["thien-co"], 1);
    await realms(p);
    assert.match(
      await p.locator('[data-bond-card="bond-thien-co"]').textContent(),
      /Thu phục 25%/,
    );
    await click(p, "#utility-close");
    await seed(p, (s) => {
      s.player.companions.failures["thien-co"] = 9;
    });
    d = await win(p, "thien-co");
    assert.ok(d.player.companions.owned.includes("thien-co"));
    assert.equal(d.player.companions.affinity["thien-co"], 1);
    assert.equal(d.player.companions.failures["thien-co"], 0);
    assert.match(d.captureMessage, /Mốc bảo đảm/);
    assert.ok(
      d.player.inventory.some((i) => i.rarity === "Thần Thoại") ||
        d.player.pendingItems.some((i) => i.rarity === "Thần Thoại"),
    );
    await p.evaluate(() => {
      window.randomValue = 0;
    });
    d = await win(p, "linh-lan");
    assert.equal(d.player.companions.affinity["linh-lan"], 2);
    assert.equal(d.player.companions.owned.length, 2);
    d = await win(p, "bich-dao");
    assert.ok(d.player.companions.owned.includes("bich-dao"));
    console.log(
      "PASS actual low/high trial waves, heroine atlas, successful/failed capture, pity, red rewards, duplicate affinity, reward replay guard and far-map return",
    );
    await click(p, "#town-btn");
    await step(p);
    await click(p, '[data-idle-tab="char"]');
    const baseHp = (await save(p)).player.maxHp;
    await click(p, "#companion-slot");
    await click(p, '[data-equip-companion="linh-lan"]');
    await step(p);
    d = await save(p);
    assert.equal(d.player.companions.equipped, "linh-lan");
    assert.ok(d.player.maxHp > baseHp);
    const woreHp = d.player.maxHp;
    await click(p, "[data-remove-companion]");
    await step(p);
    assert.equal((await save(p)).player.maxHp, baseHp);
    await click(p, '[data-equip-companion="linh-lan"]');
    await step(p);
    assert.equal((await save(p)).player.maxHp, woreHp);
    await click(p, "#utility-close");
    await seed(p, (s) => {
      s.player.attack = 0;
      s.player.defense = 1000;
      Object.assign(s.player.exploration, {
        active: true,
        region: 14,
        zone: 3,
      });
      s.player.x = 2650;
      s.player.y = 1700;
      s.player.idle.inTown = false;
      s.player.preferences.damageNumbers = true;
    });
    await click(p, "#world-panel-close");
    await step(p, 50);
    assert.ok((await p.evaluate(() => window.ally)).x > 1900);
    await p.evaluate(() => {
      window.damage = [];
    });
    const farEnemy = (await save(p)).enemies.find(
      (e) => e.kind === "normal" && e.x > 2400 && e.y > 1300,
    );
    assert.ok(farEnemy);
    await seed(p, (s) => {
      s.player.x = farEnemy.home.x - 50;
      s.player.y = farEnemy.home.y + 80;
    });
    assert.equal(
      await p.locator("#mobile-auto").getAttribute("aria-pressed"),
      "false",
    );
    const totalHp = async () =>
      (await save(p)).enemies.reduce((n, e) => n + e.hp, 0);
    const hpBefore = await totalHp();
    await step(p, 500);
    assert.equal(
      await totalHp(),
      hpBefore,
      "flight must not damage at cast start",
    );
    await step(p, 800);
    assert.ok((await totalHp()) < hpBefore);
    assert.ok((await p.evaluate(() => window.damage)).length > 0);
    await click(p, '[data-idle-tab="log"]');
    await step(p);
    await p.screenshot({ path: "/tmp/volam-v20/ally-far-map.png" });
    console.log(
      "PASS wearing/removing applies one companion's HP bonus exactly, follows beyond old map bounds and delivers damage only after flight impact",
    );
    await click(p, '[data-idle-tab="char"]');
    await click(p, "#companion-slot");
    await click(p, '[data-equip-companion="bich-dao"]');
    await click(p, "#utility-close");
    await seed(p, (s) => {
      s.player.x = 3300;
      s.player.y = 2200;
      s.player.idle.inTown = false;
      s.player.exploration.active = true;
      s.player.hp = s.player.maxHp * 0.5;
    });
    await click(p, "#world-panel-close");
    const injured = (await save(p)).player;
    await p.evaluate(() => {
      window.heals = [];
    });
    await step(p, 1700);
    d = await save(p);
    assert.ok(
      d.player.hp > injured.hp + injured.maxHp * 0.07,
      JSON.stringify({
        before: injured.hp,
        max: injured.maxHp,
        after: d.player.hp,
        companion: d.player.companions.equipped,
        heals: await p.evaluate(() => window.heals),
      }),
    );
    assert.equal((await p.evaluate(() => window.heals)).length > 0, true);
    await step(p, 1200);
    await p.evaluate(() => {
      window.heals = [];
    });
    await step(p, 2500);
    assert.deepEqual(await p.evaluate(() => window.heals), []);
    console.log(
      "PASS Bích Dao's actual healing grants 8% max HP and respects the ten-second cooldown",
    );
    await click(p, "#town-btn");
    await step(p);
    await seed(p, (s) => {
      s.player.level = 200;
      s.player.attack = 1000000;
      s.player.defense = 1000000;
      s.player.idle.inTown = true;
      s.player.military = {
        captured: TERRITORIES.map((x) => x.id),
        seals: ["hoang-de"],
        equipped: "hoang-de",
      };
      s.player.journey.activeTitle = "grandmaster";
      s.player.journey.unlockedTitles = TITLES.map((t) => t.id);
    });
    await click(p, "#world-panel-close");
    await p.evaluate(() => {
      window.overhead = [];
    });
    await step(p);
    const labels = await p.evaluate(() => window.overhead.slice(-3));
    assert.equal(labels.length, 3);
    assert.ok(labels[0].t.includes("Hoàng Đế"));
    assert.ok(
      Math.abs(
        parseFloat(labels[0].font.match(/[\d.]+(?=px)/)[0]) -
          (11.5 + 6 * 0.4) * 1.25,
      ) < 0.001,
    );
    assert.ok(
      Math.abs(
        parseFloat(labels[1].font.match(/[\d.]+(?=px)/)[0]) -
          (11 + TITLES.find((t) => t.id === "grandmaster").rarity * 0.4) * 1.25,
      ) < 0.001,
    );
    assert.ok(parseFloat(labels[2].font.match(/[\d.]+(?=px)/)[0]) >= 13.75);
    labels.forEach((l) => {
      assert.equal(l.blur, 0);
      assert.equal(l.filter, "none");
      assert.equal(l.alpha, 1);
    });
    assert.ok(labels[1].y - labels[0].y > 20 && labels[2].y - labels[1].y > 20);
    await click(p, "#world-panel-close");
    await step(p);
    await p.screenshot({ path: "/tmp/volam-v20/sharp-labels-aura.png" });
    await seed(p, (s) => {
      s.player.preferences.titleVisible = false;
    });
    await p.evaluate(() => {
      window.overhead = [];
    });
    await step(p);
    assert.equal((await p.evaluate(() => window.overhead.slice(-2))).length, 2);
    assert.ok(
      (await p.evaluate(() => window.overhead)).every(
        (l) => !l.t.includes("Nhất Đại Tông Sư"),
      ),
    );
    await seed(p, (s) => {
      s.player.preferences.titleVisible = true;
    });
    await click(p, '[data-idle-tab="char"]');
    await step(p);
    const image1 = await p
      .locator("#character-preview")
      .evaluate((el) => el.toDataURL());
    await step(p, 350);
    const image2 = await p
      .locator("#character-preview")
      .evaluate((el) => el.toDataURL());
    assert.notEqual(image1, image2);
    await p.screenshot({ path: "/tmp/volam-v20/character-slot-mobile.png" });
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 360, height: 740 },
      { width: 844, height: 390 },
    ]) {
      await p.setViewportSize(viewport);
      await click(p, "#companion-slot");
      assert.equal(
        await p.evaluate(() => document.documentElement.scrollWidth),
        viewport.width,
      );
      const box = await p.locator(".utility-dialog").boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= viewport.width);
      await p.screenshot({
        path: `/tmp/volam-v20/tri-ky-${viewport.width}.png`,
      });
      await click(p, "#utility-close");
    }
    const keep = (await save(p)).player.companions;
    await p.reload({ waitUntil: "networkidle" });
    await step(p);
    assert.deepEqual((await save(p)).player.companions, keep);
    await click(p, '[data-idle-tab="char"]');
    await click(p, "#rebirth-btn");
    await click(p, "#confirm-rebirth");
    await step(p);
    d = await save(p);
    assert.equal(d.player.level, 1);
    assert.deepEqual(d.player.companions, keep);
    assert.deepEqual(errors, []);
    console.log(
      "PASS all three sharper 25% labels, animated aura, narrow/landscape layouts, reload and rebirth preserve companions; no asset/JavaScript errors",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
