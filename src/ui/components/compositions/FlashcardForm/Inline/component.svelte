<script lang="ts">
	import { onDestroy } from 'svelte';
	import { EventBus } from '@/modules/events/core';
	import {
		FlashcardWriterCreateRequestEvent,
		FlashcardWriterCreateResponseEvent,
		FlashcardWriterUpdateRequestEvent,
		FlashcardWriterUpdateResponseEvent,
	} from '@/modules/events/domains/flashcard/writer';
	import { CardType } from '@/schemas';
	import type { Flashcard } from '@/schemas';
	import { Banner, Button, FormField, Input, Tabs } from '@/ui/components/elements';
	import { parseDeckList, formatDeckList } from '@/utils/deck-utils';
	import FormContent from '../Content';
	import type { BuildContentFn, ValidateFn } from '../Content/types';
	import type FlashcardFormInlineProps from './types';

	let { mode, card, prefillSource, onSaved, onCancel }: FlashcardFormInlineProps = $props();

	const cardTypeOptions = [
		{ value: CardType.Basic, label: 'Basic' },
		{ value: CardType.Sequence, label: 'Sequence' },
		{ value: CardType.Quiz, label: 'Quiz' },
		{ value: CardType.Cloze, label: 'Cloze' },
		{ value: CardType.Occlusion, label: 'Occlusion' },
	];

	// --- Form state ---
	let selectedType: string = $state(CardType.Basic);

	// Shared metadata (renders once for all types)
	let deck: string[] = $state([]);
	let deckFormatted = $derived(formatDeckList(deck));
	let source = $state('');

	// --- Content child API ---
	let contentApi: { validate: ValidateFn; buildContent: BuildContentFn } | null = $state(null);

	// --- Saving state ---
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	/** The response subscription of the submission in flight, if any. */
	let pendingUnsub: (() => void) | null = null;

	// --- Init from props ---
	$effect(() => {
		if (mode === 'edit' && card) {
			selectedType = card.card_type;
			deck = card.decks ?? [];
			source = card.source ?? '';
		} else if (mode === 'create' && prefillSource) {
			source = prefillSource;
		}
	});

	// --- Type change (create mode only) ---
	// Per-type state resets automatically via {#key selectedType} remount.
	function handleTypeChange(value: string): void {
		if (mode === 'edit') return;
		selectedType = value;
	}

	// --- Content child registration ---
	function handleRegister(api: { validate: ValidateFn; buildContent: BuildContentFn }): void {
		contentApi = api;
	}

	function handleDeckChange(value: string): void {
		deck = parseDeckList(value);
	}

	function settle(): void {
		pendingUnsub?.();
		pendingUnsub = null;
		isLoading = false;
	}

	function fail(e?: unknown): void {
		settle();
		error =
			typeof e === 'string'
				? e
				: e instanceof Error
					? e.message
					: 'Could not save the flashcard. Try again.';
	}

	// --- Submission ---
	function handleSubmit(): void {
		if (isLoading) return;
		if (!contentApi) {
			error = 'The form is not ready. Try again.';
			return;
		}

		const validationError = contentApi.validate();
		if (validationError) {
			error = validationError;
			return;
		}

		error = null;
		isLoading = true;

		const content = contentApi.buildContent();
		const decks = deck.filter((d) => d.trim() !== '');
		const sourceValue = source.trim() || null;

		try {
			if (mode === 'create') {
				const request = new FlashcardWriterCreateRequestEvent({
					content,
					source: sourceValue,
					decks,
				});
				pendingUnsub = EventBus.instance.subscribe(
					FlashcardWriterCreateResponseEvent,
					async (response) => {
						// Correlate by request id: the panel and a modal can both have a
						// form open, and only the form that submitted may settle.
						if (response.data.requestId !== request.id) return;
						if (!response.data.success) {
							fail();
							return;
						}
						settle();
						onSaved(response.data.filepath);
					},
				);
				EventBus.instance.publish(request);
			} else if (card) {
				const request = new FlashcardWriterUpdateRequestEvent({
					uuid: card.uuid,
					content,
					decks,
					source: sourceValue,
				} as Partial<Flashcard>);
				pendingUnsub = EventBus.instance.subscribe(
					FlashcardWriterUpdateResponseEvent,
					async (response) => {
						if (response.data.requestId !== request.id) return;
						if (!response.data.success) {
							fail();
							return;
						}
						settle();
						onSaved(response.data.filepath);
					},
				);
				EventBus.instance.publish(request);
			} else {
				fail('The flashcard to edit is missing.');
			}
		} catch (e) {
			fail(e);
		}
	}

	onDestroy(() => {
		pendingUnsub?.();
		pendingUnsub = null;
	});
