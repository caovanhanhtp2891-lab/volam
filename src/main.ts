import "./style.css";
import { idleShell } from "./idle-ui";
import {
  FACTIONS,
  ELEMENTS,
  REGIONS,
  ATTRIBUTES,
  MAX_STAGE,
  factionOf,
  stageInfo,
  normalizeIdle,
  elementalMultiplier,
  completeWave,
  goToStage,
  spendAttribute,
  claimDaily,
  dailyDate,
  offlineReward,
  type IdleProgress,
  type FactionId,
  type Attribute,
  type Element,
} from "./idle";
import { OnlineClient, type OnlineSnapshot, type OnlineStatus } from "./online";
import { drawSprite, spriteMarkup, type SpriteId } from "./art";
import { createMapArt, createTrainingArt } from "./map-art";
import {
  freshMotion,
  updateMotion,
  actionProgress,
  easedPoint,
  flightDuration,
  landingHeight,
  withinReach,
  type ActorMotion,
} from "./combat";
import { drawAnimatedHero, drawEquipmentIcon } from "./combat-art";
import { equipmentMarkup, equipmentTier } from "./equipment-art";
import { RARITIES, RARITY_COLORS, STAT_LABELS, gearStats, totalGearStats, gearScore, rollGearBonuses, equipBestGear, discardCandidates, validBonuses, equipmentGrade, type Rarity, type GearStats, type GearStat, type DiscardFilter } from "./equipment";
import { goldenStatus, goldenWindows, normalizeGoldenClears, claimGoldenKill, countdown, type GoldenWindow } from "./golden-boss";
import {
  drawBattleEffect,
  drawGlow,
  VFX_COLORS,
  drawVfxProjectile,
  skillMarkup,
} from "./battle-vfx";
import { APP_VERSION } from "./release";
import { REALMS, combatPower, cultivationForPower } from "./cultivation";
import { drawCultivationAura } from "./cultivation-art";
import {
  BAG_CAPACITY,
  DUNGEONS,
  POTIONS,
  MAX_POTIONS,
  buyPotion,
  usePotion,
  normalizeSupplies,
  itemSalePrice,
  storeRewardItems,
  recoverPendingItems,
  canEnterDungeon,
  type PotionKind,
  type DungeonId,
} from "./progression";

import { SECTS as SCHOOL_KITS, SECT_BY_FACTION, SKILL_KEYS, HERO_SIZE, selectSkillTargets, type Sect as School, type SkillDefinition, type EffectMotif } from "./sects";
import { drawSectEffect, skillIconMarkup } from "./sect-effects";

type SectId = "kim" | "hoa" | "thuy";
type Sect = School & { skills: [string, string]; ultimate: string };
type ItemSlot =
  | "weapon"
  | "armor"
  | "helmet"
  | "boots"
  | "belt"
  | "necklace"
  | "ring"
  | "ring2"
  | "bracelet"
  | "pendant"
  | "horse";
type PanelTab = "bag" | "smith" | "skills" | "dungeon" | "shop";
type SkillKey = "skill1" | "skill2" | "ultimate";

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
  bonuses?: Partial<GearStats>;
}

interface Player {
  name: string;
  sex: "male" | "female";
  factionId: FactionId;
  idle: IdleProgress;
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
  goldenClears: string[];
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
  element?: Element;
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
  bornAt?: number;
  fromX?: number;
  fromY?: number;
}

interface Telegraph {
  x: number;
  y: number;
  radius: number;
  triggerAt: number;
  damage: number;
  label: string;
}

interface SkillEffect {
  x: number;
  y: number;
  radius: number;
  color: string;
  startedAt: number;
  duration: number;
  kind: "slash" | "burst" | "orb" | "heal" | "shield" | "impact" | "trail" | EffectMotif;
  skill?: SkillKey;
  angle?: number;
  theme?: Element;
}

interface SkillZone extends SkillEffect {
  nextTick: number; multiplier: number; slow: number; source: string;
}

interface Projectile {
  definition?: SkillDefinition;
  skill?: SkillKey;
  from: { x: number; y: number };
  target: Enemy;
  startedAt: number;
  duration: number;
  multiplier: number;
  area: number;
  source: string;
  theme: Element;
}
interface PendingStrike {
  definition?: SkillDefinition;
  range?: number;
  healing?: { ratio: number; used: boolean };
  target?: Enemy;
  x: number;
  y: number;
  radius: number;
  multiplier: number;
  source: string;
  at: number;
}
interface CombatState {
  motion: ActorMotion;
  enemyMotions: Map<string, ActorMotion>;
  projectiles: Projectile[];
  strikes: PendingStrike[];
  corpses: { enemy: Enemy; at: number }[];
  pickups: { loot: GroundLoot; at: number; duration: number }[];
  dash: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    at: number;
    duration: number;
  } | null;
  lootTarget: string | null;
}
function freshCombat(): CombatState {
  return {
    motion: freshMotion(),
    enemyMotions: new Map(),
    projectiles: [],
    strikes: [],
    corpses: [],
    pickups: [],
    dash: null,
    lootTarget: null,
  };
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
  combat: CombatState;
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
  goldenEncounter?: { window: GoldenWindow; enemies: Enemy[]; loot: GroundLoot[]; x: number; y: number; inTown: boolean; autoBattle: boolean };
  onlinePlayers: OnlineSnapshot["players"];
  autoBattle: boolean;
}

const WORLD_WIDTH = 1900;
const WORLD_HEIGHT = 1200;
let VIEW_WIDTH = 960;
let VIEW_HEIGHT = 600;
const MOBILE_GAME_QUERY =
  "(max-width: 600px) and (orientation: portrait), (max-width: 1000px) and (max-height: 500px) and (orientation: landscape)";
const mobileGameMedia = window.matchMedia(MOBILE_GAME_QUERY);
const RENDER_INTERVAL_MS = 1000 / 30;
const PLAYER_START = { x: 300, y: 360 };
const LEGACY_SAVE_KEY = "giang-ho-di-truyen-prototype";
let activeSlot = 0;
try {
  activeSlot = Math.min(
    2,
    Math.max(
      0,
      Math.floor(Number(localStorage.getItem("giang-ho-active-slot")) || 0),
    ),
  );
} catch {
  /* Storage may be unavailable. */
}
const slotKey = (slot: number) =>
  slot === 0 ? LEGACY_SAVE_KEY : `${LEGACY_SAVE_KEY}-slot-${slot + 1}`;
let SAVE_KEY = slotKey(activeSlot);
let idlePage = "log";
let idleNextWave = 0;
let lastAutoSave = 0;
let lastAutoAction = 0;
let characterRenderKey = "";
let regionRenderKey = "";
let audioContext: AudioContext | null = null;

// Legacy archetypes remain valid in old save files; factionId selects the full kit.
const SECTS: Record<SectId, School> = {
  kim: SCHOOL_KITS["thien-vuong"],
  hoa: SCHOOL_KITS["cai-bang"],
  thuy: SCHOOL_KITS["nga-mi"],
};

const GEAR_SLOTS: Record<ItemSlot, { name: string; icon: string }> = {
  weapon: { name: "Vũ khí", icon: "⚔" },
  armor: { name: "Áo giáp", icon: "◈" },
  helmet: { name: "Mũ", icon: "♜" },
  boots: { name: "Giày", icon: "♟" },
  belt: { name: "Đai lưng", icon: "▰" },
  necklace: { name: "Dây chuyền", icon: "◇" },
  ring: { name: "Nhẫn 1", icon: "○" },
  bracelet: { name: "Hộ uyển", icon: "⊙" },
  ring2: { name: "Nhẫn 2", icon: "○" },
  pendant: { name: "Ngọc bội", icon: "♦" },
  horse: { name: "Ngựa", icon: "♞" },
};

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Không tìm thấy #app");

app.innerHTML = idleShell();
document.documentElement.dataset.version = APP_VERSION;

const canvasElement = document.querySelector<HTMLCanvasElement>("#game-canvas");
if (!canvasElement) throw new Error("Không tìm thấy game canvas");
const canvas: HTMLCanvasElement = canvasElement;
const context = canvas.getContext("2d");
if (!context) throw new Error("Không khởi tạo được canvas context");
const ctx: CanvasRenderingContext2D = context;

function resizeGameViewport(): void {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const scale = Math.min(
    1.6,
    (rect.width > rect.height ? 1100 : 720) / rect.width,
    1020 / rect.height,
  );
  // Match the rendered aspect ratio so characters and hit targets never stretch.
  const nextWidth = Math.round(rect.width * scale);
  const nextHeight = Math.round(rect.height * scale);
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
const inventoryContent =
  document.querySelector<HTMLDivElement>("#inventory-content")!;
const targetContent =
  document.querySelector<HTMLDivElement>("#target-content")!;
const targetPanel = document.querySelector<HTMLElement>(".target-panel")!;
const miniMap = document.querySelector<HTMLCanvasElement>("#mobile-minimap")!;
const miniMapContext = miniMap.getContext("2d")!;
const logList = document.querySelector<HTMLDivElement>("#log-list")!;
const toast = document.querySelector<HTMLDivElement>("#toast")!;
const skillBar = document.querySelector<HTMLDivElement>("#skill-bar")!;
const canvasTip = document.querySelector<HTMLDivElement>("#canvas-tip")!;
const canvasBadge = document.querySelector<HTMLDivElement>("#canvas-badge")!;
const combatStatusText = document.querySelector<HTMLSpanElement>(
  "#combat-status-text",
)!;
const joystick = document.querySelector<HTMLDivElement>("#joystick")!;
const joystickRing = document.querySelector<HTMLDivElement>(".joystick-ring")!;
const joystickKnob = document.querySelector<HTMLDivElement>("#joystick-knob")!;
const mobilePickup =
  document.querySelector<HTMLButtonElement>("#mobile-pickup")!;
const mobileAuto = document.querySelector<HTMLButtonElement>("#mobile-auto")!;
const mobileChat = document.querySelector<HTMLDivElement>("#mobile-chat")!;
const inventoryPanel = document.querySelector<HTMLElement>(".inventory-panel")!;
const mobileSheetBackdrop = document.querySelector<HTMLDivElement>(
  "#mobile-sheet-backdrop",
)!;
const mobileSheetClose = document.querySelector<HTMLButtonElement>(
  "#mobile-sheet-close",
)!;
const connectionLabel =
  document.querySelector<HTMLSpanElement>("#connection-label")!;
const connectionPill =
  document.querySelector<HTMLSpanElement>("#connection-pill")!;
const onlineButton = document.querySelector<HTMLButtonElement>("#online-btn")!;
const keys = new Set<string>();
let game: GameState | null = null;
let activeTab: PanelTab = "bag";
let lastFrame = performance.now();
let lastDrawTime = 0;
let lastMiniMapDraw = 0;
let lastUiUpdate = 0;
let toastTimer = 0;
let renderedSkillSect: string | null = null;
let selectedFaction: FactionId = "shaolin";
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
    onlineButton.textContent =
      status === "online" ? "Ngắt kết nối" : "Kết nối online";
    if (status === "online") {
      if (game)
        addLog(
          "Đã vào máy chủ online. Bạn có thể thấy người chơi khác trong Rừng Trúc.",
        );
      else showToast("Đã kết nối máy chủ online.");
    } else if (detail && game) {
      addLog(`Online: ${detail}`);
    }
  },
  onSnapshot: (snapshot: OnlineSnapshot) => {
    if (!game) return;
    game.onlinePlayers = snapshot.players.filter(
      (player) => player.id !== snapshot.self.id,
    );
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
  {
    id: "guide",
    name: "Mộc sư huynh",
    title: "Người dẫn đường",
    x: 170,
    y: 300,
    color: "#72d1a0",
    icon: "?",
  },
  {
    id: "smith",
    name: "Lão Thiết",
    title: "Thợ rèn",
    x: 170,
    y: 470,
    color: "#e9c875",
    icon: "⚒",
  },
  {
    id: "merchant",
    name: "Châu thương nhân",
    title: "Bình HP/MP · Mua bán",
    x: 280,
    y: 540,
    color: "#e6bd6e",
    icon: "◆",
  },
  {
    id: "dungeon",
    name: "Sứ giả thí luyện",
    title: "2 phụ bản solo · Cấp 3+",
    x: 1710,
    y: 300,
    color: "#a787e8",
    icon: "◇",
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);
const randomBetween = (min: number, max: number) =>
  Math.random() * (max - min) + min;
const randomInt = (min: number, max: number) =>
  Math.floor(randomBetween(min, max + 1));
const formatNumber = (value: number) =>
  Math.floor(value).toLocaleString("vi-VN");
const xpToNext = (level: number) =>
  Math.floor(100 + 35 * level + 8 * level * level);
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

function itemColor(rarity: Rarity): string { return RARITY_COLORS[rarity]; }

function itemRarity(): Rarity {
  const roll = Math.random();
  if (roll < 0.02) return "Cực phẩm";
  if (roll < 0.12) return "Hiếm";
  if (roll < 0.43) return "Tốt";
  return "Thường";
}

function itemPower(level: number, rarity: Rarity, slot: ItemSlot): number {
  const rarityMultiplier: Record<Rarity, number> = {
    Thường: 1,
    Tốt: 1.18,
    Hiếm: 1.42,
    "Cực phẩm": 1.8,
    "Hoàng Kim": 2.5,
  };
  const base = slot === "weapon" ? 9 + level * 2.1 : 8 + level * 2.4;
  return Math.floor(base * rarityMultiplier[rarity] + randomBetween(-2, 3));
}

function createItem(
  level: number,
  forcedRarity?: Rarity,
  forcedSlot?: ItemSlot,
): Item {
  const rarity = forcedRarity ?? itemRarity();
  const slot =
    forcedSlot ??
    (Object.keys(GEAR_SLOTS) as ItemSlot[])[
      randomInt(0, Object.keys(GEAR_SLOTS).length - 1)
    ];
  const names =
    slot === "weapon"
      ? ["Kiếm", "Đao", "Phiến", "Trượng"]
      : [GEAR_SLOTS[slot].name];
  const prefix: Record<Rarity, string> = {
    Thường: "Mộc",
    Tốt: "Thanh",
    Hiếm: "Tử Vân",
    "Cực phẩm": "Thiên Cơ",
    "Hoàng Kim": "Hoàng Kim",
  };
  const icon = GEAR_SLOTS[slot].icon;
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: `${prefix[rarity]} ${names[randomInt(0, names.length - 1)]}`,
    slot,
    rarity,
    level,
    power: itemPower(level, rarity, slot),
    bonuses: rollGearBonuses(level, rarity, slot),
    enhance: 0,
    color: itemColor(rarity),
    icon,
  };
}

function createStarterItem(slot: ItemSlot, sect: SectId, sectName = SECTS[sect].name): Item {
  return {
    id: `starter-${slot}-${sect}`,
    name: slot === "weapon" ? `${sectName} Tân Kiếm` : "Áo Vải Hành Cước",
    slot,
    rarity: "Tốt",
    level: 1,
    power: slot === "weapon" ? 13 : 10,
    bonuses: rollGearBonuses(1, "Tốt", slot),
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
    attack: Math.floor(
      (8 + level * 2.6) * (kind === "boss" ? 1.6 : kind === "elite" ? 1.2 : 1),
    ),
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
    createEnemy(
      "bandit-1",
      "Sơn tặc trinh sát",
      "normal",
      560,
      330,
      2,
      "#c86e66",
    ),
    createEnemy(
      "bandit-2",
      "Sơn tặc trinh sát",
      "normal",
      690,
      430,
      2,
      "#c86e66",
    ),
    createEnemy(
      "bandit-3",
      "Sơn tặc đao thủ",
      "normal",
      790,
      300,
      3,
      "#d88365",
    ),
    createEnemy(
      "bandit-4",
      "Sơn tặc đao thủ",
      "normal",
      840,
      570,
      3,
      "#d88365",
    ),
    createEnemy(
      "bandit-5",
      "Sơn tặc cung thủ",
      "normal",
      620,
      700,
      4,
      "#a86f99",
    ),
    createEnemy(
      "bandit-6",
      "Sơn tặc cung thủ",
      "normal",
      910,
      730,
      4,
      "#a86f99",
    ),
    createEnemy("wolf-1", "Trúc Lang", "normal", 1090, 640, 5, "#7d98a6"),
    createEnemy("wolf-2", "Trúc Lang", "normal", 1220, 520, 5, "#7d98a6"),
    createEnemy(
      "guard-1",
      "Hắc Phong tinh anh",
      "elite",
      1160,
      780,
      6,
      "#d59d4c",
    ),
    createEnemy("lang-vuong", "Lang Vương", "boss", 1510, 780, 8, "#8d5bd1"),
  ];
}

function makeDungeonEnemies(id: DungeonId, wave: number): Enemy[] {
  return DUNGEONS[id].waves[wave].map((enemy) =>
    createEnemy(
      enemy.id,
      enemy.name,
      enemy.kind,
      enemy.x,
      enemy.y,
      enemy.level,
      enemy.color,
    ),
  );
}

function createGame(sectId: SectId, factionId?: FactionId): GameState {
  const faction = factionOf(factionId, sectId);
  const sect = SCHOOL_KITS[SECT_BY_FACTION[faction.id]];
  const player: Player = {
    ...PLAYER_START,
    name:
      document
        .querySelector<HTMLInputElement>("#hero-name-input")!
        .value.trim()
        .slice(0, 16) || faction.name,
    sex:
      document.querySelector<HTMLSelectElement>("#hero-sex-input")!.value ===
        "female" ||
      (document.querySelector<HTMLSelectElement>("#hero-sex-input")!.value ===
        "auto" &&
        ["emei", "cuiyan"].includes(faction.id))
        ? "female"
        : "male",
    factionId: faction.id,
    idle: normalizeIdle(),
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
      weapon: createStarterItem("weapon", sectId, sect.name),
      armor: createStarterItem("armor", sectId, sect.name),
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
    goldenClears: [],
    facingX: 1,
    facingY: 0,
  };
  const state: GameState = {
    combat: freshCombat(),
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
  prepareIdleWave();
  state.autoBattle = true;
  addLog(
    `Bạn đã gia nhập ${sect.name}. Bắt đầu hành tẩu giang hồ tại Hoa Sơn.`,
  );
  addLog("Nhân vật tự chiến đấu. Mỗi ải có 4 đợt, trùm xuất hiện ở ải thứ 10.");
  return state;
}

function addLog(message: string): void {
  if (!game) return;
  game.logs.push(message);
  if (game.logs.length > 40) game.logs.shift();
  // Routine damage already has floating numbers and the combat log.
  if (
    !/\d+ sát thương\.$/.test(message) &&
    !/bị đánh bại\.|^\+\d+ bạc/.test(message)
  )
    showToast(message);
}

function showToast(message: string): void {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2300);
}

function equipmentBonuses(): GearStats {
  return totalGearStats(game ? Object.values(game.player.equipment) : []);
}
function equipmentAttack(): number { return equipmentBonuses().attack; }
function equipmentDefense(): number { return equipmentBonuses().defense; }
function criticalChance(): number { return Math.min(40, 12 + equipmentBonuses().crit); }

function effectiveAttack(): number {
  return game
    ? game.player.attack +
        equipmentAttack() +
        game.player.idle.attributes.strength * 2
    : 0;
}

function effectiveDefense(): number {
  return game
    ? game.player.defense +
        equipmentDefense() +
        game.player.idle.attributes.dexterity
    : 0;
}

function currentCombatPower(): number {
  const gear = equipmentBonuses();
  return Math.floor(combatPower(
    effectiveAttack(),
    effectiveDefense(),
    game?.player.maxHp ?? 0,
  ) + gear.mp * .1 + gear.crit * 8 + gear.speed * 2);
}

function skillScale(skill: SkillKey, base: number): number {
  if (!game) return base;
  const rank = game.player.skillRanks[skill] ?? 0;
  return base + Math.max(0, rank - 1) * 0.14;
}

function addSkillEffect(effect: Omit<SkillEffect, "startedAt">): void {
  if (!game) return;
  game.effects.push({
    theme: factionOf(game.player.factionId).element,
    ...effect,
    startedAt: nowMs(),
  });
  if (game.effects.length > 24)
    game.effects.splice(0, game.effects.length - 24);
}

function addFloatingText(
  x: number,
  y: number,
  text: string,
  color: string,
  size = 18,
): void {
  if (!game) return;
  game.floatingTexts.push({
    x,
    y,
    text,
    color,
    startedAt: nowMs(),
    duration: 900,
    size,
  });
  if (game.floatingTexts.length > 60)
    game.floatingTexts.splice(0, game.floatingTexts.length - 60);
}

