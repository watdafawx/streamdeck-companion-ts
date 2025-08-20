/**
 * StreamDeck Companion HTTP API Client
 *
 * ## Overview
 * A full-featured TypeScript client for the StreamDeck Companion HTTP API.
 * Use this class to programmatically control buttons, styles, variables and
 * to build fluent/chained UI operations for a Stream Deck surface.
 *
 * ## Quick example
 * ```ts
 * import { StreamDeckClient } from './streamdeck/client';
 * const client = new StreamDeckClient({ baseUrl: 'http://localhost:8000' });
 * await client.pressButton(StreamDeckClient.createPosition(0, 0, 0));
 * ```
 *
 * ## Notes
 * - Hovers in VS Code render the markdown above (headings, code blocks, lists).
 * - Add more `@example`, `@remarks` and `@see` tags to improve discoverability.
 */

import type {
  ButtonPosition,
  ButtonStyle,
  ButtonAction,
  CustomVariable,
  ModuleVariable,
  StreamDeckConfig,
  ConnectionStatus,
  BatchOperation,
  StreamDeckEvent,
  ApiResponse
} from './types';
import { StreamDeckError } from './types';

// Remote capabilities type
export interface RemoteCapabilities {
  tcp?: boolean;
  udp?: boolean;
  available: boolean;
}

export class StreamDeckClient {
  private baseUrl: string;
  private timeout: number;
  private retries: number;
  private defaultHeaders: Record<string, string>;
  private eventListeners: Set<(event: StreamDeckEvent) => void> = new Set();
  private _remoteClient?: any;
  private _animator?: any;
  private buttonStateCache: Map<string, ButtonStyle> = new Map();
  private cachingEnabled: boolean = true;
  private nonBlockingAnimations: boolean = true;

  constructor(config: StreamDeckConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout || 5000;
    this.retries = config.retries || 3;
    this.cachingEnabled = config.enableCaching !== false; // Default to true
    this.nonBlockingAnimations = config.nonBlockingAnimations !== false; // Default to true
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'StreamDeck-Client/1.0',
      ...config.defaultHeaders
    };
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest(
    method: 'GET' | 'POST',
    path: string,
    body?: any,
    queryParams?: Record<string, string>
  ): Promise<any> {
    const url = new URL(path, this.baseUrl);
    
    // Add query parameters
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url.toString(), {
          method,
          headers: this.defaultHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Clone response to read body multiple times if needed
        const responseClone = response.clone();

        if (!response.ok) {
          const errorText = await responseClone.text().catch(() => null);
          throw new StreamDeckError(
            `HTTP ${response.status}: ${response.statusText}`,
            'HTTP_ERROR',
            response.status,
            errorText
          );
        }

        // Try to parse JSON response, but don't fail if it's not JSON
        try {
          return await response.json();
        } catch {
          // Use the cloned response for text parsing
          return await responseClone.text();
        }

      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.retries) {
          break;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }

    throw new StreamDeckError(
      `Failed after ${this.retries} attempts: ${lastError?.message}`,
      'REQUEST_FAILED',
      undefined,
      lastError
    );
  }

  /**
   * Generate a unique key for a button position for caching
   */
  private getButtonKey(position: ButtonPosition): string {
    return `${position.page}:${position.row}:${position.column}`;
  }

  /**
   * Get cached button state, or return empty state if not cached
   */
  private getCachedButtonState(position: ButtonPosition): ButtonStyle {
    const key = this.getButtonKey(position);
    return this.buttonStateCache.get(key) || {};
  }

  /**
   * Update cached button state with new style properties
   */
  private updateCachedButtonState(position: ButtonPosition, style: Partial<ButtonStyle>): void {
    // Only update cache if caching is enabled
    if (!this.cachingEnabled) {
      return;
    }

    const key = this.getButtonKey(position);
    const currentState = this.getCachedButtonState(position);
    const newState = { ...currentState, ...style };
    this.buttonStateCache.set(key, newState);
  }

