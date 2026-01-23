import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIStore } from '@/ui/stores/ui/UIStore';
import { EventBus } from '@/ui/infrastructure/EventBus';
import { AppEvents } from '@/ui/infrastructure/EventBus';
import type { UIState } from '@/ui/stores/ui/types';

const mockDependencies = {
	eventBus: new EventBus(),
};

describe('UIStore', () => {
	let uiStore: UIStore;

	beforeEach(() => {
		uiStore = new UIStore(mockDependencies);
		vi.clearAllMocks();
	});

	describe('initialization', () => {
		it('should initialize with default state', () => {
			const state = uiStore.state;

			expect(state.currentView).toBe('dashboard');
			expect(state.theme).toBe('dark');
			expect(state.modal.isOpen).toBe(false);
			expect(state.modal.type).toBeNull();
			expect(state.modal.data).toBeNull();
			expect(state.isLoading).toBe(false);
			expect(state.error.hasError).toBe(false);
			expect(state.error.message).toBeNull();
		});

		it('should provide subscribe method', () => {
			expect(typeof uiStore.subscribe).toBe('function');
		});
	});

	describe('navigate', () => {
		it('should navigate to dashboard view', () => {
			const emitSpy = vi.spyOn(uiStore['eventBus'], 'emit');

			uiStore.navigate('dashboard');

			expect(uiStore.state.currentView).toBe('dashboard');
			expect(emitSpy).toHaveBeenCalledWith(AppEvents.VIEW_CHANGED, {
				view: 'dashboard',
			});
		});

		it('should navigate to review view', () => {
			const emitSpy = vi.spyOn(uiStore['eventBus'], 'emit');

			uiStore.navigate('review');

			expect(uiStore.state.currentView).toBe('review');
			expect(emitSpy).toHaveBeenCalledWith(AppEvents.VIEW_CHANGED, {
				view: 'review',
			});
		});

		it('should navigate to settings view', () => {
			const emitSpy = vi.spyOn(uiStore['eventBus'], 'emit');

			uiStore.navigate('settings');

			expect(uiStore.state.currentView).toBe('settings');
			expect(emitSpy).toHaveBeenCalledWith(AppEvents.VIEW_CHANGED, {
				view: 'settings',
			});
		});
	});

	describe('openModal and closeModal', () => {
		it('should open modal with type and data', () => {
			uiStore.openModal('confirm-delete', { id: 'card-1' });

			const modal = uiStore.state.modal;
			expect(modal.isOpen).toBe(true);
			expect(modal.type).toBe('confirm-delete');
			expect(modal.data).toEqual({ id: 'card-1' });
		});

		it('should open modal without data', () => {
			uiStore.openModal('info');

			const modal = uiStore.state.modal;
			expect(modal.isOpen).toBe(true);
			expect(modal.type).toBe('info');
			expect(modal.data).toBeNull();
		});

		it('should close modal', () => {
			uiStore.openModal('info');
			expect(uiStore.state.modal.isOpen).toBe(true);

			uiStore.closeModal();

			const modal = uiStore.state.modal;
			expect(modal.isOpen).toBe(false);
			expect(modal.type).toBeNull();
			expect(modal.data).toBeNull();
		});

		it('should overwrite existing modal when opening new one', () => {
			uiStore.openModal('modal-1', { data: 'first' });
			uiStore.openModal('modal-2', { data: 'second' });

			const modal = uiStore.state.modal;
			expect(modal.type).toBe('modal-2');
			expect(modal.data).toEqual({ data: 'second' });
		});
	});

	describe('setTheme', () => {
		it('should set theme to light', () => {
			const emitSpy = vi.spyOn(uiStore['eventBus'], 'emit');

			uiStore.setTheme('light');

			expect(uiStore.state.theme).toBe('light');
			expect(emitSpy).toHaveBeenCalledWith(AppEvents.THEME_CHANGED, {
				theme: 'light',
			});
		});

		it('should set theme to dark', () => {
			const emitSpy = vi.spyOn(uiStore['eventBus'], 'emit');

			uiStore.setTheme('dark');

			expect(uiStore.state.theme).toBe('dark');
			expect(emitSpy).toHaveBeenCalledWith(AppEvents.THEME_CHANGED, {
				theme: 'dark',
			});
		});
	});

	describe('setLoading', () => {
		it('should set loading to true', () => {
			uiStore.setLoading(true);

			expect(uiStore.state.isLoading).toBe(true);
		});

		it('should set loading to false', () => {
			uiStore.setLoading(true);
			uiStore.setLoading(false);

			expect(uiStore.state.isLoading).toBe(false);
		});
	});

	describe('setError and clearError', () => {
		it('should set error state', () => {
			const errorMessage = 'Something went wrong';
			uiStore.setError(errorMessage);

			const error = uiStore.state.error;
			expect(error.hasError).toBe(true);
			expect(error.message).toBe(errorMessage);
		});

		it('should clear error state', () => {
			uiStore.setError('Error message');
			expect(uiStore.state.error.hasError).toBe(true);

			uiStore.clearError();

			const error = uiStore.state.error;
			expect(error.hasError).toBe(false);
			expect(error.message).toBeNull();
		});

		it('should overwrite existing error', () => {
			uiStore.setError('First error');
			uiStore.setError('Second error');

			expect(uiStore.state.error.message).toBe('Second error');
		});
	});

	describe('reset', () => {
		it('should reset store to default state', () => {
			// Modify state
			uiStore.navigate('review');
			uiStore.setTheme('light');
			uiStore.setLoading(true);
			uiStore.openModal('modal-1');
			uiStore.setError('Error');

			// Reset
			uiStore.reset();

			// Verify reset to defaults
			const state = uiStore.state;
			expect(state.currentView).toBe('dashboard');
			expect(state.theme).toBe('dark');
			expect(state.isLoading).toBe(false);
			expect(state.modal.isOpen).toBe(false);
			expect(state.error.hasError).toBe(false);
		});
	});

	describe('state immutability', () => {
		it('should not modify original state when accessing', () => {
			const state1 = uiStore.state;
			const state2 = uiStore.state;

			// They should have same values
			expect(state1).toEqual(state2);
		});
	});
});
