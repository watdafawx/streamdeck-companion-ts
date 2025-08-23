import type { ButtonPosition } from '../core/types';
import type { 
  FluentClientInterface, 
  ButtonStyleOptions, 
  ConditionFunction, 
  AsyncConditionFunction 
} from './types';

/**
 * Fluent API for chaining button operations.
 * Allows building complex button updates with method chaining.
 */
export class ButtonChain {
  private operations: Array<() => Promise<void>> = [];
  private chainCondition: (() => boolean | Promise<boolean>) | null = null;
  private chainEnabled = true;

  constructor(
    private client: FluentClientInterface,
    private position: ButtonPosition
  ) {}

  /**
   * Set button text with optional enabled control.
   */
  text(text: string, enabled: boolean = true): this {
    if (enabled) {
      this.operations.push(() => this.client.setButtonText(this.position, text));
    }
    return this;
  }

  /**
   * Set button background color with optional enabled control.
   */
  bgcolor(color: string, enabled: boolean = true): this {
    if (enabled) {
      this.operations.push(() => this.client.setButtonColor(this.position, color));
    }
    return this;
  }

  /**
   * Set button text color with optional enabled control.
   */
  color(color: string, enabled: boolean = true): this {
    if (enabled) {
      this.operations.push(() => this.client.setButtonTextColor(this.position, color));
    }
    return this;
  }

  /**
   * Set button text size with optional enabled control.
   */
  size(size: number, enabled: boolean = true): this {
    if (enabled) {
      this.operations.push(() => this.client.setButtonTextSize(this.position, size));
    }
    return this;
  }

  /**
   * Apply complete button styling in one operation.
   */
  style(options: ButtonStyleOptions, enabled: boolean = true): this {
    if (enabled) {
      this.operations.push(() => this.client.setButtonStyle(this.position, options));
    }
    return this;
  }

  /**
   * Press the button with optional enabled control.
   */
  press(enabled: boolean = true): this {
    if (enabled) {
      this.operations.push(() => this.client.pressButton(this.position));
    }
    return this;
  }

  /**
   * Rotate the button with optional enabled control.
   */
  rotate(direction: 'left' | 'right' = 'right', enabled: boolean = true): this {
    if (enabled) {
      this.operations.push(() => this.client.rotateButton(this.position, direction));
    }
    return this;
  }

  /**
   * Set a custom variable with optional enabled control.
   */
  setCustomVar(name: string, value: string, enabled: boolean = true): this {
    if (enabled) {
      this.operations.push(() => this.client.setCustomVariable(name, value));
    }
    return this;
  }

  /**
   * Set a regular variable with optional enabled control.
   */
  setVar(name: string, value: string, enabled: boolean = true): this {
    if (enabled) {
      this.operations.push(() => this.client.setVariable(name, value));
    }
    return this;
  }

  /**
   * Set multiple variables at once with optional enabled control.
   */
  setVars(variables: Record<string, string>, enabled: boolean = true): this {
    if (enabled) {
      this.operations.push(() => this.client.setVariables(variables));
    }
    return this;
  }

  /**
   * Set a condition that must be true for the entire chain to execute.
   * If condition is false, no operations in the chain will execute.
   */
  when(condition: boolean | ConditionFunction): this {
    if (typeof condition === 'function') {
      this.chainCondition = condition;
    } else {
      this.chainCondition = () => condition;
    }
    return this;
  }

  /**
   * Set an async condition that must be true for the entire chain to execute.
   */
  whenAsync(condition: AsyncConditionFunction): this {
    this.chainCondition = condition;
    return this;
  }

  /**
   * Set a condition that must be false for the entire chain to execute.
   * Inverse of when().
   */
  unless(condition: boolean | ConditionFunction): this {
    if (typeof condition === 'function') {
      this.chainCondition = () => !condition();
    } else {
      this.chainCondition = () => !condition;
    }
    return this;
  }

  /**
   * Set an async condition that must be false for the entire chain to execute.
   * Inverse of whenAsync().
   */
  unlessAsync(condition: AsyncConditionFunction): this {
    this.chainCondition = async () => !(await condition());
    return this;
  }

  /**
   * Execute all queued operations if the chain condition is met.
   */
  async apply(): Promise<void> {
    // Check chain condition if set
    if (this.chainCondition) {
      const shouldExecute = await this.chainCondition();
      if (!shouldExecute) {
        return; // Skip all operations
      }
    }

    // Execute all queued operations
    for (const operation of this.operations) {
      await operation();
    }

    // Clear operations after execution
    this.operations = [];
  }

  /**
   * Execute all queued operations and return the client for continued chaining.
   * Useful for chaining across different operation types.
   */
  async applyAndContinue(): Promise<FluentClientInterface> {
    await this.apply();
    return this.client;
  }
}
