import type { Combobox } from 'bits-ui';
import type { Snippet } from 'svelte';

type ComboboxItemProps = Combobox.ItemProps & {
	class?: string;
	children?: Snippet<[{ selected: boolean }]>;
};

export default ComboboxItemProps;
