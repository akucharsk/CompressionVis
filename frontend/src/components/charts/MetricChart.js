// import Menu from "@mui/material/Menu";
import "../../styles/components/charts/MetricChart.css";
// import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import { SketchPicker } from "react-color";
import { BarChart } from '@mui/x-charts/BarChart';

const MetricChart = ({ metricType, idx }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div className="metric-chart-block" key={idx}>
            <h2>{metricType}</h2>
            <div className="metric-chart">
            <BarChart
                xAxis={[
                    {
                    id: 'barCategories',
                    data: ['bar A', 'bar B', 'bar C'],
                    },
                ]}
                series={[
                    {
                    data: [2, 5, 3],
                    },
                ]}
                height={300}
            />
            </div>
        </div>
    )
}

export default MetricChart;