function upgradeSkill(skill: SkillKey): void {
  if (!game) return;
  const player = game.player;
  const unlockLevel: Record<SkillKey, number> = {
    skill1: 1,
    skill2: 3,
    ultimate: 5,
  };
  const maxRank = 20;
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
  addLog(
    `Đã nâng ${skill === "ultimate" ? playerSect(player).ultimate : playerSect(player).skills[skill === "skill1" ? 0 : 1]} lên bậc ${player.skillRanks[skill]}.`,
  );
  persistGame();
  refreshUi(true);
}

function checkMainQuest(): void {
  if (!game) return;
  const player = game.player;
  if (
    player.questKills >= 5 &&
    player.bossDefeated &&
    !player.questRewardClaimed
  ) {
    player.questRewardClaimed = true;
    player.gold += 300;
    rewardExperience(100);
    addLog("Nhiệm vụ Dấu chân trong Rừng Trúc hoàn tất: +100 XP · +300 bạc.");
  }
}

function enterDungeon(id: DungeonId): void {
  if (!game) return;
  if (game.goldenEncounter) return showToast("Rời boss Hoàng Kim trước khi vào phụ bản.");
  const dungeon = DUNGEONS[id];
  if (!dungeon) return;
  if (game.mapMode === "dungeon") {
    addLog("Bạn đang ở trong phụ bản.");
    return;
  }
  if (!canEnterDungeon(id, game.player.level, game.player.dungeonClears)) {
    addLog(
      `Cần cấp ${dungeon.minLevel}${dungeon.prerequisite ? ` và hoàn thành ${DUNGEONS[dungeon.prerequisite].name}` : ""} để vào ${dungeon.name}.`,
    );
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
  game.combat = freshCombat();
  game.floatingTexts = [];
  resetJoystick();
  keys.clear();
  game.player.x = 300;
  game.player.y = 690;
  canvasBadge.innerHTML = `<span class="live-dot"></span> ${dungeon.shortName} · SOLO`;
  canvasTip.textContent = `${dungeon.name} · Đợt 1/${dungeon.waves.length}`;
  addLog(
    `Đã vào ${dungeon.name}. Dọn hết từng đợt trong ${dungeon.timeLimit / 60} phút, quái không hồi sinh.`,
  );
  closeMobileSheet();
  refreshUi(true);
}

function advanceDungeonWave(): void {
  if (
    !game ||
    game.mapMode !== "dungeon" ||
    !game.dungeonId ||
    game.dungeonCleared ||
    game.enemies.some((enemy) => !enemy.dead)
  )
    return;
  const dungeon = DUNGEONS[game.dungeonId];
  if (game.dungeonWave + 1 >= dungeon.waves.length) {
    game.dungeonCleared = true;
    game.dungeonTimeLeft = 0;
    game.telegraphs = [];
    game.targetId = null;
    game.moveTarget = null;
    addLog(
      `${dungeon.name} hoàn thành! Mở Phụ bản để nhận thưởng. Đồ chưa nhặt sẽ được thu hồi.`,
    );
    return;
  }
  game.dungeonWave += 1;
  game.enemies = makeDungeonEnemies(game.dungeonId, game.dungeonWave);
  game.targetId = null;
  game.telegraphs = [];
  canvasTip.textContent = `${dungeon.name} · Đợt ${game.dungeonWave + 1}/${dungeon.waves.length}`;
  addLog(
    `Đợt ${game.dungeonWave + 1}/${dungeon.waves.length}: ${game.enemies.map((enemy) => enemy.name).join(", ")}.`,
  );
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
  game.combat = freshCombat();
  game.floatingTexts = [];
  resetJoystick();
  keys.clear();
  game.player.x = PLAYER_START.x;
  game.player.y = PLAYER_START.y;
  if (playerIdleActive()) {
    game.player.x = 950;
    game.player.y = 650;
  }
  canvasBadge.innerHTML = `<span class="live-dot"></span> RỪNG TRÚC · KÊNH 01`;
  canvasTip.textContent = "Click quái để áp sát · E để nhặt đồ quanh bạn";
  if (!cleared) addLog("Bạn đã rời phụ bản trước khi hoàn thành.");
  refreshUi(true);
}

function claimDungeonReward(): void {
  if (
    !game ||
    game.mapMode !== "dungeon" ||
    !game.dungeonId ||
    !game.dungeonCleared ||
    game.dungeonRewardClaimed
  )
    return;
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
  addLog(
    `Nhận thưởng ${dungeon.name}: +${dungeon.reward.xp} XP · +${dungeon.reward.gold} bạc · +${dungeon.reward.tokens} token · +${dungeon.reward.stones} đá. Đã thu hồi đồ chưa nhặt.`,
  );
  if (player.pendingItems.length)
    addLog(
      `${player.pendingItems.length} món đang chờ trong Túi đồ → Đồ chờ nhận, không bị mất khi túi đầy.`,
    );
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
    addFloatingText(
      player.x,
      player.y - 38,
      `+${amount} ${POTIONS[kind].label}`,
      POTIONS[kind].color,
      16,
    );
    addLog(`${POTIONS[kind].name}: hồi ${amount} ${POTIONS[kind].label}.`);
    persistGame();
  } else if (result === "cooldown")
    addLog(
      `Bình hồi phục dùng chung hồi chiêu: còn ${Math.ceil(player.potionCooldown)} giây.`,
    );
  else if (result === "empty")
    addLog(`Hết ${POTIONS[kind].name}. Mở Túi đồ → Tiệm để mua.`);
  else if (result === "full")
    addLog(`${POTIONS[kind].label} đã đầy, không tiêu hao bình.`);
  refreshUi(true);
}

function purchasePotion(kind: PotionKind, quantity: number): void {
  if (!game || !Object.hasOwn(POTIONS, kind)) return;
  if (game.mapMode !== "world")
    return addLog(
      "Tiệm chỉ mở ở Rừng Trúc. Hãy chuẩn bị bình trước khi vào phụ bản.",
    );
  const result = buyPotion(game.player, kind, quantity);
  if (result === "bought") {
    addLog(
      `Mua ${quantity} ${POTIONS[kind].name}: -${POTIONS[kind].price * quantity} bạc.`,
    );
    persistGame();
  } else if (result === "poor")
    addLog("Không đủ bạc. Hãy bán trang bị thừa hoặc săn thêm quái.");
  else if (result === "full")
    addLog(`Mỗi loại bình chỉ chứa tối đa ${MAX_POTIONS}.`);
  refreshUi(true);
}

function sellItem(id: string): void {
  if (!game) return;
  if (game.mapMode !== "world")
    return addLog("Hãy về Rừng Trúc trước khi bán trang bị.");
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
  addLog(
    `Đã bán ${item.name}${item.enhance ? ` +${item.enhance}` : ""}: +${gold} bạc.`,
  );
  persistGame();
  refreshUi(true);
}

function collectPendingItems(): void {
  if (!game) return;
  const count = recoverPendingItems(game.player);
  addLog(
    count
      ? `Đã nhận ${count} món từ đồ chờ nhận.`
      : "Túi đã đầy. Bán bớt trang bị để nhận đồ chờ.",
  );
  persistGame();
  refreshUi(true);
}

function syncStats(fullHeal = false): void {
  if (!game) return;
  const player = game.player;
  const sect = playerSect(player);
  const oldMaxHp = player.maxHp;
  player.maxHp =
    sect.baseHp +
    (player.level - 1) * 34 +
    Math.floor(equipmentDefense() * 1.45) +
    player.idle.attributes.vitality * 12 + equipmentBonuses().hp;
  player.maxMp =
    sect.baseMp + (player.level - 1) * 13 + player.idle.attributes.energy * 8 + equipmentBonuses().mp;
  player.speed = sect.speed + player.idle.attributes.dexterity + equipmentBonuses().speed;
  if (fullHeal) {
    player.hp = player.maxHp;
    player.mp = player.maxMp;
  } else {
    player.hp = clamp(player.hp + player.maxHp - oldMaxHp, 1, player.maxHp);
    player.mp = clamp(player.mp, 0, player.maxMp);
  }
}

function isBlocked(x: number, y: number, radius: number): boolean {
  if (
    x - radius < 24 ||
    x + radius > WORLD_WIDTH - 24 ||
    y - radius < 24 ||
    y + radius > WORLD_HEIGHT - 24
  )
    return true;
  if (
    game?.goldenEncounter ||
    game?.mapMode === "dungeon" ||
    (game?.player.idle.enabled && !game.player.idle.inTown)
  )
    return false;
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
  return enemy.defenseDownUntil > nowMs()
    ? Math.floor(enemy.defense * 0.72)
    : enemy.defense;
}

function currentTarget(): Enemy | undefined {
  if (!game || !game.targetId) return undefined;
  return game.enemies.find(
    (enemy) => enemy.id === game?.targetId && !enemy.dead,
  );
}

function nearestEnemy(
  maxDistance = Number.POSITIVE_INFINITY,
): Enemy | undefined {
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
  const critical = Math.random() < criticalChance() / 100;
  const raw =
    effectiveAttack() *
    multiplier *
    (enemy.element
      ? elementalMultiplier(
          factionOf(game.player.factionId).element,
          enemy.element,
        )
      : 1);
  playCombatSound(critical ? 460 : 280);
  const reduced = Math.max(
    1,
    Math.floor(
      raw *
        (1 -
          enemyDefense(enemy) /
            (enemyDefense(enemy) + 80 + game.player.level * 12)),
    ),
  );
  const damage = critical ? Math.floor(reduced * 1.5) : reduced;
  enemy.hp = Math.max(0, enemy.hp - damage);
  enemy.hitFlash = 0.16;
  const enemyMotion = game.combat.enemyMotions.get(enemy.id);
  if (enemyMotion) enemyMotion.hurtUntil = nowMs() + 150;
  addSkillEffect({
    x: enemy.x,
    y: enemy.y - 20,
    radius: critical ? 50 : 36,
    color: playerSect(game.player).color,
    kind: "impact",
    duration: 450,
  });
  game.player.rage = clamp(game.player.rage + 7, 0, 100);
  addFloatingText(
    enemy.x + randomBetween(-8, 8),
    enemy.y - enemy.radius - 7,
    `-${damage}`,
    critical ? "#ffe28a" : "#fff1d1",
    critical ? 23 : 18,
  );
  if (critical) addLog(`${source}: chí mạng ${damage} sát thương.`);
  if (enemy.hp <= 0) killEnemy(enemy);
}

function dealAreaDamage(
  x: number,
  y: number,
  radius: number,
  multiplier: number,
  source: string,
): void {
  if (!game) return;
  const targets = game.enemies.filter(
    (enemy) =>
      !enemy.dead && distance({ x, y }, enemy) <= radius + enemy.radius,
  );
  if (targets.length === 0) {
    addLog(`${source} không đánh trúng mục tiêu nào.`);
    return;
  }
  for (const target of targets) dealDamage(target, multiplier, source);
}

function faceTarget(target: { x: number; y: number }): void {
  if (!game) return;
  const player = game.player,
    d = distance(player, target);
  if (d < 0.1) return;
  player.facingX = game.combat.motion.facingX = (target.x - player.x) / d;
  player.facingY = game.combat.motion.facingY = (target.y - player.y) / d;
}
function animateAction(action: ActorMotion["action"], duration: number): void {
  if (!game) return;
  Object.assign(game.combat.motion, {
    action,
    actionAt: nowMs(),
    actionDuration: duration,
  });
}
function queueStrike(
  target: Enemy | undefined,
  x: number,
  y: number,
  radius: number,
  multiplier: number,
  source: string,
  delay = 140,
): void {
  game?.combat.strikes.push({
    target,
    x,
    y,
    radius,
    multiplier,
    source,
    at: nowMs() + delay,
  });
}
function launchProjectile(
  target: Enemy,
  multiplier: number,
  source: string,
  area = 0,
): void {
  if (!game) return;
  const from = { x: game.player.x, y: game.player.y - 24 };
  game.combat.projectiles.push({
    from,
    target,
    startedAt: nowMs() + 110,
    duration: flightDuration(from, target),
    multiplier,
    area,
    source,
    theme: factionOf(game.player.factionId).element,
  });
}
function actionLocked(): boolean {
  return Boolean(
    game &&
      game.combat.motion.action !== "idle" &&
      nowMs() < game.combat.motion.actionAt + game.combat.motion.actionDuration,
  );
}
function basicAttackRange(): number {
  return game ? playerSect(game.player).basicRange : 88;
}
function playerBasicAttack(): void {
  if (!game || game.player.attackCooldown > 0 || actionLocked()) return;
  const target = currentTarget();
  if (
    !target ||
    !withinReach(game.player, target, basicAttackRange(), target.radius)
  )
    return;
  game.player.attackCooldown = 0.62;
  faceTarget(target);
  const color = playerSect(game.player).color;
  animateAction(basicAttackRange() <= 100 ? "attack" : "cast", 320);
  if (basicAttackRange() <= 100) {
    queueStrike(target, target.x, target.y, 0, 1, "Đánh thường", 110);
    addSkillEffect({
      x: game.player.x,
      y: game.player.y - 18,
      radius: 85,
      color,
      duration: 450,
      kind: "slash",
      angle: Math.atan2(target.y - game.player.y, target.x - game.player.x),
    });
  } else launchProjectile(target, 1, "Đánh thường");
}

