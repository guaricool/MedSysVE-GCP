"use client";

import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Ear,
  Wind,
  Mic,
  Activity,
  CheckCircle2,
  Stethoscope,
  Volume2,
  FileText,
  MapPin,
  Camera,
  Trash2,
  Plus,
  BarChart3,
  Layers,
} from "lucide-react";

interface Props {
  encounterId: string;
  disabled?: boolean;
  initialData?: any;
}

const FRECUENCIAS_AIRE = ["125", "250", "500", "1000", "2000", "4000", "8000"];
const FRECUENCIAS_OSEA = ["250", "500", "1000", "2000", "4000"];

const SINTOMAS_OTOLOGICOS = [
  "Otalgia Derecha",
  "Otalgia Izquierda",
  "Otorrea",
  "Otorragia",
  "Hipoacusia Progresiva",
  "Hipoacusia Súbita",
  "Acúfenos / Tinnitus",
  "Plenitud Ótica",
  "Vértigo Rotatorio",
  "Mareo e Inestabilidad",
];

const SINTOMAS_RINOLOGICOS = [
  "Obstrucción Nasal Derecha",
  "Obstrucción Nasal Izquierda",
  "Obstrucción Bilateral",
  "Rinorrea Hialina",
  "Rinorrea Mucopurulenta",
  "Epistaxis",
  "Anosmia / Hiposmia",
  "Prurito Nasal",
  "Estornudos en Salva",
  "Dolor Sinusal / Facial",
];

const SINTOMAS_LARINGOLOGICOS = [
  "Disfonía / Ronquera",
  "Afonía",
  "Odinofagia",
  "Disfagia",
  "Globus Faríngeo",
  "Roncopatía Nocturna",
  "Pausas Apneicas (SAOS)",
  "Tos Crónica",
  "Carraspera Frecuente",
];

const PROCEDIMIENTOS_ORL = [
  "Lavado Ótico / Extracción Cerumen OD",
  "Lavado Ótico / Extracción Cerumen OI",
  "Extracción de Cuerpo Extraño (Ótico/Nasal)",
  "Nasofibrolaringoscopia Flexible",
  "Cauterización de Epistaxis",
  "Taponamiento Nasal Anterior",
  "Aspiración y Limpieza Micro-Ótica",
  "Cureta / Aspiración Sinusal",
];

