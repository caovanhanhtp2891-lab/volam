const fs = require("node:fs/promises");
const { chromium } = require(process.env.VOLAM_PLAYWRIGHT_PATH || "playwright");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.VOLAM_CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await p.addInitScript(() => {
      window.frameTimes = [];
      const raf = window.requestAnimationFrame;
      let last = 0;
      window.requestAnimationFrame = (cb) =>
        raf((t) => {
          if (last) window.frameTimes.push(t - last);
          last = t;
          cb(t);
        });
      window.storageWrites = 0;
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (...args) {
        window.storageWrites++;
        return set.apply(this, args);
      };
      window.domWrites = 0;
      const desc = Object.getOwnPropertyDescriptor(
        Element.prototype,
        "innerHTML",
      );
      Object.defineProperty(Element.prototype, "innerHTML", {
        ...desc,
        set(value) {
          window.domWrites++;
          return desc.set.call(this, value);
        },
      });
    });
    await p.goto(process.env.VOLAM_TEST_URL || "http://127.0.0.1:4174/volam/", {
      waitUntil: "networkidle",
    });
    await p.locator('[data-faction="gaibang"]').click();
    await p.locator("#join-sect").click();
    await p.evaluate(() => {
      document.querySelector("#save-btn").click();
      let d = JSON.parse(localStorage.getItem("giang-ho-di-truyen-prototype"));
      d.player.level = 120;
      d.player.attack = 3000;
      d.player.defense = 15000;
      d.player.gold = 1000000;
      d.player.skillRanks = { skill1: 10, skill2: 10, ultimate: 10 };
      d.player.botSettings = { enabled: true, assist: true, pvp: false };
      d.player.preferences.skillEffects = "full";
      Object.assign(d.player.idle, {
        enabled: true,
        inTown: false,
        stage: 111,
        maxStage: 120,
        push: false,
        autoEquip: false,
        autoLoot: true,
        autoSkills: true,
      });
      localStorage.setItem("giang-ho-di-truyen-prototype", JSON.stringify(d));
      document.querySelector("#load-btn").click();
      document.querySelector("#world-panel-close").click();
    });
    await p.waitForTimeout(1500);
    const cdp = await p.context().newCDPSession(p);
    await cdp.send("Profiler.enable");
    await cdp.send("Performance.enable");
    await cdp.send("Profiler.start");
    await p.evaluate(() => {
      window.frameTimes = [];
      window.storageWrites = 0;
      window.domWrites = 0;
    });
    const start = await cdp.send("Performance.getMetrics");
    await p.waitForTimeout(8000);
    const stop = await cdp.send("Performance.getMetrics");
    const { profile } = await cdp.send("Profiler.stop");
    const label = process.argv[2] || "before";
    await fs.writeFile(
      `/tmp/volam-v28-${label}.cpuprofile`,
      JSON.stringify(profile),
    );
    const metrics = await p.evaluate(() => {
      const a = window.frameTimes.sort((a, b) => a - b);
      return {
        frames: a.length,
        median: a[Math.floor(a.length * 0.5)],
        p95: a[Math.floor(a.length * 0.95)],
        over50: a.filter((t) => t > 50).length,
        domWrites: window.domWrites,
        storageWrites: window.storageWrites,
      };
    });
    const map = (n) =>
      Object.fromEntries(n.metrics.map((m) => [m.name, m.value]));
    const a = map(start),
      b = map(stop);
    const byId = new Map(profile.nodes.map((n) => [n.id, n]));
    const counts = {};
    for (let i = 0; i < profile.samples.length; i++) {
      const n = byId.get(profile.samples[i]),
        key =
          n.callFrame.functionName ||
          n.callFrame.url.split("/").at(-1) ||
          "(native)";
      counts[key] = (counts[key] || 0) + (profile.timeDeltas[i] || 0);
    }
    console.log(
      JSON.stringify(
        {
          label,
          metrics,
          cpu: {
            task: b.TaskDuration - a.TaskDuration,
            script: b.ScriptDuration - a.ScriptDuration,
            layout: b.LayoutDuration - a.LayoutDuration,
            heapMb: b.JSHeapUsedSize / 1e6,
          },
          hot: Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 18),
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
