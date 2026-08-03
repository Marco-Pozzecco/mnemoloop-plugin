<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import type TooltipRootProps from './types';

	let {
		open = $bindable(false),
		onOpenChange,
		onOpenChangeComplete,
		disabled,
		delayDuration,
		disableHoverableContent,
		disableCloseOnTriggerClick,
		ignoreNonKeyboardFocus,
		children,
	}: TooltipRootProps = $props();
</script>

<Tooltip.Root
	bind:open
	{onOpenChange}
	{onOpenChangeComplete}
	{disabled}
	{delayDuration}
	{disableHoverableContent}
	{disableCloseOnTriggerClick}
	{ignoreNonKeyboardFocus}
>
	{@render children?.()}
</Tooltip.Root>
