<script lang="ts">
	import { onMount } from 'svelte';
	import ErrorWrapper from '../../components/common/ErrorWrapper.svelte';
	import Settings from '../../settings/Settings.svelte';
	import type { ISettingsManager } from '@/obsidian/contracts/ISettingsManager';
	import type KnowledgeAcceleratorPlugin from '@/main';

	interface Props {
		app: any;
		plugin: KnowledgeAcceleratorPlugin;
		settingsManager: ISettingsManager;
		initialSettings: any;
		onSettingsSaved?: () => void;
		onSettingsReset?: () => void;
	}

	let {
		app,
		plugin,
		settingsManager,
		initialSettings,
		onSettingsSaved,
		onSettingsReset,
	}: Props = $props();

	let saveError = $state<Error | null>(null);
	let retryCount = $state(0);
	const MAX_RETRIES = 3;

	async function handleSaveWithRetry(settings: any): Promise<void> {
		if (retryCount >= MAX_RETRIES) {
			saveError = new Error('Maximum save attempts exceeded. Please reload and try again.');
			return;
		}

		try {
			saveError = null;

			// Try to save settings
			await settingsManager.saveSettings(settings);

			// Success
			onSettingsSaved?.();
			retryCount = 0;
		} catch (error) {
			saveError = error instanceof Error ? error : new Error(String(error));
			retryCount++;

			// Preserve user input - we have the settings object that was attempted
			if (retryCount >= MAX_RETRIES) {
				saveError = new Error(
					`Failed to save settings after ${MAX_RETRIES} attempts: ${saveError.message}. Check your connection and reload to try again.`
				);
			}
		}
	}

	function handleRetry(): void {
		// Reset retry count to allow another attempt
		if (retryCount < MAX_RETRIES) {
			retryCount = 0;
			saveError = null;
		}
	}

	async function handleResetWithRetry(): Promise<void> {
		if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
			return;
		}

		try {
			await settingsManager.resetSettings();
			saveError = null;
			retryCount = 0;
			onSettingsReset?.();
		} catch (error) {
			saveError = error instanceof Error ? error : new Error(String(error));
			retryCount++;
		}
	}

	// Clear error on component mount
	onMount(() => {
		saveError = null;
		retryCount = 0;
	});
</script>

{#if saveError}
	<div class="ka-settings-error-banner" role="alert" aria-live="assertive">
		<div class="ka-settings-error-banner__content">
			<div class="ka-settings-error-banner__icon">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="12" y1="8" x2="12" y2="12"></line>
					<line x1="12" y1="16" x2="12.01" y2="16"></line>
				</svg>
			</div>
			<div class="ka-settings-error-banner__message">
				<strong>Failed to save settings</strong>
				<span>{saveError.message}</span>
			</div>
			{#if retryCount < MAX_RETRIES}
				<button class="ka-settings-error-banner__retry" on:click={handleRetry} aria-label="Retry saving settings">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M23 4v6h-6"></path>
						<path d="M1 20v-6h6"></path>
						<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
					</svg>
					Retry
				</button>
			{:else}
				<button class="ka-settings-error-banner__reload" on:click={() => window.location.reload()} aria-label="Reload page">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M1 4v6h6"></path>
						<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
						<path d="M23 20v-6h-6"></path>
						<path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
					</svg>
					Reload Page
				</button>
			{/if}
		</div>
	</div>
{/if}

<ErrorWrapper
	fallback={saveError ? saveError.message : 'Unable to load settings'}
	onRetry={handleRetry}
	showError={false}
	maxRetries={MAX_RETRIES}
	errorContext="SettingsView"
>
	<Settings
		{app}
		{plugin}
		{settingsManager}
		initialSettings={initialSettings}
	/>
</ErrorWrapper>

<style>
	.ka-settings-error-banner {
		background-color: var(--background-modifier-error-hover);
		border: 1px solid var(--text-error);
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 24px;
		display: flex;
		align-items: center;
		animation: ka-slide-down 0.3s ease-out;
	}

	@keyframes ka-slide-down {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.ka-settings-error-banner__content {
		display: flex;
		align-items: center;
		gap: 16px;
		width: 100%;
	}

	.ka-settings-error-banner__icon {
		color: var(--text-error);
		flex-shrink: 0;
		display: flex;
		align-items: center;
	}

	.ka-settings-error-banner__message {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.ka-settings-error-banner__message strong {
		font-size: var(--font-ui-small);
		font-weight: var(--font-semibold);
		color: var(--text-error);
	}

	.ka-settings-error-banner__message span {
		font-size: var(--font-ui-smaller);
		color: var(--text-muted);
	}

	.ka-settings-error-banner__retry,
	.ka-settings-error-banner__reload {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		background-color: var(--interactive-accent);
		color: var(--text-on-accent);
		border: none;
		border-radius: 6px;
		font-size: var(--font-ui-smaller);
		font-weight: var(--font-medium);
		cursor: pointer;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.ka-settings-error-banner__retry:hover,
	.ka-settings-error-banner__reload:hover {
		background-color: var(--interactive-accent-hover);
		transform: translateY(-1px);
	}

	.ka-settings-error-banner__reload {
		background-color: var(--background-modifier-border);
		color: var(--text-normal);
	}

	.ka-settings-error-banner__reload:hover {
		background-color: var(--background-modifier-border-hover);
	}
</style>
