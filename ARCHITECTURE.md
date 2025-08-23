# Project Structure

The StreamDeck Companion Client has been refactored into a modular architecture for better maintainability and easier debugging. Here's the breakdown:

## Directory Structure

```
src/
├── index.ts                 # Main entry point - exports public API
├── core/                    # Core functionality
│   ├── index.ts            # Core module exports
│   ├── types.ts            # TypeScript type definitions
│   ├── utils.ts            # Utility functions and colors
│   ├── presets.ts          # Button style presets
│   ├── preview.ts          # Preview functionality
│   └── streamdeck-client.ts # Main refactored client class
├── http/                    # HTTP API operations
│   ├── index.ts            # HTTP module exports
│   ├── http-client.ts      # HTTP client with retry logic
│   ├── button-operations.ts # Button press/rotation operations
│   ├── button-styling.ts   # Button styling operations
│   ├── variable-operations.ts # Custom variable operations
│   ├── system-operations.ts # System operations (surface scan)
│   └── batch-operations.ts # Batch operation handling
├── cache/                   # Caching system
│   ├── index.ts            # Cache module exports
│   └── button-state-cache.ts # Button state caching logic
├── animations/              # Animation system
│   ├── index.ts            # Animation module exports
│   ├── animations.ts       # Animation helper functions
│   └── animator.ts         # Advanced animation engine
├── remote/                  # TCP/UDP remote control
│   ├── index.ts            # Remote module exports
│   └── remote-client.ts    # TCP/UDP protocol client
└── fluent/                  # Fluent API (TODO: extract from old client)
    └── (empty - to be implemented)
```

## Module Responsibilities

### Core Module (`src/core/`)
- **types.ts**: All TypeScript interfaces and types
- **utils.ts**: Color definitions, text formatting, utility functions
- **presets.ts**: Pre-defined button styles and layouts
- **preview.ts**: Preview functionality for testing
- **streamdeck-client.ts**: Main client class that coordinates all operations

### HTTP Module (`src/http/`)
- **http-client.ts**: Low-level HTTP communication with retry logic
- **button-operations.ts**: Button press, rotation, and step operations
- **button-styling.ts**: Button text, color, and size styling
- **variable-operations.ts**: Custom and module variable management
- **system-operations.ts**: System-wide operations like surface scanning
- **batch-operations.ts**: Executing multiple operations efficiently

### Cache Module (`src/cache/`)
- **button-state-cache.ts**: Button state caching to prevent duplicate requests

### Animations Module (`src/animations/`)
- **animations.ts**: Simple animation helper functions
- **animator.ts**: Advanced animation engine with batch updates

### Remote Module (`src/remote/`)
- **remote-client.ts**: TCP/UDP protocol client for direct communication

## Benefits of New Structure

### 1. **Better Maintainability**
- Each module has a single responsibility
- Smaller files are easier to understand and modify
- Clear separation of concerns

### 2. **Easier Debugging**
- Issues can be isolated to specific modules
- Cleaner stack traces
- Focused testing per module

### 3. **Better Testing**
- Each module can be tested independently
- Mock dependencies more easily
- More focused unit tests

### 4. **Improved Development Experience**
- Faster TypeScript compilation
- Better IDE navigation
- Clearer import statements
- Easier to add new features

### 5. **Future Extensibility**
- Easy to add new operation types
- Modular architecture supports plugins
- Clear extension points

## Usage Examples

### Basic Client Usage (Unchanged)
```typescript
import { StreamDeckClient } from 'streamdeck-companion-client';

const client = new StreamDeckClient({
  baseUrl: 'http://localhost:8000'
});

await client.pressButton({ page: 1, row: 0, column: 0 });
```

### Using Specific Modules (Advanced)
```typescript
import { HttpClient } from 'streamdeck-companion-client/http';
import { ButtonOperations } from 'streamdeck-companion-client/http';

// Create HTTP client
const httpClient = new HttpClient({
  baseUrl: 'http://localhost:8000',
  timeout: 5000,
  retries: 3,
  defaultHeaders: {}
});

// Create button operations
const buttonOps = new ButtonOperations(httpClient, (event) => {
  console.log('Button event:', event);
});

await buttonOps.pressButton({ page: 1, row: 0, column: 0 });
```

## Migration Notes

### From Old Structure
The old monolithic `client.ts` (1779 lines) has been broken down into:
- **streamdeck-client.ts** (370 lines) - main client coordination
- **http-client.ts** (95 lines) - HTTP communication
- **button-operations.ts** (86 lines) - button actions
- **button-styling.ts** (120 lines) - button styling
- **variable-operations.ts** (40 lines) - variable operations
- **system-operations.ts** (20 lines) - system operations
- **batch-operations.ts** (35 lines) - batch operations
- **button-state-cache.ts** (90 lines) - caching logic

### API Compatibility
- All public APIs remain the same
- Factory functions work as before
- TypeScript types are unchanged
- Import paths are the same for consumers

### TODO: Fluent API
The fluent API (`ButtonChain` and `SystemChain`) still needs to be extracted from the old client and placed in the `fluent/` module. This is a large task but will complete the modularization.

## Development Workflow

### Adding New Features
1. Identify the appropriate module (or create a new one)
2. Add types to `core/types.ts` if needed
3. Implement functionality in the module
4. Export from module's `index.ts`
5. Add to main client if needed
6. Add tests
7. Update documentation

### Building
```bash
bun run build      # Build all formats
bun run typecheck  # TypeScript compilation check
bun test          # Run tests
```

### File Size Comparison
- **Before**: Single file with 1779 lines
- **After**: 14 focused files, largest is 370 lines
- **Average**: ~80 lines per file
- **Total**: Same functionality, better organized

This modular structure makes the codebase much more maintainable and easier to work with for future development and debugging.
