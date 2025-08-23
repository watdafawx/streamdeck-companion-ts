# Contributing to StreamDeck Companion Client

Thank you for your interest in contributing to the StreamDeck Companion TypeScript Client! This document provides guidelines for contributing to the project.

## Development Setup

1. **Prerequisites**
   - Node.js 16+ or Bun
   - StreamDeck Companion running locally for testing
   - TypeScript knowledge

2. **Installation**
   ```bash
   git clone <repository-url>
   cd streamdeck-companion-client
   bun install
   ```

3. **Development Commands**
   ```bash
   # Type checking
   bun run typecheck
   
   # Build the library
   bun run build
   
   # Run examples
   bun run example
   
   # Development mode
   bun run dev
   ```

## Project Structure

```
src/
├── index.ts          # Main entry point
├── client.ts         # HTTP API client
├── remote.ts         # TCP/UDP remote control
├── types.ts          # TypeScript type definitions
├── utils.ts          # Utility functions and colors
├── animations.ts     # Animation helpers
├── animator.ts       # Advanced animation engine
├── presets.ts        # Button style presets
└── preview.ts        # Preview functionality

examples/
├── basic-usage.ts    # Basic usage examples
└── advanced-features.ts  # Advanced feature demos

dist/                 # Built files (generated)
```

## Code Style

- Use TypeScript with strict type checking
- Follow existing code formatting
- Add JSDoc comments for public APIs
- Use meaningful variable and function names
- Keep functions focused and single-purpose

## Testing

- Test with actual StreamDeck Companion when possible
- Verify both HTTP and TCP/UDP protocols work
- Test in both Node.js and browser environments
- Check TypeScript compilation with `bun run typecheck`

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add or update tests if needed
5. Update documentation if needed
6. Ensure TypeScript compiles without errors
7. Test your changes with StreamDeck Companion
8. Commit your changes (`git commit -m 'Add amazing feature'`)
9. Push to the branch (`git push origin feature/amazing-feature`)
10. Open a Pull Request

## Adding New Features

When adding new features:

1. **HTTP API Features**: Add to `client.ts` and update types in `types.ts`
2. **Remote Protocol Features**: Add to `remote.ts` 
3. **Utilities**: Add to `utils.ts` for colors, formatting, etc.
4. **Animations**: Add to `animations.ts` or `animator.ts`
5. **Examples**: Add examples to the `examples/` directory

## Bug Reports

When reporting bugs, please include:

- StreamDeck Companion version
- Node.js/Bun version
- Operating system
- Code snippet that reproduces the issue
- Expected vs actual behavior
- Any error messages

## Feature Requests

For feature requests:

- Check if the feature exists in StreamDeck Companion's API
- Explain the use case and benefit
- Provide examples of how it would be used
- Consider backwards compatibility

## Release Process

Releases follow semantic versioning:

- **Patch** (1.0.1): Bug fixes, documentation updates
- **Minor** (1.1.0): New features, backwards compatible
- **Major** (2.0.0): Breaking changes

## Questions?

Feel free to open an issue for questions about:
- How to use the library
- Development setup
- Contributing guidelines
- Feature ideas

Thank you for contributing! 🚀
