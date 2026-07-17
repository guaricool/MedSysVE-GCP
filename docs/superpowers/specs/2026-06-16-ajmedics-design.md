# AJMedics — Diseño del Sistema
**Fecha:** 2026-06-16  
**Estado:** Aprobado por el usuario  
**Alcance:** Sistema completo de historias médicas y control de pacientes (Venezuela)

---

## 1. Visión General

AJMedics es una plataforma SaaS multi-tenant para gestión de historias médicas y control de pacientes en Venezuela. El objetivo principal es hacer la consulta médica **extremadamente eficiente**: reducir el tiempo que el doctor invierte en papeleo, generación de documentos e interpretación de resultados, permitiéndole enfocarse en el paciente.

### Principios de diseño
- **Velocidad primero:** cada acción del doctor debe completarse en el menor número de clics posible
- **IA como asistente:** Claude API genera borradores, interpreta resultados y sugiere dosis — el doctor siempre tiene la última palabra
- **Red de valor:** los doctores registrados se benefician mutuamente a través del sistema de referidos inteligente
- **Portal del paciente:** el paciente accede a sus documentos 24/7 sin llamar al consultorio

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15 (App Router) + Tailwind CSS + shadcn/ui |
| Backend | Next.js API Routes + tRPC (type-safe end-to-end) |
| Base de datos | PostgreSQL 16 + Prisma ORM |
| Autenticación | Auth.js v5 (multi-tenant, multi-rol) |
| IA | Claude API (Anthropic) — clave propia del cliente |
| Notificaciones | Twilio WhatsApp Business API (principal) + Resend email (respaldo) |
| Archivos | Cloudflare R2 (imágenes, PDFs, estudios de imagen) |
| Cache | Redis 7 (autocomplete medicamentos, sesiones) |
| Tasa de cambio | API pública BCV — actualización diaria automática |
| Deployment | Coolify — servidor propio o VPS (Hetzner/DigitalOcean) |

---

## 3. Dirección Visual

- **Tema:** Dark Profesional
- **Paleta:** Fondo `#0f172a`, superficies `#1e293b`, acentos azul `#3b82f6`, texto `#f1f5f9`
- **Tipografía:** Inter (legibilidad clínica, soporte para datos numéricos)
- **Componentes:** shadcn/ui con dark mode nativo, WCAG AA (4.5:1 contraste mínimo)
- **Targets táctiles:** mínimo 44×44px (uso con guantes o pantallas táctiles)
- **Navegación doctor:** sidebar colapsable con íconos + texto
- **Workspace clínico:** una página vertical con cabecera sticky del paciente — sin pestañas, sin cambio de contexto

---

## 4. Arquitectura Multi-tenant

### Modelo: Doctor + Espacios de Trabajo + Clínicas

Cada doctor es la raíz del tenant. Puede tener uno o más **Workspaces** (ej: "Mi Consultorio Privado", "Clínica Metropolitana"). Cada workspace tiene:
- Su propio staff (secretaria, asistente, enfermera)
- Sus propios pacientes registrados con ID único por workspace
- Su propia información fiscal y membrete (para documentos e impresión)
- Su propia configuración de agenda y tarifas
- Opcionalmente, pertenece a una **Clínica** registrada en el sistema

Las **Clínicas** son entidades independientes que pueden registrarse en AJMedics. Los doctores se afilian a ellas. Una clínica tiene su propio dashboard administrativo y panel público.

Un paciente que visita a dos doctores distintos tiene un registro independiente en cada workspace, vinculados por su cédula de identidad.

### Membrete en Documentos (Recetas, Informes, Reposos, etc.)

```
workspace.clinicId existe?
  → SÍ: Header = Logo + Nombre + RIF + Dirección de la CLÍNICA
         Subheader = Nombre del DOCTOR + especialidad + cédula
         Footer = Contacto y dirección de la CLÍNICA
  → NO: Header = Nombre + especialidad + cédula del DOCTOR
         Footer = Contacto y dirección del CONSULTORIO (workspace)
```

