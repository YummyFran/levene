/** Which stacked equation to draw for a formula slide. */
export type StackedFormula = "mean" | "median" | "parts";

/**
 * Older copies of the Levene deck stored only the one-line formula string.
 * Recognize those strings so a refresh still draws the stacked fraction.
 */
export function resolveStackedFormula(block: {
  stacked?: string;
  formula?: string;
}): StackedFormula | undefined {
  if (block.stacked === "mean" || block.stacked === "median" || block.stacked === "parts") {
    return block.stacked;
  }
  const formula = block.formula ?? "";
  if (formula.includes("SSB")) return "parts";
  if (formula.includes("(N − k)") || formula.includes("(N - k)")) return "mean";
  return undefined;
}
