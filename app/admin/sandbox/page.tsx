"use client";

import { useState } from "react";
import {
  Stethoscope,
  User,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Heart,
  Bone,
  Baby,
  Brain,
  Activity,
  Syringe,
  Microscope,
  Zap,
  Ear,
  Eye,
  Crosshair,
  AlertOctagon,
  Users,
  Scissors,
  Droplet,
  Leaf,
  Dumbbell,
  FileSpreadsheet,
} from "lucide-react";
import { EncounterWorkspace } from "@/components/encounter/encounter-workspace";

const SPECIALTIES = [
  { id: "Otorrinolaringología", name: "Otorrinolaringología (ORL)", icon: Ear, category: "Quirúrgica / Clínica" },
  { id: "Traumatología", name: "Traumatología y Ortopedia", icon: Bone, category: "Quirúrgica" },
  { id: "Cardiología", name: "Cardiología", icon: Heart, category: "Clínica" },
  { id: "Pediatría", name: "Pediatría y Puericultura", icon: Baby, category: "Pediátrica" },
  { id: "Ginecología y Obstetricia", name: "Obstetricia y Ginecología", icon: Activity, category: "Materno-Infantil" },
  { id: "Neurología", name: "Neurología", icon: Brain, category: "Clínica" },
  { id: "Endocrinología", name: "Endocrinología", icon: Zap, category: "Clínica" },
  { id: "Psiquiatría", name: "Psiquiatría y Salud Mental", icon: Stethoscope, category: "Mental" },
  { id: "Dermatología", name: "Dermatología", icon: Stethoscope, category: "Clínica" },
  { id: "Gastroenterología", name: "Gastroenterología", icon: Microscope, category: "Clínica" },
  { id: "Anestesiología", name: "Anestesiología", icon: Syringe, category: "Quirúrgica" },
  { id: "Cirugía General", name: "Cirugía General", icon: Activity, category: "Quirúrgica" },
  { id: "Infectología", name: "Infectología", icon: Microscope, category: "Clínica" },
  { id: "Medicina Interna", name: "Medicina Interna", icon: Stethoscope, category: "Clínica" },
  { id: "Neumonología", name: "Neumonología", icon: Activity, category: "Clínica" },
  { id: "Oncología", name: "Oncología Médica", icon: Sparkles, category: "Oncológica" },
  { id: "Urología", name: "Urología", icon: Activity, category: "Quirúrgica" },
  { id: "Oftalmología", name: "Oftalmología (Clínica / Quirúrgica)", icon: Eye, category: "Especializada" },
  { id: "Reumatología", name: "Reumatología", icon: Bone, category: "Clínica" },
  { id: "Nefrología", name: "Nefrología", icon: Stethoscope, category: "Clínica" },
  { id: "Emergencias", name: "Medicina de Emergencia / Urgencias", icon: AlertOctagon, category: "Crítica" },
  { id: "Geriatría", name: "Geriatría (Valoración VGI)", icon: Users, category: "Clínica" },
  { id: "Medicina Familiar", name: "Medicina Familiar (Genograma & APGAR)", icon: Users, category: "Atención Primaria" },
  { id: "Cirugía Plástica", name: "Cirugía Plástica y Reconstructiva", icon: Scissors, category: "Estética / Quirúrgica" },
  { id: "Hematología", name: "Hematología (Frotis & Transfusional)", icon: Droplet, category: "Clínica" },
  { id: "Alergología", name: "Alergología e Inmunología (Prick Test)", icon: Leaf, category: "Clínica" },
  { id: "Fisiatría", name: "Medicina Física y Rehabilitación (Fisiatría)", icon: Dumbbell, category: "Rehabilitación" },
];

