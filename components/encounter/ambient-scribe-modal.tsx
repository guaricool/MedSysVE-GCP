"use client"

import { useState, useRef, useEffect } from "react"
import {
  Mic,
  Square,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Dog,
  X,
  FileCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface AmbientScribeResult {
  motivoConsulta?: string
  enfermedadActual?: string
  antecedentesPersonales?: string
  antecedentesFamiliares?: string
  examenFisico?: string
  impresionesDiagnosticas?: string[]
  planTratamiento?: string
  ruidoIgnorado?: string[]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onApplyToEncounter: (fields: {
    motivo?: string
    historiaClinica?: string
    examenFisico?: string
    plan?: string
    diagnoses?: string[]
  }) => void
}

export function AmbientScribeModal({ isOpen, onClose, onApplyToEncounter }: Props) {
  const [transcript, setTranscript] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [latency, setLatency] = useState<number | null>(null)
  const [result, setResult] = useState<AmbientScribeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const rec = new SpeechRecognition()
        rec.continuous = true
        rec.interimResults = true
        rec.lang = "es-VE"

        rec.onresult = (event: any) => {
          let currentText = ""
          for (let i = 0; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript + " "
          }
          setTranscript(currentText)
        }

        rec.onerror = (e: any) => {
          console.error("Speech Recognition Error:", e)
          setIsRecording(false)
          if (e.error === "not-allowed") {
            setError("⚠️ Permiso de micrófono no otorgado. Haz clic en el candado 🔒 al lado del URL (medsysve.com) en tu navegador y selecciona 'Permitir Micrófono'.")
          } else if (e.error === "no-speech") {
            setError("No se escuchó voz. Habla de nuevo cerca del micrófono.")
          }
        }

        recognitionRef.current = rec
      }
    }
  }, [])

  if (!isOpen) return null

  const startRecording = async () => {
    setError(null)
    setTranscript("")
    setResult(null)

    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch (err: any) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setError("⚠️ Permiso de micrófono denegado. Por favor haz clic en el icono del candado 🔒 en la barra de direcciones de tu navegador y activa el permiso de Micrófono para medsysve.com.")
          setIsRecording(false)
          return
        }
      }
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setIsRecording(true)
      } catch (err) {
        console.error(err)
      }
    } else {
      setError("Reconocimiento de voz directo no disponible en este navegador. Puedes escribir o pegar la transcripción abajo.")
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.error(e)
      }
    }
    setIsRecording(false)
  }

  const processWithGeminiSpark = async () => {
    if (!transcript.trim()) return
    setIsProcessing(true)
    setError(null)
    const startTime = Date.now()

    try {
      const res = await fetch("/api/ai/ambient-scribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al procesar")

      setResult(data.scribe)
      setLatency(data.latencyMs)
    } catch (err: any) {
      setError(err.message || "Error al conectar con Gemini Spark")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleApply = () => {
    if (!result) return

    // Build combined Historia Clínica
    let fullHistoria = result.enfermedadActual || ""
    if (result.antecedentesPersonales) {
      fullHistoria += `\n\nAntecedentes Personales / Quirúrgicos: ${result.antecedentesPersonales}`
    }
    if (result.antecedentesFamiliares) {
      fullHistoria += `\n\nAntecedentes Heredofamiliares: ${result.antecedentesFamiliares}`
    }

    onApplyToEncounter({
      motivo: result.motivoConsulta,
      historiaClinica: fullHistoria.trim(),
      examenFisico: result.examenFisico,
      plan: result.planTratamiento,
      diagnoses: result.impresionesDiagnosticas,
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                🎙️ Escriba Médico Inteligente — Gemini Spark
              </h3>
              <p className="text-xs text-slate-400">
                Graba la consulta en vivo, filtra la charla informal y autocompleta la historia médica SOAP.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4"
                >
                  <Mic className="w-4 h-4 mr-1.5" /> 🔴 Iniciar Grabación de Consulta
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  className="text-xs font-bold animate-pulse"
                >
                  <Square className="w-4 h-4 mr-1.5" /> ⏹️ Detener Grabación
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {latency && (
                <span className="text-[11px] text-cyan-400 font-mono flex items-center gap-1 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded-md">
                  <Clock className="w-3.5 h-3.5" /> {latency} ms
                </span>
              )}
              <Button
                onClick={processWithGeminiSpark}
                disabled={isProcessing || !transcript.trim()}
                className="bg-gradient-to-r from-purple-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white font-bold text-xs shadow-md"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Procesando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Analizar & Extraer con Gemini Spark
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Transcript Area */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Transcripción en Vivo de la Consulta:
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Haz clic en 'Iniciar Grabación' para hablar por el micrófono, o pega el diálogo aquí..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40 font-mono resize-none"
            />
          </div>

          {error && (
            <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" /> {error}
            </div>
          )}

          {/* Scribe Result Extraction */}
          {result && (
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Historia Clínica Extraída por Gemini Spark:
                </span>
                <Button
                  onClick={handleApply}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 shadow-lg animate-bounce"
                >
                  <FileCheck className="w-4 h-4 mr-1.5" /> ✨ Aplicar a la Consulta Médica
                </Button>
              </div>

              {/* Noise Discarded */}
              {result.ruidoIgnorado && result.ruidoIgnorado.length > 0 && (
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-2.5 text-xs">
                  <span className="font-bold text-amber-300 flex items-center gap-1 text-[11px]">
                    <Dog className="w-3.5 h-3.5 text-amber-400" /> Charlas Informales Ignoradas:
                  </span>
                  <p className="text-[11px] text-amber-200/90 italic mt-0.5">{result.ruidoIgnorado.join(", ")}</p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                {result.motivoConsulta && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block mb-1">Motivo de Consulta:</span>
                    <p className="text-slate-200 text-[11px]">{result.motivoConsulta}</p>
                  </div>
                )}
                {result.enfermedadActual && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Historia Clínica:</span>
                    <p className="text-slate-200 text-[11px]">{result.enfermedadActual}</p>
                  </div>
                )}
                {result.examenFisico && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">Examen Físico:</span>
                    <p className="text-slate-200 text-[11px]">{result.examenFisico}</p>
                  </div>
                )}
                {result.planTratamiento && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider block mb-1">Plan de Tratamiento / Receta:</span>
                    <p className="text-slate-200 text-[11px] whitespace-pre-line">{result.planTratamiento}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
