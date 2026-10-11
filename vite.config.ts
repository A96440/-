import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['favicon.svg'],
    manifest: {
      name: '小日常私人版',
      short_name: '小日常',
      description: '私人习惯打卡助手',
      theme_color: '#f7f8f5',
      background_color: '#f7f8f5',
      display: 'standalone',
      start_url: '/',
      lang: 'zh-CN',
    },
    workbox: { globPatterns: ['**/*.{js,css,html,ico,svg,png}'] },
  })],
})
