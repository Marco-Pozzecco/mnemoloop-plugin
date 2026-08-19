// @vitest-environment jsdom
import '../../../../../helpers/dom-polyfills'; // MUST be the first import (side-effect polyfills)
import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ManagePagination from '@/ui/components/sections/Manage/Pagination/component.svelte';

describe('ManagePagination interaction', () => {
	let target: HTMLDivElement;
	let instance: ReturnType<typeof mount>;

	afterEach(() => {
		if (instance) unmount(instance);
		target?.remove();
	});

	it('clamps direct page entry before invoking the page callback', async () => {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		const onPageChange = vi.fn();
		instance = mount(ManagePagination, {
			target,
			props: {
				currentPage: 2,
				totalPages: 5,
				totalItems: 42,
				pageSize: 10,
				onPageChange,
			},
		});
		await new Promise((resolve) => window.setTimeout(resolve, 30));

		const input = target.querySelector<HTMLInputElement>('#ml-manage-page-number');
		const form = target.querySelector<HTMLFormElement>('form');
		expect(input).toBeTruthy();
		expect(form).toBeTruthy();

		input!.value = '99';
		input!.dispatchEvent(new Event('input', { bubbles: true }));
		form!.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
		expect(onPageChange).toHaveBeenLastCalledWith(5);

		input!.value = '0';
		input!.dispatchEvent(new Event('input', { bubbles: true }));
		form!.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
		expect(onPageChange).toHaveBeenLastCalledWith(1);
	});
});
