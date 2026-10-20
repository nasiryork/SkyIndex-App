// Builds data/airports.js from the OurAirports airports.csv (public domain).
// Usage: node scripts/build-data.mjs [path/to/airports.csv]
// Default input: scripts/raw/airports.csv
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = process.argv[2] ?? fileURLToPath(new URL('./raw/airports.csv', import.meta.url));
const dest = fileURLToPath(new URL('../data/airports.js', import.meta.url));

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const [header, ...rows] = parseCSV(readFileSync(src, 'utf8'));
const col = Object.fromEntries(header.map((h, i) => [h, i]));
const SIZE = { large_airport: 'L', medium_airport: 'M', small_airport: 'S' };
const RANK = { L: 3, M: 2, S: 1 };

const byIata = new Map();
for (const r of rows) {
  const size = SIZE[r[col.type]];
  const iata = r[col.iata_code]?.trim().toUpperCase();
  if (!size || !/^[A-Z]{3}$/.test(iata) || r[col.scheduled_service] !== 'yes') continue;
  const rec = [
    iata,
    r[col.icao_code] || r[col.ident] || '',
    r[col.name],
    (r[col.municipality] || '').replace(/\s*\(.*\)\s*/, ''),
    r[col.iso_country],
    +(+r[col.latitude_deg]).toFixed(4),
    +(+r[col.longitude_deg]).toFixed(4),
    size,
  ];
  const prev = byIata.get(iata);
  if (!prev || RANK[size] > RANK[prev[7]]) byIata.set(iata, rec);
}

const list = [...byIata.values()].sort((a, b) => a[0].localeCompare(b[0]));
writeFileSync(dest, `window.AIRPORTS=[\n${list.map(r => JSON.stringify(r)).join(',\n')}\n];\n`);
console.log(`Wrote ${list.length} airports to ${dest}`);
