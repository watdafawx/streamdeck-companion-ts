/**
 * Public module entry (re-exports)
 *
 * ## Summary
 * This file re-exports the public API surface of the library so consumers can
 * import from the package root. Keep this file small and focused — it should
 * only provide friendly factories and re-exports.
 */

// Core exports
import { StreamDeckClient } from './client';
import { Animator } from './animator';
import type { StreamDeckConfig } from './types';

export { StreamDeckClient } from './client';
export * from './types';

// Utilities and helpers
export * from './utils';
export * from './presets';

// Direct protocol exports (Node.js only)
export type { RemoteCapabilities } from './client';

// Re-export commonly used items for convenience
export {
  type ButtonPosition,
  type ButtonStyle,
  type StreamDeckConfig,
  type StreamDeckEvent,
  StreamDeckError
} from './types';

export {
  COLORS,
  BUTTON_PRESETS,
  LAYOUTS,
  createButtonStyle,
  getContrastingTextColor,
  formatMultiLineText,
  truncateText
} from './utils';

export { Animator } from './animator';
export * from './animations';
export { createPreviewBridge } from './preview';

// Factory function for easy client creation
export function createStreamDeckClient(config: StreamDeckConfig): StreamDeckClient {
  return new StreamDeckClient(config);
}

// Quick setup functions
export function createLocalStreamDeckClient(port: number = 8000): StreamDeckClient {
  return new StreamDeckClient({
    baseUrl: `http://127.0.0.1:${port}`,
    timeout: 5000,
    retries: 3
  });
}

export function createRemoteStreamDeckClient(host: string, port: number = 8000): StreamDeckClient {
  return new StreamDeckClient({
    baseUrl: `http://${host}:${port}`,
    timeout: 10000,
    retries: 2
  });
}

/**
 * Convenience factory for Animator
 */
export function createAnimator(client: StreamDeckClient, fps: number = 15) {
  return new Animator(client, fps);
}

/**
 * Create a direct protocol client for TCP/UDP control (Node.js only)
 * 
 * This creates a client that connects directly to Companion's TCP/UDP protocol
 * for faster response times compared to HTTP. Works locally or over network.
 * 
 * @param protocol - Either 'tcp' or 'udp'
 * @param host - Host to connect to (default: 'localhost')  
 * @param port - Port to connect to (default: 16759)
 * 
 * @example
 * ```ts
 * // TCP example (local)
 * const direct = await createDirectClient('tcp');
 * await direct.connect();
 * await direct.pressButton({ page: 1, row: 2, column: 3 });
 * 
 * // UDP example (over network)
 * const direct = await createDirectClient('udp', '192.168.1.100');
 * await direct.connect();
 * await direct.setSurfacePage('emulator', 5);
 * ```
 */
export async function createDirectClient(
  protocol: 'tcp' | 'udp' = 'tcp',
  host: string = 'localhost',
  port: number = 16759
): Promise<any> {
  // Check if direct protocol is available
  const capabilities = StreamDeckClient.getRemoteCapabilities();
  if (!capabilities.available) {
    throw new Error('Direct protocol (TCP/UDP) is only available in Node.js environments');
  }
  
  try {
    const remoteModule = await import('./remote');
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
  return StreamDeckClient.getRemoteCapabilities().available;
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
