# StreamDeck Companion HTTP API Client

A comprehensive TypeScript module for interacting with StreamDeck Companion's HTTP API. This module is designed to work with any project and provides a clean, type-safe interface for controlling StreamDeck devices through Companion.

## Features

- ✅ **Full API Coverage** - All documented StreamDeck Companion HTTP endpoints
- ✅ **TypeScript Support** - Complete type definitions and IntelliSense
- ✅ **Event Handling** - Listen to button presses and style changes
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
} from "./path/to/streamdeck";
```

## Quick Start

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

Main client class for interacting with StreamDeck Companion.

```typescript
const client = new StreamDeckClient({
  baseUrl: "http://127.0.0.1:8000",
  timeout: 5000,
  retries: 3,
});
```

### Button Operations

| Method                          | Description                |
| ------------------------------- | -------------------------- |
| `pressButton(position)`         | Press and release a button |
| `pressButtonDown(position)`     | Press button down (hold)   |
| `releaseButton(position)`       | Release button             |
| `rotateLeft(position)`          | Trigger left rotation      |
| `rotateRight(position)`         | Trigger right rotation     |
| `setButtonStep(position, step)` | Set encoder step           |

### Style Operations

| Method                                      | Description              |
| ------------------------------------------- | ------------------------ |
| `updateButtonStyle(position, style)`        | Update button appearance |
| `setButtonText(position, text)`             | Set button text          |
| `setButtonBackgroundColor(position, color)` | Set background color     |
| `setButtonTextColor(position, color)`       | Set text color           |
| `setButtonTextSize(position, size)`         | Set text size            |

### Variable Operations

| Method                                | Description         |
| ------------------------------------- | ------------------- |
| `setCustomVariable(name, value)`      | Set custom variable |
| `getCustomVariable(name)`             | Get custom variable |
| `getModuleVariable(connection, name)` | Get module variable |

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
- Node.js 16+
- TypeScript 4.0+

## License

MIT License - Feel free to use in any project.
