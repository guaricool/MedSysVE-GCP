"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Glasses,
  Activity,
  Award,
  Plus,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Zap,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  patientRegId?: string;
  disabled?: boolean;
  initialData?: any;
}

const VISUAL_ACUITY_OPTIONS = [
  "20/20 (Normal)",
  "20/25",
  "20/30",
  "20/40",
  "20/50",
  "20/70",
  "20/100",
  "20/200 (Ceguera Legal)",
  "20/400",
  "Cuenta Dedos (CD)",
  "Movimiento de Manos (MM)",
  "Percepción de Luz (PL)",
  "No Percepción de Luz (NPL)",
];

const DIABETIC_RETINOPATHY_OPTIONS = [
  "Sin Retinopatía Diabética Aparente",
  "RDNP Leve (Solo microaneurismas)",
  "RDNP Moderada (Exudados duros, hemorragias retina)",
  "RDNP Severa (Regla 4-2-1 / Arrosamiento venoso)",
  "RDP Proliferativa (Neovasos, hemorragia vítrea)",
];

const HYPERTENSIVE_RETINOPATHY_OPTIONS = [
  "Sin Retinopatía Hipertensiva",
  "Grado I (Estrechamiento arteriolar leve)",
  "Grado II (Signos de cruce arteriovenoso / Salus-Gunn)",
  "Grado III (Hemorragias, exudados algodonosos)",
  "Grado IV (Edema de papila / Papiledema)",
];

