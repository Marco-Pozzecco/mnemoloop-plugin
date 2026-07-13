<script lang="ts">
	import type { IReviewItem } from '@/interfaces/IReviewItem';
	import { CardType, type Flashcard } from '@/schemas';
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
		} else if (event.key === '1' || event.key === '2' || event.key === '3' || event.key === '4') {
			if (showingAnswer && item?.data?.card_type !== CardType.Sequence) {
				handleSubmitRating(Number(event.key) as Rating);
			}
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
		item: item! as IReviewItem<Flashcard>,
		showingAnswer,
		onShowAnswer: handleShowAnswer,
		onSwipeLeft: handleSwipeLeft,
		onSwipeRight: handleSwipeRight,
		onTap: handleTap,
		onSubmitRating: handleSubmitRating,
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
