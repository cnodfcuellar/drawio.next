import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@mxgraph': path.resolve(__dirname, '../../src/main/webapp/mxgraph/src'),
      '@drawio': path.resolve(__dirname, '../../src/main/webapp/js/diagramly'),
    }
  },
  server: {
    port: 5173,
    open: false
  }
})
