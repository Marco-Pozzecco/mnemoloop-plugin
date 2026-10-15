<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Component, type App } from 'obsidian';
	import { setAppContext } from '@/ui/context/AppContext';
	import type { FlashcardOcclusionContent } from '@/schemas';
	import FlashcardOcclusionContentComponent from '@/ui/components/sections/Review/Flashcard/Content/Occlusion/component.svelte';

	let {
		app,
		content,
		sourcePath = 'cards/occlusion.md',
		isAnswerShowing = false,
		onShowAnswer,
		onSetAnswerCorrectness,
		onAllRevealed,
	}: {
		app: App;
		content: FlashcardOcclusionContent;
		sourcePath?: string;
		isAnswerShowing?: boolean;
		onShowAnswer?: () => void;
		onSetAnswerCorrectness?: (isCorrect: boolean) => void;
		onAllRevealed?: () => void;
	} = $props();

	const owner = new Component();
	owner.load();
	setAppContext({ app, component: owner });

	onDestroy(() => {
		owner.unload();
	});
</script>

<FlashcardOcclusionContentComponent
	{content}
	{sourcePath}
	{isAnswerShowing}
	{onShowAnswer}
	{onSetAnswerCorrectness}
	{onAllRevealed}
/>
