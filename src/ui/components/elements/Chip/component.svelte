<script lang="ts">
	import { Button, Icon } from '..';
	import { cn } from '../../utils';
	import type ComboboxChipProps from './types';

	let {
		class: className = '',
		children,
		onDelete,
		removeLabel = 'Remove item',
		icon,
	}: ComboboxChipProps = $props();
</script>

<span class={cn('ml-chip', className)}>
	{@render children?.()}
	{#if onDelete}
		<Button
			class="ml-chip__remove-button"
			variant="icon"
			size="small"
			ariaLabel={removeLabel}
			onclick={onDelete}
		>
			{#if icon}
				<Icon class="ml-chip__remove-button-icon" name={icon} size={14} />
			{:else}
				<Icon class="ml-chip__remove-button-icon" name="x" size={14} />
			{/if}
		</Button>
	{/if}
</span>

<style lang="scss">
	@use 'tokens' as *;

	.ml-chip {
		display: inline-flex;
		align-items: center;
		gap: $spacing-xxs;
		padding: $spacing-xxs $spacing-xs;
		border-radius: $radius-sm;
		background-color: $background-modifier-hover;
		font-size: $font-xs;
		color: $text-normal;
		max-width: 100%;

		:global &__remove-button {
			padding: 0 $spacing-xxs !important;

			&-icon {
				font-size: $font-sm;
			}
		}
	}

	:global(.ml-combobox__chip-label) {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}
</style>