const DEMO_PATIENTS = [
  {
    id: "CAMILA_PEREZ",
    label: "Camila Pérez · 26 años (#000007)",
    nombre: "Camila Pérez",
    edad: 26,
    alergias: [{ sustancia: "Penicilina", gravedad: "SEVERA", reaccion: "Urticaria" }],
    cronicos: ["Asma Bronquial"],
  },
  {
    id: "JUAN_PEREZ",
    label: "Juan Carlos Pérez · 35 años (#000008)",
    nombre: "Juan Carlos Pérez",
    edad: 35,
    alergias: [{ sustancia: "Aspirina", gravedad: "LEVE", reaccion: "Gastritis" }],
    cronicos: ["Hipertensión Arterial (HTA)"],
  },
  {
    id: "MATEO_GOMEZ",
    label: "Mateo Alejandro Gómez · 6 años (#000009 - Pediátrico)",
    nombre: "Mateo Alejandro Gómez",
    edad: 6,
    alergias: [{ sustancia: "Amoxicilina", gravedad: "LEVE", reaccion: "Rash" }],
    cronicos: [],
  },
  {
    id: "ANA_SILVA",
    label: "Ana Sofia Silva · 28 años (#000010 - Obstétrica)",
    nombre: "Ana Sofia Silva",
    edad: 28,
    alergias: [],
    cronicos: ["Embarazo 24 semanas"],
  },
];

export default function AdminSandboxPage() {
  const [selectedSpecialty, setSelectedSpecialty] = useState("Traumatología");
  const [selectedPatientId, setSelectedPatientId] = useState("CAMILA_PEREZ");

  const patient = DEMO_PATIENTS.find((p) => p.id === selectedPatientId) || DEMO_PATIENTS[0];
  const specialtyObj = SPECIALTIES.find((s) => s.id === selectedSpecialty) || SPECIALTIES[0];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Exclusivo Super Admin · cpierluissis@gmail.com
            </span>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-medium px-2 py-0.5 rounded-full">
              Consulta Completa en Tiempo Real (27 Especialidades)
            </span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            🔬 Sandbox de Especialidades — Pruebas de Interfaz y Módulos Clínicos
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Muestra el espacio de trabajo de consulta médica 100% completo (SOAP, Ficha de Especialidad, Visor DICOM PACS, Vademécum, Signos Vitales y Firma).
          </p>
        </div>
      </div>

      {/* Control Toolbar Bar */}
      <div className="grid md:grid-cols-2 gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-md">
        {/* Specialty Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-amber-400" />
            1. Seleccionar Especialidad Médica ({SPECIALTIES.length} Disponibles)
          </label>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            {SPECIALTIES.map((spec) => (
              <option key={spec.id} value={spec.id} className="bg-slate-900 text-white font-medium py-1">
                {spec.name} ({spec.category})
              </option>
            ))}
          </select>
        </div>

        {/* Patient Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <User className="text-blue-400 w-3.5 h-3.5" />
            2. Paciente de Consulta Demo
          </label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {DEMO_PATIENTS.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-white font-medium py-1">
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Mode Status Badge */}
      <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <specialtyObj.icon className="w-4 h-4 text-amber-400" />
          <span className="text-slate-300">
            Especialidad Activa: <strong className="text-white">{specialtyObj.name}</strong>
          </span>
        </div>
        <span className="text-emerald-400 font-medium flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Ficha & Visor DICOM PACS Creados e Integrados
        </span>
      </div>

      {/* Full Real Encounter Workspace Container */}
      <div className="border border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-950">
        <EncounterWorkspace
          key={`${selectedSpecialty}-${selectedPatientId}`}
          encounterId="sandbox-demo"
          patientRegId="sandbox-demo-pat"
          initialStatus="DRAFT"
          patientNombre={patient.nombre}
          patientEdad={patient.edad}
          patientAlergias={patient.alergias}
          patientCronicos={patient.cronicos}
          overrideSpecialty={selectedSpecialty}
          initialMotivo={`Consulta de evaluación en ${specialtyObj.name}`}
          initialHistoriaClinica="Paciente acude a consulta para evaluación especializada y seguimiento clínico de evoluciones."
        />
      </div>
    </div>
  );
}
