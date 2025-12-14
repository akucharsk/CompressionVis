import { useState } from 'react';
import ChartsOptions from '../components/charts/ChartsOptions';
import CompressionsRank from '../components/charts/CompressionsRank';
import MetricChart from '../components/charts/MetricChart';
import '../styles/pages/Charts.css';
import SelectForVideo from '../components/charts/SelectForVideo';
import { useCharts } from '../context/ChartsContext';

const Charts = () => {

    const [compressionMetricState, setCompressionMetricState] = useState({});
    const {thumbnails, compressionsToTap, compressionsToRank} = useCharts();

    const metrics= ["VMAF", "SSIM", "PSNR", "Size"];

    const refetchAll = () => {
        const refetchThumbnails = thumbnails.refetch;
        const refetchCompressionsToTap = compressionsToTap.refetch;
        const refetchCompressionsToRank = compressionsToRank.refetch;

        refetchThumbnails();
        refetchCompressionsToTap();
        refetchCompressionsToRank();
    }


    return (
        <div className="charts-container">
            <div className="charts-leftside">
                {metrics.map((metricType, idx) => (
                        <MetricChart 
                            metricType={metricType}
                            idx={idx}
                        />      
                    )
                )}
            </div>
            <div className="charts-rightside">
                <div className="charts-rightside-top">
                    <SelectForVideo />
                    <button onClick={refetchAll} className="refresh-compressions-button" >
                        ⟳
                    </button>
                </div>
                <div className="charts-rightside-bottom">
                    <h4>Choose compressions to compare</h4>
                    <h4>Video compressions rank (by average video value)</h4>
                    <ChartsOptions 
                        compressionMetricState={compressionMetricState}
                        setCompressionMetricState={setCompressionMetricState}
                    />
                    <CompressionsRank />
                </div>
            </div>
        </div>
    )
}

export default Charts;