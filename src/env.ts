export enum LogLevel {
	OFF, // For production only
	ERROR,
	WARN,
	INFO,
	DEBUG, // For development only
}

interface Env {
	logLevel: LogLevel;
	mode: 'development' | 'production';
}

// @ts-expect-error __DEV__ variable injected at build time
const DEFAULT_LOG_LEVEL = __DEV__ ? LogLevel.DEBUG : LogLevel.OFF;

// @ts-expect-error __DEV__ variable injected at build time
const MODE = __DEV__ ? 'development' : 'production';

export const env: Env = {
	logLevel: DEFAULT_LOG_LEVEL,
	mode: MODE,
};