export function OftalmologiaForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"REFRACCION" | "GLAUCOMA" | "SEGMENTOS">("REFRACCION");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbRef, refetch: refetchRef } = (trpc.ophtho.getRefraction.useQuery as any)({ encounterId });
  const { data: dbGlauc, refetch: refetchGlauc } = (trpc.ophtho.getGlaucomaRetinopathy.useQuery as any)({ encounterId });
  const { data: dbFind, refetch: refetchFind } = (trpc.ophtho.getEyeFindings.useQuery as any)({ encounterId });

  const saveRefMut = (trpc.ophtho.saveRefraction.useMutation as any)({ onSuccess: () => refetchRef() });
  const saveGlaucMut = (trpc.ophtho.saveGlaucomaRetinopathy.useMutation as any)({ onSuccess: () => refetchGlauc() });
  const saveFindMut = (trpc.ophtho.saveEyeFindings.useMutation as any)({ onSuccess: () => refetchFind() });

  // Refraction State
  const [avOdSin, setAvOdSin] = useState("20/40");
  const [avOiSin, setAvOiSin] = useState("20/60");
  const [esferaOd, setEsferaOd] = useState(-1.75);
  const [cilindroOd, setCilindroOd] = useState(-0.5);
  const [ejeOd, setEjeOd] = useState(175);
  const [adicionOd, setAdicionOd] = useState(1.5);
  const [avOdCon, setAvOdCon] = useState("20/20");
  const [esferaOi, setEsferaOi] = useState(-2.25);
  const [cilindroOi, setCilindroOi] = useState(-0.75);
  const [ejeOi, setEjeOi] = useState(10);
  const [adicionOi, setAdicionOi] = useState(1.5);
  const [avOiCon, setAvOiCon] = useState("20/20");

  // Glaucoma & Retinopathy State
  const [pioOd, setPioOd] = useState(16.0);
  const [pioOi, setPioOi] = useState(18.5);
  const [tratamHipotensor, setTratamHipotensor] = useState("Latanoprost 0.005% 1 gota en ambos ojos al acostarse");
  const [rdDiabetica, setRdDiabetica] = useState("RDNP Leve (Solo microaneurismas)");
  const [rdHipertensiva, setRdHipertensiva] = useState("Grado I (Estrechamiento arteriolar leve)");
  const [excaOd, setExcaOd] = useState(0.4);
  const [excaOi, setExcaOi] = useState(0.5);

  // Eye Findings State
  const [segAntOd, setSegAntOd] = useState("Córnea transparente, cámara anterior amplia sin Tyndall, cristalino con esclerosis nuclear NO-2.");
  const [segAntOi, setSegAntOi] = useState("Córnea transparente, cámara anterior formada, cristalino transparente.");
  const [segPostOd, setSegPostOd] = useState("Mácula libre de exudados, papila de bordes netos, relación arteria/vena 2:3.");
  const [segPostOi, setSegPostOi] = useState("Mácula conservada, papila de color rosado.");
  const [diagOd, setDiagOd] = useState("Nevus conjuntival temporal 2mm.");
  const [diagOi, setDiagOi] = useState("Sin hallazgos periféricos.");

  useEffect(() => {
    if (dbRef) {
      if (dbRef.avOdSinCorrecion) setAvOdSin(dbRef.avOdSinCorrecion);
      if (dbRef.avOiSinCorrecion) setAvOiSin(dbRef.avOiSinCorrecion);
      if (dbRef.esferaOd !== null) setEsferaOd(dbRef.esferaOd);
      if (dbRef.cilindroOd !== null) setCilindroOd(dbRef.cilindroOd);
      if (dbRef.ejeOd !== null) setEjeOd(dbRef.ejeOd);
      if (dbRef.adicionOd !== null) setAdicionOd(dbRef.adicionOd);
      if (dbRef.avOdConCorreccion) setAvOdCon(dbRef.avOdConCorreccion);
      if (dbRef.esferaOi !== null) setEsferaOi(dbRef.esferaOi);
      if (dbRef.cilindroOi !== null) setCilindroOi(dbRef.cilindroOi);
      if (dbRef.ejeOi !== null) setEjeOi(dbRef.ejeOi);
      if (dbRef.adicionOi !== null) setAdicionOi(dbRef.adicionOi);
      if (dbRef.avOiConCorreccion) setAvOiCon(dbRef.avOiConCorreccion);
    }
  }, [dbRef]);

  useEffect(() => {
    if (dbGlauc) {
      if (dbGlauc.pioOdMmHg !== null) setPioOd(dbGlauc.pioOdMmHg);
      if (dbGlauc.pioOiMmHg !== null) setPioOi(dbGlauc.pioOiMmHg);
      if (dbGlauc.tratamientoHipotensor) setTratamHipotensor(dbGlauc.tratamientoHipotensor);
      if (dbGlauc.retinopatiaDiabetica) setRdDiabetica(dbGlauc.retinopatiaDiabetica);
      if (dbGlauc.retinopatiaHipertensiva) setRdHipertensiva(dbGlauc.retinopatiaHipertensiva);
      if (dbGlauc.excavacionPapilarOd !== null) setExcaOd(dbGlauc.excavacionPapilarOd);
      if (dbGlauc.excavacionPapilarOi !== null) setExcaOi(dbGlauc.excavacionPapilarOi);
    }
  }, [dbGlauc]);

  useEffect(() => {
    if (dbFind) {
      if (dbFind.segmentoAnteriorOd) setSegAntOd(dbFind.segmentoAnteriorOd);
      if (dbFind.segmentoAnteriorOi) setSegAntOi(dbFind.segmentoAnteriorOi);
      if (dbFind.segmentoPosteriorOd) setSegPostOd(dbFind.segmentoPosteriorOd);
      if (dbFind.segmentoPosteriorOi) setSegPostOi(dbFind.segmentoPosteriorOi);
      if (dbFind.hallazgosDiagramaOd) setDiagOd(dbFind.hallazgosDiagramaOd);
      if (dbFind.hallazgosDiagramaOi) setDiagOi(dbFind.hallazgosDiagramaOi);
    }
  }, [dbFind]);

  const handleSaveRefraction = () => {
    saveRefMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      avOdSinCorrecion: avOdSin,
      avOiSinCorrecion: avOiSin,
      esferaOd,
      cilindroOd,
      ejeOd,
      adicionOd,
      avOdConCorreccion: avOdCon,
      esferaOi,
      cilindroOi,
      ejeOi,
      adicionOi,
      avOiConCorreccion: avOiCon,
    });
  };

  const handleSaveGlaucoma = () => {
    saveGlaucMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      pioOdMmHg: pioOd,
      pioOiMmHg: pioOi,
      tratamientoHipotensor: tratamHipotensor,
      retinopatiaDiabetica: rdDiabetica,
      retinopatiaHipertensiva: rdHipertensiva,
      excavacionPapilarOd: excaOd,
      excavacionPapilarOi: excaOi,
    });
  };

  const handleSaveFindings = () => {
    saveFindMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      segmentoAnteriorOd: segAntOd,
      segmentoAnteriorOi: segAntOi,
      segmentoPosteriorOd: segPostOd,
      segmentoPosteriorOi: segPostOi,
      hallazgosDiagramaOd: diagOd,
      hallazgosDiagramaOi: diagOi,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Oftalmología & Salud Ocular</h3>
            <p className="text-xs text-slate-400">Refracción Ultra-Rápida OD/OI, Control de Glaucoma / PIO & Retinopatía Diabética/Hipertensiva</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveTab("REFRACCION")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "REFRACCION"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Glasses className="w-3.5 h-3.5" /> Refracción & Agudeza Visual
        </button>

        <button
          onClick={() => setActiveTab("GLAUCOMA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "GLAUCOMA"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Glaucoma PIO & Retinopatías
        </button>

        <button
          onClick={() => setActiveTab("SEGMENTOS")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "SEGMENTOS"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Eye className="w-3.5 h-3.5" /> Segmentos Oculares & Diagramas
        </button>
      </div>

      {/* Tab 1: Refracción & Agudeza Visual */}
      {activeTab === "REFRACCION" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Glasses className="w-4 h-4" /> Cuadrícula de Refracción Ultra-Rápida OD / OI & Agudeza Visual
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Fórmula óptica para lentes correctoras y graduación visual de Snellen.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveRefraction}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
            >
              Guardar Refracción
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            {/* Ojo Derecho (OD) */}
            <div className="space-y-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="font-bold text-indigo-300 block text-xs uppercase tracking-wider">Ojo Derecho (OD)</span>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">AV Sin Corrección</label>
                  <select
                    value={avOdSin}
                    onChange={(e) => setAvOdSin(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5"
                  >
                    {VISUAL_ACUITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">AV Con Corrección</label>
                  <select
                    value={avOdCon}
                    onChange={(e) => setAvOdCon(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-emerald-300 font-bold rounded p-1.5"
                  >
                    {VISUAL_ACUITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Esfera (Sph)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={esferaOd}
                    onChange={(e) => setEsferaOd(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-1.5 text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Cilindro (Cyl)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={cilindroOd}
                    onChange={(e) => setCilindroOd(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-1.5 text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Eje (°)</label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={ejeOd}
                    onChange={(e) => setEjeOd(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-1.5 text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Adición (ADD)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={adicionOd}
                    onChange={(e) => setAdicionOd(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-indigo-300 font-bold rounded p-1.5 text-center"
                  />
                </div>
              </div>
            </div>

            {/* Ojo Izquierdo (OI) */}
            <div className="space-y-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="font-bold text-indigo-300 block text-xs uppercase tracking-wider">Ojo Izquierdo (OI)</span>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">AV Sin Corrección</label>
                  <select
                    value={avOiSin}
                    onChange={(e) => setAvOiSin(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5"
                  >
                    {VISUAL_ACUITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">AV Con Corrección</label>
                  <select
                    value={avOiCon}
                    onChange={(e) => setAvOiCon(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-emerald-300 font-bold rounded p-1.5"
                  >
                    {VISUAL_ACUITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Esfera (Sph)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={esferaOi}
                    onChange={(e) => setEsferaOi(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-1.5 text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Cilindro (Cyl)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={cilindroOi}
                    onChange={(e) => setCilindroOi(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-1.5 text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Eje (°)</label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={ejeOi}
                    onChange={(e) => setEjeOi(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-1.5 text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Adición (ADD)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={adicionOi}
                    onChange={(e) => setAdicionOi(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-indigo-300 font-bold rounded p-1.5 text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Glaucoma PIO & Retinopatías */}
      {activeTab === "GLAUCOMA" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> Presión Intraocular (PIO mmHg), Glaucoma & Retinopatía Diabética / Hipertensiva
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Control tonométrico, ratio excavación papilar y evaluación de vasculopatías endémicas.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveGlaucoma}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
            >
              Guardar Glaucoma / PIO
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <label className="font-semibold text-slate-300 block">Tonometría PIO Ojo Derecho (mmHg)</label>
              <input
                type="number"
                step="0.5"
                value={pioOd}
                onChange={(e) => setPioOd(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-indigo-300 font-bold rounded p-2 text-sm"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">Excavación Papilar E/D OD</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="0.9"
                  value={excaOd}
                  onChange={(e) => setExcaOd(Number(e.target.value))}
                  className="w-20 bg-slate-900 border border-slate-700 text-white font-bold rounded p-1 text-center"
                />
              </div>
            </div>

            <div className="space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <label className="font-semibold text-slate-300 block">Tonometría PIO Ojo Izquierdo (mmHg)</label>
              <input
                type="number"
                step="0.5"
                value={pioOi}
                onChange={(e) => setPioOi(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-indigo-300 font-bold rounded p-2 text-sm"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">Excavación Papilar E/D OI</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="0.9"
                  value={excaOi}
                  onChange={(e) => setExcaOi(Number(e.target.value))}
                  className="w-20 bg-slate-900 border border-slate-700 text-white font-bold rounded p-1 text-center"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Tratamiento Hipotensor Ocular Prescrito</label>
              <input
                type="text"
                value={tratamHipotensor}
                onChange={(e) => setTratamHipotensor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Estadificación Retinopatía Diabética (ETDRS)</label>
              <select
                value={rdDiabetica}
                onChange={(e) => setRdDiabetica(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-semibold rounded p-2"
              >
                {DIABETIC_RETINOPATHY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Estadificación Retinopatía Hipertensiva (Scheie)</label>
              <select
                value={rdHipertensiva}
                onChange={(e) => setRdHipertensiva(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-rose-300 font-semibold rounded p-2"
              >
                {HYPERTENSIVE_RETINOPATHY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Segmentos Oculares & Diagramas */}
      {activeTab === "SEGMENTOS" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> Hallazgos en Segmento Anterior & Posterior (Biomicroscopía & Fondo de Ojo)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Examen de lámpara de hendidura, córnea, cristalino, retina, mácula y vítreo.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveFindings}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
            >
              Guardar Segmentos
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Segmento Anterior - Ojo Derecho (OD)</label>
              <textarea
                value={segAntOd}
                onChange={(e) => setSegAntOd(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Segmento Anterior - Ojo Izquierdo (OI)</label>
              <textarea
                value={segAntOi}
                onChange={(e) => setSegAntOi(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Segmento Posterior / Fondo de Ojo - Ojo Derecho (OD)</label>
              <textarea
                value={segPostOd}
                onChange={(e) => setSegPostOd(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Segmento Posterior / Fondo de Ojo - Ojo Izquierdo (OI)</label>
              <textarea
                value={segPostOi}
                onChange={(e) => setSegPostOi(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
