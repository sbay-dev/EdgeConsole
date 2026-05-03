import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2022',
    rollupOptions: {
      input: {
        'background/service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'devtools/devtools':         resolve(__dirname, 'src/devtools/devtools.ts'),
        'panels/host':               resolve(__dirname, 'src/panels/host.ts'),
        'bridge/cdp-bridge':         resolve(__dirname, 'src/bridge/cdp-bridge.ts'),
        'bridge/copilot-bridge':     resolve(__dirname, 'src/bridge/copilot-bridge.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]',
        format: 'es'
      }
    }
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'public/manifest.json', dest: '.' },
        { src: 'public/devtools.html', dest: 'devtools' },
        { src: 'public/host.html',     dest: 'panels' },
        { src: 'icons/*',              dest: 'icons' }
      ]
    })
  ]
});
