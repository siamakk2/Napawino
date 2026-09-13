// Napa Wino incremental deploy builder — v6.9
// Adds /harvest-2026.html, /events.html, /itineraries.html, /ag-preserve.html.
// Fetches every existing production file from www.napawino.com at build time and
// writes it through unchanged, so nothing is reconstructed from memory. Patches
// index.html nav, sitemap.xml and llms.txt with single-match guards.
// ANY fetch failure or patch-count mismatch exits 1 and holds old production.

const fs = require('fs');
const path = require('path');
const ORIGIN = 'https://www.napawino.com';
const OUT = 'public';

function die(msg) { console.error('BUILD ABORT: ' + msg); process.exit(1); }

function must(haystack, find, label) {
  const n = haystack.split(find).length - 1;
  if (n !== 1) die(`anchor "${label}" matched ${n} times (expected exactly 1)`);
  return true;
}

// Files carried through from live production. Anything 404ing aborts the build.
const CARRY = [
  'index.html',
  'site.css',
  'article.css',
  'logo.svg',
  'robots.txt',
  'llms.txt',
  'sitemap.xml',
  'real-estate.html',
  'dog-friendly.html',
  'things-to-do.html',
  'napa.html',
  'yountville.html',
  'st-helena.html',
  'calistoga.html',
  'articles/first-time-napa-guide.html',
  'articles/best-time-to-visit-napa.html',
  'articles/napa-towns-guide.html',
  'articles/napa-avas-explained.html',
  'articles/best-napa-wineries.html',
  'articles/napa-wine-train-guide.html',
  'articles/3-day-napa-itinerary.html',
  'articles/napa-real-estate-guide.html'
];

// New pages shipped in the source tree.
const NEW_PAGES = [
  'harvest-2026.html',
  'events.html',
  'itineraries.html',
  'ag-preserve.html'
];

const SITEMAP_ADD = [
  ['harvest-2026.html', 'weekly', '0.9'],
  ['events.html', 'weekly', '0.9'],
  ['itineraries.html', 'monthly', '0.9'],
  ['ag-preserve.html', 'monthly', '0.8']
];

const LLMS_ADD =
  "- [Napa Valley Harvest 2026](https://www.napawino.com/harvest-2026.html): what the 2026 vintage is doing and when to visit for it\n" +
  "- [Napa Valley Events](https://www.napawino.com/events.html): verified dates for festivals, harvest balls and seasonal programmes\n" +
  "- [Napa Valley Itineraries](https://www.napawino.com/itineraries.html): one- and two-day plans built around drive times, not wish lists\n" +
  "- [Why Napa Still Looks Like This](https://www.napawino.com/ag-preserve.html): the 1968 Agricultural Preserve and what it means for visitors and buyers";

async function grab(rel) {
  const url = `${ORIGIN}/${rel}`;
  let r;
  try { r = await fetch(url); }
  catch (e) { die(`network error fetching ${url}: ${e.message}`); }
  if (!r.ok) die(`fetch ${url} returned HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (!buf.length) die(`fetch ${url} returned 0 bytes`);
  return buf;
}

function writeOut(rel, buf) {
  const p = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, buf);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  // 1. Pull every live file through unchanged.
  const live = {};
  for (const rel of CARRY) {
    live[rel] = await grab(rel);
    console.log(`fetched ${rel} (${live[rel].length} B)`);
  }

  // 2. Patch index.html — add the two new nav entries beside the existing Guides link.
  let index = live['index.html'].toString('utf8');
  const NAV_ANCHOR = '<a href="/real-estate.html">Real Estate</a>';
  must(index, NAV_ANCHOR, 'index nav Real Estate link');
  index = index.replace(
    NAV_ANCHOR,
    '<a href="/itineraries.html">Plan a Day</a><a href="/events.html">What\'s On</a>' + NAV_ANCHOR
  );
  live['index.html'] = Buffer.from(index, 'utf8');

  // 3. Patch sitemap.xml.
  let sitemap = live['sitemap.xml'].toString('utf8');
  must(sitemap, '</urlset>', 'sitemap closing tag');
  const today = new Date().toISOString().slice(0, 10);
  for (const [f] of SITEMAP_ADD) {
    if (sitemap.includes(`/${f}<`)) die(`sitemap already contains ${f}`);
  }
  const rows = SITEMAP_ADD.map(([f, freq, pri]) =>
    `  <url><loc>https://www.napawino.com/${f}</loc><lastmod>${today}</lastmod>` +
    `<changefreq>${freq}</changefreq><priority>${pri}</priority></url>`
  ).join('\n');
  sitemap = sitemap.replace('</urlset>', rows + '\n</urlset>');
  live['sitemap.xml'] = Buffer.from(sitemap, 'utf8');

  // 4. Patch llms.txt.
  let llms = live['llms.txt'].toString('utf8');
  must(llms, '## Facts worth citing', 'llms facts heading');
  llms = llms.replace('## Facts worth citing', LLMS_ADD + '\n\n## Facts worth citing');
  live['llms.txt'] = Buffer.from(llms, 'utf8');

  // 5. Write everything out.
  for (const rel of Object.keys(live)) writeOut(rel, live[rel]);

  // 6. Local source files: data.js and the four new pages.
  writeOut('data.js', fs.readFileSync('data.js'));
  console.log('copied data.js');
  for (const p of NEW_PAGES) {
    if (!fs.existsSync(path.join('pages', p))) die(`missing local source pages/${p}`);
    writeOut(p, fs.readFileSync(path.join('pages', p)));
    console.log(`added ${p}`);
  }

  const total = CARRY.length + 1 + NEW_PAGES.length;
  const written = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const fp = path.join(d, e.name);
      e.isDirectory() ? walk(fp) : written.push(fp);
    }
  })(OUT);
  if (written.length !== total) die(`wrote ${written.length} files, expected ${total}`);
  console.log(`BUILD OK — ${written.length} files in ${OUT}/`);
})();
