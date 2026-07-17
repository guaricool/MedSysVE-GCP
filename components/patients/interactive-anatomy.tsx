"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface AnatomyRegion {
  id: string
  label: string
  zone: string
  lateralidad: string
  view: "both" | "anterior" | "posterior"
  type: "path" | "rect" | "circle" | "ellipse"
  props: any
}

// Map coordinates out of 300x600 viewBox
const regions: AnatomyRegion[] = [
  // --- CABEZA Y CUELLO ---
  { id: "head", label: "Cabeza", zone: "Cabeza", lateralidad: "", view: "both", type: "ellipse", props: { cx: 150, cy: 50, rx: 25, ry: 35 } as React.SVGProps<SVGEllipseElement> },
  { id: "neck", label: "Cervical", zone: "Cervical", lateralidad: "", view: "both", type: "rect", props: { x: 135, y: 80, width: 30, height: 20, rx: 5 } as React.SVGProps<SVGRectElement> },

  // --- TORSO ---
  { id: "chest", label: "Tórax", zone: "Tórax", lateralidad: "", view: "anterior", type: "path", props: { d: "M 110 100 L 190 100 Q 200 100 195 160 L 105 160 Q 100 100 110 100 Z" } as React.SVGProps<SVGPathElement> },
  { id: "abdomen", label: "Abdomen", zone: "Abdomen", lateralidad: "", view: "anterior", type: "path", props: { d: "M 105 165 L 195 165 L 185 240 L 115 240 Z" } as React.SVGProps<SVGPathElement> },
  
  // Columna posterior
  { id: "spine_t", label: "Columna Torácica", zone: "Columna Torácica", lateralidad: "", view: "posterior", type: "rect", props: { x: 140, y: 100, width: 20, height: 60, rx: 5 } as React.SVGProps<SVGRectElement> },
  { id: "spine_l", label: "Columna Lumbar", zone: "Columna Lumbar", lateralidad: "", view: "posterior", type: "rect", props: { x: 140, y: 165, width: 20, height: 40, rx: 5 } as React.SVGProps<SVGRectElement> },
  { id: "spine_s", label: "Sacro", zone: "Sacro", lateralidad: "", view: "posterior", type: "rect", props: { x: 140, y: 210, width: 20, height: 30, rx: 5 } as React.SVGProps<SVGRectElement> },
  
  // Back plates (Escápulas/Dorsales)
  { id: "back_l", label: "Escápula Izquierda", zone: "Escápula", lateralidad: "Izquierda", view: "posterior", type: "path", props: { d: "M 110 100 L 135 100 L 135 160 L 105 160 Z" } as React.SVGProps<SVGPathElement> },
  { id: "back_r", label: "Escápula Derecha", zone: "Escápula", lateralidad: "Derecha", view: "posterior", type: "path", props: { d: "M 165 100 L 190 100 L 195 160 L 165 160 Z" } as React.SVGProps<SVGPathElement> },
  { id: "lumbar_l", label: "Lumbar Izquierda", zone: "Lumbar", lateralidad: "Izquierda", view: "posterior", type: "path", props: { d: "M 105 165 L 135 165 L 135 240 L 115 240 Z" } as React.SVGProps<SVGPathElement> },
  { id: "lumbar_r", label: "Lumbar Derecha", zone: "Lumbar", lateralidad: "Derecha", view: "posterior", type: "path", props: { d: "M 165 165 L 195 165 L 185 240 L 165 240 Z" } as React.SVGProps<SVGPathElement> },

  { id: "pelvis", label: "Pelvis", zone: "Pelvis", lateralidad: "", view: "both", type: "path", props: { d: "M 115 245 L 185 245 Q 200 290 150 300 Q 100 290 115 245 Z" } as React.SVGProps<SVGPathElement> },

  // --- BRAZO VIEWER-LEFT ---
  // In Anterior view, viewer left = Patient Right
  // In Posterior view, viewer left = Patient Left
  { id: "shoulder_vl", label: "Hombro", zone: "Hombro", lateralidad: "viewer_left", view: "both", type: "circle", props: { cx: 95, cy: 110, r: 15 } as React.SVGProps<SVGCircleElement> },
  { id: "arm_vl", label: "Brazo", zone: "Brazo", lateralidad: "viewer_left", view: "both", type: "rect", props: { x: 75, y: 125, width: 22, height: 70, rx: 11, transform: "rotate(15 86 160)" } as React.SVGProps<SVGRectElement> },
  { id: "elbow_vl", label: "Codo", zone: "Codo", lateralidad: "viewer_left", view: "both", type: "circle", props: { cx: 62, cy: 195, r: 11 } as React.SVGProps<SVGCircleElement> },
  { id: "forearm_vl", label: "Antebrazo", zone: "Antebrazo", lateralidad: "viewer_left", view: "both", type: "rect", props: { x: 45, y: 205, width: 18, height: 60, rx: 9, transform: "rotate(20 54 235)" } as React.SVGProps<SVGRectElement> },
  { id: "wrist_vl", label: "Muñeca", zone: "Muñeca", lateralidad: "viewer_left", view: "both", type: "circle", props: { cx: 40, cy: 265, r: 9 } as React.SVGProps<SVGCircleElement> },
  { id: "hand_vl", label: "Mano", zone: "Mano", lateralidad: "viewer_left", view: "both", type: "path", props: { d: "M 32 272 L 48 272 L 45 300 L 35 300 Z" } as React.SVGProps<SVGPathElement> },

  // --- BRAZO VIEWER-RIGHT ---
  // In Anterior view, viewer right = Patient Left
  // In Posterior view, viewer right = Patient Right
  { id: "shoulder_vr", label: "Hombro", zone: "Hombro", lateralidad: "viewer_right", view: "both", type: "circle", props: { cx: 205, cy: 110, r: 15 } as React.SVGProps<SVGCircleElement> },
  { id: "arm_vr", label: "Brazo", zone: "Brazo", lateralidad: "viewer_right", view: "both", type: "rect", props: { x: 203, y: 125, width: 22, height: 70, rx: 11, transform: "rotate(-15 214 160)" } as React.SVGProps<SVGRectElement> },
  { id: "elbow_vr", label: "Codo", zone: "Codo", lateralidad: "viewer_right", view: "both", type: "circle", props: { cx: 238, cy: 195, r: 11 } as React.SVGProps<SVGCircleElement> },
  { id: "forearm_vr", label: "Antebrazo", zone: "Antebrazo", lateralidad: "viewer_right", view: "both", type: "rect", props: { x: 237, y: 205, width: 18, height: 60, rx: 9, transform: "rotate(-20 246 235)" } as React.SVGProps<SVGRectElement> },
  { id: "wrist_vr", label: "Muñeca", zone: "Muñeca", lateralidad: "viewer_right", view: "both", type: "circle", props: { cx: 260, cy: 265, r: 9 } as React.SVGProps<SVGCircleElement> },
  { id: "hand_vr", label: "Mano", zone: "Mano", lateralidad: "viewer_right", view: "both", type: "path", props: { d: "M 252 272 L 268 272 L 265 300 L 255 300 Z" } as React.SVGProps<SVGPathElement> },

  // --- PIERNA VIEWER-LEFT ---
  { id: "hip_vl", label: "Cadera", zone: "Cadera", lateralidad: "viewer_left", view: "both", type: "circle", props: { cx: 125, cy: 260, r: 18 } as React.SVGProps<SVGCircleElement> },
  { id: "thigh_vl", label: "Muslo", zone: "Muslo", lateralidad: "viewer_left", view: "both", type: "rect", props: { x: 108, y: 275, width: 30, height: 110, rx: 15, transform: "rotate(5 123 330)" } as React.SVGProps<SVGRectElement> },
  { id: "knee_vl", label: "Rodilla", zone: "Rodilla", lateralidad: "viewer_left", view: "both", type: "circle", props: { cx: 115, cy: 395, r: 14 } as React.SVGProps<SVGCircleElement> },
  { id: "calf_vl", label: "Pierna", zone: "Pierna", lateralidad: "viewer_left", view: "both", type: "rect", props: { x: 104, y: 405, width: 24, height: 100, rx: 12, transform: "rotate(3 116 455)" } as React.SVGProps<SVGRectElement> },
  { id: "ankle_vl", label: "Tobillo", zone: "Tobillo", lateralidad: "viewer_left", view: "both", type: "circle", props: { cx: 112, cy: 512, r: 11 } as React.SVGProps<SVGCircleElement> },
  { id: "foot_vl", label: "Pie", zone: "Pie", lateralidad: "viewer_left", view: "both", type: "path", props: { d: "M 100 520 L 124 520 L 128 550 L 96 550 Z" } as React.SVGProps<SVGPathElement> },

  // --- PIERNA VIEWER-RIGHT ---
  { id: "hip_vr", label: "Cadera", zone: "Cadera", lateralidad: "viewer_right", view: "both", type: "circle", props: { cx: 175, cy: 260, r: 18 } as React.SVGProps<SVGCircleElement> },
  { id: "thigh_vr", label: "Muslo", zone: "Muslo", lateralidad: "viewer_right", view: "both", type: "rect", props: { x: 162, y: 275, width: 30, height: 110, rx: 15, transform: "rotate(-5 177 330)" } as React.SVGProps<SVGRectElement> },
  { id: "knee_vr", label: "Rodilla", zone: "Rodilla", lateralidad: "viewer_right", view: "both", type: "circle", props: { cx: 185, cy: 395, r: 14 } as React.SVGProps<SVGCircleElement> },
  { id: "calf_vr", label: "Pierna", zone: "Pierna", lateralidad: "viewer_right", view: "both", type: "rect", props: { x: 172, y: 405, width: 24, height: 100, rx: 12, transform: "rotate(-3 184 455)" } as React.SVGProps<SVGRectElement> },
  { id: "ankle_vr", label: "Tobillo", zone: "Tobillo", lateralidad: "viewer_right", view: "both", type: "circle", props: { cx: 188, cy: 512, r: 11 } as React.SVGProps<SVGCircleElement> },
  { id: "foot_vr", label: "Pie", zone: "Pie", lateralidad: "viewer_right", view: "both", type: "path", props: { d: "M 176 520 L 200 520 L 204 550 L 172 550 Z" } as React.SVGProps<SVGPathElement> },
]

