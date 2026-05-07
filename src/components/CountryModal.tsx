import { useEffect, useRef, useState } from 'react';
import { toneColor, type CountryStats } from '../data';
import { isoToFlag } from '../lib/flags';
import { type Ranking } from '../lib/rankings';
import {
  fetchStories,
  parseSeenDate,
  relativeTime,
  type Story,
} from '../lib/stories';
import { Sparkline } from './Sparkline';

type Props = {
  iso2?: string;
  name: string;
  stats: CountryStats;
  rank?: Ranking;
  onClose: () => void;
};

export function CountryModal({
  iso2,
  name,
  stats,
  rank,
  onClose,
}: Props) {
  const [stories, setStories] = useState<Story[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchStories(name, 8, ctrl.signal)
      .then(setStories)
      .catch((e: unknown) => {
        if ((e as { name?: string })?.name === 'AbortError') return;
        setError("Couldn't load stories.");
      });
    return () => ctrl.abort();
  }, [name]);

  useEffect(() => {
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const sign = stats.change7d > 0 ? '+' : '';
  const changeColor =
    stats.change7d > 0.05
      ? '#22c55e'
      : stats.change7d < -0.05
        ? '#ef4444'
        : '#9ca3af';

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="country-modal-title"
    >
      <div className="modal">
        <header className="modal-head">
          <div className="modal-title">
            <span className="flag" aria-hidden="true">
              {isoToFlag(iso2)}
            </span>
            <h2 id="country-modal-title">{name}</h2>
          </div>
          <button
            ref={closeBtnRef}
            className="modal-close"
            aria-label="Close country details"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>

        <section className="modal-stats" aria-label="Statistics">
          <div className="stat">
            <span className="stat-label">tone</span>
            <span
              className="stat-value tabular"
              style={{ color: toneColor(stats.latest, 1) }}
            >
              {stats.latest.toFixed(2)}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">7 day change</span>
            <span
              className="stat-value tabular"
              style={{ color: changeColor }}
            >
              {sign}
              {stats.change7d.toFixed(2)}
            </span>
          </div>
          {rank && (
            <div className="stat">
              <span className="stat-label">
                {rank.side === 'negative'
                  ? 'most negative'
                  : 'most positive'}
              </span>
              <span className="stat-value tabular">
                #{rank.rank} <span className="stat-of">/ {rank.total}</span>
              </span>
            </div>
          )}
          <div className="stat">
            <span className="stat-label">articles / hr</span>
            <span className="stat-value tabular">{stats.articleCount}</span>
          </div>
        </section>

        <section className="modal-spark" aria-label="7-day tone trend">
          <Sparkline values={stats.smoothedTones} width={520} height={96} />
          <div className="spark-axis tabular">
            <span>{new Date(stats.hours[0].t).toLocaleDateString()}</span>
            <span>now</span>
          </div>
        </section>

        <section className="modal-stories" aria-label="Recent stories">
          <h3>Recent stories from {name}</h3>
          {error && <p className="stories-empty">{error}</p>}
          {!stories && !error && (
            <ul className="story-list" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <li key={i} className="story story-skeleton">
                  <div className="story-img" />
                  <div className="story-body">
                    <div className="skeleton-line skeleton-line-title" />
                    <div className="skeleton-line skeleton-line-meta" />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {stories?.length === 0 && (
            <p className="stories-empty">No recent stories indexed for this region.</p>
          )}
          {stories && stories.length > 0 && (
            <ul className="story-list">
              {stories.map((s, i) => (
                <li
                  key={s.url}
                  className="story"
                  style={{ ['--i' as string]: i } as React.CSSProperties}
                >
                  {s.socialimage ? (
                    <img
                      src={s.socialimage}
                      alt=""
                      loading="lazy"
                      className="story-img"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                      }}
                    />
                  ) : (
                    <div className="story-img story-img-empty" aria-hidden="true" />
                  )}
                  <div className="story-body">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="story-title"
                    >
                      {s.title.trim() || s.domain}
                    </a>
                    <div className="story-meta tabular">
                      <span>{s.domain}</span>
                      <span aria-hidden="true">·</span>
                      <span>{relativeTime(parseSeenDate(s.seendate))}</span>
                      {s.language && s.language !== 'English' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="story-lang">{s.language}</span>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
