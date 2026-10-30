/**
 * МАТЕМАТИЧЕСКОЕ ЯДРО: IDLE SECT MANAGER (XIANXIA ALPHA MVP)
 * Реализует генерацию персонажей, формулы урона, 80% агро первого слота,
 * Сердце Дао, Перманентную смерть, Стихийные травмы и автономную экономику 90/10.
 */

import {
  ArchetypeId,
  BaseStats,
  ChronicleCategory,
  Constitution,
  Disciple,
  EnemyUnit,
  Gender,
  PillGrid,
  SectLevelConfig,
  SectResources,
  SpiritRoot,
  StatPillKey,
  TemperamentId,
} from '../types/game';
import {
  t,
  getDaoHeartLabel as i18nGetDaoHeartLabel,
  getDaoHeartSubtitle,
} from '../i18n';

// ============================================================================
// 1. СПРАВОЧНИКИ СЕТТИНГА САНЬСЯ (МОДУЛЬ 02, 03, 07)
// ============================================================================

const SURNAMES = [
  'Линь', 'Фэн', 'Су', 'Чжао', 'Е', 'Мо', 'Бай', 'Хань', 'Чу', 'Шэнь', 'Гу', 'Юнь', 'Цзян', 'Лу', 'Сяо'
];

const MALE_NAMES = [
  'Сюань', 'Чэнь', 'Янь', 'Фэн', 'Хао', 'Мин', 'Лун', 'Хань', 'Чжэнь', 'Кунь', 'Юй', 'Цзе'
];

const FEMALE_NAMES = [
  'Юэ', 'Лань', 'Сюэ', 'Цин', 'Яо', 'Мэй', 'Жо', 'Нин', 'Шуан', 'Синь', 'Ли', 'Хуа'
];

export const CHRONICLE_CATEGORY_LABELS: Record<ChronicleCategory, string> = {
  SECT: 'Обитель',
  RECRUIT: 'Чайный павильон',
  COMBAT: 'Поход',
  ECONOMY: 'Казна и обмен',
  CRAFT: 'Павильон ремёсел',
  BREAKTHROUGH: 'Прорыв царства',
  DEATH: 'Павшие',
  DAO_HEART: 'Сердце Дао',
};

export const SPIRIT_ROOTS: SpiritRoot[] = [
  {
    id: 'MORTAL_MIXED',
    name: 'Пятиэлементный Смешанный Корень',
    expMultiplier: 0.9,
    statBias: { maxHp: 8, pDef: 2, mDef: 2 },
    description: 'Рассеянная ци пяти стихий. Медленное накопление опыта, но выносливое тело.',
  },
  {
    id: 'EARTH_VEIN',
    name: 'Земной Корень Черного Камня',
    expMultiplier: 1.0,
    statBias: { maxHp: 18, pDef: 5, mDef: 3 },
    description: 'Тяжелая иньская ци глубин. Повышает защиту и живучесть в авангарде.',
  },
  {
    id: 'CRIMSON_FLAME',
    name: 'Истинный Корень Багрового Пламени',
    expMultiplier: 1.15,
    statBias: { mAtk: 6, pAtk: 4, crit: 3 },
    description: 'Яростная янская ци. Ускоряет культивацию и усиливает атакующий потенциал.',
  },
  {
    id: 'FROST_JADE',
    name: 'Ледяной Нефритовый Корень',
    expMultiplier: 1.2,
    statBias: { mAtk: 5, mDef: 5, spd: 3 },
    description: 'Холодный разум и чистые меридианы. Высокая скорость и духовная защита.',
  },
  {
    id: 'HEAVENLY_VOID',
    name: 'Небесный Корень Изначальной Пустоты',
    expMultiplier: 1.35,
    statBias: { pAtk: 5, mAtk: 5, spd: 4, eva: 4, crit: 3 },
    description: 'Редчайший дар Небес (+35% к скорости постижения Ци и сбалансированные статы).',
  },
];

