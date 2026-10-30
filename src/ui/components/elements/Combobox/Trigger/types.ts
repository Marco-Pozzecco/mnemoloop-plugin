import type { Combobox } from 'bits-ui';
import type { Snippet } from 'svelte';

type ComboboxTriggerProps = Combobox.TriggerProps & {
	/** `field` renders the standard 44px field chrome; `bare` is an unstyled button. */
	variant?: 'field' | 'bare';
	ariaLabel?: string;
	class?: string;
	children?: Snippet;
};

export default ComboboxTriggerProps;
