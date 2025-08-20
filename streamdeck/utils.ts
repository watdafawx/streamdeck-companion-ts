/**
 * StreamDeck Companion Utilities
 * 
 * Helper functions and utilities for working with StreamDeck Companion
 */
/**
 * StreamDeck Companion Utilities
 *
 * Utility helpers for color, layout and text formatting used by presets and the
 * client. These small helpers are intentionally dependency-free so they are
 * easy to include in browser or server preview code.
 */

import { StreamDeckClient } from './client';
import type { ButtonPosition, ButtonStyle } from './types';

/**
 * Generate all button positions for a given page and grid size
 */
export function generateButtonGrid(
  page: number,
  rows: number,
  columns: number
): ButtonPosition[] {
  const positions: ButtonPosition[] = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      positions.push({ page, row, column: col });
    }
  }
  
  return positions;
}

/**
 * Convert linear index to button position
 */
export function indexToPosition(
  index: number,
  columns: number,
  page: number = 1
): ButtonPosition {
  return {
    page,
    row: Math.floor(index / columns),
    column: index % columns
  };
}

/**
 * Convert button position to linear index
 */
export function positionToIndex(position: ButtonPosition, columns: number): number {
  return position.row * columns + position.column;
}

// =============================================================================
// COLOR UTILITIES
// =============================================================================

/**
 * Common colors for StreamDeck buttons
 */
export const COLORS = {
  // Basic colors
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  RED: '#FF0000',
  GREEN: '#00FF00',
  BLUE: '#0000FF',
  YELLOW: '#FFFF00',
  CYAN: '#00FFFF',
  MAGENTA: '#FF00FF',
  
  // Grays
  DARK_GRAY: '#333333',
  GRAY: '#666666',
  LIGHT_GRAY: '#CCCCCC',
  
  // Professional colors
  DARK_BLUE: '#1E3A8A',
  NAVY: '#1E40AF',
  PURPLE: '#7C3AED',
  ORANGE: '#F97316',
  PINK: '#EC4899',
  
  // Status colors
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
  
  // StreamDeck-friendly colors
  STREAMDECK_BLUE: '#0F172A',
  STREAMDECK_PURPLE: '#581C87',
  STREAMDECK_GREEN: '#166534',
  STREAMDECK_RED: '#991B1B'
} as const;

/**
 * Darken a hex color by a percentage
 */
export function darkenColor(hex: string, percent: number): string {
  const rgb = StreamDeckClient.hexToRgb(hex);
  if (!rgb) return hex;
  
  const factor = Math.max(0, Math.min(1, (100 - percent) / 100));
  
  return StreamDeckClient.rgbToHex(
    Math.round(rgb.r * factor),
    Math.round(rgb.g * factor),
    Math.round(rgb.b * factor)
  );
}

/**
 * Lighten a hex color by a percentage
 */
export function lightenColor(hex: string, percent: number): string {
  const rgb = StreamDeckClient.hexToRgb(hex);
  if (!rgb) return hex;
  
  const factor = Math.max(0, Math.min(1, percent / 100));
  
  return StreamDeckClient.rgbToHex(
    Math.round(rgb.r + (255 - rgb.r) * factor),
    Math.round(rgb.g + (255 - rgb.g) * factor),
    Math.round(rgb.b + (255 - rgb.b) * factor)
  );
}

/**
 * Get contrasting text color (black or white) for a background color
 */
export function getContrastingTextColor(backgroundColor: string): string {
  const rgb = StreamDeckClient.hexToRgb(backgroundColor);
  if (!rgb) return COLORS.WHITE;
  
  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  
  return luminance > 0.5 ? COLORS.BLACK : COLORS.WHITE;
}

// =============================================================================
// TEXT UTILITIES
// =============================================================================

/**
 * Truncate text to fit button display
 */
export function truncateText(text: string, maxLength: number = 8): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

/**
 * Format text for multi-line display on buttons
 */
export function formatMultiLineText(text: string, maxLineLength: number = 6): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxLineLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word.slice(0, maxLineLength);
    }
  }
  
  if (currentLine) lines.push(currentLine);
  
  return lines.join('\n');
}

/**
 * Convert number to display text with appropriate formatting
 */
export function formatNumber(num: number, maxDigits: number = 4): string {
  if (num < Math.pow(10, maxDigits)) {
    return num.toString();
  }
  
  if (num < 1000000) {
    return Math.round(num / 1000) + 'K';
  }
  
  return Math.round(num / 1000000) + 'M';
}

// =============================================================================
// BUTTON PRESETS
// =============================================================================

/**
 * Common button style presets
 */
