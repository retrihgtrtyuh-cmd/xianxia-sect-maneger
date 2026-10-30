/**
 * МОДУЛЬ ТИПОВ ДАННЫХ: IDLE SECT MANAGER (XIANXIA ALPHA MVP)
 * Содержит структуры данных Учеников (Модуль 02/07), Боя и Экспедиций (Модуль 04/05),
 * Экономики и Ремёсел (Модуль 01/05) и Эволюции Обители (Модуль 03).
 */

export type Gender = 'YIN' | 'YANG';

export type TemperamentId = 'NORMAL' | 'COWARDLY' | 'GREEDY' | 'RECKLESS';

export type ArchetypeId =
  | 'NOVICE'        // Т1: Послушник
  | 'SWORDSMAN'     // Т2: Мечник Внешнего Двора (Физ. Атака / Крит / Скорость)
  | 'GUARDIAN'      // Т2: Страж Каменного Щита (Авангард Танк: HP / Защита)
  | 'FLAME_ADEPT';  // Т2: Адепт Тайного Пламени (Маг. Атака / Духовная защита)

export type DiscipleStatus = 'IDLE' | 'EXPEDITION';

export type StatPillKey = 'pAtk' | 'mAtk' | 'pDef' | 'mDef' | 'spd' | 'maxHp';

export interface PillPotentialSlot {
  consumed: number;
  max: number;
}

export type PillGrid = Record<StatPillKey, PillPotentialSlot>;

export interface BaseStats {
  hp: number;
  maxHp: number;
  pAtk: number;
  mAtk: number;
  pDef: number;
  mDef: number;
  spd: number;
  crit: number; // в процентах (например, 8 = 8%)
  eva: number;  // в процентах (например, 5 = 5%)
}

export interface EquipmentItem {
  id: string;
  templateId: string;
  name: string;
  slot: 'WEAPON' | 'ARMOR';
  tier: 1 | 2;
  bonuses: Partial<BaseStats>;
  description: string;
}

export interface SpiritRoot {
  id: string;
  name: string;
  expMultiplier: number;
  statBias: Partial<BaseStats>;
  description: string;
}

export interface Constitution {
  id: string;
  name: string;
  pillCapBonus: number;
  statBias: Partial<BaseStats>;
  description: string;
}

export interface Disciple {
  id: string;
  name: string;
  gender: Gender;
  archetype: ArchetypeId;
  temperament: TemperamentId;
  spiritRoot: SpiritRoot;
  constitution: Constitution;
  stats: BaseStats;
  pillGrid: PillGrid;
  realmTier: 1 | 2;       // Т1 (Закалка Тела) или Т2 (Возведение Основы)
  subLevel: 1 | 2 | 3 | 4 | 5; // 1 -> 5 (Пик)
  exp: number;
  maxExp: number;
  status: DiscipleStatus;
  lineupSlot: number | null; // 0, 1, 2, 3 (соответствует Слотам 1–4)
  injuries: number;          // 0..5 стаков Стихийных Травм (5-й блокирует отдых HP)
  daoHeart: number;          // Шкала «Весы Сердца Дао» (-100..+100)
  personalStones: number;    // Личная мошна ученика (10% от добычи экспедиций)
  equippedWeapon: EquipmentItem | null;
  equippedArmor: EquipmentItem | null;
  kills: number;
  expeditionsCompleted: number;
}

export interface SectResources {
  spiritStones: number;   // Осколки духовных камней (Казна Секты)
  bogIron: number;        // Болотное железо (Т1 руда)
  bloodMoss: number;      // Кровавый мох (Т1 трава)
  spiderCarapace: number; // Панцирь паука (Т1 реагент/материал)
}

export interface SectConsumables {
  healingPills: number;      // Пилюля Исцеления Ци (+60% HP)
  injuryDecoctions: number;  // Отвар Очищения Меридианов (-2 стака травм, снимает блок 5 стака)
  breakthroughPills: number; // Пилюля Прорыва Основы (+25% к шансу прорыва)
  statPills: Record<StatPillKey, number>; // 6 видов перманентных пилюль статов (+1 к стату)
}

export interface EnemyUnit {
  id: string;
  name: string;
  title: string;
  damageType: 'PHYSICAL' | 'MAGICAL';
  stats: BaseStats;
  expReward: number;
  lootTable: {
    spiritStones: [number, number];
    bogIron: [number, number];
    bloodMoss: [number, number];
    spiderCarapace: [number, number];
  };
}

export interface ExpeditionState {
  active: boolean;
  depthStage: number; // Ярус Карстового Разлома (1..5)
  waveInStage: number; // Текущая волна (1..3)
  combatRound: number;
  enemies: EnemyUnit[];
  lootBuffer: SectResources;
  expEarnedInRun: number;
  combatLog: string[];
  isPaused: boolean;
}

export type ChronicleCategory =
  | 'RECRUIT'
  | 'COMBAT'
  | 'ECONOMY'
  | 'CRAFT'
  | 'BREAKTHROUGH'
  | 'DEATH'
  | 'DAO_HEART'
  | 'SECT';

export interface ChronicleEntry {
  id: string;
  time: string;
  category: ChronicleCategory;
  title: string;
  detail: string;
}

export interface FallenDisciple {
  id: string;
  name: string;
  realmLabel: string;
  archetypeLabel: string;
  causeOfDeath: string;
  recoveredGearNames: string[];
  time: string;
}

export interface SectLevelConfig {
  level: 1 | 2;
  name: string;
  subtitle: string;
  maxComfortTier: 1 | 2;
  passiveHealRate: number; // HP в секунду в Обители
  qiDensityBonus: number;
  upgradeCost?: SectResources;
}
