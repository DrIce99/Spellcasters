// player-info.page.js - Statistiche del giocatore e grafici radar (Chart.js da CDN)
import { initColorTheme, onColorThemeChange } from '../ui/theme.js';
import { getPlayerData, getCurrentUsername, spendSkillPoint } from '../services/player-db.js';
import { getExpToNext } from '../game/progression.js';
import {
  SKILLS, BASE_DAMAGE, SPATIAL_DAMAGE_AREA_UNIT, computePlayerStats, getSkillValue, isSkillMaxed, getAtkMultiplier
} from '../game/player-stats.js';
import { ELEMENTS, PROJECTIONS, getElementColor } from '../game/elements.js';

initColorTheme();

function getUsernameFromQuery() {
  return new URLSearchParams(window.location.search).get('user');
}

function loadChartJs(callback) {
  if (window.Chart) return callback();
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
  script.onload = callback;
  document.head.appendChild(script);
}

function getRadarDataAffinita(affinita) {
  const elementi = ELEMENTS;
  const colori = {
    fuoco: '#ff5555',
    acqua: '#00eaff',
    aria: '#aaaaee',
    terra: 'rgba(180,160,100)',
    fulmine: '#ffff55'
  };
  return {
    labels: elementi,
    data: elementi.map(e => affinita[e] || 0),
    colori: elementi.map(e => colori[e])
  };
}

function getRadarDataPredisposizione(predisposizione) {
  const tipi = Object.keys(predisposizione);
  const labels = tipi.length > 0 ? tipi : PROJECTIONS;
  return {
    labels,
    data: labels.map(t => predisposizione[t] || 0)
  };
}

let radarChart1 = null;
let radarChart2 = null;

// Colori dei grafici presi dalle variabili del tema (giorno/notte)
function getThemeColors() {
  const css = getComputedStyle(document.body);
  const read = (name) => css.getPropertyValue(name).trim();
  return { text: read('--text'), accent: read('--accent'), accent2: read('--accent-2'), line: read('--line') };
}

let lastChartData = null;

// Un canvas non si ridisegna quando arriva un font web: se i grafici partono prima che Cinzel
// sia caricato, le etichette restano per sempre nel font di riserva. Si aspetta il font.
function whenChartFontsReady() {
  if (!document.fonts?.load) return Promise.resolve();
  return document.fonts.load("600 14px 'Cinzel'").catch(() => {});
}

