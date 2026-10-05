<script lang="ts">
	import { Component } from 'obsidian';
	import App from '@/ui/views/App/App.svelte';
	import { SettingsView } from '@/ui/views/Settings/SettingsView';
	import type { RealStack } from '../tests/helpers/real-stack';
	import { FIXTURE_NAMES, type PlaygroundFixture } from './fixtures';
	import {
		applyTheme,
		PLAYGROUND_VIEWS,
		updateParams,
		type PlaygroundParams,
		type PlaygroundTheme,
	} from './routes';

	let {
		stack,
		fixture,
		params,
	}: { stack: RealStack; fixture: PlaygroundFixture; params: PlaygroundParams } = $props();

	const app = stack.plugin.app;
	const component = new Component();
	component.load();

	let settingsHost: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (params.view !== 'settings' || !settingsHost) return;
		const view = new SettingsView(stack.plugin);
		settingsHost.appendChild(view.containerEl);
		view.display();
		return () => view.destroy();
	});

	function selectValue(event: Event): string {
		return (event.currentTarget as HTMLSelectElement).value;
	}

	function navigate(key: 'view' | 'fixture' | 'modal', value: string): void {
		updateParams({ [key]: value || null }, { reload: true });
	}

	function changeTheme(value: string): void {
		applyTheme(value as PlaygroundTheme);
		updateParams({ theme: value });
	}
</script>

<header class="ml-playground-toolbar">
	<span class="ml-playground-toolbar__title">Mnemoloop playground</span>
	<label class="ml-playground-toolbar__field">
		View
		<select value={params.view} onchange={(event) => navigate('view', selectValue(event))}>
			{#each PLAYGROUND_VIEWS as view (view)}
				<option value={view}>{view}</option>
			{/each}
		</select>
	</label>
	<label class="ml-playground-toolbar__field">
		Fixture
		<select
			value={fixture.name}
			onchange={(event) => navigate('fixture', selectValue(event))}
		>
			{#each FIXTURE_NAMES as name (name)}
				<option value={name}>{name}</option>
			{/each}
		</select>
	</label>
	<label class="ml-playground-toolbar__field">
		Theme
		<select value={params.theme} onchange={(event) => changeTheme(selectValue(event))}>
			<option value="light">light</option>
			<option value="dark">dark</option>
		</select>
	</label>
	<label class="ml-playground-toolbar__field">
		Modal
		<select
			value={params.modal ?? ''}
			onchange={(event) => navigate('modal', selectValue(event))}
		>
			<option value="">none</option>
			<option value="flashcard-form">flashcard form</option>
		</select>
	</label>
	<span class="ml-playground-toolbar__meta">{fixture.description}</span>
</header>

<main class="ml-playground-stage">
	{#if params.view === 'settings'}
		<div class="ml-playground-settings-host" bind:this={settingsHost}></div>
	{:else}
		<div class="ml-playground-app-host">
			<App {app} {component} />
		</div>
	{/if}
</main>

<style lang="scss">
	@use 'tokens' as *;

	.ml-playground-toolbar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: $spacing-md;
		padding: $spacing-sm $spacing-md;
		background: var(--background-secondary);
		border-bottom: 1px solid var(--background-modifier-border);
		font-family: var(--font-interface);
		font-size: var(--font-ui-small);
		color: var(--text-normal);
	}

	.ml-playground-toolbar__title {
		font-weight: var(--font-semibold);
	}

	.ml-playground-toolbar__field {
		display: inline-flex;
		align-items: center;
		gap: $spacing-xs;
		color: var(--text-muted);
	}

	.ml-playground-toolbar__meta {
		margin-left: auto;
		color: var(--text-faint);
	}

	.ml-playground-stage {
		flex: 1;
		min-height: 0;
		display: flex;
	}

	.ml-playground-app-host,
	.ml-playground-settings-host {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}
</style>
