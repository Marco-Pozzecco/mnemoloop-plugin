<script lang="ts">
	import { onMount } from 'svelte';
	import ErrorWrapper from '../../components/common/ErrorWrapper.svelte';
	import Review from './Review.svelte';
	import type { CardRatingValue } from './types';
	import type { SessionStore } from '@/ui/stores/SessionStore';

	interface Props {
		app: any;
		sessionStore: SessionStore;
		onShowAnswer: () => void;
		onSubmitRating: (rating: CardRatingValue) => void;
		onNextCard: () => void;
		onPreviousCard: () => void;
		onEndSession: () => void;
		onEditCard: () => void;
	}

	let {
		app,
		sessionStore,
		onShowAnswer,
		onSubmitRating,
		onNextCard,
		onPreviousCard,
		onEndSession,
		onEditCard,
	}: Props = $props();

	let hasRatingError = $state(false);
	let lastError = $state<Error | null>(null);
	let retryCount = $state(0);
	const MAX_RETRIES = 3;

	async function handleSubmitRatingWithRetry(rating: CardRatingValue): Promise<void> {
		try {
			// Reset error state on new attempt
			hasRatingError = false;
			lastError = null;

			// Submit rating
			await onSubmitRating(rating);
		} catch (error) {
			hasRatingError = true;
			lastError = error instanceof Error ? error : new Error(String(error));
			retryCount++;

			// If exceeded max retries, end session
			if (retryCount >= MAX_RETRIES) {
				showMaxRetriesDialog();
			}
		}
	}

	function handleRetry(): void {
		// Retry with the current card
		if (retryCount < MAX_RETRIES) {
			retryCount++;
			hasRatingError = false;
			lastError = null;
		}
	}

	function handleEndSession(): void {
		// End session and return to dashboard
		onEndSession();
	}

	function showMaxRetriesDialog(): void {
		// Show dialog to user that max retries exceeded
		const confirmEnd = confirm(
			'Multiple errors occurred during review. End session and return to dashboard?'
		);
		if (confirmEnd) {
			handleEndSession();
		}
	}

	// Track error events from Review component
	function handleError(event: CustomEvent<{ error: Error; cardId: string | null }>): void {
		hasRatingError = true;
		lastError = event.detail.error;
	}

	onMount(() => {
		// Could set up additional error tracking here
	});
</script>

<ErrorWrapper
	fallback={hasRatingError ? `Rating failed: ${lastError?.message || 'Unknown error'}` : 'Error during review'}
	onRetry={handleRetry}
	showError={true}
	maxRetries={MAX_RETRIES}
	errorContext="ReviewView"
>
	<Review
		{app}
		{sessionStore}
		onShowAnswer={onShowAnswer}
		onSubmitRating={handleSubmitRatingWithRetry}
		onNextCard={onNextCard}
		onPreviousCard={onPreviousCard}
		onEndSession={handleEndSession}
		onEditCard={onEditCard}
	/>
</ErrorWrapper>

{#if hasRatingError}
	<div class="ka-review-error-dialog" role="alertdialog" aria-labelledby="error-dialog-title">
		<div class="ka-review-error-dialog__content">
			<h3 id="error-dialog-title">Review Error</h3>
			<p>{lastError?.message || 'An error occurred while rating the card.'}</p>
			{#if retryCount < MAX_RETRIES}
				<p class="ka-review-error-dialog__retry-hint">
					Attempt {retryCount} of {MAX_RETRIES}. Click Retry to try again.
				</p>
			{:else}
				<p class="ka-review-error-dialog__retry-hint">
					Maximum retry attempts reached. Consider ending the session.
				</p>
			{/if}
		</div>
	</div>
{/if}

<style>
	.ka-review-error-dialog {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background-color: var(--background-secondary);
		border: 1px solid var(--text-warning);
		border-radius: 12px;
		padding: 24px;
		max-width: 500px;
		width: 90%;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
		z-index: 1000;
		animation: ka-slide-in 0.3s ease-out;
	}

	@keyframes ka-slide-in {
		from {
			opacity: 0;
			transform: translate(-50%, -40%);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%);
		}
	}

	.ka-review-error-dialog__content {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.ka-review-error-dialog__content h3 {
		margin: 0;
		font-size: var(--font-ui-larger);
		font-weight: var(--font-bold);
		color: var(--text-warning);
	}

	.ka-review-error-dialog__content p {
		margin: 0;
		font-size: var(--font-ui-small);
		color: var(--text-muted);
		line-height: 1.5;
	}

	.ka-review-error-dialog__retry-hint {
		font-size: var(--font-ui-smaller);
		color: var(--text-faint);
		font-style: italic;
	}
</style>
