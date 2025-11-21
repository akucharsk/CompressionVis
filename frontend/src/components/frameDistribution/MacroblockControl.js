import {useRef, useEffect} from "react";
import Spinner from "../Spinner";
import { useMacroblocks } from "../../context/MacroblocksContext";
import GridSwitch from "./GridSwitch";
import GridTripleSwitch from "./GridTripleSwitch";

const MacroblockControl = ({
                               setShowGrid,
                               setShowVectors,
                               showGrid,
                               showVectors,
                               toggleCategory,
                               visibleCategories,
                               mode,
                               setMode,
                               vectorsMode,
                               setVectorsMode
                           }) => {
    const { isBlocksLoading } = useMacroblocks();
    const wrapperRef = useRef(null);
    const vectorsRef = useRef(null);

    useEffect(() => {
        if (wrapperRef.current) {
            if (showGrid) {
                wrapperRef.current.style.maxHeight = wrapperRef.current.scrollHeight + 'px';
            } else {
                wrapperRef.current.style.maxHeight = '0';
            }
        }
    }, [showGrid]);

    useEffect(() => {
        if (vectorsRef.current) {
            if (showVectors) {
                vectorsRef.current.style.maxHeight = vectorsRef.current.scrollHeight + 'px';
            } else {
                vectorsRef.current.style.maxHeight = '0';
            }
        }
    }, [showVectors]);

    return (
        <>
            <div className="content-box">
                <div className={`macroblock-expandable ${showGrid ? "expanded" : ""} ${isBlocksLoading ? "loading" : ""}`}>
                    <button
                        className="macroblock-btn"
                        onClick={() => setShowGrid(!showGrid)}
                        disabled={isBlocksLoading}
                    >
                        {isBlocksLoading && <Spinner size={15} />}
                        {showGrid ? "Hide macroblocks controls" : "Show macroblocks controls"}
                    </button>

                    <div className="checkbox-wrapper" ref={wrapperRef}>
                        <GridSwitch
                            mode={mode}
                            setMode={setMode}
                            disabled={isBlocksLoading}
                        />
                        <div className={`checkbox-container ${isBlocksLoading ? "loading" : ""}`}>
                            {[
                                { key: "intra", label: "Intra", class: "label-intra" },
                                { key: "inter", label: "Inter", class: "label-inter" },
                                { key: "skip", label: "Skip", class: "label-skip" },
                                { key: "direct", label: "Direct", class: "label-direct" }
                            ].map(({ key, label, class: c }) => (
                                <label key={key}>
                                    <input
                                        type="checkbox"
                                        checked={visibleCategories[key]}
                                        onChange={() => toggleCategory(key)}
                                        disabled={isBlocksLoading}
                                    />
                                    <span className="label-dot-wrapper">
                                        <span className={`label-dot ${c}`}></span> {label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="content-box">
                <div className={`macroblock-expandable ${showVectors ? "expanded" : ""} ${isBlocksLoading ? "loading" : ""}`}>
                    <button
                        className="macroblock-btn vector"
                        onClick={() => setShowVectors(!showVectors)}
                        disabled={isBlocksLoading}
                    >
                        {isBlocksLoading && <Spinner size={15} />}
                        {showVectors ? "Hide motion vectors" : "Show motion vectors"}
                    </button>
                    <div className="checkbox-wrapper" ref={vectorsRef}>
                        <GridTripleSwitch
                            mode={vectorsMode}
                            setMode={setVectorsMode}
                            disabled={isBlocksLoading}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default MacroblockControl;