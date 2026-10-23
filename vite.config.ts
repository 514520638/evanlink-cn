import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 8081,
    // Vite 4.5.11+ 的 Host 头校验：放行自有域名（. 前缀同时匹配 evanlink.cn 与其子域）
    allowedHosts: ['.evanlink.cn'],
    proxy: {
      '/agent-api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        timeout: 180000,
        proxyTimeout: 180000,
      },
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
  preview: {
    allowedHosts: ['.evanlink.cn'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
})
