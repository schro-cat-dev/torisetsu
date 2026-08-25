import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false
  },
  test: {
    include: ["tests/unit/**/*.test.ts"]
  }
});
