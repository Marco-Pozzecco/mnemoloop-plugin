<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	let {
		imageUrl,
		alt,
		children,
		onclose,
	}: {
		imageUrl: string;
		alt: string;
		children?: Snippet;
		onclose: () => void;
	} = $props();

	const MIN_SCALE = 1;
	const MAX_SCALE = 4;
	const ZOOM_STEP = 0.25;

	let scale = $state(1);
	let offsetX = $state(0);
	let offsetY = $state(0);
	let drag: { pointerX: number; pointerY: number; originX: number; originY: number } | null = null;
	let closeButton: HTMLButtonElement;

	const canPan = $derived(scale > MIN_SCALE);

	onMount(() => {
		closeButton?.focus();
	});

	function clampScale(value: number): number {
		return Math.min(Math.max(value, MIN_SCALE), MAX_SCALE);
	}

	function zoomBy(delta: number): void {
		scale = clampScale(scale + delta);
		if (scale === MIN_SCALE) resetOffset();
	}

	function resetOffset(): void {
		offsetX = 0;
		offsetY = 0;
		drag = null;
	}

	function handlePointerDown(event: PointerEvent): void {
		if (!canPan) return;
		drag = {
			pointerX: event.clientX,
			pointerY: event.clientY,
			originX: offsetX,
			originY: offsetY,
		};
		(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent): void {
		if (!drag) return;
		offsetX = drag.originX + (event.clientX - drag.pointerX);
		offsetY = drag.originY + (event.clientY - drag.pointerY);
	}

	function handlePointerUp(): void {
		drag = null;
	}

	function handleWindowKeyDown(event: KeyboardEvent): void {
		if (event.key !== 'Escape') return;
		event.preventDefault();
		onclose();
	}
</script>

<svelte:window onkeydown={handleWindowKeyDown} />

<div class="ml-occlusion-viewer" role="dialog" aria-modal="true" aria-label="Expanded image">
	<div class="ml-occlusion-viewer__toolbar">
		<button
			type="button"
			class="ml-occlusion-viewer__tool"
			aria-label="Zoom out"
			onclick={() => zoomBy(-ZOOM_STEP)}
		>
			−
		</button>
		<span class="ml-occlusion-viewer__zoom">{Math.round(scale * 100)}%</span>
		<button
			type="button"
			class="ml-occlusion-viewer__tool"
			aria-label="Zoom in"
			onclick={() => zoomBy(ZOOM_STEP)}
		>
			＋
		</button>
		<button
			type="button"
			class="ml-occlusion-viewer__tool ml-occlusion-viewer__tool--wide"
			onclick={resetOffset}
		>
			Fit
		</button>
		<button
			bind:this={closeButton}
			type="button"
			class="ml-occlusion-viewer__tool"
			aria-label="Close expanded image"
			onclick={onclose}
		>
			✕
		</button>
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="ml-occlusion-viewer__frame"
		class:ml-occlusion-viewer__frame--pannable={canPan}
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointerleave={handlePointerUp}
	>
		<div
			class="ml-occlusion-viewer__layer"
			style="transform: translate({offsetX}px, {offsetY}px) scale({scale})"
		>
			<img class="ml-occlusion-viewer__image" src={imageUrl} alt={alt} draggable="false" />
			{@render children?.()}
		</div>
	</div>
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-occlusion-viewer {
		position: fixed;
		inset: 0;
		z-index: $z-modal;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: $spacing-sm;
		padding: $spacing-lg;
		background: rgba(0, 0, 0, 0.84);
	}

	.ml-occlusion-viewer__toolbar {
		display: flex;
		align-items: center;
		gap: $spacing-xxs;
		padding: $spacing-xxs;
		border: $border-width solid rgba(255, 255, 255, 0.14);
		border-radius: $radius-md;
		background: rgba(24, 24, 26, 0.86);
	}

	.ml-occlusion-viewer__tool {
		min-width: 2rem;
		height: 2rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: $radius-sm;
		background: transparent;
		color: #ececec;
		font: inherit;
		cursor: pointer;

		&:hover {
			background: rgba(255, 255, 255, 0.12);
		}
	}

	.ml-occlusion-viewer__tool--wide {
		padding: 0 $spacing-sm;
	}

	.ml-occlusion-viewer__zoom {
		min-width: 3.2rem;
		text-align: center;
		color: #cfcfcf;
		font-size: $font-xs;
	}

	.ml-occlusion-viewer__frame {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		overflow: hidden;
		touch-action: none;
	}

	.ml-occlusion-viewer__frame--pannable {
		cursor: grab;

		&:active {
			cursor: grabbing;
		}
	}

	.ml-occlusion-viewer__layer {
		position: relative;
		transform-origin: center;
		will-change: transform;
	}

	.ml-occlusion-viewer__image {
		display: block;
		width: auto;
		height: auto;
		max-width: min(92vw, 1200px);
		max-height: calc(100vh - 9rem);
		user-select: none;
	}
</style>
