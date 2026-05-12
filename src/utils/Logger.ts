import { env, LogLevel } from '@/env';

export class Logger {
	private static prefix = '[Knowledge Accelerator]';

	static info(message: string, ...args: unknown[]): void {
		if (LogLevel.INFO <= env.logLevel) {
			console.info(`${this.prefix} INFO: ${message}`, ...args);
		}
	}

	static warn(message: string, ...args: unknown[]): void {
		if (LogLevel.WARN <= env.logLevel) {
			console.warn(`${this.prefix} WARN: ${message}`, ...args);
		}
	}

	static error(message: string, ...args: unknown[]): void {
		if (LogLevel.ERROR <= env.logLevel) {
			console.error(`${this.prefix} ERROR: ${message}`, ...args);
		}
	}

	static debug(message: string, ...args: unknown[]): void {
		if (LogLevel.DEBUG <= env.logLevel) {
			console.debug(`${this.prefix} DEBUG: ${message}`, ...args);
		}
	}
}
