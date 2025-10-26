import { useSearchParams } from "react-router-dom";
import { useFrames } from "../../context/FramesContext";
import { useMetrics } from "../../context/MetricsContext";
import { scale as chroma } from "chroma-js";

export default function IndicatorBlock({ indicator, frameNumber }) {
  const { frames, sizeRange } = useFrames();

  const { frameMetricsQuery } = useMetrics();

  const range = {
    size: sizeRange,
    psnr: { min: 15, max: 50 },
    vmaf: { min: 0, max: 100 },
    ssim: { min: 0, max: 1 },
  }[indicator];

  if (!range) {
    return <></>;
  }

  const colors = indicator === "size" ? ["#00ff00", "#ffff00", "#ff0000"] : ["#ff0000", "#ffff00", "#00ff00"]
  const scale = chroma(colors).domain([range.min, range.max]);

  const value = {
    size: frames?.[frameNumber].pkt_size,
    psnr: frameMetricsQuery?.data?.metrics?.[frameNumber].PSNR,
    ssim: frameMetricsQuery?.data?.metrics?.[frameNumber].SSIM,
    vmaf: frameMetricsQuery?.data?.metrics?.[frameNumber].VMAF
  }[indicator];

  return (
    <div className="indicators-block" style={{ backgroundColor: scale(value).hex() }}>
        { value }
    </div>
  )
}
