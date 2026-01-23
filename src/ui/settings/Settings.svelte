<script lang="ts">
  import type { SettingsManager } from '@/obsidian/SettingsManager';
  import type { IPluginSettings } from '@/obsidian/contracts/ISettingsManager';
  import { Button, Icon } from '@/ui/components/common';
  import { SettingsStore } from '@/ui/stores/SettingsStore';
  import { Notice } from 'obsidian';
  import { onMount } from 'svelte';
  import AdvancedSettings from './sections/AdvancedSettings.svelte';
  import ReviewSettings from './sections/ReviewSettings.svelte';
  import WatchingSettings from './sections/WatchingSettings.svelte';
  import { type SettingsSectionKey } from './types';

  export let settingsManager: SettingsManager;
  export let initialSettings: IPluginSettings;

  let store: SettingsStore;
  let activeSection: SettingsSectionKey = 'FILE_WATCHING';
  let isSaving = false;
  let errorMessage = '';

  onMount(() => {
    store = new SettingsStore({ settingsManager });
  });

  $: currentSettings = $store?.settings || initialSettings;
  $: hasChanges = $store?.hasChanges || false;
  $: isLoading = $store?.isLoading || false;
  $: validationErrors = $store?.validationErrors || {};

  async function handleSave() {
    if (!store || isSaving) return;

    isSaving = true;
    errorMessage = '';

    try {
      await store.updateSettings(currentSettings);
      new Notice('Settings saved successfully!');
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      new Notice(errorMessage, 5000);
    } finally {
      isSaving = false;
    }
  }

  async function handleReset() {
    if (!store) return;

    if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      return;
    }

    try {
      await store.resetToDefaults();
      new Notice('Settings reset to defaults');
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to reset settings';
      new Notice(errorMessage, 5000);
    }
  }

  function handleDiscard() {
    if (!store) return;

    store.discardChanges();
    new Notice('Changes discarded');
  }

  function handleSectionChange(section: SettingsSectionKey) {
    activeSection = section;
  }
</script>

<div class="ka-settings">
  <header class="ka-settings__header">
    <div class="ka-settings__header-content">
      <h1 class="ka-settings__title">Knowledge Accelerator Settings</h1>
      <p class="ka-settings__subtitle">Configure your spaced repetition experience</p>
    </div>
  </header>

  {#if errorMessage}
    <div class="ka-settings__error" role="alert">
      <Icon name="alert-circle" size={20} />
      <span>{errorMessage}</span>
    </div>
  {/if}

  <div class="ka-settings__layout">
    <nav class="ka-settings__nav">
      <button
        class="ka-settings__nav-item"
        class:active={activeSection === 'FILE_WATCHING'}
        on:click={() => handleSectionChange('FILE_WATCHING')}
        aria-pressed={activeSection === 'FILE_WATCHING'}
      >
        <Icon name="folder" size={16} />
        <span>File Watching</span>
      </button>
      <button
        class="ka-settings__nav-item"
        class:active={activeSection === 'REVIEW'}
        on:click={() => handleSectionChange('REVIEW')}
        aria-pressed={activeSection === 'REVIEW'}
      >
        <Icon name="layers" size={16} />
        <span>Review</span>
      </button>
      <button
        class="ka-settings__nav-item"
        class:active={activeSection === 'ADVANCED'}
        on:click={() => handleSectionChange('ADVANCED')}
        aria-pressed={activeSection === 'ADVANCED'}
      >
        <Icon name="settings-2" size={16} />
        <span>Advanced</span>
      </button>
    </nav>

    <main class="ka-settings__content">
      {#if store}
        <div class="ka-settings__section">
          {#if activeSection === 'FILE_WATCHING'}
            <WatchingSettings {store} />
          {:else if activeSection === 'REVIEW'}
            <ReviewSettings {store} />
          {:else if activeSection === 'ADVANCED'}
            <AdvancedSettings {store} />
          {/if}
        </div>
      {/if}
    </main>
  </div>

  <footer class="ka-settings__footer">
    <div class="ka-settings__status">
      {#if hasChanges}
        <span class="ka-settings__status-indicator">Unsaved changes</span>
      {:else}
        <span class="ka-settings__status-indicator ka-settings__status-indicator--saved">All changes saved</span>
      {/if}
    </div>
    <div class="ka-settings__actions">
      <Button
        variant="secondary"
        on:click={handleDiscard}
        disabled={!hasChanges || isSaving || isLoading}
      >
        Discard
      </Button>
      <Button
        variant="secondary"
        on:click={handleReset}
        disabled={isSaving || isLoading}
      >
        Reset to Defaults
      </Button>
      <Button
        variant="primary"
        on:click={handleSave}
        disabled={!hasChanges || isSaving || isLoading}
      >
        {#if isSaving}
          <Icon name="loader-2" class="ka-spin" size={16} />
          Saving...
        {:else}
          <Icon name="save" size={16} />
          Save Changes
        {/if}
      </Button>
    </div>
  </footer>
</div>

<style>
  .ka-settings {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .ka-settings__header {
    border-bottom: 1px solid var(--background-modifier-border);
    padding-bottom: 24px;
  }

  .ka-settings__header-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ka-settings__title {
    margin: 0;
    font-size: var(--font-ui-larger);
    font-weight: var(--font-bold);
    color: var(--text-normal);
  }

  .ka-settings__subtitle {
    margin: 0;
    color: var(--text-muted);
    font-size: var(--font-ui-small);
  }

  .ka-settings__error {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background-color: var(--background-modifier-error-hover);
    border: 1px solid var(--text-error);
    border-radius: 8px;
    color: var(--text-error);
  }

  .ka-settings__layout {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 32px;
    align-items: start;
  }

  .ka-settings__nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
    position: sticky;
    top: 24px;
  }

  .ka-settings__nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: none;
    border: none;
    border-radius: 8px;
    color: var(--text-muted);
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    width: 100%;
  }

  .ka-settings__nav-item:hover {
    background-color: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .ka-settings__nav-item.active {
    background-color: var(--background-modifier-border-focus);
    color: var(--interactive-accent);
    font-weight: var(--font-semibold);
  }

  .ka-settings__content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .ka-settings__section {
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 12px;
    padding: 24px;
  }

  .ka-settings__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 24px;
    border-top: 1px solid var(--background-modifier-border);
    gap: 16px;
  }

  .ka-settings__status {
    display: flex;
    align-items: center;
  }

  .ka-settings__status-indicator {
    font-size: var(--font-ui-small);
    color: var(--text-warning);
    font-weight: var(--font-medium);
  }

  .ka-settings__status-indicator--saved {
    color: var(--text-success);
  }

  .ka-settings__actions {
    display: flex;
    gap: 12px;
  }

  :global(.ka-spin) {
    animation: ka-spin 1s linear infinite;
  }

  @keyframes ka-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .ka-settings__layout {
      grid-template-columns: 1fr;
    }

    .ka-settings__nav {
      flex-direction: row;
      flex-wrap: wrap;
      position: static;
    }

    .ka-settings__nav-item {
      flex: 1;
      min-width: 120px;
      justify-content: center;
    }

    .ka-settings__footer {
      flex-direction: column;
      align-items: stretch;
    }

    .ka-settings__actions {
      flex-direction: column;
    }

    .ka-settings__actions :global(.ka-button) {
      width: 100%;
    }
  }
</style>
