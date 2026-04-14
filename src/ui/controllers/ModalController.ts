import { ModalState, modalStore, ModalStore } from '../store/modal.store';

export interface IModalController {
	onConfirm(callback: () => void): void;
	onCancel(callback: () => void): void;
	onClose(callback: () => void): void;
	readonly store: ModalStore;
	readonly state: ModalState;
}

export class ModalController implements IModalController {
	private _store: ModalStore = modalStore;

	onCancel(callback: () => void): void {
		callback();
		this._store.close();
	}

	onClose(callback: () => void): void {
		callback();
		this._store.close();
	}

	onConfirm(callback: () => void): void {
		callback();
		this._store.close();
	}

	get store() {
		return this._store;
	}

	get state() {
		return this._store.state;
	}
}
