<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import Button from '../Button/component.svelte';
	import Icon from '../Icon/component.svelte';
	import type SheetProps from './types';

	let {
		title,
		closeLabel = 'Close',
		onClose,
		meta,
		footer,
		class: className = '',
		children,
	}: SheetProps = $props();

	const titleId = `ml-sheet-title-${Math.random().toString(36).slice(2, 9)}`;

	let panel = $state<HTMLElement>();
	let previouslyFocused: HTMLElement | null = null;

	onMount(() => {
		previouslyFocused =
			activeDocument.activeElement instanceof HTMLElement ? activeDocument.activeElement : null;
		void tick().then(() => panel?.focus());
	});

	onDestroy(() => {
		if (previouslyFocused?.isConnected) previouslyFocused.focus();
		previouslyFocused = null;
	});

	/**
	 * Non-modal: Escape closes, but a popover inside the sheet (Select, Combobox)
	 * consumes its own Escape first.
	 */
	function handleKeydown(event: KeyboardEvent): void {
		if (event.key !== 'Escape' || event.defaultPrevented) return;
		event.preventDefault();
		event.stopPropagation();
		onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	bind:this={panel}
	class="ml-sheet {className}"
	role="dialog"
	aria-modal="false"
	aria-labelledby={titleId}
	tabindex="-1"
>
	<header class="ml-sheet__header">
		<div class="ml-sheet__title-row">
			<h2 class="ml-sheet__title" id={titleId}>{title}</h2>
			<Button variant="icon" size="small" ariaLabel={closeLabel} onclick={onClose}>
				{#snippet icon()}
					<Icon name="x" size={16} />
				{/snippet}
			</Button>
		</div>
		{#if meta}
			<div class="ml-sheet__meta">{@render meta()}</div>
		{/if}
	</header>

	<div class="ml-sheet__body">
		{@render children?.()}
	</div>

	{#if footer}
		<footer class="ml-sheet__footer">{@render footer()}</footer>
	{/if}
</div>

<style lang="scss">
	@use 'tokens' as *;
	@use 'breakpoints' as *;

	// Component geometry: the desktop sidesheet width. At the tablet breakpoint
	// and below the sheet covers the leaf instead.
	$width: 440px;

	.ml-sheet {
		position: absolute;
		inset-block: 0;
		inset-inline-end: 0;
		z-index: $z-sheet;
		display: flex;
		flex-direction: column;
		width: $width;
		max-width: 100%;
		background-color: $background-primary;
		border-inline-start: 1px solid $line-strong;
		color: $text-normal;
	}

	.ml-sheet:focus {
		outline: none;
	}

	.ml-sheet__header {
		display: flex;
		flex-direction: column;
		gap: $spacing-xxs;
		padding: $spacing-md $spacing-lg;
		border-bottom: 1px solid $line-subtle;
	}

	.ml-sheet__title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $spacing-sm;
	}

	.ml-sheet__title {
		margin: 0;
		font-size: $heading-lg;
		font-weight: $font-semibold;
		line-height: 1.25;
		color: $text-normal;
	}

	.ml-sheet__meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: $spacing-xs;
	}

	.ml-sheet__body {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: $spacing-lg;
	}

	.ml-sheet__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $spacing-xs;
		padding: $spacing-sm $spacing-lg;
		border-top: 1px solid $line-subtle;
	}

	/* Below the tablet breakpoint the sheet covers the leaf, bottom nav included. */
	@media (max-width: $tablet-breakpoint) {
		.ml-sheet {
			position: fixed;
			inset: 0;
			width: auto;
			border-inline-start: none;
		}

		.ml-sheet__header {
			gap: $spacing-xxs;
			/* The meta row sits on the divider without this bottom inset. */
			padding: 0 $spacing-md $spacing-sm;
		}

		.ml-sheet__title-row {
			min-height: $control-md;
		}

		.ml-sheet__body {
			gap: $spacing-md;
			padding: $spacing-md;
		}

		.ml-sheet__footer {
			padding: $spacing-md;
		}
	}
</style>
