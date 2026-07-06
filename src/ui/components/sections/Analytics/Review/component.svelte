<script lang="ts">
	import { ChartReviewSessions } from '@/ui/components/elements';
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
		<ChartReviewSessions {stats} />
	</div>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-analytics-review-stats__grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: $spacing-md;
		margin-bottom: $spacing-lg;
	}

	.ml-stat-card {
		background-color: $background-secondary;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-md;
		padding: $spacing-lg;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		transition: all 0.2s ease;
	}

	.ml-stat-card:hover {
		border-color: $interactive-accent;
		transform: translateY(-2px);
		box-shadow: $shadow-md;
	}

	.ml-stat-card__label {
		font-size: $font-xs;
		color: $text-muted;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 8px;
	}

	.ml-stat-card__value {
		font-size: 28px;
		font-weight: $font-bold;
		color: $interactive-accent;
		margin-bottom: 4px;
		line-height: 1.2;
	}

	.ml-stat-card__description {
		font-size: $font-xs;
		color: $text-faint;
	}

	.ml-analytics-review-stats__chart {
		background-color: $background-secondary;
		border: 1px solid $background-modifier-border;
		border-radius: 12px;
		padding: $spacing-lg;
	}

	@media (max-width: 768px) {
		.ml-analytics-review-stats__grid {
			grid-template-columns: 1fr 1fr;
			gap: $spacing-sm;
		}

		.ml-stat-card {
			padding: $spacing-md $spacing-sm;
		}

		.ml-stat-card__value {
			font-size: 22px;
		}
	}
</style>
