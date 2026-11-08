import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // ตอน dev: เรียก /api/* จะถูก proxy ไป backend ที่ localhost:8080
    // ทำให้ frontend ใช้ path '/api' เหมือนกันทั้ง dev และ prod
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
