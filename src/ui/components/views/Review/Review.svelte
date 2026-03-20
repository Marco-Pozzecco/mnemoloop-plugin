<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { gesture } from '@/ui/actions/gestures';
	import { Button, Icon, ProgressBar, RatingControls } from '@/ui/components';
	import { sessionStore, SessionStore } from '@/ui/store/session.store';
	import type { ReviewProps } from './Review.types';
	import { Rating } from 'ts-fsrs';
	import type { Flashcard } from '@/schemas';
	import { ReviewController } from '@/ui/controllers/ReviewController';

	const {}: ReviewProps = $props();

	const store = sessionStore as SessionStore<Flashcard>;
	let sessionState = $derived(store.state);

	store.store.subscribe((state) => {
		sessionState = state;
	});

	$effect(() => {
		if (!sessionState.queue) {
			throw new Error('Queue not initialized correctly');
		}
	});

	const controller = $derived(new ReviewController(sessionState.queue!));

	let cardContainer: HTMLElement | undefined = $state();
	let isGesturing = $state(false);

	const showingAnswer = $derived(sessionState.isAnswerShowing);

	const item = $derived(controller.current);
	const position = $derived(controller.position + 1);
	const progress = $derived(controller.progress);
	const remaining = $derived(controller.remaining);
	const total = $derived(controller.total);

	function handleKeyDown(event: KeyboardEvent) {
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
			return;
		}

		if (event.code === 'Space') {
			event.preventDefault();
			if (!showingAnswer) {
				handleShowAnswer();
			}
		} else if (event.key === '1') {
			if (showingAnswer) handleSubmitRating(1);
		} else if (event.key === '2') {
			if (showingAnswer) handleSubmitRating(2);
		} else if (event.key === '3') {
			if (showingAnswer) handleSubmitRating(3);
		} else if (event.key === '4') {
			if (showingAnswer) handleSubmitRating(4);
		} else if (event.key.toLowerCase() === 'n') {
			handleNextCard();
		} else if (event.key.toLowerCase() === 'p') {
			handlePreviousCard();
		}
	}

	function handleShowAnswer() {
		store.showAnswer();
	}

	function handleSubmitRating(rating: Rating) {
		store.hideAnswer();
		if (!item) return;
		item.review(rating as Rating);
		handleNextCard();
	}

	function handleNextCard() {
		store.hideAnswer();
		controller.getNextItem();
	}

	function handlePreviousCard() {
		store.hideAnswer();
		controller!.getPreviousItem();
	}

	function handleEndSession() {
		controller!.endReview();
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);
	});

	function handleSwipeLeft() {
		if (showingAnswer) {
			handleSubmitRating(1);
		} else {
			handlePreviousCard();
		}
	}

	function handleSwipeRight() {
		if (showingAnswer) {
			handleSubmitRating(3);
		} else {
			handleShowAnswer();
		}
	}

	function handleTap() {
		if (!showingAnswer && !isGesturing) {
			handleShowAnswer();
		}
	}
</script>

