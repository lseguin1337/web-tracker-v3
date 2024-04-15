import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  return {
    define: {
      __DEV__: mode === 'development',
      __DEBUG__: process.env.NODE_ENV === 'debug',
    },
    build: {
      modulePreload: false,
      rollupOptions: {
        output: {
          entryFileNames: `[name].js`,
        },
        input: {
          index: './index.html',
          tracker: './src/main.ts',
          website: './sitefortest/main.js'
        }
      }
    }
  };
});