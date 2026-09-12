import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/packages/**/tests/**/*.test.ts"],
  },
});
