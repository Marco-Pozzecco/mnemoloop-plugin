import { describe, it, expect } from 'vitest';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { Combobox } from '@/ui/components/elements';
import ComboboxRoot from '@/ui/components/elements/Combobox/Root/component.svelte';
import ComboboxInput from '@/ui/components/elements/Combobox/Input/component.svelte';
import ComboboxTrigger from '@/ui/components/elements/Combobox/Trigger/component.svelte';
import ComboboxItem from '@/ui/components/elements/Combobox/Item/component.svelte';
import { canCreateNew, filterOptions } from '@/ui/components/elements/Combobox/utils';

describe('filterOptions', () => {
	const options = [
		{ value: 'math', label: 'Math' },
		{ value: 'lang', label: 'Language' },
		{ value: 'spanish', label: 'Spanish' },
	];

	it('returns all options for an empty or whitespace search', () => {
		expect(filterOptions(options, '')).toEqual(options);
		expect(filterOptions(options, '   ')).toEqual(options);
	});

	it('filters case-insensitively by label substring', () => {
		expect(filterOptions(options, 'ma')).toEqual([options[0]]);
		expect(filterOptions(options, 'LANG')).toEqual([options[1]]);
		expect(filterOptions(options, 'an')).toEqual([options[1], options[2]]);
	});

	it('does not mutate the source array', () => {
		const copy = options.map((option) => ({ ...option }));
		filterOptions(options, 'x');
		expect(options).toEqual(copy);
	});
});

describe('canCreateNew', () => {
	const options = [
		{ value: 'math', label: 'Math' },
		{ value: 'lang', label: 'Language' },
	];

	it('is false for empty or whitespace-only search', () => {
		expect(canCreateNew(options, '')).toBe(false);
		expect(canCreateNew(options, '   ')).toBe(false);
	});

	it('is false when an exact case-insensitive match exists', () => {
		expect(canCreateNew(options, 'math')).toBe(false);
		expect(canCreateNew(options, 'LANGUAGE')).toBe(false);
	});

	it('is true for a non-matching search', () => {
		expect(canCreateNew(options, 'Spanish')).toBe(true);
	});
});

describe('Combobox compound', () => {
	it('exposes the composable sub-components', () => {
		expect(Combobox).toMatchObject({
			Root: ComboboxRoot,
			Input: ComboboxInput,
			Trigger: ComboboxTrigger,
			Item: ComboboxItem,
		});
	});

	it('renders the root wrapper with the default class and children', () => {
		const children = createRawSnippet(() => ({ render: () => 'inner content' }));
		const { body } = render(ComboboxRoot, {
			props: { type: 'multiple', children },
		});
		expect(body).toContain('ml-combobox');
		expect(body).toContain('inner content');
	});
});
