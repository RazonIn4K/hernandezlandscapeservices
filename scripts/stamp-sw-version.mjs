// Stamps the service-worker cache name with the deploying commit SHA so cache
// busting never depends on remembering to bump the version by hand. Runs in the
// deploy workflow only — the committed sw.js keeps a readable fallback name.
import { readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";

const SW_PATH = new URL("../sw.js", import.meta.url);

function resolveSha() {
  const envSha = process.env.GITHUB_SHA;
  if (envSha) return envSha.slice(0, 12);
  return execSync("git rev-parse --short=12 HEAD").toString().trim();
}

const sha = resolveSha();
const sw = await readFile(SW_PATH, "utf8");
const pattern = /const CACHE_NAME = '[^']+';/;

if (!pattern.test(sw)) {
  console.error("Could not find CACHE_NAME declaration in sw.js");
  process.exit(1);
}

const stamped = sw.replace(
  pattern,
  `const CACHE_NAME = 'hernandez-landscape-${sha}';`,
);
await writeFile(SW_PATH, stamped);
console.log(`Stamped sw.js cache name: hernandez-landscape-${sha}`);
