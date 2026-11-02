import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Les guides utilisateurs sont lus depuis le dossier docs/ du dépôt (voir pages/aides/GuideUtilisation.jsx)
  server: { fs: { allow: ['..'] } },
})
