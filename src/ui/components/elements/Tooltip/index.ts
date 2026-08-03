import { default as TooltipProvider } from './Provider/component.svelte';
import { default as TooltipRoot } from './Root/component.svelte';
import { default as TooltipTrigger } from './Trigger/component.svelte';
import { default as TooltipContent } from './Content/component.svelte';
import { default as TooltipArrow } from './Arrow/component.svelte';
import { Tooltip } from 'bits-ui';

/**
 * Compound tooltip component built on bits-ui `Tooltip`.
 *
 * Usage:
 * ```svelte
 * <Tooltip.Provider delayDuration={200}>
 *   <Tooltip.Root>
 *     <Tooltip.Trigger class="ml-button">Hover me</Tooltip.Trigger>
 *     <Tooltip.Portal>
 *       <Tooltip.Content side="top" sideOffset={8}>
 *         Tooltip content
 *         <Tooltip.Arrow />
 *       </Tooltip.Content>
 *     </Tooltip.Portal>
 *   </Tooltip.Root>
 * </Tooltip.Provider>
 * ```
 *
 * Sub-components:
 * - `Provider` — sets shared delays and global enable/disable for all tooltips within.
 * - `Root` — holds open state; bindable `open` for controlled mode.
 * - `Trigger` — the hover target element (renders a `<button>` by default).
 * - `Content` — the floating tooltip panel; styled with Obsidian theme tokens.
 *   Use `forceMount` + `child` snippet for Svelte transitions.
 * - `Arrow` — optional pointer arrow pointing at the trigger.
 * - `Portal` — pass-through from bits-ui; portals content to the body.
 */
export default {
	Provider: TooltipProvider,
	Root: TooltipRoot,
	Trigger: TooltipTrigger,
	Content: TooltipContent,
	Arrow: TooltipArrow,
	Portal: Tooltip.Portal,
};
