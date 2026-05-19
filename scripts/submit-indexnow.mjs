import { readFile } from "node:fs/promises";

const SITE_ORIGIN = "https://hernandezlandscapeservices.com";
const HOST = new URL(SITE_ORIGIN).hostname;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const KEY = "4860d66f-e230-4e8a-9a96-adb5aba6b220";
const KEY_LOCATION = `${SITE_ORIGIN}/${KEY}.txt`;

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function extractSitemapUrls(xml) {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map((match) => match[1].trim())
    .filter((url) => url.startsWith(`${SITE_ORIGIN}/`));
}

async function main() {
  const sitemapXml = await readFile(new URL("../sitemap.xml", import.meta.url), "utf8");
  const urlList = extractSitemapUrls(sitemapXml);

  if (!urlList.length) {
    throw new Error("No site URLs found in sitemap.xml");
  }

  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  };

  if (hasFlag("--dry-run")) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.text();
  console.log(
    JSON.stringify(
      {
        endpoint: INDEXNOW_ENDPOINT,
        status: response.status,
        ok: response.ok || response.status === 202,
        submitted: urlList.length,
        response: body || null,
      },
      null,
      2,
    ),
  );

  if (!response.ok && response.status !== 202) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
