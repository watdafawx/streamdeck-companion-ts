# StreamDeck Companion TypeScript Client

A comprehensive TypeScript module for interacting with StreamDeck Companion's HTTP API and remote control protocol. This module is designed to work with any project and provides a clean, type-safe interface for controlling StreamDeck devices through Companion.

## Features

- ✅ **Full HTTP API Coverage** - All documented StreamDeck Companion HTTP endpoints
- ✅ **TCP/UDP Remote Control** - Direct protocol support (Node.js only)
- ✅ **TypeScript Support** - Complete type definitions and IntelliSense
- ✅ **Cross-Platform** - Works in browsers (HTTP only) and Node.js (HTTP + TCP/UDP)
- ✅ **Event Handl### Configuration

```typescript
const client = new StreamDeckClient({
  baseUrl: "http://127.0.0.1:8000", // Companion URL
  timeout: 5000, // Request timeout (ms)
  retries: 3, // Retry attempts
  enableCaching: true, // Enable button state caching (default: true)
  nonBlockingAnimations: true, // Use fire-and-forget for animations (default: true)
  defaultHeaders: {
    // Custom headers
    Authorization: "Bearer token",
  },
});
```

### Animation Performance

The client provides two modes for handling HTTP requests during animations:

#### Non-Blocking Animations (Default - Recommended)

```typescript
const client = new StreamDeckClient({
  baseUrl: 'http://localhost:8000',
  nonBlockingAnimations: true // Default - fire-and-forget requests
});

// This animation will be smooth and responsive
await client.button(position).animate({ bgcolor: '#FF0000' }, 1000, { type: 'flash' });
```

**Benefits:**
- ✅ **Smooth animations** - doesn't wait for HTTP responses
- ✅ **Consistent timing** - maintains precise frame intervals
- ✅ **Responsive UI** - won't freeze if network is slow
- ✅ **Better performance** - up to 80% faster animations

#### Blocking Animations

```typescript
const client = new StreamDeckClient({
  baseUrl: 'http://localhost:8000',
  nonBlockingAnimations: false // Wait for each HTTP response
});

// This animation will wait for each HTTP request to complete
await client.button(position).animate({ bgcolor: '#FF0000' }, 1000, { type: 'flash' });
```

**Benefits:**
- ✅ **Guaranteed delivery** - ensures each frame was sent
- ✅ **Error detection** - can catch HTTP errors immediately
- ❌ **May stutter** - pauses for network delays
- ❌ **Slower performance** - timing depends on network speed

#### Runtime Control

```typescript
// Check current mode
console.log('Non-blocking enabled:', client.isNonBlockingAnimationsEnabled());

// Switch to blocking mode for critical animations
client.setNonBlockingAnimationsEnabled(false);
await client.button(emergencyButton).animate('ERROR', 1000);

// Switch back to non-blocking for smooth effects
client.setNonBlockingAnimationsEnabled(true);
await client.button(statusButton).animate('SUCCESS', 500);
```

#### When to Use Each Mode

**Use Non-Blocking (default) for:**
- Visual effects and status indicators
- Frequent color/text updates
- Smooth user feedback
- Real-time status displays

**Use Blocking for:**
- Critical state changes that must be confirmed
- One-time important animations
- When network is very fast and reliable

### Button State Caching

The client includes intelligent caching to prevent duplicate API calls when setting the same button properties repeatedly. This significantly improves performance when your application updates buttons frequently.

```typescript
// First call - makes HTTP request
await client.setButtonText(position, 'Hello');

// Second call with same value - skipped (no HTTP request)
await client.setButtonText(position, 'Hello');

// Third call with different value - makes HTTP request
await client.setButtonText(position, 'World');
```

#### Cache Management

