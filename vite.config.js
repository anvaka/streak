import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  // Relative base, so one build serves correctly from the site root AND from a
  // PR preview subpath (/streak/pr-preview/pr-N/). An absolute base would 404
  // every asset in a preview, and building previews with a different base would
  // mean reviewing a bundle that isn't the one that ships.
  base: './',
  plugins: [vue()],
  publicDir: 'static',
  resolve: {
    alias: {
      'src': path.resolve(__dirname, 'src'),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },
  server: {
    port: 8100
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.spec.js'],
  }
})
