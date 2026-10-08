// quests.page.js - Missioni giornaliere e settimanali: avanzamento, rinnovo e riscatto dei BitRune
import { initColorTheme } from '../ui/theme.js';
import { setPageFavicon } from '../ui/favicon.js';
import { navigateTo, shake, replayClass } from '../ui/motion.js';
import { playSfx } from '../ui/sfx.js';
import { getPlayerData, getCurrentUsername } from '../services/player-db.js';
import { claimQuest } from '../services/quest-tracker.js';
import { getCurrency } from '../game/linker.js';
import { QUEST_PERIODS, getActiveQuests, currentPeriodState, periodIndex, msUntilReset } from '../game/quests-data.js';

initColorTheme();
setPageFavicon({ element: 'terra', charged: true }); // icona della scheda: un cerchio magico diverso per ogni pagina

const username = getCurrentUsername();
if (!username) window.location.href = '/index.html';

let player = null;
let claiming = false;
const shownPeriods = {}; // indice del periodo mostrato: quando cambia (mezzanotte, lunedì) si ricarica

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatCountdown(ms) {
  const minutes = Math.max(1, Math.ceil(ms / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days}g ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatAmount(value, target) {
  // Il mana speso è frazionario: si mostra intero
  return `${Math.floor(Math.min(value, target))} / ${target}`;
}

function claimButton(text, period, questId, disabled) {
  const btn = el('button', 'quest-claim', text);
  btn.type = 'button';
  btn.disabled = disabled || claiming;
  btn.addEventListener('click', () => claim(period, questId, btn));
  return btn;
}

function renderPeriod(period) {
  const section = document.querySelector(`.quests-period[data-period="${period}"]`);
  const config = QUEST_PERIODS[period];
  const state = currentPeriodState(player, period);
  const quests = getActiveQuests(period, username);
  shownPeriods[period] = periodIndex(period);

  const header = el('header', 'quests-period-header');
  header.append(
    el('h2', null, config.label),
    el('span', 'quests-reset', `Rinnovo tra ${formatCountdown(msUntilReset(period))}`)
  );

  const list = el('ul', 'quest-list');
  for (const quest of quests) {
    const value = state.progressi[quest.id] || 0;
    const done = value >= quest.target;
    const claimed = state.riscattate.includes(quest.id);
    const li = el('li', `quest${done ? ' done' : ''}${claimed ? ' claimed' : ''}`);
    li.dataset.quest = quest.id;
    const bar = el('div', 'quest-bar');
    const fill = el('div', 'quest-bar-fill');
    fill.style.width = `${Math.min(100, (value / quest.target) * 100)}%`;
    bar.append(fill);
    const info = el('div', 'quest-info');
    info.append(el('p', 'quest-text', quest.text), bar, el('span', 'quest-amount', formatAmount(value, quest.target)));
    li.append(
      info,
      el('span', 'quest-reward', `◈ ${quest.reward}`),
      claimed ? el('span', 'quest-claimed', '✓ Riscattata') : claimButton('Riscatta', period, quest.id, !done)
    );
    list.append(li);
  }

  // Bonus: riscattate tutte le missioni del periodo
  const allClaimed = quests.every(q => state.riscattate.includes(q.id));
  const bonus = el('div', `quest-bonus${state.bonus ? ' claimed' : ''}${allClaimed && !state.bonus ? ' ready' : ''}`);
  bonus.append(
    el('p', 'quest-text', `Completa e riscatta tutte le ${config.label.toLowerCase()}`),
    el('span', 'quest-reward', `◈ ${config.bonus}`),
    state.bonus ? el('span', 'quest-claimed', '✓ Riscattato') : claimButton('Bonus', period, null, !allClaimed)
  );

  section.replaceChildren(header, list, bonus);
}

function render() {
  document.getElementById('quests-bitrune').textContent = player ? getCurrency(player, 'bitrune') : '…';
  for (const period of Object.keys(QUEST_PERIODS)) renderPeriod(period);
}

async function reload() {
  try {
    player = await getPlayerData(username);
  } catch (error) {
    console.error('❌ Impossibile caricare le missioni:', error);
  }
  render();
}

async function claim(period, questId, button) {
  if (claiming) return;
  claiming = true;
  button.disabled = true;
  const errorEl = document.getElementById('quests-error');
  errorEl.textContent = '';
  try {
    const { reward } = await claimQuest(username, period, questId);
    playSfx(questId ? 'success' : 'levelUp');
    await reload();
    replayClass(document.getElementById('quests-bitrune'), 'bump');
    const row = questId && document.querySelector(`[data-quest="${questId}"]`);
    if (row) replayClass(row, 'just-claimed');
    errorEl.textContent = '';
    console.log(`🎁 Riscattati ${reward} BitRune`);
  } catch (error) {
    console.error('❌ Riscatto non riuscito:', error);
    errorEl.textContent = `Riscatto non riuscito: ${error.message || 'errore sconosciuto'}`;
    playSfx('error');
    shake(errorEl);
    await reload();
  } finally {
    claiming = false;
    render();
  }
}

// Conto alla rovescia; al rinnovo (mezzanotte, lunedì) arrivano le missioni nuove
setInterval(() => {
  const rolled = Object.keys(QUEST_PERIODS).some(p => shownPeriods[p] !== periodIndex(p));
  if (rolled) reload();
  else render();
}, 30000);

document.getElementById('home-btn').addEventListener('click', () => navigateTo('/home.html'));
document.getElementById('quests-shop-btn').addEventListener('click', () => navigateTo('/shop.html'));
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !claiming) reload();
});

// Le missioni si vedono subito (sono calcolate in locale); i progressi arrivano con il profilo
render();
if (username) reload();
