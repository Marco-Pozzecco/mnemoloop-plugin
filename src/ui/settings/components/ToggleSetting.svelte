<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Icon } from '@/ui/components/common';

  export let label: string;
  export let description = '';
  export let checked = false;
  export let validationError: string | undefined = undefined;

  const dispatch = createEventDispatcher<{
    update: boolean;
  }>();

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    dispatch('update', target.checked);
  }
</script>

<div class="ka-toggle-setting">
  <div class="ka-toggle-setting__header">
    <label for={label} class="ka-toggle-setting__label">
      {label}
    </label>
    <div class="ka-toggle-setting__switch">
      <input
        id={label}
        type="checkbox"
        class="ka-toggle-setting__input"
        {checked}
        on:change={handleChange}
      />
      <div class="ka-toggle-setting__slider"></div>
      <Icon
        name="check"
        size={14}
        class="ka-toggle-setting__icon ka-toggle-setting__icon--check"
      />
    </div>
  </div>

  {#if description}
    <p class="ka-toggle-setting__description">{description}</p>
  {/if}

  {#if validationError}
    <div class="ka-toggle-setting__error">
      <Icon name="alert-circle" size={14} />
      <span>{validationError}</span>
    </div>
  {/if}
</div>

<style>
  .ka-toggle-setting {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ka-toggle-setting__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .ka-toggle-setting__label {
    font-size: var(--font-ui-small);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
    cursor: pointer;
  }

  .ka-toggle-setting__switch {
    position: relative;
    width: 44px;
    height: 24px;
  }

  .ka-toggle-setting__input {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 2;
  }

  .ka-toggle-setting__slider {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--background-modifier-border);
    border-radius: 12px;
    transition: background-color 0.15s ease;
  }

  .ka-toggle-setting__input:checked + .ka-toggle-setting__slider {
    background-color: var(--interactive-accent);
  }

  .ka-toggle-setting__input:focus + .ka-toggle-setting__slider {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 2px;
  }

  .ka-toggle-setting__icon {
    position: absolute;
    top: 50%;
    right: 4px;
    transform: translateY(-50%);
    color: var(--text-on-accent);
    opacity: 0;
    transition: opacity 0.15s ease;
    pointer-events: none;
  }

  .ka-toggle-setting__input:checked ~ .ka-toggle-setting__icon {
    opacity: 1;
  }

  .ka-toggle-setting__description {
    margin: 0;
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    line-height: 1.4;
  }

  .ka-toggle-setting__error {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--font-ui-smaller);
    color: var(--text-error);
  }
</style>
