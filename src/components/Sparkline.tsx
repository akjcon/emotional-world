type Props = {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
};

export function Sparkline({
  values,
  width = 280,
  height = 80,
  color = '#f5f5f5',
}: Props) {
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
  const zeroY = py(0).toFixed(1);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <line
        x1={0}
        y1={zeroY}
        x2={width}
        y2={zeroY}
        stroke="rgba(255,255,255,0.14)"
        strokeWidth={1}
        strokeDasharray="2,3"
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}
