// player-info.page.js - Statistiche del giocatore e grafici radar (Chart.js da CDN)
import { initColorTheme } from '../ui/theme.js';
import { getPlayerData } from '../services/player-db.js';
import { getExpToNext } from '../game/progression.js';

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
  const elementi = ['fuoco', 'acqua', 'aria', 'terra'];
  const colori = {
    fuoco: '#ff5555',
    acqua: '#00eaff',
    aria: '#aaaaee',
    terra: 'rgba(180,160,100)'
  };
  return {
    labels: elementi,
    data: elementi.map(e => affinita[e] || 0),
    colori: elementi.map(e => colori[e])
  };
}

function getRadarDataPredisposizione(predisposizione) {
  const tipi = Object.keys(predisposizione);
  const labels = tipi.length > 0 ? tipi : ['proiettile', 'spaziale'];
  return {
    labels,
    data: labels.map(t => predisposizione[t] || 0)
  };
}

let radarChart1 = null;
let radarChart2 = null;

function renderRadarCharts(affinita, predisposizione) {
  loadChartJs(() => {
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
          backgroundColor: 'rgba(0,234,255,0.10)',
          borderColor: 'rgba(255,255,255,0.5)',
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
            angleLines: { color: '#7f5cff44' },
            grid: { color: '#7f5cff22' },
            pointLabels: { font: { family: 'Cinzel', size: 14 }, color: data1.colori },
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
          backgroundColor: 'rgba(127,92,255,0.18)',
          borderColor: '#7f5cff',
          pointBackgroundColor: '#7f5cff',
          borderWidth: 2
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { r: { angleLines: { color: '#7f5cff44' }, grid: { color: '#7f5cff22' }, pointLabels: { font: { family: 'Cinzel', size: 14 }, color: '#7f5cff' }, ticks: { display: false } } },
        responsive: false
      }
    });
  });
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
  document.getElementById('info-mana').textContent = `${round2(data.mana)}/${data.manaMax || livello * 10}`;
  document.getElementById('info-vittorie').textContent = data.vittorie || 0;
  document.getElementById('info-partite').textContent = data.partite || 0;
  renderRadarCharts(data.affinita || {}, data.proiezioniUsate || {});
}

renderPlayerInfo();

document.getElementById('back-home-btn').onclick = () => {
  window.location.href = '/home.html';
};

// Aggiorna dati e grafici quando la pagina torna visibile
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) renderPlayerInfo();
});
