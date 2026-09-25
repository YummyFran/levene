export const SUPPORTED_EXTENSIONS = [
  "pptx",
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "svg",
  "md",
  "markdown",
  "txt",
  "json",
  "mp4",
  "webm",
] as const;

export type FileKind =
  | "native"
  | "pptx"
  | "pdf"
  | "png"
  | "jpg"
  | "jpeg"
  | "webp"
  | "svg"
  | "markdown"
  | "text"
  | "json"
  | "mp4"
  | "webm";

export interface PptxElement {
  kind: "text" | "shape" | "image";
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  fill?: string;
  color?: string;
  fontSize?: number;
  shape?: "rect" | "ellipse" | "roundRect";
  src?: string;
  bold?: boolean;
  align?: "left" | "center" | "right";
}

export interface SymbolRow {
  symbol: string;
  meaning: string;
}

export interface CalcLine {
  label: string;
  expression: string;
  result: string;
}

export type SlideBlock =
  | {
      type: "title";
      kicker?: string;
      title: string;
      subtitle?: string;
      footer?: string;
    }
  | {
      type: "section";
      index: string;
      title: string;
      lede?: string;
    }
  | {
      type: "bullets";
      kicker?: string;
      title: string;
      items: { lead: string; text: string }[];
    }
  | {
      type: "compare";
      kicker?: string;
      title: string;
      columns: { heading: string; points: string[] }[];
      footnote?: string;
    }
  | {
      type: "formula";
      kicker?: string;
      title: string;
      formula: string;
      symbols: SymbolRow[];
      note?: string;
    }
  | {
      type: "table";
      kicker?: string;
      title: string;
      caption?: string;
      columns: string[];
      rows: string[][];
      numeric?: boolean;
    }
  | {
      type: "dots";
      kicker?: string;
      title: string;
      caption?: string;
      series: { name: string; values: number[] }[];
      unit?: string;
    }
  | {
      type: "calculation";
      kicker?: string;
      title: string;
      lines: CalcLine[];
      note?: string;
    }
  | {
      type: "decision";
      kicker?: string;
      title: string;
      rules: { name: string; comparison: string; outcome: string; reject: boolean }[];
      verdict: string;
      detail: string;
    }
  | {
      type: "callout";
      kicker?: string;
      title: string;
      tone: "ink" | "warn" | "ok";
      body: string;
      aside?: string;
    }
  | {
      type: "summary";
      kicker?: string;
      title: string;
      items: string[];
    }
  | {
      type: "image";
      title?: string;
      src: string;
      alt: string;
    }
  | {
      type: "video";
      title?: string;
      src: string;
      mime: string;
    }
  | {
      type: "richtext";
      kicker?: string;
      title: string;
      paragraphs: string[];
    }
  | {
      type: "pptx";
      width: number;
      height: number;
      elements: PptxElement[];
      fallbackText?: string;
    }
  | {
      type: "fallback";
      title: string;
      message: string;
      detail?: string;
    };

export interface Slide {
  id: string;
  notes?: string;
  block: SlideBlock;
}

export interface PresentationDoc {
  id: string;
  title: string;
  fileType: FileKind;
  sourceName?: string;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number | null;
  builtin: boolean;
  thumbnail: string | null;
  slides: Slide[];
}

export class ImportError extends Error {
  suggestions: string[];
  constructor(message: string, suggestions: string[] = []) {
    super(message);
    this.name = "ImportError";
    this.suggestions = suggestions;
  }
}