### Aislamiento de datos
- Row-Level Security (RLS) en PostgreSQL
- Cada query lleva implícito el `workspace_id` del usuario autenticado
- Prisma middleware aplica el filtro automáticamente

---

## 5. Modelo de Datos Principal

### Doctor
```
Doctor {
  id, nombre, apellido, cedula, email, telefono, foto_url
  especialidad_principal   // del listado oficial MSDS Venezuela
  sub_especialidades[]     // libre, ej: ["Electrofisiología"]
  rif, datos_fiscales      // para documentos oficiales
  workspaces[]
}
```

### Clinic (entidad nueva)
```
Clinic {
  id, nombre, rif, razon_social
  direccion, telefono, email, website
  logo_url, banner_url
  descripcion                 // para panel público
  servicios[]                 // lista de servicios ofrecidos
  redes_sociales: JSON        // instagram, twitter, etc.
  activa: boolean
  admins[]                    // usuarios con rol CLINIC_ADMIN
  doctor_affiliations[]       // doctores afiliados
  posts[]                     // noticias, eventos, anuncios
  createdAt, updatedAt
}
```

### DoctorClinicAffiliation (relación nueva)
```
DoctorClinicAffiliation {
  id
  doctor_id
  clinic_id
  rol: OWNER | STAFF | CONTRACTOR
  activo: boolean
  createdAt
}
```

### Workspace
```
Workspace {
  id, nombre, direccion, telefono, logo_url, membrete_url
  doctor_id
  clinic_id?                  // opcional — si trabaja bajo una clínica
  informacion_fiscal { rif, razon_social, direccion_fiscal }
  staff[]
  patient_registrations[]
  appointments[]
  bills[]
}
```

### Staff
```
Staff {
  id, cedula, nombre, apellido, email, pin_acceso
  rol: SECRETARY | ASSISTANT | NURSE
  workspace_id
  permisos_granulares: JSON   // overrides sobre los defaults del rol
  activo: boolean
}
```

### Patient (entidad global)
```
Patient {
  id
  tipo_identificacion: CEDULA_V | CEDULA_E | PASAPORTE
  numero_identificacion    // null si sin_cedula = true
  sin_cedula: boolean      // ☐ checkbox — activa campo representante
  nombre, apellido, fecha_nacimiento, sexo
  telefono, email, foto_url
  portal_password_hash
  representante?: {        // obligatorio cuando sin_cedula = true
    cedula_representante
    nombre_completo
    parentesco: PADRE | MADRE | TUTOR_LEGAL | OTRO
    telefono, email
  }
  registrations[]          // una por cada workspace que lo registre
}
```

### PatientRegistration
```
PatientRegistration {
  id_display: string       // "000054" — secuencial por workspace
  patient_id
  workspace_id
  fecha_registro
  notas_internas
  encounters[]
}
```

### Encounter (Consulta médica)
```
Encounter {
  id, patient_registration_id, workspace_id
  fecha, motivo_consulta, anamnesis
  signos_vitales: {
    ta_sistolica, ta_diastolica   // con alertas automáticas
    fc, fr, temperatura
    peso_kg, talla_cm, imc        // calculado automáticamente
    spo2, glasgow
  }
  examen_fisico: JSON              // flexible por especialidad
  diagnosticos[]: { codigo_cie10, descripcion, tipo: PRINCIPAL|SECUNDARIO }
  prescriptions[]
  lab_orders[], imaging_orders[]
  documents[]
  vitales_registrados_por: staff_id | doctor_id
  signed_at, signed_by
  addenda[]
  status: DRAFT | SIGNED | AMENDED
}
```

