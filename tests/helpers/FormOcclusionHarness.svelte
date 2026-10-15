<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Component, type App } from 'obsidian';
	import { setAppContext } from '@/ui/context/AppContext';
	import OcclusionForm from '@/ui/components/modals/FlashcardFormModal/Content/Occlusion/component.svelte';
	import type { BuildContentFn, ValidateFn } from '@/ui/components/modals/FlashcardFormModal/Content/types';

	let {
		app,
		mode = 'create',
		initialContent,
		disabled = false,
		onRegister,
	}: {
		app: App;
		mode?: 'create' | 'edit';
		initialContent?: unknown;
		disabled?: boolean;
		onRegister: (api: { validate: ValidateFn; buildContent: BuildContentFn }) => void;
	} = $props();

	const owner = new Component();
	owner.load();
	setAppContext({ app, component: owner });

	onDestroy(() => {
		owner.unload();
	});
</script>

<OcclusionForm {mode} {initialContent} {disabled} {onRegister} />
