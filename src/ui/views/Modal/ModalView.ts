import type { IModalController } from '@/ui/controllers/ModalController';
import { App, Modal } from 'obsidian';
import { mount, unmount } from 'svelte';
import { default as ModalComponent } from './Modal.svelte';

export class SvelteModal extends Modal {
	protected svelteComponent: ReturnType<typeof mount> | null = null;
	protected controller: IModalController;

	constructor(app: App, controller: IModalController) {
		super(app);
		this.controller = controller;
	}

	onOpen(): void {
		this.contentEl.empty();
		this.contentEl.addClass('ka-modal');

		this.svelteComponent = mount(ModalComponent, {
			target: this.contentEl,
			props: {
				controller: this.controller,
			},
		});
	}

	onClose(): void {
		if (this.svelteComponent) {
			unmount(this.svelteComponent);
			this.svelteComponent = null;
		}
		this.contentEl.empty();
		this.contentEl.removeClass('ka-modal');
	}
}
