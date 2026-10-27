import { useEffect, useRef, useState } from 'react';
import { STORAGE_KEYS } from '../lib/constants';
import {
  ChevronDown,
  CloudRain,
  Coffee,
  Radio,
  Volume2,
  VolumeX,
  Waves,
  Wind,
} from 'lucide-react';

type SoundKey = 'rain' | 'cafe' | 'whiteNoise' | 'waves' | 'wind';

interface SoundDef {
  key: SoundKey;
  label: string;
  icon: typeof CloudRain;
}

const SOUNDS: SoundDef[] = [
  { key: 'rain', label: 'Yağmur', icon: CloudRain },
  { key: 'cafe', label: 'Kafe', icon: Coffee },
  { key: 'whiteNoise', label: 'Beyaz Gürültü', icon: Radio },
  { key: 'waves', label: 'Dalga', icon: Waves },
  { key: 'wind', label: 'Rüzgar', icon: Wind },
];

function readVolumes(): Record<SoundKey, number> {
  const defaults: Record<SoundKey, number> = {
    rain: 0,
    cafe: 0,
    whiteNoise: 0,
    waves: 0,
    wind: 0,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.mixerVolumes);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Record<SoundKey, number>>;
      return { ...defaults, ...p };
    }
  } catch {
    /* ignore */
  }
  return defaults;
}

export default function AmbientSounds() {
  const [volumes, setVolumes] = useState<Record<SoundKey, number>>(() => readVolumes());
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<Partial<Record<SoundKey, { gain: GainNode; stop: () => void }>>>({});

  // Persist volumes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.mixerVolumes, JSON.stringify(volumes));
  }, [volumes]);

  // Ensure AudioContext resumes on visibility regain (mobile browsers
  // suspend background audio). The resume is safe to call from an event
  // because the original activation happened inside a user gesture.
  useEffect(() => {
    function onVisible() {
      const ctx = ctxRef.current;
      if (ctx && ctx.state === 'suspended') void ctx.resume();
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onVisible();
    });
    window.addEventListener('focus', onVisible);
  }, []);

  // Lazy-init AudioContext. Must be called synchronously inside a user
  // gesture (pointerdown/touchstart) on mobile — autoplay policies reject
  // resume() triggered from useEffect alone.
  function ensureContext(): AudioContext {
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new Ctor();
    }
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume();
    return ctxRef.current;
  }

  // Sync gain nodes whenever volumes change
  useEffect(() => {
    (Object.keys(volumes) as SoundKey[]).forEach((key) => {
      const v = volumes[key];
      let entry = nodesRef.current[key];
      if (v > 0 && !entry) {
        const ctx = ensureContext();
        const { gain, stop } = buildSound(ctx, key);
        gain.gain.value = 0;
        entry = { gain, stop };
        nodesRef.current[key] = entry;
        // gentle ramp
        gain.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.4);
      } else if (entry) {
        const ctx = ctxRef.current!;
        if (v === 0) {
          entry.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
        } else {
          entry.gain.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.15);
        }
      }
    });
  }, [volumes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(nodesRef.current).forEach((e) => e?.stop());
      nodesRef.current = {};
      ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  const anyActive = (Object.values(volumes) as number[]).some((v) => v > 0);
  const [open, setOpen] = useState(false);

  function muteAll() {
    setVolumes({ rain: 0, cafe: 0, whiteNoise: 0, waves: 0, wind: 0 });
  }

  const activeCount = (Object.values(volumes) as number[]).filter((v) => v > 0).length;

  return (
    <div className="rounded-3xl bg-ink-900 border border-ink-800 p-4 sm:p-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between mb-0 sm:mb-5 sm:pointer-events-none"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white tracking-wide">Ortam Sesleri</h3>
          {anyActive && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-teal-500/15 text-teal-400 border border-teal-500/30">
              {activeCount} aktif
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs text-slate-400 hidden sm:inline"
            onClick={(e) => {
              e.stopPropagation();
              muteAll();
            }}
          >
            {anyActive ? (
              <VolumeX className="w-3.5 h-3.5 inline" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 inline" />
            )}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-500 sm:hidden transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      <div className={`${open ? 'block' : 'hidden'} sm:block space-y-3.5 mt-4 sm:mt-0`}>
        {SOUNDS.map((s) => {
          const v = volumes[s.key];
          const active = v > 0;
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  active
                    ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                    : 'bg-ink-850 text-slate-500 border border-ink-700'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-200">{s.label}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {active ? `${Math.round(v * 100)}%` : '—'}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={v}
                  onPointerDown={() => ensureContext()}
                  onChange={(e) =>
                    setVolumes((prev) => ({ ...prev, [s.key]: Number(e.target.value) }))
                  }
                  className="mixer-slider"
                  aria-label={`${s.label} ses seviyesi`}
                />
              </div>
            </div>
          );
        })}
        {anyActive && (
          <button
            onClick={muteAll}
            className="sm:hidden w-full text-xs text-slate-400 hover:text-white py-2 rounded-lg bg-ink-850 border border-ink-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <VolumeX className="w-3.5 h-3.5" />
            Tümünü Sessize Al
          </button>
        )}
      </div>
    </div>
  );
}

