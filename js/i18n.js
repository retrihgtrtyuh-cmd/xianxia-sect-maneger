/**
 * СИСТЕМА ЛОКАЛИЗАЦИИ (i18n) БЕЗ СТОРОННИХ БИБЛИОТЕК: ОБИТЕЛЬ БЕССМЕРТНЫХ (RU / EN)
 * Хранит словарь текстовых строк интерфейса, вкладок, кнопок, статусов Сердца Дао и игровых терминов.
 * Сохраняет выбранный язык в localStorage.
 */
(function () {
  window.SectGame = window.SectGame || {};

  var LANG_STORAGE_KEY = 'idle_sect_lang';
  var ALT_LANG_KEYS = ['sect_lang', 'language', 'lang'];

  function loadInitialLanguage() {
    if (typeof window === 'undefined' || !window.localStorage) return 'ru';
    try {
      var saved =
        window.localStorage.getItem(LANG_STORAGE_KEY) ||
        window.localStorage.getItem('sect_lang') ||
        window.localStorage.getItem('language');
      if (saved === 'en' || saved === 'ru') {
        return saved;
      }
      var rawSave = window.localStorage.getItem('idle_sect_manager_alpha_v1');
      if (rawSave) {
        var parsed = JSON.parse(rawSave);
        if (parsed && (parsed.lang === 'en' || parsed.lang === 'ru')) {
          return parsed.lang;
        }
      }
    } catch (e) {
      // ignore storage errors
    }
    return 'ru';
  }

  var currentLang = loadInitialLanguage();

  var DICTIONARIES = {
    ru: {
      // Шапка и бренд
      brandTitle: 'Обитель Бессмертных',
      stonesShort: 'Камни:',
      resSpiritStonesLabel: 'Камни:',
      stonesTooltipTitle: 'Духовные камни Секты',
      resSpiritStonesTitle: 'Духовные камни',
      stonesTooltip: 'Основная духовная валюта секты. Используется для найма послушников, возвышения Обители и запуска ремёсел.',
      resSpiritStonesTooltip: 'Основная духовная валюта секты. Используется для найма послушников в Чайном павильоне, возвышения Обители и запуска ремёсел.',
      inventoryBtn: 'Инвентарь',
      headerInventoryBtn: 'Инвентарь',
      inventoryTooltipTitle: 'Складской Инвентарь',
      headerInventoryTooltipTitle: 'Складской Инвентарь',
      inventoryTooltip: 'Открыть хранилище ресурсов, эликсиров, пилюль потенциала и снаряжения Секты.',
      headerInventoryTooltipBody: 'Открыть вкладку «Инвентарь» с полным обзором ресурсов, эликсиров, пилюль потенциала и арсенала.',
      autoSavePrefix: 'Автосохр.:',
      autoSaveBtn: 'Автосохр.: {time}',
      autoSaveTooltipTitle: 'Сохранение',
      saveTooltipTitle: 'Сохранение',
      autoSaveTooltip: 'Автосохранение активно (нажмите для мгновенного сохранения прогресса)',
      saveTooltipBody: 'Автосохранение активно (нажмите для мгновенного сохранения прогресса)',
      soundOnBtn: 'Звук вкл.',
      soundOffBtn: 'Звук выкл.',
      soundTooltipTitle: 'Звуковое сопровождение',
      soundTooltip: 'Включить или отключить звуковые эффекты обители',
      soundTooltipBody: 'Включить или отключить звуковые эффекты обители',
      settingsBtn: 'Настройки',
      settingsTooltipTitle: 'Настройки Обители',
      settingsTooltip: 'Открыть настройки языка интерфейса (RU / EN), звука и управления сохранением',
      settingsTooltipBody: 'Открыть настройки языка интерфейса (RU / EN), звука и управления сохранением',
      resetBtn: 'Сброс',
      resetTooltipTitle: 'Сброс прогресса',
      resetTooltip: 'Начать летопись секты с чистого листа',
      resetTooltipBody: 'Начать летопись секты с чистого листа',
      exportBtn: 'Слепок',
      snapshotBtn: 'Слепок HTML',
      exportHtmlBtn: 'HTML',
      exportTooltipTitle: 'Автономный слепок',
      snapshotTooltipTitle: 'Автономный слепок',
      exportTooltip: 'Выгрузить автономный HTML-слепок текущего сохранения в файл',
      snapshotTooltipBody: 'Выгрузить автономный HTML-слепок текущего сохранения в файл',

      // Модальное окно Настроек
      settingsTitle: 'Настройки Обители',
      settingsSubtitle: 'Конфигурация языка интерфейса, звука и управления летописью',
      settingsLangLabel: 'Язык интерфейса (Language)',
      settingsLanguageLabel: 'Язык интерфейса (Language)',
      settingsLangDesc: 'Выберите язык отображения всех текстов, вкладок и статусов Сердца Дао',
      settingsLanguageHint: 'Выберите язык отображения всех текстов, вкладок и статусов Сердца Дао. Выбор автоматически сохраняется в браузере.',
      langRu: 'Русский (RU)',
      langRussian: 'Русский (RU)',
      langEn: 'English (EN)',
      langEnglish: 'English (EN)',
      settingsSoundLabel: 'Звуковое сопровождение',
      settingsSoundDesc: 'Синтезатор звуков ударов, колокола прорыва и звона духовных камней',
      settingsDataLabel: 'Управление сохранением',
      settingsSaveAndSnapshotLabel: 'Управление сохранением',
      settingsSaveNow: 'Сохранить сейчас',
      settingsExportBtn: 'Скачать HTML-слепок',
      settingsResetBtn: 'Сбросить прогресс',
      closeBtn: 'Закрыть',
      closeModalBtn: 'Закрыть',
      settingsCloseBtn: 'Готово',
      cancelBtn: 'Отмена',

      // Нижняя навигация (4 главных раздела)
      navAriaLabel: 'Нижняя навигация',
      bottomNavAria: 'Нижняя навигация',
      tabAbode: 'Обитель ({count})',
      tabAbodeShort: 'Обитель',
      tabExpedition: 'Разлом',
      tabRift: 'Разлом',
      tabExpeditionActive: 'Разлом (Ярус {stage})',
      tabRiftActive: 'Разлом (Ярус {stage})',
      tabCrafts: 'Сто Ремёсел',
      tabChronicle: 'Летопись',

      // Подразделы (Sub-tabs)
      subSanctuary: 'Обитель и Чайная',
      subTabSanctuary: 'Обитель и Чайная',
      subRoster: 'Состав ({count})',
      subTabRoster: 'Состав ({count})',
      subRosterBreakthrough: ' · Прорыв!',
      subTabBreakthroughReady: ' · Прорыв!',
      subStats: 'Характеристики',
      subPillsGear: 'Пилюли и Доспехи',
      subInventory: 'Инвентарь',
      subTabInventory: 'Инвентарь',
      subArena: 'Поле Боя (Ярус {stage})',
      subTabArena: 'Поле Боя (Ярус {stage})',
      subLineup: 'Строй и Медицина',
      subTabLineup: 'Строй и Медицина',
      subLog: 'Журнал Похода',
      subTabExpLog: 'Журнал Похода',
      subElixirs: 'Алхимик: Эликсиры',
      subPotential: 'Алхимик: Потенциал (6 видов)',
      subForge: 'Кузня и Арсенал ({count})',
      subEvents: 'Летопись Событий ({count})',
      subTabEvents: 'Летопись Событий ({count})',
      subMemorial: 'Зал Предков ({count})',
      subTabMemorial: 'Зал Предков ({count})',
      noMasterSuffix: ' · Без мастера',
      statusCombatBtn: 'Бой: Ярус {stage} · В.{wave}/3',
      battleStatusBtn: 'Бой: Ярус {stage} · В.{wave}/3',
      claimBufferBtn: 'Забрать буфер (+{count})',
      claimLootBufferBtn: 'Забрать буфер (+{total})',

      // Баннеры иллюстраций
      bannerAbodeLv1Title: 'Обитель I ступени: Забытая Нора',
      bannerAbodeLv1Sub: 'Отдых +4 здоровья/тик · Потолок I царства',
      bannerAbodeLv2Title: 'Обитель II ступени: Твердыня Глубин',
      bannerAbodeLv2Sub: 'Отдых +10 здоровья/тик · Опыт +35%',
      bannerRiftTitle: 'Карстовый Разлом · Ярус глубины {stage}',
      bannerRiftSub: 'Авангард принимает 80% атак',

      // Сердце Дао (Шкала, 6 ступеней, описания и подсказки)
      daoHeartLabel: 'Сердце Дао:',
      daoHeartTitle: 'Сердце Дао',
      daoHeartTooltipTitle: 'Сердце Дао: {label}',
      daoScaleAbyss: 'Бездна Демона',
      daoAbyssDemon: 'Бездна Демона',
      daoScaleBalance: 'Равновесие',
      daoBalance: 'Равновесие',
      daoScaleLight: 'Свет Небес',
      daoLightHeavens: 'Свет Небес',
      dao_DIAMOND_HEART: 'Свет Небес (Алмазное Сердце)',
      dao_LIGHT_OF_HEAVENS: 'Свет Небес (Алмазное Сердце)',
      dao_FEARLESS_BEFORE_HEAVENS: 'Бесстрашие перед Небесами',
      dao_UNWAVERING_SPIRIT: 'Непоколебимый дух',
      dao_EQUILIBRIUM: 'Равновесие',
      dao_MORTAL_CONFUSION: 'Равновесие',
      dao_SPIRIT_TURMOIL: 'Смятение духа',
      dao_SHADOW_OF_DOUBT: 'Смятение духа',
      dao_DEMON_ABYSS: 'Бездна Демона',
      dao_DEMONIC_OBSESSION: 'Бездна Демона',
      dao_TRUE_HEART_DEMON: 'Бездна Демона',
      daoSub_DIAMOND_HEART: '+20% к шансу Прорыва, +15% ко всему урону',
      daoSub_LIGHT_OF_HEAVENS: '+20% к шансу Прорыва, +15% ко всему урону',
      daoSub_FEARLESS_BEFORE_HEAVENS: '+12% к шансу Прорыва, +10% к скорости набора Ци',
      daoSub_UNWAVERING_SPIRIT: '+5% к шансу Прорыва, +10% к Защите при ОЗ < 40%, -15% к шансу получить травму',
      daoSub_EQUILIBRIUM: 'Базовое равновесие духа (0% бонусов и штрафов)',
      daoSub_MORTAL_CONFUSION: 'Базовое равновесие духа (0% бонусов и штрафов)',
      daoSub_SPIRIT_TURMOIL: '-10% к уклонению и скорости набора Ци, -10% к шансу Прорыва',
      daoSub_SHADOW_OF_DOUBT: '-10% к уклонению и скорости набора Ци, -10% к шансу Прорыва',
      daoSub_DEMON_ABYSS: '+25% к Атаке, -20% к Защите, -25% к шансу Прорыва',
      daoSub_DEMONIC_OBSESSION: '+25% к Атаке, -20% к Защите, -25% к шансу Прорыва',
      daoSub_TRUE_HEART_DEMON: '+25% к Атаке, -20% к Защите, -25% к шансу Прорыва',
      daoTooltipHeader: 'Текущая ступень духа: «{label}».',
      daoTooltipBody:
        'Ступени Весов Сердца Дао (потолок Царства: Т1 ±15, Т2 ±35, Т3 ±55, Т4 ±75, Т5+ ±100):\n' +
        '• Свет Небес (Алмазное Сердце) — +20% к шансу Прорыва, +15% ко всему урону.\n' +
        '• Бесстрашие перед Небесами — +12% к шансу Прорыва, +10% к набору Ци.\n' +
        '• Непоколебимый дух — +5% к шансу Прорыва, +10% к Защите при ОЗ < 40%, -15% к шансу травмы.\n' +
        '• Равновесие — базовые статы (0% бонусов и штрафов).\n' +
        '• Смятение духа — -10% к уклонению и скорости набора Ци, -10% к шансу Прорыва.\n' +
        '• Бездна Демона — +25% к Атаке, -20% к Защите, -25% к шансу Прорыва.',
      daoTooltipCurrentStage:
        'Текущая ступень духа: «{label}».\n{subtitle}\n\n' +
        'Шесть ступеней Весов Сердца Дао (потолок по Царствам: Т1 ±15, Т2 ±35, Т3 ±55, Т4 ±75, Т5+ ±100):\n' +
        '• Свет Небес (Алмазное Сердце) — +20% к шансу Прорыва, +15% ко всему урону.\n' +
        '• Бесстрашие перед Небесами — +12% к шансу Прорыва, +10% к набору Ци.\n' +
        '• Непоколебимый дух — +5% к шансу Прорыва, +10% к Защите при ОЗ < 40%, -15% к шансу получить травму.\n' +
        '• Равновесие — базовые статы (0% бонусов/штрафов).\n' +
        '• Смятение духа — -10% к уклонению и скорости набора Ци, -10% к шансу Прорыва.\n' +
        '• Бездна Демона — +25% к Атаке, -20% к Защите, -25% к шансу Прорыва.',

      // Бонусы архетипов (для подсказок)
      bonusMaxHp: 'ОЗ',
      bonusPAtk: 'физ. атк',
      bonusMAtk: 'маг. атк',
      bonusPDef: 'физ. защ',
      bonusMDef: 'маг. защ',
      bonusSpd: 'скор.',
      bonusCrit: 'крит',
      bonusEva: 'укл.',
      archNoviceBonusText: 'Бонусы пути: базовые характеристики 1-го царства (открываются при возвышении во 2-е царство).',
      archPathBonusesPrefix: 'Бонусы пути: ',
      archMagicalAttack: 'Магическая атака (бьёт по Маг. защите)',
      archPhysicalAttack: 'Физическая атака (бьёт по Физ. защите)',

      // Раздел 1.1: Обитель и Чайный Павильон
      abodeUpgradeTitle: 'Возвышение Обители',
      abodeTierBadge: 'Ступень {level}/2',
      abodeTierLabel: 'Ступень {level}/2',
      abodeDescLv1: '«Забытая Нора»: разреженная Ци режет опыт на пике I царства (-50%) и снижает шанс возвышения во II царство (-35%).',
      abodeLv1Desc: '«Забытая Нора»: разреженная Ци режет опыт на пике I царства (-50%) и снижает шанс возвышения во II царство (-35%).',
      abodeDescLv2: '«Твердыня Глубин»: источник Инь-Ци открыт! Сняты штрафы среды, опыт +35%, лечение 10 ед./тик.',
      abodeLv2Desc: '«Твердыня Глубин»: источник Инь-Ци открыт! Сняты штрафы среды, опыт +35%, лечение 10 ед./тик.',
      abodeUpgradeCostText: 'Цена: 80 камн. · 18 жел. · 18 мха · 12 панц.',
      abodeUpgradeBtn: 'Возвысить до «Твердыни Глубин»',
      abodeMaxLevelReached: 'Обитель достигла максимальной II ступени Альфы.',
      abodeMaxTierReached: 'Обитель достигла максимальной II ступени Альфы.',
      teaPavilionTitle: 'Чайный Павильон',
      freeRecruitsBadge: 'Бесплатно: {count}',
      freeRecruitsCount: 'Бесплатно: {count}',
      stoneCostBadge: '{cost} камней',
      recruitCostStones: '{cost} камней',
      teaPavilionDesc: 'Приём послушников со случайным Корнем, Конституцией, Характером и сеткой пилюль.',
      recruitFirstFreeBtn: 'Принять первого послушника (Бесплатно)',
      recruitPaidBtn: 'Принять послушника ({cost} камней)',
      heavensGraceTimerBtn: 'Дар Небес: {sec} сек...',
      heavensGraceTimer: 'Дар Небес: {sec} сек...',
      heavensGraceActiveBtn: 'Воззвать к Милости Небес',
      heavensGraceCallBtn: 'Воззвать к Милости Небес',
      heavensGraceReserveBtn: 'Милость Небес (резерв)',
      toRosterBtn: 'К составу ({count})',
      lineupStripLabel: 'Строй:',
      slotEmpty: 'Пусто',
      toRiftBtn: 'В Разлом',
      startMarchShortBtn: 'В поход',

      // Раздел 1.2: Состав Секты (Roster)
      rosterTitle: 'Адепты Секты ({count})',
      rosterSubtitle: 'Нажмите на карточку или кнопку «Осмотр», чтобы открыть параметры, пилюли и доспехи ученика.',
      recruitShortFreeBtn: '+ Нанять (Бесплатно)',
      recruitBtnShortFree: '+ Нанять (Бесплатно)',
      recruitShortPaidBtn: '+ Нанять ({cost} камн.)',
      recruitBtnShortPaid: '+ Нанять ({cost} камн.)',
      emptyRosterText: 'В секте пока нет учеников. Примите первого послушника в Чайном павильоне.',
      emptyRosterMsg: 'В секте пока нет учеников. Примите первого послушника в Чайном павильоне.',
      gotoTeaPavilionBtn: 'Перейти в Чайный павильон',
      statusInExpedition: 'В походе',
      statusInExpeditionFull: 'В боевом походе',
      statusMasterPrefix: 'Мастер: {station}',
      statusPavilionMasterFull: 'Мастер павильона ({station})',
      statusResting: 'Отдых в обители',
      posPrefix: 'Поз. {pos}',
      reserveLabel: 'Резерв',
      genderYang: 'Ян',
      genderYangShort: 'Ян',
      genderYin: 'Инь',
      genderYinShort: 'Инь',
      genderYangFull: 'Начало Ян',
      genderYinFull: 'Начало Инь',
      combatPathPrefix: 'Боевой Путь: ',
      combatPathTooltipTitle: 'Боевой Путь: {name}',
      cultivationStageTitle: 'Ступень культивации',
      cultivationStageTooltipTitle: 'Ступень культивации',
      cultivationStageTip: '. На 5-й ступени при полном опыте Ци открывается прорыв.',
      cultivationStageTooltipBody: '{realm}. На 5-й ступени при полном опыте Ци открывается прорыв.',
      temperamentPrefix: 'Характер: ',
      temperamentTooltipTitle: 'Характер: {name}',
      spiritRootPrefix: 'Духовный корень: ',
      spiritRootTooltipTitle: 'Духовный корень: {name}',
      constitutionPrefix: 'Конституция тела: ',
      constitutionTooltipTitle: 'Конституция тела: {name}',
      hpLabel: 'Здоровье',
      hpTooltipTitle: 'Жизненная сила (Здоровье)',
      hpTooltipBody: 'Текущий запас здоровья адепта. При падении до нуля в бою наступает гибель. Восстанавливается отдыхом в Обители или Пилюлями Исцеления.',
      qiShieldLabel: 'Щит Ци',
      qiShieldTooltipTitle: 'Личный Щит Ци',
      qiShieldTooltipBody: 'Энергетический барьер, принимающий на себя первый удар в каждой схватке и восстанавливающийся между волнами врагов.',
      expLabel: 'Опыт Ци',
      qiExpLabel: 'Опыт Ци',
      expTooltipTitle: 'Постижение Ци (Опыт)',
      qiExpTooltipTitle: 'Постижение Ци (Опыт)',
      expTooltipBody: 'Накопленный духовный опыт. Пополняется в походах и при труде в Павильоне Ремёсел. При достижении максимума адепт готов к Прорыву ступени.',
      qiExpTooltipBody: 'Накопленный духовный опыт. Пополняется в походах и при труде в Павильоне Ремёсел. При достижении максимума адепт готов к Прорыву ступени.',
      purseAndInjuriesSummary: 'Мошна: {stones} · Травмы: {injuries}/5',
      purseInjuriesSummary: 'Мошна: {stones} · Травмы: {injuries}/5',
      purseTooltipTitle: 'Мошна и Внутренние Травмы',
      purseInjuriesTooltipTitle: 'Мошна и Внутренние Травмы',
      purseTooltipBody: 'Мошна: личная доля ученика (10% от добытых в походе Камней Духа).\nТравмы (до 5): каждое тяжёлое увечье снижает боевые характеристики. Лечится Отваром Очищения.',
      purseInjuriesTooltipBody: 'Мошна: личная доля ученика (10% от добытых в походе Камней Духа).\nТравмы (до 5): каждое тяжёлое увечье снижает боевые характеристики. Лечится Отваром Очищения.',
      breakthroughBtn: 'Прорыв!',
      breakthroughFullBtn: 'Совершить Прорыв!',
      performBreakthroughBtn: 'Совершить Прорыв!',
      breakthroughTipTitle: 'Прорыв ступени',
      breakthroughTooltipTitle: 'Прорыв ступени',
      breakthroughTipBody: 'Накоплено достаточно Ци для перехода на следующую ступень культивации!',
      breakthroughTooltipBody: 'Накоплено достаточно Ци для перехода на следующую ступень культивации!',
      inspectBtn: 'Осмотр →',

      // Раздел 1.3 и Модальное окно осмотра ученика
      adeptSelectorLabel: 'Адепт:',
      adeptLabel: 'Адепт:',
      noDisciplePrompt: 'Сначала примите ученика в подразделе «Обитель и Чайная».',
      positionLabel: 'Позиция:',
      statusLabelPrefix: 'Статус:',
      statusLabel: 'Статус:',
      personalPurseTooltipTitle: 'Личная мошна ученика',
      personalPurseTooltipBody: 'Ученики оставляют себе 10% добытых в походах камней (Жадные — 15%) и самостоятельно тратят их в Обители на лечение и закалку оружия, пополняя казну секты.',
      purseStonesShort: 'Мошна: {stones} камн.',
      innateNatureHeader: 'Врождённая природа и Весы Сердца Дао',
      innateNatureAndDaoTitle: 'Врождённая природа и Весы Сердца Дао',
      spiritRootLabel: 'Духовный корень',
      constitutionLabel: 'Конституция тела',
      temperamentLabel: 'Характер',
      combatStatsHeader: 'Общие характеристики ученика (Итоговые / Базовые)',
      overallStatsTitle: 'Общие характеристики ученика (Итоговые / Базовые)',
      hpAndShieldLabel: 'Здоровье / Щит Ци',
      statHpShieldLabel: 'Здоровье / Щит Ци',
      statHpShieldTooltipTitle: 'Здоровье и Личный Щит Ци',
      statHpShieldTooltipBody: 'Здоровье определяет живучесть ученика. В скобках указан Личный Щит Ци, поглощающий урон первым в каждом бою.',
      statPAtk: 'Физ. атака',
      statPAtkTooltipTitle: 'Физическая атака',
      statPAtkTooltipBody: 'Определяет силу ударов клинком и ближнего боя. Снижается физической защитой противника.',
      statPAtkBase: 'Физ. атака (база {base})',
      statMAtk: 'Маг. атака',
      statMAtkTooltipTitle: 'Магическая атака',
      statMAtkTooltipBody: 'Определяет мощь духовного огня, заклинаний и талисманов. Снижается магической защитой противника.',
      statMAtkBase: 'Маг. атака (база {base})',
      statPDef: 'Физ. защита',
      statPDefTooltipTitle: 'Физическая защита',
      statPDefTooltipBody: 'Снижает входящий урон от когтей, клыков и оружия врагов. Ослабляется при внутренних травмах меридианов.',
      statPDefBase: 'Физ. защита (база {base})',
      statMDef: 'Маг. защита',
      statMDefTooltipTitle: 'Магическая защита',
      statMDefTooltipBody: 'Снижает входящий духовный урон и увеличивает ёмкость Личного Щита Ци со 2-го царства.',
      statMDefBase: 'Маг. защита (база {base})',
      statSpd: 'Скорость',
      statSpdTooltipTitle: 'Скорость боя',
      statSpdTooltipBody: 'Определяет очерёдность ходов в каждом раунде схватки.',
      statSpdBase: 'Скорость (база {base})',
      statCrit: 'Шанс крита',
      statCritTooltipTitle: 'Шанс критического удара',
      statCritTooltipBody: 'Вероятность нанести сокрушительный удар с полуторакратным (×1.5) уроном.',
      statCritBase: 'Шанс крита (база {base}%)',
      statEva: 'Уклонение',
      statEvaTooltipTitle: 'Уклонение',
      statEvaTooltipBody: 'Вероятность полностью избежать вражеского удара в бою.',
      statEvaBase: 'Уклонение (база {base}%)',
      baseStatFormat: '{label} (база {base})',
      healingPillBtn: 'Пилюля Исцеления ({count})',
      healingPillBtnCount: 'Пилюля Исцеления ({count})',
      injuryDecoctionBtn: 'Отвар Очищения ({count}) · Травмы: {injuries}/5',
      injuryDecoctionBtnCount: 'Отвар Очищения ({count}) · Травмы: {injuries}/5',
      pillPotentialHeader: 'Потенциал пилюль (6 видов)',
      pillPotentialTitle: 'Потенциал пилюль (6 видов)',
      consumedOverMaxLabel: 'Усвоено / Лимит',
      absorbedLimitLabel: 'Усвоено / Лимит',
      pillSlotTooltipBody: 'Постоянный бонус: {bonus}. Усвоено учеником: {consumed} из {max}.',
      inStockCount: 'Склад: {count} шт.',
      stockCountPcs: 'Склад: {count} шт.',
      clickCellToConsume: 'Нажмите на ячейку для приёма',
      clickCellToTakePill: 'Нажмите на ячейку для приёма',
      toAlchemistBtn: 'К Алхимику →',
      equipmentSlotsHeader: 'Слоты экипировки',
      equipmentSlotsTitle: 'Слоты экипировки',
      freeInWarehouseCount: 'Свободно на складе: {count}',
      weaponSlotLabel: 'Оружие',
      weaponLabel: 'Оружие',
      armorSlotLabel: 'Доспех',
      armorLabel: 'Доспех',
      unequipBtn: 'Снять',
      equipBtn: 'Надеть',
      notEquipped: 'Не надето',
      notEquippedLabel: 'Не надето',
      noWarehouseGearText: 'На складе нет свободного оружия или доспехов.',
      noFreeGearInWarehouse: 'На складе нет свободного оружия или доспехов.',
      gearRecoveredNote: 'При гибели возвращается соратниками',
      returnedOnDeathHint: 'При гибели возвращается соратниками',
      toForgeBtn: 'В Кузню →',

      // Раздел 1.5: Инвентарь (Inventory)
      invResourcesTitle: 'Ресурсы и Материалы Разлома',
      invSpiritualResourcesTitle: 'Духовные ресурсы и Материалы (Склад Секты)',
      invExtractedInRift: 'Добываются в Карстовом Разломе',
      invGatherInRiftBtn: 'Добыть в Разломе →',
      resSpiritStones: 'Духовные камни',
      resSpiritStonesSub: 'Валюта Секты',
      resSpiritStonesTip: 'Кристаллизованная духовная энергия Ци. Основная валюта для возвышения Обители, ковки снаряжения и варки пилюль.',
      resBogIron: 'Болотное железо',
      resBogIronTitle: 'Болотное железо',
      resBogIronSub: 'Руда для ковки',
      resBogIronTip: 'Тяжёлая руда из Карстового Разлома, пропитанная подземной Инь-Ци. Основа для ковки клинков и лат в Кузне.',
      resBogIronTooltip: 'Тяжёлая руда из Карстового Разлома, пропитанная подземной ци. Необходима для ковки оружия, лат и возвышения Обители.',
      resBloodMoss: 'Кровавый мох',
      resBloodMossTitle: 'Кровавый мох',
      resBloodMossSub: 'Трава алхимии',
      resBloodMossTip: 'Алый пещерный мох, впитавший духовную кровь чудовищ. Главный алхимический реагент для целебных пилюль и эликсиров.',
      resBloodMossTooltip: 'Духовная трава, растущая на камнях Разлома. Ключевой ингредиент для варки целебных пилюль, эликсиров потенциала и начертания талисманов.',
      resSpiderCarapace: 'Панцирь паука',
      resSpiderCarapaceTitle: 'Панцирь паука',
      resSpiderCarapaceSub: 'Трофей Разлома',
      resSpiderCarapaceTip: 'Прочный хитиновый щиток пещерного ткача. Используется в защитных отварах, пилюлях прорыва и укреплённых доспехах.',
      resSpiderCarapaceTooltip: 'Прочный хитиновый панцирь пещерных ткачей. Применяется для пошива защитных облачений, отваров очищения меридианов и алтарей.',
      invElixirsTitle: 'Целебные снадобья и Эликсиры',
      invAlchemyPavilionBtn: 'Павильон Алхимии →',
      itemHealingPill: 'Пилюля Исцеления Ци',
      healingPillTooltipTitle: 'Пилюля Исцеления Ци',
      healingPillTooltipBody: 'Целебная пилюля: мгновенно восстанавливает 60% от максимального здоровья раненого ученика.',
      itemHealingPillShort: 'Пилюля Исцеления',
      itemHealingPillSub: '+60% макс. Здоровья',
      invHealPillDesc: 'Восстанавливает 60% макс. здоровья',
      itemHealingPillDesc: 'Мгновенно восстанавливает 60% от максимального здоровья ученика.',
      itemInjuryDecoction: 'Отвар Очищения Меридианов',
      injuryDecoctionTooltipTitle: 'Отвар Очищения Меридианов',
      injuryDecoctionTooltipBody: 'Целебный отвар: снимает 2 стака стихийных травм меридианов и разблокирует естественный отдых при 5/5 травмах.',
      itemInjuryDecoctionShort: 'Отвар Очищения',
      itemInjuryDecoctionSub: 'Снимает 2 травмы',
      invInjuryDecoctionDesc: 'Снимает 2 внутренние травмы меридианов',
      itemInjuryDecoctionDesc: 'Снимает до 2 стаков стихийных травм и разблокирует естественный отдых при 5/5 травмах.',
      itemBreakthroughPill: 'Пилюля Прорыва Основы',
      breakPillTooltipTitle: 'Пилюля Прорыва Основы',
      breakPillTooltipBody: 'Редкий эликсир: повышает шанс успешного прорыва во 2-е царство на +25% и защищает меридианы.',
      itemBreakthroughPillShort: 'Пилюля Прорыва',
      itemBreakthroughPillSub: '+25% к шансу прорыва',
      invBreakPillDesc: '+25% к шансу прорыва во II царство',
      itemBreakthroughPillDesc: 'Повышает вероятность успешного возвышения во II царство на +25%.',
      invPotentialPillsTitle: 'Пилюли Потенциала ({count} шт.)',
      invForAdept: 'Приём для: {name}',
      invSelectAdept: 'Выберите адепта выше',
      invGiveToDiscipleBtn: 'Передать ученику →',
      invGiveBtn: 'Дать',
      invLimitLabel: 'Лимит: {consumed}/{max}',
      takeBtn: 'Принять',
      invArsenalTitle: 'Арсенал Секты ({count} предм.)',
      invBlacksmithForgeBtn: 'Кузня Чёрного Железа →',
      invArsenalEmptyText: 'На складе нет свободного оружия или доспехов. Выкуйте снаряжение в Кузне или снимите с учеников.',
      invEmptyWarehouse: 'На складе пока нет свободного снаряжения. Создайте оружие или броню в разделе «Сто Ремёсел».',
      pcsUnit: 'ед.',
      pcsShort: 'шт.',

      // Раздел 2: Карстовый Разлом (Expedition)
      stageWaveStatus: 'Ярус {stage}/5 · Волна {wave}/3 · ',
      expHeaderStatus: 'Ярус {stage}/5 · Волна {wave}/3 · ',
      statusWaiting: 'В ожидании',
      expStatusStandby: 'В ожидании',
      statusMarching: 'Тропа ({sec} сек. до события)',
      expStatusTrail: 'Тропа ({sec} сек. до события)',
      statusCombatRound: 'Бой · Раунд {round}',
      expStatusCombatRound: 'Бой · Раунд {round}',
      stageSelectorLabel: 'Ярус:',
      expTierLabel: 'Ярус:',
      lineupPanelTitle: 'Походный строй (Поз. 1 — 80% ударов)',
      expLineupHeader: 'Походный строй (Поз. 1 — 80% ударов)',
      changeLineupBtn: 'Строй',
      expLineupBtn: 'Строй',
      expPosLabel: 'Поз. {pos}',
      vanguardLabel: 'Авангард',
      expVanguard: 'Авангард',
      rearLabel: 'Тыл',
      expRear: 'Тыл',
      expShieldShort: 'Щит Ци: {cur}/{max}',
      expHpShort: 'ОЗ: {cur}/{max}',
      expEmptySlot: 'Свободно',
      marchingPanelTitle: 'Продвижение по тропе Разлома',
      expAdvancingTrail: 'Продвижение по тропе Разлома',
      enemiesPanelTitle: 'Противники в Карстовом Разломе',
      expEnemiesInRift: 'Противники в Карстовом Разломе',
      phaseMarching: 'Фаза: В пути',
      expPhaseMarching: 'Фаза: В пути',
      phaseCombat: 'Фаза: Схватка',
      expPhaseCombat: 'Фаза: Схватка',
      marchingQuote: '«Отряд продвигается по тропе...»',
      expSquadAdvancingQuote: '«Отряд продвигается по тропе...»',
      marchingStepDetail: 'Ярус {stage} · До следующего события: {left} тик. (шаг {step}/{total})',
      expNextEventTicks: 'Ярус {stage} · До следующего события: {left} тик. (шаг {step}/{total})',
      marchingEventOdds: 'Шанс события на тропе: 75% бой · 25% находка ресурсов',
      expTrailEventOdds: 'Шанс события на тропе: ',
      expTrailOddsCombat: '75% бой',
      expTrailOddsLoot: '25% находка ресурсов',
      expEnemyMagAtk: 'Маг. {atk} · Защ. {def}',
      expEnemyPhysAtk: 'Физ. {atk} · Защ. {def}',
      safeInAbodePlaceholder: 'Отряд в безопасности Обители. Нажмите «Начать поход в Разлом» ниже.',
      expSquadSafeInAbode: 'Отряд в безопасности Обители. Нажмите «Начать поход в Разлом» ниже.',
      lootBufferTooltipTitle: 'Буфер добычи (90% / 10%)',
      lootBufferTooltipBody: 'Трофеи, собранные отрядом в Разломе. При сборе 90% поступает на Склад Секты, а 10% (до 15% у Жадных) удерживается учениками в личную мошну.',
      lootBufferLabel: 'Буфер (90/10):',
      lootBufferSummary: 'Камни {stones} · Жел. {iron} · Мох {moss} · Панц. {carapace}',
      claimBtn: 'Собрать',
      collectLootBtn: 'Собрать',
      startExpeditionBtn: 'Начать поход в Разлом',
      pauseBtn: 'Пауза',
      resumeBtn: 'Продолжить',
      retreatBtn: 'Отступить в Обитель',
      retreatToAbodeBtn: 'Отступить в Обитель',
      returnTalismanTooltipTitle: 'Талисман Возврата',
      returnTalismanTooltipBody: 'Плановое срабатывание Талисмана Возврата безопасно эвакуирует отряд в Обитель с сохранением всей добычи и НЕ травмирует Сердце Дао, если никто из соратников не пал и здоровье бойца не было пробито ниже критического порога 15% ОЗ.',
      returnTalismanLabel: 'Талисман Возврата (Авто-отступление):',
      returnTalismanDesc: 'эвакуация отряда при падении ОЗ любого бойца',
      returnTalismanTip: 'Плановое срабатывание Талисмана Возврата безопасно эвакуирует отряд в Обитель с сохранением всей добычи и НЕ травмирует Сердце Дао, если никто из соратников не пал и здоровье бойца не было пробито ниже критического порога 15% ОЗ.',
      autoRetreatOff: 'Выкл',
      talismanOff: 'Выкл',
      talismanOffTip: 'Авто-отступление отключено. Отряд сражается до приказа об отступлении.',
      autoRetreat25: '≤ 25% ОЗ',
      talisman25: '≤ 25% ОЗ',
      talisman25Tip: 'Рискованный порог: автоматический возврат отряда при падении ОЗ любого бойца до 25% и ниже.',
      autoRetreat40: '≤ 40% ОЗ (без травм)',
      talisman40: '≤ 40% ОЗ (без травм)',
      talisman40Tip: 'Оптимальный порог: безопасная эвакуация при ≤ 40% ОЗ без риска стихийных травм и без вреда для Сердца Дао.',
      autoRetreat50: '≤ 50% ОЗ',
      talisman50: '≤ 50% ОЗ',
      talisman50Tip: 'Осторожный порог: ранний тактический отход при падении ОЗ любого бойца до 50% и ниже.',
      lineupMedicineTitle: 'Построение Отряда и Медицина',
      lineupTitle: 'Построение Отряда и Медицина',
      lineupMedicineSub: 'Ученики, несущие службу в павильонах ремёсел, не могут входить в походный строй.',
      lineupSubtitle: 'Ученики, несущие службу в павильонах ремёсел, не могут входить в походный строй.',
      lineupMedTooltipTitle: 'Запас полевой медицины',
      lineupMedTooltipBody: 'Пилюли Исцеления восстанавливают 60% ОЗ. Отвары Очищения снимают 2 внутренние травмы меридианов.',
      medicineStockSummary: 'Пилюли: {pills} · Отвары: {decoctions}',
      lineupMedStock: 'Пилюли: {pills} · Отвары: {decoctions}',
      noDisciplesInSect: 'Нет учеников в секте',
      lineupDiscipleStats: 'ОЗ {hp}/{maxHp} · Щит Ци {shield}/{maxShield} · Травмы {injuries}/5 · Защита {pDef}/{mDef}',
      healShortBtn: '+Здоровье',
      plusHpBtn: '+Здоровье',
      cureInjuryShortBtn: '-Травма',
      minusInjuryBtn: '-Травма',
      unassignStationBtn: 'Снять с павильона',
      unassignFromPavilionBtn: 'Снять с павильона',
      posShortBtn: 'Поз.{pos}',
      expeditionLogTitle: 'Журнал Боевого Похода',
      expLogTitle: 'Журнал Боевого Похода',
      expeditionLogSub: 'Автоскролл к последнему событию',
      expLogSubtitle: 'Автоскролл к последнему событию',

      // Раздел 3: Павильон Ремёсел (Crafts)
      assignedMasterStatus: 'Назначенный мастер: {name} (Т{tier} · {sub}/5 · Опыт {exp}/{maxExp}) · Скорость 100%',
      craftsAssignedMasterInfo: 'Назначенный мастер: {name} (Т{tier} · {sub}/5 · Опыт {exp}/{maxExp}) · Скорость 100%',
      noMasterWarning: 'Без мастера: доступен только крафт Т1 со штрафом к скорости -50%',
      craftsNoMasterWarning: 'Без мастера: доступен только крафт Т1 со штрафом к скорости -50%',
      assignMasterLabel: 'Назначить мастера:',
      craftsAssignMasterLabel: 'Назначить мастера:',
      craftsInCombatTag: ' [В бою]',
      craftsInLineupTag: ' [Строй П.{pos}]',
      removeMasterBtn: 'Снять мастера',
      craftsUnassignMasterBtn: 'Снять мастера',
      blueprintsHeader: 'Чертежи и Рецепты: {station}',
      craftsBlueprintsTitle: 'Чертежи и Рецепты: {station}',
      threeThresholdsTooltipTitle: 'Три Порога Мастерства',
      threeThresholdsTooltipBody:
        'Зависимость шанса и бонусов от царства мастера (T_master) и ранга рецепта (T_mat):\n' +
        '• Без мастера: только Т1 со штрафом скорости -50% (шанс 50%).\n' +
        '• I Порог (T_master = T_mat - 1): шанс 25%, при успехе опыт Ци ×3.\n' +
        '• II Порог (T_master = T_mat): шанс 50–60% (растёт со ступенью).\n' +
        '• III Порог (T_master ≥ T_mat + 1): шанс 100% + шанс на «Безупречную работу» (+20% к статам или двойной выход пилюль)!',
      threeThresholdsLabel: 'Три Порога Мастерства (Царство мастера и Ранг рецепта)',
      craftsRankBadge: 'Ранг Т{tier}',
      craftsMasteryTooltipTitle: 'Порог мастерства (Ранг Т{tier})',
      blockedCraftLabel: 'Заблокировано (0%)',
      craftsBlockedZero: 'Заблокировано (0%)',
      craftsChanceTime: 'Шанс {chance}% · {sec} сек',
      craftsExpMult: ' · EXP ×{mult}',
      craftsFlawlessPct: ' · Безупр. {pct}%',
      craftsCostSummary: 'Камни {stones} · Жел. {iron} · Мох {moss} · Панц. {carapace} · Редкий: {rare} · Опыт: +{exp}',
      craftBlockedBtn: 'Недоступно',
      craftsUnavailableBtn: 'Недоступно',
      craftInProgressBtn: 'В работе...',
      craftsInProgressBtn: 'В работе...',
      craftStartBtn: 'Создать',
      craftsCreateBtn: 'Создать',
      brewBtn: 'Сварить',
      forgeBtn: 'Выковать',
      consumeBtn: 'Принять',
      giveToAdeptBtn: 'Дать адепту',
      elixirStockHeader: 'Запасы Эликсиров и Пилюль',
      craftsElixirStockTitle: 'Запасы Эликсиров и Пилюль',
      craftsCauldronTooltipTitle: 'Склад Алхимического Котла',
      craftsCauldronTooltipBody: 'Текущий запас готовых целебных пилюль, отваров очищения меридианов и пилюль прорыва на складе секты.',
      craftsElixirStockSummary: 'Исцел.: {heal} · Отвар: {decoction} · Прорыв: {breakPill}',
      craftsQuickMedFor: 'Быстрый приём медицины для:',
      craftsPillTooltip: 'Эффект пилюли: {bonus}. В запасе на складе: {stock} шт.{consumed}',
      craftsPillConsumedSuffix: ' Учеником усвоено: {consumed} из {max}.',
      absorbedCount: 'Усвоено: {consumed}/{max}',
      warehouseArsenalHeader: 'Арсенал Склада ({count})',
      craftsWarehouseArsenalTitle: 'Арсенал Склада ({count})',
      craftsEquipLabel: 'Экипировка: {name}',
      craftsEmptyWarehouseMsg: 'На складе нет свободного снаряжения. Назначьте мастера и запустите создание предметов слева.',

      // Раздел 4: Летопись и Зал Предков
      chronicleEventsTitle: 'Летопись Событий Секты',
      chrSectEventsTitle: 'Летопись Событий Секты',
      filterAllBtn: 'Все ({count})',
      chrAllFilter: 'Все ({count})',
      cat_SECT: 'Обитель',
      chrCat_SECT: 'Обитель',
      cat_RECRUIT: 'Чайный павильон',
      chrCat_RECRUIT: 'Чайный павильон',
      cat_COMBAT: 'Поход',
      chrCat_COMBAT: 'Поход',
      cat_ECONOMY: 'Казна и обмен',
      chrCat_ECONOMY: 'Казна и обмен',
      cat_CRAFT: 'Павильон ремёсел',
      chrCat_CRAFT: 'Павильон ремёсел',
      cat_BREAKTHROUGH: 'Прорыв царства',
      chrCat_BREAKTHROUGH: 'Прорыв царства',
      cat_DEATH: 'Павшие',
      chrCat_DEATH: 'Павшие',
      cat_DAO_HEART: 'Сердце Дао',
      chrCat_DAO_HEART: 'Сердце Дао',
      memorialTitle: 'Зал Предков · Павшие в Карстовом Разломе ({count})',
      chrMemorialTitle: 'Зал Предков · Павшие в Карстовом Разломе ({count})',
      memorialEmptyText: 'Ни один ученик ещё не пал в бою.',
      chrNoFallenMsg: 'Ни один ученик ещё не пал в бою.',
      recoveredByComrades: 'Спасено соратниками: ',
      chrRecoveredByComrades: 'Спасено соратниками: {items}',

      // Модальное окно Прорыва во 2-е царство
      breakModalHeader: 'Пик Закалки Тела (5-я ступень) → Возведение Основы (II царство)',
      breakModalSubheader: 'Пик Закалки Тела (5-я ступень) → Возведение Основы (II царство)',
      breakModalTitle: 'Выбор Боевого Пути: {name}',
      breakEnvPenalty: 'Ограничение среды: Обитель находится на I ступени («Забытая Нора»), шанс снижен на -35%.',
      breakModalEnvPenalty: 'Ограничение среды: Обитель находится на I ступени («Забытая Нора»), шанс снижен на -35%.',
      breakUsePillLabel: 'Использовать Пилюлю Прорыва Основы (+25% к шансу, запас: {count})',
      yesLabel: 'Да',
      noLabel: 'Нет',
      finalBreakChanceLabel: 'Итоговый шанс возвышения:',
      breakFinalChanceLabel: 'Итоговый шанс возвышения:',
      startBreakthroughBtn: 'Начать Прорыв',

      // Названия Царств, Архетипов, Характеров, Пилюль
      realmTier1: 'Закалка Тела (I)',
      realmTier2: 'Возведение Основы (II)',
      subLevelPeak: '{sub}-я ступень (Пик)',
      subLevelNormal: '{sub}-я ступень',
      arch_NOVICE_name: 'Послушник',
      arch_NOVICE_role: 'Ученик 1-го царства',
      arch_NOVICE_desc: 'Базовый адепт стадии Закалки Тела. Изучает основы циркуляции Ци.',
      arch_SWORDSMAN_name: 'Мечник Внешнего Двора',
      arch_SWORDSMAN_role: 'Мастер клинка · Физ. урон',
      arch_SWORDSMAN_desc: 'Мастер боевого клинка 2-го царства. Сокрушает броню стремительными физическими выпадами.',
      arch_GUARDIAN_name: 'Страж Каменного Щита',
      arch_GUARDIAN_role: 'Авангард · Защита строя',
      arch_GUARDIAN_desc: 'Несокрушимый щит секты. Идеален для 1-й позиции строя, поглощающей 80% вражеских ударов.',
      arch_FLAME_ADEPT_name: 'Адепт Тайного Пламени',
      arch_FLAME_ADEPT_role: 'Заклинатель · Духовный огонь',
      arch_FLAME_ADEPT_desc: 'Повелитель духовного огня. Поражает врагов сквозь физическую броню магическими печатями.',
      temp_NORMAL_name: 'Спокойный',
      temp_NORMAL_summary: 'Уравновешенный нрав. Склонен к просветлению духа, 10% добычи в мошну.',
      temp_RIGHTEOUS_name: 'Праведный',
      temp_RIGHTEOUS_summary: 'Верность братству и путям Света. Мстит за павших соратников и укрепляет Сердце Дао.',
      temp_STOIC_name: 'Стойкий',
      temp_STOIC_summary: 'Несгибаемая воля перед лицом бедствий. Устойчив к отчаянию и укрепляет дух в боях.',
      temp_COWARDLY_name: 'Трусливый',
      temp_COWARDLY_summary: '+6% к уклонению, склонен к панике и бегству при тяжёлых ранениях.',
      temp_GREEDY_name: 'Жадный',
      temp_GREEDY_summary: '+15% к поиску ресурсов в Разломе, удерживает 15% добычи и жаждет наживы.',
      temp_RECKLESS_name: 'Безрассудный',
      temp_RECKLESS_summary: '+18% к атаке и +5% к криту, но -12% к защите и нестабильный дух при ранениях.',
      temp_PROUD_name: 'Горделивый',
      temp_PROUD_summary: 'Высокомерный нрав (+8% к атаке). Тяжело переживает поражения, травмы и срывы прорыва.',
      temp_CUNNING_name: 'Коварный',
      temp_CUNNING_summary: 'Хитрый и расчётливый ум (+4% к криту и уклонению), легко поддаётся тёмным искушениям.',
      station_FORGE_name: 'Кузница',
      station_FORGE_full: 'Кузня Чёрного Железа',
      station_FORGE_prof: 'Кузнец духовной стали',
      station_LOOM_name: 'Ткацкий станок',
      station_LOOM_full: 'Духовный Ткацкий Станок',
      station_LOOM_prof: 'Ткач защитных облачений',
      station_CAULDRON_name: 'Котёл',
      station_CAULDRON_full: 'Алхимический Котёл',
      station_CAULDRON_prof: 'Мастер пилюль и отваров',
      station_ALTAR_name: 'Алтарь',
      station_ALTAR_full: 'Алтарь Духовных Артефактов',
      station_ALTAR_prof: 'Резчик защитных формаций',
      station_TABLE_name: 'Стол',
      station_TABLE_full: 'Стол Начертания Талисманов',
      station_TABLE_prof: 'Мастер боевых печатей',
      pill_pAtk_name: 'Пилюля Костного Мозга',
      pill_pAtk_short: 'Физ. атака',
      pill_pAtk_bonus: '+1 к физ. атаке навсегда',
      pill_mAtk_name: 'Пилюля Астрального Духа',
      pill_mAtk_short: 'Маг. атака',
      pill_mAtk_bonus: '+1 к маг. атаке навсегда',
      pill_pDef_name: 'Пилюля Железной Кожи',
      pill_pDef_short: 'Физ. защита',
      pill_pDef_bonus: '+1 к физ. защите навсегда',
      pill_mDef_name: 'Пилюля Нефритового Сердца',
      pill_mDef_short: 'Маг. защита',
      pill_mDef_bonus: '+1 к маг. защите навсегда',
      pill_spd_name: 'Пилюля Поступи Ветра',
      pill_spd_short: 'Скорость',
      pill_spd_bonus: '+1 к скорости навсегда',
      pill_maxHp_name: 'Пилюля Жизненной Крови',
      pill_maxHp_short: 'Здоровье',
      pill_maxHp_bonus: '+12 к макс. здоровью навсегда',
    },

    en: {
      // Header & Brand
      brandTitle: 'Abode of Immortals',
      stonesShort: 'Stones:',
      resSpiritStonesLabel: 'Stones:',
      stonesTooltipTitle: 'Sect Spirit Stones',
      resSpiritStonesTitle: 'Spirit Stones',
      stonesTooltip: 'Primary spiritual currency of the sect. Used to recruit novices, ascend the Abode, and fuel crafting pavilions.',
      resSpiritStonesTooltip: 'Primary spiritual currency of the sect. Used to recruit novices in the Tea Pavilion, ascend the Abode, and fuel crafting.',
      inventoryBtn: 'Inventory',
      headerInventoryBtn: 'Inventory',
      inventoryTooltipTitle: 'Sect Warehouse Inventory',
      headerInventoryTooltipTitle: 'Sect Warehouse Inventory',
      inventoryTooltip: 'Open the sect storehouse of resources, elixirs, potential pills, and forged equipment.',
      headerInventoryTooltipBody: 'Open the "Inventory" tab with a full overview of resources, elixirs, potential pills, and arsenal gear.',
      autoSavePrefix: 'Saved:',
      autoSaveBtn: 'Saved: {time}',
      autoSaveTooltipTitle: 'Auto-Save',
      saveTooltipTitle: 'Auto-Save',
      autoSaveTooltip: 'Auto-save is active (click to save progress immediately)',
      saveTooltipBody: 'Auto-save is active (click to save progress immediately)',
      soundOnBtn: 'Sound On',
      soundOffBtn: 'Sound Off',
      soundTooltipTitle: 'Sound Effects',
      soundTooltip: 'Toggle sect sound effects on or off',
      soundTooltipBody: 'Toggle sect sound effects on or off',
      settingsBtn: 'Settings',
      settingsTooltipTitle: 'Sect Settings',
      settingsTooltip: 'Open interface language settings (RU / EN), audio controls, and save management',
      settingsTooltipBody: 'Open interface language settings (RU / EN), audio controls, and save management',
      resetBtn: 'Reset',
      resetTooltipTitle: 'Reset Progress',
      resetTooltip: 'Start the sect chronicle anew from a clean slate',
      resetTooltipBody: 'Start the sect chronicle anew from a clean slate',
      exportBtn: 'Snapshot',
      snapshotBtn: 'HTML Snapshot',
      exportHtmlBtn: 'HTML',
      exportTooltipTitle: 'Standalone Snapshot',
      snapshotTooltipTitle: 'Standalone Snapshot',
      exportTooltip: 'Export a self-contained HTML snapshot of your current progress',
      snapshotTooltipBody: 'Export a self-contained HTML snapshot of your current progress',

      // Settings Modal
      settingsTitle: 'Sect Settings',
      settingsSubtitle: 'Interface language configuration, sound effects, and save management',
      settingsLangLabel: 'Interface Language (Язык)',
      settingsLanguageLabel: 'Interface Language (Язык)',
      settingsLangDesc: 'Select the display language for all tabs, buttons, and Dao Heart statuses',
      settingsLanguageHint: 'Select the display language for all interface texts, tabs, and Dao Heart statuses. Saved automatically in browser storage.',
      langRu: 'Русский (RU)',
      langRussian: 'Русский (RU)',
      langEn: 'English (EN)',
      langEnglish: 'English (EN)',
      settingsSoundLabel: 'Sound Effects',
      settingsSoundDesc: 'Synthesized audio for combat strikes, breakthrough chimes, and spirit stones',
      settingsDataLabel: 'Save Data Management',
      settingsSaveAndSnapshotLabel: 'Save Data Management',
      settingsSaveNow: 'Save Progress Now',
      settingsExportBtn: 'Export HTML Snapshot',
      settingsResetBtn: 'Reset All Progress',
      closeBtn: 'Close',
      closeModalBtn: 'Close',
      settingsCloseBtn: 'Done',
      cancelBtn: 'Cancel',

      // Bottom Navigation (4 Main Tabs)
      navAriaLabel: 'Main Navigation',
      bottomNavAria: 'Main Navigation',
      tabAbode: 'Abode ({count})',
      tabAbodeShort: 'Abode',
      tabExpedition: 'Rift',
      tabRift: 'Rift',
      tabExpeditionActive: 'Rift (Tier {stage})',
      tabRiftActive: 'Rift (Tier {stage})',
      tabCrafts: 'Hundred Crafts',
      tabChronicle: 'Chronicle',

      // Sub-tabs
      subSanctuary: 'Sanctuary & Tea House',
      subTabSanctuary: 'Sanctuary & Tea House',
      subRoster: 'Roster ({count})',
      subTabRoster: 'Roster ({count})',
      subRosterBreakthrough: ' · Breakthrough!',
      subTabBreakthroughReady: ' · Breakthrough!',
      subStats: 'Attributes',
      subPillsGear: 'Pills & Gear',
      subInventory: 'Inventory',
      subTabInventory: 'Inventory',
      subArena: 'Battlefield (Tier {stage})',
      subTabArena: 'Battlefield (Tier {stage})',
      subLineup: 'Lineup & Medicine',
      subTabLineup: 'Lineup & Medicine',
      subLog: 'Expedition Log',
      subTabExpLog: 'Expedition Log',
      subElixirs: 'Alchemist: Elixirs',
      subPotential: 'Alchemist: Potential (6 Types)',
      subForge: 'Forge & Arsenal ({count})',
      subEvents: 'Sect Chronicle ({count})',
      subTabEvents: 'Sect Chronicle ({count})',
      subMemorial: 'Hall of Ancestors ({count})',
      subTabMemorial: 'Hall of Ancestors ({count})',
      noMasterSuffix: ' · No Master',
      statusCombatBtn: 'Combat: Tier {stage} · W.{wave}/3',
      battleStatusBtn: 'Combat: Tier {stage} · W.{wave}/3',
      claimBufferBtn: 'Claim Loot (+{count})',
      claimLootBufferBtn: 'Claim Loot (+{total})',

      // Banner captions
      bannerAbodeLv1Title: 'Tier I Abode: Forgotten Burrow',
      bannerAbodeLv1Sub: 'Rest +4 HP/tick · Realm I Cap',
      bannerAbodeLv2Title: 'Tier II Abode: Bastion of the Depths',
      bannerAbodeLv2Sub: 'Rest +10 HP/tick · EXP +35%',
      bannerRiftTitle: 'Karst Rift · Depth Tier {stage}',
      bannerRiftSub: 'Vanguard absorbs 80% of enemy strikes',

      // Dao Heart (Scale, 6 stages, subtitles, tooltips)
      daoHeartLabel: 'Dao Heart:',
      daoHeartTitle: 'Dao Heart',
      daoHeartTooltipTitle: 'Dao Heart: {label}',
      daoScaleAbyss: 'Demon Abyss',
      daoAbyssDemon: 'Demon Abyss',
      daoScaleBalance: 'Equilibrium',
      daoBalance: 'Equilibrium',
      daoScaleLight: 'Light of Heavens',
      daoLightHeavens: 'Light of Heavens',
      dao_DIAMOND_HEART: 'Light of Heavens (Diamond Heart)',
      dao_LIGHT_OF_HEAVENS: 'Light of Heavens (Diamond Heart)',
      dao_FEARLESS_BEFORE_HEAVENS: 'Fearless Before Heavens',
      dao_UNWAVERING_SPIRIT: 'Unwavering Spirit',
      dao_EQUILIBRIUM: 'Equilibrium',
      dao_MORTAL_CONFUSION: 'Equilibrium',
      dao_SPIRIT_TURMOIL: 'Spirit Turmoil',
      dao_SHADOW_OF_DOUBT: 'Spirit Turmoil',
      dao_DEMON_ABYSS: 'Demon Abyss',
      dao_DEMONIC_OBSESSION: 'Demon Abyss',
      dao_TRUE_HEART_DEMON: 'Demon Abyss',
      daoSub_DIAMOND_HEART: '+20% Breakthrough chance, +15% to all damage',
      daoSub_LIGHT_OF_HEAVENS: '+20% Breakthrough chance, +15% to all damage',
      daoSub_FEARLESS_BEFORE_HEAVENS: '+12% Breakthrough chance, +10% Qi gain speed',
      daoSub_UNWAVERING_SPIRIT: '+5% Breakthrough chance, +10% Defense at HP < 40%, -15% injury chance',
      daoSub_EQUILIBRIUM: 'Base spiritual equilibrium (0% bonuses or penalties)',
      daoSub_MORTAL_CONFUSION: 'Base spiritual equilibrium (0% bonuses or penalties)',
      daoSub_SPIRIT_TURMOIL: '-10% Evasion and Qi gain speed, -10% Breakthrough chance',
      daoSub_SHADOW_OF_DOUBT: '-10% Evasion and Qi gain speed, -10% Breakthrough chance',
      daoSub_DEMON_ABYSS: '+25% Attack, -20% Defense, -25% Breakthrough chance',
      daoSub_DEMONIC_OBSESSION: '+25% Attack, -20% Defense, -25% Breakthrough chance',
      daoSub_TRUE_HEART_DEMON: '+25% Attack, -20% Defense, -25% Breakthrough chance',
      daoTooltipHeader: 'Current state of spirit: "{label}".',
      daoTooltipBody:
        'Scales of the Dao Heart (Realm Tier caps: T1 ±15, T2 ±35, T3 ±55, T4 ±75, T5+ ±100):\n' +
        '• Light of Heavens (Diamond Heart) — +20% Breakthrough chance, +15% to all damage.\n' +
        '• Fearless Before Heavens — +12% Breakthrough chance, +10% Qi gain.\n' +
        '• Unwavering Spirit — +5% Breakthrough chance, +10% Defense at HP < 40%, -15% injury chance.\n' +
        '• Equilibrium — base attributes (0% bonuses/penalties).\n' +
        '• Spirit Turmoil — -10% Evasion and Qi gain speed, -10% Breakthrough chance.\n' +
        '• Demon Abyss — +25% Attack, -20% Defense, -25% Breakthrough chance.',
      daoTooltipCurrentStage:
        'Current state of spirit: "{label}".\n{subtitle}\n\n' +
        'Six Thresholds of the Dao Heart Scales (Realm caps: T1 ±15, T2 ±35, T3 ±55, T4 ±75, T5+ ±100):\n' +
        '• Light of Heavens (Diamond Heart) — +20% Breakthrough chance, +15% to all damage.\n' +
        '• Fearless Before Heavens — +12% Breakthrough chance, +10% Qi gain.\n' +
        '• Unwavering Spirit — +5% Breakthrough chance, +10% Defense at HP < 40%, -15% injury chance.\n' +
        '• Equilibrium — base attributes (0% bonuses/penalties).\n' +
        '• Spirit Turmoil — -10% Evasion and Qi gain speed, -10% Breakthrough chance.\n' +
        '• Demon Abyss — +25% Attack, -20% Defense, -25% Breakthrough chance.',

      // Archetype bonus tokens
      bonusMaxHp: 'Max HP',
      bonusPAtk: 'Phys. ATK',
      bonusMAtk: 'Mag. ATK',
      bonusPDef: 'Phys. DEF',
      bonusMDef: 'Mag. DEF',
      bonusSpd: 'SPD',
      bonusCrit: 'CRIT',
      bonusEva: 'EVA',
      archNoviceBonusText: 'Path bonuses: base Realm I attributes (specializations unlock upon ascending to Realm II).',
      archPathBonusesPrefix: 'Path bonuses: ',
      archMagicalAttack: 'Magical Attack (targets Mag. DEF)',
      archPhysicalAttack: 'Physical Attack (targets Phys. DEF)',

      // Section 1.1: Sanctuary & Tea Pavilion
      abodeUpgradeTitle: 'Abode Ascension',
      abodeTierBadge: 'Tier {level}/2',
      abodeTierLabel: 'Tier {level}/2',
      abodeDescLv1: '"Forgotten Burrow": sparse Qi halves EXP at the peak of Realm I (-50%) and lowers Realm II breakthrough chance (-35%).',
      abodeLv1Desc: '"Forgotten Burrow": sparse Qi halves EXP at the peak of Realm I (-50%) and lowers Realm II breakthrough chance (-35%).',
      abodeDescLv2: '"Bastion of the Depths": Yin-Qi spring unlocked! Environmental penalties removed, EXP +35%, passive healing 10 HP/tick.',
      abodeLv2Desc: '"Bastion of the Depths": Yin-Qi spring unlocked! Environmental penalties removed, EXP +35%, passive healing 10 HP/tick.',
      abodeUpgradeCostText: 'Cost: 80 Stones · 18 Iron · 18 Moss · 12 Carapace',
      abodeUpgradeBtn: 'Ascend to "Bastion of the Depths"',
      abodeMaxLevelReached: 'The Abode has reached the maximum Tier II of the Alpha.',
      abodeMaxTierReached: 'The Abode has reached the maximum Tier II of the Alpha.',
      teaPavilionTitle: 'Tea Pavilion',
      freeRecruitsBadge: 'Free: {count}',
      freeRecruitsCount: 'Free: {count}',
      stoneCostBadge: '{cost} Stones',
      recruitCostStones: '{cost} Stones',
      teaPavilionDesc: 'Recruit novices with randomized Spirit Root, Constitution, Temperament, and Pill Potential grid.',
      recruitFirstFreeBtn: 'Recruit First Novice (Free)',
      recruitPaidBtn: 'Recruit Novice ({cost} Stones)',
      heavensGraceTimerBtn: 'Grace of Heavens: {sec}s...',
      heavensGraceTimer: 'Grace of Heavens: {sec}s...',
      heavensGraceActiveBtn: 'Invoke Grace of Heavens',
      heavensGraceCallBtn: 'Invoke Grace of Heavens',
      heavensGraceReserveBtn: 'Grace of Heavens (Backup)',
      toRosterBtn: 'To Roster ({count})',
      lineupStripLabel: 'Lineup:',
      slotEmpty: 'Empty',
      toRiftBtn: 'To Rift',
      startMarchShortBtn: 'Deploy',

      // Section 1.2: Roster
      rosterTitle: 'Sect Disciples ({count})',
      rosterSubtitle: 'Click a disciple card or "Inspect" to view combat attributes, pills, and equipment.',
      recruitShortFreeBtn: '+ Recruit (Free)',
      recruitBtnShortFree: '+ Recruit (Free)',
      recruitShortPaidBtn: '+ Recruit ({cost} Stones)',
      recruitBtnShortPaid: '+ Recruit ({cost} Stones)',
      emptyRosterText: 'No disciples in the sect yet. Recruit your first novice in the Tea Pavilion.',
      emptyRosterMsg: 'No disciples in the sect yet. Recruit your first novice in the Tea Pavilion.',
      gotoTeaPavilionBtn: 'Go to Tea Pavilion',
      statusInExpedition: 'In Expedition',
      statusInExpeditionFull: 'In Combat Expedition',
      statusMasterPrefix: 'Master: {station}',
      statusPavilionMasterFull: 'Pavilion Master ({station})',
      statusResting: 'Resting in Abode',
      posPrefix: 'Pos. {pos}',
      reserveLabel: 'Reserve',
      genderYang: 'Yang',
      genderYangShort: 'Yang',
      genderYin: 'Yin',
      genderYinShort: 'Yin',
      genderYangFull: 'Yang Principle',
      genderYinFull: 'Yin Principle',
      combatPathPrefix: 'Combat Path: ',
      combatPathTooltipTitle: 'Combat Path: {name}',
      cultivationStageTitle: 'Cultivation Stage',
      cultivationStageTooltipTitle: 'Cultivation Stage',
      cultivationStageTip: '. At Stage 5 with full Qi EXP, realm breakthrough becomes available.',
      cultivationStageTooltipBody: '{realm}. At Stage 5 with full Qi EXP, realm breakthrough becomes available.',
      temperamentPrefix: 'Temperament: ',
      temperamentTooltipTitle: 'Temperament: {name}',
      spiritRootPrefix: 'Spirit Root: ',
      spiritRootTooltipTitle: 'Spirit Root: {name}',
      constitutionPrefix: 'Constitution: ',
      constitutionTooltipTitle: 'Constitution: {name}',
      hpLabel: 'Health',
      hpTooltipTitle: 'Vitality (Health)',
      hpTooltipBody: 'Current health of the disciple. Falling to zero in combat results in permanent death. Restored by resting in the Abode or taking Healing Pills.',
      qiShieldLabel: 'Qi Shield',
      qiShieldTooltipTitle: 'Personal Qi Shield',
      qiShieldTooltipBody: 'Spiritual barrier that absorbs incoming damage first in each encounter and regenerates between waves.',
      expLabel: 'Qi EXP',
      qiExpLabel: 'Qi EXP',
      expTooltipTitle: 'Qi Comprehension (EXP)',
      qiExpTooltipTitle: 'Qi Comprehension (EXP)',
      expTooltipBody: 'Accumulated spiritual experience. Gained in expeditions and pavilion crafting. When full, the disciple is ready for a Breakthrough.',
      qiExpTooltipBody: 'Accumulated spiritual experience. Gained in expeditions and pavilion crafting. When full, the disciple is ready for a Breakthrough.',
      purseAndInjuriesSummary: 'Purse: {stones} · Injuries: {injuries}/5',
      purseInjuriesSummary: 'Purse: {stones} · Injuries: {injuries}/5',
      purseTooltipTitle: 'Personal Purse & Internal Injuries',
      purseInjuriesTooltipTitle: 'Personal Purse & Internal Injuries',
      purseTooltipBody: 'Purse: disciple personal cut (10% of Spirit Stones gathered in expeditions).\nInjuries (up to 5): each severe meridian injury reduces defense. Cured with Cleansing Decoctions.',
      purseInjuriesTooltipBody: 'Purse: disciple personal cut (10% of Spirit Stones gathered in expeditions).\nInjuries (up to 5): each severe meridian injury reduces defense. Cured with Cleansing Decoctions.',
      breakthroughBtn: 'Breakthrough!',
      breakthroughFullBtn: 'Attempt Breakthrough!',
      performBreakthroughBtn: 'Attempt Breakthrough!',
      breakthroughTipTitle: 'Stage Breakthrough',
      breakthroughTooltipTitle: 'Stage Breakthrough',
      breakthroughTipBody: 'Enough Qi has been accumulated to ascend to the next cultivation stage!',
      breakthroughTooltipBody: 'Enough Qi has been accumulated to ascend to the next cultivation stage!',
      inspectBtn: 'Inspect →',

      // Section 1.3 & Disciple Modal
      adeptSelectorLabel: 'Disciple:',
      adeptLabel: 'Disciple:',
      noDisciplePrompt: 'First recruit a disciple in the "Sanctuary & Tea House" tab.',
      positionLabel: 'Position:',
      statusLabelPrefix: 'Status:',
      statusLabel: 'Status:',
      personalPurseTooltipTitle: 'Disciple Personal Purse',
      personalPurseTooltipBody: 'Disciples keep 10% of Spirit Stones gathered in expeditions (Greedy keep 15%) and spend them in the Abode on healing and weapon tempering, replenishing the sect treasury.',
      purseStonesShort: 'Purse: {stones} stones',
      innateNatureHeader: 'Innate Nature & Scales of the Dao Heart',
      innateNatureAndDaoTitle: 'Innate Nature & Scales of the Dao Heart',
      spiritRootLabel: 'Spirit Root',
      constitutionLabel: 'Body Constitution',
      temperamentLabel: 'Temperament',
      combatStatsHeader: 'Combat Attributes (Effective / Base)',
      overallStatsTitle: 'Disciple Combat Attributes (Effective / Base)',
      hpAndShieldLabel: 'Health / Qi Shield',
      statHpShieldLabel: 'Health / Qi Shield',
      statHpShieldTooltipTitle: 'Health & Personal Qi Shield',
      statHpShieldTooltipBody: 'Health determines survivability. In parentheses is the Personal Qi Shield, which absorbs incoming damage first in each battle.',
      statPAtk: 'Phys. ATK',
      statPAtkTooltipTitle: 'Physical Attack',
      statPAtkTooltipBody: 'Determines blade and melee strike power. Mitigated by enemy Physical Defense.',
      statPAtkBase: 'Phys. ATK (base {base})',
      statMAtk: 'Mag. ATK',
      statMAtkTooltipTitle: 'Magical Attack',
      statMAtkTooltipBody: 'Determines spiritual fire, spell, and talisman power. Mitigated by enemy Magical Defense.',
      statMAtkBase: 'Mag. ATK (base {base})',
      statPDef: 'Phys. DEF',
      statPDefTooltipTitle: 'Physical Defense',
      statPDefTooltipBody: 'Reduces incoming damage from claws, fangs, and weapons. Weakened by internal meridian injuries.',
      statPDefBase: 'Phys. DEF (base {base})',
      statMDef: 'Mag. DEF',
      statMDefTooltipTitle: 'Magical Defense',
      statMDefTooltipBody: 'Reduces incoming spiritual damage and increases Personal Qi Shield capacity from Realm II onward.',
      statMDefBase: 'Mag. DEF (base {base})',
      statSpd: 'Speed',
      statSpdTooltipTitle: 'Combat Speed',
      statSpdTooltipBody: 'Determines turn order in each combat round.',
      statSpdBase: 'Speed (base {base})',
      statCrit: 'Crit Rate',
      statCritTooltipTitle: 'Critical Hit Rate',
      statCritTooltipBody: 'Probability of landing a devastating strike dealing 1.5× damage.',
      statCritBase: 'Crit Rate (base {base}%)',
      statEva: 'Evasion',
      statEvaTooltipTitle: 'Evasion',
      statEvaTooltipBody: 'Probability of completely dodging an enemy attack in battle.',
      statEvaBase: 'Evasion (base {base}%)',
      baseStatFormat: '{label} (base {base})',
      healingPillBtn: 'Healing Pill ({count})',
      healingPillBtnCount: 'Healing Pill ({count})',
      injuryDecoctionBtn: 'Cleansing Decoction ({count}) · Injuries: {injuries}/5',
      injuryDecoctionBtnCount: 'Cleansing Decoction ({count}) · Injuries: {injuries}/5',
      pillPotentialHeader: 'Pill Potential (6 Types)',
      pillPotentialTitle: 'Pill Potential (6 Types)',
      consumedOverMaxLabel: 'Absorbed / Cap',
      absorbedLimitLabel: 'Absorbed / Cap',
      pillSlotTooltipBody: 'Permanent bonus: {bonus}. Absorbed by disciple: {consumed} of {max}.',
      inStockCount: 'Stock: {count} pcs',
      stockCountPcs: 'Stock: {count} pcs',
      clickCellToConsume: 'Click a slot to consume pill',
      clickCellToTakePill: 'Click a slot to consume pill',
      toAlchemistBtn: 'To Alchemist →',
      equipmentSlotsHeader: 'Equipment Slots',
      equipmentSlotsTitle: 'Equipment Slots',
      freeInWarehouseCount: 'Available in warehouse: {count}',
      weaponSlotLabel: 'Weapon',
      weaponLabel: 'Weapon',
      armorSlotLabel: 'Armor',
      armorLabel: 'Armor',
      unequipBtn: 'Unequip',
      equipBtn: 'Equip',
      notEquipped: 'None equipped',
      notEquippedLabel: 'None equipped',
      noWarehouseGearText: 'No spare weapons or armor in the warehouse.',
      noFreeGearInWarehouse: 'No spare weapons or armor in the warehouse.',
      gearRecoveredNote: 'Recovered by surviving comrades if fallen',
      returnedOnDeathHint: 'Recovered by surviving comrades if fallen',
      toForgeBtn: 'To Forge →',

      // Section 1.5: Inventory
      invResourcesTitle: 'Rift Resources & Materials',
      invSpiritualResourcesTitle: 'Spiritual Resources & Materials (Sect Warehouse)',
      invExtractedInRift: 'Gathered in the Karst Rift',
      invGatherInRiftBtn: 'Gather in Rift →',
      resSpiritStones: 'Spirit Stones',
      resSpiritStonesSub: 'Sect Currency',
      resSpiritStonesTip: 'Crystallized Qi energy. Primary currency for upgrading the Abode, forging gear, and brewing pills.',
      resBogIron: 'Bog Iron',
      resBogIronTitle: 'Bog Iron',
      resBogIronSub: 'Forging Ore',
      resBogIronTip: 'Heavy ore from the Karst Rift steeped in subterranean Yin-Qi. Used to forge blades and armor.',
      resBogIronTooltip: 'Heavy ore from the Karst Rift steeped in subterranean Qi. Essential for forging weapons, armor, and ascending the Abode.',
      resBloodMoss: 'Blood Moss',
      resBloodMossTitle: 'Blood Moss',
      resBloodMossSub: 'Alchemy Herb',
      resBloodMossTip: 'Crimson cave moss infused with beast blood. Key reagent for healing pills and elixirs.',
      resBloodMossTooltip: 'Spiritual herb growing on Rift stones. Key reagent for brewing healing pills, potential elixirs, and inscribing talismans.',
      resSpiderCarapace: 'Spider Carapace',
      resSpiderCarapaceTitle: 'Spider Carapace',
      resSpiderCarapaceSub: 'Rift Trophy',
      resSpiderCarapaceTip: 'Durable chitin plate of a cave weaver. Used in protective decoctions, breakthrough pills, and heavy armor.',
      resSpiderCarapaceTooltip: 'Durable chitin carapace of cave weavers. Used to craft protective vestments, meridian cleansing decoctions, and altars.',
      invElixirsTitle: 'Healing Elixirs & Decoctions',
      invAlchemyPavilionBtn: 'Alchemy Pavilion →',
      itemHealingPill: 'Qi Healing Pill',
      healingPillTooltipTitle: 'Qi Healing Pill',
      healingPillTooltipBody: 'Healing pill: instantly restores 60% of a wounded disciple’s maximum health.',
      itemHealingPillShort: 'Healing Pill',
      itemHealingPillSub: '+60% Max Health',
      invHealPillDesc: 'Restores 60% Max HP',
      itemHealingPillDesc: 'Instantly restores 60% of a wounded disciple’s maximum health.',
      itemInjuryDecoction: 'Meridian Cleansing Decoction',
      injuryDecoctionTooltipTitle: 'Meridian Cleansing Decoction',
      injuryDecoctionTooltipBody: 'Healing decoction: cures 2 stacks of internal meridian injuries and unlocks natural rest at 5/5 injuries.',
      itemInjuryDecoctionShort: 'Cleansing Decoction',
      itemInjuryDecoctionSub: 'Cures 2 Injuries',
      invInjuryDecoctionDesc: 'Cures 2 internal meridian injuries',
      itemInjuryDecoctionDesc: 'Removes up to 2 stacks of internal meridian injuries and unlocks natural rest at 5/5 injuries.',
      itemBreakthroughPill: 'Foundation Breakthrough Pill',
      breakPillTooltipTitle: 'Foundation Breakthrough Pill',
      breakPillTooltipBody: 'Rare elixir: increases the chance of a successful Realm II breakthrough by +25% and protects meridians.',
      itemBreakthroughPillShort: 'Breakthrough Pill',
      itemBreakthroughPillSub: '+25% Breakthrough Chance',
      invBreakPillDesc: '+25% Realm II breakthrough chance',
      itemBreakthroughPillDesc: 'Increases the probability of ascending to Realm II by +25%.',
      invPotentialPillsTitle: 'Potential Pills ({count} pcs)',
      invForAdept: 'Use on: {name}',
      invSelectAdept: 'Select a disciple above',
      invGiveToDiscipleBtn: 'Give to Disciple →',
      invGiveBtn: 'Give',
      invLimitLabel: 'Cap: {consumed}/{max}',
      takeBtn: 'Take',
      invArsenalTitle: 'Sect Arsenal ({count} items)',
      invBlacksmithForgeBtn: 'Black Iron Forge →',
      invArsenalEmptyText: 'No spare weapons or armor in the warehouse. Forge equipment or unequip from disciples.',
      invEmptyWarehouse: 'No spare equipment in the warehouse yet. Craft weapons or armor in the "Hundred Crafts" tab.',
      pcsUnit: 'pcs',
      pcsShort: 'pcs',

      // Section 2: Karst Rift (Expedition)
      stageWaveStatus: 'Tier {stage}/5 · Wave {wave}/3 · ',
      expHeaderStatus: 'Tier {stage}/5 · Wave {wave}/3 · ',
      statusWaiting: 'Standby',
      expStatusStandby: 'Standby',
      statusMarching: 'Trail ({sec}s to event)',
      expStatusTrail: 'Trail ({sec}s to event)',
      statusCombatRound: 'Combat · Round {round}',
      expStatusCombatRound: 'Combat · Round {round}',
      stageSelectorLabel: 'Tier:',
      expTierLabel: 'Tier:',
      lineupPanelTitle: 'Squad Lineup (Pos. 1 takes 80% hits)',
      expLineupHeader: 'Squad Lineup (Pos. 1 takes 80% hits)',
      changeLineupBtn: 'Lineup',
      expLineupBtn: 'Lineup',
      expPosLabel: 'Pos. {pos}',
      vanguardLabel: 'Vanguard',
      expVanguard: 'Vanguard',
      rearLabel: 'Rearguard',
      expRear: 'Rearguard',
      expShieldShort: 'Qi Shield: {cur}/{max}',
      expHpShort: 'HP: {cur}/{max}',
      expEmptySlot: 'Empty',
      marchingPanelTitle: 'Advancing Along the Rift Trail',
      expAdvancingTrail: 'Advancing Along the Rift Trail',
      enemiesPanelTitle: 'Enemies in the Karst Rift',
      expEnemiesInRift: 'Enemies in the Karst Rift',
      phaseMarching: 'Phase: Marching',
      expPhaseMarching: 'Phase: Marching',
      phaseCombat: 'Phase: Skirmish',
      expPhaseCombat: 'Phase: Skirmish',
      marchingQuote: '"The squad advances along the rift trail..."',
      expSquadAdvancingQuote: '"The squad advances along the rift trail..."',
      marchingStepDetail: 'Tier {stage} · Next encounter in: {left} ticks (step {step}/{total})',
      expNextEventTicks: 'Tier {stage} · Next encounter in: {left} ticks (step {step}/{total})',
      marchingEventOdds: 'Trail encounter odds: 75% combat · 25% resource find',
      expTrailEventOdds: 'Trail encounter odds: ',
      expTrailOddsCombat: '75% combat',
      expTrailOddsLoot: '25% resource find',
      expEnemyMagAtk: 'Mag. {atk} · DEF {def}',
      expEnemyPhysAtk: 'Phys. {atk} · DEF {def}',
      safeInAbodePlaceholder: 'Squad is safe in the Abode. Click "Start Rift Expedition" below.',
      expSquadSafeInAbode: 'Squad is safe in the Abode. Click "Start Rift Expedition" below.',
      lootBufferTooltipTitle: 'Loot Buffer (90% / 10%)',
      lootBufferTooltipBody: 'Spoils gathered by the squad in the Rift. When claimed, 90% goes to the Sect Warehouse and 10% (up to 15% for Greedy) is kept by disciples in their personal purse.',
      lootBufferLabel: 'Loot Buffer (90/10):',
      lootBufferSummary: 'Stones {stones} · Iron {iron} · Moss {moss} · Carapace {carapace}',
      claimBtn: 'Claim',
      collectLootBtn: 'Claim',
      startExpeditionBtn: 'Start Rift Expedition',
      pauseBtn: 'Pause',
      resumeBtn: 'Resume',
      retreatBtn: 'Retreat to Abode',
      retreatToAbodeBtn: 'Retreat to Abode',
      returnTalismanTooltipTitle: 'Return Talisman',
      returnTalismanTooltipBody: 'Scheduled Return Talisman activation safely evacuates the squad with all loot and does NOT harm Dao Heart unless a comrade fell or HP dropped below the critical 15% near-death threshold.',
      returnTalismanLabel: 'Return Talisman (Auto-Retreat):',
      returnTalismanDesc: 'evacuate squad when any fighter drops below HP threshold',
      returnTalismanTip: 'Scheduled Return Talisman activation safely evacuates the squad with all loot and does NOT harm Dao Heart unless a comrade fell or HP dropped below the critical 15% near-death threshold.',
      autoRetreatOff: 'Off',
      talismanOff: 'Off',
      talismanOffTip: 'Auto-retreat disabled. The squad fights until manually ordered to retreat.',
      autoRetreat25: '≤ 25% HP',
      talisman25: '≤ 25% HP',
      talisman25Tip: 'Risky threshold: automatically evacuates the squad when any fighter drops to 25% HP or below.',
      autoRetreat40: '≤ 40% HP (safe)',
      talisman40: '≤ 40% HP (safe)',
      talisman40Tip: 'Optimal threshold: safe evacuation at ≤ 40% HP without risk of meridian injuries or Dao Heart damage.',
      autoRetreat50: '≤ 50% HP',
      talisman50: '≤ 50% HP',
      talisman50Tip: 'Cautious threshold: early tactical retreat when any fighter drops to 50% HP or below.',
      lineupMedicineTitle: 'Squad Lineup & Field Medicine',
      lineupTitle: 'Squad Lineup & Field Medicine',
      lineupMedicineSub: 'Disciples assigned to crafting pavilions cannot join the expedition lineup.',
      lineupSubtitle: 'Disciples assigned to crafting pavilions cannot join the expedition lineup.',
      lineupMedTooltipTitle: 'Field Medicine Reserves',
      lineupMedTooltipBody: 'Healing Pills restore 60% Max HP. Cleansing Decoctions cure 2 internal meridian injuries.',
      medicineStockSummary: 'Pills: {pills} · Decoctions: {decoctions}',
      lineupMedStock: 'Pills: {pills} · Decoctions: {decoctions}',
      noDisciplesInSect: 'No disciples in the sect',
      lineupDiscipleStats: 'HP {hp}/{maxHp} · Qi Shield {shield}/{maxShield} · Injuries {injuries}/5 · DEF {pDef}/{mDef}',
      healShortBtn: '+Heal',
      plusHpBtn: '+Heal',
      cureInjuryShortBtn: '-Injury',
      minusInjuryBtn: '-Injury',
      unassignStationBtn: 'Remove from Pavilion',
      unassignFromPavilionBtn: 'Remove from Pavilion',
      posShortBtn: 'Pos.{pos}',
      expeditionLogTitle: 'Expedition Combat Log',
      expLogTitle: 'Expedition Combat Log',
      expeditionLogSub: 'Auto-scrolls to latest round',
      expLogSubtitle: 'Auto-scrolls to latest round',

      // Section 3: Crafts
      assignedMasterStatus: 'Assigned Master: {name} (T{tier} · {sub}/5 · EXP {exp}/{maxExp}) · Speed 100%',
      craftsAssignedMasterInfo: 'Assigned Master: {name} (T{tier} · {sub}/5 · EXP {exp}/{maxExp}) · Speed 100%',
      noMasterWarning: 'No Master: only T1 recipes available with -50% crafting speed penalty',
      craftsNoMasterWarning: 'No Master: only T1 recipes available with -50% crafting speed penalty',
      assignMasterLabel: 'Assign Master:',
      craftsAssignMasterLabel: 'Assign Master:',
      craftsInCombatTag: ' [In Combat]',
      craftsInLineupTag: ' [Lineup P.{pos}]',
      removeMasterBtn: 'Unassign Master',
      craftsUnassignMasterBtn: 'Unassign Master',
      blueprintsHeader: 'Blueprints & Recipes: {station}',
      craftsBlueprintsTitle: 'Blueprints & Recipes: {station}',
      threeThresholdsTooltipTitle: 'Three Mastery Thresholds',
      threeThresholdsTooltipBody:
        'How Master Realm (T_master) vs Recipe Tier (T_mat) governs crafting:\n' +
        '• No Master: T1 only with -50% speed penalty (50% chance).\n' +
        '• Threshold I (T_master = T_mat - 1): 25% chance, 3× Qi EXP on success.\n' +
        '• Threshold II (T_master = T_mat): 50–60% chance (scales with stage).\n' +
        '• Threshold III (T_master ≥ T_mat + 1): 100% chance + chance for "Flawless Work" (+20% stats or double pill yield)!',
      threeThresholdsLabel: 'Three Mastery Thresholds (Master Realm vs Recipe Tier)',
      craftsRankBadge: 'Tier T{tier}',
      craftsMasteryTooltipTitle: 'Mastery Threshold (Tier T{tier})',
      blockedCraftLabel: 'Locked (0%)',
      craftsBlockedZero: 'Locked (0%)',
      craftsChanceTime: 'Chance {chance}% · {sec}s',
      craftsExpMult: ' · EXP ×{mult}',
      craftsFlawlessPct: ' · Flawless {pct}%',
      craftsCostSummary: 'Stones {stones} · Iron {iron} · Moss {moss} · Carapace {carapace} · Rare: {rare} · EXP: +{exp}',
      craftBlockedBtn: 'Locked',
      craftsUnavailableBtn: 'Locked',
      craftInProgressBtn: 'Crafting...',
      craftsInProgressBtn: 'Crafting...',
      craftStartBtn: 'Craft',
      craftsCreateBtn: 'Craft',
      brewBtn: 'Brew',
      forgeBtn: 'Forge',
      consumeBtn: 'Consume',
      giveToAdeptBtn: 'Give to Disciple',
      elixirStockHeader: 'Elixir & Pill Reserves',
      craftsElixirStockTitle: 'Elixir & Pill Reserves',
      craftsCauldronTooltipTitle: 'Alchemy Cauldron Stock',
      craftsCauldronTooltipBody: 'Current sect stock of brewed healing pills, meridian cleansing decoctions, and breakthrough pills.',
      craftsElixirStockSummary: 'Heal: {heal} · Decoction: {decoction} · Break: {breakPill}',
      craftsQuickMedFor: 'Quick medicine for:',
      craftsPillTooltip: 'Pill effect: {bonus}. In warehouse stock: {stock} pcs.{consumed}',
      craftsPillConsumedSuffix: ' Absorbed by disciple: {consumed} of {max}.',
      absorbedCount: 'Absorbed: {consumed}/{max}',
      warehouseArsenalHeader: 'Warehouse Arsenal ({count})',
      craftsWarehouseArsenalTitle: 'Warehouse Arsenal ({count})',
      craftsEquipLabel: 'Equip on: {name}',
      craftsEmptyWarehouseMsg: 'No spare equipment in the warehouse. Assign a master and craft items on the left.',

      // Section 4: Chronicle & Memorial
      chronicleEventsTitle: 'Chronicle of Sect Events',
      chrSectEventsTitle: 'Chronicle of Sect Events',
      filterAllBtn: 'All ({count})',
      chrAllFilter: 'All ({count})',
      cat_SECT: 'Abode',
      chrCat_SECT: 'Abode',
      cat_RECRUIT: 'Tea Pavilion',
      chrCat_RECRUIT: 'Tea Pavilion',
      cat_COMBAT: 'Expedition',
      chrCat_COMBAT: 'Expedition',
      cat_ECONOMY: 'Treasury & Trade',
      chrCat_ECONOMY: 'Treasury & Trade',
      cat_CRAFT: 'Crafts',
      chrCat_CRAFT: 'Crafts',
      cat_BREAKTHROUGH: 'Breakthrough',
      chrCat_BREAKTHROUGH: 'Breakthrough',
      cat_DEATH: 'Fallen',
      chrCat_DEATH: 'Fallen',
      cat_DAO_HEART: 'Dao Heart',
      chrCat_DAO_HEART: 'Dao Heart',
      memorialTitle: 'Hall of Ancestors · Fallen in the Karst Rift ({count})',
      chrMemorialTitle: 'Hall of Ancestors · Fallen in the Karst Rift ({count})',
      memorialEmptyText: 'No disciple has fallen in battle yet.',
      chrNoFallenMsg: 'No disciple has fallen in battle yet.',
      recoveredByComrades: 'Recovered by comrades: ',
      chrRecoveredByComrades: 'Recovered by comrades: {items}',

      // Breakthrough Modal
      breakModalHeader: 'Peak of Body Tempering (Stage 5) → Foundation Establishment (Realm II)',
      breakModalSubheader: 'Peak of Body Tempering (Stage 5) → Foundation Establishment (Realm II)',
      breakModalTitle: 'Choose Combat Path: {name}',
      breakEnvPenalty: 'Environmental Penalty: Abode is at Tier I ("Forgotten Burrow"), breakthrough chance reduced by -35%.',
      breakModalEnvPenalty: 'Environmental Penalty: Abode is at Tier I ("Forgotten Burrow"), breakthrough chance reduced by -35%.',
      breakUsePillLabel: 'Use Foundation Breakthrough Pill (+25% chance, stock: {count})',
      yesLabel: 'Yes',
      noLabel: 'No',
      finalBreakChanceLabel: 'Final Ascension Chance:',
      breakFinalChanceLabel: 'Final Ascension Chance:',
      startBreakthroughBtn: 'Begin Breakthrough',

      // Realms, Archetypes, Temperaments, Pills
      realmTier1: 'Body Tempering (I)',
      realmTier2: 'Foundation Establishment (II)',
      subLevelPeak: 'Stage {sub} (Peak)',
      subLevelNormal: 'Stage {sub}',
      arch_NOVICE_name: 'Novice',
      arch_NOVICE_role: 'Realm I Disciple',
      arch_NOVICE_desc: 'Basic adept of the Body Tempering stage learning Qi circulation.',
      arch_SWORDSMAN_name: 'Outer Court Swordsman',
      arch_SWORDSMAN_role: 'Blade Master · Phys. DMG',
      arch_SWORDSMAN_desc: 'Realm II sword master who shatters armor with swift physical strikes.',
      arch_GUARDIAN_name: 'Stone Shield Guardian',
      arch_GUARDIAN_role: 'Vanguard · Lineup Tank',
      arch_GUARDIAN_desc: 'Unbreakable sect bulwark. Ideal for Position 1, absorbing 80% of enemy attacks.',
      arch_FLAME_ADEPT_name: 'Arcane Flame Adept',
      arch_FLAME_ADEPT_role: 'Spellcaster · Spirit Fire',
      arch_FLAME_ADEPT_desc: 'Wielder of spiritual fire who pierces physical armor with magical seals.',
      temp_NORMAL_name: 'Calm',
      temp_NORMAL_summary: 'Balanced temperament. Prone to spiritual clarity, keeps 10% of loot in personal purse.',
      temp_RIGHTEOUS_name: 'Righteous',
      temp_RIGHTEOUS_summary: 'Devoted to brotherhood and the Light. Avenges fallen comrades and strengthens Dao Heart.',
      temp_STOIC_name: 'Stoic',
      temp_STOIC_summary: 'Unyielding will in the face of adversity. Resistant to despair and tempers spirit in battle.',
      temp_COWARDLY_name: 'Cowardly',
      temp_COWARDLY_summary: '+6% evasion, prone to panic and flight when severely wounded.',
      temp_GREEDY_name: 'Greedy',
      temp_GREEDY_summary: '+15% resource find in the Rift, keeps 15% loot cut and trades actively.',
      temp_RECKLESS_name: 'Reckless',
      temp_RECKLESS_summary: '+18% attack and +5% crit, but -12% defense and higher risk of meridian injuries.',
      temp_PROUD_name: 'Proud',
      temp_PROUD_summary: 'Haughty demeanor (+8% attack). Suffers heavier mental shock from defeats and failed breakthroughs.',
      temp_CUNNING_name: 'Cunning',
      temp_CUNNING_summary: 'Calculating mind (+4% crit and evasion), easily tempted by dark arts.',
      station_FORGE_name: 'Forge',
      station_FORGE_full: 'Black Iron Forge',
      station_FORGE_prof: 'Spirit Steel Blacksmith',
      station_LOOM_name: 'Spirit Loom',
      station_LOOM_full: 'Spiritual Weaving Loom',
      station_LOOM_prof: 'Protective Robe Weaver',
      station_CAULDRON_name: 'Cauldron',
      station_CAULDRON_full: 'Alchemy Cauldron',
      station_CAULDRON_prof: 'Master of Pills & Decoctions',
      station_ALTAR_name: 'Altar',
      station_ALTAR_full: 'Spirit Artifact Altar',
      station_ALTAR_prof: 'Protective Array Carver',
      station_TABLE_name: 'Talisman Table',
      station_TABLE_full: 'Talisman Inscription Table',
      station_TABLE_prof: 'Combat Seal Scribe',
      pill_pAtk_name: 'Bone Marrow Pill',
      pill_pAtk_short: 'Phys. ATK',
      pill_pAtk_bonus: '+1 Phys. ATK permanently',
      pill_mAtk_name: 'Astral Spirit Pill',
      pill_mAtk_short: 'Mag. ATK',
      pill_mAtk_bonus: '+1 Mag. ATK permanently',
      pill_pDef_name: 'Iron Skin Pill',
      pill_pDef_short: 'Phys. DEF',
      pill_pDef_bonus: '+1 Phys. DEF permanently',
      pill_mDef_name: 'Jade Heart Pill',
      pill_mDef_short: 'Mag. DEF',
      pill_mDef_bonus: '+1 Mag. DEF permanently',
      pill_spd_name: 'Wind Step Pill',
      pill_spd_short: 'Speed',
      pill_spd_bonus: '+1 Speed permanently',
      pill_maxHp_name: 'Vital Blood Pill',
      pill_maxHp_short: 'Max HP',
      pill_maxHp_bonus: '+12 Max HP permanently',
    },
  };

  var ROOT_TRANSLATIONS_EN = {
    MORTAL_MIXED: {
      name: 'Five-Element Mixed Root',
      description: 'Scattered Qi of five elements (Wu Xing). Slower cultivation speed, but hardy physique.',
    },
    EARTH_VEIN: {
      name: 'Black Stone Earth Root',
      description: 'Earth element root (Wu Xing). Boosts defense and survivability in the vanguard.',
    },
    CRIMSON_FLAME: {
      name: 'True Crimson Flame Root',
      description: 'Fire element root (Wu Xing). Accelerates cultivation and amplifies offensive power.',
    },
    FROST_JADE: {
      name: 'Frost Jade Spirit Root',
      description: 'Water element root (Wu Xing). High speed and spiritual defense.',
    },
    HEAVENLY_VOID: {
      name: 'Heavenly Primordial Void Root',
      description: 'Rarest gift of the Heavens (+35% Qi comprehension speed and balanced attributes).',
    },
    DARK_BLOOD_SHADOW: {
      name: 'Demonic Root (Blood / Shadow)',
      description: 'Corrupted demonic root of Blood and Shadow. Awakened by falling onto the Demonic Path.',
    },
    DARK_POISON_DECAY: {
      name: 'Demonic Root (Venom / Decay)',
      description: 'Corrupted demonic root of Venom and Decay. Awakened by falling onto the Demonic Path.',
    },
  };

  var CONSTITUTION_TRANSLATIONS_EN = {
    COMMON_VESSEL: {
      name: 'Common Mortal Vessel',
      description: 'Standard mortal meridians without innate deviations.',
    },
    IRON_MARROW: {
      name: 'Black Iron Marrow',
      description: 'Dense bones and tendons. Expands pill absorption cap (+1 to all types).',
    },
    SPIRIT_MERIDIAN: {
      name: 'Open Spirit Gates',
      description: 'Wide Qi channels allow absorbing more alchemical elixirs (+2 to pill cap).',
    },
    ANCIENT_BLOOD: {
      name: 'Blood of Ancient Titans',
      description: 'Mighty physique of ancient bloodlines (+3 to pill cap for every attribute).',
    },
  };

  var RECIPE_TRANSLATIONS_EN = {
    BOG_IRON_BLADE: {
      name: 'Bog Iron Blade',
      description: 'Heavy T1 sword forged from bog ore (+9 Phys. ATK, +2 SPD, +3% CRIT).',
    },
    CRIMSON_STEEL_SABER: {
      name: 'Crimson Steel Saber',
      description: 'T2 blade quenched in demon blood (+19 Phys. ATK, +4 SPD, +6% CRIT).',
    },
    VOID_DRAGON_HALBERD: {
      name: 'Void Dragon Halberd',
      description: 'T3 grandmaster relic (+34 Phys. ATK, +12 Mag. ATK, +6 SPD, +10% CRIT).',
    },
    CARAPACE_CUIRASS: {
      name: 'Spider Carapace Cuirass',
      description: 'Sturdy T1 chitin armor (+42 Max HP, +10 Phys. DEF, +7 Mag. DEF).',
    },
    SILK_CLOUD_ROBE: {
      name: 'Cloud Silk Robe',
      description: 'Spiritual T2 vestment (+85 Max HP, +16 Phys. DEF, +18 Mag. DEF, +5% EVA).',
    },
    IMMORTAL_CRANE_VESTMENT: {
      name: 'Celestial Crane Vestment',
      description: 'T3 robe woven from spirit silk (+150 Max HP, +28/+30 DEF, +8% EVA).',
    },
    MOSS_SPIRIT_STAFF: {
      name: 'Blood Moss Spirit Staff',
      description: 'T1 spiritual conduit (+10 Mag. ATK, +4 Mag. DEF, +2 SPD).',
    },
    JADE_AEGIS_ARMOR: {
      name: 'Jade Aegis Mirror',
      description: 'Enchanted T2 breastplate (+95 Max HP, +22 Phys. DEF, +14 Mag. DEF).',
    },
    HEAVENLY_BELL_ARMOR: {
      name: 'Bell of Primordial Protection',
      description: 'T3 artifact barrier (+180 Max HP, +35 Phys. DEF, +35 Mag. DEF).',
    },
    BLOOD_RUNE_TALISMAN: {
      name: 'Blood Seal Talisman',
      description: 'T1 combat scroll of cinnabar and moss (+11 Mag. ATK, +4% CRIT, +2 SPD).',
    },
    THUNDER_DECREE_SWORD: {
      name: 'Thunder Decree Sword-Scroll',
      description: 'T2 celestial thunder talisman (+22 Mag. ATK, +8 Phys. ATK, +5 SPD, +7% CRIT).',
    },
    NINE_HEAVENS_SEAL: {
      name: 'Seal of the Nine Heavens',
      description: 'T3 divine seal (+38 Mag. ATK, +7 SPD, +12% CRIT, +5% EVA).',
    },
    ELIXIR_HEAL: {
      name: 'Qi Healing Pill',
      description: 'Instantly restores 60% of a disciple’s maximum health.',
    },
    ELIXIR_INJURY: {
      name: 'Meridian Cleansing Decoction',
      description: 'Cures 2 stacks of internal meridian injuries and unlocks rest at 5/5 injuries.',
    },
    ELIXIR_BREAKTHROUGH: {
      name: 'Foundation Breakthrough Pill',
      description: 'T2 elixir: increases Realm II breakthrough chance by +25%.',
    },
    ELIXIR_GOLDEN_CORE: {
      name: 'Heavenly Origin Pill (T3)',
      description: 'Supreme T3 elixir: grants +2 Breakthrough Pills and +1 Potential Pill of each type.',
    },
  };

  function getLang() {
    return currentLang;
  }

  function setLang(nextLang) {
    var normalized = nextLang === 'en' ? 'en' : 'ru';
    currentLang = normalized;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(LANG_STORAGE_KEY, normalized);
        ALT_LANG_KEYS.forEach(function (k) {
          window.localStorage.setItem(k, normalized);
        });
      } catch (e) {
        // ignore storage errors
      }
    }
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = normalized;
    }
    return currentLang;
  }

  function t(key, params, langOverride) {
    var lang = langOverride || currentLang || 'ru';
    var dict = DICTIONARIES[lang] || DICTIONARIES.ru;
    var template =
      dict[key] !== undefined
        ? dict[key]
        : DICTIONARIES.ru[key] !== undefined
        ? DICTIONARIES.ru[key]
        : key;
    if (!params || typeof template !== 'string') {
      return template;
    }
    return template.replace(/\{(\w+)\}/g, function (_, token) {
      return params[token] !== undefined && params[token] !== null
        ? String(params[token])
        : '';
    });
  }

  function getDaoHeartKeyByValue(daoHeart) {
    if (typeof daoHeart === 'boolean') {
      return daoHeart ? 'DIAMOND_HEART' : 'EQUILIBRIUM';
    }
    var rawVal =
      daoHeart && typeof daoHeart === 'object'
        ? typeof daoHeart.daoHeart === 'number' && !isNaN(daoHeart.daoHeart)
          ? daoHeart.daoHeart
          : 0
        : typeof daoHeart === 'number' && !isNaN(daoHeart)
        ? daoHeart
        : 0;
    var val = Math.max(-100, Math.min(100, rawVal));
    if (val >= 85) return 'DIAMOND_HEART';
    if (val >= 55) return 'FEARLESS_BEFORE_HEAVENS';
    if (val >= 20) return 'UNWAVERING_SPIRIT';
    if (val > -20) return 'EQUILIBRIUM';
    if (val > -65) return 'SPIRIT_TURMOIL';
    return 'DEMON_ABYSS';
  }

  function getDaoHeartLabel(daoHeart, langOverride) {
    var key = getDaoHeartKeyByValue(daoHeart);
    return t('dao_' + key, null, langOverride);
  }

  function getDaoHeartSubtitle(daoHeart, langOverride) {
    var key = getDaoHeartKeyByValue(daoHeart);
    return t('daoSub_' + key, null, langOverride);
  }

  function getArchetypeInfo(archKey, fallbackMap) {
    var base =
      (fallbackMap && (fallbackMap[archKey] || fallbackMap.NOVICE)) || {
        name: archKey,
        role: '',
        description: '',
        statBonuses: {},
      };
    var k = archKey || 'NOVICE';
    return Object.assign({}, base, {
      name: t('arch_' + k + '_name') || base.name,
      role: t('arch_' + k + '_role') || base.role,
      description: t('arch_' + k + '_desc') || base.description,
    });
  }

  function getTemperamentInfo(tempKey, fallbackMap) {
    var base =
      (fallbackMap && (fallbackMap[tempKey] || fallbackMap.NORMAL)) || {
        name: tempKey,
        summary: '',
      };
    var k = tempKey || 'NORMAL';
    return Object.assign({}, base, {
      name: t('temp_' + k + '_name') || base.name,
      summary: t('temp_' + k + '_summary') || base.summary,
    });
  }

  function getSpiritRootInfo(rootObj) {
    if (!rootObj) return { name: '', description: '' };
    if (currentLang === 'en' && rootObj.id && ROOT_TRANSLATIONS_EN[rootObj.id]) {
      return Object.assign({}, rootObj, ROOT_TRANSLATIONS_EN[rootObj.id]);
    }
    return rootObj;
  }

  function getConstitutionInfo(constObj) {
    if (!constObj) return { name: '', description: '' };
    if (
      currentLang === 'en' &&
      constObj.id &&
      CONSTITUTION_TRANSLATIONS_EN[constObj.id]
    ) {
      return Object.assign({}, constObj, CONSTITUTION_TRANSLATIONS_EN[constObj.id]);
    }
    return constObj;
  }

  function getStationInfo(stationKey, fallbackMap) {
    var base = (fallbackMap && fallbackMap[stationKey]) || {
      id: stationKey,
      name: stationKey,
      fullTitle: stationKey,
      profession: '',
    };
    return Object.assign({}, base, {
      name: t('station_' + stationKey + '_name') || base.name,
      fullTitle: t('station_' + stationKey + '_full') || base.fullTitle,
      profession: t('station_' + stationKey + '_prof') || base.profession,
    });
  }

  function getStatPillInfo(statKey, fallbackMap) {
    var base = (fallbackMap && fallbackMap[statKey]) || {
      name: statKey,
      shortStat: statKey,
      bonusText: '',
    };
    return {
      name: t('pill_' + statKey + '_name') || base.name,
      shortStat: t('pill_' + statKey + '_short') || base.shortStat,
      bonusText: t('pill_' + statKey + '_bonus') || base.bonusText,
    };
  }

  function getRecipeInfo(rec) {
    if (!rec) return rec;
    if (rec.category === 'STAT_PILL' && rec.statKey) {
      var pillInfo = getStatPillInfo(rec.statKey);
      return Object.assign({}, rec, {
        name: pillInfo.name,
        description: pillInfo.bonusText,
      });
    }
    var tplKey = rec.templateId || rec.id;
    if (currentLang === 'en' && tplKey && RECIPE_TRANSLATIONS_EN[tplKey]) {
      return Object.assign({}, rec, RECIPE_TRANSLATIONS_EN[tplKey]);
    }
    return rec;
  }

  function getMaterialName(matKey, fallbackMap) {
    if (matKey === 'spiritStones') return t('resSpiritStonesTitle');
    if (matKey === 'bogIron') return t('resBogIronTitle');
    if (matKey === 'bloodMoss') return t('resBloodMossTitle');
    if (matKey === 'spiderCarapace') return t('resSpiderCarapaceTitle');
    return (fallbackMap && fallbackMap[matKey]) || matKey;
  }

  function getGearInfo(gearItem) {
    if (!gearItem) return { name: '', description: '' };
    var tplKey = gearItem.templateId || gearItem.id;
    if (currentLang === 'en' && tplKey && RECIPE_TRANSLATIONS_EN[tplKey]) {
      var tr = RECIPE_TRANSLATIONS_EN[tplKey];
      var prefix = gearItem.isFlawless ? 'Flawless ' : '';
      return {
        name: prefix + tr.name,
        description: tr.description,
      };
    }
    return {
      name: gearItem.name || '',
      description: gearItem.description || '',
    };
  }

  // Синхронизируем атрибут lang на старте
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = currentLang;
  }

  var i18nApi = {
    LANG_STORAGE_KEY: LANG_STORAGE_KEY,
    DICTIONARIES: DICTIONARIES,
    getLang: getLang,
    setLang: setLang,
    getLanguage: getLang,
    setLanguage: setLang,
    t: t,
    getDaoHeartKeyByValue: getDaoHeartKeyByValue,
    getDaoHeartLabel: getDaoHeartLabel,
    getDaoHeartSubtitle: getDaoHeartSubtitle,
    getArchetypeInfo: getArchetypeInfo,
    getTemperamentInfo: getTemperamentInfo,
    getSpiritRootInfo: getSpiritRootInfo,
    getConstitutionInfo: getConstitutionInfo,
    getStationInfo: getStationInfo,
    getRecipeInfo: getRecipeInfo,
    getStatPillInfo: getStatPillInfo,
    getMaterialName: getMaterialName,
    getGearInfo: getGearInfo,
  };

  window.SectGame.i18n = i18nApi;
  window.i18n = i18nApi;
  window.t = t;
})();
