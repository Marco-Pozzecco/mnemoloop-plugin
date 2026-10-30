<script lang="ts">
	import { Collapsible } from 'bits-ui';
	import { onMount } from 'svelte';
	import type CollapsibleContentProps from './types';

	let {
		ref = $bindable(null),
		forceMount = false,
		hiddenUntilFound = false,
		class: className = '',
		children,
		...rest
	}: CollapsibleContentProps = $props();

	let innerRef: HTMLDivElement;

	// bits-ui measures the content when it opens. Content that grows afterwards
	// (a sidebar group whose card previews arrive asynchronously) would be clipped
	// by the stale height variable, so re-measure while the content is open.
	onMount(() => {
		if (typeof ResizeObserver === 'undefined' || !innerRef) return;
		const observer = new ResizeObserver(() => {
			if (!ref || ref.getAttribute('data-state') === 'closed') return;
			ref.style.setProperty('--bits-collapsible-content-height', `${innerRef.offsetHeight}px`);
		});
		observer.observe(innerRef);
		return () => observer.disconnect();
	});
</script>

<Collapsible.Content
	bind:ref
	{forceMount}
	{hiddenUntilFound}
	{...rest}
	class="ml-collapsible__content {className}"
>
	<div class="ml-collapsible__content-inner" bind:this={innerRef}>
		{@render children?.()}
	</div>
</Collapsible.Content>

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-collapsible__content) {
		overflow: hidden;
		height: var(--bits-collapsible-content-height);
		opacity: 1;
		transition:
			height $transition-normal,
			opacity $transition-fast;
	}

	:global(.ml-collapsible__content[data-state='closed']) {
		height: 0;
		opacity: 0;
		transition:
			height $transition-fast,
			opacity $transition-fast;
	}

	:global(.ml-collapsible__content[data-starting-style]) {
		height: 0;
		opacity: 0;
	}

	:global(.ml-collapsible__content-inner) {
		padding: $spacing-sm 0;
		border-top: 1px solid $background-modifier-border;
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.ml-collapsible__content[data-state='open']),
		:global(.ml-collapsible__content[data-state='closed']) {
			transition: none;
		}
	}
</style>
