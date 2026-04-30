<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import type TooltipProps from './types';

	let {
		content,
		side = 'top',
		align = 'center',
		delay = 0,
		disabled = false,
		className = '',
		children,
	}: TooltipProps = $props();
</script>

<Tooltip.Root delayDuration={delay} {disabled}>
	<Tooltip.Trigger>
		{#snippet child({ props: triggerProps })}
			<span {...triggerProps}>
				{#if children}
					{@render children()}
				{/if}
			</span>
		{/snippet}
	</Tooltip.Trigger>
	<Tooltip.Portal>
		<Tooltip.Content {side} {align} class="ka-tooltip-content {className}">
			{content}
		</Tooltip.Content>
	</Tooltip.Portal>
</Tooltip.Root>

<style>
	:global(.ka-tooltip-content) {
		background-color: var(--background-primary);
		color: var(--text-normal);
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-s);
		border: 1px solid var(--background-modifier-border);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		font-size: var(--font-ui-small);
		max-width: 250px;
		z-index: 1000;
	}
</style>
