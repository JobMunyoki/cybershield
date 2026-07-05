import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

let storageData = {};

const localStorageMock = {
  getItem: vi.fn((key) => {
    return Object.prototype.hasOwnProperty.call(
      storageData,
      key
    )
      ? storageData[key]
      : null;
  }),

  setItem: vi.fn((key, value) => {
    storageData[key] = String(value);
  }),

  removeItem: vi.fn((key) => {
    delete storageData[key];
  }),

  clear: vi.fn(() => {
    storageData = {};
  }),

  key: vi.fn((index) => {
    return Object.keys(storageData)[index] ?? null;
  }),

  get length() {
    return Object.keys(storageData).length;
  },
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  configurable: true,
});