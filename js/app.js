/**
 * КОНТРОЛЛЕР ИГРЫ И ОДНОЭКРАННОГО ИНТЕРФЕЙСА: ОБИТЕЛЬ БЕССМЕРТНЫХ (ALPHA 0.3)
 * Работает напрямую через протокол file:// и в WebView без сборщиков и серверов.
 */
(function () {
  window.SectGame = window.SectGame || {};

  const math = window.SectGame.math;
  const soundFX = window.SectGame.soundFX;
  const illustrations = window.SectGame.illustrations;
  const exporter = window.SectGame.exporter;
  const i18n = window.SectGame.i18n;

  function t(key, params) {
    if (i18n && typeof i18n.t === 'function') {
      return i18n.t(key, params);
    }
    return key;
  }

  function getCurrentLang() {
    if (i18n) {
      if (typeof i18n.getLanguage === 'function') return i18n.getLanguage();
      if (typeof i18n.getLang === 'function') return i18n.getLang();
    }
    return 'ru';
  }

  function getArchInfo(archKey) {
    if (i18n && typeof i18n.getArchetypeInfo === 'function') {
      return i18n.getArchetypeInfo(archKey, math.ARCHETYPE_INFO);
    }
    return (math.ARCHETYPE_INFO && math.ARCHETYPE_INFO[archKey]) || math.ARCHETYPE_INFO.NOVICE;
  }

  function getTempInfo(tempKey) {
    if (i18n && typeof i18n.getTemperamentInfo === 'function') {
      return i18n.getTemperamentInfo(tempKey, math.TEMPERAMENT_INFO);
    }
    return (math.TEMPERAMENT_INFO && math.TEMPERAMENT_INFO[tempKey]) || math.TEMPERAMENT_INFO.NORMAL;
  }

  function getRootInfo(rootObj) {
    if (i18n && typeof i18n.getSpiritRootInfo === 'function') {
      return i18n.getSpiritRootInfo(rootObj);
    }
    return rootObj || { name: '', description: '' };
  }

  function getConstInfo(constObj) {
    if (i18n && typeof i18n.getConstitutionInfo === 'function') {
      return i18n.getConstitutionInfo(constObj);
    }
    return constObj || { name: '', description: '' };
  }

  function getStationInfo(stationKey) {
    if (i18n && typeof i18n.getStationInfo === 'function') {
      return i18n.getStationInfo(stationKey, math.CRAFT_STATIONS);
    }
    return math.CRAFT_STATIONS[stationKey];
  }

  function getRecipeInfo(rec) {
    if (i18n && typeof i18n.getRecipeInfo === 'function') {
      return i18n.getRecipeInfo(rec);
    }
    return rec;
  }

  function getPillInfo(statKey) {
    if (i18n && typeof i18n.getStatPillInfo === 'function') {
      return i18n.getStatPillInfo(statKey, math.STAT_PILL_LABELS);
    }
    return math.STAT_PILL_LABELS[statKey];
  }

  function getMatName(matKey) {
    if (i18n && typeof i18n.getMaterialName === 'function') {
      return i18n.getMaterialName(matKey, math.MATERIAL_NAMES);
    }
    return (math.MATERIAL_NAMES && math.MATERIAL_NAMES[matKey]) || matKey;
  }

  function getGearDisplayName(gearItem) {
    if (!gearItem) return '';
    if (i18n && typeof i18n.getGearInfo === 'function') {
      return i18n.getGearInfo(gearItem).name;
    }
    return gearItem.name || '';
  }

  function getGearDisplayDesc(gearItem) {
    if (!gearItem) return '';
    if (i18n && typeof i18n.getGearInfo === 'function') {
      return i18n.getGearInfo(gearItem).description;
    }
    return gearItem.description || '';
  }

  const SAVE_STORAGE_KEY = 'idle_sect_manager_alpha_v1';
  const RECRUIT_COST = 25;

  const INITIAL_RESOURCES = {
    spiritStones: 45,
    bogIron: 8,
    bloodMoss: 8,
    spiderCarapace: 6,
  };

  const INITIAL_CONSUMABLES = {
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

  function getTimeStr() {
    const locale = getCurrentLang() === 'en' ? 'en-US' : 'ru-RU';
    return new Date().toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function createInitialCraftStations() {
    return {
      FORGE: { stationId: 'FORGE', masterId: null, activeCraft: null, lastResultText: '' },
      LOOM: { stationId: 'LOOM', masterId: null, activeCraft: null, lastResultText: '' },
      CAULDRON: { stationId: 'CAULDRON', masterId: null, activeCraft: null, lastResultText: '' },
      ALTAR: { stationId: 'ALTAR', masterId: null, activeCraft: null, lastResultText: '' },
      TABLE: { stationId: 'TABLE', masterId: null, activeCraft: null, lastResultText: '' },
    };
  }

  function loadSavedGame() {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const savedStations = createInitialCraftStations();
      if (parsed && parsed.craftStations) {
        Object.keys(savedStations).forEach(function (stKey) {
          if (parsed.craftStations[stKey]) {
            savedStations[stKey].masterId = parsed.craftStations[stKey].masterId || null;
            savedStations[stKey].activeCraft = parsed.craftStations[stKey].activeCraft || null;
            savedStations[stKey].lastResultText = parsed.craftStations[stKey].lastResultText || '';
          }
        });
      }
      const isExpActive = Boolean(
        parsed && parsed.expedition && parsed.expedition.active
      );
      if (parsed && Array.isArray(parsed.disciples)) {
        parsed.disciples = parsed.disciples.map(function (d) {
          const tier = d.realmTier || 1;
          const sub = d.subLevel || 1;
          const isPavilionMaster =
            d.status === 'PAVILION_DUTY' &&
            d.assignedStation &&
            savedStations[d.assignedStation] &&
            savedStations[d.assignedStation].masterId === d.id;
          const restoredStatus = isPavilionMaster
            ? 'PAVILION_DUTY'
            : isExpActive && d.lineupSlot !== null && d.status === 'EXPEDITION'
            ? 'EXPEDITION'
            : 'IDLE';
          let restoredDaoHeart = 0;
          if (typeof d.daoHeart === 'number' && !isNaN(d.daoHeart)) {
            restoredDaoHeart = Math.max(-100, Math.min(100, Math.round(d.daoHeart)));
          } else if (d.daoHeart === true) {
            restoredDaoHeart = 25;
          }
          const restoredDemonAwakened = Boolean(
            d.isDemonAwakened || restoredDaoHeart <= -80
          );
          if (restoredDemonAwakened && restoredDaoHeart > 0) {
            restoredDaoHeart = 0;
          }
          let restoredRoot = d.spiritRoot;
          if (
            restoredDemonAwakened &&
            (!restoredRoot || !restoredRoot.isDarkRoot) &&
            math.DARK_SPIRIT_ROOTS &&
            math.DARK_SPIRIT_ROOTS.length > 0
          ) {
            restoredRoot = Object.assign({}, math.DARK_SPIRIT_ROOTS[0]);
          }
          return math.syncDiscipleHp(
            Object.assign({}, d, {
              daoHeart: restoredDaoHeart,
              isDemonAwakened: restoredDemonAwakened,
              spiritRoot: restoredRoot,
              status: restoredStatus,
              assignedStation: isPavilionMaster ? d.assignedStation : null,
              lineupSlot: isPavilionMaster ? null : d.lineupSlot,
              maxExp:
                d.maxExp && d.maxExp > 0
                  ? d.maxExp
                  : math.SUBLEVEL_MAX_EXP[tier][sub],
            }),
            false
          );
        });
      }
      if (parsed && parsed.expedition) {
        const hasAliveEnemies =
          Array.isArray(parsed.expedition.enemies) &&
          parsed.expedition.enemies.some(function (e) {
            return e && e.stats && e.stats.hp > 0;
          });
        parsed.expedition.expeditionPhase =
          parsed.expedition.expeditionPhase === 'COMBAT' && hasAliveEnemies
            ? 'COMBAT'
            : 'MARCHING';
        parsed.expedition.marchingTotalTicks =
          Number(parsed.expedition.marchingTotalTicks) >= 3
            ? Number(parsed.expedition.marchingTotalTicks)
            : 3;
        parsed.expedition.marchingTicksLeft =
          typeof parsed.expedition.marchingTicksLeft === 'number' &&
          parsed.expedition.marchingTicksLeft > 0
            ? parsed.expedition.marchingTicksLeft
            : parsed.expedition.marchingTotalTicks;
        parsed.expedition.autoRetreatThreshold =
          typeof parsed.expedition.autoRetreatThreshold === 'number'
            ? parsed.expedition.autoRetreatThreshold
            : 0;
        parsed.expedition.fallenInCurrentRun = Array.isArray(
          parsed.expedition.fallenInCurrentRun
        )
          ? parsed.expedition.fallenInCurrentRun
          : [];
      }
      parsed.craftStations = savedStations;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  const saved = loadSavedGame();

  const state = {
    lang: getCurrentLang() || (saved && saved.lang) || 'ru',
    settingsModalOpen: false,
    activeTab: (saved && saved.activeTab) || 'ABODE', // ABODE | EXPEDITION | CRAFTS | CHRONICLE
    abodeSubTab: (saved && saved.abodeSubTab) || 'SANCTUARY', // SANCTUARY | ROSTER | INVENTORY
    expeditionSubTab: (saved && saved.expeditionSubTab) || 'ARENA', // ARENA | LINEUP | LOG
    craftsSubTab:
      saved && saved.craftsSubTab && math.CRAFT_STATIONS[saved.craftsSubTab]
        ? saved.craftsSubTab
        : 'FORGE', // FORGE | LOOM | CAULDRON | ALTAR | TABLE
    chronicleSubTab: (saved && saved.chronicleSubTab) || 'EVENTS', // EVENTS | MEMORIAL
    chronicleFilter: (saved && saved.chronicleFilter) || 'ALL',
    soundMuted: Boolean(saved && saved.soundMuted),
    lastSavedAt: (saved && saved.lastSavedAt) || getTimeStr(),

    sectLevel: (saved && saved.sectLevel) || 1,
    resources: (saved && saved.resources) || Object.assign({}, INITIAL_RESOURCES),
    consumables:
      (saved && saved.consumables) ||
      JSON.parse(JSON.stringify(INITIAL_CONSUMABLES)),
    warehouseGear: (saved && saved.warehouseGear) || [],
    craftStations: (saved && saved.craftStations) || createInitialCraftStations(),
    freeRecruitsLeft:
      saved && typeof saved.freeRecruitsLeft === 'number'
        ? saved.freeRecruitsLeft
        : 1,
    disciples: (saved && saved.disciples) || [],
    fallenMemorial: (saved && saved.fallenMemorial) || [],
    selectedDiscipleId:
      (saved && saved.selectedDiscipleId) ||
      (saved && saved.disciples && saved.disciples[0] && saved.disciples[0].id) ||
      null,
    inspectedDiscipleId: null,

    rewardedAdTimer: null,
    breakthroughModalDiscipleId: null,
    usePillOnBreakthrough: false,
    selectedT2Archetype: 'SWORDSMAN',

    expedition: (saved && saved.expedition) || {
      active: false,
      expeditionPhase: 'MARCHING', // 'MARCHING' | 'COMBAT'
      marchingTicksLeft: 3,
      marchingTotalTicks: 3,
      depthStage: 1,
      waveInStage: 1,
      combatRound: 0,
      enemies: [],
      lootBuffer: { spiritStones: 0, bogIron: 0, bloodMoss: 0, spiderCarapace: 0 },
      expEarnedInRun: 0,
      combatLog: [
        'Отряд готов к спуску в Карстовый Разлом. Назначьте бойцов на позиции 1–4.',
      ],
      isPaused: false,
      autoRetreatThreshold: 0, // 0 = Выкл, либо порог ОЗ в % (25, 40, 50)
      fallenInCurrentRun: [], // Список погибших соратников (isDead === true) в текущем походе
    },

    chronicle: (saved && saved.chronicle) || [
      {
        id: 'init_1',
        time: getTimeStr(),
        category: 'SECT',
        title: 'Основание Обители «Забытая Нора»',
        detail:
          'Защитная формация древней секты активирована. В Чайном павильоне ожидает первый кандидат в послушники.',
      },
    ],
  };

  if (state.soundMuted && soundFX) {
    soundFX.muted = true;
  }

  function persistState() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      state.lastSavedAt = getTimeStr();
      const serializedStations = {};
      Object.keys(state.craftStations).forEach(function (k) {
        serializedStations[k] = {
          stationId: k,
          masterId: state.craftStations[k].masterId || null,
          activeCraft: state.craftStations[k].activeCraft || null,
          lastResultText: state.craftStations[k].lastResultText || '',
        };
      });
      const payload = {
        lang: state.lang,
        activeTab: state.activeTab,
        abodeSubTab: state.abodeSubTab,
        expeditionSubTab: state.expeditionSubTab,
        craftsSubTab: state.craftsSubTab,
        chronicleSubTab: state.chronicleSubTab,
        chronicleFilter: state.chronicleFilter,
        soundMuted: state.soundMuted,
        lastSavedAt: state.lastSavedAt,
        sectLevel: state.sectLevel,
        resources: state.resources,
        consumables: state.consumables,
        warehouseGear: state.warehouseGear,
        craftStations: serializedStations,
        freeRecruitsLeft: state.freeRecruitsLeft,
        disciples: state.disciples,
        selectedDiscipleId: state.selectedDiscipleId,
        expedition: state.expedition,
        fallenMemorial: state.fallenMemorial,
        chronicle: state.chronicle.slice(0, 60),
      };
      window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      // ignore storage errors
    }
  }

  function addChronicle(category, title, detail) {
    state.chronicle.unshift({
      id: 'chr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      time: getTimeStr(),
      category: category,
      title: title,
      detail: detail,
    });
    if (state.chronicle.length > 80) {
      state.chronicle.length = 80;
    }
  }

  function scrollExpeditionLogToBottom() {
    const logElement = document.getElementById('expedition-log');
    if (logElement) {
      logElement.scrollTop = logElement.scrollHeight;
    }
  }

  function appendExpeditionLog(line) {
    state.expedition.combatLog.push(line);
    if (state.expedition.combatLog.length > 40) {
      state.expedition.combatLog = state.expedition.combatLog.slice(-40);
    }
    scrollExpeditionLogToBottom();
  }

  function canAfford(cost) {
    return (
      state.resources.spiritStones >= cost.spiritStones &&
      state.resources.bogIron >= cost.bogIron &&
      state.resources.bloodMoss >= cost.bloodMoss &&
      state.resources.spiderCarapace >= cost.spiderCarapace
    );
  }

  function spendResources(cost) {
    state.resources.spiritStones -= cost.spiritStones;
    state.resources.bogIron -= cost.bogIron;
    state.resources.bloodMoss -= cost.bloodMoss;
    state.resources.spiderCarapace -= cost.spiderCarapace;
  }

  function getSquadInLineupOrder() {
    return state.disciples
      .filter(function (d) {
        return d.lineupSlot !== null && d.status !== 'PAVILION_DUTY';
      })
      .sort(function (a, b) {
        return a.lineupSlot - b.lineupSlot;
      });
  }

  function getSelectedDisciple() {
    const found = state.disciples.find(function (d) {
      return d.id === state.selectedDiscipleId;
    });
    return found || state.disciples[0] || null;
  }

  // ==========================================================================
  // ИГРОВЫЕ ДЕЙСТВИЯ
  // ==========================================================================

  function handleRecruitDisciple(fromHeavensGrace) {
    if (!fromHeavensGrace) {
      if (state.freeRecruitsLeft <= 0 && state.resources.spiritStones < RECRUIT_COST) {
        return;
      }
      if (state.freeRecruitsLeft > 0) {
        state.freeRecruitsLeft -= 1;
      } else {
        state.resources.spiritStones -= RECRUIT_COST;
      }
    }

    const newDisc = math.generateDisciple(Boolean(fromHeavensGrace));
    const occupied = {};
    state.disciples.forEach(function (d) {
      if (d.lineupSlot !== null) occupied[d.lineupSlot] = true;
    });
    for (let slot = 0; slot < 4; slot++) {
      if (!occupied[slot]) {
        newDisc.lineupSlot = slot;
        break;
      }
    }

    state.disciples.push(newDisc);
    state.selectedDiscipleId = newDisc.id;
    soundFX.playChime();

    const genderLabel = newDisc.gender === 'YANG' ? 'Начало Ян' : 'Начало Инь';
    const tempLabel = math.TEMPERAMENT_INFO[newDisc.temperament].name;

    if (fromHeavensGrace) {
      addChronicle(
        'RECRUIT',
        'Милость Небес: прибыл ' + newDisc.name,
        'Небеса откликнулись на зов опустевшей обители и прислали послушника (' +
          genderLabel +
          ' · Характер: ' +
          tempLabel +
          ' · ' +
          newDisc.spiritRoot.name +
          ').'
      );
    } else {
      addChronicle(
        'RECRUIT',
        'Принят послушник: ' + newDisc.name,
        'Чайный павильон: ' +
          genderLabel +
          ' · Характер: ' +
          tempLabel +
          ' · Корень: ' +
          newDisc.spiritRoot.name +
          ' · Конституция: ' +
          newDisc.constitution.name +
          '.'
      );
    }

    persistState();
    renderApp();
  }

  function triggerHeavensGraceAd() {
    if (state.rewardedAdTimer !== null) return;
    state.rewardedAdTimer = 2;
    renderApp();

    const interval = window.setInterval(function () {
      if (state.rewardedAdTimer === null || state.rewardedAdTimer <= 1) {
        window.clearInterval(interval);
        state.rewardedAdTimer = null;
        handleRecruitDisciple(true);
      } else {
        state.rewardedAdTimer -= 1;
        renderApp();
      }
    }, 1000);
  }

  function assignToSlot(discipleId, targetSlot) {
    if (state.expedition.active) return;
    const candidate = state.disciples.find(function (d) {
      return d.id === discipleId;
    });
    // Ученик в статусе PAVILION_DUTY не может одновременно находиться в строю экспедиции
    if (!candidate || candidate.status === 'PAVILION_DUTY') return;

    state.disciples = state.disciples.map(function (d) {
      if (d.id === discipleId) {
        return Object.assign({}, d, {
          lineupSlot: d.lineupSlot === targetSlot ? null : targetSlot,
        });
      }
      if (targetSlot !== null && d.lineupSlot === targetSlot) {
        return Object.assign({}, d, { lineupSlot: null });
      }
      return d;
    });
    persistState();
    renderApp();
  }

  function startExpedition() {
    const squad = getSquadInLineupOrder();
    if (squad.length === 0) return;

    // При входе в поход активируем статус EXPEDITION и полностью заряжаем Личный Щит Ци (qiShield)
    state.disciples = state.disciples.map(function (d) {
      if (d.lineupSlot === null || d.status === 'PAVILION_DUTY') return d;
      const eff = math.calculateEffectiveStats(d);
      return Object.assign({}, d, {
        status: 'EXPEDITION',
        isDead: false,
        hadHardFightInBattle: false,
        secondWindUsedInBattle: false,
        qiShield: eff.maxQiShield,
        maxQiShield: eff.maxQiShield,
        stats: Object.assign({}, d.stats, {
          qiShield: eff.maxQiShield,
          maxQiShield: eff.maxQiShield,
        }),
      });
    });

    const marchDuration = math.randomInt(3, 4);
    state.expedition.active = true;
    state.expedition.expeditionPhase = 'MARCHING';
    state.expedition.marchingTotalTicks = marchDuration;
    state.expedition.marchingTicksLeft = marchDuration;
    state.expedition.waveInStage = 1;
    state.expedition.combatRound = 0;
    state.expedition.enemies = [];
    state.expedition.isPaused = false;
    state.expedition.fallenInCurrentRun = [];
    appendExpeditionLog(
      '[Тропа · Ярус ' +
        state.expedition.depthStage +
        '] Отряд (' +
        squad
          .map(function (s) {
            return s.name;
          })
          .join(', ') +
        ') спустился в Карстовый Разлом и активировал Щиты Ци. Отряд продвигается по тропе...'
    );

    addChronicle(
      'COMBAT',
      'Поход в Карстовый Разлом (Ярус ' + state.expedition.depthStage + ')',
      'В строй встали ' +
        squad.length +
        ' адептов. Первую позицию авангарда занимает ' +
        squad[0].name +
        '.'
    );

    state.activeTab = 'EXPEDITION';
    state.expeditionSubTab = 'ARENA';
    persistState();
    renderApp();
  }

  function claimLootBuffer() {
    const buf = state.expedition.lootBuffer;
    const totalItems =
      buf.spiritStones + buf.bogIron + buf.bloodMoss + buf.spiderCarapace;
    if (totalItems === 0) return;

    const squad = getSquadInLineupOrder();
    const activeReceivers = squad.length > 0 ? squad : state.disciples;

    const avgCut =
      activeReceivers.length > 0
        ? activeReceivers.reduce(function (sum, d) {
            return sum + math.TEMPERAMENT_INFO[d.temperament].lootCutPercent;
          }, 0) / activeReceivers.length
        : 0.1;

    const discipleStonesFromStones =
      buf.spiritStones > 0 ? Math.max(1, Math.round(buf.spiritStones * avgCut)) : 0;
    const sectStonesGain = Math.max(0, buf.spiritStones - discipleStonesFromStones);

    function splitMaterial(total) {
      if (total <= 0) return { sect: 0, disciplePart: 0 };
      const disciplePart = total >= 6 ? Math.max(1, Math.round(total * avgCut)) : 0;
      return { sect: total - disciplePart, disciplePart: disciplePart };
    }

    const ironSplit = splitMaterial(buf.bogIron);
    const mossSplit = splitMaterial(buf.bloodMoss);
    const carapaceSplit = splitMaterial(buf.spiderCarapace);

    const totalDisciplePurseGain =
      discipleStonesFromStones +
      ironSplit.disciplePart +
      mossSplit.disciplePart +
      carapaceSplit.disciplePart * 2;

    state.resources.spiritStones += sectStonesGain;
    state.resources.bogIron += ironSplit.sect;
    state.resources.bloodMoss += mossSplit.sect;
    state.resources.spiderCarapace += carapaceSplit.sect;

    if (activeReceivers.length > 0 && totalDisciplePurseGain > 0) {
      const basePerDisc = Math.floor(
        totalDisciplePurseGain / activeReceivers.length
      );
      let remainder = totalDisciplePurseGain % activeReceivers.length;
      const receiverIds = {};
      activeReceivers.forEach(function (d) {
        receiverIds[d.id] = true;
      });

      state.disciples = state.disciples.map(function (d) {
        if (!receiverIds[d.id]) return d;
        const extra = remainder > 0 ? 1 : 0;
        if (remainder > 0) remainder--;
        return Object.assign({}, d, {
          personalStones: d.personalStones + basePerDisc + extra,
        });
      });
    }

    state.expedition.lootBuffer = {
      spiritStones: 0,
      bogIron: 0,
      bloodMoss: 0,
      spiderCarapace: 0,
    };
    appendExpeditionLog(
      '[Трофеи собраны] Казна и Склад (90%): +' +
        sectStonesGain +
        ' камней, +' +
        ironSplit.sect +
        ' железа, +' +
        mossSplit.sect +
        ' мха, +' +
        carapaceSplit.sect +
        ' панцирей. В мошну отряда (10%): +' +
        totalDisciplePurseGain +
        ' камней.'
    );

    soundFX.playCoin();
    addChronicle(
      'ECONOMY',
      'Разделение добычи похода (90% / 10%)',
      'На Склад Секты поступило: +' +
        sectStonesGain +
        ' камней, +' +
        ironSplit.sect +
        ' болотного железа, +' +
        mossSplit.sect +
        ' кровавого мха, +' +
        carapaceSplit.sect +
        ' панцирей. В личные мошны учеников передано +' +
        totalDisciplePurseGain +
        ' камней.'
    );

    persistState();
    renderApp();
  }

  /**
   * Отображает атмосферный титул текущего порога Сердца Дао без раскрытия чисел.
   */
  function getDaoHeartLabel(daoHeart) {
    if (i18n && typeof i18n.getDaoHeartLabel === 'function') {
      return i18n.getDaoHeartLabel(daoHeart);
    }
    if (math && typeof math.getDaoHeartLabel === 'function') {
      return math.getDaoHeartLabel(daoHeart);
    }
    const st = math.getDaoHeartState(
      typeof daoHeart === 'object' ? daoHeart : { daoHeart: daoHeart }
    );
    return st.name;
  }

  /**
   * Изменение состояния Сердца Дао (строго без вывода чисел в лог или интерфейс)
   * с учётом характера, проверки Точки Невозврата (<= -80 -> Тёмный Корень)
   * и генерацией атмосферных записей для всех значимых сдвигов и смен ступени.
   */
  function adjustDaoHeart(disciple, rawDelta, reasonContext) {
    if (!disciple) return disciple;
    const currentVal =
      typeof disciple.daoHeart === 'number' && !isNaN(disciple.daoHeart)
        ? disciple.daoHeart
        : 0;
    const prevLabel = getDaoHeartLabel(currentVal);

    let delta = rawDelta;
    const calmedByTemperament =
      delta < 0 &&
      (disciple.temperament === 'STOIC' ||
        disciple.temperament === 'CALM' ||
        disciple.temperament === 'NORMAL');
    if (
      delta < 0 &&
      (disciple.temperament === 'STOIC' || disciple.temperament === 'CALM')
    ) {
      delta = delta * 0.5;
    }
    let nextVal = Math.max(-100, Math.min(100, Math.round(currentVal + delta)));
    let justAwakenedDemon = false;

    if (nextVal <= -80 && !disciple.isDemonAwakened) {
      justAwakenedDemon = true;
      disciple.isDemonAwakened = true;
      const darkRoots = math.DARK_SPIRIT_ROOTS || [];
      if (
        darkRoots.length > 0 &&
        (!disciple.spiritRoot || !disciple.spiritRoot.isDarkRoot)
      ) {
        const chosenDark = math.pickRandom(darkRoots);
        disciple.spiritRoot = Object.assign({}, chosenDark);
      }
      const rootTitle =
        disciple.spiritRoot && disciple.spiritRoot.name
          ? disciple.spiritRoot.name
          : 'Тёмный Корень';
      const nextDemonLabel = getDaoHeartLabel(nextVal);
      const demonMsg =
        'Тьма поглотила разум! ' +
        disciple.name +
        ' отвергает праведный путь, пробуждает Тёмный Корень («' +
        rootTitle +
        '») и нисходит на ступень «' +
        nextDemonLabel +
        '»!';
      appendExpeditionLog('【ДЕМОН СЕРДЦА】 ' + demonMsg);
      addChronicle(
        'BREAKTHROUGH',
        'Пробуждение Демона Сердца: ' + disciple.name,
        demonMsg + (reasonContext ? ' Причина падения: ' + reasonContext + '.' : '')
      );
      soundFX.playDefeat();
    }

    if (disciple.isDemonAwakened && nextVal > 0) {
      nextVal = 0;
      if (rawDelta >= 5 && currentVal === 0) {
        const sealMsg =
          'Печать Тёмного Корня не пускает дух ' +
          disciple.name +
          ' к Свету Небес (' +
          (reasonContext || 'попытка очищения') +
          ') — весы застыли на ступени «' +
          getDaoHeartLabel(0) +
          '».';
        appendExpeditionLog('【СЕРДЦЕ ДАО】 ' + sealMsg);
        addChronicle(
          'SECT',
          'Печать Тёмного Корня: ' + disciple.name,
          sealMsg
        );
      }
    }

    disciple.daoHeart = nextVal;
    const actualDelta = nextVal - currentVal;
    const nextLabel = getDaoHeartLabel(nextVal);
    const tierChanged = prevLabel !== nextLabel;
    const isMajorShift = Math.abs(rawDelta) >= 5 || Math.abs(actualDelta) >= 5;

    if (!justAwakenedDemon && actualDelta !== 0 && (tierChanged || isMajorShift)) {
      const contextText = reasonContext || 'испытание на пути культивации';
      const stoicNote =
        calmedByTemperament && actualDelta < 0
          ? ' (несгибаемый нрав смягчил удар по духу)'
          : '';

      if (tierChanged) {
        if (actualDelta > 0) {
          const ascendMsg =
            'Дух ' +
            disciple.name +
            ' просветляется (' +
            contextText +
            '): достигнута ступень «' +
            nextLabel +
            '» (прежде: «' +
            prevLabel +
            '»)!';
          appendExpeditionLog('✦ 【СЕРДЦЕ ДАО】 ' + ascendMsg);
          addChronicle(
            'BREAKTHROUGH',
            'Возвышение Сердца Дао: ' + disciple.name,
            ascendMsg
          );
        } else {
          const descendMsg =
            'Тень сомнений сгущается в душе ' +
            disciple.name +
            ' (' +
            contextText +
            '): состояние духа опускается со ступени «' +
            prevLabel +
            '» до «' +
            nextLabel +
            '»!' +
            stoicNote;
          appendExpeditionLog('【СЕРДЦЕ ДАО】 ' + descendMsg);
          addChronicle(
            'SECT',
            'Помрачение Сердца Дао: ' + disciple.name,
            descendMsg
          );
        }
      } else if (isMajorShift) {
        if (actualDelta > 0) {
          const majorUpMsg =
            disciple.name +
            ' укрепляет внутренний стержень (' +
            contextText +
            ') — ступень духа: «' +
            nextLabel +
            '».';
          appendExpeditionLog('✦ 【СЕРДЦЕ ДАО】 ' + majorUpMsg);
          addChronicle(
            'BREAKTHROUGH',
            'Укрепление Сердца Дао: ' + disciple.name,
            majorUpMsg
          );
        } else {
          const majorDownMsg =
            'Внутреннее равновесие ' +
            disciple.name +
            ' пошатнулось (' +
            contextText +
            ') — ступень духа: «' +
            nextLabel +
            '».' +
            stoicNote;
          appendExpeditionLog('【СЕРДЦЕ ДАО】 ' + majorDownMsg);
          addChronicle(
            'SECT',
            'Колебание Сердца Дао: ' + disciple.name,
            majorDownMsg
          );
        }
      }
    }

    return disciple;
  }

  function emergencyRetreat(isAutoTalisman, autoReasonText) {
    if (!state.expedition.active) return;

    const injuredNames = [];
    const blockedNames = [];

    // Проверяем, погиб ли кто-то из боевых товарищей в момент эвакуации или в ходе похода (isDead === true)
    const fallenRunList = Array.isArray(state.expedition.fallenInCurrentRun)
      ? state.expedition.fallenInCurrentRun
      : [];
    const deadInRoster = state.disciples.filter(function (d) {
      return d.isDead === true || (d.status === 'EXPEDITION' && d.stats && d.stats.hp <= 0);
    });
    const hasDeadComrade =
      fallenRunList.some(function (f) {
        return f && f.isDead === true && !f.shockApplied;
      }) || deadInRoster.length > 0;

    state.disciples = state.disciples
      .filter(function (d) {
        return !d.isDead;
      })
      .map(function (d) {
        if (d.status !== 'EXPEDITION') return d;
        const eff = math.calculateEffectiveStats(d);
        const hpRatio = eff.maxHp > 0 ? eff.hp / eff.maxHp : 1;

        // В штатном режиме тактического отхода по «Талисману Возврата» (напр. 40% или 50% ОЗ)
        // ученики защищены печатью переноса; стихийные травмы возможны только при критическом ранении (< 15% ОЗ) или ручном бегстве (< 40% ОЗ)
        let newInjuries = d.injuries;
        const injuryThreshold = isAutoTalisman ? 0.15 : 0.4;
        if (hpRatio < injuryThreshold) {
          const riskBonus = math.TEMPERAMENT_INFO[d.temperament].injuryRiskBonus;
          if (Math.random() < 0.85 + riskBonus) {
            newInjuries = Math.min(5, d.injuries + 1);
            injuredNames.push(d.name + ' (' + newInjuries + '/5)');
            if (newInjuries >= 5) {
              blockedNames.push(d.name);
            }
          }
        }

        const updated = Object.assign({}, d, {
          status: 'IDLE',
          injuries: newInjuries,
          hadHardFightInBattle: false,
          secondWindUsedInBattle: false,
          qiShield: eff.maxQiShield,
          maxQiShield: eff.maxQiShield,
          stats: Object.assign({}, d.stats, {
            qiShield: eff.maxQiShield,
            maxQiShield: eff.maxQiShield,
          }),
        });

        // 1. Безопасный тактический отход по «Талисману Возврата» НЕ меняет daoHeart,
        // если бой шёл в штатном режиме (нет погибших товарищей и здоровье не пробито ниже критических 15% ОЗ).
        // 2. Сдвиг Сердца Дао происходит ТОЛЬКО при соблюдении честных условий ментального шока:
        // Условие А: Гибель товарища (isDead === true), если шок ещё не был применён в момент удара
        if (hasDeadComrade) {
          const fallenNames = fallenRunList
            .map(function (f) {
              return f.name;
            })
            .concat(
              deadInRoster.map(function (fd) {
                return fd.name;
              })
            )
            .filter(Boolean)
            .join(', ');
          const deathShockShift =
            updated.temperament === 'RIGHTEOUS' ||
            updated.temperament === 'COWARDLY'
              ? -45
              : -25;
          const deathReason =
            updated.temperament === 'RIGHTEOUS'
              ? 'Праведная скорбь и гнев из-за гибели соратника (' +
                (fallenNames || 'боевого товарища') +
                ')'
              : updated.temperament === 'COWARDLY'
              ? 'Леденящий ужас от гибели соратника (' +
                (fallenNames || 'боевого товарища') +
                ')'
              : 'Тяжёлая утрата павшего в походе соратника (' +
                (fallenNames || 'боевого товарища') +
                ')';
          adjustDaoHeart(updated, deathShockShift, deathReason);
        }

        // Условие Б: Критический порог («На волосок от смерти», < 15% ОЗ в момент срабатывания эвакуации)
        // Если ученик ещё не получил сдвиг за падение < 15% ОЗ в текущем раунде боя
        if (hpRatio > 0 && hpRatio < 0.15 && !d.hadHardFightInBattle) {
          const daoStateNow = math.getDaoHeartState(updated);
          if (updated.temperament === 'RECKLESS') {
            adjustDaoHeart(
              updated,
              5,
              'Взглянув смерти в лицо на краю гибели (< 15% ОЗ), безрассудный нрав ловит боевой кураж'
            );
          } else {
            const isCowardPanicking =
              updated.temperament === 'COWARDLY' && !daoStateNow.fearSuppressed;
            const nearDeathShift = isCowardPanicking ? -20 : -10;
            adjustDaoHeart(
              updated,
              nearDeathShift,
              isCowardPanicking
                ? 'Панический ужас при экстренной эвакуации на волосок от смерти (< 15% ОЗ)'
                : 'Ментальный шок: эвакуация на волосок от смерти (< 15% ОЗ)'
            );
          }
        }

        return math.syncDiscipleHp(updated, false);
      });

    state.expedition.active = false;
    state.expedition.expeditionPhase = 'MARCHING';
    state.expedition.marchingTicksLeft = 3;
    state.expedition.marchingTotalTicks = 3;
    state.expedition.enemies = [];
    state.expedition.fallenInCurrentRun = [];

    if (isAutoTalisman) {
      appendExpeditionLog(
        '✦ 【ТАЛИСМАН ВОЗВРАТА】 ' +
          (autoReasonText || 'Сработал порог безопасности ОЗ!') +
          ' Тактический отход по воле Главы Секты: печать пространственного переноса безопасно вернула отряд в Обитель без вреда для Сердца Дао.' +
          (injuredNames.length > 0
            ? ' Из-за критического пробития (< 15% ОЗ) получены стихийные травмы: ' +
              injuredNames.join(', ') +
              '.'
            : ' Отход прошёл штатно и без повреждения меридианов.')
      );
      addChronicle(
        'COMBAT',
        'Тактический отход («Талисман Возврата»)',
        (autoReasonText ? autoReasonText + ' ' : '') +
          (injuredNames.length > 0
            ? 'Из-за критического ранения (< 15% ОЗ) получены стихийные травмы: ' +
              injuredNames.join(', ') +
              '.' +
              (blockedNames.length > 0
                ? ' У ' +
                  blockedNames.join(', ') +
                  ' накоплено 5/5 травм — естественный отдых заблокирован до приёма Отвара Очищения!'
                : '')
            : 'Защитный талисман вовремя вернул отряд в Обитель. Штатная эвакуация сохранила душевное равновесие учеников.')
      );
    } else {
      appendExpeditionLog(
        '[Отступление в Обитель] Отряд организованно покинул Разлом по приказу Главы Секты.' +
          (injuredNames.length > 0
            ? ' Получены стихийные травмы (здоровье < 40%): ' +
              injuredNames.join(', ') +
              '.'
            : ' Отход прошёл без повреждения меридианов.')
      );
      addChronicle(
        'COMBAT',
        'Отступление отряда в Обитель',
        injuredNames.length > 0
          ? 'Отряд отступил из Разлома. Из-за тяжёлых ранений (здоровье ниже 40%) получены стихийные травмы: ' +
              injuredNames.join(', ') +
              '.' +
              (blockedNames.length > 0
                ? ' У ' +
                  blockedNames.join(', ') +
                  ' накоплено 5/5 травм — естественный отдых заблокирован до приёма Отвара Очищения!'
                : '')
          : 'Отряд организованно вернулся в Обитель без новых травм и потрясений.'
      );
    }

    persistState();
    renderApp();
  }

  function findAutoRetreatCandidate(disciplesList) {
    const thresholdPct = Number(state.expedition.autoRetreatThreshold) || 0;
    if (thresholdPct <= 0) return null;
    const thresholdRatio = thresholdPct / 100;
    for (let i = 0; i < disciplesList.length; i++) {
      const d = disciplesList[i];
      if (d.lineupSlot === null || d.status !== 'EXPEDITION') continue;
      const eff = math.calculateEffectiveStats(d);
      if (eff.hp > 0 && eff.maxHp > 0 && eff.hp / eff.maxHp <= thresholdRatio) {
        return {
          disciple: d,
          hpPct: Math.max(1, Math.round((eff.hp / eff.maxHp) * 100)),
          thresholdPct: thresholdPct,
        };
      }
    }
    return null;
  }

  // ==========================================================================
  // ПОШАГОВЫЙ АВТО-БОЙ (ФАЗЫ MARCHING / COMBAT, ЩИТ ЦИ) И ТИК ОБИТЕЛИ
  // ==========================================================================

  function enterMarchingPhase(logMessage) {
    const marchDuration = math.randomInt(3, 4);
    state.expedition.expeditionPhase = 'MARCHING';
    state.expedition.marchingTotalTicks = marchDuration;
    state.expedition.marchingTicksLeft = marchDuration;
    state.expedition.combatRound = 0;
    state.expedition.enemies = [];
    if (logMessage) {
      appendExpeditionLog(logMessage);
    }
  }

  function startCombatEncounter() {
    const stage = state.expedition.depthStage;
    const wave = state.expedition.waveInStage;
    const spawnedEnemies = math.spawnKarstRiftEnemies(stage, wave);

    // Перед началом схватки сбрасываем одноразовые боевые флаги схватки
    state.disciples = state.disciples.map(function (d) {
      if (d.status !== 'EXPEDITION') return d;
      const eff = math.calculateEffectiveStats(d);
      return Object.assign({}, d, {
        secondWindUsedInBattle: false,
        hadHardFightInBattle: false,
        qiShield: eff.qiShield,
        maxQiShield: eff.maxQiShield,
        stats: Object.assign({}, d.stats, {
          qiShield: eff.qiShield,
          maxQiShield: eff.maxQiShield,
        }),
      });
    });

    state.expedition.expeditionPhase = 'COMBAT';
    state.expedition.combatRound = 1;
    state.expedition.enemies = spawnedEnemies;
    appendExpeditionLog(
      '[Ярус ' +
        stage +
        ' · Волна ' +
        wave +
        '/3] На тропе обнаружены враги: ' +
        spawnedEnemies
          .map(function (e) {
            return e.name;
          })
          .join(', ') +
        '!'
    );
  }

  function executeMarchingPhaseTick(squad) {
    const preMarchCandidate = findAutoRetreatCandidate(state.disciples);
    if (preMarchCandidate) {
      emergencyRetreat(
        true,
        'У бойца ' +
          preMarchCandidate.disciple.name +
          ' осталось ' +
          preMarchCandidate.hpPct +
          '% ОЗ (порог талисмана ≤ ' +
          preMarchCandidate.thresholdPct +
          '%).'
      );
      return;
    }

    // На тропе культиваторы Т2+ восстанавливают Личный Щит Ци (+35% от максимума за тик)
    state.disciples = state.disciples.map(function (d) {
      if (d.status !== 'EXPEDITION') return d;
      const eff = math.calculateEffectiveStats(d);
      if (eff.maxQiShield <= 0) {
        return Object.assign({}, d, {
          qiShield: 0,
          maxQiShield: 0,
          stats: Object.assign({}, d.stats, {
            qiShield: 0,
            maxQiShield: 0,
          }),
        });
      }
      const daoState = math.getDaoHeartState(d);
      const qiBonusMult = 1 + (daoState.healAndQiBonus || 0);
      const regenShield = Math.max(
        1,
        Math.round(eff.maxQiShield * 0.35 * qiBonusMult)
      );
      const nextShield = Math.min(eff.maxQiShield, eff.qiShield + regenShield);
      return Object.assign({}, d, {
        qiShield: nextShield,
        maxQiShield: eff.maxQiShield,
        stats: Object.assign({}, d.stats, {
          qiShield: nextShield,
          maxQiShield: eff.maxQiShield,
        }),
      });
    });

    const totalTicks = state.expedition.marchingTotalTicks || 3;
    const nextTicksLeft = Math.max(0, (state.expedition.marchingTicksLeft || 3) - 1);
    state.expedition.marchingTicksLeft = nextTicksLeft;

    if (nextTicksLeft > 0) {
      const currentStep = totalTicks - nextTicksLeft;
      appendExpeditionLog(
        '[Тропа · Шаг ' +
          currentStep +
          '/' +
          totalTicks +
          '] Отряд продвигается по тропе Карстового Разлома (Ярус ' +
          state.expedition.depthStage +
          ')...'
      );
      return;
    }

    // В конце фазы MARCHING: бросок события (75% бой, 25% мирная находка на тропе)
    if (Math.random() < 0.75) {
      startCombatEncounter();
    } else {
      const greedyMult = Math.max.apply(
        null,
        squad.map(function (d) {
          return math.TEMPERAMENT_INFO[d.temperament].lootBonusMultiplier;
        })
      );
      const discovery = math.rollTrailDiscovery(
        state.expedition.depthStage,
        greedyMult
      );
      state.expedition.lootBuffer[discovery.resourceKey] =
        (state.expedition.lootBuffer[discovery.resourceKey] || 0) + discovery.amount;
      state.expedition.lootBuffer.spiritStones += discovery.spiritStones;
      soundFX.playCoin();

      enterMarchingPhase(
        '[Находка на тропе] ' +
          discovery.flavor +
          '! В буфер добычи добавлено: +' +
          discovery.amount +
          ' (' +
          discovery.resourceName +
          ') и +' +
          discovery.spiritStones +
          ' духовных камней. Отряд продолжает путь по тропе...'
      );
    }
  }

  function executeCombatStep() {
    if (!state.expedition.active || state.expedition.isPaused) return;

    const squad = getSquadInLineupOrder().filter(function (d) {
      return d.status === 'EXPEDITION';
    });
    if (squad.length === 0) {
      state.expedition.active = false;
      state.expedition.expeditionPhase = 'MARCHING';
      state.expedition.enemies = [];
      return;
    }

    if (state.expedition.expeditionPhase !== 'COMBAT') {
      executeMarchingPhaseTick(squad);
      return;
    }

    const hadDefeatedWave =
      state.expedition.enemies.length === 0 ||
      state.expedition.enemies.every(function (e) {
        return e.stats.hp <= 0;
      });

    if (hadDefeatedWave) {
      enterMarchingPhase(
        '[Тропа] Поле боя зачищено. Отряд продвигается по тропе дальше...'
      );
      return;
    }

    const currentEnemies = state.expedition.enemies.map(function (e) {
      return Object.assign({}, e, { stats: Object.assign({}, e.stats) });
    });

    const roundTag = '[Раунд ' + state.expedition.combatRound + ']';
    let updatedDisciples = state.disciples.map(function (d) {
      return math.syncDiscipleHp(d, false);
    });
    const newlyFallen = [];
    const recoveredGearToWarehouse = [];

    const sortedSquad = squad.slice().sort(function (a, b) {
      return (
        math.calculateEffectiveStats(b).spd -
        math.calculateEffectiveStats(a).spd
      );
    });

    for (let i = 0; i < sortedSquad.length; i++) {
      const member =
        updatedDisciples.find(function (d) {
          return d.id === sortedSquad[i].id;
        }) || sortedSquad[i];
      if (!member || member.stats.hp <= 0) continue;
      const aliveEnemies = currentEnemies.filter(function (e) {
        return e.stats.hp > 0;
      });
      if (aliveEnemies.length === 0) break;

      const targetEnemy = aliveEnemies[0];
      const eff = math.calculateEffectiveStats(member);
      const archInfo = math.ARCHETYPE_INFO[member.archetype];
      const isMagical =
        archInfo.attackType === 'MAGICAL' || eff.mAtk > eff.pAtk + 3;

      const atkVal = isMagical ? eff.mAtk : eff.pAtk;
      const defVal = isMagical ? targetEnemy.stats.mDef : targetEnemy.stats.pDef;

      const result = math.computeCombatDamage(
        atkVal,
        defVal,
        eff.crit,
        targetEnemy.stats.eva
      );
      if (result.isEvaded) {
        appendExpeditionLog(
          roundTag +
            ' ' +
            member.name +
            ' атакует, но ' +
            targetEnemy.name +
            ' уклоняется от выпада.'
        );
      } else {
        targetEnemy.stats.hp = Math.max(0, targetEnemy.stats.hp - result.damage);
        soundFX.playHit(result.isCrit);
        appendExpeditionLog(
          roundTag +
            ' ' +
            member.name +
            ' наносит ' +
            result.damage +
            ' ед. ' +
            (isMagical ? 'духовного' : 'физического') +
            ' урона по «' +
            targetEnemy.name +
            '»' +
            (result.isCrit ? ' (критический удар!)' : '') +
            ' — здоровье врага: ' +
            targetEnemy.stats.hp +
            '/' +
            targetEnemy.stats.maxHp +
            '.'
        );

        if (targetEnemy.stats.hp <= 0) {
          appendExpeditionLog(
            roundTag + ' ⚔ Противник «' + targetEnemy.name + '» повержен!'
          );
          updatedDisciples = updatedDisciples.map(function (d) {
            return d.id === member.id
              ? Object.assign({}, d, { kills: d.kills + 1 })
              : d;
          });
        }

        // Эффекты Дьявольского пути при атаке: Вампиризм и Побочный эффект Тьмы (высасывание ОЗ союзника)
        const attackerNow = updatedDisciples.find(function (d) {
          return d.id === member.id;
        });
        if (attackerNow && attackerNow.stats.hp > 0) {
          const attackerDao = math.getDaoHeartState(attackerNow);
          const attackerEff = math.calculateEffectiveStats(attackerNow);
          let attackerHp = attackerEff.hp;

          if (attackerDao.lifesteal > 0 && attackerHp < attackerEff.maxHp) {
            const vampHeal = Math.max(
              1,
              Math.round(result.damage * attackerDao.lifesteal)
            );
            attackerHp = Math.min(attackerEff.maxHp, attackerHp + vampHeal);
            updatedDisciples = updatedDisciples.map(function (d) {
              return d.id === attackerNow.id
                ? Object.assign({}, d, {
                    stats: Object.assign({}, d.stats, { hp: attackerHp }),
                  })
                : d;
            });
          }

          if (
            attackerDao.allyDrainChance > 0 &&
            attackerHp / attackerEff.maxHp < 0.5 &&
            Math.random() < attackerDao.allyDrainChance
          ) {
            const livingAllies = updatedDisciples.filter(function (d) {
              return (
                d.lineupSlot !== null &&
                d.status === 'EXPEDITION' &&
                d.id !== attackerNow.id &&
                d.stats.hp > 1
              );
            });
            if (livingAllies.length > 0) {
              const victimAlly = math.pickRandom(livingAllies);
              const victimEff = math.calculateEffectiveStats(victimAlly);
              const drainDmg = Math.max(1, Math.round(victimEff.maxHp * 0.05));
              const selfHeal = Math.max(1, Math.round(attackerEff.maxHp * 0.1));
              const nextVictimHp = Math.max(1, victimEff.hp - drainDmg);
              const nextAttackerHp = Math.min(
                attackerEff.maxHp,
                attackerHp + selfHeal
              );

              updatedDisciples = updatedDisciples.map(function (d) {
                if (d.id === victimAlly.id) {
                  return Object.assign({}, d, {
                    stats: Object.assign({}, d.stats, { hp: nextVictimHp }),
                  });
                }
                if (d.id === attackerNow.id) {
                  return Object.assign({}, d, {
                    stats: Object.assign({}, d.stats, { hp: nextAttackerHp }),
                  });
                }
                return d;
              });

              appendExpeditionLog(
                roundTag +
                  ' 【ДЕМОН СЕРДЦА】 В приступе кровавой одержимости ' +
                  attackerNow.name +
                  ' вытягивает жизненную Ци из соратника (' +
                  victimAlly.name +
                  '), залечивая собственные раны!'
              );
            }
          }
        }
      }
    }

    const survivingEnemies = currentEnemies.filter(function (e) {
      return e.stats.hp > 0;
    });

    for (let j = 0; j < survivingEnemies.length; j++) {
      const enemy = survivingEnemies[j];
      const aliveSquadNow = updatedDisciples
        .filter(function (d) {
          return (
            d.lineupSlot !== null &&
            d.status === 'EXPEDITION' &&
            d.stats.hp > 0
          );
        })
        .sort(function (a, b) {
          return a.lineupSlot - b.lineupSlot;
        });

      if (aliveSquadNow.length === 0) break;

      const targetDisciple = math.selectLineupTarget(aliveSquadNow);
      const targetEff = math.calculateEffectiveStats(targetDisciple);
      const isEnemyMag = enemy.damageType === 'MAGICAL';
      const eAtk = isEnemyMag ? enemy.stats.mAtk : enemy.stats.pAtk;
      const dDef = isEnemyMag ? targetEff.mDef : targetEff.pDef;

      const hit = math.computeCombatDamage(
        eAtk,
        dDef,
        enemy.stats.crit,
        targetEff.eva
      );
      const posLabel = 'Позиция ' + ((targetDisciple.lineupSlot || 0) + 1);

      if (hit.isEvaded) {
        appendExpeditionLog(
          roundTag +
            ' ' +
            enemy.name +
            ' атакует (' +
            posLabel +
            ': ' +
            targetDisciple.name +
            '), но ученик уходит от удара!'
        );
      } else {
        // Поглощение урона Личным Щитом Ци (qiShield) перед вычитанием здоровья
        const currentShield = targetEff.qiShield;
        const shieldAbsorbed = Math.min(currentShield, hit.damage);
        const newShield = Math.max(0, currentShield - shieldAbsorbed);
        const hpDamage = Math.max(0, hit.damage - shieldAbsorbed);
        let newHp = Math.max(0, targetEff.hp - hpDamage);

        if (shieldAbsorbed > 0 && hpDamage === 0) {
          appendExpeditionLog(
            roundTag +
              ' ' +
              enemy.name +
              ' бьёт по ' +
              targetDisciple.name +
              ' (' +
              posLabel +
              '): Личный Щит Ци поглотил ' +
              shieldAbsorbed +
              ' ур.' +
              (hit.isCrit ? ' (крит!)' : '') +
              ' — Щит Ци: ' +
              newShield +
              '/' +
              targetEff.maxQiShield +
              '.'
          );
        } else if (shieldAbsorbed > 0 && hpDamage > 0) {
          appendExpeditionLog(
            roundTag +
              ' ' +
              enemy.name +
              ' пробивает Щит Ци ' +
              targetDisciple.name +
              ' (-' +
              shieldAbsorbed +
              ' щита) и наносит -' +
              hpDamage +
              ' здоровья' +
              (hit.isCrit ? ' (критический урон!)' : '') +
              ' — здоровье: ' +
              newHp +
              '/' +
              targetEff.maxHp +
              '.'
          );
        } else {
          appendExpeditionLog(
            roundTag +
              ' ' +
              enemy.name +
              ' бьёт по ' +
              targetDisciple.name +
              ' (' +
              posLabel +
              '): -' +
              hpDamage +
              ' здоровья' +
              (hit.isCrit ? ' (критический урон!)' : '') +
              ' — остаток: ' +
              newHp +
              '/' +
              targetEff.maxHp +
              '.'
          );
        }

        // Проверка пассивки «Второе дыхание» при Алмазном Сердце Дао (+80 .. +100):
        // 1 раз за бой при падении hp / maxHp < 0.20 мгновенно восстанавливает 50% от maxQiShield
        const targetDaoState = math.getDaoHeartState(targetDisciple);
        let usedSecondWind = Boolean(targetDisciple.secondWindUsedInBattle);
        if (
          targetDaoState.secondWind &&
          !usedSecondWind &&
          newHp > 0 &&
          newHp / targetEff.maxHp < 0.2
        ) {
          usedSecondWind = true;
          soundFX.playChime();
          if (targetEff.maxQiShield > 0) {
            const shieldRestored = Math.max(
              1,
              Math.floor(targetEff.maxQiShield * 0.5)
            );
            newShield = Math.min(
              targetEff.maxQiShield,
              newShield + shieldRestored
            );
            appendExpeditionLog(
              roundTag +
                ' ✦ 【СЕРДЦЕ ДАО】 Алмазное Сердце Дао! ' +
                targetDisciple.name +
                ' обретает «Второе дыхание» (ОЗ < 20%) и мгновенно восстанавливает 50% Личного Щита Ци (+' +
                shieldRestored +
                ' щита → ' +
                newShield +
                '/' +
                targetEff.maxQiShield +
                ')!'
            );
          } else {
            const fallbackHeal = Math.max(1, Math.floor(targetEff.maxHp * 0.25));
            newHp = Math.min(targetEff.maxHp, newHp + fallbackHeal);
            appendExpeditionLog(
              roundTag +
                ' ✦ 【СЕРДЦЕ ДАО】 Алмазное Сердце Дао! ' +
                targetDisciple.name +
                ' обретает «Второе дыхание» (ОЗ < 20%) и укрепляет жизненные меридианы!'
            );
          }
        }

        const hpRatioAfter = newHp / targetEff.maxHp;

        if (newHp <= 0) {
          const otherSurvivors = aliveSquadNow.filter(function (d) {
            return d.id !== targetDisciple.id;
          });
          const gearNames = [];
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

          const fallenRecord = {
            id: targetDisciple.id,
            name: targetDisciple.name,
            isDead: true,
            shockApplied: true,
            realmLabel: math.getRealmLabel(
              targetDisciple.realmTier,
              targetDisciple.subLevel
            ),
            archetypeLabel: math.ARCHETYPE_INFO[targetDisciple.archetype].name,
            causeOfDeath:
              'Пал в бою с «' +
              enemy.name +
              '» (Карстовый Разлом, Ярус ' +
              state.expedition.depthStage +
              ')',
            recoveredGearNames: gearNames,
            time: getTimeStr(),
          };
          newlyFallen.push(fallenRecord);
          if (!Array.isArray(state.expedition.fallenInCurrentRun)) {
            state.expedition.fallenInCurrentRun = [];
          }
          state.expedition.fallenInCurrentRun.push(fallenRecord);

          appendExpeditionLog(
            roundTag +
              ' ☠ ГИБЕЛЬ В БОЮ: ' +
              targetDisciple.name +
              ' пал смертью храбрых! Сердца выживших соратников содрогнулись от горя. ' +
              (gearNames.length > 0
                ? 'Соратники сохранили его снаряжение (' +
                  gearNames.join(', ') +
                  ') и передали на склад.'
                : '')
          );

          addChronicle(
            'DEATH',
            'Гибель ученика: ' + targetDisciple.name,
            'Пал в Карстовом Разломе от удара «' +
              enemy.name +
              '». ' +
              (gearNames.length > 0
                ? 'Выжившие товарищи вернули экипировку на Склад Секты: ' +
                  gearNames.join(', ') +
                  '.'
                : 'Снаряжения при себе не было или отряд полностью разбит.')
          );

          updatedDisciples = updatedDisciples
            .filter(function (d) {
              return d.id !== targetDisciple.id;
            })
            .map(function (surv) {
              if (surv.lineupSlot === null || surv.status !== 'EXPEDITION') {
                return surv;
              }
              const copySurv = Object.assign({}, surv);
              const deathShockShift =
                copySurv.temperament === 'RIGHTEOUS' ||
                copySurv.temperament === 'COWARDLY'
                  ? -45
                  : -25;
              const deathReason =
                copySurv.temperament === 'RIGHTEOUS'
                  ? 'Праведная скорбь и гнев из-за гибели соратника (' +
                    targetDisciple.name +
                    ')'
                  : copySurv.temperament === 'COWARDLY'
                  ? 'Леденящий ужас от гибели соратника (' +
                    targetDisciple.name +
                    ') на глазах отряда'
                  : 'Гибель соратника (' +
                    targetDisciple.name +
                    ') на глазах отряда';
              adjustDaoHeart(copySurv, deathShockShift, deathReason);
              return math.syncDiscipleHp(copySurv, false);
            });
        } else {
          updatedDisciples = updatedDisciples.map(function (d) {
            if (d.id !== targetDisciple.id) return d;
            const copyTarget = Object.assign({}, d, {
              secondWindUsedInBattle: usedSecondWind,
              qiShield: newShield,
              maxQiShield: targetEff.maxQiShield,
              stats: Object.assign({}, d.stats, {
                hp: newHp,
                qiShield: newShield,
                maxQiShield: targetEff.maxQiShield,
              }),
            });
            // Выживание на грани смерти (ОЗ < 15% в бою, один раз за схватку)
            if (hpRatioAfter < 0.15 && !copyTarget.hadHardFightInBattle) {
              copyTarget.hadHardFightInBattle = true;
              if (copyTarget.temperament === 'RECKLESS') {
                adjustDaoHeart(
                  copyTarget,
                  5,
                  'Взглянув смерти в лицо на краю гибели, безрассудный нрав ловит боевой кураж'
                );
              } else {
                const isCowardPanicking =
                  copyTarget.temperament === 'COWARDLY' &&
                  !targetDaoState.fearSuppressed;
                const nearDeathShift = isCowardPanicking ? -20 : -10;
                adjustDaoHeart(
                  copyTarget,
                  nearDeathShift,
                  isCowardPanicking
                    ? 'Панический ужас перед дыханием гибели на краю смерти'
                    : 'Дыхание бездны и тяжёлые раны на краю смерти'
                );
              }
            }
            return math.syncDiscipleHp(copyTarget, false);
          });

          // Проверка «Талисмана Возврата» сразу после удара врага, чтобы спасти раненого от добивания
          const hitAutoRetreat = findAutoRetreatCandidate(updatedDisciples);
          if (hitAutoRetreat) {
            if (recoveredGearToWarehouse.length > 0) {
              state.warehouseGear = state.warehouseGear.concat(
                recoveredGearToWarehouse
              );
            }
            if (newlyFallen.length > 0) {
              state.fallenMemorial = newlyFallen.concat(state.fallenMemorial);
            }
            state.disciples = updatedDisciples;
            emergencyRetreat(
              true,
              'Здоровье ' +
                hitAutoRetreat.disciple.name +
                ' упало до ' +
                hitAutoRetreat.hpPct +
                '% ОЗ (порог талисмана ≤ ' +
                hitAutoRetreat.thresholdPct +
                '%).'
            );
            return;
          }
        }
      }
    }

    if (recoveredGearToWarehouse.length > 0) {
      state.warehouseGear = state.warehouseGear.concat(recoveredGearToWarehouse);
    }
    if (newlyFallen.length > 0) {
      state.fallenMemorial = newlyFallen.concat(state.fallenMemorial);
    }

    const remainingSquad = updatedDisciples.filter(function (d) {
      return d.lineupSlot !== null && d.status === 'EXPEDITION';
    });

    if (remainingSquad.length === 0) {
      state.disciples = updatedDisciples;
      state.expedition.active = false;
      state.expedition.expeditionPhase = 'MARCHING';
      state.expedition.enemies = [];
      appendExpeditionLog('Весь отряд пал в Карстовом Разломе. Поход завершён.');
      return;
    }

    // Проверка «Талисмана Возврата» также на случай урона от темного союзника в фазе атаки
    const postRoundAutoRetreat = findAutoRetreatCandidate(updatedDisciples);
    if (postRoundAutoRetreat) {
      state.disciples = updatedDisciples;
      emergencyRetreat(
        true,
        'Здоровье ' +
          postRoundAutoRetreat.disciple.name +
          ' снизилось до ' +
          postRoundAutoRetreat.hpPct +
          '% ОЗ (порог талисмана ≤ ' +
          postRoundAutoRetreat.thresholdPct +
          '%).'
      );
      return;
    }

    const aliveEnemiesAfter = currentEnemies.filter(function (e) {
      return e.stats.hp > 0;
    });

    if (aliveEnemiesAfter.length === 0) {
      let addStones = 0;
      let addIron = 0;
      let addMoss = 0;
      let addCarapace = 0;
      let rawWaveExp = 0;
      const hadBossInWave = currentEnemies.some(function (en) {
        return Boolean(en.isBoss);
      });

      const greedyMult = Math.max.apply(
        null,
        remainingSquad.map(function (d) {
          return math.TEMPERAMENT_INFO[d.temperament].lootBonusMultiplier;
        })
      );

      for (let k = 0; k < currentEnemies.length; k++) {
        const defeated = currentEnemies[k];
        addStones += Math.round(
          math.randomInt(
            defeated.lootTable.spiritStones[0],
            defeated.lootTable.spiritStones[1]
          ) * greedyMult
        );
        addIron += Math.round(
          math.randomInt(
            defeated.lootTable.bogIron[0],
            defeated.lootTable.bogIron[1]
          ) * greedyMult
        );
        addMoss += Math.round(
          math.randomInt(
            defeated.lootTable.bloodMoss[0],
            defeated.lootTable.bloodMoss[1]
          ) * greedyMult
        );
        addCarapace += Math.round(
          math.randomInt(
            defeated.lootTable.spiderCarapace[0],
            defeated.lootTable.spiderCarapace[1]
          ) * greedyMult
        );
        rawWaveExp += defeated.expReward;
      }

      const perMemberBaseExp = Math.max(
        5,
        Math.round(rawWaveExp / Math.sqrt(remainingSquad.length))
      );

      const completedWave = state.expedition.waveInStage;
      const nextWave = completedWave >= 3 ? 1 : completedWave + 1;
      const nextStage =
        completedWave >= 3
          ? Math.min(5, state.expedition.depthStage + 1)
          : state.expedition.depthStage;

      updatedDisciples = updatedDisciples.map(function (d) {
        if (d.status !== 'EXPEDITION') return d;
        const copyMember = Object.assign({}, d, {
          secondWindUsedInBattle: false,
          hadHardFightInBattle: false,
        });
        if (hadBossInWave || completedWave === 3) {
          const bossWinShift = copyMember.temperament === 'PROUD' ? 10 : 5;
          adjustDaoHeart(
            copyMember,
            bossWinShift,
            'Триумф над Хозяином Яруса в Карстовом Разломе'
          );
        } else {
          adjustDaoHeart(copyMember, 1, 'Победа в схватке Карстового Разлома');
        }
        const gain = math.calculateExpGain(
          perMemberBaseExp,
          copyMember,
          state.sectLevel,
          true
        );
        copyMember.exp = Math.min(
          copyMember.maxExp,
          copyMember.exp + gain.finalExp
        );
        copyMember.expeditionsCompleted =
          copyMember.expeditionsCompleted + (completedWave === 3 ? 1 : 0);
        return math.syncDiscipleHp(copyMember, false);
      });

      appendExpeditionLog(
        '★ Волна ' +
          completedWave +
          '/3 зачищена! Трофеи в буфер: +' +
          addStones +
          ' камней, +' +
          addIron +
          ' железа, +' +
          addMoss +
          ' мха, +' +
          addCarapace +
          ' панцирей.'
      );

      state.disciples = updatedDisciples;
      state.expedition.expEarnedInRun += perMemberBaseExp;
      state.expedition.lootBuffer.spiritStones += addStones;
      state.expedition.lootBuffer.bogIron += addIron;
      state.expedition.lootBuffer.bloodMoss += addMoss;
      state.expedition.lootBuffer.spiderCarapace += addCarapace;

      state.expedition.depthStage = nextStage;
      state.expedition.waveInStage = nextWave;
      enterMarchingPhase(
        '[Тропа · Ярус ' +
          nextStage +
          ' · Волна ' +
          nextWave +
          '/3] Враги повержены. Отряд переводит дух и продвигается дальше по тропе...'
      );
    } else {
      state.disciples = updatedDisciples;
      state.expedition.combatRound += 1;
      state.expedition.enemies = currentEnemies;
    }
  }

  function executeSectIdleTick() {
    if (state.disciples.length === 0) return;

    const baseHeal = math.SECT_LEVELS[state.sectLevel].passiveHealRate;

    let nextDisciples = state.disciples.map(function (d) {
      const eff = math.calculateEffectiveStats(d);
      if (d.status !== 'IDLE') return math.syncDiscipleHp(d, false);
      const nextShield = eff.maxQiShield;
      if (d.injuries >= 5) {
        return math.syncDiscipleHp(
          Object.assign({}, d, { qiShield: nextShield }),
          false
        );
      }
      if (eff.hp >= eff.maxHp && eff.qiShield >= eff.maxQiShield) {
        return math.syncDiscipleHp(d, false);
      }

      const injurySlowdown = Math.max(0.2, 1 - d.injuries * 0.2);
      const healAmount = Math.max(1, Math.round(baseHeal * injurySlowdown));
      return Object.assign({}, d, {
        qiShield: nextShield,
        maxQiShield: eff.maxQiShield,
        stats: Object.assign({}, d.stats, {
          hp: Math.min(eff.maxHp, eff.hp + healAmount),
          qiShield: nextShield,
          maxQiShield: eff.maxQiShield,
        }),
      });
    });

    const candidates = nextDisciples.filter(function (d) {
      if (d.status !== 'IDLE') return false;
      const eff = math.calculateEffectiveStats(d);
      const needsMedical =
        (d.injuries > 0 || eff.hp < eff.maxHp * 0.85) && d.personalStones >= 5;
      const wantsTraining = d.personalStones >= 10 && d.exp < d.maxExp;
      return needsMedical || wantsTraining;
    });

    if (candidates.length > 0 && Math.random() < 0.25) {
      const buyer = math.pickRandom(candidates);
      const eff = math.calculateEffectiveStats(buyer);

      if (
        (buyer.injuries > 0 || eff.hp < eff.maxHp * 0.85) &&
        state.resources.bloodMoss >= 2 &&
        buyer.personalStones >= 5
      ) {
        const price = 5;
        state.resources.spiritStones += price;
        state.resources.bloodMoss = Math.max(0, state.resources.bloodMoss - 1);
        nextDisciples = nextDisciples.map(function (d) {
          return d.id === buyer.id
            ? Object.assign({}, d, {
                personalStones: d.personalStones - price,
                injuries: Math.max(0, d.injuries - 1),
                stats: Object.assign({}, d.stats, {
                  hp: Math.min(eff.maxHp, eff.hp + 30),
                }),
              })
            : d;
        });
        addChronicle(
          'ECONOMY',
          'Заказ у Алхимика: ' + buyer.name,
          buyer.name +
            ' приобрёл со Склада 1 ед. кровавого мха за ' +
            price +
            ' личных камней (в Казну Секты) и принял целебный настой (+30 здоровья, -1 травма).'
        );
      } else if (
        state.resources.bogIron >= 3 &&
        buyer.personalStones >= 10 &&
        buyer.exp < buyer.maxExp
      ) {
        const price = 6;
        state.resources.spiritStones += price;
        state.resources.bogIron = Math.max(0, state.resources.bogIron - 1);
        nextDisciples = nextDisciples.map(function (d) {
          return d.id === buyer.id
            ? Object.assign({}, d, {
                personalStones: d.personalStones - price,
                exp: Math.min(d.maxExp, d.exp + 6),
              })
            : d;
        });
        addChronicle(
          'ECONOMY',
          'Обмен со Складом: ' + buyer.name,
          buyer.name +
            ' выкупил со Склада 1 ед. болотного железа за ' +
            price +
            ' личных камней (в Казну Секты) для закалки оружия (+6 опыта).'
        );
      }
    }

    state.disciples = nextDisciples;
  }

  // ==========================================================================
  // ПРОРЫВ, РЕМЁСЛА, ЭКИПИРОВКА И ОБИТЕЛЬ
  // ==========================================================================

  function handleBreakthroughClick(discipleId) {
    const disciple = state.disciples.find(function (d) {
      return d.id === discipleId;
    });
    if (!disciple || disciple.exp < disciple.maxExp) return;

    if (disciple.subLevel < 5) {
      const nextSub = disciple.subLevel + 1;
      const nextMaxExp = math.SUBLEVEL_MAX_EXP[disciple.realmTier][nextSub];

      state.disciples = state.disciples.map(function (d) {
        if (d.id !== disciple.id) return d;
        const upgraded = Object.assign({}, d, {
          subLevel: nextSub,
          exp: 0,
          maxExp: nextMaxExp,
          stats: Object.assign({}, d.stats, {
            maxHp: d.stats.maxHp + 14,
            pAtk: d.stats.pAtk + 2,
            mAtk: d.stats.mAtk + 2,
            pDef: d.stats.pDef + 2,
            mDef: d.stats.mDef + 2,
            spd: d.stats.spd + 1,
          }),
        });
        adjustDaoHeart(
          upgraded,
          15,
          'Успешный прорыв на ' + nextSub + '-ю ступень царства'
        );
        return math.syncDiscipleHp(upgraded, true);
      });

      soundFX.playChime();
      addChronicle(
        'BREAKTHROUGH',
        'Прорыв ступени: ' + disciple.name,
        'Достигнута новая вершина: ' +
          math.getRealmLabel(disciple.realmTier, nextSub) +
          '. Здоровье полностью восстановлено, а Сердце Дао укрепилось!'
      );
      persistState();
      renderApp();
      return;
    }

    if (disciple.realmTier === 1 && disciple.subLevel === 5) {
      state.inspectedDiscipleId = null;
      state.breakthroughModalDiscipleId = disciple.id;
      state.usePillOnBreakthrough = state.consumables.breakthroughPills > 0;
      state.selectedT2Archetype = 'SWORDSMAN';
      renderApp();
    }
  }

  function confirmRealmT2Breakthrough() {
    const disc = state.disciples.find(function (d) {
      return d.id === state.breakthroughModalDiscipleId;
    });
    if (!disc) return;

    const consumingPill =
      state.usePillOnBreakthrough && state.consumables.breakthroughPills > 0;
    if (consumingPill) {
      state.consumables.breakthroughPills -= 1;
    }

    const res = math.getBreakthroughChance(disc, state.sectLevel, consumingPill);
    const roll = Math.random() * 100;

    if (roll <= res.chancePercent) {
      const archName = math.ARCHETYPE_INFO[state.selectedT2Archetype].name;
      state.disciples = state.disciples.map(function (d) {
        if (d.id !== disc.id) return d;
        const ascended = Object.assign({}, d, {
          realmTier: 2,
          subLevel: 1,
          archetype: state.selectedT2Archetype,
          exp: 0,
          maxExp: math.SUBLEVEL_MAX_EXP[2][1],
          stats: Object.assign({}, d.stats, {
            maxHp: d.stats.maxHp + 30,
            pAtk: d.stats.pAtk + 5,
            mAtk: d.stats.mAtk + 5,
            pDef: d.stats.pDef + 4,
            mDef: d.stats.mDef + 4,
          }),
        });
        adjustDaoHeart(
          ascended,
          15,
          'Возвышение в царство Возведения Основы'
        );
        return math.syncDiscipleHp(ascended, true);
      });
      soundFX.playChime();
      addChronicle(
        'BREAKTHROUGH',
        'Возвышение в царство Возведения Основы: ' + disc.name,
        disc.name +
          ' успешно преодолел испытание (шанс ' +
          res.chancePercent +
          '%), укрепил Сердце Дао и избрал боевой путь «' +
          archName +
          '»!'
      );
    } else {
      let fragileEgoHit = false;
      state.disciples = state.disciples.map(function (d) {
        if (d.id !== disc.id) return d;
        const eff = math.calculateEffectiveStats(d);
        const curDao = typeof d.daoHeart === 'number' ? d.daoHeart : 0;
        const holdsFirm =
          curDao >= 20 &&
          d.temperament !== 'PROUD' &&
          d.temperament !== 'GREEDY';
        fragileEgoHit = !holdsFirm;
        const distortionShift = holdsFirm ? -2 : -15;
        const failedDisc = Object.assign({}, d, {
          exp: Math.floor(d.maxExp * 0.5),
          injuries: Math.min(5, d.injuries + 1),
          stats: Object.assign({}, d.stats, {
            hp: Math.max(10, Math.floor(eff.hp * 0.6)),
          }),
        });
        adjustDaoHeart(
          failedDisc,
          distortionShift,
          'Искажение Ци при срыве прорыва во II царство'
        );
        return math.syncDiscipleHp(failedDisc, false);
      });
      addChronicle(
        'BREAKTHROUGH',
        'Срыв прорыва: ' + disc.name,
        'Из-за искажения Ци (шанс составлял ' +
          res.chancePercent +
          '%) прорыв сорвался. Меридианы повреждены (+1 травма, потеряна половина накопленного опыта). ' +
          (fragileEgoHit
            ? 'Удар по самолюбию и сомнения глубоко омрачили Сердце Дао!'
            : 'Светлое Сердце Дао и скромность помогли выдержать внутренний удар.')
      );
    }

    state.breakthroughModalDiscipleId = null;
    persistState();
    renderApp();
  }

  // ==========================================================================
  // МОДУЛЬ 01 GDD: «СТО РЕМЁСЕЛ КУЛЬТИВАЦИИ» (СТАНЦИИ, МАСТЕРА PAVILION_DUTY,
  // ТРИ ПОРОГА МАСТЕРСТВА И ПРОКАЧКА ТРУДОМ)
  // ==========================================================================

  function getStationMaster(stationId) {
    const station = state.craftStations[stationId];
    if (!station || !station.masterId) return null;
    const master = state.disciples.find(function (d) {
      return d.id === station.masterId && d.status === 'PAVILION_DUTY';
    });
    if (!master) {
      station.masterId = null;
      return null;
    }
    return master;
  }

  /**
   * 1. Назначение мастера на станцию крафта (FORGE | LOOM | CAULDRON | ALTAR | TABLE).
   * Переводит ученика в статус PAVILION_DUTY и выводит из походного строя (lineupSlot = null),
   * исключая одновременное нахождение в строю экспедиции (EXPEDITION).
   */
  function assignMasterToStation(stationId, discipleId) {
    const stationMeta = math.CRAFT_STATIONS[stationId];
    const station = state.craftStations[stationId];
    if (!stationMeta || !station) {
      return { ok: false, reason: 'Неизвестная ремесленная станция.' };
    }
    if (station.activeCraft) {
      return { ok: false, reason: 'Нельзя сменить мастера во время активного создания предмета.' };
    }

    if (!discipleId || station.masterId === discipleId) {
      return unassignMasterFromStation(stationId);
    }

    const target = state.disciples.find(function (d) {
      return d.id === discipleId;
    });
    if (!target) {
      return { ok: false, reason: 'Ученик не найден в списках секты.' };
    }
    if (target.status === 'EXPEDITION') {
      return {
        ok: false,
        reason: target.name + ' сейчас находится в боевом походе (EXPEDITION) и не может занять пост.',
      };
    }

    // Если ученик уже был мастером на другой станции — проверяем, не занята ли та станция крафтом
    if (target.assignedStation && state.craftStations[target.assignedStation]) {
      const prevSt = state.craftStations[target.assignedStation];
      if (prevSt.activeCraft) {
        return {
          ok: false,
          reason: target.name + ' ещё завершает работу на станции «' + math.CRAFT_STATIONS[target.assignedStation].name + '».',
        };
      }
      prevSt.masterId = null;
    }

    const prevMasterId = station.masterId;
    station.masterId = target.id;
    station.lastResultText =
      'Назначен мастер: ' +
      target.name +
      ' (Т' +
      target.realmTier +
      ' · ' +
      target.subLevel +
      '-я ст. · скорость 100%).';

    state.disciples = state.disciples.map(function (d) {
      if (d.id === target.id) {
        return Object.assign({}, d, {
          status: 'PAVILION_DUTY',
          assignedStation: stationId,
          lineupSlot: null, // Вывод из строя экспедиции
        });
      }
      if (prevMasterId && d.id === prevMasterId) {
        return Object.assign({}, d, {
          status: 'IDLE',
          assignedStation: null,
        });
      }
      return d;
    });

    soundFX.playClick();
    addChronicle(
      'CRAFT',
      stationMeta.name + ': назначен мастер ' + target.name,
      target.name +
        ' заступил на пост (' +
        stationMeta.profession +
        ', статус PAVILION_DUTY) и выведен из походного строя.'
    );
    persistState();
    renderApp();
    return { ok: true, master: target, stationId: stationId };
  }

  function unassignMasterFromStation(stationId) {
    const stationMeta = math.CRAFT_STATIONS[stationId];
    const station = state.craftStations[stationId];
    if (!stationMeta || !station) {
      return { ok: false, reason: 'Неизвестная станция.' };
    }
    if (station.activeCraft) {
      return { ok: false, reason: 'Дождитесь завершения текущего процесса на станции.' };
    }

    const prevMasterId = station.masterId;
    station.masterId = null;
    station.lastResultText =
      'Мастер снят с поста. Без мастера доступен только крафт Т1 со штрафом к скорости -50%.';

    if (prevMasterId) {
      state.disciples = state.disciples.map(function (d) {
        if (d.id !== prevMasterId) return d;
        return Object.assign({}, d, {
          status: 'IDLE',
          assignedStation: null,
        });
      });
    }

    soundFX.playClick();
    persistState();
    renderApp();
    return { ok: true, stationId: stationId };
  }

  /**
   * 2. Формула «Трёх Порогов Мастерства» (зависимость от тира мастера T_master и материала T_mat):
   * - Без мастера: доступен только Т1 со штрафом к скорости -50% (speedMultiplier = 0.5). Для Т2+ — 0% (заблокировано).
   * - Если T_master < T_mat - 1: крафт заблокирован (0%).
   * - Если T_master == T_mat - 1: шанс успеха 25%. При неудаче редкий материал сгорает. При успехе мастер получает EXP x3.
   * - Если T_master == T_mat: шанс успеха 50–60% (зависит от подуровня мастера 1..5).
   * - Если T_master >= T_mat + 1: шанс успеха 100% (материал не теряется) + шанс на статус «Безупречная работа».
   */
  function calculateCraftMastery(master, materialTier) {
    const tMat = Number(materialTier) || 1;
    const hasValidMaster = Boolean(master && master.status === 'PAVILION_DUTY');

    if (!hasValidMaster) {
      if (tMat > 1) {
        return {
          hasMaster: false,
          tMaster: 0,
          tMat: tMat,
          isBlocked: true,
          chancePercent: 0,
          speedMultiplier: 0.5,
          expMultiplier: 0,
          burnRareOnFail: true,
          preserveMaterial: false,
          canFlawless: false,
          flawlessChancePercent: 0,
          thresholdCode: 'LOCKED_NO_MASTER',
          thresholdLabel: 'Заблокировано (0%): без мастера PAVILION_DUTY доступен только Т1',
        };
      }
      return {
        hasMaster: false,
        tMaster: 0,
        tMat: 1,
        isBlocked: false,
        chancePercent: 50,
        speedMultiplier: 0.5, // Штраф к скорости -50%
        expMultiplier: 0,
        burnRareOnFail: true,
        preserveMaterial: false,
        canFlawless: false,
        flawlessChancePercent: 0,
        thresholdCode: 'UNMANNED_T1',
        thresholdLabel: 'Без мастера: только Т1 · Скорость -50% · Шанс 50%',
      };
    }

    const tMaster = Number(master.realmTier) || 1;
    const subLevel = Number(master.subLevel) || 1;

    // Порог 0: T_master < T_mat - 1 -> крафт заблокирован (0%)
    if (tMaster < tMat - 1) {
      return {
        hasMaster: true,
        tMaster: tMaster,
        tMat: tMat,
        isBlocked: true,
        chancePercent: 0,
        speedMultiplier: 1.0,
        expMultiplier: 0,
        burnRareOnFail: true,
        preserveMaterial: false,
        canFlawless: false,
        flawlessChancePercent: 0,
        thresholdCode: 'LOCKED_LOW_TIER',
        thresholdLabel:
          'Заблокировано (0%): T_master (' +
          tMaster +
          ') < T_mat - 1 (' +
          (tMat - 1) +
          ')',
      };
    }

    // I Порог: T_master == T_mat - 1 -> шанс 25%, при неудаче редкий материал сгорает, при успехе EXP x3
    if (tMaster === tMat - 1) {
      return {
        hasMaster: true,
        tMaster: tMaster,
        tMat: tMat,
        isBlocked: false,
        chancePercent: 25,
        speedMultiplier: 1.0,
        expMultiplier: 3,
        burnRareOnFail: true,
        preserveMaterial: false,
        canFlawless: false,
        flawlessChancePercent: 0,
        thresholdCode: 'THRESHOLD_1_CHALLENGE',
        thresholdLabel:
          'I Порог (T_master = T_mat - 1): Шанс 25% · EXP ×3 · Сгорание редкого мат.',
      };
    }

    // II Порог: T_master == T_mat -> шанс 50–60%
    if (tMaster === tMat) {
      const equalTierChance = 50 + Math.min(10, Math.round((subLevel - 1) * 2.5));
      return {
        hasMaster: true,
        tMaster: tMaster,
        tMat: tMat,
        isBlocked: false,
        chancePercent: equalTierChance,
        speedMultiplier: 1.0,
        expMultiplier: 1,
        burnRareOnFail: true,
        preserveMaterial: false,
        canFlawless: false,
        flawlessChancePercent: 0,
        thresholdCode: 'THRESHOLD_2_EQUAL',
        thresholdLabel:
          'II Порог (T_master = T_mat): Шанс ' +
          equalTierChance +
          '% (50–60%) · EXP ×1',
      };
    }

    // III Порог: T_master >= T_mat + 1 -> шанс 100% (материал не теряется) + шанс на «Безупречная работа»
    const flawlessChance = Math.min(
      65,
      30 + (tMaster - tMat - 1) * 15 + (subLevel - 1) * 5
    );
    return {
      hasMaster: true,
      tMaster: tMaster,
      tMat: tMat,
      isBlocked: false,
      chancePercent: 100,
      speedMultiplier: 1.0,
      expMultiplier: 1,
      burnRareOnFail: false,
      preserveMaterial: true,
      canFlawless: true,
      flawlessChancePercent: flawlessChance,
      thresholdCode: 'THRESHOLD_3_GRANDMASTER',
      thresholdLabel:
        'III Порог (T_master ≥ T_mat + 1): Шанс 100% · Безупречная работа ' +
        flawlessChance +
        '%',
    };
  }

  /**
   * 3. Валидация запуска крафта на станции.
   */
  function validateCraftStart(stationId, recipeId) {
    const station = state.craftStations[stationId];
    const stationMeta = math.CRAFT_STATIONS[stationId];
    if (!station || !stationMeta) {
      return { valid: false, reason: 'Станция не найдена.' };
    }
    if (station.activeCraft) {
      return { valid: false, reason: 'Станция уже занята обработкой заказа.' };
    }

    const recipe = math.CRAFT_RECIPES.find(function (r) {
      return r.id === recipeId || r.templateId === recipeId;
    });
    if (!recipe || recipe.stationId !== stationId) {
      return { valid: false, reason: 'Рецепт не принадлежит данной станции.' };
    }

    const master = getStationMaster(stationId);
    const mastery = calculateCraftMastery(master, recipe.tier);

    if (mastery.isBlocked) {
      return {
        valid: false,
        reason: mastery.thresholdLabel,
        master: master,
        mastery: mastery,
        recipe: recipe,
      };
    }

    if (!canAfford(recipe.cost)) {
      return {
        valid: false,
        reason: 'Недостаточно материалов на Складе Секты.',
        master: master,
        mastery: mastery,
        recipe: recipe,
      };
    }

    // Расчёт времени с учётом штрафа к скорости -50% без мастера
    const baseMs = (recipe.baseTimeSec || 2) * 1000;
    const durationMs = Math.round(baseMs / mastery.speedMultiplier);

    return {
      valid: true,
      reason: 'ОК',
      station: station,
      recipe: recipe,
      master: master,
      mastery: mastery,
      durationMs: durationMs,
    };
  }

  /**
   * 4. Запуск процесса крафта и расчёт результата / прокачки трудом.
   */
  function startStationCraft(stationId, recipeId) {
    const check = validateCraftStart(stationId, recipeId);
    const station = state.craftStations[stationId];
    if (!check.valid) {
      if (station) {
        station.lastResultText = check.reason;
      }
      renderApp();
      return check;
    }

    // Резервируем материалы при старте работы
    spendResources(check.recipe.cost);

    station.activeCraft = {
      recipeId: check.recipe.id,
      elapsedMs: 0,
      durationMs: check.durationMs,
      speedMultiplier: check.mastery.speedMultiplier,
    };
    station.lastResultText =
      'В работе: «' +
      check.recipe.name +
      '» (' +
      (check.mastery.speedMultiplier < 1 ? 'Без мастера: скорость -50%' : 'Мастер: ' + check.master.name) +
      ')...';

    soundFX.playClick();
    renderApp();
    return check;
  }

  function resolveCraftResult(stationId, recipeId) {
    const station = state.craftStations[stationId];
    const stationMeta = math.CRAFT_STATIONS[stationId];
    const recipe = math.CRAFT_RECIPES.find(function (r) {
      return r.id === recipeId || r.templateId === recipeId;
    });
    if (!station || !recipe) return null;

    station.activeCraft = null;
    const master = getStationMaster(stationId);
    const mastery = calculateCraftMastery(master, recipe.tier);

    const roll = Math.random() * 100;
    const isSuccess = roll <= mastery.chancePercent;

    if (!isSuccess) {
      // При неудаче сгорает только редкий материал (rareMaterialKey), а остальные ресурсы возвращаются на склад
      const rareKey = recipe.rareMaterialKey || 'bogIron';
      ['spiritStones', 'bogIron', 'bloodMoss', 'spiderCarapace'].forEach(function (resKey) {
        if (resKey !== rareKey && recipe.cost[resKey] > 0) {
          state.resources[resKey] += recipe.cost[resKey];
        }
      });

      const burnedAmount = recipe.cost[rareKey] || 1;
      const burnedName = math.MATERIAL_NAMES[rareKey] || rareKey;
      const failMsg =
        'Срыв в «' +
        stationMeta.name +
        '» (выпало ' +
        Math.round(roll) +
        '% при шансе ' +
        mastery.chancePercent +
        '%): сгорел редкий материал — ' +
        burnedName +
        ' (' +
        burnedAmount +
        ' ед.)!';

      station.lastResultText = failMsg;
      addChronicle('CRAFT', 'Неудача ремесла: «' + recipe.name + '»', failMsg);
      persistState();
      renderApp();
      return {
        success: false,
        isFlawless: false,
        burnedMaterialKey: rareKey,
        burnedAmount: burnedAmount,
        expGained: 0,
      };
    }

    // Проверка на статус «Безупречная работа» (при T_master >= T_mat + 1)
    const isFlawless =
      mastery.canFlawless && Math.random() * 100 < mastery.flawlessChancePercent;

    // Прокачка трудом: мирный опыт мастеру со статусом PAVILION_DUTY и просветление Сердца Дао от созидания
    let peacefulExpGained = 0;
    if (master && master.status === 'PAVILION_DUTY') {
      const rawExp = (recipe.baseExp || recipe.tier * 20) * mastery.expMultiplier;
      peacefulExpGained = math.calculateExpGain(
        rawExp,
        master,
        state.sectLevel,
        false
      ).finalExp;

      state.disciples = state.disciples.map(function (d) {
        if (d.id !== master.id) return d;
        const updatedMaster = Object.assign({}, d, {
          exp: Math.min(d.maxExp, d.exp + peacefulExpGained),
        });
        const craftHeartShift = isFlawless ? 8 : 3;
        adjustDaoHeart(
          updatedMaster,
          craftHeartShift,
          isFlawless
            ? 'Сотворение Безупречного шедевра в павильоне ремёсел'
            : 'Успешное завершение ремесленного труда в павильоне'
        );
        return math.syncDiscipleHp(updatedMaster, false);
      });
    }

    if (recipe.category === 'GEAR') {
      const finalBonuses = {};
      Object.keys(recipe.bonuses || {}).forEach(function (statKey) {
        const baseVal = recipe.bonuses[statKey];
        finalBonuses[statKey] = isFlawless ? Math.ceil(baseVal * 1.3) : baseVal;
      });

      const craftedItem = {
        id: 'gear_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        templateId: recipe.templateId,
        stationId: stationId,
        name: isFlawless ? recipe.name + ' [Безупречная работа]' : recipe.name,
        slot: recipe.slot,
        tier: recipe.tier,
        isFlawless: isFlawless,
        bonuses: finalBonuses,
        description:
          (isFlawless ? 'Безупречная работа (+30% к параметрам)! ' : '') +
          recipe.description,
      };
      state.warehouseGear.unshift(craftedItem);
    } else if (recipe.category === 'ALCHEMY') {
      const yieldCount = isFlawless ? 2 : 1;
      if (recipe.alchemyType === 'HEAL') {
        state.consumables.healingPills += yieldCount;
      } else if (recipe.alchemyType === 'INJURY') {
        state.consumables.injuryDecoctions += yieldCount;
      } else if (recipe.alchemyType === 'BREAKTHROUGH') {
        state.consumables.breakthroughPills += yieldCount;
      } else if (recipe.alchemyType === 'GOLDEN_CORE') {
        state.consumables.breakthroughPills += 2 * yieldCount;
        Object.keys(math.STAT_PILL_LABELS).forEach(function (sk) {
          state.consumables.statPills[sk] =
            (state.consumables.statPills[sk] || 0) + yieldCount;
        });
      }
    } else if (recipe.category === 'STAT_PILL' && recipe.statKey) {
      const yieldCount = isFlawless ? 2 : 1;
      state.consumables.statPills[recipe.statKey] =
        (state.consumables.statPills[recipe.statKey] || 0) + yieldCount;
    }

    const expNote =
      peacefulExpGained > 0
        ? ' Мастер ' +
          master.name +
          ' получил +' +
          peacefulExpGained +
          ' мирного опыта Ци' +
          (mastery.expMultiplier > 1 ? ' (бонус EXP ×' + mastery.expMultiplier + '!)' : '') +
          '.'
        : ' Создано без мастера (штраф скорости -50%, без опыта).';

    const flawlessNote = isFlawless ? ' Получен статус «Безупречная работа»!' : '';
    const successText =
      'Успех (' +
      mastery.chancePercent +
      '%): создано «' +
      recipe.name +
      '» (Т' +
      recipe.tier +
      ').' +
      flawlessNote +
      expNote;

    station.lastResultText = successText;
    soundFX.playChime();
    addChronicle(
      'CRAFT',
      stationMeta.name + ': создано «' + recipe.name + '»' + (isFlawless ? ' [Безупречно]' : ''),
      successText
    );
    persistState();
    renderApp();

    return {
      success: true,
      isFlawless: isFlawless,
      expGained: peacefulExpGained,
      recipe: recipe,
    };
  }

  function tickCraftStations(deltaMs) {
    let anyUpdated = false;
    Object.keys(state.craftStations).forEach(function (stKey) {
      const st = state.craftStations[stKey];
      if (!st || !st.activeCraft) return;
      anyUpdated = true;
      st.activeCraft.elapsedMs += deltaMs;
      if (st.activeCraft.elapsedMs >= st.activeCraft.durationMs) {
        const finishedRecipeId = st.activeCraft.recipeId;
        resolveCraftResult(stKey, finishedRecipeId);
      }
    });
    if (anyUpdated && state.activeTab === 'CRAFTS') {
      renderApp();
    }
  }

  function applyHealingPill(discipleId) {
    if (state.consumables.healingPills <= 0) return;
    state.consumables.healingPills -= 1;
    state.disciples = state.disciples.map(function (d) {
      if (d.id !== discipleId) return d;
      const eff = math.calculateEffectiveStats(d);
      const daoState = math.getDaoHeartState(d);
      const pillBonusMult = 1 + (daoState.healAndQiBonus || 0);
      const heal = Math.round(eff.maxHp * 0.6 * pillBonusMult);
      return Object.assign({}, d, {
        stats: Object.assign({}, d.stats, {
          hp: Math.min(eff.maxHp, eff.hp + heal),
        }),
      });
    });
    soundFX.playChime();
    persistState();
    renderApp();
  }

  function applyInjuryDecoction(discipleId) {
    if (state.consumables.injuryDecoctions <= 0) return;
    const target = state.disciples.find(function (d) {
      return d.id === discipleId;
    });
    if (!target || target.injuries === 0) return;

    state.consumables.injuryDecoctions -= 1;
    state.disciples = state.disciples.map(function (d) {
      return d.id === discipleId
        ? Object.assign({}, d, { injuries: Math.max(0, d.injuries - 2) })
        : d;
    });
    soundFX.playChime();
    addChronicle(
      'CRAFT',
      'Исцеление меридианов: ' + target.name,
      'Принят Отвар Очищения. Стихийные травмы снижены (' +
        target.injuries +
        ' → ' +
        Math.max(0, target.injuries - 2) +
        ').'
    );
    persistState();
    renderApp();
  }

  function feedPermanentStatPill(discipleId, statKey) {
    if (!state.consumables.statPills[statKey]) return;
    const target = state.disciples.find(function (d) {
      return d.id === discipleId;
    });
    if (!target) return;

    const slot = target.pillGrid[statKey];
    if (slot.consumed >= slot.max) return;

    state.consumables.statPills[statKey] -= 1;
    state.disciples = state.disciples.map(function (d) {
      if (d.id !== discipleId) return d;
      const updatedGrid = Object.assign({}, d.pillGrid);
      updatedGrid[statKey] = {
        consumed: d.pillGrid[statKey].consumed + 1,
        max: d.pillGrid[statKey].max,
      };
      const hpBump = statKey === 'maxHp' ? 12 : 0;
      const updatedDisc = Object.assign({}, d, {
        pillGrid: updatedGrid,
        stats: Object.assign({}, d.stats, {
          hp: d.stats.hp + hpBump,
        }),
      });
      return math.syncDiscipleHp(updatedDisc, false);
    });

    soundFX.playChime();
    addChronicle(
      'CRAFT',
      'Усвоена пилюля потенциала: ' + target.name,
      'Принята «' +
        math.STAT_PILL_LABELS[statKey].name +
        '» (' +
        (slot.consumed + 1) +
        '/' +
        slot.max +
        '). ' +
        math.STAT_PILL_LABELS[statKey].bonusText +
        '.'
    );
    persistState();
    renderApp();
  }

  function equipGearOnDisciple(discipleId, gearId) {
    const item = state.warehouseGear.find(function (g) {
      return g.id === gearId;
    });
    const target = state.disciples.find(function (d) {
      return d.id === discipleId;
    });
    if (!item || !target) return;

    const previousItem =
      item.slot === 'WEAPON' ? target.equippedWeapon : target.equippedArmor;

    state.warehouseGear = state.warehouseGear.filter(function (g) {
      return g.id !== gearId;
    });
    if (previousItem) {
      state.warehouseGear.unshift(previousItem);
    }

    state.disciples = state.disciples.map(function (d) {
      if (d.id !== discipleId) return d;
      const nextDisc =
        item.slot === 'WEAPON'
          ? Object.assign({}, d, { equippedWeapon: item })
          : Object.assign({}, d, { equippedArmor: item });
      const newEff = math.calculateEffectiveStats(nextDisc);
      const bonusHp = (item.bonuses && item.bonuses.maxHp) || 0;
      return Object.assign({}, nextDisc, {
        stats: Object.assign({}, nextDisc.stats, {
          hp: Math.min(newEff.maxHp, d.stats.hp + Math.max(0, bonusHp)),
        }),
      });
    });

    soundFX.playChime();
    persistState();
    renderApp();
  }

  function unequipGearFromDisciple(discipleId, slot) {
    const target = state.disciples.find(function (d) {
      return d.id === discipleId;
    });
    if (!target) return;

    const currentItem =
      slot === 'WEAPON' ? target.equippedWeapon : target.equippedArmor;
    if (!currentItem) return;

    state.warehouseGear.unshift(currentItem);
    state.disciples = state.disciples.map(function (d) {
      if (d.id !== discipleId) return d;
      const nextDisc =
        slot === 'WEAPON'
          ? Object.assign({}, d, { equippedWeapon: null })
          : Object.assign({}, d, { equippedArmor: null });
      return math.syncDiscipleHp(nextDisc, false);
    });

    soundFX.playChime();
    persistState();
    renderApp();
  }

  function handleUpgradeSectLevel() {
    if (state.sectLevel !== 1) return;
    const cost = math.SECT_LEVELS[1].upgradeCost;
    if (!cost || !canAfford(cost)) return;

    spendResources(cost);
    state.sectLevel = 2;
    soundFX.playChime();
    addChronicle(
      'SECT',
      'Возвышение Обители: «Твердыня Глубин» (II ступень)',
      'Древний массив Инь-Ци пробуждён! Снято ограничение среды для прорыва во 2-е царство, отдых ускорен до 10 ед. здоровья за тик, прирост опыта увеличен на +35%.'
    );
    persistState();
    renderApp();
  }

  function resetAlphaState() {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(SAVE_STORAGE_KEY);
    }
    state.sectLevel = 1;
    state.resources = Object.assign({}, INITIAL_RESOURCES);
    state.consumables = JSON.parse(JSON.stringify(INITIAL_CONSUMABLES));
    state.warehouseGear = [];
    state.craftStations = createInitialCraftStations();
    state.freeRecruitsLeft = 1;
    state.disciples = [];
    state.fallenMemorial = [];
    state.selectedDiscipleId = null;
    state.inspectedDiscipleId = null;
    state.breakthroughModalDiscipleId = null;
    state.expedition = {
      active: false,
      expeditionPhase: 'MARCHING',
      marchingTicksLeft: 3,
      marchingTotalTicks: 3,
      depthStage: 1,
      waveInStage: 1,
      combatRound: 0,
      enemies: [],
      lootBuffer: { spiritStones: 0, bogIron: 0, bloodMoss: 0, spiderCarapace: 0 },
      expEarnedInRun: 0,
      combatLog: [
        'Летопись начата заново. Примите первого послушника в Чайном павильоне.',
      ],
      isPaused: false,
      autoRetreatThreshold: 0,
    };
    state.chronicle = [
      {
        id: 'reset_' + Date.now(),
        time: getTimeStr(),
        category: 'SECT',
        title: 'Новое основание Обители',
        detail:
          'Хроники секты очищены. В Чайном павильоне доступен бесплатный найм послушника.',
      },
    ];
    renderApp();
  }

  // ==========================================================================
  // СПРАВОЧНЫЕ ПОДСКАЗКИ (TOOLTIPS) ДЛЯ МЕХАНИК САНЬСЯ
  // ==========================================================================

  function formatArchetypeBonusText(archKey) {
    const info = getArchInfo(archKey);
    const b = info.statBonuses || {};
    const parts = [];
    if (b.maxHp) parts.push('+' + b.maxHp + ' ' + t('bonusMaxHp'));
    if (b.pAtk) parts.push('+' + b.pAtk + ' ' + t('bonusPAtk'));
    if (b.mAtk) parts.push('+' + b.mAtk + ' ' + t('bonusMAtk'));
    if (b.pDef) parts.push('+' + b.pDef + ' ' + t('bonusPDef'));
    if (b.mDef) parts.push('+' + b.mDef + ' ' + t('bonusMDef'));
    if (b.spd) parts.push('+' + b.spd + ' ' + t('bonusSpd'));
    if (b.crit) parts.push('+' + b.crit + '% ' + t('bonusCrit'));
    if (b.eva) parts.push('+' + b.eva + '% ' + t('bonusEva'));
    if (parts.length === 0) {
      return t('archNoviceBonusText');
    }
    return t('archPathBonusesPrefix') + parts.join(', ') + '.';
  }

  function formatArchetypeTooltip(archKey) {
    const info = getArchInfo(archKey);
    const dmgLabel =
      info.attackType === 'MAGICAL'
        ? t('archMagicalAttack')
        : t('archPhysicalAttack');
    return (
      info.role +
      ' · ' +
      dmgLabel +
      '\n' +
      info.description +
      '\n' +
      formatArchetypeBonusText(archKey)
    );
  }

  function formatDaoHeartTooltip(daoHeart, daoState) {
    const label = getDaoHeartLabel(daoHeart);
    const subtitle = (daoState && daoState.subtitle) || '';
    return t('daoTooltipCurrentStage', { label: label, subtitle: subtitle });
  }

  // ==========================================================================
  // РЕНДЕР ОДНОЭКРАННОГО ИНТЕРФЕЙСА (100DVH)
  // ==========================================================================

  function renderDiscipleSelectorBar(selectedDisciple) {
    if (state.disciples.length === 0) return '';
    return (
      '<div class="row-wrap" style="overflow-x:auto;flex-shrink:0;padding-bottom:2px">' +
        '<span class="text-2xs text-muted">' + t('adeptLabel') + '</span>' +
        state.disciples
          .map(function (d) {
            const isSel = selectedDisciple && selectedDisciple.id === d.id;
            const eff = math.calculateEffectiveStats(d);
            return (
              '<button class="btn-tab ' +
              (isSel ? 'active' : '') +
              '" data-action="select-disciple" data-id="' +
              d.id +
              '">' +
              escapeHtml(d.name) +
              ' <span class="font-mono" style="font-size:10px;opacity:0.85">(' +
              eff.hp +
              '/' +
              eff.maxHp +
              ')</span></button>'
            );
          })
          .join('') +
      '</div>'
    );
  }

  function renderAbodeInventory(selectedDisciple) {
    const statKeys = Object.keys(math.STAT_PILL_LABELS);
    const totalStatPills = statKeys.reduce(function (acc, k) {
      return acc + (state.consumables.statPills[k] || 0);
    }, 0);

    const iconStone =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-amber"><polygon points="12 2 20 8 17 21 7 21 4 8 12 2"/><path d="M4 8h16"/><path d="M12 2l-3 6 3 13 3-13-3-6z"/></svg>';
    const iconIron =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-bright"><path d="M6 19l-3-6 4-8 8-2 6 5-2 9-13 2z"/><path d="M9 12l4-3 3 5"/></svg>';
    const iconMoss =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-rose"><path d="M12 22v-9"/><path d="M12 13C7 13 4 9 6 3c5 1 6 5 6 10z"/><path d="M12 16c4 0 8-3 6-9-4 1-6 4-6 9z"/></svg>';
    const iconCarapace =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-emerald"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M8 10h8"/><path d="M9 14h6"/></svg>';
    const iconPotion =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 2v6l-5 8a4 4 0 0 0 3.4 6h7.2a4 4 0 0 0 3.4-6l-5-8V2"/><path d="M8.5 2h7"/><path d="M7 15h10"/></svg>';
    const iconPill =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="text-amber"><circle cx="12" cy="12" r="8"/><circle cx="10" cy="10" r="2"/></svg>';

    return (
      '<div class="flex-col-fill">' +
        renderDiscipleSelectorBar(selectedDisciple) +
        '<div class="scroll-area" style="display:flex;flex-direction:column;gap:10px">' +
          '<section class="card">' +
            '<div class="row-between">' +
              '<h3 style="font-size:14px">' + t('invSpiritualResourcesTitle') + '</h3>' +
              '<span class="text-2xs text-muted">' + t('invExtractedInRift') + '</span>' +
            '</div>' +
            '<div class="grid-4-cols">' +
              '<div class="inner-box has-tooltip" style="display:flex;align-items:center;gap:10px" data-tooltip-title="' + escapeHtml(t('resSpiritStonesTitle')) + '" data-tooltip="' + escapeHtml(t('resSpiritStonesTooltip')) + '">' +
                '<div style="width:36px;height:36px;border-radius:8px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.35);display:flex;align-items:center;justify-content:center;flex-shrink:0">' + iconStone + '</div>' +
                '<div style="min-width:0">' +
                  '<div class="text-2xs text-muted truncate">' + t('resSpiritStonesTitle') + '</div>' +
                  '<div class="font-mono font-semibold text-amber" style="font-size:15px">' + state.resources.spiritStones + ' <span class="text-2xs text-muted">' + t('pcsUnit') + '</span></div>' +
                '</div>' +
              '</div>' +
              '<div class="inner-box has-tooltip" style="display:flex;align-items:center;gap:10px" data-tooltip-title="' + escapeHtml(t('resBogIronTitle')) + '" data-tooltip="' + escapeHtml(t('resBogIronTooltip')) + '">' +
                '<div style="width:36px;height:36px;border-radius:8px;background:rgba(148,163,184,0.12);border:1px solid rgba(148,163,184,0.35);display:flex;align-items:center;justify-content:center;flex-shrink:0">' + iconIron + '</div>' +
                '<div style="min-width:0">' +
                  '<div class="text-2xs text-muted truncate">' + t('resBogIronTitle') + '</div>' +
                  '<div class="font-mono font-semibold text-bright" style="font-size:15px">' + state.resources.bogIron + ' <span class="text-2xs text-muted">' + t('pcsUnit') + '</span></div>' +
                '</div>' +
              '</div>' +
              '<div class="inner-box has-tooltip" style="display:flex;align-items:center;gap:10px" data-tooltip-title="' + escapeHtml(t('resBloodMossTitle')) + '" data-tooltip="' + escapeHtml(t('resBloodMossTooltip')) + '">' +
                '<div style="width:36px;height:36px;border-radius:8px;background:rgba(244,63,94,0.12);border:1px solid rgba(244,63,94,0.35);display:flex;align-items:center;justify-content:center;flex-shrink:0">' + iconMoss + '</div>' +
                '<div style="min-width:0">' +
                  '<div class="text-2xs text-muted truncate">' + t('resBloodMossTitle') + '</div>' +
                  '<div class="font-mono font-semibold text-rose" style="font-size:15px">' + state.resources.bloodMoss + ' <span class="text-2xs text-muted">' + t('pcsUnit') + '</span></div>' +
                '</div>' +
              '</div>' +
              '<div class="inner-box has-tooltip" style="display:flex;align-items:center;gap:10px" data-tooltip-title="' + escapeHtml(t('resSpiderCarapaceTitle')) + '" data-tooltip="' + escapeHtml(t('resSpiderCarapaceTooltip')) + '">' +
                '<div style="width:36px;height:36px;border-radius:8px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.35);display:flex;align-items:center;justify-content:center;flex-shrink:0">' + iconCarapace + '</div>' +
                '<div style="min-width:0">' +
                  '<div class="text-2xs text-muted truncate">' + t('resSpiderCarapaceTitle') + '</div>' +
                  '<div class="font-mono font-semibold text-emerald" style="font-size:15px">' + state.resources.spiderCarapace + ' <span class="text-2xs text-muted">' + t('pcsUnit') + '</span></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</section>' +
          '<div class="grid-2">' +
            '<section class="card">' +
              '<div class="row-between">' +
                '<h3 style="font-size:14px">' + t('invElixirsTitle') + '</h3>' +
                '<button class="btn btn-sm" data-action="goto-crafts-potential">' + t('toAlchemistBtn') + '</button>' +
              '</div>' +
              '<div style="display:flex;flex-direction:column;gap:6px">' +
                '<div class="inner-box row-between text-xs has-tooltip" data-tooltip-title="' + escapeHtml(t('healingPillTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('healingPillTooltipBody')) + '">' +
                  '<div style="display:flex;align-items:center;gap:8px">' +
                    '<span class="text-emerald">' + iconPotion + '</span>' +
                    '<div>' +
                      '<div class="font-semibold text-bright">' + t('healingPillTooltipTitle') + '</div>' +
                      '<div class="text-2xs text-muted">' + t('invHealPillDesc') + '</div>' +
                    '</div>' +
                  '</div>' +
                  '<div class="row-wrap">' +
                    '<span class="font-mono font-semibold text-emerald">' + state.consumables.healingPills + ' ' + t('pcsShort') + '</span>' +
                    (selectedDisciple
                      ? '<button class="btn btn-sm btn-emerald" data-action="heal-disciple" data-id="' + selectedDisciple.id + '" ' + (state.consumables.healingPills <= 0 ? 'disabled' : '') + '>' + t('invGiveBtn') + '</button>'
                      : '') +
                  '</div>' +
                '</div>' +
                '<div class="inner-box row-between text-xs has-tooltip" data-tooltip-title="' + escapeHtml(t('injuryDecoctionTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('injuryDecoctionTooltipBody')) + '">' +
                  '<div style="display:flex;align-items:center;gap:8px">' +
                    '<span class="text-cyan">' + iconPotion + '</span>' +
                    '<div>' +
                      '<div class="font-semibold text-bright">' + t('injuryDecoctionTooltipTitle') + '</div>' +
                      '<div class="text-2xs text-muted">' + t('invInjuryDecoctionDesc') + '</div>' +
                    '</div>' +
                  '</div>' +
                  '<div class="row-wrap">' +
                    '<span class="font-mono font-semibold text-cyan">' + state.consumables.injuryDecoctions + ' ' + t('pcsShort') + '</span>' +
                    (selectedDisciple
                      ? '<button class="btn btn-sm btn-amber" data-action="cure-injury" data-id="' + selectedDisciple.id + '" ' + (state.consumables.injuryDecoctions <= 0 || selectedDisciple.injuries === 0 ? 'disabled' : '') + '>' + t('invGiveBtn') + '</button>'
                      : '') +
                  '</div>' +
                '</div>' +
                '<div class="inner-box row-between text-xs has-tooltip" data-tooltip-title="' + escapeHtml(t('breakPillTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('breakPillTooltipBody')) + '">' +
                  '<div style="display:flex;align-items:center;gap:8px">' +
                    '<span class="text-amber">' + iconPotion + '</span>' +
                    '<div>' +
                      '<div class="font-semibold text-bright">' + t('breakPillTooltipTitle') + '</div>' +
                      '<div class="text-2xs text-muted">' + t('invBreakPillDesc') + '</div>' +
                    '</div>' +
                  '</div>' +
                  '<span class="font-mono font-semibold text-amber">' + state.consumables.breakthroughPills + ' ' + t('pcsShort') + '</span>' +
                '</div>' +
              '</div>' +
            '</section>' +
            '<section class="card">' +
              '<div class="row-between">' +
                '<h3 style="font-size:14px">' + t('invPotentialPillsTitle', { count: totalStatPills }) + '</h3>' +
                '<span class="text-2xs text-muted">' +
                  (selectedDisciple ? t('invForAdept', { name: selectedDisciple.name }) : t('invSelectAdept')) +
                '</span>' +
              '</div>' +
              '<div class="grid-2">' +
                statKeys
                  .map(function (key) {
                    const pillInfo = getPillInfo(key);
                    const stock = state.consumables.statPills[key] || 0;
                    const discSlot = selectedDisciple && selectedDisciple.pillGrid[key];
                    const canFeed =
                      selectedDisciple &&
                      discSlot &&
                      discSlot.consumed < discSlot.max &&
                      stock > 0;
                    return (
                      '<div class="inner-box row-between text-xs has-tooltip" data-tooltip-title="' +
                        escapeHtml(pillInfo.name) +
                        '" data-tooltip="' +
                        escapeHtml(
                          t('craftsPillTooltip', {
                            bonus: pillInfo.bonusText,
                            stock: stock,
                            consumed: discSlot
                              ? t('craftsPillConsumedSuffix', {
                                  consumed: discSlot.consumed,
                                  max: discSlot.max,
                                })
                              : '',
                          })
                        ) +
                        '">' +
                        '<div style="display:flex;align-items:center;gap:6px;min-width:0">' +
                          iconPill +
                          '<div style="min-width:0">' +
                            '<div class="font-semibold text-bright truncate">' +
                              pillInfo.shortStat +
                              ' <span class="text-amber font-mono">(' +
                              stock +
                              ')</span>' +
                            '</div>' +
                            (discSlot
                              ? '<div class="text-2xs text-muted font-mono">' +
                                t('invLimitLabel', {
                                  consumed: discSlot.consumed,
                                  max: discSlot.max,
                                }) +
                                '</div>'
                              : '') +
                          '</div>' +
                        '</div>' +
                        (selectedDisciple
                          ? '<button class="btn btn-sm" data-action="feed-stat-pill" data-id="' +
                            selectedDisciple.id +
                            '" data-stat="' +
                            key +
                            '" ' +
                            (canFeed ? '' : 'disabled') +
                            '>' +
                            t('takeBtn') +
                            '</button>'
                          : '') +
                      '</div>'
                    );
                  })
                  .join('') +
              '</div>' +
            '</section>' +
          '</div>' +
          '<section class="card">' +
            '<div class="row-between">' +
              '<h3 style="font-size:14px">' + t('invArsenalTitle', { count: state.warehouseGear.length }) + '</h3>' +
              '<button class="btn btn-sm" data-action="goto-crafts-forge">' + t('toForgeBtn') + '</button>' +
            '</div>' +
            (state.warehouseGear.length === 0
              ? '<div class="text-xs text-dim" style="text-align:center;padding:14px">' + t('invEmptyWarehouse') + '</div>'
              : '<div class="grid-2">' +
                  state.warehouseGear
                    .map(function (item) {
                      return (
                        '<div class="inner-box row-between text-xs">' +
                          '<div style="min-width:0;flex:1">' +
                            '<div class="font-semibold ' +
                              (item.isFlawless ? 'text-amber' : 'text-bright') +
                              ' truncate">' +
                              escapeHtml(getGearDisplayName(item)) +
                              ' <span class="text-2xs text-muted font-mono">[T' +
                              (item.tier || 1) +
                              ']</span>' +
                            '</div>' +
                            '<div class="text-2xs text-muted truncate">' +
                              escapeHtml(getGearDisplayDesc(item)) +
                            '</div>' +
                          '</div>' +
                          (selectedDisciple
                            ? '<button class="btn btn-sm btn-amber" data-action="equip-gear" data-id="' +
                              selectedDisciple.id +
                              '" data-gear="' +
                              item.id +
                              '">' +
                              t('equipBtn') +
                              '</button>'
                            : '') +
                        '</div>'
                      );
                    })
                    .join('') +
                '</div>') +
          '</section>' +
        '</div>' +
      '</div>'
    );
  }

  function renderAbodeSection(selectedDisciple, isSoftlocked) {
    if (state.abodeSubTab === 'INVENTORY') {
      return renderAbodeInventory(selectedDisciple);
    }

    if (state.abodeSubTab === 'SANCTUARY') {
      const canUp =
        state.sectLevel === 1 &&
        canAfford(math.SECT_LEVELS[1].upgradeCost);
      const canRecruit =
        state.freeRecruitsLeft > 0 ||
        state.resources.spiritStones >= RECRUIT_COST;

      return (
        '<div class="flex-col-fill" style="justify-content:space-between">' +
          illustrations.renderSectAbodeBanner(state.sectLevel) +
          '<div class="grid-2" style="flex:1 1 0%;min-height:0">' +
            '<section class="card">' +
              '<div>' +
                '<div class="row-between">' +
                  '<h2 style="font-size:16px">' + t('abodeUpgradeTitle') + '</h2>' +
                  '<span class="text-xs text-amber font-mono">' +
                    t('abodeTierLabel', { level: state.sectLevel }) +
                  '</span>' +
                '</div>' +
                '<p class="text-xs text-muted" style="margin-top:4px">' +
                  (state.sectLevel === 1
                    ? t('abodeLv1Desc')
                    : t('abodeLv2Desc')) +
                '</p>' +
              '</div>' +
              (state.sectLevel === 1
                ? '<div class="divider-top">' +
                    '<div class="text-2xs font-mono" style="margin-bottom:6px;color:#cbd5e1">' + t('abodeUpgradeCostText') + '</div>' +
                    '<button class="btn btn-amber" style="width:100%" data-action="upgrade-sect" ' +
                    (canUp ? '' : 'disabled') +
                    '>' + t('abodeUpgradeBtn') + '</button>' +
                  '</div>'
                : '<div class="divider-top text-xs text-emerald font-semibold">' + t('abodeMaxTierReached') + '</div>') +
            '</section>' +
            '<section class="card">' +
              '<div>' +
                '<div class="row-between">' +
                  '<h2 style="font-size:16px">' + t('teaPavilionTitle') + '</h2>' +
                  '<span class="text-xs text-muted">' +
                    (state.freeRecruitsLeft > 0
                      ? t('freeRecruitsCount', { count: state.freeRecruitsLeft })
                      : t('recruitCostStones', { cost: RECRUIT_COST })) +
                  '</span>' +
                '</div>' +
                '<p class="text-xs text-muted" style="margin-top:4px">' + t('teaPavilionDesc') + '</p>' +
              '</div>' +
              '<div class="divider-top" style="display:flex;flex-direction:column;gap:6px">' +
                '<button class="btn btn-amber" style="width:100%" data-action="recruit-disciple" ' +
                (canRecruit ? '' : 'disabled') +
                '>' +
                  (state.freeRecruitsLeft > 0
                    ? t('recruitFirstFreeBtn')
                    : t('recruitPaidBtn', { cost: RECRUIT_COST })) +
                '</button>' +
                '<div class="row-wrap">' +
                  '<button class="btn ' +
                  (isSoftlocked ? 'btn-emerald' : '') +
                  '" style="flex:1" data-action="heavens-grace" ' +
                  (state.rewardedAdTimer !== null ||
                  (!isSoftlocked && state.disciples.length > 0)
                    ? 'disabled'
                    : '') +
                  '>' +
                    (state.rewardedAdTimer !== null
                      ? t('heavensGraceTimer', { sec: state.rewardedAdTimer })
                      : isSoftlocked
                      ? t('heavensGraceCallBtn')
                      : t('heavensGraceReserveBtn')) +
                  '</button>' +
                  '<button class="btn" data-action="set-abode-sub" data-sub="ROSTER">' +
                    t('toRosterBtn', { count: state.disciples.length }) +
                  '</button>' +
                '</div>' +
              '</div>' +
            '</section>' +
          '</div>' +
        '</div>'
      );
    }

    // ROSTER («Состав»)
    const canRecruit =
      state.freeRecruitsLeft > 0 ||
      state.resources.spiritStones >= RECRUIT_COST;

    return (
      '<div class="flex-col-fill">' +
        '<div class="row-between" style="flex-shrink:0">' +
          '<div>' +
            '<h2 style="font-size:16px">' +
              t('rosterTitle', { count: state.disciples.length }) +
            '</h2>' +
            '<p class="text-xs text-muted">' + t('rosterSubtitle') + '</p>' +
          '</div>' +
          '<button class="btn btn-sm btn-amber" data-action="recruit-disciple" ' +
          (canRecruit ? '' : 'disabled') +
          '>' +
          (state.freeRecruitsLeft > 0
            ? t('recruitBtnShortFree')
            : t('recruitBtnShortPaid', { cost: RECRUIT_COST })) +
          '</button>' +
        '</div>' +
        (state.disciples.length === 0
          ? '<div class="card" style="flex:1;align-items:center;justify-content:center;text-align:center">' +
              '<p class="text-xs text-muted">' + t('emptyRosterMsg') + '</p>' +
              '<button class="btn btn-amber" data-action="set-abode-sub" data-sub="SANCTUARY">' + t('gotoTeaPavilionBtn') + '</button>' +
            '</div>'
          : '<div class="scroll-area grid-2" style="align-content:start">' +
              state.disciples
                .map(function (unit) {
                  const eff = math.calculateEffectiveStats(unit);
                  const isSel = selectedDisciple && selectedDisciple.id === unit.id;
                  const ready = unit.exp >= unit.maxExp;
                  const hpPct = Math.max(
                    0,
                    Math.min(100, (eff.hp / eff.maxHp) * 100)
                  );
                  const shieldPct =
                    eff.maxQiShield > 0
                      ? Math.max(
                          0,
                          Math.min(100, (eff.qiShield / eff.maxQiShield) * 100)
                        )
                      : 0;
                  const expPct = Math.max(
                    0,
                    Math.min(100, (unit.exp / unit.maxExp) * 100)
                  );
                  const daoState = math.getDaoHeartState(unit);
                  const daoLabel = getDaoHeartLabel(unit.daoHeart);
                  const daoThumbPos = (unit.daoHeart + 100) / 2;
                  const archInfo = getArchInfo(unit.archetype);
                  const tempInfo = getTempInfo(unit.temperament);
                  const rootInfo = getRootInfo(unit.spiritRoot);
                  const constInfo = getConstInfo(unit.constitution);

                  return (
                    '<div class="card ' +
                    (isSel ? 'card-selected' : '') +
                    '" style="cursor:pointer" data-action="open-disciple-card" data-id="' +
                    unit.id +
                    '">' +
                      '<div>' +
                        '<div class="row-between">' +
                          '<span class="font-semibold text-bright">' +
                            escapeHtml(unit.name) +
                          '</span>' +
                          '<span class="text-2xs ' +
                            (unit.status === 'EXPEDITION'
                              ? 'text-rose'
                              : unit.status === 'PAVILION_DUTY'
                              ? 'text-amber'
                              : 'text-muted') +
                            ' font-mono">' +
                            (unit.status === 'EXPEDITION'
                              ? t('statusInExpedition')
                              : unit.status === 'PAVILION_DUTY' &&
                                unit.assignedStation &&
                                math.CRAFT_STATIONS[unit.assignedStation]
                              ? t('statusMasterPrefix', {
                                  station: getStationInfo(unit.assignedStation).name,
                                })
                              : t('statusResting')) +
                          '</span>' +
                        '</div>' +
                        '<div class="text-2xs text-muted" style="margin-top:2px">' +
                          '<span class="has-tooltip" data-tooltip-title="' +
                            escapeHtml(t('combatPathTooltipTitle', { name: archInfo.name })) +
                            '" data-tooltip="' +
                            escapeHtml(formatArchetypeTooltip(unit.archetype)) +
                            '">' +
                            escapeHtml(archInfo.name) +
                          '</span>' +
                          ' · <span class="has-tooltip" data-tooltip-title="' +
                            escapeHtml(t('cultivationStageTooltipTitle')) +
                            '" data-tooltip="' +
                            escapeHtml(
                              t('cultivationStageTooltipBody', {
                                realm: math.getRealmLabel(unit.realmTier, unit.subLevel),
                              })
                            ) +
                            '">T' +
                            unit.realmTier +
                            ' (' +
                            unit.subLevel +
                            '/5)</span> · ' +
                          (unit.gender === 'YANG' ? t('genderYangShort') : t('genderYinShort')) +
                          ' · <span class="has-tooltip" data-tooltip-title="' +
                            escapeHtml(t('temperamentTooltipTitle', { name: tempInfo.name })) +
                            '" data-tooltip="' +
                            escapeHtml(tempInfo.summary) +
                            '">' +
                            escapeHtml(tempInfo.name) +
                          '</span>' +
                        '</div>' +
                        '<div class="text-2xs text-muted" style="margin-top:2px">' +
                          '<span class="has-tooltip ' +
                            (unit.spiritRoot && unit.spiritRoot.isDarkRoot
                              ? 'text-demonic'
                              : '') +
                            '" data-tooltip-title="' +
                            escapeHtml(t('spiritRootTooltipTitle', { name: rootInfo.name })) +
                            '" data-tooltip="' +
                            escapeHtml(rootInfo.description || '') +
                            '">' +
                            escapeHtml(rootInfo.name) +
                          '</span> · <span class="has-tooltip" data-tooltip-title="' +
                            escapeHtml(t('constitutionTooltipTitle', { name: constInfo.name })) +
                            '" data-tooltip="' +
                            escapeHtml(constInfo.description || '') +
                            '">' +
                            escapeHtml(constInfo.name) +
                          '</span>' +
                        '</div>' +
                      '</div>' +
                      '<div class="inner-box" style="padding:6px 8px;display:flex;flex-direction:column;gap:4px" data-tooltip-title="' +
                        escapeHtml(t('daoHeartTooltipTitle', { label: daoLabel })) +
                        '" data-tooltip="' +
                        escapeHtml(formatDaoHeartTooltip(unit.daoHeart, daoState)) +
                        '">' +
                        '<div class="row-between text-2xs">' +
                          '<span class="text-muted font-semibold has-tooltip">' + t('daoHeartLabel') + '</span>' +
                          '<strong class="' +
                            daoState.colorClass +
                            '">' +
                            escapeHtml(daoLabel) +
                          '</strong>' +
                        '</div>' +
                        '<div class="dao-scale-track">' +
                          '<div class="dao-scale-center"></div>' +
                          '<div class="dao-scale-thumb" style="left: ' +
                            daoThumbPos +
                            '%"></div>' +
                        '</div>' +
                        '<div class="row-between text-2xs text-muted" style="font-size:10px">' +
                          '<span class="text-rose">' + t('daoAbyssDemon') + '</span>' +
                          '<span>' + t('daoBalance') + '</span>' +
                          '<span class="text-amber">' + t('daoLightHeavens') + '</span>' +
                        '</div>' +
                        '<div class="text-2xs ' +
                          daoState.colorClass +
                          '" style="opacity:0.9">' +
                          escapeHtml(daoState.subtitle || '') +
                        '</div>' +
                      '</div>' +
                      '<div class="grid-3-cols font-mono text-2xs">' +
                        '<div data-tooltip-title="' + escapeHtml(t('hpTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('hpTooltipBody')) + '">' +
                          '<div class="row-between"><span>' + t('hpLabel') + '</span><span>' +
                            eff.hp +
                            '/' +
                            eff.maxHp +
                          '</span></div>' +
                          '<div class="progress-track"><div class="progress-fill ' +
                            (eff.hp / eff.maxHp < 0.4 ? 'fill-rose' : 'fill-emerald') +
                            '" style="width:' +
                            hpPct +
                            '%"></div></div>' +
                        '</div>' +
                        '<div data-tooltip-title="' + escapeHtml(t('qiShieldTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('qiShieldTooltipBody')) + '">' +
                          '<div class="row-between"><span class="text-cyan">' + t('qiShieldLabel') + '</span><span class="text-cyan">' +
                            eff.qiShield +
                            '/' +
                            eff.maxQiShield +
                          '</span></div>' +
                          '<div class="progress-track"><div class="progress-fill fill-cyan" style="width:' +
                            shieldPct +
                            '%"></div></div>' +
                        '</div>' +
                        '<div data-tooltip-title="' + escapeHtml(t('qiExpTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('qiExpTooltipBody')) + '">' +
                          '<div class="row-between"><span>' + t('qiExpLabel') + '</span><span>' +
                            unit.exp +
                            '/' +
                            unit.maxExp +
                          '</span></div>' +
                          '<div class="progress-track"><div class="progress-fill fill-amber" style="width:' +
                            expPct +
                            '%"></div></div>' +
                        '</div>' +
                      '</div>' +
                      '<div class="row-between divider-top text-2xs">' +
                        '<span class="font-mono text-muted has-tooltip" data-tooltip-title="' + escapeHtml(t('purseInjuriesTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('purseInjuriesTooltipBody')) + '">' +
                          t('purseInjuriesSummary', {
                            stones: unit.personalStones,
                            injuries: unit.injuries,
                          }) +
                        '</span>' +
                        '<div class="row-wrap">' +
                          (ready
                            ? '<button class="btn btn-sm btn-amber" data-action="breakthrough" data-id="' +
                              unit.id +
                              '" data-tooltip-title="' + escapeHtml(t('breakthroughTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('breakthroughTooltipBody')) + '">' + t('breakthroughBtn') + '</button>'
                            : '') +
                          '<button class="btn btn-sm" data-action="open-disciple-card" data-id="' +
                            unit.id +
                            '">' + t('inspectBtn') + '</button>' +
                        '</div>' +
                      '</div>' +
                    '</div>'
                  );
                })
                .join('') +
            '</div>') +
      '</div>'
    );
  }

  function renderExpeditionSection(squadInSlots, lootBufferTotal) {
    if (state.expeditionSubTab === 'ARENA') {
      const hasSquad = squadInSlots.some(function (s) {
        return s !== null;
      });
      const isMarching =
        state.expedition.active &&
        state.expedition.expeditionPhase !== 'COMBAT';
      const marchTotal = state.expedition.marchingTotalTicks || 3;
      const marchLeft =
        typeof state.expedition.marchingTicksLeft === 'number'
          ? state.expedition.marchingTicksLeft
          : marchTotal;
      const marchStep = Math.max(0, Math.min(marchTotal, marchTotal - marchLeft));
      const marchPct = Math.round(((marchStep + 0.5) / marchTotal) * 100);

      return (
        '<div class="flex-col-fill" style="justify-content:space-between">' +
          illustrations.renderKarstRiftBanner(
            state.expedition.depthStage,
            state.expedition.active
          ) +
          '<div class="card" style="flex-shrink:0;padding:6px 12px">' +
            '<div class="row-between">' +
              '<span class="text-xs font-mono">' +
                t('expHeaderStatus', {
                  stage: state.expedition.depthStage,
                  wave: state.expedition.waveInStage,
                }) +
                (!state.expedition.active
                  ? t('expStatusStandby')
                  : isMarching
                  ? '<span class="text-cyan font-semibold">' +
                    t('expStatusTrail', { sec: marchLeft }) +
                    '</span>'
                  : '<span class="text-rose font-semibold">' +
                    t('expStatusCombatRound', { round: state.expedition.combatRound }) +
                    '</span>') +
              '</span>' +
              '<div class="row-wrap">' +
                '<span class="text-2xs text-muted">' + t('expTierLabel') + '</span>' +
                [1, 2, 3, 4, 5]
                  .map(function (st) {
                    return (
                      '<button class="btn btn-sm ' +
                      (state.expedition.depthStage === st ? 'btn-amber' : '') +
                      '" data-action="set-stage" data-stage="' +
                      st +
                      '" ' +
                      (state.expedition.active ? 'disabled' : '') +
                      '>' +
                      st +
                      '</button>'
                    );
                  })
                  .join('') +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="battle-arena-grid">' +
            '<div class="battle-panel">' +
              '<div class="row-between text-2xs text-muted" style="flex-shrink:0">' +
                '<span class="truncate">' + t('expLineupHeader') + '</span>' +
                '<button class="btn btn-sm" data-action="set-exp-sub" data-sub="LINEUP">' + t('expLineupBtn') + '</button>' +
              '</div>' +
              '<div class="battle-slots">' +
                squadInSlots
                  .map(function (member, idx) {
                    const eff = member ? math.calculateEffectiveStats(member) : null;
                    const hpPct =
                      member && eff
                        ? Math.max(0, Math.min(100, (eff.hp / eff.maxHp) * 100))
                        : 0;
                    const shieldPct =
                      member && eff && eff.maxQiShield > 0
                        ? Math.max(
                            0,
                            Math.min(100, (eff.qiShield / eff.maxQiShield) * 100)
                          )
                        : 0;
                    return (
                      '<div class="battle-slot">' +
                        '<div class="row-between text-2xs text-muted font-mono">' +
                          '<span>' + t('expPosLabel', { pos: idx + 1 }) + '</span>' +
                          '<span>' + (idx === 0 ? t('expVanguard') : t('expRear')) + '</span>' +
                        '</div>' +
                        (member && eff
                          ? '<div class="font-semibold text-bright truncate" style="margin-top:1px">' +
                              escapeHtml(member.name) +
                            '</div>' +
                            '<div class="row-between text-2xs font-mono" style="margin-top:2px">' +
                              '<span class="text-cyan">' +
                                t('expShieldShort', {
                                  cur: eff.qiShield,
                                  max: eff.maxQiShield,
                                }) +
                              '</span>' +
                              '<span>' +
                                t('expHpShort', {
                                  cur: eff.hp,
                                  max: eff.maxHp,
                                }) +
                              '</span>' +
                            '</div>' +
                            '<div class="progress-track" title="' + escapeHtml(t('qiShieldTooltipTitle')) + '"><div class="progress-fill fill-cyan" style="width:' +
                              shieldPct +
                              '%"></div></div>' +
                            '<div class="progress-track" title="' + escapeHtml(t('hpLabel')) + '"><div class="progress-fill ' +
                              (eff.hp / eff.maxHp < 0.4 ? 'fill-rose' : 'fill-emerald') +
                              '" style="width:' +
                              hpPct +
                              '%"></div></div>'
                          : '<div class="text-2xs text-dim" style="padding:4px 0">' + t('expEmptySlot') + '</div>') +
                      '</div>'
                    );
                  })
                  .join('') +
              '</div>' +
            '</div>' +
            '<div class="battle-panel">' +
              '<div class="row-between text-2xs text-muted" style="flex-shrink:0">' +
                '<span>' +
                  (isMarching
                    ? t('expAdvancingTrail')
                    : t('expEnemiesInRift')) +
                '</span>' +
                (state.expedition.active
                  ? '<span class="font-mono ' +
                    (isMarching ? 'text-cyan' : 'text-rose') +
                    '">' +
                    (isMarching ? t('expPhaseMarching') : t('expPhaseCombat')) +
                    '</span>'
                  : '') +
              '</div>' +
              (state.expedition.active && isMarching
                ? '<div class="inner-box" style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:6px;text-align:center">' +
                    '<div class="font-semibold text-cyan text-xs">' + t('expSquadAdvancingQuote') + '</div>' +
                    '<div class="text-2xs text-muted font-mono">' +
                      t('expNextEventTicks', {
                        stage: state.expedition.depthStage,
                        left: marchLeft,
                        step: marchStep,
                        total: marchTotal,
                      }) +
                    '</div>' +
                    '<div class="progress-track" style="height:8px"><div class="progress-fill fill-cyan" style="width:' +
                      Math.min(100, Math.max(12, marchPct)) +
                      '%"></div></div>' +
                    '<div class="text-2xs text-muted">' +
                      t('expTrailEventOdds') +
                      '<span class="text-rose font-mono">' + t('expTrailOddsCombat') + '</span> · <span class="text-emerald font-mono">' + t('expTrailOddsLoot') + '</span></div>' +
                  '</div>'
                : state.expedition.active && state.expedition.enemies.length > 0
                ? '<div class="battle-slots">' +
                    state.expedition.enemies
                      .map(function (en) {
                        const pct = Math.max(
                          0,
                          Math.min(100, (en.stats.hp / en.stats.maxHp) * 100)
                        );
                        return (
                          '<div class="battle-slot">' +
                            '<div class="font-semibold text-rose text-xs truncate">' +
                              escapeHtml(en.name) +
                            '</div>' +
                            '<div class="text-2xs text-muted truncate">' +
                              escapeHtml(en.title) +
                            '</div>' +
                            '<div class="row-between text-2xs font-mono" style="margin-top:2px">' +
                              '<span>' +
                                en.stats.hp +
                                '/' +
                                en.stats.maxHp +
                              '</span>' +
                              '<span>' +
                                (en.damageType === 'MAGICAL'
                                  ? t('expEnemyMagAtk', {
                                      atk: en.stats.mAtk,
                                      def: en.stats.pDef,
                                    })
                                  : t('expEnemyPhysAtk', {
                                      atk: en.stats.pAtk,
                                      def: en.stats.pDef,
                                    })) +
                              '</span>' +
                            '</div>' +
                            '<div class="progress-track"><div class="progress-fill fill-rose" style="width:' +
                              pct +
                              '%"></div></div>' +
                          '</div>'
                        );
                      })
                      .join('') +
                  '</div>'
                : '<div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center" class="text-xs text-dim">' + t('expSquadSafeInAbode') + '</div>') +
            '</div>' +
          '</div>' +
          '<div id="expedition-log">' +
            state.expedition.combatLog
              .map(function (line) {
                let cls = '';
                if (line.indexOf('ДЕМОН СЕРДЦА') !== -1 || line.indexOf('HEART DEMON') !== -1) cls = 'text-demonic font-semibold';
                else if (line.indexOf('ТАЛИСМАН ВОЗВРАТА') !== -1 || line.indexOf('RETURN TALISMAN') !== -1) cls = 'text-amber font-semibold';
                else if (line.indexOf('СЕРДЦЕ ДАО') !== -1 || line.indexOf('DAO HEART') !== -1) cls = 'text-amber font-semibold';
                else if (line.indexOf('ГИБЕЛЬ В БОЮ') !== -1 || line.indexOf('FALLEN IN BATTLE') !== -1) cls = 'text-rose font-semibold';
                else if (line.indexOf('Находка на тропе') !== -1 || line.indexOf('Trail Discovery') !== -1) cls = 'text-cyan font-semibold';
                else if (line.indexOf('зачищена') !== -1 || line.indexOf('cleared') !== -1) cls = 'text-emerald font-semibold';
                return (
                  '<div class="' +
                  cls +
                  '" style="border-bottom:1px solid #141b26;padding-bottom:2px;word-break:break-word">' +
                  escapeHtml(line) +
                  '</div>'
                );
              })
              .join('') +
          '</div>' +
          '<div class="card" style="flex-shrink:0;padding:8px 12px;display:flex;flex-direction:column;gap:6px">' +
            '<div class="row-between">' +
              '<div class="row-wrap text-xs font-mono">' +
                '<span class="text-muted has-tooltip" data-tooltip-title="' + escapeHtml(t('lootBufferTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('lootBufferTooltipBody')) + '">' + t('lootBufferLabel') + '</span>' +
                '<span>' +
                  t('lootBufferSummary', {
                    stones: state.expedition.lootBuffer.spiritStones,
                    iron: state.expedition.lootBuffer.bogIron,
                    moss: state.expedition.lootBuffer.bloodMoss,
                    carapace: state.expedition.lootBuffer.spiderCarapace,
                  }) +
                '</span>' +
                '<button class="btn btn-sm btn-amber" data-action="claim-loot" ' +
                (lootBufferTotal === 0 ? 'disabled' : '') +
                '>' + t('collectLootBtn') + '</button>' +
              '</div>' +
              '<div class="row-wrap">' +
                (!state.expedition.active
                  ? '<button class="btn btn-emerald" data-action="start-expedition" ' +
                    (hasSquad ? '' : 'disabled') +
                    '>' + t('startExpeditionBtn') + '</button>'
                  : '<button class="btn" data-action="toggle-pause">' +
                      (state.expedition.isPaused ? t('resumeBtn') : t('pauseBtn')) +
                    '</button>' +
                    '<button class="btn btn-rose" data-action="retreat">' + t('retreatToAbodeBtn') + '</button>') +
              '</div>' +
            '</div>' +
            '<div class="row-between divider-top" style="padding-top:6px">' +
              '<div class="text-2xs text-muted">' +
                '<span class="text-amber font-semibold has-tooltip" data-tooltip-title="' + escapeHtml(t('returnTalismanTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('returnTalismanTooltipBody')) + '">' + t('returnTalismanLabel') + '</span> ' +
                t('returnTalismanDesc') +
              '</div>' +
              '<div class="row-wrap">' +
                [
                  { val: 0, label: t('talismanOff'), tip: t('talismanOffTip') },
                  { val: 25, label: t('talisman25'), tip: t('talisman25Tip') },
                  { val: 40, label: t('talisman40'), tip: t('talisman40Tip') },
                  { val: 50, label: t('talisman50'), tip: t('talisman50Tip') },
                ]
                  .map(function (opt) {
                    const cur = Number(state.expedition.autoRetreatThreshold) || 0;
                    const isActive = cur === opt.val;
                    return (
                      '<button class="btn-tab ' +
                      (isActive ? 'active' : '') +
                      '" data-action="set-auto-retreat" data-threshold="' +
                      opt.val +
                      '" data-tooltip-title="' +
                      escapeHtml(t('returnTalismanTooltipTitle') + ': ' + opt.label) +
                      '" data-tooltip="' +
                      escapeHtml(opt.tip) +
                      '">' +
                      opt.label +
                      '</button>'
                    );
                  })
                  .join('') +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }

    if (state.expeditionSubTab === 'LINEUP') {
      return (
        '<section class="card flex-col-fill">' +
          '<div class="row-between" style="flex-shrink:0">' +
            '<div>' +
              '<h2 style="font-size:16px">' + t('lineupTitle') + '</h2>' +
              '<p class="text-xs text-muted">' + t('lineupSubtitle') + '</p>' +
            '</div>' +
            '<span class="text-xs font-mono has-tooltip" data-tooltip-title="' + escapeHtml(t('lineupMedTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('lineupMedTooltipBody')) + '">' +
              t('lineupMedStock', {
                pills: state.consumables.healingPills,
                decoctions: state.consumables.injuryDecoctions,
              }) +
            '</span>' +
          '</div>' +
          '<div class="scroll-area" style="display:flex;flex-direction:column;gap:8px">' +
            (state.disciples.length === 0
              ? '<div class="text-xs text-muted" style="text-align:center;padding:24px">' + t('noDisciplesInSect') + '</div>'
              : state.disciples
                  .map(function (d) {
                    const eff = math.calculateEffectiveStats(d);
                    const daoState = math.getDaoHeartState(d);
                    const daoLabel = getDaoHeartLabel(d.daoHeart);
                    const isOnDuty = d.status === 'PAVILION_DUTY';
                    const archInfo = getArchInfo(d.archetype);
                    return (
                      '<div class="inner-box row-between text-xs">' +
                        '<div>' +
                          '<div class="font-semibold text-bright">' +
                            escapeHtml(d.name) +
                            ' · <span class="text-muted has-tooltip" data-tooltip-title="' +
                            escapeHtml(t('combatPathTooltipTitle', { name: archInfo.name })) +
                            '" data-tooltip="' +
                            escapeHtml(formatArchetypeTooltip(d.archetype)) +
                            '">' +
                            escapeHtml(archInfo.name) +
                            '</span> · <span class="has-tooltip ' +
                            daoState.colorClass +
                            '" data-tooltip-title="' +
                            escapeHtml(t('daoHeartTooltipTitle', { label: daoLabel })) +
                            '" data-tooltip="' +
                            escapeHtml(formatDaoHeartTooltip(d.daoHeart, daoState)) +
                            '">' +
                            escapeHtml(daoLabel) +
                            '</span>' +
                            (isOnDuty && d.assignedStation && math.CRAFT_STATIONS[d.assignedStation]
                              ? ' <span class="text-amber font-mono">[' +
                                t('statusMasterPrefix', {
                                  station: getStationInfo(d.assignedStation).name,
                                }) +
                                ']</span>'
                              : '') +
                          '</div>' +
                          '<div class="text-2xs text-muted font-mono">' +
                            t('lineupDiscipleStats', {
                              hp: eff.hp,
                              maxHp: eff.maxHp,
                              shield: eff.qiShield,
                              maxShield: eff.maxQiShield,
                              injuries: d.injuries,
                              pDef: eff.pDef,
                              mDef: eff.mDef,
                            }) +
                          '</div>' +
                        '</div>' +
                        '<div class="row-wrap">' +
                          '<button class="btn btn-sm btn-emerald" data-action="heal-disciple" data-id="' +
                            d.id +
                            '" data-tooltip-title="' + escapeHtml(t('healingPillTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('healingPillTooltipBody')) + '" ' +
                            (state.consumables.healingPills <= 0 ||
                            eff.hp >= eff.maxHp
                              ? 'disabled'
                              : '') +
                          '>' + t('plusHpBtn') + '</button>' +
                          '<button class="btn btn-sm btn-amber" data-action="cure-injury" data-id="' +
                            d.id +
                            '" data-tooltip-title="' + escapeHtml(t('injuryDecoctionTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('injuryDecoctionTooltipBody')) + '" ' +
                            (state.consumables.injuryDecoctions <= 0 ||
                            d.injuries === 0
                              ? 'disabled'
                              : '') +
                          '>' + t('minusInjuryBtn') + '</button>' +
                          (isOnDuty && d.assignedStation
                            ? '<button class="btn btn-sm" data-action="unassign-station-master" data-station="' +
                              d.assignedStation +
                              '">' + t('unassignFromPavilionBtn') + '</button>'
                            : [0, 1, 2, 3]
                                .map(function (slotIdx) {
                                  return (
                                    '<button class="btn btn-sm ' +
                                    (d.lineupSlot === slotIdx ? 'btn-amber' : '') +
                                    '" data-action="assign-slot" data-id="' +
                                    d.id +
                                    '" data-slot="' +
                                    slotIdx +
                                    '" ' +
                                    (state.expedition.active ? 'disabled' : '') +
                                    '>' +
                                    t('posShortBtn', { pos: slotIdx + 1 }) +
                                    '</button>'
                                  );
                                })
                                .join('')) +
                        '</div>' +
                      '</div>'
                    );
                  })
                  .join('')) +
          '</div>' +
        '</section>'
      );
    }

    // LOG
    return (
      '<section class="card flex-col-fill">' +
        '<div class="row-between" style="flex-shrink:0">' +
          '<h2 style="font-size:16px">' + t('expLogTitle') + '</h2>' +
          '<span class="text-xs text-muted">' + t('expLogSubtitle') + '</span>' +
        '</div>' +
        '<div id="expedition-log" style="flex:1;max-height:none">' +
          state.expedition.combatLog
            .map(function (line) {
              let cls = '';
              if (line.indexOf('ДЕМОН СЕРДЦА') !== -1 || line.indexOf('HEART DEMON') !== -1) cls = 'text-demonic font-semibold';
              else if (line.indexOf('СЕРДЦЕ ДАО') !== -1 || line.indexOf('DAO HEART') !== -1) cls = 'text-amber font-semibold';
              else if (line.indexOf('ГИБЕЛЬ В БОЮ') !== -1 || line.indexOf('FALLEN IN BATTLE') !== -1) cls = 'text-rose font-semibold';
              else if (line.indexOf('Находка на тропе') !== -1 || line.indexOf('Trail Discovery') !== -1) cls = 'text-cyan font-semibold';
              else if (line.indexOf('зачищена') !== -1 || line.indexOf('cleared') !== -1) cls = 'text-emerald font-semibold';
              return (
                '<div class="' +
                cls +
                '" style="border-bottom:1px solid #141b26;padding-bottom:4px;word-break:break-word">' +
                escapeHtml(line) +
                '</div>'
              );
            })
            .join('') +
        '</div>' +
      '</section>'
    );
  }

  function renderCraftsSection(selectedDisciple) {
    const stationKey = math.CRAFT_STATIONS[state.craftsSubTab]
      ? state.craftsSubTab
      : 'FORGE';
    const stationMeta = getStationInfo(stationKey);
    const stationState = state.craftStations[stationKey];
    const master = getStationMaster(stationKey);

    const stationRecipes = math.CRAFT_RECIPES.filter(function (r) {
      return r.stationId === stationKey;
    });

    const activeCraft = stationState.activeCraft;
    const progressPct = activeCraft
      ? Math.min(100, Math.round((activeCraft.elapsedMs / activeCraft.durationMs) * 100))
      : 0;

    return (
      '<div class="flex-col-fill">' +
        // Верхняя панель назначения мастера PAVILION_DUTY на текущую станцию
        '<section class="card" style="flex-shrink:0;padding:8px 12px;gap:6px">' +
          '<div class="row-between">' +
            '<div>' +
              '<span class="font-semibold text-bright text-sm">' +
                escapeHtml(stationMeta.fullTitle) +
              '</span>' +
              ' <span class="text-2xs text-muted">(' +
                escapeHtml(stationMeta.profession) +
              ')</span>' +
            '</div>' +
            '<div class="text-2xs font-mono">' +
              (master
                ? '<span class="text-emerald font-semibold">' +
                  escapeHtml(
                    t('craftsAssignedMasterInfo', {
                      name: master.name,
                      tier: master.realmTier,
                      sub: master.subLevel,
                      exp: master.exp,
                      maxExp: master.maxExp,
                    })
                  ) +
                  '</span>'
                : '<span class="text-amber font-semibold">' +
                  escapeHtml(t('craftsNoMasterWarning')) +
                  '</span>') +
            '</div>' +
          '</div>' +
          '<div class="row-between">' +
            '<div class="row-wrap">' +
              '<span class="text-2xs text-muted">' + t('craftsAssignMasterLabel') + '</span>' +
              (state.disciples.length === 0
                ? '<span class="text-2xs text-dim">' + t('noDisciplesInSect') + '</span>'
                : state.disciples
                    .map(function (d) {
                      const isThisMaster = master && master.id === d.id;
                      const inCombat = d.status === 'EXPEDITION';
                      const otherStation =
                        d.status === 'PAVILION_DUTY' &&
                        d.assignedStation &&
                        d.assignedStation !== stationKey
                          ? getStationInfo(d.assignedStation).name
                          : null;
                      return (
                        '<button class="btn btn-sm ' +
                        (isThisMaster ? 'btn-amber' : '') +
                        '" data-action="assign-station-master" data-station="' +
                        stationKey +
                        '" data-id="' +
                        d.id +
                        '" ' +
                        (inCombat || activeCraft ? 'disabled' : '') +
                        '>' +
                        escapeHtml(d.name) +
                        ' (T' +
                        d.realmTier +
                        ')' +
                        (isThisMaster
                          ? ' ✓'
                          : inCombat
                          ? t('craftsInCombatTag')
                          : otherStation
                          ? ' [' + escapeHtml(otherStation) + ']'
                          : d.lineupSlot !== null
                          ? t('craftsInLineupTag', { pos: d.lineupSlot + 1 })
                          : '') +
                        '</button>'
                      );
                    })
                    .join('')) +
              (master
                ? '<button class="btn btn-sm btn-rose" data-action="unassign-station-master" data-station="' +
                  stationKey +
                  '" ' +
                  (activeCraft ? 'disabled' : '') +
                  '>' + t('craftsUnassignMasterBtn') + '</button>'
                : '') +
            '</div>' +
            (stationState.lastResultText
              ? '<div class="text-2xs font-mono text-amber truncate" style="max-width:360px">' +
                escapeHtml(stationState.lastResultText) +
                '</div>'
              : '') +
          '</div>' +
          (activeCraft
            ? '<div class="progress-track" style="margin-top:2px"><div class="progress-fill fill-amber" style="width:' +
              progressPct +
              '%"></div></div>'
            : '') +
        '</section>' +
        // Основная рабочая сетка: слева рецепты с Тремя Порогами Мастерства, справа Склад / Применение
        '<div class="grid-2" style="flex:1 1 0%;min-height:0">' +
          '<section class="card flex-col-fill">' +
            '<div class="row-between" style="flex-shrink:0">' +
              '<h3 style="font-size:14px">' +
                escapeHtml(t('craftsBlueprintsTitle', { station: stationMeta.name })) +
              '</h3>' +
              '<span class="text-2xs text-muted has-tooltip" data-tooltip-title="' + escapeHtml(t('threeThresholdsTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('threeThresholdsTooltipBody')) + '">' + t('threeThresholdsLabel') + '</span>' +
            '</div>' +
            '<div class="scroll-area" style="display:flex;flex-direction:column;gap:6px">' +
              stationRecipes
                .map(function (rawRec) {
                  const rec = getRecipeInfo(rawRec);
                  const mastery = calculateCraftMastery(master, rec.tier);
                  const affordable = canAfford(rec.cost);
                  const canStart =
                    !mastery.isBlocked && affordable && !activeCraft;
                  const timeSec = (
                    (rec.baseTimeSec || 2) / mastery.speedMultiplier
                  ).toFixed(1);
                  const rareLabel = getMatName(rec.rareMaterialKey);

                  let badgeClass = 'text-muted';
                  if (mastery.isBlocked) badgeClass = 'text-rose';
                  else if (mastery.chancePercent === 25) badgeClass = 'text-amber';
                  else if (mastery.chancePercent === 100) badgeClass = 'text-emerald';
                  else badgeClass = 'text-bright';

                  return (
                    '<div class="inner-box row-between">' +
                      '<div style="flex:1;min-width:0">' +
                        '<div class="row-between">' +
                          '<span class="font-semibold text-bright text-xs truncate has-tooltip" data-tooltip-title="' +
                            escapeHtml(rec.name + ' (T' + rec.tier + ')') +
                            '" data-tooltip="' +
                            escapeHtml(rec.description) +
                            '">' +
                            escapeHtml(rec.name) +
                            ' <span class="text-amber font-mono">[' +
                            t('craftsRankBadge', { tier: rec.tier }) +
                            ']</span>' +
                          '</span>' +
                          '<span class="text-2xs font-mono has-tooltip ' +
                            badgeClass +
                            '" data-tooltip-title="' +
                            escapeHtml(t('craftsMasteryTooltipTitle', { tier: rec.tier })) +
                            '" data-tooltip="' +
                            escapeHtml(mastery.thresholdLabel || '') +
                            '">' +
                            (mastery.isBlocked
                              ? t('craftsBlockedZero')
                              : t('craftsChanceTime', {
                                  chance: mastery.chancePercent,
                                  sec: timeSec,
                                }) +
                                (mastery.expMultiplier > 1
                                  ? t('craftsExpMult', { mult: mastery.expMultiplier })
                                  : '') +
                                (mastery.canFlawless
                                  ? t('craftsFlawlessPct', {
                                      pct: mastery.flawlessChancePercent,
                                    })
                                  : '')) +
                          '</span>' +
                        '</div>' +
                        '<div class="text-2xs text-muted" style="margin-top:2px">' +
                          escapeHtml(rec.description) +
                        '</div>' +
                        '<div class="text-2xs font-mono" style="margin-top:2px;color:#cbd5e1">' +
                          t('craftsCostSummary', {
                            stones: rec.cost.spiritStones,
                            iron: rec.cost.bogIron,
                            moss: rec.cost.bloodMoss,
                            carapace: rec.cost.spiderCarapace,
                            rare: rareLabel,
                            exp: rec.baseExp * (mastery.expMultiplier || 1),
                          }) +
                        '</div>' +
                      '</div>' +
                      '<button class="btn btn-sm ' +
                        (canStart ? 'btn-amber' : '') +
                        '" data-action="start-station-craft" data-station="' +
                        stationKey +
                        '" data-recipe="' +
                        rec.id +
                        '" ' +
                        (canStart ? '' : 'disabled') +
                      '>' +
                        (mastery.isBlocked
                          ? t('craftsUnavailableBtn')
                          : activeCraft && activeCraft.recipeId === rec.id
                          ? t('craftsInProgressBtn')
                          : t('craftsCreateBtn')) +
                      '</button>' +
                    '</div>'
                  );
                })
                .join('') +
            '</div>' +
          '</section>' +
          // Правая колонка: Склад снаряжения и запасы алхимии
          '<section class="card flex-col-fill">' +
            renderDiscipleSelectorBar(selectedDisciple) +
            (stationKey === 'CAULDRON'
              ? '<div class="row-between" style="flex-shrink:0">' +
                  '<h3 style="font-size:14px">' + t('craftsElixirStockTitle') + '</h3>' +
                  '<span class="text-2xs font-mono has-tooltip" data-tooltip-title="' + escapeHtml(t('craftsCauldronTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('craftsCauldronTooltipBody')) + '">' +
                    t('craftsElixirStockSummary', {
                      heal: state.consumables.healingPills,
                      decoction: state.consumables.injuryDecoctions,
                      breakPill: state.consumables.breakthroughPills,
                    }) +
                  '</span>' +
                '</div>' +
                '<div class="scroll-area" style="display:flex;flex-direction:column;gap:6px">' +
                  (selectedDisciple
                    ? '<div class="inner-box row-between text-xs">' +
                        '<span>' + t('craftsQuickMedFor') + ' <strong>' +
                          escapeHtml(selectedDisciple.name) +
                        '</strong></span>' +
                        '<div class="row-wrap">' +
                          '<button class="btn btn-sm btn-emerald" data-action="heal-disciple" data-id="' +
                            selectedDisciple.id +
                            '" data-tooltip-title="' + escapeHtml(t('healingPillTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('healingPillTooltipBody')) + '" ' +
                            (state.consumables.healingPills <= 0 ? 'disabled' : '') +
                          '>' + t('plusHpBtn') + ' (' +
                            state.consumables.healingPills +
                          ')</button>' +
                          '<button class="btn btn-sm btn-amber" data-action="cure-injury" data-id="' +
                            selectedDisciple.id +
                            '" data-tooltip-title="' + escapeHtml(t('injuryDecoctionTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('injuryDecoctionTooltipBody')) + '" ' +
                            (state.consumables.injuryDecoctions <= 0 ||
                            selectedDisciple.injuries === 0
                              ? 'disabled'
                              : '') +
                          '>' + t('minusInjuryBtn') + ' (' +
                            state.consumables.injuryDecoctions +
                          ')</button>' +
                        '</div>' +
                      '</div>'
                    : '') +
                  '<div class="grid-2">' +
                    Object.keys(math.STAT_PILL_LABELS)
                      .map(function (key) {
                        const pillInfo = getPillInfo(key);
                        const stock = state.consumables.statPills[key] || 0;
                        const discSlot =
                          selectedDisciple && selectedDisciple.pillGrid[key];
                        const canFeed =
                          selectedDisciple &&
                          discSlot &&
                          discSlot.consumed < discSlot.max &&
                          stock > 0;
                        return (
                          '<div class="inner-box row-between text-xs" data-tooltip-title="' +
                            escapeHtml(pillInfo.name) +
                            '" data-tooltip="' +
                            escapeHtml(
                              t('craftsPillTooltip', {
                                bonus: pillInfo.bonusText,
                                stock: stock,
                                consumed: discSlot
                                  ? t('craftsPillConsumedSuffix', {
                                      consumed: discSlot.consumed,
                                      max: discSlot.max,
                                    })
                                  : '',
                              })
                            ) +
                            '">' +
                            '<div>' +
                              '<div class="font-semibold text-bright has-tooltip">' +
                                escapeHtml(pillInfo.shortStat) +
                                ' <span class="text-amber font-mono">(' +
                                stock +
                                ' ' + t('pcsShort') + ')</span>' +
                              '</div>' +
                              (discSlot
                                ? '<div class="text-2xs text-muted font-mono">' +
                                  t('absorbedCount', {
                                    consumed: discSlot.consumed,
                                    max: discSlot.max,
                                  }) +
                                  '</div>'
                                : '') +
                            '</div>' +
                            (selectedDisciple
                              ? '<button class="btn btn-sm" data-action="feed-stat-pill" data-id="' +
                                selectedDisciple.id +
                                '" data-stat="' +
                                key +
                                '" ' +
                                (canFeed ? '' : 'disabled') +
                                '>' + t('takeBtn') + '</button>'
                              : '') +
                          '</div>'
                        );
                      })
                      .join('') +
                  '</div>' +
                '</div>'
              : '<div class="row-between" style="flex-shrink:0">' +
                  '<h3 style="font-size:14px">' +
                    t('craftsWarehouseArsenalTitle', {
                      count: state.warehouseGear.length,
                    }) +
                  '</h3>' +
                  (selectedDisciple
                    ? '<span class="text-2xs text-muted">' +
                      t('craftsEquipLabel', { name: selectedDisciple.name }) +
                      '</span>'
                    : '') +
                '</div>' +
                '<div class="scroll-area" style="display:flex;flex-direction:column;gap:6px">' +
                  (state.warehouseGear.length === 0
                    ? '<div class="text-xs text-dim" style="text-align:center;padding:24px">' + t('craftsEmptyWarehouseMsg') + '</div>'
                    : state.warehouseGear
                        .map(function (item) {
                          return (
                            '<div class="inner-box row-between text-xs">' +
                              '<div style="min-width:0;flex:1">' +
                                '<div class="font-semibold ' +
                                  (item.isFlawless ? 'text-amber' : 'text-bright') +
                                  ' truncate">' +
                                  escapeHtml(getGearDisplayName(item)) +
                                  ' <span class="text-2xs text-muted font-mono">[T' +
                                  (item.tier || 1) +
                                  ']</span>' +
                                '</div>' +
                                '<div class="text-2xs text-muted truncate">' +
                                  escapeHtml(getGearDisplayDesc(item)) +
                                '</div>' +
                              '</div>' +
                              (selectedDisciple
                                ? '<button class="btn btn-sm btn-amber" data-action="equip-gear" data-id="' +
                                  selectedDisciple.id +
                                  '" data-gear="' +
                                  item.id +
                                  '">' + t('equipBtn') + '</button>'
                                : '') +
                            '</div>'
                          );
                        })
                        .join('')) +
                '</div>') +
          '</section>' +
        '</div>' +
      '</div>'
    );
  }

  function renderChronicleSection() {
    if (state.chronicleSubTab === 'EVENTS') {
      const filtered =
        state.chronicleFilter === 'ALL'
          ? state.chronicle
          : state.chronicle.filter(function (c) {
              return c.category === state.chronicleFilter;
            });

      const cats = ['COMBAT', 'ECONOMY', 'BREAKTHROUGH', 'CRAFT', 'DEATH'];

      return (
        '<section class="card flex-col-fill">' +
          '<div class="row-between" style="flex-shrink:0">' +
            '<h2 style="font-size:16px">' + t('chrSectEventsTitle') + '</h2>' +
            '<div class="row-wrap">' +
              '<button class="btn btn-sm ' +
                (state.chronicleFilter === 'ALL' ? 'btn-amber' : '') +
                '" data-action="filter-chronicle" data-cat="ALL">' +
                t('chrAllFilter', { count: state.chronicle.length }) +
              '</button>' +
              cats
                .map(function (cat) {
                  return (
                    '<button class="btn btn-sm ' +
                    (state.chronicleFilter === cat ? 'btn-amber' : '') +
                    '" data-action="filter-chronicle" data-cat="' +
                    cat +
                    '">' +
                    t('chrCat_' + cat) +
                    '</button>'
                  );
                })
                .join('') +
            '</div>' +
          '</div>' +
          '<div class="scroll-area" style="display:flex;flex-direction:column;gap:6px">' +
            filtered
              .map(function (entry) {
                return (
                  '<div class="inner-box text-xs">' +
                    '<div class="row-between text-2xs text-muted">' +
                      '<span>' +
                        escapeHtml(t('chrCat_' + entry.category)) +
                      '</span>' +
                      '<span class="font-mono">' + entry.time + '</span>' +
                    '</div>' +
                    '<div class="font-semibold text-bright" style="margin-top:2px">' +
                      escapeHtml(entry.title) +
                    '</div>' +
                    '<div class="text-muted" style="margin-top:2px">' +
                      escapeHtml(entry.detail) +
                    '</div>' +
                  '</div>'
                );
              })
              .join('') +
          '</div>' +
        '</section>'
      );
    }

    // MEMORIAL
    return (
      '<section class="card flex-col-fill">' +
        '<h2 style="font-size:16px;flex-shrink:0" class="text-rose">' +
          t('chrMemorialTitle', { count: state.fallenMemorial.length }) +
        '</h2>' +
        '<div class="scroll-area" style="display:flex;flex-direction:column;gap:6px">' +
          (state.fallenMemorial.length === 0
            ? '<div class="text-xs text-dim" style="text-align:center;padding:32px">' + t('chrNoFallenMsg') + '</div>'
            : state.fallenMemorial
                .map(function (f) {
                  return (
                    '<div class="inner-box text-xs">' +
                      '<div class="row-between">' +
                        '<span class="font-semibold text-bright">' +
                          escapeHtml(f.name) +
                        '</span>' +
                        '<span class="text-2xs text-muted font-mono">' +
                          f.time +
                        '</span>' +
                      '</div>' +
                      '<div class="text-2xs text-muted">' +
                        escapeHtml(f.realmLabel) +
                        ' · ' +
                        escapeHtml(f.archetypeLabel) +
                      '</div>' +
                      '<div class="text-2xs text-rose" style="margin-top:2px">' +
                        escapeHtml(f.causeOfDeath) +
                      '</div>' +
                      (f.recoveredGearNames && f.recoveredGearNames.length > 0
                        ? '<div class="text-2xs text-emerald" style="margin-top:2px">' +
                          escapeHtml(
                            t('chrRecoveredByComrades', {
                              items: f.recoveredGearNames.join(', '),
                            })
                          ) +
                          '</div>'
                        : '') +
                    '</div>'
                  );
                })
                .join('')) +
        '</div>' +
      '</section>'
    );
  }

  function renderBreakthroughModal() {
    if (!state.breakthroughModalDiscipleId) return '';
    const disc = state.disciples.find(function (d) {
      return d.id === state.breakthroughModalDiscipleId;
    });
    if (!disc) return '';

    const res = math.getBreakthroughChance(
      disc,
      state.sectLevel,
      state.usePillOnBreakthrough && state.consumables.breakthroughPills > 0
    );

    const archetypes = ['SWORDSMAN', 'GUARDIAN', 'FLAME_ADEPT'];

    return (
      '<div class="modal-backdrop">' +
        '<div class="modal-panel">' +
          '<div>' +
            '<div class="text-xs text-amber">' + t('breakModalSubheader') + '</div>' +
            '<h3 style="font-size:18px;margin-top:2px">' +
              escapeHtml(t('breakModalTitle', { name: disc.name })) +
            '</h3>' +
          '</div>' +
          (res.hasEnvPenalty
            ? '<div class="inner-box text-xs text-rose" style="border-color:rgba(244,63,94,0.4)">' + t('breakModalEnvPenalty') + '</div>'
            : '') +
          '<div style="display:flex;flex-direction:column;gap:6px">' +
            archetypes
              .map(function (archKey) {
                const info = getArchInfo(archKey);
                const selected = state.selectedT2Archetype === archKey;
                return (
                  '<button class="inner-box" style="text-align:left;cursor:pointer;' +
                  (selected ? 'border-color:var(--accent-amber);background:#1a2436' : '') +
                  '" data-action="select-t2-arch" data-arch="' +
                  archKey +
                  '" data-tooltip-title="' +
                  escapeHtml(t('combatPathTooltipTitle', { name: info.name })) +
                  '" data-tooltip="' +
                  escapeHtml(formatArchetypeTooltip(archKey)) +
                  '">' +
                    '<div class="row-between text-xs font-semibold text-bright">' +
                      '<span>' + escapeHtml(info.name) + '</span>' +
                      '<span class="text-amber">' + escapeHtml(info.role) + '</span>' +
                    '</div>' +
                    '<div class="text-2xs text-muted" style="margin-top:3px">' +
                      escapeHtml(info.description) +
                    '</div>' +
                    '<div class="text-2xs text-emerald" style="margin-top:2px">' +
                      escapeHtml(formatArchetypeBonusText(archKey)) +
                    '</div>' +
                  '</button>'
                );
              })
              .join('') +
          '</div>' +
          '<button class="inner-box row-between text-xs" style="cursor:pointer" data-action="toggle-break-pill" data-tooltip-title="' + escapeHtml(t('breakPillTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('breakPillTooltipBody')) + '" ' +
          (state.consumables.breakthroughPills <= 0 ? 'disabled' : '') +
          '>' +
            '<span class="has-tooltip">' +
              t('breakUsePillLabel', { count: state.consumables.breakthroughPills }) +
            '</span>' +
            '<strong class="text-amber">' +
              (state.usePillOnBreakthrough &&
              state.consumables.breakthroughPills > 0
                ? t('yesLabel')
                : t('noLabel')) +
            '</strong>' +
          '</button>' +
          '<div class="row-between font-mono text-xs">' +
            '<span class="text-muted">' + t('breakFinalChanceLabel') + '</span>' +
            '<strong class="text-amber" style="font-size:15px">' +
              res.chancePercent +
            '%</strong>' +
          '</div>' +
          '<div class="row-wrap">' +
            '<button class="btn" style="flex:1" data-action="close-break-modal">' + t('cancelBtn') + '</button>' +
            '<button class="btn btn-amber" style="flex:1" data-action="confirm-breakthrough">' + t('startBreakthroughBtn') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderDiscipleCardModal() {
    if (!state.inspectedDiscipleId) return '';
    const disc = state.disciples.find(function (d) {
      return d.id === state.inspectedDiscipleId;
    });
    if (!disc) {
      state.inspectedDiscipleId = null;
      return '';
    }

    const eff = math.calculateEffectiveStats(disc);
    const statKeys = Object.keys(math.STAT_PILL_LABELS);
    const ready = disc.exp >= disc.maxExp;
    const statusLabel =
      disc.status === 'EXPEDITION'
        ? t('statusInExpeditionFull')
        : disc.status === 'PAVILION_DUTY' &&
          disc.assignedStation &&
          math.CRAFT_STATIONS[disc.assignedStation]
        ? t('statusPavilionMasterFull', {
            station: getStationInfo(disc.assignedStation).name,
          })
        : t('statusResting');

    const unit = disc;
    const daoState = math.getDaoHeartState(unit);
    const daoLabel = getDaoHeartLabel(unit.daoHeart);
    const daoScaleLeftPct = Math.max(
      0,
      Math.min(100, (unit.daoHeart + 100) / 2)
    );
    const archInfo = getArchInfo(disc.archetype);
    const tempInfo = getTempInfo(disc.temperament);
    const rootInfo = getRootInfo(disc.spiritRoot);
    const constInfo = getConstInfo(disc.constitution);

    return (
      '<div class="modal-backdrop" data-backdrop="disciple-card">' +
        '<div class="modal-panel modal-panel-lg" id="disciple-modal-panel">' +
          '<div class="row-between" style="border-bottom:1px solid var(--border-subtle);padding-bottom:8px;flex-shrink:0">' +
            '<div style="min-width:0;flex:1">' +
              '<h3 style="font-size:18px;word-break:break-word">' +
                escapeHtml(disc.name) +
                ' <span class="text-xs text-amber" style="font-weight:400">· ' +
                  escapeHtml(math.getRealmLabel(disc.realmTier, disc.subLevel)) +
                '</span>' +
              '</h3>' +
              '<div class="text-2xs text-muted" style="margin-top:2px;word-break:break-word">' +
                '<span class="has-tooltip" data-tooltip-title="' +
                  escapeHtml(t('combatPathTooltipTitle', { name: archInfo.name })) +
                  '" data-tooltip="' +
                  escapeHtml(formatArchetypeTooltip(disc.archetype)) +
                  '">' +
                  escapeHtml(archInfo.name) +
                '</span>' +
                ' · ' +
                (disc.gender === 'YANG' ? t('genderYangFull') : t('genderYinFull')) +
                ' · <span class="has-tooltip" data-tooltip-title="' + escapeHtml(t('personalPurseTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('personalPurseTooltipBody')) + '">' +
                t('purseStonesShort', { stones: disc.personalStones }) +
                '</span> · ' + t('statusLabel') + ' <strong class="text-bright">' +
                escapeHtml(statusLabel) +
                '</strong>' +
              '</div>' +
            '</div>' +
            '<button class="btn btn-sm" data-action="close-disciple-card">' + t('closeModalBtn') + '</button>' +
          '</div>' +
          '<div class="inner-box" style="flex-shrink:0;display:flex;flex-direction:column;gap:8px">' +
            '<div class="text-2xs text-muted font-semibold" style="border-bottom:1px solid var(--border-subtle);padding-bottom:4px">' + t('innateNatureAndDaoTitle') + '</div>' +
            '<div class="grid-3-cols text-xs" style="gap:8px">' +
              '<div style="word-break:break-word" data-tooltip-title="' +
                escapeHtml(t('spiritRootTooltipTitle', { name: rootInfo.name })) +
                '" data-tooltip="' +
                escapeHtml(rootInfo.description || '') +
                '">' +
                '<div class="text-2xs text-muted has-tooltip">' + t('spiritRootLabel') + '</div>' +
                '<strong class="' +
                  (disc.spiritRoot && disc.spiritRoot.isDarkRoot
                    ? 'text-demonic'
                    : 'text-bright') +
                  '">' +
                  escapeHtml(rootInfo.name) +
                '</strong>' +
              '</div>' +
              '<div style="word-break:break-word" data-tooltip-title="' +
                escapeHtml(t('constitutionTooltipTitle', { name: constInfo.name })) +
                '" data-tooltip="' +
                escapeHtml(constInfo.description || '') +
                '">' +
                '<div class="text-2xs text-muted has-tooltip">' + t('constitutionLabel') + '</div>' +
                '<strong class="text-bright">' +
                  escapeHtml(constInfo.name) +
                '</strong>' +
              '</div>' +
              '<div style="word-break:break-word" data-tooltip-title="' +
                escapeHtml(t('temperamentTooltipTitle', { name: tempInfo.name })) +
                '" data-tooltip="' +
                escapeHtml(tempInfo.summary || '') +
                '">' +
                '<div class="text-2xs text-muted has-tooltip">' + t('temperamentLabel') + '</div>' +
                '<strong class="text-bright">' +
                  escapeHtml(tempInfo.name) +
                '</strong>' +
              '</div>' +
            '</div>' +
            '<div style="border-top:1px solid var(--border-subtle);padding-top:6px;display:flex;flex-direction:column;gap:4px" data-tooltip-title="' +
              escapeHtml(t('daoHeartTooltipTitle', { label: daoLabel })) +
              '" data-tooltip="' +
              escapeHtml(formatDaoHeartTooltip(unit.daoHeart, daoState)) +
              '">' +
              '<div class="row-between text-xs">' +
                '<span class="text-muted font-semibold has-tooltip">' + t('daoHeartLabel') + '</span>' +
                '<strong class="' +
                  daoState.colorClass +
                  '">' +
                  escapeHtml(daoLabel) +
                '</strong>' +
              '</div>' +
              '<div class="dao-scale-track" style="background:linear-gradient(90deg, #881337 0%, #be123c 25%, #64748b 50%, #d97706 75%, #fbbf24 100%)">' +
                '<div class="dao-scale-center"></div>' +
                '<div class="dao-scale-thumb" style="left: ' +
                  daoScaleLeftPct +
                  '%"></div>' +
              '</div>' +
              '<div class="row-between text-2xs text-muted">' +
                '<span class="text-rose">' + t('daoAbyssDemon') + '</span>' +
                '<span>' + t('daoBalance') + '</span>' +
                '<span class="text-amber">' + t('daoLightHeavens') + '</span>' +
              '</div>' +
              '<div class="text-2xs ' +
                daoState.colorClass +
                '" style="opacity:0.9">' +
                escapeHtml(daoState.subtitle || '') +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div style="flex-shrink:0;display:flex;flex-direction:column;gap:6px">' +
            '<div class="row-between text-2xs text-muted">' +
              '<span class="font-semibold">' + t('overallStatsTitle') + '</span>' +
              '<span class="font-mono"><span class="text-cyan">' + t('qiShieldLabel') + ': ' +
                eff.qiShield +
                '/' +
                eff.maxQiShield +
                '</span> · ' + t('qiExpLabel') + ': ' +
                disc.exp +
                '/' +
                disc.maxExp +
              '</span>' +
            '</div>' +
            '<div class="grid-4-cols font-mono" style="text-align:center">' +
              '<div class="inner-box" style="padding:6px 8px" data-tooltip-title="' + escapeHtml(t('statHpShieldTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('statHpShieldTooltipBody')) + '"><div class="text-2xs text-muted has-tooltip">' + t('statHpShieldLabel') + '</div><div class="text-emerald font-semibold">' +
                eff.hp +
                '/' +
                eff.maxHp +
                ' <span class="text-cyan">(' +
                eff.qiShield +
                ')</span></div></div>' +
              '<div class="inner-box" style="padding:6px 8px" data-tooltip-title="' + escapeHtml(t('statPAtkTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('statPAtkTooltipBody')) + '"><div class="text-2xs text-muted has-tooltip">' +
                t('statPAtkBase', { base: disc.stats.pAtk }) +
                '</div><div class="text-bright font-semibold">' +
                eff.pAtk +
              '</div></div>' +
              '<div class="inner-box" style="padding:6px 8px" data-tooltip-title="' + escapeHtml(t('statMAtkTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('statMAtkTooltipBody')) + '"><div class="text-2xs text-muted has-tooltip">' +
                t('statMAtkBase', { base: disc.stats.mAtk }) +
                '</div><div class="text-bright font-semibold">' +
                eff.mAtk +
              '</div></div>' +
              '<div class="inner-box" style="padding:6px 8px" data-tooltip-title="' + escapeHtml(t('statPDefTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('statPDefTooltipBody')) + '"><div class="text-2xs text-muted has-tooltip">' +
                t('statPDefBase', { base: disc.stats.pDef }) +
                '</div><div class="text-bright font-semibold">' +
                eff.pDef +
              '</div></div>' +
              '<div class="inner-box" style="padding:6px 8px" data-tooltip-title="' + escapeHtml(t('statMDefTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('statMDefTooltipBody')) + '"><div class="text-2xs text-muted has-tooltip">' +
                t('statMDefBase', { base: disc.stats.mDef }) +
                '</div><div class="text-bright font-semibold">' +
                eff.mDef +
              '</div></div>' +
              '<div class="inner-box" style="padding:6px 8px" data-tooltip-title="' + escapeHtml(t('statSpdTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('statSpdTooltipBody')) + '"><div class="text-2xs text-muted has-tooltip">' +
                t('statSpdBase', { base: disc.stats.spd }) +
                '</div><div class="text-bright font-semibold">' +
                eff.spd +
              '</div></div>' +
              '<div class="inner-box" style="padding:6px 8px" data-tooltip-title="' + escapeHtml(t('statCritTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('statCritTooltipBody')) + '"><div class="text-2xs text-muted has-tooltip">' +
                t('statCritBase', { base: disc.stats.crit }) +
                '</div><div class="text-amber font-semibold">' +
                eff.crit +
              '%</div></div>' +
              '<div class="inner-box" style="padding:6px 8px" data-tooltip-title="' + escapeHtml(t('statEvaTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('statEvaTooltipBody')) + '"><div class="text-2xs text-muted has-tooltip">' +
                t('statEvaBase', { base: disc.stats.eva }) +
                '</div><div class="text-emerald font-semibold">' +
                eff.eva +
              '%</div></div>' +
            '</div>' +
          '</div>' +
          '<div class="row-wrap">' +
            '<button class="btn btn-sm" style="flex:1" data-action="heal-disciple" data-id="' +
              disc.id +
              '" data-tooltip-title="' + escapeHtml(t('healingPillTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('healingPillTooltipBody')) + '" ' +
              (state.consumables.healingPills <= 0 || eff.hp >= eff.maxHp
                ? 'disabled'
                : '') +
            '>' +
              t('healingPillBtnCount', { count: state.consumables.healingPills }) +
            '</button>' +
            '<button class="btn btn-sm" style="flex:1" data-action="cure-injury" data-id="' +
              disc.id +
              '" data-tooltip-title="' + escapeHtml(t('injuryDecoctionTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('injuryDecoctionTooltipBody')) + '" ' +
              (state.consumables.injuryDecoctions <= 0 || disc.injuries === 0
                ? 'disabled'
                : '') +
            '>' +
              t('injuryDecoctionBtnCount', {
                count: state.consumables.injuryDecoctions,
                injuries: disc.injuries,
              }) +
            '</button>' +
            (ready
              ? '<button class="btn btn-sm btn-amber" data-action="breakthrough" data-id="' +
                disc.id +
                '" data-tooltip-title="' + escapeHtml(t('breakthroughTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('breakthroughTooltipBody')) + '">' + t('performBreakthroughBtn') + '</button>'
              : '') +
          '</div>' +
          '<div class="grid-2 divider-top">' +
            '<div class="inner-box" style="display:flex;flex-direction:column;justify-content:space-between;gap:8px">' +
              '<div>' +
                '<div class="row-between" style="margin-bottom:6px">' +
                  '<span class="text-xs font-semibold text-bright">' + t('pillPotentialTitle') + '</span>' +
                  '<span class="text-2xs text-muted">' + t('absorbedLimitLabel') + '</span>' +
                '</div>' +
                '<div class="grid-3-cols">' +
                  statKeys
                    .map(function (key) {
                      const slot = disc.pillGrid[key];
                      const inStock = state.consumables.statPills[key] || 0;
                      const isFull = slot.consumed >= slot.max;
                      const pillMeta = getPillInfo(key);
                      return (
                        '<button class="inner-box" style="text-align:left;cursor:pointer;padding:6px 8px" data-action="feed-stat-pill" data-id="' +
                        disc.id +
                        '" data-stat="' +
                        key +
                        '" data-tooltip-title="' +
                        escapeHtml(pillMeta.name) +
                        '" data-tooltip="' +
                        escapeHtml(
                          t('pillSlotTooltipBody', {
                            bonus: pillMeta.bonusText,
                            consumed: slot.consumed,
                            max: slot.max,
                          })
                        ) +
                        '" ' +
                        (isFull || inStock <= 0 ? 'disabled' : '') +
                        '>' +
                          '<div class="row-between text-2xs">' +
                            '<span class="font-semibold text-bright">' +
                              escapeHtml(pillMeta.shortStat) +
                            '</span>' +
                            '<span class="text-amber font-mono">' +
                              slot.consumed +
                              '/' +
                              slot.max +
                            '</span>' +
                          '</div>' +
                          '<div class="text-2xs text-muted" style="margin-top:2px">' +
                            t('stockCountPcs', { count: inStock }) +
                          '</div>' +
                        '</button>'
                      );
                    })
                    .join('') +
                '</div>' +
              '</div>' +
              '<div class="row-between text-2xs text-muted">' +
                '<span>' + t('clickCellToTakePill') + '</span>' +
                '<button class="btn btn-sm" data-action="goto-crafts-potential">' + t('toAlchemistBtn') + '</button>' +
              '</div>' +
            '</div>' +
            '<div class="inner-box" style="display:flex;flex-direction:column;justify-content:space-between;gap:8px">' +
              '<div>' +
                '<div class="row-between" style="margin-bottom:6px">' +
                  '<span class="text-xs font-semibold text-bright">' + t('equipmentSlotsTitle') + '</span>' +
                  '<span class="text-2xs text-muted">' +
                    t('freeInWarehouseCount', { count: state.warehouseGear.length }) +
                  '</span>' +
                '</div>' +
                '<div class="grid-2x2 text-xs" style="margin-bottom:6px">' +
                  '<div class="inner-box" style="padding:6px 8px">' +
                    '<div class="row-between text-2xs text-muted">' +
                      '<span>' + t('weaponLabel') + '</span>' +
                      (disc.equippedWeapon
                        ? '<button class="btn btn-sm" style="padding:1px 6px;min-height:20px;font-size:10px" data-action="unequip-gear" data-id="' +
                          disc.id +
                          '" data-slot="WEAPON">' + t('unequipBtn') + '</button>'
                        : '') +
                    '</div>' +
                    '<div class="font-semibold text-bright truncate" style="margin-top:2px">' +
                      escapeHtml(
                        (disc.equippedWeapon && getGearDisplayName(disc.equippedWeapon)) ||
                          t('notEquippedLabel')
                      ) +
                    '</div>' +
                  '</div>' +
                  '<div class="inner-box" style="padding:6px 8px">' +
                    '<div class="row-between text-2xs text-muted">' +
                      '<span>' + t('armorLabel') + '</span>' +
                      (disc.equippedArmor
                        ? '<button class="btn btn-sm" style="padding:1px 6px;min-height:20px;font-size:10px" data-action="unequip-gear" data-id="' +
                          disc.id +
                          '" data-slot="ARMOR">' + t('unequipBtn') + '</button>'
                        : '') +
                    '</div>' +
                    '<div class="font-semibold text-bright truncate" style="margin-top:2px">' +
                      escapeHtml(
                        (disc.equippedArmor && getGearDisplayName(disc.equippedArmor)) ||
                          t('notEquippedLabel')
                      ) +
                    '</div>' +
                  '</div>' +
                '</div>' +
                '<div class="scroll-area" style="max-height:84px">' +
                  (state.warehouseGear.length === 0
                    ? '<div class="text-2xs text-dim">' + t('noFreeGearInWarehouse') + '</div>'
                    : state.warehouseGear
                        .map(function (g) {
                          return (
                            '<div class="inner-box row-between text-2xs" style="margin-bottom:4px;padding:5px 8px">' +
                              '<span class="truncate">' +
                                escapeHtml(getGearDisplayName(g)) +
                              '</span>' +
                              '<button class="btn btn-sm btn-amber" style="padding:2px 8px;min-height:22px" data-action="equip-gear" data-id="' +
                                disc.id +
                                '" data-gear="' +
                                g.id +
                                '">' + t('equipBtn') + '</button>' +
                            '</div>'
                          );
                        })
                        .join('')) +
                '</div>' +
              '</div>' +
              '<div class="row-between text-2xs text-muted">' +
                '<span>' + t('returnedOnDeathHint') + '</span>' +
                '<button class="btn btn-sm" data-action="goto-crafts-forge">' + t('toForgeBtn') + '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderSettingsModal() {
    if (!state.settingsModalOpen) return '';
    const currentLang = getCurrentLang() || state.lang || 'ru';
    return (
      '<div class="modal-backdrop" data-backdrop="settings-modal">' +
        '<div class="modal-panel">' +
          '<div class="row-between" style="border-bottom:1px solid var(--border-subtle);padding-bottom:8px">' +
            '<h3 style="font-size:16px">' + t('settingsTitle') + '</h3>' +
            '<button class="btn btn-sm" data-action="close-settings">' + t('closeModalBtn') + '</button>' +
          '</div>' +
          '<div class="inner-box" style="display:flex;flex-direction:column;gap:8px">' +
            '<div>' +
              '<div class="text-xs font-semibold text-bright">' + t('settingsLanguageLabel') + '</div>' +
              '<div class="text-2xs text-muted" style="margin-top:2px">' + t('settingsLanguageHint') + '</div>' +
            '</div>' +
            '<div class="row-wrap">' +
              '<button class="btn ' +
                (currentLang === 'ru' ? 'btn-amber' : '') +
                '" style="flex:1" data-action="set-language" data-lang="ru">' +
                t('langRussian') +
              '</button>' +
              '<button class="btn ' +
                (currentLang === 'en' ? 'btn-amber' : '') +
                '" style="flex:1" data-action="set-language" data-lang="en">' +
                t('langEnglish') +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div class="inner-box row-between text-xs">' +
            '<span>' + t('settingsSoundLabel') + '</span>' +
            '<button class="btn btn-sm" data-action="toggle-sound">' +
              (state.soundMuted ? t('soundOffBtn') : t('soundOnBtn')) +
            '</button>' +
          '</div>' +
          '<div class="inner-box row-between text-xs">' +
            '<span>' + t('settingsSaveAndSnapshotLabel') + '</span>' +
            '<div class="row-wrap">' +
              '<button class="btn btn-sm" data-action="manual-save">' + t('saveTooltipTitle') + '</button>' +
              '<button class="btn btn-sm btn-amber" data-action="export-html">' + t('snapshotBtn') + '</button>' +
              '<button class="btn btn-sm btn-rose" data-action="reset-game">' + t('resetBtn') + '</button>' +
            '</div>' +
          '</div>' +
          '<div class="row-wrap" style="justify-content:flex-end">' +
            '<button class="btn btn-amber" data-action="close-settings">' + t('settingsCloseBtn') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderSubnavBar(anyReadyBreakthrough, lootBufferTotal) {
    let tabsHtml = '';
    if (state.activeTab === 'ABODE') {
      tabsHtml =
        '<button class="btn-tab ' +
        (state.abodeSubTab === 'SANCTUARY' ? 'active' : '') +
        '" data-action="set-abode-sub" data-sub="SANCTUARY">' +
        t('subTabSanctuary') +
        '</button>' +
        '<button class="btn-tab ' +
        (state.abodeSubTab === 'ROSTER' ? 'active' : '') +
        '" data-action="set-abode-sub" data-sub="ROSTER">' +
        t('subTabRoster', { count: state.disciples.length }) +
        (anyReadyBreakthrough ? t('subTabBreakthroughReady') : '') +
        '</button>' +
        '<button class="btn-tab ' +
        (state.abodeSubTab === 'INVENTORY' ? 'active' : '') +
        '" data-action="set-abode-sub" data-sub="INVENTORY">' +
        t('subTabInventory') +
        '</button>';
    } else if (state.activeTab === 'EXPEDITION') {
      tabsHtml =
        '<button class="btn-tab ' +
        (state.expeditionSubTab === 'ARENA' ? 'active' : '') +
        '" data-action="set-exp-sub" data-sub="ARENA">' +
        t('subTabArena', { stage: state.expedition.depthStage }) +
        '</button>' +
        '<button class="btn-tab ' +
        (state.expeditionSubTab === 'LINEUP' ? 'active' : '') +
        '" data-action="set-exp-sub" data-sub="LINEUP">' +
        t('subTabLineup') +
        '</button>' +
        '<button class="btn-tab ' +
        (state.expeditionSubTab === 'LOG' ? 'active' : '') +
        '" data-action="set-exp-sub" data-sub="LOG">' +
        t('subTabExpLog') +
        '</button>';
    } else if (state.activeTab === 'CRAFTS') {
      tabsHtml = Object.keys(math.CRAFT_STATIONS)
        .map(function (stKey) {
          const stMeta = getStationInfo(stKey);
          const master = getStationMaster(stKey);
          const busy =
            state.craftStations[stKey] && state.craftStations[stKey].activeCraft;
          return (
            '<button class="btn-tab ' +
            (state.craftsSubTab === stKey ? 'active' : '') +
            '" data-action="set-crafts-sub" data-sub="' +
            stKey +
            '">' +
            escapeHtml(stMeta.name) +
            (master ? ' · ' + escapeHtml(master.name) : t('noMasterSuffix')) +
            (busy ? ' ⚒' : '') +
            '</button>'
          );
        })
        .join('');
    } else {
      tabsHtml =
        '<button class="btn-tab ' +
        (state.chronicleSubTab === 'EVENTS' ? 'active' : '') +
        '" data-action="set-chr-sub" data-sub="EVENTS">' +
        t('subTabEvents', { count: state.chronicle.length }) +
        '</button>' +
        '<button class="btn-tab ' +
        (state.chronicleSubTab === 'MEMORIAL' ? 'active' : '') +
        '" data-action="set-chr-sub" data-sub="MEMORIAL">' +
        t('subTabMemorial', { count: state.fallenMemorial.length }) +
        '</button>';
    }

    return (
      '<div class="subnav-bar">' +
        '<div class="subnav-tabs">' + tabsHtml + '</div>' +
        '<div class="subnav-status">' +
          (state.expedition.active
            ? '<button class="btn btn-sm btn-rose font-mono" data-action="goto-arena">' +
              t('battleStatusBtn', {
                stage: state.expedition.depthStage,
                wave: state.expedition.waveInStage,
              }) +
              '</button>'
            : '') +
          (lootBufferTotal > 0
            ? '<button class="btn btn-sm btn-amber font-mono" data-action="claim-loot">' +
              t('claimLootBufferBtn', { total: lootBufferTotal }) +
              '</button>'
            : '') +
        '</div>' +
      '</div>'
    );
  }

  function renderApp() {
    const root = document.getElementById('root');
    if (!root) return;

    const selectedDisciple = getSelectedDisciple();
    const squadInSlots = [0, 1, 2, 3].map(function (slotIdx) {
      return (
        state.disciples.find(function (d) {
          return d.lineupSlot === slotIdx;
        }) || null
      );
    });

    const lootBufferTotal =
      state.expedition.lootBuffer.spiritStones +
      state.expedition.lootBuffer.bogIron +
      state.expedition.lootBuffer.bloodMoss +
      state.expedition.lootBuffer.spiderCarapace;

    const isSoftlocked =
      state.disciples.length === 0 &&
      state.freeRecruitsLeft === 0 &&
      state.resources.spiritStones < RECRUIT_COST;

    const anyReadyBreakthrough = state.disciples.some(function (d) {
      return d.exp >= d.maxExp;
    });

    let activeWorkspaceHtml = '';
    if (state.activeTab === 'ABODE') {
      activeWorkspaceHtml = renderAbodeSection(selectedDisciple, isSoftlocked);
    } else if (state.activeTab === 'EXPEDITION') {
      activeWorkspaceHtml = renderExpeditionSection(
        squadInSlots,
        lootBufferTotal
      );
    } else if (state.activeTab === 'CRAFTS') {
      activeWorkspaceHtml = renderCraftsSection(selectedDisciple);
    } else {
      activeWorkspaceHtml = renderChronicleSection();
    }

    const prevScrollEl = root.querySelector('.scroll-area');
    const prevScrollTop = prevScrollEl ? prevScrollEl.scrollTop : 0;
    const prevModalEl = document.getElementById('disciple-modal-panel');
    const prevModalScrollTop = prevModalEl ? prevModalEl.scrollTop : 0;

    root.innerHTML =
      '<div class="app-shell">' +
        '<header class="top-header">' +
          '<a class="brand-title" data-action="set-tab" data-tab="ABODE">' + t('brandTitle') + '</a>' +
          '<div class="res-strip">' +
            '<span class="has-tooltip" data-tooltip-title="' + escapeHtml(t('resSpiritStonesTitle')) + '" data-tooltip="' + escapeHtml(t('resSpiritStonesTooltip')) + '">' + t('resSpiritStonesLabel') + ' <strong class="text-amber">' +
              state.resources.spiritStones +
            '</strong></span>' +
            '<span class="res-sep">·</span>' +
            '<button class="btn btn-sm" style="padding:2px 8px;min-height:22px" data-action="open-inventory" data-tooltip-title="' + escapeHtml(t('headerInventoryTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('headerInventoryTooltipBody')) + '">' +
              t('headerInventoryBtn') +
            '</button>' +
          '</div>' +
          '<div class="header-actions">' +
            '<button class="btn btn-sm font-mono" data-action="manual-save" data-tooltip-title="' + escapeHtml(t('saveTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('saveTooltipBody')) + '">' +
              t('autoSaveBtn', { time: escapeHtml(state.lastSavedAt || getTimeStr()) }) +
            '</button>' +
            '<button class="btn btn-sm" data-action="toggle-sound" data-tooltip-title="' + escapeHtml(t('soundTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('soundTooltipBody')) + '">' +
              (state.soundMuted ? t('soundOffBtn') : t('soundOnBtn')) +
            '</button>' +
            '<button class="btn btn-sm" data-action="open-settings" data-tooltip-title="' + escapeHtml(t('settingsTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('settingsTooltipBody')) + '">' +
              t('settingsBtn') + ' (' + (getCurrentLang() || state.lang || 'ru').toUpperCase() + ')' +
            '</button>' +
            '<button class="btn btn-sm" data-action="reset-game" data-tooltip-title="' + escapeHtml(t('resetTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('resetTooltipBody')) + '">' + t('resetBtn') + '</button>' +
            '<button class="btn btn-sm btn-amber" data-action="export-html" data-tooltip-title="' + escapeHtml(t('snapshotTooltipTitle')) + '" data-tooltip="' + escapeHtml(t('snapshotTooltipBody')) + '">' + t('snapshotBtn') + '</button>' +
          '</div>' +
        '</header>' +
        renderSubnavBar(anyReadyBreakthrough, lootBufferTotal) +
        '<main class="workspace">' +
          activeWorkspaceHtml +
        '</main>' +
        renderDiscipleCardModal() +
        renderBreakthroughModal() +
        renderSettingsModal() +
        '<nav class="bottom-nav" aria-label="' + escapeHtml(t('bottomNavAria')) + '">' +
          '<button class="bottom-nav-btn ' +
            (state.activeTab === 'ABODE' ? 'active' : '') +
            '" data-action="set-tab" data-tab="ABODE">' +
            '<span>' + t('tabAbode', { count: state.disciples.length }) + '</span>' +
          '</button>' +
          '<button class="bottom-nav-btn ' +
            (state.activeTab === 'EXPEDITION' ? 'active' : '') +
            '" data-action="set-tab" data-tab="EXPEDITION">' +
            '<span>' +
              (state.expedition.active
                ? t('tabRiftActive', { stage: state.expedition.depthStage })
                : t('tabRift')) +
            '</span>' +
          '</button>' +
          '<button class="bottom-nav-btn ' +
            (state.activeTab === 'CRAFTS' ? 'active' : '') +
            '" data-action="set-tab" data-tab="CRAFTS">' +
            '<span>' + t('tabCrafts') + '</span>' +
          '</button>' +
          '<button class="bottom-nav-btn ' +
            (state.activeTab === 'CHRONICLE' ? 'active' : '') +
            '" data-action="set-tab" data-tab="CHRONICLE">' +
            '<span>' + t('tabChronicle') + '</span>' +
          '</button>' +
        '</nav>' +
      '</div>';

    if (prevScrollTop > 0) {
      const nextScrollEl = root.querySelector('.scroll-area');
      if (nextScrollEl) {
        nextScrollEl.scrollTop = prevScrollTop;
      }
    }
    if (prevModalScrollTop > 0) {
      const nextModalEl = document.getElementById('disciple-modal-panel');
      if (nextModalEl) {
        nextModalEl.scrollTop = prevModalScrollTop;
      }
    }
    scrollExpeditionLogToBottom();
    refreshTooltipAfterRender();
  }

  // ==========================================================================
  // КОМПОНЕНТ ВСПЛЫВАЮЩИХ ПОДСКАЗОК (CUSTOM TOOLTIP SYSTEM)
  // ==========================================================================

  let tooltipEl = null;
  let lastPointerX = -1;
  let lastPointerY = -1;
  let isTooltipActive = false;
  let hideTooltipTimer = null;
  const TOOLTIP_LINGER_MS = 600;

  function cancelHideTooltip() {
    if (hideTooltipTimer !== null) {
      clearTimeout(hideTooltipTimer);
      hideTooltipTimer = null;
    }
  }

  function scheduleHideTooltip(delayMs) {
    const waitMs =
      typeof delayMs === 'number' && delayMs >= 0 ? delayMs : TOOLTIP_LINGER_MS;
    if (waitMs <= 0) {
      hideTooltipImmediately();
      return;
    }
    if (hideTooltipTimer !== null) return;
    hideTooltipTimer = setTimeout(function () {
      hideTooltipTimer = null;
      hideTooltipImmediately();
    }, waitMs);
  }

  function ensureTooltipElement() {
    if (tooltipEl && document.body.contains(tooltipEl)) {
      return tooltipEl;
    }
    tooltipEl = document.getElementById('sect-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'sect-tooltip';
      tooltipEl.className = 'sect-tooltip';
      tooltipEl.setAttribute('role', 'tooltip');
      tooltipEl.setAttribute('aria-hidden', 'true');
      document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
  }

  function findTooltipTarget(node) {
    if (!node || typeof node.closest !== 'function') return null;
    const el = node.closest('[data-tooltip], [title]');
    if (!el) return null;
    if (el.hasAttribute('title') && !el.hasAttribute('data-tooltip')) {
      const rawTitle = el.getAttribute('title');
      if (rawTitle) {
        el.setAttribute('data-tooltip', rawTitle);
      }
      el.removeAttribute('title');
    } else if (el.hasAttribute('title')) {
      el.removeAttribute('title');
    }
    const text = el.getAttribute('data-tooltip');
    if (!text) return null;
    return el;
  }

  function positionTooltip(x, y) {
    const el = ensureTooltipElement();
    if (!el || !isTooltipActive) return;
    const pad = 12;
    const offsetX = 14;
    const offsetY = 16;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;

    let left = x + offsetX;
    let top = y + offsetY;

    if (left + rect.width + pad > vw) {
      left = Math.max(pad, x - rect.width - offsetX);
    }
    if (top + rect.height + pad > vh) {
      top = Math.max(pad, y - rect.height - offsetY);
    }

    el.style.left = Math.round(left) + 'px';
    el.style.top = Math.round(top) + 'px';
  }

  function showTooltipForElement(targetEl, x, y) {
    cancelHideTooltip();
    const el = ensureTooltipElement();
    const bodyText = targetEl.getAttribute('data-tooltip');
    if (!bodyText) {
      scheduleHideTooltip(TOOLTIP_LINGER_MS);
      return;
    }
    const titleText = targetEl.getAttribute('data-tooltip-title') || '';
    let html = '';
    if (titleText) {
      html +=
        '<div class="sect-tooltip-title">' + escapeHtml(titleText) + '</div>';
    }
    html += '<div class="sect-tooltip-body">' + escapeHtml(bodyText) + '</div>';

    if (el.innerHTML !== html) {
      el.innerHTML = html;
    }
    isTooltipActive = true;
    el.classList.add('visible');
    el.setAttribute('aria-hidden', 'false');
    positionTooltip(x, y);
  }

  function hideTooltipImmediately() {
    cancelHideTooltip();
    if (!tooltipEl) return;
    isTooltipActive = false;
    tooltipEl.classList.remove('visible');
    tooltipEl.setAttribute('aria-hidden', 'true');
  }

  function hideTooltip(immediate) {
    if (immediate === true) {
      hideTooltipImmediately();
    } else {
      scheduleHideTooltip(TOOLTIP_LINGER_MS);
    }
  }

  function refreshTooltipAfterRender() {
    if (!isTooltipActive || lastPointerX < 0 || lastPointerY < 0) return;
    const hovered = document.elementFromPoint(lastPointerX, lastPointerY);
    const target = findTooltipTarget(hovered);
    if (target) {
      showTooltipForElement(target, lastPointerX, lastPointerY);
    } else {
      scheduleHideTooltip(TOOLTIP_LINGER_MS);
    }
  }

  function initTooltipSystem() {
    ensureTooltipElement();

    document.addEventListener(
      'mouseover',
      function (e) {
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        const target = findTooltipTarget(e.target);
        if (target) {
          showTooltipForElement(target, e.clientX, e.clientY);
        } else if (isTooltipActive) {
          scheduleHideTooltip(TOOLTIP_LINGER_MS);
        }
      },
      { passive: true }
    );

    document.addEventListener(
      'mousemove',
      function (e) {
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        if (isTooltipActive) {
          const target = findTooltipTarget(e.target);
          if (target) {
            cancelHideTooltip();
            positionTooltip(e.clientX, e.clientY);
          }
        }
      },
      { passive: true }
    );

    document.addEventListener(
      'mouseout',
      function (e) {
        const fromTarget = findTooltipTarget(e.target);
        const toTarget = findTooltipTarget(e.relatedTarget);
        if (fromTarget && !toTarget) {
          scheduleHideTooltip(TOOLTIP_LINGER_MS);
        } else if (!e.relatedTarget && isTooltipActive) {
          scheduleHideTooltip(TOOLTIP_LINGER_MS);
        }
      },
      { passive: true }
    );

    document.addEventListener(
      'focusin',
      function (e) {
        const target = findTooltipTarget(e.target);
        if (target) {
          const rect = target.getBoundingClientRect();
          showTooltipForElement(
            target,
            Math.round(rect.left + rect.width / 2),
            Math.round(rect.bottom)
          );
        }
      },
      { passive: true }
    );

    document.addEventListener(
      'focusout',
      function () {
        scheduleHideTooltip(TOOLTIP_LINGER_MS);
      },
      { passive: true }
    );
    document.addEventListener(
      'scroll',
      function () {
        hideTooltipImmediately();
      },
      true
    );
  }

  const Tooltip = {
    init: initTooltipSystem,
    render: ensureTooltipElement,
    show: showTooltipForElement,
    hide: hideTooltip,
    hideImmediately: hideTooltipImmediately,
    refresh: refreshTooltipAfterRender,
    findTarget: findTooltipTarget,
    lingerMs: TOOLTIP_LINGER_MS,
    formatDaoHeartTooltip: formatDaoHeartTooltip,
    formatArchetypeTooltip: formatArchetypeTooltip,
    formatArchetypeBonusText: formatArchetypeBonusText,
  };

  window.Tooltip = Tooltip;
  window.SectGame.Tooltip = Tooltip;

  // ==========================================================================
  // ЕДИНОЕ ДЕЛЕГИРОВАНИЕ СОБЫТИЙ И ЗАПУСК ЦИКЛА
  // ==========================================================================

  function handleDocumentClick(e) {
    hideTooltipImmediately();
    if (
      e.target &&
      e.target.getAttribute &&
      e.target.getAttribute('data-backdrop') === 'disciple-card'
    ) {
      state.inspectedDiscipleId = null;
      renderApp();
      return;
    }
    if (
      e.target &&
      e.target.getAttribute &&
      e.target.getAttribute('data-backdrop') === 'settings-modal'
    ) {
      state.settingsModalOpen = false;
      renderApp();
      return;
    }

    const target = e.target.closest('[data-action]');
    if (!target || target.disabled) return;

    const action = target.getAttribute('data-action');
    if (action === 'set-tab') {
      state.activeTab = target.getAttribute('data-tab');
      persistState();
      renderApp();
    } else if (action === 'set-abode-sub') {
      state.abodeSubTab = target.getAttribute('data-sub');
      persistState();
      renderApp();
    } else if (action === 'open-inventory') {
      state.activeTab = 'ABODE';
      state.abodeSubTab = 'INVENTORY';
      persistState();
      renderApp();
    } else if (action === 'open-settings') {
      state.settingsModalOpen = true;
      renderApp();
    } else if (action === 'close-settings') {
      state.settingsModalOpen = false;
      renderApp();
    } else if (action === 'set-language') {
      const nextLang = target.getAttribute('data-lang');
      if (i18n && typeof i18n.setLanguage === 'function') {
        state.lang = i18n.setLanguage(nextLang);
      } else if (i18n && typeof i18n.setLang === 'function') {
        state.lang = i18n.setLang(nextLang);
      } else {
        state.lang = nextLang === 'en' ? 'en' : 'ru';
      }
      soundFX.playClick();
      persistState();
      renderApp();
    } else if (action === 'set-exp-sub') {
      state.expeditionSubTab = target.getAttribute('data-sub');
      persistState();
      renderApp();
    } else if (action === 'set-crafts-sub') {
      state.craftsSubTab = target.getAttribute('data-sub');
      persistState();
      renderApp();
    } else if (action === 'set-chr-sub') {
      state.chronicleSubTab = target.getAttribute('data-sub');
      persistState();
      renderApp();
    } else if (action === 'goto-arena') {
      state.activeTab = 'EXPEDITION';
      state.expeditionSubTab = 'ARENA';
      persistState();
      renderApp();
    } else if (action === 'goto-crafts-potential') {
      state.inspectedDiscipleId = null;
      state.activeTab = 'CRAFTS';
      state.craftsSubTab = 'CAULDRON';
      persistState();
      renderApp();
    } else if (action === 'goto-crafts-forge') {
      state.inspectedDiscipleId = null;
      state.activeTab = 'CRAFTS';
      state.craftsSubTab = 'FORGE';
      persistState();
      renderApp();
    } else if (action === 'select-disciple') {
      state.selectedDiscipleId = target.getAttribute('data-id');
      persistState();
      renderApp();
    } else if (
      action === 'open-disciple-card' ||
      action === 'inspect-disciple'
    ) {
      const id = target.getAttribute('data-id');
      state.selectedDiscipleId = id;
      state.inspectedDiscipleId = id;
      persistState();
      renderApp();
    } else if (action === 'close-disciple-card') {
      state.inspectedDiscipleId = null;
      renderApp();
    } else if (action === 'manual-save') {
      persistState();
      soundFX.playClick();
      renderApp();
    } else if (action === 'recruit-disciple') {
      handleRecruitDisciple(false);
    } else if (action === 'heavens-grace') {
      triggerHeavensGraceAd();
    } else if (action === 'upgrade-sect') {
      handleUpgradeSectLevel();
    } else if (action === 'assign-slot') {
      assignToSlot(
        target.getAttribute('data-id'),
        Number(target.getAttribute('data-slot'))
      );
    } else if (action === 'assign-station-master') {
      assignMasterToStation(
        target.getAttribute('data-station'),
        target.getAttribute('data-id')
      );
    } else if (action === 'unassign-station-master') {
      unassignMasterFromStation(target.getAttribute('data-station'));
    } else if (action === 'start-station-craft') {
      startStationCraft(
        target.getAttribute('data-station'),
        target.getAttribute('data-recipe')
      );
    } else if (action === 'start-expedition') {
      startExpedition();
    } else if (action === 'toggle-pause') {
      state.expedition.isPaused = !state.expedition.isPaused;
      persistState();
      renderApp();
    } else if (action === 'retreat') {
      emergencyRetreat(false);
    } else if (action === 'set-auto-retreat') {
      const nextThreshold = Number(target.getAttribute('data-threshold')) || 0;
      state.expedition.autoRetreatThreshold = nextThreshold;
      if (state.expedition.active && nextThreshold > 0) {
        const candidate = findAutoRetreatCandidate(state.disciples);
        if (candidate) {
          emergencyRetreat(
            true,
            'У бойца ' +
              candidate.disciple.name +
              ' сейчас ' +
              candidate.hpPct +
              '% ОЗ (установлен порог ≤ ' +
              candidate.thresholdPct +
              '%).'
          );
          return;
        }
      }
      persistState();
      renderApp();
    } else if (action === 'claim-loot') {
      claimLootBuffer();
    } else if (action === 'set-stage') {
      if (!state.expedition.active) {
        state.expedition.depthStage = Number(target.getAttribute('data-stage'));
        persistState();
        renderApp();
      }
    } else if (action === 'heal-disciple') {
      applyHealingPill(target.getAttribute('data-id'));
    } else if (action === 'cure-injury') {
      applyInjuryDecoction(target.getAttribute('data-id'));
    } else if (action === 'feed-stat-pill') {
      feedPermanentStatPill(
        target.getAttribute('data-id'),
        target.getAttribute('data-stat')
      );
    } else if (action === 'equip-gear') {
      equipGearOnDisciple(
        target.getAttribute('data-id'),
        target.getAttribute('data-gear')
      );
    } else if (action === 'unequip-gear') {
      unequipGearFromDisciple(
        target.getAttribute('data-id'),
        target.getAttribute('data-slot')
      );
    } else if (action === 'breakthrough') {
      handleBreakthroughClick(target.getAttribute('data-id'));
    } else if (action === 'select-t2-arch') {
      state.selectedT2Archetype = target.getAttribute('data-arch');
      renderApp();
    } else if (action === 'toggle-break-pill') {
      state.usePillOnBreakthrough = !state.usePillOnBreakthrough;
      renderApp();
    } else if (action === 'close-break-modal') {
      state.breakthroughModalDiscipleId = null;
      renderApp();
    } else if (action === 'confirm-breakthrough') {
      confirmRealmT2Breakthrough();
    } else if (action === 'filter-chronicle') {
      state.chronicleFilter = target.getAttribute('data-cat');
      persistState();
      renderApp();
    } else if (action === 'toggle-sound') {
      state.soundMuted = !state.soundMuted;
      soundFX.muted = state.soundMuted;
      persistState();
      renderApp();
    } else if (action === 'reset-game') {
      resetAlphaState();
    } else if (action === 'export-html') {
      exporter.downloadStandaloneHtmlBundle(
        state.sectLevel,
        state.resources,
        state.disciples
      );
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    Tooltip.init();
    document.addEventListener('click', handleDocumentClick);
    window.addEventListener('beforeunload', persistState);
    window.addEventListener('pagehide', persistState);
    window.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        persistState();
      }
    });

    persistState();
    renderApp();

    window.setInterval(function () {
      tickCraftStations(250);
    }, 250);

    window.setInterval(function () {
      executeCombatStep();
      executeSectIdleTick();
      persistState();
      renderApp();
    }, 1250);
  });

  window.SectGame.app = {
    state: state,
    persistState: persistState,
    loadSavedGame: loadSavedGame,
    renderApp: renderApp,
    Tooltip: Tooltip,
    getDaoHeartLabel: getDaoHeartLabel,
    formatArchetypeTooltip: formatArchetypeTooltip,
    formatDaoHeartTooltip: formatDaoHeartTooltip,
    adjustDaoHeart: adjustDaoHeart,
    assignMasterToStation: assignMasterToStation,
    unassignMasterFromStation: unassignMasterFromStation,
    calculateCraftMastery: calculateCraftMastery,
    validateCraftStart: validateCraftStart,
    startStationCraft: startStationCraft,
    resolveCraftResult: resolveCraftResult,
  };
})();
