"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import { DicomViewer } from "@/components/dicom/dicom-viewer";
import {
  Bone,
  Activity,
  Plus,
  Trash2,
  CheckCircle2,
  Shield,
  Layers,
  FileCheck,
  Dumbbell,
  Compass,
} from "lucide-react";

interface Props {
  encounterId: string;
  patientRegistrationId?: string;
  disabled?: boolean;
  initialData?: any;
}

const CATALAGO_AO = [
  { hueso: "Fémur [3]", segmento: "Diafisario [2]", codigo: "32-A1", desc: "Fractura diafisaria simple espiroidea" },
  { hueso: "Fémur [3]", segmento: "Distal [3]", codigo: "33-C2", desc: "Fractura supraintermetafisaria conminuta articular" },
  { hueso: "Húmero [1]", segmento: "Proximal [1]", codigo: "11-A2", desc: "Fractura quirúrgica extraarticular bifocal" },
  { hueso: "Húmero [1]", segmento: "Diafisario [2]", codigo: "12-B2", desc: "Fractura diafisaria con cuña de flexión" },
  { hueso: "Tibia/Peroné [4]", segmento: "Diafisario [2]", codigo: "42-A3", desc: "Fractura diafisaria transversal de tibia" },
  { hueso: "Tibia/Peroné [4]", segmento: "Distal [3]", codigo: "44-B1", desc: "Fractura de tobillo transdesmal aislada" },
  { hueso: "Cúbito/Radio [2]", segmento: "Distal [3]", codigo: "23-A2", desc: "Fractura de radio distal extraarticular (Colles)" },
];

