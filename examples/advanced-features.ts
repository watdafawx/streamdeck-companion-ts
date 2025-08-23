/**
 * Advanced features example - Animations, conditionals, and batch operations
 */
import {
  StreamDeckClient,
  COLORS,
  BUTTON_PRESETS,
  createAnimator,
  isDirectAvailable
} from '../src/index.js';

async function advancedExample() {
  console.log('🚀 StreamDeck Companion Client - Advanced Example');
  
  const client = new StreamDeckClient({ 
    baseUrl: 'http://localhost:8000',
    enableCaching: true,
    nonBlockingAnimations: true
  });
  
  // Test connection
  const status = await client.testConnection();
  if (!status.connected) {
    console.log('❌ Cannot connect to StreamDeck Companion');
    return;
  }
  
  console.log('✅ Connected to StreamDeck Companion');
  
  // Simulate some state
  let isLive = false;
  let viewerCount = 0;
  
  // Setup layout
  const positions = {
    liveButton: { page: 1, row: 0, column: 0 },
    viewerCount: { page: 1, row: 0, column: 1 },
    statusLight: { page: 1, row: 0, column: 2 },
    controlPanel: { page: 1, row: 1, column: 0 }
  };
  
  // Function to update the entire layout
  async function updateLayout() {
    console.log(`📊 Updating layout - Live: ${isLive}, Viewers: ${viewerCount}`);
    
    // Use conditional chaining for responsive updates
    await Promise.all([
      // Live button - changes based on state
      client.button(positions.liveButton)
        .when(isLive)
        .text('LIVE')
        .bgcolor(COLORS.ERROR)
        .color(COLORS.WHITE)
        .apply(),
        
      client.button(positions.liveButton)
        .unless(isLive)
        .text('OFFLINE')
        .bgcolor(COLORS.GRAY)
        .color(COLORS.WHITE)
        .apply(),
      
      // Viewer count - only update if live
      client.button(positions.viewerCount)
        .when(isLive)
        .text(`${viewerCount}\\nviewers`)
        .bgcolor(COLORS.STREAMDECK_BLUE)
        .color(COLORS.WHITE)
        .apply(),
        
      client.button(positions.viewerCount)
        .unless(isLive)
        .text('No Stream')
        .bgcolor(COLORS.DARK_GRAY)
        .color(COLORS.GRAY)
        .apply(),
      
      // Status light with animation
      client.button(positions.statusLight)
        .when(isLive)
        .text('●')
        .bgcolor(COLORS.SUCCESS)
        .size(20)
        .apply()
    ]);
    
    // Animate status light when live
    if (isLive) {
      // Create a pulsing animation
      client.button(positions.statusLight)
        .animate({ bgcolor: COLORS.SUCCESS }, 1000, { 
          type: 'pulse', 
          intervals: 2,
          loop: true 
        });
    }
  }
  
  // Demo: Go live sequence
  console.log('🎬 Simulating "going live" sequence...');
  
  // Initial state
  await updateLayout();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Go live with animation
  isLive = true;
  await updateLayout();
  
  // Flash the live button
  await client.button(positions.liveButton)
    .animate(BUTTON_PRESETS.SUCCESS, 500, { type: 'flash', intervals: 3 });
  
  // Simulate viewer count growth
  for (let i = 0; i < 5; i++) {
    viewerCount += Math.floor(Math.random() * 50) + 10;
    await client.button(positions.viewerCount)
      .text(`${viewerCount}\\nviewers`)
      .apply();
    await new Promise(resolve => setTimeout(resolve, 800));
  }
  
  // Demo: Conditional updates with async predicates
  console.log('🔄 Testing conditional updates...');
  
  let currentScene = 'Camera 1';
  const scenes = ['Camera 1', 'Desktop', 'Camera 2', 'Ending Soon'];
  
  for (const scene of scenes) {
    currentScene = scene;
    
    await client.button(positions.controlPanel)
      .whenAsync(async () => {
        // Simulate async check (e.g., API call)
        await new Promise(resolve => setTimeout(resolve, 50));
        return scene !== 'Desktop'; // Don't show when on desktop
      })
      .text(scene)
      .bgcolor(scene === 'Ending Soon' ? COLORS.WARNING : COLORS.DARK_BLUE)
      .apply();
      
    if (scene === 'Ending Soon') {
      // Flash warning when ending soon
      await client.button(positions.controlPanel)
        .animate(BUTTON_PRESETS.WARNING, 800, { type: 'flash', intervals: 2 });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Demo: Batch operations with variables
  console.log('📦 Testing batch operations...');
  
  await client.system()
    .setVars({
      'stream_status': 'live',
      'current_scene': currentScene,
      'viewer_count': viewerCount.toString(),
      'stream_quality': '1080p60'
    })
    .rescanSurfaces()
    .apply();
  
  // Demo: Animator for complex animations
  if (client.isNonBlockingAnimationsEnabled()) {
    console.log('🎨 Testing complex animations...');
    
    const animator = await createAnimator(client, 20); // 20 FPS
    
    // Create a rainbow animation
    const rainbowId = animator.createRainbow(
      positions.statusLight,
      { text: '🌈' },
      { duration: 3000, loop: false }
    );
    
    await new Promise(resolve => setTimeout(resolve, 3500));
    
    // Fade to black sequence
    await client.button(positions.liveButton)
      .fadeTo(COLORS.BLACK, 1000)
      .fadeSequence([
        { color: COLORS.ERROR, duration: 500 },
        { color: COLORS.WARNING, duration: 500 },
        { color: COLORS.SUCCESS, duration: 500 }
      ]);
  }
  
  // Demo: Direct protocol (if available)
  if (isDirectAvailable()) {
    console.log('⚡ Testing direct protocol...');
    
    try {
      const direct = await client.createDirectClient('tcp');
      await direct.connect();
      
      // Rapid-fire updates via TCP
      for (let i = 0; i < 5; i++) {
        await direct.setButtonText(positions.viewerCount, `TCP ${i + 1}`);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      await direct.disconnect();
      console.log('✅ Direct protocol test completed');
    } catch (error) {
      console.log('⚠️ Direct protocol failed:', (error as Error).message);
    }
  }
  
  // Cleanup
  console.log('🧹 Cleaning up...');
  isLive = false;
  await updateLayout();
  
  // Clear the board
  await Promise.all([
    client.button(positions.liveButton).text('Demo\\nDone').bgcolor(COLORS.DARK_GRAY).apply(),
    client.button(positions.viewerCount).text('').bgcolor(COLORS.BLACK).apply(),
    client.button(positions.statusLight).text('').bgcolor(COLORS.BLACK).apply(),
    client.button(positions.controlPanel).text('').bgcolor(COLORS.BLACK).apply()
  ]);
  
  console.log('✅ Advanced example completed!');
}

// Run if this file is executed directly
if (import.meta.main) {
  advancedExample().catch(console.error);
}

export { advancedExample };
