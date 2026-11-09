import { defineConfig } from 'vite';

export default defineConfig({
    // Suhteelliset polut: vaaditaan sekä GitHub Pagesin alipolulle
    // (/metsainfo/) että Capacitorille (capacitor://localhost)
    base: './',
    build: {
        outDir: 'dist',
        emptyOutDir: true
    }
});
