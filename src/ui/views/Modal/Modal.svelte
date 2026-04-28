<script lang="ts">
	import { FlashcardModal, ModalControls } from '@/ui/components/';
	import { modalStore, ModalViewEnum } from '@/ui/store/modal.store';
	import { setAppContext } from '@/ui/context/AppContext';
	import { type ModalProps } from './types';

	let { controller, app, component }: ModalProps = $props();

	let { currentView, error, isLoading } = $derived(modalStore.state);

	let cApp = $derived(app);
	let cComponent = $derived(component);

	setAppContext({ app: cApp, component: cComponent });
</script>

<div class="ka-modal-container">
	{#if currentView === ModalViewEnum.flashcard}
		<FlashcardModal {controller} {isLoading} {error} />
	{/if}
	<ModalControls {controller} />
</div>

<style>
	.ka-modal-container {
		background: var(--background-primary);
		color: var(--text-normal);
		border-radius: var(--radius-m);
	}
</style>
