"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Siren,
  HeartPulse,
  Zap,
  Timer,
  ShieldAlert,
  AlertOctagon,
  CheckCircle2,
  Activity,
  Plus,
  Flame,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  patientRegId?: string;
  disabled?: boolean;
  initialData?: any;
}

const ESI_LEVELS = [
  { level: 1, color: "Rojo (ESI Level 1 - Resucitación)", bg: "bg-red-600 text-white", wait: "0 min (Inmediato)" },
  { level: 2, color: "Naranja (ESI Level 2 - Emergencia)", bg: "bg-orange-500 text-white", wait: "< 10 min" },
  { level: 3, color: "Amarillo (ESI Level 3 - Urgente)", bg: "bg-amber-400 text-slate-950", wait: "< 30 min" },
  { level: 4, color: "Verde (ESI Level 4 - Menor)", bg: "bg-emerald-500 text-slate-950", wait: "< 60 min" },
  { level: 5, color: "Azul (ESI Level 5 - No Urgente)", bg: "bg-sky-500 text-white", wait: "< 120 min" },
];

const INITIAL_RHYTHMS = [
  "FV (Fibrilación Ventricular)",
  "TVSP (Taquicardia Ventricular Sin Pulso)",
  "Asistolia",
  "AESP (Actividad Eléctrica Sin Pulso)",
];

const FAST_PROTOCOLS = [
  "Código Infarto IAM con Elevación del ST (IAMCEST)",
  "Código Ictus Isquémico Agudo (NIHSS)",
  "Shock Séptico (Resucitación Guiada por Metas / Surviving Sepsis)",
  "Cetoacidosis Diabética CAD / Estado Hiperosmolar",
  "Sepsis / Abdomen Agudo Quirúrgico",
];