```typescript
// Check current cached state
const currentState = client.getButtonState(position);
console.log('Cached state:', currentState);

// Clear cache for specific button
client.clearButtonCache(position);

// Clear all cached states
client.clearAllCache();

// Disable caching temporarily
client.setCachingEnabled(false);
await client.setButtonText(position, 'No Cache'); // Always makes request

// Re-enable caching
client.setCachingEnabled(true);

// Check if caching is enabled
if (client.isCachingEnabled()) {
  console.log('Caching is active');
}
```

#### Manual State Synchronization

If you know the current state of a button from external sources, you can manually update the cache:

```typescript
// Set the cached state manually (useful when you know the current state)
client.setButtonState(position, {
  text: 'Known State',
  bgcolor: '#FF0000',
  color: '#FFFFFF'
});

// Now this call will be skipped since it matches the cached state
await client.setButtonText(position, 'Known State'); // No HTTP request
```

#### Performance Benefits

With caching enabled:
- ✅ Reduces unnecessary HTTP requests
- ✅ Improves application responsiveness  
- ✅ Reduces network overhead
- ✅ Prevents API rate limiting issues
- ✅ Works seamlessly with fluent API

Example performance comparison:

```typescript
// Without caching - 3 HTTP requests
await client.setButtonText(position, 'Hello');
await client.setButtonText(position, 'Hello'); // Duplicate request
await client.setButtonText(position, 'Hello'); // Duplicate request

// With caching (default) - 1 HTTP request
await client.setButtonText(position, 'Hello');
await client.setButtonText(position, 'Hello'); // Skipped
await client.setButtonText(position, 'Hello'); // Skipped
```n to button presses and style changes
- ✅ **Batch Operations** - Execute multiple operations efficiently
- ✅ **Color Utilities** - Helper functions for color management
- ✅ **Pre-built Layouts** - Ready-to-use layouts for common scenarios
- ✅ **Error Handling** - Robust error handling with retry logic
- ✅ **Utility Functions** - Text formatting, animations, and more

## Installation

Since this is a local module, simply import it in your TypeScript/JavaScript project:

```typescript
import {
  StreamDeckClient,
  createLocalStreamDeckClient,
  createRemoteClient,  // Node.js only
  isRemoteAvailable
} from "./path/to/streamdeck";
```

## Quick Start

### HTTP API (Browser + Node.js)

```typescript
import {
  createLocalStreamDeckClient,
  COLORS,
  BUTTON_PRESETS,
} from "./streamdeck";

// Create HTTP client (assumes Companion running on localhost:8000)
const client = createLocalStreamDeckClient();

// Test connection
const status = await client.testConnection();
console.log("Connected:", status.connected);

// Press a button
await client.pressButton({ page: 1, row: 0, column: 0 });
```

### Remote Control - TCP/UDP (Node.js Only)

```typescript
import { createRemoteClient, isRemoteAvailable } from "./streamdeck";

// Check if remote control is available
if (isRemoteAvailable()) {
  // Create TCP remote client
  const remote = await createRemoteClient('tcp', 'localhost', 16759);
  
  // Connect to Companion
  await remote.connect();
  
  // Press a button via TCP
  await remote.pressButton({ page: 1, row: 2, column: 3 });
  
  // Set button text and colors
  await remote.setButtonText({ page: 1, row: 0, column: 0 }, 'Hello TCP!');
  await remote.setButtonBackgroundColor({ page: 1, row: 0, column: 0 }, '#FF0000');
  
  // Control surfaces
  await remote.setSurfacePage('emulator', 5);
  
  // Custom variables
  await remote.setCustomVariable('demo_var', 'Hello from TCP!');
  
  await remote.disconnect();
}
```

### Hybrid Approach

```typescript
import { StreamDeckClient } from "./streamdeck";

// Create HTTP client
const client = new StreamDeckClient({ baseUrl: 'http://localhost:8000' });

// Also create remote client for faster commands (Node.js only)
if (client.getRemoteCapabilities().available) {
  const remote = await client.createRemoteClient('tcp');
  await remote.connect();
  
  // Use remote for simple commands (faster)
  await remote.pressButton({ page: 1, row: 0, column: 0 });
  
  // Use HTTP for complex operations (more features)
  await client.button({ page: 1, row: 0, column: 1 })
    .text('HTTP')
    .bgcolor('#00FF00')
    .animate('SUCCESS', 1000)
    .apply();
}
```

