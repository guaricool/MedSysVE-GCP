"use client";

import { useMemo, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Baby,
  Calendar,
  Heart,
  Ruler,
  CheckCircle2,
  Calculator,
  Table,
  ShieldAlert,
  FileSearch,
  Activity,
  Plus,
  FileDown,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  disabled?: boolean;
  initialData?: any;
}

const BETHESDA_OPTIONS = [
  "NILM (Negativo para Lesión Intraepitelial o Malignidad)",
  "LIEBG / NIE I (Lesión Intraepitelial Escamosa de Bajo Grado)",
  "LIEAG / NIE II-III (Lesión Intraepitelial Escamosa de Alto Grado)",
  "ASC-US (Células Escamosas Atípicas de Significado Incierto)",
  "ASC-H (Células Escamosas Atípicas no descarta LIEAG)",
  "AGC (Células Glandulares Atípicas)",
];

const BIRADS_OPTIONS = [
  "BI-RADS 0 (Incompleto - Requiere Estudios Adicionales)",
  "BI-RADS 1 (Negativo / Normal)",
  "BI-RADS 2 (Hallazgos Benignos)",
  "BI-RADS 3 (Probablemente Benigno - Seguimiento a 6m)",
  "BI-RADS 4 (Hallazgo Sospechoso - Requiere Biopsia)",
  "BI-RADS 5 (Altamente Sugestivo de Malignidad)",
  "BI-RADS 6 (Malignidad Confirmada por Biopsia)",
];

