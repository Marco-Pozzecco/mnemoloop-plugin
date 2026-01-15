<script lang="ts">
  import { get } from 'svelte/store';
  import type { SettingsStore } from '@/ui/stores/SettingsStore';
  import TextSetting from '../components/TextSetting.svelte';
  import NumberSetting from '../components/NumberSetting.svelte';
  import ToggleSetting from '../components/ToggleSetting.svelte';

  export let store: SettingsStore;

  $: settings = $store?.settings;

  function handleUpdate(key: string, value: unknown) {
    if (!store) return;

    const isValid = store.validateSetting(key as any, value);
    if (isValid) {
      store.setPendingChanges({ [key]: value } as any);
    }
  }
</script>

<div class="ka-section">
  <div class="ka-section__header">
    <h2 class="ka-section__title">Review Settings</h2>
    <p class="ka-section__description">
      Configure review behavior and card management
    </p>
  </div>

  <div class="ka-section__settings">
    <TextSetting
      label="Flashcards Directory"
      description="The default directory for flashcard files"
      value={settings.flashcardsDirectory}
      placeholder="/flashcards/"
      on:update={(value) => handleUpdate('flashcardsDirectory', value)}
      validationError={$store.validationErrors.flashcardsDirectory}
    />

    <NumberSetting
      label="Debounce Timeout"
      description="Milliseconds to wait before processing file changes"
      value={settings.debounceTimeoutMs}
      min={100}
      max={5000}
      step={100}
      on:update={(value) => handleUpdate('debounceTimeoutMs', value)}
      validationError={$store.validationErrors.debounceTimeoutMs}
    />

    <ToggleSetting
      label="Enable Soft Delete"
      description="Move deleted cards to trash instead of permanent deletion"
      checked={settings.enableSoftDelete}
      on:update={(value) => handleUpdate('enableSoftDelete', value)}
      validationError={$store.validationErrors.enableSoftDelete}
    />

    {#if settings.enableSoftDelete}
      <NumberSetting
        label="Soft Delete Duration"
        description="Hours before soft-deleted cards are permanently removed"
        value={settings.softDeleteHours}
        min={1}
        max={168}
        step={1}
        on:update={(value) => handleUpdate('softDeleteHours', value)}
        validationError={$store.validationErrors.softDeleteHours}
      />
    {/if}
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
</style>
