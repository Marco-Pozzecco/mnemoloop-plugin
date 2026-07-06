<script lang="ts">
	import { scaleThreshold } from 'd3-scale';
	import { Chart, Layer, Month, Rect, Tooltip } from 'layerchart';
	import type ChartSessionsProps from './types';
	import { getDateRange, getSessionStats, transformSessionsToData } from './utils';
	import { ChartEmptyState } from '@/ui/components';
	import { tokens } from '@/utils/token';

	let { stats, className }: ChartSessionsProps = $props();

	// Container resize tracking
	let containerEl = $state<HTMLElement>();
	let containerWidth = $state(0);

	$effect(() => {
		const el = containerEl;
		if (!el) return;

		containerWidth = el.clientWidth;

		const observer = new ResizeObserver(([entry]) => {
			containerWidth = entry.contentRect.width;
		});
		observer.observe(el);
		return () => observer.disconnect();
	});

	// Derive layout parameters from container width
	function deriveLayout() {
		const layout: { months: number; rows: number } = { months: 0, rows: 0 };

		if (containerWidth < 350) {
			layout.months = 2;
			layout.rows = 2;
		} else if (containerWidth < 450) {
			layout.months = 4;
			layout.rows = 2;
		} else if (containerWidth < 600) {
			layout.months = 6;
			layout.rows = 2;
		} else if (containerWidth < 950) {
			layout.months = 8;
			layout.rows = 2;
		} else {
			layout.months = 12;
			layout.rows = 2;
		}

		return layout;
	}

	const months = $derived.by(() => deriveLayout().months);
	const monthsPerRow = $derived.by(() => deriveLayout().months / deriveLayout().rows);

	// Cell size scales to available width per month column
	const monthCellSize = $derived(
		Math.max(12, Math.min(24, Math.floor((containerWidth / monthsPerRow - 24) / 7))),
	);

	// Chart height derived from month grid layout
	const monthRows = $derived(Math.ceil(months / monthsPerRow));
	const monthLabelHeight = $derived(monthCellSize + 8);
	const rowOfMonths = $derived(monthCellSize * 7 + 10);
	const chartHeight = $derived(
		monthLabelHeight + monthRows * rowOfMonths + (monthRows - 1) * 8 + 20,
	);

	// Center month grid horizontally
	// Grid width = months-per-row * (7 cols * cellSize) + gaps between months
	const gridWidth = $derived(
		monthsPerRow * (monthCellSize * 7) + Math.max(0, monthsPerRow - 1) * (monthCellSize * 1.3),
	);
	const gridOffset = $derived(Math.max(0, Math.floor((containerWidth - gridWidth) / 2)));
	const { start, end } = $derived(getDateRange(months));
	const data = $derived(transformSessionsToData(stats, { start, end }));

	// Calculate max value for dynamic color scale
	const maxValue = $derived(Math.max(...data.map((d) => d.value), 1));
	const t1 = $derived(Math.ceil(maxValue / 3));
	const t2 = $derived(Math.ceil((maxValue * 2) / 3));

	// Color range for the threshold scale
	const cDomain = $derived([1, t1, t2]);
	const cRange = [
		tokens['background-modifier-border'],
		`color-mix(in srgb, ${tokens['interactive-accent']} 25%, transparent)`,
		`color-mix(in srgb, ${tokens['interactive-accent']} 55%, transparent)`,
		tokens['interactive-accent'],
	];

	// Calculate session stats
	const sessionStats = $derived(getSessionStats(data));
</script>

