import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize build performance
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'query-vendor': ['@tanstack/react-query'],
          'date-vendor': ['date-fns'],
          'chart-vendor': ['recharts'],

          // Admin chunks (lazy loaded)
          'admin-components': [
            './src/components/admin/BookingManagement.tsx',
            './src/components/admin/RoomManagement.tsx',
            './src/components/admin/Analytics.tsx'
          ]
        }
      }
    },
    // Increase chunk size warning limit for better performance
    chunkSizeWarningLimit: 1000,
    // Enable source maps in production for debugging
    sourcemap: mode === 'production' ? 'hidden' : true
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'date-fns',
      'recharts'
    ]
  }
}));
