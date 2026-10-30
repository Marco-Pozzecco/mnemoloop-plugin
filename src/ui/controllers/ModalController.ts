import { Modal } from 'obsidian';
import { modalStore, ModalStore } from '../store/modal.store';

interface IModalController {
	onClose(): void;
	readonly store: ModalStore;
}

export class ModalController implements IModalController {
	private _store: ModalStore = modalStore;
	private _modal: Modal;

	constructor(modal: Modal) {
		this._modal = modal;
	}

	onClose(): void {
		this._store.close();
		this._modal.close();
	}

	get store() {
		return this._store;
	}
}
