export type HourPoint = { t: string; tone: number; n: number };
export type CountryData = { iso: string; hours: HourPoint[] };
export type Dataset = {
  generatedAt: string;
  windowHours: number;
  countries: CountryData[];
};

export type CountryStats = {
  iso: string;
  latest: number;
  mean: number;
  stddev: number;
  zScore: number;
  change7d: number;
  articleCount: number;
  hours: HourPoint[];
};

export function computeStats(country: CountryData): CountryStats | null {
  const hours = country.hours;
  if (hours.length < 2) return null;
  const last = hours[hours.length - 1];
  const first = hours[0];
  const tones = hours.map((h) => h.tone);
  const mean = tones.reduce((a, b) => a + b, 0) / tones.length;
  const variance =
    tones.reduce((a, b) => a + (b - mean) ** 2, 0) / tones.length;
  const stddev = Math.sqrt(variance) || 1e-6;
  return {
    iso: country.iso,
    latest: last.tone,
    mean,
    stddev,
    zScore: (last.tone - mean) / stddev,
    change7d: last.tone - first.tone,
    articleCount: last.n,
    hours,
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
