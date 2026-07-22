import { vi } from 'vitest';

// Shared MediaQueryList stub: jsdom doesn't implement window.matchMedia, so both
// setupTests.ts (default stub) and tests that drive the prefers-color-scheme
// branch build one from here — a single mock shape, not two copies to keep in
// sync. Every query reports the given `matches`.
export const createMatchMedia = (matches: boolean): typeof window.matchMedia =>
  vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
