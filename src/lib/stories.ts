// GDELT DOC 2.0 API — recent articles by source country (FIPS code).
// CORS-enabled; queried directly from the browser on country click.
//
// We prefer English-language articles so non-anglophone countries still
// surface readable results, and fall back to all languages if there are
// none. The CountryModal labels non-English stories so the user knows.

export type Story = {
  url: string;
  title: string;
  domain: string;
  seendate: string; // YYYYMMDDTHHMMSSZ
  socialimage?: string;
  language: string;
  sourcecountry: string;
};

const ENDPOINT = 'https://api.gdeltproject.org/api/v2/doc/doc';

async function query(
  q: string,
  max: number,
  signal?: AbortSignal,
): Promise<Story[]> {
  const params = new URLSearchParams({
    query: q,
    format: 'json',
    maxrecords: String(max),
    sort: 'DateDesc',
    mode: 'ArtList',
  });
  const r = await fetch(`${ENDPOINT}?${params}`, { signal });
  if (!r.ok) throw new Error(`DOC API ${r.status}`);
  const data = await r.json().catch(() => ({}) as { articles?: Story[] });
  return (data.articles ?? []) as Story[];
}

export async function fetchStories(
  fipsCode: string,
  max = 8,
  signal?: AbortSignal,
): Promise<Story[]> {
  const en = await query(
    `sourcecountry:${fipsCode} sourcelang:english`,
    max,
    signal,
  );
  if (en.length > 0) return en;
  return query(`sourcecountry:${fipsCode}`, max, signal);
}

export function parseSeenDate(s: string): Date {
  const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}Z`;
  return new Date(iso);
}

export function relativeTime(d: Date, now = new Date()): string {
  const diffSec = (now.getTime() - d.getTime()) / 1000;
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86_400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86_400)}d ago`;
}
