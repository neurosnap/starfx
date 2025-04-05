import { build, emptyDir } from "jsr:@deno/dnt@0.41.3";
import path from "node:path";

const [version] = Deno.args;
if (!version) {
  throw new Error("a version argument is required to build the npm package");
}
const outDir = "./npm";
const mappingPeerDeps = {
  "react": {
    ref: "npm:react@^18.2.0",
    name: "react",
    version: "^18.2.0",
    peerDependency: true,
  },
  "react-redux": {
    ref: "npm:react-redux@^8.0.5",
    name: "react-redux",
    version: "^8.0.5",
    peerDependency: true,
  },
};

init().then(console.log).catch(console.error);

async function init() {
  await emptyDir(outDir);
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
        version: "3.0.0-beta.3",
        peerDependency: false,
      },
      [mappingPeerDeps["react"].ref]: {
        name: mappingPeerDeps["react"].name,
        version: mappingPeerDeps["react"].version,
        peerDependency: mappingPeerDeps["react"].peerDependency,
      },
      [mappingPeerDeps["react-redux"].ref]: {
        name: mappingPeerDeps["react-redux"].name,
        version: mappingPeerDeps["react-redux"].version,
        peerDependency: mappingPeerDeps["react-redux"].peerDependency,
      },
    },
    importMap: "deno.json",
    outDir,
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

  // npm mappings aren't supported with peerDeps
  // https://github.com/denoland/dnt/issues/433
  const packageJsonPath = path.join(outDir, "package.json");
  await Deno.readTextFile(packageJsonPath).then(async (v) => {
    console.log("rewriting some deps to peerDeps");
    const initial = JSON.parse(v);
    delete initial.dependencies[mappingPeerDeps["react"].name];
    delete initial.dependencies[mappingPeerDeps["react-redux"].name];
    initial.peerDependencies = {
      [mappingPeerDeps["react"].name]: mappingPeerDeps["react"].version,
      [mappingPeerDeps["react-redux"].name]:
        mappingPeerDeps["react-redux"].version,
    };
    initial.peerDependenciesMeta = {
      [mappingPeerDeps["react"].name]: {
        "optional": true,
      },
      [mappingPeerDeps["react-redux"].name]: {
        "optional": true,
      },
    };
    await Deno.writeTextFile(packageJsonPath, JSON.stringify(initial, null, 2));
  });
}
