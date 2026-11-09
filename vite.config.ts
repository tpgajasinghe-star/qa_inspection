import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

const buildTimestamp = Date.now();

export default defineConfig(() => {
  return {
    define: {
      __APP_BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp),
    },
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'generate-version-file',
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'version.json',
            source: JSON.stringify({
              version: buildTimestamp,
              buildTime: new Date(buildTimestamp).toISOString()
            }, null, 2)
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
