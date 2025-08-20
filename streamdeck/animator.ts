import { StreamDeckClient } from './client';
import type { ButtonPosition, ButtonStyle } from './types';

// Small helper types
type AnimationType = 'flash' | 'fade' | 'rainbow';

export interface AnimationOptions {
  // common
  duration?: number; // ms
  loop?: boolean;
  fps?: number; // suggested fps for the animator (used if creating dedicated animator)

  // flash
  flashColor?: string;
  intervals?: number; // how many flashes in duration (for flash)

  // fade
  fromColor?: string;
  toColor?: string;

  // rainbow
  saturation?: number; // 0-1
  lightness?: number; // 0-1
}

interface InternalAnimation {
  id: string;
  type: AnimationType;
  position: ButtonPosition;
  options: Required<AnimationOptions>;
  startTime: number;
  originalStyle: ButtonStyle;
  lastSentBg?: string;
}

/**
 * Animator
 * - Runs a single timer at configurable FPS
 * - Interpolates colors for flash/fade/rainbow
 * - Coalesces updates per-frame and calls client.executeBatch once per frame
 * - Avoids sending updates if color hasn't meaningfully changed
 */
export class Animator {
  private client: StreamDeckClient;
  private fps: number;
  private tickInterval = 0; // ms
  private timer?: ReturnType<typeof setInterval>;
  private animations = new Map<string, InternalAnimation>();
  private idCounter = 1;

  constructor(client: StreamDeckClient, fps = 15) {
    this.client = client;
    this.fps = Math.max(1, Math.min(60, Math.round(fps)));
    this.tickInterval = Math.round(1000 / this.fps);
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), this.tickInterval);
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = undefined;
  }

  clear() {
    this.animations.clear();
  }

  createFlash(position: ButtonPosition, originalStyle: ButtonStyle, options: AnimationOptions = {}) {
    const opts: Required<AnimationOptions> = {
      duration: options.duration ?? 1000,
      loop: options.loop ?? false,
      fps: options.fps ?? this.fps,
      flashColor: options.flashColor ?? '#FFFFFF',
      intervals: options.intervals ?? 4,
      fromColor: options.fromColor ?? '#000000',
      toColor: options.toColor ?? '#000000',
      saturation: options.saturation ?? 1,
      lightness: options.lightness ?? 0.5
    };

    const id = `anim-${this.idCounter++}`;
    this.animations.set(id, {
      id,
      type: 'flash',
      position,
      options: opts,
      startTime: Date.now(),
      originalStyle
    });

    this.start();
    return id;
  }

  createFade(position: ButtonPosition, originalStyle: ButtonStyle, options: AnimationOptions = {}) {
    const opts: Required<AnimationOptions> = {
      duration: options.duration ?? 1000,
      loop: options.loop ?? false,
      fps: options.fps ?? this.fps,
      flashColor: options.flashColor ?? '#FFFFFF',
      intervals: options.intervals ?? 1,
      fromColor: options.fromColor ?? (originalStyle.bgcolor ?? '#000000'),
      toColor: options.toColor ?? '#000000',
      saturation: options.saturation ?? 1,
      lightness: options.lightness ?? 0.5
    };

    const id = `anim-${this.idCounter++}`;
    this.animations.set(id, {
      id,
      type: 'fade',
      position,
      options: opts,
      startTime: Date.now(),
      originalStyle
    });

    this.start();
    return id;
  }

  createRainbow(position: ButtonPosition, originalStyle: ButtonStyle, options: AnimationOptions = {}) {
    const opts: Required<AnimationOptions> = {
      duration: options.duration ?? 3000,
      loop: options.loop ?? true,
      fps: options.fps ?? this.fps,
      flashColor: options.flashColor ?? '#FFFFFF',
      intervals: options.intervals ?? 1,
      fromColor: options.fromColor ?? '#000000',
      toColor: options.toColor ?? '#000000',
      saturation: options.saturation ?? 1,
      lightness: options.lightness ?? 0.5
    };

    const id = `anim-${this.idCounter++}`;
    this.animations.set(id, {
      id,
      type: 'rainbow',
      position,
      options: opts,
      startTime: Date.now(),
      originalStyle
    });

    this.start();
    return id;
  }

  stopAnimation(id: string) {
    this.animations.delete(id);
    if (this.animations.size === 0) this.stop();
  }

  stopAll() {
    this.animations.clear();
    this.stop();
  }

  private tick() {
    if (this.animations.size === 0) {
      this.stop();
      return;
    }

    const now = Date.now();
    const ops: Array<{ action: 'style'; position: ButtonPosition; data: ButtonStyle }> = [];

    for (const anim of this.animations.values()) {
      const elapsed = now - anim.startTime;
      const { duration, loop } = anim.options;

      let progress = Math.min(1, elapsed / duration);
      if (loop) {
        // wrap progress to 0..1
        progress = ((elapsed % duration) / duration);
      }

      let nextBg = anim.originalStyle.bgcolor ?? '#000000';

      try {
        if (anim.type === 'flash') {
          // Smooth pulse using sine, frequency = intervals
          const repeats = Math.max(1, anim.options.intervals);
          const factor = 0.5 * (1 + Math.sin(progress * Math.PI * 2 * repeats));
          nextBg = mixColors(anim.originalStyle.bgcolor ?? '#000000', anim.options.flashColor, factor);
        } else if (anim.type === 'fade') {
          const factor = progress; // linear
          nextBg = mixColors(anim.options.fromColor, anim.options.toColor, factor);
        } else if (anim.type === 'rainbow') {
          const period = anim.options.duration;
          const t = ((elapsed % period) / period);
          const hue = Math.floor(t * 360);
          nextBg = hslToHex(hue, anim.options.saturation, anim.options.lightness);
        }
      } catch (e) {
        // fallback to original
        nextBg = anim.originalStyle.bgcolor ?? '#000000';
      }

      // Only update if different from last sent (coalescing)
      if (!anim.lastSentBg || !colorsEqual(anim.lastSentBg, nextBg)) {
        anim.lastSentBg = nextBg;
        const style: ButtonStyle = { ...anim.originalStyle, bgcolor: nextBg };
        ops.push({ action: 'style', position: anim.position, data: style });
      }

      // If not looping and finished, remove animation
      if (!loop && elapsed >= duration) {
        this.animations.delete(anim.id);
      }
    }

    if (ops.length > 0) {
      // use client's batch executor to run them in sequence (one outgoing tick)
      // This reduces churn compared to many independent callers.
      // Note: executeBatch will still call per-operation endpoints, but
      // we coalesce and rate-limit here to keep things reasonable.
      this.client.executeBatch(ops as any).catch(err => {
        // Don't let animation fail on network hiccups
        console.error('Animator batch error:', err);
      });
    }
  }
}

