# Active Context: MedSysVE-GCP

## Estado Actual del Proyecto (Migración a GCP)
El proyecto ha sido migrado exclusivamente a **Google Cloud Platform (GCP)**. La arquitectura de despliegue actual y única verdad absoluta es:
- **Aplicación Frontend/Backend:** Desplegada en **Google Cloud Run** como un servicio serverless y stateless.
- **Base de Datos Relacional:** Migrada a **Google Cloud SQL (PostgreSQL)**. 
- **Gestión de Archivos (Uploads/PDFs):** Se utiliza Google Cloud Storage (GCS) a través de volúmenes montados (`/data/uploads`) o integración directa.
*(Cualquier referencia histórica a VPS, Contabo, Coolify, Standalone Docker o Backblaze está 100% obsoleta y deprecada).*

### Resoluciones Críticas Recientes

1. **Resolución de Error 500 en Referidos (`[[server/routers/document.ts]]`):**
   - **Problema:** Al aceptar un referido, se generaba un error `P2002` (Unique Constraint Violation) en la tabla `Patient`. Esto ocurría cuando un doctor se refería a sí mismo o cuando un reintento posterior a una falla parcial no lograba encontrar al paciente "fantasma" previamente copiado porque el `hmacCedula` (índice seguro) podía ser nulo o no coincidir con la consulta.
   - **Solución:** Se implementó una lógica doble: 
     - *Retorno Temprano:* Si el `workspaceId` de origen y destino es el mismo (ej. pruebas internas), el documento se marca como aceptado sin duplicar data.
     - *Búsqueda Robusta:* Para reintentos de fallas, la búsqueda de pacientes existentes ahora revisa tanto por `hmacCedula` como por coincidencia exacta del `numeroIdentificacion` cifrado. Esto asegura que se capture correctamente el clon huérfano, llevando el documento al estado de **MERGE_PENDING** (resolución manual mediante interfaz) y previniendo la caída de la aplicación.

2. **Inyección de Llaves Criptográficas (PHI Encryption):**
   - **Contexto:** Durante la migración hacia Google Cloud Run, era vital preservar el cifrado transparente AES-256-GCM. 
   - **Estado:** Las variables críticas (`FIELD_ENCRYPTION_KEY`, `FIELD_HMAC_KEY`, `FIELD_SIGN_KEY`) han sido exitosamente trasladadas e inyectadas de manera segura en el entorno de Cloud Run para garantizar la continuidad del servicio y el cumplimiento de normativas de seguridad clínica.

3. **Mantenimiento de Integridad de Base de Datos (Tenant Isolation):**
   - La base de datos Cloud SQL mantiene estricto aislamiento por inquilino, asegurado mediante la restricción única: `Patient_workspaceId_tipoIdentificacion_numeroIdentificacion_key`. Un paciente pertenece exclusivamente a su workspace.

4. **Prueba de Flujo Automatizado (Simulación):**
   - Se ejecutó un test del sistema de inicialización y escritura creando el archivo temporal `[[dummy-test.md]]` en la raíz del proyecto. El objetivo de este archivo (`# Prueba`) fue confirmar la respuesta del agente ante instrucciones de alta prioridad y la adherencia estricta a la regla de actualización de memoria tras modificaciones en el código/archivos.

5. **Resolución Autónoma de Auditoría (Fases 1-4):**
   - Se implementó validación *fail-fast* rigurosa para `FIELD_ENCRYPTION_KEY`, `FIELD_HMAC_KEY` y `FIELD_SIGN_KEY`, protegiendo los cifrados AES y firmas HMAC.
   - El esquema de Prisma fue optimizado (se purgó un índice redundante en `Patient` y se añadió `@@index([workspaceId, fechaHora])` en `Appointment` para evitar queries N+1).
   - Se eliminó una cantidad significativa de deuda técnica, incluyendo componentes huérfanos, scripts basura en `scratch/` y dependencias inactivas, aligerando el empaquetado para Google Cloud Run.

## Siguientes Pasos (Next Steps)
- Continuar el monitoreo de errores y latencia en el nuevo ecosistema de Google Cloud Platform.
- Monitorear posibles conflictos de fusión remanentes (`MERGE_PENDING`) en el portal del doctor.
- Ejecutar el mantenimiento del Grafo de Conocimiento mediante `graphify` para asentar el nuevo estado sin VPS.

## Módulos Principales Impactados
- `[[server/routers/document.ts]]`: Lógica robusta de adopción de pacientes, prevención de P2002 y estado de `MERGE_PENDING`.
- `[[lib/patient-crypto.ts]]` y `[[lib/field-crypto.ts]]`: Validación de llaves inyectadas en GCP.
- `[[prisma/schema.prisma]]`: Aislamiento por `workspaceId`.
