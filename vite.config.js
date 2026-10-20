import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: funciona em GitHub Pages (subpasta) e em qualquer hospedagem estática.
export default defineConfig({ base: './', plugins: [react()] });
