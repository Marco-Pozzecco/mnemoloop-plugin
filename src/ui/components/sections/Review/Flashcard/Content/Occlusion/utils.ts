import type { FlashcardOcclusionMask } from '@/schemas';

export interface NormalizedPoint {
	x: number;
	y: number;
}

export interface NormalizedSize {
	width: number;
	height: number;
}

interface HitArea {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Grow a mask's rect until each side is at least `minSize`, keeping its centre.
 * Stored geometry stays exact; only hit testing uses the inflated area.
 */
function inflateRect(rect: FlashcardOcclusionMask['rect'], minSize: NormalizedSize): HitArea {
	const width = Math.max(rect[2], minSize.width);
	const height = Math.max(rect[3], minSize.height);
	const centreX = rect[0] + rect[2] / 2;
	const centreY = rect[1] + rect[3] / 2;

	return { x: centreX - width / 2, y: centreY - height / 2, width, height };
}

/**
 * Find the mask a normalized point selects. Masks smaller than `minSize` are
 * reachable through their inflated area; when inflated areas overlap, the mask
 * whose centre is nearest the point wins.
 */
export function hitTestMasks(
	masks: FlashcardOcclusionMask[],
	point: NormalizedPoint,
	minSize: NormalizedSize,
): FlashcardOcclusionMask | null {
	let best: FlashcardOcclusionMask | null = null;
	let bestDistance = Number.POSITIVE_INFINITY;

	for (const mask of masks) {
		const area = inflateRect(mask.rect, minSize);
		const inside =
			point.x >= area.x &&
			point.x <= area.x + area.width &&
			point.y >= area.y &&
			point.y <= area.y + area.height;
		if (!inside) continue;

		const centreX = area.x + area.width / 2;
		const centreY = area.y + area.height / 2;
		const distance = (point.x - centreX) ** 2 + (point.y - centreY) ** 2;

		if (distance < bestDistance) {
			bestDistance = distance;
			best = mask;
		}
	}

	return best;
}
