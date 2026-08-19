import type { AlertDialogTitleProps as BitsAlertDialogTitleProps } from 'bits-ui';
import type { Snippet } from 'svelte';

export default interface AlertDialogTitleProps extends Omit<BitsAlertDialogTitleProps, 'children'> {
	class?: string;
	children?: Snippet;
}
