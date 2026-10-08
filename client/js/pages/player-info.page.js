// player-info.page.js - Statistiche del giocatore, grafici radar (Chart.js da CDN) e cerchio dei Linker
import { initColorTheme, onColorThemeChange } from '../ui/theme.js';
import { setPageFavicon } from '../ui/favicon.js';
import { getPlayerData, getCurrentUsername, spendSkillPoint, savePlayerData } from '../services/player-db.js';
import { getExpToNext } from '../game/progression.js';
import {
  SKILLS, BASE_DAMAGE, SPATIAL_DAMAGE_AREA_UNIT, computePlayerStats, getSkillValue, isSkillMaxed, getAtkMultiplier
} from '../game/player-stats.js';
import { ELEMENTS, PROJECTIONS, SYMBOLS, getElementColor, NEUTRAL_COLOR, EMPTY_CIRCLE_COLOR } from '../game/elements.js';
import { navigateTo, replayClass, shake } from '../ui/motion.js';
import { playSfx } from '../ui/sfx.js';
import {
  LINKER_SLOTS, getLinkerColor, getLinkerAlphabet, getEquippedLinker, getLinkerInventory, getCurrency
} from '../game/linker.js';
import {
  LINKER_STATS, LINKER_SETS, mainStatValue, formatStatValue, countEquippedSets, getLinkerBonuses
} from '../game/linker-data.js';
import { equipLinker, levelUpLinker, catalyzeLinker } from '../services/linker-db.js';
import { LinkerCircle } from '../ui/linker-circle.js';
import { LinkerInspector } from '../ui/linker-inspector.js';
import { RUNE_ALPHABETS } from '../ui/runes.js';
import { snapshotTexts, scrambleChanged } from '../ui/scramble.js';

initColorTheme();
setPageFavicon({ element: 'terra' }); // icona della scheda: un cerchio magico diverso per ogni pagina

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
  // Il cerchio dei Linker si disegna subito (nome dall'URL, colore predefinito), poi arrivano i dati
  if (!linkerCircle) renderLinker({ username });
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
  renderLinker(data);
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

// Riga: etichetta | valore base | + | bonus dei Linker. bonus null = la statistica non ha bonus dai Linker
function statRow(label, value, { labelColor, bonus = null } = {}) {
  const li = makeElement('li');
  const labelEl = makeElement('span', 'stat-label', label);
  // Il colore dell'elemento va su un piccolo pad accanto all'etichetta: il testo resta leggibile
  if (labelColor) {
    labelEl.classList.add('element');
    labelEl.style.setProperty('--el', labelColor);
  }
  const hasBonus = bonus !== null;
  const zero = hasBonus && /^0(\.0+)?(%|\/s)?$/.test(bonus);
  li.append(
    labelEl,
    makeElement('span', 'stat-value', value),
    makeElement('span', 'stat-plus', hasBonus ? '+' : ''),
    makeElement('span', `stat-bonus${zero ? ' zero' : ''}`, hasBonus ? bonus : '')
  );
  return li;
}

// Intestazione delle colonne (allineata alle righe)
function statsHeaderRow() {
  const li = makeElement('li', 'stats-header');
  li.append(
    makeElement('span', 'stat-label', ''),
    makeElement('span', 'stat-value', 'Base'),
    makeElement('span', 'stat-plus', ''),
    makeElement('span', 'stat-bonus', 'Linker'),
    makeElement('span', 'stat-btn-spacer')
  );
  return li;
}