## Remote Control Protocol

The remote control feature sends plain text commands over TCP (port 16759) or UDP (port 16759) to StreamDeck Companion. This provides faster response times compared to HTTP requests.

### Available Commands

| Category | Command | Example |
|----------|---------|---------|
| **Surface Control** | `SURFACE <id> PAGE-SET <page>` | `SURFACE emulator PAGE-SET 23` |
| | `SURFACE <id> PAGE-UP` | `SURFACE emulator PAGE-UP` |
| | `SURFACE <id> PAGE-DOWN` | `SURFACE emulator PAGE-DOWN` |
| **Button Actions** | `LOCATION <page>/<row>/<col> PRESS` | `LOCATION 1/2/3 PRESS` |
| | `LOCATION <page>/<row>/<col> DOWN` | `LOCATION 1/2/3 DOWN` |
| | `LOCATION <page>/<row>/<col> UP` | `LOCATION 1/2/3 UP` |
| | `LOCATION <page>/<row>/<col> ROTATE-LEFT` | `LOCATION 1/2/3 ROTATE-LEFT` |
| | `LOCATION <page>/<row>/<col> ROTATE-RIGHT` | `LOCATION 1/2/3 ROTATE-RIGHT` |
| | `LOCATION <page>/<row>/<col> SET-STEP <step>` | `LOCATION 1/2/3 SET-STEP 5` |
| **Button Styling** | `LOCATION <page>/<row>/<col> STYLE TEXT <text>` | `LOCATION 1/2/3 STYLE TEXT Hello` |
| | `LOCATION <page>/<row>/<col> STYLE COLOR <hex>` | `LOCATION 1/2/3 STYLE COLOR #FF0000` |
| | `LOCATION <page>/<row>/<col> STYLE BGCOLOR <hex>` | `LOCATION 1/2/3 STYLE BGCOLOR #000000` |
| **Variables** | `CUSTOM-VARIABLE <name> SET-VALUE <value>` | `CUSTOM-VARIABLE cue SET-VALUE intro` |
| **System** | `SURFACES RESCAN` | `SURFACES RESCAN` |

### TCP vs UDP

- **TCP**: Reliable, connection-based. Use for critical commands.
- **UDP**: Fast, connectionless. Use for rapid-fire updates or when slight message loss is acceptable.

```typescript
// TCP - Reliable for important commands
const tcpRemote = await createRemoteClient('tcp');
await tcpRemote.connect();
await tcpRemote.pressButton({ page: 1, row: 0, column: 0 });

// UDP - Fast for status updates  
const udpRemote = await createRemoteClient('udp');
await udpRemote.connect();
await udpRemote.setButtonText({ page: 1, row: 0, column: 1 }, `Live: ${viewers}`);
```

### Basic Setup

```typescript
import {
  createLocalStreamDeckClient,
  COLORS,
  BUTTON_PRESETS,
} from "./streamdeck";

// Create client (assumes Companion running on localhost:8000)
const client = createLocalStreamDeckClient();

// Test connection
const status = await client.testConnection();
console.log("Connected:", status.connected);
```

## HTTP API Features

### Button Operations

```typescript
// Press a button
await client.pressButton({ page: 1, row: 0, column: 0 });

// Update button style
await client.updateButtonStyle(
  { page: 1, row: 0, column: 1 },
  {
    text: "Hello",
    bgcolor: COLORS.SUCCESS,
    color: COLORS.WHITE,
    size: 14,
  }
);

// Set button text only
await client.setButtonText({ page: 1, row: 0, column: 2 }, "LIVE");
```

### Fluent chaining (new, recommended for multiple changes)

You can still use the legacy single-purpose methods (examples above). A new
fluent API is available via `client.button(position)` that lets you batch
style updates and queue actions in a single, chainable call. This reduces the
number of HTTP requests and reads nicely in code.

