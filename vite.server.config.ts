import { defineConfig } from 'vite';
import { builtinModules } from 'node:module';

export default defineConfig({
  root: 'src/server',
  build: {
    outDir: '../../dist/server',
    emptyOutDir: true,
    lib: { entry: 'index.ts', formats: ['cjs'], fileName: () => 'index.cjs' },
    rollupOptions: { external: builtinModules }
  }
});
