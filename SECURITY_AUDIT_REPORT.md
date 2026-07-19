# SECURITY AUDIT REPORT: MedSysVE-GCP
**Fecha:** 2026-07-18
**Auditor:** Antigravity (Staff Security Engineer)
**Alcance:** Revisión en modo "solo lectura" de Infraestructura, Perímetro Next.js y Base de Datos (Defensas Anti-Scraping).

---

## FASE 1: REVISIÓN DE INFRAESTRUCTURA Y DESPLIEGUE (GCP)

### 1. ESTADO ACTUAL
- El proyecto utiliza un `Dockerfile` optimizado (multi-stage) basado en `node:22-alpine` y se ejecuta bajo un usuario sin privilegios (`nextjs`).
- El pipeline de GitHub Actions (`ci.yml`) incluye pasos robustos de seguridad como `npm audit signatures` y auditorías a nivel de base de datos (`audit-rls.cjs`).
- El despliegue se realiza en Google Cloud Run.

### 2. BRECHAS DE SEGURIDAD
- **Falta de Infraestructura como Código (IaC) para Seguridad:** No existen archivos de Terraform (`.tf`) ni configuraciones declarativas en el repositorio que fuercen restricciones de red a nivel de GCP.
- **Bypass del Balanceador de Carga:** Sin una configuración explícita que restrinja el Ingress en Cloud Run (ej. `ingress = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"`), el servicio podría estar expuesto directamente a través de la URL predeterminada de Cloud Run (`*.run.app`), lo que permitiría a un atacante bypassear completamente Google Cloud Armor (WAF).
- **Falta de IAP (Identity-Aware Proxy):** No hay rastros de IAP para proteger paneles de administración internos.

### 3. PLAN DE REMEDIACIÓN
- **Implementar Terraform:** Crear un directorio `terraform/` para gestionar Cloud Run.
- **Cerrar el Ingress:** Agregar la directiva `ingress = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"` al servicio de Cloud Run para obligar a que todo el tráfico pase por el Global HTTP(S) Load Balancer.
- **Activar Google Cloud Armor:** Configurar políticas de WAF en el Load Balancer para mitigar DDoS (L7), inyección SQL, XSS y aplicar rate-limiting geográfico.

---

## FASE 2: REVISIÓN DEL PERÍMETRO DE LA APLICACIÓN (NEXT.JS)

### 1. ESTADO ACTUAL
- El middleware (`proxy.ts`) actúa como una excelente barrera perimetral. Valida el token de sesión (JWT) y bloquea accesos no autorizados a rutas de dashboards (`/doctor`, `/portal`).
- Se implementa un **Rate Limiter de doble capa**. En `proxy.ts` se usa un Map en memoria (`globalIpBuckets`) que limita peticiones por IP (ej. 30/min para auth, 600/10min para tRPC).
- El directorio `/public` fue inspeccionado y solo contiene assets estáticos inofensivos (imágenes, logos, SVGs). No hay exposición de JSONs sensibles, plantillas ni documentos.

### 2. BRECHAS DE SEGURIDAD
- **Rate Limiter Diluido (Edge Memory):** El Map `globalIpBuckets` en `proxy.ts` vive en la memoria de la instancia Edge/Node local. Dado que Cloud Run escala horizontalmente (múltiples instancias), este límite se reinicia por instancia. Si el servicio escala a 10 instancias bajo ataque, el límite real de scraping se multiplica por 10. Un atacante distribuido podría arrasar con la API antes de ser bloqueado.

### 3. PLAN DE REMEDIACIÓN
- **Rate Limiting Distribuido:** Modificar `proxy.ts` para que utilice Upstash Redis (el cual ya está en uso para el caché de medicamentos `meds:autocomplete`) como almacenamiento centralizado para el Rate Limiter. Esto garantizará que los límites (ej. 600/10min) sean globales y estrictos en toda la flota de Cloud Run.

---

## FASE 3: TÁCTICAS ANTI-SCRAPING Y BASE DE DATOS

### 1. ESTADO ACTUAL
- **Identificadores Opacos:** Revisión de `prisma/schema.prisma` confirma que **TODOS** los modelos de negocio críticos (`Doctor`, `Patient`, `Encounter`, `Appointment`, etc.) utilizan `String @id @default(cuid())`. Esto es una excelente práctica anti-scraping, ya que previene por completo los ataques de Enumeración de ID (Insecure Direct Object References - IDOR basados en enteros incrementales).
- **Paginación en Backend:** La inspección de los routers tRPC (`patient.ts`, `encounter.ts`, etc.) demuestra el uso constante de la cláusula `take` de Prisma (ej. `take: 20`, `take: 50`). No se encontraron endpoints que retornen tablas completas sin límite.
- **Aislamiento Multitenant:** En `patient.ts`, el endpoint `lookupByCedula` audita cada intento de búsqueda cross-workspace y devuelve una selección estrictamente limitada de datos, bloqueando la fuga masiva de PHI (Personal Health Information).

### 2. BRECHAS DE SEGURIDAD
- **Límites de tRPC Generosos:** El límite de 600 peticiones cada 10 minutos para rutas `/api/trpc/` es suficiente para mitigar fuerza bruta, pero permite a un atacante autenticado realizar un "Slow Scraping". Si un bot consulta listados paginados lentamente a 50 peticiones por minuto, podría extraer datos sin activar la alarma.
- **Falta de Rate Limiting por Usuario:** Actualmente, los límites son solo por IP. Un atacante que rote IPs (Proxies/VPNs) con la misma cuenta comprometida (o una cuenta gratuita creada por él mismo) saltará el bloqueo.

### 3. PLAN DE REMEDIACIÓN
- **Rate Limiting por `userId`:** Implementar un middleware en tRPC (`server/trpc.ts`) que aplique un Rate Limiting basado en el `session.user.id`, independientemente de la IP.
- **Alerta de Anomalías de Paginación:** Añadir un evento en `lib/audit.ts` que se dispare si un usuario realiza más de X consultas de listado (ej. "siguiente página") en un corto período de tiempo, bloqueando la cuenta proactivamente y notificando al equipo de seguridad.