### Medication (BD de medicamentos)
```
Medication {
  id, nombre_generico, nombre_comercial[]
  concentraciones[]            // ["500mg", "250mg", "125mg"]
  forma_farmaceutica           // tableta, jarabe, inyectable, etc.
  via_administracion
  dosis_defaults: {            // por concentración
    "500mg": { dosis: "1 tableta", frecuencia: "cada 6 horas", duracion: "5 días" }
    "250mg": { dosis: "1 tableta", frecuencia: "cada 8 horas", duracion: "5 días" }
  }
  categoria                    // analgésico, antibiótico, antihipertensivo...
  requiere_receta_especial: boolean
  is_custom: boolean           // false = preloaded, true = agregado por workspace
  created_by_workspace_id?
  activo: boolean
}
// Seed inicial: 1000 medicamentos más usados en Venezuela
// Fuente: formulario farmacológico MPPS + curaduría manual previa al launch
```

### Prescription
```
Prescription {
  id, encounter_id
  items[]: {
    medication_id
    concentracion_seleccionada
    dosis, frecuencia, duracion
    indicaciones_especiales
    override_alerta?: string   // razón si hay interacción/alergia
  }
  pdf_url                      // generado automáticamente al guardar
  impresa: boolean
}
```

### LabResult / ImagingResult
```
LabResult {
  id, encounter_id?, patient_registration_id
  tipo_estudio, fecha_toma, fecha_resultado, laboratorio
  archivo_url                  // foto o PDF original
  ocr_raw: string              // texto extraído por Claude
  campos_interpretados: JSON   // { test, valor, unidad, rango_ref, estado }
  interpretacion_ai: string    // resumen generado por Claude
  notified_patient_at?
}
```

### Document (Informes, Reposos, Certificados)
```
Document {
  id, encounter_id, patient_registration_id
  tipo: INFORME | REPOSO | REFERIDO | CERTIFICADO | RECETA
  contenido_html               // editable por el doctor
  ai_draft: string             // borrador generado por Claude
  pdf_url
  firmado_at, firmado_por
  visible_en_portal: boolean
}
```

### Referral (Referido)
```
Referral {
  id, encounter_id
  referring_doctor_id, referring_workspace_id
  especialidad_destino
  sub_especialidad_destino?
  recipient_type: INTERNAL | EXTERNAL
  recipient_doctor_id?         // si está registrado en AJMedics
  recipient_external_name?     // si no está registrado
  motivo_clinico: string       // nota del doctor
  datos_compartidos: {
    diagnosticos, medicamentos, laboratorios, imagenes, historia
  }
  status: SENT | VIEWED | ACCEPTED | REJECTED
  pdf_url
  accepted_at?
  new_patient_registration_id? // creado automáticamente al aceptar
}
```

---

## 6. Módulos del Sistema

| # | Módulo | Descripción |
|---|--------|-------------|
| 01 | Auth & Onboarding | Registro doctor, workspace, invitación staff |
| 02 | Multi-tenancy & Permisos | Roles, RLS, acceso granular |
| 03 | Clínicas | Registro clínica, afiliación doctor, dashboard admin |
| 04 | Pacientes | Registro, búsqueda, menores, representantes |
| 05 | Consulta Médica | Historia, vitales, diagnósticos ICD-10 |
| 06 | Medicamentos & Recetas | Autocomplete 1000 meds, PDF con membrete dinámico |
| 07 | Laboratorio | Órdenes, subida, OCR con Claude, rangos |
| 08 | Imágenes | Órdenes, visor foto/PDF estudios (DICOM completo = Fase 6) |
| 09 | Documentos Médicos | Informe IA, reposo, certificado, referido |
| 10 | Red de Referidos | Búsqueda por especialidad + clínica, notificaciones |
| 11 | Agenda & Citas | Calendario, recordatorios WhatsApp |
| 12 | Facturación | USD/Bs, tasa BCV diaria, recibos |
| 13 | Portal del Paciente | Historial, docs imprimibles, notificaciones |
| 14 | Panel Público Clínica | Noticias, eventos, doctores, servicios, contacto |
| 15 | IA & Servicios | Claude OCR, generación informes, sugerencias |

---

## 7. Roles y Permisos

