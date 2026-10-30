<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Component } from 'obsidian';
	import type { App } from 'obsidian';
	import FlashcardForm from '@/ui/components/sections/FlashcardForm/component.svelte';
	import type FlashcardFormProps from '@/ui/components/sections/FlashcardForm/types';
	import { setAppContext } from '@/ui/context/AppContext';

	let { app, mode, card, prefillSource, onSaved, onCancel }: {
		app: App;
	} & FlashcardFormProps = $props();

	// The Occlusion content reads the vault through the app context. The form
	// itself takes no App and no modal store; this is the host's wiring.
	const owner = new Component();
	owner.load();
	setAppContext({ app, component: owner });

	onDestroy(() => {
		owner.unload();
	});
</script>

<FlashcardForm {mode} {card} {prefillSource} {onSaved} {onCancel} />
