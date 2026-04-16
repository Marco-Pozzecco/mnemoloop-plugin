<script lang="ts">
	import { EventBus } from '@/modules/event-bus/EventBus';
	import { EventType, type FlashcardCreateRequestEvent } from '@/types/events';
	import { Input } from '@/ui/components/elements';
	import { modalStore } from '@/ui/store/modal.store';
	import { type FlashcardModalData, type FlashcardModalProps } from './types';

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
			const event: FlashcardCreateRequestEvent = {
				created_at: new Date(),
				event_type: EventType.FlashcardCreateRequest,
				data: {
					back: data.back,
					deck: data.deck,
					front: data.front,
					source: data.filepath,
				},
			};
			EventBus.instance.publish(event);
		};
	});
</script>

<div class="ka-flashcard-modal-content">
	<h3 class="ka-modal-title">Create Flashcard</h3>

	{#if error}
		<div class="ka-modal-error">{error}</div>
	{/if}

	<div class="ka-form-field">
		<label for="flashcard-front">Front</label>
		<Input id="flashcard-front" value={data.front} disabled={isLoading} onchange={updateFront} />
	</div>

	<div class="ka-form-field">
		<label for="flashcard-back">Back</label>
		<textarea
			id="flashcard-back"
			class="ka-textarea"
			bind:value={data.back}
			oninput={(e) => updateBack(e.currentTarget.value)}
			disabled={isLoading}
			rows="4"
		></textarea>
	</div>

	<!-- <div class="ka-form-field"> -->
	<!-- 	<label for="flashcard-deck">Deck</label> -->
	<!-- 	<Input id="flashcard-deck" value={data.deck} disabled={isLoading} onchange={updateDeck} /> -->
	<!-- </div> -->
</div>

<style>
	.ka-flashcard-modal-content {
		background: var(--background-primary);
		padding: var(--size-4-4);
		border-radius: var(--radius-s);
	}

	.ka-modal-title {
		font-size: var(--font-ui-larger);
		font-weight: var(--font-semibold);
		color: var(--text-normal);
		margin: 0 0 var(--size-4-4) 0;
	}

	.ka-modal-error {
		background: var(--background-modifier-error);
		color: var(--text-error);
		padding: var(--size-4-2);
		border-radius: var(--radius-s);
		margin-bottom: var(--size-4-3);
		font-size: var(--font-ui-small);
		font-weight: var(--font-medium);
	}

	.ka-form-field {
		margin-bottom: var(--size-4-3);
	}

	.ka-form-field label {
		display: block;
		font-size: var(--font-ui-small);
		font-weight: var(--font-medium);
		color: var(--text-muted);
		margin-bottom: var(--size-4-1);
	}

	.ka-textarea {
		width: 100%;
		padding: var(--size-4-2);
		font-family: inherit;
		font-size: var(--font-ui-small);
		color: var(--text-normal);
		background-color: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--radius-s);
		resize: vertical;
		min-height: 80px;
	}

	.ka-textarea:hover:not(:disabled):not(:focus) {
		border-color: var(--background-modifier-border-hover);
	}

	.ka-textarea:focus {
		outline: none;
		border-color: var(--interactive-accent);
		box-shadow: 0 0 0 2px var(--background-modifier-border-focus);
	}

	.ka-textarea:disabled {
		background-color: var(--background-secondary);
		color: var(--text-muted);
		cursor: not-allowed;
		opacity: 0.6;
	}
</style>
