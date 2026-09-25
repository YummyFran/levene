# Folio

A local presentation library for lectures. It includes a complete built-in deck, **Levene’s Test: Testing Equality of Variances**, and can import other decks into the browser. Nothing is uploaded to a server, and the app does not need an account or a database.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run lint
npm run build
```

No API keys or external credentials are required.

## What the library does

- Lists built-in and imported presentations as cards, with title, thumbnail, slide count, file type, and last opened date.
- Search, sort, and switch between grid and list.
- Rename, duplicate, and delete. Deleting a built-in deck stays deleted until you restore built-in presentations from the empty state.
- Stores decks in IndexedDB, so they remain after a refresh.
- Presents full screen with previous/next controls, keyboard navigation, a slide overview, notes, an optional timer, hideable controls, light and dark environments, and a progress indicator.

Keyboard in presentation mode: Arrow keys and Page Up/Down move between slides (and between calculation lines when a slide reveals them in steps). Home and End jump to the ends. Escape closes the overview, leaves full screen, or returns to the library. `G` toggles the overview, `N` toggles notes, `H` hides controls, `T` toggles the timer.

## Supported imports

| Extension | What happens |
| --- | --- |
| `.pptx` | Slides are parsed from the Office Open XML package. Text, pictures, basic shapes, positions, and slide order are rendered. A slide that cannot be placed falls back to its text instead of failing the import. |
| `.pdf` | Each page is rendered to an image slide. |
| `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg` | Each image is a slide. Several images selected together become one deck. |
| `.md`, `.markdown` | Split into slides on a line containing `---`. |
| `.txt` | Same split as Markdown, shown as text slides. |
| `.json` | Native deck: `{ "title": "...", "slides": [{ "id", "notes", "block" }] }`. A bad slide becomes a fallback slide. Invalid JSON is rejected with a message. |
| `.mp4`, `.webm` | One video slide. |

Other extensions, including legacy `.ppt` and `.docx`, are refused with conversion suggestions. Empty files and files over 80 MB are refused. Password-protected PDFs are not supported.

Sample files live in `public/samples/`.

## Levene’s Test deck

The built-in lecture follows the course write-up:

1. State the null and alternative hypotheses.
2. State the level of significance (α = 0.05).
3. Write the given data.
4. Name the test statistic.
5. Compute the statistic, the critical value, and the p-value, including the manual tables and a software check.
6. Make the statistical decision.
7. State the conclusion.

Introductory slides on meaning, assumptions, and the formula come before those numbered steps. They are not extra steps.

The worked example is original: eight fill-volume cups from each of two bottling heads. The official solution is the mean-centered Levene statistic. The median-centered Brown–Forsythe statistic is computed in Step 5 as a robustness check. Both reject equal variances at α = 0.05.

Arithmetic is produced by `src/lib/stats/levene.ts`, not typed in by hand. `npm test` checks the sums of squares, W = 45 (mean) and W = 42 (median), the F critical value, and the p-values against values cross-checked with SciPy.

## Adding a presentation

1. Add a builder in `src/lib/presentations/` that returns a `PresentationDoc`.
2. Keep each slide as data (`Slide` / `SlideBlock` in `src/lib/types.ts`). `SlideView` renders the block; do not build a one-off page for the deck.
3. Register the builder in `src/lib/presentations/registry.ts`.
4. Built-in decks are inserted into IndexedDB once. After that, use **Restore built-in presentations** if a deck was deleted, or clear site data to reseed.

You can also author a JSON file and import it. Block types include `title`, `section`, `bullets`, `compare`, `formula`, `table`, `dots`, `calculation`, `decision`, `callout`, `summary`, and `richtext`.

## Limitations

- PPTX rendering covers text, images, and simple preset shapes. SmartArt, charts, animations, embedded video, and theme-accurate fonts are not reproduced. Those slides fall back to extracted text when nothing can be placed.
- PDF import is a page image, so text on a PDF slide is not separately editable.
- Video and large images are stored in this browser and can make IndexedDB large.
- The F critical value and p-value come from a regularized incomplete-beta routine in the app. They were checked against SciPy; the app does not call SciPy at runtime.
- There is no sign-in, sync, or server-side storage.

## Stack

Next.js, TypeScript, Tailwind CSS, and Radix-based UI components in `src/components/ui` (the shadcn/ui pattern). Fonts are Source Sans 3, Source Serif 4, and IBM Plex Mono.
