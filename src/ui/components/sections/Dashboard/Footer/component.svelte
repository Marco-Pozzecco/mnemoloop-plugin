<script lang="ts">
	import { Button, Icon } from '@/ui/components';
	import type DashboardFooterProps from './types';
	import { SvelteMap } from 'svelte/reactivity';

	let {
		stats,
		onStartReview,
		onStartPriming,
		isDisabled = false,
		isPrimingDisabled = false,
		difficultyThreshold = 7,
		isLoading = false,
		selectedDeck = null,
		className,
	}: DashboardFooterProps = $props();

	let hasDueCards = $derived(stats.flashcard.due_now > 0);
	let hasNextReview = $derived(new Date(stats.flashcard.next_review) > new Date() && !hasDueCards);
	let countdownDisplay = $state(formatCountdown(getSecondsUntilNextReview()));

	$effect(() => {
		const interval = window.setInterval(() => {
			const seconds = getSecondsUntilNextReview();
			if (seconds <= 0) {
				window.clearInterval(interval);
				countdownDisplay = formatCountdown(0);
				hasNextReview = false;
				return;
			}
			countdownDisplay = formatCountdown(seconds);
		}, 1000);

		return () => window.clearInterval(interval);
	});

	function getSecondsUntilNextReview(): number {
		return Math.floor((new Date(stats.flashcard.next_review).getTime() - Date.now()) / 1000);
	}

	function formatCountdown(seconds: number): string {
		const timeMap: Map<string, number> = new SvelteMap();

		if (seconds <= 0) return '0s';

		timeMap.set('d', Math.floor(seconds / 86400));
		timeMap.set('h', Math.floor((seconds % 86400) / 3600));
		timeMap.set('m', Math.floor((seconds % 3600) / 60));
		timeMap.set('s', seconds % 60);

		let result = '';

		timeMap.forEach((v, k) => {
			if (v === 0) return;
			result += `${v.toString().padStart(2, '0')}${k} `;
		});

		return result;
	}
</script>

	
	<div class="ml-dashboard__footer-actions {className}">
		<Button
			variant="secondary"
			size="large"
			class="ml-prime-button"
			disabled={isPrimingDisabled}
			onclick={onStartPriming}
		>
		<span class="ml-prime-button__label">Prime difficult notes</span>
		<span class="ml-prime-button__context">
			{`${selectedDeck ? selectedDeck.name : 'All decks'} · difficulty > ${difficultyThreshold.toFixed(1)}`}
		</span>
	</Button>
	<Button
		variant="primary"
		size="large"
		class="ml-start-button"
		disabled={isDisabled}
		onclick={onStartReview}
	>
		{#if isLoading}
			<Icon name="loader-2" class="ml-spin" size={20} />
			<span>Loading...</span>
		{:else if hasNextReview}
			<Icon name="clock" size={20} />
			<span>Next review in {countdownDisplay}</span>
		{:else if selectedDeck}
			<Icon name="play" size={20} />
			<span>Review {selectedDeck.name} ({selectedDeck.dueNow} due now)</span>
		{:else if hasDueCards}
			<Icon name="play" size={20} />
			<span>Start review session</span>
		{:else}
			<Icon name="check-circle" size={20} />
			<span>All caught up!</span>
		{/if}
	</Button>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-dashboard__footer-actions {
		margin-top: 8px;
		display: flex;
		justify-content: center;
		gap: $spacing-sm;
	}

	:global(.ml-start-button) {
		width: max-content;
		max-width: 400px;
		gap: $spacing-sm;
	}
	:global(.ml-prime-button) {
		width: max-content;
		max-width: 400px;
		align-items: center;
		gap: 2px;
	}

	:global(.ml-prime-button__label) {
		font-weight: $font-semibold;
	}

	:global(.ml-prime-button__context) {
		font-size: $font-xs;
		color: $text-muted;
	}

	@media (max-width: 480px) {
		.ml-dashboard__footer-actions {
			flex-direction: column;
			align-items: stretch;
			width: 100%;
		}

		:global(.ml-prime-button),
		:global(.ml-start-button) {
			width: 100%;
			max-width: none;
		}
	}

	:global(.ml-spin) {
		animation: ml-spin 1s linear infinite;
	}

	@keyframes ml-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
