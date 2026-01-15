<script lang="ts">
  import { get } from 'svelte/store';
  import type { SettingsStore } from '@/ui/stores/SettingsStore';
  import { Button, Icon } from '@/ui/components/common';
  import TextSetting from '../components/TextSetting.svelte';
  import ArraySetting from '../components/ArraySetting.svelte';
  import TagSetting from '../components/TagSetting.svelte';

  export let store: SettingsStore;

  $: settings = $store?.settings;

  function handleUpdate(key: string, value: unknown) {
    if (!store) return;

    const isValid = store.validateSetting(key as any, value);
    if (isValid) {
      store.setPendingChanges({ [key]: value } as any);
    }
  }

  function handleArrayAdd(key: string, value: string) {
    if (!store || !value) return;

    const currentArray = settings[key as keyof typeof settings] as string[];
    const newArray = [...currentArray, value];

    handleUpdate(key, newArray);
  }

  function handleArrayRemove(key: string, index: number) {
    if (!store) return;

    const currentArray = settings[key as keyof typeof settings] as string[];
    const newArray = currentArray.filter((_, i) => i !== index);

    handleUpdate(key, newArray);
  }
</script>

<div class="ka-section">
  <div class="ka-section__header">
    <h2 class="ka-section__title">File Watching</h2>
    <p class="ka-section__description">
      Configure which directories and tags the plugin watches for flashcard changes
    </p>
  </div>

  <div class="ka-section__settings">
    <TextSetting
      label="Flashcards Directory"
      description="The directory where flashcards are stored"
      value={settings.flashcardsDirectory}
      placeholder="/flashcards/"
      on:update={(value) => handleUpdate('flashcardsDirectory', value)}
      validationError={$store.validationErrors.flashcardsDirectory}
    />

    <ArraySetting
      label="Watch Directories"
      description="Directories to monitor for flashcard changes"
      values={settings.watchDirectories}
      placeholder="Add directory path..."
      on:add={(value) => handleArrayAdd('watchDirectories', value)}
      on:remove={(index) => handleArrayRemove('watchDirectories', index)}
      validationError={$store.validationErrors.watchDirectories}
    />

    <TagSetting
      label="Watch Tags"
      description="Only monitor files with these tags (leave empty to watch all)"
      tags={settings.watchTags}
      placeholder="Add tag (e.g., #flashcard)..."
      on:add={(tag) => handleArrayAdd('watchTags', tag)}
      on:remove={(index) => handleArrayRemove('watchTags', index)}
      validationError={$store.validationErrors.watchTags}
    />

    <ArraySetting
      label="Ignored Directories"
      description="Directories to exclude from watching"
      values={settings.ignoredDirectories}
      placeholder="Add directory to ignore..."
      on:add={(value) => handleArrayAdd('ignoredDirectories', value)}
      on:remove={(index) => handleArrayRemove('ignoredDirectories', index)}
      validationError={$store.validationErrors.ignoredDirectories}
    />
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