function planDash(player: Player, target: Enemy): { x: number; y: number } | null {
  const angle = Math.atan2(target.y - player.y, target.x - player.x);
  const travel = Math.max(0, distance(player, target) - target.radius - player.radius - 8);
  let x = player.x, y = player.y;
  for (let step = 0; step < Math.ceil(travel / 6); step++) {
    const length = Math.min(6, travel - step * 6);
    x += Math.cos(angle) * length; y += Math.sin(angle) * length;
    if (isBlocked(x, y, player.radius)) return null;
  }
  return { x, y };
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

function castSkill(key: SkillKey, automatic = false): void {
  if (!game) return;
  const player = game.player, sect = playerSect(player), definition = sect.kit[key];
  const warn = (message: string) => { if (!automatic) showToast(message); };
  if (player.level < definition.unlock) return warn(`${definition.name} mở ở cấp ${definition.unlock}.`);
  if (player.cooldowns[key] > 0 || actionLocked()) return;
  if (player.mp < definition.mp) return warn(`Cần ${definition.mp} MP để dùng ${definition.name}.`);
  if (key === "ultimate" && player.rage < 100) return warn("Chưa đủ 100 nộ để thi triển tuyệt chiêu.");
  // A selected distant target stays selected: never silently cast at a different enemy.
  const target = currentTarget() ?? nearestEnemy(definition.range);
  const selection = selectSkillTargets(definition, player, game.enemies, target);
  if (!selection.valid) return warn(`${definition.name} cần mục tiêu trong tầm ${definition.range}.`);
  const dashPoint = definition.dash && target ? planDash(player, target) : null;
  if (definition.dash && !dashPoint) {
    game.targetId = null;
    return warn("Đường lướt bị vật cản chặn. Hãy chọn vị trí khác.");
  }
  const now = nowMs();
  player.mp -= definition.mp;
  player.cooldowns[key] = definition.cooldown;
  onlineClient.sendSkill(key);
  if (target) faceTarget(target);
  if (dashPoint) {
    game.combat.dash = { from: { x: player.x, y: player.y }, to: dashPoint, at: now, duration: 220 };
    animateAction("dash", 320);
  } else animateAction(sect.basicRange <= 100 ? "attack" : "cast", key === "ultimate" ? 650 : 440);
  const multiplier = skillScale(key, definition.damage);
  const healing = definition.healOnHit && definition.heal
    ? { ratio: definition.heal + Math.max(0, player.skillRanks[key] - 1) * .025, used: false }
    : undefined;
  for (const [index, enemy] of selection.targets.entries()) {
    const falloff = definition.shape === "chain" ? .8 ** index : 1;
    if (definition.damage > 0) for (let hit = 0; hit < (definition.hits ?? 1); hit++) {
      if (definition.anchor === "target" && definition.range > 160 && !definition.dash) {
        launchProjectile(enemy, multiplier * falloff, definition.name);
        const projectile = game.combat.projectiles[game.combat.projectiles.length - 1];
        projectile.definition = definition; projectile.skill = key;
        projectile.startedAt += hit * 70;
      } else {
        game.combat.strikes.push({ target: enemy, x: enemy.x, y: enemy.y, radius: 0, multiplier: multiplier * falloff, source: definition.name, at: now + (dashPoint ? 240 : 150) + hit * 70, definition, range: definition.range, healing });
      }
    }
    if (definition.shape === "chain") addSkillEffect({ x: enemy.x, y: enemy.y, radius: 35, color: sect.color, duration: 500, kind: definition.motif, skill: key });
  }
  if (definition.heal && !definition.healOnHit) {
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
  if (!automatic) refreshUi(true);
}



function rewardExperience(amount: number): void {
  if (!game) return;
  const player = game.player;
  player.xp += amount;
  addFloatingText(player.x, player.y - 35, `+${amount} XP`, "#a9e8a8", 13);
  let leveled = false;
  while (player.xp >= xpToNext(player.level) && player.level < 160) {
    player.xp -= xpToNext(player.level);
    player.level += 1;
    leveled = true;
    player.skillPoints += 1;
    player.idle.attributePoints += 5;
    player.attack += 3;
    player.defense += 2;
    player.maxHp += 34;
    player.maxMp += 13;
  }
  if (leveled) {
    syncStats(true);
    addFloatingText(
      player.x,
      player.y - 62,
      `CẤP ${player.level}!`,
      "#ffe18a",
      23,
    );
    addLog(
      `Bạn đã đạt cấp ${player.level}. Chỉ số được tăng và hồi đầy sinh lực.`,
    );
    addLog("Nhận 1 điểm võ học. Mở tab Võ công để nâng chiêu.");
    if (player.level >= 3 && player.skillRanks.skill2 === 0) {
      player.skillRanks.skill2 = 1;
      addLog(`Đã mở ${playerSect(player).skills[1]} — nhấn phím 2.`);
    }
    if (player.level >= 5 && player.skillRanks.ultimate === 0) {
      player.skillRanks.ultimate = 1;
      addLog(
        `Đã mở tuyệt chiêu ${playerSect(player).ultimate} — tích đủ 100 nộ rồi nhấn phím 3.`,
      );
    }
  }
}

function killEnemy(enemy: Enemy): void {
  if (!game || enemy.dead) return;
  if (game.goldenEncounter && enemy.id.startsWith("golden-")) { killGoldenBoss(enemy); return; }
  enemy.dead = true;
  game.combat.corpses.push({ enemy: { ...enemy }, at: nowMs() });
  if (game.combat.corpses.length > 16) game.combat.corpses.shift();
  const idleFight = game.mapMode === "world" && playerIdleActive();
  enemy.respawnAt =
    idleFight || game.mapMode === "dungeon" || enemy.kind === "boss"
      ? Number.POSITIVE_INFINITY
      : nowMs() + 8000;
  if (idleFight) {
    game.player.idle.totalKills++;
    if (enemy.kind === "boss") game.player.idle.bossKills++;
  }
  const player = game.player;
  const xp =
    enemy.kind === "boss"
      ? 520
      : enemy.kind === "elite"
        ? 150
        : 42 + enemy.level * 8;
  rewardExperience(xp);
  if (enemy.id.startsWith("bandit-") && game.mapMode === "world") {
    player.questKills += 1;
    checkMainQuest();
  }
  if (game.targetId === enemy.id) game.targetId = null;
  if (enemy.kind === "boss") {
    if (game.mapMode === "dungeon") {
      addLog(`${enemy.name} đã gục ngã!`);
    } else if (idleFight) {
      addLog(`${enemy.name} đã gục ngã! Nhận trang bị Cực phẩm.`);
    } else {
      player.bossDefeated = true;
      game.lastBossDefeatedAt = nowMs();
      addLog("Lang Vương đã gục ngã! Bạn nhận được phần thưởng Cực phẩm.");
      checkMainQuest();
    }
  } else {
    addLog(`${enemy.name} bị đánh bại. +${xp} XP.`);
  }
  const chance =
    enemy.kind === "boss" ? 1 : enemy.kind === "elite" ? 0.92 : 0.32;
  if (Math.random() <= chance) {
    const forced =
      enemy.kind === "boss"
        ? "Cực phẩm"
        : enemy.kind === "elite"
          ? "Hiếm"
          : undefined;
    game.loot.push({
      id: `loot-${enemy.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      x: enemy.x + randomBetween(-12, 12),
      y: enemy.y + randomBetween(-12, 12),
      fromX: enemy.x,
      fromY: enemy.y - 12,
      bornAt: nowMs(),
      item: createItem(Math.max(1, enemy.level), forced),
      gold:
        enemy.kind === "boss"
          ? 300
          : enemy.kind === "elite"
            ? 90
            : randomInt(8, 22),
      stones: enemy.kind === "boss" ? 5 : enemy.kind === "elite" ? 2 : 0,
      expiresAt: Number.POSITIVE_INFINITY,
    });
  } else {
    game.loot.push({
      id: `loot-gold-${enemy.id}-${Date.now()}`,
      x: enemy.x + randomBetween(-22, 22),
      y: enemy.y + randomBetween(-16, 16),
      fromX: enemy.x,
      fromY: enemy.y - 12,
      bornAt: nowMs(),
      gold: enemy.kind === "elite" ? 60 : randomInt(5, 15),
      stones: enemy.kind === "elite" ? 1 : 0,
      expiresAt:
        game.mapMode === "dungeon" ? Number.POSITIVE_INFINITY : nowMs() + 90000,
    });
  }
  if (game.loot.length > 120) {
    const overflow = game.loot.splice(0, game.loot.length - 100);
    storeRewardItems(
      player,
      overflow.flatMap((loot) => (loot.item ? [loot.item] : [])),
    );
    for (const loot of overflow) {
      player.gold += loot.gold;
      player.refiningStones += loot.stones;
    }
    addLog(
      "Đồ rơi cũ đã được thu hồi vào hành trang/Đồ chờ nhận để sân đấu không quá đầy.",
    );
    persistGame();
  }
}

function damagePlayer(amount: number, source: string): void {
  if (!game) return;
  const player = game.player;
  let remaining = Math.max(
    1,
    Math.floor(
      amount *
        (1 -
          effectiveDefense() / (effectiveDefense() + 100 + player.level * 12)),
    ),
  );
  if (player.shieldUntil > nowMs() && player.shield > 0) {
    const blocked = Math.min(player.shield, remaining);
    player.shield -= blocked;
    remaining -= blocked;
  }
  if (remaining > 0) player.hp = Math.max(0, player.hp - remaining);
  if (remaining > 0) game.combat.motion.hurtUntil = nowMs() + 180;
  player.rage = clamp(player.rage + 5, 0, 100);
  addFloatingText(
    player.x + randomBetween(-7, 7),
    player.y - 39,
    remaining > 0 ? `-${remaining}` : "ĐỠ",
    remaining > 0 ? "#ff9c88" : "#9ed9f4",
    remaining > 0 ? 18 : 14,
  );
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
    game.combat = freshCombat();
    addLog(
      "Bạn đã ngã xuống và được đưa về điểm hồi sinh. Không mất trang bị.",
    );
    if (game.goldenEncounter) leaveGoldenBoss("Thất bại. Có thể khiêu chiến lại trong khung giờ này.");
    else if (inDungeon) leaveDungeon();
    else if (player.idle.enabled) {
      player.idle.stage = Math.max(1, player.idle.stage - 1);
      player.idle.wave = 1;
      player.idle.push = false;
      prepareIdleWave();
      addLog("Đã lùi một ải để luyện thêm. Bấm Tự động khi bạn sẵn sàng.");
    }
  }
}

function pickupNearby(): void {
  if (!game) return;
  const player = game.player;
  const nearby = game.loot.filter(
    (loot) =>
      distance(player, loot) <= 82 && nowMs() - (loot.bornAt ?? 0) >= 450,
  );
  if (nearby.length === 0) {
    addLog("Không có vật phẩm nào trong tầm nhặt.");
    return;
  }
  let picked = 0;
  for (const loot of nearby) {
    if (loot.item && player.inventory.length >= BAG_CAPACITY) {
      addLog("Túi đồ đã đầy. Hãy mặc, bán hoặc cường hóa đồ trước.");
      continue;
    }
    if (loot.item) {
      player.inventory.push(loot.item);
      addLog(`Nhặt được ${loot.item.name} [${loot.item.rarity}].`);
      notifyLoot(loot.item);
    }
    if (loot.gold > 0) player.gold += loot.gold;
    if (loot.stones > 0) player.refiningStones += loot.stones;
    if (loot.gold > 0 || loot.stones > 0)
      addLog(`+${loot.gold} bạc${loot.stones ? ` · +${loot.stones} đá` : ""}.`);
    animatePickup(loot);
    game.loot = game.loot.filter((candidate) => candidate.id !== loot.id);
    picked += 1;
  }
  if (picked > 0) {
    persistGame();
    refreshUi(true);
  }
}

function animatePickup(loot: GroundLoot): void {
  if (!game) return;
  game.combat.pickups.push({
    loot,
    at: nowMs(),
    duration: flightDuration(loot, game.player, 900) + 120,
  });
  if (game.combat.pickups.length > 24) game.combat.pickups.shift();
  if (loot.gold)
    addFloatingText(
      game.player.x,
      game.player.y - 45,
      `+${loot.gold} bạc`,
      "#edd27a",
      12,
    );
}
function notifyLoot(item: Item): void {
  const notices = document.getElementById("loot-notices")!;
  const entry = document.createElement("button");
  entry.className = "loot-notice";
  entry.style.setProperty("--loot-color", item.color);
  entry.dataset.lootItem = item.id;
  entry.innerHTML = `${equipmentMarkup(item.slot, item.color, item.rarity)}<div><b>${escapeHtml(item.name)}</b><small>${item.rarity} · Cấp ${item.level}</small></div>`;
  entry.setAttribute("aria-label", `Đã nhặt ${item.name}, xem trang bị`);
  notices.prepend(entry);
  while (notices.children.length > 2) notices.lastElementChild?.remove();
  window.setTimeout(() => entry.remove(), 4500);
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
  persistGame();
  refreshUi(true);
}

function enhanceItem(index: number, equippedSlot?: ItemSlot): void {
  if (!game) return;
  const item = equippedSlot
    ? game.player.equipment[equippedSlot]
    : game.player.inventory[index];
  if (!item) return;
  if (item.enhance >= 10)
    return addLog(`${item.name} đã đạt giới hạn +10 của prototype.`);
  const cost = 45 + item.enhance * 35;
  if (game.player.gold < cost || game.player.refiningStones < 1) {
    addLog(`Cần ${cost} bạc và 1 đá tinh luyện để cường hóa.`);
    return;
  }
  game.player.gold -= cost;
  game.player.refiningStones -= 1;
  const chance =
    item.enhance < 3
      ? 1
      : item.enhance < 6
        ? 0.78
        : item.enhance < 8
          ? 0.58
          : 0.42;
  if (Math.random() <= chance) {
    item.enhance += 1;
    syncStats();
    addLog(`Cường hóa thành công: ${item.name} +${item.enhance}.`);
  } else {
    addLog(`Cường hóa thất bại: ${item.name} vẫn ở +${item.enhance}.`);
  }
  persistGame();
  refreshUi(true);
}

function persistGame(): boolean {
  if (!game || game.mapMode !== "world") return false;
  const snapshot = {
    version: 2,
    savedAt: Date.now(),
    player: game.goldenEncounter ? { ...game.player, x: game.goldenEncounter.x, y: game.goldenEncounter.y, idle: { ...game.player.idle, inTown: game.goldenEncounter.inTown } } : game.player,
    groundLoot: [...(game.goldenEncounter?.loot ?? []), ...game.loot].map(({ id, x, y, item, gold, stones }) => ({
      id,
      x,
      y,
      item,
      gold,
      stones,
    })),
    enemies: game.enemies.map((enemy) => ({
      ...enemy,
      dead: false,
      respawnAt: 0,
    })),
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    showToast(
      "Trình duyệt không lưu được tiến trình. Đừng đóng trang; hãy kiểm tra dung lượng lưu trữ.",
    );
    return false;
  }
}

function saveGame(): void {
  if (!game) return showToast("Hãy chọn môn phái trước khi lưu.");
  if (game.mapMode === "dungeon")
    return addLog("Hãy hoàn thành hoặc rời phụ bản trước khi lưu.");
  if (persistGame()) addLog("Đã lưu tiến trình vào trình duyệt này.");
}

function loadGame(): void {
  if (game?.mapMode === "dungeon")
    return addLog("Hãy hoàn thành hoặc rời phụ bản trước khi tải tiến trình.");
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return showToast("Chưa có tiến trình nào được lưu.");
    const snapshot = validateSave(JSON.parse(raw));
    if (!snapshot.player || !SECTS[snapshot.player.sect])
      throw new Error("save-invalid");
    snapshot.player.name ??= "Tân nhân giang hồ";
    snapshot.player.sex ??= "male";
    snapshot.player.factionId ??= ({ kim: "tianwang", hoa: "gaibang", thuy: "emei" } as const)[snapshot.player.sect];
    snapshot.player.idle = normalizeIdle(
      snapshot.player.idle,
      !snapshot.player.idle,
    );
    renderedSkillSect = null;
    inventoryRenderKey = "";
    snapshot.player.skillPoints ??= 0;
    snapshot.player.skillRanks ??= { skill1: 1, skill2: 0, ultimate: 0 };
    snapshot.player.questRewardClaimed ??= false;
    snapshot.player.dungeonTokens ??= 0;
    Object.assign(snapshot.player, normalizeSupplies(snapshot.player));
    snapshot.player.pendingItems ??= [];
    snapshot.player.dungeonClears ??= {
      tomb: snapshot.player.dungeonTokens > 0 ? 1 : 0,
      bamboo: 0,
    };
    const worldEnemies = makeEnemies();
    game = {
      combat: freshCombat(),
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
    if (game.player.idle.enabled) {
      const reward = offlineReward(
        snapshot.savedAt,
        Date.now(),
        game.player.idle.stage,
      );
      if (reward.minutes && !game.player.idle.inTown) {
        game.player.gold += reward.gold;
        rewardExperience(reward.xp);
        addLog(
          `Luyện công vắng mặt ${reward.minutes} phút: +${reward.xp} XP · +${reward.gold} bạc (tối đa 4 giờ).`,
        );
      }
      prepareIdleWave();
      game.autoBattle = !game.player.idle.inTown;
    }
    game.loot = (snapshot.groundLoot ?? []).map((loot) => ({
      ...loot,
      bornAt: nowMs() - 1000,
      expiresAt: loot.item ? Number.POSITIVE_INFINITY : nowMs() + 90000,
    }));
    pendingSaleId = null;
    resetJoystick();
    keys.clear();
    closeMobileSheet();
    sectOverlay.classList.add("hidden");
    if (!playerIdleActive())
      canvasBadge.innerHTML = `<span class="live-dot"></span> RỪNG TRÚC · KÊNH 01`;
    addLog("Đã tải nhân vật. Tiến trình và trang bị được giữ nguyên.");
    hydrateSettings();
    persistGame();
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
  document.getElementById("loot-notices")!.replaceChildren();
  pendingSaleId = null;
  keys.clear();
  sectOverlay.classList.remove("hidden");
  canvasBadge.innerHTML = `<span class="live-dot"></span> RỪNG TRÚC · KÊNH 01`;
  canvasTip.textContent = "Chọn môn phái để bắt đầu hành trình";
  refreshUi(true);
}

function openGuildRoadmap(): void {
  addLog(
    "Bang hội sẽ mở ở giai đoạn P7: tạo bang, gia nhập, đóng góp và boss bang.",
  );
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
    addLog(
      game.player.questRewardClaimed
        ? "Mộc sư huynh: Hãy luyện thêm võ công trước khi vào Cổ Mộ."
        : "Mộc sư huynh: Hạ 5 sơn tặc, rồi Lang Vương sẽ lộ diện.",
    );
    return;
  }
  if (npc.id === "smith") {
    addLog("Lão Thiết: Trang bị tốt phải được tôi luyện đúng lúc.");
    openMobileSheet("smith");
    return;
  }
  if (npc.id === "merchant") {
    openMobileSheet("shop");
    addLog(
      "Châu thương nhân: Chuẩn bị bình HP/MP trước khi thử thách boss nhé!",
    );
    return;
  }
  openMobileSheet("dungeon");
}

function screenToWorld(event: MouseEvent): { x: number; y: number } {
  if (!game) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  const x =
    ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH + game.cameraX;
  const y =
    ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT + game.cameraY;
  return { x, y };
}

function selectAt(world: { x: number; y: number }): void {
  if (!game) return;
  const loot = game.loot.find((candidate) => distance(world, candidate) <= 24);
  if (loot) {
    game.combat.lootTarget = loot.id;
    game.targetId = null;
    game.autoBattle = false;
    game.moveTarget = { x: loot.x, y: loot.y };
    if (distance(game.player, loot) <= 82) pickupNearby();
    return;
  }
  game.combat.lootTarget = null;
  const hit = game.enemies.find(
    (enemy) => !enemy.dead && distance(world, enemy) <= enemy.radius + 28,
  );
  if (hit) {
    game.targetId = hit.id;
    game.moveTarget = null;
    addLog(`Mục tiêu: ${hit.name}.`);
    return;
  }
  const npc =
    game.mapMode === "world"
      ? NPCS.find((candidate) => distance(world, candidate) <= 32)
      : undefined;
  if (npc) {
    interactNpc(npc);
  } else {
    game.targetId = null;
    game.moveTarget = {
      x: clamp(world.x, 40, WORLD_WIDTH - 40),
      y: clamp(world.y, 40, WORLD_HEIGHT - 40),
    };
  }
}

function updateCombat(now: number): void {
  if (!game) return;
  const combat = game.combat;
  const strikes = combat.strikes;
  combat.strikes = [];
  for (const strike of strikes) {
    if (now < strike.at) {
      combat.strikes.push(strike);
      continue;
    }
    if (strike.target) {
      if (
        game.enemies.includes(strike.target) &&
        !strike.target.dead &&
        withinReach(game.player, strike.target, strike.range ?? 180, strike.target.radius)
      )
      {
        if (strike.definition) applySkillStatus(strike.target, strike.definition, strike.multiplier, now);
        dealDamage(strike.target, strike.multiplier, strike.source);
        if (strike.healing && !strike.healing.used) {
          strike.healing.used = true;
          const player = game.player;
          const heal = Math.min(player.maxHp - player.hp, Math.floor(player.maxHp * strike.healing.ratio));
          player.hp += heal;
          if (heal > 0) addFloatingText(player.x, player.y - 34, `+${heal}`, playerSect(player).accent, 15);
        }
      }
    } else
      dealAreaDamage(
        strike.x,
        strike.y,
        strike.radius,
        strike.multiplier,
        strike.source,
      );
  }
  const projectiles = combat.projectiles;
  combat.projectiles = [];
  for (const projectile of projectiles) {
    if (!game.enemies.includes(projectile.target)) continue;
    if (now < projectile.startedAt + projectile.duration) {
      combat.projectiles.push(projectile);
      continue;
    }
    const target = projectile.target;
    if (!target.dead) {
      if (projectile.definition) applySkillStatus(target, projectile.definition, projectile.multiplier, now);
      if (projectile.area)
        dealAreaDamage(
          target.x,
          target.y,
          projectile.area,
          projectile.multiplier,
          projectile.source,
        );
      else dealDamage(target, projectile.multiplier, projectile.source);
    }
    addSkillEffect({
      x: target.x,
      y: target.y - 12,
      radius: projectile.area || 32,
      color: ELEMENTS[projectile.theme].color,
      theme: projectile.theme,
      kind: projectile.definition?.motif ?? (projectile.area ? "burst" : "impact"),
      skill: projectile.skill,
      duration: projectile.area ? 700 : 230,
    });
  }
  combat.corpses = combat.corpses.filter((corpse) => now - corpse.at < 650);
  combat.pickups = combat.pickups.filter(
    (pickup) => now - pickup.at < pickup.duration,
  );
}
function update(dt: number, now: number): void {
  if (!game) return;
  const player = game.player;
  const before = { x: player.x, y: player.y };
  if (game.goldenEncounter && Date.now() >= game.goldenEncounter.window.endsAt) {
    leaveGoldenBoss("Khung giờ boss đã kết thúc.");
    return;
  }
  if (game.goldenEncounter && player.idle.autoLoot) collectIdleLoot();
  if (player.idle.inTown && !game.goldenEncounter && game.mapMode === "world") {
    game.cameraX = clamp(
      player.x - VIEW_WIDTH / 2,
      0,
      WORLD_WIDTH - VIEW_WIDTH,
    );
    game.cameraY = clamp(
      player.y - VIEW_HEIGHT / 2,
      0,
      WORLD_HEIGHT - VIEW_HEIGHT,
    );
    return;
  }
  if (game.mapMode === "dungeon" && !game.dungeonCleared) {
    game.dungeonTimeLeft = Math.max(0, game.dungeonTimeLeft - dt);
    if (game.dungeonTimeLeft <= 0) {
      addLog(
        `Hết giờ! ${DUNGEONS[game.dungeonId!].name} đã đóng lại. Lượt này không có thưởng hoàn thành.`,
      );
      leaveDungeon();
      return;
    }
  }
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.cooldowns.skill1 = Math.max(0, player.cooldowns.skill1 - dt);
  player.cooldowns.skill2 = Math.max(0, player.cooldowns.skill2 - dt);
  player.cooldowns.ultimate = Math.max(0, player.cooldowns.ultimate - dt);
  player.potionCooldown = Math.max(0, player.potionCooldown - dt);
  player.mp = Math.min(player.maxMp, player.mp + dt * 0.7);
  if (player.shieldUntil <= now) player.shield = 0;
  player.rage = clamp(player.rage + dt * 1.1, 0, 100);
  if (game.autoBattle && player.idle.autoSkills && currentTarget()) {
    if (player.cooldowns.skill1 <= 0) castSkill("skill1", true);
    if (player.level >= 3 && player.cooldowns.skill2 <= 0)
      castSkill("skill2", true);
    if (player.level >= 5 && player.rage >= 100) castSkill("ultimate", true);
  }
  if (
    game.autoBattle &&
    player.idle.autoPotions &&
    player.potionCooldown <= 0 &&
    player.hp < player.maxHp * 0.4 &&
    player.potions.hp > 0
  )
    drinkPotion("hp");
  else if (
    game.autoBattle &&
    player.idle.autoPotions &&
    player.potionCooldown <= 0 &&
    player.mp < player.maxMp * 0.25 &&
    player.potions.mp > 0
  )
    drinkPotion("mp");
  if (game.autoBattle && !currentTarget()) {
    const target = nearestEnemy(520);
    if (target) game.targetId = target.id;
  }

  const keyboardX =
    (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
    (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
  const keyboardY =
    (keys.has("s") || keys.has("arrowdown") ? 1 : 0) -
    (keys.has("w") || keys.has("arrowup") ? 1 : 0);
  const inputX = clamp(keyboardX !== 0 ? keyboardX : touchInput.x, -1, 1);
  const inputY = clamp(keyboardY !== 0 ? keyboardY : touchInput.y, -1, 1);
  onlineClient.sendInput(inputX, inputY);
  if (game.combat.dash) {
    const dash = game.combat.dash;
    const next = easedPoint(
      dash.from,
      dash.to,
      (now - dash.at) / dash.duration,
    );
    movePlayer(next.x - player.x, next.y - player.y);
    if (now >= dash.at + dash.duration) game.combat.dash = null;
  } else if (inputX !== 0 || inputY !== 0) {
    game.moveTarget = null;
    game.autoBattle = false;
    const inputLength = Math.max(1, Math.hypot(inputX, inputY));
    movePlayer(
      (inputX / inputLength) * player.speed * dt,
      (inputY / inputLength) * player.speed * dt,
    );
  } else if (game.moveTarget) {
    const d = distance(player, game.moveTarget);
    if (d < 8) game.moveTarget = null;
    else
      movePlayer(
        ((game.moveTarget.x - player.x) / d) * Math.min(d, player.speed * dt),
        ((game.moveTarget.y - player.y) / d) * Math.min(d, player.speed * dt),
      );
  } else {
    const target = currentTarget();
    if (target) {
      const d = distance(player, target);
      if (d > basicAttackRange() + target.radius - 6 && !actionLocked())
        movePlayer(
          ((target.x - player.x) / d) * player.speed * dt,
          ((target.y - player.y) / d) * player.speed * dt,
        );
      else playerBasicAttack();
    }
  }
  if (game.combat.lootTarget) {
    const loot = game.loot.find(
      (candidate) => candidate.id === game!.combat.lootTarget,
    );
    if (!loot) game.combat.lootTarget = null;
    else if (distance(player, loot) < 70 && now - (loot.bornAt ?? 0) >= 450) {
      pickupNearby();
      game.combat.lootTarget = null;
      game.moveTarget = null;
    }
  }
  updateMotion(game.combat.motion, before, player, dt, now);

  const encounterEnemies = game.enemies;
  for (const enemy of encounterEnemies) {
    if (enemy.dead) {
      if (
        game.mapMode === "world" &&
        !playerIdleActive() &&
        now >= enemy.respawnAt &&
        enemy.kind !== "boss"
      ) {
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
    let motion = game.combat.enemyMotions.get(enemy.id);
    if (!motion) {
      motion = freshMotion();
      game.combat.enemyMotions.set(enemy.id, motion);
    }
    const enemyBefore = { x: enemy.x, y: enemy.y };
    const d = distance(enemy, player);
    if (enemy.kind === "boss") {
      enemy.bossCooldown -= dt;
      if (d < 520 && enemy.bossCooldown <= 0) {
        const dungeonBoss = game.mapMode === "dungeon";
        const enraged = dungeonBoss && enemy.hp <= enemy.maxHp * 0.5;
        const attackName = game.dungeonId === "tomb" ? "Địa Chấn" : "Liệt Trảo";
        game.telegraphs.push({
          x: player.x,
          y: player.y,
          radius: 92,
          triggerAt: now + 1100,
          damage: enemy.attack * 1.4,
          label: `${enemy.name} · ${attackName}`,
        });
        if (enraged)
          game.telegraphs.push({
            x: enemy.x,
            y: enemy.y,
            radius: 130,
            triggerAt: now + 1550,
            damage: enemy.attack * 1.2,
            label: `${enemy.name} · Cuồng Nộ`,
          });
        enemy.bossCooldown = enraged ? 3.6 : 4.4;
        Object.assign(motion, {
          action: "cast",
          actionAt: now,
          actionDuration: 900,
        });
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
          Object.assign(motion, {
            action: "attack",
            actionAt: now,
            actionDuration: 350,
          });
          damagePlayer(enemy.attack, enemy.name);
          if (game.enemies !== encounterEnemies) return;
        }
      }
    }
    updateMotion(motion, enemyBefore, enemy, dt, now);
  }
  updateCombat(now);

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
        const encounterBeforeHit = game.goldenEncounter;
        damagePlayer(telegraph.damage, telegraph.label);
        if (game.mapMode !== modeBeforeHit || game.goldenEncounter !== encounterBeforeHit) return;
      }
    } else remainingTelegraphs.push(telegraph);
  }
  game.telegraphs = remainingTelegraphs;
  advanceDungeonWave();
  updateIdleProgress(now);
  game.effects = game.effects.filter(
    (effect) => now - effect.startedAt < effect.duration,
  );
  game.floatingTexts = game.floatingTexts.filter(
    (floatingText) => now - floatingText.startedAt < floatingText.duration,
  );
  game.loot = game.loot.filter((loot) => loot.expiresAt > now);
  const follow = 1 - Math.exp((-12 * dt) / player.idle.speed);
  game.cameraX +=
    (clamp(player.x - VIEW_WIDTH / 2, 0, WORLD_WIDTH - VIEW_WIDTH) -
      game.cameraX) *
    follow;
  game.cameraY +=
    (clamp(player.y - VIEW_HEIGHT / 2, 0, WORLD_HEIGHT - VIEW_HEIGHT) -
      game.cameraY) *
    follow;
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
): void {
  const r = Math.min(radius, w / 2, h / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}

function drawBar(
  x: number,
  y: number,
  width: number,
  height: number,
  ratio: number,
  color: string,
  background = "rgba(0,0,0,.48)",
): void {
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
    dungeonArts[id] ??= createMapArt(
      id === "bamboo" ? "bamboo" : "dungeon",
      WORLD_WIDTH,
      WORLD_HEIGHT,
    );
    ctx.drawImage(dungeonArts[id]!, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    ctx.fillStyle = "#d4c7ef";
    ctx.font = "600 14px 'DM Sans', sans-serif";
    drawOutlinedText(
      `${DUNGEONS[id].shortName} · ĐỢT ${game.dungeonWave + 1}/${DUNGEONS[id].waves.length}`,
      270,
      550,
    );
  } else {
    if (playerIdleActive() || game.goldenEncounter) {
      ctx.drawImage(
        trainingArt(game.player.idle.stage),
        0,
        0,
        WORLD_WIDTH,
        WORLD_HEIGHT,
      );
    } else ctx.drawImage(worldArt, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    ctx.fillStyle = "#fff0bd";
    ctx.font = "600 14px 'DM Sans', sans-serif";
    drawOutlinedText("THANH KHÊ TRẤN", 268, 260);
    ctx.fillStyle = "#dde8cd";
    ctx.font = "12px 'DM Sans', sans-serif";
    drawOutlinedText("Cổng phía đông · Lang Vương", 1320, 1030);
    if (!playerIdleActive() && !game.goldenEncounter) for (const npc of NPCS) drawNpc(npc, now);
  }

  for (const zone of game.zones) drawSectEffect(ctx, { ...zone, kind: zone.kind as EffectMotif }, ((now - zone.startedAt) % 1200) / 1200, true);
  const groundEffects = new Set(["burst", "heal", "shield"]);
  for (const effect of game.effects)
    if (groundEffects.has(effect.kind)) drawSkillEffect(effect, now);
  for (const corpse of game.combat.corpses) {
    const t = (now - corpse.at) / 650;
    ctx.save();
    ctx.translate(corpse.enemy.x, corpse.enemy.y);
    ctx.rotate(t * 0.8);
    ctx.globalAlpha = (1 - t) * 0.75;
    ctx.scale(1, 1 - t * 0.6);
    drawEnemySprite(corpse.enemy, now);
    ctx.restore();
  }
  for (const loot of game.loot)
    if (
      loot.x > game.cameraX - 100 &&
      loot.x < game.cameraX + VIEW_WIDTH + 100 &&
      loot.y > game.cameraY - 150 &&
      loot.y < game.cameraY + VIEW_HEIGHT + 80
    )
      drawLoot(loot, now);
  const actors = [
    ...game.enemies
      .filter((enemy) => !enemy.dead)
      .map((enemy) => ({ y: enemy.y, draw: () => drawEnemy(enemy, now) })),
    ...game.onlinePlayers.map((remote) => ({
      y: remote.y,
      draw: () => drawRemotePlayer(remote, now),
    })),
    { y: player.y, draw: () => drawPlayer(player, now) },
  ];
  actors.sort((a, b) => a.y - b.y);
  for (const actor of actors) actor.draw();
  for (const effect of game.effects)
    if (!groundEffects.has(effect.kind)) drawSkillEffect(effect, now);
  for (const projectile of game.combat.projectiles)
    drawProjectile(projectile, now);
  for (const pickup of game.combat.pickups) drawPickupFlight(pickup, now);
  for (const telegraph of game.telegraphs) drawTelegraph(telegraph, now);
  for (const floatingText of game.floatingTexts)
    drawFloatingText(floatingText, now);
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
  if (!game || now - lastMiniMapDraw < 180) return;
  lastMiniMapDraw = now;
  const mc = miniMapContext;
  const sx = miniMap.width / WORLD_WIDTH;
  const sy = miniMap.height / WORLD_HEIGHT;
  mc.clearRect(0, 0, miniMap.width, miniMap.height);
  const background =
    game.mapMode === "world"
      ? playerIdleActive() || game.goldenEncounter
        ? trainingArt(game.player.idle.stage)
        : worldArt
      : dungeonArts[game.dungeonId!];
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
  mc.strokeRect(
    game.cameraX * sx,
    game.cameraY * sy,
    VIEW_WIDTH * sx,
    VIEW_HEIGHT * sy,
  );
  const dot = (x: number, y: number, color: string, radius: number) => {
    mc.fillStyle = color;
    mc.beginPath();
    mc.arc(x * sx, y * sy, radius, 0, Math.PI * 2);
    mc.fill();
  };
  if (game.mapMode === "world")
    for (const npc of NPCS) dot(npc.x, npc.y, "#88e8ce", 2);
  for (const enemy of game.enemies) {
    if (!enemy.dead)
      dot(
        enemy.x,
        enemy.y,
        enemy.kind === "boss" ? "#ffdb65" : "#f06e62",
        enemy.kind === "boss" ? 3.5 : 2,
      );
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
  const sprite: SpriteId =
    npc.id === "dungeon" ? "portal" : npc.id === "merchant" ? "guide" : npc.id;
  if (
    !drawSprite(
      ctx,
      sprite,
      0,
      20,
      npc.id === "dungeon" ? 84 : 62,
      npc.id === "dungeon" ? 84 : 70,
    )
  ) {
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
  drawOutlinedText(npc.name, 0, -67);
  ctx.fillStyle = "rgba(210, 224, 214, .65)";
  ctx.font = "9px 'DM Sans', sans-serif";
  drawOutlinedText(npc.title, 0, -55);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawSkillEffect(effect: SkillEffect, now: number): void {
  if (effect.skill) drawSectEffect(ctx, { ...effect, kind: effect.kind as EffectMotif }, clamp((now - effect.startedAt) / effect.duration, 0, 1));
  else drawBattleEffect(ctx, { ...effect, kind: effect.kind as "slash" | "burst" | "orb" | "heal" | "shield" | "impact" | "trail" }, now);
}

function drawFloatingText(floatingText: FloatingText, now: number): void {
  const progress = clamp(
    (now - floatingText.startedAt) / floatingText.duration,
    0,
    1,
  );
  const alpha =
    progress < 0.18 ? progress / 0.18 : 1 - (progress - 0.18) / 0.82;
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
  ctx.arc(
    telegraph.x,
    telegraph.y,
    telegraph.radius * (1.02 - remaining * 0.14),
    0,
    Math.PI * 2,
  );
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#ffd8c7";
  ctx.font = "700 12px 'DM Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("NÉ!", telegraph.x, telegraph.y + 4);
  ctx.textAlign = "left";
}

function drawLoot(loot: GroundLoot, now: number): void {
  const progress = clamp((now - (loot.bornAt ?? now - 600)) / 600, 0, 1);
  const location = easedPoint(
    { x: loot.fromX ?? loot.x, y: loot.fromY ?? loot.y },
    loot,
    progress,
  );
  const height = landingHeight(progress);
  const color = loot.item?.color ?? "#edcd76";
  ctx.save();
  ctx.translate(location.x, location.y);
  ctx.fillStyle = "rgba(0,0,0,.25)";
  ctx.beginPath();
  ctx.ellipse(0, 5, 13 - height / 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (loot.item) {
    const rare = equipmentTier(loot.item.rarity) >= 2;
    drawGlow(ctx, 0, 0, 30, color, 0.45);
    ctx.fillStyle = hexToRgba(color, 0.25);
    ctx.beginPath();
    ctx.ellipse(0, 4, 18 + Math.sin(now / 220) * 2, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    if (rare && progress === 1) {
      ctx.fillStyle = hexToRgba(color, 0.32);
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(-4, -115);
      ctx.lineTo(4, -115);
      ctx.lineTo(12, 0);
      ctx.fill();
      for (let i = 0; i < 3; i++) {
        const t = (now / 1100 + i / 3) % 1;
        ctx.globalAlpha = 1 - t;
        ctx.fillStyle = color;
        ctx.fillRect(Math.sin(i * 3 + now / 400) * 8, -t * 50, 2, 2);
      }
      ctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.translate(0, -height - 5);
    ctx.rotate((1 - progress) * 2.2);
    drawEquipmentIcon(ctx, loot.item.slot, color, 42);
    ctx.restore();
    if (progress === 1) {
      ctx.textAlign = "center";
      ctx.font = "700 12px sans-serif";
      ctx.fillStyle = color;
      drawOutlinedText(loot.item.name, 0, 33);
      ctx.textAlign = "left";
    }
  } else {
    ctx.translate(0, -height);
    ctx.fillStyle = color;
    ctx.strokeStyle = "#8c6d30";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse((i - 1) * 6, (i % 2) * -4, 6, 4, -0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}
function drawProjectile(projectile: Projectile, now: number): void {
  if (now < projectile.startedAt) return;
  const t = clamp((now - projectile.startedAt) / projectile.duration, 0, 1);
  const to = { x: projectile.target.x, y: projectile.target.y - 30 };
  const x = projectile.from.x + (to.x - projectile.from.x) * t;
  const y =
    projectile.from.y +
    (to.y - projectile.from.y) * t -
    Math.sin(t * Math.PI) * 18;
  drawVfxProjectile(
    ctx,
    x,
    y,
    Math.atan2(to.y - projectile.from.y, to.x - projectile.from.x),
    projectile.theme,
    now,
  );
}

function drawPickupFlight(
  pickup: CombatState["pickups"][number],
  now: number,
): void {
  if (!game) return;
  const t = clamp((now - pickup.at) / pickup.duration, 0, 1);
  const at = easedPoint(
    pickup.loot,
    { x: game.player.x, y: game.player.y - 18 },
    t,
  );
  ctx.save();
  ctx.translate(at.x, at.y - Math.sin(t * Math.PI) * 26);
  ctx.globalAlpha = 1 - t * 0.7;
  ctx.scale(1 - t * 0.6, 1 - t * 0.6);
  if (pickup.loot.item)
    drawEquipmentIcon(ctx, pickup.loot.item.slot, pickup.loot.item.color, 22);
  else {
    ctx.fillStyle = "#edcd76";
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawEnemySprite(enemy: Enemy, now: number): void {
  const scale = enemy.radius / 19;
  const hitColor = enemy.hitFlash > 0 ? "#fff5df" : enemy.color;
  const isWolf =
    enemy.name.includes("Lang") || enemy.name.includes("Trúc Lang");
  const isInsect = enemy.name.includes("Trùng");
  const isUndead =
    enemy.name.includes("U Binh") || enemy.name.includes("Mộ Tướng");
  const sprite: SpriteId = game?.goldenEncounter && enemy.id.startsWith("golden-") ? game.goldenEncounter.window.boss.sprite : isWolf
    ? enemy.kind === "boss"
      ? "alpha"
      : "wolf"
    : isInsect
      ? "beetle"
      : enemy.kind === "boss"
        ? "guardian"
        : isUndead
          ? "undead"
          : "bandit";
  ctx.save();
  const motion = game?.combat.enemyMotions.get(enemy.id);
  const step = motion ? Math.sin(motion.stride) * motion.moving : 0;
  const attack =
    motion && motion.action === "attack"
      ? Math.sin(actionProgress(motion, now) * Math.PI) * 8
      : 0;
  const facing = game
    ? Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x)
    : 0;
  ctx.translate(
    Math.cos(facing) * attack,
    -Math.abs(step) * 3 + Math.sin(facing) * attack,
  );
  ctx.rotate(step * 0.045);
  ctx.scale(1 + Math.abs(step) * 0.035, 1 - Math.abs(step) * 0.035);
  if (enemy.hitFlash > 0) ctx.globalAlpha *= 0.65 + Math.sin(now / 35) * 0.2;
  const illustrated = drawSprite(
    ctx,
    sprite,
    0,
    enemy.radius * 0.8,
    enemy.radius * (isWolf ? 3.6 : 3.2),
    enemy.radius * (isWolf ? 2.8 : 3.4),
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
  ctx.ellipse(
    0,
    enemy.radius * 0.74,
    enemy.radius * 0.95,
    enemy.radius * 0.32,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  if (target) {
    ctx.strokeStyle = "#ffd977";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius + 8 + Math.sin(now / 160) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (enemy.id.startsWith("golden-")) {
    ctx.strokeStyle = "#ffd35a"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 5, enemy.radius + 6, 13, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#ffd35a"; ctx.font = "18px Georgia"; ctx.textAlign = "center";
    ctx.fillText("✦", 0, -enemy.radius * 2.5);
  }
  drawEnemySprite(enemy, now);
  ctx.restore();
  const barWidth =
    enemy.kind === "boss" ? 160 : enemy.kind === "elite" ? 84 : 62;
  const labelY = enemy.y - enemy.radius * 2.6 - 12;
  drawBar(
    enemy.x - barWidth / 2,
    labelY,
    barWidth,
    enemy.kind === "boss" ? 8 : 5,
    enemy.hp / enemy.maxHp,
    enemy.kind === "boss" ? "#dd6c79" : "#a6d36c",
  );
  ctx.fillStyle = enemy.kind === "boss" ? "#ffe0a1" : "#d4e1d3";
  ctx.font = `${enemy.kind === "boss" ? 700 : 600} ${enemy.kind === "boss" ? 13 : 11}px 'DM Sans', sans-serif`;
  ctx.textAlign = "center";
  drawOutlinedText(`${enemy.name} · Cấp ${enemy.level}`, enemy.x, labelY - 7);
  ctx.textAlign = "left";
}

function drawHeroSprite(
  sect: Sect,
  facingX: number,
  facingY: number,
  now: number,
  remote = false,
): void {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.beginPath();
  ctx.ellipse(0, 12, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (remote) {
    const motion = freshMotion();
    motion.facingX = facingX;
    motion.facingY = facingY;
    ctx.scale(0.9, 0.9);
    drawAnimatedHero(ctx, "wudang", "male", motion, now);
  } else if (game) {
    const bestGear = Object.values(game.player.equipment).reduce<
      Item | undefined
    >(
      (best, item) =>
        !best || equipmentTier(item.rarity) > equipmentTier(best.rarity)
          ? item
          : best,
      undefined,
    );
    drawAnimatedHero(
      ctx,
      game.player.factionId,
      game.player.sex,
      game.combat.motion,
      now,
      {
        weaponColor: game.player.equipment.weapon?.color ?? "#ffe5a3",
        armorColor:
          equipmentTier(game.player.equipment.armor?.rarity) >= 2
            ? game.player.equipment.armor!.color
            : "",
        auraColor: bestGear?.color ?? "#ffe5a3",
        tier: equipmentTier(bestGear?.rarity),
        enhancement: game.player.equipment.weapon?.enhance ?? 0,
      },
    );
  }
  if (
    !remote &&
    game &&
    game.player.shieldUntil > now &&
    game.player.shield > 0
  ) {
    ctx.strokeStyle = hexToRgba(sect.accent, 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -8, 22, 28, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer(player: Player, now: number): void {
  const sect = playerSect(player);
  const cultivation = cultivationForPower(currentCombatPower());
  ctx.save();
  ctx.translate(player.x, player.y);
  drawCultivationAura(ctx, cultivation, now);
  drawHeroSprite(sect, player.facingX, player.facingY, now);
  ctx.restore();
  drawBar(
    player.x - 25,
    player.y - 43,
    50,
    5,
    player.hp / player.maxHp,
    "#66db9c",
  );
  ctx.fillStyle = "#e8eff1";
  ctx.font = "700 11px 'DM Sans', sans-serif";
  ctx.textAlign = "center";
  drawOutlinedText(
    `${player.name} · Cấp ${player.level}`,
    player.x,
    player.y - 53,
  );
  ctx.font = "700 10px 'DM Sans', sans-serif";
  const labelWidth = ctx.measureText(cultivation.label).width + 16;
  const labelX = clamp(
    player.x,
    game!.cameraX + labelWidth / 2 + 6,
    game!.cameraX + VIEW_WIDTH - labelWidth / 2 - 6,
  );
  const labelY = Math.max(player.y - 72, game!.cameraY + 45);
  ctx.fillStyle = "rgba(9,19,22,.85)";
  ctx.beginPath();
  ctx.roundRect(labelX - labelWidth / 2, labelY - 12, labelWidth, 17, 4);
  ctx.fill();
  ctx.strokeStyle = cultivation.realm.color;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = cultivation.realm.color;
  drawOutlinedText(cultivation.label, labelX, labelY);
  ctx.textAlign = "left";
}

function drawRemotePlayer(
  remote: OnlineSnapshot["players"][number],
  now: number,
): void {
  ctx.save();
  ctx.translate(remote.x, remote.y + Math.sin(now / 190 + remote.x) * 1.2);
  drawHeroSprite({ ...SCHOOL_KITS["vo-dang"], skills: ["", ""], ultimate: "" }, 1, 0, now, true);
  ctx.restore();
  drawBar(remote.x - 23, remote.y - 43, 46, 4, 1, "#72b9e8");
  ctx.fillStyle = "#c5e4f2";
  ctx.font = "600 10px 'DM Sans', sans-serif";
  ctx.textAlign = "center";
  drawOutlinedText(
    `${remote.name} · Cấp ${remote.level}`,
    remote.x,
    remote.y - 53,
  );
  ctx.textAlign = "left";
}

function refreshUi(force = false): void {
  if (!game) {
    document.querySelector("#character-name")!.textContent = "Lữ khách";
    document.querySelector("#header-combat-power")!.textContent = "⚔ 0";
    document.querySelector("#character-sect")!.textContent =
      "Chưa gia nhập môn phái";
    mobileChat.innerHTML = `<span class="mobile-chat-system">[Hệ thống]</span> Chọn môn phái để bắt đầu hành trình.`;
    mobileAuto.classList.remove("active");
    targetPanel.classList.remove("has-target");
    return;
  }
  if (!force && performance.now() - lastUiUpdate < 120) return;
  lastUiUpdate = performance.now();
  const player = game.player;
  const sect = playerSect(player);
  const target = currentTarget();
  targetPanel.classList.toggle("has-target", Boolean(target));
  combatStatusText.parentElement?.classList.toggle(
    "has-target",
    Boolean(target),
  );
  const setText = (selector: string, value: string) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  };
  setText("#character-name", player.name);
  refreshIdleUi();
  setText("#character-sect", `${sect.name} · ${sect.title}`);
  setText("#level-label", `Cấp ${player.level}`);
  setText(
    "#xp-label",
    `${formatNumber(player.xp)} / ${formatNumber(xpToNext(player.level))} XP`,
  );
  setText(
    "#hp-label",
    `${formatNumber(player.hp)} / ${formatNumber(player.maxHp)}`,
  );
  setText(
    "#mp-label",
    `${formatNumber(player.mp)} / ${formatNumber(player.maxMp)}`,
  );
  setText("#gold-label", formatNumber(player.gold));
  setText("#stone-label", formatNumber(player.refiningStones));
  setText("#token-label", formatNumber(player.dungeonTokens));
  setText("#mobile-gold", formatNumber(player.gold));
  setText("#mobile-stones", formatNumber(player.refiningStones));
  mobileAuto.classList.toggle("active", game.autoBattle);
  mobileAuto.setAttribute("aria-pressed", String(game.autoBattle));
  mobileAuto.setAttribute(
    "aria-label",
    game.autoBattle ? "Tắt tự động chiến đấu" : "Bật tự động chiến đấu",
  );
  mobileAuto.textContent = game.autoBattle ? "⚙ Tự động" : "☝ Thủ công";
  setText(
    "#mobile-map-name",
    game.mapMode === "world"
      ? playerIdleActive()
        ? stageInfo(player.idle.stage).name.toLocaleUpperCase("vi")
        : "RỪNG TRÚC"
      : DUNGEONS[game.dungeonId!].shortName,
  );
  document.querySelector(".mobile-map-channel")!.textContent =
    game.mapMode === "world"
      ? playerIdleActive()
        ? `Đợt ${player.idle.wave}/4`
        : "Thanh Khê Trấn"
      : `Đợt ${game.dungeonWave + 1}/${DUNGEONS[game.dungeonId!].waves.length}`;
  setText(
    "#quest-kill-progress",
    `${Math.min(player.questKills, 5)} / 5 sơn tặc`,
  );
  setText(
    "#quest-boss-progress",
    `${player.bossDefeated ? "✓" : "○"} Lang Vương`,
  );
  setText(
    "#quest-title",
    player.questRewardClaimed
      ? "Dấu chân hoàn tất"
      : "Dấu chân trong Rừng Trúc",
  );
  setText(
    "#quest-text",
    player.questRewardClaimed
      ? "Mộc sư huynh đã ghi nhận chiến công của bạn. Cổ Mộ Thí Luyện đã mở."
      : "Đánh bại 5 sơn tặc, tìm món đồ tốt hơn và hạ Lang Vương.",
  );
  setText(
    "#quest-reward",
    player.questRewardClaimed ? "Đã nhận thưởng" : "+100 XP · +300 bạc",
  );
  setText("#bag-count", `${player.inventory.length}/${BAG_CAPACITY}`);
  for (const kind of ["hp", "mp"] as PotionKind[]) {
    const button = document.querySelector<HTMLButtonElement>(
      `.potion-shortcuts [data-use-potion="${kind}"]`,
    )!;
    button.querySelector("small")!.textContent =
      player.potionCooldown > 0
        ? `${Math.ceil(player.potionCooldown)}s`
        : `${player.potions[kind]}`;
    button.disabled = player.potionCooldown > 0 || player.potions[kind] === 0;
    button.setAttribute(
      "aria-label",
      `${POTIONS[kind].name}: ${player.potions[kind]} bình${player.potionCooldown > 0 ? `, hồi chiêu ${Math.ceil(player.potionCooldown)} giây` : ""}`,
    );
  }
  const avatar = document.querySelector<HTMLElement>("#avatar-orb");
  if (avatar && avatar.dataset.sect !== sect.id) {
    avatar.dataset.sect = sect.id;
    avatar.className = `avatar-orb avatar-${player.sect}`;
    avatar.innerHTML = spriteMarkup(sect.id, "portrait-sprite");
    avatar.style.background = hexToRgba(sect.color, 0.3);
    const shortcut = document.querySelector(".character-shortcut");
    if (shortcut)
      shortcut.outerHTML = spriteMarkup(sect.id, "character-shortcut");
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
    <div><span>HP TỐI ĐA</span><strong>${formatNumber(player.maxHp)}</strong></div>
    <div><span>MP TỐI ĐA</span><strong>${formatNumber(player.maxMp)}</strong></div>
    <div><span>CHÍ MẠNG</span><strong>${criticalChance()}%</strong></div>
    <div><span>NỘ</span><strong>${formatNumber(player.rage)}%</strong></div>
    <div><span>TỐC</span><strong>${formatNumber(player.speed)}</strong></div>
  `;
  if (target) {
    targetContent.classList.remove("target-empty");
    const status =
      target.kind === "boss"
        ? "BOSS · CƠ CHẾ ĐANG HOẠT ĐỘNG"
        : target.kind === "elite"
          ? "TINH ANH"
          : "ĐANG GIAO CHIẾN";
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
  logList.innerHTML = game.logs
    .map(
      (log) => `<div class="log-entry"><span>›</span>${escapeHtml(log)}</div>`,
    )
    .join("");
  mobileChat.innerHTML = game.logs
    .slice(-3)
    .map(
      (log) =>
        `<div><span class="mobile-chat-system">[Giang hồ]</span> ${escapeHtml(log)}</div>`,
    )
    .join("");
}

function skillGlyphMarkup(skill: SkillKey, _sectId: string): string {
  const sect = game ? playerSect(game.player) : SCHOOL_KITS[SECT_BY_FACTION[selectedFaction]];
  return `<span class="skill-glyph" style="--skill-color:${sect.color}">${skillIconMarkup(sect.kit[skill], skill, sect.color)}</span>`;
}

function renderSkillBar(): void {
  if (!game) {
    skillBar.innerHTML = "";
    renderedSkillSect = null;
    return;
  }
  const player = game.player;
  const sect = playerSect(player);
  const skillData = [
    {
      key: "skill1" as const,
      number: "1",
      name: sect.skills[0],
      icon: sect.basicRange <= 100 ? "✧" : sect.element === "Hỏa" ? "☄" : "❄",
    },
    {
      key: "skill2" as const,
      number: "2",
      name: sect.skills[1],
      icon: sect.basicRange <= 100 ? "➶" : sect.element === "Hỏa" ? "◉" : "◌",
    },
    { key: "ultimate" as const, number: "3", name: sect.ultimate, icon: "✦" },
  ];
  if (renderedSkillSect !== player.factionId) {
    skillBar.innerHTML = skillData
      .map(
        (skill) =>
          `<button class="skill-button" data-skill="${skill.key}" title="${skill.name} · ${sect.kit[skill.key].mp} MP · ${sect.kit[skill.key].cooldown}s"><span class="skill-number">${skill.number}</span>${skillGlyphMarkup(skill.key, sect.id)}<span class="skill-name">${skill.name}</span><span class="skill-cooldown"></span></button>`,
      )
      .join("");
    renderedSkillSect = player.factionId;
    skillBar.insertAdjacentHTML(
      "beforeend",
      `<button class="skill-button" data-basic-attack title="Đánh thường (4)" aria-label="Đánh thường"><span class="skill-number">4</span>${skillIconMarkup(sect.kit.skill1, "skill1", sect.color)}<span class="skill-cooldown">ĐÁNH</span></button>`,
    );
  }
  for (const skill of skillData) {
    const locked =
      (skill.key === "skill2" && player.level < 3) ||
      (skill.key === "ultimate" && player.level < 5);
    const cooldown = player.cooldowns[skill.key];
    const coolText = locked
      ? "KHÓA"
      : cooldown > 0
        ? `${cooldown.toFixed(1)}s`
        : player.mp < sect.kit[skill.key].mp
          ? "THIẾU MP"
          : skill.key === "ultimate"
          ? `${Math.floor(player.rage)}% nộ`
          : `${sect.kit[skill.key].mp} MP`;
    const button = skillBar.querySelector<HTMLButtonElement>(
      `[data-skill="${skill.key}"]`,
    )!;
    button.classList.toggle("locked", locked);
    button.setAttribute("aria-label", `${skill.name}: ${coolText}`);
    button.querySelector(".skill-cooldown")!.textContent = coolText;
  }
  skillBar.querySelector("[data-basic-attack] .skill-cooldown")!.textContent =
    player.attackCooldown > 0 ? `${player.attackCooldown.toFixed(1)}s` : "ĐÁNH";
}

function itemRow(item: Item, index: number, equipped = false): string {
  const statLabel = `${equipmentGrade(item.level)} · LC ${formatNumber(gearScore(item))}`;
  const enhanceButton = `<button class="mini-button enhance-btn" data-index="${index}" ${equipped ? `data-equipped="${item.slot}"` : ""}>+ Cường hóa</button>`;
  const equipButton = equipped
    ? ""
    : `<button class="mini-button equip-btn" data-index="${index}">Mặc đồ</button>`;
  const saleButton = equipped
    ? ""
    : `<button class="mini-button sell-btn ${pendingSaleId === item.id ? "sale-confirm" : ""}" data-item-id="${escapeHtml(item.id)}" ${game?.mapMode === "dungeon" ? "disabled" : ""}>${pendingSaleId === item.id ? "Xác nhận bán" : `Bán · ${itemSalePrice(item)} bạc`}</button>`;
  const cancelButton =
    pendingSaleId === item.id
      ? `<button class="mini-button" data-cancel-sale>Hủy</button>`
      : "";
  return `<div class="item-row" style="--rarity-color:${item.color}"><div class="item-icon">${equipmentMarkup(item.slot, item.color, item.rarity)}</div><div class="item-copy"><strong>${escapeHtml(item.name)} ${item.enhance ? `+${item.enhance}` : ""}</strong><span>${item.rarity} · Cấp ${item.level} · ${statLabel}</span>${gearStatsMarkup(item)}</div><div class="item-actions">${equipButton}${enhanceButton}${saleButton}${cancelButton}</div></div>`;
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
  const renderKey = JSON.stringify([
    activeTab,
    pendingSaleId,
    player.sect,
    player.factionId,
    player.level,
    player.gold,
    player.refiningStones,
    player.skillPoints,
    player.skillRanks,
    player.potions,
    Math.ceil(player.potionCooldown),
    player.inventory,
    player.equipment,
    player.pendingItems.length,
    player.dungeonClears,
    game.mapMode,
    game.dungeonId,
    game.dungeonWave,
    game.dungeonCleared,
    Math.ceil(game.dungeonTimeLeft),
    shopOpen ? 0 : game.enemies.filter((enemy) => !enemy.dead).length,
  ]);
  if (renderKey === inventoryRenderKey) return;
  inventoryRenderKey = renderKey;
  document
    .querySelectorAll<HTMLButtonElement>(".tab-button")
    .forEach((button) => {
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
    const equipment = (Object.keys(GEAR_SLOTS) as ItemSlot[])
      .map((slot) =>
        player.equipment[slot] ? itemRow(player.equipment[slot]!, 0, true) : "",
      )
      .join("");
    inventoryContent.innerHTML = `
      <div class="smith-intro"><span class="smith-icon">⚒</span><div><strong>Lò rèn Rừng Trúc</strong><p>Dùng bạc và đá tinh luyện. Thất bại không làm mất cấp.</p></div></div>
      <div class="resource-hint"><span>Chi phí hiện tại phụ thuộc cấp cường hóa</span><b>${player.refiningStones} đá · ${player.gold} bạc</b></div>
      <div class="item-list smith-list">${equipment}</div>
    `;
    return;
  }
  if (activeTab === "skills") {
    const sect = playerSect(player);
    const skillRows = SKILL_KEYS.map(key => ({ key, ...sect.kit[key] }));

    inventoryContent.innerHTML = `
      <div class="skill-points-card"><span class="skill-points-icon">✦</span><div><strong>${player.skillPoints} điểm võ học</strong><p>Mỗi lần lên cấp nhận 1 điểm. Tối đa bậc 20.</p></div></div>
      <div class="skill-list">${skillRows
        .map((skill) => {
          const rank = player.skillRanks[skill.key] ?? 0;
          const unlocked = player.level >= skill.unlock;
          return `<div class="skill-row ${unlocked ? "" : "locked-row"}"><div class="skill-row-icon">${skillGlyphMarkup(skill.key, sect.id)}</div><div class="skill-row-copy"><strong>${escapeHtml(skill.name)}</strong><span>${skill.description} · ${skill.mp} MP · Hồi ${skill.cooldown}s</span><small>${unlocked ? `Bậc ${rank}/20 · Mở từ cấp ${skill.unlock}` : `Mở ở cấp ${skill.unlock}`}</small></div><button class="mini-button skill-upgrade" data-skill-rank="${skill.key}" ${!unlocked || rank >= 20 || player.skillPoints < 1 ? "disabled" : ""}>${rank >= 20 ? "TỐI ĐA" : "NÂNG +1"}</button><button class="mini-button skill-refund" data-refund-skill="${skill.key}" ${rank <= 1 ? "disabled" : ""} aria-label="Rút một điểm ${escapeHtml(skill.name)}">−</button></div>`;
        })
        .join("")}</div>
    `;
    return;
  }
  if (activeTab === "dungeon") {
    if (game.mapMode === "dungeon") {
      const dungeon = DUNGEONS[game.dungeonId!];
      const minutes = Math.floor(game.dungeonTimeLeft / 60)
        .toString()
        .padStart(2, "0");
      const seconds = Math.floor(game.dungeonTimeLeft % 60)
        .toString()
        .padStart(2, "0");
      inventoryContent.innerHTML = game.dungeonCleared
        ? `
        <div class="dungeon-state cleared"><span class="dungeon-glyph">✓</span><strong>${dungeon.name} hoàn thành</strong><p>Nhận thưởng để về Rừng Trúc. Tất cả đồ chưa nhặt sẽ được thu hồi; túi đầy sẽ chuyển vào Đồ chờ nhận.</p><button class="outline-button dungeon-btn" data-dungeon-action="claim">Nhận thưởng phụ bản</button></div>
      `
        : `
        <div class="dungeon-state"><span class="dungeon-glyph">◇</span><strong>${dungeon.name}</strong><p>Đợt ${game.dungeonWave + 1}/${dungeon.waves.length} · Còn ${game.enemies.filter((enemy) => !enemy.dead).length} quái.<br>${dungeon.mechanic}</p><div class="dungeon-timer">${minutes}:${seconds}</div><p>Ngã xuống, hết giờ hoặc rời sớm: không nhận thưởng hoàn thành.</p><button class="outline-button dungeon-btn" data-dungeon-action="leave">Rời phụ bản</button></div>
      `;
    } else {
      inventoryContent.innerHTML = `<p class="panel-notice">2 phụ bản solo · Chuẩn bị bình tại Tiệm. Phần thưởng cấp một lần cho mỗi lượt hoàn thành, chưa có giới hạn ngày ở bản local.</p>${Object.values(
        DUNGEONS,
      )
        .map((dungeon) => {
          const unlocked = canEnterDungeon(
            dungeon.id,
            player.level,
            player.dungeonClears,
          );
          const condition =
            player.level < dungeon.minLevel
              ? `Cần cấp ${dungeon.minLevel}`
              : `Cần hoàn thành ${DUNGEONS[dungeon.prerequisite!]?.name ?? "thí luyện"}`;
          return `<div class="dungeon-card"><strong>${dungeon.name}</strong><small>Solo · Cấp ${dungeon.minLevel}+ · ${dungeon.timeLimit / 60} phút · ${dungeon.waves.length} đợt · Đã vượt ${player.dungeonClears[dungeon.id]} lần</small><p>${dungeon.description}</p><div class="dungeon-reward-line"><b>+${dungeon.reward.xp} XP · +${dungeon.reward.gold} bạc · +${dungeon.reward.tokens} token · +${dungeon.reward.stones} đá · 1 đồ Hiếm</b></div><button class="outline-button dungeon-btn" data-dungeon-action="enter" data-dungeon-id="${dungeon.id}" ${unlocked ? "" : "disabled"}>${unlocked ? "Vào phụ bản" : condition}</button></div>`;
        })
        .join("")}`;
    }
    return;
  }
  const equipped = (Object.keys(GEAR_SLOTS) as ItemSlot[])
    .map((slot) => {
      const item = player.equipment[slot];
      if (!item)
        return `<div class="equipped-empty">${GEAR_SLOTS[slot].name}: trống</div>`;
      return `<div class="equipped-label">${`${GEAR_SLOTS[slot].name.toLocaleUpperCase("vi")} ĐANG DÙNG`}</div>${itemRow(item, 0, true)}`;
    })
    .join("");
  const bag = player.inventory
    .map((item, index) => itemRow(item, index))
    .join("");
  inventoryContent.innerHTML = `
    <div class="bag-tools"><button class="mini-button" data-auto-equip>Mặc đồ mạnh nhất</button><button class="mini-button" data-discard-filter>Vứt đồ theo lọc</button><button class="mini-button" data-save-progress>Lưu</button><button class="mini-button" data-load-progress>Tải</button><button class="mini-button" data-open-shop>Tiệm</button></div>
    <div class="bag-grid">${Array.from({ length: BAG_CAPACITY }, (_, index) => {
      const item = player.inventory[index];
      return `<button class="bag-slot" ${item ? `data-inspect-item="${escapeHtml(item.id)}" style="--rarity-color:${item.color}" aria-label="${escapeHtml(item.name)}"` : 'disabled aria-label="Ô trống"'}>${item ? `${equipmentMarkup(item.slot, item.color, item.rarity)}<small>${item.level}</small>${item.enhance ? `<b>+${item.enhance}</b>` : ""}` : ""}</button>`;
    }).join("")}</div>
    ${supplyMarkup()}
    ${player.pendingItems.length ? `<div class="pending-rewards"><strong>Đồ chờ nhận · ${player.pendingItems.length} món</strong><p>Thưởng đã giữ lại, kể cả khi tải lại trang.</p><button class="outline-button" data-collect-pending ${player.inventory.length >= BAG_CAPACITY ? "disabled" : ""}>Nhận vào túi</button></div>` : ""}
    <div class="equipped-block">${equipped}</div>
    <div class="equipped-label bag-label">ĐỒ NHẶT ĐƯỢC</div>
    <div class="item-list">${bag || `<div class="empty-state">Hạ quái để tìm trang bị rơi dưới đất.</div>`}</div>
  `;
}

function playerSect(player: Player): Sect {
  const faction = factionOf(player.factionId, player.sect);
  const school = SCHOOL_KITS[SECT_BY_FACTION[faction.id]];
  return { ...school, skills: [school.kit.skill1.name, school.kit.skill2.name], ultimate: school.kit.ultimate.name };
}

function playerIdleActive(): boolean {
  return Boolean(
    game?.player.idle.enabled &&
      !game.player.idle.inTown &&
      !game.goldenEncounter &&
      game.mapMode === "world",
  );
}
const trainingArts = new Map<number, HTMLCanvasElement>();
function trainingArt(stage: number): HTMLCanvasElement {
  const region = stageInfo(stage).region;
  if (!trainingArts.has(region))
    trainingArts.set(
      region,
      createTrainingArt(region, WORLD_WIDTH, WORLD_HEIGHT),
    );
  return trainingArts.get(region)!;
}
function prepareIdleWave(resetPosition = true): void {
  if (!game || !game.player.idle.enabled || game.goldenEncounter) return;
  const progress = game.player.idle;
  idleNextWave = 0;
  game.targetId = null;
  game.moveTarget = null;
  game.telegraphs = [];
  if (resetPosition) {
    game.effects = [];
    game.zones = [];
    game.combat = freshCombat();
    game.player.x = progress.inTown ? PLAYER_START.x : 950;
    game.player.y = progress.inTown ? PLAYER_START.y : 650;
    game.cameraX = clamp(
      game.player.x - VIEW_WIDTH / 2,
      0,
      WORLD_WIDTH - VIEW_WIDTH,
    );
    game.cameraY = clamp(
      game.player.y - VIEW_HEIGHT / 2,
      0,
      WORLD_HEIGHT - VIEW_HEIGHT,
    );
    document.getElementById("loot-notices")!.replaceChildren();
  } else {
    game.combat.enemyMotions.clear();
    game.combat.strikes = [];
    game.combat.projectiles = [];
    game.combat.dash = null;
  }
  if (progress.inTown) {
    game.enemies = [];
    return;
  }
  const info = stageInfo(progress.stage);
  const bossWave = info.boss && progress.wave === 4;
  const names = ["Sơn tặc", "Trúc Lang", "U Binh", "Hắc Phong", "Lang Vương"];
  const positions = [
    { x: 820, y: 570 },
    { x: 1060, y: 700 },
    { x: 1010, y: 485 },
  ];
  game.enemies = positions.slice(0, bossWave ? 1 : 3).map((position, index) => {
    const kind = bossWave
      ? "boss"
      : progress.wave === 4 && index === 0
        ? "elite"
        : "normal";
    const enemy = createEnemy(
      `stage-${progress.stage}-${progress.wave}-${index}`,
      bossWave
        ? `${info.name} · Lang Vương`
        : `${names[info.region % 4]}${kind === "elite" ? " tinh anh" : ""}`,
      kind,
      bossWave ? 950 : position.x,
      bossWave ? 490 : position.y,
      info.level,
      ELEMENTS[info.element].color,
    );
    enemy.element = info.element;
    return enemy;
  });
  game.worldEnemies = game.enemies;
  canvasBadge.textContent = `${info.name.toLocaleUpperCase("vi")} · ẢI ${info.localStage}${bossWave ? " · TRÙM" : ""}`;
}
function collectIdleLoot(force = false): void {
  if (!game || !game.loot.length) return;
  const ready = game.loot.filter(
    (loot) => force || nowMs() - (loot.bornAt ?? 0) >= 1600,
  );
  if (!ready.length) return;
  const items: Item[] = [];
  for (const loot of ready) {
    game.player.gold += loot.gold;
    game.player.refiningStones += loot.stones;
    if (loot.item) {
      items.push(loot.item);
      notifyLoot(loot.item);
    }
    animatePickup(loot);
  }
  const ids = new Set(ready.map((loot) => loot.id));
  game.loot = game.loot.filter((loot) => !ids.has(loot.id));
  storeRewardItems(game.player, items);
  if (game.player.idle.autoEquip) autoEquipBest();
  persistGame();
}
function autoEquipBest(): number {
  if (!game) return 0;
  const changed = equipBestGear(game.player);
  syncStats();
  return changed;
}

function gearStatsMarkup(item: Item, current?: Item): string {
  const stats = gearStats(item), old = current ? gearStats(current) : null;
  return `<div class="gear-stat-lines">${(Object.keys(STAT_LABELS) as GearStat[]).filter(key => stats[key] || old?.[key]).map(key => {
    const diff = stats[key] - (old?.[key] ?? 0);
    return `<span><small>${STAT_LABELS[key]}</small><b>+${stats[key]}${key === "crit" ? "%" : ""}</b>${old ? `<em class="${diff < 0 ? "weaker" : ""}">${diff > 0 ? "+" : ""}${diff}</em>` : ""}</span>`;
  }).join("")}</div>`;
}
let discardPreview: { filter: DiscardFilter; ids: Set<string> } | null = null;
function openDiscardFilter(): void {
  if (!game) return;
  discardPreview = null;
  openUtility("Vứt đồ theo bộ lọc", `<p class="dim">Chỉ lọc đồ trong túi. Luôn giữ đồ đang mặc, đồ Hoàng Kim, đồ đã cường hóa và Đồ chờ nhận.</p><div class="card"><label class="form-row">Phẩm chất tối đa<select id="discard-rarity">${RARITIES.slice(0, 4).map((name, index) => `<option value="${index}" ${index === 1 ? "selected" : ""}>${name}</option>`).join("")}</select></label><label class="form-row">Cấp trang bị tối đa<input id="discard-level" type="number" min="1" max="160" value="${game.player.level}"></label><label class="discard-check"><input id="discard-weaker" type="checkbox" checked> Chỉ vứt đồ yếu hơn hoặc bằng món đang mặc</label></div><button id="preview-discard" class="outline-button">Xem đồ sẽ vứt</button><div id="discard-preview" aria-live="polite"></div>`);
}
function previewDiscard(): void {
  if (!game) return;
  const maxLevel = Number(document.querySelector<HTMLInputElement>("#discard-level")!.value);
  if (!Number.isInteger(maxLevel) || maxLevel < 1 || maxLevel > 160) return showToast("Cấp trang bị phải từ 1 đến 160.");
  const filter = { maxRarity: Number(document.querySelector<HTMLSelectElement>("#discard-rarity")!.value), maxLevel, weakerOnly: document.querySelector<HTMLInputElement>("#discard-weaker")!.checked };
  const items = discardCandidates(game.player, filter);
  discardPreview = { filter, ids: new Set(items.map(item => item.id)) };
  document.getElementById("discard-preview")!.innerHTML = `<p><b>${items.length} món sẽ bị vứt</b> · Không nhận bạc.</p><ul class="discard-list">${items.map(item => `<li style="color:${item.color}">${escapeHtml(item.name)} · ${item.rarity} · Cấp ${item.level}</li>`).join("")}</ul><div class="btnrow"><button class="outline-button danger-text" id="confirm-discard" ${items.length ? "" : "disabled"}>Xác nhận vứt ${items.length} món</button><button class="outline-button" id="cancel-discard">Hủy</button></div>`;
}
function confirmDiscard(): void {
  if (!game || !discardPreview) return;
  const ids = new Set(discardCandidates(game.player, discardPreview.filter).filter(item => discardPreview!.ids.has(item.id)).map(item => item.id));
  game.player.inventory = game.player.inventory.filter(item => !ids.has(item.id));
  discardPreview = null; pendingSaleId = null; closeUtility();
  addLog(`Đã vứt ${ids.size} món theo bộ lọc.`);
  persistGame(); refreshUi(true);
}
function openGoldenBoss(): void {
  if (!game) return;
  openUtility("Boss Hoàng Kim", `<p class="dim">Giờ Việt Nam (UTC+7). Mỗi boss xuất hiện 20 phút; mỗi nhân vật nhận thưởng một lần mỗi khung giờ. Cần cấp 5.</p><div class="golden-schedule">${goldenWindows(Date.now()).map(window => `<div class="card"><b>${window.boss.name}</b><span>${window.boss.hour}:00 – ${window.boss.hour}:20</span><small>Hệ ${ELEMENTS[window.boss.element].name} · ${game!.player.goldenClears.includes(window.id) ? "Đã hạ hôm nay" : "1 trang bị Hoàng Kim chắc chắn · 15% rơi thêm"}</small></div>`).join("")}</div><div id="golden-dialog-status" class="card"></div><button id="golden-enter" class="outline-button">Khiêu chiến</button><button id="golden-leave" class="outline-button hidden">Rời boss và thu hồi đồ</button>`);
  refreshGoldenUi();
}
function refreshGoldenUi(): void {
  if (!game) return;
  const now = Date.now(), encounter = game.goldenEncounter, status = goldenStatus(now, game.player.goldenClears);
  const message = encounter ? `${encounter.window.boss.name} · Còn ${countdown(encounter.window.endsAt - now)}` : status.active ? `${status.active.boss.name} · ${status.defeated ? "Đã hạ lượt này" : `Đang xuất hiện · ${countdown(status.active.endsAt - now)}`}` : `${status.next.boss.name} · Sau ${countdown(status.next.startsAt - now)}`;
  document.getElementById("golden-status")!.textContent = message;
  document.getElementById("golden-boss-btn")!.textContent = encounter ? "Đang đấu" : status.active && !status.defeated ? "Khiêu chiến" : "Lịch boss";
  const dialog = document.getElementById("golden-dialog-status");
  if (dialog) {
    dialog.textContent = message;
    const enter = document.querySelector<HTMLButtonElement>("#golden-enter")!;
    enter.disabled = !status.active || status.defeated || Boolean(encounter) || game.player.level < 5 || game.mapMode === "dungeon";
    enter.textContent = game.player.level < 5 ? "Cần cấp 5" : game.mapMode === "dungeon" ? "Hãy rời phụ bản trước" : status.defeated ? "Đã nhận thưởng lượt này" : !status.active ? "Chưa đến giờ xuất hiện" : "Khiêu chiến";
    document.getElementById("golden-leave")!.classList.toggle("hidden", !encounter);
  }
  if (encounter) {
    document.getElementById("stage-name")!.textContent = encounter.window.boss.name;
    document.getElementById("stage-description")!.textContent = `Đấu trường Hoàng Kim · Còn ${countdown(encounter.window.endsAt - now)}`;
    document.getElementById("mobile-map-name")!.textContent = "HOÀNG KIM";
    canvasBadge.textContent = "ĐẤU TRƯỜNG HOÀNG KIM";
  }
}
function enterGoldenBoss(): void {
  if (!game || game.goldenEncounter || game.mapMode !== "world" || game.player.level < 5) return;
  const status = goldenStatus(Date.now(), game.player.goldenClears);
  if (!status.active || status.defeated) return showToast("Boss chưa xuất hiện hoặc bạn đã nhận thưởng lượt này.");
  persistGame();
  game.goldenEncounter = { window: status.active, enemies: game.enemies, loot: game.loot, x: game.player.x, y: game.player.y, inTown: game.player.idle.inTown, autoBattle: game.autoBattle };
  const enemy = createEnemy(`golden-${status.active.id}`, status.active.boss.name, "boss", 950, 490, Math.min(160, game.player.level + 2), itemColor("Hoàng Kim"));
  enemy.element = status.active.boss.element;
  enemy.maxHp = Math.floor(enemy.maxHp * 1.8); enemy.hp = enemy.maxHp;
  enemy.attack = Math.floor(enemy.attack * 1.25);
  game.enemies = [enemy]; game.loot = [];
  game.telegraphs = []; game.effects = []; game.zones = []; game.combat = freshCombat();
  game.targetId = enemy.id; game.moveTarget = null;
  game.player.idle.inTown = false;
  game.player.x = 950; game.player.y = 650;
  game.autoBattle = true; idleNextWave = 0;
  resetJoystick(); keys.clear(); closeUtility(); showIdlePage("log");
  addLog(`${enemy.name} đã xuất hiện! Né vùng đỏ; boss cuồng nộ khi còn dưới 50% sinh lực.`);
  refreshUi(true);
}
function killGoldenBoss(enemy: Enemy): void {
  if (!game?.goldenEncounter) return;
  if (!claimGoldenKill(game.player.goldenClears, game.goldenEncounter.window, Date.now())) {
    leaveGoldenBoss("Khung giờ đã đóng hoặc phần thưởng đã được nhận."); return;
  }
  enemy.dead = true; enemy.respawnAt = Infinity;
  game.telegraphs = [];
  game.autoBattle = false;
  game.combat.corpses.push({ enemy: { ...enemy }, at: nowMs() });
  game.targetId = null; rewardExperience(900);
  const count = Math.random() < .15 ? 2 : 1;
  for (let i = 0; i < count; i++) game.loot.push({ id: `golden-loot-${game.goldenEncounter.window.id}-${i}`, x: enemy.x + i * 30, y: enemy.y, item: createItem(enemy.level, "Hoàng Kim"), gold: i ? 0 : 800, stones: i ? 0 : 8, expiresAt: Infinity, bornAt: nowMs(), fromX: enemy.x, fromY: enemy.y - 12 });
  addLog(`Đã hạ ${enemy.name}! Rơi ${count} trang bị Hoàng Kim · 800 bạc · 8 đá. Nhặt đồ hoặc bấm Rời boss để thu hồi.`);
  persistGame(); refreshUi(true);
}
function leaveGoldenBoss(message = "Đã rời boss Hoàng Kim và thu hồi đồ rơi."): void {
  if (!game?.goldenEncounter) return;
  collectIdleLoot(true);
  const encounter = game.goldenEncounter;
  game.goldenEncounter = undefined;
  game.enemies = encounter.enemies; game.loot = encounter.loot;
  game.player.x = encounter.x; game.player.y = encounter.y;
  game.player.idle.inTown = encounter.inTown; game.autoBattle = encounter.autoBattle;
  game.targetId = null; game.moveTarget = null;
  game.telegraphs = []; game.effects = []; game.zones = []; game.combat = freshCombat();
  idleNextWave = 0; resetJoystick(); keys.clear(); closeUtility();
  canvasBadge.textContent = game.player.idle.enabled ? `${stageInfo(game.player.idle.stage).name.toLocaleUpperCase("vi")} · ẢI ${stageInfo(game.player.idle.stage).localStage}` : "RỪNG TRÚC · KÊNH 01";
  addLog(message); persistGame(); refreshUi(true);
}

function updateIdleProgress(now: number): void {
  if (!playerIdleActive() || !game) return;
  if (now - lastAutoAction > 450) {
    lastAutoAction = now;
    if (game.player.idle.autoLoot) collectIdleLoot();
  }
  if (!game.enemies.length || game.enemies.some((enemy) => !enemy.dead)) {
    idleNextWave = 0;
    return;
  }
  if (!idleNextWave) {
    idleNextWave = now + 2200;
    return;
  }
  if (now < idleNextWave) return;
  if (game.player.idle.autoLoot) collectIdleLoot(true);
  const result = completeWave(game.player.idle);
  if (result.stageCleared) {
    game.player.hp = Math.min(
      game.player.maxHp,
      game.player.hp + Math.ceil(game.player.maxHp * 0.2),
    );
    addLog(
      result.advanced
        ? `Đã vượt ải! Tiến vào ${stageInfo(game.player.idle.stage).name} · Ải ${stageInfo(game.player.idle.stage).localStage}.`
        : "Đã hoàn thành ải. Tiếp tục luyện công để tìm trang bị.",
    );
    persistGame();
  }
  prepareIdleWave(false);
}
function showIdlePage(tab: string): void {
  document.querySelector(".app-shell")!.classList.remove("arena-expanded");
  document.getElementById("compact-btn")!.setAttribute("aria-pressed", "false");
  const navTab = tab;
  idlePage = tab === "skill" || tab === "inv" ? "inventory" : tab;
  document.querySelector<HTMLElement>(".app-shell")!.dataset.page = idlePage;
  document
    .querySelectorAll<HTMLButtonElement>("[data-idle-tab]")
    .forEach((button) => {
      const selected = button.dataset.idleTab === navTab;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-current", selected ? "page" : "false");
    });
  if (tab === "skill") activeTab = "skills";
  if (tab === "inv" && activeTab === "skills") activeTab = "bag";
  if (tab === "more") hydrateSettings();
  refreshUi(true);
}
function refreshIdleUi(): void {
  if (!game) return;
  const player = game.player,
    progress = player.idle,
    info = stageInfo(progress.stage);
  const faction = factionOf(player.factionId, player.sect),
    element = ELEMENTS[faction.element];
  const text = (id: string, value: string) => {
    document.getElementById(id)!.textContent = value;
  };
  text("idle-level", String(player.level));
  text(
    "idle-stage-label",
    game.mapMode === "dungeon"
      ? "Phụ bản solo"
      : progress.inTown
        ? "Thanh Khê Trấn"
        : progress.enabled
          ? `Ải ${progress.stage} · đợt ${progress.wave}/4`
          : "Rừng Trúc",
  );
  text(
    "stage-name",
    progress.inTown
      ? "Thanh Khê Trấn · Nghỉ ngơi"
      : `${info.name} · Ải ${info.localStage}/10${info.boss ? " (Trùm)" : ""}`,
  );
  text(
    "stage-description",
    progress.enabled
      ? `Quái cấp ${info.level} · hệ ${ELEMENTS[info.element].name} · Đã hạ ${formatNumber(progress.totalKills)} quái`
      : "Phiêu lưu tự do · nhiệm vụ và NPC tại Rừng Trúc",
  );
  text("stage-push", progress.push ? "Vượt ải" : "Luyện công");
  text(
    "rotation-btn",
    progress.autoSkills ? "⟳ Xoay chiêu: Bật" : "⟳ Xoay chiêu: Tắt",
  );
  text("town-btn", game.goldenEncounter ? "Rời\nboss" : progress.inTown ? "Trở lại\nải" : "Về\nthành");
  document
    .querySelector<HTMLButtonElement>("#stage-push")!
    .setAttribute("aria-pressed", String(progress.push));
  document
    .querySelector<HTMLButtonElement>("#rotation-btn")!
    .setAttribute("aria-pressed", String(progress.autoSkills));
  document.querySelector<HTMLButtonElement>("#stage-prev")!.disabled =
    progress.stage <= 1 || game.mapMode === "dungeon" || Boolean(game.goldenEncounter);
  document.querySelector<HTMLButtonElement>("#stage-next")!.disabled =
    progress.stage >= progress.maxStage || game.mapMode === "dungeon" || Boolean(game.goldenEncounter);
  document
    .querySelector(".quest-panel")!
    .classList.toggle("hidden", progress.enabled);
  document
    .getElementById("legacy-training")!
    .classList.toggle("hidden", progress.enabled || game.mapMode === "dungeon");
  document
    .querySelector("#gift-btn")!
    .classList.toggle("available", progress.dailyClaim !== dailyDate());
  text(
    "todo-reward",
    progress.dailyClaim === dailyDate()
      ? "Đã nhận quà hôm nay"
      : "Có quà chờ nhận",
  );
  const cultivation = cultivationForPower(currentCombatPower());
  text("combat-power", formatNumber(cultivation.power));
  text("header-combat-power", `⚔ ${formatNumber(cultivation.power)}`);
  document.getElementById("header-combat-power")!.title = `Lực chiến ${formatNumber(cultivation.power)}`;
  refreshGoldenUi();
  text("realm-name", cultivation.realm.name);
  text("realm-phase", cultivation.phase);
  text(
    "realm-plane",
    `${cultivation.rank < 10 ? "Phàm giới" : "Tiên giới"} · Bậc ${cultivation.rank + 1}/19`,
  );
  text(
    "realm-next",
    cultivation.nextPower === null
      ? "Đã đạt Đạo Tổ · Đại viên mãn"
      : `Còn ${formatNumber(cultivation.nextPower - cultivation.power)} lực chiến → ${cultivation.nextLabel}`,
  );
  const realmCard = document.getElementById("cultivation-card")!;
  realmCard.style.setProperty("--realm-color", cultivation.realm.color);
  const realmProgress = document.getElementById("realm-progress")!;
  realmProgress.style.width = `${cultivation.progress * 100}%`;
  document
    .getElementById("realm-meter")!
    .setAttribute(
      "aria-valuenow",
      String(Math.floor(cultivation.progress * 100)),
    );
  canvas.setAttribute(
    "aria-label",
    `Sân đấu Giang Hồ Dị Truyện. ${player.name}: ${cultivation.label}, lực chiến ${formatNumber(cultivation.power)}.`,
  );
  text("character-element", element.name);
  document.getElementById("character-element")!.style.color = element.color;
  document
    .querySelector("#attribute-dot")!
    .classList.toggle("on", progress.attributePoints > 0);
  document
    .querySelector("#skill-dot")!
    .classList.toggle("on", player.skillPoints > 0);
  const regionKey = `${progress.stage}:${progress.maxStage}`;
  if (regionRenderKey !== regionKey) {
    regionRenderKey = regionKey;
    document.getElementById("region-list")!.innerHTML = REGIONS.map(
      (name, index) =>
        `<button class="region-row ${index === info.region ? "current" : ""}" data-region="${index}" ${progress.maxStage >= index * 10 + 1 ? "" : "disabled"}><b>${name}</b><span>Cấp ${index * 10 + 1}–${(index + 1) * 10} ${progress.maxStage < index * 10 + 1 ? "♙" : "›"}</span></button>`,
    ).join("");
  }
  const characterKey = JSON.stringify([
    progress.attributePoints,
    progress.attributes,
    player.equipment,
    player.level,
  ]);
  if (characterRenderKey !== characterKey) {
    characterRenderKey = characterKey;
    text("attribute-points", `${progress.attributePoints} điểm`);
    document.getElementById("equipment-grid")!.innerHTML = (
      Object.keys(GEAR_SLOTS) as ItemSlot[]
    )
      .map((slot) => {
        const item = player.equipment[slot];
        return `<button class="equipment-slot ${item ? "equipped" : ""}" data-enhance-slot="${slot}" style="--rarity-color:${item?.color ?? "#45584d"}" ${item ? "" : "disabled"} aria-label="${GEAR_SLOTS[slot].name}${item ? `: ${item.name}, cường hóa +${item.enhance}` : ": trống"}">${item ? `${equipmentMarkup(item.slot, item.color, item.rarity, "equipment-icon")}<small>${escapeHtml(item.name)}</small><b>+${item.enhance}</b>` : `<span>${GEAR_SLOTS[slot].name}</span>`}</button>`;
      })
      .join("");
    document.getElementById("attribute-list")!.innerHTML = (
      Object.keys(ATTRIBUTES) as Attribute[]
    )
      .map(
        (key) =>
          `<div class="attribute-row"><span>${ATTRIBUTES[key].name}<small>${ATTRIBUTES[key].description}</small></span><b>${progress.attributes[key]}</b><button class="attribute-button" data-attribute="${key}" data-delta="1" ${progress.attributePoints > 0 ? "" : "disabled"} aria-label="Tăng ${ATTRIBUTES[key].name}">+</button><button class="attribute-button" data-attribute="${key}" data-delta="-1" ${progress.attributes[key] > 0 ? "" : "disabled"} aria-label="Rút điểm ${ATTRIBUTES[key].name}">−</button></div>`,
      )
      .join("");
  }
}
function hydrateSettings(): void {
  if (!game) return;
  document.querySelector<HTMLInputElement>("#settings-name")!.value =
    game.player.name;
  document.querySelector<HTMLSelectElement>("#settings-sex")!.value =
    game.player.sex;
  document.querySelector<HTMLSelectElement>("#game-speed")!.value = String(
    game.player.idle.speed,
  );
  document
    .querySelectorAll<HTMLInputElement>("[data-setting]")
    .forEach((input) => {
      input.checked = Boolean(
        game!.player.idle[input.dataset.setting as keyof IdleProgress],
      );
    });
}
function openUtility(title: string, content: string): void {
  document.getElementById("utility-title")!.textContent = title;
  document.getElementById("utility-content")!.innerHTML = content;
  document.getElementById("utility-overlay")!.classList.remove("hidden");
  document.querySelector<HTMLElement>(".utility-dialog")!.focus();
}
function closeUtility(): void {
  document.getElementById("utility-overlay")!.classList.add("hidden");
}
function openRealmGuide(): void {
  if (!game) return;
  const current = cultivationForPower(currentCombatPower());
  openUtility(
    "Cảnh giới tu tiên",
    `<p class="dim">Cảnh giới tự thay đổi theo lực chiến hiện tại. Luyện Thể và Luyện Khí có 9 tầng; từ Trúc Cơ có Sơ kỳ, Trung kỳ, Hậu kỳ, Đỉnh phong và Đại viên mãn. Đạt Chân Tiên là bước vào Tiên giới.</p><table class="realm-table"><thead><tr><th>Bậc</th><th>Cảnh giới</th><th>Lực chiến từ</th></tr></thead><tbody>${REALMS.map((realm, rank) => `<tr class="${rank === current.rank ? "current-realm" : ""}" ${rank === current.rank ? 'aria-current="true"' : ""}><td>${rank + 1}</td><td style="color:${realm.color}">${realm.name}</td><td>${formatNumber(realm.minPower)}</td></tr>`).join("")}</tbody></table>`,
  );
}
function showItemDetail(item: Item): void {
  if (!game) return;
  const current = game.player.equipment[item.slot];
  const diff = Math.floor(gearScore(item)) - Math.floor(gearScore(current));
  const inBag = game.player.inventory.some(
    (candidate) => candidate.id === item.id,
  );
  const equipped = current?.id === item.id;
  const attribute = "lực chiến";
  openUtility(
    item.name,
    `<div class="item-detail">${equipmentMarkup(item.slot, item.color, item.rarity, "detail-gear-art")}<b style="color:${item.color}">${item.rarity} · Cấp ${item.level} · ${equipmentGrade(item.level)} · LC ${formatNumber(gearScore(item))}</b><p>Cường hóa +${item.enhance} · ${GEAR_SLOTS[item.slot].name}</p>${gearStatsMarkup(item, current)}</div><div class="item-comparison"><small>${current ? `Đang mặc: ${escapeHtml(current.name)} +${current.enhance}` : "Vị trí này đang trống"}</small><strong class="${diff < 0 ? "weaker" : ""}">${equipped ? "Đang trang bị" : `${diff >= 0 ? "+" : ""}${diff} ${attribute} so với hiện tại`}</strong></div>${inBag ? `<button class="outline-button" data-inspect-equip="${escapeHtml(item.id)}">Mặc trang bị</button>` : `<p class="dim">${equipped ? "Món này đang được nhân vật sử dụng." : "Món này đã được giữ trong Đồ chờ nhận."}</p>`}`,
  );
}
function openDailyRewards(): void {
  if (!game) return showToast("Hãy chọn môn phái trước.");
  const got = game.player.idle.dailyClaim === dailyDate();
  const count = game.player.idle.dailyCount;
  openUtility(
    "Phần thưởng giang hồ",
    `<p class="dim">Mỗi ngày nhận một lần. Quà được lưu cùng nhân vật này.</p><div class="daily-days">${Array.from({ length: 7 }, (_, index) => `<div class="daily-day ${count % 7 === index ? "current" : ""}"><span>Ngày ${index + 1}</span><b>◆ ${100 + index * 50}</b><small>2 đá</small></div>`).join("")}</div><div class="card reward-summary">◆ ${100 + (count % 7) * 50} bạc · ✦ 2 đá · 3 bình HP · 2 bình MP</div><button id="claim-daily" class="outline-button" ${got ? "disabled" : ""}>${got ? "Đã nhận hôm nay" : "Nhận thưởng hôm nay"}</button>`,
  );
}
function openSlots(): void {
  if (game?.mapMode === "dungeon")
    return showToast("Hãy hoàn thành hoặc rời phụ bản trước khi đổi nhân vật.");
  persistGame();
  const cards = [0, 1, 2]
    .map((slot) => {
      let detail = "Chưa có nhân vật";
      try {
        const raw = localStorage.getItem(slotKey(slot));
        if (raw) {
          const value = validateSave(JSON.parse(raw));
          detail = `${value.player.name ?? "Lữ khách"} · cấp ${value.player.level}`;
        }
      } catch {
        detail = "Dữ liệu cần kiểm tra";
      }
      return `<button class="slot-card ${slot === activeSlot ? "current" : ""}" data-character-slot="${slot}"><span>Nhân vật ${slot + 1}</span><b>${escapeHtml(detail)}</b><small>${slot === activeSlot ? "Đang chơi" : "Chọn nhân vật"}</small></button>`;
    })
    .join("");
  openUtility(
    "Chọn nhân vật",
    `<p class="dim">Ba nhân vật lưu độc lập. Chuyển nhân vật sẽ lưu tiến trình hiện tại.</p><div class="slot-list">${cards}</div>`,
  );
}
function validateSave(value: unknown): {
  player: Player;
  enemies: Enemy[];
  savedAt?: number;
  groundLoot?: GroundLoot[];
} {
  if (!value || typeof value !== "object") throw new Error("save-invalid");
  const data = value as {
      player: Player;
      enemies: Enemy[];
      savedAt?: number;
      groundLoot?: GroundLoot[];
    },
    player = data.player;
  if (
    !player ||
    typeof player !== "object" ||
    !Object.hasOwn(SECTS, player.sect)
  )
    throw new Error("save-invalid");
  for (const key of [
    "x",
    "y",
    "level",
    "xp",
    "hp",
    "maxHp",
    "mp",
    "maxMp",
    "attack",
    "defense",
    "gold",
    "refiningStones",
  ] as const) {
    if (
      typeof player[key] !== "number" ||
      !Number.isFinite(player[key]) ||
      player[key] < 0 ||
      player[key] > 1e9
    )
      throw new Error("save-invalid");
  }
  if (
    !Number.isInteger(player.level) ||
    player.level < 1 ||
    player.level > 160 ||
    player.maxHp < 1 ||
    player.maxMp < 1
  )
    throw new Error("save-invalid");
  if (player.x > WORLD_WIDTH || player.y > WORLD_HEIGHT)
    throw new Error("save-invalid");
  player.radius = HERO_SIZE.radius;
  player.goldenClears = normalizeGoldenClears(player.goldenClears);

  player.facingX = Number.isFinite(player.facingX)
    ? clamp(player.facingX, -1, 1)
    : 1;
  player.facingY = Number.isFinite(player.facingY)
    ? clamp(player.facingY, -1, 1)
    : 0;
  player.attackCooldown = 0;
  player.shield = 0;
  player.shieldUntil = 0;
  player.skillPoints = Number.isFinite(player.skillPoints)
    ? Math.max(0, Math.floor(player.skillPoints))
    : 0;
  player.skillRanks = Object.fromEntries(
    (["skill1", "skill2", "ultimate"] as SkillKey[]).map((key) => [
      key,
      Number.isFinite(player.skillRanks?.[key])
        ? clamp(Math.floor(player.skillRanks[key]), 0, 20)
        : key === "skill1"
          ? 1
          : 0,
    ]),
  ) as Record<SkillKey, number>;
  player.dungeonClears = Object.fromEntries(
    (["tomb", "bamboo"] as DungeonId[]).map((key) => [
      key,
      Number.isFinite(player.dungeonClears?.[key])
        ? Math.max(0, Math.floor(player.dungeonClears[key]))
        : key === "tomb" && player.dungeonTokens > 0
          ? 1
          : 0,
    ]),
  ) as Record<DungeonId, number>;
  const checkItem = (item: Item) =>
    Boolean(
      item &&
        typeof item.id === "string" &&
        item.id.length < 150 &&
        typeof item.name === "string" &&
        item.name.length < 150 &&
        Object.hasOwn(GEAR_SLOTS, item.slot) &&
        RARITIES.includes(item.rarity) &&
        validBonuses(item.bonuses) &&
        Number.isFinite(item.power) &&
        item.power >= 0 &&
        item.power <= 1e7 &&
        Number.isInteger(item.enhance) &&
        item.enhance >= 0 &&
        item.enhance <= 10 &&
        Number.isInteger(item.level) &&
        item.level >= 1 &&
        item.level <= 160 &&
        typeof item.icon === "string" &&
        item.icon.length <= 30 &&
        typeof item.color === "string" &&
        /^#[0-9a-fA-F]{6}$/.test(item.color),
    );
  if (
    !Array.isArray(player.inventory) ||
    player.inventory.length > BAG_CAPACITY ||
    !player.inventory.every(checkItem) ||
    !player.equipment ||
    !Object.values(player.equipment).every(checkItem)
  )
    throw new Error("save-invalid");
  if (
    player.pendingItems &&
    (!Array.isArray(player.pendingItems) ||
      player.pendingItems.length > 10000 ||
      !player.pendingItems.every(checkItem))
  )
    throw new Error("save-invalid");
  if (
    data.groundLoot &&
    (!Array.isArray(data.groundLoot) ||
      data.groundLoot.length > 500 ||
      !data.groundLoot.every(
        (loot) =>
          loot &&
          typeof loot.id === "string" &&
          loot.id.length < 200 &&
          Number.isFinite(loot.x) &&
          loot.x >= 0 &&
          loot.x <= WORLD_WIDTH &&
          Number.isFinite(loot.y) &&
          loot.y >= 0 &&
          loot.y <= WORLD_HEIGHT &&
          Number.isInteger(loot.gold) &&
          loot.gold >= 0 &&
          loot.gold <= 1e7 &&
          Number.isInteger(loot.stones) &&
          loot.stones >= 0 &&
          loot.stones <= 1e5 &&
          (!loot.item || checkItem(loot.item)),
      ))
  )
    throw new Error("save-invalid");
  for (const item of [
    ...(data.groundLoot ?? []).flatMap(loot => loot.item ? [loot.item] : []),
    ...player.inventory,
    ...Object.values(player.equipment),
    ...(player.pendingItems ?? []),
  ]) {
    item.color = itemColor(item.rarity);
    if (
      typeof item.icon !== "string" ||
      item.icon.length > 30 ||
      typeof item.color !== "string" ||
      !/^#[0-9a-fA-F]{6}$/.test(item.color)
    )
      throw new Error("save-invalid");
  }
  if (
    !Object.entries(player.equipment).every(
      ([slot, item]) => Object.hasOwn(GEAR_SLOTS, slot) && item.slot === slot,
    )
  )
    throw new Error("save-invalid");
  if (
    !player.cooldowns ||
    !["skill1", "skill2", "ultimate"].every(
      (key) =>
        Number.isFinite(player.cooldowns[key as SkillKey]) &&
        player.cooldowns[key as SkillKey] >= 0,
    )
  )
    throw new Error("save-invalid");
  player.name =
    typeof player.name === "string"
      ? player.name.slice(0, 16)
      : "Tân nhân giang hồ";
  player.rage = Number.isFinite(player.rage) ? clamp(player.rage, 0, 100) : 0;
  player.hp = Math.min(player.hp, player.maxHp);
  player.mp = Math.min(player.mp, player.maxMp);
  return data;
}
function importCharacter(raw: string): void {
  if (game?.mapMode === "dungeon")
    return showToast("Hãy rời phụ bản trước khi nạp nhân vật.");
  try {
    if (raw.length > 5e6) throw new Error("save-too-large");
    const snapshot = validateSave(JSON.parse(raw));
    snapshot.savedAt = Date.now();
    const previous = localStorage.getItem(SAVE_KEY);
    if (previous) localStorage.setItem(`${SAVE_KEY}-backup`, previous);
    localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
    loadGame();
    showToast("Đã nạp nhân vật. Bản cũ được giữ trong bản sao lưu.");
  } catch {
    showToast("File lưu không hợp lệ. Nhân vật hiện tại được giữ nguyên.");
  }
}
function confirmNewCharacter(): void {
  if (!game) return resetGame();
  if (game.mapMode === "dungeon")
    return showToast("Hãy rời phụ bản trước khi tạo lại nhân vật.");
  openUtility(
    "Tạo lại nhân vật?",
    `<p class="dim">Nhân vật hiện tại trong ô ${activeSlot + 1} sẽ được giữ trong bản sao lưu. Bạn cũng có thể chọn một ô trống để tạo nhân vật mới.</p><div class="btnrow"><button id="confirm-new" class="outline-button danger-text">Tạo nhân vật mới</button><button id="cancel-new" class="outline-button">Hủy</button></div>`,
  );
}
function playCombatSound(frequency: number): void {
  if (
    !game ||
    game.player.idle.muted ||
    !audioContext ||
    audioContext.state !== "running"
  )
    return;
  const oscillator = audioContext.createOscillator(),
    gain = audioContext.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.035, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + 0.07,
  );
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.07);
}
function bindIdleUi(): void {
  document
    .getElementById("realm-guide-btn")!
    .addEventListener("click", openRealmGuide);
  document
    .getElementById("loot-notices")!
    .addEventListener("click", (event) => {
      const entry = (event.target as HTMLElement).closest<HTMLButtonElement>(
        "[data-loot-item]",
      );
      if (!entry || !game) return;
      const item = [
        ...game.player.inventory,
        ...Object.values(game.player.equipment),
        ...game.player.pendingItems,
      ].find((candidate) => candidate.id === entry.dataset.lootItem);
      if (item) showItemDetail(item);
    });
  document
    .querySelectorAll<HTMLButtonElement>("[data-idle-tab]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        showIdlePage(button.dataset.idleTab!),
      ),
    );
  document
    .querySelectorAll<HTMLButtonElement>("[data-idle-open]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        openMobileSheet(button.dataset.idleOpen as PanelTab),
      ),
    );
  document.getElementById("compact-btn")!.addEventListener("click", (event) => {
    const expanded = document
      .querySelector(".app-shell")!
      .classList.toggle("arena-expanded");
    (event.currentTarget as HTMLElement).setAttribute(
      "aria-pressed",
      String(expanded),
    );
    resizeGameViewport();
  });
  const changeStage = (stage: number) => {
    if (
      !game ||
      game.mapMode === "dungeon" ||
      game.goldenEncounter ||
      !goToStage(game.player.idle, stage)
    )
      return;
    game.player.idle.enabled = true;
    prepareIdleWave();
    persistGame();
    refreshUi(true);
  };
  document
    .getElementById("stage-prev")!
    .addEventListener(
      "click",
      () => game && changeStage(game.player.idle.stage - 1),
    );
  document
    .getElementById("stage-next")!
    .addEventListener(
      "click",
      () => game && changeStage(game.player.idle.stage + 1),
    );
  document.getElementById("region-list")!.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-region]",
    );
    if (button) changeStage(Number(button.dataset.region) * 10 + 1);
  });
  document.getElementById("stage-push")!.addEventListener("click", () => {
    if (!game) return;
    game.player.idle.push = !game.player.idle.push;
    persistGame();
    refreshUi(true);
  });
  document.getElementById("rotation-btn")!.addEventListener("click", () => {
    if (!game) return;
    game.player.idle.autoSkills = !game.player.idle.autoSkills;
    hydrateSettings();
    persistGame();
    refreshUi(true);
  });
  document.getElementById("training-btn")!.addEventListener("click", () => {
    if (!game) return;
    if (game.goldenEncounter) leaveGoldenBoss();
    if (game.mapMode === "dungeon")
      return showToast("Hãy hoàn thành phụ bản trước.");
    game.player.idle.enabled = true;
    game.player.idle.inTown = false;
    game.player.idle.push = false;
    game.autoBattle = true;
    prepareIdleWave();
    showIdlePage("log");
    addLog(
      "Luyện công tại ải hiện tại: tự đánh, dùng chiêu và thu hồi vật phẩm.",
    );
    persistGame();
    refreshUi(true);
  });
  document
    .getElementById("legacy-training-btn")!
    .addEventListener("click", () =>
      document.getElementById("training-btn")!.click(),
    );
  document.getElementById("town-btn")!.addEventListener("click", () => {
    if (game?.goldenEncounter) { leaveGoldenBoss(); return; }
    if (!game || game.mapMode === "dungeon")
      return showToast("Hãy rời phụ bản trước khi về thành.");
    collectIdleLoot(true);
    game.player.idle.inTown = !game.player.idle.inTown;
    game.autoBattle = !game.player.idle.inTown;
    prepareIdleWave();
    if (game.player.idle.inTown) {
      game.enemies = [];
      game.player.x = PLAYER_START.x;
      game.player.y = PLAYER_START.y;
      game.player.hp = game.player.maxHp;
      game.player.mp = game.player.maxMp;
      openMobileSheet("shop");
    } else if (!game.player.idle.enabled) game.enemies = makeEnemies();
    persistGame();
    refreshUi(true);
  });
  document
    .getElementById("gift-btn")!
    .addEventListener("click", openDailyRewards);
  document
    .getElementById("todo-reward")!
    .addEventListener("click", openDailyRewards);
  document
    .getElementById("utility-close")!
    .addEventListener("click", closeUtility);
  document
    .getElementById("utility-overlay")!
    .addEventListener("click", (event) => {
      if (event.target === event.currentTarget) closeUtility();
    });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeUtility();
  });
  document
    .getElementById("utility-content")!
    .addEventListener("change", (event) => {
      if ((event.target as HTMLElement).matches("#discard-rarity,#discard-level,#discard-weaker")) {
        discardPreview = null;
        const preview = document.getElementById("discard-preview");
        if (preview) preview.textContent = "Bộ lọc đã thay đổi. Bấm Xem đồ sẽ vứt để kiểm tra lại.";
      }
    });
  document
    .getElementById("utility-content")!
    .addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      if (target.closest("#preview-discard")) previewDiscard();
      if (target.closest("#confirm-discard")) confirmDiscard();
      if (target.closest("#cancel-discard")) { discardPreview = null; closeUtility(); }
      if (target.closest("#golden-enter")) enterGoldenBoss();
      if (target.closest("#golden-leave")) leaveGoldenBoss();
      if (target.closest("#claim-daily") && game) {
        const reward = claimDaily(game.player.idle);
        if (!reward) return;
        game.player.gold += reward.gold;
        game.player.refiningStones += reward.stones;
        game.player.potions.hp = Math.min(
          MAX_POTIONS,
          game.player.potions.hp + reward.hp,
        );
        game.player.potions.mp = Math.min(
          MAX_POTIONS,
          game.player.potions.mp + reward.mp,
        );
        persistGame();
        closeUtility();
        showToast("Đã nhận thưởng hôm nay.");
        refreshUi(true);
      }
      const slot = target.closest<HTMLElement>("[data-character-slot]");
      if (slot) {
        persistGame();
        onlineClient.disconnect();
        activeSlot = Number(slot.dataset.characterSlot);
        SAVE_KEY = slotKey(activeSlot);
        try {
          localStorage.setItem("giang-ho-active-slot", String(activeSlot));
        } catch {
          return showToast("Không lưu được ô nhân vật.");
        }
        closeUtility();
        resetGame();
        if (localStorage.getItem(SAVE_KEY)) loadGame();
      }
      if (target.closest("#cancel-new")) closeUtility();
      const inspected = target.closest<HTMLButtonElement>(
        "[data-inspect-equip]",
      );
      if (inspected && game) {
        const index = game.player.inventory.findIndex(
          (item) => item.id === inspected.dataset.inspectEquip,
        );
        if (index >= 0) {
          equipItem(index);
          persistGame();
          closeUtility();
        }
      }
      if (target.closest("#confirm-new")) {
        const previous = localStorage.getItem(SAVE_KEY);
        if (previous) localStorage.setItem(`${SAVE_KEY}-backup`, previous);
        localStorage.removeItem(SAVE_KEY);
        closeUtility();
        resetGame();
      }
    });
  document
    .querySelector(".character-panel")!
    .addEventListener("click", (event) => {
      if (!game) return;
      const target = event.target as HTMLElement;
      const attribute = target.closest<HTMLElement>("[data-attribute]");
      if (
        attribute &&
        spendAttribute(
          game.player.idle,
          attribute.dataset.attribute as Attribute,
          Number(attribute.dataset.delta) as 1 | -1,
        )
      ) {
        syncStats();
        persistGame();
        refreshUi(true);
      }
      const equipment = target.closest<HTMLElement>("[data-enhance-slot]");
      if (equipment) enhanceItem(0, equipment.dataset.enhanceSlot as ItemSlot);
    });
  document.getElementById("save-name")!.addEventListener("click", () => {
    if (!game) return;
    game.player.name =
      document
        .querySelector<HTMLInputElement>("#settings-name")!
        .value.trim()
        .slice(0, 16) || factionOf(game.player.factionId).name;
    game.player.sex =
      document.querySelector<HTMLSelectElement>("#settings-sex")!.value ===
      "female"
        ? "female"
        : "male";
    persistGame();
    refreshUi(true);
    showToast("Đã lưu thông tin nhân vật.");
  });
  document.getElementById("game-speed")!.addEventListener("change", (event) => {
    if (!game) return;
    const value = Number((event.target as HTMLSelectElement).value);
    game.player.idle.speed = value === 1.5 || value === 2.5 ? value : 1;
    persistGame();
  });
  document
    .querySelectorAll<HTMLInputElement>("[data-setting]")
    .forEach((input) =>
      input.addEventListener("change", () => {
        if (!game) return;
        const key = input.dataset.setting!;
        if (
          [
            "autoSkills",
            "autoPotions",
            "autoLoot",
            "autoEquip",
            "muted",
          ].includes(key)
        )
          (game.player.idle as unknown as Record<string, boolean>)[key] =
            input.checked;
        if (key === "muted" && !input.checked) {
          audioContext ??= new AudioContext();
          void audioContext.resume();
        }
        persistGame();
        refreshUi(true);
      }),
    );
  document.getElementById("export-code")!.addEventListener("click", () => {
    if (persistGame())
      document.querySelector<HTMLTextAreaElement>("#save-code")!.value =
        localStorage.getItem(SAVE_KEY) ?? "";
  });
  document
    .getElementById("import-code")!
    .addEventListener("click", () =>
      importCharacter(
        document.querySelector<HTMLTextAreaElement>("#save-code")!.value,
      ),
    );
  document.getElementById("export-save")!.addEventListener("click", () => {
    if (!persistGame()) return;
    const url = URL.createObjectURL(
      new Blob([localStorage.getItem(SAVE_KEY)!], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `giang-ho-nhan-vat-${activeSlot + 1}.volamsave`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document.getElementById("restore-backup")!.addEventListener("click", () => {
    const raw = localStorage.getItem(`${SAVE_KEY}-backup`);
    if (raw) importCharacter(raw);
    else showToast("Chưa có bản sao lưu cho nhân vật này.");
  });
  document
    .getElementById("import-save")!
    .addEventListener("click", () =>
      document.querySelector<HTMLInputElement>("#save-file")!.click(),
    );
  document
    .getElementById("save-file")!
    .addEventListener("change", async (event) => {
      const input = event.target as HTMLInputElement,
        file = input.files?.[0];
      if (file) {
        if (file.size > 5e6) showToast("File lưu vượt giới hạn 5 MB.");
        else importCharacter(await file.text());
      }
      input.value = "";
    });
  document
    .getElementById("guide-btn")!
    .addEventListener("click", () =>
      openUtility(
        "Hành tẩu giang hồ",
        `<div class="guide-list"><h3>Chiến đấu tự động</h3><p>Nhân vật tự tìm quái, xoay chiêu, dùng bình HP và nhặt đồ. Bấm Tự động để bật/tắt. Dùng WASD, joystick hoặc chạm mặt đất để tự điều khiển.</p><h3>Vượt ải & luyện công</h3><p>Mỗi ải có 4 đợt. Ải 10 có trùm. Vượt ải mở ải kế tiếp; Luyện công lặp lại ải hiện tại. Quái mạnh hơn theo cấp. Ngũ hành khắc chế tăng 25% hoặc giảm 20% sát thương.</p><h3>Nhân vật & trang bị</h3><p>Lên cấp nhận 5 điểm tiềm năng và 1 điểm võ học. Trang bị có 11 ô, 5 phẩm chất, nhiều dòng chỉ số và cường hóa đến +10. Thuốc hồi 40%, dùng chung hồi chiêu 8 giây. Đồ quá sức chứa giữ ở Đồ chờ nhận.</p><h3>Phiêu lưu & phụ bản</h3><p>Rừng Trúc giữ các NPC và nhiệm vụ cũ. Cổ Mộ mở cấp 3; Trúc Lâm mở cấp 5 sau khi hoàn thành Cổ Mộ.</p><h3>Lưu tiến trình</h3><p>Tự lưu mỗi 10 giây và khi giao dịch. Có 3 nhân vật riêng, file sao lưu và thưởng luyện công vắng mặt tối đa 4 giờ. Tiến trình local lưu trên trình duyệt này.</p></div>`,
      ),
    );
  document.getElementById("golden-boss-btn")!.addEventListener("click", openGoldenBoss);
  document.getElementById("slot-btn")!.addEventListener("click", openSlots);
  document.getElementById("adventure-btn")!.addEventListener("click", () => {
    if (!game || game.mapMode === "dungeon") return;
    if (game.goldenEncounter) leaveGoldenBoss();
    collectIdleLoot();
    game.player.idle.enabled = false;
    game.player.idle.inTown = false;
    game.enemies = makeEnemies();
    game.worldEnemies = game.enemies;
    game.player.x = PLAYER_START.x;
    game.player.y = PLAYER_START.y;
    game.autoBattle = false;
    showIdlePage("log");
    persistGame();
  });
  document.getElementById("idle-mode-btn")!.addEventListener("click", () => {
    if (!game || game.mapMode === "dungeon") return;
    if (game.goldenEncounter) leaveGoldenBoss();
    game.player.idle.enabled = true;
    game.player.idle.inTown = false;
    prepareIdleWave();
    game.autoBattle = true;
    showIdlePage("log");
    persistGame();
  });
  window.addEventListener("pagehide", () => persistGame());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) persistGame();
  });
}

