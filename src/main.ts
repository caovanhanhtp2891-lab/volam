import "./style.css";

type SectId = "kim" | "hoa" | "thuy";
type ItemSlot = "weapon" | "armor";
type Rarity = "Thường" | "Tốt" | "Hiếm" | "Cực phẩm";
type PanelTab = "bag" | "smith";

interface Sect {
  id: SectId;
  name: string;
  title: string;
  description: string;
  color: string;
  accent: string;
  baseHp: number;
  baseMp: number;
  baseAttack: number;
  baseDefense: number;
  speed: number;
  skills: [string, string];
  ultimate: string;
}

interface Item {
  id: string;
  name: string;
  slot: ItemSlot;
  rarity: Rarity;
  level: number;
  power: number;
  enhance: number;
  color: string;
  icon: string;
}

interface Player {
  x: number;
  y: number;
  radius: number;
  sect: SectId;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  rage: number;
  shield: number;
  shieldUntil: number;
  attackCooldown: number;
  cooldowns: Record<"skill1" | "skill2" | "ultimate", number>;
  inventory: Item[];
  equipment: Partial<Record<ItemSlot, Item>>;
  gold: number;
  refiningStones: number;
  questKills: number;
  bossDefeated: boolean;
  facingX: number;
  facingY: number;
}

interface Enemy {
  id: string;
  name: string;
  kind: "normal" | "elite" | "boss";
  x: number;
  y: number;
  radius: number;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  color: string;
  dead: boolean;
  respawnAt: number;
  attackCooldown: number;
  bossCooldown: number;
  hitFlash: number;
  defenseDownUntil: number;
}

interface GroundLoot {
  id: string;
  x: number;
  y: number;
  item?: Item;
  gold: number;
  stones: number;
  expiresAt: number;
}

interface Telegraph {
  x: number;
  y: number;
  radius: number;
  triggerAt: number;
  damage: number;
  label: string;
}

interface GameState {
  player: Player;
  enemies: Enemy[];
  loot: GroundLoot[];
  telegraphs: Telegraph[];
  logs: string[];
  targetId: string | null;
  moveTarget: { x: number; y: number } | null;
  cameraX: number;
  cameraY: number;
  screenFlash: number;
  lastBossDefeatedAt: number;
}

const WORLD_WIDTH = 1900;
const WORLD_HEIGHT = 1200;
const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 600;
const PLAYER_START = { x: 300, y: 360 };
const SAVE_KEY = "giang-ho-di-truyen-prototype";

const SECTS: Record<SectId, Sect> = {
  kim: {
    id: "kim",
    name: "Kim Phong",
    title: "Kiếm khách cận chiến",
    description: "Áp sát nhanh, phá giáp và dồn sát thương vào một mục tiêu.",
    color: "#f2c14e",
    accent: "#fff2ba",
    baseHp: 145,
    baseMp: 90,
    baseAttack: 21,
    baseDefense: 9,
    speed: 165,
    skills: ["Phá Giáp Trảm", "Phi Kiếm Bộ"],
    ultimate: "Vạn Kiếm Quy Tông",
  },
  hoa: {
    id: "hoa",
    name: "Xích Diệm",
    title: "Hỏa pháp tầm xa",
    description: "Gọi lửa từ xa, dọn nhiều quái bằng vùng sát thương rộng.",
    color: "#ff765c",
    accent: "#ffd0a9",
    baseHp: 105,
    baseMp: 125,
    baseAttack: 26,
    baseDefense: 5,
    speed: 145,
    skills: ["Liệt Hỏa Cầu", "Hỏa Trận"],
    ultimate: "Thiên Hỏa Giáng Lâm",
  },
  thuy: {
    id: "thuy",
    name: "Huyền Thủy",
    title: "Thủy pháp sinh tồn",
    description: "Đóng băng, hồi phục và tạo khiên để trụ lâu trong chiến đấu.",
    color: "#57b7ff",
    accent: "#c8ecff",
    baseHp: 125,
    baseMp: 140,
    baseAttack: 18,
    baseDefense: 7,
    speed: 150,
    skills: ["Hàn Băng Chưởng", "Thủy Thuẫn"],
    ultimate: "Băng Hà Thiên Vũ",
  },
};

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Không tìm thấy #app");

app.innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <div class="brand-lockup">
        <div class="brand-mark">劍</div>
        <div>
          <div class="brand-name">GIANG HỒ DỊ TRUYỆN</div>
          <div class="brand-subtitle">prototype · chương 01: Rừng Trúc</div>
        </div>
      </div>
      <div class="top-actions">
        <span class="connection-pill"><i></i> Máy chủ cục bộ</span>
        <button class="ghost-button" id="save-btn">Lưu tiến trình</button>
        <button class="ghost-button" id="load-btn">Tải tiến trình</button>
        <button class="ghost-button danger-text" id="reset-btn">Chơi lại</button>
      </div>
    </header>

    <main class="game-layout">
      <aside class="left-rail">
        <section class="panel character-panel">
          <div class="section-kicker">NHÂN VẬT</div>
          <div class="character-heading">
            <div class="avatar-orb" id="avatar-orb">劍</div>
            <div>
              <div class="character-name" id="character-name">Lữ khách</div>
              <div class="character-sect" id="character-sect">Chưa gia nhập môn phái</div>
            </div>
          </div>
          <div class="level-row"><span id="level-label">Cấp 1</span><span id="xp-label">0 / 143 XP</span></div>
          <div class="meter xp-meter"><span id="xp-bar"></span></div>
          <div class="resource-row"><span>HP</span><strong id="hp-label">—</strong></div>
          <div class="meter hp-meter"><span id="hp-bar"></span></div>
          <div class="resource-row"><span>MP</span><strong id="mp-label">—</strong></div>
          <div class="meter mp-meter"><span id="mp-bar"></span></div>
          <div class="stat-grid" id="stat-grid"></div>
          <div class="currency-row"><span><b class="coin-icon">◆</b> <strong id="gold-label">0</strong> bạc</span><span><b class="stone-icon">✦</b> <strong id="stone-label">0</strong> đá</span></div>
        </section>

        <section class="panel quest-panel">
          <div class="section-kicker">NHIỆM VỤ CHÍNH</div>
          <div class="quest-title">Dấu chân trong Rừng Trúc</div>
          <div class="quest-text">Đánh bại 5 sơn tặc, tìm món đồ tốt hơn và hạ Lang Vương.</div>
          <div class="quest-progress"><span id="quest-kill-progress">0 / 5 sơn tặc</span><span id="quest-boss-progress">○ Lang Vương</span></div>
          <div class="quest-reward"><span>Phần thưởng</span><strong>+100 XP · +300 bạc</strong></div>
        </section>

        <section class="panel controls-panel">
          <div class="section-kicker">ĐIỀU KHIỂN</div>
          <div class="controls-grid">
            <span><kbd>WASD</kbd> Di chuyển</span>
            <span><kbd>Click</kbd> Chọn mục tiêu</span>
            <span><kbd>1 2 3</kbd> Võ công</span>
            <span><kbd>E</kbd> Nhặt đồ</span>
            <span><kbd>B</kbd> Túi đồ</span>
            <span><kbd>J</kbd> Nhật ký</span>
          </div>
        </section>
      </aside>

      <section class="game-column">
        <div class="canvas-frame">
          <canvas id="game-canvas" width="960" height="600" aria-label="Bản đồ game Giang Hồ Dị Truyện"></canvas>
          <div class="canvas-badge"><span class="live-dot"></span> RỪNG TRÚC · KÊNH 01</div>
          <div class="canvas-tip" id="canvas-tip">Chọn môn phái để bắt đầu hành trình</div>
        </div>
        <div class="combat-bar">
          <div class="combat-status"><span class="target-dot"></span><span id="combat-status-text">Chưa có mục tiêu</span></div>
          <div class="skill-bar" id="skill-bar"></div>
        </div>
        <div class="log-panel">
          <div class="section-kicker">NHẬT KÝ GIANG HỒ <span>·</span> <span id="log-hint">Mới nhất ở dưới</span></div>
          <div id="log-list" class="log-list"></div>
        </div>
      </section>

      <aside class="right-rail">
        <section class="panel target-panel">
          <div class="section-kicker">MỤC TIÊU</div>
          <div id="target-content" class="target-empty">Click vào quái để chọn mục tiêu</div>
        </section>
        <section class="panel inventory-panel">
          <div class="panel-tabs">
            <button class="tab-button active" data-tab="bag">TÚI ĐỒ <span id="bag-count">0/12</span></button>
            <button class="tab-button" data-tab="smith">THỢ RÈN</button>
          </div>
          <div id="inventory-content"></div>
        </section>
        <section class="panel guild-teaser">
          <div class="section-kicker">GIANG HỒ</div>
          <div class="guild-title">Bang hội đang chờ bạn</div>
          <p>Hoàn thành chương đầu để mở đường tới hệ thống tổ đội và bang hội.</p>
          <button class="outline-button" id="guild-btn">Xem lộ trình bang hội</button>
        </section>
      </aside>
    </main>

    <div class="sect-overlay" id="sect-overlay">
      <div class="sect-dialog">
        <div class="dialog-eyebrow">CHƯƠNG 01 · THANH KHÊ TRẤN</div>
        <h1>Chọn con đường nhập môn</h1>
        <p class="dialog-lead">Mỗi môn phái có nhịp chiến đấu riêng. Bạn có thể thử lại bằng nút Chơi lại.</p>
        <div class="sect-cards" id="sect-cards"></div>
        <div class="dialog-footer"><span>Prototype P2</span><span>WASD · Click · 1 / 2 / 3 · E</span></div>
      </div>
    </div>

    <div class="toast" id="toast" aria-live="polite"></div>
  </div>
