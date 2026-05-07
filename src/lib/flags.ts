// Convert ISO 3166-1 alpha-2 → flag emoji via regional indicator symbols.
// Browsers on macOS/iOS/Android render as flags; Windows shows letter pairs.
export function isoToFlag(iso2: string | undefined | null): string {
  if (!iso2 || iso2.length !== 2) return '';
  const code = iso2.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '';
  return String.fromCodePoint(
    ...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}
