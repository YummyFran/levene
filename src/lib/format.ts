export function fmt(n: number, digits = 3): string {
  if (!Number.isFinite(n)) return "—";
  const rounded = Number(n.toFixed(digits));
  return rounded.toString();
}

export function fmtFixed(n: number, digits = 3): string {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

export function fmtP(p: number): string {
  if (!Number.isFinite(p)) return "—";
  if (p === 0) return "0";
  if (p < 0.0001) return p.toExponential(3).replace("e", " × 10^");
  return p.toFixed(4);
}

export function fmtPPlain(p: number): string {
  if (!Number.isFinite(p)) return "—";
  if (p < 0.0001) {
    const exp = p.toExponential(3);
    const [coef, e] = exp.split("e");
    const power = Number(e);
    const supers: Record<string, string> = {
      "-": "⁻",
      "0": "⁰",
      "1": "¹",
      "2": "²",
      "3": "³",
      "4": "⁴",
      "5": "⁵",
      "6": "⁶",
      "7": "⁷",
      "8": "⁸",
      "9": "⁹",
    };
    const sup = String(power)
      .split("")
      .map((ch) => supers[ch] ?? ch)
      .join("");
    return `${coef} × 10${sup}`;
  }
  return p.toFixed(4);
}

export function fileKindLabel(kind: string): string {
  const map: Record<string, string> = {
    native: "Native",
    pptx: "PPTX",
    pdf: "PDF",
    png: "PNG",
    jpg: "JPG",
    jpeg: "JPEG",
    webp: "WebP",
    svg: "SVG",
    markdown: "Markdown",
    text: "Text",
    json: "JSON",
    mp4: "MP4",
    webm: "WebM",
  };
  return map[kind] ?? kind.toUpperCase();
}

export function formatOpened(ts: number | null): string {
  if (!ts) return "Not opened yet";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(ts));
}
