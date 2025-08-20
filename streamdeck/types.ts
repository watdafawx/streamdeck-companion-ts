/**
+ * StreamDeck Companion API Types
+ *
+ * ## Overview
+ * Centralized type definitions and error class used across the library. Keep
+ * these types minimal and purely structural so they can be consumed by both TS
+ * and JS projects (via generated d.ts files).
+ */

// Button position coordinates
export interface ButtonPosition {
  page: number;
  row: number;
  column: number;
}

// Style configuration for buttons
export interface ButtonStyle {
  text?: string;
  bgcolor?: string; // HEX color code
  color?: string;   // HEX color code for text
  size?: number;    // Text size in pixels
}

// Custom variable operations
export interface CustomVariable {
  name: string;
  value: string;
}

// Module variable reference
export interface ModuleVariable {
  connectionLabel: string;
  name: string;
}

// API response types
export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// Button action types
export type ButtonAction = 'press' | 'down' | 'up' | 'rotate-left' | 'rotate-right';

// Configuration for StreamDeck client
export interface StreamDeckConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  defaultHeaders?: Record<string, string>;
  enableCaching?: boolean; // Enable/disable button state caching to prevent duplicate requests
  nonBlockingAnimations?: boolean; // Use fire-and-forget requests for animations (default: true)
}

// Event types for StreamDeck operations
export interface StreamDeckEvent {
  type: 'button' | 'style' | 'variable' | 'system';
  action: string;
  position?: ButtonPosition;
  data?: any;
  timestamp: number;
}

// Batch operation for multiple button updates
export interface BatchOperation {
  position: ButtonPosition;
  action: ButtonAction | 'style';
  data?: ButtonStyle | { step: number };
}

// Error types
export class StreamDeckError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'StreamDeckError';
  }
}

// Connection status
export interface ConnectionStatus {
  connected: boolean;
  lastPing?: number;
  version?: string;
  surfaces?: number;
}

// Surface information
export interface SurfaceInfo {
  id: string;
  name: string;
  type: string;
  size: {
    rows: number;
    columns: number;
  };
}
