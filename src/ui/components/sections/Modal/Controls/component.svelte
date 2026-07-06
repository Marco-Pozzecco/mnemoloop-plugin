<script lang="ts">
	import { Button } from '@/ui/components/elements';
	import type ModalControlsProps from './types';

	let { controller }: ModalControlsProps = $props();
	const { isLoading } = $derived(controller.state);

	function handleConfirm() {
		controller.onConfirm();
	}

	function handleCancel() {
		controller.onCancel();
	}
</script>

<div class="ml-modal-controls">
	<Button variant="secondary" onclick={handleCancel} disabled={isLoading}>Cancel</Button>
	<Button variant="primary" onclick={handleConfirm} disabled={isLoading}>
		{isLoading ? 'Saving...' : 'Save'}
	</Button>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-modal-controls {
		display: flex;
		justify-content: flex-end;
		gap: $spacing-sm;
		margin-top: $spacing-md;
		padding-top: $spacing-sm;
		border-top: 1px solid $background-modifier-border;
	}
</style>
