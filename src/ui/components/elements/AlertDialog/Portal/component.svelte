<script lang="ts">
	import { AlertDialog } from 'bits-ui';
	import type AlertDialogPortalProps from './types';

	// Keep the primitive inline by default so server-rendered dialogs retain their content.
	let { disabled = true, to, children }: AlertDialogPortalProps = $props();
</script>

<AlertDialog.Portal {to} {disabled}>
	{@render children?.()}
</AlertDialog.Portal>
