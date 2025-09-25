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

const Comparison = () => {
    const [selectedType, setSelectedType] = useState("H.265");
    const { selectedIdx } = useFrames();
    const [params] = useSearchParams();
    const [videoMetrics, setVideoMetrics] = useState({});
    const [frameMetrics, setFrameMetrics] = useState({});
    const {showError} = useError();

    const videoId = parseInt(params.get("videoId"));

    useEffect(() => {
        const controller = new AbortController();
        const fetchVideoMetrics = async () => {
            try {
                const resp = await fetch(`${apiUrl}/metrics/${videoId}`, { signal: controller.signal });
                await handleApiError(resp);
                const data = await resp.json();
                setVideoMetrics(data.videoMetrics);
            } catch (error) {
                if (error.name === "AbortError") return;
                showError(error.message, error.statusCode);
            }
        }
        fetchVideoMetrics();
        return () => controller.abort();
    }, [videoId, showError]);

    useEffect(() => {
        const controller = new AbortController();
        const fetchFrameMetrics = async () => {
            try {
                const resp = await fetch(`${apiUrl}/metrics/frame/${videoId}/${selectedIdx}`, { signal: controller.signal });
                await handleApiError(resp);
                const data = await resp.json();
                setFrameMetrics(data);
            } catch (error) {
                if (error.name === "AbortError") return;
                showError(error.message, error.statusCode);
            }
        }
        fetchFrameMetrics();
        return () => controller.abort();
    }, [videoId, selectedIdx, videoMetrics, showError]);

    const leftRef = useRef(null);
    const rightRef = useRef(null);

    const fetchMetrics = async () => {
        let resp;
        try {
            resp = await fetch(`${apiUrl}/metrics/${videoId}`);
            const data = await resp.json();
            setVideoMetrics(data.videoMetrics);
        } catch (error) {
            if (error.name === "AbortError") return;
            showError(error.message, error.statusCode);
        }
    };

    const fetchMetricsForFrame = async () => {
        const resp = await fetch(`${apiUrl}/metrics/frame/${videoId}/${selectedIdx}`);
        const data = await resp.json();
        setFrameMetrics(data);
    };

    const fetchImagesForComparison = async () => {
        const processedImageUrl = await fetchImage(
            MAX_RETRIES,
            `${apiUrl}/frames/${videoId}/${selectedIdx}/`,
        );
        const originalImageUrl = await fetchImage(
            MAX_RETRIES,
            `${apiUrl}/frames/${videoId}/${selectedIdx}/?original=true`,
        );
        if (leftRef.current)
            leftRef.current.src = originalImageUrl;
        if (rightRef.current)
            rightRef.current.src = processedImageUrl;
    }

    useEffect(() => {
        fetchMetrics();
    }, [videoId]);

    useEffect(() => {
        fetchMetricsForFrame();
    }, [videoId, selectedIdx, videoMetrics]);

    useEffect(() => {
        fetchImagesForComparison();
    }, [videoId, selectedIdx]);

    return (
        <div className="comparison">
            <FrameBox/>
            <div className="comparison-container">
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
