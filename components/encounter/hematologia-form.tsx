"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Droplet,
  Microscope,
  Activity,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Award,
  ShieldAlert,
  FileSpreadsheet,
  FileDown,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  patientRegId?: string;
  disabled?: boolean;
  initialData?: any;
}

const BLOOD_COMPONENTS = [
  "Concentrado Globular CG Desleucocitado",
  "Plaquetas por Aféresis / Pool Plaquetario",
  "Plasma Fresco Congelado PFC",
  "Crioprecipitado (Factor VIII / Fibrinógeno)",
  "Sangre Total / Exanguinotransfusión",
];

const ABO_RH_GROUPS = [
  "O Positivo (O+)",
  "O Negativo (O-)",
  "A Positivo (A+)",
  "A Negativo (A-)",
  "B Positivo (B+)",
  "B Negativo (B-)",
  "AB Positivo (AB+)",
  "AB Negativo (AB-)",
];

export function HematologiaForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"FROTIS" | "FALCIFORME" | "TRANSFUSION">("FROTIS");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbSmear, refetch: refetchSmear } = (trpc.hema.getPeripheralSmear.useQuery as any)({ encounterId });
  const { data: dbSickle, refetch: refetchSickle } = (trpc.hema.getSickleCellModule.useQuery as any)({ encounterId });
  const { data: dbTransfusions = [], refetch: refetchTransfusions } = (trpc.hema.listTransfusions.useQuery as any)({ patientRegistrationId: effectivePatId });

  const saveSmearMut = (trpc.hema.savePeripheralSmear.useMutation as any)({ onSuccess: () => refetchSmear() });
  const saveSickleMut = (trpc.hema.saveSickleCellModule.useMutation as any)({ onSuccess: () => refetchSickle() });
  const saveTransfusionMut = (trpc.hema.saveTransfusion.useMutation as any)({ onSuccess: () => refetchTransfusions() });

  // Frotis State
  const [redSeries, setRedSeries] = useState("Abundantes Drepanocitos (Sickle cells 15%), Dacrocitos +, Hipocromía ++");
  const [whiteSeries, setWhiteSeries] = useState("Leucocitosis reactiva 14.500/mm3 con neutrofilia sin blastos");
  const [plateletSeries, setPlateletSeries] = useState("Trombocitosis reactiva 480.000/mm3 sin agregados");
  const [blastPercent, setBlastPercent] = useState(0);

  // Drepanocitosis State
  const [hbS, setHbS] = useState(82.5);
  const [hbA, setHbA] = useState(0.0);
  const [hbF, setHbF] = useState(14.2);
  const [reticulocytes, setReticulocytes] = useState(8.5);
  const [crisesYear, setCrisesYear] = useState(3);
  const [hydroxyureaMg, setHydroxyureaMg] = useState(1000);
  const [hypertransfusionActive, setHypertransfusionActive] = useState(true);

  // Transfusion State
  const [compType, setCompType] = useState("Concentrado Globular CG Desleucocitado");
  const [units, setUnits] = useState(2);
  const [bloodGroup, setBloodGroup] = useState("O Positivo (O+)");
  const [crossmatch, setCrossmatch] = useState("Compatible / Coombs Directo Negativo");
  const [adverse, setAdverse] = useState("Sin reacciones adversas / Tolerado adecuadamente");

  useEffect(() => {
    if (dbSmear) {
      setRedSeries(dbSmear.redSeriesFindings);
      setWhiteSeries(dbSmear.whiteSeriesFindings);
      setPlateletSeries(dbSmear.plateletSeriesFindings);
      if (dbSmear.blastPercentage !== null) setBlastPercent(dbSmear.blastPercentage);
    }
  }, [dbSmear]);

  useEffect(() => {
    if (dbSickle) {
      setHbS(dbSickle.hbSPercent);
      setHbA(dbSickle.hbAPercent);
      setHbF(dbSickle.hbFPercent);
      if (dbSickle.reticulocytePercent !== null) setReticulocytes(dbSickle.reticulocytePercent);
      setCrisesYear(dbSickle.vasoocclusiveCrisisYear);
      if (dbSickle.hydroxyureaDoseMgDay !== null) setHydroxyureaMg(dbSickle.hydroxyureaDoseMgDay);
      setHypertransfusionActive(dbSickle.transfusionProgramActive);
    }
  }, [dbSickle]);

  const handleSaveSmear = () => {
    saveSmearMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      redSeriesFindings: redSeries,
      whiteSeriesFindings: whiteSeries,
      plateletSeriesFindings: plateletSeries,
      blastPercentage: blastPercent,
    });
  };

  const handleSaveSickle = () => {
    saveSickleMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      hbSPercent: hbS,
      hbAPercent: hbA,
      hbFPercent: hbF,
      reticulocytePercent: reticulocytes,
      vasoocclusiveCrisisYear: crisesYear,
      hydroxyureaDoseMgDay: hydroxyureaMg,
      transfusionProgramActive: hypertransfusionActive,
    });
  };

  const handleAddTransfusion = () => {
    saveTransfusionMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      componentType: compType,
      unitsCount: units,
      bloodGroupRh: bloodGroup,
      crossmatchResult: crossmatch,
      adverseReaction: adverse,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
            <Droplet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Hematología Clínica & Medicina Transfusional</h3>
            <p className="text-xs text-slate-400">Frotis Sangre Periférica, Módulo de Anemia Falciforme & Protocolos Transfusionales</p>
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
          onClick={() => setActiveTab("FROTIS")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "FROTIS"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Microscope className="w-3.5 h-3.5" /> Frotis Sangre Periférica
        </button>

        <button
          onClick={() => setActiveTab("FALCIFORME")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "FALCIFORME"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Anemia Falciforme (HbS)
        </button>

        <button
          onClick={() => setActiveTab("TRANSFUSION")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "TRANSFUSION"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Droplet className="w-3.5 h-3.5" /> Hemocomponentes ({dbTransfusions.length})
        </button>
      </div>

      {/* Tab 1: Frotis Sangre Periférica */}
      {activeTab === "FROTIS" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Microscope className="w-4 h-4" /> Evaluación del Frotis de Lámina Periférica
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Morfología de serie roja, blanca y plaquetaria con recuento de blastos.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveSmear}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
            >
              Guardar Frotis
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-300">Serie Roja / Eritrocitaria (Drepanocitos, Esquizocitos, Hipocromía)</label>
              <textarea
                value={redSeries}
                onChange={(e) => setRedSeries(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 text-rose-300 font-medium rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Serie Blanca / Leucocitaria</label>
              <textarea
                value={whiteSeries}
                onChange={(e) => setWhiteSeries(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Serie Plaquetaria / Trombocitaria</label>
              <textarea
                value={plateletSeries}
                onChange={(e) => setPlateletSeries(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1 md:col-span-2 bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <label className="font-semibold text-slate-200 block">Porcentaje de Blastos en Sangre Periférica (%)</label>
                <span className="text-xs text-slate-400">Alerta de leucemia aguda o síndrome mielodisplásico si blastos &gt; 5%</span>
              </div>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={blastPercent}
                onChange={(e) => setBlastPercent(Number(e.target.value))}
                className={`w-28 border text-center font-bold text-lg rounded p-1.5 ${
                  blastPercent > 5
                    ? "bg-rose-950 border-rose-500 text-rose-200"
                    : "bg-slate-900 border-slate-700 text-emerald-300"
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Anemia Falciforme */}
      {activeTab === "FALCIFORME" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> Módulo de Drepanocitosis / Anemia Falciforme (HbS)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Electroforesis de hemoglobina, prevención de crisis vasooclusivas e Hidroxiurea.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveSickle}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs"
            >
              Guardar Falciforme
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Hemoglobina S (HbS %)</label>
              <input
                type="number"
                step="0.1"
                value={hbS}
                onChange={(e) => setHbS(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-rose-400 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Hemoglobina A (HbA %)</label>
              <input
                type="number"
                step="0.1"
                value={hbA}
                onChange={(e) => setHbA(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-slate-300 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Hemoglobina Fetal (HbF %)</label>
              <input
                type="number"
                step="0.1"
                value={hbF}
                onChange={(e) => setHbF(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Reticulocitos Corregidos (%)</label>
              <input
                type="number"
                step="0.1"
                value={reticulocytes}
                onChange={(e) => setReticulocytes(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-sky-300 font-bold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Crisis Vasooclusivas / Año</label>
              <input
                type="number"
                value={crisesYear}
                onChange={(e) => setCrisesYear(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-amber-400 font-bold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Dosis Hidroxiurea (mg/día)</label>
              <input
                type="number"
                step="100"
                value={hydroxyureaMg}
                onChange={(e) => setHydroxyureaMg(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-emerald-300 font-bold rounded p-2"
              />
            </div>

            <div className="md:col-span-3 bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Programa de Hipertransfusión / Exanguinotransfusión Crónica</span>
                <span className="text-xs text-slate-400">Mantener HbS &lt; 30% para prevención primaria o secundaria de ACV isquémico</span>
              </div>
              <button
                type="button"
                onClick={() => setHypertransfusionActive(!hypertransfusionActive)}
                className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${
                  hypertransfusionActive
                    ? "bg-rose-600 text-white shadow"
                    : "bg-slate-900 border border-slate-700 text-slate-400"
                }`}
              >
                {hypertransfusionActive ? "Programa Activo" : "No Requerido"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Transfusión Hemocomponentes */}
      {activeTab === "TRANSFUSION" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Droplet className="w-4 h-4" /> Registro de Transfusión de Hemocomponentes
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Prescripción, pruebas de compatibilidad y trazabilidad de reacciones adversas.</p>
            </div>
            <Button
              size="sm"
              onClick={handleAddTransfusion}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Transfundir
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tipo de Hemocomponente</label>
              <select
                value={compType}
                onChange={(e) => setCompType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              >
                {BLOOD_COMPONENTS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Grupo Sanguíneo y Factor Rh (ABO/Rh)</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              >
                {ABO_RH_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Número de Unidades / Bolsas</label>
              <input
                type="number"
                min="1"
                max="10"
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-rose-400 font-bold rounded p-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Resultado de Prueba Cruzada y Coombs Directo</label>
              <input
                type="text"
                value={crossmatch}
                onChange={(e) => setCrossmatch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-emerald-300 font-bold rounded p-2"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-300">Trazabilidad de Reacción Adversa Transfucional</label>
              <input
                type="text"
                value={adverse}
                onChange={(e) => setAdverse(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-amber-300 rounded p-2"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
