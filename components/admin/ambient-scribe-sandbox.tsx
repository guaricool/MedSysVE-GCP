"use client"

import { useState, useRef, useEffect } from "react"
import {
  Mic,
  Square,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  RefreshCw,
  FileText,
  User,
  Activity,
  Syringe,
  ShieldCheck,
  Volume2,
  Trash2,
  ArrowRight,
  Clock,
  Dog,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const MOCK_PRESETS = [
  {
    id: "PEDIA_MÉRIDA",
    title: "Caso 1: Pediátrico + Charla sobre Perro y Viaje a Mérida",
    description: "Mamá consulta por tos y fiebre en niño de 6 años, pero habla de su perro Toby y de sus vacaciones.",
    transcript: `Buenos días Doctor. Traigo a Mateo porque tiene 2 días con fiebre de 38.5°C y mucha tos perruna en las noches. Ay doctor, por cierto que viaje tan sabroso dimos a Mérida la semana pasada, llevamos hasta al perrito Toby que le encanta la nieve y corrió por todo el parque. Pero bueno, volviendo a Mateo, a él le dio neumonía a los 4 años y mi esposo es asmático desde niño. 
    
El doctor evalúa: Faringe eritematosa con placas blanquecinas en amígdalas, auscultación pulmonar con ruidos respiratorios rítmicos sin ruidos agregados, tensión arterial 100/60. 

Le voy a mandar Amoxicilina + Ácido Clavulánico suspensión de 400mg/5mL dar 5 mL cada 8 horas por 7 días, e Ibuprofeno jarabe para la fiebre si supera los 38°C.`,
  },
  {
    id: "CARDIO_BÉISBOL",
    title: "Caso 2: Adulto HTA + Hablan de Béisbol y Parrilla",
    description: "Paciente acude por cefalea occipital, pero comenta sobre el juego Caracas-Magallanes y la parrilla.",
    transcript: `Doctor vengo a consulta porque he sentido una pesadez constante en la nuca desde el lunes. Mire que ayer estuvimos viendo el juego del Caracas contra Magallanes que estuvo buenísimo y nos comimos una parrilla en familia. A mi papá le dio un accidente cerebrovascular a los 58 años y mi hermana sufre de la tiroides. A mí me operaron de la apéndice a los 20 años y soy alérgico a la Penicilina. 

El doctor mide signos vitales: Presión Arterial 155/95 mmHg, Frecuencia Cardíaca 84 lpm, ruidos cardíacos rítmicos sin soplos. 

Ajustaremos el tratamiento a Losartán Potásico 50mg cada 12 horas y solicitamos Perfil 20 completo con Electrocardiograma de 12 derivaciones.`,
  },
]

export function AmbientScribeSandbox() {
  const [transcript, setTranscript] = useState(MOCK_PRESETS[0].transcript)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [latency, setLatency] = useState<number | null>(null)
  const [result, setResult] = useState<any | null>(null)
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
        }

        recognitionRef.current = rec
      }
    }
  }, [])

  const startRecording = () => {
    setError(null)
    setTranscript("")
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setIsRecording(true)
      } catch (err) {
        console.error(err)
      }
    } else {
      setError("El reconocimiento de voz del navegador no está disponible en este dispositivo. Puedes usar las conversaciones de prueba precargadas abajo.")
      setIsRecording(true)
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

  return (
    <div className="space-y-6 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-purple-400" /> Powered by Gemini 2.0 Flash (Gemini Spark)
            </span>
            <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-full">
              Filtro de Ruido Social & Clasificación Inteligente
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            🎙️ Escriba Médico Inteligente (Ambient Clinical AI Scribe)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Escucha la conversación natural entre médico y paciente, <strong className="text-amber-300">filtra comentarios irrelevantes (mascotas, viajes, clima)</strong> y ubica cada dato clínico automáticamente en la historia SOAP sin dictar comandos.
          </p>
        </div>

        {latency !== null && (
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-right shrink-0">
            <span className="text-[10px] text-slate-400 block font-mono">LATENCIA DE GEMINI SPARK:</span>
            <span className="text-lg font-black text-cyan-400 flex items-center justify-end gap-1 font-mono">
              <Clock className="w-4 h-4 text-cyan-400" /> {latency} ms
            </span>
          </div>
        )}
      </div>

      {/* Preset Pickers */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          🧪 Opciones de Prueba Rápida Pre-cargadas (1 Clic):
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          {MOCK_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setTranscript(p.transcript)
                setResult(null)
                setError(null)
              }}
              className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-all group"
            >
              <div className="font-bold text-xs text-amber-300 group-hover:text-amber-200">{p.title}</div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{p.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Controls & Input Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column: Live Microphone & Transcript */}
        <div className="space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sky-400" /> Conversación Transcrita (Entrada de Voz o Texto):
            </label>
            {isRecording && (
              <span className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Grabando en vivo...
              </span>
            )}
          </div>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Habla por el micrófono o pega aquí una conversación entre médico y paciente..."
            rows={10}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none font-mono leading-relaxed"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                variant="outline"
                className="bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/60 text-xs font-semibold"
              >
                <Mic className="w-4 h-4 mr-1.5 text-rose-400" /> Activar Micrófono en Vivo
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="text-xs font-semibold animate-bounce"
              >
                <Square className="w-4 h-4 mr-1.5" /> Detener Grabación
              </Button>
            )}

            <Button
              onClick={processWithGeminiSpark}
              disabled={isProcessing || !transcript.trim()}
              className="bg-gradient-to-r from-purple-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white font-bold text-xs px-5 shadow-lg"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Procesando con Gemini Spark...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Clasificar & Filtrar con Gemini Spark
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* Right Column: Structured Medical Card Result */}
        <div className="space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Clasificación Automática de Historia Médica (SOAP):
            </label>
          </div>

          {!result ? (
            <div className="bg-slate-950 border border-dashed border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3 h-full min-h-[300px]">
              <Sparkles className="w-10 h-10 text-purple-400/50 animate-pulse" />
              <p className="text-xs text-slate-400 max-w-sm">
                Haz clic en <strong className="text-white">"Clasificar & Filtrar con Gemini Spark"</strong> para ver cómo la IA separa automáticamente los antecedentes, síntomas y examen físico descartando el ruido social.
              </p>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4 max-h-[460px] overflow-y-auto">
              {/* Noise Filter Box */}
              {result.ruidoIgnorado?.length > 0 && (
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-3 text-xs space-y-1">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <Dog className="w-4 h-4 text-amber-400" /> Ruido Social Ignorado por la IA:
                  </div>
                  <ul className="list-disc list-inside text-slate-300 text-[11px] space-y-0.5 pl-1">
                    {result.ruidoIgnorado.map((r: string, idx: number) => (
                      <li key={idx} className="italic text-amber-200/90">{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Categorized Fields */}
              <div className="space-y-3 text-xs">
                {result.motivoConsulta && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block mb-1">
                      1. Motivo de Consulta (Subjetivo):
                    </span>
                    <p className="text-slate-100 leading-relaxed">{result.motivoConsulta}</p>
                  </div>
                )}

                {result.enfermedadActual && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                      2. Anamnesis / Enfermedad Actual:
                    </span>
                    <p className="text-slate-200 leading-relaxed">{result.enfermedadActual}</p>
                  </div>
                )}

                {(result.antecedentesPersonales || result.antecedentesFamiliares) && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-2">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                      3. Antecedentes Médicos (Clasificados Automáticamente):
                    </span>
                    {result.antecedentesPersonales && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 block">· Personales / Quirúrgicos / Alergias:</span>
                        <p className="text-slate-200 pl-2">{result.antecedentesPersonales}</p>
                      </div>
                    )}
                    {result.antecedentesFamiliares && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 block">· Antecedentes Heredofamiliares:</span>
                        <p className="text-slate-200 pl-2">{result.antecedentesFamiliares}</p>
                      </div>
                    )}
                  </div>
                )}

                {result.examenFisico && (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                      4. Examen Físico (Objetivo):
                    </span>
                    <p className="text-slate-200 leading-relaxed">{result.examenFisico}</p>
                  </div>
                )}

                {(result.impresionesDiagnosticas?.length > 0 || result.planTratamiento) && (
                  <div className="bg-slate-900/90 border border-pink-500/30 rounded-lg p-3 space-y-2">
                    <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider block">
                      5. Diagnóstico & Plan de Tratamiento (Receta):
                    </span>
                    {result.impresionesDiagnosticas?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 my-1">
                        {result.impresionesDiagnosticas.map((diag: string, i: number) => (
                          <span key={i} className="bg-pink-500/10 border border-pink-500/30 text-pink-300 px-2 py-0.5 rounded text-[11px] font-semibold">
                            {diag}
                          </span>
                        ))}
                      </div>
                    )}
                    {result.planTratamiento && (
                      <p className="text-slate-100 leading-relaxed whitespace-pre-line">{result.planTratamiento}</p>
                    )}
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
