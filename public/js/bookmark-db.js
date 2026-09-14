// public/js/bookmark-db.js — IndexedDB-based bookmark storage with sync queue
const DB_NAME = 'simple-reads-bookmarks';
const DB_VERSION = 1;
const STORE_BOOKMARKS = 'bookmarks';
const STORE_QUEUE = 'sync-queue';
const STORE_META = 'meta';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_BOOKMARKS)) {
        db.createObjectStore(STORE_BOOKMARKS, { keyPath: 'article_id' });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txGet(store, key) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

function txGetAll(store) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

function txPut(store, value) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

function txDelete(store, key) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  }));
}

function txClear(store) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  }));
}

// --- Anon ID management ---
export async function getAnonId() {
  const meta = await txGet(STORE_META, 'anon_id');
  if (meta) return meta.value;
  
  // Generate new UUID
  const id = crypto.randomUUID();
  await txPut(STORE_META, { key: 'anon_id', value: id });
  
  // Request persistent storage
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }
  
  return id;
}

export async function setAnonId(id) {
  await txPut(STORE_META, { key: 'anon_id', value: id });
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }
}

// --- Bookmark operations (local-first) ---
export async function addBookmark(articleId) {
  const anonId = await getAnonId();
  await txPut(STORE_BOOKMARKS, { article_id: articleId, created_at: Date.now() });
  // Queue sync
  await txPut(STORE_QUEUE, { type: 'add', anon_id: anonId, article_id: articleId, timestamp: Date.now() });
  processQueue();
}

export async function removeBookmark(articleId) {
  const anonId = await getAnonId();
  await txDelete(STORE_BOOKMARKS, articleId);
  // Queue sync
  await txPut(STORE_QUEUE, { type: 'remove', anon_id: anonId, article_id: articleId, timestamp: Date.now() });
  processQueue();
}

export async function isBookmarked(articleId) {
  const bm = await txGet(STORE_BOOKMARKS, articleId);
  return !!bm;
}

export async function getAllBookmarks() {
  return txGetAll(STORE_BOOKMARKS);
}

// --- Sync queue processing ---
let processing = false;
async function processQueue() {
  if (processing) return;
  processing = true;
  try {
    const items = await txGetAll(STORE_QUEUE);
    for (const item of items) {
      try {
        if (item.type === 'add') {
          await fetch('/api/bookmarks/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ anon_id: item.anon_id, article_id: item.article_id })
          });
        } else if (item.type === 'remove') {
          await fetch('/api/bookmarks/', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ anon_id: item.anon_id, article_id: item.article_id })
          });
        }
        await txDelete(STORE_QUEUE, item.id);
      } catch (e) {
        // Will retry on next page load
        break;
      }
    }
  } finally {
    processing = false;
  }
}

// Process queue on load
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => processQueue());
  setTimeout(processQueue, 2000);
}
