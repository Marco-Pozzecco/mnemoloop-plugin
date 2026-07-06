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

// @ts-expect-error __LOG_LEVEL__ variable injected at build time
// IF __DEV__ is true, log level is DEBUG, otherwise ERROR
const DEFAULT_LOG_LEVEL = __LOG_LEVEL__ === 'DEBUG' ? LogLevel.DEBUG : LogLevel.ERROR;

// @ts-expect-error __DEV__ variable injected at build time
const MODE = __DEV__ ? 'development' : 'production';

export const env: Env = {
	logLevel: DEFAULT_LOG_LEVEL,
	mode: MODE,
};
