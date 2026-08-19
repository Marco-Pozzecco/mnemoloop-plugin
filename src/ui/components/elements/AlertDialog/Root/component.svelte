<script lang="ts">
	import { AlertDialog } from 'bits-ui';
	import type AlertDialogRootProps from './types';

	let {
		open = $bindable(false),
		onOpenChange,
		onOpenChangeComplete,
		children,
	}: AlertDialogRootProps = $props();

	function handleOpenChange(nextOpen: boolean): void {
		open = nextOpen;
		onOpenChange?.(nextOpen);
	}

	function handleOpenChangeComplete(nextOpen: boolean): void {
		onOpenChangeComplete?.(nextOpen);
	}
</script>

<AlertDialog.Root
	bind:open
	onOpenChange={handleOpenChange}
	onOpenChangeComplete={handleOpenChangeComplete}
>
	{@render children?.()}
</AlertDialog.Root>
