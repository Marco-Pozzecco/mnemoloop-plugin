<script lang="ts">
	import { CardStatus, CardType } from '@/schemas';
	import { Badge, Button, FormField, Icon, Input, Select, Sheet } from '@/ui/components/elements';
	import ContentRouter from './ContentRouter/component.svelte';
	import type { BuildContentFn, ValidateFn } from './Content/types';
	import DeleteConfirmation from '@/ui/components/sections/Manage/DeleteConfirmation/component.svelte';
	import {
		MANAGE_STATUS_OPTIONS,
		MANAGE_STATUS_VARIANT,
		MANAGE_TYPE_OPTIONS,
		cardTypeLabel,
	} from '@/ui/components/sections/Manage/options';
	import { formatDate } from '@/utils/statistics-utils';
	import DeckPicker from './DeckPicker/component.svelte';
	import type FlashcardFormProps from './types';

	let {
		mode,
		card,
		label = 'this flashcard',
		deckOptions,
		onClose,
		onSave,
		onDelete,
	}: FlashcardFormProps = $props();

	const isCreate = $derived(mode === 'create');

	// The sheet is mounted per card (the view keys it by uuid) or once per create
	// session, so seeding local edit state at mount is intentional.
	// svelte-ignore state_referenced_locally
	let selectedType = $state<CardType>(card?.card_type ?? CardType.Basic);
	// svelte-ignore state_referenced_locally
	let decks = $state<string[]>(card ? [...card.decks] : []);
	// svelte-ignore state_referenced_locally
	let source = $state(card?.source ?? '');
	// svelte-ignore state_referenced_locally
	let status = $state<CardStatus>(card?.status ?? CardStatus.ACTIVE);
	let isSaving = $state(false);
	let confirmingDelete = $state(false);
	let error = $state<string | null>(null);

	let contentApi: { validate: ValidateFn; buildContent: BuildContentFn } | null = $state(null);

	const statusVariant = $derived(MANAGE_STATUS_VARIANT[status] ?? 'neutral');
	const dueLabel = $derived(card ? formatDate(new Date(card.due)) : '');
	const statusOptions = $derived(
		card?.status === CardStatus.DELETED
			? MANAGE_STATUS_OPTIONS
			: MANAGE_STATUS_OPTIONS.filter((option) => option.value !== CardStatus.DELETED),
	);

	function handleRegister(api: { validate: ValidateFn; buildContent: BuildContentFn }): void {
		contentApi = api;
	}

	function handleTypeChange(value: string): void {
		selectedType = value as CardType;
		// The router remounts on type change and registers a fresh editor.
		contentApi = null;
	}

	function addDeck(deck: string): void {
		const trimmed = deck.trim();
		if (!trimmed) return;
		if (decks.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return;
		decks = [...decks, trimmed];
	}

	function removeDeck(deck: string): void {
		decks = decks.filter((item) => item.toLowerCase() !== deck.toLowerCase());
	}

	async function handleSave(): Promise<void> {
		if (!contentApi || isSaving) return;

		const validation = contentApi.validate();
		if (validation) {
			error = validation;
			return;
		}

		const trimmedSource = source.trim();
		if (trimmedSource && !/^\[\[.*\]\]$/.test(trimmedSource)) {
			error = 'Source must be a [[wikilink]] or empty.';
			return;
		}

		error = null;
		isSaving = true;
		const saved = await onSave({
			content: contentApi.buildContent(),
			decks: decks.filter((deck) => deck.trim() !== ''),
			source: trimmedSource || null,
			status: mode === 'edit' ? status : undefined,
		});
		isSaving = false;

		if (!saved) {
			error =
				mode === 'create'
					? 'Couldn’t create the card. The vault rejected the write.'
					: 'Couldn’t save the card. The vault rejected the write.';
		}
	}

	function handleConfirmDelete(): void {
		confirmingDelete = false;
		onDelete?.();
	}
</script>

<!-- The type is a select in create mode, so the header keeps only the facts the
     form cannot show: type (for an existing card), status, and due date. -->
{#snippet meta()}
	<Badge variant="neutral">{cardTypeLabel(card?.card_type)}</Badge>
	<Badge variant={statusVariant} radius="md">{status}</Badge>
	<span class="ml-flashcard-form__due">Due {dueLabel}</span>
{/snippet}

<Sheet
	title={isCreate ? 'New flashcard' : 'Edit flashcard'}
	{onClose}
	meta={isCreate ? undefined : meta}
>
	<div class="ml-flashcard-form">
		{#if error}
			<p class="ml-flashcard-form__error" role="alert">{error}</p>
		{/if}

		<section class="ml-flashcard-form__section">
			<h3 class="ml-flashcard-form__section-title">Content</h3>
			{#if isCreate}
				<FormField label="Card type" htmlFor="ml-flashcard-form-type">
					<Select
						id="ml-flashcard-form-type"
						options={MANAGE_TYPE_OPTIONS}
						value={selectedType}
						disabled={isSaving}
						onchange={handleTypeChange}
					/>
				</FormField>
			{/if}
			<ContentRouter
				{selectedType}
				mode={isCreate ? 'create' : 'edit'}
				{card}
				disabled={isSaving}
				onRegister={handleRegister}
			/>
		</section>

		<section class="ml-flashcard-form__section">
			<h3 class="ml-flashcard-form__section-title">Organization</h3>
			<FormField label="Decks">
				<DeckPicker
					{decks}
					{deckOptions}
					onAdd={addDeck}
					onRemove={removeDeck}
					disabled={isSaving}
				/>
			</FormField>
			<FormField
				label="Source"
				htmlFor="ml-flashcard-form-source"
				helper="Wrap the path in double brackets, e.g. [[path/to/file]]"
			>
				<Input
					id="ml-flashcard-form-source"
					placeholder="[[path/to/file]]"
					value={source}
					disabled={isSaving}
					oninput={(value) => (source = value)}
				/>
			</FormField>
			{#if !isCreate}
				<FormField label="Status" htmlFor="ml-flashcard-form-status">
					<Select
						id="ml-flashcard-form-status"
						options={statusOptions}
						value={status}
						disabled={isSaving}
						onchange={(value) => (status = value as CardStatus)}
					/>
				</FormField>
			{/if}
		</section>
	</div>

	{#snippet footer()}
		{#if !isCreate && onDelete}
			<Button variant="plain" onclick={() => (confirmingDelete = true)}>
				{#snippet icon()}
					<Icon name="trash-2" size={14} />
				{/snippet}
				Delete
			</Button>
		{:else}
			<span></span>
		{/if}
		<div class="ml-flashcard-form__actions">
			<Button variant="secondary" size="small" onclick={onClose}>Cancel</Button>
			<Button variant="primary" size="small" disabled={isSaving} onclick={handleSave}>
				{#if isSaving}
					{isCreate ? 'Creating…' : 'Saving…'}
				{:else}
					{isCreate ? 'Create' : 'Save'}
				{/if}
			</Button>
		</div>
	{/snippet}
</Sheet>

{#if !isCreate && confirmingDelete}
	<DeleteConfirmation
		cardLabel={label}
		onCancel={() => (confirmingDelete = false)}
		onConfirm={handleConfirmDelete}
	/>
{/if}

<style lang="scss">
	@use 'tokens' as *;

	.ml-flashcard-form {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
	}

	.ml-flashcard-form__section {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
	}

	.ml-flashcard-form__section-title {
		margin: 0;
		font-size: $font-xs;
		font-weight: $font-normal;
		letter-spacing: $letter-spacing-caps;
		text-transform: uppercase;
		color: $text-muted;
	}

	.ml-flashcard-form__due {
		font-size: $font-xs;
		color: $text-faint;
	}

	.ml-flashcard-form__error {
		margin: 0;
		padding: $spacing-xs $spacing-sm;
		font-size: $font-sm;
		color: $text-error;
		background-color: $status-error-background;
		border-radius: $radius-md;
	}

	.ml-flashcard-form__actions {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
	}
</style>
