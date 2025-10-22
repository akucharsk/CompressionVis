import FrameBox from "../components/FrameBox";
import {useEffect, useRef, useState} from "react";
import ImageBlockConst from "../components/comparison/ImageBlockConst";
import ImageBlockSelect from "../components/comparison/ImageBlockSelect";
import ImageDetails from "../components/comparison/ImageDetails";
import './../styles/pages/Comparison.css';

import {useFrames} from "../context/FramesContext";
import {apiUrl} from "../utils/urls";
import {useSearchParams} from "react-router-dom";
import {fetchImage} from "../api/fetchImage";
import {MAX_RETRIES} from "../utils/constants";
import Parameters from "../components/Parameters";
import {useError} from "../context/ErrorContext";
import {handleApiError} from "../utils/errorHandler";
import { useDisplayMode } from "../context/DisplayModeContext";
import VideoPlayerForAnalysis from "../components/frameDistribution/Video";

const Comparison = () => {
    const { selectedIdx } = useFrames();
    const { displayMode, setDisplayMode } = useDisplayMode();

    const [selectedType, setSelectedType] = useState("H.265");
    const [params] = useSearchParams();
    const [videoMetrics, setVideoMetrics] = useState({});
    const [frameMetrics, setFrameMetrics] = useState({});
    const {showError} = useError();

    const videoId = parseInt(params.get("videoId"));

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${apiUrl}/metrics/${videoId}`, { signal: controller.signal })
            .then(handleApiError)
            .then(res => res.json())
            .then(data => setVideoMetrics(data["videoMetrics"]))
            .catch(err => {
                if (err.name === "AbortError") return;
                showError(err.message, err.statusCode)
            });

        return () => controller.abort();
    }, [videoId, showError]);

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${apiUrl}/metrics/frame/${videoId}/${selectedIdx}`, { signal: controller.signal })
            .then(handleApiError)
            .then(res => res.json())
            .then(setFrameMetrics)
            .catch(err => {
                if (err.name === "AbortError") return;
                showError(err.message, err.statusCode)
            });
    }, [videoId, selectedIdx, videoMetrics, showError]);

    const leftRef = useRef(null);
    const rightRef = useRef(null);

    useEffect(() => {
        const controller = new AbortController();
        fetchImage(
            MAX_RETRIES,
            `${apiUrl}/frames/${videoId}/${selectedIdx}/`,
            controller
        )
            .then(url => {
                if (rightRef.current)
                    rightRef.current.src = url;
            })
            .catch(err => {
                if (err.name === "AbortError") return;
                showError(err.message, err.statusCode)
            });

        fetchImage(
            MAX_RETRIES,
            `${apiUrl}/frames/${videoId}/${selectedIdx}/?original=true`,
            controller
        )
            .then(url => {
                if (leftRef.current)
                    leftRef.current.src = url;
            })
            .catch(err => {
                if (err.name === "AbortError") return;
                showError(err.message, err.statusCode)
            });

        return () => controller.abort();
    }, [videoId, selectedIdx, showError]);

    return (
        <div className="comparison">
            <FrameBox/>
            <div className="comparison-container">
                {displayMode === "frames" ? (
                    <>
                    <ImageBlockConst
                        type={"Original"}
                        ref={leftRef}
                    />
                    <ImageBlockSelect 
                        types={["H.264"]}
                        selectedType={selectedType}
                        setSelectedType={setSelectedType}
                        ref={rightRef}
                    />
                    </>) : (
                    <>
                    <VideoPlayerForAnalysis

                    />
                    <VideoPlayerForAnalysis 
                    />
                    </>
                    )}
                
                <div className="description">
                    <Parameters/>
                    <ImageDetails
                        type={"Video metrics"}
                        details={videoMetrics}
                    />
                    <ImageDetails
                        type={"Frame metrics"}
                        details={frameMetrics}
                    />
                </div>
            </div>
        </div>
    );
};

export default Comparison;
