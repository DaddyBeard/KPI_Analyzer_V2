# KPI Analyzer V2

## Descripción General
**KPI Analyzer V2** es una aplicación CRM offline robusta diseñada para procesar, analizar y visualizar datos de rendimiento de agentes a partir de archivos Excel. Esta herramienta permite a supervisores y gerentes importar grandes volúmenes de datos operativos y transformarlos en dashboards interactivos, fichas de agentes detalladas y reportes exportables, todo ello funcionando localmente en una PC sin necesidad de conexión externa.

## Características Principales
- **Importación Flexible**: Carga de datos desde archivos Excel individuales o carpetas completas.
- **Dashboard Interactivo**: Visualización gráfica del rendimiento general y por equipos.
- **Fichas de Agente**: Perfiles detallados con historial de KPIs, objetivos y planes de acción.
- **Motor de Búsqueda**: Búsqueda rápida y filtrado avanzado de agentes por nombre o ID.
- **Generación de Reportes**: Exportación de análisis e informes en formato PDF.
- **100% Offline**: Privacidad total de datos y funcionamiento sin internet.

## Tecnologías Utilizadas
- **Core**: JavaScript (Vanilla ES6+), HTML5, CSS3.
- **Build Tool**: Vite.
- **Estilos**: Tailwind CSS.
- **Gráficos**: Chart.js.
- **Procesamiento Excel**: SheetJS (xlsx).
- **Reportes PDF**: jsPDF.
- **Iconos**: Lucide.

## Instalación y Configuración

### Prerrequisitos
- [Node.js](https://nodejs.org/) (versión 16 o superior).

### Pasos de Instalación
1.  Clona el repositorio o descarga el código fuente.
2.  Abre una terminal en la carpeta raíz del proyecto.
3.  Instala las dependencias:
    ```bash
    npm install
    ```

### Ejecución en Desarrollo
Para iniciar la aplicación en modo de desarrollo local:
```bash
npm run dev
```
Esto abrirá la aplicación en tu navegador predeterminado (usualmente en `http://localhost:5173`).

### Construcción para Producción
Para generar los archivos optimizados para distribución:
```bash
npm run build
```
Los archivos generados estarán en la carpeta `dist`.

## Uso Básico
1.  **Cargar Datos**: Usa el menú lateral para importar un archivo Excel o una carpeta conteniendo múltiples archivos de datos.
2.  **Navegación**: Usa el sidebar para alternar entre el Dashboard principal, la lista de Agentes y los Reportes.
3.  **Buscar Agente**: Usa la barra de búsqueda superior en el sidebar para encontrar rápidamente un agente específico.
4.  **Ver Detalles**: Haz clic en cualquier agente para abrir su ficha técnica detallada.

## Licencia
Privada / Propietaria.
