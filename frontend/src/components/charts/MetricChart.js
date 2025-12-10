// import Menu from "@mui/material/Menu";
import "../../styles/components/charts/MetricChart.css";
// import MenuItem from "@mui/material/MenuItem";
import { useState } from "react";
import { SketchPicker } from "react-color";

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
            {/*    no co jest
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                // onClose={handleClose}
                slotProps={{
                list: {
                    'aria-labelledby': 'basic-button',
                },
                }}
            >
                {/* <MenuItem onClick={handleClose}>Profile</MenuItem>
                <MenuItem onClick={handleClose}>My account</MenuItem>
                <MenuItem onClick={handleClose}>Logout</MenuItem> */}
                {/* <MenuItem ><SketchPicker /></MenuItem>
            </Menu> */}
            </div>
        </div>
    )
}

export default MetricChart;