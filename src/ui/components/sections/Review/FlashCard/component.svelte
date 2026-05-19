<script lang="ts">
	import { type Flashcard } from '@/schemas';
	import { gesture } from '@/ui/actions/gestures';
	import { type MarkdownOptions, renderMarkdown } from '@/ui/actions/markdown';
	import { Button, Card, Skeleton } from '@/ui/components';
	import type FlashCardProps from './types';

	let { item, showingAnswer, onShowAnswer, onSwipeLeft, onSwipeRight, onTap }: FlashCardProps =
		$props();

	let cardContainer: HTMLElement | undefined = $state();

	let flashcard: Flashcard | null = $derived(item.data);

	$effect(() => {
		// Watch for data changes
		const checkData = () => {
			if (item.data !== flashcard) {
				flashcard = item.data;
			}
			if (!flashcard) {
				setTimeout(checkData, 1000); // Poll until ready
			}
		};
		checkData();
	});

	// Options no longer need app - it's retrieved from context internally
	const frontOptions: MarkdownOptions = $derived({
		content: flashcard?.front ?? '',
	});

	const backOptions: MarkdownOptions = $derived({
		content: flashcard?.back ?? '',
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
				{#if showingAnswer}
					<div class="ml-flashcard-front" use:renderMarkdown={frontOptions}></div>
					<div class="ml-flashcard-back" use:renderMarkdown={backOptions}></div>
				{:else}
					<div class="ml-flashcard-front" use:renderMarkdown={frontOptions}></div>
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
				Show Answer
				<span class="ml-key-hint">Space</span>
			</Button>
		</div>
	{/if}
</div>

<style>
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
		gap: 1.5rem;
		min-height: 0;
		overflow-y: auto;
	}

	.ml-flashcard-front,
	.ml-flashcard-back {
		line-height: 1.6;
	}

	.ml-flashcard-footer {
		font-size: 0.9rem;
		color: var(--text-muted);
		display: flex;
		flex-direction: row;
		gap: 0.5rem;
	}

	.ml-flashcard-footer-key {
		font-weight: bold;
	}

	.ml-flashcard-footer-value {
		flex: 1;
		font-style: italic;
	}

	.ml-flashcard-back {
		padding-top: 1rem;
		border-top: 1px solid var(--background-modifier-border);
	}

	.ml-show-answer-wrapper {
		display: flex;
		justify-content: center;
		min-height: 100px;
		padding: 1rem 0;
	}

	:global(.ml-show-answer-button) {
		width: 100%;
		max-width: 300px;
		height: 50px !important;
		font-size: 1.1rem !important;
		position: relative;
	}

	.ml-key-hint {
		position: absolute;
		right: 1rem;
		font-size: 0.7rem;
		opacity: 0.6;
		border: 1px solid currentColor;
		padding: 2px 4px;
		border-radius: 3px;
	}

	@media (max-width: 480px) {
		.ml-key-hint {
			display: none;
		}

		:global(.ml-show-answer-button) {
			height: 44px !important;
		}

		.ml-show-answer-wrapper {
			min-height: 60px;
			padding: 0.5rem 0;
		}

		.ml-flashcard-container {
			gap: 1rem;
		}

		.ml-flashcard-back {
			padding-top: 0.75rem;
		}
	}
</style>
