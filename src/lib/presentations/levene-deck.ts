import { fmt, fmtFixed, fmtPPlain } from "@/lib/format";
import { fPpf } from "@/lib/stats/f-distribution";
import { EXAMPLE_GROUPS, leveneTest } from "@/lib/stats/levene";
import type { PresentationDoc, Slide } from "@/lib/types";
import { uid } from "@/lib/utils";

const mean = leveneTest(EXAMPLE_GROUPS, { center: "mean", alpha: 0.05 });
const median = leveneTest(EXAMPLE_GROUPS, { center: "median", alpha: 0.05 });
const a = mean.groups[0];
const b = mean.groups[1];

function slide(block: Slide["block"], notes: string): Slide {
  return { id: uid("lv"), block, notes };
}

function num(n: number): string {
  return fmt(n, 3);
}

const F_COLUMNS = [
  { label: "0.10", alpha: 0.1 },
  { label: "0.05", alpha: 0.05 },
  { label: "0.025", alpha: 0.025 },
  { label: "0.01", alpha: 0.01 },
] as const;

function fTable(df2Values: number[]) {
  return df2Values.map((df2) => [
    String(df2),
    ...F_COLUMNS.map((column) => fPpf(1 - column.alpha, 1, df2).toFixed(3)),
  ]);
}

