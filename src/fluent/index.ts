/**
 * Fluent API for StreamDeck Companion
 * 
 * Provides method chaining interfaces for button and system operations.
 * This module allows building complex operations with fluent syntax.
 * 
 * @example
 * ```typescript
 * // Button operations with chaining
 * await client.button(position)
 *   .text('Live Stream')
 *   .bgcolor('#FF0000')
 *   .color('#FFFFFF')
 *   .setCustomVar('status', 'live')
 *   .press()
 *   .apply();
 * 
 * // System operations with chaining  
 * await client.system()
 *   .setVar('scene', 'main')
 *   .setVars({ mode: 'live', quality: '1080p' })
 *   .rescanSurfaces()
 *   .apply();
 * ```
 */

export { ButtonChain } from './button-chain';
export { SystemChain } from './system-chain';
export type { 
  FluentClientInterface, 
  ButtonStyleOptions, 
  ConditionFunction, 
  AsyncConditionFunction 
} from './types';
