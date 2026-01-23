<script lang="ts">
	import { onMount } from 'svelte';
	import { useManager, useService } from '@/ui/infrastructure/ManagersContext';
	import type { IndexManager } from '@/core/indexer/IndexerManager';
	import type { StatisticsManager } from '@/core/statistics';
	import type { EventBus } from '@/ui/infrastructure/EventBus';
	import { Logger } from '@/utils/Logger';

	// Access managers and services via context
	const indexManager = useManager<IndexManager>('IndexManager');
	const statisticsManager = useManager<StatisticsManager>('StatisticsManager');
	const eventBus = useService<EventBus>('EventBus');

	let totalCards = 0;
	let indexReady = false;

	onMount(async () => {
		try {
			// Demonstrate accessing IndexManager via context
			Logger.info('NestedComponentExample: Accessing IndexManager via context');

			// Get total cards from index
			const cards = indexManager.getAllCards();
			totalCards = cards.length;

			// Demonstrate accessing StatisticsManager via context
			Logger.info('NestedComponentExample: Accessing StatisticsManager via context');

			// Demonstrate that we're at current context level (not a stale snapshot)
			eventBus.on('test:context', (data) => {
				Logger.info('NestedComponentExample received event:', data);
			});

			indexReady = true;

			Logger.info(
				`NestedComponentExample: Successfully accessed context. Total cards: ${totalCards}`
			);
		} catch (error) {
			Logger.error('NestedComponentExample: Failed to access managers via context:', error);
		}
	});

	function emitTestEvent() {
		eventBus.emit('test:context', {
			source: 'NestedComponentExample',
			timestamp: Date.now(),
		});
	}
</script>

<div class="ka-nested-component-example">
	<div class="ka-example-header">
		<h3 class="ka-example-title">Deeply Nested Component</h3>
		<div class="ka-example-badge">Context Access Demo</div>
	</div>

	<div class="ka-example-content">
		<div class="ka-info-box">
			<h4>Component Demonstration</h4>
			<p>This component demonstrates accessing managers and services via Svelte context without prop drilling.</p>

			<ul class="ka-feature-list">
				<li>✓ Accesses <strong>IndexManager</strong> via <code>useManager()</code></li>
				<li>✓ Accesses <strong>StatisticsManager</strong> via <code>useManager()</code></li>
				<li>✓ Accesses <strong>EventBus</strong> via <code>useService()</code></li>
				<li>✓ No props passed from parent component</li>
				<li>✓ Receives current context value (not stale snapshot)</li>
			</ul>
		</div>

		{#if indexReady}
			<div class="ka-stats-display">
				<div class="ka-stat-item">
					<span class="ka-stat-label">Total Cards in Vault</span>
					<span class="ka-stat-value">{totalCards}</span>
				</div>
				<div class="ka-success-message">
					✅ Successfully accessed managers via context!
				</div>
			</div>
		{:else}
			<div class="ka-loading-state">
				<div class="ka-spinner"></div>
				<span>Loading from context...</span>
			</div>
		{/if}

		<div class="ka-actions">
			<button class="ka-test-button" on:click={emitTestEvent} aria-label="Emit test event">
				<svg class="ka-button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="22 12 18 12 15 21 9 12 15 3 22 12"></polyline>
				</svg>
				Emit Test Event
			</button>
		</div>
	</div>

	<div class="ka-example-footer">
		<p class="ka-footer-text">
			<strong>Key Insight:</strong> This component can be moved anywhere in the component tree
			and will continue working without modifying parent prop chains.
		</p>
	</div>
</div>

<style>
	.ka-nested-component-example {
		background-color: var(--background-secondary);
		border: 1px solid var(--background-modifier-border);
		border-radius: 12px;
		padding: 20px;
		margin: 16px 0;
		max-width: 100%;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.ka-example-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
		padding-bottom: 12px;
		border-bottom: 1px solid var(--background-modifier-border);
	}

	.ka-example-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: var(--font-bold);
		color: var(--text-normal);
	}

	.ka-example-badge {
		background-color: var(--interactive-accent);
		color: var(--text-on-accent);
		padding: 4px 12px;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: var(--font-semibold);
	}

	.ka-example-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.ka-info-box h4 {
		margin: 0 0 8px 0;
		font-size: 1rem;
		font-weight: var(--font-semibold);
		color: var(--text-normal);
	}

	.ka-info-box p {
		margin: 0 0 12px 0;
		color: var(--text-muted);
		font-size: var(--font-ui-small);
		line-height: 1.5;
	}

	.ka-feature-list {
		margin: 0;
		padding-left: 20px;
		color: var(--text-muted);
		font-size: var(--font-ui-small);
		line-height: 1.8;
	}

	.ka-feature-list li {
		margin-bottom: 4px;
	}

	.ka-feature-list code {
		background-color: var(--background-modifier-border);
		padding: 2px 6px;
		border-radius: 4px;
		font-family: var(--font-monospace);
		font-size: 0.9em;
	}

	.ka-feature-list strong {
		color: var(--text-normal);
		font-weight: var(--font-semibold);
	}

	.ka-stats-display {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 16px;
		background-color: var(--background-primary);
		border-radius: 8px;
	}

	.ka-stat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 12px;
		background-color: var(--background-secondary);
		border-radius: 6px;
	}

	.ka-stat-label {
		color: var(--text-muted);
		font-size: var(--font-ui-small);
	}

	.ka-stat-value {
		color: var(--interactive-accent);
		font-size: 1.5rem;
		font-weight: var(--font-bold);
	}

	.ka-success-message {
		padding: 8px 12px;
		background-color: var(--color-green-rgb);
		color: var(--color-green);
		border-radius: 6px;
		font-size: var(--font-ui-small);
		font-weight: var(--font-semibold);
	}

	.ka-loading-state {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px;
		background-color: var(--background-primary);
		border-radius: 8px;
		color: var(--text-muted);
	}

	.ka-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid var(--background-modifier-border);
		border-top-color: var(--interactive-accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.ka-actions {
		display: flex;
		gap: 12px;
	}

	.ka-test-button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		background-color: var(--interactive-accent);
		color: var(--text-on-accent);
		border: none;
		border-radius: 6px;
		font-size: var(--font-ui-medium);
		font-weight: var(--font-semibold);
		cursor: pointer;
		transition: background-color 0.2s ease, transform 0.1s ease;
	}

	.ka-test-button:hover {
		background-color: var(--interactive-accent-hover);
	}

	.ka-test-button:active {
		transform: translateY(1px);
	}

	.ka-button-icon {
		width: 16px;
		height: 16px;
	}

	.ka-example-footer {
		margin-top: 16px;
		padding-top: 12px;
		border-top: 1px solid var(--background-modifier-border);
	}

	.ka-footer-text {
		margin: 0;
		color: var(--text-muted);
		font-size: var(--font-ui-small);
		line-height: 1.5;
	}

	.ka-footer-text strong {
		color: var(--text-normal);
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ka-nested-component-example {
			padding: 16px;
		}

		.ka-example-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 8px;
		}

		.ka-stat-value {
			font-size: 1.25rem;
		}
	}
</style>