export function buildLeveneDeck(now = Date.now()): PresentationDoc {
  const fullTable = fTable([8, 10, 12, 14, 16, 20, 24, 30]);
  const focusTable = fTable([12, 14, 16]);
  const slides: Slide[] = [
    slide(
      {
        type: "title",
        kicker: "Test of difference · Equality of variances",
        title: "Levene’s Test: Testing Equality of Variances",
        subtitle: "A guided walkthrough of meaning, application, and the seven-step computation.",
        footer: "Worked example · two bottling heads · α = 0.05",
      },
      "Name the decision: whether the two heads share one variance. This is not a test of means.",
    ),
    slide(
      {
        type: "richtext",
        kicker: "Meaning",
        title: "Meaning of Levene’s Test",
        paragraphs: [
          "Levene’s test asks whether two or more independent groups have the same population variance. The statistic W is an ANOVA computed on absolute deviations from each group’s center.",
          "The original test centers each group at its mean. The Brown–Forsythe variation centers each group at its median. Both are compared with an F critical value. The test does not ask whether the means are equal.",
        ],
      },
      "Say spread, not location. In this example the two sample means will match, which makes the variance question easier to see.",
    ),
    slide(
      {
        type: "bullets",
        kicker: "Application / uses of the test",
        title: "Application / Uses of Levene’s Test",
        items: [
          { lead: "Mean comparisons", text: "Before an independent-samples t-test or a one-way ANOVA that assumes equal variances." },
          { lead: "Laboratory work", text: "Comparing the precision of two instruments, pipettes, or assay runs." },
          { lead: "Production", text: "Checking whether two machines or shifts differ in fill, weight, or thickness variation." },
        ],
      },
      "The use in this problem is the first one: a variance check before comparing mean fill volumes.",
    ),
    slide(
      {
        type: "formula",
        kicker: "Formula",
        title: "Formula",
        formula: "W = ((N − k) / (k − 1)) · (Σ nᵢ (Z̄ᵢ − Z̄)²) / (Σ Σ (Zᵢⱼ − Z̄ᵢ)²)",
        stacked: "mean",
        symbols: [
          { symbol: "W", meaning: "Test statistic, referred to an F distribution." },
          { symbol: "k, N", meaning: "Number of groups, and the total number of observations." },
          { symbol: "nᵢ", meaning: "Number of observations in group i." },
          { symbol: "Zᵢⱼ", meaning: "Absolute deviation of observation j from the center of group i." },
          { symbol: "Z̄ᵢ, Z̄", meaning: "Mean of the deviations in group i, and the mean of every deviation." },
        ],
        note: "Under H₀, compare W with F at df₁ = k − 1 and df₂ = N − k. Only a large W counts against equal variances.",
      },
      "Read the numerator as differences among the groups’ typical deviations, and the denominator as leftover variation inside the groups.",
    ),
    slide(
      {
        type: "table",
        kicker: "Statistical table",
        title: "F distribution — critical values (df₁ = 1)",
        caption: "Upper-tail probabilities. The highlighted cell is df₂ = 14 and α = 0.05, the value used in the sample problem.",
        columns: ["df₂", ...F_COLUMNS.map((column) => column.label)],
        rows: fullTable,
        numeric: true,
        highlightRow: fullTable.findIndex((row) => row[0] === "14"),
        highlightCol: 2,
      },
      "Show how to read the table: column α = 0.05, row df₂ = 14. The cell is 4.600.",
    ),
    slide(
      {
        type: "richtext",
        kicker: "Problem",
        title: "Levene’s Test",
        paragraphs: [
          "A pilot plant draws eight cups from Head A and eight cups from Head B. Each cup is a nominal 14 mL aliquot. The question is whether the two heads have the same fill-volume variance, at α = 0.05.",
          "A later comparison of the mean volumes will use an independent-samples t-test. That test changes if the variances differ. The cups are independent fills.",
        ],
      },
      "State the operational reason before the numbers. The data table is the next slide.",
    ),
    slide(
      {
        type: "table",
        kicker: "Given data",
        title: "Raw data — fill volume (mL)",
        caption: "Eight independent cups from each head.",
        columns: ["Cup", "Head A", "Head B"],
        rows: a.values.map((value, index) => [String(index + 1), String(value), String(b.values[index])]),
        numeric: true,
      },
      "Cup numbers only label the rows. The fills are not paired.",
    ),
    slide(
      {
        type: "compare",
        kicker: "Step 1 of 7",
        title: "State the Null Hypothesis (H₀) & Alternative Hypothesis (H₁)",
        columns: [
          {
            heading: "H₀",
            points: [
              "There is no significant difference between the fill-volume variances of Head A and Head B.",
              "σ²ₐ = σ²ᵦ",
            ],
          },
          {
            heading: "H₁",
            points: [
              "There is a significant difference between the fill-volume variances of Head A and Head B.",
              "σ²ₐ ≠ σ²ᵦ",
            ],
          },
        ],
      },
      "The formal claim is equality of the population variances. W itself is judged with a right-tailed F rule.",
    ),
    slide(
      {
        type: "callout",
        kicker: "Step 2 of 7",
        title: "State the Level of Significance",
        tone: "ink",
        body: "The level of significance is α = 0.05.",
        aside: "This means a 5% risk of rejecting a true null hypothesis, a Type I error. The same α is used for the F table and for the p-value.",
      },
      "α is chosen before W is computed.",
    ),
    slide(
      {
        type: "table",
        kicker: "Step 3 of 7",
        title: "Write the Data",
        columns: ["Cup", "Head A", "Head B"],
        rows: a.values.map((value, index) => [String(index + 1), String(value), String(b.values[index])]),
        numeric: true,
      },
      "Both sample means equal 13.625 mL. The sample variances are 1.982 and 29.125. Those summaries describe the data. They are not W.",
    ),
    slide(
      {
        type: "formula",
        kicker: "Step 4 of 7",
        title: "Test Statistic Used",
        formula: "W = ((N − k) / (k − 1)) · SSB_z / SSW_z",
        stacked: "parts",
        symbols: [
          { symbol: "Tool", meaning: "Levene’s test, mean-centered. Distribution: F." },
          { symbol: "df", meaning: "df₁ = 2 − 1 = 1. df₂ = 16 − 2 = 14." },
          { symbol: "SSB_z", meaning: "Σ nᵢ (Z̄ᵢ − Z̄)², between heads." },
          { symbol: "SSW_z", meaning: "Σ Σ (Zᵢⱼ − Z̄ᵢ)², within heads." },
        ],
        note: "Zᵢⱼ = |Yᵢⱼ − Ȳᵢ|. The critical value is F at α = 0.05, df₁ = 1, df₂ = 14.",
      },
      "Name the tool, then move into the manual arithmetic.",
    ),
    slide(
      {
        type: "table",
        kicker: "Step 5 of 7",
        title: "Compute the Test Statistic & Determine the Critical/Table Value",
        caption: `a. Absolute deviations from each group mean. Ȳₐ = Ȳᵦ = ${num(a.center)}.`,
        columns: ["Cup", "A", "Zₐ", "B", "Zᵦ"],
        rows: [
          ...a.values.map((value, index) => [
            String(index + 1),
            String(value),
            num(a.absoluteDeviations[index]),
            String(b.values[index]),
            num(b.absoluteDeviations[index]),
          ]),
          ["Mean of Z", "—", num(a.meanAbsoluteDeviation), "—", num(b.meanAbsoluteDeviation)],
        ],
        numeric: true,
      },
      "Work one cell aloud: cup 1 on Head A is |12 − 13.625| = 1.625. The grand mean of all Z values is 3.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 5 of 7",
        title: "Compute the Test Statistic & Determine the Critical/Table Value",
        lines: [
          {
            label: "Between",
            expression: "SSB = 8(1.125 − 3)² + 8(4.875 − 3)²",
            result: num(mean.betweenSumOfSquares),
          },
          {
            label: "Within",
            expression: `${num(a.withinSumOfSquares)} + ${num(b.withinSumOfSquares)}`,
            result: num(mean.withinSumOfSquares),
          },
          {
            label: "Statistic",
            expression: "W = (14 / 1) × (56.25 / 17.5)",
            result: fmtFixed(mean.statistic, 3),
          },
        ],
        note: "b. Substitute the sums. W = 45 exactly.",
      },
      "Advance one line at a time. 56.25 is the between sum of squares and 17.5 is the within sum of squares.",
    ),
    slide(
      {
        type: "table",
        kicker: "Step 5 of 7",
        title: "Determine the Critical / Table Value",
        caption: "df₁ = 1. At df₂ = 14 and α = 0.05, F critical = 4.600.",
        columns: ["df₂", ...F_COLUMNS.map((column) => column.label)],
        rows: focusTable,
        numeric: true,
        highlightRow: focusTable.findIndex((row) => row[0] === "14"),
        highlightCol: 2,
      },
      "The printed F table gives 4.60 in this cell. Three decimals give 4.600, and either rounding leaves 45 above the critical value.",
    ),
    slide(
      {
        type: "compare",
        kicker: "Step 5 of 7",
        title: "Compute the Test Statistic & Determine the Critical/Table Value",
        columns: [
          { heading: "Computed value", points: [fmtFixed(mean.statistic, 3)] },
          { heading: "Critical / table value", points: [fmtFixed(mean.criticalValue, 3)] },
        ],
        footnote: "45.000 is greater than 4.600. The p-value is " + fmtPPlain(mean.pValue) + ".",
      },
      "Stop at the comparison. The reject-or-not statement belongs in Step 6.",
    ),
    slide(
      {
        type: "table",
        kicker: "Step 5 of 7",
        title: "Software Verification",
        caption: "The manual sums of squares were checked against SciPy’s levene function.",
        columns: ["Source", "Center", "W", "p-value"],
        rows: [
          ["Hand calculation", "Mean", fmtFixed(mean.statistic, 3), fmtPPlain(mean.pValue)],
          ["SciPy levene", "Mean", "45.000", "9.972 × 10⁻⁶"],
          ["Hand calculation", "Median", fmtFixed(median.statistic, 3), fmtPPlain(median.pValue)],
          ["SciPy levene", "Median", "42.000", "1.447 × 10⁻⁵"],
        ],
        numeric: true,
      },
      "Brown–Forsythe, the median-centered form, gives W = 42. It is a check on the center, not a different step. Both statistics exceed 4.600.",
    ),
    slide(
      {
        type: "decision",
        kicker: "Step 6 of 7",
        title: "Make a Statistical Decision (Based on Computation)",
        rules: [
          {
            name: "Right-tailed F",
            comparison: `W = ${fmtFixed(mean.statistic, 3)} is greater than F critical = ${fmtFixed(mean.criticalValue, 3)}`,
            outcome: "Reject H₀",
            reject: true,
          },
        ],
        verdict: "Reject H₀",
        detail:
          "H₀: no significant difference between the variances (σ²ₐ = σ²ᵦ). Reject. H₁: a significant difference (σ²ₐ ≠ σ²ᵦ). Accept.",
      },
      "Use the course rule: a computed value greater than the critical value means reject.",
    ),
    slide(
      {
        type: "callout",
        kicker: "Step 6 of 7",
        title: "Make a Statistical Decision (Based on p-value from Software)",
        tone: "warn",
        body: `Since the p-value (${fmtPPlain(mean.pValue)}) is less than α = 0.05, the software result verifies the decision to reject H₀.`,
        aside: "The median-centered check agrees: its p-value is also below 0.05.",
      },
      "The two routes agree. If they did not, the degrees of freedom would be the first thing to recheck.",
    ),
    slide(
      {
        type: "callout",
        kicker: "Step 7 of 7",
        title: "Conclusion",
        tone: "warn",
        body: "At α = 0.05, there is sufficient evidence that the fill-volume variances of Head A and Head B differ. Head B is the more variable head, so equal variances should not be assumed.",
        aside: "A later mean comparison should use Welch’s t-test rather than the pooled t-test. Head B’s sample standard deviation is about 5.40 mL, against about 1.41 mL for Head A, so the variance gap is large on a 14 mL aliquot.",
      },
      "State the level, the evidence, and what the plant should do next. The matching sample means do not cancel the variance result.",
    ),
  ];

  return {
    id: "builtin-levene",
    title: "Levene’s Test: Testing Equality of Variances",
    fileType: "native",
    sourceName: "Built in",
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: null,
    builtin: true,
    thumbnail: null,
    slides,
  };
}
