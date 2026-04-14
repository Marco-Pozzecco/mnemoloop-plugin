<script lang="ts">
	import { Button, Input } from '@/ui/components/elements';
	import type FlashcardModalProps from './types';

	let { controller, isLoading, error, initialData }: FlashcardModalProps = $props();

	function handleConfirm() {
		controller.onConfirm(() => {});
	}

	function handleCancel() {
		controller.onCancel(() => {});
	}
</script>

<div class="ka-flashcard-modal-content">
	<h3 class="ka-modal-title">Create Flashcard</h3>

	{#if error}
		<div class="ka-modal-error">{error}</div>
	{/if}

	<div class="ka-form-field">
		<label for="flashcard-front">Front</label>
		<Input id="flashcard-front" value={'front'} disabled={isLoading} />
	</div>

	<div class="ka-form-field">
		<label for="flashcard-back">Back</label>
		<textarea id="flashcard-back" class="ka-textarea" disabled={isLoading} rows="4"></textarea>
	</div>

	<div class="ka-form-field">
		<label for="flashcard-deck">Deck</label>
		<Input id="flashcard-deck" value={'Deck goes here'} disabled={isLoading} />
	</div>

	<div class="ka-modal-actions">
		<Button variant="secondary" onclick={handleCancel} disabled={isLoading}>Cancel</Button>
		<Button variant="primary" onclick={handleConfirm} disabled={isLoading}>
			{isLoading ? 'Saving...' : 'Save'}
		</Button>
	</div>
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

	.ka-modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--size-4-2);
		margin-top: var(--size-4-4);
		padding-top: var(--size-4-3);
		border-top: 1px solid var(--background-modifier-border);
	}
</style>
