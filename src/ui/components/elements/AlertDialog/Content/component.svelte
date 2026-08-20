<script lang="ts">
	import { AlertDialog } from 'bits-ui';
	import type AlertDialogContentProps from './types';

	let { class: className = '', children, ...rest }: AlertDialogContentProps = $props();
</script>

<AlertDialog.Content {...rest} class="ml-alert-dialog__content {className}">
	{@render children?.()}
</AlertDialog.Content>

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-alert-dialog__content) {
		position: fixed;
		top: 50%;
		left: 50%;
		z-index: $z-modal;
		width: min(26rem, calc(100vw - #{$spacing-xl}));
		max-height: calc(100vh - #{$spacing-xl});
		overflow-y: auto;
		padding: $spacing-lg;
		transform: translate(-50%, -50%);
		transform-origin: center;
		color: $text-normal;
		background-color: $background-primary;
		border: $border-width solid $background-modifier-border;
		border-radius: $radius-lg;
		box-shadow: $shadow-md;
		transition:
			opacity $transition-fast,
			transform $transition-fast;
	}

	:global(.ml-alert-dialog__content[data-state='open']) {
		opacity: 1;
		transform: translate(-50%, -50%) scale(1);
	}

	:global(.ml-alert-dialog__content[data-state='closed']) {
		opacity: 0;
		transform: translate(-50%, -48%) scale(0.98);
		pointer-events: none;
	}

	:global(.ml-alert-dialog__content:focus-visible) {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.ml-alert-dialog__content) {
			transition: none;
		}
	}

	@media (max-width: 480px) {
		:global(.ml-alert-dialog__content) {
			width: min(calc(100vw - #{$spacing-md}), 26rem);
			padding: $spacing-md;
		}
	}
</style>
