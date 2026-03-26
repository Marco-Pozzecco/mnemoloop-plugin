<script lang="ts">
	import { Logger } from '@/utils/Logger';
	import { Button, Icon } from '@/ui/components';
	import type ErrorWrapperProps from './types';

	let {
		fallback,
		onRetry,
		showError = true,
		maxRetries = 3,
		className = '',
		errorContext = 'ErrorWrapper',
		children,
		error = null,
	}: ErrorWrapperProps = $props();

	let hasError = $state(false);
	let errorMessage = $state('');
	let retryCount = $state(0);
	let retryExceeded = $state(false);
	let isExternalError = $state(false);

	$effect(() => {
		if (error !== undefined) {
			if (error) {
				hasError = true;
				isExternalError = true;
				errorMessage = error instanceof Error ? error.message : String(error);
				Logger.error(`[${errorContext}] External error injected:`, error);
			} else if (isExternalError) {
				hasError = false;
				errorMessage = '';
				isExternalError = false;
			}
		}
	});

	function handleError(error: unknown): void {
		hasError = true;
		errorMessage = error instanceof Error ? error.message : String(error);

		// Log error with correlation ID
		Logger.error(
			`[${errorContext}] Component error occurred (attempt ${retryCount + 1}/${maxRetries + 1}):`,
			error,
		);

		// Check if we've exceeded max retries
		if (retryCount >= maxRetries) {
			retryExceeded = true;
			errorMessage = 'Unable to recover after multiple attempts.';
		}
	}

	function handleRetry(): void {
		if (retryCount < maxRetries) {
			retryCount++;
			hasError = false;
			errorMessage = '';
			isExternalError = false;
			Logger.debug(`[${errorContext}] Retrying (attempt ${retryCount}/${maxRetries})`);

			if (onRetry) {
				onRetry();
			}
		} else {
			retryExceeded = true;
			Logger.warn(`[${errorContext}] Maximum retries (${maxRetries}) exceeded`);
		}
	}

	function getFriendlyErrorMessage(message: string): string {
		// Add actionable guidance to error messages
		if (message.includes('network') || message.includes('fetch')) {
			return `${message} Check your internet connection and try again.`;
		}
		if (message.includes('parse') || message.includes('JSON')) {
			return `${message} The data may be corrupted. Try refreshing the page.`;
		}
		return message;
	}

	const displayMessage = $derived(hasError ? getFriendlyErrorMessage(errorMessage) : fallback);
	const canRetry = $derived(onRetry !== null && !retryExceeded);
</script>

<svelte:boundary onerror={handleError}>
	{#if hasError}
		<div class="ka-error-wrapper {className}" role="alert" aria-live="polite">
			<div class="ka-error-wrapper__content">
				<div class="ka-error-wrapper__icon">
					<Icon name="alert-triangle" size={32} />
				</div>
				<div class="ka-error-wrapper__message">
					<h3 class="ka-error-wrapper__title">Something went wrong</h3>
					<p class="ka-error-wrapper__description">{displayMessage}</p>
					{#if showError && errorMessage && !retryExceeded}
						<div class="ka-error-wrapper__details">
							<details>
								<summary>Error details</summary>
								<code class="ka-error-wrapper__code">{errorMessage}</code>
							</details>
						</div>
					{/if}
				</div>
			</div>

			{#if canRetry}
				<div class="ka-error-wrapper__actions">
					{#if retryCount > 0}
						<span class="ka-error-wrapper__retry-info"
							>Retry attempt {retryCount} of {maxRetries}</span
						>
					{/if}
					<Button variant="primary" onclick={handleRetry}>
						<Icon name="refresh-cw" size={16} />
						Retry
					</Button>
				</div>
			{/if}

			{#if retryExceeded}
				<div class="ka-error-wrapper__actions">
					<span class="ka-error-wrapper__retry-info ka-error-wrapper__retry-info--exceeded">
						Maximum retries exceeded
					</span>
					<Button variant="secondary" onclick={() => window.location.reload()}>
						<Icon name="rotate-ccw" size={16} />
						Reload Page
					</Button>
				</div>
			{/if}
		</div>
	{:else if children}
		{@render children()}
	{/if}
</svelte:boundary>

<style>
	.ka-error-wrapper {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 32px;
		background-color: var(--background-secondary);
		border: 1px solid var(--text-warning);
		border-radius: 12px;
		color: var(--text-normal);
		max-width: 600px;
		margin: 24px auto;
		text-align: center;
		animation: ka-fade-in 0.3s ease-out;
	}

	@keyframes ka-fade-in {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.ka-error-wrapper__content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}

	.ka-error-wrapper__icon {
		color: var(--text-warning);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 64px;
		height: 64px;
		background-color: var(--background-modifier-error-hover);
		border-radius: 50%;
		flex-shrink: 0;
	}

	.ka-error-wrapper__message {
		display: flex;
		flex-direction: column;
		gap: 8px;
		text-align: left;
		width: 100%;
	}

	.ka-error-wrapper__title {
		margin: 0;
		font-size: var(--font-ui-larger);
		font-weight: var(--font-bold);
		color: var(--text-normal);
	}

	.ka-error-wrapper__description {
		margin: 0;
		font-size: var(--font-ui-small);
		color: var(--text-muted);
		line-height: 1.5;
	}

	.ka-error-wrapper__details {
		margin-top: 8px;
	}

	.ka-error-wrapper__details details {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.ka-error-wrapper__details summary {
		cursor: pointer;
		color: var(--text-muted);
		font-size: var(--font-ui-smaller);
		user-select: none;
		outline: none;
	}

	.ka-error-wrapper__details summary:focus {
		outline: 2px solid var(--interactive-accent);
		outline-offset: 2px;
		border-radius: 2px;
	}

	.ka-error-wrapper__code {
		display: block;
		padding: 12px;
		background-color: var(--background-primary-alt);
		border: 1px solid var(--background-modifier-border);
		border-radius: 6px;
		font-size: var(--font-ui-smaller);
		font-family: var(--font-monospace);
		color: var(--text-muted);
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-all;
		max-height: 200px;
		overflow-y: auto;
	}

	.ka-error-wrapper__actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding-top: 8px;
		border-top: 1px solid var(--background-modifier-border);
		width: 100%;
	}

	.ka-error-wrapper__retry-info {
		font-size: var(--font-ui-smaller);
		color: var(--text-muted);
	}

	.ka-error-wrapper__retry-info--exceeded {
		color: var(--text-warning);
		font-weight: var(--font-medium);
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ka-error-wrapper {
			padding: 24px 16px;
			margin: 16px;
		}

		.ka-error-wrapper__icon {
			width: 48px;
			height: 48px;
		}

		.ka-error-wrapper__title {
			font-size: var(--font-ui-large);
		}

		.ka-error-wrapper__code {
			max-height: 150px;
			font-size: 11px;
		}
	}
</style>