export const BUTTON_PRESETS = {
  // Basic styles
  DEFAULT: { bgcolor: COLORS.DARK_GRAY, color: COLORS.WHITE, size: 14 },
  PRIMARY: { bgcolor: COLORS.DARK_BLUE, color: COLORS.WHITE, size: 14 },
  SUCCESS: { bgcolor: COLORS.SUCCESS, color: COLORS.WHITE, size: 14 },
  WARNING: { bgcolor: COLORS.WARNING, color: COLORS.BLACK, size: 14 },
  ERROR: { bgcolor: COLORS.ERROR, color: COLORS.WHITE, size: 14 },
  
  // Status indicators
  ACTIVE: { bgcolor: COLORS.SUCCESS, color: COLORS.WHITE, size: 12 },
  INACTIVE: { bgcolor: COLORS.GRAY, color: COLORS.WHITE, size: 12 },
  DISABLED: { bgcolor: COLORS.DARK_GRAY, color: COLORS.LIGHT_GRAY, size: 12 },
  
  // Special purposes
  COUNTER: { bgcolor: COLORS.DARK_BLUE, color: COLORS.YELLOW, size: 18 },
  TIMER: { bgcolor: COLORS.BLACK, color: COLORS.GREEN, size: 16 },
  SCORE: { bgcolor: COLORS.NAVY, color: COLORS.WHITE, size: 20 },
  
  // Team colors (for esports)
  TEAM_LEFT: { bgcolor: COLORS.STREAMDECK_BLUE, color: COLORS.WHITE, size: 14 },
  TEAM_RIGHT: { bgcolor: COLORS.STREAMDECK_RED, color: COLORS.WHITE, size: 14 },
  
  // Clear/blank
  BLANK: { bgcolor: COLORS.BLACK, color: COLORS.BLACK, text: '' }
} as const;

/**
 * Create a button style with custom overrides
 */
export function createButtonStyle(
  preset: keyof typeof BUTTON_PRESETS | string,
  overrides: Partial<ButtonStyle> = {}
): ButtonStyle {
  // allow using named presets that may come from other modules or strings
  const base = (BUTTON_PRESETS as any)[preset] ?? {};
  return { ...base, ...overrides } as ButtonStyle;
}

// =============================================================================
// ANIMATION UTILITIES
// =============================================================================

/**
 * Flash a button by alternating colors
 */
export async function flashButton(
  client: StreamDeckClient,
  position: ButtonPosition,
  originalStyle: ButtonStyle,
  flashColor: string,
  duration: number = 1000,
  intervals: number = 4
): Promise<void> {
  const flashStyle = { ...originalStyle, bgcolor: flashColor };
  const intervalTime = duration / (intervals * 2);
  
  for (let i = 0; i < intervals; i++) {
    await client.updateButtonStyleBody(position, flashStyle);
    await new Promise(resolve => setTimeout(resolve, intervalTime));
    
    await client.updateButtonStyleBody(position, originalStyle);
    await new Promise(resolve => setTimeout(resolve, intervalTime));
  }
}

/**
 * Animate a countdown on a button
 */
export async function animateCountdown(
  client: StreamDeckClient,
  position: ButtonPosition,
  style: ButtonStyle,
  startValue: number,
  endValue: number = 0,
  interval: number = 1000
): Promise<void> {
  for (let i = startValue; i >= endValue; i--) {
    await client.updateButtonStyleBody(position, {
      ...style,
      text: i.toString()
    });
    
    if (i > endValue) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
}

// =============================================================================
// LAYOUT UTILITIES
// =============================================================================

/**
 * Standard StreamDeck layouts
 */
export const LAYOUTS = {
  STREAMDECK_MINI: { rows: 2, columns: 3 },
  STREAMDECK_ORIGINAL: { rows: 3, columns: 5 },
  STREAMDECK_XL: { rows: 4, columns: 8 },
  STREAMDECK_MK2: { rows: 3, columns: 5 },
  STREAMDECK_PEDAL: { rows: 1, columns: 3 }
} as const;

/**
 * Get all positions for a specific layout
 */
export function getLayoutPositions(
  layout: keyof typeof LAYOUTS,
  page: number = 1
): ButtonPosition[] {
  const { rows, columns } = LAYOUTS[layout];
  return generateButtonGrid(page, rows, columns);
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate button position
 */
export function isValidPosition(position: ButtonPosition, maxRows: number = 8, maxColumns: number = 8): boolean {
  return (
    position.page >= 1 &&
    position.row >= 0 && position.row < maxRows &&
    position.column >= 0 && position.column < maxColumns
  );
}

/**
 * Validate button style
 */
export function isValidStyle(style: ButtonStyle): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (style.bgcolor && !StreamDeckClient.isValidHexColor(style.bgcolor)) {
    errors.push('Invalid background color format');
  }
  
  if (style.color && !StreamDeckClient.isValidHexColor(style.color)) {
    errors.push('Invalid text color format');
  }
  
  if (style.size && (style.size < 8 || style.size > 72)) {
    errors.push('Text size must be between 8 and 72');
  }
  
  if (style.text && style.text.length > 20) {
    errors.push('Text is too long (max 20 characters recommended)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// =============================================================================
// DEBUGGING UTILITIES
// =============================================================================

/**
 * Create a debug grid on StreamDeck showing button positions
 */
export async function createDebugGrid(
  client: StreamDeckClient,
  page: number,
  rows: number,
  columns: number
): Promise<void> {
  const positions = generateButtonGrid(page, rows, columns);
  
  for (const position of positions) {
    const label = `${position.row},${position.column}`;
    await client.updateButtonStyleBody(position, {
      text: label,
      bgcolor: COLORS.DARK_GRAY,
      color: COLORS.WHITE,
      size: 10
    });
    
    // Small delay to prevent overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

/**
 * Clear all buttons on a page
 */
export async function clearPage(
  client: StreamDeckClient,
  page: number,
  rows: number,
  columns: number
): Promise<void> {
  const positions = generateButtonGrid(page, rows, columns);
  
  for (const position of positions) {
    await client.updateButtonStyleBody(position, BUTTON_PRESETS.BLANK);
    await new Promise(resolve => setTimeout(resolve, 20));
  }
}
