<script lang="ts">
	import { FlashcardFormModal, ModalControls } from '@/ui/components/';
	import { modalStore, ModalViewEnum } from '@/ui/store/modal.store';
	import { setAppContext } from '@/ui/context/AppContext';
	import { type ModalProps } from './types';

	let { controller, app, component }: ModalProps = $props();

	let { currentView, error, isLoading } = $derived(modalStore.state);

	let cApp = $derived(app);
	let cComponent = $derived(component);

	setAppContext({ app: cApp, component: cComponent });
</script>

<div class="ml-modal-container">
	{#if currentView === ModalViewEnum.flashcard}
		<FlashcardFormModal {controller} {isLoading} {error} />
	{/if}
	<ModalControls {controller} />
</div>

<style lang="scss">
	@use 'tokens' as *;

	.ml-modal-container {
		background: $background-primary;
		color: $text-normal;
		border-radius: $radius-md;
	}
</style>
