import { describe, it, expect, beforeEach } from 'vitest';
import { loadData, saveData, saveProjects, loadProjects } from './storage.js';

// Simple localStorage mock
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

beforeEach(() => {
  localStorageMock.clear();
  globalThis.localStorage = localStorageMock;
});

describe('storage utilities', () => {
  it('loadData returns default when key not present', () => {
    const result = loadData('missing', 'default');
    expect(result).toBe('default');
  });

  it('saveData stores values retrievable with loadData', () => {
    const value = { a: 1 };
    saveData('someKey', value);
    const loaded = loadData('someKey');
    expect(loaded).toEqual(value);
  });

  it('saveProjects and loadProjects work together', () => {
    const projects = [{ id: 1, name: 'p1' }];
    saveProjects(projects);
    const loaded = loadProjects();
    expect(loaded).toEqual(projects);
  });
});
