import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    angular({
      jit: true, // Use JIT mode for simpler setup with the current structure
    }),
  ],
  resolve: {
    mainFields: ['module'],
  },
});