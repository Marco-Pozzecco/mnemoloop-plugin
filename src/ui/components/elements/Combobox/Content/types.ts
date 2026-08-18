import type { Combobox } from 'bits-ui';
import type { Snippet } from 'svelte';

type ComboboxContentProps = Combobox.ContentProps & {
	class?: string;
	children?: Snippet;
};

export default ComboboxContentProps;
