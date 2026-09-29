<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Component, type App } from 'obsidian';
	import { setAppContext } from '@/ui/context/AppContext';
	import type { Flashcard } from '@/schemas';
	import type { IReviewItem } from '@/interfaces/IReviewItem';
	import type { Rating } from 'ts-fsrs';
	import FlashcardComponent from '@/ui/components/sections/Review/Flashcard/component.svelte';

	let {
		app,
		item,
		isAnswerShowing = false,
		isAnswerCorrect = false,
		onShowAnswer = () => {},
		onSubmitRating = (_rating: Rating) => {},
		onSetAnswerCorrectness = (_isCorrect: boolean) => {},
		onSwipeLeft = () => {},
		onSwipeRight = () => {},
		onTap = () => {},
	}: {
		app: App;
		item: IReviewItem<Flashcard>;
		isAnswerShowing?: boolean;
		isAnswerCorrect?: boolean;
		onShowAnswer?: () => void;
		onSubmitRating?: (rating: Rating) => void;
		onSetAnswerCorrectness?: (isCorrect: boolean) => void;
		onSwipeLeft?: () => void;
		onSwipeRight?: () => void;
		onTap?: () => void;
	} = $props();

	const owner = new Component();
	owner.load();
	setAppContext({ app, component: owner });

	onDestroy(() => {
		owner.unload();
	});
</script>

<FlashcardComponent
	{item}
	{isAnswerShowing}
	{isAnswerCorrect}
	{onShowAnswer}
	{onSubmitRating}
	{onSetAnswerCorrectness}
	{onSwipeLeft}
	{onSwipeRight}
	{onTap}
/>
