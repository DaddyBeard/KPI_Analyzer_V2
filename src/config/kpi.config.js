export const KPI_CONFIG = [
    {
        key: 'gestH',
        label: 'GEST/H',
        type: 'min',
        target: 2.5,
        icon: 'zap',
        description: 'Expedientes gestionados por hora',
        secondaryKey: 'gestTotal',
        secondaryLabel: 'Total'
    },
    {
        key: 'cerrH',
        label: 'CERR/H',
        type: 'min',
        target: 1.8,
        icon: 'check-circle',
        description: 'Expedientes cerrados por hora',
        secondaryKey: 'cerrTotal',
        secondaryLabel: 'Total'
    },
    {
        key: 'ncoBO',
        label: 'NCO BO%',
        type: 'min',
        target: 85,
        isPercent: true,
        icon: 'shield-check',
        description: 'Nivel calidad objetiva BackOffice'
    },
    {
        key: 'aht',
        label: 'AHT',
        type: 'max',
        target: 340,
        icon: 'clock',
        description: 'Tiempo medio de operación (segundos)',
        secondaryKey: 'calls',
        secondaryLabel: 'Llamadas'
    },
    {
        key: 'tipif',
        label: 'TIPIF %',
        type: 'min',
        target: 90,
        isPercent: true,
        icon: 'list',
        description: 'Porcentaje de tipificación correcta'
    },
    {
        key: 'transfer',
        label: 'TRANS %',
        type: 'max',
        target: 15,
        isPercent: true,
        icon: 'arrow-right-circle',
        description: 'Porcentaje de transferencias'
    },
    {
        key: 'nps',
        label: 'NPS',
        type: 'min',
        target: 30,
        icon: 'smile',
        description: 'Net Promoter Score'
    },
    {
        key: 'ncp',
        label: 'NCP',
        type: 'min',
        target: 9,
        icon: 'alert-triangle',
        description: 'No Conformidad de Proceso'
    },
    {
        key: 'ncoCall',
        label: 'NCO LLAM%',
        type: 'min',
        target: 85,
        isPercent: true,
        icon: 'phone',
        description: 'Nivel calidad objetiva Llamadas',
        secondaryKey: 'calls',
        secondaryLabel: 'Llamadas'
    }
];