export function ObstetriciaForm({ encounterId, disabled, initialData = {}, patientRegistrationId = "sandbox-demo-pat" }: Props) {
  const [activeTab, setActiveTab] = useState<"PRENATAL_MATRIX" | "CALCULADORA" | "CRIBADO">("PRENATAL_MATRIX");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbProfile, refetch: refetchProfile } = (trpc.obgyno.getProfile.useQuery as any)({ patientRegistrationId });
  const { data: dbControls = [], refetch: refetchControls } = (trpc.obgyno.listPrenatalControls.useQuery as any)({ patientRegistrationId });
  const { data: dbScreening, refetch: refetchScreening } = (trpc.obgyno.getGynoScreening.useQuery as any)({ encounterId });

  const saveProfileMut = (trpc.obgyno.saveProfile.useMutation as any)({ onSuccess: () => refetchProfile() });
  const addControlMut = (trpc.obgyno.addPrenatalControl.useMutation as any)({ onSuccess: () => refetchControls() });
  const saveScreeningMut = (trpc.obgyno.saveGynoScreening.useMutation as any)({ onSuccess: () => refetchScreening() });

  // Profile / Formula Obstétrica State
  const [gestas, setGestas] = useState(2);
  const [partos, setPartos] = useState(1);
  const [abortos, setAbortos] = useState(0);
  const [cesareas, setCesareas] = useState(0);
  const [hijosVivos, setHijosVivos] = useState(1);
  const [furDate, setFurDate] = useState<string>("2026-01-10");
  const [rhGroup, setRhGroup] = useState("O Rh Positivo");
  const [isRhNeg, setIsRhNeg] = useState(false);

  // Obstetric Calc Query
  const furDateObj = useMemo(() => (furDate ? new Date(furDate) : new Date()), [furDate]);
  const { data: calcResult } = (trpc.obgyno.calculateGestationalAge.useQuery as any)({ fur: furDateObj });

  // New Prenatal Control Form State
  const [egInput, setEgInput] = useState(28.0);
  const [fcfInput, setFcfInput] = useState(145);
  const [auInput, setAuInput] = useState(27.0);
  const [paInput, setPaInput] = useState("115/75");
  const [pesoInput, setPesoInput] = useState(67.5);
  const [movInput, setMovInput] = useState("Activos y presentes");
  const [presInput, setPresInput] = useState("Cefálica");
  const [protInput, setProtInput] = useState("Negativa");
  const [edemaInput, setEdemaInput] = useState("Ausente");
  const [obsInput, setObsInput] = useState("Evolución materna y fetal dentro de límites normales.");

  // Gyno Screening State
  const [bethesda, setBethesda] = useState("NILM (Negativo para Lesión Intraepitelial o Malignidad)");
  const [birads, setBirads] = useState("BI-RADS 1 (Negativo / Normal)");
  const [ecoPelvico, setEcoPelvico] = useState("Útero normoinserto. Ovarios de ecoestructura conservada.");
  const [screeningObs, setScreeningObs] = useState("Cribado gineco-oncológico actualizado.");

  useEffect(() => {
    if (dbProfile) {
      setGestas(dbProfile.gestas);
      setPartos(dbProfile.partos);
      setAbortos(dbProfile.abortos);
      setCesareas(dbProfile.cesareas);
      setHijosVivos(dbProfile.hijosVivos);
      if (dbProfile.fur) setFurDate(new Date(dbProfile.fur).toISOString().split("T")[0]);
      if (dbProfile.grupoSanguineoRh) setRhGroup(dbProfile.grupoSanguineoRh);
      setIsRhNeg(!!dbProfile.isRhNegative);
    }
  }, [dbProfile]);

  useEffect(() => {
    if (dbScreening) {
      if (dbScreening.citologiaBethesda) setBethesda(dbScreening.citologiaBethesda);
      if (dbScreening.mamografiaBirads) setBirads(dbScreening.mamografiaBirads);
      if (dbScreening.ecoPelvicoHallazgos) setEcoPelvico(dbScreening.ecoPelvicoHallazgos);
      if (dbScreening.observaciones) setScreeningObs(dbScreening.observaciones);
    }
  }, [dbScreening]);

  const handleSaveProfile = () => {
    saveProfileMut.mutate({
      patientRegistrationId,
      gestas,
      partos,
      abortos,
      cesareas,
      hijosVivos,
      fur: furDate ? new Date(furDate) : null,
      grupoSanguineoRh: rhGroup,
      isRhNegative: isRhNeg,
    });
  };

  const handleAddControl = () => {
    addControlMut.mutate({
      encounterId,
      patientRegistrationId,
      edadGestacionalSemanas: egInput,
      fcfLpm: fcfInput,
      alturaUterinaCm: auInput,
      presionArterial: paInput,
      pesoKg: pesoInput,
      movimientosFetales: movInput,
      presentacionFetal: presInput,
      proteinuria: protInput,
      edema: edemaInput,
      observaciones: obsInput,
    });
  };

  const handleSaveScreening = () => {
    saveScreeningMut.mutate({
      encounterId,
      patientRegistrationId,
      citologiaBethesda: bethesda,
      mamografiaBirads: birads,
      ecoPelvicoHallazgos: ecoPelvico,
      observaciones: screeningObs,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
            <Baby className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Obstetricia y Ginecología</h3>
            <p className="text-xs text-slate-400">Ficha Prenatal Matricial, Calculadora Obstétrica (Naegele) & Cribado (Bethesda/BI-RADS)</p>
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
          onClick={() => setActiveTab("PRENATAL_MATRIX")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "PRENATAL_MATRIX"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Table className="w-3.5 h-3.5" /> Ficha Prenatal Matricial ({dbControls.length})
        </button>

        <button
          onClick={() => setActiveTab("CALCULADORA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "CALCULADORA"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Calculator className="w-3.5 h-3.5" /> Calculadora Obstétrica & Antecedentes
        </button>

        <button
          onClick={() => setActiveTab("CRIBADO")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "CRIBADO"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <FileSearch className="w-3.5 h-3.5" /> Cribado Ginecológico (Bethesda / BI-RADS)
        </button>
      </div>

      {/* Tab 1: Ficha Prenatal Matricial */}
      {activeTab === "PRENATAL_MATRIX" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Table className="w-4 h-4" /> Matriz de Controles Prenatales Secuenciales
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Seguimiento por filas: EG, FCF, Altura Uterina, PA, Peso, Proteinuria y Edema.</p>
            </div>
            <Button
              size="sm"
              onClick={handleAddControl}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Añadir Control Prenatal
            </Button>
          </div>

          {/* Formulario Rápido de Nuevo Control */}
          <div className="grid md:grid-cols-5 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
            <div>
              <label className="text-slate-400">EG (Semanas):</label>
              <input
                type="number"
                step="0.1"
                value={egInput}
                onChange={(e) => setEgInput(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-1.5 mt-1"
              />
            </div>
            <div>
              <label className="text-slate-400">FCF (lpm):</label>
              <input
                type="number"
                value={fcfInput}
                onChange={(e) => setFcfInput(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-purple-300 font-bold rounded p-1.5 mt-1"
              />
            </div>
            <div>
              <label className="text-slate-400">AU (cm):</label>
              <input
                type="number"
                step="0.5"
                value={auInput}
                onChange={(e) => setAuInput(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
              />
            </div>
            <div>
              <label className="text-slate-400">PA (mmHg):</label>
              <input
                type="text"
                value={paInput}
                onChange={(e) => setPaInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
              />
            </div>
            <div>
              <label className="text-slate-400">Peso (kg):</label>
              <input
                type="number"
                step="0.1"
                value={pesoInput}
                onChange={(e) => setPesoInput(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
              />
            </div>
          </div>

          {/* Tabla Matricial */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">EG (sem)</th>
                  <th className="px-3 py-2">FCF (lpm)</th>
                  <th className="px-3 py-2">AU (cm)</th>
                  <th className="px-3 py-2">PA</th>
                  <th className="px-3 py-2">Peso (kg)</th>
                  <th className="px-3 py-2">Presentación</th>
                  <th className="px-3 py-2">Proteinuria</th>
                  <th className="px-3 py-2">Edema</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dbControls.map((ctrl: any) => (
                  <tr key={ctrl.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-slate-400">
                      {new Date(ctrl.fechaControl).toLocaleDateString("es-VE")}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-purple-300">{ctrl.edadGestacionalSemanas} sem</td>
                    <td className="px-3 py-2.5 font-bold text-red-400">{ctrl.fcfLpm ? `${ctrl.fcfLpm} lpm` : "-"}</td>
                    <td className="px-3 py-2.5 text-slate-200">{ctrl.alturaUterinaCm ? `${ctrl.alturaUterinaCm} cm` : "-"}</td>
                    <td className="px-3 py-2.5 font-mono text-blue-400">{ctrl.presionArterial || "-"}</td>
                    <td className="px-3 py-2.5 text-slate-300">{ctrl.pesoKg ? `${ctrl.pesoKg} kg` : "-"}</td>
                    <td className="px-3 py-2.5 text-slate-300">{ctrl.presentacionFetal || "Cefálica"}</td>
                    <td className="px-3 py-2.5 font-semibold text-emerald-400">{ctrl.proteinuria || "Negativa"}</td>
                    <td className="px-3 py-2.5 text-slate-300">{ctrl.edema || "Ausente"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Calculadora Obstétrica & Antecedentes */}
      {activeTab === "CALCULADORA" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> Calculadora Obstétrica Dinámica & Fórmula G-P-A-C
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Estimación Naegele de FPP y Edad Gestacional actual por FUR.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveProfile}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
            >
              Guardar Perfil Obstétrico
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Fórmula Obstétrica */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <h5 className="font-bold text-slate-200">Fórmula Obstétrica (G P A C V)</h5>
              <div className="grid grid-cols-5 gap-2">
                <div>
                  <label className="text-slate-400 block text-center">Gesta</label>
                  <input
                    type="number"
                    value={gestas}
                    onChange={(e) => setGestas(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-center font-bold rounded p-1.5 mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block text-center">Para</label>
                  <input
                    type="number"
                    value={partos}
                    onChange={(e) => setPartos(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-center font-bold rounded p-1.5 mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block text-center">Aborto</label>
                  <input
                    type="number"
                    value={abortos}
                    onChange={(e) => setAbortos(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-center font-bold rounded p-1.5 mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block text-center">Cesárea</label>
                  <input
                    type="number"
                    value={cesareas}
                    onChange={(e) => setCesareas(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-center font-bold rounded p-1.5 mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block text-center">Vivos</label>
                  <input
                    type="number"
                    value={hijosVivos}
                    onChange={(e) => setHijosVivos(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-center font-bold rounded p-1.5 mt-1"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="text-slate-300 font-semibold block">Fecha Última Regla (FUR):</label>
                <input
                  type="date"
                  value={furDate}
                  onChange={(e) => setFurDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-2 text-sm"
                />
              </div>
            </div>

            {/* Resultado Naegele */}
            <div className="bg-purple-950/30 border border-purple-500/40 p-4 rounded-xl flex flex-col justify-center items-center text-center space-y-2">
              <span className="text-xs uppercase tracking-wider font-bold text-purple-300">Edad Gestacional Actual:</span>
              <div className="text-3xl font-extrabold text-purple-300">
                {calcResult?.egFormatted ?? "27.3 semanas"}
              </div>

              <div className="mt-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1">
                <span className="text-slate-400 block">Fecha Probable de Parto (Naegele):</span>
                <span className="text-emerald-400 font-bold text-sm block">
                  {calcResult?.fpp ? new Date(calcResult.fpp).toLocaleDateString("es-VE", { year: "numeric", month: "long", day: "numeric" }) : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Cribado Ginecológico */}
      {activeTab === "CRIBADO" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileSearch className="w-4 h-4" /> Cribado Gineco-Oncológico (Bethesda & BI-RADS)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Estratificación citológica Bethesda y mamográfica BI-RADS 0 a 6.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveScreening}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
            >
              Guardar Cribado
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            {/* Citología Bethesda */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h5 className="font-bold text-emerald-400">🔬 Citología Cervical (Sistema Bethesda)</h5>
              <select
                value={bethesda}
                onChange={(e) => setBethesda(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 font-semibold"
              >
                {BETHESDA_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Mamografía BI-RADS */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h5 className="font-bold text-blue-400">🎗️ Mamografía (Categoría BI-RADS)</h5>
              <select
                value={birads}
                onChange={(e) => setBirads(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 font-semibold"
              >
                {BIRADS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h5 className="font-bold text-slate-300">🔊 Ecografía Pélvica / Transvaginal (Hallazgos)</h5>
              <textarea
                value={ecoPelvico}
                onChange={(e) => setEcoPelvico(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function GinecologiaForm(props: Props) {
  return <ObstetriciaForm {...props} />;
}
