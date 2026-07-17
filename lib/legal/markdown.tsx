/**
 * Minimal markdown renderer for legal documents.
 *
 * Supports:
 *  - # ## ### #### headings
 *  - paragraphs
 *  - **bold** *italic*
 *  - `inline code`
 *  - [text](url) links
 *  - - unordered lists
 *  - 1. ordered lists
 *  - | tables | with --- separator
 *  - > blockquotes
 *  - --- horizontal rule
 *  - ☐ checkboxes (rendered as styled spans)
 *
 * NOT supported (intentionally — keep the legal-doc surface area small):
 *  - HTML inside markdown (for safety, we don't trust the source)
 *  - images (legal docs shouldn't embed images)
 *  - code blocks (legal docs shouldn't have code)
 *
 * The renderer is `escape-by-default` — we only emit a small set of HTML
 * elements and never `dangerouslySetInnerHTML`.
 */

import { Fragment, type ReactNode } from "react"

interface Block {
  type: "h1" | "h2" | "h3" | "h4" | "p" | "ul" | "ol" | "table" | "blockquote" | "hr" | "callout"
  content?: string
  items?: string[]
  rows?: string[][] // for tables
}

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n")
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Blank line — skip
    if (line.trim() === "") {
      i++
      continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      blocks.push({ type: "hr" })
      i++
      continue
    }

    // Headings
    const h = /^(#{1,4})\s+(.*)$/.exec(line)
    if (h) {
      const level = h[1].length
      blocks.push({ type: `h${level}` as Block["type"], content: h[2] })
      i++
      continue
    }

    // Callout (lines starting with "> [!NOTE]" style or "> AVISO")
    const calloutMatch = /^>\s*\[!(\w+)\]\s*(.*)$/.exec(line)
    if (calloutMatch) {
      const title = calloutMatch[1]
      const rest = calloutMatch[2]
      // Consume continuation lines that start with "> "
      const body: string[] = [rest]
      i++
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        body.push(lines[i].replace(/^>\s?/, ""))
        i++
      }
      blocks.push({ type: "callout", content: `${title}|${body.join(" ").trim()}` })
      continue
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const body: string[] = [line.replace(/^>\s?/, "")]
      i++
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        body.push(lines[i].replace(/^>\s?/, ""))
        i++
      }
      blocks.push({ type: "blockquote", content: body.join("\n") })
      continue
    }

    // Table (| header |\n| --- |)
    if (/^\|.*\|$/.test(line.trim()) && i + 1 < lines.length && /^\|[\s\-|:]+\|$/.test(lines[i + 1].trim())) {
      const rows: string[][] = []
      const headerLine = line.trim()
      rows.push(headerLine.split("|").slice(1, -1).map((c) => c.trim()))
      i += 2 // skip header + separator
      while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) {
        rows.push(lines[i].trim().split("|").slice(1, -1).map((c) => c.trim()))
        i++
      }
      blocks.push({ type: "table", rows })
      continue
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""))
        i++
      }
      blocks.push({ type: "ul", items })
      continue
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""))
        i++
      }
      blocks.push({ type: "ol", items })
      continue
    }

    // Paragraph (consume consecutive non-blank, non-special lines)
    const para: string[] = [line]
    i++
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim()) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^\|.*\|$/.test(lines[i].trim())
    ) {
      para.push(lines[i])
      i++
    }
    blocks.push({ type: "p", content: para.join(" ") })
  }

  return blocks
}

function renderInline(text: string, key: string): ReactNode {
  // Token order matters: links before bold, etc.
  // 1. links: [label](url)
  // 2. bold: **text**
  // 3. italic: *text* (only when surrounded by spaces or boundaries, simple)
  // 4. inline code: `text`
  // 5. checkboxes: ☐ or ☑
  // Build via a small tokenizer.

  const tokens: { kind: "text" | "bold" | "italic" | "code" | "link" | "checkbox"; value: string; href?: string }[] = []

  // Naive but safe approach: walk through and split on patterns.
  let rest = text
  while (rest.length > 0) {
    // Match in priority order
    const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)/.exec(rest)
    const boldMatch = /^\*\*([^*]+)\*\*/.exec(rest)
    const italicMatch = /^\*([^*]+)\*/.exec(rest)
    const codeMatch = /^`([^`]+)`/.exec(rest)
    const checkboxMatch = /^([☐☑])\s*/.exec(rest)

    if (linkMatch) {
      tokens.push({ kind: "link", value: linkMatch[1], href: linkMatch[2] })
      rest = rest.slice(linkMatch[0].length)
    } else if (boldMatch) {
      tokens.push({ kind: "bold", value: boldMatch[1] })
      rest = rest.slice(boldMatch[0].length)
    } else if (italicMatch) {
      tokens.push({ kind: "italic", value: italicMatch[1] })
      rest = rest.slice(italicMatch[0].length)
    } else if (codeMatch) {
      tokens.push({ kind: "code", value: codeMatch[1] })
      rest = rest.slice(codeMatch[0].length)
    } else if (checkboxMatch) {
      tokens.push({ kind: "checkbox", value: checkboxMatch[1] })
      rest = rest.slice(checkboxMatch[0].length)
    } else {
      // Take until the next special character
      const idx = rest.search(/[\[*`☐☑]/)
      if (idx === -1) {
        tokens.push({ kind: "text", value: rest })
        rest = ""
      } else if (idx === 0) {
        // Special char we don't recognize — keep it literal.
        tokens.push({ kind: "text", value: rest[0] })
        rest = rest.slice(1)
      } else {
        tokens.push({ kind: "text", value: rest.slice(0, idx) })
        rest = rest.slice(idx)
      }
    }
  }

  return (
    <>
      {tokens.map((t, i) => {
        switch (t.kind) {
          case "text":
            return <Fragment key={`${key}-t${i}`}>{t.value}</Fragment>
          case "bold":
            return <strong key={`${key}-b${i}`} className="font-semibold text-white">{t.value}</strong>
          case "italic":
            return <em key={`${key}-i${i}`} className="italic text-slate-300">{t.value}</em>
          case "code":
            return <code key={`${key}-c${i}`} className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 text-xs font-mono">{t.value}</code>
          case "link":
            return (
              <a
                key={`${key}-l${i}`}
                href={t.href}
                target={t.href?.startsWith("http") ? "_blank" : undefined}
                rel={t.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                className="text-amber-400 underline underline-offset-2 hover:text-amber-300"
              >
                {t.value}
              </a>
            )
          case "checkbox":
            return (
              <span
                key={`${key}-cb${i}`}
                aria-hidden
                className="inline-flex items-center justify-center w-5 h-5 mr-2 align-middle border border-slate-500 rounded bg-slate-800 text-amber-400 text-sm leading-none select-none"
              >
                {t.value}
              </span>
            )
        }
      })}
    </>
  )
}

