import "./style.css";
import { OnlineClient, type OnlineSnapshot, type OnlineStatus } from "./online";
import { drawSprite, spriteMarkup, type SpriteId } from "./art";
import { createMapArt } from "./map-art";
import { BAG_CAPACITY, DUNGEONS, POTIONS, MAX_POTIONS, buyPotion, usePotion, normalizeSupplies, itemSalePrice, storeRewardItems, recoverPendingItems, canEnterDungeon, type PotionKind, type DungeonId } from "./progression";

import { SECTS, SKILL_KEYS, HERO_SIZE, resolveSectId, selectSkillTargets, type SectId, type Sect, type SkillKey, type SkillDefinition } from "./sects";
import { drawSectEffect, skillIconMarkup, type SectEffect } from "./sect-effects";
type ItemSlot = "weapon" | "armor";
type Rarity = "Thường" | "Tốt" | "Hiếm" | "Cực phẩm";
type PanelTab = "bag" | "smith" | "skills" | "dungeon" | "shop";



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
  cooldowns: Record<SkillKey, number>;
  skillPoints: number;
  skillRanks: Record<SkillKey, number>;
  inventory: Item[];
  equipment: Partial<Record<ItemSlot, Item>>;
  gold: number;
  refiningStones: number;
  questKills: number;
  bossDefeated: boolean;
  questRewardClaimed: boolean;
  dungeonTokens: number;
  dungeonClears: Record<DungeonId, number>;
  potions: Record<PotionKind, number>;
  potionCooldown: number;
  pendingItems: Item[];
  facingX: number;
  facingY: number;
}

interface Npc {
  id: "guide" | "smith" | "dungeon" | "merchant";
  name: string;
  title: string;
  x: number;
  y: number;
  color: string;
  icon: string;
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
  slowUntil: number;
  slowFactor: number;
  stunUntil: number;
  poisonUntil: number;
  poisonNextTick: number;
  poisonDamage: number;
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

interface SkillEffect extends SectEffect {
  startedAt: number;
  duration: number;
}

interface SkillZone extends SkillEffect {
  nextTick: number;
  multiplier: number;
  slow: number;
  source: string;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  startedAt: number;
  duration: number;
  size: number;
}

interface GameState {
  player: Player;
  enemies: Enemy[];
  worldEnemies: Enemy[];
  worldLoot: GroundLoot[];
  loot: GroundLoot[];
  telegraphs: Telegraph[];
  effects: SkillEffect[];
  zones: SkillZone[];
  floatingTexts: FloatingText[];
  logs: string[];
  targetId: string | null;
  moveTarget: { x: number; y: number } | null;
  cameraX: number;
  cameraY: number;
  lastBossDefeatedAt: number;
  mapMode: "world" | "dungeon";
  dungeonTimeLeft: number;
  dungeonCleared: boolean;
  dungeonRewardClaimed: boolean;
  dungeonId: DungeonId | null;
  dungeonWave: number;
  onlinePlayers: OnlineSnapshot["players"];
  autoBattle: boolean;
}

const WORLD_WIDTH = 1900;
const WORLD_HEIGHT = 1200;
let VIEW_WIDTH = 960;
let VIEW_HEIGHT = 600;
const MOBILE_GAME_QUERY = "(max-width: 600px) and (orientation: portrait), (max-width: 1000px) and (max-height: 500px) and (orientation: landscape)";
const mobileGameMedia = window.matchMedia(MOBILE_GAME_QUERY);
const RENDER_INTERVAL_MS = 1000 / 30;
const PLAYER_START = { x: 300, y: 360 };
const SAVE_KEY = "giang-ho-di-truyen-prototype";



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
        <span class="connection-pill" id="connection-pill"><i></i> <span id="connection-label">Ngoại tuyến</span></span>
        <button class="ghost-button" id="online-btn">Kết nối online</button>
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
          <div class="currency-row"><span><b class="coin-icon">◆</b> <strong id="gold-label">0</strong> bạc</span><span><b class="stone-icon">✦</b> <strong id="stone-label">0</strong> đá</span><span><b class="token-icon">◇</b> <strong id="token-label">0</strong> token</span></div>
        </section>

        <section class="panel quest-panel">
          <button class="quest-toggle" id="quest-toggle" type="button" aria-label="Mở chi tiết nhiệm vụ" aria-expanded="false">⌄</button>
          <div class="section-kicker">NHIỆM VỤ CHÍNH</div>
          <div class="quest-title" id="quest-title">Dấu chân trong Rừng Trúc</div>
          <div class="quest-text" id="quest-text">Đánh bại 5 sơn tặc, tìm món đồ tốt hơn và hạ Lang Vương.</div>
          <div class="quest-progress"><span id="quest-kill-progress">0 / 5 sơn tặc</span><span id="quest-boss-progress">○ Lang Vương</span></div>
          <div class="quest-reward"><span>Phần thưởng</span><strong id="quest-reward">+100 XP · +300 bạc</strong></div>
        </section>

        <section class="panel controls-panel">
          <div class="section-kicker">ĐIỀU KHIỂN</div>
          <div class="controls-grid">
            <span><kbd>WASD</kbd> Di chuyển</span>
            <span><kbd>Chạm</kbd> Joystick mobile</span>
            <span><kbd>Click</kbd> Chọn mục tiêu</span>
            <span><kbd>1 2 3</kbd> Võ công</span>
            <span><kbd>E</kbd> Nhặt đồ</span>
            <span><kbd>Q / R</kbd> Bình HP / MP</span>
            <span><kbd>B</kbd> Túi đồ</span>
            <span><kbd>J</kbd> Nhật ký</span>
          </div>
        </section>
      </aside>

      <section class="game-column">
        <div class="canvas-frame">
          <canvas id="game-canvas" width="960" height="600" aria-label="Bản đồ game Giang Hồ Dị Truyện"></canvas>
          <div class="canvas-badge" id="canvas-badge"><span class="live-dot"></span> RỪNG TRÚC · KÊNH 01</div>
          <div class="canvas-tip" id="canvas-tip">Chọn môn phái để bắt đầu hành trình</div>
          <div class="mobile-map-card" aria-label="Bản đồ nhỏ">
            <div class="mobile-map-title"><b id="mobile-map-name">RỪNG TRÚC</b><span>☼</span></div>
            <canvas class="mobile-map-art" id="mobile-minimap" width="190" height="120" aria-label="Vị trí nhân vật, quái và NPC"></canvas>
            <div class="mobile-map-channel">Kênh 1⌄</div>
          </div>
          <div class="mobile-resource-strip" aria-label="Tài nguyên">
            <span class="mobile-currency mobile-currency-gold">◆ <b id="mobile-gold">0</b></span>
            <span class="mobile-currency mobile-currency-stone">✦ <b id="mobile-stones">0</b></span>
          </div>
          <div class="mobile-action-rail" aria-label="Menu nhanh">
            <button class="mobile-action" type="button" data-mobile-tab="dungeon" aria-label="Mở phụ bản">${spriteMarkup("portal")}<small>Phụ bản</small></button>
            <button class="mobile-action" type="button" data-mobile-tab="skills" aria-label="Xem nhân vật">${spriteMarkup("thien-vuong", "character-shortcut")}<small>Nhân vật</small></button>
            <button class="mobile-action mobile-auto-button" id="mobile-auto" type="button" aria-label="Bật tự động chiến đấu" aria-pressed="false">${skillIconMarkup(SECTS["vo-dang"].kit.skill1, "skill1", "#e9c875")}<small>Auto</small></button>
          </div>
          <div class="mobile-chat" id="mobile-chat" aria-live="polite"></div>
          <div class="mobile-hud" id="mobile-hud" aria-label="Điều khiển trên điện thoại">
            <div class="joystick" id="joystick" aria-label="Cần điều khiển di chuyển"><div class="joystick-ring"><div class="joystick-knob" id="joystick-knob"></div></div></div>
            <button class="mobile-pickup" id="mobile-pickup" type="button" aria-label="Nhặt đồ xung quanh">${spriteMarkup("loot")}<small>Nhặt</small></button>
          </div>
        </div>
        <div class="combat-bar">
          <div class="combat-status"><span class="target-dot"></span><span id="combat-status-text">Chưa có mục tiêu</span></div>
          <div class="potion-shortcuts" aria-label="Bình hồi phục">
            <button class="potion-button potion-hp" data-use-potion="hp" aria-label="Dùng bình HP (Q)"><span>HP</span><small>0</small></button>
            <button class="potion-button potion-mp" data-use-potion="mp" aria-label="Dùng bình MP (R)"><span>MP</span><small>0</small></button>
          </div>
          <div class="skill-bar" id="skill-bar"></div>
        </div>
        <div class="log-panel">
          <div class="section-kicker">NHẬT KÝ GIANG HỒ <span>·</span> <span id="log-hint">Mới nhất ở dưới</span></div>
          <div id="log-list" class="log-list"></div>
        </div>
        <nav class="mobile-bottom-nav" aria-label="Thanh menu mobile">
          <button class="mobile-nav-button" type="button" data-mobile-tab="skills">${skillIconMarkup(SECTS["vo-dang"].kit.skill1, "skill1", "#e9c875")}<small>Kỹ năng</small></button>
          <button class="mobile-nav-button" type="button" data-mobile-guild="true">${spriteMarkup("guide")}<small>Bang</small></button>
          <button class="mobile-nav-button" type="button" data-mobile-tab="smith">${spriteMarkup("smith")}<small>Rèn</small></button>
          <button class="mobile-nav-button" type="button" data-mobile-tab="bag">${spriteMarkup("loot")}<small>Túi đồ</small></button>
          <button class="mobile-nav-button" type="button" data-mobile-settings="true"><span aria-hidden="true">⚙︎</span><small>Cài đặt</small></button>
        </nav>
      </section>

      <aside class="right-rail">
        <section class="panel target-panel">
          <div class="section-kicker">MỤC TIÊU</div>
          <div id="target-content" class="target-empty">Click vào quái để chọn mục tiêu</div>
        </section>
        <section class="panel inventory-panel">
          <div class="mobile-sheet-handle"><span></span><button class="mobile-sheet-close" id="mobile-sheet-close" type="button" aria-label="Đóng menu">×</button></div>
          <div class="panel-tabs">
            <button class="tab-button active" data-tab="bag">TÚI ĐỒ <span id="bag-count">0/12</span></button>
            <button class="tab-button" data-tab="smith">THỢ RÈN</button>
            <button class="tab-button" data-tab="skills">VÕ CÔNG</button>
            <button class="tab-button" data-tab="dungeon">PHỤ BẢN</button>
            <button class="tab-button" data-tab="shop">TIỆM</button>
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

    <div class="mobile-sheet-backdrop" id="mobile-sheet-backdrop"></div>

