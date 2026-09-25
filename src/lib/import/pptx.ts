import JSZip from "jszip";
import { makeDoc, titleFromFilename } from "@/lib/import/shared";
import type { PptxElement, PresentationDoc } from "@/lib/types";
import { ImportError } from "@/lib/types";
import { uid } from "@/lib/utils";

const EMU_PER_INCH = 914400;

function textOf(node: ParentNode | null): string {
  if (!node) return "";
  return Array.from(node.querySelectorAll("a\\:t, t"))
    .map((n) => n.textContent ?? "")
    .join("");
}

function attr(el: Element | null, name: string): string | null {
  if (!el) return null;
  return el.getAttribute(name);
}

function colorOf(el: Element | null): string | undefined {
  if (!el) return undefined;
  const srgb = el.querySelector("a\\:srgbClr, srgbClr");
  const val = srgb?.getAttribute("val");
  if (val) return `#${val}`;
  const scheme = el.querySelector("a\\:schemeClr, schemeClr")?.getAttribute("val");
  const map: Record<string, string> = {
    dk1: "#1c1915",
    lt1: "#f7f4ee",
    dk2: "#1c3348",
    lt2: "#e7eef1",
    accent1: "#6f2f38",
    accent2: "#1c3348",
    accent3: "#8d7043",
    tx1: "#1c1915",
    bg1: "#f7f4ee",
  };
  return scheme ? map[scheme] : undefined;
}

function slideSize(xml: Document): { width: number; height: number } {
  const sldSz = xml.querySelector("p\\:sldSz, sldSz");
  const cx = Number(sldSz?.getAttribute("cx") ?? 12192000);
  const cy = Number(sldSz?.getAttribute("cy") ?? 6858000);
  return {
    width: cx / EMU_PER_INCH,
    height: cy / EMU_PER_INCH,
  };
}

function parseXml(xml: string): Document {
  return new DOMParser().parseFromString(xml, "application/xml");
}

function elementsFromSlide(
  slideDoc: Document,
  rels: Map<string, string>,
  media: Map<string, string>,
  size: { width: number; height: number },
): PptxElement[] {
  const widthEmu = size.width * EMU_PER_INCH;
  const heightEmu = size.height * EMU_PER_INCH;
  const nodes = Array.from(slideDoc.querySelectorAll("p\\:sp, sp, p\\:pic, pic"));
  const elements: PptxElement[] = [];
  for (const node of nodes) {
    try {
      const xfrm = node.querySelector("a\\:xfrm, xfrm");
      const off = xfrm?.querySelector("a\\:off, off");
      const ext = xfrm?.querySelector("a\\:ext, ext");
      const x = Number(attr(off ?? null, "x") ?? 0);
      const y = Number(attr(off ?? null, "y") ?? 0);
      const w = Number(attr(ext ?? null, "cx") ?? widthEmu);
      const h = Number(attr(ext ?? null, "cy") ?? heightEmu * 0.1);
      const box = {
        x: (x / widthEmu) * 100,
        y: (y / heightEmu) * 100,
        w: Math.max(2, (w / widthEmu) * 100),
        h: Math.max(2, (h / heightEmu) * 100),
      };
      const tag = node.tagName.toLowerCase();
      if (tag.endsWith("pic")) {
        const embed = node.querySelector("[*|embed], [r\\:embed]")?.getAttribute("r:embed")
          ?? node.querySelector("a\\:blip, blip")?.getAttribute("r:embed");
        const target = embed ? rels.get(embed) : undefined;
        const src = target ? media.get(target) : undefined;
        if (src) elements.push({ kind: "image", ...box, src });
        continue;
      }
      const geom = node.querySelector("a\\:prstGeom, prstGeom")?.getAttribute("prst");
      const fill = colorOf(node.querySelector("a\\:solidFill, solidFill"));
      const runs = Array.from(node.querySelectorAll("a\\:r, r"));
      const text = runs.length
        ? runs.map((r) => r.querySelector("a\\:t, t")?.textContent ?? "").join("")
        : textOf(node);
      const sz = Number(node.querySelector("a\\:rPr, rPr")?.getAttribute("sz") ?? "1800");
      const bold = node.querySelector("a\\:rPr, rPr")?.getAttribute("b") === "1";
      const algn = node.querySelector("a\\:pPr, pPr")?.getAttribute("algn");
      const align = algn === "ctr" ? "center" : algn === "r" ? "right" : "left";
      const color = colorOf(node.querySelector("a\\:rPr a\\:solidFill, rPr solidFill")) ?? "#1c1915";
      const shape =
        geom === "ellipse" ? "ellipse" : geom === "roundRect" ? "roundRect" : "rect";
      if (fill && geom && geom !== "rect" || (fill && !text)) {
        elements.push({ kind: "shape", ...box, fill, shape });
      }
      if (text.trim()) {
        elements.push({
          kind: "text",
          ...box,
          text: text.replace(/\s+/g, " ").trim(),
          color,
          fontSize: Math.max(12, sz / 100),
          bold,
          align,
        });
      } else if (fill && geom === "rect") {
        elements.push({ kind: "shape", ...box, fill, shape: "rect" });
      }
    } catch {
      // Skip a single unreadable element rather than failing the slide.
    }
  }
  return elements;
}

