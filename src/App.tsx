import { useEffect, useMemo, useRef, useState } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import {
  buildIndex,
  toneColor,
  type CountryStats,
  type Dataset,
} from './data';

const COUNTRIES_GEOJSON =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';

const TONE_URL = import.meta.env.VITE_TONE_URL ?? '/tone.json';

type Feature = {
  properties: {
    ADMIN?: string;
    NAME?: string;
    ISO_A3?: string;
    ISO_A3_EH?: string;
    [k: string]: unknown;
  };
  geometry: { type: string; coordinates: unknown };
};

function isoOf(f: Feature): string {
  const eh = f.properties.ISO_A3_EH;
  const a3 = f.properties.ISO_A3;
  if (eh && eh !== '-99') return eh;
  if (a3 && a3 !== '-99') return a3;
  return '';
}

function bboxCentroid(f: Feature): [number, number] {
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

export function App() {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [stats, setStats] = useState<Map<string, CountryStats>>(new Map());
  const [generatedAt, setGeneratedAt] = useState<string>('');
  const [size, setSize] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });

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

  useEffect(() => {
    if (globeRef.current && features.length) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.25;
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.4 });
    }
  }, [features.length]);

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

  return (
    <>
      <div className="hud">
        <h1>Emotional World</h1>
        <div>Hourly media tone, last 7 days, by country.</div>
        <div className="meta">
          {generatedAt
            ? `${new Date(generatedAt).toLocaleString()} · ${coverage.matched}/${coverage.total} countries`
            : 'Loading…'}
        </div>
      </div>

      <div className="legend">
        <div className="ramp" />
        <div className="ticks">
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
          if (!s) return 'rgba(60, 60, 65, 0.35)';
          return toneColor(s.latest);
        }}
        polygonSideColor={() => 'rgba(0, 0, 0, 0.15)'}
        polygonStrokeColor={() => 'rgba(255, 255, 255, 0.12)'}
        polygonLabel={(d: object) => {
          const f = d as Feature;
          const name = f.properties.ADMIN ?? f.properties.NAME ?? 'Unknown';
          const iso = isoOf(f);
          const s = stats.get(iso);
          if (!s) {
            return `<div class="tooltip"><div class="name">${name}</div>
              <div class="row">no GDELT data</div></div>`;
          }
          const sign = s.velocity > 0 ? '+' : '';
          return `<div class="tooltip">
            <div class="name">${name}</div>
            <div class="row"><span>tone</span><b>${s.latest.toFixed(2)}</b></div>
            <div class="row"><span>7d mean</span><b>${s.mean.toFixed(2)}</b></div>
            <div class="row"><span>z-score</span><b>${s.zScore.toFixed(2)}</b></div>
            <div class="row"><span>6h Δ</span><b>${sign}${s.velocity.toFixed(2)}</b></div>
            <div class="row"><span>articles/hr</span><b>${s.articleCount}</b></div>
          </div>`;
        }}
        polygonsTransitionDuration={300}
        ringsData={rings}
        ringColor={(r: object) => {
          const z = (r as { z: number }).z;
          return z > 0
            ? (t: number) => `rgba(34, 197, 94, ${1 - t})`
            : (t: number) => `rgba(214, 39, 40, ${1 - t})`;
        }}
        ringMaxRadius={4}
        ringPropagationSpeed={2}
        ringRepeatPeriod={1500}
        ringAltitude={0.012}
      />
    </>
  );
}
