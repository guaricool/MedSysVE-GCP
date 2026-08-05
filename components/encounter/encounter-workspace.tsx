"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc-client"
import { VitalsForm } from "./vitals-form"
import { DiagnosisSearch } from "./diagnosis-search"
import { ReposoForm } from "./reposo-form"
import { LabOrderForm } from "./lab-order-form"
import { ImagingOrderForm } from "./imaging-order-form"
import { AddendumForm } from "./addendum-form"
import { SignBar } from "./sign-bar"
import { LabOcrUploader } from "./lab-ocr-uploader"
import { ReferidoForm } from "./referido-form"
import { HistoriaClinicaForm } from "./historia-clinica-form"
import { PlanTratamientoForm } from "./plan-tratamiento-form"
import { RecetaForm } from "./receta-form"
import { ManualLabResultsForm } from "./manual-lab-results-form"
import { ExamenFisicoForm } from "./examen-fisico-form"
import { AiAssistPanel } from "./ai-assist-panel"
import { TemplateSelector } from "./template-selector"
import { WorkspaceTimer } from "./workspace-timer"
import { QuickActionsBar } from "./quick-actions-bar"
import { ExpressModeBanner } from "./express-mode-banner"
import { AmbientScribeModal } from "./ambient-scribe-modal"
import { useRealtimeScribe } from "./use-realtime-scribe"
import { VoiceAddonUpsellModal } from "./voice-addon-upsell-modal"
import { Mic, Sparkles, Radio, Activity, CheckCircle2, RefreshCw, Zap, Lock, Stethoscope } from "lucide-react"
import { EscalasTrauma } from "./escalas-trauma"
import { ObstetriciaForm } from "./obstetricia-form"
import { OncologiaForm } from "./oncologia-form"
import { CardiologiaForm } from "./cardiologia-form"
import { NeumonologiaForm } from "./neumonologia-form"
import { PediatriaForm } from "./pediatria-form"
import { GastroenterologiaForm } from "./gastroenterologia-form"
import { NeurologiaForm } from "./neurologia-form"
import { UrologiaForm } from "./urologia-form"
import { AnestesiologiaForm } from "./anestesiologia-form"
import { DermatologiaForm } from "./dermatologia-form"
import { EndocrinologiaForm } from "./endocrinologia-form"
import { CirugiaGeneralForm } from "./cirugia-general-form"
import { MedicinaInternaForm } from "./medicina-interna-form"
import { TraumatologiaForm } from "./traumatologia-form"
import { PsiquiatriaForm } from "./psiquiatria-form"
import { InfectologiaForm } from "./infectologia-form"
import { OtorrinolaringologiaForm } from "./otorrinolaringologia-form"
import { OftalmologiaForm } from "./oftalmologia-form"
import { ReumatologiaForm } from "./reumatologia-form"
import { NefrologiaForm } from "./nefrologia-form"
import { EmergenciasForm } from "./emergencias-form"
import { GeriatriaForm } from "./geriatria-form"
import { MedicinaFamiliarForm } from "./medicina-familiar-form"
import { CirugiaPlasticaForm } from "./cirugia-plastica-form"
import { HematologiaForm } from "./hematologia-form"
import { AlergologiaForm } from "./alergologia-form"
import { FisiatriaForm } from "./fisiatria-form"
import { CirugiaCardiovascularForm } from "./cirugia-cardiovascular-form"
import { EncounterAllergiesModal } from "./encounter-allergies-modal"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import type { Vitales } from "@/lib/clinical/vitals-alerts"

interface Props {
  encounterId: string
  patientRegId: string
  initialStatus: "DRAFT" | "SIGNED" | "AMENDED"
  initialVitales?: Vitales
  initialMotivo?: string
  initialHistoriaClinica?: string
  initialExamenFisico?: string
  initialPlan?: string
  initialRecomendaciones?: string
  patientNombre: string
  patientEdad: number
  patientAlergias: { sustancia: string; gravedad: string; reaccion?: string | null }[]
  patientCronicos: string[]
  overrideSpecialty?: string
}

type SectionId =
  | "templates"
  | "subjetivo"
  | "objetivo"
  | "examen"
  | "analisis"
  | "plan"
  | "receta"
  | "lab-order"
  | "lab-results"
  | "imaging"
  | "reposo"
  | "referido"
  | "addendum"
  | "ai"
  | "escalas"
  | "obstetricia"
  | "oncologia"
  | "cardiologia"
  | "cirugia-cardiovascular"
  | "neumonologia"
  | "pediatria"
  | "gastroenterologia"
  | "neurologia"
  | "urologia"
  | "anestesiologia"
  | "dermatologia"
  | "endocrinologia"
  | "cirugia-general"
  | "medicina-interna"
  | "traumatologia"
  | "psiquiatria"
  | "infectologia"
  | "otorrinolaringologia"
  | "oftalmologia"
  | "reumatologia"
  | "nefrologia"
  | "emergencias"
  | "geriatria"
  | "medicina-familiar"
  | "cirugia-plastica"
  | "hematologia"
  | "alergologia"
  | "fisiatria"

const SECTIONS: { id: SectionId; key: "S" | "O" | "A" | "P" | "R" | "L" | "I" | "M" | "T" | "E"; label: string; icon: string; shortcut: string }[] = [
  { id: "subjetivo", key: "S", label: "Subjetivo", icon: "💬", shortcut: "1" },
  { id: "objetivo", key: "O", label: "Signos Vitales", icon: "❤️", shortcut: "2" },
  { id: "examen", key: "O", label: "Examen Físico", icon: "🩺", shortcut: "3" },
  { id: "analisis", key: "A", label: "Diagnóstico", icon: "🧠", shortcut: "4" },
  { id: "plan", key: "P", label: "Plan", icon: "📋", shortcut: "5" },
  { id: "receta", key: "R", label: "Receta", icon: "💊", shortcut: "6" },
  { id: "lab-order", key: "L", label: "Labs", icon: "🧪", shortcut: "7" },
  { id: "imaging", key: "I", label: "Imagen", icon: "🩻", shortcut: "8" },
]

/**
 * Encounter Workspace — el corazón de la experiencia del doctor.
 *
 * Filosofía: cada segundo cuenta. Diseño orientado a:
 *   1. Minimizar typing (sliders, selects, chips, autocompletar agresivo)
 *   2. Minimizar navegación (todo visible, sin tabs ocultos)
 *   3. Eliminar carga cognitiva (defaults sensatos, presets, AI suggestions)
 *   4. Información del paciente siempre visible (alergias, crónicos, edad)
 *   5. Atajos de teclado para que las manos nunca salgan del teclado
 *   6. Express mode: copia de la última consulta en 1 click
 *   7. Timer de consulta para awareness
 *   8. Progreso visual (SOAP completado %)
 */
