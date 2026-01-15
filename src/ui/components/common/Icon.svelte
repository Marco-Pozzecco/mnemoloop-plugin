<script lang="ts">
  import { setIcon } from 'obsidian';
  
  /**
   * The name of the Obsidian icon to display
   */
  export let name: string;
  
  /**
   * Optional size in pixels
   */
  export let size: number = 16;
  
  /**
   * Additional CSS classes
   */
  let className: string = '';
  export { className as class };

  function iconAction(node: HTMLElement, iconName: string) {
    setIcon(node, iconName);
    
    // Adjust SVG size if needed
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
</script>

<span 
  use:iconAction={name} 
  class="ka-icon {className}" 
  style="--icon-size: {size}px"
></span>

<style>
  .ka-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--icon-size);
    height: var(--icon-size);
    color: currentColor;
  }

  :global(.ka-icon svg) {
    display: block;
  }
</style>
