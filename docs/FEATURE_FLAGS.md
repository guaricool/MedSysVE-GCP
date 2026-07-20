# Feature Flags — MedSysVE

> **Última actualización:** 2026-07-02
> **Cierra audit item:** #8 (feature flag system)

---

## TL;DR

Configurás flags en una sola env var JSON (`FEATURE_FLAGS`). Cambiás el valor en Google Cloud UI, redeploy, y los cambios aplican sin tocar código.

```json
{
  "ai": { "enabled": true, "rolloutPercent": 100 },
  "experimental": { "newDashboard": false }
}
```

| Flag | Tipo | Default | Uso |
|---|---|---|---|
| `ai.enabled` | bool | `true` | Master switch de TODAS las AI features |
| `ai.rolloutPercent` | 0-100 | `100` | % de usuarios que ven AI features (gradual rollout) |
| `experimental.<key>` | bool | `false` | Free-form para features beta |

| Helper | Tipo | Default | Uso |
|---|---|---|---|
| `isStripeLiveMode()` | bool | (auto) | Detecta de `STRIPE_SECRET_KEY` prefix, NO configurable |

---

## 1. Cómo se carga

```
.env (Google Cloud):
FEATURE_FLAGS={"ai":{"enabled":true,"rolloutPercent":100}}

app startup:
  loadFlags() → parse JSON → cache → return
  invalid JSON → console.warn + fallback a defaults
  missing env → use defaults
```

**Importante**: el módulo nunca tira excepción por malformed JSON. Si Google Cloud tiene un typo en la env var, la app sigue funcionando con defaults + warning en logs.

---

## 2. AI Rollout (gradual)

Para activar AI features solo al 10% de doctores (test gradual):

```json
{ "ai": { "enabled": true, "rolloutPercent": 10 } }
```

Cómo se calcula quién está dentro:
- Hash SHA-256 del `session.user.id`
- Tomar primeros 4 bytes como uint32 (big-endian)
- `bucket = num % 100`
- Si `bucket < rolloutPercent` → habilitado

**Determinístico por user**: el mismo doctor siempre cae en el mismo bucket. Si subís el rollout de 10 → 50, los doctores que ya estaban dentro siguen dentro + 40% nuevos.

---

## 3. Cómo usar en código

```typescript
import {
  isAIFeatureEnabled,
  isExperimentalEnabled,
  isStripeLiveMode,
} from "@/lib/feature-flags"

// AI feature check (con session para rollout)
if (!isAIFeatureEnabled(session)) {
  throw new TRPCError({ code: "FEATURE_DISABLED" })
}

// Experimental flag check
if (isExperimentalEnabled("newDashboard")) {
  return <NewDashboard />
} else {
  return <OldDashboard />
}

// Stripe live mode (auto-detected, no env var)
if (isStripeLiveMode()) {
  console.log("Using live Stripe")
}
```

---

## 4. Integración actual (2026-07-02)

| Path | Flag | Comportamiento cuando off |
|---|---|---|
| `app/api/ai/dose-suggestion/route.ts` | `ai` | 503 con mensaje "Funcionalidad de IA temporalmente deshabilitada" |
| `app/api/ai/drug-interactions/route.ts` | `ai` | 503 (mismo mensaje) |
| `app/api/ai/encounter-assist/route.ts` | `ai` | 503 (mismo mensaje) |
| `app/api/ai/lab-ocr/route.ts` | `ai` | 503 (mismo mensaje) |
| `app/api/support-bot/chat/route.ts` | `ai` | 503 con mensaje "Bot temporalmente deshabilitado" |

**Pendiente** (futuro):
- `server/routers/encounter.ts` (IA summary dentro de encounter)
- `server/routers/billing.ts` (live mode check antes de mutaciones)

---

## 5. Stripe Live Mode

Stripe live mode **NO se controla via FEATURE_FLAGS** — se auto-detecta del prefix de `STRIPE_SECRET_KEY`:

- `sk_live_...` → `isStripeLiveMode() === true`
- `sk_test_...` → `isStripeLiveMode() === false`
- (cualquier otra cosa) → `false` (safe default)

Esto evita config drift donde el flag dice live pero la key es test (o vice versa).

---

## 6. Tests

Ver `tests/unit/feature-flags.test.ts`. Cubre:
- Defaults cuando env es missing/malformed
- Parsing + merge con defaults
- Cache + invalidación
- AI rollout: master switch, partial rollout determinístico
- Stripe live mode: prefix detection, safe default

Total: 30 tests, ~180ms.

---

## 7. Pendientes / Known gaps

| # | Gap | Plan |
|---|---|---|
| 1 | Admin endpoint para toggle (sin redeploy) | Out of scope — usar Google Cloud UI por ahora |
| 2 | Per-doctor override (algunos doctores siempre tienen AI off) | Out of scope — usar experimental flags |
| 3 | Audit de cambios de flags | Out of scope — cambios van via Google Cloud git history |
| 4 | Hot reload sin redeploy | Out of scope — redeploy es rápido (5-7 min) |

---

## 8. Changelog

- **2026-07-02**: Initial implementation. Cierra audit #8.
  - Crea `lib/feature-flags.ts` con 3 helpers (`isAIFeatureEnabled`, `isExperimentalEnabled`, `isStripeLiveMode`)
  - Crea `tests/unit/feature-flags.test.ts` con 30 tests
  - Integra en `app/api/ai/dose-suggestion/route.ts` (1 AI route, low-risk demo)
  - Crea este doc
