import type { AlertDialogContentProps as BitsAlertDialogContentProps } from 'bits-ui';
import type { Snippet } from 'svelte';

export default interface AlertDialogContentProps extends Omit<
	BitsAlertDialogContentProps,
	'children'
> {
	class?: string;
	children?: Snippet;
}