<div class="ka-review-container">
	<header class="ka-review-header">
		<div class="ka-review-stats">
			<span class="ka-stat-item">
				<Icon name="layers" size={14} />
				{position} / {total}
			</span>
			<span class="ka-stat-item">
				<Icon name="clock" size={14} />
				{remaining} remaining
			</span>
		</div>

		<div class="ka-progress-wrapper">
			<ProgressBar value={progress} />
		</div>

		<Button variant="secondary" size="small" onclick={handleEndSession} ariaLabel="End session">
			<Icon name="x" size={18} />
		</Button>
	</header>

	<main class="ka-review-main">
		{#if item}
			<div
				class="ka-card-wrapper"
				bind:this={cardContainer}
				use:gesture={{
					onSwipeLeft: handleSwipeLeft,
					onSwipeRight: handleSwipeRight,
					onTap: handleTap,
					swipeThreshold: 50,
					tapMaxDuration: 200,
					tapMaxDistance: 10,
				}}
			>
				<div class="ka-card-content">
					{#if showingAnswer}
						<div class="ka-card-front">
							{@html item?.data?.front ?? 'No front content'}
						</div>
						<div class="ka-card-back">
							{@html item?.data?.back ?? 'No back content'}
						</div>
					{:else}
						<div class="ka-card-front">
							{@html item?.data?.front ?? 'No front content'}
						</div>
					{/if}
				</div>
			</div>

			<div class="ka-controls-wrapper">
				{#if !showingAnswer}
					<Button
						variant="primary"
						className="ka-show-answer-button"
						onclick={handleShowAnswer}
						ariaLabel="Show answer"
					>
						Show Answer
						<span class="ka-key-hint">Space</span>
					</Button>
				{:else}
					<RatingControls onSubmitRating={handleSubmitRating} />
				{/if}
			</div>
		{:else}
			<div class="ka-empty-state">
				<Icon name="check-circle" size={48} />
				<h2>Session Complete!</h2>
				<p>You've reviewed all cards in this session.</p>
				<Button variant="primary" onclick={handleEndSession}>Return to Dashboard</Button>
			</div>
		{/if}
	</main>

	<footer class="ka-review-footer">
		<div class="ka-navigation-controls">
			<Button
				variant="secondary"
				size="small"
				onclick={handlePreviousCard}
				disabled={position <= 1}
				ariaLabel="Previous card"
			>
				<Icon name="chevron-left" size={16} />
				<span>Previous</span>
			</Button>
			<Button
				variant="secondary"
				size="small"
				onclick={handleNextCard}
				disabled={position >= total}
				ariaLabel="Next card"
			>
				<span>Next</span>
				<Icon name="chevron-right" size={16} />
			</Button>
		</div>
	</footer>
</div>

<style>
	.ka-review-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
		padding: 1rem;
		gap: 1.5rem;
	}

	.ka-review-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.ka-review-stats {
		display: flex;
		gap: 1rem;
		color: var(--text-muted);
		font-size: 0.85rem;
	}

	.ka-stat-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.ka-progress-wrapper {
		flex: 1;
	}

	.ka-review-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 2rem;
		min-height: 0;
	}

	.ka-card-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow-y: auto;
	}

	.ka-card-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		background-color: var(--background-primary);
		border-radius: 8px;
		overflow-y: auto;
	}

	.ka-card-front,
	.ka-card-back {
		line-height: 1.6;
	}

	.ka-card-back {
		padding-top: 1rem;
		border-top: 1px solid var(--background-modifier-border);
	}

	.ka-controls-wrapper {
		display: flex;
		justify-content: center;
		min-height: 100px;
	}

	:global(.ka-show-answer-button) {
		width: 100%;
		max-width: 300px;
		height: 50px !important;
		font-size: 1.1rem !important;
		position: relative;
	}

	.ka-key-hint {
		position: absolute;
		right: 1rem;
		font-size: 0.7rem;
		opacity: 0.6;
		border: 1px solid currentColor;
		padding: 2px 4px;
		border-radius: 3px;
	}

	.ka-empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 1rem;
		padding: 3rem;
		background-color: var(--background-secondary);
		border-radius: 12px;
	}

	.ka-empty-state h2 {
		margin: 0;
	}

	.ka-empty-state p {
		color: var(--text-muted);
		margin-bottom: 1rem;
	}

	.ka-review-footer {
		display: flex;
		justify-content: center;
		padding-bottom: 1rem;
	}

	.ka-navigation-controls {
		display: flex;
		gap: 2rem;
	}

	@media (max-width: 480px) {
		.ka-review-container {
			padding: 0.5rem;
			gap: 1rem;
		}

		.ka-review-stats {
			font-size: 0.75rem;
			gap: 0.5rem;
		}

		.ka-key-hint {
			display: none;
		}
	}
</style>
