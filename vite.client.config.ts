import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/client',
  base: './',
  build: {
    outDir: '../../dist/client',  // << write to top-level dist/client
    emptyOutDir: true
  }
});
