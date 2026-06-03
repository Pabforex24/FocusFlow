import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/store/**', 'src/types/index.ts', 'src/lib/utils.ts'],
      thresholds: { lines: 60, functions: 60 },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
