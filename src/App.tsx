import { useEffect, useMemo, useRef, useState } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import {
  buildIndex,
  toneColor,
  type CountryStats,
  type Dataset,
} from './data';
import { CountryModal } from './components/CountryModal';
import { Leaderboard } from './components/Leaderboard';
import { sparklineSvg } from './lib/sparkline';
import { buildRankings } from './lib/rankings';
import { escapeHtml, formatRelativeTimestamp } from './lib/format';
import { bboxCentroid, isoOf, iso2Of, type Feature } from './lib/feature';

const COUNTRIES_GEOJSON =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';

const TONE_URL = import.meta.env.VITE_TONE_URL ?? '/tone.json';

export function App() {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [stats, setStats] = useState<Map<string, CountryStats>>(new Map());
  const [generatedAt, setGeneratedAt] = useState<string>('');
  const [size, setSize] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });
  const [selected, setSelected] = useState<{
    feature: Feature;
    stats: CountryStats;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(COUNTRIES_GEOJSON)
      .then((r) => r.json())
      .then((geo) => {
        if (!cancelled) setFeatures(geo.features);
      });
    fetch(TONE_URL)
      .then((r) => r.json())
      .then((d: Dataset) => {
        if (cancelled) return;
        setStats(buildIndex(d));
        setGeneratedAt(d.generatedAt);
      });
    const onResize = () =>
      setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraInitialized = useRef(false);
  const wasModalOpenRef = useRef(false);

  // Pause auto-rotate now; optionally schedule a resume after `resumeAfterMs`.
  // Pass null to pause indefinitely.
  const pauseAutoRotate = (resumeAfterMs: number | null = 10_000) => {
    const controls = globeRef.current?.controls();
    if (!controls) return;
    controls.autoRotate = false;
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    if (resumeAfterMs != null) {
      resumeTimerRef.current = setTimeout(() => {
        const c = globeRef.current?.controls();
        if (c) c.autoRotate = true;
      }, resumeAfterMs);
    }
  };

  // Initial camera + auto-rotate setup, plus interaction listener.
  // Camera position is only set once, so opening/closing the modal doesn't
  // snap the globe back to its starting view.
  useEffect(() => {
    if (!globeRef.current || !features.length) return;
    const controls = globeRef.current.controls();
    controls.autoRotateSpeed = 0.22;
    if (!cameraInitialized.current) {
      cameraInitialized.current = true;
      controls.autoRotate = true;
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.4 });
    }
    const onInteractionStart = () => pauseAutoRotate(10_000);
    controls.addEventListener('start', onInteractionStart);
    return () => {
      controls.removeEventListener('start', onInteractionStart);
    };
  }, [features.length]);

  // Modal state drives auto-rotate: indefinite pause while open, 10s after close.
  useEffect(() => {
    if (selected) {
      wasModalOpenRef.current = true;
      pauseAutoRotate(null);
    } else if (wasModalOpenRef.current) {
      wasModalOpenRef.current = false;
      pauseAutoRotate(10_000);
    }
  }, [selected]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const rankings = useMemo(() => buildRankings(stats), [stats]);

  const rings = useMemo(() => {
    const out: { lat: number; lng: number; iso: string; z: number }[] = [];
    for (const f of features) {
      const iso = isoOf(f);
      const s = stats.get(iso);
      if (!s) continue;
      if (Math.abs(s.zScore) < 1.5) continue;
      const [lat, lng] = bboxCentroid(f);
      out.push({ lat, lng, iso, z: s.zScore });
    }
    return out;
  }, [features, stats]);

  const coverage = useMemo(() => {
    let matched = 0;
    for (const f of features) if (stats.get(isoOf(f))) matched++;
    return { matched, total: features.length };
  }, [features, stats]);

  const polygonLabel = (d: object) => {
    const f = d as Feature;
    const name = f.properties.ADMIN ?? f.properties.NAME ?? 'Unknown';
    const iso = isoOf(f);
    const s = stats.get(iso);
    if (!s) {
      return `<div class="tooltip"><div class="tt-name">${escapeHtml(name)}</div><div class="tt-empty">no GDELT data</div></div>`;
    }
    const r = rankings.get(iso);
    const sign = s.change7d > 0 ? '+' : '';
    const changeClass =
      s.change7d > 0.05
        ? 'tt-pos'
        : s.change7d < -0.05
          ? 'tt-neg'
          : 'tt-flat';
    const rankLine = r
      ? `<div class="tt-row"><span>#${r.rank} most ${r.side}</span><span class="tt-mute tabular">/ ${r.total}</span></div>`
      : '';
    const swatch = `<span class="tt-swatch" style="background:${toneColor(s.latest, 1)}"></span>`;
    return (
      `<div class="tooltip">` +
      `<div class="tt-name">${swatch}${escapeHtml(name)}</div>` +
      `<div class="tt-tone tabular" style="color:${toneColor(s.latest, 1)}">${s.latest.toFixed(2)}</div>` +
      rankLine +
      `<div class="tt-row tabular"><span>7 day change</span><b class="${changeClass}">${sign}${s.change7d.toFixed(2)}</b></div>` +
      `<div class="tt-spark" aria-label="7-day tone trend">${sparklineSvg(s.smoothedTones, { w: 200, h: 30 })}</div>` +
      `<div class="tt-row tabular"><span>articles / hr</span><b>${s.articleCount}</b></div>` +
      `<div class="tt-hint">click for stories</div>` +
      `</div>`
    );
  };

  return (
    <>
      <header className="hud" aria-label="App description and freshness">
        <h1>Emotional World</h1>
        <p className="hud-sub">
          Hourly media tone, last 7 days, by country.
        </p>
        <p className="meta tabular">
          {generatedAt
            ? `updated ${formatRelativeTimestamp(generatedAt)} · ${coverage.matched}/${coverage.total} countries`
            : 'loading…'}
        </p>
      </header>

      <div className="legend" aria-label="Legend">
        <div className="ramp" aria-hidden="true" />
        <div className="ticks tabular">
          <span>−10</span>
          <span>0</span>
          <span>+10</span>
        </div>
        <div className="anomaly">pulsing rings = anomaly (|z| &gt; 1.5)</div>
      </div>

      <Globe
        ref={globeRef}
        width={size.w}
        height={size.h}
        backgroundColor="#000"
        showAtmosphere
        atmosphereColor="#5b8def"
        atmosphereAltitude={0.18}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        polygonsData={features}
        polygonAltitude={0.008}
        polygonCapColor={(d: object) => {
          const s = stats.get(isoOf(d as Feature));
          if (!s) return 'rgba(60, 60, 65, 0.32)';
          return toneColor(s.latest);
        }}
        polygonSideColor={() => 'rgba(0, 0, 0, 0.15)'}
        polygonStrokeColor={() => 'rgba(255, 255, 255, 0.12)'}
        polygonLabel={polygonLabel}
        polygonsTransitionDuration={300}
        onPolygonClick={(d: object) => {
          const f = d as Feature;
          const s = stats.get(isoOf(f));
          if (s) setSelected({ feature: f, stats: s });
        }}
        ringsData={rings}
        ringColor={(r: object) => {
          const z = (r as { z: number }).z;
          return z > 0
            ? (t: number) => `rgba(34, 197, 94, ${1 - t})`
            : (t: number) => `rgba(239, 68, 68, ${1 - t})`;
        }}
        ringMaxRadius={4}
        ringPropagationSpeed={2}
        ringRepeatPeriod={1500}
        ringAltitude={0.012}
      />

      <Leaderboard
        features={features}
        stats={stats}
        onFly={(iso) => {
          const f = features.find((x) => isoOf(x) === iso);
          if (!f || !globeRef.current) return;
          const [lat, lng] = bboxCentroid(f);
          pauseAutoRotate(10_000);
          globeRef.current.pointOfView({ lat, lng, altitude: 1.5 }, 1500);
        }}
      />

      {selected && (
        <CountryModal
          iso2={iso2Of(selected.feature)}
          name={
            selected.feature.properties.ADMIN ??
            selected.feature.properties.NAME ??
            'Unknown'
          }
          stats={selected.stats}
          rank={rankings.get(isoOf(selected.feature))}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
