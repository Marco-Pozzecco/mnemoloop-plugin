<script lang="ts">
	import { FlashcardFormInline } from '@/ui/components/compositions';
	import { getAppContext } from '@/ui/context/AppContext';
	import { modalStore } from '@/ui/store/modal.store';
	import type { FlashcardFormModalData } from './types';
	import type FlashcardFormModalProps from './types';

	let { controller }: FlashcardFormModalProps = $props();
	const { app } = getAppContext();

	// `modalStore.state` is a plain field, so it never invalidates a rune. Subscribe
	// to the writable the store manager wraps instead.
	const storeRef = modalStore.store;
	const data = $derived($storeRef.data as FlashcardFormModalData | undefined);
	const mode = $derived(data?.mode ?? 'create');

	function handleSaved(filepath: string): void {
		// The modal keeps its long-standing behavior: open the card that was just
		// written, then close. The sidebar panel, which never navigates, does not
		// use this wrapper.
		app.workspace.openLinkText(filepath, '', false);
		controller.onClose();
	}

	function handleCancel(): void {
		controller.onClose();
	}
</script>

<h2 class="ml-form-modal-title">
	{mode === 'edit' ? 'Edit flashcard' : 'Create flashcard'}
</h2>

<FlashcardFormInline
	{mode}
	card={data?.card}
	prefillSource={data?.prefillSource}
	onSaved={handleSaved}
	onCancel={handleCancel}
/>

<style lang="scss">
	@use 'tokens' as *;

	.ml-form-modal-title {
		margin: 0 0 $spacing-md;
		font-size: $font-lg;
	}
</style>
