import path from "path";
import { describe, test, expect } from "bun:test";
import { bunExe } from "../../../harness";

const modes = [
  //
  { label: "base" },
  { label: "minify-all", args: ["--minify"] },
  { label: "minify-syntax", args: ["--minify-syntax"] },
  { label: "minify-whitespace", args: ["--minify-whitespace"] },
  { label: "sourcemaps", args: ["--minify", "--sourcemap=external"] },
];
const nodeEnvs = ["development", "production"];
const combinations = nodeEnvs.flatMap(nodeEnv => modes.map(mode => ({ options: mode, nodeEnv })));

describe("bundler integration, react SSR", () => {
  for (const {
    options: { label, args },
    nodeEnv,
  } of combinations) {
    test(label + ", NODE_ENV=" + nodeEnv, async () => {
      const out = path.join(import.meta.dir, "dist/ssr/" + label + "-" + nodeEnv);
      const x = Bun.spawnSync(
        [
          bunExe(),
          "build",
          ...(args ?? []),
          "--target=bun",
          "--outdir=" + out,
          path.join(import.meta.dir, "ssr-print.jsx"),
        ],
        {
          // cwd: import.meta.dir + "/react",
          env: nodeEnv ? { NODE_ENV: nodeEnv } : undefined,
        },
      );
      const proc = Bun.spawnSync([bunExe(), path.join(out, "ssr-print.js")], {
        cwd: path.join(import.meta.dir),
      });
      if (!proc.success) {
        console.error(proc.stderr.toString());
        throw new Error("Process failed");
      }
      expect(proc.stdout).toMatchSnapshot("Output");
    });
  }
});