</script>

<div class="ml-flashcard-form">
	{#if error}
		<Banner
			banner={{
				id: 'flashcard-form-error',
				view: 'review',
				message: error,
				icon: 'alert-circle',
			}}
			onDismiss={() => (error = null)}
		/>
	{/if}

	<!-- Card Type -->
	<FormField label="Card type">
		<Tabs.Root value={selectedType} onValueChange={handleTypeChange}>
			<Tabs.List className="ml-card-type-tabs-list">
				{#each cardTypeOptions as tab (tab.value)}
					<Tabs.Trigger value={tab.value} disabled={mode === 'edit' || isLoading}>
						{tab.label}
					</Tabs.Trigger>
				{/each}
			</Tabs.List>
		</Tabs.Root>
	</FormField>

	{#key selectedType}
		{#if selectedType === CardType.Basic}
			<FormContent.Basic
				{mode}
				initialContent={card?.content}
				onRegister={handleRegister}
				disabled={isLoading}
			/>
		{:else if selectedType === CardType.Sequence}
			<FormContent.Sequence
				{mode}
				initialContent={card?.content}
				onRegister={handleRegister}
				disabled={isLoading}
			/>
		{:else if selectedType === CardType.Quiz}
			<FormContent.Quiz
				{mode}
				initialContent={card?.content}
				onRegister={handleRegister}
				disabled={isLoading}
			/>
		{:else if selectedType === CardType.Cloze}
			<FormContent.Cloze
				{mode}
				initialContent={card?.content}
				onRegister={handleRegister}
				disabled={isLoading}
			/>
		{:else if selectedType === CardType.Occlusion}
			<FormContent.Occlusion
				{mode}
				initialContent={card?.content}
				onRegister={handleRegister}
				disabled={isLoading}
			/>
		{/if}
	{/key}

	<!-- Shared metadata -->
	<Input
		label="Deck"
		value={deckFormatted}
		placeholder="Example::Nested, New deck"
		helperText="Comma-separated list of decks"
		disabled={isLoading}
		onchange={handleDeckChange}
	/>
	<Input
		label="Source"
		value={source}
		placeholder="[[path/to/file]]"
		helperText="Wrap the path in double brackets, e.g. [[path/to/file]]"
		disabled={isLoading}
		onchange={(v) => (source = v)}
	/>

	<div class="ml-flashcard-form__actions">
		<Button variant="secondary" onclick={onCancel} disabled={isLoading}>Cancel</Button>
		<Button variant="primary" onclick={handleSubmit} disabled={isLoading}>
			{isLoading ? 'Saving...' : 'Save'}
		</Button>
	</div>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-flashcard-form {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
	}

	.ml-flashcard-form__actions {
		display: flex;
		justify-content: flex-end;
		gap: $spacing-sm;
		margin-top: $spacing-md;
		padding-top: $spacing-sm;
		border-top: 1px solid $background-modifier-border;
	}

	/* --- Card Type Tabs --- */

	/* Tabs wrap instead of shrinking their labels: the panel is narrower than
	   the modal, and a five-across row does not fit there. */
	:global(.ml-card-type-tabs-list) {
		flex-wrap: wrap;
	}

	:global(.ml-card-type-tabs-list .ml-tabs__trigger) {
		flex: 1 1 auto;
		width: auto;
		min-width: max-content;
	}
</style>
