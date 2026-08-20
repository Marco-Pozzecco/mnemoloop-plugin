<script lang="ts">
	import { setIcon } from 'obsidian';
	import type IconProps from './types';

	let {
		name,
		size = 16,
		color,
		class: className = '',
		flipHorizontal = false,
		flipVertical = false,
		rotation = 0,
	}: IconProps = $props();

	function iconAction(node: HTMLElement, iconName: string) {
		setIcon(node, iconName);

		const svg = node.querySelector('svg');
		if (svg) {
			svg.setAttribute('width', size.toString());
			svg.setAttribute('height', size.toString());
		}

		return {
			update(newIconName: string) {
				setIcon(node, newIconName);
				const newSvg = node.querySelector('svg');
				if (newSvg) {
					newSvg.setAttribute('width', size.toString());
					newSvg.setAttribute('height', size.toString());
				}
			},
		};
	}

	const transformStyle = $derived(
		`
		${flipHorizontal ? 'scaleX(-1)' : ''}
		${flipVertical ? 'scaleY(-1)' : ''}
		rotate(${rotation}deg)
	`.trim(),
	);
</script>

<span style="--icon-size: {size}px; --icon-color: {color}; --icon-transform: {transformStyle}">
	<span use:iconAction={name} class="ml-icon {className}"></span>
</span>

<style lang="scss">
	@use 'tokens' as *;

	.ml-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--icon-size);
		height: var(--icon-size);
		color: var(--icon-color, currentColor);
		transform: var(--icon-transform);
	}

	:global(.ml-icon svg) {
		display: block;
		transition: transform 0.2s ease;
	}
</style>
