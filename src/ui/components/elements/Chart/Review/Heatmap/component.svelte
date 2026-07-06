<script lang="ts">
	import { scaleThreshold } from 'd3-scale';
	import { Calendar, Chart, Layer, Rect, Tooltip } from 'layerchart';
	import type HeatMapProps from './types';
	import {
		formatRetentionRate,
		getColorRange,
		getLastMonthsBounds,
		getYearBounds,
		getYearStats,
		transformStatsToHeatmap,
	} from './utils';

	let { stats, year = new Date().getFullYear(), className }: HeatMapProps = $props();

	// Viewport detection for responsive date range
	let isMobile = $state(false);

	$effect(() => {
		if (typeof window === 'undefined') return;

		const mq = window.matchMedia('(max-width: 480px)');
		isMobile = mq.matches;

		const handler = (e: MediaQueryListEvent) => {
			isMobile = e.matches;
		};

		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});

	// Calculate date bounds based on viewport
	const bounds = $derived(isMobile ? getLastMonthsBounds(6) : getYearBounds(year));
	const { start, end } = $derived(bounds);

	const data = $derived(
		isMobile ? transformStatsToHeatmap(stats, year, bounds) : transformStatsToHeatmap(stats, year),
	);

	// Calculate max value for dynamic color scale
	const maxValue = $derived(Math.max(...data.map((d) => d.value), 1));
	const t1 = $derived(Math.ceil(maxValue / 3));
	const t2 = $derived(Math.ceil((maxValue * 2) / 3));

	// Color range for the threshold scale
	const cRange = getColorRange();
	const cDomain = $derived([1, t1, t2]);

	// Calculate year stats
	const yearStats = $derived(getYearStats(data, isMobile ? undefined : year));
</script>

<div class="ml-heatmap {className}">
	<!-- Header -->
	<header class="ml-heatmap__header">
		<h3 class="ml-heatmap__title">Learning Activity</h3>
		<p class="ml-heatmap__subtitle">Total review count by day</p>
	</header>

	<div class="ml-heatmap__body">
		<!-- LayerChart Heatmap -->
		<div class="ml-heatmap__chart-container">
			<Chart
				{data}
				{cRange}
				{cDomain}
				cScale={scaleThreshold().unknown('transparent')}
				x="date"
				c="value"
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
										width={Math.max(0, cellSize[0] - 2)}
										height={Math.max(0, cellSize[1] - 2)}
										fill={cell.color ?? 'transparent'}
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
		<div class="ml-heatmap__stats-bar">
			<span class="ml-heatmap__stat-badge">
				<span class="ml-heatmap__stat-dot"></span>
				<span class="ml-heatmap__stat-value">{yearStats.totalCards}</span>
				<span>cards reviewed</span>
			</span>
			<span class="ml-heatmap__stat-badge">
				<span class="ml-heatmap__stat-dot"></span>
				<span class="ml-heatmap__stat-value">{yearStats.activeDays}</span>
				<span>active days</span>
			</span>
		</div>
	</div>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-heatmap {
		width: 100%;
	}

	.ml-heatmap__header {
		margin-bottom: 16px;
	}

	.ml-heatmap__title {
		margin: 0;
		font-size: $font-md;
		font-weight: $font-semibold;
		color: $text-normal;
	}

	.ml-heatmap__subtitle {
		margin: 0;
		margin-top: $spacing-sm;
		font-size: $font-sm;
		color: $text-muted;
	}

	.ml-heatmap__body {
		position: relative;
		width: 100%;
	}

	.ml-heatmap__stats-bar {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: $spacing-xs;
		margin-top: 12px;
		flex-wrap: wrap;
	}

	.ml-heatmap__stat-badge {
		display: inline-flex;
		align-items: center;
		gap: $spacing-xs;
		padding: $spacing-xxs $spacing-sm;
		border-radius: $radius-md;
		background-color: $background-modifier-hover;
		border: 1px solid $background-modifier-border;
		font-size: $font-xs;
		color: $text-muted;
		transition: background-color $transition-fast;
	}

	.ml-heatmap__stat-badge:hover {
		background-color: $background-modifier-active;
	}

	.ml-heatmap__stat-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: $interactive-accent;
		flex-shrink: 0;
	}

	.ml-heatmap__stat-value {
		color: $text-normal;
		font-weight: $font-md;
	}

	.ml-heatmap__chart-container {
		position: relative;
		width: 100%;
		height: 140px;
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
		stroke: $interactive-accent;
		stroke-width: 2px;
	}

	:global(.ml-heatmap__tooltip-font) {
		font-family: $font-interface;
		font-size: $font-sm;
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ml-heatmap {
			padding: $spacing-xs;
		}

		.ml-heatmap__header {
			margin-bottom: 12px;
		}

		.ml-heatmap__chart-container {
			width: 100%;
			height: 140px;
		}

		.ml-heatmap__stats-bar {
			flex-direction: column;
			align-items: center;
			gap: $spacing-xs;
			padding: $spacing-xxs $spacing-xs;
		}
	}
</style>
