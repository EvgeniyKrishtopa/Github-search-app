import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { createMatchMedia } from './testUtils';

// jsdom does not implement window.matchMedia. Provide a default stub (matches:
// false → OS-dark branch) so the eager store.ts import resolves; tests that
// exercise the OS-light or no-matchMedia branches override/delete it locally.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: createMatchMedia(false),
});

afterEach(cleanup);
