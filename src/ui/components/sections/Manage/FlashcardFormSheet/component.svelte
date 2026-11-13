<script lang="ts">
	import { Sheet } from '@/ui/components/elements';
	import {
		FlashcardForm,
		FlashcardFormActions,
		FlashcardFormDeleteConfirmation,
		FlashcardFormMeta,
	} from '@/ui/components/compositions';
	import { FlashcardFormModel } from '@/ui/components/compositions/FlashcardForm/model.svelte';
	import type FlashcardFormSheetProps from './types';

	let { mode, card, label = 'this flashcard', deckOptions, onClose, onSave, onDelete } =
		$props<FlashcardFormSheetProps>();

	const isCreate = $derived(mode === 'create');
	// The sheet is mounted per card, so seeding the form once is intentional.
	// svelte-ignore state_referenced_locally
	const form = new FlashcardFormModel(mode, card);
	let confirmingDelete = $state(false);

	const canSubmit = $derived(form.contentApi !== null && !form.isSubmitting);

	async function handleSubmit(): Promise<void> {
		await form.submit(async (payload) => ({ success: await onSave(payload) }));
	}

	function handleConfirmDelete(): void {
		confirmingDelete = false;
		onDelete?.();
	}
</script>

{#snippet meta()}
	<FlashcardFormMeta {card} status={form.values.status} />
{/snippet}

<Sheet
	title={isCreate ? 'New flashcard' : 'Edit flashcard'}
	{onClose}
	meta={isCreate ? undefined : meta}
>
	<FlashcardForm {form} {deckOptions} idPrefix="ml-flashcard-form" />

	{#snippet footer()}
		<FlashcardFormActions
			mode={form.mode}
			isSubmitting={form.isSubmitting}
			{canSubmit}
			onCancel={onClose}
			onSubmit={handleSubmit}
			onDelete={!isCreate && onDelete ? () => (confirmingDelete = true) : undefined}
		/>
	{/snippet}
</Sheet>

{#if !isCreate && confirmingDelete}
	<FlashcardFormDeleteConfirmation
		cardLabel={label}
		onCancel={() => (confirmingDelete = false)}
		onConfirm={handleConfirmDelete}
	/>
{/if}