Legacy example (single call):

```typescript
await client.setButtonBackgroundColor({ page: 1, row: 0, column: 2 }, '#FF0000');
// Companion endpoint used (example):
// /api/location/1/0/2/style?bgcolor=%23FF0000
```

Fluent example (chain multiple changes/actions in one line):

```typescript
await client
  .button({ page: 1, row: 0, column: 2 })
  .text('LIVE')
  .bgcolor('#FF0000')
  .color('#FFFFFF')
  .press()
  .apply();

// Companion endpoints involved (examples):
// POST /api/location/1/0/2/style   (body with text/bgcolor/color)
// POST /api/location/1/0/2/press   (queued action executed after style)
```

Notes:
- The fluent API batches style changes into a single `POST /api/location/<page>/<row>/<col>/style` body request when you call `.apply()`.
- Actions queued on the chain (like `.press()`, `.down()`, `.up()`) are executed sequentially after the style update.
- Both the legacy and fluent methods coexist; use whichever fits your needs. The fluent API is recommended when changing multiple fields or running an action immediately after styling.

Try it — minimal example

```typescript
import { StreamDeckClient } from './streamdeck';

const client = new StreamDeckClient({ baseUrl: 'http://127.0.0.1:8000' });
const pos = { page: 1, row: 0, column: 2 };

// Fluent: set text+colors and press the button
await client.button(pos).text('Ping').bgcolor('#112233').color('#FFFFFF').press().apply();

// Legacy: single-purpose call
await client.setButtonText(pos, 'Ping');
```

### Conditional chaining

The fluent API supports conditional chaining so you don't need to wrap calls in `if` statements.
Use `.when()` / `.unless()` for synchronous predicates, and `.whenAsync()` / `.unlessAsync()` for async checks.

Synchronous example:

```typescript
// Update only when this transition occurred
await client
  .button({ page: 1, row: 2, column: 1 })
  .when(() => sideSwapEnabled && !wasPrevSwapEnabled)
  .text('Side Swapped')
  .bgcolor(COLORS.SUCCESS)
  .apply();

await client
  .button({ page: 2, row: 1, column: 0 })
  .when(() => sideSwapEnabled && !wasPrevSwapEnabled)
  .text('Side Swapped')
  .bgcolor(COLORS.SUCCESS)
  .apply();
```

Parallel example with a precomputed boolean:

```typescript
const becameEnabled = sideSwapEnabled && !wasPrevSwapEnabled;
await Promise.all([
  localStreamDeckClient.button({ page:1,row:2,column:1 }).when(becameEnabled).text('Side Swapped').bgcolor(COLORS.SUCCESS).apply(),
  streamDeckClient.button({ page:2,row:1,column:0 }).when(becameEnabled).text('Side Swapped').bgcolor(COLORS.SUCCESS).apply()
]);
```

Async predicate example (useful for remote checks):

```typescript
await client
  .button(pos)
  .whenAsync(async () => await isFeatureEnabled())
  .text('Feature On')
  .apply();
```

Inline predicate usage with `animate()`

You can also pass a boolean or a predicate directly into `animate()` as the third argument. This is handy when the animation should only run under a short-lived condition and you prefer keeping it inline instead of calling `.when()` / `.whenAsync()`.

```typescript
// Sync predicate: only run when round === 9
await client.button(pos).animate('SUCCESS', 800, () => round === 9);

// Async predicate: await an external check
await client.button(pos).animate('SUCCESS', 800, async () => await isRoundActive());
```

### Animate from the chain

The fluent API includes a small `animate()` helper for quick flash/pulse effects. It accepts either a preset name (from `BUTTON_PRESETS`) or a `ButtonStyle`.

Single-run flash:

```typescript
await client.button(pos).animate('SUCCESS', 1000, { type: 'flash', intervals: 3 });
```

Looping pulse (returns a stop function):

