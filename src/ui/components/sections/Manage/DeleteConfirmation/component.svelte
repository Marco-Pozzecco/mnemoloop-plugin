<script lang="ts">
	import AlertDialog from '@/ui/components/elements/AlertDialog';
	import type ManageDeleteConfirmationProps from './types';

	let { cardLabel, onCancel, onConfirm }: ManageDeleteConfirmationProps = $props();
	let open = $state(true);

	function handleOpenChange(nextOpen: boolean): void {
		open = nextOpen;
		if (!nextOpen) onCancel();
	}
</script>

<AlertDialog.Root bind:open onOpenChange={handleOpenChange}>
	<AlertDialog.Portal>
		<AlertDialog.Overlay />
		<AlertDialog.Content interactOutsideBehavior="close">
			<AlertDialog.Title level={3}>Delete flashcard?</AlertDialog.Title>
			<AlertDialog.Description>
				“{cardLabel}” will be permanently removed from your vault. This cannot be undone.
			</AlertDialog.Description>
			<AlertDialog.Footer>
				<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
				<AlertDialog.Action onclick={onConfirm}>Delete flashcard</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Portal>
</AlertDialog.Root>
