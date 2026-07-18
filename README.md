# MedSysVE

> **Sistema SaaS Multi-Tenant de Historia Clínica Electrónica para Médicos Venezolanos.**

MedSysVE es una plataforma integral diseñada para optimizar y modernizar la gestión clínica en Venezuela, ofreciendo historias médicas electrónicas, facturación dual (USD/Bs con tasa del BCV), un portal para pacientes, un sistema de referidos interconectado, y asistencia con Inteligencia Artificial.

---

## 🚀 Características Principales

*   **Historia Clínica Electrónica (HCE):** Gestión completa de pacientes, antecedentes, alergias, vacunas y consultas usando el estándar SOAP (Subjetivo, Objetivo, Análisis, Plan).
*   **Multi-Tenancy con Aislamiento Estricto:** Cada clínica o médico (Workspace) tiene aislamiento total de datos. Los pacientes pertenecen a workspaces específicos, cumpliendo con estándares de privacidad y LOPDP.
*   **Generación de Documentos (PDF On-Demand):** Generación instantánea y sin escritura a disco de récipes médicos, indicaciones, órdenes de laboratorio, órdenes de imagen, reportes médicos y constancias. Soporta firmas y sellos digitales renderizados en el documento.
*   **Facturación Dual y Pagos:** Soporte integrado para pagos en USD y Bolívares (usando la tasa diaria del BCV). Suscripciones mensuales y trimestrales gestionadas mediante **Stripe**.
*   **Manejo de Clínicas (Multi-Asiento):** Soporte para consultorios individuales o clínicas con múltiples especialistas, utilizando códigos de invitación y cobro de "asientos extra" integrados con Stripe.
*   **Portal de Pacientes:** Acceso seguro para que los pacientes puedan revisar sus exámenes, indicaciones, historias médicas y gestionar sus citas.
*   **Sistema de Referidos:** Los especialistas pueden referir pacientes entre sí dentro de la plataforma transfiriendo el perfil clínico básico del paciente de forma segura si el paciente y el médico receptor aceptan el referido.
*   **Asistencia Médica con IA:** Integración con **Anthropic Claude** para brindar asistencia en diagnósticos diferenciales, planes de tratamiento y OCR avanzado para resultados de laboratorio físico.
*   **Comunicaciones Automáticas:** Notificaciones automatizadas vía **WhatsApp (Meta Cloud API)** y **Email (Nodemailer/SMTP)** para recordar citas, envíos de recetas médicas y creación de usuarios.

---

## 🛠 Tech Stack

**Frontend & Framework:**
*   **Next.js 16** (App Router, Output: Standalone)
*   **React 19**
*   **Tailwind CSS v4** + **shadcn/ui** (Tema oscuro, diseño optimizado)
*   **@react-pdf/renderer** (Generación de PDFs del lado del servidor)

**Backend & API:**
*   **tRPC 11** (Llamadas type-safe)
*   **Auth.js v5** (Manejo de sesiones, JWT cookies, Roles: `DOCTOR`, `SECRETARY`, `ASSISTANT`, `NURSE`, `PATIENT`)
*   **Redis (ioredis)** (Caché rápido, ej. autocompletado de medicamentos)

**Base de Datos & ORM:**
*   **PostgreSQL** (Base de datos principal relacional)
*   **Prisma 7** + `@prisma/adapter-pg`
*   **Encriptación Criptográfica:** Campos de PHI (Protected Health Information) se almacenan encriptados usando `AES-256-GCM` y los índices de búsqueda usan `HMAC-SHA-256` para preservar la privacidad mientras permite búsquedas funcionales.

---

## 📦 Infraestructura y Despliegue

MedSysVE está diseñado para ser desplegado mediante contenedores optimizados.

*   **Orquestador:** [Cloud Run](https://Cloud Run.io/)
*   **Containerización:** Docker standalone
*   **Host:** GCP (Ubuntu)
*   **Estrategia de Build:** El contenedor construye un build optimizado de Next.js (`output: standalone`) que reduce drásticamente el peso de la imagen y mejora los tiempos de inicialización. Todos los archivos generados en tiempo de ejecución (como caché temporal o assets de sesión efímera) son tratados en volúmenes o borrados con cada inicio de instancia, garantizando una arquitectura *stateless*.

---

## 🔒 Privacidad y Seguridad (PHI & HIPAA/LOPDP)

1.  **Segregación de Workspaces:** Cada paciente está estrictamente ligado al `workspaceId` del médico tratante.
2.  **Cifrado a nivel de fila:** La información médica sensible no se guarda en texto plano en la base de datos (se usa criptografía simétrica avanzada).
3.  **Logs de Auditoría:** Todas las acciones de lectura, escritura o modificación de PHI quedan registradas con la acción, el actor, y un timestamp auditable (`AuditLog` y `AuditEvent`).
4.  **Aceptación Legal de Términos:** Obligatoriedad de revisión de Términos de Servicio y Consentimiento LOPDP antes del acceso al sistema por parte de médicos y pacientes (Bloqueos activos en middleware / HOCs de los Layouts).

---

## 🧑‍💻 Comandos Locales Útiles

```bash
# Iniciar servidor de desarrollo
npm run dev

# Chequeo estricto de Tipos (TypeScript)
npx tsc --noEmit

# Construcción de la aplicación para producción
npx next build

# Generar y/o desplegar las migraciones de Prisma
npx prisma generate
npx prisma migrate dev
```

---

*Desarrollado y mantenido por el equipo de ingeniería de MedSysVE / Yoguitech.LLC.*
