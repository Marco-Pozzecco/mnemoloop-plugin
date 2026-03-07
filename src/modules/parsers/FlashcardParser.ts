import { VaultAdapter } from '@/modules/obsidian/VaultAdapter';
import { ERROR_MESSAGES } from '@/utils/constants';
import type { Flashcard, FlashcardMetadata } from '@/schemas';
import type { ContentSplitResult, ParserSettings } from './utils/types';
import { PluginSettings } from '@/modules/obsidian/schema/SettingsSchema';
import { ParseResult } from '@/interfaces/IParser';
import { FlashcardYamlEngine } from '../yaml-engines/FlashcardYamlEngine';
import { BaseParser } from './BaseParser';

export class FlashcardParser extends BaseParser<Flashcard, FlashcardMetadata> {
  private settings: ParserSettings;

  /**
   * @param vaultAdapter Adapter for Obsidian Vault operations
   * @param settings Optional parser settings (directory, marker)
   */
  constructor(vaultAdapter: VaultAdapter, settings?: Partial<PluginSettings>) {
    super(vaultAdapter, new FlashcardYamlEngine(vaultAdapter))
    this.settings = {
      flashcard_directory: settings?.flashcardsDirectory ?? '/flashcards/',
      marker: '?',
    };
  }

  /**
   * Parses a flashcard file into a structured Flashcard object.
   * Results are cached to improve performance.
   *
   * @param filepath Path to the markdown file in the vault
   * @param forceRefresh If true, bypasses the cache
   * @returns A ParseResult containing the flashcard or an error
   */
  parse = async (filepath: string, forceRefresh = false): Promise<ParseResult<Flashcard>> => {
    if (!forceRefresh) {
      const cached = this.cache.get(filepath);
      if (cached) {
        return {
          entity: cached,
          error: undefined,
          success: true
        };
      }
    }

    try {
      const content = await this.vaultAdapter.readFile(filepath);
      const result = this.yaml.extractFromContent(content);

      if (!result.success || !result.metadata) {
        const errorResult = {
          success: false,
          error: result.error || ERROR_MESSAGES.INVALID_YAML,
        } as ParseResult<Flashcard>;

        this.cache.delete(filepath);

        return errorResult;
      }

      const bodyContent = result.content;
      const splitResult = this.splitContent(bodyContent)

      if (!splitResult.success || !splitResult.front) {
        const errorResult = {
          success: false,
          error: splitResult.error || ERROR_MESSAGES.MISSING_MARKER,
        } as const as ParseResult<Flashcard>;

        this.cache.delete(filepath);

        return errorResult;
      }

      const flashcard: Flashcard = {
        ...result.metadata,
        front: splitResult.front ?? "",
        back: splitResult.back ?? "",
      };

      const successResult = {
        success: true,
        entity: flashcard,
        error: undefined,
      } as ParseResult<Flashcard>;

      this.cache.set(filepath, flashcard);

      return successResult;
    } catch (error) {
      return {
        entity: undefined,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error parsing flashcard',
      };
    }
  }

  /**
   * Splits the body content into front and back parts using the configured marker.
   *
   * @param content Full content of the markdown file
   * @returns A ContentSplitResult containing front and back content
   */
  private splitContent(content: string): ContentSplitResult {
    try {
      const bodyContent = this.yaml.removeFrontmatter(content);
      const marker = this.settings.marker;

      const markerIndex = bodyContent.indexOf(marker);

      if (markerIndex === -1) {
        return {
          success: false,
          error: ERROR_MESSAGES.MISSING_MARKER,
        };
      }

      const front = bodyContent.substring(0, markerIndex).trim();
      const back = bodyContent.substring(markerIndex + marker.length).trim();

      return {
        success: true,
        front,
        back,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error splitting content',
      };
    }
  }
}
