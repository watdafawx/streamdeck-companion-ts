/**
 * ## Granular Method Control Demo
 * 
 * This example shows how to selectively enable/disable individual operations
 * in a chain using the optional `enabled` parameter on each method.
 * 
 * Unlike `when()` which affects the entire chain, the `enabled` parameter
 * gives you fine-grained control over specific operations.
 */

import { StreamDeckClient } from '../streamdeck';

async function granularControlExamples() {
  const client = new StreamDeckClient({ baseUrl: 'http://localhost:8000' });
  
  // Configuration for different scenarios
  const config = {
    showText: true,
    changeBackground: false, // This will be skipped
    playSound: true,
    updateVariables: false   // This will be skipped
  };

  console.log('=== Granular Method Control Examples ===\n');

  // Example 1: Basic granular control
  console.log('1. Basic granular control:');
  await client.button({ page: 0, column: 0, row: 0 })
    .text('Button Updated', config.showText)           // ✅ Will execute
    .bgcolor('#FF0000', config.changeBackground)      // ❌ Will be skipped
    .color('#FFFFFF', true)                           // ✅ Will execute (default enabled)
    .press(config.playSound)                          // ✅ Will execute  
    .setVar('status', 'updated', config.updateVariables) // ❌ Will be skipped
    .apply();

  // Example 2: Dynamic conditions
  const isEmergency = false;
  const isOnline = true;
  const hasPermission = true;

  console.log('2. Dynamic conditions:');
  await client.button({ page: 0, column: 1, row: 0 })
    .text('System Status')
    .bgcolor('#FF0000', isEmergency)                  // Red only if emergency
    .bgcolor('#00FF00', isOnline && !isEmergency)     // Green if online and not emergency
    .bgcolor('#808080', !isOnline)                    // Gray if offline
    .press(hasPermission)                             // Only press if user has permission
    .apply();

  // Example 3: Feature flags
  const features = {
    enableAnimations: true,
    enableSounds: false,
    enableVariables: true,
    enableAdvancedStyling: false
  };

  console.log('3. Feature flag control:');
  await client.button({ page: 0, column: 2, row: 0 })
    .text('Feature Demo')
    .bgcolor('#0000FF', features.enableAdvancedStyling)
    .size(24, features.enableAdvancedStyling)
    .press(features.enableSounds)
    .setVar('demo_run', 'true', features.enableVariables)
    .apply();

  // Example 4: User preferences
  const userPrefs = {
    largeText: false,
    darkMode: true,
    soundEffects: false,
    trackUsage: true
  };

  console.log('4. User preference control:');
  await client.button({ page: 0, column: 3, row: 0 })
    .text('User Prefs')
    .size(28, userPrefs.largeText)                    // Large text if preferred
    .size(14, !userPrefs.largeText)                   // Normal text otherwise
    .bgcolor('#000000', userPrefs.darkMode)           // Dark background if preferred
    .bgcolor('#FFFFFF', !userPrefs.darkMode)          // Light background otherwise
    .color('#FFFFFF', userPrefs.darkMode)             // White text in dark mode
    .color('#000000', !userPrefs.darkMode)            // Black text in light mode
    .press(userPrefs.soundEffects)                    // Sound only if enabled
    .setVar('user_interaction', 'button_press', userPrefs.trackUsage)
    .apply();

  // Example 5: System Chain with granular control
  console.log('5. System operations with granular control:');
  
  const systemConfig = {
    updateVariables: true,
    rescanDevices: false,  // Skip expensive rescan
    logActivity: true
  };

  await client.system()
    .setVar('last_update', new Date().toISOString(), systemConfig.updateVariables)
    .setVar('system_status', 'active', systemConfig.updateVariables)
    .rescanSurfaces(systemConfig.rescanDevices)       // Skip if false
    .setVar('activity_log', 'system_updated', systemConfig.logActivity)
    .apply();

  // Example 6: Conditional styling based on state
  const buttonState = {
    isActive: true,
    hasErrors: false,
    isLoading: false,
    userLevel: 'admin' // 'admin', 'user', 'guest'
  };

  console.log('6. State-based conditional styling:');
  await client.button({ page: 0, column: 4, row: 0 })
    .text('Loading...', buttonState.isLoading)
    .text('Error!', buttonState.hasErrors && !buttonState.isLoading)
    .text('Active', buttonState.isActive && !buttonState.hasErrors && !buttonState.isLoading)
    .text('Inactive', !buttonState.isActive && !buttonState.hasErrors && !buttonState.isLoading)
    .bgcolor('#FFA500', buttonState.isLoading)        // Orange for loading
    .bgcolor('#FF0000', buttonState.hasErrors)        // Red for errors
    .bgcolor('#00FF00', buttonState.isActive && !buttonState.hasErrors) // Green for active
    .bgcolor('#808080', !buttonState.isActive)        // Gray for inactive
    .press(buttonState.userLevel === 'admin')         // Only admin can press
    .setVar('button_state', JSON.stringify(buttonState), true)
    .apply();

  // Example 7: Performance optimization - skip expensive operations
  const performance = {
    fastMode: true,
    skipAnimations: true,
    skipVariableUpdates: false
  };

  console.log('7. Performance optimization:');
  await client.button({ page: 0, column: 5, row: 0 })
    .text('Fast Mode', performance.fastMode)
    .text('Normal Mode', !performance.fastMode)
    .bgcolor('#FFFF00', !performance.skipAnimations)  // Skip color change in fast mode
    .size(20, !performance.skipAnimations)            // Skip size change in fast mode
    .press(!performance.skipAnimations)               // Skip press action in fast mode
    .setVar('mode', 'fast', performance.fastMode && !performance.skipVariableUpdates)
    .setVar('mode', 'normal', !performance.fastMode && !performance.skipVariableUpdates)
    .apply();

  console.log('\n=== Granular Control vs when() ===');
  console.log('Granular enabled parameters:');
  console.log('✅ Allow fine-grained control per operation');
  console.log('✅ Can mix enabled/disabled operations in same chain');
  console.log('✅ Perfect for feature flags and user preferences');
  console.log('✅ Disabled operations are completely skipped (no HTTP calls)');
  
  console.log('\nwhen() conditions:');
  console.log('✅ Control entire chain execution');
  console.log('✅ Good for high-level conditional logic');
  console.log('✅ Simpler for all-or-nothing scenarios');
  
  console.log('\nBest practices:');
  console.log('• Use granular enabled for feature flags and user preferences');
  console.log('• Use when() for high-level conditional logic');
  console.log('• Combine both for maximum flexibility');
  console.log('• Disabled operations have zero performance impact');
}

// Run the examples
granularControlExamples().catch(console.error);