export function EncounterWorkspace({
  encounterId,
  patientRegId,
  initialStatus,
  initialVitales,
  initialMotivo,
  initialHistoriaClinica,
  initialExamenFisico,
  initialPlan,
  initialRecomendaciones,
  patientNombre,
  patientEdad,
  patientAlergias,
  patientCronicos,
  overrideSpecialty,
}: Props) {
  const router = useRouter()
  const locked = initialStatus !== "DRAFT"
  const [activeSection, setActiveSection] = useState<SectionId>("subjetivo")
  const { data: doctor } = (trpc.doctor.myProfile.useQuery as any)()
  const { data: doctorSpecs } = (trpc.doctor.getSpecialties.useQuery as any)()
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null)
  const [allergiesModalOpen, setAllergiesModalOpen] = useState(false)

  const allSpecialties = useMemo(() => {
    if (!doctorSpecs) return []
    const list = [doctorSpecs.especialidadPrincipal, ...(doctorSpecs.subEspecialidades || [])].filter(Boolean)
    return Array.from(new Set(list))
  }, [doctorSpecs])

  const especialidad = overrideSpecialty !== undefined
    ? overrideSpecialty
    : selectedSpecialty || doctorSpecs?.especialidadPrincipal || doctor?.especialidadPrincipal
  // Sections start open by id (subjetivo is the entry point). User toggles
  // and shortcuts add/remove from this set.
  const [openSections, setOpenSections] = useState<Set<SectionId>>(
    () => new Set<SectionId>(["subjetivo"]),
  )

const ALL_SPECIALTY_SECTIONS: SectionId[] = [
  "escalas",
  "obstetricia",
  "oncologia",
  "cardiologia",
  "cirugia-cardiovascular",
  "neumonologia",
  "pediatria",
  "gastroenterologia",
  "neurologia",
  "urologia",
  "anestesiologia",
  "dermatologia",
  "endocrinologia",
  "cirugia-general",
  "medicina-interna",
  "traumatologia",
  "psiquiatria",
  "infectologia",
  "otorrinolaringologia",
  "oftalmologia",
  "reumatologia",
  "nefrologia",
  "emergencias",
  "geriatria",
  "medicina-familiar",
  "cirugia-plastica",
  "hematologia",
  "alergologia",
  "fisiatria",
]

