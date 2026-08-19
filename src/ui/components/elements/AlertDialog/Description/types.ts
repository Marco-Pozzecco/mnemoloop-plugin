import type { AlertDialogDescriptionProps as BitsAlertDialogDescriptionProps } from 'bits-ui';
import type { Snippet } from 'svelte';

export default interface AlertDialogDescriptionProps extends Omit<
	BitsAlertDialogDescriptionProps,
	'children'
> {
	class?: string;
	children?: Snippet;
}
