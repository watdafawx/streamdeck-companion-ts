/**
 * Core Module
 * 
 * Re-exports all core functionality including types, utilities, presets, and the main client.
 */

export * from './types.js';
export * from './utils.js';
export * from './presets.js';
export { createPreviewBridge } from './preview.js';
export { StreamDeckClient } from './streamdeck-client.js';
export type { RemoteCapabilities } from './streamdeck-client.js';
