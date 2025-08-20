/**
 * Animation Performance Demo
 * 
 * This example demonstrates the difference between blocking and non-blocking
 * animation modes to show how HTTP request timing affects animation smoothness.
 */

import { StreamDeckClient } from '../streamdeck/client';

async function animationPerformanceDemo() {
  const position = StreamDeckClient.createPosition(0, 0, 0);

  console.log('=== Animation Performance Demo ===');

  // Test with blocking animations (waits for HTTP responses)
  console.log('Testing with BLOCKING animations (waits for HTTP responses)...');
  const blockingClient = new StreamDeckClient({ 
    baseUrl: 'http://localhost:8000',
    nonBlockingAnimations: false // Wait for HTTP responses
  });

  console.log('Starting blocking animation - may feel sluggish...');
  const blockingStart = Date.now();
  await blockingClient.button(position).animate({ bgcolor: '#FF0000' }, 1000, { type: 'flash', intervals: 5 });
  const blockingDuration = Date.now() - blockingStart;
  console.log(`Blocking animation completed in: ${blockingDuration}ms`);

  // Small delay between tests
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test with non-blocking animations (fire-and-forget HTTP requests)
  console.log('Testing with NON-BLOCKING animations (fire-and-forget requests)...');
  const nonBlockingClient = new StreamDeckClient({ 
    baseUrl: 'http://localhost:8000',
    nonBlockingAnimations: true // Default - fire-and-forget requests
  });

  console.log('Starting non-blocking animation - should feel smooth...');
  const nonBlockingStart = Date.now();
  await nonBlockingClient.button(position).animate({ bgcolor: '#00FF00' }, 1000, { type: 'flash', intervals: 5 });
  const nonBlockingDuration = Date.now() - nonBlockingStart;
  console.log(`Non-blocking animation completed in: ${nonBlockingDuration}ms`);

  console.log('\n=== Performance Comparison ===');
  console.log(`Blocking animation:     ${blockingDuration}ms`);
  console.log(`Non-blocking animation: ${nonBlockingDuration}ms`);
  console.log(`Performance improvement: ${Math.round(((blockingDuration - nonBlockingDuration) / blockingDuration) * 100)}%`);

  // Demo runtime switching
  console.log('\n=== Runtime Configuration Demo ===');
  const client = new StreamDeckClient({ baseUrl: 'http://localhost:8000' });
  
  console.log('Current mode:', client.isNonBlockingAnimationsEnabled() ? 'Non-blocking' : 'Blocking');
  
  // Switch to blocking mode
  client.setNonBlockingAnimationsEnabled(false);
  console.log('Switched to blocking mode');
  console.log('Current mode:', client.isNonBlockingAnimationsEnabled() ? 'Non-blocking' : 'Blocking');
  
  // Switch back to non-blocking mode
  client.setNonBlockingAnimationsEnabled(true);
  console.log('Switched to non-blocking mode');
  console.log('Current mode:', client.isNonBlockingAnimationsEnabled() ? 'Non-blocking' : 'Blocking');

  console.log('\nDemo complete!');
}

// Explanation of the differences:
function explainDifferences() {
  console.log('\n=== Blocking vs Non-Blocking Animation Explanation ===');
  console.log('');
  console.log('BLOCKING ANIMATIONS (nonBlockingAnimations: false):');
  console.log('- Waits for each HTTP request to complete before continuing');
  console.log('- More reliable - ensures each frame was actually sent');
  console.log('- Slower and may stutter if network is slow or Companion is busy');
  console.log('- Good for: Critical animations where reliability is key');
  console.log('');
  console.log('NON-BLOCKING ANIMATIONS (nonBlockingAnimations: true - default):');
  console.log('- Sends HTTP requests without waiting for responses');
  console.log('- Much faster and smoother animations');
  console.log('- May miss frames if network is extremely slow');
  console.log('- Good for: Smooth visual effects, frequent status updates');
  console.log('');
  console.log('RECOMMENDATION:');
  console.log('- Use non-blocking (default) for smooth animations');
  console.log('- Use blocking only if you need guaranteed delivery for critical states');
}

export { animationPerformanceDemo, explainDifferences };