function renderRadarCharts(affinita, predisposizione) {
  lastChartData = { affinita, predisposizione };
  const theme = getThemeColors();
  loadChartJs(() => whenChartFontsReady().then(() => {
    // Il resto dei testi di Chart.js (es. tooltip) usa il font della pagina
    window.Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
    const data1 = getRadarDataAffinita(affinita);
    const data2 = getRadarDataPredisposizione(predisposizione);
    if (radarChart1) radarChart1.destroy();
    if (radarChart2) radarChart2.destroy();

    radarChart1 = new window.Chart(document.getElementById('affinity-radar').getContext('2d'), {
      type: 'radar',
      data: {
        labels: data1.labels,
        datasets: [{
          label: 'Utilizzo Elementi',
          data: data1.data,
          backgroundColor: theme.accent + '22',
          borderColor: theme.accent,
          pointBackgroundColor: data1.colori,
          pointBorderColor: 'rgba(127,92,255,0.0)',
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          r: {
            angleLines: { color: theme.line },
            grid: { color: theme.line },
            pointLabels: { font: { family: 'Cinzel', size: 14, weight: '600' }, color: theme.text },
            ticks: { display: false }
          }
        },
        responsive: false
      }
    });

    radarChart2 = new window.Chart(document.getElementById('predisposition-radar').getContext('2d'), {
      type: 'radar',
      data: {
        labels: data2.labels,
        datasets: [{
          label: 'Utilizzo Proiezioni',
          data: data2.data,
          backgroundColor: theme.accent2 + '2e',
          borderColor: theme.accent2,
          pointBackgroundColor: theme.accent2,
          borderWidth: 2
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { r: { angleLines: { color: theme.line }, grid: { color: theme.line }, pointLabels: { font: { family: 'Cinzel', size: 14, weight: '600' }, color: theme.text }, ticks: { display: false } } },
        responsive: false
      }
    });
  }));
}

function showError(message) {
  document.getElementById('player-info-card').innerHTML = '<h2>Errore</h2><p></p>';
  document.querySelector('#player-info-card p').textContent = message;
}

const round2 = (n) => (typeof n === 'number' ? Number(n.toFixed(2)) : 0);

async function renderPlayerInfo() {
  const username = getUsernameFromQuery();
  if (!username) {
    showError('Username non specificato.');
    return;
  }
  const data = await getPlayerData(username);
  if (!data) {
    showError('Utente non trovato. Effettua di nuovo il login.');
    return;
  }
  const livello = data.livello || 1;
  document.getElementById('info-username').textContent = data.username;
  document.getElementById('info-level').textContent = livello;
  document.getElementById('info-exp').textContent = `${round2(data.esperienza)}/${getExpToNext(livello)}`;
  const stats = computePlayerStats(data);
  document.getElementById('info-mana').textContent = `${round2(Math.min(data.mana ?? stats.mp, stats.mp))}/${stats.mp}`;
  document.getElementById('info-vittorie').textContent = data.vittorie || 0;
  document.getElementById('info-partite').textContent = data.partite || 0;
  renderRadarCharts(data.affinita || {}, data.proiezioniUsate || {});
  renderStats(data);
}

// ============================================================
// STATISTICHE E PUNTI ABILITÀ
// ============================================================

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const formatPercent = (v) => `${(v * 100).toFixed(1)}%`;
const formatNumber = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2));
const formatSkill = (key, value) => (SKILLS[key].percent ? formatPercent(value) : formatNumber(value));

let atkInfoOpen = false;
let spending = false;

function makeElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function statRow(label, value, { labelColor } = {}) {
  const li = makeElement('li');
  const labelEl = makeElement('span', 'stat-label', label);
  // Il colore dell'elemento va su un piccolo pad accanto all'etichetta: il testo resta leggibile
  if (labelColor) {
    labelEl.classList.add('element');
    labelEl.style.setProperty('--el', labelColor);
  }
  li.append(labelEl, makeElement('span', 'stat-value', value));
  return li;
}

// Riga di una statistica potenziabile: valore, anteprima "prima → dopo (+x)" e pulsante +
function skillRow(key, stats, canSpend, data) {
  const points = stats.allocation[key];
  const current = getSkillValue(key, points);
  const maxed = isSkillMaxed(key, points);
  const li = statRow(SKILLS[key].label, formatSkill(key, current));

  if (key === 'atk') {
    const infoBtn = makeElement('button', 'stat-btn info', 'i');
    infoBtn.title = 'Danni base delle proiezioni';
    infoBtn.onclick = () => {
      atkInfoOpen = !atkInfoOpen;
      renderStats(data);
    };
    li.querySelector('.stat-label').appendChild(infoBtn);
  }

  if (canSpend && stats.skillPointsAvailable > 0 && !maxed) {
    const next = getSkillValue(key, points + 1);
    const delta = SKILLS[key].percent ? formatPercent(next - current) : formatNumber(next - current);
    li.insertBefore(
      makeElement('span', 'stat-preview', `${formatSkill(key, current)} → ${formatSkill(key, next)} (+${delta})`),
      li.querySelector('.stat-value')
    );
  }

  if (canSpend) {
    const btn = makeElement('button', 'stat-btn', '+');
    btn.disabled = spending || stats.skillPointsAvailable <= 0 || maxed;
    btn.title = maxed ? 'Valore massimo raggiunto' : `Spendi un punto su ${SKILLS[key].label}`;
    btn.onclick = () => spendPoint(key);
    li.appendChild(btn);
  } else {
    li.appendChild(makeElement('span', 'stat-btn-spacer'));
  }
  return li;
}

// Dettaglio dell'ATK: quanto aumenta il danno base di ogni proiezione
function atkInfoRow(stats) {
  const multiplier = getAtkMultiplier(stats.atk);
  const perPoint = SKILLS.atk.perPoint / SKILLS.atk.base;
  const li = makeElement('li', 'stat-info');
  li.append(
    makeElement('div', null,
      `Proiettile: ${formatNumber(BASE_DAMAGE.proiettile)} base → ${formatNumber(BASE_DAMAGE.proiettile * multiplier)} ` +
      `(+${formatNumber(BASE_DAMAGE.proiettile * perPoint)} per punto ATK)`),
    makeElement('div', null,
      `Spaziale: ${formatNumber(BASE_DAMAGE.spaziale)} base → ${formatNumber(BASE_DAMAGE.spaziale * multiplier)} ` +
      `ogni 0.5 s per ${SPATIAL_DAMAGE_AREA_UNIT} px² (+${formatNumber(BASE_DAMAGE.spaziale * perPoint)} per punto ATK)`),
    makeElement('div', null,
      `Laser: ${formatNumber(BASE_DAMAGE.laser)} base → ${formatNumber(BASE_DAMAGE.laser * multiplier)} ` +
      `ogni 0.5 s a contatto (+${formatNumber(BASE_DAMAGE.laser * perPoint)} per punto ATK)`)
  );
  return li;
}

function marginsRow(stats) {
  const li = makeElement('li', 'stat-margins');
  li.appendChild(makeElement('span', 'stat-label', 'Margine di errore'));
  const values = makeElement('span', 'stat-margins-values');
  for (const element of ELEMENTS) {
    const item = makeElement('span', 'stat-element', `${capitalize(element)} ${formatPercent(stats.recognitionMargin[element])}`);
    item.style.setProperty('--el', getElementColor(element));
    values.appendChild(item);
  }
  li.appendChild(values);
  return li;
}

function renderStats(data) {
  const stats = computePlayerStats(data);
  // Si possono spendere punti solo sul proprio profilo
  const canSpend = data.username === getCurrentUsername();
  document.getElementById('skill-points-value').textContent = stats.skillPointsAvailable;

  const list = document.getElementById('stats-list');
  const divider = () => makeElement('li', 'stats-divider');
  const rows = [
    skillRow('hp', stats, canSpend, data),
    skillRow('atk', stats, canSpend, data),
    ...(atkInfoOpen ? [atkInfoRow(stats)] : []),
    skillRow('mp', stats, canSpend, data),
    skillRow('riduzioneMana', stats, canSpend, data),
    divider(),
    ...ELEMENTS.map(e => statRow(`Bonus DMG ${capitalize(e)}`, formatPercent(stats.elementDmgBonus[e]), { labelColor: getElementColor(e) })),
    divider(),
    ...ELEMENTS.map(e => statRow(`DEF ${capitalize(e)}`, formatPercent(stats.elementDef[e]), { labelColor: getElementColor(e) })),
    divider(),
    statRow('Tasso CRIT', formatPercent(stats.critRate)),
    statRow('DMG CRIT', formatPercent(stats.critDmg)),
    divider(),
    marginsRow(stats)
  ];
  list.replaceChildren(...rows);
}

async function spendPoint(skill) {
  if (spending) return;
  spending = true;
  const errorEl = document.getElementById('stats-error');
  errorEl.textContent = '';
  try {
    await spendSkillPoint(getCurrentUsername(), skill);
  } catch (error) {
    console.error('❌ Errore nello spendere il punto abilità:', error);
    errorEl.textContent = error.message || 'Impossibile spendere il punto abilità.';
  } finally {
    spending = false;
    await renderPlayerInfo(); // aggiorna anche il mana massimo nella scheda info
  }
}

renderPlayerInfo();

// Con G/N cambia il tema: i grafici vanno ridisegnati con i nuovi colori
onColorThemeChange(() => {
  if (lastChartData) renderRadarCharts(lastChartData.affinita, lastChartData.predisposizione);
});

document.getElementById('back-home-btn').onclick = () => {
  window.location.href = '/home.html';
};
document.getElementById('open-stats-btn').onclick = () => document.body.classList.add('show-stats');
document.getElementById('close-stats-btn').onclick = () => document.body.classList.remove('show-stats');

// Aggiorna dati e grafici quando la pagina torna visibile
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) renderPlayerInfo();
});
