import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env.GITHUB_ACTIONS === 'true' ? '/-/' : '/'
const safariAssetCompatibility = {
  name: 'safari-asset-compatibility',
  enforce: 'post' as const,
  transformIndexHtml(html: string) {
    return html.replaceAll(' crossorigin', '')
  },
}

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg'],
    manifest: {
      name: '小日常私人版',
      short_name: '小日常',
      description: '私人习惯打卡助手',
      theme_color: '#f7f8f5',
      background_color: '#f7f8f5',
      display: 'standalone',
      start_url: base,
      lang: 'zh-CN',
      scope: base,
      icons: [
        { src: `${base}icon-192.svg`, sizes: '192x192', type: 'image/svg+xml' },
        { src: `${base}icon-512.svg`, sizes: '512x512', type: 'image/svg+xml' },
      ],
    },
    workbox: { globPatterns: ['**/*.{js,css,html,ico,svg,png}'], cleanupOutdatedCaches: true },
  }), safariAssetCompatibility],
})
