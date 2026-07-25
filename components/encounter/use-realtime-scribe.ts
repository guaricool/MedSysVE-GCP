"use client"

import { useState, useEffect, useRef } from "react"

interface ExtractedFields {
  motivo?: string
  historiaClinica?: string
  examenFisico?: string
  plan?: string
  ruidoIgnorado?: string[]
}

interface UseRealtimeScribeProps {
  enabled: boolean
  onFieldsExtracted: (fields: ExtractedFields) => void
}

export function useRealtimeScribe({ enabled, onFieldsExtracted }: UseRealtimeScribeProps) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [lastProcessedLength, setLastProcessedLength] = useState(0)
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date | null>(null)
  const [noiseSummary, setNoiseSummary] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const processingTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize SpeechRecognition
  useEffect(() => {
    if (typeof window === "undefined") return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setError("Reconocimiento de voz no soportado por este navegador.")
      return
    }

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
      console.error("Realtime Scribe Speech Error:", e)
      if (e.error === "not-allowed") {
        setError("⚠️ Permiso de micrófono bloqueado en tu navegador.")
        setIsListening(false)
      }
    }

    rec.onend = () => {
      // Auto-restart if enabled is true
      if (enabled && recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch {
          // ignore already started
        }
      } else {
        setIsListening(false)
      }
    }

    recognitionRef.current = rec
  }, [])

  // Start / Stop listening when `enabled` changes
  useEffect(() => {
    if (!recognitionRef.current) return

    if (enabled) {
      setError(null)
      if (navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then(() => {
            try {
              recognitionRef.current.start()
              setIsListening(true)
            } catch {
              setIsListening(true)
            }
          })
          .catch((err) => {
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
              setError("⚠️ Permiso de micrófono no permitido. Permítelo en el candado 🔒 del URL.")
            }
            setIsListening(false)
          })
      }
    } else {
      try {
        recognitionRef.current.stop()
      } catch {}
      setIsListening(false)
    }
  }, [enabled])

  // Periodic Auto-Extraction loop every 8 seconds of new transcript text
  useEffect(() => {
    if (!enabled || !transcript.trim()) return

    // Debounce processing so we send text to Gemini Spark when there is new content
    const newWords = transcript.trim().length - lastProcessedLength
    if (newWords < 15 && lastProcessedLength > 0) return // Wait until there's new content

    if (processingTimerRef.current) clearTimeout(processingTimerRef.current)

    processingTimerRef.current = setTimeout(async () => {
      setIsProcessing(true)
      try {
        const res = await fetch("/api/ai/ambient-scribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript }),
        })

        const data = await res.json()
        if (data.ok && data.scribe) {
          onFieldsExtracted({
            motivoConsulta: data.scribe.motivoConsulta,
            historiaClinica: data.scribe.enfermedadActual,
            examenFisico: data.scribe.examenFisico,
            plan: data.scribe.planTratamiento,
          } as any)

          setLastProcessedLength(transcript.trim().length)
          setLastUpdatedTime(new Date())
          if (data.scribe.ruidoIgnorado?.length) {
            setNoiseSummary(data.scribe.ruidoIgnorado)
          }
        }
      } catch (err) {
        console.error("Realtime extraction error:", err)
      } finally {
        setIsProcessing(false)
      }
    }, 4000) // 4 seconds pause in speech triggers auto-fill!

    return () => {
      if (processingTimerRef.current) clearTimeout(processingTimerRef.current)
    }
  }, [transcript, enabled, lastProcessedLength])

  return {
    isListening,
    isProcessing,
    transcript,
    lastUpdatedTime,
    noiseSummary,
    error,
  }
}
