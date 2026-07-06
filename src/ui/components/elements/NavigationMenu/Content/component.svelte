<script lang="ts">
	import { NavigationMenu } from 'bits-ui';
	import type NavigationMenuContentProps from './types';

	let { forceMount = false, className = '', children }: NavigationMenuContentProps = $props();
</script>

<NavigationMenu.Content {forceMount} class="ml-navmenu__content {className}">
	{#if children}
		{@render children()}
	{/if}
</NavigationMenu.Content>

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-navmenu__content) {
		padding: $spacing-md;
		background-color: $background-primary;
		border-radius: $radius-md;
		box-shadow: $shadow-md;
	}
</style>