```typescript
const stop = await client.button(pos).animate({ bgcolor: '#112233' }, 800, { type: 'flash', loop: true });
// later
stop();
```

Notes:
- `animate()` is convenient for single-button or user-triggered effects. For high-performance multi-button animations prefer the `Animator` which coalesces updates via `executeBatch()`.
- Conditional chaining works with `animate()` as well, e.g. `.when(...)` / `.whenAsync(...)` before `.animate()`.
 - Conditional chaining works with `animate()` as well in two ways:
   1) Use `.when()` / `.whenAsync()` before `.animate()` to set chain-level predicates.
   2) Pass a boolean or predicate directly as the third argument to `.animate()` to check the condition inline for that call. Inline predicates will be re-evaluated while looped animations run and will stop the animation when they become false.

### Custom Variables

```typescript
// Set custom variable
await client.setCustomVariable("current_scene", "Main Camera");

// Get custom variable
const value = await client.getCustomVariable("viewer_count");
```

## API Reference

### Core Classes

#### `StreamDeckClient`

Main client class for HTTP API interaction.

```typescript
const client = new StreamDeckClient({
  baseUrl: "http://127.0.0.1:8000",
  timeout: 5000,
  retries: 3,
});

// Check remote capabilities
const capabilities = StreamDeckClient.getRemoteCapabilities();
console.log("TCP available:", capabilities.tcp);
console.log("UDP available:", capabilities.udp);

// Create remote client (Node.js only)
const remote = await client.createRemoteClient('tcp');
```

#### `RemoteClient`

Remote control client for TCP/UDP communication (Node.js only).

```typescript
import { createRemoteClient } from "./streamdeck";

const remote = await createRemoteClient('tcp', 'localhost', 16759);
await remote.connect();

// Add event listener
remote.addEventListener((event) => {
  console.log('Remote event:', event.type, event.action);
});

// Check connection status
console.log('Connected:', remote.isConnected());
```

### Button Operations

| Method                          | HTTP | TCP/UDP | Description                |
| ------------------------------- | ---- | ------- | -------------------------- |
| `pressButton(position)`         | ✅   | ✅      | Press and release a button |
| `pressButtonDown(position)`     | ✅   | ✅      | Press button down (hold)   |
| `releaseButton(position)`       | ✅   | ✅      | Release button             |
| `rotateLeft(position)`          | ✅   | ✅      | Trigger left rotation      |
| `rotateRight(position)`         | ✅   | ✅      | Trigger right rotation     |
| `setButtonStep(position, step)` | ✅   | ✅      | Set encoder step           |

### Style Operations

| Method                                      | HTTP | TCP/UDP | Description              |
| ------------------------------------------- | ---- | ------- | ------------------------ |
| `updateButtonStyle(position, style)`        | ✅   | ✅      | Update button appearance |
| `setButtonText(position, text)`             | ✅   | ✅      | Set button text          |
| `setButtonBackgroundColor(position, color)` | ✅   | ✅      | Set background color     |
| `setButtonTextColor(position, color)`       | ✅   | ✅      | Set text color           |
| `setButtonTextSize(position, size)`         | ✅   | ❌      | Set text size            |

### Surface Operations

| Method                            | HTTP | TCP/UDP | Description              |
| --------------------------------- | ---- | ------- | ------------------------ |
| `setSurfacePage(surface, page)`   | ❌   | ✅      | Set surface to page      |
| `surfacePageUp(surface)`          | ❌   | ✅      | Page up on surface       |
| `surfacePageDown(surface)`        | ❌   | ✅      | Page down on surface     |
| `rescanSurfaces()`                | ✅   | ✅      | Rescan for USB surfaces  |

### Variable Operations

| Method                                | HTTP | TCP/UDP | Description         |
| ------------------------------------- | ---- | ------- | ------------------- |
| `setCustomVariable(name, value)`      | ✅   | ✅      | Set custom variable |
| `getCustomVariable(name)`             | ✅   | ❌      | Get custom variable |
| `getModuleVariable(connection, name)` | ✅   | ❌      | Get module variable |

