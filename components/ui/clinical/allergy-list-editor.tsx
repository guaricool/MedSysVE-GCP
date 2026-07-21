import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface Allergy {
  sustancia: string;
  reaccion: string;
  gravedad: "LEVE" | "MODERADA" | "SEVERA";
}

export const SEVERITY_COLORS = {
  LEVE: "bg-blue-950/40 text-blue-300 border border-blue-900/50",
  MODERADA: "bg-orange-950/40 text-orange-300 border border-orange-900/50",
  SEVERA: "bg-red-950/40 text-red-300 border border-red-900/50",
};

export const SEVERITY_LABELS = {
  LEVE: "Leve",
  MODERADA: "Moderada",
  SEVERA: "Severa",
};

interface AllergyListEditorProps {
  allergies: Allergy[];
  onAdd: (allergy: Allergy) => void;
  onDelete: (index: number) => void;
}

export function AllergyListEditor({ allergies, onAdd, onDelete }: AllergyListEditorProps) {
  const [showAllergyForm, setShowAllergyForm] = useState(false);
  const [allergyInput, setAllergyInput] = useState<Allergy>({
    sustancia: "",
    reaccion: "",
    gravedad: "LEVE",
  });

  const handleAdd = () => {
    if (!allergyInput.sustancia.trim()) return;
    onAdd(allergyInput);
    setAllergyInput({ sustancia: "", reaccion: "", gravedad: "LEVE" });
    setShowAllergyForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Alergias Registradas</h3>
        {!showAllergyForm && (
          <button
            type="button"
            onClick={() => setShowAllergyForm(true)}
            className="text-xs text-blue-400 hover:underline"
          >
            + Agregar
          </button>
        )}
      </div>

      {allergies.length === 0 && !showAllergyForm && (
        <p className="text-xs text-slate-500">Sin alergias registradas.</p>
      )}

      <div className="space-y-2">
        {allergies.map((a, index) => (
          <div key={index} className="flex items-center gap-2 text-sm bg-slate-950/40 p-2 rounded border border-slate-800">
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${SEVERITY_COLORS[a.gravedad] || SEVERITY_COLORS.LEVE}`}>
              {SEVERITY_LABELS[a.gravedad] || "Leve"}
            </span>
            <span className="text-slate-200 font-medium">{a.sustancia}</span>
            {a.reaccion && <span className="text-slate-400 text-xs">· {a.reaccion}</span>}
            <button
              type="button"
              onClick={() => onDelete(index)}
              className="ml-auto text-slate-500 hover:text-red-400 transition-colors"
              title="Eliminar"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {showAllergyForm && (
        <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-slate-800">
          <div className="flex-1 min-w-[120px] space-y-1">
            <Label className="text-xs text-slate-400">Sustancia</Label>
            <Input
              value={allergyInput.sustancia}
              onChange={(e) => setAllergyInput((a) => ({ ...a, sustancia: e.target.value }))}
              placeholder="Ej: Penicilina"
              className="bg-slate-850 border-slate-700 text-white h-9"
            />
          </div>
          <div className="flex-1 min-w-[120px] space-y-1">
            <Label className="text-xs text-slate-400">Reacción (opcional)</Label>
            <Input
              value={allergyInput.reaccion}
              onChange={(e) => setAllergyInput((a) => ({ ...a, reaccion: e.target.value }))}
              placeholder="Ej: urticaria"
              className="bg-slate-850 border-slate-700 text-white h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Gravedad</Label>
            <select
              value={allergyInput.gravedad}
              onChange={(e) => setAllergyInput((a) => ({ ...a, gravedad: e.target.value as any }))}
              className="bg-slate-850 border border-slate-700 text-white rounded-md px-3 py-2 text-sm h-9 focus:outline-none"
            >
              <option value="LEVE">Leve</option>
              <option value="MODERADA">Moderada</option>
              <option value="SEVERA">Severa</option>
            </select>
          </div>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              type="button"
              onClick={handleAdd}
              disabled={!allergyInput.sustancia.trim()}
              className="bg-blue-600 hover:bg-blue-700 h-9"
            >
              Guardar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => setShowAllergyForm(false)}
              className="text-slate-400 h-9"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
