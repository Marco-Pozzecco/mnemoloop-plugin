import type { FlashcardOcclusionContent, FlashcardOcclusionMask } from '@/schemas';
import { CardType } from '@/schemas';

export type NormalizedRect = [number, number, number, number];

/** A mask side smaller than this fraction of the image is not allowed. */
export const MIN_MASK_SIZE = 0.01;

export const RESIZE_HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;
export type ResizeHandle = (typeof RESIZE_HANDLES)[number];

export interface EditableOcclusionMask {
	id: string;
	rect: NormalizedRect;
	answer: string;
	hint: string;
	opaque: boolean;
}

export interface ImageDimensions {
	width?: number;
	height?: number;
}

/**
 * Returns null when the card can be submitted, or the message to show.
 */
export function validateOcclusion(image: string, masks: EditableOcclusionMask[]): string | null {
	if (!image.trim()) return 'An image is required.';
	if (masks.length === 0) return 'At least one mask is required.';

	const emptyIndex = masks.findIndex((mask) => !mask.answer.trim());
	if (emptyIndex !== -1) return `Mask ${emptyIndex + 1} must have an answer.`;

	return null;
}

export function buildOcclusionContent(
	image: string,
	dimensions: ImageDimensions,
	masks: EditableOcclusionMask[],
): FlashcardOcclusionContent {
	const content: Record<string, unknown> = {
		meta_type: CardType.Occlusion,
		image,
		masks: masks.map((mask, index) => ({
			id: `m${index + 1}`,
			rect: mask.rect,
			answer: mask.answer.trim(),
			hint: mask.hint.trim() || null,
			opaque: mask.opaque,
		})) satisfies FlashcardOcclusionMask[],
	};

	if (dimensions.width !== undefined) content.width = dimensions.width;
	if (dimensions.height !== undefined) content.height = dimensions.height;

	return content as unknown as FlashcardOcclusionContent;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/** Four decimals is the precision the body serializer writes. */
function round4(value: number): number {
	return Math.round(value * 10000) / 10000;
}

/** Build a normalized rect from two normalized drag points, in any direction. */
export function rectFromPoints(
	start: { x: number; y: number },
	end: { x: number; y: number },
): NormalizedRect {
	const left = clamp(Math.min(start.x, end.x), 0, 1);
	const top = clamp(Math.min(start.y, end.y), 0, 1);
	const right = clamp(Math.max(start.x, end.x), 0, 1);
	const bottom = clamp(Math.max(start.y, end.y), 0, 1);

	return [round4(left), round4(top), round4(right - left), round4(bottom - top)];
}

/** Move a rect by a normalized delta, keeping it inside the image bounds. */
export function translateRect(
	rect: NormalizedRect,
	deltaX: number,
	deltaY: number,
): NormalizedRect {
	const [x, y, width, height] = rect;

	return [
		round4(clamp(x + deltaX, 0, 1 - width)),
		round4(clamp(y + deltaY, 0, 1 - height)),
		width,
		height,
	];
}

/**
 * Resize a rect by dragging one handle to a normalized point. Only the edges
 * the handle belongs to move; the dragged edges stop at the image bounds or at
 * `MIN_MASK_SIZE`, so a drag can never flip or invert the rect.
 */
export function resizeRect(
	rect: NormalizedRect,
	handle: ResizeHandle,
	point: { x: number; y: number },
): NormalizedRect {
	const pointerX = clamp(point.x, 0, 1);
	const pointerY = clamp(point.y, 0, 1);

	let left = clamp(rect[0], 0, 1);
	let top = clamp(rect[1], 0, 1);
	let right = clamp(rect[0] + rect[2], 0, 1);
	let bottom = clamp(rect[1] + rect[3], 0, 1);

	if (handle.includes('w')) left = clamp(pointerX, 0, Math.max(0, right - MIN_MASK_SIZE));
	if (handle.includes('e')) right = clamp(pointerX, Math.min(left + MIN_MASK_SIZE, 1), 1);
	if (handle.includes('n')) top = clamp(pointerY, 0, Math.max(0, bottom - MIN_MASK_SIZE));
	if (handle.includes('s')) bottom = clamp(pointerY, Math.min(top + MIN_MASK_SIZE, 1), 1);

	return [round4(left), round4(top), round4(right - left), round4(bottom - top)];
}
