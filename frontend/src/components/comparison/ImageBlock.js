import React, { useEffect, useState } from "react";
import "../../styles/components/comparison/Images.css";
import ImageDetails from "./ImageDetails";
import ImageFullScreen from "./ImageFullScreen";
import { useComparisonImage } from "./useComparisonImage";
import { useSettings } from "../../context/SettingsContext";
import Frame from "../frameDistribution/Frame";

const ImageBlock = ({
                        isConst = true,
                        selectedIdx = 0,
                        navigation = {},
                        fullscreen = {},
                    }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { imgSrc, compressedIds, fetchImagesForComparison } = useComparisonImage(isConst, selectedIdx);
    const { parameters } = useSettings();
    const originalVideoId = parameters.videoId;
    let isOriginalChosen = !isConst;

    useEffect(() => {
        setIsFullscreen(fullscreen.is);
    }, [fullscreen.is]);

    const handleSelectChange = (e) => {
        const val = parseInt(e.target.value);
        isOriginalChosen = val === originalVideoId;
        fetchImagesForComparison(val === -1, val);
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
                    <div className="static-name">Active param</div>
                ) : (
                    <select onChange={handleSelectChange}>
                        <option key={-1} value={originalVideoId}>Original Video</option>
                        {compressedIds.map((id, idx) => (
                            <option key={idx} value={id}>ID: {id}</option>
                        ))}
                    </select>
                )}
                <img
                    alt="Image"
                    className="image-block-img"
                    src={imgSrc}
                    onClick={openFullscreen}
                />

                <ImageDetails
                    isOriginalChosen={isOriginalChosen}
                    selectedIdx={selectedIdx}
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
