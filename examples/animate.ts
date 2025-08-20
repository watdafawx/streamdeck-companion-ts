import { createLocalStreamDeckClient, createAnimator } from '../streamdeck/index';
import { StreamDeckClient } from '../streamdeck/client';
import { pulse, breath, rainbowSweep, partyMode } from '../streamdeck/animations';
import { generateButtonGrid } from '../streamdeck/utils';

async function main() {
  const client = createLocalStreamDeckClient(8000);
  const animator = createAnimator(client, 20);

  // Example positions (page 1, rows 0..1, cols 0..4) for an original 3x5 deck
  const positions = generateButtonGrid(1, 3, 5);

  // Start a pulse on button 0
  // Using helper API
  pulse(animator, positions[0], { bgcolor: '#001122', color: '#FFFFFF', size: 12 }, { duration: 1200, loop: true, flashColor: '#55AAFF', intervals: 2 });

  // Start a breath on button 1
  breath(animator, positions[1], { bgcolor: '#220011', color: '#FFFFFF', size: 12 }, { duration: 2000, loop: true, toColor: '#FF88CC' });

  // Start a rainbow on button 2
  rainbowSweep(animator, positions[2], { bgcolor: '#000000', color: '#FFFFFF', size: 12 }, { duration: 2500, loop: true });

  // Party mode across all positions
  await partyMode(client, animator, positions.slice(5, 15));

  console.log('Animations started — press Ctrl+C to stop.');
}

main().catch(err => console.error(err));

// --- Fluent animate examples ---
// Demonstrates using the fluent chain to start/stop animations and conditional start
export async function fluentExamples() {
  const client = createLocalStreamDeckClient(8000);
  const pos = generateButtonGrid(1, 3, 5)[0];

  // Start a looped fade from black to red using the chain; capture stop function
  const stop = await client.button(pos).animate({ bgcolor: '#000000' }, 1200, { type: 'fade', loop: true, fromColor: '#000000', toColor: '#FF0000' }) as (() => void) | undefined;

  // Stop after 10s
  setTimeout(() => {
    stop?.();
    console.log('Stopped fluent fade');
  }, 10000);

  // Conditional start: only animate while some async check is true
  const stopConditional = await client.button(pos).whenAsync(async () => {
    // pretend check for round 9/10
    const round = await Promise.resolve(9);
    return round === 9 || round === 10;
  }).animate({ bgcolor: '#000000' }, 1000, { type: 'fade', loop: true, fromColor: '#000000', toColor: '#FF0000' }) as (() => void) | undefined;

  // Example stop after 20s
  setTimeout(() => stopConditional?.(), 20000);
}