export function TraumatologiaForm({ encounterId, disabled, initialData = {}, patientRegistrationId = "sandbox-demo-pat" }: Props) {
  const [activeTab, setActiveTab] = useState<"IMPLANTES" | "CLASIFICACION_AO" | "REHABILITACION" | "PLAN">("IMPLANTES");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbImplantes = [], refetch: refetchImplantes } = (trpc.trauma.listImplantes.useQuery as any)({ encounterId });
  const { data: dbAo, refetch: refetchAo } = (trpc.trauma.getAoClassification.useQuery as any)({ encounterId });
  const { data: dbRehab, refetch: refetchRehab } = (trpc.trauma.getRehabProtocol.useQuery as any)({ encounterId });

  const addImplanteMut = (trpc.trauma.addImplante.useMutation as any)({ onSuccess: () => refetchImplantes() });
  const deleteImplanteMut = (trpc.trauma.deleteImplante.useMutation as any)({ onSuccess: () => refetchImplantes() });
  const saveAoMut = (trpc.trauma.saveAoClassification.useMutation as any)({ onSuccess: () => refetchAo() });
  const saveRehabMut = (trpc.trauma.saveRehabProtocol.useMutation as any)({ onSuccess: () => refetchRehab() });

  // Implante Form State
  const [tipoMat, setTipoMat] = useState("Placa Bloqueada de Titanio");
  const [marca, setMarca] = useState("Synthes (DePuy Synthes)");
  const [modelo, setModelo] = useState("LCP Anatómica");
  const [lote, setLote] = useState("");
  const [material, setMaterial] = useState("Titanio");
  const [zonaAnatomica, setZonaAnatomica] = useState("Fémur Distal Derecho");
  const [cantidad, setCantidad] = useState(1);
  const [obsImplante, setObsImplante] = useState("");

  // AO Classification Form State
  const [aoHueso, setAoHueso] = useState(dbAo?.hueso || "Fémur [3]");
  const [aoSegmento, setAoSegmento] = useState(dbAo?.segmento || "Distal [3]");
  const [aoCodigo, setAoCodigo] = useState(dbAo?.codigoAO || "33-C2");
  const [aoDesc, setAoDesc] = useState(dbAo?.descripcion || "Fractura articular completa y metafisaria");
  const [aoMecanismo, setAoMecanismo] = useState(dbAo?.mecanismoLesion || "Accidente de tránsito / alta energía");

  // Rehab Protocol State
  const [nivelCarga, setNivelCarga] = useState(dbRehab?.nivelCarga || "CARGA_PARCIAL_50");
  const [usoOrtesis, setUsoOrtesis] = useState(dbRehab?.usoOrtesis || "Bota Walker descarga + Muletas axilares");
  const [faseRehab, setFaseRehab] = useState(dbRehab?.faseRehab || "Fase II: Movilización Pasiva & Carga Parcial (Semanas 2-6)");
  const [ejercicios, setEjercicios] = useState(dbRehab?.ejerciciosPermitidos || "Movilización pasiva asistida de rodilla 0-90°, isométricos de cuádriceps.");
  const [contraindicaciones, setContraindicaciones] = useState(dbRehab?.contraindicaciones || "Carga total no autorizada. Evitar torsión articular.");

  // General Plan State
  const [data, setData] = useState({
    procedimiento: initialData.procedimiento || "Reducción abierta y fijación interna (RAFI)",
    lateralidad: initialData.lateralidad || "Izquierda",
    osteosintesis: initialData.osteosintesis || "Placa LCP con 6 tornillos bloqueados",
    clasificacionAO: initialData.clasificacionAO || "33-C2",
    hallazgosAnatomicos: initialData.hallazgosAnatomicos || "Fractura multifragmentaria con trazo articular",
  });

  useEffect(() => {
    if (dbAo) {
      setAoHueso(dbAo.hueso);
      setAoSegmento(dbAo.segmento);
      setAoCodigo(dbAo.codigoAO);
      setAoDesc(dbAo.descripcion);
      if (dbAo.mecanismoLesion) setAoMecanismo(dbAo.mecanismoLesion);
    }
  }, [dbAo]);

  useEffect(() => {
    if (dbRehab) {
      setNivelCarga(dbRehab.nivelCarga);
      if (dbRehab.usoOrtesis) setUsoOrtesis(dbRehab.usoOrtesis);
      setFaseRehab(dbRehab.faseRehab);
      if (dbRehab.ejerciciosPermitidos) setEjercicios(dbRehab.ejerciciosPermitidos);
      if (dbRehab.contraindicaciones) setContraindicaciones(dbRehab.contraindicaciones);
    }
  }, [dbRehab]);

  const utils = trpc.useUtils();
  const saveMutation = (trpc.encounter.update as any).useMutation({
    onSuccess: () => {
      utils.encounter.get.invalidate({ id: encounterId });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleAddImplante = () => {
    if (!lote) return;
    addImplanteMut.mutate({
      encounterId,
      patientRegistrationId: "sandbox-demo-pat",
      tipoMaterial: tipoMat,
      marca,
      modelo,
      lote,
      material,
      zonaAnatomica,
      cantidad,
      observaciones: obsImplante,
    });
    setLote("");
    setObsImplante("");
  };

  const handleSaveAo = () => {
    saveAoMut.mutate({
      encounterId,
      hueso: aoHueso,
      segmento: aoSegmento,
      codigoAO: aoCodigo,
      descripcion: aoDesc,
      mecanismoLesion: aoMecanismo,
    });
  };

  const handleSaveRehab = () => {
    saveRehabMut.mutate({
      encounterId,
      patientRegistrationId: "sandbox-demo-pat",
      nivelCarga,
      usoOrtesis,
      faseRehab,
      ejerciciosPermitidos: ejercicios,
      contraindicaciones,
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
            <Bone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Traumatología y Ortopedia</h3>
            <p className="text-xs text-slate-400">Registro de Implantes, Clasificación AO/OTA y Protocolo de Rehabilitación</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Guardado
            </span>
          )}
          <Button
            size="sm"
            onClick={() => saveMutation.mutate({ id: encounterId, datosEspecialidad: data })}
            disabled={disabled || saveMutation.isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
          >
            {saveMutation.isLoading ? "Guardando..." : "Guardar Ficha Trauma"}
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveTab("IMPLANTES")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "IMPLANTES"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Implantes & Osteosíntesis ({dbImplantes.length})
        </button>

        <button
          onClick={() => setActiveTab("CLASIFICACION_AO")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "CLASIFICACION_AO"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Compass className="w-3.5 h-3.5" /> Clasificación AO / OTA
        </button>

        <button
          onClick={() => setActiveTab("REHABILITACION")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "REHABILITACION"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" /> Rehabilitación & Carga de Peso
        </button>

        <button
          onClick={() => setActiveTab("PLAN")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "PLAN"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Plan Quirúrgico
        </button>
      </div>

      {/* Tab 1: Implantes y Material de Osteosíntesis */}
      {activeTab === "IMPLANTES" && (
        <div className="space-y-4 pt-2">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Registro Estandarizado de Implantes (Trazabilidad por Lote)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Registra marcas, números de lote, materiales y ubicación exacta del material implantado para trazabilidad quirúrgica.
            </p>
          </div>

          {/* Formulario Agregar Implante */}
          <div className="grid md:grid-cols-4 gap-2.5 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
            <div>
              <label className="text-slate-400">Tipo de Implante / Material:</label>
              <input
                type="text"
                value={tipoMat}
                onChange={(e) => setTipoMat(e.target.value)}
                placeholder="Ej: Placa Bloqueada LCP 3.5mm"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
              />
            </div>

            <div>
              <label className="text-slate-400">Marca Comercial:</label>
              <input
                type="text"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Ej: Synthes, Stryker, Zimmer"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
              />
            </div>

            <div>
              <label className="text-slate-400">Número de Lote / Serie (*):</label>
              <input
                type="text"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                placeholder="Ej: LOT-984214-A"
                className="w-full bg-slate-900 border border-blue-500/50 text-blue-300 font-bold rounded p-1.5 mt-1"
              />
            </div>

            <div>
              <label className="text-slate-400">Zona Anatómica:</label>
              <input
                type="text"
                value={zonaAnatomica}
                onChange={(e) => setZonaAnatomica(e.target.value)}
                placeholder="Ej: Tibia Proximal Izquierda"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-slate-400">Observaciones del Implante:</label>
              <input
                type="text"
                value={obsImplante}
                onChange={(e) => setObsImplante(e.target.value)}
                placeholder="Detalle de colocación, torque, tornillos..."
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
              />
            </div>

            <div className="flex items-end">
              <Button
                size="sm"
                onClick={handleAddImplante}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Implante
              </Button>
            </div>
          </div>

          {/* Tabla de Implantes */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-3 py-2">Tipo & Marca</th>
                  <th className="px-3 py-2">Lote / Serie</th>
                  <th className="px-3 py-2">Material</th>
                  <th className="px-3 py-2">Zona Anatómica</th>
                  <th className="px-3 py-2 text-center">Cant.</th>
                  <th className="px-3 py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dbImplantes.map((imp: any) => (
                  <tr key={imp.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-3 py-2.5">
                      <span className="font-bold text-white block">{imp.tipoMaterial}</span>
                      <span className="text-[10px] text-slate-400">{imp.marca} {imp.modelo ? `(${imp.modelo})` : ""}</span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-blue-400 font-bold">{imp.lote}</td>
                    <td className="px-3 py-2.5 text-slate-300">{imp.material || "Titanio"}</td>
                    <td className="px-3 py-2.5 text-slate-300">{imp.zonaAnatomica}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-white">{imp.cantidad}</td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => deleteImplanteMut.mutate({ id: imp.id })}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Clasificación AO / OTA */}
      {activeTab === "CLASIFICACION_AO" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4" /> Clasificación AO/OTA de Fracturas
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Mapeo articular y diafisario estandarizado por hueso y segmento.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveAo}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
            >
              Guardar Clasificación AO
            </Button>
          </div>

          {/* Quick Presets Catálogo AO */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400">Atajos de Selección Rápida AO/OTA:</span>
            <div className="flex flex-wrap gap-1.5">
              {CATALAGO_AO.map((preset) => (
                <button
                  key={preset.codigo}
                  type="button"
                  onClick={() => {
                    setAoHueso(preset.hueso);
                    setAoSegmento(preset.segmento);
                    setAoCodigo(preset.codigo);
                    setAoDesc(preset.desc);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                    aoCodigo === preset.codigo
                      ? "bg-blue-600 text-white font-bold border-blue-400"
                      : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="font-mono text-blue-300 font-bold">{preset.codigo}</span> - {preset.hueso}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Hueso Anatómico</label>
              <select
                value={aoHueso}
                onChange={(e) => setAoHueso(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              >
                <option value="Húmero [1]">Húmero [1]</option>
                <option value="Cúbito/Radio [2]">Cúbito/Radio [2]</option>
                <option value="Fémur [3]">Fémur [3]</option>
                <option value="Tibia/Peroné [4]">Tibia/Peroné [4]</option>
                <option value="Pelvis/Acetábulo [6]">Pelvis / Acetábulo [6]</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Segmento Óseo</label>
              <select
                value={aoSegmento}
                onChange={(e) => setAoSegmento(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              >
                <option value="Proximal [1]">Proximal [1]</option>
                <option value="Diafisario [2]">Diafisario [2]</option>
                <option value="Distal [3]">Distal [3]</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Código Alfa-Numérico AO</label>
              <input
                type="text"
                value={aoCodigo}
                onChange={(e) => setAoCodigo(e.target.value)}
                className="w-full bg-slate-900 border border-blue-500/50 font-mono text-blue-300 font-bold rounded p-2"
                placeholder="Ej: 33-C2"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Descripción Morphológica de la Fractura</label>
              <input
                type="text"
                value={aoDesc}
                onChange={(e) => setAoDesc(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Mecanismo de Lesión</label>
              <input
                type="text"
                value={aoMecanismo}
                onChange={(e) => setAoMecanismo(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Protocolo de Rehabilitación & Carga de Peso */}
      {activeTab === "REHABILITACION" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4" /> Protocolo de Rehabilitación & Pautas de Carga de Peso
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Indicaciones postoperatorias/conservadoras y prescripción de fisioterapia.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveRehab}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
            >
              Guardar Protocolo Rehab
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Nivel de Carga de Peso Permitido</label>
              <select
                value={nivelCarga}
                onChange={(e) => setNivelCarga(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-2"
              >
                <option value="CARGA_NULA">🚫 Carga Nula (0% Peso - Apoyo Desautorizado)</option>
                <option value="CARGA_PARCIAL_25">🦶 Carga Parcial 25% (Apoyo Digital / Contacto)</option>
                <option value="CARGA_PARCIAL_50">⚖️ Carga Parcial 50% (Paso Asistido en Muletas)</option>
                <option value="CARGA_PARCIAL_75">🚶 Carga Parcial 75% (Transición de Apoyo)</option>
                <option value="CARGA_TOTAL">✅ Carga Total 100% (Apoyo Completo)</option>
                <option value="SEGUN_TOLERANCIA">👍 Según Tolerancia del Paciente</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Uso de Ortesis / Inmovilizador</label>
              <input
                type="text"
                value={usoOrtesis}
                onChange={(e) => setUsoOrtesis(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
                placeholder="Ej: Bota Walker descarga + Muletas axilares"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Fase Actual de Rehabilitación</label>
              <input
                type="text"
                value={faseRehab}
                onChange={(e) => setFaseRehab(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
                placeholder="Ej: Fase II: Movilización Pasiva (Semanas 2-6)"
              />
            </div>

            <div className="md:col-span-3 grid md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="font-semibold text-emerald-400">Ejercicios & Pautas Permitidas</label>
                <textarea
                  value={ejercicios}
                  onChange={(e) => setEjercicios(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-red-400">Contraindicaciones / Advertencias</label>
                <textarea
                  value={contraindicaciones}
                  onChange={(e) => setContraindicaciones(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Plan Quirúrgico */}
      {activeTab === "PLAN" && (
        <div className="space-y-4 pt-2">
          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Procedimiento Proyectado / Realizado</label>
              <input
                type="text"
                value={data.procedimiento}
                onChange={(e) => setData({ ...data, procedimiento: e.target.value })}
                className="w-full bg-slate-950/60 border border-slate-800 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Osteosíntesis Proyectada</label>
              <input
                type="text"
                value={data.osteosintesis}
                onChange={(e) => setData({ ...data, osteosintesis: e.target.value })}
                className="w-full bg-slate-950/60 border border-slate-800 text-white rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* PACS Native DICOM Viewer with Cobb Angle */}
      <div className="pt-4 border-t border-slate-800 space-y-2">
        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <Bone className="w-4 h-4" /> Visor DICOM PACS: Radiografías & Medición de Ángulos Cobb
        </h4>
        <DicomViewer patientRegistrationId={patientRegistrationId} encounterId={encounterId} enableCobbAngle={true} />
      </div>
    </div>
  );
}
