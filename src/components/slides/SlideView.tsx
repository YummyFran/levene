"use client";

import type { ReactNode } from "react";
import type { SlideBlock } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SlideView({
  block,
  reveal = Number.POSITIVE_INFINITY,
}: {
  block: SlideBlock;
  reveal?: number;
}) {
  switch (block.type) {
    case "title":
      return (
        <article className="flex h-full flex-col justify-between px-16 py-14">
          <p className="text-xs uppercase tracking-[0.28em] text-burgundy">{block.kicker}</p>
          <div>
            <h1 className="max-w-5xl font-serif text-6xl leading-[1.05] text-ink">{block.title}</h1>
            <div className="mt-8 h-px w-24 bg-gold" />
            {block.subtitle && (
              <p className="mt-6 max-w-3xl text-xl leading-8 text-muted">{block.subtitle}</p>
            )}
          </div>
          <p className="text-sm tracking-wide text-muted">{block.footer}</p>
        </article>
      );
    case "section":
      return (
        <article className="flex h-full flex-col justify-end bg-navy px-16 py-16 text-paper">
          <p className="text-xs uppercase tracking-[0.28em] text-gold">{block.index}</p>
          <h2 className="mt-4 max-w-4xl font-serif text-6xl leading-tight">{block.title}</h2>
          {block.lede && <p className="mt-6 max-w-2xl text-lg text-paper/80">{block.lede}</p>}
        </article>
      );
    case "bullets":
      return (
        <Frame kicker={block.kicker} title={block.title}>
          <ul className="mt-8 grid gap-5">
            {block.items.map((item) => (
              <li key={item.lead} className="grid grid-cols-[9rem_1fr] gap-6 border-t border-line pt-4">
                <span className="text-xs uppercase tracking-[0.18em] text-burgundy">{item.lead}</span>
                <span className="text-lg leading-7 text-ink">{item.text}</span>
              </li>
            ))}
          </ul>
        </Frame>
      );
    case "compare":
      return (
        <Frame kicker={block.kicker} title={block.title}>
          <div className="mt-8 grid flex-1 grid-cols-2 gap-10">
            {block.columns.map((column) => (
              <section key={column.heading}>
                <h3 className="font-serif text-2xl text-navy">{column.heading}</h3>
                <ul className="mt-4 space-y-3">
                  {column.points.map((point) => (
                    <li key={point} className="border-l-2 border-gold pl-4 text-base leading-7 text-ink">
                      {point}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          {block.footnote && <p className="mt-6 text-sm leading-6 text-muted">{block.footnote}</p>}
        </Frame>
      );
    case "formula":
      return (
        <Frame kicker={block.kicker} title={block.title}>
          <p className="mt-6 bg-calc px-6 py-5 font-mono text-xl leading-8 text-navy">{block.formula}</p>
          <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3">
            {block.symbols.map((row) => (
              <div key={row.symbol} className="grid grid-cols-[5.5rem_1fr] gap-3 border-b border-line py-2">
                <dt className="font-mono text-sm text-burgundy">{row.symbol}</dt>
                <dd className="text-sm leading-6 text-ink">{row.meaning}</dd>
              </div>
            ))}
          </dl>
          {block.note && <p className="mt-4 text-sm leading-6 text-muted">{block.note}</p>}
        </Frame>
      );
    case "table":
      return (
        <Frame kicker={block.kicker} title={block.title}>
          {block.caption && <p className="mt-2 text-sm text-muted">{block.caption}</p>}
          <div className="mt-6 overflow-hidden border border-line">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-navy text-paper">
                <tr>
                  {block.columns.map((column) => (
                    <th key={column} className="px-3 py-2 text-xs font-medium uppercase tracking-[0.14em]">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, index) => (
                  <tr key={index} className={index % 2 ? "bg-calc/60" : "bg-card"}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={cn(
                          "border-t border-line px-3 py-2",
                          block.numeric && cellIndex > 0 && "text-right font-mono tabular-nums",
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Frame>
      );
    case "dots":
      return (
        <Frame kicker={block.kicker} title={block.title}>
          <DotPlot series={block.series} unit={block.unit} />
          {block.caption && <p className="mt-4 text-sm text-muted">{block.caption}</p>}
        </Frame>
      );
    case "calculation":
      return (
        <Frame kicker={block.kicker} title={block.title}>
          <ol className="mt-6 space-y-4">
            {block.lines.slice(0, reveal).map((line) => (
              <li key={line.label} className="grid grid-cols-[8rem_1fr_auto] items-baseline gap-4 border-b border-line pb-3">
                <span className="text-xs uppercase tracking-[0.16em] text-burgundy">{line.label}</span>
                <span className="font-mono text-base text-ink">{line.expression}</span>
                <span className="font-mono text-lg text-navy">{line.result}</span>
              </li>
            ))}
          </ol>
          {block.note && reveal >= block.lines.length && (
            <p className="mt-5 text-sm leading-6 text-muted">{block.note}</p>
          )}
        </Frame>
      );
    case "decision":
      return (
        <Frame kicker={block.kicker} title={block.title}>
          <div className="mt-6 space-y-4">
            {block.rules.map((rule) => (
              <div key={rule.name} className="grid grid-cols-[14rem_1fr_auto] items-center gap-4 border border-line bg-card px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">{rule.name}</p>
                <p className="text-base text-ink">{rule.comparison}</p>
                <p className={cn("text-sm font-medium", rule.reject ? "text-burgundy" : "text-ok")}>{rule.outcome}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-navy px-6 py-5 text-paper">
            <p className="font-serif text-3xl">{block.verdict}</p>
            <p className="mt-2 text-sm leading-6 text-paper/80">{block.detail}</p>
          </div>
        </Frame>
      );
    case "callout":
      return (
        <article className="flex h-full flex-col justify-center px-16 py-14">
          <p className="text-xs uppercase tracking-[0.28em] text-burgundy">{block.kicker}</p>
          <h2 className="mt-4 max-w-4xl font-serif text-5xl leading-tight text-ink">{block.title}</h2>
          <p className="mt-8 max-w-4xl text-2xl leading-10 text-ink">{block.body}</p>
          {block.aside && (
            <p className={cn("mt-8 max-w-3xl border-l-2 pl-5 text-base leading-7", toneClass(block.tone))}>
              {block.aside}
            </p>
          )}
        </article>
      );
    case "summary":
      return (
        <Frame kicker={block.kicker} title={block.title}>
          <ol className="mt-8 space-y-4">
            {block.items.map((item, index) => (
              <li key={item} className="flex gap-5">
                <span className="font-serif text-2xl text-gold">{String(index + 1).padStart(2, "0")}</span>
                <span className="pt-1 text-lg leading-7 text-ink">{item}</span>
              </li>
            ))}
          </ol>
        </Frame>
      );
    case "richtext":
      return (
        <Frame kicker={block.kicker} title={block.title}>
          <div className="mt-6 max-w-4xl space-y-4">
            {block.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-lg leading-8 text-ink">
                {paragraph}
              </p>
            ))}
          </div>
        </Frame>
      );
    case "image":
      return (
        <article className="flex h-full flex-col bg-ink">
          {block.title && (
            <p className="px-6 py-3 text-xs uppercase tracking-[0.18em] text-paper/70">{block.title}</p>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.src} alt={block.alt} className="min-h-0 flex-1 object-contain" />
        </article>
      );
    case "video":
      return (
        <article className="flex h-full flex-col bg-ink px-8 py-6">
          {block.title && <p className="mb-3 text-sm text-paper/80">{block.title}</p>}
          <video className="min-h-0 flex-1 bg-black" controls src={block.src}>
            <source src={block.src} type={block.mime} />
          </video>
        </article>
      );
    case "pptx":
      return (
        <article className="relative h-full overflow-hidden bg-white text-ink">
          {block.elements.map((element, index) => {
            const style = {
              left: `${element.x}%`,
              top: `${element.y}%`,
              width: `${element.w}%`,
              height: `${element.h}%`,
            };
            if (element.kind === "image" && element.src) {
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={index} src={element.src} alt="" className="absolute object-contain" style={style} />
              );
            }
            if (element.kind === "shape") {
              return (
                <div
                  key={index}
                  className="absolute"
                  style={{
                    ...style,
                    background: element.fill,
                    borderRadius: element.shape === "ellipse" ? "999px" : element.shape === "roundRect" ? "12px" : 0,
                  }}
                />
              );
            }
            return (
              <p
                key={index}
                className="absolute overflow-hidden leading-tight"
                style={{
                  ...style,
                  color: element.color,
                  fontSize: element.fontSize ? `${element.fontSize}px` : "18px",
                  fontWeight: element.bold ? 700 : 500,
                  textAlign: element.align,
                }}
              >
                {element.text}
              </p>
            );
          })}
        </article>
      );
    case "fallback":
      return (
        <article className="flex h-full flex-col justify-center px-16">
          <p className="text-xs uppercase tracking-[0.22em] text-burgundy">Fallback</p>
          <h2 className="mt-3 font-serif text-4xl">{block.title}</h2>
          <p className="mt-6 max-w-3xl text-lg leading-8">{block.message}</p>
          {block.detail && <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">{block.detail}</p>}
        </article>
      );
    default:
      return null;
  }
}

function Frame({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="flex h-full flex-col px-14 py-12">
      {kicker && <p className="text-xs uppercase tracking-[0.28em] text-burgundy">{kicker}</p>}
      <h2 className="mt-3 max-w-5xl font-serif text-[2.6rem] leading-tight text-ink">{title}</h2>
      {children}
    </article>
  );
}

function toneClass(tone: "ink" | "warn" | "ok") {
  if (tone === "warn") return "border-burgundy text-burgundy";
  if (tone === "ok") return "border-ok text-ok";
  return "border-navy text-navy";
}

function DotPlot({
  series,
  unit,
}: {
  series: { name: string; values: number[] }[];
  unit?: string;
}) {
  const all = series.flatMap((item) => item.values);
  const min = Math.min(...all) - 1;
  const max = Math.max(...all) + 1;
  const x = (value: number) => ((value - min) / (max - min)) * 100;
  return (
    <div className="mt-10 space-y-8">
      {series.map((item) => (
        <div key={item.name}>
          <div className="mb-2 flex justify-between text-xs uppercase tracking-[0.16em] text-muted">
            <span>{item.name}</span>
            <span>{unit}</span>
          </div>
          <div className="relative h-12 border-b border-line">
            {item.values.map((value, index) => (
              <span
                key={`${value}-${index}`}
                className="absolute top-2 h-4 w-4 -translate-x-1/2 rounded-full border border-paper bg-burgundy"
                style={{ left: `${x(value)}%` }}
                title={`${value} ${unit ?? ""}`}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="flex justify-between font-mono text-xs text-muted">
        <span>{min.toFixed(0)}</span>
        <span>{((min + max) / 2).toFixed(0)}</span>
        <span>{max.toFixed(0)}</span>
      </div>
    </div>
  );
}

export function revealLength(block: SlideBlock): number {
  return block.type === "calculation" ? block.lines.length : 0;
}
