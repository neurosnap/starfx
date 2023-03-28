import { build, emptyDir } from "https://deno.land/x/dnt@0.17.0/mod.ts";
import { assert } from "https://deno.land/std@0.129.0/testing/asserts.ts";
await emptyDir("./npm");

const version = Deno.env.get("NPM_VERSION");
assert(version, "NPM_VERSION is required to build npm package");

await build({
  entryPoints: ["./mod.ts", "./react.ts", "./redux.ts"],
  outDir: "./npm",
  shims: {
    deno: false,
  },
  test: false,
  typeCheck: false,
  compilerOptions: {
    target: "ES2020",
    sourceMap: true,
  },
  package: {
    // package.json properties
    name: "starfx",
    version,
    description: "Declarative side-effects for your apps",
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
      node: ">= 14",
    },
  },
});

await Deno.copyFile("README.md", "npm/README.md");