## Environment Detection

```typescript
import { isRemoteAvailable, StreamDeckClient } from "./streamdeck";

// Check if remote control is available
if (isRemoteAvailable()) {
  console.log("Remote control available (Node.js)");
  const remote = await createRemoteClient('tcp');
} else {
  console.log("Browser environment - HTTP only");
}

// Alternative: Check via client
const capabilities = StreamDeckClient.getRemoteCapabilities();
console.log("Available protocols:", { 
  http: true, // Always available
  tcp: capabilities.tcp, 
  udp: capabilities.udp 
});
```

## Performance Considerations

### When to use HTTP vs TCP/UDP

**Use HTTP when:**
- Running in a browser
- Need complex operations (batch updates, animations)  
- Want to get data back (custom variables, module variables)
- Using the fluent API with conditions

**Use TCP when:**
- Running in Node.js
- Need reliable delivery of critical commands
- Want faster response times for button presses
- Need connection state management

**Use UDP when:**
- Running in Node.js
- Need maximum speed for frequent updates
- Can tolerate occasional message loss
- Sending status updates or non-critical styling

### Example: Optimal Protocol Selection

```typescript
// HTTP: Complex styling with animations
await client.button(pos)
  .text('Live')
  .bgcolor('#FF0000')
  .animate('SUCCESS', 1000)
  .apply();

// TCP: Critical button press
await remoteClient.pressButton(emergencyStopPosition);

// UDP: Frequent status updates
await udpClient.setButtonText(viewerCountPosition, `${viewers} viewers`);
```

## Utilities

### Colors

Pre-defined colors for consistent styling:

```typescript
import { COLORS } from "./streamdeck";

// Basic colors
COLORS.RED; // '#FF0000'
COLORS.GREEN; // '#00FF00'
COLORS.BLUE; // '#0000FF'

// Status colors
COLORS.SUCCESS; // '#10B981'
COLORS.WARNING; // '#F59E0B'
COLORS.ERROR; // '#EF4444'

// StreamDeck-friendly colors
COLORS.STREAMDECK_BLUE; // '#0F172A'
COLORS.STREAMDECK_RED; // '#991B1B'
```

### Button Presets

Ready-to-use button styles:

```typescript
import { BUTTON_PRESETS, createButtonStyle } from "./streamdeck";

// Use preset directly
await client.updateButtonStyleBody(position, BUTTON_PRESETS.SUCCESS);

// Customize preset
const customStyle = createButtonStyle("PRIMARY", { text: "Custom" });
await client.updateButtonStyleBody(position, customStyle);
```

### Text Utilities

```typescript
import { truncateText, formatMultiLineText, formatNumber } from "./streamdeck";

// Truncate long text
const short = truncateText("Very Long Button Text", 8); // 'Very Lo…'

// Format for multi-line display
const multiLine = formatMultiLineText("Long button text here", 6);

// Format numbers
const formatted = formatNumber(1500000); // '1M'
```

### Animations

```typescript
import { flashButton, animateCountdown } from "./streamdeck";

// Flash a button
await flashButton(client, position, originalStyle, COLORS.WARNING, 1000);

// Animate countdown
await animateCountdown(client, position, style, 10, 0, 1000);
```

## Pre-built Layouts

### Esports Scoreboard

```typescript
import { createEsportsScoreboard } from "./streamdeck";

await createEsportsScoreboard(client, 1, {
  leftTeam: { name: "Team A", score: 12 },
  rightTeam: { name: "Team B", score: 8 },
  round: 25,
  timer: "1:45",
  status: "live",
});
```

### Media Controls

```typescript
import { createMediaControls } from "./streamdeck";

await createMediaControls(client, 1, {
  isPlaying: true,
  isMuted: false,
  volume: 75,
  currentTrack: "Song Name",
});
```

### System Monitor

