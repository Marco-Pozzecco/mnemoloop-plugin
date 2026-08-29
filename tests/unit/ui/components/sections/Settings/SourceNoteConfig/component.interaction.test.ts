// @vitest-environment jsdom
import '../../../../../../helpers/dom-polyfills';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, unmount } from 'svelte';
import SourceNoteConfig from '@/ui/components/sections/Settings/SourceNoteConfig/component.svelte';
import { DEFAULT_PLUGIN_SETTINGS } from '@/schemas/settings';

async function flush(): Promise<void> {
	await Promise.resolve();
}

describe('SourceNoteConfig interaction', () => {
	let target: HTMLDivElement;
	let instance: ReturnType<typeof mount>;

	afterEach(() => {
		if (instance) unmount(instance);
		target?.remove();
		activeDocument.body.innerHTML = '';
	});

	it('renders current values and source matching guidance', async () => {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		instance = mount(SourceNoteConfig, {
			target,
			props: {
				settings: {
					...DEFAULT_PLUGIN_SETTINGS,
					source_note: {
						watch: { directory: '/notes', tags: ['#biology', '#chemistry'] },
						priming: DEFAULT_PLUGIN_SETTINGS.source_note.priming,
					},
				},
				onNestedFieldChange: vi.fn(),
			},
		});
		await flush();

		const inputs = target.querySelectorAll<HTMLInputElement>('input');
		expect(inputs[0]?.value).toBe('/notes');
		expect(inputs[1]?.value).toBe('#biology, #chemistry');
		expect(inputs[2]?.value).toBe('7');
		expect(inputs[2]?.type).toBe('number');
		expect(inputs[2]?.getAttribute('min')).toBe('0');
		expect(inputs[2]?.getAttribute('step')).toBe('0.1');
		expect(target.textContent).toContain('matching is recursive');
		expect(target.textContent).toContain('comma-separated # tags');
		expect(target.textContent).toContain('OR criteria');
		expect(target.textContent).toContain('Complete cached tags');
		expect(target.textContent).toContain('frontmatter tags');
		expect(target.textContent).toContain('disables source-note detection');
		expect(target.textContent).toContain(
			'Include a source note when at least one active card due now in the selected deck has a difficulty greater than this value.',
		);
	});

	it('submits directory and trimmed tag values, including empty criteria', async () => {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		const onNestedFieldChange = vi.fn();
		instance = mount(SourceNoteConfig, {
			target,
			props: {
				settings: DEFAULT_PLUGIN_SETTINGS,
				onNestedFieldChange,
			},
		});
		await flush();

		const inputs = target.querySelectorAll<HTMLInputElement>('input');
		inputs[0].value = '';
		inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
		inputs[1].value = ' #biology, , #chemistry ';
		inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
		inputs[1].value = '';
		inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
		await flush();

		expect(onNestedFieldChange).toHaveBeenNthCalledWith(
			1,
			['source_note', 'watch', 'directory'],
			'',
		);
		expect(onNestedFieldChange).toHaveBeenNthCalledWith(
			2,
			['source_note', 'watch', 'tags'],
			['#biology', '#chemistry'],
		);
		expect(onNestedFieldChange).toHaveBeenNthCalledWith(
			3,
			['source_note', 'watch', 'tags'],
			[],
		);
	});

	it('submits decimal thresholds and preserves empty input as NaN', async () => {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		const onNestedFieldChange = vi.fn();
		instance = mount(SourceNoteConfig, {
			target,
			props: {
				settings: DEFAULT_PLUGIN_SETTINGS,
				onNestedFieldChange,
			},
		});
		await flush();

		const thresholdInput = target.querySelectorAll<HTMLInputElement>('input')[2];
		thresholdInput.value = '8.4';
		thresholdInput.dispatchEvent(new Event('change', { bubbles: true }));
		thresholdInput.value = '';
		thresholdInput.dispatchEvent(new Event('change', { bubbles: true }));

		expect(onNestedFieldChange).toHaveBeenNthCalledWith(
			1,
			['source_note', 'priming', 'difficulty_threshold'],
			8.4,
		);
		expect(onNestedFieldChange.mock.calls[1]?.[0]).toEqual([
			'source_note',
			'priming',
			'difficulty_threshold',
		]);
		expect(Number.isNaN(onNestedFieldChange.mock.calls[1]?.[1])).toBe(true);
	});


	it('renders validation errors on the matching inputs', async () => {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		instance = mount(SourceNoteConfig, {
			target,
			props: {
				settings: DEFAULT_PLUGIN_SETTINGS,
				onNestedFieldChange: vi.fn(),
				hasError: (key: string) =>
					key === 'source_note.watch.tags' ||
					key === 'source_note.priming.difficulty_threshold',
				getError: (key: string) => {
					if (key === 'source_note.watch.tags') {
						return 'Source note tags must start with';
					}
					return key === 'source_note.priming.difficulty_threshold'
						? 'Enter a non-negative number.'
						: undefined;
				},
			},
		});
		await flush();

		const tagsInput = target.querySelectorAll<HTMLInputElement>('input')[1];
		const thresholdInput = target.querySelectorAll<HTMLInputElement>('input')[2];
		expect(tagsInput.getAttribute('aria-invalid')).toBe('true');
		expect(thresholdInput.getAttribute('aria-invalid')).toBe('true');
		expect(target.textContent).toContain('Source note tags must start with');
		expect(target.textContent).toContain('Enter a non-negative number.');
	});
});
