import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

const root = resolve(__dirname, 'src');
const outDir = resolve(__dirname, '../../dist/particle-wind');

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: outDir,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          three: ['three'],
          fiber: ['@react-three/fiber'],
          drei: ['@react-three/drei'],
          useControls: ['leva'],
          postprocessing: ["@react-three/postprocessing"],
        }
      }
    }
  }


})