function getSectionForSpecialty(especialidad: string): SectionId | null {
  if (!especialidad) return null
  const norm = especialidad.trim().toLowerCase()

  if (norm.includes("traumat") || norm.includes("ortoped")) return "traumatologia"
  if (norm.includes("obstet") || norm.includes("ginecolog")) return "obstetricia"
  if (norm.includes("oncol")) return "oncologia"
  if (norm.includes("cardiovascular")) return "cirugia-cardiovascular"
  if (norm.includes("cardiol")) return "cardiologia"
  if (norm.includes("neumonol") || norm.includes("neumol")) return "neumonologia"
  if (norm.includes("pediatr") || norm.includes("puericultura")) return "pediatria"
  if (norm.includes("gastro")) return "gastroenterologia"
  if (norm.includes("neurol")) return "neurologia"
  if (norm.includes("urol")) return "urologia"
  if (norm.includes("anestes")) return "anestesiologia"
  if (norm.includes("dermat")) return "dermatologia"
  if (norm.includes("endocrin")) return "endocrinologia"
  if (norm.includes("cirugía general") || norm.includes("cirugia general")) return "cirugia-general"
  if (norm.includes("medicina interna")) return "medicina-interna"
  if (norm.includes("psiquiatr")) return "psiquiatria"
  if (norm.includes("infecto")) return "infectologia"
  if (norm.includes("otorrino") || norm.includes("orl")) return "otorrinolaringologia"
  if (norm.includes("oftalm")) return "oftalmologia"
  if (norm.includes("reumat")) return "reumatologia"
  if (norm.includes("nefrol")) return "nefrologia"
  if (norm.includes("emergenc") || norm.includes("urgenc")) return "emergencias"
  if (norm.includes("geriatr")) return "geriatria"
  if (norm.includes("familiar")) return "medicina-familiar"
  if (norm.includes("plástic") || norm.includes("plastica")) return "cirugia-plastica"
  if (norm.includes("hematol")) return "hematologia"
  if (norm.includes("alerg")) return "alergologia"
  if (norm.includes("fisiatr") || norm.includes("rehabilitac")) return "fisiatria"

  return null
}

  // Visible sections in the dynamic canvas (only these are rendered)
  const [visibleSections, setVisibleSections] = useState<Set<SectionId>>(
    () => new Set<SectionId>(["templates", "subjetivo"]),
  )

  // Auto-enable specialty section in canvas & atomically clear previous specialty sections when specialty changes
  useEffect(() => {
    const newSecId = getSectionForSpecialty(especialidad || "")

    setVisibleSections((prev) => {
      const next = new Set(prev)
      ALL_SPECIALTY_SECTIONS.forEach((s) => next.delete(s))
      if (newSecId) {
        next.add(newSecId)
        if (newSecId === "traumatologia") next.add("escalas")
      }
      return next
    })

    setOpenSections((prev) => {
      const next = new Set(prev)
      ALL_SPECIALTY_SECTIONS.forEach((s) => next.delete(s))
      if (newSecId) {
        next.add(newSecId)
        if (newSecId === "traumatologia") next.add("escalas")
      }
      return next
    })
  }, [especialidad])

  // Protect against accidental navigation/tab close
  useEffect(() => {
    if (locked) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = "Es posible que los cambios no guardados se pierdan."
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [locked])
  
  // ─── Progreso de la consulta ───
  const { data: enc }: { data: any } = (trpc.encounter.get.useQuery as any)(
    { id: encounterId },
  )

  // Fetch doctor's default report preferences
  const utils = trpc.useUtils()
  const { data: prefs } = (trpc.reportPreferences.get.useQuery as any)(undefined)
  const updateReportOverride = (trpc.encounter.updateReportOverride.useMutation as any)()
  const updateEncounter = (trpc.encounter.update.useMutation as any)({
    onSuccess: () => {
      utils.encounter.get.invalidate({ id: encounterId })
    },
  })

  // Per-consulta selection of which SOAP sections the doctor wants in
  // the generated INFORME.
  const [reportSectionSelections, setReportSectionSelections] = useState<Set<SectionId>>(
    () => new Set<SectionId>(["subjetivo", "objetivo", "examen", "analisis", "plan", "receta", "lab-order", "imaging"]),
  )

  // Initialize selections from DB (either specific override or doctor's defaults)
  useEffect(() => {
    if (!enc) return
    if (enc.reportOverride) {
      setReportSectionSelections(new Set(enc.reportOverride as SectionId[]))
    } else if (prefs?.secciones) {
      const secs = new Set<SectionId>()
      const p = prefs.secciones
      if (p.motivoConsulta || p.historiaClinica) secs.add("subjetivo")
      if (p.signosVitales) secs.add("objetivo")
      if (p.examenFisico) secs.add("examen")
      if (p.diagnosticos) secs.add("analisis")
      if (p.planTratamiento) secs.add("plan")
      if (p.tratamientoIndicado) secs.add("receta")
      if (p.ordenesLaboratorio) secs.add("lab-order")
      if (p.ordenesImagenes) secs.add("imaging")
      setReportSectionSelections(secs)
    }
  }, [enc?.reportOverride, prefs?.secciones])

  function toggleReportSection(id: SectionId) {
    if (locked) return
    setReportSectionSelections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)

      // Save to database
      updateReportOverride.mutate({
        id: encounterId,
        reportOverride: Array.from(next),
      })

      return next
    })
  }
  const [ocrData, setOcrData] = useState<any>(null)
  const [showExpress, setShowExpress] = useState(false)
  const [showScribeModal, setShowScribeModal] = useState(false)
  const [showUpsellModal, setShowUpsellModal] = useState(false)
  const [isRealtimeScribeEnabled, setIsRealtimeScribeEnabled] = useState(false)

  const { data: hasAddon } = (trpc.doctor.hasVoiceScribeAddon.useQuery as any)()

  const realtimeScribe = useRealtimeScribe({
    enabled: isRealtimeScribeEnabled && !locked && Boolean(hasAddon),
    onFieldsExtracted: (fields) => {
      handleApplyFromScribe(fields)
    },
  })

  function handleApplyFromScribe(fields: {
    motivo?: string
    historiaClinica?: string
    examenFisico?: string
    plan?: string
  }) {
    if (locked) return

    const updatedMotivo = fields.motivo || liveMotivo
    const updatedHistoria = fields.historiaClinica
      ? `${liveHistoriaClinica ? liveHistoriaClinica + "\n\n" : ""}${fields.historiaClinica}`
      : liveHistoriaClinica
    const updatedExamen = fields.examenFisico
      ? `${liveExamenFisico ? liveExamenFisico + "\n\n" : ""}${fields.examenFisico}`
      : liveExamenFisico
    const updatedPlan = fields.plan
      ? `${livePlan ? livePlan + "\n\n" : ""}${fields.plan}`
      : livePlan

    updateEncounter.mutate({
      id: encounterId,
      motivo: updatedMotivo,
      historiaClinica: updatedHistoria,
      examenFisico: updatedExamen,
      plan: updatedPlan,
    })

    setVisibleSections((prev) => {
      const next = new Set(prev)
      next.add("subjetivo")
      next.add("examen")
      next.add("plan")
      return next
    })
    setOpenSections((prev) => {
      const next = new Set(prev)
      next.add("subjetivo")
      next.add("examen")
      next.add("plan")
      return next
    })
  }

  const availableSections = useMemo(() => {
    const core: { id: SectionId; label: string; icon: string }[] = [
      { id: "subjetivo", label: "Motivo / Historia", icon: "💬" },
      { id: "objetivo", label: "Signos Vitales", icon: "❤️" },
      { id: "examen", label: "Examen Físico", icon: "🩺" },
      { id: "analisis", label: "Diagnósticos", icon: "🧠" },
      { id: "plan", label: "Plan", icon: "📋" },
      { id: "receta", label: "Receta", icon: "💊" },
      { id: "lab-order", label: "Órdenes de Labs", icon: "🧪" },
      { id: "lab-results", label: "Resultados Labs", icon: "📊" },
      { id: "imaging", label: "Imágenes", icon: "🩻" },
      { id: "reposo", label: "Reposos", icon: "🛌" },
      { id: "referido", label: "Referidos", icon: "↗️" },
      { id: "ai", label: "Asistente IA", icon: "✨" },
    ];

    if (initialStatus !== "DRAFT") {
      core.push({ id: "addendum", label: "Adenda", icon: "📝" })
    }

    if (especialidad === "Traumatología" || especialidad === "Ortopedia" || especialidad === "Traumatología y Ortopedia") {
      core.push({ id: "traumatologia", label: "Traumatología y Ortopedia", icon: "🦴" })
      core.push({ id: "escalas", label: "Escalas SVCOT", icon: "📊" })
    }
    else if (especialidad === "Ginecología y Obstetricia" || especialidad === "Obstetricia y Ginecología" || especialidad === "Obstetricia") core.push({ id: "obstetricia", label: "Obstetricia", icon: "🤰" })
    else if (especialidad === "Oncología" || especialidad === "Oncología Médica") core.push({ id: "oncologia", label: "Oncología", icon: "🎗️" })
    else if (especialidad === "Cirugía Cardiovascular") core.push({ id: "cirugia-cardiovascular", label: "Cirugía Cardiovascular", icon: "🫀" })
    else if (especialidad === "Cardiología") core.push({ id: "cardiologia", label: "Cardiología", icon: "❤️" })
    else if (especialidad === "Neumología" || especialidad === "Neumonología") core.push({ id: "neumonologia", label: "Neumonología", icon: "🫁" })
    else if (especialidad === "Pediatría" || especialidad === "Pediatría y Puericultura") core.push({ id: "pediatria", label: "Pediatría", icon: "👶" })
    else if (especialidad === "Gastroenterología") core.push({ id: "gastroenterologia", label: "Gastroenterología", icon: "🟢" })
    else if (especialidad === "Neurología") core.push({ id: "neurologia", label: "Neurología", icon: "🧠" })
    else if (especialidad === "Urología") core.push({ id: "urologia", label: "Urología", icon: "🔹" })
    else if (especialidad === "Anestesiología") core.push({ id: "anestesiologia", label: "Anestesiología", icon: "🛡️" })
    else if (especialidad === "Dermatología") core.push({ id: "dermatologia", label: "Dermatología", icon: "🖌️" })
    else if (especialidad === "Endocrinología") core.push({ id: "endocrinologia", label: "Endocrinología", icon: "🔥" })
    else if (especialidad === "Cirugía General") core.push({ id: "cirugia-general", label: "Cirugía General", icon: "✂️" })
    else if (especialidad === "Medicina Interna") core.push({ id: "medicina-interna", label: "Medicina Interna", icon: "🛡️" })
    else if (especialidad === "Psiquiatría" || especialidad === "Psiquiatría y Salud Mental") core.push({ id: "psiquiatria", label: "Psiquiatría", icon: "🧠" })
    else if (especialidad === "Infectología") core.push({ id: "infectologia", label: "Infectología", icon: "🦠" })
    else if (especialidad === "Otorrinolaringología" || especialidad === "ORL" || especialidad === "Otorrino") core.push({ id: "otorrinolaringologia", label: "Otorrinolaringología", icon: "👂" })
    else if (especialidad === "Medicina de Emergencia" || especialidad === "Medicina de Emergencia y Urgencias" || especialidad === "Medicina de Emergencia / Urgencias" || especialidad === "Emergencias") core.push({ id: "emergencias", label: "Emergencias", icon: "🚨" })
    else if (especialidad === "Cirugía Plástica" || especialidad === "Cirugía Plástica y Reconstructiva") core.push({ id: "cirugia-plastica", label: "Cirugía Plástica", icon: "✨" })
    else if (especialidad === "Alergología" || especialidad === "Inmunología" || especialidad === "Alergología e Inmunología") core.push({ id: "alergologia", label: "Alergología e Inmunología", icon: "🌿" })
    else if (especialidad === "Fisiatría" || especialidad === "Medicina Física y Rehabilitación" || especialidad === "Medicina Física y Rehabilitación (Fisiatría)") core.push({ id: "fisiatria", label: "Fisiatría", icon: "🏋️" })
    
    return core;
  }, [especialidad, initialStatus])

  function toggleVisibleSection(id: SectionId) {
    setVisibleSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      // also ensure it is "open" when made visible
      if (!next.has(id)) {
        setOpenSections(o => { const oNext = new Set(o); oNext.delete(id); return oNext })
      } else {
        setOpenSections(o => { const oNext = new Set(o); oNext.add(id); return oNext })
      }
      return next
    })
  }

  function handleApplyTemplate(t: any) {
    setVisibleSections((prev) => {
      const next = new Set(prev)
      if (t.motivo || t.historiaClinica) { next.add("subjetivo"); setOpenSections(o => { const oNext = new Set(o); oNext.add("subjetivo"); return oNext }) }
      if (t.plan) { next.add("plan"); setOpenSections(o => { const oNext = new Set(o); oNext.add("plan"); return oNext }) }
      if (t.examenFisico) { next.add("examen"); setOpenSections(o => { const oNext = new Set(o); oNext.add("examen"); return oNext }) }
      if (t.datosEspecialidad && especialidad) {
        // Add the specialty module
        const specSection = availableSections.find(s => !["subjetivo", "examen", "plan", "receta", "lab-order", "imaging", "reposo", "referido", "ai", "addendum", "lab-results", "objetivo", "escalas"].includes(s.id))
        if (specSection) {
          next.add(specSection.id)
          setOpenSections(o => { const oNext = new Set(o); oNext.add(specSection.id); return oNext })
        }
      }
      return next
    })
  }

  function toggleSection(id: SectionId, forceOpen?: boolean) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (forceOpen === undefined) {
        if (next.has(id)) next.delete(id)
        else next.add(id)
      } else {
        if (forceOpen) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  function jumpToSection(id: SectionId) {
    setActiveSection(id)
    toggleSection(id, true)
    setTimeout(() => {
      document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 50)
  }


  const completed = useMemo(() => {
    const c = {
      subjetivo: !!enc?.motivo || !!enc?.historiaClinica,
      objetivo: !!enc?.vitales,
      examen: !!enc?.examenFisico,
      analisis: (enc as any)?.diagnoses?.length > 0,
      plan: !!enc?.plan,
      receta: (enc as any)?.prescriptions?.[0]?.items?.length > 0,
      "lab-order": (enc as any)?.labOrders?.length > 0,
      imaging: (enc as any)?.imagingOrders?.length > 0,
    }
    const total = Object.values(c).filter(Boolean).length
    return { sections: c, total, percent: Math.round((total / 8) * 100) }
  }, [enc])

  // ─── Atajos de teclado ───
  useKeyboardShortcuts({
    onSave: () => {
      // Find the active form's save button
      const btn = document.querySelector('[data-shortcut="save"]') as HTMLButtonElement
      btn?.click()
    },
    onSign: () => {
      // Sign button
      const btn = document.querySelector('[data-shortcut="sign"]') as HTMLButtonElement
      btn?.click()
    },
    onJumpTo: (n) => {
      const section = SECTIONS.find((s) => s.shortcut === String(n))
      if (section) {
        jumpToSection(section.id)
      }
    },
    onEscape: () => {
      setShowExpress(false)
    },
  })

  const liveMotivo = enc?.motivo ?? initialMotivo
  const liveHistoriaClinica = enc?.historiaClinica ?? initialHistoriaClinica
  const liveExamenFisico = enc ? (typeof enc.examenFisico === "string" ? enc.examenFisico : enc.examenFisico ? String(enc.examenFisico) : "") : initialExamenFisico

  const { livePlan, liveRecomendaciones } = useMemo(() => {
    if (!enc) return { livePlan: initialPlan, liveRecomendaciones: initialRecomendaciones }
    const marker = "--- Recomendaciones ---"
    const pStr = enc.plan || ""
    const idx = pStr.indexOf(marker)
    if (idx < 0) return { livePlan: pStr, liveRecomendaciones: "" }
    return {
      livePlan: pStr.slice(0, idx).trimEnd(),
      liveRecomendaciones: pStr.slice(idx + marker.length).trim(),
    }
  }, [enc?.plan, initialPlan, initialRecomendaciones])

  return (
    <div className="pb-32">
      {/* ─── Sticky top bar: timer + progreso + paciente ─── */}
      <div className="sticky top-14 lg:top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur max-w-full overflow-x-hidden">
        <div className="mx-auto flex max-w-[1400px] flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 px-3 sm:px-4 py-2">
          {/* Patient context (always visible) */}
          <div className="flex items-center justify-between min-w-0 w-full md:w-auto">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white">
                {patientNombre.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{patientNombre}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                  <span>{patientEdad} años</span>
                  <span>·</span>
                  {patientAlergias.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setAllergiesModalOpen(true)}
                      className="inline-flex items-center rounded bg-red-900/50 hover:bg-red-900/80 border border-red-700/60 px-1.5 py-0.5 text-[10px] font-bold text-red-300 transition-all cursor-pointer shadow-xs"
                      title="Ver y editar alergias del paciente"
                    >
                      ⚠ {patientAlergias.length} alergia{patientAlergias.length > 1 ? "s" : ""}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAllergiesModalOpen(true)}
                      className="inline-flex items-center rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 transition-all cursor-pointer"
                      title="Registrar alergia para este paciente"
                    >
                      + Alergia
                    </button>
                  )}
                  {patientCronicos.length > 0 && (
                    <span className="inline-flex items-center rounded bg-amber-900/40 px-1.5 py-0.5 text-[10px] font-medium text-amber-350">
                      {patientCronicos.length} crónico{patientCronicos.length > 1 ? "s" : ""}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Timer on mobile */}
            <div className="md:hidden shrink-0">
              <WorkspaceTimer
                startedAt={enc?.createdAt ? new Date(enc.createdAt) : new Date()}
                stopped={locked}
              />
            </div>
          </div>

          {/* Progreso SOAP (Desktop) */}
          <div className="hidden items-center gap-2 md:flex">
            {SECTIONS.map((s) => {
              const done = (completed.sections as any)[s.id]
              const inReport = reportSectionSelections.has(s.id)
              return (
                <button
                  key={s.id}
                  onClick={() => toggleReportSection(s.id)}
                  className={`flex h-9 w-9 items-center justify-center rounded-md text-xs font-bold transition-all ${
                    !inReport
                      ? activeSection === s.id
                      ? "bg-blue-600 text-white ring-2 ring-blue-300"
                      : "bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
                    : done
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-emerald-900/60 text-emerald-300 ring-1 ring-emerald-700/50"
                  }`}
                  title={
                    inReport
                      ? `${s.label} — incluido en el informe (click para excluir)`
                      : `${s.label} — excluido del informe (click para incluir)`
                  }
                >
                  {s.key}
                </button>
              )
            })}
            <div className="ml-2 flex flex-col items-end">
              <p className="text-xs font-semibold text-white">{completed.percent}%</p>
              <p className="text-[10px] text-slate-500">{completed.total}/8 secciones</p>
            </div>
          </div>

          {/* Action controls row */}
          <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto flex-wrap">
            {/* Dynamic Specialty Switcher (only rendered if doctor has >= 2 specialties) */}
            {allSpecialties.length > 1 && (
              <div className="flex items-center gap-1.5 bg-blue-950/70 border border-blue-800/80 rounded-lg px-2 py-1 shadow-sm shrink-0">
                <Stethoscope className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <select
                  value={especialidad || ""}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white text-xs rounded px-1.5 py-0.5 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[140px] truncate"
                >
                  {allSpecialties.map((esp) => (
                    <option key={esp} value={esp}>
                      {esp}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Voice AI Scribe Buttons */}
            {!locked && (
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Realtime Auto-Fill Toggle */}
                <button
                  onClick={() => {
                    if (!hasAddon) {
                      setShowUpsellModal(true)
                    } else {
                      setIsRealtimeScribeEnabled((prev) => !prev)
                    }
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all shadow-md ${
                    isRealtimeScribeEnabled
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white ring-2 ring-emerald-400 animate-pulse"
                      : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white"
                  }`}
                  title={
                    !hasAddon
                      ? "Desbloquear Escriba de Voz IA ($10/mes)"
                      : isRealtimeScribeEnabled
                      ? "Auto-llenado en tiempo real activo. Haz clic para pausar."
                      : "Activar auto-llenado en tiempo real con IA mientras hablas"
                  }
                >
                  {!hasAddon ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-purple-400" />
                      <span className="truncate">⚡ Autocompletar</span>
                      <span className="bg-purple-500/20 text-purple-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-purple-500/30 ml-0.5">PRO</span>
                    </>
                  ) : (
                    <>
                      <Radio className={`w-3.5 h-3.5 ${isRealtimeScribeEnabled ? "text-emerald-300 animate-ping" : "text-slate-400"}`} />
                      <span className="truncate">
                        {isRealtimeScribeEnabled ? "🔴 IA Activo" : "⚡ Voz IA"}
                      </span>
                    </>
                  )}
                </button>

                {/* Manual Scribe Modal trigger */}
                <button
                  onClick={() => {
                    if (!hasAddon) {
                      setShowUpsellModal(true)
                    } else {
                      setShowScribeModal(true)
                    }
                  }}
                  className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-purple-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 px-2.5 py-1.5 text-xs font-bold text-white shadow-md transition-all shrink-0"
                  title="Ver panel completo del Escriba de Voz"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Panel Escriba</span>
                </button>
              </div>
            )}

            {/* Timer on Desktop */}
            <div className="hidden md:block">
              <WorkspaceTimer
                startedAt={enc?.createdAt ? new Date(enc.createdAt) : new Date()}
                stopped={locked}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Realtime AI Auto-Fill Floating Banner ─── */}
      {isRealtimeScribeEnabled && !locked && (
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-purple-950/80 border-b border-emerald-500/40 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-100 gap-2 shadow-lg backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-emerald-300 flex items-center gap-1">
              🎙️ Escriba en Tiempo Real Gemini Spark:
            </span>
            <span className="text-slate-300 italic text-[11px]">
              Escuchando consulta... los campos SOAP se están completando automáticamente en vivo.
            </span>
          </div>

          <div className="flex items-center gap-3">
            {realtimeScribe.isProcessing && (
              <span className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1 bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded-md animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" /> Extrayendo datos clínicos...
              </span>
            )}
            {realtimeScribe.lastUpdatedTime && (
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Autocompletado hace{" "}
                {realtimeScribe.lastUpdatedTime.toLocaleTimeString("es-VE")}
              </span>
            )}
            {realtimeScribe.error && (
              <span className="text-[10px] text-rose-300 font-semibold bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-md">
                {realtimeScribe.error}
              </span>
            )}
          </div>
        </div>
      )}

      <AmbientScribeModal
        isOpen={showScribeModal}
        onClose={() => setShowScribeModal(false)}
        onApplyToEncounter={handleApplyFromScribe}
      />

      <VoiceAddonUpsellModal
        isOpen={showUpsellModal}
        onClose={() => setShowUpsellModal(false)}
        onActivated={() => setIsRealtimeScribeEnabled(true)}
      />

      {/* ─── Express mode banner (one-click pre-fill from last encounter) ─── */}
      {!locked && !initialHistoriaClinica && (
        <ExpressModeBanner
          patientRegId={patientRegId}
          onApply={() => router.refresh()}
          show={showExpress}
          onShow={setShowExpress}
        />
      )}

      {/* ─── Main workspace ─── */}
      <div className="mx-auto max-w-[1400px] space-y-4 p-4">
        
        {/* Dynamic Sections Menu */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <span className="mr-2 text-xs font-semibold text-slate-400">Activar Módulos:</span>
          {availableSections.map((sec) => {
            const isActive = visibleSections.has(sec.id)
            return (
              <button
                key={sec.id}
                onClick={() => toggleVisibleSection(sec.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  isActive 
                    ? "bg-blue-600/20 border border-blue-500/50 text-blue-300 shadow-[0_0_10px_rgba(37,99,235,0.1)]" 
                    : "bg-slate-800 border border-transparent text-slate-400 hover:bg-slate-700 hover:text-slate-300"
                }`}
              >
                <span>{sec.icon}</span>
                {sec.label}
              </button>
            )
          })}
        </div>

        {!locked && visibleSections.has("templates") && (
          <Section
            id="templates"
            key="templates"
            title="Plantillas"
            icon="📋"
            collapsible
            defaultOpen={false}
          >
            <TemplateSelector encounterId={encounterId} disabled={locked} onApplyTemplate={handleApplyTemplate} />
          </Section>
        )}

        {visibleSections.has("subjetivo") && (
          <Section
            id="subjetivo"
            key="subjetivo"
            title="S — Subjetivo (motivo de consulta + historia clínica)"
            icon="💬"
            shortcut="1"
            complete={completed.sections.subjetivo}
            active={activeSection === "subjetivo"}
            collapsible
            open={openSections.has("subjetivo")}
            onToggle={() => toggleSection("subjetivo")}
          >
            <HistoriaClinicaForm
              encounterId={encounterId}
              disabled={locked}
              initialMotivo={liveMotivo}
              initialHistoriaClinica={liveHistoriaClinica}
            />
          </Section>
        )}

        {visibleSections.has("objetivo") && (
          <Section
            id="objetivo"
            key="objetivo"
            title="O — Signos Vitales"
            icon="❤️"
            shortcut="2"
            complete={completed.sections.objetivo}
            active={activeSection === "objetivo"}
            collapsible
            open={openSections.has("objetivo")}
            onToggle={() => toggleSection("objetivo")}
          >
            <VitalsForm encounterId={encounterId} disabled={locked} initialVitales={initialVitales} />
          </Section>
        )}

        {visibleSections.has("examen") && (
          <Section
            id="examen"
            key="examen"
            title="O — Examen Físico"
            icon="🩺"
            shortcut="3"
            complete={completed.sections.examen}
            active={activeSection === "examen"}
            collapsible
            open={openSections.has("examen")}
            onToggle={() => toggleSection("examen")}
          >
            <ExamenFisicoForm
              encounterId={encounterId}
              disabled={locked}
              initialExamenFisico={liveExamenFisico}
            />
          </Section>
        )}

        {visibleSections.has("analisis") && (
          <Section
            id="analisis"
            key="analisis"
            title="A — Diagnósticos (CIE-10)"
            icon="🧠"
            shortcut="4"
            complete={completed.sections.analisis}
            active={activeSection === "analisis"}
            collapsible
            open={openSections.has("analisis")}
            onToggle={() => toggleSection("analisis")}
          >
            <DiagnosisSearch encounterId={encounterId} disabled={locked} />
          </Section>
        )}

        {visibleSections.has("plan") && (
          <Section
            id="plan"
            key="plan"
            title="P — Plan de Tratamiento"
            icon="📋"
            shortcut="5"
            complete={completed.sections.plan}
            active={activeSection === "plan"}
            collapsible
            open={openSections.has("plan")}
            onToggle={() => toggleSection("plan")}
          >
            <PlanTratamientoForm
              encounterId={encounterId}
              disabled={locked}
              initialPlan={livePlan}
              initialRecomendaciones={liveRecomendaciones}
            />
          </Section>
        )}

        {visibleSections.has("escalas") && (
          <Section
            id="escalas"
            key="escalas"
            title="Escalas de Evaluación Ortopédica"
            icon="📊"
            collapsible
            open={openSections.has("escalas")}
            onToggle={() => toggleSection("escalas")}
          >
            <EscalasTrauma encounterId={encounterId} initialScales={enc?.scales || []} />
          </Section>
        )}

        {visibleSections.has("obstetricia") && (
          <Section
            id="obstetricia"
            key="obstetricia"
            title="Control Obstétrico"
            icon="🤰"
            collapsible
            open={openSections.has("obstetricia")}
            onToggle={() => toggleSection("obstetricia")}
          >
            <ObstetriciaForm
              encounterId={encounterId}
              disabled={locked}
              initialData={enc?.datosEspecialidad || {}}
            />
          </Section>
        )}

        {visibleSections.has("oncologia") && (
          <Section
            id="oncologia"
            key="oncologia"
            title="Seguimiento Oncológico"
            icon="🎗️"
            collapsible
            open={openSections.has("oncologia")}
            onToggle={() => toggleSection("oncologia")}
          >
            <OncologiaForm
              encounterId={encounterId}
              disabled={locked}
              initialData={enc?.datosEspecialidad || {}}
            />
          </Section>
        )}

        {visibleSections.has("cirugia-cardiovascular") && (
          <Section
            id="cirugia-cardiovascular"
            key="cirugia-cardiovascular"
            title="Evaluación de Cirugía Cardiovascular"
            icon="🫀"
            collapsible
            open={openSections.has("cirugia-cardiovascular")}
            onToggle={() => toggleSection("cirugia-cardiovascular")}
          >
            <CirugiaCardiovascularForm
              encounterId={encounterId}
              patientRegistrationId={enc?.patientRegistrationId || ""}
              disabled={locked}
              initialData={enc?.datosEspecialidad || {}}
            />
          </Section>
        )}

        {visibleSections.has("cardiologia") && (
          <Section
            id="cardiologia"
            key="cardiologia"
            title="Evaluación Cardiológica"
            icon="❤️"
            collapsible
            open={openSections.has("cardiologia")}
            onToggle={() => toggleSection("cardiologia")}
          >
            <CardiologiaForm
              encounterId={encounterId}
              patientRegistrationId={enc?.patientRegistrationId || ""}
              disabled={locked}
              initialData={enc?.datosEspecialidad || {}}
            />
          </Section>
        )}

        {visibleSections.has("neumonologia") && (
          <Section
            id="neumonologia"
            key="neumonologia"
            title="Evaluación Neumonológica"
            icon="🫁"
            collapsible
            open={openSections.has("neumonologia")}
            onToggle={() => toggleSection("neumonologia")}
          >
            <NeumonologiaForm
              encounterId={encounterId}
              disabled={locked}
              initialData={enc?.datosEspecialidad || {}}
            />
          </Section>
        )}

        {visibleSections.has("pediatria") && (
          <Section
            id="pediatria"
            key="pediatria"
            title="Evaluación Pediátrica"
            icon="👶"
            collapsible
            open={openSections.has("pediatria")}
            onToggle={() => toggleSection("pediatria")}
          >
            <PediatriaForm
              encounterId={encounterId}
              disabled={locked}
              initialData={enc?.datosEspecialidad || {}}
            />
          </Section>
        )}

        {visibleSections.has("gastroenterologia") && (
          <Section
            id="gastroenterologia"
            key="gastroenterologia"
            title="Evaluación Gastroenterológica"
            icon="🟢"
            collapsible
            open={openSections.has("gastroenterologia")}
            onToggle={() => toggleSection("gastroenterologia")}
          >
            <GastroenterologiaForm
              encounterId={encounterId}
              disabled={locked}
              initialData={enc?.datosEspecialidad || {}}
            />
          </Section>
        )}

        {visibleSections.has("neurologia") && (
          <Section
            id="neurologia"
            key="neurologia"
            title="Evaluación Neurológica"
            icon="🧠"
            collapsible
            open={openSections.has("neurologia")}
            onToggle={() => toggleSection("neurologia")}
          >
            <NeurologiaForm
              encounterId={encounterId}
              disabled={locked}
              initialData={enc?.datosEspecialidad || {}}
            />
          </Section>
        )}

        {visibleSections.has("urologia") && (
          <Section
            id="urologia"
            key="urologia"
            title="Evaluación Urológica"
            icon="🔹"
            collapsible
            open={openSections.has("urologia")}
            onToggle={() => toggleSection("urologia")}
          >
            <UrologiaForm
              encounterId={encounterId}
              disabled={locked}
              initialData={enc?.datosEspecialidad || {}}
            />
          </Section>
        )}

        {visibleSections.has("anestesiologia") && (
          <Section
            id="anestesiologia"
            key="anestesiologia"
            title="Valoración Anestésica"
            icon="🛡️"
            collapsible
            open={openSections.has("anestesiologia")}
            onToggle={() => toggleSection("anestesiologia")}
          >
            <AnestesiologiaForm
              encounterId={encounterId}
              disabled={locked}
              initialData={enc?.datosEspecialidad || {}}
            />
          </Section>
        )}

        {visibleSections.has("dermatologia") && (
          <Section
            id="dermatologia"
            key="dermatologia"
            title="Evaluación Dermatológica"
            icon="🖌️"
            collapsible
            open={openSections.has("dermatologia")}
            onToggle={() => toggleSection("dermatologia")}
          >
            <DermatologiaForm
              encounterId={encounterId}
              disabled={locked}
              initialData={enc?.datosEspecialidad || {}}
            />
          </Section>
        )}

        {visibleSections.has("endocrinologia") && (
          <Section
            id="endocrinologia"
            key="endocrinologia"
            title="Evaluación Endocrinológica"
            icon="🔥"
            collapsible
            open={openSections.has("endocrinologia")}
            onToggle={() => toggleSection("endocrinologia")}
          >
            <EndocrinologiaForm
              encounterId={encounterId}
              patientRegId={patientRegId}
              disabled={locked}
              initialData={enc?.datosEspecialidad || {}}
            />
          </Section>
        )}

        {visibleSections.has("cirugia-general") && (
          <Section
            id="cirugia-general"
            key="cirugia-general"
            title="Evaluación de Cirugía General"
            icon="✂️"
            collapsible
            open={openSections.has("cirugia-general")}
            onToggle={() => toggleSection("cirugia-general")}
          >
            <CirugiaGeneralForm
              encounterId={encounterId}
              disabled={locked}
              initialData={enc?.datosEspecialidad || {}}
            />
          </Section>
        )}

        {visibleSections.has("medicina-interna") && (
          <Section
            id="medicina-interna"
            key="medicina-interna"
            title="Evaluación de Medicina Interna"
            icon="🛡️"
            collapsible
            open={openSections.has("medicina-interna")}
            onToggle={() => toggleSection("medicina-interna")}
          >
            <MedicinaInternaForm
              encounterId={encounterId}
              disabled={locked}
              initialData={enc?.datosEspecialidad || {}}
            />
          </Section>
        )}

        {visibleSections.has("traumatologia") && (
          <Section
            id="traumatologia"
            key="traumatologia"
            title="Traumatología y Ortopedia"
            icon="🦴"
            collapsible
            open={openSections.has("traumatologia")}
            onToggle={() => toggleSection("traumatologia")}
          >
            <TraumatologiaForm
              encounterId={encounterId}
              disabled={locked}
              initialData={enc?.datosEspecialidad || {}}
            />
          </Section>
        )}

        {visibleSections.has("psiquiatria") && (
          <Section
            id="psiquiatria"
            key="psiquiatria"
            title="Psiquiatría y Salud Mental"
            icon="🧠"
            collapsible
            open={openSections.has("psiquiatria")}
            onToggle={() => toggleSection("psiquiatria")}
          >
            <PsiquiatriaForm
              encounterId={encounterId}
              disabled={locked}
              initialData={enc?.datosEspecialidad || {}}
            />
          </Section>
        )}

        {visibleSections.has("infectologia") && (
          <Section
            id="infectologia"
            key="infectologia"
            title="Infectología"
            icon="🦠"
            collapsible
            open={openSections.has("infectologia")}
            onToggle={() => toggleSection("infectologia")}
          >
            <InfectologiaForm
              encounterId={encounterId}
              disabled={locked}
              initialData={enc?.datosEspecialidad || {}}
            />
          </Section>
        )}

        {visibleSections.has("otorrinolaringologia") && (
          <Section
            id="otorrinolaringologia"
            key="otorrinolaringologia"
            title="Otorrinolaringología (ORL)"
            icon="👂"
            collapsible
            open={openSections.has("otorrinolaringologia")}
            onToggle={() => toggleSection("otorrinolaringologia")}
          >
            <OtorrinolaringologiaForm
              encounterId={encounterId}
              disabled={locked}
              initialData={enc?.datosEspecialidad || {}}
            />
          </Section>
        )}

        {visibleSections.has("oftalmologia") && (
          <Section id="oftalmologia" key="oftalmologia" title="Evaluación Oftalmológica" icon="👁️" collapsible open={openSections.has("oftalmologia")} onToggle={() => toggleSection("oftalmologia")}>
            <OftalmologiaForm encounterId={encounterId} disabled={locked} initialData={enc?.datosEspecialidad || {}} />
          </Section>
        )}

        {visibleSections.has("reumatologia") && (
          <Section id="reumatologia" key="reumatologia" title="Evaluación Reumatológica" icon="🦴" collapsible open={openSections.has("reumatologia")} onToggle={() => toggleSection("reumatologia")}>
            <ReumatologiaForm encounterId={encounterId} disabled={locked} initialData={enc?.datosEspecialidad || {}} />
          </Section>
        )}

        {visibleSections.has("nefrologia") && (
          <Section id="nefrologia" key="nefrologia" title="Evaluación Nefrológica" icon="🩺" collapsible open={openSections.has("nefrologia")} onToggle={() => toggleSection("nefrologia")}>
            <NefrologiaForm encounterId={encounterId} disabled={locked} initialData={enc?.datosEspecialidad || {}} />
          </Section>
        )}

        {visibleSections.has("emergencias") && (
          <Section id="emergencias" key="emergencias" title="Evaluación de Urgencias y Emergencias" icon="🚨" collapsible open={openSections.has("emergencias")} onToggle={() => toggleSection("emergencias")}>
            <EmergenciasForm encounterId={encounterId} disabled={locked} initialData={enc?.datosEspecialidad || {}} />
          </Section>
        )}

        {visibleSections.has("geriatria") && (
          <Section id="geriatria" key="geriatria" title="Valoración Geriátrica Integral (VGI)" icon="👵" collapsible open={openSections.has("geriatria")} onToggle={() => toggleSection("geriatria")}>
            <GeriatriaForm encounterId={encounterId} disabled={locked} initialData={enc?.datosEspecialidad || {}} />
          </Section>
        )}

        {visibleSections.has("medicina-familiar") && (
          <Section id="medicina-familiar" key="medicina-familiar" title="Medicina Familiar & Genograma" icon="👨‍👩‍👧" collapsible open={openSections.has("medicina-familiar")} onToggle={() => toggleSection("medicina-familiar")}>
            <MedicinaFamiliarForm encounterId={encounterId} disabled={locked} initialData={enc?.datosEspecialidad || {}} />
          </Section>
        )}

        {visibleSections.has("cirugia-plastica") && (
          <Section id="cirugia-plastica" key="cirugia-plastica" title="Cirugía Plástica y Reconstructiva" icon="🪡" collapsible open={openSections.has("cirugia-plastica")} onToggle={() => toggleSection("cirugia-plastica")}>
            <CirugiaPlasticaForm encounterId={encounterId} disabled={locked} initialData={enc?.datosEspecialidad || {}} />
          </Section>
        )}

        {visibleSections.has("hematologia") && (
          <Section id="hematologia" key="hematologia" title="Evaluación Hematológica & Transfusional" icon="🩸" collapsible open={openSections.has("hematologia")} onToggle={() => toggleSection("hematologia")}>
            <HematologiaForm encounterId={encounterId} disabled={locked} initialData={enc?.datosEspecialidad || {}} />
          </Section>
        )}

        {visibleSections.has("alergologia") && (
          <Section id="alergologia" key="alergologia" title="Alergología e Inmunología Clínica" icon="🌿" collapsible open={openSections.has("alergologia")} onToggle={() => toggleSection("alergologia")}>
            <AlergologiaForm encounterId={encounterId} disabled={locked} initialData={enc?.datosEspecialidad || {}} patientRegistrationId={patientRegId} patientRegId={patientRegId} />
          </Section>
        )}

        {visibleSections.has("fisiatria") && (
          <Section id="fisiatria" key="fisiatria" title="Medicina Física y Rehabilitación (Fisiatría)" icon="🦾" collapsible open={openSections.has("fisiatria")} onToggle={() => toggleSection("fisiatria")}>
            <FisiatriaForm encounterId={encounterId} disabled={locked} initialData={enc?.datosEspecialidad || {}} />
          </Section>
        )}

        {/* AI Assistant — always visible, no completion tracking */}
        {!locked && visibleSections.has("ai") && (
          <Section
            id="ai"
            key="ai"
            title="Asistente IA"
            icon="✨"
            collapsible
            defaultOpen={false}
          >
            <AiAssistPanel encounterId={encounterId} />
          </Section>
        )}

        {visibleSections.has("receta") && (
          <Section
            id="receta"
            key="receta"
            title="Receta Médica"
            icon="💊"
            shortcut="6"
            complete={completed.sections.receta}
            active={activeSection === "receta"}
            collapsible
            open={openSections.has("receta")}
            onToggle={() => toggleSection("receta")}
          >
            <RecetaForm encounterId={encounterId} disabled={locked} />
          </Section>
        )}

        {visibleSections.has("lab-order") && (
        <Section
          id="lab-order"
          key="lab-order"
          title="Órdenes de Laboratorio"
          icon="🧪"
          shortcut="7"
          complete={completed.sections["lab-order"]}
          active={activeSection === "lab-order"}
          collapsible
          open={openSections.has("lab-order")}
          onToggle={() => toggleSection("lab-order")}
        >
          <LabOrderForm encounterId={encounterId} disabled={locked} />
        </Section>
        )}

        {visibleSections.has("lab-results") && (
        <Section
          id="lab-results"
          key="lab-results"
          title="Resultados de Laboratorio"
          icon="📊"
          collapsible
          open={openSections.has("lab-results")}
          onToggle={() => toggleSection("lab-results")}
        >
          <div className="space-y-3">
            <ManualLabResultsForm
              patientRegistrationId={patientRegId}
              encounterId={encounterId}
              disabled={locked}
              ocrData={ocrData}
            />
            {!locked && (
              <details className="rounded-lg border border-slate-800 bg-slate-900/30 p-3">
                <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-300">
                  📷 ¿Tiene una foto del examen? Use OCR para extraer los valores automáticamente
                </summary>
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-slate-500">
                    Suba la foto y la IA estructurará los resultados automáticamente.
                  </p>
                  <LabOcrUploader onResult={(data) => setOcrData(data)} />
                </div>
              </details>
            )}
          </div>
        </Section>
        )}

        {visibleSections.has("imaging") && (
        <Section
          id="imaging"
          key="imaging"
          title="Órdenes de Imagenología"
          icon="🩻"
          shortcut="8"
          complete={completed.sections.imaging}
          active={activeSection === "imaging"}
          collapsible
          open={openSections.has("imaging")}
          onToggle={() => toggleSection("imaging")}
        >
          <ImagingOrderForm encounterId={encounterId} disabled={locked} />
        </Section>
        )}


        {visibleSections.has("reposo") && (
        <Section
          id="reposo"
          key="reposo"
          title="Reposo Médico"
          icon="🛌"
          collapsible
          open={openSections.has("reposo")}
          onToggle={() => toggleSection("reposo")}
        >
          <ReposoForm encounterId={encounterId} patientRegId={patientRegId} disabled={locked} />
        </Section>
        )}

        {visibleSections.has("referido") && (
        <Section
          id="referido"
          key="referido"
          title="Referido Médico"
          icon="↗️"
          collapsible
          open={openSections.has("referido")}
          onToggle={() => toggleSection("referido")}
        >
          <ReferidoForm
            encounterId={encounterId}
            patientRegistrationId={patientRegId}
            disabled={locked}
          />
        </Section>
        )}

        {initialStatus !== "DRAFT" && visibleSections.has("addendum") && (
          <Section
            id="addendum"
            key="addendum"
            title="Adenda"
            icon="📝"
            collapsible
            open={openSections.has("addendum")}
            onToggle={() => toggleSection("addendum")}
          >
            <AddendumForm encounterId={encounterId} patientRegId={patientRegId} />
          </Section>
        )}
      </div>

      <QuickActionsBar encounterId={encounterId} patientRegId={patientRegId} percent={completed.percent} />
      <SignBar encounterId={encounterId} patientRegId={patientRegId} status={initialStatus} />

      <EncounterAllergiesModal
        open={allergiesModalOpen}
        onOpenChange={setAllergiesModalOpen}
        patientRegistrationId={patientRegId}
        patientNombre={patientNombre}
      />
    </div>
  )
}

function Section({
  id,
  title,
  icon,
  children,
  shortcut,
  complete,
  active,
  collapsible,
  defaultOpen = false,
  open: controlledOpen,
  onToggle,
}: {
  id: string
  title: string
  icon?: string
  children: React.ReactNode
  shortcut?: string
  complete?: boolean
  active?: boolean
  collapsible?: boolean
  defaultOpen?: boolean
  /** Controlled open state from the parent workspace. */
  open?: boolean
  /** Fires when the user clicks the toggle. Parent decides what to do. */
  onToggle?: () => void
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const handleClick = () => {
    if (!collapsible) return
    if (isControlled) onToggle?.()
    else setInternalOpen(!internalOpen)
  }
  return (
    <section
      id={`section-${id}`}
      className={`rounded-xl border bg-slate-900/40 transition-colors ${
        active ? "border-blue-600/50 shadow-md shadow-blue-900/20" : "border-slate-800"
      }`}
    >
      <button
        type="button"
        onClick={handleClick}
        className={`flex w-full items-center gap-2 px-4 py-3 text-left transition-colors ${
          collapsible ? "cursor-pointer hover:bg-slate-800/40" : "cursor-default"
        }`}
      >
        {icon && <span className="text-base">{icon}</span>}
        <h2 className="flex-1 text-xs font-semibold uppercase tracking-wider text-slate-300">{title}</h2>
        {shortcut && (
          <span className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400">
            Ctrl+{shortcut}
          </span>
        )}
        {complete && (
          <span className="rounded-full bg-emerald-600/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
            ✓ Completo
          </span>
        )}
        {collapsible && (
          <span
            aria-hidden
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-700 text-lg font-light leading-none transition-all duration-200 ${
              open
                ? "rotate-45 border-blue-500 bg-blue-600 text-white"
                : "bg-slate-800/60 text-slate-400"
            }`}
          >
            +
          </span>
        )}
      </button>
      <div
        className={`grid transition-all duration-200 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </section>
  )
}