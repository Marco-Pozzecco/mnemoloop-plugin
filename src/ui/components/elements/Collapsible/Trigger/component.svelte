<script lang="ts">
	import { Collapsible } from 'bits-ui';
	import type CollapsibleTriggerProps from './types';

	let {
		ref = $bindable(null),
		class: className = '',
		children,
		...rest
	}: CollapsibleTriggerProps = $props();
</script>

<Collapsible.Trigger bind:ref {...rest} class="ml-collapsible__trigger {className}">
	{@render children?.()}
</Collapsible.Trigger>
