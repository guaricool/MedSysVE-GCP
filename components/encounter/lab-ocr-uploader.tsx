"use client"

import { useRef, useState } from "react"

interface LabOcrUploaderProps {
  onResult: (data: any) => void
}

export function LabOcrUploader({ onResult }: LabOcrUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setFileName(file.name)
    setLoading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/lab-ocr", { method: "POST", body: form })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Error al procesar la imagen.")
        return
      }
      if (json.data) onResult(json.data)

    } catch {
      setError("Error de red al procesar la imagen.")
    } finally {
      setLoading(false)
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400">
        Suba una imagen del resultado de laboratorio para extraer los valores automáticamente con IA.
      </p>
      <div
        className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-700 bg-slate-900 p-6 text-slate-400 transition hover:border-blue-500 hover:text-blue-400"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <svg
          className="mb-2 h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <span className="text-sm">
          {loading ? "Procesando con IA..." : "Haga clic o arrastre la imagen aquí"}
        </span>
        {fileName && !loading && (
          <span className="mt-1 text-xs text-slate-500">{fileName}</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
