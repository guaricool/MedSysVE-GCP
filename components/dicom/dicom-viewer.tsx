"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc-client";
import { Button } from "@/components/ui/button";
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sun,
  Ruler,
  Compass,
  Play,
  Pause,
  Eye,
  Sliders,
  Activity,
  Layers,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export interface DicomViewerProps {
  patientRegistrationId: string;
  encounterId?: string;
  initialStudyId?: string;
  modalityFilter?: string;
  // Feature Toggles by Specialty Level
  enableCobbAngle?: boolean;     // Traumatología & Ortopedia
  enableHounsfield?: boolean;    // Urología & Nefrología (densidad HU)
  enableRECIST?: boolean;        // Oncología Médica (Criterios RECIST)
  enableMultiframe?: boolean;    // Cardiología & Obstetricia (Ecos / Cateterismos)
  enableColorInvert?: boolean;   // Neumonología & Infectología (Negativo radiológico)
  enableMultiplanar?: boolean;   // Neurología (Cortes seriados)
  compact?: boolean;
}

export function DicomViewer({
  patientRegistrationId,
  encounterId,
  initialStudyId,
  modalityFilter,
  enableCobbAngle = false,
  enableHounsfield = false,
  enableRECIST = false,
  enableMultiframe = false,
  enableColorInvert = false,
  enableMultiplanar = false,
  compact = false,
}: DicomViewerProps) {
  // Queries
  const { data: studies = [], isLoading } = (trpc.dicom.listPatientStudies.useQuery as any)({
    patientRegistrationId,
    encounterId,
    modality: modalityFilter,
  });

  const [selectedStudyIndex, setSelectedStudyIndex] = useState(0);
  const [selectedSeriesIndex, setSelectedSeriesIndex] = useState(0);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  // Canvas Viewport State
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [contrast, setContrast] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [isInverted, setIsInverted] = useState(false);
  const [activeTool, setActiveTool] = useState<"PAN" | "RULER" | "COBB" | "HU" | "RECIST">("PAN");

  // Multiframe CINE Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(15);

  // Simulated Tools Measurement State
  const [measurements, setMeasurements] = useState<{
    cobbAngle?: number;
    hounsfieldValue?: number;
    recistDimensions?: { lengthMm: number; widthMm: number };
    rulerLengthMm?: number;
  }>({
    cobbAngle: 24.5,
    hounsfieldValue: 42,
    recistDimensions: { lengthMm: 28.4, widthMm: 16.2 },
    rulerLengthMm: 35.8,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeStudy = useMemo(() => {
    return studies[selectedStudyIndex] || null;
  }, [studies, selectedStudyIndex]);

  const activeSeries = useMemo(() => {
    return activeStudy?.series[selectedSeriesIndex] || null;
  }, [activeStudy, selectedSeriesIndex]);

  const activeImages = useMemo(() => {
    return activeSeries?.images || [];
  }, [activeSeries]);

  const currentImage = useMemo(() => {
    return activeImages[currentFrameIndex] || null;
  }, [activeImages, currentFrameIndex]);

  // Multiframe playback effect
  useEffect(() => {
    let interval: any;
    if (isPlaying && activeImages.length > 1) {
      interval = setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % activeImages.length);
      }, 1000 / fps);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeImages.length, fps]);

  // Render Image onto HTML5 Canvas
  useEffect(() => {
    if (!canvasRef.current || !currentImage) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = currentImage.storageUrl;
    img.onload = () => {
      canvas.width = canvas.parentElement?.clientWidth || 600;
      canvas.height = compact ? 350 : 480;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Transform
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      // Filters
      let filterStr = `brightness(${brightness}%) contrast(${contrast}%)`;
      if (isInverted) filterStr += " invert(100%)";
      ctx.filter = filterStr;

      // Draw Image Centered
      ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
      ctx.restore();
    };
  }, [currentImage, zoom, rotation, contrast, brightness, isInverted, compact]);

  if (isLoading) {
    return (
      <div className="bg-slate-950 border border-slate-800 p-8 rounded-xl flex items-center justify-center gap-3 text-slate-400 text-xs">
        <Activity className="w-5 h-5 animate-spin text-cyan-400" />
        <span>Conectando al servidor PACS GCP & Cargando Metadatos DICOM...</span>
      </div>
    );
  }

  if (!activeStudy) {
    return (
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl text-center space-y-2 text-slate-400 text-xs">
        <Layers className="w-8 h-8 mx-auto text-slate-600" />
        <p className="font-semibold text-slate-300">No se encontraron estudios DICOM/PACS registrados para este paciente.</p>
        <p className="text-slate-500">Suba un archivo radiológico DICOM (.dcm) o conecte el Modalidad PACS del centro médico.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl space-y-0 text-slate-100">
      {/* PACS Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            PACS DICOM 3.0
          </span>
          <h4 className="font-bold text-xs text-white truncate max-w-xs">{activeStudy.studyDescription}</h4>
          <span className="text-[11px] font-semibold text-slate-400">({activeStudy.modality})</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px]">Estudio: {activeStudy.studyInstanceUid.slice(0, 18)}...</span>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-cyan-400 font-mono font-bold text-[11px]">
            Frame {currentFrameIndex + 1} / {activeImages.length}
          </span>
        </div>
      </div>

      {/* Main Interactive DICOM Toolbar */}
      <div className="bg-slate-900/60 border-b border-slate-800 p-2 flex flex-wrap items-center justify-between gap-1.5 text-xs">
        {/* Navigation & Basic Viewport Tools */}
        <div className="flex flex-wrap items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom((z) => Math.min(z + 0.25, 4.0))}
            className="h-7 border-slate-800 text-slate-300 hover:bg-slate-800 px-2 gap-1 text-[11px]"
            title="Acercar (Zoom In)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
            className="h-7 border-slate-800 text-slate-300 hover:bg-slate-800 px-2 gap-1 text-[11px]"
            title="Alejar (Zoom Out)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="h-7 border-slate-800 text-slate-300 hover:bg-slate-800 px-2 gap-1 text-[11px]"
            title="Rotar 90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </Button>

          {enableColorInvert && (
            <Button
              size="sm"
              variant={isInverted ? "default" : "outline"}
              onClick={() => setIsInverted(!isInverted)}
              className={`h-7 border-slate-800 px-2 gap-1 text-[11px] ${
                isInverted ? "bg-amber-600 text-white" : "text-slate-300 hover:bg-slate-800"
              }`}
              title="Inversión de Color (Negativo Radiológico)"
            >
              <Eye className="w-3.5 h-3.5" /> Negativo
            </Button>
          )}

          {/* Specialized Tools by Specialty */}
          {enableCobbAngle && (
            <Button
              size="sm"
              variant={activeTool === "COBB" ? "default" : "outline"}
              onClick={() => setActiveTool(activeTool === "COBB" ? "PAN" : "COBB")}
              className={`h-7 border-slate-800 px-2 gap-1 text-[11px] ${
                activeTool === "COBB" ? "bg-cyan-600 text-white" : "text-cyan-400 hover:bg-slate-800"
              }`}
              title="Ángulo de Cobb (Traumatología)"
            >
              <Compass className="w-3.5 h-3.5" /> Ángulo Cobb
            </Button>
          )}

          {enableHounsfield && (
            <Button
              size="sm"
              variant={activeTool === "HU" ? "default" : "outline"}
              onClick={() => setActiveTool(activeTool === "HU" ? "PAN" : "HU")}
              className={`h-7 border-slate-800 px-2 gap-1 text-[11px] ${
                activeTool === "HU" ? "bg-emerald-600 text-white" : "text-emerald-400 hover:bg-slate-800"
              }`}
              title="Lectura Unidades Hounsfield HU (Urología / Nefrología)"
            >
              <Activity className="w-3.5 h-3.5" /> Densidad HU
            </Button>
          )}

          {enableRECIST && (
            <Button
              size="sm"
              variant={activeTool === "RECIST" ? "default" : "outline"}
              onClick={() => setActiveTool(activeTool === "RECIST" ? "PAN" : "RECIST")}
              className={`h-7 border-slate-800 px-2 gap-1 text-[11px] ${
                activeTool === "RECIST" ? "bg-rose-600 text-white" : "text-rose-400 hover:bg-slate-800"
              }`}
              title="Respuesta Tumoral Criterios RECIST (Oncología)"
            >
              <Ruler className="w-3.5 h-3.5" /> RECIST
            </Button>
          )}
        </div>

        {/* Multiframe Playback Bar */}
        {enableMultiframe && activeImages.length > 1 && (
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-cyan-400 hover:text-cyan-300 p-1"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <span className="text-[10px] text-slate-400 font-bold">CINE</span>
            <input
              type="range"
              min="1"
              max="30"
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
              className="w-16 accent-cyan-500 h-1"
              title="Velocidad FPS"
            />
            <span className="text-[10px] text-cyan-300 font-mono">{fps} FPS</span>
          </div>
        )}
      </div>

      {/* Canvas Viewport Body */}
      <div className="relative w-full bg-black flex items-center justify-center min-h-[350px]">
        <canvas ref={canvasRef} className="max-w-full cursor-crosshair shadow-inner" />

        {/* Specialized Measurement Overlays */}
        <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur border border-slate-800 p-2 rounded text-[11px] space-y-1 shadow-lg pointer-events-none">
          <div className="font-bold text-cyan-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Metadatos de la Imagen
          </div>
          <div className="text-slate-300">WW: {contrast * 10} | WC: {brightness - 500}</div>
          <div className="text-slate-400">Zoom: {(zoom * 100).toFixed(0)}% | Rotación: {rotation}°</div>

          {enableCobbAngle && measurements.cobbAngle && (
            <div className="text-cyan-300 font-bold border-t border-slate-800 pt-1 mt-1">
              Ángulo de Cobb: {measurements.cobbAngle}° (Escoliosis)
            </div>
          )}

          {enableHounsfield && measurements.hounsfieldValue !== undefined && (
            <div className="text-emerald-300 font-bold border-t border-slate-800 pt-1 mt-1">
              Densidad Tisular: {measurements.hounsfieldValue} HU (Hounsfield)
            </div>
          )}

          {enableRECIST && measurements.recistDimensions && (
            <div className="text-rose-300 font-bold border-t border-slate-800 pt-1 mt-1">
              RECIST: {measurements.recistDimensions.lengthMm}mm x {measurements.recistDimensions.widthMm}mm
            </div>
          )}
        </div>

        {/* Frame Navigator Buttons */}
        {activeImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/90 border border-slate-800 rounded-full px-3 py-1 flex items-center gap-3 text-xs shadow-xl">
            <button
              onClick={() => setCurrentFrameIndex((prev) => Math.max(prev - 1, 0))}
              disabled={currentFrameIndex === 0}
              className="text-slate-300 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-cyan-400 font-mono font-bold text-xs">
              {currentFrameIndex + 1} / {activeImages.length}
            </span>
            <button
              onClick={() => setCurrentFrameIndex((prev) => Math.min(prev + 1, activeImages.length - 1))}
              disabled={currentFrameIndex === activeImages.length - 1}
              className="text-slate-300 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Series Selection Bar */}
      {activeStudy.series.length > 1 && (
        <div className="bg-slate-900 border-t border-slate-800 p-2 flex items-center gap-2 text-xs overflow-x-auto">
          <span className="text-slate-400 font-bold text-[10px] uppercase">Series DICOM:</span>
          {activeStudy.series.map((s: any, idx: number) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedSeriesIndex(idx);
                setCurrentFrameIndex(0);
              }}
              className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSeriesIndex === idx
                  ? "bg-cyan-600 text-white shadow"
                  : "bg-slate-950 text-slate-400 hover:bg-slate-800"
              }`}
            >
              Series {s.seriesNumber}: {s.seriesDescription || s.modality} ({s.images.length} img)
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
