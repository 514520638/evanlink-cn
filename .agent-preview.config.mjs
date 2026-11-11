import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()], resolve: { alias: { '@': '/Users/xdf/Desktop/project/evanlink-cn/src' } }, server: { host: '127.0.0.1', port: 8082, strictPort: true, proxy: { '/agent-api': { target: 'http://127.0.0.1:8002', changeOrigin: true }, '/api': { target: 'http://127.0.0.1:8080', changeOrigin: true } } }, css: { preprocessorOptions: { less: { javascriptEnabled: true } } } })
