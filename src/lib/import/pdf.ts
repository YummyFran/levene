import { makeDoc, titleFromFilename } from "@/lib/import/shared";
import type { PresentationDoc } from "@/lib/types";
import { ImportError } from "@/lib/types";
import { uid } from "@/lib/utils";

export async function importPdf(file: Blob, filename: string): Promise<PresentationDoc> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const data = new Uint8Array(await file.arrayBuffer());
  let pdf: Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]>;
  try {
    pdf = await pdfjs.getDocument({ data }).promise;
  } catch {
    throw new ImportError(`${filename} could not be opened as a PDF.`, [
      "Re-export the PDF. Password-protected files are not supported.",
    ]);
  }
  const slides = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    try {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.4 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      const src = canvas.toDataURL("image/jpeg", 0.86);
      slides.push({
        id: uid("pdf"),
        notes: `PDF page ${pageNumber}`,
        block: {
          type: "image" as const,
          title: `Page ${pageNumber}`,
          src,
          alt: `${filename} page ${pageNumber}`,
        },
      });
    } catch {
      slides.push({
        id: uid("pdf"),
        block: {
          type: "fallback" as const,
          title: `Page ${pageNumber}`,
          message: "This PDF page could not be rendered and was replaced with a fallback.",
        },
      });
    }
  }
  if (!slides.length) throw new ImportError(`${filename} has no pages.`);
  return makeDoc(titleFromFilename(filename), "pdf", slides, filename);
}
