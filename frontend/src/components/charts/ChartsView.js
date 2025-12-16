import { useCharts } from "../../context/ChartsContext";
import { CompressionMetricsQueries} from "../../hooks/CompressionMetricsQuery";
import MetricChart from "./MetricChart";

const ChartsView = () => {

    const { compressionMetricState } = useCharts();
    const tappedCompressions = Object.entries(
            Object.fromEntries(
                Object.entries(compressionMetricState)
                    .filter(([, isTappedValue]) => isTappedValue?.isTapped)
            )
        ).map(([key, value]) => ({
            id: key,
            ...value
    }));

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

            const metrics = {
                VMAF: [],
                PSNR: [],
                SSIM: [],
            };

            query.data.metrics.forEach(frame => {
                metrics.VMAF.push(frame.VMAF);
                metrics.PSNR.push(frame.PSNR);
                metrics.SSIM.push(frame.SSIM);
            });

            return [compressionId, metrics];
            })
            .filter(Boolean)
    );

    const framesLength = compressionQueries.find(q => q.data?.metrics)?.data.metrics.length ?? 0;


    return (
        <div className="charts-view">
            
            {metrics.map((metricType, idx) => (
                <MetricChart 
                    metricType={metricType}
                    idx={idx}
                    tappedCompressions={tappedCompressions}
                    compressionMetricsMap={compressionMetricsMap}
                    framesLength={framesLength}
                />      
            ))}
        </div>
    );
}

export default ChartsView;