import { writable } from 'svelte/store';
import { BaseStoreManager } from './base.store';
import { FlashcardModalData } from '../components/modals/FlashcardModal/types';

export enum ModalViewEnum {
	flashcard = 'flashcard',
}

export type ModalData = FlashcardModalData | Record<string, never>;

export type ModalView = ModalViewEnum | null;

export interface ModalState {
	currentView: ModalView;
	isOpen: boolean;
	isLoading: boolean;
	error: string | null;
	data: unknown;
}

const initialModalState: ModalState = {
	currentView: null,
	isOpen: false,
	isLoading: false,
	error: null,
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

	get isLoading(): ModalState['isLoading'] {
		return this.state.isLoading;
	}

	get error(): ModalState['error'] {
		return this.state.error;
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
			isLoading: false,
			error: null,
			data: undefined,
		}));
	}

	setLoading(value: boolean): void {
		this.store.update((state) => ({ ...state, isLoading: value }));
	}

	setError(error: string | null): void {
		this.store.update((state) => ({ ...state, error }));
	}

	setData(partialData: Partial<ModalState['data']>): void {
		this.store.update((state) => ({
			...state,
			data: { ...(state.data || {}), ...partialData },
		}));
	}
}

export const modalStore = new ModalStore();
