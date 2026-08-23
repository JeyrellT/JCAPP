import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // En dev servimos en la raiz para que el basename de BrowserRouter case sin friccion;
  // en build mantenemos el base de GitHub Pages que espera deploy-to-gh-pages.ps1 (/JCAPP/).
  base: command === 'build' ? '/JCAPP/' : '/',
  server: {
    port: 3000,
    open: true,
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true,
      interval: 100
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // (b) En Windows los ids llegan con separador backslash y las regex con \/ no matchean.
          const p = id.split(String.fromCharCode(92)).join('/');

          // (a) REGLA 1 — va PRIMERA y ANTES del guard de node_modules.
          //     commonjsHelpers es un modulo sintetico cuyo id NO contiene node_modules.
          if (p.includes('commonjsHelpers') || p.includes('vite/preload-helper')) return 'vendor-react';

          if (!p.includes('node_modules')) return undefined;

          if (/node_modules\/(recharts|recharts-scale|victory-vendor|d3-[a-z]+|decimal\.js-light|react-smooth|fast-equals)\//.test(p)) return 'vendor-charts';
          if (/node_modules\/lodash\//.test(p)) return 'vendor-lodash';
          if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(p)) return 'vendor-motion';
          if (/node_modules\/(react|react-dom|scheduler|react-is|prop-types|eventemitter3)\//.test(p)) return 'vendor-react';
          if (/node_modules\/(react-router|react-router-dom|@remix-run)\//.test(p)) return 'vendor-router';
          if (/node_modules\/react-hook-form\//.test(p)) return 'vendor-forms';
          if (/node_modules\/date-fns\//.test(p)) return 'vendor-dates';
          if (/node_modules\/lucide-react\//.test(p)) return 'vendor-icons';
          return undefined;
        },
      },
    },
  },
}))
