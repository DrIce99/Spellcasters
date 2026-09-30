// login.page.js - Login e registrazione (index.html)
import { getAnalytics, isSupported } from "firebase/analytics";
import { app } from '../services/firebase.js';
import { initColorTheme } from '../ui/theme.js';
import { savePlayerData, getPlayerData, createDefaultPlayer } from '../services/player-db.js';

initColorTheme();
isSupported().then(supported => { if (supported) getAnalytics(app); });

const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Vecchio formato (base64) usato dai primi account
function encodeLegacyPassword(pw) {
  return btoa(unescape(encodeURIComponent(pw)));
}

// --- Cache locale dei profili (usata solo se Firebase non risponde) ---
function getLocalPlayers() {
  try {
    return JSON.parse(localStorage.getItem('players') || '[]');
  } catch {
    return [];
  }
}

function saveLocalPlayer(player) {
  const players = getLocalPlayers().filter(p => p.username !== player.username);
  players.push(player);
  localStorage.setItem('players', JSON.stringify(players));
}

function getLocalPlayer(username) {
  return getLocalPlayers().find(p => p.username === username) || null;
}

// Firebase è la fonte di verità; la cache locale serve solo come fallback offline
async function findPlayer(username) {
  try {
    const player = await getPlayerData(username);
    if (player) {
      player.username = username;
      saveLocalPlayer(player);
      return player;
    }
    return null;
  } catch (error) {
    console.warn('⚠️ Firebase non raggiungibile, uso la cache locale:', error);
    return getLocalPlayer(username);
  }
}

// --- Login ---
document.getElementById('login-form').onsubmit = async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const user = document.getElementById('login-username').value.trim();
  const pw = document.getElementById('login-password').value;

  const player = await findPlayer(user);
  if (!player) {
    loginError.textContent = 'Nome utente o password errati.';
    return;
  }

  const hashed = await hashPassword(pw);
  if (hashed !== player.password) {
    if (encodeLegacyPassword(pw) !== player.password) {
      loginError.textContent = 'Nome utente o password errati.';
      return;
    }
    // Account vecchio: aggiorna la password al formato hash
    await savePlayerData(user, { password: hashed }).catch(() => {});
  }

  localStorage.setItem('currentPlayer', user);
  window.location.href = '/home.html';
};

// --- Registrazione ---
document.getElementById('signup-form').onsubmit = async (e) => {
  e.preventDefault();
  signupError.textContent = '';
  const user = document.getElementById('signup-username').value.trim();
  const pw = document.getElementById('signup-password').value;
  if (!user || !pw) {
    signupError.textContent = 'Compila tutti i campi.';
    return;
  }

  try {
    if (await getPlayerData(user)) {
      signupError.textContent = 'Nome utente già esistente.';
      return;
    }
    const player = createDefaultPlayer(user, await hashPassword(pw));
    await savePlayerData(user, player);
    saveLocalPlayer(player);
  } catch (error) {
    console.error('❌ Errore registrazione:', error);
    signupError.textContent = 'Errore di connessione, riprova.';
    return;
  }

  signupError.textContent = 'Registrazione avvenuta! Ora puoi fare login.';
  setTimeout(showLoginForm, 1200);
};

// --- Switch tra login/registrazione ---
function showLoginForm() {
  document.getElementById('signup-form').style.display = 'none';
  document.getElementById('login-form').style.display = '';
}
document.getElementById('switch-link').onclick = () => {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('signup-form').style.display = '';
};
document.getElementById('switch-link2').onclick = showLoginForm;
