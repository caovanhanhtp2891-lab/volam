import { COMBAT_SCALE_VERSION, toCombat, toCore, displayedStat, migrateCombatScale, scaledOutgoingDamage, scaledIncomingDamage } from "./combat-scale";
import { applyElementalAilments, takeBurnTick } from "./skill-ailments";
import { gearTrait } from "./gear-catalog";
import { resourceMarkup, drawResource } from "./item-art";
import "./style.css";
import { SPECIES, MONSTERS, faunaOf, monsterForStage, type SpeciesId } from "./bestiary";
import { monsterMarkup, monsterSize, drawMonster } from "./monster-art";
import { EXPLORATION_WIDTH, EXPLORATION_HEIGHT, freshExploration, validExploration, normalizeExploration, explorationZones, explorationSpawns, canExplore, zoneAt, type ExplorationProgress } from "./exploration";
import { createExplorationArt } from "./exploration-art";
import { freshLuckyProgress, validLuckyProgress, normalizeLuckyProgress, playLuckyEvent, type LuckyGame, type LuckyProgress } from "./lucky-events";
import { luckyMarkup, updateLuckyPresentation } from "./lucky-ui";
import { freshLootSettings, normalizeLootSettings, validLootSettings, acceptsLoot, autoDiscardItems, type LootSettings } from "./loot-settings";
import { BOT_TEMPLATES, createBot, chooseBotTarget, moveBot, freshBotSettings, normalizeBotSettings, botEncounter, randomPatrolGoal, validBotSettings, type BotActor, type BotTemplate, type BotOrder, type BotSettings } from "./bots";
import { freshSiegeCapture, tickSiegeCapture, SIEGE_CAPTURE_SECONDS, type SiegeCapture, freshSiegeProgress, validSiegeProgress, normalizeSiegeProgress, beginSiege, settleSiege, siegeBlocked, siegeTravelGoal, SIEGE_PHASES, type SiegeProgress, type SiegeOutcome } from "./siege";
import { createSiegeArt, drawSiegeStructure } from "./siege-art";
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
  canEnterStage,
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
import { drawSprite, spriteMarkup, characterPortraitMarkup, type SpriteId } from "./art";
import { characterArtKey, defaultCharacterSex, type CharacterSex } from "./character-art";
import { createMapArt, createTrainingArt, createTerrainArt, trainingArtRevision, drawRegionWeather } from "./map-art";
import { REGION_SCENES, regionThumbnail } from "./region-scenes";
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
import {
  drawAnimatedHero,
  drawEquipmentIcon,
  type HeroAppearance,
} from "./combat-art";
import { drawCharacterPreview } from "./character-preview";
import { equipmentMarkup, equipmentTier, equipmentEffectLabel } from "./equipment-art";
import { drawEquipmentDropAura } from "./equipment-vfx";
import { GEAR_VARIANTS, GEAR_SETS, SET_IDS, EQUIPMENT_SLOTS, SET_THRESHOLDS, variantOf, setStatuses, setForElement, rollGearIdentity, validGearIdentity, variantsForSlot, type GearVariant, type GearIdentity, type SetId } from "./gear-catalog";
import { BASIC_HORSE_PRICE, mountSpeedBonus, ridingSpeed, normalizeMounted } from "./mount";
import type { MountAppearance } from "./mount-art";
import { drawMountedCharacter } from "./mounted-character-art";
import { actorCastOffset } from "./actor-rig";
import { skillUsesFlight, flightSpeed } from "./skill-flight";
import { drawEnemyStatus } from "./enemy-status-art";
import { drawGearAura } from "./gear-effects";
import { RARITIES, RARITY_NAMES, rollEquipmentRarity, RARITY_COLORS, STAT_LABELS, emptyStats, statUnit, secondaryScore, combatModifiers, stolenLife, gearStats, loadoutStats, gearScore, rollGearBonuses, equipBestGear, equipSetPieces, discardCandidates, validBonuses, equipmentGrade, enhancementInfo, attemptEnhancement, type Rarity, type GearStats, type GearStat, type DiscardFilter } from "./equipment";
import { goldenStatus, goldenWindows, normalizeGoldenClears, claimGoldenKill, countdown, type GoldenWindow } from "./golden-boss";
import {
  drawBattleEffect,
  drawGlow,
  VFX_COLORS,
} from "./battle-vfx";
import { APP_VERSION } from "./release";
import { REALMS, combatPower, strengthScore, powerFromScore, cultivationForPower } from "./cultivation";
import { drawCultivationAura } from "./cultivation-art";
import {
  BAG_CAPACITY,
  DUNGEONS,
  freshDungeonClears, normalizeDungeonClears, dungeonDropRarity,
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

import { SECTS as SCHOOL_KITS, SECT_BY_FACTION, SKILL_KEYS, HERO_SIZE, selectSkillTargets, skillReachLabel, type Sect as School, type SectId as SchoolId, type SkillDefinition, type EffectMotif } from "./sects";
import { drawSectEffect, drawSkillFlight, drawSkillReach, skillIconMarkup } from "./sect-effects";
import { SKILL_PALETTES } from "./skill-art";
import { ELITE_MIN_KILLS, CAMPFIRE_RADIUS, MAX_CAMPFIRES, normalizeEliteHunt, eliteChance, recordNormalKill, createCampfire, campfireXp, nearCampfire, tickCampfires, validCampfires, restoreCampfires, validWildElite, type EliteHunt, type Campfire, type SavedWildElite } from "./elite-hunt";
import { MAX_LEVEL, XP_MULTIPLIERS, xpToNext, normalizePreferences, normalizeJourney, applyExperience, REBIRTH_BONUS, rebirthBonuses, rebirthCharacter, TITLES, TITLE_RARITIES, titleProgress, unlockTitles, wornTitle, progressionBonuses, type GamePreferences, type Journey } from "./character-progression";
import { drawTitleEffect } from "./title-art";
import { drawMilitaryDragons } from "./military-vfx";
import { realmStyle, titleStyle, militaryStyle, prestigeWidth, fitPrestigeLabel, placePrestigeLabels, drawPrestigeLabel, type PrestigeLabel } from "./prestige-art";
import { TERRITORIES, MILITARY_RANKS, freshMilitary, normalizeMilitary, validMilitary, militaryMerit, militaryRankOf, territoryOf, canChallengeTerritory, captureTerritory, canClaimRank, claimMilitaryRank, wearMilitarySeal, militaryBonuses, type TerritoryId, type MilitaryRankId, type MilitaryProgress } from "./military";
import { militarySealMarkup } from "./military-art";
import { TOWER_FLOORS, TOWER_MIN_LEVEL, TOWER_SET, TOWER_EXCHANGE_COST, freshTower, validTower, normalizeTower, towerFloor, canEnterTower, towerReward, completeTowerFloor, spendTowerSigils, type TowerProgress } from "./tower";
import { allocateAttribute, allocateSkill, recommendAttributes, recommendSkills, applyAttributeRecommendation, applySkillRecommendation, type PointAmount } from "./point-allocation";

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

interface Item extends GearIdentity {
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
  mounted: boolean;
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
  eliteHunt: EliteHunt;
  preferences: GamePreferences;
  journey: Journey;
  military: MilitaryProgress;
  lucky: LuckyProgress;
  botSettings: BotSettings;
  lootSettings: LootSettings;
  sieges: SiegeProgress;
  exploration: ExplorationProgress;
  tower: TowerProgress;
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
  rogueUntil?: number;
  monsterId?: SpeciesId;
  ranged?: boolean;
  home?: { x: number; y: number };
  botProfile?: BotTemplate;
  structure?: "gate" | "banner";
  wildElite?: boolean;
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
  chilledUntil: number;
  frozenUntil: number;
  poisonUntil: number;
  poisonNextTick: number;
  poisonDamage: number;
  burnUntil: number;
  burnNextTick: number;
  burnDamage: number;
  burnSect: SchoolId;
  corrodedUntil: number;
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
  theme?: Element;
  flight?: { from: { x: number; y: number }; startedAt: number; arrow: boolean };
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
  sect?: School["id"];
  phase?: "cast" | "release" | "impact";
  angle?: number;
  theme?: Element;
  reach?: { x: number; y: number; definition: SkillDefinition };
}

interface SkillZone extends SkillEffect {
  nextTick: number; multiplier: number; slow: number; source: string;
}

interface Projectile {
  visualLeader?: boolean;
  visualFrom?: { x: number; y: number };
  sect: School["id"];
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
  sect?: SchoolId;
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

interface BotHit { sourceId: string; targetId: string; side: "ally" | "enemy"; profile: BotTemplate; skill?: SkillKey; from: { x: number; y: number }; startedAt: number; duration: number; projectile: boolean; damage: number; reach: number }
interface GameState {
  bots: BotActor[];
  botContext: string;
  botHits: BotHit[];
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
  mapMode: "world" | "dungeon" | "territory" | "tower";
  territoryEncounter?: { siege?: { id: number; size: number; order: BotOrder; capture: SiegeCapture }; id: TerritoryId; wave: number; timeLeft: number; enemies: Enemy[]; loot: GroundLoot[]; x: number; y: number; inTown: boolean; autoBattle: boolean };
  dungeonReturn?: { x: number; y: number; inTown: boolean; autoBattle: boolean };
  towerEncounter?: { floor: number; wave: number; timeLeft: number; enemies: Enemy[]; loot: GroundLoot[]; x: number; y: number; inTown: boolean; autoBattle: boolean };
  dungeonTimeLeft: number;
  dungeonCleared: boolean;
  dungeonRewardClaimed: boolean;
  dungeonId: DungeonId | null;
  dungeonWave: number;
  campfires: Campfire[];
  goldenEncounter?: { window: GoldenWindow; enemies: Enemy[]; loot: GroundLoot[]; x: number; y: number; inTown: boolean; autoBattle: boolean };
  onlinePlayers: OnlineSnapshot["players"];
  autoBattle: boolean;
}

let WORLD_WIDTH = 1900;
let WORLD_HEIGHT = 1200;
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
let lastLootMaintenance = 0;
let botSafeUntil = 0;
let characterRenderKey = "";
let setRenderKey = "";
let setShopId: SetId = "kim-phong";
let setShopSlot: ItemSlot = "weapon";
let selectedShopVariant: GearVariant | undefined;
let gallerySlot: ItemSlot = "weapon";
let galleryRarity: Rarity = "Hoàng Kim";
let galleryEnhance = 7;
let galleryElement: Element = "kim";
let gallerySet: SetId | "" = "";
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
const arenaLogText = document.querySelector<HTMLElement>("#arena-log-text")!;
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
const dungeonArtRevisions = new Map<DungeonId, number>();
let territoryArt: HTMLCanvasElement | undefined;

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
    title: "12 bí cảnh · Cấp 3–155",
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
const compactNumber = (value: number) => {
  const units: [number, string][] = [[1e12, "nghìn tỷ"], [1e9, "tỷ"], [1e6, "tr"], [1e3, "K"]];
  const unit = units.find(([min]) => value >= min);
  return unit ? `${(value / unit[0]).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} ${unit[1]}` : formatNumber(value);
};
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

function itemRarity(level: number): Rarity { return rollEquipmentRarity(level); }

function itemPower(level: number, rarity: Rarity, slot: ItemSlot): number {
  const rarityMultiplier: Record<Rarity, number> = {
    Thường: 1,
    Tốt: 1.18,
    Hiếm: 1.42,
    "Cực phẩm": 1.8,
    "Hoàng Kim": 2.5,
    "Truyền Thuyết": 3.2,
    "Thần Thoại": 4.2,
  };
  const base = slot === "weapon" ? 9 + level * 2.1 : 8 + level * 2.4;
  return Math.floor(base * rarityMultiplier[rarity] + randomBetween(-2, 3));
}

function createItem(
  level: number,
  forcedRarity?: Rarity,
  forcedSlot?: ItemSlot,
): Item {
  const rarity = forcedRarity ?? itemRarity(level);
  const slot =
    forcedSlot ??
    (Object.keys(GEAR_SLOTS) as ItemSlot[])[
      randomInt(0, Object.keys(GEAR_SLOTS).length - 1)
    ];
  const identity = rollGearIdentity(slot, rarity, game ? factionOf(game.player.factionId).element : undefined);
  const prefix: Record<Rarity, string> = {
    Thường: "Mộc",
    Tốt: "Thanh",
    Hiếm: "Tử Vân",
    "Cực phẩm": "Thiên Cơ",
    "Hoàng Kim": "Hoàng Kim",
    "Truyền Thuyết": "Huyền Thiên",
    "Thần Thoại": "Thần Huyết",
  };
  const icon = GEAR_SLOTS[slot].icon;
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: `${identity.setId ? GEAR_SETS[identity.setId].name : prefix[rarity]} ${GEAR_VARIANTS[identity.variant!].name}`,
    ...identity,
    slot,
    rarity,
    level,
    power: itemPower(level, rarity, slot),
    bonuses: rollGearBonuses(level, rarity, slot, Math.random, identity.variant),
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
    monsterId: legacySpecies(name, kind),
    x,
    y,
    radius: kind === "boss" ? 38 : kind === "elite" ? 25 : 19,
    level,
    hp: toCombat(Math.floor((65 + level * 22) * scale)),
    maxHp: toCombat(Math.floor((65 + level * 22) * scale)),
    attack: toCombat(Math.floor(
      (8 + level * 2.6) * (kind === "boss" ? 1.6 : kind === "elite" ? 1.2 : 1),
    )),
    defense: toCombat(Math.floor((3 + level * 1.4) * (kind === "boss" ? 1.3 : 1))),
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
    chilledUntil: 0,
    frozenUntil: 0,
    poisonUntil: 0,
    poisonNextTick: 0,
    poisonDamage: 0,
    burnUntil: 0, burnNextTick: 0, burnDamage: 0, burnSect: "cai-bang", corrodedUntil: 0,
  };
}

function makeEnemies(exploration?: ExplorationProgress): Enemy[] {
  if (exploration?.active) return makeExplorationEnemies(exploration.region);
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
  const dungeon = DUNGEONS[id];
  return dungeon.waves[wave].map((spawn) => {
    const enemy = createEnemy(
      spawn.id,
      spawn.name,
      spawn.kind,
      spawn.x,
      spawn.y,
      spawn.level,
      spawn.color,
    );
    if (spawn.species) {
      enemy.monsterId = spawn.species;
      enemy.element = MONSTERS[spawn.species].element;
      enemy.ranged = MONSTERS[spawn.species].behavior === "ranged";
    }
    if (dungeon.tier >= 2) {
      const scale = 1 + (dungeon.tier - 2) * 0.055;
      enemy.maxHp = enemy.hp = Math.floor(enemy.maxHp * scale);
      enemy.attack = Math.floor(enemy.attack * scale);
    }
    return enemy;
  });
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
    hp: toCombat(sect.baseHp),
    maxHp: toCombat(sect.baseHp),
    mp: toCombat(sect.baseMp),
    maxMp: toCombat(sect.baseMp),
    attack: sect.baseAttack,
    defense: sect.baseDefense,
    speed: sect.speed,
    mounted: false,
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
    dungeonClears: freshDungeonClears(),
    ...normalizeSupplies({}),
    pendingItems: [],
    goldenClears: [],
    eliteHunt: normalizeEliteHunt(undefined),
    preferences: normalizePreferences(),
    journey: normalizeJourney(),
    military: freshMilitary(),
    lucky: freshLuckyProgress(), botSettings: freshBotSettings(), lootSettings: freshLootSettings(), sieges: freshSiegeProgress(), exploration: freshExploration(),
    tower: freshTower(),
    facingX: 1,
    facingY: 0,
  };
  const state: GameState = {
    combat: freshCombat(),
    bots: [], botContext: "", botHits: [],
    campfires: [],
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

function itemArt(item: Item, extraClass = ""): string {
  return equipmentMarkup(item.slot, item.color, item.rarity, extraClass, item);
}
function gearIdentityMarkup(item: Item): string {
  const element = item.element ? ELEMENTS[item.element] : undefined, trait = gearTrait(item.variant);
  return `<div class="gear-identity"><span>${item.variant ? GEAR_VARIANTS[item.variant].name : GEAR_SLOTS[item.slot].name}</span>${trait ? `<span class="gear-trait-label">Thiên hướng ${trait.name}</span>` : ""}${element ? `<span class="gear-element-label" style="color:${element.color}">Hệ ${element.name}</span>` : ""}${item.setId ? `<span class="gear-set-label" style="color:${GEAR_SETS[item.setId].color}">Bộ ${GEAR_SETS[item.setId].name}</span>` : ""}</div>`;
}
function statsText(stats: Partial<GearStats>): string {
  return Object.entries(stats)
    .filter(([, value]) => value)
    .map(
      ([key, value]) =>
        `+${formatNumber(displayedStat(key as GearStat, value!))}${statUnit(key as GearStat)} ${STAT_LABELS[key as GearStat].toLocaleLowerCase("vi")}`,
    )
    .join(" · ");
}
function setStageRules(
  id: SetId,
  grade: number,
  element: Element,
  worn: number,
): string {
  let previous = emptyStats();
  return SET_THRESHOLDS.map((count) => {
    const pieces: Item[] = EQUIPMENT_SLOTS.slice(0, count).map((slot) => ({
      id: `preview-${slot}`,
      slot,
      rarity: "Tốt",
      level: grade * 10,
      power: 0,
      enhance: 0,
      name: "",
      color: "#73d19b",
      icon: "",
      setId: id,
      element: GEAR_SETS[id].element,
    }));
    const stats = setStatuses(pieces, element)[0].bonuses;
    const delta = Object.fromEntries(
      Object.entries(stats).map(([key, value]) => [
        key,
        value - previous[key as GearStat],
      ]),
    );
    previous = stats;
    return `<li class="${worn >= count ? "set-unlocked" : "set-locked"}" data-set-threshold="${count}"><b>${worn >= count ? "✦" : "◇"} ${count}/11 món${count === 11 ? ` · ${GEAR_SETS[id].hidden}` : ""}</b><span>${statsText(delta)}</span>${count === 11 ? `<small>${worn === 11 ? "Thuộc tính ẩn đã kích hoạt" : "Thuộc tính ẩn: cần mặc đủ bộ"}</small>` : ""}</li>`;
  }).join("");
}
function openGearSets(selected?: SetId): void {
  if (!game) return;
  const player = game.player,
    element = factionOf(player.factionId).element,
    statuses = setStatuses(Object.values(player.equipment), element);
  openUtility(
    `Trang bị bộ · ${SET_IDS.length} bộ`,
    `<p class="dim">Mỗi bộ có 11 vị trí, gồm hai nhẫn và ngựa. Mốc 2/4/6 món cộng chỉ số; đủ 11 mở thuộc tính ẩn và trận sáng riêng. Cùng hệ môn phái: thuộc tính bộ +20%. Bậc bộ bằng bậc món thấp nhất đang mặc; có thể phối nhiều bộ.</p>${SET_IDS.map(
      (id) => {
        const set = GEAR_SETS[id],
          worn = statuses.find((status) => status.id === id);
        const owned = [
          ...Object.values(player.equipment),
          ...player.inventory,
        ].filter((item) => item.setId === id);
        const slots = new Set(owned.map((item) => item.slot));
        return `<section class="gear-set-card ${id === selected ? "selected-set" : ""}" data-set-card="${id}" style="--set-color:${set.color}"><header><span class="set-emblem">${set.glyph}</span><div><b>${set.name} · ${set.sect ?? `Hệ ${ELEMENTS[set.element].name}`}</b><small>Mặc ${worn?.pieces ?? 0}/11 · Sở hữu ${slots.size}/11 vị trí · Bậc ${worn?.grade ?? 1}${set.universal || set.element === element ? " · Cộng hưởng +20%" : ""}</small></div></header><p class="set-specialty">${set.description}</p><ul class="set-rules">${setStageRules(id, worn?.grade ?? 1, element, worn?.pieces ?? 0)}</ul><div class="item-actions"><button class="mini-button" data-wear-set="${id}" ${player.inventory.some((item) => item.setId === id) ? "" : "disabled"}>Mặc các món trong túi</button><button class="mini-button" data-set-shop="${id}">${set.source === "tower" ? "Đổi ấn tháp" : "Mua mảnh bộ"}</button></div></section>`;
      },
    ).join("")}`,
  );
}
function refreshSetUi(): void {
  if (!game) return;
  const statuses = setStatuses(
    Object.values(game.player.equipment),
    factionOf(game.player.factionId).element,
  );
  const key = JSON.stringify(statuses);
  if (key === setRenderKey) return;
  setRenderKey = key;
  document.getElementById("set-resonance")!.innerHTML = statuses.length
    ? statuses
        .map((status) => {
          const set = GEAR_SETS[status.id];
          return `<button class="set-summary ${status.full ? "full-set" : ""}" data-open-set="${status.id}" style="--set-color:${set.color}"><span class="set-emblem">${set.glyph}</span><span><b>${set.name} · ${status.pieces}/11${status.aligned ? set.universal ? " · Cộng hưởng" : " · Đồng hệ" : ""}</b><small>${statsText(status.bonuses) || "Cần 2 món để cộng thuộc tính"}</small>${status.full ? `<strong data-set-full="${status.id}">✦ ${set.hidden} đã kích hoạt</strong>` : ""}</span></button>`;
        })
        .join("")
    : '<p class="dim">Chưa mặc trang bị bộ. Tìm đồ rơi có tên bộ hoặc mua mảnh bộ ở Tiệm.</p>';
}
function setShopVariant(id: SetId, slot: ItemSlot, useSelection = true): GearVariant {
  if (useSelection && selectedShopVariant && variantsForSlot(slot).includes(selectedShopVariant)) return selectedShopVariant;
  if (slot === "weapon") return GEAR_SETS[id].weapon;
  const costumes: Partial<Record<SetId, Partial<Record<ItemSlot, GearVariant>>>> = {
    "kim-cang": { armor: "robe", helmet: "helm", pendant: "bell" },
    "ba-vuong": { armor: "phoenixmail", helmet: "dragonhelm", boots: "greaves" },
    "bao-vu": { armor: "shadowrobe", helmet: "hood", boots: "shadowboots", necklace: "venomchain" },
    "ngu-doc": { armor: "cloak", helmet: "mask", necklace: "venomchain", pendant: "venomvial" },
    "lien-hoa": { armor: "brocade", helmet: "lotuscoronet", boots: "lotusboots", necklace: "lotuschain", bracelet: "lotusbeads" },
    "bang-phach": { armor: "brocade", helmet: "veiledhat", boots: "cloudboots", ring: "frostring", ring2: "frostring" },
    "hang-long": { armor: "dragonrobe", helmet: "dragonhelm", belt: "dragonbelt", pendant: "dragonseal" },
    "ma-diem": { armor: "phoenixmail", helmet: "phoenixcrown", belt: "emberbelt", ring: "phoenixring", ring2: "phoenixring" },
    "thai-cuc": { armor: "robe", helmet: "crown", belt: "starbelt", pendant: "taijicharm" },
    "tran-thien": { armor: "dragonrobe", helmet: "thundercrest", boots: "cloudboots", belt: "starbelt", necklace: "moonchain", ring: "twinring", ring2: "signetring", bracelet: "thunderbracer", pendant: "seal", horse: "white" },
    "tu-loi": { armor: "dragonrobe", helmet: "thundercrest", belt: "starbelt", bracelet: "thunderbracer" },
  };
  const costume = costumes[id]?.[slot];
  if (costume) return costume;
  if (slot === "horse")
    return (
      {
        "kim-phong": "warhorse",
        "thanh-truc": "bay",
        "han-nguyet": "white",
        "xich-diem": "ember",
        "huyen-nham": "warhorse",
      } as const
    )[setForElement(GEAR_SETS[id].element) as "kim-phong" | "thanh-truc" | "han-nguyet" | "xich-diem" | "huyen-nham"];
  return variantOf({ slot });
}
function openEquipmentGallery(): void {
  if (!game) return;
  const variants = variantsForSlot(gallerySlot);
  openUtility(`Bảo khố · ${Object.keys(GEAR_VARIANTS).length} mẫu trang bị`, `<p class="dim">Bảy phẩm chất: Trắng → Lục → Lam → Tím → Vàng → Cam → Đỏ. Đỏ (Thần Thoại) quý nhất; phẩm chất cao có linh khí, vòng sáng và phù văn đẹp hơn. +7/+10 tăng cường hiệu ứng. Đây là mẫu minh họa; chọn mua sẽ tới Tiệm với phẩm chất Tốt, chưa cường hóa.</p><div class="gear-gallery-filters"><label>Vị trí<select id="gear-gallery-slot">${EQUIPMENT_SLOTS.filter(slot => slot !== "ring2").map(slot => `<option value="${slot}" ${slot === gallerySlot ? "selected" : ""}>${GEAR_SLOTS[slot].name}</option>`).join("")}</select></label><label>Phẩm chất<select id="gear-gallery-rarity">${RARITIES.map(rarity => `<option value="${rarity}" ${rarity === galleryRarity ? "selected" : ""}>${rarity} · ${RARITY_NAMES[RARITIES.indexOf(rarity)]}</option>`).join("")}</select></label><label>Cường hóa<select id="gear-gallery-enhance">${[0,3,7,10].map(enhance => `<option value="${enhance}" ${enhance === galleryEnhance ? "selected" : ""}>+${enhance}</option>`).join("")}</select></label><label>Ngũ hành<select id="gear-gallery-element">${Object.entries(ELEMENTS).map(([element, data]) => `<option value="${element}" ${element === galleryElement ? "selected" : ""}>${data.name}</option>`).join("")}</select></label><label>Bộ trang bị<select id="gear-gallery-set"><option value="">Không chọn bộ</option>${SET_IDS.map(id => `<option value="${id}" ${id === gallerySet ? "selected" : ""}>${GEAR_SETS[id].name}</option>`).join("")}</select></label></div><p class="gear-effect-label">${equipmentEffectLabel(galleryRarity, galleryEnhance)} · Bậc ${Math.ceil(game.player.level / 10)}</p><div class="gear-gallery">${variants.map(variant => {
    const sample: Item = { id: "art-sample", slot: gallerySlot, name: GEAR_VARIANTS[variant].name, variant, rarity: galleryRarity, element: galleryElement, ...(gallerySet ? { setId: gallerySet } : {}), level: game!.player.level, enhance: galleryEnhance, power: 0, color: itemColor(galleryRarity), icon: "◆" };
    return `<article class="gear-sample" style="--rarity-color:${sample.color}">${itemArt(sample)}<b>${sample.name}</b>${gearTrait(variant) ? `<small class="gear-trait-label">${gearTrait(variant)!.name}</small>` : ""}<button class="mini-button" data-buy-gear-kind="${variant}">Chọn mua</button></article>`;
  }).join("")}</div>`);
}
function openSetShop(id?: SetId): void {
  if (!game) return;
  if (id && SET_IDS.includes(id) && id !== setShopId) { setShopId = id; selectedShopVariant = undefined; }
  if (GEAR_SETS[setShopId].source === "tower") { towerExchangeSlot = setShopSlot; setShopId = setForElement(factionOf(game.player.factionId).element); selectedShopVariant = undefined; return openTowerShop(); }
  const set = GEAR_SETS[setShopId],
    player = game.player,
    price = 120 + player.level * 8;
  const preview: Item = {
    id: "shop-preview",
    name: `${set.name} ${GEAR_VARIANTS[setShopVariant(setShopId, setShopSlot)].name}`,
    slot: setShopSlot,
    variant: setShopVariant(setShopId, setShopSlot),
    setId: setShopId,
    element: set.element,
    rarity: "Tốt",
    level: player.level,
    power: 0,
    enhance: 0,
    color: itemColor("Tốt"),
    icon: "◆",
  };
  const blocked =
    game.mapMode !== "world" ||
    player.inventory.length >= BAG_CAPACITY ||
    player.gold < price;
  openUtility(
    "Thương nhân · Mảnh bộ",
    `<label class="form-row">Bộ <select id="set-shop-id">${SET_IDS.filter(id => GEAR_SETS[id].source !== "tower").map((id) => `<option value="${id}" ${id === setShopId ? "selected" : ""}>${GEAR_SETS[id].name} · ${GEAR_SETS[id].sect ?? ELEMENTS[GEAR_SETS[id].element].name}</option>`).join("")}</select></label><label class="form-row">Vị trí <select id="set-shop-slot">${EQUIPMENT_SLOTS.map((slot) => `<option value="${slot}" ${slot === setShopSlot ? "selected" : ""}>${GEAR_SLOTS[slot].name}</option>`).join("")}</select></label><label class="form-row">Kiểu món <select id="set-shop-variant">${variantsForSlot(setShopSlot).map(variant => `<option value="${variant}" ${variant === preview.variant ? "selected" : ""}>${GEAR_VARIANTS[variant].name}</option>`).join("")}</select></label><div class="item-detail">${itemArt(preview, "detail-gear-art")}<b>${preview.name}</b>${gearIdentityMarkup(preview)}<p>Tốt · Cấp ${player.level} · ${equipmentGrade(player.level)} · Ba dòng phụ ngẫu nhiên. Linh binh có thiên hướng chỉ số riêng; các dòng còn lại theo cấp và phẩm chất.</p></div><p class="dim">Mua vào túi, tự chọn mặc. Ghép được với đồ rơi cùng bộ. Đang có ${formatNumber(player.gold)} bạc · ${player.inventory.length}/${BAG_CAPACITY} ô.</p><button class="outline-button" id="buy-set-piece" ${blocked ? "disabled" : ""}>${game.mapMode !== "world" ? "Rời phụ bản để mua" : player.inventory.length >= BAG_CAPACITY ? "Túi đã đầy" : `Mua mảnh bộ · ${price} bạc`}</button>`,
  );
}
function buySetPiece(): void {
  if (GEAR_SETS[setShopId].source === "tower") return;
  if (!game || game.mapMode !== "world") return;
  const price = 120 + game.player.level * 8;
  if (game.player.gold < price || game.player.inventory.length >= BAG_CAPACITY)
    return;
  const item = createItem(game.player.level, "Tốt", setShopSlot),
    set = GEAR_SETS[setShopId];
  Object.assign(item, {
    setId: setShopId,
    element: set.element,
    variant: setShopVariant(setShopId, setShopSlot),
    name: `${set.name} ${GEAR_VARIANTS[setShopVariant(setShopId, setShopSlot)].name}`,
  });
  item.bonuses = rollGearBonuses(item.level, item.rarity, item.slot, Math.random, item.variant);
  game.player.gold -= price;
  game.player.inventory.push(item);
  persistGame();
  refreshUi(true);
  showToast(`Đã mua ${item.name}. Mặc trong Túi đồ hoặc Bộ ngũ hành.`);
  openSetShop();
}
function buyBasicHorse(): void {
  if (
    !game ||
    game.mapMode !== "world" ||
    game.player.gold < BASIC_HORSE_PRICE ||
    game.player.inventory.length >= BAG_CAPACITY
  )
    return;
  const horse = createItem(1, "Tốt", "horse");
  delete horse.setId;
  Object.assign(horse, { name: "Tuấn Mã Hành Cước", variant: "bay" });
  game.player.gold -= BASIC_HORSE_PRICE;
  game.player.inventory.push(horse);
  persistGame();
  refreshUi(true);
  showToast("Đã mua Tuấn Mã. Mặc vào ô Ngựa, rồi bấm Lên ngựa hoặc H.");
}
function currentMountAppearance(): MountAppearance | undefined {
  const horse = game?.player.equipment.horse;
  return horse
    ? {
        variant: variantOf(horse),
        color: horse.color,
        tier: equipmentTier(horse.rarity),
        rarity: horse.rarity,
        enhancement: horse.enhance,
        simpleEffects: game?.player.preferences.skillEffects === "simple",
      }
    : undefined;
}
function toggleMount(): void {
  if (!game) return;
  if (!game.player.equipment.horse) {
    openMobileSheet("shop");
    return showToast("Mua hoặc tìm ngựa, rồi mặc vào ô Ngựa để cưỡi.");
  }
  if (game.combat.dash)
    return showToast("Chờ kết thúc chiêu lướt để lên xuống ngựa.");
  game.player.mounted = !game.player.mounted;
  syncStats();
  persistGame();
  refreshUi(true);
  showToast(
    game.player.mounted
      ? `Đã lên ${game.player.equipment.horse.name} · Tốc độ +${mountSpeedBonus(game.player.equipment.horse)}%.`
      : "Đã xuống ngựa.",
  );
}
function refreshMountUi(): void {
  if (!game) return;
  const horse = game.player.equipment.horse,
    mounted = game.player.mounted;
  const label = horse ? (mounted ? "Xuống ngựa" : "Lên ngựa") : "Đến Tiệm";
  document
    .querySelectorAll<HTMLElement>("[data-mount-toggle]")
    .forEach((button) => {
      button.setAttribute("aria-pressed", String(mounted));
      button.setAttribute(
        "aria-label",
        horse ? `${label} (H)` : "Mua ngựa ở Tiệm",
      );
      if (button.id === "mount-toggle") {
        button.querySelector("small")!.textContent = horse
          ? mounted
            ? "Xuống"
            : "Lên ngựa"
          : "Ngựa";
      } else button.textContent = label;
    });
  document.getElementById("mount-name")!.textContent =
    horse?.name ?? "Chưa có ngựa";
  document.getElementById("mount-info")!.textContent = horse
    ? `${mounted ? "Đang cưỡi" : "Đi bộ"} · Khi cưỡi +${mountSpeedBonus(horse)}% tốc độ · Phím H`
    : "Mặc ngựa từ túi đồ hoặc mua tại Tiệm.";
  document.getElementById("character-preview")!.dataset.mounted =
    String(mounted);
  document.getElementById("game-canvas")!.dataset.mounted = String(mounted);
}

function equipmentBonuses(): GearStats {
  return loadoutStats(
    game ? Object.values(game.player.equipment) : [],
    game ? factionOf(game.player.factionId).element : undefined,
  );
}
function equipmentAttack(): number { return equipmentBonuses().attack; }
function equipmentDefense(): number { return equipmentBonuses().defense; }
function characterBonuses(): GearStats {
  if (!game) return emptyStats();
  const stats = progressionBonuses(game.player.journey), seal = militaryBonuses(game.player.military);
  for (const key of Object.keys(stats) as GearStat[]) stats[key] += seal[key];
  return stats;
}
function combinedStats(gear = equipmentBonuses(), bonus = characterBonuses()): GearStats {
  return Object.fromEntries((Object.keys(STAT_LABELS) as GearStat[]).map(key => [key, gear[key] + bonus[key]])) as GearStats;
}
function criticalChance(): number { return Math.min(40, 12 + equipmentBonuses().crit + characterBonuses().crit); }
function openCombatStats(): void {
  if (!game) return;
  const mods = combatModifiers(combinedStats());
  const descriptions: Record<keyof typeof mods, string> = {
    critDamage: "Cộng vào sát thương chí mạng cơ bản 150%. Tối đa +150%.",
    attackSpeed: "Rút ngắn nhịp đánh thường. Tối đa 80%.",
    lifeSteal: "Hồi sinh lực theo lượng HP thực sự lấy từ quái, kể cả kỹ năng. Tối đa 20%.",
    armorPen: "Bỏ qua một phần phòng thủ của quái. Tối đa 60%.",
    damageReduction: "Giảm sát thương sau phòng thủ, trước hộ thể. Tối đa 50%.",
    dodge: "Có cơ hội tránh toàn bộ một đòn đánh. Tối đa 35%.",
    hpRegen: "Tự hồi sinh lực mỗi giây, tối đa 100.000/giây.",
    mpRegen: "Cộng thêm vào hồi nội lực cơ bản 70/giây. Tối đa 30.000/giây.",
  };
  openUtility("Chỉ số chiến đấu nâng cao", `<p class="dim">Giá trị đang có hiệu lực từ trang bị, thuộc tính bộ, danh hiệu và ấn quân hàm.</p><div class="combat-stat-details">${(Object.keys(mods) as (keyof typeof mods)[]).map(key => `<article data-combat-stat="${key}"><div><b>${STAT_LABELS[key]}</b><strong>${key === "critDamage" ? "+" : ""}${formatNumber(displayedStat(key, mods[key]))}${statUnit(key)}</strong></div><small>${descriptions[key]}</small></article>`).join("")}</div>`);
}

function effectiveAttack(): number {
  return game
    ? toCombat(game.player.attack +
        equipmentAttack() + characterBonuses().attack +
        game.player.idle.attributes.strength * 2)
    : 0;
}

function effectiveDefense(): number {
  return game
    ? toCombat(game.player.defense +
        equipmentDefense() + characterBonuses().defense +
        game.player.idle.attributes.dexterity)
    : 0;
}

function currentStrengthScore(): number {
  const gear = equipmentBonuses(), bonus = characterBonuses();
  return strengthScore(toCore(effectiveAttack()), toCore(effectiveDefense()), toCore(game?.player.maxHp ?? 0),
    secondaryScore(combinedStats(gear, bonus)));
}
function currentCombatPower(): number { return powerFromScore(currentStrengthScore()); }
function projectedGearPower(item: Item, current?: Item): number {
  if (!game) return 0;
  const gear = equipmentBonuses(), bonus = characterBonuses();
  const after = loadoutStats([...Object.values(game.player.equipment).filter(gear => gear.slot !== item.slot), item], factionOf(game.player.factionId).element);
  const defenseDelta = after.defense - gear.defense;
  const hpDelta = after.hp - gear.hp + Math.floor(after.defense * 1.45) - Math.floor(gear.defense * 1.45);
  return combatPower(toCore(effectiveAttack()) + after.attack - gear.attack, toCore(effectiveDefense()) + defenseDelta,
    toCore(game.player.maxHp) + hpDelta,
    secondaryScore(combinedStats(after, bonus)));
}

function skillScale(skill: SkillKey, base: number): number {
  if (!game) return base;
  const rank = game.player.skillRanks[skill] ?? 0;
  return base + Math.max(0, rank - 1) * 0.14;
}

function addSkillEffect({ delay = 0, ...effect }: Omit<SkillEffect, "startedAt"> & { delay?: number }): void {
  if (!game) return;
  game.effects.push({
    theme: factionOf(game.player.factionId).element,
    sect: effect.skill ? playerSect(game.player).id : undefined,
    ...effect,
    startedAt: nowMs() + delay,
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
  if (!game.player.preferences.damageNumbers && /^-\d/.test(text)) return;
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

function upgradeSkill(skill: SkillKey, amount: PointAmount = 1): void {
  if (!game) return;
  const player = game.player;
  const count = allocateSkill(player, skill, amount);
  if (!count) return showToast("Nhập số nguyên dương trong số điểm còn lại; chiêu cần đủ cấp và chưa đạt bậc 20.");
  addLog(`Đã cộng ${count} điểm ${playerSect(player).kit[skill].name} → bậc ${player.skillRanks[skill]}.`);
  persistGame();
  refreshUi(true);
}
const pointInputs = new Map<string, string>();
function pointControls(kind: "attribute" | "skill", key: string, available: number, enabled: boolean): string {
  const id = `${kind}-count-${key}`;
  return `<div class="point-controls"><input id="${id}" data-point-input="${id}" type="number" inputmode="numeric" step="1" min="1" max="${Math.max(1, available)}" value="${escapeHtml(pointInputs.get(id) ?? "1")}" aria-label="Số điểm ${kind === "attribute" ? "tiềm năng" : "võ học"}" ${enabled ? "" : "disabled"}><button class="mini-button" data-bulk-${kind}="${key}" ${enabled ? "" : "disabled"}>Cộng</button><button class="mini-button" data-max-${kind}="${key}" ${enabled ? "" : "disabled"}>Max</button></div>`;
}
function addAttributePoints(key: Attribute, amount: PointAmount): void {
  if (!game) return;
  const count = allocateAttribute(game.player.idle, key, amount);
  if (!count) return showToast("Nhập số nguyên dương không vượt số điểm tiềm năng còn lại.");
  syncStats(); persistGame(); refreshUi(true); addLog(`Đã cộng ${count} điểm ${ATTRIBUTES[key].name}.`);
}
let recommendationSnapshot = "";
function pointSnapshot(kind: "attributes" | "skills"): string {
  if (!game) return "";
  const p = game.player;
  return JSON.stringify([kind, p.factionId, p.level, kind === "attributes" ? p.idle.attributePoints : p.skillPoints, kind === "attributes" ? p.idle.attributes : p.skillRanks]);
}
function openPointRecommendation(kind: "attributes" | "skills", message = ""): void {
  if (!game) return;
  const p = game.player, attributes = kind === "attributes";
  recommendationSnapshot = pointSnapshot(kind);
  const plan = attributes ? recommendAttributes(p.idle, p.factionId) : recommendSkills(p);
  const total = Object.values(plan).reduce((sum, count) => sum + count, 0);
  const keys = attributes ? Object.keys(ATTRIBUTES) : SKILL_KEYS;
  openUtility(`Đề xuất ${attributes ? "tiềm năng" : "võ học"} · ${playerSect(p).name}`, `${message ? `<p role="status">${message}</p>` : ""}<p class="dim">Phân bổ theo đặc trưng môn phái, cân đối với điểm đã cộng. Giữ điểm đang có; chỉ cộng điểm còn dư. ${attributes ? "Sức mạnh tăng công; Thân pháp tăng phòng/tốc; Sinh khí tăng HP; Nội công tăng MP." : "Chỉ nâng chiêu đã mở, tối đa bậc 20; điểm chưa dùng được giữ lại."}</p><table class="enhancement-table point-plan"><thead><tr><th>${attributes ? "Thuộc tính" : "Kỹ năng"}</th><th>Hiện tại</th><th>Đề xuất cộng</th><th>Sau cộng</th></tr></thead><tbody>${keys.map(key => {
    const before = attributes ? p.idle.attributes[key as Attribute] : p.skillRanks[key as SkillKey], count = (plan as Record<string, number>)[key];
    return `<tr data-point-plan="${key}"><td>${attributes ? ATTRIBUTES[key as Attribute].name : playerSect(p).kit[key as SkillKey].name}</td><td>${before}</td><td>+${count}</td><td>${before + count}</td></tr>`;
  }).join("")}</tbody></table><p>Tổng cộng ${total} điểm · Còn lại ${(attributes ? p.idle.attributePoints : p.skillPoints) - total} điểm.</p><button class="outline-button" data-apply-point-plan="${kind}" ${total ? "" : "disabled"}>Áp dụng đề xuất · ${total} điểm</button><button class="mini-button" data-cancel-point-plan>Hủy</button>`);
}
function applyPointPlan(kind: "attributes" | "skills"): void {
  if (!game) return;
  if (recommendationSnapshot !== pointSnapshot(kind)) return openPointRecommendation(kind, "Điểm đã thay đổi. Đề xuất được cập nhật bên dưới.");
  const total = kind === "attributes" ? applyAttributeRecommendation(game.player.idle, game.player.factionId) : applySkillRecommendation(game.player);
  recommendationSnapshot = ""; syncStats(); persistGame(); refreshUi(true); closeUtility();
  showToast(`Đã phân bổ ${total} điểm theo môn phái.`);
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
    const awarded = rewardExperience(100);
    addLog(`Nhiệm vụ Dấu chân trong Rừng Trúc hoàn tất: +${formatNumber(awarded)} XP · +300 bạc.`);
  }
}

function openMilitarySeals(): void {
  if (!game) return;
  const progress = game.player.military, equipped = militaryRankOf(progress.equipped), merit = militaryMerit(progress);
  const blocked = game.mapMode !== "world" || Boolean(game.goldenEncounter);
  openUtility("Ấn quân hàm · Sắc phong", `<div class="military-summary">${militarySealMarkup(progress.equipped)}<div><b>${equipped ? `Đang mang: ${equipped.name}` : "Ô ấn đang trống"}</b><span>${progress.captured.length}/9 lãnh thổ · ${formatNumber(merit)} chiến công</span><small>Chỉ một ấn đang mang cộng chỉ số. Ấn đã nhận được giữ sau trùng sinh.</small></div></div><div class="btnrow"><button class="mini-button" data-open-territories>Tranh đoạt lãnh thổ</button><button class="mini-button" data-remove-seal ${!equipped || blocked ? "disabled" : ""}>Tháo ấn</button></div><div class="military-ranks">${MILITARY_RANKS.map(rank => {
    const owned = progress.seals.includes(rank.id), eligible = canClaimRank(progress, rank.id), worn = progress.equipped === rank.id;
    return `<article class="military-rank ${worn ? "worn" : ""}" data-military-rank="${rank.id}" style="--rank-color:${rank.color}">${militarySealMarkup(rank.id)}<div><b>${rank.name}</b><small>${rank.lands} lãnh thổ · ${formatNumber(rank.merit)} chiến công</small><p>${statsText(rank.bonuses)}</p><button class="mini-button" ${owned ? `data-wear-seal="${rank.id}"` : `data-claim-seal="${rank.id}"`} ${blocked || worn || !eligible ? "disabled" : ""}>${worn ? "Đang mang" : owned ? "Mang ấn" : eligible ? "Nhận sắc phong" : "Chưa đủ chiến công"}</button></div></article>`;
  }).join("")}</div>${blocked ? '<p class="dim">Rời trận hiện tại trước khi nhận hoặc đổi ấn.</p>' : ""}`);
}
function changeMilitarySeal(id: MilitaryRankId | null): void {
  if (!game || game.mapMode !== "world" || game.goldenEncounter || !wearMilitarySeal(game.player.military, id)) return;
  syncStats(); persistGame(); refreshUi(true); openMilitarySeals();
  showToast(id ? `Đã mang ấn ${militaryRankOf(id)!.name}.` : "Đã tháo ấn quân hàm.");
}
function openTerritories(selected?: TerritoryId): void {
  if (!game) return;
  const progress = game.player.military, current = game.territoryEncounter;
  const land = territoryOf(current?.id ?? selected ?? TERRITORIES.find(land => !progress.captured.includes(land.id))?.id ?? "hoang-thanh")!;
  const captured = progress.captured.includes(land.id), index = TERRITORIES.indexOf(land);
  const ready = canChallengeTerritory(progress, land.id, game.player.level);
  const blocked = game.mapMode !== "world" || Boolean(game.goldenEncounter);
  const reason = captured ? "Đã thuộc lãnh thổ của bạn" : index > 0 && !progress.captured.includes(TERRITORIES[index - 1].id) ? `Cần chiếm ${TERRITORIES[index - 1].name}` : game.player.level < land.level ? `Cần cấp ${land.level}` : "Công thành";
  openUtility("Tranh đoạt lãnh thổ", `<button class="outline-button" data-open-siege>Đại chiến theo yêu cầu · Có đội BOT</button><p class="dim">Chiến dịch công thành solo · Đánh bại 3 đợt quân trấn giữ trong 4 phút để chiếm thành. Chiến công mỗi thành nhận một lần, dùng để nhận ấn chức vị.</p><div class="territory-total"><b>${progress.captured.length}/9 thành đã chiếm</b><span>${formatNumber(militaryMerit(progress))} chiến công</span></div><div class="territory-map" aria-label="Bản đồ chín lãnh thổ"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M${TERRITORIES.map(land => `${land.x} ${land.y}`).join("L")}" fill="none" stroke="#ceb470" stroke-width=".7" stroke-dasharray="2 2"/></svg>${TERRITORIES.map(node => `<button class="territory-node ${progress.captured.includes(node.id) ? "captured" : ""} ${node.id === land.id ? "selected" : ""}" data-select-territory="${node.id}" style="left:${node.x}%;top:${node.y}%;--land-color:${node.color}" aria-pressed="${node.id === land.id}"><span>${progress.captured.includes(node.id) ? "⚑" : node.id === "hoang-thanh" ? "♛" : "♜"}</span><b>${node.name}</b></button>`).join("")}</div><section class="territory-detail" data-territory-detail="${land.id}"><h3>${land.name} <small>Cấp ${land.level}</small></h3><p>${land.description}</p><div class="territory-rewards"><span>⚑ ${land.merit} chiến công</span><span>◆ ${land.merit * 3} bạc</span><span>✦ ${Math.max(1, Math.floor(land.level / 25))} đá</span></div>${current ? `<p class="territory-battle-status">Đang công ${territoryOf(current.id)!.name} · Đợt ${current.wave + 1}/3 · ${Math.ceil(current.timeLeft)} giây còn lại</p><button class="outline-button" data-leave-territory>Rút quân · Giữ chiến công đã có</button>` : `<button class="outline-button" data-challenge-territory="${land.id}" ${!ready || blocked ? "disabled" : ""}>${blocked ? "Rời trận hiện tại để công thành" : reason}</button>`}</section><button class="mini-button territory-ranks-button" data-open-military>Ấn quân hàm · Thái Thú, Thừa Tướng, Hoàng Đế</button>`);
}
function makeTerritoryEnemies(id: TerritoryId, wave: number): Enemy[] {
  const land = territoryOf(id)!;
  const positions = wave === 2 ? [[950, 420]] : [[840, 540], [1060, 570], [950, 420]];
  return positions.map(([x, y], index) => {
    const kind = wave === 2 ? "boss" : wave === 1 && index === 0 ? "elite" : "normal";
    const enemy = createEnemy(`territory-${id}-${wave}-${index}`, `${land.name} · ${kind === "boss" ? "Thống lĩnh" : kind === "elite" ? "Phó tướng" : wave === 0 ? "Tiền quân" : "Cấm vệ"}`, kind, x, y, Math.min(160, land.level + wave), land.color);
    enemy.element = (["kim", "moc", "thuy", "hoa", "tho"] as const)[TERRITORIES.indexOf(land) % 5];
    return enemy;
  });
}
const explorationArts = new Map<string, HTMLCanvasElement>();
function exploring(): boolean {
  return Boolean(
    game?.player.exploration.active &&
      game.mapMode === "world" &&
      !game.goldenEncounter,
  );
}
function syncWorldSize(): void {
  const width = exploring() ? EXPLORATION_WIDTH : 1900;
  const height = exploring() ? EXPLORATION_HEIGHT : 1200;
  const changed = WORLD_WIDTH !== width || WORLD_HEIGHT !== height;
  WORLD_WIDTH = width; WORLD_HEIGHT = height;
  if (canvas.dataset.worldWidth !== String(width)) canvas.dataset.worldWidth = String(width);
  if (canvas.dataset.worldHeight !== String(height)) canvas.dataset.worldHeight = String(height);
  if (changed) centerWorldCamera();
}
function centerWorldCamera(): void {
  if (!game) return;
  game.cameraX = clamp(game.player.x - VIEW_WIDTH / 2, 0, Math.max(0, WORLD_WIDTH - VIEW_WIDTH));
  game.cameraY = clamp(game.player.y - VIEW_HEIGHT / 2, 0, Math.max(0, WORLD_HEIGHT - VIEW_HEIGHT));
}
function explorationArt(region: number): HTMLCanvasElement {
  const key = `${region}:${trainingArtRevision}`;
  if (!explorationArts.has(key))
    explorationArts.set(key, createExplorationArt(region));
  const result = explorationArts.get(key)!;
  explorationArts.delete(key);
  explorationArts.set(key, result);
  if (explorationArts.size > 1)
    explorationArts.delete(explorationArts.keys().next().value!);
  return result;
}
function legacySpecies(name: string, kind: Enemy["kind"]): SpeciesId {
  if (/Lang/.test(name)) return kind === "boss" ? "alpha" : "wolf";
  if (/Trùng/.test(name)) return "beetle";
  if (/Mộ|U Binh/.test(name))
    return kind === "boss"
      ? "tombgeneral"
      : /Tướng/.test(name)
        ? "tombguard"
        : "skeleton";
  if (/cung|Cung/.test(name)) return "archer";
  if (/Ma Vương/.test(name)) return "demonlord";
  return kind === "boss"
    ? "demonlord"
    : kind === "elite"
      ? "mercenary"
      : "bandit";
}
function makeExplorationEnemies(region: number): Enemy[] {
  return explorationSpawns(region).map((spawn) => {
    const def = MONSTERS[spawn.species],
      enemy = createEnemy(
        spawn.id,
        spawn.name,
        spawn.kind,
        spawn.x,
        spawn.y,
        spawn.level,
        ELEMENTS[def.element].color,
      );
    enemy.monsterId = spawn.species;
    enemy.element = def.element;
    enemy.ranged = def.behavior === "ranged";
    enemy.home = { x: spawn.x, y: spawn.y };
    return enemy;
  });
}
function openExplorationAtlas(
  region = game?.player.exploration.active
    ? game.player.exploration.region
    : game
      ? stageInfo(game.player.idle.stage).region
      : 0,
): void {
  if (!game || !Number.isInteger(region) || region < 0 || region >= 16) return;
  const blocked = game.mapMode !== "world" || Boolean(game.goldenEncounter),
    unlocked = canExplore(region, game.player.level, game.player.idle),
    fauna = faunaOf(region);
  openUtility(
    "Khám phá · Đại thế giới",
    `<div class="exploration-intro">${regionThumbnail(region)}<div><b>${REGIONS[region]}</b><small>3.600 × 2.400 · 4 khu vực · 6 loài quái và boss</small></div></div><p class="dim">Đi bộ hoặc cưỡi ngựa giữa các khu; chạm Đến khu để dịch chuyển. Khu sâu có quái cao cấp hơn. Quái thường hồi sinh 12 giây, tinh anh 20 giây, boss 60 giây trong phiên chơi.</p><label class="form-row">Chọn map<select id="exploration-region">${REGIONS.map((name, i) => `<option value="${i}" ${i === region ? "selected" : ""}>${name} · Cấp ${i * 10 + 1}–${i * 10 + 10}</option>`).join("")}</select></label><div class="exploration-zones">${explorationZones(
      region,
    )
      .map(
        (zone) =>
          `<article class="exploration-zone ${zone.boss ? "boss-zone" : ""}" data-zone-card="${zone.index}"><b>${zone.name}</b><small>Quái cấp ${zone.minLevel}–${zone.maxLevel}${zone.boss ? " · Sào huyệt boss" : ""}</small><div class="zone-fauna">${[...new Set([fauna.species[(zone.index * 2) % 6], fauna.species[(zone.index * 2 + 1) % 6], fauna.species[(zone.index * 2 + 2) % 6], ...(zone.boss ? [fauna.boss] : [])])].map((id) => `<span>${monsterMarkup(id)}<small>${MONSTERS[id].name}</small></span>`).join("")}</div><button class="outline-button" data-explore-region="${region}" data-explore-zone="${zone.index}" ${blocked || !unlocked ? "disabled" : ""}>${blocked ? "Rời trận hiện tại" : !unlocked ? `Cần cấp ${region * 10 + 1} hoặc mở ải` : `Đến khu · ${zone.name}`}</button></article>`,
      )
      .join(
        "",
      )}</div><div class="btnrow"><button class="mini-button" data-open-bestiary>Sổ quái · 32 chủng loại</button>${exploring() ? `<button class="mini-button" data-exit-exploration>Về thành</button>` : ""}</div>`,
  );
}
function openBestiary(): void {
  openUtility(
    "Sổ quái · 32 chủng loại",
    `<p class="dim">24 loài thường và 8 thủ lĩnh. Mỗi vùng có quần thể riêng; bí cảnh phối hợp quái, trùm phụ và boss cuối.</p><div class="bestiary-grid">${SPECIES.map((id) => `<article style="--monster-color:${ELEMENTS[MONSTERS[id].element].color}">${monsterMarkup(id)}<b>${MONSTERS[id].name}</b><small>${MONSTERS[id].boss ? "BOSS · " : ""}Hệ ${ELEMENTS[MONSTERS[id].element].name}</small></article>`).join("")}</div>`,
  );
}
function enterExploration(region: number, zone: number): void {
  if (
    !game ||
    game.mapMode !== "world" ||
    game.goldenEncounter ||
    !canExplore(region, game.player.level, game.player.idle) ||
    !Number.isInteger(zone) ||
    zone < 0 ||
    zone > 3
  )
    return;
  if (!persistGame()) return;
  collectIdleLoot(true);
  const player = game.player,
    previous = player.exploration;
  const same = previous.active && previous.region === region;
  player.exploration = {
    active: true,
    region,
    zone,
    returnTraining: previous.active
      ? previous.returnTraining
      : player.idle.enabled,
    returnTown: previous.active ? previous.returnTown : player.idle.inTown,
  };
  player.idle.enabled = false;
  player.idle.inTown = false;
  if (!same) game.enemies = makeExplorationEnemies(region);
  game.worldEnemies = game.enemies;
  game.loot = [];
  game.worldLoot = [];
  game.targetId = null;
  game.moveTarget = null;
  game.combat = freshCombat();
  game.telegraphs = [];
  game.effects = [];
  game.zones = [];
  game.botContext = "";
  game.botHits = [];
  const place = explorationZones(region)[zone];
  player.x = place.x;
  player.y = place.y + 110;
  game.autoBattle = false;
  syncWorldSize();
  game.cameraX = clamp(player.x - VIEW_WIDTH / 2, 0, WORLD_WIDTH - VIEW_WIDTH);
  game.cameraY = clamp(
    player.y - VIEW_HEIGHT / 2,
    0,
    WORLD_HEIGHT - VIEW_HEIGHT,
  );
  resetJoystick();
  keys.clear();
  closeUtility();
  showIdlePage("log");
  addLog(
    `Khám phá ${REGIONS[region]} · ${place.name}. Quái cấp ${place.minLevel}–${place.maxLevel}.`,
  );
  persistGame();
  refreshUi(true);
}
function exitExploration(): void {
  if (!game || !exploring()) return;
  collectIdleLoot(true);
  const player = game.player;
  player.idle.enabled = player.exploration.returnTraining;
  player.idle.inTown = true;
  player.exploration.active = false;
  game.targetId = null;
  game.moveTarget = null;
  game.effects = [];
  game.zones = [];
  game.telegraphs = [];
  game.combat = freshCombat();
  game.botContext = "";
  game.botHits = [];
  game.autoBattle = false;
  game.enemies = [];
  game.worldEnemies = [];
  player.x = PLAYER_START.x;
  player.y = PLAYER_START.y;
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  syncWorldSize();
  closeUtility();
  resetJoystick();
  keys.clear();
  addLog("Đã về thành; tiến trình luyện ải và trang bị được giữ nguyên.");
  persistGame();
  refreshUi(true);
}
function refreshExplorationHud(): void {
  if (!game) return;
  const active = exploring(),
    hud = document.getElementById("exploration-hud")!;
  hud.classList.toggle("hidden", !active);
  if (!active) return;
  const region = game.player.exploration.region,
    zone = zoneAt(region, game.player);
  game.player.exploration.zone = zone.index;
  document.getElementById("exploration-zone-name")!.textContent = zone.name;
  document.getElementById("exploration-zone-level")!.textContent =
    `Quái cấp ${zone.minLevel}–${zone.maxLevel}${zone.boss ? " · BOSS" : ""}`;
  document.getElementById("mobile-map-name")!.textContent =
    REGIONS[region].toLocaleUpperCase("vi");
  document.querySelector(".mobile-map-channel")!.textContent =
    "Khám phá · 4 khu vực";
  document.getElementById("stage-name")!.textContent =
    `${REGIONS[region]} · ${zone.name}`;
  document.getElementById("stage-description")!.textContent =
    `Đại thế giới · Quái cấp ${zone.minLevel}–${zone.maxLevel}`;
  document.getElementById("town-btn")!.innerHTML = "Về<br>thành";
}

let luckyTab: LuckyGame = "wheel";
let siegeArt: HTMLCanvasElement | undefined;
function openLuckyEvents(tab: LuckyGame = luckyTab): void {
  if (!game) return;
  if (game.mapMode !== "world" || game.goldenEncounter)
    return showToast("Rời trận hiện tại trước khi tham gia sự kiện.");
  luckyTab = tab;
  openUtility(
    "Sự kiện · Bạc trong game",
    luckyMarkup(game.player.lucky, tab, game.player.gold),
  );
  updateLuckyPresentation(game.player.lucky, game.player.gold, Date.now());
}
function playLucky(gameId: LuckyGame): void {
  if (!game || game.mapMode !== "world" || game.goldenEncounter) return;
  const p = game.player,
    backup = {
      gold: p.gold,
      refiningStones: p.refiningStones,
      potions: { ...p.potions },
      lucky: normalizeLuckyProgress(p.lucky),
    };
  const stake = Number(
    document.querySelector<HTMLInputElement>("#event-stake")?.value ?? 50,
  );
  const choice =
    document.querySelector<HTMLInputElement>("#event-choice")?.value ?? "";
  const receipt = playLuckyEvent(p, p.lucky, gameId, stake, choice, Date.now());
  if (!receipt)
    return showToast(
      "Kiểm tra số bạc, cửa cược và chờ lượt trước mở thưởng xong.",
    );
  if (!persistGame()) {
    Object.assign(p, backup);
    return;
  }
  openLuckyEvents(gameId);
  refreshUi(true);
}
const botRoleLabel = (role: string) =>
  ({
    healer: "Hồi phục",
    tank: "Đỡ đòn",
    ranged: "Đánh xa",
    fighter: "Cận chiến",
  })[role] ?? role;
function openBots(): void {
  if (!game) return;
  const settings = game.player.botSettings,
    blocked = game.mapMode !== "world" || Boolean(game.goldenEncounter);
  openUtility(
    "Đồng hành giang hồ · BOT",
    `<p class="dim">Bot là nhân vật do game điều khiển. Trong luyện công, bật Trợ chiến để tổ đội cùng đánh quái và chia phần thưởng cho nhân vật. BOT thường tuần tra ngẫu nhiên khắp map. Khi đến gần dưới 190, có 12% cơ hội bật Đồ sát; mỗi lần gặp chỉ xét một lần, cách nhau ít nhất 45 giây. Trong thành và tổ đội Trợ chiến luôn an toàn. Đồ sát kết thúc sau 45 giây, không làm mất trang bị. Công thành luôn có đội bot riêng.</p><div class="btnrow"><button class="mini-button" data-bot-setting="enabled" ${blocked ? "disabled" : ""}>Bot trong map: ${settings.enabled ? "Bật" : "Tắt"}</button><button class="mini-button" data-bot-setting="assist" ${blocked ? "disabled" : ""}>Trợ chiến: ${settings.assist ? "Bật" : "Tắt"}</button><button class="mini-button" data-bot-setting="pvp" ${blocked ? "disabled" : ""}>Đồ sát ngẫu nhiên: ${settings.pvp ? "Bật" : "Tắt"}</button></div><div class="bot-roster">${BOT_TEMPLATES.map((profile) => `<article style="--bot-color:${profile.color}">${characterPortraitMarkup(SECT_BY_FACTION[profile.faction], profile.sex)}<div><b>${profile.name} <small>BOT</small></b><span>${factionOf(profile.faction).name} · ${botRoleLabel(profile.role)}</span><small>${GEAR_VARIANTS[profile.weapon].name}</small></div></article>`).join("")}</div><button class="outline-button" data-open-siege>Gọi đội công thành</button>`,
  );
}
function openRequestedSiege(): void {
  if (!game) return;
  const encounter = game.territoryEncounter,
    active = encounter?.siege,
    blocked = game.mapMode !== "world" || Boolean(game.goldenEncounter);
  const outcomes = {
    victory: "Thắng",
    defeat: "Thất bại",
    retreat: "Rút quân",
    timeout: "Hết giờ",
    interrupted: "Gián đoạn",
  };
  openUtility(
    "Công thành theo yêu cầu",
    `<p class="dim">Gọi trận bất cứ lúc nào, chọn mọi thành từ cấp 1. Hai phe đều có bot môn phái, thời gian 4 phút. Phá cổng → phá chiến kỳ và giữ vùng cờ 12 giây (hai đợt viện binh) → hạ Thống lĩnh và quân bảo vệ. Địch đứng trong vòng cờ sẽ đẩy lùi tiến độ chiếm.</p><p class="dim">Thắng nhận bạc, XP, 2 đá tinh luyện và một trang bị Cực phẩm hoặc Hoàng Kim. Nếu đủ cấp và đã chiếm thành liền trước, trận thắng cũng chiếm lãnh thổ và nhận chiến công lần đầu. Các thành khác vẫn có thể gọi trận luyện tập từ cấp 1.</p>${active ? `<div class="card"><b>${territoryOf(encounter.id)!.name} · ${SIEGE_PHASES[encounter.wave]}</b><p>${Math.ceil(encounter.timeLeft)} giây · ${game.bots.filter((b) => b.hp > 0).length}/${active.size} bot sống</p><div class="btnrow">${siegeOrderButtons(active.order)}</div><button class="outline-button" data-leave-territory>Rút quân</button></div>` : `<div class="card"><label class="form-row">Thành<select id="siege-city">${TERRITORIES.map((t) => `<option value="${t.id}">${t.name}</option>`).join("")}</select></label><label class="form-row">Đội bot<select id="siege-size"><option value="3">3 đồng đội</option><option value="6" selected>6 đồng đội</option><option value="9">9 đồng đội</option></select></label><button class="outline-button" data-start-siege ${blocked ? "disabled" : ""}>${blocked ? "Rời trận hiện tại để gọi trận" : "Xuất quân ngay"}</button></div>`}<h3>Chiến báo · ${game.player.sieges.victories} trận thắng</h3><div class="event-history">${
      game.player.sieges.history
        .slice(0, 8)
        .map(
          (r) =>
            `<article><b>#${r.id} · ${territoryOf(r.city)!.name}</b><span>${outcomes[r.outcome]}${r.silver ? ` · +${r.silver} bạc · +${r.xp} XP · +${r.stones} đá` : ""}</span></article>`,
        )
        .join("") || `<p class="dim">Chưa có trận.</p>`
    }</div>`,
  );
}
function siegeOrderButtons(order: BotOrder): string {
  return (
    [
      ["push", "Phá mục tiêu"],
      ["guard", "Diệt quân"],
      ["rally", "Theo tôi"],
    ] as const
  )
    .map(
      ([id, name]) =>
        `<button class="mini-button" data-siege-order="${id}" aria-pressed="${order === id}">${name}</button>`,
    )
    .join("");
}
function makeRequestedSiegeEnemies(city: TerritoryId, wave: number): Enemy[] {
  if (!game) return [];
  const land = territoryOf(city)!,
    attack = effectiveAttack(),
    hp = game.player.maxHp;
  const units = Array.from({ length: wave === 2 ? 5 : 4 }, (_, i) => {
    const boss = wave === 2 && i === 0,
      profile = BOT_TEMPLATES[(i + wave * 3 + 2) % BOT_TEMPLATES.length];
    const enemy = createEnemy(
      `siege-${game!.territoryEncounter!.siege!.id}-${wave}-${i}`,
      `${boss ? "Thống lĩnh" : "Trấn quân"} ${profile.name} · BOT`,
      boss ? "boss" : "normal",
      800 + (i % 3) * 140,
      (wave === 0 ? 590 : 350) + Math.floor(i / 3) * 85,
      game!.player.level,
      profile.color,
    );
    enemy.botProfile = profile;
    enemy.defense = Math.floor(effectiveDefense() * 0.15);
    const hitDamage = scaledOutgoingDamage(attack, enemy.defense, game!.player.level, false, emptyStats());
    enemy.maxHp = enemy.hp = Math.max(100, Math.floor(hitDamage * (boss ? 35 : 7)));
    enemy.attack = Math.max(100, Math.floor(hp * (boss ? 0.045 : 0.025)));
    enemy.speed = 125;
    return enemy;
  });
  if (wave < 2) {
    const structure = createEnemy(
      `siege-objective-${wave}`,
      wave === 0 ? `Cổng ${land.name}` : "Chiến kỳ trấn thành",
      "elite",
      950,
      wave === 0 ? 520 : 380,
      game.player.level,
      land.color,
    );
    structure.structure = wave === 0 ? "gate" : "banner";
    structure.radius = wave === 0 ? 65 : 30;
    structure.maxHp = structure.hp = Math.floor(
      attack * (wave === 0 ? 30 : 22),
    );
    structure.attack = structure.defense = structure.speed = 0;
    units.push(structure);
  }
  return units;
}
function enterRequestedSiege(city: TerritoryId, size: number): void {
  if (
    !game ||
    game.mapMode !== "world" ||
    game.goldenEncounter ||
    ![3, 6, 9].includes(size) ||
    !territoryOf(city)
  )
    return;
  const backup = normalizeSiegeProgress(game.player.sieges),
    id = beginSiege(game.player.sieges, city, Date.now());
  if (!id) return;
  if (!persistGame()) {
    game.player.sieges = backup;
    return;
  }
  game.territoryEncounter = {
    id: city,
    wave: 0,
    timeLeft: 240,
    enemies: game.enemies,
    loot: game.loot,
    x: game.player.x,
    y: game.player.y,
    inTown: game.player.idle.inTown,
    autoBattle: game.autoBattle,
    siege: { id, size, order: "push", capture: freshSiegeCapture() },
  };
  game.mapMode = "territory";
  game.enemies = makeRequestedSiegeEnemies(city, 0);
  game.loot = [];
  game.telegraphs = [];
  game.effects = [];
  game.zones = [];
  game.combat = freshCombat();
  game.botHits = [];
  game.botContext = "";
  game.targetId = null;
  game.moveTarget = null;
  game.player.x = 950;
  game.player.y = 740;
  game.player.hp = game.player.maxHp;
  game.player.mp = game.player.maxMp;
  game.autoBattle = true;
  idleNextWave = 0;
  canvasBadge.textContent = `${territoryOf(city)!.name.toLocaleUpperCase("vi")} · ĐẠI CHIẾN`;
  resetJoystick();
  keys.clear();
  closeUtility();
  showIdlePage("log");
  addLog(
    `Gọi trận #${id}: ${size} đồng đội BOT xuất quân công ${territoryOf(city)!.name}.`,
  );
  tickBots(0, nowMs());
  refreshUi(true);
}
function updateSiegeCapture(dt: number): void {
  if (!game?.territoryEncounter?.siege || game.territoryEncounter.wave !== 1) return;
  const encounter = game.territoryEncounter, siege = encounter.siege!, flag = { x: 950, y: 380 };
  if (game.enemies.some(e => e.structure === "banner" && !e.dead)) return;
  const allied = [game.player, ...game.bots].some(actor => actor.hp > 0 && distance(actor, flag) <= 115);
  const contested = game.enemies.some(e => !e.dead && !e.structure && distance(e, flag) <= 220);
  if (tickSiegeCapture(siege.capture, dt, allied, contested)) {
    const reinforcements = makeRequestedSiegeEnemies(encounter.id, 1).filter(e => !e.structure).slice(0, 2);
    reinforcements.forEach((enemy, i) => { enemy.id += `-reinforce-${siege.capture.reinforcements}`; enemy.x = 810 + i * 280; enemy.y = 300; });
    game.enemies.push(...reinforcements);
    addLog(`Viện binh thủ thành đợt ${siege.capture.reinforcements}/2! Giữ khu chiến kỳ để tiếp tục đoạt cờ.`);
  }
  if (game.autoBattle && !game.enemies.some(e => !e.dead) && !allied) game.moveTarget = flag;
}
function refreshSiegeHud(): void {
  if (!game) return;
  const encounter = game.territoryEncounter,
    siege = encounter?.siege,
    hud = document.getElementById("siege-hud")!;
  hud.classList.toggle("hidden", !siege);
  if (!siege) return;
  document.getElementById("siege-phase")!.textContent =
    encounter.wave === 1 && game.enemies.every(e => e.structure !== "banner" || e.dead) ? `Giữ chiến kỳ · ${siege.capture.progress.toFixed(1)}/${SIEGE_CAPTURE_SECONDS}s` : SIEGE_PHASES[encounter.wave];
  document.getElementById("siege-clock")!.textContent =
    `${Math.ceil(encounter.timeLeft)}s · BOT ${game.bots.filter((b) => b.hp > 0).length}/${siege.size}`;
  const orders = document.getElementById("siege-orders")!;
  if (orders.dataset.order !== siege.order) {
    orders.innerHTML = siegeOrderButtons(siege.order);
    orders.dataset.order = siege.order;
  }
  const objective = game.enemies.find((e) => e.structure || e.kind === "boss");
  document.getElementById("siege-objective-health")!.style.width =
    `${encounter.wave === 1 && objective?.dead ? siege.capture.progress / SIEGE_CAPTURE_SECONDS * 100 : objective && !objective.dead ? (objective.hp / objective.maxHp) * 100 : 0}%`;
}
function botAppearance(profile: BotTemplate): HeroAppearance {
  return {
    weaponVariant: profile.weapon,
    weaponColor: profile.color,
    armorColor: "",
    auraColor: profile.color,
    tier: 1,
    enhancement: 0,
    simpleEffects: game?.player.preferences.skillEffects === "simple",
    weapon: { color: profile.color, rarity: "Tốt", enhance: 0 },
  };
}
function drawBot(bot: BotActor, now: number): void {
  if (bot.hp <= 0) return;
  ctx.save();
  ctx.translate(bot.x, bot.y);
  ctx.strokeStyle = bot.profile.color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 5, 21, 8, 0, 0, Math.PI * 2);
  ctx.stroke();
  drawAnimatedHero(
    ctx,
    bot.profile.faction,
    bot.profile.sex,
    bot.motion,
    now,
    botAppearance(bot.profile),
  );
  drawEnemyStatus(
    ctx,
    { ...bot, radius: 19, dead: false },
    now,
    game?.player.preferences.skillEffects === "simple",
  );
  ctx.restore();
  drawBar(bot.x - 24, bot.y - 72, 48, 4, bot.hp / bot.maxHp, "#7acda5");
  ctx.textAlign = "center";
  ctx.font = "600 10px sans-serif";
  ctx.fillStyle = bot.profile.color;
  drawOutlinedText(`${bot.profile.name} · BOT`, bot.x, bot.y - 78);
  ctx.textAlign = "left";
}
function botImpact(
  x: number,
  y: number,
  profile: BotTemplate,
  skill: SkillKey | undefined,
  now: number,
): void {
  const school = SCHOOL_KITS[SECT_BY_FACTION[profile.faction]],
    def = school.kit[skill ?? "skill1"];
  addSkillEffect({
    x,
    y: y - 24,
    sect: school.id,
    skill,
    radius: 30,
    color: profile.color,
    kind: def.motif,
    angle: 0,
    phase: "impact",
    duration: 420,
  });
}
function queueBotAttack(
  source: BotActor | Enemy,
  profile: BotTemplate,
  target: Enemy | BotActor | Player,
  side: "ally" | "enemy",
  skill: SkillKey | undefined,
  now: number,
): void {
  if (!game) return;
  const motion =
    "motion" in source
      ? source.motion
      : game.combat.enemyMotions.get(source.id)!;
  const school = SCHOOL_KITS[SECT_BY_FACTION[profile.faction]],
    d = distance(source, target);
  const projectile =
    profile.role === "ranged" ||
    profile.role === "healer" ||
    (skill && skillUsesFlight(school.kit[skill]));
  const duration = projectile ? Math.max(180, (d / 600) * 1000) : 220;
  motion.facingX = target.x - source.x < 0 ? -1 : 1;
  motion.facingY = target.y - source.y;
  Object.assign(motion, {
    action: skill ? "cast" : "attack",
    actionAt: now,
    actionDuration: duration + 260,
  });
  const hand = actorCastOffset(school.id, profile.sex, motion.facingX);
  game.botHits.push({
    sourceId: source.id,
    targetId: "id" in target ? target.id : "player",
    side,
    profile,
    skill,
    from: { x: source.x + hand.x, y: source.y + hand.y },
    startedAt: now + 110,
    duration,
    projectile: Boolean(projectile),
    damage: source.attack * (skill ? 1.6 : 1),
    reach: projectile ? 420 : 92,
  });
}
function tickBots(dt: number, now: number): void {
  if (!game) return;
  const siege = game.territoryEncounter?.siege,
    settings = game.player.botSettings;
  const visible =
    Boolean(siege) ||
    (settings.enabled && game.mapMode === "world" && !game.goldenEncounter);
  const context = siege
    ? `siege-${siege.id}`
    : visible
      ? `world-${exploring() ? `explore-${game.player.exploration.region}` : game.player.idle.stage}-${game.player.idle.inTown}-${settings.assist}-${settings.pvp}`
      : "off";
  if (context !== game.botContext) {
    game.botContext = context;
    game.enemies = game.enemies.filter(e => !e.rogueUntil);
    game.botHits = [];
    const indices = [0, 1, 4, 2, 3, 5, 6, 7, 8],
      count = siege?.size ?? (settings.assist ? 3 : 4);
    game.bots = visible
      ? indices
          .slice(0, count)
          .map((i, n) =>
            createBot(BOT_TEMPLATES[i], n, game!.player.level, game!.player, {
              attack: effectiveAttack(),
              hp: game!.player.maxHp,
              defense: effectiveDefense(),
            }),
          )
      : [];
  }
  game.enemies = game.enemies.filter(e => !e.rogueUntil || (!e.dead && e.rogueUntil > now));
  for (const [i, bot] of game.bots.entries()) {
    if (bot.hp <= 0) {
      if (now < bot.respawnAt) continue;
      const fresh = createBot(bot.profile, i, game.player.level, game.player, {
        attack: effectiveAttack(),
        hp: game.player.maxHp,
        defense: effectiveDefense(),
      });
      Object.assign(bot, fresh);
    }
    if (!siege && botEncounter(bot.encounter, distance(bot, game.player), now,
      game.player.idle.inTown || settings.assist || !settings.pvp || now < botSafeUntil) && !game.enemies.some(e => e.rogueUntil && !e.dead)) {
      const rogue = createEnemy(`rogue-${bot.id}-${Math.floor(now)}`, `${bot.profile.name} · ĐỒ SÁT`, "normal", bot.x, bot.y, bot.level, "#ff6474");
      rogue.botProfile = bot.profile; rogue.rogueUntil = now + 45000;
      rogue.hp = rogue.maxHp = bot.maxHp; rogue.attack = Math.floor(effectiveAttack() * .45);
      rogue.defense = bot.defense; rogue.speed = 160;
      game.enemies.push(rogue); bot.hp = 0; bot.respawnAt = now + 60000;
      if (game.autoBattle && !game.targetId) game.targetId = rogue.id;
      addLog(`${bot.profile.name} bật Đồ sát! Có thể đánh trả hoặc chạy xa. Đồ sát tự hết sau 45 giây.`);
      continue;
    }
    if (!siege && !settings.assist && (!bot.patrolGoal || distance(bot, bot.patrolGoal) < 25 || now >= bot.patrolUntil)) {
      bot.patrolGoal = randomPatrolGoal({ width: WORLD_WIDTH, height: WORLD_HEIGHT }, (x, y) => isBlocked(x, y, 19), bot);
      bot.patrolUntil = now + 18000 + Math.random() * 14000;
    }
    bot.cooldown = Math.max(0, bot.cooldown - dt);
    bot.skillCooldown = Math.max(0, bot.skillCooldown - dt);
    const fight =
      Boolean(siege) || (settings.assist && !game.player.idle.inTown);
    const target = fight
      ? (chooseBotTarget(
          bot,
          game.enemies,
          game.player,
          siege?.order ?? "guard",
        ) as Enemy | undefined)
      : undefined;
    const ranged = ["ranged", "healer"].includes(bot.profile.role),
      stop = target ? (ranged ? 200 : target.radius + 40) : 15;
    const angle =
      Math.PI * (0.15 + (i / Math.max(1, game.bots.length - 1)) * 0.7);
    let goal = target
      ? {
          x: target.x + Math.cos(angle) * (stop - 8),
          y: target.y + Math.sin(angle) * (stop - 8),
        }
      : {
          x:
            game.player.x +
            Math.cos(now / 6000 + i * 1.9) * (settings.assist ? 75 : 150),
          y:
            game.player.y +
            Math.sin(now / 5000 + i * 1.9) * (settings.assist ? 60 : 110),
        };
    if (!target && !siege && !settings.assist && bot.patrolGoal) goal = bot.patrolGoal;
    if (!target && siege && game.territoryEncounter!.wave === 1) goal = { x: 950 + (i % 3 - 1) * 38, y: 400 + Math.floor(i / 3) * 25 };
    if (siege) goal = siegeTravelGoal(bot, goal);
    const locked =
      bot.motion.actionDuration > 0 &&
      now - bot.motion.actionAt < bot.motion.actionDuration;
    if (!locked) moveBot(bot, goal, dt, now, (x, y) => isBlocked(x, y, 19), 12, {width:WORLD_WIDTH,height:WORLD_HEIGHT});
    else bot.motion.moving *= 0.85;
    if (bot.stunUntil > now || locked) continue;
    if (
      bot.profile.role === "healer" &&
      fight &&
      bot.skillCooldown <= 0 &&
      [game.player, ...game.bots].some(
        (ally) =>
          ally.hp > 0 &&
          ally.hp < ally.maxHp * 0.9 &&
          distance(bot, ally) < 260,
      )
    ) {
      for (const ally of game.bots)
        if (ally.hp > 0 && distance(bot, ally) < 260)
          ally.hp = Math.min(ally.maxHp, ally.hp + ally.maxHp * 0.08);
      if (distance(bot, game.player) < 260)
        game.player.hp = Math.min(
          game.player.maxHp,
          game.player.hp + game.player.maxHp * 0.04,
        );
      botImpact(bot.x, bot.y, bot.profile, "skill2", now);
      bot.skillCooldown = 6;
      Object.assign(bot.motion, {
        action: "cast",
        actionAt: now,
        actionDuration: 650,
      });
      continue;
    }
    if (target && distance(bot, target) <= stop + 15 && bot.cooldown <= 0) {
      const skill =
        bot.skillCooldown <= 0 && bot.profile.role !== "healer"
          ? "skill1"
          : undefined;
      queueBotAttack(bot, bot.profile, target, "ally", skill, now);
      bot.cooldown = 1.35;
      if (skill) bot.skillCooldown = 3.8;
    }
  }
  updateBotHits(now);
}
function tickSiegeDefender(
  enemy: Enemy,
  motion: ActorMotion,
  dt: number,
  now: number,
): void {
  if (!game || !enemy.botProfile) return;
  const profile = enemy.botProfile,
    candidates = enemy.rogueUntil ? [game.player] : [game.player, ...game.bots.filter((b) => b.hp > 0)];
  const target = candidates.reduce(
    (best, ally) =>
      distance(enemy, ally) < distance(enemy, best) ? ally : best,
    game.player as Player | BotActor,
  );
  const before = { x: enemy.x, y: enemy.y },
    ranged = profile.role === "ranged",
    reach = ranged ? 190 : 53;
  const locked = now - motion.actionAt < motion.actionDuration;
  if (!locked && distance(enemy, target) > reach) {
    const goal = enemy.rogueUntil ? target : siegeTravelGoal(enemy, target),
      d = distance(enemy, goal),
      stride = Math.min(
        d,
        enemy.speed * dt * (enemy.slowUntil > now ? enemy.slowFactor : 1),
      );
    const nx = enemy.x + ((goal.x - enemy.x) / Math.max(1, d)) * stride,
      ny = enemy.y + ((goal.y - enemy.y) / Math.max(1, d)) * stride;
    if (!isBlocked(nx, ny, enemy.radius)) {
      enemy.x = nx;
      enemy.y = ny;
    }
  }
  enemy.attackCooldown -= dt;
  enemy.bossCooldown -= dt;
  updateMotion(motion, before, enemy, dt, now);
  if (
    !locked &&
    distance(enemy, target) <= reach + 15 &&
    enemy.attackCooldown <= 0
  ) {
    const skill = enemy.bossCooldown <= 0 ? "skill1" : undefined;
    queueBotAttack(enemy, profile, target, "enemy", skill, now);
    enemy.attackCooldown = 1.7;
    if (skill) enemy.bossCooldown = 4.5;
  }
}
function updateBotHits(now: number): void {
  if (!game) return;
  const current = game;
  const pending = game.botHits;
  game.botHits = [];
  for (const hit of pending) {
    const source =
      hit.side === "ally"
        ? game.bots.find((b) => b.id === hit.sourceId && b.hp > 0)
        : game.enemies.find((e) => e.id === hit.sourceId && !e.dead);
    const target =
      hit.side === "ally"
        ? game.enemies.find((e) => e.id === hit.targetId && !e.dead)
        : hit.targetId === "player"
          ? game.player
          : game.bots.find((b) => b.id === hit.targetId && b.hp > 0);
    if (!source || !target) continue;
    if (now < hit.startedAt + hit.duration) {
      game.botHits.push(hit);
      continue;
    }
    if (
      !hit.projectile &&
      distance(source, target) >
        hit.reach + ("radius" in target ? target.radius : 19)
    )
      continue;
    if (hit.side === "ally") {
      const enemy = target as Enemy,
        damage = scaledOutgoingDamage(
          hit.damage,
          enemyDefense(enemy),
          source.level,
          false,
          emptyStats(),
        );
      enemy.hp = Math.max(0, enemy.hp - damage);
      enemy.hitFlash = 0.16;
      if (hit.skill && !enemy.structure) {
        const def =
          SCHOOL_KITS[SECT_BY_FACTION[hit.profile.faction]].kit[hit.skill];
        if (def.slow) {
          enemy.slowUntil = now + 2200;
          enemy.slowFactor = def.slow;
          enemy.chilledUntil =
            def.motif === "frost" || def.motif === "fan" ? enemy.slowUntil : 0;
        }
        if (def.stun) {
          enemy.stunUntil = now + Math.min(0.5, def.stun) * 1000;
          enemy.frozenUntil = def.motif === "frost" ? enemy.stunUntil : 0;
        }
        if (def.corrode) {
          enemy.corrodedUntil = enemy.defenseDownUntil = now + 2500;
        }
      }
      addFloatingText(
        enemy.x,
        enemy.y - 45,
        `-${formatNumber(damage)}`,
        "#95d8c1",
        12,
      );
      if (!enemy.hp) killEnemy(enemy);
    } else if (hit.targetId === "player") {
      const enemies = game.enemies;
      damagePlayer(hit.damage, `${hit.profile.name} · BOT`);
      if (game !== current || game.enemies !== enemies) return;
    } else {
      const bot = target as BotActor,
        damage = scaledIncomingDamage(
          hit.damage,
          bot.defense,
          bot.level,
          emptyStats(),
        );
      bot.hp = Math.max(0, bot.hp - damage);
      bot.motion.hurtUntil = now + 180;
      if (!bot.hp) {
        bot.respawnAt = now + 8000;
        addFloatingText(
          bot.x,
          bot.y - 50,
          "BOT · hồi sinh 8s",
          bot.profile.color,
          12,
        );
      }
      if (hit.skill && bot.hp > 0) {
        const def =
          SCHOOL_KITS[SECT_BY_FACTION[hit.profile.faction]].kit[hit.skill];
        if (def.slow) {
          bot.slowUntil = now + 2000;
          bot.slowFactor = def.slow;
          bot.chilledUntil = def.motif === "frost" ? bot.slowUntil : 0;
        }
        if (def.stun) {
          bot.stunUntil = now + Math.min(0.6, def.stun) * 1000;
          bot.frozenUntil = def.motif === "frost" ? bot.stunUntil : 0;
        }
      }
    }
    botImpact(target.x, target.y, hit.profile, hit.skill, now);
  }
}
function drawBotFlights(now: number): void {
  if (!game) return;
  for (const hit of game.botHits) {
    if (!hit.projectile || now < hit.startedAt) continue;
    const target =
      hit.side === "ally"
        ? game.enemies.find((e) => e.id === hit.targetId && !e.dead)
        : hit.targetId === "player"
          ? game.player
          : game.bots.find((b) => b.id === hit.targetId && b.hp > 0);
    if (!target) continue;
    drawSkillFlight(
      ctx,
      hit.from,
      { x: target.x, y: target.y - 24 },
      Math.min(1, (now - hit.startedAt) / hit.duration),
      SECT_BY_FACTION[hit.profile.faction],
      hit.skill,
      now,
      game.player.preferences.skillEffects,
    );
  }
}

function enterTerritory(id: TerritoryId): void {
  if (!game || game.mapMode !== "world" || game.goldenEncounter || !canChallengeTerritory(game.player.military, id, game.player.level)) return;
  if (!persistGame()) return;
  game.territoryEncounter = { id, wave: 0, timeLeft: 240, enemies: game.enemies, loot: game.loot, x: game.player.x, y: game.player.y, inTown: game.player.idle.inTown, autoBattle: game.autoBattle };
  game.mapMode = "territory"; game.enemies = makeTerritoryEnemies(id, 0); game.loot = [];
  game.telegraphs = []; game.effects = []; game.zones = []; game.combat = freshCombat();
  game.targetId = null; game.moveTarget = null; game.player.x = 950; game.player.y = 690;
  game.autoBattle = true; idleNextWave = 0;
  canvasBadge.textContent = `${territoryOf(id)!.name.toLocaleUpperCase("vi")} · CÔNG THÀNH`;
  resetJoystick(); keys.clear(); closeUtility(); showIdlePage("log");
  addLog(`Xuất quân công ${territoryOf(id)!.name}! Dọn 3 đợt và hạ Thống lĩnh trong 4 phút.`);
  refreshUi(true);
}
function leaveTerritory(message = "Đã rút quân. Thành chưa chiếm không nhận chiến công.", outcome: SiegeOutcome = "retreat"): void {
  if (!game?.territoryEncounter) return;
  collectIdleLoot(true);
  const encounter = game.territoryEncounter;
  const awardLevel = game.player.level;
  const record = encounter.siege ? settleSiege(game.player.sieges, encounter.siege.id, outcome, awardLevel, Date.now(), game.player.preferences.xpMultiplier) : null;
  game.botContext = ""; game.botHits = []; game.bots = [];
  game.territoryEncounter = undefined; game.mapMode = "world";
  game.enemies = encounter.enemies; game.loot = encounter.loot;
  game.player.x = encounter.x; game.player.y = encounter.y;
  game.player.idle.inTown = encounter.inTown; game.autoBattle = encounter.autoBattle;
  game.targetId = null; game.moveTarget = null;
  game.telegraphs = []; game.effects = []; game.zones = []; game.combat = freshCombat();
  idleNextWave = 0; resetJoystick(); keys.clear(); closeUtility();
  canvasBadge.textContent = game.player.idle.enabled ? `${stageInfo(game.player.idle.stage).name.toLocaleUpperCase("vi")} · ẢI ${stageInfo(game.player.idle.stage).localStage}` : "RỪNG TRÚC · KÊNH 01";
  if (record?.outcome === "victory") {
    game.player.gold = Math.min(1e9, game.player.gold + record.silver); game.player.refiningStones = Math.min(1e9, game.player.refiningStones + record.stones);
    record.xp = rewardExperience(awardLevel * 7);
    const prize = createItem(awardLevel, Math.random() < .2 ? "Hoàng Kim" : "Cực phẩm");
    storeRewardItems(game.player, [prize]);
    const land = territoryOf(record.city)!;
    const captured = captureTerritory(game.player.military, record.city, awardLevel);
    if (captured) { game.player.gold += land.merit * 3; game.player.refiningStones += Math.max(1, Math.floor(land.level / 25)); }
    message = `Đại thắng ${land.name}! +${record.silver} bạc · +${record.xp} XP · +${record.stones} đá · ${prize.name} [${prize.rarity}].${captured ? ` Chiếm lãnh thổ: +${land.merit} chiến công · +${land.merit * 3} bạc. Vào Ấn quân hàm để nhận sắc phong.` : ""}`;
  } else if (record) message = `${message} Trận #${record.id} đã kết thúc, không nhận thưởng.`;
  addLog(message); persistGame(); refreshUi(true);
}
function advanceTerritory(): void {
  if (!game?.territoryEncounter || game.enemies.some(enemy => !enemy.dead)) return;
  const encounter = game.territoryEncounter;
  if (encounter.siege) {
    if (encounter.wave === 1 && encounter.siege.capture.progress < SIEGE_CAPTURE_SECONDS) return;
    if (encounter.wave < 2) {
      encounter.wave++; game.enemies = makeRequestedSiegeEnemies(encounter.id, encounter.wave);
      game.targetId = null; game.botHits = []; game.telegraphs = []; game.zones = []; game.combat = freshCombat();
      addLog(`${territoryOf(encounter.id)!.name}: ${SIEGE_PHASES[encounter.wave]}!`);
    } else { leaveTerritory("Đại thắng!", "victory"); openRequestedSiege(); }
    return;
  }
  if (encounter.wave < 2) {
    encounter.wave++; game.enemies = makeTerritoryEnemies(encounter.id, encounter.wave);
    game.targetId = null; game.telegraphs = []; game.zones = []; game.combat = freshCombat();
    addLog(`${territoryOf(encounter.id)!.name}: đợt ${encounter.wave + 1}/3 đã xuất trận.`);
    return;
  }
  const land = territoryOf(encounter.id)!;
  if (captureTerritory(game.player.military, land.id, game.player.level)) {
    game.player.gold += land.merit * 3;
    game.player.refiningStones += Math.max(1, Math.floor(land.level / 25));
    leaveTerritory(`Đã chiếm ${land.name}! +${land.merit} chiến công · +${land.merit * 3} bạc. Vào Ấn quân hàm để nhận sắc phong.`);
    openTerritories(land.id);
  } else leaveTerritory("Thành đã được ghi nhận. Không nhận lại chiến công.");
}

let selectedTowerFloor = 1;
let towerExchangeSlot: ItemSlot = "weapon";
function towerItem(floor: number, slot: ItemSlot): Item {
  const info = towerFloor(floor)!;
  const item = createItem(info.level, info.rarity, slot);
  const variant = setShopVariant(TOWER_SET, slot, false);
  return { ...item, setId: TOWER_SET, element: "tho", variant,
    name: `Trấn Thiên ${GEAR_VARIANTS[variant].name}` };
}
function openTower(floor?: number, message = ""): void {
  if (!game) return;
  const progress = game.player.tower, encounter = game.towerEncounter;
  selectedTowerFloor = encounter?.floor ?? (floor && towerFloor(floor) ? floor : Math.min(TOWER_FLOORS, progress.highestFloor + 1));
  const info = towerFloor(selectedTowerFloor)!, reward = towerReward(progress, selectedTowerFloor)!;
  const blocked = game.mapMode !== "world" || !!game.goldenEncounter;
  const ready = canEnterTower(progress, info.floor, game.player.level), start = Math.floor((info.floor - 1) / 10) * 10 + 1;
  openUtility("Trấn Thiên Tháp · 100 tầng", `<div class="tower-banner"><span aria-hidden="true">塔</span><div><b>Tầng cao nhất ${progress.highestFloor}/${TOWER_FLOORS}</b><small>${progress.sigils} ấn tháp · Bộ Trấn Thiên 11 món</small></div></div>${message ? `<p class="tower-result" role="status">${escapeHtml(message)}</p>` : ""}<p class="dim">Mỗi tầng có 2 đợt trong 3 phút; tầng bội 10 có thủ lĩnh. Thưởng tăng theo tầng, lần đầu gấp đôi bạc/XP. Rời hoặc thua chưa nhận thưởng tầng. Điểm vượt tháp và ấn giữ sau trùng sinh.</p><label class="form-row">Chọn tầng<input id="tower-floor-input" type="number" min="1" max="100" value="${info.floor}"><button class="mini-button" data-select-tower-input>Xem</button></label><div class="tower-floors">${Array.from({ length: 10 }, (_, i) => start + i).map(n => `<button class="tower-floor ${n === info.floor ? "selected" : ""} ${n <= progress.highestFloor ? "cleared" : ""}" data-select-tower-floor="${n}" aria-pressed="${n === info.floor}">${n}${n <= progress.highestFloor ? " ✓" : n > progress.highestFloor + 1 ? " ♙" : ""}</button>`).join("")}</div><div class="btnrow"><button class="mini-button" data-select-tower-floor="${Math.max(1, start - 10)}" ${start === 1 ? "disabled" : ""}>‹ 10 tầng</button><button class="mini-button" data-select-tower-floor="${Math.min(100, start + 10)}" ${start === 91 ? "disabled" : ""}>10 tầng ›</button></div><section class="tower-detail" data-tower-floor="${info.floor}"><h3>Tầng ${info.floor} ${info.boss ? "· Thủ lĩnh" : "· Hộ tháp"}</h3><p>Quái cấp ${info.level} · ${progress.clears[info.floor - 1]} lần vượt · ${reward.first ? "Thưởng lần đầu" : "Thưởng khi vượt lại"}</p><div class="tower-rewards"><span>+${formatNumber(reward.gold)} bạc</span><span>+${formatNumber(reward.xp)} XP</span><span>+${reward.stones} đá</span><span>+${reward.sigils} ấn tháp</span><b>1 món Trấn Thiên ${reward.rarity} · Cấp ${reward.itemLevel}</b></div>${encounter ? `<p>Đợt ${encounter.wave + 1}/2 · ${Math.ceil(encounter.timeLeft)} giây</p><button class="outline-button" data-leave-tower>Rời tháp</button>` : `<button class="outline-button" data-enter-tower="${info.floor}" ${!ready || blocked ? "disabled" : ""}>${blocked ? "Rời trận hiện tại trước" : game.player.level < TOWER_MIN_LEVEL ? "Mở từ cấp 5" : info.floor > progress.highestFloor + 1 ? `Cần vượt tầng ${info.floor - 1}` : progress.clears[info.floor - 1] ? "Khiêu chiến lại" : "Leo tầng này"}</button>`}</section><button class="outline-button" data-open-tower-shop>Đổi ấn tháp · Chọn mảnh bộ Trấn Thiên</button>`);
}
function openTowerShop(): void {
  if (!game) return;
  const progress = game.player.tower, info = towerFloor(Math.max(1, progress.highestFloor))!, sample = towerItem(info.floor, towerExchangeSlot);
  const blocked = game.mapMode !== "world" || !!game.goldenEncounter || progress.highestFloor < 1 || progress.sigils < TOWER_EXCHANGE_COST || game.player.inventory.length >= BAG_CAPACITY;
  openUtility("Bộ Trấn Thiên · Đổi ấn tháp", `<p class="dim">Chỉ nhận từ leo tháp hoặc đổi ấn. Cộng hưởng +20% thuộc tính bộ với mọi môn phái; mốc 2/4/6/11 món.</p><p><b>${progress.sigils} ấn tháp</b> · ${TOWER_EXCHANGE_COST} ấn/món · Đồ theo tầng cao nhất ${progress.highestFloor}: cấp ${info.level}, ${info.rarity}.</p><label class="form-row">Mảnh còn thiếu<select id="tower-exchange-slot">${EQUIPMENT_SLOTS.map(slot => `<option value="${slot}" ${slot === towerExchangeSlot ? "selected" : ""}>${GEAR_SLOTS[slot].name}</option>`).join("")}</select></label><div class="item-detail">${itemArt(sample, "detail-gear-art")}<b>${sample.name}</b><small>${GEAR_SLOTS[sample.slot].name} · ${sample.rarity} · Cấp ${sample.level}</small></div><p class="dim">Chỉ số phụ được tạo khi đổi thật. Món nhận vào túi; túi đầy cần dọn trước.</p><button class="outline-button" data-exchange-tower-piece="${towerExchangeSlot}" ${blocked ? "disabled" : ""}>${game.mapMode !== "world" || game.goldenEncounter ? "Rời trận trước khi đổi" : progress.highestFloor < 1 ? "Cần vượt tầng đầu" : game.player.inventory.length >= BAG_CAPACITY ? "Túi đã đầy" : progress.sigils < TOWER_EXCHANGE_COST ? "Chưa đủ 20 ấn tháp" : "Đổi mảnh bộ · 20 ấn"}</button><button class="mini-button" data-open-tower>Trở về tháp</button>`);
}
function exchangeTowerPiece(slot: ItemSlot): void {
  if (!game || game.mapMode !== "world" || game.goldenEncounter || game.player.inventory.length >= BAG_CAPACITY) return;
  if (!spendTowerSigils(game.player.tower, slot)) return;
  game.player.inventory.push(towerItem(game.player.tower.highestFloor, slot));
  persistGame(); refreshUi(true); openTowerShop();
}
function makeTowerEnemies(floor: number, wave: number): Enemy[] {
  const info = towerFloor(floor)!;
  return (wave === 0 ? [[870, 470], [1030, 470], [950, 390]] : [[950, 420]]).map(([x, y], i) => {
    const kind = wave === 1 ? info.boss ? "boss" : "elite" : "normal";
    const enemy = createEnemy(`tower-${floor}-${wave}-${i}`, `Tầng ${floor} · ${kind === "boss" ? "Trấn Tháp Thủ Lĩnh" : kind === "elite" ? "Hộ Tháp Sứ" : "Tháp Vệ"}`, kind, x, y, info.level, "#b998e8");
    enemy.hp = enemy.maxHp = Math.floor(enemy.maxHp * info.healthScale); enemy.attack = Math.floor(enemy.attack * info.attackScale);
    enemy.defense = Math.floor(enemy.defense * (1 + floor * .025));
    enemy.element = (["kim", "moc", "thuy", "hoa", "tho"] as const)[(floor - 1) % 5];
    return enemy;
  });
}
function enterTower(floor: number): void {
  if (!game || game.mapMode !== "world" || game.goldenEncounter || !canEnterTower(game.player.tower, floor, game.player.level)) return;
  if (!persistGame()) return;
  game.towerEncounter = { floor, wave: 0, timeLeft: towerFloor(floor)!.timeLimit, enemies: game.enemies, loot: game.loot, x: game.player.x, y: game.player.y, inTown: game.player.idle.inTown, autoBattle: game.autoBattle };
  game.mapMode = "tower"; game.enemies = makeTowerEnemies(floor, 0); game.loot = [];
  game.player.x = 950; game.player.y = 620; game.player.idle.inTown = false; game.autoBattle = true;
  game.targetId = null; game.moveTarget = null; game.telegraphs = []; game.effects = []; game.zones = []; game.combat = freshCombat();
  keys.clear(); resetJoystick(); closeUtility(); closeMobileSheet(); showIdlePage("log");
  addLog(`Bắt đầu Trấn Thiên Tháp tầng ${floor}!`); refreshUi(true);
}
function leaveTower(message = "Đã rời tháp. Tầng chưa vượt không nhận thưởng."): void {
  if (!game?.towerEncounter) return;
  const encounter = game.towerEncounter;
  game.towerEncounter = undefined; game.mapMode = "world"; game.enemies = encounter.enemies; game.loot = encounter.loot;
  game.player.x = encounter.x; game.player.y = encounter.y; game.player.idle.inTown = encounter.inTown; game.autoBattle = encounter.autoBattle;
  game.targetId = null; game.moveTarget = null; game.telegraphs = []; game.effects = []; game.zones = []; game.combat = freshCombat();
  idleNextWave = 0; keys.clear(); resetJoystick(); closeUtility(); addLog(message); persistGame(); refreshUi(true);
}
function advanceTower(): void {
  if (!game?.towerEncounter || game.enemies.some(enemy => !enemy.dead)) return;
  const encounter = game.towerEncounter;
  if (encounter.wave === 0) {
    encounter.wave = 1; game.enemies = makeTowerEnemies(encounter.floor, 1); game.targetId = null;
    game.effects = []; game.zones = []; game.telegraphs = []; game.combat = freshCombat();
    addLog(`Tầng ${encounter.floor}: Hộ tháp đã xuất trận.`); return;
  }
  const reward = completeTowerFloor(game.player.tower, encounter.floor);
  if (!reward) { leaveTower("Tầng này không thể ghi nhận thêm phần thưởng."); return; }
  game.player.gold += reward.gold; game.player.refiningStones += reward.stones;
  storeRewardItems(game.player, [towerItem(encounter.floor, reward.slot)]); rewardExperience(reward.xp);
  const message = `Vượt tầng ${encounter.floor}! +${reward.gold} bạc · +${reward.sigils} ấn tháp · 1 món Trấn Thiên ${reward.rarity}.`;
  leaveTower(message); openTower(undefined, message);
}

function enterDungeon(id: DungeonId): void {
  if (!game) return;
  if (game.goldenEncounter)
    return showToast("Rời boss Hoàng Kim trước khi vào phụ bản.");
  const dungeon = DUNGEONS[id];
  if (!dungeon) return;
  if (game.mapMode !== "world") {
    addLog("Bạn đang ở trong phụ bản.");
    return;
  }
  if (!canEnterDungeon(id, game.player.level, game.player.dungeonClears)) {
    addLog(
      `Cần cấp ${dungeon.minLevel}${dungeon.prerequisite ? ` và hoàn thành ${DUNGEONS[dungeon.prerequisite].name}` : ""} để vào ${dungeon.name}.`,
    );
    return;
  }
  if (!persistGame()) return;
  game.dungeonReturn = {
    x: game.player.x,
    y: game.player.y,
    inTown: game.player.idle.inTown,
    autoBattle: game.autoBattle,
  };
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
    `Đã vào ${dungeon.name}. Dọn hết từng đợt trong ${Math.floor(dungeon.timeLimit / 60)} phút ${dungeon.timeLimit % 60} giây, quái không hồi sinh.`,
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

function leaveDungeon(resumeBattle = true): void {
  if (!game || game.mapMode !== "dungeon") return;
  if (game.dungeonCleared && !game.dungeonRewardClaimed) {
    addLog("Hãy nhận phần thưởng phụ bản trước khi rời đi.");
    return;
  }
  const cleared = game.dungeonCleared;
  const restore = game.dungeonReturn;
  game.dungeonReturn = undefined;
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
  if (restore) {
    game.player.x = restore.x;
    game.player.y = restore.y;
    game.player.idle.inTown = restore.inTown;
    game.autoBattle = restore.autoBattle && resumeBattle;
  } else if (playerIdleActive()) {
    game.player.x = 950;
    game.player.y = 650;
  }
  canvasBadge.innerHTML = `<span class="live-dot"></span> RỪNG TRÚC · KÊNH 01`;
  canvasTip.textContent = "Click quái để áp sát · E để nhặt đồ quanh bạn";
  if (!cleared) addLog("Bạn đã rời phụ bản trước khi hoàn thành.");
  syncWorldSize();
  persistGame();
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
  const awarded = rewardExperience(dungeon.reward.xp);
  const recovered: Item[] = Array.from({length:dungeon.reward.itemCount},()=>createItem(dungeon.reward.itemLevel, dungeon.reward.rarity));
  for (const loot of game.loot) {
    player.gold += loot.gold;
    player.refiningStones += loot.stones;
    if (loot.item) recovered.push(loot.item);
  }
  storeRewardItems(player, recovered);
  addLog(
    `Nhận thưởng ${dungeon.name}: +${formatNumber(awarded)} XP · +${dungeon.reward.gold} bạc · +${dungeon.reward.tokens} token · +${dungeon.reward.stones} đá · ${dungeon.reward.itemCount} đồ ${dungeon.reward.rarity}. Đã thu hồi đồ chưa nhặt.`,
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
  const bonus = characterBonuses();
  player.maxHp = toCombat(
    sect.baseHp +
    (player.level - 1) * 34 +
    Math.floor(equipmentDefense() * 1.45) +
    player.idle.attributes.vitality * 12 + equipmentBonuses().hp + bonus.hp);
  player.maxMp = toCombat(
    sect.baseMp + (player.level - 1) * 13 + player.idle.attributes.energy * 8 + equipmentBonuses().mp + bonus.mp);
  player.mounted = normalizeMounted(player.mounted, player.equipment.horse);
  player.speed = ridingSpeed(sect.speed + player.idle.attributes.dexterity + equipmentBonuses().speed + bonus.speed, player.equipment.horse, player.mounted);
  if (fullHeal) {
    player.hp = player.maxHp;
    player.mp = player.maxMp;
  } else {
    player.hp = clamp(player.hp + player.maxHp - oldMaxHp, toCombat(1), player.maxHp);
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
  if (game?.territoryEncounter?.siege) return siegeBlocked(x, y, radius, game.enemies.some(e => e.structure === "gate" && !e.dead));
  if (
    game?.goldenEncounter || exploring() ||
    (game && game.mapMode !== "world") ||
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
    ? toCombat(Math.floor(toCore(enemy.defense) * 0.72))
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

function dealDamage(enemy: Enemy, multiplier: number, source: string, visualSect?: School["id"]): void {
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
  const stats = combinedStats();
  const damage = scaledOutgoingDamage(raw, enemyDefense(enemy), game.player.level, critical, stats);
  const healing = Math.min(game.player.maxHp - game.player.hp, stolenLife(damage, enemy.hp, stats));
  if (healing > 0) game.player.hp += healing;
  enemy.hp = Math.max(0, enemy.hp - damage);
  enemy.hitFlash = 0.16;
  const enemyMotion = game.combat.enemyMotions.get(enemy.id);
  if (enemyMotion) enemyMotion.hurtUntil = nowMs() + 150;
  const sect = SCHOOL_KITS[visualSect ?? playerSect(game.player).id];
  const skill = SKILL_KEYS.find(key => sect.kit[key].name === source);
  const tick = source === "Độc" || source === "Thiêu đốt";
  addSkillEffect({
    x: enemy.x, y: enemy.y - 24, sect: sect.id, skill,
    radius: tick ? 14 : skill === "ultimate" ? 52 : critical ? 40 : skill ? 34 : 24,
    color: SKILL_PALETTES[sect.id].color, kind: sect.kit[skill ?? "skill1"].motif,
    angle: Math.atan2(enemy.y - game.player.y, enemy.x - game.player.x),
    phase: "impact", duration: tick ? 250 : skill === "ultimate" ? 600 : skill ? 460 : 320,
  });
  game.player.rage = clamp(game.player.rage + 7, 0, 100);
  addFloatingText(
    enemy.x + randomBetween(-8, 8),
    enemy.y - enemy.radius - 7,
    `-${formatNumber(damage)}`,
    critical ? "#ffe28a" : "#fff1d1",
    critical ? 23 : 18,
  );
  if (critical) addLog(`${source}: chí mạng ${formatNumber(damage)} sát thương.`);
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
  const offset = actorCastOffset(
    playerSect(game.player).id, game.player.sex,
    game.combat.motion.facingX, game.player.mounted,
  );
  const from = { x: game.player.x + offset.x, y: game.player.y + offset.y };
  game.combat.projectiles.push({
    sect: playerSect(game.player).id,
    from,
    target,
    startedAt: nowMs() + 110,
    duration: flightDuration(from, { x: target.x, y: target.y - 24 }, flightSpeed(playerSect(game.player).id)),
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
  const attackRate = 1 + combatModifiers(combinedStats()).attackSpeed / 100;
  game.player.attackCooldown = 0.62 / attackRate;
  faceTarget(target);
  const color = playerSect(game.player).color;
  animateAction(basicAttackRange() <= 100 ? "attack" : "cast", 320 / attackRate);
  if (basicAttackRange() <= 100) {
    queueStrike(target, target.x, target.y, 0, 1, "Đánh thường", 110);
    addSkillEffect({
      x: game.player.x,
      y: game.player.y - 18,
      radius: 85,
      color,
      duration: 450,
      sect: playerSect(game.player).id,
      kind: playerSect(game.player).kit.skill1.motif,
      phase: "release",
      angle: Math.atan2(target.y - game.player.y, target.x - game.player.x),
    });
  } else {
    launchProjectile(target, 1, "Đánh thường");
    addSkillEffect({ x: game.player.x, y: game.player.y - 24, radius: 18, color,
      sect: playerSect(game.player).id, kind: playerSect(game.player).kit.skill1.motif,
      phase: "cast", duration: 200 });
  }
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

function applySkillStatus(enemy: Enemy, definition: SkillDefinition, multiplier: number, now: number, sect = game ? playerSect(game.player).id : "cai-bang" as SchoolId): void {
  if (enemy.dead) return;
  applyElementalAilments(enemy, definition, multiplier, now, sect);
  if (definition.breakArmor) enemy.defenseDownUntil = Math.max(enemy.defenseDownUntil, now + definition.breakArmor * 1000);
  if (definition.slow) { enemy.slowUntil = now + 3000; enemy.slowFactor = definition.slow; }
  if (definition.stun) enemy.stunUntil = now + Math.min(definition.stun, enemy.kind === "boss" ? .35 : 2) * 1000;
  if (definition.motif === "fan" || definition.motif === "frost") {
    if (definition.slow) enemy.chilledUntil = enemy.slowUntil;
    if (definition.stun) enemy.frozenUntil = enemy.stunUntil;
  }
  if (definition.poison) {
    if (enemy.poisonUntil <= now) enemy.poisonNextTick = now + 1000;
    enemy.poisonUntil = Math.max(enemy.poisonUntil, now + definition.poison * 1000);
    enemy.poisonDamage = multiplier * .28;
  }
}

function castSkill(key: SkillKey, automatic = false): void {
  if (!game) return;
  const player = game.player, sect = playerSect(player), definition = sect.kit[key];
  const warn = (message: string) => { if (!automatic) showToast(message); };
  if (player.level < definition.unlock) return warn(`${definition.name} mở ở cấp ${definition.unlock}.`);
  if (player.cooldowns[key] > 0 || actionLocked()) return;
  if (player.mp < toCombat(definition.mp)) return warn(`Cần ${formatNumber(toCombat(definition.mp))} MP để dùng ${definition.name}.`);
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
  player.mp -= toCombat(definition.mp);
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
  let previousFlight: Projectile | undefined;
  for (const [index, enemy] of selection.targets.entries()) {
    const falloff = definition.shape === "chain" ? .8 ** index : 1;
    if (definition.damage > 0) for (let hit = 0; hit < (definition.hits ?? 1); hit++) {
      if (skillUsesFlight(definition)) {
        launchProjectile(enemy, multiplier * falloff, definition.name);
        const projectile = game.combat.projectiles[game.combat.projectiles.length - 1];
        projectile.definition = definition; projectile.skill = key;
        projectile.visualLeader = index === 0 && hit === 0;
        if (definition.shape === "chain" && index > 0 && previousFlight) {
          const previous = selection.targets[index - 1];
          projectile.visualFrom = { x: previous.x, y: previous.y - 24 };
          projectile.duration = flightDuration(projectile.visualFrom, { x: enemy.x, y: enemy.y - 24 }, flightSpeed(sect.id));
          projectile.startedAt = previousFlight.startedAt + previousFlight.duration;
        }
        previousFlight = projectile;
        projectile.startedAt += hit * 70;
      } else {
        game.combat.strikes.push({ sect: sect.id, target: enemy, x: enemy.x, y: enemy.y, radius: 0, multiplier: multiplier * falloff, source: definition.name, at: now + (dashPoint ? 240 : 150) + hit * 70, definition, range: definition.range, healing });
      }
    }
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
  const visual = { ...selection.center, radius: Math.min(280, visualRadius), color: SKILL_PALETTES[sect.id].color, sect: sect.id, kind: definition.motif, skill: key, angle: selection.angle, duration: key === "ultimate" ? 850 : 600 };
  const ranged = skillUsesFlight(definition);
  const reach = automatic ? undefined : { x: player.x, y: player.y, definition };
  const hand = actorCastOffset(sect.id, player.sex, game.combat.motion.facingX, player.mounted);
  addSkillEffect({ ...visual, reach, x: player.x + (ranged ? hand.x : 0), y: player.y + (ranged ? hand.y : -24), radius: 30, phase: "cast", duration: ranged ? 300 : 170 });
  if (!ranged) addSkillEffect({ ...visual, phase: "release", delay: 110 });
  if (definition.zone && !ranged) {
    game.zones.push({ ...visual, ...selection.center, radius: definition.radius, startedAt: now, duration: definition.zone * 1000, nextTick: now + 1000, multiplier: skillScale(key, .4), slow: definition.slow ?? 1, source: definition.name });
    if (game.zones.length > 6) game.zones.shift();
  }
  // Damage ticks build rage; casting an ultimate itself always consumes all rage.
  player.rage = key === "ultimate" ? 0 : clamp(player.rage + (key === "skill1" ? 10 : 14), 0, 100);
  addLog(`${definition.name} · -${formatNumber(toCombat(definition.mp))} MP.`);
  if (!automatic) refreshUi(true);
}



function rewardExperience(base: number): number {
  if (!game) return 0;
  const player = game.player;
  const { amount, levels } = applyExperience(player, base, player.preferences.xpMultiplier);
  player.journey.highestLevel = Math.max(player.journey.highestLevel, player.level);
  if (amount) addFloatingText(player.x, player.y - 35, `+${formatNumber(amount)} XP${player.preferences.xpMultiplier > 1 ? ` · x${player.preferences.xpMultiplier}` : ""}`, "#a9e8a8", 13);
  if (levels) {
    if (player.idle.autoAttributes) applyAttributeRecommendation(player.idle, player.factionId);
    if (player.idle.autoSkillPoints) applySkillRecommendation(player);
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
    addLog(`Nhận ${levels} điểm võ học và ${levels * 5} điểm tiềm năng.`);
    if (player.level === MAX_LEVEL) addLog("Đã đạt cấp 160! Mở Nhân vật → Trùng sinh để nhận chỉ số vĩnh viễn.");
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
  return amount;
}

function killEnemy(enemy: Enemy): void {
  if (!game || enemy.dead) return;
  if (game.goldenEncounter && enemy.id.startsWith("golden-")) { killGoldenBoss(enemy); return; }
  enemy.dead = true;
  if (enemy.rogueUntil) {
    enemy.respawnAt = Infinity;
    game.combat.corpses.push({ enemy: { ...enemy }, at: nowMs() });
    addLog(`Đã đánh bại ${enemy.name}. BOT rời trận, không rơi đồ.`);
    return;
  }
  if (game.territoryEncounter?.siege) {
    enemy.respawnAt = Infinity;
    if (!enemy.structure) { game.combat.corpses.push({ enemy: { ...enemy }, at: nowMs() }); if (game.combat.corpses.length > 16) game.combat.corpses.shift(); }
    addLog(`Đã hạ ${enemy.name}.`); return;
  }
  game.player.journey.kills++;
  if (enemy.kind === "elite") game.player.journey.elites++;
  if (enemy.kind === "boss") game.player.journey.bosses++;
  game.combat.corpses.push({ enemy: { ...enemy }, at: nowMs() });
  if (game.combat.corpses.length > 16) game.combat.corpses.shift();
  const idleFight = game.mapMode === "world" && playerIdleActive();
  const huntEligible = game.mapMode === "world" && !game.goldenEncounter && enemy.kind === "normal" && enemy.level <= game.player.level;
  enemy.respawnAt = enemy.wildElite ? Number.POSITIVE_INFINITY : exploring() ? nowMs() + (enemy.kind === "boss" ? 60000 : enemy.kind === "elite" ? 20000 : 12000) :
    idleFight || game.mapMode !== "world" || enemy.kind === "boss" || enemy.wildElite
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
  const dungeonTier = game.mapMode === "dungeon" && game.dungeonId ? DUNGEONS[game.dungeonId].tier : 0;
  const killXp = exploring() && enemy.kind !== "normal" ? xp + enemy.level * (enemy.kind === "boss" ? 25 : 9) : Math.floor(xp * (dungeonTier >= 2 ? 1 + dungeonTier * .35 : 1));
  const awardedXp = game.towerEncounter ? 0 : rewardExperience(killXp);
  if (enemy.id.startsWith("bandit-") && game.mapMode === "world") {
    player.questKills += 1;
    checkMainQuest();
  }
  if (game.targetId === enemy.id) game.targetId = null;
  if (enemy.kind === "boss") {
    if (game.mapMode !== "world") {
      addLog(`${enemy.name} đã gục ngã!`);
    } else if (idleFight) {
      addLog(`${enemy.name} đã gục ngã! Nhận trang bị từ Cực phẩm trở lên.`);
    } else if (enemy.id === "lang-vuong") {
      player.bossDefeated = true;
      game.lastBossDefeatedAt = nowMs();
      addLog("Lang Vương đã gục ngã! Bạn nhận được phần thưởng Cực phẩm.");
      checkMainQuest();
    } else addLog(`${enemy.name} đã gục ngã!`);
  } else {
    addLog(`${enemy.name} bị đánh bại. +${formatNumber(awardedXp)} XP.`);
  }
  if (game.towerEncounter) return; // The floor transaction owns its rewards.
  const chance =
    enemy.kind === "boss" ? 1 : enemy.kind === "elite" ? 0.92 : 0.32;
  if (Math.random() <= chance) {
    const forced = game.mapMode === "dungeon" && game.dungeonId ? dungeonDropRarity(game.dungeonId, enemy.kind, enemy.level) : rollEquipmentRarity(enemy.level, enemy.kind);
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
          ? Math.floor(300 * (1 + dungeonTier * .8))
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
        game.mapMode !== "world" ? Number.POSITIVE_INFINITY : nowMs() + 90000,
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
  if (enemy.kind === "elite") {
    game.campfires = game.campfires.filter(fire => fire.expiresAt > Date.now());
    game.campfires.push(createCampfire(`camp-${enemy.id}-${Date.now()}`, huntArea(), enemy.x, enemy.y, enemy.level, Date.now()));
    game.campfires = game.campfires.slice(-MAX_CAMPFIRES);
    addLog(`Hạ tinh anh! Lửa trại cháy 90 giây. Ở trong vòng sáng nhận ${campfireXp(enemy.level) * player.preferences.xpMultiplier} XP mỗi 3 giây.`);
  }
  if (huntEligible && recordNormalKill(game.player.eliteHunt, game.enemies.some(other => !other.dead && other.wildElite))) spawnWildElite(enemy);
  if (huntEligible || enemy.kind === "elite") persistGame();
}

function damagePlayer(amount: number, source: string): void {
  if (!game) return;
  const player = game.player;
  const stats = combinedStats();
  const dodge = combatModifiers(stats).dodge;
  if (dodge > 0 && Math.random() < dodge / 100) {
    addFloatingText(player.x, player.y - 39, "NÉ", "#a4eddf", 16);
    return;
  }
  let remaining = scaledIncomingDamage(amount, effectiveDefense(), player.level, stats);
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
    game.enemies = game.enemies.filter(e => !e.rogueUntil);
    botSafeUntil = nowMs() + 15000;
    game.telegraphs = [];
    game.combat = freshCombat();
    addLog(
      "Bạn đã ngã xuống và được đưa về điểm hồi sinh. Không mất trang bị.",
    );
    if (game.goldenEncounter) leaveGoldenBoss("Thất bại. Có thể khiêu chiến lại trong khung giờ này.");
    else if (game.towerEncounter) leaveTower("Leo tháp thất bại. Chưa nhận thưởng tầng này; có thể thử lại.");
    else if (game.territoryEncounter) leaveTerritory("Công thành thất bại. Có thể gọi trận lại.", "defeat");
    else if (inDungeon) leaveDungeon(false);
    else if (exploring()) { const safe=explorationZones(player.exploration.region)[0]; player.x=safe.x; player.y=safe.y+110; game.moveTarget=null; }
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
      if (loot.gold || loot.stones) {
        player.gold += loot.gold; player.refiningStones += loot.stones;
        animatePickup({ ...loot, item: undefined }); loot.gold = 0; loot.stones = 0; picked++;
      }
      addLog("Túi đồ đã đầy. Đã nhặt bạc và đá; hãy mặc hoặc bán đồ để nhặt trang bị.");
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
  entry.innerHTML = `${itemArt(item)}<div><b>${escapeHtml(item.name)}</b><small>${item.rarity} · Cấp ${item.level}</small></div>`;
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

function findOwnedItem(id: string): Item | undefined {
  return game ? [...game.player.inventory, ...Object.values(game.player.equipment)].find(item => item.id === id) : undefined;
}
function openEnhancement(item: Item, result = ""): void {
  if (!game) return;
  const info = enhancementInfo(item), next = { ...item, enhance: Math.min(10, item.enhance + 1) };
  const before = gearStats(item), after = gearStats(next);
  const equipped = game.player.equipment[item.slot]?.id === item.id;
  const blocked = game.mapMode !== "world";
  const poor = game.player.gold < info.cost || game.player.refiningStones < info.stones;
  openUtility("Cường hóa trang bị", `<div class="item-detail">${itemArt(item, "detail-gear-art")}<b style="color:${item.color}">${escapeHtml(item.name)} +${item.enhance}</b><p>${equipped ? "Đang mặc: thành công sẽ cộng ngay cho nhân vật." : "Trong túi: chỉ số cộng cho nhân vật sau khi mặc."}</p></div><table class="enhancement-table"><thead><tr><th>Chỉ số</th><th>Hiện tại</th><th>+${next.enhance}</th><th>Tăng</th></tr></thead><tbody>${(Object.keys(STAT_LABELS) as GearStat[]).filter(key => before[key] || after[key]).map(key => `<tr data-enhance-stat="${key}"><td>${STAT_LABELS[key]}</td><td>${formatNumber(displayedStat(key, before[key]))}${statUnit(key)}</td><td>${formatNumber(displayedStat(key, after[key]))}${statUnit(key)}</td><td>${after[key] > before[key] ? `+${formatNumber(displayedStat(key, after[key] - before[key]))}` : "—"}</td></tr>`).join("")}</tbody></table><p class="dim">${equipped ? `<span id="enhance-character-power">Lực chiến nhân vật ${formatNumber(currentCombatPower())} → ${formatNumber(projectedGearPower(next, item))}.</span> ` : ""}Điểm trang bị ${formatNumber(gearScore(item))} → ${formatNumber(gearScore(next))}. Chỉ số chính tăng mỗi bậc; các dòng phụ tăng theo tỷ lệ. Thất bại giữ nguyên cấp và chỉ số.</p>${info.capped ? '<p class="enhancement-result">Đã đạt cường hóa tối đa +10.</p>' : `<div class="enhancement-cost"><b>${info.cost} bạc + ${info.stones} đá</b><span>Tỷ lệ ${Math.round(info.chance * 100)}%</span></div><small class="dim">Đang có ${formatNumber(game.player.gold)} bạc · ${game.player.refiningStones} đá.</small>`}${result ? `<p id="enhance-result" class="enhancement-result" role="status">${escapeHtml(result)}</p>` : ""}<button class="outline-button" data-confirm-enhance="${escapeHtml(item.id)}" data-enhance-rank="${item.enhance}" ${info.capped || blocked || poor ? "disabled" : ""}>${info.capped ? "+10 tối đa" : blocked ? "Rời phụ bản để cường hóa" : poor ? "Thiếu bạc hoặc đá tinh luyện" : `Cường hóa +${next.enhance}`}</button>`);
}
function confirmEnhancement(id: string, rank: number): void {
  if (!game || game.mapMode !== "world") return;
  const item = findOwnedItem(id);
  if (!item) return showToast("Trang bị không còn trong túi hoặc trên nhân vật.");
  if (item.enhance !== rank) { openEnhancement(item, "Trang bị đã thay đổi. Hãy kiểm tra lại chỉ số và chi phí."); return; }
  const outcome = attemptEnhancement(item, game.player);
  if (outcome === "success") syncStats();
  const message = outcome === "success" ? `Thành công: ${item.name} +${item.enhance}.` : outcome === "failed" ? `Thất bại: giữ nguyên +${item.enhance}, đã dùng bạc và 1 đá.` : outcome === "capped" ? "Trang bị đã đạt +10." : "Không đủ bạc hoặc đá tinh luyện.";
  addLog(message); persistGame(); refreshUi(true); openEnhancement(item, message);
}
function huntArea(): string {
  if (!game) return "none";
  if (game.goldenEncounter) return "golden";
  if (game.towerEncounter) return `tower-${game.towerEncounter.floor}`;
  if (game.mapMode === "dungeon") return `dungeon-${game.dungeonId}`;
  if (game.territoryEncounter) return `territory-${game.territoryEncounter.id}`;
  if (exploring()) return `explore-${game.player.exploration.region}`;
  if (game.player.idle.inTown) return "town";
  return game.player.idle.enabled ? `stage-${game.player.idle.stage}` : "world";
}
function activeCampfires(): Campfire[] {
  return game ? game.campfires.filter(fire => fire.area === huntArea() && fire.expiresAt > Date.now()) : [];
}
function nearestCampfire(): Campfire | undefined {
  return game ? activeCampfires().sort((a, b) => distance(game!.player, a) - distance(game!.player, b))[0] : undefined;
}
function saveWildElite(): SavedWildElite | undefined {
  if (!game) return;
  const elite = (game.goldenEncounter?.enemies ?? game.enemies).find(enemy => enemy.wildElite && !enemy.dead);
  if (!elite) return;
  return { id: elite.id, name: elite.name, area: huntArea(), monsterId: elite.monsterId, x: elite.x, y: elite.y, level: elite.level, hp: elite.hp, element: elite.element };
}
function spawnWildElite(source: Enemy): void {
  if (!game) return;
  const radius = 25;
  let x = source.x, y = source.y;
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    const nx = source.x + Math.cos(angle) * 65, ny = source.y + Math.sin(angle) * 65;
    if (!isBlocked(nx, ny, radius)) { x = nx; y = ny; break; }
  }
  const elite = createEnemy(`wild-elite-${Date.now()}-${game.player.eliteHunt.spawned}`, `${source.name} tinh anh`, "elite", x, y, Math.min(160, source.level + 2), "#ffbf68");
  elite.wildElite = true; elite.element = source.element; elite.monsterId = source.monsterId; elite.ranged = source.ranged;
  for (const enemy of game.enemies) if (enemy.wildElite && enemy.dead) game.combat.enemyMotions.delete(enemy.id);
  game.enemies = game.enemies.filter(enemy => !enemy.wildElite || !enemy.dead);
  game.enemies.push(elite); game.worldEnemies = game.enemies;
  idleNextWave = 0;
  addLog(`${elite.name} đã xuất hiện! Hạ tinh anh để nhóm lửa trại.`);
}
function restAtCampfire(fire: Campfire): void {
  if (!game || fire.area !== huntArea() || fire.expiresAt <= Date.now()) return;
  game.autoBattle = false; game.targetId = null; game.combat.lootTarget = null;
  game.moveTarget = { x: fire.x, y: fire.y };
  closeUtility(); showIdlePage("log");
  addLog("Đi tới lửa trại để nhận XP theo thời gian. Bấm Tự động để tiếp tục đánh quái.");
}
function refreshHuntUi(): void {
  if (!game) return;
  const fire = nearestCampfire(), hunt = game.player.eliteHunt;
  const elite = game.enemies.some(enemy => !enemy.dead && enemy.wildElite);
  const message = fire ? `${nearCampfire(fire, game.player) ? "Đang hưởng" : "Lửa trại"}: +${game.player.level === MAX_LEVEL ? 0 : campfireXp(fire.level) * game.player.preferences.xpMultiplier} XP/3s · còn ${countdown(fire.expiresAt - Date.now())}` : elite ? "Tinh anh đã xuất hiện · Hạ quái để nhóm lửa trại." : hunt.normalKills < ELITE_MIN_KILLS ? `Quái thường ${hunt.normalKills}/${ELITE_MIN_KILLS} · Tích lũy cơ hội gặp tinh anh` : `Đã hạ ${hunt.normalKills} quái · Cơ hội lượt tới ${Math.round(eliteChance(hunt.normalKills + 1) * 100)}%`;
  document.getElementById("elite-hunt-status")!.textContent = message;
  document.querySelector<HTMLButtonElement>("#campfire-btn")!.disabled = !fire;
}
function drawCampfire(fire: Campfire, now: number): void {
  if (!game || fire.x < game.cameraX - CAMPFIRE_RADIUS || fire.x > game.cameraX + VIEW_WIDTH + CAMPFIRE_RADIUS || fire.y < game.cameraY - CAMPFIRE_RADIUS || fire.y > game.cameraY + VIEW_HEIGHT + CAMPFIRE_RADIUS) return;
  ctx.save(); ctx.translate(fire.x, fire.y);
  ctx.strokeStyle = nearCampfire(fire, game.player) ? "#ffd178" : "#c39a55";
  ctx.lineWidth = 1; ctx.globalAlpha = .35; ctx.setLineDash([5, 8]);
  ctx.beginPath(); ctx.arc(0, 0, CAMPFIRE_RADIUS, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]); ctx.globalAlpha = 1;
  ctx.fillStyle = "#3d2c21"; ctx.beginPath(); ctx.ellipse(0, 7, 21, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#99724a"; ctx.lineWidth = 6; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-12, 9); ctx.lineTo(12, 1); ctx.moveTo(-12, 1); ctx.lineTo(12, 9); ctx.stroke();
  const flicker = Math.sin(now / 120 + fire.x) * 2;
  for (const [color, width, height] of [["#ed7042", 14, 32], ["#ffbf4e", 9, 25], ["#ffed9e", 4, 16]] as const) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-width, 4); ctx.quadraticCurveTo(-width, -height / 2, flicker, -height); ctx.quadraticCurveTo(width, -height / 2, width, 4); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = "#ffe6a4"; ctx.font = "600 10px sans-serif"; ctx.textAlign = "center";
  drawOutlinedText(`Lửa trại · ${countdown(fire.expiresAt - Date.now())}`, 0, -39);
  ctx.restore();
}

function enhanceItem(index: number, equippedSlot?: ItemSlot): void {
  if (!game) return;
  const item = equippedSlot ? game.player.equipment[equippedSlot] : game.player.inventory[index];
  if (item) openEnhancement(item);
}

function persistGame(): boolean {
  if (!game || game.mapMode !== "world") return false;
  updateTitles();
  const snapshot = {
    version: 2,
    combatScaleVersion: COMBAT_SCALE_VERSION,
    savedAt: Date.now(),
    campfires: game.campfires.filter(fire => fire.expiresAt > Date.now() && !fire.area.startsWith("dungeon-")),
    wildElite: saveWildElite(),
    player: game.goldenEncounter ? { ...game.player, x: game.goldenEncounter.x, y: game.goldenEncounter.y, idle: { ...game.player.idle, inTown: game.goldenEncounter.inTown } } : game.player,
    groundLoot: [...(game.goldenEncounter?.loot ?? []), ...game.loot].map(({ id, x, y, item, gold, stones }) => ({
      id,
      x,
      y,
      item,
      gold,
      stones,
    })),
    enemies: game.enemies.filter(enemy => !enemy.rogueUntil).map((enemy) => ({
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
  if (game.mapMode !== "world")
    return addLog("Hãy hoàn thành hoặc rời trận hiện tại trước khi lưu.");
  if (persistGame()) addLog("Đã lưu tiến trình vào trình duyệt này.");
}

function loadGame(): void {
  if (game && game.mapMode !== "world")
    return addLog("Hãy hoàn thành hoặc rời trận hiện tại trước khi tải tiến trình.");
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
    snapshot.player.dungeonClears = normalizeDungeonClears(snapshot.player.dungeonClears, snapshot.player.dungeonTokens);
    if (snapshot.player.exploration.active) { snapshot.player.idle.enabled = false; snapshot.player.idle.inTown = false; }
    const worldEnemies = makeEnemies(snapshot.player.exploration);
    game = {
      combat: freshCombat(),
      bots: [], botContext: "", botHits: [],
      campfires: restoreCampfires(snapshot.campfires, Date.now()),
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
    if (game.player.sieges.pending) {
      settleSiege(game.player.sieges, game.player.sieges.pending.id, "interrupted", game.player.level, Date.now());
      addLog("Trận công thành trước đã gián đoạn. Có thể gọi trận mới bất cứ lúc nào.");
    }
    syncStats(); syncWorldSize(); centerWorldCamera();
    if (game.player.idle.enabled) {
      const reward = offlineReward(
        snapshot.savedAt,
        Date.now(),
        game.player.idle.stage,
      );
      if (reward.minutes && !game.player.idle.inTown) {
        game.player.gold += reward.gold;
        const awarded = rewardExperience(reward.xp);
        addLog(
          `Luyện công vắng mặt ${reward.minutes} phút: +${formatNumber(awarded)} XP · +${reward.gold} bạc (tối đa 4 giờ).`,
        );
      }
      prepareIdleWave();
      game.autoBattle = !game.player.idle.inTown;
    }
    if (snapshot.wildElite && snapshot.wildElite.area === huntArea()) {
      const saved = snapshot.wildElite;
      const elite = createEnemy(saved.id, saved.name, "elite", saved.x, saved.y, saved.level, "#ffbf68");
      elite.wildElite = true; elite.element = saved.element as Element | undefined; elite.monsterId = saved.monsterId ?? elite.monsterId; elite.ranged = Boolean(elite.monsterId && MONSTERS[elite.monsterId].behavior === "ranged");
      elite.hp = Math.min(elite.maxHp, saved.hp);
      game.enemies.push(elite);
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
  const hit = game.enemies.filter(
    (enemy) => !enemy.dead && distance(world, enemy) <= enemy.radius + 28,
  ).sort((a, b) => distance(world, a) - distance(world, b))[0];
  if (hit) {
    game.targetId = hit.id;
    game.moveTarget = null;
    addLog(`Mục tiêu: ${hit.name}.`);
    return;
  }
  const fire = activeCampfires().find(candidate => distance(world, candidate) <= 25);
  if (fire) { restAtCampfire(fire); return; }
  const npc =
    game.mapMode === "world" && !exploring() && !game.goldenEncounter
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
        if (strike.definition) applySkillStatus(strike.target, strike.definition, strike.multiplier, now, strike.sect);
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
    if (!game.enemies.includes(projectile.target) || projectile.target.dead) continue;
    if (now < projectile.startedAt + projectile.duration) {
      combat.projectiles.push(projectile);
      continue;
    }
    const target = projectile.target;
    if (!target.dead) {
      if (projectile.visualLeader && projectile.definition && projectile.skill && projectile.definition.shape === "area") {
        addSkillEffect({ x: target.x, y: target.y - 24,
          radius: projectile.definition.radius,
          color: SKILL_PALETTES[projectile.sect].color, sect: projectile.sect,
          kind: projectile.definition.motif, skill: projectile.skill, phase: "release",
          duration: projectile.skill === "ultimate" ? 700 : 450 });
      }
      if (projectile.visualLeader && projectile.definition?.zone && projectile.skill) {
        const definition = projectile.definition;
        game.zones.push({
          x: target.x, y: target.y, radius: definition.radius,
          color: SKILL_PALETTES[projectile.sect].color, sect: projectile.sect,
          kind: definition.motif, skill: projectile.skill, startedAt: now,
          duration: definition.zone! * 1000, nextTick: now + 1000,
          multiplier: skillScale(projectile.skill, .4), slow: definition.slow ?? 1,
          source: definition.name,
        });
        if (game.zones.length > 6) game.zones.shift();
      }
      if (projectile.definition) applySkillStatus(target, projectile.definition, projectile.multiplier, now, projectile.sect);
      if (projectile.area)
        dealAreaDamage(
          target.x,
          target.y,
          projectile.area,
          projectile.multiplier,
          projectile.source,
        );
      else dealDamage(target, projectile.multiplier, projectile.source, projectile.sect);
    }

  }
  combat.corpses = combat.corpses.filter((corpse) => now - corpse.at < 650);
  combat.pickups = combat.pickups.filter(
    (pickup) => now - pickup.at < pickup.duration,
  );
}
function update(dt: number, now: number): void {
  if (!game) return;
  syncWorldSize();
  const player = game.player;
  const before = { x: player.x, y: player.y };
  if (game.towerEncounter) {
    game.towerEncounter.timeLeft = Math.max(0, game.towerEncounter.timeLeft - dt);
    if (game.towerEncounter.timeLeft <= 0) { leaveTower("Hết giờ leo tháp. Chưa nhận thưởng tầng này."); return; }
  }
  if (game.territoryEncounter) {
    game.territoryEncounter.timeLeft = Math.max(0, game.territoryEncounter.timeLeft - dt);
    if (game.territoryEncounter.timeLeft <= 0) {
      leaveTerritory("Hết giờ công thành.", "timeout");
      return;
    }
  }
  game.campfires = game.campfires.filter(fire => fire.expiresAt > Date.now());
  const fireXp = tickCampfires(game.campfires, huntArea(), player, Date.now());
  if (fireXp) { rewardExperience(fireXp); persistGame(); }
  if (game.goldenEncounter && Date.now() >= game.goldenEncounter.window.endsAt) {
    leaveGoldenBoss("Khung giờ boss đã kết thúc.");
    return;
  }
  if ((game.goldenEncounter || exploring()) && player.idle.autoLoot) collectIdleLoot();
  tickBots(dt, now);
  updateSiegeCapture(dt);
  if (game.mapMode === "world" && !game.goldenEncounter && now - lastLootMaintenance >= 1000) {
    lastLootMaintenance = now;
    if (discardAutomaticLoot()) { persistGame(); refreshUi(true); }
  }
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
      leaveDungeon(false);
      return;
    }
  }
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.cooldowns.skill1 = Math.max(0, player.cooldowns.skill1 - dt);
  player.cooldowns.skill2 = Math.max(0, player.cooldowns.skill2 - dt);
  player.cooldowns.ultimate = Math.max(0, player.cooldowns.ultimate - dt);
  player.potionCooldown = Math.max(0, player.potionCooldown - dt);
  const regeneration = combatModifiers(combinedStats());
  player.hp = Math.min(player.maxHp, player.hp + dt * toCombat(regeneration.hpRegen));
  player.mp = Math.min(player.maxMp, player.mp + dt * toCombat(0.7 + regeneration.mpRegen));
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
    else {
      const goal = game.territoryEncounter?.siege ? siegeTravelGoal(player, game.moveTarget) : game.moveTarget, travel = Math.max(1, distance(player, goal));
      movePlayer(((goal.x - player.x) / travel) * Math.min(travel, player.speed * dt), ((goal.y - player.y) / travel) * Math.min(travel, player.speed * dt));
    }
  } else {
    const target = currentTarget();
    if (target) {
      const d = distance(player, target);
      if (d > basicAttackRange() + target.radius - 6 && !actionLocked()) {
        const goal = game.territoryEncounter?.siege ? siegeTravelGoal(player, target) : target, travel = Math.max(1, distance(player, goal));
        movePlayer(((goal.x - player.x) / travel) * Math.min(travel, player.speed * dt), ((goal.y - player.y) / travel) * Math.min(travel, player.speed * dt));
      } else playerBasicAttack();
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
        (enemy.kind !== "boss" || exploring())
      ) {
        enemy.dead = false;
        enemy.hp = enemy.maxHp;
        enemy.attackCooldown = 1;
        enemy.poisonUntil = enemy.poisonNextTick = enemy.stunUntil = enemy.slowUntil = enemy.defenseDownUntil = enemy.chilledUntil = enemy.frozenUntil = enemy.burnUntil = enemy.burnNextTick = enemy.corrodedUntil = 0;
        enemy.x = enemy.home?.x ?? enemy.x + randomBetween(-22, 22);
        enemy.y = enemy.home?.y ?? enemy.y + randomBetween(-22, 22);
        enemy.bossCooldown = 4;
      }
      continue;
    }
    if (enemy.poisonNextTick > 0 && enemy.poisonNextTick <= now && enemy.poisonNextTick <= enemy.poisonUntil) {
      enemy.poisonNextTick += 1000;
      dealDamage(enemy, enemy.poisonDamage, "Độc");
      if (enemy.dead) continue;
    }
    const burn = takeBurnTick(enemy, now);
    if (burn > 0) {
      dealDamage(enemy, burn, "Thiêu đốt", enemy.burnSect);
      if (enemy.dead) continue;
    }
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    if (enemy.stunUntil > now) {
      const frozenMotion = game.combat.enemyMotions.get(enemy.id);
      if (frozenMotion) { frozenMotion.moving = 0; frozenMotion.action = "idle"; }
      continue;
    }
    if (enemy.structure) continue;
    const enemySpeed = enemy.speed * (enemy.slowUntil > now ? enemy.slowFactor : 1);
    let motion = game.combat.enemyMotions.get(enemy.id);
    if (!motion) {
      motion = freshMotion();
      game.combat.enemyMotions.set(enemy.id, motion);
    }
    if (enemy.botProfile) { tickSiegeDefender(enemy, motion, dt, now); continue; }
    const enemyBefore = { x: enemy.x, y: enemy.y };
    const d = distance(enemy, player);
    if (enemy.home && (d > 700 || distance(enemy, enemy.home) > (enemy.kind === "boss" ? 600 : 420))) {
      const homeDistance = distance(enemy, enemy.home);
      if (homeDistance > 4) {
        const travel = Math.min(homeDistance, enemySpeed * dt);
        enemy.x += (enemy.home.x - enemy.x) / homeDistance * travel;
        enemy.y += (enemy.home.y - enemy.y) / homeDistance * travel;
      }
      updateMotion(motion, enemyBefore, enemy, dt, now);
      continue;
    }
    if (enemy.kind === "boss") {
      enemy.bossCooldown -= dt;
      if (d < 520 && enemy.bossCooldown <= 0) {
        const dungeonBoss = game.mapMode !== "world";
        const enraged = dungeonBoss && enemy.hp <= enemy.maxHp * 0.5;
        const attackName = enemy.monsterId && MONSTERS[enemy.monsterId].boss ? MONSTERS[enemy.monsterId].skill : game.territoryEncounter ? "Phá Quân" : game.dungeonId === "tomb" ? "Địa Chấn" : "Liệt Trảo";
        game.telegraphs.push({
          x: player.x,
          y: player.y,
          radius: 92,
          triggerAt: now + 1100,
          damage: enemy.attack * 1.4,
          label: `${enemy.name} · ${attackName}`,
          theme: enemy.element,
        });
        if (enraged)
          game.telegraphs.push({
            x: enemy.x,
            y: enemy.y,
            radius: 130,
            triggerAt: now + 1550,
            damage: enemy.attack * 1.2,
            label: `${enemy.name} · Cuồng Nộ`,
            theme: enemy.element,
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
    } else if (enemy.ranged && d < 440) {
      if (d > 185) {
        const angle=Math.atan2(player.y-enemy.y,player.x-enemy.x),x=enemy.x+Math.cos(angle)*enemySpeed*dt,y=enemy.y+Math.sin(angle)*enemySpeed*dt;
        if (!isBlocked(x,y,enemy.radius)) { enemy.x=x;enemy.y=y; }
      } else {
        enemy.attackCooldown-=dt;
        if (enemy.attackCooldown <= 0) {
          enemy.attackCooldown = 2;
          game.telegraphs.push({ x: player.x, y: player.y, radius: 36, triggerAt: now + 550, damage: enemy.attack, label: enemy.name, theme: enemy.element, flight: { from: {x:enemy.x,y:enemy.y-28}, startedAt:now, arrow:enemy.monsterId === "archer" } });
          Object.assign(motion, { action:"cast", actionAt:now, actionDuration:600 });
        }
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
      dealDamage(enemy, zone.multiplier, zone.source, zone.sect);
      if (zone.sect && zone.skill) applySkillStatus(enemy, SCHOOL_KITS[zone.sect].kit[zone.skill], zone.multiplier, now, zone.sect);
    }
  }
  game.zones = game.zones.filter(zone => now - zone.startedAt <= zone.duration);
  const remainingTelegraphs: Telegraph[] = [];
  for (const telegraph of game.telegraphs) {
    if (now >= telegraph.triggerAt) {
      if (telegraph.theme) addSkillEffect({ x: telegraph.x, y: telegraph.y, radius: telegraph.radius, color: ELEMENTS[telegraph.theme].color, duration: 500, kind: "burst", theme: telegraph.theme });
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
  advanceTerritory();
  advanceTower();
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
  if (game.towerEncounter) {
    territoryArt ??= createMapArt("dungeon", WORLD_WIDTH, WORLD_HEIGHT);
    ctx.drawImage(territoryArt, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    ctx.fillStyle = "#e6bfff"; ctx.font = "600 18px sans-serif";
    drawOutlinedText(`TRẤN THIÊN THÁP · TẦNG ${game.towerEncounter.floor} · ĐỢT ${game.towerEncounter.wave + 1}/2`, 660, 780);
  } else if (game.territoryEncounter) {
    territoryArt ??= createMapArt("dungeon", WORLD_WIDTH, WORLD_HEIGHT);
    if (game.territoryEncounter.siege) { siegeArt ??= createSiegeArt(); ctx.drawImage(siegeArt, 0, 0); }
    else ctx.drawImage(territoryArt, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    if (game.territoryEncounter.siege && game.territoryEncounter.wave === 1) {
      const capture = game.territoryEncounter.siege.capture;
      ctx.save(); ctx.translate(950, 380);
      ctx.fillStyle = "#78d7b71f"; ctx.strokeStyle = "#92f2cf"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(0, 0, 115, 90, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#ffdf86"; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.ellipse(0, 0, 118, 93, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * capture.progress / SIEGE_CAPTURE_SECONDS); ctx.stroke();
      if (game.enemies.every(e => e.structure !== "banner" || e.dead)) drawSiegeStructure(ctx, "banner", capture.progress / SIEGE_CAPTURE_SECONDS, now);
      ctx.fillStyle = "#fff1b8"; ctx.font = "bold 15px sans-serif"; ctx.textAlign = "center";
      drawOutlinedText(`GIỮ CHIẾN KỲ · ${capture.progress.toFixed(1)}/${SIEGE_CAPTURE_SECONDS}s`, 0, 135);
      ctx.restore();
    }
    const land = territoryOf(game.territoryEncounter.id)!;
    ctx.fillStyle = land.color;
    ctx.font = "600 14px 'DM Sans', sans-serif";
    if (!game.territoryEncounter.siege) drawOutlinedText(`${land.name.toLocaleUpperCase("vi")} · CÔNG THÀNH · ĐỢT ${game.territoryEncounter.wave + 1}/3`, 660, 780);
  } else if (game.mapMode === "dungeon") {
    const id = game.dungeonId!;
    if (DUNGEONS[id].tier >= 2 && dungeonArtRevisions.get(id) !== trainingArtRevision) {
      dungeonArts[id] = createTerrainArt(DUNGEONS[id].region, WORLD_WIDTH, WORLD_HEIGHT);
      dungeonArtRevisions.set(id, trainingArtRevision);
    }
    dungeonArts[id] ??= DUNGEONS[id].tier >= 2 ? createTerrainArt(DUNGEONS[id].region, WORLD_WIDTH, WORLD_HEIGHT) : createMapArt(id === "bamboo" ? "bamboo" : "dungeon", WORLD_WIDTH, WORLD_HEIGHT);
    if (Object.keys(dungeonArts).length > 3) { const oldest = Object.keys(dungeonArts).find(key => key !== id) as DungeonId; delete dungeonArts[oldest]; }
    ctx.drawImage(dungeonArts[id]!, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    ctx.fillStyle = "#d4c7ef";
    ctx.font = "600 14px 'DM Sans', sans-serif";
    drawOutlinedText(
      `${DUNGEONS[id].shortName} · ĐỢT ${game.dungeonWave + 1}/${DUNGEONS[id].waves.length}`,
      270,
      550,
    );
  } else {
    if (exploring()) { ctx.drawImage(explorationArt(player.exploration.region), 0, 0, WORLD_WIDTH, WORLD_HEIGHT); }
    else if (playerIdleActive() || game.goldenEncounter) {
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
    if (!playerIdleActive() && !game.goldenEncounter && !exploring()) drawOutlinedText("THANH KHÊ TRẤN", 268, 260);
    ctx.fillStyle = "#dde8cd";
    ctx.font = "12px 'DM Sans', sans-serif";
    if (exploring()) drawRegionWeather(ctx, player.exploration.region, now, game.cameraX, game.cameraY, VIEW_WIDTH, VIEW_HEIGHT, player.preferences.skillEffects === "simple");
    else if (playerIdleActive()) {
      const info = stageInfo(player.idle.stage);
      drawRegionWeather(ctx, info.region, now, game.cameraX, game.cameraY, VIEW_WIDTH, VIEW_HEIGHT, player.preferences.skillEffects === "simple");
    } else if (!game.goldenEncounter) drawOutlinedText("Cổng phía đông · Lang Vương", 1320, 1030);
    if (!playerIdleActive() && !game.goldenEncounter && !exploring()) for (const npc of NPCS) drawNpc(npc, now);
  }

  for (const fire of activeCampfires()) drawCampfire(fire, now);
  for (const zone of game.zones) drawSectEffect(ctx, { ...zone, kind: zone.kind as EffectMotif, quality: game.player.preferences.skillEffects }, ((now - zone.startedAt) % 1200) / 1200, true);
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
    ...game.bots.filter(b => b.hp > 0).map(bot => ({ y: bot.y, draw: () => drawBot(bot, now) })),
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
  drawBotFlights(now);
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
      ? exploring() ? explorationArt(game.player.exploration.region) : playerIdleActive() || game.goldenEncounter
        ? trainingArt(game.player.idle.stage)
        : worldArt
      : game.towerEncounter ? territoryArt : game.territoryEncounter ? game.territoryEncounter.siege ? siegeArt : territoryArt : dungeonArts[game.dungeonId!];
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
  if (game.mapMode === "world" && !exploring() && !game.goldenEncounter)
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
  if (effect.reach) {
    ctx.save(); ctx.globalAlpha *= .5 * (1 - clamp((now - effect.startedAt) / effect.duration, 0, 1));
    drawSkillReach(ctx, effect.reach.definition, effect.reach.x, effect.reach.y, effect.angle ?? 0, effect.color);
    ctx.restore();
  }
  if (effect.sect) drawSectEffect(ctx, { ...effect, kind: effect.kind as EffectMotif, quality: game?.player.preferences.skillEffects }, clamp((now - effect.startedAt) / effect.duration, 0, 1));
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
  const color = telegraph.theme ? ELEMENTS[telegraph.theme].color : "#ff7872";
  if (telegraph.flight) {
    const t = clamp(
      (now - telegraph.flight.startedAt) /
        (telegraph.triggerAt - telegraph.flight.startedAt),
      0,
      1,
    );
    const from = telegraph.flight.from,
      to = { x: telegraph.x, y: telegraph.y - 22 };
    const x = from.x + (to.x - from.x) * t,
      y = from.y + (to.y - from.y) * t;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(to.y - from.y, to.x - from.x));
    ctx.strokeStyle = color;
    ctx.lineWidth = telegraph.flight.arrow ? 2 : 4;
    ctx.beginPath();
    ctx.moveTo(-25, 0);
    ctx.lineTo(8, 0);
    ctx.stroke();
    if (telegraph.flight.arrow) {
      ctx.fillStyle = "#eee2b7";
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(4, -4);
      ctx.lineTo(4, 4);
      ctx.fill();
    } else {
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 14);
      glow.addColorStop(0, "#fff4cb");
      glow.addColorStop(0.3, color);
      glow.addColorStop(1, hexToRgba(color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.fillStyle = hexToRgba(color, 0.13 + (1 - remaining) * 0.14);
  ctx.beginPath();
  ctx.arc(telegraph.x, telegraph.y, telegraph.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
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
    drawEquipmentDropAura(ctx, loot.item, now, progress === 1, game?.player.preferences.skillEffects === "simple");
    ctx.save();
    ctx.translate(0, -height - 5);
    ctx.rotate((1 - progress) * 2.2);
    drawEquipmentIcon(ctx, loot.item.slot, color, 42, loot.item);
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
    if (!drawResource(ctx, "silver", 0, -4, 31)) {
      ctx.fillStyle = "#b9c9d1"; ctx.strokeStyle = "#536674"; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.ellipse((i - 1) * 6, (i % 2) * -4, 6, 4, -0.25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }
    if (loot.stones > 0) drawResource(ctx, "stone", 13, -10, 20);
  }
  ctx.restore();
}
function drawProjectile(projectile: Projectile, now: number): void {
  if (now < projectile.startedAt) return;
  const t = clamp((now - projectile.startedAt) / projectile.duration, 0, 1);
  const to = { x: projectile.target.x, y: projectile.target.y - 24 };
  const from = projectile.visualFrom ?? projectile.from;
  drawSkillFlight(ctx, from, to, t, projectile.sect, projectile.skill, now, game?.player.preferences.skillEffects);
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
    drawEquipmentIcon(ctx, pickup.loot.item.slot, pickup.loot.item.color, 22, pickup.loot.item);
  else {
    ctx.fillStyle = "#edcd76";
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawEnemySprite(enemy: Enemy, now: number): void {
  if (enemy.structure) { drawSiegeStructure(ctx, enemy.structure, enemy.hp / enemy.maxHp, now); return; }
  if (enemy.botProfile) {
    const p = enemy.botProfile, motion = game?.combat.enemyMotions.get(enemy.id) ?? freshMotion();
    drawAnimatedHero(ctx, p.faction, p.sex, motion, now, botAppearance(p)); return;
  }
  if (enemy.monsterId && drawMonster(ctx, enemy.monsterId, game?.combat.enemyMotions.get(enemy.id) ?? freshMotion(), now, enemy.kind === "elite")) return;
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
  if (enemy.kind === "elite") {
    ctx.strokeStyle = "#ffbf68"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 5, enemy.radius + 5, 10, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#ffbf68"; ctx.font = "13px Georgia"; ctx.textAlign = "center"; ctx.fillText("◆", 0, -enemy.radius * 2.6);
  }
  drawEnemySprite(enemy, now);
  drawEnemyStatus(ctx, enemy, now, game?.player.preferences.skillEffects === "simple");
  ctx.restore();
  const barWidth =
    enemy.kind === "boss" ? 160 : enemy.kind === "elite" ? 84 : 62;
  const labelY = enemy.y - (enemy.structure ? enemy.structure === "gate" ? 105 : 125 : enemy.botProfile ? 88 : enemy.monsterId ? monsterSize(enemy.monsterId, enemy.kind === "elite").height + 4 : enemy.radius * 2.6 + 12);
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

function currentHeroAppearance(): HeroAppearance {
  const equipment = game?.player.equipment ?? {};
  const bestGear = Object.values(equipment).reduce<Item | undefined>(
    (best, item) =>
      !best || equipmentTier(item.rarity) > equipmentTier(best.rarity)
        ? item
        : best,
    undefined,
  );
  const set = setStatuses(Object.values(equipment), game ? factionOf(game.player.factionId).element : undefined).sort((a, b) => b.pieces - a.pieces)[0];
  return {
    element: set ? GEAR_SETS[set.id].element : equipment.weapon?.element,
    pieces: set?.pieces ?? 0,
    setId: set?.id,
    weaponVariant: equipment.weapon?.variant ? variantOf(equipment.weapon) : undefined,
    weapon: equipment.weapon,
    armor: equipment.armor,
    helmet: equipment.helmet,
    boots: equipment.boots,
    pendant: equipment.pendant,
    simpleEffects: game?.player.preferences.skillEffects === "simple",
    riding: game?.player.mounted,
    weaponColor: equipment.weapon?.color ?? "#ffe5a3",
    armorColor:
      equipmentTier(equipment.armor?.rarity) >= 2 ? equipment.armor!.color : "",
    auraColor: bestGear?.color ?? "#ffe5a3",
    quality: bestGear,
    tier: equipmentTier(bestGear?.rarity),
    enhancement: equipment.weapon?.enhance ?? 0,
    auraEnhancement: Math.max(0, ...Object.values(equipment).map(item => item.enhance ?? 0)),
  };
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
  ctx.ellipse(0, 12, !remote && game?.player.mounted ? 34 : 12, !remote && game?.player.mounted ? 9 : 4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (remote) {
    const motion = freshMotion();
    motion.facingX = facingX;
    motion.facingY = facingY;
    ctx.scale(0.9, 0.9);
    drawAnimatedHero(ctx, "wudang", "male", motion, now);
  } else if (game) {
    const horse = game.player.mounted ? currentMountAppearance() : undefined;
    if (horse) drawMountedCharacter(ctx, game.player.factionId, game.player.sex, horse, game.combat.motion, now, currentHeroAppearance());
    else drawAnimatedHero(ctx, game.player.factionId, game.player.sex, game.combat.motion, now, { ...currentHeroAppearance(), riding: false });
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

let prestigeHudKey = "";
let prestigeHudRects: { left: number; right: number; top: number; bottom: number }[] = [];
let prestigeHudTop = 10;
function playerPrestigeBounds(top: number, bottom: number) {
  const expanded = document.querySelector(".app-shell")!.classList.contains("arena-expanded");
  const key = `${VIEW_WIDTH}:${VIEW_HEIGHT}:${game!.player.preferences.minimap}:${document.getElementById("arena-quest-toggle")!.getAttribute("aria-expanded")}:${expanded}`;
  if (key !== prestigeHudKey) {
    prestigeHudKey = key;
    const rect = canvas.getBoundingClientRect(), scaleX = VIEW_WIDTH / rect.width, scaleY = VIEW_HEIGHT / rect.height;
    prestigeHudRects = [".mobile-map-card", ".arena-quest"].flatMap(selector => {
      const element = document.querySelector<HTMLElement>(selector)!;
      if (element.classList.contains("hidden")) return [];
      const box = element.getBoundingClientRect();
      return [{ left: (box.left - rect.left) * scaleX, right: (box.right - rect.left) * scaleX, top: (box.top - rect.top) * scaleY, bottom: (box.bottom - rect.top) * scaleY }];
    });
    const header = document.getElementById("hero-status")!.getBoundingClientRect();
    prestigeHudTop = Math.max(10, (header.bottom - rect.top) * scaleY + 8);
  }
  const height = bottom - top;
  const relativeTop = Math.max(prestigeHudTop, Math.min(VIEW_HEIGHT - 10 - height, top - game!.cameraY));
  const relativeBottom = relativeTop + height;
  let left = 9, right = VIEW_WIDTH - 9;
  for (const rect of prestigeHudRects) {
    if (rect.top >= relativeBottom || rect.bottom <= relativeTop) continue;
    if ((rect.left + rect.right) / 2 < VIEW_WIDTH / 2) left = Math.max(left, rect.right + 12);
    else right = Math.min(right, rect.left - 12);
  }
  return { left: game!.cameraX + left, right: game!.cameraX + right, top: game!.cameraY + prestigeHudTop, bottom: game!.cameraY + VIEW_HEIGHT - 10 };
}

function drawPlayer(player: Player, now: number): void {
  const sect = playerSect(player);
  const cultivation = cultivationForPower(currentCombatPower());
  ctx.save();
  ctx.translate(player.x, player.y);
  const simple = player.preferences.skillEffects === "simple";
  const rank = militaryRankOf(player.military.equipped);
  drawCultivationAura(ctx, cultivation, now, simple);
  if (rank) drawMilitaryDragons(ctx, rank.id, now, false, simple);
  drawGearAura(ctx, currentHeroAppearance(), now, player.preferences.skillEffects === "simple");
  const title = wornTitle(player.journey);
  if (title && player.preferences.titleEffects) drawTitleEffect(ctx, title, now, simple);
  drawHeroSprite(sect, player.facingX, player.facingY, now);
  if (rank) drawMilitaryDragons(ctx, rank.id, now, true, simple);
  ctx.restore();
  const ridingOffset = player.mounted ? 36 : 0;
  drawBar(
    player.x - 25,
    player.y - (HERO_SIZE.height - 7) - ridingOffset,
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
    player.y - (HERO_SIZE.height + 3) - ridingOffset,
  );
  const labels: PrestigeLabel[] = [];
  if (rank) labels.push({ kind: "military", text: `Ấn · ${rank.name}`, style: militaryStyle(rank.id) });
  if (title && player.preferences.titleVisible) labels.push({ kind: "title", text: `${title.glyph} ${title.name}`, style: titleStyle(title) });
  labels.push({ kind: "realm", text: cultivation.label, style: realmStyle(cultivation) });
  const bottom = player.y - HERO_SIZE.height - 15 - ridingOffset;
  const height = labels.reduce((sum, label) => sum + label.style.height + 5, -5);
  const bounds = playerPrestigeBounds(bottom - height, bottom);
  const fitted = labels.map(label => fitPrestigeLabel(ctx, label, bounds.right - bounds.left));
  const widths = fitted.map(label => prestigeWidth(ctx, label));
  const placements = placePrestigeLabels(fitted, widths, player.x, bottom, bounds);
  for (const placement of placements) drawPrestigeLabel(ctx, placement.label, placement.x, placement.y, placement.width, now, simple);
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
    arenaLogText.textContent = "[Hệ thống] Chọn môn phái để bắt đầu hành trình.";
    mobileAuto.classList.remove("active");
    targetPanel.classList.remove("has-target");
    return;
  }
  if (!force && performance.now() - lastUiUpdate < 120) return;
  lastUiUpdate = performance.now();
  refreshSiegeHud();
  updateLuckyPresentation(game.player.lucky, game.player.gold, Date.now());
  const shell = document.querySelector<HTMLElement>(".app-shell")!;
  if (shell.dataset.effects !== game.player.preferences.skillEffects) shell.dataset.effects = game.player.preferences.skillEffects;
  updateTitles();
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
  setText("#level-label", `Cấp ${player.level}/${MAX_LEVEL} · Trùng sinh ${player.journey.rebirths}`);
  setText(
    "#xp-label",
    player.level === MAX_LEVEL ? "MAX · Có thể trùng sinh" : `${formatNumber(player.xp)} / ${formatNumber(xpToNext(player.level))} XP${player.preferences.xpMultiplier > 1 ? ` · x${player.preferences.xpMultiplier}` : ""}`,
  );
  setText(
    "#hp-label",
    `${formatNumber(player.hp)} / ${formatNumber(player.maxHp)}`,
  );
  setText(
    "#mp-label",
    `${formatNumber(player.mp)} / ${formatNumber(player.maxMp)}`,
  );
  setText("#gold-label", compactNumber(player.gold));
  document.getElementById("gold-label")!.title = `${formatNumber(player.gold)} bạc`;
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
  mobileAuto.innerHTML = `<span>⚔</span><small>${game.autoBattle ? "Tự động" : "Thủ công"}</small>`;
  setText(
    "#mobile-map-name",
    game.goldenEncounter ? "HOÀNG KIM" : game.mapMode === "world"
      ? player.idle.inTown ? "THANH KHÊ TRẤN" : playerIdleActive()
        ? stageInfo(player.idle.stage).name.toLocaleUpperCase("vi")
        : "RỪNG TRÚC"
      : game.towerEncounter ? `TRẤN THIÊN THÁP · TẦNG ${game.towerEncounter.floor}` : game.territoryEncounter ? territoryOf(game.territoryEncounter.id)!.name.toLocaleUpperCase("vi") : DUNGEONS[game.dungeonId!].shortName,
  );
  document.querySelector(".mobile-map-channel")!.textContent =
    game.goldenEncounter ? (game.enemies.every(enemy => enemy.dead) ? "Đã hạ boss" : "Khiêu chiến") : game.mapMode === "world"
      ? playerIdleActive()
        ? `Ải ${stageInfo(player.idle.stage).localStage}/10 · Đợt ${player.idle.wave}/4`
        : "Thanh Khê Trấn"
      : game.towerEncounter ? `Tầng ${game.towerEncounter.floor} · ${Math.ceil(game.towerEncounter.timeLeft)}s · Đợt ${game.towerEncounter.wave + 1}/2` : game.territoryEncounter ? `Công thành · ${Math.ceil(game.territoryEncounter.timeLeft)}s · Đợt ${game.territoryEncounter.wave + 1}/3` : `Đợt ${game.dungeonWave + 1}/${DUNGEONS[game.dungeonId!].waves.length}`;
  refreshExplorationHud();
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
  if (avatar && avatar.dataset.characterArt !== characterArtKey(sect.id, player.sex)) {
    avatar.dataset.sect = sect.id;
    avatar.dataset.characterArt = characterArtKey(sect.id, player.sex);
    avatar.className = `avatar-orb avatar-${player.sect}`;
    avatar.innerHTML = characterPortraitMarkup(sect.id, player.sex);
    avatar.style.background = hexToRgba(sect.color, 0.3);
    const shortcut = document.querySelector(".character-shortcut");
    if (shortcut)
      shortcut.outerHTML = spriteMarkup(sect.id, "character-shortcut", player.sex);
  }
  canvas.dataset.characterArt = characterArtKey(sect.id, player.sex);
  const bars: Record<string, string> = {
    "#xp-bar": `${player.level === MAX_LEVEL ? 100 : Math.min(100, (player.xp / xpToNext(player.level)) * 100)}%`,
    "#hp-bar": `${(player.hp / player.maxHp) * 100}%`,
    "#mp-bar": `${(player.mp / player.maxMp) * 100}%`,
  };
  for (const [selector, width] of Object.entries(bars)) {
    const bar = document.querySelector<HTMLElement>(selector);
    if (bar) bar.style.width = width;
  }
  const statGrid = document.querySelector<HTMLDivElement>("#stat-grid")!;
  statGrid.innerHTML = [
    ["weapon", "Công kích", formatNumber(effectiveAttack()), "#7ecfff"],
    ["armor", "Phòng ngự", formatNumber(effectiveDefense()), "#d0c978"],
    ["pendant", "Sinh lực", formatNumber(player.maxHp), "#ff8b74"],
    ["necklace", "Nội lực", formatNumber(player.maxMp), "#8cb5ff"],
    ["ring", "Chí mạng", `${criticalChance()}%`, "#ffd482"],
    ["bracelet", "Nộ khí", `${formatNumber(player.rage)}%`, "#d2a0ff"],
    ["boots", "Tốc độ", formatNumber(player.speed), "#7ed5a5"],
  ]
    .map(
      ([slot, label, value, color]) =>
        `<div class="classic-stat">${equipmentMarkup(slot, color)}<div><span>${label}</span><strong>${value}</strong></div></div>`,
    )
    .join("");
  if (target) {
    targetContent.classList.remove("target-empty");
    const status =
      target.kind === "boss"
        ? "BOSS · CƠ CHẾ ĐANG HOẠT ĐỘNG"
        : target.kind === "elite"
          ? "TINH ANH"
          : "ĐANG GIAO CHIẾN";
    const ailmentTime = nowMs();
    const ailments = [[target.burnUntil > ailmentTime, "Thiêu đốt"], [target.corrodedUntil > ailmentTime, "Ăn mòn giáp"], [target.poisonUntil > ailmentTime, "Trúng độc"], [target.frozenUntil > ailmentTime, "Đóng băng"]].filter(([active]) => active).map(([, label]) => label).join(" · ");
    targetContent.innerHTML = `
      <div class="target-heading"><div class="target-orb" style="--target-color:${target.color}"></div><div><strong>${escapeHtml(target.name)}</strong><span>${status} · Cấp ${target.level}</span></div></div>
      <div class="target-hp-row"><span>HP</span><strong>${formatNumber(target.hp)} / ${formatNumber(target.maxHp)}</strong></div>
      <div class="meter enemy-meter"><span style="width:${(target.hp / target.maxHp) * 100}%"></span></div>
      ${ailments ? `<small class="target-ailments">${ailments}</small>` : ""}
      <div class="target-meta"><span>Phòng ${formatNumber(enemyDefense(target))}</span><span>Khoảng cách ${Math.floor(distance(player, target))}</span></div>
    `;
    combatStatusText.textContent = `${target.name} · ${formatNumber(target.hp)} HP`;
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
  arenaLogText.textContent = `[Giang hồ] ${game.logs.at(-1) ?? "Chào mừng đến giang hồ."}`;
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
          `<button class="skill-button" data-skill="${skill.key}" title="${skill.name} · ${skillReachLabel(sect.kit[skill.key])} · ${formatNumber(toCombat(sect.kit[skill.key].mp))} MP · ${sect.kit[skill.key].cooldown}s"><span class="skill-number">${skill.number}</span>${skillGlyphMarkup(skill.key, sect.id)}<span class="skill-name">${skill.name}</span><span class="skill-cooldown"></span></button>`,
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
    const target = currentTarget(), definition = sect.kit[skill.key];
    const outOfRange = Boolean(definition.requiresTarget && target && !withinReach(player, target, definition.range, target.radius));
    const coolText = locked
      ? "KHÓA"
      : cooldown > 0
        ? `${cooldown.toFixed(1)}s`
        : player.mp < toCombat(sect.kit[skill.key].mp)
          ? "THIẾU MP"
          : outOfRange ? "XA QUÁ"
          : skill.key === "ultimate"
          ? `${Math.floor(player.rage)}% nộ`
          : `${formatNumber(toCombat(sect.kit[skill.key].mp))} MP`;
    const button = skillBar.querySelector<HTMLButtonElement>(
      `[data-skill="${skill.key}"]`,
    )!;
    button.classList.toggle("locked", locked);
    button.classList.toggle("out-of-range", outOfRange);
    button.classList.toggle("ultimate-ready", skill.key === "ultimate" && !locked && cooldown <= 0 && player.rage >= 100 && player.mp >= toCombat(sect.kit[skill.key].mp));
    button.setAttribute("aria-label", `${skill.name}: ${coolText} · ${skillReachLabel(definition)}`);
    button.querySelector(".skill-cooldown")!.textContent = coolText;
  }
  skillBar.querySelector("[data-basic-attack] .skill-cooldown")!.textContent =
    player.attackCooldown > 0 ? `${player.attackCooldown.toFixed(1)}s` : "ĐÁNH";
}

function itemRow(item: Item, index: number, equipped = false): string {
  const statLabel = `${equipmentGrade(item.level)} · Điểm ${formatNumber(gearScore(item))}`;
  const info = enhancementInfo(item);
  const enhanceButton = `<button class="mini-button enhance-btn" data-index="${index}" ${equipped ? `data-equipped="${item.slot}"` : ""}>${info.capped ? "+10 tối đa" : `Rèn +${item.enhance + 1} · ${info.cost} bạc`}</button>`;
  const equipButton = equipped
    ? ""
    : `<button class="mini-button equip-btn" data-index="${index}">Mặc đồ</button>`;
  const saleButton = equipped
    ? ""
    : `<button class="mini-button sell-btn ${pendingSaleId === item.id ? "sale-confirm" : ""}" data-item-id="${escapeHtml(item.id)}" ${game?.mapMode !== "world" ? "disabled" : ""}>${pendingSaleId === item.id ? "Xác nhận bán" : `Bán · ${itemSalePrice(item)} bạc`}</button>`;
  const cancelButton =
    pendingSaleId === item.id
      ? `<button class="mini-button" data-cancel-sale>Hủy</button>`
      : "";
  return `<div class="item-row" style="--rarity-color:${item.color}"><div class="item-icon">${itemArt(item)}</div><div class="item-copy"><strong>${escapeHtml(item.name)} ${item.enhance ? `+${item.enhance}` : ""}</strong><span>${item.rarity} · Cấp ${item.level} · ${statLabel}</span>${gearIdentityMarkup(item)}${gearStatsMarkup(item)}</div><div class="item-actions">${equipButton}${enhanceButton}${saleButton}${cancelButton}</div></div>`;
}

function supplyMarkup(): string {
  if (!game) return "";
  const player = game.player;
  return `<div class="supply-list">${(["hp", "mp"] as PotionKind[]).map((kind) => `<div class="supply-row"><span class="supply-icon potion-${kind}">${resourceMarkup(kind)}</span><div><strong>${POTIONS[kind].name}</strong><small>${player.potions[kind]} bình · Hồi 40% ${POTIONS[kind].label} tối đa</small></div><button class="mini-button" data-use-potion="${kind}" ${player.potionCooldown > 0 || player.potions[kind] < 1 ? "disabled" : ""}>${player.potionCooldown > 0 ? `${Math.ceil(player.potionCooldown)}s` : "Dùng"}</button></div>`).join("")}</div>`;
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
    player.mounted,
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
  document.getElementById("inventory-title")!.textContent = {
    bag: "Túi Đồ",
    smith: "Cường Hóa",
    skills: "Võ Công",
    dungeon: "Phụ Bản",
    shop: "Thương Nhân",
  }[activeTab];
  document
    .querySelectorAll<HTMLButtonElement>(".tab-button")
    .forEach((button) => {
      button.classList.toggle("active", button.dataset.tab === activeTab);
    });
  if (activeTab === "shop") {
    inventoryContent.innerHTML = `
      <div class="smith-intro"><span class="smith-icon">◆</span><div><strong>Châu thương nhân</strong><p>Mua bình bằng bạc. Bình xếp riêng, không chiếm ô trang bị.</p></div></div>
      <div class="resource-hint"><span>Bạc hiện có</span><b>${formatNumber(player.gold)} bạc</b></div>
      ${game.mapMode !== "world" ? `<p class="panel-notice">Tiệm đóng trong trận. Bạn vẫn dùng được bình đã mang theo.</p>` : ""}
      ${(["hp", "mp"] as PotionKind[]).map((kind) => `<div class="shop-card potion-shop-card">${resourceMarkup(kind)}<strong>${POTIONS[kind].name} · ${POTIONS[kind].price} bạc</strong><p>Hồi 40% ${POTIONS[kind].label} tối đa · Đang có ${player.potions[kind]}/${MAX_POTIONS}</p><div class="item-actions">${[1, 5].map((quantity) => `<button class="mini-button" data-buy-potion="${kind}" data-quantity="${quantity}" ${!shopOpen || player.gold < POTIONS[kind].price * quantity || player.potions[kind] + quantity > MAX_POTIONS ? "disabled" : ""}>Mua ${quantity} · ${POTIONS[kind].price * quantity} bạc</button>`).join("")}</div></div>`).join("")}
      <p class="panel-notice">Hai loại bình dùng chung hồi chiêu 8 giây. Q: bình HP · R: bình MP. HP/MP đầy sẽ không mất bình.</p>
      <div class="shop-card mount-shop">${equipmentMarkup("horse", itemColor("Tốt"), "Tốt")}<div><strong>Tuấn Mã Hành Cước · ${BASIC_HORSE_PRICE} bạc</strong><p>Mặc vào ô Ngựa rồi Lên/Xuống ngựa bằng H. Tốc độ cưỡi +36%.</p><button class="mini-button" id="buy-basic-horse" ${!shopOpen || player.gold < BASIC_HORSE_PRICE || player.inventory.length >= BAG_CAPACITY ? "disabled" : ""}>Mua Tuấn Mã</button></div></div>
      <div class="shop-card"><strong>Trang bị bộ môn phái</strong><p>${Object.keys(GEAR_VARIANTS).length} chủng loại · ${SET_IDS.length - 1} bộ mua tại tiệm; bộ Trấn Thiên nhận từ leo tháp. Chọn bộ, vị trí và kiểu món. Phẩm chất Tốt, cấp theo nhân vật.</p><button class="mini-button" data-open-gear-gallery>Xem mẫu hình &amp; hiệu ứng</button><button class="mini-button" data-set-shop ${!shopOpen ? "disabled" : ""}>Chọn mảnh bộ · Từ ${120 + player.level * 8} bạc</button></div>
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
      <div class="smith-intro"><span class="smith-icon">⚒</span><div><strong>Lò rèn Rừng Trúc</strong><p>Xem trước chi phí, tỷ lệ và chỉ số trước khi rèn. Thất bại giữ nguyên cấp; tối đa +10.</p></div></div>
      <div class="resource-hint"><span>Chi phí hiện tại phụ thuộc cấp cường hóa</span><b>${player.refiningStones} đá · ${player.gold} bạc</b></div>
      <div class="item-list smith-list">${equipment}</div>
    `;
    return;
  }
  if (activeTab === "skills") {
    const sect = playerSect(player);
    const skillRows = SKILL_KEYS.map(key => ({ key, ...sect.kit[key] }));

    inventoryContent.innerHTML = `
      <div class="skill-points-card"><span class="skill-points-icon">✦</span><div><strong>${player.skillPoints} điểm võ học</strong><p>Mỗi lần lên cấp nhận 1 điểm. Tối đa bậc 20.</p></div><button class="mini-button" data-show-skill-art>Xem chiêu</button></div>
      <div class="skill-list">${skillRows
        .map((skill) => {
          const rank = player.skillRanks[skill.key] ?? 0;
          const unlocked = player.level >= skill.unlock;
          return `<div class="skill-row ${unlocked ? "" : "locked-row"}"><div class="skill-row-icon">${skillGlyphMarkup(skill.key, sect.id)}</div><div class="skill-row-copy"><strong>${escapeHtml(skill.name)}</strong><span class="skill-range">${skillReachLabel(skill)}</span><span>${skill.description} · ${formatNumber(toCombat(skill.mp))} MP · Hồi ${skill.cooldown}s</span><small>${unlocked ? `Bậc ${rank}/20 · Mở từ cấp ${skill.unlock}` : `Mở ở cấp ${skill.unlock}`}</small></div><button class="mini-button skill-upgrade" data-skill-rank="${skill.key}" ${!unlocked || rank >= 20 || player.skillPoints < 1 ? "disabled" : ""}>${rank >= 20 ? "TỐI ĐA" : "NÂNG +1"}</button><button class="mini-button skill-refund" data-refund-skill="${skill.key}" ${rank <= 1 ? "disabled" : ""} aria-label="Rút một điểm ${escapeHtml(skill.name)}">−</button>${pointControls("skill", skill.key, Math.min(player.skillPoints, 20 - rank), unlocked && rank < 20 && player.skillPoints > 0)}</div>`;
        })
        .join("")}</div>
    `;
    inventoryContent.insertAdjacentHTML("afterbegin", `<button class="outline-button point-suggest" data-recommend-points="skills" ${player.skillPoints < 1 ? "disabled" : ""}>Đề xuất cộng võ học · ${player.skillPoints} điểm</button>`);
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
        <div class="dungeon-state cleared"><span class="dungeon-glyph">✓</span><strong>${dungeon.name} hoàn thành</strong><p>Nhận thưởng để trở về vị trí trước khi vào bí cảnh. Tất cả đồ chưa nhặt sẽ được thu hồi; túi đầy sẽ chuyển vào Đồ chờ nhận.</p><button class="outline-button dungeon-btn" data-dungeon-action="claim">Nhận thưởng phụ bản</button></div>
      `
        : `
        <div class="dungeon-state"><span class="dungeon-glyph">◇</span><strong>${dungeon.name}</strong><p>Đợt ${game.dungeonWave + 1}/${dungeon.waves.length} · Còn ${game.enemies.filter((enemy) => !enemy.dead).length} quái.<br>${dungeon.mechanic}</p><div class="dungeon-timer">${minutes}:${seconds}</div><p>Ngã xuống, hết giờ hoặc rời sớm: không nhận thưởng hoàn thành.</p><button class="outline-button dungeon-btn" data-dungeon-action="leave">Rời phụ bản</button></div>
      `;
    } else {
      inventoryContent.innerHTML = `<p class="panel-notice">12 bí cảnh · Cấp 3–155 · Chuẩn bị bình tại Tiệm. Phần thưởng cấp một lần cho mỗi lượt hoàn thành, chưa có giới hạn ngày ở bản local.</p>${Object.values(
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
          return `<div class="dungeon-card" data-dungeon-card="${dungeon.id}"><div class="dungeon-art-line">${regionThumbnail(dungeon.region)}${monsterMarkup(dungeon.waves.at(-1)![0].species ?? (dungeon.id === "tomb" ? "tombgeneral" : "alpha"))}</div><strong>${dungeon.name}</strong><small>Solo · Cấp ${dungeon.minLevel}+ · ${Math.ceil(dungeon.timeLimit / 60)} phút · ${dungeon.waves.length} đợt · ${dungeon.waves.flat().filter(e=>e.kind==="boss").length} boss · Đã vượt ${player.dungeonClears[dungeon.id]} lần</small><p>${dungeon.description}</p><div class="dungeon-reward-line"><b>+${dungeon.reward.xp} XP · +${dungeon.reward.gold} bạc · +${dungeon.reward.tokens} token · +${dungeon.reward.stones} đá · <span style="color:${RARITY_COLORS[dungeon.reward.rarity]}">${dungeon.reward.itemCount} đồ ${dungeon.reward.rarity} cấp ${dungeon.reward.itemLevel}</span></b></div><button class="outline-button dungeon-btn" data-dungeon-action="enter" data-dungeon-id="${dungeon.id}" ${unlocked && game!.mapMode === "world" ? "" : "disabled"}>${game!.mapMode !== "world" ? "Rời trận hiện tại trước" : unlocked ? "Vào phụ bản" : condition}</button></div>`;
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
    <div class="bag-summary"><span>◆ <b>${formatNumber(player.gold)}</b> bạc</span><span>✦ <b>${formatNumber(player.refiningStones)}</b> đá</span><strong>${player.inventory.length}/${BAG_CAPACITY} ô</strong></div>
    <div class="bag-tools"><button class="mini-button" data-auto-equip>Mặc đồ mạnh nhất</button><button class="mini-button" data-open-sets>Bộ ngũ hành</button><button class="mini-button" data-open-gear-gallery>Mẫu trang bị</button><button class="mini-button" data-open-loot-settings>Lọc nhặt · Tự vứt</button><button class="mini-button" data-discard-filter>Vứt đồ theo lọc</button><button class="mini-button" data-save-progress>Lưu</button><button class="mini-button" data-load-progress>Tải</button><button class="mini-button" data-open-shop>Tiệm</button></div>
    <div class="bag-grid">${Array.from({ length: BAG_CAPACITY }, (_, index) => {
      const item = player.inventory[index];
      return `<button class="bag-slot" ${item ? `data-inspect-item="${escapeHtml(item.id)}" style="--rarity-color:${item.color}" aria-label="${escapeHtml(item.name)}"` : 'disabled aria-label="Ô trống"'}>${item ? `${itemArt(item)}<small>${item.level}</small>${item.enhance ? `<b>+${item.enhance}</b>` : ""}` : ""}</button>`;
    }).join("")}</div>
    ${supplyMarkup()}
    ${player.pendingItems.length ? `<div class="pending-rewards"><strong>Đồ chờ nhận · ${player.pendingItems.length} món</strong><p>Thưởng đã giữ lại, kể cả khi tải lại trang.</p><button class="outline-button" data-collect-pending ${player.inventory.length >= BAG_CAPACITY ? "disabled" : ""}>Nhận vào túi</button></div>` : ""}
    <div class="equipped-label bag-label">TRANG BỊ TRONG TÚI</div>
    <div class="item-list">${bag || `<div class="empty-state">Hạ quái để tìm trang bị rơi dưới đất.</div>`}</div>
    <details class="equipped-block equipped-summary"><summary>Trang bị đang mặc</summary>${equipped}</details>
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
function regionCards(): string {
  if (!game) return "";
  const { idle: progress, level } = game.player;
  const blocked = game.mapMode !== "world" || Boolean(game.goldenEncounter);
  const current = stageInfo(progress.stage).region;
  return REGIONS.map((name, index) => {
    const start = index * 10 + 1, unlocked = canEnterStage(progress, start, level);
    const active = progress.enabled && !progress.inTown && index === current;
    const status = blocked ? "Rời trận trước" : !unlocked ? `Cần cấp ${start}` : active ? "Đang luyện · Vào lại ›" : "Vào map ›";
    return `<button class="region-row ${active ? "current" : ""} ${unlocked ? "unlocked" : ""}" data-region="${index}" ${unlocked && !blocked ? "" : "disabled"} aria-label="${name} · Quái cấp ${start}–${start + 9} · ${status}">${regionThumbnail(index)}<b>${name}<small>Quái cấp ${start}–${start + 9}</small><em>${REGION_SCENES[index].detail}</em></b><span>${status}</span></button>`;
  }).join("");
}
function openTravelMap(): void {
  if (!game) return;
  const { player } = game, blocked = game.mapMode !== "world" || Boolean(game.goldenEncounter);
  const options = Array.from({ length: MAX_STAGE }, (_, i) => i + 1).filter(stage => canEnterStage(player.idle, stage, player.level));
  openUtility("Bản đồ · Du ngoạn giang hồ", `<p class="dim">Nhân vật cấp ${player.level}. Chạm vùng để đến ngay; đủ cấp quái hoặc đã mở ải đều được đi. ${blocked ? "Hãy rời boss/phụ bản/công thành trước khi chuyển map." : ""}</p><button class="outline-button" data-open-exploration>Khám phá bản đồ lớn · 4 khu vực/map</button><div class="travel-stage-row"><label>Chọn ải<select id="travel-stage">${options.map(stage => `<option value="${stage}" ${stage === player.idle.stage ? "selected" : ""}>${stageInfo(stage).name} · Cấp ${stage}</option>`).join("")}</select></label><button id="travel-stage-go" class="mini-button" ${blocked ? "disabled" : ""}>Đến ải</button></div><div class="region-list travel-atlas">${regionCards()}</div>`);
}
const trainingArts = new Map<string, HTMLCanvasElement>();
function trainingArt(stage: number): HTMLCanvasElement {
  const region = stageInfo(stage).region;
  const key = `${region}:${trainingArtRevision}`;
  if (!trainingArts.has(key))
    trainingArts.set(
      key,
      createTrainingArt(region, WORLD_WIDTH, WORLD_HEIGHT),
    );
  const result = trainingArts.get(key)!;
  // Two full-resolution arenas bound memory; atlas completion changes the cache key.
  if (trainingArts.size > 2) trainingArts.delete(trainingArts.keys().next().value!);
  return result;
}
function prepareIdleWave(resetPosition = true): void {
  if (!game || !game.player.idle.enabled || game.goldenEncounter || exploring()) return;
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
    enemy.monsterId = monsterForStage(info.region, progress.wave * 2 + index, bossWave);
    enemy.name = `${MONSTERS[enemy.monsterId].name}${kind === "elite" ? " · Tinh anh" : ""}`;
    enemy.element = info.element;
    return enemy;
  });
  game.worldEnemies = game.enemies;
  canvasBadge.textContent = `${info.name.toLocaleUpperCase("vi")} · ẢI ${info.localStage}${bossWave ? " · TRÙM" : ""}`;
}
function discardAutomaticLoot(): number {
  if (!game) return 0;
  const items = autoDiscardItems(game.player, game.player.lootSettings);
  if (items.length) addLog(`Tự vứt ${items.length} món theo bộ lọc · không nhận bạc.`);
  return items.length;
}
function collectIdleLoot(force = false, recover = force): void {
  if (!game || !game.loot.length) return;
  const ready = game.loot.filter(
    (loot) => (force || nowMs() - (loot.bornAt ?? 0) >= 1600) && (recover || !loot.item || acceptsLoot(loot.item, game!.player.lootSettings) || loot.gold > 0 || loot.stones > 0),
  );
  if (!ready.length) return;
  const items: Item[] = [], ids = new Set<string>();
  for (const loot of ready) {
    game.player.gold += loot.gold;
    game.player.refiningStones += loot.stones;
    if (loot.item && !recover && !acceptsLoot(loot.item, game.player.lootSettings)) {
      if (loot.gold || loot.stones) animatePickup({ ...loot, item: undefined });
      loot.gold = 0; loot.stones = 0;
      continue;
    }
    if (loot.item) { items.push(loot.item); notifyLoot(loot.item); }
    animatePickup(loot); ids.add(loot.id);
  }
  game.loot = game.loot.filter((loot) => !ids.has(loot.id));
  storeRewardItems(game.player, items);
  if (game.player.idle.autoEquip) autoEquipBest();
  discardAutomaticLoot();
  persistGame();
}
function autoEquipBest(): number {
  if (!game) return 0;
  const changed = equipBestGear(game.player, factionOf(game.player.factionId).element);
  syncStats();
  return changed;
}

function gearStatsMarkup(item: Item, current?: Item): string {
  const stats = gearStats(item), old = current ? gearStats(current) : null;
  return `<div class="gear-stat-lines">${(Object.keys(STAT_LABELS) as GearStat[]).filter(key => stats[key] || old?.[key]).map(key => {
    const diff = stats[key] - (old?.[key] ?? 0);
    return `<span><small>${STAT_LABELS[key]}</small><b>+${formatNumber(displayedStat(key, stats[key]))}${statUnit(key)}</b>${old ? `<em class="${diff < 0 ? "weaker" : ""}">${diff > 0 ? "+" : ""}${formatNumber(displayedStat(key, diff))}${statUnit(key)}</em>` : ""}</span>`;
  }).join("")}</div>`;
}
let discardPreview: { filter: DiscardFilter; ids: Set<string> } | null = null;
function openDiscardFilter(): void {
  if (!game) return;
  discardPreview = null;
  openUtility("Vứt đồ theo bộ lọc", `<p class="dim">Chỉ lọc đồ trong túi. Luôn giữ đồ đang mặc, đồ bộ, đồ từ Hoàng Kim trở lên, đồ đã cường hóa và Đồ chờ nhận.</p><div class="card"><label class="form-row">Phẩm chất tối đa<select id="discard-rarity">${RARITIES.slice(0, 4).map((name, index) => `<option value="${index}" ${index === 1 ? "selected" : ""}>${name}</option>`).join("")}</select></label><label class="form-row">Cấp trang bị tối đa<input id="discard-level" type="number" min="1" max="160" value="${game.player.level}"></label><label class="discard-check"><input id="discard-weaker" type="checkbox" checked> Chỉ vứt đồ yếu hơn hoặc bằng món đang mặc</label></div><button id="preview-discard" class="outline-button">Xem đồ sẽ vứt</button><div id="discard-preview" aria-live="polite"></div>`);
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
  document.getElementById("golden-boss-btn")!.textContent = encounter ? (game.enemies.every(enemy => enemy.dead) ? "Thu hồi đồ" : "Đang đấu") : status.active && !status.defeated ? "Khiêu chiến" : "Lịch boss";
  const dialog = document.getElementById("golden-dialog-status");
  if (dialog) {
    dialog.textContent = message;
    const enter = document.querySelector<HTMLButtonElement>("#golden-enter")!;
    enter.disabled = !status.active || status.defeated || Boolean(encounter) || game.player.level < 5 || game.mapMode !== "world";
    enter.textContent = game.player.level < 5 ? "Cần cấp 5" : game.mapMode !== "world" ? "Hãy rời trận hiện tại" : status.defeated ? "Đã nhận thưởng lượt này" : !status.active ? "Chưa đến giờ xuất hiện" : "Khiêu chiến";
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
  game.player.journey.kills++; game.player.journey.bosses++;
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
  if (!game.enemies.some(enemy => !enemy.rogueUntil) || game.enemies.some((enemy) => !enemy.dead && !enemy.rogueUntil)) {
    idleNextWave = 0;
    return;
  }
  if (!idleNextWave) {
    idleNextWave = now + 2200;
    return;
  }
  if (now < idleNextWave) return;
  if (game.player.idle.autoLoot) collectIdleLoot(true, false);
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
  document.querySelector(".app-shell")!.classList.remove("arena-expanded", "activities-open");
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
      if (button.dataset.idleTab === "log") button.setAttribute("aria-expanded", "false");
    });
  if (tab === "skill") activeTab = "skills";
  if (tab === "inv" && activeTab === "skills") activeTab = "bag";
  if (tab === "more") hydrateSettings();
  refreshUi(true);
}
function refreshArenaObjective(): void {
  if (!game) return;
  let goal = game.player.questRewardClaimed ? "Dấu chân hoàn tất" : "Hạ 5 sơn tặc và Lang Vương";
  let done = Math.min(5, game.player.questKills) + Number(game.player.bossDefeated), total = 6;
  const enemies = game.enemies.filter(enemy => !enemy.wildElite);
  if (game.goldenEncounter) { goal = `Hạ ${game.goldenEncounter.window.boss.name}`; done = enemies.filter(e => e.dead).length; total = Math.max(1, enemies.length); }
  else if (game.towerEncounter) { goal = `Vượt tháp tầng ${game.towerEncounter.floor} · Đợt ${game.towerEncounter.wave + 1}/2`; done = enemies.filter(e => e.dead).length; total = Math.max(1, enemies.length); }
  else if (game.territoryEncounter) { goal = game.territoryEncounter.siege ? `${SIEGE_PHASES[game.territoryEncounter.wave]} · ${territoryOf(game.territoryEncounter.id)!.name}` : `Chiếm ${territoryOf(game.territoryEncounter.id)!.name} · Đợt ${game.territoryEncounter.wave + 1}/3`; done = enemies.filter(e => e.dead).length; total = Math.max(1, enemies.length); }
  else if (game.mapMode === "dungeon") { goal = game.dungeonCleared ? "Phụ bản đã hoàn thành" : `Đợt ${game.dungeonWave + 1} · ${DUNGEONS[game.dungeonId!].shortName}`; done = enemies.filter(e => e.dead).length; total = Math.max(1, enemies.length); }
  else if (game.player.idle.enabled) { goal = game.player.idle.inTown ? "Về ải để luyện công" : `Hạ quái ${stageInfo(game.player.idle.stage).name}`; done = enemies.filter(e => e.dead).length; total = Math.max(1, enemies.length); }
  document.getElementById("arena-objective")!.textContent = goal;
  document.getElementById("arena-objective-count")!.textContent = game.player.idle.inTown && !game.goldenEncounter && game.mapMode === "world" ? "Nghỉ ngơi" : `${done}/${total}`;
  document.getElementById("arena-objective-bar")!.style.width = `${Math.min(100, done / total * 100)}%`;
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
  const battleStatus = document.querySelector(".territory-battle-status");
  if (battleStatus && game.towerEncounter) battleStatus.textContent = `Tầng ${game.towerEncounter.floor} · Đợt ${game.towerEncounter.wave + 1}/2 · ${Math.ceil(game.towerEncounter.timeLeft)} giây còn lại`;
  if (battleStatus && game.territoryEncounter) battleStatus.textContent = `Đang công ${territoryOf(game.territoryEncounter.id)!.name} · Đợt ${game.territoryEncounter.wave + 1}/3 · ${Math.ceil(game.territoryEncounter.timeLeft)} giây còn lại`;
  text(
    "idle-stage-label",
    game.towerEncounter ? `Leo tháp tầng ${game.towerEncounter.floor}` : game.territoryEncounter ? `Công ${territoryOf(game.territoryEncounter.id)!.name}` : game.mapMode === "dungeon"
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
  text("town-btn", game.towerEncounter ? "Rời\ntháp" : game.territoryEncounter ? "Rút\nquân" : game.goldenEncounter ? "Rời\nboss" : progress.inTown ? "Trở lại\nải" : "Về\nthành");
  document
    .querySelector<HTMLButtonElement>("#stage-push")!
    .setAttribute("aria-pressed", String(progress.push));
  document
    .querySelector<HTMLButtonElement>("#rotation-btn")!
    .setAttribute("aria-pressed", String(progress.autoSkills));
  document.querySelector<HTMLButtonElement>("#stage-prev")!.disabled =
    progress.stage <= 1 || game.mapMode !== "world" || Boolean(game.goldenEncounter);
  document.querySelector<HTMLButtonElement>("#stage-next")!.disabled =
    !canEnterStage(progress, progress.stage + 1, player.level) || game.mapMode !== "world" || Boolean(game.goldenEncounter);
  document.querySelector<HTMLButtonElement>("#stage-push")!.disabled = Boolean(game.goldenEncounter) || game.mapMode !== "world";
  document
    .querySelector(".quest-panel")!
    .classList.toggle("hidden", progress.enabled);
  document
    .getElementById("legacy-training")!
    .classList.toggle("hidden", progress.enabled || game.mapMode !== "world");
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
  const title = wornTitle(player.journey);
  text("worn-title-label", title?.name ?? "Chưa đeo danh hiệu");
  const wornTitleLabel = document.getElementById("worn-title-label")!;
  wornTitleLabel.style.color = title?.color ?? "";
  wornTitleLabel.dataset.prestigeTier = String(title?.rarity ?? 1);
  wornTitleLabel.style.setProperty("--prestige-color", title?.color ?? "#c0cbb7");
  text("title-count", `Đã mở ${player.journey.unlockedTitles.length}/${TITLES.length} · Chỉ cộng danh hiệu đang đeo`);
  text("rebirth-label", `Trùng sinh ${player.journey.rebirths} lần`);
  text("rebirth-status", player.level === MAX_LEVEL ? "Đã đủ cấp · Về cấp 1, nhận chỉ số vĩnh viễn" : `Cần cấp ${MAX_LEVEL} · Hiện tại ${player.level}`);
  text("xp-buff-status", `Đang dùng x${player.preferences.xpMultiplier} XP${player.level === MAX_LEVEL ? " · Cấp đã tối đa" : ""}`);
  document.querySelector<HTMLSelectElement>("#xp-multiplier")!.disabled = game.mapMode !== "world";
  document.querySelector<HTMLSelectElement>("#skill-effects-quality")!.disabled = game.mapMode !== "world";
  document.querySelectorAll<HTMLInputElement>("[data-preference]").forEach(input => input.disabled = game!.mapMode !== "world");
  document.querySelector(".mobile-map-card")!.classList.toggle("hidden", !player.preferences.minimap);
  refreshArenaObjective();
  refreshHuntUi();
  refreshMountUi();
  refreshSetUi();
  text("preview-player-name", player.name);
  const equippedRank = militaryRankOf(player.military.equipped);
  for (const [id, value, style] of [
    ["preview-military-rank", equippedRank ? `Ấn · ${equippedRank.name}` : "", equippedRank ? militaryStyle(equippedRank.id) : undefined],
    ["preview-title-label", title && player.preferences.titleVisible ? `${title.glyph} ${title.name}` : "", title ? titleStyle(title) : undefined],
    ["preview-player-realm", cultivation.label, realmStyle(cultivation)],
  ] as const) {
    const label = document.getElementById(id)!;
    label.textContent = value; label.classList.toggle("hidden", !value);
    label.dataset.prestigeTier = String(style?.tier ?? 1);
    label.style.setProperty("--prestige-color", style?.color ?? "#e9dba5");
    label.style.setProperty("--prestige-font", `${style?.fontSize ?? 16}px`);
    label.style.setProperty("--prestige-glow", `${style?.glow ?? 0}px`);
  }
  document.getElementById("preview-player-realm")!.style.color =
    cultivation.realm.color;
  document
    .getElementById("character-preview")!
    .setAttribute(
      "aria-label",
      `${player.name} · ${cultivation.label}. Nhân vật đứng trên đài tu luyện, trang bị ở hai bên.`,
    );
  text(
    "profile-hp-label",
    `HP: ${formatNumber(player.hp)}/${formatNumber(player.maxHp)}`,
  );
  text(
    "profile-mp-label",
    `MP: ${formatNumber(player.mp)}/${formatNumber(player.maxMp)}`,
  );
  document.getElementById("profile-hp-bar")!.style.width =
    `${(player.hp / player.maxHp) * 100}%`;
  document.getElementById("profile-mp-bar")!.style.width =
    `${(player.mp / player.maxMp) * 100}%`;
  text("combat-power", formatNumber(cultivation.power));
  text("header-combat-power", `⚔ ${compactNumber(cultivation.power)}`);
  document.getElementById("header-combat-power")!.title = `Lực chiến ${formatNumber(cultivation.power)}`;
  refreshGoldenUi();
  text("realm-name", cultivation.realm.name);
  text("realm-phase", cultivation.phase);
  text(
    "realm-plane",
    `${cultivation.rank < 11 ? "Phàm giới" : "Tiên giới"} · Bậc ${cultivation.rank + 1}/${REALMS.length}`,
  );
  text(
    "realm-next",
    cultivation.nextPower === null
      ? `Đã đạt ${cultivation.label}`
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
  const regionKey = `${progress.stage}:${progress.maxStage}:${player.level}:${progress.inTown}:${progress.enabled}:${game.mapMode}:${Boolean(game.goldenEncounter)}`;
  if (regionRenderKey !== regionKey) {
    regionRenderKey = regionKey;
    document.getElementById("region-list")!.innerHTML = regionCards();
  }
  const characterKey = JSON.stringify([
    progress.attributePoints,
    progress.attributes,
    player.equipment,
    player.level,
    player.military.equipped,
  ]);
  if (characterRenderKey !== characterKey) {
    characterRenderKey = characterKey;
    text("attribute-points", `${progress.attributePoints} điểm`);
    document.getElementById("equipment-grid")!.innerHTML = (
      Object.keys(GEAR_SLOTS) as ItemSlot[]
    )
      .map((slot) => {
        const item = player.equipment[slot];
        const left: ItemSlot[] = [
          "weapon",
          "helmet",
          "armor",
          "belt",
          "boots",
          "horse",
        ];
        const right: ItemSlot[] = [
          "necklace",
          "bracelet",
          "ring",
          "ring2",
          "pendant",
        ];
        const side = left.includes(slot) ? left : right;
        return `<button class="equipment-slot ${item ? "equipped" : "empty-slot"}" data-equipped-preview="${slot}" style="--rarity-color:${item?.color ?? "#8a754b"};grid-column:${side === left ? 1 : 3};grid-row:${side.indexOf(slot) + 1}" ${item ? "" : "disabled"} title="${GEAR_SLOTS[slot].name}${item ? `: ${escapeHtml(item.name)}` : ": trống"}" aria-label="${GEAR_SLOTS[slot].name}${item ? `: ${escapeHtml(item.name)}, cường hóa +${item.enhance}` : ": trống"}">${equipmentMarkup(slot, item?.color ?? "#8a754b", item?.rarity, "equipment-icon", item)}<small>${GEAR_SLOTS[slot].name}</small>${item?.enhance ? `<b>+${item.enhance}</b>` : ""}</button>`;
      })
      .join("");
    document.getElementById("attribute-list")!.innerHTML = (
      Object.keys(ATTRIBUTES) as Attribute[]
    )
      .map(
        (key) =>
          `<div class="attribute-row"><span>${ATTRIBUTES[key].name}<small>${ATTRIBUTES[key].description}</small></span><b>${progress.attributes[key]}</b><button class="attribute-button" data-attribute="${key}" data-delta="1" ${progress.attributePoints > 0 ? "" : "disabled"} aria-label="Tăng ${ATTRIBUTES[key].name}">+</button><button class="attribute-button" data-attribute="${key}" data-delta="-1" ${progress.attributes[key] > 0 ? "" : "disabled"} aria-label="Rút điểm ${ATTRIBUTES[key].name}">−</button>${pointControls("attribute", key, Math.min(progress.attributePoints, 100000 - progress.attributes[key]), progress.attributePoints > 0 && progress.attributes[key] < 100000)}</div>`,
      )
      .join("");
    const rank = militaryRankOf(player.military.equipped);
    document.getElementById("equipment-grid")!.insertAdjacentHTML("beforeend", `<button id="military-seal-slot" class="equipment-slot military-seal-slot ${rank ? "equipped" : "empty-slot"}" data-open-military style="--rarity-color:${rank?.color ?? "#8a754b"};grid-column:3;grid-row:6" title="Ấn quân hàm: ${rank?.name ?? "trống"}" aria-label="Ấn quân hàm: ${rank?.name ?? "trống"}">${militarySealMarkup(player.military.equipped)}<small>${rank?.name ?? "Ấn quân hàm"}</small></button>`);
  }
}
function hydrateSettings(): void {
  if (!game) return;
  document.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-loot-setting]").forEach(input => {
    const value = game!.player.lootSettings[input.dataset.lootSetting as keyof LootSettings];
    if (input instanceof HTMLInputElement && input.type === "checkbox") input.checked = value === true;
    else input.value = String(value);
    input.disabled = game!.mapMode !== "world" || Boolean(game!.goldenEncounter);
  });
  document.querySelector<HTMLInputElement>("#settings-name")!.value =
    game.player.name;
  document.querySelector<HTMLSelectElement>("#settings-sex")!.value =
    game.player.sex;
  document.querySelector<HTMLSelectElement>("#game-speed")!.value = String(
    game.player.idle.speed,
  );
  document.querySelector<HTMLSelectElement>("#xp-multiplier")!.value = String(game.player.preferences.xpMultiplier);
  document.querySelector<HTMLSelectElement>("#skill-effects-quality")!.value = game.player.preferences.skillEffects;
  document.querySelectorAll<HTMLInputElement>("[data-preference]").forEach(input => input.checked = game!.player.preferences[input.dataset.preference as keyof GamePreferences] === true);
  document
    .querySelectorAll<HTMLInputElement>("[data-setting]")
    .forEach((input) => {
      input.checked = Boolean(
        game!.player.idle[input.dataset.setting as keyof IdleProgress],
      );
    });
}
function updateTitles(): void {
  if (!game) return;
  const unlocked = unlockTitles(game.player);
  if (unlocked.length) addLog(`Mở danh hiệu: ${unlocked.slice(0, 3).map(title => title.name).join(", ")}${unlocked.length > 3 ? ` và ${unlocked.length - 3} danh hiệu khác` : ""}. Xem tại Nhân vật → Danh hiệu.`);
}
function bonusText(bonus: Partial<GearStats>): string {
  return (Object.keys(STAT_LABELS) as GearStat[]).filter(key => bonus[key]).map(key => `+${formatNumber(bonus[key]!)}${statUnit(key)} ${STAT_LABELS[key]}`).join(" · ");
}
let previewTitleId = "";
function openTitles(preview = game?.player.journey.activeTitle ?? ""): void {
  if (!game) return;
  const scrollTop = document.querySelector(".title-list")?.scrollTop ?? 0;
  updateTitles();
  previewTitleId = TITLES.some(title => title.id === preview) ? preview : "novice";
  const shown = TITLES.find(title => title.id === previewTitleId)!;
  openUtility("Danh hiệu giang hồ", `<div class="title-preview" data-prestige-tier="${shown.rarity}" style="--title-color:${shown.color};--prestige-color:${shown.color}"><canvas id="title-effect-preview" width="260" height="120" aria-label="${shown.effect}"></canvas><b>${shown.glyph} ${shown.name}</b><small>${TITLE_RARITIES[shown.rarity]} · ${shown.effect} · ${bonusText(shown.bonuses)}</small></div><p class="dim">Đeo một danh hiệu để nhận chỉ số và hiệu ứng. Danh hiệu đã mở được giữ sau trùng sinh. Có thể tắt tên/hiệu ứng trong Cài đặt.</p><button id="remove-title" class="mini-button" ${!game.player.journey.activeTitle || game.mapMode !== "world" ? "disabled" : ""}>Tháo danh hiệu</button><div class="title-list">${TITLES.map(title => {
    const owned = game!.player.journey.unlockedTitles.includes(title.id), active = game!.player.journey.activeTitle === title.id;
    const current = Math.min(title.target, titleProgress(title, game!.player));
    return `<div class="title-card ${active ? "worn" : ""}" data-prestige-tier="${title.rarity}" style="--title-color:${title.color};--prestige-color:${title.color}"><button class="title-name" data-preview-title="${title.id}" aria-pressed="${previewTitleId === title.id}"><span>${title.glyph}</span><b>${title.name}</b></button><small>${TITLE_RARITIES[title.rarity]} · ${title.requirement} · ${owned ? "Đã mở" : `${formatNumber(current)}/${title.target}`}</small><p>${bonusText(title.bonuses)}</p><small>${title.effect}</small><button class="mini-button" data-wear-title="${title.id}" ${!owned || active || game!.mapMode !== "world" ? "disabled" : ""}>${active ? "Đang đeo" : owned ? "Đeo danh hiệu" : "Chưa mở"}</button></div>`;
  }).join("")}</div>${game.mapMode !== "world" ? '<p class="dim">Rời phụ bản trước khi đổi danh hiệu.</p>' : ""}`, "titles");
  document.querySelector(".title-list")!.scrollTop = scrollTop;
}
function wearTitle(id: string): void {
  if (!game || game.mapMode !== "world") return;
  updateTitles();
  if (id && !game.player.journey.unlockedTitles.includes(id)) return;
  game.player.journey.activeTitle = id;
  syncStats(); persistGame(); refreshUi(true); openTitles(id);
}
function rebirthBlocked(): string {
  if (!game) return "Hãy chọn môn phái trước.";
  if (game.mapMode !== "world") return "Rời trận hiện tại trước khi trùng sinh.";
  if (game.goldenEncounter) return "Rời boss Hoàng Kim trước khi trùng sinh.";
  if (game.player.level !== MAX_LEVEL) return `Cần đạt cấp ${MAX_LEVEL}.`;
  if (game.player.journey.rebirths >= 1e6) return "Đã đạt giới hạn trùng sinh.";
  return "";
}
function openRebirth(): void {
  if (!game) return;
  const count = game.player.journey.rebirths, before = rebirthBonuses(count), after = rebirthBonuses(count + 1), reason = rebirthBlocked();
  openUtility("Trùng sinh", `<p>Đã trùng sinh <b>${count}</b> lần · Cấp hiện tại <b>${game.player.level}/${MAX_LEVEL}</b>.</p><p class="dim">Trùng sinh về cấp 1 và XP 0, trở lại thành tại ải 1. Chỉ số theo cấp được tính lại từ cấp 1; nhận thêm chỉ số vĩnh viễn bên dưới. Giữ trang bị/cường hóa, đồ chờ nhận, bạc, đá, võ học, điểm tiềm năng, danh hiệu và các ải đã mở. Võ công vẫn cần cấp 3/5 để dùng lại.</p><table class="enhancement-table"><thead><tr><th>Vĩnh viễn</th><th>Hiện tại</th><th>Sau lần ${count + 1}</th><th>Thêm</th></tr></thead><tbody>${(Object.keys(REBIRTH_BONUS) as GearStat[]).filter(key => REBIRTH_BONUS[key]).map(key => `<tr><td>${STAT_LABELS[key]}</td><td>+${formatNumber(before[key])}</td><td>+${formatNumber(after[key])}</td><td>+${REBIRTH_BONUS[key]}</td></tr>`).join("")}</tbody></table><p class="dim">Tự sao lưu trước khi thực hiện. Trang bị dưới đất được thu hồi về túi/Đồ chờ nhận. XP dư ở cấp tối đa không được tích sang lần sau.</p>${reason ? `<p class="dim" id="rebirth-blocked">${reason}</p>` : ""}<div class="btnrow"><button id="confirm-rebirth" data-rebirth-count="${count}" class="outline-button" ${reason ? "disabled" : ""}>Xác nhận trùng sinh lần ${count + 1}</button><button id="cancel-rebirth" class="mini-button">Hủy</button></div>`);
}
function confirmRebirth(expected: number): void {
  if (!game) return;
  const reason = rebirthBlocked();
  if (reason) return showToast(reason);
  if (game.player.journey.rebirths !== expected) return openRebirth();
  if (!persistGame()) return;
  try {
    const previous = localStorage.getItem(SAVE_KEY);
    if (!previous) throw new Error("backup-missing");
    localStorage.setItem(`${SAVE_KEY}-backup`, previous);
  } catch { showToast("Không tạo được bản sao lưu. Trùng sinh chưa được thực hiện."); return; }
  collectIdleLoot(true);
  const sect = playerSect(game.player);
  if (!rebirthCharacter(game.player, { attack: sect.baseAttack, defense: sect.baseDefense })) return;
  const player = game.player;
  player.exploration.active = false;
  player.idle.stage = 1; player.idle.wave = 1; player.idle.inTown = true; player.idle.enabled = true;
  player.rage = 0; player.shield = 0; player.shieldUntil = 0; player.attackCooldown = 0;
  player.cooldowns = { skill1: 0, skill2: 0, ultimate: 0 }; player.potionCooldown = 0;
  player.x = PLAYER_START.x; player.y = PLAYER_START.y;
  game.autoBattle = false; game.targetId = null; game.moveTarget = null;
  game.enemies = []; game.worldEnemies = []; game.loot = []; game.worldLoot = []; game.campfires = [];
  game.effects = []; game.zones = []; game.telegraphs = []; game.floatingTexts = []; game.combat = freshCombat();
  idleNextWave = 0; pendingSaleId = null; resetJoystick(); keys.clear();
  updateTitles(); syncStats(true);
  if (!persistGame()) { loadGame(); showToast("Không lưu được trùng sinh. Đã trở lại tiến trình trước đó."); return; }
  closeUtility(); showIdlePage("char"); hydrateSettings();
  addLog(`Trùng sinh lần ${player.journey.rebirths} thành công! ${bonusText(REBIRTH_BONUS)} vĩnh viễn.`);
  refreshUi(true);
}
function drawTitlePreview(now: number): void {
  const preview = document.querySelector<HTMLCanvasElement>("#title-effect-preview");
  const title = TITLES.find(title => title.id === previewTitleId);
  if (!preview || !title || document.getElementById("utility-overlay")!.classList.contains("hidden")) return;
  const context = preview.getContext("2d")!;
  context.clearRect(0, 0, preview.width, preview.height); context.save(); context.translate(130, 70);
  drawTitleEffect(context, title, now, game?.player.preferences.skillEffects === "simple");
  context.fillStyle = title.color; context.font = "24px Georgia"; context.textAlign = "center"; context.fillText(title.glyph, 0, 0); context.restore();
}
function openUtility(title: string, content: string, layout: "default" | "titles" = "default"): void {
  document.querySelector(".utility-dialog")!.classList.toggle("titles-dialog", layout === "titles");
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
    `<p class="dim">Phàm Nhân: dưới 100.000 lực chiến. Luyện Thể: 100.000 đến dưới 1 triệu. Đạo Tổ: từ 10 tỷ; Hỗn Nguyên: 12 tỷ; Hồng Mông: 14,5 tỷ; Vô Cực: 17,5 tỷ. Cảnh giới tự thay đổi theo lực chiến hiện tại. Luyện Thể và Luyện Khí có 9 tầng; từ Trúc Cơ có Sơ kỳ, Trung kỳ, Hậu kỳ, Đỉnh phong và Đại viên mãn. Đạt Chân Tiên là bước vào Tiên giới.</p><table class="realm-table"><thead><tr><th>Bậc</th><th>Cảnh giới</th><th>Lực chiến từ</th></tr></thead><tbody>${REALMS.map((realm, rank) => `<tr class="${rank === current.rank ? "current-realm" : ""}" ${rank === current.rank ? 'aria-current="true"' : ""}><td>${rank + 1}</td><td style="color:${realm.color}">${realm.name}</td><td>${formatNumber(realm.minPower)}</td></tr>`).join("")}</tbody></table>`,
  );
}
function showItemDetail(item: Item): void {
  if (!game) return;
  const current = game.player.equipment[item.slot];
  const diff = projectedGearPower(item, current) - currentCombatPower();
  const inBag = game.player.inventory.some(
    (candidate) => candidate.id === item.id,
  );
  const equipped = current?.id === item.id;
  const attribute = "lực chiến";
  openUtility(
    item.name,
    `<div class="item-detail">${itemArt(item, "detail-gear-art")}<b style="color:${item.color}">${item.rarity} · Cấp ${item.level} · ${equipmentGrade(item.level)} · Điểm ${formatNumber(gearScore(item))}</b><p>Cường hóa +${item.enhance} · ${GEAR_SLOTS[item.slot].name}</p><small class="gear-effect-label">${equipmentEffectLabel(item.rarity, item.enhance)}</small>${gearIdentityMarkup(item)}${gearStatsMarkup(item, current)}${item.setId ? `<button class="mini-button" data-open-set="${item.setId}">Bộ ${GEAR_SETS[item.setId].name} · ${setStatuses(Object.values(game.player.equipment)).find(set => set.id === item.setId)?.pieces ?? 0}/11 đang mặc</button>` : ""}</div><div class="item-comparison"><small>${current ? `Đang mặc: ${escapeHtml(current.name)} +${current.enhance}` : "Vị trí này đang trống"}</small><strong class="${diff < 0 ? "weaker" : ""}">${equipped ? "Đang trang bị" : `${diff >= 0 ? "+" : ""}${formatNumber(diff)} ${attribute} so với hiện tại`}</strong></div>${inBag ? `<button class="outline-button" data-inspect-equip="${escapeHtml(item.id)}">Mặc trang bị</button>` : `<p class="dim">${equipped ? "Món này đang được nhân vật sử dụng." : "Món này đã được giữ trong Đồ chờ nhận."}</p>`}${inBag || equipped ? `<button class="outline-button detail-enhance" data-detail-enhance="${escapeHtml(item.id)}">${item.enhance >= 10 ? "Đã cường hóa tối đa +10" : `Cường hóa · ${45 + item.enhance * 35} bạc + 1 đá`}</button>` : ""}`,
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
  if (game && game.mapMode !== "world")
    return showToast("Hãy hoàn thành hoặc rời trận hiện tại trước khi đổi nhân vật.");
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
  combatScaleVersion?: number;
  player: Player;
  enemies: Enemy[];
  savedAt?: number;
  groundLoot?: GroundLoot[];
  campfires?: Campfire[];
  wildElite?: SavedWildElite;
} {
  if (!value || typeof value !== "object") throw new Error("save-invalid");
  const data = value as {
      combatScaleVersion?: number;
      player: Player;
      enemies: Enemy[];
      savedAt?: number;
      groundLoot?: GroundLoot[];
      campfires?: Campfire[];
      wildElite?: SavedWildElite;
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
      player[key] > (["hp", "maxHp", "mp", "maxMp"].includes(key) ? 1e12 : 1e9)
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
  if (!validExploration(player.exploration)) throw new Error("save-invalid");
  player.exploration = normalizeExploration(player.exploration);
  const savedWidth = player.exploration.active ? EXPLORATION_WIDTH : 1900, savedHeight = player.exploration.active ? EXPLORATION_HEIGHT : 1200;
  if (player.x > savedWidth || player.y > savedHeight)
    throw new Error("save-invalid");
  if (player.mounted !== undefined && typeof player.mounted !== "boolean") throw new Error("save-invalid");
  if (!validTower(player.tower)) throw new Error("save-invalid");
  player.tower = normalizeTower(player.tower);
  if (!validMilitary(player.military)) throw new Error("save-invalid");
  player.military = normalizeMilitary(player.military);
  if (!validLuckyProgress(player.lucky) || !validBotSettings(player.botSettings) || !validSiegeProgress(player.sieges)) throw new Error("save-invalid");
  player.lucky = normalizeLuckyProgress(player.lucky);
  player.botSettings = normalizeBotSettings(player.botSettings);
  if (!validLootSettings(player.lootSettings)) throw new Error("save-invalid");
  player.lootSettings = normalizeLootSettings(player.lootSettings);
  player.sieges = normalizeSiegeProgress(player.sieges);
  player.radius = HERO_SIZE.radius;
  player.goldenClears = normalizeGoldenClears(player.goldenClears);
  player.eliteHunt = normalizeEliteHunt(player.eliteHunt);
  player.preferences = normalizePreferences(player.preferences);
  const history = normalizeIdle(player.idle);
  const clears = player.dungeonClears;
  player.journey = normalizeJourney(player.journey, { level: player.level, kills: Math.max(history.totalKills, player.questKills || 0), bosses: Math.max(history.bossKills, (player.bossDefeated ? 1 : 0) + (clears?.tomb ?? 0) + (clears?.bamboo ?? 0) + player.goldenClears.length) });
  if (player.level === MAX_LEVEL) player.xp = 0;
  if (!validCampfires(data.campfires) || !validWildElite(data.wildElite)) throw new Error("save-invalid");

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
  player.dungeonClears = normalizeDungeonClears(player.dungeonClears, player.dungeonTokens);
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
        validGearIdentity(item) &&
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
          loot.x <= savedWidth &&
          Number.isFinite(loot.y) &&
          loot.y >= 0 &&
          loot.y <= savedHeight &&
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
  player.mounted = normalizeMounted(player.mounted, player.equipment.horse);
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
  return migrateCombatScale(data);
}
function importCharacter(raw: string): void {
  if (game && game.mapMode !== "world")
    return showToast("Hãy rời trận hiện tại trước khi nạp nhân vật.");
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
  if (game.mapMode !== "world")
    return showToast("Hãy rời trận hiện tại trước khi tạo lại nhân vật.");
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
  document.getElementById("hero-sex-input")!.addEventListener("change", renderSectCards);
  document.getElementById("settings-shortcut")!.addEventListener("click", () => showIdlePage("more"));
  document.getElementById("hero-status")!.addEventListener("click", () => showIdlePage("char"));
  document.getElementById("world-panel-close")!.addEventListener("click", () => showIdlePage("log"));
  document.getElementById("arena-log-toggle")!.addEventListener("click", () => openUtility("Nhật ký giang hồ", `<div class="battle-log-history">${game ? game.logs.map(log => `<p>${escapeHtml(log)}</p>`).join("") : "Chọn môn phái để bắt đầu."}</div>`));
  document.getElementById("arena-quest-toggle")!.addEventListener("click", event => {
    const button = event.currentTarget as HTMLButtonElement;
    const open = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Thu gọn nhiệm vụ" : "Mở nhiệm vụ");
    button.querySelector("b")!.textContent = open ? "⌃" : "⌄";
    document.getElementById("arena-quest-body")!.classList.toggle("hidden", !open);
  });
  document.getElementById("gear-sets-btn")!.addEventListener("click", () => openGearSets());
  document.querySelector(".app-shell")!.addEventListener("click", event => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-open-exploration]")) openExplorationAtlas();
    if (target.closest("[data-open-bestiary]")) openBestiary();
    if (target.closest("[data-exit-exploration]")) exitExploration();
    if (target.closest("[data-open-events]")) openLuckyEvents();
    if (target.closest("[data-open-bots]")) openBots();
    if (target.closest("[data-open-siege]")) openRequestedSiege();
    const order = target.closest<HTMLElement>("[data-siege-order]")?.dataset.siegeOrder;
    if (game?.territoryEncounter?.siege && ["push", "guard", "rally"].includes(order ?? "")) { game.territoryEncounter.siege.order = order as BotOrder; refreshSiegeHud(); document.querySelectorAll("[data-siege-order]").forEach(button => button.setAttribute("aria-pressed", String((button as HTMLElement).dataset.siegeOrder === order))); }
    if (target.closest("[data-open-military]")) openMilitarySeals();
    const suggestion = target.closest<HTMLElement>("[data-recommend-points]");
    if (suggestion && (suggestion.dataset.recommendPoints === "attributes" || suggestion.dataset.recommendPoints === "skills")) openPointRecommendation(suggestion.dataset.recommendPoints);
    const attributeMax = target.closest<HTMLElement>("[data-max-attribute]");
    if (attributeMax) addAttributePoints(attributeMax.dataset.maxAttribute as Attribute, "max");
    const attributeBulk = target.closest<HTMLElement>("[data-bulk-attribute]");
    if (attributeBulk) addAttributePoints(attributeBulk.dataset.bulkAttribute as Attribute, Number(document.querySelector<HTMLInputElement>(`#attribute-count-${attributeBulk.dataset.bulkAttribute}`)?.value));
    const skillMax = target.closest<HTMLElement>("[data-max-skill]");
    if (skillMax) upgradeSkill(skillMax.dataset.maxSkill as SkillKey, "max");
    const skillBulk = target.closest<HTMLElement>("[data-bulk-skill]");
    if (skillBulk) upgradeSkill(skillBulk.dataset.bulkSkill as SkillKey, Number(document.querySelector<HTMLInputElement>(`#skill-count-${skillBulk.dataset.bulkSkill}`)?.value));
    if (target.closest("[data-open-tower]")) openTower();
    if (target.closest("[data-open-territories]")) openTerritories();
    if (target.closest("[data-mount-toggle]")) toggleMount();
    const set = target.closest<HTMLElement>("[data-open-set]");
    if (set) openGearSets(set.dataset.openSet as SetId);
    if (target.closest("[data-open-sets]")) openGearSets();
    if (target.closest("[data-open-gear-gallery]")) openEquipmentGallery();
    const shop = target.closest<HTMLElement>("[data-set-shop]");
    if (shop) openSetShop(shop.dataset.setShop as SetId | undefined);
    if (target.closest("#buy-basic-horse")) buyBasicHorse();
  });
  document.querySelector(".app-shell")!.addEventListener("input", event => {
    const input = (event.target as HTMLElement).closest<HTMLInputElement>("[data-point-input]");
    if (input) pointInputs.set(input.dataset.pointInput!, input.value);
  });
  document.getElementById("titles-btn")!.addEventListener("click", () => openTitles());
  document.getElementById("rebirth-btn")!.addEventListener("click", openRebirth);
  document
    .getElementById("character-close")!
    .addEventListener("click", () => showIdlePage("log"));
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
  document.querySelectorAll<HTMLButtonElement>("[data-idle-tab]").forEach(button => {
    button.addEventListener("click", () => {
      const shell = document.querySelector(".app-shell")!;
      const openActivities = button.dataset.idleTab === "log" && shell.getAttribute("data-page") === "log" && !shell.classList.contains("activities-open");
      showIdlePage(button.dataset.idleTab!);
      shell.classList.toggle("activities-open", openActivities);
      if (button.dataset.idleTab === "log") button.setAttribute("aria-expanded", String(openActivities));
    });
  });
  document
    .querySelectorAll<HTMLButtonElement>("[data-idle-open]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        openMobileSheet(button.dataset.idleOpen as PanelTab),
      ),
    );
  document.getElementById("compact-btn")!.addEventListener("click", (event) => {
    const shell = document.querySelector(".app-shell")!;
    const expanded = shell.classList.toggle("arena-expanded");
    if (expanded) {
      shell.classList.remove("activities-open");
      document.querySelector('[data-idle-tab="log"]')!.setAttribute("aria-expanded", "false");
    }
    (event.currentTarget as HTMLElement).setAttribute(
      "aria-pressed",
      String(expanded),
    );
    resizeGameViewport();
  });
  const changeStage = (stage: number) => {
    if (
      !game ||
      game.mapMode !== "world" ||
      game.goldenEncounter ||
      !goToStage(game.player.idle, stage, game.player.level)
    )
      return;
    if (exploring()) collectIdleLoot(true);
    game.player.exploration.active = false; syncWorldSize();
    game.player.idle.enabled = true;
    // Unclaimed loot belongs to the old arena; collect before replacing its enemies.
    collectIdleLoot(true);
    resetJoystick(); keys.clear();
    closeUtility(); showIdlePage("log");
    prepareIdleWave();
    addLog(`Đến ${stageInfo(stage).name} · Quái cấp ${stageInfo(stage).level}.`);
    persistGame();
    refreshUi(true);
  };
  document.getElementById("travel-map-btn")!.addEventListener("click", openTravelMap);
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
    if (!game || game.goldenEncounter || game.mapMode !== "world") return;
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
    if (game.mapMode !== "world")
      return showToast("Hãy hoàn thành phụ bản trước.");
    if (exploring()) collectIdleLoot(true);
    game.player.exploration.active = false; syncWorldSize();
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
    if (exploring()) { exitExploration(); return; }
    if (game?.towerEncounter) { leaveTower(); return; }
    if (game?.territoryEncounter) { leaveTerritory(); return; }
    if (game?.goldenEncounter) { leaveGoldenBoss(); return; }
    if (!game || game.mapMode !== "world")
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
      if ((event.target as HTMLElement).matches("#exploration-region")) openExplorationAtlas(Number((event.target as HTMLSelectElement).value));
      const control = event.target as HTMLSelectElement;
      if (control.id === "set-shop-id" && SET_IDS.includes(control.value as SetId)) { setShopId = control.value as SetId; selectedShopVariant = undefined; openSetShop(); }
      if (control.id === "set-shop-slot" && (EQUIPMENT_SLOTS as readonly string[]).includes(control.value)) { setShopSlot = control.value as ItemSlot; selectedShopVariant = undefined; openSetShop(); }
      if (control.id === "set-shop-variant" && variantsForSlot(setShopSlot).includes(control.value as GearVariant)) { selectedShopVariant = control.value as GearVariant; openSetShop(); }
      if (control.id === "tower-exchange-slot" && (EQUIPMENT_SLOTS as readonly string[]).includes(control.value)) { towerExchangeSlot = control.value as ItemSlot; openTowerShop(); }
      if (control.id === "gear-gallery-slot" && (EQUIPMENT_SLOTS as readonly string[]).includes(control.value)) { gallerySlot = control.value as ItemSlot; openEquipmentGallery(); }
      if (control.id === "gear-gallery-rarity" && RARITIES.includes(control.value as Rarity)) { galleryRarity = control.value as Rarity; openEquipmentGallery(); }
      if (control.id === "gear-gallery-enhance" && [0,3,7,10].includes(Number(control.value))) { galleryEnhance = Number(control.value); openEquipmentGallery(); }
      if (control.id === "gear-gallery-element" && Object.hasOwn(ELEMENTS, control.value)) { galleryElement = control.value as Element; gallerySet = ""; openEquipmentGallery(); }
      if (control.id === "gear-gallery-set" && (control.value === "" || SET_IDS.includes(control.value as SetId))) { gallerySet = control.value as SetId | ""; if (gallerySet) galleryElement = GEAR_SETS[gallerySet].element; openEquipmentGallery(); }
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
      const explore = target.closest<HTMLButtonElement>("[data-explore-region]"); if (explore && !explore.disabled) enterExploration(Number(explore.dataset.exploreRegion), Number(explore.dataset.exploreZone));
      const lucky = target.closest<HTMLElement>("[data-lucky-tab]")?.dataset.luckyTab;
      if (lucky && ["wheel", "dice", "lottery"].includes(lucky)) openLuckyEvents(lucky as LuckyGame);
      const play = target.closest<HTMLButtonElement>("[data-play-lucky]"); if (play && !play.disabled) playLucky(play.dataset.playLucky as LuckyGame);
      const botSetting = target.closest<HTMLButtonElement>("[data-bot-setting]");
      if (game && botSetting && !botSetting.disabled && game.mapMode === "world" && !game.goldenEncounter) {
        const key = botSetting.dataset.botSetting as keyof BotSettings; if (["enabled", "assist", "pvp"].includes(key)) {
          const backup = { ...game.player.botSettings }; game.player.botSettings[key] = !game.player.botSettings[key];
          if (key === "assist" && game.player.botSettings.assist) game.player.botSettings.enabled = true;
          if (!persistGame()) game.player.botSettings = backup;
          game.botContext = ""; openBots();
        }
      }
      if (target.closest("[data-start-siege]")) enterRequestedSiege((document.getElementById("siege-city") as HTMLSelectElement).value as TerritoryId, Number((document.getElementById("siege-size") as HTMLSelectElement).value));
      const travel = target.closest<HTMLButtonElement>("[data-region]");
      if (travel && !travel.disabled) changeStage(Number(travel.dataset.region) * 10 + 1);
      if (target.closest("#travel-stage-go")) changeStage(Number((document.getElementById("travel-stage") as HTMLSelectElement).value));
      const towerFloorButton = target.closest<HTMLElement>("[data-select-tower-floor]");
      if (towerFloorButton) openTower(Number(towerFloorButton.dataset.selectTowerFloor));
      if (target.closest("[data-select-tower-input]")) {
        const floor = Number(document.querySelector<HTMLInputElement>("#tower-floor-input")?.value);
        if (towerFloor(floor)) openTower(floor); else showToast("Nhập tầng từ 1 đến 100.");
      }
      const towerStart = target.closest<HTMLElement>("[data-enter-tower]");
      if (towerStart) enterTower(Number(towerStart.dataset.enterTower));
      if (target.closest("[data-leave-tower]")) leaveTower();
      const pointPlan = target.closest<HTMLElement>("[data-apply-point-plan]");
      if (pointPlan && (pointPlan.dataset.applyPointPlan === "attributes" || pointPlan.dataset.applyPointPlan === "skills")) applyPointPlan(pointPlan.dataset.applyPointPlan);
      if (target.closest("[data-cancel-point-plan]")) { recommendationSnapshot = ""; closeUtility(); }
      if (target.closest("[data-open-tower-shop]")) openTowerShop();
      const towerExchange = target.closest<HTMLElement>("[data-exchange-tower-piece]");
      if (towerExchange) exchangeTowerPiece(towerExchange.dataset.exchangeTowerPiece as ItemSlot);
      const selectedLand = target.closest<HTMLElement>("[data-select-territory]");
      if (selectedLand && territoryOf(selectedLand.dataset.selectTerritory!)) openTerritories(selectedLand.dataset.selectTerritory as TerritoryId);
      const challenge = target.closest<HTMLButtonElement>("[data-challenge-territory]");
      if (challenge && territoryOf(challenge.dataset.challengeTerritory!)) enterTerritory(challenge.dataset.challengeTerritory as TerritoryId);
      if (target.closest("[data-leave-territory]")) leaveTerritory();
      const claim = target.closest<HTMLElement>("[data-claim-seal]");
      if (claim && game?.mapMode === "world" && !game.goldenEncounter) {
        const rank = militaryRankOf(claim.dataset.claimSeal);
        if (rank && claimMilitaryRank(game.player.military, rank.id)) {
          persistGame(); refreshUi(true); openMilitarySeals(); showToast(`Đã nhận sắc phong ${rank.name}. Bấm Mang ấn để sử dụng.`);
        }
      }
      const wearSeal = target.closest<HTMLElement>("[data-wear-seal]");
      if (wearSeal && militaryRankOf(wearSeal.dataset.wearSeal)) changeMilitarySeal(wearSeal.dataset.wearSeal as MilitaryRankId);
      if (target.closest("[data-remove-seal]")) changeMilitarySeal(null);
      if (target.closest("#buy-set-piece")) buySetPiece();
      const kind = target.closest<HTMLElement>("[data-buy-gear-kind]");
      if (kind && Object.hasOwn(GEAR_VARIANTS, kind.dataset.buyGearKind!)) {
        selectedShopVariant = kind.dataset.buyGearKind as GearVariant;
        setShopSlot = GEAR_VARIANTS[selectedShopVariant].slot;
        setShopId = gallerySet || setForElement(galleryElement);
        openSetShop();
      }
      const wearSet = target.closest<HTMLElement>("[data-wear-set]");
      if (wearSet && game?.mapMode === "world") {
        const id = wearSet.dataset.wearSet as SetId;
        const count = equipSetPieces(game.player, id);
        syncStats(); persistGame(); refreshUi(true); openGearSets(id);
        showToast(`Đã mặc ${count} món bộ ${GEAR_SETS[id].name}. Đồ cũ giữ trong túi.`);
      }
      const skillPreview = target.closest<HTMLButtonElement>("[data-art-skill]");
      if (skillPreview) openSkillArt(skillPreview.dataset.artSkill as SkillKey);
      const preview = target.closest<HTMLButtonElement>("[data-preview-title]");
      if (preview) openTitles(preview.dataset.previewTitle);
      const wear = target.closest<HTMLButtonElement>("[data-wear-title]");
      if (wear) wearTitle(wear.dataset.wearTitle!);
      if (target.closest("#remove-title")) wearTitle("");
      const rebirth = target.closest<HTMLButtonElement>("#confirm-rebirth");
      if (rebirth) confirmRebirth(Number(rebirth.dataset.rebirthCount));
      if (target.closest("#cancel-rebirth")) closeUtility();
      const enhanceConfirm = target.closest<HTMLButtonElement>("[data-confirm-enhance]");
      if (enhanceConfirm) confirmEnhancement(enhanceConfirm.dataset.confirmEnhance!, Number(enhanceConfirm.dataset.enhanceRank));
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
        if (game && game.mapMode !== "world") return;
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
      const enhance = target.closest<HTMLElement>("[data-detail-enhance]");
      if (enhance && game) {
        const item = findOwnedItem(enhance.dataset.detailEnhance!);
        if (item) openEnhancement(item);
      }
      if (target.closest("#confirm-new")) {
        if (game && game.mapMode !== "world") return;
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
      const equipment = target.closest<HTMLElement>("[data-equipped-preview]");
      const item =
        equipment &&
        game.player.equipment[equipment.dataset.equippedPreview as ItemSlot];
      if (item) showItemDetail(item);
    });
  document.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-loot-setting]").forEach(input => input.addEventListener("change", () => {
    if (!game) return;
    if (game.mapMode !== "world" || game.goldenEncounter) { hydrateSettings(); return; }
    const next = { ...game.player.lootSettings, [input.dataset.lootSetting!]: input instanceof HTMLInputElement && input.type === "checkbox" ? input.checked : Number(input.value) };
    if (!validLootSettings(next)) { hydrateSettings(); return; }
    const previous = game.player.lootSettings, inventory = [...game.player.inventory];
    game.player.lootSettings = next;
    discardAutomaticLoot();
    if (!persistGame()) {
      game.player.lootSettings = previous; game.player.inventory = inventory;
      hydrateSettings(); refreshUi(true); return;
    }
    refreshUi(true);
    showToast(next.autoDiscard ? "Đã lưu lọc đồ và bật tự vứt đồ trong túi." : "Đã lưu bộ lọc nhặt đồ.");
  }));
  document.getElementById("save-name")!.addEventListener("click", () => {
    if (!game || game.mapMode !== "world") return;
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
  document.getElementById("xp-multiplier")!.addEventListener("change", event => {
    if (!game) return;
    if (game.mapMode !== "world") { hydrateSettings(); return showToast("Rời phụ bản trước khi đổi cài đặt."); }
    const value = Number((event.target as HTMLSelectElement).value);
    game.player.preferences.xpMultiplier = XP_MULTIPLIERS.includes(value as GamePreferences["xpMultiplier"]) ? value as GamePreferences["xpMultiplier"] : 1;
    persistGame(); refreshUi(true);
    showToast(`Đã bật x${game.player.preferences.xpMultiplier} kinh nghiệm.`);
  });
  document.getElementById("skill-effects-quality")!.addEventListener("change", event => {
    if (!game) return;
    if (game.mapMode !== "world") { hydrateSettings(); return showToast("Rời phụ bản trước khi đổi cài đặt."); }
    game.player.preferences.skillEffects = (event.target as HTMLSelectElement).value === "simple" ? "simple" : "full";
    persistGame(); refreshUi(true);
    showToast(game.player.preferences.skillEffects === "simple" ? "Đã bật hiệu ứng gọn." : "Đã bật hiệu ứng đầy đủ.");
  });
  document.querySelectorAll<HTMLInputElement>("[data-preference]").forEach(input => input.addEventListener("change", () => {
    if (!game) return;
    if (game.mapMode !== "world") { hydrateSettings(); return showToast("Rời phụ bản trước khi đổi cài đặt."); }
    const key = input.dataset.preference;
    if (key === "damageNumbers" || key === "titleVisible" || key === "titleEffects" || key === "minimap") game.player.preferences[key] = input.checked;
    persistGame(); refreshUi(true);
  }));
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
            "autoAttributes",
            "autoSkillPoints",
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
        `<div class="guide-list"><h3>Chiến đấu tự động</h3><p>Nhân vật tự tìm quái, xoay chiêu, dùng bình HP và nhặt đồ. Bấm Tự động để bật/tắt. Dùng WASD, joystick hoặc chạm mặt đất để tự điều khiển.</p><h3>Vượt ải & luyện công</h3><p>Mỗi ải có 4 đợt. Ải 10 có trùm. Vượt ải mở ải kế tiếp; Luyện công lặp lại ải hiện tại. Quái mạnh hơn theo cấp. Ngũ hành khắc chế tăng 25% hoặc giảm 20% sát thương.</p><h3>Nhân vật & trang bị</h3><p>Lên cấp nhận 5 điểm tiềm năng và 1 điểm võ học. Trang bị có 11 ô và một ô ấn quân hàm, 5 phẩm chất, nhiều dòng chỉ số và cường hóa đến +10. Thuốc hồi 40%, dùng chung hồi chiêu 8 giây. Đồ quá sức chứa giữ ở Đồ chờ nhận.</p><h3>Tranh đoạt lãnh thổ</h3><p>Từ cấp 10 có thể công Biên Thành. Chiếm lần lượt 9 thành, dọn 3 đợt trong 4 phút. Chiến công mở 7 chức vị, từ Hương Trưởng đến Thái Thú, Thừa Tướng và Hoàng Đế. Nhận sắc phong rồi mang ấn trong Nhân vật; chỉ ấn đang mang cộng chỉ số.</p><h3>Phiêu lưu & phụ bản</h3><p>Rừng Trúc giữ các NPC và nhiệm vụ cũ. Cổ Mộ mở cấp 3; Trúc Lâm mở cấp 5 sau khi hoàn thành Cổ Mộ.</p><h3>Lưu tiến trình</h3><p>Tự lưu mỗi 10 giây và khi giao dịch. Có 3 nhân vật riêng, file sao lưu và thưởng luyện công vắng mặt tối đa 4 giờ. Tiến trình local lưu trên trình duyệt này.</p></div>`,
      ),
    );
  document.getElementById("campfire-btn")!.addEventListener("click", () => { const fire = nearestCampfire(); if (fire) restAtCampfire(fire); });
  document.getElementById("golden-boss-btn")!.addEventListener("click", openGoldenBoss);
  document.getElementById("slot-btn")!.addEventListener("click", openSlots);
  document.getElementById("adventure-btn")!.addEventListener("click", () => {
    if (!game || game.mapMode !== "world") return;
    if (game.goldenEncounter) leaveGoldenBoss();
    collectIdleLoot();
    if (exploring()) collectIdleLoot(true);
    game.player.exploration.active = false; syncWorldSize();
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
    if (!game || game.mapMode !== "world") return;
    if (game.goldenEncounter) leaveGoldenBoss();
    if (exploring()) collectIdleLoot(true);
    game.player.exploration.active = false; syncWorldSize();
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
    return `<button class="sect-card" data-sect="${school.id}" data-faction="${faction.id}" aria-pressed="${faction.id === selectedFaction}" style="--sect-color:${school.color}">${spriteMarkup(school.id, "sect-character-art", selectionSex(school.id))}<strong>${school.name}</strong><small>${school.element} · ${school.title.split(" · ")[0]}</small><span class="sect-emblem">${faction.emblem}</span></button>`;
  }).join("");
  renderSectDetail();
}
function selectionSex(id: SchoolId): CharacterSex {
  const value = document.querySelector<HTMLSelectElement>("#hero-sex-input")!.value;
  return value === "male" || value === "female" ? value : defaultCharacterSex(id);
}
function renderSectDetail(): void {
  const school = SCHOOL_KITS[SECT_BY_FACTION[selectedFaction]], definition = school.kit[previewSkill];
  for (const button of sectCards.querySelectorAll<HTMLButtonElement>("[data-faction]")) button.setAttribute("aria-pressed", String(button.dataset.faction === selectedFaction));
  document.querySelector("#sect-detail")!.innerHTML = `<strong>${school.name} · ${school.title}</strong><div class="sect-preview-skills">${SKILL_KEYS.map(key => `<button data-preview-skill="${key}" aria-pressed="${previewSkill === key}">${skillIconMarkup(school.kit[key], key, school.color)}<span>${school.kit[key].name}<small>Cấp ${school.kit[key].unlock}</small></span></button>`).join("")}</div><div class="sect-preview-description"><canvas id="sect-preview" width="128" height="86" aria-label="Xem thử ${definition.name}"></canvas><p><b>${definition.name}</b><span>${definition.description}</span><small class="skill-range">${skillReachLabel(definition)}</small><small>${formatNumber(toCombat(definition.mp))} MP · Hồi ${definition.cooldown}s${previewSkill === "ultimate" ? " · 100 nộ" : ""}</small></p></div>`;
  previewCanvas = document.querySelector<HTMLCanvasElement>("#sect-preview");
  document.querySelector("#join-sect")!.textContent = `Gia nhập ${school.name}`;
}
function drawSectPreview(now: number): void {
  if (!previewCanvas || sectOverlay.classList.contains("hidden")) return;
  const pc = previewCanvas.getContext("2d")!, school = SCHOOL_KITS[SECT_BY_FACTION[selectedFaction]], definition = school.kit[previewSkill];
  pc.clearRect(0, 0, 128, 86);
  drawSectEffect(pc, { x: 66, y: 46, radius: 34, color: school.color, sect: school.id, kind: definition.motif, skill: previewSkill }, (now % 1800) / 1800);
  drawSprite(pc, school.id, 56, 76, HERO_SIZE.width, HERO_SIZE.height, false, selectionSex(school.id));
}

let artPreviewSkill: SkillKey = "skill1";
function openSkillArt(key: SkillKey = "skill1"): void {
  if (!game) return;
  artPreviewSkill = key;
  const sect = playerSect(game.player), skill = sect.kit[key];
  openUtility(`Võ công · ${sect.name}`, `<div class="skill-art-preview"><canvas id="skill-art-canvas" width="360" height="210" aria-label="Hiệu ứng ${skill.name}"></canvas><div class="sect-preview-skills">${SKILL_KEYS.map(k => `<button data-art-skill="${k}" aria-pressed="${k === key}">${skillIconMarkup(sect.kit[k], k, sect.color)}<span>${sect.kit[k].name}</span></button>`).join("")}</div><p><b>${skill.name}</b> · ${formatNumber(toCombat(skill.mp))} MP · Hồi ${skill.cooldown}s</p><p class="skill-range">${skillReachLabel(skill)}</p><p class="dim">${skill.description}</p><small class="dim">Nét đứt minh họa tầm đánh. Xem thử không tốn nội lực hoặc nộ. Hiệu ứng ${game.player.preferences.skillEffects === "simple" ? "gọn" : "đầy đủ"}; đổi tại Cài đặt.</small></div>`);
}
function drawSkillArtPreview(now: number): void {
  if (!game || document.getElementById("utility-overlay")!.classList.contains("hidden")) return;
  const preview = document.querySelector<HTMLCanvasElement>("#skill-art-canvas");
  if (!preview) return;
  const c = preview.getContext("2d")!, sect = playerSect(game.player), skill = sect.kit[artPreviewSkill];
  c.clearRect(0, 0, 360, 210);
  c.fillStyle = "#132b26"; c.fillRect(0, 0, 360, 210);
  c.strokeStyle = "#28443a"; c.lineWidth = 1;
  for (let x = 0; x < 360; x += 30) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 210); c.stroke(); }
  for (let y = 0; y < 210; y += 30) { c.beginPath(); c.moveTo(0, y); c.lineTo(360, y); c.stroke(); }
  const p = (now % 1600) / 1600, palette = SKILL_PALETTES[sect.id];
  const ranged = skillUsesFlight(skill);
  const actor = { x: 90, y: 128 }, victim = { x: ranged ? 263 : 90 + Math.min(106, Math.max(55, skill.radius * .5)), y: 128 };
  const quality = game.player.preferences.skillEffects;
  const phase = p < .15 ? "cast" : p < .55 ? "release" : "impact";
  preview.dataset.phase = phase;
  drawSkillReach(c, skill, actor.x, actor.y + 20, 0, palette.color, .45);
  const dash = skill.dash ? Math.min(1, Math.max(0, (p - .15) / .35)) * (victim.x - actor.x - 30) : 0;
  c.save(); c.translate(actor.x + dash, actor.y + 12);
  const motion = freshMotion();
  motion.action = skill.dash ? "dash" : "cast";
  motion.actionAt = now - p * 1600; motion.actionDuration = 650;
  drawAnimatedHero(c, game.player.factionId, game.player.sex, motion, now, { ...currentHeroAppearance(), riding: false });
  c.restore();
  if (skill.damage > 0) {
    drawSprite(c, "bandit", victim.x, victim.y + 24, 44, 58);
    if (p >= .55) {
      const cold = skill.motif === "fan" || skill.motif === "frost", activeUntil = now + 1000;
      c.save(); c.translate(victim.x, victim.y + 10);
      drawEnemyStatus(c, {
        radius: 17, slowUntil: skill.slow ? activeUntil : 0,
        stunUntil: skill.stun ? activeUntil : 0, poisonUntil: skill.poison ? activeUntil : 0,
        burnUntil: skill.burn ? activeUntil : 0, corrodedUntil: skill.corrode ? activeUntil : 0,
        chilledUntil: cold && skill.slow ? activeUntil : 0, frozenUntil: cold && skill.stun ? activeUntil : 0,
      }, now, quality === "simple");
      c.restore();
    }
  }
  const base = { color: sect.color, sect: sect.id, kind: skill.motif, skill: artPreviewSkill, angle: 0, quality };
  const hand = actorCastOffset(sect.id, game.player.sex, 1);
  const origin = { x: actor.x + hand.x, y: actor.y + 12 + hand.y };
  if (p < .2) drawSectEffect(c, { ...base, ...(ranged ? origin : actor), radius: 28, phase: "cast" }, p / .2);
  if (ranged && p >= .15 && p < .55) drawSkillFlight(c, origin, victim, (p - .15) / .4, sect.id, artPreviewSkill, now, quality);
  if (!ranged && p >= .2 && p < .55) {
    drawSectEffect(c, { ...base, x: actor.x + dash, y: actor.y, radius: skill.shape === "line" ? 130 : Math.min(110, Math.max(60, skill.radius * .7)), phase: "release" }, (p - .2) / .35);
  }
  if (p >= .55 && p < .96) {
    // Pure defensive / healing skills finish around the caster; no false enemy hit.
    const hits = skill.damage > 0;
    drawSectEffect(c, { ...base, ...(hits ? victim : actor), radius: hits ? artPreviewSkill === "ultimate" ? 49 : 33 : 78,
      phase: hits ? "impact" : "release" }, (p - .55) / .41);
  }
  c.fillStyle = "#dce9d8"; c.font = "11px sans-serif"; c.textAlign = "center";
  c.fillText(phase === "cast" ? "Tụ lực" : phase === "release" ? "Ra chiêu" : skill.damage > 0 ? "Trúng địch" : "Hộ thể / hồi phục", 180, 193);
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
  if (key === "h") toggleMount();
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
  if (target.closest("[data-show-skill-art]")) return openSkillArt();
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
  if (target.closest("[data-open-loot-settings]")) { showIdlePage("more"); document.getElementById("loot-settings-heading")!.scrollIntoView({ block: "start" }); }
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
document.getElementById("combat-stats-btn")!.addEventListener("click", openCombatStats);
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
    const expanded = document
      .querySelector(".app-shell")!
      .classList.contains("arena-expanded");
    if (game && idlePage === "char" && !expanded)
      drawCharacterPreview(
        document.querySelector<HTMLCanvasElement>("#character-preview")!,
        {
          factionId: game.player.factionId,
          sex: game.player.sex,
          appearance: currentHeroAppearance(),
          cultivation: cultivationForPower(currentCombatPower()),
          horse: game.player.mounted ? currentMountAppearance() : undefined,
          simpleEffects: game.player.preferences.skillEffects === "simple",
          militaryRank: militaryRankOf(game.player.military.equipped)?.id,
          title: game.player.preferences.titleEffects ? wornTitle(game.player.journey) : undefined,
        },
        now,
      );
    else if (idlePage !== "inventory" || expanded) drawWorld(now);
    drawSectPreview(now);
    drawSkillArtPreview(now);
    drawTitlePreview(now);
    lastDrawTime = now - ((now - lastDrawTime) % RENDER_INTERVAL_MS);
  }
  refreshUi();
  window.requestAnimationFrame(frame);
}

window.requestAnimationFrame(frame);
