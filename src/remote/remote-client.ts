/**
 * StreamDeck Companion Remote Control (TCP/UDP)
 * 
 * ## Overview
 * Provides TCP and UDP remote control capabilities for StreamDeck Companion.
 * This module is Node.js only and provides an alternative to HTTP-based control.
 * 
 * ## Port Information
 * - TCP Port: 16759
 * - UDP Port: 16759
 * 
 * ## Command Format
 * Commands are sent as plain text strings following the Companion protocol:
 * - SURFACE <surface id> PAGE-SET <page number>
 * - SURFACE <surface id> PAGE-UP
 * - SURFACE <surface id> PAGE-DOWN
 * - LOCATION <page>/<row>/<column> PRESS
 * - LOCATION <page>/<row>/<column> DOWN
 * - LOCATION <page>/<row>/<column> UP
 * - LOCATION <page>/<row>/<column> ROTATE-LEFT
 * - LOCATION <page>/<row>/<column> ROTATE-RIGHT
 * - LOCATION <page>/<row>/<column> SET-STEP <step>
 * - LOCATION <page>/<row>/<column> STYLE TEXT <text>
 * - LOCATION <page>/<row>/<column> STYLE COLOR <color HEX>
 * - LOCATION <page>/<row>/<column> STYLE BGCOLOR <color HEX>
 * - CUSTOM-VARIABLE <name> SET-VALUE <value>
 * - SURFACES RESCAN
 * 
 * ## Examples
 * ```ts
 * import { RemoteClient } from './streamdeck/remote';
 * 
 * const client = new RemoteClient({ host: 'localhost', protocol: 'tcp' });
 * await client.connect();
 * 
 * // Press a button
 * await client.pressButton({ page: 1, row: 2, column: 3 });
 * 
 * // Set surface to page 23
 * await client.setSurfacePage('emulator', 23);
 * 
 * // Change button text
 * await client.setButtonText({ page: 1, row: 0, column: 0 }, 'Hello');
 * ```
 */

import type { ButtonPosition, ButtonStyle, CustomVariable } from '../core/types.js';
import { StreamDeckError } from '../core/types.js';

// Node.js imports - these will only work in Node.js environment
let net: any;
let dgram: any;
let NodeBuffer: any;
let NodeProcess: any;

// Dynamically import Node.js modules to avoid issues in browser environments
async function ensureNodeModules() {
  if (typeof window !== 'undefined') {
    throw new StreamDeckError(
      'Remote control (TCP/UDP) is only available in Node.js environments',
      'BROWSER_NOT_SUPPORTED'
    );
  }
  
  if (!net || !dgram) {
    try {
      net = await import('net');
      dgram = await import('dgram');
      NodeBuffer = (await import('buffer')).Buffer;
      NodeProcess = (await import('process')).default;
    } catch (error) {
      throw new StreamDeckError(
        'Failed to import Node.js modules for TCP/UDP support',
        'NODE_MODULES_UNAVAILABLE',
        undefined,
        error
      );
    }
  }
}

export interface RemoteConfig {
  host?: string;
  port?: number;
  protocol?: 'tcp' | 'udp';
  timeout?: number;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export interface SurfaceCommand {
  surfaceId: string;
  action: 'PAGE-SET' | 'PAGE-UP' | 'PAGE-DOWN';
  pageNumber?: number;
}

export interface LocationCommand {
  position: ButtonPosition;
  action: 'PRESS' | 'DOWN' | 'UP' | 'ROTATE-LEFT' | 'ROTATE-RIGHT' | 'SET-STEP';
  step?: number;
}

export interface StyleCommand {
  position: ButtonPosition;
  property: 'TEXT' | 'COLOR' | 'BGCOLOR';
  value: string;
}

export class RemoteClient {
  private config: Required<RemoteConfig>;
  private socket: any = null;
  private connected: boolean = false;
  private reconnectTimer: any = null;
  private messageQueue: string[] = [];
  private eventListeners: Set<(event: any) => void> = new Set();

  constructor(config: RemoteConfig = {}) {
    this.config = {
      host: config.host || 'localhost',
      port: config.port || 16759,
      protocol: config.protocol || 'tcp',
      timeout: config.timeout || 5000,
      reconnectAttempts: config.reconnectAttempts || 3,
      reconnectDelay: config.reconnectDelay || 1000
    };
  }

  /**
   * Connect to StreamDeck Companion
   */
  async connect(): Promise<void> {
    await ensureNodeModules();
    
    if (this.connected) {
      return;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.cleanup();
        reject(new StreamDeckError(
          `Connection timeout after ${this.config.timeout}ms`,
          'CONNECTION_TIMEOUT'
        ));
      }, this.config.timeout);

