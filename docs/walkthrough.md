# Walkthrough: Mejoras de Seguridad KPI Analyzer V2

## Resumen Ejecutivo
Se ha realizado una intervención de seguridad centrada en cerrar vulnerabilidades críticas de **Cross-Site Scripting (XSS)** y fortalecer la validación de datos de entrada. La aplicación es ahora robusta frente a intentos de inyección de código a través de nombres de archivos o contenidos de Excel maliciosos.

## Cambios Realizados

### 1. Sanitización de UI (Prevención de XSS)
*   **Nueva Utilidad**: Se creó `src/shared/utils.js` con la función `escapeHTML`.
*   **AppShell.js**: Se implementó `escapeHTML` en los selectores de "Team Manager" y "Segmentos". Esto evita que un nombre de equipo malicioso ejecute scripts en el navegador.
*   **FileSelectionModal.js**: Se sanitizaron los nombres de los archivos mostrados en la lista de selección.

### 2. Validación de Datos (Data Normalizer)
*   **Validación Estricta**: Se modificó `DataNormalizer.js` para incluir las funciones `validateString` y `validateID`.
*   **Bloqueo de Scripts**: Cualquier dato proveniente del Excel que contenga etiquetas HTML sospechosas (`<...>`) es ahora bloqueado automáticamente, reemplazándose por `[CONTENIDO BLOQUEADO]` o `null`.

### 3. Gestión de Errores y Dependencias
*   **Logs Limpios**: Se ajustaron los `try/catch` para evitar volcar información sensible en la consola del navegador.
*   **Dependencias**: Se actualizó `xlsx` a la última versión disponible (`latest`). Se ejecutó `npm audit fix` para resolver vulnerabilidades menores automáticas.
    *   *Nota*: Persisten algunas advertencias de auditoría en librerías de desarrollo que no afectan la seguridad en tiempo de ejecución de la app offline.

## Verificación

### Cómo verificar las correcciones
1.  **Prueba XSS**:
    *   Renombra un archivo Excel a `<h1>HACKED</h1>.xlsx` (o similar, dependiendo de lo que permita el OS).
    *   Cárgalo en la aplicación.
    *   **Resultado Esperado**: En la lista de selección, verás literalmente `<h1>HACKED</h1>.xlsx` como texto plano, NO un encabezado gigante renderizado.
2.  **Prueba de Funcionalidad**:
    *   Carga los archivos Excel de producción habituales.
    *   Verifica que los KPIs, gráficos y tablas se generan correctamente. La validación añadida es transparente para datos legítimos.

## Archivos Modificados
*   `src/shared/utils.js` (Nuevo)
*   `src/layout/AppShell.js`
*   `src/features/data-loader/FileSelectionModal.js`
*   `src/features/data-loader/DataNormalizer.js`
*   `package.json` / `package-lock.json`
