import { defineConfig } from 'vite';
import { resolve }      from 'path';

export default defineConfig({
  root: 'public',
  build: {
    outDir:        '../public/dist',
    emptyOutDir:   true,
    rollupOptions: {
      input: {
        'app':                  resolve(__dirname, 'public/app.js'),
        'campaign-generator':   resolve(__dirname, 'public/campaign-generator.js'),
        'tournament-generator': resolve(__dirname, 'public/tournament-generator.js'),
        'configurator-extra':   resolve(__dirname, 'public/configurator-extra.js'),
      },
      output: {
        entryFileNames: '[name].[hash].js',
      },
    },
    target:    'es2020',
    sourcemap: true,
  },
});
