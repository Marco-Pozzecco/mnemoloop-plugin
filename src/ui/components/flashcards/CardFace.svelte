<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { MarkdownRenderer, Component } from 'obsidian';
  import Icon from '../common/Icon.svelte';
  import Button from '../common/Button.svelte';
  import type { CardFaceMode } from '../../views/Review/types';

  export let front: string;
  export let back: string = '';
  export let mode: CardFaceMode = 'front';
  export let onFlip: (() => void) | undefined = undefined;
  export let onEdit: (() => void) | undefined = undefined;
  export let showEditButton: boolean = true;
  export let app: any; // Obsidian App instance

  let frontEl: HTMLElement;
  let backEl: HTMLElement;
  const component = new Component();

  async function renderMarkdown(el: HTMLElement, content: string) {
    if (!el || !content) return;
    el.empty();
    await MarkdownRenderer.render(app, content, el, '', component);
  }

  onMount(() => {
    component.load();
    renderMarkdown(frontEl, front);
    if (mode !== 'front') {
      renderMarkdown(backEl, back);
    }
    return () => component.unload();
  });

  afterUpdate(() => {
    renderMarkdown(frontEl, front);
    if (mode !== 'front') {
      renderMarkdown(backEl, back);
    }
  });

  function handleFlip() {
    if (mode === 'front' && onFlip) {
      onFlip();
    }
  }
</script>

<div 
  class="ka-card-face-container {mode}" 
  class:is-flippable={mode === 'front' && onFlip}
  on:click={handleFlip}
  on:keydown={(e) => e.key === 'Enter' && handleFlip()}
  role={mode === 'front' && onFlip ? 'button' : 'region'}
  tabindex={mode === 'front' && onFlip ? 0 : -1}
  aria-label={mode === 'front' ? 'Flashcard front. Click to flip.' : 'Flashcard content'}
>
  {#if showEditButton}
    <div class="ka-card-edit-button">
      <Button 
        variant="ghost" 
        size="sm" 
        on:click={(e) => { e.stopPropagation(); onEdit?.(); }}
        ariaLabel="Edit card"
      >
        <Icon name="pencil" size={14} />
      </Button>
    </div>
  {/if}

  <div class="ka-card-content">
    <div 
      bind:this={frontEl} 
      class="ka-markdown-view ka-front"
      class:hidden={mode === 'back'}
    ></div>
    
    {#if mode !== 'front'}
      <div class="ka-card-divider"></div>
      <div 
        bind:this={backEl} 
        class="ka-markdown-view ka-back"
      ></div>
    {/if}
  </div>
</div>

<style>
  .ka-card-face-container {
    position: relative;
    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    padding: 2rem;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    cursor: default;
  }

  .ka-card-face-container.is-flippable {
    cursor: pointer;
  }

  .ka-card-face-container.is-flippable:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: var(--interactive-accent);
  }

  .ka-card-edit-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 10;
  }

  .ka-card-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    width: 100%;
  }

  .ka-markdown-view {
    width: 100%;
    overflow-wrap: break-word;
  }

  .ka-markdown-view.hidden {
    display: none;
  }

  .ka-card-divider {
    width: 100%;
    height: 1px;
    background-color: var(--background-modifier-border);
    margin: 1.5rem 0;
  }

  :global(.ka-markdown-view p) {
    margin: 0.5rem 0;
  }

  /* Mobile optimizations */
  @media (max-width: 480px) {
    .ka-card-face-container {
      padding: 1.5rem;
      min-height: 150px;
    }
  }
</style>