    <div class="sect-overlay" id="sect-overlay" role="dialog" aria-modal="true" aria-labelledby="sect-heading">
      <div class="sect-dialog">
        <div class="dialog-eyebrow">CHƯƠNG 01 · THANH KHÊ TRẤN</div>
        <h1 id="sect-heading">Thập đại môn phái</h1>
        <p class="dialog-lead">Chọn phái · Xem võ công · Gia nhập giang hồ</p>
        <div class="sect-cards" id="sect-cards"></div>
        <div id="sect-detail" class="sect-detail"></div>
        <div class="sect-join-actions"><button class="outline-button" id="resume-sect">Tải tiến trình</button><button class="outline-button" id="join-sect">Gia nhập</button></div>
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

function resizeGameViewport(): void {
  const mobileViewport = mobileGameMedia.matches;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const scale = Math.min(1.6, (rect.width > rect.height ? 1100 : 720) / rect.width, 1020 / rect.height);
  // Match the rendered aspect ratio so characters and hit targets never stretch.
  const nextWidth = mobileViewport ? Math.round(rect.width * scale) : 960;
  const nextHeight = mobileViewport ? Math.round(rect.height * scale) : 600;
  if (canvas.width === nextWidth && canvas.height === nextHeight) return;
  VIEW_WIDTH = nextWidth;
  VIEW_HEIGHT = nextHeight;
  canvas.width = nextWidth;
  canvas.height = nextHeight;
}

resizeGameViewport();
window.addEventListener("resize", resizeGameViewport);
new ResizeObserver(resizeGameViewport).observe(canvas);

const sectOverlay = document.querySelector<HTMLDivElement>("#sect-overlay")!;
const sectCards = document.querySelector<HTMLDivElement>("#sect-cards")!;
const inventoryContent = document.querySelector<HTMLDivElement>("#inventory-content")!;
const targetContent = document.querySelector<HTMLDivElement>("#target-content")!;
const targetPanel = document.querySelector<HTMLElement>(".target-panel")!;
const miniMap = document.querySelector<HTMLCanvasElement>("#mobile-minimap")!;
const miniMapContext = miniMap.getContext("2d")!;
const logList = document.querySelector<HTMLDivElement>("#log-list")!;
const toast = document.querySelector<HTMLDivElement>("#toast")!;
const skillBar = document.querySelector<HTMLDivElement>("#skill-bar")!;
const canvasTip = document.querySelector<HTMLDivElement>("#canvas-tip")!;
const canvasBadge = document.querySelector<HTMLDivElement>("#canvas-badge")!;
const combatStatusText = document.querySelector<HTMLSpanElement>("#combat-status-text")!;
const joystick = document.querySelector<HTMLDivElement>("#joystick")!;
const joystickRing = document.querySelector<HTMLDivElement>(".joystick-ring")!;
const joystickKnob = document.querySelector<HTMLDivElement>("#joystick-knob")!;
const mobilePickup = document.querySelector<HTMLButtonElement>("#mobile-pickup")!;
const mobileAuto = document.querySelector<HTMLButtonElement>("#mobile-auto")!;
const mobileChat = document.querySelector<HTMLDivElement>("#mobile-chat")!;
const inventoryPanel = document.querySelector<HTMLElement>(".inventory-panel")!;
const mobileSheetBackdrop = document.querySelector<HTMLDivElement>("#mobile-sheet-backdrop")!;
const mobileSheetClose = document.querySelector<HTMLButtonElement>("#mobile-sheet-close")!;
const connectionLabel = document.querySelector<HTMLSpanElement>("#connection-label")!;
const connectionPill = document.querySelector<HTMLSpanElement>("#connection-pill")!;
const onlineButton = document.querySelector<HTMLButtonElement>("#online-btn")!;
const keys = new Set<string>();
let game: GameState | null = null;
let activeTab: PanelTab = "bag";
let lastFrame = performance.now();
let lastDrawTime = 0;
let lastMiniMapDraw = 0;
let lastUiUpdate = 0;
let toastTimer = 0;
let renderedSkillSect: SectId | null = null;
let selectedSectId: SectId = "thieu-lam";
let previewSkill: SkillKey = "skill1";
let previewCanvas: HTMLCanvasElement | null = null;
let pendingSaleId: string | null = null;
let inventoryRenderKey = "";
const touchInput = { x: 0, y: 0 };
let joystickPointerId: number | null = null;

const onlineClient = new OnlineClient({
  onStatus: (status: OnlineStatus, detail?: string) => {
    const labels: Record<OnlineStatus, string> = {
      offline: "Ngoại tuyến",
      connecting: "Đang kết nối…",
      online: "Đã kết nối online",
    };
    connectionLabel.textContent = labels[status];
    connectionPill.dataset.status = status;
    onlineButton.textContent = status === "online" ? "Ngắt kết nối" : "Kết nối online";
    if (status === "online") {
      if (game) addLog("Đã vào máy chủ online. Bạn có thể thấy người chơi khác trong Rừng Trúc.");
      else showToast("Đã kết nối máy chủ online.");
    } else if (detail && game) {
      addLog(`Online: ${detail}`);
    }
  },
  onSnapshot: (snapshot: OnlineSnapshot) => {
    if (!game) return;
    game.onlinePlayers = snapshot.players.filter((player) => player.id !== snapshot.self.id);
  },
});

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

const worldArt = createMapArt("world", WORLD_WIDTH, WORLD_HEIGHT, obstacles);
const dungeonArts: Partial<Record<DungeonId, HTMLCanvasElement>> = {};

const NPCS: Npc[] = [
  { id: "guide", name: "Mộc sư huynh", title: "Người dẫn đường", x: 170, y: 300, color: "#72d1a0", icon: "?" },
  { id: "smith", name: "Lão Thiết", title: "Thợ rèn", x: 170, y: 470, color: "#e9c875", icon: "⚒" },
  { id: "merchant", name: "Châu thương nhân", title: "Bình HP/MP · Mua bán", x: 280, y: 540, color: "#e6bd6e", icon: "◆" },
  { id: "dungeon", name: "Sứ giả thí luyện", title: "2 phụ bản solo · Cấp 3+", x: 1710, y: 300, color: "#a787e8", icon: "◇" },
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
    slowUntil: 0,
    slowFactor: 1,
    stunUntil: 0,
    poisonUntil: 0,
    poisonNextTick: 0,
    poisonDamage: 0,
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

function makeDungeonEnemies(id: DungeonId, wave: number): Enemy[] {
  return DUNGEONS[id].waves[wave].map((enemy) => createEnemy(enemy.id, enemy.name, enemy.kind, enemy.x, enemy.y, enemy.level, enemy.color));
}

function createGame(sectId: SectId): GameState {
  const sect = SECTS[sectId];
  const player: Player = {
    ...PLAYER_START,
    radius: HERO_SIZE.radius,
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
    skillPoints: 0,
    skillRanks: { skill1: 1, skill2: 0, ultimate: 0 },
    inventory: [],
    equipment: {
      weapon: createStarterItem("weapon", sectId),
      armor: createStarterItem("armor", sectId),
    },
    gold: 80,
    refiningStones: 3,
    questKills: 0,
    bossDefeated: false,
    questRewardClaimed: false,
    dungeonTokens: 0,
    dungeonClears: { tomb: 0, bamboo: 0 },
    ...normalizeSupplies({}),
    pendingItems: [],
    facingX: 1,
    facingY: 0,
  };
  const state: GameState = {
    player,
    enemies: makeEnemies(),
    worldEnemies: [],
    worldLoot: [],
    loot: [],
    telegraphs: [],
    effects: [],
    zones: [],
    floatingTexts: [],
    logs: [],
    targetId: null,
    moveTarget: null,
    cameraX: 0,
    cameraY: 0,
    lastBossDefeatedAt: 0,
    mapMode: "world",
    dungeonTimeLeft: 0,
    dungeonCleared: false,
    dungeonRewardClaimed: false,
    dungeonId: null,
    dungeonWave: 0,
    onlinePlayers: [],
    autoBattle: false,
  };
  state.worldEnemies = state.enemies;
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
  // Routine damage already has floating numbers and the combat log.
  if (!/\d+ sát thương\.$/.test(message)) showToast(message);
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

function skillScale(skill: SkillKey, base: number): number {
  if (!game) return base;
  const rank = game.player.skillRanks[skill] ?? 0;
  return base + Math.max(0, rank - 1) * 0.14;
}

function addSkillEffect(effect: Omit<SkillEffect, "startedAt">): void {
  if (!game) return;
  game.effects.push({ ...effect, startedAt: nowMs() });
  if (game.effects.length > 24) game.effects.shift();
}

function addFloatingText(x: number, y: number, text: string, color: string, size = 18): void {
  if (!game) return;
  game.floatingTexts.push({ x, y, text, color, startedAt: nowMs(), duration: 900, size });
  if (game.floatingTexts.length > 40) game.floatingTexts.shift();
}

function upgradeSkill(skill: SkillKey): void {
  if (!game) return;
  const player = game.player;
  const unlockLevel: Record<SkillKey, number> = { skill1: 1, skill2: 3, ultimate: 5 };
  const maxRank = 5;
  if (player.level < unlockLevel[skill]) {
    addLog(`Võ công này mở ở cấp ${unlockLevel[skill]}.`);
    return;
  }
  if (player.skillRanks[skill] >= maxRank) {
    addLog("Võ công đã đạt bậc tối đa trong prototype.");
    return;
  }
  if (player.skillPoints < 1) {
    addLog("Chưa có điểm võ học. Lên cấp để nhận thêm điểm.");
    return;
  }
  player.skillPoints -= 1;
  player.skillRanks[skill] = Math.max(0, player.skillRanks[skill]) + 1;
  addLog(`Đã nâng ${SECTS[player.sect].kit[skill].name} lên bậc ${player.skillRanks[skill]}.`);
  refreshUi(true);
}

function checkMainQuest(): void {
  if (!game) return;
  const player = game.player;
  if (player.questKills >= 5 && player.bossDefeated && !player.questRewardClaimed) {
    player.questRewardClaimed = true;
    player.gold += 300;
    rewardExperience(100);
    addLog("Nhiệm vụ Dấu chân trong Rừng Trúc hoàn tất: +100 XP · +300 bạc.");
  }
}

function enterDungeon(id: DungeonId): void {
  if (!game) return;
  const dungeon = DUNGEONS[id];
  if (!dungeon) return;
  if (game.mapMode === "dungeon") {
    addLog("Bạn đang ở trong phụ bản.");
    return;
  }
  if (!canEnterDungeon(id, game.player.level, game.player.dungeonClears)) {
    addLog(`Cần cấp ${dungeon.minLevel}${dungeon.prerequisite ? ` và hoàn thành ${DUNGEONS[dungeon.prerequisite].name}` : ""} để vào ${dungeon.name}.`);
    return;
  }
  persistGame();
  game.worldEnemies = game.enemies;
  game.worldLoot = game.loot;
  game.dungeonId = id;
  game.dungeonWave = 0;
  game.enemies = makeDungeonEnemies(id, 0);
  game.mapMode = "dungeon";
  game.dungeonTimeLeft = dungeon.timeLimit;
  game.dungeonCleared = false;
  game.dungeonRewardClaimed = false;
  game.targetId = null;
  game.moveTarget = null;
  game.loot = [];
  game.telegraphs = [];
  game.effects = [];
  game.zones = [];
  game.floatingTexts = [];
  resetJoystick();
  keys.clear();
  game.player.x = 300;
  game.player.y = 690;
  canvasBadge.innerHTML = `<span class="live-dot"></span> ${dungeon.shortName} · SOLO`;
  canvasTip.textContent = `${dungeon.name} · Đợt 1/${dungeon.waves.length}`;
  addLog(`Đã vào ${dungeon.name}. Dọn hết từng đợt trong ${dungeon.timeLimit / 60} phút, quái không hồi sinh.`);
  closeMobileSheet();
  refreshUi(true);
}

function advanceDungeonWave(): void {
  if (!game || game.mapMode !== "dungeon" || !game.dungeonId || game.dungeonCleared || game.enemies.some((enemy) => !enemy.dead)) return;
  const dungeon = DUNGEONS[game.dungeonId];
  if (game.dungeonWave + 1 >= dungeon.waves.length) {
    game.dungeonCleared = true;
    game.dungeonTimeLeft = 0;
    game.telegraphs = [];
    game.targetId = null;
    game.moveTarget = null;
    addLog(`${dungeon.name} hoàn thành! Mở Phụ bản để nhận thưởng. Đồ chưa nhặt sẽ được thu hồi.`);
    return;
  }
  game.dungeonWave += 1;
  game.enemies = makeDungeonEnemies(game.dungeonId, game.dungeonWave);
  game.targetId = null;
  game.telegraphs = [];
  canvasTip.textContent = `${dungeon.name} · Đợt ${game.dungeonWave + 1}/${dungeon.waves.length}`;
  addLog(`Đợt ${game.dungeonWave + 1}/${dungeon.waves.length}: ${game.enemies.map((enemy) => enemy.name).join(", ")}.`);
}

function leaveDungeon(): void {
  if (!game || game.mapMode !== "dungeon") return;
  if (game.dungeonCleared && !game.dungeonRewardClaimed) {
    addLog("Hãy nhận phần thưởng phụ bản trước khi rời đi.");
    return;
  }
  const cleared = game.dungeonCleared;
  game.enemies = game.worldEnemies;
  game.mapMode = "world";
  game.dungeonTimeLeft = 0;
  game.dungeonCleared = false;
  game.dungeonRewardClaimed = false;
  game.dungeonId = null;
  game.dungeonWave = 0;
  game.targetId = null;
  game.moveTarget = null;
  game.telegraphs = [];
  game.loot = game.worldLoot;
  game.worldLoot = [];
  game.effects = [];
  game.zones = [];
  game.floatingTexts = [];
  resetJoystick();
  keys.clear();
  game.player.x = PLAYER_START.x;
  game.player.y = PLAYER_START.y;
  canvasBadge.innerHTML = `<span class="live-dot"></span> RỪNG TRÚC · KÊNH 01`;
  canvasTip.textContent = "Click quái để áp sát · E để nhặt đồ quanh bạn";
  if (!cleared) addLog("Bạn đã rời phụ bản trước khi hoàn thành.");
  refreshUi(true);
}

function claimDungeonReward(): void {
  if (!game || game.mapMode !== "dungeon" || !game.dungeonId || !game.dungeonCleared || game.dungeonRewardClaimed) return;
  const player = game.player;
  const dungeon = DUNGEONS[game.dungeonId];
  // Set the guard before awarding anything; repeated clicks cannot claim twice.
  game.dungeonRewardClaimed = true;
  player.dungeonClears[dungeon.id] += 1;
  player.dungeonTokens += dungeon.reward.tokens;
  player.gold += dungeon.reward.gold;
  player.refiningStones += dungeon.reward.stones;
  rewardExperience(dungeon.reward.xp);
  const recovered: Item[] = [createItem(dungeon.reward.itemLevel, "Hiếm")];
  for (const loot of game.loot) {
    player.gold += loot.gold;
    player.refiningStones += loot.stones;
    if (loot.item) recovered.push(loot.item);
  }
  storeRewardItems(player, recovered);
  addLog(`Nhận thưởng ${dungeon.name}: +${dungeon.reward.xp} XP · +${dungeon.reward.gold} bạc · +${dungeon.reward.tokens} token · +${dungeon.reward.stones} đá. Đã thu hồi đồ chưa nhặt.`);
  if (player.pendingItems.length) addLog(`${player.pendingItems.length} món đang chờ trong Túi đồ → Đồ chờ nhận, không bị mất khi túi đầy.`);
  leaveDungeon();
  persistGame();
}

function drinkPotion(kind: PotionKind): void {
  if (!game || !Object.hasOwn(POTIONS, kind)) return;
  const player = game.player;
  const before = kind === "hp" ? player.hp : player.mp;
  const result = usePotion(player, kind);
  if (result === "used") {
    const amount = Math.floor((kind === "hp" ? player.hp : player.mp) - before);
    addFloatingText(player.x, player.y - 38, `+${amount} ${POTIONS[kind].label}`, POTIONS[kind].color, 16);
    addLog(`${POTIONS[kind].name}: hồi ${amount} ${POTIONS[kind].label}.`);
    persistGame();
  } else if (result === "cooldown") addLog(`Bình hồi phục dùng chung hồi chiêu: còn ${Math.ceil(player.potionCooldown)} giây.`);
  else if (result === "empty") addLog(`Hết ${POTIONS[kind].name}. Mở Túi đồ → Tiệm để mua.`);
  else if (result === "full") addLog(`${POTIONS[kind].label} đã đầy, không tiêu hao bình.`);
  refreshUi(true);
}

function purchasePotion(kind: PotionKind, quantity: number): void {
  if (!game || !Object.hasOwn(POTIONS, kind)) return;
  if (game.mapMode !== "world") return addLog("Tiệm chỉ mở ở Rừng Trúc. Hãy chuẩn bị bình trước khi vào phụ bản.");
  const result = buyPotion(game.player, kind, quantity);
  if (result === "bought") {
    addLog(`Mua ${quantity} ${POTIONS[kind].name}: -${POTIONS[kind].price * quantity} bạc.`);
    persistGame();
  } else if (result === "poor") addLog("Không đủ bạc. Hãy bán trang bị thừa hoặc săn thêm quái.");
  else if (result === "full") addLog(`Mỗi loại bình chỉ chứa tối đa ${MAX_POTIONS}.`);
  refreshUi(true);
}

function sellItem(id: string): void {
  if (!game) return;
  if (game.mapMode !== "world") return addLog("Hãy về Rừng Trúc trước khi bán trang bị.");
  const index = game.player.inventory.findIndex((item) => item.id === id);
  if (index < 0) return;
  if (pendingSaleId !== id) {
    pendingSaleId = id;
    refreshUi(true);
    return;
  }
  const item = game.player.inventory.splice(index, 1)[0];
  const gold = itemSalePrice(item);
  game.player.gold += gold;
  pendingSaleId = null;
  addLog(`Đã bán ${item.name}${item.enhance ? ` +${item.enhance}` : ""}: +${gold} bạc.`);
  persistGame();
  refreshUi(true);
}

function collectPendingItems(): void {
  if (!game) return;
  const count = recoverPendingItems(game.player);
  addLog(count ? `Đã nhận ${count} món từ đồ chờ nhận.` : "Túi đã đầy. Bán bớt trang bị để nhận đồ chờ.");
  persistGame();
  refreshUi(true);
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
  if (game?.mapMode === "dungeon") return false;
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
    player.facingX = dx / length;
    player.facingY = dy / length;
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
  addFloatingText(enemy.x + randomBetween(-8, 8), enemy.y - enemy.radius - 7, `-${damage}`, critical ? "#ffe28a" : "#fff1d1", critical ? 23 : 18);
  if (critical) addLog(`${source}: chí mạng ${damage} sát thương.`);
  if (enemy.hp <= 0) killEnemy(enemy);
}



function playerBasicAttack(): void {
  if (!game || game.player.attackCooldown > 0) return;
  const target = currentTarget();
  if (!target) return;
  const range = SECTS[game.player.sect].basicRange + target.radius;
  if (distance(game.player, target) > range) return;
  game.player.attackCooldown = 0.62;
  dealDamage(target, 1, "Đánh thường");
}

function dashToTarget(player: Player, target: Enemy): boolean {
  const angle = Math.atan2(target.y - player.y, target.x - player.x);
  const travel = Math.max(0, distance(player, target) - target.radius - player.radius - 8);
  const steps = Math.ceil(travel / 6);
  // Check every segment: an endpoint beyond a rock does not allow crossing it.
  for (let step = 0; step < steps; step++) {
    const length = Math.min(6, travel - step * 6);
    const x = player.x + Math.cos(angle) * length, y = player.y + Math.sin(angle) * length;
    if (isBlocked(x, y, player.radius)) break;
    player.x = x; player.y = y;
  }
  player.facingX = Math.cos(angle); player.facingY = Math.sin(angle);
  return distance(player, target) <= target.radius + player.radius + 18;
}

function applySkillStatus(enemy: Enemy, definition: SkillDefinition, multiplier: number, now: number): void {
  if (enemy.dead) return;
  if (definition.breakArmor) enemy.defenseDownUntil = now + definition.breakArmor * 1000;
  if (definition.slow) { enemy.slowUntil = now + 3000; enemy.slowFactor = definition.slow; }
  if (definition.stun) enemy.stunUntil = now + Math.min(definition.stun, enemy.kind === "boss" ? .35 : 2) * 1000;
  if (definition.poison) {
    enemy.poisonUntil = now + definition.poison * 1000;
    enemy.poisonNextTick = now + 1000;
    enemy.poisonDamage = multiplier * .28;
  }
}

function castSkill(key: SkillKey): void {
  if (!game) return;
  const player = game.player, sect = SECTS[player.sect], definition = sect.kit[key];
  if (player.level < definition.unlock) return addLog(`${definition.name} mở ở cấp ${definition.unlock}.`);
  if (player.cooldowns[key] > 0) return;
  if (player.mp < definition.mp) return addLog(`Cần ${definition.mp} MP để dùng ${definition.name}.`);
  if (key === "ultimate" && player.rage < 100) return addLog("Chưa đủ 100 nộ để thi triển tuyệt chiêu.");
  // A selected distant target stays selected: never silently cast at a different enemy.
  const target = currentTarget() ?? nearestEnemy(definition.range);
  const selection = selectSkillTargets(definition, player, game.enemies, target);
  if (!selection.valid) return addLog(`${definition.name} cần mục tiêu trong tầm ${definition.range}.`);
  if (definition.dash && target && !dashToTarget(player, target)) {
    game.targetId = null;
    return addLog("Đường lướt bị vật cản chặn. Hãy chọn vị trí khác.");
  }
  const now = nowMs();
  player.mp -= definition.mp;
  player.cooldowns[key] = definition.cooldown;
  onlineClient.sendSkill(key);
  const multiplier = skillScale(key, definition.damage);
  for (const [index, enemy] of selection.targets.entries()) {
    applySkillStatus(enemy, definition, multiplier, now);
    const falloff = definition.shape === "chain" ? .8 ** index : 1;
    if (definition.damage > 0) for (let hit = 0; hit < (definition.hits ?? 1); hit++) dealDamage(enemy, multiplier * falloff, definition.name);
    if (definition.shape === "chain") addSkillEffect({ x: enemy.x, y: enemy.y, radius: 35, color: sect.color, duration: 500, kind: definition.motif, skill: key });
  }
  if (definition.heal && (!definition.healOnHit || selection.targets.length)) {
    const heal = Math.min(player.maxHp - player.hp, Math.floor(player.maxHp * (definition.heal + Math.max(0, player.skillRanks[key] - 1) * .025)));
    player.hp += heal;
    if (heal > 0) addFloatingText(player.x, player.y - 34, `+${heal}`, sect.accent, 15);
  }
  if (definition.shield) {
    player.shield = Math.max(player.shield, Math.floor(player.maxHp * (definition.shield + Math.max(0, player.skillRanks[key] - 1) * .025)));
    player.shieldUntil = now + 5000;
  }
  const visualRadius = definition.shape === "line" ? definition.range : definition.shape === "target" || definition.shape === "chain" ? 45 : definition.radius;
  const visual = { ...selection.center, radius: Math.min(205, visualRadius), color: sect.color, kind: definition.motif, skill: key, angle: selection.angle, duration: key === "ultimate" ? 750 : 520 };
  addSkillEffect(visual);
  if (definition.zone) {
    game.zones.push({ ...visual, startedAt: now, duration: definition.zone * 1000, nextTick: now + 1000, multiplier: skillScale(key, .4), slow: definition.slow ?? 1, source: definition.name });
    if (game.zones.length > 6) game.zones.shift();
  }
  // Damage ticks build rage; casting an ultimate itself always consumes all rage.
  player.rage = key === "ultimate" ? 0 : clamp(player.rage + (key === "skill1" ? 10 : 14), 0, 100);
  addLog(`${definition.name} · -${definition.mp} MP.`);
  refreshUi(true);
}

function rewardExperience(amount: number): void {
  if (!game) return;
  const player = game.player;
  player.xp += amount;
  addFloatingText(player.x, player.y - 35, `+${amount} XP`, "#a9e8a8", 13);
  let leveled = false;
  while (player.xp >= xpToNext(player.level) && player.level < 30) {
    player.xp -= xpToNext(player.level);
    player.level += 1;
    leveled = true;
    player.skillPoints += 1;
    player.attack += 3;
    player.defense += 2;
    player.maxHp += 34;
    player.maxMp += 13;
  }
  if (leveled) {
    syncStats(true);
    addFloatingText(player.x, player.y - 62, `CẤP ${player.level}!`, "#ffe18a", 23);
    addLog(`Bạn đã đạt cấp ${player.level}. Chỉ số được tăng và hồi đầy sinh lực.`);
    addLog("Nhận 1 điểm võ học. Mở tab Võ công để nâng chiêu.");
    if (player.level >= 3 && player.skillRanks.skill2 === 0) {
      player.skillRanks.skill2 = 1;
      addLog(`Đã mở ${SECTS[player.sect].kit.skill2.name} — nhấn phím 2.`);
    }
    if (player.level >= 5 && player.skillRanks.ultimate === 0) {
      player.skillRanks.ultimate = 1;
      addLog(`Đã mở tuyệt chiêu ${SECTS[player.sect].kit.ultimate.name} — tích đủ 100 nộ rồi nhấn phím 3.`);
    }
  }
}

function killEnemy(enemy: Enemy): void {
  if (!game || enemy.dead) return;
  enemy.dead = true;
  enemy.respawnAt = game.mapMode === "dungeon" || enemy.kind === "boss" ? Number.POSITIVE_INFINITY : nowMs() + 8000;
  const player = game.player;
  const xp = enemy.kind === "boss" ? 520 : enemy.kind === "elite" ? 150 : 42 + enemy.level * 8;
  rewardExperience(xp);
  if (enemy.id.startsWith("bandit-") && game.mapMode === "world") {
    player.questKills += 1;
    checkMainQuest();
  }
  if (game.targetId === enemy.id) game.targetId = null;
  if (enemy.kind === "boss") {
    if (game.mapMode === "dungeon") {
      addLog(`${enemy.name} đã gục ngã!`);
    } else {
      player.bossDefeated = true;
      game.lastBossDefeatedAt = nowMs();
      addLog("Lang Vương đã gục ngã! Bạn nhận được phần thưởng Cực phẩm.");
      checkMainQuest();
    }
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
      expiresAt: game.mapMode === "dungeon" ? Number.POSITIVE_INFINITY : nowMs() + (enemy.kind === "boss" ? 240000 : 90000),
    });
  } else {
    game.loot.push({
      id: `loot-gold-${enemy.id}-${Date.now()}`,
      x: enemy.x,
      y: enemy.y,
      gold: enemy.kind === "elite" ? 60 : randomInt(5, 15),
      stones: enemy.kind === "elite" ? 1 : 0,
      expiresAt: game.mapMode === "dungeon" ? Number.POSITIVE_INFINITY : nowMs() + 90000,
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
  addFloatingText(player.x + randomBetween(-7, 7), player.y - 39, remaining > 0 ? `-${remaining}` : "ĐỠ", remaining > 0 ? "#ff9c88" : "#9ed9f4", remaining > 0 ? 18 : 14);
  if (remaining > 0) addLog(`${source} gây ${remaining} sát thương.`);
  if (player.hp <= 0) {
    const inDungeon = game.mapMode === "dungeon";
    player.x = PLAYER_START.x;
    player.y = PLAYER_START.y;
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    player.rage = 0;
    game.targetId = null;
    game.moveTarget = null;
    game.autoBattle = false;
    game.telegraphs = [];
    addLog("Bạn đã ngã xuống và được đưa về điểm hồi sinh. Không mất trang bị.");
    if (inDungeon) leaveDungeon();
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
    if (loot.item && player.inventory.length >= BAG_CAPACITY) {
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
  pendingSaleId = null;
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

function persistGame(): boolean {
  if (!game || game.mapMode !== "world") return false;
  const snapshot = {
    player: game.player,
    enemies: game.enemies.map((enemy) => ({ ...enemy, dead: false, respawnAt: 0 })),
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    showToast("Trình duyệt không lưu được tiến trình. Đừng đóng trang; hãy kiểm tra dung lượng lưu trữ.");
    return false;
  }
}

function saveGame(): void {
  if (!game) return showToast("Hãy chọn môn phái trước khi lưu.");
  if (game.mapMode === "dungeon") return addLog("Hãy hoàn thành hoặc rời phụ bản trước khi lưu.");
  if (persistGame()) addLog("Đã lưu tiến trình vào trình duyệt này.");
}

function loadGame(): void {
  if (game?.mapMode === "dungeon") return addLog("Hãy hoàn thành hoặc rời phụ bản trước khi tải tiến trình.");
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return showToast("Chưa có tiến trình nào được lưu.");
    const snapshot = JSON.parse(raw) as { player: Player; enemies: Enemy[] };
    const sectId = resolveSectId(snapshot.player?.sect);
    if (!snapshot.player || !sectId) throw new Error("save-invalid");
    snapshot.player.sect = sectId;
    snapshot.player.radius = HERO_SIZE.radius;
    snapshot.player.shield = 0;
    snapshot.player.shieldUntil = 0;
    snapshot.player.skillPoints ??= 0;
    snapshot.player.skillRanks ??= { skill1: 1, skill2: 0, ultimate: 0 };
    snapshot.player.questRewardClaimed ??= false;
    snapshot.player.dungeonTokens ??= 0;
    Object.assign(snapshot.player, normalizeSupplies(snapshot.player));
    snapshot.player.pendingItems ??= [];
    snapshot.player.dungeonClears ??= { tomb: snapshot.player.dungeonTokens > 0 ? 1 : 0, bamboo: 0 };
    const worldEnemies = makeEnemies();
    game = {
      player: snapshot.player,
      enemies: worldEnemies,
      worldEnemies,
      worldLoot: [],
      loot: [],
      telegraphs: [],
      effects: [],
      zones: [],
      floatingTexts: [],
      logs: [],
      targetId: null,
      moveTarget: null,
      cameraX: 0,
      cameraY: 0,
      lastBossDefeatedAt: 0,
      mapMode: "world",
      dungeonTimeLeft: 0,
      dungeonCleared: false,
      dungeonRewardClaimed: false,
      dungeonId: null,
      dungeonWave: 0,
      onlinePlayers: [],
      autoBattle: false,
    };
    syncStats();
    pendingSaleId = null;
    resetJoystick();
    keys.clear();
    closeMobileSheet();
    sectOverlay.classList.add("hidden");
    canvasBadge.innerHTML = `<span class="live-dot"></span> RỪNG TRÚC · KÊNH 01`;
    addLog("Đã tải tiến trình. Hãy tiếp tục hành trình tại Rừng Trúc.");
    refreshUi(true);
  } catch {
    showToast("Tiến trình lưu bị lỗi hoặc không tương thích.");
  }
}

function resetGame(): void {
  onlineClient.disconnect();
  resetJoystick();
  closeMobileSheet();
  game = null;
  pendingSaleId = null;
  keys.clear();
  sectOverlay.classList.remove("hidden");
  canvasBadge.innerHTML = `<span class="live-dot"></span> RỪNG TRÚC · KÊNH 01`;
  canvasTip.textContent = "Chọn môn phái để bắt đầu hành trình";
  refreshUi(true);
}

function openGuildRoadmap(): void {
  addLog("Bang hội sẽ mở ở giai đoạn P7: tạo bang, gia nhập, đóng góp và boss bang.");
  showToast("Hệ thống bang hội đang nằm trong lộ trình V1.");
}

function interactNpc(npc: Npc): void {
  if (!game || game.mapMode !== "world") return;
  if (distance(game.player, npc) > 105) {
    game.moveTarget = { x: npc.x, y: npc.y };
    game.targetId = null;
    addLog(`Đang đi tới ${npc.name}. Click lại khi đứng gần để tương tác.`);
    return;
  }
  if (npc.id === "guide") {
    addLog(game.player.questRewardClaimed ? "Mộc sư huynh: Hãy luyện thêm võ công trước khi vào Cổ Mộ." : "Mộc sư huynh: Hạ 5 sơn tặc, rồi Lang Vương sẽ lộ diện.");
    return;
  }
  if (npc.id === "smith") {
    addLog("Lão Thiết: Trang bị tốt phải được tôi luyện đúng lúc.");
    openMobileSheet("smith");
    return;
  }
  if (npc.id === "merchant") {
    openMobileSheet("shop");
    addLog("Châu thương nhân: Chuẩn bị bình HP/MP trước khi thử thách boss nhé!");
    return;
  }
  openMobileSheet("dungeon");
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
    return;
  }
  const npc = game.mapMode === "world" ? NPCS.find((candidate) => distance(world, candidate) <= 32) : undefined;
  if (npc) {
    interactNpc(npc);
  } else {
    game.targetId = null;
    game.moveTarget = { x: clamp(world.x, 40, WORLD_WIDTH - 40), y: clamp(world.y, 40, WORLD_HEIGHT - 40) };
  }
}

function update(dt: number, now: number): void {
  if (!game) return;
  const player = game.player;
  if (game.mapMode === "dungeon" && !game.dungeonCleared) {
    game.dungeonTimeLeft = Math.max(0, game.dungeonTimeLeft - dt);
    if (game.dungeonTimeLeft <= 0) {
      addLog(`Hết giờ! ${DUNGEONS[game.dungeonId!].name} đã đóng lại. Lượt này không có thưởng hoàn thành.`);
      leaveDungeon();
      return;
    }
  }
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.cooldowns.skill1 = Math.max(0, player.cooldowns.skill1 - dt);
  player.cooldowns.skill2 = Math.max(0, player.cooldowns.skill2 - dt);
  player.cooldowns.ultimate = Math.max(0, player.cooldowns.ultimate - dt);
  player.potionCooldown = Math.max(0, player.potionCooldown - dt);
  player.mp = Math.min(player.maxMp, player.mp + dt * 1.6);
  if (player.shieldUntil <= now) player.shield = 0;
  player.rage = clamp(player.rage + dt * 1.1, 0, 100);
  if (game.autoBattle && !currentTarget()) {
    const target = nearestEnemy(520);
    if (target) game.targetId = target.id;
  }

  const keyboardX = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
  const keyboardY = (keys.has("s") || keys.has("arrowdown") ? 1 : 0) - (keys.has("w") || keys.has("arrowup") ? 1 : 0);
  const inputX = clamp(keyboardX !== 0 ? keyboardX : touchInput.x, -1, 1);
  const inputY = clamp(keyboardY !== 0 ? keyboardY : touchInput.y, -1, 1);
  onlineClient.sendInput(inputX, inputY);
  if (inputX !== 0 || inputY !== 0) {
    game.moveTarget = null;
    const inputLength = Math.max(1, Math.hypot(inputX, inputY));
    movePlayer(inputX / inputLength * player.speed * dt, inputY / inputLength * player.speed * dt);
  } else if (game.moveTarget) {
    const d = distance(player, game.moveTarget);
    if (d < 8) game.moveTarget = null;
    else movePlayer(((game.moveTarget.x - player.x) / d) * player.speed * dt, ((game.moveTarget.y - player.y) / d) * player.speed * dt);
  } else {
    const target = currentTarget();
    if (target) {
      const d = distance(player, target);
      if (d > SECTS[player.sect].basicRange + target.radius - 4) movePlayer(((target.x - player.x) / d) * player.speed * dt, ((target.y - player.y) / d) * player.speed * dt);
      else playerBasicAttack();
    }
  }

  const encounterEnemies = game.enemies;
  for (const enemy of encounterEnemies) {
    if (enemy.dead) {
      if (game.mapMode === "world" && now >= enemy.respawnAt && enemy.kind !== "boss") {
        enemy.dead = false;
        enemy.hp = enemy.maxHp;
        enemy.attackCooldown = 1;
        enemy.poisonUntil = enemy.stunUntil = enemy.slowUntil = enemy.defenseDownUntil = 0;
        enemy.x += randomBetween(-22, 22);
        enemy.y += randomBetween(-22, 22);
      }
      continue;
    }
    if (enemy.poisonNextTick > 0 && enemy.poisonNextTick <= now && enemy.poisonNextTick <= enemy.poisonUntil) {
      enemy.poisonNextTick += 1000;
      dealDamage(enemy, enemy.poisonDamage, "Độc");
      if (enemy.dead) continue;
    }
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    if (enemy.stunUntil > now) continue;
    const enemySpeed = enemy.speed * (enemy.slowUntil > now ? enemy.slowFactor : 1);
    const d = distance(enemy, player);
    if (enemy.kind === "boss") {
      enemy.bossCooldown -= dt;
      if (d < 520 && enemy.bossCooldown <= 0) {
        const dungeonBoss = game.mapMode === "dungeon";
        const enraged = dungeonBoss && enemy.hp <= enemy.maxHp * .5;
        const attackName = game.dungeonId === "tomb" ? "Địa Chấn" : "Liệt Trảo";
        game.telegraphs.push({ x: player.x, y: player.y, radius: 92, triggerAt: now + 1100, damage: enemy.attack * 1.4, label: `${enemy.name} · ${attackName}` });
        if (enraged) game.telegraphs.push({ x: enemy.x, y: enemy.y, radius: 130, triggerAt: now + 1550, damage: enemy.attack * 1.2, label: `${enemy.name} · Cuồng Nộ` });
        enemy.bossCooldown = enraged ? 3.6 : 4.4;
      }
      if (d > 175 && d < 550) {
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        const nextX = enemy.x + Math.cos(angle) * enemySpeed * dt;
        const nextY = enemy.y + Math.sin(angle) * enemySpeed * dt;
        if (!isBlocked(nextX, enemy.y, enemy.radius)) enemy.x = nextX;
        if (!isBlocked(enemy.x, nextY, enemy.radius)) enemy.y = nextY;
      }
    } else if (d < 330) {
      if (d > 54) {
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        const nextX = enemy.x + Math.cos(angle) * enemySpeed * dt;
        const nextY = enemy.y + Math.sin(angle) * enemySpeed * dt;
        if (!isBlocked(nextX, enemy.y, enemy.radius)) enemy.x = nextX;
        if (!isBlocked(enemy.x, nextY, enemy.radius)) enemy.y = nextY;
      } else {
        enemy.attackCooldown -= dt;
        if (enemy.attackCooldown <= 0) {
          enemy.attackCooldown = enemy.kind === "elite" ? 1.2 : 1.55;
          damagePlayer(enemy.attack, enemy.name);
          if (game.enemies !== encounterEnemies) return;
        }
      }
    }
  }

  for (const zone of game.zones) if (now >= zone.nextTick && zone.nextTick <= zone.startedAt + zone.duration) {
    zone.nextTick += 1000;
    for (const enemy of game.enemies) if (!enemy.dead && distance(zone, enemy) <= zone.radius + enemy.radius) {
      if (zone.slow < 1) { enemy.slowUntil = now + 1500; enemy.slowFactor = zone.slow; }
      dealDamage(enemy, zone.multiplier, zone.source);
    }
  }
  game.zones = game.zones.filter(zone => now - zone.startedAt <= zone.duration);
  const remainingTelegraphs: Telegraph[] = [];
  for (const telegraph of game.telegraphs) {
    if (now >= telegraph.triggerAt) {
      if (distance(player, telegraph) <= telegraph.radius + player.radius) {
        const modeBeforeHit = game.mapMode;
        damagePlayer(telegraph.damage, telegraph.label);
        if (game.mapMode !== modeBeforeHit) return;
      }
    } else remainingTelegraphs.push(telegraph);
  }
  game.telegraphs = remainingTelegraphs;
  advanceDungeonWave();
  game.effects = game.effects.filter((effect) => now - effect.startedAt < effect.duration);
  game.floatingTexts = game.floatingTexts.filter((floatingText) => now - floatingText.startedAt < floatingText.duration);
  game.loot = game.loot.filter((loot) => loot.expiresAt > now);
  game.cameraX = clamp(player.x - VIEW_WIDTH / 2, 0, WORLD_WIDTH - VIEW_WIDTH);
  game.cameraY = clamp(player.y - VIEW_HEIGHT / 2, 0, WORLD_HEIGHT - VIEW_HEIGHT);
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

function drawOutlinedText(text: string, x: number, y: number): void {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "rgba(18,28,19,.85)";
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
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
  if (game.mapMode === "dungeon") {
    const id = game.dungeonId!;
    dungeonArts[id] ??= createMapArt(id === "bamboo" ? "bamboo" : "dungeon", WORLD_WIDTH, WORLD_HEIGHT);
    ctx.drawImage(dungeonArts[id]!, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    ctx.fillStyle = "#d4c7ef";
    ctx.font = "600 14px 'DM Sans', sans-serif";
    drawOutlinedText(`${DUNGEONS[id].shortName} · ĐỢT ${game.dungeonWave + 1}/${DUNGEONS[id].waves.length}`, 270, 550);
  } else {
    ctx.drawImage(worldArt, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    ctx.fillStyle = "#fff0bd";
    ctx.font = "600 14px 'DM Sans', sans-serif";
    drawOutlinedText("THANH KHÊ TRẤN", 268, 260);
    ctx.fillStyle = "#dde8cd";
    ctx.font = "12px 'DM Sans', sans-serif";
    drawOutlinedText("Cổng phía đông · Lang Vương", 1320, 1030);
    for (const npc of NPCS) drawNpc(npc, now);
  }

  for (const zone of game.zones) drawSectEffect(ctx, zone, ((now - zone.startedAt) % 1200) / 1200, true);
  for (const effect of game.effects) drawSkillEffect(effect, now);
  for (const loot of game.loot) drawLoot(loot, now);
  for (const enemy of game.enemies) if (!enemy.dead) drawEnemy(enemy, now);
  for (const remote of game.onlinePlayers) drawRemotePlayer(remote, now);
  drawPlayer(player, now);
  for (const telegraph of game.telegraphs) drawTelegraph(telegraph, now);
  for (const floatingText of game.floatingTexts) drawFloatingText(floatingText, now);
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



  drawMinimap(now);
}


function drawMinimap(now: number): void {
  if (!game || !mobileGameMedia.matches || now - lastMiniMapDraw < 180) return;
  lastMiniMapDraw = now;
  const mc = miniMapContext;
  const sx = miniMap.width / WORLD_WIDTH;
  const sy = miniMap.height / WORLD_HEIGHT;
  mc.clearRect(0, 0, miniMap.width, miniMap.height);
  const background = game.mapMode === "world" ? worldArt : dungeonArts[game.dungeonId!];
  if (background) {
    mc.drawImage(background, 0, 0, miniMap.width, miniMap.height);
  } else {
    mc.fillStyle = game.mapMode === "dungeon" ? "#29253b" : "#41694b";
    mc.fillRect(0, 0, miniMap.width, miniMap.height);
  }
  mc.fillStyle = "rgba(7,18,14,.22)";
  mc.fillRect(0, 0, miniMap.width, miniMap.height);
  mc.strokeStyle = "rgba(255,241,189,.75)";
  mc.lineWidth = 1;
  mc.strokeRect(game.cameraX * sx, game.cameraY * sy, VIEW_WIDTH * sx, VIEW_HEIGHT * sy);
  const dot = (x: number, y: number, color: string, radius: number) => {
    mc.fillStyle = color;
    mc.beginPath();
    mc.arc(x * sx, y * sy, radius, 0, Math.PI * 2);
    mc.fill();
  };
  if (game.mapMode === "world") for (const npc of NPCS) dot(npc.x, npc.y, "#88e8ce", 2);
  for (const enemy of game.enemies) {
    if (!enemy.dead) dot(enemy.x, enemy.y, enemy.kind === "boss" ? "#ffdb65" : "#f06e62", enemy.kind === "boss" ? 3.5 : 2);
  }
  dot(game.player.x, game.player.y, "#ffffff", 4.5);
  dot(game.player.x, game.player.y, "#58cfff", 3);
}

function drawNpc(npc: Npc, now: number): void {
  const pulse = 1 + Math.sin(now / 240 + npc.x) * 0.04;
  ctx.save();
  ctx.translate(npc.x, npc.y);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.beginPath();
  ctx.ellipse(0, 19, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  const sprite: SpriteId = npc.id === "dungeon" ? "portal" : npc.id === "merchant" ? "guide" : npc.id;
  if (!drawSprite(ctx, sprite, 0, 20, npc.id === "dungeon" ? 60 : 44, npc.id === "dungeon" ? 60 : 50)) {
    ctx.fillStyle = npc.color;
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f2d0ad";
    ctx.beginPath();
    ctx.arc(0, -5, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#232b3b";
    ctx.beginPath();
    ctx.arc(0, -8, 8, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#10212c";
    ctx.font = "700 13px 'DM Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(npc.icon, 0, 5);
  }
  ctx.fillStyle = "#e2eadc";
  ctx.font = "600 11px 'DM Sans', sans-serif";
  ctx.textAlign = "center";
  drawOutlinedText(npc.name, 0, -45);
  ctx.fillStyle = "rgba(210, 224, 214, .65)";
  ctx.font = "9px 'DM Sans', sans-serif";
  drawOutlinedText(npc.title, 0, -34);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawSkillEffect(effect: SkillEffect, now: number): void {
  drawSectEffect(ctx, effect, clamp((now - effect.startedAt) / effect.duration, 0, 1));
}

function drawFloatingText(floatingText: FloatingText, now: number): void {
  const progress = clamp((now - floatingText.startedAt) / floatingText.duration, 0, 1);
  const alpha = progress < 0.18 ? progress / 0.18 : 1 - (progress - 0.18) / 0.82;
  const lift = progress * 38;
  const scale = 0.82 + Math.min(progress / 0.18, 1) * 0.18;
  ctx.save();
  ctx.translate(floatingText.x, floatingText.y - lift);
  ctx.scale(scale, scale);
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${floatingText.size}px 'DM Sans', sans-serif`;
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(3, floatingText.size * 0.22);
  ctx.strokeStyle = "rgba(24, 20, 20, .84)";
  ctx.strokeText(floatingText.text, 0, 0);
  ctx.fillStyle = floatingText.color;
  ctx.fillText(floatingText.text, 0, 0);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.restore();
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
  const lootColor = loot.item?.color ?? "#f6c65c";
  ctx.fillStyle = hexToRgba(lootColor, 0.24);
  ctx.beginPath();
  ctx.arc(0, 0, loot.item ? 21 : 17, 0, Math.PI * 2);
  ctx.fill();
  if (drawSprite(ctx, "loot", 0, 14, 30, 30)) {
    ctx.restore();
    return;
  }
  if (loot.item) {
    ctx.save();
    ctx.rotate(Math.PI / 4 + Math.sin(now / 300) * 0.08);
    ctx.fillStyle = lootColor;
    ctx.fillRect(-9, -9, 18, 18);
    ctx.fillStyle = "rgba(255,255,255,.38)";
    ctx.fillRect(-6, -6, 5, 5);
    ctx.strokeStyle = "rgba(10,24,30,.48)";
    ctx.lineWidth = 2;
    ctx.strokeRect(-9, -9, 18, 18);
    ctx.restore();
  } else {
    ctx.fillStyle = lootColor;
    ctx.beginPath();
    ctx.ellipse(-4, 2, 8, 5, -0.18, 0, Math.PI * 2);
    ctx.ellipse(5, -4, 7, 4, -0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff0a4";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(2, -7);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEnemySprite(enemy: Enemy, now: number): void {
  const scale = enemy.radius / 19;
  const hitColor = enemy.hitFlash > 0 ? "#fff5df" : enemy.color;
  const isWolf = enemy.name.includes("Lang") || enemy.name.includes("Trúc Lang");
  const isInsect = enemy.name.includes("Trùng");
  const isUndead = enemy.name.includes("U Binh") || enemy.name.includes("Mộ Tướng");
  const sprite: SpriteId = isWolf ? enemy.kind === "boss" ? "alpha" : "wolf"
    : isInsect ? "beetle" : enemy.kind === "boss" ? "guardian" : isUndead ? "undead" : "bandit";
  ctx.save();
  ctx.translate(0, Math.sin(now / 180 + enemy.x) * 1.2);
  if (enemy.hitFlash > 0) ctx.globalAlpha = .65 + Math.sin(now / 35) * .2;
  const illustrated = drawSprite(ctx, sprite, 0, enemy.radius * .8,
    enemy.radius * (isWolf ? 3.6 : 3.2), enemy.radius * (isWolf ? 2.8 : 3.4),
    Boolean(game && enemy.x > game.player.x),
  );
  ctx.restore();
  if (illustrated) return;
  ctx.save();
  ctx.scale(scale, scale);
  const bob = Math.sin(now / 180 + enemy.x) * (isWolf ? 1.2 : 0.6);
  ctx.translate(0, bob);
  if (isWolf) {
    ctx.fillStyle = hitColor;
    ctx.beginPath();
    ctx.ellipse(-2, 3, 18, 11, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(14, -6, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f1d4be";
    ctx.beginPath();
    ctx.arc(18, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hitColor;
    for (const earX of [8, 18]) {
      ctx.beginPath();
      ctx.moveTo(earX - 6, -11);
      ctx.lineTo(earX, -24);
      ctx.lineTo(earX + 5, -10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#172231";
    ctx.beginPath();
    ctx.arc(17, -7, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d5a4a1";
    ctx.lineWidth = 3;
    for (const pawX of [-12, 2]) {
      ctx.beginPath();
      ctx.moveTo(pawX, 9);
      ctx.lineTo(pawX - 2, 18);
      ctx.stroke();
    }
  } else if (isInsect) {
    ctx.fillStyle = hitColor;
    ctx.beginPath();
    ctx.ellipse(0, 2, 14, 19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c6e3a8";
    ctx.beginPath();
    ctx.arc(-5, -8, 4, 0, Math.PI * 2);
    ctx.arc(5, -8, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hitColor;
    ctx.lineWidth = 2;
    for (const side of [-1, 1]) {
      for (const offset of [-8, 0, 8]) {
        ctx.beginPath();
        ctx.moveTo(side * 8, offset);
        ctx.lineTo(side * 21, offset + side * 5);
        ctx.stroke();
      }
    }
  } else {
    ctx.fillStyle = hitColor;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(16, -4);
    ctx.lineTo(13, 17);
    ctx.lineTo(-13, 17);
    ctx.lineTo(-16, -4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = isUndead ? "#c8d4d7" : "#efc09e";
    ctx.beginPath();
    ctx.arc(0, -12, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isUndead ? "#b0c1c8" : "#293144";
    ctx.beginPath();
    ctx.arc(0, -15, 9, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isUndead ? "#27394b" : "#1a2532";
    ctx.fillRect(-9, -4, 18, 4);
    ctx.strokeStyle = isUndead ? "#d8e3e1" : "#d49b67";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(10, 2);
    ctx.lineTo(24, -9);
    ctx.stroke();
    if (enemy.kind !== "normal") {
      ctx.strokeStyle = "#e9c875";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-12, -16);
      ctx.lineTo(-7, -25);
      ctx.lineTo(0, -17);
      ctx.lineTo(7, -25);
      ctx.lineTo(12, -16);
      ctx.stroke();
    }
  }
  if (enemy.kind === "boss") {
    ctx.strokeStyle = "#e9c875";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();
  }
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
  drawEnemySprite(enemy, now);
  ctx.restore();
  const barWidth = enemy.kind === "boss" ? 160 : enemy.kind === "elite" ? 84 : 62;
  const labelY = enemy.y - enemy.radius * 2.6 - 12;
  drawBar(enemy.x - barWidth / 2, labelY, barWidth, enemy.kind === "boss" ? 8 : 5, enemy.hp / enemy.maxHp, enemy.kind === "boss" ? "#dd6c79" : "#a6d36c");
  ctx.fillStyle = enemy.kind === "boss" ? "#ffe0a1" : "#d4e1d3";
  ctx.font = `${enemy.kind === "boss" ? 700 : 600} ${enemy.kind === "boss" ? 13 : 11}px 'DM Sans', sans-serif`;
  ctx.textAlign = "center";
  drawOutlinedText(`${enemy.name} · Cấp ${enemy.level}`, enemy.x, labelY - 7);
  ctx.textAlign = "left";
}

function drawHeroSprite(sect: Sect, facingX: number, _facingY: number, now: number, remote = false): void {
  const moving = remote || Boolean(game?.moveTarget) || keys.size > 0 || Boolean(touchInput.x || touchInput.y);
  ctx.save();
  ctx.translate(0, moving ? Math.sin(now / 170) * .8 : 0);
  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.beginPath(); ctx.ellipse(0, 10, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
  if (moving) ctx.rotate(Math.sin(now / 95) * .025);
  if (!drawSprite(ctx, sect.id, 0, 12, HERO_SIZE.width, HERO_SIZE.height, facingX < 0)) {
    ctx.fillStyle = sect.color; ctx.fillRect(-9, -13, 18, 22);
    ctx.fillStyle = "#efc6a0"; ctx.beginPath(); ctx.arc(0, -19, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = sect.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(18, -18); ctx.stroke();
  }
  if (!remote && game?.player.shieldUntil && game.player.shieldUntil > now && game.player.shield > 0) {
    ctx.strokeStyle = hexToRgba(sect.accent, .7); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -8, 22, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer(player: Player, now: number): void {
  const sect = SECTS[player.sect];
  ctx.save();
  ctx.translate(player.x, player.y);
  drawHeroSprite(sect, player.facingX, player.facingY, now);
  ctx.restore();
  drawBar(player.x - 16, player.y - 42, 32, 4, player.hp / player.maxHp, "#66db9c");
  ctx.fillStyle = "#e8eff1";
  ctx.font = "700 11px 'DM Sans', sans-serif";
  ctx.textAlign = "center";
  drawOutlinedText(`Bạn · Cấp ${player.level}`, player.x, player.y - 49);
  ctx.textAlign = "left";
}

function drawRemotePlayer(remote: OnlineSnapshot["players"][number], now: number): void {
  ctx.save();
  ctx.translate(remote.x, remote.y + Math.sin(now / 190 + remote.x) * 1.2);
  drawHeroSprite(SECTS["vo-dang"], 1, 0, now, true);
  ctx.restore();
  drawBar(remote.x - 16, remote.y - 42, 32, 4, 1, "#72b9e8");
  ctx.fillStyle = "#c5e4f2";
  ctx.font = "600 10px 'DM Sans', sans-serif";
  ctx.textAlign = "center";
  drawOutlinedText(`${remote.name} · Cấp ${remote.level}`, remote.x, remote.y - 49);
  ctx.textAlign = "left";
}

function refreshUi(force = false): void {
  if (!game) {
    document.querySelector("#character-name")!.textContent = "Lữ khách";
    document.querySelector("#character-sect")!.textContent = "Chưa gia nhập môn phái";
    mobileChat.innerHTML = `<span class="mobile-chat-system">[Hệ thống]</span> Chọn môn phái để bắt đầu hành trình.`;
    mobileAuto.classList.remove("active");
    targetPanel.classList.remove("has-target");
    return;
  }
  if (!force && performance.now() - lastUiUpdate < 120) return;
  lastUiUpdate = performance.now();
  const player = game.player;
  const sect = SECTS[player.sect];
  const target = currentTarget();
  targetPanel.classList.toggle("has-target", Boolean(target));
  combatStatusText.parentElement?.classList.toggle("has-target", Boolean(target));
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
  setText("#token-label", formatNumber(player.dungeonTokens));
  setText("#mobile-gold", formatNumber(player.gold));
  setText("#mobile-stones", formatNumber(player.refiningStones));
  mobileAuto.classList.toggle("active", game.autoBattle);
  mobileAuto.setAttribute("aria-pressed", String(game.autoBattle));
  mobileAuto.setAttribute("aria-label", game.autoBattle ? "Tắt tự động chiến đấu" : "Bật tự động chiến đấu");
  setText("#mobile-map-name", game.mapMode === "world" ? "RỪNG TRÚC" : DUNGEONS[game.dungeonId!].shortName);
  document.querySelector(".mobile-map-channel")!.textContent = game.mapMode === "world" ? "Kênh 1⌄" : `Đợt ${game.dungeonWave + 1}/${DUNGEONS[game.dungeonId!].waves.length}`;
  setText("#quest-kill-progress", `${Math.min(player.questKills, 5)} / 5 sơn tặc`);
  setText("#quest-boss-progress", `${player.bossDefeated ? "✓" : "○"} Lang Vương`);
  setText("#quest-title", player.questRewardClaimed ? "Dấu chân hoàn tất" : "Dấu chân trong Rừng Trúc");
  setText("#quest-text", player.questRewardClaimed ? "Mộc sư huynh đã ghi nhận chiến công của bạn. Cổ Mộ Thí Luyện đã mở." : "Đánh bại 5 sơn tặc, tìm món đồ tốt hơn và hạ Lang Vương.");
  setText("#quest-reward", player.questRewardClaimed ? "Đã nhận thưởng" : "+100 XP · +300 bạc");
  setText("#bag-count", `${player.inventory.length}/${BAG_CAPACITY}`);
  for (const kind of ["hp", "mp"] as PotionKind[]) {
    const button = document.querySelector<HTMLButtonElement>(`.potion-shortcuts [data-use-potion="${kind}"]`)!;
    button.querySelector("small")!.textContent = player.potionCooldown > 0 ? `${Math.ceil(player.potionCooldown)}s` : `${player.potions[kind]}`;
    button.disabled = player.potionCooldown > 0 || player.potions[kind] === 0;
    button.setAttribute("aria-label", `${POTIONS[kind].name}: ${player.potions[kind]} bình${player.potionCooldown > 0 ? `, hồi chiêu ${Math.ceil(player.potionCooldown)} giây` : ""}`);
  }
  const avatar = document.querySelector<HTMLElement>("#avatar-orb");
  if (avatar && avatar.dataset.sect !== player.sect) {
    avatar.dataset.sect = player.sect;
    avatar.className = `avatar-orb avatar-${player.sect}`;
    avatar.innerHTML = spriteMarkup(player.sect, "portrait-sprite");
    avatar.style.background = hexToRgba(sect.color, .3);
    const shortcut = document.querySelector(".character-shortcut");
    if (shortcut) shortcut.outerHTML = spriteMarkup(player.sect, "character-shortcut");
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
    targetContent.classList.remove("target-empty");
    const status = target.kind === "boss" ? "BOSS · CƠ CHẾ ĐANG HOẠT ĐỘNG" : target.kind === "elite" ? "TINH ANH" : "ĐANG GIAO CHIẾN";
    targetContent.innerHTML = `
      <div class="target-heading"><div class="target-orb" style="--target-color:${target.color}"></div><div><strong>${escapeHtml(target.name)}</strong><span>${status} · Cấp ${target.level}</span></div></div>
      <div class="target-hp-row"><span>HP</span><strong>${formatNumber(target.hp)} / ${formatNumber(target.maxHp)}</strong></div>
      <div class="meter enemy-meter"><span style="width:${(target.hp / target.maxHp) * 100}%"></span></div>
      <div class="target-meta"><span>Phòng ${target.defense}</span><span>Khoảng cách ${Math.floor(distance(player, target))}</span></div>
    `;
    combatStatusText.textContent = `${target.name} · ${Math.floor(target.hp)} HP`;
  } else {
    targetContent.classList.add("target-empty");
    targetContent.innerHTML = `<div class="target-empty">Click vào quái để chọn mục tiêu</div>`;
    combatStatusText.textContent = "Chưa có mục tiêu";
  }
  renderSkillBar();
  renderInventory();
  logList.innerHTML = game.logs.map((log) => `<div class="log-entry"><span>›</span>${escapeHtml(log)}</div>`).join("");
  mobileChat.innerHTML = game.logs.slice(-3).map((log) => `<div><span class="mobile-chat-system">[Giang hồ]</span> ${escapeHtml(log)}</div>`).join("");
}

function skillGlyphMarkup(skill: SkillKey, sectId: SectId): string {
  const sect = SECTS[sectId];
  return `<span class="skill-glyph skill-${skill} illustrated-skill" style="--skill-color:${sect.color}" aria-hidden="true">${skillIconMarkup(sect.kit[skill], skill, sect.color)}</span>`;
}

function renderSkillBar(): void {
  if (!game) {
    skillBar.innerHTML = "";
    renderedSkillSect = null;
    return;
  }
  const player = game.player;
  const sect = SECTS[player.sect];
  const skillData = SKILL_KEYS.map((key, index) => ({ key, number: String(index + 1), name: sect.kit[key].name }));

  if (renderedSkillSect !== player.sect) {
    skillBar.innerHTML = skillData.map((skill) => `<button class="skill-button" data-skill="${skill.key}" title="${skill.name} · ${sect.kit[skill.key].mp} MP · ${sect.kit[skill.key].cooldown}s"><span class="skill-number">${skill.number}</span>${skillGlyphMarkup(skill.key, sect.id)}<span class="skill-name">${skill.name}</span><span class="skill-cooldown"></span></button>`).join("");
    renderedSkillSect = player.sect;
  }
  for (const skill of skillData) {
    const locked = skill.key === "skill2" && player.level < 3 || skill.key === "ultimate" && player.level < 5;
    const cooldown = player.cooldowns[skill.key];
    const coolText = locked ? "KHÓA" : cooldown > 0 ? `${cooldown.toFixed(1)}s` : player.mp < sect.kit[skill.key].mp ? "THIẾU MP" : skill.key === "ultimate" ? `${Math.floor(player.rage)}% nộ` : `${sect.kit[skill.key].mp} MP`;
    const button = skillBar.querySelector<HTMLButtonElement>(`[data-skill="${skill.key}"]`)!;
    button.classList.toggle("locked", locked);
    button.setAttribute("aria-label", `${skill.name}: ${coolText}`);
    button.querySelector(".skill-cooldown")!.textContent = coolText;
  }
}

function itemRow(item: Item, index: number, equipped = false): string {
  const statLabel = item.slot === "weapon" ? `+${item.power} công` : `+${item.power} phòng`;
  const enhanceButton = `<button class="mini-button enhance-btn" data-index="${index}" ${equipped ? `data-equipped="${item.slot}"` : ""}>+ Cường hóa</button>`;
  const equipButton = equipped ? "" : `<button class="mini-button equip-btn" data-index="${index}">Mặc đồ</button>`;
  const saleButton = equipped ? "" : `<button class="mini-button sell-btn ${pendingSaleId === item.id ? "sale-confirm" : ""}" data-item-id="${escapeHtml(item.id)}" ${game?.mapMode === "dungeon" ? "disabled" : ""}>${pendingSaleId === item.id ? "Xác nhận bán" : `Bán · ${itemSalePrice(item)} bạc`}</button>`;
  const cancelButton = pendingSaleId === item.id ? `<button class="mini-button" data-cancel-sale>Hủy</button>` : "";
  return `<div class="item-row" style="--rarity-color:${item.color}"><div class="item-icon">${item.icon}</div><div class="item-copy"><strong>${escapeHtml(item.name)} ${item.enhance ? `+${item.enhance}` : ""}</strong><span>${item.rarity} · Cấp ${item.level} · ${statLabel}</span></div><div class="item-actions">${equipButton}${enhanceButton}${saleButton}${cancelButton}</div></div>`;
}

function supplyMarkup(): string {
  if (!game) return "";
  const player = game.player;
  return `<div class="supply-list">${(["hp", "mp"] as PotionKind[]).map((kind) => `<div class="supply-row"><span class="supply-icon potion-${kind}">${POTIONS[kind].label}</span><div><strong>${POTIONS[kind].name}</strong><small>${player.potions[kind]} bình · Hồi 40% ${POTIONS[kind].label} tối đa</small></div><button class="mini-button" data-use-potion="${kind}" ${player.potionCooldown > 0 || player.potions[kind] < 1 ? "disabled" : ""}>${player.potionCooldown > 0 ? `${Math.ceil(player.potionCooldown)}s` : "Dùng"}</button></div>`).join("")}</div>`;
}

function renderInventory(): void {
  if (!game) {
    inventoryRenderKey = "";
    inventoryContent.innerHTML = `<div class="empty-state">Chọn môn phái để mở túi đồ.</div>`;
    return;
  }
  const player = game.player;
  const shopOpen = game.mapMode === "world";
  // Keep buttons/focus stable instead of replacing the entire sheet every tick.
  const renderKey = JSON.stringify([activeTab, pendingSaleId, player.sect, player.level, player.gold, player.refiningStones, player.skillPoints, player.skillRanks, player.potions, Math.ceil(player.potionCooldown), player.inventory, player.equipment, player.pendingItems.length, player.dungeonClears, game.mapMode, game.dungeonId, game.dungeonWave, game.dungeonCleared, Math.ceil(game.dungeonTimeLeft), shopOpen ? 0 : game.enemies.filter((enemy) => !enemy.dead).length]);
  if (renderKey === inventoryRenderKey) return;
  inventoryRenderKey = renderKey;
  document.querySelectorAll<HTMLButtonElement>(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === activeTab);
  });
  if (activeTab === "shop") {
    inventoryContent.innerHTML = `
      <div class="smith-intro"><span class="smith-icon">◆</span><div><strong>Châu thương nhân</strong><p>Mua bình bằng bạc. Bình xếp riêng, không chiếm ô trang bị.</p></div></div>
      <div class="resource-hint"><span>Bạc hiện có</span><b>${formatNumber(player.gold)} bạc</b></div>
      ${game.mapMode === "dungeon" ? `<p class="panel-notice">Tiệm đóng trong phụ bản. Bạn vẫn dùng được bình đã mang theo.</p>` : ""}
      ${(["hp", "mp"] as PotionKind[]).map((kind) => `<div class="shop-card"><strong>${POTIONS[kind].name} · ${POTIONS[kind].price} bạc</strong><p>Hồi 40% ${POTIONS[kind].label} tối đa · Đang có ${player.potions[kind]}/${MAX_POTIONS}</p><div class="item-actions">${[1, 5].map((quantity) => `<button class="mini-button" data-buy-potion="${kind}" data-quantity="${quantity}" ${!shopOpen || player.gold < POTIONS[kind].price * quantity || player.potions[kind] + quantity > MAX_POTIONS ? "disabled" : ""}>Mua ${quantity} · ${POTIONS[kind].price * quantity} bạc</button>`).join("")}</div></div>`).join("")}
      <p class="panel-notice">Hai loại bình dùng chung hồi chiêu 8 giây. Q: bình HP · R: bình MP. HP/MP đầy sẽ không mất bình.</p>
      <button class="outline-button" data-open-bag>Bán trang bị thừa trong Túi đồ</button>
    `;
    return;
  }
  if (activeTab === "smith") {
    const equipment = (["weapon", "armor"] as ItemSlot[]).map((slot) => player.equipment[slot] ? itemRow(player.equipment[slot]!, 0, true) : "").join("");
    inventoryContent.innerHTML = `
      <div class="smith-intro"><span class="smith-icon">⚒</span><div><strong>Lò rèn Rừng Trúc</strong><p>Dùng bạc và đá tinh luyện. Thất bại không làm mất cấp.</p></div></div>
      <div class="resource-hint"><span>Chi phí hiện tại phụ thuộc cấp cường hóa</span><b>${player.refiningStones} đá · ${player.gold} bạc</b></div>
      <div class="item-list smith-list">${equipment}</div>
    `;
    return;
  }
  if (activeTab === "skills") {
    const sect = SECTS[player.sect];
    const skillRows = SKILL_KEYS.map(key => ({ key, ...sect.kit[key] }));

    inventoryContent.innerHTML = `
      <div class="skill-points-card"><span class="skill-points-icon">✦</span><div><strong>${player.skillPoints} điểm võ học</strong><p>Mỗi lần lên cấp nhận 1 điểm. Tối đa bậc 5.</p></div></div>
      <div class="skill-list">${skillRows.map((skill) => {
        const rank = player.skillRanks[skill.key] ?? 0;
        const unlocked = player.level >= skill.unlock;
        return `<div class="skill-row ${unlocked ? "" : "locked-row"}"><div class="skill-row-icon">${skillGlyphMarkup(skill.key, sect.id)}</div><div class="skill-row-copy"><strong>${escapeHtml(skill.name)}</strong><span>${skill.description} · ${skill.mp} MP · Hồi ${skill.cooldown}s</span><small>${unlocked ? `Bậc ${rank}/5 · Mở từ cấp ${skill.unlock}` : `Mở ở cấp ${skill.unlock}`}</small></div><button class="mini-button skill-upgrade" data-skill-rank="${skill.key}" ${!unlocked || rank >= 5 || player.skillPoints < 1 ? "disabled" : ""}>${rank >= 5 ? "TỐI ĐA" : "NÂNG +1"}</button></div>`;
      }).join("")}</div>
    `;
    return;
  }
  if (activeTab === "dungeon") {
    if (game.mapMode === "dungeon") {
      const dungeon = DUNGEONS[game.dungeonId!];
      const minutes = Math.floor(game.dungeonTimeLeft / 60).toString().padStart(2, "0");
      const seconds = Math.floor(game.dungeonTimeLeft % 60).toString().padStart(2, "0");
      inventoryContent.innerHTML = game.dungeonCleared ? `
        <div class="dungeon-state cleared"><span class="dungeon-glyph">✓</span><strong>${dungeon.name} hoàn thành</strong><p>Nhận thưởng để về Rừng Trúc. Tất cả đồ chưa nhặt sẽ được thu hồi; túi đầy sẽ chuyển vào Đồ chờ nhận.</p><button class="outline-button dungeon-btn" data-dungeon-action="claim">Nhận thưởng phụ bản</button></div>
      ` : `
        <div class="dungeon-state"><span class="dungeon-glyph">◇</span><strong>${dungeon.name}</strong><p>Đợt ${game.dungeonWave + 1}/${dungeon.waves.length} · Còn ${game.enemies.filter((enemy) => !enemy.dead).length} quái.<br>${dungeon.mechanic}</p><div class="dungeon-timer">${minutes}:${seconds}</div><p>Ngã xuống, hết giờ hoặc rời sớm: không nhận thưởng hoàn thành.</p><button class="outline-button dungeon-btn" data-dungeon-action="leave">Rời phụ bản</button></div>
      `;
    } else {
      inventoryContent.innerHTML = `<p class="panel-notice">2 phụ bản solo · Chuẩn bị bình tại Tiệm. Phần thưởng cấp một lần cho mỗi lượt hoàn thành, chưa có giới hạn ngày ở bản local.</p>${Object.values(DUNGEONS).map((dungeon) => {
        const unlocked = canEnterDungeon(dungeon.id, player.level, player.dungeonClears);
        const condition = player.level < dungeon.minLevel ? `Cần cấp ${dungeon.minLevel}` : `Cần hoàn thành ${DUNGEONS[dungeon.prerequisite!]?.name ?? "thí luyện"}`;
        return `<div class="dungeon-card"><strong>${dungeon.name}</strong><small>Solo · Cấp ${dungeon.minLevel}+ · ${dungeon.timeLimit / 60} phút · ${dungeon.waves.length} đợt · Đã vượt ${player.dungeonClears[dungeon.id]} lần</small><p>${dungeon.description}</p><div class="dungeon-reward-line"><b>+${dungeon.reward.xp} XP · +${dungeon.reward.gold} bạc · +${dungeon.reward.tokens} token · +${dungeon.reward.stones} đá · 1 đồ Hiếm</b></div><button class="outline-button dungeon-btn" data-dungeon-action="enter" data-dungeon-id="${dungeon.id}" ${unlocked ? "" : "disabled"}>${unlocked ? "Vào phụ bản" : condition}</button></div>`;
      }).join("")}`;
    }
    return;
  }
  const equipped = (["weapon", "armor"] as ItemSlot[]).map((slot) => {
    const item = player.equipment[slot];
    if (!item) return `<div class="equipped-empty">${slot === "weapon" ? "Vũ khí" : "Áo giáp"}: trống</div>`;
    return `<div class="equipped-label">${slot === "weapon" ? "VŨ KHÍ ĐANG DÙNG" : "HỘ GIÁP ĐANG DÙNG"}</div>${itemRow(item, 0, true)}`;
  }).join("");
  const bag = player.inventory.map((item, index) => itemRow(item, index)).join("");
  inventoryContent.innerHTML = `
    <div class="bag-tools"><button class="mini-button" data-save-progress>Lưu</button><button class="mini-button" data-load-progress>Tải</button><button class="mini-button" data-open-shop>Tiệm hồi phục</button></div>
    ${supplyMarkup()}
    ${player.pendingItems.length ? `<div class="pending-rewards"><strong>Đồ chờ nhận · ${player.pendingItems.length} món</strong><p>Thưởng đã giữ lại, kể cả khi tải lại trang.</p><button class="outline-button" data-collect-pending ${player.inventory.length >= BAG_CAPACITY ? "disabled" : ""}>Nhận vào túi</button></div>` : ""}
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
  sectCards.innerHTML = Object.values(SECTS).map(sect => `<button class="sect-card" data-sect="${sect.id}" aria-pressed="${sect.id === selectedSectId}" style="--sect-color:${sect.color}">${spriteMarkup(sect.id, "sect-character-art")}<span class="sect-card-copy"><strong>${sect.name}</strong><small>${sect.element} · ${sect.title.split(" · ")[0]}</small></span></button>`).join("");
  renderSectDetail();
}

function renderSectDetail(): void {
  const sect = SECTS[selectedSectId], definition = sect.kit[previewSkill];
  for (const button of sectCards.querySelectorAll<HTMLButtonElement>("[data-sect]")) button.setAttribute("aria-pressed", String(button.dataset.sect === selectedSectId));
  document.querySelector("#sect-detail")!.innerHTML = `<div class="sect-detail-heading"><strong style="color:${sect.accent}">${sect.name}</strong><span>${sect.title}</span></div><div class="sect-preview-skills">${SKILL_KEYS.map(key => `<button data-preview-skill="${key}" aria-pressed="${previewSkill === key}">${skillGlyphMarkup(key, sect.id)}<span>${sect.kit[key].name}<small>Cấp ${sect.kit[key].unlock}</small></span></button>`).join("")}</div><div class="sect-preview-description"><canvas id="sect-preview" width="128" height="86" aria-label="Xem thử ${definition.name}"></canvas><p><strong>${definition.name}</strong><span>${definition.description}</span><small>${definition.mp} MP · Hồi ${definition.cooldown}s${previewSkill === "ultimate" ? " · 100 nộ" : ""}</small></p></div>`;
  previewCanvas = document.querySelector<HTMLCanvasElement>("#sect-preview");
  document.querySelector("#join-sect")!.textContent = `Gia nhập ${sect.name}`;
}

function drawSectPreview(now: number): void {
  if (!previewCanvas || sectOverlay.classList.contains("hidden")) return;
  const pc = previewCanvas.getContext("2d")!;
  const sect = SECTS[selectedSectId], definition = sect.kit[previewSkill];
  pc.clearRect(0, 0, 128, 86);
  pc.fillStyle = "#182e29"; pc.fillRect(0, 0, 128, 86);
  drawSectEffect(pc, { x: 66, y: 46, radius: 34, color: sect.color, kind: definition.motif, skill: previewSkill, angle: 0 }, (now % 1800) / 1800);
  drawSprite(pc, selectedSectId, 56, 76, HERO_SIZE.width, HERO_SIZE.height);
}

function closeMobileSheet(): void {
  pendingSaleId = null;
  inventoryPanel.classList.remove("mobile-sheet-open");
  mobileSheetBackdrop.classList.remove("show");
}

function openMobileSheet(tab: PanelTab): void {
  if (!game) return showToast("Hãy gia nhập môn phái trước.");
  pendingSaleId = null;
  resetJoystick();
  keys.clear();
  activeTab = tab;
  inventoryPanel.classList.add("mobile-sheet-open");
  mobileSheetBackdrop.classList.add("show");
  refreshUi(true);
}

function resetJoystick(): void {
  joystickPointerId = null;
  touchInput.x = 0;
  touchInput.y = 0;
  joystickKnob.style.transform = "translate(-50%, -50%)";
}

function updateJoystick(event: PointerEvent): void {
  const rect = joystickRing.getBoundingClientRect();
  const maxDistance = rect.width * 0.31;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = event.clientX - centerX;
  const dy = event.clientY - centerY;
  const length = Math.hypot(dx, dy);
  const factor = length > maxDistance ? maxDistance / length : 1;
  const limitedX = dx * factor;
  const limitedY = dy * factor;
  touchInput.x = clamp(limitedX / maxDistance, -1, 1);
  touchInput.y = clamp(limitedY / maxDistance, -1, 1);
  joystickKnob.style.transform = `translate(calc(-50% + ${limitedX}px), calc(-50% + ${limitedY}px))`;
}

joystick.addEventListener("pointerdown", (event) => {
  if (!game) return;
  event.preventDefault();
  joystickPointerId = event.pointerId;
  joystick.setPointerCapture(event.pointerId);
  updateJoystick(event);
});
joystick.addEventListener("pointermove", (event) => {
  if (event.pointerId === joystickPointerId) {
    event.preventDefault();
    updateJoystick(event);
  }
});
joystick.addEventListener("pointerup", (event) => {
  if (event.pointerId === joystickPointerId) resetJoystick();
});
joystick.addEventListener("pointercancel", resetJoystick);
mobilePickup.addEventListener("click", pickupNearby);

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (key === "escape") {
    closeMobileSheet();
    return;
  }
  if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
    event.preventDefault();
    keys.add(key);
  }
  if (event.repeat || !game) return;
  if (key === "1") castSkill("skill1");
  if (key === "2") castSkill("skill2");
  if (key === "3") castSkill("ultimate");
  if (key === "e") pickupNearby();
  if (key === "q") drinkPotion("hp");
  if (key === "r") drinkPotion("mp");
  if (key === "b") {
    if (mobileGameMedia.matches) {
      if (inventoryPanel.classList.contains("mobile-sheet-open")) closeMobileSheet();
      else openMobileSheet("bag");
      return;
    }
    activeTab = "bag";
    document.querySelector(".inventory-panel")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    refreshUi(true);
  }
  if (key === "k") {
    if (mobileGameMedia.matches) {
      openMobileSheet("skills");
      return;
    }
    activeTab = "skills";
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
  if (sect) { selectedSectId = sect; previewSkill = "skill1"; renderSectDetail(); }
});

inventoryContent.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const equipButton = target.closest<HTMLButtonElement>(".equip-btn");
  const enhanceButton = target.closest<HTMLButtonElement>(".enhance-btn");
  const skillButton = target.closest<HTMLButtonElement>(".skill-upgrade");
  const dungeonButton = target.closest<HTMLButtonElement>(".dungeon-btn");
  const saleButton = target.closest<HTMLButtonElement>(".sell-btn");
  const potionButton = target.closest<HTMLButtonElement>("[data-use-potion]");
  const purchaseButton = target.closest<HTMLButtonElement>("[data-buy-potion]");
  if (equipButton) equipItem(Number(equipButton.dataset.index));
  if (enhanceButton) enhanceItem(Number(enhanceButton.dataset.index), enhanceButton.dataset.equipped as ItemSlot | undefined);
  if (skillButton) upgradeSkill(skillButton.dataset.skillRank as SkillKey);
  if (saleButton) sellItem(saleButton.dataset.itemId!);
  if (potionButton) drinkPotion(potionButton.dataset.usePotion as PotionKind);
  if (purchaseButton) purchasePotion(purchaseButton.dataset.buyPotion as PotionKind, Number(purchaseButton.dataset.quantity));
  if (target.closest("[data-collect-pending]")) collectPendingItems();
  if (target.closest("[data-save-progress]")) saveGame();
  if (target.closest("[data-load-progress]")) loadGame();
  if (target.closest("[data-open-shop]")) openMobileSheet("shop");
  if (target.closest("[data-open-bag]")) openMobileSheet("bag");
  if (target.closest("[data-cancel-sale]")) {
    pendingSaleId = null;
    refreshUi(true);
  }
  if (dungeonButton) {
    const action = dungeonButton.dataset.dungeonAction;
    if (action === "enter") enterDungeon(dungeonButton.dataset.dungeonId as DungeonId);
    if (action === "leave") leaveDungeon();
    if (action === "claim") claimDungeonReward();
  }
});

document.querySelectorAll<HTMLButtonElement>(".potion-shortcuts [data-use-potion]").forEach((button) => {
  button.addEventListener("click", () => drinkPotion(button.dataset.usePotion as PotionKind));
});

skillBar.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".skill-button");
  const skill = button?.dataset.skill as SkillKey | undefined;
  if (skill) castSkill(skill);
});

document.querySelectorAll<HTMLButtonElement>(".tab-button").forEach((button) => {
  button.addEventListener("click", () => {
    activeTab = button.dataset.tab as PanelTab;
    pendingSaleId = null;
    refreshUi(true);
  });
});

document.querySelectorAll<HTMLButtonElement>("[data-mobile-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    openMobileSheet(button.dataset.mobileTab as PanelTab);
  });
});

document.querySelectorAll<HTMLButtonElement>("[data-mobile-guild]").forEach((button) => button.addEventListener("click", openGuildRoadmap));
document.querySelectorAll<HTMLButtonElement>("[data-mobile-settings]").forEach((button) => button.addEventListener("click", () => showToast("Cài đặt âm thanh và tài khoản sẽ mở ở mốc vận hành.")));
mobileSheetClose.addEventListener("click", closeMobileSheet);
mobileSheetBackdrop.addEventListener("click", closeMobileSheet);
document.querySelector<HTMLButtonElement>("#quest-toggle")!.addEventListener("click", (event) => {
  const button = event.currentTarget as HTMLButtonElement;
  const expanded = button.closest(".quest-panel")!.classList.toggle("expanded");
  button.setAttribute("aria-expanded", String(expanded));
  button.setAttribute("aria-label", expanded ? "Thu gọn nhiệm vụ" : "Mở chi tiết nhiệm vụ");
});
mobileAuto.addEventListener("click", () => {
  if (!game) return showToast("Hãy gia nhập môn phái trước.");
  game.autoBattle = !game.autoBattle;
  if (game.autoBattle) {
    const target = currentTarget() ?? nearestEnemy(520);
    if (target) game.targetId = target.id;
    addLog(target ? "Đã bật Auto chiến đấu: tự áp sát và đánh mục tiêu gần." : "Đã bật Auto chiến đấu: chưa tìm thấy quái gần đây.");
  } else {
    addLog("Đã tắt Auto chiến đấu.");
  }
  refreshUi(true);
});

document.querySelector<HTMLButtonElement>("#save-btn")!.addEventListener("click", saveGame);
document.querySelector<HTMLButtonElement>("#load-btn")!.addEventListener("click", loadGame);
document.querySelector<HTMLButtonElement>("#reset-btn")!.addEventListener("click", resetGame);
document.querySelector<HTMLButtonElement>("#guild-btn")!.addEventListener("click", openGuildRoadmap);
onlineButton.addEventListener("click", () => {
  if (onlineClient.getStatus() === "online" || onlineClient.getStatus() === "connecting") {
    onlineClient.disconnect();
    return;
  }
  if (!game) {
    showToast("Hãy gia nhập môn phái trước khi kết nối online.");
    return;
  }
  void onlineClient.connect(`Tân nhân ${SECTS[game.player.sect].name}`);
});

document.querySelector("#join-sect")!.addEventListener("click", () => startGame(selectedSectId));
document.querySelector("#resume-sect")!.addEventListener("click", loadGame);
document.querySelector("#sect-detail")!.addEventListener("click", event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-preview-skill]");
  if (button) { previewSkill = button.dataset.previewSkill as SkillKey; renderSectDetail(); }
});
renderSectCards();
refreshUi(true);

function frame(now: number): void {
  const dt = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  update(dt, now);
  if (now - lastDrawTime >= RENDER_INTERVAL_MS) {
    drawWorld(now);
    drawSectPreview(now);
    lastDrawTime = now - (now - lastDrawTime) % RENDER_INTERVAL_MS;
  }
  refreshUi();
  window.requestAnimationFrame(frame);
}

window.requestAnimationFrame(frame);
