import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/AnniFilter/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    watch: {
      // Saving from inside the app can land in the project tree (e.g.
      // samples/), which would otherwise trigger a Vite full reload mid-save
      // and abort the in-flight FileSystemFileHandle work before setFilePath.
      ignored: ['**/*.filter'],
    },
  },
})
