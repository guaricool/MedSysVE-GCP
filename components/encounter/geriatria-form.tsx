"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Brain,
  Footprints,
  Activity,
  Award,
  CheckCircle2,
  AlertTriangle,
  Smile,
  ShieldAlert,
  FileDown,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  patientRegId?: string;
  disabled?: boolean;
  initialData?: any;
}

const KATZ_ITEMS = [
  "Bañarse / Higiene Corporal",
  "Vestirse y Desvestirse",
  "Uso del Inodoro / W.C.",
  "Movilidad / Transferencias",
  "Continencia de Esfínteres",
  "Alimentación Autónoma",
];

const LAWTON_ITEMS = [
  "Capacidad para Usar el Teléfono",
  "Hacer Compras Autónoma",
  "Preparación de Alimentos",
  "Cuidado de la Casa / Limpieza",
  "Lavado de Ropa",
  "Uso de Medios de Transporte",
  "Responsabilidad sobre la Medicación",
  "Manejo de Asuntos Económicos",
];

const FRAIL_ITEMS = [
  "F - Fatiga / Cansancio Frecuente",
  "R - Resistencia (Incapacidad de subir 1 piso de escaleras)",
  "A - Aeróbico (Incapacidad de caminar 1 cuadra)",
  "I - Illness / Enfermedades (>5 comorbilidades crónicas)",
  "L - Loss of Weight / Pérdida involuntaria de peso (>5%)",
];

