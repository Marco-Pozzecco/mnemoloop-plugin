<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Icon } from '@/ui/components/common';

  export let label: string;
  export let description = '';
  export let value = 0;
  export let min: number | undefined = undefined;
  export let max: number | undefined = undefined;
  export let step = 1;
  export let placeholder = '';
  export let validationError: string | undefined = undefined;

  const dispatch = createEventDispatcher<{
    update: number;
  }>();

  let inputValue = value;

  $: inputValue = value;

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const parsed = parseFloat(target.value);
    inputValue = isNaN(parsed) ? 0 : parsed;
  }

  function handleChange() {
    dispatch('update', inputValue);
  }

  function increment() {
    const newValue = Math.min(max ?? Infinity, inputValue + step);
    inputValue = newValue;
    dispatch('update', newValue);
  }

  function decrement() {
    const newValue = Math.max(min ?? -Infinity, inputValue - step);
    inputValue = newValue;
    dispatch('update', newValue);
  }
</script>

<div class="ka-number-setting">
  <label for={label} class="ka-number-setting__label">
    {label}
  </label>
  {#if description}
    <p class="ka-number-setting__description">{description}</p>
  {/if}

  <div class="ka-number-setting__input-wrapper">
    <button
      class="ka-number-setting__button ka-number-setting__button--decrement"
      on:click={decrement}
      disabled={min !== undefined && inputValue <= min}
      aria-label="Decrease value"
    >
      <Icon name="minus" size={14} />
    </button>

    <input
      id={label}
      type="number"
      class="ka-number-setting__input"
      class:has-error={validationError}
      {placeholder}
      {min}
      {max}
      {step}
      {value}
      on:input={handleInput}
      on:change={handleChange}
    />

    <button
      class="ka-number-setting__button ka-number-setting__button--increment"
      on:click={increment}
      disabled={max !== undefined && inputValue >= max}
      aria-label="Increase value"
    >
      <Icon name="plus" size={14} />
    </button>
  </div>

  {#if validationError}
    <div class="ka-number-setting__error">
      <Icon name="alert-circle" size={14} />
      <span>{validationError}</span>
    </div>
  {/if}
</div>

<style>
  .ka-number-setting {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ka-number-setting__label {
    font-size: var(--font-ui-small);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
  }

  .ka-number-setting__description {
    margin: 0;
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    line-height: 1.4;
  }

  .ka-number-setting__input-wrapper {
    display: flex;
    align-items: center;
    gap: 0;
  }

  .ka-number-setting__input {
    flex: 1;
    padding: 10px 12px;
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    color: var(--text-normal);
    font-size: var(--font-ui-small);
    font-family: inherit;
    text-align: center;
    transition: border-color 0.15s ease;
  }

  .ka-number-setting__input:focus {
    outline: none;
    border-color: var(--interactive-accent);
  }

  .ka-number-setting__input.has-error {
    border-color: var(--text-error);
  }

  .ka-number-setting__button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    color: var(--text-normal);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .ka-number-setting__button--decrement {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    margin-right: -1px;
  }

  .ka-number-setting__button--increment {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    margin-left: -1px;
  }

  .ka-number-setting__button:hover:not(:disabled) {
    background-color: var(--background-modifier-hover);
    border-color: var(--interactive-accent);
  }

  .ka-number-setting__button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ka-number-setting__error {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--font-ui-smaller);
    color: var(--text-error);
  }
</style>