export const CONSTITUTIONS: Constitution[] = [
  {
    id: 'COMMON_VESSEL',
    name: 'Обычный Сосуд Плоти',
    pillCapBonus: 0,
    statBias: {},
    description: 'Стандартные меридианы смертного без врожденных отклонений.',
  },
  {
    id: 'IRON_MARROW',
    name: 'Кость Чёрного Железа',
    pillCapBonus: 1,
    statBias: { maxHp: 15, pAtk: 3, pDef: 4 },
    description: 'Плотные кости и сухожилия. Расширяет лимит усвоения пилюль (+1 ко всем видам).',
  },
  {
    id: 'SPIRIT_MERIDIAN',
    name: 'Открытые Духовные Врата',
    pillCapBonus: 2,
    statBias: { mAtk: 5, mDef: 4, spd: 2 },
    description: 'Широкие каналы ци позволяют усваивать больше алхимических эликсиров (+2 к лимиту).',
  },
  {
    id: 'ANCIENT_BLOOD',
    name: 'Кровь Древних Титанов',
    pillCapBonus: 3,
    statBias: { maxHp: 25, pAtk: 5, mAtk: 4, pDef: 3, mDef: 3 },
    description: 'Могучее телосложение древних родов (+3 к лимиту пилюль каждого типа).',
  },
];

export const TEMPERAMENT_INFO: Record<
  TemperamentId,
  {
    name: string;
    summary: string;
    lootCutPercent: number; // доля в личную мошну (обычно 10%, у Жадного 15%)
    lootBonusMultiplier: number;
    injuryRiskBonus: number;
  }
> = {
  NORMAL: {
    name: 'Обычный',
    summary: 'Уравновешенный нрав. Стандартные боевые показатели, 10% добычи в мошну.',
    lootCutPercent: 0.10,
    lootBonusMultiplier: 1.0,
    injuryRiskBonus: 0,
  },
  COWARDLY: {
    name: 'Трусливый',
    summary: '+6% к уклонению, бережёт жизнь и первым делом заказывает целебные снадобья.',
    lootCutPercent: 0.10,
    lootBonusMultiplier: 0.95,
    injuryRiskBonus: -0.1,
  },
  GREEDY: {
    name: 'Жадный',
    summary: '+15% к поиску ресурсов в Разломе, удерживает 15% добычи в мошну и активно торгует.',
    lootCutPercent: 0.15,
    lootBonusMultiplier: 1.15,
    injuryRiskBonus: 0.05,
  },
  RECKLESS: {
    name: 'Безрассудный',
    summary: '+18% к атаке и +5% к криту, но -12% к защите и повышенный риск стихийных травм.',
    lootCutPercent: 0.10,
    lootBonusMultiplier: 1.05,
    injuryRiskBonus: 0.2,
  },
};

export const ARCHETYPE_INFO: Record<
  ArchetypeId,
  {
    name: string;
    tier: 1 | 2;
    role: string;
    attackType: 'PHYSICAL' | 'MAGICAL';
    description: string;
    statBonuses: Partial<BaseStats>;
  }
> = {
  NOVICE: {
    name: 'Послушник',
    tier: 1,
    role: 'Ученик 1-го царства',
    attackType: 'PHYSICAL',
    description: 'Базовый адепт стадии Закалки Тела. Изучает основы циркуляции Ци.',
    statBonuses: {},
  },
  SWORDSMAN: {
    name: 'Мечник Внешнего Двора',
    tier: 2,
    role: 'Мастер клинка · Физ. урон',
    attackType: 'PHYSICAL',
    description: 'Мастер боевого клинка 2-го царства. Сокрушает броню стремительными физическими выпадами.',
    statBonuses: { maxHp: 35, pAtk: 18, pDef: 6, spd: 6, crit: 8 },
  },
  GUARDIAN: {
    name: 'Страж Каменного Щита',
    tier: 2,
    role: 'Авангард · Защита строя',
    attackType: 'PHYSICAL',
    description: 'Несокрушимый щит секты. Идеален для 1-го слота строя, поглощающего 80% вражеских ударов.',
    statBonuses: { maxHp: 90, pAtk: 9, pDef: 18, mDef: 14, eva: 2 },
  },
  FLAME_ADEPT: {
    name: 'Адепт Тайного Пламени',
    tier: 2,
    role: 'Заклинатель · Духовный огонь',
    attackType: 'MAGICAL',
    description: 'Повелитель духовного огня. Поражает врагов сквозь физическую броню магическими печатями.',
    statBonuses: { maxHp: 40, mAtk: 22, mDef: 12, spd: 5, crit: 6 },
  },
};