function startGame(sect: SectId, factionId?: FactionId): void {
  try {
    const previous = localStorage.getItem(SAVE_KEY);
    if (previous) localStorage.setItem(`${SAVE_KEY}-backup`, previous);
  } catch {
    /* persistGame reports unavailable storage. */
  }
  renderedSkillSect = null;
  inventoryRenderKey = "";
  createGame(sect, factionId);
  hydrateSettings();
  persistGame();
  showIdlePage("log");
  sectOverlay.classList.add("hidden");
  canvasTip.textContent = "Click quái để áp sát · E để nhặt đồ quanh bạn";
  refreshUi(true);
}

function renderSectCards(): void {
  sectCards.innerHTML = FACTIONS.map(faction => {
    const school = SCHOOL_KITS[SECT_BY_FACTION[faction.id]];
    return `<button class="sect-card" data-sect="${school.id}" data-faction="${faction.id}" aria-pressed="${faction.id === selectedFaction}" style="--sect-color:${school.color}">${spriteMarkup(school.id, "sect-character-art")}<strong>${school.name}</strong><small>${school.element} · ${school.title.split(" · ")[0]}</small><span class="sect-emblem">${faction.emblem}</span></button>`;
  }).join("");
  renderSectDetail();
}
function renderSectDetail(): void {
  const school = SCHOOL_KITS[SECT_BY_FACTION[selectedFaction]], definition = school.kit[previewSkill];
  for (const button of sectCards.querySelectorAll<HTMLButtonElement>("[data-faction]")) button.setAttribute("aria-pressed", String(button.dataset.faction === selectedFaction));
  document.querySelector("#sect-detail")!.innerHTML = `<strong>${school.name} · ${school.title}</strong><div class="sect-preview-skills">${SKILL_KEYS.map(key => `<button data-preview-skill="${key}" aria-pressed="${previewSkill === key}">${skillIconMarkup(school.kit[key], key, school.color)}<span>${school.kit[key].name}<small>Cấp ${school.kit[key].unlock}</small></span></button>`).join("")}</div><div class="sect-preview-description"><canvas id="sect-preview" width="128" height="86" aria-label="Xem thử ${definition.name}"></canvas><p><b>${definition.name}</b><span>${definition.description}</span><small>${definition.mp} MP · Hồi ${definition.cooldown}s${previewSkill === "ultimate" ? " · 100 nộ" : ""}</small></p></div>`;
  previewCanvas = document.querySelector<HTMLCanvasElement>("#sect-preview");
  document.querySelector("#join-sect")!.textContent = `Gia nhập ${school.name}`;
}
function drawSectPreview(now: number): void {
  if (!previewCanvas || sectOverlay.classList.contains("hidden")) return;
  const pc = previewCanvas.getContext("2d")!, school = SCHOOL_KITS[SECT_BY_FACTION[selectedFaction]], definition = school.kit[previewSkill];
  pc.clearRect(0, 0, 128, 86);
  drawSectEffect(pc, { x: 66, y: 46, radius: 34, color: school.color, kind: definition.motif, skill: previewSkill }, (now % 1800) / 1800);
  drawSprite(pc, school.id, 56, 76, HERO_SIZE.width, HERO_SIZE.height);
}

