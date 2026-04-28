<script lang="ts">
	import { Switch } from 'bits-ui';
	import type ToggleProps from './types';

	let {
		id = `ka-toggle-${Math.random().toString(36).substring(2, 9)}`,
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

<div class="ka-toggle-wrapper ka-toggle-wrapper--{size} {className}">
	<div class="ka-toggle-label-row">
		<Switch.Root
			{id}
			bind:checked
			{disabled}
			onCheckedChange={handleCheckedChange}
			aria-describedby={helperText ? `${id}-helper` : undefined}
		>
			{#snippet child({ props, checked: isChecked })}
				<button {...props} class="ka-toggle-switch" class:checked={isChecked} class:disabled>
					<Switch.Thumb>
						{#snippet child({ props: thumbProps })}
							<span {...thumbProps} class="ka-toggle-thumb"></span>
						{/snippet}
					</Switch.Thumb>
				</button>
			{/snippet}
		</Switch.Root>
		{#if label}
			<label for={id} class="ka-toggle-text">{label}</label>
		{/if}
	</div>
	{#if helperText}
		<div id="{id}-helper" class="ka-toggle-helper">{helperText}</div>
	{/if}
</div>

<style>
	.ka-toggle-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.ka-toggle-label-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.ka-toggle-switch {
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

	.ka-toggle-thumb {
		display: block;
		background-color: white;
		border-radius: 50%;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		transition: transform 0.2s ease;
		flex-shrink: 0;
	}

	.ka-toggle-switch.checked {
		background-color: var(--interactive-accent);
	}

	.ka-toggle-switch.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.ka-toggle-text {
		font-size: var(--font-ui-small);
		color: var(--text-normal);
		line-height: 1.4;
		cursor: pointer;
		user-select: none;
	}

	.ka-toggle-helper {
		font-size: var(--font-ui-smaller);
		color: var(--text-muted);
		line-height: 1.4;
		margin-left: calc(var(--toggle-width, 40px) + 0.75rem);
	}

	.ka-toggle-label-row:hover .ka-toggle-switch:not(.disabled) {
		background-color: var(--background-modifier-border-hover);
	}

	.ka-toggle-label-row:hover .ka-toggle-switch.checked:not(.disabled) {
		background-color: var(--interactive-accent-hover);
	}

	/* Size variants - small */
	.ka-toggle-wrapper--small .ka-toggle-switch {
		width: 32px;
		height: 18px;
		padding: 0 3px;
	}

	.ka-toggle-wrapper--small .ka-toggle-thumb {
		width: 12px;
		height: 12px;
	}

	.ka-toggle-wrapper--small .ka-toggle-switch.checked .ka-toggle-thumb {
		transform: translateX(14px);
	}

	/* Size variants - medium */
	.ka-toggle-wrapper--medium .ka-toggle-switch {
		width: 40px;
		height: 22px;
		padding: 0 4px;
	}

	.ka-toggle-wrapper--medium .ka-toggle-thumb {
		width: 16px;
		height: 16px;
	}

	.ka-toggle-wrapper--medium .ka-toggle-switch.checked .ka-toggle-thumb {
		transform: translateX(18px);
	}

	/* Size variants - large */
	.ka-toggle-wrapper--large .ka-toggle-switch {
		width: 48px;
		height: 26px;
		padding: 0 4px;
	}

	.ka-toggle-wrapper--large .ka-toggle-thumb {
		width: 20px;
		height: 20px;
	}

	.ka-toggle-wrapper--large .ka-toggle-switch.checked .ka-toggle-thumb {
		transform: translateX(22px);
	}

	/* Focus visible */
	.ka-toggle-switch:focus-visible {
		outline: 2px solid var(--interactive-accent);
		outline-offset: 2px;
	}
</style>
