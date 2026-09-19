import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths({
    projects: [
      './tsconfig.vitest.json',
    ],
  })],
  test: {
    include: ['tests/**/*.spec.ts', 'tests/**/*.spec.tsx', 'src/**/*.test.ts'],
    pool: 'forks',
    environment: 'node',
  },
})
