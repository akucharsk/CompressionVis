const Macroblock = ({ name, url }) => (
    <div className="macroblock">
        {url ? (
            <img
                src={url}
                alt={`${name || ""} macroblock`}
                style={{
                    width: "120px",
                    height: "120px",
                    imageRendering: "pixelated",
                    border: "1px solid #555",
                    marginBottom: "10px",
                }}
            />
        ) : (
            <div
                style={{
                    width: "120px",
                    height: "120px",
                    border: "1px solid #333",
                    background: "#111",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#666",
                    marginBottom: "10px",
                }}
            >
                No image
            </div>
        )}
        <p><strong>{name}</strong></p>
    </div>
);

export default Macroblock;
