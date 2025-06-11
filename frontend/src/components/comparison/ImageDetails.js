import React from "react";

const ImageDetails = ({ type, details }) => {

    return (
        <>
            <div className="image-details">
                <h3>{type}</h3>
                {Object.entries(details).map(([key, value], idx) => (
                    <p key={idx}>{key}: {value}</p>
                ))}
            </div>
        </>
    )
}

export default ImageDetails;