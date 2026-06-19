// patch-fetch.ts
if (typeof globalThis !== 'undefined' && globalThis.fetch) {
  globalThis.fetch = globalThis.fetch.bind(globalThis);
}