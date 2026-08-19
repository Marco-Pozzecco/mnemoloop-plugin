<script lang="ts">
	import { Combobox } from 'bits-ui';
	import { getComboboxContext } from '../context';
	import type ComboboxContentProps from './types';

	let {
		side = 'bottom',
		align = 'start',
		sideOffset = 4,
		forceMount = false,
		customAnchor,
		class: className = '',
		children,
		...rest
	}: ComboboxContentProps = $props();

	const context = getComboboxContext();
	const resolvedAnchor = $derived(customAnchor === undefined ? context.trigger : customAnchor);

	let ContentProps = $derived({
		...rest,
		side,
		align,
		sideOffset,
		customAnchor: resolvedAnchor,
	});
</script>

{#if forceMount}
	<Combobox.Content {...ContentProps} forceMount>
		{#snippet child({ wrapperProps, props, open })}
			{#if open}
				<div {...wrapperProps}>
					<div {...props} class="ml-combobox__content {className}">
						{@render children?.()}
					</div>
				</div>
			{/if}
		{/snippet}
	</Combobox.Content>
{:else}
	<Combobox.Content {...ContentProps} class="ml-combobox__content {className}">
		{@render children?.()}
	</Combobox.Content>
{/if}

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-combobox__content) {
		z-index: $z-dropdown;
		background-color: $background-primary;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-input;
		box-shadow: 0 4px 12px color-mix(in srgb, $text-normal 15%, transparent);
		width: var(--bits-floating-anchor-width);
		overflow: hidden;
	}

	:global(.ml-combobox__content[data-state='open']) {
		transition:
			opacity $transition-fast,
			transform $transition-fast;
	}

	:global(.ml-combobox__content[data-state='closed']) {
		opacity: 0;
		transform: scale(0.98);
	}
</style>