  /**
   * Check if the proposed style changes would actually change the button state
   */
  private hasStyleChanges(position: ButtonPosition, style: Partial<ButtonStyle>): boolean {
    // If caching is disabled, always consider there are changes
    if (!this.cachingEnabled) {
      return true;
    }

    const currentState = this.getCachedButtonState(position);
    
    for (const [key, value] of Object.entries(style)) {
      if (currentState[key as keyof ButtonStyle] !== value) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Clear cached state for a specific button (useful for manual cache invalidation)
   */
  clearButtonCache(position: ButtonPosition): void {
    const key = this.getButtonKey(position);
    this.buttonStateCache.delete(key);
  }

  /**
   * Clear all cached button states
   */
  clearAllCache(): void {
    this.buttonStateCache.clear();
  }

  /**
   * Enable or disable button state caching
   */
  setCachingEnabled(enabled: boolean): void {
    this.cachingEnabled = enabled;
    if (!enabled) {
      this.clearAllCache(); // Clear cache when disabling
    }
  }

  /**
   * Check if caching is currently enabled
   */
  isCachingEnabled(): boolean {
    return this.cachingEnabled;
  }

  /**
   * Check if non-blocking animations are enabled
   */
  isNonBlockingAnimationsEnabled(): boolean {
    return this.nonBlockingAnimations;
  }

  /**
   * Enable or disable non-blocking animations
   */
  setNonBlockingAnimationsEnabled(enabled: boolean): void {
    this.nonBlockingAnimations = enabled;
  }

  /**
   * Get the current cached state for a button (for debugging/inspection)
   */
  getButtonState(position: ButtonPosition): ButtonStyle {
    return { ...this.getCachedButtonState(position) };
  }

  /**
   * Manually set the cached state for a button (use with caution)
   * This can be useful when you know the current state of a button from external sources
   */
  setButtonState(position: ButtonPosition, state: ButtonStyle): void {
    if (this.cachingEnabled) {
      const key = this.getButtonKey(position);
      this.buttonStateCache.set(key, { ...state });
    }
  }

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

  // =============================================================================
  // BUTTON ACTIONS
  // =============================================================================

  /**
   * Press and release a button (run both down and up actions).
   *
   * ## Summary
   * Presses the specified button position and immediately releases it.
   *
   * ## Parameters
   * @param position - Button coordinates: { page, row, column }.
   *
   * ## Example
   * ```ts
   * const client = new StreamDeckClient({ baseUrl: 'http://localhost:8000' });
   * await client.pressButton(StreamDeckClient.createPosition(0, 0, 0));
   * ```
   *
   * ## Notes
   * - Emits a `button` event with `action: 'press'` after the request succeeds.
   * - Maps to HTTP endpoint: `/api/location/{page}/{row}/{column}/press`.
   *
   * @returns Promise<void>
   */
  async pressButton(position: ButtonPosition): Promise<void> {
    const path = `/api/location/${position.page}/${position.row}/${position.column}/press`;
    await this.makeRequest('POST', path);
    
    this.emitEvent({
      type: 'button',
      action: 'press',
      position,
      timestamp: Date.now()
    });
  }

  /**
   * Press the button (run down actions and hold)
  *
  * @example
  * /api/location/0/0/0/down
   */
  async pressButtonDown(position: ButtonPosition): Promise<void> {
    const path = `/api/location/${position.page}/${position.row}/${position.column}/down`;
    await this.makeRequest('POST', path);
    
    this.emitEvent({
      type: 'button',
      action: 'down',
      position,
      timestamp: Date.now()
    });
  }

  /**
   * Release the button (run up actions)
  *
  * @example
  * /api/location/0/0/0/up
   */
  async releaseButton(position: ButtonPosition): Promise<void> {
    const path = `/api/location/${position.page}/${position.row}/${position.column}/up`;
    await this.makeRequest('POST', path);
    
    this.emitEvent({
      type: 'button',
      action: 'up',
      position,
      timestamp: Date.now()
    });
  }

  /**
   * Trigger a left rotation of the button/encoder
  *
  * @example
  * /api/location/0/0/0/rotate-left
   */
  async rotateLeft(position: ButtonPosition): Promise<void> {
    const path = `/api/location/${position.page}/${position.row}/${position.column}/rotate-left`;
    await this.makeRequest('POST', path);
    
    this.emitEvent({
      type: 'button',
      action: 'rotate-left',
      position,
      timestamp: Date.now()
    });
  }

  /**
   * Trigger a right rotation of the button/encoder
  *
  * @example
  * /api/location/0/0/0/rotate-right
   */
  async rotateRight(position: ButtonPosition): Promise<void> {
    const path = `/api/location/${position.page}/${position.row}/${position.column}/rotate-right`;
    await this.makeRequest('POST', path);
    
    this.emitEvent({
      type: 'button',
      action: 'rotate-right',
      position,
      timestamp: Date.now()
    });
  }

  /**
   * Set the current step of a button/encoder
  *
  * @example
  * /api/location/0/0/0/step?step=5
   */
  async setButtonStep(position: ButtonPosition, step: number): Promise<void> {
    const path = `/api/location/${position.page}/${position.row}/${position.column}/step`;
    await this.makeRequest('POST', path, undefined, { step: step.toString() });
    
    this.emitEvent({
      type: 'button',
      action: 'step',
      position,
      data: { step },
      timestamp: Date.now()
    });
  }

  // =============================================================================
  // BUTTON STYLING
  // =============================================================================

  /**
   * Update button style using query parameters
  *
  * @example
  * // query-style update
  * /api/location/0/0/0/style?text=Hello&bgcolor=%23112233
   */
  async updateButtonStyle(position: ButtonPosition, style: ButtonStyle): Promise<void> {
    // Check if this update would actually change anything
    if (!this.hasStyleChanges(position, style)) {
      return; // Skip the request - no changes needed
    }

    const path = `/api/location/${position.page}/${position.row}/${position.column}/style`;
    const queryParams: Record<string, string> = {};
    
    if (style.text !== undefined) queryParams.text = style.text;
    if (style.bgcolor !== undefined) queryParams.bgcolor = style.bgcolor;
    if (style.color !== undefined) queryParams.color = style.color;
    if (style.size !== undefined) queryParams.size = style.size.toString();
    
    await this.makeRequest('POST', path, undefined, queryParams);
    
    // Update cache with successful changes
    this.updateCachedButtonState(position, style);
    
    this.emitEvent({
      type: 'style',
      action: 'update',
      position,
      data: style,
      timestamp: Date.now()
    });
  }

  /**
  * Update button style using request body (for complex updates)
  *
  * @example
  * // body-style update
  * /api/location/0/0/0/style
  *
  * Example (legacy):
  *   // sets multiple fields in one request
  *   await client.updateButtonStyleBody(pos, { text: 'Hi', bgcolor: '#000000', color: '#FFFFFF', size: 18 });
  *
  * Example (preferred fluent style):
  *   // same as above using chaining
  *   await client.button(pos).text('Hi').bgcolor('#000000').color('#FFFFFF').size(18).apply();
   */
  async updateButtonStyleBody(position: ButtonPosition, style: ButtonStyle): Promise<void> {
    // Check if this update would actually change anything
    if (!this.hasStyleChanges(position, style)) {
      return; // Skip the request - no changes needed
    }

    const path = `/api/location/${position.page}/${position.row}/${position.column}/style`;
    await this.makeRequest('POST', path, style);
    
    // Update cache with successful changes
    this.updateCachedButtonState(position, style);
    
    this.emitEvent({
      type: 'style',
      action: 'update',
      position,
      data: style,
      timestamp: Date.now()
    });
  }

  /**
  * Change background color of button.
  *
  * @example
  * /api/location/0/0/0/style?bgcolor=%23FF0000
  *
  * Example (legacy):
  *   await client.setButtonBackgroundColor(pos, '#FF0000');
  *
  * Equivalent using the fluent API (allows chaining more changes/actions):
  *   await client.button(pos).bgcolor('#FF0000').apply();
   */
  async setButtonBackgroundColor(position: ButtonPosition, color: string): Promise<void> {
    await this.updateButtonStyle(position, { bgcolor: color });
  }

  /**
  * Change text color of button.
  *
  * @example
  * /api/location/0/0/0/style?color=%2300FF00
  *
  * Example (legacy):
  *   await client.setButtonTextColor(pos, '#00FF00');
  *
  * Equivalent using fluent API:
  *   await client.button(pos).color('#00FF00').apply();
   */
  async setButtonTextColor(position: ButtonPosition, color: string): Promise<void> {
    await this.updateButtonStyle(position, { color });
  }

  /**
  * Change text on a button.
  *
  * @example
  * /api/location/0/0/0/style?text=Hello
  *
  * Example (legacy):
  *   await client.setButtonText(pos, 'Hello');
  *
  * Equivalent using fluent API (you can chain additional style changes or actions):
  *   await client.button(pos).text('Hello').bgcolor('#333333').apply();
   */
  async setButtonText(position: ButtonPosition, text: string): Promise<void> {
    await this.updateButtonStyle(position, { text });
  }

  /**
  * Change text size on a button.
  *
  * @example
  * /api/location/0/0/0/style?size=20
  *
  * Example (legacy):
  *   await client.setButtonTextSize(pos, 20);
  *
  * Equivalent using fluent API:
  *   await client.button(pos).size(20).apply();
   */
  async setButtonTextSize(position: ButtonPosition, size: number): Promise<void> {
    await this.updateButtonStyle(position, { size });
  }

  // =============================================================================
  // FLUENT / CHAINING API
  // =============================================================================

  /**
   * Start a fluent builder for operations against a single button position.
   * Example: await client.button(pos).text('Hi').bgcolor('#FF0000').color('#FFFFFF').apply();
   */
  button(position: ButtonPosition): ButtonChain {
    return new ButtonChain(this, position);
  }



  // =============================================================================
  // CUSTOM VARIABLES
  // =============================================================================

  /**
   * Change custom variable value using query parameter
   */
  async setCustomVariable(name: string, value: string): Promise<void> {
    const path = `/api/custom-variable/${encodeURIComponent(name)}/value`;
    await this.makeRequest('POST', path, undefined, { value });
    
    this.emitEvent({
      type: 'variable',
      action: 'set',
      data: { name, value },
      timestamp: Date.now()
    });
  }

  /**
   * Change custom variable value using request body
   */
  async setCustomVariableBody(name: string, value: string): Promise<void> {
    const path = `/api/custom-variable/${encodeURIComponent(name)}/value`;
    await this.makeRequest('POST', path, value);
    
    this.emitEvent({
      type: 'variable',
      action: 'set',
      data: { name, value },
      timestamp: Date.now()
    });
  }

  /**
   * Get custom variable value
   */
  async getCustomVariable(name: string): Promise<string> {
    const path = `/api/custom-variable/${encodeURIComponent(name)}/value`;
    return await this.makeRequest('GET', path);
  }

  /**
   * Get module variable value
   */
  async getModuleVariable(connectionLabel: string, name: string): Promise<string> {
    const path = `/api/variable/${encodeURIComponent(connectionLabel)}/${encodeURIComponent(name)}/value`;
    return await this.makeRequest('GET', path);
  }

  // =============================================================================
  // SYSTEM OPERATIONS
  // =============================================================================

  /**
   * Make Companion rescan for newly attached USB surfaces
   */
  async rescanSurfaces(): Promise<void> {
    const path = '/api/surfaces/rescan';
    await this.makeRequest('POST', path);
    
    this.emitEvent({
      type: 'system',
      action: 'rescan',
      timestamp: Date.now()
    });
  }

  // =============================================================================
  // BATCH OPERATIONS
  // =============================================================================

  /**
   * Execute multiple operations in sequence
   */
  async executeBatch(operations: BatchOperation[]): Promise<void> {
    for (const operation of operations) {
      try {
        if (operation.action === 'style' && operation.data) {
          await this.updateButtonStyleBody(operation.position, operation.data as ButtonStyle);
        } else if (operation.action === 'press') {
          await this.pressButton(operation.position);
        } else if (operation.action === 'down') {
          await this.pressButtonDown(operation.position);
        } else if (operation.action === 'up') {
          await this.releaseButton(operation.position);
        } else if (operation.action === 'rotate-left') {
          await this.rotateLeft(operation.position);
        } else if (operation.action === 'rotate-right') {
          await this.rotateRight(operation.position);
        }
        
        // Small delay between operations to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        console.error(`Batch operation failed for ${JSON.stringify(operation)}:`, error);
        // Continue with other operations
      }
    }
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
  // EVENT HANDLING
  // =============================================================================

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

  /**
   * Get current configuration
   */
  getConfig(): Readonly<StreamDeckConfig> {
    return {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      retries: this.retries,
      defaultHeaders: { ...this.defaultHeaders }
    };
  }

  /**
   * Lazy-create and return an Animator tied to this client.
   * Uses dynamic import to avoid circular module load issues.
   */
  async getAnimator(fps: number = 15): Promise<any> {
    if (this._animator) return this._animator;
    const mod = await import('./animator');
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
   * 
   * @param protocol - Either 'tcp' or 'udp'
   * @param host - Host to connect to (default: 'localhost')
   * @param port - Port to connect to (default: 16759)
   * 
   * @example
   * ```ts
   * const client = new StreamDeckClient({ baseUrl: 'http://localhost:8000' });
   * const direct = await client.createDirectClient('tcp');
   * await direct.connect();
   * await direct.pressButton({ page: 1, row: 2, column: 3 });
   * ```
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
      const remoteModule = await import('./remote');
      this._remoteClient = new remoteModule.RemoteClient({
        protocol,
        host,
        port,
        timeout: this.timeout,
        reconnectAttempts: this.retries
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

/**
 * Fluent builder for button operations (styles + basic actions).
 * Collects style changes and can apply them in one request.
 */
/**
 * Fluent ButtonChain builder.
 *
 * Use this to batch style changes and queue actions for a single button. All
 * style changes are sent in one request when you call `apply()`.
 *
 * Example (fluent):
 *   await client.button(pos)
 *     .text('Hello')
 *     .bgcolor('#112233')
 *     .color('#FFFFFF')
 *     .press()
 *     .apply();
 *
 * The fluent style is handy when you want to set multiple fields or run an
 * action right after styling without multiple separate calls.
 */
export class ButtonChain {
  private client: StreamDeckClient;
  private position: ButtonPosition;
  private styleChanges: Partial<ButtonStyle> = {};
  private operations: Array<{ type: 'action' | 'fade'; data: any }> = [];
  private enabled = true;
  private condition?: () => boolean;
  private asyncCondition?: () => Promise<boolean>;

  constructor(client: StreamDeckClient, position: ButtonPosition) {
    this.client = client;
    this.position = position;
  }

  // Style setters
  /**
   * Set the button text. Chaining example:
   *   client.button(pos).text('Hi').bgcolor('#000').apply();
  *
  * @example
  * /api/location/0/0/0/style (body or ?text=...)
   */
  text(text: string): this {
  if (typeof text !== 'string') throw new TypeError('text must be a string');
  // Reasonable limit to avoid sending huge payloads
  if (text.length > 200) throw new RangeError('text length must be <= 200 characters');
  this.styleChanges.text = text;
  return this;
  }

  bgcolor(color: string): this {
  /**
   * Set the button background color (hex). Chainable.
   * Example: client.button(pos).bgcolor('#FF0000').color('#000000').apply();
   *
   * @example
   * /api/location/0/0/0/style?bgcolor=%23FF0000
   */
  if (typeof color !== 'string') throw new TypeError('bgcolor must be a string');
  if (!StreamDeckClient.isValidHexColor(color)) throw new RangeError(`bgcolor must be a valid hex color like #RRGGBB: ${color}`);
  this.styleChanges.bgcolor = color;
  return this;
  }

  color(color: string): this {
  /** Set the button text color (hex).
   *
   * @example
   * /api/location/0/0/0/style?color=%2300FF00
   */
  if (typeof color !== 'string') throw new TypeError('color must be a string');
  if (!StreamDeckClient.isValidHexColor(color)) throw new RangeError(`color must be a valid hex color like #RRGGBB: ${color}`);
  this.styleChanges.color = color;
  return this;
  }

  size(size: number): this {
  /** Set the text size (integer 1-72).
   *
   * @example
   * /api/location/0/0/0/style?size=20
   */
  if (typeof size !== 'number' || !Number.isFinite(size)) throw new TypeError('size must be a finite number');
  if (!Number.isInteger(size) || size <= 0 || size > 72) throw new RangeError('size must be an integer between 1 and 72');
  this.styleChanges.size = size;
  return this;
  }

  // Action enqueuers
  press(): this {
  /** Queue a press action to run after styles are applied.
   *
   * @example
   * /api/location/0/0/0/press
   */
  this.operations.push({ type: 'action', data: () => this.client.pressButton(this.position) });
    return this;
  }

  down(): this {
  /** Queue a down (press-and-hold) action.
   *
   * @example
   * /api/location/0/0/0/down
   */
  this.operations.push({ type: 'action', data: () => this.client.pressButtonDown(this.position) });
    return this;
  }

  up(): this {
  /** Queue a release (up) action.
   *
   * @example
   * /api/location/0/0/0/up
   */
  this.operations.push({ type: 'action', data: () => this.client.releaseButton(this.position) });
    return this;
  }

  rotateLeft(): this {
  /** Queue a rotate-left action.
   *
   * @example
   * /api/location/0/0/0/rotate-left
   */
  this.operations.push({ type: 'action', data: () => this.client.rotateLeft(this.position) });
    return this;
  }

  rotateRight(): this {
  /** Queue a rotate-right action.
   *
   * @example
   * /api/location/0/0/0/rotate-right
   */
  this.operations.push({ type: 'action', data: () => this.client.rotateRight(this.position) });
    return this;
  }

  step(n: number): this {
  /** Queue a set step action (integer).
   *
   * @example
   * /api/location/0/0/0/step?step=5
   */
  if (typeof n !== 'number' || !Number.isFinite(n) || !Number.isInteger(n)) throw new TypeError('step must be an integer');
  this.operations.push({ type: 'action', data: () => this.client.setButtonStep(this.position, n) });
  return this;
  }

  /**
   * Apply collected style changes and then execute queued actions and fade operations in sequence.
   * If no style changes were made, only actions and fades run.
   */
  async apply(): Promise<void> {
    // Evaluate condition (if supplied) lazily at apply time. This allows
    // .when(() => expensiveCheck()) usage as well as simple booleans via
    // .when(true/false), and supports async predicates via whenAsync().
    let finalEnabled = this.enabled;
    if (this.asyncCondition) {
      try {
        finalEnabled = Boolean(await this.asyncCondition());
      } catch {
        finalEnabled = false;
      }
    } else if (this.condition) {
      finalEnabled = Boolean(this.condition());
    }

    if (!finalEnabled) return;
    
    // Apply initial style changes first
    if (Object.keys(this.styleChanges).length > 0) {
      // Use body-style update for combined fields
      await this.client.updateButtonStyleBody(this.position, this.styleChanges as ButtonStyle);
    }

    // Execute operations in the order they were added
    for (const operation of this.operations) {
      if (operation.type === 'action') {
        await operation.data();
      } else if (operation.type === 'fade') {
        await this.executeFadeOperation(operation.data);
      }
      // small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Execute a queued fade operation
   */
  private async executeFadeOperation(fade: { type: string; params: any[] }): Promise<void> {
    switch (fade.type) {
      case 'fadeTo':
        await this.executeActualFadeTo(fade.params[0], fade.params[1], fade.params[2]);
        break;
      case 'fadeToBlack':
        await this.executeActualFadeTo('#000000', fade.params[0], fade.params[1]);
        break;
      case 'fadeSequence':
        await this.executeActualFadeSequence(fade.params[0], fade.params[1]);
        break;
      case 'fadeOutIn':
        await this.executeActualFadeTo('#000000', fade.params[1], fade.params[3]); // fade out
        await this.executeActualFadeTo(fade.params[0], fade.params[2], fade.params[3]); // fade in
        break;
    }
  }

  /**
   * Internal method to actually execute a fade to operation
   */
  private async executeActualFadeTo(
    targetColor: string,
    duration: number = 1000,
    condition?: boolean | (() => boolean) | (() => Promise<boolean>)
  ): Promise<void> {
    // Evaluate condition
    let shouldRun = true;
    
    if (condition !== undefined) {
      if (typeof condition === 'boolean') {
        shouldRun = condition;
      } else if (typeof condition === 'function') {
        try {
          const result = condition();
          shouldRun = result instanceof Promise ? await result : result;
        } catch {
          shouldRun = false;
        }
      }
    }

    if (!shouldRun) return;

    // Get the current background color from styleChanges, defaulting to black if not set
    const currentColor = this.styleChanges.bgcolor || '#000000';
    
    // Parse colors to RGB
    const currentRgb = StreamDeckClient.hexToRgb(currentColor);
    const targetRgb = StreamDeckClient.hexToRgb(targetColor);
    
    if (!currentRgb || !targetRgb) {
      throw new Error(`Invalid color format. Current: ${currentColor}, Target: ${targetColor}`);
    }

    // Animation settings - reduced FPS to avoid overwhelming the API
    const fps = 15; // 15 FPS for smoother animation with fewer HTTP requests
    const frameCount = Math.max(1, Math.round((duration / 1000) * fps));
    const frameDelay = duration / frameCount;
    
    // Track last sent color to avoid duplicate requests
    let lastSentColor: string | undefined;

    // Interpolate colors over time
    for (let frame = 0; frame <= frameCount; frame++) {
      // Re-check condition each frame for responsive cancellation
      if (condition && typeof condition === 'function') {
        try {
          const result = condition();
          const currentShouldRun = result instanceof Promise ? await result : result;
          if (!currentShouldRun) break;
        } catch {
          break;
        }
      }

      const progress = frame / frameCount; // 0 to 1
      
      // Linear interpolation between current and target colors
      const r = Math.round(currentRgb.r + (targetRgb.r - currentRgb.r) * progress);
      const g = Math.round(currentRgb.g + (targetRgb.g - currentRgb.g) * progress);
      const b = Math.round(currentRgb.b + (targetRgb.b - currentRgb.b) * progress);
      
      const interpolatedColor = StreamDeckClient.rgbToHex(r, g, b);
      
      // Only send request if color actually changed (avoid duplicate requests)
      if (!lastSentColor || lastSentColor !== interpolatedColor) {
        try {
          // Apply the interpolated color while preserving other properties
          const frameStyle = { ...this.styleChanges, bgcolor: interpolatedColor };
          
          if (this.client.isNonBlockingAnimationsEnabled()) {
            // Fire-and-forget HTTP request to avoid blocking animation timing
            this.client.updateButtonStyleBody(this.position, frameStyle).catch(error => {
              // Don't stop animation on network errors, just log and continue
              console.warn('Fade animation network error:', error);
            });
          } else {
            // Wait for HTTP response (more reliable but may cause stuttering)
            await this.client.updateButtonStyleBody(this.position, frameStyle);
          }
          
          lastSentColor = interpolatedColor;
          
          // Update our internal state to track the current color
          this.styleChanges.bgcolor = interpolatedColor;
        } catch (error) {
          // Don't stop animation on network errors, just log and continue
          console.warn('Fade animation network error:', error);
        }
      }
      
      // Wait for next frame (except on last frame)
      if (frame < frameCount) {
        await new Promise(resolve => setTimeout(resolve, frameDelay));
      }
    }
  }

  /**
   * Internal method to actually execute a fade sequence
   */
  private async executeActualFadeSequence(
    sequence: Array<{ color: string; duration: number }>,
    condition?: boolean | (() => boolean) | (() => Promise<boolean>)
  ): Promise<void> {
    for (let i = 0; i < sequence.length; i++) {
      const step = sequence[i];
      await this.executeActualFadeTo(step.color, step.duration, condition);
      
      // Small pause between sequence steps for smoother transitions
      if (i < sequence.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  /**
   * Convenience: apply and return the client for further chaining across buttons
   */
  async applyAndContinue(): Promise<StreamDeckClient> {
    await this.apply();
    return this.client;
  }

  /**
   * Only enable the chain if condition is truthy. Useful to avoid wrapping code in `if`.
   * Example: client.button(pos).when(isLive).bgcolor('#F00').apply();
   */
  when(condition: boolean | (() => boolean)): this {
    if (typeof condition === 'function') {
      this.condition = condition as () => boolean;
    } else {
      this.condition = undefined;
      this.enabled = Boolean(condition);
    }
    return this;
  }

  /**
   * Inverse of `when` - enable only when condition is falsy.
   */
  unless(condition: boolean | (() => boolean)): this {
    if (typeof condition === 'function') {
      const fn = condition as () => boolean;
      this.condition = () => !fn();
    } else {
      this.condition = undefined;
      this.enabled = !Boolean(condition);
    }
    return this;
  }

  /**
   * Like `when` but accepts an async predicate. The predicate is awaited at
   * `apply()`/`animate()` time. Example:
   *   await client.button(pos).whenAsync(async () => await isUserAllowed()).text('OK').apply();
   */
  whenAsync(predicate: () => Promise<boolean>): this {
    this.asyncCondition = predicate;
    // clear sync condition to avoid confusion
    this.condition = undefined;
    return this;
  }

  /**
   * Inverse of `whenAsync` - enable only when async predicate resolves to false.
   */
  unlessAsync(predicate: () => Promise<boolean>): this {
    this.asyncCondition = async () => !(await predicate());
    this.condition = undefined;
    return this;
  }

  /**
   * Convenience animate helper for this button chain.
   *
   * Use this to run short animations (flash, pulse, fade, rainbow) against a
   * single button. The method accepts either a preset name (resolved at runtime)
   * or a full `ButtonStyle` object.
   *
   * IMPORTANT: This method preserves existing button properties by merging the
   * animation style with the current button state. Only the specified properties
   * will be animated, leaving others (like text) unchanged.
   *
   * ## Parameters
   * @param presetOrStyle - Preset key (string) or a `ButtonStyle` object.
   * @param duration - Duration in milliseconds for the animation (default: 1000).
   * @param opts - Options object or inline condition. Options may include:
   *   - `type`: 'flash' | 'pulse' | 'fade' | 'rainbow'
   *   - `intervals`: number of sub-intervals
   *   - `loop`: boolean to loop indefinitely (returns a stop function)
   *   - `revertTo`: preset key or style to revert to
   *   - `fromColor`, `toColor`: color overrides for fades
   *   - `preserveExisting`: boolean (default: true) to merge with current button state
   *   Alternatively `opts` may be a boolean, a sync predicate `() => boolean` or
   *   an async predicate `() => Promise<boolean>` which is evaluated before running.
   *
   * ## Returns
   * - When `loop` is true: returns a stop function `() => void` to cancel the loop.
   * - Otherwise returns `void` when the single-run animation completes.
   *
   * ## Examples
   * ```ts
   * // animate only background color, preserving text and other properties
   * await client.button(pos).animate({ bgcolor: '#FF0000' }, 1000, { type: 'flash', intervals: 3 });
   *
   * // continuous fade loop; get a stop handle
   * const stop = await client.button(pos).animate({ bgcolor: '#112233' }, 800, { type: 'fade', loop: true });
   * // later: stop();
   * ```
   */
  async animate(
    presetOrStyle: keyof any | ButtonStyle,
    duration: number = 1000,
    opts: boolean | (() => boolean) | (() => Promise<boolean>) | { type?: 'flash' | 'pulse' | 'fade' | 'rainbow'; intervals?: number; loop?: boolean; revertTo?: keyof any | ButtonStyle; fromColor?: string; toColor?: string; preserveExisting?: boolean } = {}
  ): Promise<(() => void) | void> {
    // Normalize inline predicate vs options. Allow calling .animate(..., true) or
    // .animate(..., () => condition) or .animate(..., async () => await check())
    let inlineSyncCondition: (() => boolean) | undefined;
    let inlineAsyncCondition: (() => Promise<boolean>) | undefined;
    let options: { type?: 'flash' | 'pulse' | 'fade' | 'rainbow'; intervals?: number; loop?: boolean; revertTo?: keyof any | ButtonStyle; fromColor?: string; toColor?: string; preserveExisting?: boolean } = {};

    if (typeof opts === 'boolean') {
      inlineSyncCondition = () => opts;
    } else if (typeof opts === 'function') {
      // Could be sync or async - wrap into async predicate for safety
      const fn = opts as any;
      inlineAsyncCondition = async () => Promise.resolve(fn());
    } else {
      options = opts;
    }

    // Evaluate conditional predicate before running animation (supports async predicate)
    let finalEnabled = this.enabled;
    if (this.asyncCondition) {
      try {
        finalEnabled = Boolean(await this.asyncCondition());
      } catch {
        finalEnabled = false;
      }
    } else if (this.condition) {
      finalEnabled = Boolean(this.condition());
    }

    // Evaluate inline condition last so it can short-circuit per-call
    if (inlineAsyncCondition) {
      try {
        finalEnabled = Boolean(await inlineAsyncCondition());
      } catch {
        finalEnabled = false;
      }
    } else if (inlineSyncCondition) {
      finalEnabled = Boolean(inlineSyncCondition());
    }

    if (!finalEnabled) return undefined;
    
    // Resolve presets dynamically to avoid circular import issues at module load
    const utils = await import('./utils');
    const BUTTON_PRESETS = (utils as any).BUTTON_PRESETS as Record<string, ButtonStyle>;
    const createButtonStyle = (utils as any).createButtonStyle as (p: string, o?: Partial<ButtonStyle>) => ButtonStyle;

    const resolve = (val: any): ButtonStyle => {
      if (!val) return {} as ButtonStyle;
      if (typeof val === 'string') return BUTTON_PRESETS[val] ?? ({ bgcolor: '#000000' } as ButtonStyle);
      return val as ButtonStyle;
    };

    // Get base style from any pending style changes in this chain
    const baseStyle: ButtonStyle = { ...this.styleChanges };
    
    // Option to preserve existing button state (default: true)
    const preserveExisting = options.preserveExisting ?? true;
    
    const animationStyle = resolve(presetOrStyle);
    const revertStyle = resolve(options.revertTo ?? (preserveExisting ? {} : 'BLANK'));

    // Merge animation style with base style, preserving existing properties unless explicitly overridden
    const target: ButtonStyle = preserveExisting 
      ? { ...baseStyle, ...animationStyle }  // Only override specified properties
      : animationStyle;  // Replace everything (old behavior)
      
    // For revert: if preserveExisting is true, only revert the properties that were animated
    const revert: ButtonStyle = preserveExisting
      ? (() => {
          const result = { ...baseStyle };
          // Only include revertStyle properties that were actually changed in the animation
          Object.keys(animationStyle).forEach(key => {
            if (revertStyle[key as keyof ButtonStyle] !== undefined) {
              (result as any)[key] = revertStyle[key as keyof ButtonStyle];
            }
          });
          return result;
        })()
      : revertStyle;

  const intervals = Math.max(1, options.intervals ?? 2);
  const half = Math.round(duration / (intervals * 2));

    let stopped = false;

    const runOnce = async () => {
      for (let i = 0; i < intervals && !stopped; i++) {
        if (this.client.isNonBlockingAnimationsEnabled()) {
          // Fire-and-forget requests to avoid blocking animation timing
          this.client.updateButtonStyleBody(this.position, target).catch(error => {
            console.warn('Flash animation network error (target):', error);
          });
        } else {
          // Wait for HTTP response (more reliable but may cause stuttering)
          await this.client.updateButtonStyleBody(this.position, target);
        }
        
        await new Promise(r => setTimeout(r, half));
        if (stopped) break;
        
        if (this.client.isNonBlockingAnimationsEnabled()) {
          this.client.updateButtonStyleBody(this.position, revert).catch(error => {
            console.warn('Flash animation network error (revert):', error);
          });
        } else {
          await this.client.updateButtonStyleBody(this.position, revert);
        }
        
        await new Promise(r => setTimeout(r, half));
      }
    };

    const loopFlag = (options.loop ?? (opts && typeof opts === 'object' ? (opts as any).loop : undefined)) ?? false;

    if (loopFlag) {
      const resolvedTarget = target;
      const fromColor = (options.fromColor ?? (opts && typeof opts === 'object' ? (opts as any).fromColor : undefined)) ?? resolvedTarget.bgcolor ?? undefined;
      const toColor = (options.toColor ?? (opts && typeof opts === 'object' ? (opts as any).toColor : undefined)) ?? (options.type === 'fade' || (opts && typeof opts === 'object' && (opts as any).type === 'fade') ? revert.bgcolor : undefined) ?? undefined;

      // Prefer Animator for continuous loops when possible. Choose the right animator method by type.
      try {
        const animator = await this.client.getAnimator();
        let id: string | undefined;

  if (options.type === 'rainbow') {
          id = animator.createRainbow(this.position, { ...resolvedTarget }, {
            duration,
            loop: true,
            intervals: options.intervals ?? 1
          });
  } else if (options.type === 'fade' || (fromColor && toColor)) {
          // fade between fromColor -> toColor
          id = animator.createFade(this.position, { ...resolvedTarget }, {
            duration,
            loop: true,
            fromColor: fromColor ?? '#000000',
            toColor: toColor ?? '#000000',
            intervals: options.intervals ?? 1
          });
        } else {
          // default to flash/pulse using createFlash
          const flashColor = options.fromColor ?? resolvedTarget.bgcolor ?? '#FFFFFF';
          id = animator.createFlash(this.position, { ...resolvedTarget }, {
            duration,
            loop: true,
            flashColor,
            intervals: options.intervals ?? 2
          });
        }

        if (id) {
          // If an inline predicate was provided, start a watcher that stops
          // the animation when the predicate becomes false.
          let watcherStop = false;
          if (inlineAsyncCondition || inlineSyncCondition) {
            (async () => {
              while (!watcherStop) {
                let ok = true;
                try {
                  if (inlineAsyncCondition) ok = Boolean(await inlineAsyncCondition());
                  else if (inlineSyncCondition) ok = Boolean(inlineSyncCondition());
                } catch {
                  ok = false;
                }
                if (!ok) {
                  try { animator.stopAnimation(id as string); } catch {}
                  break;
                }
                // Re-check at reasonable intervals (half the duration)
                await new Promise(r => setTimeout(r, Math.max(200, Math.round(duration / 2))));
              }
            })().catch(() => {});
          }

          return () => {
            watcherStop = true;
            try { animator.stopAnimation(id as string); } catch {}
          };
        }
      } catch (e) {
        // If Animator isn't available or fails, fall back to the simple loop below
      }

      // fallback: run in background until stopped, but re-evaluate inline predicate
      (async () => {
        while (!stopped) {
          // If inline predicate exists, check before each iteration
          if (inlineAsyncCondition) {
            try {
              const ok = Boolean(await inlineAsyncCondition());
              if (!ok) break;
            } catch {
              break;
            }
          } else if (inlineSyncCondition) {
            if (!inlineSyncCondition()) break;
          }

          await runOnce();
        }
      })().catch(() => {});

      return () => {
        stopped = true;
      };
    }

    // single run
    await runOnce();
    return undefined;
  }

  /**
   * Convenience method to animate just the background color while preserving all other properties.
   * This is a shortcut for .animate({ bgcolor: color }, duration, opts).
   *
   * ## Example
   * ```ts
   * // Flash red background for 1 second, preserving text and other styles
   * await client.button(pos).flashBgColor('#FF0000', 1000);
   * 
   * // Flash with condition
   * await client.button(pos).flashBgColor('#FF0000', 1000, () => someCondition);
   * ```
   */
  async flashBgColor(
    color: string,
    duration: number = 1000,
    condition?: boolean | (() => boolean) | (() => Promise<boolean>)
  ): Promise<(() => void) | void> {
    const opts = condition !== undefined 
      ? (typeof condition === 'boolean' ? condition : condition)
      : {};
    
    return this.animate(
      { bgcolor: color }, 
      duration, 
      typeof opts === 'object' ? { type: 'flash', preserveExisting: true, ...opts } : opts
    );
  }

  /**
   * Convenience method to animate just the text color while preserving all other properties.
   * This is a shortcut for .animate({ color: textColor }, duration, opts).
   */
  async flashTextColor(
    color: string,
    duration: number = 1000,
    condition?: boolean | (() => boolean) | (() => Promise<boolean>)
  ): Promise<(() => void) | void> {
    const opts = condition !== undefined 
      ? (typeof condition === 'boolean' ? condition : condition)
      : {};
    
    return this.animate(
      { color }, 
      duration, 
      typeof opts === 'object' ? { type: 'flash', preserveExisting: true, ...opts } : opts
    );
  }

  /**
   * Queue a fade to a specific background color over the given duration.
   * This preserves existing properties and smoothly transitions the background color
   * by interpolating between the current color and target color over time.
   * The fade will execute when apply() is called.
   *
   * ## Example
   * ```ts
   * // Queue a fade to black, then apply all changes
   * await client.button(pos)
   *   .bgcolor('#FF0000')
   *   .text('Hello')
   *   .fadeTo('#000000', 500)
   *   .apply();
   * ```
   */
  fadeTo(
    targetColor: string,
    duration: number = 1000,
    condition?: boolean | (() => boolean) | (() => Promise<boolean>)
  ): this {
    this.operations.push({
      type: 'fade',
      data: { type: 'fadeTo', params: [targetColor, duration, condition] }
    });
    return this;
  }

  /**
   * Execute a sequence of fade animations to different colors.
   * Each fade preserves existing properties and only changes the background color.
   * The sequence will execute when apply() is called.
   *
   * ## Parameters
   * @param sequence - Array of objects with { color: string, duration: number }
   * @param condition - Optional condition to check before running the sequence
   *
   * ## Example
   * ```ts
   * // Queue fade to black (500ms), then to red (1000ms)
   * await client.button(pos)
   *   .text('Hello')
   *   .fadeSequence([
   *     { color: '#000000', duration: 500 },
   *     { color: '#FF0000', duration: 1000 }
   *   ])
   *   .apply();
   * ```
   */
  fadeSequence(
    sequence: Array<{ color: string; duration: number }>,
    condition?: boolean | (() => boolean) | (() => Promise<boolean>)
  ): this {
    this.operations.push({
      type: 'fade',
      data: { type: 'fadeSequence', params: [sequence, condition] }
    });
    return this;
  }

  /**
   * Queue a fade to black (darken) over the given duration.
   * This is a convenience method for fadeTo('#000000', duration).
   * The fade will execute when apply() is called.
   *
   * ## Example
   * ```ts
   * // Queue fade to black over 1 second
   * await client.button(pos)
   *   .text('Hello')
   *   .fadeToBlack(1000)
   *   .apply();
   * ```
   */
  fadeToBlack(
    duration: number = 1000,
    condition?: boolean | (() => boolean) | (() => Promise<boolean>)
  ): this {
    this.operations.push({
      type: 'fade',
      data: { type: 'fadeToBlack', params: [duration, condition] }
    });
    return this;
  }

  /**
   * Queue a fade out (to black) then fade in (to target color) sequence.
   * This creates a classic fade-out/fade-in effect.
   * The sequence will execute when apply() is called.
   *
   * ## Example
   * ```ts
   * // Queue fade to black (500ms) then fade to red (1000ms)
   * await client.button(pos)
   *   .text('Hello')
   *   .fadeOutIn('#FF0000', 500, 1000)
   *   .apply();
   * ```
   */
  fadeOutIn(
    targetColor: string,
    fadeOutDuration: number = 500,
    fadeInDuration: number = 1000,
    condition?: boolean | (() => boolean) | (() => Promise<boolean>)
  ): this {
    this.operations.push({
      type: 'fade',
      data: { type: 'fadeOutIn', params: [targetColor, fadeOutDuration, fadeInDuration, condition] }
    });
    return this;
  }
}
