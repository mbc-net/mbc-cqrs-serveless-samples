/**
 * Sleep for the specified number of milliseconds.
 * Useful for simulating long-running operations in async task handlers.
 *
 * @param ms - Number of milliseconds to sleep (default: 0)
 * @returns Promise that resolves after the specified delay
 *
 * @example
 * // Wait for 3 seconds
 * await sleep(3000)
 */
export const sleep = (ms = 0): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))