`;

const canvasElement = document.querySelector<HTMLCanvasElement>("#game-canvas");
if (!canvasElement) throw new Error("Không tìm thấy game canvas");
const canvas: HTMLCanvasElement = canvasElement;
const context = canvas.getContext("2d");
if (!context) throw new Error("Không khởi tạo được canvas context");
const ctx: CanvasRenderingContext2D = context;

const sectOverlay = document.querySelector<HTMLDivElement>("#sect-overlay")!;
const sectCards = document.querySelector<HTMLDivElement>("#sect-cards")!;
const inventoryContent = document.querySelector<HTMLDivElement>("#inventory-content")!;
const targetContent = document.querySelector<HTMLDivElement>("#target-content")!;
const logList = document.querySelector<HTMLDivElement>("#log-list")!;
const toast = document.querySelector<HTMLDivElement>("#toast")!;
const skillBar = document.querySelector<HTMLDivElement>("#skill-bar")!;
const canvasTip = document.querySelector<HTMLDivElement>("#canvas-tip")!;
const combatStatusText = document.querySelector<HTMLSpanElement>("#combat-status-text")!;
const keys = new Set<string>();
let game: GameState | null = null;
let activeTab: PanelTab = "bag";
let lastFrame = performance.now();
let lastUiUpdate = 0;
let toastTimer = 0;

const obstacles = [
  { x: 50, y: 70, w: 170, h: 78, type: "grove" },
  { x: 520, y: 98, w: 180, h: 54, type: "grove" },
  { x: 920, y: 70, w: 250, h: 76, type: "grove" },
  { x: 1440, y: 110, w: 310, h: 62, type: "grove" },
  { x: 80, y: 720, w: 230, h: 100, type: "grove" },
  { x: 640, y: 830, w: 240, h: 72, type: "grove" },
  { x: 1060, y: 950, w: 330, h: 70, type: "grove" },
  { x: 1550, y: 660, w: 240, h: 125, type: "grove" },
  { x: 410, y: 530, w: 120, h: 110, type: "rock" },
  { x: 1030, y: 300, w: 125, h: 130, type: "rock" },
  { x: 1480, y: 420, w: 150, h: 100, type: "rock" },
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);
const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;
const randomInt = (min: number, max: number) => Math.floor(randomBetween(min, max + 1));
const formatNumber = (value: number) => Math.floor(value).toLocaleString("vi-VN");
const xpToNext = (level: number) => Math.floor(100 + 35 * level + 8 * level * level);
const nowMs = () => performance.now();

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const number = Number.parseInt(clean, 16);
  const red = (number >> 16) & 255;
  const green = (number >> 8) & 255;
  const blue = number & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function itemColor(rarity: Rarity): string {
  return {
    Thường: "#a6b3bd",
    Tốt: "#73d19b",
    Hiếm: "#64b5f6",
    "Cực phẩm": "#cf91ff",
  }[rarity];
}

function itemRarity(): Rarity {
  const roll = Math.random();
  if (roll < 0.02) return "Cực phẩm";
  if (roll < 0.12) return "Hiếm";
  if (roll < 0.43) return "Tốt";
  return "Thường";
}

function itemPower(level: number, rarity: Rarity, slot: ItemSlot): number {
  const rarityMultiplier: Record<Rarity, number> = { Thường: 1, Tốt: 1.18, Hiếm: 1.42, "Cực phẩm": 1.8 };
  const base = slot === "weapon" ? 9 + level * 2.1 : 8 + level * 2.4;
  return Math.floor(base * rarityMultiplier[rarity] + randomBetween(-2, 3));
}

function createItem(level: number, forcedRarity?: Rarity, forcedSlot?: ItemSlot): Item {
  const rarity = forcedRarity ?? itemRarity();
  const slot = forcedSlot ?? (Math.random() > 0.48 ? "weapon" : "armor");
  const names = slot === "weapon" ? ["Kiếm", "Đao", "Phiến", "Trượng"] : ["Áo", "Hộ Tâm", "Bào", "Giáp"];
  const prefix: Record<Rarity, string> = {
    Thường: "Mộc",
    Tốt: "Thanh",
    Hiếm: "Tử Vân",
    "Cực phẩm": "Thiên Cơ",
  };
  const icon = slot === "weapon" ? "⚔" : "◈";
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: `${prefix[rarity]} ${names[randomInt(0, names.length - 1)]}`,
    slot,
    rarity,
    level,
    power: itemPower(level, rarity, slot),
    enhance: 0,
    color: itemColor(rarity),
    icon,
  };
}

function createStarterItem(slot: ItemSlot, sect: SectId): Item {
  const sectName = SECTS[sect].name;
  return {
    id: `starter-${slot}-${sect}`,
    name: slot === "weapon" ? `${sectName} Tân Kiếm` : "Áo Vải Hành Cước",
    slot,
    rarity: "Tốt",
    level: 1,
    power: slot === "weapon" ? 13 : 10,
    enhance: 0,
    color: itemColor("Tốt"),
    icon: slot === "weapon" ? "⚔" : "◈",
  };
}

function createEnemy(
  id: string,
  name: string,
  kind: Enemy["kind"],
  x: number,
  y: number,
  level: number,
  color: string,
): Enemy {
  const scale = kind === "boss" ? 5.4 : kind === "elite" ? 2 : 1;
  return {
    id,
    name,
    kind,
    x,
    y,
    radius: kind === "boss" ? 38 : kind === "elite" ? 25 : 19,
    level,
    hp: Math.floor((65 + level * 22) * scale),
    maxHp: Math.floor((65 + level * 22) * scale),
    attack: Math.floor((8 + level * 2.6) * (kind === "boss" ? 1.6 : kind === "elite" ? 1.2 : 1)),
    defense: Math.floor((3 + level * 1.4) * (kind === "boss" ? 1.3 : 1)),
    speed: kind === "boss" ? 52 : kind === "elite" ? 62 : 70,
    color,
    dead: false,
    respawnAt: 0,
    attackCooldown: randomBetween(0.3, 1.2),
    bossCooldown: 3.5,
    hitFlash: 0,
    defenseDownUntil: 0,
  };
}

function makeEnemies(): Enemy[] {
  return [
    createEnemy("bandit-1", "Sơn tặc trinh sát", "normal", 560, 330, 2, "#c86e66"),
    createEnemy("bandit-2", "Sơn tặc trinh sát", "normal", 690, 430, 2, "#c86e66"),
    createEnemy("bandit-3", "Sơn tặc đao thủ", "normal", 790, 300, 3, "#d88365"),
    createEnemy("bandit-4", "Sơn tặc đao thủ", "normal", 840, 570, 3, "#d88365"),
    createEnemy("bandit-5", "Sơn tặc cung thủ", "normal", 620, 700, 4, "#a86f99"),
    createEnemy("bandit-6", "Sơn tặc cung thủ", "normal", 910, 730, 4, "#a86f99"),
    createEnemy("wolf-1", "Trúc Lang", "normal", 1090, 640, 5, "#7d98a6"),
    createEnemy("wolf-2", "Trúc Lang", "normal", 1220, 520, 5, "#7d98a6"),
    createEnemy("guard-1", "Hắc Phong tinh anh", "elite", 1160, 780, 6, "#d59d4c"),
    createEnemy("lang-vuong", "Lang Vương", "boss", 1510, 780, 8, "#8d5bd1"),
  ];
}

function createGame(sectId: SectId): GameState {
  const sect = SECTS[sectId];
  const player: Player = {
    ...PLAYER_START,
    radius: 18,
    sect: sectId,
    level: 1,
    xp: 0,
    hp: sect.baseHp,
    maxHp: sect.baseHp,
    mp: sect.baseMp,
    maxMp: sect.baseMp,
    attack: sect.baseAttack,
    defense: sect.baseDefense,
    speed: sect.speed,
    rage: 0,
    shield: 0,
    shieldUntil: 0,
    attackCooldown: 0,
    cooldowns: { skill1: 0, skill2: 0, ultimate: 0 },
    inventory: [],
    equipment: {
      weapon: createStarterItem("weapon", sectId),
      armor: createStarterItem("armor", sectId),
    },
    gold: 80,
    refiningStones: 3,
    questKills: 0,
    bossDefeated: false,
    facingX: 1,
    facingY: 0,
  };
  const state: GameState = {
    player,
    enemies: makeEnemies(),
    loot: [],
    telegraphs: [],
    logs: [],
    targetId: null,
    moveTarget: null,
    cameraX: 0,
    cameraY: 0,
    screenFlash: 0,
    lastBossDefeatedAt: 0,
  };
  game = state;
  syncStats(true);
  addLog(`Bạn đã gia nhập ${sect.name}. Con đường võ lâm bắt đầu từ Rừng Trúc.`);
  addLog("Nhiệm vụ đầu: hạ 5 sơn tặc, sau đó khiêu chiến Lang Vương.");
  return state;
}

function addLog(message: string): void {
  if (!game) return;
  game.logs.push(message);
  if (game.logs.length > 7) game.logs.shift();
  showToast(message);
}

function showToast(message: string): void {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2300);
}

function equipmentAttack(): number {
  if (!game) return 0;
  const item = game.player.equipment.weapon;
  return item ? item.power + Math.floor(item.power * item.enhance * 0.04) : 0;
}

function equipmentDefense(): number {
  if (!game) return 0;
  const item = game.player.equipment.armor;
  return item ? item.power + Math.floor(item.power * item.enhance * 0.04) : 0;
}

function effectiveAttack(): number {
  return game ? game.player.attack + equipmentAttack() : 0;
}

function effectiveDefense(): number {
  return game ? game.player.defense + equipmentDefense() : 0;
}

function syncStats(fullHeal = false): void {
  if (!game) return;
  const player = game.player;
  const sect = SECTS[player.sect];
  const oldMaxHp = player.maxHp;
  player.maxHp = sect.baseHp + (player.level - 1) * 34 + Math.floor(equipmentDefense() * 1.45);
  player.maxMp = sect.baseMp + (player.level - 1) * 13;
  if (fullHeal) {
    player.hp = player.maxHp;
    player.mp = player.maxMp;
  } else {
    player.hp = clamp(player.hp + player.maxHp - oldMaxHp, 1, player.maxHp);
    player.mp = clamp(player.mp, 0, player.maxMp);
  }
}

function isBlocked(x: number, y: number, radius: number): boolean {
  if (x - radius < 24 || x + radius > WORLD_WIDTH - 24 || y - radius < 24 || y + radius > WORLD_HEIGHT - 24) return true;
  return obstacles.some((obstacle) => {
    const nearestX = clamp(x, obstacle.x, obstacle.x + obstacle.w);
    const nearestY = clamp(y, obstacle.y, obstacle.y + obstacle.h);
    return Math.hypot(x - nearestX, y - nearestY) < radius;
  });
}

function movePlayer(dx: number, dy: number): void {
  if (!game) return;
  const player = game.player;
  const length = Math.hypot(dx, dy);
  if (length > 0) {
    dx /= length;
    dy /= length;
    player.facingX = dx;
    player.facingY = dy;
  }
  const nextX = player.x + dx;
  const nextY = player.y + dy;
  if (!isBlocked(nextX, player.y, player.radius)) player.x = nextX;
  if (!isBlocked(player.x, nextY, player.radius)) player.y = nextY;
}

function enemyDefense(enemy: Enemy): number {
  return enemy.defenseDownUntil > nowMs() ? Math.floor(enemy.defense * 0.72) : enemy.defense;
}

function currentTarget(): Enemy | undefined {
  if (!game || !game.targetId) return undefined;
  return game.enemies.find((enemy) => enemy.id === game?.targetId && !enemy.dead);
}

function nearestEnemy(maxDistance = Number.POSITIVE_INFINITY): Enemy | undefined {
  if (!game) return undefined;
  let result: Enemy | undefined;
  let best = maxDistance;
  for (const enemy of game.enemies) {
    if (enemy.dead) continue;
    const distanceToPlayer = distance(game.player, enemy);
    if (distanceToPlayer < best) {
      best = distanceToPlayer;
      result = enemy;
    }
  }
  return result;
}

function dealDamage(enemy: Enemy, multiplier: number, source: string): void {
  if (!game || enemy.dead) return;
  const critical = Math.random() < 0.12;
  const raw = effectiveAttack() * multiplier;
  const reduced = Math.max(1, Math.floor(raw * (1 - enemyDefense(enemy) / (enemyDefense(enemy) + 80 + game.player.level * 12))));
  const damage = critical ? Math.floor(reduced * 1.5) : reduced;
  enemy.hp = Math.max(0, enemy.hp - damage);
  enemy.hitFlash = 0.16;
  game.player.rage = clamp(game.player.rage + 7, 0, 100);
  if (critical) addLog(`${source}: chí mạng ${damage} sát thương.`);
  if (enemy.hp <= 0) killEnemy(enemy);
}

function dealAreaDamage(x: number, y: number, radius: number, multiplier: number, source: string): void {
  if (!game) return;
  const targets = game.enemies.filter((enemy) => !enemy.dead && distance({ x, y }, enemy) <= radius + enemy.radius);
  if (targets.length === 0) {
    addLog(`${source} không đánh trúng mục tiêu nào.`);
    return;
  }
  for (const target of targets) dealDamage(target, multiplier, source);
}

function playerBasicAttack(): void {
  if (!game || game.player.attackCooldown > 0) return;
  const target = currentTarget();
  if (!target) return;
  const range = 95 + game.player.radius + target.radius;
  if (distance(game.player, target) > range) return;
  game.player.attackCooldown = 0.62;
  dealDamage(target, 1, "Đánh thường");
}

function castSkill(skill: "skill1" | "skill2" | "ultimate"): void {
  if (!game) return;
  const player = game.player;
  const sect = SECTS[player.sect];
  if (skill === "ultimate") {
    if (player.level < 5) {
      addLog("Tuyệt chiêu mở ở cấp 5.");
      return;
    }
    if (player.rage < 100) {
      addLog("Chưa đủ nộ để thi triển tuyệt chiêu.");
      return;
    }
    if (player.cooldowns.ultimate > 0) return;
    player.rage = 0;
    player.cooldowns.ultimate = 15;
    if (player.sect === "kim") dealAreaDamage(player.x, player.y, 210, 3.1, sect.ultimate);
    if (player.sect === "hoa") {
      const target = currentTarget() ?? nearestEnemy(440);
      if (target) dealAreaDamage(target.x, target.y, 180, 3.35, sect.ultimate);
    }
    if (player.sect === "thuy") {
      dealAreaDamage(player.x, player.y, 180, 1.55, sect.ultimate);
      player.hp = clamp(player.hp + Math.floor(player.maxHp * 0.38), 0, player.maxHp);
    }
    game.screenFlash = 0.35;
    addLog(`${sect.ultimate} đã được thi triển.`);
    return;
  }
  if (player.cooldowns[skill] > 0) return;
  if (skill === "skill2" && player.level < 3) {
    addLog("Chiêu thứ hai mở ở cấp 3.");
    return;
  }
  const target = currentTarget() ?? nearestEnemy(360);
  if (skill === "skill1") {
    player.cooldowns.skill1 = 4;
    if (player.sect === "kim") {
      if (!target || distance(player, target) > 155) return addLog("Phá Giáp Trảm cần một mục tiêu trong tầm.");
      target.defenseDownUntil = nowMs() + 4000;
      dealDamage(target, 1.75, sect.skills[0]);
    } else if (player.sect === "hoa") {
      if (!target) return addLog("Chưa có mục tiêu để phóng hỏa cầu.");
      dealAreaDamage(target.x, target.y, 105, 1.35, sect.skills[0]);
    } else {
      const heal = Math.floor(player.maxHp * 0.22);
      player.hp = clamp(player.hp + heal, 0, player.maxHp);
      if (target && distance(player, target) <= 160) dealDamage(target, 0.82, sect.skills[0]);
      addLog(`${sect.skills[0]} hồi ${heal} HP.`);
    }
    player.rage = clamp(player.rage + 10, 0, 100);
  } else {
    player.cooldowns.skill2 = 7;
    if (player.sect === "kim") {
      if (!target || distance(player, target) > 285) return addLog("Phi Kiếm Bộ cần một mục tiêu trong tầm.");
      const angle = Math.atan2(player.y - target.y, player.x - target.x);
      const dashX = target.x + Math.cos(angle) * 58;
      const dashY = target.y + Math.sin(angle) * 58;
      if (!isBlocked(dashX, dashY, player.radius)) {
        player.x = dashX;
        player.y = dashY;
      }
      dealDamage(target, 1.4, sect.skills[1]);
    } else if (player.sect === "hoa") {
      dealAreaDamage(player.x, player.y, 135, 1.2, sect.skills[1]);
    } else {
      player.shield = Math.floor(player.maxHp * 0.28);
      player.shieldUntil = nowMs() + 5000;
      if (target && distance(player, target) <= 150) dealDamage(target, 0.95, sect.skills[1]);
      addLog(`${sect.skills[1]} tạo khiên ${player.shield} điểm trong 5 giây.`);
    }
    player.rage = clamp(player.rage + 14, 0, 100);
  }
}

function rewardExperience(amount: number): void {
  if (!game) return;
  const player = game.player;
  player.xp += amount;
  let leveled = false;
  while (player.xp >= xpToNext(player.level) && player.level < 30) {
    player.xp -= xpToNext(player.level);
    player.level += 1;
    leveled = true;
    player.attack += 3;
    player.defense += 2;
    player.maxHp += 34;
    player.maxMp += 13;
  }
  if (leveled) {
    syncStats(true);
    addLog(`Bạn đã đạt cấp ${player.level}. Chỉ số được tăng và hồi đầy sinh lực.`);
    if (player.level === 3) addLog(`Đã mở ${SECTS[player.sect].skills[1]} — nhấn phím 2.`);
    if (player.level === 5) addLog(`Đã mở tuyệt chiêu ${SECTS[player.sect].ultimate} — tích đủ 100 nộ rồi nhấn phím 3.`);
  }
}

function killEnemy(enemy: Enemy): void {
  if (!game || enemy.dead) return;
  enemy.dead = true;
  enemy.respawnAt = enemy.kind === "boss" ? Number.POSITIVE_INFINITY : nowMs() + 8000;
  const player = game.player;
  const xp = enemy.kind === "boss" ? 520 : enemy.kind === "elite" ? 150 : 42 + enemy.level * 8;
  rewardExperience(xp);
  if (enemy.kind !== "boss") player.questKills += 1;
  if (game.targetId === enemy.id) game.targetId = null;
  if (enemy.kind === "boss") {
    player.bossDefeated = true;
    game.lastBossDefeatedAt = nowMs();
    addLog("Lang Vương đã gục ngã! Bạn nhận được phần thưởng Cực phẩm.");
  } else {
    addLog(`${enemy.name} bị đánh bại. +${xp} XP.`);
  }
  const chance = enemy.kind === "boss" ? 1 : enemy.kind === "elite" ? 0.92 : 0.32;
  if (Math.random() <= chance) {
    const forced = enemy.kind === "boss" ? "Cực phẩm" : enemy.kind === "elite" ? "Hiếm" : undefined;
    game.loot.push({
      id: `loot-${enemy.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      x: enemy.x + randomBetween(-12, 12),
      y: enemy.y + randomBetween(-12, 12),
      item: createItem(Math.max(1, enemy.level), forced),
      gold: enemy.kind === "boss" ? 300 : enemy.kind === "elite" ? 90 : randomInt(8, 22),
      stones: enemy.kind === "boss" ? 5 : enemy.kind === "elite" ? 2 : 0,
      expiresAt: nowMs() + (enemy.kind === "boss" ? 240000 : 90000),
    });
  } else {
    game.loot.push({
      id: `loot-gold-${enemy.id}-${Date.now()}`,
      x: enemy.x,
      y: enemy.y,
      gold: enemy.kind === "elite" ? 60 : randomInt(5, 15),
      stones: enemy.kind === "elite" ? 1 : 0,
      expiresAt: nowMs() + 90000,
    });
  }
}

