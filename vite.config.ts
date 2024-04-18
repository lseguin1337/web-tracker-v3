import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
  return {
    define: {
      __DEV__: mode === 'development',
      __DEBUG__: process.env.NODE_ENV === 'debug',
    },
    plugins: [tsconfigPaths()],
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