/**
 * Interface for the core SRS logic.
 * Platform-agnostic scheduler.
 */
export interface ISRSProcessor {
  getNextState(current: any, rating: number): any;
  calculateDueDate(interval: number): Date;
}
