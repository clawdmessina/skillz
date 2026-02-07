import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // For GitHub Pages at username.github.io/skillz
  // Change to '/' if deploying to a custom domain
  base: '/skillz/',
})
