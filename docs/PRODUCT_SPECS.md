# Especificaciones del Producto (GDD/PRD)

## 1. Visión del Producto
**Nombre del Proyecto**: KPI Analyzer V2
**Tipo**: CRM / Dashboard Analítico Offline
**Propósito**: Proveer una herramienta autónoma, rápida y visualmente rica para que supervisores y gerentes de operaciones analicen el rendimiento de sus equipos sin depender de conectividad a servidores centrales o internet.

## 2. Público Objetivo
- **Usuarios Primarios**: Supervisores de Team (Team Leaders), Gerentes de Operaciones.
- **Necesidades**: Acceso rápido a métricas, visualización clara de tendencias, capacidad de drill-down (profundizar) en datos individuales de agentes.

## 3. Alcance Funcional (Scope)

### Fase 1: Core (Implementada)
- [x] Ingesta de datos vía Excel (`.xlsx`).
- [x] Procesamiento de datos local (Client-side).
- [x] Dashboard principal con KPIs agregados.
- [x] Directorio de agentes con búsqueda rápida.
- [x] Perfil de agente detallado (Modal).

### Fase 2: Mejora de Gestión (En Progreso)
- [ ] Edición y guardado de notas de coaching (Persistencia local).
- [ ] Configuración de umbrales de KPI personalizables (Semáforos).
- [ ] Comparativas "Head-to-Head" entre agentes.

### Fase 3: Futuro
- [ ] Persistencia de base de datos local (IndexedDB o SQLite).
- [ ] Módulo de Gamificación (Badges, Rankings visuales).
- [ ] Predicción de tendencias basada en histórico.

## 4. Requisitos No Funcionales
- **Privacidad**: Los datos nunca deben salir del equipo local del usuario.
- **Rendimiento**: Capacidad para procesar archivos de hasta 10,000 registros en menos de 5 segundos.
- **Usabilidad**: Interfaz "Zero-Training"; intuitiva para usuarios familiarizados con Excel pero que prefieren interfaces gráficas.
- **Estética**: Diseño moderno "Glassmorphism", modo oscuro/claro, transiciones suaves.

## 5. Glosario de Términos
- **NCO**: Nivel de Cumplimiento de Objetivos.
- **AHT**: Average Handle Time (Tiempo Promedio de Operación).
- **QA**: Quality Assurance (Calidad).
- **FCR**: First Contact Resolution.
