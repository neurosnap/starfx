import { main, call, Operation } from "./deps.ts";

await main(function* (): Operation<void> {
  const os = Deno.build.os;
  const [folderFromArgs] = Deno.args;
  const folder = folderFromArgs ?? "starfx-examples/vite-react";
  const dir = `../${folder}/node_modules/starfx`;
  const npmAssets = yield* call(Deno.realPath("./npm"));

  try {
    // yield* call(Deno.remove("./npm/node_modules", { recursive: true }));
    yield* call(Deno.remove(dir, { recursive: true }));
  } catch (error) {
    // assume that it doesn't exist
  }

  // create a symlink to the `dir` which should allow
  // this example to run with the build assets
  yield* call(Deno.symlink(npmAssets, dir));
});
