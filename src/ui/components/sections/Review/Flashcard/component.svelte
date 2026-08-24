<script lang="ts">
	import { type Flashcard, CardType } from '@/schemas';
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


	let allContentRevealed = $state(true);
	const handleAllRevealed = () => { allContentRevealed = true; };
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

	// Reset allContentRevealed when flashcard changes (cloze cards start unrevealed)
	$effect(() => {
		flashcard; // track
		if (flashcard?.card_type === CardType.Cloze) {
			allContentRevealed = false;
		} else {
			allContentRevealed = true;
		}
	});
</script>

<div class="ml-flashcard-wrapper">
	<FlashcardContent
		{flashcard}
		sourcePath={item.filepath}
		{isAnswerShowing}
		{onShowAnswer}
		{onSetAnswerCorrectness}
		onAllRevealed={handleAllRevealed}
	/>
	<ScoreControls
		{onSubmitRating}
		{onShowAnswer}
		{isAnswerShowing}
		{isAnswerCorrect}
		type={flashcard?.card_type}
		disabled={!flashcard || !allContentRevealed}
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
