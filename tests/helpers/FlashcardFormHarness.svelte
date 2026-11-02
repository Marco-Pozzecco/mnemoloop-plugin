<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Component } from 'obsidian';
	import type { App } from 'obsidian';
	import FlashcardFormInline from '@/ui/components/views/Sidebar/Flashcard/Form/component.svelte';
	import type FlashcardFormInlineProps from '@/ui/components/views/Sidebar/Flashcard/Form/types';
	import { setAppContext } from '@/ui/context/AppContext';

	let { app, mode, card, prefillSource, onSaved, onCancel }: {
		app: App;
	} & FlashcardFormInlineProps = $props();

	// The Occlusion content reads the vault through the app context. The form
	// itself takes no App and no modal store; this is the host's wiring.
	const owner = new Component();
	owner.load();
	// The harness mounts once with fixed props.
	// svelte-ignore state_referenced_locally
	setAppContext({ app, component: owner });

	onDestroy(() => {
		owner.unload();
	});
</script>

<FlashcardFormInline {mode} {card} {prefillSource} {onSaved} {onCancel} />
