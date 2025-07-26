import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/**/*.ts", "./examples/**/*.ts"],
  outDir: "./dist",
  format: ["esm"],
  dts: true,
  clean: true,
  unbundle: true,
  external: ["zeromq", "emittery", "msgpackr", "hyperid", "pino"],
  platform: "node",
  target: "node22",
});
