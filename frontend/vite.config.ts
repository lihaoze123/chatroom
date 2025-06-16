/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // 允许外部访问
    open: true
  },
  build: {
    outDir: 'build',
    sourcemap: true
  },
  define: {
    // 替换 process.env 变量
    'process.env': {}
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts'
  }
}) 