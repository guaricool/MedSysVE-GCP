"use client"

import { useState, type ReactNode } from "react"

interface Props {
  title: string
  icon?: ReactNode
  defaultOpen?: boolean
  /** Optional badges/count shown on the right when collapsed (e.g. "3 items") */
  summary?: ReactNode
  /** Force the open/closed state from a parent (controlled mode). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Optional callback fired the moment the section opens (e.g. to scroll into view). */
  onOpened?: () => void
  /** Extra classes on the outer wrapper. */
  className?: string
  children: ReactNode
}

/**
 * AccordionSection — a controlled-or-uncontrolled collapsible card.
 *
 * Visual: a single borderless row with title + icon + (optional summary)
 * + a round "+" badge on the right that rotates 45° to "×" when open.
 * The body slides open with a grid-rows transition (no fixed height, no jank).
 *
 * Use defaultOpen=true for sections that should land open (e.g. entry-point
 * sections like "Subjetivo" in an encounter).
 */
export function AccordionSection({
  title,
  icon,
  defaultOpen = false,
  summary,
  open: controlledOpen,
  onOpenChange,
  onOpened,
  className = "",
  children,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  function toggle() {
    const next = !open
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
    if (next) onOpened?.()
  }

  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden transition-colors ${className}`}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="group flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-800/40"
      >
        {icon && <span className="shrink-0 text-base leading-none">{icon}</span>}
        <span className="flex-1 text-sm font-semibold text-white">{title}</span>
        {summary && (
          <span className="hidden text-xs text-slate-400 sm:inline-flex">{summary}</span>
        )}
        <span
          aria-hidden
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-700 text-lg font-light leading-none transition-all duration-200 ${
            open
              ? "rotate-45 border-blue-500 bg-blue-600 text-white"
              : "bg-slate-800/60 text-slate-400 group-hover:border-slate-600 group-hover:text-slate-200"
          }`}
        >
          +
        </span>
      </button>
      <div
        className={`grid transition-all duration-200 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1">{children}</div>
        </div>
      </div>
    </div>
  )
}