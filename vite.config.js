import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const clientDir = resolve(projectRoot, 'client');

// Tutto il codice che gira nel browser vive in client/.
// Le pagine HTML elencate qui sotto sono quelle incluse nella build di produzione.
const pages = ['index', 'home', 'lab', 'game', 'arena', 'player-info', 'version', 'shop', 'quests'];

export default defineConfig({
  root: clientDir,
  // I file .env (es. .env.local con VITE_WS_URL) stanno nella root del progetto
  envDir: projectRoot,
  build: {
    target: 'es2022', // Supporta top-level await
    outDir: resolve(projectRoot, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(pages.map(name => [name, resolve(clientDir, `${name}.html`)]))
    }
  },
  esbuild: {
    target: 'es2022'
  }
});
