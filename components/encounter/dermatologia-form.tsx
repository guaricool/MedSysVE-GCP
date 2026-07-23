"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Brush,
  Sun,
  ShieldAlert,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Scissors,
  Eye,
  Activity,
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

const FITZPATRICK_TYPES = [
  "Tipo I (Piel muy clara, pecosa, siempre se quema, nunca se broncea)",
  "Tipo II (Piel clara, ojos claros, se quema fácilmente, broncea mínimamente)",
  "Tipo III (Piel clara-intermedia, a veces se quema, broncea de forma gradual)",
  "Tipo IV (Piel olivas/morena clara, raramente se quema, broncea con facilidad)",
  "Tipo V (Piel morena oscura, muy raramente se quema, broncea intensamente)",
  "Tipo VI (Piel profundamente pigmentada / negra, nunca se quema)",
];

export function DermatologiaForm({ encounterId, disabled, initialData = {}, patientRegistrationId, patientRegId }: Props) {
  const effectivePatId = patientRegistrationId || patientRegId || "sandbox-demo-pat";
  const [activeTab, setActiveTab] = useState<"FITZPATRICK" | "LESIONES" | "BIOPSIAS">("FITZPATRICK");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC Queries & Mutations
  const { data: dbSkin, refetch: refetchSkin } = (trpc.derm.getSkinProfile.useQuery as any)({ encounterId });
  const { data: dbLesions = [], refetch: refetchLesions } = (trpc.derm.listLesions.useQuery as any)({ patientRegistrationId: effectivePatId });
  const { data: dbBiopsies = [], refetch: refetchBiopsies } = (trpc.derm.listBiopsies.useQuery as any)({ patientRegistrationId: effectivePatId });

  const saveSkinMut = (trpc.derm.saveSkinProfile.useMutation as any)({ onSuccess: () => refetchSkin() });
  const saveLesionMut = (trpc.derm.saveLesion.useMutation as any)({ onSuccess: () => refetchLesions() });
  const saveBiopsyMut = (trpc.derm.saveBiopsy.useMutation as any)({ onSuccess: () => refetchBiopsies() });

  // Skin Profile State
  const [fitzpatrick, setFitzpatrick] = useState("Tipo II (Piel clara, ojos claros, se quema fácilmente, broncea mínimamente)");
  const [antecedentesCancer, setAntecedentesCancer] = useState(false);
  const [quemadurasSolares, setQuemadurasSolares] = useState("Quemaduras solares leves en infancia durante exposición recreativa.");
  const [usoFotoprotector, setUsoFotoprotector] = useState("Uso diario de fotoprotector solar FPS 50+");

  // Lesion State
  const [localizacion, setLocalizacion] = useState("Espalda Superior Derecha (Región Escapular)");
  const [asimetria, setAsimetria] = useState(false);
  const [bordes, setBordes] = useState(false);
  const [color, setColor] = useState(false);
  const [diametro, setDiametro] = useState(4.5);
  const [evolucion, setEvolucion] = useState(false);
  const [dermatoscopia, setDermatoscopia] = useState("Red pigmentada típica y homogénea");
  const [diagPresuntivo, setDiagPresuntivo] = useState("Nevus Melánico Benigno");

  // Biopsy State
  const [sitioBiopsia, setSitioBiopsia] = useState("Hombro Izquierdo");
  const [tipoBiopsia, setTipoBiopsia] = useState("Punch (Sacabocados 4mm)");
  const [indicacion, setIndicacion] = useState("Lesión hiperqueratósica sospechosa de Carcinoma Espinocelular");
  const [resultadoHistopatologico, setResultadoHistopatologico] = useState("Queratosis Actínica con atipia citológica focal.");

  useEffect(() => {
    if (dbSkin) {
      setFitzpatrick(dbSkin.fitzpatrickType);
      setAntecedentesCancer(dbSkin.antecedentesCancerPiel);
      if (dbSkin.historiaQuemadurasSolares) setQuemadurasSolares(dbSkin.historiaQuemadurasSolares);
      if (dbSkin.usoFotoprotector) setUsoFotoprotector(dbSkin.usoFotoprotector);
    }
  }, [dbSkin]);

  const handleSaveSkin = () => {
    saveSkinMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      fitzpatrickType: fitzpatrick,
      antecedentesCancerPiel: antecedentesCancer,
      historiaQuemadurasSolares: quemadurasSolares,
      usoFotoprotector,
    });
  };

  const handleAddLesion = () => {
    saveLesionMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      localizacion,
      asimetriaAbcde: asimetria,
      bordesIrregularesAbcde: bordes,
      colorVariadoAbcde: color,
      diametroMayorMm: diametro,
      evolucionCambiosAbcde: evolucion,
      dermatoscopiaPatron: dermatoscopia,
      diagnosticoPresuntivo: diagPresuntivo,
    });
  };

  const handleAddBiopsy = () => {
    saveBiopsyMut.mutate({
      encounterId,
      patientRegistrationId: effectivePatId,
      sitioBiopsia,
      tipoBiopsia,
      indicacion,
      resultadoHistopatologico,
    });
  };

  const abcdeScore = (asimetria ? 1 : 0) + (bordes ? 1 : 0) + (color ? 1 : 0) + (diametro > 6 ? 1 : 0) + (evolucion ? 1 : 0);

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Brush className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Evaluación de Dermatología</h3>
            <p className="text-xs text-slate-400">Fototipo Fitzpatrick, Criterios ABCDE de Melanoma & Biopsias Cutáneas</p>
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
          onClick={() => setActiveTab("FITZPATRICK")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "FITZPATRICK"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Sun className="w-3.5 h-3.5" /> Fototipo Fitzpatrick
        </button>

        <button
          onClick={() => setActiveTab("LESIONES")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "LESIONES"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Eye className="w-3.5 h-3.5" /> ABCDE Melanoma & Dermatoscopia ({dbLesions.length})
        </button>

        <button
          onClick={() => setActiveTab("BIOPSIAS")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "BIOPSIAS"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Scissors className="w-3.5 h-3.5" /> Biopsias Cutáneas ({dbBiopsies.length})
        </button>
      </div>

      {/* Tab 1: Fototipo Fitzpatrick & Fotoprotección */}
      {activeTab === "FITZPATRICK" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sun className="w-4 h-4" /> Fototipo Cutáneo & Historia de Exposición Solar
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Clasificación de riesgo dermatológico e historial de fotoprotección.</p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveSkin}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs"
            >
              Guardar Perfil Cutáneo
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Fototipo Cutáneo (Fitzpatrick I - VI)</label>
              <select
                value={fitzpatrick}
                onChange={(e) => setFitzpatrick(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded p-2"
              >
                {FITZPATRICK_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Hábitos de Fotoprotección Solar</label>
              <input
                type="text"
                value={usoFotoprotector}
                onChange={(e) => setUsoFotoprotector(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Historia de Quemaduras Solares y Exposición UV</label>
              <input
                type="text"
                value={quemadurasSolares}
                onChange={(e) => setQuemadurasSolares(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                id="antecedentesCancer"
                checked={antecedentesCancer}
                onChange={(e) => setAntecedentesCancer(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <label htmlFor="antecedentesCancer" className="text-slate-300 font-semibold cursor-pointer">
                Antecedentes personales o familiares de Cáncer de Piel / Melanoma
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: ABCDE Melanoma & Dermatoscopia */}
      {activeTab === "LESIONES" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> Registro de Lesión Cutánea & Regla ABCDE de Melanoma
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Asimetría, Bordes, Color, Diámetro mm y Evolución.</p>
            </div>
            <Button
              size="sm"
              onClick={handleAddLesion}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Lesión
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h5 className="font-bold text-amber-400">🔍 Criterios ABCDE de Lesión</h5>

              <div className="space-y-1">
                <label className="text-slate-400">Localización Anatómica:</label>
                <input
                  type="text"
                  value={localizacion}
                  onChange={(e) => setLocalizacion(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="checkbox" checked={asimetria} onChange={(e) => setAsimetria(e.target.checked)} className="accent-amber-500" />
                  (A) Asimetría
                </label>
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="checkbox" checked={bordes} onChange={(e) => setBordes(e.target.checked)} className="accent-amber-500" />
                  (B) Bordes Irregulares
                </label>
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="checkbox" checked={color} onChange={(e) => setColor(e.target.checked)} className="accent-amber-500" />
                  (C) Color Policromático
                </label>
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="checkbox" checked={evolucion} onChange={(e) => setEvolucion(e.target.checked)} className="accent-amber-500" />
                  (E) Evolución / Cambios
                </label>
              </div>

              <div>
                <label className="text-slate-400">(D) Diámetro Mayor (mm):</label>
                <input
                  type="number"
                  step="0.5"
                  value={diametro}
                  onChange={(e) => setDiametro(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded p-1.5 mt-1"
                />
              </div>
            </div>

            {/* Dermatoscopia & Alerta */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h5 className="font-bold text-blue-400">🔬 Hallazgos Dermatoscópicos</h5>

              <div className="space-y-1">
                <label className="text-slate-400">Patrón Dermatoscópico:</label>
                <input
                  type="text"
                  value={dermatoscopia}
                  onChange={(e) => setDermatoscopia(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Diagnóstico Presuntivo:</label>
                <input
                  type="text"
                  value={diagPresuntivo}
                  onChange={(e) => setDiagPresuntivo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-amber-400 font-bold rounded p-1.5"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Puntuación de Sospecha ABCDE:</span>
                <span className={`text-lg font-extrabold ${abcdeScore >= 3 ? "text-red-400" : "text-emerald-400"}`}>
                  {abcdeScore} / 5 Criterios Positivos
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Biopsias Cutáneas */}
      {activeTab === "BIOPSIAS" && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Scissors className="w-4 h-4" /> Registro de Biopsias Cutáneas & Resultado Histopatológico
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Técnica quirúrgica y reporte del patólogo.</p>
            </div>
            <Button
              size="sm"
              onClick={handleAddBiopsy}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Biopsia
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Sitio Anatómico de Biopsia</label>
              <input
                type="text"
                value={sitioBiopsia}
                onChange={(e) => setSitioBiopsia(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tipo / Técnica de Biopsia</label>
              <input
                type="text"
                value={tipoBiopsia}
                onChange={(e) => setTipoBiopsia(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Resultado Histopatológico</label>
              <textarea
                value={resultadoHistopatologico}
                onChange={(e) => setResultadoHistopatologico(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded p-2"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