// ----------------------
// Color helpers
// ----------------------

function clamp(v: number, a = 0, b = 255) {
  return Math.max(a, Math.min(b, Math.round(v)));
}

function mixColors(hexA: string, hexB: string, t: number) {
  const a = StreamDeckClient.hexToRgb(hexA) ?? { r: 0, g: 0, b: 0 };
  const b = StreamDeckClient.hexToRgb(hexB) ?? { r: 0, g: 0, b: 0 };

  const r = clamp(a.r + (b.r - a.r) * t);
  const g = clamp(a.g + (b.g - a.g) * t);
  const bb = clamp(a.b + (b.b - a.b) * t);

  return StreamDeckClient.rgbToHex(r, g, bb);
}

function colorsEqual(a: string, b: string) {
  return (a || '').toUpperCase() === (b || '').toUpperCase();
}

// HSL (0-360, 0-1, 0-1) -> hex
function hslToHex(h: number, s: number, l: number) {
  // convert to RGB
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = (h / 60) % 6;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (hh >= 0 && hh < 1) [r1, g1, b1] = [c, x, 0];
  else if (hh >= 1 && hh < 2) [r1, g1, b1] = [x, c, 0];
  else if (hh >= 2 && hh < 3) [r1, g1, b1] = [0, c, x];
  else if (hh >= 3 && hh < 4) [r1, g1, b1] = [0, x, c];
  else if (hh >= 4 && hh < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];

  const m = l - c / 2;
  const r = clamp((r1 + m) * 255);
  const g = clamp((g1 + m) * 255);
  const b = clamp((b1 + m) * 255);
  return StreamDeckClient.rgbToHex(r, g, b);
}
