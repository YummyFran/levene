import { importPdf } from "@/lib/import/pdf";
import { importPptx } from "@/lib/import/pptx";
import { importImages, importVideo } from "@/lib/import/media";
import { CONVERSION_HINTS, extensionOf } from "@/lib/import/shared";
import { importMarkdown, importNativeJson, importPlainText } from "@/lib/import/text-formats";
import type { PresentationDoc } from "@/lib/types";
import { ImportError } from "@/lib/types";

const MAX_BYTES = 80 * 1024 * 1024;

export async function importFiles(files: File[]): Promise<PresentationDoc> {
  if (!files.length) throw new ImportError("Choose a file to import.");
  const images = files.filter((file) =>
    ["png", "jpg", "jpeg", "webp", "svg"].includes(extensionOf(file.name)),
  );
  if (images.length === files.length) {
    guardSize(images);
    return importImages(images);
  }
  if (files.length > 1) {
    throw new ImportError("Import one presentation file at a time, or several images together.", [
      "Images can be selected together and become one deck, in the order you chose them.",
    ]);
  }
  const file = files[0];
  guardSize([file]);
  const ext = extensionOf(file.name);
  switch (ext) {
    case "pptx":
      return importPptx(file, file.name);
    case "pdf":
      return importPdf(file, file.name);
    case "md":
    case "markdown":
      return importMarkdown(await file.text(), file.name);
    case "txt":
      return importPlainText(await file.text(), file.name);
    case "json":
      return importNativeJson(await file.text(), file.name);
    case "mp4":
      return importVideo(file, "mp4");
    case "webm":
      return importVideo(file, "webm");
    default:
      throw new ImportError(
        ext
          ? `.${ext} files are not supported.`
          : "This file has no extension this app can recognize.",
        CONVERSION_HINTS,
      );
  }
}

function guardSize(files: File[]) {
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_BYTES) {
    throw new ImportError("That file is larger than 80 MB. Presentations are stored in this browser, so very large media is refused.", [
      "Compress the video, or export a PDF of the slides instead.",
    ]);
  }
  if (files.some((file) => file.size === 0)) {
    throw new ImportError("The file is empty.");
  }
}
