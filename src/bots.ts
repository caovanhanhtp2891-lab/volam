import {
  freshMotion,
  updateMotion,
  type ActorMotion,
  type Point,
} from "./combat.ts";
import type { FactionId } from "./idle";
import type { GearVariant } from "./gear-catalog";
import type { SectId } from "./sects.ts";

export const BOT_TEMPLATES = [
  {
    id: "han-phong",
    name: "Hàn Phong",
    faction: "cuiyan",
    sex: "female",
    role: "ranged",
    weapon: "frostsword",
    color: "#82d9ef",
  },
  {
    id: "thanh-lien",
    name: "Thanh Liên",
    faction: "emei",
    sex: "female",
    role: "healer",
    weapon: "lotusfan",
    color: "#efa4c1",
  },
  {
    id: "liet-hoa",
    name: "Liệt Hỏa",
    faction: "gaibang",
    sex: "male",
    role: "fighter",
    weapon: "dragonstaff",
    color: "#edaf63",
  },
  {
    id: "van-kiem",
    name: "Vân Kiếm",
    faction: "wudang",
    sex: "male",
    role: "ranged",
    weapon: "thundersword",
    color: "#aab9ed",
  },
  {
    id: "huyen-giap",
    name: "Huyền Giáp",
    faction: "tianwang",
    sex: "male",
    role: "tank",
    weapon: "spear",
    color: "#e7cb87",
  },
  {
    id: "anh-nguyet",
    name: "Ảnh Nguyệt",
    faction: "tianren",
    sex: "female",
    role: "fighter",
    weapon: "daggers",
    color: "#ef8a85",
  },
  {
    id: "doc-nhan",
    name: "Độc Nhãn",
    faction: "wudu",
    sex: "male",
    role: "ranged",
    weapon: "serpentstaff",
    color: "#a8dd7b",
  },
  {
    id: "tu-loi",
    name: "Tử Lôi",
    faction: "kunlun",
    sex: "female",
    role: "ranged",
    weapon: "thundersword",
    color: "#c3a0ef",
  },
  {
    id: "kim-cang",
    name: "Kim Cang",
    faction: "shaolin",
    sex: "male",
    role: "tank",
    weapon: "staff",
    color: "#e6c276",
  },
  {
    id: "phong-tien",
    name: "Phong Tiễn",
    faction: "tangmen",
    sex: "female",
    role: "ranged",
    weapon: "crossbow",
    color: "#82caba",
  },
] as const satisfies readonly {
  id: string;
  name: string;
  faction: FactionId;
  sex: "male" | "female";
  role: string;
  weapon: GearVariant;
  color: string;
}[];
export type BotTemplate = (typeof BOT_TEMPLATES)[number];
export type BotOrder = "push" | "guard" | "rally";
export interface BotSettings {
  enabled: boolean;
  assist: boolean;
}
export const freshBotSettings = (): BotSettings => ({
  enabled: true,
  assist: false,
});
export function validBotSettings(value: unknown): boolean {
  return (
    value === undefined ||
    Boolean(
      value &&
        typeof value === "object" &&
        typeof (value as BotSettings).enabled === "boolean" &&
        typeof (value as BotSettings).assist === "boolean",
    )
  );
}
export interface BotActor extends Point {
  id: string;
  profile: BotTemplate;
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  cooldown: number;
  skillCooldown: number;
  respawnAt: number;
  motion: ActorMotion;
  slowUntil: number;
  slowFactor: number;
  stunUntil: number;
  poisonUntil: number;
  poisonNextTick: number;
  poisonDamage: number;
  burnUntil: number;
  burnNextTick: number;
  burnDamage: number;
  burnSect: SectId;
  corrodedUntil: number;
  defenseDownUntil: number;
  chilledUntil: number;
  frozenUntil: number;
}
export function createBot(
  profile: BotTemplate,
  index: number,
  level: number,
  origin: Point,
  stats: { attack: number; hp: number; defense: number },
): BotActor {
  const tank = profile.role === "tank";
  const maxHp = Math.max(1000, Math.floor(stats.hp * (tank ? 0.8 : 0.55)));
  return {
    id: `bot-${profile.id}-${index}`,
    profile,
    level,
    x: origin.x + ((index % 3) - 1) * 52,
    y: origin.y + Math.floor(index / 3) * 44,
    hp: maxHp,
    maxHp,
    attack: Math.max(
      100,
      Math.floor(stats.attack * (profile.role === "healer" ? 0.2 : 0.32)),
    ),
    defense: Math.floor(stats.defense * (tank ? 0.75 : 0.4)),
    speed: 145,
    cooldown: index * 0.12,
    skillCooldown: 0.8 + index * 0.3,
    respawnAt: 0,
    motion: freshMotion(),
    slowUntil: 0,
    slowFactor: 1,
    stunUntil: 0,
    poisonUntil: 0,
    poisonNextTick: 0,
    poisonDamage: 0,
    burnUntil: 0,
    burnNextTick: 0,
    burnDamage: 0,
    burnSect: "cai-bang",
    corrodedUntil: 0,
    defenseDownUntil: 0,
    chilledUntil: 0,
    frozenUntil: 0,
  };
}
export interface BotTarget extends Point {
  id: string;
  dead: boolean;
  structure?: string;
  radius: number;
}
export function chooseBotTarget(
  bot: Point,
  enemies: readonly BotTarget[],
  player: Point,
  order: BotOrder,
): BotTarget | undefined {
  const alive = enemies.filter((e) => !e.dead);
  const candidates =
    order === "rally"
      ? alive.filter((e) => Math.hypot(e.x - player.x, e.y - player.y) < 180)
      : order === "guard" && alive.some((e) => !e.structure)
        ? alive.filter((e) => !e.structure)
        : order === "push" && alive.some((e) => e.structure)
          ? alive.filter((e) => e.structure)
          : alive;
  return candidates.reduce<BotTarget | undefined>(
    (best, e) =>
      !best ||
      Math.hypot(e.x - bot.x, e.y - bot.y) <
        Math.hypot(best.x - bot.x, best.y - bot.y)
        ? e
        : best,
    undefined,
  );
}
export function moveBot(
  bot: BotActor,
  goal: Point,
  dt: number,
  now: number,
  blocked: (x: number, y: number) => boolean,
  stop = 12,
): void {
  const before = { x: bot.x, y: bot.y },
    dx = goal.x - bot.x,
    dy = goal.y - bot.y,
    d = Math.hypot(dx, dy);
  if (bot.stunUntil <= now && d > stop) {
    const stride = Math.min(
      d - stop,
      bot.speed * dt * (bot.slowUntil > now ? bot.slowFactor : 1),
    );
    const x = Math.max(30, Math.min(1870, bot.x + (dx / d) * stride)),
      y = Math.max(30, Math.min(1170, bot.y + (dy / d) * stride));
    if (!blocked(x, bot.y)) bot.x = x;
    if (!blocked(bot.x, y)) bot.y = y;
    if (bot.x === before.x && bot.y === before.y) {
      const turn = now % 4000 < 2000 ? 1 : -1;
      const sidestepX = bot.x - (dy / d) * stride * turn,
        sidestepY = bot.y + (dx / d) * stride * turn;
      if (!blocked(sidestepX, sidestepY)) {
        bot.x = Math.max(30, Math.min(1870, sidestepX));
        bot.y = Math.max(30, Math.min(1170, sidestepY));
      }
    }
  }
  updateMotion(bot.motion, before, bot, dt, now);
}
