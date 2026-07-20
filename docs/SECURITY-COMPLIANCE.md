# Política de Seguridad y Cumplimiento — MedSysVE

> **Versión:** 1.0 — 2026-06-22
> **Alcance:** Sistema MedSysVE (SaaS HCE multi-tenant para médicos venezolanos)
> **Responsable:** Carlos Pierluissi (DPD — Data Protection Officer)
> **Última revisión:** 2026-06-22

---

## 1. Marco normativo aplicable

### 🇻🇪 Venezuela — Ley Orgánica de Protección de Datos Personales (LOPDP)
Sancionada en 2022, vigente desde mayo 2023. Aplicable a todo tratamiento de datos personales en territorio venezolano.

- **Art. 4**: Definición de dato personal — incluye datos de salud.
- **Art. 11**: Categorías especiales de datos (datos de salud son **datos sensibles**).
- **Art. 19**: Medidas técnicas y organizativas apropiadas — esta política es el cumplimiento.
- **Art. 25**: Consentimiento explícito del titular.
- **Art. 32**: Derecho de acceso.
- **Art. 33**: Derecho de rectificación.
- **Art. 34**: Derecho de supresión (olvido) — implementado vía `patient.deleteCascade` en tRPC admin.
- **Art. 35**: Derecho a la portabilidad — implementado vía `GET /api/pdf/history/[id]`.
- **Art. 38**: Notificación de brechas en máximo 72 horas.

### 🇻🇪 Código de Deontología Médica Venezolano
- **Art. 47**: Secreto profesional — los datos clínicos del paciente NO deben divulgarse.
- **Art. 70**: Historias clínicas deben conservarse por mínimo 10 años post-última consulta.

### Estándares internacionales adoptados como referencia

| Estándar | Aplicación |
|---|---|
| **HIPAA Security Rule** | §164.308 (admin), §164.310 (physical), §164.312 (technical) |
| **NIST SP 800-63B** | Autenticación digital, password policy |
| **NIST CSF 2.0** | Marco de ciberseguridad general |
| **OWASP Top 10 (2021)** | Web application security baseline |
| **OWASP ASVS 4.0** | Application Security Verification Standard — nivel 2 objetivo |
| **ISO 27001:2022** | SGSI — controles A.5 a A.18 |
| **PCI DSS** | NO aplicable directamente (no almacenamos PAN); pero principios sí |

---

## 2. Medidas implementadas (Fase 0 — Quick wins de seguridad)

### 2.1 Headers de seguridad HTTP (`next.config.ts`)
- ✅ **HSTS** — `max-age=31536000; includeSubDomains; preload` (1 año)
- ✅ **CSP** — `default-src 'self'`, sin `unsafe-eval`, `frame-ancestors 'none'`
- ✅ **X-Frame-Options: DENY** — anti-clickjacking
- ✅ **X-Content-Type-Options: nosniff**
- ✅ **Referrer-Policy: strict-origin-when-cross-origin**
- ✅ **Permissions-Policy** — deshabilita APIs poderosas no usadas
- ✅ **Cross-Origin-Opener-Policy / Resource-Policy: same-origin/same-site**
- ✅ **X-Powered-By removido** — no leak de fingerprint

### 2.2 Autenticación (`lib/auth.ts`)
- ✅ **bcrypt cost factor 12** (2^12 = 4096 rounds, ~250ms por verify)
- ✅ **JWT con expiración 8h** (HIPAA-friendly)
- ✅ **HttpOnly + SameSite=Lax + Secure cookies**
- ✅ **Timing-safe comparison** — dummy hash compare cuando usuario no existe (evita user enumeration)
- ✅ **Mensajes de error genéricos** — "Demasiados intentos" sin revelar si email existe

### 2.3 Rate limiting (`lib/rate-limit.ts` + `proxy.ts`)
- ✅ **Por IP** — sliding window via Redis sorted set
- ✅ **Por email** — login attempts
- ✅ **Buckets específicos:**
  - `/api/auth/*` → 30 req/min por IP
  - `/api/admin/seed-medications` → 2 req/hora por IP
  - `/api/trpc/*` → 600 req/10min por IP
  - `/portal/login` → 10 req/min por IP
