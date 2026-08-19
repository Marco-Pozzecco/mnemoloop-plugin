import type { AlertDialogCancelProps as BitsAlertDialogCancelProps } from 'bits-ui';
import type { Snippet } from 'svelte';

export default interface AlertDialogCancelProps extends Omit<
	BitsAlertDialogCancelProps,
	'children'
> {
	class?: string;
	children?: Snippet;
}
