<script lang="ts">
	import { type Flashcard } from '@/schemas';
	import FlashcardContent from './Content/component.svelte';
	import ScoreControls from './ScoreControls/component.svelte';
	import type FlashCardProps from './types';

	let {
		item,
		isAnswerCorrect,
		isAnswerShowing,
		onShowAnswer,
		onSubmitRating,
		onSetAnswerCorrectness,
	}: FlashCardProps = $props();

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
</script>

<div class="ml-flashcard-wrapper">
	<FlashcardContent {flashcard} {isAnswerShowing} {onShowAnswer} {onSetAnswerCorrectness} />
	<ScoreControls
		{onSubmitRating}
		{onShowAnswer}
		{isAnswerShowing}
		{isAnswerCorrect}
		type={flashcard?.card_type}
		disabled={!flashcard}
	/>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-flashcard-wrapper {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
	}
</style>
