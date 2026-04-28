import { ModalController } from '@/ui/controllers/ModalController';
import { App, Component, Modal } from 'obsidian';
import { mount, unmount } from 'svelte';
import { default as ModalComponent } from './Modal.svelte';

export class SvelteModal extends Modal {
	protected svelteComponent: ReturnType<typeof mount> | null = null;
	protected controller: ModalController;
	protected className: string;
	protected component: Component | null = null;

	constructor(app: App, className: string) {
		super(app);
		this.controller = new ModalController(this);
		this.className = className;
	}

	onOpen(): void {
		this.contentEl.empty();
		this.modalEl.addClass(this.className);
		this.component = new Component();
		this.component.load();

		this.svelteComponent = mount(ModalComponent, {
			target: this.contentEl,
			props: {
				controller: this.controller,
				app: this.app,
				component: this.component,
			},
		});
	}

	onClose(): void {
		if (this.svelteComponent) {
			unmount(this.svelteComponent);
			this.svelteComponent = null;
		}
		if (this.component) {
			this.component.unload();
			this.component = null;
		}
		this.contentEl.empty();
		this.modalEl.removeClass(this.className);
	}
}
