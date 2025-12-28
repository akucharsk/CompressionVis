import { useCharts } from "../../context/ChartsContext";
import { CompressionMetricsQueries} from "../../hooks/CompressionMetricsQuery";
import MetricChart from "./MetricChart";

const ChartsView = () => {

    const { compressionMetricState, selectedVideoId } = useCharts();
    const tappedCompressions = Object.entries(
            Object.fromEntries(
                Object.entries(compressionMetricState)
                    .filter(([, isTappedValue]) => isTappedValue?.isTapped && isTappedValue?.originalVideoId === selectedVideoId)
            )
        ).map(([key, value]) => ({
            id: key,
            ...value
    }));

    console.log(compressionMetricState)

    const metrics = [
        "VMAF",
        "PSNR",
        "SSIM",
        "Size"
    ]

    const compressionIds = tappedCompressions.map(compression => compression.id);
    const compressionQueries = CompressionMetricsQueries(compressionIds);

    const compressionMetricsMap = Object.fromEntries(
        compressionQueries
            .map((query, index) => {
            if (!query.data?.metrics) return null;

            const compressionId = compressionIds[index];
            return [compressionId, query.data.metrics];
            })
            .filter(Boolean)
    );

    const framesLength = compressionQueries.find(q => q.data?.metrics)?.data.metrics.Size.length ?? 0;


    return (
        <div className="charts-view">
            
            {metrics.map((metricType, idx) => (
                <MetricChart 
                    metricType={metricType}
                    key={idx}
                    tappedCompressions={tappedCompressions}
                    compressionMetricsMap={compressionMetricsMap}
                    framesLength={framesLength}
                />      
            ))}
        </div>
    );
}

export default ChartsView;