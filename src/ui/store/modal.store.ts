import type { FlashcardFormModalData } from '../components/modals/FlashcardFormModal/types';
import { writable } from 'svelte/store';
import { BaseStoreManager } from './base.store';

export enum ModalViewEnum {
	flashcard = 'flashcard',
}

export type ModalData = FlashcardFormModalData;

export type ModalView = ModalViewEnum | null;

export interface ModalState {
	currentView: ModalView;
	isOpen: boolean;
	data: unknown;
}

const initialModalState: ModalState = {
	currentView: null,
	isOpen: false,
	data: undefined,
};

const store = writable(initialModalState);

export class ModalStore extends BaseStoreManager<ModalState> {
	constructor() {
		super(initialModalState, store);
	}

	// Writable stores for Svelte
	get currentView(): ModalState['currentView'] {
		return this.state.currentView;
	}

	get data(): ModalState['data'] {
		return this.state.data;
	}

	open(view: ModalView, data?: unknown): void {
		this.store.update((state) => ({
			...state,
			currentView: view,
			isOpen: true,
			data: data !== undefined ? data : state.data,
		}));
	}

	close(): void {
		this.store.update((state) => ({
			...state,
			currentView: null,
			isOpen: false,
			data: undefined,
		}));
	}
}

export const modalStore = new ModalStore();
