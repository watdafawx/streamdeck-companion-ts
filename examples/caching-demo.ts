/**
 * StreamDeck Client Caching Demo
 * 
 * This example demonstrates how the button state caching feature works
 * to prevent duplicate API calls when the same style properties are set repeatedly.
 */

import { StreamDeckClient } from '../streamdeck/client';

async function cachingDemo() {
  // Create client with caching enabled (default)
  const client = new StreamDeckClient({ 
    baseUrl: 'http://localhost:8000',
    enableCaching: true // This is the default, but shown for clarity
  });

  const position = StreamDeckClient.createPosition(0, 0, 0);

  console.log('=== Caching Demo ===');

  // First call - this will make an HTTP request
  console.log('Setting text to "Hello" (first time) - HTTP request will be made');
  await client.setButtonText(position, 'Hello');

  // Second call with same value - this will be skipped due to caching
  console.log('Setting text to "Hello" again - HTTP request will be skipped');
  await client.setButtonText(position, 'Hello');

  // Third call with different value - this will make an HTTP request
  console.log('Setting text to "World" - HTTP request will be made');
  await client.setButtonText(position, 'World');

  // Fourth call with same value as third - this will be skipped
  console.log('Setting text to "World" again - HTTP request will be skipped');
  await client.setButtonText(position, 'World');

  console.log('Current cached state:', client.getButtonState(position));

  // Fluent API demo - only one HTTP request for all changes
  console.log('Using fluent API - only one HTTP request for multiple changes');
  await client.button(position)
    .text('Fluent')
    .bgcolor('#FF0000')
    .color('#FFFFFF')
    .size(16)
    .apply();

  // Calling the same fluent chain again - will be skipped entirely
  console.log('Calling same fluent chain again - HTTP request will be skipped');
  await client.button(position)
    .text('Fluent')
    .bgcolor('#FF0000')
    .color('#FFFFFF')
    .size(16)
    .apply();

  console.log('Final cached state:', client.getButtonState(position));

  // Demo cache clearing
  console.log('Clearing cache for this button...');
  client.clearButtonCache(position);
  
  // This will now make a request even though we just set these values
  console.log('Setting same values after cache clear - HTTP request will be made');
  await client.button(position)
    .text('Fluent')
    .bgcolor('#FF0000')
    .apply();

  // Demo disabling caching
  console.log('Disabling caching...');
  client.setCachingEnabled(false);
  
  // Now every call will make an HTTP request
  console.log('Setting text with caching disabled - HTTP request will always be made');
  await client.setButtonText(position, 'No Cache');
  await client.setButtonText(position, 'No Cache'); // This will still make a request

  // Re-enable caching
  console.log('Re-enabling caching...');
  client.setCachingEnabled(true);

  console.log('Demo complete!');
}

// Run the demo (for Node.js environments)
async function runDemo() {
  try {
    await cachingDemo();
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

export { cachingDemo, runDemo };
