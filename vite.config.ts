import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3001,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: env.VITE_MEDIA_API_TARGET || 'http://localhost:8080',
            changeOrigin: true,
          },
        },
      },
      plugins: [react()],
      esbuild: {
        pure: mode === 'production' ? ['console.log', 'console.debug', 'console.info'] : [],
        drop: mode === 'production' ? ['debugger'] : []
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
