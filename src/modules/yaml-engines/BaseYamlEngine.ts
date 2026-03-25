import { IYamlEngine, YamlParseResult } from "@/interfaces/IYamlEngine";
import { $ZodTypeInternals } from "zod/v4/core";
import { ERROR_MESSAGES } from "@/utils/constants";
import { ZodType } from "zod";
import { normalizePath, parseYaml, Plugin } from "obsidian";
import { EventBus } from '@/modules/event-bus/EventBus'
import { EventType, EventData } from '@/types/events'

export abstract class BaseYamlEngine<T extends Record<string, unknown>> implements IYamlEngine<T> {
  protected _plugin: Plugin;
  protected _schema: ZodType<T, unknown, $ZodTypeInternals<T, unknown>>;
  protected _yamlRegex = /^---\n[\s\S]*?\n---\n?/;

  constructor(plugin: Plugin, schema: ZodType<T>) {
    this._plugin = plugin;
    this._schema = schema;
    EventBus.instance.subscribe(this.handleEvent.bind(this))
  }

  abstract recover: (filepath: string) => Promise<void>;

  async extractFromFile(filepath: string): Promise<YamlParseResult<T>> {
    try {
      const normalizedFilepath = normalizePath(filepath);
      const file = this._plugin.app.vault.getFileByPath(normalizedFilepath);

      if (!file) {
        return {
          error: "file not found",
          metadata: undefined,
          success: false
        }
      }

      const metadata = this._plugin.app.metadataCache.getFileCache(file);

      if (!metadata || !metadata.frontmatter) {
        return {
          metadata: undefined,
          success: false,
          error: ERROR_MESSAGES.INVALID_YAML,
        };
      }

      const fm = metadata.frontmatter;
      const entityMetadata = this.validate(fm)

      return {
        error: undefined,
        success: true,
        metadata: entityMetadata,
      };
    } catch (e) {
      return {
        metadata: undefined,
        success: false,
        error: e instanceof Error ? e.message : 'unknown error extracting yaml',
      };
    }
  };

  extractFromContent: (content: string) => YamlParseResult<T> & { content: string; } = (content) => {
    try {
      const match = content.match(this._yamlRegex)

      if (!match) {
        return {
          success: false,
          metadata: undefined,
          error: ERROR_MESSAGES.INVALID_YAML,
          content,
        }
      }

      const yamlContent = match[0]
        .replace(/^---\n/, '')
        .replace(/\n---\n?$/, '');

      const frontmatter = parseYaml(yamlContent);
      const metadata = this.validate(frontmatter);
      const cleanContent = this.removeFrontmatter(content);

      return {
        content: cleanContent,
        metadata,
        error: undefined,
        success: true
      }

    } catch (error) {
      return {
        content,
        metadata: undefined,
        error: error instanceof Error ? error.message : "unknown error extracting yaml from content",
        success: false
      }
    }
  };

  async write(filepath: string, data: T): Promise<void> {
    const normalizedFilepath = normalizePath(filepath);
    const fullContent = await this._plugin.app.vault.adapter.read(normalizedFilepath);
    const bodyContent = this.removeFrontmatter(fullContent);
    const yamlFrontmatter = this.generateYamlString(data);
    const newContent = yamlFrontmatter + '\n' + bodyContent;
    await this._plugin.app.vault.adapter.write(normalizedFilepath, newContent);
  }

  validate(data: Record<string, unknown>) {
    return this._schema.parse(data);
  };

  removeFrontmatter(content: string): string {
    const match = content.match(this._yamlRegex);
    return match ? content.slice(match[0].length) : content;
  }

  generateYamlString(data: T) {
    const lines: string[] = [];

    const entries = Object.entries(data);

    lines.push('---');

    for (const [key, value] of entries) {
      if (typeof value === 'object') {
        lines.push(`${key}: ${JSON.stringify(value)}`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    }

    lines.push('---');

    return lines.join('\n');
  }

  private handleEvent(event: EventData<unknown>): void {
    if (event.event_type === EventType.Review) {
      const typedData = event as EventData<T>
      const entity = typedData.entity as Record<string, unknown>
      const hasFile = Object.prototype.hasOwnProperty.call(entity, "file")
      if (!hasFile) return
      const frontmatter = this.validate(entity)
      this.write(entity.file as string, frontmatter)
    }
  }
}
