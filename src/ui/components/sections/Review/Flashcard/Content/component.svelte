<script lang="ts">
	import { isFlashcardBase, isFlashcardQuiz, isFlashcardSequence } from '@/schemas';
	import type { MarkdownOptions } from '@/ui/actions/markdown';
	import { renderMarkdown } from '@/ui/actions/markdown';
	import { Card, Skeleton } from '@/ui/components';
	import FlashcardBasicContent from './Basic/component.svelte';
	import FlashcardQuizContent from './Quiz/component.svelte';
	import FlashcardSequenceContent from './Sequence/component.svelte';
	import type FlashcardContentRouterProps from './types';

	let {
		flashcard,
		isAnswerShowing,
		onShowAnswer,
		onSetAnswerCorrectness,
	}: FlashcardContentRouterProps = $props();

	const footerOptions: MarkdownOptions = $derived({
		content: flashcard?.source ?? '',
	});
</script>

{#if flashcard}
	<Card>
		{#if isFlashcardBase(flashcard)}
			<FlashcardBasicContent content={flashcard.content} {isAnswerShowing} />
		{:else if isFlashcardSequence(flashcard)}
			<FlashcardSequenceContent
				content={flashcard.content}
				{isAnswerShowing}
				{onSetAnswerCorrectness}
			/>
		{:else if isFlashcardQuiz(flashcard)}
			<FlashcardQuizContent
				content={flashcard.content}
				{isAnswerShowing}
				{onShowAnswer}
				{onSetAnswerCorrectness}
			/>
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

<style lang="scss">
	@use 'tokens' as *;

	.ml-flashcard-footer {
		font-size: 0.9rem;
		color: $text-muted;
		display: flex;
		flex-direction: row;
		gap: $spacing-xs;

		&-key {
			font-weight: bold;
		}

		&-value {
			flex: 1;
			font-style: italic;
		}
	}
</style>
