<script lang="ts">
	import { ChartEmptyState } from '@/ui/components';
	import { Logger } from '@/utils/Logger';
	import { AreaChart, defaultChartPadding, Tooltip } from 'layerchart';
	import type ChartCumulativeCardsProps from './types';
	import { computeCumulativeByDay } from './utils';

	let { flashcards, className }: ChartCumulativeCardsProps = $props();

	const data = $derived(computeCumulativeByDay(flashcards));
	$effect(() => {
		Logger.info('Flashcards', flashcards);
		Logger.info('Data', data);
	});
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
					fill: 'var(--ml-interactive-accent)',
					fillOpacity: 0.3,
					stroke: 'var(--ml-interactive-accent)',
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

<style>
	.ml-chart-cumulative {
		background-color: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 12px;
		padding: 20px;
	}

	.ml-chart-cumulative__header {
		display: flex;
		flex-direction: column;
		gap: var(--ml-spacing-sm);
		margin-bottom: var(--ml-spacing-sm);
	}

	.ml-chart-cumulative__title {
		font-size: var(--font-ui-medium);
		font-weight: var(--font-semibold);
		color: var(--text-normal);
	}

	.ml-chart-cumulative__subtitle {
		font-size: var(--font-ui-small);
		color: var(--text-muted);
	}
</style>
