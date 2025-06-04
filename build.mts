// https://github.com/colinhacks/zod/blob/c58bd9b0125881caee03a408eae88ec1dc5eb18b/packages/zod/build.mts
import * as fs from "node:fs";
import * as path from "node:path";
import { execaSync } from "execa";

const $ = execaSync({ stdio: "inherit" });

$`rm -rf ./dist`;

function writePackageJson(dir: string, fields: Record<string, any>) {
  const packageJsonPath = path.join(path.resolve(dir), "package.json");
  fs.mkdirSync(dir, {
    recursive: true,
  });
  console.log(`writing package.json to ${packageJsonPath}...`);
  fs.writeFileSync(packageJsonPath, JSON.stringify(fields, null, 2));
  return packageJsonPath;
}

console.log("building ESM...");
const esmPkg = writePackageJson("./src", { type: "module" });
$`npx tsc -p tsconfig.esm.json`;
fs.rmSync(esmPkg, { force: true });

writePackageJson("./dist/esm", { type: "module" });

console.log("building CJS...");
const cjsPkg = writePackageJson("./src", { type: "commonjs" });
$`npx tsc -p tsconfig.cjs.json`;
fs.rmSync(cjsPkg, { force: true });
writePackageJson("./dist/cjs", { type: "commonjs" });

console.log("building types...");
$`npx tsc -p tsconfig.types.json`;
writePackageJson("./dist/types", { type: "commonjs" });

console.log("DONE.");
