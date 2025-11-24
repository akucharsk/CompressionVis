const Macroblock = ({ name, src, width, height }) => {
    const maxSize = 120;
    const aspectRatio = width && height ? width / height : 1;

    let displayWidth, displayHeight;

    if (aspectRatio > 1) {
        displayWidth = maxSize;
        displayHeight = maxSize / aspectRatio;
    } else {
        displayHeight = maxSize;
        displayWidth = maxSize * aspectRatio;
    }

    return (
        <div className="macroblock">
            {src ? (
                <img
                    src={src}
                    alt={`${name || ""} macroblock`}
                    style={{
                        width: `${displayWidth}px`,
                        height: `${displayHeight}px`,
                        imageRendering: "pixelated",
                        border: "1px solid #555",
                        marginBottom: "10px",
                    }}
                />
            ) : (
                <div
                    style={{
                        width: `${displayWidth}px`,
                        height: `${displayHeight}px`,
                        border: "1px solid #333",
                        background: "#111",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#666",
                        marginBottom: "10px",
                    }}
                >
                </div>
            )}
            <p><strong>{name}</strong></p>
        </div>
    );
};

export default Macroblock;