function damagePlayer(amount: number, source: string): void {
  if (!game) return;
  const player = game.player;
  let remaining = Math.max(1, Math.floor(amount * (1 - effectiveDefense() / (effectiveDefense() + 100 + player.level * 12))));
  if (player.shieldUntil > nowMs() && player.shield > 0) {
    const blocked = Math.min(player.shield, remaining);
    player.shield -= blocked;
    remaining -= blocked;
  }
  if (remaining > 0) player.hp = Math.max(0, player.hp - remaining);
  player.rage = clamp(player.rage + 5, 0, 100);
  if (remaining > 0) addLog(`${source} gây ${remaining} sát thương.`);
  if (player.hp <= 0) {
    player.x = PLAYER_START.x;
    player.y = PLAYER_START.y;
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    player.rage = 0;
    game.targetId = null;
    game.telegraphs = [];
    addLog("Bạn đã ngã xuống và được đưa về điểm hồi sinh. Không mất trang bị.");
  }
}

function pickupNearby(): void {
  if (!game) return;
  const player = game.player;
  const nearby = game.loot.filter((loot) => distance(player, loot) <= 82);
  if (nearby.length === 0) {
    addLog("Không có vật phẩm nào trong tầm nhặt.");
    return;
  }
  let picked = 0;
  for (const loot of nearby) {
    if (loot.item && player.inventory.length >= 12) {
      addLog("Túi đồ đã đầy. Hãy mặc, bán hoặc cường hóa đồ trước.");
      break;
    }
    if (loot.item) {
      player.inventory.push(loot.item);
      addLog(`Nhặt được ${loot.item.name} [${loot.item.rarity}].`);
    }
    if (loot.gold > 0) player.gold += loot.gold;
    if (loot.stones > 0) player.refiningStones += loot.stones;
    if (loot.gold > 0 || loot.stones > 0) addLog(`+${loot.gold} bạc${loot.stones ? ` · +${loot.stones} đá` : ""}.`);
    game.loot = game.loot.filter((candidate) => candidate.id !== loot.id);
    picked += 1;
  }
  if (picked > 0) refreshUi(true);
}

