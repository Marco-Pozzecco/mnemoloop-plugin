// @vitest-environment jsdom
import '../../../../../helpers/dom-polyfills';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, unmount } from 'svelte';
import DeleteConfirmation from '@/ui/components/sections/Manage/DeleteConfirmation/component.svelte';

function tick(): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, 30));
}

describe('ManageDeleteConfirmation interaction', () => {
	let target: HTMLDivElement;
	let instance: ReturnType<typeof mount>;

	function mountDialog() {
		target = activeDocument.createElement('div');
		activeDocument.body.appendChild(target);
		const onCancel = vi.fn();
		const onConfirm = vi.fn();
		instance = mount(DeleteConfirmation, {
			target,
			props: { cardLabel: 'Front content', onCancel, onConfirm },
		});
		return { onCancel, onConfirm };
	}

	afterEach(() => {
		if (instance) unmount(instance);
		target?.remove();
		activeDocument.body.innerHTML = '';
	});

	it('opens with linked title and description and does not nest buttons', async () => {
		mountDialog();
		await tick();

		const dialog = target.querySelector<HTMLElement>('[role="alertdialog"]');
		expect(dialog).toBeTruthy();
		expect(dialog?.getAttribute('aria-labelledby')).toBeTruthy();
		expect(dialog?.getAttribute('aria-describedby')).toBeTruthy();
		expect(dialog?.querySelectorAll('button')).toHaveLength(2);
		expect(dialog?.querySelector('button button')).toBeNull();
	});

	it('calls onCancel when Cancel is activated or Escape is pressed', async () => {
		const { onCancel } = mountDialog();
		await tick();

		target.querySelector<HTMLButtonElement>('.ml-alert-dialog__cancel')?.click();
		await tick();
		expect(onCancel).toHaveBeenCalledTimes(1);

		unmount(instance);
		target.remove();

		const { onCancel: escapeCancel } = mountDialog();
		await tick();
		target.querySelector<HTMLElement>('[role="alertdialog"]')?.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
		);
		await tick();
		expect(escapeCancel).toHaveBeenCalledTimes(1);
	});

	it('ignores outside pointer interaction', async () => {
		const { onCancel } = mountDialog();
		await tick();

		const pointerDown =
			typeof PointerEvent === 'function'
				? new PointerEvent('pointerdown', { bubbles: true, cancelable: true })
				: new MouseEvent('pointerdown', { bubbles: true, cancelable: true });
		activeDocument.body.dispatchEvent(pointerDown);
		await tick();

		expect(onCancel).not.toHaveBeenCalled();
		expect(target.querySelector('[role="alertdialog"]')).toBeTruthy();
	});

	it('moves focus into the modal on open; jsdom cannot verify focus return without a trigger', async () => {
		const trigger = activeDocument.createElement('button');
		activeDocument.body.appendChild(trigger);
		trigger.focus();
		const preOpenActiveElement = activeDocument.activeElement;
		expect(preOpenActiveElement).toBe(trigger);

		const { onCancel } = mountDialog();
		await tick();

		const dialog = target.querySelector<HTMLElement>('[role="alertdialog"]');
		expect(dialog).toBeTruthy();
		expect(dialog?.contains(activeDocument.activeElement)).toBe(true);

		target.querySelector<HTMLButtonElement>('.ml-alert-dialog__cancel')?.click();
		await tick();
		expect(onCancel).toHaveBeenCalledTimes(1);
	});

	it('calls onConfirm when Delete flashcard is activated', async () => {
		const { onConfirm } = mountDialog();
		await tick();

		target.querySelector<HTMLButtonElement>('.ml-alert-dialog__action')?.click();
		expect(onConfirm).toHaveBeenCalledTimes(1);
	});
});
