// import Menu from "@mui/material/Menu";
import "../../styles/components/charts/MetricChart.css";
// import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import { SketchPicker } from "react-color";
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { useCharts } from "../../context/ChartsContext";


const MetricChart = ({ metricType, idx, tappedCompressions, compressionMetricsMap }) => {
    // const [anchorEl, setAnchorEl] = useState(null);
    // const open = Boolean(anchorEl);
    // const handleClick = (event) => {
    //     setAnchorEl(event.currentTarget);
    // };
    // const handleClose = () => {
    //     setAnchorEl(null);
    // };

    // const { compressionMetricState } = useCharts();

    // const xAxis = [
    //     {
    //         // dataKey: 'date',
    //         // scaleType: 'time',
    //         // valueFormatter: dateAxisFormatter,
    //         data: ['bar A', 'bar B', 'bar C', 'bar D', 'bar E', 'bar F', 'bar G', 'bar H', 'bar I']
    //     },
    //     ];

    //     // const yAxis = [
    //     // {
    //     //     valueFormatter: percentageFormatter,
    //     // },
    //     // ];

    //     const series = [
    //     {
    //         // dataKey: 'rate',
    //         // showMark: false,
    //         // valueFormatter: percentageFormatter,
    //         data: [1,2,3,4,5,6,7,8,9]
    //     },
    // ];

    const series = tappedCompressions.map(c => ({
        label: `Compression ${c.id}`,
        data: compressionMetricsMap[c.id]?.[metricType] ?? [],
    }));

    return (
        <div className="metric-chart-block" key={idx}>
            <h2>{metricType}</h2>
            {tappedCompressions.map((video) => (
                <div
                    key={video.id}
                    style={{ color: video.color }}
                >
                    Compression {video.id} – {video.color}
                </div>
            ))}
            <div className="metric-chart">
            {/* <BarChart
                xAxis={[
                    {
                    id: 'barCategories',
                    data: ['bar A', 'bar B', 'bar C', 'bar D', 'bar E', 'bar F', 'bar G', 'bar H', 'bar I'],
                    },
                ]}
                series={[
                    {
                    data: [2, 5, 3],
                    },
                ]}
                height={300}
            /> */}
            
            
            <LineChart
                series={series}
                height={300}
            />


            
            {/* <LineChart
                // dataset={usUnemploymentRate}
                xAxis={xAxis}
                // yAxis={yAxis}
                series={series}
                height={300}
                grid={{ vertical: true, horizontal: true }}
            /> */}
            

            </div>
        </div>
    )
}

export default MetricChart;