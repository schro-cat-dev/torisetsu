import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    port: 5184,
    strictPort: false,
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