<div class="ml-sessions {className}">
	<!-- Header -->
	<header class="ml-sessions__header">
		<h3 class="ml-sessions__title">Review Sessions</h3>
		<p class="ml-sessions__subtitle">Sessions completed by day</p>
	</header>

	<div class="ml-sessions__body">
		<!-- Chart -->
		<ChartEmptyState show={!stats} message="No sessions data, start reviewing to see your progress">
			<div bind:this={containerEl} class="ml-sessions__chart-container">
				<Chart
					{data}
					{cRange}
					{cDomain}
					cScale={scaleThreshold().unknown('transparent')}
					x="date"
					c="value"
					height={chartHeight}
					padding={containerWidth ? { left: gridOffset, right: gridOffset } : undefined}
					width={containerWidth || undefined}
				>
					{#snippet children({ context })}
						<Layer>
							<Month
								{start}
								{end}
								cellSize={monthCellSize}
								{monthsPerRow}
								monthLabel={true}
								tooltip
							>
								{#snippet children({ cells, cellSize })}
									{#each cells as cell (cell.data)}
										<Rect
											x={cell.x}
											y={cell.y}
											width={Math.max(0, cellSize - 2)}
											height={Math.max(0, cellSize - 2)}
											fill={cell.color ?? 'transparent'}
											rx={2}
											class="lc-month-cell"
											role="button"
											tabindex={0}
											onpointermove={(e) => context.tooltip?.show(e, cell.data)}
											onpointerleave={() => context.tooltip?.hide()}
										/>
									{/each}
								{/snippet}
							</Month>
						</Layer>

						<Tooltip.Root
							classes={{
								root: 'ml-sessions__tooltip-font',
							}}
						>
							{#snippet children({ data: day })}
								<Tooltip.Header value={day.date} format="day" />
								<Tooltip.List>
									<Tooltip.Item label="Sessions" value={day.value} format="integer" />
								</Tooltip.List>
							{/snippet}
						</Tooltip.Root>
					{/snippet}
				</Chart>
			</div>
		</ChartEmptyState>
		<div class="ml-sessions__stats-bar">
			<span class="ml-sessions__stat-badge">
				<span class="ml-sessions__stat-dot"></span>
				<span class="ml-sessions__stat-value">{sessionStats.totalSessions}</span>
				<span>total sessions</span>
			</span>
			<span class="ml-sessions__stat-badge">
				<span class="ml-sessions__stat-dot"></span>
				<span class="ml-sessions__stat-value">{sessionStats.activeDays}</span>
				<span>active days</span>
			</span>
		</div>
	</div>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-sessions {
		width: 100%;
	}

	.ml-sessions__header {
		margin-bottom: 16px;
	}

	.ml-sessions__title {
		margin: 0;
		font-size: $font-md;
		font-weight: $font-semibold;
		color: $text-normal;
	}

	.ml-sessions__subtitle {
		margin: 0;
		margin-top: $spacing-sm;
		font-size: $font-sm;
		color: $text-muted;
	}

	.ml-sessions__body {
		position: relative;
		width: 100%;
	}

	.ml-sessions__stats-bar {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: $spacing-xs;
		margin-top: 12px;
		flex-wrap: wrap;
	}

	.ml-sessions__stat-badge {
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

	.ml-sessions__stat-badge:hover {
		background-color: $background-modifier-active;
	}

	.ml-sessions__stat-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: $interactive-accent;
		flex-shrink: 0;
	}

	.ml-sessions__stat-value {
		color: $text-normal;
		font-weight: $font-md;
	}

	.ml-sessions__chart-container {
		width: 100%;
		height: fit-content;
	}

	.ml-sessions__chart-container :global(svg) {
		display: block;
	}

	/* LayerChart Month cell styling */
	.ml-sessions__chart-container :global(.lc-month-cell) {
		cursor: pointer;
		transition: all 0.2s ease;
		rx: 2;
	}

	.ml-sessions__chart-container :global(.lc-month-cell:hover) {
		stroke: $interactive-accent;
		stroke-width: 2px;
	}

	:global(.ml-sessions__tooltip-font) {
		font-family: $font-interface;
		font-size: $font-sm;
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ml-sessions {
			padding: $spacing-xs;
		}

		.ml-sessions__header {
			margin-bottom: 12px;
		}

		.ml-sessions__chart-container {
			width: 100%;
		}

		.ml-sessions__stats-bar {
			flex-direction: column;
			align-items: center;
			gap: $spacing-xs;
			padding: $spacing-xxs $spacing-xs;
		}
	}
</style>
