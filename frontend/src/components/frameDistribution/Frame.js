import './../../styles/components/distribution/Frame.css';
import { useFrames } from "../../context/FramesContext";
import Spinner from "../Spinner";

const Frame = ({ imageUrl }) => {
    const { frames, selectedIdx } = useFrames();


    return (
        <> 
            {frames.length > 0 && selectedIdx < frames.length && (
                <div className="frame-preview">
                    {imageUrl === null ? (
                        <Spinner></Spinner>
                    ) : imageUrl && (
                        <img
                            src={imageUrl}
                            alt={`Frame ${selectedIdx} (${frames[selectedIdx].type})`}
                        />
                    )}
                </div>
            )}
        </>
    );
};

export default Frame;