interface Props {
  selectedZone: string
  selectedLateralidad?: string
  onSelectZone: (zone: string) => void
  onSelectLateralidad?: (lat: string) => void
  disabled?: boolean
}

export function InteractiveAnatomy({
  selectedZone,
  selectedLateralidad,
  onSelectZone,
  onSelectLateralidad,
  disabled,
}: Props) {
  const [view, setView] = useState<"anterior" | "posterior">("anterior")
  const [hovered, setHovered] = useState<string | null>(null)

  // Map the clicked part to actual patient lateralidad based on the view
  const handleRegionClick = (region: AnatomyRegion) => {
    if (disabled) return
    onSelectZone(region.zone)

    if (onSelectLateralidad) {
      if (region.lateralidad === "viewer_left") {
        onSelectLateralidad(view === "anterior" ? "Derecha" : "Izquierda")
      } else if (region.lateralidad === "viewer_right") {
        onSelectLateralidad(view === "anterior" ? "Izquierda" : "Derecha")
      } else if (region.lateralidad !== "") {
        onSelectLateralidad(region.lateralidad)
      } else {
        onSelectLateralidad("")
      }
    }
  }

  // To highlight regions, we check if the current selectedZone and selectedLateralidad match the region
  const isRegionSelected = (region: AnatomyRegion) => {
    if (selectedZone !== region.zone) return false
    
    // Si la región no tiene lateralidad (ej. Cabeza, Tórax), ya con coincidir la zona es suficiente.
    if (region.lateralidad === "") {
      return true
    }
    
    // Si la región sí tiene lateralidad, debemos asegurarnos de que el select coincida.
    let resolvedLateralidad = region.lateralidad
    if (resolvedLateralidad === "viewer_left") {
      resolvedLateralidad = view === "anterior" ? "Derecha" : "Izquierda"
    } else if (resolvedLateralidad === "viewer_right") {
      resolvedLateralidad = view === "anterior" ? "Izquierda" : "Derecha"
    }

    return selectedLateralidad === resolvedLateralidad
  }

  const visibleRegions = regions.filter((r) => r.view === "both" || r.view === view)

  return (
    <div className="flex flex-col gap-4">
      {/* View Toggle */}
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setView("anterior")}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors border",
            view === "anterior" 
              ? "bg-blue-600 border-blue-500 text-white" 
              : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
          )}
        >
          Vista Anterior
        </button>
        <button
          type="button"
          onClick={() => setView("posterior")}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors border",
            view === "posterior" 
              ? "bg-blue-600 border-blue-500 text-white" 
              : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
          )}
        >
          Vista Posterior
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-start rounded-lg border border-slate-700 bg-slate-800/40 p-4">
        {/* Body Map Canvas */}
        <div className="relative mx-auto w-[250px] shrink-0 bg-slate-900 rounded-lg p-2 border border-slate-800 shadow-inner">
          
          <svg viewBox="0 0 300 600" className="w-full h-auto drop-shadow-lg">
            <g strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {visibleRegions.map((region) => {
                const selected = isRegionSelected(region)
                const isHovered = hovered === region.id

                const fillColor = selected 
                  ? "rgba(59, 130, 246, 0.6)" // blue-500 semi-transparent
                  : isHovered 
                    ? "rgba(99, 102, 241, 0.4)" // hover color
                    : "rgba(51, 65, 85, 0.8)" // base slate color

                const strokeColor = selected 
                  ? "#60a5fa" // blue-400
                  : isHovered 
                    ? "#818cf8" 
                    : "#475569" // slate-600

                const styleProps = {
                  fill: fillColor,
                  stroke: strokeColor,
                  className: cn(
                    "transition-all duration-200", 
                    !disabled && "cursor-pointer hover:drop-shadow-md"
                  ),
                  onMouseEnter: () => !disabled && setHovered(region.id),
                  onMouseLeave: () => !disabled && setHovered(null),
                  onClick: () => handleRegionClick(region),
                }

                // Render dynamic SVG primitive based on type
                if (region.type === "path") {
                  return <path key={region.id} {...region.props} {...styleProps} />
                }
                if (region.type === "rect") {
                  return <rect key={region.id} {...region.props} {...styleProps} />
                }
                if (region.type === "circle") {
                  return <circle key={region.id} {...region.props} {...styleProps} />
                }
                if (region.type === "ellipse") {
                  return <ellipse key={region.id} {...region.props} {...styleProps} />
                }
                return null
              })}
            </g>
          </svg>
        </div>

        {/* Info Panel / Text Info */}
        <div className="flex-1 space-y-4 w-full">
          <div className="rounded-lg bg-slate-900 border border-slate-800 p-4">
            <h4 className="text-sm font-semibold text-slate-200 mb-2">Región Seleccionada</h4>
            {selectedZone ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-medium text-white">{selectedZone}</p>
                  {selectedLateralidad && selectedLateralidad !== "N/A" && (
                    <p className="text-sm text-slate-400">Lateralidad: {selectedLateralidad}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Haz clic en el mapa para seleccionar una zona afectada.</p>
            )}
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 text-xs text-slate-400">
            <p className="mb-2"><strong className="text-slate-300">Instrucciones:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>El gráfico está orientado al paciente. En la **Vista Anterior**, el lado izquierdo de tu pantalla corresponde al lado **Derecho** del paciente.</li>
              <li>Al seleccionar una región, los campos del formulario se actualizarán automáticamente.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
