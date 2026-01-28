<script lang="ts">
  /**
   * Current progress value
   */
  export let value: number = 0;
  
  /**
   * Maximum progress value
   */
  export let max: number = 100;
  
  /**
   * Whether the progress bar is in an indeterminate state
   */
  export let indeterminate: boolean = false;
  
  /**
   * Optional ARIA label for accessibility
   */
  export let ariaLabel: string = 'Progress';
  
  /**
   * Whether to show the percentage text
   */
  export let showPercentage: boolean = false;
  
  /**
   * Additional CSS classes
   */
  let className: string = '';
  export { className as class };

  $: percentage = Math.min(Math.max(0, (value / max) * 100), 100);
</script>

<div 
  class="ka-progress-container {className}"
  role="progressbar"
  aria-label={ariaLabel}
  aria-valuemin="0"
  aria-valuemax={max}
  aria-valuenow={indeterminate ? undefined : value}
>
  <div class="ka-progress-track">
    <div 
      class="ka-progress-fill" 
      class:ka-progress-fill--indeterminate={indeterminate}
      style:width={indeterminate ? '100%' : `${percentage}%`}
    ></div>
  </div>
  
  {#if showPercentage && !indeterminate}
    <span class="ka-progress-label">
      {Math.round(percentage)}%
    </span>
  {/if}
</div>

<style>
  .ka-progress-container {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }

  .ka-progress-track {
    height: 8px;
    width: 100%;
    background-color: var(--background-modifier-border);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }

  .ka-progress-fill {
    height: 100%;
    background-color: var(--interactive-accent);
    border-radius: 4px;
    transition: width 0.3s ease-in-out;
  }

  .ka-progress-fill--indeterminate {
    width: 30% !important;
    position: absolute;
    animation: indeterminate-progress 1.5s infinite linear;
    transform-origin: 0% 50%;
  }

  .ka-progress-label {
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  @keyframes indeterminate-progress {
    0% {
      left: -30%;
    }
    100% {
      left: 100%;
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    .ka-progress-track {
      border: 1px solid currentColor;
    }
    .ka-progress-fill {
      background-color: Highlight;
    }
  }
</style>
