import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import { relative } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  base: '/e-reader/',
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  define: {
    __BUILD_VERSION__: JSON.stringify(process.env.BUILDVERSION || '0'),
    __APP_VERSION__: JSON.stringify(process.env.APP_VERSION || 'local')
  },
  server: {
    port: 8030,
    host: '0.0.0.0',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        chunkFileNames(chunkInfo) {
          if (chunkInfo.facadeModuleId && relative(fileURLToPath(import.meta.url), chunkInfo.facadeModuleId) === '../src/version.ts') {
            return 'version.js'
          }
          return 'assets/[name]-[hash].js'
        },
      }
    }
  },
  worker: {
    rollupOptions: {
      output: {
        entryFileNames(chunkInfo) {
          if (chunkInfo.name === 'sw') {
            // 需要把 sw 放在根目录，否则无法生效
            return '[name].js'
          }
          return '[name]-[hash][extname]'
        },
      }
    }
  }
})
