<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Component, type App } from 'obsidian';
	import { setAppContext } from '@/ui/context/AppContext';
	import FlashcardFormModal from '@/ui/components/modals/FlashcardFormModal/component.svelte';
	import { modalStore } from '@/ui/store/modal.store';
	import type { ModalController } from '@/ui/controllers/ModalController';

	let {
		app,
		controller,
	}: {
		app: App;
		controller: ModalController;
	} = $props();

	const owner = new Component();
	owner.load();
	setAppContext({ app, component: owner });

	const storeRef = modalStore.store;

	const error = $derived($storeRef.error);
	const isLoading = $derived($storeRef.isLoading);

	onDestroy(() => {
		owner.unload();
	});
</script>

<FlashcardFormModal {controller} {isLoading} {error} />
