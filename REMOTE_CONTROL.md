# Remote Control Setup Guide

This guide explains how to set up and use the TCP/UDP remote control features of the StreamDeck Companion TypeScript client.

## Overview

The remote control feature allows you to send commands directly to StreamDeck Companion via TCP or UDP protocols on port 16759. This provides faster response times compared to HTTP requests and enables some features not available via the HTTP API.

## Requirements

- **Node.js Environment**: Remote control is only available in Node.js, not in browsers
- **StreamDeck Companion 3.0.0+**: With remote control enabled
- **Network Access**: Port 16759 must be accessible (TCP and/or UDP)

## Quick Setup

### 1. Enable Remote Control in Companion

1. Open StreamDeck Companion
2. Go to Settings
3. Enable "Remote Control" 
4. Note the IP address and port (default: port 16759)

### 2. Install and Import

```typescript
import { 
  createRemoteClient, 
  isRemoteAvailable,
  StreamDeckClient 
} from './streamdeck';
```

### 3. Check Environment

```typescript
// Check if remote control is supported
if (!isRemoteAvailable()) {
  console.log('Remote control requires Node.js environment');
  // Fall back to HTTP only
}

// Or check via client
const capabilities = StreamDeckClient.getRemoteCapabilities();
console.log('TCP available:', capabilities.tcp);  // true in Node.js
console.log('UDP available:', capabilities.udp);  // true in Node.js
```

## Basic Usage

### TCP Connection (Reliable)

```typescript
// Create and connect TCP client
const tcpClient = await createRemoteClient('tcp', 'localhost', 16759);
await tcpClient.connect();

// Send commands
await tcpClient.pressButton({ page: 1, row: 2, column: 3 });
await tcpClient.setButtonText({ page: 1, row: 0, column: 0 }, 'Hello TCP!');
await tcpClient.setButtonBackgroundColor({ page: 1, row: 0, column: 0 }, '#FF0000');

// Surface control (not available via HTTP)
await tcpClient.setSurfacePage('emulator', 5);
await tcpClient.surfacePageUp('emulator');

// Custom variables
await tcpClient.setCustomVariable('status', 'connected');

// Clean up
await tcpClient.disconnect();
```

### UDP Connection (Fast)

```typescript
// Create and connect UDP client
const udpClient = await createRemoteClient('udp', 'localhost', 16759);
await udpClient.connect();

// UDP is great for rapid status updates
for (let i = 0; i < 100; i++) {
  await udpClient.setButtonText({ page: 1, row: 0, column: 1 }, `Count: ${i}`);
  await new Promise(resolve => setTimeout(resolve, 50));
}

await udpClient.disconnect();
```

### Combined with HTTP Client

```typescript
// Create HTTP client
const httpClient = new StreamDeckClient({ baseUrl: 'http://localhost:8000' });

// Add remote client for fast commands
const remote = await httpClient.createRemoteClient('tcp');
await remote.connect();

// Use remote for simple, fast operations
await remote.pressButton({ page: 1, row: 0, column: 0 });

// Use HTTP for complex operations with animations
await httpClient.button({ page: 1, row: 0, column: 1 })
  .text('Complex')
  .bgcolor('#00FF00')
  .animate('SUCCESS', 1000)
  .apply();
```

## Protocol Comparison

| Feature | HTTP | TCP | UDP |
|---------|------|-----|-----|
| **Speed** | Slower | Fast | Fastest |
| **Reliability** | High | High | Medium |
| **Connection Management** | Stateless | Stateful | Connectionless |
| **Browser Support** | ✅ | ❌ | ❌ |
| **Node.js Support** | ✅ | ✅ | ✅ |
| **Complex Operations** | ✅ | ❌ | ❌ |
| **Surface Control** | ❌ | ✅ | ✅ |
| **Get Variables** | ✅ | ❌ | ❌ |
| **Animations** | ✅ | ❌ | ❌ |

## Available Commands

### Button Actions
- `pressButton(position)` - Press and release
- `pressButtonDown(position)` - Press and hold
- `releaseButton(position)` - Release button
- `rotateLeft(position)` - Encoder left
- `rotateRight(position)` - Encoder right
- `setButtonStep(position, step)` - Set encoder step

### Button Styling
- `setButtonText(position, text)` - Change text
- `setButtonTextColor(position, color)` - Change text color
- `setButtonBackgroundColor(position, color)` - Change background
- `updateButtonStyle(position, style)` - Multiple properties

### Surface Control (Remote Only)
- `setSurfacePage(surfaceId, page)` - Set surface to page
- `surfacePageUp(surfaceId)` - Page up
- `surfacePageDown(surfaceId)` - Page down

### Variables
- `setCustomVariable(name, value)` - Set custom variable

### System
- `rescanSurfaces()` - Rescan for USB devices

## Event Handling

