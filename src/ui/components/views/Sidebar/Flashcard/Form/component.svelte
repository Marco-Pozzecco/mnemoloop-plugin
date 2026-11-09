<script lang="ts">
	import { Button, Icon } from '@/ui/components/elements';
	import {
		FlashcardForm,
		FlashcardFormActions,
		FlashcardFormMeta,
	} from '@/ui/components/compositions';
	import { FlashcardFormModel } from '@/ui/components/compositions/FlashcardForm/model.svelte';
	import type SidebarFlashcardFormProps from './types';

	let {
		mode,
		card,
		prefillSource,
		contextLabel = '',
		deckOptions,
		onClose,
		onSave,
	}: SidebarFlashcardFormProps = $props();

	// The panel mounts a new form for each open, so seeding local state once is
	// intentional (the card and mode do not change while it is open).
	// svelte-ignore state_referenced_locally
	const form = new FlashcardFormModel(mode, card, prefillSource);
	const canSubmit = $derived(form.contentApi !== null && !form.isSubmitting);
	const title = $derived(mode === 'create' ? 'New flashcard' : 'Edit flashcard');

	async function handleSubmit(): Promise<void> {
		await form.submit(async (payload) => ({ success: await onSave(payload) }));
	}
</script>

<div class="ml-flashcard-form">
	<header class="ml-flashcard-form__header">
		<div class="ml-flashcard-form__header-row">
			<Button
				variant="icon"
				size="small"
				ariaLabel="Back to cards"
				onclick={onClose}
				disabled={form.isSubmitting}
			>
				{#snippet icon()}
					<Icon name="arrow-left" size={16} />
				{/snippet}
			</Button>
			<div class="ml-flashcard-form__header-text">
				<h2 class="ml-flashcard-form__title">{title}</h2>
				{#if contextLabel}
					<p class="ml-flashcard-form__context">{contextLabel}</p>
				{/if}
			</div>
		</div>
		{#if mode === 'edit' && card}
			<FlashcardFormMeta {card} status={form.values.status} />
		{/if}
	</header>

	<div class="ml-flashcard-form__fields">
		<FlashcardForm {form} {deckOptions} idPrefix="ml-sidebar-form" />
	</div>

	<footer class="ml-flashcard-form__footer">
		<FlashcardFormActions
			mode={form.mode}
			isSubmitting={form.isSubmitting}
			{canSubmit}
			onCancel={onClose}
			onSubmit={handleSubmit}
		/>
	</footer>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-flashcard-form {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
		background-color: $background-secondary;
		color: $text-normal;
		font-family: $font-interface;
		font-size: $font-sm;
	}

	.ml-flashcard-form__header {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
		flex: none;
		padding: $spacing-sm;
		border-bottom: 1px solid $background-modifier-border;
	}

	.ml-flashcard-form__header-row {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
	}

	.ml-flashcard-form__header-text {
		min-width: 0;
	}

	.ml-flashcard-form__title {
		margin: 0;
		font-size: $font-md;
		font-weight: $font-semibold;
		line-height: 1.3;
		color: $text-normal;
	}

	.ml-flashcard-form__context {
		margin: 2px 0 0;
		font-size: $font-xs;
		line-height: 1.4;
		color: $text-muted;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ml-flashcard-form__fields {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: $spacing-sm;
	}

	.ml-flashcard-form__footer {
		display: flex;
		align-items: center;
		flex: none;
		padding: $spacing-xs $spacing-sm;
		border-top: 1px solid $background-modifier-border;
		background-color: $background-secondary;
	}
</style>
