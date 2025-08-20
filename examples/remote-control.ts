/**
 * Remote Control Example - TCP/UDP Commands
 * 
 * This example demonstrates how to use the TCP/UDP remote control features
 * of the StreamDeck Companion TypeScript library. This functionality is
 * only available in Node.js environments.
 * 
 * The remote control protocol sends plain text commands over TCP or UDP
 * to port 16759 on the Companion host.
 */

import { 
  createRemoteClient, 
  isRemoteAvailable, 
  StreamDeckClient,
  type ButtonPosition 
} from '../streamdeck';

async function demonstrateRemoteControl() {
  console.log('StreamDeck Companion Remote Control Demo');
  console.log('=====================================\n');

  // Check if remote control is available
  if (!isRemoteAvailable()) {
    console.log('❌ Remote control is only available in Node.js environments');
    console.log('   This example must be run with Node.js, not in a browser.');
    return;
  }

  console.log('✅ Remote control is available in this environment\n');

  try {
    // Method 1: Direct remote client creation
    console.log('📡 Creating TCP remote client...');
    const tcpRemote = await createRemoteClient('tcp', 'localhost', 16759);
    
    console.log('🔌 Connecting to StreamDeck Companion...');
    await tcpRemote.connect();
    console.log('✅ Connected via TCP\n');

    // Add event listeners to see what's happening
    tcpRemote.addEventListener((event: any) => {
      console.log(`🔔 Event: ${event.type}.${event.action}`, event.data ? `- ${JSON.stringify(event.data)}` : '');
    });

    // Demonstrate button actions
    console.log('🎯 Testing button actions...');
    const buttonPos: ButtonPosition = { page: 1, row: 2, column: 3 };
    
    await tcpRemote.pressButton(buttonPos);
    console.log(`   ✓ Pressed button at page ${buttonPos.page}, row ${buttonPos.row}, column ${buttonPos.column}`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await tcpRemote.pressButtonDown(buttonPos);
    console.log('   ✓ Button down');
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    await tcpRemote.releaseButton(buttonPos);
    console.log('   ✓ Button up');

    // Demonstrate styling
    console.log('\n🎨 Testing button styling...');
    await tcpRemote.setButtonText(buttonPos, 'Hello TCP!');
    console.log('   ✓ Set button text');
    
    await tcpRemote.setButtonBackgroundColor(buttonPos, '#FF0000');
    console.log('   ✓ Set background color to red');
    
    await tcpRemote.setButtonTextColor(buttonPos, '#FFFFFF');
    console.log('   ✓ Set text color to white');

    // Demonstrate surface control
    console.log('\n📺 Testing surface control...');
    await tcpRemote.setSurfacePage('emulator', 5);
    console.log('   ✓ Set emulator surface to page 5');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await tcpRemote.surfacePageUp('emulator');
    console.log('   ✓ Page up on emulator surface');

    // Demonstrate custom variables
    console.log('\n🔧 Testing custom variables...');
    await tcpRemote.setCustomVariable('demo_var', 'Hello from TCP!');
    console.log('   ✓ Set custom variable "demo_var"');

    // Demonstrate encoder/rotary actions
    console.log('\n🔄 Testing encoder actions...');
    await tcpRemote.rotateLeft(buttonPos);
    console.log('   ✓ Rotate left');
    
    await tcpRemote.rotateRight(buttonPos);
    console.log('   ✓ Rotate right');
    
    await tcpRemote.setButtonStep(buttonPos, 10);
    console.log('   ✓ Set button step to 10');

    // Clean up
    await new Promise(resolve => setTimeout(resolve, 1000));
    await tcpRemote.disconnect();
    console.log('\n🔌 Disconnected from TCP\n');

    // Method 2: Using HTTP client to create remote client
    console.log('🌐 Alternative: Creating remote client via HTTP client...');
    const httpClient = new StreamDeckClient({ 
      baseUrl: 'http://localhost:8000' 
    });
    
    const udpRemote = await httpClient.createRemoteClient('udp');
    
    console.log('📡 Connecting via UDP...');
    await udpRemote.connect();
    console.log('✅ Connected via UDP');

    // Test UDP commands
    await udpRemote.setButtonText({ page: 1, row: 0, column: 0 }, 'UDP Test');
    await udpRemote.setButtonBackgroundColor({ page: 1, row: 0, column: 0 }, '#00FF00');
    console.log('   ✓ Sent UDP commands');

    await udpRemote.disconnect();
    console.log('🔌 Disconnected from UDP\n');

    console.log('🎉 Remote control demo completed successfully!');

  } catch (error) {
    console.error('❌ Error during remote control demo:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('   - Make sure StreamDeck Companion is running');
    console.log('   - Verify the host and port are correct (default: localhost:16759)');
    console.log('   - Check that remote control is enabled in Companion settings');
    console.log('   - Ensure firewall allows connections to port 16759');
  }
}

async function demonstrateCommandFormats() {
  console.log('\n📋 Available Remote Commands');
  console.log('============================\n');

  const commands = [
    {
      category: 'Surface Control',
      examples: [
        'SURFACE emulator PAGE-SET 23     # Set surface to page 23',
        'SURFACE emulator PAGE-UP         # Page up',
        'SURFACE emulator PAGE-DOWN       # Page down'
      ]
    },
    {
      category: 'Button Actions',
      examples: [
        'LOCATION 1/2/3 PRESS            # Press and release button',
        'LOCATION 1/2/3 DOWN             # Press button (hold)',
        'LOCATION 1/2/3 UP               # Release button',
        'LOCATION 1/2/3 ROTATE-LEFT      # Rotate encoder left',
        'LOCATION 1/2/3 ROTATE-RIGHT     # Rotate encoder right',
        'LOCATION 1/2/3 SET-STEP 5       # Set encoder step'
      ]
    },
    {
      category: 'Button Styling',
      examples: [
        'LOCATION 1/2/3 STYLE TEXT Hello World    # Set button text',
        'LOCATION 1/2/3 STYLE COLOR #FF0000       # Set text color',
        'LOCATION 1/2/3 STYLE BGCOLOR #000000     # Set background color'
      ]
    },
    {
      category: 'Variables',
      examples: [
        'CUSTOM-VARIABLE myvar SET-VALUE hello    # Set custom variable'
      ]
    },
    {
      category: 'System',
      examples: [
        'SURFACES RESCAN                          # Rescan for USB surfaces'
      ]
    }
  ];

  commands.forEach(({ category, examples }) => {
    console.log(`${category}:`);
    examples.forEach(example => {
      console.log(`  ${example}`);
    });
    console.log();
  });
}

export { demonstrateRemoteControl, demonstrateCommandFormats };
