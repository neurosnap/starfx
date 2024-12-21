import { call, main, type Operation } from "effection";

await main(function* (): Operation<void> {
  // based on env created from ${{ secrets.GITHUB_TOKEN }} in CI
  const token = Deno.env.get("GITHUB_TOKEN");
  const [branch, ownerRepo] = Deno.args;
  console.dir({ branch, ownerRepo });

  const response = yield* call(
    fetch(`https://api.github.com/repos/${ownerRepo}/branches`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        // the token isn't required but helps with rate limiting
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }),
  );

  if (response.ok) {
    const branches = yield* call(response.json());
    const branchList = branches.map((branch: { name: string }) => branch.name);
    // for CI debug purposes
    console.dir({ branchList });
    // GitHub Actions maintains the step output through a file which you append keys into
    //   the path that file is available as an env var
    if (Deno.env.get("CI")) {
      const output = Deno.env.get("GITHUB_OUTPUT");
      if (!output) throw new Error("$GITHUB_OUTPUT is not set");
      const encoder = new TextEncoder();
      if (branchList.includes(branch)) {
        const data = encoder.encode(`branch=${branch}`);
        yield* call(Deno.writeFile(output, data, { append: true }));
      } else {
        const data = encoder.encode("branch=main");
        yield* call(Deno.writeFile(output, data, { append: true }));
      }
    }
    // always log out the branch for both CI and local running
    if (branchList.includes(branch)) {
      console.log(`branch=${branch}`);
    } else {
      console.log(`branch=main`);
    }
  } else {
    console.error(
      `Error trying to fetch https://api.github.com/repos/${ownerRepo}/branches and check for ${branch}`,
    );
    const text = yield* call(response.text());
    throw new Error(text);
  }
});
