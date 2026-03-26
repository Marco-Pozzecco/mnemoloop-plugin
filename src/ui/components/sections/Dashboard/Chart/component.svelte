<script lang="ts">
	import type DashboardChartProps from './types';

	let { stats, history, className }: DashboardChartProps = $props();

	// Chart calculations
	const chartHeight = 120;
	const chartWidth = 400;
	const barPadding = 8;
	let barWidth = $derived(chartWidth / Math.max(history.daily_progress.length, 1) - barPadding);
	let maxCompleted = $derived(
		Math.max(...history.daily_progress.map((d) => d.sessions_completed), stats.daily_goal, 1),
	);
	let goalY = $derived(chartHeight - (stats.daily_goal / maxCompleted) * chartHeight);

	function getBarHeight(completed: number): number {
		return (completed / maxCompleted) * chartHeight;
	}

	function getDayName(dateStr: string): string {
		try {
			const date = new Date(dateStr);
			return date.toLocaleDateString(undefined, { weekday: 'short' });
		} catch (e) {
			return '';
		}
	}
</script>

<section class="ka-dashboard__chart-section {className}" aria-labelledby="progress-chart-title">
	<h2 id="progress-chart-title" class="ka-section-title">7-Day Progress</h2>
	<div class="ka-chart-container">
		<svg
			viewBox="0 0 {chartWidth} {chartHeight + 30}"
			preserveAspectRatio="xMidYMid meet"
			class="ka-progress-chart"
			aria-hidden="true"
		>
			<!-- Goal Line -->
			<line
				x1="0"
				y1={goalY}
				x2={chartWidth}
				y2={goalY}
				stroke="var(--text-muted)"
				stroke-dasharray="4 2"
				stroke-width="1"
				opacity="0.5"
			/>

			{#each history.daily_progress as entry, i}
				{@const x = i * (barWidth + barPadding)}
				{@const h = getBarHeight(entry.sessions_completed)}
				{@const y = chartHeight - h}

				<!-- Bar -->
				<rect
					{x}
					{y}
					width={barWidth}
					height={h}
					rx="4"
					fill={entry.goal_completed
						? 'var(--interactive-accent)'
						: 'var(--background-modifier-border-focus)'}
					class="ka-chart-bar"
				>
					<title>{entry.date}: {entry.sessions_completed} cards</title>
				</rect>

				<!-- Label -->
				<text
					x={x + barWidth / 2}
					y={chartHeight + 20}
					text-anchor="middle"
					font-size="10"
					fill="var(--text-muted)"
				>
					{getDayName(entry.date)}
				</text>
			{/each}
		</svg>
	</div>
</section>

<style>
	.ka-dashboard__chart-section {
		background-color: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 12px;
		padding: 24px;
	}

	.ka-section-title {
		margin: 0;
		font-size: var(--font-ui-medium);
		font-weight: var(--font-semibold);
		color: var(--text-normal);
	}

	.ka-chart-container {
		margin-top: 20px;
		width: 100%;
		overflow: hidden;
	}

	.ka-progress-chart {
		width: 100%;
		height: auto;
		display: block;
	}

	.ka-chart-bar {
		transition: all 0.3s ease;
		cursor: help;
	}

	.ka-chart-bar:hover {
		filter: brightness(1.1);
		opacity: 0.9;
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ka-dashboard__chart-section {
			padding: 16px;
		}
	}
</style>
