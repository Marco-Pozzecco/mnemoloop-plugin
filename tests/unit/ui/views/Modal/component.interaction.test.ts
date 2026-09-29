// @vitest-environment jsdom
import '../../../../helpers/dom-polyfills';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, tick, unmount } from 'svelte';
import { Component, Modal, type App } from 'obsidian';
import { ModalController } from '@/ui/controllers/ModalController';
import { ModalViewEnum, modalStore } from '@/ui/store/modal.store';
import ModalView from '@/ui/views/Modal/Modal.svelte';
import { createMockPlugin } from '../../../../helpers/mock-obsidian';
import { resetSingletons } from '../../../../helpers/reset-singletons';

/**
 * The modal view reads the store, so state raised after the modal is open —
 * a validation error, the loading flag — has to reach the DOM. These tests
 * drive the real view and the real controller, because that pair is what the
 * user interacts with.
 */
async function flush(): Promise<void> {
	await Promise.resolve();
	await tick();
	await Promise.resolve();
	await tick();
}

describe('Modal view', () => {
	let target: HTMLDivElement;
	let instance: ReturnType<typeof mount> | undefined;
	let owner: Component;
	let modalDouble: Modal;
	let controller: ModalController;

	function mountView(): void {
		const plugin = createMockPlugin([]);
		owner = new Component();
		owner.load();
		modalDouble = { close: vi.fn() } as unknown as Modal;
		controller = new ModalController(modalDouble);
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		instance = mount(ModalView, {
			target,
			props: { controller, app: plugin.app as unknown as App, component: owner },
		});
	}

	function buttonByText(label: string): HTMLButtonElement {
		const button = Array.from(target.querySelectorAll<HTMLButtonElement>('button')).find(
			(element) => element.textContent?.trim() === label,
		);
		if (!button) throw new Error(`No button labeled "${label}"`);
		return button;
	}

	beforeEach(() => {
		resetSingletons();
		modalStore.close();
	});

	afterEach(async () => {
		if (instance) await unmount(instance);
		instance = undefined;
		owner?.unload();
		target?.remove();
		activeDocument.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('shows an error raised on the store after the modal opened', async () => {
		modalStore.open(ModalViewEnum.flashcard, { mode: 'create' });
		mountView();
		await flush();

		modalStore.setError('An image is required.');
		await flush();

		expect(target.textContent).toContain('An image is required.');
	});

	it('keeps the modal open and shows the error when an incomplete occlusion card is submitted', async () => {
		modalStore.open(ModalViewEnum.flashcard, { mode: 'create' });
		mountView();
		await flush();

		buttonByText('Occlusion').click();
		await flush();
		buttonByText('Save').click();
		await flush();

		expect(target.textContent).toContain('An image is required.');
		expect(modalDouble.close).not.toHaveBeenCalled();
	});
});
