/**
 * Simple logger utility for the plugin.
 */
export class Logger {
	private static prefix = '[Knowledge Accelerator]';
	private prefix = '[Knowledge Accelerator]';
	private correlationId: string;

	constructor(correlationId?: string) {
		this.correlationId = correlationId || this.generateCorrelationId();
	}

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

	info(message: string, ...args: any[]): void {
		console.info(`${this.prefix} INFO: ${message}`, ...args);
	}

	warn(message: string, ...args: any[]): void {
		console.warn(`${this.prefix} WARN: ${message}`, ...args);
	}

	error(message: string, ...args: any[]): void {
		console.error(`${this.prefix} ERROR: ${message}`, ...args);
	}

	debug(message: string, ...args: any[]): void {
		// Only log debug in development or if enabled in settings
		// For now, using console.debug
		console.debug(`${this.prefix} DEBUG: ${message}`, ...args);
	}

	private generateCorrelationId(): string {
		return Math.random().toString(36).substring(2, 9);
	}

	getCorrelationId(): string {
		return this.correlationId;
	}
}
