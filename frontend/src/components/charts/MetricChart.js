import "../../styles/components/charts/MetricChart.css";
import { LineChart } from '@mui/x-charts/LineChart';
import { useCharts } from "../../context/ChartsContext";
import { Chart as ChartJS, defaults } from "chart.js/auto";
import { Bar, Line } from "react-chartjs-2";


const MetricChart = ({ metricType, idx, tappedCompressions, compressionMetricsMap, framesLength }) => {
    const { compressionMetricState } = useCharts();

    // const series = tappedCompressions.map(c => ({
    //     label: `Compression ${c.id}`,
    //     data: compressionMetricsMap[c.id]?.[metricType] ?? [],
    //     color: compressionMetricState[c.id]?.color,
    //     showMark: false
    // }));

    // const xAxisData = Array.from(
    //     { length: framesLength },
    //     (_, i) => i
    // );

    // const labels = tappedCompressions.map(compressionId => (
    //     `Compression ${compressionId}`
    // ))

    defaults.maintainAspectRatio = false;
    defaults.responsive = true;

    const datasets = tappedCompressions.map(c => ({
        label: `Compression ${c.id}`,
        data: compressionMetricsMap[c.id]?.[metricType] ?? [],
        borderColor: compressionMetricState[c.id]?.color ?? 'rgba(75,192,192,1)',
        backgroundColor: compressionMetricState[c.id]?.color
            ? compressionMetricState[c.id].color.replace('1)', '0.2)')
            : 'rgba(75,192,192,0.2)',
        tension: 0.4, // wygładzona linia
        pointRadius: 0, // brak punktów na linii
    }));

    // Etykiety osi X – numery klatek
    const labels = Array.from({ length: framesLength }, (_, i) => i);

    const data = {
        labels,
        datasets
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: true,
                mode: 'nearest', // pokazuje najbliższy punkt
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
        scales: {
            x: {
                ticks: {
                    callback: (val) => (val === 0 || val === framesLength - 1 || val % 5 === 0 ? val : "")
                },
                grid: {
                    color: '#555',
                    borderDash: [3, 3]
                }
            },
            y: {
                grid: {
                    color: '#555',
                    borderDash: [3, 3]
                }
            }
        }
    };


    return (
        <div className="metric-chart-block" key={idx}>
            <h2>{metricType}</h2>
            <div className="metric-chart-top-layout">            
                <div className="metric-chart-inner-layout" style={{ width: framesLength > 0 ? `${framesLength * 15}px` : "100%" }}>
                    {/* <LineChart
                        height={300}
                        series={series}
                        grid={{ vertical: true, horizontal: true }}
                        xAxis={[
                            {
                                data: xAxisData,
                                valueFormatter: (value) =>
                                    value === 0 ||
                                    value === framesLength - 1 ||
                                    value % 5 === 0
                                        ? String(value)
                                        : "",
                            },
                        ]}
                        sx={{
                            '& .MuiChartsAxis-root': {
                                color: '#fff',
                            },
                            '& .MuiChartsAxis-line': {
                                stroke: '#fff',
                            },
                            '& .MuiChartsAxis-tick': {
                                stroke: '#fff',
                            },
                            '& .MuiChartsAxis-tickLabel': {
                                fill: '#fff',
                                fontSize: 11,
                            },
                            '& .MuiChartsGrid-line': {
                                stroke: '#555',
                                strokeDasharray: '3 3',
                            },
                        }}
                        hideLegend={true}
                    /> */}
                    <Line 
                        data={data}
                        options={options}
                    />
                </div>
            </div>
            <div className="chart-container">
            {/* <h2 style={{ textAlign: "center" }}>Bar Chart</h2> */}
            {/* <Bar
                data={{
                    labels: ["A", "B"],
                    datasets: [
                        {
                            label: "Rev",
                            data: [200, 100, 250]
                        },
                        {
                            label: "Rev2",
                            data: [201, 101, 240]
                        }
                    ]
                }}
                options={{
                plugins: {
                    title: {
                    display: true,
                    text: "Users Gained between 2016-2020"
                    },
                    legend: {
                    display: false
                    }
                }
                }}
            /> */}
            
            </div>
        </div>
    )
}

export default MetricChart;