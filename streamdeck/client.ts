/**
 * StreamDeck Companion HTTP API Client
 * 
 * A comprehensive client for interacting with StreamDeck Companion's HTTP API
 * Supports all documented endpoints and provides a clean TypeScript interface
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

export class StreamDeckClient {
  private baseUrl: string;
  private timeout: number;
  private retries: number;
  private defaultHeaders: Record<string, string>;
  private eventListeners: Set<(event: StreamDeckEvent) => void> = new Set();

  constructor(config: StreamDeckConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout || 5000;
    this.retries = config.retries || 3;
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
   * Press and release a button (run both down and up actions)
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
   */
  async updateButtonStyle(position: ButtonPosition, style: ButtonStyle): Promise<void> {
    const path = `/api/location/${position.page}/${position.row}/${position.column}/style`;
    const queryParams: Record<string, string> = {};
    
    if (style.text !== undefined) queryParams.text = style.text;
    if (style.bgcolor !== undefined) queryParams.bgcolor = style.bgcolor;
    if (style.color !== undefined) queryParams.color = style.color;
    if (style.size !== undefined) queryParams.size = style.size.toString();
    
    await this.makeRequest('POST', path, undefined, queryParams);
    
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
   */
  async updateButtonStyleBody(position: ButtonPosition, style: ButtonStyle): Promise<void> {
    const path = `/api/location/${position.page}/${position.row}/${position.column}/style`;
    await this.makeRequest('POST', path, style);
    
    this.emitEvent({
      type: 'style',
      action: 'update',
      position,
      data: style,
      timestamp: Date.now()
    });
  }

  /**
   * Change background color of button
   */
  async setButtonBackgroundColor(position: ButtonPosition, color: string): Promise<void> {
    await this.updateButtonStyle(position, { bgcolor: color });
  }

  /**
   * Change text color of button
   */
  async setButtonTextColor(position: ButtonPosition, color: string): Promise<void> {
    await this.updateButtonStyle(position, { color });
  }

  /**
   * Change text on a button
   */
  async setButtonText(position: ButtonPosition, text: string): Promise<void> {
    await this.updateButtonStyle(position, { text });
  }

  /**
   * Change text size on a button
   */
  async setButtonTextSize(position: ButtonPosition, size: number): Promise<void> {
    await this.updateButtonStyle(position, { size });
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
}
