/**
 * Button Styling
 * 
 * Handles all button styling operations including setting text, colors, and sizes.
 */

import type { ButtonPosition, ButtonStyle, StreamDeckEvent } from '../core/types.js';
import type { HttpClient } from './http-client.js';
import type { ButtonStateCache } from '../cache/button-state-cache.js';

export class ButtonStyling {
  constructor(
    private httpClient: HttpClient,
    private cache: ButtonStateCache,
    private emitEvent: (event: StreamDeckEvent) => void
  ) {}

  /**
   * Update button style using query parameters
   *
   * @example
   * // query-style update
   * /api/location/0/0/0/style?text=Hello&bgcolor=%23112233
   */
  async updateButtonStyle(position: ButtonPosition, style: ButtonStyle): Promise<void> {
    // Check if this update would actually change anything
    if (!this.cache.hasStyleChanges(position, style)) {
      return; // Skip the request - no changes needed
    }

    const path = `/api/location/${position.page}/${position.row}/${position.column}/style`;
    const queryParams: Record<string, string> = {};
    
    if (style.text !== undefined) queryParams.text = style.text;
    if (style.bgcolor !== undefined) queryParams.bgcolor = style.bgcolor;
    if (style.color !== undefined) queryParams.color = style.color;
    if (style.size !== undefined) queryParams.size = style.size.toString();
    
    await this.httpClient.makeRequest('POST', path, undefined, queryParams);
    
    // Update cache with successful changes
    this.cache.updateCachedButtonState(position, style);
    
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
    if (!this.cache.hasStyleChanges(position, style)) {
      return; // Skip the request - no changes needed
    }

    const path = `/api/location/${position.page}/${position.row}/${position.column}/style`;
    await this.httpClient.makeRequest('POST', path, style);
    
    // Update cache with successful changes
    this.cache.updateCachedButtonState(position, style);
    
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
}
