<script lang="ts">
	import type ChartEmptyStateProps from './types';
	let { show, message, className, children }: ChartEmptyStateProps = $props();
</script>

{#if show}
	<div class="ml-chart-empty {className ?? ''}">
		<div class="ml-chart-empty__blur">
			{@render children()}
		</div>
		<div class="ml-chart-empty__overlay">
			<p class="ml-chart-empty__message">{message}</p>
		</div>
	</div>
{:else}
	{@render children()}
{/if}

<style lang="scss">
	@use 'tokens' as *;

	.ml-chart-empty {
		position: relative;
		display: inline-block;
		min-width: 100%;
	}

	.ml-chart-empty__blur {
		filter: blur(4px);
		opacity: 0.3;
		pointer-events: none;
	}

	.ml-chart-empty__overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1;
		pointer-events: none;
	}

	.ml-chart-empty__message {
		color: $text-muted;
		font-size: $font-sm;
		text-align: center;
	}
</style>
