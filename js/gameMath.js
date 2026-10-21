/**
 * МАТЕМАТИЧЕСКОЕ ЯДРО: IDLE SECT MANAGER (XIANXIA ALPHA MVP)
 * Справочники санься, генератор учеников, формулы урона, 80% агро 1-й позиции,
 * Сердце Дао, Перманентная смерть, Стихийные травмы и экономика 90/10.
 */
(function () {
  window.SectGame = window.SectGame || {};

  const SURNAMES = [
    'Линь', 'Фэн', 'Су', 'Чжао', 'Е', 'Мо', 'Бай', 'Хань', 'Чу', 'Шэнь', 'Гу', 'Юнь', 'Цзян', 'Лу', 'Сяо'
  ];

  const MALE_NAMES = [
    'Сюань', 'Чэнь', 'Янь', 'Фэн', 'Хао', 'Мин', 'Лун', 'Хань', 'Чжэнь', 'Кунь', 'Юй', 'Цзе'
  ];

  const FEMALE_NAMES = [
    'Юэ', 'Лань', 'Сюэ', 'Цин', 'Яо', 'Мэй', 'Жо', 'Нин', 'Шуан', 'Синь', 'Ли', 'Хуа'
  ];

  const CHRONICLE_CATEGORY_LABELS = {
    SECT: 'Обитель',
    RECRUIT: 'Чайный павильон',
    COMBAT: 'Поход',
    ECONOMY: 'Казна и обмен',
    CRAFT: 'Павильон ремёсел',
    BREAKTHROUGH: 'Прорыв царства',
    DEATH: 'Павшие',
    DAO_HEART: 'Сердце Дао',
  };

  const SPIRIT_ROOTS = [
    {
      id: 'MORTAL_MIXED',
      name: 'Пятиэлементный Смешанный Корень',
      isWuXing: true,
      isDarkRoot: false,
      expMultiplier: 0.9,
      statBias: { maxHp: 8, pDef: 2, mDef: 2 },
      description: 'Рассеянная ци пяти стихий У-Син. Медленное накопление опыта, но выносливое тело.',
    },
    {
      id: 'EARTH_VEIN',
      name: 'Земной Корень Черного Камня',
      isWuXing: true,
      isDarkRoot: false,
      expMultiplier: 1.0,
      statBias: { maxHp: 18, pDef: 5, mDef: 3 },
      description: 'Стихийный корень Земли (У-Син). Повышает защиту и живучесть в авангарде.',
    },
    {
      id: 'CRIMSON_FLAME',
      name: 'Истинный Корень Багрового Пламени',
      isWuXing: true,
      isDarkRoot: false,
      expMultiplier: 1.15,
      statBias: { mAtk: 6, pAtk: 4, crit: 3 },
      description: 'Стихийный корень Огня (У-Син). Ускоряет культивацию и усиливает атакующий потенциал.',
    },
    {
      id: 'FROST_JADE',
      name: 'Ледяной Нефритовый Корень',
      isWuXing: true,
      isDarkRoot: false,
      expMultiplier: 1.2,
      statBias: { mAtk: 5, mDef: 5, spd: 3 },
      description: 'Стихийный корень Воды (У-Син). Высокая скорость и духовная защита.',
    },
    {
      id: 'HEAVENLY_VOID',
      name: 'Небесный Корень Изначальной Пустоты',
      isWuXing: false,
      isDarkRoot: false,
      expMultiplier: 1.35,
      statBias: { pAtk: 5, mAtk: 5, spd: 4, eva: 4, crit: 3 },
      description: 'Редчайший дар Небес (+35% к скорости постижения Ци и сбалансированные статы).',
    },
  ];

  const DARK_SPIRIT_ROOTS = [
    {
      id: 'DARK_BLOOD_SHADOW',
      name: 'Дьявольский Корень (Кровь / Тень)',
      isWuXing: false,
      isDarkRoot: true,
      expMultiplier: 1.3,
      statBias: { pAtk: 7, mAtk: 7, crit: 5, spd: 3 },
      description: 'Искажённый демонический корень Крови и Тени. Пробуждён падением на Дьявольский путь.',
    },
    {
      id: 'DARK_POISON_DECAY',
      name: 'Дьявольский Корень (Яд / Гниль)',
      isWuXing: false,
      isDarkRoot: true,
      expMultiplier: 1.3,
      statBias: { mAtk: 9, maxHp: 20, pDef: 4, mDef: 4 },
      description: 'Искажённый демонический корень Яда и Гнили. Пробуждён падением на Дьявольский путь.',
    },
  ];

  const CONSTITUTIONS = [
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

  const TEMPERAMENT_INFO = {
    NORMAL: {
      name: 'Спокойный',
      alignment: 'LIGHT',
      summary: 'Уравновешенный нрав. Склонен к просветлению духа, 10% добычи в мошну.',
      lootCutPercent: 0.10,
      lootBonusMultiplier: 1.0,
      injuryRiskBonus: 0,
    },
    RIGHTEOUS: {
      name: 'Праведный',
      alignment: 'LIGHT',
      summary: 'Верность братству и путям Света. Мстит за павших соратников и укрепляет Сердце Дао.',
      lootCutPercent: 0.10,
      lootBonusMultiplier: 1.0,
      injuryRiskBonus: 0,
    },
    STOIC: {
      name: 'Стойкий',
      alignment: 'LIGHT',
      summary: 'Несгибаемая воля перед лицом бедствий. Устойчив к отчаянию и укрепляет дух в боях.',
      lootCutPercent: 0.10,
      lootBonusMultiplier: 1.0,
      injuryRiskBonus: -0.05,
    },
    COWARDLY: {
      name: 'Трусливый',
      alignment: 'DARK',
      summary: '+6% к уклонению, склонен к панике и бегству при тяжёлых ранениях.',
      lootCutPercent: 0.10,
      lootBonusMultiplier: 0.95,
      injuryRiskBonus: -0.1,
    },
    GREEDY: {
      name: 'Жадный',
      alignment: 'DARK',
      summary: '+15% к поиску ресурсов в Разломе, удерживает 15% добычи и жаждет наживы.',
      lootCutPercent: 0.15,
      lootBonusMultiplier: 1.15,
      injuryRiskBonus: 0.05,
    },
    RECKLESS: {
      name: 'Безрассудный',
      alignment: 'DARK',
      summary: '+18% к атаке и +5% к криту, но -12% к защите и нестабильный дух при ранениях.',
      lootCutPercent: 0.10,
      lootBonusMultiplier: 1.05,
      injuryRiskBonus: 0.2,
    },
    PROUD: {
      name: 'Горделивый',
      alignment: 'DARK',
      summary: 'Высокомерный нрав (+8% к атаке). Тяжело переживает поражения, травмы и срывы прорыва.',
      lootCutPercent: 0.10,
      lootBonusMultiplier: 1.0,
      injuryRiskBonus: 0.1,
    },
    CUNNING: {
      name: 'Коварный',
      alignment: 'DARK',
      summary: 'Хитрый и расчётливый ум (+4% к криту и уклонению), легко поддаётся тёмным искушениям.',
      lootCutPercent: 0.12,
      lootBonusMultiplier: 1.08,
      injuryRiskBonus: 0,
    },
  };

  const ARCHETYPE_INFO = {
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
      description: 'Несокрушимый щит секты. Идеален для 1-й позиции строя, поглощающей 80% вражеских ударов.',
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

  const STAT_PILL_LABELS = {
    pAtk: { name: 'Пилюля Костного Мозга', shortStat: 'Физ. атака', bonusText: '+1 к физ. атаке навсегда' },
    mAtk: { name: 'Пилюля Астрального Духа', shortStat: 'Маг. атака', bonusText: '+1 к маг. атаке навсегда' },
    pDef: { name: 'Пилюля Железной Кожи', shortStat: 'Физ. защита', bonusText: '+1 к физ. защите навсегда' },
    mDef: { name: 'Пилюля Нефритового Сердца', shortStat: 'Маг. защита', bonusText: '+1 к маг. защите навсегда' },
    spd: { name: 'Пилюля Поступи Ветра', shortStat: 'Скорость', bonusText: '+1 к скорости навсегда' },
    maxHp: { name: 'Пилюля Жизненной Крови', shortStat: 'Здоровье', bonusText: '+12 к макс. здоровью навсегда' },
  };

  const SECT_LEVELS = {
    1: {
      level: 1,
      name: 'Забытая Нора',
      subtitle: 'Обитель I ступени · Разреженная духовная жила',
      maxComfortTier: 1,
      passiveHealRate: 4,
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
      passiveHealRate: 10,
      qiDensityBonus: 1.35,
    },
  };

  const CRAFT_STATIONS = {
    FORGE: {
      id: 'FORGE',
      name: 'Кузница',
      fullTitle: 'Кузня Чёрного Железа',
      profession: 'Кузнец духовной стали',
      description: 'Ковка боевых клинков, сабель и алебард.',
    },
    LOOM: {
      id: 'LOOM',
      name: 'Ткацкий станок',
      fullTitle: 'Духовный Ткацкий Станок',
      profession: 'Ткач защитных облачений',
      description: 'Пошив панцирных лат, шёлковых мантий и одеяний.',
    },
    CAULDRON: {
      id: 'CAULDRON',
      name: 'Котёл',
      fullTitle: 'Алхимический Котёл',
      profession: 'Мастер пилюль и отваров',
      description: 'Варка целебных снадобий, пилюль прорыва и эликсиров потенциала.',
    },
    ALTAR: {
      id: 'ALTAR',
      name: 'Алтарь',
      fullTitle: 'Алтарь Духовных Артефактов',
      profession: 'Резчик защитных формаций',
      description: 'Освящение посохов, нефритовых зерцал и колоколов защиты.',
    },
    TABLE: {
      id: 'TABLE',
      name: 'Стол',
      fullTitle: 'Стол Начертания Талисманов',
      profession: 'Мастер боевых печатей',
      description: 'Начертание кровавых рун, громовых указов и небесных печатей.',
    },
  };

  const CRAFT_RECIPES = [
    // --- КУЗНИЦА (FORGE) ---
    {
      id: 'BOG_IRON_BLADE',
      templateId: 'BOG_IRON_BLADE',
      stationId: 'FORGE',
      category: 'GEAR',
      name: 'Клинок Болотного Железа',
      slot: 'WEAPON',
      tier: 1,
      baseTimeSec: 2,
      baseExp: 20,
      rareMaterialKey: 'bogIron',
      cost: { spiritStones: 12, bogIron: 6, bloodMoss: 0, spiderCarapace: 2 },
      bonuses: { pAtk: 9, spd: 2, crit: 3 },
      description: 'Тяжёлый меч Т1 из болотной руды (+9 физ. атк, +2 скор., +3% крит).',
    },
    {
      id: 'CRIMSON_STEEL_SABER',
      templateId: 'CRIMSON_STEEL_SABER',
      stationId: 'FORGE',
      category: 'GEAR',
      name: 'Сабля Багровой Стали',
      slot: 'WEAPON',
      tier: 2,
      baseTimeSec: 3,
      baseExp: 45,
      rareMaterialKey: 'bogIron',
      cost: { spiritStones: 24, bogIron: 10, bloodMoss: 3, spiderCarapace: 3 },
      bonuses: { pAtk: 19, spd: 4, crit: 6 },
      description: 'Клинок Т2 с закалкой в крови демонов (+19 физ. атк, +4 скор., +6% крит).',
    },
    {
      id: 'VOID_DRAGON_HALBERD',
      templateId: 'VOID_DRAGON_HALBERD',
      stationId: 'FORGE',
      category: 'GEAR',
      name: 'Алебарда Дракона Пустоты',
      slot: 'WEAPON',
      tier: 3,
      baseTimeSec: 4,
      baseExp: 95,
      rareMaterialKey: 'bogIron',
      cost: { spiritStones: 45, bogIron: 16, bloodMoss: 6, spiderCarapace: 8 },
      bonuses: { pAtk: 34, mAtk: 12, spd: 6, crit: 10 },
      description: 'Реликвия Т3 грандмастера ковки (+34 физ. атк, +12 маг. атк, +6 скор., +10% крит).',
    },

    // --- ТКАЦКИЙ СТАНОК (LOOM) ---
    {
      id: 'CARAPACE_CUIRASS',
      templateId: 'CARAPACE_CUIRASS',
      stationId: 'LOOM',
      category: 'GEAR',
      name: 'Латы Паучьего Панциря',
      slot: 'ARMOR',
      tier: 1,
      baseTimeSec: 2,
      baseExp: 20,
      rareMaterialKey: 'spiderCarapace',
      cost: { spiritStones: 14, bogIron: 4, bloodMoss: 2, spiderCarapace: 6 },
      bonuses: { maxHp: 42, pDef: 10, mDef: 7 },
      description: 'Прочный доспех Т1 из хитина ткачей (+42 здоровья, +10 физ. и +7 маг. защ.).',
    },
    {
      id: 'SILK_CLOUD_ROBE',
      templateId: 'SILK_CLOUD_ROBE',
      stationId: 'LOOM',
      category: 'GEAR',
      name: 'Облачная Мантия Шёлка',
      slot: 'ARMOR',
      tier: 2,
      baseTimeSec: 3,
      baseExp: 45,
      rareMaterialKey: 'spiderCarapace',
      cost: { spiritStones: 26, bogIron: 4, bloodMoss: 6, spiderCarapace: 10 },
      bonuses: { maxHp: 85, pDef: 16, mDef: 18, eva: 5 },
      description: 'Духовное одеяние Т2 (+85 здоровья, +16 физ. защ., +18 маг. защ., +5% укл.).',
    },
    {
      id: 'IMMORTAL_CRANE_VESTMENT',
      templateId: 'IMMORTAL_CRANE_VESTMENT',
      stationId: 'LOOM',
      category: 'GEAR',
      name: 'Облачение Небесного Журавля',
      slot: 'ARMOR',
      tier: 3,
      baseTimeSec: 4,
      baseExp: 95,
      rareMaterialKey: 'spiderCarapace',
      cost: { spiritStones: 48, bogIron: 8, bloodMoss: 10, spiderCarapace: 16 },
      bonuses: { maxHp: 150, pDef: 28, mDef: 30, spd: 5, eva: 8 },
      description: 'Покров Т3 из нитей духовного шёлка (+150 здоровья, +28/+30 защиты, +8% укл.).',
    },

    // --- АЛТАРЬ (ALTAR) ---
    {
      id: 'MOSS_SPIRIT_STAFF',
      templateId: 'MOSS_SPIRIT_STAFF',
      stationId: 'ALTAR',
      category: 'GEAR',
      name: 'Посох Кровавого Мха',
      slot: 'WEAPON',
      tier: 1,
      baseTimeSec: 2,
      baseExp: 20,
      rareMaterialKey: 'bloodMoss',
      cost: { spiritStones: 12, bogIron: 3, bloodMoss: 5, spiderCarapace: 2 },
      bonuses: { mAtk: 10, mDef: 4, spd: 2 },
      description: 'Проводник духовной энергии Т1 (+10 маг. атк, +4 маг. защ., +2 скор.).',
    },
    {
      id: 'JADE_AEGIS_ARMOR',
      templateId: 'JADE_AEGIS_ARMOR',
      stationId: 'ALTAR',
      category: 'GEAR',
      name: 'Нефритовое Зерцало Оплота',
      slot: 'ARMOR',
      tier: 2,
      baseTimeSec: 3,
      baseExp: 45,
      rareMaterialKey: 'bogIron',
      cost: { spiritStones: 25, bogIron: 9, bloodMoss: 5, spiderCarapace: 5 },
      bonuses: { maxHp: 95, pDef: 22, mDef: 14 },
      description: 'Зачарованный панцирь Т2 (+95 здоровья, +22 физ. защ., +14 маг. защ.).',
    },
    {
      id: 'HEAVENLY_BELL_ARMOR',
      templateId: 'HEAVENLY_BELL_ARMOR',
      stationId: 'ALTAR',
      category: 'GEAR',
      name: 'Колокол Изначальной Защиты',
      slot: 'ARMOR',
      tier: 3,
      baseTimeSec: 4,
      baseExp: 95,
      rareMaterialKey: 'spiderCarapace',
      cost: { spiritStones: 50, bogIron: 12, bloodMoss: 12, spiderCarapace: 14 },
      bonuses: { maxHp: 180, pDef: 35, mDef: 35 },
      description: 'Артефактный барьер Т3 (+180 здоровья, +35 физ. и +35 маг. защиты).',
    },

    // --- СТОЛ (TABLE) ---
    {
      id: 'BLOOD_RUNE_TALISMAN',
      templateId: 'BLOOD_RUNE_TALISMAN',
      stationId: 'TABLE',
      category: 'GEAR',
      name: 'Талисман Кровавой Печати',
      slot: 'WEAPON',
      tier: 1,
      baseTimeSec: 2,
      baseExp: 20,
      rareMaterialKey: 'bloodMoss',
      cost: { spiritStones: 12, bogIron: 2, bloodMoss: 6, spiderCarapace: 1 },
      bonuses: { mAtk: 11, crit: 4, spd: 2 },
      description: 'Боевой свиток Т1 из киновари и мха (+11 маг. атк, +4% крит, +2 скор.).',
    },
    {
      id: 'THUNDER_DECREE_SWORD',
      templateId: 'THUNDER_DECREE_SWORD',
      stationId: 'TABLE',
      category: 'GEAR',
      name: 'Меч Громового Указа',
      slot: 'WEAPON',
      tier: 2,
      baseTimeSec: 3,
      baseExp: 45,
      rareMaterialKey: 'bloodMoss',
      cost: { spiritStones: 24, bogIron: 4, bloodMoss: 10, spiderCarapace: 4 },
      bonuses: { mAtk: 22, pAtk: 8, spd: 5, crit: 7 },
      description: 'Свиток-клинок Т2 небесного грома (+22 маг. атк, +8 физ. атк, +5 скор., +7% крит).',
    },
    {
      id: 'NINE_HEAVENS_SEAL',
      templateId: 'NINE_HEAVENS_SEAL',
      stationId: 'TABLE',
      category: 'GEAR',
      name: 'Печать Девяти Небес',
      slot: 'WEAPON',
      tier: 3,
      baseTimeSec: 4,
      baseExp: 95,
      rareMaterialKey: 'bloodMoss',
      cost: { spiritStones: 46, bogIron: 8, bloodMoss: 16, spiderCarapace: 8 },
      bonuses: { mAtk: 38, spd: 7, crit: 12, eva: 5 },
      description: 'Божественная печать Т3 (+38 маг. атк, +7 скор., +12% крит, +5% укл.).',
    },

    // --- КОТЁЛ (CAULDRON) ---
    {
      id: 'ELIXIR_HEAL',
      templateId: 'ELIXIR_HEAL',
      stationId: 'CAULDRON',
      category: 'ALCHEMY',
      alchemyType: 'HEAL',
      name: 'Пилюля Исцеления Ци',
      tier: 1,
      baseTimeSec: 2,
      baseExp: 16,
      rareMaterialKey: 'bloodMoss',
      cost: { spiritStones: 8, bogIron: 0, bloodMoss: 3, spiderCarapace: 0 },
      description: 'Мгновенно восстанавливает 60% от макс. здоровья ученика.',
    },
    {
      id: 'ELIXIR_INJURY',
      templateId: 'ELIXIR_INJURY',
      stationId: 'CAULDRON',
      category: 'ALCHEMY',
      alchemyType: 'INJURY',
      name: 'Отвар Очищения Меридианов',
      tier: 1,
      baseTimeSec: 2,
      baseExp: 18,
      rareMaterialKey: 'spiderCarapace',
      cost: { spiritStones: 10, bogIron: 0, bloodMoss: 2, spiderCarapace: 3 },
      description: 'Снимает 2 стака стихийных травм и разблокирует отдых при 5/5 травмах.',
    },
    {
      id: 'ELIXIR_BREAKTHROUGH',
      templateId: 'ELIXIR_BREAKTHROUGH',
      stationId: 'CAULDRON',
      category: 'ALCHEMY',
      alchemyType: 'BREAKTHROUGH',
      name: 'Пилюля Прорыва Основы',
      tier: 2,
      baseTimeSec: 3,
      baseExp: 42,
      rareMaterialKey: 'bloodMoss',
      cost: { spiritStones: 20, bogIron: 2, bloodMoss: 4, spiderCarapace: 4 },
      description: 'Эликсир Т2: повышает вероятность возвышения во II царство на +25%.',
    },
    {
      id: 'ELIXIR_GOLDEN_CORE',
      templateId: 'ELIXIR_GOLDEN_CORE',
      stationId: 'CAULDRON',
      category: 'ALCHEMY',
      alchemyType: 'GOLDEN_CORE',
      name: 'Пилюля Небесного Истока (Т3)',
      tier: 3,
      baseTimeSec: 4,
      baseExp: 90,
      rareMaterialKey: 'spiderCarapace',
      cost: { spiritStones: 38, bogIron: 6, bloodMoss: 8, spiderCarapace: 8 },
      description: 'Высший эликсир Т3: даёт +2 Пилюли Прорыва и по +1 пилюле потенциала каждого вида.',
    },
  ];

  // Добавим рецепты 6 пилюль потенциала (Т1) в Котёл
  Object.keys(STAT_PILL_LABELS).forEach(function (statKey) {
    CRAFT_RECIPES.push({
      id: 'STAT_PILL_' + statKey,
      templateId: 'STAT_PILL_' + statKey,
      stationId: 'CAULDRON',
      category: 'STAT_PILL',
      statKey: statKey,
      name: STAT_PILL_LABELS[statKey].name,
      tier: 1,
      baseTimeSec: 2,
      baseExp: 18,
      rareMaterialKey: 'bloodMoss',
      cost: { spiritStones: 12, bogIron: 2, bloodMoss: 2, spiderCarapace: 1 },
      description: STAT_PILL_LABELS[statKey].bonusText,
    });
  });

  const BLACKSMITH_RECIPES = CRAFT_RECIPES.filter(function (r) {
    return r.category === 'GEAR';
  });

  const MATERIAL_NAMES = {
    spiritStones: 'Духовные камни',
    bogIron: 'Болотное железо',
    bloodMoss: 'Кровавый мох',
    spiderCarapace: 'Паучий панцирь',
  };

  const SUBLEVEL_MAX_EXP = {
    1: { 1: 60, 2: 90, 3: 130, 4: 185, 5: 250 },
    2: { 1: 180, 2: 250, 3: 340, 4: 460, 5: 620 },
  };

  function randomFloat(min, max) {
    return min + Math.random() * (max - min);
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Возвращает атмосферное текстовое название ступени Сердца Дао по числу (-100..+100) или объекту ученика.
   * Строго без раскрытия числовых значений.
   */
  function getDaoHeartLabel(daoHeart) {
    if (window.SectGame && window.SectGame.i18n) {
      return window.SectGame.i18n.getDaoHeartLabel(daoHeart);
    }
    const rawVal =
      daoHeart && typeof daoHeart === 'object'
        ? typeof daoHeart.daoHeart === 'number' && !isNaN(daoHeart.daoHeart)
          ? daoHeart.daoHeart
          : 0
        : typeof daoHeart === 'number' && !isNaN(daoHeart)
        ? daoHeart
        : 0;
    const val = Math.max(-100, Math.min(100, Math.round(rawVal)));

    if (val >= 80) return 'Алмазное Сердце Дао';
    if (val >= 50) return 'Бесстрашие перед Небесами';
    if (val >= 20) return 'Непоколебимый дух';
    if (val >= -19) return 'Смятение смертного';
    if (val >= -49) return 'Тень Сомнения';
    if (val >= -79) return 'Одержимость (Дьявольский путь)';
    return 'Истинный Демон Сердца';
  }

  /**
   * Семь порогов состояния духа «Весы Сердца Дао» (от -100 до +100).
   * Игрок видит исключительно текстовое название ступени и визуальную шкалу без чисел.
   */
  function getDaoHeartState(unit) {
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
    const i18n = window.SectGame && window.SectGame.i18n;
    const sub = function (id, fallback) {
      return i18n ? i18n.t('daoSub_' + id) : fallback;
    };

    if (val >= 80) {
      return {
        id: 'DIAMOND_HEART',
        name: label,
        colorClass: 'text-amber',
        subtitle: sub(
          'DIAMOND_HEART',
          'Высшая ясность духа: «Второе дыхание» в бою, защита от одержимости и благословение при Прорыве'
        ),
        breakthroughBonus: 15,
        secondWind: true,
        bodyPossessionImmune: true,
        healAndQiBonus: 0,
        fearSuppressed: true,
        dmgMultiplier: 1.0,
        lifesteal: 0,
        combatExpBonus: 0,
        allyDrainChance: 0,
      };
    }
    if (val >= 50) {
      return {
        id: 'FEARLESS_BEFORE_HEAVENS',
        name: label,
        colorClass: 'text-cyan',
        subtitle: sub(
          'FEARLESS_BEFORE_HEAVENS',
          'Просветлённый взор: усилено усвоение целебных пилюль, ускорен набор боевой Ци и укреплён Прорыв'
        ),
        breakthroughBonus: 10,
        secondWind: false,
        bodyPossessionImmune: false,
        healAndQiBonus: 0.10,
        fearSuppressed: true,
        dmgMultiplier: 1.0,
        lifesteal: 0,
        combatExpBonus: 0,
        allyDrainChance: 0,
      };
    }
    if (val >= 20) {
      return {
        id: 'UNWAVERING_SPIRIT',
        name: label,
        colorClass: 'text-cyan',
        subtitle: sub(
          'UNWAVERING_SPIRIT',
          'Твёрдость воли: подавление страха в бою и повышенная устойчивость при Прорыве'
        ),
        breakthroughBonus: 5,
        secondWind: false,
        bodyPossessionImmune: false,
        healAndQiBonus: 0,
        fearSuppressed: true,
        dmgMultiplier: 1.0,
        lifesteal: 0,
        combatExpBonus: 0,
        allyDrainChance: 0,
      };
    }
    if (val >= -19) {
      return {
        id: 'MORTAL_CONFUSION',
        name: label,
        colorClass: 'text-muted',
        subtitle: sub(
          'MORTAL_CONFUSION',
          'Равновесие мирских страстей и стремления к Дао'
        ),
        breakthroughBonus: 0,
        secondWind: false,
        bodyPossessionImmune: false,
        healAndQiBonus: 0,
        fearSuppressed: false,
        dmgMultiplier: 1.0,
        lifesteal: 0,
        combatExpBonus: 0,
        allyDrainChance: 0,
      };
    }
    if (val >= -49) {
      return {
        id: 'SHADOW_OF_DOUBT',
        name: label,
        colorClass: 'text-demonic',
        subtitle: sub(
          'SHADOW_OF_DOUBT',
          'Ярость в ударах в обмен на тревогу духа при возвышении царства'
        ),
        breakthroughBonus: -5,
        secondWind: false,
        bodyPossessionImmune: false,
        healAndQiBonus: 0,
        fearSuppressed: false,
        dmgMultiplier: 1.10,
        lifesteal: 0,
        combatExpBonus: 0,
        allyDrainChance: 0,
      };
    }
    if (val >= -79) {
      return {
        id: 'DEMONIC_OBSESSION',
        name: label,
        colorClass: 'text-rose',
        subtitle: sub(
          'DEMONIC_OBSESSION',
          'Кровавая жажда: свирепый урон и вампиризм, но риск поглощения жизненной силы соратников в бою'
        ),
        breakthroughBonus: -10,
        secondWind: false,
        bodyPossessionImmune: false,
        healAndQiBonus: 0,
        fearSuppressed: false,
        dmgMultiplier: 1.20,
        lifesteal: 0.10,
        combatExpBonus: 0,
        allyDrainChance: 0.40,
      };
    }
    return {
      id: 'TRUE_HEART_DEMON',
      name: label,
      colorClass: 'text-rose',
      subtitle: sub(
        'TRUE_HEART_DEMON',
        'Бездна Дьявольского пути: сокрушительная мощь, вампиризм и хищное поглощение Ци'
      ),
      breakthroughBonus: -15,
      secondWind: false,
      bodyPossessionImmune: false,
      healAndQiBonus: 0,
      fearSuppressed: false,
      dmgMultiplier: 1.35,
      lifesteal: 0.15,
      combatExpBonus: 0.25,
      allyDrainChance: 0.40,
    };
  }

  function calculateEffectiveStats(d) {
    const archBonus = (ARCHETYPE_INFO[d.archetype] && ARCHETYPE_INFO[d.archetype].statBonuses) || {};
    const wep = (d.equippedWeapon && d.equippedWeapon.bonuses) || {};
    const arm = (d.equippedArmor && d.equippedArmor.bonuses) || {};

    const pillMaxHp = ((d.pillGrid && d.pillGrid.maxHp && d.pillGrid.maxHp.consumed) || 0) * 12;
    const pillPAtk = ((d.pillGrid && d.pillGrid.pAtk && d.pillGrid.pAtk.consumed) || 0) * 1;
    const pillMAtk = ((d.pillGrid && d.pillGrid.mAtk && d.pillGrid.mAtk.consumed) || 0) * 1;
    const pillPDef = ((d.pillGrid && d.pillGrid.pDef && d.pillGrid.pDef.consumed) || 0) * 1;
    const pillMDef = ((d.pillGrid && d.pillGrid.mDef && d.pillGrid.mDef.consumed) || 0) * 1;
    const pillSpd = ((d.pillGrid && d.pillGrid.spd && d.pillGrid.spd.consumed) || 0) * 1;

    const daoState = getDaoHeartState(d);

    let maxHp =
      d.stats.maxHp +
      (archBonus.maxHp || 0) +
      (wep.maxHp || 0) +
      (arm.maxHp || 0) +
      pillMaxHp;
    let pAtk =
      d.stats.pAtk +
      (archBonus.pAtk || 0) +
      (wep.pAtk || 0) +
      (arm.pAtk || 0) +
      pillPAtk;
    let mAtk =
      d.stats.mAtk +
      (archBonus.mAtk || 0) +
      (wep.mAtk || 0) +
      (arm.mAtk || 0) +
      pillMAtk;
    let pDef =
      d.stats.pDef +
      (archBonus.pDef || 0) +
      (wep.pDef || 0) +
      (arm.pDef || 0) +
      pillPDef;
    let mDef =
      d.stats.mDef +
      (archBonus.mDef || 0) +
      (wep.mDef || 0) +
      (arm.mDef || 0) +
      pillMDef;
    let spd =
      d.stats.spd +
      (archBonus.spd || 0) +
      (wep.spd || 0) +
      (arm.spd || 0) +
      pillSpd;
    let crit =
      d.stats.crit +
      (archBonus.crit || 0) +
      (wep.crit || 0) +
      (arm.crit || 0);
    let eva =
      d.stats.eva +
      (archBonus.eva || 0) +
      (wep.eva || 0) +
      (arm.eva || 0);

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

    if (d.temperament === 'RECKLESS') {
      pAtk = Math.round(pAtk * 1.18);
      mAtk = Math.round(mAtk * 1.18);
      crit += 5;
      pDef = Math.max(1, Math.round(pDef * 0.88));
      mDef = Math.max(1, Math.round(mDef * 0.88));
    } else if (d.temperament === 'COWARDLY') {
      eva += 6;
      if (clampedCurrentHp / maxHp < 0.35 && !daoState.fearSuppressed) {
        pAtk = Math.max(1, Math.round(pAtk * 0.85));
        mAtk = Math.max(1, Math.round(mAtk * 0.85));
      }
    } else if (d.temperament === 'PROUD') {
      pAtk = Math.round(pAtk * 1.08);
      mAtk = Math.round(mAtk * 1.08);
    } else if (d.temperament === 'CUNNING') {
      crit += 4;
      eva += 4;
    }

    // Бонус урона от отрицательных ступеней Сердца Дао (+10%, +20%, +35%)
    if (daoState.dmgMultiplier && daoState.dmgMultiplier !== 1.0) {
      pAtk = Math.max(1, Math.round(pAtk * daoState.dmgMultiplier));
      mAtk = Math.max(1, Math.round(mAtk * daoState.dmgMultiplier));
    }

    if (d.injuries > 0) {
      const injuryPenalty = Math.max(0.7, 1 - d.injuries * 0.05);
      pDef = Math.max(1, Math.round(pDef * injuryPenalty));
      mDef = Math.max(1, Math.round(mDef * injuryPenalty));
    }

    // Личный Щит Ци (qiShield): у Т1 (Послушники) щита нет (0), с Т2+ рассчитывается по формуле Math.floor(maxHp * 0.20 + (mDef || 5) * 2)
    const maxQiShield =
      (d.realmTier || 1) >= 2
        ? Math.floor(maxHp * 0.20 + (mDef || 5) * 2)
        : 0;
    const rawShield =
      typeof d.qiShield === 'number' && !isNaN(d.qiShield)
        ? d.qiShield
        : d.stats && typeof d.stats.qiShield === 'number' && !isNaN(d.stats.qiShield)
        ? d.stats.qiShield
        : maxQiShield;
    const clampedQiShield = Math.max(0, Math.min(Math.round(rawShield), maxQiShield));

    return {
      hp: clampedCurrentHp,
      maxHp: maxHp,
      qiShield: clampedQiShield,
      maxQiShield: maxQiShield,
      pAtk: pAtk,
      mAtk: mAtk,
      pDef: pDef,
      mDef: mDef,
      spd: spd,
      crit: Math.min(75, crit),
      eva: Math.min(60, eva),
    };
  }

  function syncDiscipleHp(d, healToFull) {
    const eff = calculateEffectiveStats(d);
    const nextShield = healToFull ? eff.maxQiShield : eff.qiShield;
    const normalizedDaoHeart =
      typeof d.daoHeart === 'number' && !isNaN(d.daoHeart)
        ? Math.max(-100, Math.min(100, Math.round(d.daoHeart)))
        : 0;
    const copy = Object.assign({}, d, {
      daoHeart: normalizedDaoHeart,
      isDemonAwakened: Boolean(d.isDemonAwakened),
      qiShield: nextShield,
      maxQiShield: eff.maxQiShield,
      stats: Object.assign({}, d.stats, {
        hp: healToFull ? eff.maxHp : eff.hp,
        qiShield: nextShield,
        maxQiShield: eff.maxQiShield,
      }),
    });
    return copy;
  }

  function generateDisciple(isHeavensGrace) {
    const gender = Math.random() < 0.5 ? 'YIN' : 'YANG';
    const surname = pickRandom(SURNAMES);
    const givenName = gender === 'YANG' ? pickRandom(MALE_NAMES) : pickRandom(FEMALE_NAMES);

    const spiritRoot = isHeavensGrace ? SPIRIT_ROOTS[1] : pickRandom(SPIRIT_ROOTS);
    const constitution = isHeavensGrace ? CONSTITUTIONS[0] : pickRandom(CONSTITUTIONS);

    const temperaments = [
      'NORMAL',
      'RIGHTEOUS',
      'STOIC',
      'COWARDLY',
      'GREEDY',
      'RECKLESS',
      'PROUD',
      'CUNNING',
    ];
    const temperament = isHeavensGrace ? 'RIGHTEOUS' : pickRandom(temperaments);

    const baseMaxHp =
      randomInt(85, 110) +
      (spiritRoot.statBias.maxHp || 0) +
      (constitution.statBias.maxHp || 0);
    const basePAtk =
      randomInt(12, 17) +
      (spiritRoot.statBias.pAtk || 0) +
      (constitution.statBias.pAtk || 0);
    const baseMAtk =
      randomInt(11, 16) +
      (spiritRoot.statBias.mAtk || 0) +
      (constitution.statBias.mAtk || 0);
    const basePDef =
      randomInt(8, 13) +
      (spiritRoot.statBias.pDef || 0) +
      (constitution.statBias.pDef || 0);
    const baseMDef =
      randomInt(8, 13) +
      (spiritRoot.statBias.mDef || 0) +
      (constitution.statBias.mDef || 0);
    const baseSpd =
      randomInt(10, 15) +
      (spiritRoot.statBias.spd || 0) +
      (constitution.statBias.spd || 0);
    const baseCrit = randomInt(5, 9) + (spiritRoot.statBias.crit || 0);
    const baseEva = randomInt(4, 8) + (spiritRoot.statBias.eva || 0);

    const capBonus = constitution.pillCapBonus;
    const pillGrid = {
      pAtk: { consumed: 0, max: randomInt(3, 5) + capBonus },
      mAtk: { consumed: 0, max: randomInt(3, 5) + capBonus },
      pDef: { consumed: 0, max: randomInt(3, 5) + capBonus },
      mDef: { consumed: 0, max: randomInt(3, 5) + capBonus },
      spd: { consumed: 0, max: randomInt(2, 4) + capBonus },
      maxHp: { consumed: 0, max: randomInt(3, 6) + capBonus },
    };

    const baseShield = 0;

    const draft = {
      id: 'disc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      name: surname + ' ' + givenName,
      gender: gender,
      archetype: 'NOVICE',
      temperament: temperament,
      spiritRoot: spiritRoot,
      constitution: constitution,
      qiShield: baseShield,
      maxQiShield: baseShield,
      stats: {
        hp: baseMaxHp,
        maxHp: baseMaxHp,
        qiShield: baseShield,
        maxQiShield: baseShield,
        pAtk: basePAtk,
        mAtk: baseMAtk,
        pDef: basePDef,
        mDef: baseMDef,
        spd: baseSpd,
        crit: baseCrit,
        eva: baseEva,
      },
      pillGrid: pillGrid,
      realmTier: 1,
      subLevel: 1,
      exp: 0,
      maxExp: 60,
      status: 'IDLE',
      lineupSlot: null,
      injuries: 0,
      daoHeart: 0,
      isDemonAwakened: false,
      secondWindUsedInBattle: false,
      hadHardFightInBattle: false,
      personalStones: isHeavensGrace ? 4 : randomInt(3, 7),
      equippedWeapon: null,
      equippedArmor: null,
      kills: 0,
      expeditionsCompleted: 0,
    };

    return syncDiscipleHp(draft, true);
  }

  function computeCombatDamage(atk, def, critChancePercent, targetEvaPercent) {
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
      isCrit: isCrit,
      isEvaded: false,
    };
  }

  function selectLineupTarget(orderedAliveSquad) {
    if (orderedAliveSquad.length === 1) {
      return orderedAliveSquad[0];
    }
    if (Math.random() < 0.80) {
      return orderedAliveSquad[0];
    }
    return pickRandom(orderedAliveSquad.slice(1));
  }

  function spawnKarstRiftEnemies(depthStage, waveInStage) {
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
        title: 'Ярус ' + depthStage + ' · Хищник Разлома',
        damageType: 'PHYSICAL',
        baseHp: 56,
        baseAtk: 15,
        basePDef: 10,
        baseMDef: 7,
        baseSpd: 13,
        exp: 14,
        loot: {
          spiritStones: [2, 4],
          bogIron: [0, 1],
          bloodMoss: [0, 1],
          spiderCarapace: [1, 2],
        },
      },
      {
        name: 'Рудный Ползун Болот',
        title: 'Ярус ' + depthStage + ' · Дух Породы',
        damageType: 'PHYSICAL',
        baseHp: 72,
        baseAtk: 14,
        basePDef: 18,
        baseMDef: 9,
        baseSpd: 9,
        exp: 15,
        loot: {
          spiritStones: [2, 4],
          bogIron: [1, 2],
          bloodMoss: [0, 1],
          spiderCarapace: [0, 1],
        },
      },
      {
        name: 'Кровавый Мицелий-Демон',
        title: 'Ярус ' + depthStage + ' · Порождение Инь',
        damageType: 'MAGICAL',
        baseHp: 60,
        baseAtk: 16,
        basePDef: 8,
        baseMDef: 15,
        baseSpd: 12,
        exp: 16,
        loot: {
          spiritStones: [2, 5],
          bogIron: [0, 1],
          bloodMoss: [1, 2],
          spiderCarapace: [0, 1],
        },
      },
    ];

    const enemies = [];
    for (let i = 0; i < count; i++) {
      const tpl =
        waveInStage === 3 && i === 0
          ? {
              name: depthStage >= 2 ? 'Вожак Карстовой Бездны' : 'Страж Паучьего Гнезда',
              title: 'Хозяин Яруса ' + depthStage,
              damageType: depthStage % 2 === 0 ? 'MAGICAL' : 'PHYSICAL',
              baseHp: 94,
              baseAtk: 19,
              basePDef: 16,
              baseMDef: 16,
              baseSpd: 13,
              exp: 26,
              loot: {
                spiritStones: [5, 8],
                bogIron: [1, 2],
                bloodMoss: [1, 2],
                spiderCarapace: [1, 2],
              },
            }
          : pickRandom(templates);

      const maxHp = Math.round(tpl.baseHp * scale);
      enemies.push({
        id: 'enemy_' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2, 5),
        name: tpl.name,
        title: tpl.title,
        isBoss: Boolean(waveInStage === 3 && i === 0),
        damageType: tpl.damageType,
        stats: {
          hp: maxHp,
          maxHp: maxHp,
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

  function calculateExpGain(rawExp, disciple, sectLevel, isCombatExp) {
    let mult = disciple.spiritRoot.expMultiplier * SECT_LEVELS[sectLevel].qiDensityBonus;
    const daoState = getDaoHeartState(disciple);
    if (daoState.healAndQiBonus > 0 && isCombatExp) {
      mult *= 1 + daoState.healAndQiBonus;
    }
    if (daoState.combatExpBonus > 0 && isCombatExp) {
      mult *= 1 + daoState.combatExpBonus;
    }

    const isSoftCapped =
      disciple.realmTier > sectLevel ||
      (disciple.realmTier === 1 && disciple.subLevel === 5 && sectLevel === 1);

    if (isSoftCapped) {
      mult *= 0.5;
    }

    return {
      finalExp: Math.max(1, Math.round(rawExp * mult)),
      isSoftCapped: isSoftCapped,
    };
  }

  function getBreakthroughChance(disciple, sectLevel, useBreakthroughPill) {
    if (disciple.subLevel < 5) {
      return { chancePercent: 100, hasEnvPenalty: false };
    }

    const daoState = getDaoHeartState(disciple);
    let chance = 75 + (daoState.breakthroughBonus || 0);
    if (disciple.spiritRoot && disciple.spiritRoot.id === 'HEAVENLY_VOID') chance += 10;
    if (useBreakthroughPill) chance += 25;

    const hasEnvPenalty = sectLevel < 2;
    if (hasEnvPenalty) {
      chance -= 35;
    }

    return {
      chancePercent: Math.max(10, Math.min(100, chance)),
      hasEnvPenalty: hasEnvPenalty,
    };
  }

  function getRealmLabel(tier, subLevel) {
    const i18n = window.SectGame && window.SectGame.i18n;
    if (i18n) {
      const tierName = i18n.t(tier === 1 ? 'realmTier1' : 'realmTier2');
      const suffix = i18n.t(subLevel === 5 ? 'subLevelPeak' : 'subLevelNormal', {
        sub: subLevel,
      });
      return tierName + ' · ' + suffix;
    }
    const tierName = tier === 1 ? 'Закалка Тела (I)' : 'Возведение Основы (II)';
    const suffix = subLevel === 5 ? subLevel + '-я ступень (Пик)' : subLevel + '-я ступень';
    return tierName + ' · ' + suffix;
  }

  function rollTrailDiscovery(depthStage, greedyMultiplier) {
    const mult = (greedyMultiplier || 1) * (1 + (depthStage - 1) * 0.25);
    const roll = Math.random();
    if (roll < 0.35) {
      const amount = Math.max(1, Math.round(randomInt(2, 4) * mult));
      return {
        resourceKey: 'bogIron',
        resourceName: 'болотное железо',
        amount: amount,
        spiritStones: Math.max(1, Math.round(randomInt(1, 2) * mult)),
        flavor: 'Отряд обнаружил обнажённую жилу болотной руды у стены ущелья',
      };
    } else if (roll < 0.7) {
      const amount = Math.max(1, Math.round(randomInt(2, 4) * mult));
      return {
        resourceKey: 'bloodMoss',
        resourceName: 'кровавый мох',
        amount: amount,
        spiritStones: Math.max(1, Math.round(randomInt(1, 2) * mult)),
        flavor: 'На влажных камнях тропы собрана поляна духовного кровавого мха',
      };
    } else {
      const amount = Math.max(1, Math.round(randomInt(1, 3) * mult));
      return {
        resourceKey: 'spiderCarapace',
        resourceName: 'паучий панцирь',
        amount: amount,
        spiritStones: Math.max(2, Math.round(randomInt(2, 4) * mult)),
        flavor: 'В расщелине тропы найдены сброшенные панцири и россыпь духовных камней',
      };
    }
  }

  window.SectGame.math = {
    CHRONICLE_CATEGORY_LABELS: CHRONICLE_CATEGORY_LABELS,
    SPIRIT_ROOTS: SPIRIT_ROOTS,
    DARK_SPIRIT_ROOTS: DARK_SPIRIT_ROOTS,
    CONSTITUTIONS: CONSTITUTIONS,
    TEMPERAMENT_INFO: TEMPERAMENT_INFO,
    ARCHETYPE_INFO: ARCHETYPE_INFO,
    STAT_PILL_LABELS: STAT_PILL_LABELS,
    SECT_LEVELS: SECT_LEVELS,
    CRAFT_STATIONS: CRAFT_STATIONS,
    CRAFT_RECIPES: CRAFT_RECIPES,
    BLACKSMITH_RECIPES: BLACKSMITH_RECIPES,
    MATERIAL_NAMES: MATERIAL_NAMES,
    SUBLEVEL_MAX_EXP: SUBLEVEL_MAX_EXP,
    randomFloat: randomFloat,
    randomInt: randomInt,
    pickRandom: pickRandom,
    getDaoHeartLabel: getDaoHeartLabel,
    getDaoHeartState: getDaoHeartState,
    generateDisciple: generateDisciple,
    calculateEffectiveStats: calculateEffectiveStats,
    syncDiscipleHp: syncDiscipleHp,
    computeCombatDamage: computeCombatDamage,
    selectLineupTarget: selectLineupTarget,
    spawnKarstRiftEnemies: spawnKarstRiftEnemies,
    rollTrailDiscovery: rollTrailDiscovery,
    calculateExpGain: calculateExpGain,
    getBreakthroughChance: getBreakthroughChance,
    getRealmLabel: getRealmLabel,
  };
})();
