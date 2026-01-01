import { useSearchParams } from "react-router-dom";
import { useCharts } from "../../context/ChartsContext";
import "../../styles/components/charts/SelectForVideo.css";
import { useEffect, useState } from "react";
import Spinner from "../Spinner";

const SelectForVideo = () => {
    const [open, setOpen] = useState(false);

    const { thumbnails, selectedVideoId, changeVideo } = useCharts();
    const { data } = thumbnails;

    const selectVideoForMetric = (video) => {
        setOpen(false);
        changeVideo(video.id);
    };

    const selectedVideo = data?.find(video => String(video.id) === String(selectedVideoId));

    useEffect(() => {
        if (!open) return;

        const close = () => setOpen(false);

        const timer = setTimeout(() => {
            document.addEventListener('click', close);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', close);
        };
    }, [open]);

    
    return (
        <div className="select-wrapper">
            <div className="dropdown-trigger" onClick={() => setOpen(!open)}>
                { selectedVideo ? (
                    <div className="select-wrapper-option selected">
                        <div className="select-wrapper-option-title">
                            <span>{selectedVideo.name}</span>
                        </div>
                        <div className="select-wrapper-option-image">
                            <img src={selectedVideo.thumbnail} alt={`${selectedVideo.title} image`} />
                        </div>                    
                    </div>
                ) : (
                    <div className="select-wrapper-option selected">
                        <div className="select-wrapper-option original">
                            <span>Choose video...</span>
                        </div>
                    </div>
                )}
            </div>
            <div className={`dropdown-options ${open ? 'open' : ''}`}>
                {data ? (
                    <>
                    {data
                        .filter(video => video !== selectedVideo)
                        .map(video => (
                            <div
                                key={video.id}
                                className="select-wrapper-option nonselected"
                                onClick={() => selectVideoForMetric(video)}
                            >
                                <div className="select-wrapper-option-title">
                                    <span>{video.name}</span>
                                </div>
                                <div className="select-wrapper-option-image">
                                    <img src={video.thumbnail} alt="" />
                                </div>                    
                            </div>
                        ))
                    }
                    </>
                ) : (
                    <></>
                )}
                
            </div>
        </div>
    );
}

export default SelectForVideo;
