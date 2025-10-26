import FrameBox from "../components/FrameBox";
import {useRef, useState} from "react";
import './../styles/pages/Comparison.css';
import {useFrames} from "../context/FramesContext";
import { useMetrics } from "../context/MetricsContext";
import ImageBlock from "../components/comparison/ImageBlock";

const Comparison = () => {
    const { selectedIdx, setSelectedIdx, frames } = useFrames();
    const leftRef = useRef(null);
    const rightRef = useRef(null);
    const [fullscreenSide, setFullscreenSide] = useState(null);
    const { frameMetricsQuery, videoMetricsQuery } = useMetrics();

    const getCompressionParams = () => {
        // const data = videoMetricsQuery?.data || {};
        //
        // const candidates = ["compressionParams", "parameters", "params", "config", "encoding", "settings"];
        // for (const key of candidates) {
        //     if (data[key] && typeof data[key] === 'object') return data[key];
        // }
        // const knownFields = ["crf", "preset", "bandwidth", "bitrate", "aq_mode", "aq_strength", "gop_size", "bf"];
        // const found = {};
        // for (const k of knownFields) {
        //     if (data[k] !== undefined) found[k] = data[k];
        // }
        // return Object.keys(found).length > 0 ? found : {};
    }

    const compressionParamsForProcessed = {
        ...getCompressionParams(),
    };

    const switchFullscreen = (direction) => {
        if (direction === 'left' || direction === 'right') {
            setFullscreenSide(direction);
            return;
        }
        setFullscreenSide(prev => (prev === 'left' ? 'right' : 'left'));

    };

    return (
        <div className="comparison">
            <FrameBox/>
            <div className="comparison-container">
                <ImageBlock
                    imageRef={leftRef}
                    selectedIdx={selectedIdx}
                    detailType={"Original Frame metrics"}
                    details={frameMetricsQuery.data?.metrics?.[selectedIdx] || {}}
                    onPrev={() => setSelectedIdx(prev => Math.max(0, prev - 1))}
                    onNext={() => setSelectedIdx(prev => Math.min(frames.length - 1, prev + 1))}
                    isFullscreen={fullscreenSide === 'left'}
                    onOpenFullscreen={() => setFullscreenSide('left')}
                    onCloseFullscreen={() => setFullscreenSide(null)}
                    onSwitchFullscreen={switchFullscreen}
                />

                <ImageBlock
                    isConst={false}
                    selectedIdx={selectedIdx}
                    imageRef={rightRef}
                    detailType={"Processed Frame metrics"}
                    details={frameMetricsQuery.data?.metrics?.[selectedIdx] || {}}
                    compressionParams={compressionParamsForProcessed}
                    onPrev={() => setSelectedIdx(prev => Math.max(0, prev - 1))}
                    onNext={() => setSelectedIdx(prev => Math.min(frames.length - 1, prev + 1))}
                    isFullscreen={fullscreenSide === 'right'}
                    onOpenFullscreen={() => setFullscreenSide('right')}
                    onCloseFullscreen={() => setFullscreenSide(null)}
                    onSwitchFullscreen={switchFullscreen}
                />
            </div>
        </div>
    );
};

export default Comparison;
