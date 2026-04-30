<script lang="ts">
	import { Combobox } from 'bits-ui';
	import type { ComboboxProps } from './types';

	let {
		id = `ka-combobox-${Math.random().toString(36).substring(2, 9)}`,
		label,
		options,
		value = $bindable(''),
		placeholder = '',
		disabled = false,
		required = false,
		hasError = false,
		errorMessage = '',
		helperText,
		className = '',
		onchange,
	}: ComboboxProps = $props();

	// Handle value changes from bits-ui
	function handleValueChange(newValue: string | undefined) {
		const stringValue = newValue ?? '';
		value = stringValue;
		onchange?.(stringValue);
	}

	// Build aria-describedby attribute
	function buildAriaDescribedBy(): string | undefined {
		if (hasError) return `${id}-error`;
		if (helperText) return `${id}-helper`;
		return undefined;
	}
</script>

<div class="ka-combobox-wrapper {className}" class:has-error={hasError}>
	{#if label}
		<label for={id} class="ka-combobox-label">
			{label}
			{#if required}
				<span class="ka-combobox-required">*</span>
			{/if}
		</label>
	{/if}

	<Combobox.Root
		type="single"
		bind:value
		onValueChange={handleValueChange}
		{disabled}
		required={required || false}
	>
		<div class="ka-combobox-input-wrapper">
			<Combobox.Input
				{id}
				{placeholder}
				aria-invalid={hasError}
				aria-describedby={buildAriaDescribedBy()}
				class="ka-combobox-input"
			/>
			<Combobox.Trigger class="ka-combobox-trigger">
				{#snippet child({ props })}
					<button {...props} type="button" aria-label="Open dropdown">
						<svg
							class="ka-combobox-chevron"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<polyline points="6 9 12 15 18 9" />
						</svg>
					</button>
				{/snippet}
			</Combobox.Trigger>
		</div>

		<Combobox.Portal>
			<Combobox.Content class="ka-combobox-content" sideOffset={4}>
				<Combobox.Viewport class="ka-combobox-viewport">
					{#each options as option (option.value)}
						<Combobox.Item value={option.value} disabled={option.disabled} class="ka-combobox-item">
							{#snippet children({ selected, highlighted })}
								<span class="ka-combobox-item-label" class:highlighted>
									{option.label}
								</span>
								{#if selected}
									<span class="ka-combobox-item-indicator">
										<svg
											width="16"
											height="16"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<polyline points="20 6 9 17 4 12" />
										</svg>
									</span>
								{/if}
							{/snippet}
						</Combobox.Item>
					{/each}
				</Combobox.Viewport>
			</Combobox.Content>
		</Combobox.Portal>
	</Combobox.Root>

	{#if hasError && errorMessage}
		<div id="{id}-error" class="ka-combobox-error">{errorMessage}</div>
	{:else if helperText}
		<div id="{id}-helper" class="ka-combobox-helper">{helperText}</div>
	{/if}
</div>

<style>
	.ka-combobox-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.ka-combobox-label {
		font-size: var(--font-ui-smaller);
		font-weight: var(--font-medium);
		color: var(--text-normal);
		margin-bottom: 0;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.ka-combobox-required {
		color: var(--text-error);
		font-weight: bold;
	}

	.ka-combobox-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	:global(.ka-combobox-input) {
		width: 100%;
		padding: 0.625rem 2.5rem 0.625rem 0.75rem;
		font-family: inherit;
		font-size: var(--font-ui-small);
		color: var(--text-normal);
		background-color: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--input-radius, 4px);
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
		min-height: 44px;
	}

	:global(.ka-combobox-input::placeholder) {
		color: var(--text-muted);
	}

	:global(.ka-combobox-input:hover:not([data-disabled])) {
		border-color: var(--background-modifier-border-hover);
	}

	:global(.ka-combobox-input:focus) {
		outline: none;
		border-color: var(--interactive-accent);
		box-shadow: 0 0 0 2px var(--background-modifier-border-focus);
	}

	:global(.ka-combobox-input[data-disabled]) {
		background-color: var(--background-secondary);
		color: var(--text-muted);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.ka-combobox-wrapper.has-error :global(.ka-combobox-input) {
		border-color: var(--text-error);
		background-color: rgba(255, 0, 0, 0.05);
	}

	.ka-combobox-wrapper.has-error :global(.ka-combobox-input:focus) {
		box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.1);
	}

	:global(.ka-combobox-trigger) {
		position: absolute;
		right: 0.5rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		padding: 0.25rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-muted);
		transition: color 0.15s ease;
	}

	:global(.ka-combobox-trigger:hover) {
		color: var(--text-normal);
	}

	:global(.ka-combobox-trigger[data-disabled]) {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.ka-combobox-chevron {
		transition: transform 0.2s ease;
	}

	:global(.ka-combobox-trigger[data-state='open']) .ka-combobox-chevron {
		transform: rotate(180deg);
	}

	/* Dropdown content styles */
	:global(.ka-combobox-content) {
		background-color: var(--background-primary);
		border: 1px solid var(--background-modifier-border);
		border-radius: var(--input-radius, 4px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 50;
		min-width: var(--bits-combobox-anchor-width);
	}

	:global(.ka-combobox-viewport) {
		padding: 0.25rem;
		max-height: 300px;
		overflow-y: auto;
	}

	:global(.ka-combobox-item) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		font-size: var(--font-ui-small);
		color: var(--text-normal);
		cursor: pointer;
		border-radius: calc(var(--input-radius, 4px) - 2px);
		transition: background-color 0.15s ease;
	}

	:global(.ka-combobox-item:hover:not([data-disabled])) {
		background-color: var(--background-modifier-hover);
	}

	:global(.ka-combobox-item[data-highlighted]) {
		background-color: var(--background-modifier-hover);
	}

	:global(.ka-combobox-item[data-selected]) {
		background-color: var(--background-modifier-active);
	}

	:global(.ka-combobox-item[data-disabled]) {
		color: var(--text-muted);
		cursor: not-allowed;
		opacity: 0.5;
	}

	:global(.ka-combobox-item-label) {
		flex: 1;
	}

	:global(.ka-combobox-item-label.highlighted) {
		font-weight: var(--font-medium);
	}

	:global(.ka-combobox-item-indicator) {
		color: var(--interactive-accent);
		display: flex;
		align-items: center;
		margin-left: 0.5rem;
	}

	.ka-combobox-error,
	.ka-combobox-helper {
		font-size: var(--font-ui-smaller);
		line-height: 1.4;
	}

	.ka-combobox-error {
		color: var(--text-error);
	}

	.ka-combobox-helper {
		color: var(--text-muted);
	}

	/* Mobile adjustments */
	@media (max-width: 480px) {
		:global(.ka-combobox-input) {
			padding: 0.5rem 2.25rem 0.5rem 0.625rem;
			font-size: 1rem; /* Prevent iOS zoom */
		}

		:global(.ka-combobox-item) {
			padding: 0.625rem 0.75rem;
			font-size: 1rem;
		}
	}
</style>
