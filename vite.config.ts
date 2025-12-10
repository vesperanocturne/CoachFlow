import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      // Updated with the specific credentials provided
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || 'https://ihzaahmeqomncumwlcsg.supabase.co'),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloemFhaG1lcW9tbmN1bXdsY3NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzODU1MjEsImV4cCI6MjA4MDk2MTUyMX0.NV7a7Qly7nSBP5bIkJjpbTHJmOmG2ybwc9A9DkpIaQQ')
    },
    server: {
      port: 3000
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            charts: ['recharts'],
            icons: ['lucide-react'],
            ai: ['@google/genai'],
            supabase: ['@supabase/supabase-js']
          }
        }
      }
    }
  };
});