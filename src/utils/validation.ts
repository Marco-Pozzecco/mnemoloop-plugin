import { FSRSState } from '../core/srs/types';

export function clampFsrsParameter(value: number): number {
  return Math.max(0.0, Math.min(10.0, value));
}

export function isValidTimestamp(timestamp: string | null): boolean {
  if (timestamp === null) return true;
  try {
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

export function isValidFsrsState(state: number): boolean {
  return Object.values(FSRSState).includes(state);
}
