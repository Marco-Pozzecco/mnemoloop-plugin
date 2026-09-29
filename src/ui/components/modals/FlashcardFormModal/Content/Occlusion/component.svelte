<script lang="ts">
	import { getLinkpath } from 'obsidian';
	import type { FlashcardOcclusionContent } from '@/schemas';
	import { Button, FormField, Input, Textarea } from '@/ui/components/elements';
	import { getAppContext } from '@/ui/context/AppContext';
	import type ContentTypeProps from '../types';
	import type { BuildContentFn, ValidateFn } from '../types';
	import {
		buildOcclusionContent,
		rectFromPoints,
		translateRect,
		validateOcclusion,
		type EditableOcclusionMask,
		type NormalizedRect,
	} from './validation';

	/** A drawn rect smaller than this fraction of the image is ignored. */
	const MIN_MASK_SIZE = 0.01;

	/** Where "Add mask" puts the mask it creates: centred, a fifth of the image wide. */
	const DEFAULT_MASK_RECT: NormalizedRect = [0.4, 0.4, 0.2, 0.2];

	const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif']);

	type DragState =
		| { kind: 'draw'; start: { x: number; y: number } }
		| { kind: 'move'; id: string; start: { x: number; y: number }; origin: NormalizedRect };

	let { mode, initialContent, onRegister, disabled = false }: ContentTypeProps = $props();

	const { app } = getAppContext();

	let surfaceRef: HTMLDivElement;
	let image = $state('');
	let imageUrl = $state<string | null>(null);
	let dimensions = $state<{ width?: number; height?: number }>({});
	let masks = $state<EditableOcclusionMask[]>([]);
	let draftRect = $state<NormalizedRect | null>(null);
	let isPickerOpen = $state(false);
	let query = $state('');
	let nextMaskId = 0;
	let dragState: DragState | null = null;

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
			}));
			imageUrl = resolveImageUrl(content.image);
		}
	});

	// --- Register validate + buildContent with parent ---
	$effect(() => {
		const validate: ValidateFn = () => validateOcclusion(image, masks);
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
		const maskId = target?.closest<HTMLElement>('[data-mask-id]')?.dataset.maskId;
		const existing = maskId ? masks.find((mask) => mask.id === maskId) : undefined;

		if (existing) {
			dragState = { kind: 'move', id: existing.id, start: point, origin: existing.rect };
		} else {
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
		const moved = translateRect(dragState.origin, point.x - dragState.start.x, point.y - dragState.start.y);
		masks = masks.map((mask) => (mask.id === id ? { ...mask, rect: moved } : mask));
	}

	function handlePointerUp(): void {
		if (dragState?.kind === 'draw' && draftRect) {
			const [, , width, height] = draftRect;
			if (width >= MIN_MASK_SIZE && height >= MIN_MASK_SIZE) {
				masks = [
					...masks,
					{ id: `new-${nextMaskId++}`, rect: draftRect, answer: '', hint: '' },
				];
			}
		}

		draftRect = null;
		dragState = null;
	}

	function removeMask(id: string): void {
		masks = masks.filter((mask) => mask.id !== id);
	}

	/** Drawing works by dragging, which is not discoverable on its own. */
	function addMask(): void {
		masks = [
			...masks,
			{ id: `new-${nextMaskId++}`, rect: [...DEFAULT_MASK_RECT], answer: '', hint: '' },
		];
	}

	function updateMask(id: string, changes: Partial<EditableOcclusionMask>): void {
		masks = masks.map((mask) => (mask.id === id ? { ...mask, ...changes } : mask));
	}

	function rectStyle(rect: NormalizedRect): string {
		const [x, y, width, height] = rect;
		return `left: ${x * 100}%; top: ${y * 100}%; width: ${width * 100}%; height: ${height * 100}%`;
	}
</script>

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
	<span class="ml-occlusion-form__tools-hint">Drag on the image to draw a mask.</span>
</div>

<div
	bind:this={surfaceRef}
	class="ml-occlusion-form__surface"
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
		{#each masks as mask (mask.id)}
			<div class="ml-occlusion-form__mask" data-mask-id={mask.id} style={rectStyle(mask.rect)}></div>
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
	<FormField label="Masks">
		{#each masks as mask, index (mask.id)}
			<div class="ml-occlusion-form__mask-editor">
				<Textarea
					label={`Answer ${index + 1}`}
					value={mask.answer}
					required
					rows={2}
					{disabled}
					onchange={(value) => updateMask(mask.id, { answer: value })}
				/>
				<Textarea
					label={`Hint ${index + 1}`}
					value={mask.hint}
					rows={1}
					{disabled}
					onchange={(value) => updateMask(mask.id, { hint: value })}
				/>
				<Button
					variant="secondary"
					size="small"
					class="ml-occlusion-form__mask-delete"
					{disabled}
					onclick={() => removeMask(mask.id)}
					ariaLabel={`Delete mask ${index + 1}`}
				>
					Delete
				</Button>
			</div>
		{/each}
	</FormField>
{/if}

<style lang="scss">
	@use 'tokens' as *;

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

	.ml-occlusion-form__draft {
		border-style: dashed;
		pointer-events: none;
	}

	.ml-occlusion-form__mask-editor {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
		padding-bottom: $spacing-sm;
		border-bottom: 1px solid $background-modifier-border;

		&:last-child {
			border-bottom: none;
		}
	}
</style>
