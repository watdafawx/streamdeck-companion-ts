/**
 * Public module entry (re-exports)
 *
 * ## Summary
 * This file re-exports the public API surface of the library so consumers can
 * import from the package root. The library is now organized into logical modules
 * for better maintainability.
 */

// Core exports - main client and types
export { StreamDeckClient } from './core/streamdeck-client.js';
export type { RemoteCapabilities } from './core/streamdeck-client.js';

// Re-export everything from core module (types, utilities, presets)
export * from './core/index.js';

// Fluent API
export * from './fluent/index.js';

// Animation system
export * from './animations/index.js';

// Remote control (TCP/UDP)
export * from './remote/index.js';

// Factory functions for easy client creation
export function createStreamDeckClient(config: any): any {
  const { StreamDeckClient } = require('./core/streamdeck-client.js');
  return new StreamDeckClient(config);
}

export function createLocalStreamDeckClient(port: number = 8000): any {
  const { StreamDeckClient } = require('./core/streamdeck-client.js');
  return new StreamDeckClient({
    baseUrl: `http://127.0.0.1:${port}`,
    timeout: 5000,
    retries: 3
  });
}

export function createRemoteStreamDeckClient(host: string, port: number = 8000): any {
  const { StreamDeckClient } = require('./core/streamdeck-client.js');
  return new StreamDeckClient({
    baseUrl: `http://${host}:${port}`,
    timeout: 10000,
    retries: 2
  });
}

/**
 * Convenience factory for Animator
 */
export function createAnimator(client: any, fps: number = 15) {
  return client.getAnimator(fps);
}

/**
 * Create a direct protocol client for TCP/UDP control (Node.js only)
 */
export async function createDirectClient(
  protocol: 'tcp' | 'udp' = 'tcp',
  host: string = 'localhost',
  port: number = 16759
): Promise<any> {
  // Check if direct protocol is available
  const { StreamDeckClient } = await import('./core/streamdeck-client.js');
  const capabilities = StreamDeckClient.getRemoteCapabilities();
  if (!capabilities.available) {
    throw new Error('Direct protocol (TCP/UDP) is only available in Node.js environments');
  }
  
  try {
    const remoteModule = await import('./remote/remote-client.js');
    return new remoteModule.RemoteClient({
      protocol,
      host,
      port
    });
  } catch (error) {
    throw new Error(`Failed to create direct client: ${(error as Error).message}`);
  }
}

/**
 * Check if direct protocol capabilities are available in the current environment
 */
export function isDirectAvailable(): boolean {
  try {
    const { StreamDeckClient } = require('./core/streamdeck-client.js');
    return StreamDeckClient.getRemoteCapabilities().available;
  } catch {
    return false;
  }
}

// Backward compatibility aliases
export const createRemoteClient = createDirectClient;
export const isRemoteAvailable = isDirectAvailable;

// Version information
export const VERSION = '1.0.0';
export const COMPATIBLE_COMPANION_VERSION = '3.0.0+';

export const MODULE_INFO = {
  name: 'StreamDeck Companion HTTP API Client',
  version: VERSION,
  description: 'A comprehensive TypeScript client for StreamDeck Companion HTTP API with optional TCP/UDP support',
  author: 'StreamDeck Module',
  license: 'MIT',
  compatibleWith: COMPATIBLE_COMPANION_VERSION,
  features: [
    'Full HTTP API coverage',
    'TCP/UDP remote control (Node.js)',
    'TypeScript support',
    'Event handling',
    'Batch operations',
    'Color utilities',
    'Pre-built layouts',
    'Error handling',
    'Retry logic'
  ]
} as const;
