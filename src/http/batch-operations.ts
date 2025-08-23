/**
 * Batch Operations
 * 
 * Handles executing multiple operations in sequence efficiently.
 */

import type { BatchOperation, ButtonPosition } from '../core/types.js';
import type { ButtonOperations } from './button-operations.js';
import type { ButtonStyling } from './button-styling.js';

export class BatchOperations {
  constructor(
    private buttonOps: ButtonOperations,
    private buttonStyling: ButtonStyling
  ) {}

  /**
   * Execute multiple operations in sequence
   */
  async executeBatch(operations: BatchOperation[]): Promise<void> {
    for (const operation of operations) {
      try {
        if (operation.action === 'style' && operation.data) {
          await this.buttonStyling.updateButtonStyleBody(operation.position, operation.data as any);
        } else if (operation.action === 'press') {
          await this.buttonOps.pressButton(operation.position);
        } else if (operation.action === 'down') {
          await this.buttonOps.pressButtonDown(operation.position);
        } else if (operation.action === 'up') {
          await this.buttonOps.releaseButton(operation.position);
        } else if (operation.action === 'rotate-left') {
          await this.buttonOps.rotateLeft(operation.position);
        } else if (operation.action === 'rotate-right') {
          await this.buttonOps.rotateRight(operation.position);
        }
        
        // Small delay between operations to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        console.error(`Batch operation failed for ${JSON.stringify(operation)}:`, error);
        // Continue with other operations
      }
    }
  }
}
