<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button, Icon } from '@/ui/components/common';

  export let label: string;
  export let description = '';
  export let values: string[] = [];
  export let placeholder = 'Add item...';
  export let validationError: string | undefined = undefined;

  const dispatch = createEventDispatcher<{
    add: string;
    remove: number;
  }>();

  let newInputValue = '';
  let inputElement: HTMLInputElement;

  function handleAdd() {
    if (!newInputValue.trim()) return;

    dispatch('add', newInputValue.trim());
    newInputValue = '';

    if (inputElement) {
      inputElement.focus();
    }
  }

  function handleRemove(index: number) {
    dispatch('remove', index);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAdd();
    }
  }
</script>

<div class="ka-array-setting">
  <label for={`input-${label}`} class="ka-array-setting__label">
    {label}
  </label>
  {#if description}
    <p class="ka-array-setting__description">{description}</p>
  {/if}

  <div class="ka-array-setting__items">
    {#each values as value, index}
      <div class="ka-array-setting__item">
        <span class="ka-array-setting__item-text">{value}</span>
        <button
          class="ka-array-setting__remove"
          on:click={() => handleRemove(index)}
          aria-label="Remove {value}"
        >
          <Icon name="x" size={14} />
        </button>
      </div>
    {:else}
      <div class="ka-array-setting__empty">
        <Icon name="folder-open" size={24} />
        <span>No items added</span>
      </div>
    {/each}
  </div>

  <div class="ka-array-setting__input-wrapper">
    <input
      id={`input-${label}`}
      type="text"
      bind:this={inputElement}
      class="ka-array-setting__input"
      {placeholder}
      bind:value={newInputValue}
      on:keydown={handleKeyDown}
    />
    <Button
      variant="secondary"
      size="small"
      on:click={handleAdd}
      disabled={!newInputValue.trim()}
    >
      <Icon name="plus" size={14} />
      Add
    </Button>
  </div>

  {#if validationError}
    <div class="ka-array-setting__error">
      <Icon name="alert-circle" size={14} />
      <span>{validationError}</span>
    </div>
  {/if}
</div>

<style>
  .ka-array-setting {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ka-array-setting__label {
    font-size: var(--font-ui-small);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
  }

  .ka-array-setting__description {
    margin: 0;
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    line-height: 1.4;
  }

  .ka-array-setting__items {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
  }

  .ka-array-setting__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    gap: 12px;
  }

  .ka-array-setting__item-text {
    flex: 1;
    font-size: var(--font-ui-small);
    color: var(--text-normal);
    word-break: break-word;
    font-family: var(--font-monospace);
  }

  .ka-array-setting__remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    background: none;
    border: none;
    border-radius: 4px;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .ka-array-setting__remove:hover {
    background-color: var(--background-modifier-error);
    color: var(--text-error);
  }

  .ka-array-setting__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px;
    background-color: var(--background-secondary);
    border: 1px dashed var(--background-modifier-border);
    border-radius: 6px;
    color: var(--text-muted);
    font-size: var(--font-ui-small);
  }

  .ka-array-setting__input-wrapper {
    display: flex;
    gap: 8px;
  }

  .ka-array-setting__input {
    flex: 1;
    padding: 10px 12px;
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    font-family: var(--font-monospace);
  }

  .ka-array-setting__input:focus {
    outline: none;
    border-color: var(--interactive-accent);
  }

  .ka-array-setting__error {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--font-ui-smaller);
    color: var(--text-error);
  }

  @media (max-width: 480px) {
    .ka-array-setting__input-wrapper {
      flex-direction: column;
    }

    .ka-array-setting__input-wrapper :global(.ka-button) {
      width: 100%;
    }
  }
</style>
