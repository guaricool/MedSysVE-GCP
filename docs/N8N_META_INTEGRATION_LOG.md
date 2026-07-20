# Bitácora de Integración: n8n + Meta (Instagram/WhatsApp) 🤖

**Fecha:** 30 de Junio de 2026
**Objetivo:** Integrar la aplicación MedSysVE (Meta Developers) con n8n para crear un Asistente de IA (Bot) capaz de responder automáticamente a los clientes.

---

## ✅ Lo que SÍ hemos logrado (Hitos Completados)

1. **Configuración de la App en Meta Developers:**
   - Se configuró exitosamente la aplicación "MedSysVE" en el panel de Meta.
   - Se activó la suscripción a los Webhooks para capturar eventos de mensajería (campo `messages`).

2. **Resolución del Bloqueo de Cuentas Evaluadoras (Testers):**
   - **El Problema:** Meta bloqueaba silenciosamente los mensajes de prueba enviados desde la cuenta `@guaricool` hacia `@medsysve` por estrictas políticas de Modo Desarrollo.
   - **La Solución:** Logramos saltarnos la restricción de "Cuenta de Desarrollador requerida" invitando formalmente a la cuenta personal desde los *Roles de la App*, y aceptando la invitación directamente en la app de Instagram desde el celular (*Website Permissions -> Tester Invites*).
   - *Nota de aprendizaje:* Meta no permite agregar cuentas "Personales" de Instagram como evaluadores de webhooks sin errores. Requiere que las cuentas estén configuradas como "Profesional" o "Creador".

3. **Diagnóstico y Corrección del Enrutamiento del Webhook en n8n:**
   - **El Problema:** Meta marcaba la conexión como "Exitosa", pero los mensajes nunca se mostraban en el lienzo de n8n.
   - **El Diagnóstico (vía consola del Cloud Run):** Al revisar los logs de n8n, descubrimos el error `Received request for unknown webhook`. Esto ocurría porque en Meta se había registrado la **URL de Producción** (`/webhook/`), pero como el flujo de trabajo en n8n estaba "Inactivo", n8n rechazaba las peticiones por seguridad.
   - **La Solución:** Migramos el endpoint a la **Test URL** (`/webhook-test/`).

4. **Instalación y Preconfiguración del "Facebook Trigger" (vía API):**
   - Se reemplazó el nodo genérico `Webhook` por el nodo nativo `Facebook Trigger`.
   - **¿Por qué?** El nodo genérico causaba un conflicto metodológico: Meta exige un `GET` para validar la URL (el *hub.challenge*), pero los mensajes entran por `POST`. El nodo genérico obligaba a cambiar manualmente de GET a POST perdiendo la conexión. El nodo `Facebook Trigger` maneja ambos métodos simultáneamente bajo el capó.
   - *Estado actual:* El nodo está inyectado en el flujo `x2XedEvv7vi3HgiK` con el token secreto `medsysve_secreto_123`, escuchando el objeto `instagram` y el campo `messages`.

---

## ❌ Lo que NO hemos podido lograr (Limitaciones y Obstáculos)

1. **Validación del nodo genérico (Webhook) en un solo paso:**
   - No logramos usar un simple nodo genérico `Webhook` porque la plataforma de Meta Developers es inflexible con el requerimiento del método `GET` para guardar la suscripción. Nos forzó a abandonar ese enfoque y pasar al ecosistema de credenciales estrictas de n8n (Facebook Trigger).

2. **Vincular la cuenta personal sin volverla Profesional:**
   - No pudimos saltarnos el error rojo de Meta ("Form cannot be saved") al agregar a `@guaricool` como tester mientras la cuenta era personal. Meta nos obligó a realizar la vinculación estricta en el "Centro de Cuentas" del celular y/o pasarla a profesional para reconocer que el dueño de la app y el dueño del Instagram eran la misma persona.

3. **Conexión final de credenciales desde consola:**
   - No pude insertar automáticamente el `App ID` y el `App Secret` en el nodo de n8n a través de la API, ya que n8n v1.0+ requiere que estos secretos se guarden como una "Credencial" encriptada en la base de datos (y no como texto plano en el JSON del flujo). El usuario debe hacer este último paso manualmente en la UI.

4. **Implementación de la Inteligencia Artificial (Pendiente):**
   - No hemos logrado conectar a OpenAI (ChatGPT) o Anthropic (Claude) porque la sesión se detuvo justo antes de este paso, priorizando la estabilización de la conexión cruda entre Meta y n8n.

---

## 🚀 Próximos Pasos Exactos (Next Steps)

1. El usuario debe crear la credencial de **Facebook Graph API** dentro del nodo `Facebook Trigger` en n8n, pegando su *App ID* y *App Secret*.
2. El usuario debe pegar la Test URL generada por el nodo en Meta Developers junto con el token `medsysve_secreto_123`.
3. Una vez se reciba el primer "Hola" en n8n, se procederá a:
   - Crear una cuenta en OpenAI / Anthropic.
   - Agregar el nodo `Basic LLM Chain` (o un Agente de IA avanzado) en n8n.
   - Agregar el nodo de respuesta (Meta Graph API) para devolver el texto generado al paciente.

