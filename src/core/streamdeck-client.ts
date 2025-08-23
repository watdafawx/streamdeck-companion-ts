/**
 * StreamDeck Companion HTTP API Client (Refactored)
 *
 * ## Overview
 * A full-featured TypeScript client for the StreamDeck Companion HTTP API.
 * This is the main client class that coordinates all the various operations.
 *
 * ## Quick example
 * ```ts
 * import { StreamDeckClient } from './streamdeck-client';
 * const client = new StreamDeckClient({ baseUrl: 'http://localhost:8000' });
 * await client.pressButton({ page: 0, row: 0, column: 0 });
 * ```
 */

import type { 
  StreamDeckConfig, 
  ButtonPosition, 
  ButtonStyle, 
  StreamDeckEvent,
  BatchOperation,
  ConnectionStatus
} from '../core/types.js';
import { StreamDeckError } from '../core/types.js';

import { HttpClient, type HttpClientConfig } from '../http/http-client.js';
import { ButtonOperations } from '../http/button-operations.js';
import { ButtonStyling } from '../http/button-styling.js';
import { VariableOperations } from '../http/variable-operations.js';
import { SystemOperations } from '../http/system-operations.js';
import { BatchOperations } from '../http/batch-operations.js';

import { ButtonStateCache } from '../cache/button-state-cache.js';

// Fluent API imports
import type { FluentClientInterface, ButtonStyleOptions } from '../fluent/types.js';
import { ButtonChain } from '../fluent/button-chain.js';
import { SystemChain } from '../fluent/system-chain.js';

// Remote capabilities type
export interface RemoteCapabilities {
  tcp?: boolean;
  udp?: boolean;
  available: boolean;
}

export class StreamDeckClient implements FluentClientInterface {
  // Core components
  private httpClient: HttpClient;
  private cache: ButtonStateCache;
  
  // Operation modules
  private buttonOps: ButtonOperations;
  private buttonStyling: ButtonStyling;
  private variableOps: VariableOperations;
  private systemOps: SystemOperations;
  private batchOps: BatchOperations;
  
  // Event handling
  private eventListeners: Set<(event: StreamDeckEvent) => void> = new Set();
  
  // External clients
  private _remoteClient?: any;
  private _animator?: any;
  
  // Settings
  private nonBlockingAnimations: boolean = true;

  constructor(config: StreamDeckConfig) {
    // Initialize HTTP client
    const httpConfig: HttpClientConfig = {
      baseUrl: config.baseUrl,
      timeout: config.timeout || 5000,
      retries: config.retries || 3,
      defaultHeaders: {
        'Content-Type': 'application/json',
        'User-Agent': 'StreamDeck-Client/1.0',
        ...config.defaultHeaders
      }
    };
    this.httpClient = new HttpClient(httpConfig);
    
    // Initialize cache
    this.cache = new ButtonStateCache();
    this.cache.setCachingEnabled(config.enableCaching !== false);
    
    // Initialize settings
    this.nonBlockingAnimations = config.nonBlockingAnimations !== false;
    
    // Initialize operation modules
    this.buttonOps = new ButtonOperations(this.httpClient, this.emitEvent.bind(this));
    this.buttonStyling = new ButtonStyling(this.httpClient, this.cache, this.emitEvent.bind(this));
    this.variableOps = new VariableOperations(this.httpClient, this.emitEvent.bind(this));
    this.systemOps = new SystemOperations(this.httpClient, this.emitEvent.bind(this));
    this.batchOps = new BatchOperations(this.buttonOps, this.buttonStyling);
  }

  // =============================================================================
  // EVENT HANDLING
  // =============================================================================