- ✅ **Fail open** en error de Redis (no bloqueamos por caída de cache)

### 2.4 Account lockout (`lib/account-lockout.ts`)
- ✅ **5 intentos fallidos** → bloqueo 15 minutos
- ✅ **Estado en Redis** — sobrevive deploys
- ✅ **Reset en login exitoso**
- ✅ **Admin unlock** via endpoint (próximamente en UI admin)

### 2.5 Password policy (`lib/password-policy.ts`)
- ✅ **Doctores/Staff:** mínimo 12 caracteres, mayúsc + minúsc + número + símbolo, blacklist de passwords comunes
- ✅ **Portal pacientes:** mínimo 10 caracteres, mismas reglas de clases
- ✅ **PINs staff:** 6-8 dígitos, sin monotónicos ni repetidos
- ✅ **No reutilización** — al cambiar, verifica que no sea igual al actual

### 2.6 Sanitización de logs (`lib/log-sanitizer.ts`)
- ✅ **Blocklist de campos sensibles** — `password`, `cedula`, `email`, `motivo`, `anamnesis`, `diagnostico`, etc.
- ✅ **Redaction automática** — `safeLog()` helper redacta antes de imprimir
- ✅ **Truncado a 200 chars** — previene log spam
- ✅ **Prefix de timestamp + level + event name** — formato parseable por Loki

### 2.7 HTTPS enforcement (`proxy.ts`)
- ✅ **Redirect 308 HTTP → HTTPS** en producción
- ✅ Lee `x-forwarded-proto` para detectar esquema original

### 2.8 Endpoint admin-setup endurecido
- ✅ **Token desde env var** (`ADMIN_SETUP_TOKEN`) — no más hardcoded en código
- ✅ **Comparación timing-safe** (`crypto.timingSafeEqual`)
- ✅ **bcrypt cost 12**
- ✅ **No leak de enumeración de usuarios** en respuesta
- ⏳ **DELETE FILE after first use**

---

## 3. Medidas pendientes (Fase 1 — próximas 2 semanas)

### 3.1 2FA / MFA con TOTP
- **Tecnología:** `otplib` (npm) — RFC 6238 TOTP estándar
- **Para quién:** obligatorio para DOCTOR, opcional para SECRETARY/ASSISTANT/NURSE
- **QR enrollment:** generar QR con `otpauth://totp/MedSysVE:doctor@example.com?secret=...`
- **Backup codes:** 10 códigos de un solo uso, hash bcrypt

### 3.2 Audit log comprehensivo
- **Quién accedió qué PHI, cuándo, desde dónde, por cuánto tiempo**
- Tabla `AuditEvent` con campos: `userId`, `patientId`, `action` (VIEW/EXPORT/PRINT/SIGN), `ip`, `userAgent`, `createdAt`
- **Retention:** 7 años (alineado con retención de HCE)
- **Exportación** en CSV firmado digitalmente

### 3.3 Field-level encryption (datos ultra-sensibles)
- **Cifrado AES-256-GCM** para:
  - `Patient.numeroIdentificacion` (cédula)
  - `Doctor.cedula`
  - `Patient.fechaNacimiento` (combinable con otros = identificable)
  - `Encounter.diagnostico`, `anamnesis`, `examenFisico`, `plan`
  - `Invoice.notas` con datos bancarios
- **Key management:** `FIELD_ENCRYPTION_KEY` en env, KMS en futuro (AWS KMS / GCP KMS)
- **Búsqueda:** HMAC index para queries "starts-with"

### 3.4 Backup automatizado cifrado
- **PostgreSQL:** `pg_dump` diario cifrado con AES-256, retenido 30 días
- **Ubicación:** `/data/backups/` en Cloud Run + replicación off-site (R2 / S3)
- **Restore drill:** mensual, validar RTO < 1h, RPO < 24h
- **Inmutabilidad:** bucket WORM-enabled

### 3.5 Dependency scanning automatizado
- **npm audit** en CI (falla build si hay `high`/`critical` sin fix)
- **Snyk** (opcional) para vulnerabilidades más profundas
- **Renovate Bot** para PRs automáticas de updates

