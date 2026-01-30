# Guía de Contribución

Gracias por tu interés en mejorar **KPI Analyzer V2**. Esta guía establece las normas para asegurar la calidad y consistencia del proyecto.

## 1. Normas de Localización e Idioma (CRÍTICO)
Para mantener la coherencia y facilitar el mantenimiento por parte del equipo hispanohablante, es imperativo seguir estas reglas:

> [!IMPORTANT]
> **ESPAÑOL OBLIGATORIO**
> *   **Código y Comentarios**: Todos los comentarios dentro del código (inline, bloques, JSDoc) deben escribirse estrictamente en **español**.
> *   **Commits y PRs**: Los mensajes de commit y las descripciones de Pull Requests deben estar en español.
> *   **Interfaz de Usuario**: Todos los textos visibles para el usuario final deben estar en español neutro.
> *   **Logs y Errores**: Los `console.log`, `console.error` y mensajes de excepción deben redactarse en español.

**Ejemplo Correcto:**
```javascript
/**
 * Calcula el promedio de ventas por agente.
 * @param {Array} ventas - Lista de transacciones.
 * @returns {number} El promedio calculado.
 */
function calcularPromedio(ventas) {
    if (!ventas) {
        console.error("Error: No se proporcionaron datos de ventas.");
        return 0;
    }
    // ...
}
```

**Ejemplo Incorrecto (NO USAR):**
```javascript
// Calculate average sales
function calculateAverage(sales) {
    // Error handling
    console.error("No data provided");
}
```

## 2. Flujo de Trabajo
1.  Haz un **Fork** del repositorio.
2.  Crea una rama para tu funcionalidad (`git checkout -b feature/nueva-funcionalidad`).
3.  Desarrolla siguiendo los estilos de código (Vanilla JS, Clases).
4.  Haz **Commit** de tus cambios (`git commit -m "Agrega nueva vista de reporte"`).
5.  Haz **Push** a la rama (`git push origin feature/nueva-funcionalidad`).
6.  Abre un **Pull Request**.

## 3. Estándares de Código
- **Estilo**: Usamos JavaScript moderno (ES6+). Evita `var`, usa `const` y `let`.
- **Componentes**: Cada componente debe ser una clase con su propio archivo.
- **CSS**: Priorizamos Tailwind CSS. Usa CSS personalizado solo cuando Tailwind no sea suficiente (y colócalo en `src/styles`).
- **Nombres**:
  - Clases: `PascalCase` (ej. `AgenteModal`).
  - Funciones/Variables: `camelCase` (ej. `calcularTotal`).
  - Constantes: `UPPER_SNAKE_CASE` (ej. `MAX_ITEMS`).

## 4. Reporte de Bugs
Si encuentras un error, abre un issue describiendo:
- Pasos para reproducirlo.
- Comportamiento esperado.
- Comportamiento real.
- Capturas de pantalla (si aplica).
