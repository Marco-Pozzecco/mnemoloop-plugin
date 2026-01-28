<script lang="ts">
	import { onMount, afterUpdate, onDestroy } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { Icon } from '@/ui/design-system/atoms';
	import type { ToastProps } from './Toast.types';

	/**
	 * Toast message to display
	 */
	export let message: ToastProps['message'];

	/**
	 * Toast type/style
	 */
	export let type: ToastProps['type'] = 'info';

	/**
	 * Auto-dismiss duration in milliseconds (0 to disable)
	 */
	export let duration: ToastProps['duration'] = 3000;

	/**
	 * Whether the toast is visible
	 */
	export let visible: ToastProps['visible'] = true;

	/**
	 * Toast position
	 */
	export let position: ToastProps['position'] = 'top';

	/**
	 * Whether to show close button
	 */
	export let showCloseButton: ToastProps['showCloseButton'] = true;

	/**
	 * Optional icon to override default
	 */
	export let icon: ToastProps['icon'] = undefined;

	/**
	 * Additional CSS classes
	 */
	let className: string = '';
	export { className as class };

	let timeoutId: NodeJS.Timeout | null = null;

	const typeIcons: Record<ToastProps['type'], string> = {
		info: 'info',
		success: 'check-circle',
		warning: 'alert-triangle',
		error: 'x-circle'
	};

	$: displayIcon = icon ?? typeIcons[type];

	$: borderColor = `var(--${type === 'error' ? 'text-error' : type === 'success' ? 'text-success' : type === 'warning' ? 'text-warning' : 'interactive-accent'})`;

	onMount(() => {
		startDismissTimer();
	});

	onDestroy(() => {
		clearTimeout();
	});

	afterUpdate(() => {
		if (visible) {
			startDismissTimer();
		}
	});

	function startDismissTimer() {
		clearTimeout();
		if (duration as number > 0) {
			timeoutId = setTimeout(() => {
				visible = false;
			}, duration);
		}
	}

	function clearTimeout() {
		if (timeoutId) {
			window.clearTimeout(timeoutId);
			timeoutId = null;
		}
	}

	function dismiss() {
		visible = false;
		clearTimeout();
	}

	function handleMouseEnter() {
		if (timeoutId) {
			window.clearTimeout(timeoutId);
			timeoutId = null;
		}
	}

	function handleMouseLeave() {
		if (visible && duration as number > 0) {
			startDismissTimer();
		}
	}
</script>

{#if visible}
	<div
		class="ka-toast {className}"
		class:position-top={position === 'top'}
		class:position-bottom={position === 'bottom'}
		class:position-top-left={position === 'top-left'}
		class:position-top-right={position === 'top-right'}
		class:position-bottom-left={position === 'bottom-left'}
		class:position-bottom-right={position === 'bottom-right'}
		class:type-info={type === 'info'}
		class:type-success={type === 'success'}
		class:type-warning={type === 'warning'}
		class:type-error={type === 'error'}
		style="--toast-border-color: {borderColor}"
		on:mouseenter={handleMouseEnter}
		on:mouseleave={handleMouseLeave}
		transition:fly={{ y: 50, duration: 300, opacity: 0.5 }}
		role="alert"
		aria-live="polite"
	>
		<div class="ka-toast-icon">
			<Icon name={displayIcon} size={18} />
		</div>
		<div class="ka-toast-message">{message}</div>
		{#if showCloseButton}
			<button
				class="ka-toast-close"
				on:click={dismiss}
				aria-label="Close notification"
			>
				<Icon name="x" size={14} />
			</button>
		{/if}
	</div>
{/if}

<style>
	.ka-toast {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		background-color: var(--background-primary);
		border: 1px solid var(--toast-border-color);
		border-left-width: 4px;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		color: var(--text-normal);
		font-size: 0.9rem;
		line-height: 1.4;
		max-width: 400px;
		min-height: 44px;
		position: fixed;
		z-index: 1000;
	}

	/* Position variants */
	.ka-toast.position-top,
	.ka-toast.position-top-left,
	.ka-toast.position-top-right {
		top: 1rem;
	}

	.ka-toast.position-bottom,
	.ka-toast.position-bottom-left,
	.ka-toast.position-bottom-right {
		bottom: 1rem;
	}

	.ka-toast.position-top,
	.ka-toast.position-bottom {
		left: 50%;
		transform: translateX(-50%);
	}

	.ka-toast.position-top-left,
	.ka-toast.position-bottom-left {
		left: 1rem;
	}

	.ka-toast.position-top-right,
	.ka-toast.position-bottom-right {
		right: 1rem;
	}

	.ka-toast-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
	}

	.ka-toast.type-info .ka-toast-icon {
		color: var(--interactive-accent);
	}

	.ka-toast.type-success .ka-toast-icon {
		color: var(--text-success);
	}

	.ka-toast.type-warning .ka-toast-icon {
		color: var(--text-warning);
	}

	.ka-toast.type-error .ka-toast-icon {
		color: var(--text-error);
	}

	.ka-toast-message {
		flex: 1;
		word-wrap: break-word;
		min-width: 0;
	}

	.ka-toast-close {
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		min-height: 24px;
		min-width: 24px;
		border: none;
		background: transparent;
		color: var(--text-muted);
		line-height: 1;
		cursor: pointer;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		transition: background-color 0.2s ease, color 0.2s ease;
	}

	.ka-toast-close:hover {
		background-color: var(--background-modifier-hover);
		color: var(--text-normal);
	}

	.ka-toast-close:active {
		background-color: var(--background-modifier-active);
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ka-toast {
			padding: 0.75rem 0.875rem;
			font-size: 0.85rem;
			max-width: calc(100vw - 1rem);
			left: 0.5rem !important;
			right: 0.5rem !important;
			border-radius: 6px;
		}

		.ka-toast.position-top,
		ka-toast.position-bottom {
			left: 0.5rem;
			transform: none;
		}
	}
</style>
