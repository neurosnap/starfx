import { build, emptyDir } from "jsr:@deno/dnt@0.41.3";

const [version] = Deno.args;
if (!version) {
  throw new Error("a version argument is required to build the npm package");
}

init().then(console.log).catch(console.error);

async function init() {
  await emptyDir("./npm");
  await build({
    declaration: "inline",
    scriptModule: "cjs",
    entryPoints: [
      {
        name: ".",
        path: "mod.ts",
      },
      {
        name: "./react",
        path: "react.ts",
      },
    ],
    mappings: {
      // use the deno module in this repo, but use the npm module when publishing
      "https://deno.land/x/effection@3.0.0-beta.3/mod.ts": {
        name: "effection",
        version: "4.0.0-alpha.3",
      },
    },
    importMap: "deno.json",
    outDir: "./npm",
    shims: {
      deno: false,
    },
    test: false,

    typeCheck: "both",
    compilerOptions: {
      target: "ES2020",
      sourceMap: true,
      lib: ["DOM", "DOM.Iterable", "ESNext"],
    },
    package: {
      name: "starfx",
      version,
      description:
        "Async flow control and state management system for deno, node, and browser",
      license: "MIT",
      author: {
        name: "Eric Bower",
        email: "me@erock.io",
      },
      repository: {
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
}
