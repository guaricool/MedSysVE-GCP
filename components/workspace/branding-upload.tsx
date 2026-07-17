"use client"

import { useState, useRef } from "react"
import { trpc } from "@/lib/trpc-client"
import { Upload, CheckCircle, Image as ImageIcon, X } from "lucide-react"

interface Props {
  initialLogoUrl: string | null
  initialMembreteUrl: string | null
}

function UploadField({
  label,
  endpoint,
  initialUrl,
  onSaved,
  maxSizeMb = 2,
  hint,
}: {
  label: string
  endpoint: string
  initialUrl: string | null
  onSaved: (url: string) => void
  maxSizeMb?: number
  hint?: string
}) {
  const [preview, setPreview] = useState(initialUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`El archivo no puede superar ${maxSizeMb} MB.`)
      return
    }
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch(endpoint, { method: "POST", body: fd })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? "Error al subir")
      setPreview(data.url)
      onSaved(data.url)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}

      <div className="flex items-start gap-4">
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt={label}
              className="h-20 w-auto max-w-[200px] rounded border border-slate-700 object-contain bg-slate-800"
            />
            <button
              onClick={() => { setPreview(null); onSaved("") }}
              className="absolute -top-2 -right-2 rounded-full bg-red-700 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex h-20 w-32 items-center justify-center rounded border border-dashed border-slate-700 bg-slate-900">
            <ImageIcon className="h-6 w-6 text-slate-600" />
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:border-slate-500 disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Subiendo..." : preview ? "Cambiar imagen" : "Seleccionar imagen"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          {saved && (
            <p className="flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle className="h-3 w-3" />
              Guardado
            </p>
          )}
          <p className="text-xs text-slate-600">JPG, PNG o WebP · máx. {maxSizeMb} MB</p>
        </div>
      </div>
    </div>
  )
}

export function BrandingUpload({ initialLogoUrl, initialMembreteUrl }: Props) {
  const utils = trpc.useUtils()
  const updateSettings = trpc.workspace.updateSettings.useMutation({
    onSuccess: () => utils.workspace.current.invalidate(),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-blue-400" />
        <h2 className="text-sm font-semibold text-white">Logo y Membrete</h2>
      </div>

      <UploadField
        label="Logo del consultorio"
        endpoint="/api/upload/logo"
        initialUrl={initialLogoUrl}
        maxSizeMb={2}
        hint="Aparece en el sidebar y documentos. Recomendado: fondo transparente (PNG)."
        onSaved={(url) => updateSettings.mutate({ logoUrl: url || undefined })}
      />

      <UploadField
        label="Membrete / Encabezado"
        endpoint="/api/upload/membrete"
        initialUrl={initialMembreteUrl}
        maxSizeMb={5}
        hint="Imagen de encabezado para documentos clínicos, recetas y facturas."
        onSaved={(url) => updateSettings.mutate({ membreteUrl: url || undefined })}
      />
    </div>
  )
}