// Riga di una statistica potenziabile: valore, anteprima "prima → dopo (+x)" e pulsante +
function skillRow(key, stats, canSpend, data, bonus) {
  const points = stats.allocation[key];
  const current = getSkillValue(key, points);
  const maxed = isSkillMaxed(key, points);
  const li = statRow(SKILLS[key].label, formatSkill(key, current), { bonus });
  li.dataset.skill = key;

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

// Margine di errore nel disegno di un simbolo: per gli elementi cresce con l'affinità,
// per cerchio e proiezioni con le volte che sono stati disegnati
function marginRow(name, stats) {
  const color = ELEMENTS.includes(name) ? getElementColor(name) : name === 'cerchio' ? EMPTY_CIRCLE_COLOR : NEUTRAL_COLOR;
  return withSpacer(statRow(`Margine di errore ${capitalize(name)}`, formatPercent(stats.recognitionMargin[name]), { labelColor: color }));
}

// Valori senza i Linker: stesse formule del gioco, con gli slot vuoti
function rawStatsOf(data) {
  return computePlayerStats({ ...data, linker: { ...data.linker, equip: {} } });
}

const round = (value, digits) => Number(value.toFixed(digits));
const formatFlat = (value) => formatNumber(round(value, 2));
const formatRegen = (perFrame) => `${(perFrame * 60).toFixed(2)}/s`; // mana al secondo

// Le righe senza pulsante + hanno uno spazio al suo posto, così le colonne restano allineate
function withSpacer(li) {
  li.appendChild(makeElement('span', 'stat-btn-spacer'));
  return li;
}

function renderStats(data) {
  const stats = computePlayerStats(data);
  const raw = rawStatsOf(data);
  const flatBonus = (key) => formatFlat(stats[key] - raw[key]);
  const pctBonus = (total, base) => formatPercent(round(total - base, 6));
  // Si possono spendere punti solo sul proprio profilo
  const canSpend = data.username === getCurrentUsername();
  document.getElementById('skill-points-value').textContent = stats.skillPointsAvailable;

  const list = document.getElementById('stats-list');
  const divider = () => makeElement('li', 'stats-divider');
  const rows = [
    statsHeaderRow(),
    skillRow('hp', stats, canSpend, data, flatBonus('hp')),
    skillRow('atk', stats, canSpend, data, flatBonus('atk')),
    ...(atkInfoOpen ? [atkInfoRow(stats)] : []),
    skillRow('mp', stats, canSpend, data, flatBonus('mp')),
    skillRow('riduzioneMana', stats, canSpend, data, pctBonus(stats.riduzioneMana, raw.riduzioneMana)),
    withSpacer(statRow('Rigenerazione mana', formatRegen(raw.manaRegenPerFrame), {
      bonus: formatRegen(stats.manaRegenPerFrame - raw.manaRegenPerFrame)
    })),
    divider(),
    ...ELEMENTS.map(e => withSpacer(statRow(`Bonus DMG ${capitalize(e)}`, formatPercent(raw.elementDmgBonus[e]), {
      labelColor: getElementColor(e), bonus: pctBonus(stats.elementDmgBonus[e], raw.elementDmgBonus[e])
    }))),
    divider(),
    ...ELEMENTS.map(e => withSpacer(statRow(`DEF ${capitalize(e)}`, formatPercent(raw.elementDef[e]), {
      labelColor: getElementColor(e), bonus: pctBonus(stats.elementDef[e], raw.elementDef[e])
    }))),
    divider(),
    withSpacer(statRow('Tasso CRIT', formatPercent(raw.critRate), { bonus: pctBonus(stats.critRate, raw.critRate) })),
    withSpacer(statRow('DMG CRIT', formatPercent(raw.critDmg), { bonus: pctBonus(stats.critDmg, raw.critDmg) })),
    divider(),
    ...linkerSetRows(data),
    ...ELEMENTS.map(e => marginRow(e, stats)),
    divider(),
    ...SYMBOLS.map(s => marginRow(s, stats))
  ];
  list.replaceChildren(...rows);
}

// Set dei Linker equipaggiati e bonus attivi (2 / 4 pezzi)
function linkerSetRows(data) {
  const { sets } = getLinkerBonuses(data);
  if (!sets.length) return [];
  const rows = [];
  for (const { key, count, two, four } of sets) {
    const set = LINKER_SETS[key];
    const active = [two && '2 pezzi', four && '4 pezzi'].filter(Boolean).join(' + ') || 'nessun bonus';
    rows.push(withSpacer(statRow(`${set.name} (${count}/4)`, active, { labelColor: set.color })));
  }
  rows.push(makeElement('li', 'stats-divider'));
  return rows;
}

async function spendPoint(skill) {
  if (spending) return;
  spending = true;
  const errorEl = document.getElementById('stats-error');
  errorEl.textContent = '';
  let spent = false;
  try {
    await spendSkillPoint(getCurrentUsername(), skill);
    spent = true;
    playSfx('spend');
  } catch (error) {
    console.error('❌ Errore nello spendere il punto abilità:', error);
    errorEl.textContent = error.message || 'Impossibile spendere il punto abilità.';
    playSfx('error');
    shake(errorEl);
  } finally {
    spending = false;
    await renderPlayerInfo(); // aggiorna anche il mana massimo nella scheda info
  }
  if (spent) {
    // Le righe sono appena state ricreate: fa "saltare" il nuovo valore e i punti rimasti
    replayClass(document.querySelector(`[data-skill="${skill}"] .stat-value`), 'bump');
    replayClass(document.getElementById('skill-points-value'), 'bump');
  }
}

// ============================================================
// LINKER: cerchio personale (colore scelto dal giocatore, nome in rune) e i 5 slot
// ============================================================

const linkerCanvas = document.getElementById('linker-circle');
const linkerColorInput = document.getElementById('linker-color');
const linkerColorValue = document.getElementById('linker-color-value');
const linkerAlphabetSelect = document.getElementById('linker-alphabet');
linkerAlphabetSelect.append(...RUNE_ALPHABETS.map(({ key, label }) => new Option(label, key)));
const linkerPanel = document.getElementById('linker-panel');
let linkerCircle = null;
let linkerInspector = null;
let linkerData = null;       // ultimo profilo mostrato nel pannello (per l'inventario dei Linker)
let savedLinkerColor = null; // ultimo colore salvato su Firestore (per non risalvare lo stesso)

// Un canvas non si ridisegna da solo quando arriva un font web: si aspetta quello delle rune
function whenRuneFontReady() {
  if (!document.fonts?.load) return Promise.resolve();
  return document.fonts.load("16px 'Noto Sans Runic'", 'ᚠ').catch(() => {});
}

function renderLinker(data) {
  const color = getLinkerColor(data);
  const alphabet = getLinkerAlphabet(data);
  const isOwnProfile = data.username === getCurrentUsername();
  // Per il cerchio: colore del set e rarità del Linker equipaggiato in ogni slot
  const equipped = Object.fromEntries(LINKER_SLOTS.map(({ key }) => {
    const linker = getEquippedLinker(data, key);
    return [key, linker ? { color: LINKER_SETS[linker.set]?.color || color, rarity: linker.rarita } : null];
  }));

  linkerData = data;
  linkerAlphabetSelect.value = alphabet;
  if (!linkerCircle) {
    linkerCircle = new LinkerCircle(linkerCanvas, { color, name: data.username, alphabet, equipped });
    whenRuneFontReady().then(() => linkerCircle.draw());
    updateLinkerAnimation();
    linkerInspector = new LinkerInspector({
      layout: document.querySelector('.linker-layout'),
      canvas: linkerCanvas,
      list: document.getElementById('linker-slots'),
      inventory: document.getElementById('linker-inventory'),
      circle: linkerCircle,
      actions: {
        getSlotData: (slotKey) => ({
          items: getLinkerInventory(linkerData, slotKey),
          equipped: getEquippedLinker(linkerData, slotKey),
          canEdit: linkerData?.username === getCurrentUsername(),
          catalyst: getCurrency(linkerData, 'catalizzante'),
          setCounts: countEquippedSets(linkerData)
        }),
        onEquip: (slotKey, linker) => linkerAction(
          () => equipLinker(getCurrentUsername(), slotKey, linker ? linker.id : null),
          linker ? 'Impossibile equipaggiare il Linker.' : 'Impossibile rimuovere il Linker.'
        ).then(ok => ok && playSfx(linker ? 'engrave' : 'dispel')),
        onLevelUp: (linker, targetLevel) => linkerAction(
          () => levelUpLinker(getCurrentUsername(), linker.id, targetLevel), 'Impossibile potenziare il Linker.'
        ).then(result => {
          if (result) playSfx(result.upgraded.length ? 'levelUp' : 'spend');
          return result;
        }),
        onCatalyze: (linker) => linkerAction(
          () => catalyzeLinker(getCurrentUsername(), linker.id), 'Impossibile catalizzare il Linker.'
        ).then(result => result && playSfx('dispel'))
      }
    });
  } else {
    linkerCircle.equipped = equipped;
    linkerCircle.alphabet = alphabet;
    linkerCircle.setName(data.username);
    // Mentre si sceglie un colore non ancora salvato, il ricaricamento dei dati non lo sovrascrive
    if (savedLinkerColor === null || linkerColorInput.value === savedLinkerColor) linkerCircle.setColor(color);
  }
  if (savedLinkerColor === null || linkerColorInput.value === savedLinkerColor) {
    linkerColorInput.value = color;
    linkerColorValue.textContent = color;
    savedLinkerColor = color;
  }
  // Colore e alfabeto si cambiano solo sul proprio profilo
  linkerColorInput.disabled = !isOwnProfile;
  linkerAlphabetSelect.disabled = !isOwnProfile;
  linkerPanel.style.setProperty('--linker-color', linkerColorInput.value);

  const slotList = document.getElementById('linker-slots');
  // Dal secondo render in poi i valori degli slot che cambiano (es. nuovo Linker equipaggiato) si riscrivono
  const before = slotList.children.length ? snapshotTexts(slotList) : null;
  const rows = LINKER_SLOTS.map(({ key, label }) => {
    const linker = getEquippedLinker(data, key);
    const li = makeElement('li', 'linker-row');
    li.dataset.slot = key;
    li.setAttribute('role', 'tab');
    li.append(
      makeElement('span', 'stat-label linker-slot', label),
      makeElement('span', linker ? 'stat-value' : 'stat-value empty', linker
        ? `${LINKER_STATS[linker.principale]?.label} ${formatStatValue(linker.principale, mainStatValue(linker))} · +${linker.livello || 0}`
        : 'Vuoto')
    );
    return li;
  });
  slotList.replaceChildren(...rows);
  if (before) scrambleChanged(slotList, before);
  document.getElementById('wallet-bitrune').textContent = getCurrency(data, 'bitrune');
  document.getElementById('wallet-catalyst').textContent = getCurrency(data, 'catalizzante');
  linkerInspector.refresh();
}

// Esegue un'operazione sui Linker (transazione su Firestore), poi ricarica il profilo:
// pannello Linker, cerchio e statistiche si aggiornano insieme. In caso di errore lo mostra e restituisce null.
async function linkerAction(operation, errorMessage) {
  const errorEl = document.getElementById('linker-error');
  errorEl.textContent = '';
  let result = null;
  try {
    result = (await operation()) ?? true;
  } catch (error) {
    console.error('❌ Operazione sui Linker non riuscita:', error);
    errorEl.textContent = error.message ? `${errorMessage} (${error.message})` : errorMessage;
    playSfx('error');
    shake(errorEl);
  }
  const data = await getPlayerData(linkerData.username);
  if (data) {
    renderLinker(data);
    renderStats(data);
  }
  return result;
}

// Il cerchio ruota (come tutti i cerchi magici) solo mentre il pannello è visibile
function updateLinkerAnimation() {
  if (!linkerCircle) return;
  if (document.body.classList.contains('show-linker') && !document.hidden) linkerCircle.start();
  else linkerCircle.stop();
}

linkerColorInput.addEventListener('input', () => {
  const color = linkerColorInput.value;
  linkerColorValue.textContent = color;
  linkerPanel.style.setProperty('--linker-color', color);
  linkerCircle?.setColor(color);
});

// Salva una scelta del cerchio (colore o alfabeto) sul profilo
async function saveLinkerOption(fields, errorMessage) {
  const errorEl = document.getElementById('linker-error');
  errorEl.textContent = '';
  try {
    await savePlayerData(getCurrentUsername(), { linker: fields });
    playSfx('tick', { value: 0.7 });
    return true;
  } catch (error) {
    console.error('❌ Errore nel salvataggio del cerchio dei Linker:', error);
    errorEl.textContent = errorMessage;
    playSfx('error');
    shake(errorEl);
    return false;
  }
}

// 'change' arriva quando si conferma il colore (chiusura del selettore): solo allora si salva
linkerColorInput.addEventListener('change', async () => {
  const color = linkerColorInput.value;
  if (color === savedLinkerColor) return;
  if (await saveLinkerOption({ colore: color }, 'Impossibile salvare il colore del cerchio.')) savedLinkerColor = color;
});

// Il nome si riscrive subito con le nuove rune, poi la scelta si salva
linkerAlphabetSelect.addEventListener('change', () => {
  linkerCircle?.setAlphabet(linkerAlphabetSelect.value);
  saveLinkerOption({ alfabeto: linkerAlphabetSelect.value }, 'Impossibile salvare l\'alfabeto runico.');
});

renderPlayerInfo();

// Con G/N cambia il tema: i grafici vanno ridisegnati con i nuovi colori
onColorThemeChange(() => {
  if (lastChartData) renderRadarCharts(lastChartData.affinita, lastChartData.predisposizione);
});

document.getElementById('back-home-btn').onclick = () => navigateTo('/home.html');
document.getElementById('linker-shop-btn').onclick = () => navigateTo('/shop.html');
// --- Viste laterali: #linker o #stats nell'indirizzo aprono direttamente quella vista ---
// (es. "Vai ai Linker" dallo shop porta a player-info.html?user=...#linker). L'indirizzo segue la vista aperta,
// così ricaricando la pagina si resta dove si era.
const VIEW_CLASSES = { linker: 'show-linker', stats: 'show-stats' };

function setViewInUrl(view) {
  history.replaceState(null, '', `${location.pathname}${location.search}${view ? `#${view}` : ''}`);
}

function openViewFromUrl() {
  const view = location.hash.slice(1);
  if (!VIEW_CLASSES[view]) return;
  // Senza scorrimento: si arriva già nella vista giusta, senza passare dalle info
  document.body.classList.add('no-view-transition', VIEW_CLASSES[view]);
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('no-view-transition')));
  if (view === 'linker') updateLinkerAnimation();
}

