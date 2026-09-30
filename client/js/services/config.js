// config.js - Configurazione condivisa lato client (un solo posto da modificare)

// Server WebSocket per Arena e PvP.
// Per usare il server locale crea ".env.local" nella root con: VITE_WS_URL=ws://localhost:8080
export const WS_URL = import.meta.env.VITE_WS_URL || 'wss://spellcasters.onrender.com';

// Configurazione web di Firebase (è pubblica per design: la sicurezza dipende dalle regole Firestore)
export const firebaseConfig = {
  apiKey: "AIzaSyApUmQPCgluD8YFBmuyqJmeNtbzHQmdTlo",
  authDomain: "spellcasters-b7154.firebaseapp.com",
  projectId: "spellcasters-b7154",
  storageBucket: "spellcasters-b7154.firebasestorage.app",
  messagingSenderId: "67384342350",
  appId: "1:67384342350:web:089bd6200216d34ad4d01f",
  measurementId: "G-NFLJ2L0JHF"
};
