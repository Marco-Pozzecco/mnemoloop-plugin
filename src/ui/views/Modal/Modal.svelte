<script lang="ts">
	import { FlashcardModal, ModalControls } from '@/ui/components/';
	import { modalStore, ModalViewEnum } from '@/ui/store/modal.store';
	import { type ModalProps } from './types';

	let { controller }: ModalProps = $props();

	let { currentView, error, isLoading } = $derived(modalStore.state);
</script>

<div class="ka-modal-container">
	{#if currentView === ModalViewEnum.flashcard}
		<FlashcardModal {controller} {isLoading} {error} />
	{/if}
	<ModalControls {controller} />
</div>

<style>
	.ka-modal-container {
		min-width: 450px;
		max-width: 600px;
		background: var(--background-primary);
		color: var(--text-normal);
		border-radius: var(--radius-m);
	}
</style>
