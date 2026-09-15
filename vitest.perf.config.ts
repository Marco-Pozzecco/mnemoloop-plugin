import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
	test: {
		environment: 'node',
		globals: true,
		include: ['tests/performance/**/*.perf.ts'],
		setupFiles: ['tests/performance/setup.perf.ts'],
		exclude: ['tests/performance/setup.perf.ts'],
		fileParallelism: false,
		pool: 'forks',
		poolOptions: {
			forks: {
				singleFork: true,
			},
		},
		maxWorkers: 1,
		testTimeout: 600000,
		hookTimeout: 600000,
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			obsidian: path.resolve(__dirname, './tests/helpers/obsidian-stub.ts'),
		},
	},
});
