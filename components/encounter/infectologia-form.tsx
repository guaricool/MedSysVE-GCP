"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  Activity,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Biohazard,
  FlaskConical,
  Calculator,
  ShieldCheck,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  patientRegId?: string;
  disabled?: boolean;
  initialData?: any;
}

interface AntibioticRow {
  antibiotico: string;
  interpretacion: "S" | "I" | "R";
  micUgMl: number;
}

const DEFAULT_ANTIBIOTICS: AntibioticRow[] = [
  { antibiotico: "Meropenem", interpretacion: "S", micUgMl: 0.25 },
  { antibiotico: "Amikacina", interpretacion: "S", micUgMl: 2.0 },
  { antibiotico: "Ceftriaxona", interpretacion: "R", micUgMl: 64.0 },
  { antibiotico: "Ciprofloxacina", interpretacion: "R", micUgMl: 16.0 },
  { antibiotico: "Piperacilina/Tazobactam", interpretacion: "I", micUgMl: 16.0 },
];

export function InfectologiaForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"ANTIBIOGRAMA" | "RENAL" | "CONTROL">("ANTIBIOGRAMA");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbAbgs = [], refetch: refetchAbgs } = (trpc.infecto.listAntibiograms.useQuery as any)({ patientRegistrationId: effectivePatId });
  const { data: dbRenals = [], refetch: refetchRenals } = (trpc.infecto.listRenalAdjustments.useQuery as any)({ patientRegistrationId: effectivePatId });
  const { data: dbCtrl, refetch: refetchCtrl } = (trpc.infecto.getInfectionControl.useQuery as any)({ encounterId });

  const saveAbgMut = (trpc.infecto.saveAntibiogram.useMutation as any)({ onSuccess: () => refetchAbgs() });
  const saveRenalMut = (trpc.infecto.saveRenalAdjustment.useMutation as any)({ onSuccess: () => refetchRenals() });
  const saveCtrlMut = (trpc.infecto.saveInfectionControl.useMutation as any)({ onSuccess: () => refetchCtrl() });

  // Antibiogram State
  const [tipoMuestra, setTipoMuestra] = useState("Hemocultivo Central");
  const [microorganismo, setMicroorganismo] = useState("Klebsiella pneumoniae BLEE (+)");
  const [panel, setPanel] = useState<AntibioticRow[]>(DEFAULT_ANTIBIOTICS);

  // Renal State
  const [creatinina, setCreatinina] = useState(1.8);
  const [clCr, setClCr] = useState(42.5);
  const [antimicrobiano, setAntimicrobiano] = useState("Vancomicina IV");
  const [dosisAjustada, setDosisAjustada] = useState("15 mg/kg cada 24 horas (Ajustado por ClCr 42.5 mL/min)");

  // Infection Control State
  const [aislamiento, setAislamiento] = useState("Aislamiento de Contacto + Gotas");
  const [germenMdr, setGermenMdr] = useState("KPC (Klebsiella pneumoniae productora de carbapenemasa)");
  const [notificadoEpidem, setNotificadoEpidem] = useState(true);
  const [obsCtrl, setObsCtrl] = useState("Habitación individual con presión negativa. Uso obligatorio de bata y guantes al ingreso.");

  useEffect(() => {
    if (dbCtrl) {
      setAislamiento(dbCtrl.tipoAislamiento);
      if (dbCtrl.germenMultidrogorresistenteMdr) setGermenMdr(dbCtrl.germenMultidrogorresistenteMdr);
      setNotificadoEpidem(dbCtrl.notificadoEpidemiologia);
      if (dbCtrl.observacionesControlInfeccion) setObsCtrl(dbCtrl.observacionesControlInfeccion);
    }
  }, [dbCtrl]);

  const handleAddAbgRow = () => {
    setPanel([...panel, { antibiotico: "Nuevo Antimicrobiano", interpretacion: "S", micUgMl: 1.0 }]);
  };

  const handleRemoveAbgRow = (index: number) => {
    setPanel(panel.filter((_, i) => i !== index));
  };

  const handleUpdateAbgRow = (index: number, field: keyof AntibioticRow, value: any) => {
    const next = [...panel];
    next[index] = { ...next[index], [field]: value };
    setPanel(next);
  };

  const handleSaveAbg = () => {
    saveAbgMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      tipoMuestra,
      microorganismoAislado: microorganismo,
      panelSensibilidadJson: panel,
    });
  };

  const handleSaveRenal = () => {
    saveRenalMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      creatininaSericaMgDl: creatinina,
      clearanceCreatininaMlMin: clCr,
      antimicrobianoEvaluado: antimicrobiano,
      dosisAjustadaRecomendada: dosisAjustada,
    });
  };

  const handleSaveCtrl = () => {
    saveCtrlMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      tipoAislamiento: aislamiento,
      germenMultidrogorresistenteMdr: germenMdr,
      notificadoEpidemiologia: notificadoEpidem,
      observacionesControlInfeccion: obsCtrl,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
            <Biohazard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Infectología & Control de Infecciones</h3>
            <p className="text-xs text-slate-400">Antibiograma Interactivo (MIC), Dosis Renal & Vigilancia Epidemiológica MDR</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveTab("ANTIBIOGRAMA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "ANTIBIOGRAMA"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5" /> Antibiograma & CMI ({dbAbgs.length})
        </button>

        <button
          onClick={() => setActiveTab("RENAL")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "RENAL"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Calculator className="w-3.5 h-3.5" /> Ajuste Renal Antimicrobiano ({dbRenals.length})
        </button>

        <button
          onClick={() => setActiveTab("CONTROL")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "CONTROL"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" /> Aislamiento & MDR
        </button>
      </div>

      {/* Tab 1: Antibiograma Interactivo */}
      {activeTab === "ANTIBIOGRAMA" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4" /> Antibiograma Interactivo & Panel de Sensibilidad (MIC)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Microorganismo aislado, interpretación S/I/R y CMI / MIC en µg/mL.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveAbg}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
            >
              Guardar Antibiograma
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tipo de Muestra Biolólgica</label>
              <input
                type="text"
                value={tipoMuestra}
                onChange={(e) => setTipoMuestra(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Microorganismo Aislado</label>
              <input
                type="text"
                value={microorganismo}
                onChange={(e) => setMicroorganismo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>
          </div>

          {/* Table of Antibiotics */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Panel de Antimicrobianos Evaluados:</span>
              <button
                onClick={handleAddAbgRow}
                className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Fármaco
              </button>
            </div>

            <div className="space-y-2">
              {panel.map((row, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-2 bg-slate-900 p-2 rounded border border-slate-800">
                  <input
                    type="text"
                    value={row.antibiotico}
                    onChange={(e) => handleUpdateAbgRow(idx, "antibiotico", e.target.value)}
                    className="flex-1 min-w-[150px] bg-slate-950 border border-slate-700 text-white rounded p-1.5"
                  />
                  <select
                    value={row.interpretacion}
                    onChange={(e) => handleUpdateAbgRow(idx, "interpretacion", e.target.value as any)}
                    className={`font-bold rounded p-1.5 text-xs ${
                      row.interpretacion === "S"
                        ? "bg-emerald-950 border-emerald-700 text-emerald-300"
                        : row.interpretacion === "I"
                        ? "bg-amber-950 border-amber-700 text-amber-300"
                        : "bg-red-950 border-red-700 text-red-300"
                    }`}
                  >
                    <option value="S">Sensible (S)</option>
                    <option value="I">Intermedio (I)</option>
                    <option value="R">Resistente (R)</option>
                  </select>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">CMI (µg/mL):</span>
                    <input
                      type="number"
                      step="0.01"
                      value={row.micUgMl}
                      onChange={(e) => handleUpdateAbgRow(idx, "micUgMl", Number(e.target.value))}
                      className="w-20 bg-slate-950 border border-slate-700 text-white rounded p-1.5"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveAbgRow(idx)}
                    className="p-1 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Ajuste Renal */}
      {activeTab === "RENAL" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> Calculadora de Ajuste Antimicrobiano Renal (ClCr)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Depuración de Creatinina (Cockcroft-Gault en mL/min) y dosificación de fármacos.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveRenal}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
            >
              Guardar Ajuste Renal
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Creatinina Sérica (mg/dL)</label>
              <input
                type="number"
                step="0.1"
                value={creatinina}
                onChange={(e) => setCreatinina(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Clearance de Creatinina (ClCr mL/min)</label>
              <input
                type="number"
                step="0.1"
                value={clCr}
                onChange={(e) => setClCr(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold text-purple-300 rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Antimicrobiano a Ajustar</label>
              <input
                type="text"
                value={antimicrobiano}
                onChange={(e) => setAntimicrobiano(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Dosis Ajustada Recomendada</label>
              <input
                type="text"
                value={dosisAjustada}
                onChange={(e) => setDosisAjustada(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold text-emerald-300 rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Control de Infecciones & Aislamiento */}
      {activeTab === "CONTROL" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Control de Infecciones & Vigilancia Epidemiológica MDR
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Precauciones de aislamiento hospitalario y notificación de gérmenes MDR.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveCtrl}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
            >
              Guardar Aislamiento & Control
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tipo de Aislamiento Hospitalario Requedido</label>
              <input
                type="text"
                value={aislamiento}
                onChange={(e) => setAislamiento(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Germen Multidrogorresistente (MDR / KPC / MRSA)</label>
              <input
                type="text"
                value={germenMdr}
                onChange={(e) => setGermenMdr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-red-300 rounded p-2 font-bold"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Indicaciones de Control & Barrera de Infección</label>
              <textarea
                value={obsCtrl}
                onChange={(e) => setObsCtrl(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                id="notificadoEpidem"
                checked={notificadoEpidem}
                onChange={(e) => setNotificadoEpidem(e.target.checked)}
                className="w-4 h-4 accent-purple-500 rounded"
              />
              <label htmlFor="notificadoEpidem" className="text-slate-300 font-semibold cursor-pointer">
                Caso Notificado al Comité de Infecciones / Epidemiología de Salud Pública
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
