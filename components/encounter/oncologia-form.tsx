"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import { DicomViewer } from "@/components/dicom/dicom-viewer";
import {
  Ribbon,
  Activity,
  Award,
  Syringe,
  Plus,
  AlertTriangle,
  CheckCircle2,
  FileText,
  FileDown,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  patientRegId?: string;
  disabled?: boolean;
  initialData?: any;
}

const T_OPTIONS = [
  "Tis (Carcinoma in situ)",
  "T1 (Tumor <= 2cm en su mayor dimensión)",
  "T2 (Tumor >2cm pero <= 5cm)",
  "T3 (Tumor > 5cm)",
  "T4 (Tumor de cualquier tamaño con extensión directa a pared torácica/piel)",
];

const N_OPTIONS = [
  "N0 (Sin metástasis en ganglios linfáticos regionales)",
  "N1 (Metástasis a 1-3 ganglios linfáticos axilares / regionales)",
  "N2 (Metástasis a 4-9 ganglios linfáticos regionales)",
  "N3 (Metástasis a 10 o más ganglios linfáticos regionales)",
];

const M_OPTIONS = [
  "M0 (Sin metástasis a distancia observada)",
  "M1 (Metástasis a distancia presente: pulmón, hueso, hígado, cerebro)",
];

const ECOG_OPTIONS = [
  "ECOG 0: Asintomático. Capaz de realizar actividades normales sin restricción.",
  "ECOG 1: Sintomático pero ambulatorio. Restricción en actividades físicas intensas.",
  "ECOG 2: En cama <50% del día. Capaz de auto-cuidado pero incapaz de trabajar.",
  "ECOG 3: En cama >50% del día. Capaz de auto-cuidado limitado únicamente.",
  "ECOG 4: Encamado totalmente. Incapaz de valerse por sí mismo.",
];

