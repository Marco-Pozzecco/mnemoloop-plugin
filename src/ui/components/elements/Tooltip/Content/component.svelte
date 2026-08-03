<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import type TooltipContentProps from './types';

	let {
		side = 'top',
		align = 'center',
		sideOffset = 8,
		class: className = '',
		forceMount = false,
		children,
		...rest
	}: TooltipContentProps = $props();

	let ContentProps = $derived({
		...rest,
		side,
		align,
		sideOffset,
	});
</script>

{#if forceMount}
	<Tooltip.Content {...ContentProps}>
		{#snippet child({ wrapperProps, props, open })}
			{#if open}
				<div {...wrapperProps}>
					<div {...props} class="ml-tooltip__content {className}">
						{@render children?.()}
					</div>
				</div>
			{/if}
		{/snippet}
	</Tooltip.Content>
{:else}
	<Tooltip.Content {...ContentProps} class="ml-tooltip__content {className}">
		{@render children?.()}
	</Tooltip.Content>
{/if}

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-tooltip__content) {
		z-index: $z-dropdown;
		padding: $spacing-xs $spacing-sm;
		background-color: $background-primary-alt;
		color: $text-normal;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-sm;
		font-size: $font-sm;
		line-height: $line-height-normal;
		max-width: 20rem;
	}

	:global(.ml-tooltip__content[data-state='delayed-open']),
	:global(.ml-tooltip__content[data-state='instant-open']) {
		transition:
			opacity $transition-fast,
			transform $transition-fast;
	}

	:global(.ml-tooltip__content[data-state='closed']) {
		opacity: 0;
		transform: scale(0.96);
	}

	:global(.ml-tooltip__content[data-side='top']) {
		transform-origin: bottom;
	}

	:global(.ml-tooltip__content[data-side='bottom']) {
		transform-origin: top;
	}

	:global(.ml-tooltip__content[data-side='left']) {
		transform-origin: right;
	}

	:global(.ml-tooltip__content[data-side='right']) {
		transform-origin: left;
	}
</style>
