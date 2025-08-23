/**
 * System Operations
 * 
 * Handles system-wide operations like surface management.
 */

import type { StreamDeckEvent } from '../core/types.js';
import type { HttpClient } from './http-client.js';

export class SystemOperations {
  constructor(
    private httpClient: HttpClient,
    private emitEvent: (event: StreamDeckEvent) => void
  ) {}

  /**
   * Make Companion rescan for newly attached USB surfaces
   */
  async rescanSurfaces(): Promise<void> {
    const path = '/api/surfaces/rescan';
    await this.httpClient.makeRequest('POST', path);
    
    this.emitEvent({
      type: 'system',
      action: 'rescan',
      timestamp: Date.now()
    });
  }
}
