import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Cho phép truy cập qua tunnel (Cloudflare / ngrok) khi test từ xa.
  // Dấu chấm đầu = mọi subdomain. Chỉ ảnh hưởng server dev/preview ở máy bạn,
  // không liên quan tới bản build tĩnh khi deploy VPS.
  preview: {
    allowedHosts: [".trycloudflare.com", ".ngrok-free.app", ".ngrok.io", ".loca.lt"],
  },
  server: {
    allowedHosts: [".trycloudflare.com", ".ngrok-free.app", ".ngrok.io", ".loca.lt"],
  },
});
