<script lang="ts">
	import { ChartSessions } from '@/ui/components/elements';
	import { analyticsStore } from '@/ui/store/analytics.store';
	import type AnalyticsReviewProps from './types';

	let { className }: AnalyticsReviewProps = $props();

	const storeRef = $derived(analyticsStore.store);
	const state = $derived($storeRef);
	const stats = $derived(state.stats);

	function formatDuration(seconds: number): string {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		if (h > 0) return `${h}h ${m}m`;
		return `${m}m`;
	}

	function formatPercent(value: number): string {
		return `${Math.round(value * 100)}%`;
	}

	// Aggregated stats
	const totalReviews = $derived(stats?.flashcard?.total_reviews ?? 0);
	const totalTime = $derived(stats?.sessions.reduce((sum, s) => sum + s.duration_s, 0) ?? 0);
	const bestStreak = $derived(stats?.flashcard?.longest_streak ?? 0);
	const avgAccuracy = $derived(stats?.flashcard?.retention_rate ?? 0);
</script>

<div class="ml-analytics-review-stats {className ?? ''}">
	<div class="ml-analytics-review-stats__grid">
		<div class="ml-stat-card">
			<span class="ml-stat-card__label">Total Reviews</span>
			<span class="ml-stat-card__value">{totalReviews.toLocaleString()}</span>
			<span class="ml-stat-card__description">cards reviewed</span>
		</div>
		<div class="ml-stat-card">
			<span class="ml-stat-card__label">Total Time</span>
			<span class="ml-stat-card__value">{formatDuration(totalTime)}</span>
			<span class="ml-stat-card__description">spent reviewing</span>
		</div>
		<div class="ml-stat-card">
			<span class="ml-stat-card__label">Best Streak</span>
			<span class="ml-stat-card__value">{bestStreak}</span>
			<span class="ml-stat-card__description">days in a row</span>
		</div>
		<div class="ml-stat-card">
			<span class="ml-stat-card__label">Avg Accuracy</span>
			<span class="ml-stat-card__value">{formatPercent(avgAccuracy)}</span>
			<span class="ml-stat-card__description">retention rate</span>
		</div>
	</div>

	<div class="ml-analytics-review-stats__chart">
		<ChartSessions {stats} />
	</div>
</div>

<style>
	.ml-analytics-review-stats__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 16px;
		margin-bottom: 24px;
	}

	.ml-stat-card {
		background-color: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 8px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		transition: all 0.2s ease;
	}

	.ml-stat-card:hover {
		border-color: var(--interactive-accent);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px var(--ml-shadow-color);
	}

	.ml-stat-card__label {
		font-size: var(--font-ui-smaller);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 8px;
	}

	.ml-stat-card__value {
		font-size: 28px;
		font-weight: var(--font-bold);
		color: var(--interactive-accent);
		margin-bottom: 4px;
		line-height: 1.2;
	}

	.ml-stat-card__description {
		font-size: var(--font-ui-smaller);
		color: var(--text-faint);
	}

	.ml-analytics-review-stats__chart {
		background-color: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 12px;
		padding: 20px;
	}

	@media (max-width: 768px) {
		.ml-analytics-review-stats__grid {
			grid-template-columns: 1fr 1fr;
			gap: 12px;
		}

		.ml-stat-card {
			padding: 16px 12px;
		}

		.ml-stat-card__value {
			font-size: 22px;
		}
	}
</style>
