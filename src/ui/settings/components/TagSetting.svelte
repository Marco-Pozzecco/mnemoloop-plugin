<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Button, Icon } from '@/ui/components/common';

  export let label: string;
  export let description = '';
  export let tags: string[] = [];
  export let placeholder = 'Add tag...';
  export let validationError: string | undefined = undefined;

  const dispatch = createEventDispatcher<{
    add: string;
    remove: number;
  }>();

  let newInputValue = '';
  let inputElement: HTMLInputElement;
  let tagError = '';

  function handleAdd() {
    const trimmed = newInputValue.trim();

    if (!trimmed) {
      tagError = 'Tag cannot be empty';
      return;
    }

    if (!trimmed.startsWith('#')) {
      tagError = 'Tags must start with #';
      return;
    }

    if (tags.includes(trimmed)) {
      tagError = 'Tag already exists';
      return;
    }

    dispatch('add', trimmed);
    newInputValue = '';
    tagError = '';

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

  function handleInput() {
    tagError = '';
  }
</script>

<div class="ka-tag-setting">
  <label for={`input-${label}`} class="ka-tag-setting__label">
    {label}
  </label>
  {#if description}
    <p class="ka-tag-setting__description">{description}</p>
  {/if}

  <div class="ka-tag-setting__tags">
    {#each tags as tag, index}
      <div class="ka-tag-setting__tag">
        <span class="ka-tag-setting__tag-text">{tag}</span>
        <button
          class="ka-tag-setting__remove"
          on:click={() => handleRemove(index)}
          aria-label="Remove {tag}"
        >
          <Icon name="x" size={14} />
        </button>
      </div>
    {:else}
      <div class="ka-tag-setting__empty">
        <Icon name="tag" size={24} />
        <span>No tags added</span>
      </div>
    {/each}
  </div>

  <div class="ka-tag-setting__input-wrapper">
    <input
      id={`input-${label}`}
      type="text"
      bind:this={inputElement}
      class="ka-tag-setting__input"
      class:has-error={tagError || validationError}
      {placeholder}
      bind:value={newInputValue}
      on:keydown={handleKeyDown}
      on:input={handleInput}
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

  {#if tagError}
    <div class="ka-tag-setting__error">
      <Icon name="alert-circle" size={14} />
      <span>{tagError}</span>
    </div>
  {/if}

  {#if validationError}
    <div class="ka-tag-setting__error">
      <Icon name="alert-circle" size={14} />
      <span>{validationError}</span>
    </div>
  {/if}
</div>

<style>
  .ka-tag-setting {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ka-tag-setting__label {
    font-size: var(--font-ui-small);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
  }

  .ka-tag-setting__description {
    margin: 0;
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    line-height: 1.4;
  }

  .ka-tag-setting__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
  }

  .ka-tag-setting__tag {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background-color: var(--background-modifier-hover);
    border: 1px solid var(--interactive-accent);
    border-radius: 16px;
    gap: 12px;
  }

  .ka-tag-setting__tag-text {
    font-size: var(--font-ui-small);
    color: var(--interactive-accent);
    font-weight: var(--font-medium);
  }

  .ka-tag-setting__remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    background: none;
    border: none;
    border-radius: 50%;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .ka-tag-setting__remove:hover {
    background-color: var(--background-modifier-error);
    color: var(--text-error);
  }

  .ka-tag-setting__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px;
    background-color: var(--background-secondary);
    border: 1px dashed var(--background-modifier-border);
    border-radius: 8px;
    color: var(--text-muted);
    font-size: var(--font-ui-small);
    width: 100%;
  }

  .ka-tag-setting__input-wrapper {
    display: flex;
    gap: 8px;
  }

  .ka-tag-setting__input {
    flex: 1;
    padding: 10px 12px;
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    font-family: var(--font-monospace);
  }

  .ka-tag-setting__input:focus {
    outline: none;
    border-color: var(--interactive-accent);
  }

  .ka-tag-setting__input.has-error {
    border-color: var(--text-error);
  }

  .ka-tag-setting__error {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--font-ui-smaller);
    color: var(--text-error);
  }

  @media (max-width: 480px) {
    .ka-tag-setting__input-wrapper {
      flex-direction: column;
    }

    .ka-tag-setting__input-wrapper :global(.ka-button) {
      width: 100%;
    }
  }
</style>
