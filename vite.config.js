import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Set this to '/your-repo-name/' if using GitHub Pages project site
  // e.g. if your repo is github.com/aaron/property-scanner → base: '/property-scanner/'
  // Leave as './' if using a custom domain or username.github.io
  base: './',
  build: {
    outDir: 'dist',
  },
})
