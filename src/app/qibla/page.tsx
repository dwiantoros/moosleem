'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { LocationData } from '@/types';
import { calculateQiblaBearing } from '@/utils/prayerTimes';
import MoosleemLogoMark from '@/components/MoosleemLogoMark';
import PageHeaderActions from '@/components/PageHeaderActions';

type PermState = 'unsupported' | 'prompt' | 'granted' | 'denied';

type CompassEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
};

type IOSOrientation = { requestPermission?: () => Promise<'granted' | 'denied'> };

// Adaptive low-pass filter — faster response on large jumps, smoother for small ones
function lowPass(prev: number, next: number): number {
  let diff = next - prev;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  // Use higher alpha (faster) for big jumps, lower alpha (smoother) for tiny adjustments
  const absDiff = Math.abs(diff);
  const alpha = absDiff > 30 ? 0.35 : absDiff > 10 ? 0.18 : 0.08;
  return prev + alpha * diff;
}

export default function QiblaPage() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [permState, setPermState] = useState<PermState>('unsupported');
  const [sensorActive, setSensorActive] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  // Refs for rAF loop (avoid stale closures + direct DOM for perf)
  const rawHeadingRef = useRef<number | null>(null);
  const smoothedHeadingRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const needleRef = useRef<HTMLDivElement>(null);
  const headingDisplayRef = useRef<HTMLSpanElement>(null);
  const qiblaBearingRef = useRef<number | null>(null);
  const bearingDisplayRef = useRef<HTMLSpanElement>(null);
  const sensorActiveRef = useRef(false);

  const startLoop = useCallback(() => {
    const tick = () => {
      const raw = rawHeadingRef.current;
      if (raw !== null) {
        const prev = smoothedHeadingRef.current ?? raw;
        const smoothed = lowPass(prev, raw);
        smoothedHeadingRef.current = smoothed;
        const qibla = qiblaBearingRef.current;
        if (qibla !== null && needleRef.current) {
          const angle = qibla - smoothed;
          needleRef.current.style.transform = `rotate(${angle}deg)`;
        }
        if (headingDisplayRef.current) {
          headingDisplayRef.current.textContent = `${Math.round(smoothed)}°`;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const attachOrientation = useCallback(() => {
    let hasAbsolute = false; // once absolute events arrive, ignore relative ones
    const accuracyTimerRef = { last: 0 }; // throttle accuracy React state update

    const handler = (e: Event) => {
      const ev = e as CompassEvent;
      const isAbsoluteEvent = e.type === 'deviceorientationabsolute';

      // Ignore relative events once we've received an absolute one
      if (!isAbsoluteEvent && hasAbsolute) return;
      if (isAbsoluteEvent) hasAbsolute = true;

      let hdg: number | null = null;

      if (typeof ev.webkitCompassHeading === 'number' && !isNaN(ev.webkitCompassHeading)) {
        // iOS — webkitCompassHeading is already magnetic north heading
        hdg = ev.webkitCompassHeading;
        // Throttle accuracy updates to every 2s to avoid excessive re-renders
        const now = Date.now();
        if (typeof ev.webkitCompassAccuracy === 'number' && now - accuracyTimerRef.last > 2000) {
          accuracyTimerRef.last = now;
          setAccuracy(ev.webkitCompassAccuracy);
        }
      } else if (isAbsoluteEvent && typeof ev.alpha === 'number' && ev.alpha !== null) {
        // Android absolute orientation — alpha is CCW from true north relative to device
        hdg = (360 - ev.alpha + 360) % 360;
      } else if (typeof ev.alpha === 'number' && ev.alpha !== null) {
        // Relative fallback
        hdg = (360 - ev.alpha + 360) % 360;
      }

      if (hdg !== null) {
        rawHeadingRef.current = hdg;
        if (!sensorActiveRef.current) { sensorActiveRef.current = true; setSensorActive(true); }
      }
    };

    window.addEventListener('deviceorientationabsolute', handler, true);
    window.addEventListener('deviceorientation', handler, true);
    return () => {
      window.removeEventListener('deviceorientationabsolute', handler, true);
      window.removeEventListener('deviceorientation', handler, true);
    };
  }, []);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => setLocation({ latitude: coords.latitude, longitude: coords.longitude, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      () => setLocation({ latitude: -6.2088, longitude: 106.8456, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
    );

    if (typeof DeviceOrientationEvent === 'undefined') { setPermState('unsupported'); return; }
    const ios = DeviceOrientationEvent as IOSOrientation;
    if (typeof ios.requestPermission === 'function') { setPermState('prompt'); return; }
    setPermState('granted');
  }, []);

  useEffect(() => {
    if (permState !== 'granted') return;
    const stop1 = attachOrientation();
    const stop2 = startLoop();
    return () => { stop1(); stop2(); };
  }, [permState, attachOrientation, startLoop]);

  useEffect(() => {
    if (!location) return;
    const b = calculateQiblaBearing(location.latitude, location.longitude);
    qiblaBearingRef.current = b;
    if (bearingDisplayRef.current) bearingDisplayRef.current.textContent = `${b.toFixed(1)}°`;
  }, [location]);

  const requestPermission = async () => {
    const ios = DeviceOrientationEvent as IOSOrientation;
    if (typeof ios.requestPermission !== 'function') { setPermState('granted'); return; }
    try {
      const r = await ios.requestPermission();
      setPermState(r === 'granted' ? 'granted' : 'denied');
    } catch { setPermState('denied'); }
  };

  const qiblaBearing = location ? calculateQiblaBearing(location.latitude, location.longitude) : null;
  const accuracyLabel = accuracy === null ? null
    : accuracy <= 15 ? { label: 'Akurasi Tinggi', dot: '#22c55e' }
    : accuracy <= 30 ? { label: 'Akurasi Sedang', dot: '#f59e0b' }
    : { label: 'Akurasi Rendah', dot: '#ef4444' };

  return (
    <div className="relative min-h-screen pb-32">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]" />
      <main className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
          <Link href="/" className="glass-subtle flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/60 dark:text-slate-300">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </Link>
          <div>
            <MoosleemLogoMark className="mb-1" />
            <h1 className="text-xl font-semibold text-slate-900">Arah Qibla</h1>
          </div>
          </div>
          <PageHeaderActions />
        </div>

        {permState === 'prompt' && (
          <div className="glass-panel mb-5 rounded-[1.5rem] p-5">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 text-lg">🧭</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Aktifkan Sensor Kompas</p>
                <p className="mt-0.5 text-xs text-slate-500">Izinkan orientasi perangkat agar kompas bergerak realtime mengikuti arah fisik kamu.</p>
              </div>
            </div>
            <button onClick={requestPermission} className="mt-4 w-full rounded-2xl bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700">
              Izinkan Sensor
            </button>
          </div>
        )}
        {permState === 'denied' && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
            ⚠️ Izin sensor ditolak. Aktifkan <strong>Motion & Orientation</strong> di pengaturan browser.
          </div>
        )}
        {permState === 'unsupported' && (
          <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
            ℹ️ Perangkat ini tidak memiliki sensor orientasi. Bearing qibla tersedia dari lokasi GPS.
          </div>
        )}

        <div className="glass-panel rounded-[1.75rem] p-6 sm:p-8">
          <div className="flex flex-col items-center">

            {/* Compass ring */}
            <div className="relative mx-auto flex w-full max-w-[288px] aspect-square items-center justify-center sm:max-w-[320px]">
              <div className="absolute inset-0 rounded-full border-2 border-slate-200/60" />
              <div className="absolute inset-3 rounded-full border border-slate-200/40" />
              <div className="absolute inset-8 rounded-full border border-slate-200/30" />

              {/* Degree ticks */}
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className="absolute inset-0 flex items-start justify-center" style={{ transform: `rotate(${i * 10}deg)` }}>
                  <div className={`mt-2 rounded-full ${i % 9 === 0 ? 'h-3 w-0.5 bg-slate-400' : 'h-1.5 w-px bg-slate-300'}`} />
                </div>
              ))}

              {/* Cardinals */}
              <span className="absolute top-3 text-[11px] font-bold text-red-500">N</span>
              <span className="absolute bottom-3 text-[11px] font-bold tracking-widest text-slate-400">S</span>
              <span className="absolute left-3 text-[11px] font-bold tracking-widest text-slate-400">W</span>
              <span className="absolute right-3 text-[11px] font-bold tracking-widest text-slate-400">E</span>

              {/* Kaaba icon center */}
              <div className="absolute z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 shadow-sm backdrop-blur-sm text-xl">🕋</div>

              {/* Needle — updated via rAF, no React re-renders */}
              <div
                ref={needleRef}
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                style={{ transform: `rotate(${qiblaBearing ?? 0}deg)`, willChange: 'transform', transition: 'transform 80ms linear' }}
              >
                <div className="absolute top-5 flex flex-col items-center gap-0">
                  {/* Arrowhead */}
                  <div className="h-0 w-0" style={{ borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '14px solid #0d9488' }} />
                  {/* Shaft */}
                  <div className="h-20 w-1.5 rounded-b-full bg-gradient-to-b from-teal-500 to-teal-600/50" />
                </div>
                <div className="absolute bottom-5">
                  <div className="h-10 w-1 rounded-full bg-slate-300/50" />
                </div>
              </div>

              {/* Live sensor pulse dot */}
              {sensorActive && (
                <div className="absolute right-5 top-5 flex h-3 w-3 items-center justify-center">
                  <div className="absolute h-3 w-3 animate-ping rounded-full bg-teal-400 opacity-60" />
                  <div className="h-2 w-2 rounded-full bg-teal-500" />
                </div>
              )}
            </div>

            {/* Stats cards */}
            <div className="mt-6 grid w-full grid-cols-2 gap-3">
              <div className="glass-subtle rounded-2xl p-4 text-center">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Bearing Qibla</p>
                <p className="mt-1 text-2xl font-semibold text-teal-700">
                  <span ref={bearingDisplayRef}>{qiblaBearing !== null ? `${qiblaBearing.toFixed(1)}°` : '--'}</span>
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">dari utara</p>
              </div>
              <div className="glass-subtle rounded-2xl p-4 text-center">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Heading Kamu</p>
                <p className="mt-1 text-2xl font-semibold text-slate-800">
                  <span ref={headingDisplayRef}>{sensorActive ? '…' : '--'}</span>
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">orientasi perangkat</p>
              </div>
            </div>

            {/* Status row */}
            <div className="mt-4 flex w-full items-center justify-between">
              <span
                className="rounded-full px-3 py-1.5 text-xs font-medium"
                style={sensorActive
                  ? { backgroundColor: 'rgba(13,148,136,0.12)', color: '#0d9488' }
                  : { backgroundColor: 'rgba(148,163,184,0.15)', color: '#94a3b8' }}
              >
                {sensorActive ? '● Kompas aktif' : '○ Menunggu sensor'}
              </span>
              {accuracyLabel && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accuracyLabel.dot }} />
                  {accuracyLabel.label}
                </span>
              )}
            </div>

            {sensorActive && (
              <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
                Putar perangkat hingga panah 🕋 menunjuk ke depan kamu.<br/>
                <span className="text-slate-400">Kalau goyang, gerakkan perangkat membentuk angka 8 untuk kalibrasi.</span>
              </p>
            )}
          </div>
        </div>

        {location && (
          <div className="mt-4 glass-subtle rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-slate-500">
            <span>📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
            <span className="text-teal-600 font-medium">{location.timezone}</span>
          </div>
        )}
      </main>
    </div>
  );
}
