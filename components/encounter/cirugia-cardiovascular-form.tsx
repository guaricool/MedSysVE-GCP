"use client"

import { useState, useEffect } from "react"
import { trpc } from "@/lib/trpc-client"
import { useUnsaved } from "@/components/providers/unsaved-changes-provider"
import { Button } from "@/components/ui/button"
import {
  Heart,
  Activity,
  Calculator,
  Shield,
  Stethoscope,
  Pill,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  FileText,
  FileCheck
} from "lucide-react"

interface Props {
  encounterId: string
  patientRegistrationId?: string
  disabled?: boolean
  initialData?: any
}

export function CirugiaCardiovascularForm({
  encounterId,
  disabled = false,
  patientRegistrationId = "",
}: Props) {
  const [activeTab, setActiveTab] = useState<
    "RIESGO" | "ANTECEDENTES_PROTESIS" | "EXAMEN_PULSOS" | "IMAGEN_CATETERISMO" | "ANTICOAGULACION" | "PLAN_CEC_POSOP"
  >("RIESGO")
  const [saved, setSaved] = useState(false)
  const { setDirty } = useUnsaved()

  const isSandbox = encounterId === "sandbox-demo"

  // tRPC Queries & Mutations
  const { data: dbEval, refetch: refetchEval } = (trpc.cirugiaCardiovascular as any).getEval.useQuery(
    { encounterId },
    { enabled: !!encounterId }
  )
  const { data: dbPulsos, refetch: refetchPulsos } = (trpc.cirugiaCardiovascular as any).getPulsos.useQuery(
    { encounterId },
    { enabled: !!encounterId }
  )
  const { data: dbProtesisList, refetch: refetchProtesis } = (trpc.cirugiaCardiovascular as any).listProtesis.useQuery(
    { patientRegistrationId },
    { enabled: !!patientRegistrationId }
  )

  const saveEvalMut = (trpc.cirugiaCardiovascular as any).saveEval.useMutation({
    onSuccess: () => {
      refetchEval()
      setSaved(true)
      setDirty("cirugia-cardiovascular", false)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const savePulsosMut = (trpc.cirugiaCardiovascular as any).savePulsos.useMutation({
    onSuccess: () => {
      refetchPulsos()
      setSaved(true)
      setDirty("cirugia-cardiovascular", false)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const saveProtesisMut = (trpc.cirugiaCardiovascular as any).saveProtesis.useMutation({
    onSuccess: () => {
      refetchProtesis()
      setShowProtesisModal(false)
    },
  })

  const deleteProtesisMut = (trpc.cirugiaCardiovascular as any).deleteProtesis.useMutation({
    onSuccess: () => refetchProtesis(),
  })

  // ─── 1. RIESGO QUIRÚRGICO STATE ───
  const [euroScoreII, setEuroScoreII] = useState<number | "">(isSandbox ? 3.8 : "")
  const [stsScoreMortality, setStsScoreMortality] = useState<number | "">(isSandbox ? 2.4 : "")
  const [stsScoreMorbidity, setStsScoreMorbidity] = useState<number | "">(isSandbox ? 11.2 : "")
  const [nyhaClass, setNyhaClass] = useState<string>(isSandbox ? "II" : "")
  const [ccsClass, setCcsClass] = useState<string>(isSandbox ? "II" : "")
  const [frailtyScore, setFrailtyScore] = useState<number | "">(isSandbox ? 2 : "")

  // ─── 2. CATETERISMO & CORONARIOGAFÍA STATE ───
  const [dominanciaCoronaria, setDominanciaCoronaria] = useState<string>(isSandbox ? "Derecha" : "")
  const [stenosisTci, setStenosisTci] = useState<number | "">(isSandbox ? 0 : "")
  const [stenosisDa, setStenosisDa] = useState<number | "">(isSandbox ? 85 : "")
  const [stenosisCx, setStenosisCx] = useState<number | "">(isSandbox ? 70 : "")
  const [stenosisCd, setStenosisCd] = useState<number | "">(isSandbox ? 90 : "")
  const [syntaxScore, setSyntaxScore] = useState<number | "">(isSandbox ? 26 : "")

  // ─── 3. ECOCARDIOGRAMA STATE ───
  const [fevi, setFevi] = useState<number | "">(isSandbox ? 52 : "")
  const [gradienteMedioAortico, setGradienteMedioAortico] = useState<number | "">(isSandbox ? 45 : "")
  const [gradientePicoAortico, setGradientePicoAortico] = useState<number | "">(isSandbox ? 72 : "")
  const [areaValvularAortica, setAreaValvularAortica] = useState<number | "">(isSandbox ? 0.8 : "")
  const [areaValvularMitral, setAreaValvularMitral] = useState<number | "">(isSandbox ? 4.0 : "")
  const [psap, setPsap] = useState<number | "">(isSandbox ? 35 : "")
  const [derramePericardico, setDerramePericardico] = useState<string>(isSandbox ? "Ausente" : "")

  // ─── 4. ANGIOTAC AORTA STATE ───
  const [diametroAortaAscendente, setDiametroAortaAscendente] = useState<number | "">(isSandbox ? 38 : "")
  const [diametroArcoAortico, setDiametroArcoAortico] = useState<number | "">(isSandbox ? 28 : "")
  const [diametroAortaDescendente, setDiametroAortaDescendente] = useState<number | "">(isSandbox ? 26 : "")
  const [diametroAortaAbdominal, setDiametroAortaAbdominal] = useState<number | "">(isSandbox ? 20 : "")
  const [diametroIliofemoral, setDiametroIliofemoral] = useState<number | "">(isSandbox ? 8.5 : "")

  // ─── 5. EXAMEN QUIRÚRGICO & HERIDA STATE ───
  const [testAllenDerecho, setTestAllenDerecho] = useState<string>(isSandbox ? "Normal (<6s)" : "")
  const [testAllenIzquierdo, setTestAllenIzquierdo] = useState<string>(isSandbox ? "Normal (<6s)" : "")
  const [calidadSafena, setCalidadSafena] = useState<string>(isSandbox ? "Apta" : "")
  const [estabilidadEsternal, setEstabilidadEsternal] = useState<string>(isSandbox ? "Firme / Estable" : "")
  const [cicatrizEsternotomia, setCicatrizEsternotomia] = useState<string>(isSandbox ? "Sana / Cicatrizada" : "")
  const [escalaAsepsis, setEscalaAsepsis] = useState<number | "">(isSandbox ? 0 : "")

  // ─── 6. ANTICOAGULACIÓN STATE ───
  const [inrObjetivoMin, setInrObjetivoMin] = useState<number | "">(isSandbox ? 2.0 : "")
  const [inrObjetivoMax, setInrObjetivoMax] = useState<number | "">(isSandbox ? 3.0 : "")
  const [inrActual, setInrActual] = useState<number | "">(isSandbox ? 2.4 : "")
  const [esquemaAnticoagulante, setEsquemaAnticoagulante] = useState<string>(
    isSandbox ? "Warfarina 5mg OD según INR semanal" : ""
  )
  const [diasSuspensionAntiagregantes, setDiasSuspensionAntiagregantes] = useState<number | "">(isSandbox ? 5 : "")
  const [protocoloTraslapeHeparina, setProtocoloTraslapeHeparina] = useState<string>(
    isSandbox ? "Enoxaparina 60mg SC c/12h traslape preop" : ""
  )

  // ─── 7. PLAN QUIRÚRGICO & CEC STATE ───
  const [procedimientoPropuesto, setProcedimientoPropuesto] = useState<string>(
    isSandbox ? "Bypass Aortocoronario (CABG x3: LIMA-DA, Safena-Cx, Safena-CD)" : ""
  )
  const [tipoCanulacion, setTipoCanulacion] = useState<string>(isSandbox ? "Aórtica / Auricular Única" : "")
  const [tipoCardioplejia, setTipoCardioplejia] = useState<string>(isSandbox ? "Del Nido Anterógrada Fría" : "")
  const [gradoHipotermia, setGradHipotermia] = useState<string>(isSandbox ? "Moderada (32°C)" : "")
  const [planCellSaver, setPlanCellSaver] = useState<boolean>(true)

  // ─── 8. POSOPERATORIO STATE ───
  const [diaPosoperatorio, setDiaPosoperatorio] = useState<number | "">(isSandbox ? 14 : "")
  const [usoFajaEsternal, setUsoFajaEsternal] = useState<boolean>(true)
  const [complicacionesPosop, setComplicacionesPosop] = useState<string>(isSandbox ? "Sin complicaciones agudas" : "")
  const [indicacionRehabilitacionCardiaca, setIndicacionRehabilitacionCardiaca] = useState<boolean>(true)
  const [observacionesQuirurgicas, setObservacionesQuirurgicas] = useState<string>(
    isSandbox ? "Paciente evolución satisfactoria posquirúrgica" : ""
  )

  // ─── 9. PULSOS PERIFÉRICOS STATE (0-3+) ───
  const [carotideoDer, setCarotideoDer] = useState(2)
  const [carotideoIzq, setCarotideoIzq] = useState(2)
  const [subclavioDer, setSubclavioDer] = useState(2)
  const [subclavioIzq, setSubclavioIzq] = useState(2)
  const [braquialDer, setBraquialDer] = useState(2)
  const [braquialIzq, setBraquialIzq] = useState(2)
  const [radialDer, setRadialDer] = useState(2)
  const [radialIzq, setRadialIzq] = useState(2)
  const [femoralDer, setFemoralDer] = useState(2)
  const [femoralIzq, setFemoralIzq] = useState(2)
  const [popliteoDer, setPopliteoDer] = useState(2)
  const [popliteoIzq, setPopliteoIzq] = useState(2)
  const [tibialPosteriorDer, setTibialPosteriorDer] = useState(2)
  const [tibialPosteriorIzq, setTibialPosteriorIzq] = useState(2)
  const [pedioDer, setPedioDer] = useState(2)
  const [pedioIzq, setPedioIzq] = useState(2)

  // Modal Prótesis State
  const [showProtesisModal, setShowProtesisModal] = useState(false)
  const [newTipo, setNewTipo] = useState("Prótesis Valvular")
  const [newPosicion, setNewPosicion] = useState("Aórtica")
  const [newTipoMaterial, setNewTipoMaterial] = useState("Mecánica")
  const [newMarcaModelo, setNewMarcaModelo] = useState("St. Jude Medical Regent")
  const [newTamanoMm, setNewTamanoMm] = useState<number | "">(23)
  const [newSerial, setNewSerial] = useState("")
  const [newFecha, setNewFecha] = useState("")
  const [newEstado, setNewEstado] = useState("Normofuncionante")
  const [newObs, setNewObs] = useState("")

  // Load from DB
  useEffect(() => {
    if (dbEval) {
      if (dbEval.euroScoreII !== null) setEuroScoreII(dbEval.euroScoreII)
      if (dbEval.stsScoreMortality !== null) setStsScoreMortality(dbEval.stsScoreMortality)
      if (dbEval.stsScoreMorbidity !== null) setStsScoreMorbidity(dbEval.stsScoreMorbidity)
      if (dbEval.nyhaClass) setNyhaClass(dbEval.nyhaClass)
      if (dbEval.ccsClass) setCcsClass(dbEval.ccsClass)
      if (dbEval.frailtyScore !== null) setFrailtyScore(dbEval.frailtyScore)

      if (dbEval.dominanciaCoronaria) setDominanciaCoronaria(dbEval.dominanciaCoronaria)
      if (dbEval.stenosisTci !== null) setStenosisTci(dbEval.stenosisTci)
      if (dbEval.stenosisDa !== null) setStenosisDa(dbEval.stenosisDa)
      if (dbEval.stenosisCx !== null) setStenosisCx(dbEval.stenosisCx)
      if (dbEval.stenosisCd !== null) setStenosisCd(dbEval.stenosisCd)
      if (dbEval.syntaxScore !== null) setSyntaxScore(dbEval.syntaxScore)

      if (dbEval.fevi !== null) setFevi(dbEval.fevi)
      if (dbEval.gradienteMedioAortico !== null) setGradienteMedioAortico(dbEval.gradienteMedioAortico)
      if (dbEval.gradientePicoAortico !== null) setGradientePicoAortico(dbEval.gradientePicoAortico)
      if (dbEval.areaValvularAortica !== null) setAreaValvularAortica(dbEval.areaValvularAortica)
      if (dbEval.areaValvularMitral !== null) setAreaValvularMitral(dbEval.areaValvularMitral)
      if (dbEval.psap !== null) setPsap(dbEval.psap)
      if (dbEval.derramePericardico) setDerramePericardico(dbEval.derramePericardico)

      if (dbEval.diametroAortaAscendente !== null) setDiametroAortaAscendente(dbEval.diametroAortaAscendente)
      if (dbEval.diametroArcoAortico !== null) setDiametroArcoAortico(dbEval.diametroArcoAortico)
      if (dbEval.diametroAortaDescendente !== null) setDiametroAortaDescendente(dbEval.diametroAortaDescendente)
      if (dbEval.diametroAortaAbdominal !== null) setDiametroAortaAbdominal(dbEval.diametroAortaAbdominal)
      if (dbEval.diametroIliofemoral !== null) setDiametroIliofemoral(dbEval.diametroIliofemoral)

      if (dbEval.testAllenDerecho) setTestAllenDerecho(dbEval.testAllenDerecho)
      if (dbEval.testAllenIzquierdo) setTestAllenIzquierdo(dbEval.testAllenIzquierdo)
      if (dbEval.calidadSafena) setCalidadSafena(dbEval.calidadSafena)
      if (dbEval.estabilidadEsternal) setEstabilidadEsternal(dbEval.estabilidadEsternal)
      if (dbEval.cicatrizEsternotomia) setCicatrizEsternotomia(dbEval.cicatrizEsternotomia)
      if (dbEval.escalaAsepsis !== null) setEscalaAsepsis(dbEval.escalaAsepsis)

      if (dbEval.inrObjetivoMin !== null) setInrObjetivoMin(dbEval.inrObjetivoMin)
      if (dbEval.inrObjetivoMax !== null) setInrObjetivoMax(dbEval.inrObjetivoMax)
      if (dbEval.inrActual !== null) setInrActual(dbEval.inrActual)
      if (dbEval.esquemaAnticoagulante) setEsquemaAnticoagulante(dbEval.esquemaAnticoagulante)
      if (dbEval.diasSuspensionAntiagregantes !== null) setDiasSuspensionAntiagregantes(dbEval.diasSuspensionAntiagregantes)
      if (dbEval.protocoloTraslapeHeparina) setProtocoloTraslapeHeparina(dbEval.protocoloTraslapeHeparina)

      if (dbEval.procedimientoPropuesto) setProcedimientoPropuesto(dbEval.procedimientoPropuesto)
      if (dbEval.tipoCanulacion) setTipoCanulacion(dbEval.tipoCanulacion)
      if (dbEval.tipoCardioplejia) setTipoCardioplejia(dbEval.tipoCardioplejia)
      if (dbEval.gradoHipotermia) setGradHipotermia(dbEval.gradoHipotermia)
      if (dbEval.planCellSaver !== undefined) setPlanCellSaver(dbEval.planCellSaver)

      if (dbEval.diaPosoperatorio !== null) setDiaPosoperatorio(dbEval.diaPosoperatorio)
      if (dbEval.usoFajaEsternal !== undefined) setUsoFajaEsternal(dbEval.usoFajaEsternal)
      if (dbEval.complicacionesPosop) setComplicacionesPosop(dbEval.complicacionesPosop)
      if (dbEval.indicacionRehabilitacionCardiaca !== undefined) setIndicacionRehabilitacionCardiaca(dbEval.indicacionRehabilitacionCardiaca)
      if (dbEval.observacionesQuirurgicas) setObservacionesQuirurgicas(dbEval.observacionesQuirurgicas)
    }
  }, [dbEval])

  useEffect(() => {
    if (dbPulsos) {
      if (dbPulsos.carotideoDer !== null) setCarotideoDer(dbPulsos.carotideoDer)
      if (dbPulsos.carotideoIzquierdo !== null) setCarotideoIzq(dbPulsos.carotideoIzquierdo)
      if (dbPulsos.subclavioDer !== null) setSubclavioDer(dbPulsos.subclavioDer)
      if (dbPulsos.subclavioIzquierdo !== null) setSubclavioIzq(dbPulsos.subclavioIzquierdo)
      if (dbPulsos.braquialDer !== null) setBraquialDer(dbPulsos.braquialDer)
      if (dbPulsos.braquialIzquierdo !== null) setBraquialIzq(dbPulsos.braquialIzquierdo)
      if (dbPulsos.radialDer !== null) setRadialDer(dbPulsos.radialDer)
      if (dbPulsos.radialIzquierdo !== null) setRadialIzq(dbPulsos.radialIzquierdo)
      if (dbPulsos.femoralDer !== null) setFemoralDer(dbPulsos.femoralDer)
      if (dbPulsos.femoralIzquierdo !== null) setFemoralIzq(dbPulsos.femoralIzquierdo)
      if (dbPulsos.popliteoDer !== null) setPopliteoDer(dbPulsos.popliteoDer)
      if (dbPulsos.popliteoIzquierdo !== null) setPopliteoIzq(dbPulsos.popliteoIzquierdo)
      if (dbPulsos.tibialPosteriorDer !== null) setTibialPosteriorDer(dbPulsos.tibialPosteriorDer)
      if (dbPulsos.tibialPosteriorIzquierdo !== null) setTibialPosteriorIzq(dbPulsos.tibialPosteriorIzquierdo)
      if (dbPulsos.pedioDer !== null) setPedioDer(dbPulsos.pedioDer)
      if (dbPulsos.pedioIzquierdo !== null) setPedioIzq(dbPulsos.pedioIzquierdo)
    }
  }, [dbPulsos])

  const handleSaveEval = () => {
    saveEvalMut.mutate({
      encounterId,
      patientRegistrationId,
      euroScoreII: euroScoreII === "" ? null : Number(euroScoreII),
      stsScoreMortality: stsScoreMortality === "" ? null : Number(stsScoreMortality),
      stsScoreMorbidity: stsScoreMorbidity === "" ? null : Number(stsScoreMorbidity),
      nyhaClass,
      ccsClass,
      frailtyScore: frailtyScore === "" ? null : Number(frailtyScore),
      dominanciaCoronaria,
      stenosisTci: stenosisTci === "" ? null : Number(stenosisTci),
      stenosisDa: stenosisDa === "" ? null : Number(stenosisDa),
      stenosisCx: stenosisCx === "" ? null : Number(stenosisCx),
      stenosisCd: stenosisCd === "" ? null : Number(stenosisCd),
      syntaxScore: syntaxScore === "" ? null : Number(syntaxScore),
      fevi: fevi === "" ? null : Number(fevi),
      gradienteMedioAortico: gradienteMedioAortico === "" ? null : Number(gradienteMedioAortico),
      gradientePicoAortico: gradientePicoAortico === "" ? null : Number(gradientePicoAortico),
      areaValvularAortica: areaValvularAortica === "" ? null : Number(areaValvularAortica),
      areaValvularMitral: areaValvularMitral === "" ? null : Number(areaValvularMitral),
      psap: psap === "" ? null : Number(psap),
      derramePericardico,
      diametroAortaAscendente: diametroAortaAscendente === "" ? null : Number(diametroAortaAscendente),
      diametroArcoAortico: diametroArcoAortico === "" ? null : Number(diametroArcoAortico),
      diametroAortaDescendente: diametroAortaDescendente === "" ? null : Number(diametroAortaDescendente),
      diametroAortaAbdominal: diametroAortaAbdominal === "" ? null : Number(diametroAortaAbdominal),
      diametroIliofemoral: diametroIliofemoral === "" ? null : Number(diametroIliofemoral),
      testAllenDerecho,
      testAllenIzquierdo,
      calidadSafena,
      estabilidadEsternal,
      cicatrizEsternotomia,
      escalaAsepsis: escalaAsepsis === "" ? null : Number(escalaAsepsis),
      inrObjetivoMin: inrObjetivoMin === "" ? null : Number(inrObjetivoMin),
      inrObjetivoMax: inrObjetivoMax === "" ? null : Number(inrObjetivoMax),
      inrActual: inrActual === "" ? null : Number(inrActual),
      esquemaAnticoagulante,
      diasSuspensionAntiagregantes: diasSuspensionAntiagregantes === "" ? null : Number(diasSuspensionAntiagregantes),
      protocoloTraslapeHeparina,
      procedimientoPropuesto,
      tipoCanulacion,
      tipoCardioplejia,
      gradoHipotermia,
      planCellSaver,
      diaPosoperatorio: diaPosoperatorio === "" ? null : Number(diaPosoperatorio),
      usoFajaEsternal,
      complicacionesPosop,
      indicacionRehabilitacionCardiaca,
      observacionesQuirurgicas,
    })
  }

  const handleSavePulsos = () => {
    savePulsosMut.mutate({
      encounterId,
      patientRegistrationId,
      carotideoDer,
      carotideoIzquierdo: carotideoIzq,
      subclavioDer,
      subclavioIzquierdo: subclavioIzq,
      braquialDer,
      braquialIzquierdo: braquialIzq,
      radialDer,
      radialIzquierdo: radialIzq,
      femoralDer,
      femoralIzquierdo: femoralIzq,
      popliteoDer,
      popliteoIzquierdo: popliteoIzq,
      tibialPosteriorDer,
      tibialPosteriorIzquierdo: tibialPosteriorIzq,
      pedioDer,
      pedioIzquierdo: pedioIzq,
    })
  }

  const handleAddProtesis = () => {
    saveProtesisMut.mutate({
      encounterId,
      patientRegistrationId,
      tipo: newTipo,
      posicion: newPosicion,
      tipoMaterial: newTipoMaterial,
      marcaModelo: newMarcaModelo,
      tamanoMm: newTamanoMm === "" ? null : Number(newTamanoMm),
      numeroSerieLote: newSerial || null,
      fechaImplante: newFecha || null,
      estadoProtesis: newEstado,
      observaciones: newObs || null,
    })
  }

  const getPulseBadgeClass = (val: number) => {
    if (val === 0) return "bg-red-500/20 text-red-400 border-red-500/40"
    if (val === 1) return "bg-amber-500/20 text-amber-400 border-amber-500/40"
    if (val === 2) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
    return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
  }

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Cirugía Cardiovascular & Aórtica
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Especialidad Quirúrgica
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Estratificación EuroSCORE II/STS, prótesis valvulares, pulsos periféricos, CEC y seguimiento posquirúrgico.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> Guardado correctamente
            </span>
          )}
          <Button
            size="sm"
            onClick={() => {
              handleSaveEval()
              handleSavePulsos()
            }}
            disabled={disabled || saveEvalMut.isLoading || savePulsosMut.isLoading}
            className="bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-md shadow-rose-950/40"
          >
            Guardar Evaluación Quirúrgica
          </Button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-1 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800 text-xs">
        {[
          { id: "RIESGO", label: "📋 Riesgo & Escalas", icon: Calculator },
          { id: "ANTECEDENTES_PROTESIS", label: "🫀 Prótesis & Implantes", icon: Shield },
          { id: "EXAMEN_PULSOS", label: "🩺 Pulsos & Esternotomía", icon: Stethoscope },
          { id: "IMAGEN_CATETERISMO", label: "📊 Cateterismo & Eco", icon: Activity },
          { id: "ANTICOAGULACION", label: "💊 Anticoagulación & INR", icon: Pill },
          { id: "PLAN_CEC_POSOP", label: "🛠️ Plan Quirúrgico & CEC", icon: Layers },
        ].map((t) => {
          const Icon = t.icon
          const active = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all ${
                active
                  ? "bg-rose-600/20 text-rose-300 border border-rose-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* TAB 1: RIESGO QUIRÚRGICO */}
      {activeTab === "RIESGO" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <label className="text-xs font-semibold text-rose-400 uppercase tracking-wider block">
                EuroSCORE II (%)
              </label>
              <input
                type="number"
                step="0.1"
                disabled={disabled}
                value={euroScoreII}
                onChange={(e) => {
                  setEuroScoreII(e.target.value === "" ? "" : Number(e.target.value))
                  setDirty("cirugia-cardiovascular", true)
                }}
                placeholder="Ej: 3.8"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-rose-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400">
                Mortalidad estimada post-cirugía cardíaca (0-100%).
              </p>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <label className="text-xs font-semibold text-rose-400 uppercase tracking-wider block">
                STS Score Mortalidad (%)
              </label>
              <input
                type="number"
                step="0.1"
                disabled={disabled}
                value={stsScoreMortality}
                onChange={(e) => {
                  setStsScoreMortality(e.target.value === "" ? "" : Number(e.target.value))
                  setDirty("cirugia-cardiovascular", true)
                }}
                placeholder="Ej: 2.4"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-rose-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400">Society of Thoracic Surgeons PROM.</p>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <label className="text-xs font-semibold text-rose-400 uppercase tracking-wider block">
                STS Score Morbilidad (%)
              </label>
              <input
                type="number"
                step="0.1"
                disabled={disabled}
                value={stsScoreMorbidity}
                onChange={(e) => {
                  setStsScoreMorbidity(e.target.value === "" ? "" : Number(e.target.value))
                  setDirty("cirugia-cardiovascular", true)
                }}
                placeholder="Ej: 11.2"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-rose-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400">Complicaciones mayores combinadas.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-medium text-slate-300">Clase Funcional NYHA</label>
              <select
                disabled={disabled}
                value={nyhaClass}
                onChange={(e) => {
                  setNyhaClass(e.target.value)
                  setDirty("cirugia-cardiovascular", true)
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-rose-500 focus:outline-none"
              >
                <option value="">Seleccionar...</option>
                <option value="I">NYHA I (Sin limitación física)</option>
                <option value="II">NYHA II (Limitación leve en actividad ordinaria)</option>
                <option value="III">NYHA III (Limitación marcada, cómodo en reposo)</option>
                <option value="IV">NYHA IV (Incapacidad total / Síntomas en reposo)</option>
              </select>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-medium text-slate-300">Grado de Angina CCS</label>
              <select
                disabled={disabled}
                value={ccsClass}
                onChange={(e) => {
                  setCcsClass(e.target.value)
                  setDirty("cirugia-cardiovascular", true)
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-rose-500 focus:outline-none"
              >
                <option value="">Seleccionar...</option>
                <option value="I">CCS I (Angina con esfuerzo extenuante)</option>
                <option value="II">CCS II (Limitación leve en actividad habitual)</option>
                <option value="III">CCS III (Limitación marcada en marcha/escaleras)</option>
                <option value="IV">CCS IV (Angina en reposo o mínimo esfuerzo)</option>
              </select>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-medium text-slate-300">Clinical Frailty Scale (1-9)</label>
              <input
                type="number"
                min="1"
                max="9"
                disabled={disabled}
                value={frailtyScore}
                onChange={(e) => {
                  setFrailtyScore(e.target.value === "" ? "" : Number(e.target.value))
                  setDirty("cirugia-cardiovascular", true)
                }}
                placeholder="1 (Robusto) a 9 (Terminal)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRÓTESIS Y ANTECEDENTES QUIRÚRGICOS */}
      {activeTab === "ANTECEDENTES_PROTESIS" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Prótesis Valvulares e Implantes Aórticos</h3>
              <p className="text-xs text-slate-400">Trazabilidad sanitaria de marcas, tamaños y números de serie.</p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowProtesisModal(true)}
              disabled={disabled}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Implante / Prótesis
            </Button>
          </div>

          {/* List of prostheses */}
          {dbProtesisList && dbProtesisList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dbProtesisList.map((p: any) => (
                <div key={p.id} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                        {p.tipo} - {p.posicion}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-100 mt-1">{p.marcaModelo}</h4>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteProtesisMut.mutate({ id: p.id })}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/30 h-7 w-7 p-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1 border-t border-slate-800/60">
                    <div>
                      <span className="text-slate-400">Material:</span> {p.tipoMaterial}
                    </div>
                    <div>
                      <span className="text-slate-400">Tamaño:</span> {p.tamanoMm ? `${p.tamanoMm} mm` : "N/A"}
                    </div>
                    <div>
                      <span className="text-slate-400">Lote / Serial:</span> {p.numeroSerieLote || "Sin serial"}
                    </div>
                    <div>
                      <span className="text-slate-400">Estado:</span>{" "}
                      <span className="text-emerald-400 font-medium">{p.estadoProtesis}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/40 p-6 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
              No hay prótesis o implantes registrados previamente para este paciente.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EXAMEN DE PULSOS & ESTERNOTOMÍA */}
      {activeTab === "EXAMEN_PULSOS" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-rose-400" /> Mapa Comparativo de Pulsos Periféricos (0 a 3+)
            </h3>
            <p className="text-xs text-slate-400">
              Graduación: 0 = Abolido, 1+ = Disminuido, 2+ = Normal, 3+ = Saltón / Amplio.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {[
                { label: "Carotídeo", der: carotideoDer, izq: carotideoIzq, setD: setCarotideoDer, setI: setCarotideoIzq },
                { label: "Subclavio", der: subclavioDer, izq: subclavioIzq, setD: setSubclavioDer, setI: setSubclavioIzq },
                { label: "Braquial", der: braquialDer, izq: braquialIzq, setD: setBraquialDer, setI: setBraquialIzq },
                { label: "Radial", der: radialDer, izq: radialIzq, setD: setRadialDer, setI: setRadialIzq },
                { label: "Femoral", der: femoralDer, izq: femoralIzq, setD: setFemoralDer, setI: setFemoralIzq },
                { label: "Poplíteo", der: popliteoDer, izq: popliteoIzq, setD: setPopliteoDer, setI: setPopliteoIzq },
                { label: "Tibial Posterior", der: tibialPosteriorDer, izq: tibialPosteriorIzq, setD: setTibialPosteriorDer, setI: setTibialPosteriorIzq },
                { label: "Pedio", der: pedioDer, izq: pedioIzq, setD: setPedioDer, setI: setPedioIzq },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-medium text-slate-200">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">DER:</span>
                      <select
                        disabled={disabled}
                        value={item.der}
                        onChange={(e) => {
                          item.setD(Number(e.target.value))
                          setDirty("cirugia-cardiovascular", true)
                        }}
                        className={`bg-slate-900 border rounded px-1.5 py-0.5 font-bold ${getPulseBadgeClass(item.der)}`}
                      >
                        <option value={0}>0 (Abolido)</option>
                        <option value={1}>1+ (Disminuido)</option>
                        <option value={2}>2+ (Normal)</option>
                        <option value={3}>3+ (Saltón)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">IZQ:</span>
                      <select
                        disabled={disabled}
                        value={item.izq}
                        onChange={(e) => {
                          item.setI(Number(e.target.value))
                          setDirty("cirugia-cardiovascular", true)
                        }}
                        className={`bg-slate-900 border rounded px-1.5 py-0.5 font-bold ${getPulseBadgeClass(item.izq)}`}
                      >
                        <option value={0}>0 (Abolido)</option>
                        <option value={1}>1+ (Disminuido)</option>
                        <option value={2}>2+ (Normal)</option>
                        <option value={3}>3+ (Saltón)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-medium text-slate-300">Test de Allen (Mano Derecha)</label>
              <select
                disabled={disabled}
                value={testAllenDerecho}
                onChange={(e) => {
                  setTestAllenDerecho(e.target.value)
                  setDirty("cirugia-cardiovascular", true)
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-rose-500 focus:outline-none"
              >
                <option value="">Seleccionar...</option>
                <option value="Normal (<6s)">Normal (&lt; 6 seg - Apto para injerto)</option>
                <option value="Anormal (>=6s)">Anormal (&gt;= 6 seg - Isquemia palmar)</option>
              </select>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-medium text-slate-300">Test de Allen (Mano Izquierda)</label>
              <select
                disabled={disabled}
                value={testAllenIzquierdo}
                onChange={(e) => {
                  setTestAllenIzquierdo(e.target.value)
                  setDirty("cirugia-cardiovascular", true)
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-rose-500 focus:outline-none"
              >
                <option value="">Seleccionar...</option>
                <option value="Normal (<6s)">Normal (&lt; 6 seg - Apto para injerto)</option>
                <option value="Anormal (>=6s)">Anormal (&gt;= 6 seg - Isquemia palmar)</option>
              </select>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-medium text-slate-300">Estabilidad Esternal Posop</label>
              <select
                disabled={disabled}
                value={estabilidadEsternal}
                onChange={(e) => {
                  setEstabilidadEsternal(e.target.value)
                  setDirty("cirugia-cardiovascular", true)
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-rose-500 focus:outline-none"
              >
                <option value="">Seleccionar...</option>
                <option value="Firme / Estable">Firme / Estable (Sin dehiscencia)</option>
                <option value="Dehiscencia Parcial">Dehiscencia Parcial / Inestabilidad</option>
                <option value="Clic / Crepitación">Clic / Crepitación Esternal Movible</option>
                <option value="Sin Esternotomía Previa">Sin Esternotomía Previa</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CATETERISMO & IMAGEN */}
      {activeTab === "IMAGEN_CATETERISMO" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" /> Coronariografía & Cateterismo Cardiaco
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-slate-400">Dominancia</label>
                <select
                  disabled={disabled}
                  value={dominanciaCoronaria}
                  onChange={(e) => {
                    setDominanciaCoronaria(e.target.value)
                    setDirty("cirugia-cardiovascular", true)
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                >
                  <option value="Derecha">Derecha</option>
                  <option value="Izquierda">Izquierda</option>
                  <option value="Codominante">Codominante</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400">% Estenosis TCI</label>
                <input
                  type="number"
                  disabled={disabled}
                  value={stenosisTci}
                  onChange={(e) => {
                    setStenosisTci(e.target.value === "" ? "" : Number(e.target.value))
                    setDirty("cirugia-cardiovascular", true)
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">% Estenosis DA</label>
                <input
                  type="number"
                  disabled={disabled}
                  value={stenosisDa}
                  onChange={(e) => {
                    setStenosisDa(e.target.value === "" ? "" : Number(e.target.value))
                    setDirty("cirugia-cardiovascular", true)
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">% Estenosis Cx / CD</label>
                <input
                  type="number"
                  disabled={disabled}
                  value={stenosisCx}
                  onChange={(e) => {
                    setStenosisCx(e.target.value === "" ? "" : Number(e.target.value))
                    setDirty("cirugia-cardiovascular", true)
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" /> Ecocardiograma Quirúrgico
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-400">FEVI (%)</label>
                <input
                  type="number"
                  disabled={disabled}
                  value={fevi}
                  onChange={(e) => {
                    setFevi(e.target.value === "" ? "" : Number(e.target.value))
                    setDirty("cirugia-cardiovascular", true)
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-400">Gradiente Medio Aórtico (mmHg)</label>
                <input
                  type="number"
                  disabled={disabled}
                  value={gradienteMedioAortico}
                  onChange={(e) => {
                    setGradienteMedioAortico(e.target.value === "" ? "" : Number(e.target.value))
                    setDirty("cirugia-cardiovascular", true)
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-400">Área Valvular Aórtica (cm²)</label>
                <input
                  type="number"
                  step="0.1"
                  disabled={disabled}
                  value={areaValvularAortica}
                  onChange={(e) => {
                    setAreaValvularAortica(e.target.value === "" ? "" : Number(e.target.value))
                    setDirty("cirugia-cardiovascular", true)
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-400">PSAP (mmHg)</label>
                <input
                  type="number"
                  disabled={disabled}
                  value={psap}
                  onChange={(e) => {
                    setPsap(e.target.value === "" ? "" : Number(e.target.value))
                    setDirty("cirugia-cardiovascular", true)
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ANTICOAGULACIÓN & INR */}
      {activeTab === "ANTICOAGULACION" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-rose-400 uppercase tracking-wider block">INR Actual</label>
              <input
                type="number"
                step="0.1"
                disabled={disabled}
                value={inrActual}
                onChange={(e) => {
                  setInrActual(e.target.value === "" ? "" : Number(e.target.value))
                  setDirty("cirugia-cardiovascular", true)
                }}
                placeholder="Ej: 2.4"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-bold"
              />
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-medium text-slate-300">INR Objetivo Mínimo</label>
              <input
                type="number"
                step="0.1"
                disabled={disabled}
                value={inrObjetivoMin}
                onChange={(e) => {
                  setInrObjetivoMin(e.target.value === "" ? "" : Number(e.target.value))
                  setDirty("cirugia-cardiovascular", true)
                }}
                placeholder="Ej: 2.0"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
              />
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-medium text-slate-300">INR Objetivo Máximo</label>
              <input
                type="number"
                step="0.1"
                disabled={disabled}
                value={inrObjetivoMax}
                onChange={(e) => {
                  setInrObjetivoMax(e.target.value === "" ? "" : Number(e.target.value))
                  setDirty("cirugia-cardiovascular", true)
                }}
                placeholder="Ej: 3.0"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
              />
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <label className="text-xs font-medium text-slate-300">Esquema de Anticoagulación & Indicaciones</label>
            <textarea
              rows={3}
              disabled={disabled}
              value={esquemaAnticoagulante}
              onChange={(e) => {
                setEsquemaAnticoagulante(e.target.value)
                setDirty("cirugia-cardiovascular", true)
              }}
              placeholder="Ej: Warfarina 5mg OD de lunes a viernes, 2.5mg sábados y domingos..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 focus:border-rose-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* TAB 6: PLAN QUIRÚRGICO & CEC */}
      {activeTab === "PLAN_CEC_POSOP" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-400" /> Plan Quirúrgico & Circulación Extracorpórea (CEC)
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Procedimiento Quirúrgico Propuesto</label>
                <input
                  type="text"
                  disabled={disabled}
                  value={procedimientoPropuesto}
                  onChange={(e) => {
                    setProcedimientoPropuesto(e.target.value)
                    setDirty("cirugia-cardiovascular", true)
                  }}
                  placeholder="Ej: Sustitución Valvular Aórtica con Prótesis Mecánica N° 23 + CABG x1"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-400">Estrategia de Canulación</label>
                  <input
                    type="text"
                    disabled={disabled}
                    value={tipoCanulacion}
                    onChange={(e) => {
                      setTipoCanulacion(e.target.value)
                      setDirty("cirugia-cardiovascular", true)
                    }}
                    placeholder="Ej: Aórtica / Auricular Única"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Protección Miocárdica / Cardioplejía</label>
                  <input
                    type="text"
                    disabled={disabled}
                    value={tipoCardioplejia}
                    onChange={(e) => {
                      setTipoCardioplejia(e.target.value)
                      setDirty("cirugia-cardiovascular", true)
                    }}
                    placeholder="Ej: Del Nido Fría Anterógrada"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Grado de Hipotermia</label>
                  <input
                    type="text"
                    disabled={disabled}
                    value={gradoHipotermia}
                    onChange={(e) => {
                      setGradHipotermia(e.target.value)
                      setDirty("cirugia-cardiovascular", true)
                    }}
                    placeholder="Ej: Moderada (32°C)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Prótesis */}
      {showProtesisModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-100">Registrar Prótesis / Implante Quirúrgico</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400">Tipo de Implante</label>
                <select
                  value={newTipo}
                  onChange={(e) => setNewTipo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                >
                  <option value="Prótesis Valvular">Prótesis Valvular</option>
                  <option value="Injerto Aórtico">Injerto Aórtico</option>
                  <option value="Anillo de Plastía">Anillo de Plastía Valvular</option>
                  <option value="Marcapasos Definitivo">Marcapasos Definitivo</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400">Posición Anatómica</label>
                <select
                  value={newPosicion}
                  onChange={(e) => setNewPosicion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                >
                  <option value="Aórtica">Aórtica</option>
                  <option value="Mitral">Mitral</option>
                  <option value="Tricúspide">Tricúspide</option>
                  <option value="Pulmonar">Pulmonar</option>
                  <option value="Aorta Ascendente">Aorta Ascendente</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400">Marca y Modelo</label>
                <input
                  type="text"
                  value={newMarcaModelo}
                  onChange={(e) => setNewMarcaModelo(e.target.value)}
                  placeholder="Ej: St. Jude Medical Regent, Carpentier-Edwards"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400">Tamaño (mm)</label>
                  <input
                    type="number"
                    value={newTamanoMm}
                    onChange={(e) => setNewTamanoMm(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400">N° Serie / Lote</label>
                  <input
                    type="text"
                    value={newSerial}
                    onChange={(e) => setNewSerial(e.target.value)}
                    placeholder="Ej: SN-9821-X"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowProtesisModal(false)}
                className="text-slate-400 text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleAddProtesis}
                disabled={saveProtesisMut.isLoading}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs"
              >
                Guardar Implante
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
