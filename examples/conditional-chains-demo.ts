/**
 * Conditional Chain Behavior Demo
 * 
 * This example demonstrates how `when()` affects chain execution
 * and shows different patterns for conditional operations.
 */

import { StreamDeckClient } from '../streamdeck/client';

async function conditionalChainDemo() {
  const client = new StreamDeckClient({ baseUrl: 'http://localhost:8000' });
  const position = StreamDeckClient.createPosition(0, 0, 0);

  console.log('=== Conditional Chain Behavior Demo ===');

  // Example 1: when() affects the ENTIRE chain
  console.log('\n1. when() affects ENTIRE chain:');
  
  const shouldExecute = false;
  console.log(`Condition: ${shouldExecute}`);
  
  await client.button(position)
    .text('Before when()')     // This would be queued
    .bgcolor('#FF0000')        // This would be queued  
    .when(shouldExecute)       // This sets the condition for the ENTIRE chain
    .text('After when()')      // This would be queued but won't execute
    .color('#FFFFFF')          // This would be queued but won't execute
    .press()                   // This would be queued but won't execute
    .apply();                  // If condition is false, NOTHING executes

  console.log('Result: Nothing executed because when(false) skipped the entire chain');

  // Example 2: when() with true condition
  console.log('\n2. when() with true condition:');
  
  const shouldExecuteTrue = true;
  console.log(`Condition: ${shouldExecuteTrue}`);
  
  await client.button(position)
    .text('All operations')
    .bgcolor('#00FF00')
    .when(shouldExecuteTrue)
    .color('#000000')
    .press()
    .apply();
    
  console.log('Result: All operations executed because when(true)');

  // Example 3: Multiple chains for fine-grained control
  console.log('\n3. Multiple chains for fine-grained control:');
  
  const isLive = true;
  const hasViewers = false;
  
  // Always update basic button style
  await client.button(position)
    .text('Stream Button')
    .bgcolor('#333333')
    .apply();
  
  // Conditionally update to live state
  if (isLive) {
    await client.button(position)
      .text('🔴 LIVE')
      .bgcolor('#FF0000')
      .setCustomVar('stream_status', 'live')
      .apply();
  }
  
  // Conditionally add viewer count
  if (hasViewers) {
    await client.button(position)
      .text('🔴 LIVE\n100 viewers')
      .setCustomVar('viewer_count', '100')
      .apply();
  }
  
  console.log('Result: Fine-grained control with separate chains');

  // Example 4: Conditional system operations
  console.log('\n4. System operations with conditions:');
  
  const needsRescan = true;
  const shouldUpdateVars = false;
  
  await client.system()
    .when(needsRescan)
    .rescanSurfaces()
    .apply();
    
  await client.system()
    .when(shouldUpdateVars)
    .setVar('last_update', new Date().toISOString())
    .setVar('system_status', 'updated')
    .apply();
    
  console.log('Result: Only rescan executed, variables not updated');

  // Example 5: Dynamic conditions
  console.log('\n5. Dynamic conditions with functions:');
  
  let counter = 0;
  const incrementCounter = () => ++counter < 3; // true for first 2 calls
  
  for (let i = 0; i < 5; i++) {
    await client.button(position)
      .when(incrementCounter) // Evaluated each time apply() is called
      .text(`Count: ${counter}`)
      .bgcolor('#0000FF')
      .apply();
    
    console.log(`Iteration ${i + 1}: Counter is ${counter}, condition was ${counter <= 3}`);
  }

  // Example 6: Async conditions
  console.log('\n6. Async conditions:');
  
  const checkStreamHealth = async (): Promise<boolean> => {
    console.log('Checking stream health...');
    await new Promise(resolve => setTimeout(resolve, 100));
    return Math.random() > 0.5; // 50% chance
  };
  
  await client.button(position)
    .whenAsync(checkStreamHealth)
    .text('Stream Healthy')
    .bgcolor('#00FF00')
    .setCustomVar('health_status', 'good')
    .apply();
    
  console.log('Result: Applied based on async health check');

  console.log('\n=== Summary ===');
  console.log('- when() sets a condition for the ENTIRE chain');
  console.log('- If condition is false, NO operations in the chain execute');
  console.log('- Use multiple chains for fine-grained conditional control');
  console.log('- Functions in when() are evaluated at apply() time');
  console.log('- whenAsync() supports async predicates');
}

async function conditionalPatternsDemo() {
  const client = new StreamDeckClient({ baseUrl: 'http://localhost:8000' });
  const position = StreamDeckClient.createPosition(0, 0, 0);

  console.log('\n=== Conditional Patterns ===');

  // Pattern 1: Chain splitting for partial execution
  console.log('\n1. Chain splitting pattern:');
  
  const baseChain = client.button(position)
    .text('Base')
    .bgcolor('#333333');
  
  const condition1 = true;
  const condition2 = false;
  
  // Always apply base styling
  await baseChain.apply();
  
  // Conditionally apply additional styling
  await client.button(position)
    .when(condition1)
    .text('Condition 1 True')
    .bgcolor('#00FF00')
    .apply();
    
  await client.button(position)
    .when(condition2)
    .text('Condition 2 True')
    .bgcolor('#FF0000')
    .apply();

  // Pattern 2: State machine with conditions
  console.log('\n2. State machine pattern:');
  
  type StreamState = 'offline' | 'starting' | 'live' | 'ending';
  let currentState: StreamState = 'live'; // Use let to make it mutable
  
  await client.button(position)
    .when(() => currentState === 'offline')
    .text('Offline')
    .bgcolor('#666666')
    .setCustomVar('stream_status', 'offline')
    .apply();
    
  await client.button(position)
    .when(() => currentState === 'starting')
    .text('Starting...')
    .bgcolor('#FFA500')
    .setCustomVar('stream_status', 'starting')
    .apply();
    
  await client.button(position)
    .when(() => currentState === 'live')
    .text('🔴 LIVE')
    .bgcolor('#FF0000')
    .setCustomVar('stream_status', 'live')
    .apply();
    
  await client.button(position)
    .when(() => currentState === 'ending')
    .text('Ending...')
    .bgcolor('#FF6600')
    .setCustomVar('stream_status', 'ending')
    .apply();

  console.log(`Result: Applied styling for state: ${currentState}`);
}

export { conditionalChainDemo, conditionalPatternsDemo };
