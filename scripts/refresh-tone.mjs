// Run BigQuery → reshape → upload tone.json to R2.
//
// Required env (provided as GitHub Actions secrets):
//   GCP_PROJECT_ID
//   GOOGLE_APPLICATION_CREDENTIALS  (file path, set by google-github-actions/auth)
//   R2_ACCOUNT_ID
//   R2_ACCESS_KEY_ID
//   R2_SECRET_ACCESS_KEY
//   R2_BUCKET
//   R2_OBJECT_KEY  (optional, default 'tone.json')
//
// Run locally: `npm run refresh-tone` after setting the same env vars.

import { readFileSync } from 'node:fs';
import { BigQuery } from '@google-cloud/bigquery';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { FIPS_TO_ISO } from '../src/lib/fips-iso.js';

const SQL_PATH = 'bigquery/aggregate.sql';
const WINDOW_HOURS = 168;
const OBJECT_KEY = process.env.R2_OBJECT_KEY ?? 'tone.json';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`missing env: ${name}`);
  return v;
}

async function runQuery() {
  const bq = new BigQuery({ projectId: requireEnv('GCP_PROJECT_ID') });
  const sql = readFileSync(SQL_PATH, 'utf8');
  console.log('running BigQuery aggregation…');
  const start = Date.now();
  const [rows] = await bq.query({ query: sql, location: 'US' });
  console.log(`  ${rows.length} rows in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  return rows;
}

function reshape(rows) {
  const byIso = new Map();
  const unknownFips = new Set();

  for (const r of rows) {
    const iso = FIPS_TO_ISO[r.fips];
    if (!iso) {
      unknownFips.add(r.fips);
      continue;
    }
    if (!byIso.has(iso)) byIso.set(iso, new Map());
    const hourMap = byIso.get(iso);
    const t = new Date(r.hour.value ?? r.hour).toISOString();
    // If multiple FIPS map to same ISO, average their tones weighted by n.
    const existing = hourMap.get(t);
    if (existing) {
      const totalN = existing.n + Number(r.n);
      existing.tone = (existing.tone * existing.n + Number(r.tone) * Number(r.n)) / totalN;
      existing.n = totalN;
    } else {
      hourMap.set(t, { t, tone: Number(r.tone), n: Number(r.n) });
    }
  }

  if (unknownFips.size) {
    console.warn(`  unmapped FIPS codes (skipped): ${[...unknownFips].sort().join(', ')}`);
  }

  const countries = [...byIso].map(([iso, hourMap]) => {
    const hours = [...hourMap.values()]
      .sort((a, b) => a.t.localeCompare(b.t))
      .map((h) => ({ t: h.t, tone: +h.tone.toFixed(2), n: h.n }));
    return { iso, hours };
  });
  countries.sort((a, b) => a.iso.localeCompare(b.iso));
  return countries;
}

async function uploadToR2(body) {
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${requireEnv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    },
  });
  await s3.send(
    new PutObjectCommand({
      Bucket: requireEnv('R2_BUCKET'),
      Key: OBJECT_KEY,
      Body: body,
      ContentType: 'application/json',
      // Browser caches 10 min; CDN caches 1 hour (matches refresh cadence).
      CacheControl: 'public, max-age=600, s-maxage=3600',
    }),
  );
}

const rows = await runQuery();
const countries = reshape(rows);
const dataset = {
  generatedAt: new Date().toISOString(),
  windowHours: WINDOW_HOURS,
  countries,
};
const json = JSON.stringify(dataset);
await uploadToR2(json);
console.log(
  `uploaded ${OBJECT_KEY} — ${countries.length} countries, ${(json.length / 1024).toFixed(1)} KB`,
);
