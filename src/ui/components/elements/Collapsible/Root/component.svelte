<script lang="ts">
	import { Collapsible } from 'bits-ui';
	import type CollapsibleRootProps from './types';

	let {
		open = $bindable(false),
		ref = $bindable(null),
		disabled,
		onOpenChange,
		onOpenChangeComplete,
		children,
		...rest
	}: CollapsibleRootProps = $props();
</script>

<Collapsible.Root
	bind:open
	bind:ref
	{disabled}
	{onOpenChange}
	{onOpenChangeComplete}
	{...rest}
>
	{@render children?.()}
</Collapsible.Root>
