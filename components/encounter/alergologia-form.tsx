"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  TestTube,
  Syringe,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  Layers,
  FileDown,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  patientRegId?: string;
  disabled?: boolean;
  initialData?: any;
}

const PRICK_ALLERGENS = [
  { key: "D_pteronyssinus", category: "Ácaros", label: "Dermatophagoides pteronyssinus" },
  { key: "D_farinae", category: "Ácaros", label: "Dermatophagoides farinae" },
  { key: "Blomia_tropicalis", category: "Ácaros", label: "Blomia tropicalis" },
  { key: "Alternaria_tenuis", category: "Hongos", label: "Alternaria tenuis" },
  { key: "Aspergillus_fumigatus", category: "Hongos", label: "Aspergillus fumigatus" },
  { key: "Epitelio_Gato", category: "Epitelios", label: "Epitelio de Gato" },
  { key: "Epitelio_Perro", category: "Epitelios", label: "Epitelio de Perro" },
  { key: "Polenes_Gramineas", category: "Pólenes", label: "Pólenes de Gramíneas / Maleza" },
];

export function AlergologiaForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"PRICK" | "INMUNOTERAPIA" | "PANEL">("PRICK");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbPrick, refetch: refetchPrick } = (trpc.allergy.getPrickTest.useQuery as any)({ encounterId });
  const { data: dbImmunotherapies = [], refetch: refetchImmu } = (trpc.allergy.listImmunotherapies.useQuery as any)({ patientRegistrationId: effectivePatId });
  const { data: dbIgPanel, refetch: refetchIg } = (trpc.allergy.getIgPanel.useQuery as any)({ encounterId });

  const savePrickMut = (trpc.allergy.savePrickTest.useMutation as any)({ onSuccess: () => refetchPrick() });
  const saveImmuMut = (trpc.allergy.saveImmunotherapy.useMutation as any)({ onSuccess: () => refetchImmu() });
  const saveIgMut = (trpc.allergy.saveIgPanel.useMutation as any)({ onSuccess: () => refetchIg() });

  // Prick Test State
  const [histamineMm, setHistamineMm] = useState(7.0);
  const [salineMm, setSalineMm] = useState(0.0);
  const [papuleMm, setPapuleMm] = useState<Record<string, number>>({
    D_pteronyssinus: 8.0,
    D_farinae: 6.0,
    Blomia_tropicalis: 9.0,
    Alternaria_tenuis: 4.0,
    Aspergillus_fumigatus: 0,
    Epitelio_Gato: 7.0,
    Epitelio_Perro: 0,
    Polenes_Gramineas: 3.0,
  });

  const positiveCount = useMemo(() => {
    return Object.values(papuleMm).filter((mm) => mm >= 3.0).length;
  }, [papuleMm]);

  // Immunotherapy State
  const [therapyRoute, setTherapyRoute] = useState("SLIT Sublingual (Gotas bajo la lengua)");
  const [extract, setExtract] = useState("Mezcla Ácaros (D.pteronyssinus 50% + Blomia 50%)");
  const [phase, setPhase] = useState("Fase de Mantenimiento (Frasco Concentrado Rojo)");
  const [vial, setVial] = useState("Concentración Máxima 100.000 DPT/ml");
  const [dose, setDose] = useState("5 gotas diarias por 3 años");
  const [localReaction, setLocalReaction] = useState(0);
  const [systemicReaction, setSystemicReaction] = useState("Sin reacciones adversas / Tolerancia excelente");

  // Immunoglobulin Panel State
  const [ige, setIge] = useState(850.0);
  const [igg, setIgg] = useState(1120.0);
  const [iga, setIga] = useState(210.0);
  const [igm, setIgm] = useState(145.0);
  const [c3, setC3] = useState(115.0);
  const [c4, setC4] = useState(28.0);
  const [immunodeficiency, setImmunodeficiency] = useState("Atopia Severa Hiper-IgE (Rinitis & Asma Alérgica)");

  useEffect(() => {
    if (dbPrick) {
      setHistamineMm(dbPrick.histamineControlMm);
      setSalineMm(dbPrick.salineControlMm);
      if (dbPrick.dustMitesJson) {
        try {
          const parsed = JSON.parse(dbPrick.dustMitesJson);
          setPapuleMm((prev) => ({ ...prev, ...parsed }));
        } catch (e) {}
      }
    }
  }, [dbPrick]);

  useEffect(() => {
    if (dbIgPanel) {
      if (dbIgPanel.totalIgEKuiL !== null) setIge(dbIgPanel.totalIgEKuiL);
      if (dbIgPanel.totalIgGMgDl !== null) setIgg(dbIgPanel.totalIgGMgDl);
      if (dbIgPanel.totalIgAMgDl !== null) setIga(dbIgPanel.totalIgAMgDl);
      if (dbIgPanel.totalIgMMgDl !== null) setIgm(dbIgPanel.totalIgMMgDl);
      if (dbIgPanel.c3ComplementMgDl !== null) setC3(dbIgPanel.c3ComplementMgDl);
      if (dbIgPanel.c4ComplementMgDl !== null) setC4(dbIgPanel.c4ComplementMgDl);
      if (dbIgPanel.immunodeficiencyDiagnosis) setImmunodeficiency(dbIgPanel.immunodeficiencyDiagnosis);
    }
  }, [dbIgPanel]);

  const handleSavePrick = () => {
    savePrickMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      histamineControlMm: histamineMm,
      salineControlMm: salineMm,
      dustMitesJson: JSON.stringify(papuleMm),
      positiveReactionsCount: positiveCount,
    });
  };

  const handleAddImmunotherapy = () => {
    saveImmuMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      therapyRoute,
      allergenicExtract: extract,
      phase,
      vialConcentration: vial,
      doseAmount: dose,
      localReactionMm: localReaction,
      systemicReaction,
    });
  };

  const handleSaveIg = () => {
    saveIgMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      totalIgEKuiL: ige,
      totalIgGMgDl: igg,
      totalIgAMgDl: iga,
      totalIgMMgDl: igm,
      c3ComplementMgDl: c3,
      c4ComplementMgDl: c4,
      immunodeficiencyDiagnosis: immunodeficiency,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-teal-500/10 border border-teal-500/30 rounded-lg text-teal-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Alergología e Inmunología Clínica</h3>
            <p className="text-xs text-slate-400">Prick Test de Alérgenos Cutáneos, Vacunas de Inmunoterapia & Serología IgE/IgG/IgA/IgM</p>
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
          onClick={() => setActiveTab("PRICK")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "PRICK"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <TestTube className="w-3.5 h-3.5" /> Prick Test Cutáneo
        </button>

        <button
          onClick={() => setActiveTab("INMUNOTERAPIA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "INMUNOTERAPIA"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Syringe className="w-3.5 h-3.5" /> Inmunoterapia ({dbImmunotherapies.length})
        </button>

        <button
          onClick={() => setActiveTab("PANEL")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "PANEL"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Inmunoglobulinas (IgE)
        </button>
      </div>

      {/* Tab 1: Prick Test Cutáneo */}
      {activeTab === "PRICK" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <TestTube className="w-4 h-4" /> Medición de Pápulas en Prick Test Cutáneo (mm)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Control positivo (Histamina) y negativo (Salino) con reactividad a alérgenos (≥ 3mm = Positivo).</p>
            </div>
            <Button
              size="sm"
              onClick={handleSavePrick}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs"
            >
              Guardar Prick Test
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <label className="font-semibold text-teal-300 block">Histamina 10mg/ml (Control +)</label>
              <input
                type="number"
                step="0.5"
                value={histamineMm}
                onChange={(e) => setHistamineMm(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-teal-300 font-bold rounded p-1.5 text-center"
              />
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <label className="font-semibold text-slate-400 block">Salino Fisiológico (Control -)</label>
              <input
                type="number"
                step="0.5"
                value={salineMm}
                onChange={(e) => setSalineMm(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-slate-400 font-bold rounded p-1.5 text-center"
              />
            </div>

            <div className="sm:col-span-2 bg-slate-950 p-3 rounded-lg border border-teal-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold block uppercase">Alérgenos Positivos (≥ 3mm)</span>
                <span className="text-xl font-bold text-teal-300">{positiveCount} de 8 evaluados</span>
              </div>
              <span className="font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded text-xs">
                Sensibilización Múltiple (Atopia)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {PRICK_ALLERGENS.map((item) => {
              const mm = papuleMm[item.key] || 0;
              const isPositive = mm >= 3.0;
              return (
                <div key={item.key} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">{item.category}</span>
                    <span className="font-semibold text-slate-200">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={mm}
                      onChange={(e) => setPapuleMm({ ...papuleMm, [item.key]: Number(e.target.value) })}
                      className={`w-16 text-center font-bold rounded p-1 border ${
                        isPositive
                          ? "bg-amber-950/80 border-amber-500 text-amber-200"
                          : "bg-slate-900 border-slate-700 text-slate-400"
                      }`}
                    />
                    <span className="text-xs font-semibold text-slate-400">mm</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Inmunoterapia */}
      {activeTab === "INMUNOTERAPIA" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <Syringe className="w-4 h-4" /> Registro & Esquema de Vacunas de Inmunoterapia
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Trazabilidad de desensibilización por vía sublingual (SLIT) o subcutánea (SCIT).</p>
            </div>
            <Button
              size="sm"
              onClick={handleAddImmunotherapy}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Prescribir Vacuna
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Vía de Administración</label>
              <input
                type="text"
                value={therapyRoute}
                onChange={(e) => setTherapyRoute(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Extracto Alergénico Específico</label>
              <input
                type="text"
                value={extract}
                onChange={(e) => setExtract(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-teal-300 font-bold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Fase del Esquema</label>
              <input
                type="text"
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Concentración / Dilución del Frasco</label>
              <input
                type="text"
                value={vial}
                onChange={(e) => setVial(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded p-2"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-300">Dosis e Pauta Posológica</label>
              <input
                type="text"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-300">Monitoreo de Reacción Adversa o Tolerancia</label>
              <input
                type="text"
                value={systemicReaction}
                onChange={(e) => setSystemicReaction(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-emerald-300 rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Panel de Inmunoglobulinas */}
      {activeTab === "PANEL" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Panel de Inmunoglobulinas & Complemento
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Niveles serológicos de IgE total, IgG, IgA, IgM y complemento C3/C4.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveIg}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs"
            >
              Guardar Panel Ig
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">IgE Total (KUI/L)</label>
              <input
                type="number"
                step="10"
                value={ige}
                onChange={(e) => setIge(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">IgG Total (mg/dL)</label>
              <input
                type="number"
                step="10"
                value={igg}
                onChange={(e) => setIgg(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">IgA Total (mg/dL)</label>
              <input
                type="number"
                step="5"
                value={iga}
                onChange={(e) => setIga(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">IgM Total (mg/dL)</label>
              <input
                type="number"
                step="5"
                value={igm}
                onChange={(e) => setIgm(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Complemento C3 (mg/dL)</label>
              <input
                type="number"
                step="1"
                value={c3}
                onChange={(e) => setC3(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-sky-300 font-bold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Complemento C4 (mg/dL)</label>
              <input
                type="number"
                step="1"
                value={c4}
                onChange={(e) => setC4(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-sky-300 font-bold rounded p-2"
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="font-semibold text-slate-300">Diagnóstico Inmunológico / Fenotipo de Atopia</label>
              <input
                type="text"
                value={immunodeficiency}
                onChange={(e) => setImmunodeficiency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-teal-300 font-bold rounded p-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
