// firebase.js - Unica inizializzazione di Firebase per tutto il client.
// (Prima veniva inizializzato due volte nella pagina di login, generando l'errore "duplicate-app".)
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./config.js";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
