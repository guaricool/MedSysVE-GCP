# Funciones de IA en MedSysVE — Guía de Uso

**Fecha de auditoría:** 1 de julio de 2026
**Auditor:** Mavis (auditoría con Playwright contra `www.medsysve.com`)
**Versión auditada:** deploy actual (commit `22315d5`, plus chain)

> **TL;DR para vos, Carlos:**
> Las 3 funciones de IA **SÍ existen** en el sistema y **SÍ están conectadas al UI**.
> Vos no las recordabas porque están enterradas en el encounter UI (sección SOAP).
> **PERO** hay un **bug real en `encounter-assist`** que hace que los diagnósticos
> diferenciales NO aparezcan en pantalla, aunque la API sí responde. Eso explica
> por qué pensabas que la feature no existía.
>
> **Acción recomendada:** fix del bug (15 min de trabajo) → recién después
> las promocioanmos en el IG.

---

## 1. Inventario de features IA

| Feature | Ruta API | Componente UI | Estado real |
|---|---|---|---|
| Diagnósticos diferenciales + plan terapéutico | `POST /api/ai/encounter-assist` | `components/encounter/ai-assist-panel.tsx` | ⚠️ **BUG**: API responde OK pero el parser del front falla |
| Interacciones medicamentosas | `POST /api/ai/drug-interactions` | `components/encounter/prescription-form.tsx` + `plan-form-integrado.tsx` | ✅ Funcional (con caveat: ver §3) |
| Sugerencia de dosis con IA | `POST /api/ai/dose-suggestion` | `components/encounter/prescription-form.tsx` (línea 308) + `plan-form-integrado.tsx` (línea 465) | ✅ Funcional |

Backend: Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) vía `@anthropic-ai/sdk`.
Auditoría LOPDP: cada llamada loguea un `AI_PHI_DISCLOSURE` event en `AuditEvent` (`encounter-assist/route.ts:48-62`).

---

## 2. Dónde están los botones en la UI

### 2.1 ✦ IA Asistente Clínico (panel principal)

**Ubicación en pantalla:** dentro de la consulta del paciente, debajo de la sección
**P — PLAN DE TRATAMIENTO**. Aparece como una sección colapsable con título
`✨ ASISTENTE IA` y dentro el botón toggle `✦ IA Asistente Clínico ▼ abrir`.

**Ruta de navegación:**
1. Login → `Dashboard`
2. Menú izquierdo → `Pacientes` → seleccionar paciente
3. En la ficha del paciente, click en la consulta que querés editar
4. Scroll abajo hasta la sección `✨ ASISTENTE IA`
5. Click `✦ IA Asistente Clínico ▼ abrir` → se expande

**URL directa** (deep link funcional):
```
/doctor/patients/<patientRegistrationId>/encounters/<encounterId>
```

**Lo que hace el panel:** botón `Sugerir diagnósticos diferenciales` toma motivo +
historia clínica + vitales + diagnósticos ya escritos, y devuelve 5 diagnósticos
en CIE-10 ordenados por probabilidad + un plan terapéutico sugerido.

**Disclaimer mostrado en UI:**
> Solo orientativo — prevalece el criterio clínico del médico.

