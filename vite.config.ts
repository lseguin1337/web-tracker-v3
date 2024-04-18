import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths';

function devConfig() {
  return {
    tagVersion: 'dev',
    anonymization: true,
    recording: true,
    textVisibility: true,
    heatmap: true,
  };
}

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  return {
    define: {
      __DEV__: isDev,
      __DEBUG__: process.env.NODE_ENV === 'debug',
      ...(isDev ? { CS_CONF: JSON.stringify(devConfig()) } : {}),
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