import type { CountryStats } from '../data';

export type Ranking = {
  rank: number;
  total: number;
  side: 'positive' | 'negative';
};

/**
 * Rank countries by current tone:
 *   • side='negative' → most negative first (rank 1 = most negative)
 *   • side='positive' → most positive first (rank 1 = most positive)
 * Countries at exactly 0 are excluded from both.
 */
export function buildRankings(
  stats: Map<string, CountryStats>,
): Map<string, Ranking> {
  const arr = [...stats.values()];
  const negs = arr
    .filter((s) => s.latest < 0)
    .sort((a, b) => a.latest - b.latest);
  const pos = arr
    .filter((s) => s.latest > 0)
    .sort((a, b) => b.latest - a.latest);

  const out = new Map<string, Ranking>();
  negs.forEach((s, i) =>
    out.set(s.iso, { rank: i + 1, total: negs.length, side: 'negative' }),
  );
  pos.forEach((s, i) =>
    out.set(s.iso, { rank: i + 1, total: pos.length, side: 'positive' }),
  );
  return out;
}
