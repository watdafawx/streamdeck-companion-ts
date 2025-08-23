/**
 * Button Operations
 * 
 * Handles all button-related HTTP API calls including pressing buttons,
 * rotating encoders, and setting steps.
 */

import type { ButtonPosition, StreamDeckEvent } from '../core/types.js';
import type { HttpClient } from './http-client.js';

export class ButtonOperations {
  constructor(
    private httpClient: HttpClient,
    private emitEvent: (event: StreamDeckEvent) => void
  ) {}

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
   * await buttonOps.pressButton({ page: 0, row: 0, column: 0 });
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
    await this.httpClient.makeRequest('POST', path);
    
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
    await this.httpClient.makeRequest('POST', path);
    
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
    await this.httpClient.makeRequest('POST', path);
    
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
    await this.httpClient.makeRequest('POST', path);
    
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
    await this.httpClient.makeRequest('POST', path);
    
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
    await this.httpClient.makeRequest('POST', path, undefined, { step: step.toString() });
    
    this.emitEvent({
      type: 'button',
      action: 'step',
      position,
      data: { step },
      timestamp: Date.now()
    });
  }
}
