"use client";

import { useState } from "react";
import {
  Stethoscope,
  Activity,
  Heart,
  User,
  FileText,
  Pill,
  Sparkles,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Bone,
  Baby,
  Brain,
  Eye,
  Syringe,
  Microscope,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Import all specialty form components
import { TraumatologiaForm } from "@/components/encounter/traumatologia-form";
import { CardiologiaForm } from "@/components/encounter/cardiologia-form";
import { PediatriaForm } from "@/components/encounter/pediatria-form";
import { ObstetriciaForm } from "@/components/encounter/obstetricia-form";
import { EndocrinologiaForm } from "@/components/encounter/endocrinologia-form";
import { NeurologiaForm } from "@/components/encounter/neurologia-form";
import { PsiquiatriaForm } from "@/components/encounter/psiquiatria-form";
import { DermatologiaForm } from "@/components/encounter/dermatologia-form";
import { GastroenterologiaForm } from "@/components/encounter/gastroenterologia-form";
import { AnestesiologiaForm } from "@/components/encounter/anestesiologia-form";
import { CirugiaGeneralForm } from "@/components/encounter/cirugia-general-form";
import { InfectologiaForm } from "@/components/encounter/infectologia-form";
import { MedicinaInternaForm } from "@/components/encounter/medicina-interna-form";
import { NeumonologiaForm } from "@/components/encounter/neumonologia-form";
import { OncologiaForm } from "@/components/encounter/oncologia-form";
import { UrologiaForm } from "@/components/encounter/urologia-form";
import { DynamicSoapForm } from "@/components/ui/clinical/dynamic-soap-form";
import { VitalsForm } from "@/components/encounter/vitals-form";
import { ExamenFisicoForm } from "@/components/encounter/examen-fisico-form";
import { RecetaForm } from "@/components/encounter/receta-form";

const SPECIALTIES = [
  { id: "TRAUMATOLOGIA", name: "Traumatología y Ortopedia", icon: Bone, category: "Quirúrgica" },
  { id: "CARDIOLOGIA", name: "Cardiología", icon: Heart, category: "Clínica" },
  { id: "PEDIATRIA", name: "Pediatría y Puericultura", icon: Baby, category: "Pediátrica" },
  { id: "OBSTETRICIA", name: "Obstetricia y Ginecología", icon: Activity, category: "Materno-Infantil" },
  { id: "NEUROLOGIA", name: "Neurología", icon: Brain, category: "Clínica" },
  { id: "ENDOCRINOLOGIA", name: "Endocrinología", icon: Zap, category: "Clínica" },
  { id: "PSIQUIATRIA", name: "Psiquiatría y Salud Mental", icon: Stethoscope, category: "Mental" },
  { id: "DERMATOLOGIA", name: "Dermatología", icon: Eye, category: "Clínica" },
  { id: "GASTROENTEROLOGIA", name: "Gastroenterología", icon: Microscope, category: "Clínica" },
  { id: "ANESTESIOLOGIA", name: "Anestesiología", icon: Syringe, category: "Quirúrgica" },
  { id: "CIRUGIA_GENERAL", name: "Cirugía General", icon: Activity, category: "Quirúrgica" },
  { id: "INFECTOLOGIA", name: "Infectología", icon: Microscope, category: "Clínica" },
  { id: "MEDICINA_INTERNA", name: "Medicina Interna", icon: Stethoscope, category: "Clínica" },
  { id: "NEUMONOLOGIA", name: "Neumonología", icon: Activity, category: "Clínica" },
  { id: "ONCOLOGIA", name: "Oncología Médica", icon: Sparkles, category: "Oncológica" },
  { id: "UROLOGIA", name: "Urología", icon: Activity, category: "Quirúrgica" },
  { id: "GENERAL", name: "Medicina General / SOAP Dinámico", icon: Stethoscope, category: "General" },
];

const DEMO_PATIENTS = [
  {
    id: "ADULT_MALE",
    label: "Juan Carlos Pérez · 35 años (Adulto Masculino)",
    nombre: "Juan Carlos",
    apellido: "Pérez",
    cedula: "V-15.420.123",
    edad: "35 años",
    sangre: "O+",
    alergias: "Penicilina (Severa)",
  },
  {
    id: "ADULT_FEMALE",
    label: "María Elena Rodríguez · 32 años (Adulto Femenino)",
    nombre: "María Elena",
    apellido: "Rodríguez",
    cedula: "V-18.900.542",
    edad: "32 años",
    sangre: "A+",
    alergias: "Ninguna conocida",
  },
  {
    id: "PEDIATRIC",
    label: "Mateo Alejandro Gómez · 6 años (Pediátrico)",
    nombre: "Mateo Alejandro",
    apellido: "Gómez",
    cedula: "V-33.120.450",
    edad: "6 años",
    sangre: "O+",
    alergias: "Amoxicilina (Leve)",
  },
  {
    id: "OBSTETRIC",
    label: "Ana Sofia Silva · 28 años (Obstétrica / Embarazo 24 semanas)",
    nombre: "Ana Sofia",
    apellido: "Silva",
    cedula: "V-22.450.890",
    edad: "28 años",
    sangre: "B+",
    alergias: "Aspirina",
  },
];

const SAMPLE_GENERAL_FIELDS = [
  { name: "motivoConsulta", label: "Motivo Principal de Consulta", type: "text" as const, placeholder: "Ej: Dolor torácico opresivo de 2 horas de evolución" },
  { name: "antecedentesRelevantes", label: "Antecedentes de Importancia", type: "textarea" as const, placeholder: "Hipertensión arterial, Diabetes Tipo 2..." },
  { name: "impresionDiagnostica", label: "Impresión Diagnóstica (CIE-10 / ICD-11)", type: "text" as const, placeholder: "Ej: I20.9 Angina de pecho no especificada" },
  { name: "planTratamiento", label: "Plan de Tratamiento y Recomendaciones", type: "textarea" as const, placeholder: "1. Reposo absoluto 2. Control de signos vitales..." },
];

export default function AdminSandboxPage() {
  const [selectedSpecialty, setSelectedSpecialty] = useState("TRAUMATOLOGIA");
  const [selectedPatientId, setSelectedPatientId] = useState("ADULT_MALE");
  const [activeTab, setActiveTab] = useState<"SPECIALTY" | "VITALS" | "EXAM" | "RECETA" | "PREVIEW">("SPECIALTY");

  const patient = DEMO_PATIENTS.find((p) => p.id === selectedPatientId) || DEMO_PATIENTS[0];
  const specialtyObj = SPECIALTIES.find((s) => s.id === selectedSpecialty) || SPECIALTIES[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Exclusivo Super Admin · cpierluissis@gmail.com
            </span>
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-medium px-2 py-0.5 rounded-full">
              Entorno Sandbox Interactivo
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🔬 Sandbox de Especialidades Médicas
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Prueba de primera mano cómo funciona la consulta para cada especialidad. Selecciona una especialidad abajo para renderizar exactamente el mismo formulario, vademécum e interfaz que ven los médicos especialistas en producción.
          </p>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="grid md:grid-cols-2 gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
        {/* Specialty Picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-amber-400" />
            1. Seleccionar Especialidad a Probar ({SPECIALTIES.length})
          </label>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            {SPECIALTIES.map((spec) => (
              <option key={spec.id} value={spec.id}>
                {spec.name} ({spec.category})
              </option>
            ))}
          </select>
        </div>

        {/* Patient Picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <User className="text-blue-400 w-3.5 h-3.5" />
            2. Paciente de Prueba Simulado
          </label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {DEMO_PATIENTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Context Card */}
      <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-slate-400">
            Paciente: <strong className="text-white">{patient.nombre} {patient.apellido}</strong> ({patient.cedula})
          </span>
          <span className="text-slate-400">
            Edad: <strong className="text-white">{patient.edad}</strong>
          </span>
          <span className="text-slate-400">
            Grupo Sanguíneo: <strong className="text-red-400">{patient.sangre}</strong>
          </span>
          <span className="text-slate-400">
            Alergias: <strong className="text-amber-400">{patient.alergias}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Componente Real Activado: {specialtyObj.name}
          </span>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("SPECIALTY")}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === "SPECIALTY"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
          }`}
        >
          <specialtyObj.icon className="w-4 h-4" />
          Ficha de {specialtyObj.name}
        </button>

        <button
          onClick={() => setActiveTab("VITALS")}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === "VITALS"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
          }`}
        >
          <Activity className="w-4 h-4" />
          Signos Vitales
        </button>

        <button
          onClick={() => setActiveTab("EXAM")}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === "EXAM"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          Examen Físico General
        </button>

        <button
          onClick={() => setActiveTab("RECETA")}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === "RECETA"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
          }`}
        >
          <Pill className="w-4 h-4" />
          Prescripción / Receta Médica
        </button>

        <button
          onClick={() => setActiveTab("PREVIEW")}
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === "PREVIEW"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
          }`}
        >
          <Printer className="w-4 h-4" />
          Documentos & PDFs
        </button>
      </div>

      {/* Main Form Display Body */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl min-h-[450px]">
        {activeTab === "SPECIALTY" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <specialtyObj.icon className="w-4 h-4 text-amber-400" />
                Ficha Técnica: {specialtyObj.name}
              </h2>
              <span className="text-xs text-slate-400">
                Componente: <code className="text-amber-300">{specialtyObj.id}Form</code>
              </span>
            </div>

            {selectedSpecialty === "TRAUMATOLOGIA" && <TraumatologiaForm encounterId="sandbox-demo" />}
            {selectedSpecialty === "CARDIOLOGIA" && <CardiologiaForm encounterId="sandbox-demo" />}
            {selectedSpecialty === "PEDIATRIA" && <PediatriaForm encounterId="sandbox-demo" />}
            {selectedSpecialty === "OBSTETRICIA" && <ObstetriciaForm encounterId="sandbox-demo" />}
            {selectedSpecialty === "ENDOCRINOLOGIA" && <EndocrinologiaForm encounterId="sandbox-demo" patientRegId="sandbox-demo-pat" />}
            {selectedSpecialty === "NEUROLOGIA" && <NeurologiaForm encounterId="sandbox-demo" />}
            {selectedSpecialty === "PSIQUIATRIA" && <PsiquiatriaForm encounterId="sandbox-demo" />}
            {selectedSpecialty === "DERMATOLOGIA" && <DermatologiaForm encounterId="sandbox-demo" />}
            {selectedSpecialty === "GASTROENTEROLOGIA" && <GastroenterologiaForm encounterId="sandbox-demo" />}
            {selectedSpecialty === "ANESTESIOLOGIA" && <AnestesiologiaForm encounterId="sandbox-demo" />}
            {selectedSpecialty === "CIRUGIA_GENERAL" && <CirugiaGeneralForm encounterId="sandbox-demo" />}
            {selectedSpecialty === "INFECTOLOGIA" && <InfectologiaForm encounterId="sandbox-demo" />}
            {selectedSpecialty === "MEDICINA_INTERNA" && <MedicinaInternaForm encounterId="sandbox-demo" />}
            {selectedSpecialty === "NEUMONOLOGIA" && <NeumonologiaForm encounterId="sandbox-demo" />}
            {selectedSpecialty === "ONCOLOGIA" && <OncologiaForm encounterId="sandbox-demo" />}
            {selectedSpecialty === "UROLOGIA" && <UrologiaForm encounterId="sandbox-demo" />}
            {selectedSpecialty === "GENERAL" && (
              <DynamicSoapForm
                encounterId="sandbox-demo"
                specialtyKey="general"
                fields={SAMPLE_GENERAL_FIELDS}
              />
            )}
          </div>
        )}

        {activeTab === "VITALS" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Activity className="w-4 h-4 text-blue-400" />
              Signos Vitales y Biometría
            </h2>
            <VitalsForm encounterId="sandbox-demo" />
          </div>
        )}

        {activeTab === "EXAM" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Stethoscope className="w-4 h-4 text-purple-400" />
              Examen Físico Segmentario
            </h2>
            <ExamenFisicoForm encounterId="sandbox-demo" disabled={false} />
          </div>
        )}

        {activeTab === "RECETA" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Pill className="w-4 h-4 text-emerald-400" />
              Receta Médica y Búsqueda en Vademécum
            </h2>
            <RecetaForm encounterId="sandbox-demo" disabled={false} />
          </div>
        )}

        {activeTab === "PREVIEW" && (
          <div className="space-y-6 text-slate-300">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-400" />
                Previsualización de Documentos e Informes Impresos
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generación dinámica de documentos de salida para la especialidad seleccionada ({specialtyObj.name}).
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Receta Médica PDF
                </div>
                <p className="text-xs text-slate-400">
                  Documento legal impreso con encabezado de clínica, datos del paciente {patient.nombre}, prescripción de medicamentos y sello del médico.
                </p>
                <Button
                  size="sm"
                  onClick={() => alert("Simulación de generación de PDF: En producción abrirá la receta en PDF con los items del Sandbox.")}
                  className="bg-amber-600 hover:bg-amber-700 text-slate-950 font-semibold"
                >
                  📄 Probar Receta PDF
                </Button>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Informe Médico de Especialidad
                </div>
                <p className="text-xs text-slate-400">
                  Informe resumen conteniendo la anamnesis, examen físico, plan diagnóstico y datos específicos de {specialtyObj.name}.
                </p>
                <Button
                  size="sm"
                  onClick={() => alert("Simulación de generación de Informe: En producción renderizará el informe médico en PDF de " + specialtyObj.name)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  📋 Probar Informe Medico PDF
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
