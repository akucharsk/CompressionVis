
const apiUrl = "http://localhost:8000"

const getFrameImageUrl = (selectedIdx, frames) => {
    if (frames.length > 0 && selectedIdx < frames.length) {
        return `${apiUrl}/${frames[selectedIdx].image_url}`;
    }
    return null;
};

export {apiUrl, getFrameImageUrl}