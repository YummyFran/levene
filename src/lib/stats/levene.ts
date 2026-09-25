import { fPpf, fSf } from "@/lib/stats/f-distribution";

export type LeveneCenter = "mean" | "median";

export interface LeveneGroupResult {
  label: string;
  values: number[];
  center: number;
  absoluteDeviations: number[];
  meanAbsoluteDeviation: number;
  withinSumOfSquares: number;
  sampleMean: number;
  sampleVariance: number;
  sampleStandardDeviation: number;
}

export interface LeveneResult {
  center: LeveneCenter;
  alpha: number;
  groups: LeveneGroupResult[];
  k: number;
  n: number;
  df1: number;
  df2: number;
  grandMeanOfDeviations: number;
  betweenSumOfSquares: number;
  withinSumOfSquares: number;
  statistic: number;
  criticalValue: number;
  pValue: number;
  /** Right-tailed F rule: reject when W > F critical. */
  rejectByCriticalValue: boolean;
  /** Reject when p < alpha. */
  rejectByPValue: boolean;
  rejectNull: boolean;
}

function mean(xs: number[]): number {
  if (xs.length === 0) throw new Error("Cannot average an empty group.");
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

function median(xs: number[]): number {
  if (xs.length === 0) throw new Error("Cannot find the median of an empty group.");
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  if (s.length % 2 === 0) return (s[mid - 1] + s[mid]) / 2;
  return s[mid];
}

function sampleVariance(xs: number[], mu: number): number {
  if (xs.length < 2) return NaN;
  const ss = xs.reduce((s, x) => s + (x - mu) ** 2, 0);
  return ss / (xs.length - 1);
}

export interface LeveneGroupInput {
  label: string;
  values: number[];
}

/**
 * Levene's test for equality of variances.
 * center = "mean" is the original Levene statistic.
 * center = "median" is the Brown–Forsythe variation.
 * The statistic is the one-way ANOVA F ratio computed on absolute deviations.
 */
export function leveneTest(
  groups: LeveneGroupInput[],
  options?: { center?: LeveneCenter; alpha?: number },
): LeveneResult {
  const center = options?.center ?? "mean";
  const alpha = options?.alpha ?? 0.05;
  if (groups.length < 2) {
    throw new Error("Levene's test requires at least two groups.");
  }
  for (const g of groups) {
    if (g.values.length < 2) {
      throw new Error(`Group ${g.label} needs at least two observations.`);
    }
    if (g.values.some((v) => !Number.isFinite(v))) {
      throw new Error(`Group ${g.label} contains a non-numeric value.`);
    }
  }

  const computed: LeveneGroupResult[] = groups.map((g) => {
    const sampleMean = mean(g.values);
    const c = center === "mean" ? sampleMean : median(g.values);
    const absoluteDeviations = g.values.map((v) => Math.abs(v - c));
    const meanAbsoluteDeviation = mean(absoluteDeviations);
    const withinSumOfSquares = absoluteDeviations.reduce(
      (s, z) => s + (z - meanAbsoluteDeviation) ** 2,
      0,
    );
    const sv = sampleVariance(g.values, sampleMean);
    return {
      label: g.label,
      values: [...g.values],
      center: c,
      absoluteDeviations,
      meanAbsoluteDeviation,
      withinSumOfSquares,
      sampleMean,
      sampleVariance: sv,
      sampleStandardDeviation: Math.sqrt(sv),
    };
  });

  const k = computed.length;
  const n = computed.reduce((s, g) => s + g.values.length, 0);
  const allZ = computed.flatMap((g) => g.absoluteDeviations);
  const grandMeanOfDeviations = mean(allZ);
  const betweenSumOfSquares = computed.reduce(
    (s, g) => s + g.values.length * (g.meanAbsoluteDeviation - grandMeanOfDeviations) ** 2,
    0,
  );
  const withinSumOfSquares = computed.reduce((s, g) => s + g.withinSumOfSquares, 0);
  const df1 = k - 1;
  const df2 = n - k;
  if (withinSumOfSquares === 0) {
    const statistic = betweenSumOfSquares === 0 ? 0 : Infinity;
    const criticalValue = fPpf(1 - alpha, df1, df2);
    const pValue = statistic === 0 ? 1 : 0;
    const rejectByCriticalValue = statistic > criticalValue;
    const rejectByPValue = pValue < alpha;
    return {
      center,
      alpha,
      groups: computed,
      k,
      n,
      df1,
      df2,
      grandMeanOfDeviations,
      betweenSumOfSquares,
      withinSumOfSquares,
      statistic,
      criticalValue,
      pValue,
      rejectByCriticalValue,
      rejectByPValue,
      rejectNull: rejectByCriticalValue && rejectByPValue,
    };
  }
  const statistic = (df2 / df1) * (betweenSumOfSquares / withinSumOfSquares);
  const pValue = fSf(statistic, df1, df2);
  const criticalValue = fPpf(1 - alpha, df1, df2);
  const rejectByCriticalValue = statistic > criticalValue;
  const rejectByPValue = pValue < alpha;
  return {
    center,
    alpha,
    groups: computed,
    k,
    n,
    df1,
    df2,
    grandMeanOfDeviations,
    betweenSumOfSquares,
    withinSumOfSquares,
    statistic,
    criticalValue,
    pValue,
    rejectByCriticalValue,
    rejectByPValue,
    rejectNull: rejectByCriticalValue,
  };
}

export const EXAMPLE_GROUPS: LeveneGroupInput[] = [
  { label: "Head A", values: [12, 14, 13, 15, 14, 13, 12, 16] },
  { label: "Head B", values: [8, 18, 9, 20, 7, 19, 11, 17] },
];
