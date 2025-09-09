import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/client',
  base: '/reddi/',
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true
  }
});
