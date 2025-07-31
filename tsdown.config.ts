import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "./src/**/*.ts",
    "./src/cli.js",
    "./examples/basic-usage.ts",
    "./examples/error-handling.ts",
  ],
  outDir: "./dist",
  format: ["esm"],
  dts: true,
  clean: true,
  unbundle: true,
  external: ["zeromq", "emittery", "msgpackr", "hyperid", "pino"],
  platform: "node",
  target: "node22",
});