```typescript
import { createSystemMonitor } from "./streamdeck";

await createSystemMonitor(client, 1, {
  cpu: 45,
  memory: 60,
  gpu: 30,
  temperature: 65,
  network: { upload: 1024, download: 5120 },
});
```

## Error Handling

The client includes comprehensive error handling:

```typescript
import { StreamDeckError } from "./streamdeck";

try {
  await client.pressButton({ page: 1, row: 0, column: 0 });
} catch (error) {
  if (error instanceof StreamDeckError) {
    console.error("StreamDeck error:", error.message);
    console.error("Status code:", error.statusCode);
  }
}
```

## Event Handling

Listen to StreamDeck operations:

```typescript
const unsubscribe = client.addEventListener((event) => {
  console.log("StreamDeck event:", event.type, event.action);

  if (event.type === "button" && event.action === "press") {
    console.log("Button pressed:", event.position);
  }
});

// Clean up when done
unsubscribe();
```

## Batch Operations

Execute multiple operations efficiently:

```typescript
import { BatchOperation } from "./streamdeck";

const operations: BatchOperation[] = [
  { position: { page: 1, row: 0, column: 0 }, action: "press" },
  {
    position: { page: 1, row: 0, column: 1 },
    action: "style",
    data: { text: "Updated" },
  },
  { position: { page: 1, row: 0, column: 2 }, action: "press" },
];

await client.executeBatch(operations);
```

## Validation

Validate your data before sending:

```typescript
import { isValidPosition, isValidStyle } from "./streamdeck";

const position = { page: 1, row: 0, column: 0 };
const style = { text: "Test", bgcolor: "#FF0000" };

if (isValidPosition(position)) {
  const validation = isValidStyle(style);
  if (validation.valid) {
    await client.updateButtonStyle(position, style);
  } else {
    console.error("Style errors:", validation.errors);
  }
}
```

## Configuration

### Client Configuration

```typescript
const client = new StreamDeckClient({
  baseUrl: "http://127.0.0.1:8000", // Companion URL
  timeout: 5000, // Request timeout (ms)
  retries: 3, // Retry attempts
  defaultHeaders: {
    // Custom headers
    Authorization: "Bearer token",
  },
});
```

### Common Layouts

```typescript
import { LAYOUTS, getLayoutPositions } from "./streamdeck";

// Get all positions for StreamDeck XL
const positions = getLayoutPositions("STREAMDECK_XL", 1);

// Available layouts:
// - STREAMDECK_MINI: 2x3
// - STREAMDECK_ORIGINAL: 3x5
// - STREAMDECK_XL: 4x8
// - STREAMDECK_MK2: 3x5
// - STREAMDECK_PEDAL: 1x3
```

## Examples

### Simple Status Display

```typescript
async function updateStatus(isLive: boolean, viewers: number) {
  await client.updateButtonStyle(
    { page: 1, row: 0, column: 0 },
    {
      text: isLive ? "LIVE" : "OFF",
      bgcolor: isLive ? COLORS.ERROR : COLORS.GRAY,
      color: COLORS.WHITE,
      size: 16,
    }
  );

  await client.setButtonText(
    { page: 1, row: 0, column: 1 },
    `${formatNumber(viewers)} viewers`
  );
}
```

### Interactive Counter

```typescript
let count = 0;

async function updateCounter() {
  await client.updateButtonStyle(
    { page: 1, row: 1, column: 0 },
    {
      text: `Count\n${count}`,
      bgcolor: count > 0 ? COLORS.SUCCESS : COLORS.GRAY,
      color: COLORS.WHITE,
      size: 14,
    }
  );
}

// Simulate button press to increment
setInterval(async () => {
  count++;
  await updateCounter();
}, 5000);
```

## Compatibility

This module is compatible with:

- StreamDeck Companion 3.0.0+
- All StreamDeck device types
- **Browsers**: HTTP API only
- **Node.js 16+**: HTTP + TCP/UDP APIs
- TypeScript 4.0+

## License

MIT License - Feel free to use in any project.
