<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Icon } from '@/ui/components/common';

  export let label: string;
  export let description = '';
  export let value = '';
  export let placeholder = '';
  export let validationError: string | undefined = undefined;

  const dispatch = createEventDispatcher<{
    update: string;
  }>();

  let inputValue = value;

  $: inputValue = value;

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    inputValue = target.value;
  }

  function handleChange() {
    dispatch('update', inputValue);
  }
</script>

<div class="ka-text-setting">
  <label for={label} class="ka-text-setting__label">
    {label}
  </label>
  {#if description}
    <p class="ka-text-setting__description">{description}</p>
  {/if}

  <div class="ka-text-setting__input-wrapper">
    <input
      id={label}
      type="text"
      class="ka-text-setting__input"
      class:has-error={validationError}
      {placeholder}
      {value}
      on:input={handleInput}
      on:change={handleChange}
      on:keydown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
    />
  </div>

  {#if validationError}
    <div class="ka-text-setting__error">
      <Icon name="alert-circle" size={14} />
      <span>{validationError}</span>
    </div>
  {/if}
</div>

<style>
  .ka-text-setting {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ka-text-setting__label {
    font-size: var(--font-ui-small);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
  }

  .ka-text-setting__description {
    margin: 0;
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    line-height: 1.4;
  }

  .ka-text-setting__input-wrapper {
    position: relative;
  }

  .ka-text-setting__input {
    width: 100%;
    padding: 10px 12px;
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    font-family: inherit;
    transition: border-color 0.15s ease;
  }

  .ka-text-setting__input:focus {
    outline: none;
    border-color: var(--interactive-accent);
  }

  .ka-text-setting__input.has-error {
    border-color: var(--text-error);
  }

  .ka-text-setting__error {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--font-ui-smaller);
    color: var(--text-error);
  }
</style>
