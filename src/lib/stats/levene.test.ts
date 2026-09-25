import { describe, expect, it } from "vitest";
import { fCdf, fPpf, fSf } from "@/lib/stats/f-distribution";
import { EXAMPLE_GROUPS, leveneTest } from "@/lib/stats/levene";
import { buildLeveneDeck } from "@/lib/presentations/levene-deck";

describe("F distribution", () => {
  it("matches SciPy critical value F_0.95(1, 14)", () => {
    const crit = fPpf(0.95, 1, 14);
    expect(crit).toBeCloseTo(4.60010993667, 4);
  });

  it("matches SciPy survival values used in the worked example", () => {
    expect(fSf(45, 1, 14)).toBeCloseTo(9.97163026051e-6, 10);
    expect(fSf(42, 1, 14)).toBeCloseTo(1.4471306468e-5, 9);
  });

  it("is a proper CDF at the critical value", () => {
    const crit = fPpf(0.95, 1, 14);
    expect(fCdf(crit, 1, 14)).toBeCloseTo(0.95, 5);
  });
});

describe("Levene calculation", () => {
  const meanResult = leveneTest(EXAMPLE_GROUPS, { center: "mean", alpha: 0.05 });
  const medianResult = leveneTest(EXAMPLE_GROUPS, { center: "median", alpha: 0.05 });

  it("computes the mean-centered statistic from the absolute deviations", () => {
    expect(meanResult.groups[0].center).toBeCloseTo(13.625, 10);
    expect(meanResult.groups[1].center).toBeCloseTo(13.625, 10);
    expect(meanResult.groups[0].meanAbsoluteDeviation).toBeCloseTo(1.125, 10);
    expect(meanResult.groups[1].meanAbsoluteDeviation).toBeCloseTo(4.875, 10);
    expect(meanResult.grandMeanOfDeviations).toBeCloseTo(3, 10);
    expect(meanResult.betweenSumOfSquares).toBeCloseTo(56.25, 10);
    expect(meanResult.withinSumOfSquares).toBeCloseTo(17.5, 10);
    expect(meanResult.statistic).toBeCloseTo(45, 10);
    expect(meanResult.df1).toBe(1);
    expect(meanResult.df2).toBe(14);
  });

  it("computes the Brown–Forsythe median-centered statistic", () => {
    expect(medianResult.groups[0].center).toBeCloseTo(13.5, 10);
    expect(medianResult.groups[1].center).toBeCloseTo(14, 10);
    expect(medianResult.betweenSumOfSquares).toBeCloseTo(56.25, 10);
    expect(medianResult.withinSumOfSquares).toBeCloseTo(18.75, 10);
    expect(medianResult.statistic).toBeCloseTo(42, 10);
  });

  it("rejects equality of variances by both the critical value and the p-value", () => {
    for (const result of [meanResult, medianResult]) {
      expect(result.statistic).toBeGreaterThan(result.criticalValue);
      expect(result.pValue).toBeLessThan(0.05);
      expect(result.rejectByCriticalValue).toBe(true);
      expect(result.rejectByPValue).toBe(true);
      expect(result.rejectNull).toBe(true);
    }
  });

  it("does not reject when the spreads match", () => {
    const result = leveneTest(
      [
        { label: "A", values: [10, 12, 11, 13, 9, 14, 10, 12] },
        { label: "B", values: [11, 13, 10, 12, 14, 9, 11, 13] },
      ],
      { center: "mean" },
    );
    expect(result.statistic).toBeCloseTo(0, 8);
    expect(result.pValue).toBeCloseTo(1, 6);
    expect(result.rejectNull).toBe(false);
  });

  it("keeps the two centering choices distinct when medians and means differ", () => {
    const groups = [
      { label: "A", values: [1, 2, 2, 3, 9] },
      { label: "B", values: [4, 5, 5, 6, 7] },
    ];
    const byMean = leveneTest(groups, { center: "mean" });
    const byMedian = leveneTest(groups, { center: "median" });
    expect(byMean.groups[0].center).not.toBeCloseTo(byMedian.groups[0].center, 5);
    expect(byMean.statistic).not.toBeCloseTo(byMedian.statistic, 4);
  });

  it("reports sample variances that describe the raw data", () => {
    expect(meanResult.groups[0].sampleVariance).toBeCloseTo(1.982142857142857, 8);
    expect(meanResult.groups[1].sampleVariance).toBeCloseTo(29.125, 8);
  });
});

describe("Levene deck", () => {
  it("embeds the computed statistic rather than a separate hardcoded answer", () => {
    const deck = buildLeveneDeck();
    const text = JSON.stringify(deck.slides);
    expect(deck.title).toBe("Levene’s Test: Testing Equality of Variances");
    expect(text).toContain("45");
    expect(text).toContain("42");
    expect(text).toContain("4.600");
    expect(deck.slides.length).toBeGreaterThan(20);
    const kickers = deck.slides
      .map((s) => ("kicker" in s.block ? s.block.kicker : ""))
      .filter(Boolean);
    const stepOrder = [1, 2, 3, 4, 5, 6, 7].map((n) =>
      kickers.findIndex((k) => k?.startsWith(`Step ${n}`)),
    );
    expect(stepOrder.every((i) => i >= 0)).toBe(true);
    for (let i = 1; i < stepOrder.length; i++) {
      expect(stepOrder[i]).toBeGreaterThan(stepOrder[i - 1]);
    }
  });
});
