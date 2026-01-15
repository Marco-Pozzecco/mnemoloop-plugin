<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import CardFace from '../../components/flashcards/CardFace.svelte';
  import RatingControls from '../../components/flashcards/RatingControls.svelte';
  import Button from '../../components/common/Button.svelte';
  import ProgressBar from '../../components/common/ProgressBar.svelte';
  import Icon from '../../components/common/Icon.svelte';
  import { gesture } from '../../actions/gestures';
  import { SessionStore } from '@/ui/stores/SessionStore';
  import type { CardRatingValue } from './types';

  export let app: any;
  export let onShowAnswer: () => void;
  export let onSubmitRating: (rating: CardRatingValue) => void;
  export let onNextCard: () => void;
  export let onPreviousCard: () => void;
  export let onEndSession: () => void;
  export let onEditCard: () => void;
  export let sessionStore: SessionStore;

  let cardContainer: HTMLElement;
  let isGesturing = false;



  $: card = sessionStore.currentCard;
  $: showingAnswer = sessionStore.isAnswerShowing;
  $: progress = sessionStore.sessionProgress;
  $: remaining = sessionStore.remainingCards;
  $: session = sessionStore.activeSession;
  $: currentIndex = session ? session.currentIndex + 1 : 0;
  $: totalCards = session ? session.queue.length : 0;

  function handleKeyDown(event: KeyboardEvent) {
    // Don't trigger shortcuts if user is typing in an input
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (event.code === 'Space') {
      event.preventDefault();
      if (!showingAnswer) {
        onShowAnswer();
      }
    } else if (event.key === '1') {
      if (showingAnswer) onSubmitRating(1);
    } else if (event.key === '2') {
      if (showingAnswer) onSubmitRating(2);
    } else if (event.key === '3') {
      if (showingAnswer) onSubmitRating(3);
    } else if (event.key === '4') {
      if (showingAnswer) onSubmitRating(4);
    } else if (event.key.toLowerCase() === 'n') {
      onNextCard();
    } else if (event.key.toLowerCase() === 'p') {
      onPreviousCard();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  // Gesture handlers
  function handleSwipeLeft() {
    if (showingAnswer) {
      // When answer is showing, swipe left = submit with "Again" (rating 1)
      onSubmitRating(1);
    } else {
      // When front is showing, swipe left = navigate to previous card
      onPreviousCard();
    }
  }

  function handleSwipeRight() {
    if (showingAnswer) {
      // When answer is showing, swipe right = submit with "Good" (rating 3)
      onSubmitRating(3);
    } else {
      // When front is showing, swipe right = show answer or navigate to next
      onShowAnswer();
    }
  }

  function handleTap() {
    // Tap to flip card if answer is not showing
    if (!showingAnswer && !isGesturing) {
      onShowAnswer();
    }
  }
</script>

<div class="ka-review-container">
  <header class="ka-review-header">
    <div class="ka-review-stats">
      <span class="ka-stat-item">
        <Icon name="layers" size={14} />
        {currentIndex} / {totalCards}
      </span>
      <span class="ka-stat-item">
        <Icon name="clock" size={14} />
        {remaining} remaining
      </span>
    </div>

    <div class="ka-progress-wrapper">
      <ProgressBar progress={progress} height={4} />
    </div>

    <Button variant="ghost" size="sm" on:click={onEndSession} ariaLabel="End session">
      <Icon name="x" size={18} />
    </Button>
  </header>

  <main class="ka-review-main">
    {#if card}
      <div class="ka-card-wrapper" bind:this={cardContainer} use:gesture={{
        onSwipeLeft: handleSwipeLeft,
        onSwipeRight: handleSwipeRight,
        onTap: handleTap,
        swipeThreshold: 50,
        tapMaxDuration: 200,
        tapMaxDistance: 10
      }}>
        <CardFace
          {app}
          front={card.front}
          back={card.back}
          mode={showingAnswer ? 'both' : 'front'}
          onFlip={onShowAnswer}
          onEdit={onEditCard}
        />
      </div>

      <div class="ka-controls-wrapper">
        {#if !showingAnswer}
          <Button
            variant="accent"
            className="ka-show-answer-button"
            on:click={onShowAnswer}
            ariaLabel="Show answer"
          >
            Show Answer
            <span class="ka-key-hint">Space</span>
          </Button>
        {:else}
          <RatingControls {onSubmitRating} />
        {/if}
      </div>
    {:else}
      <div class="ka-empty-state">
        <Icon name="check-circle" size={48} />
        <h2>Session Complete!</h2>
        <p>You've reviewed all cards in this session.</p>
        <Button variant="accent" on:click={onEndSession}>Return to Dashboard</Button>
      </div>
    {/if}
  </main>

  <footer class="ka-review-footer">
    <div class="ka-navigation-controls">
      <Button variant="ghost" size="sm" on:click={onPreviousCard} disabled={currentIndex <= 1} ariaLabel="Previous card">
        <Icon name="chevron-left" size={16} />
        <span>Previous</span>
      </Button>
      <Button variant="ghost" size="sm" on:click={onNextCard} disabled={currentIndex >= totalCards} ariaLabel="Next card">
        <span>Next</span>
        <Icon name="chevron-right" size={16} />
      </Button>
    </div>
  </footer>
</div>

<style>
  .ka-review-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
    gap: 1.5rem;
  }

  .ka-review-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .ka-review-stats {
    display: flex;
    gap: 1rem;
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .ka-stat-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .ka-progress-wrapper {
    flex: 1;
  }

  .ka-review-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2rem;
    min-height: 0;
  }

  .ka-card-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
  }

  .ka-controls-wrapper {
    display: flex;
    justify-content: center;
    min-height: 100px;
  }

  :global(.ka-show-answer-button) {
    width: 100%;
    max-width: 300px;
    height: 50px !important;
    font-size: 1.1rem !important;
    position: relative;
  }

  .ka-key-hint {
    position: absolute;
    right: 1rem;
    font-size: 0.7rem;
    opacity: 0.6;
    border: 1px solid currentColor;
    padding: 2px 4px;
    border-radius: 3px;
  }

  .ka-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 1rem;
    padding: 3rem;
    background-color: var(--background-secondary);
    border-radius: 12px;
  }

  .ka-empty-state h2 {
    margin: 0;
  }

  .ka-empty-state p {
    color: var(--text-muted);
    margin-bottom: 1rem;
  }

  .ka-review-footer {
    display: flex;
    justify-content: center;
    padding-bottom: 1rem;
  }

  .ka-navigation-controls {
    display: flex;
    gap: 2rem;
  }

  /* Mobile optimizations */
  @media (max-width: 480px) {
    .ka-review-container {
      padding: 0.5rem;
      gap: 1rem;
    }

    .ka-review-stats {
      font-size: 0.75rem;
      gap: 0.5rem;
    }

    .ka-key-hint {
      display: none;
    }
  }
</style>
