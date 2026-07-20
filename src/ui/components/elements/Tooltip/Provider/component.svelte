<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import type TooltipProviderProps from './types';

	let {
		delayDuration,
		skipDelayDuration,
		disabled,
		disableCloseOnTriggerClick,
		disableHoverableContent,
		ignoreNonKeyboardFocus,
		children,
	}: TooltipProviderProps = $props();
</script>

<Tooltip.Provider
	{delayDuration}
	{skipDelayDuration}
	{disabled}
	{disableCloseOnTriggerClick}
	{disableHoverableContent}
	{ignoreNonKeyboardFocus}
>
	{@render children?.()}
</Tooltip.Provider>
