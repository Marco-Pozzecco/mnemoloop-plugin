// @vitest-environment jsdom
import '../../../../../../helpers/dom-polyfills';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import type { App } from 'obsidian';
import { CardType, type FlashcardOcclusionContent } from '@/schemas';
import type { BuildContentFn, ValidateFn } from '@/ui/components/modals/FlashcardFormModal/Content/types';
import FormOcclusionHarness from '../../../../../../helpers/FormOcclusionHarness.svelte';
import { createMockPlugin } from '../../../../../../helpers/mock-obsidian';

const VAULT_FILES = [
	{ path: 'attachments/lungs.png', content: '' },
	{ path: 'attachments/brain.png', content: '' },
	{ path: 'cards/note.md', content: 'not an image' },
];

const EXISTING_CARD: FlashcardOcclusionContent = {
	meta_type: CardType.Occlusion,
	image: 'attachments/lungs.png',
	width: 1024,
	height: 768,
	masks: [
		{ id: 'm1', rect: [0.2, 0.3, 0.4, 0.2], answer: 'Left upper lobe', hint: 'upper' },
		{ id: 'm2', rect: [0.5, 0.5, 0.1, 0.1], answer: 'Right lower lobe', hint: null },
	],
};

describe('Occlusion form interaction', () => {
	let target: HTMLDivElement;
	let plugin: ReturnType<typeof createMockPlugin>;
	let api: { validate: ValidateFn; buildContent: BuildContentFn } | null;
	let unmountForm: (() => Promise<void>) | undefined;

	function mountForm(props: { mode?: 'create' | 'edit'; initialContent?: unknown } = {}) {
		plugin = createMockPlugin(VAULT_FILES, {
			linkTargets: {
				'lungs.png': 'attachments/lungs.png',
				'attachments/lungs.png': 'attachments/lungs.png',
				'attachments/brain.png': 'attachments/brain.png',
			},
		});
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		api = null;
		const instance = mount(FormOcclusionHarness, {
			target,
			props: {
				app: plugin.app as unknown as App,
				onRegister: (registered: {
					validate: ValidateFn;
					buildContent: BuildContentFn;
				}) => {
					api = registered;
				},
				...props,
			},
		});
		unmountForm = () => unmount(instance);
	}

	function fieldByLabel(labelText: string): HTMLTextAreaElement {
		const label = Array.from(target.querySelectorAll('label')).find((element) =>
			element.textContent?.trim().startsWith(labelText),
		);
		if (!label) throw new Error(`No field labelled ${labelText}`);
		const id = label.getAttribute('for') ?? '';
		const field = target.querySelector<HTMLTextAreaElement>(`#${id}`);
		if (!field) throw new Error(`No control for ${labelText}`);
		return field;
	}

	function setField(labelText: string, value: string): void {
		const field = fieldByLabel(labelText);
		field.value = value;
		field.dispatchEvent(new Event('change', { bubbles: true }));
	}

	function paste(text: string): void {
		const event = new Event('paste', { bubbles: true, cancelable: true });
		Object.defineProperty(event, 'clipboardData', { value: { getData: () => text } });
		surface().dispatchEvent(event);
	}

	function openPicker(): void {
		const button = Array.from(target.querySelectorAll<HTMLButtonElement>('button')).find(
			(element) => element.textContent?.trim() === 'Choose image',
		);
		if (!button) throw new Error('Choose image control not found');
		button.click();
	}

	function pickerItems(): string[] {
		return Array.from(target.querySelectorAll<HTMLElement>('.ml-occlusion-form__picker-item')).map(
			(element) => element.textContent?.trim() ?? '',
		);
	}

	function chooseImage(path: string): void {
		const item = Array.from(target.querySelectorAll<HTMLButtonElement>('.ml-occlusion-form__picker-item')).find(
			(element) => element.textContent?.trim() === path,
		);
		if (!item) throw new Error(`No picker item for ${path}`);
		item.click();
	}

	function buttonByText(label: string): HTMLButtonElement {
		const button = Array.from(target.querySelectorAll<HTMLButtonElement>('button')).find(
			(element) => element.textContent?.trim() === label,
		);
		if (!button) throw new Error(`No button labelled ${label}`);
		return button;
	}

	function surface(): HTMLElement {
		const element = target.querySelector<HTMLElement>('.ml-occlusion-form__surface');
		if (!element) throw new Error('Surface not found');
		return element;
	}

	function maskElements(): HTMLElement[] {
		return Array.from(target.querySelectorAll<HTMLElement>('.ml-occlusion-form__mask'));
	}

	function deleteButtons(): HTMLButtonElement[] {
		return Array.from(target.querySelectorAll<HTMLButtonElement>('.ml-occlusion-form__mask-delete'));
	}

	function stubRect(element: HTMLElement, width: number, height: number): void {
		Object.defineProperty(element, 'getBoundingClientRect', {
			configurable: true,
			value: () => ({
				x: 0,
				y: 0,
				left: 0,
				top: 0,
				right: width,
				bottom: height,
				width,
				height,
				toJSON: () => ({}),
			}),
		});
	}

	function pointer(element: HTMLElement, type: string, x: number, y: number): void {
		element.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y }));
	}

	async function selectImage(path: string): Promise<void> {
		openPicker();
		await tick();
		chooseImage(path);
		await tick();
	}

	afterEach(async () => {
		await unmountForm?.();
		unmountForm = undefined;
		target?.remove();
		activeDocument.body.innerHTML = '';
	});

	it('enumerates the vault images and filters them by name', async () => {
		mountForm();
		await tick();

		openPicker();
		await tick();

		expect(plugin.app.vault.getFiles).toHaveBeenCalled();
		expect(pickerItems().sort()).toEqual(['attachments/brain.png', 'attachments/lungs.png']);

		setField('Filter images', 'bra');
		await tick();

		expect(pickerItems()).toEqual(['attachments/brain.png']);
	});

	it('displays the chosen image without copying or modifying the file', async () => {
		mountForm();
		await tick();

		await selectImage('attachments/lungs.png');

		const img = target.querySelector<HTMLImageElement>('.ml-occlusion-form__image');
		expect(img?.getAttribute('src')).toBe('app://local/attachments/lungs.png');
		expect(plugin.app.vault.fileMap.get('attachments/lungs.png')).toBe('');
		expect(plugin.app.vault.create).not.toHaveBeenCalled();
		expect(plugin.app.vault.adapter.write).not.toHaveBeenCalled();
	});

	it('measures the loaded image once and stores its natural dimensions', async () => {
		mountForm();
		await tick();
		await selectImage('attachments/lungs.png');

		const img = target.querySelector<HTMLImageElement>('.ml-occlusion-form__image');
		if (!img) throw new Error('Image not rendered');
		Object.defineProperty(img, 'naturalWidth', { configurable: true, value: 1024 });
		Object.defineProperty(img, 'naturalHeight', { configurable: true, value: 768 });
		img.dispatchEvent(new Event('load'));
		await tick();

		expect(api?.buildContent()).toEqual(
			expect.objectContaining({ width: 1024, height: 768 }),
		);
	});

	it('draws a mask on the surface and asks for its answer', async () => {
		mountForm();
		await tick();
		await selectImage('attachments/lungs.png');

		const drawingSurface = surface();
		stubRect(drawingSurface, 100, 100);
		pointer(drawingSurface, 'pointerdown', 20, 20);
		pointer(drawingSurface, 'pointermove', 50, 60);
		pointer(drawingSurface, 'pointerup', 50, 60);
		await tick();

		expect(maskElements()).toHaveLength(1);
		expect(maskElements()[0].getAttribute('style')).toContain('left: 20%');
		expect(fieldByLabel('Answer 1')).toBeTruthy();
		expect(api?.buildContent()).toEqual(
			expect.objectContaining({
				masks: [expect.objectContaining({ rect: [0.2, 0.2, 0.3, 0.4] })],
			}),
		);
	});

	it('moves a drawn mask and stores the new geometry', async () => {
		mountForm();
		await tick();
		await selectImage('attachments/lungs.png');

		const drawingSurface = surface();
		stubRect(drawingSurface, 100, 100);
		pointer(drawingSurface, 'pointerdown', 20, 20);
		pointer(drawingSurface, 'pointermove', 50, 60);
		pointer(drawingSurface, 'pointerup', 50, 60);
		await tick();

		const mask = maskElements()[0];
		pointer(mask, 'pointerdown', 30, 30);
		pointer(drawingSurface, 'pointermove', 40, 50);
		pointer(drawingSurface, 'pointerup', 40, 50);
		await tick();

		expect(api?.buildContent()).toEqual(
			expect.objectContaining({
				masks: [expect.objectContaining({ rect: [0.3, 0.4, 0.3, 0.4] })],
			}),
		);
	});

	it('selects a drawn mask and offers its resize handles', async () => {
		mountForm();
		await tick();
		await selectImage('attachments/lungs.png');

		const drawingSurface = surface();
		stubRect(drawingSurface, 100, 100);
		pointer(drawingSurface, 'pointerdown', 20, 20);
		pointer(drawingSurface, 'pointermove', 50, 60);
		pointer(drawingSurface, 'pointerup', 50, 60);
		await tick();

		const mask = maskElements()[0];
		expect(mask.classList.contains('ml-occlusion-form__mask--active')).toBe(true);
		expect(mask.querySelectorAll('[data-resize-handle]')).toHaveLength(8);
	});

	it('resizes a mask from a corner handle and stores the new geometry', async () => {
		mountForm();
		await tick();
		await selectImage('attachments/lungs.png');

		const drawingSurface = surface();
		stubRect(drawingSurface, 100, 100);
		pointer(drawingSurface, 'pointerdown', 20, 20);
		pointer(drawingSurface, 'pointermove', 50, 60);
		pointer(drawingSurface, 'pointerup', 50, 60);
		await tick();

		const handle = maskElements()[0].querySelector<HTMLElement>('[data-resize-handle="se"]');
		if (!handle) throw new Error('Resize handle not found');

		pointer(handle, 'pointerdown', 50, 60);
		pointer(drawingSurface, 'pointermove', 80, 90);
		pointer(drawingSurface, 'pointerup', 80, 90);
		await tick();

		expect(api?.buildContent()).toEqual(
			expect.objectContaining({
				masks: [expect.objectContaining({ rect: [0.2, 0.2, 0.6, 0.7] })],
			}),
		);
	});

	it('deletes a mask', async () => {
		mountForm();
		await tick();
		await selectImage('attachments/lungs.png');

		const drawingSurface = surface();
		stubRect(drawingSurface, 100, 100);
		pointer(drawingSurface, 'pointerdown', 20, 20);
		pointer(drawingSurface, 'pointermove', 50, 60);
		pointer(drawingSurface, 'pointerup', 50, 60);
		await tick();

		deleteButtons()[0].click();
		await tick();

		expect(maskElements()).toHaveLength(0);
		expect(api?.buildContent()).toEqual(expect.objectContaining({ masks: [] }));
	});

	it('edits a mask answer and optional hint', async () => {
		mountForm();
		await tick();
		await selectImage('attachments/lungs.png');

		const drawingSurface = surface();
		stubRect(drawingSurface, 100, 100);
		pointer(drawingSurface, 'pointerdown', 20, 20);
		pointer(drawingSurface, 'pointermove', 50, 60);
		pointer(drawingSurface, 'pointerup', 50, 60);
		await tick();

		setField('Answer 1', '  Left upper lobe  ');
		setField('Hint 1', '  upper  ');
		await tick();

		expect(api?.buildContent()).toEqual(
			expect.objectContaining({
				masks: [
					expect.objectContaining({
						answer: 'Left upper lobe',
						hint: 'upper',
					}),
				],
			}),
		);
	});

	it('accepts a pasted wikilink that points at a vault image', async () => {
		mountForm();
		await tick();

		paste('![[attachments/brain.png]]');
		await tick();

		expect(target.querySelector<HTMLImageElement>('.ml-occlusion-form__image')?.getAttribute('src')).toBe(
			'app://local/attachments/brain.png',
		);
	});

	it('accepts a pasted image that already exists in the vault', async () => {
		mountForm();
		await tick();

		paste('attachments/lungs.png');
		await tick();

		expect(target.querySelector<HTMLImageElement>('.ml-occlusion-form__image')?.getAttribute('src')).toBe(
			'app://local/attachments/lungs.png',
		);
	});

	it('focuses the surface, so a paste reaches its handler', async () => {
		mountForm();
		await tick();

		surface().focus();

		expect(activeDocument.activeElement).toBe(surface());
	});

	it('ignores a pasted reference that is not a vault file', async () => {
		mountForm();
		await tick();

		paste('https://example.com/lungs.png');
		await tick();

		expect(target.querySelector('.ml-occlusion-form__image')).toBeNull();
	});

	it('reports a missing image, no masks, and an empty mask answer', async () => {
		mountForm();
		await tick();

		expect(api?.validate()).toBe('An image is required.');

		await selectImage('attachments/lungs.png');
		expect(api?.validate()).toBe('At least one mask is required.');

		const drawingSurface = surface();
		stubRect(drawingSurface, 100, 100);
		pointer(drawingSurface, 'pointerdown', 20, 20);
		pointer(drawingSurface, 'pointermove', 50, 60);
		pointer(drawingSurface, 'pointerup', 50, 60);
		await tick();

		expect(api?.validate()).toBe('Mask 1 must have an answer.');

		setField('Answer 1', 'Left upper lobe');
		await tick();

		expect(api?.validate()).toBeNull();
	});

	it('pre-populates the surface and mask fields from an existing card', async () => {
		mountForm({ mode: 'edit', initialContent: EXISTING_CARD });
		await tick();

		expect(target.querySelector<HTMLImageElement>('.ml-occlusion-form__image')?.getAttribute('src')).toBe(
			'app://local/attachments/lungs.png',
		);
		expect(maskElements()).toHaveLength(2);
		expect(maskElements()[0].getAttribute('style')).toContain('left: 20%');
		expect(maskElements()[0].getAttribute('style')).toContain('width: 40%');
		expect(fieldByLabel('Answer 1').value).toBe('Left upper lobe');
		expect(fieldByLabel('Hint 1').value).toBe('upper');
		expect(fieldByLabel('Answer 2').value).toBe('Right lower lobe');
		expect(api?.validate()).toBeNull();
	});

	it('offers the mask tools as soon as an image is chosen, without a drag', async () => {
		mountForm();
		await tick();

		openPicker();
		await tick();
		chooseImage('attachments/lungs.png');
		await tick();

		expect(target.querySelector('.ml-occlusion-form__image')).not.toBeNull();

		// Drawing works by dragging on the surface, but that gesture is not
		// discoverable on its own — the tools have to be visible the moment the image
		// is there, or the tab looks like it has nothing to offer.
		const addMask = buttonByText('Add mask');
		expect(addMask.disabled).toBe(false);

		addMask.click();
		await tick();

		expect(maskElements()).toHaveLength(1);
		expect(fieldByLabel('Answer 1')).not.toBeNull();
		expect(api?.validate()).toBe('Mask 1 must have an answer.');

		const rect = (api?.buildContent() as FlashcardOcclusionContent | undefined)?.masks[0].rect;
		expect(rect?.[2]).toBeGreaterThan(0);
		expect(rect?.[3]).toBeGreaterThan(0);
		expect(rect?.[0]).toBeGreaterThanOrEqual(0);
		expect((rect?.[0] ?? 0) + (rect?.[2] ?? 0)).toBeLessThanOrEqual(1);
		expect((rect?.[1] ?? 0) + (rect?.[3] ?? 0)).toBeLessThanOrEqual(1);
	});
});
