<script lang="ts">
	import { AlertDialog } from 'bits-ui';
	import type AlertDialogCancelProps from './types';
	import { Button } from '../..';
	import { cn } from '@/ui/components/utils';

	let { class: className = '', children, ...rest }: AlertDialogCancelProps = $props();
</script>

<AlertDialog.Cancel {...rest} class={cn('ml-alert-dialog__cancel', className)}>
	{#snippet child({ props })}
		<Button {...props} size="medium" variant="secondary">
			{@render children?.()}
		</Button>
	{/snippet}
</AlertDialog.Cancel>

<style lang="scss">
	:global(.ml-alert-dialog__cancel) {
		min-width: 7rem;
	}
</style>