export function GeriatriaForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"VGI" | "FRAGILIDAD" | "COGNITIVO">("VGI");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbVgi, refetch: refetchVgi } = (trpc.geri.getVgiFunctional.useQuery as any)({ encounterId });
  const { data: dbFrail, refetch: refetchFrail } = (trpc.geri.getFrailFallRisk.useQuery as any)({ encounterId });
  const { data: dbCog, refetch: refetchCog } = (trpc.geri.getCognitiveMood.useQuery as any)({ encounterId });

  const saveVgiMut = (trpc.geri.saveVgiFunctional.useMutation as any)({ onSuccess: () => refetchVgi() });
  const saveFrailMut = (trpc.geri.saveFrailFallRisk.useMutation as any)({ onSuccess: () => refetchFrail() });
  const saveCogMut = (trpc.geri.saveCognitiveMood.useMutation as any)({ onSuccess: () => refetchCog() });

  // VGI State
  const [katzPassed, setKatzPassed] = useState<number[]>([0, 1, 2, 3, 4]); // 5/6
  const [lawtonPassed, setLawtonPassed] = useState<number[]>([0, 1, 2, 5, 6, 7]); // 6/8

  const katzScore = katzPassed.length;
  const lawtonScore = lawtonPassed.length;

  const katzCategory = useMemo(() => {
    if (katzScore === 6) return "Independencia Total AVD (Katz 6/6)";
    if (katzScore >= 4) return "Dependencia Leve AVD (Katz 4-5/6)";
    if (katzScore >= 2) return "Dependencia Moderada AVD (Katz 2-3/6)";
    return "Dependencia Severa / Total AVD (Katz 0-1/6)";
  }, [katzScore]);

  const lawtonCategory = useMemo(() => {
    if (lawtonScore === 8) return "Independencia Total AIVD (Lawton 8/8)";
    if (lawtonScore >= 5) return "Independencia Parcial / Leve AIVD (Lawton 5-7/8)";
    return "Dependencia Severa AIVD (Lawton < 5/8)";
  }, [lawtonScore]);

  // Fragilidad State
  const [frailChecked, setFrailChecked] = useState<number[]>([0, 1]); // 2/5
  const [tugSec, setTugSec] = useState(14.2);
  const [fallsCount, setFallsCount] = useState(1);

  const frailScore = frailChecked.length;

  const frailCategory = useMemo(() => {
    if (frailScore === 0) return "Robusto (Cuestionario FRAIL 0/5)";
    if (frailScore <= 2) return "Estado Pre-Frágil (Cuestionario FRAIL 1-2/5)";
    return "Síndrome de Fragilidad Geriátrica (FRAIL 3-5/5)";
  }, [frailScore]);

  const fallRiskCategory = useMemo(() => {
    if (tugSec < 10) return "Bajo Riesgo de Caídas (TUG < 10 segundos)";
    if (tugSec <= 20) return "Riesgo Moderado de Caídas (TUG 10 - 20 segundos)";
    return "Alto Riesgo de Caídas & Movilidad Alterada (TUG > 20 segundos)";
  }, [tugSec]);

  // Cognitivo State
  const [pfeiffer, setPfeiffer] = useState(2);
  const [mmse, setMmse] = useState(26);
  const [yesavage, setYesavage] = useState(4);

  const cognitiveCategory = useMemo(() => {
    if (mmse >= 27) return "Función Cognitiva Normal (MMSE 27-30 pts)";
    if (mmse >= 24) return "Deterioro Cognitivo Leve DCL (MMSE 24-26 pts)";
    if (mmse >= 18) return "Demencia Moderada (MMSE 18-23 pts)";
    return "Demencia Severa (MMSE < 18 pts)";
  }, [mmse]);

  const moodCategory = useMemo(() => {
    if (yesavage <= 5) return "Normal / Sin Depresión (GDS-15 0-5 pts)";
    if (yesavage <= 9) return "Probable Depresión Leve (GDS-15 6-9 pts)";
    return "Indicativo de Depresión Severa (GDS-15 >= 10 pts)";
  }, [yesavage]);

  useEffect(() => {
    if (dbVgi) {
      // Load scores
    }
  }, [dbVgi]);

  useEffect(() => {
    if (dbFrail) {
      if (dbFrail.timedUpAndGoSec !== null) setTugSec(dbFrail.timedUpAndGoSec);
      setFallsCount(dbFrail.fallsLastYearCount);
    }
  }, [dbFrail]);

  useEffect(() => {
    if (dbCog) {
      if (dbCog.pfeifferErrors !== null) setPfeiffer(dbCog.pfeifferErrors);
      if (dbCog.mmseScore !== null) setMmse(dbCog.mmseScore);
      if (dbCog.yesavageGds15Score !== null) setYesavage(dbCog.yesavageGds15Score);
    }
  }, [dbCog]);

  const toggleKatz = (index: number) => {
    setKatzPassed((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleLawton = (index: number) => {
    setLawtonPassed((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleFrail = (index: number) => {
    setFrailChecked((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSaveVgi = () => {
    saveVgiMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      katzScore,
      katzCategory,
      lawtonBrodyScore: lawtonScore,
      lawtonCategory,
    });
  };

  const handleSaveFrail = () => {
    saveFrailMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      frailScore,
      frailCategory,
      timedUpAndGoSec: tugSec,
      fallRiskCategory,
      fallsLastYearCount: fallsCount,
    });
  };

  const handleSaveCog = () => {
    saveCogMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      pfeifferErrors: pfeiffer,
      mmseScore: mmse,
      cognitiveCategory,
      yesavageGds15Score: yesavage,
      moodCategory,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Geriatría & Valoración Geriátrica Integral (VGI)</h3>
            <p className="text-xs text-slate-400">Funcionalidad (Katz/Lawton), Fragilidad FRAIL, Caídas (TUG) & Cognición / Ánimo (Pfeiffer/GDS-15)</p>
          </div>
        </div>
        {encounterId && encounterId !== "sandbox-demo-enc" && (
          <a
            href={`/api/pdf/encounter/${encounterId}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition-all shadow-sm"
          >
            <FileDown size={14} />
            Ver / Exportar Informe PDF (con QR)
          </a>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveTab("VGI")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "VGI"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Award className="w-3.5 h-3.5" /> VGI Funcional (Katz & Lawton)
        </button>

        <button
          onClick={() => setActiveTab("FRAGILIDAD")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "FRAGILIDAD"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Footprints className="w-3.5 h-3.5" /> Fragilidad FRAIL & Caídas (TUG)
        </button>

        <button
          onClick={() => setActiveTab("COGNITIVO")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "COGNITIVO"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Brain className="w-3.5 h-3.5" /> Cognitivo MMSE & Depresión Yesavage
        </button>
      </div>

      {/* Tab 1: VGI Funcional (Katz & Lawton) */}
      {activeTab === "VGI" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4" /> Evaluación de Autonomía Funcional (Katz AVD & Lawton AIVD)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Computación en tiempo real de independencia en actividades básicas e instrumentales.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveVgi}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
            >
              Guardar VGI
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            {/* Katz AVD */}
            <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-emerald-300">Índice de Katz (AVD Básicas)</span>
                <span className="font-bold text-emerald-400">{katzScore} / 6 pts</span>
              </div>
              <div className="space-y-1.5">
                {KATZ_ITEMS.map((item, idx) => {
                  const isChecked = katzPassed.includes(idx);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleKatz(idx)}
                      className={`w-full p-1.5 rounded text-left flex items-center justify-between transition-all ${
                        isChecked ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-200" : "bg-slate-900 border border-slate-800 text-slate-400"
                      }`}
                    >
                      <span>{item}</span>
                      <span className="font-bold text-[10px]">{isChecked ? "✓ Independiente" : "✕ Dependiente"}</span>
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] font-bold text-amber-300 block pt-1">{katzCategory}</span>
            </div>

            {/* Lawton-Brody AIVD */}
            <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-sky-300">Índice de Lawton-Brody (AIVD Instrumentales)</span>
                <span className="font-bold text-sky-400">{lawtonScore} / 8 pts</span>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {LAWTON_ITEMS.map((item, idx) => {
                  const isChecked = lawtonPassed.includes(idx);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleLawton(idx)}
                      className={`w-full p-1.5 rounded text-left flex items-center justify-between transition-all ${
                        isChecked ? "bg-sky-950/60 border border-sky-500/40 text-sky-200" : "bg-slate-900 border border-slate-800 text-slate-400"
                      }`}
                    >
                      <span>{item}</span>
                      <span className="font-bold text-[10px]">{isChecked ? "✓ Autónomo" : "✕ Requiere Ayuda"}</span>
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] font-bold text-sky-300 block pt-1">{lawtonCategory}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Fragilidad FRAIL & Caídas */}
      {activeTab === "FRAGILIDAD" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Footprints className="w-4 h-4" /> Cuestionario de Fragilidad FRAIL & Test Timed Up and Go (TUG)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Detección de fragilidad clínica y estimación de riesgo de caídas.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveFrail}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
            >
              Guardar Fragilidad
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-bold text-amber-300">Cuestionario FRAIL (0 - 5 pts)</span>
                <span className="font-bold text-amber-400">{frailScore} / 5</span>
              </div>
              <div className="space-y-1.5">
                {FRAIL_ITEMS.map((item, idx) => {
                  const isChecked = frailChecked.includes(idx);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleFrail(idx)}
                      className={`w-full p-2 rounded text-left flex items-center justify-between transition-all ${
                        isChecked ? "bg-amber-950/60 border border-amber-500/40 text-amber-200 font-semibold" : "bg-slate-900 border border-slate-800 text-slate-400"
                      }`}
                    >
                      <span>{item}</span>
                      <span className="font-bold text-[10px]">{isChecked ? "Si (+1)" : "No (0)"}</span>
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] font-bold text-amber-300 block pt-1">{frailCategory}</span>
            </div>

            <div className="space-y-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="font-bold text-emerald-300 block border-b border-slate-800 pb-1.5">Test Timed Up and Go (TUG)</span>
              
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Tiempo de Prueba TUG (Segundos)</label>
                <input
                  type="number"
                  step="0.1"
                  value={tugSec}
                  onChange={(e) => setTugSec(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-emerald-300 font-bold rounded p-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Caídas en el Último Año (Contador)</label>
                <input
                  type="number"
                  value={fallsCount}
                  onChange={(e) => setFallsCount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-rose-400 font-bold rounded p-2 text-sm"
                />
              </div>

              <div className="bg-slate-900 p-2.5 rounded border border-emerald-500/30">
                <span className="text-xs text-slate-400 font-semibold block uppercase">Estadificación del Riesgo</span>
                <span className="text-xs font-bold text-emerald-300">{fallRiskCategory}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Cognitivo MMSE & Depresión Yesavage */}
      {activeTab === "COGNITIVO" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-4 h-4" /> Tamizaje Cognitivo MMSE & Escala Depresiva Yesavage GDS-15
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Cribado rápido de deterioro cognitivo y afectivo geriátrico.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveCog}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
            >
              Guardar Tamizaje
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Test Pfeiffer SPMSQ (Errores 0 - 10)</label>
              <input
                type="number"
                value={pfeiffer}
                onChange={(e) => setPfeiffer(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Minimental MMSE (Puntaje 0 - 30 pts)</label>
              <input
                type="number"
                value={mmse}
                onChange={(e) => setMmse(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-emerald-300 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Yesavage GDS-15 (Puntaje 0 - 15 pts)</label>
              <input
                type="number"
                value={yesavage}
                onChange={(e) => setYesavage(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 md:col-span-1.5">
              <span className="text-xs text-slate-400 font-semibold block uppercase">Estado Cognitivo</span>
              <span className="text-xs font-bold text-emerald-300">{cognitiveCategory}</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 md:col-span-1.5">
              <span className="text-xs text-slate-400 font-semibold block uppercase">Esfera Afectiva / Estado de Ánimo</span>
              <span className="text-xs font-bold text-amber-300">{moodCategory}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
