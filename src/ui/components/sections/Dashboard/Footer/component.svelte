<script lang="ts">
	import { Button, Icon } from '@/ui/components';
	import type DashboardFooterProps from './types';

	let {
		stats,
		onStartReview,
		isDisabled = false,
		isLoading = false,
		className,
	}: DashboardFooterProps = $props();

	let hasDueCards = $derived(stats.flashcard.due_now > 0);
	let hasNextReview = $derived(new Date(stats.flashcard.next_review) > new Date() && !hasDueCards);
	let countdownDisplay = $state(formatCountdown(getSecondsUntilNextReview()));

	$effect(() => {
		const interval = setInterval(() => {
			const seconds = getSecondsUntilNextReview();
			if (seconds <= 0) {
				clearInterval(interval);
				countdownDisplay = formatCountdown(0);
				hasNextReview = false;
				return;
			}
			countdownDisplay = formatCountdown(seconds);
		}, 1000);

		return () => clearInterval(interval);
	});

	function getSecondsUntilNextReview(): number {
		return Math.floor((new Date(stats.flashcard.next_review).getTime() - Date.now()) / 1000);
	}

	function formatCountdown(seconds: number): string {
		if (seconds <= 0) return '00:00:00';
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = seconds % 60;
		return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':');
	}
</script>

<div class="ka-dashboard__footer-actions {className}">
	<Button
		variant="primary"
		size="large"
		className="ka-start-button"
		disabled={isDisabled}
		onclick={onStartReview}
	>
		{#if isLoading}
			<Icon name="loader-2" className="ka-spin" size={20} />
			<span>Loading...</span>
		{:else if hasNextReview}
			<Icon name="clock" size={20} />
			<span>Next review in {countdownDisplay}</span>
		{:else if hasDueCards}
			<Icon name="play" size={20} />
			<span>Start Review Session</span>
		{:else}
			<Icon name="check-circle" size={20} />
			<span>All Caught Up!</span>
		{/if}
	</Button>
</div>

<style>
	.ka-dashboard__footer-actions {
		margin-top: 8px;
		display: flex;
		justify-content: center;
		gap: 12px;
	}

	:global(.ka-start-button) {
		width: max-content;
		max-width: 400px;
		gap: 12px;
	}

	:global(.ka-spin) {
		animation: ka-spin 1s linear infinite;
	}

	@keyframes ka-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
