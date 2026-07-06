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
		<div class="ml-error-wrapper {className}" role="alert" aria-live="polite">
			<div class="ml-error-wrapper__content">
				<div class="ml-error-wrapper__icon">
					<Icon name="alert-triangle" size={32} />
				</div>
				<div class="ml-error-wrapper__message">
					<h3 class="ml-error-wrapper__title">Something went wrong</h3>
					<p class="ml-error-wrapper__description">{displayMessage}</p>
					{#if showError && errorMessage && !retryExceeded}
						<div class="ml-error-wrapper__details">
							<details>
								<summary>Error details</summary>
								<code class="ml-error-wrapper__code">{errorMessage}</code>
							</details>
						</div>
					{/if}
				</div>
			</div>

			{#if canRetry}
				<div class="ml-error-wrapper__actions">
					{#if retryCount > 0}
						<span class="ml-error-wrapper__retry-info"
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
				<div class="ml-error-wrapper__actions">
					<span class="ml-error-wrapper__retry-info ml-error-wrapper__retry-info--exceeded">
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

<style lang="scss">
	@use 'tokens' as *;

	.ml-error-wrapper {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
		padding: $spacing-xl;
		background-color: $background-secondary;
		border: 1px solid -warning;
		border-radius: 12px;
		color: $text-normal;
		max-width: 600px;
		margin: $spacing-lg auto;
		text-align: center;
		animation: ml-fade-in 0.3s ease-out;
	}

	@keyframes ml-fade-in {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.ml-error-wrapper__content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $spacing-md;
	}

	.ml-error-wrapper__icon {
		color: $text-warning;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 64px;
		height: 64px;
		background-color: $background-modifier-error-hover;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.ml-error-wrapper__message {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
		text-align: left;
		width: 100%;
	}

	.ml-error-wrapper__title {
		margin: 0;
		font-size: $font-lg;
		font-weight: $font-bold;
		color: $text-normal;
	}

	.ml-error-wrapper__description {
		margin: 0;
		font-size: $font-sm;
		color: $text-muted;
		line-height: 1.5;
	}

	.ml-error-wrapper__details {
		margin-top: 8px;
	}

	.ml-error-wrapper__details details {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
	}

	.ml-error-wrapper__details summary {
		cursor: pointer;
		color: $text-muted;
		font-size: $font-xs;
		user-select: none;
		outline: none;
	}

	.ml-error-wrapper__details summary:focus {
		outline: 2px solid $interactive-accent;
		outline-offset: 2px;
		border-radius: $radius-xs;
	}

	.ml-error-wrapper__code {
		display: block;
		padding: $spacing-sm;
		background-color: $background-primary-alt;
		border: 1px solid $background-modifier-border;
		border-radius: $radius-md;
		font-size: $font-xs;
		font-family: $font-monospace;
		color: $text-muted;
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-all;
		max-height: 200px;
		overflow-y: auto;
	}

	.ml-error-wrapper__actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $spacing-sm;
		padding-top: 8px;
		border-top: 1px solid $background-modifier-border;
		width: 100%;
	}

	.ml-error-wrapper__retry-info {
		font-size: $font-xs;
		color: $text-muted;
	}

	.ml-error-wrapper__retry-info--exceeded {
		color: $text-warning;
		font-weight: $font-md;
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		.ml-error-wrapper {
		padding: $spacing-lg $spacing-md;
		margin: $spacing-md;
		}

		.ml-error-wrapper__icon {
			width: 48px;
			height: 48px;
		}

		.ml-error-wrapper__title {
			font-size: $font-lg;
		}

		.ml-error-wrapper__code {
			max-height: 150px;
			font-size: 11px;
		}
	}
</style>