export const STAT_PILL_LABELS: Record<
  StatPillKey,
  { name: string; shortStat: string; bonusText: string }
> = {
  pAtk: { name: 'Пилюля Костного Мозга', shortStat: 'Физ. атака', bonusText: '+1 к физ. атаке навсегда' },
  mAtk: { name: 'Пилюля Астрального Духа', shortStat: 'Маг. атака', bonusText: '+1 к маг. атаке навсегда' },
  pDef: { name: 'Пилюля Железной Кожи', shortStat: 'Физ. защита', bonusText: '+1 к физ. защите навсегда' },
  mDef: { name: 'Пилюля Нефритового Сердца', shortStat: 'Маг. защита', bonusText: '+1 к маг. защите навсегда' },
  spd: { name: 'Пилюля Поступи Ветра', shortStat: 'Скорость', bonusText: '+1 к скорости навсегда' },
  maxHp: { name: 'Пилюля Жизненной Крови', shortStat: 'Здоровье', bonusText: '+12 к макс. здоровью навсегда' },
};

export const SECT_LEVELS: Record<1 | 2, SectLevelConfig> = {
  1: {
    level: 1,
    name: 'Забытая Нора',
    subtitle: 'Обитель I ступени · Разреженная духовная жила',
    maxComfortTier: 1,
    passiveHealRate: 4, // +4 HP за тик отдыха
    qiDensityBonus: 1.0,
    upgradeCost: {
      spiritStones: 80,
      bogIron: 18,
      bloodMoss: 18,
      spiderCarapace: 12,
    },
  },
  2: {
    level: 2,
    name: 'Твердыня Глубин',
    subtitle: 'Обитель II ступени · Пробуждённый Источник Инь-Ци',
    maxComfortTier: 2,
    passiveHealRate: 10, // +10 HP за тик отдыха
    qiDensityBonus: 1.35,
  },
};

// Шаблоны кузнечного ремесла (Модуль 05)
export interface CraftableGearRecipe {
  templateId: string;
  name: string;
  slot: 'WEAPON' | 'ARMOR';
  tier: 1 | 2;
  cost: SectResources;
  bonuses: Partial<BaseStats>;
  description: string;
}

export const BLACKSMITH_RECIPES: CraftableGearRecipe[] = [
  {
    templateId: 'BOG_IRON_BLADE',
    name: 'Клинок Болотного Железа',
    slot: 'WEAPON',
    tier: 1,
    cost: { spiritStones: 15, bogIron: 6, bloodMoss: 0, spiderCarapace: 2 },
    bonuses: { pAtk: 9, spd: 2, crit: 3 },
    description: 'Тяжёлый меч из болотной руды (+9 физ. атаки, +2 скорости, +3% крита).',
  },
  {
    templateId: 'MOSS_SPIRIT_STAFF',
    name: 'Посох Кровавого Мха',
    slot: 'WEAPON',
    tier: 1,
    cost: { spiritStones: 15, bogIron: 3, bloodMoss: 5, spiderCarapace: 2 },
    bonuses: { mAtk: 10, mDef: 4, spd: 2 },
    description: 'Проводник духовной энергии глубин (+10 маг. атаки, +4 маг. защиты, +2 скорости).',
  },
  {
    templateId: 'CARAPACE_CUIRASS',
    name: 'Латы Паучьего Панциря',
    slot: 'ARMOR',
    tier: 1,
    cost: { spiritStones: 18, bogIron: 5, bloodMoss: 2, spiderCarapace: 6 },
    bonuses: { maxHp: 42, pDef: 10, mDef: 7 },
    description: 'Прочный доспех из хитина пещерных ткачей (+42 здоровья, +10 физ. и +7 маг. защиты).',
  },
];

