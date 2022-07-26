import { defineConfig } from "tsup";
import type { Options } from "tsup";

export const configOptions: Options[] = [
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
];

const config = defineConfig(configOptions);

export default config;
