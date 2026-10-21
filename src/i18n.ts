/**
 * СИСТЕМА ЛОКАЛИЗАЦИИ (i18n) БЕЗ ТЯЖЕЛЫХ СТОРОННИХ БИБЛИОТЕК: ОБИТЕЛЬ БЕССМЕРТНЫХ (RU / EN)
 * Хранит словари текстовых строк интерфейса, вкладок, кнопок и статусов Сердца Дао.
 * Сохраняет выбранный язык в localStorage.
 */

export type LanguageCode = 'ru' | 'en';

export const LANG_STORAGE_KEY = 'idle_sect_lang';
const ALT_LANG_KEYS = ['sect_lang', 'language', 'lang'];

export function getInitialLanguage(): LanguageCode {
  if (typeof window === 'undefined' || !window.localStorage) return 'ru';
  try {
    const saved =
      window.localStorage.getItem(LANG_STORAGE_KEY) ||
      window.localStorage.getItem('sect_lang') ||
      window.localStorage.getItem('language');
    if (saved === 'en' || saved === 'ru') {
      return saved;
    }
  } catch {
    // ignore storage errors
  }
  return 'ru';
}

let currentLanguage: LanguageCode = getInitialLanguage();

export const DICTIONARIES: Record<LanguageCode, Record<string, string>> = {
  ru: {
    // Шапка и бренд
    brandTitle: 'Обитель Бессмертных',
    stonesShort: 'Камни:',
    stonesTooltipTitle: 'Духовные камни Секты',
    stonesTooltip:
      'Основная валюта Обители для возвышения павильонов, алхимии и ковки.',
    inventoryBtn: 'Инвентарь',
    inventoryTooltipTitle: 'Складской Инвентарь',
    inventoryTooltip:
      'Открыть хранилище ресурсов, эликсиров, пилюль потенциала и снаряжения Секты.',
    soundOnBtn: 'Звук вкл.',
    soundOffBtn: 'Звук выкл.',
    soundTooltipTitle: 'Звуковое сопровождение',
    soundTooltip: 'Включить или отключить звуковые эффекты обители',
    settingsBtn: 'Настройки',
    settingsTooltipTitle: 'Настройки Обители',
    settingsTooltip:
      'Открыть настройки языка интерфейса (RU / EN), звука и управления сохранением',
    resetBtn: 'Сброс',
    resetTooltipTitle: 'Сброс прогресса',
    resetTooltip: 'Начать летопись секты с чистого листа',
    exportBtn: 'Слепок',
    exportHtmlBtn: 'HTML',

    // Модальное окно Настроек
    settingsTitle: 'Настройки Обители',
    settingsSubtitle: 'Конфигурация языка интерфейса, звука и управления летописью',
    settingsLangLabel: 'Язык интерфейса (Language)',
    settingsLangDesc:
      'Выберите язык отображения всех текстов, вкладок и статусов Сердца Дао',
    langRu: 'Русский (RU)',
    langEn: 'English (EN)',
    settingsSoundLabel: 'Звуковые эффекты',
    settingsSoundDesc:
      'Синтезатор звуков ударов, колокола прорыва и звона духовных камней',
    settingsDataLabel: 'Управление сохранением',
    settingsExportBtn: 'Скачать HTML-слепок',
    settingsResetBtn: 'Сбросить прогресс',
    closeBtn: 'Закрыть',
    cancelBtn: 'Отмена',

    // Нижняя навигация (4 главных раздела)
    navAriaLabel: 'Нижняя навигация',
    tabAbode: 'Обитель ({count})',
    tabAbodeShort: 'Обитель',
    tabExpedition: 'Разлом',
    tabExpeditionActive: 'Разлом (Ярус {stage})',
    tabCrafts: 'Ремёсла',
    tabChronicle: 'Летопись',

    // Подразделы (Sub-tabs)
    subSanctuary: 'Обитель и Чайная',
    subRoster: 'Состав ({count})',
    subRosterBreakthrough: ' · Прорыв!',
    subStats: 'Характеристики',
    subPillsGear: 'Пилюли и Доспехи',
    subInventory: 'Инвентарь',
    subArena: 'Поле Боя (Ярус {stage})',
    subLineup: 'Строй и Лечение',
    subLog: 'Журнал Похода',
    subElixirs: 'Алхимик: Эликсиры',
    subPotential: 'Алхимик: Потенциал (6 видов)',
    subForge: 'Кузня и Арсенал ({count})',
    subEvents: 'Летопись Событий ({count})',
    subMemorial: 'Зал Предков ({count})',
    statusCombatBtn: 'Бой: Ярус {stage} · В.{wave}/3',
    claimBufferBtn: 'Забрать буфер (+{count})',

    // Баннеры иллюстраций
    bannerAbodeLv1Title: 'Обитель I ступени: Забытая Нора',
    bannerAbodeLv1Sub: 'Отдых +4 здоровья/тик · Потолок I царства',
    bannerAbodeLv2Title: 'Обитель II ступени: Твердыня Глубин',
    bannerAbodeLv2Sub: 'Отдых +10 здоровья/тик · Опыт +35%',
    bannerRiftTitle: 'Карстовый Разлом · Ярус глубины {stage}',
    bannerRiftSub: 'Авангард принимает 80% атак',

    // Сердце Дао (Шкала, 7 статусов, описания и подсказки)
    daoHeartLabel: 'Сердце Дао:',
    daoHeartTitle: 'Сердце Дао',
    daoScaleAbyss: 'Бездна Демона',
    daoScaleBalance: 'Равновесие',
    daoScaleLight: 'Свет Небес',
    dao_DIAMOND_HEART: 'Алмазное Сердце Дао',
    dao_FEARLESS_BEFORE_HEAVENS: 'Бесстрашие перед Небесами',
    dao_UNWAVERING_SPIRIT: 'Непоколебимый дух',
    dao_MORTAL_CONFUSION: 'Смятение смертного',
    dao_SHADOW_OF_DOUBT: 'Тень Сомнения',
    dao_DEMONIC_OBSESSION: 'Одержимость (Дьявольский путь)',
    dao_TRUE_HEART_DEMON: 'Истинный Демон Сердца',
    daoSub_DIAMOND_HEART:
      'Высшая ясность духа: «Второе дыхание» в бою, защита от одержимости и благословение при Прорыве',
    daoSub_FEARLESS_BEFORE_HEAVENS:
      'Просветлённый взор: усилено усвоение целебных пилюль, ускорен набор боевой Ци и укреплён Прорыв',
    daoSub_UNWAVERING_SPIRIT:
      'Твёрдость воли: подавление страха в бою и повышенная устойчивость при Прорыве',
    daoSub_MORTAL_CONFUSION: 'Равновесие мирских страстей и стремления к Дао',
    daoSub_SHADOW_OF_DOUBT:
      'Ярость в ударах в обмен на тревогу духа при возвышении царства',
    daoSub_DEMONIC_OBSESSION:
      'Кровавая жажда: свирепый урон и вампиризм, но риск поглощения жизненной силы соратников в бою',
    daoSub_TRUE_HEART_DEMON:
      'Бездна Дьявольского пути: сокрушительная мощь, вампиризм и хищное поглощение Ци',
    daoTooltipHeader: 'Текущая ступень духа: «{label}».',
    daoTooltipBody:
      'Ступени Весов Сердца Дао:\n' +
      '• Алмазное Сердце — ускоряет постижение Ци, укрепляет защиту и оберегает от искажения при прорыве.\n' +
      '• Чистый Разум — гармоничное равновесие духа без штрафов.\n' +
      '• Смятение — внутренние сомнения ослабляют защиту и мешают прорыву.\n' +
      '• Одержимость — яростный напор в атаке ценой снижения защиты.\n' +
      '• Истинный Демон — пробуждение Дьявольского пути: сокрушительная мощь в ущерб защите.\n\n' +
      'Победы, прорывы и отдых ведут к Свету Небес; гибель соратников и ранения на грани смерти ведут к Бездне Демона.',

    // Обитель и Чайный Павильон
    abodeUpgradeTitle: 'Возвышение Обители',
    abodeTierBadge: 'Ступень {level}/2',
    abodeDescLv1:
      '«Забытая Нора»: разреженная Ци режет опыт на пике I царства (-50%) и снижает шанс возвышения во II царство (-35%).',
    abodeDescLv2:
      '«Твердыня Глубин»: источник Инь-Ци открыт! Сняты штрафы среды, опыт +35%, лечение 10 ед./тик.',
    abodeUpgradeCostText: 'Цена: 80 камн. · 18 жел. · 18 мха · 12 панц.',
    abodeUpgradeBtn: 'Возвысить до «Твердыни Глубин»',
    abodeMaxLevelReached: 'Обитель достигла максимальной II ступени Альфы.',
    teaPavilionTitle: 'Чайный Павильон',
    freeRecruitsBadge: 'Бесплатно: {count}',
    stoneCostBadge: '{cost} камней',
    teaPavilionDesc:
      'Приём послушников со случайным Корнем, Конституцией, Характером и сеткой пилюль.',
    recruitFirstFreeBtn: 'Принять первого послушника (Бесплатно)',
    recruitPaidBtn: 'Принять послушника ({cost} камней)',
    heavensGraceTimerBtn: 'Нисхождение Дара Небес: {sec} сек...',
    heavensGraceActiveBtn: 'Воззвать к Милости Небес (призвать адепта)',
    heavensGraceReserveBtn: 'Милость Небес (резерв при потере всех адептов)',
    toRosterBtn: 'К списку ({count})',
    lineupStripLabel: 'Строй:',
    slotEmpty: 'Пусто',
    toRiftBtn: 'В Разлом',
    startMarchShortBtn: 'В поход',

    // Состав Секты (Roster)
    rosterTitle: 'Адепты Секты ({count})',
    rosterSubtitle:
      'Нажмите на ученика для выбора или откройте его Характеристики / Пилюли.',
    recruitShortFreeBtn: '+ Нанять (Бесплатно)',
    recruitShortPaidBtn: '+ Нанять ({cost} камн.)',
    emptyRosterText:
      'В секте пока нет учеников. Примите первого послушника в Чайном павильоне.',
    gotoTeaPavilionBtn: 'Перейти в Чайный павильон',
    statusInExpedition: 'В бою',
    statusResting: 'Отдых',
    posPrefix: 'Поз. {pos}',
    reserveLabel: 'Резерв',
    genderYang: 'Ян',
    genderYin: 'Инь',
    genderYangFull: 'Начало Ян',
    genderYinFull: 'Начало Инь',
    combatPathPrefix: 'Боевой Путь: ',
    temperamentPrefix: 'Характер: ',
    stageShort: 'Ступень {sub}/5',
    realm_BODY_TEMPERING: 'Закалка Тела · {sub}-я ступень',
    realm_FOUNDATION: 'Возведение Основы · {sub}-я ступень',
    hpLabel: 'Здоровье',
    expLabel: 'Опыт Ци',
    purseAndInjuriesSummary: 'Мошна: {stones} · Травмы: {injuries}/5',
    breakthroughBtn: 'Прорыв!',
    breakthroughFullBtn: 'Совершить Прорыв!',
    inspectBtn: 'Осмотр →',

    // Характеристики и Пилюли
    adeptSelectorLabel: 'Адепт:',
    noDisciplePrompt:
      'Сначала примите ученика в подразделе «Обитель и Чайная».',
    positionLabel: 'Позиция:',
    spiritRootShort: 'Корень:',
    constitutionShort: 'Конституция:',
    temperamentShort: 'Характер:',
    statPAtk: 'Физ. атака',
    statMAtk: 'Маг. атака',
    statPDef: 'Физ. защита',
    statMDef: 'Маг. защита',
    statSpd: 'Скорость',
    statCrit: 'Шанс крита',
    statEva: 'Уклонение',
    healingPillBtn: 'Пилюля Исцеления ({count})',
    injuryDecoctionBtn: 'Отвар Очищения ({count}) · Травмы: {injuries}/5',
    pillPotentialForName: 'Потенциал пилюль: {name}',
    consumedOverMaxLabel: 'Усвоено / Предел',
    inStockCount: 'На складе: {count} шт.',
    personalPurseLabel: 'Личная мошна: {stones} камней',
    brewAtAlchemistBtn: 'Сварить у Алхимика →',
    discipleGearTitle: 'Снаряжение ученика',
    inStockItemsCount: 'На складе: {count} предм.',
    weaponSlotLabel: 'Оружие',
    armorSlotLabel: 'Доспех',
    notEquipped: 'Не надето',
    equipBtn: 'Надеть',
    openBlacksmithBtn: 'Открыть Кузню Чёрного Железа →',

    // Инвентарь
    invResourcesTitle: 'Ресурсы и Материалы Разлома',
    invGatherInRiftBtn: 'Добыть в Разломе →',
    resSpiritStones: 'Духовные камни',
    resSpiritStonesSub: 'Валюта Секты',
    resSpiritStonesTip:
      'Кристаллизованная духовная энергия Ци. Основная валюта для возвышения Обители, ковки снаряжения и варки пилюль.',
    resBogIron: 'Болотное железо',
    resBogIronSub: 'Руда для ковки',
    resBogIronTip:
      'Тяжёлая руда из Карстового Разлома, пропитанная подземной Инь-Ци. Основа для ковки клинков и лат в Кузне.',
    resBloodMoss: 'Кровавый мох',
    resBloodMossSub: 'Трава алхимии',
    resBloodMossTip:
      'Алый пещерный мох, впитавший духовную кровь чудовищ. Главный алхимический реагент для целебных пилюль и эликсиров.',
    resSpiderCarapace: 'Панцирь паука',
    resSpiderCarapaceSub: 'Трофей Разлома',
    resSpiderCarapaceTip:
      'Прочный хитиновый щиток пещерного ткача. Используется в защитных отварах, пилюлях прорыва и укреплённых доспехах.',
    invElixirsTitle: 'Целебные снадобья и Эликсиры',
    invAlchemyPavilionBtn: 'Павильон Алхимии →',
    itemHealingPill: 'Пилюля Исцеления Ци',
    itemHealingPillShort: 'Пилюля Исцеления',
    itemHealingPillSub: '+60% макс. Здоровья',
    itemHealingPillDesc:
      'Мгновенно восстанавливает 60% от максимального здоровья ученика.',
    itemInjuryDecoction: 'Отвар Очищения Меридианов',
    itemInjuryDecoctionShort: 'Отвар Очищения',
    itemInjuryDecoctionSub: 'Снимает 2 травмы',
    itemInjuryDecoctionDesc:
      'Снимает до 2 стаков стихийных травм и разблокирует естественный отдых при 5/5 травмах.',
    itemBreakthroughPill: 'Пилюля Прорыва Основы',
    itemBreakthroughPillShort: 'Пилюля Прорыва',
    itemBreakthroughPillSub: '+25% к шансу прорыва',
    itemBreakthroughPillDesc:
      'Повышает вероятность успешного возвышения во II царство на +25%.',
    invPotentialPillsTitle: 'Пилюли Потенциала (На складе)',
    invGiveToDiscipleBtn: 'Передать ученику →',
    invArsenalTitle: 'Склад Арсенала ({count} предм.)',
    invBlacksmithForgeBtn: 'Кузня Чёрного Железа →',
    invArsenalEmptyText:
      'На складе нет свободного оружия или доспехов. Выкуйте снаряжение в Кузне или снимите с учеников.',
    pcsUnit: '{count} шт.',

    // Поход (Expedition)
    stageWaveStatus: 'Ярус {stage}/5 · Волна {wave}/3 · ',
    statusWaiting: 'В ожидании',
    statusCombatRound: 'Раунд {round}',
    stageSelectorLabel: 'Ярус:',
    lineupPanelTitle: 'Походный строй (Поз. 1 — 80% ударов)',
    changeLineupBtn: 'Изменить строй',
    vanguardLabel: 'Авангард',
    rearLabel: 'Тыл',
    enemiesPanelTitle: 'Противники в Карстовом Разломе',
    safeInAbodePlaceholder:
      'Отряд в безопасности Обители. Нажмите «Начать поход в Разлом» ниже.',
    lootBufferLabel: 'Буфер (90/10):',
    lootBufferSummary:
      'Камни {stones} · Жел. {iron} · Мох {moss} · Панц. {carapace}',
    claimBtn: 'Собрать',
    startExpeditionBtn: 'Начать поход в Разлом',
    pauseBtn: 'Пауза',
    resumeBtn: 'Продолжить',
    retreatBtn: 'Отступить в Обитель',
    lineupMedicineTitle: 'Построение Отряда и Медицина',
    lineupMedicineSub:
      'Назначьте позиции 1–4 (Позиция 1 принимает 80% ударов) и исцелите раненых.',
    medicineStockSummary: 'Пилюли: {pills} · Отвары: {decoctions}',
    healShortBtn: '+Здоровье',
    cureInjuryShortBtn: '-Травма',
    expeditionLogTitle: 'Журнал Боевого Похода',
    expeditionLogSub: 'Новые раунды сверху',

    // Ремёсла и Летопись
    alchemyCauldronHeader:
      'Алхимический Котёл · Целебные и Прорывные Эликсиры',
    brewBtn: 'Сварить',
    giveToAdeptBtn: 'Дать адепту',
    brewBreakthroughPillBtn: 'Сварить Пилюлю Прорыва',
    potentialPills6Header: 'Пилюли Потенциала (6 видов навсегда)',
    potentialPillsCostSub:
      'Стоимость варки каждой пилюли: 12 камней · 2 железа · 2 мха · 1 панцирь.',
    consumeBtn: 'Принять',
    blacksmithForgeHeader: 'Кузня Чёрного Железа',
    forgeBtn: 'Выковать',
    warehouseArsenalHeader: 'Арсенал Склада ({count})',
    chronicleEventsTitle: 'Летопись Событий Секты',
    filterAllBtn: 'Все ({count})',
    cat_SECT: 'Обитель',
    cat_RECRUIT: 'Чайный павильон',
    cat_COMBAT: 'Поход',
    cat_ECONOMY: 'Казна и обмен',
    cat_CRAFT: 'Павильон ремёсел',
    cat_BREAKTHROUGH: 'Прорыв царства',
    cat_DEATH: 'Павшие',
    cat_DAO_HEART: 'Сердце Дао',
    memorialTitle: 'Зал Предков · Павшие в Карстовом Разломе ({count})',
    memorialEmptyText: 'Ни один ученик ещё не пал в бою.',
    recoveredByComrades: 'Спасено соратниками: ',

    // Модальное окно Прорыва
    breakModalHeader:
      'Пик Закалки Тела (5-я ступень) → Возведение Основы (II царство)',
    breakModalTitle: 'Выбор Боевого Пути: {name}',
    breakEnvPenalty:
      'Ограничение среды: Обитель находится на I ступени («Забытая Нора»), шанс снижен на -35%.',
    breakUsePillLabel:
      'Использовать Пилюлю Прорыва Основы (+25% к шансу, запас: {count})',
    finalBreakChanceLabel: 'Итоговый шанс возвышения:',
    startBreakthroughBtn: 'Начать Прорыв',
  },

  en: {
    // Header & Brand
    brandTitle: 'Abode of Immortals',
    stonesShort: 'Stones:',
    stonesTooltipTitle: 'Sect Spirit Stones',
    stonesTooltip:
      'Primary currency of the Abode for ascending pavilions, alchemy, and forging.',
    inventoryBtn: 'Inventory',
    inventoryTooltipTitle: 'Sect Warehouse Inventory',
    inventoryTooltip:
      'Open the sect storehouse of resources, elixirs, potential pills, and forged equipment.',
    soundOnBtn: 'Sound On',
    soundOffBtn: 'Sound Off',
    soundTooltipTitle: 'Sound Effects',
    soundTooltip: 'Toggle sect sound effects on or off',
    settingsBtn: 'Settings',
    settingsTooltipTitle: 'Sect Settings',
    settingsTooltip:
      'Open interface language settings (RU / EN), audio controls, and save management',
    resetBtn: 'Reset',
    resetTooltipTitle: 'Reset Progress',
    resetTooltip: 'Start the sect chronicle anew from a clean slate',
    exportBtn: 'Snapshot',
    exportHtmlBtn: 'HTML',

    // Settings Modal
    settingsTitle: 'Sect Settings',
    settingsSubtitle:
      'Interface language configuration, sound effects, and save management',
    settingsLangLabel: 'Interface Language (Язык)',
    settingsLangDesc:
      'Select the display language for all tabs, buttons, and Dao Heart statuses',
    langRu: 'Русский (RU)',
    langEn: 'English (EN)',
    settingsSoundLabel: 'Sound Effects',
    settingsSoundDesc:
      'Synthesized audio for combat strikes, breakthrough chimes, and spirit stones',
    settingsDataLabel: 'Save Data Management',
    settingsExportBtn: 'Export HTML Snapshot',
    settingsResetBtn: 'Reset All Progress',
    closeBtn: 'Close',
    cancelBtn: 'Cancel',

    // Bottom Navigation (4 Main Tabs)
    navAriaLabel: 'Main Navigation',
    tabAbode: 'Abode ({count})',
    tabAbodeShort: 'Abode',
    tabExpedition: 'Rift',
    tabExpeditionActive: 'Rift (Tier {stage})',
    tabCrafts: 'Crafts',
    tabChronicle: 'Chronicle',

    // Sub-tabs
    subSanctuary: 'Sanctuary & Tea House',
    subRoster: 'Roster ({count})',
    subRosterBreakthrough: ' · Breakthrough!',
    subStats: 'Attributes',
    subPillsGear: 'Pills & Gear',
    subInventory: 'Inventory',
    subArena: 'Battlefield (Tier {stage})',
    subLineup: 'Lineup & Healing',
    subLog: 'Expedition Log',
    subElixirs: 'Alchemist: Elixirs',
    subPotential: 'Alchemist: Potential (6 Types)',
    subForge: 'Forge & Arsenal ({count})',
    subEvents: 'Sect Chronicle ({count})',
    subMemorial: 'Hall of Ancestors ({count})',
    statusCombatBtn: 'Combat: Tier {stage} · W.{wave}/3',
    claimBufferBtn: 'Claim Loot (+{count})',

    // Banner captions
    bannerAbodeLv1Title: 'Tier I Abode: Forgotten Burrow',
    bannerAbodeLv1Sub: 'Rest +4 HP/tick · Realm I Cap',
    bannerAbodeLv2Title: 'Tier II Abode: Bastion of the Depths',
    bannerAbodeLv2Sub: 'Rest +10 HP/tick · EXP +35%',
    bannerRiftTitle: 'Karst Rift · Depth Tier {stage}',
    bannerRiftSub: 'Vanguard absorbs 80% of enemy strikes',

    // Dao Heart (Scale, 7 statuses, subtitles, tooltips)
    daoHeartLabel: 'Dao Heart:',
    daoHeartTitle: 'Dao Heart',
    daoScaleAbyss: 'Demon Abyss',
    daoScaleBalance: 'Equilibrium',
    daoScaleLight: 'Light of Heavens',
    dao_DIAMOND_HEART: 'Diamond Dao Heart',
    dao_FEARLESS_BEFORE_HEAVENS: 'Fearless Before Heavens',
    dao_UNWAVERING_SPIRIT: 'Unwavering Spirit',
    dao_MORTAL_CONFUSION: 'Mortal Confusion',
    dao_SHADOW_OF_DOUBT: 'Shadow of Doubt',
    dao_DEMONIC_OBSESSION: 'Obsession (Demonic Path)',
    dao_TRUE_HEART_DEMON: 'True Heart Demon',
    daoSub_DIAMOND_HEART:
      'Supreme clarity: "Second Wind" in battle, immunity to possession, and +15% Breakthrough blessing',
    daoSub_FEARLESS_BEFORE_HEAVENS:
      'Enlightened gaze: enhanced healing pill absorption, faster combat Qi gain, and +10% Breakthrough',
    daoSub_UNWAVERING_SPIRIT:
      'Firm willpower: suppresses fear in combat and grants +5% stability during Breakthrough',
    daoSub_MORTAL_CONFUSION:
      'Equilibrium between mortal passions and pursuit of the Dao',
    daoSub_SHADOW_OF_DOUBT:
      'Fierce strikes (+10% damage) in exchange for spiritual unrest during realm ascension (-5%)',
    daoSub_DEMONIC_OBSESSION:
      'Bloodthirst: +20% damage and lifesteal, but risks draining allies in combat (-10% Breakthrough)',
    daoSub_TRUE_HEART_DEMON:
      'Abyss of the Demonic Path: +35% devastating power, lifesteal, and predatory Qi absorption (-15% Breakthrough)',
    daoTooltipHeader: 'Current state of spirit: "{label}".',
    daoTooltipBody:
      'Scales of the Dao Heart:\n' +
      '• Diamond Heart — accelerates Qi comprehension, bolsters defense, and guards against deviation.\n' +
      '• Unwavering Spirit — harmonious spiritual balance with breakthrough stability.\n' +
      '• Mortal Confusion — balanced mortal state without penalties.\n' +
      '• Obsession — ferocious offensive surge at the cost of spiritual stability.\n' +
      '• True Heart Demon — awakening of the Demonic Path: overwhelming power at the cost of inner peace.\n\n' +
      'Victories, breakthroughs, and rest lead toward the Light of Heavens; fallen comrades and near-death wounds pull toward the Demon Abyss.',

    // Sanctuary & Tea Pavilion
    abodeUpgradeTitle: 'Abode Ascension',
    abodeTierBadge: 'Tier {level}/2',
    abodeDescLv1:
      '"Forgotten Burrow": sparse Qi halves EXP at the peak of Realm I (-50%) and lowers Realm II breakthrough chance (-35%).',
    abodeDescLv2:
      '"Bastion of the Depths": Yin-Qi spring unlocked! Environmental penalties removed, EXP +35%, passive healing 10 HP/tick.',
    abodeUpgradeCostText: 'Cost: 80 Stones · 18 Iron · 18 Moss · 12 Carapace',
    abodeUpgradeBtn: 'Ascend to "Bastion of the Depths"',
    abodeMaxLevelReached:
      'The Abode has reached the maximum Tier II of the Alpha.',
    teaPavilionTitle: 'Tea Pavilion',
    freeRecruitsBadge: 'Free: {count}',
    stoneCostBadge: '{cost} Stones',
    teaPavilionDesc:
      'Recruit novices with randomized Spirit Root, Constitution, Temperament, and Pill Potential grid.',
    recruitFirstFreeBtn: 'Recruit First Novice (Free)',
    recruitPaidBtn: 'Recruit Novice ({cost} Stones)',
    heavensGraceTimerBtn: 'Grace of Heavens descending: {sec}s...',
    heavensGraceActiveBtn: 'Invoke Grace of Heavens (Summon Novice)',
    heavensGraceReserveBtn: 'Grace of Heavens (Backup when out of disciples)',
    toRosterBtn: 'To Roster ({count})',
    lineupStripLabel: 'Lineup:',
    slotEmpty: 'Empty',
    toRiftBtn: 'To Rift',
    startMarchShortBtn: 'Deploy',

    // Roster
    rosterTitle: 'Sect Disciples ({count})',
    rosterSubtitle:
      'Click a disciple card to select or open their Attributes / Pills.',
    recruitShortFreeBtn: '+ Recruit (Free)',
    recruitShortPaidBtn: '+ Recruit ({cost} Stones)',
    emptyRosterText:
      'No disciples in the sect yet. Recruit your first novice in the Tea Pavilion.',
    gotoTeaPavilionBtn: 'Go to Tea Pavilion',
    statusInExpedition: 'In Combat',
    statusResting: 'Resting',
    posPrefix: 'Pos. {pos}',
    reserveLabel: 'Reserve',
    genderYang: 'Yang',
    genderYin: 'Yin',
    genderYangFull: 'Yang Principle',
    genderYinFull: 'Yin Principle',
    combatPathPrefix: 'Combat Path: ',
    temperamentPrefix: 'Temperament: ',
    stageShort: 'Stage {sub}/5',
    realm_BODY_TEMPERING: 'Body Tempering · Stage {sub}',
    realm_FOUNDATION: 'Foundation · Stage {sub}',
    hpLabel: 'Health',
    expLabel: 'Qi EXP',
    purseAndInjuriesSummary: 'Purse: {stones} · Injuries: {injuries}/5',
    breakthroughBtn: 'Breakthrough!',
    breakthroughFullBtn: 'Attempt Breakthrough!',
    inspectBtn: 'Inspect →',

    // Attributes & Pills
    adeptSelectorLabel: 'Disciple:',
    noDisciplePrompt:
      'First recruit a disciple in the "Sanctuary & Tea House" tab.',
    positionLabel: 'Position:',
    spiritRootShort: 'Root:',
    constitutionShort: 'Constitution:',
    temperamentShort: 'Temperament:',
    statPAtk: 'Phys. ATK',
    statMAtk: 'Mag. ATK',
    statPDef: 'Phys. DEF',
    statMDef: 'Mag. DEF',
    statSpd: 'Speed',
    statCrit: 'Crit Rate',
    statEva: 'Evasion',
    healingPillBtn: 'Healing Pill ({count})',
    injuryDecoctionBtn:
      'Cleansing Decoction ({count}) · Injuries: {injuries}/5',
    pillPotentialForName: 'Pill Potential: {name}',
    consumedOverMaxLabel: 'Absorbed / Cap',
    inStockCount: 'In stock: {count} pcs',
    personalPurseLabel: 'Personal purse: {stones} stones',
    brewAtAlchemistBtn: 'Brew at Alchemist →',
    discipleGearTitle: 'Disciple Equipment',
    inStockItemsCount: 'In stock: {count} items',
    weaponSlotLabel: 'Weapon',
    armorSlotLabel: 'Armor',
    notEquipped: 'None equipped',
    equipBtn: 'Equip',
    openBlacksmithBtn: 'Open Black Iron Forge →',

    // Inventory
    invResourcesTitle: 'Rift Resources & Materials',
    invGatherInRiftBtn: 'Gather in Rift →',
    resSpiritStones: 'Spirit Stones',
    resSpiritStonesSub: 'Sect Currency',
    resSpiritStonesTip:
      'Crystallized Qi energy. Primary currency for upgrading the Abode, forging gear, and brewing pills.',
    resBogIron: 'Bog Iron',
    resBogIronSub: 'Forging Ore',
    resBogIronTip:
      'Heavy ore from the Karst Rift steeped in subterranean Yin-Qi. Used to forge blades and armor.',
    resBloodMoss: 'Blood Moss',
    resBloodMossSub: 'Alchemy Herb',
    resBloodMossTip:
      'Crimson cave moss infused with beast blood. Key reagent for healing pills and elixirs.',
    resSpiderCarapace: 'Spider Carapace',
    resSpiderCarapaceSub: 'Rift Trophy',
    resSpiderCarapaceTip:
      'Durable chitin plate of a cave weaver. Used in protective decoctions, breakthrough pills, and heavy armor.',
    invElixirsTitle: 'Healing Elixirs & Decoctions',
    invAlchemyPavilionBtn: 'Alchemy Pavilion →',
    itemHealingPill: 'Qi Healing Pill',
    itemHealingPillShort: 'Healing Pill',
    itemHealingPillSub: '+60% Max Health',
    itemHealingPillDesc:
      'Instantly restores 60% of a wounded disciple’s maximum health.',
    itemInjuryDecoction: 'Meridian Cleansing Decoction',
    itemInjuryDecoctionShort: 'Cleansing Decoction',
    itemInjuryDecoctionSub: 'Cures 2 Injuries',
    itemInjuryDecoctionDesc:
      'Removes up to 2 stacks of internal meridian injuries and unlocks natural rest at 5/5 injuries.',
    itemBreakthroughPill: 'Foundation Breakthrough Pill',
    itemBreakthroughPillShort: 'Breakthrough Pill',
    itemBreakthroughPillSub: '+25% Breakthrough Chance',
    itemBreakthroughPillDesc:
      'Increases the probability of ascending to Realm II by +25%.',
    invPotentialPillsTitle: 'Potential Pills (In Stock)',
    invGiveToDiscipleBtn: 'Give to Disciple →',
    invArsenalTitle: 'Arsenal Warehouse ({count} items)',
    invBlacksmithForgeBtn: 'Black Iron Forge →',
    invArsenalEmptyText:
      'No spare weapons or armor in the warehouse. Forge equipment or unequip from disciples.',
    pcsUnit: '{count} pcs',

    // Expedition
    stageWaveStatus: 'Tier {stage}/5 · Wave {wave}/3 · ',
    statusWaiting: 'Standby',
    statusCombatRound: 'Round {round}',
    stageSelectorLabel: 'Tier:',
    lineupPanelTitle: 'Squad Lineup (Pos. 1 takes 80% hits)',
    changeLineupBtn: 'Edit Lineup',
    vanguardLabel: 'Vanguard',
    rearLabel: 'Rearguard',
    enemiesPanelTitle: 'Enemies in the Karst Rift',
    safeInAbodePlaceholder:
      'Squad is safe in the Abode. Click "Start Rift Expedition" below.',
    lootBufferLabel: 'Loot Buffer (90/10):',
    lootBufferSummary:
      'Stones {stones} · Iron {iron} · Moss {moss} · Carapace {carapace}',
    claimBtn: 'Claim',
    startExpeditionBtn: 'Start Rift Expedition',
    pauseBtn: 'Pause',
    resumeBtn: 'Resume',
    retreatBtn: 'Retreat to Abode',
    lineupMedicineTitle: 'Squad Lineup & Field Medicine',
    lineupMedicineSub:
      'Assign Positions 1–4 (Position 1 absorbs 80% of enemy strikes) and heal wounded fighters.',
    medicineStockSummary: 'Pills: {pills} · Decoctions: {decoctions}',
    healShortBtn: '+Heal',
    cureInjuryShortBtn: '-Injury',
    expeditionLogTitle: 'Expedition Combat Log',
    expeditionLogSub: 'Latest rounds on top',

    // Crafts & Chronicle
    alchemyCauldronHeader: 'Alchemy Cauldron · Healing & Breakthrough Elixirs',
    brewBtn: 'Brew',
    giveToAdeptBtn: 'Give to Disciple',
    brewBreakthroughPillBtn: 'Brew Breakthrough Pill',
    potentialPills6Header: 'Potential Pills (6 Permanent Types)',
    potentialPillsCostSub:
      'Brewing cost per pill: 12 Stones · 2 Iron · 2 Moss · 1 Carapace.',
    consumeBtn: 'Consume',
    blacksmithForgeHeader: 'Black Iron Forge',
    forgeBtn: 'Forge',
    warehouseArsenalHeader: 'Warehouse Arsenal ({count})',
    chronicleEventsTitle: 'Chronicle of Sect Events',
    filterAllBtn: 'All ({count})',
    cat_SECT: 'Abode',
    cat_RECRUIT: 'Tea Pavilion',
    cat_COMBAT: 'Expedition',
    cat_ECONOMY: 'Treasury & Trade',
    cat_CRAFT: 'Crafts',
    cat_BREAKTHROUGH: 'Breakthrough',
    cat_DEATH: 'Fallen',
    cat_DAO_HEART: 'Dao Heart',
    memorialTitle: 'Hall of Ancestors · Fallen in the Karst Rift ({count})',
    memorialEmptyText: 'No disciple has fallen in battle yet.',
    recoveredByComrades: 'Recovered by comrades: ',

    // Breakthrough Modal
    breakModalHeader:
      'Peak of Body Tempering (Stage 5) → Foundation Establishment (Realm II)',
    breakModalTitle: 'Choose Combat Path: {name}',
    breakEnvPenalty:
      'Environmental Penalty: Abode is at Tier I ("Forgotten Burrow"), breakthrough chance reduced by -35%.',
    breakUsePillLabel:
      'Use Foundation Breakthrough Pill (+25% chance, stock: {count})',
    finalBreakChanceLabel: 'Final Ascension Chance:',
    startBreakthroughBtn: 'Begin Breakthrough',
  },
};

