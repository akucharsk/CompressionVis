import "../../styles/components/distribution/Macroblock.css";
import Macroblock from "./Macroblock";
import {useEffect, useState} from "react";

const MacroblockHistory = ({selectedBlock, setSelectedBlock, history}) => {
    const [displayData, setDisplayData] = useState({block: null, history: null});

    useEffect(() => {
        if (selectedBlock && history) {
            const hasPrev = selectedBlock.source < 0 || selectedBlock.source2 < 0;
            const hasNext = selectedBlock.source > 0 || selectedBlock.source2 > 0;

            const historyHasPrev = history.prev || history.prev_diff;
            const historyHasNext = history.next || history.next_diff;

            const isHistorySynced = (hasPrev === !!historyHasPrev) && (hasNext === !!historyHasNext);
            const hasAnyRef = hasPrev || hasNext;

            if (isHistorySynced && hasAnyRef) {
                setDisplayData({block: selectedBlock, history: history});
            }
        }
    }, [selectedBlock, history]);

    const displayBlock = displayData.block;
    const displayHistory = displayData.history;

    const currentHasPrev = selectedBlock && (selectedBlock.source < 0 || selectedBlock.source2 < 0);
    const currentHasNext = selectedBlock && (selectedBlock.source > 0 || selectedBlock.source2 > 0);
    const isVisible = selectedBlock && (currentHasPrev || currentHasNext);

    if (!displayBlock || !displayHistory) {
        return <div className="macroblock-info-box"></div>;
    }

    const blockWidth = displayBlock.width || 16;
    const blockHeight = displayBlock.height || 16;

    const hasPrev = displayBlock.source < 0 || displayBlock.source2 < 0;
    const hasNext = displayBlock.source > 0 || displayBlock.source2 > 0;
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
        <div className={`macroblock-info-box ${isVisible ? "visible" : ""}`}>
            <h4>Macroblock compression analysis</h4>

            <div className="macroblock-history grid-layout">
                {isBiDir ? (
                    <>
                        <div className="mb-slot" style={{gridColumn: 1}}>
                            <Macroblock
                                name="Original"
                                src={displayHistory?.original}
                                width={blockWidth}
                                height={blockHeight}
                            />
                        </div>

                        <div className="arrow-slot" style={{gridColumn: 2}}>
                            <span className="vector-label">{getVectorText(true)}</span>
                            <div className="arrow" style={{fontWeight: "bold", fontSize: "30px"}}>-</div>
                        </div>

                        <div className="mb-slot" style={{gridColumn: 3}}>
                            <Macroblock
                                name="Moved Past"
                                src={displayHistory?.prev}
                                width={blockWidth}
                                height={blockHeight}
                            />
                        </div>

                        <div className="arrow-slot" style={{gridColumn: 4}}>
                            <div className="arrow" style={{fontWeight: "bold", fontSize: "30px"}}>=</div>
                        </div>

                        <div className="mb-slot" style={{gridColumn: 5}}>
                            <Macroblock
                                name="Diff Past"
                                src={displayHistory?.prev_diff}
                                width={blockWidth}
                                height={blockHeight}
                            />
                        </div>

                        <div className="arrow-slot" style={{gridColumn: 6}}>
                            <div className="arrow">→</div>
                        </div>

                        <div className="mb-slot center-slot" style={{gridColumn: 7}}>
                            <Macroblock
                                name="Interpolation"
                                src={displayHistory?.interpolation}
                                width={blockWidth}
                                height={blockHeight}
                            />
                        </div>

                        <div className="arrow-slot" style={{gridColumn: 8}}>
                            <div className="arrow">←</div>
                        </div>

                        <div className="mb-slot" style={{gridColumn: 9}}>
                            <Macroblock
                                name="Diff Future"
                                src={displayHistory?.next_diff}
                                width={blockWidth}
                                height={blockHeight}
                            />
                        </div>

                        <div className="arrow-slot" style={{gridColumn: 10}}>
                            <div className="arrow" style={{fontWeight: "bold", fontSize: "30px"}}>=</div>
                        </div>

                        <div className="mb-slot" style={{gridColumn: 11}}>
                            <Macroblock
                                name="Moved Future"
                                src={displayHistory?.next}
                                width={blockWidth}
                                height={blockHeight}
                            />
                        </div>

                        <div className="arrow-slot" style={{gridColumn: 12}}>
                            <span className="vector-label">{getVectorText(false)}</span>
                            <div className="arrow" style={{fontWeight: "bold", fontSize: "30px"}}>-</div>
                        </div>

                        <div className="mb-slot" style={{gridColumn: 13}}>
                            <Macroblock
                                name="Original"
                                src={displayHistory?.original}
                                width={blockWidth}
                                height={blockHeight}
                            />
                        </div>

                        <div className="mb-slot" style={{gridColumn: 1, gridRow: 2}}>
                            <Macroblock
                                name="Original"
                                src={displayHistory?.original}
                                width={blockWidth}
                                height={blockHeight}
                            />
                        </div>

                        <div className="arrow-slot" style={{gridColumn: 2, gridRow: 2}}>
                            <span className="vector-label">(0, 0)</span>
                            <div className="arrow" style={{fontWeight: "bold", fontSize: "30px"}}>-</div>
                        </div>

                        <div className="mb-slot" style={{gridColumn: 3, gridRow: 2}}>
                            <Macroblock
                                name="Not Moved Past"
                                src={displayHistory?.prev_not_moved}
                                width={blockWidth}
                                height={blockHeight}
                            />
                        </div>

                        <div className="arrow-slot" style={{gridColumn: 4, gridRow: 2}}>
                            <div className="arrow" style={{fontWeight: "bold", fontSize: "30px"}}>=</div>
                        </div>

                        <div className="mb-slot" style={{gridColumn: 5, gridRow: 2}}>
                            <Macroblock
                                name="Not Moved Diff Past"
                                src={displayHistory?.prev_not_moved_diff}
                                width={blockWidth}
                                height={blockHeight}
                            />
                        </div>

                        <div className="mb-slot" style={{gridColumn: 9, gridRow: 2}}>
                            <Macroblock
                                name="Not Moved Diff Future"
                                src={displayHistory?.next_not_moved_diff}
                                width={blockWidth}
                                height={blockHeight}
                            />
                        </div>

                        <div className="arrow-slot" style={{gridColumn: 10, gridRow: 2}}>
                            <div className="arrow" style={{fontWeight: "bold", fontSize: "30px"}}>=</div>
                        </div>

                        <div className="mb-slot" style={{gridColumn: 11, gridRow: 2}}>
                            <Macroblock
                                name="Not Moved Future"
                                src={displayHistory?.next_not_moved}
                                width={blockWidth}
                                height={blockHeight}
                            />
                        </div>

                        <div className="arrow-slot" style={{gridColumn: 12, gridRow: 2}}>
                            <span className="vector-label">(0, 0)</span>
                            <div className="arrow" style={{fontWeight: "bold", fontSize: "30px"}}>-</div>
                        </div>

                        <div className="mb-slot" style={{gridColumn: 13, gridRow: 2}}>
                            <Macroblock
                                name="Original"
                                src={displayHistory?.original}
                                width={blockWidth}
                                height={blockHeight}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        {hasPrev ? (
                            <>
                                <div className="mb-slot" style={{gridColumn: 1, gridRow: 1}}>
                                    <Macroblock
                                        name="Original"
                                        src={displayHistory?.original}
                                        width={blockWidth}
                                        height={blockHeight}
                                    />
                                </div>

                                <div className="arrow-slot" style={{gridColumn: 2, gridRow: 1}}>
                                    <span className="vector-label">{getVectorText(true)}</span>
                                    <div className="arrow" style={{fontWeight: "bold", fontSize: "30px"}}>-</div>
                                </div>

                                <div className="mb-slot" style={{gridColumn: 3, gridRow: 1}}>
                                    <Macroblock
                                        name="Moved Past"
                                        src={displayHistory?.prev}
                                        width={blockWidth}
                                        height={blockHeight}
                                    />
                                </div>

                                <div className="arrow-slot" style={{gridColumn: 4, gridRow: 1}}>
                                    <div className="arrow" style={{fontWeight: "bold", fontSize: "30px"}}>=</div>
                                </div>

                                <div className="mb-slot center-slot" style={{gridColumn: 5, gridRow: 1}}>
                                    <Macroblock
                                        name="Diff Past"
                                        src={displayHistory?.prev_diff}
                                        width={blockWidth}
                                        height={blockHeight}
                                    />
                                </div>

                                <div className="mb-slot" style={{gridColumn: 1, gridRow: 2}}>
                                    <Macroblock
                                        name="Original"
                                        src={displayHistory?.original}
                                        width={blockWidth}
                                        height={blockHeight}
                                    />
                                </div>

                                <div className="arrow-slot" style={{gridColumn: 2, gridRow: 2}}>
                                    <span className="vector-label">(0, 0)</span>
                                    <div className="arrow" style={{fontWeight: "bold", fontSize: "30px"}}>-</div>
                                </div>

                                <div className="mb-slot" style={{gridColumn: 3, gridRow: 2}}>
                                    <Macroblock
                                        name="Not Moved Past"
                                        src={displayHistory?.prev_not_moved}
                                        width={blockWidth}
                                        height={blockHeight}
                                    />
                                </div>

                                <div className="arrow-slot" style={{gridColumn: 4, gridRow: 2}}>
                                    <div className="arrow" style={{fontWeight: "bold", fontSize: "30px"}}>=</div>
                                </div>

                                <div className="mb-slot center-slot" style={{gridColumn: 5, gridRow: 2}}>
                                    <Macroblock
                                        name="Not Moved Diff Past"
                                        src={displayHistory?.prev_not_moved_diff}
                                        width={blockWidth}
                                        height={blockHeight}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="mb-slot center-slot" style={{gridColumn: 9, gridRow: 1}}>
                                    <Macroblock
                                        name="Diff Future"
                                        src={displayHistory?.next_diff}
                                        width={blockWidth}
                                        height={blockHeight}
                                    />
                                </div>

                                <div className="arrow-slot" style={{gridColumn: 10, gridRow: 1}}>
                                    <div className="arrow" style={{fontWeight: "bold", fontSize: "30px"}}>=</div>
                                </div>

                                <div className="mb-slot" style={{gridColumn: 11, gridRow: 1}}>
                                    <Macroblock
                                        name="Moved Future"
                                        src={displayHistory?.next}
                                        width={blockWidth}
                                        height={blockHeight}
                                    />
                                </div>

                                <div className="arrow-slot" style={{gridColumn: 12, gridRow: 1}}>
                                    <span className="vector-label">{getVectorText(false)}</span>
                                    <div className="arrow" style={{fontWeight: "bold", fontSize: "30px"}}>-</div>
                                </div>

                                <div className="mb-slot" style={{gridColumn: 13, gridRow: 1}}>
                                    <Macroblock
                                        name="Original"
                                        src={displayHistory?.original}
                                        width={blockWidth}
                                        height={blockHeight}
                                    />
                                </div>

                                <div className="mb-slot center-slot" style={{gridColumn: 9, gridRow: 2}}>
                                    <Macroblock
                                        name="Not Moved Diff Future"
                                        src={displayHistory?.next_not_moved_diff}
                                        width={blockWidth}
                                        height={blockHeight}
                                    />
                                </div>

                                <div className="arrow-slot" style={{gridColumn: 10, gridRow: 2}}>
                                    <div className="arrow" style={{fontWeight: "bold", fontSize: "30px"}}>=</div>
                                </div>

                                <div className="mb-slot" style={{gridColumn: 11, gridRow: 2}}>
                                    <Macroblock
                                        name="Not Moved Future"
                                        src={displayHistory?.next_not_moved}
                                        width={blockWidth}
                                        height={blockHeight}
                                    />
                                </div>

                                <div className="arrow-slot" style={{gridColumn: 12, gridRow: 2}}>
                                    <span className="vector-label">(0, 0)</span>
                                    <div className="arrow" style={{fontWeight: "bold", fontSize: "30px"}}>-</div>
                                </div>

                                <div className="mb-slot" style={{gridColumn: 13, gridRow: 2}}>
                                    <Macroblock
                                        name="Original"
                                        src={displayHistory?.original}
                                        width={blockWidth}
                                        height={blockHeight}
                                    />
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            <button className="macroblock-close-btn" onClick={() => setSelectedBlock(null)}>
                Close
            </button>
        </div>
    );
};

export default MacroblockHistory;