import { describe, expect, it } from "vitest";
import { resolveStackedFormula } from "@/lib/formula-layout";

describe("resolveStackedFormula", () => {
  it("keeps an explicit stacked choice", () => {
    expect(resolveStackedFormula({ stacked: "median", formula: "anything" })).toBe("median");
  });

  it("upgrades the stored one-line Levene formula", () => {
    expect(
      resolveStackedFormula({
        formula: "W = ((N − k) / (k − 1)) · (Σ nᵢ (Z̄ᵢ − Z̄)²) / (Σ Σ (Zᵢⱼ − Z̄ᵢ)²)",
      }),
    ).toBe("mean");
  });

  it("upgrades the stored sums-of-squares form", () => {
    expect(
      resolveStackedFormula({
        formula: "W = ((N − k) / (k − 1)) · SSB_z / SSW_z",
      }),
    ).toBe("parts");
  });
});
