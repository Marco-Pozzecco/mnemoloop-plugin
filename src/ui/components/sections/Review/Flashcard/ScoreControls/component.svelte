<script lang="ts">
	import { Platform } from 'obsidian';
	import { AUTO_SCORED_TYPES } from '@/schemas';
	import { Button } from '@/ui/components/elements';
	import AutoReviewControls from './Auto/component.svelte';
	import ManualReviewControls from './Manual/component.svelte';
	import type ScoreControlsProps from './types';

	let {
		disabled,
		type,
		isAnswerShowing,
		isAnswerCorrect,
		onSubmitRating,
		onShowAnswer,
	}: ScoreControlsProps = $props();

	const isAutoScored = $derived(type ? AUTO_SCORED_TYPES.has(type) : false);
	const isTouchDevice = Platform.isMobile;
	let containerRef: HTMLDivElement;

	function handleKeyDown(event: KeyboardEvent) {
		// Only handle keys when the review view is actually visible (not hidden behind another tab)
		if (!containerRef || containerRef.offsetParent === null) {
			return;
		}
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
			return;
		}
		if (event.code === 'Space') {
			event.preventDefault();
			if (!isAnswerShowing && !disabled) onShowAnswer();
		}
	}

	function handleShowAnswer(): void {
		if (disabled || isAnswerShowing) return;
		onShowAnswer();
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

<div bind:this={containerRef} class="ml-score-controls__container">
	{#if isAnswerShowing}
		{#if isAutoScored}
			<AutoReviewControls {isAnswerCorrect} {disabled} {onSubmitRating} />
		{:else}
			<ManualReviewControls {disabled} {onSubmitRating} />
		{/if}
	{:else}
		<div class="ml-score-controls__button-wrapper">
			<Button
				variant="primary"
				class="ml-score-controls__button"
				onclick={handleShowAnswer}
				ariaLabel="Show answer"
				{disabled}
			>
				Show answer
			</Button>
			<span class="ml-score-controls__button-key-hint">{isTouchDevice ? 'Tap' : 'Space'}</span>
		</div>
	{/if}
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-score-controls__button-wrapper {
		margin-top: $spacing-lg;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $spacing-xs;
	}

	:global(.ml-score-controls__button) {
		width: 100%;
		max-width: 300px;
		height: 50px;
		font-size: $font-md;
		border-radius: $radius-sm;
	}

	.ml-score-controls__button-key-hint {
		font-size: 0.7rem;
		color: $text-muted;
		background-color: $background-secondary;
		padding: $spacing-xxs $spacing-xs;
		border-radius: $radius-sm;
		border: 1px solid $background-modifier-border;
	}
</style>
