/**
 * Basic usage example for the StreamDeck Companion Client
 */
import {
  createLocalStreamDeckClient,
  createRemoteStreamDeckClient,
  COLORS,
  BUTTON_PRESETS,
  isDirectAvailable
} from '../src/index.js';

async function basicExample() {
  console.log('🚀 StreamDeck Companion Client - Basic Example');
  
  // Create an HTTP client (works in browser and Node.js)
  const client = createLocalStreamDeckClient(8000);
  
  // Test connection
  console.log('📡 Testing connection...');
  const status = await client.testConnection();
  console.log('Connected:', status.connected);
  
  if (!status.connected) {
    console.log('❌ Cannot connect to StreamDeck Companion. Make sure it\'s running on localhost:8000');
    return;
  }
  
  const pos = { page: 1, row: 0, column: 0 };
  
  // Basic button operations
  console.log('🔴 Setting button to red...');
  await client.button(pos)
    .text('Hello')
    .bgcolor(COLORS.ERROR)
    .color(COLORS.WHITE)
    .apply();
    
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Flash animation
  console.log('✨ Flash animation...');
  await client.button(pos).animate(BUTTON_PRESETS.SUCCESS, 1000, { type: 'flash', intervals: 3 });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Set custom variable
  console.log('🔧 Setting custom variable...');
  await client.setCustomVariable('demo_status', 'running');
  
  // Test remote capabilities (Node.js only)
  if (isDirectAvailable()) {
    console.log('🔗 TCP/UDP remote control is available!');
    try {
      const remote = await client.createDirectClient('tcp');
      await remote.connect();
      console.log('📡 Connected via TCP');
      
      // Use remote for a quick button press
      await remote.pressButton({ page: 1, row: 0, column: 1 });
      console.log('✅ Button pressed via TCP');
      
      await remote.disconnect();
    } catch (error) {
      console.log('⚠️ Remote control failed:', (error as Error).message);
    }
  } else {
    console.log('ℹ️ Remote control not available (browser environment)');
  }
  
  console.log('✅ Example completed!');
}

// Run if this file is executed directly
if (import.meta.main) {
  basicExample().catch(console.error);
}

export { basicExample };
