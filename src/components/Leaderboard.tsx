import { useMemo, useState } from 'react';
import { toneColor, type CountryStats } from '../data';
import { isoOf, iso2Of, nameOf, type Feature } from '../lib/feature';
import { isoToFlag } from '../lib/flags';

const ARTICLE_THRESHOLD = 100; // total articles in the 7-day window

type Entry = {
  iso: string;
  name: string;
  iso2: string;
  value: number;
};

type Props = {
  features: Feature[];
  stats: Map<string, CountryStats>;
  onFly: (iso: string) => void;
};

export function Leaderboard({ features, stats, onFly }: Props) {
  const [open, setOpen] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(min-width: 768px)').matches
      : true,
  );

  const lookup = useMemo(() => {
    const m = new Map<string, { name: string; iso2: string }>();
    for (const f of features) {
      const iso = isoOf(f);
      if (iso) m.set(iso, { name: nameOf(f), iso2: iso2Of(f) });
    }
    return m;
  }, [features]);

  const { movers, negative, positive } = useMemo(() => {
    const eligible = [...stats.values()].filter((s) => {
      let total = 0;
      for (const h of s.hours) total += h.n;
      return total >= ARTICLE_THRESHOLD && lookup.has(s.iso);
    });

    const withDelta24 = eligible
      .map((s) => {
        const t = s.smoothedTones;
        if (t.length < 25) return null;
        return { stats: s, delta: t[t.length - 1] - t[t.length - 25] };
      })
      .filter((x): x is { stats: CountryStats; delta: number } => x !== null);

    const movers = [...withDelta24]
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 3)
      .map((x) => entryFor(x.stats, x.delta, lookup));

    const negative = [...eligible]
      .sort((a, b) => a.latest - b.latest)
      .slice(0, 3)
      .map((s) => entryFor(s, s.latest, lookup));

    const positive = [...eligible]
      .sort((a, b) => b.latest - a.latest)
      .slice(0, 3)
      .map((s) => entryFor(s, s.latest, lookup));

    return { movers, negative, positive };
  }, [stats, lookup]);

  return (
    <aside
      className={`leaderboard${open ? ' is-open' : ''}`}
      aria-label="Leaderboards"
    >
      <button
        type="button"
        className="lb-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="lb-header-title">24hr Leaderboard</span>
        <span className="lb-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      <div className="lb-body-wrap">
        <div className="lb-body">
          <Section title="Biggest 24h moves">
            {movers.length === 0 ? (
              <Empty>not enough data yet</Empty>
            ) : (
              movers.map((e, i) => (
                <Row
                  key={e.iso}
                  rank={i + 1}
                  entry={e}
                  valueLabel={`${e.value > 0 ? '+' : ''}${e.value.toFixed(2)}`}
                  valueColor={
                    e.value > 0.05
                      ? '#22c55e'
                      : e.value < -0.05
                        ? '#ef4444'
                        : '#9ca3af'
                  }
                  onClick={() => onFly(e.iso)}
                />
              ))
            )}
          </Section>

          <Section title="Most negative">
            {negative.map((e, i) => (
              <Row
                key={e.iso}
                rank={i + 1}
                entry={e}
                valueLabel={e.value.toFixed(2)}
                valueColor={toneColor(e.value, 1)}
                onClick={() => onFly(e.iso)}
              />
            ))}
          </Section>

          <Section title="Most positive">
            {positive.map((e, i) => (
              <Row
                key={e.iso}
                rank={i + 1}
                entry={e}
                valueLabel={`+${e.value.toFixed(2)}`}
                valueColor={toneColor(e.value, 1)}
                onClick={() => onFly(e.iso)}
              />
            ))}
          </Section>
        </div>
      </div>
    </aside>
  );
}

function entryFor(
  s: CountryStats,
  value: number,
  lookup: Map<string, { name: string; iso2: string }>,
): Entry {
  const meta = lookup.get(s.iso);
  return {
    iso: s.iso,
    name: meta?.name ?? s.iso,
    iso2: meta?.iso2 ?? '',
    value,
  };
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="lb-section">
      <h3>{title}</h3>
      <ul className="lb-list">{children}</ul>
    </section>
  );
}

function Row({
  rank,
  entry,
  valueLabel,
  valueColor,
  onClick,
}: {
  rank: number;
  entry: Entry;
  valueLabel: string;
  valueColor: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        className="lb-row"
        onClick={onClick}
        aria-label={`${entry.name}, ${valueLabel}. Fly to country.`}
      >
        <span className="lb-rank tabular">{rank}</span>
        <span className="lb-flag" aria-hidden="true">
          {isoToFlag(entry.iso2)}
        </span>
        <span className="lb-name">{entry.name}</span>
        <span className="lb-value tabular" style={{ color: valueColor }}>
          {valueLabel}
        </span>
      </button>
    </li>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <li className="lb-empty">{children}</li>;
}
