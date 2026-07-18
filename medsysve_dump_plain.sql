--
-- PostgreSQL database dump
--

\restrict LHXD4rGW4ncIFdEtnXlt9mtLPr0xWsHIEUVA2c1GNtsGUnczfiSzgQmqEFAnjCe

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AlergiaGravedad; Type: TYPE; Schema: public; Owner: medsysve
--

CREATE TYPE public."AlergiaGravedad" AS ENUM (
    'LEVE',
    'MODERADA',
    'SEVERA'
);



--
-- Name: AppointmentStatus; Type: TYPE; Schema: public; Owner: medsysve
--

CREATE TYPE public."AppointmentStatus" AS ENUM (
    'REQUESTED',
    'SCHEDULED',
    'CONFIRMED',
    'CANCELLED',
    'NO_SHOW',
    'COMPLETED'
);



--
-- Name: AppointmentType; Type: TYPE; Schema: public; Owner: medsysve
--

CREATE TYPE public."AppointmentType" AS ENUM (
    'CONSULTA',
    'SEGUIMIENTO',
    'EMERGENCIA',
    'PROCEDIMIENTO',
    'VIDEOCONSULTA'
);



--
-- Name: ClinicAdminRole; Type: TYPE; Schema: public; Owner: medsysve
--

CREATE TYPE public."ClinicAdminRole" AS ENUM (
    'OWNER',
    'MANAGER'
);



--
-- Name: ClinicRole; Type: TYPE; Schema: public; Owner: medsysve
--

CREATE TYPE public."ClinicRole" AS ENUM (
    'OWNER',
    'STAFF',
    'CONTRACTOR'
);



--
-- Name: DiagnosisTipo; Type: TYPE; Schema: public; Owner: medsysve
--

CREATE TYPE public."DiagnosisTipo" AS ENUM (
    'PRINCIPAL',
    'SECUNDARIO'
);



--
-- Name: DocumentTipo; Type: TYPE; Schema: public; Owner: medsysve
--

CREATE TYPE public."DocumentTipo" AS ENUM (
    'INFORME',
    'REPOSO',
    'REFERIDO',
    'CERTIFICADO',
    'RECETA'
);



--
-- Name: EncounterStatus; Type: TYPE; Schema: public; Owner: medsysve
--

CREATE TYPE public."EncounterStatus" AS ENUM (
    'DRAFT',
    'SIGNED',
    'AMENDED'
);



--
-- Name: IdentificationType; Type: TYPE; Schema: public; Owner: medsysve
--

CREATE TYPE public."IdentificationType" AS ENUM (
    'CEDULA_V',
    'CEDULA_E',
    'PASAPORTE'
);



--
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: medsysve
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'PENDING',
    'PAID',
    'CANCELLED'
);



--
-- Name: MensajeAutor; Type: TYPE; Schema: public; Owner: medsysve
--

CREATE TYPE public."MensajeAutor" AS ENUM (
    'DOCTOR',
    'PATIENT'
);



--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: medsysve
--

CREATE TYPE public."NotificationType" AS ENUM (
    'APPOINTMENT_REQUEST',
    'PORTAL_MESSAGE',
    'REFERRAL_ACCEPTED',
    'REFERRAL_REJECTED',
    'IMAGING_RESULT',
    'SYSTEM',
    'REFERRAL_RECEIVED'
);



--
-- Name: OtpPurpose; Type: TYPE; Schema: public; Owner: medsysve
--

CREATE TYPE public."OtpPurpose" AS ENUM (
    'EMAIL_VERIFY',
    'PASSWORD_RESET'
);



--
-- Name: ParentRelationship; Type: TYPE; Schema: public; Owner: medsysve
--

CREATE TYPE public."ParentRelationship" AS ENUM (
    'PADRE',
    'MADRE',
    'TUTOR_LEGAL',
    'OTRO'
);



--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: medsysve
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'EFECTIVO_USD',
    'EFECTIVO_BS',
    'TRANSFERENCIA_BS',
    'ZELLE',
    'BINANCE_USDT',
    'PAGOMOVIL'
);



--
-- Name: SexoType; Type: TYPE; Schema: public; Owner: medsysve
--

CREATE TYPE public."SexoType" AS ENUM (
    'MASCULINO',
    'FEMENINO',
    'OTRO'
);



--
-- Name: StaffRole; Type: TYPE; Schema: public; Owner: medsysve
--

CREATE TYPE public."StaffRole" AS ENUM (
    'SECRETARY',
    'ASSISTANT',
    'NURSE'
);



--
-- Name: TaskPriority; Type: TYPE; Schema: public; Owner: medsysve
--

CREATE TYPE public."TaskPriority" AS ENUM (
    'ALTA',
    'MEDIA',
    'BAJA'
);



SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Alergia; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."Alergia" (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    "patientRegistrationId" text NOT NULL,
    sustancia text NOT NULL,
    reaccion text,
    gravedad public."AlergiaGravedad" DEFAULT 'LEVE'::public."AlergiaGravedad" NOT NULL,
    activa boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: Announcement; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."Announcement" (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    titulo text NOT NULL,
    mensaje text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    "creadoAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: Appointment; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."Appointment" (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    "patientRegistrationId" text,
    titulo text,
    tipo public."AppointmentType" DEFAULT 'CONSULTA'::public."AppointmentType" NOT NULL,
    status public."AppointmentStatus" DEFAULT 'SCHEDULED'::public."AppointmentStatus" NOT NULL,
    "fechaHora" timestamp(3) without time zone NOT NULL,
    "duracionMinutos" integer DEFAULT 30 NOT NULL,
    notas text,
    "serieId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    version integer DEFAULT 0 NOT NULL
);



--
-- Name: AuditEvent; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."AuditEvent" (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    "actorId" text,
    "actorRole" text,
    action text NOT NULL,
    "resourceType" text NOT NULL,
    "resourceId" text,
    "patientId" text,
    outcome text DEFAULT 'ALLOWED'::text NOT NULL,
    "denialReason" text,
    ip text,
    "userAgent" text,
    channel text DEFAULT 'UI'::text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "metadataCifrado" text,
    "archivedAt" timestamp(3) without time zone
);



--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    accion text NOT NULL,
    entidad text NOT NULL,
    "entidadId" text,
    "actorId" text,
    "actorNombre" text,
    detalle jsonb,
    ip text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: AvailabilityException; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."AvailabilityException" (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    fecha timestamp(3) without time zone NOT NULL,
    motivo text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: BreachIncident; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."BreachIncident" (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    severity text NOT NULL,
    status text DEFAULT 'INVESTIGATING'::text NOT NULL,
    "detectedAt" timestamp(3) without time zone NOT NULL,
    "containedAt" timestamp(3) without time zone,
    "notifiedAt" timestamp(3) without time zone,
    "closedAt" timestamp(3) without time zone,
    "affectedUsers" integer DEFAULT 0 NOT NULL,
    "affectedWorkspaces" integer DEFAULT 0 NOT NULL,
    "dataCategories" text[],
    description text NOT NULL,
    "rootCause" text,
    remediation text,
    "reportedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: Clinic; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."Clinic" (
    id text NOT NULL,
    nombre text NOT NULL,
    slug text,
    rif text,
    "razonSocial" text,
    direccion text,
    telefono text,
    email text,
    website text,
    "logoUrl" text,
    "bannerUrl" text,
    descripcion text,
    servicios text[] DEFAULT ARRAY[]::text[],
    "redesSociales" jsonb,
    activa boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "nombreCifrado" text,
    "razonSocialCifrada" text,
    "direccionCifrada" text,
    "telefonoCifrado" text,
    "emailCifrado" text,
    estado text,
    ciudad text,
    plan text DEFAULT 'free'::text NOT NULL,
    "stripeCustomerId" text,
    "stripeSubscriptionId" text,
    "stripePriceId" text,
    "stripeCurrentPeriodEnd" timestamp(3) without time zone
);



--
-- Name: ClinicAdmin; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."ClinicAdmin" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    telefono text,
    role public."ClinicAdminRole" DEFAULT 'OWNER'::public."ClinicAdminRole" NOT NULL,
    "clinicId" text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "failedAttempts" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: ClinicInvitationCode; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."ClinicInvitationCode" (
    id text NOT NULL,
    "clinicId" text NOT NULL,
    code text NOT NULL,
    used boolean DEFAULT false NOT NULL,
    "usedById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isExtraSeat" boolean DEFAULT false NOT NULL
);



--
-- Name: ClinicPost; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."ClinicPost" (
    id text NOT NULL,
    "clinicId" text NOT NULL,
    titulo text NOT NULL,
    contenido text NOT NULL,
    "imagenUrl" text,
    "publicadoAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: ConsentAcceptance; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."ConsentAcceptance" (
    id text NOT NULL,
    "doctorId" text NOT NULL,
    "legalVersionId" text NOT NULL,
    slug text NOT NULL,
    version text NOT NULL,
    ip text,
    "userAgent" text,
    explicit boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: ConsentTemplate; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."ConsentTemplate" (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    titulo text NOT NULL,
    contenido text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: DataDeletionRequest; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."DataDeletionRequest" (
    id text NOT NULL,
    "doctorId" text NOT NULL,
    "patientCedulaHMAC" text,
    status text DEFAULT 'REQUESTED'::text NOT NULL,
    reason text,
    "approvedAt" timestamp(3) without time zone,
    "appliedAt" timestamp(3) without time zone,
    "tombstoneId" text,
    ip text,
    "requestedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: DataExportRequest; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."DataExportRequest" (
    id text NOT NULL,
    "doctorId" text NOT NULL,
    "patientCedulaHMAC" text,
    scope text NOT NULL,
    status text DEFAULT 'REQUESTED'::text NOT NULL,
    "downloadToken" text,
    "downloadUrl" text,
    "expiresAt" timestamp(3) without time zone,
    "requestedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "readyAt" timestamp(3) without time zone,
    "downloadedAt" timestamp(3) without time zone,
    "closedAt" timestamp(3) without time zone,
    ip text,
    notes text
);



--
-- Name: Diagnosis; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."Diagnosis" (
    id text NOT NULL,
    "encounterId" text NOT NULL,
    "codigoCie10" text NOT NULL,
    descripcion text NOT NULL,
    tipo public."DiagnosisTipo" DEFAULT 'PRINCIPAL'::public."DiagnosisTipo" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: Doctor; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."Doctor" (
    id text NOT NULL,
    cedula text NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    telefono text,
    "fotoUrl" text,
    "especialidadPrincipal" text NOT NULL,
    "subEspecialidades" text[] DEFAULT ARRAY[]::text[],
    bio text,
    idiomas text[] DEFAULT ARRAY[]::text[],
    rif text,
    "datosFiscales" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    plan text DEFAULT 'free'::text NOT NULL,
    "isAdmin" boolean DEFAULT false NOT NULL,
    "cedulaCifrada" text,
    "rifCifrado" text,
    "totpSecret" text,
    "totpEnabled" boolean DEFAULT false NOT NULL,
    "totpEnabledAt" timestamp(3) without time zone,
    "totpLastUsed" timestamp(3) without time zone,
    "currentLegalVersion" text,
    "nombreCifrado" text,
    "apellidoCifrado" text,
    "telefonoCifrado" text,
    "stripeCustomerId" text,
    "stripeSubscriptionId" text,
    "stripePriceId" text,
    "stripeCurrentPeriodEnd" timestamp(3) without time zone,
    "selloUrl" text
);



--
-- Name: DoctorAvailability; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."DoctorAvailability" (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    "diaSemana" integer NOT NULL,
    "horaInicio" text NOT NULL,
    "horaFin" text NOT NULL,
    "duracionMinutos" integer DEFAULT 30 NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: DoctorClinicAffiliation; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."DoctorClinicAffiliation" (
    id text NOT NULL,
    "doctorId" text NOT NULL,
    "clinicId" text NOT NULL,
    rol public."ClinicRole" DEFAULT 'STAFF'::public."ClinicRole" NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: DoctorFeatureOverride; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."DoctorFeatureOverride" (
    id text NOT NULL,
    "doctorId" text NOT NULL,
    "flagKey" text NOT NULL,
    enabled boolean NOT NULL,
    reason text,
    "expiresAt" timestamp(3) without time zone,
    "setByUserId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: DoctorReportPreferences; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."DoctorReportPreferences" (
    id text NOT NULL,
    "doctorId" text NOT NULL,
    secciones jsonb NOT NULL,
    "instruccionesDefault" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: Document; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."Document" (
    id text NOT NULL,
    "encounterId" text,
    "patientRegistrationId" text NOT NULL,
    tipo public."DocumentTipo" NOT NULL,
    "contenidoHtml" text NOT NULL,
    "aiDraft" text,
    "pdfUrl" text,
    "firmadoAt" timestamp(3) without time zone,
    "firmadoPor" text,
    "visibleEnPortal" boolean DEFAULT false NOT NULL,
    "referidoANombre" text,
    "referidoAEspecialidad" text,
    "referidoATelefono" text,
    "referidoADoctorId" text,
    "referidoStatus" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "contenidoHtmlCifrado" text,
    "aiDraftCifrado" text,
    "reportOverride" jsonb
);



--
-- Name: DocumentTemplate; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."DocumentTemplate" (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    tipo public."DocumentTipo" NOT NULL,
    nombre text NOT NULL,
    "contenidoHtml" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    especialidad text
);



--
-- Name: EmailOtp; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."EmailOtp" (
    id text NOT NULL,
    email text NOT NULL,
    "codeHash" text NOT NULL,
    purpose public."OtpPurpose" NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    "consumedAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    ip text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: Encounter; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."Encounter" (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    "patientRegistrationId" text NOT NULL,
    "doctorId" text NOT NULL,
    "appointmentId" text,
    "historiaClinica" text,
    plan text,
    vitales jsonb,
    "examenFisico" jsonb,
    status public."EncounterStatus" DEFAULT 'DRAFT'::public."EncounterStatus" NOT NULL,
    "signedAt" timestamp(3) without time zone,
    "signedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "historiaClinicaCifrada" text,
    "planCifrado" text,
    "signatureHash" text,
    "motivoCifrado" text,
    "motivoHmac" text,
    version integer DEFAULT 0 NOT NULL,
    "reportOverride" jsonb,
    "datosEspecialidad" jsonb
);



--
-- Name: EncounterScale; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."EncounterScale" (
    id text NOT NULL,
    "encounterId" text NOT NULL,
    tipo text NOT NULL,
    valores jsonb NOT NULL,
    puntuacion double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: EncounterTemplate; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."EncounterTemplate" (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    motivo text,
    "historiaClinica" text,
    plan text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    especialidad text,
    "datosEspecialidad" jsonb,
    "examenFisico" jsonb
);



--
-- Name: ExpressOrder; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."ExpressOrder" (
    id text NOT NULL,
    tipo text NOT NULL,
    "pacienteNombre" text NOT NULL,
    "pacienteApellido" text NOT NULL,
    "pacienteCedula" text,
    "pacienteEdad" integer NOT NULL,
    "pacienteSexo" text,
    items jsonb NOT NULL,
    diagnosticos text,
    indicaciones text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "workspaceId" text NOT NULL
);



--
-- Name: ImagingOrder; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."ImagingOrder" (
    id text NOT NULL,
    "encounterId" text NOT NULL,
    "tipoImagen" text NOT NULL,
    region text NOT NULL,
    "indicacionesClinicas" text,
    urgente boolean DEFAULT false NOT NULL,
    "pdfUrl" text,
    "resultadoUrl" text,
    "resultadoNotas" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: ImagingOrderItem; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."ImagingOrderItem" (
    id text NOT NULL,
    "imagingOrderId" text NOT NULL,
    "tipoImagen" text NOT NULL,
    region text NOT NULL,
    notas text,
    orden integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: InsuranceProvider; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."InsuranceProvider" (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    nombre text NOT NULL,
    codigo text,
    telefono text,
    email text,
    activo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: Invoice; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."Invoice" (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    "patientRegistrationId" text NOT NULL,
    "encounterId" text,
    numero text NOT NULL,
    descripcion text,
    "montoUsd" numeric(10,2) NOT NULL,
    "tasaBcv" numeric(10,4) NOT NULL,
    "montoBs" numeric(14,2) NOT NULL,
    "metodoPago" public."PaymentMethod" DEFAULT 'EFECTIVO_USD'::public."PaymentMethod" NOT NULL,
    status public."InvoiceStatus" DEFAULT 'PENDING'::public."InvoiceStatus" NOT NULL,
    "pdfUrl" text,
    "fechaPago" timestamp(3) without time zone,
    "insuranceProviderId" text,
    "montoSeguro" numeric(10,2),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "descripcionCifrada" text
);



--
-- Name: InvoiceItem; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."InvoiceItem" (
    id text NOT NULL,
    "invoiceId" text NOT NULL,
    descripcion text NOT NULL,
    cantidad integer DEFAULT 1 NOT NULL,
    "precioUnitarioUsd" numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: LabOrder; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."LabOrder" (
    id text NOT NULL,
    "encounterId" text NOT NULL,
    estudios text[],
    "indicacionesClinicas" text,
    urgente boolean DEFAULT false NOT NULL,
    "pdfUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: LabResult; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."LabResult" (
    id text NOT NULL,
    "patientRegistrationId" text NOT NULL,
    "encounterId" text,
    titulo text NOT NULL,
    fecha timestamp(3) without time zone NOT NULL,
    resultado text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    valores jsonb,
    notas text,
    "notasCifradas" text
);



--
-- Name: LegalVersion; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."LegalVersion" (
    id text NOT NULL,
    slug text NOT NULL,
    version text NOT NULL,
    title text NOT NULL,
    "contentHash" text NOT NULL,
    "effectiveAt" timestamp(3) without time zone NOT NULL,
    "publishedBy" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: Medication; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."Medication" (
    id text NOT NULL,
    "nombreGenerico" text NOT NULL,
    "nombresComerciales" text[],
    concentraciones text[],
    "formaFarmaceutica" text NOT NULL,
    "viaAdministracion" text NOT NULL,
    "dosisDefaults" jsonb,
    categoria text NOT NULL,
    "isCustom" boolean DEFAULT false NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    "workspaceId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: Mensaje; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."Mensaje" (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    "patientRegistrationId" text NOT NULL,
    autor public."MensajeAutor" NOT NULL,
    texto text NOT NULL,
    leido boolean DEFAULT false NOT NULL,
    "creadoAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "textoCifrado" text
);



--
-- Name: Notification; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    tipo public."NotificationType" NOT NULL,
    titulo text NOT NULL,
    mensaje text NOT NULL,
    leida boolean DEFAULT false NOT NULL,
    "referenciaId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: Pago; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."Pago" (
    id text NOT NULL,
    "invoiceId" text NOT NULL,
    monto numeric(10,2) NOT NULL,
    "metodoPago" public."PaymentMethod" NOT NULL,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notas text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: Patient; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."Patient" (
    id text NOT NULL,
    "tipoIdentificacion" public."IdentificationType",
    "numeroIdentificacion" text,
    "sinCedula" boolean DEFAULT false NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    "fechaNacimiento" timestamp(3) without time zone NOT NULL,
    sexo public."SexoType" NOT NULL,
    "grupoSanguineo" text,
    telefono text,
    email text,
    "portalPasswordHash" text,
    "repCedula" text,
    "repNombreCompleto" text,
    "repParentesco" public."ParentRelationship",
    "repTelefono" text,
    "repEmail" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "hmacCedula" text,
    "nombreCifrado" text,
    "hmacNombre" text,
    "apellidoCifrado" text,
    "hmacApellido" text,
    "telefonoCifrado" text,
    "hmacTelefono" text,
    "emailCifrado" text,
    "hmacEmail" text,
    "workspaceId" text NOT NULL,
    direccion text,
    "direccionCifrada" text
);



--
-- Name: PatientConsent; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."PatientConsent" (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    "patientRegistrationId" text NOT NULL,
    "templateId" text NOT NULL,
    "encounterId" text,
    firmado boolean DEFAULT false NOT NULL,
    "firmadoAt" timestamp(3) without time zone,
    "firmaData" text,
    "pdfUrl" text,
    notas text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: PatientInsurance; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."PatientInsurance" (
    id text NOT NULL,
    "patientRegistrationId" text NOT NULL,
    "providerId" text NOT NULL,
    "numeroPóliza" text NOT NULL,
    titular text,
    "coberturaPct" integer DEFAULT 100 NOT NULL,
    "fechaVigencia" timestamp(3) without time zone,
    activa boolean DEFAULT true NOT NULL,
    notas text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: PatientRegistration; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."PatientRegistration" (
    id text NOT NULL,
    "idDisplay" text NOT NULL,
    "patientId" text NOT NULL,
    "workspaceId" text NOT NULL,
    "notasInternas" text,
    antecedentes jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: PatientTag; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."PatientTag" (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    "patientRegistrationId" text NOT NULL,
    etiqueta text NOT NULL,
    color text DEFAULT 'blue'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: Prescription; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."Prescription" (
    id text NOT NULL,
    "encounterId" text NOT NULL,
    "pdfUrl" text,
    impresa boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: PrescriptionItem; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."PrescriptionItem" (
    id text NOT NULL,
    "prescriptionId" text NOT NULL,
    "medicationId" text NOT NULL,
    concentracion text NOT NULL,
    dosis text NOT NULL,
    frecuencia text NOT NULL,
    duracion text NOT NULL,
    "indicacionesEspeciales" text,
    "overrideAlerta" boolean DEFAULT false NOT NULL
);



--
-- Name: Staff; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."Staff" (
    id text NOT NULL,
    cedula text NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    email text NOT NULL,
    "pinAccesoHash" text,
    rol public."StaffRole" NOT NULL,
    "workspaceId" text NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);



--
-- Name: StaffNote; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."StaffNote" (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    "autorId" text NOT NULL,
    "autorNombre" text NOT NULL,
    texto text NOT NULL,
    "creadoAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: Task; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."Task" (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    titulo text NOT NULL,
    descripcion text,
    prioridad public."TaskPriority" DEFAULT 'MEDIA'::public."TaskPriority" NOT NULL,
    "asignadoAId" text,
    "patientRegistrationId" text,
    "fechaVencimiento" timestamp(3) without time zone,
    completada boolean DEFAULT false NOT NULL,
    "completadaAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: TwoFactorBackupCode; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."TwoFactorBackupCode" (
    id text NOT NULL,
    "doctorId" text NOT NULL,
    "codeHash" text NOT NULL,
    "usedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: Vaccine; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."Vaccine" (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    "patientRegistrationId" text NOT NULL,
    vacuna text NOT NULL,
    "fechaAplicacion" timestamp(3) without time zone NOT NULL,
    dosis text,
    lote text,
    "proximaDosis" timestamp(3) without time zone,
    notas text,
    "aplicadoPor" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: WaitingEntry; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."WaitingEntry" (
    id text NOT NULL,
    "workspaceId" text NOT NULL,
    "patientRegistrationId" text NOT NULL,
    "appointmentId" text,
    turno integer NOT NULL,
    estado text DEFAULT 'ESPERANDO'::text NOT NULL,
    notas text,
    "llegadaAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "llamadoAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);



--
-- Name: Workspace; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public."Workspace" (
    id text NOT NULL,
    nombre text NOT NULL,
    direccion text,
    telefono text,
    "logoUrl" text,
    "membreteUrl" text,
    rif text,
    "razonSocial" text,
    "direccionFiscal" text,
    "tasaBcvActual" numeric(10,4),
    "tasaBcvAt" timestamp(3) without time zone,
    "recordatorioHoras" integer DEFAULT 24 NOT NULL,
    "recordatorioWa" boolean DEFAULT false NOT NULL,
    "recordatorioEmail" boolean DEFAULT true NOT NULL,
    "doctorId" text NOT NULL,
    "clinicId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "nombreCifrado" text,
    "direccionCifrada" text,
    "telefonoCifrado" text,
    "razonSocialCifrada" text,
    "direccionFiscalCifrada" text,
    estado text,
    ciudad text,
    "autoCreateHistoryOnEncounter" boolean DEFAULT false NOT NULL,
    "emailAppointmentReminders" boolean DEFAULT true NOT NULL,
    "allowedIps" text
);



--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: medsysve
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);



--
-- Data for Name: Alergia; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."Alergia" (id, "workspaceId", "patientRegistrationId", sustancia, reaccion, gravedad, activa, "createdAt") FROM stdin;
cmrmrle0l000101o5jp60zk9w	cmqlsyn9e000301qgk98rcsjh	cmrm7x1l6000101le9hkh0ivo	penicilina	urticaria	MODERADA	t	2026-07-16 00:22:16.629
\.


--
-- Data for Name: Announcement; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."Announcement" (id, "workspaceId", titulo, mensaje, activo, "creadoAt") FROM stdin;
\.


--
-- Data for Name: Appointment; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."Appointment" (id, "workspaceId", "patientRegistrationId", titulo, tipo, status, "fechaHora", "duracionMinutos", notas, "serieId", "createdAt", "updatedAt", version) FROM stdin;
demo_appt_maria_past	cmqmx6t43000101phgcog0v6o	demo_pr_maria_001	Control de HTA	CONSULTA	COMPLETED	2026-06-01 06:16:15.538	30	Control trimestral. PA estable.	\N	2026-06-01 06:16:15.538	2026-06-01 06:16:15.538	0
demo_appt_maria_today	cmqmx6t43000101phgcog0v6o	demo_pr_maria_001	Consulta por fiebre y cefalea	CONSULTA	CONFIRMED	2026-07-01 05:56:15.538	30	Paciente con cuadro febril agudo.	\N	2026-06-30 06:16:15.538	2026-07-01 05:56:15.538	0
demo_appt_lucia_tomorrow	cmqmx6t43000101phgcog0v6o	demo_pr_lucia_001	Control prenatal 24 sem	CONSULTA	SCHEDULED	2026-07-02 15:16:15.538	45	Control prenatal. Eco Doppler obstétrico.	\N	2026-06-24 06:16:15.538	2026-06-24 06:16:15.538	0
demo_appt_pedro_next	cmqmx6t43000101phgcog0v6o	demo_pr_pedro_001	Control mensual crónicos	SEGUIMIENTO	SCHEDULED	2026-07-08 16:16:15.538	30	Traer resultados de HbA1c.	\N	2026-06-17 06:16:15.538	2026-06-17 06:16:15.538	0
demo_appt_carmen_tele	cmqmx6t43000101phgcog0v6o	demo_pr_carmen_001	Teleconsulta seguimiento	VIDEOCONSULTA	SCHEDULED	2026-07-06 21:16:15.538	20	Revisar resultados de laboratorio reciente.	\N	2026-06-28 06:16:15.538	2026-06-28 06:16:15.538	0
demo_appt_diego_cancelled	cmqmx6t43000101phgcog0v6o	demo_pr_diego_001	Control pediátrico	CONSULTA	CANCELLED	2026-06-16 06:16:15.538	30	Cancelada por el representante.	\N	2026-06-11 06:16:15.538	2026-06-16 06:16:15.538	0
demo_a_d1	cmqmgxvs6000101oau4ntxdtv	demo_pr_d1	Control de HTA	CONSULTA	CONFIRMED	2026-07-01 11:58:12.607	30	Control trimestral programado.	\N	2026-06-24 12:13:12.607	2026-07-01 11:58:12.607	0
demo_a_d2	cmqmgxvs6000101oau4ntxdtv	demo_pr_d2	Próximo control crónicos	SEGUIMIENTO	SCHEDULED	2026-07-04 22:13:12.607	30	Traer resultados de HbA1c.	\N	2026-06-17 12:13:12.607	2026-06-17 12:13:12.607	0
demo_a_d3	cmqmgxvs6000101oau4ntxdtv	demo_pr_d3	Teleconsulta prenatal	VIDEOCONSULTA	SCHEDULED	2026-07-06 03:13:12.607	20	Control prenatal del 2do trimestre.	\N	2026-06-26 12:13:12.607	2026-06-26 12:13:12.607	0
cmrodh91z000201r0dgvkbqg8	cmqmx6t43000101phgcog0v6o	cmrodfwag000101r0up24yxhe	revision post operatoria	CONSULTA	SCHEDULED	2026-07-20 09:00:00	30	paciente operado	\N	2026-07-17 03:22:41.303	2026-07-17 03:22:41.303	0
\.


--
-- Data for Name: AuditEvent; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."AuditEvent" (id, "workspaceId", "actorId", "actorRole", action, "resourceType", "resourceId", "patientId", outcome, "denialReason", ip, "userAgent", channel, metadata, "createdAt", "metadataCifrado", "archivedAt") FROM stdin;
cmqv04n9u000101kqm04lcthb	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	PASSWORD_RESET_COMPLETED	Doctor	cmqmx6t3y000001phuzs1sirz	\N	ALLOWED	\N	\N	\N	API	\N	2026-06-26 14:03:39.09	\N	\N
cmqv0592m000601kq9lk0cktr	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	lv_terminos_1_0_0	\N	ALLOWED	\N	\N	\N	UI	{"slug": "terminos", "version": "1.0.0", "explicit": true}	2026-06-26 14:04:07.343	\N	\N
cmqv0592u000701kq4nph3gge	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	lv_privacidad_1_0_0	\N	ALLOWED	\N	\N	\N	UI	{"slug": "privacidad", "version": "1.0.0", "explicit": true}	2026-06-26 14:04:07.35	\N	\N
cmqv0592x000801kqkwa9dc1r	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	lv_cookies_1_0_0	\N	ALLOWED	\N	\N	\N	UI	{"slug": "cookies", "version": "1.0.0", "explicit": true}	2026-06-26 14:04:07.353	\N	\N
cmqv0592z000901kq6coevr2p	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	lv_lopdp_consentimiento_1_0_0	\N	ALLOWED	\N	\N	\N	UI	{"slug": "lopdp-consentimiento", "version": "1.0.0", "explicit": true}	2026-06-26 14:04:07.355	\N	\N
cmqv1k9vo000401rzmxkcjdk2	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_terminos_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "terminos", "version": "1.1.0", "explicit": true}	2026-06-26 14:43:47.844	\N	\N
cmqv1k9vv000501rzhysb9n9y	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_privacidad_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "privacidad", "version": "1.1.0", "explicit": true}	2026-06-26 14:43:47.851	\N	\N
cmqv1k9vy000601rz9r295ynt	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_cookies_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "cookies", "version": "1.1.0", "explicit": true}	2026-06-26 14:43:47.854	\N	\N
cmqv1k9w1000701rzhg1sfvax	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_lopdp_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "lopdp-consentimiento", "version": "1.1.0", "explicit": true}	2026-06-26 14:43:47.857	\N	\N
cmqv5qr6r000501qo764fbfwf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_terminos_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "terminos", "version": "1.1.0", "explicit": true}	2026-06-26 16:40:48.675	\N	\N
cmqv5qr6y000601qoq0grqdux	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_privacidad_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "privacidad", "version": "1.1.0", "explicit": true}	2026-06-26 16:40:48.682	\N	\N
cmqv5qr70000701qod43pyrrd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_cookies_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "cookies", "version": "1.1.0", "explicit": true}	2026-06-26 16:40:48.684	\N	\N
cmqv5qr71000801qosf5jjwjo	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_lopdp_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "lopdp-consentimiento", "version": "1.1.0", "explicit": true}	2026-06-26 16:40:48.685	\N	\N
cmqv5rsnx000901qoywf3tl6b	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqmyi26d000201ph2der0i4y	cmqlt50p2000801qgnzs5ydvv	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 16:41:37.254	\N	\N
cmqv5rtfe000a01qo89i8oura	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqmyi26d000201ph2der0i4y	cmqlt50p2000801qgnzs5ydvv	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 16:41:38.234	\N	\N
cmqv5sccf000b01qor2uo1ll1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmqmyi26d000201ph2der0i4y	cmqlt50p2000801qgnzs5ydvv	ALLOWED	\N	200.82.223.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-26 16:42:02.751	\N	\N
cmqv5snve000c01qotbz4e0wn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqmyi26d000201ph2der0i4y	cmqlt50p2000801qgnzs5ydvv	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 16:42:17.69	\N	\N
cmqv5stbb000d01qov299exuj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmqmyoggz000301ph5vfmyb1p	cmqlt50p2000801qgnzs5ydvv	ALLOWED	\N	200.82.223.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-26 16:42:24.743	\N	\N
cmqv5svxc000e01qozvw523kw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqmyi26d000201ph2der0i4y	cmqlt50p2000801qgnzs5ydvv	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 16:42:28.128	\N	\N
cmqv64ukr000i01qo5fv9s179	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 16:51:46.251	\N	\N
cmqv64vm7000j01qo625wx18q	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 16:51:47.599	\N	\N
cmqv64xy5000k01qotqcc64k1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 16:51:50.621	\N	\N
cmqv6g504000n01qof74zj6w4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 17:00:32.98	\N	\N
cmqv6g5ln000p01qoxf5wgbcs	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 17:00:33.755	\N	\N
cmqv6gaw0000q01qo46i08mhc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	200.82.223.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-26 17:00:40.608	\N	\N
cmqv6gjjd000s01qoij1dvzug	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 17:00:51.817	\N	\N
cmqv6glf4000t01qo0rmhxot9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	200.82.223.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-26 17:00:54.256	\N	\N
cmqv6h1gc000v01qoogyakl12	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 17:01:15.036	\N	\N
cmqv6icfv000x01qo341rkytj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 17:02:15.931	\N	\N
cmqv6iqvc000z01qoi64jz1vn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 17:02:34.632	\N	\N
cmqviewy5000901mgpl32c0nt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 22:35:31.277	\N	\N
cmqv6isaq001001qo98ahc0fr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	200.82.223.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-26 17:02:36.482	\N	\N
cmqv6j1ot001101qol8bzuxss	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 17:02:48.653	\N	\N
cmqv6j388001201qoosd33eym	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	200.82.223.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-26 17:02:50.648	\N	\N
cmqv6jb4r001301qo9wg2kee6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 17:03:00.892	\N	\N
cmqv6n79w001401qo1xosljaq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 17:06:02.516	\N	\N
cmqv6n7xt001601qoetstmjsm	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 17:06:03.377	\N	\N
cmqv6n8a2001701qopmj2qjd8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 17:06:03.818	\N	\N
cmqv6nb95001801qoen36lu4x	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	186.167.214.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-26 17:06:07.673	\N	\N
cmqv7y961001a01qoaexr7ekp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	190.6.15.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-26 17:42:37.801	\N	\N
cmqva5a6b000b01p3gfahv4dx	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_terminos_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "terminos", "version": "1.1.0", "explicit": true}	2026-06-26 18:44:04.931	\N	\N
cmqva5a6f000c01p3u6hcndpl	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_privacidad_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "privacidad", "version": "1.1.0", "explicit": true}	2026-06-26 18:44:04.935	\N	\N
cmqva5a6h000d01p3ft5t1zqj	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_cookies_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "cookies", "version": "1.1.0", "explicit": true}	2026-06-26 18:44:04.937	\N	\N
cmqva5a6l000e01p3re4bggsu	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_lopdp_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "lopdp-consentimiento", "version": "1.1.0", "explicit": true}	2026-06-26 18:44:04.941	\N	\N
cmqva6igf000f01p3760s7i7d	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	PATIENT_AUTOFILL_FROM_OTHER_WORKSPACE	Patient	\N	\N	ALLOWED	\N	\N	\N	API	{"hmacCedulaPrefix": "S2D98nYD"}	2026-06-26 18:45:02.319	\N	\N
cmqva6wto000j01p366ut25d1	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 18:45:20.94	\N	\N
cmqva6x6w000k01p3zq2phtpx	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 18:45:21.416	\N	\N
cmqvaavtf000m01p3ikyol740	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 18:48:26.259	\N	\N
cmqvaawa5000o01p3cc5ma0ke	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 18:48:26.861	\N	\N
cmqvabmcv000p01p33qqtj4m7	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-26 18:49:00.655	\N	\N
cmqvac95k000001o5e69if52s	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 18:49:30.201	\N	\N
cmqvacmvg000r01p3e7zabxcv	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 18:49:47.98	\N	\N
cmqvacurq000101o5cz3wenaz	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 18:49:58.214	\N	\N
cmqvao929000201o5w8o2n1k6	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	PASSWORD_CHANGED	Patient	cmqva6iju000g01p3ydrpvy5b	cmqva6iju000g01p3ydrpvy5b	ALLOWED	\N	\N	\N	UI	{"channel": "PORTAL_RESET"}	2026-06-26 18:58:49.953	\N	\N
cmqvicfp7000001mguoob7cri	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 22:33:35.611	\N	\N
cmqvicfv8000101mgdeam4d0r	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 22:33:35.828	\N	\N
cmqvicisy000201mgpp9qvsvd	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-26 22:33:39.634	\N	\N
cmqvidtsh000401mgrj4occ4w	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 22:34:40.529	\N	\N
cmqvidzex000501mgx0y3g6yq	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 22:34:47.817	\N	\N
cmqviecsl000601mg0aykv3h2	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 22:35:05.157	\N	\N
cmqview3n000701mg9y055i8i	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 22:35:30.179	\N	\N
cmqviewsa000801mgwjpr3f1o	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 22:35:31.066	\N	\N
cmqvif8sa000a01mglmbmwuwh	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 22:35:46.618	\N	\N
cmqvifcmv000b01mg05454b4c	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	190.6.34.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-26 22:35:51.607	\N	\N
cmqvifm34000d01mgm6dkbdol	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 22:36:03.856	\N	\N
cmqviftbo000e01mg84lt8ip9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	190.6.34.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-26 22:36:13.236	\N	\N
cmqvig9kw000f01mgrfiovn6y	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	\N	\N	UI	\N	2026-06-26 22:36:34.304	\N	\N
cmqvlpxm4000001nwntr2dv2h	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 00:08:04.204	\N	\N
cmqvlqxe6000101nwj2c9d8kl	cmqmx6t43000101phgcog0v6o	\N	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqdeploy1enc000001qgendvwxyz	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 00:08:50.574	\N	\N
cmqvm0q50000201nwa6je5u79	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqencTest28f1ea0beec9e8d96f	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 00:16:27.732	\N	\N
cmqvm5nw3000301nw14b1kf39	cmqlsydjl000101qg393bt9gt	cmqlsydj8000001qgpwn9mbjm	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqltchxl000901qgldeqlmsn	cmqlt0tlm000501qg1c3qd20v	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 00:20:18.099	\N	\N
cmqvm5tte000401nw7a6f78tu	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqencTest28f1ea0beec9e8d96f	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 00:20:25.778	\N	\N
cmqvmk3wc000501nwotrap7mf	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 00:31:32.028	\N	\N
cmqvmk4df000601nwvbn5eaxu	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 00:31:32.643	\N	\N
cmqvmkw3s000701nwhv4enhhr	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 00:32:08.584	\N	\N
cmqvmladh000801nw1kj5ghps	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 00:32:27.077	\N	\N
cmqvmlmdt000901nw45p5y00u	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	PDF	\N	2026-06-27 00:32:42.641	\N	\N
cmqvmlug2000b01nwqyq4ng2c	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 00:32:53.09	\N	\N
cmqvmv5td000c01nwxkbwzdon	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	test_enc_accordion	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 00:40:07.729	\N	\N
cmqvn5hci000d01nwtewyonmj	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 00:48:09.234	\N	\N
cmqvn5hmh000e01nwkulvv2fk	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 00:48:09.593	\N	\N
cmqvn5k4v000f01nw8rzcgxqd	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-27 00:48:12.847	\N	\N
cmqvnc9jc000h01nw76coywk1	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 00:53:25.704	\N	\N
cmqvo5tuw000001p7mhjsk1sv	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 01:16:25.064	\N	\N
cmqvo5u6d000101p7lwwvh4ch	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 01:16:25.477	\N	\N
cmqvo625b000201p7nwrgg1iq	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	PDF	\N	2026-06-27 01:16:35.807	\N	\N
cmqvo64ko000401p7kh8bt7x2	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 01:16:38.952	\N	\N
cmqvo6yc8000501p748pl8a7g	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 01:17:17.528	\N	\N
cmqvo6yjp000601p7ddaj4k9j	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 01:17:17.797	\N	\N
cmqvo719r000701p7g9930tuq	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	PDF	\N	2026-06-27 01:17:21.327	\N	\N
cmqvo73t4000901p7ok1dwsjy	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 01:17:24.616	\N	\N
cmqvott9x000001phq0i8uxnr	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 01:35:04.053	\N	\N
cmqvottw2000101phdhcbghan	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 01:35:04.85	\N	\N
cmqvovnmf000301phxg7extby	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 01:36:30.04	\N	\N
cmqvovqt7000401ph91w791c9	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 01:36:34.171	\N	\N
cmqvoy45n000501phjf4budqw	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 2}	2026-06-27 01:38:24.779	\N	\N
cmqvoy6b8000801ph42hkr9fo	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 01:38:27.572	\N	\N
cmqvp74fi000a01phf4pauw6m	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-27 01:45:25.038	\N	\N
cmqvp8so4000c01phxz70rnb8	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 01:46:43.108	\N	\N
cmqvp8x9n000e01phwme25hnh	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 01:46:49.068	\N	\N
cmqvp8xff000f01phrnodhurd	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 01:46:49.276	\N	\N
cmqvp91tu000g01phl3m5wnur	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-27 01:46:54.978	\N	\N
cmqvp9niy000h01phfcjrk1e3	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 01:47:23.098	\N	\N
cmqvpb32x000j01phxnu1lw4x	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_INVOICE	Invoice	cmqvpav85000i01ph6nrar21s	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-27 01:48:29.913	\N	\N
cmqvpbhor000k01phd9qecz8f	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_INVOICE	Invoice	cmqvpav85000i01ph6nrar21s	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-27 01:48:48.844	\N	\N
cmqvpjkut000m01phdllwmgve	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ACCESS_DENIED	Document	cmqvp6v8f000901ph10ukt7wy	\N	DENIED	Not found or not accessible	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-27 01:55:06.197	\N	\N
cmqvpmriu000o01phnae2zxql	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_CSV_PATIENTS	PatientRegistration	\N	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	EXPORT	{"count": 4}	2026-06-27 01:57:34.806	\N	\N
cmqvw9ypg000q01ph3hw15nwq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6ic8z000w01qolgkr64qz	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.19.0	PDF	\N	2026-06-27 05:03:34.9	\N	\N
cmqvw9ypp000r01ph15pz01kr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.19.0	PDF	\N	2026-06-27 05:03:34.909	\N	\N
cmqvwaywd000t01phm5ub01zw	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 05:04:21.805	\N	\N
cmqvwby7o000v01phfcxvndi0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.19.0	PDF	\N	2026-06-27 05:05:07.573	\N	\N
cmqvwbyy9000x01phanzlszjh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.19.0	PDF	\N	2026-06-27 05:05:08.529	\N	\N
cmqvwc020000y01ph78ywm6xq	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 05:05:09.96	\N	\N
cmqvwcbjw001001ph514i4a4g	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 05:05:24.86	\N	\N
cmqvwcc4y001101phay5vu3ou	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 05:05:25.618	\N	\N
cmqvwdt8r001301ph53ug4qcr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 05:06:34.443	\N	\N
cmqvwdtxm001501phshbwmtyq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 05:06:35.338	\N	\N
cmqvwdvij001601phoz6slj2e	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 05:06:37.387	\N	\N
cmqvwdzbw001701phmrmtf137	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 05:06:42.332	\N	\N
cmqvwe0nq001901phe5x0vyl7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 05:06:44.054	\N	\N
cmqvwfzb4001a01ph2uuma31z	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	curl/8.19.0	PDF	\N	2026-06-27 05:08:15.616	\N	\N
cmqvwgnfg001c01ph1jyugg8m	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 05:08:46.876	\N	\N
cmqvwgnkl001d01phfwzts76k	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 05:08:47.061	\N	\N
cmqvwh4d6001e01phsk60rba5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.19.0	PDF	\N	2026-06-27 05:09:08.829	\N	\N
cmqvwhb77001g01ph4pmemn28	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.19.0	PDF	\N	2026-06-27 05:09:17.683	\N	\N
cmqvwhmdt001h01ph5y7euby7	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 05:09:32.177	\N	\N
cmqvwhyol001j01phumbkxgeh	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqvwhykp001i01phnnst6b3i	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 05:09:48.117	\N	\N
cmqvwhyvk001k01phbmyo13st	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqvwhykp001i01phnnst6b3i	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 05:09:48.368	\N	\N
cmqvwi3ox001l01ph8z18id1q	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 05:09:54.609	\N	\N
cmqvwi3ws001n01ph4fjmdes1	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 05:09:54.893	\N	\N
cmqvwi5an001p01ph22csj0sz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 05:09:56.687	\N	\N
cmqvwic2c001q01phwtns9w2i	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.19.0	PDF	\N	2026-06-27 05:10:05.46	\N	\N
cmqvwisso001r01phpbwzj90m	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 05:10:27.144	\N	\N
cmqvwj5eh001s01phzg81v0ti	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.19.0	PDF	\N	2026-06-27 05:10:43.481	\N	\N
cmqvwj602001u01phekmx362t	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.19.0	PDF	\N	2026-06-27 05:10:44.258	\N	\N
cmqvwj72r001v01phhy7e7sdc	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	curl/8.19.0	PDF	\N	2026-06-27 05:10:45.651	\N	\N
cmqvwjas9001x01phyy4mlkta	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 05:10:50.457	\N	\N
cmqvwjbrj001z01ph91mbptx8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 05:10:51.727	\N	\N
cmqvwjcqd002001phrercyhht	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.19.0	PDF	\N	2026-06-27 05:10:52.981	\N	\N
cmqvwje0b002101phd05u6nb4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 05:10:54.635	\N	\N
cmqvwjin3002301phnlqfp0o6	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	curl/8.19.0	PDF	\N	2026-06-27 05:11:00.639	\N	\N
cmqvwjngp002501phr90mb3of	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqvwhykp001i01phnnst6b3i	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 05:11:06.889	\N	\N
cmqw6z26o002601ph5wjlqb12	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:03:01.968	\N	\N
cmqw6z5qz002801ph0pbmpe6v	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6ic8z000w01qolgkr64qz	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:03:06.587	\N	\N
cmqw715zy002901ph85xxz3hp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:04:40.222	\N	\N
cmqw717vz002b01phdh1uk9y0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 10:04:42.671	\N	\N
cmqw719vp002d01phanqq7o5z	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 10:04:45.253	\N	\N
cmqw719wr002f01ph6laq717f	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 10:04:45.291	\N	\N
cmqw71a7n002h01ph7dvhqwgr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 10:04:45.683	\N	\N
cmqw71cbb002i01phxtgu3d8u	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:04:48.407	\N	\N
cmqw71d0u002k01ph8kkbkx5b	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:04:49.326	\N	\N
cmqw71dvr002l01phbkuyvv0x	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 10:04:50.439	\N	\N
cmqw71eas002n01phmq8kency	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 10:04:50.98	\N	\N
cmqw71lzt002o01phs0n81auu	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:05:00.953	\N	\N
cmqw71o79002q01ph7le8re9r	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:05:03.813	\N	\N
cmqw71q6v002r01ph3v40khx7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 10:05:06.391	\N	\N
cmqw72802002s01ph32xyk4u6	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:05:29.474	\N	\N
cmqw72hu7002u01ph18472mjk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:05:42.223	\N	\N
cmqw72zsu002v01phy61cijef	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:06:05.502	\N	\N
cmqw734f6002x01pho6saub1u	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:06:11.49	\N	\N
cmqw73osz002y01phqfn2ub96	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	10.0.1.0	curl/8.20.0	PDF	\N	2026-06-27 10:06:37.907	\N	\N
cmqw73q1k003001pht4z9h228	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	10.0.1.0	curl/8.20.0	PDF	\N	2026-06-27 10:06:39.512	\N	\N
cmqw756yg003101ph4no48i0h	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 10:07:48.088	\N	\N
cmqw757i8003301phcnar8nzz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 10:07:48.8	\N	\N
cmqw75erq003401phsdzd70za	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:07:58.214	\N	\N
cmqw75ljr003601phl81a87tb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:08:06.999	\N	\N
cmqw75lvp003801ph4o92kne5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:08:07.429	\N	\N
cmqw75mvs003901ph2ulg5nyd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:08:08.728	\N	\N
cmqw75ni5003a01ph3wjlhye0	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:08:09.533	\N	\N
cmqw75tnl003c01ph46dv182v	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:08:17.505	\N	\N
cmqw75to4003d01phtl5qdwwj	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:08:17.524	\N	\N
cmqw763pr003f01phlaekb0n1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 10:08:30.543	\N	\N
cmqw76471003h01phe6h5ov7t	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 10:08:31.165	\N	\N
cmqw76m84003i01ph3v80jrge	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:08:54.532	\N	\N
cmqw76m8d003j01phzn58rmt1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:08:54.541	\N	\N
cmqw76q9k003l01phgoym2zbk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:08:59.768	\N	\N
cmqw76s4i003n01ph4998spgo	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:09:02.178	\N	\N
cmqw76wly003o01phmojze2fw	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:09:07.99	\N	\N
cmqw773mh003q01pha8bae1az	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:09:17.081	\N	\N
cmqw776n9003r01phjc9zzx5v	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:09:20.997	\N	\N
cmqw7776z003t01ph0owdyvyt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:09:21.707	\N	\N
cmqw77ium003u01ph1ejx5bgs	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:09:36.814	\N	\N
cmqw77l9l003w01phxd3vqk4c	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:09:39.945	\N	\N
cmqw77mu5003y01phmutoph6m	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:09:41.981	\N	\N
cmqw77ndf003z01pht4jwc58e	cmqva532b000201p39eq8lpiq	cmqva532b000101p39eq8lpiq	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 10:09:42.675	\N	\N
cmqw77o2z004101phkcuskbph	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6ic8z000w01qolgkr64qz	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:09:43.595	\N	\N
cmqw77pe9004201phehinxfab	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 10:09:45.297	\N	\N
cmqw78fnt004301phz00iqn88	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:10:19.337	\N	\N
cmqw78hfg004501phisrjihh3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 10:10:21.628	\N	\N
cmqw78j42004701ph6mffohr5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 10:10:23.81	\N	\N
cmqw78kzu004801phe51o25pq	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:10:26.25	\N	\N
cmqw78ndy004a01phgqtxpdyw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:10:29.35	\N	\N
cmqw78waf004b01ph4jfd1bik	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:10:40.887	\N	\N
cmqw78ykz004d01phec204u2y	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:10:43.859	\N	\N
cmqw798x7004e01phbryjtlbe	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:10:57.259	\N	\N
cmqw79lh7004f01phocy5kcat	cmqva532b000201p39eq8lpiq	cmqva532b000101p39eq8lpiq	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 10:11:13.532	\N	\N
cmqw79mt7004h01phg34ril58	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:11:15.259	\N	\N
cmqw79ors004j01ph8al7qng7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	Python-urllib/3.11	PDF	\N	2026-06-27 10:11:17.8	\N	\N
cmqw79qi8004l01phmeropgve	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	Python-urllib/3.11	PDF	\N	2026-06-27 10:11:20.048	\N	\N
cmqw79ro0004m01phzzkf21zc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqv64uh4000h01qoayzpywm8	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 10:11:21.552	\N	\N
cmqw79xsr004n01phloxmcbz0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	13.140.181.0	curl/8.5.0	PDF	\N	2026-06-27 10:11:29.499	\N	\N
cmqw79y8y004o01phnlrzyit9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqn1lek1000101osd10hpn6z	cmqlt50p2000801qgnzs5ydvv	ALLOWED	\N	73.8.161.0	curl/8.20.0	PDF	\N	2026-06-27 10:11:30.082	\N	\N
cmqw79yj4004p01pho1k0zszk	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0	PDF	\N	2026-06-27 10:11:30.448	\N	\N
cmqw79yq0004r01phehn6w0c2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmqv6iqbh000y01qogk9i146p	cmqv63sza000g01qokw3w9kwp	ALLOWED	\N	73.8.161.0	Mozilla/5.0	PDF	\N	2026-06-27 10:11:30.696	\N	\N
cmqwrc3t7000001s04trs49q2	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	PASSWORD_CHANGED	Patient	cmqva6iju000g01p3ydrpvy5b	cmqva6iju000g01p3ydrpvy5b	ALLOWED	\N	\N	\N	UI	{"channel": "PORTAL_RESET"}	2026-06-27 19:33:02.923	\N	\N
cmqwrgl2n000101s0uykwhk3g	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqvwhykp001i01phnnst6b3i	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 19:36:31.919	\N	\N
cmqwrglhs000201s0axtgawm7	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqvwhykp001i01phnnst6b3i	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 19:36:32.464	\N	\N
cmqwrhtev000301s0awoqtroy	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqvwhykp001i01phnnst6b3i	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 19:37:29.383	\N	\N
cmqwri44w000401s0h2ihe2ci	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqvwhykp001i01phnnst6b3i	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 19:37:43.28	\N	\N
cmqwrsv28000501s08osw2uyp	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqvwhykp001i01phnnst6b3i	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 19:46:04.736	\N	\N
cmqwsdhbh000001njpo5wnov2	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqvwhykp001i01phnnst6b3i	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 20:02:06.701	\N	\N
cmqwsdiy0000101njfjayqp35	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqvwhykp001i01phnnst6b3i	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 20:02:08.808	\N	\N
cmqwsdjw2000201njg5h46ljn	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqvwhykp001i01phnnst6b3i	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 20:02:10.034	\N	\N
cmqwselfn000301njc4vgr1kw	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	AI_PHI_DISCLOSURE	SupportBot	\N	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	SUPPORT_BOT	{"toolsCalled": [], "messageCount": 2}	2026-06-27 20:02:58.691	\N	\N
cmqwsilwa000501njmna84k4h	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	AI_PHI_DISCLOSURE	SupportBot	\N	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	SUPPORT_BOT	{"toolsCalled": [], "messageCount": 4}	2026-06-27 20:06:05.914	\N	\N
cmqwsjvpd000701njabfr3oyi	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	AI_PHI_DISCLOSURE	SupportBot	\N	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	SUPPORT_BOT	{"toolsCalled": [], "messageCount": 6}	2026-06-27 20:07:05.282	\N	\N
cmqwslm86000901nj6i2q4yfo	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqvwhykp001i01phnnst6b3i	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 20:08:26.31	\N	\N
cmqwslwd4000a01njnd2yjdrq	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	AI_PHI_DISCLOSURE	SupportBot	\N	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	SUPPORT_BOT	{"toolsCalled": [], "messageCount": 8}	2026-06-27 20:08:39.448	\N	\N
cmqwsmby9000c01njk01scu75	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqvwhykp001i01phnnst6b3i	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-27 20:08:59.649	\N	\N
cmqx47xy6000101mjs7ahui1q	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	PASSWORD_RESET_COMPLETED	Doctor	cmqmx6t3y000001phuzs1sirz	\N	ALLOWED	\N	\N	\N	API	\N	2026-06-28 01:33:43.71	\N	\N
cmqy88tda000b01o7hjlhk7hw	cmqy8838o000201o7vkf0es2z	cmqy8838b000101o7xuh055nu	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_terminos_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "terminos", "version": "1.1.0", "explicit": true}	2026-06-28 20:14:09.07	\N	\N
cmqy88tdv000c01o7a0x1htqf	cmqy8838o000201o7vkf0es2z	cmqy8838b000101o7xuh055nu	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_privacidad_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "privacidad", "version": "1.1.0", "explicit": true}	2026-06-28 20:14:09.091	\N	\N
cmqy88tdy000d01o73e2tnhjf	cmqy8838o000201o7vkf0es2z	cmqy8838b000101o7xuh055nu	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_cookies_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "cookies", "version": "1.1.0", "explicit": true}	2026-06-28 20:14:09.094	\N	\N
cmqy88te1000e01o755sv96uu	cmqy8838o000201o7vkf0es2z	cmqy8838b000101o7xuh055nu	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_lopdp_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "lopdp-consentimiento", "version": "1.1.0", "explicit": true}	2026-06-28 20:14:09.097	\N	\N
cmqy8am36000f01o7tmnb0ddv	cmqy8838o000201o7vkf0es2z	cmqy8838b000101o7xuh055nu	DOCTOR	EXPORT_CSV_PATIENTS	PatientRegistration	\N	\N	ALLOWED	\N	190.120.253.0	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	EXPORT	{"count": 0}	2026-06-28 20:15:32.946	\N	\N
cmqy8an5q000h01o7pt58v0a7	cmqy8838o000201o7vkf0es2z	cmqy8838b000101o7xuh055nu	DOCTOR	EXPORT_CSV_PATIENTS	PatientRegistration	\N	\N	ALLOWED	\N	190.120.253.0	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	EXPORT	{"count": 0}	2026-06-28 20:15:34.334	\N	\N
cmqzyb02e000001qbrmi2br88	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqvwhykp001i01phnnst6b3i	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 01:11:27.254	\N	\N
cmqzyb0cc000101qbebj7fa0f	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqvwhykp001i01phnnst6b3i	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 01:11:27.612	\N	\N
cmqzyb9n6000201qbbp1mtw9n	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	ENCOUNTER_DELETED	Encounter	cmqvwhykp001i01phnnst6b3i	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 01:11:39.666	\N	\N
cmqzybbhg000301qbotppfa9o	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 01:11:42.052	\N	\N
cmqzybbng000401qbh1f5yo5k	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 01:11:42.268	\N	\N
cmqzybfio000501qbg7ps1qod	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 01:11:47.281	\N	\N
cmqzybfp7000601qbe305bvpl	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 01:11:47.515	\N	\N
cmqzybfu4000701qb6x6lu3x9	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 01:11:47.692	\N	\N
cmqzyc9cy000801qblvcjxj5j	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	ENCOUNTER_DELETED	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 01:12:25.954	\N	\N
cmqzzwrxh000101k527gnqnno	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	PASSWORD_RESET_COMPLETED	Doctor	cmqlsyn94000201qg8eeqn1c2	\N	ALLOWED	\N	\N	\N	API	\N	2026-06-30 01:56:22.757	\N	\N
cmr000ysf000301k57j9ffpjs	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 01:59:38.271	\N	\N
cmr00124w000401k5ogxrpp5q	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 01:59:42.608	\N	\N
cmr007i4z000601k5vj46eo7q	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:04:43.283	\N	\N
cmr007isb000701k5v59jr890	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:04:44.123	\N	\N
cmr007wzn000801k5mail3ljt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	190.153.16.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-30 02:05:02.531	\N	\N
cmr009cni000001mt31n5dzfl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:06:09.488	\N	\N
cmr00a58c000101mtvpp8ooh6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:06:46.524	\N	\N
cmr00cady000201mt4s58dkph	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:08:26.518	\N	\N
cmr00cy6c000301mt4mc7v5mo	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:08:57.348	\N	\N
cmr00cz6v000401mtsbyrxtgr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:08:58.663	\N	\N
cmr00czoj000501mt4edlarri	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:08:59.299	\N	\N
cmr00d0ts000601mtqhrp6zla	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:09:00.784	\N	\N
cmr00dshu000701mtm9i10ee7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:09:36.642	\N	\N
cmr01t05l000001lm8dlpgz7q	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:49:26.025	\N	\N
cmr01uugo000001mudjnczli6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:50:51.961	\N	\N
cmr01uv4n000101muise17lrp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:50:52.823	\N	\N
cmr01vo87000301muhdwl2362	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:51:30.535	\N	\N
cmr01vokv000401mulfuqq0yl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:51:30.991	\N	\N
cmr01vpv2000501mux9i77fku	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	190.153.16.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-30 02:51:32.654	\N	\N
cmr01wr8j000601mu0fh9mt4k	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:52:21.091	\N	\N
cmr01x00q000701muirdrq3jd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:52:32.474	\N	\N
cmr01x0hx000801mu503q3km3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:52:33.093	\N	\N
cmr01x0yo000901muehtfovjo	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:52:33.696	\N	\N
cmr01xpq0000a01muq37vbnj2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:53:05.784	\N	\N
cmr01xvcy000c01muiyqck906	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:53:13.09	\N	\N
cmr01xvlk000d01mundkzyoll	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:53:13.4	\N	\N
cmr01xwos000e01muaxnn1l2m	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	190.153.16.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-30 02:53:14.812	\N	\N
cmr020qfh000f01muc2qzqqzn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr000yni000201k55bne95f0	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:55:26.669	\N	\N
cmr020ve8000h01mu8dfkvk1s	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:55:33.104	\N	\N
cmr020vr6000i01muf0t2ozjk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:55:33.57	\N	\N
cmr022vus000j01musjw6i0do	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:57:07.012	\N	\N
cmr026573000l01muz59mj55w	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:59:39.087	\N	\N
cmr026h84000n01mujic71ohs	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 02:59:54.676	\N	\N
cmr02oszl000o01mujhlu26wf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:14:09.729	\N	\N
cmr02p5c1000p01mu98fupj6b	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:14:25.729	\N	\N
cmr02pkxw000r01mun3p54v3f	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:14:45.956	\N	\N
cmr02pld7000s01muiisejqqb	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:14:46.507	\N	\N
cmr02pr74000u01muh48pdy89	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:14:54.064	\N	\N
cmr02pro7000w01muj9l9cw05	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:14:54.679	\N	\N
cmr02qmdn000x01mu8lzeejvr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	190.153.16.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	API	{"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 2}	2026-06-30 03:15:34.475	\N	\N
cmr02qnhx001001mumcatwnl4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:15:35.925	\N	\N
cmr02qott001101muqgfwepm7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr02pqxk000t01mumfl2aynd	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	190.153.16.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-30 03:15:37.649	\N	\N
cmr02rf4f001301mucsobzjj9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:16:11.727	\N	\N
cmr02s01i001401mu8o8o1yha	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	190.153.16.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	API	{"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 3}	2026-06-30 03:16:38.838	\N	\N
cmr02s12b001701muj8j7bxr8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:16:40.163	\N	\N
cmr02s4h6001801mum9qwxuyp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr02pqxk000t01mumfl2aynd	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	190.153.16.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-30 03:16:44.586	\N	\N
cmr02sbq2001a01mu00wvd31j	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:16:53.978	\N	\N
cmr02sxts001b01muvwntdjha	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:17:22.624	\N	\N
cmr02te74001f01muc26kko2d	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:17:43.84	\N	\N
cmr02tn0n001h01mu8vqcn433	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:17:55.271	\N	\N
cmr02unsw001i01muvmcf8wxw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmr02tdjz001c01mu7rhoq7bv	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	190.153.16.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-30 03:18:42.944	\N	\N
cmr02ytbn001j01muiepofrxy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:21:56.723	\N	\N
cmr03019m001k01mu5ukphwjn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr02pqxk000t01mumfl2aynd	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	190.153.16.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-30 03:22:53.674	\N	\N
cmr0309ov000001lgu69425uv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:23:04.591	\N	\N
cmr0336ei000101lgvqcd20i2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:25:20.298	\N	\N
cmr0358kw000201lgbztk6fjx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:26:56.432	\N	\N
cmr0365di000301lgij51axot	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:27:38.934	\N	\N
cmr037aen000401lg8a5la03x	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:28:32.111	\N	\N
cmr037znl000601lgcmkgzq8d	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:29:04.833	\N	\N
cmr038a2x000701lgtw0mcc96	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:29:18.345	\N	\N
cmr038m4g000901lgpf8z9ng3	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:29:33.952	\N	\N
cmr038mdg000b01lg0e8fvoif	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:29:34.276	\N	\N
cmr039hzt000c01lg7fbr1rmq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:30:15.257	\N	\N
cmr03a46w000f01lg1f6jihfx	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:30:44.024	\N	\N
cmr03a5yb000g01lgtt4kobdm	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmr03a40i000d01lgum871jkh	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 03:30:46.307	\N	\N
cmr03aiwz000h01lg876c2otr	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:31:03.107	\N	\N
cmr03b0zh000i01lg535qf15s	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:31:26.525	\N	\N
cmr03b270000j01lg8xtfk0lb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:31:28.092	\N	\N
cmr03b5ly000k01lga5zw80sx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	190.153.16.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-30 03:31:32.518	\N	\N
cmr03b9at000l01lgexq6d23l	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:31:37.301	\N	\N
cmr03em0r000m01lg7sx1jjbt	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:34:13.755	\N	\N
cmr03g9b5000n01lgqsakb9dc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:35:30.593	\N	\N
cmr03gkot000o01lg9qp0xolu	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:35:45.341	\N	\N
cmr03gt30000p01lgjhnxyztz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr02pqxk000t01mumfl2aynd	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	190.153.16.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-30 03:35:56.22	\N	\N
cmr03gxf9000r01lgdfjihjn4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmr02tdjz001c01mu7rhoq7bv	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	190.153.16.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-30 03:36:01.845	\N	\N
cmr03gxfh000s01lgs9ej5pye	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:36:01.853	\N	\N
cmr03gzof000t01lgrasj6nn3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:36:04.767	\N	\N
cmr03hwt9000u01lgwmqxmib3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:36:47.709	\N	\N
cmr03hx3p000v01lg1lts9032	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:36:48.085	\N	\N
cmr03hxlp000w01lgntbi0178	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:36:48.733	\N	\N
cmrmbt8sn003o01le6mxdxjmq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmrm8508y000e01lepg5zbuer	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 17:00:29.255	\N	\N
cmrmcne9b003z01letmvfn1tv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:23:56.015	\N	\N
cmrmcrjff004a01le3mb5u7rt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:27:09.339	\N	\N
cmrmcrojg004c01le6glmo9gk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrmcomep004401leo1dxiu3q	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 17:27:15.964	\N	\N
cmrmcupjy004n01lerpm5rwje	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:29:37.246	\N	\N
cmrmczn2f004y01lej0738niy	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:33:27.303	\N	\N
cmrmp2f78006001le2wf0zrwm	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 23:11:32.468	\N	\N
cmrmpwqh6000001pgm6pn3c8h	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 23:35:06.762	\N	\N
cmrmpwqp5000101pg2b7g28d9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 23:35:07.049	\N	\N
cmrmqsx5s000201loxsq2bjjf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:00:08.416	\N	\N
cmrmr5jwo000c01lonvlblvrx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:09:57.768	\N	\N
cmrmrhbez000501rogqvurafy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:19:06.635	\N	\N
cmrmrhf5u000801rogf24i9cy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:19:11.49	\N	\N
cmrmronca000501o5wx2n3iob	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:24:48.682	\N	\N
cmrmruxg1000o01o567g358t2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:29:41.713	\N	\N
cmrmrx33m000w01o5du8cumdf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrmqukob000801lo1new9ezh	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 00:31:22.354	\N	\N
cmrmsbma1001901o5g2pro30x	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:42:40.393	\N	\N
cmrmsgpmo001h01o5sp4buw7p	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:46:38.016	\N	\N
cmrmswdpz000901nlyng34bcj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:58:49.079	\N	\N
cmrmtia5c000401o6ahn1j9fw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:15:50.88	\N	\N
cmrmu0wd9000601o0f645c6rs	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:30:19.485	\N	\N
cmrmugu18000401skdshrs9yk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:42:42.956	\N	\N
cmrmuv4qh000f01sk49jyogxf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:53:50.009	\N	\N
cmrmv9dxf000401o4lm0auml4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:04:55.107	\N	\N
cmrmvasse000c01o4rxqese3j	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:06:01.022	\N	\N
cmrmvbfyg000i01o47g2vb5va	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:06:31.048	\N	\N
cmrmvcdxc000q01o43q5bb8p0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:07:15.072	\N	\N
cmrmvf46n000z01o4zmv1gvkq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:09:22.415	\N	\N
cmrmvgqpq001901o4puf386z3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:10:38.27	\N	\N
cmrmvinvz001f01o4n2tnb893	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:12:07.919	\N	\N
cmrmvjye5001k01o4kjj0ogeo	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:13:08.189	\N	\N
cmrmvlezl001p01o4i7ps1vzw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 02:14:16.353	\N	\N
cmrmvrg55001s01o4da6h669o	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:18:57.785	\N	\N
cmr03hxwi000x01lgnz6d0g3d	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:36:49.122	\N	\N
cmr03jbqs000y01lgpxafeuaq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:37:53.716	\N	\N
cmr03jsqr001001lgat73ie7x	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmr03jrqf000z01lg7rojvzsx	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	190.153.16.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-30 03:38:15.747	\N	\N
cmr03kqp3001101lge24n1n6m	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:38:59.751	\N	\N
cmr03n34z001201lgmxmwe2n4	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:40:49.187	\N	\N
cmr03n43e001401lgfmn6z6m9	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmr03n3rj001301lgx1lnnl7p	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 03:40:50.426	\N	\N
cmr03nz2n001501lgbcsugheo	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:41:30.575	\N	\N
cmr03o3td001701lgumpapugc	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:41:36.721	\N	\N
cmr03o3xp001801lg6eb1id56	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:41:36.877	\N	\N
cmr03o4du001901lgz23dkyk1	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:41:37.458	\N	\N
cmr03ozi6001a01lg9gr2zn3e	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:42:17.79	\N	\N
cmr03p3hc001c01lgzx7no7dh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr03p3cc001b01lg7ny2zohc	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:42:22.944	\N	\N
cmr03p3rv001d01lge303xqz0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr03p3cc001b01lg7ny2zohc	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:42:23.323	\N	\N
cmr03q3qr001f01lgrl6ryiqr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr03p3cc001b01lg7ny2zohc	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:43:09.939	\N	\N
cmr03q8yp001g01lg4kb2ox8o	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr03p3cc001b01lg7ny2zohc	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:43:16.705	\N	\N
cmr03qjfl001i01lgzs8m9dq5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr03p3cc001b01lg7ny2zohc	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:43:30.273	\N	\N
cmr03r8mf001k01lgm194pl94	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr03p3cc001b01lg7ny2zohc	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:44:02.919	\N	\N
cmr03r973001l01lgpjq6ym49	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr03p3cc001b01lg7ny2zohc	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:44:03.663	\N	\N
cmr03ralo001m01lgcjaz02go	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr03p3cc001b01lg7ny2zohc	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	190.153.16.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-06-30 03:44:05.484	\N	\N
cmr03s4m4001n01lgjq67ecdu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr03p3cc001b01lg7ny2zohc	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:44:44.38	\N	\N
cmr03tadr001o01lgkrdl310p	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:45:38.511	\N	\N
cmr03tizg001p01lg5dryos3v	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr03p3cc001b01lg7ny2zohc	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:45:49.66	\N	\N
cmr03umd3001q01lg0nqmfsck	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr03p3cc001b01lg7ny2zohc	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:46:40.696	\N	\N
cmr03uua3001r01lg0gw6wz1r	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:46:50.955	\N	\N
cmr03uwzw001s01lgkzjxoexf	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:46:54.476	\N	\N
cmr03w2iz001t01lgf362wdxk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr03p3cc001b01lg7ny2zohc	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:47:48.299	\N	\N
cmr03ztny001u01lgu74n12af	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr03p3cc001b01lg7ny2zohc	cmqvpjde0000l01phqmgfkbnm	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 03:50:43.438	\N	\N
cmr04dcl3001v01lgqo0zb7ht	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:01:14.488	\N	\N
cmr04juiu000001pxqohx8s6y	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:06:17.67	\N	\N
cmr04lr3n000101pxdkiteb6o	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:07:46.547	\N	\N
cmr04lrcz000201px49us75o1	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:07:46.883	\N	\N
cmr04lte7000301pxeo5b347n	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 04:07:49.519	\N	\N
cmr04lx55000401pxmz0ewtjz	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:07:54.377	\N	\N
cmr04r0fe001a01pxmv9ew2n2	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:11:51.914	\N	\N
cmr04lztv000501px30vx5p2d	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmr03a40i000d01lgum871jkh	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 04:07:57.859	\N	\N
cmr04m2hw000601pxrrgd29ao	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:08:01.316	\N	\N
cmr04m4ez000701pxhrh8wna0	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:08:03.803	\N	\N
cmr04m4nq000801pxn3zeli39	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:08:04.118	\N	\N
cmr04m4wx000901pxgxr31ekt	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:08:04.449	\N	\N
cmr04mmzs000b01pxrcid1jxr	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:08:27.88	\N	\N
cmr04mzwi000c01pxexkq7ump	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 2}	2026-06-30 04:08:44.61	\N	\N
cmr04n1jy000f01pxrp6n04q8	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:08:46.75	\N	\N
cmr04n6t4000g01px3pyigail	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr038lzh000801lgtenkkv36	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 04:08:53.56	\N	\N
cmr04na8t000i01pxvvcb0s7z	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:08:58.013	\N	\N
cmr04nbo9000j01pxlq539xs6	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:08:59.865	\N	\N
cmr04nccc000k01pxwxlpdtwh	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:09:00.732	\N	\N
cmr04ncep000l01pxh3p5puyg	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:09:00.818	\N	\N
cmr04nctd000m01px9tv6dg0d	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:09:01.345	\N	\N
cmr04nd8e000n01pxcxd4a6d7	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:09:01.886	\N	\N
cmr04ndmw000o01px1vgxlef5	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:09:02.408	\N	\N
cmr04ni6b000p01pxt24aopad	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmr03a40i000d01lgum871jkh	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 04:09:08.291	\N	\N
cmr04nllq000q01pxkkbap9z3	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:09:12.734	\N	\N
cmr04npw4000r01pxfaa5h73j	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmr03a40i000d01lgum871jkh	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 04:09:18.292	\N	\N
cmr04oh9o000s01pxzcp10ubt	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:09:53.772	\N	\N
cmr04om0j000t01px3aaubq1i	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:09:59.923	\N	\N
cmr04p96u000u01pxctzz9b6c	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:10:29.958	\N	\N
cmr04p9ck000v01pxg0gqlpee	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:10:30.164	\N	\N
cmr04pc26000w01pxarkmg68g	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr038lzh000801lgtenkkv36	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 04:10:33.679	\N	\N
cmr04pgtr000y01px7m0z8lwb	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:10:39.855	\N	\N
cmr04pn7h000z01pxxrh68zge	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmr03a40i000d01lgum871jkh	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 04:10:48.125	\N	\N
cmr04pppn001001pxn4vt6i1s	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:10:51.371	\N	\N
cmr04q11j001101pxo54lp1vf	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	ENCOUNTER_DELETED	Encounter	cmr02pki6000q01mu123vkzrw	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:11:06.055	\N	\N
cmr04q3qi001301pxto2wwjrv	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:11:09.546	\N	\N
cmr04q3w9001401pxp4lxn4qy	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:11:09.753	\N	\N
cmr04qpj9001601pxa5s3vwlt	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:11:37.797	\N	\N
cmr04r06j001801px4iimv8f4	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:11:51.595	\N	\N
cmr04rhsr001b01pxfldruhbn	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 2}	2026-06-30 04:12:14.427	\N	\N
cmr04rjmz001e01pxkn6k4ctd	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:12:16.811	\N	\N
cmr04rvnw001f01pxaeea373r	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr04r00t001701px0czca4rc	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 04:12:32.396	\N	\N
cmr04s26y001h01pxcae6y6g3	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:12:40.858	\N	\N
cmr051xlh000001p63zlg4r4u	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:20:21.461	\N	\N
cmr051xww000101p6nbuiort3	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:20:21.873	\N	\N
cmr052drx000201p6v5kb69fl	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr04r00t001701px0czca4rc	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 04:20:42.429	\N	\N
cmr052kiq000401p69npvnl05	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:20:51.17	\N	\N
cmr053dbo000501p6g6b7ix6m	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:21:28.5	\N	\N
cmr053di8000601p6sjghnw30	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:21:28.736	\N	\N
cmr053olj000801p6c4m3rhdo	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmr053oag000701p6orck2mg3	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 04:21:43.111	\N	\N
cmr053uj6000901p6d994wevx	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:21:50.802	\N	\N
cmr05q25d000001pkkusfjirr	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:39:07.105	\N	\N
cmr05q47o000101pkv7yl45kl	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:39:09.784	\N	\N
cmr05q4z1000201pkrhg74huo	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:39:10.765	\N	\N
cmr05q5zk000301pk757qiyjz	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:39:12.08	\N	\N
cmr05qa06000501pkyr3tasfh	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmr05q9pd000401pkpknigmcu	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 04:39:17.286	\N	\N
cmr05x0se000001jy3gtfeoqb	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:44:31.934	\N	\N
cmr05z9tn000101jy4a6dloe8	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:46:16.955	\N	\N
cmr05zgyn000201jy4dji22gi	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmr05q9pd000401pkpknigmcu	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 04:46:26.208	\N	\N
cmr06043e000301jyeuilyyr8	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 04:46:56.186	\N	\N
cmr0k5dmq000101moiz6lw0fq	cmqy8838o000201o7vkf0es2z	cmqy8838b000101o7xuh055nu	DOCTOR	EXPORT_PDF_INVOICE	MonthlyReport	\N	\N	ALLOWED	\N	195.242.214.0	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	PDF	{"year": 2026, "month": 6, "totalInvoices": 0}	2026-06-30 11:22:56.45	\N	\N
cmr0o3wcq000501mo5naha45y	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 13:13:45.866	\N	\N
cmr0o3wvp000601mok0bo1eby	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 13:13:46.549	\N	\N
cmr0omg5r000701mohr91w4y6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 13:28:11.343	\N	\N
cmr0oom98000901mozxhmco5b	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 13:29:52.556	\N	\N
cmr0ov0de000b01mog4iu1svk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 13:34:50.786	\N	\N
cmr0ov0sp000c01moimzjjp7p	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 13:34:51.337	\N	\N
cmr0owolw000d01moidk1kh1x	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 13:36:08.853	\N	\N
cmr0owq2r000e01mon40t2ltv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 13:36:10.755	\N	\N
cmr0oz6w6000f01mojfke1oux	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 13:38:05.862	\N	\N
cmr0oz7dw000g01moam27zz92	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 13:38:06.5	\N	\N
cmr0oz8ku000h01mo1j9o3ei7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 13:38:08.046	\N	\N
cmr0p1fi6000i01momcktwqmu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 13:39:50.334	\N	\N
cmr0p1gfp000j01mosu0a04l7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 13:39:51.542	\N	\N
cmr0p1krn000k01modq8fh8ei	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 13:39:57.155	\N	\N
cmr0p2k5x000l01mooncnvkh4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 13:40:43.029	\N	\N
cmr0p2khc000m01mo33783byw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 13:40:43.44	\N	\N
cmr0p2kza000n01mojeznfuev	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 13:40:44.086	\N	\N
cmr0p327j000p01mov0k62k1f	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 13:41:06.415	\N	\N
cmr0p32st000r01moxdv6s7dx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 13:41:07.181	\N	\N
cmr0p40na000s01momvdkrjhx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 13:41:51.046	\N	\N
cmr0p4zo5000u01moz6umkvyg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 2}	2026-06-30 13:42:36.437	\N	\N
cmr0p50x9000x01monwl0jwk0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 13:42:38.061	\N	\N
cmr0p527y000y01mobd9pkcuy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr0p320f000o01mow3o5nt0c	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 13:42:39.742	\N	\N
cmr0p53j9001001mo9uv4wl0e	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr0p320f000o01mow3o5nt0c	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 13:42:41.445	\N	\N
cmr0pffu1001201moj7b93a6d	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 13:50:43.946	\N	\N
cmr0pi5py001r01mo9tsgp1ti	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 13:52:50.806	\N	\N
cmr0pi5yt001s01mof6kwo1mi	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 13:52:51.125	\N	\N
cmr0pomoj002301mo9yvunr1w	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	PATIENT_DELETED	Patient	cmr0pocpb002101mohx5sji8m	cmr0pocpb002101mohx5sji8m	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 13:57:52.723	\N	\N
cmr0s0wmt000501o4q0teau4j	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:03:24.725	\N	\N
cmr0s0x20000601o4vkqjoy7o	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:03:25.272	\N	\N
cmr0s17s9000701o49y8eis7x	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:03:39.177	\N	\N
cmr0s5uw2000801o4f34o4x19	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:07:15.746	\N	\N
cmr0s62fa000a01o47eu2xf92	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:07:25.51	\N	\N
cmr0s6f9a000c01o4mxxkvj8j	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:07:42.142	\N	\N
cmr0s6g0v000e01o4b7se46sd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:07:43.135	\N	\N
cmr0s6wqi000f01o4m02xca2l	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 2}	2026-06-30 15:08:04.794	\N	\N
cmr0s6yh2000i01o4qwguwidn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:08:07.046	\N	\N
cmr0srqgo000j01o4dlylfedf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:24:16.44	\N	\N
cmr0ssuh0000l01o453onzq2m	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 3}	2026-06-30 15:25:08.292	\N	\N
cmr0ssww5000o01o46m5t8w9m	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:25:11.429	\N	\N
cmr0stxv5000p01o40gr94qct	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 4}	2026-06-30 15:25:59.345	\N	\N
cmr0stz2e000s01o44604olcd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:26:00.902	\N	\N
cmr0su28m000t01o4z25vvi31	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr0s6f06000b01o4rt5l6pvl	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 15:26:05.014	\N	\N
cmr0su48d000v01o4mwzforkc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr0s6f06000b01o4rt5l6pvl	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 15:26:07.597	\N	\N
cmr0sve3e000x01o46lvysjx5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:27:07.034	\N	\N
cmr0sve4c000y01o44wud5q1v	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr0s6f06000b01o4rt5l6pvl	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 15:27:07.068	\N	\N
cmr0svfn1001001o4n8sim5nq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:27:09.037	\N	\N
cmr0svy2p001101o4m9l33rlr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:27:32.929	\N	\N
cmr0syshi001301o4xepr1367	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:29:45.654	\N	\N
cmr0syzcy001601o42xk23n0t	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:29:54.562	\N	\N
cmr0sz0c6001701o4bdesrn5p	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:29:55.83	\N	\N
cmr0sz5u7001801o4i6502koh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:30:02.959	\N	\N
cmr0szyuk001b01o4bktmtqs2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:30:40.556	\N	\N
cmr0t00ub001c01o44b9fdjd1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:30:43.139	\N	\N
cmr0t06wo001d01o4nkq06e65	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:30:51	\N	\N
cmr0t0co9001f01o4cj04twwt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:30:58.473	\N	\N
cmr0t2dfu001g01o47dayvcmr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:32:32.778	\N	\N
cmr0t36as001i01o4t1z00n7z	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmr0t35p7001h01o44wa24tb0	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 15:33:10.18	\N	\N
cmr0t379s001j01o4ksla1wfx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmr0t35p7001h01o44wa24tb0	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 15:33:11.44	\N	\N
cmr0t3hu4001k01o4unuu3dug	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:33:25.132	\N	\N
cmr0t5mhw001l01o4q8dy0pcm	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:35:04.484	\N	\N
cmr0t5po3001m01o4x5w2aa9a	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:35:08.595	\N	\N
cmr0t5siw001n01o43fcfuavo	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmr0t35p7001h01o44wa24tb0	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 15:35:12.296	\N	\N
cmr0t5tfn001o01o4tdn1bdb7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmr0t35p7001h01o44wa24tb0	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 15:35:13.475	\N	\N
cmr0t63mk001p01o4xi4r4v1s	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:35:26.684	\N	\N
cmr0t64mz001q01o417e7m19o	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 15:35:27.995	\N	\N
cmr0t65em001r01o413wnyfum	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-06-30 15:35:28.99	\N	\N
cmr0tiik3001s01o4k0c984f4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-06-30 15:45:05.907	\N	\N
cmr1mnier000101s3aab4prcd	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 05:20:47.859	\N	\N
cmr1mniqu000201s3gl0iv3e5	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 05:20:48.295	\N	\N
cmr1mqjca000301s3xjslovgl	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 05:23:09.034	\N	\N
cmr1mrlh1000401s39b6qvyn7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqmyi26d000201ph2der0i4y	cmqlt50p2000801qgnzs5ydvv	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 05:23:58.453	\N	\N
cmr1mrln5000501s39sea2urq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqmyi26d000201ph2der0i4y	cmqlt50p2000801qgnzs5ydvv	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 05:23:58.673	\N	\N
cmr1mrsrn000601s3tpxvabj7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmqmyi26d000201ph2der0i4y	cmqlt50p2000801qgnzs5ydvv	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 05:24:07.907	\N	\N
cmr1mrt0c000701s3vxfe76r9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqmyi26d000201ph2der0i4y	cmqlt50p2000801qgnzs5ydvv	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 05:24:08.22	\N	\N
cmr1mrt5a000801s3cur1b04m	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmqmyi26d000201ph2der0i4y	cmqlt50p2000801qgnzs5ydvv	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 05:24:08.398	\N	\N
cmr1ms20o000901s3wccyzdlk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Encounter	\N	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 0}	2026-07-01 05:24:19.896	\N	\N
cmr1msbak000b01s3tdn49amy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Encounter	\N	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 0}	2026-07-01 05:24:31.916	\N	\N
cmr1msxyx000d01s3yk46oz0n	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 05:25:01.305	\N	\N
cmr1msy7k000e01s3b7tibhyj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 05:25:01.616	\N	\N
cmr1mt563000f01s3m107lg8z	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmr0t35p7001h01o44wa24tb0	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-01 05:25:10.635	\N	\N
cmr1mtbsd000g01s3g98gcxqk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 05:25:19.213	\N	\N
cmr1n0vyu000h01s3duux029s	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_enc_maria_001	demo_pr_maria_001	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 05:31:11.958	\N	\N
cmr1n0wlg000i01s3ppa7gk0s	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_enc_maria_001	demo_pr_maria_001	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 05:31:12.772	\N	\N
cmr1n2s4w000j01s3iwltkly0	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	AI_PHI_DISCLOSURE	Encounter	\N	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": true, "hasAnamnesis": true, "diagnosesCount": 0}	2026-07-01 05:32:40.304	\N	\N
cmr1n4moy000l01s3gwtucyun	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	AI_PHI_DISCLOSURE	Encounter	\N	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": true, "hasAnamnesis": true, "diagnosesCount": 0}	2026-07-01 05:34:06.562	\N	\N
cmr1n56nz000n01s3woltj9zw	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 3}	2026-07-01 05:34:32.447	\N	\N
cmr1n56o0000o01s31s6e5pc0	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "hasAge": false, "purpose": "dose-suggestion", "provider": "anthropic", "hasWeight": false, "hasCondition": false}	2026-07-01 05:34:32.448	\N	\N
cmr1nxek3000001qe3htpdb2t	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_enc_maria_001	demo_pr_maria_001	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 05:56:29.044	\N	\N
cmr1nxf5b000101qei2na2cvz	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_enc_maria_001	demo_pr_maria_001	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 05:56:29.807	\N	\N
cmr1ny1z3000201qegcl0b2qs	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_enc_maria_001	demo_pr_maria_001	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 05:56:59.391	\N	\N
cmr1ny297000301qejg025579	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_enc_maria_001	demo_pr_maria_001	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 05:56:59.755	\N	\N
cmr1nyey5000401qeelxurrav	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	AI_PHI_DISCLOSURE	Encounter	\N	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": true, "hasAnamnesis": true, "diagnosesCount": 0}	2026-07-01 05:57:16.205	\N	\N
cmr1nyt1p000701qe8wgdjw6c	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 2}	2026-07-01 05:57:34.477	\N	\N
cmr1nyt1m000601qet9dfvkne	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 2}	2026-07-01 05:57:34.474	\N	\N
cmr1nzayy000a01qet2hzxjpq	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	AI_PHI_DISCLOSURE	Encounter	\N	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": true, "hasAnamnesis": true, "diagnosesCount": 0}	2026-07-01 05:57:57.706	\N	\N
cmr1ovpvi000c01qeg7iv4k1x	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_enc_maria_001	demo_pr_maria_001	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 06:23:10.014	\N	\N
cmr1ovq99000d01qeo843ovlk	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_enc_maria_001	demo_pr_maria_001	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 06:23:10.509	\N	\N
cmr1ovsyk000e01qex9u6mgko	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_enc_maria_past	demo_pr_maria_001	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 06:23:14.012	\N	\N
cmr1ovt7o000f01qebunmiyna	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_enc_maria_past	demo_pr_maria_001	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 06:23:14.34	\N	\N
cmr1ovv6d000g01qe3afsqmmt	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_enc_pedro_chronic	demo_pr_pedro_001	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 06:23:16.885	\N	\N
cmr1ovvde000h01qecqj2fcbs	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_enc_pedro_chronic	demo_pr_pedro_001	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 06:23:17.138	\N	\N
cmr21fwf7000i01qegvtjve3x	cmqmgxvs6000101oau4ntxdtv	cmqmgxvrx000001oa0fupphfw	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_e_d1	demo_pr_d1	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 12:14:47.011	\N	\N
cmr21fyvu000j01qex182tt5g	cmqmgxvs6000101oau4ntxdtv	cmqmgxvrx000001oa0fupphfw	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_e_d2	demo_pr_d2	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 12:14:50.202	\N	\N
cmr21nt2p000k01qeusorydd8	cmqmgxvs6000101oau4ntxdtv	cmqmgxvrx000001oa0fupphfw	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_e_d1	demo_pr_d1	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 12:20:55.921	\N	\N
cmr21ntgo000l01qeew6otev9	cmqmgxvs6000101oau4ntxdtv	cmqmgxvrx000001oa0fupphfw	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_e_d1	demo_pr_d1	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 12:20:56.425	\N	\N
cmr21nv16000m01qel55j1h07	cmqmgxvs6000101oau4ntxdtv	cmqmgxvrx000001oa0fupphfw	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_e_d1	demo_pr_d1	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 12:20:58.458	\N	\N
cmr21nvcu000n01qelxnag6lx	cmqmgxvs6000101oau4ntxdtv	cmqmgxvrx000001oa0fupphfw	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_e_d1	demo_pr_d1	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 12:20:58.878	\N	\N
cmr21nx0t000o01qev5gpnle7	cmqmgxvs6000101oau4ntxdtv	cmqmgxvrx000001oa0fupphfw	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_e_d2	demo_pr_d2	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 12:21:01.037	\N	\N
cmr21nx7m000p01qer0sak2j1	cmqmgxvs6000101oau4ntxdtv	cmqmgxvrx000001oa0fupphfw	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_e_d2	demo_pr_d2	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 12:21:01.285	\N	\N
cmr22xsr7000q01qe8xblph4j	cmqmgxvs6000101oau4ntxdtv	cmqmgxvrx000001oa0fupphfw	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_e_d1	demo_pr_d1	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 12:56:41.683	\N	\N
cmr22xtg1000r01qee5vuuniz	cmqmgxvs6000101oau4ntxdtv	cmqmgxvrx000001oa0fupphfw	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_e_d1	demo_pr_d1	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 12:56:42.577	\N	\N
cmr22xvo1000s01qeprvaymos	cmqmgxvs6000101oau4ntxdtv	cmqmgxvrx000001oa0fupphfw	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_e_d1	demo_pr_d1	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 12:56:45.457	\N	\N
cmr22xw51000t01qezrmfdqt3	cmqmgxvs6000101oau4ntxdtv	cmqmgxvrx000001oa0fupphfw	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_e_d1	demo_pr_d1	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 12:56:46.069	\N	\N
cmr22xxx2000u01qenf9vgcse	cmqmgxvs6000101oau4ntxdtv	cmqmgxvrx000001oa0fupphfw	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_e_d1	demo_pr_d1	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 12:56:48.374	\N	\N
cmr22xyfp000v01qeenj8ni99	cmqmgxvs6000101oau4ntxdtv	cmqmgxvrx000001oa0fupphfw	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_e_d1	demo_pr_d1	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 12:56:49.045	\N	\N
cmr22y09j000w01qefoen2nge	cmqmgxvs6000101oau4ntxdtv	cmqmgxvrx000001oa0fupphfw	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_e_d2	demo_pr_d2	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 12:56:51.415	\N	\N
cmr22y0xh000x01qekqubxrnu	cmqmgxvs6000101oau4ntxdtv	cmqmgxvrx000001oa0fupphfw	DOCTOR	VIEW_ENCOUNTER	Encounter	demo_e_d2	demo_pr_d2	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 12:56:52.277	\N	\N
cmr28216n000y01qenerjmtm3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 15:19:57.311	\N	\N
cmr2821nz000z01qeoohuypk0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 15:19:57.936	\N	\N
cmr282jhz001001qeaz3071ng	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 15:20:21.047	\N	\N
cmr2831js001101qeyg1xwlnl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	SupportBot	\N	\N	ALLOWED	\N	190.120.255.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	SUPPORT_BOT	{"toolsCalled": ["getBillingStatus"], "messageCount": 2}	2026-07-01 15:20:44.44	\N	\N
cmr286e8e001301qefx3j828u	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 15:23:20.846	\N	\N
cmr286zcn001401qejougvhu5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 15:23:48.216	\N	\N
cmr286zus001501qex7fya31p	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 15:23:48.868	\N	\N
cmr287055001601qenxwsdijh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 15:23:49.241	\N	\N
cmr287ebr001701qetxzlh55x	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 15:24:07.623	\N	\N
cmr287f8u001801qegit6fn7h	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 15:24:08.814	\N	\N
cmr288guy001901qekzzit31f	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 15:24:57.562	\N	\N
cmr288qi5001a01qeuv9b7t8h	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 15:25:10.061	\N	\N
cmr288s64001b01qevkm7dc2y	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 15:25:12.22	\N	\N
cmr288w79001c01qe25hg1wis	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 15:25:17.445	\N	\N
cmr289264001d01qeizsiatx8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Encounter	\N	\N	ALLOWED	\N	190.120.255.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	API	{"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 4}	2026-07-01 15:25:25.18	\N	\N
cmr289upm001f01qe725g4d8t	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Encounter	\N	\N	ALLOWED	\N	190.120.255.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	API	{"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 4}	2026-07-01 15:26:02.17	\N	\N
cmr28a4iv001h01qes8zcu3bn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 15:26:14.887	\N	\N
cmr28ba40001i01qe0b5khuo9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 15:27:08.784	\N	\N
cmr28dkw8001j01qezb4xjv3s	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 15:28:56.072	\N	\N
cmr28g1ez001k01qeq8yhqj8r	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 15:30:50.795	\N	\N
cmr28n2wh001l01qenyon1zca	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 15:36:19.313	\N	\N
cmr28p15o001m01qesi239kkm	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 15:37:50.364	\N	\N
cmr28qyw0001n01qe7dwb7g1r	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 15:39:20.736	\N	\N
cmr28qz3o001o01qes49x6odj	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 15:39:21.012	\N	\N
cmr2bkfzx001p01qeu9hgw89r	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 16:58:15.165	\N	\N
cmr2pyk55001q01qe3k2rtmop	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 23:41:08.345	\N	\N
cmr2pykmh001r01qect4h1qj2	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 23:41:08.969	\N	\N
cmr2pz333001s01qefpdpwlji	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 23:41:32.895	\N	\N
cmr2q6bgi001t01qe0d261b2k	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 23:47:10.338	\N	\N
cmr2qlide000001mw54e11j6k	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 23:58:59.14	\N	\N
cmr2qlkji000101mwgz70v7mc	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 23:59:01.95	\N	\N
cmr2qllso000201mwtrgwzzyn	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-01 23:59:03.576	\N	\N
cmr2qwjhb000301mwkdkpl78o	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 00:07:33.791	\N	\N
cmr2r6csk000401mw8lzfo83q	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 00:15:11.684	\N	\N
cmr2rqvq5000001mvgto7t72h	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 00:31:09.341	\N	\N
cmr2rqwck000101mv1mw4zzkn	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 00:31:10.148	\N	\N
cmr2rqxqz000201mv9gb2rs93	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 00:31:11.964	\N	\N
cmr3l4gdr000601mv6p9e206g	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3l4g3c000501mvsaxou3mo	cmr3l49nd000401mvldhcp7mt	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:13:31.503	\N	\N
cmr3l4h1k000701mvbgqgs2kf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3l4g3c000501mvsaxou3mo	cmr3l49nd000401mvldhcp7mt	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:13:32.36	\N	\N
cmr3lh267000801mvyxvkl1h0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3l4g3c000501mvsaxou3mo	cmr3l49nd000401mvldhcp7mt	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:23:19.615	\N	\N
cmr3lpa5p000a01mve2hj8b0j	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3l4g3c000501mvsaxou3mo	cmr3l49nd000401mvldhcp7mt	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:29:43.213	\N	\N
cmr3lpvs3000c01mv7xa2ccja	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3l4g3c000501mvsaxou3mo	cmr3l49nd000401mvldhcp7mt	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:30:11.235	\N	\N
cmr3lpwg4000e01mvtuc9748u	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3l4g3c000501mvsaxou3mo	cmr3l49nd000401mvldhcp7mt	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:30:12.1	\N	\N
cmr3ltaer000g01mv7vp90kl9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3l4g3c000501mvsaxou3mo	cmr3l49nd000401mvldhcp7mt	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:32:50.163	\N	\N
cmr3ltaol000h01mvdlsakelq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3l4g3c000501mvsaxou3mo	cmr3l49nd000401mvldhcp7mt	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:32:50.517	\N	\N
cmr3ltbqd000i01mv72rhl411	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr3l4g3c000501mvsaxou3mo	cmr3l49nd000401mvldhcp7mt	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 14:32:51.877	\N	\N
cmr3ltdjh000j01mvto8daijk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr3l4g3c000501mvsaxou3mo	cmr3l49nd000401mvldhcp7mt	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 14:32:54.222	\N	\N
cmr3ludpa000k01mvz0l2pdwb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3l4g3c000501mvsaxou3mo	cmr3l49nd000401mvldhcp7mt	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:33:41.086	\N	\N
cmr3lug68000l01mv6tb8lwo1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr3lpvft000b01mve92qn76m	cmr3l49nd000401mvldhcp7mt	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 14:33:44.292	\N	\N
cmr3luh51000n01mvyzffkuf4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr3lpvft000b01mve92qn76m	cmr3l49nd000401mvldhcp7mt	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 14:33:45.541	\N	\N
cmr3luxtz000p01mvc09qr30n	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3l4g3c000501mvsaxou3mo	cmr3l49nd000401mvldhcp7mt	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:34:07.175	\N	\N
cmr3lvmjh000q01mvf5ouinil	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmr3l4g3c000501mvsaxou3mo	cmr3l49nd000401mvldhcp7mt	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:34:39.197	\N	\N
cmr3lvmwb000r01mv3daa1zws	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3l4g3c000501mvsaxou3mo	cmr3l49nd000401mvldhcp7mt	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:34:39.659	\N	\N
cmr3lvnat000s01mvljdxgpc7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3l4g3c000501mvsaxou3mo	cmr3l49nd000401mvldhcp7mt	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:34:40.181	\N	\N
cmr3lvuyc000v01mvz0reu8zm	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3l4g3c000501mvsaxou3mo	cmr3l49nd000401mvldhcp7mt	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:34:50.1	\N	\N
cmr3lvwpy000w01mvxug336kh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmr3lvupt000t01mv8aopd20a	cmr3l49nd000401mvldhcp7mt	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 14:34:52.39	\N	\N
cmr3lvxkc000x01mvkw2rx7d8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmr3lvupt000t01mv8aopd20a	cmr3l49nd000401mvldhcp7mt	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 14:34:53.484	\N	\N
cmr3mbilv001101mv5yt8zq2i	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbid3001001mvn312s0oa	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:47:00.595	\N	\N
cmr3mbj1t001301mvmxrxwult	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:47:01.17	\N	\N
cmr3mbjmo001401mv811nxlm0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:47:01.92	\N	\N
cmr3mntx9001501mvzhw72kyo	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:56:35.133	\N	\N
cmr3mpd6g001701mvpfgwqpc9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:57:46.744	\N	\N
cmr3mpxr9001901mvp39dyvej	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:58:13.413	\N	\N
cmr3mpy7p001b01mv4l8iw6io	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:58:14.005	\N	\N
cmr3mqgrh001c01mvqpncnjim	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 2}	2026-07-02 14:58:38.045	\N	\N
cmr3mqie9001f01mvddjcqf3f	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 14:58:40.161	\N	\N
cmr3mt41n001h01mvuqlv7xwh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:00:41.531	\N	\N
cmr3mt7g3001i01mvuty0dpmq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_LAB_ORDER	LabOrder	cmr3mt3rm001g01mv62y9chdr	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 15:00:45.939	\N	\N
cmr3mt8iy001j01mv0lzsi7az	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_LAB_ORDER	LabOrder	cmr3mt3rm001g01mv62y9chdr	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 15:00:47.338	\N	\N
cmr3mtakz001k01mvyyrdmnaw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:00:50.003	\N	\N
cmr3mtl39001m01mv4jboqn7x	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:01:03.621	\N	\N
cmr3murb0001n01mvq9ieebo9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 3}	2026-07-02 15:01:58.332	\N	\N
cmr3musiy001q01mvmfvazdwk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:01:59.914	\N	\N
cmr3mv5i2001s01mvrsskmnzr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:02:16.73	\N	\N
cmr3mv63y001t01mvcky4dinn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:02:17.518	\N	\N
cmr3mv8s0001u01mv6pk4shmp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 15:02:20.976	\N	\N
cmr3mv9uc001v01mvba00bunw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 15:02:22.356	\N	\N
cmr3mw5p8001w01mvgewevd7p	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:03:03.644	\N	\N
cmr3mw795001x01mvn6o0w8da	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr3mpxja001801mvazw4avfh	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 15:03:05.657	\N	\N
cmr3mw89x001z01mvlhfjqjii	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr3mpxja001801mvazw4avfh	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 15:03:06.982	\N	\N
cmr3mwjty002101mv6r47nw94	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:03:21.958	\N	\N
cmr3mwlu5002201mvjof6v55s	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_LAB_ORDER	LabOrder	cmr3mtk33001l01mv8i0g9do7	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 15:03:24.557	\N	\N
cmr3mwmfc002301mvwenwhzw7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_LAB_ORDER	LabOrder	cmr3mtk33001l01mv8i0g9do7	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 15:03:25.32	\N	\N
cmr3mwxbn002401mvl6w1c7jc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:03:39.443	\N	\N
cmr3mwyc9002501mvkuswclgd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_LAB_ORDER	LabOrder	cmr3mt3rm001g01mv62y9chdr	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 15:03:40.761	\N	\N
cmr3mwz4r002601mvgod53iut	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_LAB_ORDER	LabOrder	cmr3mt3rm001g01mv62y9chdr	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 15:03:41.787	\N	\N
cmr3mz6wo002701mvztcaevb6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:05:25.176	\N	\N
cmr3mz78u002801mvkuokhr75	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:05:25.614	\N	\N
cmr3mz7ll002901mvw87giwqh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:05:26.073	\N	\N
cmr3mz7vo002a01mvq5u2at17	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:05:26.436	\N	\N
cmr3mzsq3002c01mvq2ut4e08	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:05:53.451	\N	\N
cmr3n18x4002e01mvap826qfw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:07:01.096	\N	\N
cmr3n19cq002f01mvej5lx5x6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:07:01.658	\N	\N
cmr3n1gf3002g01mvbz74oizx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:07:10.815	\N	\N
cmr3n1h32002h01mvo1ybawy4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:07:11.678	\N	\N
cmr3n1hly002i01mvz90ji7mh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:07:12.358	\N	\N
cmr3n1yq2002k01mvvgpp7ve5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:07:34.538	\N	\N
cmr3n1z2n002l01mvxec7raff	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:07:34.991	\N	\N
cmr3n20s1002m01mv930jg270	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 15:07:37.201	\N	\N
cmr3n2279002n01mvfhrg1igb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 15:07:39.045	\N	\N
cmr3n2323002o01mvpkxalkrn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:07:40.155	\N	\N
cmr3n2e17002p01mvmjafmpn7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:07:54.379	\N	\N
cmr3n8k06002q01mv5x5n9uzw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:12:42.054	\N	\N
cmr3o2wob002u01mv0fi3wp5h	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3o2wjj002t01mvnvh8ul2p	cmr3o2o4b002s01mvksm30bdc	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:36:18.155	\N	\N
cmr3o2x0e002v01mvlzp0b93f	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3o2wjj002t01mvnvh8ul2p	cmr3o2o4b002s01mvksm30bdc	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:36:18.59	\N	\N
cmr3ob720002x01mvj7v1ywcc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3o2wjj002t01mvnvh8ul2p	cmr3o2o4b002s01mvksm30bdc	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:42:44.856	\N	\N
cmr3ob7in002z01mv4ooitxh3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3o2wjj002t01mvnvh8ul2p	cmr3o2o4b002s01mvksm30bdc	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:42:45.455	\N	\N
cmr3oczhw003201mvqsagyohb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3o2wjj002t01mvnvh8ul2p	cmr3o2o4b002s01mvksm30bdc	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:44:08.372	\N	\N
cmr3odkdi003401mv7mwnzeh1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3o2wjj002t01mvnvh8ul2p	cmr3o2o4b002s01mvksm30bdc	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:44:35.43	\N	\N
cmr3odl35003501mvf6op5mjd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3o2wjj002t01mvnvh8ul2p	cmr3o2o4b002s01mvksm30bdc	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:44:36.353	\N	\N
cmr3odmuk003601mvw1rwn46y	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr3o2wjj002t01mvnvh8ul2p	cmr3o2o4b002s01mvksm30bdc	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 15:44:38.636	\N	\N
cmr3odnyr003701mvqdggbbm1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr3o2wjj002t01mvnvh8ul2p	cmr3o2o4b002s01mvksm30bdc	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 15:44:40.084	\N	\N
cmr3of53x003801mvyj17kwxf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3o2wjj002t01mvnvh8ul2p	cmr3o2o4b002s01mvksm30bdc	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:45:48.957	\N	\N
cmr3of87x003901mv3xy21vng	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr3ob6qc002w01mv0x5syiqa	cmr3o2o4b002s01mvksm30bdc	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 15:45:52.989	\N	\N
cmr3ofi69003b01mvkxw28bxr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3o2wjj002t01mvnvh8ul2p	cmr3o2o4b002s01mvksm30bdc	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 15:46:05.889	\N	\N
cmr3ofjyu003c01mvhfn0vu9a	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmr3ocz67003001mvn1opvs9k	cmr3o2o4b002s01mvksm30bdc	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 15:46:08.214	\N	\N
cmr3ofykd003d01mv1itaid4o	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr3ob6qc002w01mv0x5syiqa	cmr3o2o4b002s01mvksm30bdc	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 15:46:27.133	\N	\N
cmr3ofypu003f01mvmps6q1bj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmr3ocz67003001mvn1opvs9k	cmr3o2o4b002s01mvksm30bdc	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-02 15:46:27.33	\N	\N
cmr3r1tus000001nqy6zo6ii7	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 16:59:26.692	\N	\N
cmr3r1u14000101nq5spowd2x	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 16:59:26.92	\N	\N
cmr3r20wm000201nq5qkp6lzr	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	ENCOUNTER_DELETED	Encounter	cmr1mni7p000001s3s60s7doc	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-02 16:59:35.83	\N	\N
cmr47bzko000001tctsrof2yd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 00:35:14.52	\N	\N
cmr47c012000101tcxrn7rk1c	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 00:35:15.11	\N	\N
cmr47dsx7000301tcf395xysx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmr47dsbb000201tci7wozcy6	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-03 00:36:39.211	\N	\N
cmr47du2v000401tc6uuq7pg4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 00:36:40.711	\N	\N
cmr47dyiw000601tci853xna9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 00:36:46.472	\N	\N
cmr47dyt3000701tcy18raupr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 00:36:46.839	\N	\N
cmr47e57f000801tcgbavsoxc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 00:36:55.131	\N	\N
cmr47e76k000901tcfh5s8cio	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 00:36:57.692	\N	\N
cmr4hepei000101o4x3fx78zi	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 05:17:17.466	\N	\N
cmr4hepzc000201o46j2wodgu	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 05:17:18.216	\N	\N
cmr4hl7tp000101qokpuvrxok	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 05:22:21.277	\N	\N
cmr4hme8t000301qorx8np7w6	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 05:23:16.253	\N	\N
cmr4hn16d000501qoisayirk8	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 05:23:45.973	\N	\N
cmr4hn1hh000701qoadhbyah3	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 05:23:46.373	\N	\N
cmr4hn86j000801qozinjrqov	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr4hn0zq000401qos4ha9blr	cmr0pml9d002001moekmrt320	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-03 05:23:55.051	\N	\N
cmr4hnlo0000a01qo14kezvny	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 05:24:12.528	\N	\N
cmr4hoz0k000c01qo21ihvg5o	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmr4hoymi000b01qoat61b1z0	cmr0pml9d002001moekmrt320	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-03 05:25:16.484	\N	\N
cmr4hp6ih000d01qo5fpfkus2	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 05:25:26.201	\N	\N
cmr4hpek9000e01qo8hgwwerv	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	AI_PHI_DISCLOSURE	Encounter	\N	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": true, "hasAnamnesis": true, "diagnosesCount": 2}	2026-07-03 05:25:36.633	\N	\N
cmr4hpxi3000g01qo1t1cywgi	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	AI_PHI_DISCLOSURE	Encounter	\N	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": true, "hasAnamnesis": true, "diagnosesCount": 2}	2026-07-03 05:26:01.179	\N	\N
cmr4hrltu000j01qo111xmovp	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 05:27:19.362	\N	\N
cmr4hrlxj000k01qohdw20tw3	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 05:27:19.495	\N	\N
cmr4hrmb6000l01qodhbhpqoj	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 05:27:19.986	\N	\N
cmr4hrqlt000m01qo01g2kmcn	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-03 05:27:25.553	\N	\N
cmr4hsbgp000n01qohhlq4pom	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 05:27:52.586	\N	\N
cmr4hsc6o000o01qoj3m0xl37	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 05:27:53.52	\N	\N
cmr4hscdz000p01qowrpxecps	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 05:27:53.783	\N	\N
cmr4hsckf000q01qosfc4csoo	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 05:27:54.015	\N	\N
cmr4hsi68000r01qowkd7ooow	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	AI_PHI_DISCLOSURE	Encounter	\N	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": true, "hasAnamnesis": true, "diagnosesCount": 2}	2026-07-03 05:28:01.28	\N	\N
cmr4hswo7000u01qo473buwfr	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 05:28:20.071	\N	\N
cmr4hswzc000v01qo6rkec4it	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 05:28:20.472	\N	\N
cmr4ht1dp000w01qobjx0ctrb	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 05:28:26.173	\N	\N
cmr4htvud000x01qo6w05dhfi	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-03 05:29:05.653	\N	\N
cmr7xyviw000001mpbzxskpjv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-05 15:24:10.905	\N	\N
cmr7xyw5u000101mpf5olz2ac	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-05 15:24:11.73	\N	\N
cmr7xz479000201mp3g4qqfyq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr3mpxja001801mvazw4avfh	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	190.153.10.0	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	PDF	\N	2026-07-05 15:24:22.149	\N	\N
cmr7xzllr000401mpkzpl761b	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-05 15:24:44.703	\N	\N
cmr7xzo8u000501mp2ubad0gt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_LAB_ORDER	LabOrder	cmr3mtk33001l01mv8i0g9do7	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	190.153.10.0	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	PDF	\N	2026-07-05 15:24:48.126	\N	\N
cmr7xzrcy000601mpe5dob5mz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-05 15:24:52.162	\N	\N
cmr7xzsgb000701mp1o4qvf6i	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_LAB_ORDER	LabOrder	cmr3mt3rm001g01mv62y9chdr	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	190.153.10.0	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	PDF	\N	2026-07-05 15:24:53.579	\N	\N
cmr7xzwpb000801mpuigj7oz3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-05 15:24:59.087	\N	\N
cmr7y0nfy000901mpd0r0lzvf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-05 15:25:33.742	\N	\N
cmr7y0npj000a01mp7k6ailgs	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-05 15:25:34.087	\N	\N
cmr7y0nxa000b01mpdc4c9b65	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-05 15:25:34.366	\N	\N
cmr7y17yr000c01mptft2iwfj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-05 15:26:00.339	\N	\N
cmr7y9n66000d01mpcem4k23g	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-05 15:32:33.294	\N	\N
cmr7ygk0r000h01mp4owwizn1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr7ygjy9000g01mpw0hcawcx	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-05 15:37:55.803	\N	\N
cmr7ygkb0000i01mpl0z1zsht	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr7ygjy9000g01mpw0hcawcx	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-05 15:37:56.172	\N	\N
cmr7yhnrz000k01mpy6cxol5q	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr7ygjy9000g01mpw0hcawcx	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-05 15:38:47.327	\N	\N
cmr7yigk5000m01mpz7n99low	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr7ygjy9000g01mpw0hcawcx	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-05 15:39:24.63	\N	\N
cmr7yih41000o01mpbz2su79e	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr7ygjy9000g01mpw0hcawcx	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-05 15:39:25.345	\N	\N
cmr7yjswb000q01mpgw0jl67r	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr7ygjy9000g01mpw0hcawcx	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-05 15:40:27.275	\N	\N
cmr7yk9yq000s01mpg65dtfoc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmr7yk8ed000r01mpkovj6tnw	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	190.153.10.0	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	PDF	\N	2026-07-05 15:40:49.394	\N	\N
cmr7yko7k000t01mp0wy9k8vt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr7ygjy9000g01mpw0hcawcx	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-05 15:41:07.856	\N	\N
cmr7yl92a000w01mpk84986d6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr7ygjy9000g01mpw0hcawcx	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-05 15:41:34.882	\N	\N
cmr7ylbkm000x01mphceqcink	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmr7yl8q7000u01mpw23elezy	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	190.153.10.0	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	PDF	\N	2026-07-05 15:41:38.134	\N	\N
cmr7ylkkc000y01mpyjjedaze	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr7ygjy9000g01mpw0hcawcx	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-05 15:41:49.788	\N	\N
cmr7youcb000z01mp9grhw6ae	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr7ygjy9000g01mpw0hcawcx	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-05 15:44:22.427	\N	\N
cmr9irh1x001001mp7lb0vtcr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 17:54:03.669	\N	\N
cmr9irhbp001101mpa2zicj04	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 17:54:04.021	\N	\N
cmr9irjl1001201mpr0qtjymc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 17:54:06.949	\N	\N
cmr9irjtz001301mped29o2tp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 17:54:07.271	\N	\N
cmr9irk2p001401mpgb70vcfn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 17:54:07.585	\N	\N
cmr9isq6x001501mp6txerenk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 17:55:02.169	\N	\N
cmr9itoh2001701mp0hyiqhbh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 17:55:46.598	\N	\N
cmr9itonu001801mpqabsgegg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 17:55:46.842	\N	\N
cmr9itqcf001901mpduk240fd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmr0t35p7001h01o44wa24tb0	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-06 17:55:49.023	\N	\N
cmr9itre7001a01mpmemxfp6i	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmr0t35p7001h01o44wa24tb0	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-06 17:55:50.383	\N	\N
cmr9iu9az001b01mpkaeydpnu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 17:56:13.595	\N	\N
cmr9ixxqe001f01mp5z5cf9op	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 17:59:05.222	\N	\N
cmr9ixxzp001g01mppuonvyof	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 17:59:05.557	\N	\N
cmr9j7vlh001h01mplfnisbrx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 18:06:49.013	\N	\N
cmr9k5d8a001i01mppjgfs764	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 18:32:51.514	\N	\N
cmr9l01p3001k01mpinunltki	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 18:56:42.903	\N	\N
cmr9l0k09001n01mpdq0kfjlu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 18:57:06.633	\N	\N
cmr9l0kjy001o01mp9jm46ykg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 18:57:07.342	\N	\N
cmr9l0nu3001p01mpvn8oxrp8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 18:57:11.595	\N	\N
cmr9l1e8t001r01mpno5f5jmz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 18:57:45.821	\N	\N
cmr9l1zxh001t01mphc2mplg7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 18:58:13.925	\N	\N
cmr9l2cfg001v01mpt7ij9izt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 18:58:30.124	\N	\N
cmr9l2cth001x01mpf29boycf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 18:58:30.629	\N	\N
cmr9l2t2c001y01mpl2503sbe	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 2}	2026-07-06 18:58:51.684	\N	\N
cmr9l2uh4002101mpttw3ztuw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 18:58:53.512	\N	\N
cmr9l8xb9002301mp35e0n8dc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 19:03:37.125	\N	\N
cmr9l9r1w002601mpm4yqud6s	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 19:04:15.668	\N	\N
cmr9l9w2j002801mpoat2s9ll	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 19:04:22.171	\N	\N
cmr9l9wbt002901mp7ds62xrg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 19:04:22.506	\N	\N
cmr9l9x8a002a01mpxkg3d3rh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 19:04:23.674	\N	\N
cmr9l9xh2002b01mp1mtg9htj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 19:04:23.99	\N	\N
cmr9l9y5e002c01mp7pwqpkau	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 19:04:24.866	\N	\N
cmr9l9zjt002e01mp47ib19bu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 19:04:26.681	\N	\N
cmr9l9zvi002f01mp43s4flap	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 19:04:27.102	\N	\N
cmr9la0t0002g01mpd7ue60mr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-06 19:04:28.308	\N	\N
cmr9la21g002h01mp5uw14up5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-06 19:04:29.908	\N	\N
cmr9lbiht002i01mpnuqdzlsl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-06 19:05:37.889	\N	\N
cmr9lbjun002j01mp424h48k4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 19:05:39.647	\N	\N
cmr9lbku3002k01mpff1iby04	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 19:05:40.923	\N	\N
cmr9ldj87002l01mp9d3s2w00	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 19:07:12.151	\N	\N
cmr9ldle8002m01mpr6ti42v3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr9l2c7c001u01mphrhu31m6	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-06 19:07:14.96	\N	\N
cmr9ldmt2002o01mpcqgz8zyu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr9l2c7c001u01mphrhu31m6	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-06 19:07:16.79	\N	\N
cmr9le8wh002q01mpqx0ckjle	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 19:07:45.426	\N	\N
cmr9leacb002r01mp0hle9wa9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_LAB_ORDER	LabOrder	cmr9l8x4g002201mpokpyryet	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-06 19:07:47.291	\N	\N
cmr9leb4x002s01mpzyf9mygy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_LAB_ORDER	LabOrder	cmr9l8x4g002201mpokpyryet	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-06 19:07:48.321	\N	\N
cmr9lf0ud002t01mpcqucmyzx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_LAB_ORDER	LabOrder	cmr9l8x4g002201mpokpyryet	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-06 19:08:21.637	\N	\N
cmr9lf0x2002u01mpwy1d3cza	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-06 19:08:21.734	\N	\N
cmr9lf27t002v01mpzir83d9b	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 19:08:23.417	\N	\N
cmr9lf2ug002w01mppnuzz4n1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr9l2c7c001u01mphrhu31m6	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-06 19:08:24.232	\N	\N
cmr9lf4oi002y01mpf4ic8um7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 19:08:26.61	\N	\N
cmr9lfnar002z01mpi59ug8gw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 19:08:50.74	\N	\N
cmr9lfonz003001mp52tywn9u	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmr9l9qum002401mp4kxb054m	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-06 19:08:52.511	\N	\N
cmr9lfpma003101mp4z7czswm	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmr9l9qum002401mp4kxb054m	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	PDF	\N	2026-07-06 19:08:53.746	\N	\N
cmr9ln1gj003201mpf4ab4pyh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 19:14:35.683	\N	\N
cmr9m0bl0003301mp4sruun0t	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmr9ixqs3001d01mp3x2cjps4	ALLOWED	\N	\N	\N	UI	\N	2026-07-06 19:24:55.332	\N	\N
cmr9xweg4000001n4dst5yvur	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	PASSWORD_CHANGED	Patient	cmr0pml99001z01mogxs7wdnf	cmr0pml99001z01mogxs7wdnf	ALLOWED	\N	\N	\N	UI	{"channel": "PORTAL_RESET"}	2026-07-07 00:57:47.812	\N	\N
cmrdoeaxf000301p8rkgdw128	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 15:42:51.603	\N	\N
cmrdoeclc000401p8pqxa4eq0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 15:42:53.76	\N	\N
cmrdpshfb000501p8n68anmw5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:21:52.823	\N	\N
cmrdptfa6000701p8wc2w4vwn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:22:36.702	\N	\N
cmrdptp47000901p8wdj1fszv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:22:49.447	\N	\N
cmrdptuyv000b01p8gnnuckyk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:22:57.031	\N	\N
cmrdpu91p000d01p8jhs16o8p	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:23:15.277	\N	\N
cmrdpu9gi000f01p8wdnxpqqu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:23:15.81	\N	\N
cmrdpun0z000g01p8d72b4frc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 2, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-09 16:23:33.395	\N	\N
cmrdpup2j000j01p8o6sosw4w	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:23:36.043	\N	\N
cmrdpvj3j000k01p8qg1d00g2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 3, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-09 16:24:14.959	\N	\N
cmrdpvkmi000n01p8rxif2crq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:24:16.938	\N	\N
cmrdpwaxx000o01p8b808p5m6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-09 16:24:51.045	\N	\N
cmrdpwcc6000r01p8coq686g1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:24:52.854	\N	\N
cmrdpwih6000s01p8lr7soabi	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:25:00.81	\N	\N
cmrdpwq5o000t01p8gcqayljq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:25:10.764	\N	\N
cmrdpwv9d000u01p8rgjehs3k	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:25:17.377	\N	\N
cmrdpwxit000v01p87w5gag5d	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:25:20.309	\N	\N
cmrdpx02y000w01p8hahqij9f	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:25:23.627	\N	\N
cmrdpx1uh000x01p8cpz53gl4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:25:25.913	\N	\N
cmrdpxiy6000y01p8uj05bt4t	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:25:48.078	\N	\N
cmrdpxq9z000z01p8dcirh0sj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:25:57.575	\N	\N
cmrdpy0vd001001p8suim89v9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:26:11.305	\N	\N
cmrdpy4vv001101p8k5r4w5a3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:26:16.507	\N	\N
cmrdpyb2j001201p8hoi1fbds	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:26:24.523	\N	\N
cmrdpyulu001301p8m344w9kv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:26:49.842	\N	\N
cmrdpzq5t001701p81xqr60ce	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:27:30.737	\N	\N
cmrdpzv7n001901p8eertrksm	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:27:37.283	\N	\N
cmrdpzvj0001a01p8lts9agsb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:27:37.692	\N	\N
cmrdpzx02001b01p8gi282uug	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-09 16:27:39.602	\N	\N
cmrdpzzal001c01p88kevrho4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-09 16:27:42.573	\N	\N
cmrdq01en001d01p89mwx1vk3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:27:45.311	\N	\N
cmrdq02e7001e01p87pfi6723	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmrdpu8ty000c01p89qevk5wg	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-09 16:27:46.591	\N	\N
cmrdq037q001g01p8pj5dsh3a	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:27:47.654	\N	\N
cmrdq03dy001h01p8gd2ikjmf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmrdpu8ty000c01p89qevk5wg	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-09 16:27:47.878	\N	\N
cmrdq049v001j01p8iliaqiqy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrdpzpx6001401p8ob7o4lf8	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-09 16:27:49.027	\N	\N
cmrdq04y1001k01p8cclgwz7i	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrdpzpx6001401p8ob7o4lf8	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-09 16:27:49.897	\N	\N
cmrdq1mjx001l01p82z39zr22	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-09 16:28:59.373	\N	\N
cmrdq1mxp001m01p887nad5n8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrdpzpx6001401p8ob7o4lf8	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-09 16:28:59.869	\N	\N
cmrdq1ojq001n01p8vmp45pzt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:29:01.958	\N	\N
cmrdq1pzk001o01p839ggy0ml	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 16:29:03.824	\N	\N
cmrdq1s71001p01p8pboaai34	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmrdpu8ty000c01p89qevk5wg	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-09 16:29:06.685	\N	\N
cmrdrdkkz001r01p8hmg6x2wo	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 17:06:16.307	\N	\N
cmrdrdky7001s01p8jadq8bc9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 17:06:16.783	\N	\N
cmrdre8cq001t01p8oqe4es8x	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 17:06:47.114	\N	\N
cmrdre8nm001u01p8qmmmp9bx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 17:06:47.506	\N	\N
cmrdre99u001v01p8swuvtbg1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 17:06:48.306	\N	\N
cmrdrf4kr001x01p83lz3w8xc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrdrf3xi001w01p8ywgskezf	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-09 17:07:28.875	\N	\N
cmrdrf5ma001y01p8yivs5eiz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrdrf3xi001w01p8ywgskezf	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-09 17:07:30.226	\N	\N
cmrdrfyo1001z01p8ax5bd6o4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 17:08:07.873	\N	\N
cmrdrh98c002101p88tz9zcir	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrdrf3xi001w01p8ywgskezf	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-09 17:09:08.22	\N	\N
cmrdrha2n002201p8l5zwia3h	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrdrf3xi001w01p8ywgskezf	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-09 17:09:09.311	\N	\N
cmrdril23002301p8kohlazqo	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 17:10:10.203	\N	\N
cmrdrk9u5002401p8jv21cu9d	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 17:11:28.973	\N	\N
cmrdrkmdi002501p8ngwhnw4s	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 17:11:45.222	\N	\N
cmrdrl7ey002601p8qoa6oztz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 17:12:12.49	\N	\N
cmrdrmdq6002701p8v1f69uu8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Encounter	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "encounter-assist", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 3, "fieldsSanitized": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-09 17:13:07.326	\N	\N
cmrdrmsmv002901p8vi39mj4e	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Encounter	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "encounter-assist", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 3, "fieldsSanitized": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-09 17:13:26.648	\N	\N
cmrdrofc9002c01p8wh1vtcfu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 17:14:42.729	\N	\N
cmrdrpff1002d01p8t4n7gabh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 5, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-09 17:15:29.486	\N	\N
cmrdrpgrb002g01p8a6plpr69	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 17:15:31.223	\N	\N
cmrdrpkno002h01p8r0u9hzl3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Encounter	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "encounter-assist", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 4, "fieldsSanitized": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-09 17:15:36.276	\N	\N
cmrdrppiv002j01p84saqmudi	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Encounter	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "encounter-assist", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 4, "fieldsSanitized": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-09 17:15:42.583	\N	\N
cmrdrpzc0002l01p85w9lnap6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Encounter	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "encounter-assist", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 4, "fieldsSanitized": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-09 17:15:55.296	\N	\N
cmrdrqgs1002n01p8t52o4g1g	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Encounter	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "encounter-assist", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 4, "fieldsSanitized": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-09 17:16:17.905	\N	\N
cmrdrrety002p01p88e91zh0q	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 17:17:02.038	\N	\N
cmrdrrhnl002q01p8nvisnwl3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	ALLOWED	\N	\N	\N	UI	\N	2026-07-09 17:17:05.697	\N	\N
cmrdrrtpy002r01p8zwxr7gg0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Encounter	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "encounter-assist", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 4, "fieldsSanitized": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-09 17:17:21.334	\N	\N
cmrdrs3ix002t01p8wxq0uqyp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Encounter	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "encounter-assist", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 4, "fieldsSanitized": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-09 17:17:34.041	\N	\N
cmrf1bok5002y01p8jvlkozj4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrf1bogs002x01p8ec22x1ti	cmrf1bjcq002w01p8eevosijc	ALLOWED	\N	\N	\N	UI	\N	2026-07-10 14:32:30.485	\N	\N
cmrf1boxp002z01p8k50tiih1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrf1bogs002x01p8ec22x1ti	cmrf1bjcq002w01p8eevosijc	ALLOWED	\N	\N	\N	UI	\N	2026-07-10 14:32:30.973	\N	\N
cmrf1bsw9003001p8kdwt3j80	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrf1bogs002x01p8ec22x1ti	cmrf1bjcq002w01p8eevosijc	ALLOWED	\N	\N	\N	UI	\N	2026-07-10 14:32:36.105	\N	\N
cmrf1chih003101p8pkthjhdx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrf1bogs002x01p8ec22x1ti	cmrf1bjcq002w01p8eevosijc	ALLOWED	\N	\N	\N	UI	\N	2026-07-10 14:33:08.009	\N	\N
cmrf1cp4r003301p8wx3ay52r	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrf1bogs002x01p8ec22x1ti	cmrf1bjcq002w01p8eevosijc	ALLOWED	\N	\N	\N	UI	\N	2026-07-10 14:33:17.883	\N	\N
cmrf1d7n6003401p85t8ojcyh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrf1bogs002x01p8ec22x1ti	cmrf1bjcq002w01p8eevosijc	ALLOWED	\N	\N	\N	UI	\N	2026-07-10 14:33:41.874	\N	\N
cmrf1dbpb003501p8a4buuy16	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrf1bogs002x01p8ec22x1ti	cmrf1bjcq002w01p8eevosijc	ALLOWED	\N	\N	\N	UI	\N	2026-07-10 14:33:47.135	\N	\N
cmrf1dun9003601p89hjucgpg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrf1bogs002x01p8ec22x1ti	cmrf1bjcq002w01p8eevosijc	ALLOWED	\N	\N	\N	UI	\N	2026-07-10 14:34:11.685	\N	\N
cmrf1e5h1003701p88jun7ls6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrf1bogs002x01p8ec22x1ti	cmrf1bjcq002w01p8eevosijc	ALLOWED	\N	\N	\N	UI	\N	2026-07-10 14:34:25.717	\N	\N
cmrf1efyq003801p8mmk2s9od	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrf1bogs002x01p8ec22x1ti	cmrf1bjcq002w01p8eevosijc	ALLOWED	\N	\N	\N	UI	\N	2026-07-10 14:34:39.314	\N	\N
cmrf70nhe003k01p88brnhrxp	cmrf70dud003b01p84kqb0a69	cmrf70du1003a01p8f2k0qlkg	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_terminos_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "terminos", "version": "1.1.0", "explicit": true}	2026-07-10 17:11:53.57	\N	\N
cmrf70nhm003l01p8cy0hr97y	cmrf70dud003b01p84kqb0a69	cmrf70du1003a01p8f2k0qlkg	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_privacidad_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "privacidad", "version": "1.1.0", "explicit": true}	2026-07-10 17:11:53.578	\N	\N
cmrf70nhq003m01p8jrscktr9	cmrf70dud003b01p84kqb0a69	cmrf70du1003a01p8f2k0qlkg	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_cookies_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "cookies", "version": "1.1.0", "explicit": true}	2026-07-10 17:11:53.582	\N	\N
cmrf70nhu003n01p8d3m1jzwq	cmrf70dud003b01p84kqb0a69	cmrf70du1003a01p8f2k0qlkg	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_lopdp_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "lopdp-consentimiento", "version": "1.1.0", "explicit": true}	2026-07-10 17:11:53.586	\N	\N
cmrfvmwep003r01p8xpus6x69	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 04:41:02.353	\N	\N
cmrfvmwsu003s01p8uqfbnyev	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 04:41:02.862	\N	\N
cmrfvo0t0003t01p8demzi153	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 04:41:54.708	\N	\N
cmrfvol8j003u01p83e83qmye	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 04:42:21.187	\N	\N
cmrfvp75z003v01p86rorfkvx	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 04:42:49.607	\N	\N
cmrfw5n9b003w01p8az7fqcmj	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 04:55:36.959	\N	\N
cmrfw7278003x01p80azv0lcn	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 04:56:42.98	\N	\N
cmrfwju6q000001odnqucz7a2	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 05:06:39.122	\N	\N
cmrfwk0ak000101od4k9dkzpt	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 05:06:47.036	\N	\N
cmrfwk23r000201odvu6s23vy	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 05:06:49.383	\N	\N
cmrfwk2wc000301odwsy4ejcq	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 05:06:50.412	\N	\N
cmrfwk2xr000401odbvi0059m	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 05:06:50.463	\N	\N
cmrfwk38m000501odeynzjniz	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 05:06:50.854	\N	\N
cmrfwk3da000601odefd7tgar	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 05:06:51.022	\N	\N
cmrfwk3hr000701od5hizv7jz	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 05:06:51.183	\N	\N
cmrfwk3n0000801odi55siijn	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 05:06:51.372	\N	\N
cmrfwk3wq000901odr09qomf5	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 05:06:51.722	\N	\N
cmrfwkx6r000a01odrz43q87p	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 05:07:29.667	\N	\N
cmrfwkxek000b01odoe0s4tpe	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 05:07:29.948	\N	\N
cmrfwm2vb000c01od315ej8au	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 05:08:23.687	\N	\N
cmrfyv7n4000001qozo3buvnf	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 06:11:29.008	\N	\N
cmrfyv7y4000101qowsaoy44r	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 06:11:29.404	\N	\N
cmrfywi4y000201qo62k3jvyl	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	ENCOUNTER_DELETED	Encounter	cmrfvmw7e003q01p847cuolvy	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 06:12:29.267	\N	\N
cmrfz1lm2000001nscx2cjpkg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Encounter	cmrf1bogs002x01p8ec22x1ti	\N	ALLOWED	\N	73.8.161.0	Python-urllib/3.11	API	{"model": "claude-haiku-4-5-20251001", "feature": "plan-suggestion", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "diagnosesCount": 1, "fieldsSanitized": 4, "hasExamenFisico": true, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "medicamentosCount": 0, "hasHistoriaClinica": false, "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-11 06:16:27.051	\N	\N
cmrfz1rb3000201nsv6b4dcuv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrf1bogs002x01p8ec22x1ti	cmrf1bjcq002w01p8eevosijc	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 06:16:34.431	\N	\N
cmrgkyi5l000301p2tsc9l80p	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:29:54.153	\N	\N
cmrgkyikl000401p2na2hjamf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:29:54.694	\N	\N
cmrgl2kd6000501p2k8ur9y13	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": [], "procedure": "update", "currentVersion": 11, "expectedVersion": 0}	2026-07-11 16:33:03.642	\N	\N
cmrgl3fst000601p2caksyne9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 11, "expectedVersion": 0}	2026-07-11 16:33:44.381	\N	\N
cmrgl43fm000801p2z9oi9yir	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:34:15.01	\N	\N
cmrgl43ku000901p236nl9x70	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:34:15.198	\N	\N
cmrgl43x9000c01p2aiolux84	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:34:15.645	\N	\N
cmrgl43xe000d01p271hzsrjp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:34:15.65	\N	\N
cmrgl46yc000e01p2vimm7tqu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:34:19.572	\N	\N
cmrgl4lg2000f01p2u2bbwyay	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 2, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-11 16:34:38.354	\N	\N
cmrgl4mf5000i01p2gdjbna04	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:34:39.617	\N	\N
cmrgl5dcg000j01p2tepecmmt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 3, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-11 16:35:14.512	\N	\N
cmrgl5edo000m01p2nhgwuame	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:35:15.852	\N	\N
cmrgl5zhq000n01p2ucym49wo	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-11 16:35:43.214	\N	\N
cmrgl6165000q01p27obqrydf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:35:45.39	\N	\N
cmrgl6l2o000t01p2ns2535uw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:36:11.184	\N	\N
cmrgl6qzn000v01p2vuwnawjj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:36:18.851	\N	\N
cmrgl6r9w000w01p2qtwpfejf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:36:19.22	\N	\N
cmrgl6wbo000x01p2ym255ncx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-11 16:36:25.764	\N	\N
cmrgl6xeo000y01p2udusrjcx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-11 16:36:27.168	\N	\N
cmrgl7mpt000z01p250seiy7t	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:36:59.969	\N	\N
cmrgl7oo5001001p25wjd9v3f	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmrgl439e000701p2z87hek2l	cmrgkycav000101p22bb4j9of	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-11 16:37:02.501	\N	\N
cmrgl7pvd001201p214jehdct	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmrgl439e000701p2z87hek2l	cmrgkycav000101p22bb4j9of	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-11 16:37:04.057	\N	\N
cmrgl868f001401p2lla0h3hy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:37:25.263	\N	\N
cmrgl87cn001501p26q5d3oqw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrgl6kvk000r01p2ucyv6ahx	cmrgkycav000101p22bb4j9of	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-11 16:37:26.711	\N	\N
cmrgl881t001601p27bto4hc2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrgl6kvk000r01p2ucyv6ahx	cmrgkycav000101p22bb4j9of	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-11 16:37:27.617	\N	\N
cmrgldl2z001701p2skmo9m3h	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:41:37.787	\N	\N
cmrgle1nv001801p2xlfccl4n	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:41:59.275	\N	\N
cmrgle1xu001901p2s2x9c47l	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:41:59.634	\N	\N
cmrgle27g001a01p2adwhvt4u	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:41:59.98	\N	\N
cmrgle5kp001b01p2ocul8tbv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Encounter	cmrgkyi1g000201p2tvci3n5w	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "plan-suggestion", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "diagnosesCount": 0, "fieldsSanitized": 2, "hasExamenFisico": true, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "medicamentosCount": 4, "hasHistoriaClinica": false, "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-11 16:42:04.345	\N	\N
cmrglpofi001d01p2m2n72bsa	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:51:01.998	\N	\N
cmrglq3d4001f01p20avloxde	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:51:21.352	\N	\N
cmrglq3ml001g01p2yu23bp4q	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:51:21.693	\N	\N
cmrglu9jl001h01p2l51mebww	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:54:35.985	\N	\N
cmrglu9ri001i01p2bct5p8g7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:54:36.27	\N	\N
cmrglud1i001j01p2otzdk5bx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-11 16:54:40.518	\N	\N
cmrglue1r001k01p29sknpywi	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-11 16:54:41.824	\N	\N
cmrgluvhg001l01p2gbx9zhw3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrgkyi1g000201p2tvci3n5w	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:55:04.42	\N	\N
cmrglvj8h001n01p28x98r1i5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrglvj5n001m01p21wtrk2mc	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:55:35.201	\N	\N
cmrglvjrl001o01p21el6tvdj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrglvj5n001m01p21wtrk2mc	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:55:35.889	\N	\N
cmrglwals001q01p25hjao2hu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrglvj5n001m01p21wtrk2mc	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:56:10.672	\N	\N
cmrglwdoh001s01p2grxz38wc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrglvj5n001m01p21wtrk2mc	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:56:14.657	\N	\N
cmrglwomd001t01p2ckv744f0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrglvj5n001m01p21wtrk2mc	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:56:28.837	\N	\N
cmrglwzq0001v01p2yf03pkzb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrglvj5n001m01p21wtrk2mc	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:56:43.224	\N	\N
cmrglx03d001x01p28i3ghssn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrglvj5n001m01p21wtrk2mc	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:56:43.705	\N	\N
cmrglx8wv002001p20n7wecow	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrglvj5n001m01p21wtrk2mc	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:56:55.135	\N	\N
cmrglxbdw002201p24pa9py7t	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrglvj5n001m01p21wtrk2mc	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:56:58.34	\N	\N
cmrglxbly002301p272jqbrtu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrglvj5n001m01p21wtrk2mc	cmrgkycav000101p22bb4j9of	ALLOWED	\N	\N	\N	UI	\N	2026-07-11 16:56:58.63	\N	\N
cmrglxdwc002401p27anygt18	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrglvj5n001m01p21wtrk2mc	cmrgkycav000101p22bb4j9of	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-11 16:57:01.596	\N	\N
cmrglxffo002501p2bmm5f34y	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrglvj5n001m01p21wtrk2mc	cmrgkycav000101p22bb4j9of	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-11 16:57:03.588	\N	\N
cmrkmhtfm002601p2blyhnjym	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:23:59.554	\N	\N
cmrkmhtsc002701p2zrs3v7zl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:24:00.012	\N	\N
cmrkmi09r002901p2q41c5o2b	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:24:08.415	\N	\N
cmrkmi0v1002a01p2tmgbqsgr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:24:09.181	\N	\N
cmrkmi2ar002b01p2wsvrols0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 12:24:11.043	\N	\N
cmrkmic8m002c01p2mu01fwoq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:24:23.926	\N	\N
cmrkmilg7002d01p2aj64k2cs	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:24:35.863	\N	\N
cmrkminbd002e01p2rmh0qpiq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:24:38.281	\N	\N
cmrkminms002f01p26bkuqasu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:24:38.692	\N	\N
cmrkmio0p002g01p2ykowmqk9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:24:39.193	\N	\N
cmrkmsm3t002h01p2wlgbft2u	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:32:23.274	\N	\N
cmrkmsrjp002i01p2i19vnrya	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:32:30.325	\N	\N
cmrkmsuda002j01p2gr0pw9r2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:32:33.982	\N	\N
cmrkmsw4r002k01p2a4avosfd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:32:36.267	\N	\N
cmrkmsxq7002l01p2xb7je2fz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:32:38.335	\N	\N
cmrmbtal9003q01lezn68oprt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmrm8508y000e01lepg5zbuer	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 17:00:31.581	\N	\N
cmrmcnegi004001le47laulpd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:23:56.274	\N	\N
cmrmcrmbq004b01leoh9uruur	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrmcomep004401leo1dxiu3q	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 17:27:13.094	\N	\N
cmrmcuqoy004p01lenfw0dvws	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:29:38.722	\N	\N
cmrmd2225005d01le7vgkh2va	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:35:20.045	\N	\N
cmrmp2fh3006101leptzdqog8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 23:11:32.823	\N	\N
cmrmpws9t000201pgaw41olq4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 23:35:09.089	\N	\N
cmrmqu731000301low4k5f97e	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:01:07.933	\N	\N
cmrmqu8x5000401lo5kgv9ha6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrmpx14q000501pg81apu76r	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 00:01:10.313	\N	\N
cmrmr60e1000d01lo53xypj4p	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:10:19.129	\N	\N
cmrmrhc68000601ro2saiiokt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:19:07.616	\N	\N
cmrmrori9000601o5h3llbj1m	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:24:54.081	\N	\N
cmrmruy72000p01o58fmhqf42	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:29:42.686	\N	\N
cmrmrx72i000x01o5xh93w5sv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:31:27.498	\N	\N
cmrmsbmnj001a01o5c4szkclg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:42:40.879	\N	\N
cmrmsvhme000001nlwtes7yzr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:58:07.478	\N	\N
cmrmswecp000b01nlcb99y1ee	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:58:49.897	\N	\N
cmrmtiagb000501o6pgd640l2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:15:51.275	\N	\N
cmrmtiasr000601o6rsx7q54v	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:15:51.723	\N	\N
cmrmu0yne000701o0nzc0edad	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:30:22.442	\N	\N
cmrmuhl84000601skhtl8evds	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:43:18.196	\N	\N
cmrmuzsj1000g01skblwn7g3v	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:57:27.469	\N	\N
cmrmv9ehm000501o4tnwndrqy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:04:55.834	\N	\N
cmrmvat06000d01o43koete8b	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:06:01.302	\N	\N
cmrmvatzr000e01o4t2uk7yyg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 02:06:02.583	\N	\N
cmrmvbpza000k01o487i6ig89	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_DELETED	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:06:44.038	\N	\N
cmrmvcf5v000r01o4uhqil4yw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:07:16.675	\N	\N
cmrmvcnwi000t01o4gk2lt95y	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvbr3g000l01o40svybg0l	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:07:28.002	\N	\N
cmrmvcw8e000u01o42qx6vsxv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_DELETED	Encounter	cmrmvbr3g000l01o40svybg0l	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:07:38.798	\N	\N
cmrmvfn31001101o4o0dqz1fq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:09:46.909	\N	\N
cmrmvgtdw001a01o4kxv1ctio	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 02:10:41.732	\N	\N
cmrmvio6x001g01o4tkxba1i7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:12:08.313	\N	\N
cmrmvjylz001l01o4josi77r1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:13:08.471	\N	\N
cmrkmszwu002m01p2y3dhvrf0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:32:41.166	\N	\N
cmrmbue0h003s01le2m6xwqgw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:01:22.673	\N	\N
cmrmcnve5004101leoteslrxo	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:24:18.221	\N	\N
cmrmcs632004d01leh3ymcbl6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:27:38.702	\N	\N
cmrmcsb5u004e01lehmdt18o2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:27:45.282	\N	\N
cmrmcsboe004g01lemicmn9a8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:27:45.95	\N	\N
cmrmcuqqr004q01le6xaddrd0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrmcomep004401leo1dxiu3q	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 17:29:38.787	\N	\N
cmrmd4dfn005q01lekf7u6c80	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:37:08.1	\N	\N
cmrmp4082006201le9mw1jl1h	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 23:12:46.37	\N	\N
cmrmpwsc9000301pgsc7fno6e	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 23:35:09.177	\N	\N
cmrmqudr2000501lo372ol50j	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:01:16.574	\N	\N
cmrmr6153000e01lo3ml1jbxm	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:10:20.103	\N	\N
cmrmrhdle000701rokdhm2s5t	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:19:09.458	\N	\N
cmrmrosd7000701o522v6od3b	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:24:55.195	\N	\N
cmrmrw7x2000q01o56j63amrj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:30:41.942	\N	\N
cmrmrzllf000y01o527pvyyb8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_HISTORY	PatientRegistration	cmrm7x1l6000101le9hkh0ivo	cmrm7x1kp000001lef5ixp0z1	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 00:33:19.635	\N	\N
cmrmsbs5s001b01o574atr5ni	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:42:48.016	\N	\N
cmrmsvk0r000101nl9e0jvhaz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:58:10.587	\N	\N
cmrmsweue000d01nlkupxqvrb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:58:50.534	\N	\N
cmrmtj48r000801o6twwwamvr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:16:29.883	\N	\N
cmrmu0zb8000801o0d9z9jt3z	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:30:23.3	\N	\N
cmrmu10ao000901o0g72yzu1q	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 01:30:24.576	\N	\N
cmrmuhlgz000701skq7kgmn38	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:43:18.515	\N	\N
cmrmuhmvg000a01skgi5wusqe	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:43:20.332	\N	\N
cmrmv00tb000h01sk24q599cd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:57:38.207	\N	\N
cmrmvagmz000601o4wis65awn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:05:45.275	\N	\N
cmrmvb4dx000f01o4iacxhrip	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:06:16.054	\N	\N
cmrmvbg4w000j01o49q8mcyfl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:06:31.28	\N	\N
cmrmvbr61000m01o4z4q9nces	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvbr3g000l01o40svybg0l	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:06:45.577	\N	\N
cmrmvcnq7000s01o4z75spxqw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvbr3g000l01o40svybg0l	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:07:27.775	\N	\N
cmrmvfnej001301o43undczgv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:09:47.323	\N	\N
cmrmvhi65001b01o4089sivs3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:11:13.853	\N	\N
cmrmvipq5001h01o4e0rlm93r	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 02:12:10.301	\N	\N
cmrmvlcra001n01o4jqhlxked	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:14:13.462	\N	\N
cmrkmt248002n01p29yz6sety	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:32:44.024	\N	\N
cmrkmtljk002o01p2z3sdsup7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:33:09.2	\N	\N
cmrkmtrky002q01p2ljjutrbm	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:33:17.026	\N	\N
cmrkmts1g002r01p2n1hagnyg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:33:17.62	\N	\N
cmrkmts4p002s01p2pddg60qe	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmr0p320f000o01mow3o5nt0c	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 12:33:17.737	\N	\N
cmrkmttil002u01p2qybqn2hu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:33:19.533	\N	\N
cmrkmtv7s002v01p23paxlljd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 12:33:21.736	\N	\N
cmrkmtwz3002w01p2o3gvzdgq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 12:33:24.015	\N	\N
cmrkn2kv1002x01p28susbwe5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:40:08.221	\N	\N
cmrkni9te002y01p2vq8f5wrq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr0o3w6h000401mozcv4wfyt	cmr0o3mnr000301mowkmfiq8t	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:52:20.402	\N	\N
cmrknjvuj003201p29bxl211c	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:53:35.611	\N	\N
cmrknjw44003301p22e9qpuf8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:53:35.956	\N	\N
cmrknnjlw003401p2z3gyfwir	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 9, "expectedVersion": 0}	2026-07-14 12:56:26.372	\N	\N
cmrknnx2d003501p2nhisykm9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 9, "expectedVersion": 0}	2026-07-14 12:56:43.813	\N	\N
cmrknovjl003601p2o9pd1t5q	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 9, "expectedVersion": 0}	2026-07-14 12:57:28.497	\N	\N
cmrknpgqz003701p220uosdjo	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 9, "expectedVersion": 0}	2026-07-14 12:57:55.979	\N	\N
cmrknppdl003801p2uzikzt3m	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 9, "expectedVersion": 0}	2026-07-14 12:58:07.161	\N	\N
cmrknptf9003901p23zuk12cu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 9, "expectedVersion": 0}	2026-07-14 12:58:12.405	\N	\N
cmrknq7vc003c01p2ravjp2e2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:58:31.128	\N	\N
cmrknq8zr003e01p2fc0zu4dt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:58:32.583	\N	\N
cmrknq9br003f01p27xsnxsaq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:58:33.015	\N	\N
cmrknqf05003g01p2n0cvbo61	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 12:58:40.373	\N	\N
cmrknqg1q003h01p2mc90xd35	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 12:58:41.726	\N	\N
cmrknqqok003i01p2yhikugpg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:58:55.508	\N	\N
cmrknrejw003j01p2l5ijeycn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:59:26.444	\N	\N
cmrknrev5003k01p2zp0qo0a6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:59:26.849	\N	\N
cmrknrf5n003l01p2854mvrxj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:59:27.227	\N	\N
cmrknrorx003n01p2phppec61	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:59:39.693	\N	\N
cmrknrp6o003o01p2s46gjn0o	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:59:40.224	\N	\N
cmrknrq04003p01p28a5ih4mg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:59:41.284	\N	\N
cmrknrq9a003q01p2wm3tqs3v	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:59:41.614	\N	\N
cmrknrqib003r01p2glr009s0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:59:41.94	\N	\N
cmrknrs1f003t01p2epma95ir	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:59:43.923	\N	\N
cmrknrsi2003u01p2paa0lhco	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:59:44.522	\N	\N
cmrmc6ai8003t01le4j42akrg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:10:38	\N	\N
cmrmcnx6v004201lenslzjnt5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:24:20.551	\N	\N
cmrmcsbey004f01lebgq9mtki	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:27:45.61	\N	\N
cmrmcw1q7004r01le7ri33gzv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:30:39.679	\N	\N
cmrmcw4t6004s01le2bjswuk4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrm8q1oq001u01lexa648hq4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 17:30:43.674	\N	\N
cmrmd4dmh005r01leqciqc79g	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:37:08.345	\N	\N
cmrmp40fz006301leo6mcu1cl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 23:12:46.655	\N	\N
cmrmpwsr9000401pg2igtqn3l	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 23:35:09.717	\N	\N
cmrmqufi9000601lo7jxbhpit	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:01:18.849	\N	\N
cmrmr6h88000f01loyeosb3m7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:10:40.952	\N	\N
cmrmriqwh000901roy5fwh35l	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:20:13.361	\N	\N
cmrmrpl0c000801o5cm3hoezh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:25:32.317	\N	\N
cmrmrpu77000901o5patquxl2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 22, "expectedVersion": 21}	2026-07-16 00:25:44.227	\N	\N
cmrmrq56h000c01o5b8qm0rr5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 22, "expectedVersion": 21}	2026-07-16 00:25:58.457	\N	\N
cmrmrq81d000d01o5ykis04ct	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 22, "expectedVersion": 21}	2026-07-16 00:26:02.161	\N	\N
cmrmrqasy000e01o55wjex5am	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 22, "expectedVersion": 21}	2026-07-16 00:26:05.746	\N	\N
cmrmrqgji000f01o5a95xwqav	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 22, "expectedVersion": 21}	2026-07-16 00:26:13.182	\N	\N
cmrmrqizb000g01o5oual1d91	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 22, "expectedVersion": 21}	2026-07-16 00:26:16.343	\N	\N
cmrmrqpt7000j01o514p11g1q	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 22, "expectedVersion": 21}	2026-07-16 00:26:25.195	\N	\N
cmrmrw86u000r01o52nk7gmsr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:30:42.294	\N	\N
cmrms062k001001o50epxg165	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_HISTORY	PatientRegistration	cmrm7x1l6000101le9hkh0ivo	cmrm7x1kp000001lef5ixp0z1	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 00:33:46.172	\N	\N
cmrmsc6ej001c01o5d6h5qo4g	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:43:06.475	\N	\N
cmrmsvkxf000201nl4a0oa5il	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:58:11.764	\N	\N
cmrmsvly4000301nlvs9eqgbo	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:58:13.084	\N	\N
cmrmsvmfa000501nl7rhoyrwr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:58:13.702	\N	\N
cmrmtg7lt000001papiipffn5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:14:14.273	\N	\N
cmrmtj4wa000901o6o7a3x27m	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:16:30.73	\N	\N
cmrmuen5a000a01o0rea8hewi	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:41:00.718	\N	\N
cmrmuhlpt000801sk83sxjf2s	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:43:18.833	\N	\N
cmrmv00zt000i01sknv4lqx1z	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:57:38.441	\N	\N
cmrmvagst000701o4b2w86fe8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:05:45.485	\N	\N
cmrmvaikw000801o4zxyjo6bg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:05:47.792	\N	\N
cmrknrthd003v01p2mqv6eut0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 12:59:45.793	\N	\N
cmrmc6bkj003u01lersdrahc5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:10:39.379	\N	\N
cmrmcnxuv004301lepqen45ni	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:24:21.415	\N	\N
cmrmcsjwj004i01levzzset25	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:27:56.611	\N	\N
cmrmcw63h004t01lewnlnzp40	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrm8q1oq001u01lexa648hq4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 17:30:45.341	\N	\N
cmrmd5hfx005u01letxgaxh4c	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:37:59.949	\N	\N
cmrmp40o2006401let90rb4s3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 23:12:46.946	\N	\N
cmrmpx4ky000601pgbvnu38iy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrmpx14q000501pg81apu76r	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 23:35:25.042	\N	\N
cmrmqug3b000701loljnlnfy4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:01:19.607	\N	\N
cmrmrau2o000001roavicw48h	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:14:04.224	\N	\N
cmrmrl66f000001o5kqlia4ys	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:22:06.472	\N	\N
cmrmrpzdw000a01o5auqhy4jt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 22, "expectedVersion": 21}	2026-07-16 00:25:50.948	\N	\N
cmrmrq26y000b01o5vg1g4gf6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 22, "expectedVersion": 21}	2026-07-16 00:25:54.586	\N	\N
cmrmrwifd000s01o5qbwpmdjy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:30:55.561	\N	\N
cmrms6d7a001201o5zg4egfm4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:38:35.35	\N	\N
cmrmsc6kr001d01o5yz36x8lz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:43:06.699	\N	\N
cmrmsvm6z000401nlzh3mjfya	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:58:13.403	\N	\N
cmrmti626000001o62u4cfubv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:15:45.582	\N	\N
cmrmtibas000701o6pm0g52c4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:15:52.372	\N	\N
cmrmtub27000001o0u4tse2vu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:25:11.935	\N	\N
cmrmugqpx000001skq6tz7oer	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:42:38.661	\N	\N
cmrmuhn1c000b01skt20ue5ys	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:43:20.544	\N	\N
cmrmv9buc000001o4pm3rjki9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:04:52.404	\N	\N
cmrmvaisa000901o4jrxn1f8v	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:05:48.058	\N	\N
cmrmvb8om000g01o4qevdifp2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:06:21.622	\N	\N
cmrmvbrce000n01o40i3yt2wl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvbr3g000l01o40svybg0l	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:06:45.806	\N	\N
cmrmveg5z000w01o42q2wf73b	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:08:51.287	\N	\N
cmrmvggp3001601o4ueglmg7r	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:10:25.287	\N	\N
cmrmvhic0001c01o4ihr1y4ih	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:11:14.064	\N	\N
cmrmvhjon001d01o4mwavz240	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 02:11:15.815	\N	\N
cmrmvjrz8001i01o4pyd539un	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:12:59.876	\N	\N
cmrmvjy4e001j01o45bcoueau	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:13:07.838	\N	\N
cmrmvlcz8001o01o4oczxc5m1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:14:13.748	\N	\N
cmrmvnsg0001q01o4t4ascs7j	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:16:07.104	\N	\N
cmrknruna003w01p221exotr7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 12:59:47.302	\N	\N
cmrknrzva003x01p2yijn413t	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 12:59:54.07	\N	\N
cmrkns55c003y01p20z48tb1z	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:00:00.912	\N	\N
cmrkns6wm003z01p2f0qrknrg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:00:03.19	\N	\N
cmrkns776004001p27le91681	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:00:03.57	\N	\N
cmrknsgxh004101p20qza5qwo	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["motivo", "historiaClinica"], "procedure": "update", "currentVersion": 11, "expectedVersion": 7}	2026-07-14 13:00:16.181	\N	\N
cmrknshee004201p2f48bjl9l	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:00:16.79	\N	\N
cmrknslmb004301p2bs0cb21m	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["motivo", "historiaClinica"], "procedure": "update", "currentVersion": 11, "expectedVersion": 7}	2026-07-14 13:00:22.259	\N	\N
cmrknslvi004401p2m6qbbl2w	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:00:22.59	\N	\N
cmrknsmwf004501p2984ph8nt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["motivo", "historiaClinica"], "procedure": "update", "currentVersion": 11, "expectedVersion": 7}	2026-07-14 13:00:23.919	\N	\N
cmrknsn7m004601p2z2mntav5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:00:24.322	\N	\N
cmrknso9c004701p2bbj8d1vz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["motivo", "historiaClinica"], "procedure": "update", "currentVersion": 11, "expectedVersion": 7}	2026-07-14 13:00:25.68	\N	\N
cmrknsos9004901p2b0htiq2x	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:00:26.361	\N	\N
cmrknsplf004a01p2bsa2z0nl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:00:27.411	\N	\N
cmrknspuj004b01p2i3r1qbfh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:00:27.739	\N	\N
cmrknsquh004c01p2uqa70lj2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 13:00:29.033	\N	\N
cmrknss07004d01p2qb6s7uge	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 13:00:30.535	\N	\N
cmrknt2nh004e01p23e7sjvbr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:00:44.333	\N	\N
cmrknt4km004f01p2zebtsrkb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:00:46.822	\N	\N
cmrknt4y4004g01p2s71htug3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:00:47.308	\N	\N
cmrknt57a004h01p2lpbteavc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:00:47.638	\N	\N
cmrknth8l004j01p2rjrtgg2d	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:01:03.237	\N	\N
cmrknthku004k01p2ibs2mri9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:01:03.678	\N	\N
cmrkntij6004l01p2pnrkl0un	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 13:01:04.914	\N	\N
cmrkntkei004m01p2dp4t0igy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 13:01:07.338	\N	\N
cmrkntqql004n01p2rfg6y9f5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:01:15.549	\N	\N
cmrkntuu1004o01p2jn6014i5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:01:20.857	\N	\N
cmrkntv4f004p01p2gt5fhoxw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:01:21.231	\N	\N
cmrkntvci004q01p2x8aac6r5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:01:21.522	\N	\N
cmrknu4rt004s01p2qf5wr7xq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:01:33.737	\N	\N
cmrknu8y4004u01p2b3kgia51	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:01:39.148	\N	\N
cmrknu970004v01p280ms123p	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:01:39.468	\N	\N
cmrknua30004w01p2hvy9m6x0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 13:01:40.62	\N	\N
cmrknub32004x01p2awvdd6bv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 13:01:41.918	\N	\N
cmrknugxv004y01p2p8lfiw5p	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:01:49.507	\N	\N
cmrknui0x004z01p2xu5d55jn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrknq7ma003a01p2520clxey	cmrknjqty003001p27vao7k4s	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 13:01:50.913	\N	\N
cmrknuixk005001p2fylowlie	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrknq7ma003a01p2520clxey	cmrknjqty003001p27vao7k4s	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 13:01:52.088	\N	\N
cmrknwrm7005101p23giyghfs	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:03:36.655	\N	\N
cmrknxh0x005201p2usuqmgxh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:04:09.585	\N	\N
cmrknxhh0005301p2zdo2mfsa	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:04:10.164	\N	\N
cmrknxhv7005401p25bkh2sa7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:04:10.675	\N	\N
cmrknxmqb005601p23jq0kbcw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:04:16.979	\N	\N
cmrknxmzv005701p274xaac4r	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:04:17.323	\N	\N
cmrknxngd005801p25ivgz85m	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 13:04:17.917	\N	\N
cmrknxob5005901p2i118puop	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 13:04:19.025	\N	\N
cmrknxudd005a01p2b5tmw7y4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:04:26.881	\N	\N
cmrknygb5005b01p2aqar7mkz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:04:55.313	\N	\N
cmrkok5i9005c01p2m81kn9q0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:21:47.745	\N	\N
cmrkp4i7b005d01p2ara5ghik	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:37:37.319	\N	\N
cmrkp8omb005e01p2dmmuunpd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrknjvrf003101p21rhx626p	cmrknjqty003001p27vao7k4s	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:40:52.259	\N	\N
cmrkp9qsy005i01p2ccmho53i	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkp9qnw005h01p22ngivvx3	cmrkp9l1l005g01p20p10qfcd	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:41:41.746	\N	\N
cmrkp9r3c005j01p2odupit1s	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkp9qnw005h01p22ngivvx3	cmrkp9l1l005g01p20p10qfcd	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:41:42.12	\N	\N
cmrkpkash005k01p22szhsp1i	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["motivo", "historiaClinica"], "procedure": "update", "currentVersion": 20, "expectedVersion": 19}	2026-07-14 13:49:54.21	\N	\N
cmrkpkb0z005l01p2m6b80mrs	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkp9qnw005h01p22ngivvx3	cmrkp9l1l005g01p20p10qfcd	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:49:54.515	\N	\N
cmrkpoas1005m01p2za6us93c	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkp9qnw005h01p22ngivvx3	cmrkp9l1l005g01p20p10qfcd	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:53:00.817	\N	\N
cmrkpofg3005o01p2x9ikzzil	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkp9qnw005h01p22ngivvx3	cmrkp9l1l005g01p20p10qfcd	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:53:06.867	\N	\N
cmrkpoj5s005q01p2occt2xla	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkp9qnw005h01p22ngivvx3	cmrkp9l1l005g01p20p10qfcd	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:53:11.68	\N	\N
cmrkpojhf005r01p2j6dtqxvg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkp9qnw005h01p22ngivvx3	cmrkp9l1l005g01p20p10qfcd	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:53:12.099	\N	\N
cmrkpot48005s01p2kuppwag5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrkp9qnw005h01p22ngivvx3	cmrkp9l1l005g01p20p10qfcd	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 13:53:24.584	\N	\N
cmrkpou9j005t01p2umbzzoer	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrkp9qnw005h01p22ngivvx3	cmrkp9l1l005g01p20p10qfcd	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 13:53:26.071	\N	\N
cmrkprfnk005u01p29scmersb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkp9qnw005h01p22ngivvx3	cmrkp9l1l005g01p20p10qfcd	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:55:27.104	\N	\N
cmrkprgnf005v01p23pi2hyrl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrkp9qnw005h01p22ngivvx3	cmrkp9l1l005g01p20p10qfcd	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:55:28.395	\N	\N
cmrkprh0s005w01p2gzn68k1g	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkp9qnw005h01p22ngivvx3	cmrkp9l1l005g01p20p10qfcd	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:55:28.876	\N	\N
cmrkprhb7005x01p22m728ezn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkp9qnw005h01p22ngivvx3	cmrkp9l1l005g01p20p10qfcd	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:55:29.251	\N	\N
cmrkps3vq006001p2s6ad37hq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkp9qnw005h01p22ngivvx3	cmrkp9l1l005g01p20p10qfcd	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 13:55:58.502	\N	\N
cmrkps5ws006101p2cx98wp6x	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrkps3fc005y01p29xqhwbyo	cmrkp9l1l005g01p20p10qfcd	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 13:56:01.132	\N	\N
cmrkps6wz006201p23tccqmbf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrkps3fc005y01p29xqhwbyo	cmrkp9l1l005g01p20p10qfcd	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 13:56:02.435	\N	\N
cmrkqulxi006301p2cg1exnx1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkp9qnw005h01p22ngivvx3	cmrkp9l1l005g01p20p10qfcd	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 14:25:54.822	\N	\N
cmrks2fgy006401p2jbvyp4w0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkp9qnw005h01p22ngivvx3	cmrkp9l1l005g01p20p10qfcd	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 14:59:59.314	\N	\N
cmrks2n1y006601p2fbyd2tx5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkp9qnw005h01p22ngivvx3	cmrkp9l1l005g01p20p10qfcd	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:00:09.142	\N	\N
cmrks2nmg006701p21gj1efs5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkp9qnw005h01p22ngivvx3	cmrkp9l1l005g01p20p10qfcd	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:00:09.88	\N	\N
cmrkscq3j006b01p2e5v3k37d	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:07:59.647	\N	\N
cmrkscqvf006c01p22fmtxzys	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:08:00.651	\N	\N
cmrksjwtd006x01p2pepbvu4v	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:13:34.945	\N	\N
cmrksjwtf006y01p2r23u7bj2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:13:34.947	\N	\N
cmrksjwti006z01p2pxbhygbn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:13:34.95	\N	\N
cmrksjwty007001p205oxosoj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:13:34.966	\N	\N
cmrksjwui007101p2lxzupm6u	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:13:34.986	\N	\N
cmrksjwwn007201p28k342h8g	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:13:35.063	\N	\N
cmrksjwwq007301p2ljd679f7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:13:35.066	\N	\N
cmrksjwws007401p216ug3yop	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:13:35.068	\N	\N
cmrksjwwv007501p28p8yehsb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:13:35.071	\N	\N
cmrksjwwx007601p2gbaip9qc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:13:35.073	\N	\N
cmrksjwwz007701p2244w6ynk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:13:35.075	\N	\N
cmrksjwxh007801p2tjh3esb5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:13:35.093	\N	\N
cmrksjwxo007901p2jl3axzsa	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:13:35.1	\N	\N
cmrksjwxp007a01p2tufzqt4l	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:13:35.101	\N	\N
cmrksjx2z007b01p2emr1eoaf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:13:35.291	\N	\N
cmrksjx5n007c01p21a210qpy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:13:35.387	\N	\N
cmrksjx5z007d01p2xr843ex4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:13:35.399	\N	\N
cmrksjxa6007e01p2dfomsqw9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:13:35.55	\N	\N
cmrksjxt0007f01p2d4g7lr19	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:13:36.228	\N	\N
cmrksjxt1007g01p2luhmcj37	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:13:36.229	\N	\N
cmrksl5fh007h01p2l3enqgeh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:14:32.765	\N	\N
cmrksl5xs007i01p2wh90uafl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:14:33.424	\N	\N
cmrksl6n5007j01p24yesasrc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:14:34.338	\N	\N
cmrksl756007k01p2q7gc8hj4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:14:34.986	\N	\N
cmrksl7l5007l01p2cbdr2gmk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:14:35.561	\N	\N
cmrksl84k007m01p21bm0e4z0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:14:36.26	\N	\N
cmrkslfkk007v01p2vhgbve4i	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:14:45.908	\N	\N
cmrksluvb008301p2ibmh1w2y	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:15:05.735	\N	\N
cmrksm21p008601p28h4j5b41	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:15:15.037	\N	\N
cmrmc6lij003v01les5b2qonx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 17:10:52.267	\N	\N
cmrmc6nht003w01lep59jxk5o	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 17:10:54.833	\N	\N
cmrmcp5j5004501lejy7pih8s	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrmcomep004401leo1dxiu3q	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 17:25:18.017	\N	\N
cmrmcp6zv004601lemz1il2ey	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrmcomep004401leo1dxiu3q	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 17:25:19.915	\N	\N
cmrmcsk77004j01le5k9u1vs5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:27:56.995	\N	\N
cmrmcsseb004l01lekxib1ynq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrmcomep004401leo1dxiu3q	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 17:28:07.619	\N	\N
cmrmcwth8004u01leh17fdyx4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:31:15.644	\N	\N
cmrmd5lfu005w01lema2zocl6	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:38:05.13	\N	\N
cmrmp4pkd006601le7tjlnwnf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 23:13:19.213	\N	\N
cmrmpz3hz000701pgcxk5bqvt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 23:36:56.951	\N	\N
cmrmpz5w9000801pgrphvndug	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrmpx14q000501pg81apu76r	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 23:37:00.057	\N	\N
cmrmquoib000901louibe0cut	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrmqukob000801lo1new9ezh	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 00:01:30.515	\N	\N
cmrmravg3000101rog1ab2l9h	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:14:06.003	\N	\N
cmrmrlh31000201o581n9z3rg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:22:20.605	\N	\N
cmrmrql61000h01o5719js69p	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 22, "expectedVersion": 21}	2026-07-16 00:26:19.177	\N	\N
cmrmrqn3t000i01o5fv022v9c	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 22, "expectedVersion": 21}	2026-07-16 00:26:21.689	\N	\N
cmrmrqsvq000k01o5gqlyi0sk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 22, "expectedVersion": 21}	2026-07-16 00:26:29.174	\N	\N
cmrmrwinu000t01o5luyeatvt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:30:55.866	\N	\N
cmrms6dks001301o536wx348d	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:38:35.836	\N	\N
cmrmscf39001e01o51oiv9tvt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 00:43:17.733	\N	\N
cmrmswazb000601nlmbyxx8y1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:58:45.527	\N	\N
cmrmswedt000c01nlnjt7t5aj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:58:49.937	\N	\N
cmrmti8gp000101o6a79az4rr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:15:48.7	\N	\N
cmrmtzs1a000201o0lxy4751p	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:29:27.214	\N	\N
cmrmugstv000101skoa01wb49	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:42:41.395	\N	\N
cmrmuhokx000c01sk6799wsip	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 01:43:22.546	\N	\N
cmrmv9d0l000101o44u9wzzuf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:04:53.925	\N	\N
cmrksl96w007n01p2ln3aphc4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:14:37.64	\N	\N
cmrksl9od007o01p2ozckdj43	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:14:38.269	\N	\N
cmrkslbyv007r01p2vpx99sxl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:14:41.24	\N	\N
cmrksli68007x01p2dubl7q1n	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:14:49.28	\N	\N
cmrkslpv4008101p2m1hnx52p	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:14:59.248	\N	\N
cmrksm45f008701p2bw1vez4k	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 15:15:17.763	\N	\N
cmrmcn6bq003x01leb8yfkl1n	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:23:45.734	\N	\N
cmrmcpiwv004701levfnsf5b2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:25:35.359	\N	\N
cmrmcsq3g004k01lecmqwy2j3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrmcomep004401leo1dxiu3q	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 17:28:04.636	\N	\N
cmrmczlam004v01leuog5cio7	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:33:25.006	\N	\N
cmrmd5lnc005x01leyqsiam3x	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:38:05.4	\N	\N
cmrmp4psw006701le69yqr33i	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 23:13:19.52	\N	\N
cmrmql7ag000001loyjkksy8u	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 23:54:08.297	\N	\N
cmrmqxbf1000a01lo2fabb3qk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:03:33.517	\N	\N
cmrmrb39j000301ro68i07w8c	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrmrazul000201rotzzj22mn	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 00:14:16.135	\N	\N
cmrmrlh6y000301o51ht9we0f	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:22:20.746	\N	\N
cmrmrujnb000m01o5hretg7dv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:29:23.831	\N	\N
cmrmrwun5000u01o57bk6g6v3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrmrazul000201rotzzj22mn	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 00:31:11.394	\N	\N
cmrms7lkj001701o5080rer7f	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrmd03in005001lenmdbsv27	cmr0pml9d002001moekmrt320	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 00:39:32.851	\N	\N
cmrmsfjw4001f01o5s3u61vzf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:45:43.924	\N	\N
cmrmswbc0000701nlhwo5admt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:58:45.984	\N	\N
cmrmti996000201o6dbn50q48	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:15:49.722	\N	\N
cmrmtzs6i000301o0m0nz7xes	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:29:27.402	\N	\N
cmrmugtk3000201sk70ywtzu2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:42:42.339	\N	\N
cmrmuguj3000501sknc3c2yz4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:42:43.599	\N	\N
cmrmulgq7000d01sk5fq4116h	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:46:18.991	\N	\N
cmrmv9dog000201o4lb9mwkzt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:04:54.784	\N	\N
cmrmvaiy4000a01o4z51yozem	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:05:48.268	\N	\N
cmrmvb8uk000h01o4mp5kvwfb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:06:21.836	\N	\N
cmrmvc86f000o01o4i38y43v2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvbr3g000l01o40svybg0l	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:07:07.623	\N	\N
cmrmvet2g000x01o4iuf4k1pk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:09:08.008	\N	\N
cmrmvexm0000y01o4lns7fixp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:09:13.897	\N	\N
cmrmvgqhy001801o4kp9vcb8j	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:10:37.99	\N	\N
cmrmvilyi001e01o4qn2g7a4s	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:12:05.418	\N	\N
cmrkslaes007p01p2ukwf7by4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:14:39.22	\N	\N
cmrkslawv007q01p2wdz9vq96	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:14:39.871	\N	\N
cmrkslcxs007s01p2eznmgta1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:14:42.496	\N	\N
cmrksldo3007t01p2pa5q6sri	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:14:43.443	\N	\N
cmrksleob007u01p2p0giphdh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:14:44.748	\N	\N
cmrkslgie007w01p2r1xuwpko	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:14:47.126	\N	\N
cmrksliyv007y01p20seyb0bt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:14:50.311	\N	\N
cmrksljmk007z01p291o8bo1o	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:14:51.165	\N	\N
cmrksm1qz008501p2ajxgz63u	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:15:14.651	\N	\N
cmrksm57y008801p2e3k5bjqh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 15:15:19.15	\N	\N
cmrksmrx4008901p2b69oirp6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:15:48.568	\N	\N
cmrksmxyo008a01p2pg3sgoq9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:15:56.4	\N	\N
cmrksmy8x008b01p2s338tnip	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:15:56.769	\N	\N
cmrksmyho008c01p277nridaz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:15:57.084	\N	\N
cmrksndzn008g01p288tois4e	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:16:17.171	\N	\N
cmrksnfdc008h01p2v0eqxjn5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrksndri008d01p2eammj6l5	cmrksckaq006901p207fftgs1	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 15:16:18.96	\N	\N
cmrksng7h008i01p2l84vsnkd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrksndri008d01p2eammj6l5	cmrksckaq006901p207fftgs1	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 15:16:20.045	\N	\N
cmrksnske008j01p2rxiegap1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:16:36.062	\N	\N
cmrkso8bw008l01p2j4z6vrs0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:16:56.492	\N	\N
cmrkso8qm008n01p2tqfljh3y	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:16:57.022	\N	\N
cmrksokh7008o01p2kit9blet	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 2, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-14 15:17:12.235	\N	\N
cmrksoltv008r01p27b4mlpk8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:17:13.987	\N	\N
cmrksqc0g008s01p2fixhn54f	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 3, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-14 15:18:34.576	\N	\N
cmrksqe5e008v01p2ufk1pxov	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:18:37.346	\N	\N
cmrksr341008w01p2a0n9szf9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-14 15:19:09.697	\N	\N
cmrksr48u008z01p2c7vhwrq6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:19:11.166	\N	\N
cmrksrbxv009101p292lzvafv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:19:21.139	\N	\N
cmrksrc8g009201p2koljfptf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrkscq04006a01p27xdrg8rl	cmrksckaq006901p207fftgs1	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 15:19:21.52	\N	\N
cmrm8hwdo001i01le479b07ar	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:27:41.1	\N	\N
cmrksrdut009301p2fzw0tdx3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmrkso836008k01p2bnlj593a	cmrksckaq006901p207fftgs1	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 15:19:23.621	\N	\N
cmrksreyl009501p2hy4hrovl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmrkso836008k01p2bnlj593a	cmrksckaq006901p207fftgs1	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 15:19:25.053	\N	\N
cmrl97h79000001mreqnd1dcu	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 22:59:48.309	\N	\N
cmrl97hl9000101mrtvyg092d	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 22:59:48.813	\N	\N
cmrl98uu3000201mrxrc6fwpp	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 23:00:52.635	\N	\N
cmrl99flc000301mrcb1205y1	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 23:01:19.536	\N	\N
cmrl9khwl000401mr2nvt8yhw	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 23:09:55.749	\N	\N
cmrl9kuxu000501mr2rcdc3s8	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 23:10:12.642	\N	\N
cmrl9kzw6000601mr7h6pwj9x	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 23:10:19.062	\N	\N
cmrla8dza000001nvriczeguj	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 23:28:30.406	\N	\N
cmrla8fvp000101nv4slhkl6c	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 23:28:32.869	\N	\N
cmrla8gm8000201nvpwdktjs5	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 23:28:33.824	\N	\N
cmrla8kxe000301nvv8yemsiz	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	EXPORT_PDF_HISTORY	PatientRegistration	cmr0pml9d002001moekmrt320	cmr0pml99001z01mogxs7wdnf	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-14 23:28:39.41	\N	\N
cmrla8t7e000501nvyexpddjm	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-14 23:28:50.138	\N	\N
cmrld2f6o000801nvaxfe2v3x	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrld2f2d000701nv6qykgose	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 00:47:50.88	\N	\N
cmrld2ffh000901nve941754i	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrld2f2d000701nv6qykgose	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 00:47:51.197	\N	\N
cmrld4msw000001lofjvmamfi	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrld2f2d000701nv6qykgose	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 00:49:34.064	\N	\N
cmrld6xgv000101los64zddhq	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrld2f2d000701nv6qykgose	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 00:51:21.199	\N	\N
cmrld6zrg000001pb34nfykrs	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrld2f2d000701nv6qykgose	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 00:51:24.172	\N	\N
cmrld71px000201lo8o352ndb	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrld2f2d000701nv6qykgose	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 00:51:26.709	\N	\N
cmrldw2d2000001qr2ig247h8	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrld2f2d000701nv6qykgose	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 01:10:53.942	\N	\N
cmrldw3kr000101qrp1a1yf6j	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrld2f2d000701nv6qykgose	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 01:10:55.515	\N	\N
cmrldwz4v000201qrk4m2ftth	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	ENCOUNTER_DELETED	Encounter	cmrld2f2d000701nv6qykgose	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 01:11:36.415	\N	\N
cmrm7xdu4000301le87ngprbf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:11:43.948	\N	\N
cmrm7xem1000401lekr7kuvpj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:11:44.953	\N	\N
cmrm81jvq000501lekrqyynxy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 2, "expectedVersion": 0}	2026-07-15 15:14:58.407	\N	\N
cmrm81pk8000601lelcx0g18a	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 2, "expectedVersion": 0}	2026-07-15 15:15:05.768	\N	\N
cmrm81xhg000901le4vp7x36f	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:15:16.036	\N	\N
cmrm821q6000a01levs38h1or	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:15:21.534	\N	\N
cmrm82af2000b01lewkdq8nb8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:15:32.798	\N	\N
cmrm83fex000c01lenf01favk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["motivo", "historiaClinica"], "procedure": "update", "currentVersion": 7, "expectedVersion": 6}	2026-07-15 15:16:25.929	\N	\N
cmrm83is2000d01lel36zrowq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:16:30.29	\N	\N
cmrm8513j000f01le525uwlqj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:17:40.687	\N	\N
cmrm851v2000h01le1gb6pedc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:17:41.678	\N	\N
cmrm85j5e000i01lejorrcn5f	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 2, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-15 15:18:04.082	\N	\N
cmrm85xvv000l01ley8ks1vme	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:18:23.179	\N	\N
cmrm86a7h000n01lempb6q7fq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:18:39.149	\N	\N
cmrm86b6k000o01le74e4rj7d	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:18:40.412	\N	\N
cmrm86cop000p01leo258y02x	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmrm8508y000e01lepg5zbuer	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 15:18:42.361	\N	\N
cmrm86g0y000r01lekuakdz6o	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmrm8508y000e01lepg5zbuer	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 15:18:46.69	\N	\N
cmrm86qyt000t01leke4pxccp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:19:00.869	\N	\N
cmrm87v9j000u01le3ve1nook	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:19:53.095	\N	\N
cmrm87wbn000v01leqo7oyxmo	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 15:19:54.467	\N	\N
cmrm87xq6000w01leuzvctxwk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 15:19:56.286	\N	\N
cmrm89t5s000x01lez9xqwge2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:21:23.68	\N	\N
cmrm8a43y000y01lekntrggbf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:21:37.87	\N	\N
cmrm8ac5z000z01le10i50l79	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:21:48.311	\N	\N
cmrm8acg1001001leqkt8yw2p	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:21:48.673	\N	\N
cmrm8acsn001101lebgtatxul	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:21:49.127	\N	\N
cmrm8ak58001201let2ulvgqz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["motivo", "historiaClinica"], "procedure": "update", "currentVersion": 10, "expectedVersion": 9}	2026-07-15 15:21:58.652	\N	\N
cmrm8akbz001301lejdtrvpdi	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:21:58.895	\N	\N
cmrm8bx9i001501le61r0hw9b	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:23:02.31	\N	\N
cmrm8bxmi001601les8prs3vf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:23:02.778	\N	\N
cmrm8byg8001701leliep3mtc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 15:23:03.848	\N	\N
cmrm8bzlg001801leql6gjqia	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 15:23:05.332	\N	\N
cmrm8e99s001901le0sv4we4o	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 15:24:51.184	\N	\N
cmrm8eag9001a01ley8cyo9xx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 15:24:52.713	\N	\N
cmrm8ebdg001b01lejmzdy3x2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:24:53.909	\N	\N
cmrm8ebq3001c01lev1f28kmp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmrm8508y000e01lepg5zbuer	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 15:24:54.363	\N	\N
cmrm8efrs001e01le4b2sx9w0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:24:59.608	\N	\N
cmrm8hgfz001f01lezmqairvf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:27:20.447	\N	\N
cmrm8hvna001g01leroennbsk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:27:40.15	\N	\N
cmrm8hw2z001h01lewug91re5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:27:40.715	\N	\N
cmrm8i0s4001j01lemq606u9k	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Encounter	cmrm7xdp4000201le36m2u7h3	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "plan-suggestion", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "alergiasCount": 0, "diagnosesCount": 1, "fieldsSanitized": 3, "hasExamenFisico": false, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "medicamentosCount": 2, "hasHistoriaClinica": false, "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-15 15:27:46.804	\N	\N
cmrm8k3r4001l01le6spn6s4o	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:29:23.968	\N	\N
cmrm8k40s001m01legkx5jdrm	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Encounter	cmrm7xdp4000201le36m2u7h3	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "plan-suggestion", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "alergiasCount": 0, "diagnosesCount": 1, "fieldsSanitized": 3, "hasExamenFisico": false, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "medicamentosCount": 2, "hasHistoriaClinica": false, "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-15 15:29:24.316	\N	\N
cmrm8keuz001o01le2hltbhmh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Encounter	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "encounter-assist", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "alergiasCount": 0, "diagnosesCount": 1, "fieldsSanitized": 5, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-15 15:29:38.363	\N	\N
cmrm8kvgz001q01lecy3sipj6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Encounter	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "encounter-assist", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "alergiasCount": 0, "diagnosesCount": 1, "fieldsSanitized": 5, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-15 15:29:59.891	\N	\N
cmrm8pgzz001s01lep02o8x2a	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:33:34.415	\N	\N
cmrm8phfw001t01leez4ihpb7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:33:34.988	\N	\N
cmrm8q1xk001w01leka0m9kcd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:34:01.544	\N	\N
cmrm8q3xy001x01leatgdl2e5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrm8q1oq001u01lexa648hq4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-07-15 15:34:04.15	\N	\N
cmrm8v7pk001y01leuai6ts1f	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:38:02.312	\N	\N
cmrm8v87i001z01leyuc318pv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:38:02.958	\N	\N
cmrm8wrev002001le512bxvud	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	AI_PHI_DISCLOSURE	Prescription	\N	\N	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 3, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-15 15:39:14.503	\N	\N
cmrm8wu8k002301leoeeq6peh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:39:18.164	\N	\N
cmrm8xe9d002501lehrto3tvr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:39:44.113	\N	\N
cmrm8xfvn002601leukt29d3e	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:39:46.211	\N	\N
cmrm8xrx5002701leva8z28no	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmrm8508y000e01lepg5zbuer	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 15:40:01.817	\N	\N
cmrm8y3xz002901le0fxdunjr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmrm8508y000e01lepg5zbuer	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 15:40:17.399	\N	\N
cmrm8zxbi002b01len730rmc9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmrm8508y000e01lepg5zbuer	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 15:41:42.126	\N	\N
cmrm8zxxh002d01lez6lzhn8z	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 15:41:42.917	\N	\N
cmrm8zy2i002e01leoferoh1h	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:41:43.098	\N	\N
cmrm8zys3002f01le8scpaqz9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:41:44.019	\N	\N
cmrm8zz95002g01lejz7ff4zz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 15:41:44.633	\N	\N
cmrm900qb002h01lew11zvwuy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmrm8508y000e01lepg5zbuer	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 15:41:46.547	\N	\N
cmrm93ur6002j01le2ipab50y	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:44:45.427	\N	\N
cmrm95alq002k01levhxaboyx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:45:52.622	\N	\N
cmrm95aw8002l01les3zk0onp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:45:53	\N	\N
cmrm95b6z002m01lejh5e7z51	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:45:53.387	\N	\N
cmrm9lihi002n01lennjdo4yj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 15:58:29.334	\N	\N
cmrmahxm0002o01lebvfr7iwa	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 16:23:41.928	\N	\N
cmrmame3v002p01le445jlphe	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 16:27:09.931	\N	\N
cmrmatey7002q01lexjt0qy4k	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 16:32:37.615	\N	\N
cmrmb4xb4002r01lej09kenfz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 16:41:34.624	\N	\N
cmrmb53sk002s01leyycp4oya	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 16:41:43.028	\N	\N
cmrmb5idg002u01lex8bt6c15	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 16:42:01.924	\N	\N
cmrmb5vbc002v01le2xdnp4ho	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrm8q1oq001u01lexa648hq4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 16:42:18.696	\N	\N
cmrmb5vbo002w01leerewhx4e	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 16:42:18.708	\N	\N
cmrmb60fh002x01le4gv6hu7e	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 16:42:25.325	\N	\N
cmrmb6gyz002y01legcnnsm3u	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrm8q1oq001u01lexa648hq4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 16:42:46.763	\N	\N
cmrmb6jri002z01lepej7z74w	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrm8q1oq001u01lexa648hq4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 16:42:50.382	\N	\N
cmrmb6sc0003001leqeri6sei	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 16:43:01.488	\N	\N
cmrmb7aaq003101lexxobbdb2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 16:43:24.77	\N	\N
cmrmbd8co003201leutkv9g62	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 16:48:02.184	\N	\N
cmrmbfqdi003301lejorm6xfl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 16:49:58.854	\N	\N
cmrmbi6dn003401leat5b6tcs	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 16:51:52.907	\N	\N
cmrmbjpic003601lecepvqqar	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 16:53:04.356	\N	\N
cmrmbjqde003701lectgi6tis	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 16:53:05.474	\N	\N
cmrmbjth3003801lemejks65v	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 16:53:09.495	\N	\N
cmrmbjtzy003901le1o3ekfvd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 16:53:10.174	\N	\N
cmrmbjvvt003a01lexxb2edhx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 16:53:12.617	\N	\N
cmrmbjwua003b01lel224pzsz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 16:53:13.858	\N	\N
cmrmbjy3i003c01lemlg8pk3e	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 16:53:15.487	\N	\N
cmrmbknac003d01lens6tiyrn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrm8q1oq001u01lexa648hq4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 16:53:48.132	\N	\N
cmrmbl3wn003e01levp6zb307	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrm8q1oq001u01lexa648hq4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 16:54:09.671	\N	\N
cmrmbr5os003f01le5etgygx2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 16:58:51.916	\N	\N
cmrmbru2x003g01leeknt6otl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 16:59:23.529	\N	\N
cmrmbrudd003h01le37txanaw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 16:59:23.905	\N	\N
cmrmbs0x9003i01lep2e4gx03	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrm8q1oq001u01lexa648hq4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 16:59:32.397	\N	\N
cmrmbs2l6003j01ledsroafge	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrm8q1oq001u01lexa648hq4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 16:59:34.554	\N	\N
cmrmbswvi003k01le8k4x49f6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:00:13.806	\N	\N
cmrmbt6kv003m01leliobuqpp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:00:26.383	\N	\N
cmrmbt70f003n01lea2ecf2a1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:00:26.943	\N	\N
cmrmcn6nh003y01lechl4npt9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:23:46.157	\N	\N
cmrmcrix0004901leziwyg2m7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:27:08.676	\N	\N
cmrmcuot7004m01le5oq6kahu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrmcomep004401leo1dxiu3q	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 17:29:36.283	\N	\N
cmrmcupno004o01le4rs30unr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrmcomep004401leo1dxiu3q	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.97.237.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 17:29:37.38	\N	\N
cmrmczln8004w01letqn4f139	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:33:25.46	\N	\N
cmrmczmu2004x01lehm2z0mqe	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:33:27.002	\N	\N
cmrmczn8p004z01lejn29tugq	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-15 17:33:27.529	\N	\N
cmrmd5u5f005y01legibyar1o	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	PASSWORD_CHANGED	Patient	cmr0pml99001z01mogxs7wdnf	cmr0pml99001z01mogxs7wdnf	ALLOWED	\N	\N	\N	UI	{"channel": "PORTAL_RESET"}	2026-07-15 17:38:16.419	\N	\N
cmrmp4rvx006801leu7vmwibk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_DOCUMENT	Document	cmrmcomep004401leo1dxiu3q	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-15 23:13:22.221	\N	\N
cmrmqsvnw000101lo5ll4qi9a	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:00:06.476	\N	\N
cmrmr5jk6000b01loy555l2pm	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:09:57.319	\N	\N
cmrmrbw60000401row2mrijyk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:14:53.592	\N	\N
cmrmrlhp6000401o5ko4khp2u	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:22:21.402	\N	\N
cmrmrujw5000n01o5r2ahqupm	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:29:24.149	\N	\N
cmrmrx1sr000v01o51dwx0cgz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:31:20.667	\N	\N
cmrms91g1001801o53x9hgi6e	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:40:40.081	\N	\N
cmrmsgnyy001g01o5z2ljx2ou	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:46:35.866	\N	\N
cmrmswd9j000801nl8bzedz94	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:58:48.488	\N	\N
cmrmswdw7000a01nlxjvakj0k	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 00:58:49.303	\N	\N
cmrmti9u3000301o6f9he9905	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:15:50.475	\N	\N
cmrmtzsld000401o0vqml2d7r	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:29:27.937	\N	\N
cmrmtzvk5000501o0l6kyg1fo	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 01:29:31.781	\N	\N
cmrmugtwp000301skyku6h9hr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:42:42.793	\N	\N
cmrmuv4c6000e01sk95a9764z	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 01:53:49.494	\N	\N
cmrmv9dtq000301o4rwgp29ag	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmbjpaq003501le166cy8gm	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:04:54.974	\N	\N
cmrmvrnvq001t01o4mqrorc7c	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:19:07.814	\N	\N
cmrmvro3f001u01o494i21j0z	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:19:08.091	\N	\N
cmrmvrog7001v01o48vlht9ca	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:19:08.551	\N	\N
cmrmvtpsf001x01o4snkfksec	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:20:43.6	\N	\N
cmrmvtq0f001y01o47fy7btny	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:20:43.887	\N	\N
cmrmvtvsw001z01o4vas5o202	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:20:51.392	\N	\N
cmrmvtw0d002001o4rdjhngob	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:20:51.661	\N	\N
cmrmvtw7d002101o40xj4hcva	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:20:51.913	\N	\N
cmrmvu1yx002301o4s3sj8vgp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:20:59.385	\N	\N
cmrmvu26h002401o4564z821v	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:20:59.657	\N	\N
cmrmvu4dg002501o4s4pk8zir	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 02:21:02.5	\N	\N
cmrmvuesz002601o4hqoz7t2x	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:21:16.019	\N	\N
cmrmvuj2v002701o431ipdtgc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:21:21.559	\N	\N
cmrmvuos8002801o46z14fmvk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:21:28.952	\N	\N
cmrmvvlxe002901o4a2usmrx5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:22:11.906	\N	\N
cmrmvvma4002a01o4222x1xcn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:22:12.364	\N	\N
cmrmvvmkq002b01o49x12jnjh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:22:12.746	\N	\N
cmrmvzaba000201p7bvnqqvza	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:25:03.478	\N	\N
cmrmvzagk000301p7cn9luq2t	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:25:03.668	\N	\N
cmrmvzbjt000401p7jl7x3ghs	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:25:05.081	\N	\N
cmrmvzgr2000501p7s2bi7r2f	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:25:11.822	\N	\N
cmrmvzhk6000601p7ritvs9jt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:25:12.87	\N	\N
cmrmvzn22000701p74zpmo2d8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:25:19.994	\N	\N
cmrmvznax000801p7i30cxaiu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:25:20.313	\N	\N
cmrmvznji000901p7kuyt8dyu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:25:20.622	\N	\N
cmrmvzuu9000a01p76tf1j3ez	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:25:30.081	\N	\N
cmrmvzv37000b01p7k8l9o45m	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:25:30.404	\N	\N
cmrmvzwrj000d01p7ocr5mkj7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:25:32.576	\N	\N
cmrmvzwzd000e01p7f38fz2p5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:25:32.857	\N	\N
cmrmvzyap000f01p7tcvbzvl7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 02:25:34.561	\N	\N
cmrmw08lk000g01p7vbgjs4v4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:25:47.912	\N	\N
cmrmw09qm000h01p774isps2i	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:25:49.39	\N	\N
cmrmw0adr000i01p79vjf125g	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:25:50.223	\N	\N
cmrmw0bkr000j01p7cy1e3hzl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 02:25:51.771	\N	\N
cmrmw1epv000k01p7tdvmtynf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:26:42.499	\N	\N
cmrmw1grs000l01p78g50ylrg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:26:45.16	\N	\N
cmrmw1m3g000m01p7uk3fsirs	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:26:52.06	\N	\N
cmrmw1m77000n01p7nha2vilx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:26:52.195	\N	\N
cmrmw1muh000o01p7ppdhzg7k	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:26:53.034	\N	\N
cmrmw1nwg000p01p705yu05r2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 02:26:54.4	\N	\N
cmrmw271u000q01p7dz2cftb8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:27:19.218	\N	\N
cmrmw2liv000s01p75fwk8fwe	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:27:37.975	\N	\N
cmrmw2lsy000t01p7brtxwhui	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:27:38.338	\N	\N
cmrmw2pxq000u01p7yijzo9xk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:27:43.694	\N	\N
cmrmw2wtx000w01p7wtfi7r3b	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2wqn000v01p7md52ozlv	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:27:52.629	\N	\N
cmrmw2x4t000x01p75bxr0vb5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2wqn000v01p7md52ozlv	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:27:53.021	\N	\N
cmrmw37pg000y01p772og5zrn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2wqn000v01p7md52ozlv	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:28:06.724	\N	\N
cmrmw37pm000z01p7n19qz715	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2wqn000v01p7md52ozlv	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:28:06.73	\N	\N
cmrmw4ukq001001p741h2guaz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:29:23.018	\N	\N
cmrmw51xy001101p7ad6sr03l	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2wqn000v01p7md52ozlv	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:29:32.566	\N	\N
cmrmw5ufu001301p7hg3ar3ub	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:30:09.498	\N	\N
cmrmw5uoj001401p7m5sqfs7o	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:30:09.811	\N	\N
cmrmw62yv001501p7s6wn05qr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:30:20.551	\N	\N
cmrmw631w001601p7ujwmjpw2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:30:20.66	\N	\N
cmrmw7dbz001701p7znz520p0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2wqn000v01p7md52ozlv	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:31:20.639	\N	\N
cmrmwaqcg000001pevpyf32qk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2wqn000v01p7md52ozlv	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:33:57.472	\N	\N
cmrmwaxbr000101pel6iwvuds	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2wqn000v01p7md52ozlv	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:34:06.519	\N	\N
cmrmwb31f000201pek6z9v7t1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:34:13.923	\N	\N
cmrmwb5hw000301pev0r23fl9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:34:17.109	\N	\N
cmrmwb64u000401pegek20ytv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:34:17.934	\N	\N
cmrmwb8oe000501pepnnjkqmg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:34:21.23	\N	\N
cmrmwb8xz000601pe5rmbs1sq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:34:21.575	\N	\N
cmrmwb9fc000701petj5lfqwr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:34:22.2	\N	\N
cmrmwb9lx000801peaqbmh69v	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:34:22.438	\N	\N
cmrmwbdcb000901pegqkxrg36	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 02:34:27.275	\N	\N
cmrmwbe5z000a01peof2l6koq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:34:28.343	\N	\N
cmrmwbebp000b01pelp5pketv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:34:28.549	\N	\N
cmrmwbehp000c01pefc6eh4te	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:34:28.765	\N	\N
cmrmwbge6000e01pefuoxc710	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:34:31.23	\N	\N
cmrmwbgji000f01pem0shhtla	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:34:31.422	\N	\N
cmrmwbhrd000g01peeq1to4bo	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 02:34:33.001	\N	\N
cmrmwcsgv000h01pe3hilz3tz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:35:33.535	\N	\N
cmrmwcxou000i01peg62n2cvv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:35:40.302	\N	\N
cmrmwdhrl000j01pef8fvgcl6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:36:06.321	\N	\N
cmrmwdjpt000k01peepk7cr1g	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:36:08.85	\N	\N
cmrmwe5n3000l01pez6vcry3c	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:36:37.263	\N	\N
cmrmwe5xr000m01pe83ycbafg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:36:37.647	\N	\N
cmrmwec5j000n01pex4l6no5i	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:36:45.703	\N	\N
cmrmwecdj000o01peds8f6m2m	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:36:45.991	\N	\N
cmrmwesh3000p01peh5cnp2j0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:37:06.855	\N	\N
cmrmwesrn000q01pemhhtiml9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:37:07.235	\N	\N
cmrmwet2t000r01pexcgfj1q0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:37:07.637	\N	\N
cmrmwfidw000t01peas5gw6z9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:37:40.436	\N	\N
cmrmwfilg000u01pe1vtp61rj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:37:40.709	\N	\N
cmrmwfkua000v01pel499ifbd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 02:37:43.618	\N	\N
cmrmwfuiw000w01pehq6tlawg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:37:56.168	\N	\N
cmrmwfwbs000x01peklcimgpv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:37:58.504	\N	\N
cmrmwfwk5000y01pekzhlgfdm	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:37:58.805	\N	\N
cmrmwfwsk000z01peak1lboyn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:37:59.109	\N	\N
cmrmwg18m001101pe3gu9cap5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:38:04.87	\N	\N
cmrmwg1i2001201peqm5ws3zk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:38:05.21	\N	\N
cmrmwg2oh001301pebjl0zb8u	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 02:38:06.737	\N	\N
cmrmwgexy001401pe45krgdm7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:38:22.63	\N	\N
cmrmwgi69001501pehghfp3wi	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:38:26.817	\N	\N
cmrmwgmtq001601pee840yuqw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:38:32.846	\N	\N
cmrmwgn6w001701peeq31rao3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:38:33.32	\N	\N
cmrmwgnfp001801petkz2ts8s	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:38:33.637	\N	\N
cmrmwiutw001a01pel0w07f06	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:40:16.532	\N	\N
cmrmwiv30001b01pephume71t	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:40:16.86	\N	\N
cmrmwiwsm001c01pe1p31ekhm	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 02:40:19.078	\N	\N
cmrmwkrap001d01peu9urlnjg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:41:45.265	\N	\N
cmrmwl798001e01pevc7r8zob	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:42:05.948	\N	\N
cmrmwl7hs001f01pelct4pxr9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:42:06.256	\N	\N
cmrmwl7pz001g01pe00o1x3bn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:42:06.552	\N	\N
cmrmwld4f001i01pe6yeccoiv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:42:13.551	\N	\N
cmrmwldbl001j01pe9apoqkvu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:42:13.809	\N	\N
cmrmwlelr001k01pemeqpmv52	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 02:42:15.471	\N	\N
cmrmwyjno000001r2n0f177tv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_INVOICE	Invoice	cmqn8k5k4000201mgbdbvmf3r	cmqlt50p2000801qgnzs5ydvv	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 02:52:28.548	\N	\N
cmrmx0733000101r29ezl56as	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:53:45.567	\N	\N
cmrmx07al000201r24f75kn2a	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:53:45.837	\N	\N
cmrmx3yf4000001nojt0aezyd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:56:40.961	\N	\N
cmrmx41p2000101no0s7ax6w8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:56:45.206	\N	\N
cmrmx41y8000201no3ovhkvat	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:56:45.536	\N	\N
cmrmx425b000301no5q3pwqde	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:56:45.791	\N	\N
cmrmx42q1000401nozbl67bko	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:56:46.537	\N	\N
cmrmx44qh000501noj5yz9see	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:56:49.145	\N	\N
cmrmx45it000601no38h06fpl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:56:50.165	\N	\N
cmrmx47po000701nocdxta6gv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:56:53.004	\N	\N
cmrmx47v3000801noqsousslu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:56:53.199	\N	\N
cmrmx491n000901nof17a6nhn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:56:54.731	\N	\N
cmrmx498a000a01nou46wq2x3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:56:54.97	\N	\N
cmrmx49ee000b01nouwhgif6b	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:56:55.19	\N	\N
cmrmx49rq000d01no6kowwu7u	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:56:55.67	\N	\N
cmrmx4a0v000e01nouqexrvyc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:56:55.999	\N	\N
cmrmx4arf000g01noke7toge2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:56:56.955	\N	\N
cmrmx4awa000h01no5b4vi384	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:56:57.13	\N	\N
cmrmx4bq6000i01no0zr2qmwn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 02:56:58.206	\N	\N
cmrmx4brv000j01nol2qulh1o	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 02:56:58.267	\N	\N
cmrmx6tdm000k01nonftxr1zx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:58:54.394	\N	\N
cmrmx6wps000l01nobgrc1enj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:58:58.72	\N	\N
cmrmx6wyn000m01nozojti1eg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:58:59.039	\N	\N
cmrmx6x7v000n01no9vlqf7rj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 02:58:59.371	\N	\N
cmrmxkm16000001l40qsebq5m	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:09:38.059	\N	\N
cmrmxqhcn000401l4b75h4xsw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:14:11.927	\N	\N
cmrmxqhov000501l45w7s9g49	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:14:12.367	\N	\N
cmrmxqiu1000601l4qkngf0gn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:14:13.849	\N	\N
cmrmxqlb1000701l478fmk14u	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:14:17.053	\N	\N
cmrmxqlic000801l4sunhy8th	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:14:17.316	\N	\N
cmrmxqloc000901l4tkefbdg6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:14:17.532	\N	\N
cmrmxqm0t000a01l44odkqa2h	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:14:17.981	\N	\N
cmrmxqnc4000c01l4x81bzc7k	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:14:19.684	\N	\N
cmrmxqnhl000d01l4a5ylqko6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:14:19.881	\N	\N
cmrmxqolt000e01l43qpia5nd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 03:14:21.329	\N	\N
cmrmxqwmu000f01l4s40z6siw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:14:31.734	\N	\N
cmrmxvh8o000g01l4myevgb50	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:18:05.064	\N	\N
cmrmxwkj8000h01l4ma8ym0i8	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	PASSWORD_CHANGED	Patient	cmr0pml99001z01mogxs7wdnf	cmr0pml99001z01mogxs7wdnf	ALLOWED	\N	\N	\N	UI	{"channel": "PORTAL_RESET"}	2026-07-16 03:18:55.988	\N	\N
cmrmxwqkl000i01l4w34rbngl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:19:03.813	\N	\N
cmrmxypm1000j01l40v7tqzkw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:20:35.881	\N	\N
cmrmxzocg000l01l4ip4j45fm	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:21:20.896	\N	\N
cmrmxzx8u000m01l4nwoll6mf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:21:32.43	\N	\N
cmrmy001l000n01l4m7bv580x	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:21:36.057	\N	\N
cmrmy02qp000o01l4pf3ps4h6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:21:39.553	\N	\N
cmrmy0945000p01l4nfq133o4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:21:47.813	\N	\N
cmrmy1mey000r01l4ocijxhcb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:22:51.706	\N	\N
cmrmy1s4a000t01l4qey0naq6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:22:59.098	\N	\N
cmrmy22wt000u01l4j9nzhxhn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:23:13.085	\N	\N
cmrmy264f000v01l46dan6oj6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:23:17.247	\N	\N
cmrmy2aas000w01l4haiimo6b	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:23:22.66	\N	\N
cmrmy2ce4000x01l48mj0hism	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:23:25.372	\N	\N
cmrmy2enu000y01l4321aglua	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:23:28.314	\N	\N
cmrmy2yll000z01l4hrrkajre	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:23:54.153	\N	\N
cmrmy371w001001l4fygi286o	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:24:05.108	\N	\N
cmrmy3bsc001101l40uboucw4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:24:11.244	\N	\N
cmrmy3f5l001201l4u1krgwnk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:24:15.609	\N	\N
cmrmy3h8f001301l4berrze8u	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:24:18.303	\N	\N
cmrmy3kxk001401l4hhv607ey	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:24:23.096	\N	\N
cmrmy3nfh001501l4vueg73cu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:24:26.333	\N	\N
cmrmy3qip001601l4v0eswwjx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:24:30.337	\N	\N
cmrmy3un4001701l4jwz9jb4m	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:24:35.68	\N	\N
cmrmy3xt8001801l4cfsjs4ms	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:24:39.788	\N	\N
cmrmy41q7001901l4skc0fy8g	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:24:44.863	\N	\N
cmrmy4hmc001l01l4364iqojo	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:25:05.46	\N	\N
cmrmy4l7n001m01l43bj78565	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:25:10.115	\N	\N
cmrmy4sta001n01l483w9ax8h	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:25:19.966	\N	\N
cmrmy4wso001o01l4nca9ay7z	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:25:25.128	\N	\N
cmrmy51p6001p01l4nhb64mpq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:25:31.482	\N	\N
cmrmy6295001q01l4gp2wr9pa	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:26:18.857	\N	\N
cmrmy6jec001r01l4xtecb539	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:26:41.076	\N	\N
cmrmy6jkm001s01l47su9dd3s	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:26:41.302	\N	\N
cmrmy6ldz001u01l44kxm3oq7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:26:43.655	\N	\N
cmrmy6lja001v01l4x0ut8r98	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:26:43.846	\N	\N
cmrmy6q2k001w01l4ega8v3j9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:26:49.724	\N	\N
cmrmy6q8f001x01l4lf41r4t2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:26:49.935	\N	\N
cmrmy6twi002001l42lzhnxoy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:26:54.691	\N	\N
cmrmy6vcx002201l4pyt0lopi	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:26:56.577	\N	\N
cmrmy6vl9002301l426rx18xz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:26:56.877	\N	\N
cmrmy6wcv002401l4b6wmoq9t	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 03:26:57.871	\N	\N
cmrmy8wha002501l4wtt6yk3w	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:28:31.342	\N	\N
cmrmya322002601l4cijnxkvs	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:29:26.522	\N	\N
cmrmydtcz000001qk751fnrpx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmxqh83000301l4r0h0ptoh	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:32:20.58	\N	\N
cmrmyi222000401qk7ap6rxg0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmyi1yv000301qkbohrm1tb	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:35:38.474	\N	\N
cmrmyi2h6000501qksagcrz92	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmyi1yv000301qkbohrm1tb	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:35:39.018	\N	\N
cmrmyiocu000701qk24z0ooom	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmyi1yv000301qkbohrm1tb	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:36:07.374	\N	\N
cmrmyioob000801qkja4p773r	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmyi1yv000301qkbohrm1tb	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:36:07.788	\N	\N
cmrmyj137000901qklydacjos	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrmyi1yv000301qkbohrm1tb	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:36:23.875	\N	\N
cmrmyj1gq000a01qkbiky0nx9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmyi1yv000301qkbohrm1tb	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:36:24.362	\N	\N
cmrmyj1nv000b01qkrz9vqmca	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmyi1yv000301qkbohrm1tb	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:36:24.619	\N	\N
cmrmyj7b1000e01qkdwoazcr0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmyi1yv000301qkbohrm1tb	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:36:31.933	\N	\N
cmrmyjbg0000f01qkvkuycn3e	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrmyj74x000c01qk89u0djn4	cmrmyhl95000201qk048pvbah	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	PDF	\N	2026-07-16 03:36:37.296	\N	\N
cmrmyka6a000g01qk2h42bnbb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmyi1yv000301qkbohrm1tb	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:37:22.306	\N	\N
cmrmym77j000h01qkyak3a6o8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmyi1yv000301qkbohrm1tb	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:38:51.775	\N	\N
cmrmym7em000i01qkkzgjj7kv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmyi1yv000301qkbohrm1tb	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:38:52.03	\N	\N
cmrmyme1g000j01qku1j9407v	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrmyj74x000c01qk89u0djn4	cmrmyhl95000201qk048pvbah	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 03:39:00.628	\N	\N
cmrmymnxu000k01qkdjd5wmqd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmyi1yv000301qkbohrm1tb	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:39:13.458	\N	\N
cmrmympjz000l01qkhd3qdsnn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmyi1yv000301qkbohrm1tb	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:39:15.551	\N	\N
cmrmymt9g000m01qkhe8nsq7r	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:39:20.356	\N	\N
cmrmymtj5000n01qktxe9t6gg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:39:20.705	\N	\N
cmrmyn2sv000o01qkhvfamjqw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:39:32.719	\N	\N
cmrmyncrg000p01qkkvg3eatx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:39:45.628	\N	\N
cmrmynczk000q01qk3wzpekja	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:39:45.92	\N	\N
cmrmynd8d000r01qk8rnm3dlw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:39:46.237	\N	\N
cmrn0kmtv000w01o7jewehyzy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:33:37.939	\N	\N
cmrmyneg1000s01qkobonuzgi	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrmvggir001401o4w6c3kwdp	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 03:39:47.809	\N	\N
cmrmyni5p000t01qkgaat1r3y	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:39:52.621	\N	\N
cmrmyot3y000u01qk80u2ufuw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrmvggir001401o4w6c3kwdp	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 03:40:53.47	\N	\N
cmrmyp5hc000v01qk1lw3ty1u	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmyi1yv000301qkbohrm1tb	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:41:09.504	\N	\N
cmrmyp63v000w01qkj978aewp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmyi1yv000301qkbohrm1tb	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:41:10.315	\N	\N
cmrmypqyb000x01qkx9kkiund	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmyi1yv000301qkbohrm1tb	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:41:37.331	\N	\N
cmrmyprdx000y01qkc5qfabr4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmyi1yv000301qkbohrm1tb	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:41:37.893	\N	\N
cmrmyq735000z01qka6r79jgp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:41:58.241	\N	\N
cmrmyq794001001qkhfjp06w0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:41:58.456	\N	\N
cmrmyqexv001101qkuwb8iymg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrmvggir001401o4w6c3kwdp	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 03:42:08.419	\N	\N
cmrmyqkfj001201qk0y9mz36q	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:42:15.535	\N	\N
cmrmyqtac001301qkdh9jh510	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:42:27.012	\N	\N
cmrmyrkt4001401qkpxnzzbkz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:43:02.68	\N	\N
cmrmz7rc0000001o7ug7cciyl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:55:37.632	\N	\N
cmrmz7t0h000101o7o0mnllof	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:55:39.809	\N	\N
cmrmz7tss000201o73ngdkgam	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:55:40.828	\N	\N
cmrmz8okt000301o7mg4dskl4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:56:20.717	\N	\N
cmrmz8qn0000401o7we73tfzf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:56:23.388	\N	\N
cmrmz8rji000501o74ynqy2zz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 03:56:24.558	\N	\N
cmrmzx99c000801o7gt9fqbvr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:15:27.264	\N	\N
cmrmzx9jf000901o7h473v9h1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:15:27.627	\N	\N
cmrn04vpu000e01o7q7bbt4dl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:21:22.962	\N	\N
cmrn04zn9000g01o7gfn2g31k	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:21:28.053	\N	\N
cmrn04zv1000h01o7fs6wzg9y	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:21:28.333	\N	\N
cmrn051go000i01o70dldpod3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 04:21:30.408	\N	\N
cmrn05j0o000j01o73xt1302m	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:21:53.16	\N	\N
cmrn0cnw9000o01o724e41scn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmr3mbcnd000z01mv5adnn09g	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:27:26.073	\N	\N
cmrn0d3x1000p01o7w5ucmfbr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:27:46.837	\N	\N
cmrn0d459000q01o7k8ztta8e	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:27:47.133	\N	\N
cmrn0dlun000r01o7pjxir4mb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:28:10.079	\N	\N
cmrn0dm0c000s01o76zj9husn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:28:10.284	\N	\N
cmrn0dri7000t01o74klpz4fb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:28:17.407	\N	\N
cmrn0drij000u01o7u1xtl7sx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:28:17.419	\N	\N
cmrn0kmos000v01o7e0ltv2v1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["historiaClinica"], "procedure": "update", "currentVersion": 17, "expectedVersion": 16}	2026-07-16 04:33:37.756	\N	\N
cmrn0mdsg000x01o7yyp29456	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["examenFisico"], "procedure": "update", "currentVersion": 21, "expectedVersion": 20}	2026-07-16 04:34:59.536	\N	\N
cmrn0mdxk000y01o7bt9kr2ib	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:34:59.72	\N	\N
cmrn0phi3000z01o7gmuvwwsd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:37:24.315	\N	\N
cmrn0u4w0001001o72yocr60m	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:41:01.248	\N	\N
cmrn0u86u001101o7nv0n3sfi	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:41:05.526	\N	\N
cmrn0umgc001201o7lwbompg0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:41:24.012	\N	\N
cmrn0uy0b001301o7ixqw2po1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:41:38.987	\N	\N
cmrn0v0rx001401o7jb8awvbn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:41:42.573	\N	\N
cmrn0vcq6001501o7e2558ms3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:41:58.062	\N	\N
cmrn0vjn0001601o7nhxd3l6o	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:42:07.027	\N	\N
cmrn0vupf001701o7uigzzsjp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:42:21.363	\N	\N
cmrn0vxrb001801o7ebn0mgtq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:42:25.319	\N	\N
cmrn0wprd001901o7xdt68jv0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:43:01.609	\N	\N
cmrn0wx6g001a01o7couoagg2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:43:11.224	\N	\N
cmrn0x4t5001b01o7a8lrj1qt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:43:21.113	\N	\N
cmrn0x7jw001c01o7eqs2oylq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:43:24.668	\N	\N
cmrn0xa3r001d01o77bn2gvvt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:43:27.975	\N	\N
cmrn0xev1001e01o7yszvaf1s	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:43:34.141	\N	\N
cmrn0xhv3001f01o77qr7cd80	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:43:38.031	\N	\N
cmrn0xjab001g01o7y9gtuct0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:43:39.875	\N	\N
cmrn0xmel001h01o7wodl5svz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:43:43.917	\N	\N
cmrn0xp7k001i01o7mgc1g2oe	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:43:47.552	\N	\N
cmrn0xv34001j01o7vtzfd30t	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:43:55.168	\N	\N
cmrn0xx6r001k01o7wu6yzdab	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:43:57.891	\N	\N
cmrn0y66m001l01o7sem0oy0y	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 53, "expectedVersion": 21}	2026-07-16 04:44:09.55	\N	\N
cmrn0z7od001o01o7tqo4e6wh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrn0z7kd001n01o75z5xijxo	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:44:58.141	\N	\N
cmrn0z7ug001p01o7vboitalv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrn0z7kd001n01o75z5xijxo	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:44:58.36	\N	\N
cmrn0zc7i001q01o7u4gha03z	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrn0z7kd001n01o75z5xijxo	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:45:04.014	\N	\N
cmrn0zc9b001r01o70zqap71b	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrn0z7kd001n01o75z5xijxo	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:45:04.079	\N	\N
cmrn0zisf001s01o7qhu2dh9u	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrn0z7kd001n01o75z5xijxo	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:45:12.543	\N	\N
cmrn0zit3001t01o769xjsfkn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrn0z7kd001n01o75z5xijxo	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:45:12.567	\N	\N
cmrn0zu22001u01o7l4tjcj9j	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:45:27.146	\N	\N
cmrn0zu8f001v01o72vjquj60	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:45:27.375	\N	\N
cmrn1353s001w01o7eaob90ml	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:48:01.432	\N	\N
cmrn135bf001x01o7djnrj7bx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:48:01.707	\N	\N
cmrn13c11001y01o7e6vdpipc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:48:10.405	\N	\N
cmrn13c6p001z01o7ooqxxtij	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:48:10.609	\N	\N
cmrn13ecj002001o73n6gqzx8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:48:13.411	\N	\N
cmrn13ei0002101o73avg7s4x	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:48:13.608	\N	\N
cmrn13h0u002201o7zdyd68j0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2wqn000v01p7md52ozlv	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:48:16.878	\N	\N
cmrn13h8n002301o7vocp2sh1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2wqn000v01p7md52ozlv	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:48:17.159	\N	\N
cmrn13k66002401o7v5alqpzh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:48:20.958	\N	\N
cmrn13kby002501o7oifboef8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:48:21.166	\N	\N
cmrn17x73002601o7uz7ewryl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:51:44.463	\N	\N
cmrn182n7002701o78vkj6zfj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:51:51.524	\N	\N
cmrn183j0002801o79y4b1cyl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:51:52.668	\N	\N
cmrn185zs002901o7e4kikhjv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:51:55.864	\N	\N
cmrn186i4002a01o7k2rvqa2r	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:51:56.524	\N	\N
cmrn18eck002b01o7qt7v7aai	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:52:06.692	\N	\N
cmrn18edd002c01o77u1s7doi	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 04:52:06.721	\N	\N
cmrn1t1xj002d01o7cjxnrwcu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 05:08:10.375	\N	\N
cmrnhh8de000101o2kwpi664h	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnhh87k000001o21298jisc	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 12:26:52.706	\N	\N
cmrnhh8qh000a01s7uzbero7h	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnhh87k000001o21298jisc	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 12:26:53.177	\N	\N
cmrnhioq6000b01s73k5nlb7q	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnhh87k000001o21298jisc	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 12:28:00.558	\N	\N
cmrnhjdfr000c01s7ay7v68vp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnhh87k000001o21298jisc	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 12:28:32.583	\N	\N
cmrnhlwpp000d01s7sfesb2ry	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnhh87k000001o21298jisc	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 12:30:30.877	\N	\N
cmrnhzb3x000001uhpscdqlaz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnhh87k000001o21298jisc	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 12:40:56.062	\N	\N
cmrnhzc5q000101uhj85fy01q	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnhh87k000001o21298jisc	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 12:40:57.422	\N	\N
cmrnhzcyd000201uh99pa60z2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnhh87k000001o21298jisc	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 12:40:58.453	\N	\N
cmrnisb5t000301uhl3jn05qy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnhh87k000001o21298jisc	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:03:29.153	\N	\N
cmrnj6yy9000001pydamzn6av	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnhh87k000001o21298jisc	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:14:53.169	\N	\N
cmrnj8qg6000101py9vjd8klk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnhh87k000001o21298jisc	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:16:15.462	\N	\N
cmrnj8wcm000201py1jb4yesm	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:16:23.11	\N	\N
cmrnj8xiu000301py39rffi6x	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:16:24.63	\N	\N
cmrnj8ygf000001nwpo9fisff	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:16:25.839	\N	\N
cmrnj9nnb000101nwodecz45i	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:16:58.487	\N	\N
cmrnj9p6x000201nwzsb82jp9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:17:00.489	\N	\N
cmrnja4rd000301nw0d1a05vf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:17:20.665	\N	\N
cmrnja53z000401nwmwn5m30a	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:17:21.119	\N	\N
cmrnja6eb000501nwi5hwx3w3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:17:22.787	\N	\N
cmrnja6ow000601nwtd1nqwgf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:17:23.168	\N	\N
cmrnjadz7000701nw7epkkfq0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnhh87k000001o21298jisc	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:17:32.611	\N	\N
cmrnjae56000801nwfrzx8muz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnhh87k000001o21298jisc	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:17:32.826	\N	\N
cmrnjafoa000901nw0slh7prt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:17:34.81	\N	\N
cmrnjafu3000a01nwvikr0vgl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:17:35.019	\N	\N
cmrnjalc3000b01nwwtl2gvtb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2wqn000v01p7md52ozlv	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:17:42.147	\N	\N
cmrnjalhc000c01nw0dr2b7g3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2wqn000v01p7md52ozlv	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:17:42.336	\N	\N
cmrnjapgl000d01nw5fr7q38i	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:17:47.493	\N	\N
cmrnjaplu000e01nw1ghd65of	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:17:47.682	\N	\N
cmrnje5r7000f01nwqf9clifx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:20:28.579	\N	\N
cmrnjenly000g01nwaq4dlf3y	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnhh87k000001o21298jisc	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:20:51.718	\N	\N
cmrnjensy000h01nw0co1sh8a	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnhh87k000001o21298jisc	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:20:51.97	\N	\N
cmrnjepsf000i01nwy77epe4d	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:20:54.543	\N	\N
cmrnjepz8000j01nwoas1hwsw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:20:54.788	\N	\N
cmrnjetbn000k01nwogfcqdp8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnhh87k000001o21298jisc	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:20:59.123	\N	\N
cmrnjethi000l01nwdlhyp0hj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnhh87k000001o21298jisc	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:20:59.334	\N	\N
cmrnjf0j3000m01nw85cejape	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_DELETED	Encounter	cmrnhh87k000001o21298jisc	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:21:08.463	\N	\N
cmrnjf1r6000n01nwhk6u51aq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:21:10.05	\N	\N
cmrnjf1xc000o01nwruseev2r	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:21:10.272	\N	\N
cmrnjf80k000p01nwu5uwjxtw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_DELETED	Encounter	cmrmw5u7r001201p7x0w3dg5a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:21:18.164	\N	\N
cmrnjf971000q01nw65cow5bd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2wqn000v01p7md52ozlv	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:21:19.693	\N	\N
cmrnjf9cz000r01nwt9k53piz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2wqn000v01p7md52ozlv	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:21:19.907	\N	\N
cmrnjflsd000s01nwnf77dtq4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_DELETED	Encounter	cmrmw2wqn000v01p7md52ozlv	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:21:36.013	\N	\N
cmrnjfmz3000t01nwpcc3qu72	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:21:37.551	\N	\N
cmrnjfn5a000u01nwffa5int0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:21:37.775	\N	\N
cmrnjfsa5000v01nwgykfxi7t	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:21:44.43	\N	\N
cmrnjfsgb000w01nwa3q7u0k6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:21:44.651	\N	\N
cmrnjfx4z000x01nwjdchiofl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:21:50.723	\N	\N
cmrnjfxaj000y01nw8hg9p3ih	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:21:50.923	\N	\N
cmrnjtx8g000001op2xjabuqc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:32:44.034	\N	\N
cmrnjtxdh000101opor1exkit	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:32:44.213	\N	\N
cmrnjtxu8000201op8bjt4p2i	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:32:44.816	\N	\N
cmrnjw0js000501op4qk30uh4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnjw0gn000401opralnsx34	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:34:21.64	\N	\N
cmrnjw0qc000601opkfsshkze	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnjw0gn000401opralnsx34	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:34:21.876	\N	\N
cmrnjw45e000701oprt48lqfi	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnjw0gn000401opralnsx34	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:34:26.306	\N	\N
cmrnjw45v000801opoy6xgjic	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnjw0gn000401opralnsx34	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:34:26.323	\N	\N
cmrnk2ltk000901op0y8h0rhs	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnjw0gn000401opralnsx34	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:39:29.144	\N	\N
cmrnk2tjc000a01opaya3b8yv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_DELETED	Encounter	cmrnjw0gn000401opralnsx34	cmrmyhl95000201qk048pvbah	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 13:39:39.144	\N	\N
cmrnkygex000001lyd8o746pk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	PATIENT_AUTOFILL_FROM_OTHER_WORKSPACE	Patient	\N	\N	ALLOWED	\N	\N	\N	API	{"hmacCedulaPrefix": "20bWiB7g"}	2026-07-16 14:04:15.129	\N	\N
cmrnkyky8000101lyjw6rfx4a	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	PATIENT_AUTOFILL_FROM_OTHER_WORKSPACE	Patient	\N	\N	ALLOWED	\N	\N	\N	API	{"hmacCedulaPrefix": "20bWiB7g"}	2026-07-16 14:04:21.008	\N	\N
cmrnkyz46000201lyx8yq2wqh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr7ygjy9000g01mpw0hcawcx	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:04:39.366	\N	\N
cmrnkyzmp000301lydy9bpqmw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr7ygjy9000g01mpw0hcawcx	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:04:40.033	\N	\N
cmrnkze1l000501lyfln31s8m	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:04:58.713	\N	\N
cmrnkzebj000601lyg2ystqsr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:04:59.071	\N	\N
cmrnkzjql000701lynaxm3yxf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:05:06.093	\N	\N
cmrnkzjqw000801ly7v5uq7xw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:05:06.104	\N	\N
cmrnl1vle000901lynfiecze2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["motivo", "historiaClinica"], "procedure": "update", "currentVersion": 9, "expectedVersion": 8}	2026-07-16 14:06:54.77	\N	\N
cmrnl1vrx000a01lyrtu2ti75	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:06:55.005	\N	\N
cmrnl7h9s000c01lywkt3l8m8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:11:16.144	\N	\N
cmrnl81rn000e01lyjo6o9p2g	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:11:42.707	\N	\N
cmrnl8hel000g01lydz3aobs9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:12:02.973	\N	\N
cmrnl8z5z000i01lym4x9tq92	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:12:25.991	\N	\N
cmrnl9ijc000j01ly3w8ek4dy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:12:51.096	\N	\N
cmrnl9pf2000k01lyrkjc1ezr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:13:00.014	\N	\N
cmrnl9s9j000l01lymjdhip6f	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:13:03.703	\N	\N
cmrnl9u4x000m01lytr373nzr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:13:06.129	\N	\N
cmrnl9wgd000n01lyoff2olg6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:13:09.133	\N	\N
cmrnla00c000o01lyg4x26mg7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:13:13.74	\N	\N
cmrnladjp000p01ly7k4f2mfe	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:13:31.285	\N	\N
cmrnlb8v3000q01lyjnga72ln	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:14:11.871	\N	\N
cmrnlb9zs000r01ly6hxup7it	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 42, "expectedVersion": 41}	2026-07-16 14:14:13.336	\N	\N
cmrnlbm8b000t01lylc8ugp2r	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:14:29.196	\N	\N
cmrnlbmhb000u01lylnn3svvh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:14:29.519	\N	\N
cmrnlbt3y000v01lyt4bac40w	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 14:14:38.11	\N	\N
cmrnlcxo0000w01ly2r4q7prc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:15:30.672	\N	\N
cmrnld7yi000x01ly7w835e5v	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:15:44.01	\N	\N
cmrnld885000y01lyme3sdmqh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:15:44.357	\N	\N
cmrnld8l1000z01lyflen0nze	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:15:44.821	\N	\N
cmrnldh28001001ly3esiexws	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["motivo", "historiaClinica"], "procedure": "update", "currentVersion": 42, "expectedVersion": 16}	2026-07-16 14:15:55.808	\N	\N
cmrnldh9x001101lyz0nnk0ty	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:15:56.085	\N	\N
cmrnldram001301lygqvey6su	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:16:09.07	\N	\N
cmrnleyvq001801lyx9zfygh6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:17:05.559	\N	\N
cmrnlf0m9001a01ly001njrqc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:17:07.809	\N	\N
cmrnlf14i001b01lyas35ez4c	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:17:08.467	\N	\N
cmrnlf4x4001c01lylvtazdiw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 14:17:13.384	\N	\N
cmrnlfm0w001d01lytoa2a1sw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:17:35.552	\N	\N
cmrnlfnfg001e01lyvtlg6xju	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrnleyc3001401lysfigc7bj	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 14:17:37.372	\N	\N
cmrnlg1mj001f01ly7bhwp9dl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:17:55.771	\N	\N
cmrnlg7xs001g01lyy5cs98o5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:18:03.952	\N	\N
cmrnlg8qn001h01ly9om9eja7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:18:04.991	\N	\N
cmrnlg9b3001i01ly9ft1i9ug	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:18:05.727	\N	\N
cmrnlggjx001j01lyam3y7e3i	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:18:15.117	\N	\N
cmrnlghax001k01lyxoan54ww	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:18:16.089	\N	\N
cmrnlgu0f001m01ly0pyaojsu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:18:32.559	\N	\N
cmrnlguar001n01ly9z1cwz0z	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:18:32.931	\N	\N
cmrnlgvxy001o01lyvwzv0leu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 14:18:35.062	\N	\N
cmrnmdlgs000001nsgojvbaxa	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:44:01.133	\N	\N
cmrnmdmvm000101nsf848e7wc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:44:02.962	\N	\N
cmrnmdwef000201nseyatewun	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:44:15.303	\N	\N
cmrnmdwtc000301nsy7ms9k4o	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:44:15.84	\N	\N
cmrnmdxbv000401nsyoilhl2t	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:44:16.507	\N	\N
cmrnmdy7r000601nsbhryrgb9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:44:17.655	\N	\N
cmrnmdyjp000701ns6anfz40a	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:44:18.086	\N	\N
cmrnme2v0000801nsa0bg71aq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_PRESCRIPTION	Prescription	cmrm8508y000e01lepg5zbuer	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/428.4.939275213 Mobile/15E148 Safari/604.1	PDF	\N	2026-07-16 14:44:23.676	\N	\N
cmrnme48d000a01nss7hql5mi	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:44:25.453	\N	\N
cmrnme4gv000b01nshf9fq8c9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/428.4.939275213 Mobile/15E148 Safari/604.1	PDF	\N	2026-07-16 14:44:25.759	\N	\N
cmrnmgfbz000c01nsp7ne7u3y	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:46:13.151	\N	\N
cmrnmh16e000e01nsbp8vl59f	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnmh0wt000d01ns620suy0a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:46:41.463	\N	\N
cmrnmh1h5000f01nss8mjvyuy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnmh0wt000d01ns620suy0a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:46:41.85	\N	\N
cmrnmj7t5000g01ns2kb0jv3m	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnmh0wt000d01ns620suy0a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 14:48:23.369	\N	\N
cmrnn4kqu000h01nsbnt1beo7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:04:59.91	\N	\N
cmrnn5o0p000i01ns4yrjr67u	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnkzdv5000401lycs6k93t5	cmr7yg1w8000f01mpyn3ufito	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:05:50.809	\N	\N
cmrnn60qu000j01nsxg6emycz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnmh0wt000d01ns620suy0a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:06:07.302	\N	\N
cmrnn615z000k01nstspl98xk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnmh0wt000d01ns620suy0a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:06:07.847	\N	\N
cmrnn6d1f000l01nsqtnaxg5l	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnmh0wt000d01ns620suy0a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:06:23.235	\N	\N
cmrnn6uyi000p01nse8m76i9v	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:06:46.458	\N	\N
cmrnn6vij000q01nsmmukt5co	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:06:47.179	\N	\N
cmrnngmss000s01nsn32glzl9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:14:22.444	\N	\N
cmrnnha28000u01nsk531el9q	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:14:52.592	\N	\N
cmrnnhucz000w01ns7trb71a2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:15:18.899	\N	\N
cmrnni2qp000y01nsgmfwyn6e	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:15:29.761	\N	\N
cmrnnihgy001001ns9wnct352	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:15:48.85	\N	\N
cmrnniqf6001101nsf7ejplkc	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:16:00.45	\N	\N
cmrnnitkv001201nspv5b3xbo	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:16:04.543	\N	\N
cmrnnjdfi001301nscdsu409k	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:16:30.27	\N	\N
cmrnnjwfd001401ns314skm5s	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:16:54.889	\N	\N
cmrnnk0rg001501nsv5mt25zt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:17:00.508	\N	\N
cmrnnl34a001601nsa4gjkohs	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:17:50.218	\N	\N
cmrnnl4zw001701nsaa1aiops	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:17:52.652	\N	\N
cmrnnli73001801nsxn0jhd98	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:18:09.759	\N	\N
cmrnnlx4q001901nsax1iwnae	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:18:29.114	\N	\N
cmrnnlzg5001a01nslyyjcfxa	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:18:32.117	\N	\N
cmrnnm4ey001b01nszej5nxd8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:18:38.554	\N	\N
cmrnnm6ls001c01nsujwwd4m0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:18:41.392	\N	\N
cmrnnm9z8000001p3zvsi8fae	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:18:45.764	\N	\N
cmrnnnm23000101p3jmn8k0x2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnmh0wt000d01ns620suy0a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:19:48.075	\N	\N
cmrnnnuc9000201p33ov2zru4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:19:58.809	\N	\N
cmrnnnut4000401p354zknj1a	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnnnupl000301p3ah94i4d1	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:19:59.416	\N	\N
cmrnnnv4t000501p3n6wmm7h0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnnnupl000301p3ah94i4d1	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:19:59.837	\N	\N
cmrnno195000601p39634s4ck	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnnnupl000301p3ah94i4d1	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:07.771	\N	\N
cmrnno1pl000701p3kvyz8asa	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnnnupl000301p3ah94i4d1	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:08.361	\N	\N
cmrnno2lq000801p37kjpqov4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnnnupl000301p3ah94i4d1	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:09.518	\N	\N
cmrnno343000901p3aygae7f1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnnnupl000301p3ah94i4d1	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:10.179	\N	\N
cmrnno448000a01p3rnzelm7c	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnnnupl000301p3ah94i4d1	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:11.48	\N	\N
cmrnno4wf000b01p3s6fwxg5p	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:12.495	\N	\N
cmrnno5r6000c01p3z44vwvy9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnnnupl000301p3ah94i4d1	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:13.603	\N	\N
cmrnno9jy000d01p3lnbdq66g	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnnnupl000301p3ah94i4d1	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:18.526	\N	\N
cmrnno9kq000e01p3b2avd617	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnnnupl000301p3ah94i4d1	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:18.554	\N	\N
cmrnnodmm000f01p3p0big2io	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnnnupl000301p3ah94i4d1	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:23.806	\N	\N
cmrnnodtp000g01p35bucrazn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnnnupl000301p3ah94i4d1	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:24.061	\N	\N
cmrnnohdr000h01p38vnyvrpv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:28.671	\N	\N
cmrnnojhf000i01p399wv1rcl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_DELETED	Encounter	cmrnnnupl000301p3ah94i4d1	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:31.396	\N	\N
cmrnnothl000t01p35iorg31x	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:44.361	\N	\N
cmrnnoukj000u01p3xr37p1ev	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-16 15:20:45.763	\N	\N
cmrnnojwn000j01p3ztoqm9af	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:31.943	\N	\N
cmrnnokqt000k01p3wz4gigd9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnmh0wt000d01ns620suy0a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:33.029	\N	\N
cmrnnol6k000l01p3a97awrqb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:33.596	\N	\N
cmrnnol7v000m01p3bcwgs3ji	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnmh0wt000d01ns620suy0a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:33.643	\N	\N
cmrnnopez000n01p3qqinlh41	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:39.083	\N	\N
cmrnnopm8000o01p37w8bv9fv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:39.344	\N	\N
cmrnnopvg000p01p3fbjqx4ar	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:39.676	\N	\N
cmrnnoqf1000q01p3g8uqfike	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_DELETED	Encounter	cmrnmh0wt000d01ns620suy0a	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:40.381	\N	\N
cmrnnotac000s01p3y7foak0e	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:44.1	\N	\N
cmrnnp3lc000v01p3e428qt90	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:57.456	\N	\N
cmrnnp3s2000w01p37ugsuwys	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:20:57.698	\N	\N
cmrnnpucf000x01p3tegdbmol	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_DELETED	Encounter	cmrmw2ldt000r01p7k0izsjeg	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:21:32.127	\N	\N
cmrnnq6qf000y01p37adj6ugy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:21:48.183	\N	\N
cmrnnq755000z01p35gymsuge	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:21:48.713	\N	\N
cmrnnqavo001001p30sgp5it4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	190.153.18.0	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/428.4.939275213 Mobile/15E148 Safari/604.1	PDF	\N	2026-07-16 15:21:53.556	\N	\N
cmrnnqpek001101p3i85027bb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:22:12.38	\N	\N
cmrnnqplv001201p3n9xr09xz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:22:12.643	\N	\N
cmrnnqufk001301p3qseh54pu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:22:18.896	\N	\N
cmrnnqukx001401p34kz0c4s3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:22:19.089	\N	\N
cmrnnqyho001501p3nqjohfyg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_DELETED	Encounter	cmrmvcduv000p01o4j8738baa	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:22:24.156	\N	\N
cmrnnr6pn001601p3t3tqdk1n	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:22:34.811	\N	\N
cmrnnrqzd001701p3dchdnwjy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:23:01.081	\N	\N
cmrnnrr9r001801p3t7a79702	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:23:01.455	\N	\N
cmrnns0p2001a01p3ge0qfa47	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnns0ly001901p35tbm0828	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:23:13.67	\N	\N
cmrnns0w6001b01p3nswwt05a	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnns0ly001901p35tbm0828	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:23:13.926	\N	\N
cmrnnsa2e001c01p385kfv66k	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnns0ly001901p35tbm0828	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:23:25.814	\N	\N
cmrnnsa90001d01p3drjrim3l	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnns0ly001901p35tbm0828	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:23:26.052	\N	\N
cmrnnstnc001e01p33e3pjce5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnns0ly001901p35tbm0828	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:23:51.192	\N	\N
cmrnnsu3n001f01p35kx3n8d6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnns0ly001901p35tbm0828	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:23:51.779	\N	\N
cmrnnsurs001g01p3wjcr8isn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnns0ly001901p35tbm0828	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:23:52.649	\N	\N
cmrnnswdq001h01p3e3fjbu5l	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnns0ly001901p35tbm0828	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:23:54.734	\N	\N
cmrnnt5rh001i01p3i24b0zl7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnns0ly001901p35tbm0828	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:24:06.893	\N	\N
cmrnntljp001j01p3kzsvgnwo	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnns0ly001901p35tbm0828	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:24:27.349	\N	\N
cmrnntlkc001k01p317wa19fk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnns0ly001901p35tbm0828	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:24:27.372	\N	\N
cmrnnxomt001l01p38v90wpbb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnns0ly001901p35tbm0828	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:27:37.973	\N	\N
cmrnnzqu0001n01p38cxwde8x	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnnzqql001m01p3p7pd6wlk	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:29:14.136	\N	\N
cmrnnzr27001o01p37d39r6z9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnnzqql001m01p3p7pd6wlk	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:29:14.431	\N	\N
cmrnon005000101rs3ewj13th	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnns0ly001901p35tbm0828	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:47:19.109	\N	\N
cmrnon07b000201rsuzzmu9kk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnns0ly001901p35tbm0828	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:47:19.367	\N	\N
cmrnootme000301rsnadyml2a	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnnzqql001m01p3p7pd6wlk	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:48:44.151	\N	\N
cmrnoou6s000401rs4gwdusiw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnnzqql001m01p3p7pd6wlk	cmrmxq8ka000201l47pf9hqql	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:48:44.884	\N	\N
cmrnophd1000701rsyqump7dx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:49:14.917	\N	\N
cmrnophkp000801rstgtcfxj1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:49:15.194	\N	\N
cmrnopqi9000901rsggaka17d	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:49:26.769	\N	\N
cmrnoprh5000a01rse6k8j651	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:49:28.025	\N	\N
cmrnops9l000b01rs6nsyjum0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:49:29.049	\N	\N
cmrnp1fj6000c01rs2w02tcwx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnns0ly001901p35tbm0828	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:58:32.418	\N	\N
cmrnp2m9l000d01rs28zn79ur	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnns0ly001901p35tbm0828	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 15:59:27.801	\N	\N
cmrnpos2d000e01rsbbl6h8do	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["examenFisico"], "procedure": "update", "currentVersion": 58, "expectedVersion": 57}	2026-07-16 16:16:41.749	\N	\N
cmrnpos91000f01rss2cy7n0p	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:16:41.989	\N	\N
cmrnpowyb000g01rswwugru90	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["examenFisico"], "procedure": "update", "currentVersion": 59, "expectedVersion": 58}	2026-07-16 16:16:48.083	\N	\N
cmrnpox40000h01rsx6ibd9o2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:16:48.288	\N	\N
cmrnppz7s000i01rshuouc0uh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 65, "expectedVersion": 59}	2026-07-16 16:17:37.672	\N	\N
cmrnpq630000j01rskl4w2o3g	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 65, "expectedVersion": 59}	2026-07-16 16:17:46.572	\N	\N
cmrnpqalk000k01rs7xdkeokj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 65, "expectedVersion": 59}	2026-07-16 16:17:52.424	\N	\N
cmrnpqc99000l01rslapvv8l8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 65, "expectedVersion": 59}	2026-07-16 16:17:54.574	\N	\N
cmrnpqduw000m01rskdkfke9z	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 65, "expectedVersion": 59}	2026-07-16 16:17:56.648	\N	\N
cmrnpqfx8000n01rsibklakq8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 65, "expectedVersion": 59}	2026-07-16 16:17:59.324	\N	\N
cmrnpqhxa000o01rs2iwrqwvo	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 65, "expectedVersion": 59}	2026-07-16 16:18:01.918	\N	\N
cmrnpr427000p01rsmr73qwe6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 65, "expectedVersion": 59}	2026-07-16 16:18:30.607	\N	\N
cmrnpr75m000q01rsvl2dga1q	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 65, "expectedVersion": 59}	2026-07-16 16:18:34.618	\N	\N
cmrnpr9rt000r01rscc3xuvqp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 65, "expectedVersion": 59}	2026-07-16 16:18:38.009	\N	\N
cmrnprbj4000s01rsca029cgz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 65, "expectedVersion": 59}	2026-07-16 16:18:40.288	\N	\N
cmrnpriah000t01rsy6tqop0h	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 65, "expectedVersion": 59}	2026-07-16 16:18:49.049	\N	\N
cmrnprq58000u01rsepxrf0x5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 65, "expectedVersion": 59}	2026-07-16 16:18:59.228	\N	\N
cmrnprv7e000v01rsgfltzvw3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 65, "expectedVersion": 59}	2026-07-16 16:19:05.786	\N	\N
cmrnpt4iq000w01rs0hiwgxyu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:20:04.514	\N	\N
cmrnptd3w000x01rsiocjvjsa	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:20:15.644	\N	\N
cmrnptn3o000y01rsk02o1889	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:20:28.596	\N	\N
cmrnptuz2000z01rstkf2h7jp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:20:38.798	\N	\N
cmrnptvvl001001rsa9kbyyxj	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:20:39.969	\N	\N
cmrnpwwny001101rsb8thx86t	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:23:00.958	\N	\N
cmrnpx61y001201rsbpomxkfs	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:23:13.126	\N	\N
cmrnpx8d7001301rswn2hhams	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:23:16.123	\N	\N
cmrnq3bp2001401rs52mmeaf4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnns0ly001901p35tbm0828	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:28:00.374	\N	\N
cmrnq3fil001501rsfeanemu7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:28:05.325	\N	\N
cmrnq3h0a001601rs4j040v4c	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:28:07.258	\N	\N
cmrnq3mko001701rs6nwuypfq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:28:14.472	\N	\N
cmrnq4kz7001901rs8lg8fxwz	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:28:59.059	\N	\N
cmrnq4lfv001a01rsaumbuezx	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:28:59.659	\N	\N
cmrnq5sc4001b01rs9iw5d2sk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnns0ly001901p35tbm0828	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:29:55.252	\N	\N
cmrnq5xkq001c01rsfr7jadek	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnns0ly001901p35tbm0828	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:30:02.042	\N	\N
cmrnq5xv9001d01rsqe9ipcn5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnns0ly001901p35tbm0828	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:30:02.421	\N	\N
cmrnq6ihr001f01rsmtfhtyhd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:30:29.151	\N	\N
cmrnq6iul001g01rsckd5k795	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:30:29.613	\N	\N
cmrnq73um001h01rssjmunelu	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:30:56.83	\N	\N
cmrnq74hg001i01rs93l7qh99	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:30:57.653	\N	\N
cmrnq74za001j01rskpaozocy	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:30:58.294	\N	\N
cmrnq76vl001k01rs51fqqobe	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:31:00.753	\N	\N
cmrnq7e6a001l01rsd7w1k2tb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:31:10.21	\N	\N
cmrnq7ecq001m01rsuq2kkquv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:31:10.442	\N	\N
cmrnq7oc0001n01rsaiew2gk5	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:31:23.376	\N	\N
cmrnq7okd001o01rsq4oyp520	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:31:23.677	\N	\N
cmrnq7oq6001p01rs9tnm5bla	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:31:23.886	\N	\N
cmrnqgc0r001q01rsv31o7frd	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:38:07.323	\N	\N
cmrnqive4001r01rssaoblb75	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:40:05.74	\N	\N
cmrnqodx2000001npcd31fgcn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 16:44:23.031	\N	\N
cmrnva45e000001nhzn2mqiwr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 18:53:15.267	\N	\N
cmrnva4gy000101nhbkxnouhi	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 18:53:15.682	\N	\N
cmrnvafch000201nhlju3corh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 18:53:29.777	\N	\N
cmrnvag0y000301nh1i24mu6s	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 18:53:30.659	\N	\N
cmrnvah30000401nhbjjaek41	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 18:53:32.028	\N	\N
cmrnvahkz000501nhblc8d3rn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 18:53:32.675	\N	\N
cmrnvei4h000601nh3q9a53gm	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 18:56:40.001	\N	\N
cmrnvkxy8000701nh55aqm4hg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 19:01:40.448	\N	\N
cmrnvmrwf000b01nhtbq4tng6	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnvmrsd000a01nhqfxkhb30	cmrnvmezr000901nhnhxo4axt	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 19:03:05.919	\N	\N
cmrnvmsg1000c01nhke15rwbp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnvmrsd000a01nhqfxkhb30	cmrnvmezr000901nhnhxo4axt	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 19:03:06.626	\N	\N
cmrnvn2jz000d01nhmvnwttvs	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnvmrsd000a01nhqfxkhb30	cmrnvmezr000901nhnhxo4axt	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 19:03:19.727	\N	\N
cmrnvn3af000e01nhdyr0p7rt	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnvmrsd000a01nhqfxkhb30	cmrnvmezr000901nhnhxo4axt	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 19:03:20.679	\N	\N
cmrnvn42w000f01nhk8z52jer	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnvmrsd000a01nhqfxkhb30	cmrnvmezr000901nhnhxo4axt	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 19:03:21.704	\N	\N
cmrnvne23000g01nhm20odsnp	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 19:03:34.635	\N	\N
cmrnvnn80000i01nhannqwea1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnvmrsd000a01nhqfxkhb30	cmrnvmezr000901nhnhxo4axt	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 19:03:46.512	\N	\N
cmrnvo1va000j01nhdmls9r00	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnvmrsd000a01nhqfxkhb30	cmrnvmezr000901nhnhxo4axt	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 19:04:05.494	\N	\N
cmrnvoiwn000l01nh7195g537	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnvmrsd000a01nhqfxkhb30	cmrnvmezr000901nhnhxo4axt	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 19:04:27.575	\N	\N
cmrnvojcg000n01nhiw7mb8d0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnvmrsd000a01nhqfxkhb30	cmrnvmezr000901nhnhxo4axt	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 19:04:28.144	\N	\N
cmrnvomb1000p01nhbv8lxo0t	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnvmrsd000a01nhqfxkhb30	cmrnvmezr000901nhnhxo4axt	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 19:04:31.981	\N	\N
cmrnvomjy000q01nhtha9nol2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnvmrsd000a01nhqfxkhb30	cmrnvmezr000901nhnhxo4axt	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 19:04:32.302	\N	\N
cmrnvop1l000r01nhqwcx9yur	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrnvmrsd000a01nhqfxkhb30	cmrnvmezr000901nhnhxo4axt	ALLOWED	\N	161.140.54.0	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/428.4.939275213 Mobile/15E148 Safari/604.1	PDF	\N	2026-07-16 19:04:35.529	\N	\N
cmrnvozww000s01nh208n8ils	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrnvmrsd000a01nhqfxkhb30	cmrnvmezr000901nhnhxo4axt	ALLOWED	\N	161.140.54.0	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/428.4.939275213 Mobile/15E148 Safari/604.1	PDF	\N	2026-07-16 19:04:49.616	\N	\N
cmrnvr3uo000t01nhut10aytg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 19:06:28.032	\N	\N
cmrnxiy0l000u01nhx6hmaxao	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 19:56:06.453	\N	\N
cmrnxiyaf000v01nhhgiwqbvl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 19:56:06.807	\N	\N
cmrnxj9nx000w01nhqcweqevk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 19:56:21.549	\N	\N
cmrnxjhb0000x01nhuz5bql3i	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 19:56:31.452	\N	\N
cmrnxllqd000y01nh12eiz9xq	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 19:58:10.501	\N	\N
cmrnxr52j000z01nh1zu78nx7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 20:02:28.843	\N	\N
cmrnxr918001001nhmtxabzm1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 20:02:33.98	\N	\N
cmrnxr9po001101nh6sw3c1h7	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 20:02:34.86	\N	\N
cmrnxu6ch001201nhtm8cdgxw	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 20:04:50.465	\N	\N
cmrnxwpb5000001qttnnzo3d4	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 20:06:48.354	\N	\N
cmrnxxll0000101qtffsa5c4m	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 20:07:30.18	\N	\N
cmrnxxo5b000201qtoru1tw4w	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 20:07:33.503	\N	\N
cmrnxxoz3000301qtuev3retv	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 20:07:34.575	\N	\N
cmrnybaxn000401qt7qokq4sh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 20:18:09.563	\N	\N
cmrnyccet000501qtwdxiy7pe	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 20:18:58.133	\N	\N
cmrnye9b2000601qtwstal7g0	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 20:20:27.422	\N	\N
cmro1ne0j000001p6x7up130t	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 21:51:32.275	\N	\N
cmro1ne7i000101p6vyylbdlh	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 21:51:32.526	\N	\N
cmro1p8by000201p6wxmpqkol	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-16 21:52:58.222	\N	\N
cmro8a5mk000001qjas8x85k9	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 00:57:12.188	\N	\N
cmro8a5z5000101qj1wi2e2yk	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 00:57:12.641	\N	\N
cmro8t73b000201qjymhmk7fb	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 01:12:00.551	\N	\N
cmro9gdt2000301qj4x8iveuf	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 01:30:02.342	\N	\N
cmro9iiu6000401qjxonzehz3	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 01:31:42.174	\N	\N
cmro9j10a000501qjb0tfg1e1	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 01:32:05.722	\N	\N
cmro9lvxb000601qjgolguzl2	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 01:34:19.103	\N	\N
cmroa38oi000701qjsh5w9rec	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 01:47:48.786	\N	\N
cmroalacd000801qjkevhfb4c	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnoph78000601rs9qecv79i	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 02:01:50.75	\N	\N
cmroao73t000k01qjka2p49x6	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroao6rn000j01qjvoiukq2o	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 02:04:06.521	\N	\N
cmroao7jk000m01qjo4aj89te	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroao76x000l01qjs7x0pkrr	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 02:04:07.088	\N	\N
cmroao894000o01qj80un9ug8	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroao7qz000n01qj11nvegns	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 02:04:08.008	\N	\N
cmroao8xm000q01qjhvugujnu	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroao8k2000p01qjzavkj7bd	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 02:04:08.891	\N	\N
cmroaob36001001qjtsft5iru	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroaoaxw000z01qjr2ik9ovo	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 02:04:11.682	\N	\N
cmroaobon001401qjho4cbylz	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroaobko001301qj17gg65pe	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 02:04:12.455	\N	\N
cmroaobvd001601qju1z1mjum	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroaobtb001501qjon1hm2gm	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 02:04:12.697	\N	\N
cmroaoc3x001801qjz092htc2	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroaoc23001701qjmel7u4k0	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 02:04:13.005	\N	\N
cmroao997000s01qjjrk990fr	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroao94q000r01qjpb1there	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 02:04:09.307	\N	\N
cmroao9j3000u01qjm46olnlc	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroao9fa000t01qjs7931o94	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 02:04:09.663	\N	\N
cmroaoa8t000w01qjv6zwp82u	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroaoa0y000v01qj7720hsct	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 02:04:10.589	\N	\N
cmroaoaql000y01qj31ql6ysl	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroaoaiu000x01qj82g9ez2s	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 02:04:11.229	\N	\N
cmroaobbq001201qjsb8l2qet	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroaob7q001101qjt4bye4fr	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 02:04:11.99	\N	\N
cmroaocbf001901qjzl7ilabq	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroaoc23001701qjmel7u4k0	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 02:04:13.275	\N	\N
cmroaw3ha001a01qj5t03cfc6	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroaoc23001701qjmel7u4k0	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 02:10:15.07	\N	\N
cmroawsin001b01qjb6bix48n	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroaoc23001701qjmel7u4k0	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 02:10:47.519	\N	\N
cmroaz55x001c01qjgbppcs5h	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroaoc23001701qjmel7u4k0	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 02:12:37.221	\N	\N
cmrob9dxd001d01qjqunuvnzj	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroaoc23001701qjmel7u4k0	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 02:20:35.137	\N	\N
cmrob9krq001e01qjh8d1awvu	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroaoc23001701qjmel7u4k0	cmqv73kg8001901qo26o9tzfk	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 02:20:44.006	\N	\N
cmrodulnt000d01r0qkhwlo96	cmrodu1xc000501r0ly4wisk4	cmrodu1x1000401r0as2udib9	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_terminos_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "terminos", "version": "1.1.0", "explicit": true}	2026-07-17 03:33:04.169	\N	\N
cmrodulom000e01r0g7dg4tsc	cmrodu1xc000501r0ly4wisk4	cmrodu1x1000401r0as2udib9	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_privacidad_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "privacidad", "version": "1.1.0", "explicit": true}	2026-07-17 03:33:04.198	\N	\N
cmrodulp5000f01r0qt91i0to	cmrodu1xc000501r0ly4wisk4	cmrodu1x1000401r0as2udib9	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_lopdp_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "lopdp-consentimiento", "version": "1.1.0", "explicit": true}	2026-07-17 03:33:04.217	\N	\N
cmroe951p000101p24qmi4ena	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroe94rq000001p2i6w1c9kx	cmrodfwag000101r0up24yxhe	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 03:44:22.477	\N	\N
cmroe95h7000201p2xajfnq79	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroe94rq000001p2i6w1c9kx	cmrodfwag000101r0up24yxhe	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 03:44:23.035	\N	\N
cmroeaqgw000301p2l5jxoxcw	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroe94rq000001p2i6w1c9kx	cmrodfwag000101r0up24yxhe	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 03:45:36.897	\N	\N
cmroeatgi000401p2ri2pgnln	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	AI_PHI_DISCLOSURE	Encounter	cmroe94rq000001p2i6w1c9kx	\N	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	API	{"model": "claude-haiku-4-5-20251001", "feature": "plan-suggestion", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "alergiasCount": 0, "diagnosesCount": 0, "fieldsSanitized": 2, "hasExamenFisico": true, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "medicamentosCount": 0, "hasHistoriaClinica": false, "injectionSuspicious": false, "invisibleCharFields": []}	2026-07-17 03:45:40.77	\N	\N
cmroebab6000601p2y7x06g1s	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroe94rq000001p2i6w1c9kx	cmrodfwag000101r0up24yxhe	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 03:46:02.61	\N	\N
cmroebldf000701p2u4tl77oc	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroe94rq000001p2i6w1c9kx	cmrodfwag000101r0up24yxhe	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 03:46:16.947	\N	\N
cmroebt2c000801p2ghz1o4fm	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroe94rq000001p2i6w1c9kx	cmrodfwag000101r0up24yxhe	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 03:46:26.916	\N	\N
cmroec31r000901p2s7tftzl8	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroe94rq000001p2i6w1c9kx	cmrodfwag000101r0up24yxhe	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 03:46:39.855	\N	\N
cmroecncz000b01p2p5dl58nd	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroe94rq000001p2i6w1c9kx	cmrodfwag000101r0up24yxhe	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 03:47:06.179	\N	\N
cmroecnpp000d01p2edckruw6	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroe94rq000001p2i6w1c9kx	cmrodfwag000101r0up24yxhe	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 03:47:06.637	\N	\N
cmroedfi9000f01p2gewj9fiv	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroe94rq000001p2i6w1c9kx	cmrodfwag000101r0up24yxhe	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 03:47:42.657	\N	\N
cmroedfoy000g01p2ie4zsywg	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroe94rq000001p2i6w1c9kx	cmrodfwag000101r0up24yxhe	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 03:47:42.898	\N	\N
cmroeewwy000h01p2xmbel6st	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmroe94rq000001p2i6w1c9kx	cmrodfwag000101r0up24yxhe	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-17 03:48:51.874	\N	\N
cmroefdp8000i01p2gss0rx9f	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroe94rq000001p2i6w1c9kx	cmrodfwag000101r0up24yxhe	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 03:49:13.628	\N	\N
cmroefusq000j01p2vxi3jxno	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmroe94rq000001p2i6w1c9kx	cmrodfwag000101r0up24yxhe	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 03:49:35.786	\N	\N
cmroefv5a000k01p2jivj31oz	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroe94rq000001p2i6w1c9kx	cmrodfwag000101r0up24yxhe	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 03:49:36.238	\N	\N
cmroefvdn000l01p2sm4x722a	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroe94rq000001p2i6w1c9kx	cmrodfwag000101r0up24yxhe	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 03:49:36.539	\N	\N
cmroeg918000m01p2da1ox76z	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	\N	ENCOUNTER_CONFLICT	system	\N	\N	ALLOWED	\N	\N	\N	UI	{"fields": ["plan"], "procedure": "update", "currentVersion": 8, "expectedVersion": 7}	2026-07-17 03:49:54.236	\N	\N
cmroeg999000n01p2kwtb7t17	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroe94rq000001p2i6w1c9kx	cmrodfwag000101r0up24yxhe	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 03:49:54.525	\N	\N
cmroegwby000o01p2j7fjahop	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroe94rq000001p2i6w1c9kx	cmrodfwag000101r0up24yxhe	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 03:50:24.43	\N	\N
cmroegwki000p01p2ekkle090	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroe94rq000001p2i6w1c9kx	cmrodfwag000101r0up24yxhe	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 03:50:24.739	\N	\N
cmroeimfx000q01p2fasmm28t	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroe94rq000001p2i6w1c9kx	cmrodfwag000101r0up24yxhe	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 03:51:44.925	\N	\N
cmroeqky0000r01p291bk1rnl	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	VIEW_ENCOUNTER	Encounter	cmroe94rq000001p2i6w1c9kx	cmrodfwag000101r0up24yxhe	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 03:57:56.232	\N	\N
cmrohu34s000001o0d4t8lnq8	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 05:24:38.62	\N	\N
cmrohu3j1000101o0f1atrr46	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnq6iej001e01rshkgiy5i4	cmrm7x1l6000101le9hkh0ivo	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 05:24:39.133	\N	\N
cmrohz9mm000301o0hi5kp6q2	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrohz9iv000201o0ato33tqm	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 05:28:40.318	\N	\N
cmrohz9sw000401o0rkavkbh8	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrohz9iv000201o0ato33tqm	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 05:28:40.544	\N	\N
cmroi00nn000501o0r9ahimcy	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	ENCOUNTER_DELETED	Encounter	cmrohz9iv000201o0ato33tqm	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 05:29:15.347	\N	\N
cmroi06vf000601o0a3bk7um7	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 05:29:23.403	\N	\N
cmroi071q000701o0aq2p3zfn	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 05:29:23.63	\N	\N
cmroi087x000801o039nqvu8p	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 05:29:25.149	\N	\N
cmroi08kb000901o0io58va8t	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 05:29:25.595	\N	\N
cmroi08wr000a01o07n5k6ety	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 05:29:26.043	\N	\N
cmroi0cr1000b01o0n2g8c5ac	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 05:29:31.021	\N	\N
cmroi0e6f000d01o0sqrbg62j	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 05:29:32.871	\N	\N
cmroi0ehp000e01o0lpwz7gku	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 05:29:33.277	\N	\N
cmroibevp000001qy6r3s6smn	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 05:38:06.997	\N	\N
cmroibf6f000101qypfn0dye3	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 05:38:07.383	\N	\N
cmroibh13000201qy6do8b5ni	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	ENCOUNTER_REOPENED	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 05:38:09.783	\N	\N
cmroibhh0000301qyvdoq0wlo	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 05:38:10.356	\N	\N
cmroibhtz000401qy7zbld1mt	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 05:38:10.823	\N	\N
cmroibj9s000601qyw4tni58m	cmqva532b000201p39eq8lpiq	cmr0pml99001z01mogxs7wdnf	PATIENT	EXPORT_PDF_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	127.0.0.0	node	PDF	\N	2026-07-17 05:38:12.688	\N	\N
cmroibjxr000701qyx01gj46u	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 05:38:13.551	\N	\N
cmroibkgx000801qym8gbc2ht	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 05:38:14.241	\N	\N
cmroibl6w000901qy4q2yr1zb	cmqva532b000201p39eq8lpiq	cmr0pml99001z01mogxs7wdnf	PATIENT	EXPORT_PDF_PRESCRIPTION	Prescription	cmr4hn0zq000401qos4ha9blr	cmr0pml9d002001moekmrt320	ALLOWED	\N	127.0.0.0	node	PDF	\N	2026-07-17 05:38:15.176	\N	\N
cmroibm34000b01qyw21mk0re	cmqva532b000201p39eq8lpiq	cmr0pml99001z01mogxs7wdnf	PATIENT	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrmd5had005s01lej67znlsd	cmr0pml9d002001moekmrt320	ALLOWED	\N	127.0.0.0	node	PDF	\N	2026-07-17 05:38:16.336	\N	\N
cmrp0ulbg000001qdzydtvwp4	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 14:16:54.893	\N	\N
cmrp0ulvb000101qd838cjfzr	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	VIEW_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 14:16:55.607	\N	\N
cmrp0urbh000201qdzw48vv2h	cmqva532b000201p39eq8lpiq	cmqva5325000101p3bu118ykx	DOCTOR	PASSWORD_CHANGED	Patient	cmr0pml99001z01mogxs7wdnf	cmr0pml99001z01mogxs7wdnf	ALLOWED	\N	\N	\N	UI	{"channel": "PORTAL_RESET"}	2026-07-17 14:17:02.669	\N	\N
cmrp0w26v000301qdz1bhwobq	cmqva532b000201p39eq8lpiq	cmr0pml99001z01mogxs7wdnf	PATIENT	EXPORT_PDF_ENCOUNTER	Encounter	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-17 14:18:03.415	\N	\N
cmrp0zps6000401qd0cse6w1f	cmqva532b000201p39eq8lpiq	cmr0pml99001z01mogxs7wdnf	PATIENT	EXPORT_PDF_PRESCRIPTION	Prescription	cmr4hn0zq000401qos4ha9blr	cmr0pml9d002001moekmrt320	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-17 14:20:53.958	\N	\N
cmrp1114m000601qdcov3zcig	cmqva532b000201p39eq8lpiq	cmr0pml99001z01mogxs7wdnf	PATIENT	EXPORT_PDF_PRESCRIPTION	Prescription	cmr4hn0zq000401qos4ha9blr	cmr0pml9d002001moekmrt320	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-17 14:21:55.318	\N	\N
cmrp39gax000001lm5yr5ys7p	cmqva532b000201p39eq8lpiq	cmr0pml99001z01mogxs7wdnf	PATIENT	EXPORT_PDF_PRESCRIPTION	Prescription	cmr4hn0zq000401qos4ha9blr	cmr0pml9d002001moekmrt320	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-17 15:24:27.465	\N	\N
cmrp39nlt000201lmsxhxbibd	cmqva532b000201p39eq8lpiq	cmr0pml99001z01mogxs7wdnf	PATIENT	EXPORT_PDF_IMAGING_ORDER	ImagingOrder	cmrmd5had005s01lej67znlsd	cmr0pml9d002001moekmrt320	ALLOWED	\N	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	PDF	\N	2026-07-17 15:24:36.929	\N	\N
cmrp59ewt000301lm4taxhfkl	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 16:20:24.893	\N	\N
cmrp59gb8000401lmr5r9460w	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 16:20:26.708	\N	\N
cmrp59h6t000501lm5rhw0ewn	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 16:20:27.845	\N	\N
cmrp59l4r000601lmfrqzb6jg	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	190.6.15.0	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/429.1.942703598 Mobile/15E148 Safari/604.1	PDF	\N	2026-07-17 16:20:32.955	\N	\N
cmrp5fp5e000701lmdg8ttl1u	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	EXPORT_PDF_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	190.6.15.0	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/429.1.942703598 Mobile/15E148 Safari/604.1	PDF	\N	2026-07-17 16:25:18.098	\N	\N
cmrp5fwcm000801lmg63vhgzr	cmqlsyn9e000301qgk98rcsjh	cmqlsyn94000201qg8eeqn1c2	DOCTOR	VIEW_ENCOUNTER	Encounter	cmrnn6us3000o01nslj0cqok8	cmrnn6o6r000n01nsjdj83ngo	ALLOWED	\N	\N	\N	UI	\N	2026-07-17 16:25:27.43	\N	\N
cmrp83spd000k01lm1x2cjqj7	cmrp83c2m000b01lm03w8mcrr	cmrp83c2e000a01lm4yifqc0c	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_privacidad_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "privacidad", "version": "1.1.0", "explicit": true}	2026-07-17 17:40:01.681	\N	\N
cmrp83spp000l01lmk69i7gjj	cmrp83c2m000b01lm03w8mcrr	cmrp83c2e000a01lm4yifqc0c	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_terminos_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "terminos", "version": "1.1.0", "explicit": true}	2026-07-17 17:40:01.693	\N	\N
cmrp83sq2000m01lm92ux82pv	cmrp83c2m000b01lm03w8mcrr	cmrp83c2e000a01lm4yifqc0c	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_cookies_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "cookies", "version": "1.1.0", "explicit": true}	2026-07-17 17:40:01.706	\N	\N
cmrp83sr6000n01lmemk4ramq	cmrp83c2m000b01lm03w8mcrr	cmrp83c2e000a01lm4yifqc0c	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_lopdp_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "lopdp-consentimiento", "version": "1.1.0", "explicit": true}	2026-07-17 17:40:01.746	\N	\N
cmrpe0rrd000001o1tq7vqp4m	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	ACCESS_DENIED	Encounter	cmrnn6us3000o01nslj0cqok8	\N	DENIED	Not found or not accessible	73.8.161.0	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	PDF	\N	2026-07-17 20:25:38.185	\N	\N
cmrpe0y8u000201o1rwlll57r	cmqmx6t43000101phgcog0v6o	cmqmx6t3y000001phuzs1sirz	DOCTOR	ACCESS_DENIED	Encounter	cmrnn6us3000o01nslj0cqok8	\N	DENIED	Not found or not accessible	73.8.161.0	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	PDF	\N	2026-07-17 20:25:46.59	\N	\N
cmrpeg4d1000f01o1mvytcx5t	cmrpefiep000601o1rb4awe9w	cmrpefiai000501o10fgledn0	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_terminos_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "terminos", "version": "1.1.0", "explicit": true}	2026-07-17 20:37:34.357	\N	\N
cmrpeg4db000g01o1ewmfqqtr	cmrpefiep000601o1rb4awe9w	cmrpefiai000501o10fgledn0	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_privacidad_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "privacidad", "version": "1.1.0", "explicit": true}	2026-07-17 20:37:34.367	\N	\N
cmrpeg4de000h01o1wfpdis0w	cmrpefiep000601o1rb4awe9w	cmrpefiai000501o10fgledn0	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_cookies_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "cookies", "version": "1.1.0", "explicit": true}	2026-07-17 20:37:34.37	\N	\N
cmrpeg4dk000i01o11u1xwbcb	cmrpefiep000601o1rb4awe9w	cmrpefiai000501o10fgledn0	DOCTOR	LEGAL_CONSENT_ACCEPTED	LegalVersion	cl_lc_1_1_0_lopdp_v2	\N	ALLOWED	\N	\N	\N	UI	{"slug": "lopdp-consentimiento", "version": "1.1.0", "explicit": true}	2026-07-17 20:37:34.376	\N	\N
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."AuditLog" (id, "workspaceId", accion, entidad, "entidadId", "actorId", "actorNombre", detalle, ip, "createdAt") FROM stdin;
cmqmyou49000401phxttndb6d	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmqmyi26d000201ph2der0i4y	cmqlsyn94000201qg8eeqn1c2	Joel	{"motivo": "Dolor rodilla derecha "}	\N	2026-06-20 23:01:12.441
cmqn1lmya000201oswn0rwkef	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmqn171fv000001osjsmk3btl	cmqlsyn94000201qg8eeqn1c2	Joel	{"motivo": "Jfjfn"}	\N	2026-06-21 00:22:42.034
cmqop18zm000301mod4mvfhjc	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmqoousw9000201mosiq0aqp3	cmqlsyn94000201qg8eeqn1c2	Joel	{"motivo": "Cefalea intermitente"}	\N	2026-06-22 04:06:27.778
cmqv6gawd000r01qokeyikztx	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	200.82.223.0	2026-06-26 17:00:40.621
cmqv6glfd000u01qo1lgkjae5	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	200.82.223.0	2026-06-26 17:00:54.265
cmqv6n7e6001501qo06wslhqt	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmqv64uh4000h01qoayzpywm8	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmqv63sza000g01qokw3w9kwp"}	\N	2026-06-26 17:06:02.67
cmqvabmd1000q01p35fsskakm	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-26 18:49:00.661
cmqvicit1000301mgbp4p7k9q	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-26 22:33:39.637
cmqvifcn1000c01mgjiidtaml	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	190.6.34.0	2026-06-26 22:35:51.613
cmqvmlme3000a01nwjyyq92bw	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-27 00:32:42.651
cmqvn5k55000g01nwm2u4sips	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-27 00:48:12.857
cmqvo625n000301p73ykax9r1	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-27 01:16:35.819
cmqvo71a0000801p7wlwajnbg	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-27 01:17:21.337
cmqvoy46v000601phhv4wftlw	cmqva532b000201p39eq8lpiq	AI_PHI_DISCLOSURE	Prescription	\N	cmqva5325000101p3bu118ykx	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 2}}	73.8.161.0	2026-06-27 01:38:24.823
cmqvp74fs000b01phcqujwaed	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-27 01:45:25.048
cmqvp8wz5000d01phvd2ifu91	cmqva532b000201p39eq8lpiq	CONSULTA_FIRMADA	Encounter	cmqva6woq000i01p3mgt64ccx	cmqva5325000101p3bu118ykx	Dayana	{"patientRegistrationId": "cmqva6ika000h01p3j3pus49q"}	\N	2026-06-27 01:46:48.689
cmqvpjkv1000n01ph9ysnlk4z	cmqlsyn9e000301qgk98rcsjh	ACCESS_DENIED	Document	cmqvp6v8f000901ph10ukt7wy	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "outcome": "DENIED"}	73.8.161.0	2026-06-27 01:55:06.205
cmqvpmrj3000p01pha3k6tkw2	cmqlsyn9e000301qgk98rcsjh	EXPORT_CSV_PATIENTS	PatientRegistration	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "EXPORT", "metadata": {"count": 4}}	73.8.161.0	2026-06-27 01:57:34.815
cmqvw9yq6000s01phcepfg399	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	73.8.161.0	2026-06-27 05:03:34.926
cmqvwaywk000u01ph97898blh	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	13.140.181.0	2026-06-27 05:04:21.812
cmqvwby7w000w01ph14u2vmje	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	73.8.161.0	2026-06-27 05:05:07.58
cmqvwc03i000z01phko655f29	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	13.140.181.0	2026-06-27 05:05:10.014
cmqvwcc50001201ph34u4ez6n	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	13.140.181.0	2026-06-27 05:05:25.62
cmqvwdt9c001401phd9zguwpg	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	13.140.181.0	2026-06-27 05:06:34.464
cmqvwdzc9001801phioj8r63j	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	13.140.181.0	2026-06-27 05:06:42.345
cmqvwfzbh001b01ph1krjyjo8	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-27 05:08:15.629
cmqvwh4dk001f01pha920wpum	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	73.8.161.0	2026-06-27 05:09:08.84
cmqvwi3p0001m01phcpezfups	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	13.140.181.0	2026-06-27 05:09:54.612
cmqvwi3x5001o01phisen45fm	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	13.140.181.0	2026-06-27 05:09:54.905
cmqvwj5en001t01php5dqad6v	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	73.8.161.0	2026-06-27 05:10:43.487
cmqvwj74b001w01ph64wjoxgl	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-27 05:10:45.707
cmqvwjasc001y01phlwoypbhg	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	13.140.181.0	2026-06-27 05:10:50.461
cmqvwje0f002201ph8qhovjo8	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	13.140.181.0	2026-06-27 05:10:54.639
cmqvwjin9002401phs6l43951	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-27 05:11:00.645
cmqw6z28j002701phw1jvda9o	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	73.8.161.0	2026-06-27 10:03:02.036
cmqw7160a002a01ph3l0s2cn7	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	73.8.161.0	2026-06-27 10:04:40.234
cmqw717wr002c01ph3dzrxyeb	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	13.140.181.0	2026-06-27 10:04:42.699
cmqw719vu002e01phzl2t2v22	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	13.140.181.0	2026-06-27 10:04:45.259
cmqw719y3002g01phg9eb21jy	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	13.140.181.0	2026-06-27 10:04:45.339
cmqw71cbw002j01phw8eo9ob0	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	73.8.161.0	2026-06-27 10:04:48.428
cmqw71dvu002m01phcbxg13s1	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	13.140.181.0	2026-06-27 10:04:50.442
cmqw71lzx002p01phzea4fbav	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-27 10:05:00.957
cmqw7280e002t01phaxrjjsth	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-27 10:05:29.486
cmqw72ztq002w01phlojz8j55	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	73.8.161.0	2026-06-27 10:06:05.534
cmqw73ouv002z01phlmckjv7x	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	10.0.1.0	2026-06-27 10:06:37.975
cmqw756yu003201ph47yn6gl4	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	13.140.181.0	2026-06-27 10:07:48.102
cmqw75ert003501phw5xtgvna	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-27 10:07:58.217
cmqw75ljx003701phql619v4x	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	73.8.161.0	2026-06-27 10:08:07.005
cmqw75nif003b01ph9du0cvm5	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-27 10:08:09.543
cmqw75toz003e01ph8oudm3jk	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-27 10:08:17.555
cmqw763r6003g01phgalaqo30	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	13.140.181.0	2026-06-27 10:08:30.594
cmqw76m8j003k01php2rnfs2l	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-27 10:08:54.547
cmqw76q9n003m01phxrw4kv8v	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	73.8.161.0	2026-06-27 10:08:59.771
cmqw76wnv003p01phrylnmas2	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-27 10:09:08.059
cmqw776nl003s01ph927ga6fv	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	73.8.161.0	2026-06-27 10:09:21.009
cmqw77iv2003v01phv0rk8p67	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-27 10:09:36.83
cmqw77la1003x01pht2z460zw	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	73.8.161.0	2026-06-27 10:09:39.961
cmqw77ndj004001ph8ke3jm5p	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva532b000101p39eq8lpiq	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	13.140.181.0	2026-06-27 10:09:42.679
cmqw78fo1004401phmhr0z9zm	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	73.8.161.0	2026-06-27 10:10:19.345
cmqw78hfo004601ph2y84g9qs	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	13.140.181.0	2026-06-27 10:10:21.636
cmqw78l0c004901ph56pdsy0f	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-27 10:10:26.268
cmqw78wbm004c01phkd17cvwt	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-27 10:10:40.93
cmqw79lhn004g01phchzn3py8	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva532b000101p39eq8lpiq	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	13.140.181.0	2026-06-27 10:11:13.547
cmqw79mtx004i01phnwh5syyn	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-27 10:11:15.285
cmqw79yj9004q01ph2qlg4gaa	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmqvaavn0000l01p3nkpcrrc4	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-27 10:11:30.453
cmqw79orw004k01phenxlnsa2	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmqv6g4nc000m01qoinylct6s	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqv63sza000g01qokw3w9kwp"}	73.8.161.0	2026-06-27 10:11:17.804
cmqwselkq000401nj7mb0iqw2	cmqva532b000201p39eq8lpiq	AI_PHI_DISCLOSURE	SupportBot	\N	cmqva5325000101p3bu118ykx	\N	{"channel": "SUPPORT_BOT", "outcome": "ALLOWED", "metadata": {"toolsCalled": [], "messageCount": 2}}	73.8.161.0	2026-06-27 20:02:58.875
cmqwsilyk000601nj51n8b2la	cmqva532b000201p39eq8lpiq	AI_PHI_DISCLOSURE	SupportBot	\N	cmqva5325000101p3bu118ykx	\N	{"channel": "SUPPORT_BOT", "outcome": "ALLOWED", "metadata": {"toolsCalled": [], "messageCount": 4}}	73.8.161.0	2026-06-27 20:06:05.996
cmqwsjvqk000801njfrasp51w	cmqva532b000201p39eq8lpiq	AI_PHI_DISCLOSURE	SupportBot	\N	cmqva5325000101p3bu118ykx	\N	{"channel": "SUPPORT_BOT", "outcome": "ALLOWED", "metadata": {"toolsCalled": [], "messageCount": 6}}	73.8.161.0	2026-06-27 20:07:05.324
cmqwslwds000b01nj187iu4ob	cmqva532b000201p39eq8lpiq	AI_PHI_DISCLOSURE	SupportBot	\N	cmqva5325000101p3bu118ykx	\N	{"channel": "SUPPORT_BOT", "outcome": "ALLOWED", "metadata": {"toolsCalled": [], "messageCount": 8}}	73.8.161.0	2026-06-27 20:08:39.472
cmqy8am3i000g01o7l1t66edk	cmqy8838o000201o7vkf0es2z	EXPORT_CSV_PATIENTS	PatientRegistration	\N	cmqy8838b000101o7xuh055nu	\N	{"channel": "EXPORT", "metadata": {"count": 0}}	190.120.253.0	2026-06-28 20:15:32.958
cmqy8an5z000i01o7j8h2re6x	cmqy8838o000201o7vkf0es2z	EXPORT_CSV_PATIENTS	PatientRegistration	\N	cmqy8838b000101o7xuh055nu	\N	{"channel": "EXPORT", "metadata": {"count": 0}}	190.120.253.0	2026-06-28 20:15:34.343
cmr007glt000501k5b80divem	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmr000yni000201k55bne95f0	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmqvpjde0000l01phqmgfkbnm"}	\N	2026-06-30 02:04:41.297
cmr01vnt0000201mueybiaeri	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmr000yni000201k55bne95f0	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmqvpjde0000l01phqmgfkbnm"}	\N	2026-06-30 02:51:29.988
cmr01xux6000b01mu0w5lh9fq	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmr000yni000201k55bne95f0	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmqvpjde0000l01phqmgfkbnm"}	\N	2026-06-30 02:53:12.522
cmr02qmdw000y01mu7ue1p2ye	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Prescription	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 2}}	190.153.16.0	2026-06-30 03:15:34.484
cmr02qou5001201mu617pphru	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmr02pqxk000t01mumfl2aynd	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqvpjde0000l01phqmgfkbnm"}	190.153.16.0	2026-06-30 03:15:37.661
cmr02s024001501mupi4vso3t	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Prescription	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 3}}	190.153.16.0	2026-06-30 03:16:38.86
cmr02s4ha001901mux6g7mmyf	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmr02pqxk000t01mumfl2aynd	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqvpjde0000l01phqmgfkbnm"}	190.153.16.0	2026-06-30 03:16:44.59
cmr02tmjy001g01mudlksnwsz	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmr020v9j000g01mub1fw5j0k	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmqvpjde0000l01phqmgfkbnm"}	\N	2026-06-30 03:17:54.67
cmr03019v001l01mulfkczdaw	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmr02pqxk000t01mumfl2aynd	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqvpjde0000l01phqmgfkbnm"}	190.153.16.0	2026-06-30 03:22:53.683
cmr03gt39000q01lgpne3po8q	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmr02pqxk000t01mumfl2aynd	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmqvpjde0000l01phqmgfkbnm"}	190.153.16.0	2026-06-30 03:35:56.229
cmr03o3mh001601lghz3n0wu3	cmqva532b000201p39eq8lpiq	CONSULTA_FIRMADA	Encounter	cmr02pki6000q01mu123vkzrw	cmqva5325000101p3bu118ykx	Dayana	{"patientRegistrationId": "cmqva6ika000h01p3j3pus49q"}	\N	2026-06-30 03:41:36.473
cmr03r7zb001j01lgs2emd4l7	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmr03p3cc001b01lg7ny2zohc	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmqvpjde0000l01phqmgfkbnm"}	\N	2026-06-30 03:44:02.087
cmr04mzx2000d01pxvr0naz15	cmqva532b000201p39eq8lpiq	AI_PHI_DISCLOSURE	Prescription	\N	cmqva5325000101p3bu118ykx	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 2}}	73.8.161.0	2026-06-30 04:08:44.63
cmr04n6ta000h01pxd0lnw8f2	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmr038lzh000801lgtenkkv36	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-30 04:08:53.566
cmr04pc2b000x01pxw0goq2wh	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmr038lzh000801lgtenkkv36	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-30 04:10:33.683
cmr04rhtm001c01pxsr9bpvvl	cmqva532b000201p39eq8lpiq	AI_PHI_DISCLOSURE	Prescription	\N	cmqva5325000101p3bu118ykx	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 2}}	73.8.161.0	2026-06-30 04:12:14.458
cmr04rvo9001g01pxyy0620j5	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmr04r00t001701px0czca4rc	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-30 04:12:32.409
cmr052dse000301p6siiujioh	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmr04r00t001701px0czca4rc	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmqva6ika000h01p3j3pus49q"}	73.8.161.0	2026-06-30 04:20:42.446
cmr0ouza5000a01moap8w8yfh	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmr0o3w6h000401mozcv4wfyt	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmr0o3mnr000301mowkmfiq8t"}	\N	2026-06-30 13:34:49.373
cmr0p4zpq000v01mo0yhk8u76	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Prescription	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 2}}	190.97.237.0	2026-06-30 13:42:36.494
cmr0p528f000z01mopmgrslai	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmr0p320f000o01mow3o5nt0c	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmr0o3mnr000301mowkmfiq8t"}	190.97.237.0	2026-06-30 13:42:39.759
cmr0p53jh001101mop8swdu9g	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmr0p320f000o01mow3o5nt0c	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmr0o3mnr000301mowkmfiq8t"}	190.97.237.0	2026-06-30 13:42:41.454
cmr0s6wrc000g01o4mdyz1by1	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Prescription	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 2}}	190.97.237.0	2026-06-30 15:08:04.824
cmr0ssui9000m01o4cyd8vn7z	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Prescription	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 3}}	190.97.237.0	2026-06-30 15:25:08.337
cmr0stxwq000q01o4db7n2sf4	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Prescription	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 4}}	190.97.237.0	2026-06-30 15:25:59.403
cmr0su28v000u01o4eavtjkdj	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmr0s6f06000b01o4rt5l6pvl	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmr0rxhhb000101o4e54mg6fr"}	190.97.237.0	2026-06-30 15:26:05.023
cmr0su4al000w01o42ayrxkjn	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmr0s6f06000b01o4rt5l6pvl	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmr0rxhhb000101o4e54mg6fr"}	190.97.237.0	2026-06-30 15:26:07.678
cmr0sve6b000z01o4x7s6qg6c	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmr0s6f06000b01o4rt5l6pvl	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmr0rxhhb000101o4e54mg6fr"}	190.97.237.0	2026-06-30 15:27:07.139
cmr0t0cck001e01o4pprud1yo	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmr0s0vu2000401o4xnglyo6c	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmr0rxhhb000101o4e54mg6fr"}	\N	2026-06-30 15:30:58.052
cmr1ms20t000a01s3ln1bxpo6	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Encounter	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 0}}	73.8.161.0	2026-07-01 05:24:19.901
cmr1msbb5000c01s36v8osj09	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Encounter	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 0}}	73.8.161.0	2026-07-01 05:24:31.937
cmr1n2s5o000k01s3jydvg29m	cmqmx6t43000101phgcog0v6o	AI_PHI_DISCLOSURE	Encounter	\N	cmqmx6t3y000001phuzs1sirz	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": true, "hasAnamnesis": true, "diagnosesCount": 0}}	73.8.161.0	2026-07-01 05:32:40.332
cmr1n4mq4000m01s3tizku4nz	cmqmx6t43000101phgcog0v6o	AI_PHI_DISCLOSURE	Encounter	\N	cmqmx6t3y000001phuzs1sirz	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": true, "hasAnamnesis": true, "diagnosesCount": 0}}	73.8.161.0	2026-07-01 05:34:06.604
cmr1n56ok000p01s3eftorhdg	cmqmx6t43000101phgcog0v6o	AI_PHI_DISCLOSURE	Prescription	\N	cmqmx6t3y000001phuzs1sirz	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 3}}	73.8.161.0	2026-07-01 05:34:32.468
cmr1n56om000q01s37pnc008m	cmqmx6t43000101phgcog0v6o	AI_PHI_DISCLOSURE	Prescription	\N	cmqmx6t3y000001phuzs1sirz	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "hasAge": false, "purpose": "dose-suggestion", "provider": "anthropic", "hasWeight": false, "hasCondition": false}}	73.8.161.0	2026-07-01 05:34:32.47
cmr1nyez0000501qecxb870g9	cmqmx6t43000101phgcog0v6o	AI_PHI_DISCLOSURE	Encounter	\N	cmqmx6t3y000001phuzs1sirz	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": true, "hasAnamnesis": true, "diagnosesCount": 0}}	73.8.161.0	2026-07-01 05:57:16.236
cmr1nyt21000801qe2u5bn7mg	cmqmx6t43000101phgcog0v6o	AI_PHI_DISCLOSURE	Prescription	\N	cmqmx6t3y000001phuzs1sirz	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 2}}	73.8.161.0	2026-07-01 05:57:34.489
cmr1nyt3o000901qeufbij9z3	cmqmx6t43000101phgcog0v6o	AI_PHI_DISCLOSURE	Prescription	\N	cmqmx6t3y000001phuzs1sirz	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 2}}	73.8.161.0	2026-07-01 05:57:34.548
cmr1nzazp000b01qewxvnshui	cmqmx6t43000101phgcog0v6o	AI_PHI_DISCLOSURE	Encounter	\N	cmqmx6t3y000001phuzs1sirz	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": true, "hasAnamnesis": true, "diagnosesCount": 0}}	73.8.161.0	2026-07-01 05:57:57.733
cmr2831k3001201qehk6rusmc	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	SupportBot	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "SUPPORT_BOT", "outcome": "ALLOWED", "metadata": {"toolsCalled": ["getBillingStatus"], "messageCount": 2}}	190.120.255.0	2026-07-01 15:20:44.451
cmr289268001e01qecbacn7fq	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Encounter	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 4}}	190.120.255.0	2026-07-01 15:25:25.184
cmr289uu1001g01qez5s0olxj	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Encounter	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 4}}	190.120.255.0	2026-07-01 15:26:02.329
cmr3lta4j000f01mvcl22kr71	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmr3l4g3c000501mvsaxou3mo	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmr3l49nd000401mvldhcp7mt"}	\N	2026-07-02 14:32:49.795
cmr3lug6o000m01mvyrsehiqt	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmr3lpvft000b01mve92qn76m	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmr3l49nd000401mvldhcp7mt"}	190.97.237.0	2026-07-02 14:33:44.305
cmr3luh5h000o01mvz3z9d6ct	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmr3lpvft000b01mve92qn76m	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmr3l49nd000401mvldhcp7mt"}	190.97.237.0	2026-07-02 14:33:45.557
cmr3mqgrs001d01mvjg1h9qj3	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Prescription	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 2}}	190.97.237.0	2026-07-02 14:58:38.056
cmrmcsj36004h01lekygau0xj	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrm7xdp4000201le36m2u7h3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-15 17:27:55.554
cmr3murbf001o01mvt2vcxfx2	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Prescription	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 3}}	190.97.237.0	2026-07-02 15:01:58.347
cmr3mv54n001r01mvka7h5l0x	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmr3mbcnd000z01mv5adnn09g"}	\N	2026-07-02 15:02:16.247
cmr3mw79g001y01mvc6v0kcyh	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmr3mpxja001801mvazw4avfh	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmr3mbcnd000z01mv5adnn09g"}	190.97.237.0	2026-07-02 15:03:05.668
cmr3mw8aj002001mvi9xg906b	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmr3mpxja001801mvazw4avfh	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmr3mbcnd000z01mv5adnn09g"}	190.97.237.0	2026-07-02 15:03:07.003
cmr3n18lx002d01mvpgffkeze	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmr3mbcnd000z01mv5adnn09g"}	\N	2026-07-02 15:07:00.693
cmr3n1y3m002j01mvdhngbjwq	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmr3mbcnd000z01mv5adnn09g"}	\N	2026-07-02 15:07:33.73
cmr3odk1b003301mvrcyyrbnj	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmr3o2wjj002t01mvnvh8ul2p	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmr3o2o4b002s01mvksm30bdc"}	\N	2026-07-02 15:44:34.991
cmr3of880003a01mvj70abvjs	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmr3ob6qc002w01mv0x5syiqa	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmr3o2o4b002s01mvksm30bdc"}	190.97.237.0	2026-07-02 15:45:52.993
cmr3ofyl2003e01mvzhhvoc8l	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmr3ob6qc002w01mv0x5syiqa	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmr3o2o4b002s01mvksm30bdc"}	190.97.237.0	2026-07-02 15:46:27.158
cmr47dy3v000501tcq8g8qd6l	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmr0s0vu2000401o4xnglyo6c	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmr0rxhhb000101o4e54mg6fr"}	\N	2026-07-03 00:36:45.931
cmr4hn87n000901qomnonj5p3	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmr4hn0zq000401qos4ha9blr	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmr0pml9d002001moekmrt320"}	73.8.161.0	2026-07-03 05:23:55.091
cmr4hpemb000f01qotcvyoe1g	cmqva532b000201p39eq8lpiq	AI_PHI_DISCLOSURE	Encounter	\N	cmqva5325000101p3bu118ykx	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": true, "hasAnamnesis": true, "diagnosesCount": 2}}	73.8.161.0	2026-07-03 05:25:36.707
cmr4hpxia000h01qoqu34tqae	cmqva532b000201p39eq8lpiq	AI_PHI_DISCLOSURE	Encounter	\N	cmqva5325000101p3bu118ykx	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": true, "hasAnamnesis": true, "diagnosesCount": 2}}	73.8.161.0	2026-07-03 05:26:01.186
cmr4hrkwn000i01qoxne8onbl	cmqva532b000201p39eq8lpiq	CONSULTA_FIRMADA	Encounter	cmr4heozi000001o49o8vbyfv	cmqva5325000101p3bu118ykx	Dayana	{"patientRegistrationId": "cmr0pml9d002001moekmrt320"}	\N	2026-07-03 05:27:18.167
cmr4hsi6h000s01qog66ka1nt	cmqva532b000201p39eq8lpiq	AI_PHI_DISCLOSURE	Encounter	\N	cmqva5325000101p3bu118ykx	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "provider": "anthropic", "hasMotivo": true, "hasVitales": true, "hasAnamnesis": true, "diagnosesCount": 2}}	73.8.161.0	2026-07-03 05:28:01.289
cmr4hsw65000t01qoy1rt7kbf	cmqva532b000201p39eq8lpiq	CONSULTA_FIRMADA	Encounter	cmr4heozi000001o49o8vbyfv	cmqva5325000101p3bu118ykx	Dayana	{"patientRegistrationId": "cmr0pml9d002001moekmrt320"}	\N	2026-07-03 05:28:19.421
cmr7xz47i000301mpct3wv2xg	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmr3mpxja001801mvazw4avfh	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmr3mbcnd000z01mv5adnn09g"}	190.153.10.0	2026-07-05 15:24:22.158
cmr9ito9z001601mpxsfu12u1	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmr0s0vu2000401o4xnglyo6c	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmr0rxhhb000101o4e54mg6fr"}	\N	2026-07-06 17:55:46.343
cmr9l2t2w001z01mp6pady9jk	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Prescription	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "purpose": "drug-interaction-check", "provider": "anthropic", "medicationCount": 2}}	190.97.237.0	2026-07-06 18:58:51.704
cmr9l9vpv002701mpeitobfgf	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmr9ixqs3001d01mp3x2cjps4"}	\N	2026-07-06 19:04:21.715
cmr9l9z0s002d01mpdii8n6cy	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmr9ixxhn001e01mpvrepgcnz	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmr9ixqs3001d01mp3x2cjps4"}	\N	2026-07-06 19:04:25.996
cmr9ldlev002n01mp89zmpvzd	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmr9l2c7c001u01mphrhu31m6	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmr9ixqs3001d01mp3x2cjps4"}	190.97.237.0	2026-07-06 19:07:14.983
cmr9ldmt5002p01mpd666l0m1	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmr9l2c7c001u01mphrhu31m6	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmr9ixqs3001d01mp3x2cjps4"}	190.97.237.0	2026-07-06 19:07:16.793
cmr9lf2uk002x01mpuwhsp4pk	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmr9l2c7c001u01mphrhu31m6	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmr9ixqs3001d01mp3x2cjps4"}	190.97.237.0	2026-07-06 19:08:24.236
cmrdpun19000h01p8k8l4azfy	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Prescription	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 2, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-09 16:23:33.405
cmrdpvj4k000l01p8810iefmj	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Prescription	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 3, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-09 16:24:14.996
cmrksrduz009401p23pfpjmoy	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmrkso836008k01p2bnlj593a	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmrksckaq006901p207fftgs1"}	190.97.237.0	2026-07-14 15:19:23.627
cmrdpwayr000p01p815kt8g67	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Prescription	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-09 16:24:51.075
cmrdpzuut001801p837rps277	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrdoeaj1000201p855pyvef0	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrdoe2ux000101p8azbmt9qg"}	\N	2026-07-09 16:27:36.821
cmrdq02ed001f01p8bku1y2cs	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmrdpu8ty000c01p89qevk5wg	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmrdoe2ux000101p8azbmt9qg"}	190.97.237.0	2026-07-09 16:27:46.597
cmrdq03e1001i01p8x8y08p4l	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmrdpu8ty000c01p89qevk5wg	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmrdoe2ux000101p8azbmt9qg"}	190.97.237.0	2026-07-09 16:27:47.881
cmrdq1s79001q01p8bdujhzxt	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmrdpu8ty000c01p89qevk5wg	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmrdoe2ux000101p8azbmt9qg"}	190.97.237.0	2026-07-09 16:29:06.693
cmrdrmdr0002801p8xbnoihre	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Encounter	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "encounter-assist", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 3, "fieldsSanitized": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-09 17:13:07.356
cmrdrmsnh002a01p8pm82b1ky	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Encounter	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "encounter-assist", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 3, "fieldsSanitized": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-09 17:13:26.669
cmrdrpffy002e01p858wevsnh	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Prescription	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 5, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-09 17:15:29.518
cmrdrpknt002i01p8qbt8j3ex	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Encounter	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "encounter-assist", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 4, "fieldsSanitized": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-09 17:15:36.281
cmrdrppiz002k01p8irh32iyv	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Encounter	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "encounter-assist", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 4, "fieldsSanitized": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-09 17:15:42.587
cmrdrpzc9002m01p8rb151gou	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Encounter	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "encounter-assist", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 4, "fieldsSanitized": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-09 17:15:55.305
cmrdrqgsn002o01p8z8id0zqd	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Encounter	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "encounter-assist", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 4, "fieldsSanitized": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-09 17:16:17.927
cmrdrrtqt002s01p8en10e2ty	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Encounter	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "encounter-assist", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 4, "fieldsSanitized": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-09 17:17:21.365
cmrdrs3k8002u01p8plclx0nx	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Encounter	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "encounter-assist", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "diagnosesCount": 4, "fieldsSanitized": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-09 17:17:34.088
cmrfz1lmf000101ns9o5u99zv	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Encounter	cmrf1bogs002x01p8ec22x1ti	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "plan-suggestion", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "diagnosesCount": 1, "fieldsSanitized": 4, "hasExamenFisico": true, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "medicamentosCount": 0, "hasHistoriaClinica": false, "injectionSuspicious": false, "invisibleCharFields": []}}	73.8.161.0	2026-07-11 06:16:27.063
cmrgl4lgj000g01p2ofjrygjz	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Prescription	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 2, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-11 16:34:38.371
cmrgl5dd5000k01p2gno8sgaa	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Prescription	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 3, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-11 16:35:14.537
cmrgl5ziq000o01p2og0j5mmq	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Prescription	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-11 16:35:43.25
cmrgl6qr5000u01p275htl808	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrgkyi1g000201p2tvci3n5w	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrgkycav000101p22bb4j9of"}	\N	2026-07-11 16:36:18.545
cmrgl7oof001101p2uzlhgov9	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmrgl439e000701p2z87hek2l	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmrgkycav000101p22bb4j9of"}	190.97.237.0	2026-07-11 16:37:02.511
cmrgl7pvp001301p2okbem0mp	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmrgl439e000701p2z87hek2l	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmrgkycav000101p22bb4j9of"}	190.97.237.0	2026-07-11 16:37:04.069
cmrgle5ku001c01p2jz5w8wwu	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Encounter	cmrgkyi1g000201p2tvci3n5w	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "plan-suggestion", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "diagnosesCount": 0, "fieldsSanitized": 2, "hasExamenFisico": true, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "medicamentosCount": 4, "hasHistoriaClinica": false, "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-11 16:42:04.35
cmrglq333001e01p2b1nhjdr7	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrgkyi1g000201p2tvci3n5w	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrgkycav000101p22bb4j9of"}	\N	2026-07-11 16:51:20.991
cmrglxb58002101p2zh784in7	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrglvj5n001m01p21wtrk2mc	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrgkycav000101p22bb4j9of"}	\N	2026-07-11 16:56:58.028
cmrkmhzzt002801p2kuwd8kmp	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmr0o3w6h000401mozcv4wfyt	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmr0o3mnr000301mowkmfiq8t"}	\N	2026-07-14 12:24:08.057
cmrkmtr6h002p01p2bqp8rv3q	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmr0o3w6h000401mozcv4wfyt	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmr0o3mnr000301mowkmfiq8t"}	\N	2026-07-14 12:33:16.505
cmrkmts50002t01p2ovkdkoh4	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmr0p320f000o01mow3o5nt0c	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmr0o3mnr000301mowkmfiq8t"}	190.97.237.0	2026-07-14 12:33:17.748
cmrknq8ne003d01p2tv95vxg8	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrknjvrf003101p21rhx626p	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrknjqty003001p27vao7k4s"}	\N	2026-07-14 12:58:32.138
cmrknrobi003m01p26ygs63ds	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrknjvrf003101p21rhx626p	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrknjqty003001p27vao7k4s"}	\N	2026-07-14 12:59:39.102
cmrknrrot003s01p215v50e06	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrknjvrf003101p21rhx626p	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrknjqty003001p27vao7k4s"}	\N	2026-07-14 12:59:43.469
cmrknsolf004801p2tunfr4x9	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrknjvrf003101p21rhx626p	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrknjqty003001p27vao7k4s"}	\N	2026-07-14 13:00:26.115
cmrkntgwk004i01p2zgx4kwik	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrknjvrf003101p21rhx626p	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrknjqty003001p27vao7k4s"}	\N	2026-07-14 13:01:02.804
cmrknu8ol004t01p2ge1ub3mn	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrknjvrf003101p21rhx626p	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrknjqty003001p27vao7k4s"}	\N	2026-07-14 13:01:38.805
cmrknxmda005501p2ghb0b9o5	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrknjvrf003101p21rhx626p	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrknjqty003001p27vao7k4s"}	\N	2026-07-14 13:04:16.511
cmrkpoih6005p01p2a13kmytu	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrkp9qnw005h01p22ngivvx3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrkp9l1l005g01p20p10qfcd"}	\N	2026-07-14 13:53:10.794
cmrks2mg4006501p28onus5r8	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrkp9qnw005h01p22ngivvx3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrkp9l1l005g01p20p10qfcd"}	\N	2026-07-14 15:00:08.356
cmrksm1g5008401p26recms6l	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrkscq04006a01p27xdrg8rl	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrksckaq006901p207fftgs1"}	\N	2026-07-14 15:15:14.261
cmrksokhc008p01p2kd3h15yv	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Prescription	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 2, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-14 15:17:12.24
cmrksqc11008t01p2c35fghmb	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Prescription	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 3, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-14 15:18:34.597
cmrksr348008x01p210irb7dl	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Prescription	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 4, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-14 15:19:09.704
cmrksrblo009001p2rv4d9tsh	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrkscq04006a01p27xdrg8rl	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrksckaq006901p207fftgs1"}	\N	2026-07-14 15:19:20.7
cmrksreys009601p22914iqht	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmrkso836008k01p2bnlj593a	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmrksckaq006901p207fftgs1"}	190.97.237.0	2026-07-14 15:19:25.06
cmrla8kxj000401nvz5d21ued	cmqva532b000201p39eq8lpiq	EXPORT_PDF_HISTORY	PatientRegistration	cmr0pml9d002001moekmrt320	cmqva5325000101p3bu118ykx	\N	{"channel": "PDF", "patientId": "cmr0pml99001z01mogxs7wdnf"}	73.8.161.0	2026-07-14 23:28:39.415
cmrm85j6d000j01le2llry8ci	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Prescription	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 2, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-15 15:18:04.117
cmrm869x7000m01leh2uf44va	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrm7xdp4000201le36m2u7h3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-15 15:18:38.779
cmrm86cov000q01lerlugoj71	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmrm8508y000e01lepg5zbuer	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmrm7x1l6000101le9hkh0ivo"}	190.97.237.0	2026-07-15 15:18:42.367
cmrm86g18000s01le7yud0zy3	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmrm8508y000e01lepg5zbuer	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmrm7x1l6000101le9hkh0ivo"}	190.97.237.0	2026-07-15 15:18:46.7
cmrm8bwsb001401len5s8dbm6	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrm7xdp4000201le36m2u7h3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-15 15:23:01.691
cmrm8ebqd001d01lechyr7ib8	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmrm8508y000e01lepg5zbuer	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmrm7x1l6000101le9hkh0ivo"}	190.97.237.0	2026-07-15 15:24:54.373
cmrm8i0sd001k01lenthk13lr	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Encounter	cmrm7xdp4000201le36m2u7h3	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "plan-suggestion", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "alergiasCount": 0, "diagnosesCount": 1, "fieldsSanitized": 3, "hasExamenFisico": false, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "medicamentosCount": 2, "hasHistoriaClinica": false, "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-15 15:27:46.813
cmrm8k40v001n01le6r5q45xv	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Encounter	cmrm7xdp4000201le36m2u7h3	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "plan-suggestion", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "alergiasCount": 0, "diagnosesCount": 1, "fieldsSanitized": 3, "hasExamenFisico": false, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "medicamentosCount": 2, "hasHistoriaClinica": false, "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-15 15:29:24.319
cmrm8kev7001p01lej8tnabkd	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Encounter	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "encounter-assist", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "alergiasCount": 0, "diagnosesCount": 1, "fieldsSanitized": 5, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-15 15:29:38.371
cmrm8kvh6001r01le7mqsxjyy	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Encounter	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "encounter-assist", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "hasAnamnesis": true, "alergiasCount": 0, "diagnosesCount": 1, "fieldsSanitized": 5, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-15 15:29:59.898
cmrm8wrf2002101le5mlunx8n	cmqlsyn9e000301qgk98rcsjh	AI_PHI_DISCLOSURE	Prescription	\N	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "drug-interactions", "purpose": "drug-interaction-check", "provider": "anthropic", "fieldsSanitized": 1, "medicationCount": 3, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "injectionSuspicious": false, "invisibleCharFields": []}}	190.97.237.0	2026-07-15 15:39:14.51
cmrm8xdqn002401lecsdtskqk	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrm7xdp4000201le36m2u7h3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-15 15:39:43.439
cmrm8xrys002801ler1wdd595	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmrm8508y000e01lepg5zbuer	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmrm7x1l6000101le9hkh0ivo"}	190.97.237.0	2026-07-15 15:40:01.877
cmrm8y3ym002a01le1xzqeo2o	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmrm8508y000e01lepg5zbuer	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmrm7x1l6000101le9hkh0ivo"}	190.97.237.0	2026-07-15 15:40:17.422
cmrm8zxbw002c01lethjr23ac	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmrm8508y000e01lepg5zbuer	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmrm7x1l6000101le9hkh0ivo"}	190.97.237.0	2026-07-15 15:41:42.14
cmrm900qn002i01leyfddjvkb	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmrm8508y000e01lepg5zbuer	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmrm7x1l6000101le9hkh0ivo"}	190.97.237.0	2026-07-15 15:41:46.559
cmrmb5en3002t01lead47hkkq	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrm7xdp4000201le36m2u7h3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-15 16:41:57.087
cmrmbt6ar003l01lek8naeln6	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrm7xdp4000201le36m2u7h3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-15 17:00:26.019
cmrmbt8sv003p01lehgi9ydez	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmrm8508y000e01lepg5zbuer	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmrm7x1l6000101le9hkh0ivo"}	190.97.237.0	2026-07-15 17:00:29.263
cmrmbtalh003r01lec0j7l5fy	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmrm8508y000e01lepg5zbuer	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmrm7x1l6000101le9hkh0ivo"}	190.97.237.0	2026-07-15 17:00:31.589
cmrmcrh7w004801leoa8mlnql	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrm7xdp4000201le36m2u7h3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-15 17:27:06.476
cmrmd5l7h005v01le931pei6i	cmqva532b000201p39eq8lpiq	CONSULTA_FIRMADA	Encounter	cmr4heozi000001o49o8vbyfv	cmqva5325000101p3bu118ykx	Dayana	{"patientRegistrationId": "cmr0pml9d002001moekmrt320"}	\N	2026-07-15 17:38:04.829
cmrmp4pcf006501lek75i1go3	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrm7xdp4000201le36m2u7h3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-15 23:13:18.927
cmrmrujei000l01o518f13e64	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrm7xdp4000201le36m2u7h3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-16 00:29:23.514
cmrmrzlm2000z01o53rxdjall	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_HISTORY	PatientRegistration	cmrm7x1l6000101le9hkh0ivo	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmrm7x1kp000001lef5ixp0z1"}	73.8.161.0	2026-07-16 00:33:19.658
cmrms062u001101o56tttsgdq	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_HISTORY	PatientRegistration	cmrm7x1l6000101le9hkh0ivo	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmrm7x1kp000001lef5ixp0z1"}	73.8.161.0	2026-07-16 00:33:46.183
cmrmtzrmb000101o0u3mrp0ad	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrm7xdp4000201le36m2u7h3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-16 01:29:26.675
cmrmuhmou000901sko6k9sngb	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrm7xdp4000201le36m2u7h3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-16 01:43:20.094
cmrmvasjg000b01o45bl5yk55	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrm7xdp4000201le36m2u7h3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-16 02:06:00.7
cmrmvgqa4001701o4zm8p4dbq	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrmvcduv000p01o4j8738baa	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-16 02:10:37.708
cmrmvlcja001m01o43rbkvlia	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrmvcduv000p01o4j8738baa	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-16 02:14:13.174
cmrmvtpif001w01o4b0l7wsdb	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrmvcduv000p01o4j8738baa	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-16 02:20:43.24
cmrmvu1qn002201o4hu6xrkw4	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrmvcduv000p01o4j8738baa	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-16 02:20:59.087
cmrmvz8nh000101p7mv3gm1rx	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrmvcduv000p01o4j8738baa	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-16 02:25:01.325
cmrmvzwj4000c01p7t7nhdy5i	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrmvcduv000p01o4j8738baa	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-16 02:25:32.272
cmrmwbg80000d01peq5v2i4d4	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrmvcduv000p01o4j8738baa	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-16 02:34:31.008
cmrmwfi53000s01pe0808ztqw	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrm7xdp4000201le36m2u7h3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-16 02:37:40.119
cmrmwg10r001001pet0l8vkps	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrm7xdp4000201le36m2u7h3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-16 02:38:04.587
cmrmwiule001901peea09no6d	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrm7xdp4000201le36m2u7h3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-16 02:40:16.226
cmrmwlcxg001h01pespn6znh9	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrm7xdp4000201le36m2u7h3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-16 02:42:13.3
cmrmx49k2000c01noecu4c2vo	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrm7xdp4000201le36m2u7h3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-16 02:56:55.394
cmrmx4al8000f01no8trosrsn	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrmvcduv000p01o4j8738baa	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-16 02:56:56.732
cmrmxqn6x000b01l4wwtexafl	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrmvcduv000p01o4j8738baa	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-16 03:14:19.497
cmrmy6l7o001t01l45gsv175v	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrm7xdp4000201le36m2u7h3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-16 03:26:43.428
cmrmy6v59002101l40zo2idix	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrmxqh83000301l4r0h0ptoh	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrmxq8ka000201l47pf9hqql"}	\N	2026-07-16 03:26:56.301
cmrmyinzp000601qk6jomx1ps	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrmyi1yv000301qkbohrm1tb	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrmyhl95000201qk048pvbah"}	\N	2026-07-16 03:36:06.901
cmrn04zeb000f01o7i8646y2j	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmr3mbiyy001201mvd3m4j8c3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmr3mbcnd000z01mv5adnn09g"}	\N	2026-07-16 04:21:27.731
cmrnlblzo000s01lygq7znvic	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrnkzdv5000401lycs6k93t5	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmr7yg1w8000f01mpyn3ufito"}	\N	2026-07-16 14:14:28.884
cmrnlf06i001901lyyw2nhvs0	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrnkzdv5000401lycs6k93t5	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmr7yg1w8000f01mpyn3ufito"}	\N	2026-07-16 14:17:07.242
cmrnlgtql001l01lyfz7n69rz	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrnkzdv5000401lycs6k93t5	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmr7yg1w8000f01mpyn3ufito"}	\N	2026-07-16 14:18:32.205
cmrnmdxtf000501ns0enedai9	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrm7xdp4000201le36m2u7h3	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-16 14:44:17.139
cmrnme2v5000901nsqba24vv1	cmqlsyn9e000301qgk98rcsjh	EXPORT_PDF_PRESCRIPTION	Prescription	cmrm8508y000e01lepg5zbuer	cmqlsyn94000201qg8eeqn1c2	\N	{"channel": "PDF", "patientId": "cmrm7x1l6000101le9hkh0ivo"}	190.153.18.0	2026-07-16 14:44:23.681
cmrnnm934001d01nsyxc2mnng	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrnn6us3000o01nslj0cqok8	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrnn6o6r000n01nsjdj83ngo"}	\N	2026-07-16 15:18:44.608
cmrnnot21000r01p3nbwyg8ql	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrnn6us3000o01nslj0cqok8	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrnn6o6r000n01nsjdj83ngo"}	\N	2026-07-16 15:20:43.801
cmrnq4kie001801rsxsgtiqs9	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrnoph78000601rs9qecv79i	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrm7x1l6000101le9hkh0ivo"}	\N	2026-07-16 16:28:58.454
cmrnvoltu000o01nhr5o7phrx	cmqlsyn9e000301qgk98rcsjh	CONSULTA_FIRMADA	Encounter	cmrnvmrsd000a01nhqfxkhb30	cmqlsyn94000201qg8eeqn1c2	Joel	{"patientRegistrationId": "cmrnvmezr000901nhnhxo4axt"}	\N	2026-07-16 19:04:31.362
cmroeatgx000501p2ey1xdkth	cmqmx6t43000101phgcog0v6o	AI_PHI_DISCLOSURE	Encounter	cmroe94rq000001p2i6w1c9kx	cmqmx6t3y000001phuzs1sirz	\N	{"channel": "API", "metadata": {"model": "claude-haiku-4-5-20251001", "feature": "plan-suggestion", "provider": "anthropic", "hasMotivo": true, "hasVitales": false, "alergiasCount": 0, "diagnosesCount": 0, "fieldsSanitized": 2, "hasExamenFisico": true, "truncatedFields": [], "guardrailsApplied": true, "injectionPatterns": [], "medicamentosCount": 0, "hasHistoriaClinica": false, "injectionSuspicious": false, "invisibleCharFields": []}}	73.8.161.0	2026-07-17 03:45:40.785
cmroedf88000e01p2ju0q9zxi	cmqmx6t43000101phgcog0v6o	CONSULTA_FIRMADA	Encounter	cmroe94rq000001p2i6w1c9kx	cmqmx6t3y000001phuzs1sirz	Carlos	{"patientRegistrationId": "cmrodfwag000101r0up24yxhe"}	\N	2026-07-17 03:47:42.296
cmroi0dv0000c01o0s8kb5sx5	cmqva532b000201p39eq8lpiq	CONSULTA_FIRMADA	Encounter	cmr4heozi000001o49o8vbyfv	cmqva5325000101p3bu118ykx	Dayana	{"patientRegistrationId": "cmr0pml9d002001moekmrt320"}	\N	2026-07-17 05:29:32.46
cmroibj3r000501qye5coz9q8	cmqva532b000201p39eq8lpiq	CONSULTA_FIRMADA	Encounter	cmr4heozi000001o49o8vbyfv	cmqva5325000101p3bu118ykx	Dayana	{"patientRegistrationId": "cmr0pml9d002001moekmrt320"}	\N	2026-07-17 05:38:12.471
cmroibl76000a01qyy0vuwuf3	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmr4hn0zq000401qos4ha9blr	cmr0pml99001z01mogxs7wdnf	\N	{"channel": "PDF", "patientId": "cmr0pml9d002001moekmrt320"}	127.0.0.0	2026-07-17 05:38:15.186
cmrp0zpsq000501qd44f6mj6n	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmr4hn0zq000401qos4ha9blr	cmr0pml99001z01mogxs7wdnf	\N	{"channel": "PDF", "patientId": "cmr0pml9d002001moekmrt320"}	73.8.161.0	2026-07-17 14:20:53.978
cmrp11150000701qdjpgqv8ro	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmr4hn0zq000401qos4ha9blr	cmr0pml99001z01mogxs7wdnf	\N	{"channel": "PDF", "patientId": "cmr0pml9d002001moekmrt320"}	73.8.161.0	2026-07-17 14:21:55.332
cmrp39gd8000101lmqy19fati	cmqva532b000201p39eq8lpiq	EXPORT_PDF_PRESCRIPTION	Prescription	cmr4hn0zq000401qos4ha9blr	cmr0pml99001z01mogxs7wdnf	\N	{"channel": "PDF", "patientId": "cmr0pml9d002001moekmrt320"}	73.8.161.0	2026-07-17 15:24:27.548
cmrpe0rt8000101o1d7cyjbv9	cmqmx6t43000101phgcog0v6o	ACCESS_DENIED	Encounter	cmrnn6us3000o01nslj0cqok8	cmqmx6t3y000001phuzs1sirz	\N	{"channel": "PDF", "outcome": "DENIED"}	73.8.161.0	2026-07-17 20:25:38.253
cmrpe0y9m000301o1c6vh9uxk	cmqmx6t43000101phgcog0v6o	ACCESS_DENIED	Encounter	cmrnn6us3000o01nslj0cqok8	cmqmx6t3y000001phuzs1sirz	\N	{"channel": "PDF", "outcome": "DENIED"}	73.8.161.0	2026-07-17 20:25:46.618
\.


--
-- Data for Name: AvailabilityException; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."AvailabilityException" (id, "workspaceId", fecha, motivo, "createdAt") FROM stdin;
\.


--
-- Data for Name: BreachIncident; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."BreachIncident" (id, slug, title, severity, status, "detectedAt", "containedAt", "notifiedAt", "closedAt", "affectedUsers", "affectedWorkspaces", "dataCategories", description, "rootCause", remediation, "reportedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Clinic; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."Clinic" (id, nombre, slug, rif, "razonSocial", direccion, telefono, email, website, "logoUrl", "bannerUrl", descripcion, servicios, "redesSociales", activa, "createdAt", "updatedAt", "nombreCifrado", "razonSocialCifrada", "direccionCifrada", "telefonoCifrado", "emailCifrado", estado, ciudad, plan, "stripeCustomerId", "stripeSubscriptionId", "stripePriceId", "stripeCurrentPeriodEnd") FROM stdin;
demo_clinic_001	Centro Médico La Castellana	centro-medico-la-castellana	J-12345678-9	Centro Médico La Castellana C.A.	Av. Principal de La Castellana, Torre Alfa, Piso 3, Consultorio 3-A	02129551234	contacto@clcastellana.demo	https://clcastellana.demo	\N	\N	Centro médico multidisciplinario con 8 consultorios y laboratorio propio. Atención integral en cardiología, pediatría, ginecología y medicina interna.	{Cardiología,Pediatría,Ginecología,"Medicina Interna",Laboratorio,Imagenología}	\N	t	2025-07-01 06:15:10.034	2025-07-01 06:15:10.034	\N	\N	\N	\N	\N	Miranda	Caracas	CLINIC_PREMIUM	\N	\N	\N	\N
\.


--
-- Data for Name: ClinicAdmin; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."ClinicAdmin" (id, email, "passwordHash", nombre, apellido, telefono, role, "clinicId", activo, "lastLoginAt", "failedAttempts", "createdAt", "updatedAt") FROM stdin;
demo_clinicadmin_001	admin.clinica@clcastellana.demo	$2b$10$zEPNfbCPbLz8XI5VjTMc.uMgSrZ2E6qmXGEdo027tKZV6SXYiJBXK	Roberto Andrés	Morales Gil	04141112233	OWNER	demo_clinic_001	t	2026-06-29 06:16:15.563	0	2026-01-01 06:16:15.563	2026-06-29 06:16:15.563
\.


--
-- Data for Name: ClinicInvitationCode; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."ClinicInvitationCode" (id, "clinicId", code, used, "usedById", "createdAt", "isExtraSeat") FROM stdin;
\.


--
-- Data for Name: ClinicPost; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."ClinicPost" (id, "clinicId", titulo, contenido, "imagenUrl", "publicadoAt", activo, "createdAt") FROM stdin;
\.


--
-- Data for Name: ConsentAcceptance; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."ConsentAcceptance" (id, "doctorId", "legalVersionId", slug, version, ip, "userAgent", explicit, "createdAt") FROM stdin;
cmqv0591s000201kqs1j27hfe	cmqmx6t3y000001phuzs1sirz	lv_terminos_1_0_0	terminos	1.0.0	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-06-26 14:04:07.312
cmqv05928000301kq1d6a1ao2	cmqmx6t3y000001phuzs1sirz	lv_privacidad_1_0_0	privacidad	1.0.0	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-06-26 14:04:07.328
cmqv0592b000401kqe180l9ae	cmqmx6t3y000001phuzs1sirz	lv_cookies_1_0_0	cookies	1.0.0	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-06-26 14:04:07.331
cmqv0592e000501kq9dv3fne0	cmqmx6t3y000001phuzs1sirz	lv_lopdp_consentimiento_1_0_0	lopdp-consentimiento	1.0.0	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-06-26 14:04:07.334
cmqv1k9sg000001rzpb5v36lb	cmqmx6t3y000001phuzs1sirz	cl_lc_1_1_0_terminos_v2	terminos	1.1.0	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-06-26 14:43:47.728
cmqv1k9t7000101rzprhq1xhp	cmqmx6t3y000001phuzs1sirz	cl_lc_1_1_0_privacidad_v2	privacidad	1.1.0	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-06-26 14:43:47.755
cmqv1k9tg000201rzyfdnp1ya	cmqmx6t3y000001phuzs1sirz	cl_lc_1_1_0_cookies_v2	cookies	1.1.0	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-06-26 14:43:47.764
cmqv1k9tl000301rzukbvfjal	cmqmx6t3y000001phuzs1sirz	cl_lc_1_1_0_lopdp_v2	lopdp-consentimiento	1.1.0	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-06-26 14:43:47.769
cmqv5qr5x000101qoh4zwtmbj	cmqlsyn94000201qg8eeqn1c2	cl_lc_1_1_0_terminos_v2	terminos	1.1.0	200.82.223.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	t	2026-06-26 16:40:48.645
cmqv5qr6a000201qouvnmlw8t	cmqlsyn94000201qg8eeqn1c2	cl_lc_1_1_0_privacidad_v2	privacidad	1.1.0	200.82.223.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	t	2026-06-26 16:40:48.658
cmqv5qr6i000301qo7naixg8f	cmqlsyn94000201qg8eeqn1c2	cl_lc_1_1_0_cookies_v2	cookies	1.1.0	200.82.223.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	t	2026-06-26 16:40:48.666
cmqv5qr6k000401qo0d0tqvoa	cmqlsyn94000201qg8eeqn1c2	cl_lc_1_1_0_lopdp_v2	lopdp-consentimiento	1.1.0	200.82.223.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	t	2026-06-26 16:40:48.668
cmqva532g000301p3i6l0lq1a	cmqva5325000101p3bu118ykx	cl_lc_1_1_0_terminos_v2	terminos	1.1.0	73.8.161***	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-06-26 18:43:55.72
cmqva532l000401p3eq3bkm18	cmqva5325000101p3bu118ykx	cl_lc_1_1_0_privacidad_v2	privacidad	1.1.0	73.8.161***	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-06-26 18:43:55.725
cmqva532s000501p3j5cxv42t	cmqva5325000101p3bu118ykx	cl_lc_1_1_0_cookies_v2	cookies	1.1.0	73.8.161***	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-06-26 18:43:55.732
cmqva532v000601p31i5ie7mr	cmqva5325000101p3bu118ykx	cl_lc_1_1_0_lopdp_v2	lopdp-consentimiento	1.1.0	73.8.161***	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-06-26 18:43:55.735
cmqva5a4r000701p3wfhtwqjt	cmqva5325000101p3bu118ykx	cl_lc_1_1_0_terminos_v2	terminos	1.1.0	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-06-26 18:44:04.875
cmqva5a59000801p3ipctsbk1	cmqva5325000101p3bu118ykx	cl_lc_1_1_0_privacidad_v2	privacidad	1.1.0	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-06-26 18:44:04.894
cmqva5a5l000901p31zp6r4ea	cmqva5325000101p3bu118ykx	cl_lc_1_1_0_cookies_v2	cookies	1.1.0	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-06-26 18:44:04.905
cmqva5a5p000a01p380hrymmf	cmqva5325000101p3bu118ykx	cl_lc_1_1_0_lopdp_v2	lopdp-consentimiento	1.1.0	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-06-26 18:44:04.909
cmqy883aa000301o7sw107miz	cmqy8838b000101o7xuh055nu	cl_lc_1_1_0_terminos_v2	terminos	1.1.0	190.120.***	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	t	2026-06-28 20:13:35.266
cmqy883an000401o7un9x82pa	cmqy8838b000101o7xuh055nu	cl_lc_1_1_0_privacidad_v2	privacidad	1.1.0	190.120.***	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	t	2026-06-28 20:13:35.28
cmqy883b4000501o71qd1esjr	cmqy8838b000101o7xuh055nu	cl_lc_1_1_0_cookies_v2	cookies	1.1.0	190.120.***	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	t	2026-06-28 20:13:35.296
cmqy883ba000601o7niveaz8c	cmqy8838b000101o7xuh055nu	cl_lc_1_1_0_lopdp_v2	lopdp-consentimiento	1.1.0	190.120.***	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	t	2026-06-28 20:13:35.302
cmqy88tc2000701o740o8hyu2	cmqy8838b000101o7xuh055nu	cl_lc_1_1_0_terminos_v2	terminos	1.1.0	190.120.253.0	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	t	2026-06-28 20:14:09.026
cmqy88tcn000801o7uhify1et	cmqy8838b000101o7xuh055nu	cl_lc_1_1_0_privacidad_v2	privacidad	1.1.0	190.120.253.0	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	t	2026-06-28 20:14:09.048
cmqy88td2000901o7fpewd917	cmqy8838b000101o7xuh055nu	cl_lc_1_1_0_cookies_v2	cookies	1.1.0	190.120.253.0	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	t	2026-06-28 20:14:09.062
cmqy88td4000a01o7ajbjx6j3	cmqy8838b000101o7xuh055nu	cl_lc_1_1_0_lopdp_v2	lopdp-consentimiento	1.1.0	190.120.253.0	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	t	2026-06-28 20:14:09.064
7172438c-7b6e-4306-aa78-8514bff7cb0d	cmqmgxvrx000001oa0fupphfw	lv_terminos_1_0_0	terminos	1.0.0	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-07-01 12:20:18.394
ae0c4b1a-6c29-4ec4-a597-76c52005d17b	cmqmgxvrx000001oa0fupphfw	lv_privacidad_1_0_0	privacidad	1.0.0	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-07-01 12:20:18.394
212ca4bd-6c92-4412-b892-3c473059ec71	cmqmgxvrx000001oa0fupphfw	lv_cookies_1_0_0	cookies	1.0.0	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-07-01 12:20:18.394
a5fbe917-3d74-4d8c-8191-e41f9cb6f300	cmqmgxvrx000001oa0fupphfw	lv_lopdp_consentimiento_1_0_0	lopdp-consentimiento	1.0.0	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-07-01 12:20:18.394
f3ad6f04-9147-43bf-86b7-b5f989005010	cmqmgxvrx000001oa0fupphfw	cl_lc_1_1_0_terminos_v2	terminos	1.1.0	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-07-01 12:20:18.394
38643738-21d3-4515-adac-605f982e99ed	cmqmgxvrx000001oa0fupphfw	cl_lc_1_1_0_privacidad_v2	privacidad	1.1.0	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-07-01 12:20:18.394
e09ea3f3-cfaf-4d5f-886c-23ee6d3975d1	cmqmgxvrx000001oa0fupphfw	cl_lc_1_1_0_cookies_v2	cookies	1.1.0	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-07-01 12:20:18.394
3f4d0c16-c526-4fda-af63-33380b4526ed	cmqmgxvrx000001oa0fupphfw	cl_lc_1_1_0_lopdp_v2	lopdp-consentimiento	1.1.0	73.8.161.0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-07-01 12:20:18.394
cmrf70duk003c01p86qxpgyvb	cmrf70du1003a01p8f2k0qlkg	cl_lc_1_1_0_terminos_v2	terminos	1.1.0	190.6.33***	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	t	2026-07-10 17:11:41.084
cmrf70dus003d01p8lllvwouu	cmrf70du1003a01p8f2k0qlkg	cl_lc_1_1_0_privacidad_v2	privacidad	1.1.0	190.6.33***	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	t	2026-07-10 17:11:41.092
cmrf70duu003e01p8t2jh1o3h	cmrf70du1003a01p8f2k0qlkg	cl_lc_1_1_0_cookies_v2	cookies	1.1.0	190.6.33***	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	t	2026-07-10 17:11:41.094
cmrf70duv003f01p8sfw1d0ia	cmrf70du1003a01p8f2k0qlkg	cl_lc_1_1_0_lopdp_v2	lopdp-consentimiento	1.1.0	190.6.33***	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	t	2026-07-10 17:11:41.095
cmrf70ngw003g01p8przgv2ch	cmrf70du1003a01p8f2k0qlkg	cl_lc_1_1_0_terminos_v2	terminos	1.1.0	190.6.33.0	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	t	2026-07-10 17:11:53.552
cmrf70nh2003h01p8dpm8l0py	cmrf70du1003a01p8f2k0qlkg	cl_lc_1_1_0_privacidad_v2	privacidad	1.1.0	190.6.33.0	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	t	2026-07-10 17:11:53.558
cmrf70nh5003i01p8j4ey9r65	cmrf70du1003a01p8f2k0qlkg	cl_lc_1_1_0_cookies_v2	cookies	1.1.0	190.6.33.0	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	t	2026-07-10 17:11:53.561
cmrf70nh7003j01p8ggjo6qz8	cmrf70du1003a01p8f2k0qlkg	cl_lc_1_1_0_lopdp_v2	lopdp-consentimiento	1.1.0	190.6.33.0	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	t	2026-07-10 17:11:53.563
cmrodu1xn000601r0dw1hscuh	cmrodu1x1000401r0as2udib9	cl_lc_1_1_0_terminos_v2	terminos	1.1.0	190.94.2***	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.113 Mobile/15E148 Safari/604.1	t	2026-07-17 03:32:38.603
cmrodu1y3000701r0g9gtybdy	cmrodu1x1000401r0as2udib9	cl_lc_1_1_0_privacidad_v2	privacidad	1.1.0	190.94.2***	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.113 Mobile/15E148 Safari/604.1	t	2026-07-17 03:32:38.619
cmrodu1y6000801r0qcekpuh1	cmrodu1x1000401r0as2udib9	cl_lc_1_1_0_cookies_v2	cookies	1.1.0	190.94.2***	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.113 Mobile/15E148 Safari/604.1	t	2026-07-17 03:32:38.622
cmrodu1y8000901r06ljzgpn2	cmrodu1x1000401r0as2udib9	cl_lc_1_1_0_lopdp_v2	lopdp-consentimiento	1.1.0	190.94.2***	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.113 Mobile/15E148 Safari/604.1	t	2026-07-17 03:32:38.624
cmrodulmw000a01r0s6zs49b0	cmrodu1x1000401r0as2udib9	cl_lc_1_1_0_terminos_v2	terminos	1.1.0	190.94.212.0	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.113 Mobile/15E148 Safari/604.1	t	2026-07-17 03:33:04.136
cmroduln4000b01r0uhj5kq21	cmrodu1x1000401r0as2udib9	cl_lc_1_1_0_privacidad_v2	privacidad	1.1.0	190.94.212.0	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.113 Mobile/15E148 Safari/604.1	t	2026-07-17 03:33:04.144
cmrodulna000c01r0vu8c2bbd	cmrodu1x1000401r0as2udib9	cl_lc_1_1_0_lopdp_v2	lopdp-consentimiento	1.1.0	190.94.212.0	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.113 Mobile/15E148 Safari/604.1	t	2026-07-17 03:33:04.15
cmrp83c3d000c01lmbkwfpccn	cmrp83c2e000a01lm4yifqc0c	cl_lc_1_1_0_terminos_v2	terminos	1.1.0	161.140.***	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Mobile/15E148 Safari/604.1	t	2026-07-17 17:39:40.153
cmrp83c3w000d01lmw6aq92n1	cmrp83c2e000a01lm4yifqc0c	cl_lc_1_1_0_privacidad_v2	privacidad	1.1.0	161.140.***	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Mobile/15E148 Safari/604.1	t	2026-07-17 17:39:40.172
cmrp83c46000e01lm0bkbswy5	cmrp83c2e000a01lm4yifqc0c	cl_lc_1_1_0_cookies_v2	cookies	1.1.0	161.140.***	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Mobile/15E148 Safari/604.1	t	2026-07-17 17:39:40.182
cmrp83c4t000f01lmr6jpw4o7	cmrp83c2e000a01lm4yifqc0c	cl_lc_1_1_0_lopdp_v2	lopdp-consentimiento	1.1.0	161.140.***	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Mobile/15E148 Safari/604.1	t	2026-07-17 17:39:40.205
cmrp83sov000g01lmmdtxr4th	cmrp83c2e000a01lm4yifqc0c	cl_lc_1_1_0_privacidad_v2	privacidad	1.1.0	161.140.102.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Mobile/15E148 Safari/604.1	t	2026-07-17 17:40:01.663
cmrp83sp0000h01lmgb9niegl	cmrp83c2e000a01lm4yifqc0c	cl_lc_1_1_0_terminos_v2	terminos	1.1.0	161.140.102.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Mobile/15E148 Safari/604.1	t	2026-07-17 17:40:01.668
cmrp83sp2000i01lmh9cm5iu1	cmrp83c2e000a01lm4yifqc0c	cl_lc_1_1_0_cookies_v2	cookies	1.1.0	161.140.102.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Mobile/15E148 Safari/604.1	t	2026-07-17 17:40:01.67
cmrp83sp4000j01lmlilxe36i	cmrp83c2e000a01lm4yifqc0c	cl_lc_1_1_0_lopdp_v2	lopdp-consentimiento	1.1.0	161.140.102.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Mobile/15E148 Safari/604.1	t	2026-07-17 17:40:01.672
cmrpefiez000701o1fez2j4vb	cmrpefiai000501o10fgledn0	cl_lc_1_1_0_terminos_v2	terminos	1.1.0	186.167.***	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	t	2026-07-17 20:37:05.915
cmrpefifd000801o1pim4pofa	cmrpefiai000501o10fgledn0	cl_lc_1_1_0_privacidad_v2	privacidad	1.1.0	186.167.***	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	t	2026-07-17 20:37:05.929
cmrpefifo000901o1hemg8lgr	cmrpefiai000501o10fgledn0	cl_lc_1_1_0_cookies_v2	cookies	1.1.0	186.167.***	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	t	2026-07-17 20:37:05.94
cmrpefift000a01o12bz35yxk	cmrpefiai000501o10fgledn0	cl_lc_1_1_0_lopdp_v2	lopdp-consentimiento	1.1.0	186.167.***	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	t	2026-07-17 20:37:05.945
cmrpeg4c1000b01o11wab8oxb	cmrpefiai000501o10fgledn0	cl_lc_1_1_0_terminos_v2	terminos	1.1.0	186.167.227.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	t	2026-07-17 20:37:34.321
cmrpeg4c7000c01o1f5geqpow	cmrpefiai000501o10fgledn0	cl_lc_1_1_0_privacidad_v2	privacidad	1.1.0	186.167.227.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	t	2026-07-17 20:37:34.328
cmrpeg4cj000d01o10vsakep5	cmrpefiai000501o10fgledn0	cl_lc_1_1_0_cookies_v2	cookies	1.1.0	186.167.227.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	t	2026-07-17 20:37:34.339
cmrpeg4cn000e01o13ybeuf99	cmrpefiai000501o10fgledn0	cl_lc_1_1_0_lopdp_v2	lopdp-consentimiento	1.1.0	186.167.227.0	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	t	2026-07-17 20:37:34.343
\.


--
-- Data for Name: ConsentTemplate; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."ConsentTemplate" (id, "workspaceId", titulo, contenido, activo, "createdAt") FROM stdin;
\.


--
-- Data for Name: DataDeletionRequest; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."DataDeletionRequest" (id, "doctorId", "patientCedulaHMAC", status, reason, "approvedAt", "appliedAt", "tombstoneId", ip, "requestedAt") FROM stdin;
\.


--
-- Data for Name: DataExportRequest; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."DataExportRequest" (id, "doctorId", "patientCedulaHMAC", scope, status, "downloadToken", "downloadUrl", "expiresAt", "requestedAt", "readyAt", "downloadedAt", "closedAt", ip, notes) FROM stdin;
\.


--
-- Data for Name: Diagnosis; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."Diagnosis" (id, "encounterId", "codigoCie10", descripcion, tipo, "createdAt") FROM stdin;
cmr0264zf000k01muv7qstx68	cmr020v9j000g01mub1fw5j0k	I10	Hipertensión esencial (primaria)	PRINCIPAL	2026-06-30 02:59:38.811
cmr026grd000m01mug7c2bgko	cmr020v9j000g01mub1fw5j0k	H52	Trastornos de acomodación y de refracción	PRINCIPAL	2026-06-30 02:59:54.073
cmr03qj6v001h01lgavddzikq	cmr03p3cc001b01lg7ny2zohc	S/C	Manalgia	PRINCIPAL	2026-06-30 03:43:29.959
cmr04qpdu001501pxqe8vdocb	cmr04q3hj001201pxr3v245pj	R51	Cefalea	PRINCIPAL	2026-06-30 04:11:37.602
cmr0oom03000801moqipy6lsa	cmr0o3w6h000401mozcv4wfyt	S/C	Desgarro muscular de gastronemio interno de pierna derecha	PRINCIPAL	2026-06-30 13:29:52.227
cmr0s6288000901o417t40a2a	cmr0s0vu2000401o4xnglyo6c	S/C	Coccigodinia cronica	PRINCIPAL	2026-06-30 15:07:25.256
cmr0sys8v001201o4z3dsx60n	cmr0s0vu2000401o4xnglyo6c	S/C	artrosis de cadera derecha	PRINCIPAL	2026-06-30 15:29:45.343
cmr0syz39001401o4g8chuvft	cmr0s0vu2000401o4xnglyo6c	S/C	artrosis de rodilla derecha	PRINCIPAL	2026-06-30 15:29:54.213
cmr0szy6w001901o4r2vgwl5r	cmr0s0vu2000401o4xnglyo6c	S/C	post operatorio tardio artroplastia de rodilla izquierda	PRINCIPAL	2026-06-30 15:30:39.704
cmr3lp9tl000901mv4zzw04xz	cmr3l4g3c000501mvsaxou3mo	S/C	fractura oblicua de 3er metacarpiano de mano derecha	PRINCIPAL	2026-07-02 14:29:42.778
cmr3mpcw1001601mvjktx18ji	cmr3mbiyy001201mvd3m4j8c3	S/C	gota en hallux izquierdo	PRINCIPAL	2026-07-02 14:57:46.369
cmr3mzsgt002b01mvi9g84dnv	cmr3mbiyy001201mvd3m4j8c3	S/C	discopatia lumbar l3-l4 l4-l5 l5-s1	PRINCIPAL	2026-07-02 15:05:53.117
cmr4hl7li000001qo36ufsnl3	cmr4heozi000001o49o8vbyfv	G43	Migraña	PRINCIPAL	2026-07-03 05:22:20.982
cmr4hme1v000201qofbthbmn4	cmr4heozi000001o49o8vbyfv	S/C	hipertension endocraneal	PRINCIPAL	2026-07-03 05:23:16.003
cmr7yhnjj000j01mpopv7eh3z	cmr7ygjy9000g01mpw0hcawcx	K30	Dispepsia funcional	PRINCIPAL	2026-07-05 15:38:47.023
cmr9l01hl001j01mpsvrsadnl	cmr9ixxhn001e01mpvrepgcnz	S/C	gonalgia derecha	PRINCIPAL	2026-07-06 18:56:42.633
cmr9l0j1b001l01mphos2pjum	cmr9ixxhn001e01mpvrepgcnz	S/C	rotura cuerno anterior y posterior de menisco interno de rodilla derecha	PRINCIPAL	2026-07-06 18:57:05.375
cmr9l1e1u001q01mpwptho4qh	cmr9ixxhn001e01mpvrepgcnz	S/C	condromalacia derecha grado 1	PRINCIPAL	2026-07-06 18:57:45.57
cmr9l1zpy001s01mpmpd3jslx	cmr9ixxhn001e01mpvrepgcnz	S/C	tendinitis de pata de ganso derecha	PRINCIPAL	2026-07-06 18:58:13.654
cmrdptexz000601p8or4k11iy	cmrdoeaj1000201p855pyvef0	S/C	omalgia derecha	PRINCIPAL	2026-07-09 16:22:36.263
cmrdptos5000801p8lz76vjxz	cmrdoeaj1000201p855pyvef0	S/C	tendinitis tendon de la porcion larga del biceps derecho	PRINCIPAL	2026-07-09 16:22:49.013
cmrdptus9000a01p8zj79iw1c	cmrdoeaj1000201p855pyvef0	S/C	rotura de mango rotador derecho por clinica	PRINCIPAL	2026-07-09 16:22:56.793
cmrdrof5a002b01p8h1yi9817	cmrdoeaj1000201p855pyvef0	S/C	alergia penincilina}	PRINCIPAL	2026-07-09 17:14:42.478
cmrf1covg003201p8aglc5vz9	cmrf1bogs002x01p8ec22x1ti	S/C	neuroma de morton en pie izquierdo	PRINCIPAL	2026-07-10 14:33:17.548
cmrglwa8i001p01p2hm52llxn	cmrglvj5n001m01p21wtrk2mc	S/C	QRGGQG	PRINCIPAL	2026-07-11 16:56:10.194
cmrglwdi8001r01p26c1qhw9h	cmrglvj5n001m01p21wtrk2mc	S/C	G QRGR	PRINCIPAL	2026-07-11 16:56:14.432
cmrknu4kl004r01p2vq3qhjok	cmrknjvrf003101p21rhx626p	S/C	fractura distal de radio y cubito izquierdo	PRINCIPAL	2026-07-14 13:01:33.477
cmrkpof6f005n01p2r2o05odx	cmrkp9qnw005h01p22ngivvx3	S/C	discopatia lumbar l5-s1 en estudio	PRINCIPAL	2026-07-14 13:53:06.519
cmrksjwm9006w01p2xduw6gdc	cmrkscq04006a01p27xdrg8rl	S/C	artrosis severa cervical	PRINCIPAL	2026-07-14 15:13:34.69
cmrkslpnt008001p27zgc446n	cmrkscq04006a01p27xdrg8rl	S/C	Perdida de la lordosis fisiologica cervical	PRINCIPAL	2026-07-14 15:14:58.985
cmrkslueh008201p21p52wzur	cmrkscq04006a01p27xdrg8rl	S/C	Discopatia lumbar L5-S1 en estudio	PRINCIPAL	2026-07-14 15:15:05.129
cmrm81umj000701lewtdhsu6q	cmrm7xdp4000201le36m2u7h3	S/C	mano traumatica izquierda	PRINCIPAL	2026-07-15 15:15:12.331
cmrmxzo4k000k01l4wkjqmxqq	cmrmxqh83000301l4r0h0ptoh	S/C	fractura distal de radio derecho	PRINCIPAL	2026-07-16 03:21:20.612
cmrnl7gwk000b01lyiira244b	cmrnkzdv5000401lycs6k93t5	S/C	gonalgia derecha	PRINCIPAL	2026-07-16 14:11:15.668
cmrnl81jp000d01ly566jphxw	cmrnkzdv5000401lycs6k93t5	S/C	condromalacia derecha por clinica	PRINCIPAL	2026-07-16 14:11:42.421
cmrnl8gkt000f01ly4l6lxpct	cmrnkzdv5000401lycs6k93t5	S/C	Valgo moderado de rodilla derecha	PRINCIPAL	2026-07-16 14:12:01.901
cmrnl8yzw000h01lyoxahltea	cmrnkzdv5000401lycs6k93t5	S/C	meniscopatia externa de rodilla dercha por clinica	PRINCIPAL	2026-07-16 14:12:25.772
cmrnldr3r001201ly8l0x7mdo	cmrnkzdv5000401lycs6k93t5	S/C	post operatorio de artroplastia total de cadera derecha	PRINCIPAL	2026-07-16 14:16:08.823
cmrnngmlt000r01nsrwym3uq3	cmrnn6us3000o01nslj0cqok8	S/C	POT artroplastia total bilateral de rodilla	PRINCIPAL	2026-07-16 15:14:22.193
cmrnnh9v9000t01ns6u4j2q6h	cmrnn6us3000o01nslj0cqok8	S/C	POT Hemiartroplastia de cadera izquierda	PRINCIPAL	2026-07-16 15:14:52.341
cmrnnhu5g000v01ns32i8p07u	cmrnn6us3000o01nslj0cqok8	S/C	POT RA+FI por fracura pertrocanterica de femur derecho	PRINCIPAL	2026-07-16 15:15:18.628
cmrnni2j9000x01nsktrl632v	cmrnn6us3000o01nslj0cqok8	S/C	cardiopata	PRINCIPAL	2026-07-16 15:15:29.493
cmrnnihaq000z01ns7scxpytk	cmrnn6us3000o01nslj0cqok8	S/C	EPOC	PRINCIPAL	2026-07-16 15:15:48.626
cmrnvnmzs000h01nhm5c7dnc4	cmrnvmrsd000a01nhqfxkhb30	S/C	Mano hermosa	PRINCIPAL	2026-07-16 19:03:46.216
\.


--
-- Data for Name: Doctor; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."Doctor" (id, cedula, nombre, apellido, email, "passwordHash", telefono, "fotoUrl", "especialidadPrincipal", "subEspecialidades", bio, idiomas, rif, "datosFiscales", "createdAt", "updatedAt", plan, "isAdmin", "cedulaCifrada", "rifCifrado", "totpSecret", "totpEnabled", "totpEnabledAt", "totpLastUsed", "currentLegalVersion", "nombreCifrado", "apellidoCifrado", "telefonoCifrado", "stripeCustomerId", "stripeSubscriptionId", "stripePriceId", "stripeCurrentPeriodEnd", "selloUrl") FROM stdin;
cmrodu1x1000401r0as2udib9	19468669	Ana Belén 	Navas Agelvis	abna1004@gmail.com	$2b$12$INP0CtrM8R3iTBdSbQH57eK3FCb9EVHtWkViU7.Lu3cvHOsrlyufW	04120362935 	\N	Traumatología	{}	\N	{}	\N	\N	2026-07-17 03:32:38.581	2026-07-17 20:16:37.847	cortesia	f	\N	\N	\N	f	\N	\N	cookies@1.1.0;lopdp-consentimiento@1.1.0;privacidad@1.1.0;terminos@1.1.0	gcSF6MUiMbYSt8apGuk3+fMVDfAXK5KiJtDlW+4YGodmmeb81szK	pqO7FHckhNDHSJ0hS5vTh+s3fw9BBHZrsVZm3b6ywwp04tDS7NK3fl4=	V7ZilZE6LCFJI4mdS9CV01hQ8n3LnZhtK1q05OvfVOWWKetS3Wg8Qg==	\N	\N	\N	\N	\N
cmqlsyn94000201qg8eeqn1c2	18616663	Joel	Pierluissis	joguelpinto0810@gmail.com	$2b$12$HDa5wgv2CNW33nnyD705M.lTgTH0LebOl7cABip7IPvOZvs18N..W	04127828495	\N	Traumatología	{}	Traumatología y ortopedia \nCirugía articular \nCirugía Artroscópica\nReemplazo articular 	{Español}	\N	\N	2026-06-20 03:33:06.232	2026-07-17 20:16:48.682	cortesia	f	\N	\N	\N	f	\N	\N	cookies@1.1.0;lopdp-consentimiento@1.1.0;privacidad@1.1.0;terminos@1.1.0	oGPOwmRoZSV5nyukuKV1273nBCMQDMgc3vjJiIFMi/s=	rJkT+Eg4a9tSmrAD0gzEA3f9/HI60tsl3lIPyD1M6dSnb/kTxU/2	iyaZM/Thi/A89XSLquYb0mmE/Nu4At1Q7VWQQur8KvgPlwcRxBYN	\N	\N	\N	\N	/api/uploads/sellos/cmqlsyn94000201qg8eeqn1c2-1784134750080-yb0v7b.png
cmrpefiai000501o10fgledn0	18913835	Inri 	Pérez Zambrano 	dr.inripz@gmail.com	$2b$12$cN/GBdNEuzT8uNH7gvGHeuLmYx0a/X4UhJX7kYLbDdlquD.lamRYO	04126702342	\N	Ortopedia	{}	\N	{}	\N	\N	2026-07-17 20:37:05.754	2026-07-17 20:37:34.35	free	f	\N	\N	\N	f	\N	\N	cookies@1.1.0;lopdp-consentimiento@1.1.0;privacidad@1.1.0;terminos@1.1.0	Gu34NvL612BRPln/yIr4X5AtyjuWmB5cDrR4fd1wBbgd	SN5F+ILiDUXfAw43cL9Bnk803galWYbzd5NVwYIHJ50Ikj2Ijndn/Pnqz/w=	fdIoIa+HRXINvxuNO1wcVFuUrsMkuF6jRfWRbJVvAen2gcdUVt4s	\N	\N	\N	\N	\N
cmrf70du1003a01p8f2k0qlkg	25073903 	Fabiola 	Guerrero	fabiolaguerrero602@gmail.com	$2b$12$k5lqqlxrOfGogkkLMSTgHOyBRthPEHs5zA4EmoWLKE.AfSXKl5Ce.	04243695118 	\N	Medicina Ocupacional	{}	\N	{}	\N	\N	2026-07-10 17:11:41.065	2026-07-17 20:16:40.006	cortesia	f	\N	\N	\N	f	\N	\N	cookies@1.1.0;lopdp-consentimiento@1.1.0;privacidad@1.1.0;terminos@1.1.0	Bllop161fv0bJ3eVY8FSl1BrJy7yJYfhPcpqLrDAgFkOHARD	p3SWGUBCGFfiUVga8qNObTL06UiFcNVR2tYgC5m4m0jXjXsD	2AGjyJ3hm0ara9CwJ8FL5bAZmq9iFiX/+q1k343XkRuimNxceZ7PaA==	\N	\N	\N	\N	\N
cmqmgxvrx000001oa0fupphfw	99999999	Demo	Doctor	demo@medsysve.test	$2b$10$zEPNfbCPbLz8XI5VjTMc.uMgSrZ2E6qmXGEdo027tKZV6SXYiJBXK	\N	\N	Medicina General	{}	\N	{}	\N	\N	2026-06-20 14:44:21.405	2026-06-26 02:48:44.269	free	f	\N	\N	\N	f	\N	\N	cookies@1.1.0;lopdp-consentimiento@1.1.0;privacidad@1.1.0;terminos@1.1.0	cqt7exAVl3G2dUWb0zJE0jzlbExfeiYbxpyIkBlwWQI=	eWxQD+mpxCJmNMXggNpeEzC+iL8qrWGDOYpcgz34YY73eQ==	\N	\N	\N	\N	\N	\N
cmqy8838b000101o7xuh055nu	9966786	Walter	Ciarrocchi	anestesiaguarico@gmail.com	$2b$12$uaY4I2FrXl1mwV4FVhfw.eX8Citp5lpklnUR2W1XuODDzt13fIF0q	04122586849	\N	AnestesiologA-a	{}	\N	{}	\N	\N	2026-06-28 20:13:35.196	2026-07-17 20:16:42.102	cortesia	f	\N	\N	\N	f	\N	\N	cookies@1.1.0;lopdp-consentimiento@1.1.0;privacidad@1.1.0;terminos@1.1.0	o4z18gOh4j79eM4lVh1DYd/ORcXyw+IN9JVX/UAZnwYvHw==	8n46Z+8pTXkEs4XAd+XtdMknRwDNKBMwNHGHEJ1630FP00s9uZQ=	qB5cK2rSFAu8r7YTuA+aYzc7B240ssjosAVoliO4Aj0PmwVqeC6X	\N	\N	\N	\N	\N
cmql6anh2000001o6yhno0xgt	12345678	Carlos	Test	carlos@test.com	$2b$12$tdKrlFRVphs8/SB/UCIRhetBFXqGGCbxntW2xLB1ASTRI03LHpbLS	\N	\N	Medicina General	{}	\N	{}	\N	\N	2026-06-19 16:58:35.222	2026-06-26 02:48:44.261	free	f	\N	\N	\N	f	\N	\N	pre-1.0.0-pending-reacceptance	X+XNfMh3BNbZ2ZJnONs/Y8H3OqLmd1z+uLV7rO8SBxhS+Q==	jLThmJNG775GPHiK50A1QnEG/Rkem6qySLjS+wcjpT0=	\N	\N	\N	\N	\N	\N
cmqlsydj8000001qgpwn9mbjm	V-12345678	Carlos	Prueba	doctor.prueba@medsysve.test	$2b$12$uWmwyr0QdVVEj7cvGOXE2eazWGbWsKESfD6Y4.6deI1f0pbR12Xxq	\N	\N	Medicina General	{}	\N	{}	\N	\N	2026-06-20 03:32:53.637	2026-06-26 02:48:44.265	free	f	\N	\N	\N	f	\N	\N	pre-1.0.0-pending-reacceptance	MLTKo3BVlRkBt9mJ80JPSo3d3rPzDizR//JZd8LJUxDk/A==	7CLaYnlaFNVwPyVBxdy0KmHnUBeuERYmlDGN3n6bZs3cBw==	\N	\N	\N	\N	\N	\N
cmrp83c2e000a01lm4yifqc0c	19956036	Fausto Javier 	Parra Rosario 	faustino.parra1989@gmail.com	$2b$12$7mI7IyOg94XMe4kcKcV1/uV8nkLQK2J8I5WxCrnYKTfZA.BsvgBfW	04245864411	\N	Traumatología	{}	\N	{}	\N	\N	2026-07-17 17:39:40.118	2026-07-17 20:16:35.729	cortesia	f	\N	\N	\N	f	\N	\N	cookies@1.1.0;lopdp-consentimiento@1.1.0;privacidad@1.1.0;terminos@1.1.0	ge0dT0TU+xa9hfZ5exryyzI40k0FCHX0xNBy54I7jnanVxfTHLpGZqrL	jZJpR8bTzcKlqWLLiGCnDn+FxY5kNIyrtwOrsqNhqPmzOggimCipFv0P	O9kcp1SjeiN9qxcFvJzI26zItkfu/pFixiRastjMHZ+/gTjNCdhL	\N	\N	\N	\N	\N
cmqmm9uoa000001p4j8mmb508	11223344	Dr	LoginTest	logintest@medsys.local	$2b$12$xXGSVBR0ExnCl.vgVhiygeIEFMmQoHuya8WRs3LmXt3haamTqhbl6	\N	\N	Medicina General	{}	\N	{}	\N	\N	2026-06-20 17:13:37.93	2026-06-26 02:48:44.272	free	f	\N	\N	\N	f	\N	\N	pre-1.0.0-pending-reacceptance	L18yTwf5oOfEL4RjK9vVcwxi/ymYhs+9Z7Vz4BaZ	VZbTOVstIGIaACtjDYyRLE74q4PciQ5Gsmo/bUSBFvtwGYY20w==	\N	\N	\N	\N	\N	\N
cmqva5325000101p3bu118ykx	15874696	Dayana	Maita	sivanam1982@gmail.com	$2b$12$nJjUO8AkMrk5nK6sOt6QP.EXCweHBeky7Rfkzrlpvq3F0Dai8eJgy	\N	\N	AnestesiologA-a	{}	\N	{}	\N	\N	2026-06-26 18:43:55.709	2026-07-17 20:16:44.014	cortesia	f	\N	\N	\N	f	\N	\N	cookies@1.1.0;lopdp-consentimiento@1.1.0;privacidad@1.1.0;terminos@1.1.0	u01RF8bacT2Rbj876juAhsDgyxSaaGurUTjA6FOiryQr5w==	3mxNRo62UNJwhYF+tkV6OYq6tZNwIpEferBDihd/3den	\N	\N	\N	\N	\N	/api/uploads/sellos/cmqva5325000101p3bu118ykx-1782793204781-3ia5tu.jpg
cmqmx6t3y000001phuzs1sirz	11111111	Carlos	Pierluissis	cpierluissis@gmail.com	$2b$12$41y/qM4rEQM1K29A19832u8ZMKjtQPUGWN.nfrOPf4YdqgO3VsEq.	\N	\N	Medicina General	{}	\N	{}	\N	\N	2026-06-20 22:19:11.71	2026-07-17 20:16:46.618	cortesia	t	\N	\N	\N	f	\N	\N	cookies@1.1.0;lopdp-consentimiento@1.1.0;privacidad@1.1.0;terminos@1.1.0	AjlTS+e9cenrRLy/xcknRCfddNZlpw3p6evk0gRNPpdqoQ==	nQvWKX9qXhiZrJFB81CKapCOLtdzekURi1VISmog55zN0OZSfiNW	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: DoctorAvailability; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."DoctorAvailability" (id, "workspaceId", "diaSemana", "horaInicio", "horaFin", "duracionMinutos", activo, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DoctorClinicAffiliation; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."DoctorClinicAffiliation" (id, "doctorId", "clinicId", rol, activo, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DoctorFeatureOverride; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."DoctorFeatureOverride" (id, "doctorId", "flagKey", enabled, reason, "expiresAt", "setByUserId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DoctorReportPreferences; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."DoctorReportPreferences" (id, "doctorId", secciones, "instruccionesDefault", "createdAt", "updatedAt") FROM stdin;
cmrnomqna000001rs0gfku0fi	cmqlsyn94000201qg8eeqn1c2	{"diagnosticos": true, "examenFisico": true, "signosVitales": false, "motivoConsulta": true, "historiaClinica": true, "ordenesImagenes": false, "planTratamiento": true, "ordenesLaboratorio": false, "tratamientoIndicado": false}	null	2026-07-16 15:47:06.982	2026-07-16 15:49:04.481
\.


--
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."Document" (id, "encounterId", "patientRegistrationId", tipo, "contenidoHtml", "aiDraft", "pdfUrl", "firmadoAt", "firmadoPor", "visibleEnPortal", "referidoANombre", "referidoAEspecialidad", "referidoATelefono", "referidoADoctorId", "referidoStatus", "createdAt", "updatedAt", "contenidoHtmlCifrado", "aiDraftCifrado", "reportOverride") FROM stdin;
cmqmyoggz000301ph5vfmyb1p	cmqmyi26d000201ph2der0i4y	cmqlt50p2000801qgnzs5ydvv	REPOSO	<p>Se indica reposo médico por <strong>1 día(s)</strong>.</p><p>Desde el: <strong>2026-06-20</strong> hasta el: <strong>2026-06-20</strong>.</p>	\N	/uploads/documents/cmqmyoggz000301ph5vfmyb1p.pdf	2026-06-20 23:00:54.995	cmqlsyn94000201qg8eeqn1c2	t	\N	\N	\N	\N	\N	2026-06-20 23:00:54.755	2026-06-20 23:00:56.066	\N	\N	\N
cmr053oag000701p6orck2mg3	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	INFORME	INFORME CLÍNICO\n\nDATOS PERSONALES:\n• Paciente: Joel Arturo Pierluissis Perez\n• Edad: 75 años\n\nMOTIVO DE CONSULTA:\nDolor de cabeza\n\nEXAMEN FÍSICO:\nSe evidencia cefalea\n\nDIAGNÓSTICOS:\n1. R51 – Cefalea\n\nTRATAMIENTO INDICADO:\n• Tramadol 50 mg: 1 comprimido cada 6 horas por 7 días\n• Ibuprofeno 200 mg: 2 comprimidos cada 6 horas por 5 días	\N	\N	2026-06-30 04:21:42.867	cmqva5325000101p3bu118ykx	t	\N	\N	\N	\N	\N	2026-06-30 04:21:42.712	2026-06-30 04:21:42.872	\N	\N	\N
cmqn2ltbv000401oskxjerxan	cmqlu1vgb000b01qgt9t328i8	cmqlt50p2000801qgnzs5ydvv	INFORME	```html\n<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="UTF-8">\n  <title>Informe Clínico - Juan Perez</title>\n</head>\n<body>\n\n  <h2>INFORME CLÍNICO</h2>\n\n  <p><strong>Paciente:</strong> Juan Perez</p>\n  <p><strong>Edad:</strong> 38 años</p>\n  <p><strong>Fecha de elaboración:</strong> No especificada</p>\n\n  <hr>\n\n  <p><strong>1. MOTIVO DE CONSULTA</strong></p>\n  <p>No fue especificado por el paciente ni referido por el médico tratante en el momento de la consulta.</p>\n\n  <hr>\n\n  <p><strong>2. ANTECEDENTES Y ANAMNESIS</strong></p>\n  <p>No se dispone de información anamnésica registrada. Se desconocen antecedentes personales patológicos, quirúrgicos, farmacológicos, alérgicos o familiares relevantes al momento de la elaboración del presente informe.</p>\n\n  <hr>\n\n  <p><strong>3. EXAMEN FÍSICO Y SIGNOS VITALES</strong></p>\n  <p>No se registraron signos vitales ni hallazgos al examen físico en la consulta documentada. Se recomienda completar esta sección en la próxima evaluación clínica, incluyendo:</p>\n  <ul>\n    <li>Frecuencia cardíaca (FC)</li>\n    <li>Frecuencia respiratoria (FR)</li>\n    <li>Presión arterial (PA)</li>\n    <li>Temperatura corporal (T°)</li>\n    <li>Saturación de oxígeno (SpO₂)</li>\n    <li>Peso y talla (IMC)</li>\n  </ul>\n\n  <hr>\n\n  <p><strong>4. DIAGNÓSTICOS</strong></p>\n  <p>No se establecieron diagnósticos en la presente consulta debido a la ausencia de datos clínicos suficientes.</p>\n\n  <hr>\n\n  <p><strong>5. PLAN Y TRATAMIENTO</strong></p>\n  <p>No se indicó tratamiento farmacológico ni no farmacológico en esta oportunidad. Se sugiere:</p>\n  <ul>\n    <li>Completar la historia clínica con anamnesis detallada.</li>\n    <li>Realizar examen físico exhaustivo con toma de signos vitales.</li>\n    <li>Solicitar estudios complementarios de ser necesario, según hallazgos clínicos.</li>\n    <li>Reevaluar al paciente para establecer diagnóstico y plan terapéutico definitivo.</li>\n  </ul>\n\n  <hr>\n\n  <p><strong>Nota:</strong> El presente informe se encuentra <strong>incompleto</strong> por insuficiencia de datos clínicos. Debe ser actualizado por el médico tratante una vez obtenida la información necesaria.</p>\n\n  <p><em>Informe elaborado por médico tratante. República Bolivariana de Venezuela.</em></p>\n\n</body>\n</html>\n```	\N	/uploads/documents/cmqn2ltbv000401oskxjerxan.pdf	2026-06-21 00:50:50.135	cmqlsyn94000201qg8eeqn1c2	t	\N	\N	\N	\N	\N	2026-06-21 00:50:49.915	2026-06-21 00:50:50.607	\N	\N	\N
cmqn5fsgs000001qxutbaks5u	cmqn2ilck000301osaukxtgi4	cmqlt50p2000801qgnzs5ydvv	INFORME	```html\n<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="UTF-8">\n  <title>Informe Clínico - Juan Perez</title>\n</head>\n<body>\n\n  <h2>INFORME CLÍNICO MÉDICO</h2>\n\n  <p><strong>Nombre del paciente:</strong> Juan Perez</p>\n  <p><strong>Edad:</strong> 38 años</p>\n  <p><strong>Fecha de elaboración del informe:</strong> [Fecha no especificada]</p>\n  <p><strong>Médico tratante:</strong> [Nombre del médico no especificado]</p>\n\n  <hr>\n\n  <p><strong>1. MOTIVO DE CONSULTA</strong></p>\n  <p>No especificado. Se requiere completar esta información para la validez clínica del informe.</p>\n\n  <hr>\n\n  <p><strong>2. ANTECEDENTES Y ANAMNESIS</strong></p>\n  <p>No se dispone de información anamnésica registrada. No se han referido antecedentes personales patológicos, quirúrgicos, farmacológicos, alérgicos ni familiares en el momento de la elaboración de este informe.</p>\n\n  <hr>\n\n  <p><strong>3. EXAMEN FÍSICO Y SIGNOS VITALES</strong></p>\n  <p>No se registraron signos vitales ni hallazgos al examen físico. Los campos correspondientes se encuentran pendientes de completar:</p>\n  <ul>\n    <li>Tensión arterial: No registrada</li>\n    <li>Frecuencia cardíaca: No registrada</li>\n    <li>Frecuencia respiratoria: No registrada</li>\n    <li>Temperatura: No registrada</li>\n    <li>Saturación de oxígeno: No registrada</li>\n    <li>Peso / Talla / IMC: No registrados</li>\n    <li>Hallazgos al examen físico general y por sistemas: No especificados</li>\n  </ul>\n\n  <hr>\n\n  <p><strong>4. DIAGNÓSTICOS</strong></p>\n  <p>No se establecieron diagnósticos en la presente consulta. La ausencia de datos clínicos impide la formulación de impresiones diagnósticas fundamentadas.</p>\n\n  <hr>\n\n  <p><strong>5. PLAN Y TRATAMIENTO</strong></p>\n  <p>No se indicó tratamiento farmacológico ni no farmacológico. Se recomienda:</p>\n  <ul>\n    <li>Completar la historia clínica con motivo de consulta detallado y anamnesis completa.</li>\n    <li>Registrar los signos vitales y hallazgos del examen físico.</li>\n    <li>Reevaluar al paciente para establecer diagnósticos e indicaciones terapéuticas pertinentes.</li>\n  </ul>\n\n  <hr>\n\n  <p><em>Nota: El presente informe se encuentra incompleto debido a la ausencia de datos clínicos suficientes. Su validez queda condicionada a la actualización de la información faltante por parte del médico tratante.</em></p>\n\n  <p><strong>Firma y sello del médico:</strong> ______________________________</p>\n  <p><strong>Número de M.P.P.S.:</strong> ______________________________</p>\n\n</body>\n</html>\n```	\N	\N	2026-06-21 02:10:07.969	cmqlsyn94000201qg8eeqn1c2	t	\N	\N	\N	\N	\N	2026-06-21 02:10:07.708	2026-06-21 02:10:07.986	\N	\N	\N
cmqn76204000001mg36p02tb5	cmqn2ilck000301osaukxtgi4	cmqlt50p2000801qgnzs5ydvv	INFORME	MOTIVO DE CONSULTA:\n\nDolor de rodilla derecha de 3 días de evolución.\n\nANAMNESIS:\n\nPaciente masculino de 38 años que consulta por dolor de rodilla derecha de 3 días de evolución, de tipo mecánico, que empeora con la marcha y mejora con el reposo.\n\nEXAMEN FÍSICO:\n\nEstado general: consciente, orientado, afebril.\n\nAparato respiratorio: murmullo vesicular conservado bilateral.\n\nAparato cardiovascular: ritmo cardíaco regular sin soplos.\n\nAbdomen: blando, depresible, no doloroso a la palpación.\n\nExtremidad inferior derecha: edema leve en rodilla derecha, dolor a la palpación en cara anterior, movilidad limitada por dolor.\n\nPLAN DE TRATAMIENTO:\n\n• Reposo relativo por 3 días\n• Aplicación de hielo local 20 minutos 3 veces al día\n• Radiografías de rodilla derecha en proyecciones anteroposterior y lateral\n• Control clínico en 1 semana	\N	\N	2026-06-21 02:58:32.891	cmqlsyn94000201qg8eeqn1c2	t	\N	\N	\N	\N	\N	2026-06-21 02:58:32.741	2026-06-26 02:48:44.391	ZD4iePRe2JXef7tkYxK4qBSjaLh4tzHcnlOPps/PpaqAllqsS0UcbwcJh3tHevhEBpZJch0DCrrSdS0FgoH08TweAnQLswkmJ3Lw3CPetoAZj23Fqyzh63J0KgM8jPthYI+9y06bspDnZAen+0cQAt8cGcO3hBsipJN3tVfSBmJfUepYv6REXDfdUtjBa7epvcS19A0YywBoWz6GlZ+mCzFDOcCH0ywpH2Z075TNYBYgO6/R7iaPqe40Se5tuRdSxSQjpe6sRzjayY6vNkG8pIc+n44fE+EQjxq5ECnwxKTwVmyhSzFO5pdISqomksexAUD0lQjj/JLKBMDbEdqXLpV8o2AFVmu3jgB0p+EKGJzJCvj4b9TttAX2c5jlHRi7OdV+e7M2bW4jXbm6BGn55SdPO5WwOQOA2xie7B7Cw4ueVCJn7X5xMFD3nC73KlnSdT0y3kJRkROae6um4txghMRjJADt9Drny5kitu//j19DVd2nHlgwh0gdma+PjXzGdMcc9nomTfX+6Xk81vDqtBzA1KcK2vWaV4r8Al8REUi3qtLOhpldLh0/pzA8JMMb2hC0ytzZ+hMJW4oGQbpTKVuIAjuDqi41FNeS+yMtO95Nkr/zeYheCfD3CZddHEdQtXy4I7Ntd+Dfs34n+mKbQ0Rj/CsdqS5Mjd9i8RGRA/C7B3EdNDCzT+wcg5RE1sv4Ecuoy+OCl/7bSIukWGeGfwwZCwdrBiV40g9DjoEJ8KK96LAxyLdGdRQtIm5NUVgxCJ2Ey54gV5Nsti/Izok+WBq2eVaty8+ITgcbVRyBB72CiwiX0SMNElXKyo0HhHM8zXeaIAtPewLXoLYiydKqUd8/a4BeX8uKTxy5EAY5uYpdmESWfH5c+Roe4L0ox0aFyOtkSkU74bP5fdHXg9/unSY30+UF9fMzRpxHQhnqE5VBVuHO3N7JHquN3Ikr2Xzze09rwdOLcGCoRAEHG1VWe1h1e2aOrsMotx9r61w0kdwf3oDiWLKuYQOJ0bj669EBivU1m2cQE0ZRfJhx8ktC7Ceb3gu5B8Pw+VA/58/CoX/a5ijbPRFwIeeotQUr/B7pnuskQAL090/n+lnkCGhW5U6x5Mva86Wn/zZgISGi5wKPNso4ErwhidONxrmFEzk/LGpKNa7NkuwzvFJA5gT4qGoq/CE6vg==	\N	\N
cmr03jrqf000z01lg7rojvzsx	cmr020v9j000g01mub1fw5j0k	cmqvpjde0000l01phqmgfkbnm	INFORME	INFORME CLÍNICO\n\nDATOS DEL PACIENTE:\n• Nombre: Joel Arturo Pierluissis Perez\n• Edad: 75 años\n\nMOTIVO DE CONSULTA:\nCervicalgia\n\nEXAMEN FÍSICO:\nPaciente se siente bien. Dolor en región cervical a la movilización.\n\nDIAGNÓSTICOS:\n1. I10 – Hipertensión esencial (primaria)\n2. H52 – Trastornos de acomodación y de refracción\n\nTRATAMIENTO INDICADO:\n• Notolac 30 mg: 1 tableta cada 12 horas por 5 días\n• Ciprofloxacina 500 mg: 1 tableta cada 12 horas por 7 días\n• Clindamicina 300 mg: 1 tableta cada 8 horas por 7 días	\N	\N	2026-06-30 03:38:15.199	cmqlsyn94000201qg8eeqn1c2	t	\N	\N	\N	\N	\N	2026-06-30 03:38:14.439	2026-06-30 03:38:15.209	\N	\N	\N
cmqn7rmfn000101mg28ftp9o1	cmqn2ilck000301osaukxtgi4	cmqlt50p2000801qgnzs5ydvv	REPOSO	<p>Se indica reposo médico por <strong>1 día(s)</strong>.</p><p>Desde el: <strong>2026-06-21</strong> hasta el: <strong>2026-06-21</strong>.</p>	\N	\N	2026-06-21 03:15:19.161	cmqlsyn94000201qg8eeqn1c2	t	\N	\N	\N	\N	\N	2026-06-21 03:15:18.995	2026-06-21 03:15:19.163	\N	\N	\N
cmqn6cwg2000001p67hl0p6k9	cmqn2ilck000301osaukxtgi4	cmqlt50p2000801qgnzs5ydvv	INFORME	MOTIVO DE CONSULTA:\n\nDolor de rodilla derecha.\n\nANAMNESIS:\n\nPaciente masculino de 38 años que refiere dolor en rodilla derecha de 3 días de evolución. El dolor es de tipo mecánico, empeora con la marcha y mejora con el reposo.	\N	\N	2026-06-21 02:35:52.718	cmqlsyn94000201qg8eeqn1c2	t	\N	\N	\N	\N	\N	2026-06-21 02:35:52.514	2026-06-26 02:48:44.386	SgAsm35lc9jfBm9b4Do+t6gZAChX/hZr65v2Vh7iCWX2EqUr9/CAQBGdrb+6hp5+hVj+HOI73TE9bdywR0YG6db7pz4SCncUg8rwyLABTZ4KmSLis2QUeUVQteK81/WZB89vK4mclXK5R/84HJ/TZEvgjFMvSPmTacLJ0mnxi+nxp1JPnz9b20v0PJyU9UcPgFvDx/Dy93MKpiDbmmaYAjLEWiD6YfzADr5GlCc+RrjUrq2xQ32rZMj72jP4RYThrERJHYEIRUQaOBv9AW0AzQ/NDXjRxm304fMG3WBPZJCNLcmWRbrx8AUcdaIzoNM9+/0ETNN6/sq4/FrisSlw44/M	\N	\N
cmqn6e6qs000101p68vg5x36f	cmqn2ilck000301osaukxtgi4	cmqlt50p2000801qgnzs5ydvv	INFORME	MOTIVO DE CONSULTA:\n\nDolor de rodilla derecha de 3 días de evolución.\n\nANAMNESIS:\n\nPaciente masculino de 38 años que refiere dolor de rodilla derecha de 3 días de evolución, de tipo mecánico, que empeora con la marcha y mejora con el reposo.	\N	\N	2026-06-21 02:36:52.667	cmqlsyn94000201qg8eeqn1c2	t	\N	\N	\N	\N	\N	2026-06-21 02:36:52.516	2026-06-26 02:48:44.389	6Vq9bxEFlmvCL8ct9EeHJVPLKqro0d2wo7Fp6v32dBPglVQsVrI/S1zCG8OKKiWWJWgPDu7AwPTc576dU4A447aqGa0+nqfWZ/NH1ISRHaK6wdZSz3J9sEaQeErDgZxWWQ+yvQwcuSo51r6WXGD6J3hqwNoPfMu/126piHFeiiXrp1bf4df/J8iaazkc6RA+mJvBpk+1FOtnAkiKISlCCIb4ULtX1XofYDsXPWuJrF3ZViB17TaENJEnH8MEygGf0TjIOU2DsLP5l2PepSyNMKN1h/bWRQNJOKigH8HRQQmhH2OxhvsgPu4Xfshkgu3WMatzz5LFDAj9I2dWxcIVa4Y9zkIm3ZaK6frnYpCQpXSsqDs=	\N	\N
cmqvp6v8f000901ph10ukt7wy	\N	cmqva6ika000h01p3j3pus49q	REFERIDO	<p>Se refiere al Dr. Joel Pierluissis, Traumatología.</p><p><strong>Motivo:</strong> el paciente refiere dolor extremo en la rodilla derecha al afincar el pie.</p>	\N	\N	\N	\N	f	Joel Pierluissis	Traumatología	04127828495	cmqlsyn94000201qg8eeqn1c2	ACCEPTED	2026-06-27 01:45:13.119	2026-06-27 01:54:56.527	\N	\N	\N
cmr05q9pd000401pkpknigmcu	cmr04q3hj001201pxr3v245pj	cmqva6ika000h01p3j3pus49q	INFORME	MOTIVO DE CONSULTA:\nDolor de cabeza\n\nEXAMEN FÍSICO:\nCefalea\n\nDIAGNÓSTICOS:\n1. R51 – Cefalea\n\nTRATAMIENTO INDICADO:\n• Tramadol 50 mg: 1 comprimido cada 6 horas por 7 días\n• Ibuprofeno 200 mg: 2 comprimidos cada 6 horas por 5 días	\N	\N	2026-06-30 04:46:25.963	cmqva5325000101p3bu118ykx	t	\N	\N	\N	\N	\N	2026-06-30 04:39:16.897	2026-06-30 04:46:25.976	\N	\N	\N
cmr03n3rj001301lgx1lnnl7p	\N	cmqva6ika000h01p3j3pus49q	INFORME	PACIENTE: Joel Arturo Pierluissis Perez, 75 años\n\nMOTIVO DE CONSULTA: Dolor de cabeza persistente.\n\nEXAMEN FÍSICO: Paciente consciente, con buena respuesta.\n\nDIAGNÓSTICOS:\n1. S00 – Traumatismo superficial de la cabeza\n\nTRATAMIENTO INDICADO:\n• Acetaminofén 500 mg: 1 comprimido cada 8 horas por 7 días	\N	\N	2026-06-30 03:40:50.217	cmqva5325000101p3bu118ykx	t	\N	\N	\N	\N	\N	2026-06-30 03:40:49.999	2026-06-30 03:40:50.22	\N	\N	\N
cmr0t35p7001h01o44wa24tb0	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	INFORME	Dolor en coxis.\n\nPaciente en buenas condiciones generales, afebril, hemodinámicamente estable.\nDolor a la palpación profunda en región coxal, limitación a la movilización pasiva y activa de ambas caderas.\n\n1. Coccigodinia crónica\n2. Artrosis de cadera derecha\n3. Artrosis de rodilla derecha\n4. Postoperatorio tardío artroplastia de rodilla izquierda\n\n• Notolac 30 mg: 1 tableta cada 12 horas por 5 días\n• Dorixina Flex presentación única: 1 tableta cada 12 horas por 10 días\n• Betagen Solspen: 1 ampolla una vez al día hasta nueva orden\n• Complejo B 100 mg/2 ml inyectable: 1 ampolla una vez al día por 3 días	\N	\N	2026-06-30 15:33:09.872	cmqlsyn94000201qg8eeqn1c2	t	\N	\N	\N	\N	\N	2026-06-30 15:33:09.403	2026-06-30 15:33:09.882	\N	\N	\N
cmr47dsbb000201tci7wozcy6	cmr0s0vu2000401o4xnglyo6c	cmr0rxhhb000101o4e54mg6fr	INFORME	INFORME CLÍNICO\n\nPACIENTE: Yolanda Cortez\nEDAD: 86 años\n\nMOTIVO DE CONSULTA: Dolor en cóxis\n\nEXAMEN FÍSICO:\nPaciente en buenas condiciones generales, afebril, hemodinámicamente estable.\nSe evidencia dolor a la palpación profunda en región coxal, con limitación a la movilización pasiva y activa de ambas caderas.\n\nDIAGNÓSTICOS:\n1. Coccigodinia crónica\n2. Artrosis de cadera derecha\n3. Artrosis de rodilla derecha\n4. Postoperatorio tardío de artroplastia de rodilla izquierda\n\nTRATAMIENTO INDICADO:\n• Notolac 30 mg: 1 tableta cada 12 horas por 5 días\n• Dorixina Flex presentación única: 1 tableta cada 12 horas por 10 días\n• Betagen Solspén: 1 ampolla una vez al día hasta nueva orden\n• Complejo B 100 mg/2 ml inyectable: 1 ampolla una vez al día por 3 días	\N	\N	2026-07-03 00:36:38.791	cmqlsyn94000201qg8eeqn1c2	t	\N	\N	\N	\N	\N	2026-07-03 00:36:38.423	2026-07-03 00:36:38.849	\N	\N	\N
cmr4hoymi000b01qoat61b1z0	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	INFORME	INFORME CLÍNICO\n\nDATOS DEMOGRÁFICOS:\nPaciente: Lesvia Pinto Henriquez\nEdad: 69 años\n\nMOTIVO DE CONSULTA:\nDolor de Cabeza\n\nSIGNOS VITALES:\n• Temperatura: 37.5 °C\n• Peso: 80 kg\n• Talla: 165 cm\n\nEXAMEN FÍSICO:\nPaciente consciente, alerta y orientado. Niega debilidad. Niega fatiga. Niega dificultad para respirar. Cabeza normocefalo. No lesiones evidenciadas. Cabello normo implantado.\n\nDIAGNÓSTICOS:\n1. G43 – Migraña\n2. S/C – Hipertensión endocraneal\n\nTRATAMIENTO INDICADO:\n• Acetaminofén 500 mg: 2 comprimidos cada 6 horas por 5 días	\N	\N	2026-07-03 05:25:16.211	cmqva5325000101p3bu118ykx	t	\N	\N	\N	\N	\N	2026-07-03 05:25:15.979	2026-07-03 05:25:16.215	\N	\N	\N
cmr7yk8ed000r01mpkovj6tnw	cmr7ygjy9000g01mpw0hcawcx	cmr7yg1w8000f01mpyn3ufito	INFORME	INFORME CLÍNICO\n\nMOTIVO DE CONSULTA:\nDolor\n\nEXAMEN FÍSICO:\nAbdomen globoso\n\nDIAGNÓSTICOS:\n1. K30 – Dispepsia funcional\n\nTRATAMIENTO INDICADO:\n• Esomeprazol de liberación prolongada 40 mg: 1 tableta cada 12 horas por 10 días	\N	\N	2026-07-05 15:40:48.075	cmqlsyn94000201qg8eeqn1c2	t	\N	\N	\N	\N	\N	2026-07-05 15:40:47.365	2026-07-05 15:40:48.078	\N	\N	\N
cmrdrf3xi001w01p8ywgskezf	cmrdoeaj1000201p855pyvef0	cmrdoe2ux000101p8azbmt9qg	INFORME	Dolor en hombro derecho.\n\nPaciente en buenas condiciones generales, hemodinámicamente estable.\nHombro derecho: dolor en cara anterior. Maniobra de Speed positiva. Maniobra de Yergason muy positiva. Full can test positivo. Empty can test positivo.\n\n1. Omalgia derecha\n2. Tendinitis del tendón de la porción larga del bíceps derecho\n3. Rotura de manguito rotador derecho por clínica\n\n• Notolac 30 mg: 1 comprimido cada 12 horas por 5 días\n• Dorixina flex presentación única: 1 comprimido cada 12 horas por 10 días\n• Betagen Solspén: 1 ampolla una vez al día hasta nueva orden\n• Complejo B comprimido estándar: 1 ampolla una vez al día por 3 días	\N	\N	2026-07-09 17:09:07.785	cmqlsyn94000201qg8eeqn1c2	t	\N	\N	\N	\N	\N	2026-07-09 17:07:28.038	2026-07-09 17:09:07.788	\N	\N	\N
cmrmtk1l4000a01o60kivjspa	cmrm7xdp4000201le36m2u7h3	cmrm7x1l6000101le9hkh0ivo	INFORME		\N	\N	\N	\N	f	\N	\N	\N	\N	\N	2026-07-16 01:17:13.096	2026-07-16 01:17:13.096	\N	\N	\N
cmrmd03in005001lenmdbsv27	cmr4heozi000001o49o8vbyfv	cmr0pml9d002001moekmrt320	REFERIDO	<p>Se refiere al Dr. Joel Pierluissis, Traumatología.</p><p><strong>Motivo:</strong> Dolor en el dedo pequeño</p>	\N	\N	2026-07-16 00:07:13.192	cmqva5325000101p3bu118ykx	t	Joel Pierluissis	Traumatología	04127828495	cmqlsyn94000201qg8eeqn1c2	SENT	2026-07-15 17:33:48.623	2026-07-15 17:33:48.623	\N	\N	\N
\.


--
-- Data for Name: DocumentTemplate; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."DocumentTemplate" (id, "workspaceId", tipo, nombre, "contenidoHtml", "createdAt", especialidad) FROM stdin;
cmrdrgz8h002001p8l7ikgs4s	cmqlsyn9e000301qgk98rcsjh	INFORME	informe medico	Dolor en hombro derecho.\n\nPaciente en buenas condiciones generales, hemodinámicamente estable.\nHombro derecho: dolor en cara anterior. Maniobra de Speed positiva. Maniobra de Yergason muy positiva. Full can test positivo. Empty can test positivo.\n\n1. Omalgia derecha\n2. Tendinitis del tendón de la porción larga del bíceps derecho\n3. Rotura de manguito rotador derecho por clínica\n\n• Notolac 30 mg: 1 comprimido cada 12 horas por 5 días\n• Dorixina flex presentación única: 1 comprimido cada 12 horas por 10 días\n• Betagen Solspén: 1 ampolla una vez al día hasta nueva orden\n• Complejo B comprimido estándar: 1 ampolla una vez al día por 3 días	2026-07-09 17:08:55.265	\N
\.


--
-- Data for Name: EmailOtp; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."EmailOtp" (id, email, "codeHash", purpose, attempts, "consumedAt", "expiresAt", ip, "userAgent", "createdAt") FROM stdin;
cmrf6sru1003901p87lfl81y3	fabiolaguerrero602@gmail.com	d075d49d8b5d96d4289333eed2a87c42c398fbfdfdebf717371724e58f77c72e	EMAIL_VERIFY	0	2026-07-10 17:08:03.48	2026-07-10 17:15:45.959	190.6.33.186	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36	2026-07-10 17:05:45.961
cmrodorci000301r0wjt9ypye	abna1004@gmail.com	775477ee9e17ae0aa643a7bb6bac02d02bc39c5fcd3343b56e16734ec4dc4223	EMAIL_VERIFY	0	2026-07-17 03:29:11.208	2026-07-17 03:38:31.6	190.94.212.190	Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/150.0.7871.113 Mobile/15E148 Safari/604.1	2026-07-17 03:28:31.602
cmrp2c567000001nt3kpzpco3	faustino.parra1989@gmail.com	8421fdb3412ad751e86397f20d69b79791665e0ced8645531416f79f3ddcc517	EMAIL_VERIFY	0	2026-07-17 14:59:01.081	2026-07-17 15:08:33.386	161.140.102.198	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Mobile/15E148 Safari/604.1	2026-07-17 14:58:33.391
cmquhdexn000501pg8ufewrem	cpierluissis@gmail.com	60442b171aa387ebc1b83baa57589ea6de232d625ff2804324bf402c8a4e5565	PASSWORD_RESET	0	2026-06-26 05:20:58.023	2026-06-26 05:33:35.482	73.8.161.68	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.8655	2026-06-26 05:18:35.483
cmqv0350l000001kq4bug69v8	cpierluissis@gmail.com	61998953f35557688635890e0d02e9d4e7d1cbff6bbc9843028b41a75550796e	PASSWORD_RESET	0	2026-06-26 14:03:15.959	2026-06-26 14:17:28.765	73.8.161.68	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-26 14:02:28.773
cmqv5m4z7000001qor5p146xk	joguelpinto0810@gmail.com	f45f8d133f43b3b1e7e13790ab5869c319b887ec467173ae5810ea523c2a1bf4	EMAIL_VERIFY	0	2026-06-26 16:37:45.022	2026-06-26 16:47:13.262	200.82.223.198	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-26 16:37:13.267
cmqva1mj8000001p30pm5pd7s	sivanam1982@gmail.com	c0c61e64f292367946e9e4f8e41e004e758e5e622f7a8ee0b06c2afece627601	EMAIL_VERIFY	0	2026-06-26 18:43:08.864	2026-06-26 18:51:14.314	73.8.161.68	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-26 18:41:14.324
cmqx47akp000001mjtmzt5iaa	cpierluissis@gmail.com	b5cc4a323754ddd0681ec7c1479e1cd5c594c51d39f9c6a91f1534c716cef9fb	PASSWORD_RESET	0	2026-06-28 01:33:27.564	2026-06-28 01:48:13.41	73.8.161.68	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2026-06-28 01:33:13.417
cmqy8374z000001o7d4qxjfgq	anestesiaguarico@gmail.com	73612b69895f8af48031f4b8c7b70d25fa3ae975179ee82fce7771037c8b7c4f	EMAIL_VERIFY	0	2026-06-28 20:10:52.833	2026-06-28 20:19:46.97	190.120.253.133	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36	2026-06-28 20:09:46.979
cmqzzusdh000001k5hzna270x	joguelpinto0810@gmail.com	35d5c687cb2ec131fa6000f8369bc69f89748ae9caa5a379383b7fe0a75b2ebd	PASSWORD_RESET	0	2026-06-30 01:55:56.406	2026-06-30 02:09:50.017	190.153.16.198	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-06-30 01:54:50.021
cmrp7ys0n000901lmgeonepw1	faustino.parra1989@gmail.com	29400e2e35de7fa865ff3008b3717e5d987442411651fe637c8892085776b77e	EMAIL_VERIFY	0	2026-07-17 17:36:30.939	2026-07-17 17:46:07.508	161.140.102.198	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Mobile/15E148 Safari/604.1	2026-07-17 17:36:07.511
cmrpeb8dx000401o12glfe99j	dr.inripz@gmail.com	4086da47e0d78d41a9e1761f770f7f1a9d008edee6522edf8558663fc8b05113	EMAIL_VERIFY	0	2026-07-17 20:34:05.037	2026-07-17 20:43:46.289	186.167.227.167	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1	2026-07-17 20:33:46.293
\.


--
-- Data for Name: Encounter; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."Encounter" (id, "workspaceId", "patientRegistrationId", "doctorId", "appointmentId", "historiaClinica", plan, vitales, "examenFisico", status, "signedAt", "signedBy", "createdAt", "updatedAt", "historiaClinicaCifrada", "planCifrado", "signatureHash", "motivoCifrado", "motivoHmac", version, "reportOverride", "datosEspecialidad") FROM stdin;
cmqltchxl000901qgldeqlmsn	cmqlsydjl000101qg393bt9gt	cmqlt0tlm000501qg1c3qd20v	cmqlsydj8000001qgpwn9mbjm	\N	\N	\N	\N	\N	DRAFT	\N	\N	2026-06-20 03:43:52.521	2026-06-20 03:43:52.521	\N	\N	\N	\N	\N	0	\N	\N
cmqltlshm000a01qgwwulgos6	cmqlsydjl000101qg393bt9gt	cmqlt0tlm000501qg1c3qd20v	cmqlsydj8000001qgpwn9mbjm	\N	\N	\N	\N	\N	DRAFT	\N	\N	2026-06-20 03:51:06.106	2026-06-20 03:51:06.106	\N	\N	\N	\N	\N	0	\N	\N
cmqlu1vgb000b01qgt9t328i8	cmqlsyn9e000301qgk98rcsjh	cmqlt50p2000801qgnzs5ydvv	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	\N	DRAFT	\N	\N	2026-06-20 04:03:36.443	2026-06-20 04:03:36.443	\N	\N	\N	\N	\N	0	\N	\N
cmqn2ilck000301osaukxtgi4	cmqlsyn9e000301qgk98rcsjh	cmqlt50p2000801qgnzs5ydvv	cmqlsyn94000201qg8eeqn1c2	\N	Paciente masculino de 38 años que consulta por dolor de rodilla derecha de 3 días de evolución, de tipo mecánico, que empeora con la marcha y mejora con el reposo.	Reposo relativo 3 días. Aplicar hielo local 20 min 3 veces al día. Control en 1 semana. Solicitar Rx de rodilla derecha AP y lateral.	\N	"Estado general: consciente, orientado, afebril. Pulmones: murmullo vesicular conservado bilateral. Corazón: RCR sin soplos. Abdomen: blando, depresible, no doloroso a la palpación. Rodilla derecha: edema leve, dolor a la palpación en cara anterior, movilidad limitada por dolor."	DRAFT	\N	\N	2026-06-21 00:48:19.604	2026-06-25 16:58:12.811	SD3/qYIwD8PlJxesTK8dOiJolRxeMuHYHs7aZMY5yYEF4ttVb0hI4u0kddfI+bkU9LSDUX9IIXw79ZB6MSC62mvM7ONw2L8Stv5cctHItDInO3s5WyZ2FxAOJxFu+G/ZzZqgcA2ypuALfu/LEyawiq4Mr9lM1EDcGzFlxlLQUB4oSPhmvRGrMoumnP3HlB3GBoH51Xw0Mp0rw24M1YTORyb+MLoAIi6Da5z5t/vTiRQ6Wx8Ib+n5Ve+CJK18gKV8702L	ym0yfhQkwk/4pwV7Uj5AB/U/ai/qNUKR2NBILpf/pnrPla9nM7zVk+H1DTW132n+dquUe+e9Vite9fLhv5JumbD0cIYUGh2TMMkJF8Z3DHPiXBCQuic6l1+9JbvcygRxk7Jll67sPv5HzkcuJE/Azcr3sMF686VXzSbvLkcZy2QMJQ6RL6Q1ZG/ldY5MEYUDD2lTvBpB5tYvzXPb4JKVLQ9j3A==	\N	\N	\N	0	\N	\N
cmqoousw9000201mosiq0aqp3	cmqlsyn9e000301qgk98rcsjh	cmqoon4p2000101mojrd6s2cv	cmqlsyn94000201qg8eeqn1c2	\N	Paciente masculino de 36 anos, refiere cefalea intermitente de 3 dias de evolucion, de predominio frontal, intensidad moderada (5/10 EVA), que mejora parcialmente con analgesicos comunes. Niega fiebre, nauseas, vomito, fotofobia, fonofobia, alteraciones visuales. Niega trauma craneal previo. No antecedentes de hipertension, diabetes ni migraina. Acude para evaluacion.	Acetaminofen 500 mg VO cada 8 horas por 5 dias. Ibuprofeno 400 mg VO cada 8 horas si persiste dolor. Hidratacion adecuada (2L agua al dia). Evitar pantallas prolongadas y ruido excesivo. Control en 7 dias. Signos de alarma: cefalea intensa de inicio subito, fiebre alta persistente, vomito en proyectil, alteracion del estado de conciencia - acudir a urgencias inmediatamente.	{"fc": 72, "fr": 16, "peso": 75, "spo2": 98, "talla": 175, "glasgow": 15, "taSistolica": 120, "temperatura": 36.5, "taDiastolica": 80}	"Paciente en buen estado general, alerta, orientado en las 3 esferas, Glasgow 15/15. Pupilas isocoricas normorreactivas. Cuello movil, sin rigidez de nuca. Torax simetrico, campos pulmonares bien ventilados, sin ruidos sobreanadidos. Corazon ritmico, 2 ruidos, no soplos. Abdomen blando, depresible, no doloroso. SNC: sin deficit motor ni sensitivo aparente, reflejos osteotendinosos ++/++ simetricos, Babinski negativo bilateral."	SIGNED	2026-06-22 04:06:27.771	cmqlsyn94000201qg8eeqn1c2	2026-06-22 04:01:26.985	2026-07-02 21:04:19.576	bhzgPE6Id5x/rPCrv6EX0r/SULnGLQiNV6TRnlTiXaFqUNdM1bvymk9xUzDq9ZHDbTVKaVaPIjFxNOWnZgdOGFf2TA8UjrITslwBWiU4v/WZHotoyKRyxaU3Fecd+/6w9zjy3I4BQBYhgmwWxCXRpgvLEZ6FBtHXwnXQi7M3ewl2y2wft6Oj31R8zzauvk7iSZN8CK4PG1+A1RBrL7VheGRVtEMaq01lVL2b4p4wTtYrUDjh4DlJEOMyO7GpbsEFpjB+/dq1BZxd6pGSDt+gilQ2v0SlVxvcMmYw7DzkIH4OC8e4WsX2B5vVESpc+Wr4xqSYxDusbG85Ikm8rgZaVPVQX+DXkdotNRqSDS2hmk8yUq1fA6gDlF4/KulQyfhz/9yBMO0Pj/m51MfZd8eGvpRl3GCWi1WBaLmLM8E/pg50Tbtvh3zdlgMHOUg7TrVPGdh/VEcpIeMwMVjZz2zWIzxvTOvOpU1qm/3UILPkf7WDOtEDqYw0dhsnScQHHGqt4tw+XKe8So+HnrgVobM=	AbLnsxJ7nI1BJmGwFwQzo25nlL7ihEiZt0lnODI0qN66xm9v5n9N6EuyEE0MpIsw8J4N5WHVa2hBGVh94K89nn2kClrpdTzcerUOBgY3R7lIDEcokli27LR2Mp2+2a2Y7p1kaWW2qcAhxAFzaA9eOrd4i6E2uWaGw378j2YeZeXTnmDVD4UwjGGnii48kbvalFIJ9VD7ThCNQlb8wnoua8xzYfAeIED1Hha4vi+QWKeLaJHiE7GrEKjeZcrPquhW1udXQTOLWQ8tnTWjSijuqlHD4HZ9wow+e8EkGd9xar49TK4OmqoK5+L/OLTRqz+jUsUx6PQsG+itlRzbuXtbJDDz36YtzV5b4UAFzYap2d9MSkYjCmUXlKMyp8ed6nYPntBmGmQ1n42c8jr0xfvNg7bOTNQ3x4tDe4QSy9b69vDxdLgu5MsHAhDnFjQ6oY5AY9Gh9p0Hjw4xGwaxZkrvFzquKBUDY/AgZkCmzOZxKBYT+FcU+33SuplAkH1nsaZ9pRTG7uPCuZOyxPiwbM2MDEBKIGo=	\N	vpoxnkDcafWLnzkeqxQX+TQ+2XEpXjiDB36SgViIktb9iks6vpzvLVjabFl4BAa8	SY2koWiihKL7HzvG2JnvVnLg1IB9Y16vXMptBEOZxKQ=	0	\N	\N
cmqmyi26d000201ph2der0i4y	cmqlsyn9e000301qgk98rcsjh	cmqlt50p2000801qgnzs5ydvv	cmqlsyn94000201qg8eeqn1c2	\N	Se trata de paciente masculino 30 años con dolor en rodilla 	Tratamiento médico \nÁcido hialuronico	\N	\N	DRAFT	2026-06-20 23:01:12.435	cmqlsyn94000201qg8eeqn1c2	2026-06-20 22:55:56.293	2026-07-02 21:04:19.677	8KQ9IszaH4vuYMDFU4aKAU+nT8cw+GqkZU1UcMrjboV42rzyoRXC4pa/uJnPYXYz/GoOphFzsZdP7JzFnIm5saaFoCI9RJdlSGyAd7T8gJB0skRkRS2lUbQ=	Gay4ytMRq20ETk+agP8cOL+LkuBPvHTrsyToIE2t95W9LNq7cjcychY4is5crUr6pcK+KcH7kkxHlHWDIWJMZM1nkA==	\N	ErKPl3REe29QOStpbdAMgnrVcCpYGx9opAz8vSxe7xEl1Xikt4CiUH+pGvOipoRYyQ==	e9duF/e3k8KzCe/0YYhWrKpmIjJDnGLkQvTboTlJMn0=	0	\N	\N
cmqn171fv000001osjsmk3btl	cmqlsyn9e000301qgk98rcsjh	cmqlt50p2000801qgnzs5ydvv	cmqlsyn94000201qg8eeqn1c2	\N	Nxnxnxnnf	Ndndndnd\nDndnfnf\nDjfbdnd	\N	\N	SIGNED	2026-06-21 00:22:41.987	cmqlsyn94000201qg8eeqn1c2	2026-06-21 00:11:20.971	2026-07-02 21:04:19.688	5DyUax22QCq1Qr3lDd+rm9JAdoYGCr4vxM4mPOP0YVTCwayY1w==	ALTyabzCWcFdtCSSsFpY3t9Wi1LdrOwOgL5elUJHjvKHzJTpS7qbBeo71fd/Gk6oOiTs0w==	\N	SZ8pt0CiM8B2maSWfntlL2/vywWcIA5OvhDBJdmjZ/ZR	O+PZphePHUjn3Ay917gL+koF4TXBZSuB/K2xqkGuZKA=	0	\N	\N
cmr000yni000201k55bne95f0	cmqlsyn9e000301qgk98rcsjh	cmqvpjde0000l01phqmgfkbnm	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	"Paciente en buenas condiciones hemodinámicamente estable\\nRodilla derecha aumento de volumen "	SIGNED	2026-06-30 02:53:12.502	cmqlsyn94000201qg8eeqn1c2	2026-06-30 01:59:38.094	2026-07-02 21:04:19.719	Bj4pSJBDmnsXeAII2OGlpq89KHRm42nK0+mzc1kjBf8N3OLNqnGy0eQgE+s9XuXZPnhRmmgtebzNT5jjP9kTSj8N0OUtg1UteTwWyhumZ9GELacqcgpve4uOe4E69kX9hoP6LBauv1hzXatt6O2CFkfyr7a+k/ohq6FCQpTpeQvR59RojTY7hTCvsjpXSFj7IZtgmhFCK2dMlC/8EAeXmPs3rdiSoPph5ts2tRw=	Wx9ZEbNOjtqFl+IWPSGfYKDVSmgU50lLbMBh2x9rbpyeqiKrNOMgU6MfbeITlQ80kVFXq/jmxoEaJyWAIG5wo8REVMxr7gy1sw91VNu7O1sEj2ZC+Nn22n8Kws8ioEOoV68TS0g8/D7T6fLMzX7McFtK+QcnQIdQ5EnonynJocayufpFbHxiqe2o2ZZ9jBgugjmG/5OPf+d5yLh1GlCjDDLJ9fyDMbsjTtdx8hHl7kAiNHeElOhJzF6j0ljZUoYLCr6X/2hlqq15e+l1rqu8Hm+Ms+MGWQ==	QgeRvL/3g0fD+QAnX7xvqYr9xKCMkptuJEScdAom03A=	0gTYusEzDUP/2JuwHyoTgeusYjPhi17Q5/x6lvpcYJsCivLM9YAVKicwQq7rV4uzrOOBWw==	ktekRydCyfFzoPlOZMpD+ukvvAemUJnnICcEolHjI9M=	0	\N	\N
cmrnns0ly001901p35tbm0828	cmqlsyn9e000301qgk98rcsjh	cmrm7x1l6000101le9hkh0ivo	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	"Paciente en buenas condiciones generales, hemodinamicamente estable.\\nRodilla XXXXXXX: Cepillado Articular  + / -, choque rotuliano  + / -, signo de herradura  + / -, Zohlen  + / -, McMurray  + / -, Lachman  + / -, Lelli test  + / -, Cajon Anterior  + / -, Cajon Posterior  + / -, Bostezo Medial  + / -, Bostezo Lateral  + / -."	DRAFT	\N	\N	2026-07-16 15:23:13.558	2026-07-16 15:48:42.032	aD6Nz730kyMQYy7HcD2yYUFzfqllEL88ajobEECFCYPkvrG53XQEXCcSy/HraorUSVLFPB4PUKQaUnavxnPJWc5u9z8HZpLVdyLGmPbb6bCMWS2FmKGWHxCvl7hOXcttYpyDpk/n400XJwnbM0yXHichqhXUSCsZbqBVry1f3j/RpRmeTaJpYaHNsWQyW3dcnvaK/nLGEQuTBpnG3wMAART7ni+8BuDpbdfmTy+LTy4lbXcIU4pIbx+2VujsVrx6QllOkCpY1yH5wYxCCx/GKY9DmDnxirFgvo1wfw+bzj3YaRO/YdGohf2+lLsBmZlnrkiXXvLfiwu0o9FFn+v81Z9kyyDnncdjVdmP4VL9TOs3Tmd/jsADQkU/lOpDEz8Wln7d7bOJtmQJTYPOUiEMToi7LzoUMaKbfOUNoUbexiVwEHG6Uc6b9raoAjEOMNUCX5JMZVG/l0cxy9Nz0oVrWon6WlX8k2OXw0HJKva8NzbFyisNRw/uwsLr2zcGflG3	VAoM5Ujm/qwIeMD6yRgQMvQCHmvYTbr/ywz8ujwlCZClNFQFIxflwSbpIfhb28KGphM6Mhqq7VZzmHk6VLl7qEg4iS7+dAX49FhfveCRdAoYYpQkbvUlRS737NgS6ewtn/y969qDHjcpYHhnd8dyoMBJk1Z3jQ==	\N	QbeoxhlQRxJO0RrJRpI8haugfczssfY580YTwNakuLRipW7R7R+o+f4=	YBFhfXOxQCKJLJkTLCM0bd8GoJh6jGJhfLJ6kBk7qBU=	1	["subjetivo", "examen", "plan", "analisis"]	\N
cmr03p3cc001b01lg7ny2zohc	cmqlsyn9e000301qgk98rcsjh	cmqvpjde0000l01phqmgfkbnm	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	\N	SIGNED	2026-06-30 03:44:02.079	cmqlsyn94000201qg8eeqn1c2	2026-06-30 03:42:22.764	2026-07-02 21:04:19.723	RUq5bl3zGngrImhgYr4fTk2oGzc1N05JNiCq/kjX8cgYZ5pUkTrIZVS24xQEeKT+UQ8VLrak3krr4FZam/Ug2a3qpWF9zQ==	SitvceZPYTYELruEKorWslrqynKuqGBfy8zwidvbFgmS05e1jSgWn0i25ZVjTFu/T+W9I1U+IhV892wtBVYx	nLBR3uLAiJZwgwvWdaCvDMD+omobGWWioZvi1l5YL0Y=	064rvIh1MVwKG6994JIeap0GHJUlaaBHzJMeGgjSM0dyePHuz5yanCffdQM=	12vereSCyb/1vfL0lhSnaiEbb9ply3DHcz0TP6Rp2Ls=	0	\N	\N
cmr020v9j000g01mub1fw5j0k	cmqlsyn9e000301qgk98rcsjh	cmqvpjde0000l01phqmgfkbnm	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	"Paciente se siente bien dolor en región cervical a la movilización "	DRAFT	2026-06-30 03:17:54.664	cmqlsyn94000201qg8eeqn1c2	2026-06-30 02:55:32.935	2026-07-02 21:04:19.731	itsWV86zxyrEZ6j9CTzPR79cUYZWIA6BNMGdKI9tcbxNI74EYz9XVT43qj2JFys=	\N	KzcREoCwuuHzgPpJ7Oc4Wxl049lMlLNFYzHyVPOp3e8=	4roCplCdvllQPw6wzzlItaxega32UOXeKw7aYZ4uZdxJ06yndktn	o50QjTnbR33cjGiw7TumOuQa1UwDTXLE/Tj7f8HzqJo=	0	\N	\N
cmr04q3hj001201pxr3v245pj	cmqva532b000201p39eq8lpiq	cmqva6ika000h01p3j3pus49q	cmqva5325000101p3bu118ykx	\N	\N	\N	\N	"cefalea "	DRAFT	\N	\N	2026-06-30 04:11:09.223	2026-07-02 21:04:19.736	xlVwyAjD/aj1MazG4K+IqjdTUX96RZfgXiGrdqPaFUHcJQXB+8VMly5UZcU=	\N	\N	0u/RZM5Y/Ouky/rJ3M2+8MeHeUxoNwGZKH8hJj+XlA9G42aS69jjj8iTTg==	eFkSe7+JqNJ8on+mpG8LV2J0LXIzf9fF1zeXy4NK5FU=	0	\N	\N
cmr3l4g3c000501mvsaxou3mo	cmqlsyn9e000301qgk98rcsjh	cmr3l49nd000401mvldhcp7mt	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	\N	DRAFT	2026-07-02 14:32:49.782	cmqlsyn94000201qg8eeqn1c2	2026-07-02 14:13:31.128	2026-07-02 21:04:19.752	ynMgIYTTAfoggDKFGYAgKTBPTzHEHlO0p37mnxlICt3ij5KqeTnouEhtlXU0/L809EN/OHw9OvFfZ6lzmEItWflbIKNY/qdxyTjSMPoJLe+5Y7RTeTnTLa1mIY9etYqhnZZy13ArbmKCFvUrdB6BAW6RMDglWOtzQW4K/ObMC9AQDYDwxAMdVuju3NySy7bg015wkRsxiYDlCVPQDwVZ0EL+Mxpjik1rkt52w3a+2yR69G3LaJkUNKHgL0ucowIT/2l5aM8VFouXJDIsEnr7WSOViHjuiZiVCrb+GlUik7APjLQhYqiF5iMdymm1Lq7HACB/bjbYmQi0NgFAn9eRSQXQZWAeB6cx1mfKRBOKE+QR71Q+pP4gynGVI/SIJZ1iQwR4Yw8Wp5UVV+VsRkdW3vnjFpDpw6NjYZffSFBlop5v9/hUtzK0FZ5mpKACoJNbSbD8Rpc9NflkrBuMH0cqI7wcQ9K4LkOgxAGpVtyV+wZh0YAZTMWobikJ+PACvOkKWu+WzUe6WGek7DUkae7n0C7t64tKpNHm0c3Ph3xsJ8U85ud47QsWTY0whGHiLZibc8yTgPMN+ARJxGkvS5rtJzNv+Yb4GIRH4vBkYagIG5kUVxTxOxEkPf+RDOG0ywQ0YeqkgMG9TQRs1x9vbiehzlycWGKCuVZXx/H2+wE2Z5ezH49LFOGJ5wiMhbD4g2jV8hY69UqXOZCVzLl7syozzP/j68mCR6HxNcXp	iAOjsEY8X69rpQN2xbb7DQrR8Yr4Sbd5ybd4ctp41K6pPxLvMSwKtSPb6pK7XrWq8VFpZamIUbD5k6mUDF6aOf4UtMyThz6A0+SaaXnfLwHD15x7Jk+kKSJCvb0MP96nPExF2wLe04n+AREP6okksjKJNpL/+Mz6wV9MqGYQut0gjJGM0v97Uz54h7LiqZcDg2m7aWj/YRuQ0ubxRGck865rH8QpntxJ4ESBwlcbPmohmSr6i3s+7qUm6yC/lsqG1vTqMa9wm/6jyxOx9UntVslykOkOLAYKdGDOaMsN9+8nJokuYGDcvIPQ4d9Yk7I=	7pqRQp7TzJQj87NZBLA6aTTTX6wyrq4SXCeiNmTCBvY=	tmbHiafKHbvP69AQAjVs9n5E9+vk5aYWhr0jpNnXCF7tqRKAf81WdMzMLA+4KQMP2A==	fUSQRkbxnuFh0pjCEJrpw1A0E1In37aE84xa5ntsGtU=	0	\N	\N
demo_enc_pedro_chronic	cmqmx6t43000101phgcog0v6o	demo_pr_pedro_001	cmqmx6t3y000001phuzs1sirz	\N	Paciente masculino 70 años, jubilado, conocido hipertenso y diabético tipo 2. Acude a control mensual. Refiere buena adherencia. Glucemias capilares en ayunas entre 110-130 mg/dL. Sin episodios hipoglucémicos. Marcapasos funcional, sin eventos arrítmicos.	Continuar esquema antihipertensivo y antidiabético. Solicitar HbA1c, perfil lipídico, creatinina, BUN. Cita en 1 mes.	{"peso": 78, "talla": 172, "saturacion": 96, "temperatura": 36.4, "tensionSistolica": 138, "tensionDiastolica": 85, "frecuenciaCardiaca": 68}	{"descripcion": "Paciente vigil, orientado. Cardiopulmonar: RsCs rítmicos, no soplos. Pulsos periféricos presentes y simétricos. Abdomen blando. Extremidades sin edema, llenado capilar < 2 seg."}	DRAFT	\N	\N	2026-06-17 06:15:10.012	2026-07-02 21:04:19.739	\N	\N	\N	B34Q3UO8LA1BJf9sNKN8AEGQowc/mlJMUIZmx6MrRTjOcfBUFvsbBMS4pSdjtilUmTt7DNJhlgOqqTE2	cwNSJsiVYEKZntlXFzbsG0MeQuLqRQcR0ypl38KC5N4=	0	\N	\N
cmrnnzqql001m01p3p7pd6wlk	cmqlsyn9e000301qgk98rcsjh	cmrmxq8ka000201l47pf9hqql	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	\N	DRAFT	\N	\N	2026-07-16 15:29:14.013	2026-07-16 15:29:14.013	\N	\N	\N	\N	\N	0	\N	\N
demo_enc_maria_001	cmqmx6t43000101phgcog0v6o	demo_pr_maria_001	cmqmx6t3y000001phuzs1sirz	\N	Paciente femenina 45 años, profesora. Acude por cuadro de 3 días de evolución consistente en cefalea frontal pulsátil de moderada intensidad (EVA 6/10), acompañada de fiebre cuantificada en 38.2°C, congestión nasal sin rinorrea purulenta, malestar general y leve artralgia. No tos, no disnea, no síntomas gastrointestinales. No antecedente de viaje reciente. Convive con 2 hijos menores, uno con resfriado común la semana previa. Hipertensa controlada con Losartán 50mg/día.	\N	{"peso": 68, "talla": 165, "saturacion": 98, "temperatura": 38.2, "tensionSistolica": 130, "tensionDiastolica": 85, "frecuenciaCardiaca": 88}	{"descripcion": "Paciente álgida, hidratada, febril al tacto. Faringe hiperémica sin exudados. Cuello móvil sin adenopatías palpables. Tórax RsCs RsCs sin agregados, sin soplos. Abdomen blando, depresible, no doloroso. SNC: Glasgow 15/15, pupilas isocóricas normorreactivas, sin rigidez de nuca. Signos meníngeos negativos."}	DRAFT	\N	\N	2026-07-01 05:30:50.768	2026-07-02 21:04:19.771	\N	\N	\N	79ywzlZrYUUvvKkifKeMq09nVdlNrhAdqsIT4GvdBQWoGp04PEUO/vQW5ZEks6qG3ZgRJw==	3poAso992AZDzJsOT/FPPlBY3nzCdDOyttcLLngUKUU=	0	\N	\N
demo_e_d2	cmqmgxvs6000101oau4ntxdtv	demo_pr_d2	cmqmgxvrx000001oa0fupphfw	\N	Paciente masculino, diabético e hipertenso, en seguimiento mensual.\n\n[NOTA] Paciente crónica con HTA + DM2 en control trimestral.	Mantener esquema terapéutico. Labs: HbA1c, perfil lipídico.	{"peso": 80, "talla": 175, "saturacion": 97, "temperatura": 36.6, "tensionSistolica": 135, "tensionDiastolica": 84, "frecuenciaCardiaca": 70}	{"descripcion": "Sin alteraciones significativas. Cardiopulmonar dentro de límites normales."}	DRAFT	\N	\N	2026-06-21 12:13:12.589	2026-07-02 21:04:19.793	\N	\N	\N	XBn4ARc8ape/7XWTzaVEeOuNVg4Q4Vwsit1dp5j/lVySfaq4+LW5blROsE9L	pHXx1wpc0FVwhIIkFwTeewXoUTe/PnN8L2spOVN6aeM=	0	\N	\N
cmr4heozi000001o49o8vbyfv	cmqva532b000201p39eq8lpiq	cmr0pml9d002001moekmrt320	cmqva5325000101p3bu118ykx	\N	\N	\N	{"fc": 78, "fr": 18, "peso": 80, "spo2": 98, "talla": 165, "glasgow": 15, "taSistolica": 150, "temperatura": 37.5, "taDiastolica": 90}	"Paciente consciente, alerta y orientado, niega debilidad, niega fatiga, niega dificultad para respirar, cabeza normocefalo, no lesiones evidenciadas, cabello normo implantado."	SIGNED	2026-07-17 05:38:12.461	cmqva5325000101p3bu118ykx	2026-07-03 05:17:16.926	2026-07-17 05:38:12.464	yK+uzWedHCERI8X60XjenEtBPqMEQIt45mRYU2A56rew5hI950+fH3/fjJ2QAFvZZVDDI9AmF/B4jhr1JhreTyDL+wFvewEBeXiMlW9u18sX45rf6FNwiCIx2fdHUV95KqEOXnWB81N3rTvUqiFfIPVH+dMLg/I3OuTBSePDcA3K7xTnEKoPg7ExTHF2RSLGu+g0fZn5ffME9F4C	\N	tjmAPjl2SqlMJobq/lY4trEfBwnJArpw5jm+xqZeGZE=	sHI6szh42ZeV1EU8hbu/6xG8IhtwqjKvxDm62XwAKicUTEFxDUKAFLrPzA==	eFkSe7+JqNJ8on+mpG8LV2J0LXIzf9fF1zeXy4NK5FU=	0	\N	\N
cmr3mbid3001001mvn312s0oa	cmqlsyn9e000301qgk98rcsjh	cmr3mbcnd000z01mv5adnn09g	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	\N	DRAFT	\N	\N	2026-07-02 14:47:00.279	2026-07-02 14:47:00.279	\N	\N	\N	\N	\N	0	\N	\N
cmr0o3w6h000401mozcv4wfyt	cmqlsyn9e000301qgk98rcsjh	cmr0o3mnr000301mowkmfiq8t	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	"Paciente en buenas condiciones generales afebril eupneico, hemodinamicamente estable \\npierna derecha: Se evidencia aumento de volumen, hematoma en tobillo, limitacion leve a la flexo extension de tobillo, Thompson -"	SIGNED	2026-07-14 12:33:16.479	cmqlsyn94000201qg8eeqn1c2	2026-06-30 13:13:45.641	2026-07-14 12:33:16.481	U7LWxNPLAzXzZatzFucKkBvgNmUGcRLLQhxKhkIwdiIYJFZCXhXom494BFYtgVro2unOCsWSRhqTdLAvUnCclAmD9Tzm4B/kinVNMCLdljjdSH1Nwnw+9JtMteb/k0apuQUc7g6Q+xByHB+76ZJbYI2lmRJ2UrInJO/MiB9fLq9XiQTwp23k/kjd1P5yp87gpE2l+G4DlsEPzSPgcEHcbApstFspEN7JpivKojb3HzE/6tpNnLvL4CjvfEEjQF8yIaEacQYL8P3BdAdK9mdUvgtzOllrzlhiJVKi5Frdn3ODahg150Z8UMn9G0lVjo9OQsZVB+c1cELwtDiBId2kZb3GxpRGb0AIqKgLQmEkdBnKZ4amAgaRyzFVyXMiOBESF6FkUgHyr2b0clWluMTsKszna49NwAHYBdEWBjqbGw9c6FfaYcofIGUFF0VY97Q=	SjpQRB08H6CUqJI6K2yUwPIopwbEZhdnZKrevD54Zj/NHKkgik+05q/vWpnQzXEFzIlEQ/hYmHitaonM9UwGeUW80Il6oPHvp8gtSOfVUb8bSkPhnpDGFLCRBtqMFygJFhW4ovIwNgQJSthV0TUq28zxw4GUg5XCp6KD/2eM0Zpg7TnPjwM60EokqlQ+L0SGVPO4ldzi/TssqWjyPQ1VSnfHjMue/NZEkZHl7t8J6BHk92iTBJgApxIIfPHN/kp725HNzX2RCL0JHmy2uYfkl8vGitMeJQ9t/flVKu/8dwMggaLNLDwmSdk=	3snt7xPiyWJdFE7CcfD9Wqu3mGG7DnHNY7kBr1fwjSQ=	s/qtbYHdRbkcxK8F5EAgPlx9hiVtC/ZLe9rWDAYfV2VJ+BwTEQqDO7F6+CA2XFxo/3aS	jpo+Qa6M3Jtz3gM2nhDC+n+bsi3/trLwE5p/WAuHCas=	9	\N	\N
demo_enc_maria_past	cmqmx6t43000101phgcog0v6o	demo_pr_maria_001	cmqmx6t3y000001phuzs1sirz	\N	Paciente femenina 45 años, conocida hipertensa, acude a control trimestral. Refiere buena adherencia a Losartán 50mg/día. Niega cefalea, mareos, dolor torácico o disnea. Asintomática cardiovascularmente.	1) Continuar Losartán 50mg/día. 2) Dieta hiposódica, caminata 30 min/día. 3) Control en 3 meses. 4) Labs: perfil lipídico + glicemia.	{"peso": 67, "talla": 165, "saturacion": 99, "temperatura": 36.5, "tensionSistolica": 128, "tensionDiastolica": 82, "frecuenciaCardiaca": 76}	{"descripcion": "Paciente en buen estado general. Cardiopulmonar sin alteraciones. Abdomen blando, no doloroso. Extremidades sin edema."}	SIGNED	2026-06-01 06:15:09.976	cmqmx6t3y000001phuzs1sirz	2026-06-01 06:15:09.976	2026-07-02 21:04:19.784	\N	\N	\N	c86dtJPv5EM+SvQNjP8agd4wLgdWZ3fMrZqZ9sWl3PsVjd94dBSC8YZc	TXFHBrhrZLNLHCNngauxwIcFCUv3yXRBekRgY1uJyLA=	0	\N	\N
demo_e_d1	cmqmgxvs6000101oau4ntxdtv	demo_pr_d1	cmqmgxvrx000001oa0fupphfw	\N	Paciente femenina, conocida hipertensa, acude a control periódico. Refiere buena adherencia al tratamiento. Asintomática.	Continuar tratamiento actual. Control en 3 meses.	{"peso": 68, "talla": 162, "saturacion": 98, "temperatura": 36.5, "tensionSistolica": 130, "tensionDiastolica": 82, "frecuenciaCardiaca": 74}	{"descripcion": "Paciente en buen estado general. Sin alteraciones al examen físico."}	SIGNED	2026-07-01 12:56:10.795	cmqmgxvrx000001oa0fupphfw	2026-06-16 12:13:12.589	2026-07-02 21:04:19.79	\N	\N	\N	1NG1ZJ40TtRX4aZAWnHRIBjRifi1ZnJ4QtA16klgbylY38FxFVmPZ8Go	TXFHBrhrZLNLHCNngauxwIcFCUv3yXRBekRgY1uJyLA=	0	\N	\N
cmqv64uh4000h01qoayzpywm8	cmqlsyn9e000301qgk98rcsjh	cmqv63sza000g01qokw3w9kwp	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	"Paciente en buenas condiciones generales afebril eupneico, hemodinámica mente estable. \\nRodilla derecha: dolor en región de isquiotibiales, varo leve, dolor en interlinea articular externa, cepillado articular positivo, zohlen +, signo de herradura +, vado + lachman - mcmurray - cajón anterior - cajón posterior - bostezo medial y lateral -"	SIGNED	2026-06-26 17:06:02.666	cmqlsyn94000201qg8eeqn1c2	2026-06-26 16:51:46.12	2026-07-02 21:04:19.705	Vgp16x+nJ7TVLDwsi5o1syiN1ntbBiUCPLPsLVrcwgLYohDYOMzPbhZEuMmRljN+0/fFunDyImUZDNvH6H/Ws0jZVsTnjrBb6r99lD50muVvfeupy7+3cvxDZ3qRsCiDIcmDzzSCoQFa0cWLpSuDvJ7MUJ1mGryxCNpFZ7BM4Wv7WjRTDYXrwnzxEfoenBuzmwoMaoKl42mo6eC3G9wChU2DAu3DXzxVTLFiOLiHj82YcfyAniBbKLuDdr/qBxUPYuxDmOcHgzrJl/0Iux9qbvx7ePU04r+8rmqSwklkpbFXaMCQZonlhxqEiwZ9RZxm/mGQUECTd/Shpc1AeT3aFKt0/HEejeJDMxATY/i4qrw5TYa9qly3sBj/RCHRlx9ak9qIFVmnlPTRiWmL/qxN19Y31yEx3cTuM4TrEsNs5VopYtjdSR5iOfmFnLgkp4hg0BIpuJYFmQsmBDHEMtWwqnvJDqa9q3ZqvthM/xpfqKTQdATXpeW7W6j9T/aW//QqRrY5i97Pju0xDTDhgj0quSjg3QUzpjJdcvLi	wZhtEMCfMDYgIHYbGbf4IdGMEoCIVoBe3ndo7+vozQ9tm5g5NPgTDzzmmXhLI4MHhMAgHNujx/AgBl4zlOadxh1kaTzUwR+JNIIWs/bUrel6/wrc0cMNAKO4cNEk3zaOZYJsn9Ioz1zqaJApVsvYU2Gpyb2XeogEcw6a5WweSltMbTiag15YvzC+VMoBfgZ7rXJyGu2FYE7BfuvFuCRR1txAf1XAacSimTqCsNIOlykGfRNKlniJWMsV/mlJYzU+JJly+M+Peb+gKCDPnRnakZTjhh3b8zZXLGuvT++e+AVceVf4frqtVSXHTG6J1/TljqOsz7DSVKu+wtxwtjJzWnVb4pRoKasQnBWE58Gh0aQ2Uz1pFMBS1/gD5kPpNq/tL4hzgkQMUF43z6Agm7LX1IqYi/mjd6l6ZoWHy9Wi/jpsrFRITVYlrk8GSACv1MnuBZzxrZpyI8UwcNGOSBs0sjmtRj2q5jvTCXt1mi9U8c+hmV5FWSEn3WgFU2W4HKJElK7isQvx/U2X5p7M7ZE3syThBttNFiERbsSurUZ7FzIk6cCtxuIUp7D9zQ==	XunZr/BanLkVuocqZnOTMHNbK4kwKkKatUOe64koVac=	NDGI6Iqo82GKKfm9fTl8b3GJtEhnLRCh1A4T4Adnxlx+JqYtSlf4TzDNIZD2hmnWkf8YsQ==	D8x6zRwTOrq00JtFhDfq2FsOGL/mPWMxeR0nSc/Cz2M=	0	\N	\N
cmr3o2wjj002t01mvnvh8ul2p	cmqlsyn9e000301qgk98rcsjh	cmr3o2o4b002s01mvksm30bdc	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	"paciente en buenas condiciones, hemodinamicamente estable \\nse evidencia aumento de volumen y deformidad en 5to metacarpiano. dolor a la plapacion "	SIGNED	2026-07-02 15:44:34.979	cmqlsyn94000201qg8eeqn1c2	2026-07-02 15:36:17.983	2026-07-02 21:04:19.743	FcjkuF8Nw1HbEXQPTKo2fPo7qQ6n94Ns57l+m7aZ8GwXt6duJHixaMChyDf+6/w1pYOn29yeSqybH/3WsyEYrY2fg2pk/BzMTGuWMxxyZNRVUMd4e7T9jjvmAXRw6c/FtfFiFgmtMMMsA+0Ck5A8MCEuAW4606umSFx9t/nZ8ytR8ZOu96lYZTwQvAu/4XKSxGLtKfkxec7sybeA2VO9FoxQ53obDxyDkkhPXAhuKua/8vURSNDQHCFfav7hCAsOnUknAdoRbnthBC3wxNhh6PXOU/u9ly+HGbsrsUUilyjcG3sGDkCzcVtgReUtXFj7Qxs6wG5jKbcViXRh9gqWfjAI6VFnnEJ2UVuhEzgWg9YwVaBJhCRVSlahbEKb9owKiCgIl+I2Up5tEvaC5UCkFIs/o+FoCWgdUj4/XfmqT7mMt9opoFf8zbgcfot6iGrTct16vrnCzsyGCumFK+rrhPsljgHtD9PH7IOg8C8hm0WOFA==	CJfjdr2ps1LbqtDMsKByk5bNtxVe29M2zsle/f+xZ2ReHy5J0KQQIJbJ6cUQhe1S/KrmQHK2/TAFZwOZJxE4yA7XiBednfN/Tou6kLsYWB8bmetgv9pgp3euATFyixN3aMgNInTJoEa3/0H9Xd64JQ1QyX0Djtv+vU4jEf9178bDYZf6KXgLZN6m82dfvymiiVd23Qt4HLoLvfWKVY+mX4T8EwxtPYK/e6IQmXZE8eVugOGj9gNNOkYVkGY+NNChuex4VG6zy+sDm6N9Prz7fS1kKePQjNQEbHOSRFlHjA9ImRaytg==	xhl6f4A/+kMC9AVvRhTicMaAhMATkNUwXhV4vSmHEWY=	Was1LdqAMY/7YyBjWYhu57qW5WxJ8tG5FNt/3g9UkYqld4gKdeEmJvdmF32zlLdYVg==	fUSQRkbxnuFh0pjCEJrpw1A0E1In37aE84xa5ntsGtU=	0	\N	\N
cmrn0z7kd001n01o75z5xijxo	cmqlsyn9e000301qgk98rcsjh	cmrmyhl95000201qk048pvbah	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	\N	DRAFT	\N	\N	2026-07-16 04:44:57.997	2026-07-16 04:45:12.136	RWtpCek2bLqaCB1xSRbPwivYehd6/JwFGugRxwO7Qf9nhDSrvxEpWUGq9OdDNbfz1J/Z0XLKyw2eAfk2WmK70mL1twHuMRmnEZvbUOJuu2imfPprLTx/wPcI1T6lsNHHS8O1aZQBoMrV6+t4M2S+TX3tK0dGozMq25l5pyXxLVN+99x5ghSl5/pzVf3U+DtEW1oSduwLMdNooEurs3hvFvQtoHcEfeLcK/tQ/xaiZzYHpwDyMfGp/LwvwpBP51GiGD4r6jwglxS8+ZQXq9GBTgRySOvff5gEGmgoAcWIutQG/0kV7YDCGJeRINj1YDmRC+VzB4Sb4Qv/UQJMz4lbI0opNnFUaqN6QZtzm3Efr5COwlLrhJZD1x2KpBPja84/LNDf76ohACfloLXJkmIx++Lhvltujh/YI0xIAUNlptjHyTGVuPjMkmJEaM5PZd5C8V2Sm7W7jmj9+oZkwps7SNpqzaEtNSnvnneRPSw6YBF+MPspwiL6E1hYX/yqdpAN	lY9bZ5FdFnIENGCRld5YEPvvN5XUMpvV4h/KPFvpyYgdoNZEQiiUUvaYHgEZT4T+2i5PPRbfGuWPCom0YuBK+2gYZtv9BxvmWutOHqmXlyMAriGZSDBc22ti1tsQt9Fq1ubINjloOl/BcAygShyeaPrA5BpU1g==	\N	M3FvrqQKj42hBTtvdF6UrUHFNq/24xVp4NMYoMEJOhqxroSKicSROBY=	YBFhfXOxQCKJLJkTLCM0bd8GoJh6jGJhfLJ6kBk7qBU=	2	\N	\N
cmr7ygjy9000g01mpw0hcawcx	cmqlsyn9e000301qgk98rcsjh	cmr7yg1w8000f01mpyn3ufito	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	"Abdomen globoso"	DRAFT	\N	\N	2026-07-05 15:37:55.713	2026-07-05 15:39:49.259	3/bMqD18nUGFC+BEzgH3dNrWLAm55kqe4VXvvtsjlHXgfv0qIfrIoYA8Pc/TXDSfqtENt0tVOBInKtOH2AljwzA=	WexJOz38xcc1wwZvgYn26Wb27XZ58wRvhno+N0mFF+oQskoSfr+dWiX8oRdfVWbb703DETgW0JCkL++pVQrX+hCFh3R3Lw==	\N	E7m+PQOEdhE/A1tYqTMYn/d6LK9BbQ+JYEZQkcXUy/K9	6mipS2mIZfXM7Vd23pgrs7adGuiYllatP2Hvg7buvrM=	0	\N	\N
cmr3mbiyy001201mvd3m4j8c3	cmqlsyn9e000301qgk98rcsjh	cmr3mbcnd000z01mv5adnn09g	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	"Paciente en buenas condiciones generales, hemodinamicamente estable\\npie izquierdo: aumento de volumen, hiperemia en articularcion metatarsofalangica, dolor a la movilizacion pasiva y activa."	SIGNED	2026-07-16 04:21:27.717	cmqlsyn94000201qg8eeqn1c2	2026-07-02 14:47:01.066	2026-07-16 04:21:27.721	mPGOWcAcZSB3jQb5VXMFc5XqIn7xKRfYD9t90I38c8XVaPu7OZYIZUcIALEOsFX1uuMmtx8wPvyytmQWivVHJQRRWQbGAX0A4DMwsys9qgtWrKO9CINIusQ74tPBuAj/rHIIs+JqlF9gneuJ3UqYLzRgn2SrO/kO+R5oHGIj4eIaWqEcZPkD3i459CGpog9mvlgMl86gVG+aa6BKnaFzCN6psarZ6Qap6tNpycLRYIIyZ+npTlcItRA9LLY1nM6MXGBTfHkUYvzEYITZFzcQda1z8TtkeQIlCggaHMUm+cM1YrmMNqvp5MAiORAXwRHCRUaUUeezvQT2Jw/7JjWSZfqtrVGNRmkMP+bF+hPwgT4LCuDXgQQ=	nWKdI40ddnzsTJf6jyPkZVCgUUMt2SVJjPO/ZCoGpznm1HIF8KI8sy79LSbb3i2qqr4SFg9NzbFMpeqFWJu+thIn9iE8fwpMxo/TMXW3UsJuHqWff3Q7+1XnNKjJ7TL0BEAeIFsUfj2g0C39prhSkJjtlUCdTx26KLkbA3vzcadZ/EbDS5+odBY2FnphP0jwpN4LIDYSgcuzRQCOXI+g1MCThn8uveTwa8dzKegOCzSViECL0N2hbxza/oVCzjO2Rb4YEBn4WDykORQRC7FBxczoO9T95S0azqb0iKWDLhQh2GPBGLvQ3Zo+c4KS82phkK4C1jfXnlzZAe2fUAjLRThLMF/zSsR0I+7ERVrZ9fvatrtW+75TltlUfB7rDcZD7DAwliizbLcBDV/FqtA0mlhiq46mUtoKErFWwQ==	3eQ9GrQ9aJBTVxYEoCsU714kZ0UEqWzMk/6gf4y+JnE=	KuboUK+tA3JlAV1QiyEDo4mUGf5BFQ80rOmDZLy8TdOVt6gbSEaj5H08wzGjkAndl3E+LMs=	AeljwYIm1ZjYZ983nTro75LTgfq+fmMXA+hSe/orjxI=	0	\N	\N
cmr0s0vu2000401o4xnglyo6c	cmqlsyn9e000301qgk98rcsjh	cmr0rxhhb000101o4e54mg6fr	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	"Paciente en buenas condiciones generales afebril, hemodinamicamente estable.\\nDolor a la palpacion profunda en region coxal, limitacion a la movilizacion pasiva y activa de ambas caderas"	SIGNED	2026-07-06 17:55:46.328	cmqlsyn94000201qg8eeqn1c2	2026-06-30 15:03:23.69	2026-07-06 17:55:46.33	WA39XJeSNgDrHze3yFDOPFkTHkfUNKI4k38qIbkgCCWY3Q9ki9OTX3s5EjA2/hm3GzC69klL983orm18IfatmU6PLMR/Uy6dEoctaqTZS7kHlxEoIHDiEXREyFE1hz/WN1Nkzk1Fxxjb/8yv2tFUtEgvFlHoPpRW5QixJwoEC/IxwlAaEH/czSFc7hIOEO2rUpLsXZayUbP5fLxBzXVYRw141YJSs1EOw7X4ft53/Ipv4po3bKAn4MRRYssn5SplwpFYfRDGhBw0BHzMNeFdyXTmF3jFoaGWAhcQ5wJ70KTx4JBcOW2I7bdxo/tcRWCbkq17vITW6cPWoZL616dexkjE55fgvpney05BqT0EYX/HkBk3l+mDmYeQKpjeTh7InoE47/DvUpAR3rF0baE55hfbPzOJOGRmx8D7CXrdZ1njhIRSOJOR1RpLIzR0CLx93uE=	oFEg6LDpY+mbxymBxIQr9mMAmEUcc3GerWp5kCHWEUU3Z4AvIyvGScTxeYycqcyxbsQGdKObtVYM08oQDOn+OzjHGixd+1SmGA84foWC6KymaeAPisT0gcVi18sg9MgldRRMFZ3tCnYAmRnzzZCeZa5GSZcnXGSpP/oa+1GpKUHM1Q2JjLD1X7IbayJkiahWmMlkWvXHxV4j84WfRpGg/zzexV4cs4Kb7X87Fk6VZ1au4GUS3SEqyaTQn45KP7b49000lAJHA/LG5RNwglGyrJDYWxkg2rXT8xMmpf5IncWIZPZ488SCmRu0CS8+B8VOaAgKATiUQBvAZ8RhFho/EW3tYl7xnKsTYpX4K7lHSwHR4WgA4yn1ll62oYhE2CcmP6Bt8EgD8x1u15B4hz25LzVKsh+dTWgtHcf92hH+dImVMS6bbkSL7t17zK/bOSWR	Leu8AP/5gs1Arq24Wpq9WEIz9bm5pY24ws3eFTQ/3pc=	Cg9vV2XkYsaI8bp9aBDrPL8Z2QNWcf9ZicHKP/9hoZ8rL+tfzFpAr3x6	dxY9tjGa2D+K1Lq2nGbqqQPdEdMJEqK6fcIzLVpqkZY=	0	\N	\N
cmr9ixxhn001e01mpvrepgcnz	cmqlsyn9e000301qgk98rcsjh	cmr9ixqs3001d01mp3x2cjps4	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	"paciente en buenas condiciones generales hemodinamicamente estable \\nRodilla derecha: Aumento de volumen, varo de rodilla leve,  dolor en region insercion de isquiotibiales, dolor en interlinea articular interna, zholen -, cepillado articular -, mcmurray + para menisco interno, Bado + para menisco interno, lachman +, bostezo -, cajon -"	SIGNED	2026-07-06 19:04:25.985	cmqlsyn94000201qg8eeqn1c2	2026-07-06 17:59:04.907	2026-07-06 19:04:25.986	2DNOBDYmxe4vTP2fx/G2HNHzD3ypY83IS2ew2ffECLH9M06ha6u4eXsMROuNdy4cF5bv3fFSMuVCqZfRtXgekm94+Lj8hGGlzwSGqrmas1Wcz+h/jOb5QOhHfnt9pLLTRX+nyqY/8GW90Y3CG9Oq4tO5l1mKBT52P/aNANn9ux7ntmzqtuqV8Y170Ts2LoX6hWNgRz88qI6QS9GU1ixF6FsgcCw8r6SEdZGhNDu7jumhInHnQZgaVHfURVY0v7qq/0Zp/OYJL4a+7OuLNcQCswKi0FTJYVNBrz/slWdDs7ALCO9vHvU7ggWRbSqXxvexZm9k20hlpAtAyHzn+P3OC0UHiWktFA9IMnnEsbLagS5EEvT/GqqlV7F2mTNP9lkDmOVGY95ZqM5oEH5fVZjzgtBr5tACMZ7LrcUsfYJX8bNE21O72I0VO0z0vZ6a/+eOCx5vik7VT95Xa/ueZvn6JKhNZwcG8ubUddep9hZViKlWPpNl+F0sZA7hL6CZFs1Klhwdi0jguZM=	uGmWV+mLbmkDcNVemFpLDnjqIt/iiwo8n7xHPW4Lqj43YULBF5KpSNLjvL1IJV1uudfhNEABEpHojI5WrAFsQiv4SITlMbQeK8x4hVfFe9ElPdf8X7sXq+EQ1Oq0JGBQ3r8BoSWNh0ZonjGgMwRarYTe0Tr0HDpDqCYirvVMuC/N3Wz82hTgoa+g7Vniwy017kDJqgfk1Z7t23cQlTkSIlfdkVqmLdBPLgbFXXoqNNknSpQvAyO8gSF6+hW2Azvk7wE1kJXiN7C8+y6lpCHICJPiTYb4sjMJm+21eSrib9YArxxvzClPzBHWAoNuRfm8G+3YRV1Ga2cPRFehTjqgYHXhUDv69e5BvI4Rf2FN55kTJ+EuM771WT3Ka2eibPp6ge2ytdboQj37rgtB+9ArSWl6w8ozgK5b7JBa/8dT+FcofQ/d+ecoKjmOaXkfxZyY7lhK6UCZXo96cylWoA8SkX31I7GQ04W8PA==	cZnpAxvbMe/3Vtw5Dhnuyek7ER27+QgI5B3fOGMMQgA=	SXKHgwUeCwzuqnF2cbDFo4ITN40mBpGpaFr/2OLk6Skdo93N0c/Z8DAoPMWcJcTt8NPmnA==	D8x6zRwTOrq00JtFhDfq2FsOGL/mPWMxeR0nSc/Cz2M=	0	\N	\N
cmrnoph78000601rs9qecv79i	cmqlsyn9e000301qgk98rcsjh	cmrm7x1l6000101le9hkh0ivo	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	"paciente en buenas condiciones generales afebril, hemodinamicamente estable\\nhombro : rangos de movilidad conservados, sin puntos dolorosos\\nbíceps: Speed test  , Yergason test  , Snap test\\nImpingement: Neer Test  , Hawkings-Kennedy test \\nInestabilidad: Cajón anterior , cajón posterior  , test de aprehensión  , sulcus test\\nManguito: Full can test  , Empty can test  . Patte test , Drop Sign , belly press, lift of test\\n Slap: O´brien test , Crank Test \\n\\n "	DRAFT	2026-07-16 16:28:58.442	cmqlsyn94000201qg8eeqn1c2	2026-07-16 15:49:14.708	2026-07-16 16:31:23.36	H0FskmYxqs1PiJwoqilyv0g3g8/aPMH9CK8kEEEvz2cwB1mqnVDYI00hxtIJzU0h0ttbzwzSq2dHvf6oi3mMZmd/qx3TwIQbJM52iiVYeko5sUs7XtW/RUXCFkCrqOHGYMQZQFgvjP795UDgJcWO4C+6xrTeHD3yVTjPLWdXjNAjll+AP/GGJ1EwrmVtzSr5CbezAPV9vSenAIcF3CcHP+cFnGT9mJv0g3lXKGhRjkSC3l1c3eLbd58kexKUQHQ9fh9dqB/WdQTSVdMTTjkhkuXXjddjK5/BfK1eMcPP3ZkL2ouQ9+rvlInXYjMiTiBKfhzcZXYUM2jInHubfnxpqtY2Fq5+qkFitjexRPuAffC6gHmXkNpXmt3CE1HhlB5oYfD3k7H/KDHVBsJBBUiJtH8mI50KArRUfF64dieqCEZWh9FsJhy0Vl29V7RjGOULbM1evw==	\N	KQh2py4S9kXJMENkQR9aH/Hy1j5DvFPfpi+1nk96MoM=	k1ugozvrLR6IpEbXBiEhh8o1tTb+DEhnAjYZZ/8YPa+JNEtFmBTtp9qXYQ==	TMpxq03ytyIxafGDI8oMMNJkS6eQcqMbFWVLx3gxL1s=	65	\N	\N
cmroe94rq000001p2i6w1c9kx	cmqmx6t43000101phgcog0v6o	cmrodfwag000101r0up24yxhe	cmqmx6t3y000001phuzs1sirz	\N	\N	\N	\N	"paciente consiente, despierto y coherente."	DRAFT	2026-07-17 03:47:42.284	cmqmx6t3y000001phuzs1sirz	2026-07-17 03:44:22.118	2026-07-17 03:49:54.191	iZw48u8Vl1xYGdk8YlkSkt33kfEWCr+jc5aXD1Wug0D0aV42Fm+NRMBBuB9G9gKvx+fNwo0PXEoKJ3N3YFS2YfM8btLqFIRhUd80ltskC5xzJEhm	M/jGAwQL2eoYPU+TYS8m1qx6/mQ3lx69W9AIHjW/cNZIUsIkLa6KaRPCo8JwcUQqMitS5UXPG2dXmmOP0LE/kf3MsJNEYM28gL/aRLA40i5VUsDvO5mfWbEQEi+/eyTU/pQbZUUPg6HBjuhlbZgRHhr4l4523PKp6JPAL0er9q2+bkDoB1oz7RlBhbOjzzty6BqmgAhupZEzeoGDL8g92+5nUk07vZiSeqwRFEL8XBx5oEaQ7CwYlR3cjUu1M+84ZhccmGGO/Jspd6JSRItho6Pw+XGHGoXJHn+QO2TlIwkw8QP4F288nnQnFfeEGJ6Sg2wXpFnZfNxdCh6RSiXML5vix1NNNZQ7cmEy05FYpWysj80dQAhRpS+T66N41Qh2tMgMtT+AQppM8fuDqhgTxTqiIaCXLfgakuKdbUWoM8BGs/FbEDU8yRrGxdlP4D0yrElxA5qImzoLKdG/OwRvf3Cya0xqA/20AEwErplXCFxEuiJL618Nxfs23ogtMvrRSCuXmJQa5oAimk9VUfAVKb0T7dngOP5sEmqeNfMORUR3kjaYQLK0mc5hu///1hcgLJ6FGfc9ACK7poavpj6OZLDPFEO2vp7l4UoP2AxyxxEGvtSVQWusdBqpLiTM8Z0bF0s7NZ8f8PGx8travtIigZUv9Ni7M6VZAKG6onh41T259Bzgbk2c+kGQns7NyHH6BWqsBpLLahHDY7F+nPNwXLLo3Ec7DfcQIcAaKpJlW6OFMAfI8/uMISEL4Xe/Nl8s/4HcCARXH7clwQkSeLCVydOGxab4DKqs3lDxfF5losSKYgvAVMHv9cflKw/+n6WbceApY0C0MENa0RVdlGYpDnQZQmeTQ4lYD6bRFTESG0et4AjoVNciT7HzvfkSxKjpulP8y5J+VAxoeFHJwTGx15q0beXP1+NWTFH7ml/cbNExVyuIn+ilLBQe62e3VSpOK/4osl6Fq8JY59qdk8bDeAoRe9IdloMlez6OregXWDskGdUtWxDkPRzTr3bJ9/cDgX2bOFZkVjDHsiSvlKu/54t1ds2lH7tL7mjvtCx75WjDMIlnr7+xexPkTcYI3PvL249gaHHoyJGHLr/lmiMh9i+QOb4dy2NZplodR3PYQ9y/B6T6ZIaXDztgQVFsEAHqL2Ng56E6ZhK+pPA+eIEQkxlYuZQ3zmMflJMh4dm4m2XIibaGi7jSenUJbu/aT77tWPYPxaUrR7mMLAjfnGL0y5a5523D8CJcZS3DyMMAX51NTEb90IDAC+DnV5yCQ4qiX39gU5gf8QcT12Xn+u6EeqkHp84oYYg6mj59k+WCrCVCDk78gxMSE0J/ygIeaZat6YZIJKTieonRnIF8z2EIOmmhwXHFlPeySdxP8a8yOP29gAKD6gyOSBgbK9MSKVmZnHfGAl44LvWJrKUHnqNPiUdqkWUspATvJiFgrH2xD7seV5WYGcTJgZFsEVYpPvFyOHQgdgKMC6CJLyfFL3b2j/k17GhLMuJ3qsBdkHja3gZcdRLvg0Tis+nuihDGK/fh17SZ0NsHhkLTP0v7rk5hSHyCq8qmnVtjMLe3n31kUKAdwRFPsu1i+Mmbh5FnhqYFRq1tmiuvCRuJsk3mj3l64Ey5bo5WUwjDfJHdhVRspG6sqMYoi7rNaAJPx1IoIXnLW2vhIziSv5SJZWQnsuz9RDMrc/7neFnf/ldAcoOmNG0kbjsGRuzWWhTuo0hXfcwZKp+uUuufNJe8A2u7zC3opaXSSuaJIQjMXMyjC0niIpGvajiLNMPqo+oA0emAtKdpE79QufcPiKNOG6+CFPxybKuPSXke2or/+HeX+JYvlIz11bHTMrSrfSgRspz+sj+dwdEatw==	zM32OjMJMYBpPvd3VEKvUjliagMEt9/KZGZ4Fp8/p3w=	WwRisUqgmeTSnFVuJUWMPmu5H6STN8L9oDbuShi/kVwilOO6kY3Ez/EqIGI=	9wXU5LeLTYE2rgF4f4x9sd8up5hktj55z3aoogxGibo=	8	["subjetivo", "analisis", "plan", "receta", "lab-order", "imaging", "examen"]	\N
cmrdoeaj1000201p855pyvef0	cmqlsyn9e000301qgk98rcsjh	cmrdoe2ux000101p8azbmt9qg	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	"paciente en buenas condiciones generales, hemodinamicamente estable\\nhombro derecho: dolor en cara anterior de hombro, speed + yerganson ++, full can test + empty can test +"	DRAFT	2026-07-09 16:27:36.807	cmqlsyn94000201qg8eeqn1c2	2026-07-09 15:42:51.085	2026-07-09 17:06:47.108	6Qk872hUjnqqP6hX8qcuVKXZNkuPq6DSDxSnNL5+oMe/XK8nNRyBlBIPVaoVUjzkiWLJy058uCdV27Pbi59eSfTjwXskPZEJRTf/1wZl+9xb1MlpNxlHv/PllAJ+qxuaojuMl80/VX5pEf4BOc+BBVNTjTbW29t91rfkOhvwG8IDaQomNbEgoNJzPq1E6ppRIbR9Z2yRE7KxWSvD5Dq+pUqEKg2WvfueS4D+8NJv1SNVzww+wOOOcvCAteQVJDD/pXUzx+ILRONQZ7l+oXLELXadpclyFqugrtOjnju0moMsUqiFD8JzoZXyocb7a0fSnwU5747W/0qdrKlOZ6c1afwHRyhi2MdzVgSrkuohuV61QVRmE4r2k0WIaNB4VcdDuNbR5fRUekd5L/jeqqGIH1DOlr1u66zBkiNlr682u5kmy26BzQ==	tM+HOUi3A2h0eOArIN80V6Jyf7BX0s5QsWsHpKu7rjmm4/vM5mjBdGHjXL1L/ORDs/xQgiKhRdvCpZIkWD8IZx2QWLjwWGPPlPp30dXtKQiIDol0yGakrC3jlaIVJIXf7qkcefGsl5xkvN6o1iDG6ZqIWMmdjZSCHQgiLqOSUczeNWXSOn2ujSP0aMl22Eyuls/WxU9q08fl9DHX7a12WZAEbxpV1W+pYkIBKro8bGHnZ7ohWCBDkjTWFUcvyBfEUeBHlnGz8QSEKum6Cji9m9bjZ3LNIY/ZutVNh3Hey5VJXSjK2JUUnnB87jkm2D+YBe2xMBrbKqJHSOQCPLxVvMpnzl1IhrwbiwI/AzvpGKFZuiMazC946ALW+nQ3DmcHqICcJ1701Kc4V18EA7c2	v883Ix/CRKXWJ68LgTA2MDEkQm55lY85d0eHKUrNXWw=	YdTxnnCxBz8USOGKrigINYhEb2t3unEnCBEAh9ucUR4dLvlx+vkg5s4SRHEto2haAzUa	BMYubEW/DozE/bcIn0w368wjVU/01USociky8p4r4es=	27	\N	\N
cmrf1bogs002x01p8ec22x1ti	cmqlsyn9e000301qgk98rcsjh	cmrf1bjcq002w01p8eevosijc	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	"Examen físico: Paciente en buenas condiciones generales afebril eupneico, hemodinamicamente estable.\\nPie izquierdo: se evidencia aumento de volumen leve, dolor a la digito presión profunda en dorso de pie entre 3er y 4to dedo.\\n \\n"	DRAFT	\N	\N	2026-07-10 14:32:30.364	2026-07-10 14:34:38.963	P9IW6MoW2iyc9dh1iZYfvLpA7Sdm6AGFBEYY3zqiSaLXOmYgd81e+NMczyyjADywaG0YTGmpWNHYgXEvi2my+5FBannutOx7ylw6ZYx5Jel0dcdZwPYdzYgUPXnoHiKvpuqj8+IUjLrcd2YrQbYmtIcfl411ByN5/0gYwgXNAQP6ijNDwfQ3z9Xhnwb4wu+jnmqj+mQZ36TRd+uRcFEsAkt08658qdcVyJnuLNqgPQaE3r6bgL0egXmThHeOr8F2C0DzwbAQ4Yutx32at7He1UmSOQ9UPQaOgXkcxhb4MnvgqaXZB4PAW0Ic0nj8aK0Jp7G0cW5KbTo31WkfO7VDYU61IT+dmgbszWPzJpdFgcEg7D819BBr6Ow8XIBhWKcIgN3G2AtzxVPakaVu770roUyV32TEnpR8HkxSP1jzguO5eyMlfeaQMcwEAenY4y11jTMcWmEGQkSLMXV1xGGBD7lm9/jgTJWh12HLh8xeeNMwjsHBTPXI7jMFkGUb1bCMhbgwo/JNMke7+lHKh4YNKoTBBWwCPwce8NCx+G2L0JOxyKETOToyZ8wsph0wqSFZ+h019s8XhvPDP1zZ6PY3Gha+1+G/2qoN0/BN8hqN2KqfJsQ8cpQ=	bfiGw30m2Rf6U2eI49xtC4y+oZlbQk9BwqMXT3GH/Eb5+p1xvUodb6TUCWv+R4qXGAMi57MeXhl4mj5xcAOx3gWXO2MYxJCT7fv6/V/ufWvSUKorzQBN8IKLeTfWoq3rNxTjhZIW7PQdHrQe8P4sYforGGfqR1ObXUsHwI/hR4UKh29F40zsv/+TMgDWR5axZXLp19ee4VnDPqdEFRxgjWiuSzofoAp2BOpKUoC3areeBtC8f1LTKm1ZWKSSmsVPhxWbD9o4Prk/oZj95m8rpzpf3gWpDf9WWDQEBlePoQvCKILYDLp0CZjrE/9kpXgZJl0IiTMkL5xBjJIRHG4XV9qu2iLRZxB0W2TtAAR/b0Ca3BFyJGDiJrXwgPpDRS+jO7hekYAQ6GOb5XCUXOHSRZKfei3X9PS00q8TnfN0TTWi8A==	\N	/BpB5bDIm45cZGZQWAnjbbobjT0RauDSJZIf8LOaH3YchPwDXmmfQm2cXfTo+0JnuYE=	AVqREjav1jPhJ5qrAQFCJsqpoOyFKaVjCziidFz7WiM=	9	\N	\N
cmrgkyi1g000201p2tvci3n5w	cmqlsyn9e000301qgk98rcsjh	cmrgkycav000101p22bb4j9of	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	"paciente en buenas condiciones generales hemodinamicamente estable.\\ntobilo derecho: aumento de volumen dolor a la palpacion en cara medial y lateral de tobillo rango de movilidad activos disminuidos y doloroso. pulsos presentes y sensibilidad conservada"	SIGNED	2026-07-11 16:51:20.983	cmqlsyn94000201qg8eeqn1c2	2026-07-11 16:29:54.004	2026-07-11 16:51:20.986	xhQSwivOkDgw1f3URlqtZlkMCJaSfhEl4P1RzQn/6qH/+kAAsp4+pCQGXZ1M4ZiKTh3utR7pyh2/5mdV+ffK67LV9eCwEFjT6PGNfYjRMPNy9nBYza68TUpLp7pBs4ZzPXTeGBqgMQHey82dUs75BduFJsObBmVmIhMhzamA5IcshKF3tZna388IEPSUUKV36Dd+uS9ty35gl9phhjRWNQ67VDp0JETg2+VseOmJJqEGGytUocluqENrocfc137cpKeIJrYg45tQOrJJ2/GmhQtz4+R09HYQx5a6OBtgrSJO0BvJ55M4UcsiMeNcdmRgzjBV1wFuhVAxaMYpLRaAPBYXNosUUw18rHOIv2zCacaGYiGBk8WjO9U159CHyvo0T5Lqs/XirZS0WV5bJ3k7ksTIyNaxPn9VPdDH/GfiJ7fLPgAi0j8RbQ0AFK2VYHrqqPhphNfDjZHw0hVqZQ6Ma2wAej32FoTHQqNlwQdLhVTc24W3FqYS3RC4hBxWAz8n0wtBk39r7Yev8lEAg8ttBRHIixw=	XNu+OcY/YJUJHZPMkJ7vgnrj5ztRIL6BlhKmCzyP84qDG0DGTyfRWqAv89W0OME+mTK4NN3ei20jOXF2FCwbFSTHlR7BZPW6DeMU8biqnSX4VMY5/8WLFwBnw7FAjGwS3rCK66ISzLoy4H/aGasKwxQwTI65pCVk61PR8vO7Px6obfWwGjaG46Au+e5w8VF5yiICZvQeP5+fdMOaOgxdOEr7ZrwNGS+E4wn8IskYbjG12WIwZQF3zhc0eYk45YbA97BkRCMnr+fdJFajRgMv3Ss8/N2wFKZwnau5zPGEIZyg36bl7tlAj5RDzXIDJFew+6XYvyes0RUOQeb8oCsvhWNUgqYfSGJGdrJ1lGELZcuoEX5IOvTwpATGLA8Aw8XMfLVBpedShYSuZ2ALKg03JyrsYLfvoc2T7CApGJEkDEqlhk+vtNElEJvY7Vb08qPp+/aeeoc55j6AEebFmgifvBo59T6hGe+VvwJOkkU8zndn19FZg4JBTxs64IXTyPpV+ehpnQsOXuggQAPfjemEXMZCx+TFv3Nyrfa+/ah9WPc6iOP7i1mYZ77IGPgxIOIn/y3Fi1oa+VWHvA/KFS2pHMJcv6NFCXb7IjX18SiekCCoJaO4rcq1RksBriOhyFDe6ghjWa6yRv7peJtCAg6gSmntJ3ZgZnuRVnugopZXHeurgBOXb6jRWIs6wcwdqHa4rXz7EL/OoFFn+oP83hg41eKE/39PLpogrW3lag2Oz/77FtMWKMA0MI7wEmBY0+/YJ2N+sEtSmpbrvjUYYGjIFUCQco9Bxwx+IKH5MztptZhTXD0BLWWwMmAtARDgQNxFP2sIwJtAjmal8Wj+sDHHqC752A4AvYWvGHtxfkDiMHb/EvmwiiSk/qk4kIOovf6bS1lnj4oDxXhD1mlKa9G3iA0Czlo85qTXubrfiCK+DicdmvgjAa4r75LN2jBJ0iw2M+z22Yq9L7hXHQnbYFBmzrcW9pvnS+Pc/3u28xN5C6dzyPFjo5O7Q9I/mtlNYUexdBY1F7E/EjNMHk/uvE27qxBEf8AeIhaH6Bf/6trinekCgapeQ47kYXIGy+E=	4igJxi/seOlb7dcVWmLDIWpa2cgU5ccV78DHFbh36mo=	iGvW9T5Cb9usM9rpLWyzmZFR+93tgCpCnc/jGNAKt/5nBWV5nx/ho/PGO9yy2gnjqfuRDQ==	CU0qlBe6LDPL406KB5b5JB/+WJIqKnWzumgQQzu+7dM=	12	\N	\N
cmrnq6iej001e01rshkgiy5i4	cmqlsyn9e000301qgk98rcsjh	cmrm7x1l6000101le9hkh0ivo	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	\N	DRAFT	\N	\N	2026-07-16 16:30:29.035	2026-07-16 16:30:29.035	\N	\N	\N	\N	\N	0	\N	\N
cmrknjvrf003101p21rhx626p	cmqlsyn9e000301qgk98rcsjh	cmrknjqty003001p27vao7k4s	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	"paciente en buenas condicones generales hemodinamicamente estable.\\nse evidencia yeso braquio palmar en miembro superior izquierdo, sin edema, sensibilidad y pusos conservados \\nplan:\\ntratamiento medico sintomatico\\nse decide realizar corte de yeso a antebraquio palmar por mejoria clinica y radiologica\\nmantener inmovilizacion por 21 dias \\nretiro definitivo de yeso en 3 semanas \\nradiologia control en 21 dias \\nmantener movilidad de codo constantemente \\nreevaluacion medica"	SIGNED	2026-07-14 13:04:16.503	cmqlsyn94000201qg8eeqn1c2	2026-07-14 12:53:35.499	2026-07-14 13:04:16.504	MoSAm3oKP396ffTWMp8yPRj+ycV8h5T2u772liK6lRun0zi/m1MUyUEVIEMQ+9sKb1sEIMNsD5HicuEL+u/P+qBW002tS9DCNbIyjyV7ez9Ym0YVDIkxRbowMxh4vhRMcqre6jF8M0HybE2vfN2PpvNpxHyTNWC3jjaLrKx5QeS8d978w/057pFTaOSbdtV2HzHVb90KxfJx/E643eyObPydfwNuQ6JG8DFSXVCnqdRyw9kEWjp8FM18h2EprNer4OyphIrmzd0/T7ek7Gmk2WFoxz4IGIQKfmLTvLON0sZF7+q/ig3QV87+4r1mEcFgZeAZrIo3EPbQO8pTJZAbsZJadG7398rRlr3OyNPPk2hbEwTrybB9W6E8t8eXQYgO3o9wMpsbL/tzO4y0YArEiCXfKo+8bsceDruhJw1y8fQ8GZpkwyWkat56ysVr51nbkE2jx/azkAvA1grTzPia/27XDlXqY6vln4k2SYwzzLL2Qt6IJrttuPFRyGuAKRWk/1wUh78ENKn78t2uZPilbWxdMEUvcAjHvW/HgpQkVgmr6fAwb713ETH/UZ6B7r1ysAs5Cpz0c7PPVrxwgTP/xtidOaGdvJmL3GeptUk=	\N	+R0HppTFbFDJ/mK4Iu2kMaTWaogPtMdomQUS0HhspR0=	Spo3iyzIKKJ6wTuZemvwRVtc9Th6z0IB3omCQo/2BjnczD71kyqkroWHEiBZXg4utDolGVOn	RtjNbUWCitfHe3ol7qsKZSz6EroXeEct6rdDE0MnKLo=	12	\N	\N
cmrglvj5n001m01p21wtrk2mc	cmqlsyn9e000301qgk98rcsjh	cmrgkycav000101p22bb4j9of	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	"SDFASDGASGAGAGASD ASGASG ASGFAS GASGAS HJAJQJADFJAJQ  JQ TJ QETJQTJ Q  QTJQTJQTJQFHAFHQ  RGQGR"	SIGNED	2026-07-11 16:56:58.023	cmqlsyn94000201qg8eeqn1c2	2026-07-11 16:55:35.099	2026-07-11 16:56:58.024	w/u7iCC9hUBRlR+vTNqb9QBqIha3fBrU40oU+z2hHavZUifrV0lmKO3S0ChVNMOQ7x7dbiMEMN9svQII74QR2gLTeu07EuCvUPurWO7rgJBnlYCDDsz4l1t/4kgy8o+WWITapZcDtgiX3wa/cueZCOWu9K50w/yBx8VmsHI=	PN/+U7HXHnSy+RamHcbRdVjVCdY3DroGXsrNWKgQV/aDncbDSOJlv0MCbz2xAEyBQ7m1GQiciABYY30a13hzfJxWqKHYomkEcJq/W8PadgXkEgQnHEYnZb5NxGLus0ZzlgNKoSPa+y4J6qNV	K6vEy3ZkAeV1PJfjQLcXnVRABc/M7K6aGDaYIG8gqsM=	/wPiaJFcOdwikI+bZv4dJKn33TI319tZri6h5POCHzoorg==	m3d+3/U1zwScwaDXrqMBeU+TQqnd+Eed/Zau0biHvvI=	3	\N	\N
cmrkp9qnw005h01p22ngivvx3	cmqlsyn9e000301qgk98rcsjh	cmrkp9l1l005g01p20p10qfcd	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	\N	SIGNED	2026-07-14 15:00:08.349	cmqlsyn94000201qg8eeqn1c2	2026-07-14 13:41:41.564	2026-07-14 15:00:08.35	95//PvBqnEhCcuW1PO+lO0bjEi0VwljUJLPTiaSx5C34BCpgdasY0q3NfrdocOkopJjWq/TpCrlaiUB/LNmeKsuyv9nRg9GcVhTnn2et3Kih87dJvMCYa6B0jcnmGZrbpZ9A8NkW83aRCO9Hgfi963GXC5YtmXnW1ZBaUKoDsFxdCBkGifhJ+QF3Fwl4fKoiFAVnTBVjW8DXf0c3byrlcLXNrwhkOX3OAfoVEVCYVQs76688yp+5ozCn4T3GlG+Dxr0RYC6PKN/FCnrVjIToioLCogj5a4PgW2oU5OS0p9CkflV4n5Yw0EzvwfHo2XlaKrLDgVCm7RkRLRJZRD83dBGJZnYBNjFnNd+pxXoyMrQtfu5VpP1Cq/pwtrstIlH6Peba4uY31eCc9pj/jzjRqxlxIGgYUz2Ujv+tBq6ZfEMmhAJjVgD/0PV+W20cc09CmzYNGYPUuMNUu5uHGiy4daXK8aHqbenf2ALJmK631+kl68VCvWtLOM0B+yQiofqtRdv3yv4H/YbRDkZiwrTL435p+4Pnr2Btl+5uCI1ZhKmDoHe3wW0zSZcCPosMs1z1wnQjE8kUW4EZamrC2bvZciVmgLV08NhNJZ4sa4JkDE6t/OuUKYfwfnGpyEi8ng4s0P2HsLlpyZDMoYbOpSgwQSTbM9oiIO0sVWbccq5pWlAv3kQSYkz2X53iPg6C5sI7PBhKNMJMZP3NZs9iSYpKCnsUoCaeiwgAaOpYWUpRtUTbZMZ7tAlVZmwZ1fcpC8fCMmecs0qRBtPzAkfPJFC3S/uxrMi4U8W60c/qmtyegGi7O2X/M2BLiwtla4KDiuFFNMjWi0W3Eq5NY2BSpxNl3BQdXuXHiSdFjkFub4FLB018YDc8JK0SjeYQmbqexPui3Gf5xXhkE7Z/udxyQm46X6++Wl9JSCjTywUt3qJmP8ck0yiyc6sUEhuqYHFzT68sjea2m5mKoc5ClIuZsh51+TlOzJQQEThx6VKHBR7uMqZNl2qBtODB/mi2NyWfP17fuaqHZTNt3TdP2+fIw7bZZdYmhiRVEUZeb9mAAVcdlxEsy/YSXYI76igPrgyodfU5dnXxdwAstGUgNWzkI26Xyt5cL2hXPGIonbzeiBfAOONrS6yL4WsUmLtHNJphnbVLonLDmIOni4c6WAbQM170XF7L0WI9gEzC5itt3YR84zT1EKWZkX0=	\N	4pi/Hz9PE/KRViqpJ0NX5KON7+fe6q1Yq+BHhHS/378=	G/8zkmuijqrRP6jz33nTfpeRhyYHPcUhUN9VLr4oGgS0g/JHfPrlR/j61txVRNozBwI=	w+D6T0QOZXnMgaU1vtePn9LseRHsoB5keVdBcRIWMaE=	24	\N	\N
cmrnvmrsd000a01nhqfxkhb30	cmqlsyn9e000301qgk98rcsjh	cmrnvmezr000901nhnhxo4axt	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	"Mano derecha con dolor al movimiento "	SIGNED	2026-07-16 19:04:31.348	cmqlsyn94000201qg8eeqn1c2	2026-07-16 19:03:05.773	2026-07-16 19:04:31.35	Bpb0tExedoUMh2fLo+zgGVaTZFydCmAmh1+9IqGq3hIBtXgKD0SpexmBgBhqHxs6Bw7ZspOSBg==	8vyhRwC5DsAven9Z9QGZbsw4HRk6dr4IY99Oa36fs1KtseSDq5R03oBPBnjmzxsH72rbGge8uPG7SAVnhZiYaTU620q4C8kF+b9H8agU	rYYItA1N4iRQs33OB7mOEr64tcUPfqizI1dv1fUMx70=	T9IBnVekpRiQgKwuEbcXJcmAd9ua1nDcfqh5Xj2IGshDDFNcdmI=	C5me3UDypVm+4rnfaPlfpI9g/bleb4pg19CrwyIyTHU=	3	\N	\N
cmroao6rn000j01qjvoiukq2o	cmqmx6t43000101phgcog0v6o	cmqv73kg8001901qo26o9tzfk	cmqmx6t3y000001phuzs1sirz	\N	\N	\N	\N	\N	DRAFT	\N	\N	2026-07-17 02:04:06.083	2026-07-17 02:04:06.083	\N	\N	\N	\N	\N	0	\N	\N
cmrkscq04006a01p27xdrg8rl	cmqlsyn9e000301qgk98rcsjh	cmrksckaq006901p207fftgs1	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	\N	SIGNED	2026-07-14 15:19:20.695	cmqlsyn94000201qg8eeqn1c2	2026-07-14 15:07:59.524	2026-07-14 15:19:20.696	G9ZHZDKjG7ziKm3AQ6SU26wTJSzniKh49nrF4ePdtolKeERlR8AUQMa5UEOBXNKQ73+otbEpAUNOene4G48TJNJP6WVabEBmC3Ov12I1FSL3Xhql24D+aVnwYZVvZnpUIzvjdVrH4NE/M6RbxZCWn4ukhchuOWikyBH0UlFdaY4L870fhPaJiKlZKDUT8QhkvyIwVABbqJ7iHv0C+F69YBuDK3B9eu1DWpQP4X2Wp1wCQmFsI+8eB2KDgLMl816KSODpj9AXvlkMygyTbLss/y48LcJaQhKPf78bb1nGBWWQX13+yTbLhTzYmkTm2QvIxfJyOBPkkvSrMSzocrq9HDlQjDXurlz0JvrkHn7OlqbeielM+t7gmYEyjuDQBPBZnxT1E+dcB9NrawtcQ8Fh0ir2tkT6djCdxwZh9BQNFeAdoqU17sqKIF4n5tWKUqLx/eFSEQYJ+FYwCR+QDORnKaEszCvemuqD6fyJ/vFMoTXSyh3WchXR3SijnVebKduA1HdYkr+fNdbREDB/9w9RvS8nsM9u5bU25nBxWK1M2k/7TYKlk1i85RjZGDkCJg5R/EKEYLfwZxCA3wYJ0Rg0wzpUdFxq62EWSkzonHCQcPg5EzUoEWp9RVCXPlkKeFKzmFq4X+GCyC6nvoX8ZyaPsuw+yjCTJ2cCLEh473N9ALKLea2OfyjvD0m2R5D75RLM+BxC4Hvq2gNPc0Thc90ec1X+WdKhH1d78AbkAH7aGDCuEUDbdUUWIjQcIt8uvyg+lCn6mTGnB9jfMo5v3jHc7aIKhNgQIexB4TKH9PeeupDFqTikxckXgddakLpR+orIrFcTgZub//YtQMFQZ2hs3wDpjSWzmZgUfb3qWF8ewIKgDb4dH4Mzt3ys8v2yzwpHfm+R1RXC8C4plMf46xZZeRuyzkY6QmsprPtfkYUtXc9o000kHUn+hJVagDvZKHj4Zcl9swh/IiLUBDRy5reWNhRx/UOBgNT1k0oFt1FxtvptXOGyc1IlEB2jihb31ckohv6gwGh62F1cWKjZclekUZlp4drUdnUMGDG0POKjT9uy+GnzTYpVNY2ny9ln6BBNdCtQDgx3vMSFiA+SjdLlice5BKEaqFGdT2gsRhGOfAyypfYUtiTDFZcaW4hXrZNK3ostNo2MEBpXi8LPh/nl1xGbEZsp9M4mpppdngFrO7u4/ZDlsIRM9Mvsh3n8n1TUJ2YOGx1niSQk	\N	e2zB5dM8EDQPwLdWWn8y6V6G5WktySvGJHBnE1iWCA0=	+0eFhZpAvKxl8Jo/85WYDIirj/CLEiCEUF1hVTsryZEwORcqpiG+J6X66LiucoYkN88=	w+D6T0QOZXnMgaU1vtePn9LseRHsoB5keVdBcRIWMaE=	23	\N	\N
cmroao76x000l01qjs7x0pkrr	cmqmx6t43000101phgcog0v6o	cmqv73kg8001901qo26o9tzfk	cmqmx6t3y000001phuzs1sirz	\N	\N	\N	\N	\N	DRAFT	\N	\N	2026-07-17 02:04:06.633	2026-07-17 02:04:06.633	\N	\N	\N	\N	\N	0	\N	\N
cmroaoa0y000v01qj7720hsct	cmqmx6t43000101phgcog0v6o	cmqv73kg8001901qo26o9tzfk	cmqmx6t3y000001phuzs1sirz	\N	\N	\N	\N	\N	DRAFT	\N	\N	2026-07-17 02:04:10.306	2026-07-17 02:04:10.306	\N	\N	\N	\N	\N	0	\N	\N
cmroaoaiu000x01qj82g9ez2s	cmqmx6t43000101phgcog0v6o	cmqv73kg8001901qo26o9tzfk	cmqmx6t3y000001phuzs1sirz	\N	\N	\N	\N	\N	DRAFT	\N	\N	2026-07-17 02:04:10.95	2026-07-17 02:04:10.95	\N	\N	\N	\N	\N	0	\N	\N
cmrnkzdv5000401lycs6k93t5	cmqlsyn9e000301qgk98rcsjh	cmr7yg1w8000f01mpyn3ufito	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	"Paciente en buenas condiciones generales, hemodinamicamente estable.\\nRodilla derecha: se evidencia valgo moderado, dolor en región inserción de  Cepillado Articular  + , choque rotuliano   -, signo de herradura   -, Zohlen  + , McMurray   -, Lachman   -, Lelli test   -, Cajón Anterior  , Cajón Posterior  -, Bostezo Medial  -, Bostezo Lateral   -."	SIGNED	2026-07-16 14:18:32.201	cmqlsyn94000201qg8eeqn1c2	2026-07-16 14:04:58.481	2026-07-16 14:18:32.202	2/8ze3MURpCsk8fKh0Z/SXH4d+BrGeUkBaPlgtqpf7ENfvaG9OhYUPnDPXf7rTby8zptcVkEgfDo81US4gR7YvcVS2noH068Yf9twIgxJz8u2q7lw9tEGIEV/8zsrnP50crSPQ1tFYKvesieq7A+l58QqpKN/qY1+aeluAqIn/aOqhw1qE2bwVBQGopwTMWooEbosp8KkV30GMGWdebUr8DySBuW9IjyDJOajvuBgh8eppJUMN/+b6kudi6LM9uopFEBd355qWEidbDLXeBkee1OqG/7nIe/8+A33GJu4YVKRR/7KL0q3ntBF4HEPasjY0Vy4Oy7mvO/M6jz1iNPHzkl5+V2w1wurcJiNrKYV7Ub6NMam9LbdN2Qo9RBHRMhtKZ5MRLnpNSVrRd6IC7fzDUjsQFAha3jUIVKzmm75t4sL6WBt/U9pglt554c//5eoL9SCtQE/C5pbRYjmpcPHRzaUBBBLHGzRKkR6dYXtkpTajLMpLajiVSSpA==	MZmgWWZyunrlHyrh4vjPTTp+aXhSGY/E2WOocjFgfEigalT1mGrvs0MpVa+BLwUXaKGqI/XDRSx7UQlaMxRPUwwLpsAq8ugYZdEhBz+XaFQAYixQEI7R9oPBcaDEZfot4vz/F2wrESeG1A26injysHl2HDYkU+7BIrt8Yj4yMcmb1egH1hnzsaI+mMiBVWDuxrNtnGzPLszS1+nqaSXg/BJyjgalI/N+ROvberDZINtU+2coiUSTieB/WlIV5ScPBjFI0nGBSX8+TvbwnTMDssvElXSEyQQvt+88/SzObuQNocOCZ6WwPFnr7SoLzbR/TVksLMe1kVXahrTGZI1TmRVJfCE=	qrP/i+jbCTBqO3b57veMlyRdp1y0CjnwsetJTLhBwKI=	RFUJMOjkPA6A2DzGHc3Rut9CxuQbw7P9TPAzWErOaP246BX4pqhd8B6fh3p5zP6C9K/RkQ==	D8x6zRwTOrq00JtFhDfq2FsOGL/mPWMxeR0nSc/Cz2M=	43	\N	\N
cmroao7qz000n01qj11nvegns	cmqmx6t43000101phgcog0v6o	cmqv73kg8001901qo26o9tzfk	cmqmx6t3y000001phuzs1sirz	\N	\N	\N	\N	\N	DRAFT	\N	\N	2026-07-17 02:04:07.355	2026-07-17 02:04:07.355	\N	\N	\N	\N	\N	0	\N	\N
cmroao8k2000p01qjzavkj7bd	cmqmx6t43000101phgcog0v6o	cmqv73kg8001901qo26o9tzfk	cmqmx6t3y000001phuzs1sirz	\N	\N	\N	\N	\N	DRAFT	\N	\N	2026-07-17 02:04:08.402	2026-07-17 02:04:08.402	\N	\N	\N	\N	\N	0	\N	\N
cmroaob7q001101qjt4bye4fr	cmqmx6t43000101phgcog0v6o	cmqv73kg8001901qo26o9tzfk	cmqmx6t3y000001phuzs1sirz	\N	\N	\N	\N	\N	DRAFT	\N	\N	2026-07-17 02:04:11.846	2026-07-17 02:04:11.846	\N	\N	\N	\N	\N	0	\N	\N
cmroao94q000r01qjpb1there	cmqmx6t43000101phgcog0v6o	cmqv73kg8001901qo26o9tzfk	cmqmx6t3y000001phuzs1sirz	\N	\N	\N	\N	\N	DRAFT	\N	\N	2026-07-17 02:04:09.146	2026-07-17 02:04:09.146	\N	\N	\N	\N	\N	0	\N	\N
cmroao9fa000t01qjs7931o94	cmqmx6t43000101phgcog0v6o	cmqv73kg8001901qo26o9tzfk	cmqmx6t3y000001phuzs1sirz	\N	\N	\N	\N	\N	DRAFT	\N	\N	2026-07-17 02:04:09.526	2026-07-17 02:04:09.526	\N	\N	\N	\N	\N	0	\N	\N
cmroaobko001301qj17gg65pe	cmqmx6t43000101phgcog0v6o	cmqv73kg8001901qo26o9tzfk	cmqmx6t3y000001phuzs1sirz	\N	\N	\N	\N	\N	DRAFT	\N	\N	2026-07-17 02:04:12.312	2026-07-17 02:04:12.312	\N	\N	\N	\N	\N	0	\N	\N
cmroaoc23001701qjmel7u4k0	cmqmx6t43000101phgcog0v6o	cmqv73kg8001901qo26o9tzfk	cmqmx6t3y000001phuzs1sirz	\N	\N	\N	\N	\N	DRAFT	\N	\N	2026-07-17 02:04:12.939	2026-07-17 02:04:12.939	\N	\N	\N	\N	\N	0	\N	\N
cmroaoaxw000z01qjr2ik9ovo	cmqmx6t43000101phgcog0v6o	cmqv73kg8001901qo26o9tzfk	cmqmx6t3y000001phuzs1sirz	\N	\N	\N	\N	\N	DRAFT	\N	\N	2026-07-17 02:04:11.492	2026-07-17 02:04:11.492	\N	\N	\N	\N	\N	0	\N	\N
cmrmxqh83000301l4r0h0ptoh	cmqlsyn9e000301qgk98rcsjh	cmrmxq8ka000201l47pf9hqql	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	"paciente en buenas condiciones generales, hemodinamicamente estable\\nmuñeca derecha: dolor de fuerte intensidad a la palpación, deformidad con angulación dorsal, limitación funcional. signos de equimosis."	SIGNED	2026-07-16 03:26:56.295	cmqlsyn94000201qg8eeqn1c2	2026-07-16 03:14:11.763	2026-07-16 03:26:56.296	50FsLFu5ORQNSDUJieGBGmsQ0ecTYynCgKfb+j7B8ZpDlC5OrzVVnAHtzB8VEho+xct5z9PXjvYPPg//rCIxL0odTa7hxX41DYvchHsSpsRRHfZpYRUqaPSkITY5r0h5SUiOvUqmWbsICQIBcjSOf7Qbc6LnhlaIOAnoe1VfeFsm3+G1uoZDCDwEbnoYNRTleTzbyM94g1tVaWB60ttqX85nJT2QVJxwZ8ywq8QIhPjjUQYqFAhS7T17PGuG/+KZhKajezizcAznJi2l4e3bapkySdAWN97AxsZm0Ou+ZUA8pFd6JTIWsNEqAuQbFz2gB1/ZqpNCZB6WGoi5BPWbycuV4TOFDTDhFycaO7/cIs43x+6rs97ock6lZwZOb/sGulmerWRpPF71Eua4RCkLX5k5vWDdpPz5fnmNf2Ym9oXt9rDw5G8Y1SXHWKaLzv0QR3v8wmw1sUh/2AYKWaY8237M5kDUQ3lOJtFJMCdbCe/N	jKQk7cn3sKIzCt6eyAs5zUX1lipKyKyIo8/rfKbJw8Zm7h6HuonGa7VXB76t/lxohhbU2xXwyv3EtRSW4nOFryhrGBG/3Myg5+OMKwWIpTna4E3+5o7zcJUVV87Zgvc2td8zHPwP79vc00s444I3GAatgU4S0ejJRE5f3su0xJ/7u3zhNAqkNqUg0mlkYdCwwhaOK0QmOJA8ieEOOICHij2IwrO8oFkrhfXV6HdGUNVHpUJz441deNBQcLG2dClKuLB+NOojXZentLjkw6OL8kHmfupZDhSac04qBWXrnygmuq5tmJvQh7yaB6nh7+ghBFa99/WI2ex6yCQteEwaRkgcYRRomOScwZFaNU/WmTd1CzUGBBXYKV2e8r/0I5K61RBjtkPWjBjoCKZ9tEDDWA8A7/yA8bWONLIssjzX3XbYqw5/Ao2I3i92b2e9KKXJzgckIwufhChwMEMEXIytjmHx1T0CHAWjp9dM	4YpYPvfZ6hwpIe+CsDxZ7hKZdlgt36+xpJLTszls/uI=	tcnEYd9OUPkUGzotFN9L8Ebem1p1srQaB7MwtN1gQ30eTx0TYN9P0J/NLRuo0/hlZdmmSFdftWohTQ==	wXKDWotI0xmmG7zAJAGj1n1GwHPNhKhM6WMMdgX6EiQ=	51	\N	\N
cmroaobtb001501qjon1hm2gm	cmqmx6t43000101phgcog0v6o	cmqv73kg8001901qo26o9tzfk	cmqmx6t3y000001phuzs1sirz	\N	\N	\N	\N	\N	DRAFT	\N	\N	2026-07-17 02:04:12.623	2026-07-17 02:04:12.623	\N	\N	\N	\N	\N	0	\N	\N
cmrmyi1yv000301qkbohrm1tb	cmqlsyn9e000301qgk98rcsjh	cmrmyhl95000201qk048pvbah	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	\N	DRAFT	2026-07-16 03:36:06.884	cmqlsyn94000201qg8eeqn1c2	2026-07-16 03:35:38.359	2026-07-16 03:36:23.869	\N	\N	FFVHSLYlT0OL45RaupJ73BJpIgnbmppaPLyRBe5x6hw=	\N	\N	0	\N	\N
cmrm7xdp4000201le36m2u7h3	cmqlsyn9e000301qgk98rcsjh	cmrm7x1l6000101le9hkh0ivo	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	\N	SIGNED	2026-07-16 14:44:17.131	cmqlsyn94000201qg8eeqn1c2	2026-07-15 15:11:43.768	2026-07-16 14:44:17.133	f6h/wZuLf5f8mIxHT4fnJUWncSdKif75HW1ZyT9vxMbjCc2bP3RA55TCJ2ushy9wCMwRkZhLNKB+9vNgKJpiWt9qPb9unEArHUsF3v9p4U6lio3pFhl+6orloYbclqYSg4X/xE7fZvPkyAnx9Ya3jbRQVKp1BTvKkv65WkIWFg+PgoecijHLW3PH+bk1zEn3f54BneqeHKPKi8eWnIyKpUYqq28mwlVY3a/n9nMhsvVSsoTnTwCHkLJxiRIfnns9quUxjJs9PX+GH4KJdPn5lwGJ8+eNiFTn8Qb0kLp76Vff7dN1Bd9vazctc8QKz/Anu9pQ5p5L9e1HnjS4BbCJRmiAqiD+bmWLtJTnV4rV6kJkX3w8j86ugUMeCCG8D8WhknBj6UTzion/ecaeGY5DlSrZd2XJOqmOsx/qqrFkY/BnqVkotOUQmwIO4Efy5sTWraxb6BuhtLU+jGQJnHRpJ5bu0wpMsn2NRmFb+dZE/5IJuV0s3MdOUAcYvygB+RXLPcawiBn8yBk6YWGYrBRnRpx59qL1Pcz6hTGDivDI8oFCrmTlf0zqiX+JYqc/mDODxoX9+uIA80sVQFj5pMRRtzUP4Fbq618KTdx9GCtOfmKjVj6JDKXt57f6su1H5MnJOoMlQUf+o3N1qR7iyMHMMGq78wpmA3K52gJ45yvJAgO897A0yie7USWm56E5LnaCkzc7ekNLeIQvTQ==	hCqvFAG6LaZdHt/lACcqeB36243E8vIm/PEEymWueqyux6SSzrSHt3o8X1pNclazvCbZMyOzHbo7tYu6UVq9Z4WVPpxMrnUbEEl9wgBNsxzhD6kfvB9njaiwc/HRIA7rnHrHBBny2CZBcTsyoUr1kdFaqUsKpBQdDu95pGTc9urFnCr54vZywLhi9J+xckt5yMCu8N5VGm92T/hVguwkV0PZK4T4W+VSVsF88+Gh9tMOKOaLCLRQPkJdKdIcXj6y3TpSN9JFIq78S+NuVC1ULrZ7cyIPv0audCJjvAjTaHA0LZycCRyzB+kFuFW9u+vf2tJOrAgPv1H33xepjlirrzk6hDGHg4kjqtvbMv+zjYhvr6Ik92A60D1YAerU7eDFNO2wuDxs10UtU/dArvcF75Rs7pdFDwdj6g8qyNBTwI3nWxzsqjNLEsp7lU/MJrowtxii7wrXaN+vV9YlZcVGhRoISAG3NjSffIVBH2IRZDCsQwM4Ky39HMPFuW9qr9xZ7+LzXAwpRUeynQhTrdP9LtP22DtuqtG5xbcpKpxprwnuL1hWHZqxp0hon0klSytfyF6qPOyV2bjng1uvek/Itm52rCK/NnGHZWbT84McM3ceMrBwYD4Y/czkWBp+fVF2waI1jNQ77n1JxLubUzwMYP3zhh930yQs6+A3Aour6scQAqURjwj4HmXjd1KjXVHeJckgOE8ugiVslp4=	x6FARLjRBr09iPT5K6rqHYSu1k+wIZ326sOvD3iylns=	2q1+A6WJRvialilfcxSIiVtecH0dD7C7mGOLHMRA9kSSJZfcRbF3+y1JiJqfq6I3QKp/mKnWxerZ	1ZQO78Fm+0j1GTkP0DJ7dzClSF4bWQC4xBvuDU8kFso=	31	["subjetivo", "analisis", "plan", "examen"]	\N
cmrnn6us3000o01nslj0cqok8	cmqlsyn9e000301qgk98rcsjh	cmrnn6o6r000n01nsjdj83ngo	cmqlsyn94000201qg8eeqn1c2	\N	\N	\N	\N	"paciente en regulares condiciones generales, hemodinamicamente estable.\\nse evidencia dificultad acentuada a la marcha, notoria perdida de masa muscular corporal en miembros superiores e inferiores, postura inadecuada al sentarse y la marcha, rangos articulares disminuidos en ambas rodillas, pulsos presentes, sensibilidad conservada"	SIGNED	2026-07-16 15:20:43.787	cmqlsyn94000201qg8eeqn1c2	2026-07-16 15:06:46.227	2026-07-16 15:20:43.79	MMY6c6MuN6MN3BQKOJXMsKxUbmEJje1Qvmn2umZ+7KrutstSg1SjXE5TKr5/QfdnS/k1txxCYj1boJnERdhi0jH+vyFe10lq8d5vJ21Dl9iaPUZOe0Kfnzfi2eYl9Pnr51QS2fi+17UWePWPE0GuLKyRQSBVuQhocA4dDsasswjsdynUfspxmCcegzPIcQmzfmNj8he8oTkiI7f6x6zFr1ozmT1EfUQxcJjW+E5zPcK1i/LatHuVrba3IjFOxFXF+dA4TqseWu4lUxXSa1Q56E6cgWv0fj3qBkaeJ4M1tV31neJ1MBXiAN2nkFveMDv+qy32dOw9T77jGlpJDb8ztFEcpfEzn5V9dZynfj8EsZ2EdX1BLVz7Upqu3Zdr9p40kUfXi+ohShNPkH7wNYSsACnrBElU1M1qLJDFHaxW97/gapk4/P/LndbSj6OMw3JRptv+gPyvWYF16pRN6s5FQE3kAsMgM+QK8M0R9ANtuxdaRXfviWsmTI4Z5HIm1H4dVGsWXdPUmE/Xy/TfgN4bV+hdW4HKuLfagxEQUwD6IQiGf/VmsXTKlU2Jc2EKY75wB/SpHLfIc6CqsD/xBivFWtfzLUybYDNts5Af9Q+jEtotMoLOpvUqSS2vh02WzLNoXXey1rWFq2wutdVCE6oegCXdwJxtZ8nWRfrcVV3h979AVB4JTn76rRJtUNhrBEiqgoE0DVJj0UuKX6Z6/LTPJ3TS4KgReqpvWTYPXShmWYGznJFAcajrdhe+jwWIwMhoCX42uLdLhRoApU11gA9MBbMhasfID/B4DU3Pr63eybsZdd1xjB0DeCxO9x308gcQWmb8PATye7ZgUrw3	0uHytGHfnYduwEGtHJ8C3wL8bWfm5cqFMLnhY06c5qz3Q9nSxUnZyZL6WgsKzaqXiw397qthHjj+yjMgC4ZzZShTXs+zI9KGUbcK9rPLoIT8jiBk45Wtea/oZoQb1X9/rrCLcQee3RzmTvMgiYh7HdPYP+Y6yq1u7visGDYshEzuKxMyVdQoW1gCpH+02+R7k9gbudmsA4q0526lQ5z06PUGVo/xpBVIkhKsVLi8/0FOIQJQl89/FRsIr5/e0W1B4XJYaUOd1rxUDFS1WDo1KkpHaNj/9KL1lm0idJVhUKJ41bEgQu1yLbhVIPo70cczBCm9wEEidqA8mDxSb8GyuhSaN6bWjz3TUUknc75OO9vJj/lpbOuAyh1RBy3kNpuNxnZYDoWvfZf+VndfRmCOyZo50llBasIdABEdUiOdJLc2cDDX75O5XOkjB5AjsDaZsRCttrfFM/hwhnv9YFcSJn1DAIuqxWhGZWNerihZJ/eEwVJWoCY70WBPxbF2CZhIZSAh22BtPqwLZe5F7vysJ2rhjmB68ZZtjn9UNvDCkA==	NcEqY1b0RSH5U13FkXGdYPmXX0VQ0qS/DRTv1dNFMPM=	tnbb4QsphyHEc3cT+3MZGnLQ8FGx+3AEEM9m5fKAp7ZqN2sWDBvpfZJzWzUWblrEFRI=	3hQqnCGJ6Ink2aOT1ZCImrBt3zkfT1M6g5Fqj5CvR9g=	40	\N	\N
\.


--
-- Data for Name: EncounterScale; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."EncounterScale" (id, "encounterId", tipo, valores, puntuacion, "createdAt") FROM stdin;
\.


--
-- Data for Name: EncounterTemplate; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."EncounterTemplate" (id, "workspaceId", nombre, descripcion, motivo, "historiaClinica", plan, "createdAt", especialidad, "datosEspecialidad", "examenFisico") FROM stdin;
cmrnjvrrn000301op88c4g7oi	cmqlsyn9e000301qgk98rcsjh	Rodilla	Plantilla Rodilla	dolor en codo	Se trata de paciente de XX años de edad, dextromano / Levomano, natural y procedente de XXXXXXXX, de ocupación XXXXXX, quien refiere inicio de enfermedad actual hace XXXXXXXX, cuando posterior a caida de XXXXXXXX presenta dolor de fuerte intensidad aumento de volumen y limitacion funcional de rodilla XXXXXXXXX razon por la cual acude a consulta m'dica.	tratamiento medico sintomatico\nrx de codo izquierdo\nreevauacion al tener etudios de imagen	2026-07-16 13:34:10.259	Traumatología	null	"Paciente en buenas condiciones generales, hemodinamicamente estable.\\nRodilla XXXXXXX: Cepillado Articular  + / -, choque rotuliano  + / -, signo de herradura  + / -, Zohlen  + / -, McMurray  + / -, Lachman  + / -, Lelli test  + / -, Cajon Anterior  + / -, Cajon Posterior  + / -, Bostezo Medial  + / -, Bostezo Lateral  + / -."
cmrnqoffn000101np1ovgh3l6	cmqlsyn9e000301qgk98rcsjh	Hombro	Consulta de hombro	dolor en hombro	Se trata de paciente     de    años de edad, dextromano, de ocupacion  , sin antecedentes patologicos de base quien refiere inicio de enfermedad actual posterior a   presentando dolor de   intensidad, aumento de volumen y limitacion funcional de hombro  , razon por la cual acude a consulta medica el dia de hoy	\N	2026-07-16 16:44:24.995	Traumatología	null	"paciente en buenas condiciones generales afebril, hemodinamicamente estable\\nhombro : rangos de movilidad conservados, sin puntos dolorosos\\nbíceps: Speed test  , Yergason test  , Snap test\\nImpingement: Neer Test  , Hawkings-Kennedy test \\nInestabilidad: Cajón anterior , cajón posterior  , test de aprehensión  , sulcus test\\nManguito: Full can test  , Empty can test  . Patte test , Drop Sign , belly press, lift of test\\n Slap: O´brien test , Crank Test \\n\\n "
\.


--
-- Data for Name: ExpressOrder; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."ExpressOrder" (id, tipo, "pacienteNombre", "pacienteApellido", "pacienteCedula", "pacienteEdad", "pacienteSexo", items, diagnosticos, indicaciones, "createdAt", "workspaceId") FROM stdin;
cmrmzajf4000601o7q6vfoaqx	IMAGEN	adriana	sanchez	21136615	34	FEMENINO	[{"notas": "ap y lateral ", "region": "mano derecha ", "tipoImagen": "radiografia"}]	traumatismo en muñeca	\N	2026-07-16 03:57:47.344	cmqlsyn9e000301qgk98rcsjh
cmrmzdu9w000701o79er94cnu	LABORATORIO	Nurmis	Pierluissis	3852714	67	FEMENINO	[{"notas": "", "estudio": "Hematología completa"}]	Anemia	\N	2026-07-16 04:00:21.38	cmqlsyn9e000301qgk98rcsjh
\.


--
-- Data for Name: ImagingOrder; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."ImagingOrder" (id, "encounterId", "tipoImagen", region, "indicacionesClinicas", urgente, "pdfUrl", "resultadoUrl", "resultadoNotas", "createdAt") FROM stdin;
cmqn1lek1000101osd10hpn6z	cmqn171fv000001osjsmk3btl	Radiografía	Rx de rodilla derecha 	AP y lateral	f	/uploads/imaging-orders/cmqn1lek1000101osd10hpn6z.pdf	\N	\N	2026-06-21 00:22:31.153
cmqv6ic8z000w01qolgkr64qz	cmqv64uh4000h01qoayzpywm8	Radiografía	Rx de rodilla derecha 	AP y lateral 	f	\N	\N	\N	2026-06-26 17:02:15.683
cmqv6iqbh000y01qogk9i146p	cmqv64uh4000h01qoayzpywm8	RMN	Rodilla derecha	\N	f	\N	\N	\N	2026-06-26 17:02:33.917
cmr02tdjz001c01mu7rhoq7bv	cmr020v9j000g01mub1fw5j0k	Radiografía	Rx de rodilla 	\N	f	\N	\N	\N	2026-06-30 03:17:43.007
cmr3lvupt000t01mv8aopd20a	cmr3l4g3c000501mvsaxou3mo	Radiografía	mano derecha 	\N	f	\N	\N	\N	2026-07-02 14:34:49.793
cmr3ocz67003001mvn1opvs9k	cmr3o2wjj002t01mvnvh8ul2p	Radiografía	mano derecha 	\N	f	\N	\N	\N	2026-07-02 15:44:07.951
cmr7yl8q7000u01mpw23elezy	cmr7ygjy9000g01mpw0hcawcx	TAC	Abdominoñelvica	\N	f	\N	\N	\N	2026-07-05 15:41:34.447
cmr9l9qum002401mp4kxb054m	cmr9ixxhn001e01mpvrepgcnz	Radiografía	rx de torax 	\N	f	\N	\N	\N	2026-07-06 19:04:15.406
cmrdpzpx6001401p8ob7o4lf8	cmrdoeaj1000201p855pyvef0	RMN	hombro derecho	\N	f	\N	\N	\N	2026-07-09 16:27:30.426
cmrgl6kvk000r01p2ucyv6ahx	cmrgkyi1g000201p2tvci3n5w	Radiografía	rx de tobillo derecho 	\N	f	\N	\N	\N	2026-07-11 16:36:10.928
cmrglx8q0001y01p2zj3x2ul4	cmrglvj5n001m01p21wtrk2mc	Densitometría	DDASDAS	\N	f	\N	\N	\N	2026-07-11 16:56:54.889
cmrknq7ma003a01p2520clxey	cmrknjvrf003101p21rhx626p	Radiografía	rx muñeca izquierda 	\N	f	\N	\N	\N	2026-07-14 12:58:30.802
cmrkps3fc005y01p29xqhwbyo	cmrkp9qnw005h01p22ngivvx3	RMN	lumbo sacra 	\N	f	\N	\N	\N	2026-07-14 13:55:57.912
cmrksndri008d01p2eammj6l5	cmrkscq04006a01p27xdrg8rl	RMN	cervical 	\N	f	\N	\N	\N	2026-07-14 15:16:16.878
cmrm8q1oq001u01lexa648hq4	cmrm7xdp4000201le36m2u7h3	Radiografía	Rx mano izquierda	\N	f	\N	\N	\N	2026-07-15 15:34:01.226
cmrmd5had005s01lej67znlsd	cmr4heozi000001o49o8vbyfv	Radiografía	Muñeca izquierda	\N	t	\N	\N	\N	2026-07-15 17:37:59.749
cmrmy6tpr001y01l4m7cr39lu	cmrmxqh83000301l4r0h0ptoh	Radiografía	rx de muñeca derecha	\N	f	\N	\N	\N	2026-07-16 03:26:54.447
cmrmyj74x000c01qk89u0djn4	cmrmyi1yv000301qkbohrm1tb	RMN	Columna cervical	\N	f	\N	\N	\N	2026-07-16 03:36:31.713
cmrnleyc3001401lysfigc7bj	cmrnkzdv5000401lycs6k93t5	Radiografía	rx de pelvis simetrica	\N	f	\N	\N	\N	2026-07-16 14:17:04.851
\.


--
-- Data for Name: ImagingOrderItem; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."ImagingOrderItem" (id, "imagingOrderId", "tipoImagen", region, notas, orden, "createdAt") FROM stdin;
43ac8154-ae51-482b-91f5-0e46bb1dfe9d	cmqn1lek1000101osd10hpn6z	Radiografía	Rx de rodilla derecha 	\N	0	2026-06-21 00:22:31.153
f28507e0-789e-4cf9-8628-28ddb5c774ab	cmqv6ic8z000w01qolgkr64qz	Radiografía	Rx de rodilla derecha 	\N	0	2026-06-26 17:02:15.683
b7a9a7b7-f2a8-4c62-a7ce-fdf07f541d25	cmqv6iqbh000y01qogk9i146p	RMN	Rodilla derecha	\N	0	2026-06-26 17:02:33.917
cmr02tdk6001d01mu5djv03vz	cmr02tdjz001c01mu7rhoq7bv	Radiografía	Rx de rodilla 	AP y lateral	0	2026-06-30 03:17:43.007
cmr02tdk6001e01mu229yig2c	cmr02tdjz001c01mu7rhoq7bv	RMN	De rodilla izquierda 	\N	1	2026-06-30 03:17:43.007
cmr3lvupw000u01mv8p9e5dtj	cmr3lvupt000t01mv8aopd20a	Radiografía	mano derecha 	ap y oblicua	0	2026-07-02 14:34:49.793
cmr3ocz6d003101mvm72giwh3	cmr3ocz67003001mvn1opvs9k	Radiografía	mano derecha 	ap y oblicua	0	2026-07-02 15:44:07.951
cmr7yl8qb000v01mpx2dzxpx9	cmr7yl8q7000u01mpw23elezy	TAC	Abdominoñelvica	\N	0	2026-07-05 15:41:34.447
cmr9l9qup002501mpond5ajeq	cmr9l9qum002401mp4kxb054m	Radiografía	rx de torax 	PA	0	2026-07-06 19:04:15.406
cmrdpzpxb001501p8i9xutld0	cmrdpzpx6001401p8ob7o4lf8	RMN	hombro derecho	\N	0	2026-07-09 16:27:30.426
cmrdpzpxb001601p8q1eod89x	cmrdpzpx6001401p8ob7o4lf8	Radiografía	hombro derecho 	ap, ap en rot interna y externa, axial	1	2026-07-09 16:27:30.426
cmrgl6kvp000s01p2a8zr1n4d	cmrgl6kvk000r01p2ucyv6ahx	Radiografía	rx de tobillo derecho 	ap y lateral	0	2026-07-11 16:36:10.928
cmrglx8q3001z01p2muwegvz5	cmrglx8q0001y01p2zj3x2ul4	Densitometría	DDASDAS	DASDASD	0	2026-07-11 16:56:54.889
cmrknq7md003b01p22058ch4f	cmrknq7ma003a01p2520clxey	Radiografía	rx muñeca izquierda 	ap y lateral	0	2026-07-14 12:58:30.802
cmrkps3ff005z01p21nigcort	cmrkps3fc005y01p29xqhwbyo	RMN	lumbo sacra 	\N	0	2026-07-14 13:55:57.912
cmrksndrm008e01p2s74wgsy5	cmrksndri008d01p2eammj6l5	RMN	cervical 	\N	0	2026-07-14 15:16:16.878
cmrksndrm008f01p26kvsxb1m	cmrksndri008d01p2eammj6l5	RMN	lumbo sacra	\N	1	2026-07-14 15:16:16.878
cmrm8q1ov001v01ledfe9r7mf	cmrm8q1oq001u01lexa648hq4	Radiografía	Rx mano izquierda	AP y oblicua	0	2026-07-15 15:34:01.226
cmrmd5hah005t01leg1ek7nrj	cmrmd5had005s01lej67znlsd	Radiografía	Muñeca izquierda	Ap y lateral	0	2026-07-15 17:37:59.749
cmrmy6tpu001z01l468irz55o	cmrmy6tpr001y01l4m7cr39lu	Radiografía	rx de muñeca derecha	ap y lateral	0	2026-07-16 03:26:54.447
cmrmyj750000d01qkmpop319f	cmrmyj74x000c01qk89u0djn4	RMN	Columna cervical	Sin contraste	0	2026-07-16 03:36:31.713
cmrnleycm001501ly4puba9lk	cmrnleyc3001401lysfigc7bj	Radiografía	rx de pelvis simetrica	\N	0	2026-07-16 14:17:04.851
cmrnleycm001601lypa6zkf32	cmrnleyc3001401lysfigc7bj	Radiografía	rx de rodilla derecha 	ap y lateral	1	2026-07-16 14:17:04.851
cmrnleycm001701lypysa22n5	cmrnleyc3001401lysfigc7bj	RMN	rodilla derecha 	\N	2	2026-07-16 14:17:04.851
\.


--
-- Data for Name: InsuranceProvider; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."InsuranceProvider" (id, "workspaceId", nombre, codigo, telefono, email, activo, "createdAt") FROM stdin;
cmrngej3d000001pj70g3askr	cmqva532b000201p39eq8lpiq	Mercantil Seguros	MERCANTIL	\N	\N	t	2026-07-16 11:56:47.017
cmrngej3d000101pj0q0m57en	cmqva532b000201p39eq8lpiq	Seguros Caracas	CARACAS	\N	\N	t	2026-07-16 11:56:47.017
cmrngej3d000201pj4n5ngifr	cmqva532b000201p39eq8lpiq	Mapfre Venezuela	MAPFRE	\N	\N	t	2026-07-16 11:56:47.017
cmrngej3d000301pjuagg5nkl	cmqva532b000201p39eq8lpiq	Banesco Seguros	BANESCO	\N	\N	t	2026-07-16 11:56:47.017
cmrngej3d000401pjlsu4fwai	cmqva532b000201p39eq8lpiq	Seguros Pirámide	PIRAMIDE	\N	\N	t	2026-07-16 11:56:47.017
cmrngej3d000501pjy89xyhz4	cmqva532b000201p39eq8lpiq	Seguros Constitución	CONSTITUCION	\N	\N	t	2026-07-16 11:56:47.017
cmrngej3d000601pjjcf0dv92	cmqva532b000201p39eq8lpiq	La Occidental de Seguros	OCCIDENTAL	\N	\N	t	2026-07-16 11:56:47.017
cmrngej3d000701pjaemsl8ka	cmqva532b000201p39eq8lpiq	Seguros Horizonte	HORIZONTE	\N	\N	t	2026-07-16 11:56:47.017
cmrngej3d000801pjt3emcmwd	cmqva532b000201p39eq8lpiq	Seguros Altamira	ALTAMIRA	\N	\N	t	2026-07-16 11:56:47.017
cmrngej3d000901pj1kzi3wdg	cmqva532b000201p39eq8lpiq	Hispana de Seguros	HISPANA	\N	\N	t	2026-07-16 11:56:47.017
cmrnhh02m000001s7i8kmk6zj	cmqlsyn9e000301qgk98rcsjh	Mercantil Seguros	MERCANTIL	\N	\N	t	2026-07-16 12:26:41.95
cmrnhh02m000101s7kqzdbw4i	cmqlsyn9e000301qgk98rcsjh	Seguros Caracas	CARACAS	\N	\N	t	2026-07-16 12:26:41.95
cmrnhh02m000201s72zra8mu3	cmqlsyn9e000301qgk98rcsjh	Mapfre Venezuela	MAPFRE	\N	\N	t	2026-07-16 12:26:41.95
cmrnhh02m000301s7lik2x5ev	cmqlsyn9e000301qgk98rcsjh	Banesco Seguros	BANESCO	\N	\N	t	2026-07-16 12:26:41.95
cmrnhh02m000401s7ygknowdj	cmqlsyn9e000301qgk98rcsjh	Seguros Pirámide	PIRAMIDE	\N	\N	t	2026-07-16 12:26:41.95
cmrnhh02m000501s7c5j9ltdm	cmqlsyn9e000301qgk98rcsjh	Seguros Constitución	CONSTITUCION	\N	\N	t	2026-07-16 12:26:41.95
cmrnhh02m000601s7hkwue7en	cmqlsyn9e000301qgk98rcsjh	La Occidental de Seguros	OCCIDENTAL	\N	\N	t	2026-07-16 12:26:41.95
cmrnhh02m000701s76k5qszw0	cmqlsyn9e000301qgk98rcsjh	Seguros Horizonte	HORIZONTE	\N	\N	t	2026-07-16 12:26:41.95
cmrnhh02m000801s7n8961ejw	cmqlsyn9e000301qgk98rcsjh	Seguros Altamira	ALTAMIRA	\N	\N	t	2026-07-16 12:26:41.95
cmrnhh02m000901s75yfxapmr	cmqlsyn9e000301qgk98rcsjh	Hispana de Seguros	HISPANA	\N	\N	t	2026-07-16 12:26:41.95
cmroao38w000901qjwaxmpbuv	cmqmx6t43000101phgcog0v6o	Mercantil Seguros	MERCANTIL	\N	\N	t	2026-07-17 02:04:01.52
cmroao38w000a01qjyxv79zrz	cmqmx6t43000101phgcog0v6o	Seguros Caracas	CARACAS	\N	\N	t	2026-07-17 02:04:01.52
cmroao38w000b01qj4gxt3nbg	cmqmx6t43000101phgcog0v6o	Mapfre Venezuela	MAPFRE	\N	\N	t	2026-07-17 02:04:01.52
cmroao38w000c01qjflbp6z2x	cmqmx6t43000101phgcog0v6o	Banesco Seguros	BANESCO	\N	\N	t	2026-07-17 02:04:01.52
cmroao38w000d01qj0jl8nw4u	cmqmx6t43000101phgcog0v6o	Seguros Pirámide	PIRAMIDE	\N	\N	t	2026-07-17 02:04:01.52
cmroao38w000e01qjflcp4dc4	cmqmx6t43000101phgcog0v6o	Seguros Constitución	CONSTITUCION	\N	\N	t	2026-07-17 02:04:01.52
cmroao38w000f01qjc6pv6ogq	cmqmx6t43000101phgcog0v6o	La Occidental de Seguros	OCCIDENTAL	\N	\N	t	2026-07-17 02:04:01.52
cmroao38w000g01qjjzmajtdq	cmqmx6t43000101phgcog0v6o	Seguros Horizonte	HORIZONTE	\N	\N	t	2026-07-17 02:04:01.52
cmroao38w000h01qj1pypqd52	cmqmx6t43000101phgcog0v6o	Seguros Altamira	ALTAMIRA	\N	\N	t	2026-07-17 02:04:01.52
cmroao38w000i01qj3s02ri28	cmqmx6t43000101phgcog0v6o	Hispana de Seguros	HISPANA	\N	\N	t	2026-07-17 02:04:01.52
\.


--
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."Invoice" (id, "workspaceId", "patientRegistrationId", "encounterId", numero, descripcion, "montoUsd", "tasaBcv", "montoBs", "metodoPago", status, "pdfUrl", "fechaPago", "insuranceProviderId", "montoSeguro", "createdAt", "updatedAt", "descripcionCifrada") FROM stdin;
cmqvpav85000i01ph6nrar21s	cmqva532b000201p39eq8lpiq	cmqva6ika000h01p3j3pus49q	\N	F-000001	Consulta médica	25.00	622.2135	15555.34	EFECTIVO_USD	PAID	\N	2026-06-27 01:48:45.931	\N	\N	2026-06-27 01:48:19.733	2026-06-27 01:48:45.933	\N
demo_inv_maria_past	cmqmx6t43000101phgcog0v6o	demo_pr_maria_001	demo_enc_maria_past	FAC-2026-000123	Consulta de control de HTA	40.00	36.5000	1460.00	PAGOMOVIL	PAID	\N	2026-06-01 06:16:15.558	\N	\N	2026-06-01 06:16:15.558	2026-06-01 06:16:15.558	\N
cmqn8k5k4000201mgbdbvmf3r	cmqlsyn9e000301qgk98rcsjh	cmqlt50p2000801qgnzs5ydvv	\N	F-000001	Consulta médica	25.00	607.3919	15184.80	EFECTIVO_USD	PAID	/uploads/invoices/cmqn8k5k4000201mgbdbvmf3r.pdf	2026-07-16 02:55:55.041	\N	\N	2026-06-21 03:37:30.148	2026-07-16 02:55:55.053	mOlL8H2nAVCpyQzVazvKWM94q1QCcO4Ogm/beosEWEykKTDz57pA61H0Ur4=
\.


--
-- Data for Name: InvoiceItem; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."InvoiceItem" (id, "invoiceId", descripcion, cantidad, "precioUnitarioUsd", "createdAt") FROM stdin;
cmqn8mbbp000301mgod2nwjhv	cmqn8k5k4000201mgbdbvmf3r	Consulta Medica	1	25.00	2026-06-21 03:39:10.933
\.


--
-- Data for Name: LabOrder; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."LabOrder" (id, "encounterId", estudios, "indicacionesClinicas", urgente, "pdfUrl", "createdAt") FROM stdin;
cmr3mt3rm001g01mv62y9chdr	cmr3mbiyy001201mvd3m4j8c3	{"hematologia completa"}	\N	f	\N	2026-07-02 15:00:41.17
cmr3mtk33001l01mv8i0g9do7	cmr3mbiyy001201mvd3m4j8c3	{"acido urico"}	\N	f	\N	2026-07-02 15:01:02.319
cmr7yjsph000p01mp3rr48fpn	cmr7ygjy9000g01mpw0hcawcx	{"Hematologia completa","Helicobacter pylori en heces"}	\N	f	\N	2026-07-05 15:40:27.029
cmr9l8x4g002201mpokpyryet	cmr9ixxhn001e01mpvrepgcnz	{"hematologia completa",urea,glicemia,creatinina,pt,ptt,hiv,vdrl}	\N	f	\N	2026-07-06 19:03:36.88
\.


--
-- Data for Name: LabResult; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."LabResult" (id, "patientRegistrationId", "encounterId", titulo, fecha, resultado, "createdAt", valores, notas, "notasCifradas") FROM stdin;
demo_lab_maria_lipids	demo_pr_maria_001	demo_enc_maria_past	Perfil lipídico	2026-06-06 06:15:10.016	Colesterol total 195 mg/dL (deseable <200). LDL 118 mg/dL. HDL 52 mg/dL. Triglicéridos 142 mg/dL. Sin alteraciones significativas.	2026-06-06 06:15:10.016	{"parametros": [{"rango": "<200", "valor": 195, "nombre": "Colesterol total", "unidad": "mg/dL"}, {"rango": "<130", "valor": 118, "nombre": "LDL", "unidad": "mg/dL"}, {"rango": ">40", "valor": 52, "nombre": "HDL", "unidad": "mg/dL"}, {"rango": "<150", "valor": 142, "nombre": "Triglicéridos", "unidad": "mg/dL"}]}	Paciente continúa en metas terapéuticas. No requiere ajuste.	\N
cmrmvq9uq001r01o4op95l77y	cmrm7x1l6000101le9hkh0ivo	\N	Hemoglobina	2026-07-16 00:00:00	: 9	2026-07-16 02:18:02.978	[]	\N	\N
\.


--
-- Data for Name: LegalVersion; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."LegalVersion" (id, slug, version, title, "contentHash", "effectiveAt", "publishedBy", notes, "createdAt") FROM stdin;
lv_terminos_1_0_0	terminos	1.0.0	Términos y Condiciones	74cbf93e505e10be5aeaeaf869918db603ebe67432b950320bf390c381209370	2026-07-01 00:00:00	\N	\N	2026-06-25 21:55:59.357
lv_cookies_1_0_0	cookies	1.0.0	Política de Cookies	95d5c3434b20feade265d0cc44db918143bad01d165ec184559869c56b4f9048	2026-07-01 00:00:00	\N	\N	2026-06-25 21:55:59.571
lv_privacidad_1_0_0	privacidad	1.0.0	Política de Privacidad	0edba3903d6c5610fd4342dd8f5d4f1a78a47f7f8d19ed3f0705e6ec4f644e0b	2026-07-01 00:00:00	\N	\N	2026-06-25 21:55:59.76
lv_lopdp_consentimiento_1_0_0	lopdp-consentimiento	1.0.0	Consentimiento Informado (LOPDP Art. 25)	c0a28d1388faa278758d90a65769c1cfa97756ac3f25f83cde3595ff5abf77cf	2026-07-01 00:00:00	\N	\N	2026-06-25 21:55:59.898
cl_lc_1_1_0_cookies_v2	cookies	1.1.0	Política de Cookies — MedSysVE	62bac64908eed1306453dd21a3bcd43d6dd93a8abe1f8e03722d0019dae4530c	2026-06-26 00:00:00	\N	\N	2026-06-26 14:28:07.021
cl_lc_1_1_0_lopdp_v2	lopdp-consentimiento	1.1.0	Consentimiento Expreso para el Tratamiento de Datos Personales	c5034389642d066e2ea94a87da9a5e1a8fbb566f0ec14a620de644cb67463778	2026-06-26 00:00:00	\N	\N	2026-06-26 14:28:07.021
cl_lc_1_1_0_privacidad_v2	privacidad	1.1.0	Política de Privacidad — MedSysVE	ad8bf7f7dd5f339a2952722375302604d4de4f6a5321b8d2923d48d6831aeaa3	2026-06-26 00:00:00	\N	\N	2026-06-26 14:28:07.021
cl_lc_1_1_0_terminos_v2	terminos	1.1.0	Términos y Condiciones de Uso — MedSysVE	8fa615718387a746d36d439ff2ec50de3f832a66ff2665fce187efadf90f46c4	2026-06-26 00:00:00	\N	\N	2026-06-26 14:28:07.021
\.


--
-- Data for Name: Medication; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."Medication" (id, "nombreGenerico", "nombresComerciales", concentraciones, "formaFarmaceutica", "viaAdministracion", "dosisDefaults", categoria, "isCustom", activo, "workspaceId", "createdAt") FROM stdin;
seed_amoxicilina	Amoxicilina	{Amoxil,Trimox,"Amoxicilina Calox","Amoxicilina Genfar","Amoxicilina Leti"}	{"250 mg","500 mg","875 mg"}	Cápsula	Oral	{"adulto": "500 mg c/8h", "pediatrico": "40 mg/kg/día"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.404
seed_amoxicilina_cido_clavul_nico	Amoxicilina + Ácido Clavulánico	{Augmentin,Clavulin,Amoxiclav,Clavamox}	{"500/125 mg","875/125 mg","400/57 mg/5ml"}	Tableta	Oral	{"adulto": "875/125 mg c/12h", "pediatrico": "45 mg/kg/día"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.487
seed_azitromicina	Azitromicina	{Zithromax,Azitrocin,Azitromax,"Azitromicina Leti","Azitromicina Calox"}	{"250 mg","500 mg","200 mg/5ml"}	Tableta	Oral	{"adulto": "500 mg c/24h x 3 días", "pediatrico": "10 mg/kg/día x 3 días"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.5
seed_cefalexina	Cefalexina	{Keflex,"Cefalexina Leti","Cefalexina Calox",Lexin}	{"250 mg","500 mg","125 mg/5ml"}	Cápsula	Oral	{"adulto": "500 mg c/6h", "pediatrico": "25-50 mg/kg/día"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.522
seed_ciprofloxacina	Ciprofloxacina	{Cipro,Ciproxina,Ciproflox,"Ciprofloxacina Calox","Ciprofloxacina Leti"}	{"250 mg","500 mg","750 mg"}	Tableta	Oral	{"adulto": "500 mg c/12h"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.53
seed_claritromicina	Claritromicina	{Klaricid,Biaxin,"Claritromicina Genfar"}	{"250 mg","500 mg","125 mg/5ml"}	Tableta	Oral	{"adulto": "500 mg c/12h", "pediatrico": "7.5 mg/kg c/12h"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.538
seed_doxiciclina	Doxiciclina	{Vibramicina,"Doxiciclina Calox","Doxiciclina Leti"}	{"100 mg"}	Cápsula	Oral	{"adulto": "100 mg c/12h"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.549
seed_trimetoprima_sulfametoxazol	Trimetoprima + Sulfametoxazol	{Bactrim,Septrin,Bactron,"Bactron Forte",Bacidal}	{"80/400 mg","160/800 mg","40/200 mg/5ml"}	Tableta	Oral	{"adulto": "160/800 mg c/12h", "pediatrico": "8/40 mg/kg/día"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.555
seed_metronidazol	Metronidazol	{Flagyl,"Metronidazol Leti","Metronidazol Calox",Flagenase}	{"250 mg","500 mg","125 mg/5ml"}	Tableta	Oral	{"adulto": "500 mg c/8h", "pediatrico": "15 mg/kg/día"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.562
seed_nitrofuranto_na	Nitrofurantoína	{Macrodantina,Furadantina,"Nitrofurantoína Leti"}	{"50 mg","100 mg"}	Cápsula	Oral	{"adulto": "100 mg c/12h", "pediatrico": "5-7 mg/kg/día"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.571
seed_ceftriaxona	Ceftriaxona	{Rocephin,"Ceftriaxona Leti","Ceftriaxona Calox","Ceftriaxona Genfar"}	{"500 mg","1 g","2 g"}	Polvo para inyección	Intramuscular	{"adulto": "1 g c/24h", "pediatrico": "50-100 mg/kg/día"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.58
seed_ampicilina	Ampicilina	{"Ampicilina Calox","Ampicilina Leti","Ampicilina Genfar",Arcocilin,Ampeninaampeninaelina}	{"250 mg","500 mg","1 g"}	Cápsula	Oral	{"adulto": "500 mg c/6h", "pediatrico": "50-100 mg/kg/día"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.587
seed_levofloxacina	Levofloxacina	{Tavanic,"Levofloxacina Calox",Levaquin}	{"250 mg","500 mg","750 mg"}	Tableta	Oral	{"adulto": "500 mg c/24h"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.594
seed_clindamicina	Clindamicina	{Dalacin,"Clindamicina Calox","Clindamicina Leti"}	{"150 mg","300 mg"}	Cápsula	Oral	{"adulto": "300 mg c/8h", "pediatrico": "10-25 mg/kg/día"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.6
seed_eritromicina	Eritromicina	{Eritrocin,"Eritromicina Leti"}	{"250 mg","500 mg"}	Tableta	Oral	{"adulto": "500 mg c/6h", "pediatrico": "30-50 mg/kg/día"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.608
seed_vancomicina	Vancomicina	{Vancocin,"Vancomicina Leti"}	{"500 mg","1 g"}	Polvo para inyección	Intravenosa	{"adulto": "1 g c/12h"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.618
seed_amikacina	Amikacina	{"Amikacina Leti","Amikacina Calox","Amikacina Vivax",Amikavax,Amicip}	{"100 mg/2ml","250 mg/2ml","500 mg/2ml"}	Solución inyectable	Intramuscular	{"adulto": "15 mg/kg/día", "pediatrico": "15-22.5 mg/kg/día"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.623
seed_gentamicina	Gentamicina	{Garamycin,"Gentamicina Leti","Gentamicina Calox"}	{"40 mg/ml","80 mg/2ml"}	Solución inyectable	Intramuscular	{"adulto": "5 mg/kg/día", "pediatrico": "5-7.5 mg/kg/día"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.629
seed_cefazolina	Cefazolina	{Kefzol,"Cefazolina Leti"}	{"500 mg","1 g"}	Polvo para inyección	Intramuscular	{"adulto": "1 g c/8h"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.636
seed_meropenem	Meropenem	{Meronem,"Meropenem Vitalis"}	{"500 mg","1 g"}	Polvo para inyección	Intravenosa	{"adulto": "1 g c/8h"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.644
seed_piperacilina_tazobactam	Piperacilina + Tazobactam	{Tazocin,Zosyn}	{"4/0.5 g","2/0.25 g"}	Polvo para inyección	Intravenosa	{"adulto": "4/0.5 g c/8h"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.649
seed_cefuroxima	Cefuroxima	{Zinnat,"Cefuroxima Calox"}	{"250 mg","500 mg","125 mg/5ml"}	Tableta	Oral	{"adulto": "500 mg c/12h", "pediatrico": "15 mg/kg c/12h"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.654
seed_tetraciclina	Tetraciclina	{"Tetraciclina Leti",Acromicina}	{"250 mg","500 mg"}	Cápsula	Oral	{"adulto": "500 mg c/6h"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.658
seed_linezolid	Linezolid	{Zyvox}	{"600 mg"}	Tableta	Oral	{"adulto": "600 mg c/12h"}	Antibiótico	f	t	\N	2026-06-23 00:30:57.668
seed_ibuprofeno	Ibuprofeno	{Advil,Motrin,"Ibuprofeno Leti","Ibuprofeno Calox",Ibufen}	{"200 mg","400 mg","600 mg","800 mg","100 mg/5ml"}	Tableta	Oral	{"adulto": "400 mg c/8h", "pediatrico": "10 mg/kg c/8h"}	AINE	f	t	\N	2026-06-23 00:30:57.673
seed_diclofenac	Diclofenac	{Voltaren,Cataflam,Artren,"Diclofenaco Calox",Clofen,Aflamas}	{"25 mg","50 mg","75 mg","100 mg"}	Tableta	Oral	{"adulto": "50 mg c/8h"}	AINE	f	t	\N	2026-06-23 00:30:57.676
seed_naproxeno	Naproxeno	{Naprosyn,Flanax,"Naproxeno Leti",Anaprox}	{"250 mg","500 mg","550 mg"}	Tableta	Oral	{"adulto": "500 mg c/12h"}	AINE	f	t	\N	2026-06-23 00:30:57.68
seed_meloxicam	Meloxicam	{Mobic,"Meloxicam Leti","Meloxicam Calox"}	{"7.5 mg","15 mg"}	Tableta	Oral	{"adulto": "15 mg c/24h"}	AINE	f	t	\N	2026-06-23 00:30:57.687
seed_celecoxib	Celecoxib	{Celebrex,"Celecoxib Roemmers"}	{"100 mg","200 mg"}	Cápsula	Oral	{"adulto": "200 mg c/24h"}	AINE	f	t	\N	2026-06-23 00:30:57.692
seed_piroxicam	Piroxicam	{Feldene,"Piroxicam Leti"}	{"10 mg","20 mg"}	Cápsula	Oral	{"adulto": "20 mg c/24h"}	AINE	f	t	\N	2026-06-23 00:30:57.696
seed_nimesulida	Nimesulida	{Mesulid,"Nimesulida Leti"}	{"100 mg"}	Tableta	Oral	{"adulto": "100 mg c/12h"}	AINE	f	t	\N	2026-06-23 00:30:57.704
seed_ketorolac	Ketorolac	{Toradol,"Ketorolaco Leti",Dolac}	{"10 mg","30 mg/ml"}	Tableta	Oral	{"adulto": "10 mg c/6h"}	AINE	f	t	\N	2026-06-23 00:30:57.707
seed_indometacina	Indometacina	{Indocin,"Indometacina Leti"}	{"25 mg","50 mg"}	Cápsula	Oral	{"adulto": "25 mg c/8h"}	AINE	f	t	\N	2026-06-23 00:30:57.719
seed_ketoprofeno	Ketoprofeno	{Profenid,"Ketoprofeno Leti"}	{"50 mg","100 mg","200 mg"}	Cápsula	Oral	{"adulto": "100 mg c/12h"}	AINE	f	t	\N	2026-06-23 00:30:57.722
seed_acetaminof_n	Acetaminofén	{Atamel,"Atamel Forte",Tylenol,"Acetaminofén Genfar",Analper,Apiret,Tachipirin,"Acetaminofén Calox"}	{"500 mg","650 mg","1 g","120 mg/5ml","150 mg/5ml","160 mg/5ml"}	Tableta	Oral	{"adulto": "500-1000 mg c/6h", "pediatrico": "15 mg/kg c/6h"}	Analgésico	f	t	\N	2026-06-23 00:30:57.727
seed_dipirona	Dipirona	{Novalcina,Novalgina,Metamizol,"Dipirona Leti"}	{"500 mg","1 g","50 mg/ml"}	Tableta	Oral	{"adulto": "1 g c/8h", "pediatrico": "10-15 mg/kg c/8h"}	Analgésico	f	t	\N	2026-06-23 00:30:57.732
seed_tramadol	Tramadol	{Tramal,"Tramadol Leti","Tramadol Calox","Dolak SL",Notalac,Duoval}	{"50 mg","100 mg","200 mg"}	Cápsula	Oral	{"adulto": "50-100 mg c/8h"}	Analgésico	f	t	\N	2026-06-23 00:30:57.737
seed_morfina	Morfina	{"MST Continus","Morfina Leti"}	{"10 mg","15 mg","30 mg","10 mg/ml"}	Tableta	Oral	{"adulto": "10-30 mg c/12h"}	Opiáceo	f	t	\N	2026-06-23 00:30:57.74
seed_code_na	Codeína	{"Codeína Leti",Codelasa}	{"30 mg","60 mg"}	Tableta	Oral	{"adulto": "30 mg c/6h"}	Opiáceo	f	t	\N	2026-06-23 00:30:57.749
seed__cido_acetilsalic_lico	Ácido Acetilsalicílico	{Aspirina,Asaprol,Cardioaspirina,"AAS Bayer"}	{"81 mg","100 mg","325 mg","500 mg"}	Tableta	Oral	{"adulto": "100 mg c/24h"}	Antiagregante	f	t	\N	2026-06-23 00:30:57.756
seed_enalapril	Enalapril	{Renitec,"Enalapril Leti","Enalapril Calox",Vasotec}	{"2.5 mg","5 mg","10 mg","20 mg"}	Tableta	Oral	{"adulto": "10-40 mg/día"}	Antihipertensivo	f	t	\N	2026-06-23 00:30:57.766
seed_losart_n	Losartán	{Cozaar,"Losartán Leti","Losartán Calox",Losacor}	{"25 mg","50 mg","100 mg"}	Tableta	Oral	{"adulto": "50 mg c/24h"}	Antihipertensivo	f	t	\N	2026-06-23 00:30:57.772
seed_amlodipino	Amlodipino	{Norvasc,"Amlodipino Leti","Amlodipino Calox",Amstatin}	{"2.5 mg","5 mg","10 mg"}	Tableta	Oral	{"adulto": "5-10 mg c/24h"}	Antihipertensivo	f	t	\N	2026-06-23 00:30:57.777
seed_atenolol	Atenolol	{Tenormin,"Atenolol Leti","Atenolol Calox"}	{"25 mg","50 mg","100 mg"}	Tableta	Oral	{"adulto": "50-100 mg c/24h"}	Betabloqueante	f	t	\N	2026-06-23 00:30:57.788
seed_metoprolol	Metoprolol	{Lopressor,"Metoprolol Leti",Seloken}	{"25 mg","50 mg","100 mg"}	Tableta	Oral	{"adulto": "50-100 mg c/12h"}	Betabloqueante	f	t	\N	2026-06-23 00:30:57.795
seed_hidroclorotiazida	Hidroclorotiazida	{"Hidroclorotiazida Leti","HCT Calox",Esidrix}	{"12.5 mg","25 mg","50 mg"}	Tableta	Oral	{"adulto": "25 mg c/24h"}	Diurético	f	t	\N	2026-06-23 00:30:57.799
seed_furosemida	Furosemida	{Lasix,"Furosemida Leti","Furosemida Calox"}	{"20 mg","40 mg","80 mg","10 mg/ml"}	Tableta	Oral	{"adulto": "40 mg c/24h"}	Diurético	f	t	\N	2026-06-23 00:30:57.807
seed_espironolactona	Espironolactona	{Aldactone,"Espironolactona Leti"}	{"25 mg","50 mg","100 mg"}	Tableta	Oral	{"adulto": "25-100 mg c/24h"}	Diurético	f	t	\N	2026-06-23 00:30:57.817
seed_valsart_n	Valsartán	{Diovan,"Valsartán Leti"}	{"40 mg","80 mg","160 mg","320 mg"}	Tableta	Oral	{"adulto": "160 mg c/24h"}	Antihipertensivo	f	t	\N	2026-06-23 00:30:57.823
seed_ramipril	Ramipril	{Tritace,"Ramipril Leti"}	{"2.5 mg","5 mg","10 mg"}	Cápsula	Oral	{"adulto": "5-10 mg c/24h"}	Antihipertensivo	f	t	\N	2026-06-23 00:30:57.828
seed_nifedipino	Nifedipino	{Adalat,"Nifedipino Leti","Nifedipino Calox"}	{"10 mg","20 mg","30 mg","60 mg"}	Cápsula	Oral	{"adulto": "30 mg c/24h"}	Antihipertensivo	f	t	\N	2026-06-23 00:30:57.835
seed_propranolol	Propranolol	{Inderal,"Propranolol Leti"}	{"10 mg","40 mg","80 mg"}	Tableta	Oral	{"adulto": "40 mg c/8h"}	Betabloqueante	f	t	\N	2026-06-23 00:30:57.838
seed_carvedilol	Carvedilol	{Coreg,"Carvedilol Leti"}	{"6.25 mg","12.5 mg","25 mg"}	Tableta	Oral	{"adulto": "6.25-25 mg c/12h"}	Betabloqueante	f	t	\N	2026-06-23 00:30:57.847
seed_bisoprolol	Bisoprolol	{Concor,"Bisoprolol Leti"}	{"2.5 mg","5 mg","10 mg"}	Tableta	Oral	{"adulto": "5-10 mg c/24h"}	Betabloqueante	f	t	\N	2026-06-23 00:30:57.858
seed_metformina	Metformina	{Glucophage,Glafornil,"Metformina Leti","Metformina Calox",Diabex}	{"500 mg","850 mg","1000 mg"}	Tableta	Oral	{"adulto": "850 mg c/12h"}	Antidiabético	f	t	\N	2026-06-23 00:30:57.864
seed_glibenclamida	Glibenclamida	{Daonil,"Glibenclamida Leti",Euglucon}	{"2.5 mg","5 mg"}	Tableta	Oral	{"adulto": "5 mg c/24h"}	Antidiabético	f	t	\N	2026-06-23 00:30:57.868
seed_glipizida	Glipizida	{Glucotrol,"Glipizida Leti",Minidiab}	{"5 mg","10 mg"}	Tableta	Oral	{"adulto": "5-10 mg c/24h"}	Antidiebético	f	t	\N	2026-06-23 00:30:57.872
seed_insulina_regular	Insulina Regular	{"Humulin R",Actrapid,"Insulina Regular Leti"}	{"100 UI/ml"}	Solución inyectable	Subcutánea	{"adulto": "Según glucemia"}	Antidiabético	f	t	\N	2026-06-23 00:30:57.876
seed_insulina_nph	Insulina NPH	{"Humulin N",Insulatard,"Insulina NPH Leti"}	{"100 UI/ml"}	Suspensión inyectable	Subcutánea	{"adulto": "Según glucemia"}	Antidiabético	f	t	\N	2026-06-23 00:30:57.881
seed_sitagliptina	Sitagliptina	{Januvia,"Sitagliptina Roemmers"}	{"25 mg","50 mg","100 mg"}	Tableta	Oral	{"adulto": "100 mg c/24h"}	Antidiabético	f	t	\N	2026-06-23 00:30:57.916
seed_empagliflozina	Empagliflozina	{Jardiance}	{"10 mg","25 mg"}	Tableta	Oral	{"adulto": "10-25 mg c/24h"}	Antidiabético	f	t	\N	2026-06-23 00:30:57.992
seed_atorvastatina	Atorvastatina	{Lipitor,"Atorvastatina Leti","Atorvastatina Calox",Torvast}	{"10 mg","20 mg","40 mg","80 mg"}	Tableta	Oral	{"adulto": "20-40 mg c/24h"}	Hipolipemiante	f	t	\N	2026-06-23 00:30:58.016
seed_simvastatina	Simvastatina	{Zocor,"Simvastatina Leti",Hiperlipén}	{"10 mg","20 mg","40 mg"}	Tableta	Oral	{"adulto": "20-40 mg c/24h"}	Hipolipemiante	f	t	\N	2026-06-23 00:30:58.024
seed_rosuvastatina	Rosuvastatina	{Crestor,"Rosuvastatina Leti"}	{"5 mg","10 mg","20 mg","40 mg"}	Tableta	Oral	{"adulto": "10-20 mg c/24h"}	Hipolipemiante	f	t	\N	2026-06-23 00:30:58.036
seed_digoxina	Digoxina	{Lanoxin,"Digoxina Leti"}	{"0.125 mg","0.25 mg","0.05 mg/ml"}	Tableta	Oral	{"adulto": "0.125-0.25 mg c/24h"}	Cardiotónico	f	t	\N	2026-06-23 00:30:58.05
seed_amiodarona	Amiodarona	{Cordarone,"Amiodarona Leti"}	{"100 mg","200 mg","50 mg/ml"}	Tableta	Oral	{"adulto": "200 mg c/24h"}	Antiarrítmico	f	t	\N	2026-06-23 00:30:58.077
seed_clopidogrel	Clopidogrel	{Plavix,"Clopidogrel Leti","Clopidogrel Calox"}	{"75 mg"}	Tableta	Oral	{"adulto": "75 mg c/24h"}	Antiagregante	f	t	\N	2026-06-23 00:30:58.323
seed_warfarina	Warfarina	{Coumadin,"Warfarina Leti"}	{"1 mg","2 mg","2.5 mg","5 mg"}	Tableta	Oral	{"adulto": "Según INR"}	Anticoagulante	f	t	\N	2026-06-23 00:30:58.418
seed_isosorbida_dinitrato	Isosorbida Dinitrato	{Isordil,Isoket}	{"5 mg","10 mg","20 mg"}	Tableta	Oral	{"adulto": "10-20 mg c/8h"}	Vasodilatador coronario	f	t	\N	2026-06-23 00:30:58.447
seed_nitroglicerina	Nitroglicerina	{Nitrostat,Trinitrina,"Nitro Pohl"}	{"0.5 mg","0.4 mg/dosis"}	Tableta sublingual	Sublingual	{"adulto": "0.5 mg SL c/5 min (máx 3 dosis)"}	Vasodilatador coronario	f	t	\N	2026-06-23 00:30:58.459
seed_fenito_na	Fenitoína	{Dilantin,"Fenitoína Leti"}	{"100 mg","50 mg/ml"}	Cápsula	Oral	{"adulto": "100 mg c/8h"}	Antiepiléptico	f	t	\N	2026-06-23 00:30:58.468
seed_loratadina	Loratadina	{Claritin,"Loratadina Leti","Loratadina Calox",Clarityne}	{"10 mg","5 mg/5ml"}	Tableta	Oral	{"adulto": "10 mg c/24h", "pediatrico": "5 mg c/24h"}	Antihistamínico	f	t	\N	2026-06-23 00:30:58.495
seed_cetirizina	Cetirizina	{Zyrtec,"Cetirizina Leti","Cetirizina Calox",Talizic,Rinolast}	{"10 mg","5 mg/5ml"}	Tableta	Oral	{"adulto": "10 mg c/24h", "pediatrico": "5 mg c/24h"}	Antihistamínico	f	t	\N	2026-06-23 00:30:58.503
seed_fexofenadina	Fexofenadina	{Allegra,"Fexofenadina Leti"}	{"120 mg","180 mg"}	Tableta	Oral	{"adulto": "180 mg c/24h"}	Antihistamínico	f	t	\N	2026-06-23 00:30:58.511
seed_difenhidramina	Difenhidramina	{Benadryl,"Difenhidramina Leti",Dicopal}	{"25 mg","50 mg","12.5 mg/5ml"}	Cápsula	Oral	{"adulto": "25-50 mg c/6h", "pediatrico": "1 mg/kg c/6h"}	Antihistamínico	f	t	\N	2026-06-23 00:30:58.518
seed_clorfeniramina	Clorfeniramina	{Clortrimetón,"Clorfeniramina Leti","Clorfeniramina Calox"}	{"4 mg","2 mg/5ml","10 mg/ml inyectable"}	Tableta	Oral	{"adulto": "4 mg c/6h", "pediatrico": "0.1 mg/kg c/6h"}	Antihistamínico	f	t	\N	2026-06-23 00:30:58.526
seed_dexametasona	Dexametasona	{Decadron,"Dexametasona Leti","Betametasona Pedicort","Dexametasona Calox"}	{"0.5 mg","0.75 mg","4 mg/ml","8 mg/2ml"}	Tableta	Oral	{"adulto": "4-8 mg c/6h (agudo)", "pediatrico": "0.15-0.6 mg/kg/día"}	Corticosteroide	f	t	\N	2026-06-23 00:30:58.55
seed_salbutamol	Salbutamol	{Ventolin,"Salbutamol Leti","Salbutamol Calox",Albuterol,Airomir}	{"100 mcg/dosis","2 mg","4 mg","0.5 mg/ml"}	Inhalador	Inhalatoria	{"adulto": "1-2 puff c/4-6h", "pediatrico": "1 puff c/4-6h"}	Broncodilatador	f	t	\N	2026-06-23 00:30:58.588
seed_ipratropio	Ipratropio	{Atrovent,"Ipratropio Leti"}	{"20 mcg/dosis","0.25 mg/2ml"}	Inhalador	Inhalatoria	{"adulto": "2 puff c/6h"}	Broncodilatador	f	t	\N	2026-06-23 00:30:58.592
seed_budesonida	Budesonida	{Pulmicort,"Budesonida Leti",Budecort}	{"100 mcg/dosis","200 mcg/dosis","0.25 mg/2ml","0.5 mg/2ml"}	Inhalador	Inhalatoria	{"adulto": "200-400 mcg c/12h", "pediatrico": "100-200 mcg c/12h"}	Corticosteroide inhalado	f	t	\N	2026-06-23 00:30:58.621
seed_fluticasona	Fluticasona	{Flixotide,"Fluticasona Leti"}	{"50 mcg/dosis","125 mcg/dosis","250 mcg/dosis"}	Inhalador	Inhalatoria	{"adulto": "100-500 mcg c/12h"}	Corticosteroide inhalado	f	t	\N	2026-06-23 00:30:58.631
seed_salmeterol_fluticasona	Salmeterol + Fluticasona	{Seretide,Advair,Inaspir}	{"25/50 mcg","25/125 mcg","25/250 mcg"}	Inhalador	Inhalatoria	{"adulto": "1-2 puff c/12h"}	Broncodilatador	f	t	\N	2026-06-23 00:30:58.638
seed_montelukast	Montelukast	{Singulair,"Montelukast Leti",Flucán}	{"4 mg","5 mg","10 mg"}	Tableta	Oral	{"adulto": "10 mg c/24h", "pediatrico": "5 mg c/24h"}	Antileucotrieno	f	t	\N	2026-06-23 00:30:58.644
seed_ambroxol	Ambroxol	{Mucosolvan,"Ambroxol Leti","Ambroxol Calox",Ambrophar}	{"30 mg","75 mg","7.5 mg/5ml","15 mg/5ml"}	Tableta	Oral	{"adulto": "30 mg c/8h", "pediatrico": "7.5-15 mg c/8h"}	Mucolítico	f	t	\N	2026-06-23 00:30:58.654
seed_acetilciste_na	Acetilcisteína	{Fluimucil,"Acetilcisteína Leti",Muconacys}	{"200 mg","600 mg","100 mg/5ml"}	Tableta efervescente	Oral	{"adulto": "600 mg c/24h", "pediatrico": "200 mg c/8h"}	Mucolítico	f	t	\N	2026-06-23 00:30:58.664
seed_teofilina	Teofilina	{Theodur,"Teofilina Leti"}	{"100 mg","200 mg","300 mg"}	Tableta de liberación prolongada	Oral	{"adulto": "200-300 mg c/12h"}	Broncodilatador	f	t	\N	2026-06-23 00:30:58.678
seed_omeprazol	Omeprazol	{Prilosec,"Omeprazol Leti","Omeprazol Calox",Ultratop,Ezolium}	{"10 mg","20 mg","40 mg"}	Cápsula	Oral	{"adulto": "20 mg c/24h"}	Inhibidor de bomba de protones	f	t	\N	2026-06-23 00:30:58.685
seed_pantoprazol	Pantoprazol	{"Pantoprazol Leti",Protonix,Pantoc}	{"20 mg","40 mg"}	Tableta	Oral	{"adulto": "40 mg c/24h"}	Inhibidor de bomba de protones	f	t	\N	2026-06-23 00:30:58.694
seed_ranitidina	Ranitidina	{Zantac,"Ranitidina Leti","Ranitidina Calox"}	{"150 mg","300 mg","50 mg/2ml"}	Tableta	Oral	{"adulto": "150 mg c/12h"}	Antiulceroso	f	t	\N	2026-06-23 00:30:58.698
seed_metoclopramida	Metoclopramida	{Primperan,"Metoclopramida Leti",Plasil}	{"10 mg","5 mg/5ml","5 mg/ml inyectable"}	Tableta	Oral	{"adulto": "10 mg c/8h", "pediatrico": "0.1 mg/kg c/8h"}	Antiemético	f	t	\N	2026-06-23 00:30:58.703
seed_ondansetr_n	Ondansetrón	{Zofran,"Ondansetrón Leti","Ondansetrón Calox",Vomceran}	{"4 mg","8 mg","4 mg/2ml","4 mg/5ml"}	Tableta	Oral	{"adulto": "8 mg c/8h", "pediatrico": "0.1 mg/kg c/8h"}	Antiemético	f	t	\N	2026-06-23 00:30:58.712
seed_domperidona	Domperidona	{Motilium,"Domperidona Leti",Atrovert}	{"10 mg","5 mg/5ml","10 mg/ml gotas"}	Tableta	Oral	{"adulto": "10 mg c/8h", "pediatrico": "0.25 mg/kg c/8h"}	Procinético	f	t	\N	2026-06-23 00:30:58.725
seed_loperamida	Loperamida	{Imodium,"Loperamida Leti","Loperamida Calox"}	{"2 mg"}	Cápsula	Oral	{"adulto": "4 mg inicial, luego 2 mg c/heces"}	Antidiarreico	f	t	\N	2026-06-23 00:30:58.738
seed_bisacodilo	Bisacodilo	{Dulcolax,"Bisacodilo Leti"}	{"5 mg","10 mg supositorios"}	Tableta	Oral	{"adulto": "5-10 mg c/24h"}	Laxante	f	t	\N	2026-06-23 00:30:58.752
seed_lactulosa	Lactulosa	{Duphalac,"Lactulosa Leti"}	{"3.33 g/5ml","10 g/15ml"}	Solución oral	Oral	{"adulto": "15-30 ml c/24h", "pediatrico": "5-10 ml c/24h"}	Laxante	f	t	\N	2026-06-23 00:30:58.76
seed_hidr_xido_de_aluminio_hidr_xido_de_magnesio	Hidróxido de aluminio + Hidróxido de magnesio	{Maalox,Mylanta,Gelusil,Diovol}	{"200/200 mg","400/400 mg/5ml"}	Tableta	Oral	{"adulto": "10-20 ml o 1-2 tabs c/6h"}	Antiácido	f	t	\N	2026-06-23 00:30:58.771
seed_sucralfato	Sucralfato	{Carafate,"Sucralfato Leti",Ulcar}	{"1 g","1 g/5ml"}	Tableta	Oral	{"adulto": "1 g c/6h ac"}	Antiulceroso	f	t	\N	2026-06-23 00:30:58.786
seed_alprazolam	Alprazolam	{Xanax,"Alprazolam Leti","Alprazolam Calox"}	{"0.25 mg","0.5 mg","1 mg"}	Tableta	Oral	{"adulto": "0.25-0.5 mg c/8h"}	Ansiolítico	f	t	\N	2026-06-23 00:30:58.797
seed_diazepam	Diazepam	{Valium,"Diazepam Leti","Diazepam Calox"}	{"2 mg","5 mg","10 mg","5 mg/ml"}	Tableta	Oral	{"adulto": "5-10 mg c/8-12h"}	Ansiolítico	f	t	\N	2026-06-23 00:30:58.804
seed_clonazepam	Clonazepam	{Rivotril,"Clonazepam Leti"}	{"0.5 mg","1 mg","2 mg","0.1 mg/ml gotas"}	Tableta	Oral	{"adulto": "0.5-2 mg c/12h"}	Ansiolítico	f	t	\N	2026-06-23 00:30:58.813
seed_sertralina	Sertralina	{Zoloft,"Sertralina Leti","Sertralina Calox"}	{"50 mg","100 mg"}	Tableta	Oral	{"adulto": "50-100 mg c/24h"}	Antidepresivo	f	t	\N	2026-06-23 00:30:58.83
seed_fluoxetina	Fluoxetina	{Prozac,"Fluoxetina Leti","Fluoxetina Calox"}	{"10 mg","20 mg","20 mg/5ml"}	Cápsula	Oral	{"adulto": "20 mg c/24h"}	Antidepresivo	f	t	\N	2026-06-23 00:30:58.84
seed_escitalopram	Escitalopram	{Lexapro,"Escitalopram Leti"}	{"5 mg","10 mg","20 mg"}	Tableta	Oral	{"adulto": "10-20 mg c/24h"}	Antidepresivo	f	t	\N	2026-06-23 00:30:58.854
seed_amitriptilina	Amitriptilina	{Tryptanol,"Amitriptilina Leti",Leprit}	{"10 mg","25 mg","50 mg","75 mg"}	Tableta	Oral	{"adulto": "25-75 mg noche"}	Antidepresivo tricíclico	f	t	\N	2026-06-23 00:30:58.862
seed_haloperidol	Haloperidol	{Haldol,"Haloperidol Leti"}	{"0.5 mg","1 mg","5 mg","2 mg/ml","5 mg/ml inyectable"}	Tableta	Oral	{"adulto": "0.5-5 mg c/8-12h"}	Antipsicótico	f	t	\N	2026-06-23 00:30:58.879
seed_risperidona	Risperidona	{Risperdal,"Risperidona Leti"}	{"0.5 mg","1 mg","2 mg","3 mg","4 mg","1 mg/ml"}	Tableta	Oral	{"adulto": "1-6 mg/día"}	Antipsicótico	f	t	\N	2026-06-23 00:30:58.885
seed_gabapentina	Gabapentina	{Neurontin,"Gabapentina Leti","Gabapentina Calox"}	{"100 mg","300 mg","400 mg"}	Cápsula	Oral	{"adulto": "300 mg c/8h"}	Antiepiléptico	f	t	\N	2026-06-23 00:30:58.898
seed_carbamazepina	Carbamazepina	{Tegretol,"Carbamazepina Leti"}	{"100 mg","200 mg","400 mg","100 mg/5ml"}	Tableta	Oral	{"adulto": "200-400 mg c/12h"}	Antiepiléptico	f	t	\N	2026-06-23 00:30:58.905
seed_valproato_de_sodio	Valproato de Sodio	{Depakote,"Valproato Leti",Valcote}	{"125 mg","250 mg","500 mg","200 mg/5ml"}	Tableta	Oral	{"adulto": "500 mg c/12h"}	Antiepiléptico	f	t	\N	2026-06-23 00:30:58.911
seed_levetiracetam	Levetiracetam	{Keppra,"Levetiracetam Leti"}	{"250 mg","500 mg","1000 mg","100 mg/ml"}	Tableta	Oral	{"adulto": "500 mg c/12h"}	Antiepiléptico	f	t	\N	2026-06-23 00:30:58.914
seed_zolpidem	Zolpidem	{Ambien,"Zolpidem Leti",Stilnox}	{"5 mg","10 mg"}	Tableta	Oral	{"adulto": "10 mg antes de dormir"}	Hipnótico	f	t	\N	2026-06-23 00:30:58.921
seed_pregabalina	Pregabalina	{Lyrica,"Pregabalina Leti"}	{"25 mg","50 mg","75 mg","100 mg","150 mg","300 mg"}	Cápsula	Oral	{"adulto": "75-150 mg c/12h"}	Antiepiléptico	f	t	\N	2026-06-23 00:30:58.927
seed_prednisona	Prednisona	{Deltasone,"Prednisona Leti","Prednisona Calox",Meticorten}	{"5 mg","10 mg","20 mg","50 mg"}	Tableta	Oral	{"adulto": "0.5-1 mg/kg/día", "pediatrico": "1-2 mg/kg/día"}	Corticosteroide	f	t	\N	2026-06-23 00:30:58.931
seed_metilprednisolona	Metilprednisolona	{Solu-Medrol,"Metilprednisolona Leti",Muvett}	{"4 mg","8 mg","16 mg","40 mg","125 mg/2ml","500 mg","1 g"}	Tableta	Oral	{"adulto": "4-48 mg/día"}	Corticosteroide	f	t	\N	2026-06-23 00:30:58.935
seed_betametasona	Betametasona	{Celestone,"Betametasona Leti",Betagen,Betaduo}	{"0.5 mg","0.6 mg/ml","3 mg+3 mg inyectable"}	Tableta	Oral	{"adulto": "0.6-7.2 mg/día"}	Corticosteroide	f	t	\N	2026-06-23 00:30:58.942
seed_hidrocortisona	Hidrocortisona	{Solu-Cortef,"Hidrocortisona Leti",Pedicort}	{"10 mg","20 mg","100 mg","250 mg","500 mg"}	Tableta	Oral	{"adulto": "20-240 mg/día"}	Corticosteroide	f	t	\N	2026-06-23 00:30:58.951
seed__cido_f_lico	Ácido Fólico	{"Ácido Fólico Leti","Ácido Fólico Gencer","Folico Behrens"}	{"0.4 mg","1 mg","5 mg","10 mg/ml gotas"}	Tableta	Oral	{"adulto": "1-5 mg c/24h", "pediatrico": "0.4-1 mg c/24h"}	Vitamina	f	t	\N	2026-06-23 00:30:58.958
seed_vitamina_b12_cianocobalamina_	Vitamina B12 (Cianocobalamina)	{"Cianocobalamina Leti",Nervobión,Bedoyecta}	{"500 mcg","1000 mcg","1000 mcg/ml"}	Tableta	Oral	{"adulto": "1000 mcg c/24h"}	Vitamina	f	t	\N	2026-06-23 00:30:59
seed_vitamina_c_cido_asc_rbico_	Vitamina C (Ácido Ascórbico)	{"Ácido Ascórbico Diamedica",Redoxon,Cebión}	{"250 mg","500 mg","1 g","100 mg/ml inyectable"}	Tableta	Oral	{"adulto": "500-1000 mg c/24h"}	Vitamina	f	t	\N	2026-06-23 00:30:59.016
seed_vitamina_d3_colecalciferol_	Vitamina D3 (Colecalciferol)	{"Vitamina D3 Leti",Raquiferol,"Oleovit D3"}	{"400 UI","800 UI","1000 UI","2000 UI","5000 UI"}	Tableta	Oral	{"adulto": "1000-2000 UI c/24h", "pediatrico": "400-800 UI c/24h"}	Vitamina	f	t	\N	2026-06-23 00:30:59.022
seed_sulfato_ferroso	Sulfato Ferroso	{Fer-In-Sol,"Sulfato Ferroso Leti",Vitafer}	{"200 mg","75 mg/ml gotas","150 mg/5ml"}	Tableta	Oral	{"adulto": "200 mg c/8h ac", "pediatrico": "3-6 mg/kg/día"}	Mineral	f	t	\N	2026-06-23 00:30:59.025
seed_complejo_b	Complejo B	{"Complejo B Leti","B-Complex Calox",Neurobión}	{"Comprimido estándar","100 mg/2ml inyectable"}	Tableta	Oral	{"adulto": "1 tableta c/24h"}	Vitamina	f	t	\N	2026-06-23 00:30:59.032
seed_zinc	Zinc	{"Zinc Leti",Zincovit,Zinco}	{"5 mg/5ml","10 mg","20 mg"}	Tableta	Oral	{"adulto": "20 mg c/24h", "pediatrico": "10 mg c/24h"}	Mineral	f	t	\N	2026-06-23 00:30:59.047
seed_albendazol	Albendazol	{Zentel,"Albendazol Leti",Eskazole}	{"200 mg","400 mg","100 mg/5ml"}	Tableta	Oral	{"adulto": "400 mg dosis única", "pediatrico": "200 mg dosis única"}	Antiparasitario	f	t	\N	2026-06-23 00:30:59.053
seed_mebendazol	Mebendazol	{Vermox,"Mebendazol Leti","Mebendazol Calox"}	{"100 mg","500 mg","100 mg/5ml"}	Tableta	Oral	{"adulto": "100 mg c/12h x 3 días", "pediatrico": "100 mg c/12h x 3 días"}	Antiparasitario	f	t	\N	2026-06-23 00:30:59.059
seed_ivermectina	Ivermectina	{Ivermectin,Ivergot,Stromectol,Ivexterm}	{"3 mg","6 mg","6 mg/ml gotas"}	Tableta	Oral	{"adulto": "200 mcg/kg dosis única", "pediatrico": "200 mcg/kg dosis única"}	Antiparasitario	f	t	\N	2026-06-23 00:30:59.068
seed_piperazina	Piperazina	{"Piperazina Lister",Piperina}	{"500 mg/5ml"}	Jarabe	Oral	{"adulto": "75 mg/kg c/24h x 2 días", "pediatrico": "75 mg/kg c/24h x 2 días"}	Antiparasitario	f	t	\N	2026-06-23 00:30:59.077
seed_metronidazol_antiparasitario_	Metronidazol (antiparasitario)	{Flagyl,"Metronidazol Leti"}	{"250 mg","500 mg"}	Tableta	Oral	{"adulto": "500 mg c/8h x 7 días"}	Antiparasitario	f	t	\N	2026-06-23 00:30:59.083
seed_cloroquina	Cloroquina	{Aralen,"Cloroquina Leti"}	{"150 mg","250 mg"}	Tableta	Oral	{"adulto": "Según esquema malaria"}	Antipalúdico	f	t	\N	2026-06-23 00:30:59.088
seed_aciclovir	Aciclovir	{Zovirax,"Aciclovir Leti","Aciclovir Calox"}	{"200 mg","400 mg","800 mg","200 mg/5ml","250 mg/10ml inyectable"}	Tableta	Oral	{"adulto": "800 mg c/4h x 7 días (herpes zóster)", "pediatrico": "20 mg/kg c/6h x 5 días"}	Antiviral	f	t	\N	2026-06-23 00:30:59.096
seed_oseltamivir	Oseltamivir	{Tamiflu,"Oseltamivir Leti"}	{"30 mg","45 mg","75 mg","6 mg/ml"}	Cápsula	Oral	{"adulto": "75 mg c/12h x 5 días", "pediatrico": "Según peso x 5 días"}	Antiviral	f	t	\N	2026-06-23 00:30:59.108
seed_valaciclovir	Valaciclovir	{Valtrex,"Valaciclovir Leti"}	{"500 mg","1 g"}	Tableta	Oral	{"adulto": "1 g c/12h x 7-10 días"}	Antiviral	f	t	\N	2026-06-23 00:30:59.13
seed_fluconazol	Fluconazol	{Diflucan,"Fluconazol Leti","Fluconazol Calox"}	{"50 mg","100 mg","150 mg","200 mg","10 mg/ml"}	Cápsula	Oral	{"adulto": "150 mg dosis única (candidiasis vaginal)", "pediatrico": "3-6 mg/kg/día"}	Antifúngico	f	t	\N	2026-06-23 00:30:59.151
seed_itraconazol	Itraconazol	{Sporanox,"Itraconazol Leti"}	{"100 mg","10 mg/ml"}	Cápsula	Oral	{"adulto": "200 mg c/24h"}	Antifúngico	f	t	\N	2026-06-23 00:30:59.222
seed_nistatina	Nistatina	{Mycostatin,"Nistatina Leti",Nilstat}	{"100.000 UI/ml","500.000 UI"}	Solución oral	Oral (tópico)	{"adulto": "4-6 ml enjuague c/6h", "pediatrico": "1-2 ml c/6h"}	Antifúngico	f	t	\N	2026-06-23 00:30:59.419
seed_clotrimazol	Clotrimazol	{Canesten,"Clotrimazol Leti",Mycelex}	{1%,2%,"100 mg","200 mg","500 mg óvulo"}	Crema	Tópica	{"adulto": "Aplicar c/12h x 7 días"}	Antifúngico	f	t	\N	2026-06-23 00:30:59.434
seed_ketoconazol	Ketoconazol	{Nizoral,"Ketoconazol Leti"}	{"200 mg","2% crema","2% champú"}	Tableta	Oral	{"adulto": "200 mg c/24h"}	Antifúngico	f	t	\N	2026-06-23 00:30:59.445
seed_levotiroxina	Levotiroxina	{Eutirox,Synthroid,"Levotiroxina Leti",Engran}	{"25 mcg","50 mcg","75 mcg","88 mcg","100 mcg","125 mcg","150 mcg","200 mcg"}	Tableta	Oral	{"adulto": "1.6 mcg/kg/día"}	Hormona tiroidea	f	t	\N	2026-06-23 00:30:59.465
seed_metimazol	Metimazol	{Tapazol,"Metimazol Leti"}	{"5 mg","10 mg","20 mg"}	Tableta	Oral	{"adulto": "20-40 mg/día"}	Antitiroideo	f	t	\N	2026-06-23 00:30:59.609
seed_tamsulosina	Tamsulosina	{Flomax,"Tamsulosina Leti",Genur,Secotex}	{"0.4 mg"}	Cápsula	Oral	{"adulto": "0.4 mg c/24h"}	Urológico	f	t	\N	2026-06-23 00:30:59.619
seed_finasterida	Finasterida	{Proscar,Propecia,"Finasterida Leti"}	{"1 mg","5 mg"}	Tableta	Oral	{"adulto": "5 mg c/24h"}	Urológico	f	t	\N	2026-06-23 00:30:59.657
seed_solifenacina	Solifenacina	{Vesicare,"Solifenacina Leti"}	{"5 mg","10 mg"}	Tableta	Oral	{"adulto": "5-10 mg c/24h"}	Urológico	f	t	\N	2026-06-23 00:30:59.664
seed_dutasterida	Dutasterida	{Avodart,"Dutasterida Leti"}	{"0.5 mg"}	Cápsula	Oral	{"adulto": "0.5 mg c/24h"}	Urológico	f	t	\N	2026-06-23 00:30:59.674
seed_progesterona	Progesterona	{Utrogestan,"Progesterona Leti",Geslutin}	{"100 mg","200 mg","50 mg/ml"}	Cápsula	Oral	{"adulto": "200 mg c/24h vaginal"}	Hormona	f	t	\N	2026-06-23 00:30:59.687
seed_estradiol	Estradiol	{"Estradiol Leti",Progynova,Oestrogel}	{"1 mg","2 mg","0.5 mg/g gel"}	Tableta	Oral	{"adulto": "1-2 mg c/24h"}	Hormona	f	t	\N	2026-06-23 00:30:59.695
seed_misoprostol	Misoprostol	{Cytotec,"Misoprostol Leti"}	{"200 mcg"}	Tableta	Vaginal/Oral	{"adulto": "Según protocolo"}	Prostanoide	f	t	\N	2026-06-23 00:30:59.701
seed_metildopa	Metildopa	{Aldomet,"Metildopa Leti"}	{"250 mg","500 mg"}	Tableta	Oral	{"adulto": "250-500 mg c/8h"}	Antihipertensivo embarazo	f	t	\N	2026-06-23 00:30:59.708
seed__cido_tranex_mico	Ácido Tranexámico	{Dicynone,Cyclokapron,"Ácido Tranexámico Leti"}	{"250 mg","500 mg","500 mg/5ml"}	Tableta	Oral	{"adulto": "500-1000 mg c/8h"}	Hemostático	f	t	\N	2026-06-23 00:30:59.72
seed_metotrexato	Metotrexato	{"Metotrexato Leti","Methotrexate Calox"}	{"2.5 mg","10 mg","25 mg/ml"}	Tableta	Oral	{"adulto": "7.5-25 mg semanal"}	Inmunosupresor	f	t	\N	2026-06-23 00:30:59.727
seed_hidroxicloroquina	Hidroxicloroquina	{Plaquenil,"Hidroxicloroquina Leti"}	{"200 mg"}	Tableta	Oral	{"adulto": "200-400 mg c/24h"}	Antiinflamatorio	f	t	\N	2026-06-23 00:30:59.733
seed_colchicina	Colchicina	{"Colchicina Leti",Colcrys}	{"0.5 mg","1 mg"}	Tableta	Oral	{"adulto": "0.5-1 mg c/12h"}	Antigotoso	f	t	\N	2026-06-23 00:30:59.739
seed_alopurinol	Alopurinol	{Zyloric,"Alopurinol Leti","Alopurinol Calox"}	{"100 mg","300 mg"}	Tableta	Oral	{"adulto": "300-600 mg c/24h"}	Antigotoso	f	t	\N	2026-06-23 00:30:59.745
seed_betametasona_crema	Betametasona crema	{"Betametasona Leti crema",Diprosone,"Celestone crema"}	{0.05%,0.1%}	Crema	Tópica	{"adulto": "Aplicar c/12h"}	Corticosteroide tópico	f	t	\N	2026-06-23 00:30:59.751
seed_hidrocortisona_crema	Hidrocortisona crema	{Cortaid,"Hidrocortisona Leti crema"}	{0.5%,1%,2.5%}	Crema	Tópica	{"adulto": "Aplicar c/8-12h"}	Corticosteroide tópico	f	t	\N	2026-06-23 00:30:59.754
seed_mupirocina	Mupirocina	{Bactroban,"Mupirocina Leti"}	{2%}	Ungüento	Tópica	{"adulto": "Aplicar c/8h x 5-7 días"}	Antibiótico tópico	f	t	\N	2026-06-23 00:30:59.762
seed_tretino_na	Tretinoína	{Retin-A,"Tretinoína Leti",Vitacid}	{0.025%,0.05%,0.1%}	Crema	Tópica	{"adulto": "Aplicar en noche"}	Retinoides tópicos	f	t	\N	2026-06-23 00:30:59.768
seed_tobramicina_gotas	Tobramicina gotas	{Tobrex,"Tobramicina Leti"}	{0.3%}	Solución oftálmica	Oftálmica	{"adulto": "1-2 gotas c/4-6h", "pediatrico": "1 gota c/6h"}	Antibiótico oftálmico	f	t	\N	2026-06-23 00:30:59.776
seed_timolol_gotas	Timolol gotas	{Timoptol,"Timolol Leti"}	{0.25%,0.5%}	Solución oftálmica	Oftálmica	{"adulto": "1 gota c/12h"}	Antiglaucoma	f	t	\N	2026-06-23 00:30:59.782
seed_latanoprost_gotas	Latanoprost gotas	{Xalatan,"Latanoprost Leti"}	{0.005%}	Solución oftálmica	Oftálmica	{"adulto": "1 gota cada noche"}	Antiglaucoma	f	t	\N	2026-06-23 00:30:59.796
seed_dexametasona_oft_lmica	Dexametasona oftálmica	{Maxidex,"Dexametasona Leti gotas"}	{0.1%}	Solución oftálmica	Oftálmica	{"adulto": "1-2 gotas c/6h"}	Corticosteroide oftálmico	f	t	\N	2026-06-23 00:30:59.8
seed_atropina	Atropina	{"Atropina Pifano","Atropina Ponce","Atropin Behrens"}	{"0.5 mg/ml","1 mg/ml"}	Solución inyectable	Intramuscular	{"adulto": "0.5-1 mg IV/IM"}	Anticolinérgico	f	t	\N	2026-06-23 00:30:59.808
seed_epinefrina_adrenalina_	Epinefrina (Adrenalina)	{"Adrenalina Roemmers","Adrenalina Ponce",EpiPen}	{"1 mg/ml","0.5 mg/ml"}	Solución inyectable	Intramuscular	{"adulto": "0.3-0.5 mg IM (anafilaxia)", "pediatrico": "0.01 mg/kg IM"}	Simpaticomimético	f	t	\N	2026-06-23 00:30:59.828
seed_hidralazina	Hidralazina	{Apresolina,"Hidralazina Leti"}	{"10 mg","25 mg","50 mg","20 mg/ml"}	Tableta	Oral	{"adulto": "25-50 mg c/6h"}	Antihipertensivo	f	t	\N	2026-06-23 00:30:59.85
seed_sulfato_de_magnesio	Sulfato de Magnesio	{"Sulfato de Magnesio Leti","MgSO4 Calox"}	{10%,20%,50%}	Solución inyectable	Intravenosa	{"adulto": "4-6 g IV bolo (eclampsia)"}	Mineral	f	t	\N	2026-06-23 00:30:59.866
seed_citicoline	Citicoline	{Somazina,"Citicoline Leti"}	{"250 mg","500 mg","1000 mg","250 mg/ml"}	Tableta	Oral	{"adulto": "500-2000 mg/día"}	Neuroprotector	f	t	\N	2026-06-23 00:30:59.871
seed_piracetam	Piracetam	{Nootropil,"Piracetam Leti"}	{"400 mg","800 mg","1200 mg"}	Tableta	Oral	{"adulto": "800 mg c/8h"}	Nootrópico	f	t	\N	2026-06-23 00:30:59.897
seed_sildenafil	Sildenafil	{Viagra,Revatio,"Sildenafil Leti"}	{"25 mg","50 mg","100 mg"}	Tableta	Oral	{"adulto": "50 mg 1h antes"}	Inhibidor de PDE5	f	t	\N	2026-06-23 00:30:59.908
seed_tadalafil	Tadalafil	{Cialis,"Tadalafil Leti"}	{"2.5 mg","5 mg","10 mg","20 mg"}	Tableta	Oral	{"adulto": "10-20 mg antes"}	Inhibidor de PDE5	f	t	\N	2026-06-23 00:30:59.918
seed_ciproterona	Ciproterona	{Androcur}	{"50 mg"}	Tableta	Oral	{"adulto": "50-100 mg/día"}	Antiandrógeno	f	t	\N	2026-06-23 00:30:59.924
seed_betahistina	Betahistina	{Serc,"Betahistina Leti"}	{"8 mg","16 mg","24 mg"}	Tableta	Oral	{"adulto": "16-24 mg c/8h"}	Antivertiginoso	f	t	\N	2026-06-23 00:30:59.93
seed_dimenhidrinato	Dimenhidrinato	{Dramamine,"Dimenhidrinato Leti"}	{"50 mg","12.5 mg/5ml"}	Tableta	Oral	{"adulto": "50-100 mg c/4-6h"}	Antiemético	f	t	\N	2026-06-23 00:30:59.935
seed_ergotamina_cafe_na	Ergotamina + Cafeína	{Cafergot,Migral}	{"1/100 mg","2/100 mg"}	Tableta	Oral	{"adulto": "2 tabletas al inicio migraña"}	Antimigrañoso	f	t	\N	2026-06-23 00:30:59.938
seed_sumatript_n	Sumatriptán	{Imitrex,Imigran,"Sumatriptán Leti"}	{"25 mg","50 mg","100 mg","20 mg spray nasal"}	Tableta	Oral	{"adulto": "50-100 mg al inicio migraña"}	Antimigrañoso	f	t	\N	2026-06-23 00:30:59.94
seed_tocol_tico_ritodrina	Tocolítico Ritodrina	{Yutopar,"Ritodrina Leti"}	{"10 mg","0.3 mg/ml"}	Tableta	Oral	{"adulto": "10-20 mg c/4-6h"}	Tocolítico	f	t	\N	2026-06-23 00:30:59.943
seed_espasmo_analgesia_hioscina_dipirona_	Espasmo + Analgesia (Hioscina + Dipirona)	{"Buscopan Compositum",Algopirina}	{"10 mg + 500 mg","20 mg/ml + 2.5 g/5ml"}	Tableta	Oral	{"adulto": "1-2 tabletas c/8h"}	Antiespasmódico	f	t	\N	2026-06-23 00:30:59.958
seed_hioscina_butilescopolamina_	Hioscina (Butilescopolamina)	{Buscopan,"Espasmolítico Leti"}	{"10 mg","20 mg/ml"}	Tableta	Oral	{"adulto": "10-20 mg c/6-8h"}	Antiespasmódico	f	t	\N	2026-06-23 00:31:00.001
seed_trimebutina	Trimebutina	{Modulon,"Trimebutina Leti"}	{"100 mg","200 mg"}	Tableta	Oral	{"adulto": "200 mg c/8h"}	Antiespasmódico	f	t	\N	2026-06-23 00:31:00.011
seed_diosmectita	Diosmectita	{Smecta,"Diosmectita Leti"}	{"3 g/sobre"}	Polvo oral	Oral	{"adulto": "3 g c/8h", "pediatrico": "3 g c/24h"}	Antidiarreico	f	t	\N	2026-06-23 00:31:00.02
seed_probi_ticos_lactobacillus_	Probióticos (Lactobacillus)	{"Lacteol Fort",Enterogermina,"Probióticos Leti"}	{"5 x 10⁸ UFC","2 x 10⁹ UFC"}	Cápsula	Oral	{"adulto": "1-2 cápsulas c/12h", "pediatrico": "1 cápsula c/24h"}	Probiótico	f	t	\N	2026-06-23 00:31:00.034
seed_enoxaparina	Enoxaparina	{Clexane,"Enoxaparina Leti"}	{"20 mg/0.2ml","40 mg/0.4ml","60 mg/0.6ml","80 mg/0.8ml"}	Solución inyectable	Subcutánea	{"adulto": "40 mg c/24h (profilaxis)"}	Anticoagulante	f	t	\N	2026-06-23 00:31:00.042
seed_heparina_s_dica	Heparina Sódica	{"Heparina Leti","Heparina Calox"}	{"5000 UI/ml","25000 UI/5ml"}	Solución inyectable	Intravenosa	{"adulto": "Según protocolo"}	Anticoagulante	f	t	\N	2026-06-23 00:31:00.047
seed_oxitocina	Oxitocina	{"Oxitocina Leti",Syntocinon}	{"5 UI/ml","10 UI/ml"}	Solución inyectable	Intravenosa	{"adulto": "Según protocolo"}	Uterotónico	f	t	\N	2026-06-23 00:31:00.093
seed_vitamina_k1_fitomenadiona_	Vitamina K1 (Fitomenadiona)	{Konakion,"Fitomenadiona Leti"}	{"1 mg/0.1ml","10 mg/ml"}	Solución inyectable	Intramuscular	{"adulto": "10 mg IM", "pediatrico": "1 mg IM (RN)"}	Vitamina	f	t	\N	2026-06-23 00:31:00.102
seed_gluconato_de_calcio	Gluconato de Calcio	{"Gluconato de Calcio Leti",Calciofon}	{10%,"100 mg/ml"}	Solución inyectable	Intravenosa	{"adulto": "1 g IV lento"}	Mineral	f	t	\N	2026-06-23 00:31:00.114
seed_dextrosa	Dextrosa	{"Dextrosa al 5%","Dextrosa al 10%","Dextrosa al 50%"}	{5%,10%,50%}	Solución para infusión	Intravenosa	{"adulto": "Según requerimientos"}	Solución electrolítica	f	t	\N	2026-06-23 00:31:00.117
seed_cloruro_de_sodio_soluci_n_salina_	Cloruro de Sodio (Solución Salina)	{"Solución Salina 0.9%","NaCl 0.9%"}	{0.9%}	Solución para infusión	Intravenosa	{"adulto": "Según requerimientos"}	Solución electrolítica	f	t	\N	2026-06-23 00:31:00.121
seed_lactato_de_ringer	Lactato de Ringer	{"Lactato Ringer Leti","Solución Hartmann"}	{"Concentración estándar"}	Solución para infusión	Intravenosa	{"adulto": "Según requerimientos"}	Solución electrolítica	f	t	\N	2026-06-23 00:31:00.126
seed_naloxona	Naloxona	{Narcan,"Naloxona Leti"}	{"0.4 mg/ml","1 mg/ml"}	Solución inyectable	Intravenosa	{"adulto": "0.4-2 mg IV (intoxicación opiácea)"}	Antídoto	f	t	\N	2026-06-23 00:31:00.129
seed_flumazenil	Flumazenil	{Anexate,"Flumazenil Leti"}	{"0.1 mg/ml"}	Solución inyectable	Intravenosa	{"adulto": "0.2-0.5 mg IV"}	Antídoto	f	t	\N	2026-06-23 00:31:00.133
seed_midazolam	Midazolam	{Dormicum,"Midazolam Leti"}	{"1 mg/ml","5 mg/ml","15 mg/3ml"}	Solución inyectable	Intramuscular	{"adulto": "2.5-5 mg IM", "pediatrico": "0.1-0.15 mg/kg IM"}	Benzodiacepina	f	t	\N	2026-06-23 00:31:00.138
seed_ketamina	Ketamina	{Ketalar,"Ketamina Leti"}	{"50 mg/ml","100 mg/ml"}	Solución inyectable	Intravenosa	{"adulto": "1-2 mg/kg IV"}	Anestésico	f	t	\N	2026-06-23 00:31:00.143
seed_lidoca_na	Lidocaína	{Xilocaína,"Lidocaína Leti","Lidocaína Calox"}	{1%,2%,5%}	Solución inyectable	Local	{"adulto": "Según procedimiento"}	Anestésico local	f	t	\N	2026-06-23 00:31:00.148
seed_bupivaca_na	Bupivacaína	{Marcaína,"Bupivacaína Leti"}	{0.25%,0.5%,0.75%}	Solución inyectable	Local	{"adulto": "Según procedimiento"}	Anestésico local	f	t	\N	2026-06-23 00:31:00.152
seed_tioridazina	Tioridazina	{Melleril,"Tioridazina Leti"}	{"10 mg","25 mg","50 mg","100 mg"}	Tableta	Oral	{"adulto": "50-100 mg c/8h"}	Antipsicótico	f	t	\N	2026-06-23 00:31:00.157
seed_quetiapina	Quetiapina	{Seroquel,"Quetiapina Leti"}	{"25 mg","50 mg","100 mg","200 mg","300 mg","400 mg"}	Tableta	Oral	{"adulto": "50-300 mg/día"}	Antipsicótico	f	t	\N	2026-06-23 00:31:00.162
seed_olanzapina	Olanzapina	{Zyprexa,"Olanzapina Leti"}	{"2.5 mg","5 mg","10 mg","15 mg"}	Tableta	Oral	{"adulto": "5-20 mg c/24h"}	Antipsicótico	f	t	\N	2026-06-23 00:31:00.166
seed_venlafaxina	Venlafaxina	{Effexor,"Venlafaxina Leti"}	{"37.5 mg","75 mg","150 mg"}	Cápsula	Oral	{"adulto": "75-150 mg c/24h"}	Antidepresivo	f	t	\N	2026-06-23 00:31:00.17
seed_paroxetina	Paroxetina	{Paxil,"Paroxetina Leti"}	{"10 mg","20 mg","30 mg"}	Tableta	Oral	{"adulto": "20 mg c/24h"}	Antidepresivo	f	t	\N	2026-06-23 00:31:00.174
seed_bupropi_n	Bupropión	{Wellbutrin,"Bupropión Leti"}	{"100 mg","150 mg","300 mg"}	Tableta	Oral	{"adulto": "150-300 mg c/24h"}	Antidepresivo	f	t	\N	2026-06-23 00:31:00.184
seed_mirtazapina	Mirtazapina	{Remeron,"Mirtazapina Leti"}	{"15 mg","30 mg","45 mg"}	Tableta	Oral	{"adulto": "15-45 mg antes de dormir"}	Antidepresivo	f	t	\N	2026-06-23 00:31:00.188
seed_tizanidina	Tizanidina	{Zanaflex,"Tizanidina Leti",Sirdalud}	{"2 mg","4 mg"}	Tableta	Oral	{"adulto": "2-4 mg c/8h"}	Relajante muscular	f	t	\N	2026-06-23 00:31:00.195
seed_ciclobenzaprina	Ciclobenzaprina	{Flexeril,"Ciclobenzaprina Leti"}	{"5 mg","10 mg"}	Tableta	Oral	{"adulto": "5-10 mg c/8h"}	Relajante muscular	f	t	\N	2026-06-23 00:31:00.201
seed_metocarbamol	Metocarbamol	{Robaxin,"Metocarbamol Leti",Muscoril}	{"500 mg","750 mg"}	Tableta	Oral	{"adulto": "750 mg c/6h"}	Relajante muscular	f	t	\N	2026-06-23 00:31:00.204
seed_carisoprodol	Carisoprodol	{Soma,"Carisoprodol Leti","Dorixina Flex"}	{"350 mg"}	Tableta	Oral	{"adulto": "350 mg c/6h"}	Relajante muscular	f	t	\N	2026-06-23 00:31:00.215
seed_tiocolchicoside	Tiocolchicoside	{Muscoril,"Tiocolchicoside Biotech"}	{"4 mg","8 mg"}	Tableta	Oral	{"adulto": "4-8 mg c/12h"}	Relajante muscular	f	t	\N	2026-06-23 00:31:00.222
seed_baclofeno	Baclofeno	{Lioresal,"Baclofeno Leti"}	{"10 mg","25 mg"}	Tableta	Oral	{"adulto": "5-20 mg c/8h"}	Relajante muscular	f	t	\N	2026-06-23 00:31:00.234
seed_glucosamina	Glucosamina	{Osteoartril,"Glucosamina Leti",Artrodin}	{"500 mg","1500 mg"}	Tableta	Oral	{"adulto": "1500 mg c/24h"}	Condroprotector	f	t	\N	2026-06-23 00:31:00.239
seed_diacere_na	Diacereína	{Artrodar,"Diacereína Leti"}	{"50 mg"}	Cápsula	Oral	{"adulto": "50 mg c/12h"}	Condroprotector	f	t	\N	2026-06-23 00:31:00.249
seed_clonidina	Clonidina	{Catapresan,"Clonidina Leti"}	{"0.1 mg","0.2 mg"}	Tableta	Oral	{"adulto": "0.1-0.2 mg c/12h"}	Antihipertensivo	f	t	\N	2026-06-23 00:31:00.253
seed_doxazosina	Doxazosina	{Cardura,"Doxazosina Leti"}	{"1 mg","2 mg","4 mg","8 mg"}	Tableta	Oral	{"adulto": "1-8 mg c/24h"}	Antihipertensivo	f	t	\N	2026-06-23 00:31:00.261
seed_fenobarbital	Fenobarbital	{Luminal,"Fenobarbital Leti"}	{"15 mg","30 mg","60 mg","100 mg"}	Tableta	Oral	{"adulto": "30-120 mg c/8h"}	Antiepiléptico	f	t	\N	2026-06-23 00:31:00.272
seed_topiramato	Topiramato	{Topamax,"Topiramato Leti"}	{"25 mg","50 mg","100 mg","200 mg"}	Tableta	Oral	{"adulto": "25-200 mg c/12h"}	Antiepiléptico	f	t	\N	2026-06-23 00:31:00.277
seed_lacosamida	Lacosamida	{Vimpat,"Lacosamida Leti"}	{"50 mg","100 mg","150 mg","200 mg"}	Tableta	Oral	{"adulto": "100-200 mg c/12h"}	Antiepiléptico	f	t	\N	2026-06-23 00:31:00.286
seed_melatonina	Melatonina	{"Melatonina Leti",Circadin}	{"1 mg","3 mg","5 mg","10 mg"}	Tableta	Oral	{"adulto": "3-5 mg antes de dormir"}	Hipnótico	f	t	\N	2026-06-23 00:31:00.299
seed_modafinilo	Modafinilo	{Provigil,"Modafinilo Leti"}	{"100 mg","200 mg"}	Tableta	Oral	{"adulto": "200 mg en la mañana"}	Estimulante	f	t	\N	2026-06-23 00:31:00.307
seed_metilsulfonilmetano_msm_	Metilsulfonilmetano (MSM)	{"MSM Leti",Flexamín}	{"500 mg","1000 mg"}	Cápsula	Oral	{"adulto": "1000-2000 mg c/24h"}	Condroprotector	f	t	\N	2026-06-23 00:31:00.31
seed_carbonato_de_calcio	Carbonato de Calcio	{Tums,"Carbonato Calcio Leti",Calcimax}	{"500 mg","750 mg","1000 mg"}	Tableta	Oral	{"adulto": "500-1000 mg c/12h"}	Antiácido/Mineral	f	t	\N	2026-06-23 00:31:00.314
seed_bicarbonato_de_sodio	Bicarbonato de Sodio	{"Bicarbonato Leti"}	{"525 mg",8.4%}	Tableta	Oral	{"adulto": "1-3 tabletas c/8h"}	Antiácido	f	t	\N	2026-06-23 00:31:00.318
seed_metronidazol_vaginal	Metronidazol vaginal	{"Flagyl vaginal","Metronidazol Leti vaginal"}	{"500 mg óvulo","0.75% gel"}	Óvulo vaginal	Vaginal	{"adulto": "1 óvulo por noche x 7 días"}	Antibiótico ginecológico	f	t	\N	2026-06-23 00:31:00.321
seed_clindamicina_vaginal	Clindamicina vaginal	{"Dalacin V","Clindamicina vaginal Leti"}	{"2% crema","100 mg óvulo"}	Crema vaginal	Vaginal	{"adulto": "1 aplicador por noche x 7 días"}	Antibiótico ginecológico	f	t	\N	2026-06-23 00:31:00.325
seed_terconazol	Terconazol	{Terazol,"Terconazol Leti"}	{0.4%,0.8%,"80 mg óvulo"}	Crema vaginal	Vaginal	{"adulto": "1 aplicador por noche x 3-7 días"}	Antifúngico ginecológico	f	t	\N	2026-06-23 00:31:00.335
seed_rifampicina	Rifampicina	{"Rifampicina Leti",Rimactan}	{"150 mg","300 mg","600 mg"}	Cápsula	Oral	{"adulto": "600 mg c/24h (TBC)"}	Antituberculoso	f	t	\N	2026-06-23 00:31:00.341
seed_isoniacida	Isoniacida	{"Isoniacida Leti",Rimifón}	{"100 mg","300 mg"}	Tableta	Oral	{"adulto": "300 mg c/24h (TBC)", "pediatrico": "5-10 mg/kg/día"}	Antituberculoso	f	t	\N	2026-06-23 00:31:00.347
seed_etambutol	Etambutol	{Myambutol,"Etambutol Leti"}	{"400 mg"}	Tableta	Oral	{"adulto": "15-20 mg/kg/día (TBC)"}	Antituberculoso	f	t	\N	2026-06-23 00:31:00.35
seed_pirazinamida	Pirazinamida	{"Pirazinamida Leti"}	{"500 mg"}	Tableta	Oral	{"adulto": "1.5-2 g c/24h (TBC)"}	Antituberculoso	f	t	\N	2026-06-23 00:31:00.355
seed_eritropoyetina	Eritropoyetina	{Eprex,"Eritropoyetina Leti"}	{"2000 UI","4000 UI","10000 UI"}	Solución inyectable	Subcutánea	{"adulto": "50-150 UI/kg 3x semana"}	Hematológico	f	t	\N	2026-06-23 00:31:00.36
seed_filgrastim_g_csf_	Filgrastim (G-CSF)	{Neupogen,"Filgrastim Leti"}	{"300 mcg/ml","480 mcg/ml"}	Solución inyectable	Subcutánea	{"adulto": "5-10 mcg/kg/día"}	Hematológico	f	t	\N	2026-06-23 00:31:00.368
seed_acetaminofen	Acetaminofen	{"Acetaminofen Biogalenic","Acetaminofen Biotech","Acetaminofen Calox","Acetaminofen Cofasa","Acetaminofen Elmor","Acetaminofen Elter"}	{"500 mg","120 mg/5 ml","650 mg","250 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:00.375
seed_acido_acetilsalicilico	Acido Acetilsalicilico	{"Acido Acetilsalicilico Calox","Acido Acetilsalicilico Kimiceg","Acido Acetilsalicilico Meyer","Acido Acetilsalicilico Spefar"}	{"gastrorresistente 81 mg","81 mg","recubierto con pel&iacute;cula 81 mg","100 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:00.382
seed_acido_folico	Acido Folico	{"Acido Folico Calox","Acido Folico Gencer","Acido Folico Generico De Calidad","Acido Folico Leti","Acido Folico Lister","Acido Folico Meyer"}	{"10 mg","5 mg","0.4 mg"}	Comprimido	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:00.411
seed_adacel	Adacel	{Adacel}	{}	Soluci&oacute;n inyectable	Intravenosa	\N	Vacunas	f	t	\N	2026-06-23 00:31:00.415
seed_alendronato	Alendronato	{"Alendronato Calox","Alendronato Genfar","Alendronato Ofa"}	{"70 mg","10 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:00.508
seed_alendronato_sodico	Alendronato Sodico	{"Alendronato Sodico Kimiceg","Alendronato Sodico Leti","Alendronato Sodico Meyer","Alendronato Sodico Spefar","Alendronato Sodico Valmorca"}	{"10 mg","70 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:00.514
seed_ambroxol_clenbuterol	Ambroxol Clenbuterol	{"Ambroxol Clenbuterol Calox","Ambroxol Clenbuterol Generico De Calidad","Ambroxol Clenbuterol Kimiceg","Ambroxol Clenbuterol Meyer","Ambroxol Clenbuterol New Pharma","Ambroxol Clenbuterol Spefar"}	{"15 mg/5 ml+0.01 mg/5 ml","7.5 mg/5 ml+0.005 mg/5 ml"}	Jarabe	Oral	\N	General	f	t	\N	2026-06-23 00:31:00.52
seed_amiodarona_clorhidrato	Amiodarona Clorhidrato	{"Amiodarona Clorhidrato Biotech"}	{"200 mg"}	Comprimido	Oral	\N	Cardiología	f	t	\N	2026-06-23 00:31:00.538
seed_amlodipina	Amlodipina	{"Amlodipina Biotech","Amlodipina Calox","Amlodipina Cofasa","Amlodipina Elter","Amlodipina Generico De Calidad","Amlodipina Kimiceg"}	{"10 mg","5 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:00.544
seed_amoxicilina_acido_clavulanico	Amoxicilina Acido Clavulanico	{"Amoxicilina Acido Clavulanico Calox","Amoxicilina Acido Clavulanico Leti"}	{"recubierto con pel&iacute;cula 500 mg+125 mg","recubierto 500 mg+125 mg"}	Comprimido	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.551
seed_amoxicilina_calox_c_aacute_psula_dura_500_mg	Amoxicilina Calox C&Aacute;Psula Dura 500 Mg	{"Amoxicilina Calox C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.558
seed_amoxicilina_kimiceg_c_aacute_psula_dura_500_mg	Amoxicilina Kimiceg C&Aacute;Psula Dura 500 Mg	{"Amoxicilina Kimiceg C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.586
seed_amoxicilina_leti_c_aacute_psula_dura_500_mg	Amoxicilina Leti C&Aacute;Psula Dura 500 Mg	{"Amoxicilina Leti C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.593
seed_amoxicilina_lister_c_aacute_psula_dura_250_mg	Amoxicilina Lister C&Aacute;Psula Dura 250 Mg	{"Amoxicilina Lister C&Aacute;Psula Dura 250 Mg"}	{"250 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.599
seed_amoxicilina_lister_c_aacute_psula_dura_500_mg	Amoxicilina Lister C&Aacute;Psula Dura 500 Mg	{"Amoxicilina Lister C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.619
seed_amoxicilina_meyer_c_aacute_psula_dura_500_mg	Amoxicilina Meyer C&Aacute;Psula Dura 500 Mg	{"Amoxicilina Meyer C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.634
seed_amoxicilina_new_pharma_c_aacute_psula_dura_500_mg	Amoxicilina New Pharma C&Aacute;Psula Dura 500 Mg	{"Amoxicilina New Pharma C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.646
seed_amoxicilina_proula_c_aacute_psula_dura_500_mg	Amoxicilina Proula C&Aacute;Psula Dura 500 Mg	{"Amoxicilina Proula C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.652
seed_amoxicilina_quim_far_c_aacute_psula_dura_500_mg	Amoxicilina Quim Far C&Aacute;Psula Dura 500 Mg	{"Amoxicilina Quim Far C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.657
seed_amoxicilina_sm_pharma_c_aacute_psula_dura_500_mg	Amoxicilina Sm Pharma C&Aacute;Psula Dura 500 Mg	{"Amoxicilina Sm Pharma C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.661
seed_amoxicilina_spefar_c_aacute_psula_dura_250_mg	Amoxicilina Spefar C&Aacute;Psula Dura 250 Mg	{"Amoxicilina Spefar C&Aacute;Psula Dura 250 Mg"}	{"250 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.664
seed_amoxicilina_vivax_c_aacute_psula_dura_500_mg	Amoxicilina Vivax C&Aacute;Psula Dura 500 Mg	{"Amoxicilina Vivax C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.686
seed_ampicilina_calox_c_aacute_psula_dura_250_mg	Ampicilina Calox C&Aacute;Psula Dura 250 Mg	{"Ampicilina Calox C&Aacute;Psula Dura 250 Mg"}	{"250 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.693
seed_ampicilina_calox_c_aacute_psula_dura_500_mg	Ampicilina Calox C&Aacute;Psula Dura 500 Mg	{"Ampicilina Calox C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.701
seed_ampicilina_elter_c_aacute_psula_dura_500_mg	Ampicilina Elter C&Aacute;Psula Dura 500 Mg	{"Ampicilina Elter C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.705
seed_acido_ascorbico	Acido Ascorbico	{"Acido Ascorbico Diamedica","Acido Ascorbico Quim Far"}	{"500 mg","1 g"}	Soluci&oacute;n inyectable 100 mg/ml	Intravenosa	\N	Vitaminas	f	t	\N	2026-06-23 00:31:00.403
seed_adrenalina	Adrenalina	{"Adrenalina Roemmers","Adrenalina Ponce","Adrenalina Medifarm"}	{"1 mg","1 mg/ml"}	Soluci&oacute;n inyectable 1 mg/1 ml	Intravenosa	\N	Cardiología	f	t	\N	2026-06-23 00:31:00.418
seed_adriblastina	Adriblastina	{Adriblastina}	{"10 mg","50 mg"}	Polvo para soluci&oacute;n para perfusi&oacute;n 50 mg+25 ml	Oral	\N	Oncología	f	t	\N	2026-06-23 00:31:00.421
seed_ampicilina_sulbactam	Ampicilina + Sulbactam	{"Ampicilina Sulbactam Biogalenic","Ampicilina Sulbactam Calox","Ampicilina Sulbactam Leti","Ampicilina Sulbactam Vitalis"}	{}	Polvo para soluci&oacute;n inyectable 1 g+500 mg	Intravenosa	{"adulto": "3 g c/6h"}	Antibióticos	f	t	\N	2026-06-23 00:30:57.663
seed_artren	Artren	{Artren}	{}	Soluci&oacute;n inyectable 75 mg/3 ml	Intravenosa	\N	General	f	t	\N	2026-06-23 00:31:00.833
seed_aspirina	Aspirina	{Aspirina}	{"100 mg","500 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:00.838
seed_atenolol_clortalidona	Atenolol Clortalidona	{"Atenolol Clortalidona Leti"}	{"100 mg+25 mg","50 mg+12.5 mg"}	Comprimido	Oral	\N	Cardiología	f	t	\N	2026-06-23 00:31:00.844
seed_avaxim	Avaxim	{Avaxim}	{}	Suspensi&oacute;n inyectable 160 IU/0.5 ml	Intravenosa	\N	Vacunas	f	t	\N	2026-06-23 00:31:00.847
seed_bacitracina	Bacitracina	{"Bacitracina Calox","Bacitracina Kimiceg","Bacitracina Lister","Bacitracina Pfizer","Bacitracina Roemmers","Bacitracina Ronava"}	{"500 IU/g","500 IU/g+2 000 IU/g"}	Pomada	Tópica	\N	General	f	t	\N	2026-06-23 00:31:00.871
seed_betametasona_clotrimazol_neomicina	Betametasona Clotrimazol Neomicina	{"Betametasona Clotrimazol Neomicina Genfar"}	{0.05&#37;+1&#37;+0.83&#37;}	Crema	Tópica	\N	Reumatología	f	t	\N	2026-06-23 00:31:00.878
seed_bromazepam	Bromazepam	{"Bromazepam Calox","Bromazepam Giempi","Bromazepam Leti","Bromazepam Meyer","Bromazepam Ofa","Bromazepam Spefar"}	{"3 mg","6 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:00.883
seed_bromexina	Bromexina	{"Bromexina Cofasa","Bromexina Polinac"}	{"4 mg/5 ml","8 mg/5 ml"}	Jarabe	Oral	\N	General	f	t	\N	2026-06-23 00:31:00.886
seed_bromhexina	Bromhexina	{"Bromhexina Elter","Bromhexina Lister","Bromhexina Ofa","Bromhexina Pifano","Bromhexina Sankyo","Bromhexina Spefar"}	{"4 mg/5 ml","8 mg/5 ml"}	Jarabe	Oral	\N	General	f	t	\N	2026-06-23 00:31:00.89
cmqv6fdef000l01qow8lyhtxx	Notolac	{}	{30mg}	Tableta	Sublingual	\N	Personalizado	t	t	cmqlsyn9e000301qgk98rcsjh	2026-06-26 16:59:57.207
seed_ampicilina_leti_c_aacute_psula_dura_500_mg	Ampicilina Leti C&Aacute;Psula Dura 500 Mg	{"Ampicilina Leti C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.724
seed_ampicilina_lister_c_aacute_psula_dura_500_mg	Ampicilina Lister C&Aacute;Psula Dura 500 Mg	{"Ampicilina Lister C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.737
seed_ampicilina_meyer_c_aacute_psula_dura_250_mg	Ampicilina Meyer C&Aacute;Psula Dura 250 Mg	{"Ampicilina Meyer C&Aacute;Psula Dura 250 Mg"}	{"250 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.745
seed_ampicilina_meyer_c_aacute_psula_dura_500_mg	Ampicilina Meyer C&Aacute;Psula Dura 500 Mg	{"Ampicilina Meyer C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.751
seed_ampicilina_pfizer_c_aacute_psula_dura_500_mg	Ampicilina Pfizer C&Aacute;Psula Dura 500 Mg	{"Ampicilina Pfizer C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.757
seed_ampicilina_plusandex_c_aacute_psula_dura_500_mg	Ampicilina Plusandex C&Aacute;Psula Dura 500 Mg	{"Ampicilina Plusandex C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.764
seed_ampicilina_proula_c_aacute_psula_dura_500_mg	Ampicilina Proula C&Aacute;Psula Dura 500 Mg	{"Ampicilina Proula C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.77
seed_ampicilina_quim_far_c_aacute_psula_dura_500_mg	Ampicilina Quim Far C&Aacute;Psula Dura 500 Mg	{"Ampicilina Quim Far C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.78
seed_ampicilina_ronava_c_aacute_psula_dura_250_mg	Ampicilina Ronava C&Aacute;Psula Dura 250 Mg	{"Ampicilina Ronava C&Aacute;Psula Dura 250 Mg"}	{"250 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.788
seed_ampicilina_ronava_c_aacute_psula_dura_500_mg	Ampicilina Ronava C&Aacute;Psula Dura 500 Mg	{"Ampicilina Ronava C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.798
seed_ampicilina_sm_pharma_c_aacute_psula_dura_500_mg	Ampicilina Sm Pharma C&Aacute;Psula Dura 500 Mg	{"Ampicilina Sm Pharma C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.81
seed_ampicilina_spefar_c_aacute_psula_dura_250_mg	Ampicilina Spefar C&Aacute;Psula Dura 250 Mg	{"Ampicilina Spefar C&Aacute;Psula Dura 250 Mg"}	{"250 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.815
seed_azitromicina_biotech_c_aacute_psula_dura_500_mg	Azitromicina Biotech C&Aacute;Psula Dura 500 Mg	{"Azitromicina Biotech C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.85
seed_azitromicina_kimiceg_c_aacute_psula_dura_500_mg	Azitromicina Kimiceg C&Aacute;Psula Dura 500 Mg	{"Azitromicina Kimiceg C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.854
seed_azitromicina_lister_c_aacute_psula_dura_500_mg	Azitromicina Lister C&Aacute;Psula Dura 500 Mg	{"Azitromicina Lister C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.856
seed_azitromicina_proula_c_aacute_psula_dura_500_mg	Azitromicina Proula C&Aacute;Psula Dura 500 Mg	{"Azitromicina Proula C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.862
seed_aztreonam	Aztreonam	{"Aztreonam Vitalis"}	{"500 mg","1 g","2 g"}	Polvo para soluci&oacute;n inyectable 1 g	Intravenosa	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.865
seed_benzoato_de_bencilo	Benzoato De Bencilo	{"Benzoato De Bencilo Pifano","Benzoato De Bencilo Spefar"}	{"25% loción"}	Emulsi&oacute;n cut&aacute;nea 25&#37;	Oral	\N	General	f	t	\N	2026-06-23 00:31:00.875
seed_calcio_carbonato_vitamina_d3	Calcio Carbonato Vitamina D3	{"Calcio Carbonato Vitamina D3 Natural Systems"}	{"600 mg+200 IU"}	Comprimido	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:00.894
seed_calcio_citrato	Calcio Citrato	{"Calcio Citrato Now"}	{"600 mg"}	Comprimido	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:00.898
seed_calcio_k	Calcio K	{"Calcio K"}	{"para suspensi&oacute;n oral 2 g+5 g"}	Granulado	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:00.903
seed_calcio_magnesio	Calcio Magnesio	{"Calcio Magnesio Now"}	{"500 mg+250 mg"}	Comprimido	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:00.907
seed_calcio_vitamina_d	Calcio + Vitamina D	{"Calcio Vitamina D Genfar"}	{"600 mg+200 IU"}	Comprimido	Oral	{"adulto": "1000 mg calcio + 800 UI D3/día"}	Vitaminas	f	t	\N	2026-06-23 00:30:59.028
seed_candesartan	Candesartan	{"Candesartan Elter","Candesartan Gencer","Candesartan Genfar","Candesartan Kimiceg","Candesartan Leti","Candesartan Valmorca"}	{"16 mg","8 mg","recubierto 8 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:00.923
seed_captopril	Captopril	{"Captopril Biogalenic","Captopril Calox","Captopril Elter","Captopril Generico De Calidad","Captopril Genfar","Captopril Kimiceg"}	{"25 mg","50 mg","dispersable 25 mg","dispersable 50 mg"}	Comprimido	Oral	\N	Cardiología	f	t	\N	2026-06-23 00:31:00.928
seed_cefadroxilo	Cefadroxilo	{"Cefadroxilo Calox","Cefadroxilo Elter","Cefadroxilo Gencer","Cefadroxilo Generico De Calidad","Cefadroxilo Genfar","Cefadroxilo Kimiceg"}	{"500 mg"}	Polvo para suspensi&oacute;n oral 250 mg/5 ml	Oral	\N	General	f	t	\N	2026-06-23 00:31:00.931
seed_cefradina	Cefradina	{"Cefradina Genfar","Cefradina Ofa"}	{"1 g","recubierto 500 mg"}	Polvo para soluci&oacute;n inyectable 1 g	Intravenosa	\N	General	f	t	\N	2026-06-23 00:31:00.954
seed_centella_asiatica	Centella Asiatica	{"Centella Asiatica Biotech","Centella Asiatica Ipeca"}	{"400 mg","500 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:00.968
seed_cimetidina	Cimetidina	{"Cimetidina Diamedica","Cimetidina Kimiceg","Cimetidina Leti","Cimetidina Spefar"}	{"200 mg","400 mg","recubierto con pel&iacute;cula 200 mg","recubierto con pel&iacute;cula 400 mg"}	Comprimido	Intravenosa	\N	General	f	t	\N	2026-06-23 00:31:00.974
seed_ciprofloxacino	Ciprofloxacino	{"Ciprofloxacino Genfar"}	{"recubierto con pel&iacute;cula 500 mg"}	Comprimido	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.978
seed_citrato_de_calcio_vitamina_d3	Citrato De Calcio Vitamina D3	{"Citrato De Calcio Vitamina D3 Leti","Citrato De Calcio Vitamina D3 Meyer","Citrato De Calcio Vitamina D3 Natural Systems"}	{"1 500 mg+200 IU","475 mg+70 IU"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:00.981
seed_clenbuterol	Clenbuterol	{"Clenbuterol Generico De Calidad","Clenbuterol Kimiceg","Clenbuterol Leti","Clenbuterol Plusandex"}	{"0.005 mg/5 ml","0.01 mg/5 ml"}	Jarabe	Oral	\N	General	f	t	\N	2026-06-23 00:31:00.984
seed_clenbuterol_clorhidrato	Clenbuterol Clorhidrato	{"Clenbuterol Clorhidrato New Pharma","Clenbuterol Clorhidrato Spefar"}	{"0.005 mg/5 ml","0.01 mg/5 ml"}	Jarabe	Oral	\N	General	f	t	\N	2026-06-23 00:31:00.986
seed_clotrimazol_neomicina_dexametasona	Clotrimazol Neomicina Dexametasona	{"Clotrimazol Neomicina Dexametasona Elter"}	{0.04&#37;+0.5&#37;+1&#37;}	Crema	Tópica	\N	Dermatología	f	t	\N	2026-06-23 00:31:01.007
seed_codeina	Codeina	{"Codeina Spefar"}	{"7.2 mg/5 ml"}	Jarabe	Oral	\N	Analgésicos	f	t	\N	2026-06-23 00:31:01.025
seed_deflazacort	Deflazacort	{"Deflazacort Calox","Deflazacort Leti"}	{"30 mg","6 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:01.052
seed_ceftazidima	Ceftazidima	{"Ceftazidima Generico De Calidad","Ceftazidima Vitalis"}	{"500 mg","1 g","2 g"}	Polvo para soluci&oacute;n inyectable 1 g	Intravenosa	\N	General	f	t	\N	2026-06-23 00:31:00.956
seed_cefalexina_calox_c_aacute_psula_dura_500_mg	Cefalexina Calox C&Aacute;Psula Dura 500 Mg	{"Cefalexina Calox C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.936
seed_cefalexina_leti_c_aacute_psula_dura_500_mg	Cefalexina Leti C&Aacute;Psula Dura 500 Mg	{"Cefalexina Leti C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.939
seed_cefalexina_lister_c_aacute_psula_dura_500_mg	Cefalexina Lister C&Aacute;Psula Dura 500 Mg	{"Cefalexina Lister C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.942
seed_cefalexina_sm_pharma_c_aacute_psula_dura_500_mg	Cefalexina Sm Pharma C&Aacute;Psula Dura 500 Mg	{"Cefalexina Sm Pharma C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.945
seed_celecoxib_kimiceg_c_aacute_psula_dura_200_mg	Celecoxib Kimiceg C&Aacute;Psula Dura 200 Mg	{"Celecoxib Kimiceg C&Aacute;Psula Dura 200 Mg"}	{"200 mg"}	Comprimidos	Oral	\N	AINEs	f	t	\N	2026-06-23 00:31:00.96
seed_celecoxib_sm_pharma_c_aacute_psula_dura_200_mg	Celecoxib Sm Pharma C&Aacute;Psula Dura 200 Mg	{"Celecoxib Sm Pharma C&Aacute;Psula Dura 200 Mg"}	{"200 mg"}	Comprimidos	Oral	\N	AINEs	f	t	\N	2026-06-23 00:31:00.965
seed_calcio_ostelin	Calcio Ostelin	{"Calcio Ostelin"}	{"500 mg"}	Suspensi&oacute;n oral 348 mg/10 ml+120 IU/10 ml	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:00.911
seed_cefalotina	Cefalotina	{"Cefalotina Leti","Cefalotina Vitalis"}	{"1 g","2 g"}	Soluci&oacute;n inyectable 1 g	Intravenosa	\N	General	f	t	\N	2026-06-23 00:31:00.949
seed_cianocobalamina	Cianocobalamina	{"Cianocobalamina Diamedica","Cianocobalamina Medifarm"}	{"1000 mcg"}	Soluci&oacute;n inyectable 1 000 &micro;g/1 ml	Intravenosa	\N	General	f	t	\N	2026-06-23 00:31:00.971
seed_clorfenamina	Clorfenamina	{"Clorfenamina Diamedica","Clorfenamina Medifarm"}	{"4 mg","8 mg"}	Soluci&oacute;n inyectable 10 mg/1 ml	Intravenosa	\N	General	f	t	\N	2026-06-23 00:31:00.998
seed_desloratadina	Desloratadina	{"Desloratadina Elter","Desloratadina Kimiceg","Desloratadina Leti","Desloratadina Ofa"}	{"5 mg","2.5 mg/5 ml","recubierto con pel&iacute;cula 5 mg","0.5 mg/ml"}	Comprimido	Oral	\N	Alergología	f	t	\N	2026-06-23 00:31:01.06
seed_diclofenac_sodico	Diclofenac Sodico	{"Diclofenac Sodico Quim Far"}	{"recubierto con pel&iacute;cula 50 mg"}	Comprimido	Oral	\N	AINEs	f	t	\N	2026-06-23 00:31:01.077
seed_diclofenaco	Diclofenaco	{"Diclofenaco Genfar","Diclofenaco Meyer","Diclofenaco Kimiceg"}	{"recubierto 100 mg",1&#37;,"50 mg"}	Soluci&oacute;n inyectable 75 mg/3 ml	Intravenosa	\N	General	f	t	\N	2026-06-23 00:31:01.118
seed_diclofenaco_potasico	Diclofenaco Potasico	{"Diclofenaco Potasico Ofa","Diclofenaco Potasico Calox","Diclofenaco Potasico Generico De Calidad","Diclofenaco Potasico Kimiceg","Diclofenaco Potasico Leti","Diclofenaco Potasico Spefar"}	{"gastrorresistente 50 mg","25 mg","50 mg","recubierto con pel&iacute;cula 50 mg"}	Comprimido	Intravenosa	\N	General	f	t	\N	2026-06-23 00:31:01.155
seed_diclofenaco_sodico	Diclofenaco Sodico	{"Diclofenaco Sodico Calox","Diclofenaco Sodico Diamedica","Diclofenaco Sodico Leti","Diclofenaco Sodico Medifarm","Diclofenaco Sodico Sm Pharma","Diclofenaco Sodico Spefar"}	{"50 mg","recubierto con pel&iacute;cula 50 mg",1&#37;}	Soluci&oacute;n inyectable 75 mg/3 ml	Intravenosa	\N	General	f	t	\N	2026-06-23 00:31:01.162
seed_enalapril_sm	Enalapril Sm	{"Enalapril Sm"}	{"10 mg","20 mg","5 mg"}	Comprimido	Oral	\N	Cardiología	f	t	\N	2026-06-23 00:31:01.199
seed_esomeprazol	Esomeprazol	{"Esomeprazol Calox","Esomeprazol Elter","Esomeprazol Genfar","Esomeprazol Kimiceg"}	{"gastrorresistente 20 mg","gastrorresistente 40 mg","de liberaci&oacute;n prolongada 20 mg","de liberaci&oacute;n prolongada 40 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:01.26
seed_famotidina	Famotidina	{"Famotidina Calox","Famotidina Elter","Famotidina Kimiceg","Famotidina Leti","Famotidina Ofa"}	{"20 mg","40 mg","recubierto con pel&iacute;cula 20 mg","recubierto con pel&iacute;cula 40 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:01.283
seed_fentanyl	Fentanyl	{"Fentanyl Behrens","Fentanyl Janssen"}	{}	Soluci&oacute;n inyectable 0.05 mg/ml	Intravenosa	\N	General	f	t	\N	2026-06-23 00:31:01.343
seed_fluconazol_pharmaceutical	Fluconazol Pharmaceutical	{"Fluconazol Pharmaceutical"}	{}	Soluci&oacute;n para perfusi&oacute;n 200 mg/100 ml	Oral	\N	Dermatología	f	t	\N	2026-06-23 00:31:01.616
seed_flunarizina	Flunarizina	{"Flunarizina Genfar","Flunarizina Spefar"}	{"10 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:01.639
seed_domperidona_ofa_c_aacute_psula_dura_10_mg	Domperidona Ofa C&Aacute;Psula Dura 10 Mg	{"Domperidona Ofa C&Aacute;Psula Dura 10 Mg"}	{"10 mg"}	Comprimidos	Oral	\N	Gastroenterología	f	t	\N	2026-06-23 00:31:01.167
seed_doxiciclina_calox_c_aacute_psula_dura_100_mg	Doxiciclina Calox C&Aacute;Psula Dura 100 Mg	{"Doxiciclina Calox C&Aacute;Psula Dura 100 Mg"}	{"100 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:01.181
seed_eritromicina_proula_c_aacute_psula_dura_250_mg	Eritromicina Proula C&Aacute;Psula Dura 250 Mg	{"Eritromicina Proula C&Aacute;Psula Dura 250 Mg"}	{"250 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:01.209
seed_eritromicina_spefar_c_aacute_psula_dura_250_mg	Eritromicina Spefar C&Aacute;Psula Dura 250 Mg	{"Eritromicina Spefar C&Aacute;Psula Dura 250 Mg"}	{"250 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:01.239
seed_fluconazol_calox_c_aacute_psula_dura_150_mg	Fluconazol Calox C&Aacute;Psula Dura 150 Mg	{"Fluconazol Calox C&Aacute;Psula Dura 150 Mg"}	{"150 mg"}	Comprimidos	Oral	\N	Dermatología	f	t	\N	2026-06-23 00:31:01.349
seed_fluconazol_gencer_c_aacute_psula_dura_150_mg	Fluconazol Gencer C&Aacute;Psula Dura 150 Mg	{"Fluconazol Gencer C&Aacute;Psula Dura 150 Mg"}	{"150 mg"}	Comprimidos	Oral	\N	Dermatología	f	t	\N	2026-06-23 00:31:01.356
seed_fluconazol_generico_de_calidad_c_aacute_psula_dura_150_mg	Fluconazol Generico De Calidad C&Aacute;Psula Dura 150 Mg	{"Fluconazol Generico De Calidad C&Aacute;Psula Dura 150 Mg"}	{"150 mg"}	Comprimidos	Oral	\N	Dermatología	f	t	\N	2026-06-23 00:31:01.36
seed_fluconazol_genfar_c_aacute_psula_dura_150_mg	Fluconazol Genfar C&Aacute;Psula Dura 150 Mg	{"Fluconazol Genfar C&Aacute;Psula Dura 150 Mg"}	{"150 mg"}	Comprimidos	Oral	\N	Dermatología	f	t	\N	2026-06-23 00:31:01.383
seed_fluconazol_kimiceg_c_aacute_psula_dura_150_mg	Fluconazol Kimiceg C&Aacute;Psula Dura 150 Mg	{"Fluconazol Kimiceg C&Aacute;Psula Dura 150 Mg"}	{"150 mg"}	Comprimidos	Oral	\N	Dermatología	f	t	\N	2026-06-23 00:31:01.43
seed_fluconazol_leti_c_aacute_psula_dura_150_mg	Fluconazol Leti C&Aacute;Psula Dura 150 Mg	{"Fluconazol Leti C&Aacute;Psula Dura 150 Mg"}	{"150 mg"}	Comprimidos	Oral	\N	Dermatología	f	t	\N	2026-06-23 00:31:01.519
seed_fluconazol_lister_c_aacute_psula_dura_150_mg	Fluconazol Lister C&Aacute;Psula Dura 150 Mg	{"Fluconazol Lister C&Aacute;Psula Dura 150 Mg"}	{"150 mg"}	Comprimidos	Oral	\N	Dermatología	f	t	\N	2026-06-23 00:31:01.595
seed_fluconazol_meyer_c_aacute_psula_dura_150_mg	Fluconazol Meyer C&Aacute;Psula Dura 150 Mg	{"Fluconazol Meyer C&Aacute;Psula Dura 150 Mg"}	{"150 mg"}	Comprimidos	Oral	\N	Dermatología	f	t	\N	2026-06-23 00:31:01.602
seed_fluconazol_ofa_c_aacute_psula_dura_150_mg	Fluconazol Ofa C&Aacute;Psula Dura 150 Mg	{"Fluconazol Ofa C&Aacute;Psula Dura 150 Mg"}	{"150 mg"}	Comprimidos	Oral	\N	Dermatología	f	t	\N	2026-06-23 00:31:01.609
seed_fluconazol_sm_pharma_c_aacute_psula_dura_150_mg	Fluconazol Sm Pharma C&Aacute;Psula Dura 150 Mg	{"Fluconazol Sm Pharma C&Aacute;Psula Dura 150 Mg"}	{"150 mg"}	Comprimidos	Oral	\N	Dermatología	f	t	\N	2026-06-23 00:31:01.629
seed_fluconazol_spefar_c_aacute_psula_dura_150_mg	Fluconazol Spefar C&Aacute;Psula Dura 150 Mg	{"Fluconazol Spefar C&Aacute;Psula Dura 150 Mg"}	{"150 mg"}	Comprimidos	Oral	\N	Dermatología	f	t	\N	2026-06-23 00:31:01.634
seed_fluoxetina_biotech_c_aacute_psula_dura_20_mg	Fluoxetina Biotech C&Aacute;Psula Dura 20 Mg	{"Fluoxetina Biotech C&Aacute;Psula Dura 20 Mg"}	{"20 mg"}	Comprimidos	Oral	\N	Neurología	f	t	\N	2026-06-23 00:31:01.653
seed_gemfibrozilo	Gemfibrozilo	{"Gemfibrozilo Elter","Gemfibrozilo Leti","Gemfibrozilo Vivax"}	{"600 mg","recubierto con pel&iacute;cula 900 mg"}	Comprimido	Oral	\N	Cardiología	f	t	\N	2026-06-23 00:31:01.707
seed_glicerina	Glicerina	{"Glicerina Generico De Calidad","Glicerina Ofa","Glicerina Pfizer"}	{"1.68 g","2.68 g","2.25 g","1.65 g"}	Supositorio	Rectal	\N	General	f	t	\N	2026-06-23 00:31:01.712
seed_gliclazida	Gliclazida	{"Gliclazida Biotech","Gliclazida Calox","Gliclazida Leti"}	{"80 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:01.78
seed_glimepirida	Glimepirida	{"Glimepirida Calox","Glimepirida Elter","Glimepirida Generico De Calidad","Glimepirida Kimiceg","Glimepirida Leti","Glimepirida Meyer"}	{"2 mg","4 mg","recubierto con pel&iacute;cula 2 mg","recubierto con pel&iacute;cula 4 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:01.788
seed_glucosamina_condroitin	Glucosamina Condroitin	{"Glucosamina Condroitin Ipeca","Glucosamina Condroitin Sandoz"}	{"1 500 mg+1 200 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:01.799
seed_glucosamina_sulfato	Glucosamina Sulfato	{"Glucosamina Sulfato Sandoz","Glucosamina Sulfato Vivax"}	{}	Polvo para soluci&oacute;n oral 1 500 mg	Oral	\N	General	f	t	\N	2026-06-23 00:31:01.808
seed_hidroxido_de_aluminio_y_magnesio	Hidroxido De Aluminio Y Magnesio	{"Hidroxido De Aluminio Y Magnesio Generico De Calidad","Hidroxido De Aluminio Y Magnesio Spefar"}	{"400 mg+300 mg"}	Suspensi&oacute;n oral	Oral	\N	General	f	t	\N	2026-06-23 00:31:01.819
seed_hierro_polimaltosa	Hierro Polimaltosa	{"Hierro Polimaltosa Kimiceg"}	{"50 mg/5 ml"}	Jarabe	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:01.822
seed_ibuprofeno_elter	Ibuprofeno Elter	{"Ibuprofeno Elter"}	{"gastrorresistente 400 mg"}	Comprimido	Oral	\N	AINEs	f	t	\N	2026-06-23 00:31:01.857
seed_irbesartan	Irbesartan	{"Irbesartan Calox","Irbesartan Elter","Irbesartan Sandoz"}	{"150 mg","300 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:01.873
seed_lisinopril	Lisinopril	{"Lisinopril Calox","Lisinopril Leti"}	{"10 mg","5 mg","20 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:02.176
seed_loratadina_new_pharma	Loratadina New Pharma	{"Loratadina New Pharma"}	{"10 mg"}	Comprimido	Oral	\N	Alergología	f	t	\N	2026-06-23 00:31:02.184
cmr0p4nuv000t01moqpj00rs8	dorixina flex	{}	{"presentacion unica"}	Tableta	Oral	\N	Personalizado	t	t	cmqlsyn9e000301qgk98rcsjh	2026-06-30 13:42:21.127
seed_fluoxetina_elter_c_aacute_psula_dura_20_mg	Fluoxetina Elter C&Aacute;Psula Dura 20 Mg	{"Fluoxetina Elter C&Aacute;Psula Dura 20 Mg"}	{"20 mg"}	Comprimidos	Oral	\N	Neurología	f	t	\N	2026-06-23 00:31:01.689
seed_ibuprofeno_jerico_c_aacute_psula_blanda_400_mg	Ibuprofeno Jerico C&Aacute;Psula Blanda 400 Mg	{"Ibuprofeno Jerico C&Aacute;Psula Blanda 400 Mg"}	{"400 mg"}	Comprimidos	Oral	\N	AINEs	f	t	\N	2026-06-23 00:31:01.868
seed_ibuprofeno_new_pharma_c_aacute_psula_blanda_400_mg	Ibuprofeno New Pharma C&Aacute;Psula Blanda 400 Mg	{"Ibuprofeno New Pharma C&Aacute;Psula Blanda 400 Mg"}	{"400 mg"}	Comprimidos	Oral	\N	AINEs	f	t	\N	2026-06-23 00:31:01.871
seed_ketoprofeno_calox_c_aacute_psula_dura_100_mg	Ketoprofeno Calox C&Aacute;Psula Dura 100 Mg	{"Ketoprofeno Calox C&Aacute;Psula Dura 100 Mg"}	{"100 mg"}	Comprimidos	Oral	\N	AINEs	f	t	\N	2026-06-23 00:31:01.897
seed_ketoprofeno_calox_c_aacute_psula_dura_50_mg	Ketoprofeno Calox C&Aacute;Psula Dura 50 Mg	{"Ketoprofeno Calox C&Aacute;Psula Dura 50 Mg"}	{"50 mg"}	Comprimidos	Oral	\N	AINEs	f	t	\N	2026-06-23 00:31:01.903
seed_ketoprofeno_elter_c_aacute_psula_dura_100_mg	Ketoprofeno Elter C&Aacute;Psula Dura 100 Mg	{"Ketoprofeno Elter C&Aacute;Psula Dura 100 Mg"}	{"100 mg"}	Comprimidos	Oral	\N	AINEs	f	t	\N	2026-06-23 00:31:01.908
seed_ketoprofeno_new_pharma_c_aacute_psula_blanda_100_mg	Ketoprofeno New Pharma C&Aacute;Psula Blanda 100 Mg	{"Ketoprofeno New Pharma C&Aacute;Psula Blanda 100 Mg"}	{"100 mg"}	Comprimidos	Oral	\N	AINEs	f	t	\N	2026-06-23 00:31:01.92
seed_ketoprofeno_spefar_c_aacute_psula_dura_50_mg	Ketoprofeno Spefar C&Aacute;Psula Dura 50 Mg	{"Ketoprofeno Spefar C&Aacute;Psula Dura 50 Mg"}	{"50 mg"}	Comprimidos	Oral	\N	AINEs	f	t	\N	2026-06-23 00:31:02.031
seed_lansoprazol_calox_c_aacute_psula_dura_gastrorresistente_30_mg	Lansoprazol Calox C&Aacute;Psula Dura Gastrorresistente 30 Mg	{"Lansoprazol Calox C&Aacute;Psula Dura Gastrorresistente 30 Mg"}	{"30 mg"}	Comprimidos	Oral	\N	Gastroenterología	f	t	\N	2026-06-23 00:31:02.036
seed_lansoprazol_leti_c_aacute_psula_dura_gastrorresistente_30_mg	Lansoprazol Leti C&Aacute;Psula Dura Gastrorresistente 30 Mg	{"Lansoprazol Leti C&Aacute;Psula Dura Gastrorresistente 30 Mg"}	{"30 mg"}	Comprimidos	Oral	\N	Gastroenterología	f	t	\N	2026-06-23 00:31:02.079
seed_lansoprazol_ofa_c_aacute_psula_dura_gastrorresistente_30_mg	Lansoprazol Ofa C&Aacute;Psula Dura Gastrorresistente 30 Mg	{"Lansoprazol Ofa C&Aacute;Psula Dura Gastrorresistente 30 Mg"}	{"30 mg"}	Comprimidos	Oral	\N	Gastroenterología	f	t	\N	2026-06-23 00:31:02.085
seed_lansoprazol_spefar_c_aacute_psula_dura_gastrorresistente_30_mg	Lansoprazol Spefar C&Aacute;Psula Dura Gastrorresistente 30 Mg	{"Lansoprazol Spefar C&Aacute;Psula Dura Gastrorresistente 30 Mg"}	{"30 mg"}	Comprimidos	Oral	\N	Gastroenterología	f	t	\N	2026-06-23 00:31:02.141
seed_lansoprazol_vivax_c_aacute_psula_dura_gastrorresistente_30_mg	Lansoprazol Vivax C&Aacute;Psula Dura Gastrorresistente 30 Mg	{"Lansoprazol Vivax C&Aacute;Psula Dura Gastrorresistente 30 Mg"}	{"30 mg"}	Comprimidos	Oral	\N	Gastroenterología	f	t	\N	2026-06-23 00:31:02.161
seed_heparina_sodica	Heparina Sodica	{"Heparina Sodica Gencer","Heparina Sodica Ronava"}	{"5000 UI","25000 UI"}	Soluci&oacute;n inyectable 10 000 IU/10 ml	Intravenosa	\N	General	f	t	\N	2026-06-23 00:31:01.816
seed_lidocaina	Lidocaina	{"Lidocaina Biotech","Lidocaina Pharmakin"}	{1%,2%,"10 mg/ml","20 mg/ml"}	Soluci&oacute;n inyectable 1&#37;	Intravenosa	\N	General	f	t	\N	2026-06-23 00:31:02.171
seed_loratadina_pseudoefedrina	Loratadina Pseudoefedrina	{"Loratadina Pseudoefedrina Calox","Loratadina Pseudoefedrina Elter","Loratadina Pseudoefedrina Spefar"}	{"60 mg/5 ml+5 mg/5 ml"}	Jarabe	Oral	\N	Alergología	f	t	\N	2026-06-23 00:31:02.19
seed_losartan	Losartan	{"Losartan Genfar","Losartan Leti"}	{"recubierto con pel&iacute;cula 50 mg","100 mg","recubierto con pel&iacute;cula 100 mg"}	Comprimido	Oral	\N	Cardiología	f	t	\N	2026-06-23 00:31:02.194
seed_losartan_hct	Losartan Hct	{"Losartan Hct Calox"}	{"recubierto con pel&iacute;cula 100 mg+25 mg","recubierto con pel&iacute;cula 50 mg+12.5 mg"}	Comprimido	Oral	\N	Cardiología	f	t	\N	2026-06-23 00:31:02.199
seed_losartan_hidroclorotiazida	Losartan Hidroclorotiazida	{"Losartan Hidroclorotiazida Elter","Losartan Hidroclorotiazida Kimiceg","Losartan Hidroclorotiazida Leti","Losartan Hidroclorotiazida Ofa"}	{"recubierto con pel&iacute;cula 100 mg+25 mg","recubierto con pel&iacute;cula 50 mg+12.5 mg"}	Comprimido	Oral	\N	Cardiología	f	t	\N	2026-06-23 00:31:02.205
seed_losartan_potasico	Losartan Potasico	{"Losartan Potasico Calox","Losartan Potasico Elter","Losartan Potasico Gencer","Losartan Potasico Generico De Calidad","Losartan Potasico Kimiceg","Losartan Potasico Ofa"}	{"recubierto con pel&iacute;cula 50 mg"}	Comprimido	Oral	\N	Cardiología	f	t	\N	2026-06-23 00:31:02.212
seed_lovastatina	Lovastatina	{"Lovastatina Genfar","Lovastatina Leti","Lovastatina Ofa"}	{"20 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:02.238
seed_metformina_glibenclamida	Metformina Glibenclamida	{"Metformina Glibenclamida Calox"}	{"1 000 mg+5 mg","500 mg+2.5 mg"}	Comprimido	Oral	\N	Endocrinología	f	t	\N	2026-06-23 00:31:02.264
seed_mometasona	Mometasona	{"Mometasona Calox","Mometasona Genfar"}	{0.1&#37;}	Crema	Tópica	\N	General	f	t	\N	2026-06-23 00:31:02.408
seed_moxifloxacina	Moxifloxacina	{"Moxifloxacina Calox","Moxifloxacina Spefar","Moxifloxacina Vivax"}	{"recubierto con pel&iacute;cula 400 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:02.44
seed_mupirocin	Mupirocin	{"Mupirocin Calox","Mupirocin Meyer"}	{2&#37;}	Pomada	Tópica	\N	General	f	t	\N	2026-06-23 00:31:02.629
seed_nifedipina	Nifedipina	{"Nifedipina Leti","Nifedipina Quim Far"}	{"bucodispersables 10 mg","recubierto con pel&iacute;cula 10 mg"}	Comprimidos	Oral	\N	General	f	t	\N	2026-06-23 00:31:02.687
seed_nimesulide	Nimesulide	{"Nimesulide Biotech","Nimesulide Calox","Nimesulide Elter","Nimesulide Generico De Calidad","Nimesulide Kimiceg","Nimesulide Leti"}	{"100 mg","200 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:02.699
seed_nimodipina	Nimodipina	{"Nimodipina Calox","Nimodipina Leti","Nimodipina Ofa"}	{"recubierto 30 mg","recubierto 40 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:02.704
seed_nitazoxanida	Nitazoxanida	{"Nitazoxanida Elter","Nitazoxanida Kimiceg","Nitazoxanida Vivax"}	{"recubierto 500 mg"}	Polvo para suspensi&oacute;n oral 100 mg/5 ml	Oral	\N	General	f	t	\N	2026-06-23 00:31:02.71
seed_norfloxacina	Norfloxacina	{"Norfloxacina Calox","Norfloxacina Elter","Norfloxacina Leti","Norfloxacina Ofa","Norfloxacina Spefar"}	{"recubierto con pel&iacute;cula 400 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:02.714
seed_vitamina_biotech_c_aacute_psula_blanda_25_000_iu	Vitamina Biotech C&Aacute;Psula Blanda 25 000 Iu	{"Vitamina Biotech C&Aacute;Psula Blanda 25 000 Iu"}	{}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.893
seed_meloxicam_new_pharma_c_aacute_psula_dura_15_mg	Meloxicam New Pharma C&Aacute;Psula Dura 15 Mg	{"Meloxicam New Pharma C&Aacute;Psula Dura 15 Mg"}	{"15 mg"}	Comprimidos	Oral	\N	AINEs	f	t	\N	2026-06-23 00:31:02.249
seed_metronidazol_kimiceg_oacute_vulo_500_mg	Metronidazol Kimiceg &Oacute;Vulo 500 Mg	{"Metronidazol Kimiceg &Oacute;Vulo 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:02.291
seed_metronidazol_meyer_oacute_vulo_500_mg	Metronidazol Meyer &Oacute;Vulo 500 Mg	{"Metronidazol Meyer &Oacute;Vulo 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:02.305
seed_metronidazol_new_pharma_oacute_vulo_500_mg	Metronidazol New Pharma &Oacute;Vulo 500 Mg	{"Metronidazol New Pharma &Oacute;Vulo 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:02.315
seed_metronidazol_new_pharma_c_aacute_psula_blanda_500_mg	Metronidazol New Pharma C&Aacute;Psula Blanda 500 Mg	{"Metronidazol New Pharma C&Aacute;Psula Blanda 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:02.345
seed_naproxeno_genfar_c_aacute_psula_dura_250_mg	Naproxeno Genfar C&Aacute;Psula Dura 250 Mg	{"Naproxeno Genfar C&Aacute;Psula Dura 250 Mg"}	{"250 mg"}	Comprimidos	Oral	\N	AINEs	f	t	\N	2026-06-23 00:31:02.65
seed_omeprazol_calox_c_aacute_psula_dura_gastrorresistente_20_mg	Omeprazol Calox C&Aacute;Psula Dura Gastrorresistente 20 Mg	{"Omeprazol Calox C&Aacute;Psula Dura Gastrorresistente 20 Mg"}	{"20 mg"}	Comprimidos	Oral	\N	Gastroenterología	f	t	\N	2026-06-23 00:31:02.717
seed_omeprazol_elter_c_aacute_psula_dura_gastrorresistente_20_mg	Omeprazol Elter C&Aacute;Psula Dura Gastrorresistente 20 Mg	{"Omeprazol Elter C&Aacute;Psula Dura Gastrorresistente 20 Mg"}	{"20 mg"}	Comprimidos	Oral	\N	Gastroenterología	f	t	\N	2026-06-23 00:31:02.72
seed_meropenem_pharmaceutical	Meropenem Pharmaceutical	{"Meropenem Pharmaceutical"}	{"500 mg","1 g"}	Polvo para soluci&oacute;n inyectable 1 000 mg	Intravenosa	\N	Antibióticos	f	t	\N	2026-06-23 00:31:02.258
seed_metronidazol_benzoil	Metronidazol Benzoil	{"Metronidazol Benzoil Kimiceg"}	{"250 mg","500 mg"}	Suspensi&oacute;n oral 125 mg/5 ml	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:02.272
seed_morfina_clorhidrato	Morfina Clorhidrato	{"Morfina Clorhidrato Biotech","Morfina Clorhidrato Medifarm","Morfina Clorhidrato Ponce"}	{"10 mg","15 mg","30 mg","60 mg","100 mg"}	Soluci&oacute;n inyectable 10 mg/1 ml	Intravenosa	\N	Analgésicos	f	t	\N	2026-06-23 00:31:02.427
seed_ondansetrom	Ondansetrom	{"Ondansetrom Giempi","Ondansetrom Vitalis"}	{}	Soluci&oacute;n inyectable 4 mg/2 ml	Intravenosa	\N	General	f	t	\N	2026-06-23 00:31:02.775
seed_ondansetron	Ondansetron	{"Ondansetron Calox","Ondansetron Giempi"}	{"4 mg","8 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:02.779
seed_oxacilina	Oxacilina	{"Oxacilina Gencer","Oxacilina Lister","Oxacilina Sm Pharma","Oxacilina Vitalis","Oxacilina Leti"}	{}	Polvo para soluci&oacute;n inyectable 1 g	Intravenosa	\N	General	f	t	\N	2026-06-23 00:31:02.782
seed_oximetazolina	Oximetazolina	{"Oximetazolina Gencer","Oximetazolina Leti","Oximetazolina Spefar"}	{}	Gotas nasales en soluci&oacute;n 0.025&#37;	Nasal	\N	General	f	t	\N	2026-06-23 00:31:02.799
seed_oxolamina	Oxolamina	{"Oxolamina Gencer","Oxolamina Leti","Oxolamina Ofa","Oxolamina Pifano","Oxolamina Proula","Oxolamina Spefar"}	{"28 mg/5 ml","50 mg/5 ml",1&#37;,1.4&#37;}	Jarabe	Oral	\N	General	f	t	\N	2026-06-23 00:31:02.81
seed_pentoxifilina	Pentoxifilina	{"Pentoxifilina Calox","Pentoxifilina Genfar","Pentoxifilina Leti","Pentoxifilina Ofa"}	{"de liberaci&oacute;n prolongada 400 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:02.912
seed_piperacilina_tazobactam_phramaceutical	Piperacilina Tazobactam Phramaceutical	{"Piperacilina Tazobactam Phramaceutical"}	{}	Polvo para soluci&oacute;n inyectable 4 g+500 mg	Intravenosa	\N	Antibióticos	f	t	\N	2026-06-23 00:31:02.916
seed_risedronato	Risedronato	{"Risedronato Calox","Risedronato Elter","Risedronato Leti"}	{"recubierto con pel&iacute;cula 5 mg","recubierto con pel&iacute;cula 35 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:02.988
seed_vitamina_b6_b12_con_acido_folico_vivax_c_aacute_psula_blanda	Vitamina B6 B12 Con Acido Folico Vivax C&Aacute;Psula Blanda	{"Vitamina B6 B12 Con Acido Folico Vivax C&Aacute;Psula Blanda"}	{}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.89
seed_penicilina_g_procainica	Penicilina G Procainica	{"Penicilina G Procainica Genfar","Penicilina G Procainica Vitalis"}	{"800.000 UI","400.000 UI"}	Polvo y disolvente para suspensi&oacute;n inyectable 400 000 IU	Intravenosa	\N	Antibióticos	f	t	\N	2026-06-23 00:31:02.834
seed_penicilina_g_benzatina_g_sodica_g_procaina	Penicilina G Benzatina G Sodica G Procaina	{"Penicilina G Benzatina G Sodica G Procaina Vitalis"}	{"1.000.000 UI"}	Polvo y disolvente para suspensi&oacute;n inyectable 0.6 M IU+0.3 M IU+0.3 M IU	Intravenosa	\N	Antibióticos	f	t	\N	2026-06-23 00:31:02.817
seed_penicilina_g	Penicilina G	{"Penicilina G Gencer"}	{"1.000.000 UI","5.000.000 UI"}	Polvo y disolvente para suspensi&oacute;n inyectable 0.6 M IU+0.3 M IU+0.3 M IU	Intravenosa	\N	Antibióticos	f	t	\N	2026-06-23 00:31:02.815
seed_penicilina_sodica_procainica	Penicilina Sodica Procainica	{"Penicilina Sodica Procainica Sandoz"}	{"1.000.000 UI"}	Polvo para suspensi&oacute;n inyectable	Intravenosa	\N	Antibióticos	f	t	\N	2026-06-23 00:31:02.908
seed_penicilina_sodica	Penicilina Sodica	{"Penicilina Sodica Sm Pharma"}	{"1.000.000 UI","5.000.000 UI"}	Polvo para soluci&oacute;n inyectable 1 M IU	Intravenosa	\N	Antibióticos	f	t	\N	2026-06-23 00:31:02.89
seed_omeprazol_generico_de_calidad_c_aacute_psula_dura_gastrorresistente_20_mg	Omeprazol Generico De Calidad C&Aacute;Psula Dura Gastrorresistente 20 Mg	{"Omeprazol Generico De Calidad C&Aacute;Psula Dura Gastrorresistente 20 Mg"}	{"20 mg"}	Comprimidos	Oral	\N	Gastroenterología	f	t	\N	2026-06-23 00:31:02.732
seed_omeprazol_kimiceg_c_aacute_psula_dura_gastrorresistente_20_mg	Omeprazol Kimiceg C&Aacute;Psula Dura Gastrorresistente 20 Mg	{"Omeprazol Kimiceg C&Aacute;Psula Dura Gastrorresistente 20 Mg"}	{"20 mg"}	Comprimidos	Oral	\N	Gastroenterología	f	t	\N	2026-06-23 00:31:02.737
seed_omeprazol_leti_c_aacute_psula_dura_gastrorresistente_20_mg	Omeprazol Leti C&Aacute;Psula Dura Gastrorresistente 20 Mg	{"Omeprazol Leti C&Aacute;Psula Dura Gastrorresistente 20 Mg"}	{"20 mg"}	Comprimidos	Oral	\N	Gastroenterología	f	t	\N	2026-06-23 00:31:02.741
seed_omeprazol_ofa_c_aacute_psula_dura_gastrorresistente_20_mg	Omeprazol Ofa C&Aacute;Psula Dura Gastrorresistente 20 Mg	{"Omeprazol Ofa C&Aacute;Psula Dura Gastrorresistente 20 Mg"}	{"20 mg"}	Comprimidos	Oral	\N	Gastroenterología	f	t	\N	2026-06-23 00:31:02.744
seed_omeprazol_sm_pharma_c_aacute_psula_dura_gastrorresistente_20_mg	Omeprazol Sm Pharma C&Aacute;Psula Dura Gastrorresistente 20 Mg	{"Omeprazol Sm Pharma C&Aacute;Psula Dura Gastrorresistente 20 Mg"}	{"20 mg"}	Comprimidos	Oral	\N	Gastroenterología	f	t	\N	2026-06-23 00:31:02.75
seed_omeprazol_spefar_c_aacute_psula_dura_gastrorresistente_20_mg	Omeprazol Spefar C&Aacute;Psula Dura Gastrorresistente 20 Mg	{"Omeprazol Spefar C&Aacute;Psula Dura Gastrorresistente 20 Mg"}	{"20 mg"}	Comprimidos	Oral	\N	Gastroenterología	f	t	\N	2026-06-23 00:31:02.753
seed_omeprazol_vivax_c_aacute_psula_dura_gastrorresistente_20_mg	Omeprazol Vivax C&Aacute;Psula Dura Gastrorresistente 20 Mg	{"Omeprazol Vivax C&Aacute;Psula Dura Gastrorresistente 20 Mg"}	{"20 mg"}	Comprimidos	Oral	\N	Gastroenterología	f	t	\N	2026-06-23 00:31:02.769
seed_piroxicam_elter_c_aacute_psula_dura_20_mg	Piroxicam Elter C&Aacute;Psula Dura 20 Mg	{"Piroxicam Elter C&Aacute;Psula Dura 20 Mg"}	{"20 mg"}	Comprimidos	Oral	\N	AINEs	f	t	\N	2026-06-23 00:31:02.921
seed_piroxicam_genfar_c_aacute_psula_dura_20_mg	Piroxicam Genfar C&Aacute;Psula Dura 20 Mg	{"Piroxicam Genfar C&Aacute;Psula Dura 20 Mg"}	{"20 mg"}	Comprimidos	Oral	\N	AINEs	f	t	\N	2026-06-23 00:31:02.931
seed_piroxicam_kimiceg_c_aacute_psula_dura_20_mg	Piroxicam Kimiceg C&Aacute;Psula Dura 20 Mg	{"Piroxicam Kimiceg C&Aacute;Psula Dura 20 Mg"}	{"20 mg"}	Comprimidos	Oral	\N	AINEs	f	t	\N	2026-06-23 00:31:02.939
seed_piroxicam_roemmers_c_aacute_psula_dura_20_mg	Piroxicam Roemmers C&Aacute;Psula Dura 20 Mg	{"Piroxicam Roemmers C&Aacute;Psula Dura 20 Mg"}	{"20 mg"}	Comprimidos	Oral	\N	AINEs	f	t	\N	2026-06-23 00:31:02.972
seed_piroxicam_sm_pharma_c_aacute_psula_dura_20_mg	Piroxicam Sm Pharma C&Aacute;Psula Dura 20 Mg	{"Piroxicam Sm Pharma C&Aacute;Psula Dura 20 Mg"}	{"20 mg"}	Comprimidos	Oral	\N	AINEs	f	t	\N	2026-06-23 00:31:02.977
seed_secnidazol	Secnidazol	{"Secnidazol Calox","Secnidazol Cofasa","Secnidazol Gencer","Secnidazol Genfar","Secnidazol Kimiceg","Secnidazol Leti"}	{"1 000 mg","500 mg","recubierto 500 mg","recubierto 1 000 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:02.997
seed_simvastatina_infinity	Simvastatina Infinity	{"Simvastatina Infinity"}	{"recubierto con pel&iacute;cula 10 mg","recubierto con pel&iacute;cula 20 mg","recubierto con pel&iacute;cula 40 mg","recubierto con pel&iacute;cula 80 mg"}	Comprimido	Oral	\N	Cardiología	f	t	\N	2026-06-23 00:31:03.02
seed_solucion_ringer_lactato	Solucion Ringer Lactato	{"Solucion Ringer Lactato Baxter","Solucion Ringer Lactato Behrens"}	{}	Soluci&oacute;n para perfusi&oacute;n	Oral	\N	General	f	t	\N	2026-06-23 00:31:03.032
seed_sulfadiazina_de_plata	Sulfadiazina De Plata	{"Sulfadiazina De Plata Kimiceg","Sulfadiazina De Plata Pifano"}	{1&#37;}	Crema	Tópica	\N	General	f	t	\N	2026-06-23 00:31:03.051
seed_sultamicilina	Sultamicilina	{"Sultamicilina Calox","Sultamicilina Elter","Sultamicilina Kimiceg","Sultamicilina Leti","Sultamicilina Meyer","Sultamicilina Sm Pharma"}	{"375 mg","750 mg","recubierto 375 mg","recubierto 750 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:03.062
seed_terbinafina	Terbinafina	{"Terbinafina Calier","Terbinafina Calox","Terbinafina Ofa"}	{"250 mg",1&#37;}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:03.084
seed_tinidazol	Tinidazol	{"Tinidazol Calox","Tinidazol Elter","Tinidazol Genfar","Tinidazol Plusandex"}	{"500 mg","1 g"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:03.125
seed_tiocolchicosido	Tiocolchicosido	{"Tiocolchicosido Biotech","Tiocolchicosido Calox","Tiocolchicosido Elter","Tiocolchicosido Leti","Tiocolchicosido Meyer","Tiocolchicosido Sm Pharma"}	{"4 mg","recubierto con pel&iacute;cula 4 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:03.193
seed_tobramicina	Tobramicina	{"Tobramicina Gencer","Tobramicina Generico De Calidad"}	{"en soluci&oacute;n 0.3&#37;"}	Soluci&oacute;n inyectable 75 mg/1.5 ml	Intravenosa	\N	Antibióticos	f	t	\N	2026-06-23 00:31:03.246
seed_tobramicina_dexametasona	Tobramicina Dexametasona	{"Tobramicina Dexametasona Generico De Calidad"}	{"en suspensi&oacute;n 0.1&#37;+0.3&#37;"}	Colirio	Oftálmica	\N	Antibióticos	f	t	\N	2026-06-23 00:31:03.26
seed_trimetoprim_sulfa	Trimetoprim Sulfa	{"Trimetoprim Sulfa Genfar","Trimetoprim Sulfa Kimiceg"}	{"800 mg+160 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:03.284
seed_trimetoprim_sulfametoxazol	Trimetoprim Sulfametoxazol	{"Trimetoprim Sulfametoxazol Elter","Trimetoprim Sulfametoxazol Sm Pharma","Trimetoprim Sulfametoxazol Spefar","Trimetoprim Sulfametoxazol Vivax"}	{"400 mg+80 mg"}	Suspensi&oacute;n oral 200 mg/5 ml+40 mg/5 ml	Oral	\N	General	f	t	\N	2026-06-23 00:31:03.362
seed_vacuna_gamma_antitetanos_grifols	Vacuna Gamma Antitetanos Grifols	{"Vacuna Gamma Antitetanos Grifols"}	{}	Soluci&oacute;n inyectable 250 IU/1 ml	Intravenosa	\N	Vacunas	f	t	\N	2026-06-23 00:31:03.398
seed_vacuna_purificada	Vacuna Purificada	{"Vacuna Purificada"}	{}	Suspensi&oacute;n inyectable	Intravenosa	\N	Vacunas	f	t	\N	2026-06-23 00:31:03.433
seed_vacuna_toxoide_tetanica	Vacuna Toxoide Tetanica	{"Vacuna Toxoide Tetanica Generico De Calidad","Vacuna Toxoide Tetanica Sanofi Pasteur"}	{}	Suspensi&oacute;n inyectable 25 IF/0.5 ml	Intravenosa	\N	Vacunas	f	t	\N	2026-06-23 00:31:03.446
seed_valeriana	Valeriana	{"Valeriana Biotech","Valeriana Chemycals Soma"}	{"recubierto 100 mg",10&#37;}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:03.456
seed_valsartan	Valsartan	{"Valsartan Elter","Valsartan Kimiceg","Valsartan Ofa","Valsartan Vivax"}	{"recubierto con pel&iacute;cula 160 mg","recubierto con pel&iacute;cula 80 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:03.467
seed_valsartan_hidroclorotiazida	Valsartan Hidroclorotiazida	{"Valsartan Hidroclorotiazida Elter","Valsartan Hidroclorotiazida Genfar","Valsartan Hidroclorotiazida Leti"}	{"recubierto con pel&iacute;cula 80 mg+12.5 mg"}	Comprimido	Oral	\N	General	f	t	\N	2026-06-23 00:31:03.476
seed_verapamilo	Verapamilo	{"Verapamilo Elter","Verapamilo Genfar","Verapamilo Pifano","Verapamilo Roemmers","Verapamilo Spefar"}	{"40 mg","80 mg","recubierto con pel&iacute;cula 120 mg","recubierto 40 mg"}	Comprimido	Oral	\N	Cardiología	f	t	\N	2026-06-23 00:31:03.495
seed_vitamina_a_new_pharma_c_aacute_psula_blanda_50_000_iu	Vitamina A New Pharma C&Aacute;Psula Blanda 50 000 Iu	{"Vitamina A New Pharma C&Aacute;Psula Blanda 50 000 Iu"}	{}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.629
seed_vitamina_a_vivax_c_aacute_psula_blanda_100_000_iu	Vitamina A Vivax C&Aacute;Psula Blanda 100 000 Iu	{"Vitamina A Vivax C&Aacute;Psula Blanda 100 000 Iu"}	{}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.647
seed_vitamina_a_vivax_c_aacute_psula_blanda_25_000_iu	Vitamina A Vivax C&Aacute;Psula Blanda 25 000 Iu	{"Vitamina A Vivax C&Aacute;Psula Blanda 25 000 Iu"}	{}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.722
seed_vitamina_a_vivax_c_aacute_psula_blanda_50_000_iu	Vitamina A Vivax C&Aacute;Psula Blanda 50 000 Iu	{"Vitamina A Vivax C&Aacute;Psula Blanda 50 000 Iu"}	{}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.839
seed_vitamina_b1	Vitamina B1	{"Vitamina B1 Proula"}	{"100 mg"}	Comprimido	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.852
seed_vitamina_b12	Vitamina B12	{"Vitamina B12 Pifano","Vitamina B12 Polinac","Vitamina B12 Proula","Vitamina B12 Quim Far","Vitamina B12 Roemmers"}	{"100 mg/5 ml"}	Soluci&oacute;n inyectable 100 &micro;g/1 ml	Intravenosa	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.858
seed_vitamina_b6	Vitamina B6	{"Vitamina B6 Cofasa"}	{}	Soluci&oacute;n inyectable 300 mg/3 ml	Intravenosa	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.872
seed_vitamina_k1	Vitamina K1	{"Vitamina K1 Giempi","Vitamina K1 Roemmers"}	{}	Soluci&oacute;n inyectable 10 mg/1 ml	Intravenosa	\N	Vitaminas	f	t	\N	2026-06-23 00:31:04.229
seed_vitamina_c	Vitamina C	{"Vitamina C Roemmers","Vitamina C Calox","Vitamina C Generico De Calidad","Vitamina C Now","Vitamina C Sm Pharma","Vitamina C Vargas"}	{"500 mg","50 mg/5 ml","1 g","100 mg/ml"}	Comprimido	Intravenosa	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.899
seed_vitamina_c_cristal	Vitamina C Cristal	{"Vitamina C Cristal Adaptosalud"}	{}	Polvo para soluci&oacute;n oral 500 mg	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.928
seed_vitamina_c_rose_h	Vitamina C Rose H	{"Vitamina C Rose H"}	{"1 g","500 mg"}	Comprimido	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.941
seed_vitamina_e_calox_c_aacute_psula_blanda_400_iu	Vitamina E Calox C&Aacute;Psula Blanda 400 Iu	{"Vitamina E Calox C&Aacute;Psula Blanda 400 Iu"}	{}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.962
seed_vitamina_e_gache_c_aacute_psula_blanda_400_iu	Vitamina E Gache C&Aacute;Psula Blanda 400 Iu	{"Vitamina E Gache C&Aacute;Psula Blanda 400 Iu"}	{}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.969
seed_vitamina_e_jerico_c_aacute_psula_blanda_400_iu	Vitamina E Jerico C&Aacute;Psula Blanda 400 Iu	{"Vitamina E Jerico C&Aacute;Psula Blanda 400 Iu"}	{}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.977
seed_vitamina_e_natural_systems_c_aacute_psula_blanda_400_iu	Vitamina E Natural Systems C&Aacute;Psula Blanda 400 Iu	{"Vitamina E Natural Systems C&Aacute;Psula Blanda 400 Iu"}	{}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.998
seed_vitamina_e_now_c_aacute_psula_blanda_400_iu	Vitamina E Now C&Aacute;Psula Blanda 400 Iu	{"Vitamina E Now C&Aacute;Psula Blanda 400 Iu"}	{}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:04.013
seed_vitamina_e_selenio_biotech_c_aacute_psula_blanda_400_iu_50_micro_g	Vitamina E Selenio Biotech C&Aacute;Psula Blanda 400 Iu+50 &Micro;G	{"Vitamina E Selenio Biotech C&Aacute;Psula Blanda 400 Iu+50 &Micro;G"}	{}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:04.033
seed_vitamina_e_selenio_ipeca_c_aacute_psula_blanda_400_iu_50_micro_g	Vitamina E Selenio Ipeca C&Aacute;Psula Blanda 400 Iu+50 &Micro;G	{"Vitamina E Selenio Ipeca C&Aacute;Psula Blanda 400 Iu+50 &Micro;G"}	{}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:04.04
seed_vitamina_e_selenio_jerico_c_aacute_psula_blanda_400_iu_50_micro_g	Vitamina E Selenio Jerico C&Aacute;Psula Blanda 400 Iu+50 &Micro;G	{"Vitamina E Selenio Jerico C&Aacute;Psula Blanda 400 Iu+50 &Micro;G"}	{}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:04.044
seed_vitamina_e_selenio_natural_systems_c_aacute_psula_blanda_400_iu_50_micro_g	Vitamina E Selenio Natural Systems C&Aacute;Psula Blanda 400 Iu+50 &Micro;G	{"Vitamina E Selenio Natural Systems C&Aacute;Psula Blanda 400 Iu+50 &Micro;G"}	{}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:04.051
seed_vitamina_e_selenio_new_pharma_c_aacute_psula_blanda_400_iu_50_micro_g	Vitamina E Selenio New Pharma C&Aacute;Psula Blanda 400 Iu+50 &Micro;G	{"Vitamina E Selenio New Pharma C&Aacute;Psula Blanda 400 Iu+50 &Micro;G"}	{}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:04.069
seed_vitamina_k	Vitamina K	{"Vitamina K Ponce"}	{}	Soluci&oacute;n inyectable 10 mg/1 ml	Intravenosa	\N	Vitaminas	f	t	\N	2026-06-23 00:31:04.207
seed_vitamina_c_jerico_c_aacute_psula_blanda_500_mg	Vitamina C Jerico C&Aacute;Psula Blanda 500 Mg	{"Vitamina C Jerico C&Aacute;Psula Blanda 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.932
seed_vitamina_e_biogalenic_c_aacute_psula_blanda_400_mg	Vitamina E Biogalenic C&Aacute;Psula Blanda 400 Mg	{"Vitamina E Biogalenic C&Aacute;Psula Blanda 400 Mg"}	{"400 mg"}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.946
seed_vitamina_e_biotech_c_aacute_psula_blanda_400_mg	Vitamina E Biotech C&Aacute;Psula Blanda 400 Mg	{"Vitamina E Biotech C&Aacute;Psula Blanda 400 Mg"}	{"400 mg"}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.956
seed_vitamina_e_eicopen_c_aacute_psula_blanda_200_mg	Vitamina E Eicopen C&Aacute;Psula Blanda 200 Mg	{"Vitamina E Eicopen C&Aacute;Psula Blanda 200 Mg"}	{"200 mg"}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.964
seed_vitamina_e_eicopen_c_aacute_psula_blanda_400_mg	Vitamina E Eicopen C&Aacute;Psula Blanda 400 Mg	{"Vitamina E Eicopen C&Aacute;Psula Blanda 400 Mg"}	{"400 mg"}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.967
seed_vitamina_e_kimiceg_c_aacute_psula_blanda_200_mg	Vitamina E Kimiceg C&Aacute;Psula Blanda 200 Mg	{"Vitamina E Kimiceg C&Aacute;Psula Blanda 200 Mg"}	{"200 mg"}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.98
seed_vitamina_e_kimiceg_c_aacute_psula_blanda_400_mg	Vitamina E Kimiceg C&Aacute;Psula Blanda 400 Mg	{"Vitamina E Kimiceg C&Aacute;Psula Blanda 400 Mg"}	{"400 mg"}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.984
seed_vitamina_e_meyer_c_aacute_psula_blanda_400_mg	Vitamina E Meyer C&Aacute;Psula Blanda 400 Mg	{"Vitamina E Meyer C&Aacute;Psula Blanda 400 Mg"}	{"400 mg"}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.99
seed_vitamina_e_new_pharma_c_aacute_psula_blanda_400_mg	Vitamina E New Pharma C&Aacute;Psula Blanda 400 Mg	{"Vitamina E New Pharma C&Aacute;Psula Blanda 400 Mg"}	{"400 mg"}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:04.004
seed_vitamina_e_ofa_c_aacute_psula_blanda_400_mg	Vitamina E Ofa C&Aacute;Psula Blanda 400 Mg	{"Vitamina E Ofa C&Aacute;Psula Blanda 400 Mg"}	{"400 mg"}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:04.019
seed_vitamina_e_plusandex_c_aacute_psula_blanda_400_mg	Vitamina E Plusandex C&Aacute;Psula Blanda 400 Mg	{"Vitamina E Plusandex C&Aacute;Psula Blanda 400 Mg"}	{"400 mg"}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:04.026
seed_vitamina_e_vivax_c_aacute_psula_blanda_100_mg	Vitamina E Vivax C&Aacute;Psula Blanda 100 Mg	{"Vitamina E Vivax C&Aacute;Psula Blanda 100 Mg"}	{"100 mg"}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:04.102
seed_vitamina_e_vivax_c_aacute_psula_dura_200_mg	Vitamina E Vivax C&Aacute;Psula Dura 200 Mg	{"Vitamina E Vivax C&Aacute;Psula Dura 200 Mg"}	{"200 mg"}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:04.17
cmr0ssb8w000k01o44u32be0f	betagen solspen	{}	{}	Inyectable	Intramuscular	\N	dosis unica	t	t	cmqlsyn9e000301qgk98rcsjh	2026-06-30 15:24:43.376
seed_penicilina_g_benzatinica	Penicilina G Benzatinica	{"Penicilina G Benzatinica Vitalis"}	{"1.200.000 UI","600.000 UI"}	Polvo y disolvente para suspensi&oacute;n inyectable 1.2 M IU	Intravenosa	\N	Antibióticos	f	t	\N	2026-06-23 00:31:02.829
seed_penicilina_g_sodica	Penicilina G Sodica	{"Penicilina G Sodica Genfar","Penicilina G Sodica Pfizer","Penicilina G Sodica Vitalis"}	{"1.000.000 UI","5.000.000 UI"}	Polvo para soluci&oacute;n inyectable 1 M IU	Intravenosa	\N	Antibióticos	f	t	\N	2026-06-23 00:31:02.841
seed_cefotaxima	Cefotaxima	{"Cefotaxima Diamedica","Cefotaxima Gencer","Cefotaxima Giempi","Cefotaxima Leti","Cefotaxima Vitalis"}	{"500 mg","1 g"}	Polvo para soluci&oacute;n inyectable 1 g	Intravenosa	\N	General	f	t	\N	2026-06-23 00:31:00.952
seed_fentanilo	Fentanilo	{"Fentanilo Medifarm"}	{"12 mcg","25 mcg","50 mcg","75 mcg","100 mcg"}	Soluci&oacute;n inyectable 0.5 mg/10 ml	Intravenosa	\N	Analgésicos	f	t	\N	2026-06-23 00:31:01.325
seed_amoxicilina_calox_c_aacute_psula_dura_250_mg	Amoxicilina Calox C&Aacute;Psula Dura 250 Mg	{"Amoxicilina Calox C&Aacute;Psula Dura 250 Mg"}	{"250 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.553
seed_amoxicilina_elter_c_aacute_psula_dura_500_mg	Amoxicilina Elter C&Aacute;Psula Dura 500 Mg	{"Amoxicilina Elter C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.582
seed_amoxicilina_spefar_c_aacute_psula_dura_500_mg	Amoxicilina Spefar C&Aacute;Psula Dura 500 Mg	{"Amoxicilina Spefar C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.668
seed_ampicilina_gencer_c_aacute_psula_dura_500_mg	Ampicilina Gencer C&Aacute;Psula Dura 500 Mg	{"Ampicilina Gencer C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.709
seed_ampicilina_leti_c_aacute_psula_dura_250_mg	Ampicilina Leti C&Aacute;Psula Dura 250 Mg	{"Ampicilina Leti C&Aacute;Psula Dura 250 Mg"}	{"250 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.719
seed_ampicilina_spefar_c_aacute_psula_dura_500_mg	Ampicilina Spefar C&Aacute;Psula Dura 500 Mg	{"Ampicilina Spefar C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.819
seed_clindamicina_elter_c_aacute_psula_dura_300_mg	Clindamicina Elter C&Aacute;Psula Dura 300 Mg	{"Clindamicina Elter C&Aacute;Psula Dura 300 Mg"}	{"300 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:00.992
seed_eritromicina_sm_pharma_c_aacute_psula_dura_250_mg	Eritromicina Sm Pharma C&Aacute;Psula Dura 250 Mg	{"Eritromicina Sm Pharma C&Aacute;Psula Dura 250 Mg"}	{"250 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:01.215
seed_fluoxetina_calox_c_aacute_psula_dura_20_mg	Fluoxetina Calox C&Aacute;Psula Dura 20 Mg	{"Fluoxetina Calox C&Aacute;Psula Dura 20 Mg"}	{"20 mg"}	Comprimidos	Oral	\N	Neurología	f	t	\N	2026-06-23 00:31:01.669
seed_fluoxetina_genfar_c_aacute_psula_dura_20_mg	Fluoxetina Genfar C&Aacute;Psula Dura 20 Mg	{"Fluoxetina Genfar C&Aacute;Psula Dura 20 Mg"}	{"20 mg"}	Comprimidos	Oral	\N	Neurología	f	t	\N	2026-06-23 00:31:01.697
seed_lansoprazol_elter_c_aacute_psula_dura_gastrorresistente_30_mg	Lansoprazol Elter C&Aacute;Psula Dura Gastrorresistente 30 Mg	{"Lansoprazol Elter C&Aacute;Psula Dura Gastrorresistente 30 Mg"}	{"30 mg"}	Comprimidos	Oral	\N	Gastroenterología	f	t	\N	2026-06-23 00:31:02.04
seed_meloxicam_new_pharma_c_aacute_psula_blanda_7_5_mg	Meloxicam New Pharma C&Aacute;Psula Blanda 7.5 Mg	{"Meloxicam New Pharma C&Aacute;Psula Blanda 7.5 Mg"}	{"7.5 mg"}	Comprimidos	Oral	\N	AINEs	f	t	\N	2026-06-23 00:31:02.245
seed_metronidazol_kimiceg_c_aacute_psula_blanda_500_mg	Metronidazol Kimiceg C&Aacute;Psula Blanda 500 Mg	{"Metronidazol Kimiceg C&Aacute;Psula Blanda 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:02.297
seed_omeprazol_sandoz_c_aacute_psula_dura_gastrorresistente_20_mg	Omeprazol Sandoz C&Aacute;Psula Dura Gastrorresistente 20 Mg	{"Omeprazol Sandoz C&Aacute;Psula Dura Gastrorresistente 20 Mg"}	{"20 mg"}	Comprimidos	Oral	\N	Gastroenterología	f	t	\N	2026-06-23 00:31:02.748
seed_vitamina_b12_roemmers_c_aacute_psula_dura_200_mg	Vitamina B12 Roemmers C&Aacute;Psula Dura 200 Mg	{"Vitamina B12 Roemmers C&Aacute;Psula Dura 200 Mg"}	{"200 mg"}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.864
seed_vitamina_b12_roemmers_c_aacute_psula_dura_500_mg	Vitamina B12 Roemmers C&Aacute;Psula Dura 500 Mg	{"Vitamina B12 Roemmers C&Aacute;Psula Dura 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.868
seed_vitamina_c_biogalenic_c_aacute_psula_blanda_500_mg	Vitamina C Biogalenic C&Aacute;Psula Blanda 500 Mg	{"Vitamina C Biogalenic C&Aacute;Psula Blanda 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.925
seed_vitamina_c_new_pharma_c_aacute_psula_blanda_500_mg	Vitamina C New Pharma C&Aacute;Psula Blanda 500 Mg	{"Vitamina C New Pharma C&Aacute;Psula Blanda 500 Mg"}	{"500 mg"}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:03.934
seed_vitamina_e_vivax_c_aacute_psula_dura_400_mg	Vitamina E Vivax C&Aacute;Psula Dura 400 Mg	{"Vitamina E Vivax C&Aacute;Psula Dura 400 Mg"}	{"400 mg"}	Comprimidos	Oral	\N	Vitaminas	f	t	\N	2026-06-23 00:31:04.186
seed_acido_aminocaproico	Acido Aminocaproico	{"Acido Aminocaproico Pharmakin","Acido Aminocaproico Surgimed"}	{"500 mg","1 g"}	Soluci&oacute;n inyectable 5 g/20 ml	Intravenosa	\N	General	f	t	\N	2026-06-23 00:31:00.394
seed_albumina_humana	Albumina Humana	{"Albumina Humana Baxter","Albumina Humana Biotoscana","Albumina Humana Medifarm","Albumina Humana Pharmakin","Albumina Humana Quimbiotec","Albumina Humana Sanofi Aventis"}	{"20% 50 ml","25% 50 ml"}	Soluci&oacute;n para perfusi&oacute;n 20&#37;	Intravenosa	\N	General	f	t	\N	2026-06-23 00:31:00.496
seed_metronidazol_schering_plough	Metronidazol Schering Plough	{"Metronidazol Schering Plough"}	{"250 mg","500 mg"}	Soluci&oacute;n para perfusi&oacute;n 500 mg/100 ml	Oral	\N	Antibióticos	f	t	\N	2026-06-23 00:31:02.364
\.


--
-- Data for Name: Mensaje; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."Mensaje" (id, "workspaceId", "patientRegistrationId", autor, texto, leido, "creadoAt", "textoCifrado") FROM stdin;
cmra01xtb000101mcklnoqaww	cmqva532b000201p39eq8lpiq	cmr0pml9d002001moekmrt320	DOCTOR	Hola lesvia, Beunas noches	t	2026-07-07 01:58:05.423	\N
cmra0195l000001mcgos9lx5h	cmqva532b000201p39eq8lpiq	cmr0pml9d002001moekmrt320	PATIENT	Hola Doctora Buenas noches. el dolor persiste.	t	2026-07-07 01:57:33.465	\N
cmrmy1pm1000s01l45hhwm3ut	cmqva532b000201p39eq8lpiq	cmr0pml9d002001moekmrt320	DOCTOR	Hola Lesvia en que puedo ayudarte?	t	2026-07-16 03:22:55.849	\N
cmrmy124t000q01l4gv1h1mem	cmqva532b000201p39eq8lpiq	cmr0pml9d002001moekmrt320	PATIENT	Hola doctora, buenas noches la quiero	t	2026-07-16 03:22:25.421	\N
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."Notification" (id, "workspaceId", tipo, titulo, mensaje, leida, "referenciaId", "createdAt") FROM stdin;
992449f7-3631-471c-9876-c5a05588e87b	cmqlsyn9e000301qgk98rcsjh	REFERRAL_RECEIVED	Nuevo referido pendiente	Dr. Carlos Pierluissis te refirió a Jeffrey Hernandez para Traumatología.	t	cmrmd03in005001lenmdbsv27	2026-07-16 00:07:52.194
\.


--
-- Data for Name: Pago; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."Pago" (id, "invoiceId", monto, "metodoPago", fecha, notas, "createdAt") FROM stdin;
\.


--
-- Data for Name: Patient; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."Patient" (id, "tipoIdentificacion", "numeroIdentificacion", "sinCedula", nombre, apellido, "fechaNacimiento", sexo, "grupoSanguineo", telefono, email, "portalPasswordHash", "repCedula", "repNombreCompleto", "repParentesco", "repTelefono", "repEmail", "createdAt", "updatedAt", "hmacCedula", "nombreCifrado", "hmacNombre", "apellidoCifrado", "hmacApellido", "telefonoCifrado", "hmacTelefono", "emailCifrado", "hmacEmail", "workspaceId", direccion, "direccionCifrada") FROM stdin;
cmr0rxhgu000001o4v5ax6a7z	CEDULA_V	XskqunyqniwZhNZGcGlVQjZiB+4FwAiDObJba/IsqHxAfSg=	f	Yolanda	Cortez	1940-05-03 00:00:00	FEMENINO	\N	04127828495	joguelfffdf@gmail.com	\N	\N	\N	\N	\N	\N	2026-06-30 15:00:45.102	2026-06-30 15:00:45.102	uiEzljVFO7HmoEJPcUEo+KIU6LbI4j8Cs5kuLiz5F+c=	1U4rl/QewThc7EbmMfSeQJYaPc47ZpqXjNqlM29bj2LDQGM=	ASw37R3UD4JM809I9Ief/xIIGlltItXJrPZ16PPe1l8=	DDRKO5LJtc14tGgwqmv6x9suncAxsXNdJY/NeXdvBzz6qQ==	a+W+oyoI6o6ZPS2gy4mGYM/rgwHuWhaPFuma2ZDWJy4=	OOKKIFUxEmBWOndkxMB82FWa3hF0xh2atP5Bn5TQR/1Jzy54jo7A	UBe3GrjSOUYTJHkbUiSDvnYzKWBzI8QQg9bEBIDVYTw=	bX3tWftwylg8GKthKaNnk9dvdbhUrGV4Ei8SdWPMcS2Wl8PnSuetpBHKXXzVNcMbmQ==	AAT9p5fLC9qRLKNy/MnUSvvlbsw6zS2/O6/pRzmEHD4=	cmqlsyn9e000301qgk98rcsjh	\N	\N
demo_patient_maria_001	CEDULA_V	12345678	f	María	González	1980-03-15 00:00:00	FEMENINO	O+	04141234567	maria.demo@medsysve.local	$2b$12$Qv9iFmPSfZqMjL2l22qBg.hGqyjhASu.vSNF/NhnU9a05KGGS4c.q	\N	\N	\N	\N	\N	2026-07-01 05:29:56.072	2026-07-01 05:29:56.072	\N	\N	\N	\N	\N	\N	\N	\N	\N	cmqmx6t43000101phgcog0v6o	\N	\N
demo_p_d2	CEDULA_V	22333444	f	Pedro Pablo	Ramírez Gómez	1972-09-22 00:00:00	MASCULINO	A+	04142223344	pedro.demo.ramirez@medsysve.test	\N	\N	\N	\N	\N	\N	2026-02-01 12:13:12.561	2026-02-01 12:13:12.561	\N	\N	\N	\N	\N	\N	\N	\N	\N	cmqmgxvs6000101oau4ntxdtv	\N	\N
demo_p_d3	CEDULA_V	33444555	f	Sofía Isabel	Hernández Lugo	1990-12-08 00:00:00	FEMENINO	B+	04143334455	\N	\N	\N	\N	\N	\N	\N	2025-11-01 12:13:12.561	2025-11-01 12:13:12.561	\N	\N	\N	\N	\N	\N	\N	\N	\N	cmqmgxvs6000101oau4ntxdtv	\N	\N
demo_p_d1	CEDULA_V	11222333	f	Ana Lucía	Martínez Soto	1985-05-15 00:00:00	FEMENINO	O+	04141112233	ana.demo.martinez@medsysve.test	$2b$10$zEPNfbCPbLz8XI5VjTMc.uMgSrZ2E6qmXGEdo027tKZV6SXYiJBXK	\N	\N	\N	\N	\N	2026-04-01 12:13:12.561	2026-04-01 12:13:12.561	\N	\N	\N	\N	\N	\N	\N	\N	\N	cmqmgxvs6000101oau4ntxdtv	\N	\N
cmr3mbcn6000y01mvam5xi75c	CEDULA_V	vi2/s0ZK5rzB9+TcJetBul2dhTLA+KWQ5lHKsl/IRzdy6dQB	f	Ricardo	Fernandez	1986-02-05 00:00:00	MASCULINO	\N	04245387006	rifernandez05@hotmail.com	\N	\N	\N	\N	\N	\N	2026-07-02 14:46:52.866	2026-07-02 14:46:52.866	QdHgxwFWKBTjX3NY231dRU4iCuijQyIJkEP5TF6IRok=	D7k2ALNk114Q+4Zb4ZKZxeR87OH2vzsiwTOfyTUq6/ZfbwY=	SNZ7mgBZbD6R1/17+0q6Gm0nGBMVcS1GOOlLV93bVBo=	+6KgINd9oyD4lUzWc2Ldnl/QUHqBr+gCbJtIVFuOJt72tHCMTA==	6MXNefM1veNqH8vyfUS4YC4Nb+8EaBKczUYL4LwHegY=	xz5cFOAOK3wuSf6DdTuQfcsO0vvyjZ0SU6Z8YohEJMeINvHeeKGd	/rDkAa/knZ4ScW68pbcCo7mk4oeIPdwfh+eBOYdM5XY=	0/0EOLCn19I3UwsjDZKRehlKEUtpnSfOJ5ohKaRDq6IRLbbfM9zcZz8XIpO4vJZvXEV+zAk=	w/97GPTc/NTo74ylrcE4VhW0uuohccw77teJPQxn5lc=	cmqlsyn9e000301qgk98rcsjh	\N	\N
cmr7yg1vs000e01mpjpus381i	CEDULA_V	2Vz3EIkKIM8joMOfS7Fd/1xctHSJ4tE38dbC1IH3oMXwW2Q=	f	Cerenela	Aguilar	2026-07-22 00:00:00	MASCULINO	\N	041244890	\N	\N	\N	\N	\N	\N	\N	2026-07-05 15:37:32.296	2026-07-05 15:37:32.296	20bWiB7gcoIPcI1dcO3WJeTi8AxUJMBKPC+0b77O3HU=	G4PmgGua4mdLQaiJ0qyy9EZNO7w7fQbvrMfm1Z8jKyXCLlaU	loDzIcM2A2Ly3/H01yv8Z51bOVQLWih7jDfewCb5qfE=	0Jkksw3oyU4o1nD5b88GZC2oWkbHgBEMmP+BBma2eHQ7+30=	53iXpK5ZdoR5r1xbqgL/ak+afc4hs324utghWo39+Yw=	C6QzkJBcLB40lLU/kzStE57lNsRaCouMqjwSW8L+qbVSMh7q1g==	2Xg+RQ63XItVe9RBvRHY1ypmXpfolHRoQJYHnFucVE0=	\N	\N	cmqlsyn9e000301qgk98rcsjh	\N	\N
cmrdoe2ud000001p8q068x7pf	CEDULA_V	4opF/b1K5omUowEZMXEm9ZynYbZ5BFKHINnYQv6+Ci5Mloob	f	Yenni	Fernandez	1974-09-22 00:00:00	FEMENINO	\N	04144045535	\N	\N	\N	\N	\N	\N	\N	2026-07-09 15:42:41.126	2026-07-09 15:42:41.126	6WCEdLCu7n4d1Yy4WfrPXMcH4MkaAYSvCFexYj4jqto=	4D1sLzlXqCB7R5AuOKpJ9/gLzgT3gxcR2ZrdmaTKSQWK	GWyYAn1AY80EubGNeq9elGvygG5pmBb7PB2SpL86AAE=	vc7pqk0wBm+6drT0uLyrKbRSVBkudIQTMUoPDHruht8/WgGfoQ==	6MXNefM1veNqH8vyfUS4YC4Nb+8EaBKczUYL4LwHegY=	HXAhVvczh5pz2JKRkUPSjST3lt5MCdPKSlnSjngF9X7P4B+idiV/	m7Ny4ODNCehR0Wi1o+bCMmWUPiz1HBQqD10Pcrl5LIc=	\N	\N	cmqlsyn9e000301qgk98rcsjh	\N	\N
cmqva6iju000g01p3ydrpvy5b	CEDULA_V	dCHIKB6LNasgyzfb0reHexlR8P5ldxjUwNzIkMGimFIUOqg=	f	Joel Arturo	Pierluissis Perez	1950-10-08 00:00:00	MASCULINO	A+	7732365883	yoguitechcars@gmail.com	$2b$12$Qv9iFmPSfZqMjL2l22qBg.hGqyjhASu.vSNF/NhnU9a05KGGS4c.q	\N	\N	\N	\N	\N	2026-06-26 18:45:02.442	2026-06-27 19:33:02.912	S2D98nYDoWfKup5OnezpR/c9mUpZwjmg+h2pBMen+Uo=	49ddd9ljGqyvw/PNlXs9Fl8FoJ/jc++BuDhDZdq4n7tUoRPTHRBe	wTzfRHOrwvu78vcDJvHTrLTLUPWJXMiUNiIPhprjHGM=	XgZWA/AUOL1c9BVqK7o79Xm4m0QKSFdgPCKgQ1iSEnpaF7w0ctQz1XuN4a7/	Asq58w/O/IqwxU81LB16m34yAM6VvQCW/Jn8/6AO8/s=	GWBi5MG8qxJTrzUrnYFuu0+l1mPKOFMhQds7Q+gvfG3NYBTvHs8=	dkJhKVhRB4W/h16y2Qvf7kO5hke8uVKo6CIrPzOhrlo=	p2kq5HiP9FkygcGGuj4f03hcavW2wf8JG4x0npwg/LkE8gzzioMXoybp25784Q4IfyHf	jrP2ym837vZn55E2GxdyKQ/0W7mhI6WItjj7n1rZ0Xs=	cmqva532b000201p39eq8lpiq	\N	\N
cmrf79z5d003o01p849t5b07f	CEDULA_V	+WNPzIc1eL5ssJKRBgvvA2vy92ySVRV8088B11zaNMxMtRdz	f	Luis	Martínez	1988-09-28 00:00:00	MASCULINO	\N	04243293818	mompi2811@gmail.com	\N	\N	\N	\N	\N	\N	2026-07-10 17:19:08.594	2026-07-10 17:19:08.594	HzdVQ7PuFZIFpTf6K2FJUL2J8xFNlhDtxDBt/2PS4Wg=	rPWgecPMWxRRmve0h7Gt2cv3uPjhOdB/64B/qsfAS/s=	FW4EyL43uFdjbyxzQEMgzqvaWa57o/siljoCeAogGeM=	1yhvRcM2uJ0UDhhaXoDf/MnsiOO+EbxAw+y4A00qbjEz+WIzXw==	g2DSm9tRFLg0jDXH/+Uacdv0WI1BTpLKDUhF0WZEiQ4=	vF16S+Z5L3zsZb+H3g4SLm5wXgyWG2fyxzlMsiK+k2RK+vRlr7sp	RbkZZHUcHQPa441z+NGOcPmPfs9v3CnbTmWoOPRgTvs=	sJu6icUjOKQFBO8WRpy4ng+hCniDYfGDY2Jx3EAuoWkfJVpNS1EObJUMV8qarvg=	rN95SJ2GWC7KOlWeW/TocFg0QBrWyjoaWh+jJHnhFIg=	cmrf70dud003b01p84kqb0a69	\N	\N
cmqlt0tle000401qgdzkunaos	CEDULA_V	mP+BT5WfHZEGbEthgowueMJOBnLQMzJwheqDVroQD+bWL+Gl	f	Ana	Prueba	1990-05-15 00:00:00	FEMENINO	\N	+58 412 1234567	paciente.prueba@medsysve.test	\N	\N	\N	\N	\N	\N	2026-06-20 03:34:47.762	2026-06-26 02:48:44.37	6Gh/yT+hU+ZXB6nh4y6UaEGzPDqt8/cQPsaB3f7KyJk=	T6mducCO8F7H0Q/Bq82Zhz+FacfOjVKWQQgvoDh00w==	PH77iRxkqotnMMYNk9xwInGOEamunzCBBkwLpA0VTO8=	cbGRhFkHTph/bKe7q6AywejFcUHoZzXoHCeIAI84Lu1ipA==	mvNtvnfVs0XHTdhWfaDkWlmqXneMAqL87phb9ceB7no=	I1Fsiztq9ekuqJN86+owwZvzgQpGwn/2mJSQY0fyOfs+hcG75taVnkC43Q==	26z+4hKEFKY52OrWxK+n05NsRF33+LC21S3pBczRQyI=	jxcNWrwbtmY6yrasATL/5zCxzTMsmuS6DZFZPfYXsxThEP593IzLx1kOtlQkcKtcEMMOnbe5nc4w	Y7gLJ4IChKliaOpkOofS+A28G5nliL2YohnvXNVgguc=	cmqlsydjl000101qg393bt9gt	\N	\N
cmqlt50og000701qgzcvdkcbs	CEDULA_V	9kE/X3UUztYVtKJInjmoxPFRfMk3dnYo1PPJAMVBR33L	f	Juan	Perez	1988-03-15 00:00:00	MASCULINO	\N	04127828495	sancheza213@gmail.com	\N	\N	\N	\N	\N	\N	2026-06-20 03:38:03.568	2026-06-26 02:48:44.372	Pz5OXSEGJW63ucePKp3qhurK1XiWL3SGzMzZVTDPHzs=	h83HvQjzKaFn4Cj875Q3S+NQ0RyjjV8ymqu2sFu5sIw=	85UPgUbUfztH8e1wFXOmFofP1gC+NEuAnz6LCsfi0G0=	g2nasamX8IV5GgVHV1euMWEizO9UHQNfvA4tnIGcVXkq	hvvvCsh/HBvJw5IJ5DhqgdaWn+qV14W86lx+Asw++oo=	IRyeaKAAt/WIZH6s+3a9N7RvZb5aTVBDWDWAtBgD9W1LBOT4vwf8	UBe3GrjSOUYTJHkbUiSDvnYzKWBzI8QQg9bEBIDVYTw=	ulXeH1VS5y+njSNWxQreskkgTjA76/2HvDCJHUQdYA3gpx8aE+zqz3hxqbhCSkLvfg==	gYt9QKU2ji3ym6ig09Un4atgIjJ3V5xvgjyH8o4FCys=	cmqlsyn9e000301qgk98rcsjh	\N	\N
cmqoon4mm000001mo8duoh8x0	CEDULA_V	KPO2EDXNCt4tepNFk1oXp8a/ywVJ51KVrNaaFjT3ncsbKOpc	f	Paciente	Prueba	1990-01-15 00:00:00	MASCULINO	\N	04141234567	prueba@medsysve.test	\N	\N	\N	\N	\N	\N	2026-06-22 03:55:28.976	2026-06-26 02:48:44.376	vpvmhaaer5fixUbEKS4VvSxlyEs/csy62YvX/QDJjWM=	xbJhya2Z1EvmCGewbLdWbnxKjf1xdRmQx3de8Xqy2uDk8jKy	I+HVDvTofKu9SiPINZqaneRPY1pnWJOe6ZVjJCMSibQ=	6zzqOxFj1q16K33k+n1weaZHdlJxfZoQl2QKR64XuA/P1g==	mvNtvnfVs0XHTdhWfaDkWlmqXneMAqL87phb9ceB7no=	tOV4gscS+vo4Gh1cJOc8J9t6cZAdqqQU9A0Pm7qWCI85GvZ0+QOA	76A0tB7eC/NbmyR95E/KlcRNou1ZSDXdWAZFsViUcq4=	OnpT4GPGyWVtP7mxPAbdbQpHXD4hykbawVVrtiNQpBMtWpSnHwyiJJWkpLfXo28y	BUOFEpop7aoXWjbz3vUHgdHr0pL3uS+qtpTCkcmW4xA=	cmqlsyn9e000301qgk98rcsjh	\N	\N
cmqv63syz000f01qoiamwwadg	CEDULA_V	Fzr+YHU30VgTsqphjPKARqjSEDdSzgsjIIUpYS/QH3xSoGE=	f	Joel padre 	PereZ	1950-10-08 00:00:00	MASCULINO	\N	04124489015	sancheza213@gmail.com	\N	\N	\N	\N	\N	\N	2026-06-26 16:50:57.516	2026-06-26 16:50:57.516	S2D98nYDoWfKup5OnezpR/c9mUpZwjmg+h2pBMen+Uo=	X/d8E8iBDp04+1LUyqsrtSVriZna0O1n0TNUMk4meiAZNbXTBkTr	8m9o9PN/oPd0HgBVALgxkJNjWSDTU05NI7HEDZFqEJA=	AKP0lHqDe1Cc7gLAYx1EjHSiPESHK3bmNtZIdiJCoX+b	hvvvCsh/HBvJw5IJ5DhqgdaWn+qV14W86lx+Asw++oo=	PZi9DJlmeHEWOfvAodr5U1MuTYTF7Ui4WL7TjZMWQ9664bnI3Llp	FoPS3vZkaG8DjQrhipUDwA8LSwKgakM9W/zCopaN7Zw=	bw2pkRWuX5t0wFg/84CrqwDd6j3umja4+8015Cc5UTanjtR26ie2Xln4bYvvdQfh0A==	gYt9QKU2ji3ym6ig09Un4atgIjJ3V5xvgjyH8o4FCys=	cmqlsyn9e000301qgk98rcsjh	\N	\N
cmr0o3mmh000201mo1o59fh73	CEDULA_V	eaJCdXzTaSkGGKu92m8B2e/KywoO048b1g15H2j1in2OHbc=	f	Julian	Perez	1960-05-19 00:00:00	MASCULINO	\N	\N	joguelpinto0810@gmail.com	\N	\N	\N	\N	\N	\N	2026-06-30 13:13:33.257	2026-06-30 13:13:33.257	Xz0+cvl+zC6xAYihaHUNm6MlNAxwfRycEBJE3ZBow5Y=	Lh+F0wZoj6/mwc0irHP/Y+hd94Q7+mXMePC9zwse1r1OWg==	MYGXXZ3h4FJrDNEwJPWYpUN0OlzL3VEY/GifRjsZFOA=	CaikcuWGnerPQpTDpPFHbKtXFEBewWk/GAgDTnWGm6hX	hvvvCsh/HBvJw5IJ5DhqgdaWn+qV14W86lx+Asw++oo=	\N	\N	5u9kATeO+v7yFBjIFrSH3IOT/Ak1CBT0DwR6FdOchRvykvE96x7mHB+ch1mNr7B634Kt8Uc=	l5TzShZnF1DSJdg64hhhU/SmEF+gJ3+JTpDd+plYp0E=	cmqlsyn9e000301qgk98rcsjh	\N	\N
cmr0s0pmk000201o4tt1e8wf0	CEDULA_V	dwKKgdSbNzc0WA/xGJYhsIoujx3PmDq3SEMt/WkrRvwzO8FP	f	adriana	sanchez	1991-03-21 00:00:00	FEMENINO	\N	04124489015	sancheza213@gmail.com	\N	\N	\N	\N	\N	\N	2026-06-30 15:03:15.644	2026-06-30 15:03:15.644	4rRUBUdFwduERRXNoqKPQFuldN9u4mgadOd2sfGcBl8=	EBnc8LfpMv+juxY8jg28ULmTqIKgveTFzmVpNexnCINmApg=	6e+g2UirqqxbUoWwqiA9K5JNXqmD+a4U7tbj6ldXj0M=	zgUO4cOLESLQszC/sJNTBEn5gZWDBhjN29LYwtcIFH6n9pg=	hkUvHNfGoBRa0d07EHvQGDbeFhJfunPV/2/eJOps2Kw=	j574r50soQ2I2eCNNAwdHaF65hhc5wkVMAc9zNam8vwwo7Wy+VXn	FoPS3vZkaG8DjQrhipUDwA8LSwKgakM9W/zCopaN7Zw=	yFAGHV9vA+HOv/7Clp4gJXLrG/JVtqhx9GBlQ+sSRdeYCowMd9ctsltzskUV8kZNqw==	gYt9QKU2ji3ym6ig09Un4atgIjJ3V5xvgjyH8o4FCys=	cmqlsyn9e000301qgk98rcsjh	\N	\N
demo_patient_pedro_001	CEDULA_V	9876543	f	Pedro Antonio	Ramírez Mendoza	1955-08-22 00:00:00	MASCULINO	A+	04147654321	pedro.ramirez.demo@medsysve.local	\N	\N	\N	\N	\N	\N	2026-01-01 06:15:09.931	2026-01-01 06:15:09.931	\N	\N	\N	\N	\N	\N	\N	\N	\N	cmqmx6t43000101phgcog0v6o	\N	\N
demo_patient_diego_001	CEDULA_V	30123456	f	Diego Sebastián	Salazar Briceño	2012-11-30 00:00:00	MASCULINO	B+	04141234567	\N	\N	\N	\N	\N	\N	\N	2025-07-01 06:15:09.957	2025-07-01 06:15:09.957	\N	\N	\N	\N	\N	\N	\N	\N	\N	cmqmx6t43000101phgcog0v6o	\N	\N
demo_patient_lucia_001	CEDULA_V	15234567	f	Lucía Valentina	Fernández Castillo	1992-04-12 00:00:00	FEMENINO	O-	04245123456	lucia.fernandez.demo@medsysve.local	$2b$10$zEPNfbCPbLz8XI5VjTMc.uMgSrZ2E6qmXGEdo027tKZV6SXYiJBXK	\N	\N	\N	\N	\N	2026-04-01 06:15:09.949	2026-04-01 06:15:09.949	\N	\N	\N	\N	\N	\N	\N	\N	\N	cmqmx6t43000101phgcog0v6o	\N	\N
demo_patient_carmen_001	CEDULA_V	5678912	f	Carmen Elena	Uzcátegui de Rodríguez	1948-02-14 00:00:00	FEMENINO	AB+	04149876543	carmen.uzcategui.demo@medsysve.local	$2b$10$zEPNfbCPbLz8XI5VjTMc.uMgSrZ2E6qmXGEdo027tKZV6SXYiJBXK	\N	\N	\N	\N	\N	2024-07-01 06:15:09.965	2024-07-01 06:15:09.965	\N	\N	\N	\N	\N	\N	\N	\N	\N	cmqmx6t43000101phgcog0v6o	\N	\N
cmr3l49lr000301mvacxbf05b	CEDULA_V	WOGP+a/FhfuNY0FwLJwIL9tC7RGgzrvRCHsO4vovzGSgFASg	f	Xavier	Parra	2009-03-22 00:00:00	MASCULINO	\N	04127828495	joguelpinto0810@gmail.com	\N	\N	\N	\N	\N	\N	2026-07-02 14:13:22.721	2026-07-02 14:13:22.721	mpUzNFlMvVpzSwK5dS/Vb38yPL0LqgsVNsKl2Yzb0nU=	5eJ8+/vAQrRyiOZHPWqpoQM7qvTGi0ZN64C+x/d9Eo4AHw==	NmcXKFgsiHFKyVjTHM7u41YEQCYm8401j7L0ZcfcsCU=	eni5THAaFDSm1SJTXuUX+Z1DHIr5NEfT5r3IC/zriFf3	AkuxZfSCwB40kb4Yr9/PgWwagQbVGkgkY/Y7tanvep4=	CK97PRwxakgJ5tou6Kpe++LE2pLvXln9s4Yzm+lflozjmBTZ09QR	UBe3GrjSOUYTJHkbUiSDvnYzKWBzI8QQg9bEBIDVYTw=	qVW8sATxfRbhVX6VsEzrI2QJhD0MxJy2NDAS6gRoQLLLD/aZNWEXTeqjTitSSUifmUyl7sc=	l5TzShZnF1DSJdg64hhhU/SmEF+gJ3+JTpDd+plYp0E=	cmqlsyn9e000301qgk98rcsjh	\N	\N
cmr3o2o44002r01mvi5e54ml2	CEDULA_V	xAo1hihlx/pkHdy+YRzowSYdkWFyP+2dvSq/kiFiFtRmstGk	f	Gabriel	Moreno	2007-04-18 00:00:00	MASCULINO	\N	04145931425	joguelpinto0810@gmail.com	\N	\N	\N	\N	\N	\N	2026-07-02 15:36:07.06	2026-07-02 15:36:07.06	zY5OrCRAJU6tT51E9lO5Mg+KDkzC91zfScN9hPg+2+c=	Jlyj0D7O19hckQIXUSNx8mshILSpZuWZcupcckxmqI0Ef5w=	6BuDIAN5sNDmOZuT5ViVU+MD8ApCZ8VQS3kk46iCCQo=	2Fy04C/oiaB0U1XvB6A2RnmhhTqdA8Iwfua/wXGpc76PWw==	w+DJ3XCNh6knkxx801z22UoRBn5IioPIrcjRker9s7c=	AXCEu7yg+uYjU/2A+g9egKSitMuVbtEbzpHUQO3xmjC744YjVlOG	XJblLt9dVAvbKdTV8xWK/Q3wIsR+/mtU2aipILhOUSU=	OWUtWBt4F5hdGp5lPs7wsdi+uComXx6BRCcvdyXOFSV6pykVIuCE2b9FQ+loRWlLzumR5vs=	l5TzShZnF1DSJdg64hhhU/SmEF+gJ3+JTpDd+plYp0E=	cmqlsyn9e000301qgk98rcsjh	\N	\N
cmrkp9l1b005f01p2q2s602ci	CEDULA_V	ppeOIiQU8mWUfajsoQ78GfIBEPmU54mOJ3I2jwQFC/soXXJA	f	Katherina	Altamiranda	1982-12-03 00:00:00	FEMENINO	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-14 13:41:34.275	2026-07-14 13:41:34.275	sV5bUMCqKNMcMB1miWQ/Q+Xsl0cJHevaLcC26CLe5r0=	lMfTW1XG9iogm1T83ylNioHXloKX8NlaenzQYKpufGyB2Vls8A==	0stdenLFjNqBaz8C4zuHQFI1X8vawOcGMrVLhM4h7lY=	4AjQ1uqqmtpflKhg4QvuAQ9cC2BuKHlZ/SZEFD0wkyEqA/0Ezf28	lv1+zaCCLstWM0KM9yTioV3R79esZiqmloSme9VUJdo=	\N	\N	\N	\N	cmqlsyn9e000301qgk98rcsjh	\N	\N
cmr9ixqry001c01mpd1hbxjea	CEDULA_V	VQj6Sv/9tmJG5njsNEOE5M7OyMJ3CqwbctnG8SLNuFPuuNU=	f	Haidee	Matos	1957-03-07 00:00:00	MASCULINO	\N	04245017500	htms.9959@gmail.com	\N	\N	\N	\N	\N	\N	2026-07-06 17:58:56.206	2026-07-06 17:58:56.206	zitCFW87+25S4kTNinRA4cnf9n3Yx3HuNvxzkuXNS0c=	eGVh0LCziuv6EIhsPjhUz5gxsEBunus+CvCxU3T25QpU8g==	vQa9TTqX9YSHK6gz+BbUiLM5ZcCHQtDt2hFAkEoULPo=	Sjn4nr4tgumePLWrc8d5PyqCMJdMQAF5Um5q6cgji5wI	iUP+KaFRr/Kr8uee08s6XDKlLQ9pZanUKR9u4S9LCcg=	Qkkin6xbYo33qDQqeSJNo4AccNcjyzsvmO+hyxvdcxGbjeFfV0hm	xjQXULVqlXmFl2B/4vANu/8ivy26AbM7/HQkIuYtC6k=	84o5XVOR9V5+9BgXeXCECaZiPtR9jfWVEVQOIFgvzY6kwlIlK1my025gpRqZY0g=	+XrOohMbNuzn3AIkVNgIzPXyw/6jN3bpd7ksn44O700=	cmqlsyn9e000301qgk98rcsjh	\N	\N
cmrf1bjck002v01p88bexrqax	CEDULA_V	C0bb8jGFKpcm7ekSteX3uQmAIYlY8UcRb+qJsq2S8H8xKHqs	f	Jessenia	Garcia	1991-02-26 00:00:00	FEMENINO	\N	04244108082	\N	\N	\N	\N	\N	\N	\N	2026-07-10 14:32:23.732	2026-07-10 14:32:23.732	PFk0ICxiP48/bjpwUMtq1knGUxq0pY+4Ss5myC32QBU=	+4f5jMhQ6ImodV++XKyj5PPciiMVWgh3X06Y+nyrbco1+68a	KywvvANsMiiK5M1ERyQ180RqYUQepREmtbE4DcYtUEs=	9nK+ggZJPP+2w0BLqsbrj9egdSK77JXIZMXVWcnghRbpkQ==	6K4ILsdFwwQiaVU2PEkpoCyjg311w0tdrr9Yj3GFiEE=	GXreltIxN+YHJ9CubMG0ZIOJ4iadmSsQwdgYM///B52jOsfX45Pk	zgleLcx7fkGA4A5YmxFk8bybY/Bjwu9FBFmQmGBDZP0=	\N	\N	cmqlsyn9e000301qgk98rcsjh	\N	\N
cmrgkycai000001p29faxbs4v	CEDULA_V	Zza5kjtdumaqitKJrNjsw8/NamvK9aYA97FTuteAygtjrVoM	f	Miguel	Sarmiento	1996-07-22 00:00:00	MASCULINO	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-11 16:29:46.554	2026-07-11 16:29:46.554	e+cg/bO1c8sQAQOs+BzgA+3QD4f8gfwvBMnTgVzTe9Y=	2hGbUMXIFCfK1TZ6i/Ikp6MMQ9UhEO6scyv0YjGVQPulXQ==	lpDvy5Ka7G+meCDFaT2IjHfqwbJ+bCeYk8bEZba81k8=	HVn0llvpCYDuLeyFNjnIJ01ak8gykstCX81rOIr4ECJazcrSwA==	26Mtgme+iybnFGCBha4g5/8f5sM5+LSo2ZXK1jg5Uk4=	\N	\N	\N	\N	cmqlsyn9e000301qgk98rcsjh	\N	\N
cmrknjqtr002z01p22x59kgqz	CEDULA_V	AKuhiFD64Y6GEVlpsCkVU7slozd4CHE0fkz3PtOEUiyErpUt	f	Haron	Abdel	2014-05-25 00:00:00	MASCULINO	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-14 12:53:29.103	2026-07-14 12:53:29.103	IEU/y125UKL00/vmDuwf3cERrYFBJ+pBfrr0wj96UF4=	DIcfiL43XQVYsKvnZGD3cxi3iu/MNDPrJSsIRgebH4JU	4Q8bSkizUIIPeCJecn3Tg0Q2oLkLcRV1xPNdtB2eovU=	gBevBftdZ+mtJsjv062uB0DWd6wLjxX9JLfnS5cUUMGL	ZTScZe784C1FCUygyYQLz3LAhMVM0eQCrW956N3iOBs=	\N	\N	\N	\N	cmqlsyn9e000301qgk98rcsjh	\N	\N
cmrksckah006801p26iz1mk3f	CEDULA_V	8MdADW4hDL4b87oX4Udj4ZluU1lw6HwQHLd1EX5o8vSqohlm	f	Julio	Urbina	1977-03-02 00:00:00	MASCULINO	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-14 15:07:52.121	2026-07-14 15:07:52.121	RwMTEEn9qHn9seKl1YF093KiBejZcB6UqHIMeYdJjwA=	4o92BVhfCmabJMCEDDunlsedXjx7kAVWGDR1qB+qcjv6	jaiQsZbtRqLrlDn+UEKSwRqTJ851aWSq6IRmd4lSdts=	+Rx6eC8V/ipPdCoetddXbAkrYvjL+ZDFcz/jvPXHiaMmlg==	BnBSfYrd5BIBflSPwV2L7g5S6m52XkLRYnFBp+Zpmyo=	\N	\N	\N	\N	cmqlsyn9e000301qgk98rcsjh	\N	\N
cmrm7x1kp000001lef5ixp0z1	CEDULA_V	r1Sn/G7TqWWxmj2HB49kfJ9/hI05M2HE5aHi0vSKP4J6DGva	f	Jeffrey	Hernandez	1977-01-24 00:00:00	MASCULINO	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-15 15:11:28.057	2026-07-15 15:11:28.057	T9HzTEaz8Py5CxlKHMnp8MNqb2PjpgJ6MjERtq7i0qU=	s98jAB0rW5eHyrsodv1QygH62iTFLW96DxZU/KbqWJ1yKXk=	wtYmT+GLloXiKLYC0YxLQLQJA0BZyt5MKW5gzvAStwA=	wA1GcvFjN0bbSS7mm+drIs64/ywyoAJk9gm5UZdLoqMeUqaCwg==	0yU1ss3EzqHrmVTne5/04DBi3sUEpmxWW6QJzdg/I3M=	\N	\N	\N	\N	cmqlsyn9e000301qgk98rcsjh	\N	\N
cmrmxq8jv000101l40f72pe39	CEDULA_V	zRgM30+WJEYSz6bTKD1iTBmOyzlSHNs0RQ5XXibGoWkiRX+M	f	Paul	Reyes	2016-01-01 00:00:00	MASCULINO	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-16 03:14:00.523	2026-07-16 03:14:00.523	FK1wGWjAc6MIfUsdRBmLS9wE/W3eHtYQzOwdL+9fbbo=	6M2vxIQ62fHM5I4enrj22JizHulHuCcOyKcNFRwgFE4=	VlzDKy5k7TUFN6KqukRm8LSu/8MllIQG+abRN9pMOl0=	BVdp9j4lcqfhlo49rS/QIZj2wF4iwrrdqhywvIJfr2HB	3ScJ0U17HaCJV6WjN7XYF+reLDDHH6xfQDw6OPOR+Wo=	\N	\N	\N	\N	cmqlsyn9e000301qgk98rcsjh	\N	\N
cmrmyhl8y000101qk9pxaxfjs	CEDULA_V	S/pbiYBj++umaJaAIE9eGeaEjxnNoCsEVkprj/IvsJpW4sA=	f	Cándida	González	1952-03-01 00:00:00	FEMENINO	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-16 03:35:16.69	2026-07-16 03:35:16.69	o7m8kcvi7SUvjDhb074XZe754pKuv+PEgQj7loaLq9o=	KZNmy/g5iPT6v8IbAv/sLt5LiWX7nzUjHkvuJau0LLmiUsxn	bYLOdD6LuYe3I/qpAe5s1Fgx4lh0eYh+Q4QUXsWq2SQ=	jg+W2EwBb7y7soHz2wUfvb/Etn2AFjoCS9Ng9rqtseoj6O5ohw==	wT1UWYT1waZBIgfj5juvDUPmiu6Hmi4j3ufumMakCgg=	\N	\N	\N	\N	cmqlsyn9e000301qgk98rcsjh	\N	\N
cmrnn6o6k000m01nsfroa1rb3	CEDULA_V	CP4In5ORuXRjAnIk7TuMGp5LrG8uCg8LDQDrgepAo5GB+A==	f	Luisa	Arias	1931-10-23 00:00:00	FEMENINO	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-16 15:06:37.676	2026-07-16 15:06:37.676	n5qNjr08vpxfT1A4Y1stfFQQJt3GH2I88uIPG5ZqFUI=	xxlKjUuBZ1KSNtH1o1kvyXmi0JusKPJBNImCEDvomIiR	JOOd3YcH++P6R7vSX26zY2UAeNW055kNPSMn9W8TWJA=	O1GfAoQXUrs9WTKl/yDxdFjCRLiqfdYF4LuDyWf8WtOj	f4f2+bxbwIIm7UI7zRDQLqN68rqabkHpwO1J0kx4MUU=	\N	\N	\N	\N	cmqlsyn9e000301qgk98rcsjh	\N	\N
cmrnvmezg000801nhsyl7nzhe	CEDULA_V	0bVibUV6izI1EOLJ3juYEQO6cvyGjNcJu4QPHoxMzJm6+qq0	f	Ana	Navas	1990-04-10 00:00:00	FEMENINO	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-07-16 19:02:49.18	2026-07-16 19:02:49.18	NyJ2Fd+XepRLSftBCmrllQq46RsWGeXLYF3oAs7PVWk=	DCIiauLSPeSKKU2ex7Au9RDpVOUgb73c29q83Q0ClA==	PH77iRxkqotnMMYNk9xwInGOEamunzCBBkwLpA0VTO8=	K6U05a7iHeylx/mLnnAp+FPnYQ9f+mTg+vC5DacVFJAv	qcvOPy1sbxfYIcecM7YTo6a7lf1QDvMKFi29Oba/wXM=	\N	\N	\N	\N	cmqlsyn9e000301qgk98rcsjh	\N	\N
cmrodfw9x000001r09661zprq	CEDULA_E	4IAWbiEWMYA4pDbmBj6OmQc3ESWDQVZqUEEUQSAsgQ8+CaUe	f	Camila	Perez	1999-11-11 00:00:00	FEMENINO	\N	+17732365883	cpierluissisp@gmail.com	\N	\N	\N	\N	\N	\N	2026-07-17 03:21:38.086	2026-07-17 03:21:38.086	ySJTAPgNHpLXPEVU7ojDlffbmy85ffnvLe1TnauG9wY=	xNFmM0Ln0Z7NtHWr/WiR1HaPNCmbEl0ZkPj+nnsWNCfVxw==	0hUkQIoLOdMIHNMtHg/5Uvdojk0Nc47wLZK1dSZhGYQ=	JuP+UkFOBe1mMhO2ugoPDXUofh93OpiSsiROfhXckrT4	hvvvCsh/HBvJw5IJ5DhqgdaWn+qV14W86lx+Asw++oo=	bELwBOMePNM4g90JVjUt7MSwMq5WLi5/iDX/EqAAuXhslzW0rEvC+g==	wpBNNEde8aG2wJH3g3rLqx/6P244trBq77zlBfveSOk=	w2BjaVkkdqKVwU/emd4ZIpzlIbuj7v3hClxlTGfnuIX9XvN5d0QxxPsDGPJ5sOmX1zed	3NFvev28VuhrWYmJiV+9oURwz4vrbrSNGEuFjpiooq4=	cmqmx6t43000101phgcog0v6o	\N	\N
cmr0pml99001z01mogxs7wdnf	CEDULA_V	zeT0JH4sGaiGuKHuVrqq1b2B8B8rvGdnBf2jLxRDiQsCQIY=	f	Lesvia	Pinto Henriquez	1956-09-07 00:00:00	FEMENINO	A+	7732366372	lestripin@gmail.com	$2b$12$M2M3PcvRMzycYzplwMOZOO7BItONCYNFfc02.tOvk1kTlj5wRW.U.	\N	\N	\N	\N	\N	2026-06-30 13:56:17.565	2026-07-17 14:21:32.866	45x14jrU+vQWSrPFTvq7oNaquKUJh8ugZk7mQzshJlU=	XwUD95/7QQ3RrYANaN4vjpwsaiAPfzQYO7eWvQoa5uibRA==	sZD0D16eF3CELfluxHLYKpiRsOTZPlrSy2QieJSpx4I=	lsIl9DFVYfnQhSjOUxYFrXx4IPYCwqB1+wvQgRxwwXPKrrrZDts6VPUTGQ==	G3ivss5h3Ol0aEpYTZRG+ZXIppsZ1gt8wk5EKqH+IzA=	q4zf4j6Mli+pXgNZsexZMy5cv3hbtWgyOwxf7TdG716KzsxJBl8=	zpAK+uDBp2z9xZ7TFwvzgGopXw0SsZAbp9ayqlgUbuQ=	y6otV7bWiTlQEkHNwLZWx0pIzuxkuAY3ubCAYU/DMPaU4DStcGLo9XQjXBCqzmY=	s2DjTHbddGsw30aSHyBLKJJzAXyMnxduBXUFzPL+Loo=	cmqva532b000201p39eq8lpiq	\N	\N
\.


--
-- Data for Name: PatientConsent; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."PatientConsent" (id, "workspaceId", "patientRegistrationId", "templateId", "encounterId", firmado, "firmadoAt", "firmaData", "pdfUrl", notas, "createdAt") FROM stdin;
\.


--
-- Data for Name: PatientInsurance; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."PatientInsurance" (id, "patientRegistrationId", "providerId", "numeroPóliza", titular, "coberturaPct", "fechaVigencia", activa, notas, "createdAt") FROM stdin;
\.


--
-- Data for Name: PatientRegistration; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."PatientRegistration" (id, "idDisplay", "patientId", "workspaceId", "notasInternas", antecedentes, "createdAt", "updatedAt") FROM stdin;
cmqlt0tlm000501qg1c3qd20v	000001	cmqlt0tle000401qgdzkunaos	cmqlsydjl000101qg393bt9gt	\N	\N	2026-06-20 03:34:47.77	2026-06-20 03:34:47.77
cmr0s0pmq000301o4h0wrm684	000006	cmr0s0pmk000201o4tt1e8wf0	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-06-30 15:03:15.65	2026-06-30 15:03:15.65
cmqlt50p2000801qgnzs5ydvv	000001	cmqlt50og000701qgzcvdkcbs	cmqlsyn9e000301qgk98rcsjh	\N	{"habitos": {"fumador": true}, "personal": {"hipertension": true}, "quirurgicos": "Apendicectomia"}	2026-06-20 03:38:03.59	2026-06-20 03:41:45.384
cmqoon4p2000101mojrd6s2cv	000002	cmqoon4mm000001mo8duoh8x0	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-06-22 03:55:29.03	2026-06-22 03:55:29.03
cmqv63sza000g01qokw3w9kwp	000003	cmqv63syz000f01qoiamwwadg	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-06-26 16:50:57.527	2026-06-26 16:50:57.527
cmqv73kg8001901qo26o9tzfk	000001	cmqv63syz000f01qoiamwwadg	cmqmx6t43000101phgcog0v6o	\N	\N	2026-06-26 17:18:46.088	2026-06-26 17:18:46.088
cmqva6ika000h01p3j3pus49q	000001	cmqva6iju000g01p3ydrpvy5b	cmqva532b000201p39eq8lpiq	\N	\N	2026-06-26 18:45:02.458	2026-06-26 18:45:02.458
cmqvpjde0000l01phqmgfkbnm	REF-00004	cmqva6iju000g01p3ydrpvy5b	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-06-27 01:54:56.521	2026-06-27 01:54:56.521
cmr0o3mnr000301mowkmfiq8t	000004	cmr0o3mmh000201mo1o59fh73	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-06-30 13:13:33.303	2026-06-30 13:13:33.303
cmr0rxhhb000101o4e54mg6fr	000005	cmr0rxhgu000001o4v5ax6a7z	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-06-30 15:00:45.119	2026-06-30 15:00:45.119
demo_pr_pedro_001	000003	demo_patient_pedro_001	cmqmx6t43000101phgcog0v6o	Paciente geriátrico. Buena adherencia al tratamiento.	"HTA hace 15 años, DM2 hace 8 años, dislipidemia. Exfumador desde 2018. Cirugía de cataratas bilateral 2020. Marcapasos implantado 2022."	2026-01-01 06:15:09.94	2026-01-01 06:15:09.94
demo_pr_lucia_001	000004	demo_patient_lucia_001	cmqmx6t43000101phgcog0v6o	Embarazo de 24 semanas. Control prenatal regular.	"G0P0A0. Embarazo gemelar bicorial biamniótico. Alergia a la penicilina documentada."	2026-04-01 06:15:09.953	2026-04-01 06:15:09.953
demo_pr_diego_001	000005	demo_patient_diego_001	cmqmx6t43000101phgcog0v6o	Adolescente. Acompañado por representante.	"Asma inducida por ejercicio desde los 7 años. Vacunación completa. Sin cirugías previas."	2025-07-01 06:15:09.96	2025-07-01 06:15:09.96
demo_pr_carmen_001	000006	demo_patient_carmen_001	cmqmx6t43000101phgcog0v6o	Paciente con múltiples comorbilidades. Polifarmacia.	"HTA, DM2, ERC estadio 3a, osteoporosis, artrosis. Reemplazo de rodilla derecha 2019. Polimedicada."	2024-07-01 06:15:09.967	2024-07-01 06:15:09.967
demo_pr_maria_001	000002	demo_patient_maria_001	cmqmx6t43000101phgcog0v6o	Paciente de prueba creada vía SQL para demo de funciones IA	"No alergias conocidas. Hipertensión controlada con Losartán 50mg/día. Profesora de primaria."	2026-07-01 05:29:56.081	2026-07-01 05:29:56.081
demo_pr_d1	100001	demo_p_d1	cmqmgxvs6000101oau4ntxdtv	Paciente conocida. Control regular.	"HTA controlada con Losartán. Sin alergias conocidas."	2026-04-01 12:13:12.57	2026-04-01 12:13:12.57
demo_pr_d2	100002	demo_p_d2	cmqmgxvs6000101oau4ntxdtv	Seguimiento de crónicos (HTA + DM2).	"HTA hace 12 años, DM2 hace 6 años. Adherencia buena al tratamiento."	2026-02-01 12:13:12.57	2026-02-01 12:13:12.57
demo_pr_d3	100003	demo_p_d3	cmqmgxvs6000101oau4ntxdtv	Embarazo en seguimiento.	"G1P0A0. Embarazo de 18 semanas. Sin complicaciones."	2025-11-01 12:13:12.57	2025-11-01 12:13:12.57
cmr3l49nd000401mvldhcp7mt	000007	cmr3l49lr000301mvacxbf05b	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-07-02 14:13:22.777	2026-07-02 14:13:22.777
cmr3mbcnd000z01mv5adnn09g	000008	cmr3mbcn6000y01mvam5xi75c	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-07-02 14:46:52.873	2026-07-02 14:46:52.873
cmr3o2o4b002s01mvksm30bdc	000009	cmr3o2o44002r01mvi5e54ml2	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-07-02 15:36:07.067	2026-07-02 15:36:07.067
cmr0pml9d002001moekmrt320	000002	cmr0pml99001z01mogxs7wdnf	cmqva532b000201p39eq8lpiq	\N	{"personal": {"diabetes": true, "hipertension": true}, "familiares": {"diabetes": true, "hipertension": true}}	2026-06-30 13:56:17.569	2026-07-03 05:16:16.848
cmr7yg1w8000f01mpyn3ufito	000010	cmr7yg1vs000e01mpjpus381i	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-07-05 15:37:32.312	2026-07-05 15:37:32.312
cmr9ixqs3001d01mp3x2cjps4	000011	cmr9ixqry001c01mpd1hbxjea	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-07-06 17:58:56.211	2026-07-06 17:58:56.211
cmrdoe2ux000101p8azbmt9qg	000012	cmrdoe2ud000001p8q068x7pf	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-07-09 15:42:41.145	2026-07-09 15:42:41.145
cmrf1bjcq002w01p8eevosijc	000013	cmrf1bjck002v01p88bexrqax	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-07-10 14:32:23.738	2026-07-10 14:32:23.738
cmrf79z5q003p01p8j9plq3l7	000001	cmrf79z5d003o01p849t5b07f	cmrf70dud003b01p84kqb0a69	\N	\N	2026-07-10 17:19:08.606	2026-07-10 17:19:08.606
cmrgkycav000101p22bb4j9of	000014	cmrgkycai000001p29faxbs4v	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-07-11 16:29:46.567	2026-07-11 16:29:46.567
cmrknjqty003001p27vao7k4s	000015	cmrknjqtr002z01p22x59kgqz	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-07-14 12:53:29.11	2026-07-14 12:53:29.11
cmrkp9l1l005g01p20p10qfcd	000016	cmrkp9l1b005f01p2q2s602ci	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-07-14 13:41:34.281	2026-07-14 13:41:34.281
cmrksckaq006901p207fftgs1	000017	cmrksckah006801p26iz1mk3f	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-07-14 15:07:52.13	2026-07-14 15:07:52.13
cmrm7x1l6000101le9hkh0ivo	000018	cmrm7x1kp000001lef5ixp0z1	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-07-15 15:11:28.074	2026-07-15 15:11:28.074
cmrmxq8ka000201l47pf9hqql	000019	cmrmxq8jv000101l40f72pe39	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-07-16 03:14:00.538	2026-07-16 03:14:00.538
cmrmyhl95000201qk048pvbah	000020	cmrmyhl8y000101qk9pxaxfjs	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-07-16 03:35:16.697	2026-07-16 03:35:16.697
cmrnn6o6r000n01nsjdj83ngo	000021	cmrnn6o6k000m01nsfroa1rb3	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-07-16 15:06:37.683	2026-07-16 15:06:37.683
cmrnvmezr000901nhnhxo4axt	000022	cmrnvmezg000801nhsyl7nzhe	cmqlsyn9e000301qgk98rcsjh	\N	\N	2026-07-16 19:02:49.191	2026-07-16 19:02:49.191
cmrodfwag000101r0up24yxhe	000007	cmrodfw9x000001r09661zprq	cmqmx6t43000101phgcog0v6o	\N	\N	2026-07-17 03:21:38.104	2026-07-17 03:21:38.104
\.


--
-- Data for Name: PatientTag; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."PatientTag" (id, "workspaceId", "patientRegistrationId", etiqueta, color, "createdAt") FROM stdin;
cmrn002wj000b01o7v9bdci2x	cmqlsyn9e000301qgk98rcsjh	cmrm7x1l6000101le9hkh0ivo	codo	green	2026-07-16 04:17:38.995
cmrn00979000c01o70r5p50p4	cmqlsyn9e000301qgk98rcsjh	cmrm7x1l6000101le9hkh0ivo	dedo	yellow	2026-07-16 04:17:47.157
cmrn01rnn000d01o7891vfv7f	cmqlsyn9e000301qgk98rcsjh	cmrm7x1l6000101le9hkh0ivo	rodilla	pink	2026-07-16 04:18:57.731
\.


--
-- Data for Name: Prescription; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."Prescription" (id, "encounterId", "pdfUrl", impresa, "createdAt") FROM stdin;
cmqv6g4nc000m01qoinylct6s	cmqv64uh4000h01qoayzpywm8	\N	f	2026-06-26 17:00:32.52
cmr02pqxk000t01mumfl2aynd	cmr020v9j000g01mub1fw5j0k	\N	f	2026-06-30 03:14:53.72
cmr04r00t001701px0czca4rc	cmr04q3hj001201pxr3v245pj	\N	f	2026-06-30 04:11:51.389
cmr0p320f000o01mow3o5nt0c	cmr0o3w6h000401mozcv4wfyt	\N	f	2026-06-30 13:41:06.159
cmr0s6f06000b01o4rt5l6pvl	cmr0s0vu2000401o4xnglyo6c	\N	f	2026-06-30 15:07:41.814
demo_presc_maria_001	demo_enc_maria_001	\N	f	2026-07-01 05:30:50.779
cmr3lpvft000b01mve92qn76m	cmr3l4g3c000501mvsaxou3mo	\N	f	2026-07-02 14:30:10.796
cmr3mpxja001801mvazw4avfh	cmr3mbiyy001201mvd3m4j8c3	\N	f	2026-07-02 14:58:13.126
cmr3ob6qc002w01mv0x5syiqa	cmr3o2wjj002t01mvnvh8ul2p	\N	f	2026-07-02 15:42:44.436
cmr4hn0zq000401qos4ha9blr	cmr4heozi000001o49o8vbyfv	\N	f	2026-07-03 05:23:45.734
cmr7yig0z000l01mpc6dgl8yw	cmr7ygjy9000g01mpw0hcawcx	\N	f	2026-07-05 15:39:23.939
cmr9l2c7c001u01mphrhu31m6	cmr9ixxhn001e01mpvrepgcnz	\N	f	2026-07-06 18:58:29.832
cmrdpu8ty000c01p89qevk5wg	cmrdoeaj1000201p855pyvef0	\N	f	2026-07-09 16:23:14.998
cmrgl439e000701p2z87hek2l	cmrgkyi1g000201p2tvci3n5w	\N	f	2026-07-11 16:34:14.787
cmrglwzir001u01p2ctd2orpk	cmrglvj5n001m01p21wtrk2mc	\N	f	2026-07-11 16:56:42.963
cmrkso836008k01p2bnlj593a	cmrkscq04006a01p27xdrg8rl	\N	f	2026-07-14 15:16:56.178
cmrm8508y000e01lepg5zbuer	cmrm7xdp4000201le36m2u7h3	\N	f	2026-07-15 15:17:39.586
cmrnvoin6000k01nh50pn9vt8	cmrnvmrsd000a01nhqfxkhb30	\N	f	2026-07-16 19:04:27.234
cmroecn35000a01p2ic9tzi48	cmroe94rq000001p2i6w1c9kx	\N	f	2026-07-17 03:47:05.825
\.


--
-- Data for Name: PrescriptionItem; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."PrescriptionItem" (id, "prescriptionId", "medicationId", concentracion, dosis, frecuencia, duracion, "indicacionesEspeciales", "overrideAlerta") FROM stdin;
cmqv6g59v000o01qoz1mrsn6l	cmqv6g4nc000m01qoinylct6s	cmqv6fdef000l01qow8lyhtxx	30mg	1 tableta 	Cada 12 horas	5 días	Cada 12 horas por 5 días 	f
cmr02prfr000v01mup1qjf0zp	cmr02pqxk000t01mumfl2aynd	cmqv6fdef000l01qow8lyhtxx	30mg	1 tab 	Cada 12 horas	5 días	\N	f
cmr02qn9a000z01mufih5kdf3	cmr02pqxk000t01mumfl2aynd	seed_ciprofloxacina	500 mg	1 tab 	Cada 12 horas	7 días	\N	f
cmr02s0sn001601muojxg1680	cmr02pqxk000t01mumfl2aynd	seed_clindamicina	300 mg	1 tab	Cada 8 horas	7 días	\N	f
cmr04r0as001901pxcu5irfyu	cmr04r00t001701px0czca4rc	seed_tramadol	50 mg	1	Cada 6 horas	7 días	\N	f
cmr04rjha001d01px517q607u	cmr04r00t001701px0czca4rc	seed_ibuprofeno	200 mg	2	Cada 6 horas	5 días	\N	f
cmr0p32ic000q01motdxw4xiu	cmr0p320f000o01mow3o5nt0c	cmqv6fdef000l01qow8lyhtxx	30mg	1 tableta	Cada 12 horas	5 días	\N	f
cmr0p50o8000w01mog989yehl	cmr0p320f000o01mow3o5nt0c	cmr0p4nuv000t01moqpj00rs8	presentacion unica	1 tableta	Cada 12 horas	10 días	\N	f
cmr0s6flv000d01o4a1dwbm9h	cmr0s6f06000b01o4rt5l6pvl	cmqv6fdef000l01qow8lyhtxx	30mg	1 tab	Cada 12 horas	5 días	\N	f
cmr0s6y1j000h01o4oinzlite	cmr0s6f06000b01o4rt5l6pvl	cmr0p4nuv000t01moqpj00rs8	presentacion unica	1 tableta 	Cada 12 horas	10 días	\N	f
cmr0ssvvu000n01o44t0tbob3	cmr0s6f06000b01o4rt5l6pvl	cmr0ssb8w000k01o44u32be0f		1 ampolla	Una vez al día	Hasta nueva orden	\N	f
cmr0stys1000r01o4xlxvk09x	cmr0s6f06000b01o4rt5l6pvl	seed_complejo_b	100 mg/2ml inyectable	1 ampolla	Una vez al día	3 días	interdiario	f
demo_pi_acetaminofen_001	demo_presc_maria_001	seed_acetaminofen	500 mg	1 tableta	cada 8 horas	5 días	Tomar con alimentos si presenta molestia gástrica.	f
cmr3lpw2a000d01mvh8aaphef	cmr3lpvft000b01mve92qn76m	cmqv6fdef000l01qow8lyhtxx	30mg	1 tableta	Cada 12 horas	5 días	solo si hay dolor 	f
cmr3mpxzp001a01mv9ipvag9k	cmr3mpxja001801mvazw4avfh	cmqv6fdef000l01qow8lyhtxx	30mg	1 tab	Cada 12 horas	5 días	\N	f
cmr3mqi60001e01mv14qbk0ke	cmr3mpxja001801mvazw4avfh	seed_alopurinol	100 mg	1 tableta	Cada 12 horas	10 días	\N	f
cmr3musb6001p01mvbgwgu58y	cmr3mpxja001801mvazw4avfh	seed_pregabalina	75 mg	1 tableta	Una vez al día	30 días	\N	f
cmr3ob79m002y01mv1d5ei6o3	cmr3ob6qc002w01mv0x5syiqa	cmqv6fdef000l01qow8lyhtxx	30mg	1 tab	Cada 12 horas	5 días	\N	f
cmr4hn1b3000601qotj3jhdf2	cmr4hn0zq000401qos4ha9blr	seed_acetaminof_n	500 mg	2	Cada 6 horas	5 días	\N	f
cmr7yigwj000n01mpro22vwvw	cmr7yig0z000l01mpc6dgl8yw	seed_esomeprazol	de liberaci&oacute;n prolongada 40 mg	1 tableta	Cada 12 horas	10 días	\N	f
cmr9l2cm6001w01mpa2c2zkd5	cmr9l2c7c001u01mphrhu31m6	cmqv6fdef000l01qow8lyhtxx	30mg	1 tab	Cada 12 horas	5 días	\N	f
cmr9l2u15002001mpd4ga01ve	cmr9l2c7c001u01mphrhu31m6	cmr0p4nuv000t01moqpj00rs8	presentacion unica	1 tab	Cada 24 horas	10 días	8 pm 	f
cmrdpu98g000e01p8ts2ydbln	cmrdpu8ty000c01p89qevk5wg	cmqv6fdef000l01qow8lyhtxx	30mg	1 tab	Cada 12 horas	5 días	\N	f
cmrdpuouw000i01p8vza2o3g4	cmrdpu8ty000c01p89qevk5wg	cmr0p4nuv000t01moqpj00rs8	presentacion unica	1 tab	Cada 12 horas	10 días	\N	f
cmrdpvk15000m01p83q7xco52	cmrdpu8ty000c01p89qevk5wg	cmr0ssb8w000k01o44u32be0f		1 ampolla 	Una vez al día	Hasta nueva orden	dosis unica 	f
cmrdpwc57000q01p85aofluzr	cmrdpu8ty000c01p89qevk5wg	seed_complejo_b	Comprimido estándar	ampolla	Una vez al día	3 días	interdiaria	f
cmrdrpgjq002f01p8uhlgcryz	cmrdpu8ty000c01p89qevk5wg	seed_penicilina_g_benzatina_g_sodica_g_procaina		1 tb	Cada 12 horas	10 días	\N	f
cmrgl43qr000a01p26715aa6w	cmrgl439e000701p2z87hek2l	cmqv6fdef000l01qow8lyhtxx	30mg	1 tab	Cada 12 horas	5 días	\N	f
cmrgl4m8i000h01p2ykdt6cdx	cmrgl439e000701p2z87hek2l	cmr0p4nuv000t01moqpj00rs8	presentacion unica	1 tableta	Cada 12 horas	10 días	\N	f
cmrgl5e7h000l01p2v2nyxwhg	cmrgl439e000701p2z87hek2l	cmr0ssb8w000k01o44u32be0f		ampolla	Una vez al día	Hasta nueva orden	unica dosis 	f
cmrgl60zb000p01p2oex9in6m	cmrgl439e000701p2z87hek2l	seed_complejo_b	Comprimido estándar	ampolla	Una vez al día	3 días	1 ampolla via intramuscular interdiaria 3 dosis 	f
cmrglwzws001w01p2spwsvbdm	cmrglwzir001u01p2ctd2orpk	cmqv6fdef000l01qow8lyhtxx	30mg	1 	Cada 12 horas	30 días	\N	f
cmrkso8j3008m01p20s4r68iv	cmrkso836008k01p2bnlj593a	cmqv6fdef000l01qow8lyhtxx	30mg	1 tableta	Cada 12 horas	10 días	\N	f
cmrksolmk008q01p2brm1t8dz	cmrkso836008k01p2bnlj593a	cmr0p4nuv000t01moqpj00rs8	presentacion unica	1 tableta 	Cada 12 horas	10 días	\N	f
cmrksqdy3008u01p2465bzdvo	cmrkso836008k01p2bnlj593a	cmr0ssb8w000k01o44u32be0f		1 ampolla	Una vez al día	Hasta nueva orden	coloca por via intramuscular  el martes 21 de julio 2026	f
cmrksr40z008y01p2kqmp30dc	cmrkso836008k01p2bnlj593a	seed_pregabalina	75 mg	1 tableta	Una vez al día	30 días	tomar 1 atbleta a las 9 pm 	f
cmrm851hv000g01leogungjkm	cmrm8508y000e01lepg5zbuer	cmqv6fdef000l01qow8lyhtxx	30mg	1 tab	Cada 12 horas	5 días	\N	f
cmrm85s4f000k01leqyai5w8f	cmrm8508y000e01lepg5zbuer	cmr0p4nuv000t01moqpj00rs8	presentacion unica	1 tableta	Cada 12 horas	10 días	\N	f
cmrm8wto3002201lelnc6kdxp	cmrm8508y000e01lepg5zbuer	cmr0ssb8w000k01o44u32be0f		1 AMPOLLA	Una vez al día	Hasta nueva orden	1 AMPOLLA IM DOSIS UNICA	f
cmrnvoj4f000m01nh993rhdta	cmrnvoin6000k01nh50pn9vt8	cmqv6fdef000l01qow8lyhtxx	30mg	1 tab	Cada 8 horas	5 días	Sublingual	f
cmroecnj4000c01p2g8gmkqru	cmroecn35000a01p2ic9tzi48	seed_ibuprofeno	200 mg	2	Cada 8 horas	7 días	\N	f
\.


--
-- Data for Name: Staff; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."Staff" (id, cedula, nombre, apellido, email, "pinAccesoHash", rol, "workspaceId", activo, "createdAt", "updatedAt") FROM stdin;
cmqlt1yqs000601qgbj5qjmb9	V-11223344	Laura	Clinica	clinica.prueba@medsysve.test	$2b$10$JwS30CWsR.WXacbh9psxpO1lMKL5f2GE7Monb1fy6qNFdEyIu0CCi	SECRETARY	cmqlsydjl000101qg393bt9gt	t	2026-06-20 03:35:41.092	2026-06-20 03:35:41.092
demo_staff_nurse_001	12345678	Ana Lucía	Pérez Castillo	ana.nurse@medsysve.demo	$2b$10$zEPNfbCPbLz8XI5VjTMc.uMgSrZ2E6qmXGEdo027tKZV6SXYiJBXK	NURSE	cmqmgxvs6000101oau4ntxdtv	t	2026-03-01 06:15:10.079	2026-07-01 06:15:10.079
demo_staff_secretary_001	23456789	María José	Rodríguez Pérez	mary.secretary@medsysve.demo	$2b$10$zEPNfbCPbLz8XI5VjTMc.uMgSrZ2E6qmXGEdo027tKZV6SXYiJBXK	SECRETARY	cmqmgxvs6000101oau4ntxdtv	t	2026-04-01 06:15:10.079	2026-07-01 06:15:10.079
demo_staff_assistant_001	34567890	Luis Eduardo	Hernández López	luis.assistant@medsysve.demo	$2b$10$zEPNfbCPbLz8XI5VjTMc.uMgSrZ2E6qmXGEdo027tKZV6SXYiJBXK	ASSISTANT	cmqmgxvs6000101oau4ntxdtv	t	2026-05-01 06:15:10.079	2026-07-01 06:15:10.079
\.


--
-- Data for Name: StaffNote; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."StaffNote" (id, "workspaceId", "autorId", "autorNombre", texto, "creadoAt") FROM stdin;
cmr0k2vbp000001mo9l0kpl5l	cmqy8838o000201o7vkf0es2z	cmqy8838b000101o7xuh055nu	Walter Ciarrocchi	Consulta preanestésica	2026-06-30 11:20:59.414
\.


--
-- Data for Name: Task; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."Task" (id, "workspaceId", titulo, descripcion, prioridad, "asignadoAId", "patientRegistrationId", "fechaVencimiento", completada, "completadaAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: TwoFactorBackupCode; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."TwoFactorBackupCode" (id, "doctorId", "codeHash", "usedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Vaccine; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."Vaccine" (id, "workspaceId", "patientRegistrationId", vacuna, "fechaAplicacion", dosis, lote, "proximaDosis", notas, "aplicadoPor", "createdAt") FROM stdin;
\.


--
-- Data for Name: WaitingEntry; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."WaitingEntry" (id, "workspaceId", "patientRegistrationId", "appointmentId", turno, estado, notas, "llegadaAt", "llamadoAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Workspace; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public."Workspace" (id, nombre, direccion, telefono, "logoUrl", "membreteUrl", rif, "razonSocial", "direccionFiscal", "tasaBcvActual", "tasaBcvAt", "recordatorioHoras", "recordatorioWa", "recordatorioEmail", "doctorId", "clinicId", "createdAt", "updatedAt", "nombreCifrado", "direccionCifrada", "telefonoCifrado", "razonSocialCifrada", "direccionFiscalCifrada", estado, ciudad, "autoCreateHistoryOnEncounter", "emailAppointmentReminders", "allowedIps") FROM stdin;
cmql6anhd000101o6h4pc7lhl	Consultorio Test	\N	\N	\N	\N	\N	\N	\N	\N	\N	24	f	t	cmql6anh2000001o6yhno0xgt	\N	2026-06-19 16:58:35.233	2026-06-26 02:48:44.303	MePAdrnRELV1UpbdQsWGx0tGFs2r7XUqiDpxArDlnXx0WQs6TSWaKDqnX4Q=	\N	\N	\N	\N	\N	\N	f	t	\N
cmqlsydjl000101qg393bt9gt	Consultorio Prueba	\N	\N	\N	\N	\N	\N	\N	\N	\N	24	f	t	cmqlsydj8000001qgpwn9mbjm	\N	2026-06-20 03:32:53.649	2026-06-26 02:48:44.306	Xigl8ln8PTW/mRPW+45Ngc3Ar5pCF+qMbTx0P8YrhbrMsUtbD3VyrAWqIWqmjw==	\N	\N	\N	\N	\N	\N	f	t	\N
cmqmgxvs6000101oau4ntxdtv	Consultorio Demo MedSysVE	\N	\N	\N	\N	\N	\N	\N	\N	\N	24	f	t	cmqmgxvrx000001oa0fupphfw	\N	2026-06-20 14:44:21.414	2026-06-26 02:48:44.31	Dxxo5myS9RfEJAJ/EybY1eOCZVO+DUlPW/GYIO0Rz3fr9VEDrIGLkt9zOQNMapZPXKOVWxs=	\N	\N	\N	\N	\N	\N	f	t	\N
cmqmm9uon000101p4bqwmyd2j	Consultorio Test Login	\N	\N	\N	\N	\N	\N	\N	\N	\N	24	f	t	cmqmm9uoa000001p4j8mmb508	\N	2026-06-20 17:13:37.943	2026-06-26 02:48:44.311	SJlewygD8zvk2HK08M8/drJYxExaxOnwrZGNICfZAt7ta4FbXUx/n7uYQkYOmg/KmLI=	\N	\N	\N	\N	\N	\N	f	t	\N
cmroeu3gm000t01p22bdw7ixd	Consultorio Dr Pierluissis	\N	\N	\N	\N	\N	\N	\N	\N	\N	24	f	t	cmqmx6t3y000001phuzs1sirz	\N	2026-07-17 04:00:40.198	2026-07-17 04:00:40.198	\N	\N	\N	\N	\N	\N	\N	f	t	\N
cmqmx6t43000101phgcog0v6o	Admin MedSysVE	\N	\N	/api/uploads/logos/cmqmx6t43000101phgcog0v6o-1784260784273-cvbija.jpg	/api/uploads/membretes/cmqmx6t43000101phgcog0v6o-1784260815086-lnqmq9.jpg	\N	\N	\N	\N	\N	24	f	t	cmqmx6t3y000001phuzs1sirz	\N	2026-06-20 22:19:11.715	2026-07-17 04:01:48.452	o2U17/EYGtmsceBCwyf5UXWEnX9M5HjMavFw1wSuDGhFM1kCy88bx0cY	\N	\N	\N	\N	\N	\N	f	t	\N
cmrp83c2m000b01lm03w8mcrr	Artros Unidad de Cirugía Articular de Hombro, Mano y Rodilla 	Av. 23 de enero con calle Páez Hospital Clínico del Este 	\N	\N	\N	\N	\N	\N	\N	\N	24	f	t	cmrp83c2e000a01lm4yifqc0c	\N	2026-07-17 17:39:40.126	2026-07-17 17:39:40.126	9RJG/hGB+RMp+QgVl8w6GuaypejzGCmbD7ao9zc2iVsulCUPaa6h8e82IgPYWPdHQy0/f/X942E7Cq6cGyrS2VLR5EdXcvhSjey8/NQloG1zVF91nQxB/+WH	OgdkDJHNuj4a13k4rUWhaRxzxP9RV/3jQcibRRXphdhvFJOArLFPFxD4oO130Y5PHLFtmgpVNJxLLn7R+TZsKbslcz1APGpP52ijOkRoombRaiZNY8yh	\N	\N	\N	Portuguesa	Guanare	f	t	\N
cmqy8838o000201o7vkf0es2z	Dr. Ciarrocchi 	\N	\N	\N	\N	\N	\N	\N	623.0223	2026-06-30 11:22:37.657	24	f	t	cmqy8838b000101o7xuh055nu	\N	2026-06-28 20:13:35.209	2026-06-30 11:22:37.668	p81M9IMXEF/y85zwmN+aNxAjKbXLC1KKX8BltY/r2nuGl96ZM4AmGIE4cQ==	\N	\N	\N	\N	Guárico	San Juan de los Morros	f	t	\N
cmrf70dud003b01p84kqb0a69	Dra Fabiola guerrero 	El cuji	04121439272	\N	\N	\N	\N	\N	\N	\N	24	f	t	cmrf70du1003a01p8f2k0qlkg	\N	2026-07-10 17:11:41.077	2026-07-10 17:11:41.077	glzrnuSdP0hr4f+EAdPFmDHjeHwialbQ83WcCC610pdn5VSCbfnkfkP+zRDbv/GhdA==	ViHCDBkee7ZTQwi9r+Ps9e70mqVtoG/httRHtoMXDvL6VWw=	8/GREV1XSZcvxqf4K4F9rC8W73g/kqKeyWJ/WkyroYfwkjhV1X25	\N	\N	Lara	Barquisimeto	f	t	\N
UNMIGRATED_PATIENTS	Pacientes sin workspace (backfill)	\N	\N	\N	\N	\N	\N	\N	\N	\N	24	f	t	cmql6anh2000001o6yhno0xgt	\N	2026-06-26 18:35:47.977	2026-06-26 18:35:47.977	\N	\N	\N	\N	\N	\N	\N	f	t	\N
cmrpefiep000601o1rb4awe9w	Dr. Inri Pérez Zambrano 	\N	\N	\N	\N	\N	\N	\N	\N	\N	24	f	t	cmrpefiai000501o10fgledn0	\N	2026-07-17 20:37:05.905	2026-07-17 20:37:05.905	rErugcf7Y/mydC8vHchGQJW/u+LwasZvnsspfNBHLlGpSdsh6azI6E9jriU+xssSytomaaw=	\N	\N	\N	\N	Portuguesa	Guanare	f	t	\N
cmqlsyn9e000301qgk98rcsjh	Dr joel pierluissis 	CENTRO CLINICO LA VIÑA	04127828495	/api/uploads/logos/cmqlsyn9e000301qgk98rcsjh-1782784690199-ixkmlf.jpg	\N	\N	\N	\N	725.7470	2026-07-16 02:51:58.376	24	f	t	cmqlsyn94000201qg8eeqn1c2	\N	2026-06-20 03:33:06.242	2026-07-16 02:51:58.376	lf5Ap5KdEh/Ia+4eZI8zAw93P6ax+es7+o0cwANxg4GGYrhTT90vaZW6TDwnPW+y	fT/jprNJoZIyMeL/EbuRyXhe3GYlXHpm1hKGoCYYqQOGIIhr	5IWexWdk5QrwPzwzNYcNNai+59PgjtowKFm1en+cdR9yK5R0q4yQ	\N	\N	Carabobo	Valencia	f	t	\N
cmqva532b000201p39eq8lpiq	Consultorio Dra Maita	\N	\N	/api/uploads/logos/cmqva532b000201p39eq8lpiq-1782513167793-91xpko.png	/api/uploads/membretes/cmqva532b000201p39eq8lpiq-1782513187346-t2n6uf.png	\N	\N	\N	727.4512	2026-07-16 11:54:24.962	24	f	f	cmqva5325000101p3bu118ykx	\N	2026-06-26 18:43:55.715	2026-07-16 11:54:24.972	m/FzYVsXtVfP7oxVLGhSKJ7kbBOPx+VoB1h6lasGo8G1TkFtTAiu1hjgQk3Q4I20Wg==	\N	\N	\N	\N	Guárico	San Juan de los Morros	f	t	\N
cmrodu1xc000501r0ly4wisk4	Consultorio	\N	\N	\N	\N	\N	\N	\N	\N	\N	24	f	t	cmrodu1x1000401r0as2udib9	\N	2026-07-17 03:32:38.592	2026-07-17 03:32:38.592	ycweXCsuxKEvJFS82vA3a55FJUVp88mNhttXzas6Cn/83R2EphLk	\N	\N	\N	\N	Distrito Capital	Caracas	f	t	\N
cmroer6g7000s01p241s4z3ii	Clinica  Loira	\N	\N	\N	\N	\N	\N	\N	\N	\N	24	f	t	cmqmx6t3y000001phuzs1sirz	\N	2026-07-17 03:58:24.103	2026-07-17 03:58:24.103	\N	\N	\N	\N	\N	\N	\N	f	t	\N
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: medsysve
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
958b5698-4a9f-4235-9c11-13cbc0848b0a	2f326d5aa0748abfd96bdfba956bf40c63bdf09ad5a4ae5a67ac7aee12b8626b	2026-06-22 12:29:06.695353+00	20260616190926_init		\N	2026-06-22 12:29:06.695353+00	0
6d067f4d-355c-4aff-b833-0e1d148eebff	f93cad4d688d4bb0fe6ffe2a9875d6c0280031f791721845aa00edae4a932005	2026-06-22 12:29:12.326873+00	20260616193255_add_sexotype_enum_and_schema_fixes		\N	2026-06-22 12:29:12.326873+00	0
62d04775-3669-4129-a635-55ddb8377459	cce2d6c48cd83f8fe0ddbe26cd7861764cc3deab837d50cb9fb5388c6eabafd9	2026-06-22 12:29:16.86079+00	20260617013600_add_clinical_models		\N	2026-06-22 12:29:16.86079+00	0
2f396ba8-598c-4d33-9fd5-dcb287f0a545	064a7507d859b579d60269dbbee4de398728315301b6f08a0e87e7315f13f1b6	2026-06-22 12:29:21.31376+00	20260620000000_add_doctor_plan_admin		\N	2026-06-22 12:29:21.31376+00	0
manual_98c7c9a3a9233cc8	manual	2026-06-23 00:40:47.551526+00	20260622000000_add_labresult_valores	Manually applied — new column add	\N	2026-06-23 00:40:47.551526+00	1
7fcdd028-70e1-43a3-ba7c-433428e02ac8	01969c385c3de440153e5ec29c5cc92ad0bf1cc3d1adf3658f91cf273233fc9d	2026-06-23 03:11:07.293975+00	20260622120000_add_audit_event	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260622120000_add_audit_event\n\nDatabase error code: 42P07\n\nDatabase error:\nERROR: relation "AuditEvent" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P07), message: "relation \\"AuditEvent\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("heap.c"), line: Some(1164), routine: Some("heap_create_with_catalog") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260622120000_add_audit_event"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20260622120000_add_audit_event"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:255	\N	2026-06-23 03:11:07.293975+00	1
c4fdef35-e97e-41a8-a253-aa573f13ed52	ee0bf9cdf3e64b1f7b4d916190f1e1aeb53e8286daeee0ead60470e61b44c84e	2026-06-23 11:56:30.352742+00	20260622130000_add_field_encryption	\N	\N	2026-06-23 11:56:30.244127+00	1
19aa2ce5-4469-4582-9838-213891cf75d6	4fb0e61c949ffe35fcf2bb80a9606bd889d58b9b294a30c0755918780c23becb	2026-06-25 15:47:14.954839+00	20260625000000_patient_cedula_encryption_contract	\N	\N	2026-06-25 15:47:14.927456+00	1
6da22d1e-9608-4a88-9d1d-1888bab7e901	88d3207521942eb463d640cc5d42d381a54c4fc2319efb437082e8aeb184bf98	2026-06-23 11:56:30.362204+00	20260622140000_add_2fa	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260622140000_add_2fa\n\nDatabase error code: 42P07\n\nDatabase error:\nERROR: relation "TwoFactorBackupCode" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P07), message: "relation \\"TwoFactorBackupCode\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("heap.c"), line: Some(1164), routine: Some("heap_create_with_catalog") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260622140000_add_2fa"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20260622140000_add_2fa"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:255	\N	2026-06-23 11:56:30.362204+00	1
ca116ed9-9d43-4713-8940-9983b0e797bd	4b2956dd720e850ce596d14d69b9a0990ad80e45ae44ec27ace22ec2108502f0	2026-06-25 15:47:14.975785+00	20260625000001_encounter_signature_hash	\N	\N	2026-06-25 15:47:14.959002+00	1
3041c412-b33c-4b2d-95d2-e9bbc3e4a1c0	de05a7a3d8afae7026087914b74097b2c6ab0797e2361aa192f8a8827e32bbaf	2026-06-25 22:51:28.7487+00	20260625174152_encrypt_phi_columns	\N	\N	2026-06-25 22:51:28.662241+00	1
0ff06bfa-bf37-4a88-9f4d-c5847cc703fe	c434a33f0dbe3147084d4ea7dd5b137f78e16838f31a34098f91f4f8d48f917d	2026-06-25 18:50:21.568194+00	20260625130000_legal_compliance_foundation	\N	\N	2026-06-25 18:50:20.881026+00	1
1c8ade0a-5ec7-4774-b4d2-f0fe368deaff	fec17f87fe056466aa525f638b275847ac3310e1d76202d9e03490ee974144ec	2026-06-26 04:24:26.181245+00	20260625224500_add_email_otp	\N	\N	2026-06-26 04:24:26.133943+00	1
71d5335f-aabc-458e-bde4-9e68e02287d2	41ed5654b15acfc33449d129a191646921b04f04f065c0f0c87bb6d0f79305e8	2026-06-26 23:38:36.160031+00	20260626180755_imaging_order_items	\N	\N	2026-06-26 23:38:36.019326+00	1
0ec9f791-063f-47fa-b060-d059f64e0dc9	8ecf70d6fc365b6569a4769ba25fc002cbd64abe7cabebd9e27dc4e17e65c3b2	2026-06-26 18:35:48.030847+00	20260626130000_patient_workspace_tenant_isolation	\N	\N	2026-06-26 18:35:47.963151+00	1
bf137909-fdc5-4def-b985-90bd3a10620b	5f490172e9395c755e0c5e830ac50152aaf7af731826444744f6d23e51be63cd	2026-06-27 23:26:45.220957+00	20260627181127_clinic_workspace_location	\N	\N	2026-06-27 23:26:45.168261+00	1
b0381a1a-42ec-4206-9f0c-09b37f3f01c6	042a130328897093f1a1091875a24f830d2a52b70ff97af9ced5c1d361f1ae9c	2026-06-27 17:09:54.906498+00	20260627115657_add_referral_received_notification	\N	\N	2026-06-27 17:09:54.740599+00	1
1c8238f4-1d99-4645-82cf-40e1251b4e12	53c94c7e5b910951add744d64f275133757185a0b48724afbafd0b9aa7d433c2	2026-06-28 02:24:49.506137+00	20260627211121_add_stripe_fields	\N	\N	2026-06-28 02:24:49.473439+00	1
3b4115fd-efde-4916-8d3d-af44eec9bf02	1762877d2ab7750c292f63559c676bee34afa930c6bdf1cd7ee569f5ff719c09	2026-06-28 01:14:14.148938+00	20260627193000_clinic_admin	\N	\N	2026-06-28 01:14:14.055829+00	1
575480e9-ce90-4a97-a7d0-727b773f1b48	d795da26988c5b5d1156c70eb0ec914c2fb72950e61b8d544ba4b32054e7f617	2026-06-28 01:14:14.233932+00	20260628000000_add_clinic_invitation_code	\N	\N	2026-06-28 01:14:14.151925+00	1
ea435044-9afe-4af4-9a18-4cb5800df69d	c2f8898c00ee079817ecb111072efa8de946b8b8350699243b3f59429585374a	2026-06-28 05:25:09.960136+00	20260628001418_add_extra_seat_to_invitation_code	\N	\N	2026-06-28 05:25:09.933277+00	1
5b49fff6-c518-46c7-9f24-85feaa0c53c4	a2cc3350f2a6a3094b4784242df5cb61474beb1cc7573e6905250e1473b48ee0	2026-06-30 01:09:20.194724+00	20260628204000_add_patient_direccion	\N	\N	2026-06-30 01:09:20.137061+00	1
d646e744-f0c5-47ec-b323-57aa28e45774	8358838179da13d28bc8118497f162b3c76a7e2c2fcd610674905b541ca66f1c	2026-06-30 04:04:41.632872+00	20260630000000_add_sello_url	\N	\N	2026-06-30 04:04:41.614248+00	1
8f91d344-6a38-4325-bf7f-3fc56180db93	f7fd6313f9438f69834f1edc86db0e74779511f8252a041042ccd39f3a8a2115	2026-07-02 20:55:37.403372+00	20260702145636_encounter_motivo_encryption	\N	\N	2026-07-02 20:55:37.380741+00	1
344921b6-287a-4a14-a567-dbe0355792e2	7daf3d4ee02b718e1df701312a4f56dc1706e9240e6d58369b900a15c540dbed	2026-07-03 00:44:42.503846+00	20260702191500_audit_event_archival	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260702191500_audit_event_archival\n\nDatabase error code: 42701\n\nDatabase error:\nERROR: column "archivedAt" of relation "AuditEvent" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42701), message: "column \\"archivedAt\\" of relation \\"AuditEvent\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(7347), routine: Some("check_for_column_name_collision") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20260702191500_audit_event_archival"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20260702191500_audit_event_archival"\n             at schema-engine/commands/src/commands/apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:255	\N	2026-07-03 00:41:06.716821+00	1
a5230ecf-910c-4cb0-ac71-59af29ac0870	1efba34a1a2f446303f37f93d51e37dc47bce72f2d8ad3c99d923c985abd7eb6	2026-07-16 03:54:29.69909+00	20260716034000_add_express_orders	\N	\N	2026-07-16 03:54:29.642159+00	1
7aa8dc45-b0ab-4a41-87cc-0acc52a35daf	b921829fe6c4cc5ec5e7f79ee3d451212d63e4c88afd24c030506dfed46dea45	2026-07-03 04:18:50.511798+00	20260703010000_drop_encounter_motivo_legacy	\N	\N	2026-07-03 04:18:50.426273+00	1
8cc29fd7-dd21-4aa2-9dc7-a0113914d168	c900c32553981b56cc1b3fa51bf3eada08c45ec9a8da63e40e898a9335ac5763	2026-07-07 17:46:34.339913+00	20260707113807_add_encounter_version	\N	\N	2026-07-07 17:46:34.305854+00	1
d0e7e084-5678-4e82-acea-d2c79488c885	0782f96f2e138b3fc33cc85ec258a99e346d3b19a0a08e43dbe63e8cc894026e	2026-07-07 17:46:34.436184+00	20260707121442_add_doctor_feature_override	\N	\N	2026-07-07 17:46:34.340935+00	1
56112700-4294-4312-ae7f-eeecd5e4aa2e	e10b061a2d001e2a285b4219d8c4aef42aa44203ae931e6520cf31952107a0a0	2026-07-16 07:13:09.975827+00	20260716071000_add_workspace_settings	\N	\N	2026-07-16 07:13:09.95725+00	1
6d6150b1-ac0d-4bae-9fd8-16aa3d046366	567da9946c4e1bc0da970f5d07d832ae89e99ba4780d76d7cb8846788e0d9452	2026-07-08 03:01:52.830102+00	20260707215541_add_appointment_version	\N	\N	2026-07-08 03:01:52.810638+00	1
9f47d400-ccba-46d0-89a1-def7af9af758	e8f28eddeeefd90f09c78612d02b3b73ef1b3b6b8b8a4e5b4b0c30ab037bde0f	2026-07-11 05:03:25.043793+00	20260710235325_rename_anamnesis_to_historia_clinica	\N	\N	2026-07-11 05:03:25.018876+00	1
cb965d12-96d1-4d75-bab6-92d69b1842f7	4b540e64d394d6c7906803e291f96b20c26c888802a6405545b18b955a77f663	2026-07-11 05:42:48.173057+00	20260711001734_add_doctor_report_preferences	\N	\N	2026-07-11 05:42:48.112833+00	1
e28ef6f9-ebea-407a-b009-fca359f37d49	21eac76e5f6e872408a3c3384b09ad76e1a153fa611ec86d565ada1b3797fcd3	2026-07-16 12:19:29.56982+00	20260716120900_add_encounter_scales	\N	\N	2026-07-16 12:19:29.496825+00	1
d2387dd9-d967-4cae-b654-3ee4a14b3b8f	9cee8ad6a69663f4a7daf635a9e9859d4c61e069569cbcbeb3c8373dad1915f4	2026-07-16 02:03:42.399317+00	20260716020000_add_encounter_report_override	\N	\N	2026-07-16 02:03:42.382983+00	1
c83bdbae-7d00-4729-b32c-62ae690bdfcf	c182abe7f41de7f9c0dd033700ac5b60cc317a630b3be5650605216b71ba7683	2026-07-16 12:26:21.813768+00	20260716121500_add_specialty_consults	\N	\N	2026-07-16 12:26:21.795407+00	1
6c460f3b-dd12-437a-aee2-347db232a59c	4e9c15173773edeca7e614e8f812ce81e80c3b82dd225664a967e673355606ee	2026-07-16 13:28:58.023504+00	20260716132500_add_physical_exam_and_specialty_to_templates	\N	\N	2026-07-16 13:28:58.007177+00	1
\.


--
-- Name: Alergia Alergia_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Alergia"
    ADD CONSTRAINT "Alergia_pkey" PRIMARY KEY (id);


--
-- Name: Announcement Announcement_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Announcement"
    ADD CONSTRAINT "Announcement_pkey" PRIMARY KEY (id);


--
-- Name: Appointment Appointment_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_pkey" PRIMARY KEY (id);


--
-- Name: AuditEvent AuditEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."AuditEvent"
    ADD CONSTRAINT "AuditEvent_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: AvailabilityException AvailabilityException_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."AvailabilityException"
    ADD CONSTRAINT "AvailabilityException_pkey" PRIMARY KEY (id);


--
-- Name: BreachIncident BreachIncident_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."BreachIncident"
    ADD CONSTRAINT "BreachIncident_pkey" PRIMARY KEY (id);


--
-- Name: ClinicAdmin ClinicAdmin_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."ClinicAdmin"
    ADD CONSTRAINT "ClinicAdmin_pkey" PRIMARY KEY (id);


--
-- Name: ClinicInvitationCode ClinicInvitationCode_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."ClinicInvitationCode"
    ADD CONSTRAINT "ClinicInvitationCode_pkey" PRIMARY KEY (id);


--
-- Name: ClinicPost ClinicPost_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."ClinicPost"
    ADD CONSTRAINT "ClinicPost_pkey" PRIMARY KEY (id);


--
-- Name: Clinic Clinic_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Clinic"
    ADD CONSTRAINT "Clinic_pkey" PRIMARY KEY (id);


--
-- Name: ConsentAcceptance ConsentAcceptance_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."ConsentAcceptance"
    ADD CONSTRAINT "ConsentAcceptance_pkey" PRIMARY KEY (id);


--
-- Name: ConsentTemplate ConsentTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."ConsentTemplate"
    ADD CONSTRAINT "ConsentTemplate_pkey" PRIMARY KEY (id);


--
-- Name: DataDeletionRequest DataDeletionRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."DataDeletionRequest"
    ADD CONSTRAINT "DataDeletionRequest_pkey" PRIMARY KEY (id);


--
-- Name: DataExportRequest DataExportRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."DataExportRequest"
    ADD CONSTRAINT "DataExportRequest_pkey" PRIMARY KEY (id);


--
-- Name: Diagnosis Diagnosis_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Diagnosis"
    ADD CONSTRAINT "Diagnosis_pkey" PRIMARY KEY (id);


--
-- Name: DoctorAvailability DoctorAvailability_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."DoctorAvailability"
    ADD CONSTRAINT "DoctorAvailability_pkey" PRIMARY KEY (id);


--
-- Name: DoctorClinicAffiliation DoctorClinicAffiliation_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."DoctorClinicAffiliation"
    ADD CONSTRAINT "DoctorClinicAffiliation_pkey" PRIMARY KEY (id);


--
-- Name: DoctorFeatureOverride DoctorFeatureOverride_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."DoctorFeatureOverride"
    ADD CONSTRAINT "DoctorFeatureOverride_pkey" PRIMARY KEY (id);


--
-- Name: DoctorReportPreferences DoctorReportPreferences_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."DoctorReportPreferences"
    ADD CONSTRAINT "DoctorReportPreferences_pkey" PRIMARY KEY (id);


--
-- Name: Doctor Doctor_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Doctor"
    ADD CONSTRAINT "Doctor_pkey" PRIMARY KEY (id);


--
-- Name: DocumentTemplate DocumentTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."DocumentTemplate"
    ADD CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY (id);


--
-- Name: Document Document_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_pkey" PRIMARY KEY (id);


--
-- Name: EmailOtp EmailOtp_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."EmailOtp"
    ADD CONSTRAINT "EmailOtp_pkey" PRIMARY KEY (id);


--
-- Name: EncounterScale EncounterScale_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."EncounterScale"
    ADD CONSTRAINT "EncounterScale_pkey" PRIMARY KEY (id);


--
-- Name: EncounterTemplate EncounterTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."EncounterTemplate"
    ADD CONSTRAINT "EncounterTemplate_pkey" PRIMARY KEY (id);


--
-- Name: Encounter Encounter_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Encounter"
    ADD CONSTRAINT "Encounter_pkey" PRIMARY KEY (id);


--
-- Name: ExpressOrder ExpressOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."ExpressOrder"
    ADD CONSTRAINT "ExpressOrder_pkey" PRIMARY KEY (id);


--
-- Name: ImagingOrderItem ImagingOrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."ImagingOrderItem"
    ADD CONSTRAINT "ImagingOrderItem_pkey" PRIMARY KEY (id);


--
-- Name: ImagingOrder ImagingOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."ImagingOrder"
    ADD CONSTRAINT "ImagingOrder_pkey" PRIMARY KEY (id);


--
-- Name: InsuranceProvider InsuranceProvider_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."InsuranceProvider"
    ADD CONSTRAINT "InsuranceProvider_pkey" PRIMARY KEY (id);


--
-- Name: InvoiceItem InvoiceItem_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY (id);


--
-- Name: Invoice Invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY (id);


--
-- Name: LabOrder LabOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."LabOrder"
    ADD CONSTRAINT "LabOrder_pkey" PRIMARY KEY (id);


--
-- Name: LabResult LabResult_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."LabResult"
    ADD CONSTRAINT "LabResult_pkey" PRIMARY KEY (id);


--
-- Name: LegalVersion LegalVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."LegalVersion"
    ADD CONSTRAINT "LegalVersion_pkey" PRIMARY KEY (id);


--
-- Name: Medication Medication_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Medication"
    ADD CONSTRAINT "Medication_pkey" PRIMARY KEY (id);


--
-- Name: Mensaje Mensaje_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Mensaje"
    ADD CONSTRAINT "Mensaje_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: Pago Pago_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Pago"
    ADD CONSTRAINT "Pago_pkey" PRIMARY KEY (id);


--
-- Name: PatientConsent PatientConsent_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."PatientConsent"
    ADD CONSTRAINT "PatientConsent_pkey" PRIMARY KEY (id);


--
-- Name: PatientInsurance PatientInsurance_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."PatientInsurance"
    ADD CONSTRAINT "PatientInsurance_pkey" PRIMARY KEY (id);


--
-- Name: PatientRegistration PatientRegistration_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."PatientRegistration"
    ADD CONSTRAINT "PatientRegistration_pkey" PRIMARY KEY (id);


--
-- Name: PatientTag PatientTag_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."PatientTag"
    ADD CONSTRAINT "PatientTag_pkey" PRIMARY KEY (id);


--
-- Name: Patient Patient_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Patient"
    ADD CONSTRAINT "Patient_pkey" PRIMARY KEY (id);


--
-- Name: PrescriptionItem PrescriptionItem_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."PrescriptionItem"
    ADD CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY (id);


--
-- Name: Prescription Prescription_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Prescription"
    ADD CONSTRAINT "Prescription_pkey" PRIMARY KEY (id);


--
-- Name: StaffNote StaffNote_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."StaffNote"
    ADD CONSTRAINT "StaffNote_pkey" PRIMARY KEY (id);


--
-- Name: Staff Staff_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_pkey" PRIMARY KEY (id);


--
-- Name: Task Task_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_pkey" PRIMARY KEY (id);


--
-- Name: TwoFactorBackupCode TwoFactorBackupCode_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."TwoFactorBackupCode"
    ADD CONSTRAINT "TwoFactorBackupCode_pkey" PRIMARY KEY (id);


--
-- Name: Vaccine Vaccine_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Vaccine"
    ADD CONSTRAINT "Vaccine_pkey" PRIMARY KEY (id);


--
-- Name: WaitingEntry WaitingEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."WaitingEntry"
    ADD CONSTRAINT "WaitingEntry_pkey" PRIMARY KEY (id);


--
-- Name: Workspace Workspace_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Workspace"
    ADD CONSTRAINT "Workspace_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Alergia_patientRegistrationId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Alergia_patientRegistrationId_idx" ON public."Alergia" USING btree ("patientRegistrationId");


--
-- Name: Alergia_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Alergia_workspaceId_idx" ON public."Alergia" USING btree ("workspaceId");


--
-- Name: Announcement_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Announcement_workspaceId_idx" ON public."Announcement" USING btree ("workspaceId");


--
-- Name: Appointment_fechaHora_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Appointment_fechaHora_idx" ON public."Appointment" USING btree ("fechaHora");


--
-- Name: Appointment_patientRegistrationId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Appointment_patientRegistrationId_idx" ON public."Appointment" USING btree ("patientRegistrationId");


--
-- Name: Appointment_serieId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Appointment_serieId_idx" ON public."Appointment" USING btree ("serieId");


--
-- Name: Appointment_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Appointment_workspaceId_idx" ON public."Appointment" USING btree ("workspaceId");


--
-- Name: AuditEvent_action_createdAt_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "AuditEvent_action_createdAt_idx" ON public."AuditEvent" USING btree (action, "createdAt" DESC);


--
-- Name: AuditEvent_actorId_createdAt_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "AuditEvent_actorId_createdAt_idx" ON public."AuditEvent" USING btree ("actorId", "createdAt" DESC);


--
-- Name: AuditEvent_archivedAt_createdAt_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "AuditEvent_archivedAt_createdAt_idx" ON public."AuditEvent" USING btree ("archivedAt", "createdAt");


--
-- Name: AuditEvent_patientId_createdAt_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "AuditEvent_patientId_createdAt_idx" ON public."AuditEvent" USING btree ("patientId", "createdAt" DESC);


--
-- Name: AuditEvent_resourceType_resourceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "AuditEvent_resourceType_resourceId_idx" ON public."AuditEvent" USING btree ("resourceType", "resourceId");


--
-- Name: AuditEvent_workspaceId_createdAt_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "AuditEvent_workspaceId_createdAt_idx" ON public."AuditEvent" USING btree ("workspaceId", "createdAt" DESC);


--
-- Name: AuditLog_actorId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "AuditLog_actorId_idx" ON public."AuditLog" USING btree ("actorId");


--
-- Name: AuditLog_entidad_entidadId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "AuditLog_entidad_entidadId_idx" ON public."AuditLog" USING btree (entidad, "entidadId");


--
-- Name: AuditLog_workspaceId_createdAt_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "AuditLog_workspaceId_createdAt_idx" ON public."AuditLog" USING btree ("workspaceId", "createdAt");


--
-- Name: AvailabilityException_fecha_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "AvailabilityException_fecha_idx" ON public."AvailabilityException" USING btree (fecha);


--
-- Name: AvailabilityException_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "AvailabilityException_workspaceId_idx" ON public."AvailabilityException" USING btree ("workspaceId");


--
-- Name: BreachIncident_severity_detectedAt_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "BreachIncident_severity_detectedAt_idx" ON public."BreachIncident" USING btree (severity, "detectedAt");


--
-- Name: BreachIncident_slug_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "BreachIncident_slug_key" ON public."BreachIncident" USING btree (slug);


--
-- Name: BreachIncident_status_detectedAt_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "BreachIncident_status_detectedAt_idx" ON public."BreachIncident" USING btree (status, "detectedAt");


--
-- Name: ClinicAdmin_clinicId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "ClinicAdmin_clinicId_idx" ON public."ClinicAdmin" USING btree ("clinicId");


--
-- Name: ClinicAdmin_email_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "ClinicAdmin_email_idx" ON public."ClinicAdmin" USING btree (email);


--
-- Name: ClinicAdmin_email_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "ClinicAdmin_email_key" ON public."ClinicAdmin" USING btree (email);


--
-- Name: ClinicInvitationCode_clinicId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "ClinicInvitationCode_clinicId_idx" ON public."ClinicInvitationCode" USING btree ("clinicId");


--
-- Name: ClinicInvitationCode_code_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "ClinicInvitationCode_code_key" ON public."ClinicInvitationCode" USING btree (code);


--
-- Name: ClinicPost_clinicId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "ClinicPost_clinicId_idx" ON public."ClinicPost" USING btree ("clinicId");


--
-- Name: ClinicPost_publicadoAt_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "ClinicPost_publicadoAt_idx" ON public."ClinicPost" USING btree ("publicadoAt");


--
-- Name: Clinic_estado_ciudad_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Clinic_estado_ciudad_idx" ON public."Clinic" USING btree (estado, ciudad);


--
-- Name: Clinic_rif_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "Clinic_rif_key" ON public."Clinic" USING btree (rif);


--
-- Name: Clinic_slug_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "Clinic_slug_key" ON public."Clinic" USING btree (slug);


--
-- Name: Clinic_stripeCustomerId_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "Clinic_stripeCustomerId_key" ON public."Clinic" USING btree ("stripeCustomerId");


--
-- Name: Clinic_stripeSubscriptionId_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "Clinic_stripeSubscriptionId_key" ON public."Clinic" USING btree ("stripeSubscriptionId");


--
-- Name: ConsentAcceptance_doctorId_createdAt_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "ConsentAcceptance_doctorId_createdAt_idx" ON public."ConsentAcceptance" USING btree ("doctorId", "createdAt");


--
-- Name: ConsentAcceptance_legalVersionId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "ConsentAcceptance_legalVersionId_idx" ON public."ConsentAcceptance" USING btree ("legalVersionId");


--
-- Name: ConsentAcceptance_slug_version_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "ConsentAcceptance_slug_version_idx" ON public."ConsentAcceptance" USING btree (slug, version);


--
-- Name: ConsentTemplate_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "ConsentTemplate_workspaceId_idx" ON public."ConsentTemplate" USING btree ("workspaceId");


--
-- Name: DataDeletionRequest_doctorId_requestedAt_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "DataDeletionRequest_doctorId_requestedAt_idx" ON public."DataDeletionRequest" USING btree ("doctorId", "requestedAt");


--
-- Name: DataDeletionRequest_status_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "DataDeletionRequest_status_idx" ON public."DataDeletionRequest" USING btree (status);


--
-- Name: DataExportRequest_doctorId_requestedAt_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "DataExportRequest_doctorId_requestedAt_idx" ON public."DataExportRequest" USING btree ("doctorId", "requestedAt");


--
-- Name: DataExportRequest_downloadToken_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "DataExportRequest_downloadToken_key" ON public."DataExportRequest" USING btree ("downloadToken");


--
-- Name: DataExportRequest_status_expiresAt_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "DataExportRequest_status_expiresAt_idx" ON public."DataExportRequest" USING btree (status, "expiresAt");


--
-- Name: Diagnosis_encounterId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Diagnosis_encounterId_idx" ON public."Diagnosis" USING btree ("encounterId");


--
-- Name: DoctorAvailability_workspaceId_diaSemana_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "DoctorAvailability_workspaceId_diaSemana_key" ON public."DoctorAvailability" USING btree ("workspaceId", "diaSemana");


--
-- Name: DoctorAvailability_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "DoctorAvailability_workspaceId_idx" ON public."DoctorAvailability" USING btree ("workspaceId");


--
-- Name: DoctorClinicAffiliation_clinicId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "DoctorClinicAffiliation_clinicId_idx" ON public."DoctorClinicAffiliation" USING btree ("clinicId");


--
-- Name: DoctorClinicAffiliation_doctorId_clinicId_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "DoctorClinicAffiliation_doctorId_clinicId_key" ON public."DoctorClinicAffiliation" USING btree ("doctorId", "clinicId");


--
-- Name: DoctorFeatureOverride_doctorId_flagKey_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "DoctorFeatureOverride_doctorId_flagKey_key" ON public."DoctorFeatureOverride" USING btree ("doctorId", "flagKey");


--
-- Name: DoctorFeatureOverride_expiresAt_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "DoctorFeatureOverride_expiresAt_idx" ON public."DoctorFeatureOverride" USING btree ("expiresAt");


--
-- Name: DoctorFeatureOverride_flagKey_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "DoctorFeatureOverride_flagKey_idx" ON public."DoctorFeatureOverride" USING btree ("flagKey");


--
-- Name: DoctorReportPreferences_doctorId_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "DoctorReportPreferences_doctorId_key" ON public."DoctorReportPreferences" USING btree ("doctorId");


--
-- Name: Doctor_cedula_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "Doctor_cedula_key" ON public."Doctor" USING btree (cedula);


--
-- Name: Doctor_email_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "Doctor_email_key" ON public."Doctor" USING btree (email);


--
-- Name: Doctor_stripeCustomerId_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "Doctor_stripeCustomerId_key" ON public."Doctor" USING btree ("stripeCustomerId");


--
-- Name: Doctor_stripeSubscriptionId_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "Doctor_stripeSubscriptionId_key" ON public."Doctor" USING btree ("stripeSubscriptionId");


--
-- Name: DocumentTemplate_tipo_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "DocumentTemplate_tipo_idx" ON public."DocumentTemplate" USING btree (tipo);


--
-- Name: DocumentTemplate_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "DocumentTemplate_workspaceId_idx" ON public."DocumentTemplate" USING btree ("workspaceId");


--
-- Name: Document_encounterId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Document_encounterId_idx" ON public."Document" USING btree ("encounterId");


--
-- Name: Document_patientRegistrationId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Document_patientRegistrationId_idx" ON public."Document" USING btree ("patientRegistrationId");


--
-- Name: Document_referidoADoctorId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Document_referidoADoctorId_idx" ON public."Document" USING btree ("referidoADoctorId");


--
-- Name: EmailOtp_email_purpose_expiresAt_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "EmailOtp_email_purpose_expiresAt_idx" ON public."EmailOtp" USING btree (email, purpose, "expiresAt");


--
-- Name: EmailOtp_expiresAt_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "EmailOtp_expiresAt_idx" ON public."EmailOtp" USING btree ("expiresAt");


--
-- Name: EncounterScale_encounterId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "EncounterScale_encounterId_idx" ON public."EncounterScale" USING btree ("encounterId");


--
-- Name: EncounterTemplate_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "EncounterTemplate_workspaceId_idx" ON public."EncounterTemplate" USING btree ("workspaceId");


--
-- Name: Encounter_doctorId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Encounter_doctorId_idx" ON public."Encounter" USING btree ("doctorId");


--
-- Name: Encounter_patientRegistrationId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Encounter_patientRegistrationId_idx" ON public."Encounter" USING btree ("patientRegistrationId");


--
-- Name: Encounter_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Encounter_workspaceId_idx" ON public."Encounter" USING btree ("workspaceId");


--
-- Name: ExpressOrder_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "ExpressOrder_workspaceId_idx" ON public."ExpressOrder" USING btree ("workspaceId");


--
-- Name: ImagingOrderItem_imagingOrderId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "ImagingOrderItem_imagingOrderId_idx" ON public."ImagingOrderItem" USING btree ("imagingOrderId");


--
-- Name: ImagingOrder_encounterId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "ImagingOrder_encounterId_idx" ON public."ImagingOrder" USING btree ("encounterId");


--
-- Name: InsuranceProvider_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "InsuranceProvider_workspaceId_idx" ON public."InsuranceProvider" USING btree ("workspaceId");


--
-- Name: InvoiceItem_invoiceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "InvoiceItem_invoiceId_idx" ON public."InvoiceItem" USING btree ("invoiceId");


--
-- Name: Invoice_encounterId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Invoice_encounterId_idx" ON public."Invoice" USING btree ("encounterId");


--
-- Name: Invoice_patientRegistrationId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Invoice_patientRegistrationId_idx" ON public."Invoice" USING btree ("patientRegistrationId");


--
-- Name: Invoice_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Invoice_workspaceId_idx" ON public."Invoice" USING btree ("workspaceId");


--
-- Name: Invoice_workspaceId_numero_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "Invoice_workspaceId_numero_key" ON public."Invoice" USING btree ("workspaceId", numero);


--
-- Name: LabOrder_encounterId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "LabOrder_encounterId_idx" ON public."LabOrder" USING btree ("encounterId");


--
-- Name: LabResult_encounterId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "LabResult_encounterId_idx" ON public."LabResult" USING btree ("encounterId");


--
-- Name: LabResult_patientRegistrationId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "LabResult_patientRegistrationId_idx" ON public."LabResult" USING btree ("patientRegistrationId");


--
-- Name: LegalVersion_slug_effectiveAt_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "LegalVersion_slug_effectiveAt_idx" ON public."LegalVersion" USING btree (slug, "effectiveAt");


--
-- Name: LegalVersion_slug_version_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "LegalVersion_slug_version_key" ON public."LegalVersion" USING btree (slug, version);


--
-- Name: Medication_categoria_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Medication_categoria_idx" ON public."Medication" USING btree (categoria);


--
-- Name: Medication_nombreGenerico_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Medication_nombreGenerico_idx" ON public."Medication" USING btree ("nombreGenerico");


--
-- Name: Medication_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Medication_workspaceId_idx" ON public."Medication" USING btree ("workspaceId");


--
-- Name: Mensaje_creadoAt_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Mensaje_creadoAt_idx" ON public."Mensaje" USING btree ("creadoAt");


--
-- Name: Mensaje_patientRegistrationId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Mensaje_patientRegistrationId_idx" ON public."Mensaje" USING btree ("patientRegistrationId");


--
-- Name: Mensaje_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Mensaje_workspaceId_idx" ON public."Mensaje" USING btree ("workspaceId");


--
-- Name: Notification_createdAt_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Notification_createdAt_idx" ON public."Notification" USING btree ("createdAt");


--
-- Name: Notification_workspaceId_leida_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Notification_workspaceId_leida_idx" ON public."Notification" USING btree ("workspaceId", leida);


--
-- Name: Pago_invoiceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Pago_invoiceId_idx" ON public."Pago" USING btree ("invoiceId");


--
-- Name: PatientConsent_encounterId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "PatientConsent_encounterId_idx" ON public."PatientConsent" USING btree ("encounterId");


--
-- Name: PatientConsent_patientRegistrationId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "PatientConsent_patientRegistrationId_idx" ON public."PatientConsent" USING btree ("patientRegistrationId");


--
-- Name: PatientConsent_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "PatientConsent_workspaceId_idx" ON public."PatientConsent" USING btree ("workspaceId");


--
-- Name: PatientInsurance_patientRegistrationId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "PatientInsurance_patientRegistrationId_idx" ON public."PatientInsurance" USING btree ("patientRegistrationId");


--
-- Name: PatientInsurance_providerId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "PatientInsurance_providerId_idx" ON public."PatientInsurance" USING btree ("providerId");


--
-- Name: PatientRegistration_patientId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "PatientRegistration_patientId_idx" ON public."PatientRegistration" USING btree ("patientId");


--
-- Name: PatientRegistration_workspaceId_idDisplay_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "PatientRegistration_workspaceId_idDisplay_key" ON public."PatientRegistration" USING btree ("workspaceId", "idDisplay");


--
-- Name: PatientRegistration_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "PatientRegistration_workspaceId_idx" ON public."PatientRegistration" USING btree ("workspaceId");


--
-- Name: PatientRegistration_workspaceId_patientId_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "PatientRegistration_workspaceId_patientId_key" ON public."PatientRegistration" USING btree ("workspaceId", "patientId");


--
-- Name: PatientTag_patientRegistrationId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "PatientTag_patientRegistrationId_idx" ON public."PatientTag" USING btree ("patientRegistrationId");


--
-- Name: PatientTag_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "PatientTag_workspaceId_idx" ON public."PatientTag" USING btree ("workspaceId");


--
-- Name: Patient_hmacApellido_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Patient_hmacApellido_idx" ON public."Patient" USING btree ("hmacApellido");


--
-- Name: Patient_hmacCedula_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Patient_hmacCedula_idx" ON public."Patient" USING btree ("hmacCedula");


--
-- Name: Patient_hmacEmail_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Patient_hmacEmail_idx" ON public."Patient" USING btree ("hmacEmail");


--
-- Name: Patient_hmacNombre_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Patient_hmacNombre_idx" ON public."Patient" USING btree ("hmacNombre");


--
-- Name: Patient_hmacTelefono_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Patient_hmacTelefono_idx" ON public."Patient" USING btree ("hmacTelefono");


--
-- Name: Patient_tipoIdentificacion_numeroIdentificacion_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "Patient_tipoIdentificacion_numeroIdentificacion_key" ON public."Patient" USING btree ("tipoIdentificacion", "numeroIdentificacion");


--
-- Name: Patient_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Patient_workspaceId_idx" ON public."Patient" USING btree ("workspaceId");


--
-- Name: Patient_workspaceId_tipoIdentificacion_numeroIdentificacion_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "Patient_workspaceId_tipoIdentificacion_numeroIdentificacion_key" ON public."Patient" USING btree ("workspaceId", "tipoIdentificacion", "numeroIdentificacion") WHERE ("numeroIdentificacion" IS NOT NULL);


--
-- Name: PrescriptionItem_medicationId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "PrescriptionItem_medicationId_idx" ON public."PrescriptionItem" USING btree ("medicationId");


--
-- Name: PrescriptionItem_prescriptionId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "PrescriptionItem_prescriptionId_idx" ON public."PrescriptionItem" USING btree ("prescriptionId");


--
-- Name: Prescription_encounterId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Prescription_encounterId_idx" ON public."Prescription" USING btree ("encounterId");


--
-- Name: StaffNote_creadoAt_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "StaffNote_creadoAt_idx" ON public."StaffNote" USING btree ("creadoAt");


--
-- Name: StaffNote_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "StaffNote_workspaceId_idx" ON public."StaffNote" USING btree ("workspaceId");


--
-- Name: Staff_cedula_workspaceId_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "Staff_cedula_workspaceId_key" ON public."Staff" USING btree (cedula, "workspaceId");


--
-- Name: Staff_email_workspaceId_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "Staff_email_workspaceId_key" ON public."Staff" USING btree (email, "workspaceId");


--
-- Name: Staff_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Staff_workspaceId_idx" ON public."Staff" USING btree ("workspaceId");


--
-- Name: Task_fechaVencimiento_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Task_fechaVencimiento_idx" ON public."Task" USING btree ("fechaVencimiento");


--
-- Name: Task_workspaceId_completada_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Task_workspaceId_completada_idx" ON public."Task" USING btree ("workspaceId", completada);


--
-- Name: TwoFactorBackupCode_doctorId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "TwoFactorBackupCode_doctorId_idx" ON public."TwoFactorBackupCode" USING btree ("doctorId");


--
-- Name: Vaccine_fechaAplicacion_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Vaccine_fechaAplicacion_idx" ON public."Vaccine" USING btree ("fechaAplicacion");


--
-- Name: Vaccine_patientRegistrationId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Vaccine_patientRegistrationId_idx" ON public."Vaccine" USING btree ("patientRegistrationId");


--
-- Name: Vaccine_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Vaccine_workspaceId_idx" ON public."Vaccine" USING btree ("workspaceId");


--
-- Name: WaitingEntry_appointmentId_key; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE UNIQUE INDEX "WaitingEntry_appointmentId_key" ON public."WaitingEntry" USING btree ("appointmentId");


--
-- Name: WaitingEntry_llegadaAt_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "WaitingEntry_llegadaAt_idx" ON public."WaitingEntry" USING btree ("llegadaAt");


--
-- Name: WaitingEntry_patientRegistrationId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "WaitingEntry_patientRegistrationId_idx" ON public."WaitingEntry" USING btree ("patientRegistrationId");


--
-- Name: WaitingEntry_workspaceId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "WaitingEntry_workspaceId_idx" ON public."WaitingEntry" USING btree ("workspaceId");


--
-- Name: Workspace_clinicId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Workspace_clinicId_idx" ON public."Workspace" USING btree ("clinicId");


--
-- Name: Workspace_doctorId_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Workspace_doctorId_idx" ON public."Workspace" USING btree ("doctorId");


--
-- Name: Workspace_estado_ciudad_idx; Type: INDEX; Schema: public; Owner: medsysve
--

CREATE INDEX "Workspace_estado_ciudad_idx" ON public."Workspace" USING btree (estado, ciudad);


--
-- Name: Alergia Alergia_patientRegistrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Alergia"
    ADD CONSTRAINT "Alergia_patientRegistrationId_fkey" FOREIGN KEY ("patientRegistrationId") REFERENCES public."PatientRegistration"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Alergia Alergia_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Alergia"
    ADD CONSTRAINT "Alergia_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Announcement Announcement_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Announcement"
    ADD CONSTRAINT "Announcement_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Appointment Appointment_patientRegistrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_patientRegistrationId_fkey" FOREIGN KEY ("patientRegistrationId") REFERENCES public."PatientRegistration"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Appointment Appointment_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditEvent AuditEvent_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."AuditEvent"
    ADD CONSTRAINT "AuditEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditLog AuditLog_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AvailabilityException AvailabilityException_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."AvailabilityException"
    ADD CONSTRAINT "AvailabilityException_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClinicAdmin ClinicAdmin_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."ClinicAdmin"
    ADD CONSTRAINT "ClinicAdmin_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public."Clinic"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClinicInvitationCode ClinicInvitationCode_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."ClinicInvitationCode"
    ADD CONSTRAINT "ClinicInvitationCode_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public."Clinic"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClinicInvitationCode ClinicInvitationCode_usedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."ClinicInvitationCode"
    ADD CONSTRAINT "ClinicInvitationCode_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ClinicPost ClinicPost_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."ClinicPost"
    ADD CONSTRAINT "ClinicPost_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public."Clinic"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ConsentAcceptance ConsentAcceptance_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."ConsentAcceptance"
    ADD CONSTRAINT "ConsentAcceptance_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ConsentAcceptance ConsentAcceptance_legalVersionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."ConsentAcceptance"
    ADD CONSTRAINT "ConsentAcceptance_legalVersionId_fkey" FOREIGN KEY ("legalVersionId") REFERENCES public."LegalVersion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ConsentTemplate ConsentTemplate_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."ConsentTemplate"
    ADD CONSTRAINT "ConsentTemplate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DataDeletionRequest DataDeletionRequest_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."DataDeletionRequest"
    ADD CONSTRAINT "DataDeletionRequest_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DataExportRequest DataExportRequest_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."DataExportRequest"
    ADD CONSTRAINT "DataExportRequest_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Diagnosis Diagnosis_encounterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Diagnosis"
    ADD CONSTRAINT "Diagnosis_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES public."Encounter"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DoctorAvailability DoctorAvailability_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."DoctorAvailability"
    ADD CONSTRAINT "DoctorAvailability_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DoctorClinicAffiliation DoctorClinicAffiliation_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."DoctorClinicAffiliation"
    ADD CONSTRAINT "DoctorClinicAffiliation_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public."Clinic"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DoctorClinicAffiliation DoctorClinicAffiliation_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."DoctorClinicAffiliation"
    ADD CONSTRAINT "DoctorClinicAffiliation_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DoctorFeatureOverride DoctorFeatureOverride_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."DoctorFeatureOverride"
    ADD CONSTRAINT "DoctorFeatureOverride_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DoctorFeatureOverride DoctorFeatureOverride_setByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."DoctorFeatureOverride"
    ADD CONSTRAINT "DoctorFeatureOverride_setByUserId_fkey" FOREIGN KEY ("setByUserId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE;


--
-- Name: DoctorReportPreferences DoctorReportPreferences_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."DoctorReportPreferences"
    ADD CONSTRAINT "DoctorReportPreferences_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DocumentTemplate DocumentTemplate_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."DocumentTemplate"
    ADD CONSTRAINT "DocumentTemplate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Document Document_encounterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES public."Encounter"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_patientRegistrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_patientRegistrationId_fkey" FOREIGN KEY ("patientRegistrationId") REFERENCES public."PatientRegistration"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Document Document_referidoADoctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_referidoADoctorId_fkey" FOREIGN KEY ("referidoADoctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EncounterScale EncounterScale_encounterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."EncounterScale"
    ADD CONSTRAINT "EncounterScale_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES public."Encounter"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EncounterTemplate EncounterTemplate_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."EncounterTemplate"
    ADD CONSTRAINT "EncounterTemplate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Encounter Encounter_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Encounter"
    ADD CONSTRAINT "Encounter_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public."Appointment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Encounter Encounter_patientRegistrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Encounter"
    ADD CONSTRAINT "Encounter_patientRegistrationId_fkey" FOREIGN KEY ("patientRegistrationId") REFERENCES public."PatientRegistration"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Encounter Encounter_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Encounter"
    ADD CONSTRAINT "Encounter_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ExpressOrder ExpressOrder_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."ExpressOrder"
    ADD CONSTRAINT "ExpressOrder_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ImagingOrderItem ImagingOrderItem_imagingOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."ImagingOrderItem"
    ADD CONSTRAINT "ImagingOrderItem_imagingOrderId_fkey" FOREIGN KEY ("imagingOrderId") REFERENCES public."ImagingOrder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ImagingOrder ImagingOrder_encounterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."ImagingOrder"
    ADD CONSTRAINT "ImagingOrder_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES public."Encounter"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InsuranceProvider InsuranceProvider_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."InsuranceProvider"
    ADD CONSTRAINT "InsuranceProvider_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InvoiceItem InvoiceItem_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Invoice Invoice_encounterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES public."Encounter"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Invoice Invoice_insuranceProviderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_insuranceProviderId_fkey" FOREIGN KEY ("insuranceProviderId") REFERENCES public."InsuranceProvider"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Invoice Invoice_patientRegistrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_patientRegistrationId_fkey" FOREIGN KEY ("patientRegistrationId") REFERENCES public."PatientRegistration"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Invoice Invoice_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LabOrder LabOrder_encounterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."LabOrder"
    ADD CONSTRAINT "LabOrder_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES public."Encounter"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LabResult LabResult_encounterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."LabResult"
    ADD CONSTRAINT "LabResult_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES public."Encounter"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LabResult LabResult_patientRegistrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."LabResult"
    ADD CONSTRAINT "LabResult_patientRegistrationId_fkey" FOREIGN KEY ("patientRegistrationId") REFERENCES public."PatientRegistration"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Mensaje Mensaje_patientRegistrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Mensaje"
    ADD CONSTRAINT "Mensaje_patientRegistrationId_fkey" FOREIGN KEY ("patientRegistrationId") REFERENCES public."PatientRegistration"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Mensaje Mensaje_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Mensaje"
    ADD CONSTRAINT "Mensaje_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Pago Pago_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Pago"
    ADD CONSTRAINT "Pago_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PatientConsent PatientConsent_encounterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."PatientConsent"
    ADD CONSTRAINT "PatientConsent_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES public."Encounter"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PatientConsent PatientConsent_patientRegistrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."PatientConsent"
    ADD CONSTRAINT "PatientConsent_patientRegistrationId_fkey" FOREIGN KEY ("patientRegistrationId") REFERENCES public."PatientRegistration"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PatientConsent PatientConsent_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."PatientConsent"
    ADD CONSTRAINT "PatientConsent_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public."ConsentTemplate"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PatientConsent PatientConsent_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."PatientConsent"
    ADD CONSTRAINT "PatientConsent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PatientInsurance PatientInsurance_patientRegistrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."PatientInsurance"
    ADD CONSTRAINT "PatientInsurance_patientRegistrationId_fkey" FOREIGN KEY ("patientRegistrationId") REFERENCES public."PatientRegistration"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PatientInsurance PatientInsurance_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."PatientInsurance"
    ADD CONSTRAINT "PatientInsurance_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public."InsuranceProvider"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PatientRegistration PatientRegistration_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."PatientRegistration"
    ADD CONSTRAINT "PatientRegistration_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PatientRegistration PatientRegistration_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."PatientRegistration"
    ADD CONSTRAINT "PatientRegistration_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PatientTag PatientTag_patientRegistrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."PatientTag"
    ADD CONSTRAINT "PatientTag_patientRegistrationId_fkey" FOREIGN KEY ("patientRegistrationId") REFERENCES public."PatientRegistration"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PatientTag PatientTag_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."PatientTag"
    ADD CONSTRAINT "PatientTag_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Patient Patient_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Patient"
    ADD CONSTRAINT "Patient_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PrescriptionItem PrescriptionItem_medicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."PrescriptionItem"
    ADD CONSTRAINT "PrescriptionItem_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES public."Medication"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PrescriptionItem PrescriptionItem_prescriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."PrescriptionItem"
    ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES public."Prescription"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Prescription Prescription_encounterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Prescription"
    ADD CONSTRAINT "Prescription_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES public."Encounter"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StaffNote StaffNote_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."StaffNote"
    ADD CONSTRAINT "StaffNote_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Staff Staff_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Task Task_asignadoAId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_patientRegistrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_patientRegistrationId_fkey" FOREIGN KEY ("patientRegistrationId") REFERENCES public."PatientRegistration"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TwoFactorBackupCode TwoFactorBackupCode_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."TwoFactorBackupCode"
    ADD CONSTRAINT "TwoFactorBackupCode_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Vaccine Vaccine_patientRegistrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Vaccine"
    ADD CONSTRAINT "Vaccine_patientRegistrationId_fkey" FOREIGN KEY ("patientRegistrationId") REFERENCES public."PatientRegistration"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Vaccine Vaccine_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Vaccine"
    ADD CONSTRAINT "Vaccine_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WaitingEntry WaitingEntry_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."WaitingEntry"
    ADD CONSTRAINT "WaitingEntry_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public."Appointment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WaitingEntry WaitingEntry_patientRegistrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."WaitingEntry"
    ADD CONSTRAINT "WaitingEntry_patientRegistrationId_fkey" FOREIGN KEY ("patientRegistrationId") REFERENCES public."PatientRegistration"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WaitingEntry WaitingEntry_workspaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."WaitingEntry"
    ADD CONSTRAINT "WaitingEntry_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES public."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Workspace Workspace_clinicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Workspace"
    ADD CONSTRAINT "Workspace_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES public."Clinic"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Workspace Workspace_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsysve
--

ALTER TABLE ONLY public."Workspace"
    ADD CONSTRAINT "Workspace_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict LHXD4rGW4ncIFdEtnXlt9mtLPr0xWsHIEUVA2c1GNtsGUnczfiSzgQmqEFAnjCe

