<script lang="ts">
	import { AlertDialog } from 'bits-ui';
	import type AlertDialogActionProps from './types';
	import Button from '@/ui/components/elements/Button/component.svelte';

	let {
		class: className = '',
		variant = 'danger',
		children,
		...rest
	}: AlertDialogActionProps = $props();
</script>

<AlertDialog.Action {...rest} class="ml-alert-dialog__action {className}">
	{#snippet child({ props })}
		<Button {...props} size="medium" {variant}>
			{@render children?.()}
		</Button>
	{/snippet}
</AlertDialog.Action>

<style lang="scss">
	:global(.ml-alert-dialog__action) {
		min-width: 7rem;
	}
</style>
