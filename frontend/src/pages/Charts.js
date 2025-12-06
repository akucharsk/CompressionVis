import { useState } from 'react';
import ChartsOptions from '../components/charts/ChartsOptions';
import CompressionsRank from '../components/charts/CompressionsRank';
import MetricChart from '../components/charts/MetricChart';
import '../styles/pages/Charts.css';

const Charts = () => {

    const metrics= ["VMAF", "SSIM", "PSNR", "Size"];

    return (
        <div className="charts-container">
            <div className="charts-leftside">
                {metrics.map((metricType) => (
                        <MetricChart 
                            metricType={metricType}
                        />      
                    )
                )}
            </div>
            <div className="charts-rightside">
                <div className="charts-options">
                    <ChartsOptions />
                </div>
                <div className="charts-compressions-rank">
                    <CompressionsRank />
                </div>
            </div>
        </div>
    )
}

export default Charts;