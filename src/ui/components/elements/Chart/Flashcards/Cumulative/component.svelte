<script lang="ts">
	import { ChartEmptyState } from '@/ui/components';
	import { AreaChart, defaultChartPadding, Tooltip } from 'layerchart';
	import type ChartCumulativeCardsProps from './types';
	import { computeCumulativeByDay } from './utils';
	import { tokens } from '@/utils/token';

	let { flashcards, className }: ChartCumulativeCardsProps = $props();

	const data = $derived(computeCumulativeByDay(flashcards));
</script>

<div class="ml-chart-cumulative {className ?? ''}">
	<div class="ml-chart-cumulative__header">
		<div class="ml-chart-cumulative__title">Cumulative flashcards</div>
		<div class="ml-chart-cumulative__subtitle">Cumulative amount of flashcards over time</div>
	</div>
	<ChartEmptyState
		show={data.length <= 1}
		message="No flashcards yet. Start adding cards to see your growth."
	>
		<AreaChart
			{data}
			x="date"
			y="cumulative"
			padding={defaultChartPadding({ right: 10 })}
			height={260}
			props={{
				area: {
					fill: tokens['interactive-accent'],
					fillOpacity: 0.3,
					stroke: tokens['interactive-accent'],
					strokeOpacity: 0.6,
					strokeWidth: 2,
				},
				xAxis: {
					rule: true,
				},
				yAxis: {
					rule: true,
					grid: true,
				},
			}}
		>
			{#snippet tooltip()}
				<Tooltip.Root>
					{#snippet children({ data: point })}
						<Tooltip.Header value={point.date} format="day" />
						<Tooltip.List>
							<Tooltip.Item label="Total cards" value={point.cumulative} format="integer" />
						</Tooltip.List>
					{/snippet}
				</Tooltip.Root>
			{/snippet}
		</AreaChart>
	</ChartEmptyState>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-chart-cumulative {
		background-color: $background-secondary;
		border: 1px solid $background-modifier-border;
		border-radius: 12px;
		padding: $spacing-lg;
	}

	.ml-chart-cumulative__header {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
		margin-bottom: $spacing-sm;
	}

	.ml-chart-cumulative__title {
		font-size: $font-md;
		font-weight: $font-semibold;
		color: $text-normal;
	}

	.ml-chart-cumulative__subtitle {
		font-size: $font-sm;
		color: $text-muted;
	}
</style>
