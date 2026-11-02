<script lang="ts">
	import { onDestroy } from 'svelte';
	import { CardStatus, CardType } from '@/schemas';
	import {
		Badge,
		Button,
		Collapsible,
		FormField,
		Icon,
		Input,
		Select,
	} from '@/ui/components/elements';
	import { FlashcardFormContentRouter } from '@/ui/components/compositions';
	import { formatDeckList } from '@/utils/deck-utils';
	import type FlashcardFormInlineProps from './types';
	import { FlashcardFormModel } from './model.svelte';
	import { createFlashcard, updateFlashcard, type FlashcardWrite } from './utils';

	let {
		mode,
		card,
		prefillSource,
		contextLabel = '',
		onSaved,
		onCancel,
	}: FlashcardFormInlineProps = $props();

	const cardTypeOptions = [
		{ value: CardType.Basic, label: 'Basic' },
		{ value: CardType.Sequence, label: 'Sequence' },
		{ value: CardType.Quiz, label: 'Quiz' },
		{ value: CardType.Cloze, label: 'Cloze' },
		{ value: CardType.Occlusion, label: 'Occlusion' },
	];

	const statusOptions = [
		{ value: CardStatus.ACTIVE, label: 'ACTIVE' },
		{ value: CardStatus.PAUSED, label: 'PAUSED' },
		{ value: CardStatus.STALE, label: 'STALE' },
	];

	// The panel mounts a new form for each open, so seeding local state once is
	// intentional (the card and mode do not change while it is open).
	// svelte-ignore state_referenced_locally
	const model = new FlashcardFormModel(mode, card, prefillSource);
	// svelte-ignore state_referenced_locally
	let detailsOpen = $state(mode === 'edit');
	let pendingWrite: FlashcardWrite | null = null;

	const deckFormatted = $derived(formatDeckList(model.decks));
	const selectedTypeLabel = $derived(
		cardTypeOptions.find((option) => option.value === model.selectedType)?.label ??
			model.selectedType,
	);
	const canSubmit = $derived(model.contentApi !== null && !model.isSaving);

	onDestroy(() => {
		pendingWrite?.cancel();
		pendingWrite = null;
	});

	async function handleSubmit(): Promise<void> {
		const result = await model.submit((payload) => {
			pendingWrite?.cancel();
			if (model.mode === 'create') {
				pendingWrite = createFlashcard(payload.content, payload.decks, payload.source);
			} else if (card) {
				pendingWrite = updateFlashcard(
					card.uuid,
					payload.content,
					payload.decks,
					payload.source,
					payload.status ?? card.status,
				);
			} else {
				return Promise.resolve({ success: false });
			}
			return pendingWrite.promise;
		});
		pendingWrite = null;
		if (result?.success) onSaved(result.filepath ?? '');
	}
</script>