document.getElementById('open-stats-btn').onclick = () => {
  document.body.classList.add('show-stats');
  setViewInUrl('stats');
  playSfx('slide', { direction: -1 });
};
document.getElementById('close-stats-btn').onclick = () => {
  document.body.classList.remove('show-stats');
  setViewInUrl(null);
  playSfx('slide', { direction: 1 });
};
document.getElementById('open-linker-btn').onclick = () => {
  document.body.classList.add('show-linker');
  setViewInUrl('linker');
  playSfx('slide', { direction: 1 });
  updateLinkerAnimation();
};
document.getElementById('close-linker-btn').onclick = () => {
  document.body.classList.remove('show-linker');
  setViewInUrl(null);
  // Si torna alle info: l'inventario si chiude dopo lo scorrimento della vista
  setTimeout(() => linkerInspector?.closeInstantly(), 900);
  playSfx('slide', { direction: -1 });
  // Si ferma dopo lo scorrimento della vista, così il cerchio non si blocca mentre esce
  setTimeout(updateLinkerAnimation, 900);
};

// Aggiorna dati e grafici quando la pagina torna visibile
document.addEventListener('visibilitychange', () => {
  updateLinkerAnimation();
  if (!document.hidden) renderPlayerInfo();
});

openViewFromUrl();
