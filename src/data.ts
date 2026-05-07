export type HourPoint = { t: string; tone: number; n: number };
export type CountryData = { iso: string; hours: HourPoint[] };
export type Dataset = {
  generatedAt: string;
  windowHours: number;
  countries: CountryData[];
};

export type CountryStats = {
  iso: string;
  latest: number;       // last value of the smoothed series
  mean: number;         // mean of raw tones
  stddev: number;       // stddev of raw tones
  zScore: number;       // raw last vs raw mean — for anomaly rings
  change7d: number;     // smoothed last − smoothed first
  articleCount: number; // raw n in the last hour
  hours: HourPoint[];
  smoothedTones: number[];
};

/**
 * Centered moving average weighted by article count. An hour with one
 * article gets a tiny weight; an hour with thousands of articles dominates.
 * Damps hourly noise from low-volume countries without flattening real
 * trends from high-volume ones.
 */
export function smoothWeighted(
  tones: number[],
  counts: number[],
  halfWindow = 3,
): number[] {
  const len = tones.length;
  const out = new Array<number>(len);
  for (let i = 0; i < len; i++) {
    const lo = Math.max(0, i - halfWindow);
    const hi = Math.min(len - 1, i + halfWindow);
    let weightedSum = 0;
    let totalWeight = 0;
    for (let j = lo; j <= hi; j++) {
      const w = counts[j] || 0;
      weightedSum += tones[j] * w;
      totalWeight += w;
    }
    // If the entire window has zero articles fall back to the raw value.
    out[i] = totalWeight > 0 ? weightedSum / totalWeight : tones[i];
  }
  return out;
}

export function computeStats(country: CountryData): CountryStats | null {
  const hours = country.hours;
  if (hours.length < 2) return null;
  const last = hours[hours.length - 1];
  const tones = hours.map((h) => h.tone);
  const counts = hours.map((h) => h.n);
  const smoothed = smoothWeighted(tones, counts, 3);
  const mean = tones.reduce((a, b) => a + b, 0) / tones.length;
  const variance =
    tones.reduce((a, b) => a + (b - mean) ** 2, 0) / tones.length;
  const stddev = Math.sqrt(variance) || 1e-6;
  return {
    iso: country.iso,
    latest: smoothed[smoothed.length - 1],
    mean,
    stddev,
    zScore: (last.tone - mean) / stddev,
    change7d: smoothed[smoothed.length - 1] - smoothed[0],
    articleCount: last.n,
    hours,
    smoothedTones: smoothed,
  };
}

export function buildIndex(data: Dataset): Map<string, CountryStats> {
  const index = new Map<string, CountryStats>();
  for (const c of data.countries) {
    const s = computeStats(c);
    if (s) index.set(c.iso, s);
  }
  return index;
}

export function toneColor(tone: number, alpha = 0.85): string {
  const t = Math.max(-1, Math.min(1, tone / 10));
  const neg = [239, 68, 68];   // #ef4444
  const mid = [107, 114, 128]; // #6b7280
  const pos = [34, 197, 94];   // #22c55e
  const lerp = (a: number[], b: number[], k: number) =>
    a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const rgb = t < 0 ? lerp(mid, neg, -t) : lerp(mid, pos, t);
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}
