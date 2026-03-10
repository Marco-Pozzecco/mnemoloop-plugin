import { ERROR_MESSAGES } from '@/utils/constants';
import type { Flashcard, FlashcardMetadata } from '@/schemas';
import { ParseResult } from '@/interfaces/IParser';
import { FlashcardYamlEngine } from '../yaml-engines/FlashcardYamlEngine';
import { BaseParser } from './BaseParser';
import { normalizePath, Plugin } from 'obsidian';
import { IAdapter } from '@/interfaces/IAdapter';
import { PluginSettings } from '@/schemas/settings';

export class FlashcardParser extends BaseParser<Flashcard, FlashcardMetadata> {
  private _settings: IAdapter<PluginSettings>;
  private _dirPath: string;

  constructor(plugin: Plugin, settings: IAdapter<PluginSettings>) {
    super(plugin, new FlashcardYamlEngine(plugin));
    this._settings = settings;
    this._dirPath = normalizePath(this._settings.data.flashcardsDirectory)
  }

  parse = async (filepath: string): Promise<ParseResult<Flashcard>> => {
    try {
      const normalizedPath = normalizePath(filepath);
      const content = await this.plugin.app.vault.adapter.read(normalizedPath);
      const result = this.yaml.extractFromContent(content);

      if (!result.success || !result.metadata) {
        const errorResult = {
          success: false,
          error: result.error || ERROR_MESSAGES.INVALID_YAML,
        } as ParseResult<Flashcard>;
        return errorResult;
      }

      const bodyContent = result.content;
      const splitResult = this.splitContent(bodyContent)

      const flashcard: Flashcard = {
        ...result.metadata,
        front: splitResult.front,
        back: splitResult.back,
      };

      const successResult = {
        success: true,
        entity: flashcard,
        error: undefined,
      } as ParseResult<Flashcard>;

      return successResult;
    } catch (error) {
      return {
        entity: undefined,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error parsing flashcard',
      };
    }
  }

  parseAll = async (): Promise<ParseResult<Flashcard>[]> => {
    const dirExists = await this.plugin.app.vault.adapter.exists(this._dirPath);

    if (!dirExists) {
      return [];
    }

    const { files } = await this.plugin.app.vault.adapter.list(this._dirPath);
    const mdFiles = files.filter(f => f.endsWith(".md"));

    const results = [];

    for (const file of mdFiles) {
      const result = await this.parse(file);
      results.push(result);
    }

    return results;
  }

  /**
   * Splits the body content into front and back parts using the configured marker.
   *
   * @param content Full content of the markdown file
   * @returns A ContentSplitResult containing front and back content
   */
  private splitContent(content: string): { front: string, back: string } {
    const bodyContent = this.yaml.removeFrontmatter(content);
    const marker = this._settings.data.flashcardMarker;

    const markerIndex = bodyContent.indexOf(marker);

    if (markerIndex === -1) {
      throw new Error(ERROR_MESSAGES.MISSING_MARKER)
    }

    const front = bodyContent.substring(0, markerIndex).trim();
    const back = bodyContent.substring(markerIndex + marker.length).trim();

    return {
      front,
      back,
    };
  }
}
