import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// 后端地址：默认本机 MindFlow 服务（8000 端口）
const BACKEND_TARGET = process.env.VITE_BACKEND_TARGET || 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      // 所有以 /api 开头的请求转发到后端并去掉 /api 前缀
      '/api': {
        target: BACKEND_TARGET,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) return 'charts'
          if (
            id.includes('react-markdown') ||
            id.includes('remark-') ||
            id.includes('rehype-') ||
            id.includes('unist-') ||
            id.includes('micromark') ||
            id.includes('mdast') ||
            id.includes('hast') ||
            id.includes('property-information') ||
            id.includes('comma-separated-tokens')
          )
            return 'markdown'
          if (id.includes('@radix-ui')) return 'radix'
          if (id.includes('react-virtuoso') || id.includes('virtua')) return 'list'
          if (id.includes('react-dom') || id.includes('react-router') || id.includes('scheduler')) return 'react'
          if (id.includes('pdfjs-dist') || id.includes('docx-preview') || id.includes('js-preview')) return 'preview'
          return 'vendor'
        },
      },
    },
  },
})
