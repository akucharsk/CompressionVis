import { useSearchParams } from "react-router-dom";
import { useCharts } from "../../context/ChartsContext";
import "../../styles/components/charts/SelectForVideo.css";
import { useEffect, useState } from "react";
import Spinner from "../Spinner";

const SelectForVideo = () => {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);

    const { thumbnails, selectedVideoId, changeVideo } = useCharts();
    const { data, isPending } = thumbnails;

    const [ searchParams, setSearchParams ] = useSearchParams();

    const selectVideoForMetric = (video) => {
        setSelected(video);
        setOpen(false);
        changeVideo(video.id);
    };

    const [selectedVideo, setSelectedVideo] = useState();

    useEffect(() => {
        if (!data) return;
        if (!selectedVideoId) return;

        const foundData = data.find(video => 
            String(video.id) === String(selectedVideoId)
        );
        if (!foundData) return;
        console.log(foundData);
        setSelectedVideo(foundData);

    }, [data, selectedVideoId, changeVideo])

    console.log("Tu thumbnails");
    console.log(thumbnails);

    return (
        <div className="select-wrapper">
            <div className="dropdown-trigger" onClick={() => setOpen(!open)}>
                { selectedVideo ? (
                    <div>
                        <img src={selectedVideo.thumbnail} alt={`${selectedVideo.title} image`} />
                        <span>{selectedVideo.name}</span>
                    </div>
                ) : (
                    <div>
                        Wybierz wideo...
                    </div>
                )}
            </div>

            {open && (
                <div className="dropdown-options">
                    {data
                        .filter(video => video !== selectedVideo)
                        .map(video => (
                            <div
                                key={video.id}
                                className="dropdown-option"
                                onClick={() => selectVideoForMetric(video)}
                            >
                                <img src={video.thumbnail} alt="" />
                                <span>{video.name}</span>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}

export default SelectForVideo;
