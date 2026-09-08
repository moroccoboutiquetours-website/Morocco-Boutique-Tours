#!/usr/bin/env node
// One-time (or occasional) batch submit of every live URL in sitemap.xml to
// IndexNow. Defaults to a DRY RUN — it only prints the URL list it would
// submit. Pass --submit to actually call the IndexNow API.
//
// Usage:
//   node scripts/indexnow-submit-all.js            (dry run, no network call)
//   node scripts/indexnow-submit-all.js --submit    (requires INDEXNOW_KEY env var)

const fs = require('fs');
const path = require('path');

const SITEMAP_PATH = path.join(__dirname, '..', 'sitemap.xml');
const SITE_ORIGIN = 'https://www.moroccoboutiquetours.com';

function readSitemapUrls() {
  const xml = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim());
  return matches.filter((u) => u.startsWith(SITE_ORIGIN));
}

async function main() {
  const submit = process.argv.includes('--submit');
  const urls = readSitemapUrls();

  console.log(`Read ${urls.length} URLs from sitemap.xml:`);
  urls.forEach((u) => console.log(`  ${u}`));

  if (!submit) {
    console.log('\nDRY RUN — nothing was submitted. Re-run with --submit to actually call IndexNow.');
    return;
  }

  if (!process.env.INDEXNOW_KEY) {
    console.error('\nINDEXNOW_KEY is not set in the environment. Aborting — nothing was submitted.');
    process.exitCode = 1;
    return;
  }

  const { submitToIndexNow } = require('../netlify/functions/_lib/indexnow');
  const result = await submitToIndexNow(urls);

  if (result.ok) {
    console.log(`\nSubmitted ${result.submitted} URLs to IndexNow (HTTP ${result.status}).`);
  } else {
    console.error(`\nIndexNow submission failed: ${result.error || result.reason || `HTTP ${result.status}`}`);
    process.exitCode = 1;
  }
}

main();