function closeMobileSheet(): void {
  pendingSaleId = null;
  inventoryPanel.classList.remove("mobile-sheet-open");
  if (idlePage === "inventory") showIdlePage("log");
  mobileSheetBackdrop.classList.remove("show");
}

function openMobileSheet(tab: PanelTab): void {
  if (!game) return showToast("Hãy gia nhập môn phái trước.");
  pendingSaleId = null;
  resetJoystick();
  keys.clear();
  activeTab = tab;
  inventoryPanel.classList.add("mobile-sheet-open");
  showIdlePage(tab === "skills" ? "skill" : "inv");
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
  if ((event.target as HTMLElement).closest("input, textarea, select")) return;
  const key = event.key.toLowerCase();
  if (key === "escape") {
    closeMobileSheet();
    return;
  }
  if (!document.getElementById("utility-overlay")!.classList.contains("hidden"))
    return;
  if (
    [
      "w",
      "a",
      "s",
      "d",
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
    ].includes(key)
  ) {
    event.preventDefault();
    keys.add(key);
  }
  if (event.repeat || !game) return;
  if (key === "1") castSkill("skill1");
  if (key === "2") castSkill("skill2");
  if (key === "3") castSkill("ultimate");
  if (key === "4") playerBasicAttack();
  if (key === "e") pickupNearby();
  if (key === "q") drinkPotion("hp");
  if (key === "r") drinkPotion("mp");
  if (key === "b") {
    if (mobileGameMedia.matches) {
      if (inventoryPanel.classList.contains("mobile-sheet-open"))
        closeMobileSheet();
      else openMobileSheet("bag");
      return;
    }
    activeTab = "bag";
    document
      .querySelector(".inventory-panel")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    refreshUi(true);
  }
  if (key === "k") {
    if (mobileGameMedia.matches) {
      openMobileSheet("skills");
      return;
    }
    activeTab = "skills";
    document
      .querySelector(".inventory-panel")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    refreshUi(true);
  }
  if (key === "j") {
    document
      .querySelector(".log-panel")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    showToast("Nhật ký nhiệm vụ đang hiển thị bên dưới bản đồ.");
  }
});

