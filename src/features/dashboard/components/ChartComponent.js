
import Chart from 'chart.js/auto';

export class ChartComponent {
    constructor() {
        this.chartInstance = null;
    }

    /**
     * Renders a chart into a container
     * @param {HTMLElement} container - Target element
     * @param {Object} config - Chart.js configuration object
     */
    render(container, config) {
        if (!container) return;

        // Destroy existing chart if any
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        // Create Canvas
        container.innerHTML = '';
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);

        // Render Chart
        this.chartInstance = new Chart(canvas, {
            ...config,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                ...config.options
            }
        });

        return this.chartInstance;
    }

    destroy() {
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
    }
}
