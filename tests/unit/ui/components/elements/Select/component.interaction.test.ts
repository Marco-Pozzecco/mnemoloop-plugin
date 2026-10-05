// @vitest-environment jsdom
import '../../../../../helpers/dom-polyfills'; // MUST be first import
import { afterEach, describe, expect, it } from 'vitest';
import { mount, unmount } from 'svelte';
import Select from '@/ui/components/elements/Select/component.svelte';

const OPTIONS = [
	{ value: '', label: 'All' },
	{ value: 'basic', label: 'Basic' },
];

function tick(): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, 30));
}

describe('Select trigger display', () => {
	let target: HTMLDivElement;
	let instance: ReturnType<typeof mount> | undefined;

	afterEach(() => {
		if (instance) unmount(instance);
		target?.remove();
		activeDocument.body.innerHTML = '';
	});

	it('shows the matching option label for an empty-string value', async () => {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		instance = mount(Select, {
			target,
			props: { options: OPTIONS, value: '', label: 'Type' },
		});
		await tick();

		expect(target.querySelector('.ml-select')?.textContent?.trim()).toBe('All');
	});

	it('shows the option label for a selected value', async () => {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		instance = mount(Select, {
			target,
			props: { options: OPTIONS, value: 'basic', label: 'Type' },
		});
		await tick();

		expect(target.querySelector('.ml-select')?.textContent?.trim()).toBe('Basic');
	});
});
