const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
const url = process.env.VOLAM_TEST_URL || "http://127.0.0.1:4174/volam/";
const key = "giang-ho-di-truyen-prototype";
const captures = process.env.VOLAM_CAPTURE_DIR || "/tmp/volam-flight-riding";
const click = (page, selector) =>
  page.locator(selector).evaluate((el) => el.click());
const step = (page, ms) => page.evaluate((ms) => window.advanceGame(ms), ms);
const saved = (page) =>
  page.evaluate((key) => {
    document.querySelector("#save-btn").click();
    return JSON.parse(localStorage.getItem(key));
  }, key);
async function seed(page, edit) {
  const data = await saved(page);
  edit(data);
  await page.evaluate(
    ({ key, data }) => {
      localStorage.setItem(key, JSON.stringify(data));
      document.querySelector("#load-btn").click();
    },
    { key, data },
  );
  await step(page, 50);
  return saved(page);
}
async function cast(page, skill) {
  await page.evaluate(
    ({ key, skill }) => {
      document.querySelector("#save-btn").click();
      const data = JSON.parse(localStorage.getItem(key));
      const canvas = document.querySelector("#game-canvas"),
        rect = canvas.getBoundingClientRect(),
        camera = window.camera;
      const aim = (point) =>
        canvas.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            clientX:
              rect.x + ((point.x - camera.x) * rect.width) / canvas.width,
            clientY:
              rect.y + ((point.y - camera.y) * rect.height) / canvas.height,
          }),
        );
      aim(data.enemies.find((e) => e.id === "bandit-1"));
      document.querySelector(`[data-skill="${skill}"]`).click();
      aim(data.player); // Prevent unrelated auto basic attacks during flight.
    },
    { key, skill },
  );
}
(async () => {
  const { FACTIONS } = await import("../src/idle.ts");
  const { SECTS, SECT_BY_FACTION } = await import("../src/sects.ts");
  const browser = await chromium.launch({
    executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const errors = [],
    cards = [];
  try {
    await fs.mkdir(captures, { recursive: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await context.addInitScript(() => {
      let time = 1000,
        serial = 0;
      const frames = new Map();
      Object.defineProperty(performance, "now", { value: () => time });
      Math.random = () => 0.5;
      window.requestAnimationFrame = (cb) => {
        const id = ++serial;
        frames.set(id, cb);
        return id;
      };
      window.cancelAnimationFrame = (id) => frames.delete(id);
      window.advanceGame = (ms) => {
        while (ms > 0) {
          const dt = Math.min(25, ms);
          time += dt;
          ms -= dt;
          const callbacks = [...frames.values()];
          frames.clear();
          callbacks.forEach((cb) => cb(time));
        }
      };
      window.rigDraws = { horses: 0, torsos: 0, grips: 0 };
      window.statusDraws = { frozen: 0, chilled: 0, poisoned: 0, stunned: 0 };
      window.walkFrames = new Set();
      const p = CanvasRenderingContext2D.prototype,
        clear = p.clearRect,
        translate = p.translate,
        draw = p.drawImage,
        stroke = p.stroke,
        fill = p.fill;
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
          source instanceof HTMLImageElement &&
          source.src.includes("horse-walk")
        )
          window.walkFrames.add(args[0]);
        if (
          source instanceof HTMLImageElement &&
          source.src.includes("riding-horses")
        )
          window.rigDraws.horses++;
        if (
          source instanceof HTMLImageElement &&
          source.naturalWidth === 1223 &&
          args.length === 8 &&
          args[3] < 230 &&
          args[2] > 240
        )
          window.rigDraws.torsos++;
        return draw.call(this, source, ...args);
      };
      p.stroke = function (...args) {
        if (this.canvas.id === "game-canvas" && this.strokeStyle === "#c3f3ff")
          window.statusDraws.frozen++;
        if (this.canvas.id === "game-canvas" && this.strokeStyle === "#94e5f4")
          window.statusDraws.chilled++;
        if (this.strokeStyle === "#d4ae8b" && this.lineWidth === 1.5)
          window.rigDraws.grips++;
        return stroke.apply(this, args);
      };
      p.fill = function (...args) {
        if (this.canvas.id === "game-canvas" && this.fillStyle === "#a4e76c")
          window.statusDraws.poisoned++;
        if (this.canvas.id === "game-canvas" && this.fillStyle === "#ffe59c")
          window.statusDraws.stunned++;
        return fill.apply(this, args);
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
      "0.15.0",
    );
    await click(page, '[data-sect="thuy-yen"]');
    await click(page, "#join-sect");
    for (const [faction, skill] of [
      ["cuiyan", "skill1"],
      ["cuiyan", "ultimate"],
      ["wudang", "skill1"],
      ["kunlun", "skill1"],
      ["kunlun", "skill2"],
      ["tangmen", "skill1"],
      ["wudu", "skill1"],
      ["gaibang", "ultimate"],
    ]) {
      const definition = SECTS[SECT_BY_FACTION[faction]].kit[skill];
      const before = await seed(page, (s) => {
        Object.assign(s.player, {
          factionId: faction,
          sect: FACTIONS.find((f) => f.id === faction).archetype,
          level: 5,
          mp: 500,
          rage: 100,
          x: 460,
          y: 330,
          attackCooldown: 0,
          cooldowns: { skill1: 0, skill2: 0, ultimate: 0 },
          skillRanks: { skill1: 1, skill2: 1, ultimate: 1 },
          mounted: false,
          equipment: {},
        });
        Object.assign(s.player.idle, {
          enabled: false,
          inTown: false,
          autoSkills: false,
          autoLoot: false,
          autoEquip: false,
        });
      });
      await page.evaluate(() => {
        window.statusDraws = { frozen: 0, chilled: 0, poisoned: 0, stunned: 0 };
      });
      await cast(page, skill);
      const immediate = await saved(page);
      assert.equal(immediate.player.mp, before.player.mp - definition.mp);
      assert.equal(
        immediate.enemies[0].hp,
        before.enemies[0].hp,
        "cast does not apply contact damage",
      );
      await step(page, 100);
      assert.equal(
        await page.evaluate(() =>
          Object.values(window.statusDraws).some(Boolean),
        ),
        false,
        "no debuff artwork before impact",
      );
      assert.equal(
        (await saved(page)).enemies[0].hp,
        before.enemies[0].hp,
        "windup does not apply contact damage",
      );
      if (faction === "cuiyan") {
        await step(page, 100);
        assert.equal(
          (await saved(page)).enemies[0].hp,
          before.enemies[0].hp,
          "ice still in flight at 200ms",
        );
        await page.screenshot({
          path: path.join(captures, `ice-${skill}-flight.png`),
        });
      }
      if (faction === "kunlun" && skill === "skill1") {
        await step(page, 200);
        const first = await saved(page);
        assert.ok(first.enemies[0].hp < before.enemies[0].hp);
        assert.equal(
          first.enemies[1].hp,
          before.enemies[1].hp,
          "lightning has not reached second enemy",
        );
        await step(page, 150);
        const second = await saved(page);
        assert.ok(second.enemies[1].hp < before.enemies[1].hp);
        assert.equal(
          second.enemies[2].hp,
          before.enemies[2].hp,
          "lightning has not reached third enemy",
        );
        await step(page, 200);
        assert.ok((await saved(page)).enemies[2].hp < before.enemies[2].hp);
      } else await step(page, 350);
      const hit = await saved(page);
      assert.ok(
        hit.enemies[0].hp < before.enemies[0].hp,
        `${faction} ${skill} damages after arrival`,
      );
      if (definition.slow)
        assert.equal(hit.enemies[0].slowFactor, definition.slow);
      if (definition.stun) assert.ok(hit.enemies[0].stunUntil > 0);
      const statuses = await page.evaluate(() => window.statusDraws);
      if (faction === "cuiyan" && definition.slow)
        assert.ok(statuses.chilled > 0);
      if (definition.poison) assert.ok(statuses.poisoned > 0);
      if (definition.stun && faction !== "cuiyan") {
        assert.ok(statuses.stunned > 0);
        assert.equal(
          hit.enemies[0].frozenUntil,
          0,
          "lightning stun does not become ice",
        );
      }
      if (faction === "cuiyan" && definition.stun) {
        assert.ok(statuses.frozen > 0);
        assert.equal(hit.enemies[0].frozenUntil, hit.enemies[0].stunUntil);
        await step(page, 650);
        const frozen = (await saved(page)).enemies[0];
        assert.equal(frozen.x, hit.enemies[0].x);
        assert.equal(frozen.y, hit.enemies[0].y);
        await page.screenshot({
          path: path.join(captures, "frozen-enemy.png"),
        });
        await step(page, 1600);
        await page.evaluate(() => {
          window.statusDraws.frozen = 0;
        });
        await step(page, 100);
        assert.equal(
          await page.evaluate(() => window.statusDraws.frozen),
          0,
          "ice cage disappears when stun expires",
        );
      }
      if (definition.zone) {
        await step(page, 100);
        assert.equal(
          (await saved(page)).enemies[0].hp,
          hit.enemies[0].hp,
          "zone waits for its first tick after contact",
        );
        await step(page, 1000);
        assert.ok(
          (await saved(page)).enemies[0].hp < hit.enemies[0].hp,
          "zone damages after contact and its tick interval",
        );
      }
      if (faction === "cuiyan")
        await page.screenshot({
          path: path.join(captures, `ice-${skill}-contact.png`),
        });
      console.log(
        `PASS ${faction} ${skill}: windup/flight before damage, statuses applied at contact`,
      );
    }
    const horse = {
      id: "rig-horse",
      slot: "horse",
      variant: "bay",
      name: "Hồng Mã",
      level: 1,
      power: 2,
      icon: "◆",
      rarity: "Thường",
      color: "#d6dbe0",
      enhance: 0,
      bonuses: { attack: 0, defense: 0, hp: 0, mp: 0 },
    };
    for (const faction of FACTIONS)
      for (const sex of ["male", "female"]) {
        await seed(page, (s) => {
          Object.assign(s.player, {
            factionId: faction.id,
            sect: faction.archetype,
            sex,
            mounted: false,
            equipment: { horse },
          });
          s.player.idle.inTown = true;
        });
        await click(page, '[data-idle-tab="char"]');
        await step(page, 50);
        const standing = await page
          .locator("#character-preview")
          .evaluate((c) => c.toDataURL());
        await click(page, ".mount-card [data-mount-toggle]");
        await step(page, 50);
        const mounted = await page
          .locator("#character-preview")
          .evaluate((c) => c.toDataURL());
        assert.ok(
          standing !== mounted,
          `${faction.id} ${sex}: mounted pose differs`,
        );
        assert.equal((await saved(page)).player.mounted, true);
        cards.push({ name: `${faction.name} · ${sex}`, standing, mounted });
        if (faction.id === "cuiyan" && sex === "female")
          await page.screenshot({
            path: path.join(captures, "mounted-character-mobile.png"),
          });
      }
    const metrics = await page.evaluate(() => window.rigDraws);
    assert.ok(
      metrics.horses > 0 && metrics.torsos > 0 && metrics.grips > 0,
      JSON.stringify(metrics),
    );
    const horseLooks = new Set();
    for (const variant of [
      "bay",
      "white",
      "warhorse",
      "ember",
      "dapple",
      "night",
    ]) {
      await seed(page, (s) => {
        s.player.equipment.horse.variant = variant;
        s.player.mounted = true;
      });
      await click(page, '[data-idle-tab="char"]');
      await step(page, 50);
      horseLooks.add(
        await page.locator("#character-preview").evaluate((c) => c.toDataURL()),
      );
    }
    assert.equal(
      horseLooks.size,
      6,
      "six horses draw different coat/saddle artwork",
    );
    for (const variant of [
      "bay",
      "white",
      "warhorse",
      "ember",
      "dapple",
      "night",
    ]) {
      await seed(page, (s) => {
        s.player.equipment.horse.variant = variant;
        s.player.mounted = true;
        s.player.x = 300;
        s.player.y = 330;
        Object.assign(s.player.idle, { enabled: false, inTown: false });
      });
      await click(page, '[data-idle-tab="log"]');
      if (await page.locator(".game-layout").isVisible())
        await click(page, "#world-panel-close");
      await page.evaluate(() => {
        window.walkFrames = new Set();
        document.activeElement?.blur();
      });
      const walkingFrom = (await saved(page)).player.x;
      await page.keyboard.down("d");
      await step(page, 600);
      const movedPlayer = (await saved(page)).player;
      assert.ok(
        movedPlayer.x > walkingFrom + 40,
        `${variant}: riding moves through keyboard input`,
      );
      assert.equal(
        await page.evaluate(() => window.walkFrames.size),
        4,
        `${variant}: four whole-body walking frames`,
      );
      if (variant === "bay")
        await page.screenshot({
          path: path.join(captures, "riding-in-motion.png"),
        });
      await page.keyboard.up("d");
      await step(page, 300);
      await page.evaluate(() => {
        window.walkFrames = new Set();
      });
      await step(page, 100);
      assert.equal(
        await page.evaluate(() => window.walkFrames.size),
        0,
        `${variant}: gait stops at rest`,
      );
    }
    await click(page, '[data-idle-tab="log"]');
    await step(page, 50);
    await page.screenshot({
      path: path.join(captures, "mounted-arena-mobile.png"),
    });
    assert.deepEqual(errors, []);
    const gallery = await browser.newPage({
      viewport: { width: 1200, height: 900 },
    });
    await gallery.setContent(
      `<meta charset="utf-8"><style>body{background:#101714;color:#f5dcaf;font:16px system-ui}main{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}article{background:#1d2924;text-align:center}img{width:50%}</style><h1>v0.15.0 · Đứng / Cưỡi ngựa · 20 mẫu</h1><main>${cards.map((c) => `<article><p>${c.name}</p><img src="${c.standing}"><img src="${c.mounted}"></article>`).join("")}</main>`,
    );
    await gallery.screenshot({
      path: path.join(captures, "all-20-riding-poses.png"),
      fullPage: true,
    });
    console.log(
      "PASS all 20 looks and six horse coats: shared mounted torso/horse/grip renderer; no browser/asset errors",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
