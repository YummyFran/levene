import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { builtinPresentations } from "@/lib/presentations/registry";
import type { PresentationDoc } from "@/lib/types";

/** Bump when built-in slide content changes so an already-open browser replaces the stored deck. */
export const BUILTIN_REVISION = 2;

interface FolioDb extends DBSchema {
  presentations: {
    key: string;
    value: PresentationDoc;
  };
  meta: {
    key: string;
    value: { key: string; seeded?: boolean; revision?: number };
  };
}

const DB_NAME = "folio-presentations";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<FolioDb>> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB<FolioDb>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains("presentations")) {
          database.createObjectStore("presentations", { keyPath: "id" });
        }
        if (!database.objectStoreNames.contains("meta")) {
          database.createObjectStore("meta", { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

export async function ensureSeeded(): Promise<void> {
  const database = await db();
  const flag = await database.get("meta", "seed");
  const now = Date.now();
  const decks = builtinPresentations(now);
  const tx = database.transaction(["presentations", "meta"], "readwrite");
  if (!flag?.seeded) {
    for (const deck of decks) {
      const existing = await tx.objectStore("presentations").get(deck.id);
      if (!existing) await tx.objectStore("presentations").put(deck);
    }
  } else if (flag.revision !== BUILTIN_REVISION) {
    for (const deck of decks) {
      const existing = await tx.objectStore("presentations").get(deck.id);
      if (!existing?.builtin) continue;
      await tx.objectStore("presentations").put({
        ...deck,
        title: existing.title,
        createdAt: existing.createdAt,
        lastOpenedAt: existing.lastOpenedAt,
      });
    }
  } else {
    await tx.done;
    return;
  }
  await tx.objectStore("meta").put({ key: "seed", seeded: true, revision: BUILTIN_REVISION });
  await tx.done;
}

export async function listPresentations(): Promise<PresentationDoc[]> {
  await ensureSeeded();
  const database = await db();
  return database.getAll("presentations");
}

export async function getPresentation(id: string): Promise<PresentationDoc | undefined> {
  await ensureSeeded();
  const database = await db();
  return database.get("presentations", id);
}

export async function savePresentation(doc: PresentationDoc): Promise<void> {
  const database = await db();
  await database.put("presentations", doc);
}

export async function deletePresentation(id: string): Promise<void> {
  const database = await db();
  await database.delete("presentations", id);
}

export async function touchOpened(id: string): Promise<void> {
  const database = await db();
  const doc = await database.get("presentations", id);
  if (!doc) return;
  doc.lastOpenedAt = Date.now();
  await database.put("presentations", doc);
}

export async function restoreBuiltins(): Promise<void> {
  const database = await db();
  const now = Date.now();
  const tx = database.transaction("presentations", "readwrite");
  for (const deck of builtinPresentations(now)) {
    const existing = await tx.store.get(deck.id);
    if (!existing) await tx.store.put(deck);
  }
  await tx.done;
}
