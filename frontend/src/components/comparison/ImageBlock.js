import React, { useEffect, useState } from "react";
import "../../styles/components/comparison/Images.css";
import ImageDetails from "./ImageDetails";
import ImageFullScreen from "./ImageFullScreen";
import ImageVideoBlock from "../ImageVideoBlock";
import SlaveImageVideoBlock from "../SlaveImageVideoBlock";
import { useSearchParams } from "react-router-dom";
import { apiUrl } from "../../utils/urls";
import {useQuery} from "@tanstack/react-query";
import {fetchWithCredentials} from "../../api/genericFetch";
import {defaultRetryPolicy} from "../../utils/retryUtils";

const ImageBlock = ({
                        isConst = true,
                        navigation = {},
                        fullscreen = {},
                        videoRef
                    }) => {
    const { parameters, resolutionWidth, resolutionHeight } = useSettings();
    const [searchParams] = useSearchParams();
    const originalVideoId =  parseInt(searchParams.get("originalVideoId"));
    const compressedVideoId = parseInt(searchParams.get("videoId"));
    const selectedIdx = parseInt(searchParams.get("frameNumber")) || 0;
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isOriginal , setIsOriginal] = useState(true);

    const { data, isPending } = useQuery({
        queryKey: ["compressed-videos"],
        queryFn: async () => await fetchWithCredentials(`${apiUrl}/video/all-compressed-videos/?original_id=${originalVideoId}`),
        retry: defaultRetryPolicy,
    });

    const videos = data?.videos || [];
    const compressedIds = videos
        .filter(video => video.id !== compressedVideoId && video.original === originalVideoId)
        .map(video => video.id);
    const [selectedVideoId, setSelectedVideoId] = useState(isConst ? compressedVideoId : originalVideoId);
    const videoIdToUse = isConst ? compressedVideoId : selectedVideoId;

    let query = "";
    if (resolutionWidth && resolutionHeight) {
        query = `?width=${resolutionWidth}&height=${resolutionHeight}`;
    }

    useEffect(() => {
        setIsFullscreen(fullscreen.is);
    }, [fullscreen.is]);

    const handleSelectChange = (e) => {
        const val = parseInt(e.target.value);
        setIsOriginal(Number(val) === Number(originalVideoId));
        setSelectedVideoId(val);
    };

    const openFullscreen = () => {
        if (fullscreen.onOpen) fullscreen.onOpen();
        else setIsFullscreen(true);
    };

    const closeFullscreen = () => {
        if (fullscreen.onClose) fullscreen.onClose();
        else setIsFullscreen(false);
    };

    return (
        <div className="image-block">
            <div className="image-block-content">
                {isConst ? (
                    <>
                        <div className="static-name">Current compression</div>
                        <ImageVideoBlock 
                            isConst={isConst}
                            videoId={compressedVideoId}
                            videoRef={videoRef}
                            fullscreenHandler={openFullscreen}
                        />
                    </>
                ) : (
                    <>
                        <select onChange={handleSelectChange}>
                            <option key={-1} value={originalVideoId}>Original Video</option>
                            {compressedIds.map((id, idx) => (
                                <option key={idx} value={id}>ID: {id}</option>
                            ))}
                        </select>
                        <SlaveImageVideoBlock
                            videoId={selectedVideoId}
                            videoRef={videoRef}
                            fullscreenHandler={openFullscreen}
                        />
                    </>
                )}

                <ImageDetails
                    isOriginalChosen={isOriginal}
                    isConst={isConst}
                    selectedVideoId={selectedVideoId}
                />

            </div>

            {isFullscreen && (
                <ImageFullScreen
                    imageSrc={`${apiUrl}/frames/${videoIdToUse}/${selectedIdx}${query}`}
                    onPrev={navigation.onPrev}
                    onNext={navigation.onNext}
                    onSwitchFullscreen={fullscreen.onSwitch}
                    onClose={closeFullscreen}
                />
            )}
        </div>
    );
};

export default ImageBlock;
