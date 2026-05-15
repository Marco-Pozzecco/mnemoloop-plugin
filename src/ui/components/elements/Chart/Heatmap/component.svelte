<script lang="ts">
	import { scaleThreshold } from 'd3-scale';
	import { Calendar, Chart, Layer, Rect, Tooltip } from 'layerchart';
	import type HeatMapProps from './types';
	import {
		formatRetentionRate,
		getColorRange,
		getYearBounds,
		getYearStats,
		transformStatsToHeatmap,
	} from './utils';

	let { stats, year = new Date().getFullYear(), className }: HeatMapProps = $props();

	const data = $derived(transformStatsToHeatmap(stats, year));

	// Get year bounds for Calendar
	const { start, end } = $derived(getYearBounds(year));

	// Calculate max value for dynamic color scale
	const maxValue = $derived(Math.max(...data.map((d) => d.value), 1));
	const t1 = $derived(Math.ceil(maxValue / 3));
	const t2 = $derived(Math.ceil((maxValue * 2) / 3));

	// Color range for the threshold scale
	const cRange = getColorRange();
	const cDomain = $derived([1, t1, t2, maxValue]);

	// Calculate year stats
	const yearStats = $derived(getYearStats(data, year));
</script>

<div class="ml-heatmap {className}">
	<!-- Header with year stats -->
	<header class="ml-heatmap__header">
		<h3 class="ml-heatmap__title">Learning Activity</h3>
		<div class="ml-heatmap__stats">
			<span class="ml-heatmap__stat">{yearStats.totalCards} cards reviewed</span>
			<span class="ml-heatmap__stat">{yearStats.activeDays} active days</span>
			<span class="ml-heatmap__stat">{yearStats.currentStreak} day streak</span>
		</div>
	</header>

	<!-- LayerChart Heatmap -->
	<div class="ml-heatmap__chart-container">
		<Chart
			{data}
			{cRange}
			{cDomain}
			cScale={scaleThreshold(cDomain, cRange)}
			x="date"
			c="value"
			height={140}
			padding={{ top: 20, bottom: 10 }}
		>
			{#snippet children({ context })}
				<Layer>
					<Calendar {start} {end} monthLabel={true} tooltip>
						{#snippet children({ cells, cellSize })}
							{#each cells as cell (cell.data)}
								<Rect
									x={cell.x}
									y={cell.y}
									width={cellSize[0] - 2}
									height={cellSize[1] - 2}
									fill={cell.color}
									rx={2}
									class="lc-calendar-cell"
									role="button"
									tabindex={0}
									onpointermove={(e) => context.tooltip?.show(e, cell.data)}
									onpointerleave={() => context.tooltip?.hide()}
								/>
							{/each}
						{/snippet}
					</Calendar>
				</Layer>

				<Tooltip.Root
					classes={{
						root: 'ml-heatmap__tooltip-font',
					}}
				>
					{#snippet children({ data })}
						<Tooltip.Header value={data.dateString} />
						<Tooltip.List>
							<Tooltip.Item label="Cards reviewed" value={data.value} format="integer" />
							{#if data.data}
								<Tooltip.Item
									label="Correct"
									value="{data.data.correct_count} ({formatRetentionRate(
										data.data.retention_rate,
									)})"
								/>
								<Tooltip.Item
									label="Sessions"
									value={data.data.sessions_completed}
									format="integer"
								/>
							{/if}
						</Tooltip.List>
					{/snippet}
				</Tooltip.Root>
			{/snippet}
		</Chart>
	</div>
</div>

<style>
	.ml-heatmap {
		width: 100%;
	}

	.ml-heatmap__header {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 16px;
	}

	.ml-heatmap__title {
		margin: 0;
		font-size: var(--font-ui-medium);
		font-weight: var(--font-semibold);
		color: var(--text-normal);
	}

	.ml-heatmap__stats {
		display: flex;
		gap: 16px;
		flex-wrap: wrap;
	}

	.ml-heatmap__stat {
		font-size: var(--font-ui-smaller);
		color: var(--text-muted);
	}

	.ml-heatmap__chart-container {
		position: relative;
		width: 100%;
		min-height: 140px;
		overflow-x: auto;
	}

	.ml-heatmap__chart-container :global(svg) {
		display: block;
	}

	/* LayerChart Calendar cell styling */
	.ml-heatmap__chart-container :global(.lc-calendar-cell) {
		cursor: pointer;
		transition: all 0.2s ease;
		rx: 2;
	}

	.ml-heatmap__chart-container :global(.lc-calendar-cell:hover) {
		stroke: var(--interactive-accent);
		stroke-width: 2px;
	}

	:global(.ml-heatmap__tooltip-font) {
		font-family: var(--font-text) !important;
		font-size: var(--font-ui-small) !important;
	}

	/* Mobile adjustments */
	@media (max-width: 600px) {
		.ml-heatmap {
			padding: 16px;
		}
	}
</style>
