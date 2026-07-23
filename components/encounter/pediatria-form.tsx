"use client";

import { useMemo, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Baby,
  Activity,
  Calculator,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Syringe,
  Pill,
  Sparkles,
  Layers,
  Award,
  FileDown,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  disabled?: boolean;
  initialData?: any;
}

const PRESETS_DOSIS = [
  { nombre: "Acetaminofén / Paracetamol", dosisMgKg: 15, concMg: 120, concMl: 5, frec: 6, label: "15 mg/kg/dosis cada 6h" },
  { nombre: "Ibuprofeno Jarabe", dosisMgKg: 10, concMg: 100, concMl: 5, frec: 8, label: "10 mg/kg/dosis cada 8h" },
  { nombre: "Amoxicilina Suspensión", dosisMgKg: 50, concMg: 250, concMl: 5, frec: 8, label: "50 mg/kg/día cada 8h" },
  { nombre: "Amoxicilina + Clavulánico", dosisMgKg: 80, concMg: 400, concMl: 5, frec: 12, label: "80 mg/kg/día cada 12h" },
  { nombre: "Azitromicina Suspensión", dosisMgKg: 10, concMg: 200, concMl: 5, frec: 24, label: "10 mg/kg/día cada 24h" },
  { nombre: "Loratadina Jarabe", dosisMgKg: 0.2, concMg: 5, concMl: 5, frec: 24, label: "0.2 mg/kg/día cada 24h" },
];

const VACUNAS_PAI = [
  "BCG (Tuberculosis)",
  "Hepatitis B (Recién Nacido)",
  "Rotavirus (1ra y 2da dosis)",
  "Polio IPV/OPV (1ra, 2da, 3ra dosis)",
  "Pentavalente (DPT + HepB + Hib)",
  "Fiebre Amarilla",
  "Trivalente Viral (SRP: Sarampión, Rubéola, Paperas)",
  "Neumococo Conjugada",
  "Influenza Estacional",
];

