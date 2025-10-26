import React from "react";

const formatValue = (value) => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value, null, 2);
        } catch (e) {
            return String(value);
        }
    }
    return String(value);
}

const ImageDetails = ({ type, details = {}, compressionParams = {} }) => {
    const renderEntries = (obj) => {
        return Object.entries(obj).map(([key, value], idx) => {
            const isObject = typeof value === 'object' && value !== null;
            const formatted = formatValue(value);
            return (
                <div className="detail-row" key={`d-${idx}`}>
                    <div className="detail-key">{key}</div>
                    <div className="detail-value">
                        {isObject ? (
                            <pre className="detail-json">{formatted}</pre>
                        ) : (
                            <span>{formatted}</span>
                        )}
                    </div>
                </div>
            );
        });
    }

    return (
        <div className="image-details">
            <h3>{type}</h3>
            {Object.keys(details).length > 0 ? (
                renderEntries(details)
            ) : (
                <p>No data</p>
            )}

            {compressionParams && Object.keys(compressionParams).length > 0 && (
                <div className="compression-params" style={{marginTop: '10px'}}>
                    <h4>Compression parameters</h4>
                    {renderEntries(compressionParams)}
                </div>
            )}
        </div>
    )
}

export default ImageDetails;