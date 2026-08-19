import type { AlertDialogPortalProps as BitsAlertDialogPortalProps } from 'bits-ui';
import type { Snippet } from 'svelte';

export default interface AlertDialogPortalProps extends Omit<
	BitsAlertDialogPortalProps,
	'children'
> {
	children?: Snippet;
}
