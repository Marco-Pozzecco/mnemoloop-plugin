/**
 * Gesture action for Svelte components
 *
 * Supports touch gestures: swipe (left/right/up/down), tap, long press
 */

export interface GestureOptions {
  /** Callback for swipe left gesture */
  onSwipeLeft?: (event: TouchEvent) => void;
  /** Callback for swipe right gesture */
  onSwipeRight?: (event: TouchEvent) => void;
  /** Callback for swipe up gesture */
  onSwipeUp?: (event: TouchEvent) => void;
  /** Callback for swipe down gesture */
  onSwipeDown?: (event: TouchEvent) => void;
  /** Callback for tap gesture */
  onTap?: (event: TouchEvent) => void;
  /** Callback for long press gesture */
  onLongPress?: (event: TouchEvent) => void;
  /** Minimum distance (in pixels) to trigger a swipe */
  swipeThreshold?: number;
  /** Duration (in ms) to trigger long press */
  longPressDuration?: number;
  /** Maximum duration (in ms) to trigger tap */
  tapMaxDuration?: number;
  /** Maximum distance (in pixels) for a tap to still count */
  tapMaxDistance?: number;
}

const DEFAULT_OPTIONS: Required<Omit<GestureOptions, 'onSwipeLeft' | 'onSwipeRight' | 'onSwipeUp' | 'onSwipeDown' | 'onTap' | 'onLongPress'>> = {
  swipeThreshold: 50,
  longPressDuration: 500,
  tapMaxDuration: 200,
  tapMaxDistance: 10,
};

export function gesture(
  node: HTMLElement,
  options: GestureOptions = {}
): { destroy: () => void } {
  const config = { ...DEFAULT_OPTIONS, ...options };

  // Track touch state
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let hasMoved = false;
  let longPressTimer: NodeJS.Timeout | null = null;
  let isLongPressTriggered = false;

  // Clean up function
  function destroy() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  // Touch start handler
  function handleTouchStart(event: TouchEvent) {
    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = Date.now();
    hasMoved = false;
    isLongPressTriggered = false;

    // Start long press timer
    if (config.onLongPress) {
      longPressTimer = setTimeout(() => {
        isLongPressTriggered = true;
        config.onLongPress!(event);
      }, config.longPressDuration);
    }
  }

  // Touch move handler
  function handleTouchMove(event: TouchEvent) {
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - startX);
    const deltaY = Math.abs(touch.clientY - startY);

    // Check if movement exceeds tap threshold
    if (!hasMoved && (deltaX > config.tapMaxDistance || deltaY > config.tapMaxDistance)) {
      hasMoved = true;
    }

    // If moved too far, cancel long press
    if (deltaX > config.tapMaxDistance || deltaY > config.tapMaxDistance) {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }
  }

  // Touch end handler
  function handleTouchEnd(event: TouchEvent) {
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    // Don't process if long press was triggered
    if (isLongPressTriggered) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    const deltaTime = Date.now() - startTime;

    // Check for tap
    if (!hasMoved && deltaTime <= config.tapMaxDuration && config.onTap) {
      config.onTap(event);
      return;
    }

    // Check for swipe gestures
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine if horizontal or vertical swipe (whichever is greater)
    if (absDeltaX > absDeltaY && absDeltaX > config.swipeThreshold) {
      // Horizontal swipe
      if (deltaX > 0 && config.onSwipeRight) {
        config.onSwipeRight(event);
      } else if (deltaX < 0 && config.onSwipeLeft) {
        config.onSwipeLeft(event);
      }
    } else if (absDeltaY > config.swipeThreshold) {
      // Vertical swipe
      if (deltaY > 0 && config.onSwipeDown) {
        config.onSwipeDown(event);
      } else if (deltaY < 0 && config.onSwipeUp) {
        config.onSwipeUp(event);
      }
    }
  }

  // Register event listeners
  node.addEventListener('touchstart', handleTouchStart, { passive: true });
  node.addEventListener('touchmove', handleTouchMove, { passive: true });
  node.addEventListener('touchend', handleTouchEnd, { passive: true });
  node.addEventListener('touchcancel', destroy, { passive: true });

  // Return cleanup function
  return {
    destroy() {
      node.removeEventListener('touchstart', handleTouchStart);
      node.removeEventListener('touchmove', handleTouchMove);
      node.removeEventListener('touchend', handleTouchEnd);
      node.removeEventListener('touchcancel', destroy);
      destroy();
    },
  };
}
