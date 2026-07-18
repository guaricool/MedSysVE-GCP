# MedSysVE-GCP: Memory Bank Index

Bienvenido al registro de memoria del proyecto **MedSysVE-GCP**, un SaaS multi-tenant de Historia Clínica Electrónica para médicos venezolanos.

Esta carpeta centraliza el contexto operativo, arquitectónico y de estado para optimizar la inteligencia del equipo y asegurar la continuidad de los agentes automatizados, estando en total sincronía con nuestro análisis dinámico del código a través de `[[graphify-out/GRAPH_REPORT.md]]`.

## Nodos Principales

### 1. Estado y Operación
- **`[[activeContext.md]]`**: El estado actual de la plataforma en Google Cloud, incidentes recientes resueltos (como el fix del conflicto en referidos) y próximos pasos. Es el punto de partida para cualquier sesión nueva.
- **`[[PROJECT_STATUS.md]]`**: Documento de fases históricas de desarrollo, diagrama del schema, arquitectura on-demand y variables de entorno críticas de Google Cloud.
- **`[[RUNBOOK.md]]`**: Procedimientos operativos estándar adaptados a GCP, recuperación de desastres (DR), rotación de llaves, despliegues serverless en Cloud Run y troubleshooting de Cloud SQL.

### 2. Diseño y Dominio Funcional
- **`[[SISTEMA.md]]`**: Descripción funcional y de negocio orientada a los roles y casos de uso del dominio clínico venezolano (médicos, secretarias, portal de pacientes).
- **`[[SECURITY_HARDENING_CHANGELOG.md]]`**: Registro de aplicación de normativas HIPAA/LOPDP, cifrado nativo de campos PHI con llaves AES-256-GCM y bitácora de auditoría estricta, ahora con inyección de llaves a nivel de Cloud Run.

### 3. Grafo de Código (Code Knowledge Graph)
- **`[[graphify-out/GRAPH_REPORT.md]]`**: El análisis completo extraído por AST sobre todos los componentes, routers y servicios de este repositorio. Este reporte detalla la red de comunidades y dependencias críticas del ecosistema React/Next.js y tRPC.
- **`[[graphify-out/graph.json]]`**: La base de datos persistente que nutre nuestras consultas rápidas de estructura.

## Estructura de la Arquitectura
Para un repaso veloz de las tecnologías clave:
- **Core Framework**: `[[Next.js 16]]` (App Router) + `[[React 19]]`
- **Comunicaciones**: `[[tRPC 11]]` + Routers (ej. `[[server/routers/document.ts]]`, `[[server/routers/patient.ts]]`)
- **Datos y Persistencia**: `[[PostgreSQL]]` en `[[Cloud SQL]]` + `[[Prisma 7]]` (Adaptado vía `lib/db.ts`)
- **Infraestructura Actual Única**: `[[Google Cloud Platform]]` (`[[CloudRun]]` + `[[CloudSQL]]`)
- **Almacenamiento (Uploads)**: `[[Google Cloud Storage]]`
- **Seguridad / Cifrado**: Criptografía nativa de campos PHI con llaves rotativas (`[[lib/patient-crypto.ts]]`, `[[lib/field-crypto.ts]]`) gestionadas desde el entorno de GCP.

---
> **Nota para los Agentes y Desarrolladores:**
> *Cualquier cambio sustancial en la arquitectura (ej. nueva integración de servicios de GCP) o en la resolución de bugs críticos debe reflejarse primero actualizando el `[[activeContext.md]]` y, de ser un rediseño de código, ejecutando `graphify . --code-only`.*
