#!/usr/bin/env node
/**
 * Replace the no-JS $0-$0 homepage starting range and wire the helper script.
 * Idempotent. Used by Playwright and publish:prepare so crawlers never see $0-$0.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INDEX = path.join(ROOT, "index.html");
const HONEST = "Photo estimate \u2014 call or text (815) 501-1478";
const SCRIPT =
  '  <script src="/assets/js/price-range-placeholder.js" defer></script>\n';

let html = fs.readFileSync(INDEX, "utf8");
const original = html;

html = html.replace(
  /(<p class="text-3xl font-black text-green-600" id="priceRange">)[\s\S]*?(<\/p>)/,
  `$1\n              ${HONEST}\n            $2`,
);

if (!html.includes("price-range-placeholder.js")) {
  html = html.replace(
    /(<script src="\/assets\/js\/mobile-call-cta\.js" defer><\/script>\n)/,
    `$1${SCRIPT}`,
  );
}

if (html === original) {
  if (!html.includes(HONEST)) {
    throw new Error("apply-price-range-copy: #priceRange block not found in index.html");
  }
} else {
  fs.writeFileSync(INDEX, html);
  console.log("apply-price-range-copy: updated index.html");
}
