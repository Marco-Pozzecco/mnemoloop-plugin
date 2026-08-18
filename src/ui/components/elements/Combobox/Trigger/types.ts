import type { Combobox } from 'bits-ui';
import type { Snippet } from 'svelte';

type ComboboxTriggerProps = Combobox.TriggerProps & {
	ariaLabel?: string;
	class?: string;
	children?: Snippet;
};

export default ComboboxTriggerProps;
