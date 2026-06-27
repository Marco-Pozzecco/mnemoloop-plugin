<script lang="ts">
	import { ChartEmptyState } from '@/ui/components';
	import { AnnotationLine, Axis, Chart, Highlight, Layer, Spline, Tooltip } from 'layerchart';
	import type RetentionRateChartProps from './types';
	import { computeRetentionRateOverTime } from './utils';

	let { stats, requestRetention, className }: RetentionRateChartProps = $props();

	const data = $derived(stats ? computeRetentionRateOverTime(stats.progress) : []);
</script>

<div class="ml-chart-retention-rate {className ?? ''}">
	<div class="ml-chart-retention-rate__header">
		<div class="ml-chart-retention-rate__title">Retention Rate</div>
		<div class="ml-chart-retention-rate__subtitle">Percentage of correct answers over time</div>
	</div>
	<ChartEmptyState show={data.length === 0} message="No review history yet.">
		<Chart
			{data}
			x="date"
			y="retention"
			padding={{ top: 16, right: 16, bottom: 40, left: 48 }}
			height={260}
			tooltipContext={{ mode: 'quadtree-x' }}
		>
			<Layer>
				<Axis
					placement="left"
					label="Retention"
					labelProps={{ 'font-size': '12px' }}
					format={(v: number) => `${Math.round(v * 100)}%`}
					rule
				/>
				<Axis placement="bottom" label="Date" labelProps={{ 'font-size': '12px' }} rule />

				<Highlight lines points opacity={0.7} />
				<Spline stroke="var(--interactive-accent)" strokeWidth={2} />

				<AnnotationLine
					y={requestRetention}
					label={`target value: ${requestRetention * 100}% `}
					labelPlacement="top-left"
					labelXOffset={20}
					props={{
						label: { fill: 'var(--text-muted)', 'font-size': '12px' },
						line: { stroke: 'var(--text-muted)', dashArray: '4 4', width: 1 },
					}}
				/>
			</Layer>
			<Tooltip.Root>
				{#snippet children({ data: tooltipData })}
					<Tooltip.Header value={tooltipData.date.toLocaleDateString()} />
					<Tooltip.List>
						<Tooltip.Item
							label="Retention"
							value={tooltipData.retention}
							format={(v: number) => `${Math.round(v * 100)}%`}
						/>
					</Tooltip.List>
				{/snippet}
			</Tooltip.Root>
		</Chart>
	</ChartEmptyState>
</div>

<style>
	.ml-chart-retention-rate {
		background-color: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 12px;
		padding: 20px;
	}

	.ml-chart-retention-rate__header {
		display: flex;
		flex-direction: column;
		gap: var(--ml-spacing-sm);
		margin-bottom: var(--ml-spacing-sm);
	}

	.ml-chart-retention-rate__title {
		font-size: var(--font-ui-medium);
		font-weight: var(--font-semibold);
		color: var(--text-normal);
	}

	.ml-chart-retention-rate__subtitle {
		font-size: var(--font-ui-small);
		color: var(--text-muted);
	}
</style>
