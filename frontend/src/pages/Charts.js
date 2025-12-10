import { useState } from 'react';
import ChartsOptions from '../components/charts/ChartsOptions';
import CompressionsRank from '../components/charts/CompressionsRank';
import MetricChart from '../components/charts/MetricChart';
import '../styles/pages/Charts.css';
import SelectForVideo from '../components/charts/SelectForVideo';

const Charts = () => {

    const [compressionMetricState, setCompressionMetricState] = useState({});
    // const [visibleColors, setVisibleColors] = useState({}1);

    const [compressedVideos, setCompressedVideos] = useState( [
        1,
        2,
        3,
        4,
        5,
        6,
        8,
        9,
        0,
    ]);

    const metrics= ["VMAF", "SSIM", "PSNR", "Size"];

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
                {/* threshold???? */}
                <div className="charts-rightside-top">
                    <SelectForVideo />
                    <button className="refresh-compressions-button">
                        ⟳
                    </button>
                </div>
                <div className="charts-rightside-bottom">
                    <h4>Choose compressions to compare</h4>
                    <h4>Video compressions rank (by average video value)</h4>
                    <ChartsOptions 
                        compressionMetricState={compressionMetricState}
                        setCompressionMetricState={setCompressionMetricState}
                        compressedVideos={compressedVideos}
                    />
                    <CompressionsRank />
                </div>
            </div>
        </div>
    )
}

export default Charts;