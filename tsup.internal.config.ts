import { configOptions as baseConfigOptions } from "./tsup.config";
import { defineConfig } from "tsup";
import type { Options } from "tsup";

let configOptions: Options[] = baseConfigOptions.map((opts) => {
  return {
    ...opts,
    outDir: "node_modules/@remix-run/changelog-github/dist",
  };
});

const config = defineConfig(configOptions);

export default config;
