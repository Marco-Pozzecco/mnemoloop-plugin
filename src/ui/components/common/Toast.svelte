<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { fade } from 'svelte/transition';
  import { fly } from 'svelte/transition';

  export let message: string;
  export let type: 'info' | 'success' | 'warning' | 'error' = 'info';
  export let duration: number = 3000;
  export let visible: boolean = true;

  let toastElement: HTMLElement;
  let timeoutId: NodeJS.Timeout | null = null;

  // Map toast types to colors
  const typeColors: Record<typeof type, string> = {
    info: 'var(--interactive-accent)',
    success: 'var(--text-success)',
    warning: 'var(--text-warning)',
    error: 'var(--text-error)',
  };

  const typeIcons: Record<typeof type, string> = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  onMount(() => {
    startDismissTimer();
  });

  afterUpdate(() => {
    if (visible) {
      startDismissTimer();
    }
  });

  function startDismissTimer() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (duration > 0) {
      timeoutId = setTimeout(() => {
        visible = false;
      }, duration);
    }
  }

  function dismiss() {
    visible = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function handleMouseEnter() {
    // Pause dismissal timer on hover
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function handleMouseLeave() {
    // Resume dismissal timer when mouse leaves
    if (visible && duration > 0) {
      startDismissTimer();
    }
  }

  $: borderColor = typeColors[type];
  $: icon = typeIcons[type];
</script>

{#if visible}
  <div
    class="ka-toast"
    class:info={type === 'info'}
    class:success={type === 'success'}
    class:warning={type === 'warning'}
    class:error={type === 'error'}
    bind:this={toastElement}
    style="--toast-border-color: {borderColor}"
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
    transition:fly={{ y: 50, duration: 300, opacity: 0.5 }}
    role="alert"
    aria-live="polite"
  >
    <div class="ka-toast-icon">{icon}</div>
    <div class="ka-toast-message">{message}</div>
    <button
      class="ka-toast-close"
      on:click={dismiss}
      aria-label="Close notification"
    >
      ×
    </button>
  </div>
{/if}

<style>
  .ka-toast {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    background-color: var(--background-primary);
    border: 1px solid var(--toast-border-color);
    border-left-width: 4px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    color: var(--text-normal);
    font-size: 0.9rem;
    line-height: 1.4;
    max-width: 400px;
    min-height: 44px;
    position: relative;
    z-index: 1000;
  }

  .ka-toast-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .ka-toast-message {
    flex: 1;
    word-wrap: break-word;
    min-width: 0;
  }

  .ka-toast-close {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    min-height: 28px;
    min-width: 28px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 1.2rem;
    line-height: 1;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .ka-toast-close:hover {
    background-color: var(--background-modifier-hover);
    color: var(--text-normal);
  }

  .ka-toast-close:active {
    background-color: var(--background-modifier-active);
  }

  /* Type-specific styles */
  .ka-toast.info {
    --toast-border-color: var(--interactive-accent);
  }

  .ka-toast.success {
    --toast-border-color: var(--text-success);
  }

  .ka-toast.warning {
    --toast-border-color: var(--text-warning);
  }

  .ka-toast.error {
    --toast-border-color: var(--text-error);
  }

  /* Mobile adjustments */
  @media (max-width: 480px) {
    .ka-toast {
      padding: 0.75rem 0.875rem;
      font-size: 0.85rem;
      max-width: calc(100vw - 1rem);
      border-radius: 6px;
    }

    .ka-toast-icon {
      font-size: 1rem;
    }

    .ka-toast-close {
      width: 24px;
      height: 24px;
      min-height: 24px;
      min-width: 24px;
      font-size: 1rem;
    }
  }
</style>
