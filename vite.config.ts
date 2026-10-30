import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

function copyStaticRuntimeDirs() {
  return {
    name: 'copy-static-runtime-dirs',
    closeBundle() {
      const rootDir = path.resolve(__dirname, '.');
      const distDir = path.resolve(__dirname, 'dist');
      for (const dirName of ['js', 'css']) {
        const srcDir = path.join(rootDir, dirName);
        const destDir = path.join(distDir, dirName);
        if (fs.existsSync(srcDir)) {
          fs.cpSync(srcDir, destDir, {recursive: true, force: true});
        }
      }
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), copyStaticRuntimeDirs()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
