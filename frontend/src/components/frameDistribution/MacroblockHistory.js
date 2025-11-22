import "../../styles/components/distribution/Macroblock.css";
import Macroblock from "./Macroblock";

const MacroblockHistory = ({selectedBlock, setSelectedBlock, history}) => {

    const displayBlock = selectedBlock;

    const blockWidth = displayBlock?.width || 16;
    const blockHeight = displayBlock?.height || 16;

    return (
        <div className={`macroblock-info-box ${selectedBlock ? "visible" : ""}`}>
            <h4>Macroblock history</h4>

            <div className="macroblock-history">
                <div className="mb-slot">
                    {(displayBlock?.source < 0 || displayBlock?.source2 < 0) ? (
                        <Macroblock
                            name="Previous reference"
                            src={history?.prev}
                            width={blockWidth}
                            height={blockHeight}
                        />
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>

                <div className="arrow-slot">
                    {(displayBlock?.source < 0 || displayBlock?.source2 < 0) ? (
                        <div className="arrow">→</div>
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>

                <div className="mb-slot">
                    {(displayBlock?.source < 0 || displayBlock?.source2 < 0) ? (
                        <Macroblock
                            name="Moved macroblock"
                            src={history?.prev_moved}
                            width={blockWidth}
                            height={blockHeight}
                        />
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>

                <div className="arrow-slot">
                    {(displayBlock?.source < 0 || displayBlock?.source2 < 0) ? (
                        <div className="arrow">→</div>
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>

                <div className="mb-slot">
                    <Macroblock
                        name="Result"
                        src={history?.result}
                        width={blockWidth}
                        height={blockHeight}
                    />
                </div>

                <div className="arrow-slot">
                    {(displayBlock?.source > 0 || displayBlock?.source2 > 0) ? (
                        <div className="arrow">←</div>
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>

                <div className="mb-slot">
                    {(displayBlock?.source > 0 || displayBlock?.source2 > 0) ? (
                        <Macroblock
                            name="Moved macroblock"
                            src={history?.next_moved}
                            width={blockWidth}
                            height={blockHeight}
                        />
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>

                <div className="arrow-slot">
                    {(displayBlock?.source > 0 || displayBlock?.source2 > 0) ? (
                        <div className="arrow">←</div>
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>

                <div className="mb-slot">
                    {(displayBlock?.source > 0 || displayBlock?.source2 > 0) ? (
                        <Macroblock
                            name="Next reference"
                            src={history?.next}
                            width={blockWidth}
                            height={blockHeight}
                        />
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>
            </div>

            <button className="macroblock-close-btn" onClick={() => setSelectedBlock(null)}>
                Close
            </button>
        </div>
    );
};

export default MacroblockHistory;