interface MarkdownProps {
  source: string
  className?: string
}

export function Markdown({ source, className = "" }: MarkdownProps) {
  const blocks = parseMarkdown(source)
  return (
    <div className={`legal-prose space-y-4 ${className}`}>
      {blocks.map((b, i) => {
        const key = `b${i}`
        switch (b.type) {
          case "h1":
            return (
              <h1 key={key} className="text-3xl font-bold text-white mt-8 mb-4">
                {renderInline(b.content!, key)}
              </h1>
            )
          case "h2":
            return (
              <h2 key={key} className="text-2xl font-bold text-white mt-8 mb-3 border-b border-slate-800 pb-2">
                {renderInline(b.content!, key)}
              </h2>
            )
          case "h3":
            return (
              <h3 key={key} className="text-lg font-semibold text-amber-400 mt-6 mb-2">
                {renderInline(b.content!, key)}
              </h3>
            )
          case "h4":
            return (
              <h4 key={key} className="text-base font-semibold text-slate-200 mt-4 mb-2">
                {renderInline(b.content!, key)}
              </h4>
            )
          case "p":
            return (
              <p key={key} className="text-slate-300 leading-relaxed">
                {renderInline(b.content!, key)}
              </p>
            )
          case "ul":
            return (
              <ul key={key} className="list-disc list-outside ml-6 space-y-1 text-slate-300">
                {b.items!.map((it, j) => (
                  <li key={`${key}-li${j}`}>{renderInline(it, `${key}-li${j}`)}</li>
                ))}
              </ul>
            )
          case "ol":
            return (
              <ol key={key} className="list-decimal list-outside ml-6 space-y-1 text-slate-300">
                {b.items!.map((it, j) => (
                  <li key={`${key}-li${j}`}>{renderInline(it, `${key}-li${j}`)}</li>
                ))}
              </ol>
            )
          case "blockquote":
            return (
              <blockquote
                key={key}
                className="border-l-4 border-amber-500/50 bg-slate-900/60 pl-4 pr-3 py-2 italic text-slate-300"
              >
                {renderInline(b.content!, key)}
              </blockquote>
            )
          case "callout": {
            const [kind, ...restLines] = (b.content ?? "").split("|")
            const body = restLines.join("|").trim()
            const tone: Record<string, string> = {
              NOTE: "border-sky-500/50 bg-sky-500/5 text-sky-200",
              IMPORTANT: "border-amber-500/60 bg-amber-500/5 text-amber-100",
              WARNING: "border-red-500/60 bg-red-500/5 text-red-100",
              AVISO: "border-amber-500/60 bg-amber-500/5 text-amber-100",
            }
            const cls = tone[kind.toUpperCase()] ?? tone.NOTE
            return (
              <div key={key} className={`border-l-4 rounded-r ${cls} px-4 py-3 text-sm leading-relaxed`}>
                <p className="font-semibold uppercase tracking-wide text-xs mb-1 opacity-90">
                  {kind}
                </p>
                <p>{renderInline(body, `${key}-cb`)}</p>
              </div>
            )
          }
          case "hr":
            return <hr key={key} className="border-slate-800 my-6" />
          case "table": {
            if (!b.rows || b.rows.length === 0) return null
            const [header, ...body] = b.rows
            return (
              <div key={key} className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900">
                    <tr>
                      {header.map((cell, j) => (
                        <th
                          key={`${key}-h${j}`}
                          className="text-left px-4 py-3 font-semibold text-amber-400 uppercase tracking-wide text-xs border-b border-slate-800"
                        >
                          {renderInline(cell, `${key}-h${j}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {body.map((row, j) => (
                      <tr key={`${key}-r${j}`} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-900/40">
                        {row.map((cell, k) => (
                          <td key={`${key}-r${j}c${k}`} className="px-4 py-3 text-slate-300 align-top">
                            {renderInline(cell, `${key}-r${j}c${k}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        }
      })}
    </div>
  )
}