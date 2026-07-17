# Manual de Usuario — MedSysVE

**Sistema de Gestión Médica Electrónica para Venezuela**  
Versión 1.0 · 2026

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Registro e Inicio de Sesión](#2-registro-e-inicio-de-sesión)
3. [Dashboard Principal](#3-dashboard-principal)
4. [Gestión de Pacientes](#4-gestión-de-pacientes)
5. [Consultas Médicas — Formato SOAP](#5-consultas-médicas--formato-soap)
6. [Prescripciones y Medicamentos](#6-prescripciones-y-medicamentos)
7. [Sala de Espera](#7-sala-de-espera)
8. [Citas y Agenda](#8-citas-y-agenda)
9. [Teleconsulta](#9-teleconsulta)
10. [Facturación](#10-facturación)
11. [Estadísticas](#11-estadísticas)
12. [Indicadores de Calidad](#12-indicadores-de-calidad)
13. [Panel de Crónicos](#13-panel-de-crónicos)
14. [Horario](#14-horario)
15. [Seguros Médicos](#15-seguros-médicos)
16. [Consentimientos Informados](#16-consentimientos-informados)
17. [Auditoría Clínica](#17-auditoría-clínica)
18. [Importación de Pacientes](#18-importación-de-pacientes)
19. [Módulo Pediátrico](#19-módulo-pediátrico)
20. [Tareas del Equipo](#20-tareas-del-equipo)
21. [Mensajes Internos](#21-mensajes-internos)
22. [Mi Equipo](#22-mi-equipo)
23. [Configuración del Consultorio](#23-configuración-del-consultorio)
24. [Portal del Paciente](#24-portal-del-paciente)
25. [Búsqueda Global](#25-búsqueda-global)
26. [Referidos Médicos](#26-referidos-médicos)
27. [Tipos de Identificación](#27-tipos-de-identificación)
28. [Glosario de Términos](#28-glosario-de-términos)
29. [Preguntas Frecuentes](#29-preguntas-frecuentes)

---

## 1. Introducción

### ¿Qué es MedSysVE?

MedSysVE es un sistema de gestión médica electrónica (EMR) diseñado específicamente para el mercado venezolano. Permite a médicos, secretarias y personal de salud gestionar de forma digital todos los aspectos de su consultorio: pacientes, consultas clínicas, recetas, laboratorios, facturación, citas y mucho más.

El sistema opera en la nube y es accesible desde cualquier navegador moderno (Chrome, Firefox, Edge, Safari). No requiere instalación de software.

### Roles de Usuario

MedSysVE tiene cinco roles con distintos niveles de acceso:

| Rol | Descripción | Acceso principal |
|-----|-------------|-----------------|
| **DOCTOR** | Médico propietario del consultorio | Acceso completo a todas las funciones |
| **SECRETARY** | Secretaria del consultorio | Pacientes, citas, sala de espera, facturación |
| **ASSISTANT** | Asistente médico | Sala de espera, pacientes |
| **NURSE** | Enfermera | Sala de espera, pacientes, citas |
| **PATIENT** | Paciente registrado | Portal del paciente únicamente |

### Navegación General

**Barra lateral (Sidebar):** En el lado izquierdo de la pantalla encontrará el menú principal con acceso a todos los módulos del sistema. El ítem activo aparece resaltado en azul.

**Búsqueda Global (⌘K / Ctrl+K):** Presione `Ctrl+K` (Windows/Linux) o `⌘K` (Mac) en cualquier momento para abrir la paleta de búsqueda rápida. Desde allí puede buscar pacientes, citas y navegar a cualquier sección.

**Notificaciones (campana 🔔):** En la esquina superior del sidebar encontrará el ícono de campana que muestra las notificaciones del sistema (solicitudes de citas, mensajes del portal, referidos, etc.).

**Cerrar Sesión:** Al final del sidebar, haga clic en "Cerrar sesión" para salir de forma segura.

---

## 2. Registro e Inicio de Sesión

### Cómo Registrarse como Doctor

1. Acceda a la URL del sistema y haga clic en el enlace **"Regístrate"** en la pantalla de login.
2. Complete el formulario de registro:

**Datos personales:**
- **Nombre:** Su nombre (sin apellido)
- **Apellido:** Su apellido completo
- **Cédula:** Su número de cédula de identidad (solo números, sin la V)
- **Email:** Dirección de correo electrónico. Será su usuario de acceso
- **Contraseña:** Mínimo 8 caracteres. Combina letras y números
- **Teléfono (opcional):** Teléfono personal de contacto
- **Especialidad Principal:** Seleccione su especialidad del menú desplegable (40 opciones disponibles)

**Datos del consultorio:**
- **Nombre del Consultorio:** Nombre con el que se identificará su práctica (ej: "Consultorio Dr. García")
- **Dirección (opcional):** Dirección física del consultorio
- **Teléfono del Consultorio (opcional):** Número de contacto del consultorio

3. Haga clic en **"Crear cuenta"**.
4. Si el registro es exitoso, será redirigido automáticamente al dashboard del doctor.

> **Nota:** Cada doctor crea su propio espacio de trabajo (workspace) aislado. Los datos de un consultorio nunca son visibles para otro.

### Cómo Iniciar Sesión

1. En la pantalla de inicio, ingrese su **Email** y **Contraseña/PIN**.
2. Haga clic en **"Entrar"**.
3. El sistema lo redirigirá según su rol:
   - DOCTOR → `/doctor`
   - SECRETARY → `/secretary`
   - ASSISTANT → `/assistant`
   - NURSE → `/nurse`

**Para staff (secretaria, asistente, enfermera):** Use el email y el PIN de acceso asignado por el doctor al crear su cuenta.

### Recuperación de Contraseña

> La recuperación automática de contraseña por email está en desarrollo. Si olvidó su contraseña, contacte al administrador del sistema.

---

## 3. Dashboard Principal

**Ruta:** `/doctor`

El dashboard es la pantalla de bienvenida del doctor. Muestra un resumen ejecutivo del estado del consultorio.

### Estadísticas Rápidas

Tres tarjetas en la parte superior muestran:

- **Pacientes registrados:** Total de pacientes activos en el sistema
- **Staff activo:** Número de miembros del equipo con acceso al sistema
- **Citas hoy:** Cantidad de citas programadas para el día actual

### Pizarrón del Equipo

Sección de notas compartidas para el equipo del consultorio:

- **Agregar nota:** Escriba en el campo de texto y haga clic en **"Agregar"**. El botón se activa una vez que hay texto escrito.
- Las notas aparecen listadas con fecha y autor.
- Son visibles para todos los miembros del equipo.
- Útil para recordatorios, instrucciones del día, avisos importantes.

---

## 4. Gestión de Pacientes

**Ruta:** `/doctor/patients`

### Lista de Pacientes

Muestra todos los pacientes registrados en el consultorio.

**Búsqueda:** Use el campo "Buscar por nombre, cédula o ID..." para encontrar pacientes rápidamente. La búsqueda es en tiempo real.

**Filtros disponibles:**
- **Sexo:** Todos / Masculino / Femenino / Otro
- **Etiqueta:** Escriba una etiqueta (ej: "HTA", "DM2") y haga clic en "Filtrar"

**Contador:** Muestra el total de pacientes encontrados (ej: "15 pacientes").

**Exportar CSV:** Descarga un archivo Excel-compatible con todos los datos de los pacientes registrados.

**Cada paciente en la lista muestra:**
- ID del consultorio (ej: #000001)
- Nombre y apellido
- Tipo y número de cédula (ej: V 8765432)

Haga clic en cualquier paciente para acceder a su perfil completo.

### Crear Nuevo Paciente

**Ruta:** `/doctor/patients/new`

Haga clic en el botón **"+ Nuevo paciente"** para registrar un nuevo paciente.

**Campos del formulario:**

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Sin cédula | No | Marque si el paciente es menor de edad sin cédula. Oculta el campo de cédula |
| Tipo de cédula | Sí | V- (venezolana), E- (extranjera), Pasaporte |
| Número de cédula | Sí* | Solo números. *Opcional si "Sin cédula" está marcado |
| Nombre | Sí | Nombre(s) del paciente |
| Apellido | Sí | Apellido(s) del paciente |
| Fecha de Nacimiento | Sí | Formato: AAAA-MM-DD |
| Sexo | Sí | Masculino / Femenino / Otro |
| Teléfono | No | Número de contacto |
| Email | No | Correo electrónico (requerido para acceso al portal) |

Haga clic en **"Registrar paciente"** para guardar. El sistema asignará automáticamente un ID único correlativo.

### Perfil del Paciente

Al hacer clic en un paciente, accede a su perfil completo que incluye:

**Encabezado:** Nombre, edad calculada automáticamente, ID del consultorio.

**Información demográfica:** Sexo, teléfono, email, número de cédula.

**Etiquetas:** Palabras clave médicas para categorizar al paciente (ej: HTA, DM2, Asmático). Haga clic en el campo para agregar etiquetas.

**Alergias:** Registro de alergias conocidas (medicamentos, alimentos, ambientales).

**Antecedentes:** Formulario estructurado con antecedentes personales, familiares, quirúrgicos, gineco-obstétricos, etc. Haga clic en **"Guardar antecedentes"** después de editar.

**Vacunas:** Registro del esquema de vacunación del paciente.

**Seguros Médicos:** Pólizas de seguro vinculadas al paciente (ver sección 15).

**Consentimientos Informados:** Consentimientos firmados y pendientes (ver sección 16).

**Acceso al Portal:** Active el portal del paciente ingresando una contraseña. El paciente usará su email + esta contraseña para acceder a `/portal/login`.

**Notas Internas:** Notas privadas del equipo médico, no visibles para el paciente.

**Exportar Historial PDF:** Genera un PDF completo con todas las consultas, diagnósticos y medicamentos del paciente.

**Resultados de Laboratorio:** Lista de resultados registrados.

**+ Nueva consulta:** Crea un nuevo encuentro clínico (ver sección 5).

**Historial de Citas:** Todas las citas pasadas y futuras del paciente.

**Historial de Consultas:** Lista de todas las consultas realizadas.

---

## 5. Consultas Médicas — Formato SOAP

**Ruta:** `/doctor/patients/[id]/encounters/[id]`

### Crear Nueva Consulta

Desde el perfil del paciente, haga clic en **"+ Nueva consulta"**. El sistema crea automáticamente un nuevo encuentro en estado "Borrador" y lo redirige a la pantalla de la consulta.

La consulta sigue el formato clínico internacional **SOAP**: Subjetivo, Objetivo, Assessment (Diagnóstico), Plan.

---

### S — Subjetivo

**Motivo de consulta:** Campo de texto libre. Describa brevemente el motivo de la visita del paciente (ej: "Dolor de cabeza persistente de 3 días").

**Anamnesis:** Campo de texto amplio para la historia clínica detallada, antecedentes del episodio actual, síntomas asociados.

> Ambos campos se guardan automáticamente. Verá el mensaje "Guardado automáticamente" debajo de cada campo.

---

### O — Signos Vitales

Registre las mediciones objetivas del paciente:

| Campo | Unidad | Descripción |
|-------|--------|-------------|
| TA Sistólica | mmHg | Presión arterial sistólica (el número superior) |
| TA Diastólica | mmHg | Presión arterial diastólica (el número inferior) |
| FC | lpm | Frecuencia cardíaca (latidos por minuto) |
| FR | rpm | Frecuencia respiratoria (respiraciones por minuto) |
| Temperatura | °C | Temperatura corporal en grados Celsius |
| Peso | kg | Peso corporal en kilogramos |
| Talla | cm | Estatura en centímetros |
| SpO2 | % | Saturación de oxígeno en sangre |
| Glasgow | pts | Escala de coma de Glasgow (3-15 puntos) |

Haga clic en **"Guardar signos vitales"** para registrarlos.

---

### A — Diagnósticos (CIE-10)

**Buscar diagnóstico:** Escriba el código CIE-10 (ej: "J00") o la descripción (ej: "resfriado") en el campo de búsqueda. Los diagnósticos aparecen en un menú desplegable.

Haga clic en un diagnóstico para agregarlo. Puede agregar múltiples diagnósticos por consulta.

Los diagnósticos seleccionados aparecen en una lista debajo del buscador. Para eliminar uno, haga clic en la "X" junto a él.

---

### P — Plan de Tratamiento

Campo de texto amplio para el plan terapéutico: indicaciones al paciente, medicamentos, cambios de estilo de vida, próximos pasos, citas de seguimiento.

> Se guarda automáticamente.

---

### IA Asistente Clínico

Haga clic en **"✦ IA Asistente Clínico ▼ abrir"** para expandir el panel de inteligencia artificial.

El asistente analiza el motivo de consulta y los datos ingresados para:
- Sugerir posibles diagnósticos diferenciales
- Recomendar estudios complementarios
- Proponer líneas de tratamiento

> **Nota:** Las sugerencias de la IA son orientativas y no reemplazan el juicio clínico del médico. Siempre verifique y adapte las sugerencias a su paciente.

---

### Receta Médica

**Buscar medicamento:** Escriba el nombre genérico o comercial del medicamento en el campo de búsqueda. El sistema tiene una base de datos de medicamentos disponibles en Venezuela.

**Al seleccionar un medicamento, complete:**
- **Dosis:** Cantidad y concentración (ej: "500 mg")
- **Frecuencia:** Cada cuánto tiempo (ej: "cada 8 horas")
- **Duración:** Por cuántos días
- **Indicaciones especiales:** Tomar con comida, en ayunas, etc.

**Prescripciones anteriores:** Haga clic en **"▼ Prescripciones anteriores del paciente"** para ver y reutilizar recetas pasadas.

La receta se genera automáticamente en formato PDF al firmar la consulta.

---

### Órdenes de Laboratorio

**Agregar estudio:** Escriba el nombre del estudio (ej: "Hematología completa", "Glucosa en ayunas") y haga clic en el botón "+".

**Indicaciones clínicas:** Escriba la sospecha diagnóstica e indicaciones para el laboratorio.

**Marcar como urgente:** Active esta casilla si el resultado se necesita con prioridad.

Haga clic en **"Crear orden de laboratorio"** (se activa cuando hay al menos un estudio agregado).

---

### Resultados de Laboratorio (OCR)

Esta función usa inteligencia artificial para extraer valores numéricos de una imagen del resultado de laboratorio.

1. Haga clic en el área "Haga clic o arrastre la imagen aquí"
2. Seleccione una fotografía o escaneo del resultado
3. El sistema extraerá automáticamente los valores

---

### Órdenes de Imagenología

**Tipo de imagen:** Seleccione del menú desplegable:
- Radiografía
- Ecografía
- TAC (Tomografía Axial Computarizada)
- RMN (Resonancia Magnética Nuclear)
- Mamografía
- Densitometría
- Otro

**Región anatómica:** Indique la zona a estudiar (ej: "Tórax", "Abdomen", "Rodilla derecha").

**Indicaciones clínicas:** Hipótesis diagnóstica e instrucciones para el radiólogo.

**Marcar como urgente:** Para estudios de prioridad.

Haga clic en **"Crear orden de imagen"** (se activa cuando hay tipo y región seleccionados).

---

### Informe Médico

**Generar borrador con IA:** El sistema genera automáticamente un informe médico basado en los datos ingresados en la consulta.

**Plantillas:** Seleccione una plantilla predefinida de informe como punto de partida.

El texto generado es editable. Modifíquelo antes de firmar la consulta.

---

### Reposo Médico

Complete los campos para generar un certificado de reposo en PDF:

| Campo | Descripción |
|-------|-------------|
| Días de reposo | Número de días (mínimo 1) |
| Fecha de inicio | Fecha a partir de la cual aplica el reposo |
| Diagnóstico | Diagnóstico que justifica el reposo (ej: "Faringitis aguda J02") |
| Observaciones | Indicaciones adicionales |

Haga clic en **"Generar Reposo PDF"** para descargar el certificado.

---

### Referido Médico

Para referir al paciente a otro especialista dentro del sistema:

1. Busque el médico por nombre, apellido o especialidad
2. Escriba el motivo del referido
3. Haga clic en **"Crear referido"** (se activa cuando hay médico y motivo)

---

### Firmar y Cerrar Consulta

Cuando haya completado todos los campos necesarios, haga clic en **"Firmar y cerrar consulta"**.

- El estado cambia de "Borrador" a **"Firmada"**
- La consulta queda bloqueada para edición
- Se registra en el sistema de auditoría (fecha, hora, doctor firmante)
- Aparece el botón **"Descargar resumen"** para obtener el PDF de la consulta

> **Importante:** Una consulta firmada no puede modificarse. Asegúrese de revisar toda la información antes de firmar.

---

## 6. Prescripciones y Medicamentos

Las recetas médicas se crean dentro de la consulta (ver sección 5, subsección Receta Médica).

### Base de Datos de Medicamentos

El sistema incluye una base de datos de medicamentos con nombres genéricos y comerciales disponibles en Venezuela. La búsqueda es por nombre genérico o comercial.

### Generación de Receta PDF

Al firmar la consulta, las prescripciones se incluyen automáticamente en el resumen. El PDF incluye:
- Membrete del consultorio (con logo si fue configurado)
- Datos del paciente
- Fecha
- Lista de medicamentos con dosis, frecuencia y duración
- Firma del médico

### Ver Prescripciones Anteriores

En el campo de receta de cualquier consulta, el botón **"▼ Prescripciones anteriores del paciente"** muestra el historial de medicamentos recetados, facilitando la continuidad terapéutica.

---

## 7. Sala de Espera

**Ruta:** `/doctor/waiting-room`

### Vista General

La sala de espera muestra en tiempo real todos los pacientes que están aguardando ser atendidos, ordenados por turno.

**Para cada paciente en espera se muestra:**
- Número de turno
- Nombre del paciente
- Hora de llegada
- Cita vinculada (si aplica)
- Estado actual
- Notas

### Estados de la Sala de Espera

```
En espera → Atendiendo → Completado
```

- **En espera:** El paciente llegó y está esperando
- **Atendiendo:** El médico está atendiendo al paciente actualmente
- **Completado:** La atención finalizó

### Agregar Paciente a la Sala

1. Haga clic en el botón para agregar paciente
2. Busque al paciente por nombre o cédula
3. Opcionalmente vincule a una cita existente del día
4. Agregue notas si es necesario
5. Confirme

### Llamar Siguiente Paciente

El botón **"Llamar"** (o **"Atender"**) cambia el estado del paciente a "Atendiendo" y registra la hora de inicio de atención.

---

## 8. Citas y Agenda

**Ruta:** `/doctor/appointments`

### Vistas del Calendario

**Vista semanal:** Grilla de 7 días × 13 horas (7am–7pm). Cada cita aparece como un bloque de color según su estado.

**Vista agenda:** Lista de las próximas citas en formato cronológico, mostrando las citas de los próximos 30 días.

Alterne entre vistas con los botones en la esquina superior.

### Colores por Estado

| Color | Estado |
|-------|--------|
| Naranja | Solicitada |
| Azul | Agendada |
| Verde | Confirmada |
| Tachado gris | Cancelada |
| Rojo | No asistió |
| Verde esmeralda | Completada |

### Crear Nueva Cita

Haga clic en **"+ Nueva cita"** (o en un espacio vacío del calendario).

**Campos del formulario:**

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Paciente | Sí | Busque por nombre o cédula |
| Fecha y hora | Sí | Seleccione fecha y hora de inicio |
| Duración | Sí | En minutos (ej: 30, 45, 60) |
| Tipo | Sí | Consulta / Seguimiento / Emergencia / Procedimiento / Videoconsulta |
| Notas | No | Motivo o instrucciones especiales |

### Cambiar Estado de una Cita

Haga clic en cualquier cita para ver su detalle. Desde ahí puede cambiar el estado:
- **Confirmar** → pasa a Confirmada
- **Cancelar** → pasa a Cancelada
- **No asistió** → registra ausencia
- **Completar** → marca como atendida

### Citas de Videoconsulta

Las citas de tipo **VIDEOCONSULTA** muestran botones adicionales:
- **"Sala de teleconsulta":** Abre la sala pre-consulta dentro de MedSysVE
- **"Jitsi directo ↗":** Abre directamente la sala de videoconferencia en Jitsi

---

## 9. Teleconsulta

**Ruta:** `/doctor/teleconsulta/[appointmentId]`

Accesible desde una cita de tipo VIDEOCONSULTA.

### Checklist Pre-Consulta

Antes de iniciar la videollamada, el sistema muestra un checklist de 5 ítems que **deben marcarse todos** antes de poder acceder a la sala:

1. ✅ Micrófono funcionando
2. ✅ Cámara funcionando
3. ✅ Conexión a internet estable
4. ✅ Ambiente privado y silencioso
5. ✅ Historial del paciente revisado

Una vez marcados todos, el botón para abrir la sala de Jitsi se activa.

### Sala de Videoconsulta

La videollamada se realiza a través de **Jitsi Meet**, que se abre en una nueva pestaña del navegador. No requiere instalación de software adicional.

La sala tiene un nombre único por cita, garantizando privacidad.

### Notas Post-Consulta

Después de la videollamada, regrese a MedSysVE y complete las notas de la teleconsulta en el campo provisto antes de finalizar.

---

## 10. Facturación

**Ruta:** `/doctor/billing`

### Lista de Facturas

Muestra todas las facturas del consultorio con:
- Número de factura
- Paciente
- Fecha
- Monto total (USD y Bs)
- Estado (Pendiente / Pagada / Cancelada / Vencida)
- Proveedor de seguro (si aplica)

### Crear Nueva Factura

Haga clic en **"+ Nueva factura"**.

**Pasos:**

1. **Seleccionar paciente:** Busque por nombre o cédula

2. **Agregar conceptos:**
   - Descripción del servicio (ej: "Consulta médica general")
   - Cantidad
   - Precio unitario en USD
   - El sistema convierte automáticamente a Bolívares usando el tipo de cambio BCV actualizado

3. **Seguro médico (opcional):**
   - Seleccione la aseguradora del paciente
   - Ingrese el porcentaje de cobertura del seguro
   - El sistema calcula automáticamente el monto a cobrar al paciente y el monto del seguro

4. **Crear factura:** Haga clic en el botón de confirmación

### Marcar como Pagada

Una vez recibido el pago, haga clic en el botón **"Marcar como pagada"** en el detalle de la factura.

### Tipo de Cambio BCV

El sistema obtiene automáticamente el tipo de cambio oficial del Banco Central de Venezuela y lo aplica a todas las conversiones USD → Bs. El tipo de cambio se actualiza diariamente.

---

## 11. Estadísticas

**Ruta:** `/doctor/analytics`

El módulo de estadísticas ofrece visualizaciones gráficas del rendimiento del consultorio.

### Métricas Disponibles

**Ingresos del período:**
- Total en USD
- Total en Bolívares (al tipo de cambio actual)
- Evolución mensual en gráfica de líneas

**Distribución por tipo de consulta:** Gráfica de pastel mostrando la proporción de Consultas / Seguimientos / Emergencias / Procedimientos / Videoconsultas.

**Nuevos pacientes por mes:** Gráfica de barras con el crecimiento mensual de la base de pacientes.

**Distribución por sexo:** Proporción de pacientes masculinos, femeninos y otros.

**Diagnósticos más frecuentes:** Los 10 diagnósticos CIE-10 más recurrentes.

**Distribución de edad:** Pirámide poblacional de los pacientes.

**Resumen ejecutivo:**
- Total de pacientes registrados
- Consultas firmadas en el período
- Facturas pendientes de cobro

---

## 12. Indicadores de Calidad

**Ruta:** `/doctor/quality`

### Puntuación General de Calidad

En la parte superior, una barra de progreso muestra la puntuación global como promedio de 4 indicadores clave. La escala es:
- 🟢 Verde (≥80%): Excelente
- 🟡 Amarillo (≥70%): Aceptable
- 🔴 Rojo (<70%): Necesita mejora

### Indicadores Individuales

| Indicador | Objetivo | Descripción |
|-----------|----------|-------------|
| Tasa de firma de consultas | ≥80% | Porcentaje de consultas que han sido firmadas |
| Tasa de completitud de datos | ≥70% | Consultas con signos vitales y diagnóstico registrado |
| Tasa de no-show | ≤15% | Porcentaje de pacientes que no asisten a sus citas |
| Seguimiento de crónicos | ≥60% | Pacientes crónicos con cita reciente (últimos 90 días) |
| Signos vitales registrados | ≥75% | Porcentaje de consultas con signos vitales completos |
| Recetas en últimos 30 días | Informativo | Total de prescripciones emitidas |
| Facturas pendientes | Informativo | Número de facturas sin cobrar |
| Facturas pagadas | Informativo | Número de facturas cobradas |
| Total pacientes | Informativo | Base total de pacientes |
| Total encuentros | Informativo | Total de consultas realizadas |

Cada tarjeta muestra el valor actual, el objetivo y una flecha indicando tendencia.

---

## 13. Panel de Crónicos

**Ruta:** `/doctor/chronics`

### Propósito

Identifica y gestiona pacientes con enfermedades crónicas que requieren seguimiento regular: Hipertensión Arterial (HTA), Diabetes Mellitus tipo 2 (DM2), y otras condiciones crónicas.

### Vista del Panel

**Lista de pacientes crónicos:** Pacientes identificados por sus etiquetas (HTA, DM2, Diabetes, Hipertensión).

**Score de riesgo:** Puntuación calculada por el sistema basada en:
- Tiempo desde la última consulta
- Adherencia a citas programadas
- Historial de signos vitales

**Indicadores por paciente:**
- Última cita realizada
- Próxima cita programada
- Alertas de seguimiento vencido

---

## 14. Horario

**Ruta:** `/doctor/schedule`

### Configuración de Horarios de Atención

Define los días y horas en que el consultorio está disponible para citas.

**Bloques de horario:** Configure turnos de atención (mañana/tarde) para cada día de la semana.

**Duración del turno:** Establezca la duración estándar de cada cita (15, 20, 30, 45, 60 minutos).

**Días de atención:** Seleccione los días hábiles del consultorio.

**Bloques bloqueados:** Marque fechas específicas como no disponibles (vacaciones, feriados, etc.).

El horario configurado aquí determina los turnos disponibles que los pacientes pueden ver y solicitar a través del portal.

---

## 15. Seguros Médicos

**Ruta:** `/doctor/insurance`

### Gestión de Aseguradoras

**Lista de proveedores:** Todas las aseguradoras registradas con su nombre, código, teléfono y estado (activo/inactivo).

**Crear nueva aseguradora:**

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Nombre | Sí | Nombre completo de la aseguradora (ej: "Seguros Caracas") |
| Código | No | Código interno o código de la aseguradora |
| Teléfono | No | Teléfono de contacto de la aseguradora |
| Email | No | Correo de contacto |

Haga clic en **"Crear"** para guardar.

**Editar aseguradora:** Use el ícono de editar (lápiz) junto a cada aseguradora.

**Activar/Desactivar:** Use el botón de estado para activar o desactivar una aseguradora. Las inactivas no aparecen en el formulario de facturación.

### Pólizas en el Perfil del Paciente

En el perfil de cada paciente, la sección **"Seguros Médicos"** permite:

**Agregar nueva póliza:**
- **Aseguradora:** Seleccione de la lista de aseguradoras activas
- **Número de póliza:** Identificador de la póliza del paciente
- **Titular:** Nombre del titular de la póliza (si es diferente al paciente)
- **Cobertura %:** Porcentaje que cubre el seguro (ej: 80)
- **Fecha de vigencia:** Hasta cuándo es válida la póliza
- **Notas:** Información adicional

**Estados de póliza:** Activa / Inactiva. Una póliza vencida se muestra en rojo.

---

## 16. Consentimientos Informados

**Ruta:** `/doctor/consent-templates`

### Plantillas de Consentimiento

MedSysVE incluye un sistema completo para gestionar consentimientos informados.

**Lista de plantillas:** Todas las plantillas creadas, con nombre y estado (activa/inactiva).

**Plantillas pre-cargadas disponibles:** El sistema ofrece 4 plantillas estándar para Venezuela:
1. Consentimiento General de Atención Médica
2. Consentimiento para Procedimientos Menores
3. Consentimiento para Telemedicina
4. Autorización para Tratamiento de Datos

Haga clic en el botón de plantillas predefinidas para agregarlas a su consultorio.

**Crear nueva plantilla:**
- **Título:** Nombre del consentimiento
- **Contenido:** Texto completo del documento. Use el editor para formatear el texto.

**Editar/Desactivar:** Use los botones junto a cada plantilla.

### Consentimientos en el Perfil del Paciente

En la sección **"Consentimientos"** del perfil del paciente:

**Consentimientos pendientes** (color ámbar):
- Nombre del consentimiento
- Fecha de solicitud
- Botón **"Firmar"** para registrar la firma del paciente

**Consentimientos firmados** (color verde esmeralda):
- Fecha de firma
- Nombre del consentimiento
- Estado verificado

**Asignar nuevo consentimiento:**
1. Seleccione la plantilla del menú desplegable
2. Opcionalmente vincule a un encuentro clínico
3. Haga clic en asignar

---

## 17. Auditoría Clínica

**Ruta:** `/doctor/audit`

### Propósito

Registro inmutable de todas las acciones realizadas en el sistema. Permite verificar quién hizo qué y cuándo.

### Vista del Registro

**Columnas del registro:**
- **Fecha/Hora:** Cuándo ocurrió la acción
- **Acción:** Qué se hizo (ej: CONSULTA_FIRMADA, FACTURA_CREADA)
- **Entidad:** Sobre qué registro (ej: Encounter, Invoice, Patient)
- **Actor:** Quién realizó la acción
- **Detalle:** Información adicional (expandible)

### Filtros

| Filtro | Descripción |
|--------|-------------|
| Entidad | Filtre por tipo de registro (Encounter, Invoice, Patient, etc.) |
| Actor | Filtre por el usuario que realizó la acción |
| Desde | Fecha de inicio del período |
| Hasta | Fecha de fin del período |

### Detalle del Evento

Haga clic en cualquier registro para expandir el detalle en formato JSON con información técnica adicional sobre la acción.

### Paginación

El registro muestra 50 eventos por página. Use los botones **"Anterior"** y **"Siguiente"** para navegar.

---

## 18. Importación de Pacientes

**Ruta:** `/doctor/import`

### Propósito

Permite importar múltiples pacientes a la vez desde un archivo CSV, ideal para migrar desde otro sistema o registrar un listado existente.

### Formato del Archivo CSV

El archivo debe ser un CSV con las siguientes columnas (la primera fila debe ser el encabezado):

| Columna | Obligatorio | Formato | Ejemplo |
|---------|-------------|---------|---------|
| nombre | Sí | Texto | María |
| apellido | Sí | Texto | González |
| fechaNacimiento | Sí | AAAA-MM-DD | 1980-03-15 |
| sexo | No | M o F | F |
| cedula | No | Solo números | 8765432 |
| telefono | No | Texto | 04121234567 |
| email | No | Email válido | maria@ejemplo.com |

### Plantilla CSV

Haga clic en **"Descargar plantilla"** para obtener un archivo CSV de ejemplo con los encabezados correctos.

### Proceso de Importación

1. Prepare su archivo CSV siguiendo el formato indicado
2. Arrastre el archivo al área de carga o haga clic para seleccionarlo
3. El sistema procesa el archivo y muestra los resultados:
   - **Total:** Filas procesadas
   - **Creados:** Pacientes nuevos registrados
   - **Omitidos:** Pacientes que ya existían en el sistema (no se duplican)
   - **Errores:** Filas con datos inválidos (fecha incorrecta, campos vacíos, etc.)

### Límites

- Máximo **500 pacientes** por importación
- Tamaño máximo del archivo: **5 MB**
- Los pacientes duplicados (mismo nombre + apellido + fecha de nacimiento) se omiten automáticamente

---

## 19. Módulo Pediátrico

**Ubicación:** En el perfil de pacientes menores de 18 años

### Activación Automática

El módulo pediátrico aparece **automáticamente** en el perfil de pacientes cuya fecha de nacimiento indica menos de 18 años de edad. Para pacientes adultos, este panel está oculto.

### Gráfica de Crecimiento

Visualización interactiva del peso del paciente en el tiempo, comparado con los **percentiles de la OMS**:

| Línea | Color | Significado |
|-------|-------|-------------|
| P97 | Rojo punteado | Percentil 97 (límite superior) |
| P50 | Gris punteado | Mediana (percentil 50) |
| P3 | Azul punteado | Percentil 3 (límite inferior) |
| Paciente | Verde sólido | Peso real del paciente |

Los datos de peso se extraen automáticamente de los signos vitales registrados en las consultas.

> Disponible para niños de 0 a 24 meses para niños masculinos (referencia OMS).

### Esquema PAI Venezuela

Muestra el **Programa Ampliado de Inmunizaciones** de Venezuela con:

**8 grupos de edad:**
- Recién nacido
- 2 meses
- 4 meses
- 6 meses
- 1 año
- 15-18 meses
- 4-6 años
- 11-12 años

**Para cada grupo:**
- Lista de vacunas requeridas
- Indicador de cobertura: cuántas vacunas del grupo están registradas en el historial del paciente

---

## 20. Tareas del Equipo

**Ruta:** `/doctor/tasks`

### Vista del Tablero

Las tareas se organizan en columnas por estado:
- **Pendiente**
- **En progreso**
- **Completada**

### Crear Nueva Tarea

Haga clic en **"+ Nueva tarea"** o en el botón de cada columna.

**Campos:**

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Título | Sí | Nombre corto de la tarea |
| Descripción | No | Detalle de lo que debe hacerse |
| Prioridad | Sí | Alta / Media / Baja |
| Fecha de vencimiento | No | Cuándo debe completarse |
| Asignar a | No | Seleccione un miembro del equipo |

### Gestionar Tareas

**Cambiar estado:** Arrastre la tarjeta entre columnas o use el menú de opciones.

**Editar:** Haga clic en la tarjeta para ver el detalle y editar.

**Completar:** Marque la tarea como completada cuando esté lista.

---

## 21. Mensajes Internos

**Ruta:** `/doctor/mensajes`

### Sistema de Mensajería

Comunicación interna entre los miembros del equipo del consultorio.

**Tipos de mensajes:**

| Tipo | Descripción |
|------|-------------|
| APPOINTMENT_REQUEST | Solicitud de cita enviada por un paciente desde el portal |
| PORTAL_MESSAGE | Mensaje enviado por un paciente desde el portal |
| REFERRAL | Notificación de referido médico |
| IMAGING_RESULT | Resultado de imagenología disponible |
| SYSTEM | Notificaciones del sistema |

**Contador de no leídos:** El ícono de sobre en el sidebar muestra cuántos mensajes nuevos hay. El número se actualiza cada 30 segundos.

**Leer un mensaje:** Haga clic en el mensaje para marcarlo como leído y ver su contenido completo.

---

## 22. Mi Equipo

**Ruta:** `/doctor/staff`

### Lista del Equipo

Muestra todos los miembros del equipo con:
- Nombre y apellido
- Rol (Secretaria / Asistente / Enfermera)
- Email
- Estado (Activo / Inactivo)

### Invitar Nuevo Miembro

**Ruta:** `/doctor/staff/invite`

Haga clic en **"Invitar"** o **"+ Nuevo miembro"**.

**Campos:**

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Nombre | Sí | Nombre del miembro |
| Apellido | Sí | Apellido del miembro |
| Email | Sí | Correo electrónico (será su usuario) |
| Rol | Sí | SECRETARY / ASSISTANT / NURSE |
| PIN de acceso | Sí | Contraseña numérica para iniciar sesión |

El miembro del equipo usará su **email + PIN** para ingresar al sistema.

### Activar/Desactivar Miembro

Use el botón de estado junto a cada miembro para:
- **Desactivar:** El miembro pierde acceso al sistema pero sus datos se conservan
- **Activar:** Restaura el acceso al sistema

---

## 23. Configuración del Consultorio

**Ruta:** `/doctor/workspace`

### Información General del Consultorio

| Campo | Descripción |
|-------|-------------|
| Nombre | Nombre del consultorio (visible en documentos PDF) |
| Descripción | Descripción breve del consultorio |
| Dirección | Dirección física |
| Teléfono | Número de contacto principal |
| Email | Correo de contacto |
| RIF | Registro de Información Fiscal |
| Sitio web | URL del sitio web (opcional) |

Haga clic en **"Guardar cambios"** para confirmar.

### Configuración de Recordatorios de Citas

Controla cómo y cuándo el sistema envía recordatorios automáticos a los pacientes.

**Horas de anticipación:** Cuántas horas antes de la cita se envía el recordatorio:
- Opciones: 1h / 2h / 4h / 6h / 12h / 24h / 48h / 72h

**Canales de envío:**
- **Email:** Activa/desactiva el envío por correo electrónico
- **WhatsApp:** Activa/desactiva el envío por WhatsApp (requiere número configurado)

### Subida de Logo del Consultorio

El logo aparece en los documentos PDF generados (recetas, informes, reposos).

- Formatos aceptados: JPG, PNG, WebP
- Tamaño máximo: **2 MB**
- Arrastre el archivo al área o haga clic para seleccionar
- Se muestra una vista previa antes de guardar

### Subida de Membrete

El membrete es una imagen de cabecera para los documentos PDF, con más formato que el logo simple (puede incluir dirección, teléfono, etc.).

- Formatos aceptados: JPG, PNG, WebP
- Tamaño máximo: **5 MB**

---

## 24. Portal del Paciente

**Ruta:** `/portal` (acceso en portal/login)

### Acceso al Portal

El portal del paciente es una interfaz separada y simplificada para que los pacientes consulten su información médica.

**Para activar el acceso de un paciente:**
1. Vaya al perfil del paciente en `/doctor/patients`
2. En la sección **"Acceso portal del paciente"**, ingrese una contraseña
3. Guarde los cambios

**El paciente accede en:** `/portal/login`  
**Credenciales:** Email + contraseña configurada por el médico

### Funciones del Portal para el Paciente

**Inicio (/portal):**
- Resumen de consultas recientes
- Próximas citas

**Recetas (/portal/prescriptions):**
- Lista de recetas activas
- Opción de descargar en PDF

**Resultados de Laboratorio (/portal/lab-results):**
- Historial de resultados de laboratorio
- Valores con referencia (normal/alto/bajo)

**Exámenes (/portal/examenes):**
- Órdenes de imagenología y resultados

**Vacunas (/portal/vacunas):**
- Historial de vacunación completo

**Solicitar Cita (/portal/schedule):**
- Calendario de disponibilidad del consultorio
- Selección de fecha, hora y motivo
- La solicitud queda en estado "Solicitada" hasta que el médico la confirme

**Mensajes (/portal/mensajes):**
- Comunicación directa con el consultorio

**Mi Perfil (/portal/perfil):**
- Ver y actualizar datos personales (teléfono, email)

---

## 25. Búsqueda Global

**Acceso:** `Ctrl+K` (Windows/Linux) o `⌘K` (Mac)

### Paleta de Búsqueda

Al activar la búsqueda, aparece un panel central con un campo de texto. Escriba para buscar en tiempo real.

**Búsqueda de pacientes:**
- Por nombre (nombre y/o apellido)
- Por número de cédula
- Por ID del consultorio (#000001)

**Búsqueda de citas:**
- Por nombre del paciente
- Por fecha

**Navegación rápida:**
- Escriba el nombre de una sección (ej: "facturación") para ir directamente

**Uso con teclado:**
- `↑` / `↓` para navegar entre resultados
- `Enter` para seleccionar
- `Esc` para cerrar

---

## 26. Referidos Médicos

**Ruta:** `/doctor/referrals`

### Lista de Referidos

Muestra referidos enviados (pacientes que usted refirió a otro médico) y referidos recibidos (pacientes que otros médicos le enviaron).

**Información de cada referido:**
- Paciente
- Médico origen / destino
- Motivo
- Estado
- Fecha

### Crear un Referido

Los referidos se crean desde dentro de una consulta (ver sección 5 — Referido Médico).

**Para referir un paciente:**
1. Abra la consulta del paciente
2. En la sección "Referido Médico", busque el médico por nombre o especialidad
3. Escriba el motivo del referido
4. Haga clic en **"Crear referido"**

El médico de destino recibirá una notificación en su módulo de mensajes.

---

## 27. Tipos de Identificación

MedSysVE acepta los siguientes documentos de identidad:

| Tipo | Prefijo | Descripción |
|------|---------|-------------|
| Cédula venezolana | V- | Cédula de identidad venezolana |
| Cédula extranjera | E- | Documento de identidad de extranjero residente |
| Pasaporte | — | Pasaporte internacional |
| Sin cédula | — | Para menores de edad sin documento de identidad |

**Cómo ingresar la cédula:**
- Solo ingrese los números (sin la V, E o guiones)
- El sistema agrega automáticamente el prefijo según el tipo seleccionado
- Ejemplo: Seleccione "V-" e ingrese "12345678" → se guarda como "V-12345678"

---

## 28. Glosario de Términos

| Término | Significado |
|---------|-------------|
| **SOAP** | Formato de consulta médica: **S**ubjetivo, **O**bjetivo, **A**ssessment (Diagnóstico), **P**lan |
| **CIE-10** | Clasificación Internacional de Enfermedades, 10ª revisión. Sistema estándar para codificar diagnósticos |
| **PAI** | Programa Ampliado de Inmunizaciones. Esquema de vacunación oficial de Venezuela |
| **HTA** | Hipertensión Arterial. Presión arterial elevada de forma crónica |
| **DM2** | Diabetes Mellitus tipo 2. Trastorno metabólico crónico del azúcar en sangre |
| **OMS** | Organización Mundial de la Salud. Establece los estándares de percentiles de crecimiento |
| **BCV** | Banco Central de Venezuela. Publica el tipo de cambio oficial USD/Bs |
| **TA** | Tensión Arterial. Fuerza que ejerce la sangre contra las paredes de las arterias |
| **FC** | Frecuencia Cardíaca. Número de latidos del corazón por minuto |
| **FR** | Frecuencia Respiratoria. Número de respiraciones por minuto |
| **SpO2** | Saturación de Oxígeno. Porcentaje de oxígeno en sangre medido por pulsioxímetro. Normal: 95-100% |
| **Glasgow** | Escala de Coma de Glasgow. Evalúa nivel de conciencia. Máximo: 15, Mínimo: 3 |
| **EMR** | Electronic Medical Record (Registro Médico Electrónico). Sistema digital de historias clínicas |
| **OCR** | Optical Character Recognition. Tecnología que extrae texto de imágenes |
| **PDF** | Portable Document Format. Formato de archivo para documentos (recetas, informes) |
| **RIF** | Registro de Información Fiscal. Número de identificación tributaria venezolana |
| **Workspace** | Espacio de trabajo. El conjunto de datos e información de un consultorio específico |
| **PIN** | Número de Identificación Personal. Contraseña numérica usada por el staff para acceder |
| **Bs** | Bolívares venezolanos. Moneda nacional de Venezuela |

---

## 29. Preguntas Frecuentes

### ¿Cómo cambio mi contraseña?

Actualmente, el cambio de contraseña debe realizarse a través del administrador del sistema. La función de cambio de contraseña desde el perfil está en desarrollo. Contacte al soporte técnico si necesita cambiar su contraseña.

### ¿Puedo tener múltiples consultorios?

Sí. Un mismo doctor puede estar asociado a varios consultorios (workspaces). Si tiene acceso a más de uno, verá el selector de consultorio en la parte superior del sidebar (el componente "WorkspaceSwitcher"). Haga clic en el nombre del consultorio actual para ver la lista y cambiar entre ellos.

### ¿Cómo accede el paciente al portal?

1. Vaya al perfil del paciente en el sistema (como doctor)
2. Localice la sección **"Acceso portal del paciente"**
3. Configure una contraseña para el paciente
4. Guarde los cambios
5. Indíquele al paciente que acceda a `[URL-del-sistema]/portal/login`
6. El paciente ingresa con su **email** y la **contraseña** que usted configuró

> El paciente debe tener email registrado en su perfil para poder acceder al portal.

### ¿Qué pasa si olvido firmar una consulta?

Una consulta sin firmar permanece en estado **"Borrador"**. Puede editarla y firmarla en cualquier momento posterior:
1. Vaya al perfil del paciente
2. En "Historial de consultas", encontrará la consulta en borrador
3. Haga clic para abrirla
4. Complete los campos necesarios y firme

Las consultas en borrador **no son visibles para el paciente** en el portal hasta que sean firmadas.

### ¿Los datos son seguros?

MedSysVE implementa múltiples capas de seguridad:
- **Aislamiento por consultorio:** Los datos de cada consultorio están completamente separados. Ningún médico puede ver datos de otro consultorio.
- **Autenticación:** Contraseñas almacenadas con encriptación bcrypt. Nunca se guardan en texto plano.
- **Sesiones seguras:** Tokens JWT firmados con clave secreta.
- **Auditoría:** Todas las acciones críticas quedan registradas con usuario, fecha y hora.
- **HTTPS:** Toda comunicación está encriptada en tránsito.

### ¿Cómo exporto los datos de mis pacientes?

Puede exportar la lista completa de pacientes en formato CSV desde `/doctor/patients` haciendo clic en **"Exportar CSV"**. Para exportar citas o facturas, use los botones de exportación disponibles en cada módulo. Para el historial clínico individual de un paciente, use el botón **"Exportar historial PDF"** en el perfil del paciente.

### La página dice "Sin datos" ¿es normal?

Si acaba de crear su cuenta, es normal que los módulos muestren "Sin consultas registradas", "Sin pacientes", etc. Estos mensajes de estado vacío son informativos y desaparecerán a medida que registre información en el sistema.

### ¿Qué navegadores son compatibles?

MedSysVE funciona correctamente en:
- Google Chrome (recomendado) — versión 90 o superior
- Mozilla Firefox — versión 88 o superior
- Microsoft Edge — versión 90 o superior
- Safari — versión 14 o superior

No se recomienda el uso de Internet Explorer.

### ¿Cómo solicito soporte técnico?

Para reportar errores o solicitar asistencia, contacte al equipo de soporte de MedSysVE con:
- Descripción detallada del problema
- Capturas de pantalla si es posible
- El mensaje de error exacto que aparece en pantalla

---

*Manual de Usuario MedSysVE · Versión 1.0 · 2026*  
*Para soporte técnico, contacte al administrador del sistema.*
