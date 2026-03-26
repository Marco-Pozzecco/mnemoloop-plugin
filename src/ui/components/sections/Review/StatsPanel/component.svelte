<script lang="ts">
	import { Card, Icon, Button } from '@/ui/components';
	import type StatsPanelProps from './types';

	let {
		stats = {
			totalCards: 0,
			cardsDueToday: 0,
			newCards: 0,
			cardsLearned: 0,
			masteryLevel: 0,
		},
		showActions = true,
		onStartReview,
		onViewCards,
	}: StatsPanelProps = $props();
</script>

<div class="ka-stats-panel">
	<Card title="Statistics" icon="bar-chart">
		<div class="ka-stats-grid">
			<div class="ka-stat-item">
				<div class="ka-stat-icon">
					<Icon name="layers" size={20} />
				</div>
				<div class="ka-stat-content">
					<div class="ka-stat-value">{stats.totalCards}</div>
					<div class="ka-stat-label">Total Cards</div>
				</div>
			</div>

			<div class="ka-stat-item">
				<div class="ka-stat-icon due">
					<Icon name="clock" size={20} />
				</div>
				<div class="ka-stat-content">
					<div class="ka-stat-value highlight">{stats.cardsDueToday}</div>
					<div class="ka-stat-label">Due Today</div>
				</div>
			</div>

			<div class="ka-stat-item">
				<div class="ka-stat-icon new">
					<Icon name="plus" size={20} />
				</div>
				<div class="ka-stat-content">
					<div class="ka-stat-value">{stats.newCards}</div>
					<div class="ka-stat-label">New Cards</div>
				</div>
			</div>

			<div class="ka-stat-item">
				<div class="ka-stat-icon learned">
					<Icon name="check-circle" size={20} />
				</div>
				<div class="ka-stat-content">
					<div class="ka-stat-value">{stats.cardsLearned}</div>
					<div class="ka-stat-label">Learned</div>
				</div>
			</div>
		</div>

		<div class="ka-mastery-bar">
			<div class="ka-mastery-label">
				<span>Mastery Level</span>
				<span class="ka-mastery-value">{stats.masteryLevel}%</span>
			</div>
			<div class="ka-progress-track">
				<div class="ka-progress-fill" style="width: {stats.masteryLevel}%"></div>
			</div>
		</div>

		{#if showActions}
			<div class="ka-stats-actions">
				<Button variant="primary" onclick={onStartReview}>
					<Icon name="play" size={16} />
					Start Review
				</Button>
				<Button variant="secondary" onclick={onViewCards}>View All Cards</Button>
			</div>
		{/if}
	</Card>
</div>

<style>
	.ka-stats-panel {
		width: 100%;
	}

	.ka-stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.ka-stat-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background-color: var(--background-primary);
		border-radius: 6px;
		border: 1px solid var(--background-modifier-border);
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.ka-stat-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.ka-stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		min-width: 40px;
		border-radius: 8px;
		background-color: var(--background-modifier-border);
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.ka-stat-icon.due {
		background-color: rgba(255, 165, 0, 0.15);
		color: var(--text-warning);
	}

	.ka-stat-icon.new {
		background-color: rgba(0, 136, 255, 0.15);
		color: var(--interactive-accent);
	}

	.ka-stat-icon.learned {
		background-color: rgba(50, 200, 50, 0.15);
		color: var(--text-success);
	}

	.ka-stat-content {
		flex: 1;
		min-width: 0;
	}

	.ka-stat-value {
		font-size: var(--font-ui-medium);
		font-weight: var(--font-semibold);
		color: var(--text-normal);
		line-height: 1.2;
		margin-bottom: 0.25rem;
	}

	.ka-stat-value.highlight {
		color: var(--interactive-accent);
		font-weight: var(--font-bold);
	}

	.ka-stat-label {
		font-size: var(--font-ui-smaller);
		color: var(--text-muted);
		line-height: 1.2;
	}

	.ka-mastery-bar {
		margin-bottom: 0.5rem;
	}

	.ka-mastery-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		font-size: var(--font-ui-small);
		color: var(--text-normal);
	}

	.ka-mastery-value {
		font-weight: var(--font-semibold);
		color: var(--interactive-accent);
	}

	.ka-progress-track {
		width: 100%;
		height: 8px;
		background-color: var(--background-modifier-border);
		border-radius: 4px;
		overflow: hidden;
	}

	.ka-progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--interactive-accent), var(--interactive-accent-hover));
		border-radius: 4px;
		transition: width 0.5s ease;
	}

	.ka-stats-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ka-stats-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 0.75rem;
		}

		.ka-stat-item {
			padding: 0.5rem;
		}

		.ka-stat-icon {
			width: 32px;
			height: 32px;
			min-width: 32px;
		}

		.ka-stat-value {
			font-size: var(--font-ui-small);
		}

		.ka-stats-actions {
			flex-direction: column;
		}

		.ka-stats-actions :global(button) {
			width: 100%;
		}
	}
</style>
