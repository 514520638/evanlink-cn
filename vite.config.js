import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [react()],
    server: {
        host: '127.0.0.1',
        port: 8081,
        proxy: {
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
});
