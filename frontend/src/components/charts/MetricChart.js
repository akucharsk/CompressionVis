// import Menu from "@mui/material/Menu";
import "../../styles/components/charts/MetricChart.css";
// import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import { SketchPicker } from "react-color";
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { useCharts } from "../../context/ChartsContext";


const MetricChart = ({ metricType, idx, tappedCompressions, compressionMetricsMap, framesLength }) => {
    const { compressionMetricState } = useCharts();

    const series = tappedCompressions.map(c => ({
        label: `Compression ${c.id}`,
        data: compressionMetricsMap[c.id]?.[metricType] ?? [],
        color: compressionMetricState[c.id]?.color,
        showMark: false
    }));

    const xAxisData = Array.from(
        { length: framesLength },
        (_, i) => i
    );


    return (
        <div className="metric-chart-block" key={idx}>
            <h2>{metricType}</h2>
            {/* {tappedCompressions.map((video) => (
                <div
                    key={video.id}
                    style={{ color: video.color }}
                >
                    Compression {video.id} – {video.color}
                </div>
            ))} */}
            <div className="metric-chart-top-layout">            
                <div className="metric-chart-inner-layout" style={{ width: framesLength > 0 ? `${framesLength * 15}px` : "100%" }}>
                    <LineChart
                        height={300}
                        series={series}
                        grid={{ vertical: true, horizontal: true }}
                        xAxis={[
                            {
                                data: xAxisData,
                                valueFormatter: (value) =>
                                    value === 0 ||
                                    value === framesLength - 1 ||
                                    value % 50 === 0
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
                    />
                </div>
            </div>
        </div>
    )
}

export default MetricChart;