# Memory Bank - Índice Maestro

Bienvenido a la tabla de contenidos maestra del repositorio **[[MedSysVE]]**. Esta carpeta actúa como la memoria persistente del estado arquitectónico, contexto de desarrollo y decisiones de producto del sistema.

## Documentos Principales

- **[[activeContext]]**: Resumen del estado más reciente de desarrollo, features desplegados (como las especialidades de Psiquiatría e Infectología) y arquitectura operativa activa.
- **[[PROJECT_STATUS]]**: Definición del esquema, fases implementadas y variables de entorno del proyecto.
- **[[SISTEMA]]**: Descripción funcional del sistema completo, enfocado en las reglas de dominio multi-tenant y roles.
- **[[RUNBOOK]]**: Protocolos operativos de emergencia, restauraciones, despliegues y resolución de problemas.

## Integración con Graphify

Para una exploración visual de nodos de código y dependencias a través de AST estáticos (Abstract Syntax Trees), te recomendamos consultar directamente:
- **[[graphify-out/GRAPH_REPORT]]**: Un análisis jerárquico actualizado sobre las ramas del frontend, el backend en tRPC, capas de base de datos e interconexiones de los archivos clave. 
- Puedes generar un grafo semántico de un flujo ejecutando `graphify query "tu pregunta"`.

## Flujos Destacados
1. **[[EncounterWorkspace]]**: Núcleo del espacio de trabajo clínico donde se montan formularios según el rol, como **[[PsiquiatriaForm]]** o **[[InfectologiaForm]]**.
2. **Sistema Multi-Tenant**: Gestión cruzada de clínicas mediante `workspaceId`.
3. **Manejo de Pacientes y Referidos**: Flujos complejos de _Merge_ para historias clínicas.
