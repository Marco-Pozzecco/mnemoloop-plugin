<script lang="ts">
	import type { Flashcard } from '@/schemas';
	import {
		ReviewControls,
		ReviewEmptyState,
		ReviewFlashCard,
		ReviewHeader,
		type ReviewEmptyStateProps,
		type ReviewFlashCardProps,
		type ReviewHeaderProps,
	} from '@/ui/components/sections';
	import { ReviewController } from '@/ui/controllers/ReviewController';
	import { sessionStore, SessionStore } from '@/ui/store/session.store';
	import { onDestroy, onMount } from 'svelte';
	import { Rating } from 'ts-fsrs';
	import { Card } from '../../elements';

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

	let isGesturing = $state(false);
	let containerRef: HTMLDivElement;

	const showingAnswer = $derived(sessionState.isAnswerShowing);
	const item = $derived(controller.current);
	const position = $derived(controller.position);
	const progress = $derived(controller.progress);
	const remaining = $derived(controller.remaining);
	const total = $derived(controller.total);

	function handleKeyDown(event: KeyboardEvent) {
		// Only handle keys when the review view is actually visible (not hidden behind another tab)
		if (!containerRef || containerRef.offsetParent === null) {
			return;
		}
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
			return;
		}
		if (event.code === 'Space') {
			event.preventDefault();
			if (!showingAnswer) handleShowAnswer();
		} else if (event.key === '1') {
			if (showingAnswer) handleSubmitRating(1);
		} else if (event.key === '2') {
			if (showingAnswer) handleSubmitRating(2);
		} else if (event.key === '3') {
			if (showingAnswer) handleSubmitRating(3);
		} else if (event.key === '4') {
			if (showingAnswer) handleSubmitRating(4);
		} else if (event.key.toLowerCase() === 'u') {
			handleUndo();
		}
	}

	function handleShowAnswer() {
		store.showAnswer();
	}

	function handleSubmitRating(rating: Rating) {
		store.hideAnswer();
		if (!item) return;
		controller.scoreItem(rating);
		store.hideAnswer();
		controller.getNextItem();
	}

	function handleUndo() {
		controller!.undoReview();
	}

	function handleEndSession() {
		controller!.endReview();
	}

	function handleSwipeLeft() {
		if (showingAnswer) {
			handleSubmitRating(1);
		}
	}

	function handleSwipeRight() {
		if (showingAnswer) {
			handleSubmitRating(3);
		}
	}

	function handleTap() {
		if (!showingAnswer && !isGesturing) {
			handleShowAnswer();
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);
	});

	const headerProps: ReviewHeaderProps = $derived({
		position,
		total,
		remaining,
		progress,
		accuracy:
			sessionState.total_count > 0 ? sessionState.correct_count / sessionState.total_count : 0,
		startTime: sessionState.start_time ?? Date.now(),
		onEndSession: handleEndSession,
		onUndo: handleUndo,
		canUndo: controller!.canUndo(),
	});

	const flashCardProps: ReviewFlashCardProps = $derived({
		item: item!,
		showingAnswer,
		onShowAnswer: handleShowAnswer,
		onSwipeLeft: handleSwipeLeft,
		onSwipeRight: handleSwipeRight,
		onTap: handleTap,
	});

	const emptyStateProps: ReviewEmptyStateProps = $derived({
		onEndSession: handleEndSession,
	});
</script>

<div bind:this={containerRef} class="ka-review-container">
	<Card className="ka-review-header">
		<ReviewHeader {...headerProps} />
	</Card>

	<main class="ka-review-main">
		{#if item}
			<ReviewFlashCard {...flashCardProps} />

			{#if showingAnswer}
				<div class="ka-controls-wrapper">
					<ReviewControls onSubmitRating={handleSubmitRating} />
				</div>
			{/if}
		{:else}
			<ReviewEmptyState {...emptyStateProps} />
		{/if}
	</main>
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

	.ka-review-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: start;
		gap: 2rem;
		min-height: 0;
	}

	.ka-controls-wrapper {
		display: flex;
		justify-content: center;
		min-height: 100px;
	}

	@media (max-width: 480px) {
		.ka-review-container {
			padding: 0.5rem;
			gap: 1rem;
		}
	}
</style>
