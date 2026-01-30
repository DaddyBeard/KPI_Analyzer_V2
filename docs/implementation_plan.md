# Plan de Implementación de Mejoras de Seguridad - KPI Analyzer V2

## Descripción del Problema
La auditoría de seguridad del proyecto ha revelado la existencia de vulnerabilidades de tipo **Cross-Site Scripting (Reflected XSS)** debido a la inyección directa de contenido HTML inseguro (datos provenientes de archivos Excel) en el DOM. Adicionalmente, se detectó el uso de dependencias desactualizadas que podrían comprometer la integridad de la aplicación.

Este plan detalla los pasos para mitigar estos riesgos de forma sistemática y segura, siguiendo las mejores prácticas identificadas en las skills de seguridad consultadas.

## Revisión de Usuario Requerida
> [!IMPORTANT]
> **Aprobación de la Estrategia de Sanitización**: Se propone utilizar `textContent` como mecanismo principal y `DOMPurify` solo donde sea estrictamente necesario renderizar HTML enriquecido. Esta decisión impacta levemente en cómo se muestran ciertos datos si estos contenían formato intencional.

> [!WARNING]
> **Actualización de Librerías**: La actualización de `xlsx` a la versión más reciente puede introducir cambios en la API. Se requiere validar que la lectura de archivos Excel siga funcionando correctamente tras la actualización.

## Cambios Propuestos

### 1. Sanitización y Prevención de XSS
**Componentes Afectados**: `AppShell.js`, `FileSelectionModal.js`, `AgentList.js`, `Sidebar.js`.

*   **Estrategia**: Reemplazar todas las asignaciones a `innerHTML` que utilicen Template Literals con variables no confiables.
    *   **Acción**: Utilizar `document.createElement()` y `node.textContent = value` para la construcción segura del DOM.
    *   **Alternativa**: Implementar una función de utilidad `escapeHTML()` para los casos donde el refactor a `createElement` sea demasiado complejo, o integrar la librería `DOMPurify`.
    *   **Referencia Skill**: `frontend-security-coder` (Safe DOM manipulation).

### 2. Validación de Archivos y Estructura de Datos
**Componentes Afectados**: `DataNormalizer.js`, `excel-reader.js`.

*   **Estrategia**: Fortalecer la validación de entrada antes de procesar los datos.
    *   **Acción**: En `DataNormalizer.js`, implementar comprobaciones de tipo estrictas (e.g., verificar que un ID sea alfanumérico y de longitud esperada, descartar cadenas sospechosas de contener scripts).
    *   **Acción**: En `excel-reader.js`, validar el "Magic Number" o firma del archivo además de la extensión, si es posible en el entorno del navegador, para asegurar que es un archivo Excel válido.
    *   **Referencia Skill**: `backend-security-coder` (Input validation techniques - aplicables aquí a lógica de negocio).

### 3. Actualización de Dependencias
**Componentes Afectados**: `package.json`.

*   **Estrategia**: Eliminar deuda técnica de seguridad.
    *   **Acción**: Actualizar `xlsx` a la última versión estable.
    *   **Acción**: Ejecutar auditoría de `npm` para identificar otras vulnerabilidades en el árbol de dependencias.

### 4. Gestión de Errores Segura
**Componentes Afectados**: Todo el proyecto (Manejo global de excepciones).

*   **Estrategia**: Evitar la fuga de información en logs.
    *   **Acción**: Modificar los bloques `try/catch` para no volcar el objeto de error completo en `console.error` si contiene datos de usuario. Usar mensajes de error genéricos para el usuario final.

## Plan de Verificación

### Pruebas de Seguridad Manuales (Self-Check)
1.  **Prueba de Inyección XSS**: Crear un Excel con un nombre de agente `<img src=x onerror=alert('XSS')>`. Cargar el archivo y verificar que **NO** aparezca la alerta. El texto debe renderizarse literalmente como `<img src=x...`.
2.  **Prueba de Regresión**: Cargar los archivos Excel de prueba actuales y verificar que la aplicación sigue funcionando (tablas, gráficas, reportes) idénticamente a antes.

### Pruebas de Validación
1.  **Archivo Corrupto**: Intentar cargar un archivo de texto renombrado a `.xlsx` y verificar que el sistema lo rechaza o maneja el error sin colapsar la UI.

---

## Análisis de Skills Utilizadas

Para la elaboración de este plan y del informe de auditoría previo, me he basado en las siguientes "Skills" disponibles en su entorno, aplicando sus metodologías:

1.  **frontend-mobile-security-xss-scan**:
    *   **Uso**: Fundamental para identificar los patrones vulnerables de `innerHTML` y las inyecciones en `FileSelectionModal` y `AppShell`.
    *   **Metodología**: Escaneo estático de código buscando "sinks" peligrosos como `innerHTML` combinados con "sources" no confiables (datos del Excel).
2.  **frontend-security-coder**:
    *   **Uso**: Proporcionó las directrices para la solución (usar `textContent`, `DOMPurify`).
    *   **Metodología**: Prácticas de "Safe DOM manipulation" y "Context-aware encoding".
3.  **backend-security-coder**:
    *   **Uso**: Aunque es una app offline, las prácticas de "Input Validation" de esta skill se aplicaron al diseño de `DataNormalizer` para tratar los datos del Excel como "inputs externos" que deben ser validados y tipados estrictamente.
4.  **top-web-vulnerabilities**:
    *   **Uso**: Referencia general para clasificar la severidad del XSS (A03: Injection en OWASP Top 10) y priorizarlo como Crítico/Alto.
