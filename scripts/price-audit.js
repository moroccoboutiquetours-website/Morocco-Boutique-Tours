// Checks that every tour's prices agree everywhere they appear:
// the tour page's price box, its JSON-LD offers, its FAQ answer,
// and every "From €X" card on any page that links to that tour.
// Usage: node scripts/price-audit.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const num = s => Number(String(s).replace(/[^0-9]/g, ''));
const pages = fs.readdirSync(root).filter(f => f.endsWith('.html'));

const tours = {};
for (const f of pages.filter(f => f.startsWith('tour-'))) {
  const html = fs.readFileSync(path.join(root, f), 'utf8');
  const slug = f.slice(0, -5);
  // Price box: label then amount, e.g. Double / Twin ... €1,157
  const box = {};
  const boxRe = /(Single Room|Double \/ Twin|Triple Room|Quadruple Room)<\/[^>]+>\s*<[^>]+>\s*€([\d,]+)/g;
  let m;
  while ((m = boxRe.exec(html))) box[m[1]] = num(m[2]);
  const ld = [...html.matchAll(/"price":\s*"?([\d.]+)"?/g)].map(x => Math.round(Number(x[1])));
  const faq = [...html.matchAll(/[Tt]he €([\d,]+) per[- ]person/g)].map(x => num(x[1]));
  tours[slug] = { box, ld, faq };
}

const problems = [];
for (const [slug, t] of Object.entries(tours)) {
  const dbl = t.box['Double / Twin'];
  if (!dbl) { problems.push(`${slug}: price box not found`); continue; }
  const boxVals = Object.values(t.box).sort((a, b) => a - b).join(',');
  const ldVals = [...t.ld].sort((a, b) => a - b).join(',');
  if (t.ld.length && boxVals !== ldVals) problems.push(`${slug}: price box [${boxVals}] vs JSON-LD [${ldVals}]`);
  const badFaq = t.faq.filter(v => v !== dbl);
  if (badFaq.length) problems.push(`${slug}: page text mentions €${[...new Set(badFaq)].join(', €')} but double is €${dbl}`);
}

// Cards anywhere linking to a tour with a "From €X" price.
for (const f of pages) {
  const html = fs.readFileSync(path.join(root, f), 'utf8');
  const cardRe = /<a[^>]+href="\/(tour-[a-z0-9-]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = cardRe.exec(html))) {
    const from = m[2].match(/From €([\d,]+)/);
    if (!from || !tours[m[1]]) continue;
    const dbl = tours[m[1]].box['Double / Twin'];
    if (dbl && num(from[1]) !== dbl) problems.push(`${f}: card for ${m[1]} says From €${from[1]}, page double is €${dbl}`);
  }
}

console.log(`${Object.keys(tours).length} tour pages checked.`);
console.log(problems.length ? problems.join('\n') : 'No price mismatches.');
