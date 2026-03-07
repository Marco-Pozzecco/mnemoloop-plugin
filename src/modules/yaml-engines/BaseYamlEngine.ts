import { IYamlEngine, YamlParseResult } from "@/interfaces/IYamlEngine";
import { VaultAdapter } from "../obsidian";
import { $ZodTypeInternals } from "zod/v4/core";
import { ERROR_MESSAGES } from "@/utils/constants";
import { ZodType } from "zod";
import { parseYaml } from "obsidian";

export class BaseYamlEngine<T extends Record<string, unknown>> implements IYamlEngine<T> {
  vaultAdapter: VaultAdapter;
  schema: ZodType<T, unknown, $ZodTypeInternals<T, unknown>>;
  private yamlRegex = /^---\n[\s\S]*?\n---\n?/

  constructor(vaultAdapter: VaultAdapter, schema: ZodType<T>) {
    this.vaultAdapter = vaultAdapter;
    this.schema = schema
  }

  async extractFromFile(filepath: string): Promise<YamlParseResult<T>> {
    try {
      const metadata = await this.vaultAdapter.getCachedMetadata(filepath);

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
      const match = content.match(this.yamlRegex)

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
    const fullContent = await this.vaultAdapter.readFile(filepath);
    const bodyContent = this.removeFrontmatter(fullContent);
    const yamlFrontmatter = this.generateYamlString(data);
    const newContent = yamlFrontmatter + '\n' + bodyContent;
    await this.vaultAdapter.writeFile(filepath, newContent);
  }

  validate(data: Record<string, unknown>) {
    return this.schema.parse(data);
  };

  removeFrontmatter(content: string): string {
    const match = content.match(this.yamlRegex);
    return match ? content.slice(match[0].length) : content;
  }

  private generateYamlString(data: T) {
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

}
