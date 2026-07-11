<script lang="ts">
	import { type Flashcard, isFlashcardBase, isFlashcardSequence } from '@/schemas';
	import { gesture } from '@/ui/actions/gestures';
	import { type MarkdownOptions, renderMarkdown } from '@/ui/actions/markdown';
	import { Button, Card, Skeleton } from '@/ui/components';
	import type FlashCardProps from './types';
	import FlashcardBasicContent from './Basic/component.svelte';
	import FlashcardSequenceContent from './Sequence/component.svelte';

	let { item, showingAnswer, onShowAnswer, onSwipeLeft, onSwipeRight, onTap }: FlashCardProps =
		$props();

	let cardContainer: HTMLElement | undefined = $state();

	let flashcard: Flashcard | null = $derived(item.data);
	let timer: number | null = null;

	$effect(() => {
		// Watch for data changes
		const checkData = () => {
			if (item.data !== flashcard) {
				flashcard = item.data;
			}
			if (!flashcard) {
				timer = window.setTimeout(checkData, 1000); // Poll until ready
			}
		};
		checkData();

		return () => {
			if (timer) {
				window.clearTimeout(timer);
				timer = null;
			}
		};
	});

	const footerOptions: MarkdownOptions = $derived({
		content: flashcard?.source ?? '',
	});
</script>

<div class="ml-flashcard-wrapper">
	<div
		class="ml-flashcard-container"
		bind:this={cardContainer}
		use:gesture={{
			onSwipeLeft,
			onSwipeRight,
			onTap,
			swipeThreshold: 50,
			tapMaxDuration: 200,
			tapMaxDistance: 10,
		}}
	>
		{#if flashcard}
			<Card>
				{#if isFlashcardBase(flashcard)}
					<FlashcardBasicContent
						content={flashcard.content}
						{showingAnswer}
					/>
				{:else if isFlashcardSequence(flashcard)}
					<FlashcardSequenceContent
						content={flashcard.content}
						{showingAnswer}
					/>
				{:else}
					<Skeleton width="full" height="200px" shape="default" radius="8px" />
				{/if}

				{#snippet footer()}
					<div class="ml-flashcard-footer">
						<p class="ml-flashcard-footer-key">Source:</p>
						{#if flashcard?.source}
							<div use:renderMarkdown={footerOptions}></div>
						{:else}
							<p class="ml-flashcard-footer-value">No source available</p>
						{/if}
					</div>
				{/snippet}
			</Card>
		{:else}
			<Skeleton width="full" height="200px" shape="default" radius="8px" />
		{/if}
	</div>

	{#if !showingAnswer}
		<div class="ml-show-answer-wrapper">
			<Button
				variant="primary"
				className="ml-show-answer-button"
				onclick={onShowAnswer}
				ariaLabel="Show answer"
			>
				Show answer
				<span class="ml-key-hint">Space</span>
			</Button>
		</div>
	{/if}
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-flashcard-wrapper {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}

	.ml-flashcard-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: $spacing-lg;
		min-height: 0;
		overflow-y: auto;
	}

	.ml-flashcard-footer {
		font-size: 0.9rem;
		color: $text-muted;
		display: flex;
		flex-direction: row;
		gap: $spacing-xs;
	}

	.ml-flashcard-footer-key {
		font-weight: bold;
	}

	.ml-flashcard-footer-value {
		flex: 1;
		font-style: italic;
	}

	.ml-show-answer-wrapper {
		display: flex;
		justify-content: center;
		min-height: 100px;
		padding: $spacing-md 0;
	}

	:global(button.ml-show-answer-button) {
		width: 100%;
		max-width: 300px;
		height: 50px;
		font-size: 1.1rem;
		position: relative;
	}

	.ml-key-hint {
		position: absolute;
		right: 1rem;
		font-size: 0.7rem;
		opacity: 0.6;
		border: 1px solid currentColor;
		padding: $spacing-xxs $spacing-xxs;
		border-radius: $radius-sm;
	}

	@media (max-width: 480px) {
		.ml-key-hint {
			display: none;
		}

		:global(button.ml-show-answer-button) {
			height: 44px;
		}

		.ml-show-answer-wrapper {
			min-height: 60px;
			padding: $spacing-xs 0;
		}

		.ml-flashcard-container {
			gap: $spacing-md;
		}
	}
</style>
