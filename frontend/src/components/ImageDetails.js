import React from "react";

const ImageDetails = ({ type, details }) => {

    return (
        <>
            <div className="image-details">
                <h1>{type}</h1>
                {Object.entries(details).map(([key, value], idx) => (
                    <p key={idx}><b>{key}</b>: {value}</p>
                ))}
            </div>
        </>
    )
}

export default ImageDetails;