export function OtorrinolaringologiaForm({ encounterId, disabled, initialData = {} }: Props) {
  const [activeTab, setActiveTab] = useState<"OTOLOGIA" | "AUDIOMETRIA" | "RINOLOGIA" | "LARINGOLOGIA" | "DIAGRAMA" | "ENDOSCOPIA" | "PROCEDIMIENTOS">("OTOLOGIA");
  const [saved, setSaved] = useState(false);
  const { setDirty } = useUnsaved();

  // tRPC queries & mutations
  const { data: dbAudio, refetch: refetchAudio } = (trpc.orl.getAudiometry.useQuery as any)({ encounterId });
  const { data: dbEndo, refetch: refetchEndo } = (trpc.orl.getEndoscopyReport.useQuery as any)({ encounterId });
  const { data: dbPins = [], refetch: refetchPins } = (trpc.orl.listDiagramPins.useQuery as any)({ encounterId });

  const saveAudiometryMut = (trpc.orl.saveAudiometry.useMutation as any)({
    onSuccess: () => refetchAudio(),
  });
  const saveEndoscopyMut = (trpc.orl.saveEndoscopyReport.useMutation as any)({
    onSuccess: () => refetchEndo(),
  });
  const addPinMut = (trpc.orl.addDiagramPin.useMutation as any)({
    onSuccess: () => refetchPins(),
  });
  const deletePinMut = (trpc.orl.deleteDiagramPin.useMutation as any)({
    onSuccess: () => refetchPins(),
  });

  // Local State
  const [data, setData] = useState({
    // Otología
    sintomasOtologicos: initialData.sintomasOtologicos || [],
    otoscopiaOD: initialData.otoscopiaOD || "Íntegra, triángulo luminoso conservado, CAE libre",
    otoscopiaOI: initialData.otoscopiaOI || "Íntegra, triángulo luminoso conservado, CAE libre",
    weberTest: initialData.weberTest || "Centrado",
    rinneOD: initialData.rinneOD || "Positivo (+)",
    rinneOI: initialData.rinneOI || "Positivo (+)",
    hipoacusiaTipoOD: initialData.hipoacusiaTipoOD || "Normal",
    hipoacusiaTipoOI: initialData.hipoacusiaTipoOI || "Normal",
    timpanometria: initialData.timpanometria || "Tipo A (Normal)",

    // Rinología
    sintomasRinologicos: initialData.sintomasRinologicos || [],
    tabiqueNasal: initialData.tabiqueNasal || "Centrado",
    cornetes: initialData.cornetes || "Tróficos y normocoloreados",
    secrecionNasal: initialData.secrecionNasal || "Ausente",
    poliposMasas: initialData.poliposMasas || "Sin lesiones ni pólipos visibles",

    // Laringología
    sintomasLaringologicos: initialData.sintomasLaringologicos || [],
    brodskyAmigdalas: initialData.brodskyAmigdalas || "Grado I (< 25%)",
    mallampatiScore: initialData.mallampatiScore || "Clase I",
    paredFaringea: initialData.paredFaringea || "Normocoloreada, sin exudados",
    cuerdasVocales: initialData.cuerdasVocales || "Movilidad bilateral conservada, bordes libres",

    // Procedimientos y Notas
    procedimientosRealizados: initialData.procedimientosRealizados || [],
    observacionesORL: initialData.observacionesORL || "",
  });

  // Audiometría State
  const [airOd, setAirOd] = useState<Record<string, number>>({ "125": 10, "250": 15, "500": 20, "1000": 20, "2000": 25, "4000": 30, "8000": 35 });
  const [airOi, setAirOi] = useState<Record<string, number>>({ "125": 15, "250": 20, "500": 25, "1000": 30, "2000": 35, "4000": 45, "8000": 50 });
  const [boneOd, setBoneOd] = useState<Record<string, number>>({ "250": 10, "500": 15, "1000": 15, "2000": 20, "4000": 25 });
  const [boneOi, setBoneOi] = useState<Record<string, number>>({ "250": 15, "500": 20, "1000": 25, "2000": 30, "4000": 40 });
  const [logoOd, setLogoOd] = useState<number>(95);
  const [logoOi, setLogoOi] = useState<number>(85);
  const [srtcOd, setSrtcOd] = useState<number>(20);
  const [srtcOi, setSrtcOi] = useState<number>(30);
  const [tympOd, setTympOd] = useState<string>("Tipo A (Normal)");
  const [tympOi, setTympOi] = useState<string>("Tipo C (Disfunción Tubárica)");

  // Endoscopia State
  const [tipoEndo, setTipoEndo] = useState("Nasofibrolaringoscopia Flexible");
  const [endoFosas, setEndoFosas] = useState("Tabique centrado, cornetes inferiores hipertróficos grado II con mucosa pálida.");
  const [endoRino, setEndoRino] = useState("Rodetes tubarios permeables, fosa de Rosenmüller libre de lesiones.");
  const [endoLaringe, setEndoLaringe] = useState("Epiglotis en omega, aritenoides sin edema.");
  const [endoCuerdas, setEndoCuerdas] = useState("Movilidad bilateral conservada. Nódulo pequeño en tercio anterior de cuerda vocal derecha.");
  const [endoConclusion, setEndoConclusion] = useState("Discreta disfonía funcional por nódulo vocal temprano en cuerda vocal derecha.");
  const [endoImages, setEndoImages] = useState<string[]>([]);
  const [newImgUrl, setNewImgUrl] = useState("");

  // Pin State
  const [pinRegion, setPinRegion] = useState("OIDO_IZQUIERDO");
  const [pinTitulo, setPinTitulo] = useState("");
  const [pinHallazgo, setPinHallazgo] = useState("");
  const [pinGravedad, setPinGravedad] = useState<"NORMAL" | "LEVE" | "MODERADO" | "SEVERO">("LEVE");

  useEffect(() => {
    if (dbAudio) {
      if (dbAudio.airOd) setAirOd(dbAudio.airOd);
      if (dbAudio.airOi) setAirOi(dbAudio.airOi);
      if (dbAudio.boneOd) setBoneOd(dbAudio.boneOd);
      if (dbAudio.boneOi) setBoneOi(dbAudio.boneOi);
      if (dbAudio.logoaudioOd !== undefined) setLogoOd(dbAudio.logoaudioOd);
      if (dbAudio.logoaudioOi !== undefined) setLogoOi(dbAudio.logoaudioOi);
      if (dbAudio.srtcOd !== undefined) setSrtcOd(dbAudio.srtcOd);
      if (dbAudio.srtcOi !== undefined) setSrtcOi(dbAudio.srtcOi);
      if (dbAudio.tympanogramOd) setTympOd(dbAudio.tympanogramOd);
      if (dbAudio.tympanogramOi) setTympOi(dbAudio.tympanogramOi);
    }
  }, [dbAudio]);

  useEffect(() => {
    if (dbEndo) {
      if (dbEndo.tipoProcedimiento) setTipoEndo(dbEndo.tipoProcedimiento);
      if (dbEndo.hallazgosFosasNasales) setEndoFosas(dbEndo.hallazgosFosasNasales);
      if (dbEndo.hallazgosRinofaringe) setEndoRino(dbEndo.hallazgosRinofaringe);
      if (dbEndo.hallazgosLaringe) setEndoLaringe(dbEndo.hallazgosLaringe);
      if (dbEndo.hallazgosCuerdasVocales) setEndoCuerdas(dbEndo.hallazgosCuerdasVocales);
      if (dbEndo.conclusion) setEndoConclusion(dbEndo.conclusion);
      if (dbEndo.imagenesUrl) setEndoImages(dbEndo.imagenesUrl);
    }
  }, [dbEndo]);

  const isDirty = useMemo(() => {
    return JSON.stringify(data) !== JSON.stringify(initialData);
  }, [data, initialData]);

  useEffect(() => {
    setDirty("otorrinolaringologia", isDirty);
  }, [isDirty, setDirty]);

  const utils = trpc.useUtils();
  const saveMutation = (trpc.encounter.update as any).useMutation({
    onSuccess: () => {
      utils.encounter.get.invalidate({ id: encounterId });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  function handleSave() {
    saveMutation.mutate({
      id: encounterId,
      datosEspecialidad: data,
    });
  }

  const handleSaveAudiometry = () => {
    saveAudiometryMut.mutate({
      encounterId,
      patientRegistrationId: "sandbox-demo-pat",
      airOd,
      airOi,
      boneOd,
      boneOi,
      logoaudioOd: logoOd,
      logoaudioOi: logoOi,
      srtcOd,
      srtcOi,
      tympanogramOd: tympOd,
      tympanogramOi: tympOi,
    });
  };

  const handleSaveEndoscopy = () => {
    saveEndoscopyMut.mutate({
      encounterId,
      patientRegistrationId: "sandbox-demo-pat",
      tipoProcedimiento: tipoEndo,
      hallazgosFosasNasales: endoFosas,
      hallazgosRinofaringe: endoRino,
      hallazgosLaringe: endoLaringe,
      hallazgosCuerdasVocales: endoCuerdas,
      imagenesUrl: endoImages,
      conclusion: endoConclusion,
    });
  };

  const handleDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pinTitulo || !pinHallazgo) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(1));
    const yPct = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(1));

    addPinMut.mutate({
      encounterId,
      region: pinRegion,
      xPct,
      yPct,
      titulo: pinTitulo,
      hallazgo: pinHallazgo,
      gravedad: pinGravedad,
    });

    setPinTitulo("");
    setPinHallazgo("");
  };

  const toggleArrayItem = (key: "sintomasOtologicos" | "sintomasRinologicos" | "sintomasLaringologicos" | "procedimientosRealizados", item: string) => {
    setData((prev) => {
      const arr = prev[key] as string[];
      const exists = arr.includes(item);
      return {
        ...prev,
        [key]: exists ? arr.filter((i) => i !== item) : [...arr, item],
      };
    });
  };

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-xl text-slate-100 shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Ear className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Evaluación de Otorrinolaringología (ORL)</h3>
            <p className="text-xs text-slate-400">Otología, Audiometría, Rinología, Laringología, Diagrama Trilocalizado e Informes Endoscópicos</p>
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
            onClick={handleSave}
            disabled={disabled || saveMutation.isLoading}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs"
          >
            {saveMutation.isLoading ? "Guardando..." : "Guardar Ficha ORL"}
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveTab("OTOLOGIA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "OTOLOGIA"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Ear className="w-3.5 h-3.5" /> Otología (Oídos)
        </button>

        <button
          onClick={() => setActiveTab("AUDIOMETRIA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "AUDIOMETRIA"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> Audiometría & Timpanometría
        </button>

        <button
          onClick={() => setActiveTab("RINOLOGIA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "RINOLOGIA"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Wind className="w-3.5 h-3.5" /> Rinología (Nariz)
        </button>

        <button
          onClick={() => setActiveTab("LARINGOLOGIA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "LARINGOLOGIA"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Mic className="w-3.5 h-3.5" /> Laringología (Garganta/Voz)
        </button>

        <button
          onClick={() => setActiveTab("DIAGRAMA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "DIAGRAMA"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <MapPin className="w-3.5 h-3.5" /> Diagrama Trilocalizado ({dbPins.length})
        </button>

        <button
          onClick={() => setActiveTab("ENDOSCOPIA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "ENDOSCOPIA"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Camera className="w-3.5 h-3.5" /> Reporte Endoscópico
        </button>

        <button
          onClick={() => setActiveTab("PROCEDIMIENTOS")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === "PROCEDIMIENTOS"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" /> Procedimientos & Notas
        </button>
      </div>

      {/* Tab 1: Otología */}
      {activeTab === "OTOLOGIA" && (
        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" /> Sintomatología Otológica
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SINTOMAS_OTOLOGICOS.map((sintoma) => {
                const active = data.sintomasOtologicos.includes(sintoma);
                return (
                  <button
                    key={sintoma}
                    type="button"
                    onClick={() => toggleArrayItem("sintomasOtologicos", sintoma)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      active
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 font-semibold"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    {sintoma}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-lg space-y-2">
              <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Otoscopia Oído Derecho (OD)
              </label>
              <textarea
                value={data.otoscopiaOD}
                onChange={(e) => setData({ ...data, otoscopiaOD: e.target.value })}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Conducto Auditivo Externo (CAE), Membrana Timpánica, Triángulo luminoso..."
              />
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-lg space-y-2">
              <label className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Otoscopia Oído Izquierdo (OI)
              </label>
              <textarea
                value={data.otoscopiaOI}
                onChange={(e) => setData({ ...data, otoscopiaOI: e.target.value })}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Conducto Auditivo Externo (CAE), Membrana Timpánica, Triángulo luminoso..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Audiometría Tonal & Timpanometría Graph/Grid */}
      {activeTab === "AUDIOMETRIA" && (
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" /> Audiometría Tonal (Vía Aérea / Vía Ósea en dB HL)
            </h4>
            <Button
              size="sm"
              onClick={handleSaveAudiometry}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs"
            >
              Guardar Audiometría
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Oído Derecho (OD - Rojo) */}
            <div className="bg-slate-950/80 border border-red-500/30 p-4 rounded-xl space-y-3">
              <h5 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                🔴 Oído Derecho (OD) — Umbrales Audición
              </h5>

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-300">Vía Aérea (125Hz a 8000Hz - dB):</span>
                <div className="grid grid-cols-7 gap-1">
                  {FRECUENCIAS_AIRE.map((freq) => (
                    <div key={freq} className="text-center">
                      <span className="text-[10px] text-slate-400">{freq}Hz</span>
                      <input
                        type="number"
                        value={airOd[freq] ?? 0}
                        onChange={(e) => setAirOd({ ...airOd, [freq]: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-red-500/40 text-red-300 text-center rounded text-xs py-1 font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-300">Vía Ósea (250Hz a 4000Hz - dB):</span>
                <div className="grid grid-cols-5 gap-1">
                  {FRECUENCIAS_OSEA.map((freq) => (
                    <div key={freq} className="text-center">
                      <span className="text-[10px] text-slate-400">{freq}Hz</span>
                      <input
                        type="number"
                        value={boneOd[freq] ?? 0}
                        onChange={(e) => setBoneOd({ ...boneOd, [freq]: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-center rounded text-xs py-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div>
                  <span className="text-slate-400">Logoaudiometría (%):</span>
                  <input
                    type="number"
                    value={logoOd}
                    onChange={(e) => setLogoOd(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1 text-xs mt-1"
                  />
                </div>
                <div>
                  <span className="text-slate-400">SRT (dB):</span>
                  <input
                    type="number"
                    value={srtcOd}
                    onChange={(e) => setSrtcOd(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1 text-xs mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Oído Izquierdo (OI - Azul) */}
            <div className="bg-slate-950/80 border border-blue-500/30 p-4 rounded-xl space-y-3">
              <h5 className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                🔵 Oído Izquierdo (OI) — Umbrales Audición
              </h5>

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-300">Vía Aérea (125Hz a 8000Hz - dB):</span>
                <div className="grid grid-cols-7 gap-1">
                  {FRECUENCIAS_AIRE.map((freq) => (
                    <div key={freq} className="text-center">
                      <span className="text-[10px] text-slate-400">{freq}Hz</span>
                      <input
                        type="number"
                        value={airOi[freq] ?? 0}
                        onChange={(e) => setAirOi({ ...airOi, [freq]: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-blue-500/40 text-blue-300 text-center rounded text-xs py-1 font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-300">Vía Ósea (250Hz a 4000Hz - dB):</span>
                <div className="grid grid-cols-5 gap-1">
                  {FRECUENCIAS_OSEA.map((freq) => (
                    <div key={freq} className="text-center">
                      <span className="text-[10px] text-slate-400">{freq}Hz</span>
                      <input
                        type="number"
                        value={boneOi[freq] ?? 0}
                        onChange={(e) => setBoneOi({ ...boneOi, [freq]: Number(e.target.value) })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-center rounded text-xs py-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div>
                  <span className="text-slate-400">Logoaudiometría (%):</span>
                  <input
                    type="number"
                    value={logoOi}
                    onChange={(e) => setLogoOi(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1 text-xs mt-1"
                  />
                </div>
                <div>
                  <span className="text-slate-400">SRT (dB):</span>
                  <input
                    type="number"
                    value={srtcOi}
                    onChange={(e) => setSrtcOi(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1 text-xs mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Timpanometría Curves */}
          <div className="grid md:grid-cols-2 gap-4 text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Timpanograma Oído Derecho (OD)</label>
              <select
                value={tympOd}
                onChange={(e) => setTympOd(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              >
                <option value="Tipo A (Normal)">Tipo A (Normal - Picó centrado en 0 daPa)</option>
                <option value="Tipo B (Plana / Efusión)">Tipo B (Plana - Efusión en oído medio)</option>
                <option value="Tipo C (Presión Negativa)">Tipo C (Presión negativa / Disfunción trompa)</option>
                <option value="Tipo As (Baja Amplitud)">Tipo As (Baja amplitud / Otoesclerosis)</option>
                <option value="Tipo Ad (Disyunción)">Tipo Ad (Disyunción de cadena de huesecillos)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Timpanograma Oído Izquierdo (OI)</label>
              <select
                value={tympOi}
                onChange={(e) => setTympOi(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-2"
              >
                <option value="Tipo A (Normal)">Tipo A (Normal - Picó centrado en 0 daPa)</option>
                <option value="Tipo B (Plana / Efusión)">Tipo B (Plana - Efusión en oído medio)</option>
                <option value="Tipo C (Presión Negativa)">Tipo C (Presión negativa / Disfunción trompa)</option>
                <option value="Tipo As (Baja Amplitud)">Tipo As (Baja amplitud / Otoesclerosis)</option>
                <option value="Tipo Ad (Disyunción)">Tipo Ad (Disyunción de cadena de huesecillos)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Rinología */}
      {activeTab === "RINOLOGIA" && (
        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5" /> Sintomatología Rinológica
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SINTOMAS_RINOLOGICOS.map((sintoma) => {
                const active = data.sintomasRinologicos.includes(sintoma);
                return (
                  <button
                    key={sintoma}
                    type="button"
                    onClick={() => toggleArrayItem("sintomasRinologicos", sintoma)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      active
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 font-semibold"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    {sintoma}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Laringología */}
      {activeTab === "LARINGOLOGIA" && (
        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" /> Sintomatología Laringológica & Faringe
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SINTOMAS_LARINGOLOGICOS.map((sintoma) => {
                const active = data.sintomasLaringologicos.includes(sintoma);
                return (
                  <button
                    key={sintoma}
                    type="button"
                    onClick={() => toggleArrayItem("sintomasLaringologicos", sintoma)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      active
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 font-semibold"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    {sintoma}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Diagrama Trilocalizado Interactivo con Pins */}
      {activeTab === "DIAGRAMA" && (
        <div className="space-y-4 pt-2">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> Mapa Anatómico Trilocalizado (Oídos, Nariz, Laringe)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Haz clic sobre cualquier región del esquema anatómico para colocar un pin interactivo de hallazgo clínico.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
            <div>
              <label className="text-slate-400">Región del Pin:</label>
              <select
                value={pinRegion}
                onChange={(e) => setPinRegion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
              >
                <option value="OIDO_DERECHO">Oído Derecho (OD)</option>
                <option value="OIDO_IZQUIERDO">Oído Izquierdo (OI)</option>
                <option value="NARIZ_TABIQUE">Nariz / Septum Nasal</option>
                <option value="NARIZ_CORNETES">Cornetes Nasales</option>
                <option value="LARI_CUERDAS">Cuerdas Vocales / Laringe</option>
                <option value="FARINGE">Orofaringe / Amígdalas</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400">Título del Hallazgo:</label>
              <input
                type="text"
                value={pinTitulo}
                onChange={(e) => setPinTitulo(e.target.value)}
                placeholder="Ej: Perforación Timpánica Central"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5 mt-1"
              />
            </div>

            <div>
              <label className="text-slate-400">Descripción / Gravedad:</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={pinHallazgo}
                  onChange={(e) => setPinHallazgo(e.target.value)}
                  placeholder="Detalle clínico..."
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded p-1.5"
                />
                <select
                  value={pinGravedad}
                  onChange={(e: any) => setPinGravedad(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded px-2"
                >
                  <option value="LEVE">Leve</option>
                  <option value="MODERADO">Mod.</option>
                  <option value="SEVERO">Sev.</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interactive Canvas Canvas */}
          <div
            onClick={handleDiagramClick}
            className="relative w-full h-[320px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden cursor-crosshair flex items-center justify-center shadow-inner"
          >
            {/* Visual Scheme Background Representation */}
            <div className="absolute inset-0 grid grid-cols-3 divide-x divide-slate-800/80 pointer-events-none opacity-40">
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <Ear className="w-16 h-16 text-amber-500 mb-2" />
                <span className="text-xs font-bold text-amber-400 uppercase">Esquema Otológico</span>
                <span className="text-[10px] text-slate-400">OD & OI (Conducto / Timpánico)</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <Wind className="w-16 h-16 text-blue-500 mb-2" />
                <span className="text-xs font-bold text-blue-400 uppercase">Esquema Rinológico</span>
                <span className="text-[10px] text-slate-400">Septum / Cornetes / Meatos</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <Mic className="w-16 h-16 text-purple-500 mb-2" />
                <span className="text-xs font-bold text-purple-400 uppercase">Esquema Laringofaríngeo</span>
                <span className="text-[10px] text-slate-400">Cuerdas Vocales / Glotis / Amígdalas</span>
              </div>
            </div>

            {/* Rendered Pins */}
            {dbPins.map((pin: any) => (
              <div
                key={pin.id}
                style={{ left: `${pin.xPct}%`, top: `${pin.yPct}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-lg cursor-pointer transition-transform hover:scale-125 ${
                    pin.gravedad === "SEVERO"
                      ? "bg-red-500 text-white border-2 border-white animate-pulse"
                      : pin.gravedad === "MODERADO"
                      ? "bg-amber-500 text-slate-950 border-2 border-white"
                      : "bg-emerald-500 text-slate-950 border-2 border-white"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                </div>

                {/* Popover Tooltip */}
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 border border-slate-700 p-2 rounded shadow-2xl text-[11px] z-20 pointer-events-auto">
                  <div className="flex items-center justify-between font-bold text-white mb-1">
                    <span>{pin.titulo}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePinMut.mutate({ id: pin.id });
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-slate-300 text-[10px] leading-tight">{pin.hallazgo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Reporte Endoscópico con Captura de Imágenes */}
      {activeTab === "ENDOSCOPIA" && (
        <div className="space-y-5 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4" /> Informe Endoscópico ORL con Galería
            </h4>
            <Button
              size="sm"
              onClick={handleSaveEndoscopy}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs"
            >
              Guardar Reporte Endoscópico
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tipo de Procedimiento Endoscópico</label>
              <input
                type="text"
                value={tipoEndo}
                onChange={(e) => setTipoEndo(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 text-white rounded p-2"
                placeholder="Ej: Nasofibrolaringoscopia Flexible..."
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Conclusión Endoscópica</label>
              <input
                type="text"
                value={endoConclusion}
                onChange={(e) => setEndoConclusion(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 text-white rounded p-2"
                placeholder="Conclusión diagnóstica..."
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Fosas Nasales & Meatos</label>
              <textarea
                value={endoFosas}
                onChange={(e) => setEndoFosas(e.target.value)}
                rows={2}
                className="w-full bg-slate-950/60 border border-slate-800 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Rinofaringe & Cavum</label>
              <textarea
                value={endoRino}
                onChange={(e) => setEndoRino(e.target.value)}
                rows={2}
                className="w-full bg-slate-950/60 border border-slate-800 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Hipofaringe & Laringe</label>
              <textarea
                value={endoLaringe}
                onChange={(e) => setEndoLaringe(e.target.value)}
                rows={2}
                className="w-full bg-slate-950/60 border border-slate-800 text-white rounded p-2"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Cuerdas Vocales & Glotis</label>
              <textarea
                value={endoCuerdas}
                onChange={(e) => setEndoCuerdas(e.target.value)}
                rows={2}
                className="w-full bg-slate-950/60 border border-slate-800 text-white rounded p-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Procedimientos */}
      {activeTab === "PROCEDIMIENTOS" && (
        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5" /> Procedimientos ORL Realizados
            </label>
            <div className="grid sm:grid-cols-2 gap-2">
              {PROCEDIMIENTOS_ORL.map((proc) => {
                const active = data.procedimientosRealizados.includes(proc);
                return (
                  <button
                    key={proc}
                    type="button"
                    onClick={() => toggleArrayItem("procedimientosRealizados", proc)}
                    className={`text-xs p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                      active
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 font-semibold"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>{proc}</span>
                    {active && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
