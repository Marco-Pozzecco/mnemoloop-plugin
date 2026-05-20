<script lang="ts">
	import { Switch } from 'bits-ui';
	import type ToggleProps from './types';

	let {
		id = `ml-toggle-${Math.random().toString(36).substring(2, 9)}`,
		label,
		checked = $bindable(false),
		disabled = false,
		helperText,
		size = 'medium',
		className = '',
		onchange,
	}: ToggleProps = $props();

	function handleCheckedChange(newChecked: boolean) {
		checked = newChecked;
		if (onchange) {
			onchange(newChecked);
		}
	}
</script>

<div class="ml-toggle-wrapper ml-toggle-wrapper--{size} {className}">
	<div class="ml-toggle-label-row">
		<Switch.Root
			{id}
			bind:checked
			{disabled}
			onCheckedChange={handleCheckedChange}
			aria-describedby={helperText ? `${id}-helper` : undefined}
		>
			{#snippet child({ props, checked: isChecked })}
				<button {...props} class="ml-toggle-switch" class:checked={isChecked} class:disabled>
					<Switch.Thumb>
						{#snippet child({ props: thumbProps })}
							<span {...thumbProps} class="ml-toggle-thumb"></span>
						{/snippet}
					</Switch.Thumb>
				</button>
			{/snippet}
		</Switch.Root>
		{#if label}
			<label for={id} class="ml-toggle-text">{label}</label>
		{/if}
	</div>
	{#if helperText}
		<div id="{id}-helper" class="ml-toggle-helper">{helperText}</div>
	{/if}
</div>

<style>
	.ml-toggle-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.ml-toggle-label-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.ml-toggle-switch {
		position: relative;
		display: flex;
		align-items: center;
		background-color: var(--background-modifier-border);
		border-radius: 100px;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: background-color 0.2s ease;
		flex-shrink: 0;
	}

	.ml-toggle-thumb {
		display: block;
		background-color: var(--text-on-accent);
		border-radius: 50%;
		box-shadow: 0 1px 3px color-mix(in srgb, var(--text-normal) 20%, transparent);
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}

	.ml-toggle-switch.checked {
		background-color: var(--interactive-accent);
	}

	.ml-toggle-switch.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.ml-toggle-text {
		font-size: var(--font-ui-small);
		color: var(--text-normal);
		line-height: 1.4;
		cursor: pointer;
		user-select: none;
	}

	.ml-toggle-helper {
		font-size: var(--font-ui-smaller);
		color: var(--text-muted);
		line-height: 1.4;
		margin-left: calc(var(--toggle-width, 40px) + 0.75rem);
	}

	.ml-toggle-label-row:hover .ml-toggle-switch:not(.disabled) {
		background-color: var(--background-modifier-border-hover);
	}

	.ml-toggle-label-row:hover .ml-toggle-switch.checked:not(.disabled) {
		background-color: var(--interactive-accent-hover);
	}

	/* Size variants - small */
	.ml-toggle-wrapper--small .ml-toggle-switch {
		width: 32px;
		height: 18px;
		padding: 0 3px;
	}

	.ml-toggle-wrapper--small .ml-toggle-thumb {
		width: 12px;
		height: 12px;
	}

	.ml-toggle-wrapper--small .ml-toggle-switch.checked .ml-toggle-thumb {
		transform: translateX(14px);
	}

	/* Size variants - medium */
	.ml-toggle-wrapper--medium .ml-toggle-switch {
		width: 40px;
		height: 22px;
		padding: 0 4px;
	}

	.ml-toggle-wrapper--medium .ml-toggle-thumb {
		width: 16px;
		height: 16px;
	}

	.ml-toggle-wrapper--medium .ml-toggle-switch.checked .ml-toggle-thumb {
		transform: translateX(18px);
	}

	/* Size variants - large */
	.ml-toggle-wrapper--large .ml-toggle-switch {
		width: 48px;
		height: 26px;
		padding: 0 4px;
	}

	.ml-toggle-wrapper--large .ml-toggle-thumb {
		width: 20px;
		height: 20px;
	}

	.ml-toggle-wrapper--large .ml-toggle-switch.checked .ml-toggle-thumb {
		transform: translateX(22px);
	}

	/* Focus visible */
	.ml-toggle-switch:focus-visible {
		outline: 2px solid var(--interactive-accent);
		outline-offset: 2px;
	}
</style>
