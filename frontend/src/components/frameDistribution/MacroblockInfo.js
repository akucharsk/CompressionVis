import '../../styles/components/distribution/Macroblock.css';

const MacroblockInfo = ({ selectedBlock, setSelectedBlock }) => {
    if (!selectedBlock) return null;

    return (
        <div className="macroblock-info-box">
            <h4>Macroblock details</h4>
            <p><strong>Type:</strong> {selectedBlock.type || 'N/A'}</p>
            <p><strong>Position:</strong> ({selectedBlock.x ?? 'N/A'}, {selectedBlock.y ?? 'N/A'})</p>
            <p><strong>Size:</strong> {selectedBlock.width ?? 'N/A'}x{selectedBlock.height ?? 'N/A'}</p>
            <p><strong>Ffmpeg type:</strong> {selectedBlock.ftype ?? 'N/A'}</p>
            <p><strong>Reference frame:</strong> {selectedBlock.source ?? 'N/A'}</p>
            {selectedBlock.src_x !== undefined && (
                <p><strong>Source:</strong> ({selectedBlock.src_x}, {selectedBlock.src_y})</p>
            )}
            <button
                className="macroblock-close-btn"
                onClick={() => setSelectedBlock && setSelectedBlock(null)}
            >
                Close
            </button>
        </div>
    );
};

export default MacroblockInfo;