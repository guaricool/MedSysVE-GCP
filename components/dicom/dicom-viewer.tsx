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
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
} from "lucide-react";

export interface DicomViewerProps {
  patientRegistrationId: string;
  encounterId?: string;
  initialStudyId?: string;
  modalityFilter?: string;
  // Feature Toggles by Specialty Level
  enableCobbAngle?: boolean;     // Traumatología & Ortopedia (Medición de escoliosis)
  enableHounsfield?: boolean;    // Urología & Nefrología (densidad HU)
  enableRECIST?: boolean;        // Oncología Médica (Criterios RECIST)
  enableMultiframe?: boolean;    // Cardiología & Obstetricia (Ecos / Cateterismos)
  enableColorInvert?: boolean;   // Neumonología & Infectología (Negativo radiológico)
  enableMultiplanar?: boolean;   // Neurología (Cortes seriados)
  compact?: boolean;
}

// Sample X-Ray Image Data URL (Spine X-Ray SVG representation for demo)
const SAMPLE_XRAY = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000' fill='%23050b14'><rect width='800' height='1000' fill='%23080e18'/><g stroke='%23e0f2fe' stroke-width='3' fill='none' opacity='0.85'><path d='M400 100 Q430 250 380 450 T410 750 T400 900' stroke='%2338bdf8' stroke-width='6'/><g stroke='%2394a3b8' stroke-width='2' fill='%231e293b'><rect x='350' y='140' width='90' height='45' rx='6'/><rect x='345' y='210' width='100' height='50' rx='6'/><rect x='340' y='290' width='110' height='55' rx='6'/><rect x='335' y='380' width='115' height='60' rx='6'/><rect x='330' y='470' width='120' height='65' rx='6'/><rect x='335' y='570' width='115' height='65' rx='6'/><rect x='340' y='670' width='110' height='60' rx='6'/><rect x='345' y='760' width='100' height='55' rx='6'/></g><path d='M250 200 Q200 350 240 500 T260 750' stroke='%23475569' stroke-width='2'/><path d='M550 200 Q600 350 560 500 T540 750' stroke='%23475569' stroke-width='2'/></g><text x='400' y='50' fill='%2338bdf8' font-size='20' font-family='sans-serif' font-weight='bold' text-anchor='middle'>RADIOGRAFÍA DE COLUMNA - VISTA AP</text><text x='400' y='960' fill='%2364748b' font-size='14' font-family='sans-serif' text-anchor='middle'>MedSysVE PACS · Visor Radiológico Interactivo</text></svg>";

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

  // Local File Upload State
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Canvas Viewport State
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [contrast, setContrast] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [isInverted, setIsInverted] = useState(false);
  const [activeTool, setActiveTool] = useState<"PAN" | "COBB" | "RULER" | "HU">("PAN");

  // Cobb Angle Measurement Lines (Points array on image coords)
  // Line 1: [p0, p1], Line 2: [p2, p3]
  const [cobbPoints, setCobbPoints] = useState<{ x: number; y: number }[]>([]);

  // Multiframe CINE Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(15);

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
    if (localImageUrl) {
      return { storageUrl: localImageUrl };
    }
    return activeImages[currentFrameIndex] || null;
  }, [localImageUrl, activeImages, currentFrameIndex]);

  // Calculate Cobb Angle from 4 points
  const calculatedCobbAngle = useMemo(() => {
    if (cobbPoints.length < 4) return null;
    const [p0, p1, p2, p3] = cobbPoints;
    const angle1 = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
    let diffDeg = Math.abs(((angle1 - angle2) * 180) / Math.PI);
    if (diffDeg > 90) diffDeg = Math.abs(180 - diffDeg);
    return Math.round(diffDeg * 10) / 10;
  }, [cobbPoints]);

  // Handle Local Image Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLocalImageUrl(url);
      setCobbPoints([]);
      setZoom(1.0);
      setRotation(0);
    }
  };

  const handleLoadDemoImage = () => {
    setLocalImageUrl(SAMPLE_XRAY);
    // Pre-populate 4 points for demo Cobb Angle
    setCobbPoints([
      { x: 200, y: 220 },
      { x: 600, y: 240 },
      { x: 210, y: 680 },
      { x: 590, y: 650 },
    ]);
  };

  // Canvas Click Handler for Drawing Lines
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== "COBB" && activeTool !== "RULER") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === "COBB") {
      if (cobbPoints.length >= 4) {
        setCobbPoints([{ x, y }]);
      } else {
        setCobbPoints((prev) => [...prev, { x, y }]);
      }
    }
  };

  // Render Image onto HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const displayUrl = currentImage?.storageUrl || localImageUrl || SAMPLE_XRAY;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = displayUrl;
    img.onload = () => {
      canvas.width = canvas.parentElement?.clientWidth || 700;
      canvas.height = compact ? 380 : 520;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Center & Transformations
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      // Filters (Brightness, Contrast, Invert)
      let filterStr = `brightness(${brightness}%) contrast(${contrast}%)`;
      if (isInverted) filterStr += " invert(100%)";
      ctx.filter = filterStr;

      // Draw Image Centered
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.9;
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Draw Cobb Angle Lines & Measurement Overlay
      if (cobbPoints.length > 0) {
        ctx.save();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#38bdf8"; // Cyan
        ctx.fillStyle = "#38bdf8";

        // Line 1
        if (cobbPoints.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(cobbPoints[0].x, cobbPoints[0].y);
          ctx.lineTo(cobbPoints[1].x, cobbPoints[1].y);
          ctx.stroke();

          // End circles
          ctx.beginPath(); ctx.arc(cobbPoints[0].x, cobbPoints[0].y, 6, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(cobbPoints[1].x, cobbPoints[1].y, 6, 0, Math.PI * 2); ctx.fill();
        }

        // Line 2
        if (cobbPoints.length >= 4) {
          ctx.strokeStyle = "#f59e0b"; // Amber
          ctx.fillStyle = "#f59e0b";
          ctx.beginPath();
          ctx.moveTo(cobbPoints[2].x, cobbPoints[2].y);
          ctx.lineTo(cobbPoints[3].x, cobbPoints[3].y);
          ctx.stroke();

          ctx.beginPath(); ctx.arc(cobbPoints[2].x, cobbPoints[2].y, 6, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(cobbPoints[3].x, cobbPoints[3].y, 6, 0, Math.PI * 2); ctx.fill();

          // Angle Badge
          if (calculatedCobbAngle !== null) {
            const midX = (cobbPoints[0].x + cobbPoints[2].x) / 2;
            const midY = (cobbPoints[0].y + cobbPoints[2].y) / 2;
            ctx.fillStyle = "#0284c7";
            ctx.fillRect(midX - 70, midY - 20, 140, 40);
            ctx.strokeStyle = "#e0f2fe";
            ctx.strokeRect(midX - 70, midY - 20, 140, 40);
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 14px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`Ángulo Cobb: ${calculatedCobbAngle}°`, midX, midY + 5);
          }
        }
        ctx.restore();
      }
    };
  }, [currentImage, localImageUrl, zoom, rotation, contrast, brightness, isInverted, cobbPoints, calculatedCobbAngle, compact]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl space-y-0 text-slate-100">
      {/* Top Header & File Upload Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            VISOR RADIOLÓGICO PACS 3.0
          </span>
          {enableCobbAngle && (
            <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
              Traumatología · Medición Escoliosis
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.dcm"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1.5 shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" /> Seleccionar / Subir Imagen
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleLoadDemoImage}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs gap-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" /> Cargar Imagen Demostración
          </Button>
        </div>
      </div>

      {/* Main Interactive Controls Toolbar */}
      <div className="bg-slate-900/80 border-b border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Basic Viewport Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom((z) => Math.min(z + 0.25, 4.0))}
            className="h-7 border-slate-800 text-slate-300 hover:bg-slate-800 px-2 gap-1 text-[11px]"
            title="Acercar (Zoom In)"
          >
            <ZoomIn className="w-3.5 h-3.5" /> Zoom +
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
            className="h-7 border-slate-800 text-slate-300 hover:bg-slate-800 px-2 gap-1 text-[11px]"
            title="Alejar (Zoom Out)"
          >
            <ZoomOut className="w-3.5 h-3.5" /> Zoom -
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="h-7 border-slate-800 text-slate-300 hover:bg-slate-800 px-2 gap-1 text-[11px]"
            title="Rotar 90°"
          >
            <RotateCw className="w-3.5 h-3.5" /> Rotar 90°
          </Button>

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
        </div>

        {/* Sliders: Brightness & Contrast */}
        <div className="flex items-center gap-4 bg-slate-950 px-3 py-1 rounded border border-slate-800 text-[11px]">
          <div className="flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 font-medium">Brillo:</span>
            <input
              type="range"
              min="30"
              max="200"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-20 accent-amber-500 h-1 cursor-pointer"
            />
            <span className="text-amber-300 font-mono w-8">{brightness}%</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 font-medium">Contraste:</span>
            <input
              type="range"
              min="30"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-20 accent-cyan-500 h-1 cursor-pointer"
            />
            <span className="text-cyan-300 font-mono w-8">{contrast}%</span>
          </div>
        </div>

        {/* Specialized Cobb Angle Line Drawing Button */}
        {enableCobbAngle && (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={activeTool === "COBB" ? "default" : "outline"}
              onClick={() => setActiveTool(activeTool === "COBB" ? "PAN" : "COBB")}
              className={`h-7 border-slate-800 px-2.5 gap-1.5 text-[11px] ${
                activeTool === "COBB" ? "bg-cyan-600 text-white font-bold" : "text-cyan-400 hover:bg-slate-800"
              }`}
              title="Haz clic en la imagen para trazar 2 líneas de vértebras y calcular el Ángulo de Cobb"
            >
              <Compass className="w-3.5 h-3.5" /> Trazar Ángulo Cobb
            </Button>

            {cobbPoints.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCobbPoints([])}
                className="h-7 text-red-400 hover:text-red-300 hover:bg-red-950/40 px-2 text-[11px]"
                title="Borrar líneas"
              >
                <Trash2 className="w-3.5 h-3.5" /> Borrar líneas
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Interactive HTML5 Canvas Viewport */}
      <div className="relative w-full bg-black flex items-center justify-center min-h-[420px]">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className={`max-w-full shadow-inner ${
            activeTool === "COBB" ? "cursor-crosshair" : "cursor-default"
          }`}
        />

        {/* Guidance Overlay Box */}
        <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur border border-slate-800 p-3 rounded-lg text-[11px] space-y-1 shadow-xl pointer-events-none max-w-xs">
          <div className="font-bold text-cyan-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Metadatos Radiológicos
          </div>
          <div className="text-slate-300">
            Brillo: <span className="font-mono text-amber-300">{brightness}%</span> | Contraste: <span className="font-mono text-cyan-300">{contrast}%</span>
          </div>
          <div className="text-slate-400">
            Zoom: {(zoom * 100).toFixed(0)}% | Rotación: {rotation}°
          </div>

          {enableCobbAngle && (
            <div className="pt-1.5 border-t border-slate-800 text-slate-300">
              {calculatedCobbAngle !== null ? (
                <div className="font-bold text-cyan-300 text-xs">
                  📐 Ángulo de Cobb Calculado: {calculatedCobbAngle}°
                </div>
              ) : (
                <div className="text-amber-400/90">
                  {activeTool === "COBB"
                    ? `Haz clic en la imagen para marcar los puntos de la línea ${cobbPoints.length < 2 ? "1 (Superior)" : "2 (Inferior)"} (${cobbPoints.length}/4 puntos)`
                    : "Haz clic en 'Trazar Ángulo Cobb' para medir escoliosis."}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
