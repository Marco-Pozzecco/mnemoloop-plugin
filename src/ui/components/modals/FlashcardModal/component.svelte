<script lang="ts">
	import { EventBus, FlashcardWriterCreateRequestEvent } from '@/modules/events';
	import { Input } from '@/ui/components/elements';
	import { modalStore } from '@/ui/store/modal.store';
	import type FlashcardModalProps from './types';
	import { type FlashcardModalData } from './types';
	import { CardType } from '@/schemas';

	let { controller, isLoading, error }: FlashcardModalProps = $props();

	const store = modalStore.store;

	let data = $derived($store.data) as FlashcardModalData;

	// Update functions that sync to the store
	function updateFront(value: string) {
		controller.store.setData({ front: value });
	}

	function updateBack(value: string) {
		controller.store.setData({ back: value });
	}

	// function updateDeck(value: string) {
	// 	controller.store.setData({ deck: value });
	// }

	$effect(() => {
		controller.confirmAction = async () => {
			EventBus.instance.publish(
				new FlashcardWriterCreateRequestEvent({
					content: {
						meta_type: CardType.Basic,
						back: data.back,
						front: data.front,
					},
					source: data.filepath,
				}),
			);
		};
	});
</script>

<div class="ml-flashcard-modal-content">
	<h3 class="ml-modal-title">Create flashcard</h3>

	{#if error}
		<div class="ml-modal-error">{error}</div>
	{/if}

	<div class="ml-form-field">
		<label for="flashcard-front">Front</label>
		<Input
			id="flashcard-front"
			value={data.front}
			disabled={isLoading}
			onchange={(v) => updateFront(v)}
			type="text"
		/>
	</div>

	<div class="ml-form-field">
		<label for="flashcard-back">Back</label>
		<textarea
			id="flashcard-back"
			class="ml-textarea"
			bind:value={data.back}
			oninput={(e) => updateBack(e.currentTarget.value)}
			disabled={isLoading}
			rows="4"
		></textarea>
	</div>

	<!-- <div class="ml-form-field"> -->
	<!-- 	<label for="flashcard-deck">Deck</label> -->
	<!-- 	<Input id="flashcard-deck" value={data.deck} disabled={isLoading} onchange={updateDeck} /> -->
	<!-- </div> -->
</div>

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-flashcard-modal) {
		width: $dialog-width;
	}

	.ml-flashcard-modal-content {
		background: $background-primary;
		padding: $spacing-md;
		border-radius: $radius-sm;
	}

	.ml-modal-title {
		font-size: $font-lg;
		font-weight: $font-semibold;
		color: $text-normal;
		margin: 0 0 $spacing-md 0;
	}

	.ml-modal-error {
		background: $background-modifier-error;
		color: -error;
		padding: $spacing-sm;
		border-radius: $radius-sm;
		margin-bottom: $spacing-sm;
		font-size: $font-sm;
		font-weight: $font-md;
	}

	.ml-form-field {
		margin-bottom: $spacing-sm;
	}

	.ml-form-field label {
		display: block;
		font-size: $font-sm;
		font-weight: $font-md;
		color: $text-muted;
		margin-bottom: $spacing-xxs;
	}

	.ml-textarea {
		width: 100%;
		padding: $spacing-sm;
		font-family: inherit;
		font-size: $font-sm;
		color: $text-normal;
		background-color: $background-primary;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-sm;
		resize: vertical;
		min-height: 80px;
	}

	.ml-textarea:hover:not(:disabled):not(:focus) {
		border-color: $background-modifier-border-hover;
	}

	.ml-textarea:focus {
		outline: none;
		border-color: $interactive-accent;
		box-shadow: 0 0 0 2px $background-modifier-border-focus;
	}

	.ml-textarea:disabled {
		background-color: $background-secondary;
		color: $text-muted;
		cursor: not-allowed;
		opacity: 0.6;
	}
</style>
