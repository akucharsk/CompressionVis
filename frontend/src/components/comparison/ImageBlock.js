import React, { useState, useEffect } from "react";
import "../../styles/components/comparison/Images.css";
import ImageDetails from "./ImageDetails";
import ImageFullScreen from "./ImageFullScreen";
import {useSettings} from "../../context/SettingsContext";
import {getVideoIdsFromCache} from "../../utils/videoIdsCache";
import {fetchImage} from "../../api/fetchImage";
import {MAX_RETRIES} from "../../utils/constants";
import {apiUrl} from "../../utils/urls";
import {useSearchParams} from "react-router-dom";

const ImageBlock = ({
                        isConst = true,
                        selectedIdx = 0,
                        imageRef = null,
                        details = {},
                        detailType = "Frame metrics",
                        compressionParams = {},
                        onPrev = null,
                        onNext = null,
                        isFullscreen: isFullscreenProp = undefined,
                        onOpenFullscreen = null,
                        onCloseFullscreen = null,
                        onSwitchFullscreen = null,
 }) => {
    const [collapsed] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { parameters } = useSettings();
    const originalVideoId = parameters.videoId;
    const [params] = useSearchParams();
    const videoId = parseInt(params.get("videoId"));
    const [imgSrc, setImgSrc] = useState(null);
    const compressed = getVideoIdsFromCache(originalVideoId);
    const compressedIds = compressed.filter(id => id !== videoId);

     useEffect(() => {
         if (typeof isFullscreenProp === 'boolean') {
             setIsFullscreen(isFullscreenProp);
         }
     }, [isFullscreenProp]);

    const fetchImagesForComparison = async (original, id) => {
        let imageUrl;
        let vId = videoId;
        if (id !== null) {
            vId = id;
        }
        if (original) {
            imageUrl = await fetchImage(
                MAX_RETRIES,
                `${apiUrl}/frames/${videoId}/${selectedIdx}/?original=true`,
            );
        }
        else {
            imageUrl = await fetchImage(
                MAX_RETRIES,
                `${apiUrl}/frames/${vId}/${selectedIdx}/`,
            );
        }
        setImgSrc(imageUrl);
    }

    const handleSelectChange = (e) => {
        fetchImagesForComparison(e.target.value === "-1", e.target.value);
    }

    useEffect(() => {
        fetchImagesForComparison(!isConst, null);
    }, []);

     const openFullscreen = () => {
         if (typeof onOpenFullscreen === 'function') {
             onOpenFullscreen();
             return;
         }
         setIsFullscreen(true);
     };

     const closeFullscreen = () => {
         if (typeof onCloseFullscreen === 'function') {
             onCloseFullscreen();
             return;
         }
         setIsFullscreen(false);
     };

     return (
         <div className={`image-block ${collapsed ? 'collapsed' : ''}`} >
             <div className="image-block-content">
                 {isConst ? (
                     <div className="static-name">Active param</div>
                 ) : (
                     <select onChange={(e) => handleSelectChange(e)}>
                         <option key={-1} value={-1}>Original Video</option>
                         {compressedIds.map((type, idx) => (
                             <option key={idx} value={type}>ID: {type}</option>
                         ))}
                     </select>

                 )}
                 <img alt="Image" ref={imageRef} className="image-block-img" src={imgSrc} onClick={openFullscreen}/>
                 <ImageDetails type={detailType} details={details} compressionParams={compressionParams}/>
             </div>

             {isFullscreen && (
                 <ImageFullScreen
                     imageSrc={imgSrc}
                     detailType={detailType}
                     onPrev={onPrev}
                     onNext={onNext}
                     onSwitchFullscreen={onSwitchFullscreen}
                     onClose={closeFullscreen}
                 />
             )}
         </div>
     );
};

export default ImageBlock;





