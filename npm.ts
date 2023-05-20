import { assert, build, emptyDir } from "./test.ts";

await emptyDir("./npm");

const version = Deno.env.get("NPM_VERSION");
assert(version, "NPM_VERSION is required to build npm package");

await build({
  entryPoints: [
    "./index.ts",
    "./react.ts",
    "./redux/index.ts",
    "./query/index.ts",
  ],
  outDir: "./npm",
  shims: {
    deno: false,
    undici: true,
  },
  test: false,
  typeCheck: false,
  compilerOptions: {
    target: "ES2020",
    sourceMap: true,
  },
  package: {
    name: "starfx",
    version,
    description: "Supercharged async flow control library",
    license: "MIT",
    repository: {
      author: "me@erock.io",
      type: "git",
      url: "git+https://github.com/neurosnap/starfx.git",
    },
    bugs: {
      url: "https://github.com/neurosnap/starfx/issues",
    },
    engines: {
      node: ">= 18",
    },
    sideEffects: false,
  },
  postBuild() {
    Deno.copyFileSync("LICENSE.md", "npm/LICENSE.md");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});

await Deno.copyFile("README.md", "npm/README.md");
