// @vitest-environment jsdom
import '../../../../../helpers/dom-polyfills'; // MUST be first import
import { afterEach, describe, expect, it } from 'vitest';
import { mount, unmount } from 'svelte';
import ComboboxBindingHarness from './ComboboxBindingHarness.svelte';

function tick(): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, 30));
}

describe('Combobox primitive interaction', () => {
	let target: HTMLDivElement;
	let instance: ReturnType<typeof mount>;

	afterEach(() => {
		if (instance) unmount(instance);
		target?.remove();
		activeDocument.body.innerHTML = '';
	});

	it('forwards Root value binding when an item is selected', async () => {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		instance = mount(ComboboxBindingHarness, { target, props: { initialValue: [] } });
		await tick();

		const trigger = target.querySelector<HTMLButtonElement>('.ml-combobox__trigger');
		expect(trigger?.getAttribute('aria-label')).toBe('Open combobox');
		trigger?.dispatchEvent(
			new PointerEvent('pointerdown', {
				bubbles: true,
				cancelable: true,
				button: 0,
			}),
		);
		await tick();
		await tick();

		const item = Array.from(
			activeDocument.querySelectorAll<HTMLElement>('.ml-combobox__item'),
		).find((element) => element.textContent?.trim() === 'Math');
		expect(item).toBeTruthy();
		item?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0 }));
		await tick();
		await tick();

		expect(target.querySelector('[data-testid="selected"]')?.textContent).toBe('math');
	});
});
