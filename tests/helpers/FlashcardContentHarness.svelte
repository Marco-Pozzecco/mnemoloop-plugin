<script lang="ts">
	import { onDestroy } from 'svelte';
	import { App, Component } from 'obsidian';
	import { setAppContext } from '@/ui/context/AppContext';
	import FlashcardContent from '@/ui/components/sections/Review/Flashcard/Content/component.svelte';
	import type FlashcardContentRouterProps from '@/ui/components/sections/Review/Flashcard/Content/types';

	let {
		flashcard,
		sourcePath,
		isAnswerShowing,
		onShowAnswer,
		onSetAnswerCorrectness,
		onAllRevealed,
	}: FlashcardContentRouterProps = $props();

	const app = new App();
	const owner = new Component();
	owner.load();
	setAppContext({ app, component: owner });

	onDestroy(() => {
		owner.unload();
	});
</script>

<FlashcardContent
	{flashcard}
	{sourcePath}
	{isAnswerShowing}
	{onShowAnswer}
	{onSetAnswerCorrectness}
	{onAllRevealed}
/>
