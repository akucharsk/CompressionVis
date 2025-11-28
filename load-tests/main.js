import dotenv from "dotenv";

import { asyncTryCatch, generateRandomRequestBody, generateHeavyRequestBody } from "./utils.js";
import { BASE_URL } from "./constants.js";
import { logger } from "./logger.js";
import { choice } from "./utils.js";
import { timeExtractor } from "./extractor-timer.js";

dotenv.config();

async function compressVideo(id, isHeavy = false, isIntegrityTest = false) {
  const requestBody = 
    isIntegrityTest ? {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoId: id,
        bandwidth: "1M",
        resolution: "1920x1080",
        gop_size: 60,
        preset: "medium",
        bf: "default",
        aq_mode: 0,
        aq_strength: 0.8,
      }),
    } :
    isHeavy ? generateHeavyRequestBody(id) : generateRandomRequestBody(id);
  
  logger.info(`Compressing video ${id}...`, { body: requestBody.body });
  const startTime = performance.now();
  const { result, error } = await asyncTryCatch(() => fetch(`${BASE_URL}/video/compress/`, requestBody));
  const endTime = performance.now();
  if (error) {
    logger.error(`Error compressing video ${id}`, { error });
    return;
  } else if (!result.ok) {
    logger.error(`Non-OK response from server`, { status: result.status, id });
    return;
  }
  const data = await result.json();
  const durationMs = endTime - startTime;
  const durationSec = durationMs / 1000;
  logger.info(`Video ${id} compressed successfully`, { data, durationSeconds: durationSec.toFixed(2) });
  const extractorPromises = [
    timeExtractor(`${BASE_URL}/video/frames/${id}/`),
    timeExtractor(`${BASE_URL}/metrics/${id}/`),
  ];
  const extractorResults = await Promise.all(extractorPromises);
  const extractorDurationMs = extractorResults.reduce((acc, curr) => acc + curr, 0);
  const extractorDurationSec = extractorDurationMs / 1000;
  logger.info(`Extractor results`, { extractorResults, extractorDurationSeconds: extractorDurationSec.toFixed(2) });
  return {
    id, compressionDurationSeconds: durationSec.toFixed(2), framesExtractionDurationSeconds: extractorResults[0], metricsExtractionDurationSeconds: extractorResults[1], macroblocksExtractionDurationSeconds: extractorResults[2],
  }
}

async function main() {
  const CONCURRENT_VIDEO_COUNT = parseInt(process.argv[2]) || 30;
  const { result, error } = await asyncTryCatch(() => fetch(`${BASE_URL}/video/example/`));
  if (error) {
    logger.error(`Error getting video ids`, { error });
    return;
  }
  const data = await result.json();
  const videoIds = data.videoIds.map(({ id }) => id);
  logger.info(`Got ${videoIds.length} video ids`, { videoIds });
  logger.info(`Compressing ${CONCURRENT_VIDEO_COUNT} videos concurrently...`);
  const startTime = performance.now();
  const promises = Array.from({ length: CONCURRENT_VIDEO_COUNT }, async () => {
    const videoId = choice(videoIds);
    const result = await compressVideo(videoId);
    await new Promise(resolve => setTimeout(resolve, 20000));
    return result;
  });
  const results = await Promise.all(promises);
  const endTime = performance.now();
  const durationMs = endTime - startTime;
  const durationSec = durationMs / 1000;
  logger.info(`All videos compressed successfully`, { durationSeconds: durationSec.toFixed(2) });
  logger.info(`Results`, { results });
}

main();