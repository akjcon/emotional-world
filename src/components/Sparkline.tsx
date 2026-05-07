import { useId } from 'react';

type Props = {
  values: number[];
  width?: number;
  height?: number;
};

export function Sparkline({ values, width = 280, height = 80 }: Props) {
  const id = useId();
  if (values.length < 2) return null;

  let min = 0;
  let max = 0;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;

  const px = (i: number) => (i / (values.length - 1)) * width;
  const py = (v: number) => height - ((v - min) / range) * (height - 2) - 1;

  const points = values
    .map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`)
    .join(' ');
  const zeroY = py(0);
  const zeroPct = Math.max(0, Math.min(1, zeroY / height));
  const gradId = `tone-grad-${id.replace(/:/g, '')}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient
          id={gradId}
          x1={0}
          y1={0}
          x2={0}
          y2={height}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset={0} stopColor="#22c55e" />
          <stop offset={zeroPct} stopColor="#22c55e" />
          <stop offset={zeroPct} stopColor="#ef4444" />
          <stop offset={1} stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <line
        x1={0}
        y1={zeroY}
        x2={width}
        y2={zeroY}
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={1}
        strokeDasharray="2,3"
      />
      <polyline
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}
