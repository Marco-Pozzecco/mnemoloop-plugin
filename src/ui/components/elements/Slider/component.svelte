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
		tooltip,
		tooltipPosition = 'top',
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
		onValueCommit={handleValueChange}
		aria-invalid={hasError}
		aria-describedby={hasError ? `${id}-error` : helperText ? `${id}-helper` : undefined}
	>
		{#snippet child({ props, thumbItems })}
			<div
				{...props}
				class="ml-slider-container"
				style="--range-width: {((value - min) / (max - min)) * 100}%"
			>
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
					{#if tooltip}
						<Slider.ThumbLabel index={thumb.index} position={tooltipPosition}>
							{#snippet child({ props: labelProps })}
								<span {...labelProps} class="ml-slider-thumb-label">{thumb.value}</span>
							{/snippet}
						</Slider.ThumbLabel>
					{/if}
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

<style lang="scss">
	@use 'tokens' as *;

	.ml-slider-wrapper {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
	}

	.ml-slider-label {
		font-size: $font-xs;
		font-weight: $font-md;
		color: $text-normal;
		margin-bottom: 0;
		display: flex;
		align-items: center;
		gap: $spacing-xxs;
	}

	.ml-slider-required {
		color: -error;
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
		background-color: $background-modifier-border;
		border-radius: $radius-xs;
		position: relative;
		width: 100%;
		overflow: hidden;
	}

	.ml-slider-range {
		height: 100%;
		background-color: $interactive-accent;
		border-radius: $radius-xs;
		position: absolute;
		left: 0;
		top: 0;
		width: var(--range-width);
	}

	.ml-slider-thumb {
		width: 16px;
		height: 16px;
		background-color: $interactive-accent;
		border-radius: 50%;
		border: 2px solid $background-primary;
		box-shadow: 0 1px 3px color-mix(in srgb, $text-normal 20%, transparent);
		position: absolute;
		transition:
			background-color 0.15s ease,
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.ml-slider-thumb:hover {
		background-color: $interactive-accent-hover;
		transform: scale(1.2);
	}

	.ml-slider-thumb:active {
		cursor: grabbing;
		transform: scale(0.95);
		box-shadow: 0 2px 6px color-mix(in srgb, $text-normal 30%, transparent);
	}

	.ml-slider-thumb-label {
		display: none;
		z-index: 999;
		border: 1px solid;
		border-color: $background-modifier-border;
		background-color: $background-primary;
		color: $text-normal;
		padding: $spacing-xxs $spacing-xs;
		border-radius: $radius-sm;
		font-size: 0.875rem;
	}

	.ml-slider-thumb:active + .ml-slider-thumb-label {
		display: block;
	}

	.ml-slider-thumb:hover + .ml-slider-thumb-label {
		display: block;
	}
	/* Error state */
	.ml-slider-wrapper.has-error .ml-slider-track {
		background-color: color-mix(in srgb, -error 20%, transparent);
	}

	.ml-slider-wrapper.has-error .ml-slider-range {
		background-color: -error;
	}

	.ml-slider-wrapper.has-error .ml-slider-thumb {
		background-color: -error;
		border-color: $background-primary;
	}

	.ml-slider-wrapper.has-error .ml-slider-thumb:hover {
		background-color: -error;
		filter: brightness(1.1);
	}

	.ml-slider-wrapper.has-error .ml-slider-label {
		color: -error;
	}

	/* Disabled state */
	.ml-slider-wrapper.disabled .ml-slider-track {
		background-color: $background-modifier-border;
		opacity: 0.5;
	}

	.ml-slider-wrapper.disabled .ml-slider-range {
		background-color: $text-muted;
	}

	.ml-slider-wrapper.disabled .ml-slider-thumb {
		background-color: $text-muted;
		cursor: not-allowed;
		box-shadow: none;
	}

	/* Error and helper text */
	.ml-slider-error,
	.ml-slider-helper {
		font-size: $font-xs;
		line-height: 1.4;
	}

	.ml-slider-error {
		color: -error;
	}

	.ml-slider-helper {
		color: $text-muted;
	}
</style>
