# Auditoría de Seguridad - KPI Analyzer V2

**Fecha:** 30 de Enero de 2026
**Auditor:** Antigravity (Google Deepmind)
**Proyecto:** KPI Analyzer V2
**Tipo:** Aplicación Web Local (Offline)

---

## 1. Resumen Ejecutivo

El análisis de seguridad del proyecto **KPI Analyzer V2** ha revelado vulnerabilidades de **Severidad Alta**, principalmente relacionadas con la inyección de contenido no confiable (datos provenientes de Excel) directamente en el DOM (Document Object Model) del navegador. Esto expone la aplicación a ataques de tipo **Cross-Site Scripting (Reflected XSS)**.

Dado que la aplicación procesa datos sensibles de gestión y RRHH (DNI, Nombres, Correos, Métricas de Desempeño), es imperativo corregir el manejo de la renderización de datos para evitar la ejecución arbitraria de código JavaScript si un usuario carga un archivo Excel manipulado maliciosamente.

**Puntuación de Seguridad Actual:** ⚠️ **C- (Riesgo Alto)**
*La puntuación se ve afectada drásticamente por la presencia de XSS generalizado en componentes principales.*

---

## 2. Hallazgos y Vulnerabilidades

### 2.1 Validación de Datos y Prevención de XSS

> [!CAUTION]
> **Vulnerabilidad Crítica: DOM-based XSS (Cross Site Scripting)**

*   **Ubicación**: `src/layout/AppShell.js`, `src/features/data-loader/FileSelectionModal.js`, `src/features/agents/components/AgentList.js`
*   **Descripción**: La aplicación utiliza frecuentemente `element.innerHTML = ...` interpolando variables directamente dentro de cadenas de texto (Template Literals). Los datos provenientes de los archivos Excel (Nombres de Agentes, ID, Nombres de Archivos) no son sanitizados antes de ser insertados.
*   **Impacto**: Un atacante podría crear un archivo Excel donde el nombre de un agente sea `<img src=x onerror=alert(1)>`. Al cargar este archivo, el script se ejecutaría inmediatamente en el navegador de la víctima, permitiendo robo de sesión (si existiera), exfiltración de los datos cargados en memoria o redirecciones maliciosas.
*   **Código Vulnerable (Ejemplo en `AppShell.js`)**:
    ```javascript
    // AppShell.js línea 424
    ${tms.map(tm => `<option value="${tm}" ...>${tm}</option>`).join('')}
    ```
    Si `tm` contiene caracteres HTML especiales, se rompe la etiqueta o se inyecta script.
*   **Solución Recomendada**:
    1.  Usar `document.createElement` y `textContent` para asignar valores de texto inseguros.
    2.  Si se debe usar HTML string, utilizar una librería de sanitización verificada como **DOMPurify**.

### 2.2 Dependencias y Librerías

> [!WARNING]
> **Dependencia con Vulnerabilidades Potenciales: SheetJS (xlsx)**

*   **Ubicación**: `package.json`
*   **Descripción**: Se está utilizando la versión `^0.18.5` de `xlsx`. Versiones antiguas de procesadores de Excel pueden sufrir de vulnerabilidades de "Prototype Pollution" o denegación de servicio (DoS) ante archivos específicamente formados.
*   **Recomendación**: Actualizar a la última versión estable (0.20.+) o considerar alternativas si el mantenimiento de la librería comunitaria es discontinuo.
*   **Acción**: Ejecutar `npm audit` para verificar CVEs específicos conocidos.

### 2.3 Manejo de Errores y Logging

> [!NOTE]
> **Exposición de Errores en Consola**

*   **Ubicación**: `src/layout/AppShell.js` (catch blocks)
*   **Descripción**: `console.error(error)` vuelca el objeto de error completo. Si el error contiene fragmentos de datos sensibles analizados, estos quedan persistentes en la consola del navegador.
*   **Recomendación**: En producción, evitar loguear objetos de datos crudos. Loguear mensajes genéricos o códigos de error.

### 2.4 Gestión de Archivos

*   **Estado**: ✅ Aceptable para entorno local.
*   **Observación**: La lectura de archivos se realiza mediante `FileReader` en el cliente. No se suben archivos a un servidor, lo cual elimina riesgos de "Remote Code Execution" (RCE) en servidor o "Path Traversal".
*   **Mejora**: Validar estrictamente el "MIME type" además de la extensión del archivo, aunque en JS cliente la confianza recae en lo que el navegador reporta.

---

## 3. Plan de Acción Priorizado

### Prioridad 1: Sanitización Inmediata (URGENTE)
Modificar todos los puntos donde se inyectan variables en el HTML.
**Ejemplo de Corrección Sencilla (Escapado Básico):**

Crea una utilidad en `src/shared/utils.js`:
```javascript
export function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
```

Y úsala en tus templates:
```javascript
import { escapeHTML } from '../shared/utils.js';
...
${tms.map(tm => `<option value="${escapeHTML(tm)}">${escapeHTML(tm)}</option>`).join('')}
```

### Prioridad 2: Validación de Estructura Excel
En `DataNormalizer.js`, asegurar que los campos críticos (IDs, métricas) sean del tipo esperado antes de procesarlos, descartando valores que parezcan código o sean excesivamente largos.

### Prioridad 3: Actualización de Stack
1.  Actualizar `xlsx`: `npm install xlsx@latest`
2.  Revisar `chart.js` y `lucide`.

---

## 4. Mejores Prácticas de Privacidad (RGPD)

Al ser una herramienta "Offline" que maneja datos de desempeño y RRHH:
1.  **Principio de Minimización**: La aplicación ya procesa solo lo que se le "alimenta". Asegurar que no persista datos en `localStorage` o `IndexedDB` sin encriptación, para evitar que otro usuario del mismo PC acceda a datos de una sesión anterior.
    *   *Estado Actual*: Parece que los datos viven solo en memoria (RAM) durante la sesión (`Store.js`). Esto es **bueno** para la seguridad en PCs compartidos, siempre que se cierre la pestaña.
2.  **Limpieza de Sesión**: Implementar un botón de "Cerrar Sesión" o "Limpiar Datos" que explícitamente vacíe el `Store` y fuerce un refresco, dando tranquilidad al usuario de que los datos se han descartado.

---

## 5. Conclusión

El proyecto tiene una arquitectura base sólida para una herramienta local, pero su dependencia de `innerHTML` para el renderizado de UI lo hace frágil ante datos maliciosos. La corrección de las inyecciones de HTML es la única barrera necesaria para elevar el nivel de seguridad a "Aceptable" para un entorno de producción interno.
