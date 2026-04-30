import { Modal } from 'obsidian';
import { ModalState, modalStore, ModalStore } from '../store/modal.store';

interface IModalController {
	onConfirm(): void;
	onCancel(): void;
	onClose(): void;
	readonly store: ModalStore;
	readonly state: ModalState;
}

export class ModalController implements IModalController {
	private _store: ModalStore = modalStore;
	private _modal: Modal;
	private _cancel: () => void = () => {};
	private _confirm: () => void = () => {};

	constructor(modal: Modal) {
		this._modal = modal;
	}

	set cancelAction(callback: () => void) {
		this._cancel = callback;
	}

	set confirmAction(callback: () => void) {
		this._confirm = callback;
	}

	onCancel(): void {
		this._cancel();
		this.onClose();
	}

	onClose(): void {
		this._store.close();
		this._modal.close();
	}

	onConfirm(): void {
		this._confirm();
		this.onClose();
	}

	get store() {
		return this._store;
	}

	get state() {
		return this._store.state;
	}
}
