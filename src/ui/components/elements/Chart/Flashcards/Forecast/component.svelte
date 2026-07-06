<script lang="ts">
	import { ForecastChartController } from '@/ui/controllers/ForecastChartController';
	import { scaleBand } from 'd3-scale';
	import {
		AnnotationLine,
		Axis,
		Bars,
		Chart,
		groupStackData,
		Highlight,
		Layer,
		Rule,
		Tooltip,
	} from 'layerchart';
	import { onDestroy, onMount } from 'svelte';
	import { ChartEmptyState, Tabs } from '@/ui/components';
	import { type ForecastChartTimeframe } from '@/ui/store/chart.forecast.store';
	import { capitalize } from '@/utils/String';
	import { tokens } from '@/utils/token';

	const workloadController = new ForecastChartController();

	const storeRef = workloadController.store;
	const state = $derived($storeRef);

	const data = $derived(state.data);
	const groupedData = $derived.by(() => groupStackData(data, { xKey: 'date', stackBy: 'entity' }));
	const timeframe = $derived(state.timeframe);

	onMount(async () => {
		await workloadController.init();
	});

	onDestroy(() => {
		workloadController.dispose();
	});

	// Compute average due cards per day for the reference line
	let average = $derived.by(() => {
		const nonEmpty = data.filter((d) => d.value > 0);
		if (nonEmpty.length === 0) return 0;
		const total = nonEmpty.reduce((acc, curr) => acc + curr.value, 0);
		const days = nonEmpty.map((d) => d.date).unique().length;
		return total / days;
	});

	// Color scale for entities (alphabetical: flashcard=index0, overdue=index1)
	const cRange = [tokens['interactive-accent'], tokens['red']];

	function onTabChange(value: ForecastChartTimeframe) {
		workloadController.setTimeframe(value);
	}
</script>

{#snippet timeframeTabs(isMobile: boolean)}
	<div class="ml-chart-workload__timeframe-tabs" class:mobile={isMobile}>
		<Tabs.Root onValueChange={(v) => onTabChange(v as ForecastChartTimeframe)} value={timeframe}>
			<Tabs.List>
				<Tabs.Trigger value="month">Month</Tabs.Trigger>
				<Tabs.Trigger value="quarter">Quarter</Tabs.Trigger>
				<Tabs.Trigger value="year">Year</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
	</div>
{/snippet}

<ChartEmptyState show={data.length === 0} message="No reviews scheduled">
	<div class="ml-chart-workload">
		<div class="ml-chart-workload__header-section">
			<div class="ml-chart-workload__header">
				<h3 class="ml-chart-workload__title">Upcoming Reviews</h3>
				<p class="ml-chart-workload__subtitle">Daily review load across the selected timeframe</p>
			</div>
			{@render timeframeTabs(false)}
		</div>
		<Chart
			data={groupedData}
			x="date"
			xScale={scaleBand().padding(0.2)}
			y="values"
			yDomain={[0, null]}
			c="entity"
			{cRange}
			padding={{ top: 20, right: 16, bottom: 40, left: 40 }}
			tooltipContext={{ mode: 'band' }}
			height={300}
		>
			<Layer>
				<Axis placement="left" label="Reviews" labelProps={{ 'font-size': '14px' }} />
				<Axis placement="bottom" tickSpacing={80} />
				<Bars area />
				<Highlight area />
				<Rule x y />
				{#if average > 0}
					<AnnotationLine
						y={average}
						label="Average"
						props={{
							label: { fill: tokens['text-muted'] },
							line: {
								stroke: tokens['text-muted'],
								dashArray: '6 3',
							},
						}}
					/>
				{/if}
			</Layer>

			<Tooltip.Root>
				{#snippet children({ data: tooltipData })}
					<Tooltip.Header value={tooltipData.date} />
					<Tooltip.List>
						{#each tooltipData.data as d (d.entity)}
							{#if d.value > 0}
								<Tooltip.Item
									label={capitalize(d.entity)}
									value={d.value}
									format="integer"
									valueAlign="right"
								/>
							{/if}
						{/each}
						{#if tooltipData.data.reduce((acc: number, curr: { value: number }) => acc + curr.value, 0) > 0}
							<Tooltip.Separator />
						{/if}

						<Tooltip.Item
							label="Total"
							value={tooltipData.values.reduce((a: number, b: number) => a + b, 0)}
							format="integer"
						/>
					</Tooltip.List>
				{/snippet}
			</Tooltip.Root>
		</Chart>
		{@render timeframeTabs(true)}
	</div>
</ChartEmptyState>

<style lang="scss">
	@use 'tokens' as *;
	@use 'breakpoints' as *;

	.ml-chart-workload {
		width: 100%;
		min-height: 200px;
	}

	.ml-chart-workload__header-section {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: $spacing-sm;
	}

	.ml-chart-workload__header {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
	}

	.ml-chart-workload__title {
		font-size: $font-md;
		margin: 0;
	}

	.ml-chart-workload__subtitle {
		color: $text-muted;
		font-size: $font-sm;
		margin: 0;
	}

	.ml-chart-workload__timeframe-tabs {
		display: flex;
		justify-content: flex-end;
	}

	.ml-chart-workload__timeframe-tabs.mobile {
		width: 100%;
		display: none;
		margin-top: $spacing-sm;
	}

	@media (max-width: $tablet-breakpoint) {
		.ml-chart-workload__timeframe-tabs:not(.mobile) {
			display: none;
		}

		.ml-chart-workload__timeframe-tabs.mobile {
			display: block;
		}
	}
</style>
