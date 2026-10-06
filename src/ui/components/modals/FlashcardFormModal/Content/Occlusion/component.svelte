<script lang="ts">
	import { getLinkpath } from 'obsidian';
	import { tick } from 'svelte';
	import type { FlashcardOcclusionContent } from '@/schemas';
	import { Button, FormField, Icon, Input } from '@/ui/components/elements';
	import { getAppContext } from '@/ui/context/AppContext';
	import type ContentTypeProps from '../types';
	import type { BuildContentFn, ValidateFn } from '../types';
	import {
		buildOcclusionContent,
		MIN_MASK_SIZE,
		rectFromPoints,
		RESIZE_HANDLES,
		resizeRect,
		translateRect,
		validateOcclusion,
		type EditableOcclusionMask,
		type NormalizedRect,
		type ResizeHandle,
	} from './validation';

	/** Where "Add mask" puts the mask it creates: centred, a fifth of the image wide. */
	const DEFAULT_MASK_RECT: NormalizedRect = [0.4, 0.4, 0.2, 0.2];
	const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif']);

	type DragState =
		| { kind: 'draw'; start: { x: number; y: number } }
		| { kind: 'move'; id: string; start: { x: number; y: number }; origin: NormalizedRect }
		| { kind: 'resize'; id: string; handle: ResizeHandle; origin: NormalizedRect };

	let { mode, initialContent, onRegister, disabled = false }: ContentTypeProps = $props();

	const { app } = getAppContext();

	let surfaceRef: HTMLDivElement;
	let image = $state('');
	let imageUrl = $state<string | null>(null);
	let dimensions = $state<{ width?: number; height?: number }>({});
	let masks = $state<EditableOcclusionMask[]>([]);
	let draftRect = $state<NormalizedRect | null>(null);
	let activeMaskId = $state<string | null>(null);
	let highlightedMaskId = $state<string | null>(null);
	let showValidation = $state(false);
	let isPickerOpen = $state(false);
	let query = $state('');
	let nextMaskId = 0;
	let dragState: DragState | null = null;
	const rowRefs: Record<string, HTMLElement> = {};

	const imageFiles = $derived(
		app.vault.getFiles().filter((file) => IMAGE_EXTENSIONS.has(file.extension.toLowerCase())),
	);
	const filteredImageFiles = $derived(
		imageFiles.filter((file) => file.path.toLowerCase().includes(query.trim().toLowerCase())),
	);

	// --- Init from parent data (edit mode only) ---
	$effect(() => {
		if (mode === 'edit' && initialContent) {
			const content = initialContent as FlashcardOcclusionContent;
			image = content.image;
			dimensions = { width: content.width, height: content.height };
			masks = content.masks.map((mask) => ({
				id: mask.id,
				rect: mask.rect,
				answer: mask.answer,
				hint: mask.hint ?? '',
				opaque: mask.opaque,
			}));
			imageUrl = resolveImageUrl(content.image);
		}
	});

	// --- Register validate + buildContent with parent ---
	$effect(() => {
		const validate: ValidateFn = () => {
			const message = validateOcclusion(image, masks);
			showValidation = message !== null;
			return message;
		};
		const buildContent: BuildContentFn = () => buildOcclusionContent(image, dimensions, masks);
		onRegister({ validate, buildContent });
	});

	function resolveImageUrl(path: string): string | null {
		const file = app.vault.getFileByPath(path) ?? app.metadataCache.getFirstLinkpathDest(path, '');
		return file ? app.vault.getResourcePath(file) : null;
	}

	function applyImage(path: string): void {
		const resolvedUrl = resolveImageUrl(path);
		if (!resolvedUrl) return;

		const file = app.vault.getFileByPath(path) ?? app.metadataCache.getFirstLinkpathDest(path, '');
		if (!file) return;

		if (file.path !== image) dimensions = {};
		image = file.path;
		imageUrl = resolvedUrl;
		isPickerOpen = false;
	}

	function handleImageLoad(event: Event): void {
		const element = event.currentTarget as HTMLImageElement;
		if (element.naturalWidth > 0 && element.naturalHeight > 0) {
			dimensions = { width: element.naturalWidth, height: element.naturalHeight };
		}
	}

	function applyReferenceText(rawText: string): void {
		const text = rawText.trim();
		if (!text) return;

		const wiki = text.match(/!?\[\[([^\]]+)\]\]/);
		applyImage(wiki ? getLinkpath(wiki[1]) : text);
	}

	/**
	 * Pasting a wikilink is the only way to name an image the picker's filter cannot
	 * find. Dragging one in is not offered: Obsidian closes the modal on a backdrop
	 * pointer-down, so the drag never reaches this surface.
	 */
	function handlePaste(event: ClipboardEvent): void {
		if (disabled) return;
		applyReferenceText(event.clipboardData?.getData('text/plain') ?? '');
	}

	function pointFromEvent(event: PointerEvent): { x: number; y: number } | null {
		const rect = surfaceRef?.getBoundingClientRect();
		if (!rect || rect.width <= 0 || rect.height <= 0) return null;
		return {
			x: (event.clientX - rect.left) / rect.width,
			y: (event.clientY - rect.top) / rect.height,
		};
	}

	function handlePointerDown(event: PointerEvent): void {
		if (disabled) return;
		const point = pointFromEvent(event);
		if (!point) return;

		const target = event.target as HTMLElement | null;
		const resizeHandle = target?.closest<HTMLElement>('[data-resize-handle]')?.dataset.resizeHandle;
		const maskId = target?.closest<HTMLElement>('[data-mask-id]')?.dataset.maskId;
		const existing = maskId ? masks.find((mask) => mask.id === maskId) : undefined;

		// Ctrl-drag moves the mask wherever it starts, including on a handle, so
		// a small mask whose handles blanket its body cannot be resized by accident.
		if (existing && resizeHandle && !event.ctrlKey) {
			focusMask(existing.id);
			dragState = {
				kind: 'resize',
				id: existing.id,
				handle: resizeHandle as ResizeHandle,
				origin: existing.rect,
			};
		} else if (existing) {
			focusMask(existing.id);
			dragState = { kind: 'move', id: existing.id, start: point, origin: existing.rect };
		} else {
			activeMaskId = null;
			dragState = { kind: 'draw', start: point };
			draftRect = rectFromPoints(point, point);
		}

		surfaceRef?.setPointerCapture?.(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent): void {
		if (!dragState) return;
		const point = pointFromEvent(event);
		if (!point) return;

		if (dragState.kind === 'draw') {
			draftRect = rectFromPoints(dragState.start, point);
			return;
		}

		const id = dragState.id;
		if (dragState.kind === 'resize') {
			const resized = resizeRect(dragState.origin, dragState.handle, point);
			masks = masks.map((mask) => (mask.id === id ? { ...mask, rect: resized } : mask));
			return;
		}

		const moved = translateRect(dragState.origin, point.x - dragState.start.x, point.y - dragState.start.y);
		masks = masks.map((mask) => (mask.id === id ? { ...mask, rect: moved } : mask));
	}

	function handlePointerUp(): void {
		if (dragState?.kind === 'draw' && draftRect) {
			const [, , width, height] = draftRect;
			if (width >= MIN_MASK_SIZE && height >= MIN_MASK_SIZE) {
				const id = `new-${nextMaskId++}`;
				masks = [...masks, { id, rect: draftRect, answer: '', hint: '', opaque: true }];
				focusNewMask(id);
			}
		} else if (dragState && dragState.kind !== 'draw') {
			// The gesture is over: reveal the row of the region that was worked on.
			scrollRowIntoView(dragState.id);
		}

		draftRect = null;
		dragState = null;
	}

	function removeMask(id: string): void {
		masks = masks.filter((mask) => mask.id !== id);
		if (activeMaskId === id) activeMaskId = null;
		if (highlightedMaskId === id) highlightedMaskId = null;
	}

	/** Drawing works by dragging, which is not discoverable on its own. */
	function addMask(): void {
		masks = [
			...masks,
			{
				id: `new-${nextMaskId++}`,
				rect: [...DEFAULT_MASK_RECT],
				answer: '',
				hint: '',
				opaque: true,
			},
		];
	}

	function updateMask(id: string, changes: Partial<EditableOcclusionMask>): void {
		masks = masks.map((mask) => (mask.id === id ? { ...mask, ...changes } : mask));
	}

	/** Track each region row so canvas selection can reveal its editor. */
	function rowRef(id: string) {
		return (node: HTMLElement) => {
			rowRefs[id] = node;
			return {
				destroy() {
					delete rowRefs[id];
				},
			};
		};
	}

	function scrollRowIntoView(id: string): void {
		const element = rowRefs[id];
		if (!element || typeof element.scrollIntoView !== 'function') return;
		element.scrollIntoView({ block: 'nearest' });
	}

	/** Selecting a region on the canvas focuses its row. */
	function focusMask(id: string): void {
		activeMaskId = id;
	}

	/** A region drawn just now: its row does not exist until the DOM updates. */
	function focusNewMask(id: string): void {
		activeMaskId = id;
		void tick().then(() => scrollRowIntoView(id));
	}

	function rectStyle(rect: NormalizedRect): string {
		const [x, y, width, height] = rect;
		return `left: ${x * 100}%; top: ${y * 100}%; width: ${width * 100}%; height: ${height * 100}%`;
	}

	/**
	 * Delete and Backspace remove the active mask, mirroring its row's trash button.
	 * A keystroke inside a text field belongs to that field, so there it edits the
	 * answer or hint instead.
	 */
	function handleWindowKeyDown(event: KeyboardEvent): void {
		const id = activeMaskId;
		if (disabled || !id) return;
		if (event.key !== 'Delete' && event.key !== 'Backspace') return;
		if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
		if (event.defaultPrevented) return;
		if (
			event.target instanceof Element &&
			event.target.closest('input, textarea, select, [contenteditable="true"]')
		) {
			return;
		}

		event.preventDefault();
		removeMask(id);
	}
</script>

<svelte:window onkeydown={handleWindowKeyDown} />

<FormField label="Image">
	{#if imageUrl}
		<div class="ml-occlusion-form__image-header">
			<span class="ml-occlusion-form__image-name">{image}</span>
			<Button
				variant="secondary"
				size="small"
				{disabled}
				onclick={() => (isPickerOpen = !isPickerOpen)}
			>
				Change image
			</Button>
		</div>
	{:else}
		<Button variant="secondary" {disabled} onclick={() => (isPickerOpen = !isPickerOpen)}>
			Choose image
		</Button>
	{/if}

	{#if isPickerOpen}
		<div class="ml-occlusion-form__picker">
			<Input
				label="Filter images"
				value={query}
				placeholder="Image name"
				{disabled}
				onchange={(value) => (query = value)}
			/>
			{#if filteredImageFiles.length === 0}
				<p class="ml-occlusion-form__picker-empty">No images found.</p>
			{:else}
				<ul class="ml-occlusion-form__picker-list">
					{#each filteredImageFiles as file (file.path)}
						<li>
							<button
								type="button"
								class="ml-occlusion-form__picker-item"
								{disabled}
								onclick={() => applyImage(file.path)}
							>
								{file.path}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</FormField>

<div class="ml-occlusion-form__tools">
	<Button variant="secondary" size="small" {disabled} onclick={addMask}>Add mask</Button>
</div>

<div
	bind:this={surfaceRef}
	class="ml-occlusion-form__surface ml-no-select"
	class:ml-occlusion-form__surface--empty={!imageUrl}
	tabindex="0"
	aria-label="Mask drawing surface"
	onpaste={handlePaste}
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointerleave={handlePointerUp}
>
	{#if imageUrl}
		<img
			class="ml-occlusion-form__image"
			src={imageUrl}
			alt={image}
			draggable="false"
			onload={handleImageLoad}
		/>
		<span class="ml-occlusion-form__tools-hint">
			Drag on the image to draw a mask; Ctrl-drag a mask to move it without resizing.
		</span>
		{#each masks as mask, index (mask.id)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="ml-occlusion-form__mask"
				class:ml-occlusion-form__mask--active={mask.id === activeMaskId}
				class:ml-occlusion-form__mask--highlighted={mask.id === highlightedMaskId}
				class:ml-occlusion-form__mask--transparent={!mask.opaque}
				data-mask-id={mask.id}
				style={rectStyle(mask.rect)}
				onpointerenter={() => (highlightedMaskId = mask.id)}
				onpointerleave={() => (highlightedMaskId = null)}
			>
				<span class="ml-occlusion-form__mask-num">{index + 1}</span>
				{#each RESIZE_HANDLES as handle (handle)}
					<span
						class="ml-occlusion-form__handle ml-occlusion-form__handle--{handle}"
						data-resize-handle={handle}
						aria-hidden="true"
					></span>
				{/each}
			</div>
		{/each}
		{#if draftRect}
			<div class="ml-occlusion-form__draft" style={rectStyle(draftRect)}></div>
		{/if}
	{:else}
		<p class="ml-occlusion-form__placeholder">
			Choose an image from the vault, or paste a wikilink to one into this area.
		</p>
	{/if}
</div>

{#if masks.length > 0}
	<FormField label={`Masks (${masks.length})`}>
		{#each masks as mask, index (mask.id)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="ml-occlusion-form__region"
				class:ml-occlusion-form__region--active={mask.id === activeMaskId}
				class:ml-occlusion-form__region--highlighted={mask.id === highlightedMaskId}
				class:ml-occlusion-form__region--invalid={showValidation && !mask.answer.trim()}
				use:rowRef={mask.id}
				onpointerenter={() => (highlightedMaskId = mask.id)}
				onpointerleave={() => (highlightedMaskId = null)}
			>
				<span class="ml-occlusion-form__region-num">{index + 1}</span>
				<div class="ml-occlusion-form__region-fields">
					<Input
						label={`Answer ${index + 1}`}
						value={mask.answer}
						placeholder="Answer"
						required
						hasError={showValidation && !mask.answer.trim()}
						errorMessage="Answer required"
						{disabled}
						onchange={(value) => updateMask(mask.id, { answer: value })}
						onfocus={() => (activeMaskId = mask.id)}
					/>
					<Input
						label={`Hint ${index + 1}`}
						value={mask.hint}
						placeholder="Hint (optional)"
						{disabled}
						onchange={(value) => updateMask(mask.id, { hint: value })}
						onfocus={() => (activeMaskId = mask.id)}
					/>
				</div>
				<div class="ml-occlusion-form__region-actions">
					<Button
						variant="secondary"
						size="small"
						class={`ml-occlusion-form__mask-opacity${
							mask.opaque ? ' ml-occlusion-form__mask-opacity--opaque' : ''
						}`}
						{disabled}
						onclick={() => updateMask(mask.id, { opaque: !mask.opaque })}
						ariaLabel={`Mask ${index + 1}: ${mask.opaque ? 'opaque' : 'transparent'}`}
					>
						<Icon name={mask.opaque ? 'square' : 'square-dashed'} size={14} />
					</Button>
					<Button
						variant="secondary"
						size="small"
						class="ml-occlusion-form__mask-delete"
						{disabled}
						onclick={() => removeMask(mask.id)}
						ariaLabel={`Delete mask ${index + 1}`}
					>
						<Icon name="trash-2" size={14} />
					</Button>
				</div>
			</div>
		{/each}
	</FormField>
{/if}

<style lang="scss">
	@use 'tokens' as *;
	@use 'breakpoints' as *;

	.ml-occlusion-form__image-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $spacing-sm;
	}

	.ml-occlusion-form__image-name {
		font-style: italic;
		color: $text-muted;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.ml-occlusion-form__picker {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
		margin-top: $spacing-xs;
		max-height: 240px;
		overflow-y: auto;
	}

	.ml-occlusion-form__picker-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: $spacing-xxs;
	}

	.ml-occlusion-form__picker-item {
		width: 100%;
		text-align: left;
		cursor: pointer;
	}

	.ml-occlusion-form__picker-empty {
		color: $text-muted;
		margin: 0;
	}

	.ml-occlusion-form__tools {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $spacing-sm;
	}

	.ml-occlusion-form__tools-hint {
		color: $text-muted;
		font-size: $font-sm;
	}

	.ml-occlusion-form__surface {
		position: relative;
		width: 100%;
		touch-action: none;

		&:focus-visible {
			outline: 2px solid $interactive-accent;
			outline-offset: 2px;
		}

		&--empty {
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 160px;
			border: 1px dashed $background-modifier-border;
			border-radius: $radius-sm;
		}
	}

	.ml-occlusion-form__placeholder {
		color: $text-muted;
		text-align: center;
		margin: 0;
		padding: $spacing-sm;
	}

	.ml-occlusion-form__image {
		display: block;
		width: 100%;
		user-select: none;
	}

	.ml-occlusion-form__mask,
	.ml-occlusion-form__draft {
		position: absolute;
		border: 2px solid $interactive-accent;
		border-radius: $radius-sm;
		background: rgba($interactive-accent, 0.2);
	}

	.ml-occlusion-form__mask {
		cursor: move;
		z-index: 1;

		&--active {
			border-color: $interactive-accent-hover;
			box-shadow: $shadow-sm;
			z-index: 3;
		}

		&--highlighted {
			border-color: $interactive-accent-hover;
			z-index: 2;
		}

		// A dashed border reads as "see-through", matching the square-dashed toggle
		// and the dashed draft rectangle. The fill stays translucent so the author
		// can position the mask over the content it will cover.
		&--transparent {
			border-style: dashed;
		}
	}

	.ml-occlusion-form__mask-num {
		position: absolute;
		top: 2px;
		left: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border: 1px solid $interactive-accent;
		border-radius: 50%;
		background: color-mix(in srgb, $background-primary 90%, transparent);
		color: $text-normal;
		font-size: 10px;
		font-weight: $font-bold;
		pointer-events: none;
	}

	.ml-occlusion-form__handle {
		position: absolute;
		width: 10px;
		height: 10px;
		background: $background-primary;
		border: 2px solid $interactive-accent;
		border-radius: $radius-full;
		opacity: 0;
		pointer-events: none;

		// A larger invisible target keeps the handle usable on touch.
		&::after {
			content: '';
			position: absolute;
			inset: -6px;
		}

		.ml-occlusion-form__mask:hover &,
		.ml-occlusion-form__mask--active & {
			opacity: 1;
			pointer-events: auto;
		}

		&--nw {
			top: -6px;
			left: -6px;
			cursor: nwse-resize;
		}

		&--n {
			top: -6px;
			left: 50%;
			transform: translateX(-50%);
			cursor: ns-resize;
		}

		&--ne {
			top: -6px;
			right: -6px;
			cursor: nesw-resize;
		}

		&--e {
			top: 50%;
			right: -6px;
			transform: translateY(-50%);
			cursor: ew-resize;
		}

		&--se {
			bottom: -6px;
			right: -6px;
			cursor: nwse-resize;
		}

		&--s {
			bottom: -6px;
			left: 50%;
			transform: translateX(-50%);
			cursor: ns-resize;
		}

		&--sw {
			bottom: -6px;
			left: -6px;
			cursor: nesw-resize;
		}

		&--w {
			top: 50%;
			left: -6px;
			transform: translateY(-50%);
			cursor: ew-resize;
		}
	}

	.ml-occlusion-form__draft {
		border-style: dashed;
		pointer-events: none;
	}

	.ml-occlusion-form__region {
		display: grid;
		grid-template-columns: 24px minmax(0, 1fr) auto;
		gap: $spacing-sm;
		align-items: start;
		padding: $spacing-xs;
		border: $border-width solid $background-modifier-border;
		border-radius: $radius-sm;
		background: $background-primary;
	}

	.ml-occlusion-form__region--active {
		border-color: $interactive-accent;
		background: color-mix(in srgb, $interactive-accent 10%, transparent);
	}

	.ml-occlusion-form__region--highlighted {
		border-color: color-mix(in srgb, $interactive-accent 55%, $background-modifier-border);
	}

	.ml-occlusion-form__region--invalid {
		border-color: $text-error;
	}

	.ml-occlusion-form__region-num {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		margin-top: 2px;
		border: $border-width solid $background-modifier-border;
		border-radius: 50%;
		background: $background-secondary;
		color: $text-muted;
		font-size: $font-xs;
		font-weight: $font-bold;
	}

	.ml-occlusion-form__region--active .ml-occlusion-form__region-num {
		border-color: $interactive-accent;
		background: $interactive-accent;
		color: $text-accent-foreground;
	}

	.ml-occlusion-form__region-fields {
		display: grid;
		grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
		gap: $spacing-sm;
		min-width: 0;
	}

	/* The number badge labels each row; keep the field names for assistive tech. */
	.ml-occlusion-form__region-fields :global(.ml-input-label) {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
		border: 0;
	}

	.ml-occlusion-form__region-actions {
		display: flex;
		align-items: center;
		gap: $spacing-xxs;
		margin-top: 2px;
	}

	/* Lucide's square is stroked; filling it marks an opaque mask at a glance.
	   The flag lives on the Button component root, which carries no scope class,
	   so the selector is global and namespaced by the ml- class alone. */
	:global(.ml-occlusion-form__mask-opacity--opaque svg) {
		fill: currentColor;
	}

	@media (max-width: $mobile-breakpoint) {
		.ml-occlusion-form__region-fields {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