### 3.6 Row-level security checks (multi-tenancy)
- Verificar en cada query tRPC que `workspaceId` del recurso == `session.workspaceId`
- Helper: `assertWorkspaceAccess(ctx, resource)` lanza 403 si no coincide
- Audit de routers existentes — buscar `findUnique` sin `workspaceId` en el where

---

## 4. Medidas pendientes (Fase 2 — mes 1)

### 4.1 Documentos legales públicos
- **Política de Privacidad** — explicar qué datos se recolectan, para qué, retención, derechos
- **Términos de Servicio** — disclaimers médicos, límites de responsabilidad
- **Aviso de Cookies** — solo cookies de sesión (no tracking)
- **Consentimiento Informado** — para teleconsulta y uso de IA en diagnóstico

### 4.2 Disaster Recovery Plan (DRP)
- **RTO:** 4 horas (tiempo máximo de inactividad aceptable)
- **RPO:** 1 hora (pérdida máxima de datos aceptable)
- **Runbook:** paso a paso para recuperación desde backup
- **Comunicación:** template de aviso a usuarios en caso de brecha

### 4.3 Monitoreo de seguridad (SIEM básico)
- **Alertas automáticas** para:
  - Más de N logins fallidos desde misma IP
  - Acceso a PHI desde país/IP no habitual
  - Múltiples descargas de PDFs de historia clínica
  - Cambio de password / email / 2FA
- **Integración:** webhook a Slack/Discord/Telegram del admin

### 4.4 Penetration testing
- **Interno:** revisar cada router tRPC con `workspaceId` missing
- **Externo:** contratar pentest anual (proveedores sugeridos: Rhino Security Labs, NetSPI, HackTheBox Pro Labs)

---

## 5. Controles específicos de datos financieros (Pagos)

### 5.1 Lo que NO hacemos
- ❌ **NO almacenamos PAN de tarjeta** — la integración con pasarela de pago está fuera del sistema actual (facturas se cobran offline o por transferencia)
- ❌ **NO almacenamos CVV** — nunca, en ningún formato
- ❌ **NO loggeamos datos bancarios** en logs de aplicación

### 5.2 Lo que SÍ hacemos
- ✅ **Facturas numeradas secuencialmente** (`F-000001`) — control fiscal SUDEBIN
- ✅ **PDF firmado** — incluyendo RIF, datos fiscales, hash del documento
- ✅ **Audit log de pagos** — quién creó, quién marcó como pagado, abonos, refunds
- ✅ **Separación clínica/financiera** — Invoice, Pago, InvoiceItem viven en tablas separadas de Encounter, Diagnosis
- ✅ **Separación de roles** — SECRETARY puede facturar, NURSE no; DOCTOR tiene acceso completo

### 5.3 Para integración futura con pasarela
Cuando se integre Stripe / Mercado Pago / Binance Pay:
- Usar **tokenización** — el PAN nunca toca nuestros servidores
- **PCI DSS SAQ A** — el nivel más bajo, asumible si no almacenamos nada
- **3D Secure obligatorio** para transacciones online
- **Webhook signature verification** con `crypto.timingSafeEqual`

---

## 6. Controles específicos de IA (Claude API)

### 6.1 Datos enviados a Anthropic
- **Lo que SÍ se envía:** motivo de consulta, síntomas, antecedentes (texto), diagnóstico tentativo del doctor
- **Lo que NO se envía:** nombre del paciente, cédula, email, teléfono, dirección
- **Verificación:** ver `lib/ai/generate-report.ts` y `app/api/ai/*` — `safeLog` confirma redacción

### 6.2 Configuración de Anthropic
- **API key** en env var, no en código
- **Modelo:** claude-haiku por defecto (costo), claude-sonnet para diagnósticos complejos
- **No usar "ZDR" (Zero Data Retention)** si el costo es prohibitivo — pero es la opción más segura
- **System prompt** no incluye datos del paciente

### 6.3 Output de IA
- **Marcado explícito** en UI: "Esto es una sugerencia de IA, no un diagnóstico médico"
- **Requiere firma del doctor** — el encounter no se puede marcar SIGNED si tiene sugerencias de IA sin revisar
- **Audit log** — registrar cuando se invoca la IA y qué sugerencia se aceptó/rechazó

