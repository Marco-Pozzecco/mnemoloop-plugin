<script lang="ts">
	import { isFlashcardBase, isFlashcardSequence } from '@/schemas';
	import { Skeleton } from '@/ui/components';
	import FlashcardBasicContent from './Basic/component.svelte';
	import FlashcardSequenceContent from './Sequence/component.svelte';
	import type FlashcardContentRouterProps from './types';

	let { flashcard, showingAnswer, onResult }: FlashcardContentRouterProps = $props();
</script>

{#if flashcard}
	{#if isFlashcardBase(flashcard)}
		<FlashcardBasicContent content={flashcard.content} {showingAnswer} {onResult} />
	{:else if isFlashcardSequence(flashcard)}
		<FlashcardSequenceContent content={flashcard.content} {showingAnswer} {onResult} />
	{/if}
{:else}
	<Skeleton width="full" height="200px" shape="default" radius="8px" />
{/if}
