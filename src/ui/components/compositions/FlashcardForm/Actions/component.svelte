<script lang="ts">
	import { Button, Icon } from '@/ui/components/elements';
	import type FlashcardFormActionsProps from './types';

	let { mode, isSubmitting, canSubmit, onCancel, onSubmit, onDelete }: FlashcardFormActionsProps =
		$props();
</script>

<div class="ml-flashcard-form__actions">
	{#if onDelete}
		<Button variant="plain" onclick={onDelete} disabled={isSubmitting}>
			{#snippet icon()}
				<Icon name="trash-2" size={14} />
			{/snippet}
			Delete
		</Button>
	{:else}
		<span></span>
	{/if}
	<div class="ml-flashcard-form__action-buttons">
		<Button variant="secondary" size="small" onclick={onCancel} disabled={isSubmitting}>
			Cancel
		</Button>
		<Button
			variant="primary"
			size="small"
			onclick={onSubmit}
			disabled={!canSubmit || isSubmitting}
		>
			{#if isSubmitting}
				{mode === 'create' ? 'Creating…' : 'Saving…'}
			{:else}
				{mode === 'create' ? 'Create' : 'Save'}
			{/if}
		</Button>
	</div>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-flashcard-form__actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $spacing-xs;
		width: 100%;
	}

	.ml-flashcard-form__action-buttons {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		margin-inline-start: auto;
	}
</style>
