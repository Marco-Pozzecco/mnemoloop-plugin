<script lang="ts">
	import type { IReviewItem } from '@/interfaces/IReviewItem';
	import { type Flashcard } from '@/schemas';
	import {
		ReviewEmptyState,
		ReviewFlashcard,
		ReviewHeader,
		type ReviewEmptyStateProps,
		type ReviewFlashcardProps,
		type ReviewHeaderProps,
	} from '@/ui/components/sections';
	import { ReviewController } from '@/ui/controllers/ReviewController';
	import { sessionStore, SessionStore } from '@/ui/store/session.store';
	import { onDestroy } from 'svelte';
	import { Rating } from 'ts-fsrs';
	import { Card } from '../../elements';

	const store = sessionStore as SessionStore<Flashcard>;
	const storeRef = $derived(store.store);
	let sessionState = $derived($storeRef);

	$effect(() => {
		if (!sessionState.queue) {
			throw new Error('Queue not initialized correctly');
		}
	});

	const controller = $derived.by(() => {
		const queue = sessionState.queue;
		return new ReviewController(queue!);
	});

	let isGesturing = $state(false);
	let containerRef: HTMLDivElement;

	const isAnswerShowing = $derived(sessionState.is_answer_showing);
	const isAnswerCorrect = $derived(sessionState.is_answer_correct);
	let item = $derived(controller.current);
	const position = $derived(controller.position);
	const progress = $derived(controller.progress);
	const total = $derived(controller.total);

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
		if (isAnswerShowing) {
			handleSubmitRating(1);
		}
	}

	function handleSwipeRight() {
		if (isAnswerShowing) {
			handleSubmitRating(3);
		}
	}

	function handleTap() {
		if (!isAnswerShowing && !isGesturing) {
			handleShowAnswer();
		}
	}

	function handleSetAnswerCorrectness(isCorrect: boolean) {
		store.setAnswerCorrectness(isCorrect);
	}

	onDestroy(() => {
		handleEndSession();
	});

	const headerProps: ReviewHeaderProps = $derived({
		position,
		total,
		progress,
		accuracy:
			sessionState.total_count > 0 ? sessionState.correct_count / sessionState.total_count : 0,
		startTime: sessionState.start_time ?? Date.now(),
		onEndSession: handleEndSession,
		onUndo: handleUndo,
		canUndo: controller!.canUndo(),
	});

	const flashCardProps: ReviewFlashcardProps = $derived({
		item: item as IReviewItem<Flashcard>,
		isAnswerCorrect: isAnswerCorrect ?? false,
		isAnswerShowing,
		onShowAnswer: handleShowAnswer,
		onSwipeLeft: handleSwipeLeft,
		onSwipeRight: handleSwipeRight,
		onTap: handleTap,
		onSubmitRating: handleSubmitRating,
		onSetAnswerCorrectness: handleSetAnswerCorrectness,
	});

	const emptyStateProps: ReviewEmptyStateProps = $derived({
		onEndSession: handleEndSession,
	});
</script>

<div bind:this={containerRef} class="ml-review-container">
	<Card className="ml-review-header">
		<ReviewHeader {...headerProps} />
	</Card>

	<main class="ml-review-main">
		{#if item}
			<ReviewFlashcard {...flashCardProps} />
		{:else}
			<ReviewEmptyState {...emptyStateProps} />
		{/if}
	</main>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-review-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
		padding: $spacing-md;
		gap: $spacing-lg;
	}

	.ml-review-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: start;
		gap: $spacing-xl;
		min-height: 0;
	}

	@media (max-width: 480px) {
		.ml-review-container {
			padding: $spacing-xs;
			gap: $spacing-sm;
		}

		.ml-review-main {
			gap: $spacing-md;
		}
	}
</style>