document.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

canvas.addEventListener("click", (event) => selectAt(screenToWorld(event)));

sectCards.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
    "[data-sect]",
  );
  const sect = button?.dataset.sect as SectId | undefined;
  const faction = button?.dataset.faction as FactionId | undefined;
  if (faction && FACTIONS.some(item => item.id === faction)) { selectedFaction = faction; previewSkill = "skill1"; renderSectDetail(); }
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
  if (equipButton) {
    equipItem(Number(equipButton.dataset.index));
    persistGame();
  }
  if (enhanceButton) {
    enhanceItem(
      Number(enhanceButton.dataset.index),
      enhanceButton.dataset.equipped as ItemSlot | undefined,
    );
    persistGame();
  }
  if (skillButton) {
    upgradeSkill(skillButton.dataset.skillRank as SkillKey);
    persistGame();
  }
  const refund = target.closest<HTMLButtonElement>("[data-refund-skill]");
  if (refund && game) {
    const key = refund.dataset.refundSkill as SkillKey;
    if (game.player.skillRanks[key] > 1) {
      game.player.skillRanks[key]--;
      game.player.skillPoints++;
      persistGame();
      refreshUi(true);
    }
  }
  if (saleButton) sellItem(saleButton.dataset.itemId!);
  if (potionButton) drinkPotion(potionButton.dataset.usePotion as PotionKind);
  if (purchaseButton)
    purchasePotion(
      purchaseButton.dataset.buyPotion as PotionKind,
      Number(purchaseButton.dataset.quantity),
    );
  if (target.closest("[data-collect-pending]")) collectPendingItems();
  if (target.closest("[data-save-progress]")) saveGame();
  if (target.closest("[data-load-progress]")) loadGame();
  if (target.closest("[data-auto-equip]")) {
    const changed = autoEquipBest();
    addLog(changed ? `Đã thay ${changed} món có lực chiến cao hơn.` : "Đã mặc bộ trang bị mạnh nhất hiện có.");
    persistGame();
    refreshUi(true);
  }
  const inspected = target.closest<HTMLButtonElement>("[data-inspect-item]");
  if (inspected && game) {
    const item = game.player.inventory.find(
      (candidate) => candidate.id === inspected.dataset.inspectItem,
    );
    if (item) showItemDetail(item);
  }
  if (target.closest("[data-discard-filter]")) openDiscardFilter();
  if (target.closest("[data-open-shop]")) openMobileSheet("shop");
  if (target.closest("[data-open-bag]")) openMobileSheet("bag");
  if (target.closest("[data-cancel-sale]")) {
    pendingSaleId = null;
    refreshUi(true);
  }
  if (dungeonButton) {
    const action = dungeonButton.dataset.dungeonAction;
    if (action === "enter")
      enterDungeon(dungeonButton.dataset.dungeonId as DungeonId);
    if (action === "leave") leaveDungeon();
    if (action === "claim") claimDungeonReward();
  }
});

