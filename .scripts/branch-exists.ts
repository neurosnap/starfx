import { call, main, type Operation } from "./deps.ts";

await main(function* (): Operation<void> {
  // based on env created from ${{ secrets.GITHUB_TOKEN }} in CI
  const token = Deno.env.get("GITHUB_TOKEN");
  const [branch, ownerRepo] = Deno.args;

  const response = yield* call(
    fetch(`https://api.github.com/repos/${ownerRepo}/branches`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  );

  if (response.ok) {
    const branches = yield* call(response.json());
    const branchList = branches.map((branch: { name: string }) => branch.name);
    if (branchList.includes(branch)) {
      console.log(`branch=${branch}`);
    } else {
      console.log(`branch=main`);
    }
  }
});
