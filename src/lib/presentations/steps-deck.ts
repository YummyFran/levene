import type { PresentationDoc, Slide } from "@/lib/types";
import { uid } from "@/lib/utils";

function slide(block: Slide["block"], notes: string): Slide {
  return { id: uid("st"), block, notes };
}

/** A short second deck so the library is not a single hard-coded presentation. */
export function buildStepsDeck(now = Date.now()): PresentationDoc {
  const slides: Slide[] = [
    slide(
      {
        type: "title",
        kicker: "Course method",
        title: "How a seven-step solution is built",
        subtitle: "A compact companion to any test of difference. The steps stay in order even when the statistic changes.",
        footer: "Native sample deck · add further decks beside this one",
      },
      "This deck teaches the write-up skeleton. It is not a second computation of Levene’s test.",
    ),
    slide(
      {
        type: "bullets",
        kicker: "Before the steps",
        title: "Set the procedure in context",
        items: [
          { lead: "Meaning", text: "Say what question the test can answer." },
          { lead: "Limits", text: "Say what would make the test the wrong tool." },
          { lead: "Formula", text: "Name the statistic and define every symbol." },
          { lead: "Problem", text: "Give a real setting before you write the data table." },
        ],
      },
      "Keep this material in front of Step 1. Do not renumber it as a step.",
    ),
    slide(
      {
        type: "summary",
        kicker: "The required order",
        title: "Seven steps, unmerged",
        items: [
          "1. State the null and alternative hypotheses.",
          "2. State the level of significance (α = 0.05).",
          "3. Write the given data.",
          "4. Name the test statistic and its formula.",
          "5. Compute the statistic, the critical value, and the p-value.",
          "6. Make the statistical decision from both comparisons.",
          "7. State the conclusion in the language of the problem.",
        ],
      },
      "If a slide has to be cut for time, cut decoration, not a step. Step 5 may occupy several slides.",
    ),
    slide(
      {
        type: "compare",
        kicker: "Step 6",
        title: "Two routes, one decision",
        columns: [
          {
            heading: "Critical value",
            points: [
              "Right-tailed and two-tailed upper tests: reject when the statistic exceeds the table value.",
              "A left-tailed test reverses that inequality.",
              "Levene’s W uses the right-tailed F rule.",
            ],
          },
          {
            heading: "P-value",
            points: [
              "Reject when p is less than α.",
              "Fail to reject when p is greater than α.",
              "The two routes should agree. If they do not, recheck degrees of freedom.",
            ],
          },
        ],
      },
      "Mention that this course sometimes writes “accept” for a failure to reject. Say that the precise claim is “not enough evidence to reject.”",
    ),
    slide(
      {
        type: "callout",
        kicker: "Step 7",
        title: "A conclusion names the evidence and the setting",
        tone: "ink",
        body: "At the chosen α, say whether there is sufficient evidence for the alternative, then say what that means for the groups in the problem.",
        aside: "A p-value alone is not a conclusion. Neither is a restatement of the formula.",
      },
      "Model one sentence of decision and one sentence of interpretation. Stop there.",
    ),
  ];

  return {
    id: "builtin-steps",
    title: "How a Seven-Step Solution Is Built",
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
