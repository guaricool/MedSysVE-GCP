# Política de Privacidad — MedSysVE

> **AVISO IMPORTANTE — NO ES ASESORÍA LEGAL**
> Este documento es un borrador genérico redactado conforme a la
> Ley Orgánica de Protección de Datos Personales (LOPDP) de Venezuela
> (Gaceta Oficial Extraordinaria N° 6.691 del 25 de abril de 2022).
> Debe ser revisado y aprobado por un abogado especializado en
> protección de datos personales antes de su publicación definitiva.
> Versión del documento: 1.1.0 — vigente desde el 26 de junio de 2026.
>
> **Cambios en esta versión (1.1.0):** consolidación de la identidad
> del responsable. Se elimina la mención de domicilio y se unifica
> el canal único de contacto en `yoguitech@gmail.com`.

---

## 1. Identificación del responsable del tratamiento

- **Responsable:** Yoguitech.LLC
- **Correo de privacidad:** yoguitech@gmail.com
- **Delegado de Protección de Datos (DPO):** yoguitech@gmail.com

Yoguitech.LLC actúa como **encargado del tratamiento** de los datos
clínicos cargados por los profesionales de la salud (Usuarios-Doctores),
quienes a su vez actúan como **responsables del tratamiento** frente
a sus pacientes. Esto significa que Yoguitech.LLC trata los datos
clínicos exclusivamente por cuenta y conforme a las instrucciones
del Doctor.

## 2. Datos personales que recabamos

### 2.1. Datos de los profesionales de la salud (Doctores)

- Cédula de identidad (V o E) o pasaporte.
- Nombre, apellido, fecha de nacimiento.
- Datos de contacto (teléfono, correo electrónico).
- Especialidad médica principal y subespecialidades.
- Número de matrícula profesional.
- Foto de perfil (opcional).
- Datos de facturación (RIF, dirección fiscal).
- Credenciales de acceso (hash de contraseña, secretos TOTP).

### 2.2. Datos de los pacientes

Tratados por cuenta del Doctor responsable, conforme a la relación
clínica y al consentimiento del paciente:

- Datos de identificación personal.
- Datos de salud (historia clínica, diagnósticos, prescripciones,
  resultados de laboratorio, imágenes diagnósticas, antecedentes).
- Datos de contacto del paciente o de su representante legal.
- Datos del representante legal (en caso de menores de edad o
  personas bajo tutela).

### 2.3. Datos técnicos

- Dirección IP (truncada conforme a `lib/log-sanitizer.ts`).
- Identificadores de dispositivo y navegador.
- Logs de acceso y uso de la Plataforma.
- Cookies técnicas y de sesión.

## 3. Finalidades del tratamiento

Los datos personales son tratados para las siguientes finalidades:

### Finalidades principales (base legal: consentimiento y relación contractual)

- Gestionar la cuenta del Usuario en la Plataforma.
- Permitir al Doctor prestar servicios clínicos a sus pacientes.
- Almacenar y procesar historias clínicas electrónicas.
- Generar documentos clínicos (recetas, órdenes, informes).
- Facturar los servicios contratados.
- Comunicar al Doctor aspectos operativos, técnicos y de seguridad.

### Finalidades secundarias (base legal: interés legítimo)

- Detectar y prevenir incidentes de seguridad.
- Realizar auditorías internas y externas de cumplimiento.
- Cumplir con obligaciones legales de conservación de historias
  clínicas (mínimo cinco años conforme a la normativa venezolana).
- Elaborar estadísticas agregadas y anonimizadas.

Yoguitech.LLC NO utiliza los datos clínicos para fines de marketing,
publicidad o cesión a terceros con fines comerciales.

## 4. Base legal del tratamiento

El tratamiento de datos personales se fundamenta en:

- **Consentimiento expreso** del titular (LOPDP, artículos 25 y 26),
  otorgado al momento del registro.
- **Ejecución de la relación contractual** entre Yoguitech.LLC y
  el Usuario (LOPDP, artículo 27 numeral 1).
- **Cumplimiento de obligaciones legales** (LOPDP, artículo 27
  numeral 3), incluida la conservación de historias clínicas.
- **Interés legítimo** del responsable para fines de seguridad y
  prevención del fraude (LOPDP, artículo 27 numeral 6).

## 5. Transferencias internacionales

Los datos personales son almacenados en servidores ubicados fuera
de la República Bolivariana de Venezuela. El país y la jurisdicción
de alojamiento podrán variar por razones operativas y se informarán
al Usuario al momento de registrarse.

