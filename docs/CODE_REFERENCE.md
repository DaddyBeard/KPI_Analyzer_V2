# Referencia de Código

Este documento sirve como guía rápida para desarrolladores sobre los componentes y módulos clave del sistema.

## Core

### `src/core/Store.js`
La "fuente de la verdad" de la aplicación.
- **Propósito**: Mantiene el estado global (lista de agentes, filtros activos, configuración).
- **Métodos Principales**:
  - `setData(data)`: Reemplaza todos los datos actuales.
  - `subscribe(listener)`: Permite a otros componentes escuchar cambios.
  - `emitChange()`: Notifica a los suscriptores.

## Layout

### `src/layout/Sidebar.js`
Gestiona la navegación y la búsqueda global.
- **Eventos**:
  - Escucha inputs en `#sidebarSearchInput` para filtrar agentes en tiempo real.
  - Dispara `view-agent-profile` cuando se selecciona un resultado.

### `src/layout/AppShell.js`
El orquestador principal de la interfaz.
- **Responsabilidad**: Inicializa el Sidebar y el Router/Content Manager. Maneja el cambio entre vistas (Dashboard <-> Agentes) basándose en eventos de navegación.

## Features

### `src/features/agents/AgentModal.js`
Controla la ventana emergente de detalles del agente.
- **Arquitectura**: Actúa como contenedor ("Smart Component") que orquesta sub-componentes más pequeños:
  - `AgentSummary.js`: Tarjetas de KPIs.
  - `AgentHistory.js`: Gráficos de tendencias.
  - `AgentAdmin.js`: Datos duros del empleado.

### `src/features/dashboard/Dashboard.js`
La vista principal.
- **Lógica**: Calcula agregados (promedios, sumas) de todos los agentes cargados para mostrar el rendimiento global del equipo.

## Data Pipeline

### `src/data/ExcelParser.js` (Conceptual)
Encargado de transformar la hoja de cálculo cruda en objetos JSON utilizables.
- **Normalización**: Convierte encabezados variados (ej. "N.C.O", "NCO %") a claves internas estándar (`nco`).
- **Sanitización**: Maneja valores nulos, errores de formato ("#N/A") y convierte tipos de datos (strings a números).
