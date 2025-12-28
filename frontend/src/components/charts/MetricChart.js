import "../../styles/components/charts/MetricChart.css";
import { LineChart } from '@mui/x-charts/LineChart';
import { useCharts } from "../../context/ChartsContext";
import { Chart as ChartJS, defaults, layouts } from "chart.js/auto";
import { Bar, Line } from "react-chartjs-2";
import { DEFAULT_COLOR } from "../../utils/constants";


const MetricChart = ({ metricType, idx, tappedCompressions, compressionMetricsMap, framesLength }) => {
    const { compressionMetricState } = useCharts();

    const allValues = tappedCompressions.flatMap(c =>
        compressionMetricsMap[c.id]?.[metricType] ?? []
    );

    const MinY = allValues.length ? Math.min(...allValues) : 0;
    const MaxY = allValues.length ? Math.max(...allValues) : 1;

    defaults.maintainAspectRatio = false;
    defaults.responsive = true;

    const datasets = tappedCompressions.map(c => ({
        label: `Compression ${c.id}`,
        data: compressionMetricsMap[c.id]?.[metricType] ?? [],
        borderColor: compressionMetricState[c.id]?.color ?? DEFAULT_COLOR,
        backgroundColor: compressionMetricState[c.id]?.color
            ? compressionMetricState[c.id].color.replace('1)', '0.2)')
            : DEFAULT_COLOR,
        tension: 0.4, // wygładzona linia
        pointRadius: 0, // brak punktów na linii
    }));

    // Etykiety osi X – numery klatek
    const labels = Array.from({ length: framesLength }, (_, i) => i);

    const contentData = {
        labels,
        datasets
    };

    const axisYData = {
        labels: labels,
        datasets: []        
    }


    const axisOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: false
            }
        },
        scales: {
            x: {
                ticks: {
                    display: false
                },
                grid: {
                    display: false
                }
            },
            y: {
                display: true,
                ticks: {
                    color: "#555"
                },
                grid: {
                    drawOnChartArea: false,
                    drawTicks: false,
                    drawBorder: false
                },
                min: MinY,
                max: MaxY,
                afterFit: (ctx) => {
                    ctx.width = 60
                }
            }
        },
        
    };

    const contentOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: true,
                mode: 'index', // pokazuje najbliższy punkt
                intersect: true, // tooltip przy najbliższym punkcie w osi X
                callbacks: {
                    label: function(context) {
                        const label = context.dataset.label || '';
                        const value = context.formattedValue; // lub context.raw
                        return `${label}: ${value}`;
                    }
                }
            }
        },
        interaction: {
            mode: "index",
            intersect: false
        },
        scales: {
            x: {
                ticks: {
                    callback: (val) => (val === 0 || val === framesLength - 1 || val % 5 === 0 ? val : ""),
                    // display: false
                },
                grid: {
                    drawTicks: false,
                    color: '#404040',
                    borderDash: [3, 3]
                }
            },
            y: {
                ticks: {
                    display: false
                },
                grid: {
                    drawTicks: false,
                    drawBorder: false,
                    color: '#404040',
                    borderDash: [3, 3]
                },
            }
        }
    };


    return (
        <div className="metric-chart-block" key={idx}>
            <h2>{metricType}</h2>
            <div className="metric-chart-top-layout">            
                <div className="metric-chart-inner-layout">
                    <div className="metric-chart-y-axis">
                        <Line 
                            data={axisYData}
                            options={axisOptions}
                        />
                    </div>
                    <div className="metric-chart-scroll">
                        <div className="metric-chart-content" style={{ width: framesLength > 0 ? `${framesLength * 15}px` : "100%" }}>
                            <Line 
                                data={contentData}
                                options={contentOptions}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MetricChart;