import type { AlertDialogActionProps as BitsAlertDialogActionProps } from 'bits-ui';
import type { Snippet } from 'svelte';
import ButtonProps from '../../Button/types';

export default interface AlertDialogActionProps extends Omit<
	BitsAlertDialogActionProps,
	'children'
> {
	variant?: ButtonProps['variant'];
	class?: string;
	children?: Snippet;
}
