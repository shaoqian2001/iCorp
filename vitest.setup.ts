// Provides an in-memory IndexedDB so Dexie repositories, seed, and
// export/import round-trips can run headless under Vitest (Node).
import "fake-indexeddb/auto";
