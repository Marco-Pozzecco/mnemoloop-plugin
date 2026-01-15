<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  /**
   * Button variants to match Obsidian's design language
   */
  export let variant: 'primary' | 'secondary' | 'danger' = 'secondary';

  /**
   * Button sizes
   */
  export let size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Whether the button is disabled
   */
  export let disabled: boolean = false;

  /**
   * Optional ARIA label for accessibility
   */
  export let ariaLabel: string | undefined = undefined;

  /**
   * Button type attribute
   */
  export let type: 'button' | 'submit' | 'reset' = 'button';

  /**
   * Optional title attribute for tooltips
   */
  export let title: string | undefined = undefined;

  /**
   * Additional CSS classes
   */
  let className: string = '';
  export { className as class };

  const dispatch = createEventDispatcher<{
    click: MouseEvent;
  }>();

  function handleClick(event: MouseEvent) {
    if (!disabled) {
      dispatch('click', event);
    }
  }
</script>

<button
  {type}
  class="ka-button ka-button--{variant} ka-button--{size} {className}"
  {disabled}
  {title}
  aria-label={ariaLabel || title}
  on:click={handleClick}
>
  <slot />
</button>

<style>
  .ka-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: inherit;
    font-weight: var(--font-medium);
    border-radius: var(--button-radius);
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
    border: 1px solid transparent;
    user-select: none;
    white-space: nowrap;

    /* Ensure minimum touch target size for accessibility */
    min-height: 44px;
    padding: 0 16px;
  }

  /* Variants */
  .ka-button--primary {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  .ka-button--primary:hover:not(:disabled) {
    background-color: var(--interactive-accent-hover);
  }

  .ka-button--secondary {
    background-color: var(--button-secondary-background, var(--background-modifier-border));
    color: var(--text-normal);
    border: 1px solid var(--background-modifier-border-focus);
  }

  .ka-button--secondary:hover:not(:disabled) {
    background-color: var(--background-modifier-hover);
  }

  .ka-button--danger {
    background-color: var(--text-error);
    color: var(--text-on-accent);
  }

  .ka-button--danger:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  /* Sizes */
  .ka-button--small {
    min-height: 32px;
    padding: 0 12px;
    font-size: var(--font-ui-smaller);
  }

  .ka-button--medium {
    min-height: 44px;
    padding: 0 20px;
    font-size: var(--font-ui-small);
  }

  .ka-button--large {
    min-height: 52px;
    padding: 0 28px;
    font-size: var(--font-ui-medium);
  }

  /* States */
  .ka-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ka-button:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 2px;
  }

  /* Mobile-first responsive adjustments */
  @media (max-width: 480px) {
    .ka-button--large {
      width: 100%;
    }
  }
</style>
