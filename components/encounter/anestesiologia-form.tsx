"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Heart,
  Wind,
  Layers,
  Syringe,
  FileDown,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  patientRegId?: string;
  disabled?: boolean;
  initialData?: any;
}

const ASA_STATUS_OPTIONS = [
  "ASA I (Paciente sano sin patología de base)",
  "ASA II (Paciente con enfermedad sistémica leve controlada)",
  "ASA III (Paciente con enfermedad sistémica grave que limita actividad)",
  "ASA IV (Paciente con enfermedad sistémica grave con amenaza constante para la vida)",
  "ASA V (Paciente moribundo que no se espera que sobreviva 24h sin cirugía)",
  "ASA VI (Paciente con muerte cerebral declarada para donación de órganos)",
];

const MALLAMPATI_OPTIONS = [
  "Clase I (Visibilidad total del paladar blando, úvula, pilares y amígdalas)",
  "Clase II (Visibilidad de paladar blando, úvula y fauces)",
  "Clase III (Visibilidad de paladar blando y base de la úvula)",
  "Clase IV (Solo es visible el paladar duro)",
];

export function AnestesiologiaForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"PREEVAL" | "VIA_AEREA" | "INTRAOP">("PREEVAL");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbPre, refetch: refetchPre } = (trpc.anesthesia.getPreEval.useQuery as any)({ encounterId });
  const { data: dbAirway, refetch: refetchAirway } = (trpc.anesthesia.getAirwayAssessment.useQuery as any)({ encounterId });
  const { data: dbIntra, refetch: refetchIntra } = (trpc.anesthesia.getIntraopRecord.useQuery as any)({ encounterId });

  const savePreMut = (trpc.anesthesia.savePreEval.useMutation as any)({ onSuccess: () => refetchPre() });
  const saveAirwayMut = (trpc.anesthesia.saveAirwayAssessment.useMutation as any)({ onSuccess: () => refetchAirway() });
  const saveIntraMut = (trpc.anesthesia.saveIntraopRecord.useMutation as any)({ onSuccess: () => refetchIntra() });

  // PreEval State
  const [asa, setAsa] = useState("ASA II (Paciente con enfermedad sistémica leve controlada)");
  const [isEmergency, setIsEmergency] = useState(false);
  const [ayuno, setAyuno] = useState(8);
  const [antecedentes, setAntecedentes] = useState("Sin complicaciones en anestesias previas. Negativo a hipertermia maligna.");
  const [riesgoCardio, setRiesgoCardio] = useState("Riesgo Bajo (Índice de Lee - RCRI 0 puntos)");

  // Airway State
  const [mallampati, setMallampati] = useState("Clase I (Visibilidad total del paladar blando, úvula, pilares y amígdalas)");
  const [distanciaTiro, setDistanciaTiro] = useState(65);
  const [aperturaBucal, setAperturaBucal] = useState(45);
  const [movilidadCervical, setMovilidadCervical] = useState("Conservada (> 35° de extensión)");
  const [protrusion, setProtrusion] = useState("Clase I (Incisivos inferiores protruyen más allá de los superiores)");

  // Intraop State
  const [tecnica, setTecnica] = useState("General Balanceada (Inhalatoria + Intravenosa)");
  const [agentes, setAgentes] = useState("Propofol 150mg IV, Fentanilo 200mcg IV, Rocuronio 50mg IV, Sevoflurano 1.8-2.0 CAM.");
  const [monitoreo, setMonitoreo] = useState("ECG 5 derivaciones, PNI cada 5 min, SpO2, EtCO2, BIS (40-60).");
  const [eventos, setEventos] = useState("Intubación endotraqueal al primer intento con tubo 7.5. Hemodinamia estable.");

  useEffect(() => {
    if (dbPre) {
      setAsa(dbPre.asaPhysicalStatus);
      setIsEmergency(dbPre.isEmergency);
      if (dbPre.horasAyuno) setAyuno(dbPre.horasAyuno);
      if (dbPre.antecedentesAnestesicos) setAntecedentes(dbPre.antecedentesAnestesicos);
      if (dbPre.riesgoCardiovascular) setRiesgoCardio(dbPre.riesgoCardiovascular);
    }
  }, [dbPre]);

  useEffect(() => {
    if (dbAirway) {
      setMallampati(dbAirway.mallampatiClass);
      if (dbAirway.distanciaTiromentonianaMm) setDistanciaTiro(dbAirway.distanciaTiromentonianaMm);
      if (dbAirway.aperturaBucalMm) setAperturaBucal(dbAirway.aperturaBucalMm);
      setMovilidadCervical(dbAirway.movilidadCervical);
      setProtrusion(dbAirway.protrusionMandibular);
    }
  }, [dbAirway]);

  useEffect(() => {
    if (dbIntra) {
      setTecnica(dbIntra.tecnicaAnestesica);
      setAgentes(dbIntra.agentesUtilizados);
      setMonitoreo(dbIntra.monitoreoUtilizado);
      if (dbIntra.eventosRelevantes) setEventos(dbIntra.eventosRelevantes);
    }
  }, [dbIntra]);

  const handleSavePre = () => {
    savePreMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      asaPhysicalStatus: asa,
      isEmergency,
      horasAyuno: ayuno,
      antecedentesAnestesicos: antecedentes,
      riesgoCardiovascular: riesgoCardio,
    });
  };

  const handleSaveAirway = () => {
    saveAirwayMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      mallampatiClass: mallampati,
      distanciaTiromentonianaMm: distanciaTiro,
      aperturaBucalMm: aperturaBucal,
      movilidadCervical,
      protrusionMandibular: protrusion,
    });
  };

  const handleSaveIntra = () => {
    saveIntraMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      tecnicaAnestesica: tecnica,
      agentesUtilizados: agentes,
      monitoreoUtilizado: monitoreo,
      eventosRelevantes: eventos,
    });
  };

  const isVadPredictive = mallampati.includes("III") || mallampati.includes("IV") || distanciaTiro < 60 || aperturaBucal < 35;

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
            <Syringe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Evaluación de Anestesiología</h3>
            <p className="text-xs text-slate-400">Valoración Preanestésica ASA, Vía Aérea Difícil (VAD) & Registro Intraoperatorio</p>
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
          onClick={() => setActiveTab("PREEVAL")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "PREEVAL"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" /> Valoración Preanestésica ASA
        </button>

        <button
          onClick={() => setActiveTab("VIA_AEREA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "VIA_AEREA"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Wind className="w-3.5 h-3.5" /> Predictor Vía Aérea Difícil (VAD)
        </button>

        <button
          onClick={() => setActiveTab("INTRAOP")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "INTRAOP"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Registro Anestésico Intraoperatorio
        </button>
      </div>

      {/* Tab 1: Valoración Preanestésica ASA */}
      {activeTab === "PREEVAL" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Clasificación del Estado Físico ASA & Riesgo Quirúrgico
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Estratificación del estado fisiológico del paciente previa al acto quirúrgico.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSavePre}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
            >
              Guardar Preanestesia
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Estado Físico ASA (I - VI)</label>
              <select
                value={asa}
                onChange={(e) => setAsa(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              >
                {ASA_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Horas de Ayuno Preoperatorio</label>
              <input
                type="number"
                min="0"
                value={ayuno}
                onChange={(e) => setAyuno(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Antecedentes Anestésicos & Alergias</label>
              <input
                type="text"
                value={antecedentes}
                onChange={(e) => setAntecedentes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Riesgo Cardiovascular (Índice de Lee / RCRI)</label>
              <input
                type="text"
                value={riesgoCardio}
                onChange={(e) => setRiesgoCardio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                id="isEmergency"
                checked={isEmergency}
                onChange={(e) => setIsEmergency(e.target.checked)}
                className="w-4 h-4 accent-red-500 rounded"
              />
              <label htmlFor="isEmergency" className="text-slate-300 font-semibold cursor-pointer">
                Cirugía de Urgencia / Emergencia (Modificador ASA &apos;E&apos;)
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Vía Aérea Difícil (VAD) */}
      {activeTab === "VIA_AEREA" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wind className="w-4 h-4" /> Evaluación Predictiva de Vía Aérea Difícil (VAD)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Mallampati, Patil-Aldreti (Tiromentoniana), Apertura bucal y movilidad cervical.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveAirway}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
            >
              Guardar Vía Aérea
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-300">Clasificación de Mallampati</label>
                <select
                  value={mallampati}
                  onChange={(e) => setMallampati(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2 mt-1"
                >
                  {MALLAMPATI_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-[10px]">Distancia Tiromentoniana (mm):</label>
                  <input
                    type="number"
                    value={distanciaTiro}
                    onChange={(e) => setDistanciaTiro(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded p-1.5 mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px]">Apertura Bucal (mm):</label>
                  <input
                    type="number"
                    value={aperturaBucal}
                    onChange={(e) => setAperturaBucal(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded p-1.5 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Predictor VAD Alert */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-center text-center">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Pronóstico de Vía Aérea:</span>
              <span className={`text-xl font-extrabold ${isVadPredictive ? "text-red-400" : "text-emerald-400"}`}>
                {isVadPredictive ? "🚨 Predicción de Vía Aérea Difícil (VAD)" : "🟢 Vía Aérea Normal / Fácil Intubación"}
              </span>
              <p className="text-[10px] text-slate-400">
                {isVadPredictive ? "Preparar carro de VAD, videolaringoscopio y mascarilla laríngea de rescate." : "Criterios anatómicos dentro de parámetros fisiológicos estándar."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Registro Intraoperatorio */}
      {activeTab === "INTRAOP" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> Registro Anestésico Intraoperatorio
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Técnica quirúrgica, drogas administradas y monitorización.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveIntra}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
            >
              Guardar Registro Intraoperatorio
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Técnica Anestésica Principal</label>
              <input
                type="text"
                value={tecnica}
                onChange={(e) => setTecnica(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Monitoreo Intraoperatorio Utilizado</label>
              <input
                type="text"
                value={monitoreo}
                onChange={(e) => setMonitoreo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Agentes / Fármacos Anestésicos Administrados</label>
              <textarea
                value={agentes}
                onChange={(e) => setAgentes(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Eventos Relevantes / Complicaciones Intraoperatorias</label>
              <textarea
                value={eventos}
                onChange={(e) => setEventos(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
