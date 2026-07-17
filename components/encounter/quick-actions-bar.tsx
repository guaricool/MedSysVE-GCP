"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Save, FileText, Sparkles, ChevronUp, Zap } from "lucide-react"

/**
 * Quick actions bar — floating bottom bar with the most common actions.
 *
 * - Copy from last encounter (express mode)
 * - AI suggest diagnosis
 * - Download full history PDF
 * - Quick-save
 *
 * Why: keeps the most-used actions always one click away, regardless
 * of where the doctor is in the form.
 */
export function QuickActionsBar({
  encounterId,
  patientRegId,
  percent,
}: {
  encounterId: string
  patientRegId: string
  percent: number
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="fixed bottom-20 left-0 right-0 z-20 flex justify-center px-4 lg:bottom-6">
      <div className="flex max-w-3xl items-center gap-2 rounded-full border border-slate-700 bg-slate-900/95 px-3 py-1.5 shadow-xl backdrop-blur">
        {/* Progreso */}
        <div className="flex items-center gap-1.5 border-r border-slate-700 pr-2 text-xs text-slate-300">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all ${
                percent >= 75 ? "bg-emerald-500" : percent >= 50 ? "bg-blue-500" : "bg-slate-500"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="font-mono">{percent}%</span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          title="Más acciones"
        >
          <ChevronUp
            size={14}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        {expanded && (
          <>
            <button
              data-shortcut="save"
              onClick={() => {
                // Trigger any visible save button by clicking it
                const btn = document.querySelector(
                  'form button[type="submit"]',
                ) as HTMLButtonElement
                btn?.click()
              }}
              className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
              title="Guardar (Ctrl+S)"
            >
              <Save size={12} />
              Guardar
            </button>
            <button
              onClick={() => {
                if (!patientRegId) return
                const link = document.createElement("a")
                link.href = `/api/pdf/history/${patientRegId}`
                link.target = "_blank"
                link.click()
              }}
              className="flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
              title="Descargar historia completa"
            >
              <FileText size={12} />
              Historia
            </button>
            <button
              onClick={() => {
                // Open the AI assist panel
                document.getElementById("section-ai")?.scrollIntoView({ behavior: "smooth" })
              }}
              className="flex items-center gap-1 rounded-full bg-purple-900/40 px-3 py-1 text-xs text-purple-300 hover:bg-purple-900/60"
              title="Asistente IA"
            >
              <Sparkles size={12} />
              IA
            </button>
          </>
        )}
      </div>
    </div>
  )
}