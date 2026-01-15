<script lang="ts">
  import { get } from 'svelte/store';
  import type { SettingsStore } from '@/ui/stores/SettingsStore';
  import TextSetting from '../components/TextSetting.svelte';
  import ArraySetting from '../components/ArraySetting.svelte';
  import { Button, Icon } from '@/ui/components/common';
  import { Notice } from 'obsidian';

  export let store: SettingsStore;

  $: settings = $store?.settings;

  function handleUpdate(key: string, value: unknown) {
    if (!store) return;

    const isValid = store.validateSetting(key as any, value);
    if (isValid) {
      store.setPendingChanges({ [key]: value } as any);
    }
  }

  function handleShortcutAdd(commandId: string, shortcut: string) {
    if (!store || !shortcut) return;

    const newShortcuts = {
      ...settings.commandShortcuts,
      [commandId]: shortcut,
    };

    handleUpdate('commandShortcuts', newShortcuts);
  }

  function handleShortcutRemove(commandId: string) {
    if (!store) return;

    const newShortcuts = { ...settings.commandShortcuts };
    delete newShortcuts[commandId];

    handleUpdate('commandShortcuts', newShortcuts);
  }

  function handleExportSettings() {
    const settingsJson = JSON.stringify(settings, null, 2);
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'knowledge-accelerator-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    new Notice('Settings exported successfully');
  }

  function handleImportSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedSettings = JSON.parse(text);

        if (store) {
          await store.updateSettings(importedSettings);
          new Notice('Settings imported successfully');
        }
      } catch (error) {
        new Notice('Failed to import settings: Invalid file format', 5000);
      }
    };

    input.click();
  }

  const commonCommands = [
    { id: 'ka-start-review', label: 'Start Review' },
    { id: 'ka-open-dashboard', label: 'Open Dashboard' },
    { id: 'open-settings', label: 'Open Settings' },
  ];
</script>

<div class="ka-section">
  <div class="ka-section__header">
    <h2 class="ka-section__title">Advanced</h2>
    <p class="ka-section__description">
      Advanced configuration and data management
    </p>
  </div>

  <div class="ka-section__settings">
    <div class="ka-setting-group">
      <h3 class="ka-setting-group__title">Command Shortcuts</h3>
      <p class="ka-setting-group__description">
        Customize keyboard shortcuts for plugin commands
      </p>

      {#each commonCommands as command}
        <div class="ka-shortcut-setting">
          <div class="ka-shortcut-setting__info">
            <span class="ka-shortcut-setting__label">{command.label}</span>
            <span class="ka-shortcut-setting__id">{command.id}</span>
          </div>
          <div class="ka-shortcut-setting__input">
            <input
              type="text"
              value={settings.commandShortcuts[command.id] || ''}
              placeholder="None"
              on:change={(e) =>
                e.target.value
                  ? handleShortcutAdd(command.id, e.target.value)
                  : handleShortcutRemove(command.id)
              }
              on:keydown={(e) => {
                if (e.key === 'Enter') {
                  e.target.blur();
                }
              }}
            />
          </div>
        </div>
      {/each}
    </div>

    <div class="ka-setting-group">
      <h3 class="ka-setting-group__title">Data Management</h3>
      <p class="ka-setting-group__description">
        Export and import your plugin settings
      </p>

      <div class="ka-data-actions">
        <Button
          variant="secondary"
          on:click={handleExportSettings}
        >
          <Icon name="download" size={16} />
          Export Settings
        </Button>
        <Button
          variant="secondary"
          on:click={handleImportSettings}
        >
          <Icon name="upload" size={16} />
          Import Settings
        </Button>
      </div>
    </div>

    <div class="ka-setting-group">
      <h3 class="ka-setting-group__title">Debug Information</h3>
      <p class="ka-setting-group__description">
        Current settings configuration (read-only)
      </p>

      <pre class="ka-settings-debug">{JSON.stringify(settings, null, 2)}</pre>
    </div>
  </div>
</div>

<style>
  .ka-section {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .ka-section__header {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .ka-section__title {
    margin: 0;
    font-size: var(--font-ui-larger);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
  }

  .ka-section__description {
    margin: 0;
    font-size: var(--font-ui-small);
    color: var(--text-muted);
    line-height: 1.5;
  }

  .ka-section__settings {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .ka-setting-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
  }

  .ka-setting-group__title {
    margin: 0;
    font-size: var(--font-ui-medium);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
  }

  .ka-setting-group__description {
    margin: 0;
    font-size: var(--font-ui-small);
    color: var(--text-muted);
  }

  .ka-shortcut-setting {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding: 12px;
    background-color: var(--background-secondary);
    border-radius: 6px;
  }

  .ka-shortcut-setting__info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ka-shortcut-setting__label {
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    color: var(--text-normal);
  }

  .ka-shortcut-setting__id {
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    font-family: var(--font-monospace);
  }

  .ka-shortcut-setting__input input {
    min-width: 200px;
    padding: 8px 12px;
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    font-family: var(--font-monospace);
  }

  .ka-shortcut-setting__input input:focus {
    outline: none;
    border-color: var(--interactive-accent);
  }

  .ka-data-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .ka-settings-debug {
    padding: 16px;
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    overflow: auto;
    max-height: 400px;
    font-size: var(--font-ui-smaller);
    font-family: var(--font-monospace);
    color: var(--text-muted);
  }

  @media (max-width: 480px) {
    .ka-shortcut-setting {
      flex-direction: column;
      align-items: stretch;
    }

    .ka-shortcut-setting__input input {
      min-width: 100%;
    }
  }
</style>
