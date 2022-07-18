import { defineConfig } from "tsup";

const config = defineConfig([
  // cjs
  {
    entry: ["src/changelog-github.ts"],
    format: "cjs",
    sourcemap: true,
  },

  // esm
  {
    entry: ["src/changelog-github.ts"],
    dts: true,
    format: "esm",
    sourcemap: true,
  },
]);

export default config;
