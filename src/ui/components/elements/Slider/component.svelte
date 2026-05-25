<script lang="ts">
	import { Slider } from 'bits-ui';
	import type SliderProps from './types';

	let {
		id = `ml-slider-${Math.random().toString(36).substring(2, 9)}`,
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

<div class="ml-slider-wrapper {className}" class:has-error={hasError} class:disabled>
	{#if label}
		<label for={id} class="ml-slider-label">
			{label}
			{#if required}
				<span class="ml-slider-required">*</span>
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
			<div {...props} class="ml-slider-container" style="--range-width: {((value - min) / (max - min)) * 100}%">
				<div class="ml-slider-track">
					<Slider.Range>
						{#snippet child({ props: rangeProps })}
							<div {...rangeProps} class="ml-slider-range"></div>
						{/snippet}
					</Slider.Range>
				</div>
				{#each thumbItems as thumb (thumb.index)}
					<Slider.Thumb index={thumb.index}>
						{#snippet child({ props: thumbProps })}
							<div {...thumbProps} class="ml-slider-thumb"></div>
						{/snippet}
					</Slider.Thumb>
				{/each}
			</div>
		{/snippet}
	</Slider.Root>

	{#if hasError && errorMessage}
		<div id="{id}-error" class="ml-slider-error">{errorMessage}</div>
	{:else if helperText}
		<div id="{id}-helper" class="ml-slider-helper">{helperText}</div>
	{/if}
</div>

<style>
	.ml-slider-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.ml-slider-label {
		font-size: var(--font-ui-smaller);
		font-weight: var(--font-medium);
		color: var(--text-normal);
		margin-bottom: 0;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.ml-slider-required {
		color: var(--text-error);
		font-weight: bold;
	}

	.ml-slider-container {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
		height: 24px;
		touch-action: none;
		user-select: none;
	}

	.ml-slider-track {
		height: 4px;
		background-color: var(--background-modifier-border);
		border-radius: 2px;
		position: relative;
		width: 100%;
		overflow: hidden;
	}

	.ml-slider-range {
		height: 100%;
		background-color: var(--interactive-accent);
		border-radius: 2px;
		position: absolute;
		left: 0;
		top: 0;
		width: var(--range-width);
	}

	.ml-slider-thumb {
		width: 16px;
		height: 16px;
		background-color: var(--interactive-accent);
		border-radius: 50%;
		border: 2px solid var(--background-primary);
		box-shadow: 0 1px 3px color-mix(in srgb, var(--text-normal) 20%, transparent);
		cursor: grab;
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
		transition:
			background-color 0.15s ease,
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.ml-slider-thumb:hover {
		background-color: var(--interactive-accent-hover);
		transform: translate(-50%, -50%) scale(1.1);
	}

	.ml-slider-thumb:focus-visible {
		outline: 2px solid var(--interactive-accent);
		outline-offset: 2px;
	}

	.ml-slider-thumb:active {
		cursor: grabbing;
		transform: translate(-50%, -50%) scale(0.95);
		box-shadow: 0 2px 6px color-mix(in srgb, var(--text-normal) 30%, transparent);
	}

	/* Error state */
	.ml-slider-wrapper.has-error .ml-slider-track {
		background-color: color-mix(in srgb, var(--text-error) 20%, transparent);
	}

	.ml-slider-wrapper.has-error .ml-slider-range {
		background-color: var(--text-error);
	}

	.ml-slider-wrapper.has-error .ml-slider-thumb {
		background-color: var(--text-error);
		border-color: var(--background-primary);
	}

	.ml-slider-wrapper.has-error .ml-slider-thumb:hover {
		background-color: var(--text-error);
		filter: brightness(1.1);
	}

	.ml-slider-wrapper.has-error .ml-slider-label {
		color: var(--text-error);
	}

	/* Disabled state */
	.ml-slider-wrapper.disabled .ml-slider-track {
		background-color: var(--background-modifier-border);
		opacity: 0.5;
	}

	.ml-slider-wrapper.disabled .ml-slider-range {
		background-color: var(--text-muted);
	}

	.ml-slider-wrapper.disabled .ml-slider-thumb {
		background-color: var(--text-muted);
		cursor: not-allowed;
		box-shadow: none;
	}

	/* Error and helper text */
	.ml-slider-error,
	.ml-slider-helper {
		font-size: var(--font-ui-smaller);
		line-height: 1.4;
	}

	.ml-slider-error {
		color: var(--text-error);
	}

	.ml-slider-helper {
		color: var(--text-muted);
	}
</style>
