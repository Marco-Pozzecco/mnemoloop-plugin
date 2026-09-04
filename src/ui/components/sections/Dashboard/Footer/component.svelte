<script lang="ts">
	import { Button, Card, Icon } from '@/ui/components';
	import type DashboardFooterProps from './types';
	import { SvelteMap } from 'svelte/reactivity';

	let {
		stats,
		onStartReview,
		onStartPriming,
		reviewDueCount,
		primingAvailability,
		difficultyThreshold = 7,
		isLoading = false,
		selectedDeck = null,
	}: DashboardFooterProps = $props();

	let hasDueCards = $derived(reviewDueCount > 0);
	let hasNextReview = $derived(new Date(stats.flashcard.next_review) > new Date() && !hasDueCards);
	let isReviewDisabled = $derived(reviewDueCount === 0 || isLoading);
	let isPrimingDisabled = $derived(
		primingAvailability === 'checking' || primingAvailability === 'empty',
	);
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

<Card class="ml-dashboard__study-actions">
	<header class="ml-dashboard__study-actions__header">
		<h2 id="ml-dashboard-study-actions-title">Study next</h2>
		<span class="ml-dashboard__study-actions__deck">{selectedDeck?.name ?? 'All decks'}</span>
	</header>
	<div class="ml-dashboard__study-actions__controls">
		<Button
			variant="primary"
			size="large"
			class="ml-start-button"
			disabled={isReviewDisabled}
			onclick={onStartReview}
		>
			{#if isLoading}
				<Icon name="loader-2" class="ml-spin" size={20} />
				<span>Loading...</span>
			{:else if reviewDueCount > 0}
				<Icon name="play" size={20} />
				<span>Review {reviewDueCount} due {reviewDueCount === 1 ? 'card' : 'cards'}</span>
			{:else if hasNextReview}
				<Icon name="clock" size={20} />
				<span>Next review in {countdownDisplay}</span>
			{:else}
				<Icon name="check-circle" size={20} />
				<span>All caught up!</span>
			{/if}
		</Button>
		<Button
			variant="secondary"
			size="large"
			class="ml-prime-button"
			disabled={isPrimingDisabled}
			onclick={onStartPriming}
		>
			<span class="ml-prime-button__label">Prime difficult notes</span>
			<span class="ml-prime-button__support">
				{primingAvailability === 'empty'
					? 'No difficult notes due'
					: `Difficulty > ${difficultyThreshold.toFixed(1)}`}
			</span>
		</Button>
	</div>
</Card>

<style lang="scss">
	@use 'tokens' as *;

	:global .ml-card.ml-dashboard__study-actions {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
		background-color: $background-primary;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-xs;
	}

	.ml-dashboard__study-actions__header {
		display: flex;
		flex-direction: column;
		gap: $spacing-xxs;
	}

	.ml-dashboard__study-actions__header h2 {
		margin: 0;
		font-size: $font-md;
		font-weight: $font-semibold;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: $text-muted;
	}

	.ml-dashboard__study-actions__deck {
		font-size: $font-sm;
		font-weight: $font-normal;
		color: $text-normal;
	}

	.ml-dashboard__study-actions__controls {
		display: flex;
		gap: $spacing-sm;
		margin-top: $spacing-sm;
	}

	/* Override the shared Button variants for the Penpot 56px action geometry. */
	:global(.ml-dashboard__study-actions .ml-button[data-button-root].ml-start-button) {
		height: 56px;
		min-height: 56px;
		font-size: 14px;
		font-weight: $font-semibold;
		flex: 3 1 0;
		gap: $spacing-sm;
		//   background-color: $text-normal;
		//   color: $background-primary;
		//   border-color: transparent;
		// white-space: normal;
		//   padding: 0 $spacing-md;
		//   border-radius: $radius-xs;
	}

	:global(.ml-dashboard__study-actions .ml-button[data-button-root].ml-prime-button) {
		height: 56px;
		min-height: 56px;
		font-size: 14px;
		font-weight: $font-semibold;
		flex: 2 1 0;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		gap: 2px;
		white-space: normal;
		background-color: $background-primary;
		border: 1px solid $background-modifier-border;

		// color: $text-normal;
		// padding: 0 $spacing-md;
		// border-radius: $radius-xs;

		&:hover:not(:disabled) {
			background-color: $background-modifier-hover;
		}
	}

	:global(.ml-prime-button__label) {
		font-weight: $font-semibold;
	}

	:global(.ml-prime-button__support) {
		font-size: 12px;
		font-weight: $font-normal;
		color: $text-muted;
	}

	@media (max-width: 480px) {
		.ml-dashboard__study-actions__controls {
			flex-direction: column;
			gap: $spacing-xs;
		}

		:global(.ml-dashboard__study-actions .ml-button[data-button-root].ml-start-button),
		:global(.ml-dashboard__study-actions .ml-button[data-button-root].ml-prime-button) {
			width: 100%;
			flex: none;
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
