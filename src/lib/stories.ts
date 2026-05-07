// GDELT DOC 2.0 API — recent English-language articles ABOUT a country.
// CORS-enabled; queried directly from the browser on country click.
//
// We search by country name as a quoted phrase + sourcelang:english + sort
// by HybridRel (relevance). This surfaces world coverage of the country
// (which is what the tone score actually reflects) rather than local
// journalism that happens to be published in English. Single round-trip.
//
// Results are memoized for the lifetime of the page so re-opening a
// country's modal is instant.

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
const cache = new Map<string, Story[]>();

async function query(
  q: string,
  max: number,
  signal?: AbortSignal,
): Promise<Story[]> {
  const params = new URLSearchParams({
    query: q,
    format: 'json',
    maxrecords: String(max),
    sort: 'HybridRel',
    mode: 'ArtList',
  });
  const r = await fetch(`${ENDPOINT}?${params}`, { signal });
  if (!r.ok) throw new Error(`DOC API ${r.status}`);
  const data = await r.json().catch(() => ({}) as { articles?: Story[] });
  return (data.articles ?? []) as Story[];
}

export async function fetchStories(
  countryName: string,
  max = 8,
  signal?: AbortSignal,
): Promise<Story[]> {
  const key = `${countryName}|${max}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const stories = await query(
    `"${countryName}" sourcelang:english`,
    max,
    signal,
  );
  cache.set(key, stories);
  return stories;
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
