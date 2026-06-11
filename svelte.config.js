import { sveltePreprocess } from 'svelte-preprocess';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
	preprocess: sveltePreprocess({
		typescript: {
			tsconfigFile: resolve(__dirname, 'tsconfig.svelte.json'),
		},
	}),
};