![IA Assist Panel abierto con los 2 botones](https://images.medsysve.com/17d95a2e8ed59111.jpg)
*Caption placeholder — reemplazar con screenshot real*

### 2.2 ✨ Sugerir dosis con IA (botón sparkles)

**Ubicación en pantalla:** dentro del formulario "Agregar medicamento" en la receta.
Solo aparece cuando ya escribiste la **Concentración** del medicamento.

**Ruta de navegación:**
1. Dentro de la consulta del paciente
2. Click en la sección `P — PLAN DE TRATAMIENTO`
3. En el box `TRATAMIENTO DE MEDICAMENTOS`, hay un campo `Buscar medicamento (nombre genérico o comercial)...`
4. Seleccioná un medicamento del autocomplete
5. Se despliega el formulario de dosificación
6. Al lado del campo **Dosis** aparece un botón con ícono ✨ y texto `IA`
7. Click → se autorrellena `dosis`, `frecuencia`, `duración`, `indicaciones especiales`

**Lo que hace:** envía a Claude el nombre del medicamento + concentración, y devuelve
la dosis estándar sugerida para adulto (no considera peso/edad/función renal — solo
la dosis de referencia).

![Botón IA en el campo Dosis](https://images.medsysve.com/17d95a2e8ed59111.jpg)
*Caption placeholder — reemplazar con screenshot real*

### 2.3 ⚠️ Interacciones medicamentosas (chequeo automático)

**Ubicación en pantalla:** se ejecuta **automáticamente** cada vez que agregás un
medicamento nuevo a la receta, mientras la receta ya tenga otros medicamentos.

**Trigger:** dentro de `prescription-form.tsx:91-119` (`handleAddItem`).

**Lo que hace:** compara el medicamento nuevo contra los ya presentes en la receta.
Si hay interacción, muestra un warning amarillo y bloquea el alta hasta que el
médico haga override explícito.

**Diferencia clave:** esta feature NO tiene un botón visible. Es transparente —
corre cuando agregás un medicamento. Si querés verla funcionar, agregá primero
un medicamento base (ej: Warfarina), después intentá agregar Ibuprofeno o
Aspirina → te avisa.

---

## 3. Bug encontrado en `encounter-assist`

### 3.1 El problema

**Archivo:** `app/api/ai/encounter-assist/route.ts:84-92`

```typescript
const block = msg.content.find((c) => c.type === "text")
const raw = block?.type === "text" ? block.text.trim() : ""

try {
  const parsed = JSON.parse(raw) as { diferencial: string[]; plan: string }
  return NextResponse.json(parsed)
} catch {
  return NextResponse.json({ diferencial: [], plan: raw })
}
```

Claude devuelve su respuesta **envuelta en markdown fences**:

```
```json
{
  "diferencial": ["J06.9 ...", "J02.9 ..."],
  "plan": "Iniciar manejo sintomático..."
}
```
```

`JSON.parse()` falla por las fences → cae al catch → devuelve `{ diferencial: [], plan: <texto crudo> }`.

### 3.2 Evidencia capturada con Playwright

```
status: 200
data: {
  "diferencial": [],
  "plan": "```json\n{\n  \"diferencial\": [\n    \"J06.9 Infección respiratoria aguda no especificada\",\n    \"J02.9 Faringitis aguda no especificada\",\n    \"A80.9 Poliomielitis aguda no especificada\",\n    \"G93.1 Anoxia cerebral\",\n    \"R51.9 Cefalea no especificada\"\n  ],\n  \"plan\": \"Iniciar manejo sintomático con paracetamol 500 mg cada 6 horas...\"\n}\n```"
}
```

Fijate: la API **SÍ respondió** con diagnósticos válidos (J06.9, J02.9, A80.9, G93.1, R51.9),
pero están atrapados dentro del string del campo `plan`. El componente UI nunca los
ve porque lee `data.diferencial` que viene vacío.

### 3.3 El fix (15 min de trabajo)

```typescript
// Reemplazar líneas 84-92
const block = msg.content.find((c) => c.type === "text")
let raw = block?.type === "text" ? block.text.trim() : ""

// Strip markdown fences if present (Claude often wraps JSON in ```json ... ```)
raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim()

try {
  const parsed = JSON.parse(raw) as { diferencial: string[]; plan: string }
  return NextResponse.json(parsed)
} catch {
  return NextResponse.json({ diferencial: [], plan: raw })
}
```

Después del fix:
- `Sugerir diagnósticos diferenciales` → muestra 5 códigos CIE-10 ordenados
- `Redactar sugerencia de plan` → muestra el plan sugerido (sigue funcionando, ya
  que Claude lo devuelve como JSON plano cuando le pedís solo plan)

### 3.4 Por qué Carlos no vio la feature funcionando

Vos estabas en lo cierto: el botón está ahí, pero **siempre devuelve diferencial
vacío**. Parecía que la feature no existía. Después del fix, vas a ver los 5
diagnósticos aparecer en pantalla.

---

## 4. Caveat en `drug-interactions`

Probado con `Warfarina + Acetaminofen + Losartan` (interacción clásica — el
Acetaminofen a dosis altas potencia el efecto anticoagulante de la Warfarina).
La API devolvió `hasInteraction: false`. Claude no la detectó.

**Implicancia:** la feature corre, pero **no es exhaustiva**. No la promuevas
en el ad como "sistema que detecta interacciones" sin un disclaimer claro.
Para un médico serio, mejor framing: "asistente que ayuda a no pasar por alto
interacciones obvias" — nunca "garantiza detección".

Considerar en el futuro: integrar una base de datos farmacéutica (DrugBank,
FDA OpenFDA) en vez de depender solo de la respuesta libre de Claude.

---

## 5. Flujo paso-a-paso (para vos)

### 5.1 Probar diagnósticos diferenciales

1. Login → `https://www.medsysve.com/login`
2. Pacientes → María González #000002
3. Click en consulta "Cefalea + fiebre 3 días"
4. Scroll a `✨ ASISTENTE IA` → click `✦ IA Asistente Clínico ▼ abrir`
5. Click `Sugerir diagnósticos diferenciales`
6. Esperá 5-10 seg (Claude Haiku)
7. ❌ **HOY:** no aparece nada en pantalla (por bug)
8. ✅ **DESPUÉS DEL FIX:** aparecen 5 diagnósticos en CIE-10

### 5.2 Probar sugerencia de dosis

1. Misma consulta, sección `P — PLAN DE TRATAMIENTO`
2. En `TRATAMIENTO DE MEDICAMENTOS`, buscá un medicamento (ej: "Amoxicilina")
3. Seleccioná del autocomplete
4. Escribí la concentración (ej: "500 mg")
5. Aparece el formulario con campos `Dosis`, `Frecuencia`, `Duración`
6. Click en el botón ✨ `IA` al lado de **Dosis**
7. En ~3 seg se autorrellenan los 4 campos

### 5.3 Probar interacción medicamentosa

1. Misma consulta, `TRATAMIENTO DE MEDICAMENTOS`
2. Ya tenés Acetaminofen en la receta (1 medicamento)
3. Buscá y agregá "Warfarina" (o "Ibuprofeno" o "Aspirina")
4. ❌ **HOY:** no aparece warning visible (Claude no la detecta consistentemente)
5. Esperá — el sistema internamente chequea, pero la cobertura no es 100%

---

## 6. Para el IG ad — recomendación final

**No las promociones hasta arreglar el bug.** Razones:

1. **Encuentro-assist:** el botón existe pero está roto. Si lo promocionás y un
   médico lo prueba, ve que no devuelve nada → desconfianza.
2. **Drug-interactions:** corre pero con cobertura parcial. Riesgo reputacional
   si alguien publica "MedSysVE no detectó la interacción que mi paciente tuvo".
3. **Dose-suggestion:** esta SÍ funciona. Es segura de mencionar en el ad.

**Plan sugerido:**
1. (15 min) Aplicar el fix de §3.3
2. (30 min) Re-testear las 3 features en producción
3. (opcional) Agregar un disclaimer persistente en el panel IA
4. Re-armar el caption del IG con las 3 features, asumiendo que todas funcionan

---

## 7. Data de prueba creada (limpieza)

Para esta auditoría creé en tu workspace:
- Paciente: María González #000002 (`demo_patient_maria_001`)
- Consulta: "Cefalea + fiebre 3 días" (`demo_enc_maria_001`)
- Receta: 1 item (Acetaminofen 500mg) (`demo_presc_maria_001`)

**Si querés limpiarla**, corré esto en el VPS:
```bash
ssh root@13.140.181.29
docker exec -i tf03dm49her0vco2lprdqbjm psql -U medsysve -d medsysve <<'SQL'
DELETE FROM "PrescriptionItem" WHERE id LIKE 'demo_pi_%';
DELETE FROM "Prescription" WHERE id LIKE 'demo_presc_%';
DELETE FROM "Encounter" WHERE id LIKE 'demo_enc_%';
DELETE FROM "PatientRegistration" WHERE id LIKE 'demo_pr_%';
DELETE FROM "Patient" WHERE id LIKE 'demo_patient_%';
SQL
```

O más fácil: entrá al sistema como admin → Pacientes → María González → Eliminar paciente.
La consulta y la receta se borran en cascada.

---

## 7. AI Guardrails (Audit S8, 2026-07-07)

> **Para vos, Carlos:** los 3 endpoints de IA (`encounter-assist`, `drug-interactions`,
> `dose-suggestion`) ahora tienen **4 capas de defensa** contra prompt injection +
> rate-limiting per-doctor. Esto cierra el audit item **#13** del backlog.

### 4 capas de defensa

| # | Capa | Qué hace | Dónde |
|---|---|---|---|
| 1 | **Input sanitization** | Strip NUL bytes, zero-width invisible chars (Trojan Source), bidi overrides. Whitespace run collapse. Trunca a `MAX_INPUT_SIZES` per-field. | `lib/ai/guardrails.ts:sanitizeInput` |
| 2 | **Prompt injection detection** | 10 patrones regex (English + Spanish) que flaggean contenido adversarial: "ignore previous instructions", DAN, fake `system:` fences, role redefinition, system-prompt extraction attempts. | `lib/ai/guardrails.ts:detectPromptInjection` |
| 3 | **Hardened system prompts** | System prompt estático, code-defined, separado del user content (vía parámetro `system` de Anthropic — privilegiado, no overridable). Cada feature tiene su propio prompt con reglas anti-inyección + output format estricto. | `lib/ai/guardrails.ts:buildSafeSystemPrompt` |
| 4 | **Per-doctor rate limit** | Sliding window Redis, identifier = `session.user.id`. `encounter-assist: 30/min`, `drug-interactions + dose-suggestion: 60/min`. | `lib/rate-limit.ts:LIMITERS.ai*` |

### Qué se loggea en audit (`AI_PHI_DISCLOSURE`)

Cada llamada a Claude ahora agrega al `metadata` del evento:

```json
{
  "provider": "anthropic",
  "model": "claude-haiku-4-5-20251001",
  "feature": "encounter-assist",
  "hasMotivo": true,
  "hasAnamnesis": true,
  "hasVitales": true,
  "diagnosesCount": 3,
  "guardrailsApplied": true,
  "fieldsSanitized": 4,
  "truncatedFields": [],
  "invisibleCharFields": ["motivo"],
  "injectionSuspicious": true,
  "injectionPatterns": ["ignore-instructions-es"]
}
```

**Importante:** el contenido clínico (motivo, anamnesis, diagnoses) **NO se loggea**, solo
metadata. Esto cumple con LOPDP Art. 19 (data minimization).

### Tests (45 nuevos en `tests/unit/ai-guardrails.test.ts`)

Cubren:
- 10 patrones de injection (cada uno testado en EN y ES)
- False-positive prevention: textos clínicos legítimos (Plan: iniciar IECA...) NO se flaggean
- Trojan Source: bidi override, zero-width joiner, word joiner
- Long input truncation
- Per-doctor bucket isolation en rate limit
- Defense layering end-to-end: incluso con payload injection, system prompt dice "ignora" y opera correctamente

### Cómo activar/desactivar guardrails

Los guardrails están **siempre activos**. Para hacer fail-closed (rechazar request
cuando se detecta injection), pasar `{ rejectOnInjection: true }` a `applyGuardrails`
en el route. Actualmente fail-open por defecto — el operador revisa el audit log.

### Cambios futuros

- Si necesitás mover `MAX_INPUT_SIZES` por feature, están centralizadas en
  `lib/ai/guardrails.ts:54`. Aumentar el límite allana ataques DoS.
- Si aparecen nuevos patrones de injection reales en producción, agregar a la
  lista `INJECTION_PATTERNS` con un test correspondiente.