export function EmergenciasForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"TRIAGE" | "RCP" | "PROTOCOLOS">("TRIAGE");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbTriage, refetch: refetchTriage } = (trpc.emerg.getTriageAssessment.useQuery as any)({ encounterId });
  const { data: dbResus, refetch: refetchResus } = (trpc.emerg.getResusCode.useQuery as any)({ encounterId });
  const { data: dbProtocol, refetch: refetchProtocol } = (trpc.emerg.getFastProtocol.useQuery as any)({ encounterId });

  const saveTriageMut = (trpc.emerg.saveTriageAssessment.useMutation as any)({ onSuccess: () => refetchTriage() });
  const saveResusMut = (trpc.emerg.saveResusCode.useMutation as any)({ onSuccess: () => refetchResus() });
  const saveProtocolMut = (trpc.emerg.saveFastProtocol.useMutation as any)({ onSuccess: () => refetchProtocol() });

  // Triage State
  const [esi, setEsi] = useState(2);
  const [complaint, setComplaint] = useState("Dolor torácico opresivo irradiado a mandíbula con diaforesis y disnea aguda.");
  const [glasgow, setGlasgow] = useState(15);

  const selectedEsiObj = useMemo(() => {
    return ESI_LEVELS.find((l) => l.level === esi) || ESI_LEVELS[1];
  }, [esi]);

  // RCP / Resus State
  const [rhythm, setRhythm] = useState("FV (Fibrilación Ventricular)");
  const [shocks, setShocks] = useState(3);
  const [joules, setJoules] = useState(200);
  const [epiDoses, setEpiDoses] = useState(2);
  const [amiodarone, setAmiodarone] = useState(1);
  const [rosc, setRosc] = useState(true);
  const [resusDuration, setResusDuration] = useState(14);

  // Fast Protocol State
  const [protocolType, setProtocolType] = useState("Código Infarto IAM con Elevación del ST (IAMCEST)");
  const [doorNeedleMin, setDoorNeedleMin] = useState(35);
  const [thrombolytic, setThrombolytic] = useState("Estreptoquinasa 1.5 Millones UI IV en 60 min");
  const [vasopressor, setVasopressor] = useState("Noradrenalina infusión continua a 0.1 mcg/kg/min");
  const [fluids, setFluids] = useState(1.5);
  const [protocolStatus, setProtocolStatus] = useState("Completado con Criterios de Reperfusión Positivos");

  useEffect(() => {
    if (dbTriage) {
      setEsi(dbTriage.esiLevel);
      setComplaint(dbTriage.chiefComplaint);
      if (dbTriage.glasgowComaScale !== null) setGlasgow(dbTriage.glasgowComaScale);
    }
  }, [dbTriage]);

  useEffect(() => {
    if (dbResus) {
      setRhythm(dbResus.initialRhythm);
      setShocks(dbResus.shocksDelivered);
      if (dbResus.joulesPerShock !== null) setJoules(dbResus.joulesPerShock);
      setEpiDoses(dbResus.epinephrineDoses);
      setAmiodarone(dbResus.amiodaroneDoses);
      setRosc(dbResus.roscAchieved);
      if (dbResus.resusDurationMin !== null) setResusDuration(dbResus.resusDurationMin);
    }
  }, [dbResus]);

  useEffect(() => {
    if (dbProtocol) {
      setProtocolType(dbProtocol.protocolType);
      if (dbProtocol.doorToNeedleTimeMin !== null) setDoorNeedleMin(dbProtocol.doorToNeedleTimeMin);
      if (dbProtocol.thrombolyticAgent) setThrombolytic(dbProtocol.thrombolyticAgent);
      if (dbProtocol.vasopressorUsed) setVasopressor(dbProtocol.vasopressorUsed);
      if (dbProtocol.fluidResusLiters !== null) setFluids(dbProtocol.fluidResusLiters);
      setProtocolStatus(dbProtocol.protocolStatus);
    }
  }, [dbProtocol]);

  const handleSaveTriage = () => {
    saveTriageMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      esiLevel: esi,
      triageColor: selectedEsiObj.color,
      chiefComplaint: complaint,
      targetWaitTimeMin: esi === 1 ? 0 : esi === 2 ? 10 : esi === 3 ? 30 : esi === 4 ? 60 : 120,
      glasgowComaScale: glasgow,
    });
  };

  const handleSaveResus = () => {
    saveResusMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      initialRhythm: rhythm,
      shocksDelivered: shocks,
      joulesPerShock: joules,
      epinephrineDoses: epiDoses,
      amiodaroneDoses: amiodarone,
      roscAchieved: rosc,
      resusDurationMin: resusDuration,
    });
  };

  const handleSaveProtocol = () => {
    saveProtocolMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      protocolType,
      doorToNeedleTimeMin: doorNeedleMin,
      thrombolyticAgent: thrombolytic,
      vasopressorUsed: vasopressor,
      fluidResusLiters: fluids,
      protocolStatus,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
            <Siren className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Medicina de Emergencia & Reanimación Aguda</h3>
            <p className="text-xs text-slate-400">Triage Estructurado (ESI 1-5), Bitácora de RCP en Vivo & Protocolos Rápidos Puerta-Aguja</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveTab("TRIAGE")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "TRIAGE"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Siren className="w-3.5 h-3.5" /> Triage Estructurado ESI
        </button>

        <button
          onClick={() => setActiveTab("RCP")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "RCP"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> Bitácora RCP & Reanimación
        </button>

        <button
          onClick={() => setActiveTab("PROTOCOLOS")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "PROTOCOLOS"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Timer className="w-3.5 h-3.5" /> Protocolos Rápidos Puerta-Aguja
        </button>
      </div>

      {/* Tab 1: Triage Estructurado (ESI Level 1 - 5) */}
      {activeTab === "TRIAGE" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Siren className="w-4 h-4" /> Clasificación de Triage ESI (Emergency Severity Index)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Asignación inmediata de nivel de prioridad y tiempo objetivo de atención.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveTriage}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
            >
              Guardar Triage
            </Button>
          </div>

          <div className="space-y-3">
            <span className="font-semibold text-slate-300 block text-xs">Seleccionar Nivel de Prioridad ESI:</span>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {ESI_LEVELS.map((item) => (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => setEsi(item.level)}
                  className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all ${
                    esi === item.level
                      ? `${item.bg} border-white shadow-lg scale-105 font-bold`
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <span className="text-xs uppercase font-extrabold">ESI {item.level}</span>
                  <span className="text-[11px] font-medium mt-1">{item.wait}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs pt-2">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Motivo de Consulta Principal (Triado)</label>
              <textarea
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-slate-300">Escala de Coma de Glasgow (3 - 15)</label>
                <span className="font-bold text-rose-400 text-sm">{glasgow} / 15 pts</span>
              </div>
              <input
                type="range"
                min="3"
                max="15"
                value={glasgow}
                onChange={(e) => setGlasgow(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>3 (Coma Profundo)</span>
                <span>8 (Intubación)</span>
                <span>15 (Alerta)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Bitácora RCP & Reanimación */}
      {activeTab === "RCP" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> Bitácora de Paro Cardiorrespiratorio & Reanimación (RCP ACLS)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Trazabilidad en tiempo real de desfibrilaciones, fármacos y retorno a circulación espontánea.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveResus}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
            >
              Guardar Registro RCP
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Ritmo Inicial de Paro</label>
              <select
                value={rhythm}
                onChange={(e) => setRhythm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              >
                {INITIAL_RHYTHMS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Descargas Eléctricas Administradas</label>
              <input
                type="number"
                value={shocks}
                onChange={(e) => setShocks(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Energía por Descarga (Joules J)</label>
              <input
                type="number"
                step="50"
                value={joules}
                onChange={(e) => setJoules(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Bolos de Adrenalina 1mg IV</label>
              <input
                type="number"
                value={epiDoses}
                onChange={(e) => setEpiDoses(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-rose-400 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Bolos de Amiodarona (300mg / 150mg)</label>
              <input
                type="number"
                value={amiodarone}
                onChange={(e) => setAmiodarone(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-purple-300 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Duración Total RCP (Minutos)</label>
              <input
                type="number"
                value={resusDuration}
                onChange={(e) => setResusDuration(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="md:col-span-3 bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-300">Retorno a la Circulación Espontánea (RCE / ROSC):</span>
              <button
                type="button"
                onClick={() => setRosc(!rosc)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  rosc ? "bg-emerald-500 text-slate-950" : "bg-rose-600 text-white"
                }`}
              >
                {rosc ? "✓ RCE LOGRADO (Pulso Restablecido)" : "✕ Sin RCE / Paro En Curso"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Protocolos Rápidos Puerta-Aguja */}
      {activeTab === "PROTOCOLOS" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Timer className="w-4 h-4" /> Protocolos de Emergencia Tiempos Puerta-Aguja
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Control estricto de tiempo a reperfusión en IAMCEST, Ictus, Shock Séptico y Cetoacidosis.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveProtocol}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
            >
              Guardar Protocolo
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tipo de Protocolo de Emergencia Activado</label>
              <select
                value={protocolType}
                onChange={(e) => setProtocolType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              >
                {FAST_PROTOCOLS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tiempo Puerta-Aguja / Puerta-Balón (Minutos)</label>
              <input
                type="number"
                value={doorNeedleMin}
                onChange={(e) => setDoorNeedleMin(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-rose-400 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Agente Trombolítico Administrado</label>
              <input
                type="text"
                value={thrombolytic}
                onChange={(e) => setThrombolytic(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Soporte Vasopresor / Inotrópico</label>
              <input
                type="text"
                value={vasopressor}
                onChange={(e) => setVasopressor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Resucitación con Fluidos Cristaloides (Litros)</label>
              <input
                type="number"
                step="0.5"
                value={fluids}
                onChange={(e) => setFluids(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-sky-300 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Estado del Protocolo Clínico</label>
              <input
                type="text"
                value={protocolStatus}
                onChange={(e) => setProtocolStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-emerald-300 font-bold rounded p-2"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
