import { default as NavigationMenuRoot } from './Root/component.svelte';
import { default as NavigationMenuSub } from './Sub/component.svelte';
import { default as NavigationMenuList } from './List/component.svelte';
import { default as NavigationMenuItem } from './Item/component.svelte';
import { default as NavigationMenuTrigger } from './Trigger/component.svelte';
import { default as NavigationMenuContent } from './Content/component.svelte';
import { default as NavigationMenuLink } from './Link/component.svelte';
import { default as NavigationMenuIndicator } from './Indicator/component.svelte';
import { default as NavigationMenuViewport } from './Viewport/component.svelte';

export default {
	Root: NavigationMenuRoot,
	Sub: NavigationMenuSub,
	List: NavigationMenuList,
	Item: NavigationMenuItem,
	Trigger: NavigationMenuTrigger,
	Content: NavigationMenuContent,
	Link: NavigationMenuLink,
	Indicator: NavigationMenuIndicator,
	Viewport: NavigationMenuViewport,
};
