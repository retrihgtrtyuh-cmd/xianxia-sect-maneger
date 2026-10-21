/**
 * ОБИТЕЛЬ БЕССМЕРТНЫХ (IDLE SECT MANAGER — XIANXIA ALPHA MVP)
 * Одноэкранный интерфейс (100dvh без вертикального скролла страницы) с подразделами в каждом разделе нижнего меню.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Bug,
  Compass,
  Download,
  Droplets,
  Flame,
  FlaskConical,
  Gem,
  Hammer,
  HeartPulse,
  Home,
  Layers,
  Leaf,
  Package,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Skull,
  Sparkles,
  Swords,
  UserPlus,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  ArchetypeId,
  ChronicleCategory,
  ChronicleEntry,
  Disciple,
  EquipmentItem,
  ExpeditionState,
  FallenDisciple,
  SectConsumables,
  SectResources,
  StatPillKey,
} from './types/game';
import {
  ARCHETYPE_INFO,
  BLACKSMITH_RECIPES,
  calculateEffectiveStats,
  calculateExpGain,
  CHRONICLE_CATEGORY_LABELS,
  computeCombatDamage,
  CraftableGearRecipe,
  generateDisciple,
  getBreakthroughChance,
  getDaoHeartState,
  getRealmLabel,
  pickRandom,
  randomInt,
  SECT_LEVELS,
  selectLineupTarget,
  spawnKarstRiftEnemies,
  STAT_PILL_LABELS,
  syncDiscipleHp,
  TEMPERAMENT_INFO,
} from './engine/gameMath';
import { KarstRiftIllustration, SectAbodeIllustration } from './components/XianxiaArt';
import {
  Tooltip,
  formatArchetypeBonusText,
  formatArchetypeTooltip,
  formatDaoHeartTooltip,
  getDaoHeartLabel,
} from './components/Tooltip';
import { soundFX } from './utils/sound';
import { downloadStandaloneHtmlBundle } from './utils/standaloneExporter';

type ActiveTab = 'ABODE' | 'EXPEDITION' | 'CRAFTS' | 'CHRONICLE';

type AbodeSubTab = 'SANCTUARY' | 'ROSTER' | 'STATS' | 'PILLS_GEAR' | 'INVENTORY';
type ExpeditionSubTab = 'ARENA' | 'LINEUP' | 'LOG';
type CraftsSubTab = 'ELIXIRS' | 'POTENTIAL' | 'FORGE';
type ChronicleSubTab = 'EVENTS' | 'MEMORIAL';

const SAVE_STORAGE_KEY = 'idle_sect_manager_alpha_v1';

const INITIAL_RESOURCES: SectResources = {
  spiritStones: 45,
  bogIron: 8,
  bloodMoss: 8,
  spiderCarapace: 6,
};

const INITIAL_CONSUMABLES: SectConsumables = {
  healingPills: 2,
  injuryDecoctions: 1,
  breakthroughPills: 1,
  statPills: {
    pAtk: 1,
    mAtk: 1,
    pDef: 1,
    mDef: 0,
    spd: 0,
    maxHp: 1,
  },
};

const SUBLEVEL_MAX_EXP: Record<1 | 2, Record<1 | 2 | 3 | 4 | 5, number>> = {
  1: { 1: 60, 2: 90, 3: 130, 4: 185, 5: 250 },
  2: { 1: 180, 2: 250, 3: 340, 4: 460, 5: 620 },
};

interface SavedGameData {
  sectLevel?: 1 | 2;
  resources?: SectResources;
  consumables?: SectConsumables;
  warehouseGear?: EquipmentItem[];
  freeRecruitsLeft?: number;
  disciples?: Disciple[];
  fallenMemorial?: FallenDisciple[];
  chronicle?: ChronicleEntry[];
}

function loadSavedGame(): SavedGameData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGameData;
    if (parsed && Array.isArray(parsed.disciples)) {
      parsed.disciples = parsed.disciples.map((d) =>
        syncDiscipleHp(
          {
            ...d,
            status: 'IDLE',
            maxExp:
              d.maxExp && d.maxExp > 0
                ? d.maxExp
                : SUBLEVEL_MAX_EXP[d.realmTier ?? 1][d.subLevel ?? 1],
          },
          false
        )
      );
    }
    return parsed;
  } catch {
    return null;
  }
}

export default function App() {
  const saved = useRef<SavedGameData | null>(loadSavedGame());

  // Главные разделы нижнего меню и их подразделы
  const [activeTab, setActiveTab] = useState<ActiveTab>('ABODE');
  const [abodeSubTab, setAbodeSubTab] = useState<AbodeSubTab>('SANCTUARY');
  const [expeditionSubTab, setExpeditionSubTab] = useState<ExpeditionSubTab>('ARENA');
  const [craftsSubTab, setCraftsSubTab] = useState<CraftsSubTab>('ELIXIRS');
  const [chronicleSubTab, setChronicleSubTab] = useState<ChronicleSubTab>('EVENTS');

  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [chronicleFilter, setChronicleFilter] = useState<'ALL' | ChronicleCategory>('ALL');

  // Модуль 03: Уровень Обители (1 = Забытая Нора, 2 = Твердыня Глубин)
  const [sectLevel, setSectLevel] = useState<1 | 2>(saved.current?.sectLevel ?? 1);

  // Модуль 01 и 05: Ресурсы Казны и Склада Секты
  const [resources, setResources] = useState<SectResources>(
    saved.current?.resources ?? INITIAL_RESOURCES
  );
  const [consumables, setConsumables] = useState<SectConsumables>(
    saved.current?.consumables ?? INITIAL_CONSUMABLES
  );
  const [warehouseGear, setWarehouseGear] = useState<EquipmentItem[]>(
    saved.current?.warehouseGear ?? []
  );

  // Модуль 02: Чайный павильон и список живых/павших учеников
  const [freeRecruitsLeft, setFreeRecruitsLeft] = useState<number>(
    saved.current?.freeRecruitsLeft ?? 1
  );
  const [disciples, setDisciples] = useState<Disciple[]>(saved.current?.disciples ?? []);
  const [fallenMemorial, setFallenMemorial] = useState<FallenDisciple[]>(
    saved.current?.fallenMemorial ?? []
  );
  const [selectedDiscipleId, setSelectedDiscipleId] = useState<string | null>(
    saved.current?.disciples?.[0]?.id ?? null
  );

  // Таймер дара «Милость Небес»
  const [rewardedAdTimer, setRewardedAdTimer] = useState<number | null>(null);

  // Модальное окно выбора Пути 2-го царства
  const [breakthroughModalDiscipleId, setBreakthroughModalDiscipleId] = useState<string | null>(
    null
  );
  const [usePillOnBreakthrough, setUsePillOnBreakthrough] = useState<boolean>(false);
  const [selectedT2Archetype, setSelectedT2Archetype] = useState<ArchetypeId>('SWORDSMAN');

  // Модуль 04: Состояние экспедиции в «Карстовый Разлом»
  const [expedition, setExpedition] = useState<ExpeditionState>({
    active: false,
    depthStage: 1,
    waveInStage: 1,
    combatRound: 0,
    enemies: [],
    lootBuffer: { spiritStones: 0, bogIron: 0, bloodMoss: 0, spiderCarapace: 0 },
    expEarnedInRun: 0,
    combatLog: ['Отряд готов к спуску в Карстовый Разлом. Назначьте бойцов на позиции 1–4.'],
    isPaused: false,
  });

  // Летопись Секты
  const [chronicle, setChronicle] = useState<ChronicleEntry[]>(
    saved.current?.chronicle ?? [
      {
        id: 'init_1',
        time: new Date().toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        category: 'SECT',
        title: 'Основание Обители «Забытая Нора»',
        detail:
          'Защитная формация древней секты активирована. В Чайном павильоне ожидает первый кандидат в послушники.',
      },
    ]
  );

  // Автосохранение прогресса в localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const payload: SavedGameData = {
        sectLevel,
        resources,
        consumables,
        warehouseGear,
        freeRecruitsLeft,
        disciples,
        fallenMemorial,
        chronicle: chronicle.slice(0, 60),
      };
      window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage quota errors
    }
  }, [
    sectLevel,
    resources,
    consumables,
    warehouseGear,
    freeRecruitsLeft,
    disciples,
    fallenMemorial,
    chronicle,
  ]);

  const addChronicle = (category: ChronicleCategory, title: string, detail: string) => {
    const time = new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setChronicle((prev) => [
      {
        id: `chr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        time,
        category,
        title,
        detail,
      },
      ...prev.slice(0, 79),
    ]);
  };

  const stateRef = useRef({
    sectLevel,
    resources,
    consumables,
    disciples,
    expedition,
  });
  useEffect(() => {
    stateRef.current = { sectLevel, resources, consumables, disciples, expedition };
  }, [sectLevel, resources, consumables, disciples, expedition]);

  // ==========================================================================
  // 1. ЧАЙНЫЙ ПАВИЛЬОН: НАЙМ И ЗАЩИТА ОТ СОФТЛОКА «МИЛОСТЬ НЕБЕС»
  // ==========================================================================

  const RECRUIT_COST = 25;
  const isSoftlocked =
    disciples.length === 0 && freeRecruitsLeft === 0 && resources.spiritStones < RECRUIT_COST;

  const handleRecruitDisciple = (fromHeavensGrace = false) => {
    if (!fromHeavensGrace) {
      if (freeRecruitsLeft <= 0 && resources.spiritStones < RECRUIT_COST) {
        return;
      }
      if (freeRecruitsLeft > 0) {
        setFreeRecruitsLeft((prev) => prev - 1);
      } else {
        setResources((prev) => ({ ...prev, spiritStones: prev.spiritStones - RECRUIT_COST }));
      }
    }

    const newDisc = generateDisciple(fromHeavensGrace);
    const occupiedSlots = new Set(disciples.map((d) => d.lineupSlot).filter((s) => s !== null));
    for (let slot = 0; slot < 4; slot++) {
      if (!occupiedSlots.has(slot)) {
        newDisc.lineupSlot = slot;
        break;
      }
    }

    setDisciples((prev) => [...prev, newDisc]);
    setSelectedDiscipleId(newDisc.id);
    soundFX.playChime();

    const genderLabel = newDisc.gender === 'YANG' ? 'Начало Ян' : 'Начало Инь';
    const tempLabel = TEMPERAMENT_INFO[newDisc.temperament].name;

    if (fromHeavensGrace) {
      addChronicle(
        'RECRUIT',
        `Милость Небес: прибыл ${newDisc.name}`,
        `Небеса откликнулись на зов опустевшей обители и прислали послушника (${genderLabel} · Характер: ${tempLabel} · ${newDisc.spiritRoot.name}).`
      );
    } else {
      addChronicle(
        'RECRUIT',
        `Принят послушник: ${newDisc.name}`,
        `Чайный павильон: ${genderLabel} · Характер: ${tempLabel} · Корень: ${newDisc.spiritRoot.name} · Конституция: ${newDisc.constitution.name}.`
      );
    }
  };

  const triggerHeavensGraceAd = () => {
    if (rewardedAdTimer !== null) return;
    setRewardedAdTimer(2);
    const interval = window.setInterval(() => {
      setRewardedAdTimer((prev) => {
        if (prev === null || prev <= 1) {
          window.clearInterval(interval);
          handleRecruitDisciple(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ==========================================================================
  // 2. УПРАВЛЕНИЕ СТРОЕМ (ПОЗИЦИИ 1–4) И СТАТУСАМИ
  // ==========================================================================

  const assignToSlot = (discipleId: string, targetSlot: number | null) => {
    if (expedition.active) return;
    setDisciples((prev) =>
      prev.map((d) => {
        if (d.id === discipleId) {
          return { ...d, lineupSlot: targetSlot };
        }
        if (targetSlot !== null && d.lineupSlot === targetSlot) {
          return { ...d, lineupSlot: null };
        }
        return d;
      })
    );
  };

  const getSquadInLineupOrder = (allDisciples: Disciple[]): Disciple[] => {
    return allDisciples
      .filter((d) => d.lineupSlot !== null)
      .sort((a, b) => (a.lineupSlot ?? 99) - (b.lineupSlot ?? 99));
  };

  // ==========================================================================
  // 3. ЗАПУСК ЭКСПЕДИЦИИ, СБОР БУФЕРА ДОБЫЧИ (90/10) И ОТСТУПЛЕНИЕ
  // ==========================================================================

  const startExpedition = () => {
    const squad = getSquadInLineupOrder(disciples);
    if (squad.length === 0) return;

    setDisciples((prev) =>
      prev.map((d) => (d.lineupSlot !== null ? { ...d, status: 'EXPEDITION' } : d))
    );

    const initialEnemies = spawnKarstRiftEnemies(expedition.depthStage, 1);
    setExpedition((prev) => ({
      ...prev,
      active: true,
      waveInStage: 1,
      combatRound: 1,
      enemies: initialEnemies,
      isPaused: false,
      combatLog: [
        `[Ярус ${prev.depthStage} · Волна 1/3] Отряд (${squad.map((s) => s.name).join(', ')}) спустился в Карстовый Разлом. Авангард: ${squad[0].name}.`,
        ...prev.combatLog.slice(0, 24),
      ],
    }));

    addChronicle(
      'COMBAT',
      `Поход в Карстовый Разлом (Ярус ${expedition.depthStage})`,
      `В строй встали ${squad.length} адептов. Первую позицию авангарда занимает ${squad[0].name}.`
    );
    setActiveTab('EXPEDITION');
    setExpeditionSubTab('ARENA');
  };

  const claimLootBuffer = () => {
    const buf = expedition.lootBuffer;
    const totalItems = buf.spiritStones + buf.bogIron + buf.bloodMoss + buf.spiderCarapace;
    if (totalItems === 0) return;

    const squad = getSquadInLineupOrder(disciples);
    const activeReceivers = squad.length > 0 ? squad : disciples;

    const avgCut =
      activeReceivers.length > 0
        ? activeReceivers.reduce(
            (sum, d) => sum + TEMPERAMENT_INFO[d.temperament].lootCutPercent,
            0
          ) / activeReceivers.length
        : 0.1;

    const discipleStonesFromStones =
      buf.spiritStones > 0 ? Math.max(1, Math.round(buf.spiritStones * avgCut)) : 0;
    const sectStonesGain = Math.max(0, buf.spiritStones - discipleStonesFromStones);

    const splitMaterial = (total: number) => {
      if (total <= 0) return { sect: 0, disciplePart: 0 };
      const disciplePart = total >= 6 ? Math.max(1, Math.round(total * avgCut)) : 0;
      return { sect: total - disciplePart, disciplePart };
    };

    const ironSplit = splitMaterial(buf.bogIron);
    const mossSplit = splitMaterial(buf.bloodMoss);
    const carapaceSplit = splitMaterial(buf.spiderCarapace);

    const totalDisciplePurseGain =
      discipleStonesFromStones +
      ironSplit.disciplePart +
      mossSplit.disciplePart +
      carapaceSplit.disciplePart * 2;

    setResources((prev) => ({
      spiritStones: prev.spiritStones + sectStonesGain,
      bogIron: prev.bogIron + ironSplit.sect,
      bloodMoss: prev.bloodMoss + mossSplit.sect,
      spiderCarapace: prev.spiderCarapace + carapaceSplit.sect,
    }));

    if (activeReceivers.length > 0 && totalDisciplePurseGain > 0) {
      const basePerDisc = Math.floor(totalDisciplePurseGain / activeReceivers.length);
      let remainder = totalDisciplePurseGain % activeReceivers.length;
      const receiverIds = new Set(activeReceivers.map((d) => d.id));

      setDisciples((prev) =>
        prev.map((d) => {
          if (!receiverIds.has(d.id)) return d;
          const extra = remainder > 0 ? 1 : 0;
          if (remainder > 0) remainder--;
          return { ...d, personalStones: d.personalStones + basePerDisc + extra };
        })
      );
    }

    setExpedition((prev) => ({
      ...prev,
      lootBuffer: { spiritStones: 0, bogIron: 0, bloodMoss: 0, spiderCarapace: 0 },
      combatLog: [
        `[Трофеи собраны] Казна и Склад (90%): +${sectStonesGain} камней, +${ironSplit.sect} железа, +${mossSplit.sect} мха, +${carapaceSplit.sect} панцирей. В мошну отряда (10%): +${totalDisciplePurseGain} камней.`,
        ...prev.combatLog.slice(0, 26),
      ],
    }));

    soundFX.playCoin();
    addChronicle(
      'ECONOMY',
      'Разделение добычи похода (90% / 10%)',
      `На Склад Секты поступило: +${sectStonesGain} камней, +${ironSplit.sect} болотного железа, +${mossSplit.sect} кровавого мха, +${carapaceSplit.sect} панцирей. В личные мошны учеников передано +${totalDisciplePurseGain} камней.`
    );
  };

  const emergencyRetreat = () => {
    if (!expedition.active) return;

    const injuredNames: string[] = [];
    const blockedNames: string[] = [];

    setDisciples((prev) =>
      prev.map((d) => {
        if (d.status !== 'EXPEDITION') return d;
        const eff = calculateEffectiveStats(d);
        const hpRatio = eff.hp / eff.maxHp;

        let newInjuries = d.injuries;
        if (hpRatio < 0.4) {
          const riskBonus = TEMPERAMENT_INFO[d.temperament].injuryRiskBonus;
          if (Math.random() < 0.85 + riskBonus) {
            newInjuries = Math.min(5, d.injuries + 1);
            injuredNames.push(`${d.name} (${newInjuries}/5)`);
            if (newInjuries >= 5) {
              blockedNames.push(d.name);
            }
          }
        }

        return syncDiscipleHp(
          {
            ...d,
            status: 'IDLE',
            injuries: newInjuries,
          },
          false
        );
      })
    );

    setExpedition((prev) => ({
      ...prev,
      active: false,
      enemies: [],
      combatLog: [
        `[Отступление в Обитель] Отряд покинул Разлом.${
          injuredNames.length > 0
            ? ` Получены стихийные травмы (здоровье < 40%): ${injuredNames.join(', ')}.`
            : ' Отход прошёл без повреждения меридианов.'
        }`,
        ...prev.combatLog.slice(0, 26),
      ],
    }));

    addChronicle(
      'COMBAT',
      'Экстренное отступление в Обитель',
      injuredNames.length > 0
        ? `Отряд отступил из Разлома. Из-за тяжёлых ранений (здоровье ниже 40%) получены стихийные травмы: ${injuredNames.join(', ')}.${
            blockedNames.length > 0
              ? ` У ${blockedNames.join(', ')} накоплено 5/5 травм — естественный отдых заблокирован до приёма Отвара Очищения!`
              : ''
          }`
        : 'Отряд организованно вернулся в Обитель без новых травм.'
    );
  };

  // ==========================================================================
  // 4. ГЛАВНЫЙ ИГРОВОЙ ЦИКЛ
  // ==========================================================================

  const executeCombatStep = () => {
    const { sectLevel: curSectLevel, disciples: curDisciples, expedition: curExp } =
      stateRef.current;
    if (!curExp.active || curExp.isPaused) return;

    const squad = getSquadInLineupOrder(curDisciples).filter((d) => d.status === 'EXPEDITION');
    if (squad.length === 0) {
      setExpedition((prev) => ({ ...prev, active: false, enemies: [] }));
      return;
    }

    const hadDefeatedWave =
      curExp.enemies.length > 0 && curExp.enemies.every((e) => e.stats.hp <= 0);
    if (hadDefeatedWave) {
      const nextWave = curExp.waveInStage >= 3 ? 1 : curExp.waveInStage + 1;
      const nextStage =
        curExp.waveInStage >= 3 ? Math.min(5, curExp.depthStage + 1) : curExp.depthStage;
      const nextEnemies = spawnKarstRiftEnemies(nextStage, nextWave);

      setExpedition((prev) => ({
        ...prev,
        depthStage: nextStage,
        waveInStage: nextWave,
        combatRound: 1,
        enemies: nextEnemies,
        combatLog: [
          `[Ярус ${nextStage} · Волна ${nextWave}/3] Из глубин Разлома появляются новые противники: ${nextEnemies
            .map((e) => e.name)
            .join(', ')}.`,
          ...prev.combatLog.slice(0, 28),
        ],
      }));
      return;
    }

    let currentEnemies =
      curExp.enemies.length > 0
        ? curExp.enemies.map((e) => ({ ...e, stats: { ...e.stats } }))
        : spawnKarstRiftEnemies(curExp.depthStage, curExp.waveInStage);

    const roundTag = `[Раунд ${curExp.combatRound}]`;
    const newEventsTopFirst: string[] = [];
    let updatedDisciples = curDisciples.map((d) => syncDiscipleHp(d, false));
    const newlyFallen: FallenDisciple[] = [];
    const recoveredGearToWarehouse: EquipmentItem[] = [];

    const sortedSquad = [...squad].sort(
      (a, b) => calculateEffectiveStats(b).spd - calculateEffectiveStats(a).spd
    );

    for (const member of sortedSquad) {
      const aliveEnemies = currentEnemies.filter((e) => e.stats.hp > 0);
      if (aliveEnemies.length === 0) break;

      const targetEnemy = aliveEnemies[0];
      const eff = calculateEffectiveStats(member);
      const archInfo = ARCHETYPE_INFO[member.archetype];
      const isMagical = archInfo.attackType === 'MAGICAL' || eff.mAtk > eff.pAtk + 3;

      const atkVal = isMagical ? eff.mAtk : eff.pAtk;
      const defVal = isMagical ? targetEnemy.stats.mDef : targetEnemy.stats.pDef;

      const result = computeCombatDamage(atkVal, defVal, eff.crit, targetEnemy.stats.eva);
      if (result.isEvaded) {
        newEventsTopFirst.unshift(
          `${roundTag} ${member.name} атакует, но ${targetEnemy.name} уклоняется от выпада.`
        );
      } else {
        targetEnemy.stats.hp = Math.max(0, targetEnemy.stats.hp - result.damage);
        soundFX.playHit(result.isCrit);
        newEventsTopFirst.unshift(
          `${roundTag} ${member.name} наносит ${result.damage} ед. ${
            isMagical ? 'духовного' : 'физического'
          } урона по «${targetEnemy.name}»${result.isCrit ? ' (критический удар!)' : ''} — здоровье врага: ${
            targetEnemy.stats.hp
          }/${targetEnemy.stats.maxHp}.`
        );

        if (targetEnemy.stats.hp <= 0) {
          newEventsTopFirst.unshift(`${roundTag} ⚔ Противник «${targetEnemy.name}» повержен!`);
          updatedDisciples = updatedDisciples.map((d) =>
            d.id === member.id ? { ...d, kills: d.kills + 1 } : d
          );
        }
      }
    }

    const survivingEnemies = currentEnemies.filter((e) => e.stats.hp > 0);
    for (const enemy of survivingEnemies) {
      const aliveSquadNow = getSquadInLineupOrder(updatedDisciples).filter(
        (d) => d.status === 'EXPEDITION' && d.stats.hp > 0
      );
      if (aliveSquadNow.length === 0) break;

      const targetDisciple = selectLineupTarget(aliveSquadNow);
      const targetEff = calculateEffectiveStats(targetDisciple);
      const isEnemyMag = enemy.damageType === 'MAGICAL';
      const eAtk = isEnemyMag ? enemy.stats.mAtk : enemy.stats.pAtk;
      const dDef = isEnemyMag ? targetEff.mDef : targetEff.pDef;

      const hit = computeCombatDamage(eAtk, dDef, enemy.stats.crit, targetEff.eva);
      const posLabel = `Позиция ${(targetDisciple.lineupSlot ?? 0) + 1}`;

      if (hit.isEvaded) {
        newEventsTopFirst.unshift(
          `${roundTag} ${enemy.name} атакует (${posLabel}: ${targetDisciple.name}), но ученик уходит от удара!`
        );
      } else {
        const newHp = Math.max(0, targetEff.hp - hit.damage);
        const hpRatioAfter = newHp / targetEff.maxHp;

        newEventsTopFirst.unshift(
          `${roundTag} ${enemy.name} бьёт по ${targetDisciple.name} (${posLabel}): -${hit.damage} здоровья${
            hit.isCrit ? ' (критический урон!)' : ''
          } — остаток: ${newHp}/${targetEff.maxHp}.`
        );

        let awakenedDao = targetDisciple.daoHeart;
        if (newHp > 0 && hpRatioAfter < 0.1 && targetDisciple.daoHeart < 20) {
          awakenedDao = Math.min(100, targetDisciple.daoHeart + 25);
          soundFX.playChime();
          newEventsTopFirst.unshift(
            `${roundTag} ✦ ПРОБУЖДЕНИЕ СЕРДЦА ДАО! Выжив на грани гибели (${newHp}/${targetEff.maxHp}), ${targetDisciple.name} обретает просветление!`
          );
          addChronicle(
            'DAO_HEART',
            `Пробуждение «Сердца Дао»: ${targetDisciple.name}`,
            `Устояв перед смертельным ударом на краю гибели, ученик укрепил Сердце Дао до ступени «${getDaoHeartLabel(
              awakenedDao
            )}».`
          );
        }

        if (newHp <= 0) {
          const otherSurvivors = aliveSquadNow.filter((d) => d.id !== targetDisciple.id);
          const gearNames: string[] = [];
          if (otherSurvivors.length > 0) {
            if (targetDisciple.equippedWeapon) {
              recoveredGearToWarehouse.push(targetDisciple.equippedWeapon);
              gearNames.push(targetDisciple.equippedWeapon.name);
            }
            if (targetDisciple.equippedArmor) {
              recoveredGearToWarehouse.push(targetDisciple.equippedArmor);
              gearNames.push(targetDisciple.equippedArmor.name);
            }
          }

          newlyFallen.push({
            id: targetDisciple.id,
            name: targetDisciple.name,
            realmLabel: getRealmLabel(targetDisciple.realmTier, targetDisciple.subLevel),
            archetypeLabel: ARCHETYPE_INFO[targetDisciple.archetype].name,
            causeOfDeath: `Пал в бою с «${enemy.name}» (Карстовый Разлом, Ярус ${curExp.depthStage})`,
            recoveredGearNames: gearNames,
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          });

          newEventsTopFirst.unshift(
            `${roundTag} ☠ ГИБЕЛЬ В БОЮ: ${targetDisciple.name} пал смертью храбрых! ${
              gearNames.length > 0
                ? `Соратники сохранили его снаряжение (${gearNames.join(', ')}) и передали на склад.`
                : ''
            }`
          );

          addChronicle(
            'DEATH',
            `Гибель ученика: ${targetDisciple.name}`,
            `Пал в Карстовом Разломе от удара «${enemy.name}». ${
              gearNames.length > 0
                ? `Выжившие товарищи вернули экипировку на Склад Секты: ${gearNames.join(', ')}.`
                : 'Снаряжения при себе не было или отряд полностью разбит.'
            }`
          );

          updatedDisciples = updatedDisciples.filter((d) => d.id !== targetDisciple.id);
        } else {
          updatedDisciples = updatedDisciples.map((d) =>
            d.id === targetDisciple.id
              ? {
                  ...d,
                  daoHeart: awakenedDao,
                  stats: { ...d.stats, hp: newHp },
                }
              : d
          );
        }
      }
    }

    if (recoveredGearToWarehouse.length > 0) {
      setWarehouseGear((prev) => [...prev, ...recoveredGearToWarehouse]);
    }
    if (newlyFallen.length > 0) {
      setFallenMemorial((prev) => [...newlyFallen, ...prev]);
    }

    const remainingSquad = getSquadInLineupOrder(updatedDisciples).filter(
      (d) => d.status === 'EXPEDITION'
    );

    if (remainingSquad.length === 0) {
      setDisciples(updatedDisciples);
      setExpedition((prev) => ({
        ...prev,
        active: false,
        enemies: [],
        combatLog: [
          'Весь отряд пал в Карстовом Разломе. Поход завершён.',
          ...newEventsTopFirst,
          ...prev.combatLog.slice(0, 24),
        ],
      }));
      return;
    }

    const aliveEnemiesAfter = currentEnemies.filter((e) => e.stats.hp > 0);
    if (aliveEnemiesAfter.length === 0) {
      let addStones = 0;
      let addIron = 0;
      let addMoss = 0;
      let addCarapace = 0;
      let rawWaveExp = 0;

      const greedyMult = Math.max(
        ...remainingSquad.map((d) => TEMPERAMENT_INFO[d.temperament].lootBonusMultiplier)
      );

      for (const defeated of currentEnemies) {
        addStones += Math.round(randomInt(...defeated.lootTable.spiritStones) * greedyMult);
        addIron += Math.round(randomInt(...defeated.lootTable.bogIron) * greedyMult);
        addMoss += Math.round(randomInt(...defeated.lootTable.bloodMoss) * greedyMult);
        addCarapace += Math.round(randomInt(...defeated.lootTable.spiderCarapace) * greedyMult);
        rawWaveExp += defeated.expReward;
      }

      const perMemberBaseExp = Math.max(
        5,
        Math.round(rawWaveExp / Math.sqrt(remainingSquad.length))
      );

      updatedDisciples = updatedDisciples.map((d) => {
        if (d.status !== 'EXPEDITION') return d;
        const { finalExp } = calculateExpGain(perMemberBaseExp, d, curSectLevel);
        return {
          ...d,
          exp: Math.min(d.maxExp, d.exp + finalExp),
          expeditionsCompleted: d.expeditionsCompleted + (curExp.waveInStage === 3 ? 1 : 0),
        };
      });

      newEventsTopFirst.unshift(
        `★ Волна ${curExp.waveInStage}/3 зачищена! Трофеи в буфер: +${addStones} камней, +${addIron} железа, +${addMoss} мха, +${addCarapace} панцирей.`
      );

      setDisciples(updatedDisciples);
      setExpedition((prev) => ({
        ...prev,
        enemies: currentEnemies,
        expEarnedInRun: prev.expEarnedInRun + perMemberBaseExp,
        lootBuffer: {
          spiritStones: prev.lootBuffer.spiritStones + addStones,
          bogIron: prev.lootBuffer.bogIron + addIron,
          bloodMoss: prev.lootBuffer.bloodMoss + addMoss,
          spiderCarapace: prev.lootBuffer.spiderCarapace + addCarapace,
        },
        combatLog: [...newEventsTopFirst, ...prev.combatLog.slice(0, 28)],
      }));
    } else {
      setDisciples(updatedDisciples);
      setExpedition((prev) => ({
        ...prev,
        combatRound: prev.combatRound + 1,
        enemies: currentEnemies,
        combatLog: [...newEventsTopFirst, ...prev.combatLog.slice(0, 28)],
      }));
    }
  };

  const executeSectIdleTick = () => {
    const { sectLevel: curSectLevel, resources: curRes, disciples: curDisciples } =
      stateRef.current;
    if (curDisciples.length === 0) return;

    const baseHeal = SECT_LEVELS[curSectLevel].passiveHealRate;

    let nextDisciples = curDisciples.map((d) => {
      const eff = calculateEffectiveStats(d);
      if (d.status !== 'IDLE') return syncDiscipleHp(d, false);
      if (d.injuries >= 5) {
        return syncDiscipleHp(d, false);
      }
      if (eff.hp >= eff.maxHp) return syncDiscipleHp(d, false);

      const injurySlowdown = Math.max(0.2, 1 - d.injuries * 0.2);
      const healAmount = Math.max(1, Math.round(baseHeal * injurySlowdown));
      return {
        ...d,
        stats: {
          ...d.stats,
          hp: Math.min(eff.maxHp, eff.hp + healAmount),
        },
      };
    });

    const candidates = nextDisciples.filter((d) => {
      if (d.status !== 'IDLE') return false;
      const eff = calculateEffectiveStats(d);
      const needsMedical = (d.injuries > 0 || eff.hp < eff.maxHp * 0.85) && d.personalStones >= 5;
      const wantsTraining = d.personalStones >= 10 && d.exp < d.maxExp;
      return needsMedical || wantsTraining;
    });

    if (candidates.length > 0 && Math.random() < 0.25) {
      const buyer = pickRandom(candidates);
      const eff = calculateEffectiveStats(buyer);

      if (
        (buyer.injuries > 0 || eff.hp < eff.maxHp * 0.85) &&
        curRes.bloodMoss >= 2 &&
        buyer.personalStones >= 5
      ) {
        const price = 5;
        setResources((prev) => ({
          ...prev,
          spiritStones: prev.spiritStones + price,
          bloodMoss: Math.max(0, prev.bloodMoss - 1),
        }));
        nextDisciples = nextDisciples.map((d) =>
          d.id === buyer.id
            ? {
                ...d,
                personalStones: d.personalStones - price,
                injuries: Math.max(0, d.injuries - 1),
                stats: { ...d.stats, hp: Math.min(eff.maxHp, eff.hp + 30) },
              }
            : d
        );
        addChronicle(
          'ECONOMY',
          `Заказ у Алхимика: ${buyer.name}`,
          `${buyer.name} приобрёл со Склада 1 ед. кровавого мха за ${price} личных камней (в Казну Секты) и принял целебный настой (+30 здоровья, -1 травма).`
        );
      } else if (curRes.bogIron >= 3 && buyer.personalStones >= 10 && buyer.exp < buyer.maxExp) {
        const price = 6;
        setResources((prev) => ({
          ...prev,
          spiritStones: prev.spiritStones + price,
          bogIron: Math.max(0, prev.bogIron - 1),
        }));
        nextDisciples = nextDisciples.map((d) =>
          d.id === buyer.id
            ? {
                ...d,
                personalStones: d.personalStones - price,
                exp: Math.min(d.maxExp, d.exp + 6),
              }
            : d
        );
        addChronicle(
          'ECONOMY',
          `Обмен со Складом: ${buyer.name}`,
          `${buyer.name} выкупил со Склада 1 ед. болотного железа за ${price} личных камней (в Казну Секты) для закалки оружия (+6 опыта).`
        );
      }
    }

    setDisciples(nextDisciples);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      executeCombatStep();
      executeSectIdleTick();
    }, 1250);
    return () => window.clearInterval(timer);
  }, []);

  // ==========================================================================
  // 5. КУЛЬТИВАЦИЯ, ПРОРЫВ СТУПЕНЕЙ И ВОЗВЫШЕНИЕ ВО 2-Е ЦАРСТВО
  // ==========================================================================

  const handleBreakthroughClick = (disciple: Disciple) => {
    if (disciple.exp < disciple.maxExp) return;

    if (disciple.subLevel < 5) {
      const nextSub = (disciple.subLevel + 1) as 1 | 2 | 3 | 4 | 5;
      const nextMaxExp = SUBLEVEL_MAX_EXP[disciple.realmTier][nextSub];

      setDisciples((prev) =>
        prev.map((d) => {
          if (d.id !== disciple.id) return d;
          const upgraded: Disciple = {
            ...d,
            subLevel: nextSub,
            exp: 0,
            maxExp: nextMaxExp,
            stats: {
              ...d.stats,
              maxHp: d.stats.maxHp + 14,
              pAtk: d.stats.pAtk + 2,
              mAtk: d.stats.mAtk + 2,
              pDef: d.stats.pDef + 2,
              mDef: d.stats.mDef + 2,
              spd: d.stats.spd + 1,
            },
          };
          return syncDiscipleHp(upgraded, true);
        })
      );

      soundFX.playChime();
      addChronicle(
        'BREAKTHROUGH',
        `Прорыв ступени: ${disciple.name}`,
        `Достигнута новая вершина: ${getRealmLabel(disciple.realmTier, nextSub)}. Здоровье полностью восстановлено, параметры выросли!`
      );
      return;
    }

    if (disciple.realmTier === 1 && disciple.subLevel === 5) {
      setBreakthroughModalDiscipleId(disciple.id);
      setUsePillOnBreakthrough(consumables.breakthroughPills > 0);
      setSelectedT2Archetype('SWORDSMAN');
    }
  };

  const confirmRealmT2Breakthrough = () => {
    const disc = disciples.find((d) => d.id === breakthroughModalDiscipleId);
    if (!disc) return;

    const consumingPill = usePillOnBreakthrough && consumables.breakthroughPills > 0;
    if (consumingPill) {
      setConsumables((prev) => ({ ...prev, breakthroughPills: prev.breakthroughPills - 1 }));
    }

    const { chancePercent } = getBreakthroughChance(disc, sectLevel, consumingPill);
    const roll = Math.random() * 100;

    if (roll <= chancePercent) {
      const archName = ARCHETYPE_INFO[selectedT2Archetype].name;
      setDisciples((prev) =>
        prev.map((d) => {
          if (d.id !== disc.id) return d;
          const ascended: Disciple = {
            ...d,
            realmTier: 2,
            subLevel: 1,
            archetype: selectedT2Archetype,
            exp: 0,
            maxExp: SUBLEVEL_MAX_EXP[2][1],
            stats: {
              ...d.stats,
              maxHp: d.stats.maxHp + 30,
              pAtk: d.stats.pAtk + 5,
              mAtk: d.stats.mAtk + 5,
              pDef: d.stats.pDef + 4,
              mDef: d.stats.mDef + 4,
            },
          };
          return syncDiscipleHp(ascended, true);
        })
      );
      soundFX.playChime();
      addChronicle(
        'BREAKTHROUGH',
        `Возвышение в царство Возведения Основы: ${disc.name}`,
        `${disc.name} успешно преодолел испытание (шанс ${chancePercent}%) и избрал боевой путь «${archName}»!`
      );
    } else {
      setDisciples((prev) =>
        prev.map((d) => {
          if (d.id !== disc.id) return d;
          const eff = calculateEffectiveStats(d);
          return {
            ...d,
            exp: Math.floor(d.maxExp * 0.5),
            injuries: Math.min(5, d.injuries + 1),
            stats: { ...d.stats, hp: Math.max(10, Math.floor(eff.hp * 0.6)) },
          };
        })
      );
      addChronicle(
        'BREAKTHROUGH',
        `Срыв прорыва: ${disc.name}`,
        `Из-за нехватки плотности Ци (шанс составлял ${chancePercent}%) прорыв сорвался. Меридианы повреждены (+1 травма, потеряна половина накопленного опыта).`
      );
    }

    setBreakthroughModalDiscipleId(null);
  };

  // ==========================================================================
  // 6. ПАВИЛЬОН РЕМЁСЕЛ (АЛХИМИК И КУЗНЕЦ)
  // ==========================================================================

  const canAfford = (cost: SectResources): boolean => {
    return (
      resources.spiritStones >= cost.spiritStones &&
      resources.bogIron >= cost.bogIron &&
      resources.bloodMoss >= cost.bloodMoss &&
      resources.spiderCarapace >= cost.spiderCarapace
    );
  };

  const spendResources = (cost: SectResources) => {
    setResources((prev) => ({
      spiritStones: prev.spiritStones - cost.spiritStones,
      bogIron: prev.bogIron - cost.bogIron,
      bloodMoss: prev.bloodMoss - cost.bloodMoss,
      spiderCarapace: prev.spiderCarapace - cost.spiderCarapace,
    }));
  };

  const craftBlacksmithItem = (recipe: CraftableGearRecipe) => {
    if (!canAfford(recipe.cost)) return;
    spendResources(recipe.cost);

    const newItem: EquipmentItem = {
      id: `gear_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      templateId: recipe.templateId,
      name: recipe.name,
      slot: recipe.slot,
      tier: recipe.tier,
      bonuses: recipe.bonuses,
      description: recipe.description,
    };

    setWarehouseGear((prev) => [newItem, ...prev]);
    soundFX.playChime();
    addChronicle(
      'CRAFT',
      `Кузня Секты: выкован «${recipe.name}»`,
      `Предмет помещён на Склад Секты. Передайте его ученику.`
    );
  };

  const craftAlchemyConsumable = (
    type: 'HEAL' | 'INJURY' | 'BREAKTHROUGH' | StatPillKey
  ) => {
    if (type === 'HEAL') {
      const cost = { spiritStones: 8, bogIron: 0, bloodMoss: 3, spiderCarapace: 0 };
      if (!canAfford(cost)) return;
      spendResources(cost);
      setConsumables((prev) => ({ ...prev, healingPills: prev.healingPills + 1 }));
      soundFX.playChime();
      addChronicle(
        'CRAFT',
        'Алхимик: сварена Пилюля Исцеления Ци',
        'Пополнены запасы целебных эликсиров (+60% здоровья).'
      );
    } else if (type === 'INJURY') {
      const cost = { spiritStones: 10, bogIron: 0, bloodMoss: 2, spiderCarapace: 3 };
      if (!canAfford(cost)) return;
      spendResources(cost);
      setConsumables((prev) => ({ ...prev, injuryDecoctions: prev.injuryDecoctions + 1 }));
      soundFX.playChime();
      addChronicle(
        'CRAFT',
        'Алхимик: приготовлен Отвар Очищения Меридианов',
        'Снимает до 2 стаков стихийных травм и разблокирует естественный отдых при 5 травмах.'
      );
    } else if (type === 'BREAKTHROUGH') {
      const cost = { spiritStones: 20, bogIron: 2, bloodMoss: 4, spiderCarapace: 4 };
      if (!canAfford(cost)) return;
      spendResources(cost);
      setConsumables((prev) => ({ ...prev, breakthroughPills: prev.breakthroughPills + 1 }));
      soundFX.playChime();
      addChronicle(
        'CRAFT',
        'Алхимик: создана Пилюля Прорыва Основы',
        'Повышает шанс успешного возвышения во второе царство на +25%.'
      );
    } else {
      const cost = { spiritStones: 12, bogIron: 2, bloodMoss: 2, spiderCarapace: 1 };
      if (!canAfford(cost)) return;
      spendResources(cost);
      setConsumables((prev) => ({
        ...prev,
        statPills: { ...prev.statPills, [type]: prev.statPills[type] + 1 },
      }));
      soundFX.playChime();
      addChronicle(
        'CRAFT',
        `Алхимик: сварена «${STAT_PILL_LABELS[type].name}»`,
        `Эликсир потенциала (${STAT_PILL_LABELS[type].bonusText}) отправлен на склад.`
      );
    }
  };

  const applyHealingPill = (discipleId: string) => {
    if (consumables.healingPills <= 0) return;
    setConsumables((prev) => ({ ...prev, healingPills: prev.healingPills - 1 }));
    setDisciples((prev) =>
      prev.map((d) => {
        if (d.id !== discipleId) return d;
        const eff = calculateEffectiveStats(d);
        const heal = Math.round(eff.maxHp * 0.6);
        return {
          ...d,
          stats: { ...d.stats, hp: Math.min(eff.maxHp, eff.hp + heal) },
        };
      })
    );
    soundFX.playChime();
  };

  const applyInjuryDecoction = (discipleId: string) => {
    if (consumables.injuryDecoctions <= 0) return;
    const target = disciples.find((d) => d.id === discipleId);
    if (!target || target.injuries === 0) return;

    setConsumables((prev) => ({ ...prev, injuryDecoctions: prev.injuryDecoctions - 1 }));
    setDisciples((prev) =>
      prev.map((d) =>
        d.id === discipleId ? { ...d, injuries: Math.max(0, d.injuries - 2) } : d
      )
    );
    soundFX.playChime();
    addChronicle(
      'CRAFT',
      `Исцеление меридианов: ${target.name}`,
      `Принят Отвар Очищения. Стихийные травмы снижены (${target.injuries} → ${Math.max(
        0,
        target.injuries - 2
      )}).`
    );
  };

  const feedPermanentStatPill = (discipleId: string, statKey: StatPillKey) => {
    if (consumables.statPills[statKey] <= 0) return;
    const target = disciples.find((d) => d.id === discipleId);
    if (!target) return;

    const slot = target.pillGrid[statKey];
    if (slot.consumed >= slot.max) return;

    setConsumables((prev) => ({
      ...prev,
      statPills: { ...prev.statPills, [statKey]: prev.statPills[statKey] - 1 },
    }));

    setDisciples((prev) =>
      prev.map((d) => {
        if (d.id !== discipleId) return d;
        const updatedSlot = {
          consumed: d.pillGrid[statKey].consumed + 1,
          max: d.pillGrid[statKey].max,
        };
        const hpBump = statKey === 'maxHp' ? 12 : 0;
        const updatedDisc: Disciple = {
          ...d,
          pillGrid: { ...d.pillGrid, [statKey]: updatedSlot },
          stats: {
            ...d.stats,
            hp: d.stats.hp + hpBump,
          },
        };
        return syncDiscipleHp(updatedDisc, false);
      })
    );

    soundFX.playChime();
    addChronicle(
      'CRAFT',
      `Усвоена пилюля потенциала: ${target.name}`,
      `Принята «${STAT_PILL_LABELS[statKey].name}» (${slot.consumed + 1}/${slot.max}). ${
        STAT_PILL_LABELS[statKey].bonusText
      }.`
    );
  };

  const equipGearOnDisciple = (discipleId: string, gearId: string) => {
    const item = warehouseGear.find((g) => g.id === gearId);
    const target = disciples.find((d) => d.id === discipleId);
    if (!item || !target) return;

    const previousItem =
      item.slot === 'WEAPON' ? target.equippedWeapon : target.equippedArmor;

    setWarehouseGear((prev) => {
      const filtered = prev.filter((g) => g.id !== gearId);
      return previousItem ? [previousItem, ...filtered] : filtered;
    });

    setDisciples((prev) =>
      prev.map((d) => {
        if (d.id !== discipleId) return d;
        const nextDisc =
          item.slot === 'WEAPON'
            ? { ...d, equippedWeapon: item }
            : { ...d, equippedArmor: item };
        const newEff = calculateEffectiveStats(nextDisc);
        const bonusHp = item.bonuses.maxHp ?? 0;
        return {
          ...nextDisc,
          stats: {
            ...nextDisc.stats,
            hp: Math.min(newEff.maxHp, d.stats.hp + Math.max(0, bonusHp)),
          },
        };
      })
    );
    soundFX.playChime();
  };

  const handleUpgradeSectLevel = () => {
    if (sectLevel !== 1) return;
    const cost = SECT_LEVELS[1].upgradeCost;
    if (!cost || !canAfford(cost)) return;

    spendResources(cost);
    setSectLevel(2);
    soundFX.playChime();
    addChronicle(
      'SECT',
      'Возвышение Обители: «Твердыня Глубин» (II ступень)',
      'Древний массив Инь-Ци пробуждён! Снято ограничение среды для прорыва во 2-е царство, отдых ускорен до 10 ед. здоровья за тик, прирост опыта увеличен на +35%.'
    );
  };

  const resetAlphaState = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SAVE_STORAGE_KEY);
    }
    setSectLevel(1);
    setResources(INITIAL_RESOURCES);
    setConsumables(INITIAL_CONSUMABLES);
    setWarehouseGear([]);
    setFreeRecruitsLeft(1);
    setDisciples([]);
    setFallenMemorial([]);
    setSelectedDiscipleId(null);
    setExpedition({
      active: false,
      depthStage: 1,
      waveInStage: 1,
      combatRound: 0,
      enemies: [],
      lootBuffer: { spiritStones: 0, bogIron: 0, bloodMoss: 0, spiderCarapace: 0 },
      expEarnedInRun: 0,
      combatLog: ['Летопись начата заново. Примите первого послушника в Чайном павильоне.'],
      isPaused: false,
    });
    setChronicle([
      {
        id: `reset_${Date.now()}`,
        time: new Date().toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        category: 'SECT',
        title: 'Новое основание Обители',
        detail: 'Хроники секты очищены. В Чайном павильоне доступен бесплатный найм послушника.',
      },
    ]);
  };

  const selectedDisciple =
    disciples.find((d) => d.id === selectedDiscipleId) ?? disciples[0] ?? null;

  const squadInSlots: (Disciple | null)[] = [0, 1, 2, 3].map(
    (slotIdx) => disciples.find((d) => d.lineupSlot === slotIdx) ?? null
  );

  const lootBufferTotal =
    expedition.lootBuffer.spiritStones +
    expedition.lootBuffer.bogIron +
    expedition.lootBuffer.bloodMoss +
    expedition.lootBuffer.spiderCarapace;

  const filteredChronicle =
    chronicleFilter === 'ALL'
      ? chronicle
      : chronicle.filter((c) => c.category === chronicleFilter);

  const anyReadyBreakthrough = disciples.some((d) => d.exp >= d.maxExp);

  // Компонент компактного выбора активного ученика для подразделов «Характеристики», «Пилюли и Доспехи» и «Ремёсла»
  const renderDiscipleSelectorBar = () => {
    if (disciples.length === 0) return null;
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
        <span className="text-[11px] text-[#94A3B8] shrink-0">Адепт:</span>
        {disciples.map((d) => {
          const isSel = selectedDisciple?.id === d.id;
          const eff = calculateEffectiveStats(d);
          return (
            <button
              key={d.id}
              onClick={() => setSelectedDiscipleId(d.id)}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                isSel
                  ? 'bg-amber-500 text-[#0B0E14] font-semibold'
                  : 'bg-[#151C28] text-[#CBD5E1] hover:bg-[#1E2738]'
              }`}
            >
              <span>{d.name}</span>
              <span className="font-mono text-[10px] opacity-85">
                ({eff.hp}/{eff.maxHp})
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-dvh overflow-hidden flex flex-col bg-[#0B0E14] text-[#E6E1D6]">
      {/* =====================================================================
          1. ВЕРХНЯЯ ПАНЕЛЬ (КОМПАКТНАЯ, 3 ЗОНЫ)
      ====================================================================== */}
      <header className="shrink-0 flex items-center justify-between gap-4 px-3 sm:px-5 py-2 bg-[#0B0E14] border-b border-[#1E2636]">
        {/* Зона 1: Бренд */}
        <a
          href="#abode"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('ABODE');
          }}
          className="text-lg sm:text-xl font-bold tracking-tight text-[#F3EFE6] font-display whitespace-nowrap shrink-0"
        >
          Обитель Бессмертных
        </a>

        {/* Зона 2: Разгруженная панель — только Духовные камни и быстрый переход на Склад */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono tabular-nums text-[#CBD5E1]">
          <div
            data-tooltip-title="Духовные камни Секты"
            data-tooltip="Основная валюта Обители для возвышения павильонов, алхимии и ковки."
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#131926] border border-[#222B3B] whitespace-nowrap"
          >
            <Gem className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[#94A3B8] font-sans text-[11px] hidden sm:inline">Камни:</span>
            <strong className="text-amber-400">{resources.spiritStones}</strong>
          </div>

          <button
            onClick={() => {
              setActiveTab('ABODE');
              setAbodeSubTab('INVENTORY');
            }}
            data-tooltip-title="Складской Инвентарь"
            data-tooltip="Открыть хранилище ресурсов, эликсиров, пилюль потенциала и снаряжения Секты."
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-sans transition-colors whitespace-nowrap ${
              activeTab === 'ABODE' && abodeSubTab === 'INVENTORY'
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-semibold'
                : 'bg-[#131926] border-[#222B3B] text-[#CBD5E1] hover:border-amber-500/40 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Инвентарь</span>
          </button>
        </div>

        {/* Зона 3: Сервисные действия */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              soundFX.muted = !soundMuted;
              setSoundMuted(!soundMuted);
            }}
            className="p-2 text-xs text-[#CBD5E1] bg-[#161E2E] hover:bg-[#222D42] rounded-lg transition-colors"
            title={soundMuted ? 'Включить звук' : 'Выключить звук'}
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={resetAlphaState}
            className="p-2 text-xs text-[#94A3B8] hover:text-white bg-[#161E2E] hover:bg-[#222D42] rounded-lg transition-colors"
            title="Сбросить прогресс"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => downloadStandaloneHtmlBundle(sectLevel, resources, disciples)}
            className="px-2.5 py-1.5 text-[11px] font-semibold text-[#0B0E14] bg-amber-500 rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">HTML</span>
          </button>
        </div>
      </header>

      {/* =====================================================================
          2. ПАНЕЛЬ ПОДРАЗДЕЛОВ ТЕКУЩЕГО РАЗДЕЛА (ВСЕГДА НА ВИДУ, БЕЗ СКРОЛЛА)
      ====================================================================== */}
      <div className="shrink-0 bg-[#10151F] border-b border-[#1E2636] px-3 sm:px-5 py-1.5 flex items-center justify-between gap-2">
        {activeTab === 'ABODE' && (
          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setAbodeSubTab('SANCTUARY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                abodeSubTab === 'SANCTUARY'
                  ? 'bg-amber-500 text-[#0B0E14] font-semibold'
                  : 'text-[#94A3B8] hover:text-white bg-[#161D2B]'
              }`}
            >
              Обитель и Чайная
            </button>
            <button
              onClick={() => setAbodeSubTab('ROSTER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                abodeSubTab === 'ROSTER'
                  ? 'bg-amber-500 text-[#0B0E14] font-semibold'
                  : 'text-[#94A3B8] hover:text-white bg-[#161D2B]'
              }`}
            >
              Состав ({disciples.length}){anyReadyBreakthrough ? ' · Прорыв!' : ''}
            </button>
            <button
              onClick={() => setAbodeSubTab('STATS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                abodeSubTab === 'STATS'
                  ? 'bg-amber-500 text-[#0B0E14] font-semibold'
                  : 'text-[#94A3B8] hover:text-white bg-[#161D2B]'
              }`}
            >
              Характеристики
            </button>
            <button
              onClick={() => setAbodeSubTab('PILLS_GEAR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                abodeSubTab === 'PILLS_GEAR'
                  ? 'bg-amber-500 text-[#0B0E14] font-semibold'
                  : 'text-[#94A3B8] hover:text-white bg-[#161D2B]'
              }`}
            >
              Пилюли и Доспехи
            </button>
            <button
              onClick={() => setAbodeSubTab('INVENTORY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                abodeSubTab === 'INVENTORY'
                  ? 'bg-amber-500 text-[#0B0E14] font-semibold'
                  : 'text-[#94A3B8] hover:text-white bg-[#161D2B]'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Инвентарь</span>
            </button>
          </div>
        )}

        {activeTab === 'EXPEDITION' && (
          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setExpeditionSubTab('ARENA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                expeditionSubTab === 'ARENA'
                  ? 'bg-amber-500 text-[#0B0E14] font-semibold'
                  : 'text-[#94A3B8] hover:text-white bg-[#161D2B]'
              }`}
            >
              Поле Боя (Ярус {expedition.depthStage})
            </button>
            <button
              onClick={() => setExpeditionSubTab('LINEUP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                expeditionSubTab === 'LINEUP'
                  ? 'bg-amber-500 text-[#0B0E14] font-semibold'
                  : 'text-[#94A3B8] hover:text-white bg-[#161D2B]'
              }`}
            >
              Строй и Лечение
            </button>
            <button
              onClick={() => setExpeditionSubTab('LOG')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                expeditionSubTab === 'LOG'
                  ? 'bg-amber-500 text-[#0B0E14] font-semibold'
                  : 'text-[#94A3B8] hover:text-white bg-[#161D2B]'
              }`}
            >
              Журнал Похода
            </button>
          </div>
        )}

        {activeTab === 'CRAFTS' && (
          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setCraftsSubTab('ELIXIRS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                craftsSubTab === 'ELIXIRS'
                  ? 'bg-amber-500 text-[#0B0E14] font-semibold'
                  : 'text-[#94A3B8] hover:text-white bg-[#161D2B]'
              }`}
            >
              Алхимик: Эликсиры
            </button>
            <button
              onClick={() => setCraftsSubTab('POTENTIAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                craftsSubTab === 'POTENTIAL'
                  ? 'bg-amber-500 text-[#0B0E14] font-semibold'
                  : 'text-[#94A3B8] hover:text-white bg-[#161D2B]'
              }`}
            >
              Алхимик: Потенциал (6 видов)
            </button>
            <button
              onClick={() => setCraftsSubTab('FORGE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                craftsSubTab === 'FORGE'
                  ? 'bg-amber-500 text-[#0B0E14] font-semibold'
                  : 'text-[#94A3B8] hover:text-white bg-[#161D2B]'
              }`}
            >
              Кузня и Арсенал ({warehouseGear.length})
            </button>
          </div>
        )}

        {activeTab === 'CHRONICLE' && (
          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setChronicleSubTab('EVENTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                chronicleSubTab === 'EVENTS'
                  ? 'bg-amber-500 text-[#0B0E14] font-semibold'
                  : 'text-[#94A3B8] hover:text-white bg-[#161D2B]'
              }`}
            >
              Летопись Событий ({chronicle.length})
            </button>
            <button
              onClick={() => setChronicleSubTab('MEMORIAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                chronicleSubTab === 'MEMORIAL'
                  ? 'bg-amber-500 text-[#0B0E14] font-semibold'
                  : 'text-[#94A3B8] hover:text-white bg-[#161D2B]'
              }`}
            >
              Зал Предков ({fallenMemorial.length})
            </button>
          </div>
        )}

        {/* Индикатор активного боя или буфера добычи справа */}
        <div className="hidden md:flex items-center gap-2 text-xs shrink-0">
          {expedition.active && (
            <button
              onClick={() => {
                setActiveTab('EXPEDITION');
                setExpeditionSubTab('ARENA');
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 font-mono text-[11px]"
            >
              Бой: Ярус {expedition.depthStage} · В.{expedition.waveInStage}/3
            </button>
          )}
          {lootBufferTotal > 0 && (
            <button
              onClick={claimLootBuffer}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[11px] hover:bg-amber-500/30"
            >
              Забрать буфер (+{lootBufferTotal})
            </button>
          )}
        </div>
      </div>

      {/* =====================================================================
          3. РАБОЧАЯ ОБЛАСТЬ ОДНОГО ЭКРАНА (FLEX-1 MIN-H-0 OVERFLOW-HIDDEN)
      ====================================================================== */}
      <main className="flex-1 min-h-0 max-w-5xl w-full mx-auto px-3 sm:px-5 py-2.5 flex flex-col justify-between overflow-hidden">
        {/* -------------------------------------------------------------------
            РАЗДЕЛ 1: ОБИТЕЛЬ (4 ПОДРАЗДЕЛА НА ОДИН ЭКРАН)
        -------------------------------------------------------------------- */}
        {activeTab === 'ABODE' && (
          <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
            {/* Подраздел 1.1: Обитель и Чайный Павильон */}
            {abodeSubTab === 'SANCTUARY' && (
              <div className="flex-1 min-h-0 flex flex-col justify-between gap-2.5">
                <SectAbodeIllustration level={sectLevel} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 flex-1 min-h-0">
                  {/* Карточка возвышения Обители */}
                  <section className="bg-[#121722] border border-[#222B3B] rounded-xl p-3.5 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-[#F3EFE6]">
                          Возвышение Обители
                        </h2>
                        <span className="text-xs text-amber-400 font-mono">
                          Ступень {sectLevel}/2
                        </span>
                      </div>
                      <p className="text-xs text-[#94A3B8] leading-snug">
                        {sectLevel === 1
                          ? '«Забытая Нора»: разреженная Ци режет опыт на пике I царства (-50%) и снижает шанс возвышения во II царство (-35%).'
                          : '«Твердыня Глубин»: источник Инь-Ци открыт! Сняты штрафы среды, опыт +35%, лечение 10 ед./тик.'}
                      </p>
                    </div>

                    {sectLevel === 1 && SECT_LEVELS[1].upgradeCost ? (
                      <div className="pt-2 border-t border-[#1E2636] space-y-2">
                        <div className="text-[11px] text-[#CBD5E1] font-mono tabular-nums">
                          Цена: 80 камн. · 18 жел. · 18 мха · 12 панц.
                        </div>
                        <button
                          onClick={handleUpgradeSectLevel}
                          disabled={!canAfford(SECT_LEVELS[1].upgradeCost)}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors min-h-[40px] ${
                            canAfford(SECT_LEVELS[1].upgradeCost)
                              ? 'bg-amber-500 text-[#0B0E14] hover:bg-amber-400'
                              : 'bg-[#1A2232] text-[#64748B] cursor-not-allowed'
                          }`}
                        >
                          Возвысить до «Твердыни Глубин»
                        </button>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-[#1E2636] text-xs text-emerald-400 font-medium">
                        Обитель достигла максимальной II ступени Альфы.
                      </div>
                    )}
                  </section>

                  {/* Карточка Чайного Павильона */}
                  <section className="bg-[#121722] border border-[#222B3B] rounded-xl p-3.5 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-[#F3EFE6]">Чайный Павильон</h2>
                        <span className="text-xs text-[#94A3B8]">
                          {freeRecruitsLeft > 0
                            ? `Бесплатно: ${freeRecruitsLeft}`
                            : `${RECRUIT_COST} камней`}
                        </span>
                      </div>
                      <p className="text-xs text-[#94A3B8] leading-snug">
                        Приём послушников со случайным Корнем, Конституцией, Характером и сеткой пилюль.
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[#1E2636]">
                      <button
                        onClick={() => handleRecruitDisciple(false)}
                        disabled={freeRecruitsLeft <= 0 && resources.spiritStones < RECRUIT_COST}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors min-h-[40px] flex items-center justify-center gap-1.5 ${
                          freeRecruitsLeft > 0 || resources.spiritStones >= RECRUIT_COST
                            ? 'bg-amber-500 text-[#0B0E14] hover:bg-amber-400'
                            : 'bg-[#1A2232] text-[#64748B] cursor-not-allowed'
                        }`}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>
                          {freeRecruitsLeft > 0
                            ? 'Принять первого послушника (Бесплатно)'
                            : `Принять послушника (${RECRUIT_COST} камней)`}
                        </span>
                      </button>

                      <button
                        onClick={triggerHeavensGraceAd}
                        disabled={
                          rewardedAdTimer !== null || (!isSoftlocked && disciples.length > 0)
                        }
                        className={`w-full py-1.5 px-3 rounded-lg text-[11px] font-semibold transition-colors min-h-[36px] flex items-center justify-center gap-1.5 ${
                          isSoftlocked
                            ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                            : 'bg-[#182030] text-[#64748B] disabled:opacity-60'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {rewardedAdTimer !== null
                            ? `Нисхождение Дара Небес: ${rewardedAdTimer} сек...`
                            : isSoftlocked
                            ? 'Воззвать к Милости Небес (призвать адепта)'
                            : 'Милость Небес (резерв при потере всех адептов)'}
                        </span>
                      </button>
                    </div>
                  </section>
                </div>

                {/* Нижняя компактная полоса походного строя и быстрого старта */}
                <section className="bg-[#121722] border border-[#222B3B] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    <span className="text-xs font-semibold text-[#F3EFE6] shrink-0">Строй:</span>
                    {squadInSlots.map((m, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded bg-[#0D1119] border border-[#1B2331] text-[11px] text-[#CBD5E1] whitespace-nowrap"
                      >
                        {idx + 1}: {m ? m.name : 'Пусто'}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setAbodeSubTab('ROSTER')}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1A2232] text-[#CBD5E1] hover:bg-[#232D42]"
                    >
                      К списку ({disciples.length})
                    </button>
                    <button
                      onClick={() => {
                        if (!expedition.active && squadInSlots.some((s) => s !== null)) {
                          startExpedition();
                        } else {
                          setActiveTab('EXPEDITION');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-1.5"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>{expedition.active ? 'В Разлом' : 'В поход'}</span>
                    </button>
                  </div>
                </section>
              </div>
            )}

            {/* Подраздел 1.2: Состав Секты (Карточки учеников на один экран) */}
            {abodeSubTab === 'ROSTER' && (
              <div className="flex-1 min-h-0 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="text-base font-bold text-[#F3EFE6]">
                      Адепты Секты ({disciples.length})
                    </h2>
                    <p className="text-xs text-[#94A3B8]">
                      Нажмите на ученика для выбора или откройте его Характеристики / Пилюли.
                    </p>
                  </div>
                  <button
                    onClick={() => handleRecruitDisciple(false)}
                    disabled={freeRecruitsLeft <= 0 && resources.spiritStones < RECRUIT_COST}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-[#0B0E14] hover:bg-amber-400 disabled:bg-[#1A2232] disabled:text-[#64748B]"
                  >
                    + Нанять ({freeRecruitsLeft > 0 ? 'Бесплатно' : `${RECRUIT_COST} камн.`})
                  </button>
                </div>

                {disciples.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center bg-[#121722] border border-[#222B3B] rounded-xl p-6 text-center gap-3">
                    <p className="text-xs text-[#94A3B8]">
                      В секте пока нет учеников. Примите первого послушника в Чайном павильоне.
                    </p>
                    <button
                      onClick={() => setAbodeSubTab('SANCTUARY')}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-[#0B0E14]"
                    >
                      Перейти в Чайный павильон
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-2.5 content-start overflow-y-auto pr-0.5">
                    {disciples.map((unit) => {
                      const eff = calculateEffectiveStats(unit);
                      const isSel = selectedDisciple?.id === unit.id;
                      const ready = unit.exp >= unit.maxExp;
                      const daoState = getDaoHeartState(unit);
                      const daoLabel = getDaoHeartLabel(unit.daoHeart);
                      const daoThumbPos = (unit.daoHeart + 100) / 2;

                      return (
                        <div
                          key={unit.id}
                          onClick={() => setSelectedDiscipleId(unit.id)}
                          className={`p-3 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between ${
                            isSel
                              ? 'bg-[#182132] border-amber-500/70'
                              : 'bg-[#121722] border-[#222B3B] hover:border-[#32405A]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-sm text-[#F3EFE6] truncate">
                                {unit.name}
                              </span>
                              <span className="text-[11px] text-[#94A3B8] font-mono shrink-0">
                                {unit.lineupSlot !== null ? `Поз. ${unit.lineupSlot + 1}` : 'Резерв'} ·{' '}
                                {unit.status === 'EXPEDITION' ? 'В бою' : 'Отдых'}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#94A3B8] mt-0.5 truncate">
                              <span
                                className="has-tooltip"
                                data-tooltip-title={`Боевой Путь: ${ARCHETYPE_INFO[unit.archetype].name}`}
                                data-tooltip={formatArchetypeTooltip(unit.archetype)}
                              >
                                {ARCHETYPE_INFO[unit.archetype].name}
                              </span>{' '}
                              · {unit.gender === 'YANG' ? 'Ян' : 'Инь'} ·{' '}
                              <span
                                className="has-tooltip"
                                data-tooltip-title={`Характер: ${TEMPERAMENT_INFO[unit.temperament].name}`}
                                data-tooltip={TEMPERAMENT_INFO[unit.temperament].summary}
                              >
                                {TEMPERAMENT_INFO[unit.temperament].name}
                              </span>{' '}
                              · Ступень {unit.subLevel}/5
                            </div>
                          </div>

                          <div
                            className="p-2 rounded-lg bg-[#0D1119] border border-[#1B2331] my-1.5 space-y-1"
                            data-tooltip-title={`Сердце Дао: ${daoLabel}`}
                            data-tooltip={formatDaoHeartTooltip(unit.daoHeart, daoState.subtitle)}
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-[#94A3B8] font-semibold has-tooltip">
                                Сердце Дао:
                              </span>
                              <strong className={daoState.colorClass}>{daoLabel}</strong>
                            </div>
                            <div className="dao-scale-track">
                              <div className="dao-scale-center" />
                              <div
                                className="dao-scale-thumb"
                                style={{ left: `${daoThumbPos}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-[#94A3B8]">
                              <span className="text-rose-400">Бездна Демона</span>
                              <span>Равновесие</span>
                              <span className="text-amber-400">Свет Небес</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5 my-1.5 text-[11px] font-mono tabular-nums">
                            <div>
                              <div className="flex justify-between text-[#CBD5E1]">
                                <span>Здоровье</span>
                                <span>
                                  {eff.hp}/{eff.maxHp}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-[#0D1119] rounded-full overflow-hidden mt-0.5">
                                <div
                                  className={`h-full ${
                                    eff.hp / eff.maxHp < 0.4 ? 'bg-rose-500' : 'bg-emerald-500'
                                  }`}
                                  style={{
                                    width: `${Math.max(
                                      0,
                                      Math.min(100, (eff.hp / eff.maxHp) * 100)
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[#CBD5E1]">
                                <span>Опыт Ци</span>
                                <span>
                                  {unit.exp}/{unit.maxExp}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-[#0D1119] rounded-full overflow-hidden mt-0.5">
                                <div
                                  className="h-full bg-amber-500"
                                  style={{
                                    width: `${Math.max(
                                      0,
                                      Math.min(100, (unit.exp / unit.maxExp) * 100)
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#1E2636] text-[11px]">
                            <span className="font-mono text-[#94A3B8]">
                              Мошна: {unit.personalStones} · Травмы: {unit.injuries}/5
                            </span>
                            <div className="flex items-center gap-1.5">
                              {ready && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleBreakthroughClick(unit);
                                  }}
                                  className="px-2 py-1 rounded bg-amber-500 text-[#0B0E14] font-semibold text-[11px]"
                                >
                                  Прорыв!
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDiscipleId(unit.id);
                                  setAbodeSubTab('STATS');
                                }}
                                className="px-2 py-1 rounded bg-[#1F293D] text-[#E2E8F0] hover:bg-[#2A3752] text-[11px]"
                              >
                                Осмотр →
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Подраздел 1.3: Характеристики и Меридианы ученика (на один экран) */}
            {abodeSubTab === 'STATS' && (
              <div className="flex-1 min-h-0 flex flex-col justify-between gap-2.5">
                {renderDiscipleSelectorBar()}

                {!selectedDisciple ? (
                  <div className="flex-1 flex items-center justify-center bg-[#121722] border border-[#222B3B] rounded-xl text-xs text-[#94A3B8]">
                    Сначала примите ученика в подразделе «Обитель и Чайная».
                  </div>
                ) : (
                  <section className="flex-1 min-h-0 bg-[#121722] border border-[#222B3B] rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
                    {/* Шапка ученика и выбор позиции строя */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E2636] pb-2">
                      <div>
                        <h2 className="text-lg font-bold text-[#F3EFE6] leading-tight">
                          {selectedDisciple.name}{' '}
                          <span className="text-xs font-normal text-amber-400">
                            · {getRealmLabel(selectedDisciple.realmTier, selectedDisciple.subLevel)}
                          </span>
                        </h2>
                        <div className="text-[11px] text-[#94A3B8]">
                          {ARCHETYPE_INFO[selectedDisciple.archetype].name} ·{' '}
                          {selectedDisciple.gender === 'YANG' ? 'Начало Ян' : 'Начало Инь'}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-[#0D1119] p-1 rounded-lg border border-[#1B2331]">
                        <span className="text-[11px] text-[#94A3B8] px-1">Позиция:</span>
                        {[0, 1, 2, 3].map((slotIdx) => (
                          <button
                            key={slotIdx}
                            disabled={expedition.active}
                            onClick={() =>
                              assignToSlot(
                                selectedDisciple.id,
                                selectedDisciple.lineupSlot === slotIdx ? null : slotIdx
                              )
                            }
                            className={`px-2 py-0.5 text-xs font-mono rounded ${
                              selectedDisciple.lineupSlot === slotIdx
                                ? 'bg-amber-500 text-[#0B0E14] font-semibold'
                                : 'text-[#94A3B8] hover:text-white disabled:opacity-40'
                            }`}
                          >
                            {slotIdx + 1}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Врожденные качества и шкала Весов Сердца Дао без числовых значений */}
                    {(() => {
                      const unit = selectedDisciple;
                      const daoState = getDaoHeartState(unit);
                      const daoLabel = getDaoHeartLabel(unit.daoHeart);
                      const daoScaleLeftPct = (unit.daoHeart + 100) / 2;

                      return (
                        <div className="bg-[#0D1119] p-2.5 rounded-xl border border-[#1B2331] space-y-2 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div
                              data-tooltip-title={`Духовный корень: ${unit.spiritRoot.name}`}
                              data-tooltip={unit.spiritRoot.description}
                            >
                              <span className="text-[#94A3B8] has-tooltip">Корень:</span>{' '}
                              <span className="text-[#F3EFE6] font-medium">
                                {unit.spiritRoot.name}
                              </span>
                            </div>
                            <div
                              data-tooltip-title={`Конституция: ${unit.constitution.name}`}
                              data-tooltip={unit.constitution.description}
                            >
                              <span className="text-[#94A3B8] has-tooltip">Конституция:</span>{' '}
                              <span className="text-[#F3EFE6] font-medium">
                                {unit.constitution.name}
                              </span>
                            </div>
                            <div
                              data-tooltip-title={`Характер: ${TEMPERAMENT_INFO[unit.temperament].name}`}
                              data-tooltip={TEMPERAMENT_INFO[unit.temperament].summary}
                            >
                              <span className="text-[#94A3B8] has-tooltip">Характер:</span>{' '}
                              <span className="text-[#F3EFE6] font-medium">
                                {TEMPERAMENT_INFO[unit.temperament].name}
                              </span>
                            </div>
                          </div>

                          <div
                            className="pt-2 border-t border-[#1B2331] space-y-1"
                            data-tooltip-title={`Сердце Дао: ${daoLabel}`}
                            data-tooltip={formatDaoHeartTooltip(unit.daoHeart, daoState.subtitle)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[#94A3B8] font-semibold has-tooltip">
                                Сердце Дао:
                              </span>
                              <strong className={daoState.colorClass}>{daoLabel}</strong>
                            </div>
                            <div className="dao-scale-track">
                              <div className="dao-scale-center" />
                              <div
                                className="dao-scale-thumb"
                                style={{ left: `${daoScaleLeftPct}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                              <span className="text-rose-400">Бездна Демона</span>
                              <span>Равновесие</span>
                              <span className="text-amber-400">Свет Небес</span>
                            </div>
                            <div className={`text-[11px] ${daoState.colorClass} opacity-90`}>
                              {daoState.subtitle}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 8 Боевых Параметров в сетке 4x2 */}
                    {(() => {
                      const eff = calculateEffectiveStats(selectedDisciple);
                      return (
                        <div className="grid grid-cols-4 gap-2 text-center font-mono tabular-nums">
                          <div className="p-2 rounded-xl bg-[#0D1119] border border-[#1B2331]">
                            <div className="text-[10px] font-sans text-[#94A3B8]">Здоровье</div>
                            <div className="text-xs sm:text-sm font-semibold text-emerald-400">
                              {eff.hp}/{eff.maxHp}
                            </div>
                          </div>
                          <div className="p-2 rounded-xl bg-[#0D1119] border border-[#1B2331]">
                            <div className="text-[10px] font-sans text-[#94A3B8]">Физ. атака</div>
                            <div className="text-xs sm:text-sm font-semibold text-[#F3EFE6]">
                              {eff.pAtk}
                            </div>
                          </div>
                          <div className="p-2 rounded-xl bg-[#0D1119] border border-[#1B2331]">
                            <div className="text-[10px] font-sans text-[#94A3B8]">Маг. атака</div>
                            <div className="text-xs sm:text-sm font-semibold text-[#F3EFE6]">
                              {eff.mAtk}
                            </div>
                          </div>
                          <div className="p-2 rounded-xl bg-[#0D1119] border border-[#1B2331]">
                            <div className="text-[10px] font-sans text-[#94A3B8]">Физ. защита</div>
                            <div className="text-xs sm:text-sm font-semibold text-[#F3EFE6]">
                              {eff.pDef}
                            </div>
                          </div>
                          <div className="p-2 rounded-xl bg-[#0D1119] border border-[#1B2331]">
                            <div className="text-[10px] font-sans text-[#94A3B8]">Маг. защита</div>
                            <div className="text-xs sm:text-sm font-semibold text-[#F3EFE6]">
                              {eff.mDef}
                            </div>
                          </div>
                          <div className="p-2 rounded-xl bg-[#0D1119] border border-[#1B2331]">
                            <div className="text-[10px] font-sans text-[#94A3B8]">Скорость</div>
                            <div className="text-xs sm:text-sm font-semibold text-[#F3EFE6]">
                              {eff.spd}
                            </div>
                          </div>
                          <div className="p-2 rounded-xl bg-[#0D1119] border border-[#1B2331]">
                            <div className="text-[10px] font-sans text-[#94A3B8]">Шанс крита</div>
                            <div className="text-xs sm:text-sm font-semibold text-amber-400">
                              {eff.crit}%
                            </div>
                          </div>
                          <div className="p-2 rounded-xl bg-[#0D1119] border border-[#1B2331]">
                            <div className="text-[10px] font-sans text-[#94A3B8]">Уклонение</div>
                            <div className="text-xs sm:text-sm font-semibold text-emerald-400">
                              {eff.eva}%
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Нижний ряд управления лечением и прорывом */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#1E2636]">
                      <button
                        onClick={() => applyHealingPill(selectedDisciple.id)}
                        disabled={consumables.healingPills <= 0}
                        data-tooltip-title="Пилюля Исцеления Ци"
                        data-tooltip="Мгновенно восстанавливает 60% от максимального здоровья ученика."
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-[#1A2232] hover:bg-[#242F46] text-[#E2E8F0] disabled:opacity-40 min-h-[38px]"
                      >
                        Пилюля Исцеления ({consumables.healingPills})
                      </button>
                      <button
                        onClick={() => applyInjuryDecoction(selectedDisciple.id)}
                        disabled={
                          consumables.injuryDecoctions <= 0 || selectedDisciple.injuries === 0
                        }
                        data-tooltip-title="Отвар Очищения Меридианов"
                        data-tooltip="Снимает до 2 стаков стихийных травм и разблокирует естественный отдых при 5/5 травмах."
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-[#1A2232] hover:bg-[#242F46] text-[#E2E8F0] disabled:opacity-40 min-h-[38px]"
                      >
                        Отвар Очищения ({consumables.injuryDecoctions}) · Травмы:{' '}
                        {selectedDisciple.injuries}/5
                      </button>
                      {selectedDisciple.exp >= selectedDisciple.maxExp && (
                        <button
                          onClick={() => handleBreakthroughClick(selectedDisciple)}
                          data-tooltip-title="Возвышение Ступени Ци"
                          data-tooltip="Начать попытку прорыва на следующую ступень культивации."
                          className="py-2 px-4 rounded-lg text-xs font-semibold bg-amber-500 text-[#0B0E14] hover:bg-amber-400 min-h-[38px]"
                        >
                          Совершить Прорыв!
                        </button>
                      )}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* Подраздел 1.4: Сетка «Потенциал пилюль» и Снаряжение ученика (на один экран) */}
            {abodeSubTab === 'PILLS_GEAR' && (
              <div className="flex-1 min-h-0 flex flex-col justify-between gap-2.5">
                {renderDiscipleSelectorBar()}

                {!selectedDisciple ? (
                  <div className="flex-1 flex items-center justify-center bg-[#121722] border border-[#222B3B] rounded-xl text-xs text-[#94A3B8]">
                    Сначала примите ученика в Чайном павильоне.
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {/* Сетка «Потенциал пилюль» */}
                    <section className="bg-[#121722] border border-[#222B3B] rounded-xl p-3.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-bold text-[#F3EFE6]">
                            Потенциал пилюль: {selectedDisciple.name}
                          </h3>
                          <span className="text-[11px] text-[#94A3B8]">Усвоено / Предел</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {(Object.keys(STAT_PILL_LABELS) as StatPillKey[]).map((key) => {
                            const slot = selectedDisciple.pillGrid[key];
                            const inStock = consumables.statPills[key];
                            const isFull = slot.consumed >= slot.max;
                            const pillInfo = STAT_PILL_LABELS[key];
                            return (
                              <button
                                key={key}
                                onClick={() => feedPermanentStatPill(selectedDisciple.id, key)}
                                disabled={isFull || inStock <= 0}
                                data-tooltip-title={pillInfo.name}
                                data-tooltip={`Постоянный эффект: ${pillInfo.bonusText} к базовым параметрам ученика.\nУсвоено: ${slot.consumed} из ${slot.max}. На складе: ${inStock} шт.`}
                                className={`p-2.5 rounded-xl border text-left transition-colors ${
                                  !isFull && inStock > 0
                                    ? 'bg-[#151D2B] border-amber-500/50 hover:border-amber-400'
                                    : 'bg-[#0D1119] border-[#1B2331] opacity-65'
                                }`}
                              >
                                <div className="flex justify-between text-xs">
                                  <span className="font-semibold text-[#F3EFE6]">
                                    {pillInfo.shortStat}
                                  </span>
                                  <span className="text-amber-400 font-mono">
                                    {slot.consumed}/{slot.max}
                                  </span>
                                </div>
                                <div className="text-[10px] text-[#94A3B8] mt-1">
                                  На складе: {inStock} шт.
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#1E2636] flex items-center justify-between text-xs text-[#94A3B8]">
                        <span>Личная мошна: {selectedDisciple.personalStones} камней</span>
                        <button
                          onClick={() => {
                            setActiveTab('CRAFTS');
                            setCraftsSubTab('POTENTIAL');
                          }}
                          className="text-amber-400 hover:text-amber-300 font-medium"
                        >
                          Сварить у Алхимика →
                        </button>
                      </div>
                    </section>

                    {/* Снаряжение и быстрый выбор со склада */}
                    <section className="bg-[#121722] border border-[#222B3B] rounded-xl p-3.5 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-[#F3EFE6]">
                            Снаряжение ученика
                          </h3>
                          <span className="text-[11px] text-[#94A3B8]">
                            На складе: {warehouseGear.length} предм.
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-[#0D1119] border border-[#1B2331]">
                            <div className="text-[11px] text-[#94A3B8]">Оружие</div>
                            <div className="font-semibold text-[#F3EFE6] mt-0.5 truncate">
                              {selectedDisciple.equippedWeapon?.name ?? 'Не надето'}
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#0D1119] border border-[#1B2331]">
                            <div className="text-[11px] text-[#94A3B8]">Доспех</div>
                            <div className="font-semibold text-[#F3EFE6] mt-0.5 truncate">
                              {selectedDisciple.equippedArmor?.name ?? 'Не надето'}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {warehouseGear.length === 0 ? (
                            <div className="text-xs text-[#64748B] py-2">
                              Свободного снаряжения на складе нет. Выкуйте оружие или броню в Кузне.
                            </div>
                          ) : (
                            warehouseGear.map((g) => (
                              <div
                                key={g.id}
                                className="p-2 rounded-lg bg-[#0D1119] border border-[#1B2331] flex items-center justify-between gap-2 text-xs"
                              >
                                <span className="text-[#E2E8F0] truncate">{g.name}</span>
                                <button
                                  onClick={() => equipGearOnDisciple(selectedDisciple.id, g.id)}
                                  className="px-2.5 py-1 rounded bg-amber-500 text-[#0B0E14] font-semibold text-[11px] shrink-0"
                                >
                                  Надеть
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#1E2636] flex justify-end">
                        <button
                          onClick={() => {
                            setActiveTab('CRAFTS');
                            setCraftsSubTab('FORGE');
                          }}
                          className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                        >
                          Открыть Кузню Чёрного Железа →
                        </button>
                      </div>
                    </section>
                  </div>
                )}
              </div>
            )}

            {/* Подраздел 1.5: Складской Инвентарь Секты (ресурсы, зелья, материалы, снаряжение с иконками) */}
            {abodeSubTab === 'INVENTORY' && (
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2.5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                  {/* Категория 1: Духовные ресурсы и Материалы Разлома */}
                  <section className="bg-[#121722] border border-[#222B3B] rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gem className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-bold text-[#F3EFE6]">
                          Ресурсы и Материалы Разлома
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('EXPEDITION');
                          setExpeditionSubTab('ARENA');
                        }}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-medium"
                      >
                        Добыть в Разломе →
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div
                        data-tooltip-title="Духовные камни"
                        data-tooltip="Кристаллизованная духовная энергия Ци. Основная валюта для возвышения Обители, ковки снаряжения и варки пилюль."
                        className="p-2.5 rounded-xl bg-[#0D1119] border border-[#1B2331] flex items-center gap-3"
                      >
                        <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                          <Gem className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-[#F3EFE6] truncate">
                            Духовные камни
                          </div>
                          <div className="text-[10px] text-[#94A3B8]">Валюта Секты</div>
                        </div>
                        <div className="text-sm font-mono font-bold text-amber-400 tabular-nums">
                          {resources.spiritStones}
                        </div>
                      </div>

                      <div
                        data-tooltip-title="Болотное железо"
                        data-tooltip="Тяжёлая руда из Карстового Разлома, пропитанная подземной Инь-Ци. Основа для ковки клинков и лат в Кузне."
                        className="p-2.5 rounded-xl bg-[#0D1119] border border-[#1B2331] flex items-center gap-3"
                      >
                        <div className="w-9 h-9 rounded-lg bg-slate-400/15 border border-slate-400/30 flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4 text-slate-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-[#F3EFE6] truncate">
                            Болотное железо
                          </div>
                          <div className="text-[10px] text-[#94A3B8]">Руда для ковки</div>
                        </div>
                        <div className="text-sm font-mono font-bold text-white tabular-nums">
                          {resources.bogIron}
                        </div>
                      </div>

                      <div
                        data-tooltip-title="Кровавый мох"
                        data-tooltip="Алый пещерный мох, впитавший духовную кровь чудовищ. Главный алхимический реагент для целебных пилюль и эликсиров."
                        className="p-2.5 rounded-xl bg-[#0D1119] border border-[#1B2331] flex items-center gap-3"
                      >
                        <div className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                          <Leaf className="w-4 h-4 text-rose-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-[#F3EFE6] truncate">
                            Кровавый мох
                          </div>
                          <div className="text-[10px] text-[#94A3B8]">Трава алхимии</div>
                        </div>
                        <div className="text-sm font-mono font-bold text-rose-400 tabular-nums">
                          {resources.bloodMoss}
                        </div>
                      </div>

                      <div
                        data-tooltip-title="Панцирь паука"
                        data-tooltip="Прочный хитиновый щиток пещерного ткача. Используется в защитных отварах, пилюлях прорыва и укреплённых доспехах."
                        className="p-2.5 rounded-xl bg-[#0D1119] border border-[#1B2331] flex items-center gap-3"
                      >
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                          <Bug className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-[#F3EFE6] truncate">
                            Панцирь паука
                          </div>
                          <div className="text-[10px] text-[#94A3B8]">Трофей Разлома</div>
                        </div>
                        <div className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
                          {resources.spiderCarapace}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Категория 2: Целебные снадобья и Эликсиры Прорыва */}
                  <section className="bg-[#121722] border border-[#222B3B] rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-bold text-[#F3EFE6]">
                          Целебные снадобья и Эликсиры
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('CRAFTS');
                          setCraftsSubTab('ELIXIRS');
                        }}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-medium"
                      >
                        Павильон Алхимии →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div
                        data-tooltip-title="Пилюля Исцеления Ци"
                        data-tooltip="Мгновенно восстанавливает 60% от максимального здоровья раненого ученика."
                        className="p-2.5 rounded-xl bg-[#0D1119] border border-[#1B2331] flex flex-col justify-between gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                            <HeartPulse className="w-4 h-4 text-emerald-400" />
                          </div>
                          <span className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
                            {consumables.healingPills} шт.
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#F3EFE6]">
                            Пилюля Исцеления
                          </div>
                          <div className="text-[10px] text-[#94A3B8]">+60% макс. Здоровья</div>
                        </div>
                      </div>

                      <div
                        data-tooltip-title="Отвар Очищения Меридианов"
                        data-tooltip="Снимает до 2 стаков стихийных травм и разблокирует естественный отдых при 5/5 травмах."
                        className="p-2.5 rounded-xl bg-[#0D1119] border border-[#1B2331] flex flex-col justify-between gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
                            <Droplets className="w-4 h-4 text-sky-400" />
                          </div>
                          <span className="text-sm font-mono font-bold text-sky-400 tabular-nums">
                            {consumables.injuryDecoctions} шт.
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#F3EFE6]">
                            Отвар Очищения
                          </div>
                          <div className="text-[10px] text-[#94A3B8]">Снимает 2 травмы</div>
                        </div>
                      </div>

                      <div
                        data-tooltip-title="Пилюля Возвышения Духа"
                        data-tooltip="Повышает шанс успешного прорыва на новую ступень на +25% и смягчает откат при неудаче."
                        className="p-2.5 rounded-xl bg-[#0D1119] border border-[#1B2331] flex flex-col justify-between gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                            <Flame className="w-4 h-4 text-amber-400" />
                          </div>
                          <span className="text-sm font-mono font-bold text-amber-400 tabular-nums">
                            {consumables.breakthroughPills} шт.
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#F3EFE6]">
                            Пилюля Прорыва
                          </div>
                          <div className="text-[10px] text-[#94A3B8]">+25% к шансу прорыва</div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                  {/* Категория 3: Пилюли Потенциала (Укрепление Сосуда) */}
                  <section className="bg-[#121722] border border-[#222B3B] rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-bold text-[#F3EFE6]">
                          Пилюли Потенциала (На складе)
                        </h3>
                      </div>
                      <button
                        onClick={() => setAbodeSubTab('PILLS_GEAR')}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-medium"
                      >
                        Передать ученику →
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(Object.keys(STAT_PILL_LABELS) as StatPillKey[]).map((key) => {
                        const pillInfo = STAT_PILL_LABELS[key];
                        const count = consumables.statPills[key];
                        const renderPillIcon = () => {
                          switch (key) {
                            case 'pAtk':
                              return <Swords className="w-3.5 h-3.5 text-rose-400" />;
                            case 'mAtk':
                              return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
                            case 'pDef':
                              return <Shield className="w-3.5 h-3.5 text-amber-400" />;
                            case 'mDef':
                              return <Compass className="w-3.5 h-3.5 text-sky-400" />;
                            case 'spd':
                              return <Zap className="w-3.5 h-3.5 text-emerald-400" />;
                            case 'maxHp':
                              return <HeartPulse className="w-3.5 h-3.5 text-red-400" />;
                          }
                        };
                        return (
                          <div
                            key={key}
                            data-tooltip-title={pillInfo.name}
                            data-tooltip={`Навсегда усиливает параметр ученика (${pillInfo.bonusText}). В наличии на складе: ${count} шт.`}
                            className="p-2.5 rounded-xl bg-[#0D1119] border border-[#1B2331] flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-[#161E2E] border border-[#253047] flex items-center justify-center shrink-0">
                                {renderPillIcon()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-[#F3EFE6] truncate">
                                  {pillInfo.shortStat}
                                </div>
                                <div className="text-[10px] text-amber-400/90 font-mono">
                                  {pillInfo.bonusText}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`text-xs font-mono font-bold tabular-nums shrink-0 ${
                                count > 0 ? 'text-amber-400' : 'text-[#64748B]'
                              }`}
                            >
                              {count} шт.
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Категория 4: Арсенал Секты (Свободное снаряжение на складе) */}
                  <section className="bg-[#121722] border border-[#222B3B] rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hammer className="w-4 h-4 text-slate-300" />
                        <h3 className="text-sm font-bold text-[#F3EFE6]">
                          Склад Арсенала ({warehouseGear.length} предм.)
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('CRAFTS');
                          setCraftsSubTab('FORGE');
                        }}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-medium"
                      >
                        Кузня Чёрного Железа →
                      </button>
                    </div>

                    {warehouseGear.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center p-4 rounded-xl bg-[#0D1119] border border-[#1B2331] text-xs text-[#64748B] text-center">
                        На складе нет свободного оружия или доспехов. Выкуйте снаряжение в Кузне или снимите с учеников.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                        {warehouseGear.map((item) => (
                          <div
                            key={item.id}
                            data-tooltip-title={item.name}
                            data-tooltip={
                              item.slot === 'WEAPON'
                                ? 'Боевое оружие из Кузни Чёрного Железа. Можно экипировать ученику во вкладке «Пилюли и Доспехи».'
                                : 'Защитный доспех из Кузни Чёрного Железа. Можно экипировать ученику во вкладке «Пилюли и Доспехи».'
                            }
                            className="p-2.5 rounded-xl bg-[#0D1119] border border-[#1B2331] flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-[#161E2E] border border-[#253047] flex items-center justify-center shrink-0">
                                {item.slot === 'WEAPON' ? (
                                  <Swords className="w-3.5 h-3.5 text-amber-400" />
                                ) : (
                                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-[#F3EFE6] truncate">
                                  {item.name}
                                </div>
                                <div className="text-[10px] text-[#94A3B8]">
                                  {item.slot === 'WEAPON' ? 'Оружие' : 'Доспех'}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => setAbodeSubTab('PILLS_GEAR')}
                              className="px-2 py-1 rounded bg-[#1A2232] hover:bg-[#242F46] text-[10px] font-semibold text-amber-400 shrink-0"
                            >
                              Экипировать
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            РАЗДЕЛ 2: КАРСТОВЫЙ РАЗЛОМ (3 ПОДРАЗДЕЛА НА ОДИН ЭКРАН)
        -------------------------------------------------------------------- */}
        {activeTab === 'EXPEDITION' && (
          <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
            {/* Подраздел 2.1: Поле Боя (Арена, Строй, Враги, Буфер и Кнопки на 1 экран) */}
            {expeditionSubTab === 'ARENA' && (
              <div className="flex-1 min-h-0 flex flex-col justify-between gap-2">
                <KarstRiftIllustration
                  depthStage={expedition.depthStage}
                  active={expedition.active}
                />

                {/* Панель яруса и волны */}
                <div className="flex items-center justify-between gap-2 bg-[#121722] border border-[#222B3B] rounded-xl px-3 py-2 shrink-0">
                  <div className="text-xs font-mono tabular-nums text-[#E2E8F0]">
                    Ярус {expedition.depthStage}/5 · Волна {expedition.waveInStage}/3 ·{' '}
                    {expedition.active ? `Раунд ${expedition.combatRound}` : 'В ожидании'}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-[#94A3B8] mr-1">Ярус:</span>
                    {[1, 2, 3, 4, 5].map((st) => (
                      <button
                        key={st}
                        disabled={expedition.active}
                        onClick={() => setExpedition((prev) => ({ ...prev, depthStage: st }))}
                        className={`px-2 py-0.5 text-xs font-mono rounded ${
                          expedition.depthStage === st
                            ? 'bg-amber-500 text-[#0B0E14] font-semibold'
                            : 'bg-[#0D1119] text-[#94A3B8] disabled:opacity-40'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Сетка: Слева 4 позиции отряда, Справа враги текущей волны */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 flex-1 min-h-0">
                  {/* Отряд (Позиции 1–4) */}
                  <div className="bg-[#121722] border border-[#222B3B] rounded-xl p-2.5 flex flex-col justify-between">
                    <div className="text-[11px] text-[#94A3B8] flex justify-between mb-1">
                      <span>Походный строй (Поз. 1 — 80% ударов)</span>
                      <button
                        onClick={() => setExpeditionSubTab('LINEUP')}
                        className="text-amber-400 hover:underline"
                      >
                        Изменить строй
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 flex-1 items-center">
                      {squadInSlots.map((member, idx) => {
                        const eff = member ? calculateEffectiveStats(member) : null;
                        return (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg border text-xs ${
                              idx === 0
                                ? 'bg-[#171E2E] border-amber-500/40'
                                : 'bg-[#0D1119] border-[#1B2331]'
                            }`}
                          >
                            <div className="flex justify-between text-[10px] text-[#94A3B8] font-mono">
                              <span>Поз. {idx + 1}</span>
                              <span>{idx === 0 ? 'Авангард' : 'Тыл'}</span>
                            </div>
                            {member && eff ? (
                              <>
                                <div className="font-semibold text-[#F3EFE6] truncate mt-0.5">
                                  {member.name}
                                </div>
                                <div className="text-[10px] font-mono text-[#CBD5E1]">
                                  {eff.hp}/{eff.maxHp}
                                </div>
                                <div className="w-full h-1 bg-[#1B2331] rounded-full overflow-hidden mt-0.5">
                                  <div
                                    className={`h-full ${
                                      eff.hp / eff.maxHp < 0.4 ? 'bg-rose-500' : 'bg-emerald-500'
                                    }`}
                                    style={{
                                      width: `${Math.max(
                                        0,
                                        Math.min(100, (eff.hp / eff.maxHp) * 100)
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </>
                            ) : (
                              <div className="text-[11px] text-[#64748B] py-2">Пусто</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Противники */}
                  <div className="bg-[#121722] border border-[#222B3B] rounded-xl p-2.5 flex flex-col justify-between">
                    <div className="text-[11px] text-[#94A3B8] mb-1">
                      Противники в Карстовом Разломе
                    </div>
                    {expedition.active && expedition.enemies.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 items-center">
                        {expedition.enemies.map((en) => (
                          <div
                            key={en.id}
                            className="p-2.5 rounded-lg bg-[#0D1119] border border-[#242E42]"
                          >
                            <div className="text-xs font-semibold text-rose-300 truncate">
                              {en.name}
                            </div>
                            <div className="text-[10px] text-[#94A3B8]">{en.title}</div>
                            <div className="flex justify-between text-[11px] font-mono text-[#E2E8F0] mt-1">
                              <span>
                                {en.stats.hp}/{en.stats.maxHp}
                              </span>
                              <span>
                                Атк {en.stats.pAtk} · Защ {en.stats.pDef}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-[#1B2331] rounded-full overflow-hidden mt-1">
                              <div
                                className="h-full bg-rose-500 transition-all duration-150"
                                style={{
                                  width: `${Math.max(
                                    0,
                                    Math.min(100, (en.stats.hp / en.stats.maxHp) * 100)
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-xs text-[#64748B] text-center px-4">
                        Отряд в безопасности Обители. Нажмите «Начать поход в Разлом» ниже.
                      </div>
                    )}

                    {/* Краткая строка последнего события раунда */}
                    <div className="text-[11px] font-mono text-[#CBD5E1] truncate pt-1.5 border-t border-[#1E2636]">
                      {expedition.combatLog[0] ?? 'Готовность к спуску.'}
                    </div>
                  </div>
                </div>

                {/* Нижняя панель: Буфер добычи + Кнопки боя */}
                <div className="bg-[#121722] border border-[#222B3B] rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
                    <span className="text-[#94A3B8] font-sans">Буфер (90/10):</span>
                    <span>
                      Камни {expedition.lootBuffer.spiritStones} · Жел.{' '}
                      {expedition.lootBuffer.bogIron} · Мох {expedition.lootBuffer.bloodMoss} ·
                      Панц. {expedition.lootBuffer.spiderCarapace}
                    </span>
                    <button
                      onClick={claimLootBuffer}
                      disabled={lootBufferTotal === 0}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 text-[#0B0E14] font-sans font-semibold text-xs disabled:bg-[#1A2232] disabled:text-[#64748B]"
                    >
                      Собрать
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {!expedition.active ? (
                      <button
                        onClick={startExpedition}
                        disabled={squadInSlots.every((s) => s === null)}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-[#1A2232] disabled:text-[#64748B] flex items-center gap-1.5 min-h-[38px]"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        <span>Начать поход в Разлом</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            setExpedition((prev) => ({ ...prev, isPaused: !prev.isPaused }))
                          }
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1A2232] text-[#E2E8F0] hover:bg-[#242F46] min-h-[38px] flex items-center gap-1"
                        >
                          {expedition.isPaused ? (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>Продолжить</span>
                            </>
                          ) : (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              <span>Пауза</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={emergencyRetreat}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-700 text-white hover:bg-rose-600 min-h-[38px] flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Отступить в Обитель</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Подраздел 2.2: Строй и Поддержка */}
            {expeditionSubTab === 'LINEUP' && (
              <section className="flex-1 min-h-0 bg-[#121722] border border-[#222B3B] rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="text-base font-bold text-[#F3EFE6]">
                      Построение Отряда и Медицина
                    </h2>
                    <p className="text-xs text-[#94A3B8]">
                      Назначьте позиции 1–4 (Позиция 1 принимает 80% ударов) и исцелите раненых.
                    </p>
                  </div>
                  <div className="text-xs font-mono text-[#CBD5E1]">
                    Пилюли: {consumables.healingPills} · Отвары: {consumables.injuryDecoctions}
                  </div>
                </div>

                <div className="flex-1 min-h-0 space-y-2 overflow-y-auto pr-0.5">
                  {disciples.length === 0 ? (
                    <div className="text-xs text-[#94A3B8] py-8 text-center">
                      Нет учеников в секте.
                    </div>
                  ) : (
                    disciples.map((d) => {
                      const eff = calculateEffectiveStats(d);
                      return (
                        <div
                          key={d.id}
                          className="p-2.5 rounded-xl bg-[#0D1119] border border-[#1B2331] flex flex-wrap items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-[#F3EFE6]">
                              {d.name} · <span className="text-[#94A3B8]">{ARCHETYPE_INFO[d.archetype].name}</span>
                            </div>
                            <div className="text-[11px] text-[#94A3B8] font-mono">
                              Здоровье: {eff.hp}/{eff.maxHp} · Травмы: {d.injuries}/5 · Защита:{' '}
                              {eff.pDef}/{eff.mDef}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => applyHealingPill(d.id)}
                              disabled={consumables.healingPills <= 0 || eff.hp >= eff.maxHp}
                              className="px-2.5 py-1 rounded bg-emerald-700/80 text-white text-[11px] font-semibold disabled:opacity-35"
                            >
                              +Здоровье
                            </button>
                            <button
                              onClick={() => applyInjuryDecoction(d.id)}
                              disabled={consumables.injuryDecoctions <= 0 || d.injuries === 0}
                              className="px-2.5 py-1 rounded bg-amber-600/80 text-white text-[11px] font-semibold disabled:opacity-35"
                            >
                              -Травма
                            </button>
                            {[0, 1, 2, 3].map((slotIdx) => (
                              <button
                                key={slotIdx}
                                disabled={expedition.active}
                                onClick={() =>
                                  assignToSlot(
                                    d.id,
                                    d.lineupSlot === slotIdx ? null : slotIdx
                                  )
                                }
                                className={`px-2 py-1 text-[11px] font-mono rounded ${
                                  d.lineupSlot === slotIdx
                                    ? 'bg-amber-500 text-[#0B0E14] font-semibold'
                                    : 'bg-[#171F2E] text-[#94A3B8] disabled:opacity-40'
                                }`}
                              >
                                Поз.{slotIdx + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            )}

            {/* Подраздел 2.3: Полный Журнал Боевого Похода */}
            {expeditionSubTab === 'LOG' && (
              <section className="flex-1 min-h-0 bg-[#121722] border border-[#222B3B] rounded-xl p-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between shrink-0">
                  <h2 className="text-base font-bold text-[#F3EFE6]">Журнал Боевого Похода</h2>
                  <span className="text-xs text-[#94A3B8]">Новые раунды сверху</span>
                </div>
                <div className="flex-1 min-h-0 bg-[#090C12] border border-[#1B2331] rounded-xl p-3 overflow-y-auto space-y-1.5 font-mono text-xs">
                  {expedition.combatLog.map((line, i) => (
                    <div
                      key={i}
                      className={`leading-relaxed pb-1 border-b border-[#141B26] last:border-none ${
                        line.includes('СЕРДЦЕ ДАО')
                          ? 'text-amber-300 font-semibold'
                          : line.includes('ГИБЕЛЬ В БОЮ')
                          ? 'text-rose-400 font-semibold'
                          : line.includes('Волна') && line.includes('зачищена')
                          ? 'text-emerald-400 font-semibold'
                          : 'text-[#CBD5E1]'
                      }`}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            РАЗДЕЛ 3: ПАВИЛЬОН РЕМЁСЕЛ (3 ПОДРАЗДЕЛА НА ОДИН ЭКРАН)
        -------------------------------------------------------------------- */}
        {activeTab === 'CRAFTS' && (
          <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
            {renderDiscipleSelectorBar()}

            {/* Подраздел 3.1: Алхимик — Основные Эликсиры */}
            {craftsSubTab === 'ELIXIRS' && (
              <section className="flex-1 min-h-0 bg-[#121722] border border-[#222B3B] rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <h2 className="text-base font-bold text-[#F3EFE6]">
                      Алхимический Котёл · Целебные и Прорывные Эликсиры
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 flex-1 items-stretch">
                  <div
                    data-tooltip-title="Пилюля Исцеления Ци"
                    data-tooltip="Мгновенно восстанавливает 60% от максимального здоровья ученика."
                    className="p-3 rounded-xl bg-[#0D1119] border border-[#1B2331] flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#F3EFE6] has-tooltip">
                        Пилюля Исцеления Ци
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        Мгновенно восстанавливает 60% от максимального здоровья ученика.
                      </p>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-[#182030]">
                      <div className="text-[11px] font-mono text-[#CBD5E1]">
                        Цена: 8 камней · 3 мха | Запас: {consumables.healingPills}
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => craftAlchemyConsumable('HEAL')}
                          disabled={resources.spiritStones < 8 || resources.bloodMoss < 3}
                          className="flex-1 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-[#0B0E14] disabled:bg-[#1A2232] disabled:text-[#64748B]"
                        >
                          Сварить
                        </button>
                        {selectedDisciple && (
                          <button
                            onClick={() => applyHealingPill(selectedDisciple.id)}
                            disabled={consumables.healingPills <= 0}
                            className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#1A2232] text-emerald-400 disabled:opacity-40"
                          >
                            Дать адепту
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    data-tooltip-title="Отвар Очищения Меридианов"
                    data-tooltip="Снимает 2 стака стихийных травм и разблокирует естественный отдых при 5/5 травмах."
                    className="p-3 rounded-xl bg-[#0D1119] border border-[#1B2331] flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#F3EFE6] has-tooltip">
                        Отвар Очищения Меридианов
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        Снимает 2 стака стихийных травм и разблокирует естественный отдых при 5/5 травмах.
                      </p>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-[#182030]">
                      <div className="text-[11px] font-mono text-[#CBD5E1]">
                        Цена: 10 камн. · 2 мха · 3 панц. | Запас: {consumables.injuryDecoctions}
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => craftAlchemyConsumable('INJURY')}
                          disabled={
                            resources.spiritStones < 10 ||
                            resources.bloodMoss < 2 ||
                            resources.spiderCarapace < 3
                          }
                          className="flex-1 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-[#0B0E14] disabled:bg-[#1A2232] disabled:text-[#64748B]"
                        >
                          Сварить
                        </button>
                        {selectedDisciple && (
                          <button
                            onClick={() => applyInjuryDecoction(selectedDisciple.id)}
                            disabled={
                              consumables.injuryDecoctions <= 0 || selectedDisciple.injuries === 0
                            }
                            className="px-3 py-2 rounded-lg text-xs font-semibold bg-[#1A2232] text-amber-300 disabled:opacity-40"
                          >
                            Дать адепту
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    data-tooltip-title="Пилюля Прорыва Основы"
                    data-tooltip="Повышает вероятность успешного возвышения во II царство на +25%."
                    className="p-3 rounded-xl bg-[#0D1119] border border-[#1B2331] flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#F3EFE6] has-tooltip">
                        Пилюля Прорыва Основы
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        Повышает вероятность успешного возвышения во II царство на +25%.
                      </p>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-[#182030]">
                      <div className="text-[11px] font-mono text-[#CBD5E1]">
                        Цена: 20 камн. · 2 жел. · 4 мха · 4 панц. | Запас:{' '}
                        {consumables.breakthroughPills}
                      </div>
                      <button
                        onClick={() => craftAlchemyConsumable('BREAKTHROUGH')}
                        disabled={
                          resources.spiritStones < 20 ||
                          resources.bogIron < 2 ||
                          resources.bloodMoss < 4 ||
                          resources.spiderCarapace < 4
                        }
                        className="w-full py-2 rounded-lg text-xs font-semibold bg-amber-500 text-[#0B0E14] disabled:bg-[#1A2232] disabled:text-[#64748B]"
                      >
                        Сварить Пилюлю Прорыва
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Подраздел 3.2: Алхимик — 6 Перманентных пилюль потенциала */}
            {craftsSubTab === 'POTENTIAL' && (
              <section className="flex-1 min-h-0 bg-[#121722] border border-[#222B3B] rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <div>
                    <h2 className="text-base font-bold text-[#F3EFE6]">
                      Пилюли Потенциала (6 видов навсегда)
                    </h2>
                    <p className="text-xs text-[#94A3B8]">
                      Стоимость варки каждой пилюли: 12 камней · 2 железа · 2 мха · 1 панцирь.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 flex-1 items-stretch">
                  {(Object.keys(STAT_PILL_LABELS) as StatPillKey[]).map((key) => {
                    const canCraftPill =
                      resources.spiritStones >= 12 &&
                      resources.bogIron >= 2 &&
                      resources.bloodMoss >= 2 &&
                      resources.spiderCarapace >= 1;
                    const stock = consumables.statPills[key];
                    const discSlot = selectedDisciple?.pillGrid[key];
                    const canFeed =
                      selectedDisciple && discSlot && discSlot.consumed < discSlot.max && stock > 0;
                    const pillInfo = STAT_PILL_LABELS[key];

                    return (
                      <div
                        key={key}
                        data-tooltip-title={pillInfo.name}
                        data-tooltip={`Постоянный эффект: ${pillInfo.bonusText} к базовым характеристикам.\nНа складе: ${stock} шт.`}
                        className="p-3 rounded-xl bg-[#0D1119] border border-[#1B2331] flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#F3EFE6] has-tooltip">
                              {pillInfo.shortStat}
                            </span>
                            <span className="font-mono text-amber-400">Склад: {stock}</span>
                          </div>
                          <div className="text-[11px] text-[#94A3B8] mt-0.5">
                            {pillInfo.bonusText}
                          </div>
                          {discSlot && (
                            <div className="text-[11px] font-mono text-[#CBD5E1] mt-1">
                              У {selectedDisciple?.name}: {discSlot.consumed}/{discSlot.max}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-1.5 pt-2">
                          <button
                            onClick={() => craftAlchemyConsumable(key)}
                            disabled={!canCraftPill}
                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-[#0B0E14] disabled:bg-[#1A2232] disabled:text-[#64748B]"
                          >
                            Сварить
                          </button>
                          {selectedDisciple && (
                            <button
                              onClick={() => feedPermanentStatPill(selectedDisciple.id, key)}
                              disabled={!canFeed}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#1A2232] text-emerald-400 disabled:opacity-35"
                            >
                              Принять
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Подраздел 3.3: Кузня Чёрного Железа и Арсенал Склада */}
            {craftsSubTab === 'FORGE' && (
              <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-2.5">
                <section className="md:col-span-7 bg-[#121722] border border-[#222B3B] rounded-xl p-3.5 flex flex-col justify-between gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <Hammer className="w-4 h-4 text-amber-400" />
                    <h2 className="text-base font-bold text-[#F3EFE6]">
                      Кузня Чёрного Железа
                    </h2>
                  </div>

                  <div className="space-y-2 flex-1 flex flex-col justify-center">
                    {BLACKSMITH_RECIPES.map((rec) => {
                      const affordable = canAfford(rec.cost);
                      return (
                        <div
                          key={rec.templateId}
                          className="p-2.5 rounded-xl bg-[#0D1119] border border-[#1B2331] flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="text-xs font-semibold text-[#F3EFE6]">{rec.name}</div>
                            <div className="text-[11px] text-[#94A3B8]">{rec.description}</div>
                            <div className="text-[11px] text-amber-400 font-mono mt-0.5">
                              Цена: {rec.cost.spiritStones} камн. · {rec.cost.bogIron} жел. ·{' '}
                              {rec.cost.bloodMoss} мха · {rec.cost.spiderCarapace} панц.
                            </div>
                          </div>
                          <button
                            onClick={() => craftBlacksmithItem(rec)}
                            disabled={!affordable}
                            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-[#0B0E14] disabled:bg-[#1A2232] disabled:text-[#64748B] shrink-0"
                          >
                            Выковать
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="md:col-span-5 bg-[#121722] border border-[#222B3B] rounded-xl p-3.5 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between shrink-0">
                    <h3 className="text-sm font-bold text-[#F3EFE6]">
                      Арсенал Склада ({warehouseGear.length})
                    </h3>
                    {selectedDisciple && (
                      <span className="text-[11px] text-[#94A3B8]">
                        Для: {selectedDisciple.name}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                    {warehouseGear.length === 0 ? (
                      <div className="text-xs text-[#64748B] py-6 text-center">
                        На складе нет свободного снаряжения. Выкуйте клинок, посох или доспех слева.
                      </div>
                    ) : (
                      warehouseGear.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-[#0D1119] border border-[#1B2331] flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-[#F3EFE6] truncate">{item.name}</div>
                            <div className="text-[10px] text-[#94A3B8] truncate">
                              {item.description}
                            </div>
                          </div>
                          {selectedDisciple && (
                            <button
                              onClick={() => equipGearOnDisciple(selectedDisciple.id, item.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-[#0B0E14] font-semibold text-[11px] shrink-0"
                            >
                              Надеть
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            РАЗДЕЛ 4: ЛЕТОПИСЬ СЕКТЫ (2 ПОДРАЗДЕЛА НА ОДИН ЭКРАН)
        -------------------------------------------------------------------- */}
        {activeTab === 'CHRONICLE' && (
          <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
            {chronicleSubTab === 'EVENTS' && (
              <section className="flex-1 min-h-0 bg-[#121722] border border-[#222B3B] rounded-xl p-3.5 flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <h2 className="text-base font-bold text-[#F3EFE6]">Летопись Событий Секты</h2>
                  <div className="flex flex-wrap items-center gap-1 bg-[#0D1119] p-1 rounded-lg border border-[#1B2331]">
                    <button
                      onClick={() => setChronicleFilter('ALL')}
                      className={`px-2 py-0.5 text-[11px] rounded ${
                        chronicleFilter === 'ALL'
                          ? 'bg-amber-500 text-[#0B0E14] font-semibold'
                          : 'text-[#94A3B8]'
                      }`}
                    >
                      Все ({chronicle.length})
                    </button>
                    {(['COMBAT', 'ECONOMY', 'BREAKTHROUGH', 'CRAFT', 'DEATH'] as ChronicleCategory[]).map(
                      (cat) => (
                        <button
                          key={cat}
                          onClick={() => setChronicleFilter(cat)}
                          className={`px-2 py-0.5 text-[11px] rounded ${
                            chronicleFilter === cat
                              ? 'bg-amber-500 text-[#0B0E14] font-semibold'
                              : 'text-[#94A3B8]'
                          }`}
                        >
                          {CHRONICLE_CATEGORY_LABELS[cat]}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                  {filteredChronicle.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2.5 rounded-xl bg-[#0D1119] border border-[#1B2331] text-xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                        <span>{CHRONICLE_CATEGORY_LABELS[entry.category]}</span>
                        <span className="font-mono tabular-nums">{entry.time}</span>
                      </div>
                      <div className="font-semibold text-[#F3EFE6]">{entry.title}</div>
                      <div className="text-[#94A3B8] leading-snug">{entry.detail}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {chronicleSubTab === 'MEMORIAL' && (
              <section className="flex-1 min-h-0 bg-[#121722] border border-[#222B3B] rounded-xl p-3.5 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-rose-400 shrink-0">
                  <Skull className="w-4 h-4" />
                  <h2 className="text-base font-bold text-[#F3EFE6]">
                    Зал Предков · Павшие в Карстовом Разломе ({fallenMemorial.length})
                  </h2>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                  {fallenMemorial.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-[#64748B] text-center">
                      Ни один ученик ещё не пал в бою.
                    </div>
                  ) : (
                    fallenMemorial.map((f) => (
                      <div
                        key={f.id}
                        className="p-3 rounded-xl bg-[#0D1119] border border-rose-900/40 text-xs space-y-1"
                      >
                        <div className="flex justify-between">
                          <span className="font-semibold text-[#F3EFE6]">{f.name}</span>
                          <span className="text-[11px] text-[#94A3B8] font-mono">{f.time}</span>
                        </div>
                        <div className="text-[11px] text-[#94A3B8]">
                          {f.realmLabel} · {f.archetypeLabel}
                        </div>
                        <div className="text-[11px] text-rose-300">{f.causeOfDeath}</div>
                        {f.recoveredGearNames.length > 0 && (
                          <div className="text-[11px] text-emerald-400">
                            Спасено соратниками: {f.recoveredGearNames.join(', ')}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* =====================================================================
          МОДАЛЬНОЕ ОКНО ПРОРЫВА ВО ВТОРОЕ ЦАРСТВО
      ====================================================================== */}
      {breakthroughModalDiscipleId &&
        (() => {
          const disc = disciples.find((d) => d.id === breakthroughModalDiscipleId);
          if (!disc) return null;
          const { chancePercent, hasEnvPenalty } = getBreakthroughChance(
            disc,
            sectLevel,
            usePillOnBreakthrough && consumables.breakthroughPills > 0
          );

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <div className="bg-[#121722] border border-[#2C374B] rounded-2xl max-w-lg w-full p-4 space-y-3">
                <div>
                  <div className="text-xs text-amber-400">
                    Пик Закалки Тела (5-я ступень) → Возведение Основы (II царство)
                  </div>
                  <h3 className="text-lg font-bold text-[#F3EFE6] mt-0.5">
                    Выбор Боевого Пути: {disc.name}
                  </h3>
                </div>

                {hasEnvPenalty && (
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200">
                    Ограничение среды: Обитель находится на I ступени («Забытая Нора»), шанс снижен на -35%.
                  </div>
                )}

                <div className="space-y-1.5">
                  {(['SWORDSMAN', 'GUARDIAN', 'FLAME_ADEPT'] as ArchetypeId[]).map((archKey) => {
                    const info = ARCHETYPE_INFO[archKey];
                    const selected = selectedT2Archetype === archKey;
                    return (
                      <button
                        key={archKey}
                        onClick={() => setSelectedT2Archetype(archKey)}
                        data-tooltip-title={`Боевой Путь: ${info.name}`}
                        data-tooltip={formatArchetypeTooltip(archKey)}
                        className={`w-full p-2.5 rounded-xl border text-left transition-colors ${
                          selected
                            ? 'bg-[#1A2436] border-amber-500'
                            : 'bg-[#0D1119] border-[#1B2331]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold text-[#F3EFE6]">
                          <span>{info.name}</span>
                          <span className="text-amber-400">{info.role}</span>
                        </div>
                        <div className="text-[11px] text-[#94A3B8] mt-0.5">{info.description}</div>
                        <div className="text-[11px] text-emerald-400 mt-0.5">
                          {formatArchetypeBonusText(archKey)}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <label
                  data-tooltip-title="Пилюля Прорыва Основы"
                  data-tooltip="Концентрированный эликсир духовных трав. Повышает шанс успешного возвышения во II царство на +25%."
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#0D1119] border border-[#1B2331] text-xs cursor-pointer"
                >
                  <span className="has-tooltip">
                    Использовать Пилюлю Прорыва Основы (+25% к шансу, запас:{' '}
                    {consumables.breakthroughPills})
                  </span>
                  <input
                    type="checkbox"
                    checked={usePillOnBreakthrough && consumables.breakthroughPills > 0}
                    disabled={consumables.breakthroughPills <= 0}
                    onChange={(e) => setUsePillOnBreakthrough(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                </label>

                <div className="flex items-center justify-between text-sm font-mono tabular-nums">
                  <span className="text-[#94A3B8]">Итоговый шанс возвышения:</span>
                  <span className="font-bold text-amber-400">{chancePercent}%</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setBreakthroughModalDiscipleId(null)}
                    className="flex-1 py-2 px-4 rounded-xl text-xs font-semibold bg-[#1A2232] text-[#CBD5E1]"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={confirmRealmT2Breakthrough}
                    className="flex-1 py-2 px-4 rounded-xl text-xs font-semibold bg-amber-500 text-[#0B0E14]"
                  >
                    Начать Прорыв
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* =====================================================================
          4. НИЖНЕЕ БАР-МЕНЮ (4 ГЛАВНЫХ РАЗДЕЛА)
      ====================================================================== */}
      <nav
        aria-label="Нижняя навигация"
        className="shrink-0 bg-[#0B0E14] border-t border-[#1E2636] grid grid-cols-4 items-center h-14 px-2 max-w-5xl w-full mx-auto"
      >
        <button
          onClick={() => setActiveTab('ABODE')}
          className={`flex flex-col items-center justify-center min-h-[44px] text-[11px] font-medium transition-colors ${
            activeTab === 'ABODE' ? 'text-amber-400' : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="mt-0.5 whitespace-nowrap">
            Обитель ({disciples.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('EXPEDITION')}
          className={`flex flex-col items-center justify-center min-h-[44px] text-[11px] font-medium transition-colors ${
            activeTab === 'EXPEDITION' ? 'text-amber-400' : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span className="mt-0.5 whitespace-nowrap">
            {expedition.active ? `Разлом (Ярус ${expedition.depthStage})` : 'Разлом'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CRAFTS')}
          className={`flex flex-col items-center justify-center min-h-[44px] text-[11px] font-medium transition-colors ${
            activeTab === 'CRAFTS' ? 'text-amber-400' : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span className="mt-0.5 whitespace-nowrap">Ремёсла</span>
        </button>

        <button
          onClick={() => setActiveTab('CHRONICLE')}
          className={`flex flex-col items-center justify-center min-h-[44px] text-[11px] font-medium transition-colors ${
            activeTab === 'CHRONICLE' ? 'text-amber-400' : 'text-[#94A3B8] hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="mt-0.5 whitespace-nowrap">Летопись</span>
        </button>
      </nav>
      <Tooltip />
    </div>
  );
}
