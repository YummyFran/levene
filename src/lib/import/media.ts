import { makeDoc, readAsDataUrl, titleFromFilename } from "@/lib/import/shared";
import type { FileKind, PresentationDoc } from "@/lib/types";
import { uid } from "@/lib/utils";

const IMAGE_KINDS = new Set<FileKind>(["png", "jpg", "jpeg", "webp", "svg"]);

export async function importImages(files: File[]): Promise<PresentationDoc> {
  const slides = [];
  for (const file of files) {
    const src = await readAsDataUrl(file);
    slides.push({
      id: uid("img"),
      notes: file.name,
      block: {
        type: "image" as const,
        title: file.name.replace(/\.[^.]+$/, ""),
        src,
        alt: file.name,
      },
    });
  }
  const first = files[0];
  const kind = (first.name.split(".").pop() ?? "png").toLowerCase() as FileKind;
  const fileType = IMAGE_KINDS.has(kind) ? kind : "png";
  const title = files.length === 1 ? titleFromFilename(first.name) : `${titleFromFilename(first.name)} and ${files.length - 1} more`;
  return makeDoc(title, fileType, slides, files.map((f) => f.name).join(", "));
}

export async function importVideo(file: File, kind: "mp4" | "webm"): Promise<PresentationDoc> {
  const src = await readAsDataUrl(file);
  return makeDoc(
    titleFromFilename(file.name),
    kind,
    [
      {
        id: uid("vid"),
        notes: "Video slide. Playback controls stay available during the presentation.",
        block: {
          type: "video",
          title: titleFromFilename(file.name),
          src,
          mime: kind === "mp4" ? "video/mp4" : "video/webm",
        },
      },
    ],
    file.name,
  );
}