export function PediatriaForm({ encounterId, disabled, initialData = {}, patientRegistrationId = "sandbox-demo-pat" }: Props) {
  const [activeTab, setActiveTab] = useState<"CRECIMIENTO" | "HITOS" | "DOSIS" | "VACUNAS">("CRECIMIENTO");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbGrowth = [], refetch: refetchGrowth } = (trpc.pedia.listGrowthPoints.useQuery as any)({ patientRegistrationId });
  const { data: dbMilestones, refetch: refetchMilestones } = (trpc.pedia.getMilestones.useQuery as any)({ encounterId });

  const saveGrowthMut = (trpc.pedia.saveGrowthPoint.useMutation as any)({ onSuccess: () => refetchGrowth() });
  const saveMilestonesMut = (trpc.pedia.saveMilestones.useMutation as any)({ onSuccess: () => refetchMilestones() });

  // Growth Point State
  const [edadMeses, setEdadMeses] = useState(12);
  const [pesoKg, setPesoKg] = useState(10.2);
  const [tallaCm, setTallaCm] = useState(75.0);
  const [pcCm, setPcCm] = useState(46.0);
  const [percentilPeso, setPercentilPeso] = useState("P75");
  const [percentilTalla, setPercentilTalla] = useState("P60");

  // Development Milestones State (Semáforo)
  const [edadRango, setEdadRango] = useState("12 meses");
  const [motorGruesoStatus, setMotorGruesoStatus] = useState<"VERDE" | "AMARILLO" | "ROJO">("VERDE");
  const [motorGruesoDetalle, setMotorGruesoDetalle] = useState("Se pone de pie solo y da pasos sujetado.");
  const [motorFinoStatus, setMotorFinoStatus] = useState<"VERDE" | "AMARILLO" | "ROJO">("VERDE");
  const [motorFinoDetalle, setMotorFinoDetalle] = useState("Pinza fina completa (índice-pulgar).");
  const [lenguajeStatus, setLenguajeStatus] = useState<"VERDE" | "AMARILLO" | "ROJO">("VERDE");
  const [lenguajeDetalle, setLenguajeDetalle] = useState("Dice 3 palabras con significado.");
  const [socialStatus, setSocialStatus] = useState<"VERDE" | "AMARILLO" | "ROJO">("VERDE");
  const [socialDetalle, setSocialDetalle] = useState("Imita gestos, señala lo que desea.");

  // Dose Calculator State
  const [dosePeso, setDosePeso] = useState(10.2);
  const [doseMgKgDia, setDoseMgKgDia] = useState(50);
  const [concMg, setConcMg] = useState(250);
  const [concMl, setConcMl] = useState(5);
  const [frecuenciaHs, setFrecuenciaHs] = useState(8);

  // Calculated Dose Query
  const { data: doseResult } = (trpc.pedia.calculateDose.useQuery as any)({
    pesoKg: dosePeso > 0 ? dosePeso : 1,
    dosisMgKgDia: doseMgKgDia > 0 ? doseMgKgDia : 1,
    concentracionMg: concMg > 0 ? concMg : 1,
    concentracionMl: concMl > 0 ? concMl : 1,
    frecuenciaHoras: frecuenciaHs > 0 ? frecuenciaHs : 8,
  });

  // Vacunas State
  const [vacunasColocadas, setVacunasColocadas] = useState<string[]>(initialData.vacunasColocadas || []);

  useEffect(() => {
    if (dbMilestones) {
      if (dbMilestones.edadRango) setEdadRango(dbMilestones.edadRango);
      setMotorGruesoStatus(dbMilestones.motorGruesoStatus || "VERDE");
      if (dbMilestones.motorGruesoDetalle) setMotorGruesoDetalle(dbMilestones.motorGruesoDetalle);
      setMotorFinoStatus(dbMilestones.motorFinoStatus || "VERDE");
      if (dbMilestones.motorFinoDetalle) setMotorFinoDetalle(dbMilestones.motorFinoDetalle);
      setLenguajeStatus(dbMilestones.lenguajeStatus || "VERDE");
      if (dbMilestones.lenguajeDetalle) setLenguajeDetalle(dbMilestones.lenguajeDetalle);
      setSocialStatus(dbMilestones.socialStatus || "VERDE");
      if (dbMilestones.socialDetalle) setSocialDetalle(dbMilestones.socialDetalle);
    }
  }, [dbMilestones]);

  const handleAddGrowthPoint = () => {
    const imcVal = Number((pesoKg / Math.pow(tallaCm / 100, 2)).toFixed(1));
    saveGrowthMut.mutate({
      encounterId,
      patientRegistrationId,
      edadMeses,
      pesoKg,
      tallaCm,
      perimetroCefalicoCm: pcCm,
      imc: imcVal,
      percentilPeso,
      percentilTalla,
      percentilPC: "P50",
    });
  };

  const handleSaveMilestones = () => {
    saveMilestonesMut.mutate({
      encounterId,
      patientRegistrationId,
      edadRango,
      motorGruesoStatus,
      motorGruesoDetalle,
      motorFinoStatus,
      motorFinoDetalle,
      lenguajeStatus,
      lenguajeDetalle,
      socialStatus,
      socialDetalle,
    });
  };

  const toggleVacuna = (vacuna: string) => {
    setVacunasColocadas((prev) =>
      prev.includes(vacuna) ? prev.filter((v) => v !== vacuna) : [...prev, vacuna]
    );
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-pink-500/10 border border-pink-500/30 rounded-lg text-pink-400">
            <Baby className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Pediatría y Puericultura</h3>
            <p className="text-xs text-slate-400">Curvas OMS/CDC, Calculadora de Dosis Ponderal & Semáforo del Desarrollo</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {patientRegistrationId && (
            <a
              href={`/api/pdf/vaccine-carnet/${patientRegistrationId}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition-all shadow-sm"
            >
              <FileDown size={14} />
              Carné de Vacunación PDF (con QR)
            </a>
          )}
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
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveTab("CRECIMIENTO")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "CRECIMIENTO"
              ? "bg-pink-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Curvas Crecimiento OMS ({dbGrowth.length})
        </button>

        <button
          onClick={() => setActiveTab("HITOS")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "HITOS"
              ? "bg-pink-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Award className="w-3.5 h-3.5" /> Semáforo Hitos del Desarrollo
        </button>

        <button
          onClick={() => setActiveTab("DOSIS")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "DOSIS"
              ? "bg-pink-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Calculator className="w-3.5 h-3.5" /> Calculadora Dosis Ponderal
        </button>

        <button
          onClick={() => setActiveTab("VACUNAS")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "VACUNAS"
              ? "bg-pink-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Syringe className="w-3.5 h-3.5" /> Carnet de Vacunas PAI
        </button>
      </div>

      {/* Tab 1: Curvas de Crecimiento OMS / CDC */}
      {activeTab === "CRECIMIENTO" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Registro de Antropometría & Percentiles OMS
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Evolución percentilada P3 - P97 para Peso, Talla y Perímetro Cefálico.</p>
            </div>
            <Button
              size="sm"
              onClick={handleAddGrowthPoint}
              className="bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs"
            >
              Registrar Control Antropométrico
            </Button>
          </div>

          <div className="grid md:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
            <div>
              <label className="text-slate-400">Edad (Meses):</label>
              <input
                type="number"
                value={edadMeses}
                onChange={(e) => setEdadMeses(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1 font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400">Peso (kg):</label>
              <input
                type="number"
                step="0.1"
                value={pesoKg}
                onChange={(e) => setPesoKg(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-pink-300 font-bold rounded p-1.5 mt-1"
              />
            </div>
            <div>
              <label className="text-slate-400">Talla / Longitud (cm):</label>
              <input
                type="number"
                step="0.5"
                value={tallaCm}
                onChange={(e) => setTallaCm(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
              />
            </div>
            <div>
              <label className="text-slate-400">Perímetro Cefálico (cm):</label>
              <input
                type="number"
                step="0.5"
                value={pcCm}
                onChange={(e) => setPcCm(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
              />
            </div>
          </div>

          {/* Histórico Antropométrico */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-3 py-2">Edad</th>
                  <th className="px-3 py-2">Peso (kg)</th>
                  <th className="px-3 py-2">Talla (cm)</th>
                  <th className="px-3 py-2">Perím. Cefálico</th>
                  <th className="px-3 py-2">IMC (kg/m²)</th>
                  <th className="px-3 py-2">Percentil Peso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dbGrowth.map((gp: any) => (
                  <tr key={gp.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-white">{gp.edadMeses} meses</td>
                    <td className="px-3 py-2.5 text-pink-400 font-bold">{gp.pesoKg} kg</td>
                    <td className="px-3 py-2.5 text-slate-200">{gp.tallaCm} cm</td>
                    <td className="px-3 py-2.5 text-slate-300">{gp.perimetroCefalicoCm ? `${gp.perimetroCefalicoCm} cm` : "-"}</td>
                    <td className="px-3 py-2.5 font-mono text-blue-400">{gp.imc || "-"}</td>
                    <td className="px-3 py-2.5 font-bold text-emerald-400">{gp.percentilPeso || "P50"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Semáforo Hitos del Desarrollo */}
      {activeTab === "HITOS" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4" /> Matriz de Hitos del Desarrollo (Evaluación Semáforo)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Clasificación en Verde (Adecuado), Amarillo (En duda) o Rojo (Retraso/Alerta).</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveMilestones}
              className="bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs"
            >
              Guardar Hitos Desarrollo
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            {/* Motor Grueso */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">🏃 Motor Grueso</span>
                <div className="flex gap-1">
                  {(["VERDE", "AMARILLO", "ROJO"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setMotorGruesoStatus(st)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        motorGruesoStatus === st
                          ? st === "VERDE" ? "bg-emerald-500 text-slate-950" : st === "AMARILLO" ? "bg-amber-500 text-slate-950" : "bg-red-500 text-white"
                          : "bg-slate-900 text-slate-400"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={motorGruesoDetalle}
                onChange={(e) => setMotorGruesoDetalle(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              />
            </div>

            {/* Motor Fino */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">✍️ Motor Fino / Adaptativo</span>
                <div className="flex gap-1">
                  {(["VERDE", "AMARILLO", "ROJO"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setMotorFinoStatus(st)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        motorFinoStatus === st
                          ? st === "VERDE" ? "bg-emerald-500 text-slate-950" : st === "AMARILLO" ? "bg-amber-500 text-slate-950" : "bg-red-500 text-white"
                          : "bg-slate-900 text-slate-400"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={motorFinoDetalle}
                onChange={(e) => setMotorFinoDetalle(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              />
            </div>

            {/* Lenguaje */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">🗣️ Lenguaje & Comunicación</span>
                <div className="flex gap-1">
                  {(["VERDE", "AMARILLO", "ROJO"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setLenguajeStatus(st)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        lenguajeStatus === st
                          ? st === "VERDE" ? "bg-emerald-500 text-slate-950" : st === "AMARILLO" ? "bg-amber-500 text-slate-950" : "bg-red-500 text-white"
                          : "bg-slate-900 text-slate-400"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={lenguajeDetalle}
                onChange={(e) => setLenguajeDetalle(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              />
            </div>

            {/* Social */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">🤝 Personal / Social</span>
                <div className="flex gap-1">
                  {(["VERDE", "AMARILLO", "ROJO"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSocialStatus(st)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        socialStatus === st
                          ? st === "VERDE" ? "bg-emerald-500 text-slate-950" : st === "AMARILLO" ? "bg-amber-500 text-slate-950" : "bg-red-500 text-white"
                          : "bg-slate-900 text-slate-400"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={socialDetalle}
                onChange={(e) => setSocialDetalle(e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Calculadora de Dosis Ponderal */}
      {activeTab === "DOSIS" && (
        <div className="space-y-4 pt-2">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-4 h-4" /> Calculadora de Dosis Ponderal Automática (mL por toma)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Cálculo exacto basado en peso del paciente (kg) y concentración de la suspensión.</p>
          </div>

          {/* Presets */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400">Atajos de Fármacos Comunes:</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS_DOSIS.map((pr) => (
                <button
                  key={pr.nombre}
                  type="button"
                  onClick={() => {
                    setDoseMgKgDia(pr.dosisMgKg);
                    setConcMg(pr.concMg);
                    setConcMl(pr.concMl);
                    setFrecuenciaHs(pr.frec);
                  }}
                  className="text-xs px-2.5 py-1 rounded border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 transition-all"
                >
                  <span className="font-bold text-pink-400">{pr.nombre}</span> ({pr.label})
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">Peso del Paciente (kg):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={dosePeso}
                    onChange={(e) => setDosePeso(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-pink-500/40 text-pink-300 font-bold rounded p-2 text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Dosis (mg/kg/día):</label>
                  <input
                    type="number"
                    value={doseMgKgDia}
                    onChange={(e) => setDoseMgKgDia(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-2 text-sm mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400">Conc. (mg):</label>
                  <input
                    type="number"
                    value={concMg}
                    onChange={(e) => setConcMg(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400">en (mL):</label>
                  <input
                    type="number"
                    value={concMl}
                    onChange={(e) => setConcMl(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Frecuencia (h):</label>
                  <input
                    type="number"
                    value={frecuenciaHs}
                    onChange={(e) => setFrecuenciaHs(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Resultado de la Dosis */}
            <div className="bg-pink-950/30 border border-pink-500/40 p-4 rounded-xl flex flex-col justify-center items-center text-center space-y-2">
              <span className="text-xs uppercase tracking-wider font-bold text-pink-300">Dosis Calculada por Toma:</span>
              <div className="text-3xl font-extrabold text-pink-400 flex items-baseline gap-1">
                <span>{doseResult?.dosisPorTomaMl ?? 0}</span>
                <span className="text-lg text-slate-300 font-normal">mL</span>
              </div>
              <span className="text-xs text-slate-300 font-medium bg-slate-900/80 px-3 py-1 rounded border border-slate-800">
                Dar <span className="text-white font-bold">{doseResult?.dosisPorTomaMl ?? 0} mL</span> vía oral cada <span className="text-white font-bold">{frecuenciaHs} horas</span>
              </span>
              <span className="text-[10px] text-slate-400">
                (Dosis total diaria: {doseResult?.dosisTotalDiaMg ?? 0} mg/día — {doseResult?.dosisPorTomaMg ?? 0} mg por toma)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Carnet de Vacunas PAI */}
      {activeTab === "VACUNAS" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
              <Syringe className="w-4 h-4" /> Esquema Ampliado de Inmunizaciones (PAI Venezuela)
            </h4>
            {patientRegistrationId && patientRegistrationId !== "sandbox-demo-pat" && (
              <a
                href={`/api/pdf/vaccine-carnet/${patientRegistrationId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 transition-all shadow-sm"
              >
                <FileDown size={13} />
                Ver / Descargar Carné PDF (con QR)
              </a>
            )}
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {VACUNAS_PAI.map((vacuna) => {
              const checked = vacunasColocadas.includes(vacuna);
              return (
                <button
                  key={vacuna}
                  type="button"
                  onClick={() => toggleVacuna(vacuna)}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                    checked
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{vacuna}</span>
                  {checked && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
