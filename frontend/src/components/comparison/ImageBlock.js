import React, { useEffect, useState } from "react";
import "../../styles/components/comparison/Images.css";
import ImageDetails from "./ImageDetails";
import ImageFullScreen from "./ImageFullScreen";
import { useComparisonImage } from "./useComparisonImage";
import ImageVideoBlock from "../ImageVideoBlock";
import SlaveImageVideoBlock from "../SlaveImageVideoBlock";
import { useSearchParams } from "react-router-dom";
import {getVideoIdsFromCache} from "../../utils/videoIdsCache";
import {useVideoPlaying} from "../../context/VideoPlayingContext";
import {useDisplayMode} from "../../context/DisplayModeContext";

const ImageBlock = ({
                        isConst = true,
                        navigation = {},
                        fullscreen = {},
                        videoRef
                    }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { imgSrc, fetchImagesForComparison } = useComparisonImage(isConst);

    const [searchParams] = useSearchParams();
    const originalVideoId =  parseInt(searchParams.get("originalVideoId"));
    const compressedVideoId = parseInt(searchParams.get("videoId"));
    const selectedIdx = parseInt(searchParams.get("frameNumber")) || 0;

    const {isVideoPlaying} = useVideoPlaying();
    const {setDisplayMode} = useDisplayMode();

    const compressedIds = getVideoIdsFromCache(originalVideoId).filter(id => id !== compressedVideoId);
    const [isOriginal , setIsOriginal] = useState(true);

    const [selectedVideoId, setSelectedVideoId] = useState(isConst ? compressedVideoId : originalVideoId);
    useEffect(() => {
        setIsFullscreen(fullscreen.is);
    }, [fullscreen.is]);

    useEffect(() => {
        if (!isVideoPlaying) {
            fetchImagesForComparison(isOriginal, selectedVideoId);
            setDisplayMode('frames');
        }
    }, [selectedIdx, isOriginal, isVideoPlaying]);

    const handleSelectChange = (e) => {
        const val = parseInt(e.target.value);
        setIsOriginal(Number(val) === Number(originalVideoId));
        setSelectedVideoId(val);
        fetchImagesForComparison(isOriginal, selectedVideoId);
    };

    useEffect(() => {
        if (!isVideoPlaying) {
            fetchImagesForComparison(isOriginal, selectedVideoId);
        }
    }, [isVideoPlaying]);

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
                            imgSrc={imgSrc}                       
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
                            imgSrc={imgSrc}
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
                    imageSrc={imgSrc}
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
