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
}))
