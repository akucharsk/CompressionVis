import React, { useEffect, useState } from "react";
import "../../styles/components/comparison/Images.css";
import ImageDetails from "./ImageDetails";
import ImageFullScreen from "./ImageFullScreen";
import ImageVideoBlock from "../ImageVideoBlock";
import SlaveImageVideoBlock from "../SlaveImageVideoBlock";
import { useSearchParams } from "react-router-dom";
import { getVideoIdsFromCache } from "../../utils/videoIdsCache";
import { apiUrl } from "../../utils/urls";

const ImageBlock = ({
                        isConst = true,
                        navigation = {},
                        fullscreen = {},
                        videoRef
                    }) => {
    const [searchParams] = useSearchParams();
    const originalVideoId =  parseInt(searchParams.get("originalVideoId"));
    const compressedVideoId = parseInt(searchParams.get("videoId"));
    let isOriginalChosen = !isConst;
    const [isOriginal , setIsOriginal] = useState(true);
    const selectedIdx = parseInt(searchParams.get("frameNumber")) || 0;
    const videoId = isOriginal ? originalVideoId : searchParams.get("videoId");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const compressedIds = getVideoIdsFromCache(originalVideoId);

    const [selectedVideoId, setSelectedVideoId] = useState(isConst ? compressedVideoId : originalVideoId);
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

                {<ImageDetails
                    isOriginalChosen={isOriginalChosen}
                    selectedIdx={selectedIdx}
                />}

            </div>

            {isFullscreen && (
                <ImageFullScreen
                    imageSrc={`${apiUrl}/frames/${isConst ? compressedVideoId : selectedVideoId}/${selectedIdx}`}
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
