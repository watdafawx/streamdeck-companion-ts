/**
 * Animations helper presets
 *
 * ## Overview
 * Small, focused preset functions that wrap the low-level `Animator` API.
 * Use these when you want quick effects (pulse, breath, rainbowSweep) without
 * building an animator yourself.
 *
 * ## Example
 * ```ts
 * import { Animator } from './animator';
 * import { pulse } from './animations';
 * const id = pulse(animator, { page:1,row:0,column:0 }, { bgcolor:'#000' }, { duration:800 });
 * ```
 */
import { Animator } from './animator';
import type { ButtonPosition, ButtonStyle } from '../core/types.js';
import { StreamDeckClient } from '../core/streamdeck-client.js';

/**
 * Convenience animation presets that wrap Animator.
 * These are thin helpers that create animations and return an id you can stop.
 */

export function pulse(
  animator: Animator,
  position: ButtonPosition,
  originalStyle: ButtonStyle,
  opts: { duration?: number; loop?: boolean; flashColor?: string; intervals?: number } = {}
) {
  return animator.createFlash(position, originalStyle, {
    duration: opts.duration ?? 1000,
    loop: opts.loop ?? true,
    flashColor: opts.flashColor ?? '#FFFFFF',
    intervals: opts.intervals ?? 2
  });
}

export function breath(
  animator: Animator,
  position: ButtonPosition,
  originalStyle: ButtonStyle,
  opts: { duration?: number; loop?: boolean; toColor?: string } = {}
) {
  // gentle fade to a lighter version of the original or toColor
  const from = originalStyle.bgcolor ?? '#000000';
  const to = opts.toColor ?? '#FFFFFF';
  return animator.createFade(position, originalStyle, {
    duration: opts.duration ?? 2000,
    loop: opts.loop ?? true,
    fromColor: from,
    toColor: to
  });
}

export function rainbowSweep(
  animator: Animator,
  position: ButtonPosition,
  originalStyle: ButtonStyle,
  opts: { duration?: number; loop?: boolean; saturation?: number; lightness?: number } = {}
) {
  return animator.createRainbow(position, originalStyle, {
    duration: opts.duration ?? 3000,
    loop: opts.loop ?? true,
    saturation: opts.saturation ?? 1,
    lightness: opts.lightness ?? 0.5
  });
}

// Convenience: start a set of presets across a grid
export async function partyMode(client: StreamDeckClient, animator: Animator, positions: ButtonPosition[]) {
  // grab a default style for each position and start staggered rainbows
  let i = 0;
  for (const pos of positions) {
    const base: ButtonStyle = { bgcolor: '#000000', color: '#FFFFFF', size: 12 };
    rainbowSweep(animator, pos, base, { duration: 2000 + (i % 6) * 300, loop: true });
    i++;
    // stagger starts slightly
    await new Promise(r => setTimeout(r, 80));
  }
}
