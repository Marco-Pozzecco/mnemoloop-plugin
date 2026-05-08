<script lang="ts">
	import { type Flashcard } from '@/schemas';
	import { gesture } from '@/ui/actions/gestures';
	import { type MarkdownOptions, renderMarkdown } from '@/ui/actions/markdown';
	import { Button } from '@/ui/components';
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
				setTimeout(checkData, 25); // Poll until ready
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
</script>

<div class="ka-flashcard-wrapper">
	<div
		class="ka-card-wrapper"
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
			<div class="ka-card-content">
				{#if flashcard}
					{#if showingAnswer}
						<div class="ka-card-front" use:renderMarkdown={frontOptions}></div>
						<div class="ka-card-back" use:renderMarkdown={backOptions}></div>
					{:else}
						<div class="ka-card-front" use:renderMarkdown={frontOptions}></div>
					{/if}
				{:else}
					<div class="ka-loading-state">
						<p>Loading card...</p>
					</div>
				{/if}
			</div>
	</div>

	{#if !showingAnswer}
		<div class="ka-show-answer-wrapper">
			<Button
				variant="primary"
				className="ka-show-answer-button"
				onclick={onShowAnswer}
				ariaLabel="Show answer"
			>
				Show Answer
				<span class="ka-key-hint">Space</span>
			</Button>
		</div>
	{/if}
</div>

<style>
	.ka-flashcard-wrapper {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
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

	.ka-show-answer-wrapper {
		display: flex;
		justify-content: center;
		min-height: 100px;
		padding: 1rem 0;
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
		border-radius: 8px;
		color: var(--text-muted);
	}

	@media (max-width: 480px) {
		.ka-card-content {
			padding: 1rem;
		}

		.ka-key-hint {
			display: none;
		}

		:global(.ka-show-answer-button) {
			height: 44px !important;
		}
	}
</style>