document
  .querySelectorAll<HTMLButtonElement>(".potion-shortcuts [data-use-potion]")
  .forEach((button) => {
    button.addEventListener("click", () =>
      drinkPotion(button.dataset.usePotion as PotionKind),
    );
  });

skillBar.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
    ".skill-button",
  );
  if (button?.hasAttribute("data-basic-attack")) {
    if (game && !currentTarget()) game.targetId = nearestEnemy(400)?.id ?? null;
    playerBasicAttack();
    return;
  }
  const skill = button?.dataset.skill as SkillKey | undefined;
  if (skill) castSkill(skill);
});

document
  .querySelectorAll<HTMLButtonElement>(".tab-button")
  .forEach((button) => {
    button.addEventListener("click", () => {
      activeTab = button.dataset.tab as PanelTab;
      pendingSaleId = null;
      showIdlePage(activeTab === "skills" ? "skill" : "inv");
      refreshUi(true);
    });
  });

document
  .querySelectorAll<HTMLButtonElement>("[data-mobile-tab]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      openMobileSheet(button.dataset.mobileTab as PanelTab);
    });
  });

document
  .querySelectorAll<HTMLButtonElement>("[data-mobile-guild]")
  .forEach((button) => button.addEventListener("click", openGuildRoadmap));
document
  .querySelectorAll<HTMLButtonElement>("[data-mobile-settings]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      showToast("Cài đặt âm thanh và tài khoản sẽ mở ở mốc vận hành."),
    ),
  );
