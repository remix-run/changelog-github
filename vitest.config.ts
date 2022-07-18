import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  plugins: [],
  test: {
    environment: "node",
    coverage: {
      include: ["**/*.test.{ts,tsx,js,jsx}"],
      exclude: [...configDefaults.exclude],
    },
    // setupFiles: ["./test/setupTests.ts"],
  },
});
