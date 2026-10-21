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
    return new Date().toLocaleTimeString('ru-RU', {
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
    activeTab: (saved && saved.activeTab) || 'ABODE', // ABODE | EXPEDITION | CRAFTS | CHRONICLE
    abodeSubTab: (saved && saved.abodeSubTab) || 'SANCTUARY', // SANCTUARY | ROSTER
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
    const info = math.ARCHETYPE_INFO[archKey] || math.ARCHETYPE_INFO.NOVICE;
    const b = info.statBonuses || {};
    const parts = [];
    if (b.maxHp) parts.push('+' + b.maxHp + ' к Здоровью');
    if (b.pAtk) parts.push('+' + b.pAtk + ' к Физ. атаке');
    if (b.mAtk) parts.push('+' + b.mAtk + ' к Маг. атаке');
    if (b.pDef) parts.push('+' + b.pDef + ' к Физ. защите');
    if (b.mDef) parts.push('+' + b.mDef + ' к Маг. защите');
    if (b.spd) parts.push('+' + b.spd + ' к Скорости');
    if (b.crit) parts.push('+' + b.crit + '% к Шансу крита');
    if (b.eva) parts.push('+' + b.eva + '% к Уклонению');
    if (parts.length === 0) {
      return 'Базовые параметры 1-го царства (Закалка Тела). При прорыве во 2-е царство открывается выбор боевой специализации.';
    }
    return 'Бонусы пути: ' + parts.join(', ') + '.';
  }

  function formatArchetypeTooltip(archKey) {
    const info = math.ARCHETYPE_INFO[archKey] || math.ARCHETYPE_INFO.NOVICE;
    const dmgLabel =
      info.attackType === 'MAGICAL'
        ? 'Духовная атака (бьёт по Маг. защите)'
        : 'Физическая атака (бьёт по Физ. защите)';
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
    return (
      'Текущая ступень духа: «' +
      label +
      '».\n' +
      subtitle +
      '\n\nСтупени Весов Сердца Дао:\n' +
      '• Алмазное Сердце — ускоряет постижение Ци, укрепляет защиту и оберегает от искажения при прорыве.\n' +
      '• Чистый Разум — гармоничное равновесие духа без штрафов.\n' +
      '• Смятение — внутренние сомнения ослабляют защиту и мешают прорыву.\n' +
      '• Одержимость — яростный напор в атаке ценой снижения защиты.\n' +
      '• Истинный Демон — пробуждение Дьявольского пути: сокрушительная мощь в ущерб защите.\n\n' +
      'Победы, прорывы и отдых ведут к Свету Небес; гибель соратников и ранения на грани смерти ведут к Бездне Демона.'
    );
  }

  // ==========================================================================
  // РЕНДЕР ОДНОЭКРАННОГО ИНТЕРФЕЙСА (100DVH)
  // ==========================================================================

  function renderDiscipleSelectorBar(selectedDisciple) {
    if (state.disciples.length === 0) return '';
    return (
      '<div class="row-wrap" style="overflow-x:auto;flex-shrink:0;padding-bottom:2px">' +
        '<span class="text-2xs text-muted">Адепт:</span>' +
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

  function renderAbodeSection(selectedDisciple, isSoftlocked) {
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
                  '<h2 style="font-size:16px">Возвышение Обители</h2>' +
                  '<span class="text-xs text-amber font-mono">Ступень ' +
                    state.sectLevel +
                    '/2</span>' +
                '</div>' +
                '<p class="text-xs text-muted" style="margin-top:4px">' +
                  (state.sectLevel === 1
                    ? '«Забытая Нора»: разреженная Ци режет опыт на пике I царства (-50%) и снижает шанс возвышения во II царство (-35%).'
                    : '«Твердыня Глубин»: источник Инь-Ци открыт! Сняты штрафы среды, опыт +35%, лечение 10 ед./тик.') +
                '</p>' +
              '</div>' +
              (state.sectLevel === 1
                ? '<div class="divider-top">' +
                    '<div class="text-2xs font-mono" style="margin-bottom:6px;color:#cbd5e1">Цена: 80 камн. · 18 жел. · 18 мха · 12 панц.</div>' +
                    '<button class="btn btn-amber" style="width:100%" data-action="upgrade-sect" ' +
                    (canUp ? '' : 'disabled') +
                    '>Возвысить до «Твердыни Глубин»</button>' +
                  '</div>'
                : '<div class="divider-top text-xs text-emerald font-semibold">Обитель достигла максимальной II ступени Альфы.</div>') +
            '</section>' +
            '<section class="card">' +
              '<div>' +
                '<div class="row-between">' +
                  '<h2 style="font-size:16px">Чайный Павильон</h2>' +
                  '<span class="text-xs text-muted">' +
                    (state.freeRecruitsLeft > 0
                      ? 'Бесплатно: ' + state.freeRecruitsLeft
                      : RECRUIT_COST + ' камней') +
                  '</span>' +
                '</div>' +
                '<p class="text-xs text-muted" style="margin-top:4px">Приём послушников со случайным Корнем, Конституцией, Характером и сеткой пилюль.</p>' +
              '</div>' +
              '<div class="divider-top" style="display:flex;flex-direction:column;gap:6px">' +
                '<button class="btn btn-amber" style="width:100%" data-action="recruit-disciple" ' +
                (canRecruit ? '' : 'disabled') +
                '>' +
                  (state.freeRecruitsLeft > 0
                    ? 'Принять первого послушника (Бесплатно)'
                    : 'Принять послушника (' + RECRUIT_COST + ' камней)') +
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
                      ? 'Дар Небес: ' + state.rewardedAdTimer + ' сек...'
                      : isSoftlocked
                      ? 'Воззвать к Милости Небес'
                      : 'Милость Небес (резерв)') +
                  '</button>' +
                  '<button class="btn" data-action="set-abode-sub" data-sub="ROSTER">К составу (' +
                    state.disciples.length +
                  ')</button>' +
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
            '<h2 style="font-size:16px">Адепты Секты (' +
              state.disciples.length +
            ')</h2>' +
            '<p class="text-xs text-muted">Нажмите на карточку или кнопку «Осмотр», чтобы открыть параметры, пилюли и доспехи ученика.</p>' +
          '</div>' +
          '<button class="btn btn-sm btn-amber" data-action="recruit-disciple" ' +
          (canRecruit ? '' : 'disabled') +
          '>+ Нанять (' +
          (state.freeRecruitsLeft > 0 ? 'Бесплатно' : RECRUIT_COST + ' камн.') +
          ')</button>' +
        '</div>' +
        (state.disciples.length === 0
          ? '<div class="card" style="flex:1;align-items:center;justify-content:center;text-align:center">' +
              '<p class="text-xs text-muted">В секте пока нет учеников. Примите первого послушника в Чайном павильоне.</p>' +
              '<button class="btn btn-amber" data-action="set-abode-sub" data-sub="SANCTUARY">Перейти в Чайный павильон</button>' +
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
                  const archInfo = math.ARCHETYPE_INFO[unit.archetype];
                  const tempInfo = math.TEMPERAMENT_INFO[unit.temperament];

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
                              ? 'В походе'
                              : unit.status === 'PAVILION_DUTY' &&
                                unit.assignedStation &&
                                math.CRAFT_STATIONS[unit.assignedStation]
                              ? 'Мастер: ' + math.CRAFT_STATIONS[unit.assignedStation].name
                              : 'Отдых в обители') +
                          '</span>' +
                        '</div>' +
                        '<div class="text-2xs text-muted" style="margin-top:2px">' +
                          '<span class="has-tooltip" data-tooltip-title="Боевой Путь: ' +
                            escapeHtml(archInfo.name) +
                            '" data-tooltip="' +
                            escapeHtml(formatArchetypeTooltip(unit.archetype)) +
                            '">' +
                            escapeHtml(archInfo.name) +
                          '</span>' +
                          ' · <span class="has-tooltip" data-tooltip-title="Ступень культивации" data-tooltip="' +
                            escapeHtml(
                              math.getRealmLabel(unit.realmTier, unit.subLevel) +
                                '. На 5-й ступени при полном опыте Ци открывается прорыв.'
                            ) +
                            '">Т' +
                            unit.realmTier +
                            ' (' +
                            unit.subLevel +
                            '/5)</span> · ' +
                          (unit.gender === 'YANG' ? 'Ян' : 'Инь') +
                          ' · <span class="has-tooltip" data-tooltip-title="Характер: ' +
                            escapeHtml(tempInfo.name) +
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
                            '" data-tooltip-title="Духовный корень: ' +
                            escapeHtml(unit.spiritRoot.name) +
                            '" data-tooltip="' +
                            escapeHtml((unit.spiritRoot && unit.spiritRoot.description) || '') +
                            '">' +
                            escapeHtml(unit.spiritRoot.name) +
                          '</span> · <span class="has-tooltip" data-tooltip-title="Конституция тела: ' +
                            escapeHtml(unit.constitution.name) +
                            '" data-tooltip="' +
                            escapeHtml((unit.constitution && unit.constitution.description) || '') +
                            '">' +
                            escapeHtml(unit.constitution.name) +
                          '</span>' +
                        '</div>' +
                      '</div>' +
                      '<div class="inner-box" style="padding:6px 8px;display:flex;flex-direction:column;gap:4px" data-tooltip-title="Сердце Дао: ' +
                        escapeHtml(daoLabel) +
                        '" data-tooltip="' +
                        escapeHtml(formatDaoHeartTooltip(unit.daoHeart, daoState)) +
                        '">' +
                        '<div class="row-between text-2xs">' +
                          '<span class="text-muted font-semibold has-tooltip">Сердце Дао:</span>' +
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
                          '<span class="text-rose">Бездна Демона</span>' +
                          '<span>Равновесие</span>' +
                          '<span class="text-amber">Свет Небес</span>' +
                        '</div>' +
                        '<div class="text-2xs ' +
                          daoState.colorClass +
                          '" style="opacity:0.9">' +
                          escapeHtml(daoState.subtitle || '') +
                        '</div>' +
                      '</div>' +
                      '<div class="grid-3-cols font-mono text-2xs">' +
                        '<div data-tooltip-title="Жизненная сила (Здоровье)" data-tooltip="Текущий запас здоровья адепта. При падении до нуля в бою наступает гибель. Восстанавливается отдыхом в Обители или Пилюлями Исцеления.">' +
                          '<div class="row-between"><span>Здоровье</span><span>' +
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
                        '<div data-tooltip-title="Личный Щит Ци" data-tooltip="Энергетический барьер (30% от макс. ОЗ + бонусы брони), принимающий на себя первый удар в каждой схватке и мгновенно восстанавливающийся после завершения волны врагов.">' +
                          '<div class="row-between"><span class="text-cyan">Щит Ци</span><span class="text-cyan">' +
                            eff.qiShield +
                            '/' +
                            eff.maxQiShield +
                          '</span></div>' +
                          '<div class="progress-track"><div class="progress-fill fill-cyan" style="width:' +
                            shieldPct +
                            '%"></div></div>' +
                        '</div>' +
                        '<div data-tooltip-title="Постижение Ци (Опыт)" data-tooltip="Накопленный духовный опыт. Пополняется в походах и при труде в Павильоне Ремёсел. При достижении максимума адепт готов к Прорыву ступени.">' +
                          '<div class="row-between"><span>Опыт Ци</span><span>' +
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
                        '<span class="font-mono text-muted has-tooltip" data-tooltip-title="Мошна и Внутренние Травмы" data-tooltip="Мошна: личная доля ученика (10% от добытых в походе Камней Духа).\nТравмы (до 5): каждое тяжёлое увечье снижает боевые характеристики на 10%. Лечится Отваром Очищения.">Мошна: ' +
                          unit.personalStones +
                          ' · Травмы: ' +
                          unit.injuries +
                          '/5</span>' +
                        '<div class="row-wrap">' +
                          (ready
                            ? '<button class="btn btn-sm btn-amber" data-action="breakthrough" data-id="' +
                              unit.id +
                              '" data-tooltip-title="Прорыв ступени" data-tooltip="Накоплено достаточно Ци для перехода на следующую ступень культивации!">Прорыв!</button>'
                            : '') +
                          '<button class="btn btn-sm" data-action="open-disciple-card" data-id="' +
                            unit.id +
                            '">Осмотр →</button>' +
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
              '<span class="text-xs font-mono">Ярус ' +
                state.expedition.depthStage +
                '/5 · Волна ' +
                state.expedition.waveInStage +
                '/3 · ' +
                (!state.expedition.active
                  ? 'В ожидании'
                  : isMarching
                  ? '<span class="text-cyan font-semibold">Тропа (' +
                    marchLeft +
                    ' сек. до события)</span>'
                  : '<span class="text-rose font-semibold">Бой · Раунд ' +
                    state.expedition.combatRound +
                    '</span>') +
              '</span>' +
              '<div class="row-wrap">' +
                '<span class="text-2xs text-muted">Ярус:</span>' +
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
                '<span class="truncate">Походный строй (Поз. 1 — 80% ударов)</span>' +
                '<button class="btn btn-sm" data-action="set-exp-sub" data-sub="LINEUP">Строй</button>' +
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
                          '<span>Поз. ' + (idx + 1) + '</span>' +
                          '<span>' + (idx === 0 ? 'Авангард' : 'Тыл') + '</span>' +
                        '</div>' +
                        (member && eff
                          ? '<div class="font-semibold text-bright truncate" style="margin-top:1px">' +
                              escapeHtml(member.name) +
                            '</div>' +
                            '<div class="row-between text-2xs font-mono" style="margin-top:2px">' +
                              '<span class="text-cyan">Щит ' +
                                eff.qiShield +
                                '/' +
                                eff.maxQiShield +
                              '</span>' +
                              '<span>ОЗ ' +
                                eff.hp +
                                '/' +
                                eff.maxHp +
                              '</span>' +
                            '</div>' +
                            '<div class="progress-track" title="Личный Щит Ци"><div class="progress-fill fill-cyan" style="width:' +
                              shieldPct +
                              '%"></div></div>' +
                            '<div class="progress-track" title="Здоровье"><div class="progress-fill ' +
                              (eff.hp / eff.maxHp < 0.4 ? 'fill-rose' : 'fill-emerald') +
                              '" style="width:' +
                              hpPct +
                              '%"></div></div>'
                          : '<div class="text-2xs text-dim" style="padding:4px 0">Пусто</div>') +
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
                    ? 'Продвижение по тропе Разлома'
                    : 'Противники в Карстовом Разломе') +
                '</span>' +
                (state.expedition.active
                  ? '<span class="font-mono ' +
                    (isMarching ? 'text-cyan' : 'text-rose') +
                    '">' +
                    (isMarching ? 'Фаза: В пути' : 'Фаза: Схватка') +
                    '</span>'
                  : '') +
              '</div>' +
              (state.expedition.active && isMarching
                ? '<div class="inner-box" style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:6px;text-align:center">' +
                    '<div class="font-semibold text-cyan text-xs">«Отряд продвигается по тропе...»</div>' +
                    '<div class="text-2xs text-muted font-mono">Ярус ' +
                      state.expedition.depthStage +
                      ' · До следующего события: ' +
                      marchLeft +
                      ' тик. (шаг ' +
                      marchStep +
                      '/' +
                      marchTotal +
                      ')</div>' +
                    '<div class="progress-track" style="height:8px"><div class="progress-fill fill-cyan" style="width:' +
                      Math.min(100, Math.max(12, marchPct)) +
                      '%"></div></div>' +
                    '<div class="text-2xs text-muted">Шанс события на тропе: <span class="text-rose font-mono">75% бой</span> · <span class="text-emerald font-mono">25% находка ресурсов</span></div>' +
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
                                (en.damageType === 'MAGICAL' ? 'Дух.Атк ' + en.stats.mAtk : 'Атк ' + en.stats.pAtk) +
                                ' · Защ ' +
                                en.stats.pDef +
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
                : '<div style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center" class="text-xs text-dim">Отряд в безопасности Обители. Нажмите «Начать поход в Разлом» ниже.</div>') +
            '</div>' +
          '</div>' +
          '<div id="expedition-log">' +
            state.expedition.combatLog
              .map(function (line) {
                let cls = '';
                if (line.indexOf('ДЕМОН СЕРДЦА') !== -1) cls = 'text-demonic font-semibold';
                else if (line.indexOf('ТАЛИСМАН ВОЗВРАТА') !== -1) cls = 'text-amber font-semibold';
                else if (line.indexOf('СЕРДЦЕ ДАО') !== -1) cls = 'text-amber font-semibold';
                else if (line.indexOf('ГИБЕЛЬ В БОЮ') !== -1) cls = 'text-rose font-semibold';
                else if (line.indexOf('Находка на тропе') !== -1) cls = 'text-cyan font-semibold';
                else if (line.indexOf('зачищена') !== -1) cls = 'text-emerald font-semibold';
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
                '<span class="text-muted has-tooltip" data-tooltip-title="Буфер добычи (Закон 90/10)" data-tooltip="Трофеи, собранные отрядом в текущем походе. При возвращении или сборе 90% поступает в казну Обители, а 10% Камней Духа распределяется в личные мошны бойцов.">Буфер (90/10):</span>' +
                '<span>Камни ' +
                  state.expedition.lootBuffer.spiritStones +
                  ' · Жел. ' +
                  state.expedition.lootBuffer.bogIron +
                  ' · Мох ' +
                  state.expedition.lootBuffer.bloodMoss +
                  ' · Панц. ' +
                  state.expedition.lootBuffer.spiderCarapace +
                '</span>' +
                '<button class="btn btn-sm btn-amber" data-action="claim-loot" ' +
                (lootBufferTotal === 0 ? 'disabled' : '') +
                '>Собрать</button>' +
              '</div>' +
              '<div class="row-wrap">' +
                (!state.expedition.active
                  ? '<button class="btn btn-emerald" data-action="start-expedition" ' +
                    (hasSquad ? '' : 'disabled') +
                    '>Начать поход в Разлом</button>'
                  : '<button class="btn" data-action="toggle-pause">' +
                      (state.expedition.isPaused ? 'Продолжить' : 'Пауза') +
                    '</button>' +
                    '<button class="btn btn-rose" data-action="retreat">Отступить в Обитель</button>') +
              '</div>' +
            '</div>' +
            '<div class="row-between divider-top" style="padding-top:6px">' +
              '<div class="text-2xs text-muted">' +
                '<span class="text-amber font-semibold has-tooltip" data-tooltip-title="Талисман Возврата (Авто-отступление)" data-tooltip="Плановое срабатывание Талисмана Возврата безопасно эвакуирует отряд в Обитель с сохранением всей добычи и НЕ травмирует Сердце Дао, если никто из соратников не пал и здоровье бойца не было пробито ниже критического порога 15% ОЗ.">Талисман Возврата (Авто-отступление):</span> ' +
                'эвакуация отряда при падении ОЗ любого бойца' +
              '</div>' +
              '<div class="row-wrap">' +
                [
                  { val: 0, label: 'Выкл', tip: 'Авто-отступление отключено: отряд сражается до ручного отступления или победы.' },
                  { val: 25, label: '≤ 25% ОЗ', tip: 'Экстренная эвакуация отряда при падении здоровья любого бойца до 25% или ниже.' },
                  { val: 40, label: '≤ 40% ОЗ (без травм)', tip: 'Безопасный тактический отход при 40% ОЗ до зоны риска тяжёлых ранений и ментального шока.' },
                  { val: 50, label: '≤ 50% ОЗ', tip: 'Осторожный тактический отход при падении здоровья любого бойца до половины.' },
                ]
                  .map(function (opt) {
                    const cur = Number(state.expedition.autoRetreatThreshold) || 0;
                    const isActive = cur === opt.val;
                    return (
                      '<button class="btn-tab ' +
                      (isActive ? 'active' : '') +
                      '" data-action="set-auto-retreat" data-threshold="' +
                      opt.val +
                      '" data-tooltip-title="Талисман Возврата: ' +
                      opt.label +
                      '" data-tooltip="' +
                      opt.tip +
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
              '<h2 style="font-size:16px">Построение Отряда и Медицина</h2>' +
              '<p class="text-xs text-muted">Ученики, несущие службу в павильонах ремёсел, не могут входить в походный строй.</p>' +
            '</div>' +
            '<span class="text-xs font-mono has-tooltip" data-tooltip-title="Походная медицина Обители" data-tooltip="Пилюля Исцеления мгновенно восстанавливает 60% от макс. Здоровья ученика.\nОтвар Очищения снимает до 2 стаков внутренних травм меридианов.">Пилюли: ' +
              state.consumables.healingPills +
              ' · Отвары: ' +
              state.consumables.injuryDecoctions +
            '</span>' +
          '</div>' +
          '<div class="scroll-area" style="display:flex;flex-direction:column;gap:8px">' +
            (state.disciples.length === 0
              ? '<div class="text-xs text-muted" style="text-align:center;padding:24px">Нет учеников в секте.</div>'
              : state.disciples
                  .map(function (d) {
                    const eff = math.calculateEffectiveStats(d);
                    const daoState = math.getDaoHeartState(d);
                    const daoLabel = getDaoHeartLabel(d.daoHeart);
                    const isOnDuty = d.status === 'PAVILION_DUTY';
                    return (
                      '<div class="inner-box row-between text-xs">' +
                        '<div>' +
                          '<div class="font-semibold text-bright">' +
                            escapeHtml(d.name) +
                            ' · <span class="text-muted has-tooltip" data-tooltip-title="Боевой Путь: ' +
                            escapeHtml(math.ARCHETYPE_INFO[d.archetype].name) +
                            '" data-tooltip="' +
                            escapeHtml(formatArchetypeTooltip(d.archetype)) +
                            '">' +
                            math.ARCHETYPE_INFO[d.archetype].name +
                            '</span> · <span class="has-tooltip ' +
                            daoState.colorClass +
                            '" data-tooltip-title="Сердце Дао: ' +
                            escapeHtml(daoLabel) +
                            '" data-tooltip="' +
                            escapeHtml(formatDaoHeartTooltip(d.daoHeart, daoState)) +
                            '">' +
                            escapeHtml(daoLabel) +
                            '</span>' +
                            (isOnDuty && d.assignedStation && math.CRAFT_STATIONS[d.assignedStation]
                              ? ' <span class="text-amber font-mono">[Пост: ' +
                                math.CRAFT_STATIONS[d.assignedStation].name +
                                ']</span>'
                              : '') +
                          '</div>' +
                          '<div class="text-2xs text-muted font-mono">Здоровье: ' +
                            eff.hp +
                            '/' +
                            eff.maxHp +
                            ' · <span class="text-cyan">Щит Ци: ' +
                            eff.qiShield +
                            '/' +
                            eff.maxQiShield +
                            '</span> · Травмы: ' +
                            d.injuries +
                            '/5 · Защита: ' +
                            eff.pDef +
                            '/' +
                            eff.mDef +
                          '</div>' +
                        '</div>' +
                        '<div class="row-wrap">' +
                          '<button class="btn btn-sm btn-emerald" data-action="heal-disciple" data-id="' +
                            d.id +
                            '" data-tooltip-title="Пилюля Исцеления Ци" data-tooltip="Мгновенно восстанавливает 60% от максимального здоровья ученика (в запасе: ' +
                            state.consumables.healingPills +
                            ' шт.)." ' +
                            (state.consumables.healingPills <= 0 ||
                            eff.hp >= eff.maxHp
                              ? 'disabled'
                              : '') +
                          '>+Здоровье</button>' +
                          '<button class="btn btn-sm btn-amber" data-action="cure-injury" data-id="' +
                            d.id +
                            '" data-tooltip-title="Отвар Очищения Меридианов" data-tooltip="Снимает до 2 стаков стихийных травм и разблокирует естественную регенерацию при 5/5 травмах (в запасе: ' +
                            state.consumables.injuryDecoctions +
                            ' шт.)." ' +
                            (state.consumables.injuryDecoctions <= 0 ||
                            d.injuries === 0
                              ? 'disabled'
                              : '') +
                          '>-Травма</button>' +
                          (isOnDuty && d.assignedStation
                            ? '<button class="btn btn-sm" data-action="unassign-station-master" data-station="' +
                              d.assignedStation +
                              '">Снять с павильона</button>'
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
                                    '>Поз.' +
                                    (slotIdx + 1) +
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
          '<h2 style="font-size:16px">Журнал Боевого Похода</h2>' +
          '<span class="text-xs text-muted">Автоскролл к последнему событию</span>' +
        '</div>' +
        '<div id="expedition-log" style="flex:1;max-height:none">' +
          state.expedition.combatLog
            .map(function (line) {
              let cls = '';
              if (line.indexOf('ДЕМОН СЕРДЦА') !== -1) cls = 'text-demonic font-semibold';
              else if (line.indexOf('СЕРДЦЕ ДАО') !== -1) cls = 'text-amber font-semibold';
              else if (line.indexOf('ГИБЕЛЬ В БОЮ') !== -1) cls = 'text-rose font-semibold';
              else if (line.indexOf('Находка на тропе') !== -1) cls = 'text-cyan font-semibold';
              else if (line.indexOf('зачищена') !== -1) cls = 'text-emerald font-semibold';
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
    const stationMeta = math.CRAFT_STATIONS[stationKey];
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
                stationMeta.fullTitle +
              '</span>' +
              ' <span class="text-2xs text-muted">(' +
                stationMeta.profession +
              ')</span>' +
            '</div>' +
            '<div class="text-2xs font-mono">' +
              (master
                ? '<span class="text-emerald font-semibold">Назначенный мастер: ' +
                  escapeHtml(master.name) +
                  ' (Т' +
                  master.realmTier +
                  ' · ' +
                  master.subLevel +
                  '/5 · Опыт ' +
                  master.exp +
                  '/' +
                  master.maxExp +
                  ') · Скорость 100%</span>'
                : '<span class="text-amber font-semibold">Без мастера: доступен только крафт Т1 со штрафом к скорости -50%</span>') +
            '</div>' +
          '</div>' +
          '<div class="row-between">' +
            '<div class="row-wrap">' +
              '<span class="text-2xs text-muted">Назначить мастера:</span>' +
              (state.disciples.length === 0
                ? '<span class="text-2xs text-dim">Нет учеников в секте</span>'
                : state.disciples
                    .map(function (d) {
                      const isThisMaster = master && master.id === d.id;
                      const inCombat = d.status === 'EXPEDITION';
                      const otherStation =
                        d.status === 'PAVILION_DUTY' &&
                        d.assignedStation &&
                        d.assignedStation !== stationKey
                          ? math.CRAFT_STATIONS[d.assignedStation].name
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
                        ' (Т' +
                        d.realmTier +
                        ')' +
                        (isThisMaster
                          ? ' ✓'
                          : inCombat
                          ? ' [В бою]'
                          : otherStation
                          ? ' [' + otherStation + ']'
                          : d.lineupSlot !== null
                          ? ' [Строй ' + (d.lineupSlot + 1) + ']'
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
                  '>Снять мастера</button>'
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
              '<h3 style="font-size:14px">Чертежи и Рецепты: ' +
                stationMeta.name +
              '</h3>' +
              '<span class="text-2xs text-muted has-tooltip" data-tooltip-title="Три Порога Мастерства" data-tooltip="Закон соответствия Царства мастера и Ранга рецепта:\n• Царство мастера = Ранг рецепта: 75% шанс успеха (при провале возвращается 50% редких ресурсов).\n• Царство мастера выше Ранга: 100% успех + 15% шанс Безупречного качества.\n• Рецепт на 1 ранг выше мастера: 25% шанс рискованного крафта и двойной опыт Ци (×2).\n• Рецепт на 2+ ранга выше: заблокировано.">Три Порога Мастерства (Царство мастера и Ранг рецепта)</span>' +
            '</div>' +
            '<div class="scroll-area" style="display:flex;flex-direction:column;gap:6px">' +
              stationRecipes
                .map(function (rec) {
                  const mastery = calculateCraftMastery(master, rec.tier);
                  const affordable = canAfford(rec.cost);
                  const canStart =
                    !mastery.isBlocked && affordable && !activeCraft;
                  const timeSec = (
                    (rec.baseTimeSec || 2) / mastery.speedMultiplier
                  ).toFixed(1);
                  const rareLabel =
                    math.MATERIAL_NAMES[rec.rareMaterialKey] ||
                    rec.rareMaterialKey;

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
                            escapeHtml(rec.name) +
                            ' (Ранг Т' +
                            rec.tier +
                            ')" data-tooltip="' +
                            escapeHtml(rec.description) +
                            '">' +
                            escapeHtml(rec.name) +
                            ' <span class="text-amber font-mono">[Ранг Т' +
                            rec.tier +
                            ']</span>' +
                          '</span>' +
                          '<span class="text-2xs font-mono has-tooltip ' +
                            badgeClass +
                            '" data-tooltip-title="Порог Мастерства (Ранг Т' +
                            rec.tier +
                            ')" data-tooltip="' +
                            escapeHtml(mastery.summaryText || '') +
                            '">' +
                            (mastery.isBlocked
                              ? 'Заблокировано (0%)'
                              : 'Шанс ' +
                                mastery.chancePercent +
                                '% · ' +
                                timeSec +
                                'с' +
                                (mastery.expMultiplier > 1
                                  ? ' · Опыт ×' + mastery.expMultiplier
                                  : '') +
                                (mastery.canFlawless
                                  ? ' · Безупр. ' + mastery.flawlessChancePercent + '%'
                                  : '')) +
                          '</span>' +
                        '</div>' +
                        '<div class="text-2xs text-muted" style="margin-top:2px">' +
                          escapeHtml(rec.description) +
                        '</div>' +
                        '<div class="text-2xs font-mono" style="margin-top:2px;color:#cbd5e1">' +
                          'Цена: ' +
                          rec.cost.spiritStones +
                          ' камн. · ' +
                          rec.cost.bogIron +
                          ' жел. · ' +
                          rec.cost.bloodMoss +
                          ' мха · ' +
                          rec.cost.spiderCarapace +
                          ' панц. <span class="text-muted">(Редкий: ' +
                          rareLabel +
                          ' · Мирный опыт: +' +
                          rec.baseExp * (mastery.expMultiplier || 1) +
                          ')</span>' +
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
                          ? 'Недоступно'
                          : activeCraft && activeCraft.recipeId === rec.id
                          ? 'В работе...'
                          : 'Создать') +
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
                  '<h3 style="font-size:14px">Запасы Эликсиров и Пилюль</h3>' +
                  '<span class="text-2xs font-mono has-tooltip" data-tooltip-title="Запасы Алхимического Котла" data-tooltip="Пилюли Исцеления восстанавливают 60% Здоровья.\nОтвары Очищения снимают до 2 травм меридианов.\nПилюли Прорыва Основы дают +25% к шансу прорыва во II царство.">Исцел.: ' +
                    state.consumables.healingPills +
                    ' · Отвары: ' +
                    state.consumables.injuryDecoctions +
                    ' · Прорыв: ' +
                    state.consumables.breakthroughPills +
                  '</span>' +
                '</div>' +
                '<div class="scroll-area" style="display:flex;flex-direction:column;gap:6px">' +
                  (selectedDisciple
                    ? '<div class="inner-box row-between text-xs">' +
                        '<span>Быстрая медицина для <strong>' +
                          escapeHtml(selectedDisciple.name) +
                        '</strong></span>' +
                        '<div class="row-wrap">' +
                          '<button class="btn btn-sm btn-emerald" data-action="heal-disciple" data-id="' +
                            selectedDisciple.id +
                            '" data-tooltip-title="Пилюля Исцеления Ци" data-tooltip="Мгновенно восстанавливает 60% от максимального здоровья выбранного ученика." ' +
                            (state.consumables.healingPills <= 0 ? 'disabled' : '') +
                          '>+Здоровье (' +
                            state.consumables.healingPills +
                          ')</button>' +
                          '<button class="btn btn-sm btn-amber" data-action="cure-injury" data-id="' +
                            selectedDisciple.id +
                            '" data-tooltip-title="Отвар Очищения Меридианов" data-tooltip="Снимает до 2 стаков стихийных травм и восстанавливает нормальное течение Ци." ' +
                            (state.consumables.injuryDecoctions <= 0 ||
                            selectedDisciple.injuries === 0
                              ? 'disabled'
                              : '') +
                          '>-Травма (' +
                            state.consumables.injuryDecoctions +
                          ')</button>' +
                        '</div>' +
                      '</div>'
                    : '') +
                  '<div class="grid-2">' +
                    Object.keys(math.STAT_PILL_LABELS)
                      .map(function (key) {
                        const pillInfo = math.STAT_PILL_LABELS[key];
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
                            '" data-tooltip="Постоянный эффект: ' +
                            escapeHtml(pillInfo.bonusText) +
                            ' к базовым характеристикам.\nНа складе: ' +
                            stock +
                            ' шт.' +
                            (discSlot
                              ? ' Усвоено учеником: ' +
                                discSlot.consumed +
                                '/' +
                                discSlot.max +
                                '.'
                              : '') +
                            '">' +
                            '<div>' +
                              '<div class="font-semibold text-bright has-tooltip">' +
                                pillInfo.shortStat +
                                ' <span class="text-amber font-mono">(' +
                                stock +
                                ' шт.)</span>' +
                              '</div>' +
                              (discSlot
                                ? '<div class="text-2xs text-muted font-mono">Усвоено: ' +
                                  discSlot.consumed +
                                  '/' +
                                  discSlot.max +
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
                                '>Принять</button>'
                              : '') +
                          '</div>'
                        );
                      })
                      .join('') +
                  '</div>' +
                '</div>'
              : '<div class="row-between" style="flex-shrink:0">' +
                  '<h3 style="font-size:14px">Арсенал Склада (' +
                    state.warehouseGear.length +
                  ')</h3>' +
                  (selectedDisciple
                    ? '<span class="text-2xs text-muted">Экипировать: ' +
                      escapeHtml(selectedDisciple.name) +
                      '</span>'
                    : '') +
                '</div>' +
                '<div class="scroll-area" style="display:flex;flex-direction:column;gap:6px">' +
                  (state.warehouseGear.length === 0
                    ? '<div class="text-xs text-dim" style="text-align:center;padding:24px">На складе нет свободного снаряжения. Назначьте мастера павильона или запустите ремесло Т1 слева.</div>'
                    : state.warehouseGear
                        .map(function (item) {
                          return (
                            '<div class="inner-box row-between text-xs">' +
                              '<div style="min-width:0;flex:1">' +
                                '<div class="font-semibold ' +
                                  (item.isFlawless ? 'text-amber' : 'text-bright') +
                                  ' truncate">' +
                                  escapeHtml(item.name) +
                                  ' <span class="text-2xs text-muted font-mono">[Т' +
                                  (item.tier || 1) +
                                  ']</span>' +
                                '</div>' +
                                '<div class="text-2xs text-muted truncate">' +
                                  escapeHtml(item.description) +
                                '</div>' +
                              '</div>' +
                              (selectedDisciple
                                ? '<button class="btn btn-sm btn-amber" data-action="equip-gear" data-id="' +
                                  selectedDisciple.id +
                                  '" data-gear="' +
                                  item.id +
                                  '">Надеть</button>'
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
            '<h2 style="font-size:16px">Летопись Событий Секты</h2>' +
            '<div class="row-wrap">' +
              '<button class="btn btn-sm ' +
                (state.chronicleFilter === 'ALL' ? 'btn-amber' : '') +
                '" data-action="filter-chronicle" data-cat="ALL">Все (' +
                state.chronicle.length +
              ')</button>' +
              cats
                .map(function (cat) {
                  return (
                    '<button class="btn btn-sm ' +
                    (state.chronicleFilter === cat ? 'btn-amber' : '') +
                    '" data-action="filter-chronicle" data-cat="' +
                    cat +
                    '">' +
                    math.CHRONICLE_CATEGORY_LABELS[cat] +
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
                        (math.CHRONICLE_CATEGORY_LABELS[entry.category] ||
                          entry.category) +
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
        '<h2 style="font-size:16px;flex-shrink:0" class="text-rose">Зал Предков · Павшие в Карстовом Разломе (' +
          state.fallenMemorial.length +
        ')</h2>' +
        '<div class="scroll-area" style="display:flex;flex-direction:column;gap:6px">' +
          (state.fallenMemorial.length === 0
            ? '<div class="text-xs text-dim" style="text-align:center;padding:32px">Ни один ученик ещё не пал в бою.</div>'
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
                        ? '<div class="text-2xs text-emerald" style="margin-top:2px">Спасено соратниками: ' +
                          escapeHtml(f.recoveredGearNames.join(', ')) +
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
            '<div class="text-xs text-amber">Пик Закалки Тела (5-я ступень) → Возведение Основы (II царство)</div>' +
            '<h3 style="font-size:18px;margin-top:2px">Выбор Боевого Пути: ' +
              escapeHtml(disc.name) +
            '</h3>' +
          '</div>' +
          (res.hasEnvPenalty
            ? '<div class="inner-box text-xs text-rose" style="border-color:rgba(244,63,94,0.4)">Ограничение среды: Обитель находится на I ступени («Забытая Нора»), шанс снижен на -35%.</div>'
            : '') +
          '<div style="display:flex;flex-direction:column;gap:6px">' +
            archetypes
              .map(function (archKey) {
                const info = math.ARCHETYPE_INFO[archKey];
                const selected = state.selectedT2Archetype === archKey;
                return (
                  '<button class="inner-box" style="text-align:left;cursor:pointer;' +
                  (selected ? 'border-color:var(--accent-amber);background:#1a2436' : '') +
                  '" data-action="select-t2-arch" data-arch="' +
                  archKey +
                  '" data-tooltip-title="Боевой Путь: ' +
                  escapeHtml(info.name) +
                  '" data-tooltip="' +
                  escapeHtml(formatArchetypeTooltip(archKey)) +
                  '">' +
                    '<div class="row-between text-xs font-semibold text-bright">' +
                      '<span>' + info.name + '</span>' +
                      '<span class="text-amber">' + info.role + '</span>' +
                    '</div>' +
                    '<div class="text-2xs text-muted" style="margin-top:3px">' +
                      info.description +
                    '</div>' +
                    '<div class="text-2xs text-emerald" style="margin-top:2px">' +
                      escapeHtml(formatArchetypeBonusText(archKey)) +
                    '</div>' +
                  '</button>'
                );
              })
              .join('') +
          '</div>' +
          '<button class="inner-box row-between text-xs" style="cursor:pointer" data-action="toggle-break-pill" data-tooltip-title="Пилюля Прорыва Основы" data-tooltip="Концентрированный эликсир духовных трав. Повышает шанс успешного возвышения во II царство на +25% и снижает риск отката Ци при провале." ' +
          (state.consumables.breakthroughPills <= 0 ? 'disabled' : '') +
          '>' +
            '<span class="has-tooltip">Использовать Пилюлю Прорыва Основы (+25% к шансу, запас: ' +
              state.consumables.breakthroughPills +
            ')</span>' +
            '<strong class="text-amber">' +
              (state.usePillOnBreakthrough &&
              state.consumables.breakthroughPills > 0
                ? 'Да'
                : 'Нет') +
            '</strong>' +
          '</button>' +
          '<div class="row-between font-mono text-xs">' +
            '<span class="text-muted">Итоговый шанс возвышения:</span>' +
            '<strong class="text-amber" style="font-size:15px">' +
              res.chancePercent +
            '%</strong>' +
          '</div>' +
          '<div class="row-wrap">' +
            '<button class="btn" style="flex:1" data-action="close-break-modal">Отмена</button>' +
            '<button class="btn btn-amber" style="flex:1" data-action="confirm-breakthrough">Начать Прорыв</button>' +
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
        ? 'В походе (Разлом)'
        : disc.status === 'PAVILION_DUTY' &&
          disc.assignedStation &&
          math.CRAFT_STATIONS[disc.assignedStation]
        ? 'Мастер павильона: ' + math.CRAFT_STATIONS[disc.assignedStation].name
        : 'Отдых в обители';

    const unit = disc;
    const daoState = math.getDaoHeartState(unit);
    const daoLabel = getDaoHeartLabel(unit.daoHeart);
    const daoScaleLeftPct = Math.max(
      0,
      Math.min(100, (unit.daoHeart + 100) / 2)
    );

    return (
      '<div class="modal-backdrop" data-backdrop="disciple-card">' +
        '<div class="modal-panel modal-panel-lg" id="disciple-modal-panel">' +
          '<div class="row-between" style="border-bottom:1px solid var(--border-subtle);padding-bottom:8px;flex-shrink:0">' +
            '<div style="min-width:0;flex:1">' +
              '<h3 style="font-size:18px;word-break:break-word">' +
                escapeHtml(disc.name) +
                ' <span class="text-xs text-amber" style="font-weight:400">· ' +
                  math.getRealmLabel(disc.realmTier, disc.subLevel) +
                '</span>' +
              '</h3>' +
              '<div class="text-2xs text-muted" style="margin-top:2px;word-break:break-word">' +
                '<span class="has-tooltip" data-tooltip-title="Боевой Путь: ' +
                  escapeHtml(math.ARCHETYPE_INFO[disc.archetype].name) +
                  '" data-tooltip="' +
                  escapeHtml(formatArchetypeTooltip(disc.archetype)) +
                  '">' +
                  escapeHtml(math.ARCHETYPE_INFO[disc.archetype].name) +
                '</span>' +
                ' · ' +
                (disc.gender === 'YANG' ? 'Начало Ян' : 'Начало Инь') +
                ' · <span class="has-tooltip" data-tooltip-title="Личная мошна (90/10)" data-tooltip="Ученик удерживает 10% от добытых в походе Камней Духа в личную мошну, а 90% передаёт в казну Обители.">Мошна: ' +
                disc.personalStones +
                ' камн.</span> · Статус: <strong class="text-bright">' +
                escapeHtml(statusLabel) +
                '</strong>' +
              '</div>' +
            '</div>' +
            '<button class="btn btn-sm" data-action="close-disciple-card">Закрыть ✕</button>' +
          '</div>' +
          // Блок врождённых качеств (Корень, Конституция, Характер) и биполярная шкала «Весы Сердца Дао» строго без числовых множителей
          '<div class="inner-box" style="flex-shrink:0;display:flex;flex-direction:column;gap:8px">' +
            '<div class="text-2xs text-muted font-semibold" style="border-bottom:1px solid var(--border-subtle);padding-bottom:4px">Врождённая природа и Весы Сердца Дао</div>' +
            '<div class="grid-3-cols text-xs" style="gap:8px">' +
              '<div style="word-break:break-word" data-tooltip-title="Духовный корень: ' +
                escapeHtml(disc.spiritRoot.name) +
                '" data-tooltip="' +
                escapeHtml((disc.spiritRoot && disc.spiritRoot.description) || '') +
                '">' +
                '<div class="text-2xs text-muted has-tooltip">Духовный корень</div>' +
                '<strong class="' +
                  (disc.spiritRoot && disc.spiritRoot.isDarkRoot
                    ? 'text-demonic'
                    : 'text-bright') +
                  '">' +
                  escapeHtml(disc.spiritRoot.name) +
                '</strong>' +
              '</div>' +
              '<div style="word-break:break-word" data-tooltip-title="Конституция тела: ' +
                escapeHtml(disc.constitution.name) +
                '" data-tooltip="' +
                escapeHtml((disc.constitution && disc.constitution.description) || '') +
                '">' +
                '<div class="text-2xs text-muted has-tooltip">Конституция тела</div>' +
                '<strong class="text-bright">' +
                  escapeHtml(disc.constitution.name) +
                '</strong>' +
              '</div>' +
              '<div style="word-break:break-word" data-tooltip-title="Характер: ' +
                escapeHtml(math.TEMPERAMENT_INFO[disc.temperament].name) +
                '" data-tooltip="' +
                escapeHtml(
                  (math.TEMPERAMENT_INFO[disc.temperament] &&
                    math.TEMPERAMENT_INFO[disc.temperament].summary) ||
                    ''
                ) +
                '">' +
                '<div class="text-2xs text-muted has-tooltip">Характер</div>' +
                '<strong class="text-bright">' +
                  escapeHtml(math.TEMPERAMENT_INFO[disc.temperament].name) +
                '</strong>' +
              '</div>' +
            '</div>' +
            '<div style="border-top:1px solid var(--border-subtle);padding-top:6px;display:flex;flex-direction:column;gap:4px" data-tooltip-title="Сердце Дао: ' +
              escapeHtml(daoLabel) +
              '" data-tooltip="' +
              escapeHtml(formatDaoHeartTooltip(unit.daoHeart, daoState)) +
              '">' +
              '<div class="row-between text-xs">' +
                '<span class="text-muted font-semibold has-tooltip">Сердце Дао:</span>' +
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
                '<span class="text-rose">Бездна Демона</span>' +
                '<span>Равновесие</span>' +
                '<span class="text-amber">Свет Небес</span>' +
              '</div>' +
              '<div class="text-2xs ' +
                daoState.colorClass +
                '" style="opacity:0.9">' +
                escapeHtml(daoState.subtitle || '') +
              '</div>' +
            '</div>' +
          '</div>' +
          // Блок общих боевых характеристик ученика (8 параметров)
          '<div style="flex-shrink:0;display:flex;flex-direction:column;gap:6px">' +
            '<div class="row-between text-2xs text-muted">' +
              '<span class="font-semibold">Общие характеристики ученика (Итоговые / Базовые)</span>' +
              '<span class="font-mono"><span class="text-cyan">Щит Ци: ' +
                eff.qiShield +
                '/' +
                eff.maxQiShield +
                '</span> · Опыт Ци: ' +
                disc.exp +
                '/' +
                disc.maxExp +
              '</span>' +
            '</div>' +
            '<div class="grid-4-cols font-mono" style="text-align:center">' +
              '<div class="inner-box" style="padding:6px 8px" data-tooltip-title="Здоровье и Личный Щит Ци" data-tooltip="Здоровье определяет живучесть ученика. Личный Щит Ци (в скобках) поглощает урон первым в каждой схватке и полностью восстанавливается между волнами врагов."><div class="text-2xs text-muted has-tooltip">Здоровье / Щит Ци</div><div class="text-emerald font-semibold">' +
                eff.hp +
                '/' +
                eff.maxHp +
                ' <span class="text-cyan">(' +
                eff.qiShield +
                ')</span></div></div>' +
              '<div class="inner-box" style="padding:6px 8px" data-tooltip-title="Физическая атака" data-tooltip="Сила ударов оружием и техниками тела. Основной атакующий параметр Послушников, Мечников и Стражей."><div class="text-2xs text-muted has-tooltip">Физ. атака (база ' +
                disc.stats.pAtk +
                ')</div><div class="text-bright font-semibold">' +
                eff.pAtk +
              '</div></div>' +
              '<div class="inner-box" style="padding:6px 8px" data-tooltip-title="Магическая (Духовная) атака" data-tooltip="Мощь заклинаний и печатей Ци. Основной атакующий параметр Адептов Тайного Пламени, пробивающий физическую броню врагов."><div class="text-2xs text-muted has-tooltip">Маг. атака (база ' +
                disc.stats.mAtk +
                ')</div><div class="text-bright font-semibold">' +
                eff.mAtk +
              '</div></div>' +
              '<div class="inner-box" style="padding:6px 8px" data-tooltip-title="Физическая защита" data-tooltip="Снижает входящий физический урон от когтей, клыков и клинков тварей Разлома по гиперболической формуле брони."><div class="text-2xs text-muted has-tooltip">Физ. защита (база ' +
                disc.stats.pDef +
                ')</div><div class="text-bright font-semibold">' +
                eff.pDef +
              '</div></div>' +
              '<div class="inner-box" style="padding:6px 8px" data-tooltip-title="Магическая защита" data-tooltip="Защищает меридианы от духовных атак, ядовитых миазмов и проклятий тварей Разлома."><div class="text-2xs text-muted has-tooltip">Маг. защита (база ' +
                disc.stats.mDef +
                ')</div><div class="text-bright font-semibold">' +
                eff.mDef +
              '</div></div>' +
              '<div class="inner-box" style="padding:6px 8px" data-tooltip-title="Скорость боя" data-tooltip="Определяет очерёдность хода в раунде схватки. Бойцы с высокой скоростью наносят удар раньше врагов."><div class="text-2xs text-muted has-tooltip">Скорость (база ' +
                disc.stats.spd +
                ')</div><div class="text-bright font-semibold">' +
                eff.spd +
              '</div></div>' +
              '<div class="inner-box" style="padding:6px 8px" data-tooltip-title="Шанс критического удара" data-tooltip="Вероятность нанести сокрушительный удар с полуторакратным (×1.5) уроном."><div class="text-2xs text-muted has-tooltip">Шанс крита (база ' +
                disc.stats.crit +
                '%)</div><div class="text-amber font-semibold">' +
                eff.crit +
              '%</div></div>' +
              '<div class="inner-box" style="padding:6px 8px" data-tooltip-title="Уклонение" data-tooltip="Вероятность полностью избежать вражеского удара без потери Щита Ци и Здоровья (максимум до 65%)."><div class="text-2xs text-muted has-tooltip">Уклонение (база ' +
                disc.stats.eva +
                '%)</div><div class="text-emerald font-semibold">' +
                eff.eva +
              '%</div></div>' +
            '</div>' +
          '</div>' +
          '<div class="row-wrap">' +
            '<button class="btn btn-sm" style="flex:1" data-action="heal-disciple" data-id="' +
              disc.id +
              '" data-tooltip-title="Пилюля Исцеления Ци" data-tooltip="Мгновенно восстанавливает 60% от максимального здоровья ученика. Снимает последствия боевых ранений." ' +
              (state.consumables.healingPills <= 0 || eff.hp >= eff.maxHp
                ? 'disabled'
                : '') +
            '>Пилюля Исцеления (' +
              state.consumables.healingPills +
            ')</button>' +
            '<button class="btn btn-sm" style="flex:1" data-action="cure-injury" data-id="' +
              disc.id +
              '" data-tooltip-title="Отвар Очищения Меридианов" data-tooltip="Снимает до 2 стаков внутренних травм меридианов. При 5/5 травмах естественное исцеление заблокировано до приёма отвара." ' +
              (state.consumables.injuryDecoctions <= 0 || disc.injuries === 0
                ? 'disabled'
                : '') +
            '>Отвар Очищения (' +
              state.consumables.injuryDecoctions +
            ') · Травмы: ' +
              disc.injuries +
            '/5</button>' +
            (ready
              ? '<button class="btn btn-sm btn-amber" data-action="breakthrough" data-id="' +
                disc.id +
                '" data-tooltip-title="Возвышение Ступени Ци" data-tooltip="Начать попытку прорыва на следующую ступень культивации.">Совершить Прорыв!</button>'
              : '') +
          '</div>' +
          '<div class="grid-2 divider-top">' +
            '<div class="inner-box" style="display:flex;flex-direction:column;justify-content:space-between;gap:8px">' +
              '<div>' +
                '<div class="row-between" style="margin-bottom:6px">' +
                  '<span class="text-xs font-semibold text-bright">Потенциал пилюль (6 видов)</span>' +
                  '<span class="text-2xs text-muted">Усвоено / Лимит</span>' +
                '</div>' +
                '<div class="grid-3-cols">' +
                  statKeys
                    .map(function (key) {
                      const slot = disc.pillGrid[key];
                      const inStock = state.consumables.statPills[key] || 0;
                      const isFull = slot.consumed >= slot.max;
                      const pillMeta = math.STAT_PILL_LABELS[key];
                      return (
                        '<button class="inner-box" style="text-align:left;cursor:pointer;padding:6px 8px" data-action="feed-stat-pill" data-id="' +
                        disc.id +
                        '" data-stat="' +
                        key +
                        '" data-tooltip-title="' +
                        escapeHtml(pillMeta.name) +
                        '" data-tooltip="' +
                        escapeHtml(
                          pillMeta.bonusText +
                            '. Лимит усвоения зависит от Конституции тела ученика (' +
                            slot.consumed +
                            ' из ' +
                            slot.max +
                            ').'
                        ) +
                        '" ' +
                        (isFull || inStock <= 0 ? 'disabled' : '') +
                        '>' +
                          '<div class="row-between text-2xs">' +
                            '<span class="font-semibold text-bright">' +
                              pillMeta.shortStat +
                            '</span>' +
                            '<span class="text-amber font-mono">' +
                              slot.consumed +
                              '/' +
                              slot.max +
                            '</span>' +
                          '</div>' +
                          '<div class="text-2xs text-muted" style="margin-top:2px">Склад: ' +
                            inStock +
                          ' шт.</div>' +
                        '</button>'
                      );
                    })
                    .join('') +
                '</div>' +
              '</div>' +
              '<div class="row-between text-2xs text-muted">' +
                '<span>Нажмите на ячейку для приёма</span>' +
                '<button class="btn btn-sm" data-action="goto-crafts-potential">К Алхимику →</button>' +
              '</div>' +
            '</div>' +
            '<div class="inner-box" style="display:flex;flex-direction:column;justify-content:space-between;gap:8px">' +
              '<div>' +
                '<div class="row-between" style="margin-bottom:6px">' +
                  '<span class="text-xs font-semibold text-bright">Слоты экипировки</span>' +
                  '<span class="text-2xs text-muted">Свободно на складе: ' +
                    state.warehouseGear.length +
                  '</span>' +
                '</div>' +
                '<div class="grid-2x2 text-xs" style="margin-bottom:6px">' +
                  '<div class="inner-box" style="padding:6px 8px">' +
                    '<div class="row-between text-2xs text-muted">' +
                      '<span>Оружие</span>' +
                      (disc.equippedWeapon
                        ? '<button class="btn btn-sm" style="padding:1px 6px;min-height:20px;font-size:10px" data-action="unequip-gear" data-id="' +
                          disc.id +
                          '" data-slot="WEAPON">Снять</button>'
                        : '') +
                    '</div>' +
                    '<div class="font-semibold text-bright truncate" style="margin-top:2px">' +
                      escapeHtml(
                        (disc.equippedWeapon && disc.equippedWeapon.name) ||
                          'Не надето'
                      ) +
                    '</div>' +
                  '</div>' +
                  '<div class="inner-box" style="padding:6px 8px">' +
                    '<div class="row-between text-2xs text-muted">' +
                      '<span>Доспех</span>' +
                      (disc.equippedArmor
                        ? '<button class="btn btn-sm" style="padding:1px 6px;min-height:20px;font-size:10px" data-action="unequip-gear" data-id="' +
                          disc.id +
                          '" data-slot="ARMOR">Снять</button>'
                        : '') +
                    '</div>' +
                    '<div class="font-semibold text-bright truncate" style="margin-top:2px">' +
                      escapeHtml(
                        (disc.equippedArmor && disc.equippedArmor.name) ||
                          'Не надето'
                      ) +
                    '</div>' +
                  '</div>' +
                '</div>' +
                '<div class="scroll-area" style="max-height:84px">' +
                  (state.warehouseGear.length === 0
                    ? '<div class="text-2xs text-dim">На складе нет свободного оружия или доспехов.</div>'
                    : state.warehouseGear
                        .map(function (g) {
                          return (
                            '<div class="inner-box row-between text-2xs" style="margin-bottom:4px;padding:5px 8px">' +
                              '<span class="truncate">' +
                                escapeHtml(g.name) +
                              '</span>' +
                              '<button class="btn btn-sm btn-amber" style="padding:2px 8px;min-height:22px" data-action="equip-gear" data-id="' +
                                disc.id +
                                '" data-gear="' +
                                g.id +
                                '">Надеть</button>' +
                            '</div>'
                          );
                        })
                        .join('')) +
                '</div>' +
              '</div>' +
              '<div class="row-between text-2xs text-muted">' +
                '<span>При гибели возвращается соратниками</span>' +
                '<button class="btn btn-sm" data-action="goto-crafts-forge">В Кузню →</button>' +
              '</div>' +
            '</div>' +
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
        '" data-action="set-abode-sub" data-sub="SANCTUARY">Обитель и Чайная</button>' +
        '<button class="btn-tab ' +
        (state.abodeSubTab === 'ROSTER' ? 'active' : '') +
        '" data-action="set-abode-sub" data-sub="ROSTER">Состав (' +
        state.disciples.length +
        ')' +
        (anyReadyBreakthrough ? ' · Прорыв!' : '') +
        '</button>';
    } else if (state.activeTab === 'EXPEDITION') {
      tabsHtml =
        '<button class="btn-tab ' +
        (state.expeditionSubTab === 'ARENA' ? 'active' : '') +
        '" data-action="set-exp-sub" data-sub="ARENA">Поле Боя (Ярус ' +
        state.expedition.depthStage +
        ')</button>' +
        '<button class="btn-tab ' +
        (state.expeditionSubTab === 'LINEUP' ? 'active' : '') +
        '" data-action="set-exp-sub" data-sub="LINEUP">Строй и Лечение</button>' +
        '<button class="btn-tab ' +
        (state.expeditionSubTab === 'LOG' ? 'active' : '') +
        '" data-action="set-exp-sub" data-sub="LOG">Журнал Похода</button>';
    } else if (state.activeTab === 'CRAFTS') {
      tabsHtml = Object.keys(math.CRAFT_STATIONS)
        .map(function (stKey) {
          const stMeta = math.CRAFT_STATIONS[stKey];
          const master = getStationMaster(stKey);
          const busy =
            state.craftStations[stKey] && state.craftStations[stKey].activeCraft;
          return (
            '<button class="btn-tab ' +
            (state.craftsSubTab === stKey ? 'active' : '') +
            '" data-action="set-crafts-sub" data-sub="' +
            stKey +
            '">' +
            stMeta.name +
            (master ? ' · ' + escapeHtml(master.name) : ' · Без мастера') +
            (busy ? ' ⚒' : '') +
            '</button>'
          );
        })
        .join('');
    } else {
      tabsHtml =
        '<button class="btn-tab ' +
        (state.chronicleSubTab === 'EVENTS' ? 'active' : '') +
        '" data-action="set-chr-sub" data-sub="EVENTS">Летопись Событий (' +
        state.chronicle.length +
        ')</button>' +
        '<button class="btn-tab ' +
        (state.chronicleSubTab === 'MEMORIAL' ? 'active' : '') +
        '" data-action="set-chr-sub" data-sub="MEMORIAL">Зал Предков (' +
        state.fallenMemorial.length +
        ')</button>';
    }

    return (
      '<div class="subnav-bar">' +
        '<div class="subnav-tabs">' + tabsHtml + '</div>' +
        '<div class="subnav-status">' +
          (state.expedition.active
            ? '<button class="btn btn-sm btn-rose font-mono" data-action="goto-arena">Бой: Ярус ' +
              state.expedition.depthStage +
              ' · В.' +
              state.expedition.waveInStage +
              '/3</button>'
            : '') +
          (lootBufferTotal > 0
            ? '<button class="btn btn-sm btn-amber font-mono" data-action="claim-loot">Забрать буфер (+' +
              lootBufferTotal +
              ')</button>'
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
          '<a class="brand-title" data-action="set-tab" data-tab="ABODE">Обитель Бессмертных</a>' +
          '<div class="res-strip">' +
            '<span class="has-tooltip" data-tooltip-title="Камни Духа" data-tooltip="Основная духовная валюта секты. Используется для найма послушников, возвышения Обители и запуска ремёсел.">Камни: <strong class="text-amber">' +
              state.resources.spiritStones +
            '</strong></span>' +
            '<span class="res-sep">·</span>' +
            '<span class="has-tooltip" data-tooltip-title="Болотное железо" data-tooltip="Тяжёлая руда из Карстового Разлома. Основной материал для ковки мечей в Кузнечном Горне.">Железо: <strong class="text-bright">' +
              state.resources.bogIron +
            '</strong></span>' +
            '<span class="res-sep">·</span>' +
            '<span class="has-tooltip" data-tooltip-title="Кровавый мох" data-tooltip="Духовная трава Разлома, впитавшая ци древних чудовищ. Необходима для варки эликсиров и пилюль в Алхимическом Котле.">Мох: <strong class="text-rose">' +
              state.resources.bloodMoss +
            '</strong></span>' +
            '<span class="res-sep">·</span>' +
            '<span class="has-tooltip" data-tooltip-title="Панцирь паука" data-tooltip="Прочный хитин пещерных арахнидов. Основной материал для пошива защитных облачений в Павильоне Брони.">Панцирь: <strong class="text-emerald">' +
              state.resources.spiderCarapace +
            '</strong></span>' +
            '<span class="res-sep">·</span>' +
            '<span class="has-tooltip" data-tooltip-title="Запас Медицины" data-tooltip="Пилюли Исцеления (восстанавливают Здоровье) / Отвары Очищения (снимают тяжёлые внутренние травмы).">Пилюли/Отвары: <strong class="text-bright">' +
              state.consumables.healingPills +
              '/' +
              state.consumables.injuryDecoctions +
            '</strong></span>' +
          '</div>' +
          '<div class="header-actions">' +
            '<button class="btn btn-sm font-mono" data-action="manual-save" data-tooltip-title="Сохранение" data-tooltip="Автосохранение активно (нажмите для мгновенного сохранения прогресса)">' +
              'Автосохр.: ' + escapeHtml(state.lastSavedAt || getTimeStr()) +
            '</button>' +
            '<button class="btn btn-sm" data-action="toggle-sound" data-tooltip-title="Звуковое сопровождение" data-tooltip="Включить или отключить звуковые эффекты обители">' +
              (state.soundMuted ? 'Звук выкл.' : 'Звук вкл.') +
            '</button>' +
            '<button class="btn btn-sm" data-action="reset-game" data-tooltip-title="Сброс прогресса" data-tooltip="Начать летопись секты с чистого листа">Сброс</button>' +
            '<button class="btn btn-sm btn-amber" data-action="export-html" data-tooltip-title="Автономный слепок" data-tooltip="Выгрузить автономный HTML-слепок текущего сохранения в файл">Слепок</button>' +
          '</div>' +
        '</header>' +
        renderSubnavBar(anyReadyBreakthrough, lootBufferTotal) +
        '<main class="workspace">' +
          activeWorkspaceHtml +
        '</main>' +
        renderDiscipleCardModal() +
        renderBreakthroughModal() +
        '<nav class="bottom-nav" aria-label="Нижняя навигация">' +
          '<button class="bottom-nav-btn ' +
            (state.activeTab === 'ABODE' ? 'active' : '') +
            '" data-action="set-tab" data-tab="ABODE">' +
            '<span>Обитель (' + state.disciples.length + ')</span>' +
          '</button>' +
          '<button class="bottom-nav-btn ' +
            (state.activeTab === 'EXPEDITION' ? 'active' : '') +
            '" data-action="set-tab" data-tab="EXPEDITION">' +
            '<span>' +
              (state.expedition.active
                ? 'Разлом (Ярус ' + state.expedition.depthStage + ')'
                : 'Разлом') +
            '</span>' +
          '</button>' +
          '<button class="bottom-nav-btn ' +
            (state.activeTab === 'CRAFTS' ? 'active' : '') +
            '" data-action="set-tab" data-tab="CRAFTS">' +
            '<span>Ремёсла</span>' +
          '</button>' +
          '<button class="bottom-nav-btn ' +
            (state.activeTab === 'CHRONICLE' ? 'active' : '') +
            '" data-action="set-tab" data-tab="CHRONICLE">' +
            '<span>Летопись</span>' +
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
