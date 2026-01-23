<script lang="ts">
	import { setIcon } from 'obsidian';
	import type { IconProps } from './Icon.types';

	/**
	 * The name of the Obsidian icon to display
	 */
	export let name: IconProps['name'];

	/**
	 * Optional size in pixels
	 */
	export let size: IconProps['size'] = 16;

	/**
	 * Optional color (CSS color value)
	 */
	export let color: IconProps['color'] = undefined;

	/**
	 * Additional CSS classes
	 */
	let className: string = '';
	export { className as class };

	/**
	 * Whether to flip the icon horizontally
	 */
	export let flipHorizontal: IconProps['flipHorizontal'] = false;

	/**
	 * Whether to flip the icon vertically
	 */
	export let flipVertical: IconProps['flipVertical'] = false;

	/**
	 * Rotation in degrees
	 */
	export let rotation: IconProps['rotation'] = 0;

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
			}
		};
	}

	$: transformStyle = `
		${flipHorizontal ? 'scaleX(-1)' : ''}
		${flipVertical ? 'scaleY(-1)' : ''}
		rotate(${rotation}deg)
	`.trim();
</script>

<span
	use:iconAction={name}
	class="ka-icon {className}"
	style="--icon-size: {size}px; --icon-color: {color}; --icon-transform: {transformStyle}"
></span>

<style>
	.ka-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--icon-size);
		height: var(--icon-size);
		color: var(--icon-color, currentColor);
		transform: var(--icon-transform);
	}

	:global(.ka-icon svg) {
		display: block;
		transition: transform 0.2s ease;
	}
</style>
