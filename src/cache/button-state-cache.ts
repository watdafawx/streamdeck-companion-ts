/**
 * Button State Cache
 * 
 * Manages caching of button states to prevent unnecessary HTTP requests
 * when setting the same button properties repeatedly.
 */

import type { ButtonPosition, ButtonStyle } from '../core/types.js';

export class ButtonStateCache {
  private buttonStateCache: Map<string, ButtonStyle> = new Map();
  private cachingEnabled: boolean = true;

  /**
   * Generate a unique key for a button position for caching
   */
  private getButtonKey(position: ButtonPosition): string {
    return `${position.page}:${position.row}:${position.column}`;
  }

  /**
   * Get cached button state, or return empty state if not cached
   */
  getCachedButtonState(position: ButtonPosition): ButtonStyle {
    const key = this.getButtonKey(position);
    return this.buttonStateCache.get(key) || {};
  }

  /**
   * Update cached button state with new style properties
   */
  updateCachedButtonState(position: ButtonPosition, style: Partial<ButtonStyle>): void {
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
  hasStyleChanges(position: ButtonPosition, style: Partial<ButtonStyle>): boolean {
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
}
