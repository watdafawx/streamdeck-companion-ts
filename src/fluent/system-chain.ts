import type { 
  FluentClientInterface, 
  ConditionFunction, 
  AsyncConditionFunction 
} from './types';

/**
 * Fluent API for chaining system-wide operations.
 * Allows building complex system updates with method chaining.
 */
export class SystemChain {
  private operations: Array<() => Promise<void>> = [];
  private chainCondition: (() => boolean | Promise<boolean>) | null = null;

  constructor(private client: FluentClientInterface) {}

  /**
   * Set a variable with optional enabled control.
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
   * Rescan all Stream Deck surfaces with optional enabled control.
   */
  rescanSurfaces(enabled: boolean = true): this {
    if (enabled) {
      this.operations.push(() => this.client.rescanSurfaces());
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
