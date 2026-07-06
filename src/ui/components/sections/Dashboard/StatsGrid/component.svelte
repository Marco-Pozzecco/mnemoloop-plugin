<script lang="ts">
	import type DashboardStatsGridProps from './types';

	let { stats, className }: DashboardStatsGridProps = $props();

	function formatPercent(value: number): string {
		return `${Math.round(value * 100)}%`;
	}
</script>

<div class="ml-dashboard__stats-grid {className}">
	<div class="ml-stat-card">
		<span class="ml-stat-card__label">Due</span>
		<span class="ml-stat-card__value">{stats.flashcard.due_now}</span>
		<span class="ml-stat-card__description">cards to review</span>
	</div>

	<div class="ml-stat-card">
		<span class="ml-stat-card__label">Retention</span>
		<span class="ml-stat-card__value">{formatPercent(stats.flashcard.retention_rate)}</span>
		<span class="ml-stat-card__description">average accuracy</span>
	</div>

	<div class="ml-stat-card">
		<span class="ml-stat-card__label">Streak</span>
		<span class="ml-stat-card__value">{stats.flashcard.current_streak}</span>
		<span class="ml-stat-card__description">days in a row</span>
	</div>

	<div class="ml-stat-card">
		<span class="ml-stat-card__label">Total cards</span>
		<span class="ml-stat-card__value">{stats.flashcard.total_cards}</span>
		<span class="ml-stat-card__description">in your vault</span>
	</div>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-dashboard__stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: $spacing-md;
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

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ml-dashboard__stats-grid {
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
