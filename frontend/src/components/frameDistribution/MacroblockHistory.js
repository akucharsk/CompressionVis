import "../../styles/components/distribution/Macroblock.css";
import Macroblock from "./Macroblock";

const MacroblockHistory = ({selectedBlock, setSelectedBlock, history}) => {

    const displayBlock = selectedBlock;

    const blockWidth = displayBlock?.width || 16;
    const blockHeight = displayBlock?.height || 16;

    const hasPrev = displayBlock?.source < 0 || displayBlock?.source2 < 0;
    const hasNext = displayBlock?.source > 0 || displayBlock?.source2 > 0;
    const isBiDir = hasPrev && hasNext;

    const getVectorText = (isPrevRef) => {
        let dx, dy;
        const s1 = displayBlock.source;

        if (isPrevRef) {
            if (s1 < 0) { dx = displayBlock.x - displayBlock.src_x; dy = displayBlock.y - displayBlock.src_y; }
            else { dx = displayBlock.x - displayBlock.src_x2; dy = displayBlock.y - displayBlock.src_y2; }
        } else {
            if (s1 > 0) { dx = displayBlock.x - displayBlock.src_x; dy = displayBlock.y - displayBlock.src_y; }
            else { dx = displayBlock.x - displayBlock.src_x2; dy = displayBlock.y - displayBlock.src_y2; }
        }
        return `(${dx}, ${dy})`;
    };

    return (
        <div className={`macroblock-info-box ${selectedBlock ? "visible" : ""}`}>
            <h4>Macroblock history</h4>

            <div className="macroblock-history grid-layout">

                <div className="mb-slot">
                    {hasPrev ? (
                        <Macroblock
                            name="Moved Past"
                            src={history?.prev}
                            width={blockWidth}
                            height={blockHeight}
                        />
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>

                <div className="arrow-slot">
                    {hasPrev ? <>
                        <span className="vector-label">{getVectorText(true)}</span>
                        <div className="arrow">→</div>
                    </> : <div className="mb-placeholder"/>}
                </div>

                <div className="mb-slot">
                    {hasPrev ? (
                        <Macroblock
                            name="Diff Past"
                            src={history?.prev_diff}
                            width={blockWidth}
                            height={blockHeight}
                        />
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>

                <div className="arrow-slot">
                    {hasPrev ? <div className="arrow">→</div> : <div className="mb-placeholder"/>}
                </div>

                <div className="mb-slot center-slot">
                    {isBiDir ? (
                        <div className="center-stack">
                            <Macroblock name="Interpolation" src={history?.interpolated} width={blockWidth} height={blockHeight} />
                            {/*<div className="arrow-down">↓</div>*/}
                            <Macroblock name="Original" src={history?.original} width={blockWidth} height={blockHeight} />
                        </div>
                    ) : (
                        <Macroblock name="Original" src={history?.original} width={blockWidth} height={blockHeight} />
                    )}
                </div>

                <div className="arrow-slot">
                    {hasNext ? <div className="arrow">←</div> : <div className="mb-placeholder"/>}
                </div>

                <div className="mb-slot">
                    {hasNext ? (
                        <Macroblock
                            name="Diff Future"
                            src={history?.next_diff}
                            width={blockWidth}
                            height={blockHeight}
                        />
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>

                <div className="arrow-slot">
                    {hasNext ? <>
                        <span className="vector-label">{getVectorText(false)}</span>
                        <div className="arrow">←</div>
                    </> : <div className="mb-placeholder"/>}
                </div>

                <div className="mb-slot">
                    {hasNext ? (
                        <Macroblock
                            name="Moved Future"
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