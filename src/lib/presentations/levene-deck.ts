import { fmt, fmtFixed, fmtPPlain } from "@/lib/format";
import { EXAMPLE_GROUPS, leveneTest } from "@/lib/stats/levene";
import type { PresentationDoc, Slide } from "@/lib/types";
import { uid } from "@/lib/utils";

const mean = leveneTest(EXAMPLE_GROUPS, { center: "mean", alpha: 0.05 });
const median = leveneTest(EXAMPLE_GROUPS, { center: "median", alpha: 0.05 });
const a = mean.groups[0];
const b = mean.groups[1];
const am = median.groups[0];
const bm = median.groups[1];

function slide(block: Slide["block"], notes: string): Slide {
  return { id: uid("lv"), block, notes };
}

function num(n: number): string {
  return fmt(n, 3);
}

export function buildLeveneDeck(now = Date.now()): PresentationDoc {
  const slides: Slide[] = [
    slide(
      {
        type: "title",
        kicker: "Hypothesis testing · Equality of variances",
        title: "Levene’s Test: Testing Equality of Variances",
        subtitle:
          "A classroom solution for deciding whether two bottling heads share a common variance before a mean comparison.",
        footer: "Original worked example · α = 0.05 · mean-centered test, with the Brown–Forsythe check",
      },
      "Open by naming the decision the test supports: equal variance or not. Tell the room this is not a test of means and not a correlation. The seven formal steps begin after the setup.",
    ),
    slide(
      {
        type: "bullets",
        kicker: "Aims",
        title: "What this solution will show",
        items: [
          { lead: "Purpose", text: "When equal variances are a reasonable assumption." },
          { lead: "Statistic", text: "What each symbol in Levene’s W represents." },
          { lead: "Two versions", text: "Mean-centered Levene and median-centered Brown–Forsythe." },
          { lead: "Decision", text: "A worked example judged by both F critical and the p-value." },
        ],
      },
      "Preview the path: meaning, formula, problem, then the seven required steps in order. Step 5 carries the manual tables and the software check.",
    ),
    slide(
      {
        type: "callout",
        kicker: "Meaning",
        title: "Levene’s test asks whether the spreads match",
        tone: "ink",
        body: "It compares the variability of two or more independent groups. A large statistic means the absolute deviations from each group’s center are not interchangeable.",
        aside: "It does not ask whether the averages match. Means can be identical while variances differ, and the reverse is also possible.",
      },
      "Use a hand gesture for spread versus location. In this example the two sample means will turn out equal, which makes the variance question easier to see.",
    ),
    slide(
      {
        type: "compare",
        kicker: "Application",
        title: "Use it before a test that assumes equal spread",
        columns: [
          {
            heading: "Appropriate uses",
            points: [
              "Before an independent-samples t-test",
              "Before a one-way ANOVA on group means",
              "When a process spec limits variation, not only the average",
              "With two or more independent groups",
            ],
          },
          {
            heading: "Poor uses",
            points: [
              "As a substitute for comparing means",
              "On paired or repeated measures from the same units",
              "With a handful of observations and a hard yes/no rule",
              "When the scientific question is about correlation",
            ],
          },
        ],
      },
      "Stress that a preliminary variance test is a decision about the next procedure. It is not the final scientific claim about the machines’ average fill.",
    ),
    slide(
      {
        type: "bullets",
        kicker: "Assumptions",
        title: "What the procedure expects",
        items: [
          { lead: "Independence", text: "Observations are independent within and across groups." },
          { lead: "Scale", text: "The outcome is numeric, so a distance from the center exists." },
          { lead: "Groups", text: "Each group has its own center and at least a few observations." },
          { lead: "Robustness", text: "Absolute deviations make the test less brittle than a raw variance-ratio F test when normality is doubtful." },
        ],
      },
      "Do not claim the test needs perfectly normal data. The classical F test on two variances does. Levene was built to be more robust. Extreme outliers and tiny samples still make any variance test unstable.",
    ),
    slide(
      {
        type: "compare",
        kicker: "Two centerings",
        title: "Mean-centered Levene and Brown–Forsythe",
        columns: [
          {
            heading: "Original Levene",
            points: [
              "Center each group at its mean",
              "Zᵢⱼ = |Yᵢⱼ − Ȳᵢ|",
              "More sensitive when groups are roughly symmetric",
              "This is the statistic solved in the seven steps",
            ],
          },
          {
            heading: "Brown–Forsythe",
            points: [
              "Center each group at its median",
              "Zᵢⱼ = |Yᵢⱼ − medianᵢ|",
              "Preferred when a skew or outlier would pull the mean",
              "Computed in Step 5 as a robustness check",
            ],
          },
        ],
        footnote: "Both versions then run the same one-way ANOVA on the Z values and compare W with an F critical value.",
      },
      "Say explicitly that the graded solution uses the mean. The median version is not a different step. It answers whether the decision depends on the center.",
    ),
    slide(
      {
        type: "formula",
        kicker: "Statistic",
        title: "Levene’s W, and what each piece is",
        formula: "W = ((N − k) / (k − 1)) · (Σ nᵢ (Z̄ᵢ − Z̄)²) / (Σ Σ (Zᵢⱼ − Z̄ᵢ)²)",
        symbols: [
          { symbol: "W", meaning: "The test statistic, referred to an F distribution." },
          { symbol: "k", meaning: "Number of groups." },
          { symbol: "N", meaning: "Total number of observations." },
          { symbol: "nᵢ", meaning: "Number of observations in group i." },
          { symbol: "Yᵢⱼ", meaning: "Observation j in group i." },
          { symbol: "Zᵢⱼ", meaning: "Absolute deviation of Yᵢⱼ from the group center." },
          { symbol: "Z̄ᵢ", meaning: "Mean of the absolute deviations in group i." },
          { symbol: "Z̄", meaning: "Mean of every absolute deviation." },
        ],
        note: "Under the null, W is compared with F at df₁ = k − 1 and df₂ = N − k. The test is right-tailed: only large W counts against equal variances.",
      },
      "Read the numerator as between-group spread of the deviations and the denominator as leftover spread inside groups. If every group is equally variable, the Z̄ᵢ values sit near one another and W stays small.",
    ),
    slide(
      {
        type: "richtext",
        kicker: "Worked example",
        title: "Two bottling heads, one target volume",
        paragraphs: [
          "A pilot plant draws eight cups from Head A and eight from Head B. Each cup is a nominal 14 mL teaching aliquot. The question for today is not which head fills higher on average.",
          "Quality will next compare the mean volumes with an independent-samples t-test. That test changes if the variances differ. Levene’s test is the preliminary check.",
          "The cups are independent fills. Volumes below are recorded in milliliters.",
        ],
      },
      "Give the operational reason before the numbers. The data table itself is reserved for Step 3, as the write-up requires.",
    ),
    slide(
      {
        type: "section",
        index: "01–07",
        title: "Solution in the seven required steps",
        lede: "The steps stay in the assigned order. Calculations stay inside Step 5.",
      },
      "Pause here so the room can see the boundary between the setup and the formal solution.",
    ),
    slide(
      {
        type: "compare",
        kicker: "Step 1",
        title: "State the Null and Alternative Hypothesis",
        columns: [
          {
            heading: "Null hypothesis, H₀",
            points: [
              "There is no significant difference between the fill-volume variances of Head A and Head B.",
              "σ²ₐ = σ²ᵦ",
              "The population variances are equal.",
            ],
          },
          {
            heading: "Alternative hypothesis, Hₐ",
            points: [
              "There is a significant difference between the fill-volume variances of Head A and Head B.",
              "σ²ₐ ≠ σ²ᵦ",
              "At least one variance differs. With two groups, that is the pair.",
            ],
          },
        ],
        footnote:
          "The word “significant” follows the course wording. The formal claim being tested is equality of the population variances.",
      },
      "Write both the sentence form and the symbol form. This alternative is two-sided in the variances, but the F comparison that follows is right-tailed because W cannot be negative.",
    ),
    slide(
      {
        type: "callout",
        kicker: "Step 2",
        title: "State the Level of Significance (α = 0.05)",
        tone: "ink",
        body: "α = 0.05. The chance of incorrectly rejecting a true null hypothesis — a Type I error — is 5%. This is the level used for the critical value and for the p-value comparison.",
        aside: "A stricter α of 0.01 would demand stronger evidence. It is not used in this solution.",
      },
      "Say the 5% aloud. Remind the class that α is chosen before looking at W.",
    ),
    slide(
      {
        type: "table",
        kicker: "Step 3",
        title: "Given Data (Write the Data)",
        caption: "Eight independent cups from each head.",
        columns: ["Cup", "Head A", "Head B"],
        rows: a.values.map((va, i) => [String(i + 1), String(va), String(b.values[i])]),
        numeric: true,
      },
      "Read one row so the class sees these are paired only by cup order on the slide, not by experimental pairing. The fills are independent.",
    ),
    slide(
      {
        type: "table",
        kicker: "Step 3",
        title: "The same data, described",
        caption: "These summaries describe the samples. They are not yet the test statistic.",
        columns: ["", "Head A", "Head B"],
        rows: [
          ["n", String(a.values.length), String(b.values.length)],
          ["Mean (mL)", num(a.sampleMean), num(b.sampleMean)],
          ["Sample variance", fmtFixed(a.sampleVariance, 3), fmtFixed(b.sampleVariance, 3)],
          ["Sample SD (mL)", fmtFixed(a.sampleStandardDeviation, 3), fmtFixed(b.sampleStandardDeviation, 3)],
        ],
        numeric: true,
      },
      "Point out that the means match at 13.625 mL while the sample variances, 1.982 and 29.125, do not. That contrast motivates Levene’s test. Do not treat the ratio of those variances as W.",
    ),
    slide(
      {
        type: "dots",
        kicker: "Step 3",
        title: "Head B is visibly more spread out",
        caption: "Each mark is one cup. The means sit together; the clouds do not.",
        series: [
          { name: "Head A", values: a.values },
          { name: "Head B", values: b.values },
        ],
        unit: "mL",
      },
      "Let the plot do the introduction. Then say the plot is not the decision. The decision needs W, the critical value, and the p-value.",
    ),
    slide(
      {
        type: "formula",
        kicker: "Step 4",
        title: "Test Statistic Used (Statistical Tool)",
        formula: "W = ((N − k) / (k − 1)) · SSB_z / SSW_z",
        symbols: [
          { symbol: "Tool", meaning: "Levene’s test, mean-centered. Distribution: F." },
          { symbol: "k", meaning: "2 heads, so df₁ = k − 1 = 1." },
          { symbol: "N", meaning: "16 cups, so df₂ = N − k = 14." },
          { symbol: "SSB_z", meaning: "Σ nᵢ (Z̄ᵢ − Z̄)², between heads." },
          { symbol: "SSW_z", meaning: "Σ Σ (Zᵢⱼ − Z̄ᵢ)², within heads." },
        ],
        note: "Zᵢⱼ = |Yᵢⱼ − Ȳᵢ| for the original test. The critical value comes from the F table at α = 0.05, df₁ = 1, df₂ = 14.",
      },
      "Name the tool in one sentence before any arithmetic. The next slides are all Step 5.",
    ),
    slide(
      {
        type: "table",
        kicker: "Step 5",
        title: "Compute the Test Statistic and Determine the Critical/Table Value",
        caption: `Ȳₐ = ${num(a.center)} mL and Ȳᵦ = ${num(b.center)} mL. Z = |Y − Ȳ|.`,
        columns: ["Cup", "A", "Zₐ", "B", "Zᵦ"],
        rows: a.values.map((va, i) => [
          String(i + 1),
          String(va),
          num(a.absoluteDeviations[i]),
          String(b.values[i]),
          num(b.absoluteDeviations[i]),
        ]),
        numeric: true,
      },
      "Compute one deviation live: for cup 1 on Head A, |12 − 13.625| = 1.625. The rest of the column follows the same rule.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 5",
        title: "Means of the absolute deviations",
        lines: [
          {
            label: "Head A",
            expression: `Z̄ₐ = (${a.absoluteDeviations.map(num).join(" + ")}) / 8`,
            result: num(a.meanAbsoluteDeviation),
          },
          {
            label: "Head B",
            expression: `Z̄ᵦ = (${b.absoluteDeviations.map(num).join(" + ")}) / 8`,
            result: num(b.meanAbsoluteDeviation),
          },
          {
            label: "All cups",
            expression: "Z̄ = (8 × 1.125 + 8 × 4.875) / 16",
            result: num(mean.grandMeanOfDeviations),
          },
        ],
        note: "Head B’s typical distance from its own mean is more than four times Head A’s.",
      },
      "Advance the lines one at a time. 1.125 and 4.875 are the group means of Z, not the original fill means.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 5",
        title: "Between-head and within-head sums of squares",
        lines: [
          {
            label: "Between",
            expression: "SSB = 8(1.125 − 3)² + 8(4.875 − 3)²",
            result: num(mean.betweenSumOfSquares),
          },
          {
            label: "Within A",
            expression: "Σ (Zₐ − 1.125)²",
            result: num(a.withinSumOfSquares),
          },
          {
            label: "Within B",
            expression: "Σ (Zᵦ − 4.875)²",
            result: num(b.withinSumOfSquares),
          },
          {
            label: "Within total",
            expression: `${num(a.withinSumOfSquares)} + ${num(b.withinSumOfSquares)}`,
            result: num(mean.withinSumOfSquares),
          },
        ],
      },
      "Show that each head contributes 28.125 to SSB, so 56.25 is not a mystery total. Within A is 3.75 and within B is 13.75.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 5",
        title: "Compute W",
        lines: [
          {
            label: "Degrees of freedom",
            expression: "df₁ = 2 − 1,   df₂ = 16 − 2",
            result: "1 and 14",
          },
          {
            label: "Ratio of sums of squares",
            expression: "SSB / SSW = 56.25 / 17.5",
            result: "3.214286",
          },
          {
            label: "Levene statistic",
            expression: "W = (14 / 1) × (56.25 / 17.5)",
            result: fmtFixed(mean.statistic, 3),
          },
        ],
        note: "W = 45 exactly for these data.",
      },
      "Write the substituted formula on the board before revealing 45. Emphasize that 45 is large relative to an F critical value near 4.6, but the comparison comes on the next slides.",
    ),
    slide(
      {
        type: "callout",
        kicker: "Step 5",
        title: "Critical value from the F table",
        tone: "ink",
        body: `For a right-tailed test at α = 0.05 with df₁ = 1 and df₂ = 14, F critical = ${fmtFixed(mean.criticalValue, 3)}.`,
        aside: "Tabled F₀.₀₅(1, 14) is 4.60. The more precise quantile used here is 4.6001, so rounding to three decimals does not change the comparison with W = 45.",
      },
      "If you are using a printed F table, read the column df₁ = 1 and the row df₂ = 14. The cell is 4.60.",
    ),
    slide(
      {
        type: "callout",
        kicker: "Step 5",
        title: "P-value as the other determinant",
        tone: "ink",
        body: `P(F₁,₁₄ > 45) = ${fmtPPlain(mean.pValue)}.`,
        aside: "The p-value is the upper-tail probability of an F statistic at least this large when the null hypothesis is true. It will be compared with α = 0.05 in Step 6.",
      },
      "Do not round this p-value up to 0.05. It is about one in one hundred thousand.",
    ),
    slide(
      {
        type: "table",
        kicker: "Step 5",
        title: "Brown–Forsythe check: center at the median",
        caption: "Same ANOVA on Z, with Zᵢⱼ = |Yᵢⱼ − medianᵢ|.",
        columns: ["Quantity", "Head A", "Head B"],
        rows: [
          ["Median (mL)", num(am.center), num(bm.center)],
          ["Mean of |Y − median|", num(am.meanAbsoluteDeviation), num(bm.meanAbsoluteDeviation)],
          ["Within sum of squares", num(am.withinSumOfSquares), num(bm.withinSumOfSquares)],
        ],
        numeric: true,
      },
      "Medians of the even samples are averages of the two central values: 13.5 and 14. The mean absolute deviations happen to stay 1.125 and 4.875.",
    ),
    slide(
      {
        type: "calculation",
        kicker: "Step 5",
        title: "Brown–Forsythe statistic",
        lines: [
          {
            label: "Between",
            expression: "SSB remains 8(1.125 − 3)² + 8(4.875 − 3)²",
            result: num(median.betweenSumOfSquares),
          },
          {
            label: "Within",
            expression: `${num(am.withinSumOfSquares)} + ${num(bm.withinSumOfSquares)}`,
            result: num(median.withinSumOfSquares),
          },
          {
            label: "Statistic",
            expression: "W = 14 × (56.25 / 18.75)",
            result: fmtFixed(median.statistic, 3),
          },
          {
            label: "P-value",
            expression: "P(F₁,₁₄ > 42)",
            result: fmtPPlain(median.pValue),
          },
        ],
        note: `The same critical value, ${fmtFixed(median.criticalValue, 3)}, still applies. Both centerings reject H₀.`,
      },
      "The median version is slightly smaller, 42 instead of 45, because the within sum of squares grew. The decision does not change.",
    ),
    slide(
      {
        type: "table",
        kicker: "Step 5",
        title: "Software check of the manual arithmetic",
        caption: "Inserted after the hand calculation, as the write-up requires.",
        columns: ["Source", "Center", "W", "p-value"],
        rows: [
          ["Hand calculation", "Mean", fmtFixed(mean.statistic, 3), fmtPPlain(mean.pValue)],
          ["In-app F routine", "Mean", fmtFixed(mean.statistic, 3), fmtPPlain(mean.pValue)],
          ["SciPy levene, cross-check", "Mean", "45.000", "9.972 × 10⁻⁶"],
          ["Hand calculation", "Median", fmtFixed(median.statistic, 3), fmtPPlain(median.pValue)],
          ["SciPy levene, cross-check", "Median", "42.000", "1.447 × 10⁻⁵"],
        ],
        numeric: true,
      },
      "SciPy’s scipy.stats.levene was used as the external check. center='mean' returned W = 45 and p = 9.972×10⁻⁶. center='median' returned W = 42 and p = 1.447×10⁻⁵. The manual sums of squares match those statistics exactly.",
    ),
    slide(
      {
        type: "decision",
        kicker: "Step 6",
        title: "Make a Statistical Decision",
        rules: [
          {
            name: "Test statistic, right-tailed",
            comparison: `W = ${fmtFixed(mean.statistic, 3)} is greater than F critical = ${fmtFixed(mean.criticalValue, 3)}`,
            outcome: "Reject the null hypothesis",
            reject: true,
          },
          {
            name: "P-value",
            comparison: `${fmtPPlain(mean.pValue)} is less than α = 0.05`,
            outcome: "Reject the null hypothesis",
            reject: true,
          },
        ],
        verdict: "Reject H₀",
        detail:
          "H₀: there is no significant difference between the variances (σ²ₐ = σ²ᵦ). Reject. Hₐ: there is a significant difference (σ²ₐ ≠ σ²ᵦ). Accept.",
      },
      "Use the course rule for a right-tailed statistic: computed value greater than the critical value means reject. The p-value rule agrees. The Brown–Forsythe result, 42 > 4.600 and p < 0.05, rejects as well. The course sheet also says “failed to reject (accept)” when the evidence is weak. That phrase is not the outcome here.",
    ),
    slide(
      {
        type: "callout",
        kicker: "Step 7",
        title: "Conclusion",
        tone: "warn",
        body: "At α = 0.05, there is sufficient evidence that the fill-volume variances of Head A and Head B differ. Head B is the more variable head.",
        aside: "Equal variances should not be assumed for the next mean comparison. The identical sample means, both 13.625 mL, do not cancel this variance result.",
      },
      "State the conclusion in the course pattern: level, sufficient evidence, and the direction. Head B’s sample standard deviation is about 5.40 mL against about 1.41 mL for Head A.",
    ),
    slide(
      {
        type: "compare",
        kicker: "After the test",
        title: "What changes for the t-test and for ANOVA",
        columns: [
          {
            heading: "Independent-samples t-test",
            points: [
              "Student’s t assumes σ²ₐ = σ²ᵦ",
              "That assumption is not reasonable here",
              "Compare the means with Welch’s t-test",
              "Welch does not pool the two variances",
            ],
          },
          {
            heading: "If there were more heads",
            points: [
              "The same W tests k groups before ANOVA",
              "df₁ would be k − 1, not always 1",
              "A rejected Levene result argues against the usual pooled ANOVA",
              "Welch ANOVA or a robust alternative is the safer follow-up",
            ],
          },
        ],
      },
      "Be precise: rejecting Levene does not forbid every mean comparison. It forbids the equal-variance version. Also say that a non-significant Levene result would have allowed the pooled t-test only as a working assumption, not as proof that the variances are identical.",
    ),
    slide(
      {
        type: "callout",
        kicker: "Reading the result",
        title: "Significant, and large enough to matter on the line",
        tone: "ok",
        body: "Statistical significance says the variance gap is unlikely under H₀. Practical size is separate: Head B’s sample SD is roughly four times Head A’s, on a 14 mL aliquot.",
        aside: "A tiny variance gap can be significant in a huge sample and still be unimportant. That is not this data set. Equal variances cannot reasonably be assumed.",
      },
      "Put the two sentences on the board separately. Decision: reject equal variances. Process reading: Head B needs attention before anyone trusts a pooled mean comparison or a tight fill spec.",
    ),
    slide(
      {
        type: "bullets",
        kicker: "Cautions",
        title: "Mistakes that change the decision",
        items: [
          { lead: "Wrong question", text: "Reporting Levene’s test as evidence that the means differ." },
          { lead: "Wrong Z", text: "Running ANOVA on the raw volumes and calling the F ratio Levene’s W." },
          { lead: "Wrong tail", text: "Looking up a two-tailed t critical value instead of F₀.₀₅(1, 14)." },
          { lead: "Over-reading α", text: "Treating p > 0.05 as proof that the variances are equal." },
          { lead: "One center only", text: "Ignoring a median check when one group is badly skewed." },
        ],
      },
      "Pick the second mistake if time is short. It is the one that produces a confident, wrong statistic.",
    ),
    slide(
      {
        type: "summary",
        kicker: "Summary",
        title: "The argument in one pass",
        items: [
          "H₀: σ²ₐ = σ²ᵦ. Hₐ: σ²ₐ ≠ σ²ᵦ. α = 0.05.",
          "Mean-centered W = 45 on F(1, 14). Critical value 4.600. p ≈ 9.97 × 10⁻⁶.",
          "45 > 4.600 and p < 0.05, so reject H₀.",
          "Brown–Forsythe W = 42 leads to the same rejection.",
          "Do not assume equal variances. Use Welch, not the pooled t-test, if the means are compared next.",
        ],
      },
      "Close by repeating the decision once, then the practical instruction for the next test. Offer to reopen the deviation table if someone wants the within-head squares reconstructed.",
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
