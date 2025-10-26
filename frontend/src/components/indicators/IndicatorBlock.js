import { useSearchParams } from "react-router-dom";
import { useFrames } from "../../context/FramesContext";
import { useMetrics } from "../../context/MetricsContext";

export default function IndicatorBlock({ frameNumber }) {
  const { frames, sizeRange } = useFrames();
  const [ searchParams ] = useSearchParams();

  const indicator = searchParams.get("indicator") || "none";
  const { frameMetricsQuery } = useMetrics();

  const indicatorRanges = {
    size: sizeRange,
    psnr: { min: 15, max: 50 },
    vmaf: { min: 0, max: 100 },
    ssim: { min: 0, max: 1 },
  };

  const getIndicatorValue = (frameNumber) => {
    switch (indicator) {
        case "none":
        case "size":
            return frames?.[frameNumber].pkt_size
        case "psnr":
            return frameMetricsQuery?.data?.metrics?.[frameNumber].PSNR
        case "vmaf":
            return frameMetricsQuery?.data?.metrics?.[frameNumber].VMAF
        case "ssim":
            return frameMetricsQuery?.data?.metrics?.[frameNumber].SSIM
        default:
    };
  };

  const getIndicatorColor = (frameNumber) => {
    const value = getIndicatorValue(frameNumber);
    const { min, max } = indicatorRanges[indicator];
    const scale = 2 * 256 / (max - min);
    const scaledValue = scale * (value - min);
  
    const isLowerGreen = indicator === "size";
    const color = isLowerGreen ? { r: 0, g: 255, b: 0} : { r: 255, g: 0, b: 0 };
    if (scaledValue < 256) {
        color[isLowerGreen ? "r" : "g"] = scaledValue;
    } else {
        color[isLowerGreen ? "r" : "g"] = 255;
        color[isLowerGreen ? "g" : "r"] -= Math.min(scaledValue - 256, 255);
    }
    const { r, g, b } = color;
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div className="indicator-block" style={{ backgroundColor: getIndicatorColor(frameNumber) }}>
        { getIndicatorValue(frameNumber) }
    </div>
  )
}
