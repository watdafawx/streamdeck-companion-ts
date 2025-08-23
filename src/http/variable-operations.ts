/**
 * Variable Operations
 * 
 * Handles custom variables and module variables operations.
 */

import type { StreamDeckEvent } from '../core/types.js';
import type { HttpClient } from './http-client.js';

export class VariableOperations {
  constructor(
    private httpClient: HttpClient,
    private emitEvent: (event: StreamDeckEvent) => void
  ) {}

  /**
   * Change custom variable value using query parameter
   */
  async setCustomVariable(name: string, value: string): Promise<void> {
    const path = `/api/custom-variable/${encodeURIComponent(name)}/value`;
    await this.httpClient.makeRequest('POST', path, undefined, { value });
    
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
    await this.httpClient.makeRequest('POST', path, value);
    
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
    return await this.httpClient.makeRequest('GET', path);
  }

  /**
   * Get module variable value
   */
  async getModuleVariable(connectionLabel: string, name: string): Promise<string> {
    const path = `/api/variable/${encodeURIComponent(connectionLabel)}/${encodeURIComponent(name)}/value`;
    return await this.httpClient.makeRequest('GET', path);
  }
}