      try {
        if (this.config.protocol === 'tcp') {
          this.connectTcp(resolve, reject, timeout);
        } else {
          this.connectUdp(resolve, reject, timeout);
        }
      } catch (error) {
        clearTimeout(timeout);
        reject(new StreamDeckError(
          `Failed to create ${this.config.protocol.toUpperCase()} connection`,
          'CONNECTION_FAILED',
          undefined,
          error
        ));
      }
    });
  }

  private connectTcp(resolve: () => void, reject: (error: Error) => void, timeout: any) {
    this.socket = new net.Socket();
    
    this.socket.connect(this.config.port, this.config.host, () => {
      clearTimeout(timeout);
      this.connected = true;
      this.emitEvent({ type: 'connection', action: 'connected', timestamp: Date.now() });
      
      // Send any queued messages
      this.flushMessageQueue();
      resolve();
    });

    this.socket.on('error', (error: Error) => {
      clearTimeout(timeout);
      this.connected = false;
      this.emitEvent({ type: 'connection', action: 'error', data: error, timestamp: Date.now() });
      
      if (!this.connected) {
        reject(new StreamDeckError(
          `TCP connection failed: ${error.message}`,
          'TCP_CONNECTION_FAILED',
          undefined,
          error
        ));
      } else {
        this.attemptReconnect();
      }
    });

    this.socket.on('close', () => {
      this.connected = false;
      this.emitEvent({ type: 'connection', action: 'disconnected', timestamp: Date.now() });
      this.attemptReconnect();
    });

    this.socket.on('data', (data: Buffer) => {
      this.emitEvent({ 
        type: 'message', 
        action: 'received', 
        data: data.toString().trim(), 
        timestamp: Date.now() 
      });
    });
  }

  private connectUdp(resolve: () => void, reject: (error: Error) => void, timeout: any) {
    this.socket = dgram.createSocket('udp4');
    
    this.socket.on('error', (error: Error) => {
      clearTimeout(timeout);
      this.connected = false;
      this.emitEvent({ type: 'connection', action: 'error', data: error, timestamp: Date.now() });
      reject(new StreamDeckError(
        `UDP socket error: ${error.message}`,
        'UDP_CONNECTION_FAILED',
        undefined,
        error
      ));
    });

    this.socket.on('message', (msg: Buffer, rinfo: any) => {
      this.emitEvent({ 
        type: 'message', 
        action: 'received', 
        data: msg.toString().trim(),
        remote: rinfo,
        timestamp: Date.now() 
      });
    });

    // For UDP, we consider it "connected" immediately since it's connectionless
    clearTimeout(timeout);
    this.connected = true;
    this.emitEvent({ type: 'connection', action: 'connected', timestamp: Date.now() });
    this.flushMessageQueue();
    resolve();
  }

  /**
   * Disconnect from StreamDeck Companion
   */
  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      if (this.config.protocol === 'tcp') {
        this.socket.destroy();
      } else {
        this.socket.close();
      }
      this.socket = null;
    }

    this.connected = false;
    this.emitEvent({ type: 'connection', action: 'disconnected', timestamp: Date.now() });
  }

  /**
   * Send a raw command string
   */
  async sendCommand(command: string): Promise<void> {
    if (!this.connected) {
      if (this.config.reconnectAttempts > 0) {
        this.messageQueue.push(command);
        await this.connect();
        return;
      } else {
        throw new StreamDeckError('Not connected to StreamDeck Companion', 'NOT_CONNECTED');
      }
    }

    return new Promise((resolve, reject) => {
      try {
        if (this.config.protocol === 'tcp') {
          this.socket.write(command + '\n', (error: Error) => {
            if (error) {
              reject(new StreamDeckError(
                `Failed to send TCP command: ${error.message}`,
                'SEND_FAILED',
                undefined,
                error
              ));
            } else {
              this.emitEvent({ 
                type: 'command', 
                action: 'sent', 
                data: command, 
                timestamp: Date.now() 
              });
              resolve();
            }
          });
        } else {
          const message = NodeBuffer.from(command);
          this.socket.send(message, 0, message.length, this.config.port, this.config.host, (error: Error) => {
            if (error) {
              reject(new StreamDeckError(
                `Failed to send UDP command: ${error.message}`,
                'SEND_FAILED',
                undefined,
                error
              ));
            } else {
              this.emitEvent({ 
                type: 'command', 
                action: 'sent', 
                data: command, 
                timestamp: Date.now() 
              });
              resolve();
            }
          });
        }
      } catch (error) {
        reject(new StreamDeckError(
          `Failed to send command: ${(error as Error).message}`,
          'SEND_FAILED',
          undefined,
          error
        ));
      }
    });
  }

  // =============================================================================
  // SURFACE COMMANDS
  // =============================================================================

  /**
   * Set a surface to a specific page
   * Command: SURFACE <surface id> PAGE-SET <page number>
   */
  async setSurfacePage(surfaceId: string, pageNumber: number): Promise<void> {
    const command = `SURFACE ${surfaceId} PAGE-SET ${pageNumber}`;
    await this.sendCommand(command);
  }

  /**
   * Page up on a specific surface
   * Command: SURFACE <surface id> PAGE-UP
   */
  async surfacePageUp(surfaceId: string): Promise<void> {
    const command = `SURFACE ${surfaceId} PAGE-UP`;
    await this.sendCommand(command);
  }

  /**
   * Page down on a specific surface
   * Command: SURFACE <surface id> PAGE-DOWN
   */
  async surfacePageDown(surfaceId: string): Promise<void> {
    const command = `SURFACE ${surfaceId} PAGE-DOWN`;
    await this.sendCommand(command);
  }

  // =============================================================================
  // BUTTON ACTIONS
  // =============================================================================

  /**
   * Press and release a button (run both down and up actions)
   * Command: LOCATION <page>/<row>/<column> PRESS
   */
  async pressButton(position: ButtonPosition): Promise<void> {
    const command = `LOCATION ${position.page}/${position.row}/${position.column} PRESS`;
    await this.sendCommand(command);
  }

  /**
   * Press the button (run down actions)
   * Command: LOCATION <page>/<row>/<column> DOWN
   */
  async pressButtonDown(position: ButtonPosition): Promise<void> {
    const command = `LOCATION ${position.page}/${position.row}/${position.column} DOWN`;
    await this.sendCommand(command);
  }

  /**
   * Release the button (run up actions)
   * Command: LOCATION <page>/<row>/<column> UP
   */
  async releaseButton(position: ButtonPosition): Promise<void> {
    const command = `LOCATION ${position.page}/${position.row}/${position.column} UP`;
    await this.sendCommand(command);
  }

  /**
   * Trigger a left rotation of the button/encoder
   * Command: LOCATION <page>/<row>/<column> ROTATE-LEFT
   */
  async rotateLeft(position: ButtonPosition): Promise<void> {
    const command = `LOCATION ${position.page}/${position.row}/${position.column} ROTATE-LEFT`;
    await this.sendCommand(command);
  }

  /**
   * Trigger a right rotation of the button/encoder
   * Command: LOCATION <page>/<row>/<column> ROTATE-RIGHT
   */
  async rotateRight(position: ButtonPosition): Promise<void> {
    const command = `LOCATION ${position.page}/${position.row}/${position.column} ROTATE-RIGHT`;
    await this.sendCommand(command);
  }

  /**
   * Set the current step of a button/encoder
   * Command: LOCATION <page>/<row>/<column> SET-STEP <step>
   */
  async setButtonStep(position: ButtonPosition, step: number): Promise<void> {
    const command = `LOCATION ${position.page}/${position.row}/${position.column} SET-STEP ${step}`;
    await this.sendCommand(command);
  }

  // =============================================================================
  // BUTTON STYLING
  // =============================================================================

  /**
   * Change text on a button
   * Command: LOCATION <page>/<row>/<column> STYLE TEXT <text>
   */
  async setButtonText(position: ButtonPosition, text: string): Promise<void> {
    const command = `LOCATION ${position.page}/${position.row}/${position.column} STYLE TEXT ${text}`;
    await this.sendCommand(command);
  }

  /**
   * Change text color on a button
   * Command: LOCATION <page>/<row>/<column> STYLE COLOR <color HEX>
   */
  async setButtonTextColor(position: ButtonPosition, color: string): Promise<void> {
    // Ensure color starts with # for hex format
    const hexColor = color.startsWith('#') ? color : `#${color}`;
    const command = `LOCATION ${position.page}/${position.row}/${position.column} STYLE COLOR ${hexColor}`;
    await this.sendCommand(command);
  }

  /**
   * Change background color on a button
   * Command: LOCATION <page>/<row>/<column> STYLE BGCOLOR <color HEX>
   */
  async setButtonBackgroundColor(position: ButtonPosition, color: string): Promise<void> {
    // Ensure color starts with # for hex format
    const hexColor = color.startsWith('#') ? color : `#${color}`;
    const command = `LOCATION ${position.page}/${position.row}/${position.column} STYLE BGCOLOR ${hexColor}`;
    await this.sendCommand(command);
  }

  /**
   * Update multiple button style properties
   */
  async updateButtonStyle(position: ButtonPosition, style: ButtonStyle): Promise<void> {
    const commands: string[] = [];
    
    if (style.text !== undefined) {
      commands.push(`LOCATION ${position.page}/${position.row}/${position.column} STYLE TEXT ${style.text}`);
    }
    
    if (style.color !== undefined) {
      const hexColor = style.color.startsWith('#') ? style.color : `#${style.color}`;
      commands.push(`LOCATION ${position.page}/${position.row}/${position.column} STYLE COLOR ${hexColor}`);
    }
    
    if (style.bgcolor !== undefined) {
      const hexColor = style.bgcolor.startsWith('#') ? style.bgcolor : `#${style.bgcolor}`;
      commands.push(`LOCATION ${position.page}/${position.row}/${position.column} STYLE BGCOLOR ${hexColor}`);
    }

    // Send commands sequentially with a small delay
    for (const command of commands) {
      await this.sendCommand(command);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  // =============================================================================
  // CUSTOM VARIABLES
  // =============================================================================

  /**
   * Change custom variable value
   * Command: CUSTOM-VARIABLE <name> SET-VALUE <value>
   */
  async setCustomVariable(name: string, value: string): Promise<void> {
    const command = `CUSTOM-VARIABLE ${name} SET-VALUE ${value}`;
    await this.sendCommand(command);
  }

  // =============================================================================
  // SYSTEM OPERATIONS
  // =============================================================================

  /**
   * Make Companion rescan for USB surfaces
   * Command: SURFACES RESCAN
   */
  async rescanSurfaces(): Promise<void> {
    const command = 'SURFACES RESCAN';
    await this.sendCommand(command);
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<RemoteConfig> {
    return { ...this.config };
  }

  /**
   * Add event listener for remote operations
   */
  addEventListener(listener: (event: any) => void): () => void {
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
  // PRIVATE METHODS
  // =============================================================================

  private cleanup(): void {
    if (this.socket) {
      try {
        if (this.config.protocol === 'tcp') {
          this.socket.destroy();
        } else {
          this.socket.close();
        }
      } catch (error) {
        // Ignore cleanup errors
      }
      this.socket = null;
    }
    this.connected = false;
  }

  private emitEvent(event: any): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in RemoteClient event listener:', error);
      }
    });
  }

  private flushMessageQueue(): void {
    if (this.messageQueue.length > 0 && this.connected) {
      const queue = [...this.messageQueue];
      this.messageQueue = [];
      
      // Send queued messages with delays
      queue.forEach((command, index) => {
        setTimeout(() => {
          this.sendCommand(command).catch(error => {
            console.error('Failed to send queued command:', error);
          });
        }, index * 50); // 50ms delay between commands
      });
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectTimer) {
      return; // Already attempting reconnect
    }

    let attempts = 0;
    const tryReconnect = () => {
      attempts++;
      
      if (attempts > this.config.reconnectAttempts) {
        this.emitEvent({ 
          type: 'connection', 
          action: 'reconnect-failed', 
          data: { attempts }, 
          timestamp: Date.now() 
        });
        return;
      }

      this.emitEvent({ 
        type: 'connection', 
        action: 'reconnecting', 
        data: { attempt: attempts }, 
        timestamp: Date.now() 
      });

      this.connect()
        .then(() => {
          this.reconnectTimer = null;
          this.emitEvent({ 
            type: 'connection', 
            action: 'reconnected', 
            data: { attempts }, 
            timestamp: Date.now() 
          });
        })
        .catch(() => {
          this.reconnectTimer = setTimeout(tryReconnect, this.config.reconnectDelay);
        });
    };

    this.reconnectTimer = setTimeout(tryReconnect, this.config.reconnectDelay);
  }
}

/**
 * Utility function to check if remote control is available in the current environment
 */
export function isRemoteAvailable(): boolean {
  try {
    return typeof window === 'undefined' && typeof NodeProcess !== 'undefined' && Boolean(NodeProcess.versions?.node);
  } catch {
    return false;
  }
}

/**
 * Factory function to create a RemoteClient with error handling for browser environments
 */
export function createRemoteClient(config?: RemoteConfig): RemoteClient {
  if (!isRemoteAvailable()) {
    throw new StreamDeckError(
      'Remote control (TCP/UDP) is only available in Node.js environments',
      'BROWSER_NOT_SUPPORTED'
    );
  }
  
  return new RemoteClient(config);
}
