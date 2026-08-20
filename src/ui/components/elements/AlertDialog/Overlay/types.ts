import type { AlertDialogOverlayProps as BitsAlertDialogOverlayProps } from 'bits-ui';
import type { Snippet } from 'svelte';

export default interface AlertDialogOverlayProps extends Omit<
	BitsAlertDialogOverlayProps,
	'children'
> {
	class?: string;
	children?: Snippet;
}