mobileSheetClose.addEventListener("click", closeMobileSheet);
mobileSheetBackdrop.addEventListener("click", closeMobileSheet);
document
  .querySelector<HTMLButtonElement>("#quest-toggle")!
  .addEventListener("click", (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    const expanded = button
      .closest(".quest-panel")!
      .classList.toggle("expanded");
    button.setAttribute("aria-expanded", String(expanded));
    button.setAttribute(
      "aria-label",
      expanded ? "Thu gọn nhiệm vụ" : "Mở chi tiết nhiệm vụ",
    );
  });
mobileAuto.addEventListener("click", () => {
  if (!game) return showToast("Hãy gia nhập môn phái trước.");
  game.autoBattle = !game.autoBattle;
  if (game.autoBattle) {
    const target = currentTarget() ?? nearestEnemy(520);
    if (target) game.targetId = target.id;
    addLog(
      target
        ? "Đã bật Auto chiến đấu: tự áp sát và đánh mục tiêu gần."
        : "Đã bật Auto chiến đấu: chưa tìm thấy quái gần đây.",
    );
  } else {
    game.targetId = null;
    game.moveTarget = null;
    addLog("Đã tắt Auto chiến đấu.");
  }
  refreshUi(true);
});

document
  .querySelector<HTMLButtonElement>("#save-btn")!
  .addEventListener("click", saveGame);
document
  .querySelector<HTMLButtonElement>("#load-btn")!
  .addEventListener("click", loadGame);
document
  .querySelector<HTMLButtonElement>("#reset-btn")!
  .addEventListener("click", confirmNewCharacter);
document
  .querySelector<HTMLButtonElement>("#guild-btn")!
  .addEventListener("click", openGuildRoadmap);
onlineButton.addEventListener("click", () => {
  if (
    onlineClient.getStatus() === "online" ||
    onlineClient.getStatus() === "connecting"
  ) {
    onlineClient.disconnect();
    return;
  }
  if (!game) {
    showToast("Hãy gia nhập môn phái trước khi kết nối online.");
    return;
  }
  void onlineClient.connect(game.player.name);
});

bindIdleUi();
document.querySelector("#join-sect")!.addEventListener("click", () => { const faction = factionOf(selectedFaction); startGame(faction.archetype, faction.id); });
document.querySelector("#sect-detail")!.addEventListener("click", event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-preview-skill]");
  if (button) { previewSkill = button.dataset.previewSkill as SkillKey; renderSectDetail(); }
});
renderSectCards();
refreshUi(true);
try {
  if (localStorage.getItem(SAVE_KEY)) loadGame();
} catch {
  /* Character selection remains available. */
}

function frame(now: number): void {
  const dt = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  update(dt * (game?.player.idle.speed ?? 1), now);
  if (game && now - lastAutoSave > 10000) {
    persistGame();
    lastAutoSave = now;
  }
  if (now - lastDrawTime >= RENDER_INTERVAL_MS) {
    drawWorld(now);
    drawSectPreview(now);
    lastDrawTime = now - ((now - lastDrawTime) % RENDER_INTERVAL_MS);
  }
  refreshUi();
  window.requestAnimationFrame(frame);
}

window.requestAnimationFrame(frame);
