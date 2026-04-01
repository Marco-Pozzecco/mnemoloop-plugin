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

	let hasDueCards = $derived(stats.due_today > 0);
	let hasNextReview = $derived(stats.next_review_in > 0);
	let countdownDisplay = $derived(formatCountdown(stats.next_review_in));
	let isCountdownActive = $derived(hasNextReview && !isLoading);

	$effect(() => {
		if (!isCountdownActive) return;

		const interval = setInterval(() => {
			const currentValue = stats.next_review_in;
			if (currentValue > 0) {
				countdownDisplay = formatCountdown(currentValue - 1);
			}
		}, 1000);

		return () => clearInterval(interval);
	});

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
		disabled={isDisabled || hasNextReview}
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
	}

	:global(.ka-start-button) {
		width: 100%;
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
