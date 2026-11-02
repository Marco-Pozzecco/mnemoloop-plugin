<script lang="ts">
	import { Collapsible } from 'bits-ui';
	import type CollapsibleTriggerProps from './types';

	let {
		ref = $bindable(null),
		type = 'button',
		class: className = '',
		children,
		...rest
	}: CollapsibleTriggerProps = $props();
</script>

<Collapsible.Trigger bind:ref {type} {...rest} class="ml-collapsible__trigger {className}">
	{@render children?.()}
</Collapsible.Trigger>

<style lang="scss">
	/* A disclosure trigger is not a form button. Strip Obsidian's global button
	   chrome (height, radius, fill, shadow) before the consumer styles it. */
	:global(button.ml-collapsible__trigger) {
		appearance: none;
		box-sizing: border-box;
		height: auto;
		margin: 0;
		padding: 0;
		border: none;
		border-radius: 0;
		background: none;
		box-shadow: none;
		color: inherit;
		font: inherit;
		text-align: inherit;
		justify-content: flex-start;
		cursor: pointer;
	}
</style>
