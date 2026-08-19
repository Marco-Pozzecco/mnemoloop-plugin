// @vitest-environment jsdom
import '../../../../../helpers/dom-polyfills'; // MUST be first import
import { afterEach, describe, expect, it } from 'vitest';
import { mount, unmount } from 'svelte';
import ComboboxBindingHarness from './ComboboxBindingHarness.svelte';
import ComboboxCustomAnchorHarness from './ComboboxCustomAnchorHarness.svelte';

function tick(): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, 30));
}

function createRect(x: number, y: number, width: number, height: number): DOMRect {
	return {
		x,
		y,
		width,
		height,
		top: y,
		right: x + width,
		bottom: y + height,
		left: x,
		toJSON: () => ({}),
	} as DOMRect;
}

describe('Combobox default trigger anchor', () => {
	let target: HTMLDivElement;
	let instance: ReturnType<typeof mount>;

	afterEach(() => {
		if (instance) unmount(instance);
		target?.remove();
		activeDocument.body.innerHTML = '';
	});

	it('positions portalled content from its trigger when no customAnchor is supplied', async () => {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		instance = mount(ComboboxBindingHarness, { target, props: { initialValue: [] } });
		await tick();

		const trigger = target.querySelector<HTMLButtonElement>('.ml-combobox__trigger');
		trigger?.dispatchEvent(
			new PointerEvent('pointerdown', {
				bubbles: true,
				cancelable: true,
				button: 0,
			}),
		);
		await tick();
		await tick();

		const wrapper = activeDocument.querySelector<HTMLElement>(
			'[data-bits-floating-content-wrapper]',
		);
		expect(wrapper).toBeTruthy();
		expect(wrapper?.style.transform).not.toBe('translate(0px, -200%)');
		expect(wrapper?.style.getPropertyValue('--bits-floating-anchor-width')).not.toBe('undefinedpx');
	});

	it('preserves an explicit customAnchor over the trigger default', async () => {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		instance = mount(ComboboxCustomAnchorHarness, { target });
		await tick();

		const customAnchor = target.querySelector<HTMLElement>('[data-testid="custom-anchor"]');
		const trigger = target.querySelector<HTMLButtonElement>('.ml-combobox__trigger');
		expect(customAnchor).toBeTruthy();
		expect(trigger).toBeTruthy();

		Object.defineProperty(customAnchor, 'getBoundingClientRect', {
			value: () => createRect(20, 30, 240, 40),
		});
		Object.defineProperty(trigger, 'getBoundingClientRect', {
			value: () => createRect(20, 30, 120, 40),
		});

		trigger?.dispatchEvent(
			new PointerEvent('pointerdown', {
				bubbles: true,
				cancelable: true,
				button: 0,
			}),
		);
		await tick();
		await tick();

		const wrapper = activeDocument.querySelector<HTMLElement>(
			'[data-bits-floating-content-wrapper]',
		);
		expect(wrapper?.style.getPropertyValue('--bits-floating-anchor-width')).toBe('240px');
	});
});
