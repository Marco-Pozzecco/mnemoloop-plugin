<script lang="ts">
	import { AlertDialog } from 'bits-ui';
	import type AlertDialogDescriptionProps from './types';

	let { class: className = '', children, ...rest }: AlertDialogDescriptionProps = $props();
</script>

<AlertDialog.Description {...rest} class="ml-alert-dialog__description {className}">
	{@render children?.()}
</AlertDialog.Description>

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-alert-dialog__description) {
		margin: 0;
		margin-top: $spacing-xs;
		color: $text-muted;
		line-height: $line-height-normal;
	}
</style>