// --- Web Audio sound generators ---------------------------------------------

function noiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function loopBuffer(ctx: AudioContext, buffer: AudioBuffer): { src: AudioBufferSourceNode; stop: () => void } {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.start();
  return { src, stop: () => src.stop() };
}

function buildSound(
  ctx: AudioContext,
  key: SoundKey,
): { gain: GainNode; stop: () => void } {
  const gain = ctx.createGain();
  gain.gain.value = 0;
  const stops: Array<() => void> = [];
  const stop = () => stops.forEach((fn) => fn());

  if (key === 'whiteNoise') {
    const buf = noiseBuffer(ctx, 2);
    const { src, stop: s } = loopBuffer(ctx, buf);
    src.connect(gain);
    stops.push(s);
  } else if (key === 'rain') {
    // Pink-ish noise through bandpass + a gentle high shimmer
    const buf = noiseBuffer(ctx, 3);
    const { src, stop: s } = loopBuffer(ctx, buf);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1200;
    bp.Q.value = 0.6;
    src.connect(bp).connect(gain);
    stops.push(s);

    const hpBuf = noiseBuffer(ctx, 2);
    const hp = loopBuffer(ctx, hpBuf);
    const hpFilter = ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.value = 4000;
    hp.src.connect(hpFilter).connect(gain);
    stops.push(hp.stop);
  } else if (key === 'wind') {
    const buf = noiseBuffer(ctx, 4);
    const { src, stop: s } = loopBuffer(ctx, buf);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    lp.Q.value = 0.7;
    // slow LFO to modulate cutoff for "gusts"
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain).connect(lp.frequency);
    lfo.start();
    src.connect(lp).connect(gain);
    stops.push(s, () => lfo.stop());
  } else if (key === 'waves') {
    // filtered noise with slow amplitude LFO for wave swells
    const buf = noiseBuffer(ctx, 4);
    const { src, stop: s } = loopBuffer(ctx, buf);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 800;
    const waveGain = ctx.createGain();
    waveGain.gain.value = 0.6;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.5;
    lfo.connect(lfoGain).connect(waveGain.gain);
    lfo.start();
    src.connect(lp).connect(waveGain).connect(gain);
    stops.push(s, () => lfo.stop());
  } else if (key === 'cafe') {
    // low rumble + mid clatter bandpass + sparse "cup clink" pings
    const lowBuf = noiseBuffer(ctx, 4);
    const low = loopBuffer(ctx, lowBuf);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 220;
    const lowGain = ctx.createGain();
    lowGain.gain.value = 0.5;
    low.src.connect(lp).connect(lowGain).connect(gain);
    stops.push(low.stop);

    const midBuf = noiseBuffer(ctx, 3);
    const mid = loopBuffer(ctx, midBuf);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900;
    bp.Q.value = 0.5;
    const midGain = ctx.createGain();
    midGain.gain.value = 0.35;
    mid.src.connect(bp).connect(midGain).connect(gain);
    stops.push(mid.stop);

    // periodic soft "clink"
    const clinkInterval = setInterval(() => {
      if (ctx.state === 'closed') return;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = 1800 + Math.random() * 800;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, ctx.currentTime);
      env.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.005);
      env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.connect(env).connect(gain);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }, 3500 + Math.random() * 3000);
    stops.push(() => clearInterval(clinkInterval));
  }

  gain.connect(ctx.destination);
  return { gain, stop };
}
