import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode (development / production)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    resolve: {
      alias: {
        // Allows `import X from '@/...'` instead of relative paths
        '@': path.resolve(__dirname, 'src'),
      },
    },

    server: {
      port: 5173,
      /**
       * Dev proxy — forwards /api/* requests to the backend so you avoid
       * CORS issues during local development.
       *
       * USAGE: set VITE_API_BASE_URL=http://localhost:3000 in frontend/.env
       *        then just use `/api/auth/login` in your axios calls.
       *
       * Disable proxy by removing this block when deploying and configuring
       * the real backend CORS origin instead.
       */
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
