import React from "react";

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface BloodTypeSelectorProps {
  value: string;
  onChange: (val: string) => void;
}

export function BloodTypeSelector({ value, onChange }: BloodTypeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {BLOOD_TYPES.map((bt) => (
        <button
          key={bt}
          type="button"
          onClick={() => onChange(bt)}
          className={`rounded px-3 py-1.5 text-sm font-semibold transition ${
            value === bt
              ? "bg-red-700 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-750"
          }`}
        >
          {bt}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange("")}
        className={`rounded px-3 py-1.5 text-sm transition ${
          value === "" ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-750"
        }`}
      >
        Sin dato
      </button>
    </div>
  );
}
