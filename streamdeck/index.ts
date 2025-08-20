/**
 * StreamDeck Companion Module
 * 
 * A comprehensive TypeScript module for interacting with StreamDeck Companion's HTTP API
 * Designed to work with any project, not just this specific codebase
 * 
 * @author StreamDeck Module
 * @version 1.0.0
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

// Version information
export const VERSION = '1.0.0';
export const COMPATIBLE_COMPANION_VERSION = '3.0.0+';

// Module metadata
export const MODULE_INFO = {
  name: 'StreamDeck Companion HTTP API Client',
  version: VERSION,
  description: 'A comprehensive TypeScript client for StreamDeck Companion HTTP API',
  author: 'StreamDeck Module',
  license: 'MIT',
  compatibleWith: COMPATIBLE_COMPANION_VERSION,
  features: [
    'Full HTTP API coverage',
    'TypeScript support',
    'Event handling',
    'Batch operations',
    'Color utilities',
    'Pre-built layouts',
    'Error handling',
    'Retry logic'
  ]
} as const;
