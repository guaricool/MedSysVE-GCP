import React, { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useUnsaved } from "@/components/providers/unsaved-changes-provider";
import { Button } from "@/components/ui/button";

export interface FormField {
  name: string;
  label: string;
  type: "text" | "select" | "textarea";
  placeholder?: string;
  options?: string[];
}

interface DynamicSoapFormProps {
  encounterId: string;
  specialtyKey: string;
  fields: FormField[];
  initialData?: Record<string, any>;
  disabled?: boolean;
}

export function DynamicSoapForm({
  encounterId,
  specialtyKey,
  fields,
  initialData = {},
  disabled = false,
}: DynamicSoapFormProps) {
  const [saved, setSaved] = useState(false);
  const utils = trpc.useUtils();

  const defaultData = useMemo(() => {
    const d: Record<string, string> = {};
    fields.forEach((f) => {
      d[f.name] = initialData[f.name] || "";
    });
    return d;
  }, [fields, initialData]);

  const [data, setData] = useState<Record<string, string>>(defaultData);

  const { setDirty } = useUnsaved();

  const isDirty = useMemo(() => {
    return fields.some((f) => data[f.name] !== (initialData[f.name] || ""));
  }, [data, initialData, fields]);

  useEffect(() => {
    setDirty(specialtyKey, isDirty);
    return () => {
      setDirty(specialtyKey, false);
    };
  }, [isDirty, setDirty, specialtyKey]);

  const saveMutation = (trpc.encounter as any).updateSpecialtyData.useMutation({
    onSuccess: () => {
      utils.encounter.get.invalidate({ id: encounterId });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      encounterId,
      datosEspecialidad: data,
    });
  };

  const handleChange = (field: string, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div
            key={field.name}
            className={`space-y-1.5 ${field.type === "textarea" ? "sm:col-span-2" : ""}`}
          >
            <label className="text-xs font-medium text-slate-300">{field.label}</label>
            {field.type === "text" && (
              <input
                type="text"
                disabled={disabled}
                value={data[field.name]}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
            )}
            {field.type === "select" && (
              <select
                disabled={disabled}
                value={data[field.name]}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Seleccione...</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
            {field.type === "textarea" && (
              <textarea
                disabled={disabled}
                rows={3}
                value={data[field.name]}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={disabled || saveMutation.isPending || !isDirty}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          {saveMutation.isPending ? "Guardando..." : "Guardar Ficha"}
        </Button>
        {saved && <span className="text-xs font-semibold text-emerald-400">✓ Guardado exitosamente</span>}
      </div>
    </div>
  );
}
