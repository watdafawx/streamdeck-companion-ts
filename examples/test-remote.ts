/**
 * Test script for StreamDeck Companion TCP/UDP remote control
 * 
 * Run this script with Node.js to test the remote control functionality.
 * Make sure StreamDeck Companion is running and remote control is enabled.
 */

import { createRemoteClient, isRemoteAvailable, StreamDeckClient } from '../streamdeck';

async function testRemoteControl() {
  console.log('🧪 StreamDeck Remote Control Test');
  console.log('==================================\n');

  // Test environment detection
  console.log('🔍 Environment Detection:');
  console.log(`   Remote available: ${isRemoteAvailable()}`);
  
  const capabilities = StreamDeckClient.getRemoteCapabilities();
  console.log(`   TCP support: ${capabilities.tcp}`);
  console.log(`   UDP support: ${capabilities.udp}\n`);

  if (!isRemoteAvailable()) {
    console.log('❌ Remote control not available in this environment');
    return;
  }

  try {
    // Test TCP connection
    console.log('📡 Testing TCP connection...');
    const tcpClient = await createRemoteClient('tcp', 'localhost', 16759);
    
    console.log('🔌 Connecting via TCP...');
    await tcpClient.connect();
    console.log('✅ TCP connected\n');

    // Test basic commands
    console.log('🎯 Testing TCP commands...');
    const testPos = { page: 1, row: 0, column: 0 };
    
    await tcpClient.setButtonText(testPos, 'TCP Test');
    console.log('   ✓ Set button text');
    
    await tcpClient.setButtonBackgroundColor(testPos, '#00FF00');
    console.log('   ✓ Set background color');
    
    await tcpClient.pressButton(testPos);
    console.log('   ✓ Pressed button');

    await tcpClient.disconnect();
    console.log('🔌 TCP disconnected\n');

    // Test UDP connection
    console.log('📡 Testing UDP connection...');
    const udpClient = await createRemoteClient('udp', 'localhost', 16759);
    
    console.log('🔌 Connecting via UDP...');
    await udpClient.connect();
    console.log('✅ UDP connected\n');

    console.log('🎯 Testing UDP commands...');
    await udpClient.setButtonText(testPos, 'UDP Test');
    console.log('   ✓ Set button text via UDP');
    
    await udpClient.setButtonBackgroundColor(testPos, '#FF0000');
    console.log('   ✓ Set background color via UDP');

    await udpClient.disconnect();
    console.log('🔌 UDP disconnected\n');

    // Test via HTTP client integration
    console.log('🌐 Testing HTTP client integration...');
    const httpClient = new StreamDeckClient({ baseUrl: 'http://localhost:8000' });
    
    if (StreamDeckClient.getRemoteCapabilities().available) {
      const remoteViaHttp = await httpClient.createRemoteClient('tcp');
      await remoteViaHttp.connect();
      
      await remoteViaHttp.setButtonText(testPos, 'Via HTTP');
      console.log('   ✓ Remote client created via HTTP client');
      
      await remoteViaHttp.disconnect();
    }

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('   - Ensure StreamDeck Companion is running');
    console.log('   - Check that remote control is enabled in Companion settings');
    console.log('   - Verify host and port are correct (default: localhost:16759)');
    console.log('   - Make sure no firewall is blocking port 16759');
  }
}

async function testRawCommands() {
  console.log('\n📝 Testing Raw Command Sending');
  console.log('==============================\n');

  if (!isRemoteAvailable()) {
    console.log('❌ Raw command testing requires Node.js environment');
    return;
  }

  try {
    const client = await createRemoteClient('tcp');
    await client.connect();

    console.log('📤 Sending raw commands...');
    
    // Test all command types
    const commands = [
      'LOCATION 1/0/1 STYLE TEXT Raw Command',
      'LOCATION 1/0/1 STYLE BGCOLOR #FFFF00',
      'LOCATION 1/0/1 STYLE COLOR #000000',
      'LOCATION 1/0/1 PRESS',
      'CUSTOM-VARIABLE test_var SET-VALUE hello_tcp',
      'SURFACES RESCAN'
    ];

    for (const command of commands) {
      await client.sendCommand(command);
      console.log(`   ✓ ${command}`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await client.disconnect();
    console.log('\n✅ Raw command test completed');

  } catch (error) {
    console.error('\n❌ Raw command test failed:', error);
  }
}

// Run tests
if (typeof process !== 'undefined') {
  testRemoteControl()
    .then(() => testRawCommands())
    .catch(console.error);
}

export { testRemoteControl, testRawCommands };