Yoguitech.LLC garantiza que cualquier transferencia internacional
cumple con los requisitos de los artículos 33 y 34 de la LOPDP,
incluyendo cláusulas contractuales tipo y garantías de adequacy
equivalentes.

El Usuario autoriza expresamente la transferencia internacional
de sus datos al aceptar esta Política.

## 6. Plazos de conservación

- **Datos de cuenta del Doctor:** durante la vigencia de la relación
  contractual y hasta cinco (5) años posteriores a su terminación.
- **Historias clínicas de pacientes:** conforme a la normativa
  venezolana, mínimo cinco (5) años desde la fecha de la última
  atención.
- **Datos de facturación:** diez (10) años conforme a las normas
  tributarias.
- **Logs de auditoría:** diez (10) años conforme a las buenas
  prácticas de auditoría clínica y LOPDP.

Cumplido el plazo, los datos son eliminados de forma irreversible
o anonimizados de manera que no permitan la reidentificación del
titular.

## 7. Medidas de seguridad

Yoguitech.LLC implementa las medidas técnicas y organizativas
previstas en el artículo 30 de la LOPDP, incluyendo:

- Cifrado en tránsito (TLS 1.3).
- Cifrado en reposo (AES-256-GCM para datos sensibles).
- Cifrado a nivel de campo para cédulas y datos clínicos
  (field-level encryption con AES-256-GCM + HMAC index).
- Control de acceso por roles y por tenant (workspaceId).
- Autenticación de dos factores (TOTP) obligatoria para
  profesionales.
- Auditoría completa de accesos a datos clínicos (`AuditEvent`).
- Rate limiting en endpoints críticos.
- Política de contraseñas robusta.
- Sanitización de logs para evitar filtración de PHI.

## 8. Derechos de los titulares

Conforme a los artículos 56 a 66 de la LOPDP, los titulares de los
datos (Doctores y pacientes) tienen los siguientes derechos:

| Derecho | Descripción |
|---|---|
| **Acceso** | Conocer qué datos personales tratamos sobre usted. |
| **Rectificación** | Solicitar la corrección de datos inexactos o incompletos. |
| **Actualización** | Solicitar la actualización de datos desactualizados. |
| **Cancelación** | Solicitar la eliminación de sus datos cuando proceda. |
| **Oposición** | Oponerse al tratamiento de sus datos por motivos fundados. |
| **Portabilidad** | Recibir una copia de sus datos en formato estructurado y de uso común (JSON). |
| **Revocación del consentimiento** | Retirar el consentimiento otorgado en cualquier momento. |

## 9. Cómo ejercer sus derechos

Para ejercer cualquiera de estos derechos, el titular puede:

- Enviar un correo a **yoguitech@gmail.com** indicando el
  derecho que desea ejercer y adjuntando copia de su documento de
  identidad.
- Responderemos a su solicitud en un plazo no mayor a quince (15)
  días hábiles conforme al artículo 62 de la LOPDP.

En caso de que la solicitud sea presentada por un paciente a través
del Doctor responsable, el Doctor deberá canalizar la solicitud a
través de la Plataforma. Yoguitech.LLC no atenderá directamente
solicitudes de pacientes sin la mediación del Doctor responsable,
salvo orden de autoridad competente.

## 10. Cookies y tecnologías similares

La Plataforma utiliza cookies técnicas necesarias para su
funcionamiento y cookies opcionales (analítica) que requieren su
consentimiento. Consulte nuestra **Política de Cookies** para más
detalle.

## 11. Modificaciones

Yoguitech.LLC podrá modificar esta Política de Privacidad para
reflejar cambios legales, técnicos u operativos. Las modificaciones
serán notificadas con al menos treinta (30) días de anticipación y
publicadas en https://medsysve.com/legal/privacidad.

Los Usuarios activos deberán aceptar la nueva versión al iniciar
sesión. La continuación en el uso de la Plataforma implica la
aceptación de la nueva versión.

## 12. Autoridad de control

El titular tiene derecho a presentar una denuncia ante la
Superintendencia de Protección de Datos Personales del Estado
Venezolano, conforme al artículo 80 de la LOPDP, si considera que
sus derechos no han sido debidamente atendidos.

- **Sitio web:** [A COMPLETAR UNA VEZ PUBLICADA LA NORMATIVA COMPLEMENTARIA]

---

*Yoguitech.LLC — MedSysVE — Versión 1.1.0 — Junio 2026*