| Acción | Doctor | Secretaria | Asistente | Enfermera | Paciente |
|--------|:------:|:----------:|:---------:|:---------:|:--------:|
| Registrar paciente | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver historial completo | ✅ | 👁 solo | ✅ | ✅ | propio |
| Crear consulta | ✅ | ❌ | ❌ | ❌ | ❌ |
| Registrar signos vitales | ✅ | ❌ | ❌ | ✅ | ❌ |
| Escribir examen físico | ✅ | ❌ | ❌ | ❌ | ❌ |
| Emitir diagnósticos | ✅ | ❌ | ❌ | ❌ | ❌ |
| Crear recetas | ✅ | ❌ | ❌ | ❌ | ❌ |
| Emitir órdenes | ✅ | ❌ | ❌ | ❌ | ❌ |
| Subir resultados | ✅ | ✅ | ✅ | ✅ | ❌ |
| Generar informe IA | ✅ | ❌ | ❌ | ❌ | ❌ |
| Firmar/cerrar consulta | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gestionar citas | ✅ | ✅ | ✅ | ❌ | ver |
| Cobrar / emitir recibo | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver reportes financieros | ✅ | ✅ | ❌ | ❌ | ❌ |
| Gestionar referidos | ✅ | notif | notif | ❌ | ver |
| Descargar/imprimir docs | ✅ | ✅ | ✅ | ✅ | propio |

---

## 8. Flujos Clave

### Flujo de Consulta Completa
1. **Enfermera** registra signos vitales → sistema alerta si fuera de rango → doctor notificado
2. **Doctor** abre consulta: ve vitales + historial en cabecera sticky (una página vertical)
3. Registra motivo, anamnesis, examen físico (templates por especialidad)
4. Selecciona diagnósticos con búsqueda ICD-10
5. Agrega medicamentos → autocomplete en tiempo real → receta PDF generada automáticamente
6. Emite órdenes de laboratorio o imagen si necesario
7. Clic en "Generar Informe" → Claude produce borrador → doctor edita → firma → PDF
8. Si aplica: genera referido con búsqueda por especialidad/sub-especialidad
9. **Secretaria** cobra la consulta (USD o Bs con tasa BCV del día) → recibo
10. **Paciente** recibe WhatsApp: "Tus documentos están listos" → accede al portal

### Flujo de Referido Inteligente
1. Doctor selecciona especialidad destino → busca por sub-especialidad (opcional)
2. Sistema muestra doctores internos (AJMedics) que coincidan
3. Si elige interno: doctor receptor + su secretaria reciben notificación WhatsApp + portal
4. Receptor abre referido: ve datos completos + nota clínica del doctor
5. Clic "Aceptar" → paciente creado automáticamente en su workspace con ID único
6. Doctor referente y paciente notificados automáticamente

### Flujo OCR de Laboratorio
1. Doctor / staff sube foto o PDF del resultado
2. Claude Vision extrae valores: `{test, valor, unidad, rango_referencia, estado}`
3. Sistema mapea a campos estructurados con highlighting (verde/amarillo/rojo)
4. Doctor revisa y confirma (puede corregir cualquier campo)
5. Guardado → notificación automática al paciente

### Flujo de Menor de Edad
1. Al registrar paciente: checkbox "Sin cédula"
2. Campo cédula desaparece → sección representante se vuelve obligatoria
3. Portal del menor: accede el representante con su cédula, ve pestaña del hijo

---

## 9. Integración Claude API

| Caso de uso | Tipo | Descripción |
|-------------|------|-------------|
| OCR resultados laboratorio | Vision | Extrae valores, unidades y rangos de fotos/PDFs |
| OCR informes radiológicos | Vision | Extrae hallazgos de informes de imagen |
| Generación informe médico | Text | Borrador en español médico venezolano formal |
| Sugerencias de dosis | Text | Frecuencia y duración basada en medicamento + concentración |
| Alertas clínicas | Rules + AI | Interacciones medicamentosas, valores críticos |

