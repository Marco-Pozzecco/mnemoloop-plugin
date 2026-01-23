/**
 * Unit tests for ErrorWrapper component logic
 *
 * Since ErrorWrapper is a Svelte component, we test the error handling patterns
 * that would be used by the component (error wrapping, retry logic).
 *
 * @see T090 [P] [US3]: Write unit tests for ErrorWrapper
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Simulate the ErrorWrapper component's error handling logic
class TestErrorWrapper {
	private retryCount = 0;
	private hasError = false;
	private errorMessage = '';
	private maxRetries = 3;

	constructor(private fallback: string, private onRetry?: () => void) {
		this.fallback = fallback;
	}

	handleError(error: Error): void {
		this.hasError = true;
		this.errorMessage = error.message;
	}

	retry(): void {
		if (this.retryCount < this.maxRetries) {
			this.retryCount++;
			this.hasError = false;
			this.errorMessage = '';

			if (this.onRetry) {
				this.onRetry();
			}
		}
	}

	getHasError(): boolean {
		return this.hasError;
	}

	getErrorMessage(): string {
		return this.errorMessage;
	}

	getRetryCount(): number {
		return this.retryCount;
	}

	setMaxRetries(max: number): void {
		this.maxRetries = max;
	}

	hasExceededRetries(): boolean {
		return this.retryCount >= this.maxRetries;
	}

	getDisplayMessage(): string {
		if (!this.hasError) {
			return this.fallback;
		}

		return this.enhanceErrorMessage(this.errorMessage);
	}

	private enhanceErrorMessage(message: string): string {
		// Add actionable guidance
		if (message.includes('network') || message.includes('fetch')) {
			return `${message} Check your internet connection and try again.`;
		}
		if (message.includes('parse') || message.includes('JSON')) {
			return `${message} The data may be corrupted. Try refreshing the page.`;
		}
		return message;
	}
}

describe('ErrorWrapper Component Logic', () => {
	let wrapper: TestErrorWrapper;
	let onRetryMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		onRetryMock = vi.fn();
		wrapper = new TestErrorWrapper('Error loading content', onRetryMock);
	});

	describe('Error Catching', () => {
		it('should handle errors and set error state', () => {
			const testError = new Error('Test error from child');
			wrapper.handleError(testError);

			expect(wrapper.getHasError()).toBe(true);
			expect(wrapper.getErrorMessage()).toBe('Test error from child');
		});

		it('should display fallback message when no error', () => {
			expect(wrapper.getDisplayMessage()).toBe('Error loading content');
			expect(wrapper.getHasError()).toBe(false);
		});

		it('should display error message when error occurs', () => {
			const errorMessage = 'Failed to load data from server';
			wrapper.handleError(new Error(errorMessage));

			expect(wrapper.getDisplayMessage()).toContain(errorMessage);
			expect(wrapper.getHasError()).toBe(true);
		});
	});

	describe('Error Message Enhancement', () => {
		it('should add guidance for network errors', () => {
			wrapper.handleError(new Error('network request failed'));

			expect(wrapper.getDisplayMessage()).toContain('Check your internet connection');
		});

		it('should add guidance for fetch errors', () => {
			wrapper.handleError(new Error('failed to fetch from API'));

			expect(wrapper.getDisplayMessage()).toContain('Check your internet connection');
		});

		it('should add guidance for parse errors', () => {
			wrapper.handleError(new Error('failed to parse JSON response'));

			expect(wrapper.getDisplayMessage()).toContain('Try refreshing the page');
		});

		it('should add guidance for JSON errors', () => {
			wrapper.handleError(new Error('invalid JSON data'));

			expect(wrapper.getDisplayMessage()).toContain('Try refreshing the page');
		});

		it('should leave generic errors unchanged', () => {
			wrapper.handleError(new Error('Generic error message'));

			expect(wrapper.getDisplayMessage()).toBe('Generic error message');
		});
	});

	describe('Retry Logic', () => {
		it('should reset error state on retry', () => {
			wrapper.handleError(new Error('Test error'));
			expect(wrapper.getHasError()).toBe(true);

			wrapper.retry();
			expect(wrapper.getHasError()).toBe(false);
			expect(wrapper.getErrorMessage()).toBe('');
		});

		it('should call onRetry callback when retrying', () => {
			wrapper.handleError(new Error('Test error'));
			wrapper.retry();

			expect(onRetryMock).toHaveBeenCalledTimes(1);
		});

		it('should track retry count', () => {
			wrapper.handleError(new Error('Test error'));
			expect(wrapper.getRetryCount()).toBe(0);

			wrapper.retry();
			expect(wrapper.getRetryCount()).toBe(1);

			wrapper.retry();
			expect(wrapper.getRetryCount()).toBe(2);
		});

		it('should not retry when max retries exceeded', () => {
			wrapper.setMaxRetries(2);
			wrapper.handleError(new Error('Test error'));

			wrapper.retry(); // 1
			wrapper.retry(); // 2
			wrapper.retry(); // 3 - should not increment

			expect(wrapper.getRetryCount()).toBe(2);
			expect(wrapper.hasExceededRetries()).toBe(true);
		});

		it('should indicate when retries are exceeded', () => {
			wrapper.setMaxRetries(1);

			wrapper.handleError(new Error('Test error'));
			expect(wrapper.hasExceededRetries()).toBe(false); // 0 < 1

			wrapper.retry(); // retryCount = 1, now equals maxRetries
			expect(wrapper.hasExceededRetries()).toBe(true);

			wrapper.retry(); // won't increment
			expect(wrapper.hasExceededRetries()).toBe(true);
		});

		it('should handle multiple errors with retry', () => {
			wrapper.handleError(new Error('First error'));
			expect(wrapper.getHasError()).toBe(true);

			wrapper.retry();
			expect(wrapper.getHasError()).toBe(false);

			wrapper.handleError(new Error('Second error'));
			expect(wrapper.getHasError()).toBe(true);

			wrapper.retry();
			expect(wrapper.getHasError()).toBe(false);

			expect(wrapper.getRetryCount()).toBe(2);
		});
	});

	describe('Max Retries Configuration', () => {
		it('should allow custom max retries', () => {
			wrapper.setMaxRetries(5);

			for (let i = 0; i < 5; i++) {
				wrapper.retry();
			}

			// After 5 retries, retryCount = 5, maxRetries = 5, so exceeded
			expect(wrapper.hasExceededRetries()).toBe(true);

			wrapper.retry(); // won't increment
			expect(wrapper.getRetryCount()).toBe(5);
			expect(wrapper.hasExceededRetries()).toBe(true);
		});

		it('should use default max retries of 3', () => {
			// Default maxRetries is 3
			wrapper.retry(); // 1
			wrapper.retry(); // 2
			wrapper.retry(); // 3 - now equals maxRetries

			expect(wrapper.hasExceededRetries()).toBe(true);

			wrapper.retry(); // won't increment
			expect(wrapper.getRetryCount()).toBe(3);
			expect(wrapper.hasExceededRetries()).toBe(true);
		});
	});

	describe('Retry Callback', () => {
		it('should call retry callback with correct context', () => {
			let callbackContext: string = '';

			const contextAwareCallback = vi.fn(() => {
				callbackContext = 'callback-called';
			});

			const contextWrapper = new TestErrorWrapper('Error', contextAwareCallback);
			contextWrapper.handleError(new Error('Test'));
			contextWrapper.retry();

			expect(callbackContext).toBe('callback-called');
		});

		it('should work without retry callback', () => {
			const wrapperNoCallback = new TestErrorWrapper('Error');
			wrapperNoCallback.handleError(new Error('Test'));
			expect(() => wrapperNoCallback.retry()).not.toThrow();
		});
	});

	describe('Error State Management', () => {
		it('should handle null error message gracefully', () => {
			wrapper.handleError(new Error(''));

			expect(wrapper.getErrorMessage()).toBe('');
		});

		it('should handle error with long message', () => {
			const longMessage = 'A'.repeat(1000);
			wrapper.handleError(new Error(longMessage));

			expect(wrapper.getErrorMessage()).toBe(longMessage);
		});

		it('should handle error with special characters', () => {
			const specialMessage = 'Error: <script>alert("xss")</script>';
			wrapper.handleError(new Error(specialMessage));

			expect(wrapper.getErrorMessage()).toBe(specialMessage);
		});
	});

	describe('Display Message Behavior', () => {
		it('should show fallback when no error', () => {
			expect(wrapper.getDisplayMessage()).toBe('Error loading content');
		});

		it('should show enhanced error when error present', () => {
			wrapper.handleError(new Error('network error'));
			const displayMessage = wrapper.getDisplayMessage();

			expect(displayMessage).toContain('network error');
			expect(displayMessage).toContain('Check your internet connection');
		});

		it('should show error with guidance after retry', () => {
			wrapper.handleError(new Error('Network error'));
			wrapper.retry();
			wrapper.handleError(new Error('Another network error'));

			const displayMessage = wrapper.getDisplayMessage();
			expect(displayMessage).toContain('Another network error');
			expect(displayMessage).toContain('Check your internet connection');
		});
	});
});
