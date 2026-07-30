<script lang="ts">
	import { EventBus } from '@/modules/events/core';
	import {
		FlashcardWriterCreateRequestEvent,
		FlashcardWriterCreateResponseEvent,
		FlashcardWriterUpdateRequestEvent,
		FlashcardWriterUpdateResponseEvent,
	} from '@/modules/events/domains/flashcard/writer';
	import { CardType, Flashcard } from '@/schemas';
	import { Input, Select } from '@/ui/components/elements';
	import { modalStore } from '@/ui/store/modal.store';
	import FormContent from './Content';
	import type { BuildContentFn, ValidateFn } from './Content/types';
	import type { FlashcardFormModalData } from './types';
	import type FlashcardFormModalProps from './types';
	import { capitalize } from '@/utils/String';
	import { getAppContext } from '@/ui/context/AppContext';

	let { controller, error }: FlashcardFormModalProps = $props();
	const { app } = getAppContext();

	// Derive modal data from the store
	let mode = $derived(
		(modalStore.state.data as FlashcardFormModalData | undefined)?.mode ?? 'create',
	);
	let card = $derived((modalStore.state.data as FlashcardFormModalData | undefined)?.card);
	let prefillSource = $derived(
		(modalStore.state.data as FlashcardFormModalData | undefined)?.prefillSource,
	);

	const cardTypeOptions = [
		{ value: CardType.Basic, label: 'Basic' },
		{ value: CardType.Sequence, label: 'Sequence' },
		{ value: CardType.Quiz, label: 'Quiz' },
		{ value: CardType.Cloze, label: 'Cloze' },
	];

	// --- Form state ---
	let selectedType: string = $state(CardType.Basic);

	// Shared metadata (renders once for all types)
	let deck: string[] = $state([]);
	let deckStr: string = $state('');
	let source = $state('');

	// --- Content child API ---
	let contentApi: { validate: ValidateFn; buildContent: BuildContentFn } | null = $state(null);

	// --- Init from store data ---
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
		const decks = value.split(',').map((deck) => deck.trim());
		deck = decks;
	}

	// --- Submission ---
	async function handleSubmit(): Promise<void> {
		if (!contentApi) return;

		const validationError = contentApi.validate();
		if (validationError) {
			controller.store.setError(validationError);
			return;
		}

		controller.store.setError(null);
		controller.store.setLoading(true);

		const content = contentApi.buildContent();
		const decks = deck.filter((d) => d.trim() !== '');
		const sourceValue = source.trim() || null;

		// Create writer wraps source with [[...]], so pass bare path.
		// Edit writer writes source directly to YAML, so pass wiki-link as-is.
		const createSource = sourceValue ? sourceValue.replace(/^\[\[/, '').replace(/\]\]$/, '') : '';

		try {
			if (mode === 'create') {
				const event = new FlashcardWriterCreateRequestEvent({
					content,
					source: createSource.length > 0 ? createSource : null,
					decks,
				});
				EventBus.instance.publish(event);

				const unsub = EventBus.instance.subscribe(
					FlashcardWriterCreateResponseEvent,
					async (response) => {
						unsub();
						app.workspace.openLinkText(response.data.filepath, '', false);
						controller.onClose();
					},
				);
			} else if (card) {
				const event = new FlashcardWriterUpdateRequestEvent({
					uuid: card.uuid,
					content,
					decks,
					source: sourceValue,
				} as Partial<Flashcard>);
				EventBus.instance.publish(event);

				const unsub = EventBus.instance.subscribe(
					FlashcardWriterUpdateResponseEvent,
					async (response) => {
						unsub();
						app.workspace.openLinkText(response.data.filepath, '', false);
						controller.onClose();
					},
				);
			}
		} catch (e) {
			controller.store.setError(e instanceof Error ? e.message : 'An error occurred');
			controller.store.setLoading(false);
		}
	}

	// --- Wire controller actions ---
	$effect(() => {
		controller.confirmAction = handleSubmit;
		controller.cancelAction = () => controller.onClose();
	});
</script>

<div class="ml-form-modal">
	<h3 class="ml-form-modal-title">
		{mode === 'edit' ? 'Edit flashcard' : 'Create flashcard'}
	</h3>

	{#if error}
		<div class="ml-form-error">{error}</div>
	{/if}

	<!-- Card Type -->
	<Select
		label="Card type"
		value={selectedType}
		displayAs={capitalize}
		options={cardTypeOptions}
		disabled={mode === 'edit'}
		onchange={handleTypeChange}
	/>

	{#key selectedType}
		{#if selectedType === CardType.Basic}
			<FormContent.Basic {mode} initialContent={card?.content} onRegister={handleRegister} />
		{:else if selectedType === CardType.Sequence}
			<FormContent.Sequence {mode} initialContent={card?.content} onRegister={handleRegister} />
		{:else if selectedType === CardType.Quiz}
			<FormContent.Quiz {mode} initialContent={card?.content} onRegister={handleRegister} />
		{:else if selectedType === CardType.Cloze}
			<FormContent.Cloze {mode} initialContent={card?.content} onRegister={handleRegister} />
		{/if}
	{/key}

	<!-- Shared metadata -->
	<Input
		label="Deck"
		value={deckStr}
		placeholder="Example::Nested, New deck"
		helperText="Comma separeted list of decks"
		onchange={handleDeckChange}
	/>
	<Input
		label="Source"
		value={source}
		placeholder="[[path/to/file]]"
		onchange={(v) => (source = v)}
	/>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-form-modal {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
	}

	.ml-form-modal-title {
		margin: 0;
		font-size: $font-lg;
	}

	.ml-form-error {
		color: $text-error;
		font-size: $font-sm;
	}
</style>
