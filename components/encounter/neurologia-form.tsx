"use client";

import { useMemo, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Activity,
  Calculator,
  Zap,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  disabled?: boolean;
  initialData?: any;
}

const METAMERAS = ["C2", "C5", "C6", "C7", "C8", "T4", "T10", "L2", "L3", "L4", "L5", "S1"];

const PARES_CRANEALES = [
  "I (Olfatorio)", "II (Óptico)", "III (Motor Ocular Común)", "IV (Patético/Troclear)",
  "V (Trigémino)", "VI (Motor Ocular Externo/Abducens)", "VII (Facial)",
  "VIII (Vestibuloclear/Auditivo)", "IX (Glosofaríngeo)", "X (Vago/Neumogástrico)",
  "XI (Espinal/Accesorio)", "XII (Hipogloso)"
];

export function NeurologiaForm({ encounterId, disabled, initialData = {}, patientRegistrationId = "sandbox-demo-pat" }: Props) {
  const [activeTab, setActiveTab] = useState<"ESCALAS" | "DERMATOMAS" | "CRISIS" | "PARES">("ESCALAS");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbScales, refetch: refetchScales } = (trpc.neuro.getScales.useQuery as any)({ encounterId });
  const { data: dbDermatomes = [], refetch: refetchDermatomes } = (trpc.neuro.listDermatomes.useQuery as any)({ encounterId });
  const { data: dbSeizures = [], refetch: refetchSeizures } = (trpc.neuro.listSeizures.useQuery as any)({ patientRegistrationId });

  const saveScalesMut = (trpc.neuro.saveScales.useMutation as any)({ onSuccess: () => refetchScales() });
  const saveDermatomeMut = (trpc.neuro.saveDermatome.useMutation as any)({ onSuccess: () => refetchDermatomes() });
  const saveSeizureMut = (trpc.neuro.saveSeizure.useMutation as any)({ onSuccess: () => refetchSeizures() });

  // Glasgow State
  const [glasgowOcular, setGlasgowOcular] = useState(4);
  const [glasgowVerbal, setGlasgowVerbal] = useState(5);
  const [glasgowMotor, setGlasgowMotor] = useState(6);
  const glasgowTotal = useMemo(() => glasgowOcular + glasgowVerbal + glasgowMotor, [glasgowOcular, glasgowVerbal, glasgowMotor]);

  // NIHSS & EDSS State
  const [nihssScore, setNihssScore] = useState(2);
  const [edssScore, setEdssScore] = useState(1.5);
  const [scaleObs, setScaleObs] = useState("Paciente consciente, orientado. Mínima disartria residual.");

  // Dermatome Map State
  const [selectedMetamera, setSelectedMetamera] = useState("C6");
  const [lado, setLado] = useState("DERECHO");
  const [sensTactil, setSensTactil] = useState("HIPOESTESIA");
  const [sensDolor, setSensDolor] = useState("HIPOALGESIA");
  const [propiocepcion, setPropiocepcion] = useState("NORMAL");

  // Seizure Log State
  const [tipoCrisis, setTipoCrisis] = useState("Focal Motor con Conexión Alterada");
  const [frecMensual, setFrecMensual] = useState(1);
  const [duracionMin, setDuracionMin] = useState(2.0);
  const [desencadenantes, setDesencadenantes] = useState("Privación de sueño y estrés laboral");
  const [auraDesc, setAuraDesc] = useState("Sensación epigástrica ascendente");
  const [estadoPostictal, setEstadoPostictal] = useState("Somnolencia por 15 minutos");

  // Pares Craneales State
  const [paresAlterados, setParesAlterados] = useState<string[]>([]);

  useEffect(() => {
    if (dbScales) {
      if (dbScales.glasgowOcular) setGlasgowOcular(dbScales.glasgowOcular);
      if (dbScales.glasgowVerbal) setGlasgowVerbal(dbScales.glasgowVerbal);
      if (dbScales.glasgowMotor) setGlasgowMotor(dbScales.glasgowMotor);
      if (dbScales.nihssScore !== null) setNihssScore(dbScales.nihssScore);
      if (dbScales.edssScore !== null) setEdssScore(dbScales.edssScore);
      if (dbScales.observaciones) setScaleObs(dbScales.observaciones);
    }
  }, [dbScales]);

  const handleSaveScales = () => {
    saveScalesMut.mutate({
      encounterId,
      patientRegistrationId,
      glasgowOcular,
      glasgowVerbal,
      glasgowMotor,
      nihssScore,
      edssScore,
      observaciones: scaleObs,
    });
  };

  const handleAddDermatome = () => {
    saveDermatomeMut.mutate({
      encounterId,
      patientRegistrationId,
      nivelDermatoma: selectedMetamera,
      lado,
      sensibilidadTactil: sensTactil,
      sensibilidadDolorosa: sensDolor,
      propiocepcion,
    });
  };

  const handleAddSeizure = () => {
    saveSeizureMut.mutate({
      encounterId,
      patientRegistrationId,
      tipoCrisis,
      frecuenciaMensual: frecMensual,
      duracionMinutos: duracionMin,
      desencadenantes,
      auraDesc,
      estadoPostictal,
    });
  };

  const togglePar = (par: string) => {
    setParesAlterados((prev) =>
      prev.includes(par) ? prev.filter((p) => p !== par) : [...prev, par]
    );
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Evaluación de Neurología</h3>
            <p className="text-xs text-slate-400">Escalas Objetivas (Glasgow, NIHSS, EDSS), Mapa Dermatómico & Registro de Crisis</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveTab("ESCALAS")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "ESCALAS"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Calculator className="w-3.5 h-3.5" /> Escalas (Glasgow / NIHSS / EDSS)
        </button>

        <button
          onClick={() => setActiveTab("DERMATOMAS")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "DERMATOMAS"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Mapa Dermatómico ({dbDermatomes.length})
        </button>

        <button
          onClick={() => setActiveTab("CRISIS")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "CRISIS"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> Registro de Crisis Epilépticas ({dbSeizures.length})
        </button>

        <button
          onClick={() => setActiveTab("PARES")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "PARES"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Pares Craneales (I - XII)
        </button>
      </div>

      {/* Tab 1: Escalas Neurológicas */}
      {activeTab === "ESCALAS" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> Calculadora de Escalas Neurológicas Objetivas
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Glasgow Coma Scale (3-15), NIHSS Stroke Scale (0-42) y EDSS Esclerosis Múltiple.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveScales}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
            >
              Guardar Escalas
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs">
            {/* Glasgow */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-slate-200">🧠 Escala de Glasgow</h5>
                <span className="text-lg font-extrabold text-indigo-400 font-mono">{glasgowTotal} / 15 pts</span>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-slate-400 block mb-1">Apertura Ocular (1-4):</label>
                  <select
                    value={glasgowOcular}
                    onChange={(e) => setGlasgowOcular(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5"
                  >
                    <option value={4}>4 - Espontánea</option>
                    <option value={3}>3 - Al la orden verbal</option>
                    <option value={2}>2 - Al estímulo doloroso</option>
                    <option value={1}>1 - Ausente</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Respuesta Verbal (1-5):</label>
                  <select
                    value={glasgowVerbal}
                    onChange={(e) => setGlasgowVerbal(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5"
                  >
                    <option value={5}>5 - Orientado y conversando</option>
                    <option value={4}>4 - Desorientado / Confuso</option>
                    <option value={3}>3 - Palabras inapropiadas</option>
                    <option value={2}>2 - Sonidos incomprensibles</option>
                    <option value={1}>1 - Sin respuesta</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Respuesta Motora (1-6):</label>
                  <select
                    value={glasgowMotor}
                    onChange={(e) => setGlasgowMotor(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5"
                  >
                    <option value={6}>6 - Obedece órdenes</option>
                    <option value={5}>5 - Localiza el dolor</option>
                    <option value={4}>4 - Retira al dolor</option>
                    <option value={3}>3 - Flexión anormal (Decorticación)</option>
                    <option value={2}>2 - Extensión anormal (Descerebración)</option>
                    <option value={1}>1 - Sin respuesta</option>
                  </select>
                </div>
              </div>
            </div>

            {/* NIHSS */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h5 className="font-bold text-amber-400">⚡ Escala NIHSS (Ictus / ACV)</h5>
              <div className="space-y-1">
                <label className="text-slate-400">Puntuación NIHSS (0 - 42 pts):</label>
                <input
                  type="number"
                  min="0"
                  max="42"
                  value={nihssScore}
                  onChange={(e) => setNihssScore(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-amber-400 font-bold rounded p-2 text-sm"
                />
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 text-[11px] text-slate-300">
                <span className="text-slate-400 block">Categoría de Severidad:</span>
                <span className="font-bold text-amber-400">
                  {nihssScore === 0 ? "Normal (0 pts)" : nihssScore <= 4 ? "ACV Leve (1-4 pts)" : nihssScore <= 15 ? "ACV Moderado (5-15 pts)" : "ACV Grave (>16 pts)"}
                </span>
              </div>
            </div>

            {/* EDSS */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h5 className="font-bold text-blue-400">🎗️ Escala EDSS (Esclerosis Múltiple)</h5>
              <div className="space-y-1">
                <label className="text-slate-400">Puntuación EDSS (0.0 - 10.0 pts):</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={edssScore}
                  onChange={(e) => setEdssScore(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-blue-400 font-bold rounded p-2 text-sm"
                />
              </div>
              <span className="text-[10px] text-slate-400 block">
                {edssScore <= 3.5 ? "🟢 Ambulación completamente independiente" : edssScore <= 6.0 ? "🟡 Requiere apoyo unipolar para caminar 100m" : "🔴 Severa restricción de movilidad"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Mapa Dermatómico */}
      {activeTab === "DERMATOMAS" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> Exploración del Mapa Dermatómico (Sensibilidad C2 - S1)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Sensibilidad superficial (Táctil, Dolorosa) y Profunda (Propiocepción) por metámera.</p>
            </div>
            <Button
              size="sm"
              onClick={handleAddDermatome}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
            >
              Registrar Hallazgo Dermatómico
            </Button>
          </div>

          {/* Formulario Dermatómico */}
          <div className="grid md:grid-cols-5 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
            <div>
              <label className="text-slate-400">Dermatoma:</label>
              <select
                value={selectedMetamera}
                onChange={(e) => setSelectedMetamera(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-1.5 mt-1"
              >
                {METAMERAS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400">Lado:</label>
              <select
                value={lado}
                onChange={(e) => setLado(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
              >
                <option value="DERECHO">DERECHO</option>
                <option value="IZQUIERDO">IZQUIERDO</option>
                <option value="BILATERAL">BILATERAL</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400">Tactil:</label>
              <select
                value={sensTactil}
                onChange={(e) => setSensTactil(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="HIPOESTESIA">HIPOESTESIA</option>
                <option value="ANESTESIA">ANESTESIA</option>
                <option value="HIPERESTESIA">HIPERESTESIA</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400">Dolorosa:</label>
              <select
                value={sensDolor}
                onChange={(e) => setSensDolor(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="HIPOALGESIA">HIPOALGESIA</option>
                <option value="ANALGESIA">ANALGESIA</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400">Propiocepción:</label>
              <select
                value={propiocepcion}
                onChange={(e) => setPropiocepcion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="ALTERADA">ALTERADA</option>
              </select>
            </div>
          </div>

          {/* Tabla de Hallazgos Dermatómicos */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-3 py-2">Dermatoma</th>
                  <th className="px-3 py-2">Lado</th>
                  <th className="px-3 py-2">Sens. Táctil</th>
                  <th className="px-3 py-2">Sens. Dolorosa</th>
                  <th className="px-3 py-2">Propiocepción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dbDermatomes.map((dm: any) => (
                  <tr key={dm.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-indigo-300 font-mono">{dm.nivelDermatoma}</td>
                    <td className="px-3 py-2.5 text-slate-200">{dm.lado}</td>
                    <td className="px-3 py-2.5 font-semibold text-amber-400">{dm.sensibilidadTactil}</td>
                    <td className="px-3 py-2.5 font-semibold text-red-400">{dm.sensibilidadDolorosa}</td>
                    <td className="px-3 py-2.5 text-slate-300">{dm.propiocepcion || "NORMAL"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Diario de Crisis Epilépticas */}
      {activeTab === "CRISIS" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> Diario de Crisis Epilépticas & Semiología
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Frecuencia mensual, pródromos/auras y estado postictal.</p>
            </div>
            <Button
              size="sm"
              onClick={handleAddSeizure}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
            >
              Registrar Crisis Epiléptica
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Tipo de Crisis</label>
              <input
                type="text"
                value={tipoCrisis}
                onChange={(e) => setTipoCrisis(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Frecuencia (crisis/mes)</label>
              <input
                type="number"
                value={frecMensual}
                onChange={(e) => setFrecMensual(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold">Duración Aprox. (minutos)</label>
              <input
                type="number"
                step="0.5"
                value={duracionMin}
                onChange={(e) => setDuracionMin(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="text-slate-300 font-semibold">Desencadenantes Identificados</label>
              <input
                type="text"
                value={desencadenantes}
                onChange={(e) => setDesencadenantes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Pares Craneales */}
      {activeTab === "PARES" && (
        <div className="space-y-4 pt-2">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Checklist de Pares Craneales (I - XII)
            </h4>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {PARES_CRANEALES.map((par) => {
              const alterado = paresAlterados.includes(par);
              return (
                <button
                  key={par}
                  type="button"
                  onClick={() => togglePar(par)}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                    alterado
                      ? "bg-red-500/20 border-red-500 text-red-300 font-semibold"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{par}</span>
                  {alterado && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
