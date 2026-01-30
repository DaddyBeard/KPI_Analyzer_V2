# Changelog (Historial de Cambios)

Todas las modificaciones notables de este proyecto serán documentadas en este archivo.

## [2.0.0] - 2026-01-30

### Añadido
- **Arquitectura Modular**: Refactorización completa del código base a una estructura modular basada en características (`src/features`).
- **Sidebar Dinámico**: Nuevo menú lateral colapsable con búsqueda integrada en tiempo real.
- **Búsqueda Avanzada**: Capacidad de buscar agentes por nombre, ID o login de sistema.
- **Modal de Agente V2**: Nueva ficha de agente con pestañas organizadas (Resumen, Historial, Admin).
- **Sistema de Objetivos**: Visualización de cumplimiento vs. objetivos.
- **Documentación**: Suite completa de documentación técnica y de usuario.

### Cambiado
- Migración de HTML estático/jQuery a **Vanilla JS Moderno (ES6 Modules)**.
- Actualización de estilos a **Tailwind CSS** para un diseño más limpio y responsivo.
- Sistema de gráficos actualizado a **Chart.js v4**.

### Corregido
- Solucionados problemas de rendimiento al cargar archivos Excel grandes (>50MB).
- Corregidos errores de renderizado en monitores de baja resolución.
