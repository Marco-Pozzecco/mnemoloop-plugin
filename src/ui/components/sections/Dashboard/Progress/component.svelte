<script lang="ts">
	import { ProgressBar } from '@/ui/components';
	import type DashboardProgressProps from './types';

	let { stats, className }: DashboardProgressProps = $props();

	let today = $derived(new Date().toISOString().split('T')[0]);
	let todayProgress = $derived(stats.progress[today] ?? { total_count: 0 });

	let hasDueCards = $derived(stats.flashcard.due_today > 0);
</script>

<section class="ml-dashboard__progress {className}" aria-labelledby="daily-goal-title">
	<div class="ml-section-header">
		<h2 id="daily-goal-title" class="ml-section-title">Daily Goal</h2>
		<span class="ml-section-value" aria-live="polite">
			{todayProgress.total_count} / {stats.flashcard.daily_goal} cards
		</span>
	</div>
	<ProgressBar
		value={todayProgress.total_count}
		max={stats.flashcard.daily_goal}
		showPercentage
		ariaLabel="Daily review progress"
	/>
	{#if hasDueCards}
		<p class="ml-progress-estimate">
			Estimated time: <strong>{stats.flashcard.expected_review_time} min</strong> to finish due cards
		</p>
	{/if}
</section>

<style>
	.ml-dashboard__progress {
		background-color: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 12px;
		padding: 24px;
	}

	.ml-section-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 16px;
	}

	.ml-section-title {
		margin: 0;
		font-size: var(--font-ui-medium);
		font-weight: var(--font-semibold);
		color: var(--text-normal);
	}

	.ml-section-value {
		font-size: var(--font-ui-small);
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	.ml-progress-estimate {
		margin: 16px 0 0 0;
		font-size: var(--font-ui-small);
		color: var(--text-muted);
		text-align: center;
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ml-dashboard__progress {
			padding: 16px;
		}
	}
</style>
