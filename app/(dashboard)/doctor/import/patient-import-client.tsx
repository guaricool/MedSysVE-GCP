"use client"

import { useState, useRef } from "react"
import { Upload, FileText, CheckCircle, AlertCircle, Download } from "lucide-react"

interface ImportResult {
  total: number
  created: number
  skipped: number
  errors: string[]
}

const CSV_TEMPLATE = `nombre,apellido,fechaNacimiento,sexo,telefono,email,cedula
María,González,1985-03-15,FEMENINO,04141234567,maria@email.com,V-12345678
Juan,Pérez,1990-07-22,MASCULINO,04241234567,,E-87654321
Ana,Rodríguez,2015-11-03,FEMENINO,04121234567,,`

export function PatientImportClient() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    if (!f.name.endsWith(".csv")) {
      setError("Solo se aceptan archivos CSV (.csv)")
      return
    }
    setFile(f)
    setError(null)
    setResult(null)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/import/patients", { method: "POST", body: fd })
      const data = await res.json() as ImportResult & { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Error al importar")
      setResult(data)
      setFile(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al importar")
    } finally {
      setUploading(false)
    }
  }

  function downloadTemplate() {
    const blob = new Blob(["﻿" + CSV_TEMPLATE], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "plantilla-pacientes.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      {/* Template download */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-2">
        <h2 className="text-sm font-semibold text-white">1. Descarga la plantilla CSV</h2>
        <p className="text-xs text-slate-400">
          El archivo debe contener las columnas: <code className="text-slate-300">nombre, apellido, fechaNacimiento, sexo</code> (obligatorias)
          y opcionalmente: <code className="text-slate-300">telefono, email, cedula</code>.
        </p>
        <p className="text-xs text-slate-400">
          La fecha debe estar en formato <code className="text-slate-300">YYYY-MM-DD</code>.
          El sexo puede ser <code className="text-slate-300">MASCULINO, FEMENINO, OTRO, M, F</code>.
        </p>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 rounded border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:border-slate-500"
        >
          <Download className="h-3.5 w-3.5" />
          Descargar plantilla
        </button>
      </div>

      {/* File upload */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-white">2. Selecciona tu archivo CSV</h2>
        <div
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-700 bg-slate-800/50 px-6 py-8 cursor-pointer hover:border-blue-600 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files?.[0]
            if (f) handleFile(f)
          }}
        >
          <Upload className="h-8 w-8 text-slate-500 mb-2" />
          {file ? (
            <div className="text-center">
              <p className="text-sm text-white font-medium">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-slate-400">Arrastra tu CSV aquí o haz clic para seleccionar</p>
              <p className="text-xs text-slate-600 mt-1">Máx. 500 pacientes · 5 MB</p>
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="flex items-center gap-1.5 rounded bg-blue-700 px-4 py-1.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Importando..." : "Importar pacientes"}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            Importación completada
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md bg-slate-800 p-3 text-center">
              <p className="text-2xl font-bold text-white">{result.total}</p>
              <p className="text-xs text-slate-400">Total filas</p>
            </div>
            <div className="rounded-md bg-emerald-950/50 border border-emerald-800 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">{result.created}</p>
              <p className="text-xs text-slate-400">Creados</p>
            </div>
            <div className="rounded-md bg-slate-800 p-3 text-center">
              <p className="text-2xl font-bold text-slate-400">{result.skipped}</p>
              <p className="text-xs text-slate-400">Omitidos</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="rounded-md border border-red-800/50 bg-red-950/20 p-3 text-xs">
              <p className="font-medium text-red-400 mb-1">Errores ({result.errors.length}):</p>
              <ul className="space-y-0.5 text-red-300">
                {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            </div>
          )}
          <p className="text-xs text-slate-500">
            Los pacientes ya registrados en este consultorio fueron omitidos.
          </p>
        </div>
      )}
    </div>
  )
}