function slideOrder(zip: JSZip, presentationXml: string, relsXml: string): string[] {
  const pres = parseXml(presentationXml);
  const rels = parseXml(relsXml);
  const relMap = new Map<string, string>();
  rels.querySelectorAll("Relationship").forEach((rel) => {
    const id = rel.getAttribute("Id");
    const target = rel.getAttribute("Target");
    if (id && target) relMap.set(id, target.replace(/^\//, ""));
  });
  const ids = Array.from(pres.querySelectorAll("p\\:sldId, sldId"))
    .map((node) => node.getAttribute("r:id"))
    .filter((id): id is string => Boolean(id));
  const paths = ids
    .map((id) => relMap.get(id))
    .filter((p): p is string => Boolean(p))
    .map((p) => (p.startsWith("ppt/") ? p : `ppt/${p.replace(/^\.\//, "")}`));
  if (paths.length) return paths;
  return Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export async function importPptx(file: Blob, filename: string): Promise<PresentationDoc> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new ImportError(`${filename} is not a readable PPTX package.`, [
      "Re-save the deck as PPTX from PowerPoint, Keynote, or Google Slides.",
    ]);
  }
  const presentationFile = zip.file("ppt/presentation.xml");
  const relFile = zip.file("ppt/_rels/presentation.xml.rels");
  if (!presentationFile || !relFile) {
    throw new ImportError(`${filename} is missing the PowerPoint presentation parts.`, [
      "Export a standard PPTX. Older binary .ppt files are not supported.",
    ]);
  }
  const presentationXml = await presentationFile.async("string");
  const size = slideSize(parseXml(presentationXml));
  const order = slideOrder(zip, presentationXml, await relFile.async("string"));
  if (!order.length) {
    throw new ImportError(`${filename} does not contain any slides.`);
  }
  const media = new Map<string, string>();
  const mediaNames = Object.keys(zip.files).filter((name) => name.startsWith("ppt/media/"));
  for (const name of mediaNames) {
    const blob = await zip.file(name)!.async("base64");
    const ext = name.split(".").pop()?.toLowerCase() ?? "png";
    const mime =
      ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "svg" ? "image/svg+xml" : ext === "gif" ? "image/gif" : "image/png";
    media.set(name, `data:${mime};base64,${blob}`);
    media.set(name.replace(/^ppt\//, ""), `data:${mime};base64,${blob}`);
  }

  const slides = [];
  for (const path of order) {
    const slideFile = zip.file(path);
    if (!slideFile) {
      slides.push({
        id: uid("pptx"),
        block: {
          type: "fallback" as const,
          title: "Missing slide",
          message: "This slide was listed in the deck but its XML part was missing.",
        },
      });
      continue;
    }
    try {
      const xml = await slideFile.async("string");
      const relPath = path.replace("ppt/slides/", "ppt/slides/_rels/") + ".rels";
      const rels = new Map<string, string>();
      const relXml = zip.file(relPath);
      if (relXml) {
        parseXml(await relXml.async("string"))
          .querySelectorAll("Relationship")
          .forEach((rel) => {
            const id = rel.getAttribute("Id");
            let target = rel.getAttribute("Target") ?? "";
            if (target.startsWith("../")) target = `ppt/${target.slice(3)}`;
            if (id) rels.set(id, target);
          });
      }
      const elements = elementsFromSlide(parseXml(xml), rels, media, size);
      const fallbackText = Array.from(parseXml(xml).querySelectorAll("a\\:t, t"))
        .map((n) => n.textContent ?? "")
        .join(" ")
        .trim();
      if (!elements.length) {
        slides.push({
          id: uid("pptx"),
          notes: fallbackText,
          block: {
            type: "fallback" as const,
            title: "Slide imported as text",
            message: fallbackText || "This slide had no text, shapes, or images that could be placed.",
            detail: "Positioned drawing content could not be recovered, so the text is shown instead.",
          },
        });
      } else {
        slides.push({
          id: uid("pptx"),
          notes: fallbackText,
          block: {
            type: "pptx" as const,
            width: size.width,
            height: size.height,
            elements,
            fallbackText,
          },
        });
      }
    } catch {
      slides.push({
        id: uid("pptx"),
        block: {
          type: "fallback" as const,
          title: "Unreadable slide",
          message: "This slide could not be parsed and was replaced with a fallback.",
        },
      });
    }
  }
  return makeDoc(titleFromFilename(filename), "pptx", slides, filename);
}
