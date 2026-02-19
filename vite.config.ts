
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    'process.env': {
      API_KEY: process.env.API_KEY
    }
  },
  build: {
    outDir: 'dist',
  }
});
