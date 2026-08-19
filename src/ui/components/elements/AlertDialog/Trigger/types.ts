import type { AlertDialogTriggerProps as BitsAlertDialogTriggerProps } from 'bits-ui';
import type { Snippet } from 'svelte';

export default interface AlertDialogTriggerProps extends Omit<
	BitsAlertDialogTriggerProps,
	'children'
> {
	class?: string;
	children?: Snippet;
}
