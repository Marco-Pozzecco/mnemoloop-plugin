<script lang="ts">
	import { cn } from '@/ui/components/utils';
	import type AlertDialogFooterProps from './types';

	let { children, class: className }: AlertDialogFooterProps = $props();
</script>

<div class={cn('ml-alert-dialog__footer', className)}>
	{@render children?.()}
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-alert-dialog__footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: $spacing-sm;
		margin-top: $spacing-lg;
	}

	@media (max-width: 480px) {
		.ml-alert-dialog__footer {
			justify-content: stretch;
		}

		:global(.ml-alert-dialog__footer > *) {
			flex: 1 1 0;
		}
	}
</style>
