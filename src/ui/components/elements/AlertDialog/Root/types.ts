import type { AlertDialogRootProps as BitsAlertDialogRootProps } from 'bits-ui';
import type { Snippet } from 'svelte';

export default interface AlertDialogRootProps extends Omit<BitsAlertDialogRootProps, 'children'> {
	children?: Snippet;
}
