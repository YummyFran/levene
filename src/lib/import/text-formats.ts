import { makeDoc, titleFromFilename } from "@/lib/import/shared";
import type { PresentationDoc, Slide, SlideBlock } from "@/lib/types";
import { ImportError } from "@/lib/types";
import { uid } from "@/lib/utils";

function splitChunks(raw: string): string[] {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const byRule = normalized.split(/\n---\n|\f/);
  return byRule.map((part) => part.trim()).filter(Boolean);
}

export function importMarkdown(text: string, filename: string): PresentationDoc {
  const chunks = splitChunks(text);
  if (!chunks.length) throw new ImportError(`${filename} is empty.`);
  const slides: Slide[] = chunks.map((chunk, index) => {
    const lines = chunk.split("\n");
    const heading = lines[0]?.replace(/^#+\s*/, "").trim() || `Slide ${index + 1}`;
    const rest = lines
      .slice(1)
      .join("\n")
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    const paragraphs = rest.length ? rest : [heading];
    const block: SlideBlock = {
      type: "richtext",
      kicker: "Markdown",
      title: heading,
      paragraphs,
    };
    return { id: uid("md"), block, notes: chunk };
  });
  return makeDoc(titleFromFilename(filename), "markdown", slides, filename);
}

export function importPlainText(text: string, filename: string): PresentationDoc {
  const chunks = splitChunks(text);
  if (!chunks.length) throw new ImportError(`${filename} is empty.`);
  const slides: Slide[] = chunks.map((chunk) => {
    const [first, ...rest] = chunk.split("\n");
    const title = first.trim().slice(0, 120) || "Text slide";
    const body = rest.join("\n").trim();
    const paragraphs = (body || first).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    return {
      id: uid("txt"),
      notes: chunk,
      block: { type: "richtext", kicker: "Text", title, paragraphs },
    };
  });
  return makeDoc(titleFromFilename(filename), "text", slides, filename);
}

function isBlock(value: unknown): value is SlideBlock {
  return Boolean(value && typeof value === "object" && "type" in value);
}

export function importNativeJson(text: string, filename: string): PresentationDoc {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ImportError(
      `${filename} is not valid JSON. A native deck is a JSON object with a title and a slides array.`,
      ["Export again from this app, or check the file for a trailing comma."],
    );
  }
  const record = parsed as {
    title?: unknown;
    slides?: unknown;
    fileType?: unknown;
  };
  if (!record || !Array.isArray(record.slides)) {
    throw new ImportError(`${filename} is missing a slides array.`, [
      "Use the native shape: { \"title\": \"...\", \"slides\": [ { \"id\", \"block\" } ] }.",
    ]);
  }
  const slides: Slide[] = [];
  record.slides.forEach((entry, index) => {
    const slide = entry as { id?: unknown; notes?: unknown; block?: unknown };
    const block = isBlock(slide.block)
      ? slide.block
      : isBlock(entry)
        ? (entry as SlideBlock)
        : null;
    if (!block) {
      slides.push({
        id: uid("json"),
        notes: "This slide could not be read.",
        block: {
          type: "fallback",
          title: `Slide ${index + 1}`,
          message: "This JSON slide had no recognizable block, so it is shown as a fallback.",
        },
      });
      return;
    }
    slides.push({
      id: typeof slide.id === "string" ? `${slide.id}-${index}` : uid("json"),
      notes: typeof slide.notes === "string" ? slide.notes : undefined,
      block,
    });
  });
  if (!slides.length) throw new ImportError(`${filename} contains no slides.`);
  const title = typeof record.title === "string" && record.title.trim()
    ? record.title.trim()
    : titleFromFilename(filename);
  return makeDoc(title, "json", slides, filename);
}
