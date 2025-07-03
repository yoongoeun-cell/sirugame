import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/sirugame/", // 이 부분 추가
  plugins: [react()],
});