```typescript
const remote = await createRemoteClient('tcp');

// Listen to all events
remote.addEventListener((event) => {
  console.log(`Event: ${event.type}.${event.action}`);
  
  switch (event.type) {
    case 'connection':
      if (event.action === 'connected') {
        console.log('Remote connected');
      } else if (event.action === 'disconnected') {
        console.log('Remote disconnected');
      }
      break;
      
    case 'command':
      if (event.action === 'sent') {
        console.log('Command sent:', event.data);
      }
      break;
      
    case 'message':
      if (event.action === 'received') {
        console.log('Message received:', event.data);
      }
      break;
  }
});

await remote.connect();
```

## Error Handling

```typescript
import { StreamDeckError } from './streamdeck';

try {
  const remote = await createRemoteClient('tcp');
  await remote.connect();
  await remote.pressButton({ page: 1, row: 0, column: 0 });
} catch (error) {
  if (error instanceof StreamDeckError) {
    switch (error.code) {
      case 'BROWSER_NOT_SUPPORTED':
        console.log('Remote control requires Node.js');
        break;
      case 'CONNECTION_TIMEOUT':
        console.log('Could not connect to Companion');
        break;
      case 'TCP_CONNECTION_FAILED':
        console.log('TCP connection failed');
        break;
      case 'UDP_CONNECTION_FAILED':
        console.log('UDP connection failed');
        break;
      default:
        console.log('Remote error:', error.message);
    }
  }
}
```

## Raw Command Sending

You can also send raw protocol commands:

```typescript
const remote = await createRemoteClient('tcp');
await remote.connect();

// Send raw commands
await remote.sendCommand('LOCATION 1/2/3 PRESS');
await remote.sendCommand('SURFACE emulator PAGE-SET 5');
await remote.sendCommand('CUSTOM-VARIABLE myvar SET-VALUE hello');
```

## Configuration Options

```typescript
const remote = await createRemoteClient('tcp', 'localhost', 16759);

// Or with full configuration
const remoteWithConfig = new RemoteClient({
  host: '192.168.1.100',
  port: 16759,
  protocol: 'tcp',
  timeout: 5000,
  reconnectAttempts: 3,
  reconnectDelay: 1000
});
```

## Best Practices

### When to Use TCP
- Critical commands that must be delivered
- Button presses for important actions
- When you need connection state awareness
- Sequence of commands that must complete

### When to Use UDP
- Rapid status updates (viewer counts, timers)
- Non-critical styling updates
- High-frequency data (multiple updates per second)
- When slight message loss is acceptable

### When to Use HTTP
- Complex styling with multiple properties
- Animations and effects
- Getting data back (custom variables)
- Browser environments
- Conditional chaining operations

## Troubleshooting

### Connection Issues
1. **Check Companion is running**: Make sure StreamDeck Companion is open
2. **Verify remote control enabled**: Check Companion settings
3. **Test port access**: Ensure port 16759 is accessible
4. **Check firewall**: Allow connections to port 16759
5. **Try different protocols**: If TCP fails, try UDP

### Performance Issues
1. **Use appropriate protocol**: TCP for reliability, UDP for speed
2. **Batch operations**: Avoid sending too many commands rapidly
3. **Add delays**: Small delays between commands prevent overwhelming
4. **Check network latency**: High latency affects TCP more than UDP

### Common Errors
- `BROWSER_NOT_SUPPORTED`: Use Node.js environment
- `CONNECTION_TIMEOUT`: Check Companion is running and accessible
- `NODE_MODULES_UNAVAILABLE`: Ensure Node.js `net` and `dgram` modules available

## Example Applications

### Live Stream Controller
```typescript
// Fast UDP updates for viewer count
const udp = await createRemoteClient('udp');
await udp.connect();

setInterval(async () => {
  const viewers = await getViewerCount();
  await udp.setButtonText({ page: 1, row: 0, column: 0 }, `${viewers} viewers`);
}, 1000);

// Reliable TCP for stream control
const tcp = await createRemoteClient('tcp');
await tcp.connect();

async function toggleStream() {
  await tcp.pressButton({ page: 1, row: 1, column: 0 }); // Start/stop stream
}
```

### Gaming Overlay
```typescript
// Quick UDP updates for game stats
const remote = await createRemoteClient('udp');
await remote.connect();

gameEvents.on('scoreUpdate', async (score) => {
  await remote.setButtonText({ page: 1, row: 0, column: 1 }, `Score: ${score}`);
});

gameEvents.on('healthUpdate', async (health) => {
  const color = health > 50 ? '#00FF00' : health > 25 ? '#FFFF00' : '#FF0000';
  await remote.setButtonBackgroundColor({ page: 1, row: 0, column: 2 }, color);
  await remote.setButtonText({ page: 1, row: 0, column: 2 }, `HP: ${health}`);
});
```

This guide should get you started with remote control functionality. The key is choosing the right protocol for your use case and handling errors appropriately.
