"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, ZoomIn, ZoomOut, RotateCcw, Activity, Sparkles, Loader2, AlertCircle } from "lucide-react"

interface Point {
  x: number
  y: number
}

interface Line {
  p1: Point
  p2: Point
}

export function RadiologyViewer() {
  const [file, setFile] = useState<File | null>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  
  // Measurement tool state
  const [mode, setMode] = useState<"VIEW" | "MEASURE">("VIEW")
  const [lines, setLines] = useState<Line[]>([])
  const [currentLine, setCurrentLine] = useState<Line | null>(null)

  // AI state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState<{ hallazgos: string; impresion: string } | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const url = URL.createObjectURL(selectedFile)
      setImageSrc(url)
      setLines([])
      setZoom(1)
      setBrightness(100)
      setContrast(100)
      setAiResult(null)
      setAiError(null)
    }
  }

  async function handleAiAnalysis() {
    if (!file) return
    setIsAnalyzing(true)
    setAiError(null)
    setAiResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/radiology-ai", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || "Error al analizar la imagen")
      }

      const { data } = await res.json()
      setAiResult(data)
    } catch (err: any) {
      console.error(err)
      setAiError(err.message || "Error de conexión con la IA")
    } finally {
      setIsAnalyzing(false)
    }
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (mode !== "MEASURE" || !imageSrc) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    // Calculate coordinates relative to the original image dimensions, accounting for zoom
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    if (!currentLine) {
      setCurrentLine({ p1: { x, y }, p2: { x, y } })
    } else {
      setLines([...lines, { p1: currentLine.p1, p2: { x, y } }])
      setCurrentLine(null)
    }
  }

  function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (mode !== "MEASURE" || !currentLine) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom
    setCurrentLine({ ...currentLine, p2: { x, y } })
  }

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageSrc) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.src = imageSrc
    img.onload = () => {
      // Set canvas size to match the container width, calculate height maintaining aspect ratio
      const containerWidth = containerRef.current?.clientWidth || 500
      const scale = containerWidth / img.width
      canvas.width = containerWidth
      canvas.height = img.height * scale

      // Apply filters and transform
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
      
      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      // Reset filter for drawings
      ctx.filter = "none"

      // Helper to draw lines
      const drawLine = (l: Line, color: string) => {
        ctx.beginPath()
        ctx.moveTo(l.p1.x * scale, l.p1.y * scale)
        ctx.lineTo(l.p2.x * scale, l.p2.y * scale)
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.stroke()

        // Draw points
        ctx.beginPath()
        ctx.arc(l.p1.x * scale, l.p1.y * scale, 3, 0, Math.PI * 2)
        ctx.arc(l.p2.x * scale, l.p2.y * scale, 3, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
      }

      // Draw saved lines
      lines.forEach(l => drawLine(l, "#ef4444")) // Red for finished lines

      // Draw current line
      if (currentLine) {
        drawLine(currentLine, "#3b82f6") // Blue for active line
      }

      // Calculate angle if there are 2 lines
      if (lines.length === 2) {
        // Calculate angle between two vectors
        const v1 = { x: lines[0].p2.x - lines[0].p1.x, y: lines[0].p2.y - lines[0].p1.y }
        const v2 = { x: lines[1].p2.x - lines[1].p1.x, y: lines[1].p2.y - lines[1].p1.y }
        
        const dot = v1.x * v2.x + v1.y * v2.y
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)
        
        const angleRad = Math.acos(dot / (mag1 * mag2))
        const angleDeg = (angleRad * 180 / Math.PI).toFixed(1)

        // Draw text
        ctx.fillStyle = "#ef4444"
        ctx.font = "bold 16px sans-serif"
        ctx.fillText(`Ángulo: ${angleDeg}°`, 10, 25)
      }
    }
  }, [imageSrc, zoom, brightness, contrast, lines, currentLine])

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-800 p-3 border-b border-slate-700">
        <label className="flex items-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">
          <Upload size={14} />
          Cargar Radiografía
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>

        {imageSrc && (
          <>
            <div className="h-4 w-px bg-slate-600" />
            <button
              onClick={() => setMode("VIEW")}
              className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${mode === "VIEW" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
            >
              Navegar
            </button>
            <button
              onClick={() => setMode("MEASURE")}
              className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${mode === "MEASURE" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-slate-400 hover:text-white"}`}
            >
              <Activity size={14} />
              Trazar Ángulo
            </button>
            <button
              onClick={handleAiAnalysis}
              disabled={isAnalyzing}
              className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${isAnalyzing ? "bg-purple-500/20 text-purple-400 opacity-50 cursor-not-allowed" : "bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30"}`}
            >
              {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Apreciación IA
            </button>
            <button
              onClick={() => setLines([])}
              className="text-xs text-slate-400 hover:text-white"
            >
              Limpiar Trazos
            </button>
            
            <div className="h-4 w-px bg-slate-600" />
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="font-medium">Brillo</span>
              <input type="range" min="50" max="200" value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-20" />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="font-medium">Contraste</span>
              <input type="range" min="50" max="200" value={contrast} onChange={e => setContrast(Number(e.target.value))} className="w-20" />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-1 text-slate-400 hover:text-white bg-slate-700 rounded"><ZoomOut size={16} /></button>
              <span className="text-xs text-slate-400 font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="p-1 text-slate-400 hover:text-white bg-slate-700 rounded"><ZoomIn size={16} /></button>
            </div>
          </>
        )}
      </div>

      {/* Viewer Area */}
      <div 
        ref={containerRef}
        className="relative min-h-[300px] max-h-[600px] overflow-auto bg-[#0a0a0a] flex items-center justify-center p-4"
        style={{ cursor: mode === "MEASURE" ? "crosshair" : "grab" }}
      >
        {!imageSrc ? (
          <div className="text-center text-slate-500 flex flex-col items-center">
            <RotateCcw size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No hay imagen cargada</p>
            <p className="text-xs mt-1">Haga clic en Cargar Radiografía para visualizar e interactuar.</p>
          </div>
        ) : (
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", transition: "transform 0.1s" }}>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              className="max-w-full shadow-2xl"
            />
          </div>
        )}
      </div>

      {imageSrc && mode === "MEASURE" && (
        <div className="bg-slate-800 p-2 text-[10px] text-slate-400 text-center border-t border-slate-700">
          Haz clic para marcar el inicio de una línea, luego arrastra y haz clic para fijarla. Necesitas 2 líneas para calcular el ángulo (ej: Ángulo de Cobb).
        </div>
      )}

      {/* AI Panel */}
      {aiError && (
        <div className="bg-red-500/10 border-t border-red-500/20 p-3 flex items-start gap-2 text-sm text-red-400">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{aiError}</p>
        </div>
      )}

      {aiResult && (
        <div className="bg-purple-900/20 border-t border-purple-500/20 p-4">
          <div className="flex items-center gap-2 text-purple-400 font-medium mb-3">
            <Sparkles size={16} />
            Apreciación Asistida por IA
          </div>
          
          <div className="space-y-4 text-sm text-slate-300">
            <div>
              <h4 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Hallazgos</h4>
              <p className="whitespace-pre-wrap">{aiResult.hallazgos}</p>
            </div>
            
            <div>
              <h4 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Impresión Diagnóstica</h4>
              <p className="whitespace-pre-wrap font-medium text-slate-200">{aiResult.impresion}</p>
            </div>
            
            <p className="text-[10px] text-slate-500 italic mt-4">
              Nota: Este análisis es generado por inteligencia artificial para asistencia y no reemplaza el diagnóstico de un especialista.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
