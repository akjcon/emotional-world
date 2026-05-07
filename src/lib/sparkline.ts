// Returns SVG markup as a string — used inside the globe.gl polygonLabel
// HTML tooltip. For the React-rendered modal use components/Sparkline.tsx.

type Opts = { w?: number; h?: number; color?: string };

export function sparklineSvg(values: number[], opts: Opts = {}): string {
  const w = opts.w ?? 100;
  const h = opts.h ?? 28;
  const color = opts.color ?? 'rgba(255, 255, 255, 0.78)';
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
  const zeroY = py(0).toFixed(1);

  return (
    `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">` +
    `<line x1="0" y1="${zeroY}" x2="${w}" y2="${zeroY}" stroke="rgba(255,255,255,0.14)" stroke-width="1" stroke-dasharray="2,3"/>` +
    `<polyline fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" points="${pts}"/>` +
    `</svg>`
  );
}
