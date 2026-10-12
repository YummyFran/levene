import { fmt, fmtFixed, fmtPPlain } from "@/lib/format";
import { fPpf } from "@/lib/stats/f-distribution";
import { TEACHING_METHOD_GROUPS, leveneTest } from "@/lib/stats/levene";
import type { PresentationDoc, Slide } from "@/lib/types";
import { uid } from "@/lib/utils";

const mean = leveneTest(TEACHING_METHOD_GROUPS, { center: "mean", alpha: 0.05 });
const median = leveneTest(TEACHING_METHOD_GROUPS, { center: "median", alpha: 0.05 });
const [groupA, groupB, groupC] = mean.groups;

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
    ...F_COLUMNS.map((column) => fPpf(1 - column.alpha, mean.df1, df2).toFixed(3)),
  ]);
}

export function buildLeveneDeck(now = Date.now()): PresentationDoc {
  const fullTable = fTable([8, 10, 12, 14, 16, 20, 24, 30]);
  const focusTable = fTable([10, 12, 14]);
  const slides: Slide[] = [
    slide(
      {
        type: "title",
        kicker: "Test of difference · Equality of variances",
        title: "Levene’s Test: Testing Equality of Variances",
        subtitle: "A guided walkthrough of meaning, application, and the seven-step computation.",
        footer: "Worked example · three teaching methods · α = 0.05",
      },
      "Name the decision: whether the three methods share one variance. This is not a test of means.",
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
      "Say spread, not location. This solution computes the mean-centered form. The median form is only the software check.",
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
      "The use in this problem is the first one: a variance check before comparing mean exam scores across three methods.",
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
        title: "F distribution — critical values (df₁ = 2)",
        caption: "Upper-tail probabilities. The highlighted cell is df₂ = 12 and α = 0.05, the value used in the sample problem.",
        columns: ["df₂", ...F_COLUMNS.map((column) => column.label)],
        rows: fullTable,
        numeric: true,
        highlightRow: fullTable.findIndex((row) => row[0] === "12"),
        highlightCol: 2,
      },
      `Show how to read the table: column α = 0.05, row df₂ = 12. The cell is ${fmtFixed(mean.criticalValue, 3)}.`,
    ),
    slide(
      {
        type: "richtext",
        kicker: "Problem",
        title: "Levene’s Test",
        paragraphs: [
          "A researcher wants to determine whether the population variances of students’ exam scores differ among three teaching methods. Five scores are collected from each method, and the test is made at α = 0.05.",
          "Use Levene’s test to decide whether the three population variances are equal. There are k = 3 groups and N = 15 scores. The scores in different methods are independent.",
        ],
      },
      "State the question before the numbers. The data table is the next slide.",
    ),
    slide(
      {
        type: "table",
        kicker: "Given data",
        title: "Raw data — exam scores",
        caption: "Five independent scores from each teaching method.",
        columns: ["Student", "Method A", "Method B", "Method C"],
        rows: groupA.values.map((score, index) => [
          String(index + 1),
          String(score),
          String(groupB.values[index]),
          String(groupC.values[index]),
        ]),
        numeric: true,
      },
      "Student numbers only label the rows. The methods are not paired.",
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
              "There is no significant difference among the exam-score variances of the three teaching methods.",
              "σ₁² = σ₂² = σ₃²",
            ],
          },
          {
            heading: "H₁",
            points: [
              "At least one population variance differs from the others.",
              "The three variances are not all equal.",
            ],
          },
        ],
      },
      "The formal claim is equality of the three population variances. W itself is judged with a right-tailed F rule.",
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
        columns: ["Student", "Method A", "Method B", "Method C"],
        rows: groupA.values.map((score, index) => [
          String(index + 1),
          String(score),
          String(groupB.values[index]),
          String(groupC.values[index]),
        ]),
        numeric: true,
      },
      "The sample means are 80, 76, and 85. Those summaries describe the scores. They are not W.",
    ),
    slide(
      {
        type: "formula",
        kicker: "Step 4 of 7",
        title: "Test Statistic Used",
        formula: "W = ((N − k) / (k − 1)) · (Σ nᵢ (Z̄ᵢ − Z̄)²) / (Σ Σ (Zᵢⱼ − Z̄ᵢ)²)",
        stacked: "mean",
        symbols: [
          { symbol: "Tool", meaning: "Levene’s test, mean-centered. Distribution: F." },
          { symbol: "df", meaning: "df₁ = 3 − 1 = 2. df₂ = 15 − 3 = 12." },
          { symbol: "SSB_z", meaning: "Σ nᵢ (Z̄ᵢ − Z̄)², between methods." },
          { symbol: "SSW_z", meaning: "Σ Σ (Zᵢⱼ − Z̄ᵢ)², within methods." },
        ],
        note: "Zᵢⱼ = |Yᵢⱼ − Ȳᵢ|. The critical value is F at α = 0.05, df₁ = 2, df₂ = 12.",
      },
      "Name the tool, then move into the manual arithmetic. This is the same full formula as the earlier slide, with this problem’s degrees of freedom.",
    ),
    slide(
      {
        type: "table",
        kicker: "Step 5 of 7",
        title: "Compute the Test Statistic & Determine the Critical/Table Value",
        caption: "a. Absolute deviations from each group mean. Means are 80, 76, and 85.",
        columns: ["Student", "A", "Zₐ", "B", "Zᵦ", "C", "Z꜀"],
        rows: [
          ...groupA.values.map((score, index) => [
            String(index + 1),
            String(score),
            num(groupA.absoluteDeviations[index]),
            String(groupB.values[index]),
            num(groupB.absoluteDeviations[index]),
            String(groupC.values[index]),
            num(groupC.absoluteDeviations[index]),
          ]),
          [
            "Mean of Z",
            "—",
            num(groupA.meanAbsoluteDeviation),
            "—",
            num(groupB.meanAbsoluteDeviation),
            "—",
            num(groupC.meanAbsoluteDeviation),
          ],
        ],
        numeric: true,
      },
      "Work one cell aloud: student 2 in Method A is |82 − 80| = 2. The means of Z are 0.8, 7.2, and 0.8. The grand mean of all Z values is 2.9333.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 5 of 7",
        title: "Compute the Test Statistic & Determine the Critical/Table Value",
        lines: [
          {
            label: "Between",
            expression: "SSB = 5(0.8 − 2.9333)² + 5(7.2 − 2.9333)² + 5(0.8 − 2.9333)²",
            result: mean.betweenSumOfSquares.toFixed(4),
          },
          {
            label: "Within",
            expression: `${groupA.withinSumOfSquares.toFixed(1)} + ${groupB.withinSumOfSquares.toFixed(1)} + ${groupC.withinSumOfSquares.toFixed(1)}`,
            result: mean.withinSumOfSquares.toFixed(4),
          },
          {
            label: "Statistic",
            expression: "W = (12 / 2) × (136.5333 / 120.4000)",
            result: mean.statistic.toFixed(3),
          },
        ],
        note: "b. Substitute the sums. W = 6.804. The unrounded value is 6.80399.",
      },
      "Advance one line at a time. The between sum of squares is 136.5333 and the within sum of squares is 120.4000.",
    ),
    slide(
      {
        type: "table",
        kicker: "Step 5 of 7",
        title: "Determine the Critical / Table Value",
        caption: `df₁ = 2. At df₂ = 12 and α = 0.05, F critical = ${fmtFixed(mean.criticalValue, 3)}.`,
        columns: ["df₂", ...F_COLUMNS.map((column) => column.label)],
        rows: focusTable,
        numeric: true,
        highlightRow: focusTable.findIndex((row) => row[0] === "12"),
        highlightCol: 2,
      },
      "Read column 0.05 and row 12. W = 6.804 is above that critical value.",
    ),
    slide(
      {
        type: "compare",
        kicker: "Step 5 of 7",
        title: "Compute the Test Statistic & Determine the Critical/Table Value",
        columns: [
          { heading: "Computed value", points: [mean.statistic.toFixed(3)] },
          { heading: "Critical / table value", points: [fmtFixed(mean.criticalValue, 3)] },
        ],
        footnote: `${mean.statistic.toFixed(3)} is greater than ${fmtFixed(mean.criticalValue, 3)}. The p-value is ${mean.pValue.toFixed(4)}.`,
      },
      "Stop at the comparison. The reject-or-not statement belongs in Step 6.",
    ),
    slide(
      {
        type: "table",
        kicker: "Step 5 of 7",
        title: "Software Verification",
        caption: "The manual sums of squares were checked against the same F tail probability used by SciPy’s levene function.",
        columns: ["Source", "Center", "W", "p-value"],
        rows: [
          ["Hand calculation", "Mean", mean.statistic.toFixed(3), mean.pValue.toFixed(4)],
          ["F tail probability", "Mean", mean.statistic.toFixed(3), mean.pValue.toFixed(4)],
          ["Hand calculation", "Median", median.statistic.toFixed(3), median.pValue.toFixed(4)],
          ["F tail probability", "Median", median.statistic.toFixed(3), median.pValue.toFixed(4)],
        ],
        numeric: true,
      },
      "The official solution is the mean-centered test. Brown–Forsythe, the median-centered form, is only this check. It does not replace the formula or the seven steps.",
    ),
    slide(
      {
        type: "decision",
        kicker: "Step 6 of 7",
        title: "Make a Statistical Decision (Based on Computation)",
        rules: [
          {
            name: "Right-tailed F",
            comparison: `W = ${mean.statistic.toFixed(3)} is greater than F critical = ${fmtFixed(mean.criticalValue, 3)}`,
            outcome: "Reject H₀",
            reject: true,
          },
        ],
        verdict: "Reject H₀",
        detail:
          "H₀: the three population variances are equal (σ₁² = σ₂² = σ₃²). Reject. H₁: at least one variance differs. Accept.",
      },
      "Use the course rule: a computed value greater than the critical value means reject.",
    ),
    slide(
      {
        type: "callout",
        kicker: "Step 6 of 7",
        title: "Make a Statistical Decision (Based on p-value from Software)",
        tone: "warn",
        body: `Since the p-value (${mean.pValue.toFixed(4)}) is less than α = 0.05, the result verifies the decision to reject H₀.`,
        aside: "The unrounded tail probability is 0.01059, which rounds to 0.0106.",
      },
      "The critical-value route and the p-value route agree.",
    ),
    slide(
      {
        type: "callout",
        kicker: "Step 7 of 7",
        title: "Conclusion",
        tone: "warn",
        body: "At α = 0.05, there is sufficient evidence that the population variances of the three teaching-method groups are not all equal.",
        aside: "Levene’s test evaluates equality of variances, not equality of the group means. Equal variances should not be assumed for a later comparison of those means.",
      },
      "State the level, the evidence, and that the result is about spread. The means are 80, 76, and 85, but that is not what this test decided.",
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
