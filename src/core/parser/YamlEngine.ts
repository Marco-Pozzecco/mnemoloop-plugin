import { VaultAdapter } from '@/obsidian/VaultAdapter';
import { DEFAULT_FSRS, ERROR_MESSAGES } from '@/utils/constants';
import { Logger } from '@/utils/Logger';
import { clampFsrsParameter, isValidFsrsState, isValidTimestamp } from '@/utils/validation';
import { v4 as uuid } from 'uuid';
import { FlashcardMetadata, FlashcardMetadataSchema } from '../indexer';
import { FSRSState, FSRSParams } from '@/core/srs/';
import { IYamlEngine } from './utils/contract';
import { CardStatus, YamlParseResult } from './utils/types';

/**
 * Utility for extracting and validating YAML frontmatter from flashcard files.
 * Uses Obsidian's CachedMetadata API for efficient extraction.
 */
export class YamlEngine implements IYamlEngine {
	private vaultAdapter: VaultAdapter;

	constructor(vaultAdapter: VaultAdapter) {
		this.vaultAdapter = vaultAdapter;
	}

	/**
	 * Extracts flashcard metadata from a file's YAML frontmatter.
	 *
	 * @param filePath Path to the markdown file
	 * @returns A YamlParseResult with metadata and any validation warnings
	 */
	async extract(filePath: string): Promise<YamlParseResult> {
		try {
			const metadata = await this.vaultAdapter.getCachedMetadata(filePath);

			if (!metadata || !metadata.frontmatter) {
				return {
					metadata: undefined,
					warnings: undefined,
					success: false,
					error: ERROR_MESSAGES.INVALID_YAML,
				};
			}

			const fm = metadata.frontmatter;
			const warnings: string[] = [];

			const flashcardMetadata: FlashcardMetadata = {
				uuid: this.extractUuid(filePath, fm),
				file: filePath,
				source: this.extractSource(fm),
				status: this.extractStatus(fm),
				created_at: this.extractTimestamp(fm, 'created') || new Date().toISOString(),
				updated_at: this.extractTimestamp(fm, 'updated') || new Date().toISOString(),
				deleted_at: this.extractTimestamp(fm, 'deleted_at'),
				srs: this.extractAndValidateFSRS(fm, warnings),
			};

			return {
				error: undefined,
				success: true,
				metadata: flashcardMetadata,
				warnings: warnings,
			};
		} catch (error) {
			return {
				metadata: undefined,
				warnings: undefined,
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error extracting YAML',
			};
		}
	}

	async generateYaml(metadata: FlashcardMetadata): Promise<string> {
		const lines: string[] = [];

		const entries = Object.entries(metadata);

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

	private extractUuid(filePath: string, frontmatter: Record<string, any>): string {
		if (frontmatter.uuid && typeof frontmatter.uuid === 'string') {
			return frontmatter.uuid;
		}
		const match = filePath.match(/([a-f0-9-]{36})\.md$/);
		if (match) {
			return match[1];
		}
		return uuid();
	}

	/**
	 * Extracts source note wiki-link from frontmatter.
	 */
	private extractSource(frontmatter: Record<string, any>): string {
		const source = frontmatter.source;
		if (typeof source === 'string' && source.length > 0) {
			return source;
		}
		return '[[unknown]]';
	}

	/**
	 * Extracts card status from frontmatter.
	 */
	private extractStatus(frontmatter: Record<string, any>): CardStatus {
		const status = frontmatter.status;
		if (typeof status === 'string' && Object.values(CardStatus).includes(status as CardStatus)) {
			return status as CardStatus;
		}
		return CardStatus.ACTIVE;
	}

	/**
	 * Extracts and validates a timestamp from frontmatter.
	 */
	private extractTimestamp(frontmatter: Record<string, any>, field: string): string | null {
		const value = frontmatter[field];
		if (value === null || value === undefined) {
			return null;
		}
		if (typeof value === 'string' && isValidTimestamp(value)) {
			return value;
		}
		return null;
	}

	/**
	 * Orchestrates FSRS parameter extraction and validation.
	 */
	private extractAndValidateFSRS(frontmatter: Record<string, any>, warnings: string[]): FSRSParams {
		const params = FlashcardMetadataSchema.parse(frontmatter);

		return this.validateFSRS(params.srs, warnings);
	}

	/**
	 * Validates and clamps FSRS parameters to allowed ranges.
	 *
	 * @param rawParams Partially extracted FSRS parameters
	 * @param warnings Array to collect validation warnings
	 * @returns Validated FSRSStats object
	 */
	validateFSRS(rawParams: Partial<FSRSParams>, warnings: string[]): FSRSParams {
		const params: FSRSParams = { ...DEFAULT_FSRS };

		Logger.info('Validating FSRS parameters', rawParams);

		if (rawParams.stability !== undefined) {
			const clamped = clampFsrsParameter(rawParams.stability);
			if (clamped !== rawParams.stability) {
				Logger.warn(`stability clamped from ${rawParams.stability} to ${clamped}`);
			}
			params.stability = clamped;
		}

		if (rawParams.difficulty !== undefined) {
			const clamped = clampFsrsParameter(rawParams.difficulty);
			if (clamped !== rawParams.difficulty) {
				Logger.warn(`difficulty clamped from ${rawParams.difficulty} to ${clamped}`);
			}
			params.difficulty = clamped;
		}

		if (rawParams.state !== undefined) {
			if (isValidFsrsState(rawParams.state)) {
				params.state = rawParams.state;
			} else {
				Logger.warn(`invalid state ${rawParams.state}, using default ${FSRSState.New}`);
				params.state = FSRSState.New;
			}
		}

		if (rawParams.last_review !== undefined) {
			if (rawParams.last_review === null || isValidTimestamp(rawParams.last_review)) {
				params.last_review = rawParams.last_review;
			} else {
				Logger.warn(`invalid last_review timestamp, using null`);
				params.last_review = null;
			}
		}

		if (rawParams.next_review !== undefined && isValidTimestamp(rawParams.next_review)) {
			params.next_review = rawParams.next_review;
		} else {
			Logger.warn(`invalid next_review timestamp, using default`);
			params.next_review = new Date().toISOString();
		}

		if (rawParams.reps !== undefined) {
			params.reps = Math.max(0, Math.floor(rawParams.reps));
		}

		return params;
	}
}
