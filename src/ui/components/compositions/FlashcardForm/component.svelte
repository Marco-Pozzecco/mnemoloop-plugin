<script lang="ts">
	import { CardStatus } from '@/schemas';
	import { FormField, Input, Select } from '@/ui/components/elements';
	import {
		MANAGE_STATUS_OPTIONS,
		MANAGE_TYPE_OPTIONS,
	} from '@/ui/components/sections/Manage/options';
	import ContentRouter from './ContentRouter/component.svelte';
	import DeckPicker from './DeckPicker/component.svelte';
	import type FlashcardFormProps from './types';

	let { form, deckOptions, idPrefix }: FlashcardFormProps = $props();

	const statusOptions = $derived(
		form.card?.status === CardStatus.DELETED
			? MANAGE_STATUS_OPTIONS
			: MANAGE_STATUS_OPTIONS.filter((option) => option.value !== CardStatus.DELETED),
	);
</script>

<div class="ml-flashcard-form__body">
	{#if form.error}
		<p class="ml-flashcard-form__error" role="alert">{form.error}</p>
	{/if}

	<section class="ml-flashcard-form__section">
		<h3 class="ml-flashcard-form__section-title">Content</h3>
		{#if form.mode === 'create'}
			<FormField label="Card type" htmlFor={`${idPrefix}-type`}>
				<Select
					id={`${idPrefix}-type`}
					options={MANAGE_TYPE_OPTIONS}
					value={form.selectedType}
					disabled={form.isSubmitting}
					onchange={(value) => form.setType(value)}
				/>
			</FormField>
		{/if}
		<ContentRouter
			selectedType={form.selectedType}
			mode={form.mode}
			card={form.card}
			disabled={form.isSubmitting}
			onRegister={(api) => form.registerContent(api)}
		/>
	</section>

	<section class="ml-flashcard-form__section">
		<h3 class="ml-flashcard-form__section-title">Organization</h3>
		<FormField label="Decks">
			<DeckPicker
				decks={form.values.decks}
				{deckOptions}
				onAdd={(deck) => form.addDeck(deck)}
				onRemove={(deck) => form.removeDeck(deck)}
				disabled={form.isSubmitting}
			/>
		</FormField>
		<FormField
			label="Source"
			htmlFor={`${idPrefix}-source`}
			helper="Wrap the path in double brackets, e.g. [[path/to/file]]"
		>
			<Input
				id={`${idPrefix}-source`}
				placeholder="[[path/to/file]]"
				value={form.values.source}
				disabled={form.isSubmitting}
				oninput={(value) => form.setSource(value)}
			/>
		</FormField>
		{#if form.mode === 'edit'}
			<FormField label="Status" htmlFor={`${idPrefix}-status`}>
				<Select
					id={`${idPrefix}-status`}
					options={statusOptions}
					value={form.values.status}
					disabled={form.isSubmitting}
					onchange={(value) => form.setStatus(value)}
				/>
			</FormField>
		{/if}
	</section>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-flashcard-form__body {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
		min-width: 0;
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

	.ml-flashcard-form__error {
		margin: 0;
		padding: $spacing-xs $spacing-sm;
		font-size: $font-sm;
		line-height: 1.4;
		color: $text-error;
		background-color: $status-error-background;
		border-radius: $radius-md;
	}
</style>
