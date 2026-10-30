/**
 * ГЕНЕРАТОР АВТОНОМНОГО HTML+JS ФАЙЛА
 * Позволяет сохранить игру в виде единого HTML-файла с текущим состоянием Секты.
 */

import { Disciple, SectResources } from '../types/game';

export function downloadStandaloneHtmlBundle(
  sectLevel: 1 | 2,
  resources: SectResources,
  disciples: Disciple[]
) {
  const initialStateJson = JSON.stringify({
    sectLevel,
    resources,
    disciplesCount: disciples.length,
  });

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<title>Обитель Бессмертных — Хроники Секты</title>
<style>
  :root {
    --bg: #0b0e14;
    --panel: #131822;
    --border: #252f42;
    --text: #e6e1d6;
    --muted: #94a3b8;
    --gold: #d97706;
    --jade: #10b981;
    --crimson: #e11d48;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.5;
    padding: 16px;
    max-width: 980px;
    margin: 0 auto;
  }
  h1, h2, h3 { font-family: Georgia, serif; font-weight: 600; color: #f3efe6; }
  .header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 12px 16px; background: var(--panel); border: 1px solid var(--border);
    border-radius: 12px; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;
  }
  .res-bar {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px; margin-bottom: 16px;
  }
  .card {
    background: var(--panel); border: 1px solid var(--border);
    border-radius: 12px; padding: 16px; margin-bottom: 16px;
  }
  .btn {
    background: #1e293b; color: #f8fafc; border: 1px solid #334155;
    padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 13px;
    font-weight: 600; transition: opacity 0.15s;
  }
  .btn:hover { opacity: 0.9; }
  .btn-gold { background: var(--gold); color: #0b0e14; border-color: #f59e0b; }
  .btn-jade { background: #059669; color: #ffffff; border-color: #10b981; }
  .btn-danger { background: #9f1239; color: #ffffff; border-color: #e11d48; }
  .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 16px; }
  .stat-row { font-family: monospace; font-size: 12px; color: var(--muted); margin-top: 6px; }
  .log { max-height: 220px; overflow-y: auto; font-size: 12px; font-family: monospace; background: #080b10; padding: 12px; border-radius: 8px; border: 1px solid var(--border); }
  .log div { padding: 3px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1 id="sectTitle">Обитель: Забытая Нора (I ступень)</h1>
      <div style="font-size:12px;color:var(--muted)">Обитель Бессмертных · Автономная сборка</div>
    </div>
    <button class="btn btn-gold" onclick="upgradeSect()" id="upgradeBtn">Возвысить до Твердыни Глубин (80 камней)</button>
  </div>

  <div class="res-bar" id="resBar"></div>

  <div class="grid-2">
    <div class="card">
      <h2>Чайный Павильон и Ученики</h2>
      <p style="font-size:12px;color:var(--muted);margin:6px 0 12px">Найм послушников (первый бесплатно, далее 25 камней). При потере всех адептов доступна «Милость Небес».</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
        <button class="btn btn-gold" onclick="recruitDisciple()" id="recruitBtn">Нанять ученика (Бесплатно: 1)</button>
        <button class="btn btn-jade" onclick="heavensGrace()" id="graceBtn" style="display:none">Воззвать к Милости Небес</button>
      </div>
      <div id="disciplesList"></div>
    </div>

    <div class="card">
      <h2>Карстовый Разлом (Поход)</h2>
      <p style="font-size:12px;color:var(--muted);margin:6px 0 12px">Авангард принимает 80% вражеских ударов · Разделение добычи: 90% в Казну, 10% в мошну учеников.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
        <button class="btn btn-jade" onclick="toggleExpedition()" id="expBtn">Отправить отряд в Разлом</button>
        <button class="btn btn-gold" onclick="claimLoot()">Собрать добычу</button>
        <button class="btn btn-danger" onclick="retreatExpedition()">Отступить в Обитель</button>
      </div>
      <div id="combatStatus" style="font-size:13px;margin-bottom:12px;color:#cbd5e1">Отряд в Обители.</div>
      <h3 style="font-size:14px;margin-bottom:8px">Павильон Ремёсел (Кузнец и Алхимик)</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
        <button class="btn" onclick="craftHealPill()">Алхимик: Пилюля Исцеления (3 мха)</button>
        <button class="btn" onclick="craftInjuryDecoction()">Алхимик: Отвар Очищения (3 панциря)</button>
        <button class="btn" onclick="craftBlade()">Кузнец: Клинок Болотного Железа (5 железа)</button>
      </div>
      <h3 style="font-size:14px;margin-bottom:6px">Летопись Секты</h3>
      <div class="log" id="chronicle"></div>
    </div>
  </div>

<script>
const exportedSnapshot = ${initialStateJson};
let state = {
  sectLevel: exportedSnapshot.sectLevel || 1,
  freeRecruits: 1,
  res: exportedSnapshot.resources || { spiritStones: 45, bogIron: 8, bloodMoss: 8, spiderCarapace: 6 },
  lootBuffer: { spiritStones: 0, bogIron: 0, bloodMoss: 0, spiderCarapace: 0 },
  disciples: [],
  expeditionActive: false,
  enemy: null
};

function logMsg(msg) {
  const el = document.getElementById('chronicle');
  const d = document.createElement('div');
  d.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
  el.prepend(d);
}

function recruitDisciple(isGrace = false) {
  if (!isGrace && state.freeRecruits <= 0 && state.res.spiritStones < 25) {
    return logMsg('Недостаточно духовных камней (требуется 25).');
  }
  if (!isGrace) {
    if (state.freeRecruits > 0) state.freeRecruits--;
    else state.res.spiritStones -= 25;
  }
  const names = ['Линь Сюань', 'Су Юэ', 'Фэн Чэнь', 'Бай Лань', 'Чжао Мин', 'Е Цин'];
  const temps = ['Обычный', 'Трусливый', 'Жадный', 'Безрассудный'];
  const gender = Math.random() < 0.5 ? 'Ян' : 'Инь';
  const maxHp = 90 + Math.floor(Math.random() * 25);
  const d = {
    id: Date.now() + Math.random(),
    name: names[Math.floor(Math.random() * names.length)],
    gender,
    temp: temps[Math.floor(Math.random() * temps.length)],
    tier: 1, level: 1, exp: 0, maxExp: 60,
    hp: maxHp, maxHp,
    atk: 14 + Math.floor(Math.random() * 5),
    def: 10 + Math.floor(Math.random() * 5),
    injuries: 0, daoHeart: false, purse: 4
  };
  state.disciples.push(d);
  logMsg('В Чайном павильоне принят послушник: ' + d.name + ' (' + d.gender + ', ' + d.temp + ').');
  render();
}

function heavensGrace() {
  logMsg('Небеса откликнулись на зов! В Обитель прибыл новый послушник.');
  recruitDisciple(true);
}

function toggleExpedition() {
  if (state.disciples.length === 0) return logMsg('Нет живых учеников для похода.');
  state.expeditionActive = !state.expeditionActive;
  if (state.expeditionActive) {
    spawnEnemy();
    logMsg('Отряд спустился в Карстовый Разлом.');
  }
  render();
}

function spawnEnemy() {
  state.enemy = { name: 'Пещерный Паук-Ткач', hp: 58, maxHp: 58, atk: 15, def: 10 };
}

function retreatExpedition() {
  if (!state.expeditionActive) return;
  state.expeditionActive = false;
  state.disciples.forEach(d => {
    if (d.hp / d.maxHp < 0.4) {
      d.injuries = Math.min(5, d.injuries + 1);
      logMsg(d.name + ' отступил тяжело раненым и получил стихийную травму (' + d.injuries + '/5).');
    }
  });
  logMsg('Отряд вернулся под защиту Обители.');
  render();
}

function claimLoot() {
  const b = state.lootBuffer;
  const totalStones = b.spiritStones;
  const sectStones = Math.floor(totalStones * 0.9);
  const discStones = totalStones - sectStones;
  state.res.spiritStones += sectStones;
  state.res.bogIron += b.bogIron;
  state.res.bloodMoss += b.bloodMoss;
  state.res.spiderCarapace += b.spiderCarapace;
  if (state.disciples.length > 0 && discStones > 0) {
    state.disciples[0].purse += discStones;
  }
  state.lootBuffer = { spiritStones: 0, bogIron: 0, bloodMoss: 0, spiderCarapace: 0 };
  logMsg('Добыча распределена: +' + sectStones + ' камней в Казну Секты, +' + discStones + ' в мошну учеников.');
  render();
}

function upgradeSect() {
  if (state.sectLevel >= 2) return;
  if (state.res.spiritStones < 80) return logMsg('Требуется 80 духовных камней для возвышения Обители.');
  state.res.spiritStones -= 80;
  state.sectLevel = 2;
  logMsg('Обитель возвышена до «Твердыни Глубин» (II ступень)!');
  render();
}

function craftHealPill() {
  if (state.res.bloodMoss < 3) return logMsg('Недостаточно кровавого мха (нужно 3).');
  state.res.bloodMoss -= 3;
  state.disciples.forEach(d => { d.hp = Math.min(d.maxHp, d.hp + 45); });
  logMsg('Алхимик сварил Пилюлю Исцеления: здоровье отряда восстановлено.');
  render();
}

function craftInjuryDecoction() {
  if (state.res.spiderCarapace < 3) return logMsg('Недостаточно панцирей паука (нужно 3).');
  state.res.spiderCarapace -= 3;
  state.disciples.forEach(d => { d.injuries = 0; });
  logMsg('Алхимик приготовил Отвар Очищения: стихийные травмы сняты.');
  render();
}

function craftBlade() {
  if (state.res.bogIron < 5) return logMsg('Недостаточно болотного железа (нужно 5).');
  state.res.bogIron -= 5;
  state.disciples.forEach(d => { d.atk += 4; });
  logMsg('Кузнец выковал Клинки Болотного Железа (+4 к атаке отряда).');
  render();
}

function breakThrough(idx) {
  const d = state.disciples[idx];
  if (!d || d.exp < d.maxExp) return;
  d.exp = 0;
  if (d.level < 5) {
    d.level++;
    d.maxExp = Math.round(d.maxExp * 1.35);
    d.maxHp += 15; d.hp = d.maxHp; d.atk += 3; d.def += 2;
    logMsg(d.name + ' совершил прорыв на ' + d.level + '-ю ступень Закалки Тела!');
  } else {
    d.tier = 2; d.level = 1; d.maxExp = 180; d.maxHp += 40; d.hp = d.maxHp; d.atk += 10;
    logMsg(d.name + ' вступил в царство Возведения Основы!');
  }
  render();
}

setInterval(() => {
  if (state.expeditionActive && state.disciples.length > 0) {
    if (!state.enemy) spawnEnemy();
    const e = state.enemy;
    state.disciples.forEach(d => {
      if (!e || e.hp <= 0) return;
      const dmg = Math.max(1, Math.round(d.atk * (100 / (100 + e.def)) * (0.9 + Math.random() * 0.2)));
      e.hp = Math.max(0, e.hp - dmg);
    });
    if (e.hp <= 0) {
      state.lootBuffer.spiritStones += 3;
      state.lootBuffer.bogIron += 1;
      state.lootBuffer.bloodMoss += 1;
      state.lootBuffer.spiderCarapace += 1;
      state.disciples.forEach(d => {
        const expGain = (d.tier > state.sectLevel) ? 7 : 14;
        d.exp = Math.min(d.maxExp, d.exp + expGain);
      });
      logMsg('Побеждён ' + e.name + '! Трофеи сложены в буфер похода.');
      spawnEnemy();
    } else {
      const targetIdx = (Math.random() < 0.8 || state.disciples.length === 1) ? 0 : Math.floor(Math.random() * state.disciples.length);
      const target = state.disciples[targetIdx];
      const eDmg = Math.max(1, Math.round(e.atk * (100 / (100 + target.def)) * (0.9 + Math.random() * 0.2)));
      target.hp = Math.max(0, target.hp - eDmg);
      if (target.hp > 0 && target.hp / target.maxHp < 0.1 && !target.daoHeart) {
        target.daoHeart = true;
        target.atk += 5;
        logMsg('Сердце Дао! ' + target.name + ' выжил на грани гибели и обрёл просветление!');
      }
      if (target.hp <= 0) {
        logMsg('Павший в бою: ' + target.name + ' погиб в Разломе. Соратники вернули снаряжение на склад.');
        state.disciples.splice(targetIdx, 1);
        if (state.disciples.length === 0) state.expeditionActive = false;
      }
    }
  } else {
    state.disciples.forEach(d => {
      if (d.injuries < 5 && d.hp < d.maxHp) {
        d.hp = Math.min(d.maxHp, d.hp + (state.sectLevel === 2 ? 10 : 4));
      }
      if (d.purse >= 8 && state.res.bloodMoss > 0 && d.hp < d.maxHp) {
        d.purse -= 4; state.res.spiritStones += 4; state.res.bloodMoss -= 1;
        d.hp = Math.min(d.maxHp, d.hp + 30);
        logMsg(d.name + ' выкупил со склада кровавый мох за 4 камня в Казну и исцелил раны.');
      }
    });
  }
  render();
}, 1250);

function render() {
  document.getElementById('sectTitle').textContent = state.sectLevel === 2 ? 'Обитель: Твердыня Глубин (II ступень)' : 'Обитель: Забытая Нора (I ступень)';
  document.getElementById('recruitBtn').textContent = state.freeRecruits > 0 ? 'Нанять ученика (Бесплатно: 1)' : 'Нанять ученика (25 камней)';
  document.getElementById('graceBtn').style.display = (state.disciples.length === 0 && state.res.spiritStones < 25 && state.freeRecruits <= 0) ? 'inline-block' : 'none';
  document.getElementById('expBtn').textContent = state.expeditionActive ? 'Завершить поход' : 'Отправить отряд в Разлом';
  document.getElementById('resBar').innerHTML = [
    ['Духовные камни (Казна)', state.res.spiritStones],
    ['Болотное железо', state.res.bogIron],
    ['Кровавый мох', state.res.bloodMoss],
    ['Панцирь паука', state.res.spiderCarapace],
    ['Буфер похода (камни)', state.lootBuffer.spiritStones]
  ].map(([k, v]) => '<div class="card" style="margin:0;padding:10px"><div style="font-size:11px;color:var(--muted)">' + k + '</div><div style="font-size:18px;font-weight:700;font-family:monospace">' + v + '</div></div>').join('');

  document.getElementById('combatStatus').textContent = state.expeditionActive && state.enemy
    ? 'Бой в Разломе: ' + state.enemy.name + ' (Здоровье ' + state.enemy.hp + '/' + state.enemy.maxHp + ')'
    : 'Отряд отдыхает в Обители.';

  document.getElementById('disciplesList').innerHTML = state.disciples.map((d, i) =>
    '<div style="border-top:1px solid var(--border);padding:10px 0">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<strong>Позиция ' + (i+1) + ': ' + d.name + ' (' + d.gender + ' · ' + d.temp + ')</strong>' +
        (d.exp >= d.maxExp ? '<button class="btn btn-gold" onclick="breakThrough(' + i + ')">Прорыв!</button>' : '<span style="font-size:12px;color:var(--muted)">Ступень ' + d.level + (d.level===5?' (Пик)':'') + '</span>') +
      '</div>' +
      '<div class="stat-row">Здоровье: ' + d.hp + '/' + d.maxHp + ' · Атака: ' + d.atk + ' · Защита: ' + d.def + ' · Опыт: ' + d.exp + '/' + d.maxExp + ' · Мошна: ' + d.purse + ' камней · Травмы: ' + d.injuries + '/5' + (d.daoHeart ? ' · Сердце Дао' : '') + '</div>' +
    '</div>'
  ).join('') || '<div style="color:var(--muted);font-size:13px">В секте пока нет учеников. Примите послушника в Чайном павильоне.</div>';
}

recruitDisciple();
</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'idle-sect-manager-alpha.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
