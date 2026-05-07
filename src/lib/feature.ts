export type Feature = {
  properties: {
    ADMIN?: string;
    NAME?: string;
    ISO_A3?: string;
    ISO_A3_EH?: string;
    ISO_A2?: string;
    ISO_A2_EH?: string;
    [k: string]: unknown;
  };
  geometry: { type: string; coordinates: unknown };
};

export function isoOf(f: Feature): string {
  const eh = f.properties.ISO_A3_EH;
  const a3 = f.properties.ISO_A3;
  if (eh && eh !== '-99') return eh;
  if (a3 && a3 !== '-99') return a3;
  return '';
}

export function iso2Of(f: Feature): string {
  const eh = f.properties.ISO_A2_EH;
  const a2 = f.properties.ISO_A2;
  if (eh && eh !== '-99') return eh;
  if (a2 && a2 !== '-99') return a2;
  return '';
}

export function nameOf(f: Feature): string {
  return f.properties.ADMIN ?? f.properties.NAME ?? 'Unknown';
}

export function bboxCentroid(f: Feature): [number, number] {
  let minX = 180,
    minY = 90,
    maxX = -180,
    maxY = -90;
  const visit = (arr: unknown) => {
    if (Array.isArray(arr)) {
      if (typeof arr[0] === 'number') {
        const [x, y] = arr as [number, number];
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      } else {
        for (const a of arr) visit(a);
      }
    }
  };
  visit(f.geometry.coordinates);
  return [(minY + maxY) / 2, (minX + maxX) / 2];
}