function equipItem(index: number): void {
  if (!game) return;
  const item = game.player.inventory[index];
  if (!item) return;
  const old = game.player.equipment[item.slot];
  game.player.equipment[item.slot] = item;
  game.player.inventory.splice(index, 1);
  if (old) game.player.inventory.push(old);
  syncStats();
  addLog(`Đã mặc ${item.name}. Sức mạnh nhân vật được cập nhật.`);
  refreshUi(true);
}

function enhanceItem(index: number, equippedSlot?: ItemSlot): void {
  if (!game) return;
  const item = equippedSlot ? game.player.equipment[equippedSlot] : game.player.inventory[index];
  if (!item) return;
  if (item.enhance >= 10) return addLog(`${item.name} đã đạt giới hạn +10 của prototype.`);
  const cost = 45 + item.enhance * 35;
  if (game.player.gold < cost || game.player.refiningStones < 1) {
    addLog(`Cần ${cost} bạc và 1 đá tinh luyện để cường hóa.`);
    return;
  }
  game.player.gold -= cost;
  game.player.refiningStones -= 1;
  const chance = item.enhance < 3 ? 1 : item.enhance < 6 ? 0.78 : item.enhance < 8 ? 0.58 : 0.42;
  if (Math.random() <= chance) {
    item.enhance += 1;
    syncStats();
    addLog(`Cường hóa thành công: ${item.name} +${item.enhance}.`);
  } else {
    addLog(`Cường hóa thất bại: ${item.name} vẫn ở +${item.enhance}.`);
  }
  refreshUi(true);
}

