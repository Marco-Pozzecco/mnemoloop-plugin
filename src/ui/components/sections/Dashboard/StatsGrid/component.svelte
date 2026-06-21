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

<style>
	.ml-dashboard__stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 16px;
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

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ml-dashboard__stats-grid {
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
