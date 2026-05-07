// Returns SVG markup as a string — used inside the globe.gl polygonLabel
// HTML tooltip. For the React-rendered modal use components/Sparkline.tsx.
//
// The line is stroked with a vertical gradient: green above the zero line,
// red below. This visually couples the chart to the tone scale.

type Opts = { w?: number; h?: number };

let gradCounter = 0;

export function sparklineSvg(values: number[], opts: Opts = {}): string {
  const w = opts.w ?? 100;
  const h = opts.h ?? 28;
  if (values.length < 2) return '';

  let min = 0;
  let max = 0;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;

  const px = (i: number) => (i / (values.length - 1)) * w;
  const py = (v: number) => h - ((v - min) / range) * (h - 2) - 1;

  let pts = '';
  for (let i = 0; i < values.length; i++) {
    if (i > 0) pts += ' ';
    pts += `${px(i).toFixed(1)},${py(values[i]).toFixed(1)}`;
  }
  const zeroY = py(0);
  const zeroPct = Math.max(0, Math.min(1, zeroY / h));

  const gradId = `tg${++gradCounter}`;
  const grad = `<defs><linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="${h}" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" stop-color="#22c55e"/>` +
    `<stop offset="${zeroPct}" stop-color="#22c55e"/>` +
    `<stop offset="${zeroPct}" stop-color="#ef4444"/>` +
    `<stop offset="1" stop-color="#ef4444"/>` +
    `</linearGradient></defs>`;

  return (
    `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">` +
    grad +
    `<line x1="0" y1="${zeroY.toFixed(1)}" x2="${w}" y2="${zeroY.toFixed(1)}" stroke="rgba(255,255,255,0.18)" stroke-width="1" stroke-dasharray="2,3"/>` +
    `<polyline fill="none" stroke="url(#${gradId})" stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round" points="${pts}"/>` +
    `</svg>`
  );
}
