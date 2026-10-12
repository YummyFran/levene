import { fmtFixed } from "@/lib/format";
import { fPpf } from "@/lib/stats/f-distribution";
import { TEACHING_METHOD_GROUPS, leveneTest } from "@/lib/stats/levene";
import type { PresentationDoc, Slide } from "@/lib/types";
import { uid } from "@/lib/utils";

const result = leveneTest(TEACHING_METHOD_GROUPS, { center: "mean", alpha: 0.05 });
const [groupA, groupB, groupC] = result.groups;
const msBetween = result.betweenSumOfSquares / result.df1;
const msWithin = result.withinSumOfSquares / result.df2;

function slide(block: Slide["block"], notes: string): Slide {
  return { id: uid("lv"), block, notes };
}

function d4(n: number): string {
  return n.toFixed(4);
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
    ...F_COLUMNS.map((column) => fPpf(1 - column.alpha, result.df1, df2).toFixed(3)),
  ]);
}

export function buildLeveneDeck(now = Date.now()): PresentationDoc {
  const fullTable = fTable([8, 10, 12, 14, 16, 20, 24, 30]);
  const slides: Slide[] = [
    slide(
      {
        type: "title",
        kicker: "Test of difference · Equality of variances",
        title: "Levene’s Test: Testing Equality of Variances",
        subtitle: "Exam scores from three teaching methods, solved with the mean-centered form of Levene’s test.",
        footer: "k = 3 · n = 5 · N = 15 · α = 0.05",
      },
      "The question is whether the three population variances are equal. The test does not compare the mean scores.",
    ),
    slide(
      {
        type: "richtext",
        kicker: "Meaning",
        title: "Meaning of Levene’s Test",
        paragraphs: [
          "Levene’s test asks whether two or more independent groups have the same population variance. This solution uses the mean-centered form: each score is replaced by its absolute deviation from its own group mean, and those deviations are compared with an ANOVA.",
          "The resulting statistic W is referred to an F distribution. A large W means the groups do not share one common variance.",
        ],
      },
      "Keep the wording on variances. Means are used only as the center of each group.",
    ),
    slide(
      {
        type: "bullets",
        kicker: "Application / uses of the test",
        title: "Application / Uses of Levene’s Test",
        items: [
          { lead: "Mean comparisons", text: "Before an independent-samples t-test or ANOVA that assumes equal variances." },
          { lead: "Education", text: "Checking whether exam-score spreads differ across teaching methods, as in this problem." },
          { lead: "Measurement", text: "Comparing the precision of instruments, shifts, or production lines." },
        ],
      },
      "This problem is the education case: three methods, five scores each.",
    ),
    slide(
      {
        type: "formula",
        kicker: "Formula",
        title: "Formula",
        formula: "W = (SS_between / df_between) / (SS_within / df_within)",
        stacked: "parts",
        symbols: [
          { symbol: "W", meaning: "Levene’s statistic: MS_between / MS_within on the absolute deviations." },
          { symbol: "Zᵢⱼ", meaning: "|Xᵢⱼ − X̄ᵢ|, the absolute deviation from the group mean." },
          { symbol: "df", meaning: "df₁ = k − 1 and df₂ = N − k." },
          { symbol: "F", meaning: "W is compared with the upper tail of F(df₁, df₂)." },
        ],
        note: "In this problem k = 3 and N = 15, so df₁ = 2 and df₂ = 12.",
      },
      "The stacked ratio is the same ANOVA F ratio, applied to the Z values rather than to the raw scores.",
    ),
    slide(
      {
        type: "table",
        kicker: "Statistical table",
        title: "F distribution — critical values (df₁ = 2)",
        caption: "Upper-tail probabilities. The highlighted cell is df₂ = 12 and α = 0.05.",
        columns: ["df₂", ...F_COLUMNS.map((column) => column.label)],
        rows: fullTable,
        numeric: true,
        highlightRow: fullTable.findIndex((row) => row[0] === "12"),
        highlightCol: 2,
      },
      `The critical value used with W is ${fmtFixed(result.criticalValue, 3)}.`,
    ),
    slide(
      {
        type: "richtext",
        kicker: "Problem",
        title: "Three teaching methods",
        paragraphs: [
          "A researcher wants to determine whether the population variances of students’ exam scores differ among three teaching methods. Five scores are collected from each method.",
          "Use Levene’s test at α = 0.05 to decide whether the three population variances are equal. There are k = 3 groups, n = 5 scores in each group, and N = 15 scores in all.",
        ],
      },
      "Read the question once before showing the table. The solution starts on the next slides.",
    ),
    slide(
      {
        type: "table",
        kicker: "Given data",
        title: "Exam scores",
        caption: "Five independent scores for each teaching method.",
        columns: ["Student", "Method A", "Method B", "Method C"],
        rows: groupA.values.map((score, index) => [
          String(index + 1),
          String(score),
          String(groupB.values[index]),
          String(groupC.values[index]),
        ]),
        numeric: true,
      },
      "The rows are not paired across methods. Each column is its own sample.",
    ),
    slide(
      {
        type: "compare",
        kicker: "Step 1",
        title: "State the hypotheses",
        columns: [
          {
            heading: "H₀",
            points: ["σ₁² = σ₂² = σ₃²", "The population variances of the three groups are equal."],
          },
          {
            heading: "H₁",
            points: ["At least one population variance differs from the others."],
          },
        ],
      },
      "H₁ is not a claim that every variance differs. One difference is enough.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 2",
        title: "Calculate the mean of each group",
        lines: [
          { label: "Formula", expression: "X̄ = ΣX / n", result: "n = 5" },
          { label: "Method A", expression: "(80 + 82 + 78 + 80 + 80) / 5 = 400 / 5", result: "80" },
          { label: "Method B", expression: "(70 + 75 + 65 + 90 + 80) / 5 = 380 / 5", result: "76" },
          { label: "Method C", expression: "(85 + 87 + 83 + 85 + 85) / 5 = 425 / 5", result: "85" },
        ],
      },
      "Each mean is the center used for that group’s absolute deviations.",
    ),
    slide(
      {
        type: "table",
        kicker: "Step 2",
        title: "Group sums and means",
        columns: ["Group", "Sum", "n", "Mean"],
        rows: [
          ["Method A", "400", "5", "80"],
          ["Method B", "380", "5", "76"],
          ["Method C", "425", "5", "85"],
        ],
        numeric: true,
      },
      "Leave this table visible before moving to the deviations.",
    ),
    slide(
      {
        type: "table",
        kicker: "Step 3",
        title: "Calculate the absolute deviations",
        caption: "Zᵢⱼ = |Xᵢⱼ − X̄ᵢ|. Each score is subtracted from its own group mean.",
        columns: ["A calc.", "Zₐ", "B calc.", "Zᵦ", "C calc.", "Z꜀"],
        rows: groupA.values.map((score, index) => [
          `|${score} − ${groupA.sampleMean}|`,
          String(groupA.absoluteDeviations[index]),
          `|${groupB.values[index]} − ${groupB.sampleMean}|`,
          String(groupB.absoluteDeviations[index]),
          `|${groupC.values[index]} − ${groupC.sampleMean}|`,
          String(groupC.absoluteDeviations[index]),
        ]),
        numeric: true,
      },
      "Method A’s deviations are 0, 2, 2, 0, 0. Method B’s are 6, 1, 11, 14, 4. Method C’s match Method A: 0, 2, 2, 0, 0.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 4",
        title: "Mean of the absolute deviations",
        lines: [
          { label: "Formula", expression: "Z̄ᵢ = ΣZᵢⱼ / n", result: "n = 5" },
          { label: "Method A", expression: "(0 + 2 + 2 + 0 + 0) / 5 = 4 / 5", result: "0.8" },
          { label: "Method B", expression: "(6 + 1 + 11 + 14 + 4) / 5 = 36 / 5", result: "7.2" },
          { label: "Method C", expression: "(0 + 2 + 2 + 0 + 0) / 5 = 4 / 5", result: "0.8" },
        ],
      },
      "Method B’s scores sit much farther from their own mean than the other two methods.",
    ),
    slide(
      {
        type: "table",
        kicker: "Step 4",
        title: "Sums and means of the deviations",
        columns: ["Group", "Sum of deviations", "n", "Mean deviation"],
        rows: [
          ["Method A", "4", "5", "0.8"],
          ["Method B", "36", "5", "7.2"],
          ["Method C", "4", "5", "0.8"],
        ],
        numeric: true,
      },
      "These three means, 0.8, 7.2, and 0.8, are the inputs to the between-groups sum of squares.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 5",
        title: "Grand mean of the absolute deviations",
        lines: [
          { label: "Formula", expression: "Z̄ = ΣZᵢⱼ / N", result: "N = 15" },
          { label: "Sums", expression: "4 + 36 + 4", result: "44" },
          { label: "Grand mean", expression: "44 / 15", result: d4(result.grandMeanOfDeviations) },
        ],
        note: "44/15 = 2.9333…. Later squares use the full value. Slides show 2.9333.",
      },
      "Do not average the three group means again without weights. Here the groups are equal, so the result matches, but the formula is the mean of all 15 deviations.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 6",
        title: "Between-groups sum of squares",
        lines: [
          { label: "Formula", expression: "SS_between = Σ nᵢ (Z̄ᵢ − Z̄)²", result: "nᵢ = 5" },
          {
            label: "Substitute",
            expression: "5(0.8 − 2.9333)² + 5(7.2 − 2.9333)² + 5(0.8 − 2.9333)²",
            result: d4(result.betweenSumOfSquares),
          },
        ],
        note: "SS_between = 136.5333.",
      },
      "Two of the three terms are identical because Method A and Method C have the same mean deviation.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 7",
        title: "Within-groups sum of squares",
        lines: [
          { label: "Formula", expression: "SS_within = Σᵢ Σⱼ (Zᵢⱼ − Z̄ᵢ)²", result: "" },
          {
            label: "Method A",
            expression: "(0−0.8)² + (2−0.8)² + (2−0.8)² + (0−0.8)² + (0−0.8)²",
            result: d4(groupA.withinSumOfSquares),
          },
          {
            label: "Method B",
            expression: "(6−7.2)² + (1−7.2)² + (11−7.2)² + (14−7.2)² + (4−7.2)²",
            result: d4(groupB.withinSumOfSquares),
          },
          {
            label: "Method C",
            expression: "(0−0.8)² + (2−0.8)² + (2−0.8)² + (0−0.8)² + (0−0.8)²",
            result: d4(groupC.withinSumOfSquares),
          },
          {
            label: "Total",
            expression: `${d4(groupA.withinSumOfSquares)} + ${d4(groupB.withinSumOfSquares)} + ${d4(groupC.withinSumOfSquares)}`,
            result: d4(result.withinSumOfSquares),
          },
        ],
        note: "Method A contributes 4.8000, Method B 110.8000, and Method C 4.8000. SS_within = 120.4000.",
      },
      "The squared terms for Method A are 0.64, 1.44, 1.44, 0.64, and 0.64. Method B’s are 1.44, 38.44, 14.44, 46.24, and 10.24.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 8",
        title: "Degrees of freedom",
        lines: [
          { label: "Between", expression: "df_between = k − 1 = 3 − 1", result: String(result.df1) },
          { label: "Within", expression: "df_within = N − k = 15 − 3", result: String(result.df2) },
        ],
      },
      "W is compared with F on 2 and 12 degrees of freedom.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 9",
        title: "Mean squares",
        lines: [
          {
            label: "Between",
            expression: `MS_between = ${d4(result.betweenSumOfSquares)} / ${result.df1}`,
            result: d4(msBetween),
          },
          {
            label: "Within",
            expression: `MS_within = ${d4(result.withinSumOfSquares)} / ${result.df2}`,
            result: d4(msWithin),
          },
        ],
        note: "MS_between = 68.2667. MS_within = 10.0333.",
      },
      "The mean square is the sum of squares divided by its degrees of freedom.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 10",
        title: "Levene’s test statistic",
        lines: [
          { label: "Formula", expression: "W = MS_between / MS_within", result: "" },
          {
            label: "Substitute",
            expression: `${d4(msBetween)} / ${d4(msWithin)}`,
            result: result.statistic.toFixed(3),
          },
        ],
        note: "W = 6.804. It is the ratio of the between-groups mean square to the within-groups mean square of the absolute deviations. The unrounded value is 6.80399.",
      },
      "Six point eight zero four, not a mean comparison. The third decimal rounds up from 6.80399.",
    ),
    slide(
      {
        type: "callout",
        kicker: "Step 11",
        title: "p-value from the F distribution",
        tone: "ink",
        body: `For F with df₁ = 2 and df₂ = 12, the upper-tail probability of W = ${result.statistic.toFixed(3)} is p = ${result.pValue.toFixed(4)}.`,
        aside: `The same comparison can use the critical value F₀.₀₅(2, 12) = ${fmtFixed(result.criticalValue, 3)}. Both use the mean-centered statistic.`,
      },
      "The tail probability from the F distribution is 0.01059, which rounds to 0.0106 at four decimals.",
    ),
    slide(
      {
        type: "decision",
        kicker: "Step 12",
        title: "Statistical decision",
        rules: [
          {
            name: "p-value",
            comparison: `${result.pValue.toFixed(4)} is less than α = 0.05`,
            outcome: "Reject H₀",
            reject: true,
          },
          {
            name: "Critical value",
            comparison: `W = ${result.statistic.toFixed(3)} is greater than ${fmtFixed(result.criticalValue, 3)}`,
            outcome: "Reject H₀",
            reject: true,
          },
        ],
        verdict: "Reject H₀",
        detail: "H₀: σ₁² = σ₂² = σ₃². The mean-centered Levene test rejects equality of the three variances at α = 0.05.",
      },
      "Lead with the p-value rule. The critical-value rule reaches the same decision.",
    ),
    slide(
      {
        type: "callout",
        kicker: "Step 13",
        title: "Conclusion",
        tone: "warn",
        body: "At the 0.05 significance level, there is sufficient statistical evidence that the population variances of the three teaching-method groups are not all equal.",
        aside: "Levene’s test evaluates equality of variances, not equality of the group means. The means here are 80, 76, and 85, but that comparison is a different test.",
      },
      "Close on the variance conclusion. Do not say that the teaching methods differ in average score.",
    ),
    slide(
      {
        type: "table",
        kicker: "Summary",
        title: "Results",
        columns: ["Quantity", "Result"],
        rows: [
          ["Number of groups, k", "3"],
          ["Total observations, N", "15"],
          ["Grand mean of absolute deviations", d4(result.grandMeanOfDeviations)],
          ["Between-groups sum of squares", d4(result.betweenSumOfSquares)],
          ["Within-groups sum of squares", d4(result.withinSumOfSquares)],
          ["Between-groups degrees of freedom", String(result.df1)],
          ["Within-groups degrees of freedom", String(result.df2)],
          ["Between-groups mean square", d4(msBetween)],
          ["Within-groups mean square", d4(msWithin)],
          ["Levene’s test statistic, W", result.statistic.toFixed(3)],
          ["p-value", result.pValue.toFixed(4)],
          ["Significance level, α", "0.05"],
          ["Decision", "Reject H₀"],
        ],
      },
      "Read the statistic and the decision. W is 6.804 and p is 0.0106.",
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
