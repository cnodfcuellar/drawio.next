import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**'],
      thresholds: { lines: 85, functions: 85, branches: 80 }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@mxgraph': path.resolve(__dirname, '../../src/main/webapp/mxgraph/src'),
    }
  }
})
