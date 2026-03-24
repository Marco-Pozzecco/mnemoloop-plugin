import { Logger } from '@/utils/Logger';
import { ItemView, Plugin, WorkspaceLeaf } from 'obsidian';
import { default as Home } from './App.svelte';
import { AppProps } from './types';
import { Indexes } from '@/types/indexes';
import { mount, unmount } from 'svelte';

export const APP_VIEW = 'knowledge-accelerator-home';

export class AppView extends ItemView {
  private _plugin: Plugin;
  private _indexes: Indexes;
  private _component: ReturnType<typeof mount> | null = null;
  protected viewType: string = APP_VIEW;

  constructor(
    plugin: Plugin,
    leaf: WorkspaceLeaf,
    indexes: Indexes
  ) {
    super(leaf);
    this._plugin = plugin;
    this._indexes = indexes;
  }

  /**
   * Returns the view type identifier
   */
  getViewType(): string {
    return APP_VIEW;
  }

  /**
   * Returns the display name for the view
   */
  getDisplayText(): string {
    return 'Knowledge Accelerator';
  }

  /**
   * Returns the icon for the view
   */
  getIcon(): string {
    return 'brain';
  }

  /**
   * Called when the view is opened in the workspace
   */
  async onOpen(): Promise<void> {
    try {
      Logger.info('Opening Knowledge Accelerator view');

      // Load the Svelte component
      this._component = mount(Home, {
        target: this.contentEl,
        props: {
          indexes: this._indexes,
          plugin: this._plugin
        } as AppProps
      });

      Logger.info('Knowledge Accelerator view opened successfully');
    } catch (error) {
      Logger.error('Failed to open Home view:', error);
      this.containerEl.createEl('div', { text: 'Failed to load Knowledge Accelerator' });
    }
  }

  /**
   * Called when the view is closed
   */
  async onClose(): Promise<void> {
    try {
      Logger.info('Closing Knowledge Accelerator view');

      // Clean up Svelte component
      if (this._component) {
        unmount(this._component);
        this._component = null;
      }

      Logger.info('Knowledge Accelerator view closed successfully');
    } catch (error) {
      Logger.error('Failed to close Home view:', error);
    }
  }
}
