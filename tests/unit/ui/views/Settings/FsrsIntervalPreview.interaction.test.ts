// @vitest-environment jsdom
import '../../../../helpers/dom-polyfills';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mount, unmount } from 'svelte';
import FsrsIntervalPreview from '@/ui/views/Settings/FsrsIntervalPreview/component.svelte';
import { settingsStore } from '@/ui/store/settings.store';
import { DEFAULT_PLUGIN_SETTINGS } from '@/schemas/settings';

async function flush(): Promise<void> {
	await Promise.resolve();
}

describe('FsrsIntervalPreview interaction', () => {
	let target: HTMLDivElement;
	let instance: ReturnType<typeof mount>;

	beforeEach(() => {
		settingsStore.settings.set(DEFAULT_PLUGIN_SETTINGS);
	});

	afterEach(() => {
		if (instance) unmount(instance);
		target?.remove();
		activeDocument.body.innerHTML = '';
	});

	it('renders the interval table', async () => {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		instance = mount(FsrsIntervalPreview, { target });
		await flush();

		const text = target.textContent ?? '';
		expect(text).toContain('Interval preview');
		expect(text).toContain('Again');
		expect(text).toContain('Easy');
	});

	it('updates in place when an FSRS parameter changes, without remounting', async () => {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		instance = mount(FsrsIntervalPreview, { target });
		await flush();

		const before = target.textContent ?? '';

		settingsStore.settings.update((settings) => ({
			...settings,
			flashcard: {
				...settings.flashcard,
				fsrs: { ...settings.flashcard.fsrs, maximum_interval: 1 },
			},
		}));
		await flush();

		const after = target.textContent ?? '';
		expect(after).not.toBe(before);
		expect(after).toContain('Interval preview');
	});
});
