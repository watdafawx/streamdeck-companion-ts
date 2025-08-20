/**
 * Fluent API Examples for Variables and System Operations
 * 
 * This example demonstrates how to use the fluent/chain API for
 * custom variables and system operations alongside button styling.
 */

import { StreamDeckClient } from '../streamdeck/client';

async function fluentVariablesDemo() {
  const client = new StreamDeckClient({ baseUrl: 'http://localhost:8000' });
  const position = StreamDeckClient.createPosition(0, 0, 0);

  console.log('=== Fluent API for Variables & System Operations ===');

  // Example 1: Button styling with variable updates
  console.log('Example 1: Button + Variables in one chain');
  await client.button(position)
    .text('Going Live')
    .bgcolor('#FF0000')
    .color('#FFFFFF')
    .setCustomVar('stream_status', 'live')
    .setCustomVar('viewer_count', '0')
    .setCustomVar('start_time', new Date().toISOString())
    .press() // Press the button after styling and setting variables
    .apply();

  // Example 2: System-wide operations using dedicated system chain
  console.log('Example 2: System-wide operations');
  await client.system()
    .setVar('stream_status', 'live')
    .setVar('current_scene', 'Main Camera')
    .setVars({
      'obs_connected': 'true',
      'audio_level': '75',
      'cpu_usage': '45'
    })
    .rescanSurfaces()
    .apply();

  // Example 3: Conditional variable updates
  console.log('Example 3: Conditional operations');
  const isStreamLive = true;
  const hasNewHardware = false;

  await client.system()
    .when(isStreamLive)
    .setVar('stream_status', 'live')
    .setVar('live_since', new Date().toISOString())
    .when(hasNewHardware)
    .rescanSurfaces()
    .apply();

  // Example 4: Complex workflow combining button and system operations
  console.log('Example 4: Complex workflow');
  const startStreamWorkflow = async () => {
    const viewerCount = Math.floor(Math.random() * 1000);
    const isReady = true;

    // Update button and set variables in one chain
    await client.button(position)
      .when(isReady)
      .text(`LIVE\n${viewerCount}`)
      .bgcolor('#FF0000')
      .color('#FFFFFF')
      .size(14)
      .setCustomVar('stream_status', 'live')
      .setCustomVar('viewer_count', viewerCount.toString())
      .setCustomVar('stream_title', 'Epic Gaming Session')
      .press()
      .apply();

    // Update system variables separately
    await client.system()
      .setVars({
        'obs_scene': 'main_camera',
        'audio_source': 'microphone',
        'quality': '1080p60',
        'bitrate': '6000'
      })
      .apply();
  };

  await startStreamWorkflow();

  // Example 5: Async conditions with variable updates
  console.log('Example 5: Async conditions');
  const checkStreamHealth = async (): Promise<boolean> => {
    // Simulate async check (e.g., API call)
    await new Promise(resolve => setTimeout(resolve, 100));
    return Math.random() > 0.3; // 70% chance of being healthy
  };

  await client.button(position)
    .whenAsync(checkStreamHealth)
    .text('Healthy')
    .bgcolor('#00FF00')
    .setCustomVar('stream_health', 'good')
    .unlessAsync(checkStreamHealth)
    .text('Issues')
    .bgcolor('#FF0000')
    .setCustomVar('stream_health', 'poor')
    .apply();

  // Example 6: Chaining across multiple buttons and system operations
  console.log('Example 6: Multi-button + system operations');
  const pos1 = StreamDeckClient.createPosition(0, 0, 0);
  const pos2 = StreamDeckClient.createPosition(0, 0, 1);
  const pos3 = StreamDeckClient.createPosition(0, 0, 2);

  // Update multiple buttons and system state
  await Promise.all([
    client.button(pos1)
      .text('CAM 1')
      .bgcolor('#00FF00')
      .setCustomVar('active_camera', '1')
      .apply(),
    
    client.button(pos2)
      .text('CAM 2')
      .bgcolor('#666666')
      .apply(),
    
    client.button(pos3)
      .text('CAM 3')
      .bgcolor('#666666')
      .apply(),
    
    client.system()
      .setVars({
        'current_camera': '1',
        'camera_1_active': 'true',
        'camera_2_active': 'false',
        'camera_3_active': 'false'
      })
      .apply()
  ]);

  // Example 7: Using applyAndContinue for method chaining
  console.log('Example 7: Method chaining with applyAndContinue');
  await client.button(position)
    .text('Processing...')
    .bgcolor('#FFA500')
    .setCustomVar('process_status', 'running')
    .applyAndContinue()
    .then(client => client.system()
      .setVar('last_update', new Date().toISOString())
      .rescanSurfaces()
      .applyAndContinue()
    )
    .then(client => client.button(position)
      .text('Complete')
      .bgcolor('#00FF00')
      .setCustomVar('process_status', 'complete')
      .apply()
    );

  console.log('Fluent API demo complete!');
}

// Helper function to demonstrate variable retrieval
async function demonstrateVariableRetrieval(client: StreamDeckClient) {
  console.log('\n=== Variable Retrieval Examples ===');
  
  try {
    // Get individual variables
    const streamStatus = await client.getCustomVariable('stream_status');
    const viewerCount = await client.getCustomVariable('viewer_count');
    
    console.log('Stream Status:', streamStatus);
    console.log('Viewer Count:', viewerCount);
    
    // Note: Module variables require connection label
    // const obsStatus = await client.getModuleVariable('obs-studio', 'status');
    
  } catch (error) {
    console.log('Note: Variable retrieval requires existing variables');
  }
}

export { fluentVariablesDemo, demonstrateVariableRetrieval };
