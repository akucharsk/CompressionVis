import "../../styles/components/charts/MetricChart.css";

const MetricChart = ({ metricType }) => {
    return (
        <div className="metric-chart-block">
            <h2>{metricType}</h2>
            <div className="metric-chart">

            </div>
        </div>
    )
}

export default MetricChart;