<script lang="ts">
  import { Button, Icon, ProgressBar } from '../../components/common';
  import { errorState, isLoading } from '../../stores/UIStore';
  import type { DashboardConfig, DashboardStats } from './types';

  export let stats: DashboardStats;
  export let config: DashboardConfig;
  export let onStartReview: () => void = () => {};
  export let onRefresh: () => void = () => {};
  export let onOpenSettings: () => void = () => {};
  export let onConfigChange: (config: Partial<DashboardConfig>) => void = () => {};
  let className: string = '';
  export { className as class };

  // Reactive calculations
  $: dailyProgress = Math.min(100, (stats.cardsLearnedToday / stats.dailyGoal) * 100);
  $: isReviewDisabled = stats.dueCount === 0 || $isLoading;
  $: hasDueCards = stats.dueCount > 0;

  // Chart calculations
  const chartHeight = 120;
  const chartWidth = 400;
  const barPadding = 8;
  $: barWidth = (chartWidth / Math.max(stats.progressData.length, 1)) - barPadding;
  $: maxCompleted = Math.max(...stats.progressData.map(d => d.completed), stats.dailyGoal, 1);

  function getBarHeight(completed: number): number {
    return (completed / maxCompleted) * chartHeight;
  }

  function getDayName(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { weekday: 'short' });
    } catch (e) {
      return '';
    }
  }

  function formatPercent(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  // Event handlers
  function handleStartReview() {
    if (!isReviewDisabled) {
      onStartReview();
    }
  }

  function handleRefresh() {
    onRefresh();
  }

  function handleOpenSettings() {
    onOpenSettings();
  }
</script>

<div class="ka-dashboard {className}" role="main" aria-label="Learning Dashboard">
  <header class="ka-dashboard__header">
    <div class="ka-dashboard__title-group">
      <h1 class="ka-dashboard__title">Learning Dashboard</h1>
      <p class="ka-dashboard__subtitle">Track your progress and stay consistent</p>
    </div>
    <div class="ka-dashboard__actions">
      <Button
        variant="secondary"
        size="small"
        on:click={handleRefresh}
        disabled={$isLoading}
        title="Refresh statistics"
      >
        <Icon name="refresh-cw" size={16} />
      </Button>
      <Button
        variant="secondary"
        size="small"
        on:click={handleOpenSettings}
        title="Open settings"
      >
        <Icon name="settings" size={16} />
      </Button>
    </div>
  </header>

  {#if $errorState.hasError}
    <div class="ka-dashboard__error" role="alert">
      <Icon name="alert-circle" size={24} />
      <p>{$errorState.message}</p>
      {#if $errorState.retry}
        <Button variant="primary" size="small" on:click={$errorState.retry}>Retry</Button>
      {/if}
    </div>
  {:else}
    <div class="ka-dashboard__stats-grid">
      <div class="ka-stat-card">
        <span class="ka-stat-card__label">Due Today</span>
        <span class="ka-stat-card__value">{stats.dueCount}</span>
        <span class="ka-stat-card__description">cards to review</span>
      </div>

      {#if config.showRetentionRate}
        <div class="ka-stat-card">
          <span class="ka-stat-card__label">Retention</span>
          <span class="ka-stat-card__value">{formatPercent(stats.retentionRate)}</span>
          <span class="ka-stat-card__description">average accuracy</span>
        </div>
      {/if}

      <div class="ka-stat-card">
        <span class="ka-stat-card__label">Streak</span>
        <span class="ka-stat-card__value">{stats.streakDays}</span>
        <span class="ka-stat-card__description">days in a row</span>
      </div>

      <div class="ka-stat-card">
        <span class="ka-stat-card__label">Total Cards</span>
        <span class="ka-stat-card__value">{stats.totalCards}</span>
        <span class="ka-stat-card__description">in your vault</span>
      </div>
    </div>

    <section class="ka-dashboard__progress" aria-labelledby="daily-goal-title">
      <div class="ka-section-header">
        <h2 id="daily-goal-title" class="ka-section-title">Daily Goal</h2>
        <span class="ka-section-value" aria-live="polite">
          {stats.cardsLearnedToday} / {stats.dailyGoal} cards
        </span>
      </div>
      <ProgressBar
        value={stats.cardsLearnedToday}
        max={stats.dailyGoal}
        showPercentage
        ariaLabel="Daily review progress"
      />
      {#if hasDueCards}
        <p class="ka-progress-estimate">
          Estimated time: <strong>{stats.estimatedTimeMinutes} min</strong> to finish due cards
        </p>
      {/if}
    </section>

    {#if config.showProgressChart && stats.progressData.length > 0}
      {@const goalY = chartHeight - (stats.dailyGoal / maxCompleted) * chartHeight}
      <section class="ka-dashboard__chart-section" aria-labelledby="progress-chart-title">
        <h2 id="progress-chart-title" class="ka-section-title">7-Day Progress</h2>
        <div class="ka-chart-container">
          <svg
            viewBox="0 0 {chartWidth} {chartHeight + 30}"
            preserveAspectRatio="xMidYMid meet"
            class="ka-progress-chart"
            aria-hidden="true"
          >
            <!-- Goal Line -->
            <line
              x1="0" y1={goalY}
              x2={chartWidth} y2={goalY}
              stroke="var(--text-muted)"
              stroke-dasharray="4 2"
              stroke-width="1"
              opacity="0.5"
            />

            {#each stats.progressData as entry, i}
              {@const x = i * (barWidth + barPadding)}
              {@const h = getBarHeight(entry.completed)}
              {@const y = chartHeight - h}

              <!-- Bar -->
              <rect
                {x} {y}
                width={barWidth} height={h}
                rx="4"
                fill={entry.completed >= entry.target ? 'var(--interactive-accent)' : 'var(--background-modifier-border-focus)'}
                class="ka-chart-bar"
              >
                <title>{entry.date}: {entry.completed} cards</title>
              </rect>

              <!-- Label -->
              <text
                x={x + barWidth / 2}
                y={chartHeight + 20}
                text-anchor="middle"
                font-size="10"
                fill="var(--text-muted)"
              >
                {getDayName(entry.date)}
              </text>
            {/each}
          </svg>
        </div>
      </section>
    {/if}

    <div class="ka-dashboard__footer-actions">
      <Button
        variant="primary"
        size="large"
        class="ka-start-button"
        disabled={isReviewDisabled}
        on:click={handleStartReview}
      >
        {#if $isLoading}
          <Icon name="loader-2" class="ka-spin" size={20} />
          <span>Loading...</span>
        {:else if hasDueCards}
          <Icon name="play" size={20} />
          <span>Start Review Session</span>
        {:else}
          <Icon name="check-circle" size={20} />
          <span>All Caught Up!</span>
        {/if}
      </Button>
    </div>
  {/if}
</div>

<style>
  .ka-dashboard {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 24px;
    max-width: 800px;
    margin: 0 auto;
    color: var(--text-normal);
    animation: ka-fade-in 0.3s ease-out;
  }

  @keyframes ka-fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .ka-dashboard__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }

  .ka-dashboard__title {
    margin: 0;
    font-size: var(--font-l);
    font-weight: var(--font-bold);
    color: var(--text-normal);
  }

  .ka-dashboard__subtitle {
    margin: 4px 0 0 0;
    color: var(--text-muted);
    font-size: var(--font-ui-small);
  }

  .ka-dashboard__actions {
    display: flex;
    gap: 8px;
  }

  .ka-dashboard__stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px;
  }

  .ka-stat-card {
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    transition: all 0.2s ease;
  }

  .ka-stat-card:hover {
    border-color: var(--interactive-accent);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .ka-stat-card__label {
    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }

  .ka-stat-card__value {
    font-size: 28px;
    font-weight: var(--font-bold);
    color: var(--interactive-accent);
    margin-bottom: 4px;
    line-height: 1.2;
  }

  .ka-stat-card__description {
    font-size: var(--font-ui-smaller);
    color: var(--text-faint);
  }

  .ka-dashboard__progress {
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 12px;
    padding: 24px;
  }

  .ka-section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 16px;
  }

  .ka-section-title {
    margin: 0;
    font-size: var(--font-ui-medium);
    font-weight: var(--font-semibold);
    color: var(--text-normal);
  }

  .ka-section-value {
    font-size: var(--font-ui-small);
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }

  .ka-progress-estimate {
    margin: 16px 0 0 0;
    font-size: var(--font-ui-small);
    color: var(--text-muted);
    text-align: center;
  }

  .ka-dashboard__chart-section {
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 12px;
    padding: 24px;
  }

  .ka-chart-container {
    margin-top: 20px;
    width: 100%;
    overflow: hidden;
  }

  .ka-progress-chart {
    width: 100%;
    height: auto;
    display: block;
  }

  .ka-chart-bar {
    transition: all 0.3s ease;
    cursor: help;
  }

  .ka-chart-bar:hover {
    filter: brightness(1.1);
    opacity: 0.9;
  }

  .ka-dashboard__footer-actions {
    margin-top: 8px;
    display: flex;
    justify-content: center;
  }

  :global(.ka-start-button) {
    width: 100%;
    max-width: 400px;
    gap: 12px;
  }

  .ka-dashboard__error {
    padding: 40px;
    background-color: var(--background-secondary);
    border: 1px solid var(--text-error);
    color: var(--text-error);
    border-radius: 12px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .ka-dashboard__error p {
    margin: 0;
    font-size: var(--font-ui-medium);
  }

  :global(.ka-spin) {
    animation: ka-spin 1s linear infinite;
  }

  @keyframes ka-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Mobile adjustments */
  @media (max-width: 480px) {
    .ka-dashboard {
      padding: 16px;
      gap: 16px;
    }

    .ka-dashboard__header {
      flex-direction: column;
      align-items: stretch;
    }

    .ka-dashboard__actions {
      justify-content: flex-end;
    }

    .ka-dashboard__stats-grid {
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .ka-stat-card {
      padding: 16px 12px;
    }

    .ka-stat-card__value {
      font-size: 22px;
    }

    .ka-dashboard__progress,
    .ka-dashboard__chart-section {
      padding: 16px;
    }
  }
</style>
