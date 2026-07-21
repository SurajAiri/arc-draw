// IndexedDB wrapper for local-first diagram caching
// Stores { sceneData, version } keyed by diagram id

const DB_NAME = "diagram-studio";
const DB_VERSION = 1;
const STORE_NAME = "diagrams";

export interface LocalDiagram {
  id: string;
  sceneData: object;
  version: number;
  title?: string;
  savedAt: number; // Date.now()
  // False whenever sceneData has edits the server hasn't confirmed yet —
  // e.g. saved while offline. Lets a fresh page load (which starts with no
  // in-memory "dirty" flag) know it still needs to push this diagram to the
  // server rather than assuming a cached copy is already up to date.
  synced?: boolean;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocal(
  id: string,
  sceneData: object,
  version: number,
  title?: string,
  synced?: boolean
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result as LocalDiagram | undefined;
      const record: LocalDiagram = {
        id,
        sceneData,
        version,
        title: title ?? existing?.title,
        savedAt: Date.now(),
        // Leave the flag alone when the caller isn't asserting it (e.g. a
        // title-only rename doesn't touch scene content, so it shouldn't
        // flip an already-synced diagram to "unsynced").
        synced: synced ?? existing?.synced ?? false,
      };
      const putReq = store.put(record);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/** Marks a cached diagram as confirmed-synced with the server, without touching its content. */
export async function markSynced(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result as LocalDiagram | undefined;
      if (!existing) {
        resolve(); // nothing cached locally for this diagram — nothing to mark
        return;
      }
      const putReq = store.put({ ...existing, synced: true });
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function loadLocal(id: string): Promise<LocalDiagram | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function clearLocal(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
