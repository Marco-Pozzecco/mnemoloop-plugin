<script lang="ts">
	import { type FlashcardBaseContent } from '@/schemas';
	import { type MarkdownOptions, renderMarkdown } from '@/ui/actions/markdown';
	import type { FlashcardContentProps } from '../types';

	let { content, sourcePath, isAnswerShowing }: FlashcardContentProps<FlashcardBaseContent> = $props();

	const frontOptions: MarkdownOptions = $derived({
		content: content?.front ?? '',
		sourcePath,
	});

	const backOptions: MarkdownOptions = $derived({
		content: content?.back ?? '',
		sourcePath,
	});
</script>

{#if isAnswerShowing}
	<div class="ml-flashcard-front" use:renderMarkdown={frontOptions}></div>
	<div class="ml-flashcard-back" use:renderMarkdown={backOptions}></div>
{:else}
	<div class="ml-flashcard-front" use:renderMarkdown={frontOptions}></div>
{/if}

<style lang="scss">
	@use 'tokens' as *;

	.ml-flashcard-front,
	.ml-flashcard-back {
		line-height: 1.6;
	}

	.ml-flashcard-back {
		padding-top: 1rem;
		border-top: 1px solid $background-modifier-border;
	}

	@media (max-width: 480px) {
		.ml-flashcard-back {
			padding-top: 0.75rem;
		}
	}
</style>
