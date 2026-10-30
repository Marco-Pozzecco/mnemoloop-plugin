<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Component } from 'obsidian';
	import type { App } from 'obsidian';
	import FlashcardFormModal from '@/ui/components/modals/FlashcardFormModal/component.svelte';
	import type { ModalController } from '@/ui/controllers/ModalController';
	import { setAppContext } from '@/ui/context/AppContext';

	let { app, controller }: { app: App; controller: ModalController } = $props();

	const owner = new Component();
	owner.load();
	setAppContext({ app, component: owner });

	onDestroy(() => {
		owner.unload();
	});
</script>

<FlashcardFormModal {controller} />
