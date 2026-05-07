// Generates public/tone.json with 7 days of synthetic hourly tone for ~36
// representative countries. Replace with real BigQuery output before going live.
//
// Run: npm run sample-data
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// [iso3, baseline tone, volatility]
const COUNTRIES = [
  ['USA', -2, 3.5], ['CAN', 1, 2.0], ['MEX', -1, 2.5], ['BRA', -3, 3.0],
  ['ARG', -2, 2.5], ['GBR', -1, 2.5], ['FRA', -2, 3.0], ['DEU', 0, 2.0],
  ['ESP', -1, 2.5], ['ITA', -1.5, 2.5], ['RUS', -5, 4.0], ['UKR', -7, 4.5],
  ['CHN', -1, 2.5], ['JPN', 1.5, 2.0], ['KOR', 0, 2.0], ['IND', -1, 3.0],
  ['IDN', 0.5, 2.0], ['AUS', 2, 1.5], ['NZL', 2.5, 1.2], ['ZAF', -2, 3.0],
  ['NGA', -3, 3.5], ['EGY', -2, 3.0], ['SAU', -1, 2.0], ['IRN', -4, 3.5],
  ['ISR', -5, 4.0], ['TUR', -2, 3.0], ['PAK', -2.5, 3.0], ['THA', 0.5, 1.8],
  ['VNM', 1, 1.8], ['SWE', 1.5, 1.5], ['NOR', 2, 1.5], ['CHE', 2, 1.5],
  ['NLD', 1, 1.8], ['POL', -1, 2.5], ['GRC', -1, 2.5], ['PRT', 0.5, 2.0],
  ['CHL', 0, 2.0], ['COL', -2, 3.0], ['VEN', -4, 3.5], ['KEN', -1, 2.5],
  ['ETH', -2, 3.0], ['MAR', 0, 2.0], ['DZA', -1, 2.5], ['IRQ', -5, 4.0],
  ['SYR', -6, 4.0], ['AFG', -5, 4.0], ['MMR', -4, 3.5], ['PHL', 0, 2.0],
  ['MYS', 0.5, 1.8], ['SGP', 1.5, 1.5],
];

const HOURS = 168;
const now = new Date();
now.setMinutes(0, 0, 0);

function rand(seed) {
  let x = seed | 0;
  return () => {
    x = (x * 1664525 + 1013904223) | 0;
    return ((x >>> 0) % 1_000_000) / 1_000_000;
  };
}

const dataset = {
  generatedAt: now.toISOString(),
  windowHours: HOURS,
  countries: COUNTRIES.map(([iso, base, vol]) => {
    const r = rand(
      iso.charCodeAt(0) * 1000 + iso.charCodeAt(1) * 31 + iso.charCodeAt(2),
    );
    let tone = base;
    const hours = [];
    for (let h = HOURS - 1; h >= 0; h--) {
      tone += (r() - 0.5) * vol * 0.6;
      tone += (base - tone) * 0.08;
      if (r() < 0.02) tone += (r() - 0.5) * vol * 3;
      const t = new Date(now.getTime() - h * 3_600_000).toISOString();
      const n = Math.floor(50 + r() * 4000);
      hours.push({ t, tone: +tone.toFixed(2), n });
    }
    return { iso, hours };
  }),
};

const out = 'public/tone.json';
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(dataset));
console.log(
  `wrote ${out} — ${dataset.countries.length} countries × ${HOURS}h`,
);
