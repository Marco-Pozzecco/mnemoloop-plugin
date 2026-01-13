import { IVaultAdapter } from '@/obsidian/contracts/IVaultAdapter';
import { ERROR_MESSAGES } from '@/utils/constants';
import { clampFsrsParameter, isValidFsrsState, isValidTimestamp } from '@/utils/validation';
import { DEFAULT_FSRS, FSRSParameters, FSRSState } from '../srs/types';
import { CardStatus, FlashcardMetadata, YamlParseResult } from './types';

export class YamlExtractor {
	private vaultAdapter: IVaultAdapter;

	constructor(vaultAdapter: IVaultAdapter) {
		this.vaultAdapter = vaultAdapter;
	}

	async extract(filePath: string): Promise<YamlParseResult> {
		try {
			const metadata = await this.vaultAdapter.getCachedMetadata(filePath);

			if (!metadata || !metadata.frontmatter) {
				return {
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
				created: this.extractTimestamp(fm, 'created') || new Date().toISOString(),
				updated: this.extractTimestamp(fm, 'updated') || new Date().toISOString(),
				deleted_at: this.extractTimestamp(fm, 'deleted_at'),
				srs: this.extractAndValidateFSRS(fm, warnings),
			};

			return {
				success: true,
				metadata: flashcardMetadata,
				warnings: warnings.length > 0 ? warnings : undefined,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error extracting YAML',
			};
		}
	}

	private extractUuid(filePath: string, frontmatter: Record<string, any>): string {
		if (frontmatter.uuid && typeof frontmatter.uuid === 'string') {
			return frontmatter.uuid;
		}
		const match = filePath.match(/([a-f0-9-]{36})\.md$/);
		if (match) {
			return match[1];
		}
		return crypto.randomUUID();
	}

	private extractSource(frontmatter: Record<string, any>): string {
		const source = frontmatter.source;
		if (typeof source === 'string' && source.length > 0) {
			return source;
		}
		return '[[unknown]]';
	}

	private extractStatus(frontmatter: Record<string, any>): CardStatus {
		const status = frontmatter.status;
		if (typeof status === 'string' && Object.values(CardStatus).includes(status as CardStatus)) {
			return status as CardStatus;
		}
		return CardStatus.ACTIVE;
	}

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

	private extractAndValidateFSRS(
		frontmatter: Record<string, any>,
		warnings: string[],
	): FSRSParameters {
		const rawParams: Partial<FSRSParameters> = {};

		if (typeof frontmatter.srs_stability === 'number') {
			rawParams.stability = frontmatter.srs_stability;
		}
		if (typeof frontmatter.srs_difficulty === 'number') {
			rawParams.difficulty = frontmatter.srs_difficulty;
		}
		if (typeof frontmatter.srs_state === 'number') {
			rawParams.state = frontmatter.srs_state;
		}
		if (typeof frontmatter.srs_last_review === 'string' || frontmatter.srs_last_review === null) {
			rawParams.last_review = frontmatter.srs_last_review;
		}
		if (typeof frontmatter.srs_next_review === 'string') {
			rawParams.next_review = frontmatter.srs_next_review;
		}
		if (typeof frontmatter.srs_reps === 'number') {
			rawParams.reps = frontmatter.srs_reps;
		}

		return this.validateFSRS(rawParams, warnings);
	}

	validateFSRS(rawParams: Partial<FSRSParameters>, warnings: string[]): FSRSParameters {
		const params: FSRSParameters = { ...DEFAULT_FSRS };

		if (rawParams.stability !== undefined) {
			const clamped = clampFsrsParameter(rawParams.stability);
			if (clamped !== rawParams.stability) {
				warnings.push(`stability clamped from ${rawParams.stability} to ${clamped}`);
			}
			params.stability = clamped;
		}

		if (rawParams.difficulty !== undefined) {
			const clamped = clampFsrsParameter(rawParams.difficulty);
			if (clamped !== rawParams.difficulty) {
				warnings.push(`difficulty clamped from ${rawParams.difficulty} to ${clamped}`);
			}
			params.difficulty = clamped;
		}

		if (rawParams.state !== undefined) {
			if (isValidFsrsState(rawParams.state)) {
				params.state = rawParams.state as FSRSState;
			} else {
				warnings.push(`invalid state ${rawParams.state}, using default ${FSRSState.NEW}`);
				params.state = FSRSState.NEW;
			}
		}

		if (rawParams.last_review !== undefined) {
			if (rawParams.last_review === null || isValidTimestamp(rawParams.last_review)) {
				params.last_review = rawParams.last_review;
			} else {
				warnings.push(`invalid last_review timestamp, using null`);
				params.last_review = null;
			}
		}

		if (rawParams.next_review !== undefined && isValidTimestamp(rawParams.next_review)) {
			params.next_review = rawParams.next_review;
		} else {
			warnings.push(`invalid next_review timestamp, using default`);
			params.next_review = new Date().toISOString();
		}

		if (rawParams.reps !== undefined) {
			params.reps = Math.max(0, Math.floor(rawParams.reps));
		}

		return params;
	}
}
