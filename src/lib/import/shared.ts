import type { FileKind, PresentationDoc, Slide } from "@/lib/types";
import { ImportError } from "@/lib/types";
import { uid } from "@/lib/utils";

export const CONVERSION_HINTS = [
  "PowerPoint: export as PPTX or PDF.",
  "Keynote or Google Slides: download as PPTX or PDF.",
  "Photos: save as PNG, JPG, JPEG, WebP, or SVG.",
  "Notes: save as Markdown (.md) or plain text (.txt).",
  "A deck authored for this app: export the native JSON file.",
  "Video: use MP4 or WebM.",
];

export function extensionOf(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? name;
  const idx = base.lastIndexOf(".");
  return idx >= 0 ? base.slice(idx + 1).toLowerCase() : "";
}

export function titleFromFilename(name: string): string {
  const base = (name.split(/[/\\]/).pop() ?? name).replace(/\.[^.]+$/, "");
  const cleaned = base.replace(/[_-]+/g, " ").trim();
  return cleaned || "Imported presentation";
}

export function makeDoc(
  title: string,
  fileType: FileKind,
  slides: Slide[],
  sourceName?: string,
): PresentationDoc {
  const now = Date.now();
  return {
    id: uid("pres"),
    title,
    fileType,
    sourceName,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: null,
    builtin: false,
    thumbnail: null,
    slides,
  };
}

export function assertSlides(slides: Slide[], filename: string): Slide[] {
  if (!slides.length) {
    throw new ImportError(`${filename} did not contain any slides.`, CONVERSION_HINTS);
  }
  return slides;
}

export async function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new ImportError("The file could not be read."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export async function readAsText(file: Blob): Promise<string> {
  return file.text();
}
