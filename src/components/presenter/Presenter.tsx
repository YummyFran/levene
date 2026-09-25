"use client";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Expand,
  LayoutGrid,
  Moon,
  Shrink,
  StickyNote,
  Sun,
  TimerReset,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SlideView, revealLength } from "@/components/slides/SlideView";
import { Button } from "@/components/ui/button";
import { getPresentation, touchOpened } from "@/lib/db";
import type { PresentationDoc } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Presenter({ id }: { id: string }) {
  const [doc, setDoc] = useState<PresentationDoc | null | undefined>(undefined);
  const [index, setIndex] = useState(0);
  const [reveal, setReveal] = useState(1);
  const [overview, setOverview] = useState(false);
  const [notes, setNotes] = useState(true);
  const [dark, setDark] = useState(false);
  const [chrome, setChrome] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [timerOn, setTimerOn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const found = await getPresentation(id);
      if (cancelled) return;
      setDoc(found ?? null);
      if (found) await touchOpened(found.id);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const slide = doc?.slides[index];
  const total = doc?.slides.length ?? 0;
  const lines = slide ? revealLength(slide.block) : 0;

  const go = useCallback(
    (next: number) => {
      if (!doc) return;
      const clamped = Math.max(0, Math.min(doc.slides.length - 1, next));
      setIndex(clamped);
      setReveal(1);
      setOverview(false);
    },
    [doc],
  );

  const forward = useCallback(() => {
    if (!slide) return;
    if (lines > 0 && reveal < lines) {
      setReveal((value) => value + 1);
      return;
    }
    go(index + 1);
  }, [go, index, lines, reveal, slide]);

  const back = useCallback(() => {
    if (lines > 0 && reveal > 1) {
      setReveal((value) => value - 1);
      return;
    }
    go(index - 1);
  }, [go, index, lines, reveal]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "VIDEO"].includes(target.tagName)) return;
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        forward();
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        back();
      } else if (event.key === "Home") {
        event.preventDefault();
        go(0);
      } else if (event.key === "End") {
        event.preventDefault();
        go((doc?.slides.length ?? 1) - 1);
      } else if (event.key === "Escape") {
        if (overview) setOverview(false);
        else if (document.fullscreenElement) void document.exitFullscreen();
        else window.location.href = "/";
      } else if (event.key.toLowerCase() === "g") {
        setOverview((value) => !value);
      } else if (event.key.toLowerCase() === "n") {
        setNotes((value) => !value);
      } else if (event.key.toLowerCase() === "h") {
        setChrome((value) => !value);
      } else if (event.key.toLowerCase() === "t") {
        setTimerOn((value) => !value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [back, doc?.slides.length, forward, go, overview]);

  useEffect(() => {
    if (!timerOn) return;
    const id = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [timerOn]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setScale(Math.min(rect.width / 1280, rect.height / 720));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [doc, notes, chrome]);

  useEffect(() => {
    function onChange() {
      setFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const clock = useMemo(() => {
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const seconds = String(elapsed % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [elapsed]);

  if (doc === undefined) {
    return <main className="grid min-h-screen place-items-center bg-paper text-sm text-muted">Opening presentation…</main>;
  }
  if (!doc || !slide) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper px-6 text-center">
        <div>
          <h1 className="font-serif text-4xl">This presentation is not in the library</h1>
          <p className="mt-3 text-sm text-muted">It may have been deleted in this browser.</p>
          <Button asChild className="mt-6">
            <Link href="/">Back to the library</Link>
          </Button>
        </div>
      </main>
    );
  }

  const progress = ((index + (lines ? reveal / lines : 1)) / total) * 100;

  return (
    <main ref={frameRef} className={cn("flex min-h-screen flex-col bg-paper text-ink", dark && "presenter-dark")}>
      <div className="sr-only" aria-live="polite">
        Slide {index + 1} of {total}. {slideTitle(slide.block)}
      </div>
      {chrome && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-3 py-2 sm:px-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Library</span>
          </Link>
          <p className="truncate font-serif text-base sm:text-lg">{doc.title}</p>
          <div className="flex items-center gap-1">
            <IconButton label={dark ? "Use the light environment" : "Use the dark environment"} onClick={() => setDark((v) => !v)}>
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </IconButton>
            <IconButton label={notes ? "Hide notes" : "Show notes"} pressed={notes} onClick={() => setNotes((v) => !v)}>
              <StickyNote className="h-4 w-4" />
            </IconButton>
            <IconButton label="Slide overview" pressed={overview} onClick={() => setOverview((v) => !v)}>
              <LayoutGrid className="h-4 w-4" />
            </IconButton>
            <IconButton
              label={fullscreen ? "Exit full screen" : "Enter full screen"}
              onClick={() => {
                if (document.fullscreenElement) void document.exitFullscreen();
                else void frameRef.current?.requestFullscreen();
              }}
            >
              {fullscreen ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
            </IconButton>
          </div>
        </header>
      )}

      <div className={cn("grid min-h-0 flex-1", notes && chrome ? "lg:grid-cols-[1fr_18rem]" : "grid-cols-1")}>
        <div ref={stageRef} className="relative grid min-h-[50vh] place-items-center overflow-hidden p-3 sm:p-6">
          <div
            className="origin-center bg-paper shadow-[0_18px_50px_rgba(28,25,21,0.12)] transition-opacity duration-200 motion-reduce:transition-none"
            style={{ width: 1280, height: 720, transform: `scale(${scale})` }}
          >
            <SlideView block={slide.block} reveal={reveal} />
          </div>
          {!chrome && (
            <button
              type="button"
              className="absolute right-3 top-3 bg-navy/80 px-3 py-1 text-xs text-paper"
              onClick={() => setChrome(true)}
            >
              Show controls
            </button>
          )}
        </div>
        {notes && chrome && (
          <aside className="border-t border-line bg-card px-4 py-4 lg:border-l lg:border-t-0">
            <p className="text-xs uppercase tracking-[0.18em] text-burgundy">Presenter notes</p>
            <p className="mt-3 text-sm leading-6 text-ink">{slide.notes || "No notes on this slide."}</p>
          </aside>
        )}
      </div>

      {chrome && (
        <footer className="border-t border-line px-3 py-3 sm:px-4">
          <div className="mb-3 h-1 bg-line" aria-hidden>
            <div className="h-full bg-burgundy" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-sm tabular-nums" aria-live="off">
              {index + 1} / {total}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={back} disabled={index === 0 && reveal <= 1}>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={forward} disabled={index === total - 1 && reveal >= Math.max(lines, 1)}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={cn("inline-flex h-8 items-center gap-2 border px-2 font-mono text-sm", timerOn ? "border-navy" : "border-line")}
                onClick={() => setTimerOn((value) => !value)}
                aria-pressed={timerOn}
              >
                <Clock className="h-3.5 w-3.5" />
                {clock}
              </button>
              <IconButton label="Reset timer" onClick={() => { setElapsed(0); setTimerOn(false); }}>
                <TimerReset className="h-4 w-4" />
              </IconButton>
              <IconButton label="Hide controls" onClick={() => setChrome(false)}>
                <span className="text-xs">Hide</span>
              </IconButton>
            </div>
          </div>
        </footer>
      )}

      {overview && (
        <div className="fixed inset-0 z-40 overflow-auto bg-paper/95 p-6" role="dialog" aria-label="Slide overview">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <h2 className="font-serif text-3xl">Slides</h2>
            <Button variant="outline" onClick={() => setOverview(false)}>Close</Button>
          </div>
          <ul className="mx-auto mt-6 grid max-w-6xl grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {doc.slides.map((item, itemIndex) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => go(itemIndex)}
                  className={cn("w-full border text-left", itemIndex === index ? "border-burgundy" : "border-line")}
                >
                  <div className="overview-light aspect-video overflow-hidden">
                    <div className="origin-top-left scale-[0.18] sm:scale-[0.22]" style={{ width: 1280, height: 720 }}>
                      <SlideView block={item.block} />
                    </div>
                  </div>
                  <span className="block px-2 py-2 text-xs text-muted">
                    {itemIndex + 1}. {slideTitle(item.block)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

function IconButton({
  label,
  children,
  onClick,
  pressed,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 min-w-9 items-center justify-center border border-transparent px-2 text-ink hover:border-line",
        pressed && "border-line bg-card",
      )}
    >
      {children}
    </button>
  );
}

function slideTitle(block: PresentationDoc["slides"][number]["block"]): string {
  if ("title" in block && block.title) return block.title;
  return "Slide";
}
