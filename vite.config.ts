import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/sud-real-estate-app/', // ← ده بيوجه GitHub Pages لمكان ملفاتك الحقيقي
});