<div class="ml-flashcard-form">
	<header class="ml-flashcard-form__header">
		<Button
			variant="icon"
			size="small"
			ariaLabel="Back to cards"
			onclick={onCancel}
			disabled={model.isSaving}
		>
			{#snippet icon()}
				<Icon name="arrow-left" size={16} />
			{/snippet}
		</Button>
		<div class="ml-flashcard-form__header-text">
			<h3 class="ml-flashcard-form__title">{mode === 'create' ? 'New card' : 'Edit card'}</h3>
			{#if contextLabel}
				<p class="ml-flashcard-form__context">{contextLabel}</p>
			{/if}
		</div>
	</header>

	<div class="ml-flashcard-form__fields">
		{#if model.error}
			<p class="ml-flashcard-form__error" role="alert">{model.error}</p>
		{/if}

		{#if mode === 'create'}
			<FormField label="Card type" htmlFor="ml-sidebar-form-type">
				<Select
					id="ml-sidebar-form-type"
					options={cardTypeOptions}
					value={model.selectedType}
					disabled={model.isSaving}
					onchange={(value) => model.setType(value)}
				/>
			</FormField>
		{:else}
			<FormField label="Card type">
				<div class="ml-flashcard-form__type-value">
					<Badge variant="neutral">{selectedTypeLabel}</Badge>
				</div>
			</FormField>
		{/if}

		<FlashcardFormContentRouter
			selectedType={model.selectedType}
			{mode}
			{card}
			disabled={model.isSaving}
			onRegister={(api) => model.registerContent(api)}
		/>

		<p class="ml-flashcard-form__source-line" title={model.source.trim() || 'No source'}>
			<span class="ml-flashcard-form__source-icon" aria-hidden="true">
				<Icon name="file-text" size={12} />
			</span>
			<span class="ml-flashcard-form__source-text">{model.source.trim() || 'No source'}</span>
		</p>

		<Collapsible.Root bind:open={detailsOpen} class="ml-flashcard-form__details">
			<Collapsible.Trigger type="button" class="ml-flashcard-form__details-trigger">
				<span>Details</span>
				<Icon name="chevron-right" size={14} class="ml-flashcard-form__details-chevron" />
			</Collapsible.Trigger>
			<Collapsible.Content
				padding="none"
				divided={false}
				class="ml-flashcard-form__details-content"
			>
				<div class="ml-flashcard-form__details-fields">
					<Input
						label="Deck"
						value={deckFormatted}
						placeholder="Example::Nested, New deck"
						helperText="Comma-separated list of decks"
						disabled={model.isSaving}
						onchange={(value) => model.setDecksFromInput(value)}
					/>
					<Input
						label="Source"
						value={model.source}
						placeholder="[[path/to/file]]"
						helperText="Wrap the path in double brackets, e.g. [[path/to/file]]"
						disabled={model.isSaving}
						onchange={(value) => model.setSource(value)}
					/>
					{#if mode === 'edit'}
						<FormField label="Status" htmlFor="ml-sidebar-form-status">
							<Select
								id="ml-sidebar-form-status"
								options={statusOptions}
								value={model.status}
								disabled={model.isSaving}
								onchange={(value) => model.setStatus(value)}
							/>
						</FormField>
					{/if}
				</div>
			</Collapsible.Content>
		</Collapsible.Root>
	</div>

	<footer class="ml-flashcard-form__footer">
		<Button variant="secondary" size="small" onclick={onCancel} disabled={model.isSaving}>
			Cancel
		</Button>
		<Button
			variant="primary"
			size="small"
			onclick={() => void handleSubmit()}
			disabled={!canSubmit}
		>
			{#if model.isSaving}
				{mode === 'create' ? 'Creating…' : 'Saving…'}
			{:else}
				{mode === 'create' ? 'Create' : 'Save'}
			{/if}
		</Button>
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
	}

	.ml-flashcard-form__header {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		flex: none;
		padding: $spacing-sm;
		border-bottom: 1px solid $background-modifier-border;
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
		gap: $spacing-sm;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: $spacing-sm;
	}

	.ml-flashcard-form__footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: $spacing-xs;
		flex: none;
		padding: $spacing-xs $spacing-sm;
		border-top: 1px solid $background-modifier-border;
		background-color: $background-secondary;
	}

	.ml-flashcard-form__error {
		margin: 0;
		padding: $spacing-xs $spacing-sm;
		font-size: $font-sm;
		line-height: 1.4;
		color: $text-error;
		background-color: $status-error-background;
		border-radius: $radius-md;
	}

	.ml-flashcard-form__type-value {
		display: flex;
		align-items: center;
	}

	.ml-flashcard-form__source-line {
		display: flex;
		align-items: center;
		gap: $spacing-xxs;
		min-width: 0;
		margin: 0;
		font-size: $font-xs;
		line-height: 1.4;
		color: $text-muted;
	}

	.ml-flashcard-form__source-icon {
		display: inline-flex;
		flex: none;
		color: $text-faint;
	}

	.ml-flashcard-form__source-text {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.ml-flashcard-form__details) {
		flex: none;
		padding-top: $spacing-xs;
		border-top: 1px solid $background-modifier-border;
	}

	:global(button.ml-flashcard-form__details-trigger.ml-collapsible__trigger) {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: $spacing-xs;
		width: 100%;
		height: auto;
		min-height: 32px;
		margin: 0;
		padding: $spacing-xs 0;
		appearance: none;
		border-radius: 0;
		font-family: inherit;
		font-size: $font-sm;
		font-weight: $font-medium;
		line-height: 1.4;
		color: $text-muted;
		text-align: start;
		background: none;
		border: none;
		box-shadow: none;
		cursor: pointer;
	}

	:global(button.ml-flashcard-form__details-trigger.ml-collapsible__trigger:hover) {
		color: $text-normal;
	}

	:global(button.ml-flashcard-form__details-trigger.ml-collapsible__trigger:focus-visible) {
		outline: 2px solid $interactive-accent;
		outline-offset: -2px;
	}

	:global(.ml-flashcard-form__details-chevron) {
		flex: none;
		margin-inline-start: auto;
		color: $text-faint;
		transition: transform $transition-fast;
	}

	:global(.ml-flashcard-form__details[data-state='open'] .ml-flashcard-form__details-chevron) {
		transform: rotate(90deg);
	}

	.ml-flashcard-form__details-fields {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
		/* Room for the field focus ring inside the collapsible's clipped frame. */
		padding: $spacing-xs 2px 0;
		margin-inline: -2px;
	}

	@media (hover: none) and (pointer: coarse) {
		:global(button.ml-flashcard-form__details-trigger.ml-collapsible__trigger) {
			min-height: 44px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.ml-flashcard-form__details-chevron) {
			transition: none;
		}
	}
</style>
