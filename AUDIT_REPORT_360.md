# Reporte de Auditoría 360° (MedSysVE-GCP)

## Resumen Ejecutivo
Se ha llevado a cabo una auditoría exhaustiva en modo *read-only* sobre la arquitectura, la base de datos y la interfaz de usuario de MedSysVE, validando su integridad, rendimiento y limpieza del código en el nuevo entorno GCP (Cloud Run + Cloud SQL).

---

## 1. Hallazgos Críticos
- **Dependencias No Listadas:** Existen dependencias crudas utilizadas en el código pero que no están correctamente declaradas en el `package.json` (ej. `@auth/core/jwt` en `lib/email-summary.ts`, `@react-pdf/types` en `sello-firma.tsx`). Esto puede ocasionar fallos aleatorios en los builds de Cloud Run.
- **Manejo de Variables de Entorno (Cloud Run):** La implementación requiere validación estricta de las variables `FIELD_ENCRYPTION_KEY`, `FIELD_HMAC_KEY` y `FIELD_SIGN_KEY`. Existen fallbacks a lectura de variables legacy que deberían limpiarse para forzar el fallo (fail-fast) si Cloud Run levanta sin los secretos inyectados.

## 2. Deuda Técnica (Código Muerto y Arquitectura)
El análisis estático (`knip`) detectó una cantidad considerable de código huérfano:
- **Scripts Basura:** Diversos archivos de prueba acumulados en la raíz y en `scratch/` (`scratch-audit.js`, `scratch-db.ts`, `scratch/test-prisma.ts`) que deberían ser ignorados en producción o eliminados.
- **Exportaciones sin Uso:** 
  - En backend: La función `verifyVerifiedToken` en `server/routers/auth.ts` no está siendo consumida por ningún procedure.
  - En utilidades: `adminUnlock` (`lib/account-lockout.ts`) y utilidades de fechas (`lib/tz.ts`) están declaradas pero nunca se usan.
- **Dependencias Innecesarias:** Paquetes instalados que ya no se usan en el código (`@radix-ui/react-avatar`, `@trpc/next`, `pg` (ya que se usa el adapter de prisma), `sharp`).

## 3. Mejoras de UI/UX
- **Componentes Fantasma:** Se detectaron componentes completos (`components/encounter/informe-form.tsx`, `components/encounter/plan-form.tsx`, `components/encounter/prescription-form.tsx`) que están en el repositorio pero no están enganchados a ninguna página activa. Esto indica que se inició una refactorización de los formularios de consulta que nunca se integró, o que los viejos se dejaron abandonados.
- **Bloat de UI:** Elementos de Shadcn/Radix UI instalados (`avatar.tsx`, `separator.tsx`, `form.tsx`) que no están siendo renderizados en el árbol actual de componentes de Next.js.
- **Navegación:** Algunos exports de `DropdownMenu` están declarados pero nunca montados, lo que sugiere que hay menús con opciones comentadas o enlaces muertos.

## 4. Optimizaciones de Base de Datos
Análisis del esquema (`prisma/schema.prisma`):
- **Índice Compuesto Faltante en `Appointment`:** La tabla de citas frecuentemente consulta sobre un rango de fechas para un consultorio específico. Se recomienda fuertemente agregar `@@index([workspaceId, fechaHora])` para evitar escaneos secuenciales y resolver consultas N+1 en vistas de calendario.
- **Índice Redundante en `Patient`:** La tabla de pacientes tiene una restricción única `@@unique([workspaceId, tipoIdentificacion, numeroIdentificacion])`, lo cual ya indexa implícitamente por `workspaceId`. El índice separado `@@index([workspaceId])` es redundante en PostgreSQL y consume espacio extra sin aportar beneficios significativos al planificador de consultas.
- **Cifrado de Campos (Rendimiento):** La existencia simultánea de campos en texto claro (ej. `historiaClinica`) y cifrados (`historiaClinicaCifrada`) demanda un pase de migración para purgar los textos claros, reduciendo a la mitad el peso de las filas en las tablas clínicas de mayor volumen (`Encounter` y `Patient`).
