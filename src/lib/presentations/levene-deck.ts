import { fmt, fmtFixed } from "@/lib/format";
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

function gapText(gap: number): string {
  const body = Math.abs(gap).toFixed(2);
  return gap < 0 ? `−${body}` : body;
}

function withinRows(deviations: number[], center: number, total: number): string[][] {
  const rows = deviations.map((z, index) => {
    const gap = z - center;
    const zText = Number.isInteger(z) ? String(z) : z.toFixed(2);
    return [String(index + 1), zText, gapText(gap), (gap * gap).toFixed(2)];
  });
  rows.push(["Sum", "—", "—", total.toFixed(2)]);
  return rows;
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
  const withinA = withinRows(
    groupA.absoluteDeviations,
    groupA.meanAbsoluteDeviation,
    groupA.withinSumOfSquares,
  );
  const withinB = withinRows(
    groupB.absoluteDeviations,
    groupB.meanAbsoluteDeviation,
    groupB.withinSumOfSquares,
  );
  const f025 = fPpf(1 - 0.025, mean.df1, mean.df2);
  const f01 = fPpf(1 - 0.01, mean.df1, mean.df2);
  const msBetween = mean.betweenSumOfSquares / mean.df1;
  const msWithin = mean.withinSumOfSquares / mean.df2;
  const quotient = mean.betweenSumOfSquares / mean.withinSumOfSquares;
  const ssbText = mean.betweenSumOfSquares.toFixed(4);
  const sswText = mean.withinSumOfSquares.toFixed(4);
  const wText = mean.statistic.toFixed(3);
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
        type: "bullets",
        kicker: "Step 5 of 7",
        title: "The hand calculation, in order",
        items: [
          { lead: "1 · Means", text: "Average the five scores in each method. Those averages are the centers. They are not W." },
          { lead: "2 · Z", text: "Replace every score by its absolute distance from its own center: Z = |Y − Ȳ|." },
          { lead: "3 · Averages of Z", text: "Average the Z values inside each method, then average all 15 of them. Call that overall average Z̄." },
          { lead: "4 · Two sums", text: "SSB measures how far the three Z averages sit from Z̄. SSW measures how far the individual Z values sit from their own average." },
          { lead: "5 · W and F", text: "W = (12 / 2) × (SSB / SSW). Then read F at df₁ = 2, df₂ = 12, and α = 0.05." },
        ],
      },
      "Tell the class this is one ANOVA on the absolute deviations. The next slides do each piece before substituting.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 5 of 7",
        title: "Find each group mean",
        lines: [
          { label: "A", expression: "(80 + 82 + 78 + 80 + 80) / 5 = 400 / 5", result: "80" },
          { label: "B", expression: "(70 + 75 + 65 + 90 + 80) / 5 = 380 / 5", result: "76" },
          { label: "C", expression: "(85 + 87 + 83 + 85 + 85) / 5 = 425 / 5", result: "85" },
        ],
        note: "Center every score at its own method mean. Levene’s test does not ask whether 80, 76, and 85 are equal.",
      },
      "Add the five scores before dividing. Method B’s total is 380, not 400, because 65 and 90 pull in opposite directions.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 5 of 7",
        title: "Turn one score from each method into Z",
        lines: [
          { label: "A", expression: "Student 2: |82 − 80|", result: "2" },
          { label: "B", expression: "Student 1: |70 − 76|", result: "6" },
          { label: "C", expression: "Student 2: |87 − 85|", result: "2" },
        ],
        note: "The absolute value drops the sign. A score two points above its mean and a score two points below it both become Z = 2.",
      },
      "Do these three cells aloud, then show the completed table. Method B’s first score is already 6 points from 76.",
    ),
    slide(
      {
        type: "table",
        kicker: "Step 5 of 7",
        title: "Absolute deviations from the group means",
        caption: "Zₐ uses 80, Zᵦ uses 76, and Z꜀ uses 85. The last row is the mean of each Z column.",
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
      "Check two more cells: Method B, student 4 is |90 − 76| = 14. Method A, student 1 is |80 − 80| = 0.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 5 of 7",
        title: "Average the deviations in each method",
        lines: [
          { label: "A", expression: "(0 + 2 + 2 + 0 + 0) / 5 = 4 / 5", result: "0.8" },
          { label: "B", expression: "(6 + 1 + 11 + 14 + 4) / 5 = 36 / 5", result: "7.2" },
          { label: "C", expression: "(0 + 2 + 2 + 0 + 0) / 5 = 4 / 5", result: "0.8" },
        ],
        note: "These three results are Z̄ₐ, Z̄ᵦ, and Z̄꜀. Method B’s typical absolute deviation is nine times the other two.",
      },
      "The column sums are 4, 36, and 4. Dividing by 5 is the whole step. Write 0.8, 7.2, and 0.8 before going on.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 5 of 7",
        title: "Grand mean of every deviation",
        lines: [
          { label: "Sum", expression: "4 + 36 + 4", result: "44" },
          { label: "N", expression: "5 + 5 + 5", result: "15" },
          { label: "Mean", expression: "44 / 15", result: "2.9333" },
        ],
        note: "Keep 44/15 exact on the next slide. 2.9333 is only the four-decimal reading of that quotient.",
      },
      "There are 15 deviations, not 3. Averaging 0.8, 7.2, and 0.8 would be wrong because that would ignore the sample sizes. Here the sizes are equal, so it happens to match, but the definition is the mean of all 15 values.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 5 of 7",
        title: "How far each Z average is from Z̄",
        lines: [
          { label: "A, C", expression: "0.8 − 44/15 = 12/15 − 44/15", result: "−32/15" },
          { label: "B", expression: "7.2 − 44/15 = 108/15 − 44/15", result: "64/15" },
        ],
        note: "0.8 = 12/15 and 7.2 = 108/15. Subtracting 44/15 avoids rounding 2.9333 before the square.",
      },
      "−32/15 is −2.1333. 64/15 is 4.2667. Methods A and C sit the same distance below the grand mean. Method B sits above it.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 5 of 7",
        title: "Between sum of squares",
        lines: [
          { label: "A", expression: "5 × (−32/15)² = 5 × 1024/225 = 5120/225", result: "22.755556" },
          { label: "B", expression: "5 × (64/15)² = 5 × 4096/225 = 20480/225", result: "91.022222" },
          { label: "C", expression: "5 × (−32/15)² = 5 × 1024/225 = 5120/225", result: "22.755556" },
          { label: "SSB", expression: "5120/225 + 20480/225 + 5120/225 = 30720/225", result: ssbText },
        ],
        note: "Each term is the group size times the squared gap. 30720/225 = 136.5333…. Method B supplies most of SSB.",
      },
      "Square first, then multiply by 5. Advance one method at a time so the addition is visible: 22.755556 + 91.022222 + 22.755556.",
    ),
    slide(
      {
        type: "table",
        kicker: "Step 5 of 7",
        title: "Within sum of squares — Methods A and C",
        caption: "Square the distance from each Z to 0.8. Adding the last column: 0.64 + 1.44 + 1.44 + 0.64 + 0.64 = 4.80. Method C has the same five Z values, so its within sum is also 4.80.",
        columns: ["Student", "Zₐ", "Zₐ − 0.8", "(Zₐ − 0.8)²"],
        rows: withinA,
        numeric: true,
      },
      "Three of the A deviations are 0, and each contributes 0.64. The two deviations of 2 each contribute 1.44. Do not recompute Method C cell by cell once the class sees that the Z column matches.",
    ),
    slide(
      {
        type: "table",
        kicker: "Step 5 of 7",
        title: "Within sum of squares — Method B",
        caption: "The center is now 7.2. Adding the last column: 1.44 + 38.44 + 14.44 + 46.24 + 10.24 = 110.80.",
        columns: ["Student", "Zᵦ", "Zᵦ − 7.2", "(Zᵦ − 7.2)²"],
        rows: withinB,
        numeric: true,
      },
      "Student 4 is the large piece: 14 − 7.2 = 6.8, and 6.8² = 46.24. Method B’s within sum is why SSW is about 120 rather than about 10.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 5 of 7",
        title: "Add the three within sums",
        lines: [
          { label: "A", expression: "Σ (Zₐ − 0.8)²", result: groupA.withinSumOfSquares.toFixed(2) },
          { label: "B", expression: "Σ (Zᵦ − 7.2)²", result: groupB.withinSumOfSquares.toFixed(2) },
          { label: "C", expression: "Σ (Z꜀ − 0.8)²", result: groupC.withinSumOfSquares.toFixed(2) },
          {
            label: "SSW",
            expression: `${groupA.withinSumOfSquares.toFixed(2)} + ${groupB.withinSumOfSquares.toFixed(2)} + ${groupC.withinSumOfSquares.toFixed(2)}`,
            result: sswText,
          },
        ],
        note: "SSW = 120.40 exactly for these squares. It is written 120.4000 when it is placed next to SSB.",
      },
      "Say the addition: four point eight, plus one hundred ten point eight, plus four point eight. The middle term dominates.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 5 of 7",
        title: "Substitute into W",
        lines: [
          { label: "df₁", expression: "k − 1 = 3 − 1", result: String(mean.df1) },
          { label: "df₂", expression: "N − k = 15 − 3", result: String(mean.df2) },
          { label: "Ratio", expression: `${ssbText} / ${sswText}`, result: fmtFixed(quotient, 4) },
          { label: "W", expression: `(${mean.df2} / ${mean.df1}) × ${fmtFixed(quotient, 4)}`, result: wText },
        ],
        note: "1.1340 is 136.5333 / 120.4000 rounded to four decimals. The unrounded W is 6.80399, which also rounds to 6.804.",
      },
      "This is the formula from Step 4. Twelve over two is 6, and 6 times 1.1340 is 6.804. Hold the decision for Step 6.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 5 of 7",
        title: "Check: the same W from mean squares",
        lines: [
          { label: "Between", expression: `SSB / df₁ = ${ssbText} / ${mean.df1}`, result: fmtFixed(msBetween, 4) },
          { label: "Within", expression: `SSW / df₂ = ${sswText} / ${mean.df2}`, result: fmtFixed(msWithin, 4) },
          { label: "W", expression: `${fmtFixed(msBetween, 4)} / ${fmtFixed(msWithin, 4)}`, result: wText },
        ],
        note: "Mean square between divided by mean square within equals (df₂ / df₁) × (SSB / SSW). It is the ANOVA form of the same statistic, not a second test.",
      },
      "Only use this slide as a check. The reported formula stays the ratio of sums from Step 4. Both routes round to 6.804.",
    ),
    slide(
      {
        type: "table",
        kicker: "Step 5 of 7",
        title: "Determine the Critical / Table Value",
        caption: `df₁ = 2. Read down to df₂ = 12 and across to α = 0.05. That cell is F critical = ${fmtFixed(mean.criticalValue, 3)}.`,
        columns: ["df₂", ...F_COLUMNS.map((column) => column.label)],
        rows: focusTable,
        numeric: true,
        highlightRow: focusTable.findIndex((row) => row[0] === "12"),
        highlightCol: 2,
      },
      "The highlighted cell is the only critical value used for the decision. The 0.025 and 0.01 columns are for bounding the p-value on the next comparison.",
    ),
    slide(
      {
        type: "compare",
        kicker: "Step 5 of 7",
        title: "Computed value beside the critical value",
        columns: [
          { heading: "Computed W", points: [wText, "From (12 / 2) × (SSB / SSW)."] },
          { heading: "F critical", points: [fmtFixed(mean.criticalValue, 3), "df₁ = 2, df₂ = 12, α = 0.05."] },
        ],
        footnote: `${wText} is greater than ${fmtFixed(mean.criticalValue, 3)}. Step 6 is where that comparison becomes the decision.`,
      },
      "Stop at the comparison. The reject-or-not statement belongs in Step 6.",
    ),
    slide(
      {
        type: "compare",
        kicker: "Step 5 of 7",
        title: "Bound the p-value from the same row",
        columns: [
          {
            heading: "α = 0.025",
            points: [
              `F critical = ${fmtFixed(f025, 3)}.`,
              `${wText} is ${mean.statistic > f025 ? "larger" : "smaller"}, so p is ${mean.statistic > f025 ? "below" : "above"} 0.025.`,
            ],
          },
          {
            heading: "α = 0.01",
            points: [
              `F critical = ${fmtFixed(f01, 3)}.`,
              `${wText} is ${mean.statistic < f01 ? "smaller" : "larger"}, so p is ${mean.statistic < f01 ? "above" : "below"} 0.01.`,
            ],
          },
        ],
        footnote:
          mean.statistic > f025 && mean.statistic < f01
            ? `The table bracket is 0.01 < p < 0.025. The F tail probability is ${mean.pValue.toFixed(4)}.`
            : `The F tail probability is ${mean.pValue.toFixed(4)}.`,
      },
      "A printed F table cannot give 0.0106 exactly. It can show that W falls between the 0.025 and 0.01 critical values. The tail probability fills in the number inside that bracket.",
    ),
    slide(
      {
        type: "table",
        kicker: "Step 5 of 7",
        title: "Software Verification",
        caption: "The hand sums were checked against the same F tail probability. The official solution is the mean-centered row. The median row is Brown–Forsythe, only as a check.",
        columns: ["Source", "Center", "W", "p-value"],
        rows: [
          ["Hand calculation", "Mean", wText, mean.pValue.toFixed(4)],
          ["F tail probability", "Mean", wText, mean.pValue.toFixed(4)],
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