---

## 7. Controles específicos de integraciones externas

### 7.1 WhatsApp (Meta Cloud API)
- ✅ **Solo información de scheduling** — fecha, hora, doctor. NUNCA diagnóstico ni tratamiento
- ✅ **Templates pre-aprobados** por Meta — `medsysve_cita_creada`, `medsysve_recordatorio_cita`
- ✅ **Verify token** desde env var
- ✅ **Webhook signature verification** — `X-Hub-Signature-256` con HMAC SHA-256

### 7.2 Email (nodemailer + Gmail SMTP)
> ⚠️ **Migrado de Resend a Gmail SMTP en 2026-06-25** (`e294b90`). Las prácticas de seguridad son equivalentes, con la salvedad de que ahora dependemos de la seguridad de la cuenta Google del workspace.
- ✅ **App Password** dedicado (no la password de la cuenta) — revocable individualmente
- ✅ **2FA activado** en la cuenta Gmail de envío (`yoguitech@gmail.com`)
- ✅ **TLS forzado** en SMTP (puerto 587 STARTTLS)
- ✅ **No incluir PHI en subject** — solo asunto genérico "Tiene una cita médica"
- ✅ **Audit log** en cada send vía `lib/email.ts` con `metadata.recipient`, `metadata.template`, `metadata.workspaceId`

### 7.3 BCV API (`ve.dolarapi.com`)
- ✅ **Timeout 8s** (`AbortSignal.timeout`)
- ✅ **Sin credenciales** — endpoint público
- ✅ **Cache opcional** con TTL de 1h (no implementado aún)

---

## 8. Roles y responsabilidades

| Rol | Responsabilidad |
|---|---|
| **Carlos Pierluissi** | DPD (Data Protection Officer), admin del sistema, decisión final sobre incidentes |
| **Cada doctor workspace** | Custodio de los datos de sus pacientes, responsable del secreto profesional |
| **Personal (SECRETARY/ASSISTANT/NURSE)** | Acceso a datos solo en función de su rol, firmado NDA |

---

## 9. Plan de respuesta a incidentes

### 9.1 Clasificación de incidentes
- **SEV-1 (Crítico):** brecha de datos confirmada — notificar en 72h a usuarios y autoridad (LOPDP Art. 38)
- **SEV-2 (Alto):** intento de intrusion exitoso pero contenido no accedido
- **SEV-3 (Medio):** anomalía detectada, requiere investigación
- **SEV-4 (Bajo):** falso positivo o intento bloqueado

### 9.2 Pasos de respuesta
1. **Detectar** — alerta automática o reporte de usuario
2. **Contener** — bloquear IP, revocar sesiones, aislar contenedor
3. **Erradicar** — parchear vulnerabilidad, rotar secretos
4. **Recuperar** — restaurar desde backup si hay daño
5. **Notificar** — usuarios afectados en <72h si SEV-1
6. **Post-mortem** — documento público (anonimizado) en 14 días

### 9.3 Contactos
- **CSIRT Venezuela:** reportar a la Superintendencia de Protección de Datos
- **Anthropic (si afecta IA):** support@anthropic.com
- **Gmail SMTP (cuenta `yoguitech@gmail.com`):** soporte Google Workspace + checklist interno de MedSysVE (revocar App Password + regenerar)
- **Meta WhatsApp:** vía Business Help Center

---

## 10. Auditoría y revisión

- **Revisión trimestral** de esta política
- **Pentest anual** contratado externamente
- **Rotación de secretos:**
  - `NEXTAUTH_SECRET`: cada 90 días
  - `FIELD_ENCRYPTION_KEY`: cada 180 días (con re-cifrado de datos)
  - `CRON_SECRET`: cada 180 días
  - API keys externas (Anthropic, Gmail App Password): cada 180 días o ante sospecha de compromiso
- **Logs de auditoría** retenidos 7 años

---

## Changelog

| Fecha | Versión | Cambios |
|---|---|---|
| 2026-06-22 | 1.0 | Creación inicial. Implementación Fase 0 (headers, rate limit, lockout, password policy, sanitización, HTTPS). |