function saveGame(): void {
  if (!game) return addLog("Hãy chọn môn phái trước khi lưu.");
  const snapshot = {
    player: game.player,
    enemies: game.enemies.map((enemy) => ({ ...enemy, dead: false, respawnAt: 0 })),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
  addLog("Đã lưu tiến trình vào trình duyệt này.");
}

function loadGame(): void {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return showToast("Chưa có tiến trình nào được lưu.");
  try {
    const snapshot = JSON.parse(raw) as { player: Player; enemies: Enemy[] };
    if (!snapshot.player || !SECTS[snapshot.player.sect]) throw new Error("save-invalid");
    game = {
      player: snapshot.player,
      enemies: makeEnemies(),
      loot: [],
      telegraphs: [],
      logs: [],
      targetId: null,
      moveTarget: null,
      cameraX: 0,
      cameraY: 0,
      screenFlash: 0,
      lastBossDefeatedAt: 0,
    };
    syncStats();
    sectOverlay.classList.add("hidden");
    addLog("Đã tải tiến trình. Hãy tiếp tục hành trình tại Rừng Trúc.");
    refreshUi(true);
  } catch {
    showToast("Tiến trình lưu bị lỗi hoặc không tương thích.");
  }
}

function resetGame(): void {
  game = null;
  sectOverlay.classList.remove("hidden");
  canvasTip.textContent = "Chọn môn phái để bắt đầu hành trình";
  refreshUi(true);
}

function openGuildRoadmap(): void {
  addLog("Bang hội sẽ mở ở giai đoạn P7: tạo bang, gia nhập, đóng góp và boss bang.");
  showToast("Hệ thống bang hội đang nằm trong lộ trình V1.");
}

function screenToWorld(event: MouseEvent): { x: number; y: number } {
  if (!game) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH + game.cameraX;
  const y = ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT + game.cameraY;
  return { x, y };
}

function selectAt(world: { x: number; y: number }): void {
  if (!game) return;
  const hit = game.enemies.find((enemy) => !enemy.dead && distance(world, enemy) <= enemy.radius + 28);
  if (hit) {
    game.targetId = hit.id;
    game.moveTarget = null;
    addLog(`Mục tiêu: ${hit.name}.`);
  } else {
    game.targetId = null;
    game.moveTarget = { x: clamp(world.x, 40, WORLD_WIDTH - 40), y: clamp(world.y, 40, WORLD_HEIGHT - 40) };
  }
}

function update(dt: number, now: number): void {
  if (!game) return;
  const player = game.player;
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.cooldowns.skill1 = Math.max(0, player.cooldowns.skill1 - dt);
  player.cooldowns.skill2 = Math.max(0, player.cooldowns.skill2 - dt);
  player.cooldowns.ultimate = Math.max(0, player.cooldowns.ultimate - dt);
  if (player.shieldUntil <= now) player.shield = 0;
  player.rage = clamp(player.rage + dt * 1.1, 0, 100);

  const inputX = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
  const inputY = (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0);
  if (inputX !== 0 || inputY !== 0) {
    game.moveTarget = null;
    movePlayer(inputX * player.speed * dt, inputY * player.speed * dt);
  } else if (game.moveTarget) {
    const d = distance(player, game.moveTarget);
    if (d < 8) game.moveTarget = null;
    else movePlayer(((game.moveTarget.x - player.x) / d) * player.speed * dt, ((game.moveTarget.y - player.y) / d) * player.speed * dt);
  } else {
    const target = currentTarget();
    if (target) {
      const d = distance(player, target);
      if (d > 88) movePlayer(((target.x - player.x) / d) * player.speed * dt, ((target.y - player.y) / d) * player.speed * dt);
      else playerBasicAttack();
    }
  }

  for (const enemy of game.enemies) {
    if (enemy.dead) {
      if (now >= enemy.respawnAt && enemy.kind !== "boss") {
        enemy.dead = false;
        enemy.hp = enemy.maxHp;
        enemy.attackCooldown = 1;
        enemy.x += randomBetween(-22, 22);
        enemy.y += randomBetween(-22, 22);
      }
      continue;
    }
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    const d = distance(enemy, player);
    if (enemy.kind === "boss") {
      enemy.bossCooldown -= dt;
      if (d < 520 && enemy.bossCooldown <= 0) {
        game.telegraphs.push({ x: player.x, y: player.y, radius: 92, triggerAt: now + 950, damage: enemy.attack * 1.4, label: "Lang Vương · Liệt Trảo" });
        enemy.bossCooldown = 4.4;
      }
      if (d > 175 && d < 550) {
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        const nextX = enemy.x + Math.cos(angle) * enemy.speed * dt;
        const nextY = enemy.y + Math.sin(angle) * enemy.speed * dt;
        if (!isBlocked(nextX, enemy.y, enemy.radius)) enemy.x = nextX;
        if (!isBlocked(enemy.x, nextY, enemy.radius)) enemy.y = nextY;
      }
    } else if (d < 330) {
      if (d > 54) {
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        const nextX = enemy.x + Math.cos(angle) * enemy.speed * dt;
        const nextY = enemy.y + Math.sin(angle) * enemy.speed * dt;
        if (!isBlocked(nextX, enemy.y, enemy.radius)) enemy.x = nextX;
        if (!isBlocked(enemy.x, nextY, enemy.radius)) enemy.y = nextY;
      } else {
        enemy.attackCooldown -= dt;
        if (enemy.attackCooldown <= 0) {
          enemy.attackCooldown = enemy.kind === "elite" ? 1.2 : 1.55;
          damagePlayer(enemy.attack, enemy.name);
        }
      }
    }
  }

  const remainingTelegraphs: Telegraph[] = [];
  for (const telegraph of game.telegraphs) {
    if (now >= telegraph.triggerAt) {
      if (distance(player, telegraph) <= telegraph.radius + player.radius) damagePlayer(telegraph.damage, telegraph.label);
    } else remainingTelegraphs.push(telegraph);
  }
  game.telegraphs = remainingTelegraphs;
  game.loot = game.loot.filter((loot) => loot.expiresAt > now);
  game.cameraX = clamp(player.x - VIEW_WIDTH / 2, 0, WORLD_WIDTH - VIEW_WIDTH);
  game.cameraY = clamp(player.y - VIEW_HEIGHT / 2, 0, WORLD_HEIGHT - VIEW_HEIGHT);
  game.screenFlash = Math.max(0, game.screenFlash - dt);
}

function drawRoundedRect(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number): void {
  const r = Math.min(radius, w / 2, h / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}

function drawBar(x: number, y: number, width: number, height: number, ratio: number, color: string, background = "rgba(0,0,0,.48)"): void {
  ctx.fillStyle = background;
  drawRoundedRect(ctx, x, y, width, height, height / 2);
  ctx.fill();
  if (ratio > 0) {
    ctx.fillStyle = color;
    drawRoundedRect(ctx, x, y, width * clamp(ratio, 0, 1), height, height / 2);
    ctx.fill();
  }
}

function drawWorld(now: number): void {
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  if (!game) {
    ctx.fillStyle = "#091522";
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    return;
  }
  const { player } = game;
  ctx.save();
  ctx.translate(-game.cameraX, -game.cameraY);
  ctx.fillStyle = "#183936";
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  ctx.fillStyle = "rgba(255,255,255,.025)";
  for (let x = 0; x < WORLD_WIDTH; x += 32) ctx.fillRect(x, 0, 1, WORLD_HEIGHT);
  for (let y = 0; y < WORLD_HEIGHT; y += 32) ctx.fillRect(0, y, WORLD_WIDTH, 1);
  ctx.fillStyle = "#224b40";
  ctx.fillRect(245, 230, 230, 300);
  ctx.fillRect(1190, 250, 180, 270);
  ctx.fillStyle = "rgba(198, 155, 91, .21)";
  ctx.fillRect(242, 480, 1180, 48);
  ctx.fillRect(360, 330, 48, 560);
  ctx.fillStyle = "rgba(111, 198, 189, .13)";
  ctx.beginPath();
  ctx.arc(1670, 920, 190, 0, Math.PI * 2);
  ctx.fill();

  for (const obstacle of obstacles) {
    if (obstacle.type === "rock") {
      ctx.fillStyle = "#415e60";
      drawRoundedRect(ctx, obstacle.x, obstacle.y, obstacle.w, obstacle.h, 18);
      ctx.fill();
      ctx.fillStyle = "rgba(211,238,221,.14)";
      drawRoundedRect(ctx, obstacle.x + 12, obstacle.y + 10, obstacle.w * 0.45, 12, 6);
      ctx.fill();
    } else {
      for (let x = obstacle.x + 24; x < obstacle.x + obstacle.w; x += 38) {
        for (let y = obstacle.y + 25; y < obstacle.y + obstacle.h; y += 38) {
          ctx.fillStyle = "#1b5a43";
          ctx.beginPath();
          ctx.arc(x, y, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#2c7753";
          ctx.beginPath();
          ctx.arc(x - 6, y - 7, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#6a4933";
          ctx.fillRect(x - 3, y + 12, 6, 13);
        }
      }
    }
  }

  ctx.fillStyle = "#cfb374";
  ctx.font = "600 14px 'DM Sans', sans-serif";
  ctx.fillText("THANH KHÊ TRẤN", 268, 260);
  ctx.fillStyle = "rgba(222, 239, 220, .55)";
  ctx.font = "12px 'DM Sans', sans-serif";
  ctx.fillText("Cổng phía đông · Lang Vương", 1320, 1030);

  for (const loot of game.loot) drawLoot(loot, now);
  for (const enemy of game.enemies) if (!enemy.dead) drawEnemy(enemy, now);
  drawPlayer(player, now);
  for (const telegraph of game.telegraphs) drawTelegraph(telegraph, now);
  if (game.moveTarget) {
    ctx.strokeStyle = "rgba(255,246,185,.75)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(game.moveTarget.x, game.moveTarget.y, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();

  const vignette = ctx.createRadialGradient(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 130, VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 520);
  vignette.addColorStop(0, "rgba(4, 12, 16, 0)");
  vignette.addColorStop(1, "rgba(4, 12, 16, .46)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  if (game.screenFlash > 0) {
    ctx.fillStyle = `rgba(255, 225, 160, ${game.screenFlash * 0.5})`;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  }
}

function drawTelegraph(telegraph: Telegraph, now: number): void {
  const remaining = clamp((telegraph.triggerAt - now) / 950, 0, 1);
  ctx.fillStyle = `rgba(255, 85, 91, ${0.13 + (1 - remaining) * 0.14})`;
  ctx.beginPath();
  ctx.arc(telegraph.x, telegraph.y, telegraph.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ff7872";
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(telegraph.x, telegraph.y, telegraph.radius * (1.02 - remaining * 0.14), 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#ffd8c7";
  ctx.font = "700 12px 'DM Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("NÉ!", telegraph.x, telegraph.y + 4);
  ctx.textAlign = "left";
}

function drawLoot(loot: GroundLoot, now: number): void {
  const pulse = 1 + Math.sin(now / 170) * 0.08;
  ctx.save();
  ctx.translate(loot.x, loot.y);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = loot.item ? hexToRgba(loot.item.color, 0.24) : "rgba(246, 198, 92, .22)";
  ctx.beginPath();
  ctx.arc(0, 0, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = loot.item?.color ?? "#f6c65c";
  ctx.font = "700 18px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(loot.item?.icon ?? "◆", 0, 6);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawEnemy(enemy: Enemy, now: number): void {
  const target = game?.targetId === enemy.id;
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.beginPath();
  ctx.ellipse(0, enemy.radius * 0.74, enemy.radius * 0.95, enemy.radius * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  if (target) {
    ctx.strokeStyle = "#ffd977";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius + 8 + Math.sin(now / 160) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = enemy.hitFlash > 0 ? "#fff5df" : enemy.color;
  ctx.beginPath();
  ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(10, 15, 23, .72)";
  ctx.beginPath();
  ctx.arc(-enemy.radius * 0.32, -enemy.radius * 0.12, enemy.radius * 0.12, 0, Math.PI * 2);
  ctx.arc(enemy.radius * 0.32, -enemy.radius * 0.12, enemy.radius * 0.12, 0, Math.PI * 2);
  ctx.fill();
  if (enemy.kind === "boss") {
    ctx.strokeStyle = "#e9c875";
    ctx.lineWidth = 2;
    ctx.strokeRect(-19, -enemy.radius - 12, 38, 12);
    ctx.fillStyle = "#e9c875";
    ctx.beginPath();
    ctx.moveTo(-17, -enemy.radius - 12);
    ctx.lineTo(-11, -enemy.radius - 23);
    ctx.lineTo(-3, -enemy.radius - 12);
    ctx.lineTo(4, -enemy.radius - 23);
    ctx.lineTo(13, -enemy.radius - 12);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  const barWidth = enemy.kind === "boss" ? 160 : enemy.kind === "elite" ? 84 : 62;
  drawBar(enemy.x - barWidth / 2, enemy.y - enemy.radius - 23, barWidth, enemy.kind === "boss" ? 8 : 5, enemy.hp / enemy.maxHp, enemy.kind === "boss" ? "#dd6c79" : "#a6d36c");
  ctx.fillStyle = enemy.kind === "boss" ? "#ffe0a1" : "#d4e1d3";
  ctx.font = `${enemy.kind === "boss" ? 700 : 600} ${enemy.kind === "boss" ? 13 : 11}px 'DM Sans', sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(`${enemy.name} · Cấp ${enemy.level}`, enemy.x, enemy.y - enemy.radius - 30);
  ctx.textAlign = "left";
}

function drawPlayer(player: Player, now: number): void {
  const sect = SECTS[player.sect];
  ctx.save();
  ctx.translate(player.x, player.y);
  const bob = Math.sin(now / 170) * 1.5;
  ctx.translate(0, bob);
  ctx.fillStyle = "rgba(0,0,0,.32)";
  ctx.beginPath();
  ctx.ellipse(0, 17, 21, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = sect.color;
  ctx.beginPath();
  ctx.moveTo(0, -21);
  ctx.lineTo(15, -5);
  ctx.lineTo(14, 17);
  ctx.lineTo(-14, 17);
  ctx.lineTo(-15, -5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f0c5a4";
  ctx.beginPath();
  ctx.arc(0, -12, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#202538";
  ctx.beginPath();
  ctx.arc(0, -15, 10, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = sect.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(player.facingX * 22, 2 + player.facingY * 22);
  ctx.stroke();
  if (player.shieldUntil > now && player.shield > 0) {
    ctx.strokeStyle = hexToRgba(sect.accent, 0.7);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 29 + Math.sin(now / 120) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  drawBar(player.x - 25, player.y - 42, 50, 5, player.hp / player.maxHp, "#66db9c");
  ctx.fillStyle = "#e8eff1";
  ctx.font = "700 11px 'DM Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`Bạn · Cấp ${player.level}`, player.x, player.y - 49);
  ctx.textAlign = "left";
}

function refreshUi(force = false): void {
  if (!game) {
    document.querySelector("#character-name")!.textContent = "Lữ khách";
    document.querySelector("#character-sect")!.textContent = "Chưa gia nhập môn phái";
    return;
  }
  if (!force && performance.now() - lastUiUpdate < 120) return;
  lastUiUpdate = performance.now();
  const player = game.player;
  const sect = SECTS[player.sect];
  const target = currentTarget();
  const setText = (selector: string, value: string) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  };
  setText("#character-name", "Tân nhân giang hồ");
  setText("#character-sect", `${sect.name} · ${sect.title}`);
  setText("#level-label", `Cấp ${player.level}`);
  setText("#xp-label", `${formatNumber(player.xp)} / ${formatNumber(xpToNext(player.level))} XP`);
  setText("#hp-label", `${formatNumber(player.hp)} / ${formatNumber(player.maxHp)}`);
  setText("#mp-label", `${formatNumber(player.mp)} / ${formatNumber(player.maxMp)}`);
  setText("#gold-label", formatNumber(player.gold));
  setText("#stone-label", formatNumber(player.refiningStones));
  setText("#quest-kill-progress", `${Math.min(player.questKills, 5)} / 5 sơn tặc`);
  setText("#quest-boss-progress", `${player.bossDefeated ? "✓" : "○"} Lang Vương`);
  setText("#bag-count", `${player.inventory.length}/12`);
  const avatar = document.querySelector<HTMLElement>("#avatar-orb");
  if (avatar) {
    avatar.textContent = player.sect === "kim" ? "劍" : player.sect === "hoa" ? "炎" : "水";
    avatar.style.background = `linear-gradient(135deg, ${hexToRgba(sect.color, 0.6)}, #142434)`;
  }
  const bars: Record<string, string> = {
    "#xp-bar": `${(player.xp / xpToNext(player.level)) * 100}%`,
    "#hp-bar": `${(player.hp / player.maxHp) * 100}%`,
    "#mp-bar": `${(player.mp / player.maxMp) * 100}%`,
  };
  for (const [selector, width] of Object.entries(bars)) {
    const bar = document.querySelector<HTMLElement>(selector);
    if (bar) bar.style.width = width;
  }
  const statGrid = document.querySelector<HTMLDivElement>("#stat-grid")!;
  statGrid.innerHTML = `
    <div><span>CÔNG</span><strong>${formatNumber(effectiveAttack())}</strong></div>
    <div><span>PHÒNG</span><strong>${formatNumber(effectiveDefense())}</strong></div>
    <div><span>NỘ</span><strong>${formatNumber(player.rage)}%</strong></div>
    <div><span>TỐC</span><strong>${formatNumber(player.speed)}</strong></div>
  `;
  if (target) {
    const status = target.kind === "boss" ? "BOSS · CƠ CHẾ ĐANG HOẠT ĐỘNG" : target.kind === "elite" ? "TINH ANH" : "ĐANG GIAO CHIẾN";
    targetContent.innerHTML = `
      <div class="target-heading"><div class="target-orb" style="--target-color:${target.color}"></div><div><strong>${escapeHtml(target.name)}</strong><span>${status} · Cấp ${target.level}</span></div></div>
      <div class="target-hp-row"><span>HP</span><strong>${formatNumber(target.hp)} / ${formatNumber(target.maxHp)}</strong></div>
      <div class="meter enemy-meter"><span style="width:${(target.hp / target.maxHp) * 100}%"></span></div>
      <div class="target-meta"><span>Phòng ${target.defense}</span><span>Khoảng cách ${Math.floor(distance(player, target))}</span></div>
    `;
    combatStatusText.textContent = `${target.name} · ${Math.floor(target.hp)} HP`;
  } else {
    targetContent.innerHTML = `<div class="target-empty">Click vào quái để chọn mục tiêu</div>`;
    combatStatusText.textContent = "Chưa có mục tiêu";
  }
  renderSkillBar();
  renderInventory();
  logList.innerHTML = game.logs.map((log) => `<div class="log-entry"><span>›</span>${escapeHtml(log)}</div>`).join("");
}

function renderSkillBar(): void {
  if (!game) {
    skillBar.innerHTML = "";
    return;
  }
  const player = game.player;
  const sect = SECTS[player.sect];
  const skillData = [
    { key: "skill1" as const, number: "1", name: sect.skills[0], icon: sect.id === "kim" ? "✧" : sect.id === "hoa" ? "☄" : "❄" },
    { key: "skill2" as const, number: "2", name: sect.skills[1], icon: sect.id === "kim" ? "➶" : sect.id === "hoa" ? "◉" : "◌" },
    { key: "ultimate" as const, number: "3", name: sect.ultimate, icon: "✦" },
  ];
  skillBar.innerHTML = skillData.map((skill) => {
    const locked = skill.key === "skill2" && player.level < 3 || skill.key === "ultimate" && player.level < 5;
    const cooldown = player.cooldowns[skill.key];
    const coolText = locked ? "KHÓA" : cooldown > 0 ? `${cooldown.toFixed(1)}s` : skill.key === "ultimate" ? `${Math.floor(player.rage)}% nộ` : "SẴN SÀNG";
    return `<button class="skill-button ${locked ? "locked" : ""}" data-skill="${skill.key}" title="${skill.name}"><span class="skill-number">${skill.number}</span><span class="skill-icon" style="color:${sect.color}">${skill.icon}</span><span class="skill-name">${skill.name}</span><span class="skill-cooldown">${coolText}</span></button>`;
  }).join("");
}

function itemRow(item: Item, index: number, equipped = false): string {
  const statLabel = item.slot === "weapon" ? `+${item.power} công` : `+${item.power} phòng`;
  const enhanceButton = `<button class="mini-button enhance-btn" data-index="${index}" ${equipped ? `data-equipped="${item.slot}"` : ""}>+ Cường hóa</button>`;
  const equipButton = equipped ? "" : `<button class="mini-button equip-btn" data-index="${index}">Mặc đồ</button>`;
  return `<div class="item-row" style="--rarity-color:${item.color}"><div class="item-icon">${item.icon}</div><div class="item-copy"><strong>${escapeHtml(item.name)} ${item.enhance ? `+${item.enhance}` : ""}</strong><span>${item.rarity} · Cấp ${item.level} · ${statLabel}</span></div><div class="item-actions">${equipButton}${enhanceButton}</div></div>`;
}

function renderInventory(): void {
  if (!game) {
    inventoryContent.innerHTML = `<div class="empty-state">Chọn môn phái để mở túi đồ.</div>`;
    return;
  }
  const player = game.player;
  document.querySelectorAll<HTMLButtonElement>(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === activeTab);
  });
  if (activeTab === "smith") {
    const equipment = (["weapon", "armor"] as ItemSlot[]).map((slot) => player.equipment[slot] ? itemRow(player.equipment[slot]!, 0, true) : "").join("");
    inventoryContent.innerHTML = `
      <div class="smith-intro"><span class="smith-icon">⚒</span><div><strong>Lò rèn Rừng Trúc</strong><p>Dùng bạc và đá tinh luyện. Thất bại không làm mất cấp.</p></div></div>
      <div class="resource-hint"><span>Chi phí hiện tại phụ thuộc cấp cường hóa</span><b>${player.refiningStones} đá · ${player.gold} bạc</b></div>
      <div class="item-list smith-list">${equipment}</div>
    `;
    return;
  }
  const equipped = (["weapon", "armor"] as ItemSlot[]).map((slot) => {
    const item = player.equipment[slot];
    if (!item) return `<div class="equipped-empty">${slot === "weapon" ? "Vũ khí" : "Áo giáp"}: trống</div>`;
    return `<div class="equipped-label">${slot === "weapon" ? "VŨ KHÍ ĐANG DÙNG" : "HỘ GIÁP ĐANG DÙNG"}</div>${itemRow(item, 0, true)}`;
  }).join("");
  const bag = player.inventory.map((item, index) => itemRow(item, index)).join("");
  inventoryContent.innerHTML = `
    <div class="equipped-block">${equipped}</div>
    <div class="equipped-label bag-label">ĐỒ NHẶT ĐƯỢC</div>
    <div class="item-list">${bag || `<div class="empty-state">Hạ quái để tìm trang bị rơi dưới đất.</div>`}</div>
  `;
}

function startGame(sect: SectId): void {
  createGame(sect);
  sectOverlay.classList.add("hidden");
  canvasTip.textContent = "Click quái để áp sát · E để nhặt đồ quanh bạn";
  refreshUi(true);
}

function renderSectCards(): void {
  sectCards.innerHTML = Object.values(SECTS).map((sect) => `
    <button class="sect-card" data-sect="${sect.id}" style="--sect-color:${sect.color};--sect-accent:${sect.accent}">
      <span class="sect-card-top"><span class="sect-emblem">${sect.id === "kim" ? "劍" : sect.id === "hoa" ? "炎" : "水"}</span><span class="sect-role">${sect.title}</span></span>
      <strong>${sect.name}</strong>
      <span class="sect-description">${sect.description}</span>
      <span class="sect-skills"><b>1</b> ${sect.skills[0]} <b>2</b> ${sect.skills[1]}</span>
      <span class="sect-select">Gia nhập môn phái <span>→</span></span>
    </button>
  `).join("");
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
    event.preventDefault();
    keys.add(key);
  }
  if (event.repeat || !game) return;
  if (key === "1") castSkill("skill1");
  if (key === "2") castSkill("skill2");
  if (key === "3") castSkill("ultimate");
  if (key === "e") pickupNearby();
  if (key === "b") {
    activeTab = "bag";
    document.querySelector(".inventory-panel")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    refreshUi(true);
  }
  if (key === "j") {
    document.querySelector(".log-panel")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    showToast("Nhật ký nhiệm vụ đang hiển thị bên dưới bản đồ.");
  }
});

document.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

canvas.addEventListener("click", (event) => selectAt(screenToWorld(event)));

sectCards.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-sect]");
  const sect = button?.dataset.sect as SectId | undefined;
  if (sect && SECTS[sect]) startGame(sect);
});

inventoryContent.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const equipButton = target.closest<HTMLButtonElement>(".equip-btn");
  const enhanceButton = target.closest<HTMLButtonElement>(".enhance-btn");
  if (equipButton) equipItem(Number(equipButton.dataset.index));
  if (enhanceButton) enhanceItem(Number(enhanceButton.dataset.index), enhanceButton.dataset.equipped as ItemSlot | undefined);
});

document.querySelectorAll<HTMLButtonElement>(".tab-button").forEach((button) => {
  button.addEventListener("click", () => {
    activeTab = button.dataset.tab as PanelTab;
    refreshUi(true);
  });
});

document.querySelector<HTMLButtonElement>("#save-btn")!.addEventListener("click", saveGame);
document.querySelector<HTMLButtonElement>("#load-btn")!.addEventListener("click", loadGame);
document.querySelector<HTMLButtonElement>("#reset-btn")!.addEventListener("click", resetGame);
document.querySelector<HTMLButtonElement>("#guild-btn")!.addEventListener("click", openGuildRoadmap);

renderSectCards();
refreshUi(true);

function frame(now: number): void {
  const dt = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  update(dt, now);
  drawWorld(now);
  refreshUi();
  window.requestAnimationFrame(frame);
}

window.requestAnimationFrame(frame);
