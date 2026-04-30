<script lang="ts">
	import { Slider } from 'bits-ui';
	import type SliderProps from './types';

	let {
		id = `ka-slider-${Math.random().toString(36).substring(2, 9)}`,
		label,
		value = $bindable(0),
		min = 0,
		max = 100,
		step = 1,
		disabled = false,
		required = false,
		hasError = false,
		errorMessage = '',
		helperText,
		className = '',
		onchange,
	}: SliderProps = $props();

	function handleValueChange(newValue: number) {
		value = newValue;
		if (onchange) {
			onchange(newValue);
		}
	}
</script>

<div class="ka-slider-wrapper {className}" class:has-error={hasError} class:disabled>
	{#if label}
		<label for={id} class="ka-slider-label">
			{label}
			{#if required}
				<span class="ka-slider-required">*</span>
			{/if}
		</label>
	{/if}

	<Slider.Root
		{id}
		type="single"
		bind:value
		{min}
		{max}
		{step}
		{disabled}
		onValueChange={handleValueChange}
		aria-invalid={hasError}
		aria-describedby={hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined}
	>
		{#snippet child({ props, thumbItems })}
			<div {...props} class="ka-slider-container">
				<div class="ka-slider-track">
					<Slider.Range>
						{#snippet child({ props: rangeProps })}
							{@const rangeWidth = ((value - min) / (max - min)) * 100}
							<div {...rangeProps} class="ka-slider-range" style="width: {rangeWidth}%"></div>
						{/snippet}
					</Slider.Range>
				</div>
				{#each thumbItems as thumb (thumb.index)}
					<Slider.Thumb index={thumb.index}>
						{#snippet child({ props: thumbProps })}
							<div {...thumbProps} class="ka-slider-thumb"></div>
						{/snippet}
					</Slider.Thumb>
				{/each}
			</div>
		{/snippet}
	</Slider.Root>

	{#if hasError && errorMessage}
		<div id="{id}-error" class="ka-slider-error">{errorMessage}</div>
	{:else if helperText}
		<div id="{id}-helper" class="ka-slider-helper">{helperText}</div>
	{/if}
</div>

<style>
	.ka-slider-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.ka-slider-label {
		font-size: var(--font-ui-smaller);
		font-weight: var(--font-medium);
		color: var(--text-normal);
		margin-bottom: 0;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.ka-slider-required {
		color: var(--text-error);
		font-weight: bold;
	}

	.ka-slider-container {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
		height: 24px;
		touch-action: none;
		user-select: none;
	}

	.ka-slider-track {
		height: 4px;
		background-color: var(--background-modifier-border);
		border-radius: 2px;
		position: relative;
		width: 100%;
		overflow: hidden;
	}

	.ka-slider-range {
		height: 100%;
		background-color: var(--interactive-accent);
		border-radius: 2px;
		position: absolute;
		left: 0;
		top: 0;
	}

	.ka-slider-thumb {
		width: 16px;
		height: 16px;
		background-color: var(--interactive-accent);
		border-radius: 50%;
		border: 2px solid var(--background-primary);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		cursor: grab;
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
		transition:
			background-color 0.15s ease,
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.ka-slider-thumb:hover {
		background-color: var(--interactive-accent-hover);
		transform: translate(-50%, -50%) scale(1.1);
	}

	.ka-slider-thumb:focus-visible {
		outline: 2px solid var(--interactive-accent);
		outline-offset: 2px;
	}

	.ka-slider-thumb:active {
		cursor: grabbing;
		transform: translate(-50%, -50%) scale(0.95);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
	}

	/* Error state */
	.ka-slider-wrapper.has-error .ka-slider-track {
		background-color: rgba(255, 0, 0, 0.2);
	}

	.ka-slider-wrapper.has-error .ka-slider-range {
		background-color: var(--text-error);
	}

	.ka-slider-wrapper.has-error .ka-slider-thumb {
		background-color: var(--text-error);
		border-color: var(--background-primary);
	}

	.ka-slider-wrapper.has-error .ka-slider-thumb:hover {
		background-color: var(--text-error);
		filter: brightness(1.1);
	}

	.ka-slider-wrapper.has-error .ka-slider-label {
		color: var(--text-error);
	}

	/* Disabled state */
	.ka-slider-wrapper.disabled .ka-slider-track {
		background-color: var(--background-modifier-border);
		opacity: 0.5;
	}

	.ka-slider-wrapper.disabled .ka-slider-range {
		background-color: var(--text-muted);
	}

	.ka-slider-wrapper.disabled .ka-slider-thumb {
		background-color: var(--text-muted);
		cursor: not-allowed;
		box-shadow: none;
	}

	/* Error and helper text */
	.ka-slider-error,
	.ka-slider-helper {
		font-size: var(--font-ui-smaller);
		line-height: 1.4;
	}

	.ka-slider-error {
		color: var(--text-error);
	}

	.ka-slider-helper {
		color: var(--text-muted);
	}
</style>
