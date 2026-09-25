"use client";

import {
  Copy,
  Grid2X2,
  List,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  deletePresentation,
  listPresentations,
  restoreBuiltins,
  savePresentation,
} from "@/lib/db";
import { fileKindLabel, formatOpened } from "@/lib/format";
import { importFiles } from "@/lib/import/import-file";
import type { PresentationDoc } from "@/lib/types";
import { ImportError } from "@/lib/types";
import { uid } from "@/lib/utils";

type SortKey = "opened" | "updated" | "title" | "slides";

export function LibraryApp() {
  const [docs, setDocs] = useState<PresentationDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("opened");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [importError, setImportError] = useState<ImportError | null>(null);
  const [busy, setBusy] = useState(false);
  const [renameTarget, setRenameTarget] = useState<PresentationDoc | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    try {
      const rows = await listPresentations();
      setDocs(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The library could not be opened.");
      setDocs([]);
    }
  }

  useEffect(() => {
    const stored = window.localStorage.getItem("folio-view");
    if (stored === "list" || stored === "grid") setView(stored);
    void refresh();
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = (docs ?? []).filter((doc) => {
      if (!needle) return true;
      return (
        doc.title.toLowerCase().includes(needle) ||
        fileKindLabel(doc.fileType).toLowerCase().includes(needle)
      );
    });
    const copy = [...filtered];
    copy.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "slides") return b.slides.length - a.slides.length;
      if (sort === "updated") return b.updatedAt - a.updatedAt;
      return (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0) || b.updatedAt - a.updatedAt;
    });
    return copy;
  }, [docs, query, sort]);

  async function onImport(fileList: FileList | null) {
    if (!fileList?.length) return;
    setBusy(true);
    setImportError(null);
    try {
      const doc = await importFiles(Array.from(fileList));
      await savePresentation(doc);
      await refresh();
    } catch (err) {
      setImportError(
        err instanceof ImportError
          ? err
          : new ImportError(err instanceof Error ? err.message : "Import failed."),
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function duplicate(doc: PresentationDoc) {
    const copy: PresentationDoc = {
      ...structuredClone(doc),
      id: uid("pres"),
      title: `Copy of ${doc.title}`,
      builtin: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastOpenedAt: null,
    };
    await savePresentation(copy);
    await refresh();
  }

  async function rename() {
    if (!renameTarget) return;
    const title = renameValue.trim();
    if (!title) return;
    await savePresentation({ ...renameTarget, title, updatedAt: Date.now() });
    setRenameTarget(null);
    await refresh();
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-5 py-8 sm:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-burgundy">Folio</p>
            <h1 className="mt-2 font-serif text-4xl sm:text-5xl">Presentation library</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              Built-in lectures and imported decks stay in this browser. Open one to present, or bring in a PPTX, PDF, image, Markdown, text, JSON, or video file.
            </p>
          </div>
          <div>
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              id="import-file"
              multiple
              onChange={(event) => void onImport(event.target.files)}
            />
            <Button asChild>
              <label htmlFor="import-file" className="cursor-pointer">
                <Plus className="h-4 w-4" />
                {busy ? "Importing…" : "Import"}
              </label>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
        <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search presentations</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title or file type"
              className="h-10 w-full border border-line bg-card pl-10 pr-3 text-sm outline-none focus:border-navy"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            Sort
            <select
              aria-label="Sort presentations"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="h-10 border border-line bg-card px-2 text-ink"
            >
              <option value="opened">Last opened</option>
              <option value="updated">Recently added</option>
              <option value="title">Title</option>
              <option value="slides">Slide count</option>
            </select>
          </label>
          <div className="flex border border-line">
            <button
              type="button"
              aria-pressed={view === "grid"}
              aria-label="Grid view"
              className={`h-10 w-10 ${view === "grid" ? "bg-navy text-paper" : "bg-card"}`}
              onClick={() => {
                setView("grid");
                window.localStorage.setItem("folio-view", "grid");
              }}
            >
              <Grid2X2 className="mx-auto h-4 w-4" />
            </button>
            <button
              type="button"
              aria-pressed={view === "list"}
              aria-label="List view"
              className={`h-10 w-10 ${view === "list" ? "bg-navy text-paper" : "bg-card"}`}
              onClick={() => {
                setView("list");
                window.localStorage.setItem("folio-view", "list");
              }}
            >
              <List className="mx-auto h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-6 border border-burgundy/40 bg-card px-4 py-3 text-sm text-burgundy" role="alert">
            {error}
          </p>
        )}
        {docs === null && <p className="mt-10 text-sm text-muted">Opening the library…</p>}
        {docs && visible.length === 0 && (
          <EmptyState
            filtered={Boolean(query) && docs.length > 0}
            onRestore={async () => {
              await restoreBuiltins();
              await refresh();
            }}
          />
        )}
        {visible.length > 0 && view === "grid" && (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((doc) => (
              <li key={doc.id}>
                <Card doc={doc} onDuplicate={duplicate} onDelete={async (id) => { await deletePresentation(id); await refresh(); }} onRename={(item) => { setRenameTarget(item); setRenameValue(item.title); }} />
              </li>
            ))}
          </ul>
        )}
        {visible.length > 0 && view === "list" && (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {visible.map((doc) => (
              <li key={doc.id} className="flex items-center gap-4 py-3">
                <Thumb doc={doc} className="h-14 w-24 shrink-0" />
                <div className="min-w-0 flex-1">
                  <Link href={`/present/${doc.id}`} className="font-serif text-xl hover:text-burgundy">
                    {doc.title}
                  </Link>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">
                    {fileKindLabel(doc.fileType)} · {doc.slides.length} slides · {formatOpened(doc.lastOpenedAt)}
                  </p>
                </div>
                <Actions
                  doc={doc}
                  onDuplicate={duplicate}
                  onDelete={async (id) => { await deletePresentation(id); await refresh(); }}
                  onRename={(item) => { setRenameTarget(item); setRenameValue(item.title); }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={Boolean(importError)} onOpenChange={(open) => !open && setImportError(null)}>
        {importError && (
          <DialogContent title="This file could not be imported">
            <p className="mt-3 text-sm leading-6 text-muted">{importError.message}</p>
            {importError.suggestions.length > 0 && (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm leading-6">
                {importError.suggestions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={Boolean(renameTarget)} onOpenChange={(open) => !open && setRenameTarget(null)}>
        {renameTarget && (
          <DialogContent title="Rename presentation">
            <form
              className="mt-4"
              onSubmit={(event) => {
                event.preventDefault();
                void rename();
              }}
            >
              <label className="text-sm text-muted" htmlFor="rename-title">
                Title
              </label>
              <input
                id="rename-title"
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                className="mt-2 h-10 w-full border border-line bg-paper px-3"
              />
              <div className="mt-5 flex justify-end">
                <Button type="submit">Save title</Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </main>
  );
}

function Card({
  doc,
  onDuplicate,
  onDelete,
  onRename,
}: {
  doc: PresentationDoc;
  onDuplicate: (doc: PresentationDoc) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRename: (doc: PresentationDoc) => void;
}) {
  return (
    <article className="flex h-full flex-col border border-line bg-card">
      <Link href={`/present/${doc.id}`} className="block">
        <Thumb doc={doc} className="h-40 w-full" />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-serif text-xl leading-snug">
            <Link href={`/present/${doc.id}`} className="hover:text-burgundy">
              {doc.title}
            </Link>
          </h2>
          <Actions doc={doc} onDuplicate={onDuplicate} onDelete={onDelete} onRename={onRename} />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-xs uppercase tracking-[0.12em] text-muted">
          <div>
            <dt>Slides</dt>
            <dd className="mt-1 font-mono text-sm normal-case tracking-normal text-ink">{doc.slides.length}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd className="mt-1 text-sm normal-case tracking-normal text-ink">{fileKindLabel(doc.fileType)}</dd>
          </div>
          <div className="col-span-2">
            <dt>Last opened</dt>
            <dd className="mt-1 text-sm normal-case tracking-normal text-ink">{formatOpened(doc.lastOpenedAt)}</dd>
          </div>
        </dl>
        <Button asChild variant="outline" className="mt-4">
          <Link href={`/present/${doc.id}`}>
            <Play className="h-4 w-4" />
            Present
          </Link>
        </Button>
      </div>
    </article>
  );
}

function Actions({
  doc,
  onDuplicate,
  onDelete,
  onRename,
}: {
  doc: PresentationDoc;
  onDuplicate: (doc: PresentationDoc) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRename: (doc: PresentationDoc) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="quiet" size="icon" aria-label={`Actions for ${doc.title}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => onRename(doc)}>
          <Pencil className="mr-2 h-4 w-4" /> Rename
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void onDuplicate(doc)}>
          <Copy className="mr-2 h-4 w-4" /> Duplicate
        </DropdownMenuItem>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem onSelect={(event) => event.preventDefault()} className="text-burgundy">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent
            title="Delete this presentation?"
            description={`“${doc.title}” will be removed from this browser. Built-in decks can be restored later.`}
            confirmLabel="Delete"
            destructive
            onConfirm={() => void onDelete(doc.id)}
          />
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Thumb({ doc, className }: { doc: PresentationDoc; className?: string }) {
  const first = doc.slides[0]?.block;
  const image = first?.type === "image" ? first.src : null;
  return (
    <div className={`relative overflow-hidden bg-navy ${className ?? ""}`}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full flex-col justify-between p-4 text-paper">
          <span className="text-[10px] uppercase tracking-[0.22em] text-gold">{fileKindLabel(doc.fileType)}</span>
          <span className="line-clamp-3 font-serif text-lg leading-snug">{doc.title}</span>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  filtered,
  onRestore,
}: {
  filtered: boolean;
  onRestore: () => Promise<void>;
}) {
  return (
    <div className="mt-16 border border-dashed border-line px-6 py-16 text-center">
      <p className="font-serif text-3xl">{filtered ? "No decks match that search" : "The library is empty"}</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
        {filtered
          ? "Try another title or file type, or clear the search."
          : "Import a PPTX, PDF, image, Markdown, text, JSON, or video file. Built-in lectures can also be restored."}
      </p>
      {!filtered && (
        <Button className="mt-6" variant="outline" onClick={() => void onRestore()}>
          Restore built-in presentations
        </Button>
      )}
    </div>
  );
}
