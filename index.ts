/**
 * Server Module Exports
 * 
 * Centralized exports for all server-side modules
 */

// File Watcher
export * from './fileWatcher';
export { getFileWatcher, createFileWatcher } from './fileWatcher';

// Match State Manager
export * from './matchStateManager';
export { getMatchStateManager } from './matchStateManager';

// StreamDeck Companion Module
export * as StreamDeck from './streamdeck';
export {
  StreamDeckClient,
  createStreamDeckClient,
  createLocalStreamDeckClient,
  createRemoteStreamDeckClient,
  COLORS,
  BUTTON_PRESETS,
  LAYOUTS
} from './streamdeck';

// Re-export commonly used types
export type {
  ButtonPosition,
  ButtonStyle,
  StreamDeckConfig,
  StreamDeckEvent
} from './streamdeck';

export type {
  FileWatcherOptions,
  FileChangeCallback
} from './fileWatcher';

export type {
  MatchState as MatchStateType,
  TeamInfo as TeamInfoType,
  MapInfo as MapInfoType,
  GameData,
  ConfigData
} from './matchStateManager';
