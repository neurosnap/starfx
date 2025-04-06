import { call, main, type Operation } from "effection";

await main(function* (): Operation<void> {
  const [syncMethod, folderFromArgs] = Deno.args;
  const folder = folderFromArgs ?? "starfx-examples/vite-react";
  const dir = `../${folder}/node_modules/starfx`;
  const npmAssets = yield* call(() => Deno.realPath("./npm"));

  if (syncMethod === "install") {
    // parcel doesn't handle symlinks well, do a `file:` install instead
    const command = new Deno.Command("npm", {
      args: ["add", "starfx@file:../../starfx/npm", "--install-links"],
      cwd: `../${folder}`,
      stderr: "piped",
      stdout: "piped",
    });
    yield* call(() => command.output());
  } else if (syncMethod === "symlink") {
    // this option is primarily for local usage
    try {
      yield* call(() => Deno.remove(dir, { recursive: true }));
    } catch (_error) {
      // assume that the folder does not exist
    }

    // create a symlink to the `dir` which should allow
    // this example to run with the build assets
    yield* call(() => Deno.symlink(npmAssets, dir));
  }
});
