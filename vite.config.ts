import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    modulePreload: false,
    rollupOptions: {
      output: {
        entryFileNames: 'web-tracker.js',
      }
    }
  }
});