import type { ButtonPosition } from '../core/types';

export interface ButtonStyleOptions {
  text?: string;
  bgcolor?: string;
  color?: string;
  size?: number;
}

/**
 * Interface for StreamDeckClient operations used by fluent chains.
 * This avoids circular dependency issues.
 */
export interface FluentClientInterface {
  // Button operations
  setButtonText(position: ButtonPosition, text: string): Promise<void>;
  setButtonColor(position: ButtonPosition, color: string): Promise<void>;
  setButtonTextColor(position: ButtonPosition, color: string): Promise<void>;
  setButtonTextSize(position: ButtonPosition, size: number): Promise<void>;
  setButtonStyle(position: ButtonPosition, options: ButtonStyleOptions): Promise<void>;
  pressButton(position: ButtonPosition): Promise<void>;
  rotateButton(position: ButtonPosition, direction: 'left' | 'right'): Promise<void>;
  
  // Variable operations
  setCustomVariable(name: string, value: string): Promise<void>;
  setVariable(name: string, value: string): Promise<void>;
  setVariables(variables: Record<string, string>): Promise<void>;
  
  // System operations
  rescanSurfaces(): Promise<void>;
}

export type ConditionFunction = () => boolean;
export type AsyncConditionFunction = () => Promise<boolean>;
