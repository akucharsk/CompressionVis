import React, { useEffect, useState } from "react";
import "../../styles/components/comparison/Images.css";
import ImageDetails from "./ImageDetails";
import ImageFullScreen from "./ImageFullScreen";
import { useSettings } from "../../context/SettingsContext";
import ImageVideoBlock from "../ImageVideoBlock";
import SlaveImageVideoBlock from "../SlaveImageVideoBlock";
import { useSearchParams } from "react-router-dom";
import { getVideoIdsFromCache } from "../../utils/videoIdsCache";
import { apiUrl } from "../../utils/urls";

const ImageBlock = ({
                        isConst = true,
                        selectedIdx = 0,
                        navigation = {},
                        fullscreen = {},
                        videoRef
                    }) => {
    const { parameters, resolutionWidth, resolutionHeight } = useSettings();
    const [searchParams] = useSearchParams();

    const originalVideoId = parameters.videoId;
    const compressedVideoId = parseInt(searchParams.get("videoId"));
    let isOriginalChosen = !isConst;
    const [ isOriginal, setIsOriginal ] = useState(isOriginalChosen);
    const videoId = isOriginal ? originalVideoId : searchParams.get("videoId");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [ selectedVideoId, setSelectedVideoId ] = useState(videoId);
    const compressedIds = getVideoIdsFromCache(originalVideoId);

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
        isOriginalChosen = val === originalVideoId;
        setIsOriginal(isOriginalChosen);
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
                        <div className="static-name">Active param</div>
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
                            isConst={isConst}
                            videoId={selectedVideoId}
                            videoRef={videoRef}
                            fullscreenHandler={openFullscreen}
                        />
                    </>
                )}

                {<ImageDetails
                    isOriginalChosen={isOriginalChosen}
                    selectedIdx={selectedIdx}
                />}

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
