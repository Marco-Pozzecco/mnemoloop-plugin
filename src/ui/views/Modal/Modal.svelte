<script lang="ts">
	import { FlashcardModal } from '@/ui/components/';
	import { modalStore, ModalViewEnum } from '@/ui/store/modal.store';
	import { ModalProps } from './types';

	let { controller }: ModalProps = $props();

	let { currentView, error, isLoading, data } = $derived(modalStore.state);
</script>

<div class="ka-modal-container">
	{#if currentView === ModalViewEnum.flashcard}
		<FlashcardModal {controller} {isLoading} {error} initialData={data} />
	{/if}
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
