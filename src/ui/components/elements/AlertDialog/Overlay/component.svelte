<script lang="ts">
	import { AlertDialog } from 'bits-ui';
	import type AlertDialogOverlayProps from './types';

	let { class: className = '', children, ...rest }: AlertDialogOverlayProps = $props();
</script>

<AlertDialog.Overlay {...rest} class="ml-alert-dialog__overlay {className}">
	{@render children?.()}
</AlertDialog.Overlay>

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-alert-dialog__overlay) {
		position: fixed;
		inset: 0;
		z-index: $z-modal;
		background-color: $background-primary;
		transition: opacity $transition-fast;
	}

	:global(.ml-alert-dialog__overlay[data-state='open']) {
		opacity: 0.72;
	}

	:global(.ml-alert-dialog__overlay[data-state='closed']) {
		opacity: 0;
		pointer-events: none;
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.ml-alert-dialog__overlay) {
			transition: none;
		}
	}
</style>
