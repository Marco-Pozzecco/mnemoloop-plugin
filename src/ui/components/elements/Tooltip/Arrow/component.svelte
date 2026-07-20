<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import type TooltipArrowProps from './types';
	let { width = 8, height = 8, class: className = '', children }: TooltipArrowProps = $props();
</script>

<Tooltip.Arrow {width} {height} class="ml-tooltip__arrow {className}">
	{@render children?.()}
</Tooltip.Arrow>

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-tooltip__arrow) {
		fill: $background-primary-alt;
		stroke: $background-modifier-border;
		stroke-width: 1;
	}
</style>
