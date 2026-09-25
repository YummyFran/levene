import { buildLeveneDeck } from "@/lib/presentations/levene-deck";
import { buildStepsDeck } from "@/lib/presentations/steps-deck";
import type { PresentationDoc } from "@/lib/types";

/**
 * Built-in decks. To add another, write a builder that returns a PresentationDoc
 * and append it here. Keep slide content in data, not in a one-off page component.
 */
export function builtinPresentations(now = Date.now()): PresentationDoc[] {
  return [buildLeveneDeck(now), buildStepsDeck(now)];
}