  /**
   * Emit event to listeners
   */
  private emitEvent(event: StreamDeckEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in StreamDeck event listener:', error);
      }
    });
  }

  /**
   * Add event listener for StreamDeck operations
   */
  addEventListener(listener: (event: StreamDeckEvent) => void): () => void {
    this.eventListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  /**
   * Remove all event listeners
   */
  removeAllEventListeners(): void {
    this.eventListeners.clear();
  }

  // =============================================================================
  // BUTTON ACTIONS (Delegated to ButtonOperations)
  // =============================================================================

  async pressButton(position: ButtonPosition): Promise<void> {
    return this.buttonOps.pressButton(position);
  }

  async pressButtonDown(position: ButtonPosition): Promise<void> {
    return this.buttonOps.pressButtonDown(position);
  }

  async releaseButton(position: ButtonPosition): Promise<void> {
    return this.buttonOps.releaseButton(position);
  }

  async rotateLeft(position: ButtonPosition): Promise<void> {
    return this.buttonOps.rotateLeft(position);
  }

  async rotateRight(position: ButtonPosition): Promise<void> {
    return this.buttonOps.rotateRight(position);
  }

  async setButtonStep(position: ButtonPosition, step: number): Promise<void> {
    return this.buttonOps.setButtonStep(position, step);
  }

  // =============================================================================
  // BUTTON STYLING (Delegated to ButtonStyling)
  // =============================================================================

  async updateButtonStyle(position: ButtonPosition, style: ButtonStyle): Promise<void> {
    return this.buttonStyling.updateButtonStyle(position, style);
  }

  async updateButtonStyleBody(position: ButtonPosition, style: ButtonStyle): Promise<void> {
    return this.buttonStyling.updateButtonStyleBody(position, style);
  }

  async setButtonBackgroundColor(position: ButtonPosition, color: string): Promise<void> {
    return this.buttonStyling.setButtonBackgroundColor(position, color);
  }

  async setButtonTextColor(position: ButtonPosition, color: string): Promise<void> {
    return this.buttonStyling.setButtonTextColor(position, color);
  }

  async setButtonText(position: ButtonPosition, text: string): Promise<void> {
    return this.buttonStyling.setButtonText(position, text);
  }

  async setButtonTextSize(position: ButtonPosition, size: number): Promise<void> {
    return this.buttonStyling.setButtonTextSize(position, size);
  }

  // =============================================================================
  // FLUENT API INTERFACE COMPATIBILITY
  // =============================================================================
  
  /**
   * Alias for setButtonBackgroundColor to match FluentClientInterface.
   */
  async setButtonColor(position: ButtonPosition, color: string): Promise<void> {
    return this.setButtonBackgroundColor(position, color);
  }

  /**
   * Set button style using options object to match FluentClientInterface.
   */
  async setButtonStyle(position: ButtonPosition, options: ButtonStyleOptions): Promise<void> {
    // Apply each style option individually
    const promises: Promise<void>[] = [];
    
    if (options.text !== undefined) {
      promises.push(this.setButtonText(position, options.text));
    }
    if (options.bgcolor !== undefined) {
      promises.push(this.setButtonBackgroundColor(position, options.bgcolor));
    }
    if (options.color !== undefined) {
      promises.push(this.setButtonTextColor(position, options.color));
    }
    if (options.size !== undefined) {
      promises.push(this.setButtonTextSize(position, options.size));
    }
    
    await Promise.all(promises);
  }

  /**
   * Rotate button (for rotary encoders) to match FluentClientInterface.
   */
  async rotateButton(position: ButtonPosition, direction: 'left' | 'right' = 'right'): Promise<void> {
    if (direction === 'left') {
      return this.buttonOps.rotateLeft(position);
    } else {
      return this.buttonOps.rotateRight(position);
    }
  }

  /**
   * Set a regular variable to match FluentClientInterface.
   */
  async setVariable(name: string, value: string): Promise<void> {
    // For now, delegate to custom variables since that's what we have implemented
    return this.setCustomVariable(name, value);
  }

  /**
   * Set multiple variables to match FluentClientInterface.
   */
  async setVariables(variables: Record<string, string>): Promise<void> {
    // Execute all variable sets in parallel
    await Promise.all(
      Object.entries(variables).map(([name, value]) => 
        this.setVariable(name, value)
      )
    );
  }

  // =============================================================================
  // CACHE MANAGEMENT (Delegated to ButtonStateCache)
  // =============================================================================

  clearButtonCache(position: ButtonPosition): void {
    this.cache.clearButtonCache(position);
  }

  clearAllCache(): void {
    this.cache.clearAllCache();
  }

  setCachingEnabled(enabled: boolean): void {
    this.cache.setCachingEnabled(enabled);
  }

  isCachingEnabled(): boolean {
    return this.cache.isCachingEnabled();
  }

  getButtonState(position: ButtonPosition): ButtonStyle {
    return this.cache.getButtonState(position);
  }

  setButtonState(position: ButtonPosition, state: ButtonStyle): void {
    this.cache.setButtonState(position, state);
  }

  // =============================================================================
  // CUSTOM VARIABLES (Delegated to VariableOperations)
  // =============================================================================

  async setCustomVariable(name: string, value: string): Promise<void> {
    return this.variableOps.setCustomVariable(name, value);
  }

  async setCustomVariableBody(name: string, value: string): Promise<void> {
    return this.variableOps.setCustomVariableBody(name, value);
  }

  async getCustomVariable(name: string): Promise<string> {
    return this.variableOps.getCustomVariable(name);
  }

  async getModuleVariable(connectionLabel: string, name: string): Promise<string> {
    return this.variableOps.getModuleVariable(connectionLabel, name);
  }

  // =============================================================================
  // SYSTEM OPERATIONS (Delegated to SystemOperations)
  // =============================================================================

  async rescanSurfaces(): Promise<void> {
    return this.systemOps.rescanSurfaces();
  }

  // =============================================================================
  // BATCH OPERATIONS (Delegated to BatchOperations)
  // =============================================================================

  async executeBatch(operations: BatchOperation[]): Promise<void> {
    return this.batchOps.executeBatch(operations);
  }

  // =============================================================================
  // ANIMATION SETTINGS
  // =============================================================================

  isNonBlockingAnimationsEnabled(): boolean {
    return this.nonBlockingAnimations;
  }

  setNonBlockingAnimationsEnabled(enabled: boolean): void {
    this.nonBlockingAnimations = enabled;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Test connection to StreamDeck Companion
   */
  async testConnection(): Promise<ConnectionStatus> {
    try {
      const startTime = Date.now();
      
      // Try to rescan surfaces as a simple test
      await this.rescanSurfaces();
      
      return {
        connected: true,
        lastPing: Date.now() - startTime
      };
    } catch (error) {
      return {
        connected: false
      };
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<StreamDeckConfig> {
    const httpConfig = this.httpClient.getConfig();
    return {
      baseUrl: httpConfig.baseUrl,
      timeout: httpConfig.timeout,
      retries: httpConfig.retries,
      defaultHeaders: { ...httpConfig.defaultHeaders },
      enableCaching: this.cache.isCachingEnabled(),
      nonBlockingAnimations: this.nonBlockingAnimations
    };
  }

  // =============================================================================
  // STATIC UTILITIES
  // =============================================================================

  /**
   * Create button position helper
   */
  static createPosition(page: number, row: number, column: number): ButtonPosition {
    return { page, row, column };
  }

  /**
   * Create button style helper
   */
  static createStyle(options: Partial<ButtonStyle>): ButtonStyle {
    return options;
  }

  /**
   * Validate hex color format
   */
  static isValidHexColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color);
  }

  /**
   * Convert RGB to hex color
   */
  static rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  /**
   * Parse hex color to RGB
   */
  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // =============================================================================
  // FLUENT API
  // =============================================================================

  /**
   * Start a fluent builder for operations against a single button position.
   * Example: await client.button(pos).text('Hi').bgcolor('#FF0000').color('#FFFFFF').apply();
   */
  button(position: ButtonPosition): ButtonChain {
    return new ButtonChain(this, position);
  }

  /**
   * Start a fluent builder for system-wide operations.
   * Example: await client.system().setVar('status', 'live').rescanSurfaces().apply();
   */
  system(): SystemChain {
    return new SystemChain(this);
  }

  // =============================================================================
  // ANIMATION & REMOTE SUPPORT (TODO: Extract to separate modules)
  // =============================================================================

  /**
   * Lazy-create and return an Animator tied to this client.
   */
  async getAnimator(fps: number = 15): Promise<any> {
    if (this._animator) return this._animator;
    const mod = await import('../animations/animator.js');
    this._animator = new mod.Animator(this, fps);
    return this._animator;
  }

  /**
   * Get remote control capabilities for this environment
   */
  static getRemoteCapabilities(): RemoteCapabilities {
    try {
      // Check if we're in Node.js environment
      const isNode = typeof window === 'undefined' && typeof process !== 'undefined' && Boolean(process?.versions?.node);
      
      return {
        tcp: isNode,
        udp: isNode,
        available: isNode
      };
    } catch {
      return {
        tcp: false,
        udp: false,
        available: false
      };
    }
  }

  /**
   * Create a direct protocol client for TCP/UDP control (Node.js only)
   */
  async createDirectClient(
    protocol: 'tcp' | 'udp' = 'tcp',
    host: string = 'localhost',
    port: number = 16759
  ): Promise<any> {
    const capabilities = StreamDeckClient.getRemoteCapabilities();
    
    if (!capabilities.available) {
      throw new StreamDeckError(
        'Direct protocol (TCP/UDP) is only available in Node.js environments',
        'DIRECT_NOT_AVAILABLE'
      );
    }

    if (this._remoteClient) {
      return this._remoteClient;
    }

    try {
      const remoteModule = await import('../remote/remote-client.js');
      this._remoteClient = new remoteModule.RemoteClient({
        protocol,
        host,
        port,
        timeout: this.getConfig().timeout,
        reconnectAttempts: this.getConfig().retries
      });

      return this._remoteClient;
    } catch (error) {
      throw new StreamDeckError(
        'Failed to create direct client',
        'DIRECT_CLIENT_FAILED',
        undefined,
        error
      );
    }
  }

  /**
   * Get the current direct client instance (if any)
   */
  getDirectClient(): any | null {
    return this._remoteClient || null;
  }

  // Backward compatibility aliases
  createRemoteClient = this.createDirectClient;
  getRemoteClient = this.getDirectClient;
}
