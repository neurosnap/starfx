import { assert, build, emptyDir } from "./test.ts";

main().then(console.log).catch(console.error);

async function main() {
  await emptyDir("./npm");

  const version = Deno.env.get("NPM_VERSION");
  assert(version, "NPM_VERSION is required to build npm package");

  await build({
    entryPoints: [
      {
        name: ".",
        path: "mod.ts",
      },
      {
        name: "./react",
        path: "react.ts",
      },
      {
        name: "./redux",
        path: "redux/mod.ts",
      },
      {
        name: "./query",
        path: "./query/mod.ts",
      },
    ],
    mappings: {
      "https://deno.land/x/effection@3.0.0-alpha.9/mod.ts": {
        name: "effection",
        version: "3.0.0-alpha.9",
      },
      "https://esm.sh/react@18.2.0?pin=v122": {
        name: "react",
        version: "^18.2.0",
        peerDependency: true,
      },
      "https://esm.sh/robodux@15.0.1?pin=v122": {
        name: "robodux",
        version: "^15.0.1",
      },
      "https://esm.sh/@reduxjs/toolkit@1.9.5?pin=v122": {
        name: "@reduxjs/toolkit",
        version: "^1.9.5",
      },
      "https://esm.sh/redux-batched-actions@0.5.0?pin=v122": {
        name: "redux-batched-actions",
        version: "^0.5.0",
      },
      "https://esm.sh/react-redux@8.0.5?pin=v122": {
        name: "react-redux",
        version: "^8.0.5",
        peerDependency: true,
      },
    },
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
      description: "Async flow control and state management system for deno, node, and browser",
      license: "MIT",
      author: {
        name: "Eric Bower",
        email: "me@erock.io"
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
