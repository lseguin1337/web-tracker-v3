import { defineConfig } from 'vite'

export default defineConfig(({ command }) => {
  return {
    define: {
      __DEV__: command === 'serve',
    },
    build: {
      modulePreload: false,
      rollupOptions: {
        output: {
          entryFileNames: `[name].js`,
        },
        input: {
          index: './index.html',
          webTracker: './src/main.ts',
          website: './sitefortest/main.js'
        }
      }
    }
  };
});