<script lang="ts">
	import { AlertDialog } from 'bits-ui';
	import type AlertDialogTitleProps from './types';

	let { class: className = '', children, ...rest }: AlertDialogTitleProps = $props();
</script>

<AlertDialog.Title {...rest} class="ml-alert-dialog__title {className}">
	{@render children?.()}
</AlertDialog.Title>

<style lang="scss">
	@use 'tokens' as *;

	:global(.ml-alert-dialog__title) {
		margin: 0;
		font-size: $font-lg;
		font-weight: $font-semibold;
		line-height: 1.2;
	}
</style>