**Seguridad de alertas:**
- Alergia + medicamento = **BLOQUEO** — doctor debe documentar override
- Interacción grave = advertencia no descartable — requiere acuse
- Valor crítico en laboratorio = alerta no descartable en pantalla

---

## 10. Notificaciones

**Canal principal:** WhatsApp Business API (Twilio)  
**Canal de respaldo:** Email transaccional (Resend)

| Evento | Destinatario | Canal |
|--------|-------------|-------|
| Resultados listos | Paciente | WhatsApp + Email |
| Documento generado (informe, receta, reposo) | Paciente | WhatsApp |
| Cita confirmada / recordatorio 24h antes | Paciente | WhatsApp |
| Referido recibido | Doctor receptor + Secretaria | WhatsApp + Portal |
| Referido aceptado | Doctor referente + Paciente | WhatsApp |
| Paciente listo (vitales registrados) | Doctor | Portal (badge) |

---

## 11. Facturación

- Monedas: **USD** y **Bs (Bolívares)**
- Tasa BCV: actualización automática diaria vía API pública BCV
- La secretaria registra el cobro en la moneda que corresponda al workspace
- El sistema muestra la equivalencia automáticamente
- Recibo generado como PDF → disponible en portal del paciente

---

## 12. Deployment (Coolify)

```
Coolify Server
├── Container: AJMedics App (Next.js 15)     → HTTPS público
├── Container: PostgreSQL 16                  → backups diarios automáticos
├── Container: Redis 7                        → cache + sesiones
└── Cloudflare R2 (externo)                  → archivos, PDFs, imágenes
```

**Variables de entorno requeridas:**
- `DATABASE_URL`, `REDIS_URL`
- `ANTHROPIC_API_KEY` (clave propia del cliente)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`
- `RESEND_API_KEY`
- `CLOUDFLARE_R2_*` (bucket, key, secret, endpoint)
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `BCV_API_URL`

---

## 13. Plan de Fases

| Fase | Contenido | Prioridad |
|------|-----------|-----------|
| **1 — Fundación** | Auth, registro doctor, workspaces, roles, clínicas (schema + registro básico + afiliación), registro pacientes, dashboard por rol, Coolify base | 🔴 Primera |
| **2 — Núcleo Clínico** | Consulta médica, vitales, diagnósticos ICD-10, medicamentos 1000 + autocomplete, receta PDF con membrete dinámico | 🔴 Segunda |
| **3 — Órdenes & Docs** | Lab, imagen, OCR Claude, informe IA con membrete, reposo, referidos con info de clínica | 🟠 Tercera |
| **4 — Operaciones** | Agenda, facturación USD/Bs + BCV, notificaciones WhatsApp | 🟠 Cuarta |
| **5 — Portal Paciente** | Portal completo, docs imprimibles, notificaciones push | 🟡 Quinta |
| **6 — Red & Clínicas** | Panel público clínica (noticias, eventos, servicios), red referidos completa, PWA móvil | 🟢 Sexta |

---

## 14. Consideraciones Especiales para Venezuela

- **Identificación:** cédula venezolana (V-/E-) como identificador primario; pasaporte para extranjeros; checkbox "Sin cédula" para menores con representante obligatorio
- **Moneda:** dual USD/Bs con tasa BCV automática — los médicos venezolanos cobran principalmente en USD
- **WhatsApp:** canal de comunicación principal — penetración cercana al 100% en Venezuela
- **Formulario farmacológico:** seed de 1000 medicamentos del formulario venezolano con nombres comerciales locales
- **Documentos:** formato de receta médica venezolana con espacio para sello físico del médico
- **Especialidades:** listado oficial del Ministerio del Poder Popular para la Salud (MPPS)
- **ICD-10:** versión en español con términos usados en Venezuela

---

*Spec generado mediante brainstorming colaborativo. Próximo paso: plan de implementación de Fase 1.*
