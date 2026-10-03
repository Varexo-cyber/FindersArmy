import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    coverage: { include: ["src/lib/**"] },
  },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
