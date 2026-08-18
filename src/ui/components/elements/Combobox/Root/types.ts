import type { Combobox } from 'bits-ui';
import type { Snippet } from 'svelte';

type ComboboxRootProps = Combobox.RootProps & {
	class?: string;
	children?: Snippet;
};

export default ComboboxRootProps;
