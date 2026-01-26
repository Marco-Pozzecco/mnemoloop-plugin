<script lang="ts">
	import type { ToggleProps } from './Toggle.types';

	/**
	 * Unique identifier for the toggle
	 */
	export let id: ToggleProps['id'] = `ka-toggle-${Math.random().toString(36).substr(2, 9)}`;

	/**
	 * Label text for the toggle
	 */
	export let label: ToggleProps['label'] = undefined;

	/**
	 * Whether the toggle is checked
	 */
	export let checked: ToggleProps['checked'] = false;

	/**
	 * Whether the toggle is disabled
	 */
	export let disabled: ToggleProps['disabled'] = false;

	/**
	 * Optional helper text
	 */
	export let helperText: ToggleProps['helperText'] = undefined;

	/**
	 * Size of the toggle switch
	 */
	export let size: ToggleProps['size'] = 'medium';

	/**
	 * Additional CSS classes
	 */
	let className: string = '';
	export { className as class };

	let toggleElement: HTMLInputElement;

	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		checked = target.checked;
	}
</script>

<div class="ka-toggle-wrapper ka-toggle-wrapper--{size} {className}">
	<label for={id} class="ka-toggle-label">
		<input
			bind:this={toggleElement}
			{id}
			type="checkbox"
			{checked}
			{disabled}
			class="ka-toggle-input"
			on:change={handleChange}
			aria-describedby={helperText ? `${id}-helper` : undefined}
		/>
		<span class="ka-toggle-switch" class:checked={checked} class:disabled={disabled}></span>
		{#if label}
			<span class="ka-toggle-text">{label}</span>
		{/if}
	</label>
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

	.ka-toggle-label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		user-select: none;
	}

	.ka-toggle-input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.ka-toggle-switch {
		position: relative;
		display: block;
		background-color: var(--background-modifier-border);
		border-radius: 100px;
		transition: background-color 0.2s ease, transform 0.2s ease;
		flex-shrink: 0;
	}

	.ka-toggle-switch::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 4px;
		transform: translateY(-50%);
		background-color: white;
		border-radius: 50%;
		transition: transform 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
		flex-shrink: 0;
	}

	.ka-toggle-switch.checked {
		background-color: var(--interactive-accent);
	}

	.ka-toggle-switch.checked::after {
		transform: translateY(-50%) translateX(100%);
	}

	.ka-toggle-switch.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.ka-toggle-text {
		font-size: var(--font-ui-small);
		color: var(--text-normal);
		line-height: 1.4;
	}

	.ka-toggle-helper {
		font-size: var(--font-ui-smaller);
		color: var(--text-muted);
		line-height: 1.4;
		margin-left: calc(var(--toggle-width, 40px) + 0.75rem);
	}

	.ka-toggle-label:hover .ka-toggle-switch:not(.disabled) {
		background-color: var(--background-modifier-border-hover);
	}

	.ka-toggle-label:hover .ka-toggle-switch.checked:not(.disabled) {
		background-color: var(--interactive-accent-hover);
	}

	/* Size variants */
	.ka-toggle-wrapper--small .ka-toggle-switch {
		width: 32px;
		height: 18px;
	}

	.ka-toggle-wrapper--small .ka-toggle-switch::after {
		width: 12px;
		height: 12px;
		left: 3px;
	}

	.ka-toggle-wrapper--medium .ka-toggle-switch {
		width: 40px;
		height: 22px;
	}

	.ka-toggle-wrapper--medium .ka-toggle-switch::after {
		width: 16px;
		height: 16px;
		left: 4px;
	}

	.ka-toggle-wrapper--large .ka-toggle-switch {
		width: 48px;
		height: 26px;
	}

	.ka-toggle-wrapper--large .ka-toggle-switch::after {
		width: 20px;
		height: 20px;
		left: 4px;
	}

	/* Focus visible */
	.ka-toggle-input:focus-visible + .ka-toggle-switch {
		outline: 2px solid var(--interactive-accent);
		outline-offset: 2px;
	}
</style>
