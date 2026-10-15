/** How a review region is currently presented. */
export type OcclusionMaskStatus = 'hidden' | 'correct' | 'wrong' | 'selected' | 'missed';

/** One row of the end-of-card recap. */
export interface OcclusionRecapItem {
	answer: string;
	status: 'correct' | 'missed';
}
