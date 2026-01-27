export class Logger {
  private static prefix = '[Knowledge Accelerator]';

  static info(message: string, ...args: any[]): void {
    console.info(`${this.prefix} INFO: ${message}`, ...args);
  }

  static warn(message: string, ...args: any[]): void {
    console.warn(`${this.prefix} WARN: ${message}`, ...args);
  }

  static error(message: string, ...args: any[]): void {
    console.error(`${this.prefix} ERROR: ${message}`, ...args);
  }

  static debug(message: string, ...args: any[]): void {
    // Only log debug in development or if enabled in settings
    // For now, using console.debug
    console.debug(`${this.prefix} DEBUG: ${message}`, ...args);
  }
}
