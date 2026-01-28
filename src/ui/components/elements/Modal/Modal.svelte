<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import { Icon } from '@/ui/design-system/atoms';
	import type { ModalProps } from './Modal.types';

	/**
	 * Whether the modal is open
	 */
	export let open: ModalProps['open'] = false;

	/**
	 * Modal title
	 */
	export let title: ModalProps['title'] = undefined;

	/**
	 * Maximum width of the modal
	 */
	export let maxWidth: ModalProps['maxWidth'] = 'medium';

	/**
	 * Whether to close on backdrop click
	 */
	export let closeOnBackdrop: ModalProps['closeOnBackdrop'] = true;

	/**
	 * Whether to close on escape key
	 */
	export let closeOnEscape: ModalProps['closeOnEscape'] = true;

	/**
	 * Whether to show close button
	 */
	export let showCloseButton: ModalProps['showCloseButton'] = true;

	/**
	 * Additional CSS classes
	 */
	let className: string = '';
	export { className as class };

	let modalElement: HTMLElement;
	let previousActiveElement: HTMLElement | null = null;
	let focusableElements: HTMLElement[] = [];

	const dispatch = createEventDispatcher<{
		close: void;
		open: void;
	}>();

	onMount(() => {
		document.addEventListener('keydown', handleEscapeKey);
	});

	onDestroy(() => {
		document.removeEventListener('keydown', handleEscapeKey);
		restoreFocus();
	});

	$: if (open) {
		tick().then(() => {
			previousActiveElement = document.activeElement as HTMLElement;
			setupFocusTrap();
			if (modalElement) {
				focusFirstElement();
			}
			dispatch('open');
		});
	} else {
		restoreFocus();
	}

	function handleEscapeKey(event: KeyboardEvent) {
		if (closeOnEscape && event.key === 'Escape' && open) {
			close();
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (closeOnBackdrop && event.target === event.currentTarget) {
			close();
		}
	}

	function close() {
		open = false;
		dispatch('close');
		restoreFocus();
	}

	function setupFocusTrap() {
		if (!modalElement) return;

		const focusableSelectors = [
			'a[href]',
			'button:not([disabled])',
			'textarea:not([disabled])',
			'input:not([disabled])',
			'select:not([disabled])',
			'[tabindex]:not([tabindex="-1"])'
		];
		focusableElements = Array.from(
			modalElement.querySelectorAll(focusableSelectors.join(','))
		) as HTMLElement[];
	}

	function focusFirstElement() {
		if (focusableElements.length > 0) {
			focusableElements[0]?.focus();
		}
	}

	function restoreFocus() {
		if (previousActiveElement) {
			previousActiveElement.focus();
			previousActiveElement = null;
		}
	}

	function handleFocusIn(event: FocusEvent) {
		if (!open || !modalElement) return;

		if (!modalElement.contains(event.target as Node)) {
			focusFirstElement();
		}
	}
</script>

{#if open}
	<div
		class="ka-modal-backdrop {className}"
		class:max-width-small={maxWidth === 'small'}
		class:max-width-medium={maxWidth === 'medium'}
		class:max-width-large={maxWidth === 'large'}
		class:max-width-full={maxWidth === 'full'}
		transition:fade={{ duration: 200 }}
		on:click={handleBackdropClick}
		on:focusin={handleFocusIn}
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? 'modal-title' : undefined}
	>
		<div
			bind:this={modalElement}
			class="ka-modal"
			transition:fly={{ y: 20, duration: 200, opacity: 0.5 }}
		>
			{#if title || showCloseButton}
				<header class="ka-modal-header">
					{#if title}
						<h2 id="modal-title" class="ka-modal-title">{title}</h2>
					{/if}
					{#if showCloseButton}
						<button
							class="ka-modal-close"
							on:click={close}
							aria-label="Close modal"
						>
							<Icon name="x" size={20} />
						</button>
					{/if}
				</header>
			{/if}

			<div class="ka-modal-body">
				<slot name="body">
					<slot />
				</slot>
			</div>

			{#if $$slots.footer}
				<footer class="ka-modal-footer">
					<slot name="footer" />
				</footer>
			{/if}
		</div>
	</div>
{/if}

<style>
	.ka-modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		z-index: 1000;
	}

	.ka-modal {
		background-color: var(--background-primary);
		border-radius: var(--modal-radius, 8px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		max-height: calc(100vh - 2rem);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.ka-modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--background-modifier-border);
		flex-shrink: 0;
	}

	.ka-modal-title {
		margin: 0;
		font-size: var(--font-ui-medium);
		font-weight: var(--font-semibold);
		color: var(--text-normal);
	}

	.ka-modal-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		min-height: 32px;
		min-width: 32px;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--text-muted);
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.2s ease, color 0.2s ease;
		flex-shrink: 0;
	}

	.ka-modal-close:hover {
		background-color: var(--background-modifier-hover);
		color: var(--text-normal);
	}

	.ka-modal-close:active {
		background-color: var(--background-modifier-active);
	}

	.ka-modal-body {
		padding: 1.25rem;
		overflow-y: auto;
		flex: 1;
	}

	.ka-modal-footer {
		padding: 1rem 1.25rem;
		border-top: 1px solid var(--background-modifier-border);
		background-color: var(--background-modifier-hover);
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		flex-shrink: 0;
	}

	/* Max width variants */
	.ka-modal-backdrop.max-width-small .ka-modal {
		max-width: 400px;
		width: 100%;
	}

	.ka-modal-backdrop.max-width-medium .ka-modal {
		max-width: 600px;
		width: 100%;
	}

	.ka-modal-backdrop.max-width-large .ka-modal {
		max-width: 800px;
		width: 100%;
	}

	.ka-modal-backdrop.max-width-full .ka-modal {
		max-width: 100%;
		width: 100%;
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ka-modal-backdrop {
			padding: 0.5rem;
		}

		.ka-modal-header,
		.ka-modal-body,
		.ka-modal-footer {
			padding-left: 1rem;
			padding-right: 1rem;
		}

		.ka-modal-backdrop.max-width-small .ka-modal,
		.ka-modal-backdrop.max-width-medium .ka-modal {
			max-width: 100%;
		}
	}
</style>
