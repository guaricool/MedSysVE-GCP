"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-900/60 text-blue-300 border-blue-700",
  green: "bg-green-900/60 text-green-300 border-green-700",
  yellow: "bg-yellow-900/60 text-yellow-300 border-yellow-700",
  red: "bg-red-900/60 text-red-300 border-red-700",
  purple: "bg-purple-900/60 text-purple-300 border-purple-700",
  pink: "bg-pink-900/60 text-pink-300 border-pink-700",
  orange: "bg-orange-900/60 text-orange-300 border-orange-700",
  slate: "bg-slate-700 text-slate-300 border-slate-600",
}

const DOT_MAP: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  orange: "bg-orange-500",
  slate: "bg-slate-400",
}

const COLORS = Object.keys(COLOR_MAP) as Array<keyof typeof COLOR_MAP>

interface Props {
  patientRegistrationId: string
}

export function PatientTags({ patientRegistrationId }: Props) {
  const [newTag, setNewTag] = useState("")
  const [selectedColor, setSelectedColor] = useState("blue")

  const { data: rawTags, refetch } = (trpc.tag as any).list.useQuery({ patientRegistrationId })
  const tags = (rawTags ?? []) as any[]

  const addTag = (trpc.tag as any).add.useMutation({
    onSuccess: () => {
      refetch()
      setNewTag("")
    },
  })

  const deleteTag = (trpc.tag as any).delete.useMutation({
    onSuccess: () => refetch(),
  })

  function handleAdd() {
    const label = newTag.trim()
    if (!label) return
    addTag.mutate({ patientRegistrationId, etiqueta: label, color: selectedColor })
  }

  return (
    <div className="space-y-3">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag: any) => (
            <span
              key={tag.id}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${COLOR_MAP[tag.color] ?? COLOR_MAP.blue}`}
            >
              {tag.etiqueta}
              <button
                type="button"
                onClick={() => deleteTag.mutate({ id: tag.id })}
                className="ml-0.5 opacity-60 hover:opacity-100"
                title="Eliminar"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Nueva etiqueta..."
          maxLength={30}
          className="bg-slate-800 border-slate-700 text-white h-8 text-sm flex-1"
        />
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              title={c}
              onClick={() => setSelectedColor(c)}
              className={`h-4 w-4 rounded-full ${DOT_MAP[c]} ${selectedColor === c ? "ring-2 ring-white ring-offset-1 ring-offset-slate-900" : ""}`}
            />
          ))}
        </div>
        <Button
          size="sm"
          disabled={!newTag.trim() || addTag.isPending}
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 h-8 px-3"
        >
          +
        </Button>
      </div>
    </div>
  )
}
