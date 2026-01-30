# Documentación Técnica - KPI Analyzer V2

## 1. Arquitectura del Sistema
El proyecto sigue una arquitectura de **Monolito Modular Frontend** basada en componentes (clases de JavaScript) sin uso de frameworks reactivos pesados como React o Vue, pero utilizando prácticas modernas de desarrollo.

### Principios de Diseño
- **Vanilla JS Moderno**: Uso de clases ES6+, Módulos (ESM) y Custom Events para la gestión del estado y comunicación.
- **Event-Driven Architecture (EDA)**: Los componentes se comunican principalmente a través de eventos personalizados (`window.dispatchEvent` y `addEventListener`), reduciendo el acoplamiento directo.
- **Separación de Responsabilidades**: 
  - `src/core`: Lógica de negocio pura y gestión de estado.
  - `src/features`: Módulos funcionales (Agentes, Dashboard, etc.).
  - `src/layout`: Estructura base de la UI (Sidebar, AppShell).
  - `src/data`: Manejo y transformación de datos brutos.

## 2. Estructura de Directorios
```
src/
├── config/         # Configuraciones globales
├── core/           # Lógica central (Store, EventBus)
├── data/           # Lógica de procesamiento de datos (Parsers Excel)
├── features/       # Módulos funcionales
│   ├── agents/     # Gestión de agentes (Listas, Modales, Fichas)
│   ├── dashboard/  # Vistas principales y gráficos resumen
│   ├── reports/    # Generación de PDFs y exportaciones
│   └── settings/   # Configuración de usuario
├── layout/         # Componentes estructurales (Sidebar, Layout principal)
├── styles/         # Estilos CSS y configuración Tailwind
└── main.js         # Punto de entrada de la aplicación
```

## 3. Flujo de Datos
1.  **Ingesta**: El usuario selecciona un archivo Excel (`Sidebar.js`).
2.  **Procesamiento**: `SheetJS` lee el binario y los parsers en `src/data` normalizan la estructura (JSON).
3.  **Almacenamiento**: Los datos procesados se guardan en el `Store` global (`src/core/Store.js`).
4.  **Reactividad**: El `Store` emite un evento de "datos actualizados".
5.  **Renderizado**: Los componentes suscritos (Dashboard, Listas) escuchan el evento y se repintan con la nueva información.

## 4. Stack Tecnológico Detallado

| Categoría | Tecnología | Propósito |
|-----------|------------|-----------|
| **Lenguaje** | JavaScript (ES6+) | Lógica principal de la aplicación. |
| **Bundler** | Vite | Servidor de desarrollo rápido y optimización de build. |
| **CSS** | Tailwind CSS | Estilizado utilitario rápido y consistente. |
| **Iconos** | Lucide | Librería de iconos ligera y moderna. |
| **Visualización** | Chart.js | Gráficos de rendimiento (Barras, Líneas, Radar). |
| **Datos** | SheetJS (xlsx) | Lectura y parsing de archivos Excel (.xlsx, .xls). |
| **PDF** | jsPDF / AutoTable | Generación de reportes imprimibles. |

## 5. APIs Internas Clave

### `Store` (Gestión de Estado)
Centraliza los datos de los agentes cargados.
- `getAllData()`: Retorna todos los agentes.
- `getAgentById(id)`: Busca un agente específico.
- `updateData(newData)`: Actualiza el estado y notifica a la app.

### Eventos Globales
- `navigate`: Cambio de vista principal (Dashboard <-> Agentes).
- `file-selected`: Usuario ha cargado un nuevo archivo.
- `view-agent-profile`: Solicitud para abrir el modal de un agente.

## 6. Consideraciones de Desarrollo
- El proyecto no utiliza Babel ni transpilación pesada, confiando en el soporte moderno de navegadores (ES Modules).
- El sistema es **100% Client-Side**. No hay base de datos backend; la persistencia es temporal (memoria) o vía recarga de archivos.
