import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Cấu hình Vite
export default defineConfig(({ mode }) => {
  // Tải các biến môi trường từ file .env theo chế độ (development/production)
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Định nghĩa các biến môi trường cần dùng trong code
      __APP_ENV__: JSON.stringify(env.VITE_APP_ENV),
    },
    resolve: {
      alias: {
        // Định nghĩa alias để dễ dàng import trong project
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