// ============================================================================
// 2. УТИЛИТЫ СЛУЧАЙНЫХ ЧИСЕЛ И ГЕНЕРАЦИЯ УЧЕНИКА (МОДУЛЬ 02)
// ============================================================================

export function randomFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateDisciple(isHeavensGrace = false): Disciple {
  const gender: Gender = Math.random() < 0.5 ? 'YIN' : 'YANG';
  const surname = pickRandom(SURNAMES);
  const givenName = gender === 'YANG' ? pickRandom(MALE_NAMES) : pickRandom(FEMALE_NAMES);

  // Если ученик выдан через «Милость Небес» (защита от софтлока), даём надёжную базовую сборку
  const spiritRoot = isHeavensGrace ? SPIRIT_ROOTS[1] : pickRandom(SPIRIT_ROOTS);
  const constitution = isHeavensGrace ? CONSTITUTIONS[0] : pickRandom(CONSTITUTIONS);

  const temperaments: TemperamentId[] = ['NORMAL', 'COWARDLY', 'GREEDY', 'RECKLESS'];
  const temperament: TemperamentId = isHeavensGrace ? 'NORMAL' : pickRandom(temperaments);

  const baseMaxHp =
    randomInt(85, 110) +
    (spiritRoot.statBias.maxHp ?? 0) +
    (constitution.statBias.maxHp ?? 0);
  const basePAtk =
    randomInt(12, 17) +
    (spiritRoot.statBias.pAtk ?? 0) +
    (constitution.statBias.pAtk ?? 0);
  const baseMAtk =
    randomInt(11, 16) +
    (spiritRoot.statBias.mAtk ?? 0) +
    (constitution.statBias.mAtk ?? 0);
  const basePDef =
    randomInt(8, 13) +
    (spiritRoot.statBias.pDef ?? 0) +
    (constitution.statBias.pDef ?? 0);
  const baseMDef =
    randomInt(8, 13) +
    (spiritRoot.statBias.mDef ?? 0) +
    (constitution.statBias.mDef ?? 0);
  const baseSpd =
    randomInt(10, 15) +
    (spiritRoot.statBias.spd ?? 0) +
    (constitution.statBias.spd ?? 0);
  const baseCrit = randomInt(5, 9) + (spiritRoot.statBias.crit ?? 0);
  const baseEva = randomInt(4, 8) + (spiritRoot.statBias.eva ?? 0);

  const capBonus = constitution.pillCapBonus;
  const pillGrid: PillGrid = {
    pAtk: { consumed: 0, max: randomInt(3, 5) + capBonus },
    mAtk: { consumed: 0, max: randomInt(3, 5) + capBonus },
    pDef: { consumed: 0, max: randomInt(3, 5) + capBonus },
    mDef: { consumed: 0, max: randomInt(3, 5) + capBonus },
    spd: { consumed: 0, max: randomInt(2, 4) + capBonus },
    maxHp: { consumed: 0, max: randomInt(3, 6) + capBonus },
  };

  const draft: Disciple = {
    id: `disc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: `${surname} ${givenName}`,
    gender,
    archetype: 'NOVICE',
    temperament,
    spiritRoot,
    constitution,
    stats: {
      hp: baseMaxHp,
      maxHp: baseMaxHp,
      pAtk: basePAtk,
      mAtk: baseMAtk,
      pDef: basePDef,
      mDef: baseMDef,
      spd: baseSpd,
      crit: baseCrit,
      eva: baseEva,
    },
    pillGrid,
    realmTier: 1,
    subLevel: 1,
    exp: 0,
    maxExp: 60,
    status: 'IDLE',
    lineupSlot: null,
    injuries: 0,
    daoHeart: 0,
    personalStones: isHeavensGrace ? 4 : randomInt(3, 7),
    equippedWeapon: null,
    equippedArmor: null,
    kills: 0,
    expeditionsCompleted: 0,
  };

  // Синхронизируем стартовое здоровье с эффективным максимумом (учитывая пассивку Ян +10% HP)
  const eff = calculateEffectiveStats(draft);
  draft.stats.hp = eff.maxHp;
  return draft;
}

export function getDaoHeartLabel(daoHeart: number | boolean | Disciple): string {
  return i18nGetDaoHeartLabel(daoHeart as number | boolean | { daoHeart?: number });
}

export function getDaoHeartState(unit: Disciple | number) {
  const rawVal =
    unit && typeof unit === 'object'
      ? typeof unit.daoHeart === 'number' && !isNaN(unit.daoHeart)
        ? unit.daoHeart
        : 0
      : typeof unit === 'number' && !isNaN(unit)
      ? unit
      : 0;
  const val = Math.max(-100, Math.min(100, Math.round(rawVal)));
  const label = getDaoHeartLabel(val);
  const subtitle = getDaoHeartSubtitle(val);

  if (val >= 80) {
    return {
      id: 'DIAMOND_HEART',
      name: label,
      colorClass: 'text-amber-400',
      subtitle,
      breakthroughBonus: 15,
      dmgMultiplier: 1.0,
    };
  }
  if (val >= 50) {
    return {
      id: 'FEARLESS_BEFORE_HEAVENS',
      name: label,
      colorClass: 'text-sky-400',
      subtitle,
      breakthroughBonus: 10,
      dmgMultiplier: 1.0,
    };
  }
  if (val >= 20) {
    return {
      id: 'UNWAVERING_SPIRIT',
      name: label,
      colorClass: 'text-sky-400',
      subtitle,
      breakthroughBonus: 5,
      dmgMultiplier: 1.0,
    };
  }
  if (val >= -19) {
    return {
      id: 'MORTAL_CONFUSION',
      name: label,
      colorClass: 'text-[#94A3B8]',
      subtitle,
      breakthroughBonus: 0,
      dmgMultiplier: 1.0,
    };
  }
  if (val >= -49) {
    return {
      id: 'SHADOW_OF_DOUBT',
      name: label,
      colorClass: 'text-fuchsia-400',
      subtitle,
      breakthroughBonus: -5,
      dmgMultiplier: 1.1,
    };
  }
  if (val >= -79) {
    return {
      id: 'DEMONIC_OBSESSION',
      name: label,
      colorClass: 'text-rose-400',
      subtitle,
      breakthroughBonus: -10,
      dmgMultiplier: 1.2,
    };
  }
  return {
    id: 'TRUE_HEART_DEMON',
    name: label,
    colorClass: 'text-rose-400',
    subtitle,
    breakthroughBonus: -15,
    dmgMultiplier: 1.35,
  };
}

// ============================================================================
// 3. РАСЧЁТ ЭФФЕКТИВНЫХ ХАРАКТЕРИСТИК УЧЕНИКА (С УЧЁТОМ ИНЬ/ЯН, ПИЛЮЛЬ, ЭКИПИРОВКИ)
// ============================================================================

export function calculateEffectiveStats(d: Disciple): BaseStats {
  const archBonus = ARCHETYPE_INFO[d.archetype]?.statBonuses ?? {};
  const wep = d.equippedWeapon?.bonuses ?? {};
  const arm = d.equippedArmor?.bonuses ?? {};

  // Бонусы от выпитых перманентных пилюль статов (Сетка потенциала)
  const pillMaxHp = (d.pillGrid?.maxHp?.consumed ?? 0) * 12;
  const pillPAtk = (d.pillGrid?.pAtk?.consumed ?? 0) * 1;
  const pillMAtk = (d.pillGrid?.mAtk?.consumed ?? 0) * 1;
  const pillPDef = (d.pillGrid?.pDef?.consumed ?? 0) * 1;
  const pillMDef = (d.pillGrid?.mDef?.consumed ?? 0) * 1;
  const pillSpd = (d.pillGrid?.spd?.consumed ?? 0) * 1;

  // Бонус «Сердца Дао»
  const daoBonus = d.daoHeart >= 20 ? 3 : 0;

  let maxHp =
    d.stats.maxHp +
    (archBonus.maxHp ?? 0) +
    (wep.maxHp ?? 0) +
    (arm.maxHp ?? 0) +
    pillMaxHp +
    daoBonus * 8;
  let pAtk =
    d.stats.pAtk +
    (archBonus.pAtk ?? 0) +
    (wep.pAtk ?? 0) +
    (arm.pAtk ?? 0) +
    pillPAtk +
    daoBonus;
  let mAtk =
    d.stats.mAtk +
    (archBonus.mAtk ?? 0) +
    (wep.mAtk ?? 0) +
    (arm.mAtk ?? 0) +
    pillMAtk +
    daoBonus;
  let pDef =
    d.stats.pDef +
    (archBonus.pDef ?? 0) +
    (wep.pDef ?? 0) +
    (arm.pDef ?? 0) +
    pillPDef +
    daoBonus;
  let mDef =
    d.stats.mDef +
    (archBonus.mDef ?? 0) +
    (wep.mDef ?? 0) +
    (arm.mDef ?? 0) +
    pillMDef +
    daoBonus;
  let spd =
    d.stats.spd +
    (archBonus.spd ?? 0) +
    (wep.spd ?? 0) +
    (arm.spd ?? 0) +
    pillSpd +
    (d.daoHeart >= 20 ? 2 : 0);
  let crit =
    d.stats.crit +
    (archBonus.crit ?? 0) +
    (wep.crit ?? 0) +
    (arm.crit ?? 0) +
    (d.daoHeart >= 20 ? 4 : 0);
  let eva =
    d.stats.eva +
    (archBonus.eva ?? 0) +
    (wep.eva ?? 0) +
    (arm.eva ?? 0) +
    (d.daoHeart >= 20 ? 3 : 0);

  // Пассивка Инь / Ян
  if (d.gender === 'YANG') {
    maxHp = Math.round(maxHp * 1.1);
    pAtk = Math.round(pAtk * 1.1);
    crit += 3;
  } else {
    mAtk = Math.round(mAtk * 1.1);
    mDef = Math.round(mDef * 1.1);
    eva += 3;
  }

  const clampedCurrentHp = Math.max(0, Math.min(Math.round(d.stats.hp), maxHp));

  // Модификаторы Характера
  if (d.temperament === 'RECKLESS') {
    pAtk = Math.round(pAtk * 1.18);
    mAtk = Math.round(mAtk * 1.18);
    crit += 5;
    pDef = Math.max(1, Math.round(pDef * 0.88));
    mDef = Math.max(1, Math.round(mDef * 0.88));
  } else if (d.temperament === 'COWARDLY') {
    eva += 6;
    if (clampedCurrentHp / maxHp < 0.35) {
      pAtk = Math.max(1, Math.round(pAtk * 0.85));
      mAtk = Math.max(1, Math.round(mAtk * 0.85));
    }
  }

  // Штраф от Стихийных Травм (каждый стак ослабляет защиту меридианов)
  if (d.injuries > 0) {
    const injuryPenalty = Math.max(0.7, 1 - d.injuries * 0.05);
    pDef = Math.max(1, Math.round(pDef * injuryPenalty));
    mDef = Math.max(1, Math.round(mDef * injuryPenalty));
  }

  return {
    hp: clampedCurrentHp,
    maxHp,
    pAtk,
    mAtk,
    pDef,
    mDef,
    spd,
    crit: Math.min(75, crit),
    eva: Math.min(60, eva),
  };
}

/**
 * Гарантирует, что текущее здоровье ученика не превышает эффективный максимум
 * или полностью исцеляет его при прорыве ступени/царства.
 */
export function syncDiscipleHp(d: Disciple, healToFull = false): Disciple {
  const rawDao = (d as unknown as { daoHeart?: number | boolean }).daoHeart;
  const normalizedDaoHeart =
    typeof rawDao === 'number' && !isNaN(rawDao)
      ? Math.max(-100, Math.min(100, Math.round(rawDao)))
      : rawDao === true
      ? 25
      : 0;
  const eff = calculateEffectiveStats({ ...d, daoHeart: normalizedDaoHeart });
  return {
    ...d,
    daoHeart: normalizedDaoHeart,
    stats: {
      ...d.stats,
      hp: healToFull ? eff.maxHp : eff.hp,
    },
  };
}

// ============================================================================
// 4. БОЕВАЯ МАТЕМАТИКА И ГЕНЕРАЦИЯ ВРАГОВ КАРСТОВОГО РАЗЛОМА (МОДУЛЬ 04 И 05)
// ============================================================================

/**
 * Процентная формула урона из спецификации:
 * Damage = ATK * (100 / (100 + DEF)) * Random(0.9..1.1)
 */
export function computeCombatDamage(
  atk: number,
  def: number,
  critChancePercent: number,
  targetEvaPercent: number
): { damage: number; isCrit: boolean; isEvaded: boolean } {
  if (Math.random() * 100 < targetEvaPercent) {
    return { damage: 0, isCrit: false, isEvaded: true };
  }

  const variance = randomFloat(0.9, 1.1);
  const mitigation = 100 / (100 + Math.max(0, def));
  let rawDamage = atk * mitigation * variance;

  const isCrit = Math.random() * 100 < critChancePercent;
  if (isCrit) {
    rawDamage *= 1.5;
  }

  return {
    damage: Math.max(1, Math.round(rawDamage)),
    isCrit,
    isEvaded: false,
  };
}

/**
 * Выбор цели в линейном строю (Слоты 1–4):
 * 80% атак врагов идут в Slot 1 (первый занятый авангардный слот),
 * остальные 20% распределяются между остальными живыми слотами отряда.
 */
export function selectLineupTarget(orderedAliveSquad: Disciple[]): Disciple {
  if (orderedAliveSquad.length === 1) {
    return orderedAliveSquad[0];
  }
  const roll = Math.random();
  if (roll < 0.80) {
    return orderedAliveSquad[0];
  }
  const backline = orderedAliveSquad.slice(1);
  return pickRandom(backline);
}

/**
 * Генерация волн врагов «Карстового Разлома» со сбалансированными таблицами добычи и опыта.
 */
export function spawnKarstRiftEnemies(depthStage: number, waveInStage: number): EnemyUnit[] {
  const scale = 1 + (depthStage - 1) * 0.34 + (waveInStage - 1) * 0.12;
  const count =
    waveInStage === 3
      ? depthStage >= 2
        ? 2
        : 1
      : depthStage === 1 && waveInStage === 1
      ? 1
      : randomInt(1, 2);

  const templates = [
    {
      name: 'Пещерный Паук-Ткач',
      title: `Ярус ${depthStage} · Хищник Разлома`,
      damageType: 'PHYSICAL' as const,
      baseHp: 56,
      baseAtk: 15,
      basePDef: 10,
      baseMDef: 7,
      baseSpd: 13,
      exp: 14,
      loot: {
        spiritStones: [2, 4] as [number, number],
        bogIron: [0, 1] as [number, number],
        bloodMoss: [0, 1] as [number, number],
        spiderCarapace: [1, 2] as [number, number],
      },
    },
    {
      name: 'Рудный Ползун Болот',
      title: `Ярус ${depthStage} · Дух Породы`,
      damageType: 'PHYSICAL' as const,
      baseHp: 72,
      baseAtk: 14,
      basePDef: 18,
      baseMDef: 9,
      baseSpd: 9,
      exp: 15,
      loot: {
        spiritStones: [2, 4] as [number, number],
        bogIron: [1, 2] as [number, number],
        bloodMoss: [0, 1] as [number, number],
        spiderCarapace: [0, 1] as [number, number],
      },
    },
    {
      name: 'Кровавый Мицелий-Демон',
      title: `Ярус ${depthStage} · Порождение Инь`,
      damageType: 'MAGICAL' as const,
      baseHp: 60,
      baseAtk: 16,
      basePDef: 8,
      baseMDef: 15,
      baseSpd: 12,
      exp: 16,
      loot: {
        spiritStones: [2, 5] as [number, number],
        bogIron: [0, 1] as [number, number],
        bloodMoss: [1, 2] as [number, number],
        spiderCarapace: [0, 1] as [number, number],
      },
    },
  ];

  const enemies: EnemyUnit[] = [];
  for (let i = 0; i < count; i++) {
    const tpl =
      waveInStage === 3 && i === 0
        ? {
            name: depthStage >= 2 ? 'Вожак Карстовой Бездны' : 'Страж Паучьего Гнезда',
            title: `Хозяин Яруса ${depthStage}`,
            damageType: (depthStage % 2 === 0 ? 'MAGICAL' : 'PHYSICAL') as
              | 'PHYSICAL'
              | 'MAGICAL',
            baseHp: 94,
            baseAtk: 19,
            basePDef: 16,
            baseMDef: 16,
            baseSpd: 13,
            exp: 26,
            loot: {
              spiritStones: [5, 8] as [number, number],
              bogIron: [1, 2] as [number, number],
              bloodMoss: [1, 2] as [number, number],
              spiderCarapace: [1, 2] as [number, number],
            },
          }
        : pickRandom(templates);

    const maxHp = Math.round(tpl.baseHp * scale);
    enemies.push({
      id: `enemy_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 5)}`,
      name: tpl.name,
      title: tpl.title,
      damageType: tpl.damageType,
      stats: {
        hp: maxHp,
        maxHp,
        pAtk: Math.round(tpl.baseAtk * scale),
        mAtk: Math.round(tpl.baseAtk * scale),
        pDef: Math.round(tpl.basePDef * scale),
        mDef: Math.round(tpl.baseMDef * scale),
        spd: Math.round(tpl.baseSpd + depthStage),
        crit: 6 + depthStage,
        eva: 4 + depthStage,
      },
      expReward: Math.round(tpl.exp * (1 + (depthStage - 1) * 0.25)),
      lootTable: tpl.loot,
    });
  }

  return enemies;
}

// ============================================================================
// 5. КУЛЬТИВАЦИЯ, СОФТ-КАП СРЕДЫ И ПРОРЫВ ЦАРСТВ (МОДУЛЬ 02 И 03)
// ============================================================================

export function calculateExpGain(
  rawExp: number,
  disciple: Disciple,
  sectLevel: 1 | 2
): { finalExp: number; isSoftCapped: boolean } {
  let mult = disciple.spiritRoot.expMultiplier * SECT_LEVELS[sectLevel].qiDensityBonus;
  if (disciple.daoHeart >= 20) {
    mult *= 1.15;
  }

  const isSoftCapped =
    disciple.realmTier > sectLevel ||
    (disciple.realmTier === 1 && disciple.subLevel === 5 && sectLevel === 1);

  if (isSoftCapped) {
    mult *= 0.5;
  }

  return {
    finalExp: Math.max(1, Math.round(rawExp * mult)),
    isSoftCapped,
  };
}

export function getBreakthroughChance(
  disciple: Disciple,
  sectLevel: 1 | 2,
  useBreakthroughPill: boolean
): { chancePercent: number; hasEnvPenalty: boolean } {
  if (disciple.subLevel < 5) {
    return { chancePercent: 100, hasEnvPenalty: false };
  }

  const daoState = getDaoHeartState(disciple);
  let chance = 75 + (daoState.breakthroughBonus || 0);
  if (disciple.spiritRoot.id === 'HEAVENLY_VOID') chance += 10;
  if (useBreakthroughPill) chance += 25;

  const hasEnvPenalty = sectLevel < 2;
  if (hasEnvPenalty) {
    chance -= 35;
  }

  return {
    chancePercent: Math.max(15, Math.min(100, chance)),
    hasEnvPenalty,
  };
}

export function getRealmLabel(tier: 1 | 2, subLevel: number): string {
  const tierName = tier === 1 ? t('realmTier1') : t('realmTier2');
  const suffix =
    subLevel === 5
      ? t('realmSubLevelPeak', { sub: subLevel })
      : t('realmSubLevel', { sub: subLevel });
  return `${tierName} · ${suffix}`;
}