export function getLang(): LanguageCode {
  return currentLanguage;
}

export function setLang(nextLang: LanguageCode): LanguageCode {
  const normalized: LanguageCode = nextLang === 'en' ? 'en' : 'ru';
  currentLanguage = normalized;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, normalized);
      ALT_LANG_KEYS.forEach((k) => window.localStorage.setItem(k, normalized));
    } catch {
      // ignore storage errors
    }
  }
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = normalized;
  }
  return currentLanguage;
}

export function t(
  key: string,
  params?: Record<string, string | number> | null,
  langOverride?: LanguageCode
): string {
  const lang = langOverride || currentLanguage || 'ru';
  const dict = DICTIONARIES[lang] || DICTIONARIES.ru;
  const template =
    dict[key] !== undefined
      ? dict[key]
      : DICTIONARIES.ru[key] !== undefined
      ? DICTIONARIES.ru[key]
      : key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, token) => {
    const val = params[token];
    return val !== undefined && val !== null ? String(val) : '';
  });
}

export function getDaoHeartKeyByValue(
  daoHeart: number | boolean | { daoHeart?: number }
): string {
  if (typeof daoHeart === 'boolean') {
    return daoHeart ? 'DIAMOND_HEART' : 'MORTAL_CONFUSION';
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
  if (val >= 80) return 'DIAMOND_HEART';
  if (val >= 50) return 'FEARLESS_BEFORE_HEAVENS';
  if (val >= 20) return 'UNWAVERING_SPIRIT';
  if (val >= -19) return 'MORTAL_CONFUSION';
  if (val >= -49) return 'SHADOW_OF_DOUBT';
  if (val >= -79) return 'DEMONIC_OBSESSION';
  return 'TRUE_HEART_DEMON';
}

export function getLocalizedDaoHeartLabel(
  daoHeart: number | boolean | { daoHeart?: number },
  langOverride?: LanguageCode
): string {
  const key = getDaoHeartKeyByValue(daoHeart);
  return t(`dao_${key}`, null, langOverride);
}

export function getLocalizedDaoHeartSubtitle(
  daoHeart: number | boolean | { daoHeart?: number },
  langOverride?: LanguageCode
): string {
  const key = getDaoHeartKeyByValue(daoHeart);
  return t(`daoSub_${key}`, null, langOverride);
}

export const getDaoHeartLabel = getLocalizedDaoHeartLabel;
export const getDaoHeartSubtitle = getLocalizedDaoHeartSubtitle;
export const getLanguage = getLang;
export const setLanguage = setLang;


