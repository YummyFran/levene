import { describe, expect, it } from "vitest";
import { importFiles } from "@/lib/import/import-file";
import { importMarkdown, importNativeJson, importPlainText } from "@/lib/import/text-formats";
import { ImportError } from "@/lib/types";

describe("text importers", () => {
  it("splits markdown on horizontal rules", () => {
    const doc = importMarkdown("# Opening\n\nA first idea.\n\n---\n# Second\n\nAnother idea.", "notes.md");
    expect(doc.fileType).toBe("markdown");
    expect(doc.slides).toHaveLength(2);
    expect(doc.slides[0].block).toMatchObject({ type: "richtext", title: "Opening" });
  });

  it("splits plain text the same way", () => {
    const doc = importPlainText("Given data\n\n12 14 13\n\n---\nDecision\n\nReject.", "lab.txt");
    expect(doc.slides).toHaveLength(2);
    expect(doc.fileType).toBe("text");
  });

  it("accepts a native JSON deck and falls back on a bad slide", () => {
    const doc = importNativeJson(
      JSON.stringify({
        title: "Lab notes",
        slides: [
          { id: "a", notes: "Speak slowly.", block: { type: "title", title: "Lab notes" } },
          { id: "b", nope: true },
        ],
      }),
      "lab.json",
    );
    expect(doc.title).toBe("Lab notes");
    expect(doc.slides[1].block.type).toBe("fallback");
  });

  it("rejects malformed JSON with a conversion hint", () => {
    expect(() => importNativeJson("{", "broken.json")).toThrow(ImportError);
  });
});

describe("importFiles", () => {
  it("refuses an unsupported extension", async () => {
    const file = new File(["hello"], "lecture.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    await expect(importFiles([file])).rejects.toBeInstanceOf(ImportError);
    try {
      await importFiles([file]);
    } catch (error) {
      expect(error).toBeInstanceOf(ImportError);
      expect((error as ImportError).message).toMatch(/not supported/i);
      expect((error as ImportError).suggestions.length).toBeGreaterThan(0);
    }
  });

  it("imports markdown through the file entry point", async () => {
    const file = new File(["# One\n\nBody"], "field.md", { type: "text/markdown" });
    const doc = await importFiles([file]);
    expect(doc.fileType).toBe("markdown");
    expect(doc.slides).toHaveLength(1);
  });
});