export function OncologiaForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"TNM" | "PERFORMANCE" | "QUIMIOTERAPIA">("TNM");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbTnm, refetch: refetchTnm } = (trpc.onco.getTnmStaging.useQuery as any)({ encounterId });
  const { data: dbPerf, refetch: refetchPerf } = (trpc.onco.getPerformanceStatus.useQuery as any)({ encounterId });
  const { data: dbChemos = [], refetch: refetchChemos } = (trpc.onco.listChemoProtocols.useQuery as any)({ patientRegistrationId: effectivePatId });

  const saveTnmMut = (trpc.onco.saveTnmStaging.useMutation as any)({ onSuccess: () => refetchTnm() });
  const savePerfMut = (trpc.onco.savePerformanceStatus.useMutation as any)({ onSuccess: () => refetchPerf() });
  const saveChemoMut = (trpc.onco.saveChemoProtocol.useMutation as any)({ onSuccess: () => refetchChemos() });

  // TNM State
  const [tVal, setTVal] = useState("T2 (Tumor >2cm pero <= 5cm)");
  const [nVal, setNVal] = useState("N1 (Metástasis a 1-3 ganglios linfáticos axilares / regionales)");
  const [mVal, setMVal] = useState("M0 (Sin metástasis a distancia observada)");
  const [estadioGroup, setEstadioGroup] = useState("Estadio IIB (T2 N1 M0)");
  const [histopatologia, setHistopatologia] = useState("Carcinoma Ductal Infiltrante de Mama, HER2 Negativo, RE (+ 90%), RP (+ 70%).");

  // Performance State
  const [ecog, setEcog] = useState(1);
  const [karnofsky, setKarnofsky] = useState(90);

  // Chemotherapy State
  const [esquema, setEsquema] = useState("AC-T (Doxorrubicina + Ciclofosfamida seguidos de Paclitaxel)");
  const [intencion, setIntencion] = useState("Tratamiento Adyuvante Post-Quirúrgico");
  const [cicloNum, setCicloNum] = useState(3);
  const [toxicidadCtcae, setToxicidadCtcae] = useState("Grado 1: Alopecia & Náuseas leves bien controladas con Ondansetrón.");
  const [obsChemo, setObsChemo] = useState("Hemograma con Neutrófilos Totales > 1,500/mm3. Apto para ciclo N° 3.");

  useEffect(() => {
    if (dbTnm) {
      setTVal(dbTnm.primaryTumorT);
      setNVal(dbTnm.regionalNodesN);
      setMVal(dbTnm.distantMetastasisM);
      setEstadioGroup(dbTnm.clinicalStageGroup);
      if (dbTnm.histopatologia) setHistopatologia(dbTnm.histopatologia);
    }
  }, [dbTnm]);

  useEffect(() => {
    if (dbPerf) {
      setEcog(dbPerf.ecogGrade);
      setKarnofsky(dbPerf.karnofskyPercent);
    }
  }, [dbPerf]);

  const handleSaveTnm = () => {
    saveTnmMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      primaryTumorT: tVal,
      regionalNodesN: nVal,
      distantMetastasisM: mVal,
      clinicalStageGroup: estadioGroup,
      histopatologia,
    });
  };

  const handleSavePerf = () => {
    savePerfMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      ecogGrade: ecog,
      karnofskyPercent: karnofsky,
    });
  };

  const handleAddChemo = () => {
    saveChemoMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      esquemaAntineoplasico: esquema,
      intencionTratamiento: intencion,
      cicloNumero: cicloNum,
      toxicidadCtcaeGrade: toxicidadCtcae,
      observacionesProtocolo: obsChemo,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
            <Ribbon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Oncología Médica & Estadificación</h3>
            <p className="text-xs text-slate-400">TNM AJCC, Performance Status ECOG / Karnofsky & Protocolos Quimioterápicos CTCAE</p>
          </div>
        </div>
        {encounterId && (
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
          onClick={() => setActiveTab("TNM")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "TNM"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Award className="w-3.5 h-3.5" /> Estadificación TNM AJCC
        </button>

        <button
          onClick={() => setActiveTab("PERFORMANCE")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "PERFORMANCE"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Capacidad Funcional ECOG / KPS
        </button>

        <button
          onClick={() => setActiveTab("QUIMIOTERAPIA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "QUIMIOTERAPIA"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Syringe className="w-3.5 h-3.5" /> Protocolo Quimioterapia ({dbChemos.length})
        </button>
      </div>

      {/* Tab 1: Estadificación TNM */}
      {activeTab === "TNM" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4" /> Clasificación TNM AJCC & Estadio Clínico General
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Evaluación anatómica de extensión tumoral, compromiso nodal y metástasis.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveTnm}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
            >
              Guardar TNM
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tumor Primario (T)</label>
              <select
                value={tVal}
                onChange={(e) => setTVal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              >
                {T_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Nódulos Linfáticos Regionale (N)</label>
              <select
                value={nVal}
                onChange={(e) => setNVal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              >
                {N_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Metástasis a Distancia (M)</label>
              <select
                value={mVal}
                onChange={(e) => setMVal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              >
                {M_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="font-semibold text-slate-300">Grupo de Estadio Clínico General (I a IV)</label>
              <input
                type="text"
                value={estadioGroup}
                onChange={(e) => setEstadioGroup(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-rose-300 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="font-semibold text-slate-300">Histopatología & Marcadores Tumorales (HER2, RE, RP, Ki67)</label>
              <textarea
                value={histopatologia}
                onChange={(e) => setHistopatologia(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Performance Status ECOG / KPS */}
      {activeTab === "PERFORMANCE" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> Evaluación de Capacidad Funcional (ECOG & Karnofsky KPS)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Criterio clínico para aptitud a tratamiento sistémico y quimioterapia.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSavePerf}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
            >
              Guardar ECOG & KPS
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-300">Escala ECOG Performance Status (Grados 0 a 4)</label>
              <select
                value={ecog}
                onChange={(e) => setEcog(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              >
                {ECOG_OPTIONS.map((desc, idx) => (
                  <option key={idx} value={idx}>{desc}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Índice Karnofsky KPS (%)</label>
              <input
                type="number"
                min="10"
                max="100"
                step="10"
                value={karnofsky}
                onChange={(e) => setKarnofsky(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-rose-300 font-bold rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Protocolo Quimioterapia */}
      {activeTab === "QUIMIOTERAPIA" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Syringe className="w-4 h-4" /> Protocolo Quimioterápico & Toxicidad CTCAE v5.0
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Esquemas antineoplásicos, intención de tratamiento y graduación de efectos adversos.</p>
            </div>
            <Button
              size="sm"
              onClick={handleAddChemo}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Ciclo Quimio
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Esquema Antineoplásico Prescrito</label>
              <input
                type="text"
                value={esquema}
                onChange={(e) => setEsquema(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Intención del Tratamiento</label>
              <input
                type="text"
                value={intencion}
                onChange={(e) => setIntencion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Número de Ciclo Administrado</label>
              <input
                type="number"
                min="1"
                value={cicloNum}
                onChange={(e) => setCicloNum(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2 font-bold text-rose-300"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Toxicidad CTCAE v5.0 Reportada</label>
              <input
                type="text"
                value={toxicidadCtcae}
                onChange={(e) => setToxicidadCtcae(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-amber-300 rounded p-2 font-semibold"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Observaciones del Protocolo / Parámetros de Laboratorio (ANC/Plaquetas)</label>
              <textarea
                value={obsChemo}
                onChange={(e) => setObsChemo(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* PACS Native DICOM Viewer with RECIST Criteria */}
      <div className="pt-4 border-t border-slate-800 space-y-2">
        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4" /> Visor DICOM PACS: TAC / PET-CT & Medición Criterios RECIST 1.1
        </h4>
        <DicomViewer patientRegistrationId={effectivePatId} encounterId={encounterId} enableRECIST={true} />
      </div>
    </div>
  );
}
